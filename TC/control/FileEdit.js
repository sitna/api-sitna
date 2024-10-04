import TC from '../../TC';
import Consts from '../Consts';
import WebComponentControl from './WebComponentControl';
import WorkLayerManager from './WorkLayerManager';
import Edit from './Edit';
import Geometry from '../Geometry';
import Util from '../Util';
import filter from '../filter';
import Toggle from '../../SITNA/ui/Toggle';
import Layer from '../../SITNA/layer/Layer';
import Point from '../../SITNA/feature/Point';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import '../../SITNA/feature/Marker';
import Polyline from '../../SITNA/feature/Polyline';
import Polygon from '../../SITNA/feature/Polygon';
import '../../SITNA/feature/MultiPoint';
import '../../SITNA/feature/MultiMarker';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';
import { FieldNameError } from '../../SITNA/format/BinaryFormat';

TC.control = TC.control || {};
TC.Geometry = Geometry;
TC.filter = filter;

const editedLayers = new Set();
window.addEventListener('beforeunload', function onBeforeunload(e) {
    if (editedLayers.size > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
}, { capture: true });

const elementName = 'sitna-file-edit';

class FileEdit extends WebComponentControl {

    TITLE_SEPARATOR = ' › ';
    #userPreferences = new WeakMap();

    constructor() {
        super(...arguments);

        const self = this;
        self.initProperty('snapping');

        self.layer = null;
    }

    static get observedAttributes() {
        return ['stylable'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'stylable') {
            self.#onStylableChange();
        }
        if (name == 'snapping') {
            self.#onSnappingChange();
        }
    }

    get stylable() {
        return this.hasAttribute('stylable');
    }

    set stylable(value) {
        this.toggleAttribute('stylable', !!value);
    }

    async #onStylableChange() {
        const self = this;
        const editControl = await self.getEditControl();
        editControl.stylable = self.stylable;
    }

    get snapping() {
        return this.hasAttribute('snapping');
    }

    set snapping(value) {
        this.toggleAttribute('snapping', !!value);
    }

    async #onSnappingChange() {
        const self = this;
        const snapping = self.snapping;
        (await self.getEditControl()).snapping = snapping;
    }

    async register(map) {
        const self = this;
        const result = await super.register.call(self, map);

        self.editControl = await self.getEditControl();
        if (self.editControl) {
            self.editControl.styles = self.options.styles;
        }

        map
            .on(Consts.event.RESULTSPANELCLOSE, function (e) {
                if (e.control === self.panel) {
                    self.closeEditSession();
                }
            })
            .on(Consts.event.LAYERREMOVE, function (e) {
                self.markAsSaved(e.layer);
            })
            .on(Consts.event.LAYERREMOVE + ' ' + Consts.event.FEATURESCLEAR, function (e) {
                self.getLayer().then(function (ownLayer) {
                    if (e.layer === ownLayer) {
                        self.closeEditSession();
                    }
                });
            })
            .on(Consts.event.FEATUREADD, function (e) {
                self.getLayer().then(function (ownLayer) {
                    if (e.layer === ownLayer) {
                        const firstFeature = e.layer.features[0];
                        if (firstFeature !== e.feature) {
                            e.feature.folders = firstFeature?.folders?.slice();
                            e.feature.wrap.feature._folders = e.feature.folders;
                        }
                    }
                });
            })
            .on(Consts.event.FEATUREADD + ' ' + Consts.event.FEATUREREMOVE, function (e) {
                self.getLayer().then(function (ownLayer) {
                    if (e.layer === ownLayer) {
                        if (!editedLayers.has(e.layer)) {
                            editedLayers.add(e.layer);
                        }
                    }
                });
            });

        const editCtlPromise = self.getEditControl();
        editCtlPromise.then(editCtl => {
            editCtl.on(Consts.event.FEATUREMODIFY + ' ' + Consts.event.DRAWEND, function (e) {
                if (e.feature.layer && !editedLayers.has(e.feature.layer)) {
                    editedLayers.add(e.feature.layer);
                }
            });
        });

        map.ready(function () {
            self.getCallerControls().forEach((ctl) => self.registerTool(ctl));
        });
        return result;
    }

    getCallerControls() {
        if (this.options.caller) {
            return [this.options.caller];
        }
        return this.map.getControlsByClass(WorkLayerManager);
    }

    registerTool(ctl) {
        const self = this;
        if (ctl.options.fileEditing) {

            const editIconText = Util.getTextFromCssVar('--icon-edit', ctl.div);

            if (ctl instanceof WorkLayerManager) {
                ctl.addItemTool({
                    renderFn: function (container, layerId) {
                        const layer = self.map.getLayer(layerId);
                        if (layer?.type !== Consts.layerType.VECTOR) {
                            return;
                        }
                        const className = self.CLASS + '-btn-edit';
                        let checkbox = container.querySelector('sitna-toggle.' + className);
                        if (!checkbox) {
                            const text = self.getLocaleString('editFeatures');
                            checkbox = new Toggle();
                            checkbox.text = text;
                            checkbox.checkedIconText = editIconText;
                            checkbox.uncheckedIconText = editIconText;
                            checkbox.dataset.layerId = layerId;
                        }
                        checkbox.disabled = layer.state === Layer.state.LOADING;
                        return checkbox;
                    },
                    updateEvents: [Consts.event.BEFORELAYERUPDATE, Consts.event.LAYERUPDATE, Consts.event.CONTROLACTIVATE, Consts.event.CONTROLDEACTIVATE],
                    updateFn: function (_e) {
                        const checkbox = this;
                        const layer = self.map.getLayer(checkbox.dataset.layerId);
                        self.getLayer().then(function (ownLayer) {
                            checkbox.checked = ownLayer === layer;
                        });
                        checkbox.disabled = !layer || layer.state === Layer.state.LOADING;
                    },
                    actionFn: function () {
                        const checkbox = this;
                        const layer = self.map.getLayer(checkbox.dataset.layerId);
                        if (!layer.isRaster()) {
                            self.closeEditSession();
                            if (checkbox.checked) {
                                self.setLayer(layer).then(() => {
                                    self.openEditSession();
                                });
                            }
                        }
                    }
                });
            }
        }
    }

    async loadTemplates() {
        const panelTemplatePromise = import('../templates/tc-ctl-fedit.mjs');
        this.template = (await panelTemplatePromise).default;
    }

    async render(callback) {
        const self = this;
        const includeSaveAsButton = !!window.showSaveFilePicker;

        await self.renderData({
            editControlId: self.getUID(),
            stylable: self.stylable,
            snapping: self.snapping,
            includeSaveAs: includeSaveAsButton
        });
        if (self.map) {
            const panel = await self.map.addResultsPanel({
                resize: false,
                content: 'table',
                titles: {
                    main: self.getLocaleString('editFeatures')
                }
            });
            self.panel = panel;
            self.panel.div.querySelector('.' + self.panel.CLASS + '-info').insertAdjacentElement('beforeend', self);
            self.saveButton = self.panel.div.querySelector(`.${self.CLASS}-actions sitna-button.${self.CLASS}-btn-save`);
            if (includeSaveAsButton) {
                self.saveAsButton = self.panel.div.querySelector(`.${self.CLASS}-actions sitna-button.${self.CLASS}-btn-saveas`);
            }

            const editControl = await self.getEditControl();
            editControl.addEventListener(Edit.event.MODECHANGE, async function (e) {
                const featureTypeMetadata = await editControl.layer?.getFeatureTypeMetadata();
                const geometryType = featureTypeMetadata?.geometries?.[0].type;
                if (geometryType) {
                    const userPreferences = self.#getUserPreferences(editControl.layer);
                    if (!userPreferences.allowOtherGeometryTypes) {
                        let geometryTypeConflict = false;
                        const mode = this.mode;
                        switch (mode) {
                            case Edit.mode.ADDPOINT:
                                if (geometryType !== Consts.geom.GEOMETRY &&
                                    geometryType !== Consts.geom.POINT &&
                                    geometryType !== Consts.geom.MULTIPOINT) {
                                    geometryTypeConflict = true;
                                }
                                break;
                            case Edit.mode.ADDLINE:
                                if (geometryType !== Consts.geom.GEOMETRY &&
                                    geometryType !== Consts.geom.POLYLINE &&
                                    geometryType !== Consts.geom.MULTIPOLYLINE) {
                                    geometryTypeConflict = true;
                                }
                                break;
                            case Edit.mode.ADDPOLYGON:
                                if (geometryType !== Consts.geom.GEOMETRY &&
                                    geometryType !== Consts.geom.POLYGON &&
                                    geometryType !== Consts.geom.MULTIPOLYGON) {
                                    geometryTypeConflict = true;
                                }
                                break;
                            default:
                                break;
                        }
                        if (geometryTypeConflict) {
                            TC.confirm(self.getLocaleString('geometryTypeNotAllowed.warning'),
                                () => {
                                    self.#setUserPreferences(editControl.layer, { allowOtherGeometryTypes: true });
                                    featureTypeMetadata.geometryType = null;
                                    editControl.layer.setFeatureTypeMetadata(featureTypeMetadata);
                                },
                                () => {
                                    editControl.mode = e.detail.oldMode;
                                }
                            );
                        }
                    }
                }
            });
        }

        self.addUIEventListeners();

        if (Util.isFunction(callback)) {
            callback();
        }
    }

    addUIEventListeners() {
        const self = this;
        self.saveButton?.addEventListener(Consts.event.CLICK, function (_e) {
            self.getEditControl().then(function (editControl) {
                editControl.getModifyControl().then(function (modifyControl) {
                    modifyControl.unselectFeatures(modifyControl.getSelectedFeatures());
                    self.save();
                });
            });
        }, { passive: true });

        self.saveAsButton?.addEventListener(Consts.event.CLICK, function (_e) {
            self.getEditControl().then(function (editControl) {
                editControl.getModifyControl().then(function (modifyControl) {
                    modifyControl.unselectFeatures(modifyControl.getSelectedFeatures());
                    self.save({ showDialog: true });
                });
            });
        }, { passive: true });

        return self;
    }

    async getEditControl() {
        const self = this;
        await self.renderPromise();
        return self.panel?.div.querySelector(`.${self.CLASS}-edit sitna-edit`);
    }

    async openEditSession(options = {}) {
        const self = this;
        const layer = await self.getLayer();
        await self.renderPromise();
        const editControl = await self.getEditControl();

        const setDrawMode = function (ctl, geometryName, hasSimple, hasComplex) {
            if (hasSimple) {
                ctl.setMode(Consts.geom[geometryName]);
            }
            else if (hasComplex) {
                ctl.setMode(Consts.geom['MULTI' + geometryName]);
            }
        }

        const pointControl = await editControl.getPointDrawControl();
        const hasPoint = layer.features.some(f => f instanceof Point);
        const hasMultiPoint = layer.features.some(f => f instanceof MultiPoint);
        setDrawMode(pointControl, 'POINT', hasPoint, hasMultiPoint);

        const lineControl = await editControl.getLineDrawControl();
        const hasPolyline = layer.features.some(f => f instanceof Polyline);
        const hasMultiPolyline = layer.features.some(f => f instanceof MultiPolyline);
        setDrawMode(lineControl, 'POLYLINE', hasPolyline, hasMultiPolyline);
        if (options?.extensibleSketch) {
            // OpenLayers tiene la limitación de solamente permitir 
            // extender LineStrings.
            if (hasPolyline && hasMultiPolyline) {
                TC.Error('extensibleSketch option is not possible on this file');
                return;
            }
            lineControl.extensibleSketch = options?.extensibleSketch;
        }

        const polygonControl = await editControl.getPolygonDrawControl();
        const hasPolygon = layer.features.some(f => f instanceof Polygon);
        const hasMultiPolygon = layer.features.some(f => f instanceof MultiPolygon);
        setDrawMode(polygonControl, 'POLYGON', hasPolygon, hasMultiPolygon);

        editControl.setModes(options.modes);
        self.stylable = options?.stylable ?? true;
        self.#setSaveButtonState();
        self.panel.open();
    }

    closeEditSession() {
        const self = this;
        if (self.editControl) {
            self.editControl.setLayer(null);
        }
        if (self.panel && !self.panel.div.classList.contains(Consts.classes.HIDDEN)) {
            self.panel.close();
        }
    }

    setLayer(layer) {
        const self = this;
        if (self.editControl) {
            self.editControl.setLayer(layer);
            return Promise.resolve();
        }
        return Promise.reject(new Error('Edit control not initialized'));
    }

    async getLayer() {
        return await (await this.getEditControl()).getLayer();
    }

    isStylable(layer) {
        const name = layer._fileHandle?.name;
        return !name || name.endsWith('.kml') || name.endsWith('.kmz');
    }

    async save(options = {}) {
        const self = this;
        const layer = options.layer || await self.getLayer();
        let endFn;
        let filterFn;
        let fileName;
        let fileSystemFileName;
        let format;
        let features;
        let permission;
        let fileHandle;
        let oldFileHandle;
        const cleanEditedLayerList = async function () {
            const filteredLayers = await filterFn(self.map.workLayers);
            filteredLayers.forEach(l => editedLayers.delete(l));
        };
        if (layer._fileHandle) {
            // Con File System Access API: guardamos archivo
            oldFileHandle = layer._fileHandle;
            fileHandle = oldFileHandle;
            fileName = layer.file;
            fileSystemFileName = layer.fileSystemFile;
            filterFn = async function (layers) {
                const results = await Promise.all(layers.map(l => l._fileHandle?.isSameEntry(oldFileHandle)));
                return layers.filter((_l, idx) => results[idx]);
            };
            const getPermission = async function (handle) {
                const permissionDescriptor = { mode: 'readwrite' };
                let result = await handle.queryPermission(permissionDescriptor);
                if (result !== 'granted') {
                    result = await handle.requestPermission(permissionDescriptor);
                }
                return result;
            };
            const getLayerPermission = async function (layer) {
                let permission = await getPermission(layer._fileHandle);
                if (layer._additionalFileHandles?.length) {
                    for await (let p of layer._additionalFileHandles.map(h => getPermission(h))) {
                        if (p !== 'granted') {
                            permission = p;
                        }
                    }
                }
                return permission;
            }
            if (!options.showDialog) {
                // El fileHandle no ha cambiado. 
                // Pedimos ahora permiso porque estamos en una ruta
                // directa desde la intervención del usuario.
                permission = await getLayerPermission(layer);
            }
            endFn = async function () {
                if (options.showDialog) {
                    if (window.showSaveFilePicker) {
                        const mimeType = Util.getMimeTypeFromUrl(fileHandle.name);
                        const extension = fileHandle.name.substr(fileHandle.name.lastIndexOf('.'));
                        try {
                            fileHandle = await window.showSaveFilePicker({
                                suggestedName: fileHandle.name,
                                types: [{
                                    accept: {
                                        [mimeType]: [extension]
                                    }
                                }]
                            });
                            permission = await getPermission(fileHandle);
                        }
                        catch (e) {
                            console.log(e.message);
                            return;
                        }
                    }
                }
                if (permission === 'granted') {
                    const writeData = async function (handle, data) {
                        let writable;
                        try {
                            writable = await handle.createWritable();
                        }
                        catch (e) {
                            TC.error(self.getLocaleString('fileWrite.error'), [Consts.msgErrorMode.TOAST, Consts.msgErrorMode.CONSOLE]);
                            return;
                        }
                        try {
                            await writable.write(data);
                            await writable.close();
                            return true;
                        }
                        catch (e) {
                            TC.error(self.getLocaleString('fileWrite.error'), [Consts.msgErrorMode.TOAST, Consts.msgErrorMode.CONSOLE]);
                        }
                        return false;
                    };

                    let data;
                    try {
                        data = await self.map.exportFeatures(features, {
                            fileName: fileSystemFileName,
                            format: format
                        });
                    }
                    catch (e) {
                        if (e instanceof FieldNameError) {
                            TC.error(self.getLocaleString('fileWrite.fieldNameError', { name: e.cause }), [Consts.msgErrorMode.TOAST, Consts.msgErrorMode.CONSOLE]);
                        }
                        else {
                            TC.error(e);
                        }
                        return;
                    }

                    let writeOk;
                    if (layer._additionalFileHandles?.length && data.type === 'application/zip') {
                        // Es un archivo múltiple, tengo que extraer los archivos del zip
                        const JSZip = (await import("jszip")).default;
                        const zip = new JSZip();
                        const zipContent = await zip.loadAsync(data);
                        const zippedFiles = new Map();
                        zipContent.forEach(function (fileName, zippedFile) {
                            if (zippedFile.dir) {
                                return;
                            }
                            zippedFiles.set(fileName, zippedFile);
                        });
                        const handles = [fileHandle, ...layer._additionalFileHandles];
                        for (let [fileName, zippedFile] of zippedFiles.entries()) {
                            const handle = handles.find(h => h.name === fileName);
                            if (handle) {
                                writeOk = await writeData(handle, await zippedFile.async('blob'));
                                if (!writeOk) {
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        writeOk = await writeData(fileHandle, data);
                    }
                    if (writeOk) {
                        const fileSaveEventData = { fileHandle: fileHandle };
                        if (options.showDialog) {
                            fileSaveEventData.oldFileHandle = oldFileHandle;
                        }
                        await cleanEditedLayerList();
                        const filteredLayers = await filterFn(self.map.workLayers);
                        filteredLayers.forEach(async l => {
                            // Si hemos "guardado como", asignamos el nuevo fileHandle
                            if (options.showDialog) {
                                l._fileHandle = fileHandle;
                                l.file = fileHandle.name;
                                l.title = fileHandle.name;
                                self.map.refreshMapState().then(() => {
                                    self.map.trigger(Consts.event.VECTORUPDATE, {
                                        layer: l
                                    });
                                })
                            }
                        });
                        self.map.trigger(Consts.event.FILESAVE, fileSaveEventData);
                        // Si hemos "guardado como", metemos el nuevo archivo en la lista de archivos recientes
                        if (options.showDialog) {
                            await self.map.addRecentFileEntry({ mainHandle: fileHandle });
                        }
                        self.map.toast(self.getLocaleString('fileSaved'), { type: Consts.msgType.INFO });
                    }
                }
            };
        }
        else {
            // Sin File System Access API: descargamos archivo
            fileSystemFileName = layer.fileSystemFile;
            fileName = fileSystemFileName || layer.file;
            filterFn = async function (layers) {
                return layers.filter(l => layer.fileSystemFile ?
                    l.fileSystemFile === layer.fileSystemFile :
                    l.file === layer.file);
            };
            endFn = async function () {
                const data = await self.map.exportFeatures(features, {
                    fileName: fileName,
                    format: format
                })
                cleanEditedLayerList();
                switch (format) {
                    case Consts.format.SHAPEFILE:
                        Util.downloadBlob(fileName, data);
                        break;
                    case Consts.format.GEOPACKAGE:
                        Util.downloadFile(fileName, "application/geopackage+sqlite3", data);
                        break;
                    case Consts.format.KMZ:
                        Util.downloadBlob(fileName, data);
                        break;
                    default: {
                        const mimeType = Consts.mimeType[format];
                        Util.downloadFile(fileName, mimeType, data);
                        break;
                    }
                }
            };
        }
        if (fileName) {
            format = Util.getFormatFromFileExtension(fileName.substr(fileName.lastIndexOf('.')));
            if (!format) {
                format = Util.getFormatFromFileExtension(layer.file.substr(layer.file.lastIndexOf('.')));
            }
            if (!format) {
                format = Util.getFormatFromFileExtension(layer.fileSystemFile.substr(layer.fileSystemFile.lastIndexOf('.')));
            }
            const filteredLayers = await filterFn(self.map.workLayers);
            features = filteredLayers
                .map(l => l.features)
                .flat();
            const siblings = filteredLayers.filter(l => l !== layer);
            if (siblings.length) {
                TC.confirm(self.getLocaleString("fileSave.otherLayers.confirm", {
                    layerList: siblings.map(l => {
                        if (l.features.length) {
                            return l.features[0].getPath().join(self.TITLE_SEPARATOR);
                        }
                        return l.title;
                    }).join(', ')
                }), endFn);
            }
            else {
                endFn();
            }
        }
    }

    #getUserPreferences(layer) {
        return this.#userPreferences.get(layer) || {};
    }

    #setUserPreferences(layer, obj) {
        const preferences = this.#getUserPreferences(layer);
        this.#userPreferences.set(layer, { ...preferences, ...obj });
    }

    async markAsSaved(layer) {
        const l = layer || await self.getLayer();
        editedLayers.delete(l);
    }

    async #setSaveButtonState() {
        const self = this;
        const layer = await self.getLayer();
        const isDisabled = !layer || !((layer._fileHandle && !layer._additionalFileHandles?.length) || layer.fileSystemFile || layer.file);
        const isSaveAsDisabled = isDisabled || layer._additionalFileHandles?.length;
        self.saveButton.disabled = isDisabled;
        if (self.saveAsButton) {
            self.saveAsButton.disabled = isSaveAsDisabled;
        }
    }
}

FileEdit.prototype.CLASS = 'tc-ctl-fedit';
customElements.get(elementName) || customElements.define(elementName, FileEdit);
TC.control.FileEdit = FileEdit;
export default FileEdit;
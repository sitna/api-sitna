import TC from '../../TC';
import Consts from '../Consts';
import WebComponentControl from './WebComponentControl';
import Edit from './Edit';
import Geometry from '../Geometry';
import Util from '../Util';
import filter from '../filter';
import Toggle from '../../SITNA/ui/Toggle';
import Point from '../../SITNA/feature/Point';
import '../../SITNA/feature/Marker';
import Polyline from '../../SITNA/feature/Polyline';
import '../../SITNA/feature/Polygon';
import '../../SITNA/feature/MultiPoint';
import '../../SITNA/feature/MultiMarker';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import '../../SITNA/feature/MultiPolygon';

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

    getClassName() {
        return 'tc-ctl-fedit';
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
            .on(Consts.event.LAYERREMOVE + ' ' + Consts.event.FEATURESCLEAR, function (e) {
                editedLayers.delete(e.layer);
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
            if (self.options.caller) {
                self.#registerTool(self.options.caller);
            }
            else {
                map.getControlsByClass(TC.control.WorkLayerManager)
                    .concat(map.getControlsByClass(TC.control.Geolocation))
                    .forEach(function (ctl) {
                        self.#registerTool(ctl);
                    });
            }
        });
        return result;
    }

    #registerTool(ctl) {
        const self = this;
        if (ctl.options.fileEditing) {

            // Sacamos el carácter unicode de la variable CSS
            let editIconText;
            const editIconUcodeString = getComputedStyle(document.querySelector(':root'))
                .getPropertyValue('--icon-edit');
            const match = editIconUcodeString.match(/\\([a-f0-9]+)/i);
            if (match) {
                editIconText = String.fromCharCode(parseInt(match[1], 16));
            }
            else {
                editIconText = editIconUcodeString.replace(/['"]/g, '');
            }


            if (ctl instanceof TC.control.WorkLayerManager) {
                ctl.addItemTool({
                    renderFn: function (container, layerId) {
                        const layer = self.map.getLayer(layerId);
                        if (layer.type !== Consts.layerType.VECTOR) {
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
                        return checkbox;
                    },
                    updateEvents: [Consts.event.CONTROLACTIVATE, Consts.event.CONTROLDEACTIVATE],
                    updateFn: function (_e) {
                        const checkbox = this;
                        const layer = self.map.getLayer(checkbox.dataset.layerId);
                        self.getLayer().then(function (ownLayer) {
                            checkbox.checked = ownLayer === layer;
                        });
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
            else if (ctl instanceof TC.control.Geolocation) {
                const editCtlPromise = self.getEditControl();
                editCtlPromise.then(function (editCtl) {
                    editCtl.on(Consts.event.DRAWEND + ' ' + Consts.event.FEATUREMODIFY, function (e) {
                        if (e.feature.layer === ctl.trackLayer) {
                            if (e.feature instanceof Polyline || e.feature instanceof MultiPolyline) {
                                ctl.updateEndMarkers();
                                const selectedTrackItem = ctl.getSelectedTrackItem();
                                if (selectedTrackItem) {
                                    ctl.displayTrackProfile(selectedTrackItem, { forceRefresh: true });
                                }
                            }
                        }
                    });
                    editCtl.on(Consts.event.DRAWEND, function (e) {
                        if (e.feature.layer === ctl.trackLayer) {
                            if (e.feature instanceof Point) {
                                e.feature.setData({ name: '' }); // Atributo necesario en un waypoint
                                const style = e.feature.getStyle() || {};
                                style.label = ctl.trackLayer.styles?.point?.label;
                                e.feature.setStyle(style);
                            }
                        }
                    });
                    editCtl.getLineDrawControl().then(function (lineCtl) {
                        lineCtl.on(Consts.event.POINT + ' ' + Consts.event.DRAWUNDO +
                            ' ' + Consts.event.DRAWREDO + ' ' + Consts.event.DRAWCANCEL, function (_e) {
                                ctl.displayTrackProfile(ctl.getSelectedTrackItem(), {
                                    forceRefresh: true,
                                    feature: lineCtl.wrap.getSketch()
                                });
                            });
                    });
                });

                ctl.addItemTool({
                    renderFn: function (container) {
                        const className = self.CLASS + '-btn-edit';
                        let checkbox = container.querySelector('sitna-toggle.' + className);
                        if (!checkbox) {
                            const text = self.getLocaleString('editTrack');
                            checkbox = new Toggle();
                            checkbox.text = text;
                            checkbox.checkedIconText = editIconText;
                            checkbox.uncheckedIconText = editIconText;
                            self.getLayer().then(function (ownLayer) {
                                checkbox.checked = ownLayer === ctl.trackLayer;
                            });
                        }
                        return checkbox;
                    },
                    updateEvents: [Consts.event.CONTROLACTIVATE, Consts.event.CONTROLDEACTIVATE, , Consts.event.LAYERUPDATE],
                    updateFn: function (_e) {
                        const checkbox = this;
                        self.getLayer().then(function (ownLayer) {
                            checkbox.checked = ownLayer === ctl.trackLayer;
                        });
                    },
                    actionFn: function () {
                        const checkbox = this;
                        const openSessionFn = async function () {
                            self.closeEditSession();
                            await self.setLayer(ctl.trackLayer);
                            self.openEditSession({
                                stylable: false,
                                extensibleSketch: true, // Permitimos prolongar un track
                                modes: [
                                    Edit.mode.MODIFY,
                                    Edit.mode.ADDPOINT,
                                    Edit.mode.ADDLINE
                                ]
                            });
                        };
                        if (checkbox.checked) {
                            const hasElevations = ctl.trackLayer.features.some(f => f.getGeometryStride() > 2);
                            if (hasElevations) {
                                TC.confirm(self.getLocaleString('elevationsWillBeRequested.confirm'),
                                    openSessionFn,
                                    () => checkbox.checked = !checkbox.checked);
                            }
                            else {
                                openSessionFn();
                            }
                        }
                        else {
                            self.closeEditSession();
                        }
                    }
                });


                // Añadimos código para impedir segmentos separados en la ruta
                editCtlPromise.then(editCtl => {
                    editCtl.getLineDrawControl().then(lineDrawCtl => {
                        lineDrawCtl.on(Consts.event.DRAWSTART, function (e) {
                            if (lineDrawCtl.layer === ctl.trackLayer &&
                                !e.extending &&
                                ctl.trackLayer.features.some(f => f instanceof Polyline || f instanceof MultiPolyline)) {
                                // Cancelamos dibujo y avisamos
                                lineDrawCtl.new();
                                self.map.toast(self.getLocaleString('cannotAddSeparateLines.warning'), {
                                    type: Consts.msgType.WARNING
                                });
                            }
                        });
                    });
                });
            }
        }
    }

    async loadTemplates() {
        const self = this;
        const panelTemplatePromise = import('../templates/tc-ctl-fedit.mjs');
        const template = {};
        template[self.CLASS] = (await panelTemplatePromise).default;
        self.template = template;
    }

    async render(callback) {
        const self = this;
        const includeSaveAsButton = !!window.showSaveFilePicker;
        return self._set1stRenderPromise(new Promise(function (resolve, _reject) {
            self.renderData({
                editControlId: self.getUID(),
                stylable: self.stylable,
                snapping: self.snapping,
                includeSaveAs: includeSaveAsButton
            }, function () {
                if (self.map) {
                    self.map.addResultsPanel({
                        resize: false,
                        content: 'table',
                        titles: {
                            main: self.getLocaleString('editFeatures')
                        }
                    }).then(panel => {
                        self.panel = panel;
                        self.panel.div.querySelector('.' + self.panel.CLASS + '-info').insertAdjacentElement('beforeend', self);
                        self.saveButton = self.panel.div.querySelector(`.${self.CLASS}-actions sitna-button.${self.CLASS}-btn-save`);
                        self.saveButton.addEventListener(Consts.event.CLICK, function (_e) {
                            self.getEditControl().then(function (editControl) {
                                editControl.getModifyControl().then(function (modifyControl) {
                                    modifyControl.unselectFeatures(modifyControl.getSelectedFeatures());
                                    self.save();
                                });
                            });
                        }, { passive: true });
                        if (includeSaveAsButton) {
                            self.saveAsButton = self.panel.div.querySelector(`.${self.CLASS}-actions sitna-button.${self.CLASS}-btn-saveas`);
                            self.saveAsButton.addEventListener(Consts.event.CLICK, function (_e) {
                                self.getEditControl().then(function (editControl) {
                                    editControl.getModifyControl().then(function (modifyControl) {
                                        modifyControl.unselectFeatures(modifyControl.getSelectedFeatures());
                                        self.save({ showDialog: true });
                                    });
                                });
                            }, { passive: true });
                        }
                        if (typeof callback === 'function') {
                            callback();
                        }
                        resolve();
                    });
                }
            });
        }));
    }

    async getEditControl() {
        const self = this;
        await self.renderPromise();
        return self.panel?.div.querySelector(`.${self.CLASS}-edit sitna-edit`);
    }

    async openEditSession(options) {
        const self = this;
        const modes = options?.modes;
        await self.renderPromise();
        const layer = await self.getLayer();
        const editControl = await self.getEditControl();
        const lineControl = await editControl.getLineDrawControl();
        if (options?.extensibleSketch) {
            // OpenLayers tiene la limitación de solamente permitir 
            // extender LineStrings.
            let hasPolyline = layer.features.some(f => f instanceof Polyline);
            let hasMultiPolyline = layer.features.some(f => f instanceof MultiPolyline);
            if (hasPolyline && hasMultiPolyline) {
                TC.Error('extensibleSketch option is not possible on this file');
                return;
            }
            if (hasPolyline) {
                lineControl.setMode(Consts.geom.POLYLINE);
                lineControl.extensibleSketch = options?.extensibleSketch;
            }
            else if (hasMultiPolyline) {
                lineControl.setMode(Consts.geom.MULTIPOLYLINE);
                lineControl.extensibleSketch = options?.extensibleSketch;
            }
        }
        editControl.constrainModes(modes);
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

    async save(options) {
        const self = this;
        options = options || {};
        const layer = options.layer || await self.getLayer();
        let endFn;
        let filterFn;
        let fileName;
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
            fileName = fileHandle.name;
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
            if (!options.showDialog) {
                // El fileHandle no ha cambiado. 
                // Pedimos ahora permiso porque estamos en una ruta
                // directa desde la intervención del usuario.
                permission = await getPermission(fileHandle);
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
                    const writable = await fileHandle.createWritable();
                    const data = await self.map.exportFeatures(features, {
                        fileName: fileName,
                        format: format
                    });
                    try {
                        await writable.write(data);
                        writable.close();
                        const fileSaveEventData = { fileHandle: fileHandle };
                        if (options.showDialog) {
                            fileSaveEventData.oldFileHandle = oldFileHandle;
                        }
                        self.map.trigger(Consts.event.FILESAVE, fileSaveEventData);
                        await cleanEditedLayerList();
                        // Reasignamos el índice de grupo, porque es un achivo nuevo ahora
                        let groupIndex = 0;
                        const filteredLayers = await filterFn(self.map.workLayers);
                        filteredLayers.forEach(async l => {
                            // Si hemos "guardado como", asignamos el nuevo fileHandle
                            if (options.showDialog) {
                                l._fileHandle = fileHandle;
                            }
                            l.options.groupIndex = groupIndex++;
                        });
                        // Si hemos "guardado como", metemos el nuevo archivo en la lista de archivos recientes
                        if (options.showDialog) {
                            await self.map.addRecentFileEntry({ mainHandle: fileHandle });
                        }
                        self.map.toast(self.getLocaleString('fileSaved'), { type: Consts.msgType.INFO });
                    }
                    catch (e) {
                        TC.error(e.message);
                    }
                }
            };
        }
        else {
            // Sin File System Access API: descargamos archivo
            fileName = layer.options.fileSystemFile || layer.options.file;
            filterFn = async function (layers) {
                return layers.filter(l => layer.options.fileSystemFile ?
                    l.options.fileSystemFile === layer.options.fileSystemFile :
                    l.options.file === layer.options.file);
            };
            endFn = async function () {
                const data = await self.map.exportFeatures(features, {
                    fileName: fileName,
                    format: format
                })
                cleanEditedLayerList();
                switch (format) {
                    case Consts.format.SHAPEFILE:
                        TC.Util.downloadBlob(fileName, data);
                        break;
                    case Consts.format.GEOPACKAGE:
                        TC.Util.downloadFile(fileName, "application/geopackage+sqlite3", data);
                        break;
                    case Consts.format.KMZ:
                        TC.Util.downloadBlob(fileName, data);
                        break;
                    default: {
                        const mimeType = Consts.mimeType[format];
                        TC.Util.downloadFile(fileName, mimeType, data);
                        break;
                    }
                }
            };
        }
        if (fileName) {
            format = TC.Util.getFormatFromFileExtension(fileName.substr(fileName.lastIndexOf('.')));
            if (!format) {
                format = TC.Util.getFormatFromFileExtension(layer.options.file.substr(layer.options.file.lastIndexOf('.')));
            }
            const filteredLayers = await filterFn(self.map.workLayers);
            features = filteredLayers
                .map(l => l.features)
                .flat();
            const siblings = await filterFn(self.map.workLayers.filter(l => l !== layer));
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

    async #setSaveButtonState() {
        const self = this;
        const layer = await self.getLayer();
        const isDisabled = !layer || !((layer._fileHandle && !layer._additionaFileHandles) || layer.options.fileSystemFile || layer.options.file);
        self.saveButton.disabled = isDisabled;
        if (self.saveAsButton) {
            self.saveAsButton.disabled = isDisabled;
        }
    }
}
customElements.get(elementName) || customElements.define(elementName, FileEdit);
TC.control.FileEdit = FileEdit;
export default FileEdit;
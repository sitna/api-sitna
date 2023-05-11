import TC from '../../TC';
import Consts from '../Consts';
import FileImport from './FileImport';
import Edit from './Edit';
import Geometry from '../Geometry';
import Util from '../Util';
import Vector from '../../SITNA/layer/Vector';
import filter from '../filter';
import Toggle from '../../SITNA/ui/Toggle';
import Point from '../../SITNA/feature/Point';
import Marker from '../../SITNA/feature/Marker';
import Polyline from '../../SITNA/feature/Polyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import MultiMarker from '../../SITNA/feature/MultiMarker';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';

TC.control = TC.control || {};
TC.Geometry = Geometry;
TC.layer = TC.layer || {};
TC.layer.Vector = Vector;
TC.filter = filter;

const editedLayers = new Set();
window.addEventListener('beforeunload', function onBeforeunload(e) {
    if (editedLayers.size > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
}, { capture: true });

const elementName = 'sitna-file-edit';

class FileEdit extends FileImport {

    TITLE_SEPARATOR = ' › ';
    #initialStyles;
    #previousStyles = new WeakMap();

    constructor() {
        super(...arguments);

        const self = this;

        self.layer = null;
        self.#initialStyles = self.options.styles || {
            point: {
                fillColor: "#0000aa",
                fillOpacity: 0.1,
                strokeColor: "#0000aa",
                strokeWidth: 2,
                strokeOpacity: 1,
                radius: 6
            },
            line: {
                strokeColor: "#0000aa",
                strokeWidth: 2,
                strokeOpacity: 1
            },
            polygon: {
                fillColor: "#0000aa",
                fillOpacity: 0.1,
                strokeColor: "#0000aa",
                strokeWidth: 2,
                strokeOpacity: 1
            }
        };
        self.styles = self.#initialStyles;
    }

    getClassName() {
        return 'tc-ctl-fedit';
    }

    async register(map) {
        const self = this;
        const result = await super.register(map);

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

        map.ready(function () {
            map.getControlsByClass(TC.control.WorkLayerManager).forEach(function (ctl) {
                ctl.addItemTool({
                    renderFn: function (container, layerId) {
                        const layer = map.getLayer(layerId);
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
                        const layer = map.getLayer(checkbox.dataset.layerId);
                        self.getLayer().then(function (ownLayer) {
                            checkbox.checked = ownLayer === layer;
                        });
                    },
                    actionFn: function () {
                        const checkbox = this;
                        const layer = map.getLayer(checkbox.dataset.layerId);
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
            });
            map.getControlsByClass(TC.control.Geolocation).forEach(function (ctl) {

                editCtlPromise.then(function (editCtl) {
                    editCtl.on(Consts.event.DRAWEND + ' ' + Consts.event.FEATUREMODIFY, function (e) {
                        if (e.feature.layer === ctl.trackLayer) {
                            if (e.feature instanceof Polyline || e.feature instanceof MultiPolyline) {
                                ctl.updateEndMarkers();
                            }
                            ctl.getElevationTool().then(function (elevationTool) {
                                const endFn = function () {
                                    if (e.feature instanceof Polyline || e.feature instanceof MultiPolyline) {
                                        const selectedTrackItem = ctl.getSelectedTrackItem();
                                        if (selectedTrackItem) {
                                            ctl.updateEndMarkers();
                                            ctl.displayTrackProfile(selectedTrackItem, { forceRefresh: true });
                                        }
                                    }
                                };
                                if (elevationTool) {
                                    elevationTool.setGeometry({
                                        features: [e.feature]
                                    }).then(endFn);
                                }
                                else {
                                    endFn();
                                }
                            });
                        }
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
                    updateEvents: [Consts.event.CONTROLACTIVATE, Consts.event.CONTROLDEACTIVATE],
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
                                extensibleSketch: true, // Permitimos prolongar un track
                                modes: [
                                    TC.control.Edit.mode.MODIFY,
                                    TC.control.Edit.mode.ADDPOINT,
                                    TC.control.Edit.mode.ADDLINE
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
                                map.toast(self.getLocaleString('cannotAddSeparateLines.warning'), {
                                    type: Consts.msgType.WARNING
                                });
                            }
                        });
                    });
                });
            });
        });
        return result;
    }

    async loadTemplates() {
        const self = this;
        await super.loadTemplates.call(self);
        const panelTemplatePromise = import('../templates/tc-ctl-fedit-panel.mjs');

        self.template[self.CLASS + '-panel'] = (await panelTemplatePromise).default;
    }

    async render(callback) {
        const self = this;
        await super.render.call(self, callback);
        const includeSaveAsButton = !!window.showSaveFilePicker;
        const html = await self.getRenderedHtml(self.CLASS + '-panel', {
            editControlId: self.getUID(),
            snapping: self.snapping,
            includeSaveAs: includeSaveAsButton
        });
       
        if (!self.panel && self.map) {
            self.panel = await self.map.addResultsPanel({
                resize: false,
                content: 'table',
                titles: {
                    main: self.getLocaleString('editFeatures')
                }
            });
            self.panel.div.querySelector('.' + self.panel.CLASS + '-info').insertAdjacentHTML('beforeend', html);
        }
        if (self.panel) {
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
        }
        self.editControl = await self.getEditControl();
        if (self.editControl) {
            self.editControl.styles = self.options.styles;
        }
        if (typeof callback === 'function') {
            callback();
        }
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
        const pointControl = await editControl.getPointDrawControl();
        const lineControl = await editControl.getLineDrawControl();
        const polygonControl = await editControl.getPolygonDrawControl();
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
        let styles = self.#previousStyles.get(layer);
        if (!styles) {
            if (layer.styles) {
                styles = [{}, self.#initialStyles, layer.styles];
            }
            else {
                styles = [{}, self.#initialStyles].concat(layer
                    .features
                    .map(f => {
                        const style = f.getStyle();
                        if (Object.keys(style).length === 0) {
                            return null;
                        }
                        const styleObj = {};
                        switch (true) {
                            case f instanceof Polyline:
                            case f instanceof MultiPolyline:
                                styleObj.line = style;
                                break;
                            case f instanceof Polygon:
                            case f instanceof MultiPolygon:
                                styleObj.polygon = style;
                                break;
                            case f instanceof Marker:
                            case f instanceof MultiMarker:
                                return null;
                            case f instanceof Point:
                            case f instanceof MultiPoint:
                                styleObj.point = style;
                                break;
                            default:
                                break;
                        }
                        return styleObj;
                    })
                    .filter(style => !!style));
            }
            styles = TC.Util.extend(...styles);
        }
        pointControl.toggleStyleTools(styles.point);
        lineControl.toggleStyleTools(styles.line);
        polygonControl.toggleStyleTools(styles.polygon);
        if (styles.point) {
            pointControl.setStyle(styles.point);
        }
        if (styles.line) {
            lineControl.setStyle(styles.line);
        }
        if (styles.polygon) {
            polygonControl.setStyle(styles.polygon);
            const fillOpacity = styles.polygon.fillOpacity || 0;
            polygonControl.setFillOpacity(fillOpacity);
        }
        editControl.constrainModes(modes);
        self.#setSaveButtonState();
        self.panel.open();
    }

    closeEditSession() {
        const self = this;
        if (self.editControl) {
            if (self.editControl.layer) {
                const previousStyle = {
                    point: self.editControl.pointDrawControl.getStyle(),
                    line: self.editControl.lineDrawControl.getStyle(),
                    polygon: self.editControl.polygonDrawControl.getStyle()
                };
                self.#previousStyles.set(self.editControl.layer, previousStyle);
            }
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
                        const type = self.fileTypes.find(type => type.accept[mimeType]);
                        try {
                            fileHandle = await window.showSaveFilePicker({
                                suggestedName: fileHandle.name,
                                types: [type]
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
                            await self.saveLayerMetadata(l);
                        });
                        // Si hemos "guardado como", metemos el nuevo archivo en la lista de archivos recientes
                        if (options.showDialog) {
                            await self.addRecentFileEntry({ mainHandle: fileHandle });
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
        self.saveButton.disabled = !layer || !((layer._fileHandle && !layer._additionaFileHandles) || layer.options.fileSystemFile || layer.options.file);
    }
}
customElements.get(elementName) || customElements.define(elementName, FileEdit);
export default FileEdit;
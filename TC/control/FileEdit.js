import TC from '../../TC';
import Consts from '../Consts';
import FileImport from './FileImport';
import Geometry from '../Geometry';
import Util from '../Util';
import Vector from '../layer/Vector';
import filter from '../filter';
import Toggle from '../../SITNA/ui/Toggle';

TC.Consts = Consts;
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

class FileEdit extends FileImport {

    TITLE_SEPARATOR = ' › ';

    constructor() {
        super(...arguments);

        const self = this;
        self.CLASS = 'tc-ctl-fedit';
        self.template[self.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-file.hbs";
        self.template[self.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-file-dialog.hbs";
        self.template[self.CLASS + '-panel'] = TC.apiLocation + "TC/templates/tc-ctl-fedit-panel.hbs";

        self.layer = null;
        self.styles = self.options.styles || {
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
    }

    async register(map) {
        const self = this;
        const result = await super.register(map);

        map
            .on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                if (e.control === self.panel) {
                    self.closeEditSession();
                }
            })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
                editedLayers.delete(e.layer);
                if (e.layer === self.getLayer()) {
                    self.closeEditSession();
                }
            })
            .on(TC.Consts.event.FEATUREADD, function (e) {
                if (e.layer === self.getLayer()) {
                    const firstFeature = e.layer.features[0];
                    if (firstFeature !== e.feature) {
                        e.feature.folders = firstFeature.folders.slice();
                        e.feature.wrap.feature._folders = e.feature.folders;
                    }
                }
            })
            .on(TC.Consts.event.FEATUREADD + ' ' + TC.Consts.event.FEATUREREMOVE, function (e) {
                if (e.layer === self.getLayer()) {
                    if (!editedLayers.has(e.layer)) {
                        editedLayers.add(e.layer);
                    }
                }
            });

        self.getEditControl().then(editCtl => {
            editCtl.getModifyControl().then(modifyCtl => {
                modifyCtl.on(TC.Consts.event.FEATUREMODIFY, function (e) {
                    if (!editedLayers.has(e.layer)) {
                        editedLayers.add(e.layer);
                    }
                });
            });
        });

        map.ready(function () {
            map.getControlsByClass(TC.control.WorkLayerManager).forEach(function (ctl) {
                ctl.addItemTool({
                    renderFn: function (container, layerId) {
                        const layer = map.getLayer(layerId);
                        if (layer.type !== TC.Consts.layerType.VECTOR) {
                            return;
                        }
                        const className = self.CLASS + '-btn-edit';
                        let checkbox = container.querySelector('sitna-toggle.' + className);
                        if (!checkbox) {
                            const text = self.getLocaleString('editFeatures');
                            checkbox = new Toggle();
                            checkbox.text = text;
                            checkbox.checkedIconText = getComputedStyle(document.querySelector(':root'))
                                .getPropertyValue('--icon-edit')
                                .replaceAll('"', '');
                            checkbox.uncheckedIconText = checkbox.checkedIconText;
                            checkbox.dataset.layerId = layerId;
                        }
                        return checkbox;
                    },
                    updateEvents: [TC.Consts.event.CONTROLACTIVATE, TC.Consts.event.CONTROLDEACTIVATE],
                    updateFn: function (_e) {
                        const checkbox = this;
                        const layer = map.getLayer(checkbox.dataset.layerId);
                        checkbox.checked = self.getLayer() === layer;
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
        });
        return result;
    }

    async render(callback) {
        const self = this;
        await super.render.call(self, callback);
        const includeSaveAsButton = !!window.showSaveFilePicker;
        const html = await self.getRenderedHtml(self.CLASS + '-panel', { includeSaveAs : includeSaveAsButton });
       
        if (!self.panel) {
            self.panel = await self.map.addResultsPanel({
                resize: false,
                content: 'table',
                titles: {
                    main: self.getLocaleString('editFeatures')
                }
            });
            self.panel.div.querySelector('.' + self.panel.CLASS + '-info').insertAdjacentHTML('beforeend', html);
        }
        self.saveButton = self.panel.div.querySelector(`.${self.CLASS}-actions sitna-button.${self.CLASS}-btn-save`);
        self.saveButton.addEventListener(TC.Consts.event.CLICK, function (_e) {
            self.editControl.modifyControl.unselectFeatures(self.editControl.getSelectedFeatures());
            self.save();
        }, { passive: true });
        if (includeSaveAsButton) {
            self.saveAsButton = self.panel.div.querySelector(`.${self.CLASS}-actions sitna-button.${self.CLASS}-btn-saveas`);
            self.saveAsButton.addEventListener(TC.Consts.event.CLICK, function (_e) {
                self.editControl.modifyControl.unselectFeatures(self.editControl.getSelectedFeatures());
                self.save({ showDialog: true });
            }, { passive: true });
        }
        self._editPromise = self._editPromise || self.map.addControl('edit', {
            id: self.getUID(),
            div: self.panel.div.querySelector(`.${self.CLASS}-edit`),
            layer: false,
            styles: self.styles,
            styling: true,
            snapping: self.options.snapping
        });
        self.editControl = await self._editPromise;
        if (typeof callback === 'function') {
            callback();
        }
    }


    getEditControl() {
        const self = this;
        return self._editPromise || new Promise(function (resolve, _reject) {
            self.renderPromise().then(() => resolve(self.editControl));
        });
    }

    async openEditSession() {
        const self = this;
        await self.renderPromise();
        const layer = self.getLayer();
        const styles = layer
            .features
            .map(f => f.getStyle())
            .filter(s => Object.keys(s).length);
        const editControl = await self.getEditControl();
        const pointControl = await editControl.getPointDrawControl();
        pointControl.toggleStyleTools(styles.length);
        const lineControl = await editControl.getLineDrawControl();
        lineControl.toggleStyleTools(styles.length);
        const polygonControl = await editControl.getPolygonDrawControl();
        polygonControl.toggleStyleTools(styles.length);
        if (styles.length) {
            const style = styles[0];
            if (style.strokeColor) {
                pointControl.setStrokeColor(style.strokeColor);
                lineControl.setStrokeColor(style.strokeColor);
                polygonControl.setStrokeColor(style.strokeColor);
            }
            if (style.strokeWidth) {
                pointControl.setStrokeWidth(style.strokeWidth);
                lineControl.setStrokeWidth(style.strokeWidth);
                polygonControl.setStrokeWidth(style.strokeWidth);
            }
            if (style.fillColor) {
                pointControl.setFillColor(style.fillColor);
                polygonControl.setFillColor(style.fillColor);
            }
            if (style.fillOpacity) {
                pointControl.setFillOpacity(style.fillOpacity);
                polygonControl.setFillOpacity(style.fillOpacity);
            }
        }
        self.panel.open();
    }

    closeEditSession() {
        const self = this;
        if (self.editControl) {
            self.editControl.setLayer(null);
        }
        if (self.panel && !self.panel.div.classList.contains(TC.Consts.classes.HIDDEN)) {
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

    getLayer() {
        const self = this;
        if (self.editControl) {
            return self.editControl.getLayer();
        }
        return null;
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
                const results = await Promise.all(layers.map(l => l._fileHandle && l._fileHandle.isSameEntry(oldFileHandle)));
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
                            await self.addRecentFile(fileHandle);
                        }
                        self.map.toast(self.getLocaleString('fileSaved'), { type: TC.Consts.msgType.INFO });
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
                    case TC.Consts.format.SHAPEFILE:
                        TC.Util.downloadBlob(fileName, data);
                        break;
                    case TC.Consts.format.GEOPACKAGE:
                        TC.Util.downloadFile(fileName, "application/geopackage+sqlite3", data);
                        break;
                    case TC.Consts.format.KMZ:
                        TC.Util.downloadBlob(fileName, data);
                        break;
                    default: {
                        const mimeType = TC.Consts.mimeType[format];
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
}
customElements.define('sitna-file-edit', FileEdit);

export default FileEdit;
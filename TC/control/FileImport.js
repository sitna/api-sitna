import TC from '../../TC';
import Consts from '../Consts';
import WebComponentControl from './WebComponentControl';
import Button from '../../SITNA/ui/Button';
import layerOwner from './layerOwner';
import Util from '../Util';
import localforage from 'localforage';
import Point from '../../SITNA/feature/Point';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';

TC.control = TC.control || {};

const elementName = 'sitna-file-import';

class FileImport extends WebComponentControl {

    #layerMetadataCache = new Map();

    constructor() {
        super(...arguments);

        const self = this;
        self.LAYER_METADATA_STORE_KEY_PREFIX = 'TC.fileLayerMetadata.';

        self._dialogDiv = Util.getDiv(self.options.dialogDiv);
        if (!self.options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }

        self.fileTypes = [
            {
                accept: {
                    [Consts.mimeType.KML]: ['.' + Consts.format.KML]
                }
            },
            {
                accept: {
                    [Consts.mimeType.KMZ]: ['.' + Consts.format.KMZ]
                }
            },
            {
                accept: {
                    [Consts.mimeType.GML]: ['.' + Consts.format.GML, '.' + Consts.format.GML2]
                }
            },
            {
                accept: {
                    [Consts.mimeType.GEOJSON]: ['.' + Consts.format.GEOJSON, '.' + Consts.format.JSON]
                }
            },
            {
                accept: {
                    'text/plain': ['.' + Consts.format.WKT]
                }
            },
            {
                accept: {
                    'text/plain': ['.' + Consts.format.WKB]
                }
            },
            {
                accept: {
                    [Consts.mimeType.ZIP]: ['.zip']
                }
            },
            {
                accept: {
                    [Consts.mimeType.GEOPACKAGE]: ['.' + Consts.format.GEOPACKAGE]
                }
            },
            {
                accept: {
                    [Consts.mimeType.SHAPEFILE]: ['.shp', '.dbf', '.prj', '.cst', '.cpg', '.shx']
                }
            },
            {
                accept: {
                    [Consts.mimeType.GPX]: ['.' + Consts.format.GPX]
                }
            }
        ];

        if (Array.isArray(self.options.formats)) {
            self.formats = self.options.formats;
            const mimeTypes = self.format.map(f => Util.getMimeTypeFromUrl(f));
            self.fileTypes = self.fileTypes.filter(ft => {
                ft.accept.keys.some(key => mimeTypes.includes(key));
            });
        }
        else {
            self.formats = self.fileTypes.reduce((acc, ft) => {
                for (var key in ft.accept) {
                    acc = acc.concat(ft.accept[key].map(ext => ext.substr(1)));
                }
                return acc;
            }, []);
        }

        self.apiAttribution = '';
        self.mainDataAttribution = '';
        self.dataAttributions = [];

        self.exportsState = true;
    }

    register(map) {
        const self = this;
        const result = super.register.call(self, map);
        self.registerLayerAdd();

        if (self.options.enableDragAndDrop) {
            map.wrap.enableDragAndDrop(self.options);
        }

        map._bufferFeatures = [];

        document.addEventListener('paste', async e => {
            if (e.clipboardData.files && e.clipboardData.files.length) {
                let files = e.clipboardData.files;
                if (DataTransferItem.prototype.getAsFileSystemHandle) {
                    // Ruta de File System Access API
                    files = [];
                    for (var i = 0, ii = e.clipboardData.items.length; i < ii; ++i) {
                        const item = e.clipboardData.items[i];
                        const handle = await item.getAsFileSystemHandle();
                        if (handle)files.push(handle);
                    }
                }
                self.loadFiles(files);
            }
            else {
                if (!e.clipboardData.items.length) {
                    map.toast(self.getLocaleString('fileImport.pasteNotSupported'), { type: Consts.msgType.WARNING });
                }
            }
        });
        map
            .on(Consts.event.FEATURESIMPORT, async function (e) {
                const fileName = e.fileName;
                const fileHandle = e.fileHandle;
                const target = e.dropTarget;
                const features = e.features;
                const timeStamp = e.timeStamp;
                const groupIndex = e.groupIndex;
                const fileSystemFile = e.fileSystemFile && e.fileSystemFile.name;

                const projectGeom = function (feature) {
                    const geogCrs = 'EPSG:4326';
                    const geom = feature.geometry;
                    if (geom) {
                        var coordinates;
                        switch (true) {
                            case feature instanceof Point:
                                coordinates = [geom];
                                break;
                            case feature instanceof MultiPoint:
                            case feature instanceof Polyline:
                                coordinates = geom;
                                break;
                            case feature instanceof MultiPolyline:
                            case feature instanceof Polygon:
                                coordinates = geom.flat();
                                break;
                            case feature instanceof MultiPolygon:
                                coordinates = geom.flat(2);
                                break;
                            default:
                                break;
                        }
                        if (coordinates && coordinates.every(function (coord) {
                            return Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90; // Parecen geográficas
                        })) {
                            feature.setCoords(Util.reproject(geom, geogCrs, self.map.crs));
                        }
                    }

                    return feature;
                };
                // Ignoramos los GPX (se supone que los gestionará Geolocation)
                var gpxPattern = '.' + Consts.format.GPX.toLowerCase();
                if (fileName.toLowerCase().indexOf(gpxPattern) === fileName.length - gpxPattern.length ||
                    target && target !== self.map.div && target !== self) {
                    self.renderRecentFileList();
                    return;
                }

                const addLayer = id => {
                    if (!id) {
                        do {
                            id = self.getUID(fileHandle || timeStamp);
                        }
                        while (self.map.getLayer(id));
                    }
                    return map.addLayer({
                        id: id,
                        title: fileName || fileSystemFile,
                        owner: self,
                        type: Consts.layerType.VECTOR,
                        file: fileName,
                        groupIndex: groupIndex,
                        fileSystemFile: fileSystemFile
                    });
                };

                let targetLayers = e.targetLayers || [];
                if (!targetLayers.length) {
                    targetLayers.push(await addLayer());
                }
                for (var i = 0; i < targetLayers.length; i++) {
                    const targetLayer = targetLayers[i];
                    const mapLayer = self.map.getLayer(targetLayer) || await addLayer(targetLayer.id);
                    // Guarda metadatos de la capa extraídos de archivo (por ejemplo, info de tabla de GeoPackage)
                    mapLayer.setFeatureTypeMetadata(e.metadata);
                    const fileMetadata = await self.loadLayerMetadata(mapLayer);
                    if (!fileMetadata || fileMetadata.groupIndex === groupIndex || (!groupIndex && !fileMetadata.groupIndex)) {
                        targetLayers[i] = mapLayer;
                    }
                    else {
                        // Este grupo de entidades no es para esta capa
                        targetLayers[i] = false;
                    }
                }
                targetLayers = targetLayers.filter(tl => tl);

                map._fileDropLoadingIndicator = map.getLoadingIndicator().addWait(map._fileDropLoadingIndicator);

                targetLayers.forEach(async function (layer) {
                    if (fileHandle) {
                        layer._fileHandle = fileHandle;
                        //layer.file = fileHandle.name;
                        layer.fileSystemFile = fileHandle.name;
                        if (e.additionalFileHandles) {
                            layer._additionalFileHandles = e.additionalFileHandles;
                        }
                        else {
                            delete layer._additionalFileHandles;
                        }
                        await self.saveLayerMetadata(layer);
                    }
                    layer._timeStamp = timeStamp;
                    layer.owner = self;
                    self.getLayers().push(layer);

                    const uidPrefix = layer.id + '.';
                    const ids = features.map(f => f.getId());
                    const fixId = function (feature, idx) {
                        const id = feature.getId();
                        // Si está el id en el array de ids sin contar el índice del elemento actual
                        if (ids.filter((_v, i) => i !== idx).includes(id)) {
                            const newId = TC.getUID({
                                prefix: uidPrefix,
                                banlist: ids
                            });
                            ids[idx] = newId;
                            feature.setId(newId);
                        }
                        return feature;
                    };
                    layer.addFeatures(
                        features
                            .map(projectGeom)
                            .map(fixId)
                    )
                        .then(() => self.subtrackPendingFile());

                    if (!e.targetLayer) {
                        map._bufferFeatures = map._bufferFeatures.concat(layer.features);
                    }
                });

                self.renderRecentFileList();
            })
            .on(Consts.event.FEATURESIMPORTERROR, function (e) {
                var dictKey;
                var fileName = e.file.name;
                dictKey = 'fileImport.error.reasonUnknown';
                TC.error(e.message ? self.getLocaleString(e.message) : self.getLocaleString(dictKey, { fileName: fileName }), Consts.msgErrorMode.TOAST);
                var reader = new FileReader();
                reader.onload = function (event) {
                    TC.error("Nombre del archivo: " + fileName + " \n Contenido del archivo: \n\n" + event.target.result, Consts.msgErrorMode.EMAIL, "Error en la subida de un archivo");
                };
                self.subtrackPendingFile();
            })
            //.on(Consts.event.FEATURESIMPORTPARTIAL, function (e) {
            //    self.map.toast(self.getLocaleString("fileImport.partial.problem", { fileName: e.file.name, table: e.table, reason: e.reason }), { type: Consts.msgType.ERROR });
            //})
            .on(Consts.event.FEATURESIMPORTWARN, function (e) {
                self.map.toast(self.getLocaleString("fileImport.geomEmpty", { fileName: e.file.name }), { type: Consts.msgType.WARNING });
            })
            .on(Consts.event.RECENTFILEADD, function (_e) {
                self.renderRecentFileList();
            })
            .on(Consts.event.LAYERADD, function (e) {
                self.loadLayersFromFile([e.layer]);
            })
            .on(Consts.event.LAYERREMOVE, function (e) {
                if (e.layer.owner === self) {
                    self.deleteLayerMetadata(e.layer);
                }
                const ownLayers = self.getLayers();
                const idx = ownLayers.indexOf(e.layer);
                if (idx >= 0) {
                    ownLayers.splice(idx, 1);
                }
            })
            .on(Consts.event.FILESAVE, function (e) {
                self.map.workLayers.forEach(l => {
                    l._fileHandle?.isSameEntry(e.fileHandle).then(_isSameEntry => {
                        self.saveLayerMetadata(l);
                    });
                });
            });

        map.loaded(() => {
            self.loadLayersFromFile(map.workLayers);
        });

        return result;
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-file.mjs');
        const dialogTemplatePromise = import('../templates/tc-ctl-file-dialog.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-dialog'] = (await dialogTemplatePromise).default;
        self.template = template;
    }

    async render() {
        const self = this;

        self._dialogDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-dialog', null);

        await self.renderData({ formats: self.formats });

        self.addUIEventListeners();
        self.renderRecentFileList();
    }

    addUIEventListeners() {
        const self = this;
        const fileInput = self.querySelector('input[type=file]');
        // GLS: Eliminamos el archivo subido, sin ello no podemos subir el mismo archivo seguido varias veces
        fileInput.addEventListener(Consts.event.CLICK, async function (e) {
            const input = this;
            // Envolvemos el input en un form
            const form = document.createElement('form');
            const parent = input.parentElement;
            parent.insertBefore(form, input);
            form.appendChild(input);
            form.reset();
            // Desenvolvemos el input del form
            form.insertAdjacentElement('afterend', input);
            parent.removeChild(form);

            if (Util.isFunction(window.showOpenFilePicker)) {
                e.preventDefault();
                let fileHandles;
                try {
                    fileHandles = await window.showOpenFilePicker({
                        multiple: true
                    });
                }
                catch (e) {
                    if (e instanceof DOMException && window.parent !== window) {
                        // No se permite ejecutar showOpenFilePicker si estamos en un frame con CORS
                        let messageText = self.getLocaleString('cannotOpenFileIfEmbedded');
                        if (self.options.enableDragAndDrop) {
                            messageText += '<br/><br/>' + self.getLocaleString('alternativelyYouCanDropFile');
                        }
                        self.map.toast(messageText, { type: Consts.msgType.WARNING });
                    }
                    else if (e.name !== 'AbortError') {
                        throw e;
                    }
                }
                if (fileHandles) {
                    self.loadFiles(fileHandles);
                }
            }
        });
        fileInput.addEventListener('change', function (e) {
            if (self.map) {
                self.loadFiles(e.target.files);
            }
        });
    }

    loadFiles(files) {
        const self = this;
        self.map.loadFiles(files, { control: self });
        return self;
    }

    async loadLayersFromFile(layers) {
        const self = this;
        // Verificamos si son capas propias y si son de archivo local serializadas
        const ownLayers = layers.filter(l => self.getIdCount(l.id) && !l.options.owner && l.file);
        if (ownLayers.length) {
            const fileHandles = [];
            const idCount = Math.max(...ownLayers.map(l => self.getIdCount(l.id)));
            TC.setUIDStart(idCount + 1, { prefix: self.getId() + '-' });
            const layersMetadata = await Promise.all(ownLayers.map(l => self.loadLayerMetadata(l)));
            ownLayers.forEach((l, idx) => {
                l.options.groupIndex = layersMetadata[idx]?.groupIndex;
            });
            const layerGroups = new Map();
            for (var i = 0; i < layersMetadata.length; i++) {
                const metadata = layersMetadata[i];
                if (metadata?.fileHandle) {
                    let group;
                    for (const [fileHandle, currentGroup] of layerGroups.entries()) {
                        if (await fileHandle.isSameEntry(metadata.fileHandle)) {
                            group = currentGroup;
                            break;
                        }
                    }
                    if (!group) {
                        group = [];
                        layerGroups.set(metadata.fileHandle, group);
                        fileHandles.push(metadata.fileHandle);
                        metadata.fileHandle._siblings = metadata.additionalFileHandles;
                    }
                    group.push(ownLayers[i]);
                }
                else {
                    // Error: no existe el archivo en este navegador, por tanto eliminamos capa
                    const layerToRemove = layers[i];
                    if (self.map.getLayer(layerToRemove)) {
                        self.map.removeLayer(layerToRemove);
                    }
                }
            }
            await self.renderPromise();
            const dialog = self._dialogDiv.querySelector(`.tc-ctl-file-dialog`);
            const title = dialog.querySelector('h3');
            const button = self._dialogDiv.querySelector('sitna-button.tc-ctl-file-dialog-ok');

            const endFn = handles => {
                const mainHandle = handles[0];
                const fileLayers = layerGroups.get(mainHandle);
                fileLayers.forEach((l) => l._fileHandle = mainHandle);
                self.map.loadFiles(handles, {
                    layers: fileLayers,
                    target: self
                });
            };

            for (const fileHandle of layerGroups.keys()) {
                let fileHandles = [fileHandle];
                const additionalFileHandles = fileHandle._siblings;
                if (additionalFileHandles) {
                    fileHandles = fileHandles.concat(additionalFileHandles);
                }

                const permissions = [];
                for await (let permission of fileHandles.map(h => h.queryPermission())) {
                    permissions.push(permission);
                }
                let promptRequired = false;
                for (var j = 0; j < permissions.length; j++) {
                    let permission = permissions[j];
                    if (permission === 'prompt') {
                        promptRequired = true;
                        const pendingFileHandle = fileHandles[j];
                        if (title.innerHTML.length) {
                            const separator = ',<br>';
                            const files = title.innerHTML.split(separator);
                            if (!files.includes(pendingFileHandle.name)) {
                                title.innerHTML = title.innerHTML + separator + pendingFileHandle.name;
                            }
                        }
                        else {
                            title.innerHTML = pendingFileHandle.name;
                        }
                    }
                }
                const isPermissionGranted = (p) => p === 'granted';
                if (promptRequired) {
                    const requestPermissions = async function () {
                        for (var k = 0; k < permissions.length; k++) {
                            permissions[k] = await fileHandles[k].requestPermission();
                        }
                        if (permissions.every(isPermissionGranted)) {
                            endFn(fileHandles);
                        }
                        else {
                            // No hemos obtenido permiso, la capa se va a quedar vacía, así que la eliminamos
                            const layersToRemove = layerGroups.get(fileHandle);
                            layersToRemove.forEach(l => self.map.removeLayer(l));
                        }
                    }
                    const onCloseClick = async function (_e) {
                        await requestPermissions();
                        title.innerHTML = '';
                        button.removeEventListener('click', onCloseClick);
                        Util.closeModal();
                    };
                    if (navigator.userActivation?.isActive) {
                        requestPermissions();
                    }
                    else {
                        Util.showModal(dialog, {
                            closeCallback: onCloseClick
                        });
                        button.addEventListener('click', onCloseClick);
                    }
                }
                else if (permissions.every(isPermissionGranted)) {
                    endFn(fileHandles);
                }
            }
        }
    }

    exportState() {
        const self = this;
        if (self.exportsState && self.getLayers().length) {
            return {
                id: self.getId(),
                layers: self.getLayers().map(function (layer) {
                    const layerState = {
                        title: layer.title,
                        state: Util.extend(layer.exportState(), { path: layer.features?.length ? layer.features[0].getPath() : undefined })
                    };
                    if (layer._fileHandle) {
                        layerState.file = layer._fileHandle.name;
                    }
                    return layerState;
                })
            };
        }
        return null;
    }

    async importState(state) {
        const self = this;
        if (self.map) {
            const layerPromises = [];
            await self.loadLayersFromFile(self.map.workLayers);
            state.layers
                .filter(function (layer) {
                    return !self.map.workLayers.some(l => l.file && layer.file === l.file);
                })
                .forEach(function (layerData) {
                    layerPromises.push(self.map.addLayer({
                        id: self.getUID(),
                        title: layerData.title,
                        owner: self,
                        type: Consts.layerType.VECTOR
                    }));
                });

            const layers = await Promise.all(layerPromises);
            for (var i = 0, len = layers.length; i < len; i++) {
                const layer = layers[i];
                const ii = i;
                layer.importState(state.layers[i].state).then(function () {
                    for (var j = 0; j < layer.features.length; j++) {
                        layer.features[j].folders = state.layers[ii].state.path;
                    }
                });
                self.getLayers().push(layer);
            }
        }
    }

    async saveLayerMetadata(layer) {
        const self = this;
        const storageItem = {
            fileHandle: layer._fileHandle,
            groupIndex: layer.options.groupIndex
        };
        if (layer._additionalFileHandles) {
            storageItem.additionalFileHandles = layer._additionalFileHandles;
        }
        self.#layerMetadataCache.set(layer.id, storageItem);
        return await localforage
            .setItem(self.LAYER_METADATA_STORE_KEY_PREFIX + self.map.id + '-' + layer.id, storageItem)
            .catch(e => console.warn(e));
    }

    async loadLayerMetadata(layer) {
        const self = this;
        let metadata = await localforage
            .getItem(self.LAYER_METADATA_STORE_KEY_PREFIX + self.map.id + '-' + layer.id)
            .catch(err => console.warn(err));
        if (metadata) {
            self.#layerMetadataCache.set(layer.id, metadata);
        }
        else {
            metadata = self.#layerMetadataCache.get(layer.id);
        }
        return metadata;
    }

    deleteLayerMetadata(layer) {
        const self = this;
        localforage.removeItem(self.LAYER_METADATA_STORE_KEY_PREFIX + self.map.id + '-' + layer.id)
            .catch(function (e) {
                console.warn(e.message);
            });
        return self;
    }

    async addRecentFileEntry(newEntry) {
        const self = this;
        await self.map.addRecentFileEntry(newEntry);
    }

    async removeRecentFileEntry(index) {
        const self = this;
        await self.map.removeRecentFileEntry(index);
        self.renderRecentFileList();
    }

    async renderRecentFileList(fileList) {
        const self = this;
        const onLinkClick = function (e) {
            self.map.loadRecentFileEntry(e.target.dataset.fileIndex);
        };
        const onButtonClick = function (e) {
            self.removeRecentFileEntry(e.target.dataset.fileIndex);
        };
        const list = self.querySelector('.tc-ctl-file-recent');
        if (list) {
            const buttonText = self.getLocaleString('removeFromList');
            const entries = await (fileList ? Promise.resolve(fileList) : (self.map && self.map.loadRecentFiles()) || []);
            list.replaceChildren ? list.replaceChildren() : list.innerHTML="";
            if (entries.length) {
                const li = document.createElement('li');
                const header = document.createElement('h3');
                header.innerHTML = self.getLocaleString('recentFiles');
                li.appendChild(header);
                list.appendChild(li);
            }
            entries.forEach((entry, index) => {
                const li = document.createElement('li');
                const link = document.createElement('sitna-button');
                link.dataset.fileIndex = index;
                link.addEventListener(Consts.event.CLICK, onLinkClick);
                link.setAttribute('variant', Button.variant.LINK);
                // Añadida compatibilidad hacia atrás (antes no había propiedad mainHandle)
                link.setAttribute('text', entry.mainHandle?.name || entry.name);
                li.appendChild(link);
                const button = document.createElement('sitna-button');
                button.text = buttonText;
                button.dataset.fileIndex = index;
                button.addEventListener(Consts.event.CLICK, onButtonClick);
                button.setAttribute('variant', Button.variant.MINIMAL);
                button.setAttribute('icon', Button.action.CLOSE);
                li.appendChild(button);
                list.appendChild(li);
            });
        }
    }

    subtrackPendingFile() {
        const self = this;
        self.map.dropFilesCounter--;
        if (self.map.dropFilesCounter === 0) {
            self.map.zoomToFeatures(self.map._bufferFeatures);
            self.map._bufferFeatures = [];
            delete self.map.dropFilesCounter;
        }
        var li = self.map.getLoadingIndicator();
        if (li) {
            if (self.map._featureImportWaitId) {
                li.removeWait(self.map._featureImportWaitId);
            }
            if (self.map._fileDropLoadingIndicator) {
                li.removeWait(self.map._fileDropLoadingIndicator);
            }
        }
        return self;
    }
    
    getUID(fileHandleOrTimestamp) {
        const self = this;
        if (fileHandleOrTimestamp) {
            const propertyname = Object.prototype.hasOwnProperty.call(window, "FileSystemFileHandle") ? "_fileHandle" : "_timeStamp";
            const grouped = self.getLayers().reduce((vi, va) => {
                return vi.findByProperty(propertyname, va[propertyname]) &&
                    vi.some(l => /^[\w]*-\d-\d/gi.exec(va.id)[0] === /^[\w]*-\d-\d/gi.exec(l.id)[0]) ? vi : vi.concat(va);
            }, []);
            return TC.getUID({
                prefix: `${self.getId()}-${grouped.filter(l => l[propertyname] != fileHandleOrTimestamp).length + 1}-`
            });
        }
        return TC.getUID({
            prefix: self.getId() + '-'
        });
    }
}

TC.mix(FileImport, layerOwner);

FileImport.prototype.CLASS = 'tc-ctl-file';
customElements.get(elementName) || customElements.define(elementName, FileImport);
TC.control.FileImport = FileImport;
export default FileImport;

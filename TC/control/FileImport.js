import TC from '../../TC';
import Consts from '../Consts';
import WebComponentControl from './WebComponentControl';
import Button from '../../SITNA/ui/Button';
import layerOwner from './layerOwner';
import Util from '../Util';
import localforage from 'localforage';

TC.control = TC.control || {};
TC.Consts = Consts;
TC.Util = Util;

class FileImport extends WebComponentControl {

    constructor() {
        super(...arguments);

        const self = this;
        self.CLASS = 'tc-ctl-file';
        self.LAYER_METADATA_STORE_KEY_PREFIX = 'TC.fileLayerMetadata.';
        self.RECENT_FILES_STORE_KEY_PREFIX = 'TC.fileImportRecent.';
        self.template = {};
        self.template[self.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-file.hbs";
        self.template[self.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-file-dialog.hbs";

        self.recentFileCount = 8;
        self.recentFiles = [];

        self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
        if (!self.options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }

        self.fileTypes = [
            {
                accept: {
                    [TC.Consts.mimeType.KML]: ['.' + TC.Consts.format.KML]
                }
            },
            {
                accept: {
                    [TC.Consts.mimeType.KMZ]: ['.' + TC.Consts.format.KMZ]
                }
            },
            {
                accept: {
                    [TC.Consts.mimeType.GML]: ['.' + TC.Consts.format.GML, '.' + TC.Consts.format.GML2]
                }
            },
            {
                accept: {
                    [TC.Consts.mimeType.GEOJSON]: ['.' + TC.Consts.format.GEOJSON, '.' + TC.Consts.format.JSON]
                }
            },
            {
                accept: {
                    'text/plain': ['.' + TC.Consts.format.WKT]
                }
            },
            {
                accept: {
                    [TC.Consts.mimeType.ZIP]: ['.zip']
                }
            },
            {
                accept: {
                    [TC.Consts.mimeType.GEOPACKAGE]: ['.' + TC.Consts.format.GEOPACKAGE]
                }
            },
            {
                accept: {
                    [TC.Consts.mimeType.SHAPEFILE]: ['.shp', '.dbf', '.prj', '.cst', '.cpg']
                }
            },
            {
                accept: {
                    [TC.Consts.mimeType.GPX]: ['.' + TC.Consts.format.GPX]
                }
            }
        ];

        if (Array.isArray(self.options.formats)) {
            self.formats = self.options.formats;
            const mimeTypes = self.format.map(f => TC.Util.getMimeTypeFromUrl(f));
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
                    map.toast(self.getLocaleString('fileImport.pasteNotSupported'), { type: TC.Consts.msgType.WARNING });
                }
            }
        });
        map
            .on(TC.Consts.event.FEATURESIMPORT, async function (e) {
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
                            case TC.feature.Point && feature instanceof TC.feature.Point:
                                coordinates = [geom];
                                break;
                            case TC.feature.MultiPoint && feature instanceof TC.feature.MultiPoint:
                            case TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                                coordinates = geom;
                                break;
                            case TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline:
                            case TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                                coordinates = geom.flat();
                                break;
                            case TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon:
                                coordinates = geom.flat(2);
                                break;
                            default:
                                break;
                        }
                        if (coordinates && coordinates.every(function (coord) {
                            return Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90; // Parecen geográficas
                        })) {
                            feature.setCoords(TC.Util.reproject(geom, geogCrs, self.map.crs));
                        }
                    }

                    return feature;
                };
                // Ignoramos los GPX (se supone que los gestionará Geolocation)
                var gpxPattern = '.' + TC.Consts.format.GPX.toLowerCase();
                if (fileName.toLowerCase().indexOf(gpxPattern) === fileName.length - gpxPattern.length ||
                    target && target !== self.map.div && target !== self) {
                    return;
                }

                const addLayer = (id) => map.addLayer({
                    id: id || self.getUID(fileHandle || timeStamp),
                    title: fileName,
                    owner: self,
                    type: TC.Consts.layerType.VECTOR,
                    file: fileName,
                    groupIndex: groupIndex,
                    fileSystemFile: fileSystemFile
                });

                let targetLayers = e.targetLayers || [];
                if (!targetLayers.length) {
                    targetLayers.push(await addLayer());
                }
                for (var i = 0; i < targetLayers.length; i++) {
                    const targetLayer = targetLayers[i];
                    const mapLayer = self.map.getLayer(targetLayer) || await addLayer(targetLayer.id);
                    const metadata = await self.loadLayerMetadata(mapLayer);
                    if (!metadata || metadata.groupIndex === groupIndex) {
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
                        if (e.additionalFileHandles) {
                            layer._additionalFileHandles = e.additionalFileHandles;
                        }
                        await self.saveLayerMetadata(layer);
                        if (!e.targetLayers) {
                            // Es un archivo nuevo: lo guardamos en la lista
                            let recentFileEntry = {
                                mainHandle: fileHandle
                            };
                            if (layer._additionalFileHandles) {
                                recentFileEntry.additionalHandles = layer._additionalFileHandles;
                            }
                            await self.addRecentFileEntry(recentFileEntry);
                        }

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
            })
            .on(TC.Consts.event.FEATURESIMPORTERROR, function (e) {
                var dictKey;
                var fileName = e.file.name;
                if (fileName.toLowerCase().substr(fileName.length - 4) === '.kmz') {
                    dictKey = 'fileImport.error.reasonKmz';
                }
                else {
                    dictKey = 'fileImport.error.reasonUnknown';
                }

                TC.error(e.message ? self.getLocaleString(e.message) : self.getLocaleString(dictKey, { fileName: fileName }), TC.Consts.msgErrorMode.TOAST);

                var reader = new FileReader();
                reader.onload = function (event) {
                    TC.error("Nombre del archivo: " + fileName + " \n Contenido del archivo: \n\n" + event.target.result, TC.Consts.msgErrorMode.EMAIL, "Error en la subida de un archivo");
                };
                self.subtrackPendingFile();
            })
            .on(TC.Consts.event.FEATURESIMPORTPARTIAL, function (e) {
                self.map.toast(self.getLocaleString("fileImport.partial.problem", { fileName: e.file.name, table: e.table, reason: e.reason }), { type: TC.Consts.msgType.ERROR });
            })
            .on(TC.Consts.event.FEATURESIMPORTWARN, function (e) {
                self.map.toast(self.getLocaleString("fileImport.geomEmpty", { fileName: e.file.name }), { type: TC.Consts.msgType.WARNING });
            })
            .on(TC.Consts.event.LAYERADD, function (e) {
                self.loadLayersFromFile([e.layer]);
            })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
                if (e.layer.owner === self) {
                    self.deleteLayerMetadata(e.layer);
                }
                const ownLayers = self.getLayers();
                const idx = ownLayers.indexOf(e.layer);
                if (idx >= 0) {
                    ownLayers.splice(idx, 1);
                }
            });

        map.loaded(() => {
            self.loadLayersFromFile(map.workLayers);
        });

        return result;
    }

    render() {
        const self = this;
        return self._set1stRenderPromise(new Promise(function (resolve, _reject) {
            self.renderData({ formats: self.formats }, function () {
                const fileInput = self.querySelector('input[type=file]');
                // GLS: Eliminamos el archivo subido, sin ello no podemos subir el mismo archivo seguido varias veces
                fileInput.addEventListener(TC.Consts.event.CLICK, async function (e) {
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

                    if (TC.Util.isFunction(window.showOpenFilePicker)) {
                        e.preventDefault();
                        let fileHandles;
                        try {
                            fileHandles = await window.showOpenFilePicker({
                                multiple: true
                            });
                        }
                        catch (e) {
                            if (!(e instanceof AbortError)) {
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

                self.renderRecentFileList();

                self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
                    self._dialogDiv.innerHTML = html;
                    resolve(self);
                });
            });
        }));
    }

    loadFiles(files) {
        const self = this;
        self.map.loadFiles(files, { control: self });
        return self;
    }

    async loadLayersFromFile(layers) {
        const self = this;
        // Verificamos si son capas propias y si son de archivo local serializadas
        const ownLayers = layers.filter(l => self.getIdCount(l.id) && !l.options.owner && l.options.file);
        if (ownLayers.length) {
            const fileHandles = [];
            const idCount = Math.max(...ownLayers.map(l => self.getIdCount(l.id)));
            TC.setUIDStart(idCount + 1, { prefix: self.id + '-' });
            const layersMetadata = await Promise.all(ownLayers.map(l => self.loadLayerMetadata(l)));
            ownLayers.forEach((l, idx) => {
                l.options.groupIndex = layersMetadata[idx]?.groupIndex;
            });
            const layerGroups = new Map();
            const additionalFileHandleDictionary = new Map();
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
                        if (metadata.additionalFileHandles) {
                            additionalFileHandleDictionary.set(metadata.fileHandle, metadata.additionalFileHandles);
                        }
                    }
                    group.push(ownLayers[i]);
                }
                else {
                    // Error: no existe el archivo en este navegador, por tanto eliminamos capa
                    self.map.removeLayer(layers[i]);
                }
            }
            await self.renderPromise();
            const dialog = self._dialogDiv.querySelector(`.tc-ctl-file-dialog`);
            const title = dialog.querySelector('h3');
            const button = self._dialogDiv.querySelector('sitna-button.tc-ctl-file-dialog-ok');

            const endFn = handles => {
                self.map.loadFiles(handles, {
                    layers: layerGroups.get(handles[0]),
                    target: self
                });
            };

            for (const fileHandle of layerGroups.keys()) {
                let fileHandles = [fileHandle];
                const additionalFileHandles = additionalFileHandleDictionary.get(fileHandle);
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
                            const files = title.innerHTML.split(', ');
                            if (!files.includes(pendingFileHandle.name)) {
                                title.innerHTML = title.innerHTML + ', ' + pendingFileHandle.name;
                            }
                        }
                        else {
                            title.innerHTML = pendingFileHandle.name;
                        }
                    }
                }
                const isPermissionGranted = p => p === 'granted';
                if (promptRequired) {
                    TC.Util.showModal(dialog);
                    button.addEventListener('click', async function (_e) {
                        for (var k = 0; k < permissions.length; k++) {
                            permissions[k] = await fileHandles[k].requestPermission();
                        }
                        if (permissions.every(isPermissionGranted)) {
                            endFn(fileHandles);
                        }
                        title.innerHTML = '';
                        TC.Util.closeModal();
                    });
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
                id: self.id,
                layers: self.getLayers().map(function (layer) {
                    const layerState = {
                        title: layer.title,
                        state: TC.Util.extend(layer.exportState(), { path: layer.features?.length ? layer.features[0].getPath() : undefined })
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
                    return !self.map.workLayers.some(l => l.options.file && layer.file === l.options.file);
                })
                .forEach(function (layerData) {
                    layerPromises.push(self.map.addLayer({
                        id: self.getUID(),
                        title: layerData.title,
                        owner: self,
                        type: TC.Consts.layerType.VECTOR
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
        const setItemPromise = localforage.setItem(self.LAYER_METADATA_STORE_KEY_PREFIX + self.map.id + '-' + layer.id,
            storageItem);
        setItemPromise.catch(function (e) {
            console.warn(e.message);
        });
        return await setItemPromise;
    }

    async loadLayerMetadata(layer) {
        const self = this;
        let metadata = {};
        try {
            metadata = await localforage.getItem(self.LAYER_METADATA_STORE_KEY_PREFIX + self.map.id + '-'+ layer.id);
        }
        catch (err) {
            console.warn(err.message);
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

    async loadRecentFiles() {
        const self = this;
        const recentFilePromises = [];
        for (var i = 0; i < self.recentFileCount; i++) {
            try {
                recentFilePromises.push(localforage.getItem(self.RECENT_FILES_STORE_KEY_PREFIX + i));
            }
            catch (err) {
                console.warn(err.message);
            }
        }
        const results = [];
        for await (const entry of recentFilePromises) {
            if (entry) {
                results.push(entry);
            }
        }
        self.recentFiles = results;
        return results;
    }

    storeRecentFiles(entries) {
        const self = this;
        entries = entries || self.recentFiles;
        for (var i = 0; i < self.recentFileCount; i++) {
            if (i < entries.length) {
                const entry = entries[i];
                try {
                    localforage.setItem(self.RECENT_FILES_STORE_KEY_PREFIX + i, entry);
                }
                catch (err) {
                    console.warn(err.message);
                }
            }
            else {
                try {
                    localforage.removeItem(self.RECENT_FILES_STORE_KEY_PREFIX + i);
                }
                catch (err) {
                    console.warn(err.message);
                }
            }
        }
        self.recentFiles = entries;
        return self;
    }

    async addRecentFileEntry(newEntry) {
        const self = this;
        let fileExists = false;
        for await (const isSame of self.recentFiles.map(entry => {
            const handle = entry.mainHandle || entry;
            return handle.isSameEntry(newEntry.mainHandle);
        })) {
            if (isSame) {
                fileExists = true;
                break;
            }
        }
        if (fileExists) {
            // Archivo existente, lo eliminamos del sitio anterior
            const fileIndex = self.recentFiles.findIndex(f => (f.mainHandle?.name || f.name) === newEntry.mainHandle.name);
            self.recentFiles.splice(fileIndex, 1);
        }
        else {
            // Archivo nuevo, corremos lista
            if (self.recentFiles.length >= self.recentFileCount) {
                self.recentFiles.pop();
            }
        }
        self.recentFiles.unshift(newEntry);
        await self.storeRecentFiles(self.recentFiles);
        self.renderRecentFileList();
    }

    async removeRecentFileEntry(index) {
        const self = this;
        self.recentFiles.splice(index, 1);
        await self.storeRecentFiles(self.recentFiles);
        self.renderRecentFileList();
    }

    async loadRecentFileEntry(index) {
        const self = this;
        const entry = self.recentFiles[index];
        if (entry) {
            for await (const isSame of self.map.workLayers
                .filter(l => l._fileHandle)
                .map(l => {
                    const handle = entry.mainHandle || entry;
                    return l._fileHandle.isSameEntry(handle);
                })) {
                if (isSame) {
                    self.map.toast(self.getLocaleString('fileLoadedMoreThanOnce'), { type: TC.Consts.msgType.WARNING });
                }
            }
            let handles = [entry.mainHandle || entry];
            if (entry.additionalHandles) {
                handles = handles.concat(entry.additionalHandles);
            }
            const permissions = [];
            for await (let permission of handles.map(h => h.queryPermission())) {
                permissions.push(permission);
            }
            for (var i = 0; i < permissions.length; i++) {
                let permission = permissions[i];
                if (permission === 'prompt') {
                    permissions[i] = await handles[i].requestPermission();
                }
            }
            if (permissions.every(p => p === 'granted')) {
                self.loadFiles(handles);
                return entry;
            }
        }
        return null;
    }

    renderRecentFileList(fileList) {
        const self = this;
        const onLinkClick = function (e) {
            self.loadRecentFileEntry(e.target.dataset.fileIndex);
        };
        const onButtonClick = function (e) {
            self.removeRecentFileEntry(e.target.dataset.fileIndex);
        };
        const list = self.querySelector('.tc-ctl-file-recent');
        if (list) {
            const buttonText = self.getLocaleString('removeFromList');
            const promise = fileList ? Promise.resolve(fileList) : self.loadRecentFiles();
            promise.then(entries => {
                list.replaceChildren();
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
                    link.addEventListener(TC.Consts.event.CLICK, onLinkClick);
                    link.setAttribute('variant', Button.variant.LINK);
                    link.setAttribute('text', entry.mainHandle?.name || entry.name);
                    li.appendChild(link);
                    const button = document.createElement('sitna-button');
                    button.text = buttonText;
                    button.dataset.fileIndex = index;
                    button.addEventListener(TC.Consts.event.CLICK, onButtonClick);
                    button.setAttribute('variant', Button.variant.MINIMAL);
                    button.setAttribute('icon', Button.action.CLOSE);
                    li.appendChild(button);
                    list.appendChild(li);
                });
            });
        }
    }

    subtrackPendingFile = function () {
        const self = this;
        window.dropFilesCounter--;
        if (window.dropFilesCounter === 0) {
            self.map.zoomToFeatures(self.map._bufferFeatures);
            self.map._bufferFeatures = [];
            delete window.dropFilesCounter;
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
    
    getUID = function (fileHandle) {
        const self = this;
        if (fileHandle) {
            const propertyname = Object.prototype.hasOwnProperty.call(window, "FileSystemFileHandle") ? "_fileHandle":"_timeStamp";
            const grouped = self.getLayers().reduce((vi, va) => {
                return vi.findByProperty(propertyname, va[propertyname]) && vi.some((l) => /^[\w]*-\d-\d/gi.exec(va.id)[0] === /^[\w]*-\d-\d/gi.exec(l.id)[0]) ? vi : vi.concat(va);
            }, []);            
            return TC.getUID({
                prefix: self.id + '-' + (grouped.filter((l) => l[propertyname] != fileHandle).length + 1) + '-'
            });
        }
        else
            return TC.getUID({
                prefix: self.id + '-'
            });
    }
}

TC.mix(FileImport, layerOwner);

customElements.define('sitna-file-import', FileImport);

export default FileImport;

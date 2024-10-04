
import DragAndDrop, { DragAndDropEvent } from 'ol/interaction/DragAndDrop';
import EventType from 'ol/events/EventType';
import { getUserProjection } from 'ol/proj';

const currentFiles = new Set();

var DragAndDropEventType = {
    /**
     * Triggered when features are added
     * @event DragAndDropEvent#addfeatures
     * @api
     */
    ADD_FEATURES: 'addfeatures'
};

const getFileNameWithoutExtension = function (name) {
    const pointIndex = name.lastIndexOf('.');
    if (pointIndex >= 0) {
        return name.substr(0, pointIndex);
    }
    return name;
};

const getFeatureGroupName = function (feature, file) {
    if (Object.prototype.hasOwnProperty.call(feature.getProperties(), "h4_Capa")) {
        return feature.getProperties()["h4_Capa"];
    }
    // Si el id es del tipo: tipo_Geom.n, dividimos por tipo_geom.
    // En caso contrario, dividimos por archivo.
    const groups = /(?<layer>[-_\p{Letter}.]+[\p{Letter}])?\.*(?<id>[\d]*)?/iu.exec(feature.getId() || feature.ol_uid).groups;
    return groups["layer"] ? groups["layer"] : getFileNameWithoutExtension(file.name);
}

DragAndDrop.prototype.handleResult_ = async function (file, event) {
    const result = event.target.result;
    const map = this.getMap();
    let projection = this.projection_;
    if (!projection) {
        projection = getUserProjection();
        if (!projection) {
            const view = map.getView();
            projection = view.getProjection();
        }
    }

    ///////////
    let groups = {};
    let features = [];
    const fileName = file.name;
    let currentFormat;
    ///////////

    let text;
    const formats = this.formats_;
    for (let i = 0, ii = formats.length; i < ii; ++i) {
        currentFormat = formats[i];
        let input = result;
        if (this.readAsBuffer_ && currentFormat.getType() !== 'arraybuffer') {
            if (text === undefined) {
                text = new TextDecoder().decode(result);
            }
            input = text;
        }
        features = await this.tryReadFeatures_(currentFormat, input, {
            featureProjection: projection,
            fileName: file.name,
            fileNames: [...currentFiles.values()]
        });
        /////
        if (features === true) {
            const counterContainer = map?._wrap.parent || window;
            counterContainer.dropFilesCounter--;
            return;
        } 
        else if (features?.length > 0) {
            break;
        }
        /////
    }

    ////////
    if (features && features.length > 0) {
        // si es un array de arrays
        if (features.every(a => Array.isArray(a))) {
            groups = features.reduce(function (rv, x) {
                if (x.length === 0) return rv;
                const id = getFeatureGroupName(x[0], file);
                rv[id] ??= [];
                rv[id] = rv[id].concat(x);
                return rv;
            }, {});
        }
        else if (currentFormat.groupFeatures) {
            groups = currentFormat.groupFeatures(features, function (feat) {
                return getFeatureGroupName(feat, file);
            });
        }
        else {
            groups = features.reduce(function (rv, feat) {
                var id = feat._folders?.length ? feat._folders[feat._folders.length - 1] : null;
                if (!id) {
                    id = getFeatureGroupName(feat, file)
                }
                rv[id] ??= [];
                rv[id].push(feat);
                return rv;
            }, {});
        }
    }
    else {
        groups[getFileNameWithoutExtension(file.name)] = features;
    }

    const timeStamp = Date.now();
    const groupKeys = Object.keys(groups);
    if (groupKeys.length > 1) {
        const counterContainer = this.getMap()?._wrap.parent || window;
        counterContainer.dropFilesCounter = counterContainer.dropFilesCounter + groupKeys.length - 1;
    }
    for (var j = 0; j < groupKeys.length; j++) {
        //for (var group in groups) {
        const group = groupKeys[j];
        const groupFeatures = groups[group];
        if (group !== "undefined" && groupFeatures)
            groupFeatures.forEach((f) => {
                if (!f._folders?.length) {
                    f._folders = [group];
                }
            });
        if (this.source_) {
            this.source_.clear();
            this.source_.addFeatures(groupFeatures);
        }
        //////////////
        const docName = groupFeatures && groupFeatures.length && groupFeatures[0]._document;
        const newFileName = docName ? docName + " (" + fileName + ")" : fileName;
        const newFile = new File([file], newFileName, {
            lastModified: timeStamp
        });
        if (file._fileSystemFile) {
            newFile._fileSystemFile = file._fileSystemFile;
        }
        const fileHandle = file._fileHandle;
        if (fileHandle) {
            newFile._fileHandle = fileHandle;
        }
        ////////

        const ddEvent = new DragAndDropEvent(
            DragAndDropEventType.ADD_FEATURES,
            newFile,
            groupFeatures,
            projection
        );

        ///////////
        ddEvent._groupIndex = j;
        ddEvent._groupCount = groupKeys.length;
        const getFeatureTypeMetadata = (metadata, features) => currentFormat.getFeatureTypeMetadata ?
            currentFormat.getFeatureTypeMetadata(metadata, features) : metadata;
        if (groupFeatures) {
            const featureMetadata = groupFeatures
                .map((feat) => currentFormat.featureMetadata.get(feat))
                .filter((feat) => !!feat);
            if (featureMetadata.length) {
                const firstMetadata = featureMetadata[0];
                if (featureMetadata.every((md) => md == firstMetadata)) {
                    ddEvent._metadata = getFeatureTypeMetadata(firstMetadata, groupFeatures);
                }
            }
        }
        ///////////

        this.dispatchEvent(ddEvent);
    ////////
    }
    ////////
};

DragAndDrop.prototype.handleDrop = async function (event) {
    const files = event.dataTransfer.items;

    if (DataTransferItem.prototype.getAsFileSystemHandle) {
        const fileHandles = [];
        // Rama de File System Access API
        const processHandle = async function (fsHandle) {

            if (fsHandle instanceof window.FileSystemDirectoryHandle) {
                for await (const child of fsHandle.values()) {
                    await processHandle(child);
                }
            }
            else if (fsHandle) {
                fileHandles.push(fsHandle);
            }
        };
        for await (const fsHandle of [...files].map((f) => f.getAsFileSystemHandle())) {
            await processHandle(fsHandle);
        }

        fileHandles.forEach((fh, idx, arr) => {
            const siblings = arr.slice();
            siblings.splice(idx, 1);
            fh._siblings = siblings;
        });
        fileHandles.forEach((fh) => this.processFile(fh));
    }
    else {
        // Rama de File System API
        const processFileOrDir = (fileOrDir) => {
            if (fileOrDir.isDirectory) {
                fileOrDir.createReader().readEntries(function (entries) {
                    entries.forEach(function (entry) {
                        processFileOrDir(entry);
                    });
                });
            }
            else {
                this.processFile(fileOrDir);
            }
        };
        for (var j = 0, jj = files.length; j < jj; ++j) {
            const item = files[j];
            if (item.kind === "file") {
                processFileOrDir(item.getAsFile());
            }
        }
    }
    currentFiles.clear();
};

DragAndDrop.prototype.processFile = async function (file) {
    let fileHandle;

    currentFiles.add(file.name);

    if (globalThis.FileSystemFileHandle && file instanceof globalThis.FileSystemFileHandle) {
        fileHandle = file;
        try {
            file = await fileHandle.getFile();
        }
        catch (err) {
            console.warn(err);
            this.dispatchEvent(new DragAndDropEvent('error', fileHandle));
            return;
        }
        file._fileHandle = fileHandle;
    }

    const counterContainer = this.getMap()?._wrap.parent || globalThis;
    counterContainer.dropFilesCounter ??= 0;
    counterContainer.dropFilesCounter++;

    if (file.type === "application/zip" ||
        file.type === "application/x-zip-compressed" ||
        file.type === "application/vnd.google-earth.kmz" ||
        (!file.type || file.type === "application/octet-stream") && file.name.match(/\.kmz|\.zip$/ig)) {
        currentFiles.delete(file.name);
        const { default: JSZip } = await import('jszip');
        var zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        counterContainer.dropFilesCounter--;
        //URI: Si el fichero es un KMZ nos guardamos el nombre del fichero para remplazar el nombre interno que suele ser doc.kml
        const zipContainerName = (file.type === "application/vnd.google-earth.kmz" ||
            (!file.type || file.type === "application/octet-stream") && file.name.match(/\.kmz$/ig)) ? file.name : null;

        const zippedFiles = [];
        zipContent.forEach(function (fileName, zippedFile) {
            if (zippedFile.dir) {
                return;
            }
            counterContainer.dropFilesCounter++;
            zippedFiles.push({ name: fileName, file: zippedFile });
        });
        const newFiles = await Promise.all(zippedFiles.map(async (zippedFileObj) => {
            //TODO: Desestimar fichero no geográficos
            const data = await zippedFileObj.file.async("blob");
            counterContainer.dropFilesCounter--;
            //URI: Si hay definido un nombre del zip contenedor (Se trata de un KMZ) lo uso en vez del nombre del KML interno
            const newFile = zipContainerName ? new File([data], zipContainerName, { type: "application/vnd.google-earth.kml+xml" }) : new File([data], zippedFileObj.name);
            newFile._fileSystemFile = file._fileSystemFile || file;
            if (fileHandle) {
                newFile._fileHandle = fileHandle;
            }
            else {
                // El archivo no es un fileHandle, puede que sea un archivo virtual dentro de un zip
                // Buscamos el handle asociado al archivo
                const parentFileHandle = file._fileHandle;
                if (parentFileHandle) {
                    newFile._fileHandle = parentFileHandle;
                }
            }
            return newFile;
        }));
        newFiles.forEach((newFile) => this.processFile(newFile));
    } else {
        var reader = new FileReader();
        reader.addEventListener(EventType.LOAD, this.handleResult_.bind(this, file));
        if (this.readAsBuffer_) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    }
};

DragAndDrop.prototype.tryReadFeatures_ = async function (format, text, options) {
    let features;
    try {
        features = await format.readFeatures(text, options);
    } catch (e) {
        return null;
    }
    // Aceptamos booleanos por el formato Shapefile: varios archivos que se tienen que procesar, 
    // y solamente uno devolverá entidades
    if (features === true || (features?.length && features.some(f => Array.isArray(f) ? f.some(f2 => !!f2.getGeometry()) : !!f.getGeometry()))) {
        return features;
    }
    return null;
};

export default DragAndDrop;
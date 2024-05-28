
import DragAndDrop, { DragAndDropEvent } from 'ol/interaction/DragAndDrop';
import EventType from 'ol/events/EventType';
import JSZip from 'jszip';


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

DragAndDrop.prototype.handleResult_ = function (file, event) {
    var result = event.target.result;
    var map = this.getMap();
    var projection = this.projection_;
    if (!projection) {
        var view = map.getView();
        projection = view.getProjection();
    }

    var features = [];
    var groups = {};
    var formats = this.formats_;
    var fileName = file.name;
    //let originalFileName = fileName;
    //const originalFilehandle = file._fileHandle;
    //if (originalFilehandle) {
    //    originalFileName = originalFilehandle.name;
    //}

    

    if (typeof result === "string") {
        for (var i = 0, ii = formats.length; i < ii; ++i) {
            var format = formats[i];
            features = this.tryReadFeatures_(format, result, {
                featureProjection: projection
            });
            if (features && features.length > 0) {
                break;
            }
        }

        if (features && features.length > 0)
            //si es un array de arrays
            if (features.every(a => Array.isArray(a))) {
                groups = features.reduce(function (rv, x) {
                    if (x.length === 0) return rv;                    
                    const id = getFeatureGroupName(x[0], file);
                    rv[id] = (rv[id] = rv[id] || []).concat(x);
                    return rv;
                }, {});
            }
            else
                groups = features.reduce(function (rv, x) {
                    var id = x._folders && x._folders.length ? x._folders[x._folders.length - 1] : null;
                    if (!id) {
                        id = getFeatureGroupName(x,file)
                    }
                    (rv[id] = rv[id] || []).push(x);
                    return rv;
                }, {});
        else {
            groups[getFileNameWithoutExtension(file.name)] = features;
        }
    }
    else {
        features = result ? new ol.format.GeoJSON().readFeaturesFromObject(result, {
            featureProjection: projection,
            dataProjection: new ol.format.GeoJSON().readProjectionFromObject(result)
        }) : null;
        groups[getFileNameWithoutExtension(file.name)] = features;
    }
    const timeStamp = Date.now();
    const groupKeys = Object.keys(groups);
    if (groupKeys.length > 1) {
        window.dropFilesCounter = window.dropFilesCounter + groupKeys.length - 1;
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

        const ddEvent = new DragAndDropEvent(DragAndDropEventType.ADD_FEATURES, newFile, groups[group], projection);
        ddEvent._groupIndex = j;
        ddEvent._groupCount = groupKeys.length;
        if (event.metadata) {
            ddEvent._metadata = event.metadata;
        }
        this.dispatchEvent(ddEvent);
        //////////////
    }
};

DragAndDrop.prototype.handleDrop = async function (event) {
    const _self = this;
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
        fileHandles.forEach((fh) => _self.processFile(fh));
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
                _self.processFile(fileOrDir);
            }
        };
        for (var j = 0, jj = files.length; j < jj; ++j) {
            const item = files[j];
            if (item.kind === "file") {
                processFileOrDir(item.getAsFile());
            }
        }
    }

};

DragAndDrop.prototype.processFile = async function (file) {
    const _self = this;
    let fileHandle;

    if (window.FileSystemFileHandle && file instanceof window.FileSystemFileHandle) {
        fileHandle = file;
        try {
            file = await fileHandle.getFile();
        }
        catch (err) {
            console.warn(err);
            _self.dispatchEvent(new DragAndDropEvent('error', fileHandle));
            return;
        }
        file._fileHandle = fileHandle;
    }

    const counterContainer = this.getMap()?._wrap.parent || window;

    if (file.type === "application/zip" ||
        file.type === "application/x-zip-compressed" ||
        file.type === "application/vnd.google-earth.kmz" ||
        (!file.type || file.type === "application/octet-stream") && file.name.match(/\.kmz|\.zip$/ig)) {
        var zip = new JSZip();
        counterContainer.dropFilesCounter ??= 0;
        counterContainer.dropFilesCounter++;
        const zipContent = await zip.loadAsync(file);
        counterContainer.dropFilesCounter--;
        //URI: Si el fichero es un KMZ nos guardamos el nombre del fichero para remplazar el nombre interno que suele ser doc.kml
        const zipContainerName = (file.type === "application/vnd.google-earth.kmz" ||
            (!file.type || file.type === "application/octet-stream") && file.name.match(/\.kmz$/ig)) ? file.name : null;

        zipContent.forEach(function (fileName, zippedFile) {
            if (zippedFile.dir) {
                return;
            }
            counterContainer.dropFilesCounter++;
            //TODO: Desestimar fichero no geográficos
            zippedFile.async("blob").then(function (data) {
                counterContainer.dropFilesCounter--;
                //URI: Si hay definido un nombre del zip contenedor (Se trata de un KMZ) lo uso en vez del nombre del KML interno
                const newFile = zipContainerName ? new File([data], zipContainerName, { type: "application/vnd.google-earth.kml+xml" }) : new File([data], fileName);                
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
                _self.processFile(newFile);                
            });
        });
    } else {
        counterContainer.dropFilesCounter ??= 0;
        counterContainer.dropFilesCounter++;
        var reader = new FileReader();
        reader.addEventListener(EventType.LOAD, _self.handleResult_.bind(_self, file));
        reader.readAsText(file);
    }
};

DragAndDrop.prototype.tryReadFeatures_ = function tryReadFeatures_(format, text, options) {
    let features;
    try {
        features = format.readFeatures(text, options);
    } catch (e) {
        return null;
    }
    if (features && features.length && features.some(f => Array.isArray(f) ? f.some(f2 => !!f2.getGeometry()) : !!f.getGeometry())) {
        return features;
    }
    return null;
};

export default DragAndDrop;
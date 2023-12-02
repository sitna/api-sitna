
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

const getFeatureGroupName = function (feature, file) {
    if (Object.prototype.hasOwnProperty.call(feature.getProperties(), "h4_Capa")) {
        return feature.getProperties()["h4_Capa"];
    }
    // Si el id es del tipo: tipo_Geom.n, dividimos por tipo_geom.
    // En caso contrario, dividimos por geometría, salvo en el caso de gpx, 
    // porque ese formato no debe hacer grupos por geometría.
    const groups = /(?<layer>[-_\p{Letter}.]+[\p{Letter}])?\.*(?<id>[\d]*)?/iu.exec(feature.getId() || feature.ol_uid).groups;
    return groups["layer"] ?
        groups["layer"] :
        !file.name.toLowerCase().endsWith('.gpx') && feature.getGeometry() ?
            Object.keys(ol.geom).find(type => feature.getGeometry() instanceof ol.geom[type]) :
            file.name;    
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
                        id = getFeatureGroupName(x, file)
                    }
                    (rv[id] = rv[id] || []).push(x);
                    return rv;
                }, {});
        else {
            groups[file.name] = features;
        }
    }
    else {
        features = result ? new ol.format.GeoJSON().readFeaturesFromObject(result, {
            featureProjection: projection,
            dataProjection: new ol.format.GeoJSON().readProjectionFromObject(result)
        }) : null;
        groups[file.name] = features;
    }
    const timeStamp = Date.now();
    const groupKeys = Object.keys(groups);
    if (groupKeys.length > 1) {
        window.dropFilesCounter = window.dropFilesCounter + groupKeys.length - 1;
    }
    for (var i = 0; i < groupKeys.length; i++) {
        //for (var group in groups) {
        const group = groupKeys[i];
        const groupFeatures = groups[group];
        if (group !== "undefined" && groupFeatures)
            groupFeatures.forEach((f) => { if (!f._folders) f._folders = [group]; });
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
        const fileHandle = this.getFileHandle(file);
        if (fileHandle) {
            fileHandles.set(newFile, fileHandle);
        }

        const ddEvent = new DragAndDropEvent(DragAndDropEventType.ADD_FEATURES, newFile, groups[group], projection);
        ddEvent._groupIndex = i;
        ddEvent._groupCount = groupKeys.length;
        this.dispatchEvent(ddEvent);
        //////////////
    }
};

DragAndDrop.prototype.handleDrop = function (event) {
    const _self = this;
    var files = event.dataTransfer.items;

    if (DataTransferItem.prototype.getAsFileSystemHandle) {
        // Rama de File System Access API
        const processHandle = function (fsHandle) {
            if (fsHandle) {
                _self.processFile(fsHandle);
            }
        };
        for (var i = 0, ii = files.length; i < ii; ++i) {
            files[i].getAsFileSystemHandle().then(processHandle);
        }
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
                if (fileOrDir instanceof File) {
                    _self.processFile(fileOrDir);
                }
                else {
                    fileOrDir.file(async function (file) {
                        _self.processFile(file);
                    });
                }
            }
        };
        for (var j = 0, jj = files.length; j < jj; ++j) {
            const item = files[j];
            if (item.kind === "file") {
                processFileOrDir(item.webkitGetAsEntry() || item.getAsFile());
            }
        }
    }

};

const fileHandles = new Map();

DragAndDrop.prototype.getFileHandle = function (file) {
    return fileHandles.get(file);
};

DragAndDrop.prototype.getFileHandleByName = function (name) {
    const lcName = name.toLowerCase();
    for (const file of fileHandles.keys()) {
        if (file.name.toLowerCase() === lcName) {
            return fileHandles.get(file);
        }
    }
    return null;
};

DragAndDrop.prototype.setFileHandle = function (file, handle) {
    return fileHandles.set(file, handle);
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
        _self.setFileHandle(file, fileHandle);
    }

    if (file.type === "application/zip" ||
        file.type === "application/x-zip-compressed" ||
        file.type === "application/vnd.google-earth.kmz" ||
        (!file.type || file.type === "application/octet-stream") && file.name.match(/\.kmz|\.zip$/ig)) {
        var zip = new JSZip();
        window.dropFilesCounter = window.dropFilesCounter ? window.dropFilesCounter + 1 : 1;
        const zipContent = await zip.loadAsync(file);
        window.dropFilesCounter--;
        //URI: Si el fichero es un KMZ nos guardamos el nombre del fichero para remplazar el nombre interno que suele ser doc.kml
        const zipContainerName = (file.type === "application/vnd.google-earth.kmz" ||
            (!file.type || file.type === "application/octet-stream") && file.name.match(/\.kmz$/ig)) ? file.name : null;

        zipContent.forEach(function (fileName, zippedFile) {
            if (zippedFile.dir) {
                return;
            }
            window.dropFilesCounter++;
            //TODO: Desestimar fichero no geográficos
            zippedFile.async("blob").then(function (data) {
                window.dropFilesCounter--;
                //URI: Si hay definido un nombre del zip contenedor (Se trata de un KMZ) lo uso en vez del nombre del KML interno
                const newFile = zipContainerName ? new File([data], zipContainerName, { type: "application/vnd.google-earth.kml+xml" }) : new File([data], fileName);
                newFile._fileSystemFile = file._fileSystemFile || file;
                if (fileHandle) {
                    _self.setFileHandle(newFile, fileHandle);
                }
                _self.processFile(newFile);
            });
        });
    } else {
        if (window.FileSystemDirectoryHandle && file instanceof window.FileSystemDirectoryHandle) {
            for await (const child of file.values()) {
                _self.processFile(child);
            }
        }
        else {
            window.dropFilesCounter = window.dropFilesCounter ? window.dropFilesCounter + 1 : 1;
            var reader = new FileReader();
            reader.addEventListener(EventType.LOAD, _self.handleResult_.bind(_self, file));
            reader.readAsText(file);
        }
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
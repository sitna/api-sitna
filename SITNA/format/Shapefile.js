import BinaryFormat, { FieldNameError } from './BinaryFormat';
import Consts from '../../TC/Consts';
import Util from '../../TC/Util';
import Point from '../feature/Point';
import Polygon from '../feature/Polygon';
import MultiPolygon from '../feature/MultiPolygon';
import Polyline from '../feature/Polyline';
import MultiPolyline from '../feature/MultiPolyline';

const defaultEncoding = 'ISO-8859-1';

const dbfDataType = {
    CHARACTER: 'C',
    DATE: 'D',
    NUMERIC: 'N',
    LOGICAL: 'L',
    MEMO: 'M',
    TIMESTAMP: '@',
    LONG: 'I',
    AUTOINCREMENT: '+',
    FLOAT: 'F',
    DOUBLE: 'O'
};

const getType = (dbfType, decimalCount) => {
    switch (dbfType) {
        case dbfDataType.CHARACTER:
            return Consts.dataType.STRING;
        case dbfDataType.DATE:
            return Consts.dataType.DATE;
        case dbfDataType.NUMERIC:
            if (decimalCount > 0) {
                return Consts.dataType.FLOAT;
            }
            else {
                return Consts.dataType.INTEGER;
            }
        case dbfDataType.LOGICAL:
            return Consts.dataType.BOOLEAN;
        case dbfDataType.TIMESTAMP:
            return Consts.dataType.DATETIME;
        case dbfDataType.LONG:
        case dbfDataType.AUTOINCREMENT:
            return Consts.dataType.INTEGER;
        case dbfDataType.FLOAT:
            return Consts.dataType.FLOAT;
        case dbfDataType.DOUBLE:
            return Consts.dataType.DOUBLE;
        default:
            Consts.dataType.STRING;
    }
};

const dbfDataTypes = new Map([
    [Consts.dataType.BOOLEAN, dbfDataType.LOGICAL],
    [Consts.dataType.TINYINT, dbfDataType.NUMERIC],
    [Consts.dataType.SMALLINT, dbfDataType.NUMERIC],
    [Consts.dataType.MEDIUMINT, dbfDataType.NUMERIC],
    [Consts.dataType.INTEGER, dbfDataType.NUMERIC],
    [Consts.dataType.FLOAT, dbfDataType.NUMERIC], // Librería dbf no soporta tipos numéricos distintos de NUMERIC
    [Consts.dataType.DOUBLE, dbfDataType.NUMERIC], // Librería dbf no soporta tipos numéricos distintos de NUMERIC
    [Consts.dataType.STRING, dbfDataType.CHARACTER],
    [Consts.dataType.DATE, dbfDataType.DATE],
    [Consts.dataType.DATETIME, dbfDataType.DATE] // Shapefile no soporta timestamp, el formato dBase para fecha y hora
]);

const importFile = async function ({ fileName, shp, dbf, prj, str, cst, cpg }) {
    if (!shp || !prj || !dbf) {
        throw 'fileImport.shapeImcomplete';
    }
    const fileNameWithoutExtension = fileName.replace(/\.shp$/i, '');

    const { default: shpjs } = await import('@sitna/shpjs/dist/shp');
    const shapes = await shpjs.combine([
        shpjs.parseShp(shp, prj, str),
        shpjs.parseDbf(dbf, cst || cpg || defaultEncoding)
    ]);

    const getDbfRowHeader = function (data, decoder) {
        const dataView = new DataView(data);
        const headerLen = dataView.getUint16(8, true);
        const out = [];
        let offset = 32;
        while (offset < headerLen) {
            out.push({
                name: decoder.decode(data.slice(offset, offset + 11)).replace(/\0/g, '').trim(),
                dataType: String.fromCharCode(dataView.getUint8(offset + 11)),
                length: dataView.getUint8(offset + 16),
                decimalCount: dataView.getUint8(offset + 17)
            });
            if (dataView.getUint8(offset + 32) === 13) {
                break;
            } else {
                offset += 32;
            }
        }
        return out;
    }

    const dbfRowHeader = getDbfRowHeader(dbf, new TextDecoder(cst || cpg || defaultEncoding));
    const metadata = {
        name: fileName,
        origin: Consts.format.SHAPEFILE,
        attributes: dbfRowHeader
            .map(rh => ({
                name: rh.name,
                type: getType(rh.dataType, rh.decimalCount),
                originalType: {
                    dataType: rh.dataType,
                    length: rh.length,
                    decimalCount: rh.decimalCount,
                },
                isId: rh.dataType === '+'
            }))
    };

    return (shapes instanceof Array ? shapes : [shapes]).map(function (collection) {
        const geometryType = collection?.features[0]?.geometry.type;
        const geometries = [
            {
                name: 'geometry',
                type: Util.getGeometryType(geometryType),
                originalType: geometryType
            }
        ];
        collection.features.forEach((f, i) => {
            // El parser no añade ids, los añadimos nosotros.
            f.id = `${fileNameWithoutExtension}.${i + 1}`;

            // Eliminamos las fechas no válidas (seguramente vienen de un campo fecha vacío)
            for (const key in f.properties) {
                if (f.properties[key] instanceof Date && isNaN(f.properties[key])) {
                    f.properties[key] = null;
                }
            }
        });
        collection.metadata = { ...metadata, ...{ geometries } };
        return collection;
    });
};

const exportFeatures = async function (features, options = {}) {
    const defaultEncoding = "ISO-8859-1";
    //generar shape

    const featuresToExport = features.filter(f => !f.options.noExport);

    //agrupar por capa
    const layerIds = featuresToExport.reduce(function (rv, feature) {
        var id = feature.id.substr(0, feature.id.lastIndexOf("."));
        //si el id no tiene parte numérica intentamos agrupar por otro método
        if (!id && feature.folders && feature.folders.length)
            id = feature.folders[feature.folders.length - 1];
        if (!id && feature.layer && feature.layer.title)
            id = feature.layer.title.substr(0, feature.layer.title.lastIndexOf("."));
        //var id = feature.layer? (typeof(feature.layer)==="string"?feature.layer:feature.layer.id) :feature.id.substr(0, feature.id.lastIndexOf("."));
        (rv[id] = rv[id] || []).push(feature);
        return rv;
    }, {});

    const getInnerType = function (feature) {
        switch (true) {
            case feature instanceof Point:
                return 'POINT';
            case feature instanceof Polygon:
            case feature instanceof MultiPolygon:
                return 'POLYGON';
            case feature instanceof Polyline:
            case feature instanceof MultiPolyline:
                return 'POLYLINE';
        }
        return 'NULL';
    };

    const fillGroupMap = function (groupMap, feature) {
        const type = getInnerType(feature);
        let featureList = groupMap.get(type);
        if (!featureList) {
            featureList = [];
            groupMap.set(type, featureList);
        }
        featureList.push(feature);
        return groupMap;
    };

    const proj = await TC.getProjectionData({ crs: options.crs });

    const arrPromises = [];
    const [{ default: shpWrite }, { default: dbf }] = await Promise.all([
        import('@aleffabricio/shp-write/index'),
        import('dbf')
    ]);

    let layerId;
    for (layerId in layerIds) {
        //agrupar las features por tipos
        const groups = layerIds[layerId].reduce(fillGroupMap, new Map());
        for (let [geometryType, featureList] of groups.entries()) {

            if (!options.adaptNames) {
                for (const feature of featureList) {
                    for (const name in feature.data) {
                        if (name.length > 10 || !/^[a-zA-Z][a-zA-Z0-9_:]*$/.test(name)) {
                            throw new FieldNameError('Field "' + name + '" is invalid', { cause: name });
                        }
                    }
                }
            }

            const firstFeature = featureList[0] ?? {};
            const featureTypeMetadata = await firstFeature.layer?.getFeatureTypeMetadata();

            const dbfMetadata = featureTypeMetadata
                ?.attributes
                .filter((attr) => !attr.isId)
                .filter((attr) => featureList.some((feat) => Object.keys(feat.data).some((key) => featureTypeMetadata.equals(key, attr.name))))
                .map((attr) => {
                    const name = attr.name;
                    if (featureTypeMetadata.origin === Consts.format.SHAPEFILE && attr.originalType) {
                        return {
                            name,
                            type: attr.originalType.dataType,
                            size: attr.originalType.length - attr.originalType.decimalCount,
                            decimalCount: attr.originalType.decimalCount
                        };
                    }
                    const type = dbfDataTypes.get(attr.type) || dbfDataType.CHARACTER;
                    let size;
                    switch (type) {
                        case dbfDataType.CHARACTER:
                            size = 254;
                            break;
                        case dbfDataType.LOGICAL:
                            size = 1;
                            break;
                        case dbfDataType.DATE:
                        case dbfDataType.TIMESTAMP:
                            size = 8;
                            break;
                        case dbfDataType.NUMERIC:
                        case dbfDataType.FLOAT:
                            size = 18;
                            break;
                    }
                    return {
                        name,
                        type,
                        size
                    };
                });

            arrPromises.push(new Promise(function (resolve) {
                const data = featureList.reduce(function (prev, curr) {
                    const data = {};
                    for (var key in curr.data) {
                        const val = curr.data[key];
                        data[key] = typeof val === 'string' ?
                            val.replace(/•/g, "&bull;").replace(/›/g, "&rsaquo;") :
                            val;
                    }
                    if (curr.getStyle().label && !curr.data.name) {
                        data.name = curr.getStyle().label;
                    }
                    return prev.concat([data]);
                }, []);
                const geometries = featureList.reduce(function (prev, curr) {
                    //No se porque no le gusta las geometrias polyline de la herramienta draw por tanto las convierto a multipolyline
                    if (curr instanceof Polyline) {
                        curr = new MultiPolyline(curr.getCoords(), curr.options);
                    }
                    //si el sistema de referencia es distinto a EPSG:4326 reproyecto las geometrias							
                    return prev.concat([curr.geometry]);
                }, []);

                const fileName = layerId + (groups.size > 1 ? '_' + geometryType : '');
                //generamos el un shape mas sus allegados por grupo
                if (dbfMetadata) {
                    // Convertimos fechas a formato YYYYMMDD
                    for (const property of dbfMetadata) {
                        if (property.type === dbfDataType.DATE) {
                            for (const dataElm of data) {
                                const val = dataElm[property.name];
                                if (val) {
                                    const date = new Date(val);
                                    dataElm[property.name] = date.getFullYear() +
                                        (date.getMonth() + 1).toString().padStart(2, '0') +
                                        date.getDate().toString().padStart(2, '0');
                                }
                                else {
                                    dataElm[property.name] = ''.padEnd(8, '');
                                }
                            }
                        }
                    }

                    // Cambiamos el nombre de las propiedades al de los metadatos
                    // Evitamos así los problemas de prefijos de GML
                    for (const elmData of data) {
                        for (const prop in elmData) {
                            const val = elmData[prop];
                            const metadataProp = dbfMetadata.find((mdProp) => featureTypeMetadata.equals(mdProp.name, prop));
                            if (metadataProp && metadataProp.name !== prop) {
                                delete elmData[prop];
                                elmData[metadataProp.name] = val;
                            }
                        }
                    }

                    // Eliminamos propiedades complejas (p.e. INSPIRE)
                    for (const elmData of data) {
                        for (const prop in elmData) {
                            const val = elmData[prop];
                            if (val && typeof val === 'object') {
                                elmData[prop] = '';
                            }
                        }
                    }

                    // No pasamos los atributos a shpWrite porque no tiene en cuenta metadatos, usamos dbf para ello
                    shpWrite.write([]
                        , geometryType
                        , geometries
                        , function (_empty, content) {
                            content.dbf = dbf.structure(data, dbfMetadata);
                            resolve({ fileName, content });
                        });
                }
                else {
                    shpWrite.write(data
                        , geometryType
                        , geometries
                        , function (_empty, content) {
                            resolve({ fileName, content });
                        });
                }
            }));
        }
    }

    const resolves = [];
    for (var i = 0; i < arrPromises.length; i++) {
        resolves[i] = await arrPromises[i];
    }

    //creamos el fichero zip
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    resolves.forEach(resolve => {
        zip.file(resolve.fileName + ".shp", resolve.content.shp.buffer);
        zip.file(resolve.fileName + ".shx", resolve.content.shx.buffer);
        zip.file(resolve.fileName + ".dbf", resolve.content.dbf.buffer);
        zip.file(resolve.fileName + ".prj", proj.wkt);
        zip.file(resolve.fileName + ".cst", defaultEncoding);
        zip.file(resolve.fileName + ".cpg", defaultEncoding);
    });
    return await zip.generateAsync({ type: "blob" });
};

class Shapefile extends BinaryFormat {
    #shapeParts = {};

    async readFeatures(source, options = {}) {
        let result = null;
        let fileName = options.fileName;
        const getExtension = (fileName) => fileName.substring(fileName.lastIndexOf(".") + 1);
        const getFileNameWithoutExtension = (fileName) => fileName.substring(0, fileName.lastIndexOf("."));
        const fileNameWithoutExtension = getFileNameWithoutExtension(fileName) || fileName;
        fileName = fileName.match(/^(?:spaSITNA)?(.+)/i)[1];

        // Factoría de deferreds (promesas que tienen métodos resolve y reject).
        const defer = () => {
            const methods = {}
            return Object.assign(
                new Promise((resolve, reject) => Object.assign(methods, { resolve, reject })),
                methods
            );
        };

        const resolveFile = (shapeParams, fileName, data) => {
            shapeParams[getExtension(fileName)] = data;
            const deferred = shapeParams.deferreds[shapeParams.fileNames.indexOf(fileName)];
            if (deferred) {
                deferred.resolve();
            }
        };

        //este objeto tiene una referencia al objeto del atributo "filename" del objeto zipCompressed
        let shpParams = null;
        //Si no tiene información referente al shp actual lo inicializo
        if (!Object.prototype.hasOwnProperty.call(this.#shapeParts, fileNameWithoutExtension)) {
            const fileNames = options
                .fileNames
                .filter((fn) => fn.startsWith(fileNameWithoutExtension))
                .filter((fn) => /\.(shp|dbf|str|cst|cpg|prj|shx|idx|sbn|xml)$/ig.test(fn));

            shpParams = this.#shapeParts[fileNameWithoutExtension] = {
                fileNames,
                deferreds: fileNames.map(() => defer())
            };
        }
        else {
            //Si ya hay información del shp la recupero
            shpParams = this.#shapeParts[fileNameWithoutExtension];
        }
        if (/\.(shx|idx|sbn|xml)$/ig.test(fileName)) {
            // Estos archivos no los leo
            resolveFile(shpParams, fileName, null);
            result = true;
        }
        //los ficheros de texto los leo, guardo la promesa en un array para cuando estén todos
        else if (/\.(cst|cpg|prj)$/ig.test(fileName)) {
            resolveFile(shpParams, fileName, new TextDecoder().decode(source));
            result = true;
        }
        //los ficheros binarios los leo, guardo la promesa en un array para cuando estén todos
        else if (/\.(shp|dbf|str)$/ig.test(fileName)) {
            resolveFile(shpParams, fileName, source);
            result = true;

            if (/\.(shp)$/ig.test(fileName)) {
                shpParams.fileName = fileName;
                await Promise.all(shpParams.deferreds);
                const collections = await importFile(shpParams);
                delete this.#shapeParts[fileNameWithoutExtension];
                return collections.map((collection) => {
                    const features = this.readGeoJsonFeatures(collection, options);
                    features.forEach((feat) => this.featureMetadata.set(feat, collection.metadata));
                    return features;
                });
            }
        }
        return result;
    }

    async writeFeatures(features, options = {}) {
        return await exportFeatures(features.map((f) => f._wrap.parent), {
            crs: options.featureProjection,
            adaptNames: options.adaptNames
        });
    }
}

export default Shapefile;
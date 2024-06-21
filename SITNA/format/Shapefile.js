import Consts from '../../TC/Consts';
import Util from '../../TC/Util';
import Point from '../feature/Point';
import Polygon from '../feature/Polygon';
import MultiPolygon from '../feature/MultiPolygon';
import Polyline from '../feature/Polyline';
import MultiPolyline from '../feature/MultiPolyline';

const defaultEncoding = "ISO-8859-1";

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
    [Consts.dataType.FLOAT, dbfDataType.FLOAT],
    [Consts.dataType.DOUBLE, dbfDataType.DOUBLE],
    [Consts.dataType.STRING, dbfDataType.CHARACTER],
    [Consts.dataType.DATE, dbfDataType.DATE],
    [Consts.dataType.DATETIME, dbfDataType.TIMESTAMP]
]);


const importFile = async function ({ fileName, shp, dbf, prj, str, cst, cpg }) {
    if (!shp || !prj || !dbf) {
        throw 'fileImport.shapeImcomplete';
    }

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
        // El parser no añade ids, los añadimos nosotros.
        collection.features.forEach((f, i) => {
            f.id = `${fileName}.${i + 1}`;
        });
        collection.metadata = { ...metadata, ...{ geometries } };
        collection.metadata.geometries = [
            {
                name: 'geometry',
                type: Util.getGeometryType(geometryType),
                originalType: geometryType
            }
        ];
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
            const firstFeature = featureList[0] ?? {};
            const featureTypeMetadata = await firstFeature.layer?.getFeatureTypeMetadata();

            const dbfMetadata = featureTypeMetadata?.attributes.map((attr) => {
                if (attr.name.length > 10 || !/^[a-zA-Z][a-zA-Z0-9_:]*$/.test(attr.name)) {
                    throw Error('Field "' + attr.name + '" is invalid');
                }
                if (featureTypeMetadata.origin === Consts.format.SHAPEFILE && attr.originalType) {
                    return {
                        name: attr.name,
                        type: attr.originalType.dataType,
                        size: attr.originalType.length
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
                        size = 8;
                        break;
                    case dbfDataType.NUMBER:
                    case dbfDataType.FLOAT:
                        size = 18;
                        break;
                }
                return {
                    name: attr.name,
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
                    if (curr.getStyle().label && !curr.data.name)
                        data.name = curr.getStyle().label;
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
                //generamos el un shape mas sus allegados por grupo
                // No pasamos los atributos a shpWrite porque no tiene en cuenta metadatos, usamos dbf para ello
                shpWrite.write([]
                    , geometryType
                    , geometries
                    , function (_empty, content) {
                        content.dbf = dbf.structure(data, dbfMetadata);
                        const fileName = layerId + (groups.size > 1 ? '_' + geometryType : '');
                        resolve({ fileName, content });
                    });
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

export default {
    importFile,
    exportFeatures
};
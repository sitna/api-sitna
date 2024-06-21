import {
    GeoPackageAPI,
    FeatureColumn,
    GeometryColumns,
    DataTypes,
    BoundingBox,
    GeometryData
} from '../../lib/geopackagejs/dist/geopackage-browser';
import Consts from '../../TC/Consts';
import Util from '../../TC/Util';
import Point from '../feature/Point';
import MultiPoint from '../feature/MultiPoint';
import Polyline from '../feature/Polyline';
import MultiPolyline from '../feature/MultiPolyline';
import Polygon from '../feature/Polygon';
import MultiPolygon from '../feature/MultiPolygon';

const dataTypes = new Map([
    [DataTypes.BOOLEAN, Consts.dataType.BOOLEAN],
    [DataTypes.TINYINT, Consts.dataType.TINYINT],
    [DataTypes.SMALLINT, Consts.dataType.SMALLINT],
    [DataTypes.MEDIUMINT, Consts.dataType.MEDIUMINT],
    [DataTypes.INT, Consts.dataType.INTEGER],
    [DataTypes.INTEGER, Consts.dataType.INTEGER],
    [DataTypes.FLOAT, Consts.dataType.FLOAT],
    [DataTypes.DOUBLE, Consts.dataType.DOUBLE],
    [DataTypes.REAL, Consts.dataType.DOUBLE],
    [DataTypes.TEXT, Consts.dataType.STRING],
    [DataTypes.DATE, Consts.dataType.DATE],
    [DataTypes.DATETIME, Consts.dataType.DATETIME]
]);
const gpDataTypes = new Map([
    [Consts.dataType.BOOLEAN, DataTypes.BOOLEAN],
    [Consts.dataType.TINYINT, DataTypes.TINYINT],
    [Consts.dataType.SMALLINT, DataTypes.SMALLINT],
    [Consts.dataType.MEDIUMINT, DataTypes.MEDIUMINT],
    [Consts.dataType.INTEGER, DataTypes.INTEGER],
    [Consts.dataType.FLOAT, DataTypes.FLOAT],
    [Consts.dataType.DOUBLE, DataTypes.DOUBLE],
    [Consts.dataType.STRING, DataTypes.TEXT],
    [Consts.dataType.DATE, DataTypes.DATE],
    [Consts.dataType.DATETIME, DataTypes.DATETIME]
]);

const exportFeatures = async function (features, options = {}) {
    const featuresToExport = features.filter(f => !f.options.noExport);

    const fillGroupMap = function (groupMap, feature) {
        const key = Object.keys(feature.getData()).toString();
        let featureList = groupMap.get(key);
        if (!featureList) {
            featureList = [];
            groupMap.set(key, featureList);
        }
        featureList.push(feature);
        return groupMap;
    };

    const currentCrs = options.crs;
    const { default: wkx } = await import('wkx');
    const myPackage = await GeoPackageAPI.create();

    const fieldDataType = function (metadata, name, value) {
        const dataType = getFieldDataTypeByMetadata(metadata, name);
        if (dataType === null) {
            return getFieldDataTypeByValue(value);
        }
        return dataType;
    };
    const getFieldDataTypeByMetadata = function (metadata, name) {
        if (metadata) {
            const attr = metadata?.attributes.find(c => c.name === name);
            if (attr) {
                if (metadata.origin === Consts.format.GEOPACKAGE) {
                    return attr.originalType;
                }
                const value = gpDataTypes.get(attr.type);
                if (value === undefined) {
                    return DataTypes.TEXT;
                }
                return value;
            }
        }
        return null;
    };
    const getFieldDataTypeByValue = function (value) {
        let name = '';
        switch (typeof value) {
            case "string":
                name = DataTypes.TEXT;
                break;
            case "number":
                if (value % 1 === 0)
                    name = DataTypes.INT;
                else
                    name = DataTypes.FLOAT;
                break;
            case "boolean":
                name = DataTypes.BOOLEAN;
                break;
            default:
                name = DataTypes.TEXT;
            //date y datetime
        }
        return name;
    };
    const getSerializableValue = function (value, type) {
        switch (type) {
            case DataTypes.DATE:
            case DataTypes.DATETIME:
                return new Date(value);
            default:
                return value;
        }
    }

    var srs_id = currentCrs.substr(currentCrs.indexOf(":") + 1);
    if (!myPackage.spatialReferenceSystemDao.queryForId(srs_id)) {
        var newSRS = myPackage.spatialReferenceSystemDao.createObject();
        var projData = await TC.getProjectionData({ crs: currentCrs });
        newSRS.srs_name = currentCrs;
        newSRS.srs_id = projData.code;
        newSRS.organization = currentCrs.substr(0, currentCrs.indexOf(":"));
        newSRS.organization_coordsys_id = projData.code;
        newSRS.definition = projData.proj4.trim();
        newSRS.definition_12_063 = projData.wkt.trim();
        newSRS.description = projData.name;
        myPackage.spatialReferenceSystemDao.create(newSRS);
    }
    //agrupar por capa
    //const timestamp = options.fileName.substring(options.fileName.lastIndexOf("_", options.fileName.lastIndexOf("_") - 1) + 1); 
    const layers = featuresToExport.reduce(function (rv, feature) {
        var id = typeof feature.id === "string" ? feature.id.substr(0, feature.id.lastIndexOf(".")) : options.fileName;
        //var id = feature.layer ? (typeof (feature.layer) === "string" ? feature.layer : feature.layer.id) : feature.id.substr(0, feature.id.lastIndexOf("."));
        (rv[id] = rv[id] || []).push(feature);
        return rv;
    }, {});
    let layerId;
    for (layerId in layers) {
        //agrupar las features por estructura de atributos
        const groups = layers[layerId].reduce(fillGroupMap, new Map());
        let groupIndex = 0;
        for (let featureList of groups.values()) {
            //crear columnas
            const firstFeature = featureList[0] ?? {};
            const featureTypeMetadata = await firstFeature.layer?.getFeatureTypeMetadata();

            let i = 0;

            const geometryType = featureList.reduce((type, feat, idx) => {
                let newType;
                switch (true) {
                    case feat instanceof Polyline:
                        newType = 'LineString';
                        break;
                    case feat instanceof MultiPolyline:
                        newType = 'MultiLineString';
                        break;
                    case feat instanceof Point:
                        newType = 'Point';
                        break;
                    case feat instanceof MultiPoint:
                        newType = 'MultiPoint';
                        break;
                    case feat instanceof Polygon:
                        newType = 'Polygon';
                        break;
                    case feat instanceof MultiPolygon:
                        newType = 'MultiPolygon';
                        break;
                    default:
                        newType = 'Geometry';
                }
                if (idx > 0 && newType !== type) {
                    newType = 'Geometry';
                }
                return newType;
            }, 'Geometry');

            const tableName = layerId + (groups.size > 1 ? "_" + groupIndex++ : "");// + (timestamp ? "_" + timestamp : "");
            var columns = [];
            //var dataColumns = [];
            const pkColumn = featureTypeMetadata?.attributes.find(c => c.isId);
            const pkColumnName = pkColumn?.name ?? 'id';

            if (pkColumn || Object.prototype.hasOwnProperty.call(featuresToExport[0], "id") ||
                Object.prototype.hasOwnProperty.call(featuresToExport[0], "ID")) {
                columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(i++, pkColumnName));
            }
            columns.push(FeatureColumn.createGeometryColumn(i++, 'geometry', geometryType.toUpperCase(), true, null));

            var bounds = [Infinity, Infinity, -Infinity, -Infinity];
            for (var j = 0; j < featureList.length; j++) {
                var b = featureList[j].getBounds();
                if (b) {
                    bounds[0] = Math.min(bounds[0], b[0]);
                    bounds[1] = Math.min(bounds[1], b[1]);
                    bounds[2] = Math.max(bounds[2], b[2]);
                    bounds[3] = Math.max(bounds[3], b[3]);
                }
            }

            for (var x in firstFeature.data || firstFeature.attributes || {}) {
                var fieldName = firstFeature.attributes && firstFeature.attributes[x] ? firstFeature.attributes[x].name : x;
                if (fieldName.toLowerCase() === pkColumnName) continue;
                var fieldValue = firstFeature.data[fieldName];
                const c = FeatureColumn.createColumn(i++, fieldName, fieldDataType(featureTypeMetadata, fieldName, fieldValue));
                columns.push(c);
                //dataColumns.push(c);
            }
            //si alguna feature tiene simbología de tipo texto se añade como una columna más a la tabla llamada "name"
            if (featureList.some(f => f.getStyle().label && !f.data.name)) {
                const c = FeatureColumn.createColumn(i++, "name", DataTypes.TEXT);
                columns.push(c);
            }


            var geometryColumns = new GeometryColumns();
            geometryColumns.table_name = tableName;
            geometryColumns.column_name = 'geometry';
            geometryColumns.geometry_type_name = geometryType.toUpperCase();
            geometryColumns.z = firstFeature.getGeometryStride?.() ?? 2;
            geometryColumns.m = 2;
            geometryColumns.srs_id = srs_id;
            i = 0;
            const boundingBox = new BoundingBox(bounds[0], bounds[2], bounds[1], bounds[3]);
            await myPackage.createFeatureTable(tableName, geometryColumns, columns, boundingBox, srs_id)
            //geopackage.createFeatureTableWithDataColumnsAndBoundingBox(myPackage, tableName, geometryColumns, columns, null, boundingBox, srs_id)
            const featureDao = myPackage.getFeatureDao(tableName);
            for (let i = 0; i < featureList.length; i++) {
                const feature = featureList[i];
                const featureRow = featureDao.newRow();
                const geometryData = new GeometryData();
                geometryData.setSrsId(srs_id);
                const geometry = wkx.Geometry.parse('SRID=' + srs_id + ';' + new ol.format.WKT().writeFeature(feature.wrap.feature));
                //const geometry=(hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))))(new ol.format.WKB().writeGeometry(feature.wrap.feature.getGeometry(),{featureProjection:currentCrs,dataProjection:currentCrs}));
                geometryData.setGeometry(geometry);
                featureRow.setValueWithColumnName(featureRow.geometryColumn.name, geometryData);
                if (Object.prototype.hasOwnProperty.call(feature, "id") ||
                    Object.prototype.hasOwnProperty.call(feature, "ID"))
                    featureRow.setValueWithColumnName(pkColumnName, typeof feature.id === "string" ? feature.id.substring(feature.id.lastIndexOf(".") + 1) : feature.id);
                else if (Object.prototype.hasOwnProperty.call(feature.data, "id") ||
                    Object.prototype.hasOwnProperty.call(feature.data, "ID"))
                    featureRow.setValueWithColumnName(pkColumnName, typeof feature.id === "string" ? feature.id.substring(feature.id.lastIndexOf(".") + 1) : feature.id);
                for (var y in feature.data || feature.attributes) {
                    const fieldName = firstFeature.attributes && firstFeature.attributes[y] ? firstFeature.attributes[x].name : y;
                    if (fieldName === pkColumnName) {
                        continue;
                    }
                    const fieldValue = getSerializableValue(feature.data[fieldName], columns.find(c => c.name === fieldName).dataType);
                    featureRow.setValueWithColumnName(fieldName, fieldValue);
                }
                if (featureDao.columns.indexOf("name") >= 0 && !feature.data.name) {
                    featureRow.setValueWithColumnName("name", feature.getStyle().label);
                }

                featureDao.create(featureRow);
            }
        }
    }

    return await myPackage.export();
};

const importFile = async function (buffer) {
    const myPackage = await GeoPackageAPI.open(buffer);
    const vectorLayers = myPackage.getFeatureTables();
    const numTables = vectorLayers.length;
    var notLoaded = 0;
    const results = [];

    if (vectorLayers.length > 1) self.parent.dropFilesCounter = self.parent.dropFilesCounter + vectorLayers.length - 1;
    for (var i = 0; i < vectorLayers.length; i++) {
        const tableMetadata = myPackage.getInfoForTable(myPackage.getFeatureDao(vectorLayers[i]));
        const arr = [];
        for (let row of myPackage.iterateGeoJSONFeatures(vectorLayers[i])) {
            if (row.geometry) {
                row.type = "Feature";
                for (let key in row.properties) {
                    const prop = row.properties[key];
                    const dataColumn = tableMetadata.columns.find(c => c.name === key);
                    if (dataColumn.primaryKey) {
                        row.id = vectorLayers[i] + "." + prop;
                        delete row.properties[key];
                    }
                    if (dataColumn?.dataType === DataTypes.BOOLEAN) {
                        row.properties[key] = !!prop;
                    }
                }
                arr[arr.length] = row;
            }
        }
        if (!arr.length) throw 'empty table';

        results.push({
            metadata: getFeatureTypeMetadata(tableMetadata),
            type: "FeatureCollection",
            features: arr
        });
    }
    if (numTables === notLoaded) {
        throw "Error: No hay capas vectoriales válidas que mostrar";
    }
    return results;
}

const getFeatureTypeMetadata = function (tableMetadata) {
    const getType = (gpType) => {
        if (gpType === undefined) {
            return null;
        }
        const value = dataTypes.get(gpType);
        if (value === undefined) {
            return Consts.dataType.STRING;
        }
        return value;
    };
    return {
        name: tableMetadata.tableName,
        origin: Consts.format.GEOPACKAGE,
        originalData: tableMetadata,
        geometries: [
            {
                name: tableMetadata.geometryColumns.geometryColumn,
                type: Util.getGeometryType(tableMetadata.geometryColumns.geometryTypeName),
                originalType: tableMetadata.geometryColumns.geometryTypeName
            }
        ],
        attributes: tableMetadata
            .columns
            .filter(c => typeof c.dataType === 'number')
            .map(c => ({
                name: c.name,
                type: getType(c.dataType),
                originalType: c.dataType,
                isId: c.primaryKey
            }))
    };
};

export default {
    exportFeatures,
    importFile
};
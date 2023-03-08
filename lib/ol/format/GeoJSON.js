/**
 * @module ol/format/GeoJSON
 */
import GeoJSON from '../../../node_modules/ol/format/GeoJSON';
import Feature from '../../../node_modules/ol/Feature.js';
import GeometryCollection from '../../../node_modules/ol/geom/GeometryCollection.js';
import GeometryType from '../../../node_modules/ol/geom/GeometryType.js';
import JSONFeature from '../../../node_modules/ol/format/JSONFeature.js';
import LineString from '../../../node_modules/ol/geom/LineString.js';
import MultiLineString from '../../../node_modules/ol/geom/MultiLineString.js';
import MultiPoint from '../../../node_modules/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../node_modules/ol/geom/MultiPolygon.js';
import Point from '../../../node_modules/ol/geom/Point.js';
import Polygon from '../../../node_modules/ol/geom/Polygon.js';
import { assert } from '../../../node_modules/ol/asserts.js';
import { assign, isEmpty } from '../../../node_modules/ol/obj.js';
import { get as getProjection } from '../../../node_modules/ol/proj.js';
import { transformGeometryWithOptions } from '../../../node_modules/ol/format/Feature.js';
/**
     * @param {Object} object Object.
     * @param {import("./Feature.js").ReadOptions} [opt_options] Read options.
     * @protected
     * @return {import("../Feature.js").default} Feature.
     */
GeoJSON.prototype.readFeatureFromObject = function (object, opt_options) {
    /**
     * @type {GeoJSONFeature}
     */
    var geoJSONFeature = null;
    if (object['type'] === 'Feature') {
        geoJSONFeature = /** @type {GeoJSONFeature} */ (object);
    }
    else {
        geoJSONFeature = {
            'type': 'Feature',
            'geometry': /** @type {GeoJSONGeometry} */ (object),
            'properties': null,
        };
    }
    //var geometry = readGeometry(geoJSONFeature['geometry'], opt_options);
    const geometry = (geoJSONFeature['geometry'] && geoJSONFeature['geometry']["coordinates"] && geoJSONFeature['geometry']["coordinates"].length) ? readGeometry(geoJSONFeature['geometry'], opt_options) : null;
    var feature = new Feature();
    if (this.geometryName_) {
        feature.setGeometryName(this.geometryName_);
    }
    else if (this.extractGeometryName_ &&
        'geometry_name' in geoJSONFeature !== undefined) {
        feature.setGeometryName(geoJSONFeature['geometry_name']);
    }
    feature.setGeometry(geometry);
    if ('id' in geoJSONFeature) {
        feature.setId(geoJSONFeature['id']);
    }
    if (geoJSONFeature['properties']) {
        feature.setProperties(geoJSONFeature['properties'], true);
    }
    return feature;
};

function readGeometry(object, opt_options) {
    if (!object) {
        return null;
    }
    /**
     * @type {import("../geom/Geometry.js").default}
     */
    var geometry;
    switch (object['type']) {
        case GeometryType.POINT: {
            geometry = readPointGeometry(/** @type {GeoJSONPoint} */(object));
            break;
        }
        case GeometryType.LINE_STRING: {
            geometry = readLineStringGeometry(
            /** @type {GeoJSONLineString} */(object));
            break;
        }
        case GeometryType.POLYGON: {
            geometry = readPolygonGeometry(/** @type {GeoJSONPolygon} */(object));
            break;
        }
        case GeometryType.MULTI_POINT: {
            geometry = readMultiPointGeometry(
            /** @type {GeoJSONMultiPoint} */(object));
            break;
        }
        case GeometryType.MULTI_LINE_STRING: {
            geometry = readMultiLineStringGeometry(
            /** @type {GeoJSONMultiLineString} */(object));
            break;
        }
        case GeometryType.MULTI_POLYGON: {
            geometry = readMultiPolygonGeometry(
            /** @type {GeoJSONMultiPolygon} */(object));
            break;
        }
        case GeometryType.GEOMETRY_COLLECTION: {
            geometry = readGeometryCollectionGeometry(
            /** @type {GeoJSONGeometryCollection} */(object));
            break;
        }
        default: {
            throw new Error('Unsupported GeoJSON type: ' + object.type);
        }
    }
    return transformGeometryWithOptions(geometry, false, opt_options);
}
/**
 * @param {GeoJSONGeometryCollection} object Object.
 * @param {import("./Feature.js").ReadOptions} [opt_options] Read options.
 * @return {GeometryCollection} Geometry collection.
 */
function readGeometryCollectionGeometry(object, opt_options) {
    var geometries = object['geometries'].map(
        /**
         * @param {GeoJSONGeometry} geometry Geometry.
         * @return {import("../geom/Geometry.js").default} geometry Geometry.
         */
        function (geometry) {
            return readGeometry(geometry, opt_options);
        });
    return new GeometryCollection(geometries);
}
/**
 * @param {GeoJSONPoint} object Object.
 * @return {Point} Point.
 */
function readPointGeometry(object) {
    return new Point(object['coordinates']);
}
/**
 * @param {GeoJSONLineString} object Object.
 * @return {LineString} LineString.
 */
function readLineStringGeometry(object) {
    return new LineString(object['coordinates']);
}
/**
 * @param {GeoJSONMultiLineString} object Object.
 * @return {MultiLineString} MultiLineString.
 */
function readMultiLineStringGeometry(object) {
    return new MultiLineString(object['coordinates']);
}
/**
 * @param {GeoJSONMultiPoint} object Object.
 * @return {MultiPoint} MultiPoint.
 */
function readMultiPointGeometry(object) {
    return new MultiPoint(object['coordinates']);
}
/**
 * @param {GeoJSONMultiPolygon} object Object.
 * @return {MultiPolygon} MultiPolygon.
 */
function readMultiPolygonGeometry(object) {
    return new MultiPolygon(object['coordinates']);
}
/**
 * @param {GeoJSONPolygon} object Object.
 * @return {Polygon} Polygon.
 */
function readPolygonGeometry(object) {
    return new Polygon(object['coordinates']);
}
/**
 * @param {import("../geom/Geometry.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeGeometry(geometry, opt_options) {
    geometry = transformGeometryWithOptions(geometry, true, opt_options);
    var type = geometry.getType();
    /** @type {GeoJSONGeometry} */
    var geoJSON;
    switch (type) {
        case GeometryType.POINT: {
            geoJSON = writePointGeometry(
            /** @type {Point} */(geometry), opt_options);
            break;
        }
        case GeometryType.LINE_STRING: {
            geoJSON = writeLineStringGeometry(
            /** @type {LineString} */(geometry), opt_options);
            break;
        }
        case GeometryType.POLYGON: {
            geoJSON = writePolygonGeometry(
            /** @type {Polygon} */(geometry), opt_options);
            break;
        }
        case GeometryType.MULTI_POINT: {
            geoJSON = writeMultiPointGeometry(
            /** @type {MultiPoint} */(geometry), opt_options);
            break;
        }
        case GeometryType.MULTI_LINE_STRING: {
            geoJSON = writeMultiLineStringGeometry(
            /** @type {MultiLineString} */(geometry), opt_options);
            break;
        }
        case GeometryType.MULTI_POLYGON: {
            geoJSON = writeMultiPolygonGeometry(
            /** @type {MultiPolygon} */(geometry), opt_options);
            break;
        }
        case GeometryType.GEOMETRY_COLLECTION: {
            geoJSON = writeGeometryCollectionGeometry(
            /** @type {GeometryCollection} */(geometry), opt_options);
            break;
        }
        case GeometryType.CIRCLE: {
            geoJSON = {
                type: 'GeometryCollection',
                geometries: [],
            };
            break;
        }
        default: {
            throw new Error('Unsupported geometry type: ' + type);
        }
    }
    return geoJSON;
}
/**
 * @param {GeometryCollection} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
 * @return {GeoJSONGeometryCollection} GeoJSON geometry collection.
 */
function writeGeometryCollectionGeometry(geometry, opt_options) {
    var geometries = geometry.getGeometriesArray().map(function (geometry) {
        var options = assign({}, opt_options);
        delete options.featureProjection;
        return writeGeometry(geometry, options);
    });
    return {
        type: 'GeometryCollection',
        geometries: geometries,
    };
}
/**
 * @param {LineString} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeLineStringGeometry(geometry, opt_options) {
    return {
        type: 'LineString',
        coordinates: geometry.getCoordinates(),
    };
}
/**
 * @param {MultiLineString} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiLineStringGeometry(geometry, opt_options) {
    return {
        type: 'MultiLineString',
        coordinates: geometry.getCoordinates(),
    };
}
/**
 * @param {MultiPoint} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiPointGeometry(geometry, opt_options) {
    return {
        type: 'MultiPoint',
        coordinates: geometry.getCoordinates(),
    };
}
/**
 * @param {MultiPolygon} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiPolygonGeometry(geometry, opt_options) {
    var right;
    if (opt_options) {
        right = opt_options.rightHanded;
    }
    return {
        type: 'MultiPolygon',
        coordinates: geometry.getCoordinates(right),
    };
}
/**
 * @param {Point} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writePointGeometry(geometry, opt_options) {
    return {
        type: 'Point',
        coordinates: geometry.getCoordinates(),
    };
}
/**
 * @param {Polygon} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [opt_options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writePolygonGeometry(geometry, opt_options) {
    var right;
    if (opt_options) {
        right = opt_options.rightHanded;
    }
    return {
        type: 'Polygon',
        coordinates: geometry.getCoordinates(right),
    };
}

export default GeoJSON;
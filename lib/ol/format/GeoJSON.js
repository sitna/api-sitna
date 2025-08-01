import GeoJSON_ from 'ol/format/GeoJSON.js';
import Feature from 'ol/Feature.js';
import RenderFeature from 'ol/render/Feature.js';
import {
    createGeometry,
    createRenderFeature,
    transformGeometryWithOptions,
} from 'ol/format/Feature.js';
import {
    deflateCoordinatesArray,
    deflateMultiCoordinatesArray,
} from 'ol/geom/flat/deflate.js';
import { getLayoutForStride } from 'ol/geom/SimpleGeometry.js';
import Geometry from 'ol/geom/Geometry.js';
import { isEmpty } from 'ol/obj.js';


const filterProperties = function (properties) {
    if (!properties || typeof properties !== 'object') {
        return properties;
    }
    if (Array.isArray(properties)) {
        return properties.map((val) => filterProperties(val));
    }
    const result = {};
    for (const key in properties) {
        const value = properties[key];
        if (!(value instanceof Geometry)) {
            result[key] = filterProperties(value);
        }
    }
    return result;
};

class GeoJSON extends GeoJSON_ {

    /**
     * @param {Object} object Object.
     * @param {import("./Feature.js").ReadOptions} [options] Read options.
     * @protected
     * @return {Feature|RenderFeature|Array<RenderFeature>}.default} Feature.
     */
    readFeatureFromObject(object, options) {
        /**
         * @type {GeoJSONFeature}
         */
        let geoJSONFeature = null;
        if (object['type'] === 'Feature') {
            geoJSONFeature = /** @type {GeoJSONFeature} */ (object);
        } else {
            geoJSONFeature = {
                'type': 'Feature',
                'geometry': /** @type {GeoJSONGeometry} */ (object),
                'properties': null,
            };
        }

        //const geometry = readGeometryInternal(geoJSONFeature['geometry'], options);
        const geometry = geoJSONFeature.geometry?.coordinates?.length ? readGeometryInternal(geoJSONFeature['geometry'], options) : null;
        if (this.featureClass === RenderFeature) {
            return createRenderFeature(
                {
                    geometry,
                    id: geoJSONFeature['id'],
                    properties: geoJSONFeature['properties'],
                },
                options
            );
        }

        const feature = new Feature();
        if (this.geometryName_) {
            feature.setGeometryName(this.geometryName_);
        } else if (
            this.extractGeometryName_ &&
            'geometry_name' in geoJSONFeature !== undefined
        ) {
            feature.setGeometryName(geoJSONFeature['geometry_name']);
        }
        feature.setGeometry(createGeometry(geometry, options));

        if ('id' in geoJSONFeature) {
            feature.setId(geoJSONFeature['id']);
        }

        if (geoJSONFeature['properties']) {
            feature.setProperties(geoJSONFeature['properties'], true);
        }
        return feature;
    }

    /**
     * Encode a feature as a GeoJSON Feature object.
     *
     * @param {import("../Feature.js").default} feature Feature.
     * @param {import("./Feature.js").WriteOptions} [options] Write options.
     * @return {GeoJSONFeature} Object.
     * @api
     */
    writeFeatureObject(feature, options) {
        options = this.adaptOptions(options);

        /** @type {GeoJSONFeature} */
        const object = {
            'type': 'Feature',
            geometry: null,
            properties: null,
        };

        const id = feature.getId();
        if (id !== undefined) {
            object.id = id;
        }

        if (!feature.hasProperties()) {
            return object;
        }

        const properties = feature.getProperties();
        const geometry = feature.getGeometry();
        if (geometry) {
            object.geometry = writeGeometry(geometry, options);

            delete properties[feature.getGeometryName()];
        }

        if (!isEmpty(properties)) {
            object.properties = filterProperties(properties);
        }

        return object;
    }
}

/**
 * @param {GeoJSONGeometry|GeoJSONGeometryCollection} object Object.
 * @param {import("./Feature.js").ReadOptions} [options] Read options.
 * @return {import("./Feature.js").GeometryObject} Geometry.
 */
function readGeometryInternal(object, options) {
    if (!object) {
        return null;
    }

    /** @type {import("./Feature.js").GeometryObject} */
    let geometry;
    switch (object['type']) {
        case 'Point': {
            geometry = readPointGeometry(/** @type {GeoJSONPoint} */(object));
            break;
        }
        case 'LineString': {
            geometry = readLineStringGeometry(
        /** @type {GeoJSONLineString} */(object)
            );
            break;
        }
        case 'Polygon': {
            geometry = readPolygonGeometry(/** @type {GeoJSONPolygon} */(object));
            break;
        }
        case 'MultiPoint': {
            geometry = readMultiPointGeometry(
        /** @type {GeoJSONMultiPoint} */(object)
            );
            break;
        }
        case 'MultiLineString': {
            geometry = readMultiLineStringGeometry(
        /** @type {GeoJSONMultiLineString} */(object)
            );
            break;
        }
        case 'MultiPolygon': {
            geometry = readMultiPolygonGeometry(
        /** @type {GeoJSONMultiPolygon} */(object)
            );
            break;
        }
        case 'GeometryCollection': {
            geometry = readGeometryCollectionGeometry(
        /** @type {GeoJSONGeometryCollection} */(object)
            );
            break;
        }
        default: {
            throw new Error('Unsupported GeoJSON type: ' + object['type']);
        }
    }
    return geometry;
}

/**
 * @param {GeoJSONGeometryCollection} object Object.
 * @param {import("./Feature.js").ReadOptions} [options] Read options.
 * @return {import("./Feature.js").GeometryCollectionObject} Geometry collection.
 */
function readGeometryCollectionGeometry(object, options) {
    const geometries = object['geometries'].map(
        /**
         * @param {GeoJSONGeometry} geometry Geometry.
         * @return {import("./Feature.js").GeometryObject} geometry Geometry.
         */
        function (geometry) {
            return readGeometryInternal(geometry, options);
        }
    );
    return geometries;
}

/**
 * @param {GeoJSONPoint} object Input object.
 * @return {import("./Feature.js").GeometryObject} Point geometry.
 */
function readPointGeometry(object) {
    const flatCoordinates = object['coordinates'];
    return {
        type: 'Point',
        flatCoordinates,
        layout: getLayoutForStride(flatCoordinates.length),
    };
}

/**
 * @param {GeoJSONLineString} object Object.
 * @return {import("./Feature.js").GeometryObject} LineString geometry.
 */
function readLineStringGeometry(object) {
    const coordinates = object['coordinates'];
    const flatCoordinates = coordinates.flat();
    return {
        type: 'LineString',
        flatCoordinates,
        ends: [flatCoordinates.length],
        layout: getLayoutForStride(coordinates[0].length),
    };
}

/**
 * @param {GeoJSONMultiLineString} object Object.
 * @return {import("./Feature.js").GeometryObject} MultiLineString geometry.
 */
function readMultiLineStringGeometry(object) {
    const coordinates = object['coordinates'];
    const stride = coordinates[0][0].length;
    const flatCoordinates = [];
    const ends = deflateCoordinatesArray(flatCoordinates, 0, coordinates, stride);
    return {
        type: 'MultiLineString',
        flatCoordinates,
        ends,
        layout: getLayoutForStride(stride),
    };
}

/**
 * @param {GeoJSONMultiPoint} object Object.
 * @return {import("./Feature.js").GeometryObject} MultiPoint geometry.
 */
function readMultiPointGeometry(object) {
    const coordinates = object['coordinates'];
    return {
        type: 'MultiPoint',
        flatCoordinates: coordinates.flat(),
        layout: getLayoutForStride(coordinates[0].length),
    };
}

/**
 * @param {GeoJSONMultiPolygon} object Object.
 * @return {import("./Feature.js").GeometryObject} MultiPolygon geometry.
 */
function readMultiPolygonGeometry(object) {
    const coordinates = object['coordinates'];
    const flatCoordinates = [];
    const stride = coordinates[0][0][0].length;
    const endss = deflateMultiCoordinatesArray(
        flatCoordinates,
        0,
        coordinates,
        stride
    );
    return {
        type: 'MultiPolygon',
        flatCoordinates,
        ends: endss,
        layout: getLayoutForStride(stride),
    };
}

/**
 * @param {GeoJSONPolygon} object Object.
 * @return {import("./Feature.js").GeometryObject} Polygon.
 */
function readPolygonGeometry(object) {
    const coordinates = object['coordinates'];
    const flatCoordinates = [];
    const stride = coordinates[0][0].length;
    const ends = deflateCoordinatesArray(flatCoordinates, 0, coordinates, stride);
    return {
        type: 'Polygon',
        flatCoordinates,
        ends,
        layout: getLayoutForStride(stride),
    };
}

/**
 * @param {import("../geom/Geometry.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeGeometry(geometry, options) {
    geometry = transformGeometryWithOptions(geometry, true, options);

    const type = geometry.getType();

    /** @type {GeoJSONGeometry} */
    let geoJSON;
    switch (type) {
        case 'Point': {
            geoJSON = writePointGeometry(
        /** @type {import("../geom/Point.js").default} */(geometry),
                options
            );
            break;
        }
        case 'LineString': {
            geoJSON = writeLineStringGeometry(
        /** @type {import("../geom/LineString.js").default} */(geometry),
                options
            );
            break;
        }
        case 'Polygon': {
            geoJSON = writePolygonGeometry(
        /** @type {import("../geom/Polygon.js").default} */(geometry),
                options
            );
            break;
        }
        case 'MultiPoint': {
            geoJSON = writeMultiPointGeometry(
        /** @type {import("../geom/MultiPoint.js").default} */(geometry),
                options
            );
            break;
        }
        case 'MultiLineString': {
            geoJSON = writeMultiLineStringGeometry(
        /** @type {import("../geom/MultiLineString.js").default} */(geometry),
                options
            );
            break;
        }
        case 'MultiPolygon': {
            geoJSON = writeMultiPolygonGeometry(
        /** @type {import("../geom/MultiPolygon.js").default} */(geometry),
                options
            );
            break;
        }
        case 'GeometryCollection': {
            geoJSON = writeGeometryCollectionGeometry(
        /** @type {import("../geom/GeometryCollection.js").default} */(
                    geometry
                ),
                options
            );
            break;
        }
        case 'Circle': {
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
 * @param {import("../geom/GeometryCollection.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometryCollection} GeoJSON geometry collection.
 */
function writeGeometryCollectionGeometry(geometry, options) {
    options = Object.assign({}, options);
    delete options.featureProjection;
    const geometries = geometry.getGeometriesArray().map(function (geometry) {
        return writeGeometry(geometry, options);
    });
    return {
        type: 'GeometryCollection',
        geometries: geometries,
    };
}

/**
 * @param {import("../geom/LineString.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeLineStringGeometry(geometry, options) {
    return {
        type: 'LineString',
        coordinates: geometry.getCoordinates(),
    };
}

/**
 * @param {import("../geom/MultiLineString.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiLineStringGeometry(geometry, options) {
    return {
        type: 'MultiLineString',
        coordinates: geometry.getCoordinates(),
    };
}

/**
 * @param {import("../geom/MultiPoint.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiPointGeometry(geometry, options) {
    return {
        type: 'MultiPoint',
        coordinates: geometry.getCoordinates(),
    };
}

/**
 * @param {import("../geom/MultiPolygon.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writeMultiPolygonGeometry(geometry, options) {
    let right;
    if (options) {
        right = options.rightHanded;
    }
    return {
        type: 'MultiPolygon',
        coordinates: geometry.getCoordinates(right),
    };
}

/**
 * @param {import("../geom/Point.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writePointGeometry(geometry, options) {
    return {
        type: 'Point',
        coordinates: geometry.getCoordinates(),
    };
}

/**
 * @param {import("../geom/Polygon.js").default} geometry Geometry.
 * @param {import("./Feature.js").WriteOptions} [options] Write options.
 * @return {GeoJSONGeometry} GeoJSON geometry.
 */
function writePolygonGeometry(geometry, options) {
    let right;
    if (options) {
        right = options.rightHanded;
    }
    return {
        type: 'Polygon',
        coordinates: geometry.getCoordinates(right),
    };
}

export default GeoJSON;


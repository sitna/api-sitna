import { VERSION } from 'ol/util.js';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import Overlay from 'ol/Overlay.js';
import Collection from 'ol/Collection.js';
import { extend } from 'ol/array.js';
import { assert } from 'ol/asserts.js';
import { asArray, asString } from 'ol/color.js';
import { toRadians } from 'ol/math.js';
import { padNumber } from 'ol/string.js';
import MapEventType from 'ol/MapEventType.js';
import MapBrowserEventType from 'ol/MapBrowserEventType.js';
import { OverviewMap, ScaleLine, Zoom, ZoomSlider, ZoomToExtent } from 'ol/control.js';
import { listen, unlistenByKey } from 'ol/events.js';
import { shiftKeyOnly } from 'ol/events/condition.js';
import e_EventType from 'ol/events/EventType.js';
import { getWidth, getHeight, containsCoordinate, containsExtent, buffer, extend as extend_e } from 'ol/extent.js';
import Feature from 'ol/Feature.js';
import { createStyleFunction } from 'ol/Feature.js';
import {
    Geometry as g_Geometry,
    Point,
    MultiPoint,
    LineString,
    MultiLineString,
    Polygon,
    MultiPolygon,
    Circle as g_Circle
} from 'ol/geom.js';
import GeometryCollection from 'ol/geom/GeometryCollection.js';
import { deflateCoordinates } from 'ol/geom/flat/deflate.js';
import { inflateCoordinates } from 'ol/geom/flat/inflate.js';
import { linearRingLength } from 'ol/geom/flat/length.js';
import { xhr } from 'ol/featureloader.js';
import GMLBase from '../../lib/ol/format/GMLBase.js';
import XMLFeature from 'ol/format/XMLFeature.js';
import GML from 'ol/format/GML.js';
import { WFS, WKT, WKB, WMSCapabilities, WMSGetFeatureInfo, WMTSCapabilities, TopoJSON } from 'ol/format.js';
import GeoJSON from '../../lib/ol/format/GeoJSON.js';
import FeatureFormat from 'ol/format/Feature.js';
import GPX from '../../lib/ol/format/GPX.js';
import KML from '../../lib/ol/format/KML.js';
import GeoPackage from '../../SITNA/format/GeoPackage.js';
import Shapefile from '../../SITNA/format/Shapefile.js';
import { transformGeometryWithOptions } from 'ol/format/Feature.js';
import GML2 from 'ol/format/GML2.js';
import GML3 from 'ol/format/GML3.js';
import GML32 from '../../lib/ol/format/GML32.js';
import {
    defaults,
    Draw,
    Pointer,
    Translate,
    Snap,
    Select,
    Modify,
    /*DragAndDrop, */
    DoubleClickZoom
} from 'ol/interaction.js';
import DragAndDrop from '../../lib/ol/interaction/DragAndDrop.js';
import { Layer, Tile, Image as l_Image, Vector as l_Vector, /*WebGLVector,*/ Heatmap } from 'ol/layer.js';
import TileGrid from 'ol/tilegrid/TileGrid.js';
import { unByKey } from 'ol/Observable.js';

import BaseObject from 'ol/Object.js';
import {
    METERS_PER_UNIT,
    Projection,
    addEquivalentProjections,
    get,
    getTransform,
    transform,
    transformExtent
} from 'ol/proj.js';
import { METERS_PER_UNIT as g_METERS_PER_UNIT, PROJECTIONS } from 'ol/proj/epsg4326.js';
import { register } from 'ol/proj/proj4.js';
import { getVectorContext, toContext } from 'ol/render.js';
import r_EventType from 'ol/render/EventType.js';
import { Vector as s_Vector, Cluster, ImageWMS, WMTS, ImageCanvas } from 'ol/source.js';
//import OGCMapTile from 'ol/source/OGCMapTile.js';
import TileEventType from 'ol/source/TileEventType.js';
import VectorEventType from 'ol/source/VectorEventType.js';
import { optionsFromCapabilities } from 'ol/source/WMTS.js';
import { defaultImageLoadFunction } from 'ol/source/Image.js';
import { Style, RegularShape, Circle as s_Circle, Fill, Icon, Stroke, Text } from 'ol/style.js';
import {
    parse,
    parseNode,
    createElementNS,
    pushParseAndPop,
    pushSerializeAndPop,
    makeStructureNS,
    getAllTextContent,
    makeChildAppender,
    makeReplacer,
    makeSequence,
    makeArrayPusher,
    makeArrayExtender,
    makeArraySerializer,
    makeObjectPropertySetter,
    makeSimpleNodeFactory,
    OBJECT_PROPERTY_NODE_FACTORY,
    XML_SCHEMA_INSTANCE_URI
} from 'ol/xml.js';
import {
    readDecimal,
    readBoolean,
    readString,
    readPositiveInteger,
    readDateTime,
    writeStringTextNode,
    writeCDATASection,
    writeDecimalTextNode,
    writeBooleanTextNode,
    writeNonNegativeIntegerTextNode
} from 'ol/format/xsd.js';
import Image from 'ol/Image.js';

import proj4 from 'proj4';
import TC from '../../TC.js';
import wrap from '../wrap.js';
import Util from '../Util.js';
import Consts from '../Consts.js';
import Feature_s from '../../SITNA/feature/Feature.js';
import Point_s from '../../SITNA/feature/Point.js';
import Marker from '../../SITNA/feature/Marker.js';
import Polyline from '../../SITNA/feature/Polyline.js';
import Polygon_s from '../../SITNA/feature/Polygon.js';
import MultiPoint_s from '../../SITNA/feature/MultiPoint.js';
import MultiMarker from '../../SITNA/feature/MultiMarker.js';
import MultiPolyline from '../../SITNA/feature/MultiPolyline.js';
import MultiPolygon_s from '../../SITNA/feature/MultiPolygon.js';
import Circle from '../../SITNA/feature/Circle.js';
import Layer_s from '../../SITNA/layer/Layer.js';
import Geometry from '../Geometry.js';
import FeatureTypeParser from '../tool/FeatureTypeParser.js';
import LayerEvent from "../../SITNA/layer/LayerEvent.js";
//import { Draw3D, Select3D} from '../view/ThreeD.js';

TC.wrap = wrap;
const featureNamespace = {};
featureNamespace.Point = Point_s;
featureNamespace.Marker = Marker;
featureNamespace.Polyline = Polyline;
featureNamespace.Polygon = Polygon_s;
featureNamespace.MultiPoint = MultiPoint_s;
featureNamespace.MultiMarker = MultiMarker;
featureNamespace.MultiPolyline = MultiPolyline;
featureNamespace.MultiPolygon = MultiPolygon_s;
TC.Geometry = Geometry;

Feature.createStyleFunction = createStyleFunction;

window.ol = {
    VERSION,
    Map,
    View,
    Overlay,
    Feature,
    Collection,
    MapEventType,
    MapBrowserEventType,
    Image
};

ol.array = {
    extend
};

ol.asserts = {
    assert
};

ol.color = {
    asArray,
    asString
};

ol.math = {
    toRadians
};

ol.string = {
    padNumber
};

ol.control = {
    OverviewMap,
    ScaleLine,
    Zoom,
    ZoomSlider,
    ZoomToExtent
};

ol.events = {
    EventType: e_EventType,
    listen,
    unlistenByKey,
    condition: {
        shiftKeyOnly
    }
};

ol.extent = {
    getWidth,
    getHeight,
    containsCoordinate,
    containsExtent,
    buffer,
    extend: extend_e,
};

ol.geom = {
    Geometry: g_Geometry,
    Point,
    MultiPoint,
    LineString,
    MultiLineString,
    Polygon,
    MultiPolygon,
    GeometryCollection,
    Circle: g_Circle,
    flat: {
        deflateCoordinates,
        inflateCoordinates,
        linearRingLength
    }
};

ol.featureloader = {
    xhr
};

ol.format = {
    Feature,
    GMLBase,
    GML,
    GML2,
    GML3,
    GML32,
    GPX,
    KML,
    WFS,
    WKT,
    WKB,
    GeoJSON,
    WMSCapabilities,
    WMSGetFeatureInfo,
    WMTSCapabilities,
    TopoJSON,
    GeoPackage,
    Shapefile,
    xsd: {
        readDecimal,
        readBoolean,
        readString,
        readPositiveInteger,
        readDateTime,
        writeStringTextNode,
        writeCDATASection,
        writeDecimalTextNode,
        writeBooleanTextNode,
        writeNonNegativeIntegerTextNode
    }
};
ol.format.Feature.transformGeometryWithOptions = transformGeometryWithOptions;

ol.interaction = {
    defaults,
    Draw,
    Pointer,
    Translate,
    Snap,
    Select,
    Modify,
    DragAndDrop,
    DoubleClickZoom
};

ol.layer = {
    Layer,
    Tile,
    Image: l_Image,
    Vector: l_Vector,
    //WebGLVector,
    Heatmap
};

ol.Observable = {
    unByKey: unByKey
};

ol.Object = BaseObject;

ol.proj = {
    METERS_PER_UNIT,
    Projection,
    addEquivalentProjections,
    get,
    transform,
    transformExtent,
    getTransform,
    proj4: {
        register
    },
    EPSG4326: {
        METERS_PER_UNIT: g_METERS_PER_UNIT,
        PROJECTIONS
    }
};

ol.render = {
    getVectorContext,
    toContext,
    EventType: r_EventType
};

ol.source = {
    Vector: s_Vector,
    Cluster,
    ImageWMS,
    WMTS,
    TileEventType,
    VectorEventType,
    ImageCanvas,
    //OGCMapTile
    Image: {
        defaultImageLoadFunction
    }
};
ol.source.WMTS.optionsFromCapabilities = optionsFromCapabilities;

ol.tilegrid = {
    TileGrid
};

ol.style = {
    Style,
    RegularShape,
    Circle: s_Circle,
    Fill,
    Icon,
    Stroke,
    Text
};

ol.xml = {
    parse,
    parseNode,
    createElementNS,
    pushParseAndPop,
    pushSerializeAndPop,
    makeStructureNS,
    getAllTextContent,
    makeChildAppender,
    makeReplacer,
    makeSequence,
    makeArrayPusher,
    makeArrayExtender,
    makeArraySerializer,
    makeObjectPropertySetter,
    makeSimpleNodeFactory,
    OBJECT_PROPERTY_NODE_FACTORY,
    XML_SCHEMA_INSTANCE_URI
};

// requestAnimationFrame polyfill
var lastTime = 0;
var vendors = ['ms', 'moz', 'webkit', 'o'];
for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
        || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function (callback, _element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () { callback(currTime + timeToCall); },
            timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };

if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
    };

// Nombres de tipos de eventos
const DRAGENTER = ol.events.EventType.DRAGENTER;
const DRAGOVER = ol.events.EventType.DRAGOVER;
const DROP = ol.events.EventType.DROP;
const SINGLECLICK = ol.MapBrowserEventType.SINGLECLICK;
const MOVEEND = ol.MapEventType.MOVEEND;
const olOverlayPositioning = {
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_CENTER: 'bottom-center',
    BOTTOM_RIGHT: 'bottom-right',
    CENTER_LEFT: 'center-left',
    CENTER_CENTER: 'center-center',
    CENTER_RIGHT: 'center-right',
    TOP_LEFT: 'top-left',
    TOP_CENTER: 'top-center',
    TOP_RIGHT: 'top-right'
};
const olGeometryType = {
    POINT: 'Point',
    MULTI_POINT: 'MultiPoint',
    LINE_STRING: 'LineString',
    MULTI_LINE_STRING: 'MultiLineString',
    POLYGON: 'Polygon',
    MULTI_POLYGON: 'MultiPolygon'
};

const hitTolerance = Util.detectMouse() ? 3 : 10;

const ATTRIBUTE_NAME_MARK = '@';
const TEXT_NODE_NAME = '#text';


/////////////////////////// ol patches

// Parche para evitar el error AssertionError: Assertion failed: calculated value (1.020636810790192) ouside allowed range (0-1)
ol.View.prototype.getValueForResolutionFunction = function (opt_power) {
    const power = opt_power || 2;
    const maxResolution = this.maxResolution_;
    const minResolution = this.minResolution_;
    const max = Math.log(maxResolution / minResolution) / Math.log(power);
    return (
        /**
             * @param {number} resolution Resolution.
             * @return {number} Value.
         */
        function (resolution) {
            var value = Math.log(maxResolution / resolution) / Math.log(power) / max;
            value = Math.max(Math.min(1, value), 0);
            return value;
        });
};
class GML3CRS84 extends GML32 {
    constructor() {
        super({
            srsName: 'CRS:84'
        });
    }
}
ol.format.GML3CRS84 = GML3CRS84;

class GML2CRS84 extends GML2 {
    constructor() {
        super({
            srsName: 'CRS:84'
        });
    }
}
ol.format.GML2CRS84 = GML2CRS84;

//// Añadido el espacio de nombres de GML 3.2 al parser
//const gmlNamespace = 'http://www.opengis.net/gml';
//const gml32Namespace = 'http://www.opengis.net/gml/3.2';
//ol.format.GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS[gml32Namespace] = ol.format.GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.FLAT_LINEAR_RINGS_PARSERS[gml32Namespace] = ol.format.GML3.prototype.FLAT_LINEAR_RINGS_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.GEOMETRY_PARSERS[gml32Namespace] = ol.format.GML3.prototype.GEOMETRY_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.MULTICURVE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.MULTICURVE_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.MULTISURFACE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.MULTISURFACE_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.CURVEMEMBER_PARSERS[gml32Namespace] = ol.format.GML3.prototype.CURVEMEMBER_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.SURFACEMEMBER_PARSERS[gml32Namespace] = ol.format.GML3.prototype.SURFACEMEMBER_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.SURFACE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.SURFACE_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.CURVE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.CURVE_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.ENVELOPE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.ENVELOPE_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.PATCHES_PARSERS[gml32Namespace] = ol.format.GML3.prototype.PATCHES_PARSERS[gmlNamespace];
//ol.format.GML3.prototype.SEGMENTS_PARSERS[gml32Namespace] = ol.format.GML3.prototype.SEGMENTS_PARSERS[gmlNamespace];

ol.proj.addEquivalentProjections(ol.proj.EPSG4326.PROJECTIONS);
ol.proj.proj4.register(proj4);
// OpenLayers usa para las proyecciones geográficas un valor ol.proj.METERS_PER_UNIT.degrees, calculado con una esfera, salvo
// EPSG:4326, en la que usa ol.proj.EPSG4326.METERS_PER_UNIT, calculado con el geoide. Esto hace que las proyecciones en EPSG:4258 salgan desplazadas,
// pese a que para todos los efectos son iguales a las EPSG:4326. Para evitar eso, introducimos en las 4258 el valor ol.proj.EPSG4326.METERS_PER_UNIT.
ol.proj.get('EPSG:4258').metersPerUnit_ = ol.proj.EPSG4326.METERS_PER_UNIT;
ol.proj.get('urn:ogc:def:crs:EPSG::4258').metersPerUnit_ = ol.proj.EPSG4326.METERS_PER_UNIT;
ol.proj.get('http://www.opengis.net/gml/srs/epsg.xml#4258').metersPerUnit_ = ol.proj.EPSG4326.METERS_PER_UNIT;

// Reescribimos la obtención de proyección para que soporte códigos tipo EPSG:X, urn:ogc:def:crs:EPSG::X y http://www.opengis.net/gml/srs/epsg.xml#X
//ol.proj.oldGet = ol.proj.get;
//ol.proj.get = function (projectionLike) {
//    let result = ol.proj.oldGet.call(this, projectionLike);
//    if (!result && typeof projectionLike === 'string') {
//        projectionLike = projectionLike.trim();
//        TC.loadProjDef({ crs: projectionLike, sync: true });
//        result = ol.proj.oldGet.call(this, projectionLike);
//    }
//    return result;
//};

const oldReadFeatures = ol.format.GeoJSON.prototype.readFeatureFromObject;
ol.format.GeoJSON.prototype.readFeatureFromObject = function (object, options) {
    const removeSimpleContent = (obj) => {
        if (!obj) return;
        for (const key in obj) {
            const val = obj[key];
            if (val && typeof val === 'object') {
                if (Object.hasOwn(val, 'simpleContent') && val.simpleContent === null) {
                    obj[key] = null;
                }
                else {
                    removeSimpleContent(val);
                }
            }
        }
    };
    const newObj = { ...object };
    removeSimpleContent(newObj.properties);
    return oldReadFeatures.call(this, newObj, options);
};


// Parche para solucionar el aspecto borroso de los popup de GFI con dos filas en Chromium: volvemos a la función de la versión 5.3.3.
// El problema es que la altura calculada no es un número entero de pixels.
ol.Overlay.prototype.__updateRenderedPosition = function (pixel, mapSize) {
    const style = this.element.style;
    const offset = this.getOffset();

    const positioning = this.getPositioning();

    this.setVisible(true);

    let offsetX = offset[0];
    let offsetY = offset[1];
    if (positioning == olOverlayPositioning.BOTTOM_RIGHT ||
        positioning == olOverlayPositioning.CENTER_RIGHT ||
        positioning == olOverlayPositioning.TOP_RIGHT) {
        if (this.rendered.left_ !== '') {
            this.rendered.left_ = style.left = '';
        }
        const right = Math.round(mapSize[0] - pixel[0] - offsetX) + 'px';
        if (this.rendered.right_ != right) {
            this.rendered.right_ = style.right = right;
        }
    } else {
        if (this.rendered.right_ !== '') {
            this.rendered.right_ = style.right = '';
        }
        if (positioning == olOverlayPositioning.BOTTOM_CENTER ||
            positioning == olOverlayPositioning.CENTER_CENTER ||
            positioning == olOverlayPositioning.TOP_CENTER) {
            offsetX -= this.element.offsetWidth / 2;
        }
        const left = Math.round(pixel[0] + offsetX) + 'px';
        if (this.rendered.left_ != left) {
            this.rendered.left_ = style.left = left;
        }
    }
    if (positioning == olOverlayPositioning.BOTTOM_LEFT ||
        positioning == olOverlayPositioning.BOTTOM_CENTER ||
        positioning == olOverlayPositioning.BOTTOM_RIGHT) {
        if (this.rendered.top_ !== '') {
            this.rendered.top_ = style.top = '';
        }
        const bottom = Math.round(mapSize[1] - pixel[1] - offsetY) + 'px';
        if (this.rendered.bottom_ != bottom) {
            this.rendered.bottom_ = style.bottom = bottom;
        }
    } else {
        if (this.rendered.bottom_ !== '') {
            this.rendered.bottom_ = style.bottom = '';
        }
        if (positioning == olOverlayPositioning.CENTER_LEFT ||
            positioning == olOverlayPositioning.CENTER_CENTER ||
            positioning == olOverlayPositioning.CENTER_RIGHT) {
            offsetY -= this.element.offsetHeight / 2;
        }
        const top = Math.round(pixel[1] + offsetY) + 'px';
        if (this.rendered.top_ != top) {
            this.rendered.top_ = style.top = top;
        }
    }
};

const oldSnapTo = ol.interaction.Snap.prototype.snapTo;
ol.interaction.Snap.prototype.snapTo = function (pixel, pixelCoordinate, map) {
    const result = oldSnapTo.call(this, pixel, pixelCoordinate, map);
    this._snapData = result;
    return result;
};

FeatureFormat.prototype.featureMetadata = new WeakMap();

XMLFeature.prototype.getDataType = function (wfsType) {
    if (wfsType === undefined) {
        return Consts.dataType.STRING;
    }
    switch (wfsType.substring(wfsType.indexOf(':') + 1)) {
        case 'ID':
            return 'ID';
        case 'string':
        case 'anyURI':
            return Consts.dataType.STRING;
        case 'number':
        case 'double':
        case 'float':
        case 'decimal':
            return Consts.dataType.FLOAT;
        case 'int':
        case 'integer':
        case 'byte':
        case 'long':
        case 'negativeInteger':
        case 'nonNegativeInteger':
        case 'nonPositiveInteger':
        case 'positiveInteger':
        case 'short':
        case 'unsignedLong':
        case 'unsignedInt':
        case 'unsignedShort':
        case 'unsignedByte':
            return Consts.dataType.INTEGER;
        case 'boolean':
            return Consts.dataType.BOOLEAN;
        case 'date':
            return Consts.dataType.DATE;
        case 'time':
            return Consts.dataType.TIME;
        case 'dateTime':
            return Consts.dataType.DATETIME;
        default:
            return 'object';
    }
};
const getNameComponents = function (name) {
    let [prefix, localName] = name.split(':');
    if (!localName) {
        [prefix, localName] = [localName, prefix]
    }
    return [prefix, localName];
};

XMLFeature.prototype.getFeatureTypeMetadata = function (metadata, features) {
    const newMetadata = { ...metadata };
    const firstFeature = features[0];
    const geometryName = firstFeature?.getGeometryName();
    newMetadata.attributes = [];

    const getAttributeType = (metadata, attributeTypeObject, ...names) => {
        const name = names[names.length - 1];
        const result = {
            name
        };
        if (attributeTypeObject['@minOccurs'] === 0 || names[names.length - 1].startsWith(ATTRIBUTE_NAME_MARK)) {
            result.optional = true;
        }
        if (attributeTypeObject['@maxOccurs'] > 1 || attributeTypeObject['@maxOccurs'] === 'unbounded') {
            result.multiple = true;
        }
        if (!attributeTypeObject['@nillable']) {
            result.nonNullable = true;
        }
        if (typeof attributeTypeObject.type === 'object') {
            const typeObj = attributeTypeObject.type;
            result.value = [];
            result.type = 'object';
            const typeObjEntries = FeatureTypeParser.getSchemaEntries(typeObj);
            for (const [n, v] of typeObjEntries) {
                const t = getAttributeType(metadata, v, ...names, n);
                if (t) {
                    result.value.push(t);
                }
            }
            return result;
        }
        result.type = this.getType(attributeTypeObject.type);
        if (result.type === 'ID') {
            result.isId = true;
            result.type = Consts.dataType.STRING;
        }
        else if (result.type === 'object') {
            const geometryType = this.getGeometryType(attributeTypeObject.type);
            if (geometryType) {
                metadata.geometries ??= [];
                metadata.geometries.push({
                    name: names,
                    type: geometryType,
                    originalType: attributeTypeObject.type
                });
                return null;
            }
        }
        return result;
    };
    const featureTypeName = Object.keys(metadata.originalMetadata.featureTypes)[0];
    if (featureTypeName) {
        if (!featureTypeName.endsWith(':feature')) { // No es feature genérica sin esquema
            const schema = metadata.originalMetadata.featureTypes[featureTypeName];
            const schemaEntries = FeatureTypeParser.getSchemaEntries(schema);
            for (const [name, attribute] of schemaEntries) {
                const newAttr = getAttributeType(newMetadata, attribute, name);
                if (name === geometryName || typeof newAttr === 'string' || newAttr === null) {
                    // El tipo de atributo es una geometría
                    newMetadata.geometries ??= [];
                    newMetadata.geometries.push({
                        name,
                        type: this.constructor.getGeometryType(attribute.type),
                        originalType: attribute.type
                    });
                }
                else {
                    newMetadata.attributes.push(newAttr);
                }
            }
        }
    }

    // Transformamos los metadatos:
    // Una propiedad @attr del elemento con nombre elm pasa a ser un elemento con nombre elm@attr
    const addAttributeProperties = (propertyList) => {
        for (let i = propertyList.length - 1; i >= 0; i--) {
            const prop = propertyList[i];
            if (Array.isArray(prop.value)) {
                const xmlAttributes = prop.value.filter((val) => val.name.startsWith(ATTRIBUTE_NAME_MARK));
                const xmlElements = prop.value.filter((val) => !val.name.startsWith(ATTRIBUTE_NAME_MARK) && val.name !== TEXT_NODE_NAME);
                if (xmlAttributes.length && !xmlElements.length && !prop.multiple) {
                    propertyList.splice(i + 1, 0, ...xmlAttributes.map((attr) => ({
                        name: prop.name + attr.name,
                        type: attr.type,
                        optional: attr.optional,
                    })));
                    const textNode = prop.value.find((val) => val.name === TEXT_NODE_NAME);
                    if (textNode) {
                        // Si el elemento tiene un nodo de texto asignamos su tipo al elemento
                        prop.type = textNode.type;
                        delete prop.value;
                    }
                    else {
                        // Si el elemento no tiene un nodo de texto lo eliminamos y dejamos solamente los 
                        // nodos de sus atributos
                        propertyList.splice(i, 1);
                    }
                }
                else {
                    addAttributeProperties(prop.value);
                }
            }
        }
    }
    addAttributeProperties(newMetadata.attributes);

    newMetadata.equals = (n1, n2) => {
        const splitPrefix = (name) => {
            let [prefix, localName] = getNameComponents(name);
            return [prefix ?? 'gml', localName];
        };
        const getParts = (n) => n.split(ATTRIBUTE_NAME_MARK).map((part) => splitPrefix(part)).flat();
        const arr1 = getParts(n1);
        const arr2 = getParts(n2);
        return arr1.every((elm, idx) => elm === arr2[idx]) && arr2.every((elm, idx) => elm === arr1[idx]);
    };

    return newMetadata;
};

XMLFeature.prototype.getGeometryType = function (_typeName) {
    return false;
};

// Añadido método para escribir geometrías en GML2 que no está implementado en OpenLayers
// (copiado de GML3)
GML2.prototype.writeGeometryNode = function (geometry, options) {
    options = this.adaptOptions(options);
    const geom = createElementNS(this.namespace, 'geom');
    const context = {
        node: geom,
        hasZ: this.hasZ,
        srsName: this.srsName,
        curve: this.curve_,
        surface: this.surface_,
        multiSurface: this.multiSurface_,
        multiCurve: this.multiCurve_,
    };
    if (options) {
        Object.assign(context, options);
    }
    this.writeGeometryElement(geom, geometry, [context]);
    return geom;
};

//////////////////////// end ol patches

const getRGBA = function (color, opacity) {
    var result;
    if (color) {
        result = ol.color.asArray(color);
        result = result.slice();
    }
    else {
        result = [0, 0, 0, 1];
    }
    if (typeof opacity === 'number') {
        result[3] = opacity;
    }
    return result;
};

/*
 * Obtiene el objeto de opciones de una vista que restringe los niveles de zoom activos sobre el mapa dependiendo de las opciones definidas sobre
 * el mapa base activo.
 */
const getResolutionOptions = function (mapWrap, layer, options) {
    const view = mapWrap.map.getView();
    const prevRes = view.getResolution();
    // Si es móvil mantenemos un pixelRatio de 1. Solución a bug 32575.
    // En desktop se tiene en cuenta pixelRatio para que el mapa no salga con zoom
    // cuando el navegador lo tiene
    const pixelRatio = Util.detectMobile() ? 1 : mapWrap.map.pixelRatio_;

    const pms = {
        projection: view.getProjection(),
        center: view.getCenter(),
        resolution: prevRes,
        enableRotation: false,
        constrainResolution: true,
        constrainOnlyCenter: true,
        showFullExtent: true,
        smoothExtentConstraint: true
    };

    if (mapWrap.parent.maxExtent) {
        pms.extent = mapWrap.parent.maxExtent;
    }

    // GLS 06/03/2019 Corregimos bug 24832, si el mapa de fondo es el mapa en blanco, asignamos las resoluciones del mapa de fondo actual
    var layerForResolutions = layer;
    if (layer.type === Consts.layerType.VECTOR && mapWrap.parent.getBaseLayer()) {
        layerForResolutions = mapWrap.parent.getBaseLayer();
    }

    const res = options?.resolutions ?? (layerForResolutions.getResolutions ? layerForResolutions.getResolutions() : []);
    var maxRes;
    var minRes;

    if (res && res.length) {
        // Ponemos un extra a la resolución máxima si viene de la lista de resoluciones
        // porque para OpenLayers la resolución mínima es inclusiva y la máxima exclusiva (no queremos ese comportamiento)
        maxRes = layerForResolutions.maxResolution || options?.maxResolution || (res[0] + res[0] / 1000);
        minRes = layerForResolutions.minResolution || options?.minResolution || res[res.length - 1];

        // Hacemos esto por Array.prototype.findLastIndex todavía no tiene amplio soporte
        let minResIx = res.length - res.slice().reverse().findIndex(r => r >= minRes) - 1;
        if (minResIx === res.length) {
            minResIx = -1;
        }
        const maxResIx = res.findIndex(r => r <= maxRes);

        pms.resolutions = res.slice(maxResIx, minResIx + 1);

        if (pixelRatio !== 1) {
            pms.resolutions = pms.resolutions.map(r => r * pixelRatio);
        }
    }
    else {
        maxRes = layerForResolutions.maxResolution;
        minRes = layerForResolutions.minResolution;
    }
    if (minRes) {
        minRes = minRes * pixelRatio;
        pms.minResolution = minRes;
        if (prevRes < minRes) {
            pms.resolution = minRes;
        }
    }
    if (maxRes) {
        maxRes = maxRes * pixelRatio;
        pms.maxResolution = maxRes;
        if (prevRes > maxRes) {
            pms.resolution = maxRes;
        }
    }

    return pms;
};

const constrainResolution = function (resolution, resolutions, maxResolutionError) {
    if (!resolutions) {
        return resolution;
    }
    return resolutions
        .slice()
        .sort(function (a, b) { return a - b })
        .reduce(function (prev, elm) {
            if (prev === 0 &&
                (elm > resolution || Math.abs(1 - resolution / elm) < maxResolutionError)) {
                return elm;
            }
            return prev;
        }, 0);
};

TC.wrap.Map.prototype.setMap = function () {
    var self = this;
    var center = [
        (self.parent.initialExtent[0] + self.parent.initialExtent[2]) / 2,
        (self.parent.initialExtent[1] + self.parent.initialExtent[3]) / 2
    ];

    var proj4Obj = proj4(self.parent.crs);
    var addEquivalentProjections = function () {
        // Añadimos proyecciones equivalentes y transformaciones necesarias.
        var crsCode = self.parent.crs.substr(self.parent.crs.lastIndexOf(':') + 1);
        const epsgProj = ol.proj.get('EPSG:' + crsCode);

        var projOptions = {
            units: proj4Obj.oProj.units
        };

        if (epsgProj) {
            projOptions.units = epsgProj.getUnits();
            projOptions.metersPerUnit = epsgProj.getMetersPerUnit();
            projOptions.axisOrientation = epsgProj.getAxisOrientation();
        }

        var equivalentProjections = [];
        if (crsCode !== '4326') { // Este código ya está metido, no lo machacamos
            const epsgProjOptions = Object.assign({}, projOptions, { code: 'EPSG:' + crsCode });
            equivalentProjections.push(new ol.proj.Projection(epsgProjOptions));
            const urnProjOptions = Object.assign({}, projOptions, { code: 'urn:ogc:def:crs:EPSG::' + crsCode });
            equivalentProjections.push(new ol.proj.Projection(urnProjOptions));

            ol.proj.addEquivalentProjections(equivalentProjections);
        }

        ol.proj.proj4.register(proj4);

    };

    addEquivalentProjections();

    var projection = new ol.proj.get(self.parent.crs);

    var interactions = ol.interaction.defaults();

    var viewOptions = {
        projection: projection,
        center: center,
        enableRotation: false,
        constrainResolution: true,
        constrainOnlyCenter: true,
        showFullExtent: true,
        smoothExtentConstraint: true
    };
    const extentForResolution = self.parent.maxExtent || self.parent.initialExtent;
    if (self.parent.maxExtent) {
        viewOptions.extent = self.parent.maxExtent;
    }
    var rect = self.parent.div.getBoundingClientRect();
    var dx = extentForResolution[2] - extentForResolution[0];
    var dy = extentForResolution[3] - extentForResolution[1];
    viewOptions.resolution = Math.max(dx / rect.width, dy / rect.height);

    self.map = new ol.Map({
        target: self.parent.div,
        view: new ol.View(viewOptions),
        controls: [],
        interactions: interactions
    });

    //if (!Util.detectMobile()) {
    //    // Parche para corregir https://github.com/openlayers/openlayers/issues/2904
    //    // saben que tienen un bug cuando se trabaja sobre un mapa con zoom
    //    self.map.getEventPixel = function (event) {
    //        var viewportPosition = this.viewport_.getBoundingClientRect();
    //        var eventPosition = event.changedTouches ? event.changedTouches[0] : event;
    //        eventPosition = eventPosition.clientX ? eventPosition : (eventPosition.pointerEvent ? eventPosition.pointerEvent : eventPosition);
    //        return [
    //            (eventPosition.clientX - viewportPosition.left) * window.devicePixelRatio,
    //            (eventPosition.clientY - viewportPosition.top) * window.devicePixelRatio
    //        ];
    //    };
    //}

    self.map._wrap = self;
    self._promise = Promise.resolve(self.map);

    // mantenemos el ancho y alto del canvas en números enteros
    self.manageSize.call(self.map);

    // Para evitar estiramientos en canvas
    var updateSize = function () {
        self.updateSize();
    };
    //if (window.ResizeObserver) {
    //    self.parent.loaded(function () {
    //        const resizeObserver = new ResizeObserver(updateSize);
    //        resizeObserver.observe(self.parent.div);
    //    });
    //}
    //self.map.getViewport().addEventListener(RESIZE, updateSize);
    self.parent.one(Consts.event.MAPLOAD, updateSize);

    self.map.on(SINGLECLICK, function (e) {

        if (self.parent.view === Consts.view.PRINTING) {
            return;
        }

        self.parent.workLayers.forEach(function (wl) {
            delete wl._noFeatureClicked;
        });
        var featuresInLayers = self.parent.workLayers.map(function () {
            return false;
        });
        self.map.forEachFeatureAtPixel(e.pixel,
            function (feature, layer) {
                if (feature._wrap && feature._wrap.parent.showsPopup) {
                    for (var i = 0; i < self.parent.workLayers.length; i++) {
                        var wl = self.parent.workLayers[i];
                        if (wl.wrap.layer === layer) {
                            featuresInLayers[i] = true;
                            break;
                        }
                    }
                    self.parent.trigger(Consts.event.FEATURECLICK, { feature: feature._wrap.parent });
                    return feature;
                }
            },
            {
                hitTolerance,
            });
        for (var i = 0; i < featuresInLayers.length; i++) {
            if (!featuresInLayers[i]) {
                self.parent.trigger(Consts.event.NOFEATURECLICK, { layer: self.parent.workLayers[i] });
            }
        }
    });

    let olView;

    // GLS: 13/02/2019 cambiamos el orden de las suscripciones a eventos de cambio de resolución y moveend
    // para gestionar el borrado del estado inicial. Si no lo hacemos el cambio al extent inicial se registra como evento de usuario
    // porque la carga inicial del mapa con promesas nativas es más rápido que antes.
    // Bug:26001 Borrar estado inicial al entrar
    const addMoveEndListener = function () {
        self.map.on(MOVEEND, function () {
            self.parent.trigger(Consts.event.ZOOM);
        });
    };

    const changeResolutionListener = function (_e) {
        const resolution = olView.getResolution();
        const crs = olView.getProjection().getCode();
        self.parent.layers
            .filter((l) => l.type === Consts.layerType.WMS)
            .forEach((l) => {
                const extent = l.getExtent({ crs });
                if (extent) {
                    const bufferedExtent = bufferExtent(extent, resolution, 100); // 100 pixels de buffer
                    l.wrap.layer.setExtent(bufferedExtent);
                }
                else {
                    l.wrap.layer.setExtent();
                }
            });
    };
    const addChangeResolutionListener = function () {
        olView.on('change:resolution', changeResolutionListener);
    };
    const onChangeView = function () {
        olView = self.map.getView();
        addChangeResolutionListener();
        changeResolutionListener();
    };
    addMoveEndListener();
    onChangeView();

    olView.on('change:resolution', function (_e) {
        self.parent.trigger(Consts.event.BEFOREZOOM);
    }, self.parent);

    self.map.on('change:view', onChangeView);

    /*
     * Restringe los niveles de zoom activos sobre el mapa dependiendo de las opciones definidas sobre
     * el mapa base activo.
     */
    const limitZoomLevels = function (layer, options) {
        if (layer) {
            var pms = getResolutionOptions(self, layer, options);
            var view = new ol.View(pms);
            self.map.setView(view);
            self.map.render();
        }
    };

    self.parent.on(Consts.event.BEFOREBASELAYERCHANGE, function (evt) {
        // Solo se limitan las resoluciones cuando estamos en un CRS por defecto, donde no se repixelan teselas
        if (self.parent.crs === self.parent.options.crs && !self.parent.on3DView && evt.newLayer.type !== Consts.layerType.VECTOR) {
            const oldResolutions = evt.oldLayer.getResolutions() ?? evt.oldLayer.map.getResolutions();
            let modelLayer = evt.newLayer;
            const limitZoomOptions = {};
            if (!evt.newLayer.getResolutions() && oldResolutions) {
                // Si la capa nueva no tiene resoluciones y la vieja sí, mantenemos las resoluciones anteriores.
                // Esto evita que OpenLayers se invente los niveles de zoom y las resoluciones para la capa dinámica.
                modelLayer = evt.oldLayer;
                limitZoomOptions.resolutions = oldResolutions;
                // Pero mantenemos los límites de resolución de la nueva capa.
                limitZoomOptions.minResolution = evt.newLayer.minResolution;
                limitZoomOptions.maxResolution = evt.newLayer.maxResolution;
            }
            self.parent.one(Consts.event.BASELAYERCHANGE, function (_e) {
                limitZoomLevels(modelLayer, limitZoomOptions);
            });
        }
    });
    self.parent.on(Consts.event.MAPLOAD, function (_e) {
        limitZoomLevels(self.parent.getBaseLayer());
    });

    const olMapViewport = self.map.getViewport();

    olMapViewport.addEventListener(Consts.event.MOUSEMOVE, function (e) {
        var hit = false;

        if (!self.parent.activeControl || !self.parent.activeControl.isExclusive()) {

            if (self.parent.view === Consts.view.PRINTING) {
                return;
            }

            var pixel = self.map.getEventPixel(e);
            hit = self.map.forEachFeatureAtPixel(pixel, function (feature, _layer) {
                var result = true;
                if (feature._wrap && !feature._wrap.parent.showsPopup && !feature._wrap.parent.options.selectable) {
                    result = false;
                }

                if (result && feature._wrap) {
                    self.parent.trigger(Consts.event.FEATUREOVER, {
                        feature: feature._wrap.parent
                    });
                }

                return result;
            }, { hitTolerance: hitTolerance });
        }

        if (hit) {
            olMapViewport.style.cursor = 'pointer';
        } else {
            olMapViewport.style.cursor = '';
            //self.parent.trigger(Consts.event.FEATUREOUT);
        }
    });

    // Listener para cuando cambia devicePixelRatio
    (function updatePixelRatio() {
        matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
            .addEventListener('change', updatePixelRatio, { once: true });
        //self.map.getViewport().querySelectorAll('.ol-layer canvas').forEach();
        self.map.pixelRatio_ = window.devicePixelRatio;
        limitZoomLevels(self.parent.baseLayer);
        self.manageSize();
    })();
};

TC.wrap.Map.prototype.updateSize = function () {
    this.map.updateSize();
};

var getMetersPerUnit = function (proj, extentInDegrees) {
    var units = proj.getUnits();
    if (!units || units === Consts.units.DEGREES) {
        return Util.getMetersPerDegree(extentInDegrees);
    }
    return ol.proj.METERS_PER_UNIT[units];
};

TC.wrap.Map.prototype.getMetersPerUnit = function () {
    var self = this;
    return getMetersPerUnit(ol.proj.get(self.parent.crs), self.getExtent());
};

var getUnitRatio = function (options = {}) {
    const self = this;
    var defaultCrs = self.parent.options.crs || TC.Cfg.crs;
    var defaultProj = ol.proj.get(defaultCrs);
    var newProj = ol.proj.get(options.crs);
    return getMetersPerUnit(newProj, options.extentInDegrees) / getMetersPerUnit(defaultProj, options.extentInDegrees);
};

var normalizeProjection = function (options) {
    var result;
    if (options.axisOrientation) {
        result = new ol.proj.Projection({
            code: options.crs,
            axisOrientation: options.axisOrientation
        });
    }
    else {
        result = ol.proj.get(options.crs);
    }
    if (!result.getUnits()) {
        result.units_ = Consts.units.DEGREES;
    }
    return result;
};

TC.wrap.Map.prototype.setProjection = function (options = {}) {
    const self = this;
    const baseLayer = options.baseLayer || self.parent.baseLayer;
    var extent;
    if (options.extent) {
        extent = options.extent;
    }
    else {
        extent = ol.proj.transformExtent(self.getExtent(), self.parent.crs, options.crs);
    }
    const extentInDegrees = ol.proj.transformExtent(extent, options.crs, 'EPSG:4326');
    const unitRatio = getUnitRatio.call(self, {
        crs: options.crs,
        extentInDegrees: extentInDegrees
    });
    const projection = normalizeProjection(options);
    const oldView = self.map.getView();
    const viewOptions = {
        projection: projection,
        enableRotation: false,
        constrainResolution: true,
        constrainOnlyCenter: true,
        showFullExtent: true,
        smoothExtentConstraint: true
    };
    const resolutions = baseLayer.getResolutions();

    if (resolutions && resolutions.length) {
        viewOptions.resolutions = resolutions;
    }
    else {
        viewOptions.minZoom = oldView.getMinZoom();
        viewOptions.maxZoom = oldView.getMaxZoom();
        const minResolution = baseLayer.wrap.layer.getMinResolution();
        const maxResolution = baseLayer.wrap.layer.getMaxResolution();
        var transformFactor = 1;
        if (minResolution === 0 || maxResolution === Number.POSITIVE_INFINITY) {
            const oldUnitRatio = getUnitRatio.call(self, {
                crs: self.parent.crs,
                extentInDegrees: extentInDegrees
            });
            transformFactor = oldUnitRatio / unitRatio;
        }
        if (minResolution === 0) {
            viewOptions.minResolution = oldView.getMinResolution() * transformFactor;
        }
        else {
            viewOptions.minResolution = minResolution;
        }
        if (maxResolution === Number.POSITIVE_INFINITY) {
            viewOptions.maxResolution = oldView.getMaxResolution() * transformFactor;
        }
        else {
            viewOptions.maxResolution = maxResolution;
        }
    }

    // Rehacemos las resoluciones máximas y mínimas para adaptarse a la nueva unidad
    self.parent.workLayers.forEach(l => {
        if (l.type === Consts.layerType.WMS) {
            const { minResolution, maxResolution } = l.wrap.getResolutionBounds({
                layerNames: l.wrap.layer.getSource().getParams().LAYERS,
                crs: options.crs,
            });
            if (minResolution) {
                l.wrap.layer.setMinResolution(minResolution);
            }
            if (maxResolution) {
                l.wrap.layer.setMaxResolution(maxResolution);
            }
            const oldExtent = l.getExtent({ crs: options.crs });
            if (oldExtent) {
                l.wrap.layer.setExtent(l.getExtent());
            }
        }
    });

    // Reescribimos el extent de las capas para que sigan siendo visibles
    self.parent.workLayers.forEach(l => {
        if (l.type === Consts.layerType.WMS) {
            const oldExtent = l.getExtent({ crs: options.crs });
            if (oldExtent) {
                l.wrap.layer.setExtent(l.getExtent());
            }
        }
    });

    // GLS: transformamos también el centro     
    viewOptions.center = ol.proj.transform(self.getCenter(), self.parent.crs, options.crs);

    self.parent.initialExtent = unitRatio !== 1 ? ol.proj.transformExtent(self.parent.initialExtent, self.parent.crs, options.crs) : self.parent.options.initialExtent;
    if (self.parent.options.maxExtent) {
        self.parent.maxExtent = unitRatio !== 1 ? ol.proj.transformExtent(self.parent.maxExtent, self.parent.crs, options.crs) : self.parent.options.maxExtent;
        viewOptions.extent = self.parent.maxExtent;
    }
    var newView = new ol.View(viewOptions);
    self.map.setView(newView);
    newView.fit(extent, { nearest: true });
};

/*
 *  insertLayer: inserts OpenLayers layer at index
 *  Parameters: OpenLayers.Layer, number
 */
TC.wrap.Map.prototype.insertLayer = function (olLayer, indexOrObject) {
    const self = this;
    const layers = self.map.getLayers();
    let idx;
    if (typeof indexOrObject === 'number') {
        // Se ha pasado un índice
        idx = indexOrObject;
    }
    else {
        // Se ha pasado un objeto con la lista de capas previas
        idx = -1;
        const layerArray = layers.getArray();
        for (const previousLayer of indexOrObject.previousLayers) {
            idx = Math.max(idx, layerArray.indexOf(previousLayer));
        }
        idx++;
    }
    var alreadyExists = false;
    for (var i = 0; i < layers.getLength(); i++) {
        if (layers.item(i) === olLayer) {
            alreadyExists = true;
            break;
        }
    }

    const wrap = olLayer._wrap;
    if (!wrap.parent.isBase && wrap.parent.type === Consts.layerType.WMS) {
        const layerExtent = wrap.parent.getExtent();
        if (layerExtent) {
            olLayer.setExtent(bufferExtent(layerExtent, self.getResolution(), 100)); // 100 pixels de buffer
        }
    }

    if (alreadyExists) {
        layers.remove(olLayer);
    }
    if (idx < 0) {
        layers.push(olLayer);
    }
    else {
        layers.insertAt(layers.getLength() < idx ? layers.getLength() : idx, olLayer);
    }
    if (!alreadyExists) {
        // Solo se limitan las resoluciones cuando estamos en un CRS por defecto, donde no se repixelan teselas
        const view = self.map.getView();
        if (self.parent.crs === self.parent.options.crs) {
            if (olLayer instanceof ol.layer.Tile) {
                var resolutions = olLayer.getSource().getResolutions();
                view.maxResolution_ = resolutions[0];
                view.minResolution_ = resolutions[resolutions.length - 1];
            }
        }
        else {
            // Cambiamos los límites de resolución de la capa a los de la vista. Esto lo hacemos porque su resolución está en otro CRS.
            if (olLayer instanceof ol.layer.Tile) {
                olLayer.setMaxResolution(view.getMaxResolution());
                olLayer.setMinResolution(view.getMinResolution());
            }
        }

        let loadingTileCount = 0;

        const beforeTileLoadHandler = function (_e) {
            wrap.parent.state = Layer_s.state.LOADING;
            if (loadingTileCount <= 0) {
                loadingTileCount = 0;
                self.parent.dispatchEvent(new LayerEvent(Consts.event.BEFORELAYERUPDATE, { layer: wrap.parent }));
            }
            olLayer._loadingTileCount = olLayer._loadingTileCount + 1;
        };
        if (wrap.parent.state === Layer_s.state.LOADING && wrap.parent.isRaster()) {
            beforeTileLoadHandler();
        }
        wrap.$events.on(Consts.event.BEFORETILELOAD, beforeTileLoadHandler);

        wrap.$events.on(Consts.event.TILELOAD + ' ' + Consts.event.TILELOADERROR, function (_e) {
            loadingTileCount = loadingTileCount - 1;
            if (loadingTileCount <= 0) {
                loadingTileCount = 0;
                wrap.parent.state = Layer_s.state.IDLE;
                self.parent.dispatchEvent(new LayerEvent(Consts.event.LAYERUPDATE, { layer: wrap.parent }));
            }
        });
    }
};

TC.wrap.Map.prototype.removeLayer = function (olLayer) {
    this.map.removeLayer(olLayer);
};

TC.wrap.Map.prototype.getWorkLayers = function () {
    return this.map.getLayerGroup().getLayers().getArray().slice(1).map((l) => l._wrap.parent);
};

TC.wrap.Map.prototype.getLayerCount = function () {
    return this.map.getLayerGroup().getLayers().getLength();
};

TC.wrap.Map.prototype.indexOfFirstVector = function () {
    var result = -1;
    this.map.getLayerGroup().getLayers().forEach(function (l, i) {
        if (l instanceof ol.layer.Vector && result === -1) {
            result = i;
        }
    });
    return result;
};

TC.wrap.Map.prototype.getLayerIndex = function (olLayer) {
    var result = -1;
    this.map.getLayerGroup().getLayers().forEach(function (elm, idx) {
        if (elm === olLayer) {
            result = idx;
        }
    });
    return result;
};

TC.wrap.Map.prototype.setLayerIndex = function (olLayer, index) {
    var layers = this.map.getLayers();
    var list = layers.getArray();
    var ix = list.indexOf(olLayer);

    if (ix > -1 && ix !== index) {
        this.map.removeLayer(olLayer);
        this.insertLayer(olLayer, index);
        //layers.setAt(index, olLayer);
    }
    else {
        //no está el layer, así que no hago nada
    }

};

TC.wrap.Map.prototype.setBaseLayer = function (olLayer) {
    var self = this;
    return new Promise(function (resolve, _reject) {
        var setLayer = function (curBl) {
            // GLS: si se llega después de una animación el valor de self.parent.getBaseLayer() ya es el definitivo y no el actual lo que provoca efectos indeseados. 
            // ir a línea 1313: paso como parámetro el baseLayer actual en el caso de animación.
            curBl = curBl || self.parent.getBaseLayer();
            if (curBl) {
                self.map.removeLayer(curBl.wrap.layer);
                if (olLayer instanceof ol.layer.Image) { // Si es imagen no teselada
                    olLayer._wrap.setProjection({
                        crs: self.parent.crs
                    });
                }

                if (olLayer._wrap.parent.type === Consts.layerType.WMTS) {
                    var layerProjectionOptions = { crs: self.parent.crs, oldCrs: olLayer.getSource().getProjection().getCode() };

                    if (!Util.CRSCodesEqual(layerProjectionOptions.oldCrs, layerProjectionOptions.crs)) {
                        olLayer._wrap.parent.setProjection(layerProjectionOptions);
                    }
                }

                //if (olLayer instanceof ol.layer.Tile) { // Si es imagen teselada
                //    const view = self.map.getView();
                //    const resolutions = olLayer.getSource().getResolutions();
                //    if (resolutions) {
                //        view.options_.resolutions = resolutions;
                //        view.applyOptions_(view.options_);
                //    }
                //}
            }
            self.insertLayer(olLayer, 0);
            self.map.getControls().forEach(function (ctl) {
                if (ctl instanceof ol.control.ZoomSlider) {
                    ctl.initSlider_();
                }
            });
            resolve();
        };

        // Toda esta lógica antes de llamar a setLayer() es para hacer un zoom a la nueva resolución
        // cuando la nueva capa no llega a la resolución actual
        var viewOptions = getResolutionOptions(self, olLayer._wrap.parent);
        var view = self.map.getView();
        var currentResolution = view.getResolution();
        if (!viewOptions.resolutions && (viewOptions.minResolution || viewOptions.maxResolution)) {
            const resolutions = view.getResolutions();
            if (resolutions) {
                const newResolutions = resolutions
                    .filter(r => {
                        if (viewOptions.minResolution && r < viewOptions.minResolution) {
                            return false;
                        }
                        if (viewOptions.maxResolution && r > viewOptions.maxResolution) {
                            return false;
                        }
                        return true;
                    });
                if (newResolutions.length < resolutions.length) {
                    viewOptions.resolutions = newResolutions;
                }
            }
        }
        if (viewOptions.resolutions) {
            const newView = new ol.View(viewOptions);
            // buscamos la nueva resolución según las nuevas restricciones de la capa
            var newRes = constrainResolution(currentResolution, viewOptions.resolutions, self.parent.options.maxResolutionError);
            if (newRes !== currentResolution && self.parent.isLoaded) {
                view.animate({ resolution: newRes, duration: Consts.ZOOM_ANIMATION_DURATION }, function () {
                    self.map.setView(newView);
                    setLayer(self.parent.getBaseLayer());
                });
            }
            else {
                self.map.setView(newView);
                newView.setResolution(newRes);
                setLayer();
            }
        }
        else {
            setLayer();
        }
    });
};

TC.wrap.Map.prototype.setExtent = function (extent, options, callback) {
    const self = this;
    if (Util.isFunction(options)) {
        callback = options;
        options = {};
    }
    else {
        options = options || {};
    }

    const setPromise = function (extent) {
        self._setExtentPromise = new Promise(function (resolve, _reject) {
            // Timeout porque OL3 no tiene evento featuresadded, por tanto cuando se activa map.options.zoomToMarkers
            // se lanza un setExtent por marcador. El timeout evita ejecuciones a lo tonto.
            clearTimeout(self._timeout);
            self._timeout = setTimeout(function applyExtent() {

                const getExtentAndEnd = function () {
                    const extent = self.getExtent();
                    if (Util.isFunction(callback)) {
                        callback(extent);
                    }
                    resolve(extent);
                };

                const fitOptions = {
                    callback: getExtentAndEnd,
                    nearest: !options.contain
                };
                if (options.animate === void (0) || options.animate) {
                    // Si no se especifica animate, se anima
                    fitOptions.duration = Consts.ZOOM_ANIMATION_DURATION;
                }

                self.map.getView().fit(extent, fitOptions);
            }, 50);
        });
    };
    Promise.resolve(self._setExtentPromise).finally(function () {
        setPromise(extent);
    });

    return self._setExtentPromise;
};

TC.wrap.Map.prototype.getExtent = function () {
    return this.map.getView().calculateExtent(this.map.getSize());
};

TC.wrap.Map.prototype.setCenter = function (coords, options = {}) {
    const self = this;
    return new Promise(function (resolve, _reject) {
        const callback = function () {
            resolve();
        };

        const view = self.map.getView();

        if (options.animate) {
            view.animate({
                center: coords, duration: Consts.ZOOM_ANIMATION_DURATION
            }, callback);
        }
        else {
            view.setCenter(coords);
            resolve();
        }
    });
};

TC.wrap.Map.prototype.getCenter = function () {
    return this.map.getView().getCenter();
};

TC.wrap.Map.prototype.getResolution = function () {
    return this.map.getView().getResolution();
};

TC.wrap.Map.prototype.setResolution = async function (resolution) {
    const olMap = await this.getMap();
    olMap.getView().setResolution(resolution);
    return resolution;
};

TC.wrap.Map.prototype.setRotation = function (rotation) {
    this.getMap().then(function (olMap) {
        olMap.getView().setRotation(rotation);
    });
};

TC.wrap.Map.prototype.getRotation = function () {
    return this.map.getView().getRotation();
};

TC.wrap.Map.prototype.getResolutions = function () {
    return this.map.getView().getResolutions() || [];
};

TC.wrap.Map.prototype.getCoordinateFromPixel = function (xy) {
    return this.map.getCoordinateFromPixel(xy);
};

TC.wrap.Map.prototype.getPixelFromCoordinate = function (coord) {
    return this.map.getPixelFromCoordinate(coord);
};

TC.wrap.Map.prototype.getViewport = function (options) {
    const self = this;
    var result;
    var opts = options || {
    };
    if (opts.synchronous) {
        result = self.map.getViewport();
    }
    else {
        result = new Promise(function (resolve, _reject) {
            self.getMap().then(function (olMap) {
                resolve(olMap.getViewport());
            });
        });
    }
    return result;
};

TC.wrap.Map.prototype.getCanvas = function () {
    const self = this;
    if (self.parent.on3DView) {
        const scene = self.parent.view3D.getScene();
        const newCanvas = document.createElement("canvas");
        newCanvas.width = scene.canvas.width;
        newCanvas.height = scene.canvas.height;
        const ctxt = newCanvas.getContext("2d");
        scene.canvas.getContext('webgl', { preserveDrawingBuffer: true });
        scene.requestRenderMode = false;
        scene.render();
        ctxt.drawImage(scene.canvas, 0, 0, scene.canvas.width, scene.canvas.height);
        scene.requestRenderMode = true;
        scene.canvas.getContext('webgl', { preserveDrawingBuffer: false });

        //const image = document.createElement("img");
        //image.width=newCanvas.width = scene.canvas.width;
        //image.height = newCanvas.height = scene.canvas.height;

        //image.src = data.image;

        return [newCanvas];
    }
    else
        return Array.from(self.parent.div.querySelectorAll('.ol-viewport canvas:not(.tc-ctl-ovmap canvas)'));
};

TC.wrap.Map.prototype.isNative = function (map) {
    return map instanceof ol.Map;
};

TC.wrap.Map.prototype.isGeo = function () {
    var units = this.map.getView().getProjection().getUnits();
    return !units || units === Consts.units.DEGREES;
};

TC.wrap.Map.prototype.addPopup = async function (popupCtl) {
    const self = this;
    var draggable = popupCtl.options.draggable === undefined || popupCtl.options.draggable;
    const olMap = await self.getMap();
    if (!popupCtl.wrap.popup) {
        // No popups yet
        var popup = new ol.Overlay({
            element: popupCtl.popupDiv,
            positioning: olOverlayPositioning.BOTTOM_LEFT
        });
        olMap.addOverlay(popup);
        popupCtl.wrap.popup = popup;


        //popupCtl._firstRender.resolve();
        //popupCtl.trigger(Consts.event.CONTROLRENDER);

        if (draggable) {
            let offset;
            const container = popupCtl.popupDiv.parentElement;
            popupCtl.popupDiv.classList.add(Consts.classes.DRAGGABLE);


            container.addEventListener('touchmove', function (e) {
                var parent = e.target;
                do {
                    if (parent.matches && parent.matches('.tc-ctl-finfo-layer-content')) {
                        e.stopPropagation();
                        break;
                    }
                    parent = parent.parentElement;
                }
                while (parent);
            }, { passive: true });

            Util.makeDraggableElement(container.querySelector('.tc-ctl-popup'), {
                handleSelector: ':not(th,td, td *,input,sitna-button,sitna-toggle,select,.tc-ctl-finfo-coords,sitna-measurement, h3, h4)',
                dragStartCallback: (_elm, e) => {
                    offset = popup.getOffset() || [0, 0];
                    var bcr = e.target.getBoundingClientRect();
                    // Si estamos pulsando sobre una barra de scroll abortamos drag
                    if (bcr.left + e.target.clientWidth < e.pageX || bcr.top + e.target.clientHeight < e.pageY) {
                        return false;
                    }
                    popupCtl.setDragging(true);
                },
                dragEndCallback: (_elm, delta) => {
                    popupCtl.setDragging(false);
                    offset = [offset[0] + delta[0], offset[1] + delta[1]];
                    popup.setOffset(offset);
                    return false;
                }
            });
        }
    }
};

TC.wrap.Map.prototype.hidePopup = function (popupCtl) {
    var self = this;
    self.parent.currentFeature = null;
    if (popupCtl.popupDiv) {
        popupCtl.popupDiv.classList.remove(Consts.classes.VISIBLE);
    }
};

TC.wrap.Map.prototype.manageSize = function () {
    const self = this;
    self.pixelRatio_ = window.devicePixelRatio;

    // Para controlar que el mapa no se vea borroso porque no encajan el width y height con los width y height de CSS
    const manageSize = function () {
        self.updateSize();
    };

    if (!Util.detectMobile()) {
        //self.on(POSTRENDER, manageSize);
        manageSize();
        window.addEventListener('resize', manageSize);
    }
};

var getFormatFromName = function (name, extractStyles) {
    switch (name) {
        case Consts.layerType.KML:
        case Consts.mimeType.KML:
        case Consts.format.KMZ:
            //10/11/2021 URI:Ahora el KML Custom es una modificación directa del KML y no una sobrecarga de éste. Se añade al build de ol al compilar
            //return new ol.format.KMLCustom({
            return new ol.format.KML({
                showPointNames: false,
                extractStyles: extractStyles !== undefined ? extractStyles : true
            });
        case Consts.layerType.GPX:
        case Consts.mimeType.GPX:
            return new ol.format.GPX();
        case Consts.layerType.GEOJSON:
        case Consts.mimeType.GEOJSON:
        case Consts.mimeType.JSON:
        case Consts.format.JSON:
            return new ol.format.GeoJSON();
        case Consts.format.GML2:
            return new ol.format.GML2();
        case Consts.format.GML3:
            return new ol.format.GML3();
        case Consts.format.GML32:
            return new ol.format.GML32({
                featureNS: 'http://www.opengis.net/gml/3.2',
                featureType: 'feature'
            });
        case Consts.mimeType.GML:
        case Consts.format.GML:
            return new ol.format.GML32({
                featureNS: 'http://www.opengis.net/gml/3.2',
                featureType: 'feature'
            });
        case Consts.format.TOPOJSON:
            return new ol.format.TopoJSON();
        case Consts.format.WKT:
            return new ol.format.WKT();
        case Consts.format.WKB:
            return new ol.format.WKB();
        case Consts.format.GEOPACKAGE:
            return new ol.format.GeoPackage();
        case Consts.format.SHAPEFILE:
            return new ol.format.Shapefile();
        default:
            return null;
    }
};

TC.wrap.Map.prototype.exportFeatures = async function (features, options = {}) {
    const self = this;
    const nativeStyle = createNativeStyle({
        styles: self.parent.options.styles
    });
    const featureStyles = new WeakMap();
    const layerStyles = new WeakMap();
    const olFeatures = features.map((f) => f.wrap.feature);
    for (const olFeature of olFeatures) {
        const initialStyle = olFeature.getStyle();
        featureStyles.set(olFeature, initialStyle);
        if (Object.hasOwn(olFeature, '_originalStyle')) {
            olFeature.setStyle(olFeature._originalStyle);
        }
        // Si la feature no tiene estilo propio le ponemos el de la capa, y si no hay, el definido por la API
        if (!initialStyle) {
            const parentLayer = olFeature._wrap?.parent.layer;
            let layerStyle;
            if (parentLayer) {
                if (layerStyles.has(parentLayer)) layerStyle = layerStyles.get(parentLayer);
                else {
                    if (parentLayer.styles) {
                        layerStyle = createNativeStyle(parentLayer);
                        layerStyles.set(parentLayer, layerStyle);
                    }
                }
            }
            olFeature.setStyle(layerStyle ?? nativeStyle);
        }
    }

    let featureTypeMetadata;
    const firstFeature = features[0];
    if (features.length && firstFeature.layer && features.every((f) => f.layer === firstFeature.layer)) {
        featureTypeMetadata = await firstFeature.layer.getFeatureTypeMetadata();
    }

    const format = getFormatFromName(options.format);
    format.featureTypeMetadata = featureTypeMetadata;
    format.srsName = Util.toURNCRS(self.parent.crs);
    const result = await format.writeFeatures(olFeatures, {
        featureProjection: self.parent.crs,
        featureTypeMetadata,
        adaptPropertyNames: options.adaptPropertyNames,
        acceptTimeLoss: options.acceptTimeLoss,
    });

    for (const olFeature of olFeatures) {
        const initialStyle = featureStyles.get(olFeature);
        olFeature.setStyle(initialStyle);
    }
    return result;
};

var isFileDrag = function (e) {
    for (var i = 0, len = e.dataTransfer.types.length; i < len; i++) {
        if (e.dataTransfer.types[i] === 'Files') {
            return true;
        }
    }
    return false;
};

var handleDragEnter = function (e) {
    var self = this;
    if (isFileDrag(e)) { // Solo hay gestión si lo que se arrastra es un archivo
        self.getMap()._wrap.parent.div.classList.add(Consts.classes.DROP);
        e.preventDefault();
        e.stopPropagation();
    }
};

var handleDragExit = function (e) {
    var self = this;
    if (isFileDrag(e)) { // Solo hay gestión si lo que se arrastra es un archivo
        var map = self.getMap()._wrap.parent;
        if (e.target === self.target) {
            map.div.classList.remove(Consts.classes.DROP);
        }
    }
};

TC.wrap.Map.prototype.enableDragAndDrop = function (options = {}) {
    var self = this;
    var ddOptions = {
        formatConstructors: [
            //10/11/2021 URI:Ahora el KML Custom es una modificación directa del KML y no una sobrecarga de éste. Se añade al build de ol al compilar
            //ol.format.KMLCustom,
            ol.format.KML,
            ol.format.GPX,
            new ol.format.GML32({
                featureNS: 'http://www.opengis.net/gml/3.2',
                featureType: 'feature'
            }),
            ol.format.GML2,
            ol.format.GML3CRS84,
            ol.format.GML2CRS84,
            ol.format.GML3,
            ol.format.GeoJSON,
            new ol.format.WKT({
                splitCollection: true
            }),
            new ol.format.WKB({
                splitCollection: true
            }),
            ol.format.TopoJSON,
            ol.format.GeoPackage,
            ol.format.Shapefile
        ]
    };
    if (options.dropTarget) {
        ddOptions.target = Util.getDiv(options.dropTarget);
    }
    else {
        ddOptions.target = self.parent.div;
    }
    var zipFiles = null;
    var ddInteraction = new ol.interaction.DragAndDrop(ddOptions);
    ddInteraction.on('addfeatures', function (e) {
        const visibility = e.features?.every((f) => f._visibility === e.features[0]._visibility) ? e.features[0]._visibility : undefined;
        const features = e.features ? e.features.map(function (elm) {
            if (!elm.getId()) {
                elm.setId(TC.getUID());
            }
            return TC.wrap.Feature.createFeature(elm);
        }) : [];

        const featuresWithGeometry = features.filter(f => f.geometry);
        //15/11/2021 RI: Cambio la lógica. Si algunas features no tienen geometría lanzo un evento nuevo para a posteriori sacar un warning
        if (featuresWithGeometry.length) {
            const featuresImportEventData = {
                features: featuresWithGeometry,
                file: e.file,
                fileHandle: e.file._fileHandle,
                fileName: e.file.name,
                dropTarget: e.target.target,
                timeStamp: e.file.lastModified,
                groupIndex: e._groupIndex,
                groupCount: e._groupCount,
                groupName: e._groupName,
                metadata: e._metadata
            };
            if (visibility !== undefined) featuresImportEventData.visibility = visibility;
            if (e.file.name.substring(e.file.name.lastIndexOf(".") + 1).toLowerCase() === 'shp') {
                // Los shapefiles son multiarchivo, añado los demás fileHandles.
                const nameBase = e.file.name.substring(0, e.file.name.lastIndexOf(".")).toLowerCase();
                featuresImportEventData.additionalFileHandles = ['.dbf', '.prj', '.cst', '.cpg', '.shx']
                    .map(ext => e.file._fileHandle?._siblings?.find((fh) => fh.name.toLowerCase() === nameBase + ext))
                    .filter(fh => !!fh)
                    .filter(fh => fh !== featuresImportEventData.fileHandle);
            }
            if (e.file._fileSystemFile) {
                featuresImportEventData.fileSystemFile = e.file._fileSystemFile;
                delete e.file._fileSystemFile;
            }
            if (ddInteraction._fileLayers?.length) {
                const fileLayers = ddInteraction._fileLayers.filter((l) => {
                    const result =
                        ((!featuresImportEventData.fileSystemFile && l.file === e.file.name)
                            || l._fileHandle.name === featuresImportEventData.fileSystemFile?.name)
                        &&
                        (l.options.groupIndex === e._groupIndex || e._groupIndex === 0 && !l.options.groupIndex);
                    if (result) l.file = e.file.name;
                    return result;
                });
                if (fileLayers.length) {
                    featuresImportEventData.targetLayers = fileLayers;
                }
                else {
                    self.parent.getLoadingIndicator()?.removeWait(self.parent._featureImportWaitId);
                }
            }

            let recentFileEntryPromise;

            // Lógica para gestionar archivos recientes
            if (featuresImportEventData.fileHandle) {
                let recentFileEntry = {
                    mainHandle: featuresImportEventData.fileHandle
                };
                if (featuresImportEventData.additionalFileHandles) {
                    recentFileEntry.additionalHandles = featuresImportEventData.additionalFileHandles;
                }
                recentFileEntryPromise = self.parent.addRecentFileEntry(recentFileEntry);
            }
            else {
                recentFileEntryPromise = Promise.resolve();
            }

            recentFileEntryPromise.then(() => {
                if (featuresImportEventData.targetLayers) {
                    ddInteraction._fileLayers = ddInteraction._fileLayers
                        .filter(elm => !featuresImportEventData.targetLayers.includes(elm));
                }
                self.parent.trigger(Consts.event.FEATURESIMPORT, featuresImportEventData);
                if (features.some(f => !f.geometry)) {
                    self.parent.trigger(Consts.event.FEATURESIMPORTWARN, {
                        file: e.file
                    });
                }
                self.parent.getLoadingIndicator()?.removeWait(self.parent._featureImportWaitId);
            })
        }
        else { //if (!features.length || features.some(f => !f.geometry)) {
            let eventFile = e.file;
            if (zipFiles) {
                if (++zipFiles.failed < zipFiles.total) {
                    return;
                }
                else {
                    // const fileHandle = e._fileHandle;
                    eventFile = new File([], zipFiles.zipName);
                }
            }
            self.parent.getLoadingIndicator()?.removeWait(self.parent._featureImportWaitId);
            self.parent.trigger(Consts.event.FEATURESIMPORTERROR, {
                file: eventFile
            });
        }
    });

    ddInteraction.on('error', function (e) {
        self.parent.getLoadingIndicator()?.removeWait(self.parent._featureImportWaitId);
        self.parent.trigger(Consts.event.FEATURESIMPORTERROR, {
            file: e.file
        });
    });
    if (options.once) {
        ddInteraction.map_ = self.map;
    }
    else {
        self.map.addInteraction(ddInteraction);
        var dropArea = ddInteraction.target ? ddInteraction.target : self.map.getViewport();

        // Añadidos gestores de eventos para mostrar el indicador visual de drop.
        var handleDrop = function (e) {
            if (isFileDrag(e)) { // Solo hay gestión si lo que se arrastra es un archivo
                const map = self.parent;
                if (ddInteraction.target === e.target) {
                    if (!isEmpty(e.dataTransfer.items)) {
                        var li = map.getLoadingIndicator();
                        if (li) {
                            map._featureImportWaitId = li.addWait(map._featureImportWaitId);
                        }
                    }
                    validateTransfer(e.dataTransfer.items);
                    e.stopPropagation();
                }
                else {
                    e.preventDefault();
                }
                map.div.classList.remove(Consts.classes.DROP);
            }
        };
        var isEmpty = function (items) {
            for (var i = 0, ii = items.length; i < ii; ++i) {
                if (items[i].kind === "file") {
                    if (items[i].getAsFile() || items[i].webkitGetAsEntry() && items[i].webkitGetAsEntry().isFile) {
                        return false;
                    }
                    else {
                        return isEmpty(items[i].webkitGetAsEntry());
                    }
                }
            }
            return true;
        };
        const validateTransfer = function (items) {
            const warnInvalid = function () {
                const map = self.parent;
                const li = map.getLoadingIndicator();
                if (li) {
                    li.removeWait(self.parent._featureImportWaitId);
                }
                map.toast(Util.getLocaleString(map.getLocale(), 'fileImport.invalidObjects'), { type: Consts.msgType.WARNING });
            };
            if (DataTransferItem.prototype.getAsFileSystemHandle) {
                // Rama de File System Access API
                Promise.all(Array.from(items).map(f => f.getAsFileSystemHandle())).then(function (handles) {
                    if (handles.every(h => h === undefined)) {
                        warnInvalid();
                    }
                })
            }
            else {
                // Rama de File System API
                if (!items.length) {
                    warnInvalid();
                }
            }
        }
        ddInteraction.dropListenKeys_.push(
            ol.events.listen(dropArea, DRAGENTER,
                handleDragEnter, ddInteraction)
        );
        ddInteraction.dropListenKeys_.push(
            ol.events.listen(document.body, DRAGENTER,
                handleDragEnter, ddInteraction)
        );
        ddInteraction.dropListenKeys_.push(
            ol.events.listen(dropArea, DRAGOVER,
                handleDragEnter, ddInteraction)
        );
        ddInteraction.dropListenKeys_.push(
            ol.events.listen(document.body, DRAGOVER,
                handleDragEnter, ddInteraction)
        );
        ddInteraction.dropListenKeys_.push(
            ol.events.listen(dropArea, DROP,
                handleDrop, ddInteraction)
        );
        ddInteraction.dropListenKeys_.push(
            ol.events.listen(document.body, DROP,
                handleDrop, ddInteraction)
        );
        ddInteraction.dropListenKeys_.push(
            ol.events.listen(document.body, 'dragleave',
                handleDragExit, ddInteraction)
        );
        ddInteraction.dropListenKeys_.push(
            ol.events.listen(document.body, 'dragend',
                handleDragExit, ddInteraction)
        );
        ddInteraction.dropListenKeys_.push(
            ol.events.listen(document.body, 'dragexit',
                handleDragExit, ddInteraction)
        );
        document.addEventListener('mouseenter', function (e) {
            if (!e.buttons) {
                self.parent.div.classList.remove(Consts.classes.DROP);
            }
        }, false);
        self.ddEnabled = true;
    }
    return ddInteraction;
};

//TC.wrap.Map.prototype.parseFeatures = function (text) {
//    let ddInteraction;
//    let features = null;
//    if (this.ddEnabled) {
//        this.map.getInteractions().forEach(function (elm) {
//            if (elm instanceof ol.interaction.DragAndDrop) {
//                ddInteraction = elm;
//            }
//        });
//    }
//    else {
//        ddInteraction = this.enableDragAndDrop({
//            once: true
//        });
//    }

//    const formats = ddInteraction.formats_.filter((format) => format.getType() !== 'arraybuffer');
//    for (let i = 0, ii = formats.length; i < ii; ++i) {
//        const currentFormat = formats[i];
//        try {
//            features = currentFormat.readFeatures(text, {
//                featureProjection: this.parent.crs
//            });
//            if (features?.length) {
//                break;
//            }
//        } catch (_e) {
//            continue;
//        }
//    }
//    return features;
//};

const getDdInteraction = function (wrap) {
    let ddInteraction;
    if (wrap.ddEnabled) {

        wrap.map.getInteractions().forEach(function (elm) {
            if (elm instanceof ol.interaction.DragAndDrop) {
                ddInteraction = elm;
            }
        });
    }
    else {
        ddInteraction = wrap.enableDragAndDrop({
            once: true
        });
    }
    return ddInteraction;
};

TC.wrap.Map.prototype.loadFiles = async function (files, options) {
    const self = this;
    if (!files.length) return;
    const ddInteraction = getDdInteraction(self);
    if (!ddInteraction) return;

    if (options) {
        var currentTarget = ddInteraction.target;
        ddInteraction.target = options.control;

        self.parent.one(Consts.event.FEATURESIMPORT, function undoTarget(_e) {
            ddInteraction.target = currentTarget;
        });

        if (options.layers) {
            const currentFileLayers = ddInteraction._fileLayers || [];
            ddInteraction._fileLayers = currentFileLayers
                .concat(options.layers.filter(l => !currentFileLayers.includes(l)));
        }
    }

    const li = self.parent.getLoadingIndicator();
    if (li) {
        self.parent._featureImportWaitId = li.addWait(self.parent._featureImportWaitId);
    }
    for (var i = 0, ii = files.length; i < ii; ++i) {
        const file = files[i];
        ddInteraction.processFile(file);
    }
};

TC.wrap.Map.prototype.importDocument = async function (parts) {
    const opts = { featureProjection: this.parent.crs };
    const ddInteraction = getDdInteraction(this);
    if (!ddInteraction) return;

    for (const f of ddInteraction.formats_) {
        for (const data of parts) {
            const olFeatures = await ddInteraction.tryReadFeatures_(f, data, opts);
            if (olFeatures?.length) {
                return olFeatures.map((feat) => TC.wrap.Feature.createFeature(feat));
            }
        }
    }
    return null;
};

TC.wrap.Map.prototype.linkTo = function (map) {
    const self = this;
    const onChangeView = function () {
        const thisView = self.map.getView();
        const thatView = map.wrap.map.getView();
        setTimeout(function () {
            if (thisView !== thatView) {
                self.map.setView(thatView);
            }
        }, 100);
    };
    map.wrap.map.on('change:view', onChangeView);
    self.map.on('change:view', onChangeView);
    onChangeView();
};

const bufferExtent = function (extent, resolution, width) {
    const extentBuffer = width * (resolution || 1);
    return extent.map((v, i) => i < 2 ? v - extentBuffer : v + extentBuffer);
};


TC.wrap.Geometry = {
    getNearest: function (point, candidates) {
        let geom;
        if (Geometry.isRingCollection(candidates)) {
            geom = new ol.geom.MultiLineString(candidates);
        }
        else {
            geom = new ol.geom.LineString(candidates);
        }
        return geom.getClosestPoint(point);
    }
};

var getStyleValue = function (property, feature) {
    var result = property;
    var olFeat = feature && feature.wrap && feature.wrap.feature;
    if (typeof property === 'string') {
        var match = property.match(/^\$\{(.+)\}$/);
        if (match) {
            result = '';
            if (olFeat) {
                // Permitimos el formato ${prop.subprop.subsubprop}
                var m = match[1].split('.');
                var r = olFeat.getProperties();
                for (var i = 0; i < m.length && r !== undefined; i++) {
                    r = r[m[i]];
                }
                result = r ?? '';
            }
        }
    }
    else if (Util.isFunction(property)) {
        result = property(feature);
    }
    return result;
};

const mergeMapAndGeneralStyles = function (layer) {
    const result = Util.extend(true, {}, TC.Cfg.styles);
    if (layer && layer.map) {
        Util.extend(true, result, layer.map.options.styles);
    }
    return result;
};

const isParamStyle = function (options) {
    if (options) {
        for (var key in options) {
            if (key == 'point' || key == 'line' || key == 'polygon' || key == 'marker' || key == 'cluster' || Util.isStyleOption(key)) {
                const value = options[key];
                if (typeof value === 'string') {
                    if (/^\$\{(.+)\}$/.test(value)) {
                        return true;
                    }
                }
                else if (typeof value === 'object') {
                    if (isParamStyle(value)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
};

const getNativeFeatureData = function (olFeature) {
    let isPoint, isLine, isPolygon, feature;
    if (olFeature) {
        const olGeom = olFeature.getGeometry();
        switch (olGeom && olGeom.getType()) {
            case 'Point':
            case 'MultiPoint':
                isPoint = true;
                break;
            case 'LineString':
            case 'MultiLineString':
                isLine = true;
                break;
            case 'Polygon':
            case 'MultiPolygon':
                isPolygon = true;
                break;
        }
        if (olFeature._wrap) {
            feature = olFeature._wrap.parent;
        }
        else {
            // Si la API SITNA no ha completado su feature, creamos un mock-up para que no fallen las funciones de estilo
            feature = {
                id: TC.wrap.Feature.prototype.getId.call({
                    feature: olFeature
                }), // GLS añado el id de la feature para poder filtrar por la capa a la cual pertenece                    
                features: olFeature.get('features'),
                getData: function () {
                    return TC.wrap.Feature.prototype.getData.call({
                        feature: olFeature
                    });
                }
            };
        }
        return [feature, isPoint, isLine, isPolygon];
    }
    return [null, false, false, false];
};

// Transformación de opciones de estilo en un estilo nativo OL.
const createNativeStyle = function (options, olFeat) {
    if (Util.isFunction(options)) {
        return function (f) {
            return createNativeStyle(options(f._wrap.parent));
        }
    }

    const isDynamicStyle = isParamStyle(options.styles);

    const styleFunction = function (olFeat) {

        const nativeStyleOptions = [];
        const [feature, isPoint, isLine, isPolygon] = getNativeFeatureData(olFeat);
        let styles = options.styles || {};
        let isCluster = feature && Array.isArray(feature.features) && feature.features.length > 1;
        const externalStyles = mergeMapAndGeneralStyles(options.layer);
        if (isCluster) {
            styles = TC.Util.extend(true, {}, externalStyles.cluster, options && options.styles && options.styles.cluster ? options.styles.cluster : {});
        }
        let styleOptions = {};
        if (styles.line && (isLine || !olFeat)) {
            styleOptions = styles.line;
            (Array.isArray(styleOptions) ? styleOptions : [styleOptions]).forEach(function (currentStyle, index) {
                nativeStyleOptions[index] = Object.assign(nativeStyleOptions[index] || {},
                    {
                        stroke: new ol.style.Stroke({
                            color: getStyleValue(currentStyle.strokeColor, feature),
                            width: getStyleValue(currentStyle.strokeWidth, feature),
                            lineDash: currentStyle.lineDash
                        }),
                        zIndex: currentStyle.zIndex,
                    });
            });
        }

        if (styles.polygon && (isPolygon || !olFeat)) {
            styleOptions = styles.polygon;
            (Array.isArray(styleOptions) ? styleOptions : [styleOptions]).forEach(function (currentStyle, index) {
                const newStyleOptions = {
                    stroke: new ol.style.Stroke({
                        color: getStyleValue(currentStyle.strokeColor, feature),
                        width: getStyleValue(currentStyle.strokeWidth, feature),
                        lineDash: currentStyle.lineDash
                    }),
                    zIndex: currentStyle.zIndex,
                };
                if (currentStyle.fillColor) {
                    newStyleOptions.fill = new ol.style.Fill({
                        color: getRGBA(getStyleValue(currentStyle.fillColor, feature), getStyleValue(currentStyle.fillOpacity, feature))
                    });
                }
                nativeStyleOptions[index] = Object.assign(nativeStyleOptions[index] || {}, newStyleOptions);
            });
        }

        if (styles.point && (isPoint || !olFeat)) {
            styleOptions = styles.point;
            (Array.isArray(styleOptions) ? styleOptions : [styleOptions]).forEach(function (currentStyle, index) {
                var circleOptions = {
                    radius: getStyleValue(currentStyle.radius, feature) ??
                        (getStyleValue(currentStyle.height, feature) + getStyleValue(currentStyle.width, feature)) / 4
                };
                if (currentStyle.fillColor) {
                    circleOptions.fill = new ol.style.Fill({
                        color: getRGBA(getStyleValue(currentStyle.fillColor, feature), getStyleValue(currentStyle.fillOpacity, feature))
                    });
                }
                if (currentStyle.strokeColor) {
                    circleOptions.stroke = new ol.style.Stroke({
                        color: getStyleValue(currentStyle.strokeColor, feature),
                        width: getStyleValue(currentStyle.strokeWidth, feature),
                        lineDash: currentStyle.lineDash
                    });
                }

                if (Number.isNaN(circleOptions.radius)) circleOptions.radius = TC.Cfg.styles?.point?.radius;
                if (!Number.isNaN(circleOptions.radius)) {
                    nativeStyleOptions[index] = Object.assign(nativeStyleOptions[index] || {}, {
                        image: new ol.style.Circle(circleOptions),
                        zIndex: currentStyle.zIndex,
                    });
                }
            });

        }

        if (typeof styleOptions.label === "string" || styleOptions.labelKey) {
            nativeStyleOptions[nativeStyleOptions.length] = {
                text: createNativeTextStyle(styleOptions, feature),
                zIndex: styleOptions.zIndex,
            };
        }

        if (styles.marker && (isPoint || !olFeat)) {
            styleOptions = styles.marker;
            (Array.isArray(styleOptions) ? styleOptions : [styleOptions]).forEach(function (currentStyle, index) {

                const cssStyle = Util.getFeatureStyleFromCss(currentStyle.cssClass);
                const iconUrl = currentStyle.url || cssStyle?.url;

                var ANCHOR_DEFAULT_UNITS = 'fraction';
                if (iconUrl) {
                    let iconSize;
                    if (cssStyle?.width) {
                        iconSize = [cssStyle.width, cssStyle.height];
                    }
                    else if (currentStyle.width && currentStyle.height) {
                        iconSize = [getStyleValue(currentStyle.width, feature), getStyleValue(currentStyle.height, feature)];
                    }
                    nativeStyleOptions[index] = Object.assign(nativeStyleOptions[index] || {}, {
                        image: new ol.style.Icon({
                            crossOrigin: 'anonymous',
                            anchor: currentStyle.anchor || styles.marker.anchor || [0.5, 1],
                            anchorXUnits: currentStyle.anchorXUnits || ANCHOR_DEFAULT_UNITS,
                            anchorYUnits: currentStyle.anchorYUnits || ANCHOR_DEFAULT_UNITS,
                            src: iconUrl,
                            width: iconSize?.[0],
                            height: iconSize?.[1],
                            //10/11/2021 URI: Recuperamos la rotación de los iconos que viene en grados y lo pasamos a radianes
                            rotation: currentStyle.rotation ? currentStyle.rotation / 180 * Math.PI : undefined
                        }),
                        text: createNativeTextStyle(currentStyle, feature),
                        zIndex: currentStyle.zIndex,
                    });
                }
            });
        }
        //10/11/2021 URI:Si entre la opciones de estilos trae un globo (balloon), seguramente se trate de la importación de un KML. Creamos un atributo nuevo llamado _balloon que posteriormente
        //será leido en el método getTemplate de la feature para pintar el bocadillo tipado
        //if (styleOptions.balloon)
        //    (styleOptions.balloon instanceof Array ? styleOptions.balloon : [styleOptions.balloon]).forEach(function (currentStyle, index) {
        //        nativeStyleOptions[index] = Object.assign(nativeStyleOptions[index] || {}, {
        //            "_balloon": new ol.style.Text({ text: currentStyle })
        //        });
        //    });
        var nativeStyle = nativeStyleOptions.map((currentStyle) => {
            var style = new ol.style.Style(currentStyle)
            if (styleOptions.balloon) style._balloon = new ol.style.Text({ text: styleOptions.balloon });
            return style;
        });
        return nativeStyle;
    }

    return isDynamicStyle ? styleFunction : styleFunction(olFeat);
};

const getFlatStyleExpression = function (value, feature) {
    if (typeof value === 'string') {
        const match = value.match(/^\$\{(.+)\}$/);
        if (match) {
            return ['get', match[1]];
        }
    }
    else if (Util.isFunction(value)) {
        return value(feature);
    }
    return value;
};

// Transformación de opciones de estilo en un estilo nativo "plano".
const createFlatStyle = function (options, olFeat) {
    if (Util.isFunction(options)) {
        return function (f) {
            return createFlatStyle(options(f._wrap.parent));
        }
    }


    const flatStyle = [];

    const [feature, isPoint, isLine, isPolygon] = getNativeFeatureData(olFeat);
    const styles = options.styles || {};
    let styleOptions = {};
    let currentFlatStyle = {};
    if (styles.line && (isLine || !olFeat)) {
        styleOptions = styles.line;
        const lineFlatRule = {
            else: true,
            filter: ['==', ['geometry-type'], 'LineString'],
            style: {},
        };
        flatStyle.push(lineFlatRule);
        currentFlatStyle = lineFlatRule.style;
        for (const currentStyle of (styleOptions instanceof Array ? styleOptions : [styleOptions])) {
            Object.assign(currentFlatStyle, {
                'stroke-color': getFlatStyleExpression(getRGBA(currentStyle.strokeColor, currentStyle.strokeOpacity), feature),
                'stroke-width': getFlatStyleExpression(currentStyle.strokeWidth, feature),
            });
            if (currentStyle.lineDash) {
                Object.assign(currentFlatStyle, {
                    'stroke-line-dash': currentStyle.lineDash,
                });
            }
        }
    }

    if (styles.polygon && (isPolygon || !olFeat)) {
        styleOptions = styles.polygon;
        const polygonFlatRule = {
            else: true,
            filter: ['==', ['geometry-type'], 'Polygon'],
            style: {},
        };
        flatStyle.push(polygonFlatRule);
        currentFlatStyle = polygonFlatRule.style;
        for (const currentStyle of (styleOptions instanceof Array ? styleOptions : [styleOptions])) {
            Object.assign(currentFlatStyle, {
                'stroke-color': getFlatStyleExpression(getRGBA(currentStyle.strokeColor, currentStyle.strokeOpacity), feature),
                'stroke-width': getFlatStyleExpression(currentStyle.strokeWidth, feature),
            });
            if (currentStyle.lineDash) {
                Object.assign(currentFlatStyle, {
                    'stroke-line-dash': currentStyle.lineDash,
                });
            }
            if (currentStyle.fillColor) {
                Object.assign(currentFlatStyle, {
                    'fill-color': getFlatStyleExpression(getRGBA(currentStyle.fillColor, currentStyle.fillOpacity), feature),
                });
            }
        }
    }

    if (styles.point && (isPoint || !olFeat)) {
        styleOptions = styles.point;
        const pointFlatRule = {
            else: true,
            filter: ['==', ['geometry-type'], 'Point'],
            style: {},
        };
        currentFlatStyle = pointFlatRule.style;
        for (const currentStyle of (styleOptions instanceof Array ? styleOptions : [styleOptions])) {
            let circleRadius = getFlatStyleExpression(currentStyle.radius, feature) ||
                (getStyleValue(currentStyle.height, feature) + getStyleValue(currentStyle.width, feature)) / 4;
            if (Number.isNaN(circleRadius)) circleRadius = TC.Cfg.styles?.point?.radius;
            if (!Number.isNaN(circleRadius)) {
                Object.assign(currentFlatStyle, {
                    'circle-radius': circleRadius,
                });
                if (currentStyle.fillColor) {
                    Object.assign(currentFlatStyle, {
                        'circle-fill-color': getFlatStyleExpression(getRGBA(currentStyle.fillColor, currentStyle.fillOpacity), feature),
                    });
                }
                if (currentStyle.strokeColor) {
                    Object.assign(currentFlatStyle, {
                        'circle-stroke-color': getFlatStyleExpression(getRGBA(currentStyle.strokeColor, currentStyle.strokeOpacity), feature),
                        'circle-stroke-width': getFlatStyleExpression(currentStyle.strokeWidth, feature),
                        'circle-stroke-line-dash': currentStyle.lineDash,
                    });
                }
                flatStyle.push(pointFlatRule);
            }
        }

    }

    if (styles.marker && (isPoint || !olFeat)) {
        styleOptions = styles.marker;
        const pointFlatRule = {
            else: true,
            filter: ['==', ['geometry-type'], 'Point'],
            style: {},
        };
        currentFlatStyle = pointFlatRule.style;
        for (const currentStyle of (styleOptions instanceof Array ? styleOptions : [styleOptions])) {

            const cssStyle = Util.getFeatureStyleFromCss(currentStyle.cssClass);
            const iconUrl = currentStyle.url || cssStyle?.url;

            var ANCHOR_DEFAULT_UNITS = 'fraction';
            if (iconUrl) {
                let iconSize;
                if (cssStyle?.width) {
                    iconSize = [cssStyle.width, cssStyle.height];
                }
                else if (currentStyle.width && currentStyle.height) {
                    iconSize = [getStyleValue(currentStyle.width, feature), getStyleValue(currentStyle.height, feature)];
                }
                Object.assign(currentFlatStyle, {
                    'icon-cross-origin': 'anonymous',
                    'icon-anchor': currentStyle.anchor || styles.marker.anchor || [0.5, 1],
                    'icon-anchor-x-units': currentStyle.anchorXUnits || ANCHOR_DEFAULT_UNITS,
                    'icon-anchor-y-units': currentStyle.anchorYUnits || ANCHOR_DEFAULT_UNITS,
                    'icon-src': iconUrl,
                    'icon-width': iconSize?.[0],
                    'icon-height': iconSize?.[1],
                    //10/11/2021 URI: Recuperamos la rotación de los iconos que viene en grados y lo pasamos a radianes
                    'icon-rotation': currentStyle.rotation ? currentStyle.rotation / 180 * Math.PI : undefined,
                });
            }
        }

        if (typeof styleOptions.label === "string" || styleOptions.labelKey) {
            Object.assign(currentFlatStyle, createFlatTextStyle(styleOptions));
        }

    }
    //10/11/2021 URI:Si entre la opciones de estilos trae un globo (balloon), seguramente se trate de la importación de un KML. Creamos un atributo nuevo llamado _balloon que posteriormente
    //será leido en el método getTemplate de la feature para pintar el bocadillo tipado
    for (const styleRule of flatStyle) {
        if (styleOptions.balloon) styleRule._balloon = createFlatTextStyle({ text: styleOptions.balloon });
    }

    return flatStyle;
};

const createNativeTextStyle = function (styleObj, feature) {
    if (!(typeof styleObj?.label === "string" || styleObj?.labelKey)) {
        return;
    }

    const textOptions = {
        text: '' + getStyleValue(styleObj.labelKey || styleObj.label, feature),
        overflow: true
    };
    //const olGeom = feature.wrap.feature.getGeometry();
    //if (olGeom instanceof ol.geom.LineString || olGeom instanceof ol.geom.MultiLineString) {
    //    textOptions.placement = ol.style.TextPlacement.LINE;
    //}
    if (styleObj.font) {
        textOptions.font = styleObj.font;
    }
    else if (styleObj.fontSize) {
        textOptions.font = getStyleValue(styleObj.fontSize, feature) + 'pt sans-serif';
    }
    if (styleObj.labelRotationKey) {
        textOptions.rotation = -Math.PI * getStyleValue(styleObj.labelRotationKey, feature) / 180;
    }
    if (styleObj.fontColor) {
        const fontColor = getStyleValue(styleObj.fontColor, feature);
        textOptions.fill = new ol.style.Fill({
            //09/11/2021 URI:Se estaba forzando la opacidad a 1 incluso si esta está definida en el 4 elemento del color
            color: getRGBA(fontColor)
            //color: getRGBA(getStyleValue(styleObj.fontColor, feature), 1)
        });
    }
    if (styleObj.labelOutlineColor) {
        const outlineColor = getStyleValue(styleObj.labelOutlineColor, feature);
        textOptions.stroke = new ol.style.Stroke({
            //09/11/2021 URI:Se estaba forzando la opacidad a 1 incluso si esta está definida en el 4 elemento del color
            color: getRGBA(outlineColor),
            //color: getRGBA(getStyleValue(styleObj.labelOutlineColor, feature), 1),
            width: getStyleValue(styleObj.labelOutlineWidth, feature)
        });
    }
    if (styleObj.labelBackgroundColor) {
        const fillColor = getStyleValue(styleObj.labelBackgroundColor, feature);
        textOptions.backgroundFill = new ol.style.Fill({
            //09/11/2021 URI:Se estaba forzando la opacidad a 1 incluso si esta está definida en el 4 elemento del color
            color: getRGBA(fillColor),
        });
    }
    if (styleObj.labelOffset) {
        textOptions.offsetX = styleObj.labelOffset[0];
        textOptions.offsetY = styleObj.labelOffset[1];
    }
    //09/11/2021 URI: Antes no se le podía especificar la escala de la fuente de los labels        
    if (styleObj.textScale) {
        textOptions.scale = styleObj.textScale;
    }
    //09/11/2021 URI: Antes no se le podía especificar la alineación de la fuente de los labels           
    if (styleObj.textAlign) {
        textOptions.textAlign = styleObj.textAlign;
    }
    //
    return new ol.style.Text(textOptions);
};

const createFlatTextStyle = function (styleOptions, feature) {
    const flatStyle = {};
    let text = getFlatStyleExpression(styleOptions.labelKey || styleOptions.label, feature);
    if (!Array.isArray(text)) text = '' + text;
    flatStyle['text-value'] = text;
    flatStyle['text-overflow'] = true;

    if (styleOptions.fontSize) {
        flatStyle['text-font'] = getFlatStyleExpression(styleOptions.fontSize, feature) + 'pt sans-serif';
    }
    else if (styleOptions.font) {
        flatStyle['text-font'] = styleOptions.font;
    }
    if (styleOptions.labelRotationKey) {
        flatStyle['text-rotation'] = -Math.PI * getFlatStyleExpression(styleOptions.labelRotationKey, feature) / 180;
    }
    if (styleOptions.fontColor) {
        flatStyle['text-fill-color'] = getFlatStyleExpression(styleOptions.fontColor, feature);
    }
    if (styleOptions.labelOutlineColor) {
        flatStyle['text-stroke-color'] = getFlatStyleExpression(styleOptions.labelOutlineColor, feature);
        flatStyle['text-stroke-width'] = getFlatStyleExpression(styleOptions.labelOutlineWidth, feature);
    }
    if (styleOptions.labelOffset) {
        flatStyle['text-offset-x'] = getFlatStyleExpression(styleOptions.labelOffset[0]);
        flatStyle['text-offset-y'] = getFlatStyleExpression(styleOptions.labelOffset[1]);
    }
    //09/11/2021 URI: Antes no se le podía especificar la escala de la fuente de los labels        
    if (styleOptions.textScale) {
        flatStyle['text-scale'] = getFlatStyleExpression(styleOptions.textScale);
    }
    //09/11/2021 URI: Antes no se le podía especificar la alineación de la fuente de los labels           
    if (styleOptions.textAlign) {
        flatStyle['text-align'] = getFlatStyleExpression(styleOptions.textAlign);
    }
    return flatStyle;
};

const toHexString = (value) => Number(value).toString(16).padStart(2, '0');

var getHexColorFromArray = function (colorArray) {
    return '#' + toHexString(colorArray[0]) + toHexString(colorArray[1]) + toHexString(colorArray[2]);
};

var getStyleFromNative = function (olStyle, olFeat) {
    var result = {
    };
    if (Util.isFunction(olStyle)) {
        if (olFeat) {
            olStyle = olStyle(olFeat);
        }
    }
    if (Array.isArray(olStyle)) {
        olStyle = olStyle[0];
    }
    if (!Util.isFunction(olStyle)) {
        var color;
        var stroke;
        var fill;
        if (olFeat) {
            const olGeom = olFeat.getGeometry();
            if (olGeom) {
                const olGeomType = olGeom.getType();
                // Si la geometría no aplica, no poner ol.style.Image
                // Esto es porque el parser de KML genera estilos "totum revolutum" a partir de las URL de estilos (bug 27470)
                if (olGeomType !== olGeometryType.POINT && olGeomType !== olGeometryType.MULTI_POINT) {
                    olStyle.setImage(null);
                }
            }
        }
        var image = olStyle.getImage();
        if (image) {
            if (image instanceof ol.style.RegularShape) {
                stroke = image.getStroke();
                color = stroke.getColor();
                if (color) {
                    color = ol.color.asArray(color);
                    result.strokeColor = getHexColorFromArray(color);
                }
                result.strokeWidth = stroke.getWidth();
                fill = image.getFill();
                if (fill) {
                    color = fill.getColor();
                    if (color) {
                        color = ol.color.asArray(color);
                        result.fillColor = getHexColorFromArray(color);
                    }
                    result.fillOpacity = color[3];
                }
            }
            else {
                result.url = image.getSrc();
                let size = image.getSize();
                let scale = image.getScale();
                if (!size && scale) {
                    size = [32, 32];
                }
                if (size) {
                    scale ??= [1, 1];
                    if (!Array.isArray(scale)) {
                        scale = [scale, scale];
                    }
                    result.width = size[0] * scale[0];
                    result.height = size[1] * scale[1];
                    result.anchor = image.getAnchor();
                    if (result.anchor) {
                        result.anchor[0] = result.anchor[0] / result.width;
                        result.anchor[1] = result.anchor[1] / result.height;
                    }
                }
            }
        }
        else {
            stroke = olStyle.getStroke();
            if (stroke) {
                color = stroke.getColor();
                if (color) {
                    color = ol.color.asArray(color);
                    result.strokeColor = getHexColorFromArray(color);
                }
                result.strokeWidth = stroke.getWidth();
                result.lineDash = stroke.getLineDash();
            }
            fill = olStyle.getFill();
            if (fill) {
                color = fill.getColor();
                if (color) {
                    color = ol.color.asArray(color);
                    result.fillColor = getHexColorFromArray(color);
                }
                result.fillOpacity = color[3];
            }
        }
    }

    return result;
};

TC.wrap.Parser = function () {
};

TC.wrap.Parser.prototype.read = function (data) {
    var result = [];
    var self = this;
    if (self.parser) {
        result = self.parser.readFeatures(data).map(function (feat) {
            return new Feature_s(null, {
                id: feat.getId(), data: feat.getProperties()
            });
        });
    }
    return result;
};

TC.wrap.Parser.prototype.readFeatures = function (data) {
    var result = [];
    var self = this;
    if (self.parser) {
        result = self.parser.readFeatures(data).map(function (feat) {
            let coordinates = feat.getGeometry().getCoordinates();
            const featureOptions = {};
            let geometry;
            switch (feat.getGeometry().getType()) {
                case "LineString":
                    geometry = new Polyline(coordinates, featureOptions);
                    break;
                case "Polygon":
                    geometry = new Polygon_s(coordinates, featureOptions);
                    break;
                case "MultiPoint":
                    geometry = new MultiPoint_s(coordinates, featureOptions);
                    break;
                case "MultiLineString":
                    geometry = new MultiPolyline(coordinates, featureOptions);
                    break;
                case "MultiPolygon":
                    geometry = new MultiPolygon_s(coordinates, featureOptions);
                    break;
                case "Point":
                default:
                    geometry = new Point_s(coordinates, featureOptions);
                    break;
            }
            return geometry;
        });
    }
    return result;
};

TC.wrap.parser = {
    WFS: function (options) {
        this.parser = new ol.format.WFS(options);
    },
    JSON: function (options) {
        this.parser = new ol.format.GeoJSON(options);
    }
};
TC.inherit(TC.wrap.parser.WFS, TC.wrap.Parser);
TC.inherit(TC.wrap.parser.JSON, TC.wrap.Parser);

const imageBitmapToDataURL = function (imageBitmap, type = 'image/png', quality = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0);
    return canvas.toDataURL(type, quality);
};

TC.wrap.Feature.prototype.getLegend = function () {
    var self = this;
    var result = {
    };
    var style = getNativeFeatureStyle(self.feature, true);
    if (style) {
        var image = style.getImage();
        if (image) {
            if (image instanceof ol.style.Icon) {
                result.src = image.getSrc();
                var img = image.getImage(1);
                if (img.width) {
                    result.width = img.width;
                    result.height = img.height;
                }
                var scale = image.getScale();
                if (scale) {
                    result.scale = scale;
                }
            }
            else if (image instanceof ol.style.Circle) {
                const imageObject = image.getImage(1);
                if (imageObject instanceof ImageBitmap) result.src = imageBitmapToDataURL(imageObject);
                else result.src = image.getImage(1).toDataURL();
            }
            if (self.parent.options.radius) {
                result.height = result.width = self.parent.options.radius * 2;
            }
        }
        else {
            let geometryType;
            switch (self.feature.getGeometry().getType()) {
                case olGeometryType.MULTI_POLYGON:
                case olGeometryType.POLYGON:
                    geometryType = Consts.geom.POLYGON;
                    break;
                case olGeometryType.MULTI_LINE_STRING:
                case olGeometryType.LINE_STRING:
                    geometryType = Consts.geom.POLYLINE;
                    break;
                default:
                    geometryType = Consts.geom.POINT;
                    break;
            }

            result.src = Util.getLegendImageFromStyle(getStyleFromNative(style), { geometryType });
            // No image, find stroke and fill
            //var stroke = style.getStroke();
            //var fill = style.getFill();
            //if (stroke) {
            //    var strokeColor = stroke.getColor();
            //    if (strokeColor) {
            //        result.strokeColor = ol.color.asString(strokeColor);
            //    }
            //    var strokeWidth = stroke.getWidth();
            //    if (strokeWidth) {
            //        result.strokeWidth = strokeWidth;
            //    }
            //}
            //if (fill) {
            //    var fillColor = fill.getColor();
            //    if (fillColor) {
            //        result.fillColor = ol.color.asString(fillColor);
            //    }
            //}
        }
    }

    return result;
};

const createFeatureBasics = function (coords, options) {
    const self = this;
    self.feature = new ol.Feature();
    if (self.parent.id) {
        self.feature.setId(self.parent.id);
    }
    if (options.geometryName) {
        self.feature.setGeometryName(options.geometryName);
    }
    self.feature._wrap = self;
    self.parent.setCoordinates(coords);
    self.parent.setData(self.parent.data);
};

TC.wrap.Feature.prototype.createPoint = function (coords, options = {}) {
    const self = this;
    createFeatureBasics.call(self, coords, options);
    if (Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { point: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createMultiPoint = function (coords, options = {}) {
    const self = this;
    createFeatureBasics.call(self, coords, options);
    if (Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { point: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createMarker = function (coords, options = {}) {
    const self = this;
    var iconUrl = Util.getPointIconUrl(options);
    if (iconUrl) {
        options.url = iconUrl;
        createFeatureBasics.call(self, coords, options);
        if (Util.hasStyleOptions(options)) {
            self.feature.setStyle(createNativeStyle({ styles: { marker: options } }, self.feature));
        }
    }
    else {
        self.createPoint(coords, options);
    }
};

TC.wrap.Feature.prototype.createMultiMarker = function (coords, options = {}) {
    const self = this;
    var iconUrl = Util.getPointIconUrl(options);
    if (iconUrl) {
        options.url = iconUrl;
        createFeatureBasics.call(self, coords, options);
        if (Util.hasStyleOptions(options)) {
            self.feature.setStyle(createNativeStyle({ styles: { marker: options } }, self.feature));
        }
    }
    else {
        self.createMultiPoint(coords, options);
    }
};

TC.wrap.Feature.prototype.createPolyline = function (coords, options = {}) {
    const self = this;
    createFeatureBasics.call(self, coords, options);
    if (Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { line: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createPolygon = function (coords, options = {}) {
    const self = this;
    createFeatureBasics.call(self, coords, options);
    if (Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { polygon: options } }, self.feature));
    }
};


TC.wrap.Feature.prototype.createMultiPolyline = function (coords, options = {}) {
    const self = this;
    createFeatureBasics.call(self, coords, options);
    if (Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { line: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createMultiPolygon = function (coords, options = {}) {
    const self = this;
    createFeatureBasics.call(self, coords, options);
    if (Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { polygon: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createCircle = function (coords, options = {}) {
    const self = this;
    createFeatureBasics.call(self, coords, options);
    self.feature.setStyle(
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: options.strokeColor,
                width: options.strokeWidth,
                lineDash: options.lineDash
            }),
            fill: new ol.style.Fill({
                color: getRGBA(options.fillColor, options.fillOpacity)
            })
        })
    );
};

TC.wrap.Feature.createFeature = function (olFeat, options = {}) {
    if (olFeat._sitnaFeature) {
        olFeat._sitnaFeature.data = olFeat._sitnaFeature.wrap.getData();
        olFeat._sitnaFeature.geometry = olFeat._sitnaFeature.wrap.getGeometry();
    }
    else {
        var olGeometry = olFeat.getGeometry();
        options.id = olFeat.getId();
        let olStyle = olFeat.getStyle();
        if (olStyle) {
            Util.extend(options, getStyleFromNative(olStyle, olFeat));
        }
        // geometría
        let geomStr;
        switch (true) {
            case olGeometry instanceof ol.geom.Point:
            case olGeometry instanceof ol.geom.MultiPoint:
                if (Util.isFunction(olStyle)) {
                    olStyle = olStyle(olFeat);
                }
                var olStyles = olStyle ?
                    Array.isArray(olStyle) ? olStyle : [olStyle] :
                    [];
                for (var i = 0, len = olStyles.length; i < len; i++) {
                    olStyle = olStyles[i];
                    if (olStyle.getImage() instanceof ol.style.Icon) {
                        geomStr = 'Marker';
                        break;
                    }
                }
                geomStr = geomStr || 'Point';
                if (olGeometry instanceof ol.geom.MultiPoint) {
                    if (geomStr === 'Point') {
                        geomStr = 'MultiPoint';
                    }
                    if (geomStr === 'Marker') {
                        geomStr = 'MultiMarker';
                    }
                }
                break;
            case olGeometry instanceof ol.geom.LineString:
                geomStr = 'Polyline';
                break;
            case olGeometry instanceof ol.geom.Polygon:
                geomStr = 'Polygon';
                break;
            case olGeometry instanceof ol.geom.MultiLineString:
                geomStr = 'MultiPolyline';
                break;
            case olGeometry instanceof ol.geom.MultiPolygon:
                geomStr = 'MultiPolygon';
                break;
            default:
                break;
        }
        let feat;
        if (geomStr) {
            feat = new featureNamespace[geomStr](olFeat, options);
        }
        else {
            feat = new Feature_s(olFeat, options);
        }
        feat.data = feat.wrap.getData();
        olFeat._sitnaFeature = feat;
    }
    return olFeat._sitnaFeature;
};

TC.wrap.Feature.prototype.cloneFeature = function () {
    const result = this.feature.clone();
    if (Object.hasOwn(this.feature, '_originalStyle')) {
        result._originalStyle = this.feature._originalStyle;
    }
    return result;
};

TC.wrap.Feature.prototype.getStyle = function (_2D) {
    var self = this;
    var result = {};
    var olStyle = self.feature.getStyle();
    if (Util.isFunction(olStyle)) {
        olStyle = olStyle(self.feature);
    }
    var olStyles = olStyle ?
        Array.isArray(olStyle) ? olStyle : [olStyle] :
        [];
    const toColorAndOpacity = function (value) {
        if (Array.isArray(value)) {
            return ["#" + toHexString(value[0]) + toHexString(value[1]) + toHexString(value[2]), parseFloat(value[3])];
        }
        let match = value.match(/rgba\(([\d\.]+),([\d\.]+),([\d\.]+),([\d\.]+)\)/i);
        if (match) {
            return toColorAndOpacity(match.slice(1, 5));
        }
        match = value.match(/rgb\(([\d\.]+),([\d\.]+),([\d\.]+)\)/i);
        if (match) {
            return toColorAndOpacity([...match.slice(1, 4), 1]);
        }
        return [value, 1];
    };
    const getFill = function (style, obj) {
        if (style) {
            const fill = style.getFill() || style.getImage()?.getFill?.call(style.getImage());
            if (fill) {
                const [fillColor, fillOpacity] = toColorAndOpacity(fill.getColor());
                obj.fillColor = fillColor;
                if (fillOpacity !== 1) {
                    obj.fillOpacity = fillOpacity;
                }
            }
        }
    };
    const getStroke = function (style, obj) {
        if (style) {
            const stroke = style.getStroke();
            if (stroke) {
                obj.strokeColor = stroke.getColor();
                obj.strokeWidth = stroke.getWidth();
            }
        }
    };

    for (var i = 0, len = olStyles.length; i < len; i++) {
        olStyle = olStyles[i];
        getFill(olStyle, result);
        getStroke(olStyle, result);
        const image = olStyle.getImage();
        if (image instanceof ol.style.Icon) {
            if (!self.parent.options?.cssClass || (self.parent.options?.cssClass && !Util.getFeatureStyleFromCss(self.parent.options?.cssClass)?.url))
                result.url = image.getSrc();
            const size = image.getSize();
            let scale = image.getScale();
            if (!scale) {
                scale = [1, 1];
            }
            if (!Array.isArray(scale)) {
                scale = [scale, scale];
            }
            if (size) {
                result.width = size[0] * scale[0];
                result.height = size[1] * scale[1];
            }
            //10/11/2021 URI: ncluir la rotacion de los icono que venga presumiblemente de un KML
            //pasamos la rotacion a grados para que sea mas escueta que en radianes
            const rotation = image.getRotation();

            if (rotation) {
                result.rotation = 180 * rotation / Math.PI;
            }
            var anchor = image.getAnchor();
            if (anchor) {
                result.anchor = [anchor[0] * scale[0], anchor[1] * scale[1]];
                if (size) {
                    // getAnchor devuelve los valores en pixels, hay que transformar a fracción
                    result.anchor[0] = result.anchor[0] / result.width;
                    result.anchor[1] = result.anchor[1] / result.height;
                }
            }
        }
        else if (image instanceof ol.style.Circle) {
            getFill(image, result);
            getStroke(image, result);
            result.radius = image.getRadius();
        }
        else {
            getFill(image, result);
            getStroke(image, result);
        }
        var text = olStyle.getText();
        if (text) {
            result.label = text.getText();
            var font = text.getFont();
            if (font) {
                // A 96dpi 3pt = 4px
                result.fontSize = parseInt(font.match(/\d+pt/)) || parseInt(font.match(/\d+px/)) * 0.75;
                result.font = font;
            }
            var rotation = text.getRotation();
            if (rotation) {
                result.labelRotationKey = -180 * rotation / Math.PI;
            }
            //09/11/2021 URI: No se está replicando la escala de los labels
            var textScale = text.getScale();
            if (textScale) {
                result.textScale = textScale;
            }
            //09/11/2021 URI: No se está replicando la alineacion de los labels
            var textAlign = text.getTextAlign();
            if (textAlign) {
                result.textAlign = textAlign;
            }
            result.labelOffset = [text.getOffsetX(), text.getOffsetY()];
            var fill = text.getFill();
            if (fill) {
                result.fontColor = fill.getColor();
            }
            var stroke = text.getStroke();
            if (stroke) {
                result.labelOutlineColor = stroke.getColor();
                result.labelOutlineWidth = stroke.getWidth();
            }
        }
        //09/11/2021 URI: Añadimos el estilo de los globos de aquella features que vengan de un KML 
        if (olStyle._balloon && olStyle._balloon.getText())
            result.balloon = olStyle._balloon.getText();
    }
    Util.extend(self.parent.options, result);
    if (self.feature3D && _2D !== true) result = Object.assign(result, self.feature3D.getStyle())
    if (Object.keys(result).length === 0) {
        return null;
    }
    return result;
};

TC.wrap.Feature.prototype.getGeometry = function () {
    var result;
    var self = this;
    if (self.feature && self.feature.getGeometry) {
        var geom = self.feature.getGeometry();
        if (geom) {
            if (geom instanceof ol.geom.Circle) {
                const center = geom.getCenter();
                result = [center, [center[0] + geom.getRadius(), center[1]]];
            }
            else if (geom.getCoordinates) {
                result = geom.getCoordinates();
            }
        }
    }
    return result;
};

TC.wrap.Feature.prototype.setGeometry = function (geometry) {
    const self = this;
    if (self.feature && self.feature.getGeometry) {
        var geom = self.feature.getGeometry();
        let Ctor;
        var point,
            points,
            ringsOrPolylines,
            polygons,
            isMultiPolygon,
            isPolygonOrMultiLineString,
            isLineString;
        // punto: array de números
        // línea o anillo: array de puntos
        // multilínea o polígono: array de líneas o anillos
        // multipolígono: array de polígonos
        // Por tanto podemos recorrer los tipos en un switch sin breaks
        switch (true) {
            case self.parent instanceof MultiPolygon_s:
                isMultiPolygon = true;
                Ctor = ol.geom.MultiPolygon;
                polygons = geometry;
                if (Array.isArray(polygons)) {
                    ringsOrPolylines = geometry[0];
                }
            case self.parent instanceof Polygon_s || self.parent instanceof MultiPolyline:
                isPolygonOrMultiLineString = true;
                Ctor = Ctor || (self.parent instanceof Polygon_s ? ol.geom.Polygon : ol.geom.MultiLineString);
                ringsOrPolylines = isMultiPolygon ? ringsOrPolylines : geometry;
                if (Array.isArray(ringsOrPolylines)) {
                    points = ringsOrPolylines[0];
                }
            case self.parent instanceof Polyline || self.parent instanceof MultiPoint_s:
                isLineString = true;
                Ctor = Ctor || (self.parent instanceof Polyline ? ol.geom.LineString : ol.geom.MultiPoint);
                points = isPolygonOrMultiLineString ? points : geometry;
                if (Array.isArray(points)) {
                    point = points[0];
                }
            case self.parent instanceof Point_s:
                Ctor = Ctor || ol.geom.Point;
                point = isLineString ? point : geometry;
                if (Array.isArray(point) && typeof point[0] === 'number' && typeof point[1] === 'number') {
                    let layout;
                    switch (point.length) {
                        case 3:
                            layout = 'XYZ';
                            break;
                        case 4:
                            layout = 'XYZM';
                            break;
                        default:
                            layout = 'XY';
                            break;
                    }
                    if (geom) {
                        geom.setCoordinates(geometry, layout);
                    }
                    else {
                        geom = new Ctor(geometry, layout);
                        self.feature.setGeometry(geom);
                    }
                }
                break;
            case self.parent instanceof Circle: {
                const [center, circunferencePoint] = Circle.parseGeometry(geometry);
                let layout;
                switch (center.length) {
                    case 3:
                        layout = 'XYZ';
                        break;
                    case 4:
                        layout = 'XYZM';
                        break;
                    default:
                        layout = 'XY';
                        break;
                }
                const radius = Math.hypot(circunferencePoint[0] - center[0], circunferencePoint[1] - center[1]);
                if (geom) {
                    geom.setCenterAndRadius(center, radius, layout);
                }
                else {
                    geom = new ol.geom.Circle(center, radius, layout);
                    self.feature.setGeometry(geom);
                }
                break;
            }
        }
        if (self.feature3D?.setCoordinates && self.parent.layer?.map.on3DView) {
            self.feature3D.setCoordinates.call(self.feature3D, TC.Util.reproject(geometry, self.parent.layer.map.view3D.view2DCRS, self.parent.layer.map.view3D.crs));
        }
    }
};

TC.wrap.Feature.prototype.getId = function () {
    var result;
    var self = this;
    if (self.feature) {
        result = self.feature.getId();
    }
    return result;
};

TC.wrap.Feature.prototype.setId = function (id) {
    var self = this;
    if (self.feature) {
        self.feature.setId(id);
    }
};

const getPolygonLength = function (coordinates) {
    let result = 0;
    coordinates.forEach(function (ring) {
        const polygon = new ol.geom.Polygon([ring]);
        const newRing = polygon.getLinearRing(0);
        result = result + ol.geom.flat.linearRingLength(newRing.flatCoordinates, 0, newRing.flatCoordinates.length, newRing.stride);
    });
    return result;
};

const getLineStringLength = function (coordinates) {
    const line = new ol.geom.LineString(coordinates);
    return line.getLength();
};

TC.wrap.Feature.prototype.getLength = function (options = {}) {
    const self = this;
    let result = 0;

    if (self.feature3D && self.parent?.layer?.map.on3DView) {
        return self.parent.layer.map.view3D.getLength(self.feature3D);
    }

    const geom = self.feature.getGeometry();
    const coordinates = options.coordinates || geom.getCoordinates();
    switch (true) {
        case geom instanceof ol.geom.Polygon:
            result = getPolygonLength(coordinates);
            break;
        case geom instanceof ol.geom.LineString:
            result = getLineStringLength(coordinates);
            break;
        case geom instanceof ol.geom.MultiPolygon:
            coordinates.forEach(function (polygon) {
                result = result + getPolygonLength(polygon);
            });
            break;
        case geom instanceof ol.geom.MultiLineString:
            coordinates.forEach(function (lineString) {
                result = result + getLineStringLength(lineString);
            });
            break;
    }

    return result;
};

TC.wrap.Feature.prototype.getArea = function (options = {}) {
    const self = this;

    if (self.feature3D && self.parent?.layer?.map.on3DView) {
        return self.parent.layer.map.view3D.getArea(self.feature3D);
    }

    const geom = self.feature.getGeometry();
    let Ctor;
    if (geom instanceof ol.geom.Polygon) {
        Ctor = ol.geom.Polygon;
    }
    else if (geom instanceof ol.geom.MultiPolygon) {
        Ctor = ol.geom.MultiPolygon;
    }
    if (Ctor) {
        const coordinates = options.coordinates || geom.getCoordinates();
        const newGeom = new Ctor(coordinates);
        return newGeom.getArea();
    }
    return 0;
};

const getNativeFeatureStyle = function (feature, readonly) {
    var style = feature.getStyle();
    if (Util.isFunction(style)) {
        style = style(feature);
    }
    if (Array.isArray(style)) {
        style = style.reduce(function (extendedStyle, currentStyle) {
            extendedStyle.fill_ = currentStyle.fill_ || extendedStyle.fill_;
            extendedStyle.image_ = currentStyle.image_ || extendedStyle.image_;
            extendedStyle.stroke_ = currentStyle.stroke_ || extendedStyle.stroke_;
            extendedStyle.text_ = currentStyle.text_ || extendedStyle.text_;
            return extendedStyle;
        }, new ol.style.Style());
    }
    if (!style && !readonly) {
        style = new ol.style.Style();
        feature.setStyle(style);
    }
    return style;
};

TC.wrap.Feature.prototype.setStyle = function (options) {
    const self = this;
    const olFeat = self.feature;
    if (options === null) {
        olFeat.setStyle(null);
        if (self.feature3D) {
            const layerStyle = self.parent.layer.styles[self.parent.STYLETYPE];
            self.feature3D.setStyle(layerStyle);
            setTimeout(() => {
                self.parent.layer.map.view3D.refresh();
            }, 100);
        }
        return;
    }
    const feature = self.parent;
    const featureStyleOptions = {
        styles: {}
    };
    featureStyleOptions.styles[feature.STYLETYPE] = options;
    let newStyle = createNativeStyle(featureStyleOptions, olFeat);

    olFeat.setStyle(newStyle);
    //estilos de features 3D
    if (feature.layer && self.feature3D) {

        let currentStyle = olFeat._originalStyle || newStyle;
        if (Util.isFunction(currentStyle))
            currentStyle = currentStyle();
        //const textStyle = currentStyle.find((s) => s.getText());
        self.feature3D.setStyle(options);
        if (options.label)
            self.feature3D.setLabel({
                outlineColor: "#FFFFFF",
                fontColor: options.fontColor || "#000000",
                outlineWidth: options.labelOutlineWidth,
                font: (options.font || (options.fontSize + "pt sans-serif")),
                text: options.label,
                offset: options.labelOffset
            });
        setTimeout(() => {
            self.parent.layer.map.view3D.refresh();
        }, 100);
    }

    if (Object.hasOwn(olFeat, '_originalStyle')) {
        delete olFeat._originalStyle;
        self.toggleSelectedStyle(true);
    }

    olFeat.changed();
};

TC.wrap.Feature.prototype.toggleSelectedStyle = function (condition) {
    const self = this;
    const feature = self.feature;
    const setStyle = condition === undefined ? !Object.hasOwn(feature, '_originalStyle') : condition;
    if (setStyle) {
        setSelectedStyle(feature);
        if (self.feature3D && !self.feature3D.editing) self.feature3D.highlight();
    }
    else {
        removeSelectedStyle(feature);
        if (self.feature3D) self.feature3D.unhighlight();
    }
};

TC.wrap.Feature.prototype.getInnerPoint = function (options = {}) {
    var result;
    // Funciones para hacer clipping con el extent actual. Así nos aseguramos de que el popup sale en un punto visible actualmente.
    var feature = this.feature;
    var geometry = feature.getGeometry();

    let coords;
    let clipped = false;
    result = geometry.getFirstCoordinate();
    switch (geometry.getType()) {
        case olGeometryType.MULTI_POLYGON:
            if (options.clipBox) {
                geometry = new ol.geom.MultiPolygon(geometry
                    .getPolygons()
                    .map(pol => TC.Geometry.clipPolygon(pol.getCoordinates(), options.clipBox))
                    .filter(pol => pol.length));
                clipped = true;
            }
            var area = 0;
            geometry = geometry.getPolygons().reduce(function (prev, cur) {
                const curArea = cur.getArea();
                const result = curArea > area ? cur : prev;
                area = curArea;
                return result;
            });
        case olGeometryType.POLYGON:
            coords = geometry.getCoordinates();
            if (options.clipBox && !clipped) {
                coords = TC.Geometry.clipPolygon(coords, options.clipBox);
            }
            geometry = new ol.geom.Polygon(coords);
            result = geometry.getInteriorPoint().getCoordinates();
            var rings = geometry.getLinearRings();
            for (var i = 1; i < rings.length; i++) {
                if (TC.Geometry.isInside(result, rings[i].getCoordinates())) {
                    result = geometry.getClosestPoint(result);
                    break;
                }
            }
            break;
        case olGeometryType.MULTI_LINE_STRING:
            if (options.clipBox) {
                geometry = new ol.geom.MultiLineString(geometry
                    .getLineStrings()
                    .map(ls => TC.Geometry.clipPolyline(ls.getCoordinates(), options.clipBox))
                    .filter(ls => ls.length));
                clipped = true;
            }
            var length = 0;
            geometry = geometry.getLineStrings().reduce(function (prev, cur) {
                const curLength = cur.getLength();
                const result = curLength > length ? cur : prev;
                length = curLength;
                return result;
            });
        case olGeometryType.LINE_STRING:
            var centroid = [0, 0];
            coords = geometry.getCoordinates();
            if (options.clipBox && !clipped) {
                coords = TC.Geometry.clipPolyline(coords, options.clipBox);
            }
            geometry = new ol.geom.LineString(coords);
            coords.forEach(coord => {
                centroid[0] += coord[0];
                centroid[1] += coord[1];
            });
            centroid[0] /= coords.length;
            centroid[1] /= coords.length;
            result = geometry.getClosestPoint(centroid);
            break;
        default:
            break;
    }
    return result;
};

TC.wrap.Feature.prototype.showPopup = function (options = {}) {
    const self = this;
    const popupCtl = options instanceof TC.Control ? options : options.control;
    var map = popupCtl.map;
    if (map) {
        var feature = self.feature;
        if (feature) {
            const parentFeature = self.parent;
            map.currentFeature = parentFeature;
            var currentExtent = map.getExtent();

            self._innerCentroid = self.getInnerPoint({ clipBox: currentExtent });

            const html = options.html || self.parent.getInfo({ locale: map.getLocale() });
            let container = popupCtl.contentDiv;
            if (options.shadow) {
                container.childNodes.forEach((child) => { container.removeChild(child) });
                container = document.createElement('div');
                popupCtl.contentDiv.appendChild(container);
                container = container.shadowRoot ?? container.attachShadow({ mode: 'open' });
            }
            container.innerHTML = html;

            var parentOptions = self.parent.options;
            if (Util.isEmptyObject(parentOptions) && self.parent.layer &&
                self.parent.layer.styles) {

                switch (true) {
                    case parentFeature instanceof Point_s:
                        parentOptions = self.parent.layer.styles.point;

                        // 11/03/2019 Al crear las features del API desde las features nativas, 
                        // se valida si la feature tiene icono para definir si es punto o marcador
                        // el problema viene cuando la feature no tiene estilo propio sino que lo obtiene de la capa,
                        // en esos casos se define como punto lo que es un marcador y cuando llegamos aquí no se accede a las
                        // opciones de marcador sino de punto.
                        if (!parentOptions || Util.isEmptyObject(parentOptions)) {
                            parentOptions = self.parent.layer.styles.marker;
                        }
                        break;
                    case parentFeature instanceof Marker:
                        parentOptions = self.parent.layer.styles.marker;
                        break;
                    case parentFeature instanceof Circle:
                    case parentFeature instanceof MultiPolygon_s:
                    case parentFeature instanceof Polygon_s:
                        parentOptions = self.parent.layer.styles.polygon;
                        break;
                    case parentFeature instanceof MultiPolyline:
                    case parentFeature instanceof Polyline:
                        parentOptions = self.parent.layer.styles.line;
                        break;
                }
            }

            // Calcular anchor
            var anchor;
            if (parentOptions.anchor) {
                anchor = getStyleValue(parentOptions.anchor, self.parent);
            }
            else {
                var style;
                var f = feature._wrap.parent;
                for (var i = 0; i < map.workLayers.length; i++) {
                    var layer = map.workLayers[i];
                    if (!layer.isRaster()) {
                        if (layer.features.indexOf(f) >= 0) {
                            style = layer.wrap.styleFunction(feature);
                            break;
                        }
                    }
                }
                if (Array.isArray(style)) {
                    const image = style[0]?.getImage?.();
                    anchor = !image || image instanceof ol.style.Icon ? [0.5, 0] : [0.5, 0.5];
                }
            }
            const offset = [0, 0];
            if (anchor) {
                if (parentOptions.height) {
                    offset[1] = -(getStyleValue(parentOptions.height, self.parent) || 0) * anchor[1];
                }
                else {
                    var fStyle = getNativeFeatureStyle(feature, true);
                    if (fStyle) {
                        const image = fStyle.getImage();
                        if (image instanceof ol.style.Icon) {
                            const size = image.getImageSize();
                            if (size) {
                                const scale = image.getScale();
                                const scaleY = Array.isArray(scale) ? scale[1] : scale;
                                offset[1] = size[1] * -scaleY;
                            }
                        }
                    }
                }
            }
            popupCtl.wrap.setDragged(false);
            popupCtl.wrap.popup.setOffset(offset);
            popupCtl.wrap.popup.setPosition(self._innerCentroid);
            popupCtl.popupDiv.parentElement.style.translate = "none";
            if (!popupCtl.popupDiv.classList.contains(Consts.classes.VISIBLE)) {
                popupCtl.popupDiv.classList.add(Consts.classes.VISIBLE);
                // Truco para forzar animación
                const parent = popupCtl.popupDiv.parentElement;
                parent.removeChild(popupCtl.popupDiv);
                parent.appendChild(popupCtl.popupDiv);
            }
        } else {
            map.wrap.hidePopup(popupCtl);
        }
    }
};

TC.wrap.Feature.prototype.isNative = function (feature) {
    return feature instanceof ol.Feature;
};

TC.wrap.Feature.prototype.getPath = function () {
    var result = [];
    var self = this;
    if (self.feature && self.feature._folders) {
        result = self.feature._folders;
    }
    return result;
};

TC.wrap.Feature.prototype.getBounds = function () {
    var result = null;
    var self = this;
    if (self.feature) {
        const geometry = self.feature.getGeometry();
        if (!geometry) return null;
        result = geometry.getExtent();
    }
    return result;
};

TC.wrap.Feature.prototype.getTemplate = function () {
    var result = null;
    var self = this;
    var style = self.feature.getStyle();
    if (Util.isFunction(style)) {
        style = style(self.feature);
    }
    if (style) {
        style = !Array.isArray(style) ? style : style.find(s => s._balloon);
        if (style && style._balloon) {
            result = style._balloon.getText();
        }
    }
    //otra manera de que tenga plantilla es utilizar el atributo description
    const properties = self.feature.getProperties();
    if (!result && Object.hasOwn(properties, "description")) {
        result = properties.description;
    }

    return result;
};

TC.wrap.Feature.prototype.getData = function () {
    var self = this;
    var result = self.feature.getProperties();
    //URI: Borramos "geometry"" de la lista de propiedades si es nula. esto pasa si la capa es un heatmap
    if (self.feature.getProperties()[self.feature.getGeometryName()] === null)
        delete result[self.feature.getGeometryName()];
    // En caso de clusters
    if (Array.isArray(result.features)) {
        if (result.features.length === 1) {
            result = result.features[0].getProperties();
        }
        else {
            result = result.features.length + ' elementos';
        }
    }
    var geometryName = self.feature.getGeometryName();
    if (result[geometryName]) {
        delete result[geometryName];
    }
    //flacunza: Transformamos las posibles geometrías secundarias que puedan tener las features de INSPIRE
    for (var property in result) {
        if (result[property] && result[property].getType) {
            const attribute = result[property];
            let Ctor;
            switch (attribute.getType()) {
                case olGeometryType.POINT:
                    Ctor = Point_s;
                    break;
                case olGeometryType.MULTI_POINT:
                    Ctor = MultiPoint_s;
                    break;
                case olGeometryType.POLYGON:
                    Ctor = Polygon_s;
                    break;
                case olGeometryType.MULTI_POLYGON:
                    Ctor = MultiPolygon_s;
                    break;
                case olGeometryType.LINE_STRING:
                    Ctor = Polyline;
                    break;
                case olGeometryType.MULTI_LINE_STRING:
                    Ctor = MultiPolyline;
                    break;
            }
            if (Ctor) {
                result[property] = new Ctor(attribute.getCoordinates());
            }
        }
    }
    return result;
};

TC.wrap.Feature.prototype.setData = function (data) {
    const newData = { ...data };
    // Esto evita que setData machaque accidentalmente la geometría
    delete newData[this.feature.getGeometryName()];
    // Esto transforma geometrías secundarias (INSPIRE) a geometrías nativas
    for (let key in newData) {
        const value = newData[key];
        let Ctor;
        switch (true) {
            case value instanceof Point_s:
                Ctor = ol.geom.Point;
                break;
            case value instanceof MultiPoint_s:
                Ctor = ol.geom.MultiPoint;
                break;
            case value instanceof Polygon_s:
                Ctor = ol.geom.Polygon;
                break;
            case value instanceof MultiPolygon_s:
                Ctor = ol.geom.MultiPolygon;
                break;
            case value instanceof Polyline:
                Ctor = ol.geom.LineString;
                break;
            case value instanceof MultiPolyline:
                Ctor = ol.geom.MultiLineString;
                break;
        }
        if (Ctor) {
            newData[key] = new Ctor(value.getCoordinates());
        }
    }
    this.feature.setProperties(newData);
};

TC.wrap.Feature.prototype.unsetData = function (key) {
    const feature = this.feature;
    feature.unset(key);
};

TC.wrap.Feature.prototype.clearData = function () {
    const feature = this.feature;
    const geometryName = feature.getGeometryName();
    feature.getKeys().forEach(function (key) {
        if (key !== geometryName) {
            feature.unset(key);
        }
    });
};

const setSnapping = function (ctl, snapping) {
    const olMap = ctl.parent.map.wrap.map;
    if (ctl.snapInteraction) {
        olMap.removeInteraction(ctl.snapInteraction);
        ctl.snapInteraction = null;
    }
    if (snapping) {
        const snapOptions = {};
        if (snapping instanceof Layer_s) {
            snapOptions.source = snapping.wrap.layer.getSource();
        }
        else if (Array.isArray(snapping)) {
            snapOptions.features = new Collection(snapping.map(f => f.wrap?.feature));
        }
        else {
            const layer = ctl.parent.layer;
            const olLayer = layer.wrap.layer;
            snapOptions.source = olLayer.getSource();
        }
        ctl.snapInteraction = new ol.interaction.Snap(snapOptions);
        olMap.addInteraction(ctl.snapInteraction);
    }
};

const createHaloStroke1 = function (width) {
    return new ol.style.Stroke({
        color: '#ffffff',
        width: width + 4
    });
};

const createHaloStroke2 = function (width) {
    return new ol.style.Stroke({
        color: '#000000',
        width: width + 6
    });
};

const addHaloToStyle = function (style) {
    if (!style) {
        style = [];
    }
    if (style instanceof ol.style.Style) {
        style = [style];
    }
    style = style.slice();
    const mainStyle = style[0];
    if (mainStyle) {
        const image = mainStyle.getImage();
        var strokeWidth;
        if (image instanceof ol.style.RegularShape) {
            strokeWidth = image.getStroke()?.getWidth() || 0;
            const radius = image.getRadius();
            const haloPart1 = mainStyle.clone();
            haloPart1.setImage(new ol.style.Circle({
                radius: radius,
                stroke: createHaloStroke1(strokeWidth)
            }));
            style.unshift(haloPart1);
            const haloPart2 = mainStyle.clone();
            haloPart2.setImage(new ol.style.Circle({
                radius: radius,
                stroke: createHaloStroke2(strokeWidth)
            }));
            style.unshift(haloPart2);
        }
        const stroke = mainStyle.getStroke();
        if (stroke) {
            strokeWidth = stroke.getWidth();
            style.unshift(new ol.style.Style({
                stroke: createHaloStroke1(strokeWidth)
            }));
            style.unshift(new ol.style.Style({
                stroke: createHaloStroke2(strokeWidth)
            }));
        }
        return style;
    }
    return null;
};

const createSelectedStyle = function (feat) {
    let originalStyle;
    if (Object.hasOwn(feat, '_originalStyle')) {
        originalStyle = feat._originalStyle;
    }
    else {
        originalStyle = feat._originalStyle = feat.getStyle();
    }
    if (!originalStyle && feat._wrap.parent.layer) {
        originalStyle = feat._wrap.parent.layer.wrap.layer.getStyle?.();
    }
    if (!originalStyle) {
        originalStyle = createNativeStyle({ styles: {} }, feat);
    }
    if (Util.isFunction(originalStyle)) {
        let selectedStyle;
        return function (f, r) {
            //URI:Incrementamos el ZIndex para que este por encima del resto de features de la capa
            selectedStyle ??= addHaloToStyle(originalStyle(f, r)).map((style) => { style.setZIndex((style.getZIndex() || 0) + 1); return style });
            return selectedStyle;
        };
    }
    //URI:Incrementamos el ZIndex para que este por encima del resto de features de la capa
    return addHaloToStyle(originalStyle)?.map((style) => { style.setZIndex((style.getZIndex() || 0) + 1); return style });
};

const setSelectedStyle = function (feat) {
    updateSelectedStyle.call(feat);
    feat.changed();
    //feat._changeListenerKey = ol.events.listen(feat, CHANGE, updateSelectedStyle, feat);
};

const removeSelectedStyle = function (feat) {
    //ol.events.unlistenByKey(feat._changeListenerKey);
    if (Object.hasOwn(feat, '_originalStyle')) {
        feat.setStyle(feat._originalStyle);
    }
    delete feat._originalStyle;
};

const updateSelectedStyle = function () {
    this.style_ = createSelectedStyle(this);
    this.styleFunction_ = !this.style_ ? undefined : ol.Feature.createStyleFunction(this.style_);
};

TC.wrap.Feature.prototype.toGML = function (version, srsName) {
    var parser;
    switch (version) {
        case '2.1':
            parser = new ol.format.GML2({
                srsName: srsName,
            });
            break;
        default:
            parser = new ol.format.GML({
                srsName: srsName,
            });
    }
    var xml = parser.writeGeometryNode(this.feature.getGeometry());
    //elimino los aributos srsName de los hijos en geometrias compuestas Polygon->LinearRing etc;
    var polygons = xml.querySelector("MultiSurface,MultiPolygon,Polygon");
    if (polygons) {
        polygons.querySelectorAll("Polygon,LinearRing").forEach(item => item.removeAttribute("srsName"));
    }
    //id para INSPIRE
    xml.firstChild.setAttribute("gml:id", xml.firstChild.tagName + "." + TC.getUID());
    //reemplazo todos los <loquesea por <gml:loquesea y </loquesea por </gml:loquesea
    return new XMLSerializer()
        .serializeToString(xml.firstChild)
        .replace(/\<\/?\w/gm, function (str) {
            var pos = str.indexOf("/") > 0 ? str.indexOf("/") + 1 : 1;
            return str.substring(0, pos) + "gml:" + str.substring(pos);
        });
    //return new XMLSerializer().serializeToString(xml.firstChild).replace(/\</gm, "<gml:");
};

TC.wrap.Feature.prototype.toGeoJSON = function () {
    var parser = new ol.format.GeoJSON();
    return parser.writeGeometry(this.feature.getGeometry());
};

TC.wrap.Geometry.write = function (options = {}) {
    var geometry;
    switch (options.format) {
        default:
            options.parser = new ol.format.GeoJSON();
    }
    switch (options.type) {
        case Consts.geom.POLYLINE:
            geometry = new ol.geom.LineString(options.coordinates);
            break;
        case Consts.geom.POLYGON:
            geometry = new ol.geom.Polygon(options.coordinates);
            break;
        case Consts.geom.MULTIPOINT:
            geometry = new ol.geom.MultiPoint(options.coordinates);
            break;
        case Consts.geom.MULTIPOLYLINE:
            geometry = new ol.geom.MultiLineString(options.coordinates);
            break;
        case Consts.geom.MULTIPOLYGON:
            geometry = new ol.geom.MultiPolygon(options.coordinates);
            break;
        case Consts.geom.POINT:
        default:
            geometry = new ol.geom.Point(options.coordinates);
            break;
    }
    return options.parser.writeGeometry(geometry);
};

TC.wrap.Geometry.toGeoJSON = function (options) {
    return TC.wrap.Geometry.write(options);
};

export default wrap;
export {
    hitTolerance,
    setSnapping,
    createNativeStyle,
    getResolutionOptions,
    getStyleFromNative,
    getNativeFeatureStyle,
    getFormatFromName,
    mergeMapAndGeneralStyles,
    getRGBA,
    getUnitRatio,
    normalizeProjection,
    getMetersPerUnit,
};
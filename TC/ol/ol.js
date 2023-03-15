import { VERSION } from 'ol/util';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import Collection from 'ol/Collection';
import { extend, includes } from 'ol/array';
import { assert } from 'ol/asserts';
import { asArray, asString } from 'ol/color';
import { toRadians } from 'ol/math';
import { padNumber } from 'ol/string';
import MapEventType from 'ol/MapEventType';
import MapBrowserEventType from 'ol/MapBrowserEventType';
import { OverviewMap, ScaleLine, Zoom, ZoomToExtent } from 'ol/control';
import ZoomSlider from 'ol/control/ZoomSlider';
import { listen, unlistenByKey } from 'ol/events';
import { shiftKeyOnly, click, never } from 'ol/events/condition';
import e_EventType from 'ol/events/EventType';
import { getWidth, getHeight, containsCoordinate, containsExtent, buffer, boundingExtent } from 'ol/extent';
import Feature from 'ol/Feature';
import { createStyleFunction } from 'ol/Feature';
import { Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon, Circle as g_Circle } from 'ol/geom';
import GeometryCollection from 'ol/geom/GeometryCollection';
import GeometryLayout from 'ol/geom/GeometryLayout';
import { deflateCoordinates } from 'ol/geom/flat/deflate';
import { inflateCoordinates } from 'ol/geom/flat/inflate';
import { linearRingLength } from 'ol/geom/flat/length';
import { xhr } from 'ol/featureloader';
import GMLBase from '../../lib/ol/format/GMLBase';
import { GML, WFS, WKT, WMSCapabilities, WMSGetFeatureInfo, WMTSCapabilities, TopoJSON } from 'ol/format';
import GeoJSON from '../../lib/ol/format/GeoJSON';
import GPX from '../../lib/ol/format/GPX';
import KML from '../../lib/ol/format/KML';
//import { GeoJSON, GML, GPX, KML, WFS, WKT, WMSCapabilities, WMSGetFeatureInfo, WMTSCapabilities, TopoJSON } from 'ol/format';
import { transformGeometryWithOptions } from 'ol/format/Feature.js';
import GML2 from 'ol/format/GML2';
import GML3 from 'ol/format/GML3';
import GML32 from 'ol/format/GML32';
import { defaults, Draw, Pointer, Translate, Snap, Select, Modify, /*DragAndDrop, */DoubleClickZoom } from 'ol/interaction';
import DragAndDrop from '../../lib/ol/interaction/DragAndDrop';
import { Layer, Tile, Image as l_Image, Vector as l_Vector, Heatmap } from 'ol/layer';
import TileGrid from 'ol/tilegrid/TileGrid';
import { unByKey } from 'ol/Observable';

import BaseObject from 'ol/Object';
import { METERS_PER_UNIT, Projection, addEquivalentProjections, get, getTransform, transform, transformExtent } from 'ol/proj';
import { METERS_PER_UNIT as g_METERS_PER_UNIT, PROJECTIONS } from 'ol/proj/epsg4326';
import Units from 'ol/proj/Units';
import { register } from 'ol/proj/proj4';
import { getVectorContext, toContext } from 'ol/render';
import r_EventType from 'ol/render/EventType';
import { Vector as s_Vector, Cluster, ImageWMS, WMTS, ImageCanvas } from 'ol/source';
//import OGCMapTile from 'ol/source/OGCMapTile';
import TileEventType from 'ol/source/TileEventType';
import VectorEventType from 'ol/source/VectorEventType';
import { optionsFromCapabilities } from 'ol/source/WMTS';
import { defaultImageLoadFunction } from 'ol/source/Image';
import { Style, RegularShape, Circle as s_Circle, Fill, Icon, Stroke, Text } from 'ol/style';
import IconAnchorUnits from 'ol/style/IconAnchorUnits';
import IconOrigin from 'ol/style/IconOrigin';
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
} from 'ol/xml';
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
} from 'ol/format/xsd';
import Image from 'ol/Image';

import proj4 from 'proj4';
import TC from '../../TC';
import wrap from '../wrap';
import Util from '../Util';
import Consts from '../Consts';
import Feature_s from '../../SITNA/feature/Feature';
import Point_s from '../../SITNA/feature/Point';
import Marker from '../../SITNA/feature/Marker';
import Polyline from '../../SITNA/feature/Polyline';
import Polygon_s from '../../SITNA/feature/Polygon';
import MultiPoint_s from '../../SITNA/feature/MultiPoint';
import MultiMarker from '../../SITNA/feature/MultiMarker';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import MultiPolygon_s from '../../SITNA/feature/MultiPolygon';
import Circle from '../../SITNA/feature/Circle';
import Geometry from '../Geometry';

TC.wrap = wrap;
TC.Util = Util;
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

window.ol = {};
ol.VERSION = VERSION;
ol.Map = Map;
ol.View = View;
ol.Overlay = Overlay;
Feature.createStyleFunction = createStyleFunction;
ol.Feature = Feature;
ol.Collection = Collection;
ol.MapEventType = MapEventType;
ol.MapBrowserEventType = MapBrowserEventType;
ol.Image = Image;

ol.array = {
    extend: extend,
    includes: includes
};

ol.asserts = {
    assert: assert
};

ol.color = {
    asArray: asArray,
    asString: asString
};

ol.math = {
    toRadians: toRadians
};

ol.string = {
    padNumber: padNumber
};

ol.control = {
    OverviewMap: OverviewMap,
    ScaleLine: ScaleLine,
    Zoom: Zoom,
    ZoomSlider: ZoomSlider,
    ZoomToExtent: ZoomToExtent
};

ol.events = {
    EventType: e_EventType,
    listen: listen,
    unlistenByKey: unlistenByKey,
    condition: {
        shiftKeyOnly: shiftKeyOnly
    }
};

ol.extent = {
    getWidth: getWidth,
    getHeight: getHeight,
    containsCoordinate: containsCoordinate,
    containsExtent: containsExtent,
    buffer: buffer,
    boundingExtent: boundingExtent
};

ol.geom = {
    Point: Point,
    MultiPoint: MultiPoint,
    LineString: LineString,
    MultiLineString: MultiLineString,
    Polygon: Polygon,
    MultiPolygon: MultiPolygon,
    GeometryCollection: GeometryCollection,
    Circle: g_Circle,
    GeometryLayout: GeometryLayout,
    flat: {
        deflateCoordinates: deflateCoordinates,
        inflateCoordinates: inflateCoordinates,
        linearRingLength: linearRingLength
    }
};

ol.featureloader = {
    xhr: xhr
};

ol.format = {
    Feature: Feature,
    GMLBase: GMLBase,
    GML: GML,
    GML2: GML2,
    GML3: GML3,
    GML32: GML32,
    GPX: GPX,
    KML: KML,
    WFS: WFS,
    WKT: WKT,
    GeoJSON: GeoJSON,
    WMSCapabilities: WMSCapabilities,
    WMSGetFeatureInfo: WMSGetFeatureInfo,
    WMTSCapabilities: WMTSCapabilities,
    TopoJSON: TopoJSON,
    xsd: {
        readDecimal: readDecimal,
        readBoolean: readBoolean,
        readString: readString,
        readPositiveInteger: readPositiveInteger,
        readDateTime: readDateTime,
        writeStringTextNode: writeStringTextNode,
        writeCDATASection: writeCDATASection,
        writeDecimalTextNode: writeDecimalTextNode,
        writeBooleanTextNode: writeBooleanTextNode,
        writeNonNegativeIntegerTextNode: writeNonNegativeIntegerTextNode
    }
};
ol.format.Feature.transformGeometryWithOptions = transformGeometryWithOptions;

ol.interaction = {
    defaults: defaults,
    Draw: Draw,
    Pointer: Pointer,
    Translate: Translate,
    Snap: Snap,
    Select: Select,
    Modify: Modify,
    DragAndDrop: DragAndDrop,
    DoubleClickZoom: DoubleClickZoom
};

ol.layer = {
    Layer: Layer,
    Tile: Tile,
    Image: l_Image,
    Vector: l_Vector,
    Heatmap: Heatmap
};

ol.Observable = {
    unByKey: unByKey
};

ol.Object = BaseObject;

ol.proj = {
    METERS_PER_UNIT: METERS_PER_UNIT,
    Projection: Projection,
    addEquivalentProjections: addEquivalentProjections,
    get: get,
    transform: transform,
    transformExtent: transformExtent,
    getTransform: getTransform,
    Units: Units,
    proj4: {
        register: register
    },
    EPSG4326: {
        METERS_PER_UNIT: g_METERS_PER_UNIT,
        PROJECTIONS: PROJECTIONS
    }
};

ol.render = {
    getVectorContext: getVectorContext,
    toContext: toContext,
    EventType: r_EventType
};

ol.source = {
    Vector: s_Vector,
    Cluster: Cluster,
    ImageWMS: ImageWMS,
    WMTS: WMTS,
    TileEventType: TileEventType,
    VectorEventType: VectorEventType,
    ImageCanvas: ImageCanvas,
    //OGCMapTile: OGCMapTile
    Image: {
        defaultImageLoadFunction: defaultImageLoadFunction
    }
};
ol.source.WMTS.optionsFromCapabilities = optionsFromCapabilities;

ol.tilegrid = {
    TileGrid: TileGrid
};

ol.style = {
    Style: Style,
    RegularShape: RegularShape,
    Circle: s_Circle,
    Fill: Fill,
    Icon: Icon,
    Stroke: Stroke,
    Text: Text,
    IconAnchorUnits: IconAnchorUnits,
    IconOrigin: IconOrigin
};

ol.xml = {
    parse: parse,
    parseNode: parseNode,
    createElementNS: createElementNS,
    pushParseAndPop: pushParseAndPop,
    pushSerializeAndPop: pushSerializeAndPop,
    makeStructureNS: makeStructureNS,
    getAllTextContent: getAllTextContent,
    makeChildAppender: makeChildAppender,
    makeReplacer: makeReplacer,
    makeSequence: makeSequence,
    makeArrayPusher: makeArrayPusher,
    makeArrayExtender: makeArrayExtender,
    makeArraySerializer: makeArraySerializer,
    makeObjectPropertySetter: makeObjectPropertySetter,
    makeSimpleNodeFactory: makeSimpleNodeFactory,
    OBJECT_PROPERTY_NODE_FACTORY: OBJECT_PROPERTY_NODE_FACTORY,
    XML_SCHEMA_INSTANCE_URI: XML_SCHEMA_INSTANCE_URI
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
const MOUSEMOVE = 'mousemove';
const MOUSEOVER = 'mouseover';
const DRAGENTER = ol.events.EventType.DRAGENTER;
const DRAGOVER = ol.events.EventType.DRAGOVER;
const DROP = ol.events.EventType.DROP;
const CHANGE = ol.events.EventType.CHANGE;
const CLICK = ol.MapBrowserEventType.CLICK
const SINGLECLICK = ol.MapBrowserEventType.SINGLECLICK;
const POINTERMOVE = ol.MapBrowserEventType.POINTERMOVE;
const MOVEEND = ol.MapEventType.MOVEEND;
const POSTRENDER = ol.render.EventType.POSTRENDER;
const ADDFEATURE = ol.source.VectorEventType.ADDFEATURE;
const REMOVEFEATURE = ol.source.VectorEventType.REMOVEFEATURE;
const CLEAR = ol.source.VectorEventType.CLEAR;
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

const hitTolerance = TC.Util.detectMouse() ? 3 : 10;

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

// Modificación para cambiar el comportamiento de ol.control.OverviewMap:
// Mantener la caja del extent siempre centrada.
ol.control.OverviewMap.prototype._validateExtent_ = ol.control.OverviewMap.prototype.validateExtent_;
ol.control.OverviewMap.prototype.validateExtent_ = function () {
    var self = this;
    self._validateExtent_();
    if (self._wrap && self._wrap.parent.options.alwaysCentered) {
        self.recenter_();
    }
};

// Modificación para evitar un assertion error al cambiar a una vista de capa dinámica
ol.control.OverviewMap.prototype._bindView_ = ol.control.OverviewMap.prototype.bindView_;
ol.control.OverviewMap.prototype.bindView_ = function (view) {
    const self = this;
    const oldView = self.getOverviewMap().getView();
    const result = ol.control.OverviewMap.prototype._bindView_.call(self, view);
    const newView = self.getOverviewMap().getView();
    const parentView = self._wrap.parent.map.wrap.map.getView();
    if (!newView.getCenter()) {
        newView.setCenter(parentView.getCenter());
    }
    if (!newView.getResolution()) {
        newView.setResolution(oldView.getResolution());
    }
    return result;
};

// En modo 3D, cambiar la lógica de la escala para que siempre muestre área de visión.
ol.control.OverviewMap.prototype._resetExtent_ = ol.control.OverviewMap.prototype.resetExtent_;
ol.control.OverviewMap.prototype.resetExtent_ = function () {
    var self = this;
    self._resetExtent_.call(self);
    var wrap = self._wrap;
    if (wrap.is3D) {
        var ovmap = self.getOverviewMap();
        var ovview = ovmap.getView();
        var extent = ovview.calculateExtent();
        var feature = wrap.get3DCameraLayer().getSource().getFeatures()[0];
        if (feature) {
            const coordinates = feature.getGeometry().getCoordinates();
            var coord1 = coordinates[0][0];
            var coord2 = coordinates[0][1];
            if (!ol.extent.containsCoordinate(extent, coord1) || !ol.extent.containsCoordinate(extent, coord2)) {
                var buffer = Math.max(
                    extent[0] - coord1[0],
                    extent[1] - coord1[1],
                    coord1[0] - extent[2],
                    coord1[1] - extent[3],
                    extent[0] - coord2[0],
                    extent[1] - coord2[1],
                    coord2[0] - extent[2],
                    coord2[1] - extent[3]
                );
                ovview.fit(ol.extent.buffer(extent, buffer));
            }
        }
    }
};

// Por defecto si establecemos una posición de la caja que tiene el mismo centro que antes, el posicionamiento en píxels del viewport no se actualiza
// porque setPosition no lanza el evento de cambio de valor. Parche para evitarlo.
ol.control.OverviewMap.prototype._updateBox_ = ol.control.OverviewMap.prototype.updateBox_;
ol.control.OverviewMap.prototype.updateBox_ = function () {
    const self = this;
    self._updateBox_.call(self);
    self.boxOverlay_.handlePositionChanged();
};

ol.format.GML3CRS84 = function () {
    ol.format.GML3.call(this, {
        srsName: 'CRS:84'
    });
};
TC.inherit(ol.format.GML3CRS84, ol.format.GML3);

ol.format.GML2CRS84 = function () {
    ol.format.GML2.call(this, {
        srsName: 'CRS:84'
    });
};
TC.inherit(ol.format.GML2CRS84, ol.format.GML2);

// Añadido el espacio de nombres de GML 3.2 al parser
const gmlNamespace = 'http://www.opengis.net/gml';
const gml32Namespace = 'http://www.opengis.net/gml/3.2';
ol.format.GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS[gml32Namespace] = ol.format.GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS[gmlNamespace];
ol.format.GML3.prototype.FLAT_LINEAR_RINGS_PARSERS[gml32Namespace] = ol.format.GML3.prototype.FLAT_LINEAR_RINGS_PARSERS[gmlNamespace];
ol.format.GML3.prototype.GEOMETRY_PARSERS[gml32Namespace] = ol.format.GML3.prototype.GEOMETRY_PARSERS[gmlNamespace];
ol.format.GML3.prototype.MULTICURVE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.MULTICURVE_PARSERS[gmlNamespace];
ol.format.GML3.prototype.MULTISURFACE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.MULTISURFACE_PARSERS[gmlNamespace];
ol.format.GML3.prototype.CURVEMEMBER_PARSERS[gml32Namespace] = ol.format.GML3.prototype.CURVEMEMBER_PARSERS[gmlNamespace];
ol.format.GML3.prototype.SURFACEMEMBER_PARSERS[gml32Namespace] = ol.format.GML3.prototype.SURFACEMEMBER_PARSERS[gmlNamespace];
ol.format.GML3.prototype.SURFACE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.SURFACE_PARSERS[gmlNamespace];
ol.format.GML3.prototype.CURVE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.CURVE_PARSERS[gmlNamespace];
ol.format.GML3.prototype.ENVELOPE_PARSERS[gml32Namespace] = ol.format.GML3.prototype.ENVELOPE_PARSERS[gmlNamespace];
ol.format.GML3.prototype.PATCHES_PARSERS[gml32Namespace] = ol.format.GML3.prototype.PATCHES_PARSERS[gmlNamespace];
ol.format.GML3.prototype.SEGMENTS_PARSERS[gml32Namespace] = ol.format.GML3.prototype.SEGMENTS_PARSERS[gmlNamespace];

ol.proj.addEquivalentProjections(ol.proj.EPSG4326.PROJECTIONS);

ol.proj.proj4.register(proj4);
// OpenLayers usa para las proyecciones geográficas un valor ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES], calculado con una esfera, salvo
// EPSG:4326, en la que usa ol.proj.EPSG4326.METERS_PER_UNIT, calculado con el geoide. Esto hace que las proyecciones en EPSG:4258 salgan desplazadas,
// pese a que para todos los efectos son iguales a las EPSG:4326. Para evitar eso, introducimos en las 4258 el valor ol.proj.EPSG4326.METERS_PER_UNIT.
//ol.proj.get('EPSG:4258').metersPerUnit_ = ol.proj.EPSG4326.METERS_PER_UNIT;
//ol.proj.get('urn:ogc:def:crs:EPSG::4258').metersPerUnit_ = ol.proj.EPSG4326.METERS_PER_UNIT;
//ol.proj.get('http://www.opengis.net/gml/srs/epsg.xml#4258').metersPerUnit_ = ol.proj.EPSG4326.METERS_PER_UNIT;

const isMobile = TC.Util.detectMobile();
// El viewState del mapa tiene una resolución con respecto al pixel virtual. Esto hace que se pida
// teselas en un nivel de zoom distinto al deseado para que se vean en el dispositivo en relación pixel 1:1.
// Esto parchea el problema.
const oldGetTilePixelRatio = ol.source.WMTS.prototype.getTilePixelRatio;
ol.source.WMTS.prototype.getTilePixelRatio = function (pixelRatio) {
    if (isMobile) {
        return oldGetTilePixelRatio.call(this, pixelRatio);
    }
    return oldGetTilePixelRatio.call(this, pixelRatio) * (pixelRatio || 1);
};

const oldGetZForResolution = ol.tilegrid.TileGrid.prototype.getZForResolution;
ol.tilegrid.TileGrid.prototype.getZForResolution = function (resolution, opt_direction) {
    let res = resolution;
    if (!isMobile) {
        res = res / window.devicePixelRatio;
    }
    return oldGetZForResolution.call(this, res, opt_direction);
};

// Parche para solucionar el aspecto borroso de los popup de GFI con dos filas en Chromium: volvemos a la función de la versión 5.3.3.
// El problema es que la altura calculada no es un número entero de pixels.
ol.Overlay.prototype.updateRenderedPosition = function (pixel, mapSize) {
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

// Parcheamos siguiente método para meter en todas las peticiones todos los vendor params si pixelRatio != 1
// serverType lo tenemos como Geoserver, así que añadimos los parámetros de los demás.
const oldGetRequestUrl_ = ol.source.ImageWMS.prototype.getRequestUrl_;
ol.source.ImageWMS.prototype.getRequestUrl_ = function (extent, size, pixelRatio, projection, params) {
    if (pixelRatio !== 1) {
        // Redondeamos porque si no GeoServer peta
        const dpi = (90 * pixelRatio + 0.5) | 0;
        params.MAP_RESOLUTION = dpi;
        params.DPI = dpi;
    }
    return oldGetRequestUrl_.call(this, extent, size, pixelRatio, projection, params);
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
    if (opacity !== undefined) {
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
    const pixelRatio = TC.Util.detectMobile() ? 1 : mapWrap.map.pixelRatio_;

    const pms = {
        projection: view.getProjection(),
        center: view.getCenter(),
        resolution: prevRes,
        enableRotation: false,
        constrainResolution: true,
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

    const res = layerForResolutions.getResolutions ? layerForResolutions.getResolutions() : [];
    var maxRes;
    var minRes;

    if (res && res.length) {
        maxRes = layerForResolutions.maxResolution || options?.maxResolution || res[0];
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

        var projOptions = {
            units: proj4Obj.oProj.units
        };

        var equivalentProjections = [];
        if (crsCode !== '4326') { // Este código ya está metido, no lo machacamos
            projOptions.code = 'EPSG:' + crsCode;
            equivalentProjections.push(new ol.proj.Projection(projOptions));
            projOptions.code = 'urn:ogc:def:crs:EPSG::' + crsCode;
            equivalentProjections.push(new ol.proj.Projection(projOptions));

            ol.proj.addEquivalentProjections(equivalentProjections);
        }

        ol.proj.proj4.register(proj4);

    };

    addEquivalentProjections();

    var projOptions = {
        code: self.parent.crs,
        units: proj4Obj.oProj.units
    };
    if (self.parent.crs === 'EPSG:4326') {
        projOptions.axisOrientation = 'neu';
    }
    var projection = new ol.proj.Projection(projOptions);

    var interactions = ol.interaction.defaults();

    var viewOptions = {
        projection: projection,
        center: center,
        enableRotation: false,
        constrainResolution: true,
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

    //if (!TC.Util.detectMobile()) {
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
                hitTolerance: hitTolerance
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
            .filter(l => l.type === Consts.layerType.WMS)
            .forEach(l => {
                const extent = l.getExtent({ crs: crs });
                if (extent) {
                    const bufferedExtent = bufferExtent(extent, resolution, 100); // 100 pixels de buffer
                    l.wrap.layer.setExtent(bufferedExtent);
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
            const oldResolutions = evt.oldLayer.getResolutions();
            let modelLayer = evt.newLayer;
            const limitZoomOptions = {};
            if (!evt.newLayer.getResolutions() && oldResolutions) {
                // Si la capa nueva no tiene resoluciones y la vieja sí, mantenemos las resoluciones anteriores.
                // Esto evita que OpenLayers se invente los niveles de zoom y las resoluciones para la capa dinámica.
                modelLayer = evt.oldLayer;
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
    if (!units || units === ol.proj.Units.DEGREES) {
        return TC.Util.getMetersPerDegree(extentInDegrees);
    }
    return ol.proj.METERS_PER_UNIT[units];
};

TC.wrap.Map.prototype.getMetersPerUnit = function () {
    var self = this;
    return getMetersPerUnit(ol.proj.get(self.parent.crs), self.getExtent());
};

var getUnitRatio = function (options) {
    var self = this;
    options = options || {};
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
        result.units_ = ol.proj.Units.DEGREES;
    }
    return result;
};

TC.wrap.Map.prototype.setProjection = function (options) {
    const self = this;
    options = options || {};
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
TC.wrap.Map.prototype.insertLayer = function (olLayer, idx) {
    var self = this;
    var layers = self.map.getLayers();
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
        layers.insertAt(idx, olLayer);
    }
    else {
        if (idx < 0) {
            layers.push(olLayer);
        }
        else {
            layers.insertAt(idx, olLayer);
        }
        // Solo se limitan las resoluciones cuando estamos en un CRS por defecto, donde no se repixelan teselas
        var view = self.map.getView();
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

        var loadingTileCount = 0;

        var beforeTileLoadHandler = function (_e) {
            wrap.parent.state = TC.Layer.state.LOADING;
            if (loadingTileCount <= 0) {
                loadingTileCount = 0;
                self.parent.trigger(Consts.event.BEFORELAYERUPDATE, { layer: wrap.parent });
            }
            olLayer._loadingTileCount = olLayer._loadingTileCount + 1;
        };
        if (wrap.parent.state === TC.Layer.state.LOADING && wrap.parent.isRaster()) {
            beforeTileLoadHandler();
        }
        wrap.$events.on(Consts.event.BEFORETILELOAD, beforeTileLoadHandler);

        wrap.$events.on(Consts.event.TILELOAD + ' ' + Consts.event.TILELOADERROR, function (_e) {
            loadingTileCount = loadingTileCount - 1;
            if (loadingTileCount <= 0) {
                loadingTileCount = 0;
                wrap.parent.state = TC.Layer.state.IDLE;
                self.parent.trigger(Consts.event.LAYERUPDATE, { layer: wrap.parent });
            }
        });
    }
};

TC.wrap.Map.prototype.removeLayer = function (olLayer) {
    this.map.removeLayer(olLayer);
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

                    if (layerProjectionOptions.oldCrs !== layerProjectionOptions.crs) {
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
    if (TC.Util.isFunction(options)) {
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
                    if (TC.Util.isFunction(callback)) {
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

TC.wrap.Map.prototype.setCenter = function (coords, options) {
    const self = this;
    return new Promise(function (resolve, _reject) {
        const callback = function () {
            resolve();
        };

        const opts = options || {};
        const view = self.map.getView();

        if (opts.animate) {
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
    return Array.from(self.parent.div.querySelectorAll('.ol-viewport canvas:not(.tc-ctl-ovmap canvas)'));
};

TC.wrap.Map.prototype.isNative = function (map) {
    return map instanceof ol.Map;
};

TC.wrap.Map.prototype.isGeo = function () {
    var units = this.map.getView().getProjection().getUnits();
    return !units || units === ol.proj.Units.DEGREES;
};

TC.wrap.Map.prototype.addPopup = function (popupCtl) {
    const self = this;
    return new Promise(function (resolve, _reject) {
        var draggable = popupCtl.options.draggable === undefined || popupCtl.options.draggable;
        self.getMap().then(function (olMap) {
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
                const olMapViewport = olMap.getViewport();

                if (draggable) {
                    import('draggabilly').then(function (module) {
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

                        const Draggabilly = module.default;
                        // Tuneamos Draggabilly para que acepte excepciones a los asideros del elemento.
                        const drag = new Draggabilly(container, {
                            not: 'th,td, td *,input,select,.tc-ctl-finfo-coords'
                        });
                        drag.handleEvent = function (event) {
                            const notSelector = this.options.not;
                            if (notSelector) {
                                let elm = event.target;
                                let isException = false;
                                while (elm && !isException) {
                                    isException = elm.matches && elm.matches(notSelector);
                                    elm = elm.parentElement;
                                }
                                if (isException) {
                                    return;
                                }
                            }
                            Draggabilly.prototype.handleEvent.call(this, event);
                        };
                        drag.on('pointerDown', function (e, pointer) {
                            var bcr = e.target.getBoundingClientRect();
                            // Si estamos pulsando sobre una barra de scroll abortamos drag
                            if (bcr.left + e.target.clientWidth < pointer.pageX || bcr.top + e.target.clientHeight < pointer.pageY) {
                                drag._pointerCancel(e, pointer);
                                return false;
                            }
                        });
                        drag.on('dragStart', function (_e, _pointer) {
                            popupCtl.setDragging(true);
                            popupCtl._currentOffset = popup.getOffset();
                            if (popupCtl._previousContainerPosition) {
                                var mapSize = olMap.getSize();
                                popup.setPosition(olMap.getCoordinateFromPixel([popupCtl._previousContainerPosition[0], mapSize[1] - popupCtl._previousContainerPosition[1]]));
                                popupCtl._currentOffset = [0, 0];
                                popup.setOffset(popupCtl._currentOffset);
                                delete popupCtl._previousContainerPosition;
                            }
                            else {
                                popupCtl._currentOffset = popup.getOffset();
                            }
                        });
                        drag.on('dragEnd', function (_e) {
                            popupCtl.setDragging(false);
                            var coord1 = olMap.getCoordinateFromPixel([0, 0]);
                            var coord2 = olMap.getCoordinateFromPixel(popup.getOffset());
                            var coordDelta = [coord2[0] - coord1[0], coord2[1] - coord1[1]];
                            var position = popup.getPosition();
                            popup.setPosition([position[0] + coordDelta[0], position[1] + coordDelta[1]]);
                            popup.setOffset([0, 0]);
                            popupCtl._currentOffset = [0, 0];

                            const containerRect = container.getBoundingClientRect();
                            popupCtl._previousContainerPosition = [containerRect.left, containerRect.bottom];
                        });
                        //drag.on('dragMove', function (e, pointer, moveVector) {
                        //popup.setOffset([popupCtl._currentOffset[0] + moveVector.x, popupCtl._currentOffset[1] + moveVector.y]);
                        //});
                        //.drag(function (ev, dd) {
                        //    if (!ev.buttons && !Modernizr.touch) { // Evitamos que se mantenga el drag si no hay botón pulsado (p.e. en IE pulsando una scrollbar)
                        //        return false;
                        //    }
                        //    popup.setOffset([popupCtl._currentOffset[0] + dd.deltaX, popupCtl._currentOffset[1] + dd.deltaY]);
                        //}, {
                        //    not: 'th,td, td *,input,select,.tc-ctl-finfo-coords'
                        //    })       
                    });
                }

                const mouseMoveHandler = function (e) {
                    const viewport = olMap.getViewport();
                    var hit = false;
                    if (!self.parent.activeControl || !self.parent.activeControl.isExclusive()) {
                        var pixel = olMap.getEventPixel(e);
                        hit = olMap.forEachFeatureAtPixel(pixel, function (feature, _layer) {
                            var result = true;
                            if (feature._wrap && !feature._wrap.parent.showsPopup) {
                                result = false;
                            }
                            return result;
                        },
                            {
                                hitTolerance: hitTolerance
                            });
                    }
                    if (hit) {
                        viewport.style.cursor = 'pointer';
                    } else {
                        viewport.style.cursor = '';
                    }
                };

                // change mouse cursor when over marker
                olMapViewport.removeEventListener(MOUSEMOVE, mouseMoveHandler);
                olMapViewport.addEventListener(MOUSEMOVE, mouseMoveHandler);
            }
        });
        resolve();
    });
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

    if (!TC.Util.detectMobile()) {
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
            return new ol.format.GML32();
        case Consts.mimeType.GML:
        case Consts.format.GML:
            return new ol.format.GML();
        case Consts.format.TOPOJSON:
            return new ol.format.TopoJSON();
        case Consts.format.WKT:
            return new ol.format.WKT();
        default:
            return null;
    }
};

TC.wrap.Map.prototype.exportFeatures = function (features, options) {
    var self = this;
    options = options || {};
    var nativeStyle = createNativeStyle({
        styles: self.parent.options.styles
    });
    var olFeatures = features.map(function (feature) {
        var result = feature.wrap.feature.clone();
        const path = feature.getPath();
        if (path) {
            result._folders = path;
        }
        //URI:replicamos el id a la feature OL
        result.id_ = feature.id;
        // Si la feature no tiene estilo propio le ponemos el definido por la API
        if (!result.getStyle()) {
            result.setStyle(nativeStyle);
        }
        // Miramos si tiene texto, en cuyo caso la features se clona para no contaminar la feature original
        // y al clon se le añade el texto como atributo (necesario para exportar etiquetas en KML y GPX)
        const text = getNativeFeatureStyle(result).getText();
        if (text) {
            const name = text.getText();
            if (name) {
                result.setProperties({
                    name: text.getText()
                });
            }
        }
        return result;
    });
    var format = getFormatFromName(options.format);

    if (format instanceof ol.format.KML) {
        // KML no tiene estilo para puntos aparte del de icono. Para puntos sin icono creamos uno en SVG.
        olFeatures = olFeatures
            .map(function (feature) {
                const geom = feature.getGeometry();
                if (geom instanceof ol.geom.Point) {
                    // Si el punto no tiene icono, creamos uno nuevo con un icono generado como data URI a partir del estilo
                    var style = getNativeFeatureStyle(feature);
                    const shape = style.getImage();
                    if (shape instanceof ol.style.RegularShape) {
                        const radius = shape.getRadius();
                        const stroke = shape.getStroke();
                        const strokeWidth = stroke.getWidth();
                        const diameter = 2 * radius + strokeWidth;
                        //const position = diameter / 2;
                        const canvas = document.createElement('canvas');
                        canvas.width = diameter;
                        canvas.height = diameter;
                        //const ctx = canvas.getContext('2d');
                        //const vectorContext = ol.render.toContext(canvas.getContext('2d'), {
                        //    size: [diameter, diameter]
                        //});
                        const text = style.getText();
                        style = style.clone();
                        style.setText(); // Quitamos el texto para que no salga en el canvas
                        //ctx.beginPath();
                        //ctx.strokeStyle = stroke.getColor();
                        //ctx.lineWidth = strokeWidth;
                        //ctx.arc(diameter/2, diameter/2, radius, 0, 2 * Math.PI, false);
                        //ctx.stroke();
                        //vectorContext.setStyle(style);
                        //vectorContext.drawGeometry(new ol.geom.Point([position, position]));
                        const newFeature = new ol.Feature(geom);
                        newFeature.setId(feature.getId());
                        newFeature.setProperties(feature.getProperties());

                        newFeature.setStyle(new ol.style.Style({
                            image: new ol.style.Icon({
                                src: ("data:image/svg+xml;base64," + window.btoa('<svg xmlns="http://www.w3.org/2000/svg" width="' + diameter + '" height="' + diameter + '">' +
                                    '<circle cx="' + diameter / 2 + '" cy="' + diameter / 2 + '" r="' + radius + '" stroke="' + stroke.getColor() + '" fill="none" stroke-width="' + strokeWidth + '" />' +
                                    '</svg>')),
                                //canvas.toDataURL('image/png'),
                                size: [diameter, diameter],
                                imgSize: [diameter, diameter],
                                scale: shape.getScale()
                            }),
                            text: text
                        }));
                        return newFeature;
                    }
                }
                return feature;
            });
        // KML no pone etiquetas a líneas y polígonos. En esos casos ponemos un punto con la etiqueta.
        const pointsToAdd = [];
        olFeatures.forEach(function (feature) {
            var style = getNativeFeatureStyle(feature);
            const geometry = feature.getGeometry();
            const text = style.getText();
            var point;
            if (text && text.getText()) {
                switch (true) {
                    case geometry instanceof ol.geom.LineString:
                        point = new ol.geom.Point(geometry.getCoordinateAt(0.5));
                        break;
                    case geometry instanceof ol.geom.Polygon:
                        point = geometry.getInteriorPoint();
                        break;
                    case geometry instanceof ol.geom.MultiLineString: {
                        // Seleccionamos la línea más larga
                        const lineStrings = geometry.getLineStrings();
                        var maxLength = -1;
                        point = new ol.geom.Point(lineStrings[lineStrings
                            .map(function (line) {
                                return line.getLength();
                            })
                            .reduce(function (prev, cur, idx) {
                                if (cur > maxLength) {
                                    maxLength = cur;
                                    return idx;
                                }
                                return prev;
                            }, -1)].getCoordinateAt(0.5));
                        break;
                    }
                    case geometry instanceof ol.geom.MultiPolygon: {
                        // Seleccionamos el polígono más grande
                        const polygons = geometry.getPolygons();
                        var maxArea = -1;
                        point = polygons[polygons
                            .map(function (polygon) {
                                return polygon.getArea();
                            })
                            .reduce(function (prev, cur, idx) {
                                if (cur > maxArea) {
                                    maxArea = cur;
                                    return idx;
                                }
                                return prev;
                            }, -1)].getInteriorPoint();
                        break;
                    }
                    default:
                        break;
                }
                if (point) {
                    const newFeature = new ol.Feature(point);
                    newFeature.setStyle(new ol.style.Style({
                        text: text.clone(),
                        image: new ol.style.Icon({
                            crossOrigin: 'anonymous',
                            src: TC.apiLocation + 'TC/css/img/transparent.gif'
                        })
                    }));
                    pointsToAdd.push(newFeature);
                }
            }
        });
        if (pointsToAdd.length) {
            olFeatures = olFeatures.concat(pointsToAdd);
        }
    }

    if (format instanceof ol.format.GMLBase) {
        format.hasZ = features[0].getGeometryStride() >= 3;
        //URI: Cambiamos el crs a l formato urn para manejar coordenadas X/Y
        format.srsName = TC.Util.toURNCRS(self.parent.crs);
        // Quitamos los espacios en blanco de los nombres de atributo en las features: no son válidos en GML.
        olFeatures = olFeatures.map(function (f) {
            var temp = f.clone();
            temp.id_ = f.id_;
            return temp;
        });
        olFeatures.forEach(function (f) {
            const values = f.values_;
            const keysToChange = [];
            for (var key in values) {
                if (key.indexOf(' ') >= 0) {
                    keysToChange.push(key);
                }
            }
            keysToChange.forEach(function (key) {
                // Quitamos espacios en blanco y evitamos que empiece por un número
                var newKey = key.replace(/ /g, '_');
                if (/^\d/.test(newKey)) {
                    newKey = '_' + newKey;
                }
                if (key !== newKey) {
                    while (values[newKey] !== undefined) {
                        newKey += '_';
                    }
                }
                values[newKey] = values[key];
                delete values[key];
            });
        });

        format.featureNS = "http://www.opengis.net/gml";
        format.featureType = "feature";
        var featuresNode = format.writeFeaturesNode(olFeatures, {
            featureProjection: self.parent.crs
        });
        featuresNode
            .querySelectorAll("feature geometry > * *[srsName]")
            .forEach(item => item.removeAttribute("srsName"));

        var featureCollectionNode = ol.xml.createElementNS('http://www.opengis.net/wfs',
            'FeatureCollection');
        featureCollectionNode.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation', format.schemaLocation);

        featuresNode.removeAttribute('xmlns:xsi');
        featuresNode.removeAttribute('xsi:schemaLocation');
        featureCollectionNode.appendChild(featuresNode);
        //ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
        //    'xsi:schemaLocation', this.schemaLocation);
        return featureCollectionNode.outerHTML;
    }

    if (format instanceof ol.format.GPX) {
        // Queremos exportar tracks en vez de routes. OpenLayers exporta LineStrings como routes y MultiLineStrings como tracks.
        olFeatures = olFeatures.map(function (f) {
            const geom = f.getGeometry();
            if (geom instanceof ol.geom.LineString) {
                f = f.clone();
                f.setGeometry(new ol.geom.MultiLineString([geom.getCoordinates()]));
            }
            return f;
        });
    }

    var result = format.writeFeatures(olFeatures, {
        dataProjection: 'EPSG:4326',
        featureProjection: self.parent.crs
    });
    if (format instanceof ol.format.GPX) {
        // Este formato no procesa bien las elevaciones cuando son nulas. Hemos hecho un preproceso para transformarlas en NaN y ahora hay que eliminarlas.
        result = result.replace(/<ele>NaN<\/ele>/g, '');
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

TC.wrap.Map.prototype.enableDragAndDrop = function (options) {
    var self = this;
    var opts = options || {};
    var ddOptions = {
        formatConstructors: [
            //10/11/2021 URI:Ahora el KML Custom es una modificación directa del KML y no una sobrecarga de éste. Se añade al build de ol al compilar
            //ol.format.KMLCustom,
            ol.format.KML,
            ol.format.GPX,
            ol.format.GML32,
            ol.format.GML2,
            ol.format.GML3CRS84,
            ol.format.GML2CRS84,
            ol.format.GML3,
            //ol.format.GML32,
            ol.format.GeoJSON,
            function () {
                return new ol.format.WKT({
                    splitCollection: true
                });
            },
            ol.format.TopoJSON
        ]
    };
    if (opts.dropTarget) {
        ddOptions.target = TC.Util.getDiv(opts.dropTarget);
    }
    else {
        ddOptions.target = self.parent.div;
    }
    var zipFiles = null;
    var ddInteraction = new ol.interaction.DragAndDrop(ddOptions);
    ddInteraction.on('addfeatures', function (e) {
        var featurePromises = e.features ? e.features.map(function (elm) {
            if (!elm.getId()) {
                elm.setId(TC.getUID());
            }
            return TC.wrap.Feature.createFeature(elm);
        }) : [];

        Promise.all(featurePromises).then(function (features) {
            var li = self.parent.getLoadingIndicator();
            if (li) {
                li.removeWait(self.parent._featureImportWaitId);
            }
            const featuresWithGeometry = features.filter(f => f.geometry);
            //15/11/2021 RI: Cambio la lógica. Si alguna fatures no tienen geometría lanzo un evento nuevo para a posteriori sacar un warning
            if (featuresWithGeometry.length) {
                const featuresImportEventData = {
                    features: featuresWithGeometry,
                    file: e.file,
                    fileHandle: ddInteraction.getFileHandle(e.file),
                    fileName: e.file.name,
                    dropTarget: e.target.target,
                    timeStamp: e.file.lastModified,
                    groupIndex: e._groupIndex,
                    groupCount: e._groupCount
                };
                if (e.file.name.substring(e.file.name.lastIndexOf(".") + 1).toLowerCase() === 'shp') {
                    // Los shapefiles son multiarchivo, añado los demás fileHandles.
                    const nameBase = e.file.name.substring(0, e.file.name.lastIndexOf("."));
                    featuresImportEventData.additionalFileHandles = ['.dbf', '.prj', '.cst', '.cpg']
                        .map(ext => ddInteraction.getFileHandleByName(nameBase + ext))
                        .filter(fh => fh !== null)
                        .filter(fh => fh !== featuresImportEventData.fileHandle);
                }
                if (e.file._fileSystemFile) {
                    featuresImportEventData.fileSystemFile = e.file._fileSystemFile;
                    delete e.file._fileSystemFile;
                }
                if (ddInteraction._fileLayers) {
                    const fileLayers = ddInteraction._fileLayers.filter(l =>
                        l.options.file === e.file.name && l.options.groupIndex === e._groupIndex);
                    if (fileLayers.length) {
                        featuresImportEventData.targetLayers = fileLayers;
                    }
                    else {
                        return;
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
                    self.parent.trigger(Consts.event.FEATURESIMPORT, featuresImportEventData);
                    if (features.some(f => !f.geometry)) {
                        self.parent.trigger(Consts.event.FEATURESIMPORTWARN, {
                            file: e.file
                        });
                    }
                })
            }
            else { //if (!features.length || features.some(f => !f.geometry)) {
                if (zipFiles) {
                    if (++zipFiles.failed < zipFiles.total) {
                        return;
                    }
                    else {
                        const fileHandle = ddInteraction.getFileHandle(e.file);
                        e.file = new File([], zipFiles.zipName);
                        if (fileHandle) {
                            ddInteraction.setFileHandle(e.file, fileHandle);
                        }
                    }
                }
                self.parent.trigger(Consts.event.FEATURESIMPORTERROR, {
                    file: e.file
                });
            }
        });
    });
    ddInteraction.on('error', function (e) {
        TC.error(e);
    });
    if (opts.once) {
        ddInteraction.map_ = self.map;
    }
    else {
        self.map.addInteraction(ddInteraction);
        var dropArea = ddInteraction.target ? ddInteraction.target : self.map.getViewport();

        const originalFnc = ddInteraction.handleResult_;

        var zipUncompressed = {};
        var getFileData = function (file) {
            if (file.arrayBuffer)
                return file.arrayBuffer();
            else {
                return new Promise(function (resolve, reject) {
                    var fr = new FileReader();
                    fr.onload = function (_e) {
                        resolve(new Uint8Array(this.result));
                    };
                    fr.onerror = reject;
                    fr.readAsArrayBuffer(file);
                });
            }
        };
        var getFileText = function (file) {
            if (file.text)
                return file.text();
            else {
                return new Promise(function (resolve, reject) {
                    var fr = new FileReader();
                    fr.onload = function (_e) {
                        resolve(new Uint8Array(this.result));
                    };
                    fr.onerror = reject;
                    fr.readAsText(file);
                });
            }
        };

        ddInteraction.handleResult_ = async function (file, evt) {
            var _self = this;
            //URI: si el fichero es ZIP o KMZ lo proceso sino llamo a la función original con los datos originales
            zipFiles = null;
            const defaultEncoding = "ISO-8859-1";
            //_self.getMap()._wrap.parent.dropFilesCounter = 0;
            if (/\.gpkg$/ig.test(file.name) || file.type === "application/geopackage+sqlite3") {

                import("../../lib/geopackagejs/dist/geopackage-browser").then(async function (gp) {
                    const geopackage = gp.GeoPackageAPI;
                    const manageError = function (err) {
                        if (err)
                            TC.error(err, Consts.msgErrorMode.CONSOLE);

                        originalFnc.apply(_self, [file, { target: { result: null } }]);
                    };
                    const loadFile = async function (array) {
                        geopackage.open(array).then(async function (myPackage) {
                            const vectorLayers = myPackage.getFeatureTables();
                            const numTables = vectorLayers.length;
                            var finished = 0, notLoaded = 0;
                            var warnings = [];

                            //me subscribo al evento
                            const manageLoad = function (_evt) {
                                if (++finished === numTables) {
                                    self.parent.off(Consts.event.FEATURESIMPORT, manageLoad);
                                    for (var i = 0; i < warnings.length; i++)
                                        self.parent.trigger(Consts.event.FEATURESIMPORTPARTIAL, {
                                            file: file,
                                            table: warnings[i].table,
                                            reason: warnings[i].reason
                                        });
                                }
                            };
                            const fileHandle = _self.getFileHandle(file);
                            self.parent.on(Consts.event.FEATURESIMPORT, manageLoad);
                            if (vectorLayers.length > 1) window.dropFilesCounter = window.dropFilesCounter + vectorLayers.length - 1;
                            for (var i = 0; i < vectorLayers.length; i++) {
                                //vamos a ver si construimos en JSON
                                try {
                                    var arr = [];
                                    for (let row of myPackage.iterateGeoJSONFeatures(vectorLayers[i])) {
                                        if (Object.prototype.hasOwnProperty.call(row, "id"))
                                            row.id = vectorLayers[i] + "." + row.id;
                                        if (row.geometry) {
                                            row.type = "Feature";
                                            arr[arr.length] = row;
                                        }
                                    }
                                    if (!arr.length) throw 'empty table';

                                    var jsonObj = {
                                        "type": "FeatureCollection",
                                        "features": arr
                                    };
                                    var newFile = new File([], vectorLayers[i]);
                                    //window.dropFilesCounter = (window.dropFilesCounter ? window.dropFilesCounter + 1 : 1);
                                    if (fileHandle) {
                                        _self.setFileHandle(newFile, fileHandle);
                                    }
                                    originalFnc.apply(_self, [newFile, { target: { result: jsonObj } }]);

                                } catch (err) {
                                    notLoaded++;
                                    manageLoad({ fileName: vectorLayers[i] });
                                    warnings.push({ table: vectorLayers[i], reason: err });
                                    TC.error("Error: " + err + " Table: " + vectorLayers[i], Consts.msgErrorMode.CONSOLE);
                                }
                            }
                            if (numTables === notLoaded) {
                                manageError("Error: No hay capas vectoriales válidas que mostrar");
                            }
                        }, manageError);
                    };
                    try {
                        loadFile(new Uint8Array(await getFileData(file)));
                    }
                    catch (ex) {
                        manageError(ex);
                    }
                });
            }
            else if (!/\.(json|geojson|kml|kmz|wkt|gml|gml2|gpx)$/ig.test(file.name)) {
                if (!/\.(shp)$/ig.test(file.name)) {
                    window.dropFilesCounter--;
                }

                let fileName = file.name;
                const extension = fileName.substring(fileName.lastIndexOf(".") + 1);
                if (extension.length) {
                    fileName = fileName.substring(0, fileName.lastIndexOf("."));
                }
                fileName = fileName.match(/^(?:spaSITNA)?(.+)/i)[1];

                //este objeto tiene una referencia al objeto del atributo "filename" del objeto zipCompressed
                var shpParams = null;
                //Si no tiene información referente al shp actual lo inicializo
                if (!Object.prototype.hasOwnProperty.call(zipUncompressed, fileName)) {
                    shpParams = zipUncompressed[fileName] = { isSHP: false, promises: [] };
                }
                else {
                    //Si ya hay información del shp la recupero
                    shpParams = zipUncompressed[fileName];
                }
                //los ficheros de texto los leo, guardo la promesa en un array para cuando estén todos los fichero
                if (/\.(cst|cpg|prj)$/ig.test(file.name)) {
                    shpParams.isSHP = true;
                    let filePromise = getFileText(file);
                    shpParams.promises.push(filePromise);
                    //tambien espero a que se resuelva esta promesa para guardar el contenido en una variable
                    filePromise.then(function (data) {
                        zipUncompressed[fileName][extension] = data;
                    });
                }
                //los ficheros binarios los leo, guardo la promesa en un array para cuando estén todos los fichero
                else if (/\.(shp|dbf|str)$/ig.test(file.name)) {
                    shpParams.isSHP = true;
                    if (/\.(shp)$/ig.test(file.name)) {
                        shpParams.shpFile = file;
                    }
                    let filePromise = getFileData(file);
                    shpParams.promises.push(filePromise);
                    //tambien espero a que se resuelva esta promesa para guardar el contenido en una variable
                    filePromise.then(function (data) {
                        zipUncompressed[fileName][extension] = data;
                    });
                }
                //si no existe todavia la promesa del timer la genero. Esto solo se hace una vez por cada shape.
                if (!shpParams.timer) {
                    //este timer resuelve una promesa durante ese tiempo todos los ficheros con el mismo nombre que el shape se procesaran. El resto quedan fuera
                    shpParams.timer = new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve();
                        }, 1300);
                    });
                    //añado la promesa del timer al resto de promesas. Cuando todas las promesas de lecturas de ficheros esten acabadas ademas del timer se procesa el fichero
                    shpParams.promises.push(shpParams.timer);
                    Promise.all(shpParams.promises).then(function (_results) {
                        if (!shpParams.isSHP) {
                            //si el fichero se llama wfsRequest.txt y no hay ningún SHP
                            if (file.name.toLowerCase() !== "wfsrequest.txt" ||
                                !Object.keys(zipUncompressed).some(k => zipUncompressed[k].isSHP)) {
                                window.dropFilesCounter++;
                                self.parent.trigger(Consts.event.FEATURESIMPORTERROR, {
                                    file: file
                                });
                            }
                            delete zipUncompressed[fileName];
                        }
                        else {
                            import('@sitna/shpjs/dist/shp').then(async ({ default: shp }) => {
                                var shapes;
                                let shpFile;
                                try {
                                    //window.dropFilesCounter = (window.dropFilesCounter ? window.dropFilesCounter + 1 : 1);
                                    if (!shpParams.shp || !shpParams.prj || !shpParams.dbf) {
                                        if (!shpParams.shp) window.dropFilesCounter++;
                                        self.parent.trigger(Consts.event.FEATURESIMPORTERROR, {
                                            file: file,
                                            message: "fileImport.shapeImcomplete"
                                        });
                                        delete zipUncompressed[fileName];
                                        return;
                                    }
                                    shpFile = shpParams.shpFile;
                                    shapes = await shp.combine([
                                        shp.parseShp(shpParams.shp, shpParams.prj, shpParams.str),
                                        shp.parseDbf(shpParams.dbf, shpParams.cst || shpParams.cpg || defaultEncoding)]);
                                    delete zipUncompressed[fileName];
                                }
                                catch (err) {
                                    self.parent.trigger(Consts.event.FEATURESIMPORTERROR, {
                                        file: file
                                    });
                                    return;
                                }
                                (shapes instanceof Array ? shapes : [shapes]).forEach(function (collection) {
                                    // El parser no añade ids, los añadimos nosotros.
                                    collection.features.forEach((f, i) => {
                                        f.id = `${fileName}.${i + 1}`;
                                    });
                                    var newFile = new File([], fileName + '.shp');
                                    const fileHandle = _self.getFileHandle(shpFile);
                                    if (fileHandle) {
                                        _self.setFileHandle(newFile, fileHandle);
                                    }
                                    originalFnc.apply(_self, [newFile, { target: { result: JSON.stringify(collection) } }]);
                                });
                            });
                        }
                    });
                }

            }
            else {
                //window.dropFilesCounter = (window.dropFilesCounter ? window.dropFilesCounter + 1 : 1);
                originalFnc.apply(_self, [file, evt]);
            }
        };

        // Añadidos gestores de eventos para mostrar el indicador visual de drop.
        var handleDrop = function (e) {
            if (isFileDrag(e)) { // Solo hay gestión si lo que se arrastra es un archivo
                var map = self.parent;
                if (ddInteraction.target === e.target) {
                    if (!isEmpty(e.dataTransfer.items)) {
                        var li = map.getLoadingIndicator();
                        if (li) {
                            map._featureImportWaitId = li.addWait(map._featureImportWaitId);
                        }
                    }
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

TC.wrap.Map.prototype.loadFiles = async function (files, options) {
    const self = this;
    let ddInteraction;
    if (!files.length) {
        return;
    }
    if (self.ddEnabled) {
        self.map.getInteractions().forEach(function (elm) {
            if (elm instanceof ol.interaction.DragAndDrop) {
                ddInteraction = elm;
            }
        });
    }
    else {
        ddInteraction = self.enableDragAndDrop({
            once: true
        });
    }

    if (ddInteraction && options) {
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

    var li = self.parent.getLoadingIndicator();
    if (li) {
        self.parent._featureImportWaitId = li.addWait(self.parent._featureImportWaitId);
    }
    for (var i = 0, ii = files.length; i < ii; ++i) {
        const file = files[i];
        ddInteraction.processFile(file);
    }
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

/*
 *  getVisibility: gets the OpenLayers layer visibility
 *  Result: boolean
 */
TC.wrap.Layer.prototype.getVisibility = function () {
    const self = this;
    var result = false;
    if (self.layer) {
        result = self.layer.getVisible();
    }
    return result;
};

/*
 *  setVisibility: Sets the OpenLayers layer visibility
 *  Parameter: boolean
 */
TC.wrap.Layer.prototype.setVisibility = function (visible) {
    const self = this;
    self.getLayer().then(function (layer) {
        layer.setVisible(visible);
    });
};

TC.wrap.Layer.prototype.setOpacity = async function (opacity) {
    const self = this;
    const olLayer = await self.getLayer();
    olLayer.setOpacity(opacity);
};

TC.wrap.Layer.prototype.isNative = function (layer) {
    return layer instanceof ol.layer.Layer;
};

TC.wrap.Layer.prototype.setProjection = function (options) {
    const self = this;
    options = options || {};
    const layer = self.parent;
    if (layer.map) {
        const unitRatio = getUnitRatio.call(self, {
            crs: options.crs,
            extentInDegrees: ol.proj.transformExtent(layer.map.getExtent(), layer.map.crs, 'EPSG:4326')
        });

        var resolutions = layer.getResolutions();
        if (resolutions && resolutions.length) {
            resolutions = resolutions.map(function (r) {
                return r / unitRatio;
            });
            layer.wrap.layer.setMaxResolution(resolutions[0]);
            layer.wrap.layer.setMinResolution(resolutions[resolutions.length - 1]);
        }
        else {
            // de metros a grados
            if (options.oldCrs && ol.proj.get(options.oldCrs).getUnits() === ol.proj.Units.METERS && (!ol.proj.get(options.crs).getUnits() || ol.proj.get(options.crs).getUnits() === ol.proj.Units.DEGREES)) {

                if (layer.minResolution) {
                    layer.minResolution = layer.minResolution / unitRatio;
                    self.layer.setMinResolution(layer.minResolution);
                }

                if (layer.maxResolution) {
                    layer.maxResolution = layer.maxResolution / unitRatio;
                    self.layer.setMaxResolution(layer.maxResolution);
                }

                // de grados a metros
            } else if (options.oldCrs && ol.proj.get(options.oldCrs).getUnits() === ol.proj.Units.DEGREES && ol.proj.get(options.crs).getUnits() === ol.proj.Units.METERS) {
                var metersPerDegree = TC.Util.getMetersPerDegree(ol.proj.transformExtent(layer.map.getExtent(), layer.map.crs, 'EPSG:4326'));

                if (layer.minResolution) {
                    layer.minResolution = layer.minResolution * metersPerDegree;
                    self.layer.setMinResolution(layer.minResolution);
                }

                if (layer.maxResolution) {
                    layer.maxResolution = layer.maxResolution * metersPerDegree;
                    self.layer.setMaxResolution(layer.maxResolution);
                }
            }
        }
    }
};

const createPathFromGeometry = function (geometry) {
    const result = new Path2D();
    const p0 = geometry[0];
    result.moveTo(p0[0], p0[1]);
    for (var i = 1, ii = geometry.length; i < ii; i++) {
        const p = geometry[i];
        result.lineTo(p[0], p[1]);
    }
    result.closePath();
    return result;
};

const getPixelRatioScalePath = function (path) {
    // flacunza:
    // En desktop escalamos la geometría según devicePixelRatio porque hemos escalado el mapa previamente
    // (ver TC.wrap.Map.prototype.manageSize)
    if (TC.Util.detectMobile()) {
        return path;
    }
    else {
        const result = new Path2D();
        result.addPath(path, new DOMMatrix('scale(' + window.devicePixelRatio + ')'));
        return result;
    }
};

const execCanvasOperation = function (geometry, operationName, prerenderHandler, postrenderHandler) {
    const self = this;
    const prerenderHandlerName = `_${operationName}PrerenderHandler`;
    const postrenderHandlerName = `_${operationName}PostrenderHandler`;
    if (self[prerenderHandlerName]) {
        self.layer.un(ol.render.EventType.PRERENDER, self[prerenderHandlerName]);
        delete self[prerenderHandlerName];
        self.layer.un(ol.render.EventType.POSTRENDER, self[postrenderHandlerName]);
        delete self[postrenderHandlerName];
    }

    if (geometry) {
        self[prerenderHandlerName] = prerenderHandler;
        self.layer.on(ol.render.EventType.PRERENDER, self[prerenderHandlerName]);

        self[postrenderHandlerName] = postrenderHandler;
        self.layer.on(ol.render.EventType.POSTRENDER, self[postrenderHandlerName]);
    }

    self.parent.map.wrap.map.render();
};

TC.wrap.Layer.prototype.clip = function (geometry) {
    const self = this;
    execCanvasOperation.call(self, geometry, 'clip', function (e) {
        let geom = geometry;
        if (TC.Util.isFunction(geometry)) {
            geom = geometry.call(self._wrap);
        }
        if (!(geom instanceof Path2D)) {
            geom = createPathFromGeometry(geom);
        }
        geom = getPixelRatioScalePath(geom);
        const ctx = e.context;
        ctx.save();
        ctx.clip(geom, 'evenodd');
    }, function (e) {
        e.context.restore();
    });
};

TC.wrap.Layer.prototype.stroke = function (geometry, style) {
    const self = this;
    execCanvasOperation.call(self, geometry, 'stroke', function (_e) {
    }, function (e) {
        let geom = geometry;
        if (TC.Util.isFunction(geometry)) {
            geom = geometry.call(self._wrap);
        }
        if (!(geom instanceof Path2D)) {
            geom = createPathFromGeometry(geom);
        }
        geom = getPixelRatioScalePath(geom);
        const ctx = e.context;
        if (style.strokeWidth) {
            ctx.lineWidth = style.strokeWidth;
        }
        if (style.strokeColor) {
            ctx.strokeStyle = style.strokeColor;
        }
        ctx.stroke(geom);
    });
};

TC.wrap.layer.Raster.prototype.WmsParser = ol.format.WMSCapabilities;

TC.wrap.layer.Raster.prototype.WmtsParser = ol.format.WMTSCapabilities;

TC.wrap.Layer.prototype.addCommonEvents = function (layer) {
    var self = this;
    layer.on('change:visible', function () {
        if (self.parent.map) {
            self.parent.map.trigger(Consts.event.LAYERVISIBILITY, {
                layer: self.parent
            });
        }
    }, self.parent.map);
};

TC.wrap.layer.Raster.prototype.getGetMapUrl = function () {
    var result = null;
    var self = this;
    switch (self.getServiceType()) {
        case Consts.layerType.WMS:
            var dcpType = self.parent.capabilities.Capability.Request.GetMap.DCPType;
            for (var i = 0; i < dcpType.length; i++) {
                if (dcpType[i].HTTP && dcpType[i].HTTP.Get) {
                    result = dcpType[i].HTTP.Get.OnlineResource;
                    break;
                }
            }
            break;
        case Consts.layerType.WMTS:
            result = self.parent.capabilities.OperationsMetadata.GetTile.DCP.HTTP.Get[0].href;
            break;
        default:
            break;
    }
    const fragment = document.createDocumentFragment();
    const textarea = document.createElement('textarea');
    fragment.appendChild(textarea);
    textarea.innerHTML = result;
    result = textarea.textContent;
    return result;
};

TC.wrap.layer.Raster.prototype.getInfoFormats = function () {
    var result = null;
    var c = this.parent.capabilities;
    if (c.Capability && c.Capability.Request.GetFeatureInfo) {
        result = c.Capability.Request.GetFeatureInfo.Format;
    }
    return result;
};

TC.wrap.layer.Raster.infoFormatPreference = [
    'application/json',
    'application/vnd.ogc.gml/3.1.1',
    'application/vnd.ogc.gml',
    'application/vnd.esri.wms_featureinfo_xml',
    'text/html',
    'text/plain',
    'text/xml'
];

TC.wrap.layer.Raster.prototype.getWMTSLayer = function (options) {
    var result = null;
    var self = this;
    var capabilities = self.parent.capabilities;
    options = options || {};
    let tileMatrixSetByCRS;
    if (options.crs) {
        tileMatrixSetByCRS = capabilities.Contents.TileMatrixSet.filter(tms => TC.Util.CRSCodesEqual(options.crs, tms.SupportedCRS));
    }
    if (capabilities && capabilities.Contents) {
        for (var i = 0; i < capabilities.Contents.Layer.length; i++) {
            var layer = capabilities.Contents.Layer[i];
            if (self.parent.options.layerNames === layer.Identifier) {
                for (var j = 0; j < layer.TileMatrixSetLink.length; j++) {
                    if (options.crs) {
                        let tms = tileMatrixSetByCRS.filter(tmsCRS => tmsCRS.Identifier === layer.TileMatrixSetLink[j].TileMatrixSet);
                        if (tms.length > 0) {
                            result = layer;
                            break;
                        }
                    } else if ((options.matrixSetId || self.parent.options.matrixSet) === layer.TileMatrixSetLink[j].TileMatrixSet) {
                        result = layer;
                        break;
                    }
                }
            }
        }
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getTileMatrix = function (matrixSet) {
    var result = null;
    var self = this;
    var capabilities = self.parent.capabilities;
    if (capabilities && capabilities.Contents && capabilities.Contents.TileMatrixSet) {
        for (var i = 0; i < capabilities.Contents.TileMatrixSet.length; i++) {
            var tms = capabilities.Contents.TileMatrixSet[i];
            if (tms.Identifier === matrixSet) {
                result = tms.TileMatrix;
                break;
            }
        }
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getScaleDenominators = function (node) {
    var result = [];
    var self = this;
    if (node.ScaleDenominator) {
        result = [node.ScaleDenominator, node.ScaleDenominator];
    }
    else {
        if (node.MinScaleDenominator || node.MaxScaleDenominator) {
            result = [node.MaxScaleDenominator, node.MinScaleDenominator];
        }
    }
    // Contemplamos el caso de una capa sin nombre: sus escalas válidas serán las de sus hijas.
    if (!result.length && !self.getName(node)) {
        var children = self.getLayerNodes(node);
        var max = -Infinity, min = Infinity;
        for (var i = 0, len = children.length; i < len; i++) {
            var childDenominators = self.getScaleDenominators(children[i]);
            if (childDenominators[0] > max) {
                max = childDenominators[0];
            }
            if (childDenominators[1] < min) {
                min = childDenominators[1];
            }
        }
        if (max > -Infinity && min < Infinity) {
            result = [max, min];
        }
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getAttribution = function () {
    const self = this;
    const result = {};
    const capabilities = TC.capabilities[self.parent.url];

    if (capabilities) {
        if (capabilities.ServiceProvider) {
            result.name = capabilities.ServiceProvider.ProviderName.trim();
            result.site = capabilities.ServiceProvider.ProviderSite;
            if (result.site && result.site.href && result.site.href.trim().length > 0) {
                result.site = result.site.href;
            } else {
                delete result.site;
            }
        }
        else if (capabilities.ServiceIdentification) {
            result.name = capabilities.ServiceIdentification.Title.trim();
        }
        else {
            result.name = capabilities.Service.Title.trim();
        }
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getInfo = function (name) {
    var self = this;
    var result = {};
    var capabilities = self.parent.capabilities;
    if (capabilities) {
        var i;
        if (capabilities.Capability) { // WMS
            var layerNodes = self.getAllLayerNodes();
            for (i = 0; i < layerNodes.length; i++) {
                var l = layerNodes[i];
                if (self.parent.compareNames(self.getName(l), name)) {
                    if (l.Title) {
                        result.title = l.Title;
                    }
                    if (l.Abstract) {
                        result.abstract = l.Abstract;
                    }
                    result.legend = [];

                    var _process = function (value) {
                        var legend = this.getLegend(value);
                        legend.filter((l) => l.src).forEach((l) => {
                            result.legend.push({
                                src: l.src, title: value.Title
                            });
                        })
                    };

                    var _traverse = function (o, func) {
                        if (o.Layer && o.Layer.length > 0) {
                            for (var i in o.Layer) {
                                //bajar un nivel en el árbol
                                _traverse(o.Layer[i], func);
                            }
                        } else {
                            func.apply(self, [o]);
                        }
                    };

                    //Obtenemos todas las leyendas de la capa o grupo de capas
                    _traverse(l, _process);

                    if (l.MetadataURL && l.MetadataURL.length) {
                        result.metadata = [];
                        for (var j = 0; j < l.MetadataURL.length; j++) {
                            var md = l.MetadataURL[j];
                            result.metadata.push({
                                format: md.Format, type: md.type, url: md.OnlineResource
                            });
                        }
                    }
                    result.queryable = l.queryable;
                    break;
                }
            }
        }
        else if (capabilities.Contents) { // WMTS
            const layerName = self.parent.names[0];
            for (i = 0; i < capabilities.Contents.Layer.length; i++) {
                const layer = capabilities.Contents.Layer[i];
                if (layer.Identifier === layerName) {
                    result.abstract = layer.Abstract;
                    let metadata = layer.Metadata;
                    if (metadata) {
                        if (!Array.isArray(metadata)) {
                            metadata = [metadata];
                        }
                        result.metadata = metadata.map(md => ({
                            format: md.format,
                            url: md.href
                        }));
                    }
                    break;
                }
            }
        }
    }

    return result;
};

TC.wrap.layer.Raster.prototype.getServiceType = function () {
    var result = null;
    var capabilities = this.parent.capabilities;
    if (capabilities.Capability && capabilities.Capability.Request && capabilities.Capability.Request.GetMap) {
        result = Consts.layerType.WMS;
    }
    else if (capabilities.OperationsMetadata && capabilities.OperationsMetadata.GetTile) {
        result = Consts.layerType.WMTS;
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getServiceTitle = function () {
    var result = null;
    var capabilities = this.parent.capabilities;
    if (capabilities.Capability && capabilities.Service) {
        result = capabilities.Service.Title;
    }
    else if (capabilities.ServiceIdentification) {
        result = capabilities.ServiceIdentification.Title;
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getRootLayerNode = function () {
    var self = this;
    var result;
    if (self.getServiceType() === Consts.layerType.WMS) {
        result = self.parent.capabilities.Capability.Layer;
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getName = function (node, ignorePrefix) {
    var result = node.Name;
    if (result && ignorePrefix) {
        var idx = result.indexOf(':');
        if (idx >= 0) {
            result = result.substr(idx + 1);
        }
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getIdentifier = function (node) {
    return node.Identifier;
};

TC.wrap.layer.Raster.prototype.getLayerNodes = function (node) {
    var result = node.Layer;
    if (!Array.isArray(result)) {
        if (result) {
            result = [result];
        }
        else {
            result = [];
        }
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getAllLayerNodes = function () {
    var self = this;
    if (!self._layerList) {
        switch (self.getServiceType()) {
            case Consts.layerType.WMS:
                var getNodeArray = function getNodeArray(node) {
                    var r = [node];
                    var children = self.getLayerNodes(node);
                    for (var i = 0; i < children.length; i++) {
                        r = r.concat(getNodeArray(children[i]));
                    }
                    return r;
                };
                var root = self.getRootLayerNode();
                self._layerList = root ? getNodeArray(root) : [];
                break;
            case Consts.layerType.WMTS:
                self._layerList = self.parent.capabilities.Contents.Layer.slice();
                break;
            default:
                self._layerList = [];
                break;
        }
    }
    return self._layerList;
};

TC.wrap.layer.Raster.prototype.normalizeLayerNode = function (node) {
    return node;
};

TC.wrap.layer.Raster.prototype.normalizeCapabilities = function (capabilities) {
    return capabilities;
};

// Objetos de apoyo para getLegend
const _fragment = document.createDocumentFragment();
const _textarea = document.createElement('textarea');
_fragment.appendChild(_textarea);

TC.wrap.layer.Raster.prototype.getLegend = function (node) {
    var result = [];
    var styles = node.Style;
    if (styles && styles.length) {
        if (styles.length && styles[0].LegendURL && styles[0].LegendURL.length) {
            styles[0].LegendURL.forEach(function addLegendItem(legendUrl) {
                _textarea.innerHTML = legendUrl.OnlineResource;
                const legendElm = {
                    src: _textarea.textContent
                };
                // Eliminado porque GeoServer miente con el tamaño de sus imágenes de la leyenda
                //if (legendUrl.size) {
                //    legendElm.width = legendUrl.size[0];
                //    legendElm.height = legendUrl.size[1];
                //}
                result.push(legendElm);
            });
        }
    }
    return result;
};

TC.wrap.layer.Raster.prototype.isCompatible = function (crs) {
    var self = this;
    var result = true;
    var layer = self.parent;
    switch (self.getServiceType()) {
        case Consts.layerType.WMS:
            if (layer.capabilities && layer.capabilities.Capability && layer.capabilities.Capability.Layer) {
                if (layer.names.length > 0) {
                    var names = layer.names.slice(0);
                    var _isCompatible = function _isCompatible(nodes, name, inCrs) {
                        var r = false;
                        if (nodes) {
                            for (var i = 0; i < nodes.length; i++) {
                                var n = nodes[i];
                                const itemCRS = n.CRS || n.SRS;
                                const crsList = Array.isArray(itemCRS) ? itemCRS : [itemCRS];
                                var isIn = inCrs || crsList.indexOf(crs) >= 0;
                                if (layer.compareNames(self.getName(n), name)) {
                                    if (isIn) {
                                        r = true;
                                    }
                                    break;
                                }
                                else if (_isCompatible(n.Layer, name, isIn)) {
                                    r = true;
                                    break;
                                }
                            }
                        }
                        return r;
                    };
                    while (names.length > 0) {
                        if (!_isCompatible([layer.capabilities.Capability.Layer], names.pop())) {
                            result = false;
                            break;
                        }
                    }
                }
            }
            break;
        case Consts.layerType.WMTS:
            result = false;
            if (layer.capabilities && layer.capabilities.Contents && layer.capabilities.Contents.TileMatrixSet) {
                var tms = layer.capabilities.Contents.TileMatrixSet;
                for (var i = 0; i < tms.length; i++) {
                    if (tms[i].Identifier === layer.options.matrixSet) {
                        result = TC.Util.CRSCodesEqual(crs, tms[i].SupportedCRS);
                        break;
                    }
                }
            }
            break;
        default:
            break;
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getCompatibleCRS = function () {
    var self = this;
    var result = [];
    var layer = self.parent;
    switch (self.getServiceType()) {
        case Consts.layerType.WMS:
            if (layer.capabilities && layer.capabilities.Capability && layer.capabilities.Capability.Layer) {
                if (layer.names.length > 0) {
                    const crsLists = layer.names
                        .map(function (name) {
                            return layer
                                .getNodePath(name) // array de nodos
                                .map(function (node) {
                                    const itemCRS = node.CRS || node.SRS || [];
                                    const crsList = Array.isArray(itemCRS) ? itemCRS : [itemCRS];
                                    return Array.isArray(crsList) ? crsList : [crsList];
                                }) // array de arrays de crs
                                .reduce(function (prev, cur) {
                                    if (prev.length === 0) {
                                        return cur;
                                    }
                                    cur.forEach(function (elm) {
                                        if (prev.indexOf(elm) < 0) {
                                            prev[prev.length - 1] = elm;
                                        }
                                    });// array con todos los crs
                                    return prev;
                                }, []);
                        });

                    if (crsLists.length === 1) {
                        result = crsLists[0];
                    } else {
                        const otherCrsLists = crsLists.slice(1);
                        result = crsLists[0].filter(function (elm) {
                            return otherCrsLists.every(function (crsList) {
                                return crsList.indexOf(elm) >= 0;
                            });
                        });
                    }
                }
            }
            break;
        case Consts.layerType.WMTS:
            if (layer.capabilities && layer.capabilities.Contents) {
                layer.capabilities.Contents.Layer
                    .filter(function (l) {
                        return l.Identifier === layer.layerNames;
                    })  // La capa de interés
                    .forEach(function (l) {
                        const tileMatrixSets = l.TileMatrixSetLink
                            .map(function (tmsl) {
                                return tmsl.TileMatrixSet;
                            });
                        result = layer.capabilities.Contents.TileMatrixSet
                            .filter(function (tms) {
                                return tileMatrixSets.indexOf(tms.Identifier) >= 0;
                            }) // TileMatrixSets asociados a la capa de interés
                            .map(function (tms) {
                                return tms.SupportedCRS;
                            });
                    });
            }
            break;
        default:
            break;
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getCompatibleLayers = function (crs) {
    var self = this;
    var result = [];
    var layer = self.parent;
    switch (self.getServiceType()) {
        case Consts.layerType.WMS:
            if (layer.capabilities && layer.capabilities.Capability && layer.capabilities.Capability.Layer) {
                var _recursiveFn = function (item, crs, inCrs) {
                    var crsToCheck = item.CRS || item.SRS;
                    var itemCRS = Array.isArray(crsToCheck) ? crsToCheck : [crsToCheck];
                    var isIn = inCrs || itemCRS.indexOf(crs) >= 0;
                    if (isIn && item.Name) {
                        result.push(item.Name);
                    }
                    if (item.Layer) {
                        for (var i = 0; i < item.Layer.length; i++) {
                            _recursiveFn(item.Layer[i], crs, isIn);
                        }
                    }
                };
                _recursiveFn(layer.capabilities.Capability.Layer, crs);
            }
            break;
        case Consts.layerType.WMTS:
            if (layer.capabilities && layer.capabilities.Contents && layer.capabilities.Contents.TileMatrixSet) {
                var tmsList = layer.capabilities.Contents.TileMatrixSet;
                for (var i = 0, ii = tmsList.length; i < ii; i++) {
                    var tms = tmsList[i];
                    if (TC.Util.CRSCodesEqual(crs, tms.SupportedCRS)) {
                        var tmsIdentifier = tms.Identifier;
                        var layerList = layer.capabilities.Contents.Layer;
                        for (var j = 0, jj = layerList.length; j < jj; j++) {
                            var tmsLinkList = layerList[j].TileMatrixSetLink;
                            for (var k = 0, kk = tmsLinkList.length; k < kk; k++) {
                                if (tmsLinkList[k].TileMatrixSet === tmsIdentifier) {
                                    result.push(layerList[j].Identifier);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            break;
        default:
            break;
    }
    return result;
};

TC.wrap.layer.Raster.prototype.getCompatibleMatrixSets = function (crs) {
    var self = this;
    var result = [];
    normalizeProjection({
        crs: crs
    });
    var layer = self.parent;
    if (self.getServiceType() === Consts.layerType.WMTS) {
        var layerList = layer.capabilities.Contents.Layer;
        var tmsList = layer.capabilities.Contents.TileMatrixSet;
        for (var i = 0, ii = layerList.length; i < ii; i++) {
            if (layer.layerNames === layerList[i].Identifier) {
                var tmsLinkList = layerList[i].TileMatrixSetLink;
                for (var j = 0, jj = tmsLinkList.length; j < jj; j++) {
                    var tmsLink = tmsLinkList[j];
                    for (var k = 0, kk = tmsList.length; k < kk; k++) {
                        var tms = tmsList[k];
                        if (tms.Identifier === tmsLink.TileMatrixSet) {
                            if (TC.Util.CRSCodesEqual(crs, tms.SupportedCRS)) {
                                result.push(tms.Identifier);
                            }
                            break;
                        }
                    }
                }
            }
        }
    }
    return result;
};

TC.wrap.layer.Raster.prototype.setWMTSUrl = function () {
    var self = this;

    self.getLayer().then(function (l) {
        self.parent.options = self.parent.options || {};
        var urls = l.getSource().getUrls();
        self.parent.options.urlPattern = urls[urls.length - 1];
    });
};

const bufferExtent = function (extent, resolution, width) {
    const extentBuffer = width * (resolution || 1);
    return extent.map((v, i) => i < 2 ? v - extentBuffer : v + extentBuffer);
};

TC.wrap.layer.Raster.prototype.createWMSLayer = function (url, params, options) {
    const self = this;
    var result = null;

    var source = new ol.source.ImageWMS({
        url: url,
        crossOrigin: options.map ? options.map.crossOrigin : undefined,
        params: params,
        ratio: TC.Cfg.imageRatio,
        imageLoadFunction: self.parent.getImageLoad.bind(self.parent),
        serverType: 'geoserver'
    });

    // flacunza: Aparentemente esta gestión de eventos es redundante, porque ya se están lanzando en Raster.getImageLoad
    //source.on('imageloadstart', function (e) {
    //    self.trigger(Consts.event.BEFORETILELOAD, {
    //        tile: e.image.getImage()
    //    });
    //});
    //source.on('imageloadend', function (e) {
    //    self.trigger(Consts.event.TILELOAD, {
    //        tile: e.image.getImage()
    //    });
    //});
    //source.on('imageloaderror', function (e) {
    //    self.trigger(Consts.event.TILELOAD, {
    //        tile: e.image.getImage()
    //    });
    //});


    var layerOptions = {
        visible: !!params.LAYERS.length || options && options.method && options.method === 'POST', //Las capas de temáticos cargadas por POST no tienen el atributo LAYERS
        source: source
    };

    if (options.minResolution) {
        layerOptions.minResolution = options.minResolution;
    }
    if (options.maxResolution) {
        layerOptions.maxResolution = options.maxResolution;
    }
    result = new ol.layer.Image(layerOptions);

    result._wrap = self;

    self.addCommonEvents(result);

    return result;
};

var createWmtsSource = function (options) {
    var self = this;
    var result = null;
    var sourceOptions = ol.source.WMTS.optionsFromCapabilities(self.parent.capabilities, {
        layer: options.layerNames,
        matrixSet: options.matrixSet,
        crossOrigin: options.map ? options.map.options.crossOrigin : undefined,
        requestEncoding: options.encoding,
        format: options.format
    });

    // Parche: OL calcula fullTileRanges_ en base a la extensión cubierta por los límites del último nivel de zoom. 
    // Esto es un problema porque mapabase tiene límites más extensos en los primeros niveles de zoom que en los últimos.
    // Reasignamos los límites en base a los que salen en el capabilities.
    let matrixSetLinkNode;
    const layerNode = self
        .parent
        .capabilities
        .Contents
        .Layer
        .find(l => l.Identifier === options.layerNames);
    if (layerNode) {
        matrixSetLinkNode = layerNode
            .TileMatrixSetLink
            .find(tmsl => tmsl.TileMatrixSet === options.matrixSet);
        if (matrixSetLinkNode) {
            const tmsLimits = matrixSetLinkNode.TileMatrixSetLimits;
            if (tmsLimits) {
                sourceOptions.tileGrid.fullTileRanges_.forEach(function (range, idx) {
                    const tmsl = tmsLimits[idx];
                    range.minX = tmsl.MinTileCol;
                    range.minY = tmsl.MinTileRow;
                    range.maxX = tmsl.MaxTileCol;
                    range.maxY = tmsl.MaxTileRow;
                });
            }
        }
        else {
            throw new Error(`Matrix set '${options.matrixSet}' not found`);
        }
    }
    else {
        throw new Error(`Layer '${options.layerNames}' not found`);
    }
    /// Fin de parche ///
    var https = 'https:';

    if (sourceOptions) {
        // añadido porque a partir de OL6 pasa el valor por defecto de 2048 al número de teselas que cabe en el viewport
        sourceOptions.cacheSize = 2048;

        if (location.protocol === https) {
            sourceOptions.urls = sourceOptions.urls.map(function (elm) {
                return elm.replace('http:', https);
            });
        }

        sourceOptions.extent = self.parent.getExtent();

        sourceOptions.crossOrigin = options.map ? options.map.crossOrigin : undefined;

        result = new ol.source.WMTS(sourceOptions);
        result.setTileLoadFunction(self.parent.getImageLoad.bind(self.parent));

        // flacunza: Aparentemente esta gestión de eventos es redundante, porque ya se están lanzando en Raster.getImageLoad
        //result.on(TILELOADSTART, function (e) {
        //    self.trigger(Consts.event.BEFORETILELOAD, {
        //        tile: e.tile.getImage()
        //    });
        //});
        //result.on(TILELOADEND, function (e) {
        //    self.trigger(Consts.event.TILELOAD, {
        //        tile: e.tile.getImage()
        //    });
        //});
        //result.on(TILELOADERROR, function (e) {
        //    self.trigger(Consts.event.TILELOAD, {
        //        tile: e.tile.getImage()
        //    });
        //});

        var prevFn = result.getResolutions.bind(result);
        result.getResolutions = function () {
            var resolutions = prevFn();
            var matrix = self.parent.getLimitedMatrixSet();
            //esto está mal, porque matrix podría empezar más abajo (tener recortado por ambos lados)
            if (matrix && matrix.length) {
                var ix = matrix[0].matrixIndex;
                if (ix !== undefined) {
                    resolutions = resolutions.slice(ix, matrix.length + ix);
                }
            }

            return resolutions;
        };
    }

    return result;
};

TC.wrap.layer.Raster.prototype.createWMTSLayer = function (options) {
    const self = this;
    var result = null;

    var source = createWmtsSource.call(self, options);

    if (source) {
        var layerOptions = {
            source: source
        };
        if (options.minResolution) {
            layerOptions.minResolution = options.minResolution;
        }
        if (options.maxResolution) {
            layerOptions.maxResolution = options.maxResolution;
        }
        result = new ol.layer.Tile(layerOptions);
        result._wrap = self;

        self.addCommonEvents(result);

        var resolutions = source.getResolutions();
        //Este +1 tan chungo es porque, en el caso en que la resolución del mapa es igual a la máxima del layer, openLayers lo oculta
        result.setMaxResolution(resolutions[0] + 1);
        result.setMinResolution(resolutions[resolutions.length - 1]);
    }

    return result;
};


/*
 *  getParams: Gets the WMS layer getmap parameters
 *  Returns: object
 */
TC.wrap.layer.Raster.prototype.getParams = function () {
    return this.layer.getSource().getParams();
};

/*
 *  setParams: Sets the WMS layer getmap parameters
 *  Parameter: object
 */
TC.wrap.layer.Raster.prototype.setParams = function (params) {
    this.layer.getSource().updateParams(params);
};

TC.wrap.layer.Raster.prototype.setMatrixSet = function (matrixSet) {
    const self = this;
    if (self.parent.type === Consts.layerType.WMTS) {
        const newSource = createWmtsSource.call(self, TC.Util.extend({}, self.parent.options, { matrixSet: matrixSet }));
        const newResolutions = newSource.getResolutions();
        const newMaxResolution = newResolutions[0];
        const newMinResolution = newResolutions[newResolutions.length - 1];
        self.layer.setMaxResolution(newMaxResolution);
        self.layer.setMinResolution(newMinResolution);
        if (self.parent.minResolution) {
            self.parent.minResolution = newMinResolution;
        }
        if (self.parent.maxResolution) {
            self.parent.maxResolution = newMaxResolution;
        }
        self.layer.setSource(newSource);
    }
};

TC.wrap.layer.Raster.prototype.getResolutions = function () {
    if (this.layer.getSource) {
        var ts = this.layer.getSource();
        if (ts.getResolutions) return ts.getResolutions();
        else return [];
    }
    else {
        return [];
    }
};

TC.wrap.layer.Raster.prototype.setResolutions = function (resolutions) {
    if (this.layer.getSource) {
        var ts = this.layer.getSource();
        if (ts.resolutions_) {
            ts.resolutions_ = resolutions;
        }
        else if (ts.tileGrid) {
            ts.tileGrid.resolutions_ = resolutions;
        }
    }
};

TC.wrap.layer.Raster.prototype.reloadSource = function () {
    const self = this;
    return new Promise(function (resolve, reject) {
        if (self.layer.getSource) {
            self.layer.getSource().refresh();
            resolve();
        }
        else {
            reject();
        }
    });
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

// En OL3 la imagen tiene el tamaño original. Escalamos si hace falta.
var setScaleFunction = function (imageStyle, iconWidth, olFeat) {
    if (imageStyle) {
        var setScaleForWidth = function (imgWidth) {
            var markerWidth = (olFeat && olFeat._wrap ? olFeat._wrap.parent.options.width : null) || iconWidth;
            if (markerWidth < imgWidth) {
                var factor = markerWidth / imgWidth;
                imageStyle.setScale(factor);
            }
        };
        var imageSize = imageStyle.getSize();
        if (imageSize) {
            setScaleForWidth(imageSize[0]);
        }
        else {
            var img = imageStyle.getImage();
            if (img.naturalWidth) {
                setScaleForWidth(img.naturalWidth);
            }
            else {
                const fragment = document.createDocumentFragment();
                const img = document.createElement('img');
                img.src = imageStyle.getSrc();
                fragment.appendChild(img);
                return new Promise(function (resolve) {
                    img.addEventListener('load', function () {
                        setScaleForWidth(this.naturalWidth);
                        resolve(this);
                    });
                });
            }
        }
    }
};

var getStyleValue = function (property, feature) {
    var result = property;
    var olFeat = feature && feature.wrap && feature.wrap.feature;
    if (typeof property === 'string') {
        var match = property.match(/^\$\{(.+)\}$/);
        if (match && olFeat) {
            // Permitimos el formato ${prop.subprop.subsubprop}
            var m = match[1].split('.');
            var r = olFeat.getProperties();
            for (var i = 0; i < m.length && r !== undefined; i++) {
                r = r[m[i]];
            }
            if (r === undefined) {
                r = feature.data;
                for (i = 0; i < m.length && r !== undefined; i++) {
                    r = r[m[i]];
                }
            }
            result = r;
        }
    }
    else if (TC.Util.isFunction(property)) {
        result = property(feature);
    }
    return result;
};

const mergeMapAndGeneralStyles = function (layer) {
    const result = TC.Util.extend(true, {}, TC.Cfg.styles);
    if (layer && layer.map) {
        TC.Util.extend(true, result, layer.map.options.styles);
    }
    return result;
};

// Transformación de opciones de estilo en un estilo nativo OL3.
const createNativeStyle = function (options, olFeat) {
    const nativeStyleOptions = [];

    var feature;
    var isPoint, isLine, isPolygon;
    if (olFeat) {
        const olGeom = olFeat.getGeometry();
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
        if (olFeat._wrap) {
            feature = olFeat._wrap.parent;
        }
        else {
            // Si la API SITNA no ha completado su feature, creamos un mock-up para que no fallen las funciones de estilo
            feature = {
                id: TC.wrap.Feature.prototype.getId.call({
                    feature: olFeat
                }), // GLS añado el id de la feature para poder filtrar por la capa a la cual pertenece                    
                features: olFeat.get('features'),
                getData: function () {
                    return TC.wrap.Feature.prototype.getData.call({
                        feature: olFeat
                    });
                }
            };


        }
    }
    var isCluster = feature && Array.isArray(feature.features) && feature.features.length > 1;
    var styles;
    const externalStyles = mergeMapAndGeneralStyles(options.layer);
    if (isCluster) {
        styles = TC.Util.extend(true, {}, externalStyles.cluster, options && options.styles && options.styles.cluster ? options.styles.cluster : {});
    }
    else {
        styles = TC.Util.extend(true, {}, externalStyles, options.styles);
    }

    var styleOptions = {};
    if (styles.line && (isLine || !olFeat)) {
        styleOptions = styles.line;
        (styleOptions instanceof Array ? styleOptions : [styleOptions]).forEach(function (currentStyle, index) {
            nativeStyleOptions[index] = Object.assign(nativeStyleOptions[index] || {},
                {
                    "stroke": new ol.style.Stroke({
                        color: getStyleValue(currentStyle.strokeColor, feature),
                        width: getStyleValue(currentStyle.strokeWidth, feature),
                        lineDash: currentStyle.lineDash
                    })
                });
        });
    }

    if (styles.polygon && (isPolygon || !olFeat)) {
        styleOptions = styles.polygon;
        (styleOptions instanceof Array ? styleOptions : [styleOptions]).forEach(function (currentStyle, index) {
            nativeStyleOptions[index] = Object.assign(nativeStyleOptions[index] || {},
                {
                    "fill": new ol.style.Fill({
                        color: getRGBA(getStyleValue(currentStyle.fillColor, feature), getStyleValue(currentStyle.fillOpacity, feature))
                    }),
                    "stroke": new ol.style.Stroke({
                        color: getStyleValue(currentStyle.strokeColor, feature),
                        width: getStyleValue(currentStyle.strokeWidth, feature),
                        lineDash: currentStyle.lineDash
                    })
                });
        });
    }

    if (styles.point && (isPoint || !olFeat)) {
        styleOptions = styles.point;
        (styleOptions instanceof Array ? styleOptions : [styleOptions]).forEach(function (currentStyle, index) {
            var circleOptions = {
                radius: getStyleValue(currentStyle.radius, feature) ||
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

            if (!isNaN(circleOptions.radius))
                nativeStyleOptions[index] = Object.assign(nativeStyleOptions[index] || {}, { "image": new ol.style.Circle(circleOptions) });
        });

    }

    if (styleOptions.label || styleOptions.labelKey) {
        nativeStyleOptions[nativeStyleOptions.length] = { "text": createNativeTextStyle(styleOptions, feature) };
    }

    if (styles.marker && (isPoint || !olFeat)) {
        styleOptions = styles.marker;
        (styleOptions instanceof Array ? styleOptions : [styleOptions]).forEach(function (currentStyle, index) {
            var ANCHOR_DEFAULT_UNITS = 'fraction';
            if (currentStyle.url) {
                nativeStyleOptions[index] = Object.assign(nativeStyleOptions[index] || {}, {
                    "image": new ol.style.Icon({
                        crossOrigin: 'anonymous',
                        anchor: styleOptions.anchor || styles.marker.anchor || [0.5, 1],
                        anchorXUnits: styleOptions.anchorXUnits || ANCHOR_DEFAULT_UNITS,
                        anchorYUnits: styleOptions.anchorYUnits || ANCHOR_DEFAULT_UNITS,
                        src: styleOptions.url,
                        //10/11/2021 URI: Recuperamos la rotación de los iconos que viene en grados y lo pasamos a radianes
                        rotation: styleOptions.rotation ? styleOptions.rotation / 180 * Math.PI : undefined
                    }),
                    "text": createNativeTextStyle(styleOptions, feature)
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
};

const createNativeTextStyle = function (styleObj, feature) {
    if (!styleObj || !styleObj.label) {
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
            color: getRGBA(fontColor, (Array.isArray(fontColor) ? fontColor[3] : 1) || 1)
            //color: getRGBA(getStyleValue(styleObj.fontColor, feature), 1)
        });
    }
    if (styleObj.labelOutlineColor) {
        const outlineColor = getStyleValue(styleObj.labelOutlineColor, feature);
        textOptions.stroke = new ol.style.Stroke({
            //09/11/2021 URI:Se estaba forzando la opacidad a 1 incluso si esta está definida en el 4 elemento del color
            color: getRGBA(outlineColor, (Array.isArray(outlineColor) ? outlineColor[3] : 1) || 1),
            //color: getRGBA(getStyleValue(styleObj.labelOutlineColor, feature), 1),
            width: getStyleValue(styleObj.labelOutlineWidth, feature)
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

var toHexString = function (number) {
    var result = number.toString(16);
    if (result.length === 1) {
        result = '0' + result;
    }
    return result;
};

var getHexColorFromArray = function (colorArray) {
    return '#' + toHexString(colorArray[0]) + toHexString(colorArray[1]) + toHexString(colorArray[2]);
};

var getStyleFromNative = function (olStyle, olFeat) {
    var result = {
    };
    if (TC.Util.isFunction(olStyle)) {
        if (olFeat) {
            olStyle = olStyle(olFeat);
        }
    }
    if (Array.isArray(olStyle)) {
        olStyle = olStyle[0];
    }
    if (!TC.Util.isFunction(olStyle)) {
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
                var size = image.getSize();
                if (size) {
                    result.width = size[0];
                    result.height = size[1];
                    result.anchor = image.getAnchor();
                    if (result.anchor) {
                        result.anchor[0] = (result.anchor[0] / result.width) * (image.getScale() || 1);
                        result.anchor[1] = (result.anchor[1] / result.height) * (image.getScale() || 1);
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

TC.wrap.layer.Vector.prototype.getStyle = function () {
    return getStyleFromNative(this.layer.getStyle());
};

TC.wrap.layer.Vector.prototype.reloadSource = function () {
    const self = this;
    return new Promise(function (resolve, _reject) {
        const layerOptions = self.createVectorSource(self.parent, self.createStyles(self.parent));

        if (self.parent.type === Consts.layerType.WFS) {
            var listenerKey = layerOptions.source.on('change', function (_e) {
                if (layerOptions.source.getState() === 'ready') {
                    ol.Observable.unByKey(listenerKey);

                    resolve();
                }
            });
        }

        var features = self.layer.getSource().getFeatures();
        self.layer.setSource(layerOptions.source);

        if (layerOptions.style)
            self.layer.setStyle(layerOptions.style);

        if (self.parent.type !== Consts.layerType.WFS) {
            layerOptions.source.addFeatures(features);
            resolve();
        }
    });
};

TC.wrap.layer.Vector.prototype.import = function (options) {
    var self = this;
    var opts = TC.Util.extend({
    }, options);
    opts.type = options.format;

    var oldFeatures = self.layer.getSource().getFeatures();
    var layerOptions = self.createVectorSource(opts, self.createStyles(self.parent));
    self.layer.setSource(layerOptions.source);
    if (layerOptions.style) {
        self.layer.setStyle(layerOptions.style);
    }

    layerOptions.source.addFeatures(oldFeatures);
};

TC.wrap.layer.Vector.prototype.createVectorSource = function (options, nativeStyle) {
    const self = this;

    var createGenericLoader = function (url, format) {
        var internalLoader = ol.featureloader.xhr(url, format);
        return function (extent, resolution, projection) {
            self.parent.state = TC.Layer.state.LOADING;
            if (self.parent.map) {
                self.parent.map.trigger(Consts.event.BEFORELAYERUPDATE, {
                    layer: self.parent
                });
            }
            internalLoader.call(this, extent, resolution, projection);
        };
    };
    var usesGenericLoader = false;

    var source;
    var vectorOptions;

    const isHeatmap = options.styles && options.styles.heatmap;
    if (Array.isArray(options.url) || options.urls) {
        var urls = options.urls || options.url;
        urls = urls.map(function (elm, _idx) {
            return TC.proxify(elm);
        });
        vectorOptions = {
            url: urls,
            //10/11/2021 URI:Ahora el KML Custom es una modificación directa del KML y no una sobrecarga de éste. Se añade al build de ol al compilar
            //format: new ol.format.KMLCustom({
            format: new ol.format.KML({
                showPointNames: false,
                extractStyles: !isHeatmap
            }),
            projection: options.crs
        };
    }
    else if (options.url && options.type !== Consts.layerType.WFS) {
        vectorOptions = {
            url: options.url,//TC.proxify(options.url),
            projection: options.crs
        };
        vectorOptions.format = getFormatFromName(options.format, !isHeatmap) ||
            getFormatFromName(TC.Util.getMimeTypeFromUrl(options.url), !isHeatmap) ||
            getFormatFromName(options.type, !isHeatmap);
        vectorOptions.loader = !(vectorOptions.format instanceof ol.format.KML) ? createGenericLoader(vectorOptions.url, vectorOptions.format) : function (_extent, _resolution, projection) {
            const url = vectorOptions.url;
            const format = vectorOptions.format;
            self.parent.state = TC.Layer.state.LOADING;
            if (self.parent.map) {
                self.parent.map.trigger(Consts.event.BEFORELAYERUPDATE, {
                    layer: self.parent
                });
            }
            self.parent.proxificationTool.fetch(url, { method: "GET", nomanage: true }).then(async function (response) {
                if (response.ok) {
                    const text = await response.text()
                    var features = format.readFeatures(text, { featureProjection: projection });
                    const xDocFilename = new DOMParser().parseFromString(text, "text/xml").querySelector("Document > name");

                    self.addFeatures(features);
                    self.parent.state = TC.Layer.state.IDLE;
                    if (response.headers.has("content-disposition") && /(attachment);([^;]*)/gi.test(response.headers.get("content-disposition"))) {
                        const contentDisposition = response.headers.get("content-disposition");
                        var name;
                        try {
                            name = /filename\*?=\"?([\w|-]*\'\')?(.*\.\w*)\"?/gi.exec(contentDisposition)[2];
                        } catch (ex) {
                            try {
                                name = contentDisposition.substring((contentDisposition.lastIndexOf("'") || contentDisposition.indexOf("=")) + 1);
                            } catch (ex2) { }
                        }
                        self.parent.title = (xDocFilename ? xDocFilename.textContent : "") + (name ? (xDocFilename && xDocFilename.textContent != name ? " (" + name + ")" : name) : "")
                    }
                    else
                        self.parent.title = (xDocFilename ? xDocFilename.textContent : "") + (xDocFilename && xDocFilename.textContent != self.parent.title ? " (" + self.parent.title + ")" : self.parent.title)

                    if (self.parent.map) {
                        self.parent.map.trigger(Consts.event.LAYERUPDATE, {
                            layer: self.parent
                        });
                    }
                }
            }).catch(function (response) {
                self.parent.state = TC.Layer.state.IDLE;
                if (self.parent.map) {
                    self.parent.map.trigger(Consts.event.LAYERERROR, {
                        layer: self.parent, reason: response
                    });
                }
            })

        };
        usesGenericLoader = true;
    }
    else if (options.data) {
        vectorOptions = {
            projection: options.crs,
            loader: function (extent, resolution, projection) {
                self.parent.state = TC.Layer.state.LOADING;
                if (self.parent.map) {
                    self.parent.map.trigger(Consts.event.BEFORELAYERUPDATE, {
                        layer: self.parent
                    });
                }
                var format = this.getFormat();
                try {
                    var fs = format.readFeatures(options.data, {
                        featureProjection: projection
                    });
                    this.addFeatures(fs);
                    self.parent.state = TC.Layer.state.IDLE;
                    if (self.parent.map) {
                        self.parent.map.trigger(Consts.event.LAYERUPDATE, {
                            layer: self.parent, newData: options.data
                        });
                    }
                }
                catch (e) {
                    self.parent.state = TC.Layer.state.IDLE;
                    if (self.parent.map) {
                        self.parent.map.trigger(Consts.event.LAYERERROR, {
                            layer: self.parent, reason: e.message
                        });
                    }
                }
            }
        };
        vectorOptions.format = getFormatFromName(options.format) || getFormatFromName(options.type);
    }
    else if (options.type === Consts.layerType.WFS) {
        var outputFormat;
        var mimeType;
        switch (options.outputFormat) {
            case Consts.format.JSON:
                outputFormat = new ol.format.GeoJSON({
                    geometryName: options.geometryName
                });
                mimeType = 'json';
                break;
            case Consts.format.GML3:
                outputFormat = new ol.format.WFS({ gmlFormat: new ol.format.GML3() });
                mimeType = Consts.mimeType.GML;
                break;
            case Consts.format.GML32:
                outputFormat = new ol.format.WFS({ gmlFormat: new ol.format.GML32() });
                mimeType = Consts.mimeType.GML;
                break;
            default:
                outputFormat = new ol.format.WFS({ gmlFormat: new ol.format.GML2() });
                mimeType = Consts.mimeType.GML;
                break;
        }
        vectorOptions = {
            format: outputFormat,
            loader: function (_extent, _resolution, projection) {
                var sOrigin = this;
                var serviceUrl = options.url;
                if (serviceUrl) {
                    self.parent.state = TC.Layer.state.LOADING;
                    self.parent.map.trigger(Consts.event.BEFORELAYERUPDATE, {
                        layer: self.parent
                    });

                    const isFilterText = function () {
                        return typeof options.properties === "string";
                    };
                    const manageResponse = (response) => {
                        const data = response.data;
                        let feats;
                        try {
                            feats = outputFormat.readFeatures(data);
                        }
                        catch (e) {
                            self.parent.map.trigger(Consts.event.LAYERERROR, { layer: self.parent, reason: e.message });
                        }
                        const triggerLayerUpdate = function () {
                            self.parent.map.trigger(Consts.event.LAYERUPDATE, {
                                layer: self.parent, newData: data
                            });
                        };
                        const onFeaturesAdd = function (e) {
                            if (e.layer === self.parent) {
                                self.parent.map.off(Consts.event.FEATURESADD, onFeaturesAdd);
                                triggerLayerUpdate();
                            }
                        };
                        if (feats && feats.length) {
                            self.parent.map.on(Consts.event.FEATURESADD, onFeaturesAdd);
                            sOrigin.addFeatures(feats);
                        }
                        else {
                            triggerLayerUpdate();
                        }
                        self.parent.state = TC.Layer.state.IDLE;
                    };
                    const manageError = (error) => {
                        if (error instanceof XMLDocument) {
                            self.parent.map.trigger(Consts.event.LAYERERROR, { layer: self.parent, reason: error.querySelector("ExceptionText").innerHTML });
                        }
                        else {
                            self.parent.map.trigger(Consts.event.LAYERERROR, { layer: self.parent, reason: error });
                        }
                    };

                    const makeAjaxCall = (onlyHits, capabilities) => {
                        var ajaxOptions = {};
                        var crs = projection.getCode();
                        var version = options.version || capabilities.version || '1.1.0';
                        capabilities.version = version;
                        var url = serviceUrl;
                        var featureType = Array.isArray(options.featureType) ? options.featureType : [options.featureType];
                        //const isSpatial = function (filter) {
                        //    switch (true) {
                        //        case filter instanceof TC.filter.LogicalNary:
                        //            return filter.conditions.some(f => isSpatial(f));
                        //        case filter instanceof TC.filter.Spatial:
                        //            return true;
                        //        case typeof filter === "string":
                        //            return Object.keys(window.TC.filter).filter(f => new TC.filter[f]() instanceof TC.filter.Spatial).some(f => filter.indexOf(f) > -1);
                        //        default:
                        //            return false;
                        //    }
                        //};
                        const filterText = isFilterText();
                        // flacunza: quitamos temporalmente la condicion isSpatial para no romper WFSEdit.
                        //if (options.properties && (isSpatial(options.properties) || (filterText ? options.properties.length > Consts.URL_MAX_LENGTH : options.properties.getText(capabilities.version).length > Consts.URL_MAX_LENGTH))) {
                        if (options.properties && (filterText ? options.properties.length > Consts.URL_MAX_LENGTH : options.properties.getText(capabilities.version).length > Consts.URL_MAX_LENGTH)) {
                            ajaxOptions.method = 'POST';
                            ajaxOptions.url = url;
                            ajaxOptions.data = filterText ? options.properties : TC.Util.WFSQueryBuilder(featureType, options.properties, capabilities, onlyHits ? null : options.outputFormat, onlyHits, crs, options.maxFeatures);

                            if (!filterText) {
                                self.parent.map.trigger(Consts.event.BEFOREAPPLYQUERY, { layer: self.parent, query: ajaxOptions.data });
                            }
                        }
                        else {
                            ajaxOptions.method = 'GET';
                            ajaxOptions.url = url;
                            ajaxOptions.data = {
                                service: "WFS",
                                request: "GetFeature",
                                version: version,
                                outputFormat: options.outputFormat,
                                srsname: crs
                            };
                            ajaxOptions.data["typename" + (version === "2.0.0" ? "s" : "")] = (options.featurePrefix ? options.featurePrefix + ":" : "") + options.featureType;
                            if (onlyHits)
                                ajaxOptions.data = Object.assign(ajaxOptions.data, {
                                    resultType: "hits"
                                });
                            if (options.properties) {
                                if (options.properties instanceof TC.filter.Bbox)
                                    ajaxOptions.data = Object.assign(ajaxOptions.data, {
                                        BBOX: '{0},{1},{2},{3},{4}'.format(options.properties.extent.concat([crs]))
                                    });
                                else
                                    //URI en IOS peta Lookbehind in JS regular expressions https://caniuse.com/js-regexp-lookbehind
                                    ajaxOptions.data = Object.assign(ajaxOptions.data, {
                                        // quita los prefijos ogc: y fes: del filtro esto afecta a las etiquetas de apertura de cierre
                                        filter: filterText ? options.properties : options.properties.getText(version).replace(/\<(fes\:|ogc\:)/g, "<").replace(/\<\/(fes\:|ogc\:)/g, "</")
                                    });

                                if (!filterText && !onlyHits) {
                                    self.parent.map.trigger(Consts.event.BEFOREAPPLYQUERY, { layer: self.parent, query: options.properties.getText() });
                                }
                            }
                            if (options.maxFeatures)
                                ajaxOptions.data = Object.assign(ajaxOptions.data, {
                                    maxFeatures: options.maxFeatures
                                });
                        }
                        switch (onlyHits ? "" : mimeType) {
                            case 'json':
                                ajaxOptions.responseType = Consts.mimeType.JSON;
                                break;
                            default:
                                ajaxOptions.responseType = Consts.mimeType.XML;
                                break;
                        }
                        ajaxOptions.contentType = Consts.mimeType.XML;

                        return TC.ajax(ajaxOptions);
                    };

                    self.parent.getCapabilitiesPromise().then((_capabilities) => {
                        const capabilities = _capabilities;
                        //obtenos del capabilities nummax de features
                        let numMaxFeatures = capabilities.Operations?.GetFeature?.CountDefault?.DefaultValue;
                        if (numMaxFeatures) {
                            if (!options.maxFeatures) {
                                options.maxFeatures = numMaxFeatures;
                            }
                            let filterText = isFilterText();
                            makeAjaxCall(filterText ? false : true, capabilities).then((response) => {
                                if (filterText) {
                                    manageResponse(response);
                                    return;
                                }
                                var firstNode = response.data.children[0];
                                if (firstNode.tagName.toLowerCase().indexOf("exception") >= 0) {
                                    self.parent.map.trigger(Consts.event.LAYERERROR, { layer: self.parent, reason: firstNode.querySelector("ExceptionText").innerHTML });
                                }
                                else if (firstNode.tagName.toLowerCase().indexOf("featurecollection") >= 0) {
                                    let numOfFeaturesFounded = parseInt((firstNode.attributes.numberMatched || firstNode.attributes.numberOfFeatures).value, 10);
                                    if (isNaN(numOfFeaturesFounded) || numOfFeaturesFounded >= parseInt(numMaxFeatures, 10)) {
                                        self.parent.map.trigger(Consts.event.LAYERERROR, { layer: self.parent, reason: Consts.WFSErrors.MAX_NUM_FEATURES, data: { limit: parseInt(numMaxFeatures, 10), founded: numOfFeaturesFounded } });
                                        return;
                                    }
                                    else if (!isNaN(numOfFeaturesFounded) && numOfFeaturesFounded === 0) {
                                        //si no encuentra nada. LLamo a la función para 
                                        manageResponse({
                                            data: outputFormat instanceof ol.format.GeoJSON ? { "type": "FeatureCollection", "totalFeatures": 0, "features": [], "crs": null } : outputFormat.writeFeatures([])
                                        });
                                        return;
                                    }
                                    makeAjaxCall(false, capabilities).then(manageResponse).catch(manageError);
                                }
                            }).catch(manageError);
                        }
                        else {
                            makeAjaxCall(false, capabilities).then(manageResponse).catch(manageError);
                        }
                    });
                    self._requestUrl = serviceUrl;
                }
            },
            //strategy: ol.loadingstrategy.all(),
            projection: options.crs
        };
    }

    if (options.features) {
        vectorOptions = vectorOptions || {};
        vectorOptions.features = options.features.map(f => f instanceof Feature_s ? f.wrap.feature : f);
    }

    source = new ol.source.Vector(vectorOptions);

    if (usesGenericLoader) {
        source.on(CHANGE, function (_e) {
            if (self.parent.map) {
                self.parent.map.trigger(Consts.event.LAYERUPDATE, {
                    layer: self.parent
                });
            }
        });
    }

    source._tcLayer = self.parent;

    var markerStyle = options.style && options.style.marker ? options.style.marker : TC.Cfg.styles.marker;
    if (!options.style || !options.style.marker) {
        markerStyle = TC.Util.extend({}, markerStyle, {
            anchor: TC.Cfg.styles.point.anchor
        });
    }

    // Si habilitamos el clustering la fuente es especial
    if (options.cluster) {
        source = new ol.source.Cluster({
            projection: options.crs,
            distance: options.cluster.distance,
            source: source
        });

        // Animación
        if (options.cluster.animate) {
            var getCurrentCoordinates = function (fromCoords, toCoords, duration, start) {
                var fraction = Math.min((Date.now() - start) / duration, 1);
                var dx = (toCoords[0] - fromCoords[0]) * fraction;
                var dy = (toCoords[1] - fromCoords[1]) * fraction;
                return [fromCoords[0] + dx, fromCoords[1] + dy];
            };
            var animate = function (parent, child) {
                var start = Date.now();
                var pCoords = parent.getGeometry().getCoordinates();
                var cCoords = child.getGeometry().getCoordinates();
                child.setGeometry(new ol.geom.Point(pCoords));
                var step = function step() {
                    var coords = getCurrentCoordinates(pCoords, cCoords, Consts.CLUSTER_ANIMATION_DURATION, start);
                    child.setGeometry(new ol.geom.Point(coords));
                    if (coords[0] !== cCoords[0] && coords[1] !== cCoords[1]) {
                        requestAnimationFrame(step);
                    }
                    else {
                        clusterCache.splice(clusterCache.indexOf(parent), 1);
                    }
                };
                requestAnimationFrame(step);
            };
            var clusterCache = [];
            source.addEventListener(REMOVEFEATURE, function (e) {
                var features = e.feature.get('features');
                if (features && features.length > 1) {
                    clusterCache.push(e.feature);
                }
            });
            source.addEventListener(ADDFEATURE, function (e) {
                var features = e.feature.get('features');
                if (features) {
                    var coords = features[0].getGeometry().getCoordinates();
                    if (features.length > 1) {
                        var match = clusterCache.filter(function (elm) {
                            var elmCoords = elm.getGeometry().getCoordinates();
                            return elmCoords[0] === coords[0] && elmCoords[1] === coords[1];
                        });
                        if (match.length) {
                            clusterCache.splice(clusterCache.indexOf(match[0]), 1);
                        }
                    }
                    var parent = clusterCache.filter(function (elm) {
                        var children = elm.get('features');
                        if (children && children.length > 0) {
                            var child = children.filter(function (cElm) {
                                var cCoords = cElm.getGeometry().getCoordinates();
                                return cCoords[0] === coords[0] && cCoords[1] === coords[1];
                            });
                            return child.length > 0;
                        }
                    });
                    if (parent.length) {
                        animate(parent[parent.length - 1], e.feature);
                    }
                }
            });
        }
    }

    var s = source;
    do {
        s.addEventListener(ADDFEATURE, function (e) {
            var olFeat = e.feature;
            // OL3 dibuja el tamaño original del icono del marcador, lo escalamos si es necesario:
            var style = getNativeFeatureStyle(olFeat, true);
            if (style) {
                const result = setScaleFunction(style.getImage(), markerStyle.width, olFeat);
                if (result) {
                    result.then(function () {
                        if (e.feature._wrap.parent._legend) {
                            const layer = e.feature._wrap.parent.layer;
                            delete e.feature._wrap.parent._legend;
                            layer.map.trigger(Consts.event.VECTORUPDATE, { "layer": layer });
                        }
                    });
                }
            }
        });
        if (TC.Util.isFunction(s.getSource)) {
            s = s.getSource();
        }
        else {
            s = null;
        }
    }
    while (s);

    source.addEventListener(ADDFEATURE, function (e) {
        const olFeat = e.feature;

        const addFeatureToLayer = function (feat) {
            var addFn;
            switch (true) {
                case feat instanceof Point_s:
                    addFn = self.parent.addPoint;
                    break;
                case feat instanceof Polyline:
                    addFn = self.parent.addPolyline;
                    break;
                case feat instanceof Polygon_s:
                    addFn = self.parent.addPolygon;
                    break;
                case feat instanceof MultiPolygon_s:
                    addFn = self.parent.addMultiPolygon;
                    break;
                case feat instanceof MultiPolyline:
                    addFn = self.parent.addMultiPolyline;
                    break;
                default:
                    addFn = self.parent.addFeature;
                    break;
            }
            if (addFn) {
                var _timeout;
                addFn.call(self.parent, olFeat).then(function (f) {
                    var features = olFeat.get('features');
                    if (Array.isArray(features)) {
                        // Es una feature de fuente ol.source.Cluster
                        f.features = features.map(function (elm) {
                            return new feat.constructor(elm);
                        });
                    }

                    // Timeout porque OL3 no tiene evento featuresadded. El timeout evita ejecuciones a lo tonto.
                    clearTimeout(_timeout);
                    _timeout = setTimeout(function () {
                        self.parent.map.trigger(Consts.event.FEATURESADD, {
                            layer: self.parent, features: [f]
                        });
                    }, 50);
                });
            }
        };

        if (!olFeat._wrap || !olFeat._wrap.parent.layer) { // Solo actuar si no es una feature añadida desde la API
            TC.wrap.Feature.createFeature(olFeat).then(addFeatureToLayer);
        }
    });

    source.addEventListener(REMOVEFEATURE, function (e) {
        var olFeat = e.feature;
        if (olFeat._wrap) {
            var idx = self.parent.features.indexOf(olFeat._wrap.parent);
            if (idx > -1) {
                self.parent.map.trigger(Consts.event.BEFOREFEATUREREMOVE, {
                    layer: self.parent, feature: olFeat._wrap.parent
                });
                self.parent.features.splice(idx, 1);
                self.parent.map.trigger(Consts.event.FEATUREREMOVE, {
                    layer: self.parent, feature: olFeat._wrap.parent
                });
            }
        }
    });

    source.addEventListener(ADDFEATURE, function (_e) {
        if (self.parent.map) {
            self.parent.map.trigger(Consts.event.VECTORUPDATE, {
                layer: self.parent
            });
        }
    });

    source.addEventListener(REMOVEFEATURE, function () {
        if (self.parent.map) {
            self.parent.map.trigger(Consts.event.VECTORUPDATE, {
                layer: self.parent
            });
        }
    });

    source.addEventListener(CLEAR, function () {
        if (self.parent.map) {
            self.parent.map.trigger(Consts.event.FEATURESCLEAR, {
                layer: self.parent
            });
        }
    });

    var layerOptions = {
        source: source
    };

    if (options.minResolution) {
        layerOptions.minResolution = options.minResolution;
    }
    if (options.maxResolution) {
        layerOptions.maxResolution = options.maxResolution;
    }

    // En KML conservamos el estilo que viene con el archivo, así que no entramos aquí.
    // A no ser que tenga clusters, porque OL no soporta por defecto la combinación de estilo KML con clusters.
    if (!(vectorOptions && vectorOptions.format instanceof ol.format.KML) || options.cluster) {
        layerOptions.style = nativeStyle || options.styles;
    }

    return layerOptions;
};

TC.wrap.layer.Vector.prototype.createStyles = function (options) {
    var self = this;

    var dynamicStyle = false;

    if (TC.Util.isFunction(options)) {
        dynamicStyle = true;
        self.styleFunction = function (olFeat) {
            return createNativeStyle(options(olFeat));
        };
    }
    else {
        options = TC.Util.extend({}, options);
        options.crs = options.crs || TC.Cfg.crs;
        const externalStyles = mergeMapAndGeneralStyles(self.parent);
        options.styles = TC.Util.extend(true, externalStyles, options.styles);
        var isDynamicStyle = function isDynamicStyle(obj) {
            for (var key in obj) {
                var prop = obj[key];
                switch (typeof prop) {
                    case 'string':
                        if (/^\$\{(.+)\}$/.test(prop)) {
                            return true;
                        }
                        break;
                    case 'object':
                        if (isDynamicStyle(prop)) {
                            return true;
                        }
                        break;
                    case 'function':
                        return true;
                    default:
                        break;
                }
            }
            return false;
        };

        dynamicStyle = !!(options.cluster && options.cluster.styles) || isDynamicStyle(options.styles);
        const opts = {};
        if (self.parent.styles) {
            opts.styles = Object.assign({}, self.parent.styles);
        }
        if (options.cluster && options.cluster.styles) {
            opts.styles = Object.assign({}, opts.styles, { cluster: options.cluster.styles });
        }
        self.styleFunction = function (olFeat) {
            opts.layer = self.parent;
            return createNativeStyle(opts, olFeat);
        };
    }

    var nativeStyle = dynamicStyle ? self.styleFunction : self.styleFunction();

    return nativeStyle;
};

TC.wrap.layer.Vector.prototype.setStyles = function (options) {
    const self = this;
    self.getLayer().then(function (olLayer) {
        if (options && options.heatmap || olLayer instanceof ol.layer.Heatmap) {
            const features = olLayer.getSource().getFeatures();
            features.forEach(f => f.setStyle(null));
            const newOptions = TC.Util.extend(true, { features: features }, self.parent.options);
            delete newOptions.styles;
            self.layer = self.createVectorLayer(TC.Util.extend(newOptions, { styles: options }));
            if (self.parent.map) {
                const mapWrap = self.parent.map.wrap;
                mapWrap.insertLayer(self.layer, mapWrap.getLayerIndex(olLayer));
                mapWrap.removeLayer(olLayer);
            }
        }
        else {
            olLayer.setStyle(self.createStyles({ styles: options }));
        }
    });
};

TC.wrap.layer.Vector.prototype.createVectorLayer = function (options) {
    const self = this;
    var result = null;

    options = options || self.parent.options;

    const layerOptions = self.createVectorSource(options, self.createStyles(options));

    //layerOptions.declutter = options.declutter || false;
    if (options.styles && options.styles.heatmap) {
        const hmOptions = TC.Util.extend({}, options.styles.heatmap);
        if (TC.Util.isFunction(hmOptions.weight)) {
            const oldWeightFn = hmOptions.weight;
            hmOptions.weight = function (olFeat) {
                return oldWeightFn(olFeat._wrap.parent);
            };
        }
        result = new ol.layer.Heatmap(TC.Util.extend({ source: layerOptions.source }, hmOptions));
    }
    else {
        result = new ol.layer.Vector(layerOptions);
    }
    result._wrap = self;

    self.addCommonEvents(result);

    return result;
};

TC.wrap.layer.Vector.prototype.addFeatures = function (features) {
    const self = this;
    const commit = function (l) {
        if (l instanceof ol.layer.Heatmap) {
            features.forEach(f => f.setStyle(null));
        }
        var source = l;
        while (TC.Util.isFunction(source.getSource)) {
            source = source.getSource();
        }
        source.addFeatures(features);
    };
    if (self.layer) {
        commit(self.layer);
    }
    else {
        self.getLayer().then(commit);
    }
};

TC.wrap.layer.Vector.prototype.getFeatures = function () {
    var olLayer = this.getLayer();
    if (olLayer instanceof ol.layer.Layer) {
        return olLayer.getSource().getFeatures();
    }
    else {
        return [];
    }
};

TC.wrap.layer.Vector.prototype.getFeatureById = function (id) {
    var olLayer = this.layer;
    if (olLayer instanceof ol.layer.Layer) {
        return olLayer.getSource().getFeatureById(id);
    }
    else {
        return null;
    }
};

TC.wrap.layer.Vector.prototype.removeFeature = function (feature) {
    const self = this;
    const commit = function (l) {
        if (feature.wrap.feature) {
            let source = l.getSource();
            let id = feature.wrap.feature.getId();
            if (id && source.getFeatureById(id)) {
                source.removeFeature(feature.wrap.feature);
                if (source.getSource && Array.isArray(feature.features)) {
                    const subSource = source.getSource();
                    feature.features.slice().forEach(f => subSource.removeFeature(f.wrap.feature));
                }
            }
        }
    };
    if (self.layer) {
        commit(self.layer);
    }
    else {
        self.getLayer().then(commit);
    }
};

TC.wrap.layer.Vector.prototype.clearFeatures = function () {
    const self = this;
    const commit = function (l) {
        var source = l.getSource();
        if (source.clearFeatures) {
            source.clearFeatures();
        }
        else {
            source.clear();
        }
    };
    if (self.layer) {
        commit(self.layer);
    }
    else {
        self.getLayer().then(commit);
    }
};

TC.wrap.layer.Vector.prototype.setFeatureVisibility = function (feature, visible) {
    var self = this;

    var fillOptions = {
        color: 'rgba(0, 0, 0, 0)'
    };
    var strokeOptions = {
        color: 'rgba(0, 0, 0, 0)'
    };
    var displayNoneStyle = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 0,
            fill: new ol.style.Fill(fillOptions),
            stroke: new ol.style.Stroke(strokeOptions)
        }),
        fill: new ol.style.Fill(fillOptions),
        stroke: new ol.style.Stroke(strokeOptions)
    });
    var idx = self.parent.features.indexOf(feature);
    if (idx >= 0) {
        var olFeat = feature.wrap.feature;
        self.getLayer().then(function (olLayer) {
            if (visible && olFeat._originalStyle) {
                olFeat.setStyle(olFeat._originalStyle);
            }
            else {
                olFeat._originalStyle = olFeat.getStyle() || olLayer.getStyle();
                olFeat.setStyle(displayNoneStyle);
            }
            self.parent.map.trigger(Consts.event.VECTORUPDATE, {
                layer: self.parent
            });
        });
    }
};

TC.wrap.layer.Vector.prototype.getRGBA = function (color, opacity) {
    return getRGBA(color, opacity);
};

TC.wrap.layer.Vector.prototype.findFeature = function (_values) {
    // TODO: añadir ol.animation.zoom
};

TC.wrap.layer.Vector.prototype.getGetFeatureUrl = function () {
    return this._requestUrl;
};

TC.wrap.layer.Vector.prototype.sendTransaction = function (inserts, updates, deletes) {
    const self = this;
    const getNativeFeature = function (feat) {
        return feat.wrap.feature;
    };
    return new Promise(function (resolve, reject) {
        const olInserts = inserts.map(getNativeFeature);
        const olUpdates = updates.map(getNativeFeature);
        const olDeletes = deletes.map(getNativeFeature);
        if (inserts.length || updates.length || deletes.length) {
            self.getLayer().then(function () {
                var format = new ol.format.WFS();
                var options = self.parent.options;
                var transaction = format.writeTransaction(olInserts, olUpdates, olDeletes, {
                    featurePrefix: options.featurePrefix,
                    featureNS: options.featureNS,
                    featureType: options.featureType[0]
                });
                var ajaxOptions = {
                    url: self.parent.url,
                    method: 'POST',
                    contentType: Consts.mimeType.XML,
                    responseType: Consts.mimeType.XML,
                    data: transaction.outerHTML
                };
                TC.ajax(ajaxOptions)
                    .then(function (response) {
                        const data = response.data;
                        const ns = 'http://www.opengis.net/ows';
                        var er = data.getElementsByTagNameNS(ns, 'ExceptionReport')[0];
                        var errorObj = {
                            reason: ''
                        };
                        if (er) {
                            var e = er.getElementsByTagNameNS(ns, 'Exception')[0];
                            if (e) {
                                errorObj.code = e.getAttribute('exceptionCode');
                                var texts = e.getElementsByTagNameNS(ns, 'ExceptionText');
                                for (var i = 0, len = texts.length; i < len; i++) {
                                    errorObj.reason += '\n' + texts[i].innerHTML;
                                }
                            }
                            reject(errorObj);
                        }
                        else {
                            var transactionResponse = format.readTransactionResponse(data);
                            resolve(transactionResponse);
                        }
                    })
                    .catch(function (err) {
                        const errObj = {
                            code: err.status || '',
                            reason: err.msg || 'unknown'
                        };
                        reject(errObj);
                    });
            });
        }
        else {
            resolve(self.parent);
        }
    });
};

TC.wrap.layer.Vector.prototype.setDraggable = function (draggable, onend, onstart) {
    var self = this;

    //tiene que estar a nivel de control para poder retirarla después
    //var interaction;
    Promise.all([self.parent.map.wrap.getMap(), self.getLayer()]).then(function (olObjects) {
        const olMap = olObjects[0];
        const olLayer = olObjects[1];
        if (draggable) {
            var interactionOptions = {
                layers: [olLayer],
                features: new ol.Collection(olLayer.getSource().getFeatures())
            };
            self.interaction = new ol.interaction.Translate(interactionOptions);
            if (TC.Util.isFunction(onend)) {
                self.interaction.on('translateend', function (e) {
                    if (e.features.getLength()) {
                        onend(e.features.item(0)._wrap.parent);
                    }
                });
            }
            if (TC.Util.isFunction(onstart)) {
                self.interaction.on('translatestart', function (e) {
                    if (e.features.getLength()) {
                        onstart(e.features.item(0)._wrap.parent);
                    }
                });
            }
            olMap.addInteraction(self.interaction);
        }
        else if (self.interaction) {
            olMap.removeInteraction(self.interaction);

            // GLS: En IE no muestra la manita en el over sobre marcadores trasladables.
            if (TC.Util.detectIE() && self._handlerDraggablePointerMove && TC.Util.isFunction(self._handlerDraggablePointerMove)) {
                olMap.un('pointermove', self._handlerDraggablePointerMove);
                delete self._handlerDraggablePointerMove;
            }
        }
    });
};

TC.wrap.layer.Vector.prototype.getFeaturesInExtent = function (extent, tolerance) {
    var self = this;
    var features = this.layer.getSource().getFeatures();
    var featuresInExtent = [];

    if (tolerance) {
        var leftCorner = self.parent.map.getPixelFromCoordinate([extent[0], extent[1]]);
        var rightCorner = self.parent.map.getPixelFromCoordinate([extent[2], extent[3]]);
        leftCorner[0] -= tolerance[0] / 2;
        leftCorner[1] += tolerance[1];
        rightCorner[0] += tolerance[0] / 2;
        extent = self.parent.map.getCoordinateFromPixel(leftCorner).concat(self.parent.map.getCoordinateFromPixel(rightCorner));
    }

    for (var i = 0; i < features.length; i++) {
        var feat = features[i];

        var geometry = feat.getGeometry();
        var coordinate = geometry.getCoordinates();

        if (ol.extent.containsCoordinate(extent, coordinate)) {
            featuresInExtent.push(feat._wrap.parent);
        }
    }

    return featuresInExtent;
};

TC.wrap.layer.Vector.prototype.getAttribution = function () {
    return null;
};
TC.wrap.layer.Vector.prototype.getGetMapUrl = function () {
    var result = null;
    var self = this;
    switch (self.getServiceType()) {
        case Consts.layerType.WFS:
            try {
                result = self.parent.capabilities.Operations.GetFeature.DCP.HTTP.Get.href;
            }
            catch (ex) {
            }
            break;
        default:
            break;
    }
    const fragment = document.createDocumentFragment();
    const textarea = document.createElement('textarea');
    fragment.appendChild(textarea);
    textarea.innerHTML = result;
    result = textarea.textContent;
    return result;
};

TC.wrap.layer.Vector.prototype.getServiceType = function () {
    var result = null;
    //URI: Si se tiene capabilities se supone que es un servicio WFS
    if (this.parent.capabilities) {
        result = Consts.layerType.WFS;
    }
    return result;
};

TC.wrap.control.Click.prototype.register = function (map) {
    var self = this;

    self._trigger = function (e) {
        if (map.view === Consts.view.PRINTING) {
            return;
        }
        var featureCount = 0;
        map.wrap.map.forEachFeatureAtPixel(e.pixel,
            function (feature, _layer) {
                if (feature._wrap && feature._wrap.parent.showsPopup) {
                    featureCount++;
                }
            },
            {
                hitTolerance: hitTolerance
            });
        if (!featureCount) {
            // GLS: lanzo el evento click, para que los controles que no pueden heredar de click y definir un callback pueda suscribirse al evento
            self.parent.map.trigger(Consts.event.CLICK, {
                coordinate: e.coordinate, pixel: e.pixel
            });
            self.parent.callback(e.coordinate, e.pixel);
        }
        // Seguimos adelante si no se han pinchado featuers
        return featureCount === 0;
    };
};

TC.wrap.control.Click.prototype.activate = function () {
    var self = this;

    self.parent.map.wrap.getMap().then(function (olMap) {
        olMap.on(SINGLECLICK, self._trigger);
    });
};

TC.wrap.control.Click.prototype.deactivate = function () {
    var self = this;

    self.parent.map.wrap.getMap().then(function (olMap) {
        olMap.un(SINGLECLICK, self._trigger);
    });
};

TC.wrap.control.ScaleBar.prototype.render = function () {
    var self = this;
    if (!self.ctl) {
        self.ctl = new ol.control.ScaleLine({
            target: self.parent.div
        });
    }
    else {
        self.ctl.updateElement_();
    }
};

TC.wrap.control.ScaleBar.prototype.getText = function () {
    var self = this;
    if (self.ctl) {
        return self.ctl.renderedHTML_;
    }
};

TC.wrap.control.NavBar.prototype.register = function (map) {
    var self = this;
    map.wrap.getMap().then(function (olMap) {
        const div = self.parent.div;
        self.zCtl = new ol.control.Zoom({
            target: div
        });
        // Ponemos para render una función modificada, para evitar que en los pinch zoom haya errores de este tipo:
        // AssertionError: Assertion failed: calculated value (1.002067782531452) ouside allowed range (0-1)

        self.zsCtl = new ol.control.ZoomSlider({
            render: function (e) {
                if (!e.frameState || !e.frameState.viewState || olMap.getView().getMinResolution() <= e.frameState.viewState.resolution) {
                    // GLS: para evitar que el slider se configure en horizontal
                    var render = function () {
                        if (this.element.offsetWidth > this.element.offsetHeight) {
                            if (!self.requestSliderSize) {
                                self.requestSliderSize = window.requestAnimationFrame(render.bind(this));
                            }

                            window.requestAnimationFrame(render.bind(this));
                        } else if (this.element.offsetWidth < this.element.offsetHeight) {
                            if (self.requestSliderSize) {
                                window.cancelAnimationFrame(self.requestSliderSize);
                                delete self.requestSliderSize;
                            }
                            ol.control.ZoomSlider.prototype.render.call(this, e);
                        }
                    };
                    render.call(this);
                }
            }
        });
        self.zsCtl.setTarget(div);

        olMap.addControl(self.zsCtl);
        olMap.addControl(self.zCtl);

        div.querySelectorAll('button').forEach(function (button) {
            button.classList.add('tc-ctl-btn', 'tc-float-btn', self.parent.CLASS + '-btn');
            button.style.display = 'block';
            button.innerHTML = '';
            if (button.matches('.ol-zoom-in')) {
                button.classList.add(self.parent.CLASS + '-btn-zoomin');
                button.setAttribute('title', self.parent.getLocaleString('zoomIn'));
            }
            if (button.matches('.ol-zoom-out')) {
                button.classList.add(self.parent.CLASS + '-btn-zoomout');
                button.setAttribute('title', self.parent.getLocaleString('zoomOut'));
            }
        });

        const zoomSlider = div.querySelector('.ol-zoomslider');
        zoomSlider.classList.add(self.parent.CLASS + '-bar');
        zoomSlider.querySelector('.ol-zoomslider-thumb').classList.add(self.parent.CLASS + '-slider');

        map.on(Consts.event.BASELAYERCHANGE, self.refresh.bind(self));
    });
};

TC.wrap.control.NavBar.prototype.refresh = function () {
    /*
    var map = this.parent.map;
    var olMap = map.wrap.map;

    olMap.removeControl(self.zsCtl);
    var res = map.getResolutions();
    self.zsCtl = new ol.control.ZoomSlider(
        {
            target: this.parent.div,
            "maxResolution": res[0],
            "minResolution": res[res.length - 1]
        });

    olMap.addControl(self.zsCtl);
    $(map.div).find('.ol-zoomslider').addClass(self.parent.CLASS + '-bar').find('.ol-zoomslider-thumb').addClass(self.parent.CLASS + '-slider');
    */
    var self = this;
    var map = self.parent.map.wrap.map;
    // Puede ser que se llame a refresh antes de que esté inicializado ol.control.ZoomSlider. En ese caso llamamos a render que lo inicializa.
    // Como render necesita un ol.MapEvent, esperamos al evento POSTRENDER.

    self.parent.renderPromise().then(function () {
        if (self.zsCtl.sliderInitialized_) {
            var res = map.getView().getResolution();
            self.zsCtl.setThumbPosition_(res);
        }
        else {
            map.once(POSTRENDER, function (e) {
                self.zsCtl.render(e);
            });
        }
    });
};

TC.wrap.control.NavBarHome.prototype.register = function (map) {
    var self = this;
    map.wrap.getMap().then(function (olMap) {
        const div = self.parent.div;

        self.z2eCtl = new ol.control.ZoomToExtent({
            target: div, extent: map.initialExtent, tipLabel: ''
        });

        olMap.addControl(self.z2eCtl);

        div.querySelectorAll('button').forEach(function (button) {
            button.style.display = 'block';
            button.innerHTML = '';
        });
        const homeBtn = div.querySelector('.ol-zoom-extent button');
        homeBtn.classList.add('tc-ctl-btn', 'tc-float-btn', self.parent.CLASS + '-btn');
        homeBtn.setAttribute('title', self.parent.getLocaleString('zoomToInitialExtent'));
    });
};

TC.wrap.control.NavBarHome.prototype.setInitialExtent = function (extent) {
    this.z2eCtl.extent = extent;
};

TC.wrap.control.Coordinates.prototype.register = async function (map) {
    const self = this;
    self.map = map;

    self._coordsTrigger = function (e) {
        self.parent.coordsToClick(e);
    };

    self.olMap = await map.wrap.getMap();
    if (!self.parent.map.on3DView) {
        var projection = self.olMap.getView().getProjection();
        self.parent.crs = projection.getCode();
        self.parent.units = projection.getUnits();
    } else {
        self.parent.crs = self.parent.map.view3D.crs;
        self.parent.units = Consts.units.DEGREES;
    }

    self.parent.isGeo = self.parent.units === ol.proj.Units.DEGREES;

    //$(olMap.getViewport()).add(self.parent.div);
};

TC.wrap.control.Coordinates.prototype.onMouseMove = function (e) {
    var self = this;
    if (self.map.wrap.map) {
        var coords = self.map.wrap.map.getEventCoordinate(e);
        if (coords) {
            if (self.parent.isGeo) {
                self.parent.latLon = coords.reverse();
            } else {
                self.parent.xy = coords;
            }

            self.parent.update.apply(self.parent, arguments);
        }
    }
};

TC.wrap.control.Geolocation.prototype.register = function (map) {
    var self = this;
    self.map = map;

    self._snapTrigger = function (e) {
        if (e.dragging) {
            return;
        }
        self.initSnap(self.olMap.getEventCoordinate(e.originalEvent), e.pixel);
    };

    self._postrenderTrigger = function (e) {
        self.duringTrackSnap(e);
    };

    map.wrap.getMap().then(function (olMap) {
        self.olMap = olMap;
    });
};

var getGeotrackingLine = function () {
    var self = this;

    return self.parent.geotrackingLayer.features.filter(function (f) {
        return f instanceof Polyline;
    })[0];
};

TC.wrap.control.Geolocation.prototype.hasCoordinates = function () {
    var self = this;

    return self.parent.geotrackingLayer.features.length > 0 && self.parent.geotrackingLayer.features[0].geometry.length >= 1;
};

//var getTime = function (timeFrom, timeTo) {
//    var diff = timeTo - timeFrom;
//    var d = {
//        s: Math.floor((diff / 1000) % 60),
//        m: Math.floor(((diff / (1000 * 60)) % 60)),
//        h: Math.floor(((diff / (1000 * 60 * 60)) % 24))
//    };

//    return TC.Util.extend({}, d, { toString: ("00000" + d.h).slice(-2) + ':' + ("00000" + d.m).slice(-2) + ':' + ("00000" + d.s).slice(-2) });
//};

TC.wrap.control.Geolocation.prototype.addWaypoint = function (position, properties) {
    var self = this;

    var waypoint = new ol.Feature({
        geometry: new ol.geom.Point([position[0], position[1], properties.ele, properties.time], 'XYZM')
    });
    waypoint.setProperties(properties);

    self.parent.geotrackingLayer.wrap.layer.getSource().addFeature(waypoint);
};

TC.wrap.control.Geolocation.prototype.addPosition = function (position, heading, m, speed, _accuracy, _altitudeAccuracy, altitude) {
    var self = this;

    var x = position[0];
    var y = position[1];

    var line = getGeotrackingLine.call(this);
    if (self.parent.geotrackingLayer.features && line) {
        var last = line.geometry.length > 0 && line.geometry[line.geometry.length - 1];
        if (last && last.length === 0) {
            self.parent.geotrackingLayer.features[0].geometry.push([x, y, altitude, m]);
            line.wrap.feature.getGeometry().appendCoordinate([x, y, altitude, m]);
        }
        else {
            var lx = last[0];
            var ly = last[1];

            if (x !== lx || y !== ly) {
                self.parent.geotrackingLayer.features[0].geometry.push([x, y, altitude, m]);
                line.wrap.feature.getGeometry().appendCoordinate([x, y, altitude, m]);
            }
        }

        TC.Util.storage.setSessionLocalValue(self.parent.const.localStorageKey.GEOTRACKINGTEMP, self.formattedToStorage(self.parent.geotrackingLayer).features);
    }

    self.parent.trigger(self.parent.const.event.STATEUPDATED, {
        moving: (heading != undefined && speed != undefined && speed > 0 && heading > 0)
    });
};

TC.wrap.control.Geolocation.prototype.positionChangehandler = async function (geoposition) {
    const self = this;
    var accuracy, heading, speed, altitude, altitudeAccuracy;

    if (!getGeotrackingLine.call(this)) {
        self.parent.setGeotracking(false);
    }

    if (geoposition && geoposition.coords) {
        self.parent.gpsLayer.clearFeatures();

        accuracy = geoposition.coords.accuracy / self.parent.map.getMetersPerUnit() || 0;
        heading = geoposition.coords.heading || geoposition[2] || 0;
        speed = geoposition.coords.speed ? geoposition.coords.speed * 3.6 : 0;
        altitude = geoposition.coords.altitude || 0;
        altitudeAccuracy = geoposition.coords.altitudeAccuracy || 0;

        if (self.parent.geotrackingLayer) {
            var position_ = [geoposition.coords && geoposition.coords.longitude || geoposition[0], geoposition.coords && geoposition.coords.latitude || geoposition[1]];
            if (!position_.every(c => c)) { // al menos desde las herramientas de desarrollo puede llegar con lat/lon a undefined lo que provoca un error de OL: TypeError: coordinates must be finite numbers
                return null;
            }
            var projectedPosition = TC.Util.reproject(position_, 'EPSG:4326', self.parent.map.crs);

            self.addPosition(projectedPosition, heading, new Date().getTime(), speed, accuracy, altitudeAccuracy, altitude);

            var coords = getGeotrackingLine.call(self).geometry;
            var len = coords.length;
            if (len >= 2) {
                self.parent.deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
            }

            self.parent.trigger(self.parent.const.event.POSITIONCHANGE, {
                pd: {
                    "position": projectedPosition,
                    "altitude": altitude,
                    "accuracy": accuracy,
                    "heading": TC.Util.radToDeg(heading),
                    "speed": speed
                }
            });

            const features = await Promise.all([self.parent.gpsLayer.addPoint(projectedPosition, {
                radius: 6,
                fillColor: '#00CED1',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWidth: 2,
                showsPopup: false
            }), self.parent.gpsLayer.addCircle({ center: projectedPosition, radius: accuracy }, {
                strokeColor: '#ffffff',
                strokeWidth: 1,
                fillColor: '#00CED1',
                fillOpacity: 0.3,
                showsPopup: false
            })]);
            const marker = features[0];
            const accuracyCircle = features[1];
            self.parent.geotrackingPosition = true;

            if (self.parent.firstPosition == false) {
                self.parent.firstPosition = true;

                if (!self.parent.trackCenterButton) {
                    self.parent.trackCenterButton = self.parent.div.querySelector('.' + self.parent.CLASS + '-track-center');
                    self.parent.trackCenterButton.querySelector('button').addEventListener('click', function () {
                        if (!this.classList.contains(Consts.classes.UNPLUGGED)) {
                            self.parent.setFollowing(false);
                            return;
                        }
                        self.parent.setFollowing(true);
                        self.parent.moveTo(self.parent.gpsLayer.features[0].geometry);
                        //self.parent.moveTo(self.parent.gpsLayer.features);
                        /*self.parent.gpsLayer.map.setCenter(self.parent.layerGPS.features[0].geometry, { animate: false }).then(function () {
                            setTimeout(function () {
                                self.parent.setFollowing(true)
                            },300);
                        });*/

                        self.parent.getTrackInfoPanel().then(function (infoPanel) {
                            if (!infoPanel.isVisible()) {
                                infoPanel.doVisible();
                            }

                            if (infoPanel.isMinimized()) {
                                infoPanel.maximize();
                            }
                        });
                    });

                    var controlContainer = self.parent.map.getControlsByClass('TC.control.ControlContainer')[0];
                    if (controlContainer) {
                        self.parent.trackCenterButton = controlContainer.addElement({ position: controlContainer.POSITION.LEFT, htmlElement: self.parent.trackCenterButton });
                    } else {
                        self.parent.map.div.appendChild(self.parent.trackCenterButton);
                    }

                }
                self.parent.trackCenterButton.classList.remove(Consts.classes.HIDDEN);
                self.parent.setFollowing(true);
                self.parent.moveTo(self.parent.gpsLayer.features);
                //self.parent.gpsLayer.map.zoomToFeatures(self.parent.gpsLayer.features);
            }

            return {
                marker: marker,
                accuracy: accuracyCircle
            };
        }
    }

    return null;
};

TC.wrap.control.Geolocation.prototype.setGeotracking = function (tracking) {
    var self = this;

    if (tracking) {
        self.parent.firstPosition = false;
        var sessionwaypoint = [];

        var nativeGeotrackingFeature;

        if (self.parent.geotrackingSession) {

            var JSONParser = new TC.wrap.parser.JSON();
            var features = JSONParser.parser.readFeatures(self.parent.geotrackingSession);
            if (features && self.parent.storageCrs !== self.parent.map.crs) {
                features = features.map(function (feature) {
                    var clone = feature.clone();
                    clone.getGeometry().transform(self.parent.storageCrs, self.parent.map.crs);
                    return clone;
                });
            }

            var coordinates = features.filter(function (feature) {
                var type = feature.getGeometry().getType().toLowerCase();
                if (type === 'point') { sessionwaypoint.push(feature); }
                return type === 'linestring' || type === 'multilinestring';
            })[0].getGeometry().getCoordinates();

            nativeGeotrackingFeature = new ol.Feature({
                geometry: new ol.geom.LineString(coordinates, 'XYZM'),
                tracking: true
            });

        } else {
            nativeGeotrackingFeature = new ol.Feature({
                geometry: new ol.geom.LineString([], 'XYZM'),
                tracking: true
            });
        }

        if (nativeGeotrackingFeature) {

            TC.wrap.Feature.createFeature(nativeGeotrackingFeature).then(function (tcFeature) {
                self.parent.geotrackingLayer.addFeature(tcFeature);

                if (tcFeature.geometry.length > 1) {
                    self.parent.map.zoomToFeatures(self.parent.geotrackingLayer.features);
                }

                if (sessionwaypoint.length > 0) {
                    Promise.all(sessionwaypoint.map(function (waypoint) {
                        return TC.wrap.Feature.createFeature(waypoint);
                    })).then(function (features) {
                        if (features) {
                            features.forEach(function (feature) {
                                self.parent.geotrackingLayer.addFeature(feature);
                            });
                        }
                    });
                }

                self.parent.currentPositionWaiting = self.parent.getLoadingIndicator().addWait();

                if (!self.currentPositionTrk) {
                    self.currentPositionTrk = [];
                }

                var getCurrentPositionInterval;
                var getCurrentPositionRequest = 0;
                var errorTimeout = 0;
                var toast = false;
                var options = {
                    enableHighAccuracy: true, timeout: 600000
                };

                function getCurrentPosition(errorCallback) {
                    var id = getCurrentPositionRequest++;
                    navigator.geolocation.getCurrentPosition(
                        function (data) {
                            clearInterval(getCurrentPositionInterval);
                            self.parent.getLoadingIndicator().removeWait(self.parent.currentPositionWaiting);
                            self.positionChangehandler(data).then(function (obj) {
                                if (self.parent.geotrackingPosition == true && obj && obj.marker && obj.accuracy) {
                                    self.currentPositionTrk.push(navigator.geolocation.watchPosition(self.positionChangehandler.bind(self), self.parent.onGeolocateError.bind(self.parent), options));
                                }
                            });
                        },
                        errorCallback ? errorCallback :
                            function (error) {
                                switch (error.code) {
                                    case error.TIMEOUT:
                                        if (errorTimeout > 10) {
                                            clearInterval(getCurrentPositionInterval);
                                            self.parent.onGeolocateError.call(self.parent, error);
                                        } else {
                                            errorTimeout++;
                                            getCurrentPosition(function () {
                                                clearInterval(getCurrentPositionInterval);
                                                if (!toast) {
                                                    toast = true;
                                                    self.parent.onGeolocateError.call(self.parent, error);
                                                }
                                            });
                                        }
                                        break;
                                    default:
                                        clearInterval(getCurrentPositionInterval);
                                        self.parent.onGeolocateError.call(self.parent, error);
                                }
                            }, {
                        timeout: 5000 + id,
                        maximumAge: 10,
                        enableHighAccuracy: true
                    }
                    );
                }
                getCurrentPositionInterval = setInterval(getCurrentPosition, 1000);

                setTimeout(function () {
                    if (self.parent.geotrackingLayer && self.parent.geotrackingLayer.features && self.parent.geotrackingLayer.features.length > 0 && self.parent.geotrackingLayer.features[0].geometry.length == 0) {
                        clearInterval(getCurrentPositionInterval);

                        self.parent.getLoadingIndicator().removeWait(self.parent.currentPositionWaiting);
                        self.map.toast(self.parent.getLocaleString("geo.error.permission_denied"), {
                            type: Consts.msgType.WARNING
                        });
                        self.parent.track.activateButton.classList.remove(Consts.classes.HIDDEN);
                        self.parent.track.deactivateButton.classList.add(Consts.classes.HIDDEN);
                    }
                }, options.timeout + 1000); // Wait extra second

            });
        }
    } else {
        self.parent.firstPosition = false;

        if (self.currentPositionTrk) {
            self.currentPositionTrk = self.currentPositionTrk instanceof Array ? self.currentPositionTrk : [self.currentPositionTrk];

            self.currentPositionTrk.forEach(function (watch) {
                navigator.geolocation.clearWatch(watch);
            });

            self.currentPositionTrk = [];
        }

        if (self.parent.trackCenterButton)
            self.parent.trackCenterButton.classList.add(Consts.classes.HIDDEN);
    }
};

TC.wrap.control.Geolocation.prototype.activateSnapping = function () {
    var self = this;

    if (!TC.Util.detectMobile()) {
        self.olMap.on([POINTERMOVE, SINGLECLICK], self._snapTrigger);
        self.parent.trackLayer.wrap.layer.on(POSTRENDER, self._postrenderTrigger);
    }
};
TC.wrap.control.Geolocation.prototype.deactivateSnapping = function () {
    var self = this;

    self.parent.map.wrap.getMap().then(function (olMap) {
        if (!TC.Util.detectMobile()) {
            olMap.un([POINTERMOVE, SINGLECLICK], self._snapTrigger);
            self.parent.trackLayer.wrap.layer.un(POSTRENDER, self._postrenderTrigger);
        }

        if (self.snapInfo) {
            olMap.removeOverlay(self.snapInfo);
        }

        if (self.snapInfoElement) {
            self.snapInfoElement.style.display = 'none';
        }

        if (self.snapLine) {
            delete self.snapLine;
            olMap.render();
        }
    });
};
TC.wrap.control.Geolocation.prototype.clear = function (layer) {
    var self = this;

    if (layer) {
        layer.clearFeatures();
    }

    self.deactivateSnapping.call(self);
};

TC.wrap.control.Geolocation.prototype.duringTrackSnap = function (e) {
    var self = this;

    const vectorContext = ol.render.getVectorContext(e);

    if (vectorContext && self.snapLine) {
        if (typeof vectorContext.setFillStrokeStyle === 'function') {
            vectorContext.setFillStrokeStyle(null, new ol.style.Stroke({
                color: 'rgba(197, 39, 55, 1)',
                width: 1
            }));
        }

        if (typeof vectorContext.drawGeometry === 'function') {
            vectorContext.drawGeometry(self.snapLine.wrap.feature.getGeometry());
        }
    }
};

TC.wrap.control.Geolocation.prototype.endSnap = function () {
    var self = this;

    self.parent.map.wrap.getMap().then(function (olMap) {
        /* cartel */
        if (self.snapInfo) {
            olMap.removeOverlay(self.snapInfo);
        }
        if (self.snapInfoElement) {
            self.snapInfoElement.style.display = 'none';
        }
        /* línea */
        if (self.snapLine) {
            delete self.snapLine;
        }
    });
};

TC.wrap.control.Geolocation.prototype.initSnap = function (coordinate, eventPixel) {
    var self = this;

    if (self.parent.trackLayer) {
        var vectorSource = self.parent.trackLayer.wrap.layer.getSource();
        var closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate,
            f => {
                const geom = f.getGeometry();
                return geom instanceof ol.geom.LineString || geom instanceof MultiLineString
            });

        if (closestFeature !== null) {
            var geometry = closestFeature.getGeometry();
            var closestPoint = geometry.getClosestPoint(coordinate);

            // preparamos las Z del MDT si hay datos del MDT
            self.parent.setSecondaryElevationProfileCoordinates(closestFeature.getGeometry().getCoordinates());

            const pixel = self.parent.map.getPixelFromCoordinate(closestPoint);
            const distance = Math.sqrt(
                Math.pow(eventPixel[0] - pixel[0], 2) +
                Math.pow(eventPixel[1] - pixel[1], 2));

            if (distance > self.parent.snappingTolerance) {
                self.endSnap();
            } else {
                var coordinates = [coordinate, [closestPoint[0], closestPoint[1]]];

                if (!self.snapLine) self.snapLine = new Polyline(coordinates, {});
                else self.snapLine.wrap.feature.getGeometry().setCoordinates(coordinates);

                // información del punto
                if (!self.snapInfoElement)
                    self.snapInfoElement = document.getElementsByClassName('tc-ctl-geolocation-track-snap-info')[0];

                self.snapInfoElement.style.display = 'block';

                if (!self.snapInfo) {
                    self.snapInfo = new ol.Overlay({
                        element: self.snapInfoElement,
                        offset: [5, 18]
                    });

                    self.olMap.addOverlay(self.snapInfo);
                }

                if (self.snapInfo.getMap() == undefined)
                    self.snapInfo.setMap(self.olMap);

                self.snapInfo.setPosition(coordinate);

                var data = {};
                const geomType = closestFeature.getGeometry().getType();
                if (geomType != "LineString" && geomType != "MultiLineString") {
                    if (closestFeature.getKeys().indexOf('name') > -1)
                        data.n = closestFeature.get('name');
                }

                var locale = self.parent.map.options.locale && self.parent.map.options.locale.replace('_', '-') || undefined;
                data.x = self.map.wrap.isGeo() ? closestPoint[0].toLocaleString(locale, { minimumFractionDigits: 5 }) : Math.round(closestPoint[0]).toLocaleString(locale);
                data.y = self.map.wrap.isGeo() ? closestPoint[1].toLocaleString(locale, { minimumFractionDigits: 5 }) : Math.round(closestPoint[1]).toLocaleString(locale);

                if (self.map.wrap.isGeo()) {
                    data.isGeo = true;
                }

                var getZ = function (position) {
                    return closestPoint[position] ? (Math.round(closestPoint[position] * 100) / 100).toLocaleString(locale) : undefined;
                };
                var getM = function (position) {
                    return closestPoint[position] > 0 ? new Date(closestPoint[position]).toLocaleString(locale) : undefined;
                };

                const layout = closestFeature.getGeometry().getLayout();
                if (layout === ol.geom.GeometryLayout.XYZM) {
                    data.z = getZ(2);
                    data.m = getM(3);
                } else if (closestFeature.getGeometry().getLayout() === ol.geom.GeometryLayout.XYZ) {
                    data.z = getZ(2);
                } else if (closestFeature.getGeometry().getLayout() === ol.geom.GeometryLayout.XYM) {
                    data.m = getM(2);
                }

                if (data) {
                    // Z del MDT si hay datos del MDT
                    if (self.parent.elevationChartData && self.parent.elevationChartData.secondaryElevationProfileChartData[0] &&
                        self.parent.elevationChartData.secondaryElevationProfileChartData[0].eleCoordinates) {
                        let mdtClosestPoint = TC.wrap.Geometry.getNearest(coordinate, self.parent.elevationChartData.secondaryElevationProfileChartData[0].eleCoordinates);
                        const mdtZ = mdtClosestPoint[2]
                        data.mdtz = (Math.round(mdtZ * 100) / 100).toLocaleString(locale);
                    }
                    self.parent.getRenderedHtml(self.parent.CLASS + '-track-snapping-node', data, function (html) {
                        self.snapInfoElement.innerHTML = html;
                    });
                }
            }
        }
    }

    self.olMap.render();
};

TC.wrap.control.Geolocation.prototype.drawTrackData = async function (track) {
    const self = this;

    const featurePromises = [];

    const JSONParser = new TC.wrap.parser.JSON();
    const features = JSONParser.parser.readFeatures(track.data);

    features.filter(function (feature) {
        return feature.getGeometry().getType().toLowerCase() === 'linestring' || feature.getGeometry().getType().toLowerCase() === 'multilinestring';
    }).forEach(function (feature) {
        feature.getGeometry().setCoordinates(feature.getGeometry().getCoordinates(), track.layout);
    });

    self.activateSnapping.call(self);

    for (var i = 0, len = features.length; i < len; i++) {
        featurePromises.push(TC.wrap.Feature.createFeature(features[i]));
    }

    const feats = await Promise.all(featurePromises);
    feats.forEach(function (feat) {
        if (feat) {
            self.parent.trackLayer.addFeature(feat);
        }
    });
    if (!self.parent.toShare || self.parent.toShare && self.parent.toShare.doZoom) {
        self.parent.map.zoomToFeatures(self.parent.trackLayer.features);
    }
};

TC.wrap.control.Geolocation.prototype.formattedFromStorage = function (storageData) {
    const self = this;

    if (self.parent.storageCrs !== self.parent.map.crs) {
        var features = new ol.format.GeoJSON().readFeatures(storageData);
        if (features) {
            features = features.map(function (feature) {
                var clone = feature.clone();
                clone.getGeometry().transform(self.parent.storageCrs, self.parent.map.crs);
                clone.setId(feature.getId());
                return clone;
            });

            return new ol.format.GeoJSON().writeFeatures(features);
        }
    }

    return storageData;
};
TC.wrap.control.Geolocation.prototype.formattedToStorage = function (layer, removeTrackingProperty, notReproject) {
    var self = this;

    var parser = new TC.wrap.parser.JSON();
    parser = parser.parser;

    var features = layer.wrap.layer.getSource().getFeatures();
    var layout;

    features = features.map(function (feature) {
        const geometry = feature.getGeometry();
        if (geometry instanceof ol.geom.LineString || geometry instanceof ol.geom.MultiLineString) {
            layout = geometry.getLayout();
        }

        if (removeTrackingProperty && feature.getProperties().tracking) {
            feature.unset("tracking");
        }

        if (!notReproject && self.parent.map.crs !== self.parent.storageCrs) {
            var clone = feature.clone();
            clone.getGeometry().transform(self.parent.map.crs, self.parent.storageCrs);
            clone.setId(feature.getId());

            return clone;
        }

        return feature;
    }).sort(function (a, b) {

        if (a.getGeometry() instanceof ol.geom.Point &&
            !(b.getGeometry() instanceof ol.geom.Point)) {
            return -1;
        }

        if (b.getGeometry() instanceof ol.geom.Point &&
            !(a.getGeometry() instanceof ol.geom.Point)) {
            return 2;
        }

        if (a.getProperties().name < b.getProperties().name) { return -1; }
        if (a.getProperties().name > b.getProperties().name) { return 1; }

        return 0;
    });

    return {
        features: parser.writeFeatures(features), layout: layout
    };
};

TC.wrap.control.Geolocation.prototype.export = function (li) {
    const self = this;
    return new Promise(function (resolve, reject) {

        self.parent.getTrackData(li).then(function (data) {
            if (data) {

                var olFeatures = new ol.format.GeoJSON().readFeatures(data.data);

                if (olFeatures.length === 0) {
                    var geoJSON = self.parent.getTrackData(li);
                    olFeatures = new ol.format.GeoJSON().readFeatures(geoJSON);
                }

                Promise.all(olFeatures.map(function (feature) {
                    return TC.wrap.Feature.createFeature(feature);
                })).then((features) => {
                    resolve(features);
                });
            } else {
                reject();
            }
        });
    });
};

var segmentsUnion = function (lineStrings) {
    var mergedIndex = [];
    var coords = [];
    if (lineStrings.length > 1) {

        if (lineStrings[0].length === 4) {
            lineStrings = lineStrings.sort(function (a, b) {
                if (a[0][3] == b[0][3])
                    return 0;
                else if (a[0][3] < b[0][3])
                    return -1;
                else return 1;
            });
        }

        for (var ls = 0; ls < lineStrings.length; ls++) {
            var lineString = lineStrings[ls];
            var nextLineIndex = -1;
            var distance = Infinity;

            var last = lineString.getLastCoordinate();
            for (var nls = ls + 1; nls < lineStrings.length; nls++) {
                var first = lineStrings[nls].getFirstCoordinate();
                var d = Math.hypot(last[0] - first[0], last[1] - first[1]);
                if (d < distance) {
                    nextLineIndex = nls;
                    distance = d;
                }
            }

            if (mergedIndex.length < lineStrings.length) {
                if (mergedIndex.indexOf(ls) === -1) {
                    mergedIndex.push(ls);
                    coords = coords.concat(lineString.getCoordinates());
                }
                if (mergedIndex.indexOf(nextLineIndex) === -1) {
                    mergedIndex.push(nextLineIndex);
                    coords = coords.concat(lineStrings[nextLineIndex].getCoordinates());
                }
            }
        }

        //self.map.toast(self.parent.getLocaleString("geo.trk.simulateWarning"), { type: Consts.msgType.WARNING });

        return coords;
    }

    return lineStrings[0].getCoordinates();
};

TC.wrap.control.Geolocation.prototype.processImportedFeatures = function (options) {
    var self = this;

    var source = self.parent.trackLayer.wrap.layer.getSource();
    var fileName = self.parent.importedFileName;
    var names = [];
    var toAdd = [];
    var toRemove = [];
    var maybeRemove = [];
    var features = source.getFeatures();

    var segments = [];
    var coord = [];

    var getName = function (feature) {
        const properties = feature.getProperties();
        if (Object.prototype.hasOwnProperty.call(properties, "name")) {
            if (properties.name.trim().length > 0) {
                names.push(properties.name);
            }
            else {
                names.push(fileName);
            }
        }
        else {
            names.push(fileName);
        }
    };

    for (var f = 0; f < features.length; f++) {
        var feature = features[f];

        if (feature instanceof Feature_s)
            feature = features[f].wrap.feature;

        if (feature.getGeometry() instanceof ol.geom.Point) {
            coord.push(feature.getGeometry().getCoordinates());
            maybeRemove.push(feature);
        }
        else if (feature.getGeometry() instanceof ol.geom.LineString) {
            // GLS: 31/01/2018 Routes (<rte>) are converted into LineString geometries, and tracks (<trk>) into MultiLineString, por tanto, las líneas las cargamos como N Rutas, no las unimos como hasta ahora: // segments.push(feature.getGeometry());                
            getName(feature);
            const newFeature = new ol.Feature({
                geometry: new ol.geom.LineString(feature.getGeometry().getCoordinates(), feature.getGeometry().getLayout())
            });
            newFeature.setId(feature.getId() || TC.getUID());
            newFeature.setProperties(feature.getProperties());
            toAdd.push(newFeature);
            toRemove.push(feature);
        }
        else if (feature.getGeometry() instanceof ol.geom.MultiLineString) {
            var clone = feature.clone();
            getName(clone);

            var ls = clone.getGeometry().getLineStrings();

            const coords = segmentsUnion(ls);
            const newFeature = new ol.Feature({
                geometry: new ol.geom.LineString(coords, feature.getGeometry().getLayout())
            });
            newFeature.setId(feature.getId() || TC.getUID());
            newFeature.setProperties(feature.getProperties());
            toAdd.push(newFeature);
            toRemove.push(feature);
        }
    }

    if (segments.length > 0) {
        const coords = segmentsUnion(segments);
        toAdd.push(new ol.Feature({
            geometry: new ol.geom.LineString(coords)
        }));
    }

    if (coord.length > 0 && maybeRemove.length == features.length) {
        toAdd.push(new ol.Feature({
            geometry: new ol.geom.LineString(coord)
        }));
    }

    if (toRemove.length > 0) {
        for (var i = 0; i < toRemove.length; i++) {
            source.removeFeature(toRemove[i]);
        }
    }

    if (toAdd.length > 0) {
        var sameName = function (array, element) {
            var indices = [];
            var idx = array.indexOf(element);
            while (idx !== -1) {
                indices.push(idx);
                idx = array.indexOf(element, idx + 1);

                if (indices.length > 1)
                    return true;
            }

            return indices.length > 1 ? true : false;
        };

        var featureToAdd;
        var index = 0;
        var processAdd = function () {
            const promises = toAdd.map(function (_ta, idx) {
                return new Promise(function (resolve, _reject) {
                    if (featureToAdd) {
                        source.removeFeature(featureToAdd);
                    }

                    var name;
                    if (names.length > idx) {
                        name = names[idx];
                        if (sameName(names, name)) {
                            name = '[' + (idx + 1) + ']' + ' ' + name;
                        }
                    }

                    self.parent.importedFileName = name ? name : fileName;

                    featureToAdd = toAdd[idx];
                    source.addFeature(featureToAdd);

                    self.parent.saveTrack({
                        message: self.parent.getLocaleString('geo.trk.upload.ok', { trackName: name ? name : fileName }),
                        importedFileName: name ? name : fileName,
                        notReproject: options.notReproject,
                        fileHandle: options.fileHandle
                    }).then(function (importedIndex) {
                        if (idx === 0) {
                            index = importedIndex;
                        }
                        resolve();
                    });
                });
            });
            return Promise.all(promises);
        };
        processAdd().then(function () {

            self.parent.trackLayer.setVisibility(false);
            // la siguiente instrucción hace que se elimine del array de ids la línea y después no funciona la descarga de la feature.
            // 13/11/2020 recupero la instrucción: sin el borrado de features al compartir un track se queda la importada en 4326 y 
            // la nueva ya gestionada, con lo que el zoom a la feature no funciona como debe. Después de todos los cambios en la gestión de 
            // IDs de las features de los track no he conseguido reproducir el problema del anterior comentario.
            self.parent.trackLayer.clearFeatures();

            self.parent.trigger(self.parent.const.event.IMPORTEDTRACK, { index: index });

            delete self.parent.importedFileName;
            self.parent.getLoadingIndicator().removeWait(options.wait);
        });
    } else {

        if (self.parent.trackLayer) {
            self.parent.map.removeLayer(self.parent.trackLayer);
            self.parent.trackLayer = undefined;
        }

        delete self.parent.importedFileName;
        self.parent.getLoadingIndicator().removeWait(options.wait);
        TC.alert(self.parent.getLocaleString("geo.trk.upload.error4"));
    }
};

TC.wrap.control.Geolocation.prototype.import = function (wait, data, type) {
    var self = this;
    var vectorSource;
    var listenerKey;

    if (data && data.text) {

        var layerOptions = self.parent.trackLayer.wrap.createVectorSource({
            data: data.text,
            type: type
        });
        vectorSource = layerOptions.source;

        listenerKey = vectorSource.on('change', function (_e) {
            if (vectorSource.getState() === 'ready') {
                ol.Observable.unByKey(listenerKey);
                self.processImportedFeatures(wait);
            }
        });

        var olLayer = self.parent.trackLayer.wrap.layer;
        olLayer.setSource(vectorSource);

    } else {

        if (self.parent.trackLayer) {
            self.parent.map.removeLayer(self.parent.trackLayer);
            self.parent.trackLayer = undefined;
        }

        delete self.parent.importedFileName;
        self.parent.getLoadingIndicator().removeWait(wait);
        TC.alert(self.parent.getLocaleString("geo.trk.upload.error4"));
    }
};

var idRequestAnimationFrame;
TC.wrap.control.Geolocation.prototype.simulateTrackEnd = function (resized) {
    var self = this;

    if (!resized) {
        // revertimos: establecemos a false para que no muestra el progreso en el perfil ya que siempre será elevación 0
        self.hasElevation = true;
    }

    self.parent.clearChartProgress();

    if (self.simulateMarker) {
        window.cancelAnimationFrame(idRequestAnimationFrame);
        if (self.simulateMarker.layer.wrap.layer.getSource().getFeatures().length > 0)
            self.simulateMarker.layer.removeFeature(self.simulateMarker);

        delete self.simulateMarker;
    }
};

TC.wrap.control.Geolocation.prototype.simulateTrack = function () {
    var self = this;

    var coordinates;
    var features = self.parent.trackLayer.wrap.layer.getSource().getFeatures();
    for (var ls = 0; ls < features.length; ls++) {
        const geom = features[ls].getGeometry();
        if (geom instanceof ol.geom.LineString) {
            coordinates = features[ls].getGeometry().getCoordinates();
            break;
        }
        else if (geom instanceof ol.geom.MultiLineString) {
            coordinates = geom
                .getLineStrings()
                .map(ls => ls.getCoordinates())
                .flat();
        }
    }

    if (coordinates && coordinates.length > 0) {
        var first = coordinates[0];

        const setSimulateMarker = async function () {
            if (self.simulateMarker) {
                self.simulateMarker.setCoords(first.slice(0, 2));
            }
            else {
                self.simulateMarker = await self.parent.trackLayer.addPoint(first.slice(0, 2), {
                    radius: 7,
                    fillColor: '#ff0000',
                    fillOpacity: 0.5,
                    strokeColor: '#ffffff',
                    strokeWidth: 2
                });
            }

            return self.simulateMarker;
        };

        setSimulateMarker().then(function (_f) {

            var animationFrameFraction = function () {
                var start;
                var fraction;
                var hasTime = false;

                const toLength = function (coords) {
                    if (self.parent.map.crs !== self.parent.map.options.utmCrs) {
                        return TC.Util.reproject(coords, self.parent.map.crs, self.parent.map.options.utmCrs);
                    }

                    return coords;
                };

                var arCoordinates = coordinates;
                if (arCoordinates[0].length === 4 && arCoordinates[0][3] > 0) {
                    start = arCoordinates[0][3];
                    hasTime = true;
                } else {
                    arCoordinates[0][3] = Date.now();

                    for (var i = 1; i < arCoordinates.length; i++) {
                        let done;
                        arCoordinates[i][3] = 0;

                        if (i + 1 < arCoordinates.length) {
                            done = new ol.geom.LineString(toLength(arCoordinates.slice(i - 1, i + 1))).getLength();
                        } else {
                            done = new ol.geom.LineString(toLength(arCoordinates.slice(i - 1))).getLength();
                        }

                        arCoordinates[i][3] = arCoordinates[i - 1][3] + 3600000 * done / self.parent.walkingSpeed;
                    }

                    start = arCoordinates[0][3];
                }

                var trackFilm = new ol.geom.LineString(arCoordinates);
                var timestamp = start;
                var distance = 0;

                if (self.parent.map.crs !== self.parent.map.options.utmCrs) {
                    distance = new ol.geom.LineString(toLength(JSON.parse(JSON.stringify(arCoordinates)))).getLength();
                } else {
                    distance = trackFilm.getLength();
                }

                var getDoneAtM = function (m) {
                    for (var i = 0; i < arCoordinates.length; i++) {
                        if (arCoordinates[i][3] > m)
                            return {
                                d: new ol.geom.LineString(toLength(arCoordinates.slice(0, i))).getLength(),
                                p: arCoordinates[i - 1].slice(0, 2)
                            };
                    }
                };

                var loopAtFraction = function () {

                    if (!self.parent.simulate_paused) {
                        var position = trackFilm.getCoordinateAtM(timestamp);
                        var d = getDoneAtM(timestamp);

                        if (fraction >= 1 || !position || !d) {
                            var li = self.parent.getSelectedTrackItem();
                            if (li)
                                self.parent.uiSimulate(false, li);

                            if (self.parent.hasElevation) {
                                self.parent.clearChartProgress();
                            }

                            self.simulateTrackEnd();

                            return;
                        } else {

                            if (self.parent.hasElevation) {
                                self.parent.setChartProgress(d, position, distance, hasTime ? self.parent.getTimeInterval(arCoordinates[0][3], position[3]) : false);
                            }

                            if (self.simulateMarker) {
                                //var from = self.simulateMarker.getCoords();
                                //var to = position;
                                //var rotation = Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI;

                                self.simulateMarker.setCoords(position);
                                //self.simulateMarker.setStyle({ labelRotationKey: rotation });
                            }

                            if (self.parent.simulationSpeed !== 1) {
                                timestamp = timestamp + self.parent.delta * self.parent.simulationSpeed;
                            }
                            else {
                                timestamp = timestamp + self.parent.delta;
                            }
                        }
                    }

                    idRequestAnimationFrame = requestAnimationFrame(loopAtFraction);
                };
                idRequestAnimationFrame = requestAnimationFrame(loopAtFraction);

            };

            const hasD3 = async function () {
                if (window.d3) {
                    return true;
                }
                return await import('c3');
            };
            hasD3().then(function () {
                idRequestAnimationFrame = requestAnimationFrame(animationFrameFraction);
            });
        });
    }
};

TC.wrap.control.Geolocation.prototype.headingChangehandler = function (evt) {
    var self = this;
    if (!self.parent.track.infoOnMap) {
        self.parent.track.infoOnMap = document.createElement('div');
        const iomStyle = self.parent.track.infoOnMap.style;
        iomStyle.overFlowY = 'scroll';
        iomStyle.height = '200px';
        iomStyle.width = '200px';
        iomStyle.top = '0';
        iomStyle.left = '100px';
        iomStyle.backgroundColor = 'fuchsia';
        iomStyle.position = 'absolute';
        self.parent.map.div.appendChild(self.parent.track.infoOnMap);
    }

    self.parent.track.infoOnMap.style.display = '';

    self.heading = evt.target.getHeading();

    self.parent.track.infoOnMap.innerHTML = self.parent.track.infoOnMap.innerHTML +
        '<br> <p> salta headingChangehandler </p> <br> <p> evt.target.getHeading(): ' + self.heading + ' </p>';



    self.map.wrap.getMap().then(function (map) {
        map.getView().setRotation(-self.heading);
    });

    self.parent.trigger(self.parent.const.event.STATEUPDATED, {
        moving: (self.heading != undefined && self.heading > 0)
    });
};

TC.wrap.control.Geolocation.prototype.orientationChangehandler = function (event) {
    var self = this;

    var view = self.map.wrap.map.getView();
    var center = view.getCenter();
    var resolution = view.getResolution();
    var beta = event.target.getBeta() || 0;
    var gamma = event.target.getGamma() || 0;

    center[0] -= resolution * gamma * 25;
    center[1] += resolution * beta * 25;

    view.setCenter(view.constrainCenter(center));

    self.parent.trigger(self.parent.const.event.STATEUPDATED, {
        moving: (self.heading != undefined && self.heading > 0)
    });
};

TC.wrap.control.Geolocation.prototype.pulsate = function (circle) {
    var self = this;

    self.pulsated = true;

    var radius = circle.wrap.feature.getGeometry().getRadius();
    var start = new Date().getTime();

    var duration = 500;
    var listenerKey;

    var getRadius = function (elapsed) {
        switch (true) {
            case elapsed <= 50:
                return radius;
            case elapsed > 50 && elapsed <= 100:
                return radius * 1.02;
            case elapsed > 100 && elapsed <= 150:
                return radius * 1.05;
            case elapsed > 150 && elapsed <= 200:
                return radius * 1.02;
            case elapsed > 200 && elapsed <= 300:
                return radius;
            case elapsed > 300 && elapsed <= 350:
                return radius * 1.02;
            case elapsed > 350 && elapsed <= 400:
                return radius * 1.05;
            case elapsed > 400 && elapsed <= 450:
                return radius * 1.02;
            case elapsed > 450 && elapsed <= 500:
                return radius * 1;
            default:
                return radius;
        }
    };
    listenerKey = self.olMap.on(POSTRENDER, function (event) {
        var vectorContext = event.vectorContext;
        var frameState = event.frameState;

        var elapsed = frameState.time - start;

        var f = circle.wrap.feature.getGeometry().clone();
        var r = getRadius(elapsed);
        f.setRadius(r);

        vectorContext.setFillStrokeStyle(
            new ol.style.Fill({
                color: 'rgba(0, 0, 0, 0.1)'
            }),
            new ol.style.Stroke({
                color: 'rgba(255, 0, 0, .8)', width: 1
            })
        );
        vectorContext.drawCircleGeometry(f);

        if (elapsed > duration) {
            ol.Observable.unByKey(listenerKey);
            return;
        }

        frameState.animate = true;
    });
};

TC.wrap.control.ResultsPanel.prototype.register = function (map) {
    const self = this;
    self.map = map;

    map.wrap.getMap().then(function (olMap) {
        self.olMap = olMap;
    });
};

TC.wrap.control.ResultsPanel.prototype.showElevationMarker = function (options) {
    const self = this;
    options = options || {};
    const data = options.data;
    const layer = options.layer;
    const coords = options.coords;

    if (!self.elevationMarker) {
        const elm = document.createElement('div');
        elm.style.display = 'none';
        elm.classList.add(self.parent.CLASS + '-overlay', 'tc-elevation');
        self.elevationMarker = new ol.Overlay({
            id: 'ovElevationMarker',
            element: elm,
            offset: [0, 0],
            positioning: olOverlayPositioning.CENTER_CENTER,
            stopEvent: false
        });
    }

    // GLS: si la capa del track está visible mostramos marcamos punto del gráfico en el mapa
    if (!layer || layer.getVisibility() && layer.getOpacity() > 0) {
        let position = coords[data[0].index];
        if (self.parent.map.crs !== self.parent.map.options.utmCrs) {
            position = TC.Util.reproject(position, self.map.options.utmCrs, self.map.crs);
        }
        self.elevationMarker.getElement().style.display = '';
        if (!self.olMap.getOverlayById(self.elevationMarker.getId())) {
            self.olMap.addOverlay(self.elevationMarker);
            if (self.map.on3DView) {
                self.map.view3D.addElevationMarker(position, self.parent);
            }
        }
        self.elevationMarker.setPosition(position);
        if (self.map.on3DView) {
            self.map.view3D.setElevationMarker(position, self.parent);
        }
    }
};

TC.wrap.control.ResultsPanel.prototype.hideElevationMarker = function () {
    const self = this;
    if (self.elevationMarker) {
        self.elevationMarker.getElement().style.display = 'none';

        if (self.map.on3DView) {
            self.map.view3D.hideElevationMarker(self.parent);
        }
    }
};

TC.wrap.control.Coordinates.prototype.coordsActivate = async function () {
    var self = this;
    //URI en IOS se usa antes olMap de ser definido
    (self.olMap || await self.map.wrap.getMap()).on(CLICK, self._coordsTrigger);
};

TC.wrap.control.Coordinates.prototype.coordsDeactivate = function () {
    var self = this;

    self.olMap.un(CLICK, self._coordsTrigger);
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

TC.wrap.control.OverviewMap.prototype.register = async function (map) {
    const self = this;

    const olLayer = await self.parent.layer.wrap.getLayer();
    self.ovMap = new ol.control.OverviewMap({
        target: self.parent.div,
        collapsed: false,
        collapsible: false,
        className: self.parent.CLASS + ' ol-overviewmap',
        layers: [olLayer]
    });
    self.ovMap._wrap = self;

    /* 08/02/2019 GLS: 
        Establecemos el pixelRatio siempre a uno (aunque el control instancie un olMap internamente no admite el paso de la opción pixelRatio,
        imposible de entender, por eso lo hago directamente), porque OL sólo atiende al valor al principio,
        si después se hace zoom in/out del navegador, OL no atiende el cambio lo que provoca que el mapa se vea borroso, click se sitúa mal,
        popup se sitúa entre otros efectos.
        Lo gestionamos nosotros hasta que lo soporten del todo. Relacionado con las tareas/bugs:
            Bug 25976:Mapa situación en blanco
            Bug 25954:Canvas en blanco con zoom mayor al 100%
            Bug 23855:Mapa de situación se muestra en blanco
    */
    self.ovMap.getOverviewMap().pixelRatio_ = 1;

    //// Quitamos el drag&drop añadido en OL 4.1.0 machacando el overlay
    //self.ovMap.getOverviewMap().removeOverlay(self.ovMap.boxOverlay_);
    //var box = document.createElement('DIV');
    //box.className = 'ol-overviewmap-box';
    //box.style.boxSizing = 'border-box';
    //self.ovMap.boxOverlay_ = new ol.Overlay({
    //    position: [0, 0],
    //    positioning: olOverlayPositioning.CENTER_CENTER,
    //    element: box
    //});
    //self.ovMap.getOverviewMap().addOverlay(self.ovMap.boxOverlay_);

    // mantenemos el ancho y alto del canvas en números enteros
    self.manageSize.call(self.ovMap.getOverviewMap());

    self._boxElm = self.ovMap.boxOverlay_.getElement();

    const Draggabilly = (await import('draggabilly')).default;
    var ovmMap = self.ovMap.getOverviewMap();
    const drag = new Draggabilly(self._boxElm);
    // Parcheamos Draggabilly para que respete las otras transformaciones, por ejemplo rotación.
    drag.positionDrag = function () {
        const style = this.element.style;
        const newTransform = 'translate3d( ' + this.dragPoint.x +
            'px, ' + this.dragPoint.y + 'px, 0)';
        if (style.transform.length) {
            const idxStart = style.transform.indexOf('translate3d');
            if (idxStart >= 0) {
                const idxEnd = style.transform.indexOf(')', idxStart);
                style.transform = style.transform.replace(style.transform.substring(idxStart, idxEnd + 1), newTransform);
            }
            else {
                style.transform = newTransform + ' ' + style.transform;
            }
        }
        else {
            style.transform = newTransform;
        }
    };
    drag.on('pointerDown', function (_e) {
        drag.dragged = self._boxElm.cloneNode();
        drag.dragged.classList.add(Consts.classes.ACTIVE);
        drag.dragged.style.position = 'absolute';
        self._boxElm.insertAdjacentElement('beforebegin', drag.dragged);
        if (map.maxExtent) {
            var bottomLeft = ovmMap.getPixelFromCoordinate([map.maxExtent[0], map.maxExtent[1]]);
            var topRight = ovmMap.getPixelFromCoordinate([map.maxExtent[2], map.maxExtent[3]]);
            var mapSize = ovmMap.getSize();
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.bottom = Math.round(mapSize[1] - bottomLeft[1]) + 'px';
            container.style.left = Math.round(bottomLeft[0]) + 'px';
            container.style.top = Math.round(topRight[1]) + 'px';
            container.style.right = Math.round(mapSize[0] - topRight[0]) + 'px';
            const viewport = ovmMap.getViewport();
            viewport.insertBefore(container, viewport.firstElementChild);
            drag.options.containment = container;
        }
    });
    drag.on('pointerUp', function (_e) {
        drag.dragged.parentElement.removeChild(drag.dragged);
        if (map.maxExtent) {
            ovmMap.getViewport().removeChild(drag.options.containment);
            drag.options.containment = null;
        }
    });
    drag.on('dragMove', function (_e, _pointer, moveVector) {
        drag._delta = moveVector;
    });
    drag.on('dragEnd', function (_e, _pointer) {
        var olMap = self.ovMap.getMap();
        var view = olMap.getView();
        var centerPixel = ovmMap.getPixelFromCoordinate(view.getCenter());
        var newCenter = ovmMap.getCoordinateFromPixel([centerPixel[0] + drag._delta.x, centerPixel[1] + drag._delta.y]);
        var extent = map.getExtent();
        var halfWidth = (extent[2] - extent[0]) / 2;
        var halfHeight = (extent[3] - extent[1]) / 2;

        if (newCenter[0] + halfWidth > map.maxExtent[2]) {
            newCenter[0] = map.maxExtent[2] - halfWidth;
        }
        else if (newCenter[0] - halfWidth < map.maxExtent[0]) {
            newCenter[0] = map.maxExtent[0] + halfWidth;
        }
        if (newCenter[1] + halfHeight > map.maxExtent[3]) {
            newCenter[1] = map.maxExtent[3] - halfHeight;
        }
        else if (newCenter[1] - halfHeight < map.maxExtent[1]) {
            newCenter[1] = map.maxExtent[1] + halfHeight;
        }

        drag.setPosition(0, 0);
        delete drag._delta;
        map.setCenter(newCenter, { animate: true });
    });

    const olMap = await map.wrap.getMap();

    // Modificamos mapa para que tenga la proyección correcta
    self.reset();

    const load = self.parent.div.querySelector('.' + self.parent.CLASS + '-load');
    olLayer._wrap.$events.on(Consts.event.BEFORETILELOAD, function () {
        load.classList.remove(Consts.classes.HIDDEN);
        load.classList.add(Consts.classes.VISIBLE);
    });
    olLayer._wrap.$events.on(Consts.event.TILELOAD, function () {
        load.classList.remove(Consts.classes.VISIBLE);
        load.classList.add(Consts.classes.HIDDEN);
    });

    olMap.addControl(self.ovMap);

    self.parent.isLoaded = true;
    self.parent.trigger(Consts.event.MAPLOAD);

    return self;
};

TC.wrap.control.OverviewMap.prototype.reset = async function (options) {
    const self = this;
    const setLayer = async function (layer, crs) {
        if (layer.type === Consts.layerType.WMTS) {
            var layerProjectionOptions = { crs: crs || self.parent.map.crs, oldCrs: layer.wrap.layer.getSource().getProjection().getCode() }; // , allowFallbackLayer: true

            if (layerProjectionOptions.oldCrs !== layerProjectionOptions.crs) {
                layer.setProjection(layerProjectionOptions);
            }
        }

        const olLayer = await layer.wrap.getLayer();

        var olView = new ol.View(getResolutionOptions(self.parent.map.wrap, olLayer._wrap.parent));
        const olMap = self.ovMap.getOverviewMap();

        if (olView.getResolutions() || olView.getProjection().getCode() !== olMap.getView().getProjection().getCode()) {
            olMap.setView(olView);
        }

        // para controlar el mapa en blanco en IE en la carga inicial
        olLayer._wrap.$events.one(Consts.event.TILELOAD, function () {
            olMap.getLayers().getArray()[0].getSource().refresh();
        });

        if (layer !== self.parent.layer || olMap.getLayers().getArray().indexOf(layer) === -1) {

            self.parent.map.trigger(Consts.event.OVERVIEWBASELAYERCHANGE, { oldLayer: layer !== self.parent.layer ? self.parent.layer : null, newLayer: layer });
            olMap.getLayers().forEach(function (l) {
                if (l instanceof ol.layer.Image || l instanceof ol.layer.Tile) {
                    olMap.removeLayer(l);
                }
            });

            const load = self.parent.div.querySelector('.' + self.parent.CLASS + '-load');
            olLayer._wrap.$events.on(Consts.event.BEFORETILELOAD, function () {
                load.classList.remove(Consts.classes.HIDDEN);
                load.classList.add(Consts.classes.VISIBLE);
            });
            olLayer._wrap.$events.on(Consts.event.TILELOAD, function () {
                load.classList.remove(Consts.classes.VISIBLE);
                load.classList.add(Consts.classes.HIDDEN);
            });

            olMap.getLayers().insertAt(0, olLayer); // GLS: no usamos .addLayer(olLayer) para asegurar que la capa a añadir quede como fondo.
        }

        return layer;
    };

    options = options || {};
    var layer = options.layer || self.parent.layer;
    if (self.parent.map && layer && self.ovMap) {

        await layer.getCapabilitiesPromise();

        var originalLayer = layer;

        if (!layer.isCompatible(self.parent.map.crs) && layer.wrap.getCompatibleMatrixSets(self.parent.map.crs).length === 0) {
            layer = layer.getFallbackLayer() || self.parent.defaultLayer;

            await layer.getCapabilitiesPromise();
            if (self.parent.map.on3DView && !layer.isCompatible(self.parent.map.crs)) {
                const projList = await self.parent.map.loadProjections({
                    crsList: originalLayer.getCompatibleCRS(),
                    orderBy: 'name'
                })
                return await setLayer(originalLayer, projList[0].code);
            } else if (layer.isCompatible(self.parent.map.crs)) {
                return await setLayer(layer);
            }
        } else {
            return await setLayer(layer);
        }
    }
    return null;
};

TC.wrap.control.OverviewMap.prototype.get3DCameraLayer = function () {
    var self = this;
    var result = null;
    var camLayerId = '3DCamera';
    var ovMap;

    if (self.ovMap) {
        ovMap = self.ovMap.getOverviewMap();
        ovMap.getLayers().forEach(function (elm) {
            if (elm.get('id') === camLayerId) {
                result = elm;
            }
        });

        if (!result) {
            var fovStyle = createNativeStyle({});
            // Ponemos los cuadriláteros de fov sin relleno (por legibilidad)
            fovStyle[0].getFill().setColor([0, 0, 0, 0]);
            result = new ol.layer.Vector({
                id: camLayerId,
                source: new ol.source.Vector(),
                style: fovStyle
            });
            ovMap.addLayer(result);
        }
    }
    return result;
};

TC.wrap.control.OverviewMap.prototype.draw3DCamera = function (options) {
    var self = this;

    if (this.parent.map.isLoaded) {
        self.is3D = !!options;
        var camLayer = self.get3DCameraLayer();
        if (camLayer) {
            var feature;
            options = options || {};
            var fov = options.fov;
            var source = camLayer.getSource();
            if (!fov || !fov.length) { // no vemos terreno o no estamos en vista 3D
                source.clear();
            }
            else {
                var features = source.getFeatures();
                if (!features.length) {
                    feature = new ol.Feature();
                    source.addFeature(feature);
                }
                else {
                    feature = features[0];
                }
                feature.setGeometry(new ol.geom.Polygon([fov]));
            }
            var heading = typeof options.heading === 'number' ? options.heading : 0;
            self._boxElm.style.transform = 'rotate(' + heading + 'rad)';
        }
    }
};

TC.wrap.control.OverviewMap.prototype.enable = function () {
    var self = this;
    if (self.parent.layer && self.parent.layer.setVisibility) {
        self.parent.layer.setVisibility(true);

        /* GLS: bug 23855: mapa de situación se muestra en blanco
            En el resize se valida el alto y el ancho y como el div padre (id = "ovmap") tiene display: none, 
            el ancho y el alto devuelven cero y por ello se muestra en blanco. 
            No vale con lanzar .trigger('resize') porque no utiliza los valores actuales del div, 
            sino los almacenados, por eso llamamos a updateSize que actualiza dichos valores.
            https://tfsapp.tracasa.es:8088/tfs/web/wi.aspx?pcguid=4819cc6e-400e-4f70-ba7c-c18a830405aa&id=23855                
        */
        self.parent.wrap.ovMap.getOverviewMap().updateSize();

        // Lo siguiente es para actualizar mapa de situación
        const resizeEvent = document.createEvent('HTMLEvents');
        resizeEvent.initEvent('resize', false, false);
        self.parent.map.div.dispatchEvent(resizeEvent);
    }
    self.ovMap.resetExtent_();
};

TC.wrap.control.OverviewMap.prototype.disable = function () {
    var self = this;
    if (self.parent.layer && self.parent.layer.setVisibility) {
        self.parent.layer.setVisibility(false);
    }
};

TC.wrap.control.OverviewMap.prototype.manageSize = function () {
    const self = this;

    TC.wrap.Map.prototype.manageSize.call(self);
};

TC.wrap.control.FeatureInfo.prototype.register = function (map) {
    var self = this;
    map.wrap.getMap().then(function (_olMap) {
        TC.wrap.control.Click.prototype.register.call(self, map);
        var _clickTrigger = self._trigger;
        self._trigger = function (e) {
            var result = _clickTrigger.call(self, e);
            if (result) {
                self.parent.beforeRequest({ xy: e.pixel });
            }
            else {
                map.trigger(Consts.event.NOFEATUREINFO, { control: self.parent });
            }
            return result;
        };
    });
};

var bufferElm;
var getElementText = function (elm) {
    var text = elm.innerHTML || elm.textContent;
    bufferElm = bufferElm || document.createElement("textarea");
    bufferElm.innerHTML = text;
    return bufferElm.value;
};

var esriXmlParser = {
    readFeatures: function (text) {
        var result = [];
        var dom = (new DOMParser()).parseFromString(text, 'text/xml');
        if (dom.documentElement.tagName === 'FeatureInfoResponse') {
            var fiCollections = dom.documentElement.getElementsByTagName('FeatureInfoCollection');
            for (var i = 0, len = fiCollections.length; i < len; i++) {
                var fic = fiCollections[i];
                var layerName = fic.getAttribute('layername');
                var fInfos = fic.getElementsByTagName('FeatureInfo');
                for (var j = 0, lenj = fInfos.length; j < lenj; j++) {
                    var fields = fInfos[j].getElementsByTagName('Field');
                    var attributes = {
                    };
                    for (var k = 0, lenk = fields.length; k < lenk; k++) {
                        var field = fields[k];
                        attributes[getElementText(field.getElementsByTagName('FieldName')[0])] = getElementText(field.getElementsByTagName('FieldValue')[0]);
                    }
                    var feature = new ol.Feature(attributes);
                    feature.setId(layerName + '.' + TC.getUID());
                    result.push(feature);
                }
            }
        }
        return result;
    }
};

var addLayerToService = function (service, layer, name) {
    var path = layer.getPath(name);
    service.layers.push({
        name: name,
        title: path[path.length - 1],
        path: path.slice(1),
        features: [],
        filter: layer.filter
    });
};

TC.wrap.control.FeatureInfo.prototype.getFeatureInfo = function (coords, resolution, options) {
    var self = this;
    var opts = options || {};
    var map = self.parent.map;
    return new Promise(function (resolve, _reject) {
        map.wrap.getMap().then(function (olMap) {
            var targetServices = {};
            var auxInfo = {};
            const requestPromises = [];
            const requestDataArray = [];
            var featurePromises = [];
            var services = [];

            //var infoFormats = [];
            var layers = olMap.getLayers().getArray();

            // GLS: filtro el array de capas para quedarnos con las capas que son raster y visibles.
            layers = layers.filter(function (elem) { return elem instanceof ol.layer.Image && elem.getVisible(); });

            for (var j = 0; j < layers.length; j++) {
                var olLayer = layers[j];
                var layer = olLayer._wrap.parent;
                const source = olLayer.getSource();
                //console.log("Source: " + layer.layerNames.join(","));
                //Por qué en workLayers están el vectorial de medición, y cosas así?
                if (source.getFeatureInfoUrl && map.workLayers.indexOf(layer) >= 0 && layer.names.length > 0
                    && (!opts.serviceUrl || opts.serviceUrl === layer.url)) { // Mirar si en las opciones pone que solo busque en un servicio

                    //
                    let targetService;
                    if (!targetServices[layer.url]) {
                        targetService = {
                            url: layer.url,
                            layers: [],
                            mapLayers: [],
                            title: layer.title,
                            request: null
                        };
                        targetServices[layer.url] = targetService;
                        auxInfo[layer.url] = {
                            source: TC.Util.extend(true, {}, source),
                            layers: []
                        };
                    }
                    else {

                        targetService = targetServices[layer.url];
                        auxInfo[layer.url].source.updateParams(TC.Util.extend(auxInfo[layer.url].source.getParams(), source.getParams()));
                    }
                    targetService.mapLayers.push(layer);

                    //var targetService = {
                    //    layers: [], mapLayers: [layer]
                    //};
                    var disgregatedNames = layer.getDisgregatedLayerNames();
                    if (opts.layerName) { // Mirar si en las opciones pone que solo busque en una capa
                        if (disgregatedNames.indexOf(opts.layerName) >= 0 && olLayer._wrap.getInfo(opts.layerName).queryable) {
                            addLayerToService(targetService, layer, opts.layerName);
                            auxInfo[layer.url].layers.push(opts.layerName);
                        }
                    }
                    else {
                        for (var i = 0; i < disgregatedNames.length; i++) {
                            var name = disgregatedNames[i];
                            if (olLayer._wrap.getInfo(name).queryable) {
                                addLayerToService(targetService, layer, name);
                            }
                            else {
                                TC.Util.consoleRegister('Capa "' + disgregatedNames[i] + '" no queryable, la eliminamos de la petición GFI');
                                disgregatedNames.splice(i, 1);
                                i = i - 1;
                            }

                        }

                        // GLS: validamos si nos queda alguna capa a la cual consultar
                        if (disgregatedNames.length > 0) {
                            auxInfo[layer.url].layers = auxInfo[layer.url].layers.concat(disgregatedNames);
                        }
                    }
                }
            }
            const _isGMLFilter = function (filter) {
                return filter && (/<ogc:Filter.*<\/ogc:Filter>/.test(filter) || filter instanceof TC.filter.Filter);
            };
            for (var serviceUrl in targetServices) {
                services.push(targetServices[serviceUrl]);
                const targetService = targetServices[serviceUrl];
                const source = auxInfo[serviceUrl].source;
                const serviceLayers = auxInfo[serviceUrl].layers;

                // GLS: validamos si hay capas a las cuales consultar, si no hay continuamos con el siguiente servicio
                if (!serviceLayers || serviceLayers.length === 0) {
                    continue;
                }

                var params = source.getParams();
                if (params.filter) params.filter = targetService.layers.map(function (i) { return "(" + (!_isGMLFilter(i.filter) ? "" : i.filter instanceof TC.filter.Filter ? i.filter.getText() : i.filter) + ")"; }).join("");
                if (params.cql_filter) params.cql_filter = targetService.layers.map(function (i) { return !i.filter || _isGMLFilter(i.filter) ? "INCLUDE" : i.filter; }).join(";");
                source.params_.LAYERS = serviceLayers.join(',');
                var gfiURL = source.getFeatureInfoUrl(coords, resolution, map.crs, {
                    'QUERY_LAYERS': serviceLayers.join(','),
                    'INFO_FORMAT': params.INFO_FORMAT,
                    'FEATURE_COUNT': 1000,
                    'radius': map.options.pixelTolerance,
                    'buffer': map.options.pixelTolerance
                });

                gfiURL = gfiURL.replace(/sld_body=[a-zA-Z%0-9._]*/); // Quitamos el parámetro sld_body


                var expUrl = gfiURL;
                const requestData = {
                    serviceUrl: serviceUrl,
                    requestedFormat: params.INFO_FORMAT,
                    expandUrl: expUrl
                };
                requestDataArray.push(requestData);
                requestPromises.push(new Promise(function (resolve, reject) {
                    const mapLayer = targetService.mapLayers[0];
                    mapLayer.proxificationTool.fetch(gfiURL)
                        .then(function (data) {
                            mapLayer.proxificationTool.cacheHost.getAction(requestData.expandUrl).then(function (cache) {
                                requestData.originalUrl = cache.action.call(mapLayer.proxificationTool, requestData.expandUrl);
                                resolve(TC.Util.extend({}, data, requestData));
                            });
                        })
                        .catch(function (error) {
                            reject(Error(error));
                        });
                }));
                TC.Util.consoleRegister("Lanzamos GFI");
            }

            if (requestPromises.length > 0) {
                Promise.all(requestPromises).then(function (responses) {
                    var someSuccess = false;
                    var featureCount = 0;
                    var featureInsertionPoints = [];
                    for (var i = 0; i < responses.length; i++) {
                        var featureInfo = responses[i];
                        var service = targetServices[requestDataArray[i].serviceUrl];
                        someSuccess = true;
                        service.text = featureInfo.responseText;
                        var format;
                        var iFormat = featureInfo.contentType;
                        if (iFormat && iFormat.indexOf(";") > -1)
                            iFormat = iFormat.substr(0, iFormat.indexOf(";")).trim();

                        if (!iFormat) iFormat = featureInfo.requestedFormat;

                        if (iFormat === featureInfo.requestedFormat) {
                            switch (iFormat) {
                                case 'application/json':
                                    format = new ol.format.GeoJSON();
                                    break;
                                case 'application/vnd.ogc.gml':
                                    if (featureInfo.responseText.indexOf("FeatureCollection") > -1) {
                                        format = new ol.format.WFS({
                                            gmlFormat: new ol.format.GML2({
                                                srsName: map.crs
                                            })
                                        });
                                    }
                                    else {
                                        format = new ol.format.WMSGetFeatureInfo();
                                    }
                                    break;
                                case 'application/vnd.ogc.gml/3.1.1':
                                    format = new ol.format.GML3({
                                        srsName: map.crs
                                    });
                                    break;
                                case 'application/vnd.esri.wms_featureinfo_xml':
                                    format = esriXmlParser;
                                    break;
                                default:
                                    format = null;
                                    break;
                            }

                            if (format) {
                                var features;
                                try {
                                    features = format.readFeatures(featureInfo.responseText, {
                                        featureProjection: ol.proj.get(map.crs)
                                    });
                                }
                                catch (e) {
                                    TC.error(self.parent.getLocaleString('featureInfo.error.badResponse', { url: featureInfo.serviceUrl }) + ': ' + e.message);
                                    features = [];
                                    continue;
                                }
                                featureCount = featureCount + features.length;
                                var isParentOrSame = function (layer, na, nb) {
                                    var result = false;
                                    if (na === nb) {
                                        result = true;
                                    }
                                    else {
                                        var pa = layer.getNodePath(na);
                                        var pb = layer.getNodePath(nb);
                                        if (pa.length > 0 && pb.length >= pa.length) {
                                            result = true;
                                            for (var i = 0; i < pa.length; i++) {
                                                if (layer.wrap.getName(pa[i]) !== layer.wrap.getName(pb[i])) {
                                                    result = false;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    return result;
                                };

                                var fakeLayers = {
                                };

                                for (var j = 0; j < features.length; j++) {
                                    var feature = features[j];
                                    if (feature instanceof ol.Feature) {
                                        var fid = feature.getId() || TC.getUID();
                                        var found = false;
                                        var layerName = fid.substr(0, fid.lastIndexOf('.'));
                                        for (var k = 0; k < service.layers.length; k++) {
                                            var l = service.layers[k];
                                            var lName = l.name.substr(l.name.indexOf(':') + 1);
                                            if (service.mapLayers.some(mapLayer => isParentOrSame(mapLayer, lName, layerName))) {
                                                found = true;
                                                if (!opts.featureId || feature.getId() === opts.featureId) { // Mirar si en las opciones pone que solo busque una feature
                                                    featurePromises.push(TC.wrap.Feature.createFeature(feature, { showsPopup: false }));
                                                    featureInsertionPoints.push(l.features);
                                                }
                                                break;
                                            }
                                        }

                                        //si llegamos aquí y no he encontrado su layer, es que no cuadraba el prefijo del fid con el id del layer
                                        //esto pasa, p.ej, en cartociudad
                                        if (!found) {
                                            //así que creo un layer de palo para la respuesta del featInfo
                                            var fakeLayer;
                                            if (fakeLayers[layerName]) fakeLayer = fakeLayers[layerName];
                                            else {
                                                fakeLayer = {
                                                    name: layerName, title: layerName, path: [layerName], features: []
                                                };
                                                fakeLayers[layerName] = fakeLayer;
                                                service.layers.push(fakeLayer);
                                            }

                                            if (!opts.featureId || feature.getId() === opts.featureId) { // Mirar si en las opciones pone que solo busque una feature
                                                featurePromises.push(TC.wrap.Feature.createFeature(feature, { showsPopup: false }));
                                                featureInsertionPoints.push(fakeLayer.features);
                                            }
                                        }
                                    }
                                }//iteración sobre las features de esta respuesta


                            }
                            else {
                                //si no hay formato reconocido y parseable, metemos un iframe con la respuesta
                                //y prau
                                //para eso, creo una falsa entrada de tipo feature, con un campo especial rawUrl o rawContent

                                const compoundLayer = {
                                    name: 'layer' + TC.getUID(), title: 'Datos en el punto', features: [{
                                        rawUrl: featureInfo.originalUrl, expandUrl: featureInfo.expandUrl, rawContent: featureInfo.responseText, rawFormat: iFormat
                                    }]
                                };

                                service.layers.push(compoundLayer);
                                featureCount = featureCount + 1;
                            }
                        }
                        else { // iFormat !== featureInfo.requestedFormat

                            // GLS:
                            TC.Util.consoleRegister("Respuesta GFI: lo más probable es que el servidor esté devolviendo una excepción");
                            TC.Util.consoleRegister("Lanzamos los eventos que corresponde y mostramos tostada");

                            // En este caso lo más probable es que el servidor esté devolviendo una excepción
                            self.parent.responseError({
                                message: featureInfo.responseText,
                                status: featureInfo.status
                            });
                            // GLS: misma gestión de error que en ol.js - > function (a, b, c) { // error...
                            map.toast(self.parent.getLocaleString('featureInfo.error'), {
                                type: Consts.msgType.ERROR
                            });
                        }

                    }
                    if (someSuccess) {
                        Promise.all(featurePromises).then(function afterFeatureInfoPromises(features) {
                            var defaultFeature;
                            features.forEach(function (feat, idx) {
                                feat.attributes = [];
                                for (var key in feat.data) {
                                    var value = feat.data[key];
                                    if (typeof value !== 'object') {
                                        feat.attributes.push({
                                            name: key,
                                            value: typeof value === "number" ? value.toLocaleString(TC.Util.getMapLocale(self.parent.map)) : value
                                        });
                                    }
                                    else {
                                        feat.attributes.push({
                                            name: key,
                                            value: value//"objeto complejo"
                                        });
                                    }
                                }
                                if (!defaultFeature && TC.Geometry.isInside(coords, feat.geometry)) {
                                    defaultFeature = feat;
                                }
                                const featureInsertionPoint = featureInsertionPoints[idx];
                                // Añadimos la feature si no ha sido ya añadida (por ejemplo porque hay dos capas en el 
                                // mapa que tienen features coincidentes)
                                if (!featureInsertionPoint.some(f => f.id === feat.id)) {
                                    featureInsertionPoint.push(feat);
                                }
                            });

                            var services = [];
                            for (let serviceUrl in targetServices) {
                                if (Object.prototype.hasOwnProperty.call(targetServices, serviceUrl)) {
                                    services.push(targetServices[serviceUrl]);
                                }
                            }

                            self.parent.responseCallback({
                                coords: coords,
                                resolution: resolution,
                                services: services,
                                featureCount: featureCount,
                                defaultFeature: defaultFeature
                            });
                            resolve();
                        });
                    }
                    else {
                        resolve();
                    }
                },
                    function (_a, _b, _c) { // error
                        if (services && services.length === 0) {
                            for (let serviceUrl in targetServices) {
                                services.push(targetServices[serviceUrl]);
                            }
                        }

                        self.parent.responseCallback({
                            coords: coords, resolution: resolution, services: services, featureCount: 0
                        });
                        map.toast(self.parent.getLocaleString('featureInfo.error'), {
                            type: Consts.msgType.ERROR
                        });
                        resolve();
                    });
            }
            else {

                if (map.workLayers.filter(function (layer) {
                    return layer instanceof TC.layer.Raster;
                }).length > 0) {
                    map.toast(self.parent.getLocaleString('featureInfo.notQueryableLayers'), {
                        type: Consts.msgType.INFO
                    });
                }

                if (services && services.length === 0) {
                    for (let serviceUrl in targetServices) {
                        services.push(targetServices[serviceUrl]);
                    }
                }

                // GLS: nos suscribimos Consts.event.BEFOREFEATUREINFO y lanzamos el mismo evento de zero resultados ya que puede darse que la resolución se lance antes del before.
                map.on(Consts.event.BEFOREFEATUREINFO, function () {
                    self.parent.responseCallback({
                        coords: coords, resolution: resolution, services: services, featureCount: 0
                    });
                });

                self.parent.responseCallback({
                    coords: coords, resolution: resolution, services: services, featureCount: 0
                });
                resolve();
            }
        });
    });
};

TC.wrap.control.GeometryFeatureInfo.prototype.register = function (map) {
    var self = this;
    map.wrap.getMap().then(function (_olMap) {
        TC.wrap.control.Click.prototype.register.call(self, map);
        var _clickTrigger = self._trigger;
        self._trigger = function (e) {
            self.hasSuitableLayers().then(function (hasLayers) {
                if (hasLayers) {
                    if (!self.parent._isSearching) {
                        if (e.type === SINGLECLICK && !self.parent._isDrawing && !self.parent._isSearching) {
                            _clickTrigger.call(self, e);
                        }
                    }
                }
            });
        };

    });
};

TC.wrap.control.GeometryFeatureInfo.prototype.hasSuitableLayers = async function () {
    const self = this;
    const map = self.parent.map;
    var ret = false;
    const olMap = await map.wrap.getMap();
    olMap.getLayers().forEach(function (olLayer) {
        var layer = olLayer._wrap.parent;
        var source = olLayer.getSource();
        //Por qué en workLayers están el vectorial de medición, y cosas así?
        if (source.getFeatureInfoUrl && map.workLayers.indexOf(layer) >= 0) {
            ret = true;
            return false;   //break del foreach
        }
    });
    return ret;
};

TC.wrap.control.GeometryFeatureInfo.prototype.beginDraw = function (options) {
    var self = this;
    options = options || {};
    var xy = options.xy;
    var layer = options.layer || self.parent.filterLayer;
    var callback = options.callback;
    var geometryType = options.geometryType;
    var semaforo = false;
    if (!self.drawCtrl) {
        layer.wrap.getLayer().then(function (olLayer) {
            let olGeomType;
            switch (geometryType) {
                case Consts.geom.POLYLINE:
                    olGeomType = olGeometryType.LINE_STRING;
                    break;
                default:
                    olGeomType = olGeometryType.POLYGON;
                    break;
            }
            const layerStyle = olLayer.getStyle();
            // Si la geometría es del tipo correcto, cogemos el estilo de la capa
            const styleFunction = function (olFeature) {
                if (olFeature && olFeature.getGeometry().getType() === olGeomType) {
                    if (TC.Util.isFunction(layerStyle)) {
                        return layerStyle(olFeature);
                    }
                    return layerStyle;
                }
                return null;
            };
            self.drawCtrl = new ol.interaction.Draw({
                source: olLayer.getSource(),
                type: olGeomType,
                style: styleFunction
            });
            var setShowsPopup = function (wrap) {
                wrap.parent.showsPopup = false;
            };
            olLayer.getSource().on(ADDFEATURE, function (event) {
                const olFeat = event.feature;
                if (olFeat._wrap) {
                    setShowsPopup(olFeat._wrap);
                }
                else {
                    TC.wrap.Feature.createFeature(olFeat).then(f => setShowsPopup(f.wrap));
                }
            });
            self.drawCtrl.handleEvent = function (event) {
                //esta ñapa para solucionar cuando haces un primer punto y acontinuación otro muy rápido
                if (event.type === SINGLECLICK) {
                    var points = olGeomType === olGeometryType.POLYGON ? this.sketchCoords_[0] : this.sketchCoords_;
                    if (semaforo && points.length === 2 && this.sketchFeature_ !== null) {// GLS: Añado la misma validación (this.sketchFeature_ !== null) que tiene el código de OL antes de invocar addToDrawing_ 
                        this.addToDrawing_(event);
                    }
                    else {
                        semaforo = true;
                    }
                }
                return ol.interaction.Draw.prototype.handleEvent.call(this, event);
            };
            const map = self.parent.map;
            const olMap = map.wrap.map;
            olMap.addInteraction(self.drawCtrl);
            self.drawCtrl.on('drawstart', function (_event) {
                self.parent._isDrawing = true;
                olMap.getInteractions().forEach(function (item, _i) {
                    if (item instanceof ol.interaction.DoubleClickZoom) {
                        item.setActive(false);
                    }
                });
            });
            self.drawCtrl.startDrawing_(xy);
            self.drawCtrl.on('drawend', function (event) {
                self.parent._isDrawing = false;
                olMap.getInteractions().forEach(function (item, _i) {
                    if (item instanceof ol.interaction.DoubleClickZoom) {
                        item.setActive(false);
                    }
                });
                olMap.removeInteraction(self.drawCtrl);
                this.setActive(false);
                self.drawCtrl = null;
                olLayer.getSource().clear();
                self.parent._drawToken = true;
                setTimeout(function () {
                    self.parent._drawToken = false;
                }, 500);
                event.feature.setId(self.parent.getUID());

                TC.wrap.Feature.createFeature(event.feature, { showsPopup: false }).then(function (feat) {
                    self.parent.filterFeature = feat;
                    feat.layer = self.parent.filterLayer;
                    if (callback) {
                        callback(feat);
                    }
                });
            });
        });

    }
    else {
        self.drawCtrl.setActive(true);
        self.drawCtrl.startDrawing_(xy);
    }
};

TC.wrap.control.GeometryFeatureInfo.prototype.cancelDraw = function (_xy, _layer, _callback) {
    var self = this;
    if (self.drawCtrl && self.parent._isDrawing) {
        self.parent._isDrawing = false;
        self.drawCtrl.setActive(false);
        self.drawCtrl.source_.clear();

    }
};

var readFeaturesFromResponse = function (map, data, contentType) {
    var format;
    var iFormat = contentType;
    if (iFormat && iFormat.indexOf(";") > -1)
        iFormat = iFormat.substr(0, iFormat.indexOf(";")).trim();

    if (!iFormat) iFormat = data.requestedFormat;
    switch (iFormat) {
        case 'application/json':
            format = new ol.format.GeoJSON();
            break;
        case 'application/vnd.ogc.gml':
            if (data.responseText.indexOf("FeatureCollection") > -1)
                format = new ol.format.WFS({
                    gmlFormat: new ol.format.GML2({
                        srsName: map.crs
                    })
                });
            else
                format = new ol.format.WMSGetFeatureInfo();
            break;
        case 'application/vnd.ogc.gml/3.1.1':
            format = new ol.format.GML3({
                srsName: map.crs
            });
            break;
        case "text/xml":
        case "application/xml": {
            //posible error
            const exception = data.querySelector("ServiceException");
            if (exception)
                TC.error(exception);
            format = null;
            break;
        }
        default:
            format = null;
            break;
    }
    if (format) {
        return format.readFeatures(data, {
            featureProjection: ol.proj.get(map.crs)
        });
    }
    else {
        return null;
        ////si no hay formato reconocido y parseable, metemos un iframe con la respuesta
        ////y prau
        ////para eso, creo una falsa entrada de tipo feature, con un campo especial rawUrl o rawContent
        //var l = service.layers[0];
        //l.features.push({
        //    error: response.responseText
        //});
    }
};
var featureToServiceDistributor = async function (features, service) {
    var featurePromises = [];
    var featureInsertionPoints = [];
    var isParentOrSame = function (layer, na, nb) {
        var result = false;
        if (na === nb || na.indexOf(nb) === 0) {
            result = true;
        }
        else {
            var pa = layer.getPath(na);
            var pb = layer.getPath(nb);
            if (pa.length > 0 && pb.length >= pa.length) {
                result = true;
                for (var i = 0; i < pa.length; i++) {
                    if (pa[i] !== pb[i]) {
                        result = false;
                        break;
                    }
                }
            }
        }
        return result;
    };

    var fakeLayers = {};
    for (var j = 0; j < features.length; j++) {
        var feature = features[j];
        if (feature instanceof ol.Feature) {
            var fid = feature.getId() || TC.getUID();
            var found = false;
            var layerName = fid.substr(0, fid.lastIndexOf('.'));
            for (var k = 0; k < service.layers.length; k++) {
                var l = service.layers[k];
                var lName = l.name.substr(l.name.indexOf(':') + 1);
                if (service.mapLayers.some(mapLayer => isParentOrSame(mapLayer, lName, layerName))) {
                    found = true;
                    featurePromises.push(TC.wrap.Feature.createFeature(feature));

                    featureInsertionPoints[feature.id_] = l.features;
                    break;
                }
            }

            //si llegamos aqu\u00ed y no he encontrado su layer, es que no cuadraba el prefijo del fid con el id del layer
            //esto pasa, p.ej, en cartociudad
            if (!found) {
                //as\u00ed que creo un layer de palo para la respuesta del featInfo
                var fakeLayer;
                if (fakeLayers[layerName]) fakeLayer = fakeLayers[layerName];
                else {
                    fakeLayer = {
                        name: layerName, title: layerName, features: []
                    };
                    fakeLayers[layerName] = fakeLayer;
                    service.layers.push(fakeLayer);
                }

                featurePromises.push(TC.wrap.Feature.createFeature(feature));
                featureInsertionPoints.push(feature.id_);
            }
        }
    }//iteraci\u00f3n sobre las features de esta respuesta

    const apiFeatures = await Promise.all(featurePromises);
    apiFeatures.forEach(function (feat) {
        feat.attributes = [];
        //feat.showsPopup = false;
        for (var key in feat.data) {
            var value = feat.data[key];
            if (typeof value !== 'object') {
                feat.attributes.push({
                    name: key, value: value
                });
            }
            else {
                feat.attributes.push({
                    name: key,
                    value: value//"objeto complejo"
                });
            }
        }
        featureInsertionPoints[feat.id].push(feat);
    });
    return {
        service: service
    };
};

TC.wrap.control.GeometryFeatureInfo.prototype.getFeaturesByGeometry = function (feature, xy) {

    var self = this;
    return new Promise(function (resolve, _reject) {
        var map = self.parent.map;

        map.wrap.getMap().then(function (olMap) {

            var olGeometry = feature.wrap.feature.getGeometry();
            var stride = olGeometry.stride;
            var flatCoordinates = olGeometry.getFlatCoordinates();
            //calcular el punto mas alto
            if (!xy) {
                var bestPoint = null;
                for (var i = 1, len = flatCoordinates.length; i < len; i += stride) {
                    if (!bestPoint || bestPoint[1] < flatCoordinates[i]) {
                        bestPoint = [flatCoordinates[i - 1], flatCoordinates[i]];
                    }
                }
                xy = olMap.getPixelFromCoordinate(new ol.geom.Point(bestPoint).getCoordinates());
            }

            self.parent.beforeRequest({ xy: xy });

            var arrRequests = map.extractFeatures({ filter: new TC.filter.intersects(feature, map.crs), outputFormat: Consts.format.JSON });

            const arrPromises = [];
            Promise.all(arrRequests).then(function (responses) {
                var targetServices = [];
                var featureCount = 0;

                for (var i = 0; i < responses.length; i++) {
                    const responseObj = responses[i];
                    if (!responseObj) continue;
                    arrPromises.push(new Promise(function (res, _rej) {
                        if (responseObj.errors && responseObj.errors.length) {
                            for (var j = 0; j < responseObj.errors.length; j++) {
                                var errorMsg, errorType = Consts.msgType.WARNING;
                                var error = responseObj.errors[j];
                                switch (error.key) {
                                    case Consts.WFSErrors.MAX_NUM_FEATURES:
                                        errorMsg = self.parent.getLocaleString("wfs.tooManyFeatures", error.params);
                                        break;
                                    /*case Consts.WFSErrors.NO_LAYERS:
                                        errorMsg = self.parent.getLocaleString('noLayersLoaded');
                                    break;*/
                                    case Consts.WFSErrors.GETCAPABILITIES:
                                        errorMsg = self.parent.getLocaleString('wfsGFI.inValidService', error.params);
                                        break;
                                    case Consts.WFSErrors.NO_FEATURES:
                                        //si no hay features nos callamos. Quizas en un futuro se muestre una alerta
                                        continue;
                                        break;
                                    case Consts.WFSErrors.INDETERMINATE:
                                        errorMsg = self.parent.getLocaleString("wfs.IndeterminateError");
                                        TC.error("Error:{error} \r\n Descripcion:{descripcion} \r\n Servicio:{serviceName}".format({ error: error.params.err, descripcion: error.params.errorThrown, serviceName: error.params.serviceTitle }), Consts.msgErrorMode.CONSOLE);
                                        errorType = Consts.msgType.ERROR;
                                        break;
                                    default:
                                        errorMsg = self.parent.getLocaleString("wfsGFI." + error.key, error.params);
                                        break;
                                }

                                map.toast(errorMsg, { type: errorType });
                            }
                            if (!responseObj.response) {
                                res();
                            }
                        }
                    }));

                    // Puede no haber response porque la URL no es correcta, metemos un condicional
                    var featuresFound = responseObj.response ? readFeaturesFromResponse(map, responseObj.response.responseText, responseObj.response.contentType) : [];
                    //ahora se distribuye la features por servicio y capa
                    arrPromises[arrPromises.length - 1] = featureToServiceDistributor(featuresFound, responseObj.service);
                    if (responseObj.service) {
                        targetServices.push(responseObj.service);
                    }
                    featureCount = featureCount + featuresFound.length;
                }
                Promise.all(arrPromises).then(function () {
                    self.parent.responseCallback({
                        xy: xy || null, services: targetServices, featureCount: featureCount
                    });
                    resolve();
                });
            }, function (_e) {
                self.parent.responseCallback({});
                resolve();
            });
        });
    });
};

TC.wrap.control.Popup.prototype = function () {
    this.popup = null;
};

Consts.event.PANANIMATIONSTART = 'pananimationstart.tc';
Consts.event.PANANIMATIONEND = 'pananimationend.tc';
TC.wrap.control.Popup.prototype.fitToView = function () {
    var self = this;
    var map = self.parent.map;
    var olMap = self.parent.map.wrap.map;

    var popupBoundingRect = self.parent.popupDiv.getBoundingClientRect();
    var mapBoundingRect = map.div.getBoundingClientRect();

    var topLeft = olMap.getCoordinateFromPixel([popupBoundingRect.left - mapBoundingRect.left, popupBoundingRect.top - mapBoundingRect.top]);
    var bottomRight = olMap.getCoordinateFromPixel([popupBoundingRect.right - mapBoundingRect.left, popupBoundingRect.bottom - mapBoundingRect.top]);
    var west = topLeft[0];
    var north = topLeft[1];
    var east = bottomRight[0];
    var south = bottomRight[1];

    var popupExt = [west, south, east, north];
    var mapExt = map.getExtent();

    if (!ol.extent.containsExtent(mapExt, popupExt)) {
        var overflows = {
            left: Math.max(mapExt[0] - popupExt[0], 0),
            bottom: Math.max(mapExt[1] - popupExt[1], 0),
            right: Math.max(popupExt[2] - mapExt[2], 0),
            top: Math.max(popupExt[3] - mapExt[3], 0)
        };

        if (self.parent.dragged) {
            // Movemos el popup
            var newPos = self.popup.getPosition();
            if (overflows.right) {
                newPos[0] = newPos[0] - overflows.right;
            }
            else if (overflows.left) {
                newPos[0] = newPos[0] + overflows.left;
            }
            if (overflows.top) {
                newPos[1] = newPos[1] - overflows.top;
            }
            else if (overflows.bottom) {
                newPos[1] = newPos[1] + overflows.bottom;
            }
            var newPixelPos = olMap.getPixelFromCoordinate(newPos);
            newPixelPos[1] = olMap.getSize()[1] - newPixelPos[1];
            self.parent._previousContainerPosition = newPixelPos;
            (self.popup._oldUpdatePixelPosition || self.popup.updatePixelPosition).call(self.popup, newPos);
        }
        else {
            if (self.parent.isVisible()) {
                // Movemos el mapa
                var view = olMap.getView();
                var ct = view.getCenter().slice();

                if (overflows.top) ct[1] += overflows.top;
                else if (overflows.bottom) ct[1] -= overflows.bottom;
                if (overflows.right) ct[0] += overflows.right;
                else if (overflows.left) ct[0] -= overflows.left;

                view.animate({
                    center: ct, easing: function (percent) {
                        if (percent === 0) self.parent.map.trigger(Consts.event.PANANIMATIONSTART);
                        if (percent === 1) self.parent.map.trigger(Consts.event.PANANIMATIONEND);
                        return percent;
                    }
                });
            }
        }
    }
};

TC.wrap.control.Popup.prototype.setDragged = function (dragged) {
    const self = this;
    var popup = self.popup;
    //var view = popup.getMap().getView();
    //var onViewChange = function () {
    //    console.log(this.getCenter());
    //};
    if (dragged) {
        // Parcheamos funciones para que el popup no se mueva cuando cambiamos el extent del mapa
        if (!popup._oldUpdatePixelPosition) {
            popup._oldUpdatePixelPosition = popup.updatePixelPosition;
            popup.updatePixelPosition = function () {
            };
        }
        if (!popup._newHandleOffsetChanged) {
            popup._newHandleOffsetChanged = function () {
                popup._oldUpdatePixelPosition();
            };
            if (self._offsetChangeListenerKey) {
                ol.events.unlistenByKey(self._offsetChangeListenerKey);
            }
            self._offsetChangeListenerKey = ol.events.listen(
                popup, 'change:offset',
                popup._newHandleOffsetChanged, popup);
        }
        //view.on(['change:center','change:resolution'], onViewChange);
    }
    else {
        // Redefinimos las propiedades de posicionamiento porque al arrastrarlo, las hemos modificado.
        const containerStyle = popup.getElement().parentElement.style;
        // Estas dos líneas siguientes se aplicaban con la versión 6.12 de ol.Overlay.prototype.updateRenderedPosition
        //containerStyle.removeProperty('left');
        //containerStyle.removeProperty('top');
        // Estas cuatro líneas siguientes se aplican con la versión 5.33 de ol.Overlay.prototype.updateRenderedPosition
        containerStyle.setProperty('top', popup.rendered.top_);
        containerStyle.setProperty('bottom', popup.rendered.bottom_);
        containerStyle.setProperty('left', popup.rendered.left_);
        containerStyle.setProperty('right', popup.rendered.right_);

        delete self.parent._previousContainerPosition;
        // Deshacemos parcheo
        if (popup._oldUpdatePixelPosition) {
            popup.updatePixelPosition = popup._oldUpdatePixelPosition;
            delete popup._oldUpdatePixelPosition;
        }
        if (popup._newHandleOffsetChanged) {
            if (self._offsetChangeListenerKey) {
                ol.events.unlistenByKey(self._offsetChangeListenerKey);
            }
            self._offsetChangeListenerKey = ol.events.listen(
                popup, 'change:offset',
                popup.handleOffsetChanged, popup);
            delete popup._newHandleOffsetChanged;
        }
        //view.un(['change:center', 'change:resolution'], onViewChange);
    }
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
                var scale = image.getScale();
                var img = image.getImage();
                if (scale) {
                    if (img.width) {
                        result.width = img.width * scale;
                        result.height = img.height * scale;
                    }
                    else {
                        result.scale = scale;
                    }
                }
                else {
                    if (img.width) {
                        result.width = img.width;
                        result.height = img.height;
                    }
                }
            }
            else if (image instanceof ol.style.Circle) {
                result.src = image.getImage().toDataURL();
            }
            if (self.parent.options.radius) {
                result.height = result.width = self.parent.options.radius * 2;
            }
            else {
                result.width = result.width || self.parent.options.width;
                result.height = result.height || self.parent.options.height;
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

            result.src = TC.Util.getLegendImageFromStyle(getStyleFromNative(style), { geometryType: geometryType });
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

TC.wrap.Feature.prototype.createPoint = function (coords, options) {
    const self = this;
    options = options || {};
    createFeatureBasics.call(self, coords, options);
    if (TC.Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { point: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createMultiPoint = function (coords, options) {
    const self = this;
    options = options || {};
    createFeatureBasics.call(self, coords, options);
    if (TC.Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { point: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createMarker = function (coords, options) {
    const self = this;
    options = options || {};
    var iconUrl = TC.Util.getPointIconUrl(options);
    if (iconUrl) {
        options.url = iconUrl;
        createFeatureBasics.call(self, coords, options);
        if (TC.Util.hasStyleOptions(options)) {
            self.feature.setStyle(createNativeStyle({ styles: { marker: options } }, self.feature));
        }
    }
    else {
        self.createPoint(coords, options);
    }
};

TC.wrap.Feature.prototype.createMultiMarker = function (coords, options) {
    const self = this;
    options = options || {};
    var iconUrl = TC.Util.getPointIconUrl(options);
    if (iconUrl) {
        options.url = iconUrl;
        createFeatureBasics.call(self, coords, options);
        if (TC.Util.hasStyleOptions(options)) {
            self.feature.setStyle(createNativeStyle({ styles: { marker: options } }, self.feature));
        }
    }
    else {
        self.createMultiPoint(coords, options);
    }
};

TC.wrap.Feature.prototype.createPolyline = function (coords, options) {
    const self = this;
    options = options || {};
    createFeatureBasics.call(self, coords, options);
    if (TC.Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { line: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createPolygon = function (coords, options) {
    const self = this;
    options = options || {};
    createFeatureBasics.call(self, coords, options);
    if (TC.Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { polygon: options } }, self.feature));
    }
};


TC.wrap.Feature.prototype.createMultiPolyline = function (coords, options) {
    const self = this;
    options = options || {};
    createFeatureBasics.call(self, coords, options);
    if (TC.Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { line: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createMultiPolygon = function (coords, options) {
    const self = this;
    options = options || {};
    createFeatureBasics.call(self, coords, options);
    if (TC.Util.hasStyleOptions(options)) {
        self.feature.setStyle(createNativeStyle({ styles: { polygon: options } }, self.feature));
    }
};

TC.wrap.Feature.prototype.createCircle = function (coords, options) {
    const self = this;
    options = options || {};
    createFeatureBasics.call(self, coords, options);
    if (options) {
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
    }
};

TC.wrap.Feature.createFeature = function (olFeat, options) {
    if (!olFeat._featurePromise) {
        olFeat._featurePromise = new Promise(function (resolve, _reject) {
            var olGeometry = olFeat.getGeometry();
            options = options || {};
            options.id = olFeat.getId();
            let olStyle = olFeat.getStyle();
            if (olStyle) {
                TC.Util.extend(options, getStyleFromNative(olStyle, olFeat));
            }
            // geometría
            let geomStr;
            switch (true) {
                case olGeometry instanceof ol.geom.Point:
                case olGeometry instanceof ol.geom.MultiPoint:
                    if (TC.Util.isFunction(olStyle)) {
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
            resolve(feat);
        });
    }
    return olFeat._featurePromise;
};

TC.wrap.Feature.prototype.cloneFeature = function () {
    return this.feature.clone();
};

TC.wrap.Feature.prototype.getStyle = function () {
    var self = this;
    var result = {};
    var olStyle = self.feature.getStyle();
    if (TC.Util.isFunction(olStyle)) {
        olStyle = olStyle(self.feature);
    }
    var olStyles = olStyle ?
        Array.isArray(olStyle) ? olStyle : [olStyle] :
        [];

    const getFill = function (style, obj) {
        if (style) {
            const fill = style.getFill();
            if (fill) {
                obj.fillColor = fill.getColor();
                if (Array.isArray(obj.fillColor)) {
                    obj.fillOpacity = obj.fillColor[3];
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
            result.url = image.getSrc();
            const size = image.getSize();
            const scale = image.getScale() || 1;
            if (size) {
                result.width = size[0] * scale;
                result.height = size[1] * scale;
            }
            //10/11/2021 URI: ncluir la rotacion de los icono que venga presumiblemente de un KML
            //pasamos la rotacion a grados para que sea mas escueta que en radianes
            const rotation = image.getRotation();

            if (rotation) {
                result.rotation = 180 * rotation / Math.PI;
            }
            var anchor = image.getAnchor();
            if (anchor) {
                result.anchor = [anchor[0] * scale, anchor[1] * scale];
                if (size) {
                    // getAnchor devuelve los valores en pixels, hay que transformar a fracción
                    result.anchor[0] = result.anchor[0] / result.width;
                    result.anchor[1] = result.anchor[1] / result.height;
                }
            }
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
    TC.Util.extend(self.parent.options, result);    
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
        var ctor;
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
                ctor = ol.geom.MultiPolygon;
                polygons = geometry;
                if (Array.isArray(polygons)) {
                    ringsOrPolylines = geometry[0];
                }
            case self.parent instanceof Polygon_s || self.parent instanceof MultiPolyline:
                isPolygonOrMultiLineString = true;
                ctor = ctor || (self.parent instanceof Polygon_s ? ol.geom.Polygon : ol.geom.MultiLineString);
                ringsOrPolylines = isMultiPolygon ? ringsOrPolylines : geometry;
                if (Array.isArray(ringsOrPolylines)) {
                    points = ringsOrPolylines[0];
                }
            case self.parent instanceof Polyline || self.parent instanceof MultiPoint_s:
                isLineString = true;
                ctor = ctor || (self.parent instanceof Polyline ? ol.geom.LineString : ol.geom.MultiPoint);
                points = isPolygonOrMultiLineString ? points : geometry;
                if (Array.isArray(points)) {
                    point = points[0];
                }
            case self.parent instanceof Point_s:
                ctor = ctor || ol.geom.Point;
                point = isLineString ? point : geometry;
                if (Array.isArray(point) && typeof point[0] === 'number' && typeof point[1] === 'number') {
                    let layout;
                    switch (point.length) {
                        case 3:
                            layout = ol.geom.GeometryLayout.XYZ;
                            break;
                        case 4:
                            layout = ol.geom.GeometryLayout.XYZM;
                            break;
                        default:
                            layout = ol.geom.GeometryLayout.XY;
                            break;
                    }
                    if (geom) {
                        geom.setCoordinates(geometry, layout);
                    }
                    else {
                        geom = new ctor(geometry, layout);
                        self.feature.setGeometry(geom);
                    }
                }
                break;
            case self.parent instanceof Circle: {
                const circleGeometry = Circle.parseGeometry(geometry);
                const center = circleGeometry[0];
                const circunferencePoint = circleGeometry[1];
                let layout;
                switch (center.length) {
                    case 3:
                        layout = ol.geom.GeometryLayout.XYZ;
                        break;
                    case 4:
                        layout = ol.geom.GeometryLayout.XYZM;
                        break;
                    default:
                        layout = ol.geom.GeometryLayout.XY;
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

TC.wrap.Feature.prototype.getLength = function (options) {
    const self = this;
    options = options || {};
    let result = 0;

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

TC.wrap.Feature.prototype.getArea = function (options) {
    const self = this;
    options = options || {};
        
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
    if (TC.Util.isFunction(style)) {
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

const getNativeLayerStyle = function (feature) {
    var style = this.getStyle();
    if (TC.Util.isFunction(style)) {
        style = style(feature);
    }
    if (Array.isArray(style)) {
        style = style[style.length - 1];
    }
    if (!style) {
        style = new ol.style.Style();
    }
    return style;
};

TC.wrap.Feature.prototype.setStyle = function (options) {
    const self = this;
    const olFeat = self.feature;
    if (options === null) {
        olFeat.setStyle(null);
        return;
    }
    const feature = self.parent;
    const geom = olFeat.getGeometry();
    let newStyle = olFeat.getStyle();
    let layerStyle;
    if (feature.layer) {
        layerStyle = getNativeLayerStyle.call(feature.layer.wrap.layer, feature.wrap.feature);
    }
    if (!newStyle) {
        if (layerStyle) {
            newStyle = layerStyle.clone();
        }
        else {
            newStyle = new ol.style.Style();
        }
    }
    if (TC.Util.isFunction(newStyle)) {
        newStyle = newStyle(olFeat);
    }
    if (!Array.isArray(newStyle)) {
        newStyle = [newStyle];
    }
    newStyle = newStyle.map(s => s.clone());

    let style = newStyle[newStyle.length - 1];
    if (geom instanceof ol.geom.Point || geom instanceof ol.geom.MultiPoint) {

        var imageStyle;
        if (options.anchor || options.url || options.cssClass) { // Marcador
            imageStyle = style.getImage();
            const iconOptions = {};
            if (imageStyle instanceof ol.style.Icon) {
                iconOptions.src = options.url || TC.Util.getBackgroundUrlFromCss(options.cssClass) || imageStyle.getSrc();

                if (options.width && options.height) {
                    iconOptions.size = [getStyleValue(options.width, feature), getStyleValue(options.height, feature)];
                }
                else {
                    iconOptions.size = imageStyle.getSize();
                }
                iconOptions.anchor = getStyleValue(options.anchor, feature);
                if (!iconOptions.anchor) {
                    const imgAnchor = imageStyle.getAnchor();
                    if (Array.isArray(imgAnchor)) {
                        iconOptions.anchor = imgAnchor.map(function (elm, idx) {
                            return elm / iconOptions.size[idx];
                        });
                    }
                }
            }
            else {
                iconOptions.src = TC.Util.getPointIconUrl(options);
                iconOptions.anchor = getStyleValue(options.anchor, feature);
                iconOptions.size = [getStyleValue(options.width, feature), getStyleValue(options.height, feature)];
            }
            if (options.angle) {
                iconOptions.rotation = options.angle / 180 * Math.PI;
            }

            imageStyle = new ol.style.Icon(iconOptions);
        }
        else if (!style.getImage() && style.getText()) { // Etiqueta

            if (options.labelKey?.length || options.label?.length) {
                style.setText(createNativeTextStyle(options, feature));
            }
            else {
                style.setText();
            }
        }
        else { // Punto sin icono
            imageStyle = style.getImage();
            if (!imageStyle) {
                imageStyle = new ol.style.Circle();
            }
            const circleOptions = {
                radius: getStyleValue(options.radius, feature) ||
                    (getStyleValue(options.height, feature) + getStyleValue(options.width, feature)) / 4
            };
            if (isNaN(circleOptions.radius) && imageStyle.getRadius) {
                circleOptions.radius = imageStyle.getRadius();
            }
            if (imageStyle.getFill) {
                const fill = imageStyle.getFill();
                const previousColor = fill.getColor();
                const previousOpacity = Array.isArray(previousColor) ? previousColor[3] : 1;
                fill.setColor(getRGBA(getStyleValue(options.fillColor || previousColor, feature), getStyleValue(options.fillOpacity || previousOpacity, feature)));
                circleOptions.fill = fill;
            }
            circleOptions.stroke = imageStyle.getStroke ? imageStyle.getStroke() : new ol.style.Stroke();
            const layerStroke = layerStyle && layerStyle.getStroke();
            if (options.strokeColor || options.strokeWidth) {
                if (!circleOptions.stroke) {
                    circleOptions.stroke = new ol.style.Stroke();
                }
                if (options.strokeColor) {
                    circleOptions.stroke.setColor(getStyleValue(options.strokeColor, feature));
                }
                else {
                    const strokeColor = circleOptions.stroke.getColor() || (layerStroke && layerStroke.getColor() || TC.Cfg.styles.point.strokeColor);
                    circleOptions.stroke.setColor(getStyleValue(strokeColor, feature));
                }
                if (options.strokeWidth) {
                    circleOptions.stroke.setWidth(getStyleValue(options.strokeWidth, feature));
                }
                else {
                    const strokeWidth = circleOptions.stroke.getWidth() || (layerStroke && layerStroke.getWidth() || TC.Cfg.styles.point.strokeWidth);
                    circleOptions.stroke.setWidth(getStyleValue(strokeWidth, feature));
                }
            }
            imageStyle = new ol.style.Circle(circleOptions);
        }
        style.setImage(imageStyle);
    }
    else {
        var stroke = style.getStroke();
        var strokeChanged = false;
        if (!stroke) {
            stroke = new ol.style.Stroke();
        }
        if (options.strokeColor) {
            stroke.setColor(getStyleValue(options.strokeColor, feature));
            strokeChanged = true;
        }
        if (options.strokeWidth) {
            stroke.setWidth(getStyleValue(options.strokeWidth, feature));
            strokeChanged = true;
        }
        if (options.lineDash) {
            stroke.setLineDash(options.lineDash);
            strokeChanged = true;
        }
        if (strokeChanged) {
            style.setStroke(stroke);
        }
        if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon) {
            if (options.fillColor || options.fillOpacity) {
                var fill = style.getFill() || new ol.style.Fill();
                const previousColor = fill.getColor();
                const previousOpacity = Array.isArray(previousColor) ? previousColor[3] : 1;
                fill.setColor(getRGBA(getStyleValue(options.fillColor || previousColor, feature), getStyleValue(options.fillOpacity || previousOpacity, feature)));
                style.setFill(fill);
            }
        }
    }

    if (options.label !== undefined) {
        if (options.label.length) {
            style.setText(createNativeTextStyle(options, feature));
        }
        else {
            style.setText();
        }
    }
    olFeat.setStyle(newStyle);    
    olFeat.changed();
};

TC.wrap.Feature.prototype.toggleSelectedStyle = function (condition) {
    const self = this;
    const feature = self.feature;
    const setStyle = condition === undefined ? !feature._originalStyle : condition;
    if (setStyle) {
        setSelectedStyle(feature);
    }
    else {
        removeSelectedStyle(feature);
    }
};

TC.wrap.Feature.prototype.getInnerPoint = function (options) {
    var result;
    var opts = options || {};
    // Funciones para hacer clipping con el extent actual. Así nos aseguramos de que el popup sale en un punto visible actualmente.
    var feature = this.feature;
    var geometry = feature.getGeometry();

    let coords;
    let clipped = false;
    result = geometry.getFirstCoordinate();
    switch (geometry.getType()) {
        case olGeometryType.MULTI_POLYGON:
            if (opts.clipBox) {
                geometry = new ol.geom.MultiPolygon(geometry
                    .getPolygons()
                    .map(pol => TC.Geometry.clipPolygon(pol.getCoordinates(), opts.clipBox))
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
            if (opts.clipBox && !clipped) {
                coords = TC.Geometry.clipPolygon(coords, opts.clipBox);
            }
            geometry = new ol.geom.Polygon(coords);
            result = geometry.getInteriorPoint().getCoordinates();
            var rings = geometry.getLinearRings();
            // Miramos si el punto está dentro de un agujero
            for (var i = 1; i < rings.length; i++) {
                if (TC.Geometry.isInside(result, rings[i].getCoordinates())) {
                    result = geometry.getClosestPoint(result);
                    break;
                }
            }
            break;
        case olGeometryType.MULTI_LINE_STRING:
            if (opts.clipBox) {
                geometry = new ol.geom.MultiLineString(geometry
                    .getLineStrings()
                    .map(ls => TC.Geometry.clipPolyline(ls.getCoordinates(), opts.clipBox))
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
            if (opts.clipBox && !clipped) {
                coords = TC.Geometry.clipPolyline(coords, opts.clipBox);
            }
            geometry = new ol.geom.LineString(coords);
            for (var i = 0; i < coords.length; i++) {
                centroid[0] += coords[i][0];
                centroid[1] += coords[i][1];
            }
            centroid[0] /= coords.length;
            centroid[1] /= coords.length;
            result = geometry.getClosestPoint(centroid);
            break;
        default:
            break;
    }
    return result;
};

TC.wrap.Feature.prototype.showPopup = function (options) {
    const self = this;
    options = options || {};
    const popupCtl = options && options instanceof TC.Control ? options : options.control;
    var map = popupCtl.map;
    if (map) {
        var feature = self.feature;
        if (feature) {
            const parentFeature = self.parent;
            map.currentFeature = parentFeature;
            var currentExtent = map.getExtent();

            self._innerCentroid = self.getInnerPoint({ clipBox: currentExtent });

            popupCtl.contentDiv.innerHTML = options.html || self.parent.getInfo({ locale: map.options.locale });

            var parentOptions = self.parent.options;
            if (TC.Util.isEmptyObject(parentOptions) && self.parent.layer &&
                self.parent.layer.options && self.parent.layer.options.styles) {

                switch (true) {
                    case parentFeature instanceof Point_s:
                        parentOptions = self.parent.layer.options.styles.point;

                        // 11/03/2019 Al crear las features del API desde las features nativas, 
                        // se valida si la feature tiene icono para definir si es punto o marcador
                        // el problema viene cuando la feature no tiene estilo propio sino que lo obtiene de la capa,
                        // en esos casos se define como punto lo que es un marcador y cuando llegamos aquí no se accede a las
                        // opciones de marcador sino de punto.
                        if (!parentOptions || TC.Util.isEmptyObject(parentOptions)) {
                            parentOptions = self.parent.layer.options.styles.marker;
                        }
                        break;
                    case parentFeature instanceof Marker:
                        parentOptions = self.parent.layer.options.styles.marker;
                        break;
                    case parentFeature instanceof Circle:
                    case parentFeature instanceof MultiPolygon_s:
                    case parentFeature instanceof Polygon_s:
                        parentOptions = self.parent.layer.options.styles.polygon;
                        break;
                    case parentFeature instanceof MultiPolyline:
                    case parentFeature instanceof Polyline:
                        parentOptions = self.parent.layer.options.styles.line;
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
                    const image = style[0]?.getImage();
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
                                offset[1] = size[1] * -image.getScale();
                            }
                        }
                    }
                }
            }
            popupCtl.wrap.setDragged(false);
            popupCtl.wrap.popup.setOffset(offset);
            popupCtl.wrap.popup.setPosition(self._innerCentroid);
            popupCtl.popupDiv.classList.add(Consts.classes.VISIBLE);
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
    if (TC.Util.isFunction(style)) {
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
    if (!result && Object.prototype.hasOwnProperty.call(properties, "description")) {
        result = properties.description;
    }

    return result;
};

TC.wrap.Feature.prototype.getData = function () {
    var self = this;
    var result = self.feature.getProperties();
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
    //URI: A aplanamos las posibles geometrías secundarias que puedan tener las features de Inspire
    for (var property in result) {
        if (result[property] && result[property].getType) {
            switch (result[property].getType()) {
                case olGeometryType.POINT:
                case olGeometryType.MULTI_POINT:
                case olGeometryType.POLYGON:
                case olGeometryType.MULTI_POLYGON:
                case olGeometryType.LINE_STRING:
                case olGeometryType.MULTI_LINE_STRING:
                    result[property] = result[property].getCoordinates();
                    break;
            }
        }
    }
    return result;
};

TC.wrap.Feature.prototype.setData = function (data) {
    this.feature.setProperties(data);
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

TC.wrap.control.Draw.prototype.mouseMoveHandler = function (_evt) {
    const self = this;
    if (self.sketch) {
        self.parent.trigger(Consts.event.MEASUREPARTIAL, self.getMeasureData());
    }
};

TC.wrap.control.Draw.prototype.mouseOverHandler = function (_evt) {
    const self = this;
    if (self.sketch && self.hoverCoordinate) {
        self.pushCoordinate(self.hoverCoordinate);
        self.hoverCoordinate = null;
    }
};

TC.wrap.control.Draw.prototype.clickHandler = function (evt) {
    const self = this;
    if (self.parent.map.view === Consts.view.PRINTING) {
        return;
    }
    if (self._mdPx) { // No operamos si el clic es consecuencia es en realidad un drag
        const dx = self._mdPx[0] - evt.clientX;
        const dy = self._mdPx[1] - evt.clientY;
        if (dx * dx + dy * dy > self.interaction.squaredClickTolerance_) {
            return;
        }
    }
    if (self.sketch) {
        var coords = self.sketch.getGeometry().getCoordinates();
        self.parent.trigger(Consts.event.POINT, {
            point: coords[coords.length - 1]
        });
    }
};

TC.wrap.control.Draw.prototype.pointerdownHandler = function (evt) {
    const self = this;
    self._mdPx = [evt.clientX, evt.clientY];
};

TC.wrap.control.Draw.prototype.getMeasureData = function () {
    const self = this;

    const formatCoords = function (point, data) {
        data.coordinates = point.getCoordinates();
    };

    const formatLength = function (line, data) {
        const projectedLine = new line.constructor(TC.Util.reproject(line.getCoordinates(), self.parent.map.crs, self.parent.map.options.utmCrs));
        if (projectedLine.getLineStrings) {
            data.length = projectedLine.getLineStrings().reduce((len, ls) => len + ls.getLength(), 0);
        }
        else {
            data.length = projectedLine.getLength();
        }
    };

    const formatArea = function (polygon, data) {
        const projectedPolygon = new ol.geom.Polygon([TC.Util.reproject(polygon.getLinearRing(0).getCoordinates(), self.parent.map.crs, self.parent.map.options.utmCrs)]);
        data.area = projectedPolygon.getArea();
        var ring = projectedPolygon.getLinearRing(0);
        data.perimeter = ol.geom.flat.linearRingLength(ring.flatCoordinates, 0, ring.flatCoordinates.length, ring.stride);
    };

    var result = {
        units: ol.proj.Units.METERS
    };
    if (this.sketch) {
        var geom = this.sketch.getGeometry();
        if (geom instanceof ol.geom.Polygon) {
            formatArea(geom, result);
        }
        else if (geom instanceof ol.geom.LineString || geom instanceof ol.geom.MultiLineString) {
            formatLength(geom, result);
        }
        else if (geom instanceof ol.geom.Point) {
            formatCoords(geom, result);
        }
    }

    return result;
};

// Función para reproyectar el dibujo actual
const drawProjectionChangeHandler = function (ctl, e) {
    if (ctl.sketch) {
        const oldProj = e.oldValue.getProjection();
        const newProj = e.target.get(e.key).getProjection();
        if (oldProj.getCode() !== newProj.getCode()) {
            const geom = ctl.sketch.getGeometry();
            geom.transform(oldProj, newProj);
            ctl.interaction.sketchPoint_.getGeometry().transform(oldProj, newProj);
            const flatCoordinates = [];
            var sketchCoords;
            if (ctl.parent.mode === Consts.geom.POLYGON) {
                sketchCoords = ctl.interaction.sketchCoords_[0];
            }
            else {
                sketchCoords = ctl.interaction.sketchCoords_;
            }
            ol.geom.flat.deflateCoordinates(flatCoordinates, 0, sketchCoords, geom.stride);
            const transformFn = ol.proj.getTransform(oldProj, newProj);
            transformFn(flatCoordinates, flatCoordinates, geom.stride);
            sketchCoords = ol.geom.flat.inflateCoordinates(flatCoordinates, 0, flatCoordinates.length, geom.stride);
            if (ctl.parent.mode === Consts.geom.POLYGON) {
                ctl.interaction.sketchCoords_ = [sketchCoords];
            }
            else {
                ctl.interaction.sketchCoords_ = sketchCoords;
            }
        }
    }
};

TC.wrap.control.Draw.prototype.activate = function (mode) {
    var self = this;

    var type;
    switch (mode) {
        case Consts.geom.POLYGON:
            type = olGeometryType.POLYGON;
            break;
        case Consts.geom.MULTIPOLYGON:
            type = olGeometryType.MULTI_POLYGON;
            break;
        case Consts.geom.POINT:
            type = olGeometryType.POINT;
            break;
        case Consts.geom.MULTIPOINT:
            type = olGeometryType.MULTI_POINT;
            break;
        case Consts.geom.MULTIPOLYLINE:
            type = olGeometryType.MULTI_LINE_STRING;
            break;
        default:
            type = olGeometryType.LINE_STRING;
            break;
    }
    if (self.parent.map) {
        Promise.all([self.parent.map.wrap.getMap(), self.parent.getLayer()]).then(function (objects) {
            const olMap = objects[0];
            const layer = objects[1];            
            if (layer) {
                layer.wrap.getLayer().then(function (olLayer) {

                    if (!self.viewport) self.viewport = olMap.getViewport();

                    if (self.interaction) {
                        olMap.removeInteraction(self.interaction);
                        if (self._pointerdownHandler) {
                            self.viewport.removeEventListener('pointerdown', self._pointerdownHandler);
                            self._pointerdownHandler = null;
                        }
                        if (self._clickHandler) {
                            self.viewport.removeEventListener('click', self._clickHandler);
                            self._clickHandler = null;
                        }
                        if (self._mouseMoveHandler && self._mouseOverHandler) {
                            self.viewport.removeEventListener(MOUSEMOVE, self._mouseMoveHandler);
                            self.viewport.removeEventListener(MOUSEOVER, self._mouseOverHandler);
                        }
                    }

                    if (self.snapInteraction) {
                        olMap.removeInteraction(self.snapInteraction);
                    }

                    if (mode) {
                        self._pointerdownHandler = self.pointerdownHandler.bind(self);
                        self._clickHandler = self.clickHandler.bind(self);
                        self.viewport.addEventListener('pointerdown', self._pointerdownHandler);
                        // No usar Consts.event.CLICK, porque eso en móviles es pointerdown
                        // y salta prematuramente
                        self.viewport.addEventListener('click', self._clickHandler);
                        if (self.parent.measurer) {
                            self._mouseMoveHandler = self.mouseMoveHandler.bind(self);
                            self._mouseOverHandler = self.mouseOverHandler.bind(self);
                            self.viewport.addEventListener(MOUSEMOVE, self._mouseMoveHandler);
                            self.viewport.addEventListener(MOUSEOVER, self._mouseOverHandler);
                        }

                        var drawOptions = {
                            type: type,
                            snapTolerance: 0,
                            condition: function () {
                                if (ol.events.condition.shiftKeyOnly(arguments[0])) {
                                    const hole = olMap.forEachFeatureAtPixel(olMap.getPixelFromCoordinate(arguments[0].coordinate), function (feature) {
                                        if (olGeometryType.POLYGON === feature.getGeometry().getType() ||
                                            olGeometryType.MULTI_POLYGON === feature.getGeometry().getType()) {
                                            return feature;
                                        }
                                        return null;
                                    },
                                        {
                                            hitTolerance: hitTolerance
                                        });
                                }

                                if (self.parent.map.view === Consts.view.PRINTING) {
                                    return null;
                                }

                                return true;
                            }
                        };
                        if (olLayer) {
                            drawOptions.source = olLayer.getSource();
                        }
                        if (mode === Consts.geom.RECTANGLE) {
                            drawOptions.type = olGeometryType.LINE_STRING;
                            drawOptions.maxPoints = 2;
                            drawOptions.geometryFunction = function (coordinates, geometry) {
                                const start = coordinates[0];
                                const end = coordinates[1];
                                const newCoords = [[start, [start[0], end[1]], end, [end[0], start[1]], start]];
                                if (geometry) {
                                    geometry.setCoordinates(newCoords);
                                }
                                else {
                                    geometry = new ol.geom.Polygon(newCoords);
                                }
                                return geometry;
                            };
                        }

                        self.interaction = new ol.interaction.Draw(drawOptions);

                        self.setStyle();

                        self.interaction.on('drawstart', function (evt) {
                            self.sketch = evt.feature;
                            const eventObject = {};
                            const drawMode = self.parent.mode;
                            if (self._extending) {
                                eventObject.feature = self.interaction.sketchFeature_._wrap.parent;
                            }
                            else if (self.parent.extensibleSketch &&
                                (drawMode === Consts.geom.POLYLINE || drawMode === Consts.geom.MULTIPOLYLINE)) {
                                const firstPoint = evt.feature.getGeometry().getFirstCoordinate();
                                const previousFeature = self
                                    .parent
                                    .layer
                                    .features
                                    .filter(f => !(f instanceof Point_s))
                                    .find(f => {
                                        const lastPoint = f.wrap.feature.getGeometry().getLastCoordinate();
                                        return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
                                    });
                                if (previousFeature) {
                                    self._extendFeature(previousFeature);
                                    eventObject.feature = previousFeature;
                                    return;
                                }
                            }
                            eventObject.extending = self._extending;
                            self.parent.trigger(Consts.event.DRAWSTART, eventObject);
                        }, this);

                        self.interaction.on('drawend', function (evt) {
                            const overlayStyle = evt.target.overlay_.getStyle();
                            if (!evt.feature.getStyle()) {
                                evt.feature.setStyle(Array.isArray(overlayStyle) ? overlayStyle.map(function (style) {
                                    return style.clone();
                                }) : overlayStyle);
                            }
                            if (self.parent.measurer) {
                                self.parent.trigger(Consts.event.MEASURE, self.getMeasureData());
                            }
                            const endFn = function (feat) {
                                self.parent.trigger(Consts.event.DRAWEND, { feature: feat });
                                self.sketch = null;
                                self.interaction.setActive(true);
                            };
                            if (self._extending && self._extendedFeature) {
                                let lineToAdd = self.sketch.getGeometry();
                                const extendedFeatureGeometry = self._extendedFeature.getGeometry();
                                lineToAdd = new lineToAdd.constructor(lineToAdd.getCoordinates(), extendedFeatureGeometry.getLayout());
                                extendedFeatureGeometry.appendLineString(lineToAdd);
                                const feat = self._extendedFeature._wrap.parent;
                                feat.setStyle(self.parent.getStyle());
                                feat.geometry = extendedFeatureGeometry;
                                if (olLayer) {
                                    // Necesario timeout porque el evento drawend 
                                    // se lanza antes de añadir la entidad a la capa
                                    setTimeout(() => {
                                        olLayer.getSource().removeFeature(evt.feature);
                                    }, 100);
                                }
                                endFn(feat);
                            }
                            else {
                                TC.wrap.Feature.createFeature(self.sketch).then(function (feat) {
                                    if (self.parent.mode === Consts.geom.RECTANGLE) {
                                        const delay = 400;
                                        const dblClickInteraction = self.interaction
                                            .getMap()
                                            .getInteractions()
                                            .getArray()
                                            .filter(i => i instanceof ol.interaction.DoubleClickZoom)[0];
                                        // Desactivamos temporalmente el zoom por doble clic para evitar que se lance accidentalmente
                                        if (dblClickInteraction && dblClickInteraction.getActive()) {
                                            dblClickInteraction.setActive(false);
                                            setTimeout(function () {
                                                dblClickInteraction.setActive(true);
                                            }, delay);
                                        }
                                        self.interaction.setActive(false);
                                        setTimeout(() => endFn(feat), delay); // Retardo para evitar pulsaciones accidentales en dobles clics del usuario
                                    }
                                    else {
                                        endFn(feat);
                                    }
                                });
                            }
                            delete self._extendedFeature;
                            delete self._extending;
                        }, this);

                        self._projectionChangeHandler = function (e) {
                            drawProjectionChangeHandler(self, e);
                        };
                        olMap.on('change:view', self._projectionChangeHandler);

                        olMap.addInteraction(self.interaction);

                        if (self.parent.options.snapping || self.parent.extensibleSketch) {
                            var snapOptions = {};
                            if (olLayer) {
                                snapOptions.source = olLayer.getSource();
                            }
                            else if (self.parent.options.snapping instanceof TC.Layer) {
                                snapOptions.source = self.parent.options.snapping.wrap.layer.getSource();
                            }
                            self.snapInteraction = new ol.interaction.Snap(snapOptions);
                            olMap.addInteraction(self.snapInteraction);
                        }
                    }

                    self.redoStack = [];
                });
            }
        });
    }
};

TC.wrap.control.Draw.prototype.deactivate = function () {
    var self = this;
    if (self.parent.map) {
        self.sketch = null;
        if (self.viewport) {
            if (self._pointerdownHandler) {
                self.viewport.removeEventListener('pointerdown', self._pointerdownHandler);
                self._pointerdownHandler = null;
            }
            if (self._clickHandler) {
                self.viewport.removeEventListener('click', self._clickHandler);
                self._clickHandler = null;
            }
        }
        Promise.all([self.parent.map.wrap.getMap(), self.parent.getLayer()]).then(function (objects) {
            const olMap = objects[0];
            const layer = objects[1];
            if (layer && self.parent.singleSketch) {
                layer.clearFeatures();
            }
            if (self.interaction) {
                olMap.removeInteraction(self.interaction);
                self.interaction = null;
            }
            if (self._projectionChangeHandler) {
                olMap.un('change:view', self._projectionChangeHandler);
            }
        });
    }
};

TC.wrap.control.Draw.prototype._extendFeature = function (feature) {
    const self = this;
    self._extending = true;
    const olFeat = feature.wrap.feature;
    if (feature instanceof Polyline) {
        // Siendo polyline podemos usar el método extend de OL
        self.interaction.abortDrawing();
        // Pasamos el sketch a un estado inicial, como si estuviéramos dibujando nuevo
        feature.layer.removeFeature(feature);
        self.interaction.extend(olFeat);
    }
    else {
        // MultiPolyline no es compatible con el método extend de OL
        // Como alternativa, al final de dibujo se añade como segmento a la  entidad del parámetro
        self._extendedFeature = olFeat;
    }
};

//El valor devuelto es lo que va al stack de redo
TC.wrap.control.Draw.prototype.popCoordinate = function () {
    var self = this;
    var result = null;
    if (self.interaction) {
        var feature = self.interaction.sketchFeature_;
        if (feature) {
            var coords;
            var geom = feature.getGeometry();

            if (geom instanceof ol.geom.Polygon) {
                coords = geom.getCoordinates()[0];
            }
            else if (geom instanceof ol.geom.LineString) {
                coords = geom.getCoordinates();
            }
            if (coords.length > 1) {

                var puntos;
                if (geom instanceof ol.geom.Polygon)
                    puntos = self.interaction.sketchCoords_[0];
                else if (geom instanceof ol.geom.LineString)
                    puntos = self.interaction.sketchCoords_;

                /*
                Al menos con linestring, no necesariamente hay que quitar el último
                Porque OL mete en coordinates del sketchFeature_ tanto el último marcado como el que flota detrás del cursor
                Para comprobar que realmente es ése, podemos contrastarlo con self.interaction.sketchPoint_.getGeometry().getCoordinates()
                */
                var flyingPointContained = false;
                if (self.interaction.sketchPoint_) {
                    var flyingPoint = self.interaction.sketchPoint_.getGeometry().getCoordinates();
                    for (var i = 0; i < coords.length; i++) {
                        if (coords[i][0] == flyingPoint[0] && coords[i][1] == flyingPoint[1]) {
                            flyingPointContained = true;
                            break;
                        }
                    }
                }

                var index;
                if (flyingPointContained) index = puntos.length - 2;
                else index = puntos.length - 1;

                result = puntos[index];
                puntos.splice(index, 1);

                if (geom instanceof ol.geom.Polygon) {
                    geom.setCoordinates([puntos]);
                    self.interaction.sketchLine_.getGeometry().setCoordinates(puntos);
                }
                else {
                    geom.setCoordinates(puntos);
                }


                feature.setGeometry(geom);
            }
        }    
    }
    return result;
};

TC.wrap.control.Draw.prototype.pushCoordinate = function (coord) {
    var self = this;
    var result = false;
    if (self.interaction) {
        var feature = self.interaction.sketchFeature_;
        if (feature) {
            var coords;
            var geom = feature.getGeometry();

            if (geom instanceof ol.geom.Polygon) {
                coords = geom.getCoordinates()[0];
            } else if (geom instanceof ol.geom.LineString) {
                coords = geom.getCoordinates();
            }
            //coords.push(coord);

            var puntos;
            if (geom instanceof ol.geom.Polygon) {
                puntos = self.interaction.sketchCoords_[0];
                //self.interaction.sketchCoords_[0].push(coord);
                //geom.setCoordinates([fullCoords], ol.geom.GeometryLayout.XY);
            } else if (geom instanceof ol.geom.LineString) {

                puntos = self.interaction.sketchCoords_;
            }

            //Si hay punto volador, hay que meter la coordenada justo antes
            var flyingPointContained = false;
            if (self.interaction.sketchPoint_) {
                var flyingPoint = self.interaction.sketchPoint_.getGeometry().getCoordinates();
                for (var i = 0; i < coords.length; i++) {
                    if (coords[i][0] == flyingPoint[0] && coords[i][1] == flyingPoint[1]) {
                        flyingPointContained = true;
                        break;
                    }
                }
            }

            let index;
            if (flyingPointContained) {
                index = puntos.length - 1;
            }
            else {
                index = puntos.length;
            }
            puntos.splice(index, 0, coord);

            if (geom instanceof ol.geom.LineString)
                geom.setCoordinates(puntos, ol.geom.GeometryLayout.XY);
            else {
                geom.setCoordinates([puntos], ol.geom.GeometryLayout.XY);
                self.interaction.sketchLine_.getGeometry().setCoordinates(puntos);
                //feature.setGeometry(geom);
            }

            result = true;
        }    
    }
    return result;
};

TC.wrap.control.Draw.prototype.undo = function () {
    var self = this;
    var result = false;

    var coord = self.popCoordinate();
    if (coord) {
        self.redoStack.push(coord);
        result = true;
    }

    self.parent.trigger(Consts.event.MEASUREPARTIAL, self.getMeasureData());

    return result;
};

TC.wrap.control.Draw.prototype.redo = function () {
    var self = this;
    var result = false;

    if (self.redoStack.length > 0) {
        self.pushCoordinate(self.redoStack.pop());
        result = true;
    }

    self.parent.trigger(Consts.event.MEASUREPARTIAL, self.getMeasureData());

    return result;
};

TC.wrap.control.Draw.prototype.end = function () {
    var self = this;
    if (self.interaction && self.interaction.sketchFeature_)
        self.interaction.finishDrawing();    
};

TC.wrap.control.Draw.prototype.setStyle = function () {
    const self = this;
    if (self.interaction) {
        let olStyle;
        const parentStyle = self.parent.getStyle();
        if (parentStyle) {
            switch (self.parent.mode) {
                case Consts.geom.RECTANGLE:
                    olStyle = createNativeStyle({
                        styles: {
                            line: parentStyle,
                            point: false,
                            polygon: false
                        }
                    });
                    break;
                case Consts.geom.POLYGON:
                case Consts.geom.MULTIPOLYGON:
                    olStyle = createNativeStyle({
                        styles: {
                            polygon: parentStyle,
                            line: false,
                            point: false
                        }
                    });
                    break;
                case Consts.geom.POINT:
                case Consts.geom.MULTIPOINT:
                    olStyle = createNativeStyle({
                        styles: {
                            point: parentStyle,
                            line: false,
                            polygon: false
                        }
                    });
                    break;
                case Consts.geom.MULTIPOLYLINE:
                default: {
                    const styleOptions = {
                        styles: {
                            line: parentStyle,
                            point: false,
                            polygon: false
                        }
                    };
                    const defaultStyle = createNativeStyle(styleOptions);
                    if (self.parent.extensibleSketch && self.parent.styles.point) {
                        const activeStyle = createNativeStyle({
                            styles: {
                                line: parentStyle,
                                point: self.parent.styles.point,
                                polygon: false
                            }
                        });
                        olStyle = function () {
                            if (self.interaction?.sketchPoint_) {
                                const pointCoords = self.interaction.sketchPoint_
                                    .getGeometry()
                                    .getCoordinates();
                                const previousFeatureFound = self.parent.layer.wrap.layer
                                    .getSource()
                                    .getFeatures()
                                    .map(f => f.getGeometry())
                                    .filter(g => !(g instanceof Point_s))
                                    .some(g => {
                                        const lastPoint = g.getLastCoordinate();
                                        return pointCoords[0] === lastPoint[0] && pointCoords[1] === lastPoint[1];
                                    });
                                if (previousFeatureFound) {
                                    return activeStyle;
                                }
                            }
                            return defaultStyle;
                        }
                    }
                    else {
                        olStyle = defaultStyle;
                    }
                    break;
                }
            }
            self.interaction.overlay_.setStyle(olStyle);
        }    
    }
};

TC.wrap.control.Draw.prototype.setVisibility = function (visibility) {
    const self = this;
    if (self.interaction) {
        self.interaction.getOverlay().setVisible(visibility)
    }    
}

TC.wrap.control.OfflineMapMaker.prototype.getRequestSchemas = function (options) {
    var extent = options.extent;
    var layers = options.layers;
    var result = new Array(layers.length);
    for (var i = 0, len = result.length; i < len; i++) {
        var layer = layers[i];
        var schema = {
            layerId: layer.id,
            tileMatrixSet: layer.matrixSet
        };
        var olSource = layer.wrap.layer.getSource();
        if (olSource.getUrls) {
            schema.url = olSource.getUrls()[0];
        }
        if (olSource.getTileGrid) {
            var tileGrid = olSource.getTileGrid();
            var resolutions = tileGrid.getResolutions();
            var matrixIds = tileGrid.getMatrixIds();
            var node = layer.getLayerNodeByName(layer.layerNames);
            var tmsLimits = null;
            for (var j = 0, llen = node.TileMatrixSetLink.length; j < llen; j++) {
                var tmsl = node.TileMatrixSetLink[j];
                if (tmsl.TileMatrixSet === layer.matrixSet) {
                    tmsLimits = tmsl.TileMatrixSetLimits;
                    break;
                }
            }
            schema.tileMatrixLimits = [];
            resolutions.forEach(function (resolution, idx) {
                var origin = tileGrid.getOrigin(idx);
                var tileSize = tileGrid.getTileSize(idx);
                var unitsPerTile = tileSize * resolution;
                var tml = {
                    mId: matrixIds[idx],
                    res: resolution,
                    origin: origin,
                    tSize: tileSize,
                    cl: Math.floor((extent[0] - origin[0]) / unitsPerTile),
                    cr: Math.floor((extent[2] - origin[0]) / unitsPerTile),
                    rt: Math.floor((origin[1] - extent[3]) / unitsPerTile),
                    rb: Math.floor((origin[1] - extent[1]) / unitsPerTile)
                };
                if (tmsLimits) {
                    var tmsLimit = tmsLimits[idx];
                    if (tmsLimit) {
                        tml.cl = Math.max(tml.cl, tmsLimit.MinTileCol);
                        tml.cr = Math.min(tml.cr, tmsLimit.MaxTileCol);
                        tml.rt = Math.max(tml.rt, tmsLimit.MinTileRow);
                        tml.rb = Math.min(tml.rb, tmsLimit.MaxTileRow);
                    }
                }
                if (tml.cl <= tml.cr && tml.rt <= tml.rb) {
                    schema.tileMatrixLimits.push(tml);
                }
            });
        }
        result[i] = schema;
    }
    return result;
};

TC.wrap.control.OfflineMapMaker.prototype.getGetTilePattern = function (layer) {
    var result = "";
    var olSource = layer.wrap.layer.getSource();
    if (olSource.getUrls) {
        result = olSource.getUrls()[0];
    }
    if (layer.options.encoding !== Consts.WMTSEncoding.RESTFUL) {
        if (result.indexOf('?') < 0) {
            result = result + '?';
        }
        if (result.indexOf('?') === result.length - 1) {
            result = result + 'layer=' + layer.layerNames + '&style=default&tilematrixset=' + encodeURIComponent(layer.matrixSet) +
                '&Service=WMTS&Request=GetTile&Version=1.0.0&Format=' + encodeURIComponent(layer.format) +
                '&TileMatrix={TileMatrix}&TileCol={TileCol}&TileRow={TileRow}';
        }
    }
    return result;
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
            strokeWidth = image.getStroke().getWidth();
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
    let originalStyle = feat._originalStyle = feat._originalStyle || feat.getStyle();
    if (!feat._originalStyle && feat._wrap.parent.layer) {
        originalStyle = feat._wrap.parent.layer.wrap.layer.getStyle();
    }
    if (!originalStyle) {
        originalStyle = createNativeStyle({}, feat);
    }
    if (TC.Util.isFunction(originalStyle)) {
        return function (f, r) {
            return addHaloToStyle(originalStyle(f, r));
        };
    }
    return addHaloToStyle(originalStyle);
};

const setSelectedStyle = function (feat) {
    updateSelectedStyle.call(feat);
    feat.changed();
    //feat._changeListenerKey = ol.events.listen(feat, CHANGE, updateSelectedStyle, feat);
};

const removeSelectedStyle = function (feat) {
    //ol.events.unlistenByKey(feat._changeListenerKey);
    if (Object.prototype.hasOwnProperty.call(feat, '_originalStyle')) {
        feat.setStyle(feat._originalStyle);
    }
    delete feat._originalStyle;
};

const updateSelectedStyle = function () {
    this.style_ = createSelectedStyle(this);
    this.styleFunction_ = !this.style_ ? undefined : ol.Feature.createStyleFunction(this.style_);
};

TC.wrap.control.Modify.prototype.activate = function () {
    const self = this;
    if (self.parent.map) {
        Promise.all([self.parent.map.wrap.getMap(), self.parent.layer.wrap.getLayer()]).then(function (olObjects) {
            const olMap = olObjects[0];
            const olLayer = olObjects[1];
            const deleteMode = self.parent.mode === TC.control.Modify.mode.VERTEX_DELETE;
            const selectOptions = {
                layers: [olLayer],
                hitTolerance: hitTolerance,
                style: null
            };
            if (self.selectInteraction) {
                selectOptions.features = self.selectInteraction.getFeatures();
                if (deleteMode) {
                    selectOptions.condition = never;
                }
                olMap.removeInteraction(self.selectInteraction);
            }
            var select = new ol.interaction.Select(selectOptions);
            self.selectInteraction = select;
            olMap.addInteraction(select);
            var getWrapperFeature = function (elm) {
                return elm._wrap.parent;
            };
            select.on('select', function (event) {
                if (event.selected.length > 0) {
                    self.parent.trigger(Consts.event.FEATURESSELECT, { ctrl: self, features: event.selected.map(getWrapperFeature) });
                }
                if (event.deselected.length > 0) {
                    if (event.selected.length === 0) {
                        self.parent.trigger(Consts.event.FEATURESUNSELECT, { ctrl: self.parent, features: event.deselected.map(getWrapperFeature) });
                    }
                }
            });
            if (self.modifyInteraction) {
                olMap.removeInteraction(self.modifyInteraction);
            }
            const modifyOptions = {
                features: select.getFeatures()
            };
            if (deleteMode) {
                modifyOptions.deleteCondition = click;
            }
            var modify = new ol.interaction.Modify(modifyOptions);
            if (deleteMode) {
                let featureRevision;
                modify.on('modifystart', function (e) {
                    if (e.mapBrowserEvent.type === 'click') {
                        // Es un intento de borrado. Miramos si va a ser infructuoso por falta de vértices
                        featureRevision = e.features.item(0).getRevision();
                    }
                });
                modify.on('modifyend', function (e) {
                    if (e.mapBrowserEvent.type === 'click') {
                        // Es un intento de borrado. Miramos si va a ser infructuoso por falta de vértices
                        if (e.features.item(0).getRevision() === featureRevision) {
                            self.parent.map.toast(self.parent.getLocaleString("verticesCannotBeDeleted"),
                                { type: Consts.msgType.ERROR });
                        }
                    }
                });
            }
            self._modifiedGeometries = self._modifiedGeometries || new WeakMap();
            modify.on('modifystart', function (e) {
                e.features.forEach(function (feature) {
                    self._modifiedGeometries.set(feature, feature.getGeometry().getFlatCoordinates().slice());
                });
            });
            modify.on('modifyend', function (e) {
                e.features.forEach(function (feature) {
                    const newGeom = feature.getGeometry();
                    if (newGeom.stride > 2) {
                        const oldCoords = self._modifiedGeometries.get(feature);
                        if (oldCoords) {
                            const newCoords = newGeom.getFlatCoordinates();
                            if (oldCoords.length <= newCoords.length) {
                                // Hemos movido o añadido un punto
                                for (var i = 0; i < newCoords.length; i += newGeom.stride) {
                                    const iplus1 = i + 1;
                                    if (newCoords[i] !== oldCoords[i] || newCoords[iplus1] !== oldCoords[iplus1]) {
                                        newCoords[iplus1 + 1] = 0;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    feature._wrap.parent.geometry = feature._wrap.getGeometry();
                    self.parent.trigger(Consts.event.FEATUREMODIFY, { feature: feature._wrap.parent, layer: self.parent.layer });
                });
            });
            self.modifyInteraction = modify;
            olMap.addInteraction(modify);

            if (self.snapInteraction) {
                olMap.removeInteraction(self.snapInteraction);
            }
            if (self.parent.snapping) {
                self.snapInteraction = new ol.interaction.Snap({
                    source: olLayer.getSource()
                });
                olMap.addInteraction(self.snapInteraction);
            }

            if (!self._onMouseMove) {
                self._onMouseMove = function (e) {
                    const viewport = olMap.getViewport();
                    var hit = false;

                    var pixel = olMap.getEventPixel(e);
                    hit = olMap.forEachFeatureAtPixel(pixel, function (_feature, layer) {
                        if (self.parent.layer && layer === self.parent.layer.wrap.layer) {
                            return true;
                        }
                        return false;
                    },
                        {
                            hitTolerance: hitTolerance
                        });

                    if (hit) {
                        viewport.style.cursor = 'pointer';
                    } else {
                        viewport.style.cursor = '';
                        //self.parent.trigger(Consts.event.FEATUREOUT);
                    }
                };
            }

            olMap.getViewport().addEventListener(MOUSEMOVE, self._onMouseMove);
        });
    }
};

TC.wrap.control.Modify.prototype.deactivate = function () {
    const self = this;
    if (self.modifyInteraction) {
        self.modifyInteraction.setActive(false);
        self.selectInteraction.setActive(false);
        self.parent.map.wrap.getMap().then(function (olMap) {
            olMap.getViewport().removeEventListener(MOUSEMOVE, self._onMouseMove);
            olMap.removeInteraction(self.modifyInteraction);
            olMap.removeInteraction(self.selectInteraction);
            self.modifyInteraction = null;
            self.selectInteraction = null;
        });
    }
};

TC.wrap.control.Modify.prototype.getSelectedFeatures = function () {
    var self = this;
    var result = [];
    if (self.selectInteraction) {
        self.selectInteraction.getFeatures().forEach(function (elm) {
            result.push(elm._wrap.parent);
        });
    }    
    return result;
};

TC.wrap.control.Modify.prototype.setSelectedFeatures = function (features) {
    var self = this;
    if (self.selectInteraction) {
        self.selectInteraction.features_.clear();
        self.selectInteraction.features_.extend(features.map(f => f.wrap.feature));
    }
};

TC.wrap.control.Modify.prototype.unselectFeatures = function (features) {
    features = features || [];
    const self = this;
    const selectedFeatures = self.selectInteraction ? self.selectInteraction.getFeatures() : null;
    if (selectedFeatures) {
        const unselectedFeatures = [];
        selectedFeatures.getArray().slice().forEach(function (olFeature) {
            if (!features.length || features.indexOf(olFeature) >= 0) {
                selectedFeatures.remove(olFeature);
                unselectedFeatures.push(olFeature._wrap.parent);
            }
        });
        if (unselectedFeatures.length) {
            self.parent.trigger(Consts.event.FEATURESUNSELECT, { features: unselectedFeatures });
        }
    }
};

TC.wrap.control.Edit.prototype.cancel = function (_deactivate, _cancelTxt) {
    var self = this;
    self.points = [];
    self.histPoints = [];
    //var layer = self.control && self.control.layer || self.modifyInteraction && self.modifyInteraction.layer;
    //if (!self.session || ((self.modifyInteraction && self.modifyInteraction.modified) || (self.session.featuresAdded && self.session.featuresAdded.length)) && cancelTxt && !confirm(cancelTxt))
    //    return;
    if (self.selectInteraction) {
        var features = self.selectInteraction.getFeatures();
        self.parent.trigger(Consts.event.FEATURESUNSELECT, { ctrl: self.parent, feature: features.get(0) });
        features.clear();
        self.selectInteraction.setActive(false);
    }
    //if (self.drawInteraction) {
    //    self.drawInteraction.abortDrawing_();
    //    if (deactivate) {
    //        self.drawInteraction.setActive(false);
    //    }
    //}
    //if(self.modifyInteraction)
    //{
    //    if (self.modifyInteraction.feature)
    //        self.modifyInteraction.unselectFeature(self.modifyInteraction.feature);
    //    if (deactivate)
    //    {
    //        self.modifyInteraction.deactivate();
    //    }   
    //}
    ////if (self.session.featuresAdded && self.session.featuresAdded.length > 0) {
    ////    layer.removeFeatures(self.session.featuresAdded);
    ////    self.session.featuresAdded = [];
    ////}
    //self.parent.trigger(Consts.event.EDITIONCANCEL, { ctrl: self });
    ////no se por que hostias se cambia el renderIntent a las features
    //layer.features.forEach(function (feat) {
    //    feat.renderIntent = "";
    //});    
    //layer.removeAllFeatures();
    //layer.addFeatures(self.session.features);        
    //self.clearSession();
};

TC.wrap.control.Edit.prototype.deleteFeatures = function (features) {
    var self = this;
    if (Array.isArray(features)) {
        var olFeatures = features.map(function (elm) {
            return elm.wrap.feature;
        });
        self.parent.layer.wrap.getLayer().then(function (olLayer) {
            var selectedFeatures = self.selectInteraction ? self.selectInteraction.getFeatures() : null;
            for (var i = 0, len = olFeatures.length; i < len; i++) {
                var olFeature = olFeatures[i];
                if (selectedFeatures) {
                    selectedFeatures.remove(olFeature);
                    self.parent.trigger(Consts.event.FEATURESUNSELECT, { feature: olFeature._wrap.parent });
                }
                olLayer.getSource().removeFeature(olFeature);
                self.parent.trigger(Consts.event.FEATUREREMOVE, { feature: olFeature._wrap.parent });
            }
        });
    }
};

//TC.wrap.control.Edit.prototype.clearSession = function () {
//    var self = this;
//    delete self.session;
//};

TC.wrap.Feature.prototype.toGML = function (_version, srsName) {
    var parser = new ol.format.GML({
        srsName: srsName
    });
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

TC.wrap.Geometry.write = function (options) {
    options = options || {};
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
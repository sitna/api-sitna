import { VERSION } from 'ol/util';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import OverlayPositioning from 'ol/OverlayPositioning';
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
import { shiftKeyOnly } from 'ol/events/condition';
import e_EventType from 'ol/events/EventType';
import { getWidth, getHeight, containsCoordinate, containsExtent, buffer, boundingExtent } from 'ol/extent';
import Feature from 'ol/Feature';
import { createStyleFunction } from 'ol/Feature';
import { Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon, Circle as g_Circle } from 'ol/geom';
import GeometryCollection from 'ol/geom/GeometryCollection';
import GeometryType from 'ol/geom/GeometryType';
import GeometryLayout from 'ol/geom/GeometryLayout';
import { deflateCoordinates } from 'ol/geom/flat/deflate';
import { inflateCoordinates } from 'ol/geom/flat/inflate';
import { linearRingLength } from 'ol/geom/flat/length';
import { xhr } from 'ol/featureloader';
import GMLBase from '../../lib/ol/format/GMLBase';
import { GML, WFS, WKT, WKB , WMSCapabilities, WMSGetFeatureInfo, WMTSCapabilities, TopoJSON, GeoJSON, KML } from 'ol/format';
import GeoJSON from '../../lib/ol/format/GeoJSON';
import GPX from '../../lib/ol/format/GPX';
import KML from '../../lib/ol/format/KML';
//import { GeoJSON, GML, GPX, KML, WFS, WKT, WMSCapabilities, WMSGetFeatureInfo, WMTSCapabilities, TopoJSON } from 'ol/format';
import { transformGeometryWithOptions } from 'ol/format/Feature';
import GML2 from 'ol/format/GML2';
import GML3 from 'ol/format/GML3';
import GML32 from 'ol/format/GML32';
import { defaults, Draw, Pointer, Translate, Snap, Select, Modify, DragAndDrop, DoubleClickZoom } from 'ol/interaction';
import DragAndDrop from '../../lib/ol/interaction/DragAndDrop';
import { Layer, Tile, Image as l_Image, Vector as l_Vector, Heatmap } from 'ol/layer';
import TileGrid from 'ol/tilegrid/TileGrid';
import { unByKey } from 'ol/Observable';

import BaseObject from 'ol/Object';
import { METERS_PER_UNIT, Projection, addEquivalentProjections, get, getTransform, transform, transformExtent } from '../../lib/ol/proj';
//import { METERS_PER_UNIT as g_METERS_PER_UNIT, PROJECTIONS } from 'ol/proj/epsg4326';
import { METERS_PER_UNIT as g_METERS_PER_UNIT, PROJECTIONS } from '../../lib/ol/proj/epsg4326';
import Units from 'ol/proj/Units';
import { register } from 'ol/proj/proj4';
//import { register } from '../../lib/ol/proj/proj4';
import { toContext } from 'ol/render';
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

export { VERSION };
export { Map };
export { View };
export { Overlay };
export { OverlayPositioning };
Feature.createStyleFunction = createStyleFunction;
export { Feature };
export { Collection };
export { MapEventType };
export { MapBrowserEventType };
export { Image };

const array = {};
array.extend = extend;
array.includes = includes;
export { array };

const asserts = {};
asserts.assert = assert;
export { asserts };

const color = {};
color.asArray = asArray;
color.asString = asString;
export { color };

const math = {};
math.toRadians = toRadians;
export { math };

const string = {};
string.padNumber = padNumber;
export { string };

const control = {};
control.OverviewMap = OverviewMap;
control.ScaleLine = ScaleLine;
control.Zoom = Zoom;
control.ZoomSlider = ZoomSlider;
control.ZoomToExtent = ZoomToExtent;
export { control };

const events = {};
events.EventType = e_EventType;
events.listen = listen;
events.unlistenByKey = unlistenByKey;
events.condition = {
    shiftKeyOnly: shiftKeyOnly
};
export { events };

const extent = {};
extent.getWidth = getWidth;
extent.getHeight = getHeight;
extent.containsCoordinate = containsCoordinate;
extent.containsExtent = containsExtent;
extent.buffer = buffer;
extent.boundingExtent = boundingExtent;
export { extent };

const geom = {};
geom.Point = Point;
geom.MultiPoint = MultiPoint;
geom.LineString = LineString;
geom.MultiLineString = MultiLineString;
geom.Polygon = Polygon;
geom.MultiPolygon = MultiPolygon;
geom.GeometryCollection = GeometryCollection;
geom.Circle = g_Circle;
geom.GeometryType = GeometryType;
geom.GeometryLayout = GeometryLayout;
geom.flat = {
    deflateCoordinates: deflateCoordinates,
    inflateCoordinates: inflateCoordinates,
    linearRingLength: linearRingLength
};
export { geom };

const featureloader = {};
featureloader.xhr = xhr;
export { featureloader };

const format = {};
format.Feature = Feature;
format.Feature.transformGeometryWithOptions = transformGeometryWithOptions;
format.GeoJSON = GeoJSON;
format.GMLBase = GMLBase;
format.GML = GML;
format.GML2 = GML2;
format.GML3 = GML3;
format.GML32 = GML32;
format.GPX = GPX;
format.KML = KML;
format.WFS = WFS;
format.WKT = WKT;
format.WKB = WKB;
format.WMSCapabilities = WMSCapabilities;
format.WMSGetFeatureInfo = WMSGetFeatureInfo;
format.WMTSCapabilities = WMTSCapabilities;
format.TopoJSON = TopoJSON;
format.xsd = {
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
};
export { format };

const interaction = {};
interaction.defaults = defaults;
interaction.Draw = Draw;
interaction.Pointer = Pointer;
interaction.Translate = Translate;
interaction.Snap = Snap;
interaction.Select = Select;
interaction.Modify = Modify;
interaction.DragAndDrop = DragAndDrop;
interaction.DoubleClickZoom = DoubleClickZoom;
//interaction.TapAndDragZoom = TapAndDragZoom;
export { interaction };

const layer = {};
layer.Layer = Layer;
layer.Tile = Tile;
layer.Image = l_Image;
layer.Vector = l_Vector;
layer.Heatmap = Heatmap;
export { layer };

const Observable = {};
Observable.unByKey = unByKey;
export { Observable };

const Object = BaseObject;
export { Object };

const proj = {};
proj.METERS_PER_UNIT = METERS_PER_UNIT;
proj.Projection = Projection;
proj.addEquivalentProjections = addEquivalentProjections;
proj.get = get;
proj.transform = transform;
proj.transformExtent = transformExtent;
proj.getTransform = getTransform;
proj.Units = Units;
proj.proj4 = { register: register };
proj.EPSG4326 = {
    METERS_PER_UNIT: g_METERS_PER_UNIT,
    PROJECTIONS: PROJECTIONS
};
export { proj };

const render = {};
render.toContext = toContext;
render.EventType = r_EventType;
export { render };

const source = {};
source.Vector = s_Vector;
source.Cluster = Cluster;
source.ImageWMS = ImageWMS;
source.WMTS = WMTS;
source.WMTS.optionsFromCapabilities = optionsFromCapabilities;
source.TileEventType = TileEventType;
source.VectorEventType = VectorEventType;
source.ImageCanvas = ImageCanvas;
//source.OGCMapTile = OGCMapTile;
source.Image = {
    defaultImageLoadFunction: defaultImageLoadFunction
};
export { source };

const tilegrid = {};
tilegrid.TileGrid = TileGrid;
export { tilegrid };

const style = {};
style.Style = Style;
style.RegularShape = RegularShape;
style.Circle = s_Circle;
style.Fill = Fill;
style.Icon = Icon;
style.Stroke = Stroke;
style.Style = Style;
style.Text = Text;
style.IconAnchorUnits = IconAnchorUnits;
style.IconOrigin = IconOrigin;
export { style };

const xml = {};
xml.parse = parse;
xml.parseNode = parseNode;
xml.createElementNS = createElementNS;
xml.pushParseAndPop = pushParseAndPop;
xml.pushSerializeAndPop = pushSerializeAndPop;
xml.makeStructureNS = makeStructureNS;
xml.getAllTextContent = getAllTextContent;
xml.makeChildAppender = makeChildAppender;
xml.makeReplacer = makeReplacer;
xml.makeSequence = makeSequence;
xml.makeArrayPusher = makeArrayPusher;
xml.makeArrayExtender = makeArrayExtender;
xml.makeArraySerializer = makeArraySerializer;
xml.makeObjectPropertySetter = makeObjectPropertySetter;
xml.makeSimpleNodeFactory = makeSimpleNodeFactory;
xml.OBJECT_PROPERTY_NODE_FACTORY = OBJECT_PROPERTY_NODE_FACTORY;
xml.XML_SCHEMA_INSTANCE_URI = XML_SCHEMA_INSTANCE_URI;
export { xml };

/**
 * @module ol/format/KML
 */
import KML_ol from 'ol/format/KML';
import Feature from 'ol/Feature.js';
import Fill from 'ol/style/Fill.js';
import GeometryCollection from 'ol/geom/GeometryCollection.js';
import GeometryLayout from 'ol/geom/GeometryLayout.js';
import Icon from 'ol/style/Icon.js';
import IconAnchorUnits from 'ol/style/IconAnchorUnits.js';
import IconOrigin from 'ol/style/IconOrigin.js';
import ImageState from 'ol/ImageState.js';
import LineString from 'ol/geom/LineString.js';
import MultiLineString from 'ol/geom/MultiLineString.js';
import MultiPoint from 'ol/geom/MultiPoint.js';
import MultiPolygon from 'ol/geom/MultiPolygon.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import { OBJECT_PROPERTY_NODE_FACTORY, XML_SCHEMA_INSTANCE_URI, createElementNS, getAllTextContent, isDocument, makeArrayExtender, makeArrayPusher, makeChildAppender, makeObjectPropertySetter, makeReplacer, makeSequence, makeSimpleNodeFactory, makeStructureNS, parse, parseNode, pushParseAndPop, pushSerializeAndPop, getDocument, } from 'ol/xml.js';
import { asArray } from 'ol/color.js';
import { assert } from 'ol/asserts.js';
import { extend, includes } from 'ol/array.js';
import { get as getProjection } from 'ol/proj.js';
import { readBoolean, readDecimal, readString, writeBooleanTextNode, writeCDATASection, writeDecimalTextNode, writeStringTextNode, } from 'ol/format/xsd.js';
import { toRadians } from 'ol/math.js';
import { transformGeometryWithOptions } from 'ol/format/Feature.js';

const GeometryType = {
    POINT: 'Point',
    LINE_STRING: 'LineString',
    LINEAR_RING: 'LinearRing',
    POLYGON: 'Polygon',
    MULTI_POINT: 'MultiPoint',
    MULTI_LINE_STRING: 'MultiLineString',
    MULTI_POLYGON: 'MultiPolygon',
    GEOMETRY_COLLECTION: 'GeometryCollection',
    CIRCLE: 'Circle'
};

/**
 * @typedef {Object} Vec2
 * @property {number} x X coordinate.
 * @property {import("../style/IconAnchorUnits").default} xunits Units of x.
 * @property {number} y Y coordinate.
 * @property {import("../style/IconAnchorUnits").default} yunits Units of Y.
 * @property {import("../style/IconOrigin.js").default} [origin] Origin.
 */
/**
 * @typedef {Object} GxTrackObject
 * @property {Array<Array<number>>} coordinates Coordinates.
 * @property {Array<number>} whens Whens.
 */
/**
 * @const
 * @type {Array<string>}
 */
var GX_NAMESPACE_URIS = ['http://www.google.com/kml/ext/2.2'];
/**
 * @const
 * @type {Array<null|string>}
 */
var NAMESPACE_URIS = [
    null,
    'http://earth.google.com/kml/2.0',
    'http://earth.google.com/kml/2.1',
    'http://earth.google.com/kml/2.2',
    'http://www.opengis.net/kml/2.2',
];

// GLS: Obtenemos las combinaciones posibles
const getAllCombinations = function (array) {
    var combi = [];
    var temp = [];

    var len = Math.pow(2, array.length);

    for (var i = 0; i < len; i++) {
        temp = [];
        for (var j = 0; j < array.length; j++) {
            if ((i & Math.pow(2, j))) {
                if (temp.indexOf(array[j]) == -1)
                    temp.push(array[j]);
            }
        }
        if (temp.length > 0) {
            if (combi.indexOf(temp.join(' ')) == -1)
                combi.push(temp.join(' '));
        }
    }

    return combi;
}

// GLS: Limpiamos de los nuevos los URIS ya disponibles en el formato
const cleanCombinationsByFormat = function (customURIS, formatURIS) {
    if (customURIS && customURIS.length > 0) {
        for (var i = 0; i < formatURIS.length; i++) {
            var index = customURIS.indexOf(formatURIS[i]);
            if (index > -1)
                customURIS.splice(index, 1);
        }
    }
};

// GLS: Obtenemos los nuevos URIS para KML
const CUSTOM_NAMESPACE_URIS = getAllCombinations(NAMESPACE_URIS.slice().slice(1));
// GLS: Nos quedamos con las combinaciones nuevas
cleanCombinationsByFormat(CUSTOM_NAMESPACE_URIS, NAMESPACE_URIS);
NAMESPACE_URIS = NAMESPACE_URIS.concat(CUSTOM_NAMESPACE_URIS);

/**
 * @const
 * @type {string}
 */
var SCHEMA_LOCATION = 'http://www.opengis.net/kml/2.2 ' +
    'https://developers.google.com/kml/schema/kml22gx.xsd';
/**
 * @type {Object<string, import("../style/IconAnchorUnits").default>}
 */
var ICON_ANCHOR_UNITS_MAP = {
    'fraction': IconAnchorUnits.FRACTION,
    'pixels': IconAnchorUnits.PIXELS,
    'insetPixels': IconAnchorUnits.PIXELS,
};
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var PLACEMARK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'ExtendedData': extendedDataParser,
    'Region': regionParser,
    'MultiGeometry': makeObjectPropertySetter(readMultiGeometry, 'geometry'),
    'LineString': makeObjectPropertySetter(readLineString, 'geometry'),
    'LinearRing': makeObjectPropertySetter(readLinearRing, 'geometry'),
    'Point': makeObjectPropertySetter(readPoint, 'geometry'),
    'Polygon': makeObjectPropertySetter(readPolygon, 'geometry'),
    'Style': makeObjectPropertySetter(readStyle),
    'StyleMap': placemarkStyleMapParser,
    'address': makeObjectPropertySetter(readString),
    'description': makeObjectPropertySetter(readString),
    'name': makeObjectPropertySetter(readString),
    'open': makeObjectPropertySetter(readBoolean),
    'phoneNumber': makeObjectPropertySetter(readString),
    'styleUrl': makeObjectPropertySetter(readStyleURL),
    'visibility': makeObjectPropertySetter(readBoolean),
}, makeStructureNS(GX_NAMESPACE_URIS, {
    'MultiTrack': makeObjectPropertySetter(readGxMultiTrack, 'geometry'),
    'Track': makeObjectPropertySetter(readGxTrack, 'geometry'),
}));
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var NETWORK_LINK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'ExtendedData': extendedDataParser,
    'Region': regionParser,
    'Link': linkParser,
    'address': makeObjectPropertySetter(readString),
    'description': makeObjectPropertySetter(readString),
    'name': makeObjectPropertySetter(readString),
    'open': makeObjectPropertySetter(readBoolean),
    'phoneNumber': makeObjectPropertySetter(readString),
    'visibility': makeObjectPropertySetter(readBoolean),
});
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var LINK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'href': makeObjectPropertySetter(readURI),
});
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var REGION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'LatLonAltBox': latLonAltBoxParser,
    'Lod': lodParser,
});
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var KML_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['Document', 'Placemark']);
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var KML_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'Document': makeChildAppender(writeDocument),
    'Placemark': makeChildAppender(writePlacemark),
});
/**
 * @type {import("../color.js").Color}
 */
var DEFAULT_COLOR;
/**
 * @type {Fill}
 */
var DEFAULT_FILL_STYLE = null;
/**
 * Get the default fill style (or null if not yet set).
 * @return {Fill} The default fill style.
 */
export function getDefaultFillStyle() {
    return DEFAULT_FILL_STYLE;
}
/**
 * @type {import("../size.js").Size}
 */
var DEFAULT_IMAGE_STYLE_ANCHOR;
/**
 * @type {import("../style/IconAnchorUnits").default}
 */
var DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
/**
 * @type {import("../style/IconAnchorUnits").default}
 */
var DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
/**
 * @type {import("../size.js").Size}
 */
var DEFAULT_IMAGE_STYLE_SIZE;
/**
 * @type {string}
 */
var DEFAULT_IMAGE_STYLE_SRC;
/**
 * @type {import("../style/Image.js").default}
 */
var DEFAULT_IMAGE_STYLE = null;
/**
 * Get the default image style (or null if not yet set).
 * @return {import("../style/Image.js").default} The default image style.
 */
export function getDefaultImageStyle() {
    return DEFAULT_IMAGE_STYLE;
}
/**
 * @type {string}
 */
var DEFAULT_NO_IMAGE_STYLE;
/**
 * @type {Stroke}
 */
var DEFAULT_STROKE_STYLE = null;
/**
 * Get the default stroke style (or null if not yet set).
 * @return {Stroke} The default stroke style.
 */
export function getDefaultStrokeStyle() {
    return DEFAULT_STROKE_STYLE;
}
/**
 * @type {Stroke}
 */
var DEFAULT_TEXT_STROKE_STYLE;
/**
 * @type {Text}
 */
var DEFAULT_TEXT_STYLE = null;
/**
 * Get the default text style (or null if not yet set).
 * @return {Text} The default text style.
 */
export function getDefaultTextStyle() {
    return DEFAULT_TEXT_STYLE;
}
/**
 * @type {Style}
 */
var DEFAULT_STYLE = null;
/**
 * Get the default style (or null if not yet set).
 * @return {Style} The default style.
 */
export function getDefaultStyle() {
    return DEFAULT_STYLE;
}
/**
 * @type {Array<Style>}
 */
var DEFAULT_STYLE_ARRAY = null;
/**
 * Get the default style array (or null if not yet set).
 * @return {Array<Style>} The default style.
 */
export function getDefaultStyleArray() {
    return DEFAULT_STYLE_ARRAY;
}

const getRGBA = function (color, opacity) {
    var result;
    if (color) {
        result = asArray(color);
        result = result.slice();
        if (opacity !== undefined) {
            result[3] = opacity;
        }
    }
    else {
        result = [0, 0, 0, 1];
    }
    return result;
};

/**
 * Function that returns the scale needed to normalize an icon image to 32 pixels.
 * @param {import("../size.js").Size} size Image size.
 * @return {number} Scale.
 */
function scaleForSize(size) {
    return 32 / Math.min(size[0], size[1]);
}
function createStyleDefaults() {
    // Rehacemos los estilos por defecto de KML para que se adec�en al de la API
    DEFAULT_COLOR = [255, 255, 255, 1];
    DEFAULT_FILL_STYLE = new Fill({
        color: getRGBA(TC.Cfg.styles.polygon.fillColor, TC.Cfg.styles.polygon.fillOpacity)
    });
    DEFAULT_IMAGE_STYLE_ANCHOR = [20, 2];
    DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS = IconAnchorUnits.PIXELS;
    DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS = IconAnchorUnits.PIXELS;
    DEFAULT_IMAGE_STYLE_SIZE = [64, 64];
    DEFAULT_IMAGE_STYLE_SRC =
        'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';
    DEFAULT_IMAGE_STYLE = new Icon({
        anchor: DEFAULT_IMAGE_STYLE_ANCHOR,
        anchorOrigin: IconOrigin.BOTTOM_LEFT,
        anchorXUnits: DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS,
        anchorYUnits: DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS,
        crossOrigin: 'anonymous',
        rotation: 0,
        scale: scaleForSize(DEFAULT_IMAGE_STYLE_SIZE),
        size: DEFAULT_IMAGE_STYLE_SIZE,
        src: DEFAULT_IMAGE_STYLE_SRC,
    });
    DEFAULT_NO_IMAGE_STYLE = 'NO_IMAGE';
    DEFAULT_STROKE_STYLE = new Stroke({
        color: DEFAULT_COLOR,
        width: 1,
    });
    DEFAULT_TEXT_STROKE_STYLE = new Stroke({
        color: getRGBA(TC.Cfg.styles.label.strokeColor, 1),
        width: TC.Cfg.styles.label.strokeWidth || 1
    });
    DEFAULT_TEXT_STYLE = new Text({
        font: 'bold 16px Helvetica',
        fill: new Fill({
            color: getRGBA(TC.Cfg.styles.label.fillColor, 1)
        }),
        stroke: DEFAULT_TEXT_STROKE_STYLE,
        scale: 0.8,
    });
    DEFAULT_STYLE = new Style({
        fill: DEFAULT_FILL_STYLE,
        image: DEFAULT_IMAGE_STYLE,
        text: DEFAULT_TEXT_STYLE,
        stroke: DEFAULT_STROKE_STYLE,
        zIndex: 0,
    });
    DEFAULT_STYLE_ARRAY = [DEFAULT_STYLE];
}
/**
 * @type {HTMLTextAreaElement}
 */
var TEXTAREA;
/**
 * A function that takes a url `{string}` and returns a url `{string}`.
 * Might be used to change an icon path or to substitute a
 * data url obtained from a KMZ array buffer.
 *
 * @typedef {function(string):string} IconUrlFunction
 * @api
 */
/**
 * Function that returns a url unchanged.
 * @param {string} href Input url.
 * @return {string} Output url.
 */
function defaultIconUrlFunction(href) {
    return href;
}
/**
 * @typedef {Object} Options
 * @property {boolean} [extractStyles=true] Extract styles from the KML.
 * @property {boolean} [showPointNames=true] Show names as labels for placemarks which contain points.
 * @property {Array<Style>} [defaultStyle] Default style. The
 * default default style is the same as Google Earth.
 * @property {boolean} [writeStyles=true] Write styles into KML.
 * @property {null|string} [crossOrigin='anonymous'] The `crossOrigin` attribute for loaded images. Note that you must provide a
 * `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * @property {IconUrlFunction} [iconUrlFunction] Function that takes a url string and returns a url string.
 * Might be used to change an icon path or to substitute a data url obtained from a KMZ array buffer.
 */
/**
 * @classdesc
 * Feature format for reading and writing data in the KML format.
 *
 * {@link module:ol/format/KML~KML#readFeature} will read the first feature from
 * a KML source.
 *
 * MultiGeometries are converted into GeometryCollections if they are a mix of
 * geometry types, and into MultiPoint/MultiLineString/MultiPolygon if they are
 * all of the same type.
 *
 * Note that the KML format uses the URL() constructor. Older browsers such as IE
 * which do not support this will need a URL polyfill to be loaded before use.
 *
 * @api
 */

class KML extends KML_ol {
    constructor(opt_options) {
        super();

        if (!DEFAULT_STYLE_ARRAY) {
            createStyleDefaults();
        }
    }
}

KML.prototype.readDocumentOrFolder_ = function (node, objectStack) {
    // FIXME use scope somehow
    var parsersNS = makeStructureNS(NAMESPACE_URIS, {
        'Document': makeArrayExtender(this.readDocumentOrFolder_, this),
        'Folder': makeArrayExtender(this.readDocumentOrFolder_, this),
        'Placemark': makeArrayPusher(this.readPlacemark_, this),
        'Style': this.readSharedStyle_.bind(this),
        'StyleMap': this.readSharedStyleMap_.bind(this),
    });
    /** @type {Array<Feature>} */
    // @ts-ignore
    var features = pushParseAndPop([], parsersNS, node, objectStack, this);
    if (features) {
        // Reescritura de c�digo para leer las carpetas o documentos del KML
        const nameElm = node.getElementsByTagName('name')[0];
        let folderOrDocName = nameElm && (nameElm.innerHTML || nameElm.textContent);
        features.forEach(feature => {
            if (!Array.isArray(feature._folders)) {
                feature._folders = [];
            }
            if (folderOrDocName) {
                feature._folders.unshift(folderOrDocName);
            }
        });
        ///////////////////////////////////////////////////////
        return features;
    }
    else {
        return undefined;
    }
};

KML.prototype.readPlacemark_ = function (node, objectStack) {
    var object = pushParseAndPop({ 'geometry': null }, PLACEMARK_PARSERS, node, objectStack, this);
    if (!object) {
        return undefined;
    }
    var feature = new Feature();
    var id = node.getAttribute('id');
    if (id !== null) {
        feature.setId(id);
    }
    var options = /** @type {import("./Feature.js").ReadOptions} */ (objectStack[0]);
    var geometry = object['geometry'];
    if (geometry) {
        transformGeometryWithOptions(geometry, false, options);
    }
    feature.setGeometry(geometry);
    delete object['geometry'];
    if (this.extractStyles_) {
        var style = object['Style'];
        var styleUrl = object['styleUrl'];
        var styleFunction = createFeatureStyleFunction(style, styleUrl, this.defaultStyle_, this.sharedStyles_, this.showPointNames_);
        feature.setStyle(styleFunction);
    }
    delete object['Style'];
    // we do not remove the styleUrl property from the object, so it
    // gets stored on feature when setProperties is called
    delete object.styleUrl;//URI:Me veo obligado a eliminar el atributo styleUrl porque se muestra en el bocadillo de las features

    feature.setProperties(object, true);
    return feature;
};

KML.prototype.readSharedStyle_ = function (node, objectStack) {
    var id = node.getAttribute('id');
    if (id !== null) {
        var style = readStyle.call(this, node, objectStack);
        if (style) {
            var styleUri = void 0;
            var baseURI = node.baseURI;
            if (!baseURI || baseURI == 'about:blank') {
                baseURI = window.location.href;
            }
            if (baseURI) {
                var url = new URL('#' + id, baseURI);
                styleUri = url.href;
            }
            else {
                styleUri = '#' + id;
            }
            this.sharedStyles_[styleUri] = style;
        }
    }
};

KML.prototype.readFeaturesFromNode = function (node, opt_options) {
    if (!includes(NAMESPACE_URIS, node.namespaceURI)) {
        return [];
    }
    var features;
    var localName = node.localName;
    if (localName == 'Document' || localName == 'Folder') {
        features = this.readDocumentOrFolder_(node, [
            this.getReadOptions(node, opt_options),
        ]);
        if (features) {
            return features;
        }
        else {
            return [];
        }
    }
    else if (localName == 'Placemark') {
        var feature = this.readPlacemark_(node, [
            this.getReadOptions(node, opt_options),
        ]);
        if (feature) {
            return [feature];
        }
        else {
            return [];
        }
    }
    else if (localName == 'kml') {
        features = [];
        for (var n = node.firstElementChild; n; n = n.nextElementSibling) {
            var fs = this.readFeaturesFromNode(n, opt_options);
            if (fs) {
                extend(features, fs);
            }
        }
        ///////
        features.forEach(function (f) {
            if (!f.getId()) {
                f.setId(TC.getUID());
            }
        });
        ///////
        return features;
    }
    else {
        return [];
    }
};

KML.prototype.writeFeaturesNode = function (features, opt_options) {
    opt_options = this.adaptOptions(opt_options);
    var kml = createElementNS(NAMESPACE_URIS[4], 'kml');
    var xmlnsUri = 'http://www.w3.org/2000/xmlns/';
    kml.setAttributeNS(xmlnsUri, 'xmlns:gx', GX_NAMESPACE_URIS[0]);
    kml.setAttributeNS(xmlnsUri, 'xmlns:xsi', XML_SCHEMA_INSTANCE_URI);
    kml.setAttributeNS(XML_SCHEMA_INSTANCE_URI, 'xsi:schemaLocation', SCHEMA_LOCATION);
    var /** @type {import("../xml.js").NodeStackItem} */ context = {
        node: kml,
    };
    /** @type {!Object<string, (Array<Feature>|Feature|undefined)>} */
    var properties = {};
    // Organizamos en carpetas
    const featuresWithoutFolder = [];
    let folderTree = [];
    const addBranch = function (arr, feature, idx) {
        if (idx >= feature._folders.length) {
            arr.push(feature);
        }
        else {
            let child = arr.find(elm => elm._name === feature._folders[idx]);
            if (!child) {
                child = [];
                child._name = feature._folders[idx];
                arr.push(child);
            }
            addBranch(child, feature, idx + 1);
        }
    };
    features.forEach(function (feature) {
        if (feature._folders) {
            addBranch(folderTree, feature, 0);
        }
        else {
            featuresWithoutFolder.push(feature);
        }
    });
    // Si solamente hay un primer nivel de carpeta, la transformamos en documento.
    if (folderTree.length === 1) {
        folderTree = folderTree[0];
    }
    const documentName = folderTree._name;
    if (!Array.isArray(folderTree)) {
        folderTree = [folderTree];
    }
    folderTree = folderTree.concat(featuresWithoutFolder);
    folderTree._name = documentName;
    properties['Document'] = folderTree;
    ////////////////////////////
    var orderedKeys = KML_SEQUENCE[kml.namespaceURI];
    var values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(context, KML_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, values, [opt_options], orderedKeys, this);
    return kml;
};

function createNameStyleFunction(foundStyle, name) {
    if (!DEFAULT_TEXT_STYLE) createStyleDefaults();
    var textOffset = [0, 0];
    var textAlign = 'start';
    var imageStyle = foundStyle.getImage();
    if (imageStyle) {
        var imageSize = imageStyle.getSize();
        if (imageSize && imageSize.length == 2) {
            var imageScale = imageStyle.getScaleArray();
            var anchor = imageStyle.getAnchor();
            // Offset the label to be centered to the right of the icon,
            // if there is one.
            textOffset[0] = imageScale[0] * (imageSize[0] - anchor[0]);
            textOffset[1] = imageScale[1] * (imageSize[1] / 2 - anchor[1]);
            textAlign = 'left';
        }
    }
    var textStyle = foundStyle.getText();
    if (textStyle) {
        // clone the text style, customizing it with name, alignments and offset.
        // Note that kml does not support many text options that OpenLayers does (rotation, textBaseline).
        textStyle = textStyle.clone();
        textStyle.setFont(textStyle.getFont() || DEFAULT_TEXT_STYLE.getFont());
        textStyle.setScale(textStyle.getScale() || DEFAULT_TEXT_STYLE.getScale());
        textStyle.setFill(textStyle.getFill() || DEFAULT_TEXT_STYLE.getFill());
        textStyle.setStroke(textStyle.getStroke() || DEFAULT_TEXT_STROKE_STYLE);
    }
    else {
        textStyle = DEFAULT_TEXT_STYLE.clone();
    }
    textStyle.setText(name);
    textStyle.setOffsetX(textOffset[0]);
    textStyle.setOffsetY(textOffset[1]);
    textStyle.setTextAlign(textAlign);
    var nameStyle = new Style({
        image: imageStyle,
        text: textStyle,
    });
    if (foundStyle._balloon)
        nameStyle._balloon = foundStyle._balloon;
    return nameStyle;
}
/**
 * @param {Array<Style>|undefined} style Style.
 * @param {string} styleUrl Style URL.
 * @param {Array<Style>} defaultStyle Default style.
 * @param {!Object<string, (Array<Style>|string)>} sharedStyles Shared styles.
 * @param {boolean|undefined} showPointNames true to show names for point placemarks.
 * @return {import("../style/Style.js").StyleFunction} Feature style function.
 */
function createFeatureStyleFunction(style, styleUrl, defaultStyle, sharedStyles, showPointNames) {
    return (
        /**
         * @param {Feature} feature feature.
         * @param {number} resolution Resolution.
         * @return {Array<Style>|Style} Style.
         */
        function (feature, resolution) {
            var drawName = showPointNames;
            var name = '';
            var multiGeometryPoints = [];
            if (drawName) {
                var geometry = feature.getGeometry();
                if (geometry) {
                    var type = geometry.getType();
                    if (type === GeometryType.GEOMETRY_COLLECTION) {
                        multiGeometryPoints = geometry
                            .getGeometriesArrayRecursive()
                            .filter(function (geometry) {
                                var type = geometry.getType();
                                return (type === GeometryType.POINT ||
                                    type === GeometryType.MULTI_POINT);
                            });
                        drawName = multiGeometryPoints.length > 0;
                    }
                    else {
                        drawName =
                            type === GeometryType.POINT || type === GeometryType.MULTI_POINT;
                    }
                }
            }
            if (drawName) {
                name = /** @type {string} */ (feature.get('name'));
                drawName = drawName && !!name;
                // convert any html character codes
                if (drawName && name.search(/&[^&]+;/) > -1) {
                    if (!TEXTAREA) {
                        TEXTAREA = document.createElement('textarea');
                    }
                    TEXTAREA.innerHTML = name;
                    name = TEXTAREA.value;
                }
            }
            var featureStyle = defaultStyle;
            if (style) {
                featureStyle = style;
            }
            else if (styleUrl) {
                featureStyle = findStyle(styleUrl, defaultStyle, sharedStyles);
            }
            if (drawName) {
                var nameStyle = createNameStyleFunction(featureStyle[0], name);
                if (multiGeometryPoints.length > 0) {
                    // in multigeometries restrict the name style to points and create a
                    // style without image or text for geometries requiring fill or stroke
                    // including any polygon specific style if there is one
                    nameStyle.setGeometry(new GeometryCollection(multiGeometryPoints));
                    var baseStyle = new Style({
                        geometry: featureStyle[0].getGeometry(),
                        image: null,
                        fill: featureStyle[0].getFill(),
                        stroke: featureStyle[0].getStroke(),
                        text: null,
                    });
                    return [nameStyle, baseStyle].concat(featureStyle.slice(1));
                }
                return nameStyle;
            }
            return featureStyle;
        });
}
/**
 * @param {Array<Style>|string|undefined} styleValue Style value.
 * @param {Array<Style>} defaultStyle Default style.
 * @param {!Object<string, (Array<Style>|string)>} sharedStyles
 * Shared styles.
 * @return {Array<Style>} Style.
 */
function findStyle(styleValue, defaultStyle, sharedStyles) {
    if (Array.isArray(styleValue)) {
        return styleValue;
    }
    else if (typeof styleValue === 'string') {
        return findStyle(sharedStyles[styleValue], defaultStyle, sharedStyles);
    }
    else {
        return defaultStyle;
    }
}
/**
 * @param {Node} node Node.
 * @return {import("../color.js").Color|undefined} Color.
 */
function readColor(node) {
    var s = getAllTextContent(node, false);
    // The KML specification states that colors should not include a leading `#`
    // but we tolerate them.
    var m = /^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(s);
    if (m) {
        var hexColor = m[1];
        return [
            parseInt(hexColor.substr(6, 2), 16),
            parseInt(hexColor.substr(4, 2), 16),
            parseInt(hexColor.substr(2, 2), 16),
            parseInt(hexColor.substr(0, 2), 16) / 255,
        ];
    }
    else {
        return undefined;
    }
}
/**
 * @param {Node} node Node.
 * @return {Array<number>|undefined} Flat coordinates.
 */
export function readFlatCoordinates(node) {
    var s = getAllTextContent(node, false);
    var flatCoordinates = [];
    // The KML specification states that coordinate tuples should not include
    // spaces, but we tolerate them.
    s = s.replace(/\s*,\s*/g, ',');
    var re = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?),([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s+|,|$)(?:([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s+|$))?\s*/i;
    var m;
    while ((m = re.exec(s))) {
        var x = parseFloat(m[1]);
        var y = parseFloat(m[2]);
        var z = m[3] ? parseFloat(m[3]) : 0;
        flatCoordinates.push(x, y, z);
        s = s.substr(m[0].length);
    }
    if (s !== '') {
        return undefined;
    }
    return flatCoordinates;
}
/**
 * @param {Node} node Node.
 * @return {string} URI.
 */
function readURI(node) {
    var s = getAllTextContent(node, false).trim();
    var baseURI = node.baseURI;
    if (!baseURI || baseURI == 'about:blank') {
        baseURI = window.location.href;
    }
    if (baseURI) {
        // flacunza: Parche para evitar peticiones HTTP desde una p�gina HTTPS
        if (location.protocol === 'https:' && baseURI.indexOf('http://') === 0) {
            baseURI = baseURI.substr(5);
        }
        var url = new URL(s, baseURI);
        return url.href;
    }
    else {
        return s;
    }
}
/**
 * @param {Node} node Node.
 * @return {string} URI.
 */
function readStyleURL(node) {
    // KML files in the wild occasionally forget the leading
    // `#` on styleUrlsdefined in the same document.
    var s = getAllTextContent(node, false)
        .trim()
        .replace(/^(?!.*#)/, '#');
    var baseURI = node.baseURI;
    if (!baseURI || baseURI == 'about:blank') {
        baseURI = window.location.href;
    }
    if (baseURI) {
        var url = new URL(s, baseURI);
        return url.href;
    }
    else {
        return s;
    }
}
/**
 * @param {Element} node Node.
 * @return {Vec2} Vec2.
 */
function readVec2(node) {
    var xunits = node.getAttribute('xunits');
    var yunits = node.getAttribute('yunits');
    var origin;
    if (xunits !== 'insetPixels') {
        if (yunits !== 'insetPixels') {
            origin = IconOrigin.BOTTOM_LEFT;
        }
        else {
            origin = IconOrigin.TOP_LEFT;
        }
    }
    else {
        if (yunits !== 'insetPixels') {
            origin = IconOrigin.BOTTOM_RIGHT;
        }
        else {
            origin = IconOrigin.TOP_RIGHT;
        }
    }
    return {
        x: parseFloat(node.getAttribute('x')),
        xunits: ICON_ANCHOR_UNITS_MAP[xunits],
        y: parseFloat(node.getAttribute('y')),
        yunits: ICON_ANCHOR_UNITS_MAP[yunits],
        origin: origin,
    };
}
/**
 * @param {Node} node Node.
 * @return {number|undefined} Scale.
 */
function readScale(node) {
    return readDecimal(node);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var STYLE_MAP_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'Pair': pairDataParser,
});
/**
 * @this {KML}
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<Style>|string|undefined} StyleMap.
 */
function readStyleMapValue(node, objectStack) {
    return pushParseAndPop(undefined, STYLE_MAP_PARSERS, node, objectStack, this);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var ICON_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'Icon': makeObjectPropertySetter(readIcon),
    'color': makeObjectPropertySetter(readColor),
    'heading': makeObjectPropertySetter(readDecimal),
    'hotSpot': makeObjectPropertySetter(readVec2),
    'scale': makeObjectPropertySetter(readScale),
});

// Creamos un parser para interpretar la plantilla de los bocadillos
const readText = function (node, objectStack) {
    ol.asserts.assert(node.nodeType == Node.ELEMENT_NODE);
    ol.asserts.assert(node.localName == 'text');
    var s = ol.format.xsd.readString(node);
    return s.trim();
};

const balloonStyleParser = function (node, objectStack) {
    ol.asserts.assert(node.nodeType == Node.ELEMENT_NODE);
    ol.asserts.assert(node.localName == 'BalloonStyle');
    // FIXME colorMode
    var object = ol.xml.pushParseAndPop(
        {}, BALLOON_STYLE_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    const styleObject = objectStack[objectStack.length - 1];
    const type = typeof styleObject;
    ol.asserts.assert(type == 'object' && styleObject != null || type == 'function');
    var textStyle = new ol.style.Text({
        text: (object['text'])
    });
    styleObject['balloonStyle'] = textStyle;
};

const BALLOON_STYLE_PARSERS = makeStructureNS(
    NAMESPACE_URIS, {
    'text': makeObjectPropertySetter(readText),
});

/**
 * @this {KML}
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function iconStyleParser(node, objectStack) {
    // FIXME refreshMode
    // FIXME refreshInterval
    // FIXME viewRefreshTime
    // FIXME viewBoundScale
    // FIXME viewFormat
    // FIXME httpQuery
    var object = pushParseAndPop({}, ICON_STYLE_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    var styleObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    var IconObject = 'Icon' in object ? object['Icon'] : {};
    var drawIcon = !('Icon' in object) || Object.keys(IconObject).length > 0;
    var src;
    var href = /** @type {string|undefined} */ (IconObject['href']);
    if (href) {
        src = href;
    }
    else if (drawIcon) {
        src = DEFAULT_IMAGE_STYLE_SRC;
    }
    var anchor, anchorXUnits, anchorYUnits;
    var anchorOrigin = IconOrigin.BOTTOM_LEFT;
    var hotSpot = /** @type {Vec2|undefined} */ (object['hotSpot']);
    if (hotSpot) {
        anchor = [hotSpot.x, hotSpot.y];
        anchorXUnits = hotSpot.xunits;
        anchorYUnits = hotSpot.yunits;
        anchorOrigin = hotSpot.origin;
    }
    else if (/^http:\/\/maps\.(?:google|gstatic)\.com\//.test(src)) {
        // Google hotspots from https://kml4earth.appspot.com/icons.html#notes
        if (/pushpin/.test(src)) {
            anchor = DEFAULT_IMAGE_STYLE_ANCHOR;
            anchorXUnits = DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
            anchorYUnits = DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
        }
        else if (/arrow-reverse/.test(src)) {
            anchor = [54, 42];
            anchorXUnits = DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
            anchorYUnits = DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
        }
        else if (/paddle/.test(src)) {
            anchor = [32, 1];
            anchorXUnits = DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
            anchorYUnits = DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
        }
    }
    // A�adimos este control para evitar problemas CORS en Firefox
    if (drawIcon && /Firefox/.test(navigator.userAgent) && location.protocol === 'https:' && src.startsWith("http:")) {
        src = src.replace("http:", "https:");
    }
    var offset;
    var x = /** @type {number|undefined} */ (IconObject['x']);
    var y = /** @type {number|undefined} */ (IconObject['y']);
    if (x !== undefined && y !== undefined) {
        offset = [x, y];
    }
    var size;
    var w = /** @type {number|undefined} */ (IconObject['w']);
    var h = /** @type {number|undefined} */ (IconObject['h']);
    if (w !== undefined && h !== undefined) {
        size = [w, h];
    }
    var rotation;
    var heading = /** @type {number} */ (object['heading']);
    if (heading !== undefined) {
        rotation = toRadians(heading);
    }
    var scale = /** @type {number|undefined} */ (object['scale']);
    var color = /** @type {Array<number>|undefined} */ (object['color']);
    if (drawIcon) {
        if (src == DEFAULT_IMAGE_STYLE_SRC) {
            size = DEFAULT_IMAGE_STYLE_SIZE;
        }
        var imageStyle_1 = new Icon({
            anchor: anchor,
            anchorOrigin: anchorOrigin,
            anchorXUnits: anchorXUnits,
            anchorYUnits: anchorYUnits,
            crossOrigin: this.crossOrigin_,
            offset: offset,
            offsetOrigin: IconOrigin.BOTTOM_LEFT,
            rotation: rotation,
            scale: scale,
            size: size,
            src: this.iconUrlFunction_(src),
            color: color,
        });
        var imageScale_1 = imageStyle_1.getScaleArray()[0];
        var imageSize = imageStyle_1.getSize();
        if (imageSize === null) {
            var imageState = imageStyle_1.getImageState();
            if (imageState === ImageState.IDLE || imageState === ImageState.LOADING) {
                var listener_1 = function () {
                    var imageState = imageStyle_1.getImageState();
                    if (!(imageState === ImageState.IDLE ||
                        imageState === ImageState.LOADING)) {
                        var imageSize_1 = imageStyle_1.getSize();
                        if (imageSize_1 && imageSize_1.length == 2) {
                            var resizeScale = scaleForSize(imageSize_1);
                            imageStyle_1.setScale(imageScale_1 * resizeScale);
                        }
                        imageStyle_1.unlistenImageChange(listener_1);
                    }
                };
                imageStyle_1.listenImageChange(listener_1);
                if (imageState === ImageState.IDLE) {
                    imageStyle_1.load();
                }
            }
        }
        else if (imageSize.length == 2) {
            var resizeScale = scaleForSize(imageSize);
            imageStyle_1.setScale(imageScale_1 * resizeScale);
        }
        styleObject['imageStyle'] = imageStyle_1;
    }
    else {
        // handle the case when we explicitly want to draw no icon.
        styleObject['imageStyle'] = DEFAULT_NO_IMAGE_STYLE;
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var LABEL_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeObjectPropertySetter(readColor),
    'scale': makeObjectPropertySetter(readScale),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function labelStyleParser(node, objectStack) {
    // FIXME colorMode
    var object = pushParseAndPop({}, LABEL_STYLE_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    var styleObject = objectStack[objectStack.length - 1];
    var textStyle = new Text({
        fill: new Fill({
            color:
                /** @type {import("../color.js").Color} */
                ('color' in object ? object['color'] : DEFAULT_COLOR),
        }),
        scale: /** @type {number|undefined} */ (object['scale']),
    });
    styleObject['textStyle'] = textStyle;
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var LINE_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeObjectPropertySetter(readColor),
    'width': makeObjectPropertySetter(readDecimal),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function lineStyleParser(node, objectStack) {
    // FIXME colorMode
    // FIXME gx:outerColor
    // FIXME gx:outerWidth
    // FIXME gx:physicalWidth
    // FIXME gx:labelVisibility
    var object = pushParseAndPop({}, LINE_STYLE_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    var styleObject = objectStack[objectStack.length - 1];
    var strokeStyle = new Stroke({
        color:
            /** @type {import("../color.js").Color} */
            ('color' in object ? object['color'] : DEFAULT_COLOR),
        width: /** @type {number} */ ('width' in object ? object['width'] : 1),
    });
    styleObject['strokeStyle'] = strokeStyle;
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var POLY_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeObjectPropertySetter(readColor),
    'fill': makeObjectPropertySetter(readBoolean),
    'outline': makeObjectPropertySetter(readBoolean),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function polyStyleParser(node, objectStack) {
    // FIXME colorMode
    var object = pushParseAndPop({}, POLY_STYLE_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    var styleObject = objectStack[objectStack.length - 1];
    var fillStyle = new Fill({
        color:
            /** @type {import("../color.js").Color} */
            ('color' in object ? object['color'] : DEFAULT_COLOR),
    });
    styleObject['fillStyle'] = fillStyle;
    var fill = /** @type {boolean|undefined} */ (object['fill']);
    if (fill !== undefined) {
        styleObject['fill'] = fill;
    }
    var outline = /** @type {boolean|undefined} */ (object['outline']);
    if (outline !== undefined) {
        styleObject['outline'] = outline;
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var FLAT_LINEAR_RING_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'coordinates': makeReplacer(readFlatCoordinates),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<number>} LinearRing flat coordinates.
 */
function readFlatLinearRing(node, objectStack) {
    return pushParseAndPop(null, FLAT_LINEAR_RING_PARSERS, node, objectStack);
}
/**
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function gxCoordParser(node, objectStack) {
    var gxTrackObject =
        /** @type {GxTrackObject} */
        (objectStack[objectStack.length - 1]);
    var coordinates = gxTrackObject.coordinates;
    var s = getAllTextContent(node, false);
    var re = /^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*$/i;
    var m = re.exec(s);
    if (m) {
        var x = parseFloat(m[1]);
        var y = parseFloat(m[2]);
        var z = parseFloat(m[3]);
        coordinates.push([x, y, z]);
    }
    else {
        coordinates.push([]);
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var GX_MULTITRACK_GEOMETRY_PARSERS = makeStructureNS(GX_NAMESPACE_URIS, {
    'Track': makeArrayPusher(readGxTrack),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {MultiLineString|undefined} MultiLineString.
 */
function readGxMultiTrack(node, objectStack) {
    var lineStrings = pushParseAndPop([], GX_MULTITRACK_GEOMETRY_PARSERS, node, objectStack);
    if (!lineStrings) {
        return undefined;
    }
    return new MultiLineString(lineStrings);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var GX_TRACK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'when': whenParser,
}, makeStructureNS(GX_NAMESPACE_URIS, {
    'coord': gxCoordParser,
}));
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {LineString|undefined} LineString.
 */
function readGxTrack(node, objectStack) {
    var gxTrackObject = pushParseAndPop(
    /** @type {GxTrackObject} */({
            coordinates: [],
            whens: [],
        }), GX_TRACK_PARSERS, node, objectStack);
    if (!gxTrackObject) {
        return undefined;
    }
    var flatCoordinates = [];
    var coordinates = gxTrackObject.coordinates;
    var whens = gxTrackObject.whens;
    for (var i = 0, ii = Math.min(coordinates.length, whens.length); i < ii; ++i) {
        if (coordinates[i].length == 3) {
            flatCoordinates.push(coordinates[i][0], coordinates[i][1], coordinates[i][2], whens[i]);
        }
    }
    return new LineString(flatCoordinates, GeometryLayout.XYZM);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var ICON_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'href': makeObjectPropertySetter(readURI),
}, makeStructureNS(GX_NAMESPACE_URIS, {
    'x': makeObjectPropertySetter(readDecimal),
    'y': makeObjectPropertySetter(readDecimal),
    'w': makeObjectPropertySetter(readDecimal),
    'h': makeObjectPropertySetter(readDecimal),
}));
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object} Icon object.
 */
function readIcon(node, objectStack) {
    var iconObject = pushParseAndPop({}, ICON_PARSERS, node, objectStack);
    if (iconObject) {
        return iconObject;
    }
    else {
        return null;
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var GEOMETRY_FLAT_COORDINATES_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'coordinates': makeReplacer(readFlatCoordinates),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<number>} Flat coordinates.
 */
function readFlatCoordinatesFromNode(node, objectStack) {
    return pushParseAndPop(null, GEOMETRY_FLAT_COORDINATES_PARSERS, node, objectStack);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var EXTRUDE_AND_ALTITUDE_MODE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'extrude': makeObjectPropertySetter(readBoolean),
    'tessellate': makeObjectPropertySetter(readBoolean),
    'altitudeMode': makeObjectPropertySetter(readString),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {LineString|undefined} LineString.
 */
function readLineString(node, objectStack) {
    var properties = pushParseAndPop({}, EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node, objectStack);
    var flatCoordinates = readFlatCoordinatesFromNode(node, objectStack);
    if (flatCoordinates) {
        var lineString = new LineString(flatCoordinates, GeometryLayout.XYZ);
        lineString.setProperties(properties, true);
        return lineString;
    }
    else {
        return undefined;
    }
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Polygon|undefined} Polygon.
 */
function readLinearRing(node, objectStack) {
    var properties = pushParseAndPop({}, EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node, objectStack);
    var flatCoordinates = readFlatCoordinatesFromNode(node, objectStack);
    if (flatCoordinates) {
        var polygon = new Polygon(flatCoordinates, GeometryLayout.XYZ, [
            flatCoordinates.length,
        ]);
        polygon.setProperties(properties, true);
        return polygon;
    }
    else {
        return undefined;
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var MULTI_GEOMETRY_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'LineString': makeArrayPusher(readLineString),
    'LinearRing': makeArrayPusher(readLinearRing),
    'MultiGeometry': makeArrayPusher(readMultiGeometry),
    'Point': makeArrayPusher(readPoint),
    'Polygon': makeArrayPusher(readPolygon),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {import("../geom/Geometry.js").default} Geometry.
 */
function readMultiGeometry(node, objectStack) {
    var geometries = pushParseAndPop([], MULTI_GEOMETRY_PARSERS, node, objectStack);
    if (!geometries) {
        return null;
    }
    if (geometries.length === 0) {
        return new GeometryCollection(geometries);
    }
    var multiGeometry;
    var homogeneous = true;
    var type = geometries[0].getType();
    var geometry;
    for (var i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        if (geometry.getType() != type) {
            homogeneous = false;
            break;
        }
    }
    if (homogeneous) {
        var layout = void 0;
        var flatCoordinates = void 0;
        if (type == GeometryType.POINT) {
            var point = geometries[0];
            layout = point.getLayout();
            flatCoordinates = point.getFlatCoordinates();
            for (var i = 1, ii = geometries.length; i < ii; ++i) {
                geometry = geometries[i];
                extend(flatCoordinates, geometry.getFlatCoordinates());
            }
            multiGeometry = new MultiPoint(flatCoordinates, layout);
            setCommonGeometryProperties(multiGeometry, geometries);
        }
        else if (type == GeometryType.LINE_STRING) {
            multiGeometry = new MultiLineString(geometries);
            setCommonGeometryProperties(multiGeometry, geometries);
        }
        else if (type == GeometryType.POLYGON) {
            multiGeometry = new MultiPolygon(geometries);
            setCommonGeometryProperties(multiGeometry, geometries);
        }
        else if (type == GeometryType.GEOMETRY_COLLECTION) {
            multiGeometry = new GeometryCollection(geometries);
        }
        else {
            assert(false, 37); // Unknown geometry type found
        }
    }
    else {
        multiGeometry = new GeometryCollection(geometries);
    }
    return /** @type {import("../geom/Geometry.js").default} */ (multiGeometry);
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Point|undefined} Point.
 */
function readPoint(node, objectStack) {
    var properties = pushParseAndPop({}, EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node, objectStack);
    var flatCoordinates = readFlatCoordinatesFromNode(node, objectStack);
    if (flatCoordinates) {
        var point = new Point(flatCoordinates, GeometryLayout.XYZ);
        point.setProperties(properties, true);
        return point;
    }
    else {
        return undefined;
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var FLAT_LINEAR_RINGS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'innerBoundaryIs': innerBoundaryIsParser,
    'outerBoundaryIs': outerBoundaryIsParser,
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Polygon|undefined} Polygon.
 */
function readPolygon(node, objectStack) {
    var properties = pushParseAndPop(
    /** @type {Object<string,*>} */({}), EXTRUDE_AND_ALTITUDE_MODE_PARSERS, node, objectStack);
    var flatLinearRings = pushParseAndPop([null], FLAT_LINEAR_RINGS_PARSERS, node, objectStack);
    if (flatLinearRings && flatLinearRings[0]) {
        var flatCoordinates = flatLinearRings[0];
        var ends = [flatCoordinates.length];
        for (var i = 1, ii = flatLinearRings.length; i < ii; ++i) {
            extend(flatCoordinates, flatLinearRings[i]);
            ends.push(flatCoordinates.length);
        }
        var polygon = new Polygon(flatCoordinates, GeometryLayout.XYZ, ends);
        polygon.setProperties(properties, true);
        return polygon;
    }
    else {
        return undefined;
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'IconStyle': iconStyleParser,
    'LabelStyle': labelStyleParser,
    'LineStyle': lineStyleParser,
    'PolyStyle': polyStyleParser,
    'BalloonStyle': balloonStyleParser
});
/**
 * @this {KML}
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<Style>} Style.
 */
function readStyle(node, objectStack) {
    var styleObject = pushParseAndPop({}, STYLE_PARSERS, node, objectStack, this);
    if (!styleObject) {
        return null;
    }
    var fillStyle =
        /** @type {Fill} */
        ('fillStyle' in styleObject ? styleObject['fillStyle'] : DEFAULT_FILL_STYLE);
    var fill = /** @type {boolean|undefined} */ (styleObject['fill']);
    if (fill !== undefined && !fill) {
        fillStyle = null;
    }
    var imageStyle;
    if ('imageStyle' in styleObject) {
        if (styleObject['imageStyle'] != DEFAULT_NO_IMAGE_STYLE) {
            imageStyle = styleObject['imageStyle'];
        }
    }
    else {
        imageStyle = DEFAULT_IMAGE_STYLE;
    }
    var textStyle =
        /** @type {Text} */
        ('textStyle' in styleObject ? styleObject['textStyle'] : DEFAULT_TEXT_STYLE);
    var strokeStyle =
        /** @type {Stroke} */
        ('strokeStyle' in styleObject
            ? styleObject['strokeStyle']
            : DEFAULT_STROKE_STYLE);
    let resultStyle;
    var outline = /** @type {boolean|undefined} */ (styleObject['outline']);
    if (outline !== undefined && !outline) {
        // if the polystyle specifies no outline two styles are needed,
        // one for non-polygon geometries where linestrings require a stroke
        // and one for polygons where there should be no stroke
        resultStyle = [
            new Style({
                geometry: function (feature) {
                    var geometry = feature.getGeometry();
                    var type = geometry.getType();
                    if (type === GeometryType.GEOMETRY_COLLECTION) {
                        var collection =
                        /** @type {import("../geom/GeometryCollection").default} */ (geometry);
                        return new GeometryCollection(collection
                            .getGeometriesArrayRecursive()
                            .filter(function (geometry) {
                                var type = geometry.getType();
                                return (type !== GeometryType.POLYGON &&
                                    type !== GeometryType.MULTI_POLYGON);
                            }));
                    }
                    else if (type !== GeometryType.POLYGON &&
                        type !== GeometryType.MULTI_POLYGON) {
                        return geometry;
                    }
                },
                fill: fillStyle,
                image: imageStyle,
                stroke: strokeStyle,
                text: textStyle,
                zIndex: undefined, // FIXME
            }),
            new Style({
                geometry: function (feature) {
                    var geometry = feature.getGeometry();
                    var type = geometry.getType();
                    if (type === GeometryType.GEOMETRY_COLLECTION) {
                        var collection =
                        /** @type {import("../geom/GeometryCollection").default} */ (geometry);
                        return new GeometryCollection(collection
                            .getGeometriesArrayRecursive()
                            .filter(function (geometry) {
                                var type = geometry.getType();
                                return (type === GeometryType.POLYGON ||
                                    type === GeometryType.MULTI_POLYGON);
                            }));
                    }
                    else if (type === GeometryType.POLYGON ||
                        type === GeometryType.MULTI_POLYGON) {
                        return geometry;
                    }
                },
                fill: fillStyle,
                stroke: null,
                zIndex: undefined, // FIXME
            }),
        ];
    }
    else {
        resultStyle = [
            new Style({
                fill: fillStyle,
                image: imageStyle,
                stroke: strokeStyle,
                text: textStyle,
                zIndex: undefined, // FIXME
            }),
        ];
    }
    const balloonStyle = styleObject['balloonStyle'];
    if (balloonStyle) {
        resultStyle.forEach(s => s._balloon = balloonStyle);
    }
    return resultStyle;
}
/**
 * Reads an array of geometries and creates arrays for common geometry
 * properties. Then sets them to the multi geometry.
 * @param {MultiPoint|MultiLineString|MultiPolygon} multiGeometry A multi-geometry.
 * @param {Array<import("../geom/Geometry.js").default>} geometries List of geometries.
 */
function setCommonGeometryProperties(multiGeometry, geometries) {
    var ii = geometries.length;
    var extrudes = new Array(geometries.length);
    var tessellates = new Array(geometries.length);
    var altitudeModes = new Array(geometries.length);
    var hasExtrude, hasTessellate, hasAltitudeMode;
    hasExtrude = false;
    hasTessellate = false;
    hasAltitudeMode = false;
    for (var i = 0; i < ii; ++i) {
        var geometry = geometries[i];
        extrudes[i] = geometry.get('extrude');
        tessellates[i] = geometry.get('tessellate');
        altitudeModes[i] = geometry.get('altitudeMode');
        hasExtrude = hasExtrude || extrudes[i] !== undefined;
        hasTessellate = hasTessellate || tessellates[i] !== undefined;
        hasAltitudeMode = hasAltitudeMode || altitudeModes[i];
    }
    if (hasExtrude) {
        multiGeometry.set('extrude', extrudes);
    }
    if (hasTessellate) {
        multiGeometry.set('tessellate', tessellates);
    }
    if (hasAltitudeMode) {
        multiGeometry.set('altitudeMode', altitudeModes);
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var DATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'displayName': makeObjectPropertySetter(readString),
    'value': makeObjectPropertySetter(readString),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function dataParser(node, objectStack) {
    var name = node.getAttribute('name');
    parseNode(DATA_PARSERS, node, objectStack);
    var featureObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    if (name && featureObject.displayName) {
        featureObject[name] = {
            value: featureObject.value,
            displayName: featureObject.displayName,
            toString: function () {
                return featureObject.value;
            },
        };
        delete featureObject['displayName'];
    }
    else if (name !== null) {
        featureObject[name] = featureObject.value;
    }
    else if (featureObject.displayName !== null) {
        featureObject[featureObject.displayName] = featureObject.value;
    }
    delete featureObject['value'];
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var EXTENDED_DATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'Data': dataParser,
    'SchemaData': schemaDataParser,
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function extendedDataParser(node, objectStack) {
    parseNode(EXTENDED_DATA_PARSERS, node, objectStack);
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function regionParser(node, objectStack) {
    parseNode(REGION_PARSERS, node, objectStack);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var PAIR_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'Style': makeObjectPropertySetter(readStyle),
    'key': makeObjectPropertySetter(readString),
    'styleUrl': makeObjectPropertySetter(readStyleURL),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function pairDataParser(node, objectStack) {
    var pairObject = pushParseAndPop({}, PAIR_PARSERS, node, objectStack, this);
    if (!pairObject) {
        return;
    }
    var key = /** @type {string|undefined} */ (pairObject['key']);
    if (key && key == 'normal') {
        var styleUrl = /** @type {string|undefined} */ (pairObject['styleUrl']);
        if (styleUrl) {
            objectStack[objectStack.length - 1] = styleUrl;
        }
        var style = /** @type {Style} */ (pairObject['Style']);
        if (style) {
            objectStack[objectStack.length - 1] = style;
        }
    }
}
/**
 * @this {KML}
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function placemarkStyleMapParser(node, objectStack) {
    var styleMapValue = readStyleMapValue.call(this, node, objectStack);
    if (!styleMapValue) {
        return;
    }
    var placemarkObject = objectStack[objectStack.length - 1];
    if (Array.isArray(styleMapValue)) {
        placemarkObject['Style'] = styleMapValue;
    }
    else if (typeof styleMapValue === 'string') {
        placemarkObject['styleUrl'] = styleMapValue;
    }
    else {
        assert(false, 38); // `styleMapValue` has an unknown type
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var SCHEMA_DATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'SimpleData': simpleDataParser,
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function schemaDataParser(node, objectStack) {
    parseNode(SCHEMA_DATA_PARSERS, node, objectStack);
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function simpleDataParser(node, objectStack) {
    var name = node.getAttribute('name');
    if (name !== null) {
        var data = readString(node);
        var featureObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
        featureObject[name] = data;
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var LAT_LON_ALT_BOX_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'altitudeMode': makeObjectPropertySetter(readString),
    'minAltitude': makeObjectPropertySetter(readDecimal),
    'maxAltitude': makeObjectPropertySetter(readDecimal),
    'north': makeObjectPropertySetter(readDecimal),
    'south': makeObjectPropertySetter(readDecimal),
    'east': makeObjectPropertySetter(readDecimal),
    'west': makeObjectPropertySetter(readDecimal),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function latLonAltBoxParser(node, objectStack) {
    var object = pushParseAndPop({}, LAT_LON_ALT_BOX_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    var regionObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    var extent = [
        parseFloat(object['west']),
        parseFloat(object['south']),
        parseFloat(object['east']),
        parseFloat(object['north']),
    ];
    regionObject['extent'] = extent;
    regionObject['altitudeMode'] = object['altitudeMode'];
    regionObject['minAltitude'] = parseFloat(object['minAltitude']);
    regionObject['maxAltitude'] = parseFloat(object['maxAltitude']);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var LOD_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'minLodPixels': makeObjectPropertySetter(readDecimal),
    'maxLodPixels': makeObjectPropertySetter(readDecimal),
    'minFadeExtent': makeObjectPropertySetter(readDecimal),
    'maxFadeExtent': makeObjectPropertySetter(readDecimal),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function lodParser(node, objectStack) {
    var object = pushParseAndPop({}, LOD_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    var lodObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    lodObject['minLodPixels'] = parseFloat(object['minLodPixels']);
    lodObject['maxLodPixels'] = parseFloat(object['maxLodPixels']);
    lodObject['minFadeExtent'] = parseFloat(object['minFadeExtent']);
    lodObject['maxFadeExtent'] = parseFloat(object['maxFadeExtent']);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var INNER_BOUNDARY_IS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    // KML spec only allows one LinearRing  per innerBoundaryIs, but Google Earth
    // allows multiple, so we parse multiple here too.
    'LinearRing': makeArrayPusher(readFlatLinearRing),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function innerBoundaryIsParser(node, objectStack) {
    var innerBoundaryFlatLinearRings = pushParseAndPop(
    /** @type {Array<Array<number>>} */([]), INNER_BOUNDARY_IS_PARSERS, node, objectStack);
    if (innerBoundaryFlatLinearRings.length > 0) {
        var flatLinearRings =
            /** @type {Array<Array<number>>} */
            (objectStack[objectStack.length - 1]);
        flatLinearRings.push.apply(flatLinearRings, innerBoundaryFlatLinearRings);
    }
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
var OUTER_BOUNDARY_IS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'LinearRing': makeReplacer(readFlatLinearRing),
});
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function outerBoundaryIsParser(node, objectStack) {
    /** @type {Array<number>|undefined} */
    var flatLinearRing = pushParseAndPop(undefined, OUTER_BOUNDARY_IS_PARSERS, node, objectStack);
    if (flatLinearRing) {
        var flatLinearRings =
            /** @type {Array<Array<number>>} */
            (objectStack[objectStack.length - 1]);
        flatLinearRings[0] = flatLinearRing;
    }
}
/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function linkParser(node, objectStack) {
    parseNode(LINK_PARSERS, node, objectStack);
}
/**
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function whenParser(node, objectStack) {
    var gxTrackObject =
        /** @type {GxTrackObject} */
        (objectStack[objectStack.length - 1]);
    var whens = gxTrackObject.whens;
    var s = getAllTextContent(node, false);
    var when = Date.parse(s);
    whens.push(isNaN(when) ? 0 : when);
}
/**
 * @param {Node} node Node to append a TextNode with the color to.
 * @param {import("../color.js").Color|string} color Color.
 */
function writeColorTextNode(node, color) {
    var rgba = asArray(color);
    var opacity = rgba.length == 4 ? rgba[3] : 1;
    /** @type {Array<string|number>} */
    var abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
    for (var i = 0; i < 4; ++i) {
        var hex = Math.floor(/** @type {number} */(abgr[i])).toString(16);
        abgr[i] = hex.length == 1 ? '0' + hex : hex;
    }
    writeStringTextNode(node, abgr.join(''));
}
/**
 * @param {Node} node Node to append a TextNode with the coordinates to.
 * @param {Array<number>} coordinates Coordinates.
 * @param {Array<*>} objectStack Object stack.
 */
function writeCoordinatesTextNode(node, coordinates, objectStack) {
    var context = objectStack[objectStack.length - 1];
    var layout = context['layout'];
    var stride = context['stride'];
    var dimension;
    if (layout == GeometryLayout.XY || layout == GeometryLayout.XYM) {
        dimension = 2;
    }
    else if (layout == GeometryLayout.XYZ || layout == GeometryLayout.XYZM) {
        dimension = 3;
    }
    else {
        assert(false, 34); // Invalid geometry layout
    }
    var ii = coordinates.length;
    var text = '';
    if (ii > 0) {
        text += coordinates[0];
        for (var d = 1; d < dimension; ++d) {
            text += ',' + coordinates[d];
        }
        for (var i = stride; i < ii; i += stride) {
            text += ' ' + coordinates[i];
            for (var d = 1; d < dimension; ++d) {
                text += ',' + coordinates[i + d];
            }
        }
    }
    writeStringTextNode(node, text);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var EXTENDEDDATA_NODE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'Data': makeChildAppender(writeDataNode),
    'value': makeChildAppender(writeDataNodeValue),
    'displayName': makeChildAppender(writeDataNodeName),
});
/**
 * @param {Element} node Node.
 * @param {{name: *, value: *}} pair Name value pair.
 * @param {Array<*>} objectStack Object stack.
 */
function writeDataNode(node, pair, objectStack) {
    node.setAttribute('name', pair.name);
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    var value = pair.value;
    if (typeof value == 'object') {
        if (value !== null && value.displayName) {
            pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, [value.displayName], objectStack, ['displayName']);
        }
        if (value !== null && value.value) {
            pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, [value.value], objectStack, ['value']);
        }
    }
    else {
        pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, [value], objectStack, ['value']);
    }
}
/**
 * @param {Node} node Node to append a TextNode with the name to.
 * @param {string} name DisplayName.
 */
function writeDataNodeName(node, name) {
    writeCDATASection(node, name);
}
/**
 * @param {Node} node Node to append a CDATA Section with the value to.
 * @param {string} value Value.
 */
function writeDataNodeValue(node, value) {
    writeStringTextNode(node, value);
}
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var DOCUMENT_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['name']);
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var DOCUMENT_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'Placemark': makeChildAppender(writePlacemark),
    'Document': makeChildAppender(writeDocument),
    'Folder': makeChildAppender(writeDocument),
    'name': makeChildAppender(writeStringTextNode)
});
/**
 * @const
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string} [opt_nodeName] Node name.
 * @return {Node|undefined} Node.
 */
var DOCUMENT_NODE_FACTORY = function (value, objectStack, opt_nodeName) {
    var parentNode = objectStack[objectStack.length - 1].node;
    if (Array.isArray(value)) { // Es una carpeta
        return createElementNS(parentNode.namespaceURI, 'Folder');
    }
    else {
        if (typeof value === 'string') { // Es un nombre de carpeta
            return createElementNS(parentNode.namespaceURI, 'name');
        }
        else {
            return createElementNS(parentNode.namespaceURI, 'Placemark');
        }
    }
};
/**
 * @param {Node} node Node.
 * @param {Array<Feature>} features Features.
 * @param {Array<*>} objectStack Object stack.
 * @this {KML}
 */
function writeDocument(node, featuresOrFolders, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    if (featuresOrFolders._name) {
        var properties = { name: featuresOrFolders._name };
        var parentNode = objectStack[objectStack.length - 1].node;
        var orderedKeys = DOCUMENT_SEQUENCE[parentNode.namespaceURI];
        var values = makeSequence(properties, orderedKeys);
        pushSerializeAndPop(context, DOCUMENT_SERIALIZERS, DOCUMENT_NODE_FACTORY, values, objectStack, orderedKeys);
    }
    pushSerializeAndPop(context, DOCUMENT_SERIALIZERS, DOCUMENT_NODE_FACTORY, featuresOrFolders, objectStack, undefined, this);
}
/**
 * A factory for creating Data nodes.
 * @const
 * @type {function(*, Array<*>): (Node|undefined)}
 */
var DATA_NODE_FACTORY = makeSimpleNodeFactory('Data');
/**
 * @param {Node} node Node.
 * @param {{names: Array<string>, values: (Array<*>)}} namesAndValues Names and values.
 * @param {Array<*>} objectStack Object stack.
 */
function writeExtendedData(node, namesAndValues, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    var names = namesAndValues.names;
    var values = namesAndValues.values;
    var length = names.length;
    for (var i = 0; i < length; i++) {
        pushSerializeAndPop(context, EXTENDEDDATA_NODE_SERIALIZERS, DATA_NODE_FACTORY, [{ name: names[i], value: values[i] }], objectStack);
    }
}
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var ICON_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['href'], makeStructureNS(GX_NAMESPACE_URIS, ['x', 'y', 'w', 'h']));
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var ICON_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'href': makeChildAppender(writeStringTextNode),
}, makeStructureNS(GX_NAMESPACE_URIS, {
    'x': makeChildAppender(writeDecimalTextNode),
    'y': makeChildAppender(writeDecimalTextNode),
    'w': makeChildAppender(writeDecimalTextNode),
    'h': makeChildAppender(writeDecimalTextNode),
}));
/**
 * @const
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string} [opt_nodeName] Node name.
 * @return {Node|undefined} Node.
 */
var GX_NODE_FACTORY = function (value, objectStack, opt_nodeName) {
    return createElementNS(GX_NAMESPACE_URIS[0], 'gx:' + opt_nodeName);
};
/**
 * @param {Node} node Node.
 * @param {Object} icon Icon object.
 * @param {Array<*>} objectStack Object stack.
 */
function writeIcon(node, icon, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    var parentNode = objectStack[objectStack.length - 1].node;
    var orderedKeys = ICON_SEQUENCE[parentNode.namespaceURI];
    var values = makeSequence(icon, orderedKeys);
    pushSerializeAndPop(context, ICON_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
    orderedKeys = ICON_SEQUENCE[GX_NAMESPACE_URIS[0]];
    values = makeSequence(icon, orderedKeys);
    pushSerializeAndPop(context, ICON_SERIALIZERS, GX_NODE_FACTORY, values, objectStack, orderedKeys);
}
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var ICON_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
    'scale',
    'heading',
    'Icon',
    'color',
    'hotSpot',
]);
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var ICON_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'Icon': makeChildAppender(writeIcon),
    'color': makeChildAppender(writeColorTextNode),
    'heading': makeChildAppender(writeDecimalTextNode),
    'hotSpot': makeChildAppender(writeVec2),
    'scale': makeChildAppender(writeScaleTextNode),
});
/**
 * @param {Node} node Node.
 * @param {import("../style/Icon.js").default} style Icon style.
 * @param {Array<*>} objectStack Object stack.
 */
function writeIconStyle(node, style, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    var /** @type {Object<string, any>} */ properties = {};
    var src = style.getSrc();
    var size = style.getSize();
    var iconImageSize = style.getImageSize();
    var iconProperties = {
        'href': src,
    };
    if (size) {
        iconProperties['w'] = size[0];
        iconProperties['h'] = size[1];
        var anchor = style.getAnchor(); // top-left
        var origin_1 = style.getOrigin(); // top-left
        if (origin_1 && iconImageSize && origin_1[0] !== 0 && origin_1[1] !== size[1]) {
            iconProperties['x'] = origin_1[0];
            iconProperties['y'] = iconImageSize[1] - (origin_1[1] + size[1]);
        }
        if (anchor && (anchor[0] !== size[0] / 2 || anchor[1] !== size[1] / 2)) {
            var /** @type {Vec2} */ hotSpot = {
                x: anchor[0],
                xunits: IconAnchorUnits.PIXELS,
                y: size[1] - anchor[1],
                yunits: IconAnchorUnits.PIXELS,
            };
            properties['hotSpot'] = hotSpot;
        }
    }
    properties['Icon'] = iconProperties;
    var scale = style.getScaleArray()[0];
    var imageSize = size;
    if (imageSize === null) {
        if (!DEFAULT_IMAGE_STYLE_SIZE) createStyleDefaults();
        imageSize = DEFAULT_IMAGE_STYLE_SIZE;
    }
    if (imageSize.length == 2) {
        var resizeScale = scaleForSize(imageSize);
        scale = scale / resizeScale;
    }
    if (scale !== 1) {
        properties['scale'] = scale;
    }
    var rotation = style.getRotation();
    if (rotation !== 0) {
        //03/11/201 URI: pasamos de radianes a grados
        properties['heading'] = rotation * (180 / Math.PI);
        //properties['heading'] = rotation; // 0-360
    }
    var color = style.getColor();
    if (color) {
        properties['color'] = color;
    }
    var parentNode = objectStack[objectStack.length - 1].node;
    var orderedKeys = ICON_STYLE_SEQUENCE[parentNode.namespaceURI];
    var values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(context, ICON_STYLE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var LABEL_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
    'color',
    'scale',
]);
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var LABEL_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeChildAppender(writeColorTextNode),
    'scale': makeChildAppender(writeScaleTextNode),
});
/**
 * @param {Node} node Node.
 * @param {Text} style style.
 * @param {Array<*>} objectStack Object stack.
 */
function writeLabelStyle(node, style, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    var properties = {};
    var fill = style.getFill();
    if (fill) {
        properties['color'] = fill.getColor();
    }
    var scale = style.getScale();
    if (scale && scale !== 1) {
        properties['scale'] = scale;
    }
    var parentNode = objectStack[objectStack.length - 1].node;
    var orderedKeys = LABEL_STYLE_SEQUENCE[parentNode.namespaceURI];
    var values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(context, LABEL_STYLE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var LINE_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['color', 'width']);
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var LINE_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeChildAppender(writeColorTextNode),
    'width': makeChildAppender(writeDecimalTextNode),
});
/**
 * @param {Node} node Node.
 * @param {Stroke} style style.
 * @param {Array<*>} objectStack Object stack.
 */
function writeLineStyle(node, style, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    var properties = {
        'color': style.getColor(),
        'width': Number(style.getWidth()) || 1,
    };
    var parentNode = objectStack[objectStack.length - 1].node;
    var orderedKeys = LINE_STYLE_SEQUENCE[parentNode.namespaceURI];
    var values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(context, LINE_STYLE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}
/**
 * @const
 * @type {Object<string, string>}
 */
var GEOMETRY_TYPE_TO_NODENAME = {
    'Point': 'Point',
    'LineString': 'LineString',
    'LinearRing': 'LinearRing',
    'Polygon': 'Polygon',
    'MultiPoint': 'MultiGeometry',
    'MultiLineString': 'MultiGeometry',
    'MultiPolygon': 'MultiGeometry',
    'GeometryCollection': 'MultiGeometry',
};
/**
 * @const
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string} [opt_nodeName] Node name.
 * @return {Node|undefined} Node.
 */
var GEOMETRY_NODE_FACTORY = function (value, objectStack, opt_nodeName) {
    if (value) {
        var parentNode = objectStack[objectStack.length - 1].node;
        return createElementNS(parentNode.namespaceURI, GEOMETRY_TYPE_TO_NODENAME[
        /** @type {import("../geom/Geometry.js").default} */ (value).getType()]);
    }
};
/**
 * A factory for creating Point nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
var POINT_NODE_FACTORY = makeSimpleNodeFactory('Point');
/**
 * A factory for creating LineString nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
var LINE_STRING_NODE_FACTORY = makeSimpleNodeFactory('LineString');
/**
 * A factory for creating LinearRing nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
var LINEAR_RING_NODE_FACTORY = makeSimpleNodeFactory('LinearRing');
/**
 * A factory for creating Polygon nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
var POLYGON_NODE_FACTORY = makeSimpleNodeFactory('Polygon');
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var MULTI_GEOMETRY_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'LineString': makeChildAppender(writePrimitiveGeometry),
    'Point': makeChildAppender(writePrimitiveGeometry),
    'Polygon': makeChildAppender(writePolygon),
    'GeometryCollection': makeChildAppender(writeMultiGeometry),
});
/**
 * @param {Node} node Node.
 * @param {import("../geom/Geometry.js").default} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
function writeMultiGeometry(node, geometry, objectStack) {
    /** @type {import("../xml.js").NodeStackItem} */
    var context = { node: node };
    var type = geometry.getType();
    /** @type {Array<import("../geom/Geometry.js").default>} */
    var geometries = [];
    /** @type {function(*, Array<*>, string=): (Node|undefined)} */
    var factory;
    if (type === GeometryType.GEOMETRY_COLLECTION) {
        /** @type {GeometryCollection} */ (geometry)
            .getGeometriesArrayRecursive()
            .forEach(function (geometry) {
                var type = geometry.getType();
                if (type === GeometryType.MULTI_POINT) {
                    geometries = geometries.concat(
                /** @type {MultiPoint} */(geometry).getPoints());
                }
                else if (type === GeometryType.MULTI_LINE_STRING) {
                    geometries = geometries.concat(
                /** @type {MultiLineString} */(geometry).getLineStrings());
                }
                else if (type === GeometryType.MULTI_POLYGON) {
                    geometries = geometries.concat(
                /** @type {MultiPolygon} */(geometry).getPolygons());
                }
                else if (type === GeometryType.POINT ||
                    type === GeometryType.LINE_STRING ||
                    type === GeometryType.POLYGON) {
                    geometries.push(geometry);
                }
                else {
                    assert(false, 39); // Unknown geometry type
                }
            });
        factory = GEOMETRY_NODE_FACTORY;
    }
    else if (type === GeometryType.MULTI_POINT) {
        geometries = /** @type {MultiPoint} */ (geometry).getPoints();
        factory = POINT_NODE_FACTORY;
    }
    else if (type === GeometryType.MULTI_LINE_STRING) {
        geometries = /** @type {MultiLineString} */ (geometry).getLineStrings();
        factory = LINE_STRING_NODE_FACTORY;
    }
    else if (type === GeometryType.MULTI_POLYGON) {
        geometries = /** @type {MultiPolygon} */ (geometry).getPolygons();
        factory = POLYGON_NODE_FACTORY;
    }
    else {
        assert(false, 39); // Unknown geometry type
    }
    pushSerializeAndPop(context, MULTI_GEOMETRY_SERIALIZERS, factory, geometries, objectStack);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var BOUNDARY_IS_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'LinearRing': makeChildAppender(writePrimitiveGeometry),
});
/**
 * @param {Node} node Node.
 * @param {import("../geom/LinearRing.js").default} linearRing Linear ring.
 * @param {Array<*>} objectStack Object stack.
 */
function writeBoundaryIs(node, linearRing, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    pushSerializeAndPop(context, BOUNDARY_IS_SERIALIZERS, LINEAR_RING_NODE_FACTORY, [linearRing], objectStack);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var PLACEMARK_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'ExtendedData': makeChildAppender(writeExtendedData),
    'MultiGeometry': makeChildAppender(writeMultiGeometry),
    'LineString': makeChildAppender(writePrimitiveGeometry),
    'LinearRing': makeChildAppender(writePrimitiveGeometry),
    'Point': makeChildAppender(writePrimitiveGeometry),
    'Polygon': makeChildAppender(writePolygon),
    'Style': makeChildAppender(writeStyle),
    'address': makeChildAppender(writeStringTextNode),
    'description': makeChildAppender(writeStringTextNode),
    'name': makeChildAppender(writeStringTextNode),
    'open': makeChildAppender(writeBooleanTextNode),
    'phoneNumber': makeChildAppender(writeStringTextNode),
    'styleUrl': makeChildAppender(writeStringTextNode),
    'visibility': makeChildAppender(writeBooleanTextNode),
});
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var PLACEMARK_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
    'name',
    'open',
    'visibility',
    'address',
    'phoneNumber',
    'description',
    'styleUrl',
    'Style',
]);
/**
 * A factory for creating ExtendedData nodes.
 * @const
 * @type {function(*, Array<*>): (Node|undefined)}
 */
var EXTENDEDDATA_NODE_FACTORY = makeSimpleNodeFactory('ExtendedData');
/**
 * FIXME currently we do serialize arbitrary/custom feature properties
 * (ExtendedData).
 * @param {Element} node Node.
 * @param {Feature} feature Feature.
 * @param {Array<*>} objectStack Object stack.
 * @this {KML}
 */
function writePlacemark(node, feature, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    // set id
    if (feature.getId()) {
        node.setAttribute('id', /** @type {string} */(feature.getId()));
    }
    // serialize properties (properties unknown to KML are not serialized)
    var properties = feature.getProperties();
    // don't export these to ExtendedData
    var filter = {
        'address': 1,
        'description': 1,
        'name': 1,
        'open': 1,
        'phoneNumber': 1,
        'styleUrl': 1,
        'visibility': 1,
    };
    filter[feature.getGeometryName()] = 1;
    var keys = Object.keys(properties || {})
        //.sort()
        .filter(function (v) {
            return !filter[v];
        });
    var styleFunction = feature.getStyleFunction();
    if (styleFunction) {
        // FIXME the styles returned by the style function are supposed to be
        // resolution-independent here
        var styles = styleFunction(feature, 0);
        if (styles) {
            var styleArray = Array.isArray(styles) ? styles : [styles];
            var pointStyles = styleArray;
            if (feature.getGeometry()) {
                pointStyles = styleArray.filter(function (style) {
                    var geometry = style.getGeometryFunction()(feature);
                    if (geometry) {
                        var type = geometry.getType();
                        if (type === GeometryType.GEOMETRY_COLLECTION) {
                            return /** @type {GeometryCollection} */ (geometry)
                                .getGeometriesArrayRecursive()
                                .filter(function (geometry) {
                                    var type = geometry.getType();
                                    return (type === GeometryType.POINT ||
                                        type === GeometryType.MULTI_POINT);
                                }).length;
                        }
                        return (type === GeometryType.POINT || type === GeometryType.MULTI_POINT);
                    }
                });
            }
            if (this.writeStyles_) {
                var lineStyles = styleArray;
                var polyStyles = styleArray;
                if (feature.getGeometry()) {
                    lineStyles = styleArray.filter(function (style) {
                        var geometry = style.getGeometryFunction()(feature);
                        if (geometry) {
                            var type = geometry.getType();
                            if (type === GeometryType.GEOMETRY_COLLECTION) {
                                return /** @type {GeometryCollection} */ (geometry)
                                    .getGeometriesArrayRecursive()
                                    .filter(function (geometry) {
                                        var type = geometry.getType();
                                        return (type === GeometryType.LINE_STRING ||
                                            type === GeometryType.MULTI_LINE_STRING);
                                    }).length;
                            }
                            return (type === GeometryType.LINE_STRING ||
                                type === GeometryType.MULTI_LINE_STRING);
                        }
                    });
                    polyStyles = styleArray.filter(function (style) {
                        var geometry = style.getGeometryFunction()(feature);
                        if (geometry) {
                            var type = geometry.getType();
                            if (type === GeometryType.GEOMETRY_COLLECTION) {
                                return /** @type {GeometryCollection} */ (geometry)
                                    .getGeometriesArrayRecursive()
                                    .filter(function (geometry) {
                                        var type = geometry.getType();
                                        return (type === GeometryType.POLYGON ||
                                            type === GeometryType.MULTI_POLYGON);
                                    }).length;
                            }
                            return (type === GeometryType.POLYGON ||
                                type === GeometryType.MULTI_POLYGON);
                        }
                    });
                }
                properties['Style'] = {
                    pointStyles: pointStyles,
                    lineStyles: lineStyles,
                    polyStyles: polyStyles,
                };
            }
            if (pointStyles.length && properties['name'] === undefined) {
                var textStyle = pointStyles[0].getText();
                if (textStyle) {
                    properties['name'] = textStyle.getText();
                }
            }
        }
    }
    var parentNode = objectStack[objectStack.length - 1].node;
    var orderedKeys = PLACEMARK_SEQUENCE[parentNode.namespaceURI];
    var values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(context, PLACEMARK_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
    if (keys.length > 0) {
        var sequence = makeSequence(properties, keys);
        var namesAndValues = { names: keys, values: sequence };
        pushSerializeAndPop(context, PLACEMARK_SERIALIZERS, EXTENDEDDATA_NODE_FACTORY, [namesAndValues], objectStack);
    }
    // serialize geometry
    var options = /** @type {import("./Feature.js").WriteOptions} */ (objectStack[0]);
    var geometry = feature.getGeometry();
    if (geometry) {
        geometry = transformGeometryWithOptions(geometry, true, options);
    }
    pushSerializeAndPop(context, PLACEMARK_SERIALIZERS, GEOMETRY_NODE_FACTORY, [geometry], objectStack);
}
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var PRIMITIVE_GEOMETRY_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
    'extrude',
    'tessellate',
    'altitudeMode',
    'coordinates',
]);
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var PRIMITIVE_GEOMETRY_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'extrude': makeChildAppender(writeBooleanTextNode),
    'tessellate': makeChildAppender(writeBooleanTextNode),
    'altitudeMode': makeChildAppender(writeStringTextNode),
    'coordinates': makeChildAppender(writeCoordinatesTextNode),
});
/**
 * @param {Node} node Node.
 * @param {import("../geom/SimpleGeometry.js").default} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
function writePrimitiveGeometry(node, geometry, objectStack) {
    var flatCoordinates = geometry.getFlatCoordinates();
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    context['layout'] = geometry.getLayout();
    context['stride'] = geometry.getStride();
    // serialize properties (properties unknown to KML are not serialized)
    var properties = geometry.getProperties();
    properties.coordinates = flatCoordinates;
    var parentNode = objectStack[objectStack.length - 1].node;
    var orderedKeys = PRIMITIVE_GEOMETRY_SEQUENCE[parentNode.namespaceURI];
    var values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(context, PRIMITIVE_GEOMETRY_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var POLY_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
    'color',
    'fill',
    'outline',
]);
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var POLYGON_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'outerBoundaryIs': makeChildAppender(writeBoundaryIs),
    'innerBoundaryIs': makeChildAppender(writeBoundaryIs),
});
/**
 * A factory for creating innerBoundaryIs nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
var INNER_BOUNDARY_NODE_FACTORY = makeSimpleNodeFactory('innerBoundaryIs');
/**
 * A factory for creating outerBoundaryIs nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
var OUTER_BOUNDARY_NODE_FACTORY = makeSimpleNodeFactory('outerBoundaryIs');
/**
 * @param {Node} node Node.
 * @param {Polygon} polygon Polygon.
 * @param {Array<*>} objectStack Object stack.
 */
function writePolygon(node, polygon, objectStack) {
    var linearRings = polygon.getLinearRings();
    var outerRing = linearRings.shift();
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    // inner rings
    pushSerializeAndPop(context, POLYGON_SERIALIZERS, INNER_BOUNDARY_NODE_FACTORY, linearRings, objectStack);
    // outer ring
    pushSerializeAndPop(context, POLYGON_SERIALIZERS, OUTER_BOUNDARY_NODE_FACTORY, [outerRing], objectStack);
}
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var POLY_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeChildAppender(writeColorTextNode),
    'fill': makeChildAppender(writeBooleanTextNode),
    'outline': makeChildAppender(writeBooleanTextNode),
});
/**
 * @param {Node} node Node.
 * @param {Style} style Style.
 * @param {Array<*>} objectStack Object stack.
 */
function writePolyStyle(node, style, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    var fill = style.getFill();
    var stroke = style.getStroke();
    var properties = {
        'color': fill ? fill.getColor() : undefined,
        'fill': fill ? undefined : false,
        'outline': stroke ? undefined : false,
    };
    var parentNode = objectStack[objectStack.length - 1].node;
    var orderedKeys = POLY_STYLE_SEQUENCE[parentNode.namespaceURI];
    var values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(context, POLY_STYLE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}
/**
 * @param {Node} node Node to append a TextNode with the scale to.
 * @param {number|undefined} scale Scale.
 */
function writeScaleTextNode(node, scale) {
    // the Math is to remove any excess decimals created by float arithmetic
    writeDecimalTextNode(node, Math.round(scale * 1e6) / 1e6);
}
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
var STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
    'IconStyle',
    'LabelStyle',
    'LineStyle',
    'PolyStyle',
    'BalloonStyle',
]);
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'IconStyle': makeChildAppender(writeIconStyle),
    'LabelStyle': makeChildAppender(writeLabelStyle),
    'LineStyle': makeChildAppender(writeLineStyle),
    'PolyStyle': makeChildAppender(writePolyStyle),
    'BalloonStyle': makeChildAppender((node, style) => {
        const cdataNode = getDocument().createCDATASection(style.getText());
        const textNode = getDocument().createElement("text");
        textNode.appendChild(cdataNode);
        node.appendChild(textNode);
    }),
});
/**
 * @param {Node} node Node.
 * @param {Object<string, Array<Style>>} styles Styles.
 * @param {Array<*>} objectStack Object stack.
 */
function writeStyle(node, styles, objectStack) {
    var /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    var properties = {};
    if (styles.pointStyles.length) {
        var textStyle = styles.pointStyles[0].getText();
        if (textStyle) {
            properties['LabelStyle'] = textStyle;
        }
        var imageStyle = styles.pointStyles[0].getImage();
        if (imageStyle &&
            typeof ( /** @type {?} */(imageStyle).getSrc) === 'function') {
            properties['IconStyle'] = imageStyle;
        }
        var balloonStyle = styles.pointStyles[0]._balloon;
        if (balloonStyle) {
            properties['BalloonStyle'] = balloonStyle;
        }
    }
    if (styles.lineStyles.length) {
        var strokeStyle = styles.lineStyles[0].getStroke();
        if (strokeStyle) {
            properties['LineStyle'] = strokeStyle;
        }
    }
    if (styles.polyStyles.length) {
        var strokeStyle = styles.polyStyles[0].getStroke();
        if (strokeStyle && !properties['LineStyle']) {
            properties['LineStyle'] = strokeStyle;
        }
        properties['PolyStyle'] = styles.polyStyles[0];
    }
    var parentNode = objectStack[objectStack.length - 1].node;
    var orderedKeys = STYLE_SEQUENCE[parentNode.namespaceURI];
    var values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(context, STYLE_SERIALIZERS, OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
}
/**
 * @param {Element} node Node to append a TextNode with the Vec2 to.
 * @param {Vec2} vec2 Vec2.
 */
function writeVec2(node, vec2) {
    node.setAttribute('x', String(vec2.x));
    node.setAttribute('y', String(vec2.y));
    node.setAttribute('xunits', vec2.xunits);
    node.setAttribute('yunits', vec2.yunits);
}
export default KML;
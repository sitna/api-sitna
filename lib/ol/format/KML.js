/**
 * @module ol/format/KML
 */
import Feature from 'ol/Feature.js';
import Fill from 'ol/style/Fill.js';
import GeometryCollection from 'ol/geom/GeometryCollection.js';
import Icon from 'ol/style/Icon.js';
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
import XMLFeature from 'ol/format/XMLFeature.js';
import RegularShape from 'ol/style/RegularShape';
import {
    OBJECT_PROPERTY_NODE_FACTORY,
    XML_SCHEMA_INSTANCE_URI,
    createElementNS,
    getAllTextContent,
    isDocument,
    makeArrayExtender,
    makeArrayPusher,
    makeChildAppender,
    makeObjectPropertySetter,
    makeReplacer,
    makeSequence,
    makeSimpleNodeFactory,
    makeStructureNS,
    parse,
    parseNode,
    pushParseAndPop,
    pushSerializeAndPop,
    getDocument,
} from 'ol/xml.js';
import { asArray } from 'ol/color.js';
import { extend } from 'ol/array.js';
import { get as getProjection } from 'ol/proj.js';
import {
    readBoolean,
    readDecimal,
    readString,
    writeBooleanTextNode,
    writeCDATASection,
    writeDecimalTextNode,
    writeStringTextNode,
} from 'ol/format/xsd.js';
import { toRadians } from 'ol/math.js';
import { transformGeometryWithOptions } from 'ol/format/Feature.js';
import Consts from '../../../TC/Consts.js';

/**
 * @typedef {Object} Vec2
 * @property {number} x X coordinate.
 * @property {import("../style/Icon.js").IconAnchorUnits} xunits Units of x.
 * @property {number} y Y coordinate.
 * @property {import("../style/Icon.js").IconAnchorUnits} yunits Units of Y.
 * @property {import("../style/Icon.js").IconOrigin} [origin] Origin.
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
const GX_NAMESPACE_URIS = ['http://www.google.com/kml/ext/2.2'];

/**
 * @const
 * @type {Array<null|string>}
 */
let NAMESPACE_URIS = [
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
const SCHEMA_LOCATION =
    'http://www.opengis.net/kml/2.2 ' +
    'https://developers.google.com/kml/schema/kml22gx.xsd';

/**
 * @type {Object<string, import("../style/Icon.js").IconAnchorUnits>}
 */
const ICON_ANCHOR_UNITS_MAP = {
    'fraction': 'fraction',
    'pixels': 'pixels',
    'insetPixels': 'pixels',
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const PLACEMARK_PARSERS = makeStructureNS(
    NAMESPACE_URIS,
    {
        'ExtendedData': extendedDataParser,
        'Region': regionParser,
        'MultiGeometry': makeObjectPropertySetter(readMultiGeometry, 'geometry'),
        'LineString': makeObjectPropertySetter(readLineString, 'geometry'),
        'LinearRing': makeObjectPropertySetter(readLinearRing, 'geometry'),
        'Point': makeObjectPropertySetter(readPoint, 'geometry'),
        'Polygon': makeObjectPropertySetter(readPolygon, 'geometry'),
        'Style': makeObjectPropertySetter(readStyle),
        'StyleMap': placemarkStyleMapParser,
        'Schema': makeObjectPropertySetter(readSchema),
        'schemaUrl': makeObjectPropertySetter(readStyleURL),
        'address': makeObjectPropertySetter(readString),
        'description': makeObjectPropertySetter(readString),
        'name': makeObjectPropertySetter(readString),
        'open': makeObjectPropertySetter(readBoolean),
        'phoneNumber': makeObjectPropertySetter(readString),
        'styleUrl': makeObjectPropertySetter(readStyleURL),
        'visibility': makeObjectPropertySetter(readBoolean),
    },
    makeStructureNS(GX_NAMESPACE_URIS, {
        'MultiTrack': makeObjectPropertySetter(readGxMultiTrack, 'geometry'),
        'Track': makeObjectPropertySetter(readGxTrack, 'geometry'),
    })
);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const NETWORK_LINK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
const LINK_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'href': makeObjectPropertySetter(readURI),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const CAMERA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    Altitude: makeObjectPropertySetter(readDecimal),
    Longitude: makeObjectPropertySetter(readDecimal),
    Latitude: makeObjectPropertySetter(readDecimal),
    Tilt: makeObjectPropertySetter(readDecimal),
    AltitudeMode: makeObjectPropertySetter(readString),
    Heading: makeObjectPropertySetter(readDecimal),
    Roll: makeObjectPropertySetter(readDecimal),
});

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const REGION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'LatLonAltBox': latLonAltBoxParser,
    'Lod': lodParser,
});

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const KML_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['Document', 'Schema', 'Placemark']);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const KML_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'Document': makeChildAppender(writeDocument),
    'Placemark': makeChildAppender(writePlacemark)
});

/**
 * @type {import("../color.js").Color}
 */
let DEFAULT_COLOR;

/**
 * @type {Fill|null}
 */
let DEFAULT_FILL_STYLE = null;

/**
 * Get the default fill style (or null if not yet set).
 * @return {Fill|null} The default fill style.
 */
export function getDefaultFillStyle() {
    return DEFAULT_FILL_STYLE;
}

/**
 * @type {import("../size.js").Size}
 */
let DEFAULT_IMAGE_STYLE_ANCHOR;

/**
 * @type {import("../style/Icon.js").IconAnchorUnits}
 */
let DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;

/**
 * @type {import("../style/Icon.js").IconAnchorUnits}
 */
let DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;

/**
 * @type {import("../size.js").Size}
 */
let DEFAULT_IMAGE_STYLE_SIZE;

/**
 * @type {string}
 */
let DEFAULT_IMAGE_STYLE_SRC;

/**
 * @type {import("../style/Image.js").default|null}
 */
let DEFAULT_IMAGE_STYLE = null;

/**
 * Get the default image style (or null if not yet set).
 * @return {import("../style/Image.js").default|null} The default image style.
 */
export function getDefaultImageStyle() {
    return DEFAULT_IMAGE_STYLE;
}

/**
 * @type {string}
 */
let DEFAULT_NO_IMAGE_STYLE;

/**
 * @type {Stroke|null}
 */
let DEFAULT_STROKE_STYLE = null;

/**
 * Get the default stroke style (or null if not yet set).
 * @return {Stroke|null} The default stroke style.
 */
export function getDefaultStrokeStyle() {
    return DEFAULT_STROKE_STYLE;
}

/**
 * @type {Stroke}
 */
let DEFAULT_TEXT_STROKE_STYLE;

/**
 * @type {Text|null}
 */
let DEFAULT_TEXT_STYLE = null;

/**
 * Get the default text style (or null if not yet set).
 * @return {Text|null} The default text style.
 */
export function getDefaultTextStyle() {
    return DEFAULT_TEXT_STYLE;
}

/**
 * @type {Style|null}
 */
let DEFAULT_STYLE = null;

/**
 * Get the default style (or null if not yet set).
 * @return {Style|null} The default style.
 */
export function getDefaultStyle() {
    return DEFAULT_STYLE;
}

/**
 * @type {Array<Style>|null}
 */
let DEFAULT_STYLE_ARRAY = null;

/**
 * Get the default style array (or null if not yet set).
 * @return {Array<Style>|null} The default style.
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
    // Rehacemos los estilos por defecto de KML para que se adecúen al de la API
    DEFAULT_COLOR = [255, 255, 255, 1];

    DEFAULT_FILL_STYLE = new Fill({
        color: getRGBA(TC.Cfg.styles.polygon.fillColor, TC.Cfg.styles.polygon.fillOpacity)
    });

    DEFAULT_IMAGE_STYLE_ANCHOR = [20, 2];

    DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS = 'pixels';

    DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS = 'pixels';

    DEFAULT_IMAGE_STYLE_SIZE = [64, 64];

    DEFAULT_IMAGE_STYLE_SRC =
        'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';

    DEFAULT_IMAGE_STYLE = new Icon({
        anchor: DEFAULT_IMAGE_STYLE_ANCHOR,
        anchorOrigin: 'bottom-left',
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

///////////// Diccionario de identificadores de esquema
const featureSchemaUrls = new WeakMap();
///////////// Nombre de clave que del identificador de esquema
const schemaUrlPropertyName = '_schemaUrl';

////////
const DATA_IMAGE_SVG_PREFIX = "data:image/svg+xml;base64,";

const getNativeFeatureStyle = function (feature, readonly) {
    var style = feature.getStyle();
    if (typeof style === 'function') {
        style = style(feature);
    }
    if (Array.isArray(style)) {
        style = style.reduce(function (extendedStyle, currentStyle) {
            extendedStyle.fill_ = currentStyle.fill_ || extendedStyle.fill_;
            extendedStyle.image_ = currentStyle.image_ || extendedStyle.image_;
            extendedStyle.stroke_ = currentStyle.stroke_ || extendedStyle.stroke_;
            extendedStyle.text_ = currentStyle.text_ || extendedStyle.text_;
            return extendedStyle;
        }, new Style());
    }
    if (!style && !readonly) {
        style = new Style();
        feature.setStyle(style);
    }
    return style;
};

const fillSharedSchemas = async function (features) {
    for (let f of features) {
        const featureTypeMetadata = await f._wrap.parent.layer?.getFeatureTypeMetadata();
        if (featureTypeMetadata) {
            if (featureTypeMetadata.origin === Consts.format.KML) {
                const schema = featureTypeMetadata.originalMetadata.schemas[0];
                if (schema) {
                    featureSchemaUrls.set(f, '#' + schema.id);
                    this.sharedSchemas_[schema.id] ??= schema.simpleFields.map((simpleField) => ({ ...simpleField }));
                }
            }
            else {
                let schemaId = f._wrap.parent.layer?.id;
                if (schemaId) {
                    if (!this.sharedSchemas_[schemaId]) {
                        const schema = featureTypeMetadata.attributes.map((attr) => {
                            const result = { name: attr.name };
                            switch (attr.type) {
                                case Consts.dataType.INTEGER:
                                    result.type = 'int';
                                    break;
                                case Consts.dataType.SMALLINT:
                                    result.type = 'short';
                                    break;
                                case Consts.dataType.FLOAT:
                                    result.type = 'float';
                                    break;
                                case Consts.dataType.FLOAT:
                                    result.type = 'float';
                                    break;
                                case Consts.dataType.DOUBLE:
                                    result.type = 'double';
                                    break;
                                case Consts.dataType.BOOLEAN:
                                    result.type = 'bool';
                                    break;
                                default:
                                    result.type = 'string';
                            }
                            return result;
                        });
                        this.sharedSchemas_[schemaId] = schema;
                    }
                    featureSchemaUrls.set(f, '#' + schemaId);
                }
            }
        }
    }
};

const getStyleProcessedFeature = function (feature) {
    const geom = feature.getGeometry();
    if (geom instanceof Point) {
        // Si el punto no tiene icono, creamos uno nuevo con un icono generado como data URI a partir del estilo
        let style = getNativeFeatureStyle(feature, true);
        const shape = style.getImage();
        if (shape instanceof RegularShape) {
            const radius = shape.getRadius();
            const stroke = shape.getStroke();
            const strokeWidth = stroke.getWidth();
            const fill = shape.getFill();
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
            //vectorContext.drawGeometry(new Point([position, position]));
            const newFeature = new Feature(geom);
            newFeature._wrap = feature._wrap;
            newFeature.setId(feature.getId());
            newFeature.setProperties(feature.getProperties());
            featureSchemaUrls.set(newFeature, featureSchemaUrls.get(feature));

            newFeature.setStyle(new Style({
                image: new Icon({
                    src: (DATA_IMAGE_SVG_PREFIX + window.btoa('<svg xmlns="http://www.w3.org/2000/svg" width="' +
                        diameter + '" height="' + diameter + '">' +
                        '<circle cx="' + diameter / 2 + '" cy="' + diameter / 2 + '" r="' + radius +
                        '" stroke="' + stroke.getColor() + '" fill="rgba(' +
                        fill.getColor() + ')" stroke-width="' + strokeWidth +
                        '" />' +
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
};

const addPointFeaturesForLabels = function (features) {
    const pointsToAdd = [];
    features.forEach(function (feature) {
        const style = getNativeFeatureStyle(feature, true);
        const geometry = feature.getGeometry();
        const text = style.getText();
        var point;
        if (text && text.getText()) {
            switch (true) {
                case geometry instanceof LineString:
                    point = new Point(geometry.getCoordinateAt(0.5));
                    break;
                case geometry instanceof Polygon:
                    point = geometry.getInteriorPoint();
                    break;
                case geometry instanceof MultiLineString: {
                    // Seleccionamos la línea más larga
                    const lineStrings = geometry.getLineStrings();
                    var maxLength = -1;
                    point = new Point(lineStrings[lineStrings
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
                case geometry instanceof MultiPolygon: {
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
                const newFeature = new Feature(point);
                newFeature.setStyle(new Style({
                    text: text.clone(),
                    image: new Icon({
                        crossOrigin: 'anonymous',
                        src: TC.apiLocation + 'css/img/transparent.gif'
                    })
                }));
                pointsToAdd.push(newFeature);
            }
        }
    });
    if (pointsToAdd.length) {
        features = features.concat(pointsToAdd);
    }
    return features;
}

////////

/**
 * @type {HTMLTextAreaElement}
 */
let TEXTAREA;

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
 * @api
 */
class KML extends XMLFeature {
    /**
     * @param {Options} [options] Options.
     */
    constructor(options) {
        super();

        options = options ? options : {};

        if (!DEFAULT_STYLE_ARRAY) {
            createStyleDefaults();
        }

        /**
         * @type {import("../proj/Projection.js").default}
         */
        this.dataProjection = getProjection('EPSG:4326');

        /**
         * @private
         * @type {Array<Style>}
         */
        this.defaultStyle_ = options.defaultStyle
            ? options.defaultStyle
            : DEFAULT_STYLE_ARRAY;

        /**
         * @private
         * @type {boolean}
         */
        this.extractStyles_ =
            options.extractStyles !== undefined ? options.extractStyles : true;

        /**
         * @type {boolean}
         */
        this.writeStyles_ =
            options.writeStyles !== undefined ? options.writeStyles : true;

        /**
         * @private
         * @type {!Object<string, (Array<Style>|string)>}
         */
        this.sharedStyles_ = {};

        this.sharedSchemas_ = {};

        /**
         * @private
         * @type {boolean}
         */
        this.showPointNames_ =
            options.showPointNames !== undefined ? options.showPointNames : true;

        /**
         * @type {null|string}
         */
        this.crossOrigin_ =
            options.crossOrigin !== undefined ? options.crossOrigin : 'anonymous';

        /**
         * @type {IconUrlFunction}
         */
        this.iconUrlFunction_ = options.iconUrlFunction
            ? options.iconUrlFunction
            : defaultIconUrlFunction;

        this.supportedMediaTypes = ['application/vnd.google-earth.kml+xml'];
    }

    /**
     * @param {Node} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @private
     * @return {Array<Feature>|undefined} Features.
     */
    readDocumentOrFolder_(node, objectStack) {
        // FIXME use scope somehow
        const parsersNS = makeStructureNS(NAMESPACE_URIS, {
            'Document': makeArrayExtender(this.readDocumentOrFolder_, this),
            'Folder': makeArrayExtender(this.readDocumentOrFolder_, this),
            'Placemark': makeArrayPusher(this.readPlacemark_, this),
            'Style': this.readSharedStyle_.bind(this),
            'StyleMap': this.readSharedStyleMap_.bind(this),
            'Schema': this.readSharedSchema_.bind(this),
        });
        /** @type {Array<Feature>} */
        // @ts-ignore
        const features = pushParseAndPop([], parsersNS, node, objectStack, this);
        if (features) {
            // Reescritura de código para leer las carpetas o documentos del KML
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
            // Reasignamos valores de propiedades según esquema
            features.forEach(feature => {
                const schemaUrl = featureSchemaUrls.get(feature);
                if (schemaUrl) {
                    const schema = this.sharedSchemas_[schemaUrl.substring(schemaUrl.indexOf('#') + 1)];
                    const properties = feature.getProperties();
                    for (let key in properties) {
                        const field = schema.find((elm) => elm.name === key);
                        if (field) {
                            const value = properties[key];
                            switch (field.type) {
                                case 'int':
                                case 'uint':
                                case 'short':
                                case 'ushort':
                                case 'float':
                                case 'double':
                                    properties[key] = parseFloat(value);
                                    break;
                                case 'bool':
                                    properties[key] = value === 'true';
                                    break;
                                default:
                                    break;
                            }
                            feature.setProperties(properties);
                        }
                    }
                }

            });
            ///////////////////////////////////////////////////////
            return features;
        }
        return undefined;
    }

    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @private
     * @return {Feature|undefined} Feature.
     */
    readPlacemark_(node, objectStack) {
        const object = pushParseAndPop(
            { 'geometry': null },
            PLACEMARK_PARSERS,
            node,
            objectStack,
            this
        );
        if (!object) {
            return undefined;
        }
        const feature = new Feature();
        const id = node.getAttribute('id');
        if (id !== null) {
            feature.setId(id);
        }
        const options = /** @type {import("./Feature.js").ReadOptions} */ (
            objectStack[0]
        );

        const geometry = object['geometry'];
        if (geometry) {
            transformGeometryWithOptions(geometry, false, options);
        }
        feature.setGeometry(geometry);
        delete object['geometry'];

        if (this.extractStyles_) {
            const style = object['Style'];
            const styleUrl = object['styleUrl'];
            const styleFunction = createFeatureStyleFunction(
                style,
                styleUrl,
                this.defaultStyle_,
                this.sharedStyles_,
                this.showPointNames_
            );
            feature.setStyle(styleFunction);
        }
        delete object['Style'];
        // we do not remove the styleUrl property from the object, so it
        // gets stored on feature when setProperties is called
        delete object.styleUrl;//URI:Me veo obligado a eliminar el atributo styleUrl porque se muestra en el bocadillo de las features


        ////////////////
        featureSchemaUrls.set(feature, object[schemaUrlPropertyName]);
        delete object[schemaUrlPropertyName];
        ////////////////

        feature.setProperties(object, true);

        return feature;
    }

    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @private
     */
    readSharedStyle_(node, objectStack) {
        const id = node.getAttribute('id');
        if (id !== null) {
            const style = readStyle.call(this, node, objectStack);
            if (style) {
                let styleUri;
                let baseURI = node.baseURI;
                if (!baseURI || baseURI == 'about:blank') {
                    baseURI = window.location.href;
                }
                if (baseURI) {
                    const url = new URL('#' + id, baseURI);
                    styleUri = url.href;
                } else {
                    styleUri = '#' + id;
                }
                this.sharedStyles_[styleUri] = style;
            }
        }
    }

    /**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @private
 */
    readSharedStyleMap_(node, objectStack) {
        const id = node.getAttribute('id');
        if (id === null) {
            return;
        }
        const styleMapValue = readStyleMapValue.call(this, node, objectStack);
        if (!styleMapValue) {
            return;
        }
        let styleUri;
        let baseURI = node.baseURI;
        if (!baseURI || baseURI == 'about:blank') {
            baseURI = window.location.href;
        }
        if (baseURI) {
            const url = new URL('#' + id, baseURI);
            styleUri = url.href;
        } else {
            styleUri = '#' + id;
        }
        this.sharedStyles_[styleUri] = styleMapValue;
    }

    readSharedSchema_(node, objectStack) {
        const id = node.getAttribute('id');
        if (id !== null) {
            const schema = readSchema.call(this, node, objectStack);
            if (schema) {
                this.sharedSchemas_[id] = schema;
            }
        }
    }

    /////////
    async readFeatures(source, options) {
        const result = await super.readFeatures(source, options);
        this.sharedSchemas_ = {};
        return result;
    }
    /////////

    /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {import("../Feature.js").default} Feature.
   */
    readFeatureFromNode(node, options) {
        if (!NAMESPACE_URIS.includes(node.namespaceURI)) {
            return null;
        }
        const feature = this.readPlacemark_(node, [
            this.getReadOptions(node, options),
        ]);
        if (feature) {
            return feature;
        }
        return null;
    }

    /**
       * @protected
       * @param {Element} node Node.
       * @param {import("./Feature.js").ReadOptions} [options] Options.
       * @return {Array<import("../Feature.js").default>} Features.
       */
    readFeaturesFromNode(node, options) {
        if (!NAMESPACE_URIS.includes(node.namespaceURI)) {
            return [];
        }
        let features;
        const localName = node.localName;
        if (localName == 'Document' || localName == 'Folder') {
            features = this.readDocumentOrFolder_(node, [
                this.getReadOptions(node, options),
            ]);
            if (features) {
                ////////// Asignamos metadatos de esquemas compartidos a las entidades
                if (localName === 'Document') {
                    let metadata;
                    for (let schemaId in this.sharedSchemas_) {
                        const schema = this.sharedSchemas_[schemaId];
                        metadata ??= {
                            origin: Consts.format.KML,
                            originalMetadata: {
                                schemas: []
                            }
                        };
                        const schemaObj = {
                            id: schemaId,
                            simpleFields: schema.map((simpleField) => ({ ...simpleField }))
                        }
                        metadata.originalMetadata.schemas.push(schemaObj);
                    }
                    features.forEach((feat) => {
                        this.featureMetadata.set(feat, metadata);
                    });
                }
                //////////
                return features;
            }
            return [];
        }
        if (localName == 'Placemark') {
            const feature = this.readPlacemark_(node, [
                this.getReadOptions(node, options),
            ]);
            if (feature) {
                return [feature];
            }
            return [];
        }
        if (localName == 'kml') {
            features = [];
            for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
                const fs = this.readFeaturesFromNode(n, options);
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
        return [];
    }

    /**
 * Read the name of the KML.
 *
 * @param {Document|Element|string} source Source.
 * @return {string|undefined} Name.
 * @api
 */
    readName(source) {
        if (!source) {
            return undefined;
        }
        if (typeof source === 'string') {
            const doc = parse(source);
            return this.readNameFromDocument(doc);
        }
        if (isDocument(source)) {
            return this.readNameFromDocument(/** @type {Document} */(source));
        }
        return this.readNameFromNode(/** @type {Element} */(source));
    }

    /**
     * @param {Document} doc Document.
     * @return {string|undefined} Name.
     */
    readNameFromDocument(doc) {
        for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
            if (n.nodeType == Node.ELEMENT_NODE) {
                const name = this.readNameFromNode(/** @type {Element} */(n));
                if (name) {
                    return name;
                }
            }
        }
        return undefined;
    }

    /**
     * @param {Element} node Node.
     * @return {string|undefined} Name.
     */
    readNameFromNode(node) {
        for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
            if (NAMESPACE_URIS.includes(n.namespaceURI) && n.localName == 'name') {
                return readString(n);
            }
        }
        for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
            const localName = n.localName;
            if (
                NAMESPACE_URIS.includes(n.namespaceURI) &&
                (localName == 'Document' ||
                    localName == 'Folder' ||
                    localName == 'Placemark' ||
                    localName == 'kml')
            ) {
                const name = this.readNameFromNode(n);
                if (name) {
                    return name;
                }
            }
        }
        return undefined;
    }

    /**
     * Read the network links of the KML.
     *
     * @param {Document|Element|string} source Source.
     * @return {Array<Object>} Network links.
     * @api
     */
    readNetworkLinks(source) {
        const networkLinks = [];
        if (typeof source === 'string') {
            const doc = parse(source);
            extend(networkLinks, this.readNetworkLinksFromDocument(doc));
        } else if (isDocument(source)) {
            extend(
                networkLinks,
                this.readNetworkLinksFromDocument(/** @type {Document} */(source))
            );
        } else {
            extend(
                networkLinks,
                this.readNetworkLinksFromNode(/** @type {Element} */(source))
            );
        }
        return networkLinks;
    }

    /**
     * @param {Document} doc Document.
     * @return {Array<Object>} Network links.
     */
    readNetworkLinksFromDocument(doc) {
        const networkLinks = [];
        for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
            if (n.nodeType == Node.ELEMENT_NODE) {
                extend(
                    networkLinks,
                    this.readNetworkLinksFromNode(/** @type {Element} */(n))
                );
            }
        }
        return networkLinks;
    }

    /**
     * @param {Element} node Node.
     * @return {Array<Object>} Network links.
     */
    readNetworkLinksFromNode(node) {
        const networkLinks = [];
        for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
            if (
                NAMESPACE_URIS.includes(n.namespaceURI) &&
                n.localName == 'NetworkLink'
            ) {
                const obj = pushParseAndPop({}, NETWORK_LINK_PARSERS, n, []);
                networkLinks.push(obj);
            }
        }
        for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
            const localName = n.localName;
            if (
                NAMESPACE_URIS.includes(n.namespaceURI) &&
                (localName == 'Document' || localName == 'Folder' || localName == 'kml')
            ) {
                extend(networkLinks, this.readNetworkLinksFromNode(n));
            }
        }
        return networkLinks;
    }

    /**
     * Read the regions of the KML.
     *
     * @param {Document|Element|string} source Source.
     * @return {Array<Object>} Regions.
     * @api
     */
    readRegion(source) {
        const regions = [];
        if (typeof source === 'string') {
            const doc = parse(source);
            extend(regions, this.readRegionFromDocument(doc));
        } else if (isDocument(source)) {
            extend(
                regions,
                this.readRegionFromDocument(/** @type {Document} */(source))
            );
        } else {
            extend(regions, this.readRegionFromNode(/** @type {Element} */(source)));
        }
        return regions;
    }

    /**
     * @param {Document} doc Document.
     * @return {Array<Object>} Region.
     */
    readRegionFromDocument(doc) {
        const regions = [];
        for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
            if (n.nodeType == Node.ELEMENT_NODE) {
                extend(regions, this.readRegionFromNode(/** @type {Element} */(n)));
            }
        }
        return regions;
    }

    /**
     * @param {Element} node Node.
     * @return {Array<Object>} Region.
     * @api
     */
    readRegionFromNode(node) {
        const regions = [];
        for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
            if (NAMESPACE_URIS.includes(n.namespaceURI) && n.localName == 'Region') {
                const obj = pushParseAndPop({}, REGION_PARSERS, n, []);
                regions.push(obj);
            }
        }
        for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
            const localName = n.localName;
            if (
                NAMESPACE_URIS.includes(n.namespaceURI) &&
                (localName == 'Document' || localName == 'Folder' || localName == 'kml')
            ) {
                extend(regions, this.readRegionFromNode(n));
            }
        }
        return regions;
    }

    /**
     * @typedef {Object} KMLCamera Specifies the observer's viewpoint and associated view parameters.
     * @property {number} [Latitude] Latitude of the camera.
     * @property {number} [Longitude] Longitude of the camera.
     * @property {number} [Altitude] Altitude of the camera.
     * @property {string} [AltitudeMode] Floor-related altitude mode.
     * @property {number} [Heading] Horizontal camera rotation.
     * @property {number} [Tilt] Lateral camera rotation.
     * @property {number} [Roll] Vertical camera rotation.
     */

    /**
     * Read the cameras of the KML.
     *
     * @param {Document|Element|string} source Source.
     * @return {Array<KMLCamera>} Cameras.
     * @api
     */
    readCamera(source) {
        const cameras = [];
        if (typeof source === 'string') {
            const doc = parse(source);
            extend(cameras, this.readCameraFromDocument(doc));
        } else if (isDocument(source)) {
            extend(
                cameras,
                this.readCameraFromDocument(/** @type {Document} */(source))
            );
        } else {
            extend(cameras, this.readCameraFromNode(/** @type {Element} */(source)));
        }
        return cameras;
    }

    /**
     * @param {Document} doc Document.
     * @return {Array<KMLCamera>} Cameras.
     */
    readCameraFromDocument(doc) {
        const cameras = [];
        for (let n = /** @type {Node} */ (doc.firstChild); n; n = n.nextSibling) {
            if (n.nodeType === Node.ELEMENT_NODE) {
                extend(cameras, this.readCameraFromNode(/** @type {Element} */(n)));
            }
        }
        return cameras;
    }

    /**
     * @param {Element} node Node.
     * @return {Array<KMLCamera>} Cameras.
     * @api
     */
    readCameraFromNode(node) {
        const cameras = [];
        for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
            if (NAMESPACE_URIS.includes(n.namespaceURI) && n.localName === 'Camera') {
                const obj = pushParseAndPop({}, CAMERA_PARSERS, n, []);
                cameras.push(obj);
            }
        }
        for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
            const localName = n.localName;
            if (
                NAMESPACE_URIS.includes(n.namespaceURI) &&
                (localName === 'Document' ||
                    localName === 'Folder' ||
                    localName === 'Placemark' ||
                    localName === 'kml')
            ) {
                extend(cameras, this.readCameraFromNode(n));
            }
        }
        return cameras;
    }

    /**
     * Encode an array of features in the KML format as an XML node. GeometryCollections,
     * MultiPoints, MultiLineStrings, and MultiPolygons are output as MultiGeometries.
     *
     * @param {Array<Feature>} features Features.
     * @param {import("./Feature.js").WriteOptions} [options] Options.
     * @return {Node} Node.
     * @api
     */
    writeFeaturesNode(features, options) {
        options = this.adaptOptions(options);
        const kml = createElementNS(NAMESPACE_URIS[4], 'kml');
        const xmlnsUri = 'http://www.w3.org/2000/xmlns/';
        kml.setAttributeNS(xmlnsUri, 'xmlns:gx', GX_NAMESPACE_URIS[0]);
        kml.setAttributeNS(xmlnsUri, 'xmlns:xsi', XML_SCHEMA_INSTANCE_URI);
        kml.setAttributeNS(
            XML_SCHEMA_INSTANCE_URI,
            'xsi:schemaLocation',
            SCHEMA_LOCATION
        );

        const /** @type {import("../xml.js").NodeStackItem} */ context = {
            node: kml,
        };
        /** @type {!Object<string, (Array<Feature>|Feature|undefined)>} */
        const properties = {};

        //////////// KML no tiene estilo para puntos aparte del de icono. Para puntos sin icono creamos uno en SVG.
        features = features.map(getStyleProcessedFeature);

        // KML no pone etiquetas a líneas y polígonos. En esos casos ponemos un punto con la etiqueta.
        features = addPointFeaturesForLabels(features);

        //////////// Organizamos en carpetas
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
        const orderedKeys = KML_SEQUENCE[kml.namespaceURI];
        const values = makeSequence(properties, orderedKeys);
        pushSerializeAndPop(
            context,
            KML_SERIALIZERS,
            OBJECT_PROPERTY_NODE_FACTORY,
            values,
            [options],
            orderedKeys,
            this
        );
        return kml;
    }

    /////////////
    async writeFeatures(features, options = {}) {
        //////////// Poblamos esquemas de datos
        await fillSharedSchemas.call(this, features);

        const result = await super.writeFeatures(features, options);
        this.sharedSchemas_ = {};
        return result;
    }

    getFeatureTypeMetadata(metadata, features) {
        const newMetadata = { ...metadata };
        if (features.length) {
            const schemaUrls = features.map((feat) => featureSchemaUrls.get(feat));
            const schemaUrl = schemaUrls[0];
            if (schemaUrls.every((url) => url === schemaUrl)) {
                const schema = metadata.originalMetadata.schemas.find((s) => '#' + s.id === schemaUrl);
                if (schema) {
                    newMetadata.originalMetadata = {
                        schemas: [schema]
                    };
                    newMetadata.attributes = schema.simpleFields.map((field) => {
                        const obj = {
                            name: field.name,
                            originalType: field.type
                        };
                        switch (field.type) {
                            case 'int':
                            case 'uint':
                                obj.type = Consts.dataType.INTEGER;
                                break;
                            case 'short':
                            case 'ushort':
                                obj.type = Consts.dataType.SMALLINT;
                                break;
                            case 'float':
                                obj.type = Consts.dataType.FLOAT;
                                break;
                            case 'double':
                                obj.type = Consts.dataType.DOUBLE;
                                break;
                            case 'bool':
                                obj.type = Consts.dataType.BOOLEAN;
                                break;
                            default:
                                obj.type = Consts.dataType.STRING;
                                break;
                        }
                        return obj;
                    });
                    features.forEach((f) => f.unset(schemaUrlPropertyName));
                }
            }
        }
        return newMetadata;
    }

    groupFeatures(features, groupNamer) {
        const PATH_SEPARATOR = ' \u203A '
        const folderGroups = features.reduce((rv, feat) => {
            var id = feat._folders?.length ? feat._folders.join(PATH_SEPARATOR) : null;
            if (!id) {
                id = groupNamer(feat);
            }
            rv[id] ??= [];
            rv[id].push(feat);
            return rv;
        }, {});
        const result = {};
        for (let folderGroupName in folderGroups) {
            const folderGroup = folderGroups[folderGroupName];
            const schemaGroups = folderGroup.reduce((rv, feat) => {
                const schemaUrl = featureSchemaUrls.get(feat);
                rv[schemaUrl] ??= [];
                rv[schemaUrl].push(feat);
                return rv;
            }, {});
            if (Object.keys(schemaGroups).length > 1) {
                for (let schemaUrl in schemaGroups) {
                    result[folderGroupName + PATH_SEPARATOR + schemaUrl] = schemaGroups[schemaUrl];
                }
            }
            else {
                result[folderGroupName] = folderGroup;
            }
        }
        return result;
    }
}

/**
 * @param {Style|undefined} foundStyle Style.
 * @param {string} name Name.
 * @return {Style} style Style.
 */
function createNameStyleFunction(foundStyle, name) {
    if (!DEFAULT_TEXT_STYLE) createStyleDefaults();
    const textOffset = [0, 0];
    /** @type {CanvasTextAlign} */
    let textAlign = 'start';
    const imageStyle = foundStyle.getImage();
    if (imageStyle) {
        const imageSize = imageStyle.getSize();
        if (imageSize && imageSize.length == 2) {
            const imageScale = imageStyle.getScaleArray();
            const anchor = imageStyle.getAnchor();
            // Offset the label to be centered to the right of the icon,
            // if there is one.
            textOffset[0] = imageScale[0] * (imageSize[0] - anchor[0]);
            textOffset[1] = imageScale[1] * (imageSize[1] / 2 - anchor[1]);
            textAlign = 'left';
        }
    }
    let textStyle = foundStyle.getText();
    if (textStyle) {
        // clone the text style, customizing it with name, alignments and offset.
        // Note that kml does not support many text options that OpenLayers does (rotation, textBaseline).
        textStyle = textStyle.clone();
        textStyle.setFont(textStyle.getFont() || DEFAULT_TEXT_STYLE.getFont());
        textStyle.setScale(textStyle.getScale() || DEFAULT_TEXT_STYLE.getScale());
        textStyle.setFill(textStyle.getFill() || DEFAULT_TEXT_STYLE.getFill());
        textStyle.setStroke(textStyle.getStroke() || DEFAULT_TEXT_STROKE_STYLE);
    } else {
        textStyle = DEFAULT_TEXT_STYLE.clone();
    }
    textStyle.setText(name);
    textStyle.setOffsetX(textOffset[0]);
    textStyle.setOffsetY(textOffset[1]);
    textStyle.setTextAlign(textAlign);

    const nameStyle = new Style({
        image: imageStyle,
        text: textStyle,
    });
    if (foundStyle._balloon) nameStyle._balloon = foundStyle._balloon;
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
function createFeatureStyleFunction(
    style,
    styleUrl,
    defaultStyle,
    sharedStyles,
    showPointNames
) {
    return (
        /**
         * @param {Feature} feature feature.
         * @param {number} resolution Resolution.
         * @return {Array<Style>|Style} Style.
         */
        function (feature, resolution) {
            let drawName = showPointNames;
            let name = '';
            let multiGeometryPoints = [];
            if (drawName) {
                const geometry = feature.getGeometry();
                if (geometry) {
                    if (geometry instanceof GeometryCollection) {
                        multiGeometryPoints = geometry
                            .getGeometriesArrayRecursive()
                            .filter(function (geometry) {
                                const type = geometry.getType();
                                return type === 'Point' || type === 'MultiPoint';
                            });
                        drawName = multiGeometryPoints.length > 0;
                    } else {
                        const type = geometry.getType();
                        drawName = type === 'Point' || type === 'MultiPoint';
                    }
                }
            }

            if (drawName) {
                name = /** @type {string} */ (feature.get('name'));
                drawName = drawName && !!name;
                // convert any html character codes
                if (drawName && /&[^&]+;/.test(name)) {
                    if (!TEXTAREA) {
                        TEXTAREA = document.createElement('textarea');
                    }
                    TEXTAREA.innerHTML = name;
                    name = TEXTAREA.value;
                }
            }

            let featureStyle = defaultStyle;
            if (style) {
                featureStyle = style;
            } else if (styleUrl) {
                featureStyle = findStyle(styleUrl, defaultStyle, sharedStyles);
            }
            if (drawName) {
                const nameStyle = createNameStyleFunction(featureStyle[0], name);
                if (multiGeometryPoints.length > 0) {
                    // in multigeometries restrict the name style to points and create a
                    // style without image or text for geometries requiring fill or stroke
                    // including any polygon specific style if there is one
                    nameStyle.setGeometry(new GeometryCollection(multiGeometryPoints));
                    const baseStyle = new Style({
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
        }
    );
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
    if (typeof styleValue === 'string') {
        return findStyle(sharedStyles[styleValue], defaultStyle, sharedStyles);
    }
    return defaultStyle;
}

/**
 * @param {Node} node Node.
 * @return {import("../color.js").Color|undefined} Color.
 */
function readColor(node) {
    const s = getAllTextContent(node, false);
    // The KML specification states that colors should not include a leading `#`
    // but we tolerate them.
    const m = /^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(s);
    if (m) {
        const hexColor = m[1];
        return [
            parseInt(hexColor.substr(6, 2), 16),
            parseInt(hexColor.substr(4, 2), 16),
            parseInt(hexColor.substr(2, 2), 16),
            parseInt(hexColor.substr(0, 2), 16) / 255,
        ];
    }
    return undefined;
}

/**
 * @param {Node} node Node.
 * @return {Array<number>|undefined} Flat coordinates.
 */
export function readFlatCoordinates(node) {
    let s = getAllTextContent(node, false);
    const flatCoordinates = [];
    // The KML specification states that coordinate tuples should not include
    // spaces, but we tolerate them.
    s = s.replace(/\s*,\s*/g, ',');
    const re =
        /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?),([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s+|,|$)(?:([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s+|$))?\s*/i;
    let m;
    while ((m = re.exec(s))) {
        const x = parseFloat(m[1]);
        const y = parseFloat(m[2]);
        const z = m[3] ? parseFloat(m[3]) : 0;
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
    const s = getAllTextContent(node, false).trim();
    let baseURI = node.baseURI;
    if (!baseURI || baseURI == 'about:blank') {
        baseURI = window.location.href;
    }
    if (baseURI) {
        // flacunza: Parche para evitar peticiones HTTP desde una página HTTPS
        if (location.protocol === 'https:' && baseURI.indexOf('http://') === 0) {
            baseURI = baseURI.substr(5);
        }
        const url = new URL(s, baseURI);
        return url.href;
    }
    return s;
}
/**
 * @param {Node} node Node.
 * @return {string} URI.
 */
function readStyleURL(node) {
    // KML files in the wild occasionally forget the leading
    // `#` on styleUrlsdefined in the same document.
    const s = getAllTextContent(node, false)
        .trim()
        .replace(/^(?!.*#)/, '#');
    let baseURI = node.baseURI;
    if (!baseURI || baseURI == 'about:blank') {
        baseURI = window.location.href;
    }
    if (baseURI) {
        const url = new URL(s, baseURI);
        return url.href;
    }
    return s;
}

/**
 * @param {Element} node Node.
 * @return {Vec2} Vec2.
 */
function readVec2(node) {
    const xunits = node.getAttribute('xunits');
    const yunits = node.getAttribute('yunits');
    /** @type {import('../style/Icon.js').IconOrigin} */
    let origin;
    if (xunits !== 'insetPixels') {
        if (yunits !== 'insetPixels') {
            origin = 'bottom-left';
        } else {
            origin = 'top-left';
        }
    } else {
        if (yunits !== 'insetPixels') {
            origin = 'bottom-right';
        } else {
            origin = 'top-right';
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
const STYLE_MAP_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
const ICON_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
    var s = readString(node);
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
    var textStyle = new Text({
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
    const object = pushParseAndPop({}, ICON_STYLE_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    const styleObject = /** @type {Object} */ (
        objectStack[objectStack.length - 1]
    );
    const IconObject = 'Icon' in object ? object['Icon'] : {};
    const drawIcon = !('Icon' in object) || Object.keys(IconObject).length > 0;
    let src;
    const href = /** @type {string|undefined} */ (IconObject['href']);
    if (href) {
        src = href;
    } else if (drawIcon) {
        src = DEFAULT_IMAGE_STYLE_SRC;
    }
    let anchor, anchorXUnits, anchorYUnits;
    /** @type {import('../style/Icon.js').IconOrigin|undefined} */
    let anchorOrigin = 'bottom-left';
    const hotSpot = /** @type {Vec2|undefined} */ (object['hotSpot']);
    if (hotSpot) {
        anchor = [hotSpot.x, hotSpot.y];
        anchorXUnits = hotSpot.xunits;
        anchorYUnits = hotSpot.yunits;
        anchorOrigin = hotSpot.origin;
    } else if (/^https?:\/\/maps\.(?:google|gstatic)\.com\//.test(src)) {
        // Google hotspots from https://kml4earth.appspot.com/icons.html#notes
        if (src.includes('pushpin')) {
            anchor = DEFAULT_IMAGE_STYLE_ANCHOR;
            anchorXUnits = DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
            anchorYUnits = DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
        } else if (src.includes('arrow-reverse')) {
            anchor = [54, 42];
            anchorXUnits = DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
            anchorYUnits = DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
        } else if (src.includes('paddle')) {
            anchor = [32, 1];
            anchorXUnits = DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS;
            anchorYUnits = DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS;
        }
    }
    // Añadimos este control para evitar problemas CORS en Firefox
    if (drawIcon && /Firefox/.test(navigator.userAgent) && location.protocol === 'https:' && src.startsWith("http:")) {
        src = src.replace("http:", "https:");
    }
    let offset;
    const x = /** @type {number|undefined} */ (IconObject['x']);
    const y = /** @type {number|undefined} */ (IconObject['y']);
    if (x !== undefined && y !== undefined) {
        offset = [x, y];
    }

    let size;
    const w = /** @type {number|undefined} */ (IconObject['w']);
    const h = /** @type {number|undefined} */ (IconObject['h']);
    if (w !== undefined && h !== undefined) {
        size = [w, h];
    }

    let rotation;
    const heading = /** @type {number} */ (object['heading']);
    if (heading !== undefined) {
        rotation = toRadians(heading);
    }

    const scale = /** @type {number|undefined} */ (object['scale']);

    const color = /** @type {Array<number>|undefined} */ (object['color']);

    if (drawIcon) {
        if (src == DEFAULT_IMAGE_STYLE_SRC) {
            size = DEFAULT_IMAGE_STYLE_SIZE;
        }

        const imageStyle = new Icon({
            anchor: anchor,
            anchorOrigin: anchorOrigin,
            anchorXUnits: anchorXUnits,
            anchorYUnits: anchorYUnits,
            crossOrigin: this.crossOrigin_,
            offset: offset,
            offsetOrigin: 'bottom-left',
            rotation: rotation,
            scale: scale,
            size: size,
            src: this.iconUrlFunction_(src),
            color: color,
        });

        const imageScale = imageStyle.getScaleArray()[0];
        const imageSize = imageStyle.getSize();
        if (imageSize === null) {
            const imageState = imageStyle.getImageState();
            if (imageState === ImageState.IDLE || imageState === ImageState.LOADING) {
                const listener = function () {
                    const imageState = imageStyle.getImageState();
                    if (
                        !(
                            imageState === ImageState.IDLE ||
                            imageState === ImageState.LOADING
                        )
                    ) {
                        const imageSize = imageStyle.getSize();
                        if (imageSize && imageSize.length == 2) {
                            const resizeScale = scaleForSize(imageSize);
                            imageStyle.setScale(imageScale * resizeScale);
                        }
                        imageStyle.unlistenImageChange(listener);
                    }
                };
                imageStyle.listenImageChange(listener);
                if (imageState === ImageState.IDLE) {
                    imageStyle.load();
                }
            }
        } else if (imageSize.length == 2) {
            const resizeScale = scaleForSize(imageSize);
            imageStyle.setScale(imageScale * resizeScale);
        }
        styleObject['imageStyle'] = imageStyle;
    } else {
        // handle the case when we explicitly want to draw no icon.
        styleObject['imageStyle'] = DEFAULT_NO_IMAGE_STYLE;
    }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const LABEL_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeObjectPropertySetter(readColor),
    'scale': makeObjectPropertySetter(readScale),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function labelStyleParser(node, objectStack) {
    // FIXME colorMode
    const object = pushParseAndPop({}, LABEL_STYLE_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    const styleObject = objectStack[objectStack.length - 1];
    const textStyle = new Text({
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
const LINE_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
    const object = pushParseAndPop({}, LINE_STYLE_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    const styleObject = objectStack[objectStack.length - 1];
    const strokeStyle = new Stroke({
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
const POLY_STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
    const object = pushParseAndPop({}, POLY_STYLE_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    const styleObject = objectStack[objectStack.length - 1];
    const fillStyle = new Fill({
        color:
            /** @type {import("../color.js").Color} */
            ('color' in object ? object['color'] : DEFAULT_COLOR),
    });
    styleObject['fillStyle'] = fillStyle;
    const fill = /** @type {boolean|undefined} */ (object['fill']);
    if (fill !== undefined) {
        styleObject['fill'] = fill;
    }
    const outline = /** @type {boolean|undefined} */ (object['outline']);
    if (outline !== undefined) {
        styleObject['outline'] = outline;
    }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const FLAT_LINEAR_RING_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
    const gxTrackObject =
        /** @type {GxTrackObject} */
        (objectStack[objectStack.length - 1]);
    const coordinates = gxTrackObject.coordinates;
    const s = getAllTextContent(node, false);
    const re =
        /^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*$/i;
    const m = re.exec(s);
    if (m) {
        const x = parseFloat(m[1]);
        const y = parseFloat(m[2]);
        const z = parseFloat(m[3]);
        coordinates.push([x, y, z]);
    } else {
        coordinates.push([]);
    }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const GX_MULTITRACK_GEOMETRY_PARSERS = makeStructureNS(GX_NAMESPACE_URIS, {
    'Track': makeArrayPusher(readGxTrack),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {MultiLineString|undefined} MultiLineString.
 */
function readGxMultiTrack(node, objectStack) {
    const lineStrings = pushParseAndPop(
        [],
        GX_MULTITRACK_GEOMETRY_PARSERS,
        node,
        objectStack
    );
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
const GX_TRACK_PARSERS = makeStructureNS(
    NAMESPACE_URIS,
    {
        'when': whenParser,
    },
    makeStructureNS(GX_NAMESPACE_URIS, {
        'coord': gxCoordParser,
    })
);

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {LineString|undefined} LineString.
 */
function readGxTrack(node, objectStack) {
    const gxTrackObject = pushParseAndPop(
    /** @type {GxTrackObject} */({
            coordinates: [],
            whens: [],
        }),
        GX_TRACK_PARSERS,
        node,
        objectStack
    );
    if (!gxTrackObject) {
        return undefined;
    }
    const flatCoordinates = [];
    const coordinates = gxTrackObject.coordinates;
    const whens = gxTrackObject.whens;
    for (
        let i = 0, ii = Math.min(coordinates.length, whens.length);
        i < ii;
        ++i
    ) {
        if (coordinates[i].length == 3) {
            flatCoordinates.push(
                coordinates[i][0],
                coordinates[i][1],
                coordinates[i][2],
                whens[i]
            );
        }
    }
    return new LineString(flatCoordinates, 'XYZM');
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const ICON_PARSERS = makeStructureNS(
    NAMESPACE_URIS,
    {
        'href': makeObjectPropertySetter(readURI),
    },
    makeStructureNS(GX_NAMESPACE_URIS, {
        'x': makeObjectPropertySetter(readDecimal),
        'y': makeObjectPropertySetter(readDecimal),
        'w': makeObjectPropertySetter(readDecimal),
        'h': makeObjectPropertySetter(readDecimal),
    })
);

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object} Icon object.
 */
function readIcon(node, objectStack) {
    const iconObject = pushParseAndPop({}, ICON_PARSERS, node, objectStack);
    if (iconObject) {
        return iconObject;
    }
    return null;
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const GEOMETRY_FLAT_COORDINATES_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'coordinates': makeReplacer(readFlatCoordinates),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Array<number>} Flat coordinates.
 */
function readFlatCoordinatesFromNode(node, objectStack) {
    return pushParseAndPop(
        null,
        GEOMETRY_FLAT_COORDINATES_PARSERS,
        node,
        objectStack
    );
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const EXTRUDE_AND_ALTITUDE_MODE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
    const properties = pushParseAndPop(
        {},
        EXTRUDE_AND_ALTITUDE_MODE_PARSERS,
        node,
        objectStack
    );
    const flatCoordinates = readFlatCoordinatesFromNode(node, objectStack);
    if (flatCoordinates) {
        const lineString = new LineString(flatCoordinates, 'XYZ');
        lineString.setProperties(properties, true);
        return lineString;
    }
    return undefined;
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Polygon|undefined} Polygon.
 */
function readLinearRing(node, objectStack) {
    const properties = pushParseAndPop(
        {},
        EXTRUDE_AND_ALTITUDE_MODE_PARSERS,
        node,
        objectStack
    );
    const flatCoordinates = readFlatCoordinatesFromNode(node, objectStack);
    if (flatCoordinates) {
        const polygon = new Polygon(flatCoordinates, 'XYZ', [
            flatCoordinates.length,
        ]);
        polygon.setProperties(properties, true);
        return polygon;
    }
    return undefined;
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const MULTI_GEOMETRY_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
    const geometries = pushParseAndPop(
        [],
        MULTI_GEOMETRY_PARSERS,
        node,
        objectStack
    );
    if (!geometries) {
        return null;
    }
    if (geometries.length === 0) {
        return new GeometryCollection(geometries);
    }
    let multiGeometry;
    let homogeneous = true;
    const type = geometries[0].getType();
    let geometry;
    for (let i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        if (geometry.getType() != type) {
            homogeneous = false;
            break;
        }
    }
    if (homogeneous) {
        let layout;
        let flatCoordinates;
        if (type == 'Point') {
            const point = geometries[0];
            layout = point.getLayout();
            flatCoordinates = point.getFlatCoordinates();
            for (let i = 1, ii = geometries.length; i < ii; ++i) {
                geometry = geometries[i];
                extend(flatCoordinates, geometry.getFlatCoordinates());
            }
            multiGeometry = new MultiPoint(flatCoordinates, layout);
            setCommonGeometryProperties(multiGeometry, geometries);
        } else if (type == 'LineString') {
            multiGeometry = new MultiLineString(geometries);
            setCommonGeometryProperties(multiGeometry, geometries);
        } else if (type == 'Polygon') {
            multiGeometry = new MultiPolygon(geometries);
            setCommonGeometryProperties(multiGeometry, geometries);
        } else if (type == 'GeometryCollection') {
            multiGeometry = new GeometryCollection(geometries);
        } else {
            throw new Error('Unknown geometry type found');
        }
    } else {
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
    const properties = pushParseAndPop(
        {},
        EXTRUDE_AND_ALTITUDE_MODE_PARSERS,
        node,
        objectStack
    );
    const flatCoordinates = readFlatCoordinatesFromNode(node, objectStack);
    if (flatCoordinates) {
        const point = new Point(flatCoordinates, 'XYZ');
        point.setProperties(properties, true);
        return point;
    }
    return undefined;
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const FLAT_LINEAR_RINGS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'innerBoundaryIs': innerBoundaryIsParser,
    'outerBoundaryIs': outerBoundaryIsParser,
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Polygon|undefined} Polygon.
 */
function readPolygon(node, objectStack) {
    const properties = pushParseAndPop(
    /** @type {Object<string,*>} */({}),
        EXTRUDE_AND_ALTITUDE_MODE_PARSERS,
        node,
        objectStack
    );
    const flatLinearRings = pushParseAndPop(
        [null],
        FLAT_LINEAR_RINGS_PARSERS,
        node,
        objectStack
    );
    if (flatLinearRings && flatLinearRings[0]) {
        const flatCoordinates = flatLinearRings[0];
        const ends = [flatCoordinates.length];
        for (let i = 1, ii = flatLinearRings.length; i < ii; ++i) {
            extend(flatCoordinates, flatLinearRings[i]);
            ends.push(flatCoordinates.length);
        }
        const polygon = new Polygon(flatCoordinates, 'XYZ', ends);
        polygon.setProperties(properties, true);
        return polygon;
    }
    return undefined;
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const STYLE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
    const styleObject = pushParseAndPop(
        {},
        STYLE_PARSERS,
        node,
        objectStack,
        this
    );
    if (!styleObject) {
        return null;
    }
    let fillStyle =
        /** @type {Fill} */
        (
            'fillStyle' in styleObject ? styleObject['fillStyle'] : DEFAULT_FILL_STYLE
        );
    const fill = /** @type {boolean|undefined} */ (styleObject['fill']);
    if (fill !== undefined && !fill) {
        fillStyle = null;
    }
    let imageStyle;
    if ('imageStyle' in styleObject) {
        if (styleObject['imageStyle'] != DEFAULT_NO_IMAGE_STYLE) {
            imageStyle = /** @type {import("../style/Image.js").default} */ (
                styleObject['imageStyle']
            );
        }
    } else {
        imageStyle = DEFAULT_IMAGE_STYLE;
    }
    const textStyle =
        /** @type {Text} */
        (
            'textStyle' in styleObject ? styleObject['textStyle'] : DEFAULT_TEXT_STYLE
        );
    const strokeStyle =
        /** @type {Stroke} */
        (
            'strokeStyle' in styleObject
                ? styleObject['strokeStyle']
                : DEFAULT_STROKE_STYLE
        );
    let resultStyle;
    const outline = /** @type {boolean|undefined} */ (styleObject['outline']);
    if (outline !== undefined && !outline) {
        // if the polystyle specifies no outline two styles are needed,
        // one for non-polygon geometries where linestrings require a stroke
        // and one for polygons where there should be no stroke
        resultStyle = [
            new Style({
                geometry: function (feature) {
                    const geometry = feature.getGeometry();
                    const type = geometry.getType();
                    if (type === 'GeometryCollection') {
                        const collection =
              /** @type {import("../geom/GeometryCollection").default} */ (
                                geometry
                            );
                        return new GeometryCollection(
                            collection
                                .getGeometriesArrayRecursive()
                                .filter(function (geometry) {
                                    const type = geometry.getType();
                                    return type !== 'Polygon' && type !== 'MultiPolygon';
                                })
                        );
                    }
                    if (type !== 'Polygon' && type !== 'MultiPolygon') {
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
                    const geometry = feature.getGeometry();
                    const type = geometry.getType();
                    if (type === 'GeometryCollection') {
                        const collection =
                        /** @type {import("../geom/GeometryCollection").default} */ (
                                geometry
                            );
                        return new GeometryCollection(
                            collection
                                .getGeometriesArrayRecursive()
                                .filter(function (geometry) {
                                    const type = geometry.getType();
                                    return type === 'Polygon' || type === 'MultiPolygon';
                                })
                        );
                    }
                    if (type === 'Polygon' || type === 'MultiPolygon') {
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
    const ii = geometries.length;
    const extrudes = new Array(geometries.length);
    const tessellates = new Array(geometries.length);
    const altitudeModes = new Array(geometries.length);
    let hasExtrude, hasTessellate, hasAltitudeMode;
    hasExtrude = false;
    hasTessellate = false;
    hasAltitudeMode = false;
    for (let i = 0; i < ii; ++i) {
        const geometry = geometries[i];
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
const DATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'displayName': makeObjectPropertySetter(readString),
    'value': makeObjectPropertySetter(readString),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function dataParser(node, objectStack) {
    const name = node.getAttribute('name');
    parseNode(DATA_PARSERS, node, objectStack);
    const featureObject = /** @type {Object} */ (
        objectStack[objectStack.length - 1]
    );
    if (name && featureObject.displayName) {
        featureObject[name] = {
            value: featureObject.value,
            displayName: featureObject.displayName,
            toString: function () {
                return featureObject.value;
            },
        };
        delete featureObject['displayName'];
    } else if (name !== null) {
        featureObject[name] = featureObject.value;
    } else if (featureObject.displayName !== null) {
        featureObject[featureObject.displayName] = featureObject.value;
    }
    delete featureObject['value'];
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const EXTENDED_DATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
const PAIR_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'Style': makeObjectPropertySetter(readStyle),
    'key': makeObjectPropertySetter(readString),
    'styleUrl': makeObjectPropertySetter(readStyleURL),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function pairDataParser(node, objectStack) {
    const pairObject = pushParseAndPop({}, PAIR_PARSERS, node, objectStack, this);
    if (!pairObject) {
        return;
    }
    const key = /** @type {string|undefined} */ (pairObject['key']);
    if (key && key == 'normal') {
        const styleUrl = /** @type {string|undefined} */ (pairObject['styleUrl']);
        if (styleUrl) {
            objectStack[objectStack.length - 1] = styleUrl;
        }
        const style = /** @type {Style} */ (pairObject['Style']);
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
    const styleMapValue = readStyleMapValue.call(this, node, objectStack);
    if (!styleMapValue) {
        return;
    }
    const placemarkObject = objectStack[objectStack.length - 1];
    if (Array.isArray(styleMapValue)) {
        placemarkObject['Style'] = styleMapValue;
    } else if (typeof styleMapValue === 'string') {
        placemarkObject['styleUrl'] = styleMapValue;
    } else {
        throw new Error('`styleMapValue` has an unknown type');
    }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const SCHEMA_DATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'SimpleData': simpleDataParser,
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function schemaDataParser(node, objectStack) {
    ///////////////
    const schemaUrl = node.getAttribute('schemaUrl');
    if (schemaUrl !== null) {
        const featureObject = /** @type {Object} */ (
            objectStack[objectStack.length - 1]
        );
        featureObject[schemaUrlPropertyName] = schemaUrl;
    }
    ///////////////
    parseNode(SCHEMA_DATA_PARSERS, node, objectStack);
}

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function simpleDataParser(node, objectStack) {
    const name = node.getAttribute('name');
    if (name !== null) {
        const data = readString(node);
        const featureObject = /** @type {Object} */ (
            objectStack[objectStack.length - 1]
        );
        featureObject[name] = data;
    }
}

//////////////////
const SCHEMA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'SimpleField': makeArrayExtender(simpleFieldParser),
});

const SCHEMA_FIELD_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'displayName': makeObjectPropertySetter(readString),
});

function simpleFieldParser(node, objectStack) {
    const schemaObject = pushParseAndPop({}, SCHEMA_FIELD_PARSERS, node, objectStack, this);
    const name = node.getAttribute('name');
    const type = node.getAttribute('type');
    if (name !== null && type !== null) {
        schemaObject.name = name;
        schemaObject.type = type;
        return schemaObject;
    }
}

function readSchema(node, objectStack) {
    const schemaObject = pushParseAndPop(
        [],
        SCHEMA_PARSERS,
        node,
        objectStack,
        this
    );
    if (!schemaObject) {
        return null;
    }
    return schemaObject;
}

const SCHEMA_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'SimpleField': makeChildAppender(writeSimpleFieldNode),
    'displayName': makeChildAppender(writeDataNodeName),
    //'name': 
});

function writeSimpleFieldNode(node, object, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    node.setAttribute('name', object.name);
    node.setAttribute('type', object.type);
    if (object.displayName) {
        pushSerializeAndPop(
            context,
            SCHEMA_SERIALIZERS,
            OBJECT_PROPERTY_NODE_FACTORY,
            [object.displayName],
            objectStack,
            ['displayName']
        );
    }
};
//////////////////

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const LAT_LON_ALT_BOX_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
    const object = pushParseAndPop(
        {},
        LAT_LON_ALT_BOX_PARSERS,
        node,
        objectStack
    );
    if (!object) {
        return;
    }
    const regionObject = /** @type {Object} */ (
        objectStack[objectStack.length - 1]
    );
    const extent = [
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
const LOD_PARSERS = makeStructureNS(NAMESPACE_URIS, {
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
    const object = pushParseAndPop({}, LOD_PARSERS, node, objectStack);
    if (!object) {
        return;
    }
    const lodObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
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
const INNER_BOUNDARY_IS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    // KML spec only allows one LinearRing  per innerBoundaryIs, but Google Earth
    // allows multiple, so we parse multiple here too.
    'LinearRing': makeArrayPusher(readFlatLinearRing),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function innerBoundaryIsParser(node, objectStack) {
    const innerBoundaryFlatLinearRings = pushParseAndPop(
    /** @type {Array<Array<number>>} */([]),
        INNER_BOUNDARY_IS_PARSERS,
        node,
        objectStack
    );
    if (innerBoundaryFlatLinearRings.length > 0) {
        const flatLinearRings =
            /** @type {Array<Array<number>>} */
            (objectStack[objectStack.length - 1]);
        flatLinearRings.push(...innerBoundaryFlatLinearRings);
    }
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
// @ts-ignore
const OUTER_BOUNDARY_IS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
    'LinearRing': makeReplacer(readFlatLinearRing),
});

/**
 * @param {Element} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
function outerBoundaryIsParser(node, objectStack) {
    /** @type {Array<number>|undefined} */
    const flatLinearRing = pushParseAndPop(
        undefined,
        OUTER_BOUNDARY_IS_PARSERS,
        node,
        objectStack
    );
    if (flatLinearRing) {
        const flatLinearRings =
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
    const gxTrackObject =
        /** @type {GxTrackObject} */
        (objectStack[objectStack.length - 1]);
    const whens = gxTrackObject.whens;
    const s = getAllTextContent(node, false);
    const when = Date.parse(s);
    whens.push(isNaN(when) ? 0 : when);
}

/**
 * @param {Node} node Node to append a TextNode with the color to.
 * @param {import("../color.js").Color|string} color Color.
 */
function writeColorTextNode(node, color) {
    const rgba = asArray(color);
    const opacity = rgba.length == 4 ? rgba[3] : 1;
    /** @type {Array<string|number>} */
    const abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
    for (let i = 0; i < 4; ++i) {
        const hex = Math.floor(/** @type {number} */(abgr[i])).toString(16);
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
    const context = objectStack[objectStack.length - 1];

    const layout = context['layout'];
    const stride = context['stride'];

    let dimension;
    if (layout == 'XY' || layout == 'XYM') {
        dimension = 2;
    } else if (layout == 'XYZ' || layout == 'XYZM') {
        dimension = 3;
    } else {
        throw new Error('Invalid geometry layout');
    }

    const ii = coordinates.length;
    let text = '';
    if (ii > 0) {
        text += coordinates[0];
        for (let d = 1; d < dimension; ++d) {
            text += ',' + coordinates[d];
        }
        for (let i = stride; i < ii; i += stride) {
            text += ' ' + coordinates[i];
            for (let d = 1; d < dimension; ++d) {
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
const EXTENDEDDATA_NODE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'Data': makeChildAppender(writeDataNode),
    'value': makeChildAppender(writeDataNodeValue),
    'displayName': makeChildAppender(writeDataNodeName),
    'SchemaData': makeChildAppender(writeSchemaDataNode),
    'SimpleData': makeChildAppender(writeSimpleDataNode)
});

/**
 * @param {Element} node Node.
 * @param {{name: *, value: *}} pair Name value pair.
 * @param {Array<*>} objectStack Object stack.
 */
function writeDataNode(node, pair, objectStack) {
    node.setAttribute('name', pair.name);
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    const value = pair.value;

    if (typeof value == 'object') {
        if (value !== null && value.displayName) {
            pushSerializeAndPop(
                context,
                EXTENDEDDATA_NODE_SERIALIZERS,
                OBJECT_PROPERTY_NODE_FACTORY,
                [value.displayName],
                objectStack,
                ['displayName']
            );
        }

        if (value !== null && value.value) {
            pushSerializeAndPop(
                context,
                EXTENDEDDATA_NODE_SERIALIZERS,
                OBJECT_PROPERTY_NODE_FACTORY,
                [value.value],
                objectStack,
                ['value']
            );
        }
    } else {
        pushSerializeAndPop(
            context,
            EXTENDEDDATA_NODE_SERIALIZERS,
            OBJECT_PROPERTY_NODE_FACTORY,
            [value],
            objectStack,
            ['value']
        );
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

/////////
function writeSchemaDataNode(node, object, objectStack) {
    node.setAttribute('schemaUrl', object.schemaUrl);
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };

    const names = object.schemaData.names;
    const values = object.schemaData.values;
    const length = names.length;

    for (let i = 0; i < length; i++) {
        pushSerializeAndPop(
            context,
            EXTENDEDDATA_NODE_SERIALIZERS,
            SIMPLE_DATA_NODE_FACTORY,
            [{ name: names[i], value: values[i] }],
            objectStack
        );
    }
}

function writeSimpleDataNode(node, pair, _objectStack) {
    node.setAttribute('name', pair.name);
    writeStringTextNode(node, pair.value);
}
/////////
/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const DOCUMENT_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['name', 'Schema']);
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
var DOCUMENT_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'Placemark': makeChildAppender(writePlacemark),
    'Document': makeChildAppender(writeDocument),
    'Folder': makeChildAppender(writeDocument),
    'name': makeChildAppender(writeStringTextNode),
    'Schema': makeChildAppender(writeSchema)
});
/**
 * @const
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string} [nodeName] Node name.
 * @return {Node|undefined} Node.
 */
const DOCUMENT_NODE_FACTORY = function (value, objectStack, nodeName) {
    const parentNode = objectStack[objectStack.length - 1].node;
    if (Array.isArray(value)) { // Es una carpeta
        return createElementNS(parentNode.namespaceURI, 'Folder');
    }
    if (typeof value === 'string') { // Es un nombre de carpeta
        return createElementNS(parentNode.namespaceURI, 'name');
    }
    return createElementNS(parentNode.namespaceURI, 'Placemark');
};

///////////
const SCHEMA_NODE_FACTORY = function (value, objectStack, nodeName) {
    const parentNode = objectStack[objectStack.length - 1].node;
    const result = createElementNS(parentNode.namespaceURI, 'Schema');
    result.setAttribute('id', value.id);
    result.setAttribute('name', value.id);
    return result;
};

const SIMPLE_FIELD_NODE_FACTORY = function (value, objectStack, nodeName) {
    const parentNode = objectStack[objectStack.length - 1].node;
    const result = createElementNS(parentNode.namespaceURI, 'SimpleField');
    result.setAttribute('type', value.type);
    result.setAttribute('name', value.id);
    return result;
};
///////////

/**
 * @param {Node} node Node.
 * @param {Array<Feature>} features Features.
 * @param {Array<*>} objectStack Object stack.
 * @this {KML}
 */
function writeDocument(node, featuresOrFolders, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    if (featuresOrFolders._name) {
        const properties = { name: featuresOrFolders._name };
        const parentNode = objectStack[objectStack.length - 1].node;
        const orderedKeys = DOCUMENT_SEQUENCE[parentNode.namespaceURI];
        const values = makeSequence(properties, orderedKeys);
        pushSerializeAndPop(
            context,
            DOCUMENT_SERIALIZERS,
            DOCUMENT_NODE_FACTORY,
            values,
            objectStack,
            orderedKeys
        );
    }
    /////////////
    if (node.localName === 'Document') {
        for (let schemaUrl in this.sharedSchemas_) {
            pushSerializeAndPop(
                context,
                DOCUMENT_SERIALIZERS,
                SCHEMA_NODE_FACTORY,
                [{ id: schemaUrl.substring(schemaUrl.indexOf('#') + 1), simpleFields: this.sharedSchemas_[schemaUrl] }],
                objectStack,
                undefined,
                this
            );
        }
    }
    ////////////
    pushSerializeAndPop(
        context,
        DOCUMENT_SERIALIZERS,
        DOCUMENT_NODE_FACTORY,
        featuresOrFolders,
        objectStack,
        undefined,
        this
    );
}

//////////////
/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
//var SCHEMA_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
//    'SimpleField': makeChildAppender(writeSimpleField)
//});

function writeSchema(node, object, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    for (let simpleField of object.simpleFields) {
        pushSerializeAndPop(
            context,
            SCHEMA_SERIALIZERS,
            SIMPLE_FIELD_NODE_FACTORY,
            [{ ...simpleField }],
            objectStack
        );
    }
}
//////////////

/**
 * A factory for creating Data nodes.
 * @const
 * @type {function(*, Array<*>): (Node|undefined)}
 */
const DATA_NODE_FACTORY = makeSimpleNodeFactory('Data');

/////////
const SCHEMA_DATA_NODE_FACTORY = makeSimpleNodeFactory('SchemaData');
const SIMPLE_DATA_NODE_FACTORY = makeSimpleNodeFactory('SimpleData');
/////////

/**
 * @param {Element} node Node.
 * @param {{names: Array<string>, values: (Array<*>)}} namesAndValues Names and values.
 * @param {Array<*>} objectStack Object stack.
 */
function writeExtendedData(node, namesAndValues, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    const names = namesAndValues.names;
    const values = namesAndValues.values;
    const length = names.length;

    ///////
    if (namesAndValues.schemaUrl) {
        pushSerializeAndPop(
            context,
            EXTENDEDDATA_NODE_SERIALIZERS,
            SCHEMA_DATA_NODE_FACTORY,
            [{ schemaUrl: namesAndValues.schemaUrl, schemaData: { names, values } }],
            objectStack
        );
    }
    ///////
    else {
        for (let i = 0; i < length; i++) {
            pushSerializeAndPop(
                context,
                EXTENDEDDATA_NODE_SERIALIZERS,
                DATA_NODE_FACTORY,
                [{ name: names[i], value: values[i] }],
                objectStack
            );
        }
    }
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const ICON_SEQUENCE = makeStructureNS(
    NAMESPACE_URIS,
    ['href'],
    makeStructureNS(GX_NAMESPACE_URIS, ['x', 'y', 'w', 'h'])
);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const ICON_SERIALIZERS = makeStructureNS(
    NAMESPACE_URIS,
    {
        'href': makeChildAppender(writeStringTextNode),
    },
    makeStructureNS(GX_NAMESPACE_URIS, {
        'x': makeChildAppender(writeDecimalTextNode),
        'y': makeChildAppender(writeDecimalTextNode),
        'w': makeChildAppender(writeDecimalTextNode),
        'h': makeChildAppender(writeDecimalTextNode),
    })
);

/**
 * @const
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string} [nodeName] Node name.
 * @return {Node|undefined} Node.
 */
const GX_NODE_FACTORY = function (value, objectStack, nodeName) {
    return createElementNS(GX_NAMESPACE_URIS[0], 'gx:' + nodeName);
};

/**
 * @param {Element} node Node.
 * @param {Object} icon Icon object.
 * @param {Array<*>} objectStack Object stack.
 */
function writeIcon(node, icon, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    const parentNode = objectStack[objectStack.length - 1].node;
    let orderedKeys = ICON_SEQUENCE[parentNode.namespaceURI];
    let values = makeSequence(icon, orderedKeys);
    pushSerializeAndPop(
        context,
        ICON_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        values,
        objectStack,
        orderedKeys
    );
    orderedKeys = ICON_SEQUENCE[GX_NAMESPACE_URIS[0]];
    values = makeSequence(icon, orderedKeys);
    pushSerializeAndPop(
        context,
        ICON_SERIALIZERS,
        GX_NODE_FACTORY,
        values,
        objectStack,
        orderedKeys
    );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const ICON_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
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
const ICON_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'Icon': makeChildAppender(writeIcon),
    'color': makeChildAppender(writeColorTextNode),
    'heading': makeChildAppender(writeDecimalTextNode),
    'hotSpot': makeChildAppender(writeVec2),
    'scale': makeChildAppender(writeScaleTextNode),
});

/**
 * @param {Element} node Node.
 * @param {import("../style/Icon.js").default} style Icon style.
 * @param {Array<*>} objectStack Object stack.
 */
function writeIconStyle(node, style, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    const /** @type {Object<string, any>} */ properties = {};
    const src = style.getSrc();
    const size = style.getSize();
    const iconImageSize = style.getImageSize();
    const iconProperties = {
        'href': src,
    };

    if (size) {
        iconProperties['w'] = size[0];
        iconProperties['h'] = size[1];
        const anchor = style.getAnchor(); // top-left
        const origin = style.getOrigin(); // top-left

        if (origin && iconImageSize && origin[0] !== 0 && origin[1] !== size[1]) {
            iconProperties['x'] = origin[0];
            iconProperties['y'] = iconImageSize[1] - (origin[1] + size[1]);
        }

        if (anchor && (anchor[0] !== size[0] / 2 || anchor[1] !== size[1] / 2)) {
            const /** @type {Vec2} */ hotSpot = {
                x: anchor[0],
                xunits: 'pixels',
                y: size[1] - anchor[1],
                yunits: 'pixels',
            };
            properties['hotSpot'] = hotSpot;
        }
    }

    properties['Icon'] = iconProperties;

    let scale = style.getScaleArray()[0];
    let imageSize = size;
    if (imageSize === null) {
        if (!DEFAULT_IMAGE_STYLE_SIZE) createStyleDefaults();
        imageSize = DEFAULT_IMAGE_STYLE_SIZE;
    }
    if (imageSize.length == 2) {
        const resizeScale = scaleForSize(imageSize);
        scale = scale / resizeScale;
    }
    if (scale !== 1) {
        properties['scale'] = scale;
    }

    const rotation = style.getRotation();
    if (rotation !== 0) {
        //03/11/201 URI: pasamos de radianes a grados
        properties['heading'] = rotation * (180 / Math.PI);
        //properties['heading'] = rotation; // 0-360
    }

    const color = style.getColor();
    if (color) {
        properties['color'] = color;
    }

    const parentNode = objectStack[objectStack.length - 1].node;
    const orderedKeys = ICON_STYLE_SEQUENCE[parentNode.namespaceURI];
    const values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(
        context,
        ICON_STYLE_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        values,
        objectStack,
        orderedKeys
    );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const LABEL_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
    'color',
    'scale',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const LABEL_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeChildAppender(writeColorTextNode),
    'scale': makeChildAppender(writeScaleTextNode),
});

/**
 * @param {Element} node Node.
 * @param {Text} style style.
 * @param {Array<*>} objectStack Object stack.
 */
function writeLabelStyle(node, style, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    const properties = {};
    const fill = style.getFill();
    if (fill) {
        properties['color'] = fill.getColor();
    }
    const scale = style.getScale();
    if (scale && scale !== 1) {
        properties['scale'] = scale;
    }
    const parentNode = objectStack[objectStack.length - 1].node;
    const orderedKeys = LABEL_STYLE_SEQUENCE[parentNode.namespaceURI];
    const values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(
        context,
        LABEL_STYLE_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        values,
        objectStack,
        orderedKeys
    );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const LINE_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, ['color', 'width']);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const LINE_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeChildAppender(writeColorTextNode),
    'width': makeChildAppender(writeDecimalTextNode),
});

/**
 * @param {Element} node Node.
 * @param {Stroke} style style.
 * @param {Array<*>} objectStack Object stack.
 */
function writeLineStyle(node, style, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    const properties = {
        'color': style.getColor(),
        'width': Number(style.getWidth()) || 1,
    };
    const parentNode = objectStack[objectStack.length - 1].node;
    const orderedKeys = LINE_STYLE_SEQUENCE[parentNode.namespaceURI];
    const values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(
        context,
        LINE_STYLE_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        values,
        objectStack,
        orderedKeys
    );
}

/**
 * @const
 * @type {Object<string, string>}
 */
const GEOMETRY_TYPE_TO_NODENAME = {
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
 * @param {string} [nodeName] Node name.
 * @return {Node|undefined} Node.
 */
const GEOMETRY_NODE_FACTORY = function (value, objectStack, nodeName) {
    if (value) {
        const parentNode = objectStack[objectStack.length - 1].node;
        return createElementNS(
            parentNode.namespaceURI,
            GEOMETRY_TYPE_TO_NODENAME[
        /** @type {import("../geom/Geometry.js").default} */ (value).getType()
            ]
        );
    }
};

/**
 * A factory for creating Point nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const POINT_NODE_FACTORY = makeSimpleNodeFactory('Point');

/**
 * A factory for creating LineString nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const LINE_STRING_NODE_FACTORY = makeSimpleNodeFactory('LineString');

/**
 * A factory for creating LinearRing nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const LINEAR_RING_NODE_FACTORY = makeSimpleNodeFactory('LinearRing');

/**
 * A factory for creating Polygon nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const POLYGON_NODE_FACTORY = makeSimpleNodeFactory('Polygon');

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const MULTI_GEOMETRY_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'LineString': makeChildAppender(writePrimitiveGeometry),
    'Point': makeChildAppender(writePrimitiveGeometry),
    'Polygon': makeChildAppender(writePolygon),
    'GeometryCollection': makeChildAppender(writeMultiGeometry),
});

/**
 * @param {Element} node Node.
 * @param {import("../geom/Geometry.js").default} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
function writeMultiGeometry(node, geometry, objectStack) {
    /** @type {import("../xml.js").NodeStackItem} */
    const context = { node: node };
    const type = geometry.getType();
    /** @type {Array<import("../geom/Geometry.js").default>} */
    let geometries = [];
    /** @type {function(*, Array<*>, string=): (Node|undefined)} */
    let factory;
    if (type === 'GeometryCollection') {
        /** @type {GeometryCollection} */ (geometry)
            .getGeometriesArrayRecursive()
            .forEach(function (geometry) {
                const type = geometry.getType();
                if (type === 'MultiPoint') {
                    geometries = geometries.concat(
            /** @type {MultiPoint} */(geometry).getPoints()
                    );
                } else if (type === 'MultiLineString') {
                    geometries = geometries.concat(
            /** @type {MultiLineString} */(geometry).getLineStrings()
                    );
                } else if (type === 'MultiPolygon') {
                    geometries = geometries.concat(
            /** @type {MultiPolygon} */(geometry).getPolygons()
                    );
                } else if (
                    type === 'Point' ||
                    type === 'LineString' ||
                    type === 'Polygon'
                ) {
                    geometries.push(geometry);
                } else {
                    throw new Error('Unknown geometry type');
                }
            });
        factory = GEOMETRY_NODE_FACTORY;
    } else if (type === 'MultiPoint') {
        geometries = /** @type {MultiPoint} */ (geometry).getPoints();
        factory = POINT_NODE_FACTORY;
    } else if (type === 'MultiLineString') {
        geometries = /** @type {MultiLineString} */ (geometry).getLineStrings();
        factory = LINE_STRING_NODE_FACTORY;
    } else if (type === 'MultiPolygon') {
        geometries = /** @type {MultiPolygon} */ (geometry).getPolygons();
        factory = POLYGON_NODE_FACTORY;
    } else {
        throw new Error('Unknown geometry type');
    }
    pushSerializeAndPop(
        context,
        MULTI_GEOMETRY_SERIALIZERS,
        factory,
        geometries,
        objectStack
    );
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const BOUNDARY_IS_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'LinearRing': makeChildAppender(writePrimitiveGeometry),
});

/**
 * @param {Element} node Node.
 * @param {import("../geom/LinearRing.js").default} linearRing Linear ring.
 * @param {Array<*>} objectStack Object stack.
 */
function writeBoundaryIs(node, linearRing, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    pushSerializeAndPop(
        context,
        BOUNDARY_IS_SERIALIZERS,
        LINEAR_RING_NODE_FACTORY,
        [linearRing],
        objectStack
    );
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const PLACEMARK_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
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
const PLACEMARK_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
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
const EXTENDEDDATA_NODE_FACTORY = makeSimpleNodeFactory('ExtendedData');

/**
 * FIXME currently we do serialize arbitrary/custom feature properties
 * (ExtendedData).
 * @param {Element} node Node.
 * @param {Feature} feature Feature.
 * @param {Array<*>} objectStack Object stack.
 * @this {KML}
 */
function writePlacemark(node, feature, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };

    // set id
    if (feature.getId()) {
        node.setAttribute('id', /** @type {string} */(feature.getId()));
    }

    // serialize properties (properties unknown to KML are not serialized)
    const properties = feature.getProperties();

    // don't export these to ExtendedData
    const filter = {
        'address': 1,
        'description': 1,
        'name': 1,
        'open': 1,
        'phoneNumber': 1,
        'styleUrl': 1,
        'visibility': 1,
    };
    filter[feature.getGeometryName()] = 1;
    const keys = Object.keys(properties || {})
        //.sort()
        .filter(function (v) {
            return !filter[v];
        });

    const styleFunction = feature.getStyleFunction();
    if (styleFunction) {
        // FIXME the styles returned by the style function are supposed to be
        // resolution-independent here
        const styles = styleFunction(feature, 0);
        if (styles) {
            const styleArray = Array.isArray(styles) ? styles : [styles];
            let pointStyles = styleArray;
            if (feature.getGeometry()) {
                pointStyles = styleArray.filter(function (style) {
                    const geometry = style.getGeometryFunction()(feature);
                    if (geometry) {
                        const type = geometry.getType();
                        if (type === 'GeometryCollection') {
                            return /** @type {GeometryCollection} */ (geometry)
                                .getGeometriesArrayRecursive()
                                .filter(function (geometry) {
                                    const type = geometry.getType();
                                    return type === 'Point' || type === 'MultiPoint';
                                }).length;
                        }
                        return type === 'Point' || type === 'MultiPoint';
                    }
                });
                ('Point');
            }
            if (this.writeStyles_) {
                let lineStyles = styleArray;
                let polyStyles = styleArray;
                if (feature.getGeometry()) {
                    lineStyles = styleArray.filter(function (style) {
                        const geometry = style.getGeometryFunction()(feature);
                        if (geometry) {
                            const type = geometry.getType();
                            if (type === 'GeometryCollection') {
                                return /** @type {GeometryCollection} */ (geometry)
                                    .getGeometriesArrayRecursive()
                                    .filter(function (geometry) {
                                        const type = geometry.getType();
                                        return type === 'LineString' || type === 'MultiLineString';
                                    }).length;
                            }
                            return type === 'LineString' || type === 'MultiLineString';
                        }
                    });
                    polyStyles = styleArray.filter(function (style) {
                        const geometry = style.getGeometryFunction()(feature);
                        if (geometry) {
                            const type = geometry.getType();
                            if (type === 'GeometryCollection') {
                                return /** @type {GeometryCollection} */ (geometry)
                                    .getGeometriesArrayRecursive()
                                    .filter(function (geometry) {
                                        const type = geometry.getType();
                                        return type === 'Polygon' || type === 'MultiPolygon';
                                    }).length;
                            }
                            return type === 'Polygon' || type === 'MultiPolygon';
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
                const textStyle = pointStyles[0].getText();
                if (textStyle) {
                    properties['name'] = textStyle.getText();
                }
            }
        }
    }
    const parentNode = objectStack[objectStack.length - 1].node;
    const orderedKeys = PLACEMARK_SEQUENCE[parentNode.namespaceURI];
    const values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(
        context,
        PLACEMARK_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        values,
        objectStack,
        orderedKeys
    );

    if (keys.length > 0) {
        const sequence = makeSequence(properties, keys);
        const namesAndValues = { names: keys, values: sequence, schemaUrl: featureSchemaUrls.get(feature) };
        pushSerializeAndPop(
            context,
            PLACEMARK_SERIALIZERS,
            EXTENDEDDATA_NODE_FACTORY,
            [namesAndValues],
            objectStack
        );
    }

    // serialize geometry
    const options = /** @type {import("./Feature.js").WriteOptions} */ (
        objectStack[0]
    );
    let geometry = feature.getGeometry();
    if (geometry) {
        geometry = transformGeometryWithOptions(geometry, true, options);
    }
    pushSerializeAndPop(
        context,
        PLACEMARK_SERIALIZERS,
        GEOMETRY_NODE_FACTORY,
        [geometry],
        objectStack
    );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const PRIMITIVE_GEOMETRY_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
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
const PRIMITIVE_GEOMETRY_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'extrude': makeChildAppender(writeBooleanTextNode),
    'tessellate': makeChildAppender(writeBooleanTextNode),
    'altitudeMode': makeChildAppender(writeStringTextNode),
    'coordinates': makeChildAppender(writeCoordinatesTextNode),
});

/**
 * @param {Element} node Node.
 * @param {import("../geom/SimpleGeometry.js").default} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
function writePrimitiveGeometry(node, geometry, objectStack) {
    const flatCoordinates = geometry.getFlatCoordinates();
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    context['layout'] = geometry.getLayout();
    context['stride'] = geometry.getStride();

    // serialize properties (properties unknown to KML are not serialized)
    const properties = geometry.getProperties();
    properties.coordinates = flatCoordinates;

    const parentNode = objectStack[objectStack.length - 1].node;
    const orderedKeys = PRIMITIVE_GEOMETRY_SEQUENCE[parentNode.namespaceURI];
    const values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(
        context,
        PRIMITIVE_GEOMETRY_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        values,
        objectStack,
        orderedKeys
    );
}

/**
 * @const
 * @type {Object<string, Array<string>>}
 */
// @ts-ignore
const POLY_STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
    'color',
    'fill',
    'outline',
]);

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const POLYGON_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'outerBoundaryIs': makeChildAppender(writeBoundaryIs),
    'innerBoundaryIs': makeChildAppender(writeBoundaryIs),
});

/**
 * A factory for creating innerBoundaryIs nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const INNER_BOUNDARY_NODE_FACTORY = makeSimpleNodeFactory('innerBoundaryIs');

/**
 * A factory for creating outerBoundaryIs nodes.
 * @const
 * @type {function(*, Array<*>, string=): (Node|undefined)}
 */
const OUTER_BOUNDARY_NODE_FACTORY = makeSimpleNodeFactory('outerBoundaryIs');

/**
 * @param {Element} node Node.
 * @param {Polygon} polygon Polygon.
 * @param {Array<*>} objectStack Object stack.
 */
function writePolygon(node, polygon, objectStack) {
    const linearRings = polygon.getLinearRings();
    const outerRing = linearRings.shift();
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    // inner rings
    pushSerializeAndPop(
        context,
        POLYGON_SERIALIZERS,
        INNER_BOUNDARY_NODE_FACTORY,
        linearRings,
        objectStack
    );
    // outer ring
    pushSerializeAndPop(
        context,
        POLYGON_SERIALIZERS,
        OUTER_BOUNDARY_NODE_FACTORY,
        [outerRing],
        objectStack
    );
}

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
// @ts-ignore
const POLY_STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
    'color': makeChildAppender(writeColorTextNode),
    'fill': makeChildAppender(writeBooleanTextNode),
    'outline': makeChildAppender(writeBooleanTextNode),
});

/**
 * @param {Element} node Node.
 * @param {Style} style Style.
 * @param {Array<*>} objectStack Object stack.
 */
function writePolyStyle(node, style, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    const fill = style.getFill();
    const stroke = style.getStroke();
    const properties = {
        'color': fill ? fill.getColor() : undefined,
        'fill': fill ? undefined : false,
        'outline': stroke ? undefined : false,
    };
    const parentNode = objectStack[objectStack.length - 1].node;
    const orderedKeys = POLY_STYLE_SEQUENCE[parentNode.namespaceURI];
    const values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(
        context,
        POLY_STYLE_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        values,
        objectStack,
        orderedKeys
    );
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
const STYLE_SEQUENCE = makeStructureNS(NAMESPACE_URIS, [
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
const STYLE_SERIALIZERS = makeStructureNS(NAMESPACE_URIS, {
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
 * @param {Element} node Node.
 * @param {Object<string, Array<Style>>} styles Styles.
 * @param {Array<*>} objectStack Object stack.
 */
function writeStyle(node, styles, objectStack) {
    const /** @type {import("../xml.js").NodeStackItem} */ context = { node: node };
    const properties = {};
    if (styles.pointStyles.length) {
        const textStyle = styles.pointStyles[0].getText();
        if (textStyle) {
            properties['LabelStyle'] = textStyle;
        }
        const imageStyle = styles.pointStyles[0].getImage();
        if (
            imageStyle &&
            typeof (/** @type {?} */ (imageStyle).getSrc) === 'function'
        ) {
            properties['IconStyle'] = imageStyle;
        }
        const balloonStyle = styles.pointStyles[0]._balloon;
        if (balloonStyle) {
            properties['BalloonStyle'] = balloonStyle;
        }
    }
    if (styles.lineStyles.length) {
        const strokeStyle = styles.lineStyles[0].getStroke();
        if (strokeStyle) {
            properties['LineStyle'] = strokeStyle;
        }
    }
    if (styles.polyStyles.length) {
        const strokeStyle = styles.polyStyles[0].getStroke();
        if (strokeStyle && !properties['LineStyle']) {
            properties['LineStyle'] = strokeStyle;
        }
        properties['PolyStyle'] = styles.polyStyles[0];
    }
    const parentNode = objectStack[objectStack.length - 1].node;
    const orderedKeys = STYLE_SEQUENCE[parentNode.namespaceURI];
    const values = makeSequence(properties, orderedKeys);
    pushSerializeAndPop(
        context,
        STYLE_SERIALIZERS,
        OBJECT_PROPERTY_NODE_FACTORY,
        values,
        objectStack,
        orderedKeys
    );
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

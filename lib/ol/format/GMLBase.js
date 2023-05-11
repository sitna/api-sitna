import GMLBase from 'ol/format/GMLBase';
import Feature from 'ol/Feature.js';
import GeometryLayout from 'ol/geom/GeometryLayout.js';
import LineString from 'ol/geom/LineString.js';
import LinearRing from 'ol/geom/LinearRing.js';
import MultiLineString from 'ol/geom/MultiLineString.js';
import MultiPoint from 'ol/geom/MultiPoint.js';
import MultiPolygon from 'ol/geom/MultiPolygon.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';
import XMLFeature from 'ol/format/XMLFeature.js';
import { assign } from 'ol/obj.js';
import { extend } from 'ol/array.js';
import { get as getProjection } from 'ol/proj.js';
import { transformExtentWithOptions, transformGeometryWithOptions, } from 'ol/format/Feature.js'
import { getAllTextContent, getAttributeNS, makeArrayPusher, makeReplacer, parseNode, pushParseAndPop, } from 'ol/xml.js';


// Añadido el espacio de nombres de GML 3.2 al parser
const gmlNamespace = 'http://www.opengis.net/gml';
const gml32Namespace = 'http://www.opengis.net/gml/3.2';
GMLBase.prototype.MULTIPOINT_PARSERS[gml32Namespace] = GMLBase.prototype.MULTIPOINT_PARSERS[gmlNamespace];
GMLBase.prototype.MULTILINESTRING_PARSERS[gml32Namespace] = GMLBase.prototype.MULTILINESTRING_PARSERS[gmlNamespace];
GMLBase.prototype.MULTIPOLYGON_PARSERS[gml32Namespace] = GMLBase.prototype.MULTIPOLYGON_PARSERS[gmlNamespace];
GMLBase.prototype.POINTMEMBER_PARSERS[gml32Namespace] = GMLBase.prototype.POINTMEMBER_PARSERS[gmlNamespace];
GMLBase.prototype.LINESTRINGMEMBER_PARSERS[gml32Namespace] = GMLBase.prototype.LINESTRINGMEMBER_PARSERS[gmlNamespace];
GMLBase.prototype.POLYGONMEMBER_PARSERS[gml32Namespace] = GMLBase.prototype.POLYGONMEMBER_PARSERS[gmlNamespace];
GMLBase.prototype.RING_PARSERS[gml32Namespace] = GMLBase.prototype.RING_PARSERS[gmlNamespace];
/*GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS[gml32Namespace] = GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS[gmlNamespace];
GML3.prototype.FLAT_LINEAR_RINGS_PARSERS[gml32Namespace] = GML3.prototype.FLAT_LINEAR_RINGS_PARSERS[gmlNamespace];
GML3.prototype.GEOMETRY_PARSERS[gml32Namespace] = GML3.prototype.GEOMETRY_PARSERS[gmlNamespace];
GML3.prototype.MULTICURVE_PARSERS[gml32Namespace] = GML3.prototype.MULTICURVE_PARSERS[gmlNamespace];
GML3.prototype.MULTISURFACE_PARSERS[gml32Namespace] = GML3.prototype.MULTISURFACE_PARSERS[gmlNamespace];
GML3.prototype.CURVEMEMBER_PARSERS[gml32Namespace] = GML3.prototype.CURVEMEMBER_PARSERS[gmlNamespace];
GML3.prototype.SURFACEMEMBER_PARSERS[gml32Namespace] = GML3.prototype.SURFACEMEMBER_PARSERS[gmlNamespace];
GML3.prototype.SURFACE_PARSERS[gml32Namespace] = GML3.prototype.SURFACE_PARSERS[gmlNamespace];
GML3.prototype.CURVE_PARSERS[gml32Namespace] = GML3.prototype.CURVE_PARSERS[gmlNamespace];
GML3.prototype.ENVELOPE_PARSERS[gml32Namespace] = GML3.prototype.ENVELOPE_PARSERS[gmlNamespace];
GML3.prototype.PATCHES_PARSERS[gml32Namespace] = GML3.prototype.PATCHES_PARSERS[gmlNamespace];
GML3.prototype.SEGMENTS_PARSERS[gml32Namespace] = GML3.prototype.SEGMENTS_PARSERS[gmlNamespace];*/


// Bug de OpenLayers hasta 5.3.0 como mínimo:
// El parser de GML2 no lee las siguientes features del GML si tienen un featureType distinto del primero.
// Esto pasa porque genera el objeto de featureTypes con la primera y en las siguientes iteraciones si el objeto existe no se regenera.
// Entre comentarios /* */ se elimina lo que sobra.
//
// Más: se añade para FeatureCollection un parser por cada namespaceURI del nodo. 
// Esto es porque QGIS genera GML cuyo nodo FeatureCollection tiene namespace = http://ogr.maptools.org/.

GMLBase.prototype.readFeaturesInternal = function (node, objectStack) {
    const localName = node.localName;
    let features = null;
    if (localName == 'FeatureCollection') {
        // Ñapa para leer GML de https://catastro.navarra.es/ref_catastral/gml.ashx?C=217&PO=5&PA=626
        // y demás GMLs obtenidos de un WFS de GeoServer.
        var gmlnsCollectionParser = this.FEATURE_COLLECTION_PARSERS[ol.format.GMLBase.prototype.namespace] || this.FEATURE_COLLECTION_PARSERS[this.namespace];
        if (!gmlnsCollectionParser.member) {
            gmlnsCollectionParser.member = ol.xml.makeArrayPusher(
                ol.format.GMLBase.prototype.readFeaturesInternal);
        }
        //////
        // Sustituimos la siguienta instrucción por la siguiente condición :
        //features = pushParseAndPop([],
        //    this.FEATURE_COLLECTION_PARSERS, node,
        //    objectStack, this);
        if (node.namespaceURI === 'http://www.opengis.net/wfs') {
            features = ol.xml.pushParseAndPop([],
                this.FEATURE_COLLECTION_PARSERS, node,
                objectStack, this);
        } else {
            this.FEATURE_COLLECTION_PARSERS[node.namespaceURI] =
                this.FEATURE_COLLECTION_PARSERS[node.namespaceURI] || this.FEATURE_COLLECTION_PARSERS[ol.format.GMLBase.prototype.namespace] || this.FEATURE_COLLECTION_PARSERS[this.namespace];
            features = ol.xml.pushParseAndPop(/*null*/[], // Cambiado null por [] porque si no, no crea el array de features
                this.FEATURE_COLLECTION_PARSERS, node,
                objectStack, this);
        }
        //////
    } else if (localName == 'featureMembers' || localName == 'featureMember' || localName == 'member') {
        const context = objectStack[0];
        let featureType = context.featureType;
        let featureNS = context.featureNS;
        const prefix = 'p';
        const defaultPrefix = 'p0';
        if (/*!featureType && */node.childNodes) {
            featureType = [], featureNS = {};
            for (let i = 0, ii = node.childNodes.length; i < ii; ++i) {
                const child = node.childNodes[i];
                if (child.nodeType === 1) {
                    const ln = child.nodeName.split(':').pop();
                    if (ln == 'FeatureCollection') {
                        return pushParseAndPop([], this.FEATURE_COLLECTION_PARSERS, child, objectStack, this);
                        /*if (featureGroup && featureGroup.length) {
                            features = (features || []).concat(featureGroup)
                        }                            
                        return features;*/
                    }
                    else if (featureType.indexOf(ln) === -1) {
                        let key = '';
                        let count = 0;
                        const uri = child.namespaceURI;
                        for (let candidate in featureNS) {
                            if (featureNS[candidate] === uri) {
                                key = candidate;
                                break;
                            }
                            ++count;
                        }
                        if (!key) {
                            key = prefix + count;
                            featureNS[key] = uri;
                        }
                        featureType.push(key + ':' + ln);
                    }
                }
            }
            if (localName != 'featureMember') {
                // recheck featureType for each featureMember
                context.featureType = featureType;
                context.featureNS = featureNS;
            }
        }
        if (typeof featureNS === 'string') {
            const ns = featureNS;
            featureNS = {};
            featureNS[defaultPrefix] = ns;
        }
        /** @type {Object<string, Object<string, import("../xml.js").Parser>>} */
        const parsersNS = {};
        const featureTypes = Array.isArray(featureType) ? featureType : [featureType];
        for (let p in featureNS) {
            /** @type {Object<string, import("../xml.js").Parser>} */
            const parsers = {};
            for (let i = 0, ii = featureTypes.length; i < ii; ++i) {
                const featurePrefix = featureTypes[i].indexOf(':') === -1 ?
                    defaultPrefix : featureTypes[i].split(':')[0];
                if (featurePrefix === p) {
                    parsers[featureTypes[i].split(':').pop()] =
                        (localName == 'featureMembers') ?
                            ol.xml.makeArrayPusher(this.readFeatureElement, this) :
                            ol.xml.makeReplacer(this.readFeatureElement, this);
                }
            }
            parsersNS[featureNS[p]] = parsers;
        }
        if (localName == 'featureMember') {
            features = ol.xml.pushParseAndPop(undefined, parsersNS, node, objectStack);
        } else {
            features = ol.xml.pushParseAndPop([], parsersNS, node, objectStack);
        }
    }
    if (features === null) {
        features = [];
    }
    return features;
};


// Reescritura de código para transformar las geometrías de getFeatureInfo que están en un CRS distinto
GMLBase.prototype.readGeometryElement = function (node, objectStack) {
    var context = /** @type {Object} */ (objectStack[0]);
    context.srsName = node.firstElementChild.getAttribute('srsName');
    context.srsDimension = node.firstElementChild.getAttribute('srsDimension');
    /** @type {ol.geom.Geometry} */

    // Parche para poder leer coordenadas en EPSG:4326 con orden incorrecto (las crea QGIS, por ejemplo)
    if (this instanceof ol.format.GML2CRS84 || this instanceof ol.format.GML3CRS84) {
        if (context.srsName !== 'EPSG:4326' || !context.srsName) {
            throw new Error("Conflicto de CRS");
        }
    }
    if (!context.srsName) {
        context.srsName = this.srsName;
    }
    context.dataProjection = ol.proj.get(context.srsName);
    const geometry = ol.xml.pushParseAndPop(null,
        this.GEOMETRY_PARSERS, node, objectStack, this);
    if (geometry) {
        if (Array.isArray(geometry)) {
            return transformExtentWithOptions(
            /** @type {import("../extent.js").Extent} */(geometry), context);
        }
        else {
            return transformGeometryWithOptions(
            /** @type {import("../geom/Geometry.js").default} */(geometry), false, context);
        }
    }
    else {
        return undefined;
    }
};


const ONLY_WHITESPACE_RE = /^[\s\xa0]*$/;

// Reescritura de código para hacerlo compatible con GML generado por inspire:
// No se puede considerar geometría cualquier cosa que tenga elementos anidados.
GMLBase.prototype.readFeatureElementInternal = function (node, objectStack, asFeature) {
    let geometryName;
    const values = {};
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
        let value;
        const localName = n.localName;
        // first, check if it is simple attribute
        if (n.childNodes.length === 0
            || (n.childNodes.length === 1 && (n.firstChild.nodeType === 3 || n.firstChild.nodeType === 4))) {
            value = ol.xml.getAllTextContent(n, false);
            if (ONLY_WHITESPACE_RE.test(value)) {
                value = undefined;
            }
        } else {
            if (asFeature) {
                //if feature, try it as a geometry
                value = this.readGeometryElement(n, objectStack);
            }
            if (!value) { //if not a geometry or not a feature, treat it as a complex attribute
                value = this.readFeatureElementInternal(n, objectStack, false);
            } else if (localName !== 'boundedBy' && localName !== 'referencePoint') {
                // boundedBy is an extent and must not be considered as a geometry
                // flacunza: Tampoco referencePoint
                geometryName = localName;
            }
        }

        if (values[localName]) {
            if (!(values[localName] instanceof Array)) {
                values[localName] = [values[localName]];
            }
            values[localName].push(value);
        } else {
            values[localName] = value;
        }

        const len = n.attributes.length;
        if (len > 0) {
            values[localName] = { _content_: values[localName] };
            for (let i = 0; i < len; i++) {
                const attName = n.attributes[i].name;
                values[localName][attName] = n.attributes[i].value;
            }
        }
    }
    if (!asFeature) {
        return values;
    } else {
        const feature = new ol.Feature(values);
        if (geometryName) {
            feature.setGeometryName(geometryName);
        }
        const fid = node.getAttribute('fid') ||
            node.getAttributeNS(this.namespace, 'id');
        if (fid) {
            feature.setId(fid);
        }
        return feature;
    }
};

export default GMLBase;
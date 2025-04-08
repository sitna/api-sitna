import GMLBase from 'ol/format/GMLBase';
import { Geometry } from 'ol/geom';
import { transformExtentWithOptions, transformGeometryWithOptions } from 'ol/format/Feature.js'
import { pushParseAndPop, parse, isDocument } from 'ol/xml.js';
import Consts from '../../../TC/Consts';
import FeatureTypeParser from '../../../TC/tool/FeatureTypeParser';

const ATTRIBUTE_NAME_MARK = '@';
const TEXT_NODE_NAME = '#text';

const getNameComponents = function (name) {
    let [prefix, localName] = name.split(':');
    if (!localName) {
        [prefix, localName] = [localName, prefix]
    }
    return [prefix, localName];
};

const getPropertyComponents = function (name) {
    let [element, attribute] = name.split(ATTRIBUTE_NAME_MARK);
    const [elmPrefix, elmLocalName] = getNameComponents(element);
    // Esto es para tener en cuenta el caso pr:elm. Queremos en este caso [pr, elm]
    if (!attribute) {
        return [elmPrefix, elmLocalName];
    }
    const [attrPrefix, attrLocalName] = getNameComponents(attribute);
    // Esto es para tener en cuenta el caso @pr:attr. Queremos en este caso [pr, @attr]
    if (element.length === 0) {
        return [attrPrefix, ATTRIBUTE_NAME_MARK + attrLocalName];
    }
    // Esto es para tener en cuenta los casos pr:elm@pr:attr o pr:elm@attr. Queremos en este caso [pr, elm@attr]
    if (elmPrefix === attrPrefix || !attrPrefix) {
        return [elmPrefix, elmLocalName + ATTRIBUTE_NAME_MARK + attrLocalName];
    }
    // Esto es para tener en cuenta el caso pr1:elm@pr2:attr. Queremos en este caso [pr1, elm@pr2:attr]
    return [elmPrefix, elmLocalName + ATTRIBUTE_NAME_MARK + attrPrefix + ':' + attrLocalName];
};

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
        [...node.attributes].forEach((attr) => {
            if (attr.name.startsWith('xmlns:')) {
                this.featureTypeMetadata ??= {
                    origin: Consts.format.GML,
                    originalMetadata: {
                        namespaces: [],
                        featureTypes: {}
                    }
                };
                this.featureTypeMetadata.originalMetadata.namespaces.push({
                    prefix: attr.name.substring(attr.name.indexOf(':') + 1),
                    value: attr.value
                });
            }
        });
        node.getAttribute('xsi:schemaLocation')
            ?.replace(/\s+/g, ' ')
            .split(' ')
            .forEach((schema, idx, arr) => {
                if (idx % 2 === 0) {
                    const namespace = this.featureTypeMetadata?.originalMetadata.namespaces.find((ns) => ns.value === schema);
                    if (namespace) {
                        namespace.schemaLocation = arr[idx + 1];
                    }
                }
            });
        // Ñapa para leer GML de https://catastro.navarra.es/ref_catastral/gml.ashx?C=217&PO=5&PA=626
        // y demás GMLs obtenidos de un WFS de GeoServer.
        var gmlnsCollectionParser = this.FEATURE_COLLECTION_PARSERS[GMLBase.prototype.namespace] || this.FEATURE_COLLECTION_PARSERS[this.namespace];
        if (!gmlnsCollectionParser.member) {
            gmlnsCollectionParser.member = ol.xml.makeArrayPusher(
                GMLBase.prototype.readFeaturesInternal);
        }
        //////
        // Sustituimos la siguiente instrucción para ampliar los espacios de nombres compatibles:
        //features = pushParseAndPop([],
        //    this.FEATURE_COLLECTION_PARSERS, node,
        //    objectStack, this);
        const defaultNamespaceUri = Object.keys(this.FEATURE_COLLECTION_PARSERS)[0];
        this.FEATURE_COLLECTION_PARSERS[node.namespaceURI] = this.FEATURE_COLLECTION_PARSERS[defaultNamespaceUri];
        this.FEATURE_COLLECTION_PARSERS['http://www.opengis.net/gml'] = this.FEATURE_COLLECTION_PARSERS[defaultNamespaceUri];
        features = pushParseAndPop(/*null*/[], // Cambiado null por [] porque si no, no crea el array de features
            this.FEATURE_COLLECTION_PARSERS, node,
            objectStack, this);
        if (this.featureTypeMetadata) {
            features.forEach((feat) => this.featureMetadata.set(feat, this.featureTypeMetadata));
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
                    /////
                    const [pf, ln] = getNameComponents(child.nodeName);
                    /////
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
                            key = pf ?? prefix + count;
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
            features = pushParseAndPop(undefined, parsersNS, node, objectStack);
        } else {
            features = pushParseAndPop([], parsersNS, node, objectStack);
        }
        /////
        const metadata = this.featureTypeMetadata?.originalMetadata;
        if (metadata) {
            featureTypes.forEach((ft) => {
                if (!Object.prototype.hasOwnProperty.call(metadata.featureTypes, ft)) {
                    metadata.featureTypes[ft] = {};
                }
            });
        }
        /////
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
    let geometry = pushParseAndPop(null,
        this.GEOMETRY_PARSERS, node, objectStack, this);
    if (geometry) {
        if (Array.isArray(geometry)) {
            return transformExtentWithOptions(
            /** @type {import("../extent.js").Extent} */(geometry), context);
        }
        else {
            // GML siempre crea puntos x, y, z al leer. Esto lo deshace.
            if (geometry.getStride() > 2) {
                if (geometry.getFlatCoordinates().every((num, idx) => (idx + 1) % 3 !== 0 || num === 0)) {
                    geometry = new geometry.constructor(geometry.getCoordinates(), 'XY');
                }
            }
            return transformGeometryWithOptions(
            /** @type {import("../geom/Geometry.js").default} */(geometry), false, context);
        }
    }
    else {
        return undefined;
    }
};


const ONLY_WHITESPACE_RE = /^[\s\xa0]*$/;

const assignPropertyValue = (values, keyName, value) => {
    if (Object.prototype.hasOwnProperty.call(values, keyName)) {
        const v = values[keyName];
        if (v === undefined) {
            values[keyName] = [];
        }
        else if (!(v instanceof Array)) {
            values[keyName] = [v];
        }
        if (value !== undefined) {
            values[keyName].push(value);
        }
    }
    else {
        values[keyName] = value;
    }
};

// Reescritura de código para hacerlo compatible con GML generado por inspire:
// No se puede considerar geometría cualquier cosa que tenga elementos anidados.
GMLBase.prototype.readFeatureElementInternal = function (node, objectStack, asFeature) {
    let geometryName;
    let values = {};

    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
        let value;
        let isGeometry = false;
        const localName = n.localName;
        const tagName = n.tagName;
        // first, check if it is simple attribute
        if (n.childNodes.length === 0
            || (n.childNodes.length === 1 && (n.firstChild.nodeType === 3 || n.firstChild.nodeType === 4))) {
            value = ol.xml.getAllTextContent(n, false);
            if (ONLY_WHITESPACE_RE.test(value)) {
                value = undefined;
            }
        } else {
            value = this.readGeometryElement(n, objectStack);
            if (!value) { //if not a geometry or not a feature, treat it as a complex attribute
                value = this.readFeatureElementInternal(n, objectStack, false);
            } else if (localName !== 'boundedBy' && localName !== 'referencePoint') {
                // boundedBy is an extent and must not be considered as a geometry
                // flacunza: Tampoco referencePoint

                // Para el nombre de la geometría no ponemos prefijo porque OpenLayers no lo procesa bien
                geometryName = tagName.substring(tagName.indexOf(':') + 1);
                isGeometry = true;
            }
        }

        const keyName = isGeometry ? geometryName : tagName;

        const nullValueAttribute = 'xsi:nil';
        if (n.getAttribute(nullValueAttribute) === 'true') {
            // Es un nil, equivalente a null en JavaScript
            value = null;
        }

        const len = n.attributes.length;
        if (len > 0 && !(len === 1 && n.hasAttribute(nullValueAttribute))) {
            if (!value || typeof value !== 'object') {
                value = { [TEXT_NODE_NAME]: value };
            }
            for (let i = 0; i < len; i++) {
                const attName = n.attributes[i].name;
                if (attName !== nullValueAttribute) {
                    value[ATTRIBUTE_NAME_MARK + attName] = n.attributes[i].value;
                    //assignPropertyValue(values, keyName + ATTRIBUTE_NAME_MARK + attName, n.attributes[i].value);
                }
            }
        }
        assignPropertyValue(values, keyName, value);
    }

    // Traducción de XML a objeto:
    // <elemento atributo="valorAtributo">valorElemento</elemento>
    // objeto.elemento === "valorElemento"
    // objeto.elemento@atributo === "valorAtributo"
    const newValues = {};
    for (const key in values) {
        const value = values[key];
        if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, TEXT_NODE_NAME)) {
            newValues[key] = value[TEXT_NODE_NAME];
            for (const k in value) {
                if (k !== TEXT_NODE_NAME) newValues[key + k] = value[k];
            }
        }
        else {
            newValues[key] = value;
        }
    }
    values = newValues;

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

GMLBase.prototype.readFeatures = async function (source, options) {
    ////
    delete this.featureTypeMetadata;
    ////

    if (!source) {
        return [];
    }
    let result;
    let node;
    if (typeof source === 'string') {
        node = parse(source);
        result = this.readFeaturesFromDocument(node, options);
    }
    else {
        node = source;
        if (isDocument(source)) {
            result = this.readFeaturesFromDocument(
        /** @type {Document} */(source),
                options
            );
        }
        else {
            result = this.readFeaturesFromNode(/** @type {Element} */(source), options);
        }
    }

    /////////
    if (result.length) {
        if (this.featureTypeMetadata) {
            const originalMetadata = this.featureTypeMetadata.originalMetadata;
            const featureTypeParser = new FeatureTypeParser();
            for (let featureTypeName in originalMetadata.featureTypes) {
                //if (!Object.keys(originalMetadata.featureTypes[featureTypeName]).length) {
                //    continue; // No se ha podido encontrar el esquema
                //}
                if (featureTypeName.endsWith(':feature')) {
                    continue; // Feature genérica, sin esquema
                }
                const featureType = originalMetadata.featureTypes[featureTypeName];
                const schema = await featureTypeParser.parseSchemas(node, featureTypeName);
                Object.assign(featureType, Object.values(schema)[0]);
            }

            const [nsPrefix] = getNameComponents(Object.keys(originalMetadata.featureTypes)[0]);

            // Cambiamos strings por number o boolean según toque
            const transformValuesByType = (feature, properties, featureType) => {
                const setValue = (f, p, n, v) => {
                    if (f) {
                        f.set(n, v, true);
                    }
                    else {
                        p[n] = v;
                    }
                };

                for (let name in properties) {
                    let attr = featureType[name];
                    if (!attr) {
                        const [prefix, localName] = getPropertyComponents(name);
                        if (prefix === nsPrefix) {
                            attr = featureType[localName];
                        }
                    }
                    if (attr) {
                        const type = attr.type[TEXT_NODE_NAME]?.type ?? attr.type;
                        if (typeof type === 'string') {
                            switch (this.getType(type)) {
                                case Consts.dataType.FLOAT:
                                case Consts.dataType.INTEGER: {
                                    let value = parseFloat(properties[name]);
                                    if (Number.isNaN(value)) value = undefined;
                                    setValue(feature, properties, name, value);
                                    break;
                                }
                                case Consts.dataType.BOOLEAN:
                                    setValue(feature, properties, name, properties[name] === 'true');
                                    break;
                            }
                        }
                        else {
                            transformValuesByType(null, properties[name], type);
                        }
                    }
                }
            };

            const featureType = Object.values(originalMetadata.featureTypes)[0];

            // Quitamos prefijos a propiedades
            const removePrefixes = function (feature, properties) {
                if (properties instanceof Geometry) return;
                for (let name in properties) {
                    const value = properties[name];
                    const [prefix, localName] = getPropertyComponents(name);
                    if (prefix) {
                        if (feature) {
                            const geometryName = feature.getGeometryName();
                            if (name === geometryName) {
                                feature.setGeometryName(localName);
                                feature.unset(name, true);
                                feature.set(localName, value, true);
                            }
                            else if (prefix === nsPrefix) {
                                feature.unset(name, true);
                                feature.set(localName, value, true);
                            }
                        }
                        else {
                            if (prefix === nsPrefix) {
                                properties[localName] = value;
                                delete properties[name];
                            }
                        }
                    }
                    if (value && typeof value === 'object') {
                        if (!prefix || prefix === nsPrefix) {
                            removePrefixes(null, value);
                        }
                    }
                }
            };

            // Quitamos las propiedades correspondientes a nodos de texto si no están definidas en el esquema
            const removeTextNodeProperties = function (feature, properties, featureType) {
                if (!properties || typeof properties !== 'object') return;

                const keys = Object.keys(properties);
                for (let name of keys) {
                    let attr = featureType[name];
                    if (!attr) {
                        const [prefix, localName] = getPropertyComponents(name);
                        if (prefix === nsPrefix) {
                            attr = featureType[localName];
                        }
                    }
                    if (attr) {
                        const type = attr.type;
                        if (type && typeof type === 'object') {
                            if (!Object.prototype.hasOwnProperty.call(type, TEXT_NODE_NAME)) {
                                // Miramos si es una propiedad múltiple (array)
                                const maxOccurs = attr['@maxOccurs'];
                                if (parseInt(maxOccurs) > 1 || maxOccurs === 'unbounded') {
                                    if (Array.isArray(properties[name])) {
                                        // Eliminamos el nodo #text de cada elemento
                                        for (const nestedProperty of properties[name]) {
                                            if (!nestedProperty[TEXT_NODE_NAME]) {
                                                delete nestedProperty[TEXT_NODE_NAME];
                                            }

                                        }
                                        break;
                                    }
                                }
                                if (!Object.prototype.hasOwnProperty.call(properties, name)) {
                                    if (feature) {
                                        feature.unset(name, true);
                                    }
                                }
                                else {
                                    removeTextNodeProperties(null, properties[name], type);
                                }
                            }
                            else {
                                removeTextNodeProperties(null, properties[name], type);
                            }
                        }
                    }
                }
            };

            for (const f of result) {
                let properties = f.getProperties();
                transformValuesByType(f, properties, featureType);
                removePrefixes(f, properties);
                removeTextNodeProperties(f, properties, featureType);
            }
        }

        // Reubicamos la geometría si está en un lugar no estándar
        const moveGeometry = (feature, attributes) => {
            for (const key in attributes) {
                const attribute = attributes[key];
                if (attribute instanceof Geometry) {
                    feature.setGeometry(attribute);
                    delete attributes[key];
                    return true;
                }
                if (attribute && typeof attribute === 'object' && Object.keys(attribute).length) {
                    if (moveGeometry(feature, attribute)) {
                        return true;
                    }
                }
            }
            return false;
        };
        result.forEach((f) => {
            if (!f.getGeometry()) {
                moveGeometry(f, f.getProperties());
            }
        });
    }
    /////////
    return result;
};
GMLBase.prototype.getGeometryType = function (typeName) {
    switch (typeName) {
        case 'gml:LinearRingPropertyType':
        case 'gml:PolygonPropertyType':
        case 'LinearRingPropertyType':
        case 'PolygonPropertyType':
        case 'gml:Polygon':
        case 'Polygon':
            return Consts.geom.POLYGON;
        case 'gml:MultiPolygonPropertyType':
        case 'gml:MultiSurfacePropertyType':
        case 'MultiPolygonPropertyType':
        case 'MultiSurfacePropertyType':
        case 'gml:MultiPolygon':
        case 'MultiPolygon':
            return Consts.geom.MULTIPOLYGON;
        case 'gml:LineStringPropertyType':
        case 'gml:CurvePropertyType':
        case 'LineStringPropertyType':
        case 'CurvePropertyType':
        case 'gml:LineString':
        case 'LineString':
            return Consts.geom.POLYLINE;
        case 'gml:MultiLineStringPropertyType':
        case 'gml:MultiCurvePropertyType':
        case 'MultiLineStringPropertyType':
        case 'MultiCurvePropertyType':
        case 'gml:MultiLineString':
        case 'MultiLineString':
            return Consts.geom.MULTIPOLYLINE;
        case 'gml:PointPropertyType':
        case 'PointPropertyType':
        case 'gml:Point':
        case 'Point':
            return Consts.geom.POINT;
        case 'gml:MultiPointPropertyType':
        case 'MultiPointPropertyType':
        case 'gml:MultiPoint':
        case 'MultiPoint':
            return Consts.geom.MULTIPOINT;
        case 'gml:BoxPropertyType':
        case 'BoxPropertyType':
            return Consts.geom.RECTANGLE;
        case 'gml:GeometryCollectionPropertyType':
        case 'gml:GeometryAssociationType':
        case 'gml:GeometryPropertyType':
        case 'gml:AbstractGeometryType':
        case 'GeometryCollectionPropertyType':
        case 'GeometryAssociationType':
        case 'GeometryPropertyType':
            return Consts.geom.GEOMETRY;
        default:
            return false;
    }
};

GMLBase.getGeometryType = function (typeName) {
    return GMLBase.prototype.getGeometryType(typeName);
};

export default GMLBase;
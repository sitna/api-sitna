import GMLBase from 'ol/format/GMLBase';
import { Geometry } from 'ol/geom';
import { transformExtentWithOptions, transformGeometryWithOptions } from 'ol/format/Feature.js'
import { pushParseAndPop, parse } from 'ol/xml.js';
import Consts from '../../../TC/Consts';
import Util from '../../../TC/Util';
import FeatureTypeParser from '../../../TC/tool/FeatureTypeParser';

const getNameComponents = function (name) {
    let [prefix, localName] = name.split(':');
    if (!localName) {
        [prefix, localName] = [localName, prefix]
    }
    return [prefix, localName];
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
        features = ol.xml.pushParseAndPop(/*null*/[], // Cambiado null por [] porque si no, no crea el array de features
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
            features = ol.xml.pushParseAndPop(undefined, parsersNS, node, objectStack);
        } else {
            features = ol.xml.pushParseAndPop([], parsersNS, node, objectStack);
        }
        /////
        const metadata = this.featureTypeMetadata?.originalMetadata;
        if (metadata) {
            featureTypes.forEach((ft) => {
                if (!Object.prototype.hasOwnProperty(metadata.featureTypes, ft)) {
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
    let geometry = ol.xml.pushParseAndPop(null,
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
const ATTRIBUTE_NAME_MARK = '@';
const TEXT_NODE_NAME = '#text';

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
    const values = {};

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

        if (n.getAttribute('xsi:nil') === 'true') {
            // Es un nil, equivalente a null en JavaScript
            value = null;
        }

        assignPropertyValue(values, keyName, value);

        // Traducción de XML a objeto:
        // <elemento atributo="valorAtributo">valorElemento</elemento>
        // objeto.elemento === "valorElemento"
        // objeto.elemento@atributo === "valorAtributo"
            const len = n.attributes.length;
        if (len > 0) {
            for (let i = 0; i < len; i++) {
                const attName = n.attributes[i].name;
                if (attName !== 'xsi:nil') {
                    assignPropertyValue(values, keyName + ATTRIBUTE_NAME_MARK + attName, n.attributes[i].value);
                }
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

const getType = (wfsType) => {
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
                if (featureTypeName.endsWith(':feature')) {
                    continue; // Feature genérica, sin esquema
                }
                const featureType = originalMetadata.featureTypes[featureTypeName];
                const schema = await featureTypeParser.parseSchemas(node, featureTypeName);
                Object.assign(featureType, Object.values(schema)[0]);
            }

            const [ns] = getNameComponents(Object.keys(originalMetadata.featureTypes)[0]);

            const transformValuesByType = function (feature, properties, featureType) {
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
                        const [prefix, localName] = getNameComponents(name);
                        if (prefix === ns) {
                            attr = featureType[localName];
                        }
                    }
                    if (attr) {
                        const type = attr.type[TEXT_NODE_NAME]?.type ?? attr.type;
                        if (typeof type === 'string') {
                            switch (getType(type)) {
                                case Consts.dataType.FLOAT:
                                case Consts.dataType.INTEGER:
                                    setValue(feature, properties, name, parseFloat(properties[name]))
                                    break;
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

            for (const f of result) {
                let properties = f.getProperties();
                const geometryName = f.getGeometryName();


                // Cambiamos strings por number o boolean según toque
                transformValuesByType(f, properties, featureType);
                properties = f.getProperties();

                // Quitamos prefijos a propiedades
                for (let name in properties) {
                    const value = properties[name];
                    const [prefix, localName] = getNameComponents(name);
                    if (localName) {
                        if (name === geometryName) {
                            f.setGeometryName(localName);
                            f.unset(name, true);
                            f.set(localName, value, true);
                        }
                        else if (prefix === ns) {
                            f.unset(name, true);
                            f.set(localName, value, true);
                        }
                    }
                }
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

GMLBase.prototype.getFeatureTypeMetadata = function (metadata, features) {
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
        if (typeof attributeTypeObject.type === 'object') {
            const typeObj = attributeTypeObject.type;
            result.value = [];
            result.type = 'object';
            for (let n in typeObj) {
                const t = getAttributeType(metadata, typeObj[n], ...names, n);
                if (t) {
                    result.value.push(t);
                }
            }
            return result;
        }
        result.type = getType(attributeTypeObject.type);
        if (result.type === 'ID') {
            result.isId = true;
            result.type = Consts.dataType.STRING;
        }
        else if (result.type === 'object') {
            const geometryType = Util.getGeometryType(attributeTypeObject.type);
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
            for (let name in schema) {
                const attribute = schema[name];
                const newAttr = getAttributeType(newMetadata, attribute, name);
                if (name === geometryName || typeof newAttr === 'string' || newAttr === null) {
                    // El tipo de atributo es una geometría
                    newMetadata.geometries ??= [];
                    newMetadata.geometries.push({
                        name,
                        type: Util.getGeometryType(attribute.type),
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
    const addAttributeProperties = (attributeList) => {
        for (let i = attributeList.length - 1; i >= 0; i--) {
            const attr = attributeList[i];
            if (Array.isArray(attr.value)) {
                const xmlAttributes = attr.value.filter((val) => val.name.startsWith(ATTRIBUTE_NAME_MARK));
                const xmlElements = attr.value.filter((val) => !val.name.startsWith(ATTRIBUTE_NAME_MARK) && val.name !== TEXT_NODE_NAME);
                if (xmlAttributes.length && !xmlElements.length) {
                    attributeList.splice(i + 1, 0, ...xmlAttributes.map((elm) => ({
                        name: attr.name + elm.name,
                        type: elm.type,
                        optional: elm.optional,
                    })));
                    const textNode = attr.value.find((val) => val.name === TEXT_NODE_NAME);
                    if (textNode) {
                        // Si el elemento tiene un nodo de texto asignamos su tipo al elemento
                        attr.type = textNode.type;
                        delete attr.value;
                    }
                    else {
                        // Si el elemento no tiene un nodo de texto lo eliminamos y dejamos solamente los 
                        // nodos de sus atributos
                        attributeList.splice(i, 1);
                    }
                }
                else {
                    addAttributeProperties(attr.value);
                }
            }
        }
    }
    addAttributeProperties(newMetadata.attributes);

    newMetadata.equals = (n1, n2) => {
        const splitPrefix = (name) => {
            let [localName, prefix] = name.split(':').reverse();
            if (!prefix) prefix = 'gml';
            return [prefix, localName];
        };
        const getParts = (n) => n.split(ATTRIBUTE_NAME_MARK).map((part) => splitPrefix(part)).flat();
        const arr1 = getParts(n1);
        const arr2 = getParts(n2);
        return arr1.every((elm, idx) => elm === arr2[idx]) && arr2.every((elm, idx) => elm === arr1[idx]);
    };

    return newMetadata;
};

export default GMLBase;
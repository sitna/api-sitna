import Util from '../../../TC/Util';
import GML3 from 'ol/format/GML3';
import {
    createElementNS,
    makeChildAppender,
    makeSimpleNodeFactory,
    pushSerializeAndPop
} from 'ol/xml';
import { writeStringTextNode } from 'ol/format/xsd';
import {
    transformExtentWithOptions
} from 'ol/format/Feature';
import { Geometry } from 'ol/geom';
import Consts from '../../../TC/Consts.js';

const TEXT_NODE = '#text';
const getNameComponents = function (name) {
    let [prefix, localName] = name.split(':');
    if (!localName) {
        [prefix, localName] = [localName, prefix]
    }
    return [prefix, localName];
};

GML3.prototype.writeFeaturesNode = function (features, options) {
    options = this.adaptOptions(options);
    const node = createElementNS(this.featureNS, 'featureMembers');
    if (options.parentNode) {
        options.parentNode.appendChild(node);
    }
    //node.setAttributeNS(
    //    XML_SCHEMA_INSTANCE_URI,
    //    'xsi:schemaLocation',
    //    this.schemaLocation
    //);
    //////////
    let ns = this.featureNS;
    if (this.featureTypeMetadata?.origin === Consts.format.GML) {
        this.featureType = Object.keys(this.featureTypeMetadata.originalMetadata.featureTypes)[0];
        const prefix = this.featureType.substring(0, this.featureType.indexOf(':'));
        ns = this.featureTypeMetadata.originalMetadata.namespaces.find((namespace) => namespace.prefix === prefix)?.value ?? this.featureNS;
    }
    //////////
    const context = {
        srsName: this.srsName,
        hasZ: this.hasZ,
        curve: this.curve_,
        surface: this.surface_,
        multiSurface: this.multiSurface_,
        multiCurve: this.multiCurve_,
        featureNS: ns,
        featureType: this.featureType,
    };
    if (options) {
        Object.assign(context, options);
    }
    ///////////
    const processedFeatures = features
        .map((feat) => {
            var temp = feat.clone();
            temp.id_ = feat.id_;
            return temp;
        })
        .map((feat) => {
            // Quitamos los espacios en blanco de los nombres de atributo en las features: no son válidos en GML.
            let values = feat.getProperties();
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
                feat.set(newKey, values[key]);
                feat.unset(key);
            });
            return feat;
        });
    ///////////
    this.writeFeatureMembers_(node, processedFeatures, [context]);
    return node;
};

GML3.prototype.writeFeatureMembers_ = function (node, features, objectStack) {
    const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    const featureType = context['featureType'];
    const featureNS = context['featureNS'];
    /** @type {Object<string, Object<string, import("../xml.js").Serializer>>} */
    const serializers = {};
    serializers[featureNS] = {};
    serializers[featureNS][featureType] = makeChildAppender(
        this.writeFeatureElement,
        this
    );
    ///////
    if (featureType.indexOf(':') > 0) {
        serializers[featureNS][featureType.substring(featureType.indexOf(':') + 1)] =
            serializers[featureNS][featureType];
    }
    ///////
    const item = Object.assign({}, context);
    item.node = node;
    pushSerializeAndPop(
        /** @type {import("../xml.js").NodeStackItem} */
        (item),
        serializers,
        makeSimpleNodeFactory(featureType, featureNS),
        features,
        objectStack
    );
};

GML3.prototype.writeFeatures = function (features, options) {
    const featureTypeMetadata = options?.featureTypeMetadata;
    this.hasZ = features.some((f) => f.getGeometry()?.getLayout?.().length > 2);

    let processedFeatures = features;
    if (featureTypeMetadata?.origin === Consts.format.GML) {
        const getGeometryPath = (attributes) => {
            for (let key in attributes) {
                const attr = attributes[key];
                if (typeof attr.type === 'string') {
                    if (Util.getGeometryType(attr.type)) {
                        return [key];
                    }
                }
                if (typeof attr.type === 'object') {
                    const result = getGeometryPath(attr.type);
                    if (result === true) {
                        // Marca que indica que el atributo actual es el de geometría
                        return [key];
                    }
                    if (result) {
                        return [key, ...result];
                    }
                }
            }
        };
        const [featureTypeName, featureType] = Object.entries(featureTypeMetadata.originalMetadata.featureTypes)[0];
        const [prefix] = getNameComponents(featureTypeName);
        const geometryPath = getGeometryPath(featureType) ?? [];
        if (geometryPath.length > 1) {
            const getValueFromKeyAndOrPrefix = (obj, key, prefix) => {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    return obj[key];
                }
                if (key.indexOf(':') < 0) {
                    const prefixedName = prefix + ':' + key;
                    if (Object.prototype.hasOwnProperty.call(obj, prefixedName)) {
                        return obj[prefixedName];
                    }
                }
            };
            processedFeatures = features.map((f) => {
                const newFeature = f.clone();
                const properties = f.getProperties();
                newFeature.setId(f.getId());
                let buffer = properties;
                for (let i = 0, ii = geometryPath.length - 1; i < ii; i++) {
                    buffer = getValueFromKeyAndOrPrefix(buffer, geometryPath[i], prefix);
                }
                buffer[geometryPath[geometryPath.length - 1]] = f.getGeometry();
                newFeature.unset(newFeature.getGeometryName(), true);
                return newFeature;
            });
        }
    }

    const featuresNode = this.writeFeaturesNode(processedFeatures, options);
    //featuresNode.removeAttribute('xmlns:xsi');
    //featuresNode.removeAttribute('xsi:schemaLocation');

    //featuresNode
    //    .querySelectorAll("feature geometry > * *[srsName]")
    //    .forEach((item) => item.removeAttribute("srsName"));

    const node = createElementNS('http://www.opengis.net/wfs', 'FeatureCollection');
    if (featureTypeMetadata?.origin === Consts.format.GML) {
        node.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation', featureTypeMetadata
            .originalMetadata
            .namespaces
            .filter((ns) => ns.schemaLocation)
            .map((ns) => `${ns.value} ${ns.schemaLocation}`)
            .join(' '));
    }
    else {
        node.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation', this.schemaLocation);
    }

    node.appendChild(featuresNode);
    let result = this.xmlSerializer_.serializeToString(node);

    if (featureTypeMetadata?.origin === Consts.format.GML) {
        // Quitamos los atributos xmlns:* que añade el motor XML
        const namespaces = featureTypeMetadata?.originalMetadata?.namespaces;
        if (namespaces) {
            let fullPattern = '<FeatureCollection';
            namespaces.forEach((ns) => {
                const pattern = ` xmlns:${ns.prefix}="${ns.value}"`;
                fullPattern += pattern;
                result = result.replaceAll(pattern, '');
            });
            result = result.replace('<FeatureCollection', fullPattern);
        }
        if (Object.keys(featureTypeMetadata?.originalMetadata.featureTypes).length) {
            [
                'MultiPolygon',
                'MultiSurface',
                'surfaceMember',
                'Polygon',
                'Surface',
                'LineString',
                'Curve',
                'MultiLineString',
                'MultiCurve',
                'curveMember',
                'exterior',
                'interior',
                'LinearRing',
                'posList'
            ].forEach((elm) => {
                result = result.replaceAll('<' + elm, '<gml:' + elm);
                result = result.replaceAll('/' + elm, '/gml:' + elm)
            })

        }
    }

    return result;
};

const getNamespaceURI = function (name, defaultNamespace) {
    const [prefix] = getNameComponents(name);
    let ns = defaultNamespace;
    if (this.featureTypeMetadata) {
        ns = this
            .featureTypeMetadata
            .originalMetadata
            ?.namespaces
            .find((namespace) => namespace.prefix === prefix)
            ?.value ?? ns;
    }
    return ns;
};

GML3.prototype.writeFeatureElement = function (node, feature, objectStack) {
    const fid = feature.getId();
    if (fid) {
        node.setAttribute('fid', /** @type {string} */(fid));
    }
    const context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    const featureNS = context['featureNS'];
    const geometryName = feature.getGeometryName();
    if (!context.serializers) {
        context.serializers = {};
        context.serializers[featureNS] = {};
    }
    const keys = [];
    const values = [];
    if (feature.hasProperties()) {
        // Desdoblamos los atributos que son atributos XML:
        // elm@attr --> elm.@attr
        const replaceAttributes = (obj) => {
            if (obj instanceof Geometry) {
                return obj;
            }
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
                return obj;
            }
            const result = {};
            const entries = Object.entries(obj);
            // Confeccionamos la lista de propiedades atributo de otra propiedad
            entries
                .filter(([key]) => key.indexOf(ATTRIBUTE_NAME_MARK) > 0)
                .forEach(([key, val]) => {
                    const [parentKey, childKey] = key.split(ATTRIBUTE_NAME_MARK);
                    if (!Object.prototype.hasOwnProperty.call(result, parentKey)) {
                        result[parentKey] = { [TEXT_NODE]: obj[parentKey] };
                    }
                    result[parentKey][ATTRIBUTE_NAME_MARK + childKey] = val;
                });
            // Confeccionamos la lista de propiedades que no son atributo de otra propiedad
            entries
                .filter(([key]) => key.indexOf(ATTRIBUTE_NAME_MARK) <= 0)
                .forEach(([key, val]) => {
                    if (!Object.prototype.hasOwnProperty.call(result, key)) {
                        result[key] = replaceAttributes(val);
                    }
                });
            return result;
        };
        const properties = replaceAttributes(feature.getProperties());
        /////////////////////////

        for (const key in properties) {
            const value = properties[key];
            if (Array.isArray(value)) {
                value.forEach((v) => values.push(v));
                value.forEach(() => keys.push(key));
            }
            else {
                keys.push(key);
                values.push(value);
            }
            if (
                key == geometryName ||
                typeof (/** @type {?} */ value?.getSimplifiedGeometry) ===
                'function'
            ) {
                if (!(key in context.serializers[featureNS])) {
                    context.serializers[featureNS][key] = makeChildAppender(
                        this.writeGeometryElement,
                        this
                    );
                }
            } else {
                const ns = getNamespaceURI.call(this, key, featureNS);
                context.serializers[ns] ??= {};
                if (!(key in context.serializers[ns])) {
                    if (key === 'boundedBy') {
                        context.serializers[ns][key] =
                            makeChildAppender(this.writeBoundedByElement);
                    }
                    else {
                        context.serializers[ns][key] =
                            makeChildAppender(this.writeFeaturePropertyNode);
                    }
                    ///////
                    if (key.indexOf(':') > 0) {
                        context.serializers[ns][key.substring(key.indexOf(':') + 1)] =
                            context.serializers[ns][key];
                    }
                    ///////
                }
            }
        }
    }
    const item = Object.assign({}, context);
    item.node = node;
    values.forEach((v, i) => {
        const name = keys[i];
        const ns = getNamespaceURI.call(this, name, featureNS);
        const prefix = this.featureTypeMetadata?.originalMetadata.namespaces.find((nsObj) => nsObj.value === ns)?.prefix;
        const tagName = prefix && name.indexOf(':') < 0 ? prefix + ':' + name : name;
        pushSerializeAndPop(
            /** @type {import("../xml.js").NodeStackItem} */
            (item),
            context.serializers,
            makeSimpleNodeFactory(tagName, ns),
            [v],
            objectStack,
            [name],
            this
        );
    });
};

GML3.prototype.writeBoundedByElement = function (node, bounds, objectStack) {
    const context = (
        objectStack[objectStack.length - 1]
    );
    const item = Object.assign({}, context);
    item['node'] = node;
    let value;
    if (Array.isArray(bounds)) {
        value = transformExtentWithOptions(
            (bounds),
            context
        );
    }
    pushSerializeAndPop(
        /** @type {import("../xml.js").NodeStackItem} */
        (item),
        this.GEOMETRY_SERIALIZERS,
        this.GEOMETRY_NODE_FACTORY_,
        [value],
        objectStack,
        ['Envelope'],
        this
    );
}

const ATTRIBUTE_NAME_MARK = '@';
const removeAttributeNameMark = (name) => name.substring(name.indexOf(ATTRIBUTE_NAME_MARK) + 1);

GML3.prototype.writeFeaturePropertyNode = function (node, obj, objectStack) {
    const context = (
        objectStack[objectStack.length - 1]
    );
    const featureNS = context['featureNS'];
    const item = Object.assign({}, context);
    item.node = node;
    if (obj === null) {
        node.setAttribute('xsi:nil', 'true');
    } else if (typeof obj === 'object' && !Array.isArray(obj)) {
        for (let key in obj) {
            const value = obj[key];
            const ns = getNamespaceURI.call(this, key, featureNS);
            let [prefix, localName] = getNameComponents(removeAttributeNameMark(key));
            prefix ??= this.featureTypeMetadata?.originalMetadata.namespaces.find((nsObj) => nsObj.value === ns)?.prefix;
            const tagName = prefix ? prefix + ':' + localName : localName;
            context.serializers[ns] ??= {};
            if (key === TEXT_NODE) {
                if (value === null) {
                    node.setAttribute('xsi:nil', 'true');
                }
                else if (value !== undefined) {
                    writeStringTextNode(node, value);
                }
            }
            else if (key.startsWith(ATTRIBUTE_NAME_MARK)) {
                node.setAttribute(removeAttributeNameMark(key), value || '');
            }
            else {
                if (!(key in context.serializers[ns])) {
                    if (value instanceof Geometry) {
                        context.serializers[ns][key] = makeChildAppender(
                            this.writeGeometryElement,
                            this
                        );
                    }
                    else {
                        context.serializers[ns][key] = makeChildAppender(this.writeFeaturePropertyNode);
                    }
                    context.serializers[ns][localName] = context.serializers[ns][key];
                }
                pushSerializeAndPop(
                    /** @type {import("../xml.js").NodeStackItem} */
                    (item),
                    context.serializers,
                    makeSimpleNodeFactory(tagName, ns),
                    [value],
                    objectStack,
                    [key],
                    this
                );
            }
        }
    }
    else {
        writeStringTextNode(node, obj);
    }
    // Parche para quitar atributo no necesario
    [...node.attributes].slice().forEach((attr) => {
        if (attr.name.startsWith("xmlns")) {
            node.removeAttribute(attr);
        }
    });
};

export default GML3;
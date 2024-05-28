import GML from 'ol/format/GML';
import {
    createElementNS,
    makeChildAppender,
    makeSimpleNodeFactory,
    pushSerializeAndPop
} from 'ol/xml';
import { writeStringTextNode } from 'ol/format/xsd';

const CONTENT = '_content_';

const writeComplexNode = function (node, obj) {
    const writeNode = function (n, k, v) {
        let currentNode = n;
        if (k !== CONTENT) {
            currentNode = createElementNS(n.namespaceURI, k);
            n.appendChild(currentNode);
        }
        if (typeof v === 'object') {
            writeComplexNode(currentNode, v);
        }
        else {
            writeStringTextNode(currentNode, v);
        }
    };
    if (obj && Object.prototype.hasOwnProperty.call(obj, CONTENT)) {
        // Las propiedades son atributos
        for (let key in obj) {
            const value = obj[key];
            if (key === CONTENT) {
                if (value !== undefined) {
                    writeNode(node, key, value);
                }
            }
            else {
                node.setAttribute(key, value);
            }
        }
    }
    else {
        for (let key in obj) {
            const value = obj[key];
            writeNode(node, key, value);
        }
    }
};

GML.prototype.writeFeatureElement = function (node, feature, objectStack) {
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
        const properties = feature.getProperties();
        for (const key in properties) {
            const value = properties[key];
            if (value !== null) {
                keys.push(key);
                values.push(value);
                if (
                    key == geometryName ||
                    typeof (/** @type {?} */ (value).getSimplifiedGeometry) ===
                    'function'
                ) {
                    if (!(key in context.serializers[featureNS])) {
                        context.serializers[featureNS][key] = makeChildAppender(
                            this.writeGeometryElement,
                            this
                        );
                    }
                } else {
                    if (!(key in context.serializers[featureNS])) {
                        /// Parche para soportar INSPIRE
                        if (typeof value === 'object') {
                            context.serializers[featureNS][key] =
                                makeChildAppender(writeComplexNode);
                        }
                        ////////////////////////////////
                        else {
                            context.serializers[featureNS][key] =
                                makeChildAppender(writeStringTextNode);
                        }
                    }
                }
            }
        }
    }
    const item = Object.assign({}, context);
    item.node = node;
    pushSerializeAndPop(
        /** @type {import("../xml.js").NodeStackItem} */
        (item),
        context.serializers,
        makeSimpleNodeFactory(undefined, featureNS),
        values,
        objectStack,
        keys
    );
};

export default GML;
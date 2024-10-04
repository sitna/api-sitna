
/**
 * @author: Tobias Nickel
 * @created: 06.04.2015
 * I needed a small xmlparser chat can be used in a worker.
 */

/**
 * parseXML / html into a DOM Object. with no validation and some failur tolerance
 * @params S {string} your XML to parse
 * @param options {object} all other options:
 * searchId {string} the id of a single element, that should be returned. using this will increase the speed rapidly
 * filter {function} filter method, as you know it from Array.filter. but is goes throw the DOM.
 * simplify {bool} to use tXml.simplify.
 */

//importScripts('./loquesea.js');

function tXml(S, options) {
    "use strict";
    options = options || {};

    var pos = 0;

    var openBracket = "<";
    var openBracketCC = "<".charCodeAt(0);
    var closeBracket = ">";
    var closeBracketCC = ">".charCodeAt(0);
    //var minus = "-";
    var minusCC = "-".charCodeAt(0);
    //var slash = "/";
    var slashCC = "/".charCodeAt(0);
    //var exclamation = '!';
    var exclamationCC = '!'.charCodeAt(0);
    //var singleQuote = "'";
    var singleQuoteCC = "'".charCodeAt(0);
    //var doubleQuote = '"';
    var doubleQuoteCC = '"'.charCodeAt(0);
    //var openSquareBracket = "[";
    var openSquareBracketCC = "[".charCodeAt(0);
    //var closeSquareBracket = "]";
    var closeSquareBracketCC = "]".charCodeAt(0);

    /**
     * parsing a list of entries
     */

    function parseChildren() {
        var children = [];
        while (S[pos]) {
            if (S.charCodeAt(pos) == openBracketCC) {
                if (S.charCodeAt(pos + 1) === slashCC) {
                    pos = S.indexOf(closeBracket, pos);
                    return children;
                } else if (S.charCodeAt(pos + 1) === exclamationCC) {
                    var char2 = S.charCodeAt(pos + 2);
                    if (char2 == openSquareBracketCC) {
                        // cdata support
                    }
                    else {
                        if (char2 == minusCC) {
                            //comment support
                            while (pos !== -1 && !(S.charCodeAt(pos) === closeBracketCC && S.charCodeAt(pos - 1) == minusCC && S.charCodeAt(pos - 2) == minusCC && pos != -1)) {
                                pos = S.indexOf(closeBracket, pos + 1);
                            }
                            if (pos === -1)
                                pos = S.length
                        } else {
                            // doctypesupport
                            pos += 2;
                            while (S.charCodeAt(pos) !== closeBracketCC) {
                                pos++;
                            }
                        }
                        pos++;
                        continue;
                    }
                }
                var node = parseNode();
                children.push(node);
            } else {
                var text = parseText()
                if (text.trim().length > 0)
                    children.push(text);
            }
            pos++;
        }
        return children;
    }

    /**
     *    returns the text outside of texts until the first '<'
     */

    function parseText() {
        var start = pos;
        pos = S.indexOf(openBracket, pos) - 1;
        if (pos === -2)
            pos = S.length;
        return S.slice(start, pos + 1);
    }
    /**
     *    returns text until the first nonAlphebetic letter
     */
    var nameSpacer = '\n\t>/= ';

    function parseName() {
        var start = pos;
        var c = S[pos];
        while (nameSpacer.indexOf(c) === -1) {
            c = S[++pos];
        }
        return S.slice(start, pos);
    }
    /**
     *    is parsing a node, including tagName, Attributes and its children,
     * to parse children it uses the parseChildren again, that makes the parsing recursive
     */
    var NoChildNodes = ['img', 'br', 'input', 'meta', 'link'];

    function parseNode() {
        var node = {};
        pos++;
        if (S.charCodeAt(pos) === exclamationCC && S.charCodeAt(pos + 1) === openSquareBracketCC) {
            // parse cdata
            var start = pos + 8;
            while (!(S.charCodeAt(pos) === closeBracketCC && S.charCodeAt(pos - 1) === closeSquareBracketCC && S.charCodeAt(pos - 2) === closeSquareBracketCC)) {
                pos++;
            }
            return S.slice(start, pos - 2);
        }

        node.tagName = parseName();

        // parsing attributes
        var attrFound = false;
        let name;
        while (S.charCodeAt(pos) !== closeBracketCC) {
            var c = S.charCodeAt(pos);
            if ((c > 64 && c < 91) || (c > 96 && c < 123)) {
                //if('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(S[pos])!==-1 ){
                name = parseName();
                // search beginning of the string
                var code = S.charCodeAt(pos);
                while (code !== singleQuoteCC && code !== doubleQuoteCC && !((code > 64 && code < 91) || (code > 96 && code < 123)) && code !== closeBracketCC) {
                    pos++;
                    code = S.charCodeAt(pos);
                }
                if (!attrFound) {
                    node.attributes = {};
                    attrFound = true;
                }
                let value;
                if (code === singleQuoteCC || code === doubleQuoteCC) {
                    value = parseString();
                } else {
                    value = null;
                    pos--;
                }
                node.attributes[name] = value;
            }
            pos++;

        }
        // optional parsing of children
        if (S.charCodeAt(pos - 1) !== slashCC) {
            if (node.tagName == "script") {
                const start = pos + 1;
                pos = S.indexOf('</script>', pos);
                node.children = [S.slice(start, pos - 1)];
                pos += 8;
            } else if (node.tagName == "style") {
                const start = pos + 1;
                pos = S.indexOf('</style>', pos);
                node.children = [S.slice(start, pos - 1)];
                pos += 7;
            } else if (NoChildNodes.indexOf(node.tagName) == -1) {
                pos++;
                node.children = parseChildren(name);
            }
        }
        return node;
    }

    /**
     *    is parsing a string, that starts with a char and with the same usually  ' or "
     */

    function parseString() {
        var startChar = S[pos];
        var startpos = ++pos;
        pos = S.indexOf(startChar, startpos)
        return S.slice(startpos, pos);
    }

    /**
     *
     */

    function findElements() {
        var r = new RegExp('\\s' + options.attrName + '\\s*=[\'"]' + options.attrValue + '[\'"]').exec(S)
        if (r) {
            return r.index;
        } else {
            return -1;
        }
    }

    let out = null;
    if (options.attrValue !== undefined) {
        options.attrName = options.attrName || 'id';
        out = [];

        while ((pos = findElements()) !== -1) {
            pos = S.lastIndexOf('<', pos);
            if (pos !== -1) {
                out.push(parseNode());
            }
            S = S.substr(pos);
            pos = 0;
        }
    } else {
        out = parseChildren();
    }

    if (options.filter) {
        out = tXml.filter(out, options.filter);
    }

    if (options.simplify) {
        out = tXml.simplify(out);
    }
    return out;
}
/**
 * transform the DomObject to an object that is like the object of PHPs simplexmp_load_*() methods.
 * this format helps you to write that is more likely to keep your programm working, even if there a small changes in the XML schema.
 * be aware, that it is not possible to reproduce the original xml from a simplified version, because the order of elements is not saved.
 * therefore your programm will be more flexible and easyer to read.
 *
 * @param {array} the childrenList
 */
tXml.simplify = function simplify(children) {
    var out = {};
    if (!children || !children.length) {
        return '';
    }

    if (children.length === 1 && typeof children[0] == 'string') {
        return children[0];
    }
    // map each object
    children.forEach(function (child) {
        if (typeof child !== 'object') {
            return;
        }
        if (!out[child.tagName])
            out[child.tagName] = [];
        var kids = tXml.simplify(child.children);
        out[child.tagName].push(kids);
        if (child.attributes) {
            kids._attributes = child.attributes;
        }
    });

    for (var i in out) {
        if (out[i].length == 1) {
            out[i] = out[i][0];
        }
    }

    return out;
};

/**
 * behaves the same way as Array.filter, if the filter method return true, the element is in the resultList
 * @params children{Array} the children of a node
 * @param f{function} the filter method
 */
tXml.filter = function (children, f) {
    var out = [];
    children.forEach(function (child) {
        if (typeof (child) === 'object' && f(child)) out.push(child);
        if (child.children) {
            var kids = tXml.filter(child.children, f);
            out = out.concat(kids);
        }
    });
    return out;
};

/**
 * stringify a previously parsed string object.
 * this is useful,
 *  1. to remove whitespaces
 * 2. to recreate xml data, with some changed data.
 * @param O{tXMLDomObject} the object to Stringify
 */
tXml.stringify = function TOMObjToXML(O) {
    var out = '';

    function writeChildren(O) {
        if (O)
            for (var i = 0; i < O.length; i++) {
                if (typeof O[i] == 'string') {
                    out += O[i].trim();
                } else {
                    writeNode(O[i]);
                }
            }
    }

    function writeNode(N) {
        out += "<" + N.tagName;
        for (var i in N.attributes) {
            if (N.attributes[i] === null) {
                out += ' ' + i;
            } else if (N.attributes[i].indexOf('"') === -1) {
                out += ' ' + i + '="' + N.attributes[i].trim() + '"';
            } else {
                out += ' ' + i + "='" + N.attributes[i].trim() + "'";
            }
        }
        out += '>';
        writeChildren(N.children);
        out += '</' + N.tagName + '>';
    }
    writeChildren(O);

    return out;
};


/**
 * use this method to read the textcontent, of some node.
 * It is great if you have mixed content like:
 * this text has some <b>big</b> text and a <a href=''>link</a>
 */
tXml.toContentString = function (tDom) {
    if (Array.isArray(tDom)) {
        var out = '';
        tDom.forEach(function (e) {
            out += ' ' + tXml.toContentString(e);
            out = out.trim();
        });
        return out;
    } else if (typeof tDom === 'object') {
        return tXml.toContentString(tDom.children)
    } else {
        return ' ' + tDom;
    }
};

tXml.getElementById = function (S, id, simplified) {
    var out = tXml(S, {
        attrValue: id,
        simplify: simplified
    });
    return simplified ? out : out[0];
};
/**
 * A fast parsing method, that not realy finds by classname,
 * more: the class attribute contains XXX
 * @param
 */
tXml.getElementsByClassName = function (S, classname, simplified) {
    return tXml(S, {
        attrName: 'class',
        attrValue: '[a-zA-Z0-9\-\s ]*' + classname + '[a-zA-Z0-9\-\s ]*',
        simplify: simplified
    });
};

if ('object' === typeof module) {
    module.exports = tXml;
}

//console.clear();
//console.log('here:',tXml.getElementById('<some><xml id="test">dada</xml><that id="test">value</that></some>','test'));
//console.log('here:',tXml.getElementsByClassName('<some><xml id="test" class="sdf test jsalf">dada</xml><that id="test">value</that></some>','test'));

/*
console.clear();
tXml(d,'content');
 //some testCode
var s = document.body.innerHTML.toLowerCase();
var start = new Date().getTime();
var o = tXml(s,'content');
var end = new Date().getTime();
//console.log(JSON.stringify(o,undefined,'\t'));
console.log("MILLISECONDS",end-start);
var nodeCount=document.querySelectorAll('*').length;
console.log('node count',nodeCount);
console.log("speed:",(1000/(end-start))*nodeCount,'Nodes / second')
//console.log(JSON.stringify(tXml('<html><head><title>testPage</title></head><body><h1>TestPage</h1><p>this is a <b>test</b>page</p></body></html>'),undefined,'\t'));
var p = new DOMParser();
var s2='<body>'+s+'</body>'
var start2= new Date().getTime();
var o2 = p.parseFromString(s2,'text/html').querySelector('#content')
var end2=new Date().getTime();
console.log("MILLISECONDS",end2-start2);
// */


(function () {

    const XSD_PREFIXES = ['xsd', 'xs'];
    const TEXT_NODE = '#text';
    const ATTRIBUTE_NAME_PREFIX = '@';
    const removePrefix = (str, prefix) => prefix ? str.substring(prefix.length) : str.substring(str.indexOf(":") + 1);
    const addPrefix = (str, prefix) => str.indexOf(':') > 0 ? str : prefix + str;

    const getPrefixForNamespace = function (schema, namespace) {
        for (const [attrName, value] of Object.entries(schema.attributes)) {
            if (attrName.startsWith('xmlns:') && value === namespace) {
                return attrName.substring(attrName.indexOf(':') + 1) + ':';
            }
        }
        return '';
    };

    const getTargetNamespacePrefix = function (schema) {
        const targetNamespace = schema.attributes?.targetNamespace;
        if (targetNamespace) {
            return getPrefixForNamespace(schema, targetNamespace);
        }
        return '';
    };

    const removePrefixFromAttribute = function (attributes, attributeName, prefix) {
        if (attributes?.[attributeName]?.indexOf(prefix) === 0) {
            attributes[attributeName] = removePrefix(attributes[attributeName], prefix);
        }
    };

    const addPrefixToAttribute = function (attributes, attributeName, prefix) {
        if (attributes?.[attributeName]) {
            attributes[attributeName] = addPrefix(attributes[attributeName], prefix);
        }
    };

    const getPredicateForTagName = (...tagNames) => {
        const compoundedTagNames = tagNames.slice();
        for (const tagName of tagNames) {
            for (const prefix of XSD_PREFIXES) {
                compoundedTagNames.push(prefix + ':' + tagName);
            }
        }
        return function (node) {
            for (const tagName of compoundedTagNames) {
                if (node?.tagName === tagName) {
                    return true;
                }
            }
            return false;
        };
    };

    const findByTagName = function (node, ...predicateOrTagNames) {
        let result = [];
        let predicate;
        if (typeof predicateOrTagNames[0] === 'function') {
            predicate = predicateOrTagNames[0];
        }
        else {
            predicate = getPredicateForTagName(...predicateOrTagNames);
        }
        if (predicate(node)) {
            result.push(node);
        }
        if (node?.children) {
            for (const child of node.children) {
                result = result.concat(findByTagName(child, predicate));
            }
        }
        return result;
    };

    const schemaElementPredicate = getPredicateForTagName('element', 'attribute', 'attributeGroup', 'complexType', 'simpleType', 'include', 'import');

    const externalPrefixes = new WeakMap();

    const copySchema = function (schema1, schema2, prefix) {
        for (var key in schema2.attributes) {
            if (key !== 'targetNamespace') {
                schema1.attributes[key] = schema2.attributes[key];
            }
        }
        const newChildren = schema2
            .children
            .filter(schemaElementPredicate);

        const newDescendants = findByTagName(schema2, schemaElementPredicate);

        const targetNamespacePrefix = getTargetNamespacePrefix(schema2);
        if (targetNamespacePrefix) {
            newDescendants.forEach((c) => {
                removePrefixFromAttribute(c.attributes, 'name', targetNamespacePrefix);
                removePrefixFromAttribute(c.attributes, 'type', targetNamespacePrefix);
                removePrefixFromAttribute(c.attributes, 'ref', targetNamespacePrefix);
            });
        }
        if (prefix) {
            newDescendants.forEach((c) => {
                addPrefixToAttribute(c.attributes, 'name', prefix);
                addPrefixToAttribute(c.attributes, 'type', prefix);
                addPrefixToAttribute(c.attributes, 'ref', prefix);
            });
        }
        newChildren.forEach((child2) => {
            const tagName = removePrefix(child2.tagName);
            if (tagName !== 'include' || tagName !== 'import' ||
                !schema1.children.some((child1) => child1.tagName === child2.tagName &&
                child1.attributes?.name === child2.attributes?.name)) {
                if (tagName === 'include' && prefix) {
                    // Si es un include que estaba en un import hay que meter el prefijo del import
                    externalPrefixes.set(child2, prefix);
                }
                schema1.children.push(child2);
            }
        })
    };

    const externalPredicate = getPredicateForTagName('include', 'import');

    const processExternals = async function (schema, url) {
        const external = schema.children.find(externalPredicate);
        if (external) {
            let _url = new URL(external.attributes.schemaLocation, url || schema._url).href;
            _url = _url.replaceAll('&amp;', '&');
            if (!processedExternals.has(_url)) {
                var schema2;
                try {
                    schema2 = await proxifyUrl(_url);
                    schema2._url = _url;
                    schema2.children
                        .filter(externalPredicate)
                        .forEach((ext) => {
                            ext.attributes.schemaLocation = new URL(ext.attributes.schemaLocation, _url).href;
                        });
                } catch (err) {
                    return schema
                }
                let prefix = '';
                const tagName = removePrefix(external.tagName);
                if (tagName === 'import') {
                    // Los imports deben añadir el prefijo de namespace
                    const ns = external.attributes.namespace;
                    for (const [key, value] of Object.entries(schema.attributes)) {
                        if (value === ns) {
                            prefix = removePrefix(key) + ':';
                            break;
                        }
                    }
                }
                else { // include
                    const externalPrefix = externalPrefixes.get(external);
                    if (externalPrefix) {
                        prefix = externalPrefix;
                    }
                }
                copySchema(schema, schema2, prefix);
                if (tagName === 'include' && schema2.attributes?.targetNamespace) {
                    schema.attributes.targetNamespace ??= schema2.attributes.targetNamespace;
                }
                processedExternals.add(_url);
            }
            schema.children.splice(schema.children.indexOf(external), 1);
            await processExternals(schema, _url);
        }
        return schema;
    };

    const flattenElements = function (parent) {
        let result = [];
        if (parent.children) {
            for (const child of parent.children.filter(getPredicateForTagName('element', 'complexContent', 'sequence', 'all'))) {
                if (removePrefix(child.tagName) === 'element') {
                    result.push(child);
                }
                else {
                    result = result.concat(flattenElements(child));
                }
            }
        }
        return result;
    };

    const flattenAttributes = function (parent) {
        let result = [];
        if (parent.children) {
            for (const child of parent.children.filter(getPredicateForTagName('attribute', 'attributeGroup', 'complexContent', 'simpleContent'))) {
                if (removePrefix(child.tagName) === 'attribute') {
                    result.push(child);
                }
                else {
                    result = result.concat(flattenAttributes(child));
                }
            }
        }
        return result;
    };

    const sequencePredicate = getPredicateForTagName('sequence');
    const contentPredicate = getPredicateForTagName('complexContent', 'simpleContent');
    const extensionPredicate = getPredicateForTagName('extension');

    const extendedTypeNames = new Map();

    const mergeNodeExtensions = function (schema, parentNode, complexType) {
        let result;
        const extensions = parentNode.children.filter(extensionPredicate);
        for (const extension of extensions) {
            const baseTypeName = extension.attributes.base;
            if (complexType.attributes?.name) extendedTypeNames.set(complexType.attributes.name, baseTypeName);
            let baseType = schema.children
                .filter(getPredicateForTagName('complexType', 'simpleType'))
                .find((type) => type.attributes.name === baseTypeName);
            const extendedSequence = extension.children?.find(sequencePredicate);
            if (baseType) {
                result ??= mergeExtensions(schema, baseType);
                if (!result) {
                    // 
                    result = baseTypeName;
                    while (extendedTypeNames.has(result)) {
                        result = extendedTypeNames.get(result);
                    }
                }
                const baseSequence = baseType
                    .children
                    .find(contentPredicate)
                    ?.children
                    .find(sequencePredicate);
                if (baseSequence) {
                    if (extendedSequence) {
                        extendedSequence.children = baseSequence.children.concat(extendedSequence.children);
                    }
                    else {
                        parentNode.children.push({ ...baseSequence });
                    }
                }
                const baseAttributes = flattenAttributes(baseType);
                for (const baseAttribute of baseAttributes) {
                    parentNode.children.push(baseAttribute);
                }
            }
            else {
                // No hemos encontrado el tipo base, asumimos que es un tipo básico (integer, etc.).
                result = baseTypeName;
                const parentElement = findByTagName(schema, 'element').find((elm) => elm.children?.includes(complexType));
                if (parentElement) {
                    parentElement.attributes.type = baseTypeName;
                    if (!flattenAttributes(extension).length) {
                        // No hay atributos a añadir, podemos cargarnos el tipo complejo y dejar el tipo básico
                        parentElement.children.splice(parentElement.children.indexOf(complexType), 1);
                    }
                }
            }
            parentNode.children.splice(parentNode.children.indexOf(extension), 1);
            const extendedAttributes = flattenAttributes(extension);
            extendedAttributes?.forEach((attrElm) => {
                parentNode.children ??= [];
                parentNode.children.push(attrElm);
            });
            if (extendedSequence) parentNode.children.push(extendedSequence);
        }
        return result;
    };

    const mergeExtensions = function (schema, complexType) {
        let result = mergeNodeExtensions(schema, complexType, complexType);
        for (const contentElement of complexType.children.filter(contentPredicate)) {
            result ??= mergeNodeExtensions(schema, contentElement, complexType);
        }
        return result;
    };

    const findRefParents = function (node) {
        let result = [];
        if (node?.children) {
            for (const child of node.children) {
                if (child?.attributes?.ref) {
                    result.push(node);
                }
                result = result.concat(findRefParents(child));
            }
        }
        return result;
    };

    const processRefAttributes = function (schema, typeElement) {
        let changed = false;
        const refParents = findRefParents(typeElement);
        for (const parent of refParents.reverse()) {
            parent.children.forEach((child, idx) => {
                const reference = child?.attributes?.ref;
                if (reference) {
                    const childAttributes = { ...child.attributes };
                    delete childAttributes.ref;
                    const localTagName = removePrefix(child.tagName);
                    const referenced = schema
                        .children
                        .filter(getPredicateForTagName(localTagName))
                        .find((elm) => elm.attributes?.name === reference);
                    if (referenced) {
                        const toInsert = { ...referenced };
                        toInsert.attributes = { ...toInsert.attributes, ...childAttributes };
                        parent.children.splice(idx, 1, toInsert);
                        changed = true;
                    }
                }
            });
        }
        return changed;
    };

    const findTypedElements = function (node) {
        let result = [];
        if (node?.children) {
            for (const child of node.children) {
                if (child?.attributes?.type) {
                    result.push(child);
                }
                result = result.concat(findTypedElements(child));
            }
        }
        return result;
    };

    const processTypeAttributes = function (schema, typeElement) {
        let changed = false;
        const typedElements = findTypedElements(typeElement);
        for (const element of typedElements) {
            const typeName = element.attributes.type;
            const referencedType = schema
                .children
                .filter(getPredicateForTagName('complexType', 'simpleType'))
                .find((elm) => elm.attributes?.name === typeName);
            if (referencedType) {
                changed = true;
                element.children ??= [];
                element.children.push(referencedType);
                delete element.attributes.type;
            }
        }
        return changed;
    };

    const getReferencedType = async function (schema, type, depth) {
        if (type.startsWith("xsd:")) {
            type = removePrefix(type);
        }
        //miro si ya está en la colección
        if (collection[type]) {
            return collection[type];
        }

        collection[type] = await processType(schema, type, ++depth);

        return collection[type];
    };

    const getReferencedElement = async function (schema, element) {
        if (element.attributes?.type === 'gml:ReferenceType') {
            const annotation = element.children?.find(getPredicateForTagName('annotation'));
            if (annotation) {
                const appinfo = annotation.children?.find(getPredicateForTagName('appinfo'));
                if (appinfo?.attributes?.source === 'urn:x-gml:targetElement') {
                    const path = appinfo.children[0];
                    if (path) {
                        let parent = schema;
                        for (const part of path.split('/')) {
                            if (part.startsWith('@')) {
                                const attribute = schema
                                    .children
                                    .filter(getPredicateForTagName('attribute'))
                                    .find((attr) => attr.attributes.name === part.substring(1));
                                if (attribute) {
                                    return attribute.attributes?.type ?? null;
                                }
                                return null;
                            }
                            else {
                                const element = parent
                                    .children
                                    .filter(getPredicateForTagName('element'))
                                    .find((elm) => elm.attributes.name === part);
                                if (element) {
                                    parent = element;
                                }
                            }
                        }
                        if (parent !== schema) {
                            return await processElement(schema, parent);
                        }
                    }
                }
            }
        }
        return null;
    };

    const geometryTypes = [
        "gml:PointPropertyType",
        "gml:MultiPointPropertyType",
        "gml:LineStringPropertyType",
        "gml:MultiLineStringPropertyType",
        "gml:LinearRingPropertyType",
        "gml:PolygonPropertyType",
        "gml:MultiPolygonPropertyType",
        "gml:MultiSurfacePropertyType",
        "gml:GeometryPropertyType",
        "gml:GeometryCollectionPropertyType",
        "gml:GeometryAssociationType",
        "gml:MultiCurvePropertyType",
        "gml:CurvePropertyType",
        "gml:BoxPropertyType",
        "gml:AbstractGeometryType"
    ];

    const requestCache = new Map();
    const xmlCache = new Map();
    const promiseCallbacks = new Map();

    const proxifyUrl = async function (url) {
        if (xmlCache.has(url)) {
            return tXml(xmlCache.get(url))[0];
        }
        if (!requestCache.has(url)) {
            requestCache.set(url, new Promise(function (resolve) {
                promiseCallbacks.set(url, resolve);
            }));
            self.postMessage(url);
        }
        return await requestCache.get(url);
    };

    //const getComplexType = function (schema, element) {
    //    const prefix = getTargetNamespacePrefix(schema);
    //    let complexType;
    //    if (element.attributes.type) {
    //        const type = addPrefix(element.attributes.type, prefix);
    //        complexType = schema
    //            .children
    //            .filter(getPredicateForTagName('complexType'))
    //            .find((node) => addPrefix(node.attributes.name, prefix) === type);
    //    }
    //    if (complexType) {
    //        return complexType;
    //    }
    //    return null;
    //};

    const processElement = async function (schema, element, depth) {
        if (depth === MAX_DEPTH) return null;

        if (element) {
            let elementObject = {};
            //cada atributo será un objeto cuyo key será el nombre del atributo y dentro un objeto información de cada atribut como tipo si es nullable etc 
            for (let attributeName in element.attributes) {
                const markedAttributeName = ATTRIBUTE_NAME_PREFIX + attributeName;
                switch (attributeName) {
                    case "minOccurs":
                    case "maxOccurs":
                        elementObject[markedAttributeName] = parseInt(element.attributes[attributeName], 10);
                        if (Number.isNaN(elementObject[markedAttributeName]))
                            elementObject[markedAttributeName] = element.attributes[attributeName];
                        break;
                    case "nillable":
                        elementObject[markedAttributeName] = element.attributes[attributeName] === "true" ? true : false;
                        break;
                    default:
                        elementObject[markedAttributeName] = element.attributes[attributeName];
                        break;
                }
            }

            let type = element.attributes.type;
            if (type) {
                if (type === "gml:ReferenceType") {
                    elementObject = await getReferencedElement(schema, element);
                }
                else {
                    elementObject.type = await getReferencedType(schema, type, depth);
                }
            }
            else {
                //si el tipo del atributo no es un texto sino un elemento complexType o simpleType
                const elementTypeElement = element.children.find(getPredicateForTagName('complexType', 'simpleType'));
                elementObject.type = await processType(schema, elementTypeElement, depth);
            }

            collection[element.attributes.name] = elementObject;
            const prefix = getPrefixForNamespace(schema, schema.attributes.targetNamespace);
            if (prefix) {
                collection[prefix + element.attributes.name] = elementObject;
            }
            return elementObject;
        }

        return null;
    };

    const processType = async function (schema, type, depth) {

        let typeElement;
        if (typeof type === 'string') {
            if (geometryTypes.includes(type)) return type; // no procesamos las geometrías

            const localType = removePrefix(type);
            const typePredicate = (item) => item.attributes.name === type || item.attributes.name === localType;
            typeElement = schema
                .children
                .filter(getPredicateForTagName('complexType'))
                .find(typePredicate);
            if (!typeElement) {
                typeElement = schema
                    .children
                    .filter(getPredicateForTagName('simpleType'))
                    .find(typePredicate);
                if (typeElement) {
                    return typeElement.attributes.name;
                }
            }
        }
        else {
            typeElement = type;
        }
        if (!typeElement) return type;
        if (geometryTypes.includes(typeElement.attributes?.name)) return typeElement.attributes.name; // no procesamos las geometrías

        const objFeature = {};

        // Hago merge de todos los tipos en extension
        const baseType = mergeExtensions(schema, typeElement);
        if (baseType && !baseType.includes(':')) {
            // Resulta que en el fondo este typeElement era la extensión de un tipo básico. 
            // Devolvemos el tipo base en la propiedad especial #text
            objFeature[TEXT_NODE] = { type: baseType };
        }

        let typeChangesMade, refChangesMade;
        do {
            // Sustituimos los elementos con atributos type por los elementos referenciados
            typeChangesMade = processTypeAttributes(schema, typeElement);

            // Sustituimos los elementos con atributos ref por los elementos referenciados
            refChangesMade = processRefAttributes(schema, typeElement);
        }
        while (typeChangesMade || refChangesMade);

        //Recorro los nodos element debajo del nodo typeElement, incluyendo los que estan en complexContent, sequence o all
        const elements = flattenElements(typeElement);
        //recorro los nodos element que son los atributos de la feature
        for (const element of elements) {
            const elmObj = await processElement(schema, element, depth + 1);
            if (elmObj) {
                elmObj.index = Object.keys(objFeature).length;
                objFeature[element.attributes.name] = elmObj;
            }
        }
        //recorro los nodos attribute que sean atributos de la feature
        const attributes = flattenAttributes(typeElement);
        for (const attribute of attributes) {
            let type = attribute.attributes.type || 'string';
            const attrObj = {};
            attrObj.type = await getReferencedType(schema, type, depth);
            objFeature[ATTRIBUTE_NAME_PREFIX + attribute.attributes.name] = attrObj;
        }
        return objFeature;
    };

    const processDft = async function (json, layerName, _prefix) {
        //coger nodo esquema
        const schema = json.find(getPredicateForTagName('schema'));
        //Añado includes e imports
        await processExternals(schema);

        //busco los elements con el nombre de la capa en cuestión
        const elementName = removePrefix(layerName);
        const layerElement = schema
            .children
            .filter(getPredicateForTagName('element'))
            .find((node) => node.attributes.name === elementName);

        await processElement(schema, layerElement, 0);
    };

    var collection = {};
    var processedExternals = new Set();
    const MAX_DEPTH = 10;

    onmessage = async function (e) {
        if (e.data.type === 'describeFeatureType') {
            const json = tXml(e.data.xml);

            const layerNames = Array.isArray(e.data.layerName) ? e.data.layerName : e.data.layerName.split(",");
            let result;
            try {
                for (var i = 0; i < layerNames.length; i++) {
                    await processDft(json, layerNames[i]);
                }
                result = true;
            }
            catch (error) {
                console.error(error);
                result = error.message;
            }
            postMessage({
                state: result === true ? 'success' : 'error',
                message: result === true ? '' : result,
                dftCollection: layerNames.reduce(function (acc, name) {
                    const dft = collection[name] ?? collection[name.replace(/^\w{1,}:/, (v) => v.toLowerCase())];
                    return Object.assign(acc, { [name]: dft });
                }, {})
            });
            close();
        }
        else {
            xmlCache.set(e.data.url, e.data.xml);
            const callback = promiseCallbacks.get(e.data.url);
            if (callback) {
                callback(tXml(e.data.xml)[0]);
                promiseCallbacks.delete(e.data.url);
            }
        }

    };

})();

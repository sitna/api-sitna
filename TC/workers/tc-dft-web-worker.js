
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
    var minus = "-";
    var minusCC = "-".charCodeAt(0);
    var slash = "/";
    var slashCC = "/".charCodeAt(0);
    var exclamation = '!';
    var exclamationCC = '!'.charCodeAt(0);
    var singleQuote = "'";
    var singleQuoteCC = "'".charCodeAt(0);
    var doubleQuote = '"';
    var doubleQuoteCC = '"'.charCodeAt(0);
    var openSquareBracket = "[";
    var openSquareBracketCC = "[".charCodeAt(0);
    var closeSquareBracket = "]";
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
            // flacunza: Ignoramos los prefijos
            if (c === ':') {
                pos++;
                start = pos;
            }
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
        while (S.charCodeAt(pos) !== closeBracketCC) {
            var c = S.charCodeAt(pos);
            if ((c > 64 && c < 91) || (c > 96 && c < 123)) {
                //if('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(S[pos])!==-1 ){
                var name = parseName();
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
                if (code === singleQuoteCC || code === doubleQuoteCC) {
                    var value = parseString();
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
                var start = pos + 1;
                pos = S.indexOf('</script>', pos);
                node.children = [S.slice(start, pos - 1)];
                pos += 8;
            } else if (node.tagName == "style") {
                var start = pos + 1;
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

    var out = null;
    if (options.attrValue !== undefined) {
        options.attrName = options.attrName || 'id';
        var out = [];

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

    var simplify = function simplify(children, attributes) {
        var out = {};
        if ((!children || !children.length) && !attributes) {
            return '';
        }
        children = children || [];

        if (children.length === 1 && typeof children[0] == 'string') {
            return children[0];
        }
        // map each object
        children.forEach(function (child) {
            if (typeof child !== 'object') {
                return;
            }
            var prefixIdx = child.tagName.indexOf('ows:');
            var tagName = prefixIdx < 0 ? child.tagName : child.tagName.substr(prefixIdx + 4);
            if (!out[tagName])
                out[tagName] = [];
            var kids = simplify(child.children, child.attributes);
            out[tagName].push(kids);
            if (child.attributes) {
                for (var key in child.attributes) {
                    kids[key] = child.attributes[key];
                }
            }
        });

        for (var i in out) {
            if (out[i].length == 1) {
                out[i] = out[i][0];
            }
        }

        return out;
    };
    const removePreffix = function (str) {
        return str.substring(str.indexOf(":") + 1);
    }
    const copySchema = function (schema1, schema2) {
        for (var key in schema2.attributes) {
            schema1.attributes[key] = schema2.attributes[key];
        }
        schema1.children = schema1.children.concat(schema2.children.filter(function (e) { return e.tagName === "element" || e.tagName === "complexType" || e.tagName === "import" }));
    }
    const findByTagName = function (node, tagName) {
        if (node.tagName === tagName)
            return [node];
        else if (node.children) {
            const nodes = node.children.filter(function (node) { return node.tagName === tagName })
            if (nodes.length > 0) return nodes;
            else
                return node.children.reduce(function (vi, va) {
                    return vi.concat(findByTagName(va, tagName));
                }, [])
        }
        return [];
    }
    const proccessIncludes = async function (schema, url) {
        var include = schema.children.filter(function (node) { return node.tagName === "include" })
        if (include.length > 0) {
            for (var i = 0; i < include.length; i++) {
                var _url = include[i].attributes.schemaLocation;
                _url = _url.startsWith("http") ? _url : url.substring(0, url.lastIndexOf("/") + 1) + _url;
                if (IncludesUsed.indexOf(_url) >= 0) continue;
                var schema2;
                try {
                    schema2 = await proxifyUrl(_url);
                } catch (err) {
                    return schema
                }
                copySchema(schema, schema2);
                IncludesUsed.push(_url);
                proccessIncludes(schema, _url);
                return schema;
            }
        }
        return schema;
    }
    const searchHierarchyTypes = async function (schema, type, urlBegin) {
        let IncludesUsed = [];
        const prom = new Promise(async function (resolve) {
            const getRecursive = async function (schema, type, url) {
                var temp = schema.children.find(function (node) { return node.tagName === "complexType" && node.attributes.name === removePreffix(type) });
                if (!temp) {
                    IncludesUsed.push(url);
                    var include = schema.children.filter(function (node) { return node.tagName === "include" });
                    if (include.length > 0) {
                        for (var i = 0; i < include.length; i++) {
                            var _url = include[i].attributes.schemaLocation;
                            _url = _url.startsWith("http") ? _url : url.substring(0, url.lastIndexOf("/") + 1) + _url;
                            if (IncludesUsed.indexOf(_url) >= 0) continue;
                            var schema;
                            try {
                                schema = await proxifyUrl(_url);
                            } catch (err) {
                                console.log(err)
                                throw err;
                            }
                            await getRecursive({ ...schema }, type, _url);
                        }
                    }
                }
                else {
                    var subType = null;
                    var extension = findByTagName(temp, "extension")[0];
                    var subelement = findByTagName(temp, "element")[0]
                    if (extension && extension.attributes.base)
                        subType = extension.attributes.base;
                    if (subelement && subelement.attributes.ref)
                        subType = subelement.attributes.ref;
                    if (subType) {
                        if (subType.indexOf(":") > 0) {
                            IncludesUsed = [];
                            temp = await getRecursive({ ...schema }, subType, urlBegin);
                        }
                        else
                            resolve(subType);
                    }
                    else {
                        resolve(temp)
                    }

                }
            }
            await getRecursive({ ...schema }, type, urlBegin);
            resolve(null);
        });

        return await prom;
    }

    const getExternalType = async function (schema, type, depth) {
        //miro si ya está en la colección
        if (collection[type])
            return collection[type];
        //miro si está en el schema actual
        else if (schema.children && schema.children.filter(function (node) { return node.tagName === "element" && node.attributes.name === removePreffix(type) }).length > 0) {
            if (type.endsWith("Type"))
                collection[type] = await processType(schema, type, ++depth);
            else
                collection[type] = await processElement(schema, type, ++depth);
            return collection[type];
        }
        else {
            //miro si tiene prefijo y busco un import para ese prefijo
            if (type.indexOf(":") > 0) {
                const preffix = type.substring(0, type.indexOf(":"));
                const schemaLocation = schema.children.find(function (_import) { return _import.tagName === "import" && _import.attributes.namespace === schema.attributes[preffix]; }).attributes.schemaLocation;
                var schema2 = await proxifyUrl(schemaLocation.startsWith("http") ? schemaLocation : self.location.origin + "/" + schemaLocation);
                IncludesUsed.push(schemaLocation);
                copySchema(schema, schema2);
                if (type.endsWith("Type")) {
                    let ret = null;
                    if (findByTagName(type, "element").length === 1 && findByTagName(type, "element")[0].attributes.ref)
                        ret = await processElement(schema, findByTagName(type, "element")[0].attributes.ref, ++depth);
                    else
                        ret = await processType(schema, type, ++depth);
                    if (!ret || Object.keys(ret).length === 0)
                        ret = await searchHierarchyTypes(schema2, type, schemaLocation);
                    collection[type] = ret;
                    return ret;
                }
                else {
                    collection[type] = await processElement(schema, type, ++depth);
                    return collection[type];
                }
            }
            return type;
        }

    }

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
        "gml:BoxPropertyType"
    ]

    const requestCache = {};
    const functionsCallback = {};

    const proxifyUrl = async function (url) {
        if (requestCache[url]) {
            if (!(requestCache[url] instanceof Promise))
                return requestCache[url];
            else {
                return await requestCache[url];
            }
        }
        requestCache[url] = new Promise(function (resolve) {
            functionsCallback[url] = resolve;
        });
        self.postMessage(url);
        return await requestCache[url];
    }
    const getComplexType = function (schema, element) {
        var complexType;
        if (!element.children && element.attributes.type) {
            var type = element.attributes.type;
            complexType = schema.children.filter(function (node) { return node.tagName === "complexType" && node.attributes.name === removePreffix(type) });
        }
        else if (element.children && element.attributes.type) {
            var type = element.attributes.type;
            complexType = schema.children.filter(function (node) { return node.tagName === "complexType" && node.attributes.name === removePreffix(type) });
        }
        if (complexType.length > 0) {
            return complexType = complexType[0];
        }
        return null;
    }
    const processElement = async function (schema, element, depth, preffix) {
        if (depth === MAX_DEPTH) return null;
        //busco los includes
        schema = await proccessIncludes(schema);
        //busco los elements con el nombre de la capa en cuestión
        var currentElement = schema.children.filter(function (node) { return node.tagName === "element" && node.attributes.name === removePreffix(element) });

        if (currentElement.length > 0) {
            //si tiene un tipo compuesto lo busco				
            var complexType = getComplexType(schema, currentElement[0])
            collection[element] = await processType(schema, complexType, depth, preffix);
            return collection[element];
        }
        else {
            collection[element] = null;
            return null;
        }
    }
    const processType = async function (schema, complexType, depth, preffix) {

        if (!(complexType instanceof Object))
            complexType = schema.children.find(function (item) { return item.tagName === "complexType" && item.attributes.name === removePreffix(complexType) })
        if (!complexType) return null;
        //Recorro recursivamente buscando nodos element debajo del nodo complexType
        const elements = findByTagName(complexType, "element");
        var objFeature = {};
        //recorro los nodos element que son los atributos de la feature
        for (var j = 0; j < elements.length; j++) {
            let element = elements[j];
            let type = element.attributes.type;
            if (!element.attributes.name && element.attributes.ref) {
                let aux = {}, preffix = element.attributes.ref.substring(0, element.attributes.ref.indexOf(":"));
                aux[removePreffix(element.attributes.ref)] = { "type": await processElement(schema, element.attributes.ref, ++depth, preffix), "name": element.attributes.ref };
                return aux;
            }
            const nodeName = removePreffix(element.attributes.name);
            //declaro un objeto cuyo key es el nombre de la entidad y sus hijos los atributos
            let current = objFeature[nodeName] = {};

            //cada atributo será un objeto cuyo key será el nombre del atributo y dentro un objeto infromación de cada atribut como tipo si es nullable etc 
            for (var i in element.attributes) {
                switch (i) {
                    case "minOccurs":
                    case "maxOccurs":
                        current[i] = parseInt(element.attributes[i], 10);
                        if (isNaN(current[element.attributes[i]]))
                            current[i] = element.attributes[i];
                        break;
                    case "nillable":
                        current[i] = element.attributes[i] === "true" ? true : false;
                        break;
                    default:
                        current[i] = (preffix ? preffix + ":" : "") + element.attributes[i];
                        break;
                }
            }
            if (geometryTypes.includes(type)) { continue; }//no procesamos las geometrías
            if (type) {
                current["type"] = type;
                if (type.startsWith("xsd"))
                    type = removePreffix(type);
                if (type === "gml:ReferenceType") {
                    var targetElement = findByTagName(element, "targetElement");
                    if (targetElement.length > 0 && targetElement[0].children.length > 0) {
                        current["type"] = await getExternalType(schema, targetElement[0].children[0], depth);
                    }
                }
                else if (type.indexOf(":") > 0) {
                    complexType = schema.children.find(function (node) { return (node.tagName === "complexType" || node.tagName === "element") && node.attributes.name === removePreffix(type) })
                    if (!complexType)
                        current["type"] = await getExternalType(schema, type, depth);
                    else
                        if (complexType.tagName === "complexType")
                            current["type"] = await processType(schema, complexType, depth);
                        else
                            current["type"] = null;//Esto no se había dado hasta ahora;

                }
            }
            else {
                //si el atributo es un dato complejo
                var attrComplex = element.children.find((a) => a.tagName === "complexType");
                var extension = findByTagName(attrComplex, "extension")[0];
                var subelement = findByTagName(attrComplex, "element")[0]
                if (extension && extension.attributes.base) {
                    if (extension.attributes.base.indexOf(":") < 0)
                        current["type"] = extension.attributes.base;
                    else
                        current["type"] = await getExternalType(schema, extension.attributes.base);
                }
                if (subelement && subelement.attributes.ref) {
                    current["type"] = await getExternalType(schema, subelement.attributes.ref);
                }
            }
        }
        return objFeature;
    }

    const processDFT = async function (json, layerName, preffix) {
        //coger nodo esquema
        var schema = json.find(function (node) { return node.tagName === "schema" });
        return new Promise(async function (resolve) {
            await processElement(schema, layerName, 0);
            resolve();
        });
    }
    var collection = {};
    var proxifyPromises = null;
    var IncludesUsed = [];
    var MAX_DEPTH = 5;

    onmessage = async function (e) {
        if (e.data.xml) {
            var json = tXml(e.data.xml);

            const arrTypes = (e.data.layerName instanceof Array ? e.data.layerName : e.data.layerName.split(","));
            let result;
            try {
                for (var i = 0; i < arrTypes.length; i++) {
                    await processDFT(json, arrTypes[i]);
                }
                result = true;
            }
            catch (error) {
                result = false;
            }
            postMessage({
                state: result ? 'success' : 'error',
                DFTCollection: (e.data.layerName instanceof Array ? e.data.layerName : e.data.layerName.split(",")).reduce(function (vi, va) {
                    let temp = {};
                    temp[va] = (collection[va] || collection[va.replace(/^\w{1,}:/, function (a) { return (a.toLowerCase()) })]);
                    return Object.assign(vi, temp);
                }, {})
            });
        }
        else {
            functionsCallback[e.data.url](tXml(e.data.response)[0]);
            delete functionsCallback[e.data.url];
        }

    };

})();

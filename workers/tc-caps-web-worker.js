
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

    var out = null;
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

    var flattenOnlineResource = function (olr) {
        return olr.href;
    };

    var flattenLayerUrls = function (layer, tag) {
        if (Object.prototype.hasOwnProperty.call(layer, tag)) {
            var tagObj = layer[tag];
            var urls = tagObj.length ? tagObj : [tagObj];
            for (var i = 0, len = urls.length; i < len; i++) {
                var url = urls[i];
                url.OnlineResource = flattenOnlineResource(url.OnlineResource);
            }
            layer[tag] = urls;
        }
    };

    var processDCPType = function (node) {
        if (node) {
            var dcpts = node.DCPType.length ? node.DCPType : [node.DCPType];
            for (var i = 0, len = dcpts.length; i < len; i++) {
                var dcpt = dcpts[i];
                for (var protocol in dcpt) {
                    var dcptp = dcpt[protocol];
                    for (var verb in dcptp) {
                        var dcptpv = dcptp[verb];
                        dcptpv.OnlineResource = flattenOnlineResource(dcptpv.OnlineResource);
                    }
                }
            }
            node.DCPType = dcpts;
        }
    };

    var booleanValues = [false, true];
    var processWMSLayer = function processWMSLayer(layer, crsList) {
        // Transformamos booleanos
        if (Object.prototype.hasOwnProperty.call(layer, 'queryable')) {
            layer.queryable = booleanValues[layer.queryable];
        }
        var bbox;
        // Convertimos EX_GeographicBoundingBox a array
        if (Object.prototype.hasOwnProperty.call(layer, 'EX_GeographicBoundingBox')) {
            bbox = layer.EX_GeographicBoundingBox;
            layer.EX_GeographicBoundingBox = [
                parseFloat(bbox.westBoundLongitude),
                parseFloat(bbox.southBoundLatitude),
                parseFloat(bbox.eastBoundLongitude),
                parseFloat(bbox.northBoundLatitude)
            ]
        }
        // Convertimos BoundingBox a array
        if (Object.prototype.hasOwnProperty.call(layer, 'BoundingBox')) {
            bbox = layer.BoundingBox;
            bbox = layer.BoundingBox.length ? layer.BoundingBox : [layer.BoundingBox];
            layer.BoundingBox = bbox.map(function (elm) {
                return {
                    crs: elm.CRS || elm.SRS,
                    extent: [
                        parseFloat(elm.minx),
                        parseFloat(elm.miny),
                        parseFloat(elm.maxx),
                        parseFloat(elm.maxy)
                    ],
                    res: new Array(2)
                }
            });
        }
        // Convertimos OnlineResource a string
        if (Object.prototype.hasOwnProperty.call(layer, 'Attribution') && layer.Attribution.OnlineResource) {
            layer.Attribution.OnlineResource = flattenOnlineResource(layer.Attribution.OnlineResource);
        }
        flattenLayerUrls(layer, 'AuthorityURL');
        flattenLayerUrls(layer, 'MetadataURL');
        // Convertimos Style a array
        if (layer.Style) {
            if (!layer.Style.length) {
                layer.Style = [layer.Style];
            }
            // Convertimos OnlineResource a string
            for (var i = 0, len = layer.Style.length; i < len; i++) {
                flattenLayerUrls(layer.Style[i], 'LegendURL');
            }
        }
        // Hacemos heredar la lista de CRS
        var newCrsList = typeof layer.CRS === 'string' ? [layer.CRS] : layer.CRS;
        if (crsList) {
            if (layer.CRS) {
                layer.CRS = newCrsList.concat(crsList);
            }
        }
        if (layer.Layer) {
            var children = layer.Layer[1] ? layer.Layer : [layer.Layer];
            layer.Layer = children;
            for (const child of children) {
                child.parent = layer;
                processWMSLayer(child, newCrsList);
            }
        }
    };

    var cornerSeparator = ' ';
    var parseCorner = function (cornerString) {
        return cornerString.split(cornerSeparator).map(function (elm) {
            return parseFloat(elm);
        });
    };

    var processWMTSLayers = function (contents) {
        if (!contents.Layer.length) {
            contents.Layer = [contents.Layer];
        }
        var layers = contents.Layer;
        for (var i = 0, len = layers.length; i < len; i++) {
            var layer = layers[i];
            if (typeof layer.Format === 'string') {
                layer.Format = [layer.Format];
            }
            if (layer.ResourceURL && !layer.ResourceURL.length) {
                layer.ResourceURL = [layer.ResourceURL];
            }
            if (layer.Style && !Array.isArray(layer.Style)) {
                layer.Style = [layer.Style];
            }
            if (!layer.TileMatrixSetLink.length) {
                layer.TileMatrixSetLink = [layer.TileMatrixSetLink];
            }
            for (var j = 0, lenj = layer.TileMatrixSetLink.length; j < lenj; j++) {
                var tmsl = layer.TileMatrixSetLink[j];
                if (tmsl.TileMatrixSetLimits) {
                    tmsl.TileMatrixSetLimits = tmsl.TileMatrixSetLimits.TileMatrixLimits;
                    for (var k = 0, lenk = tmsl.TileMatrixSetLimits.length; k < lenk; k++) {
                        var tmslm = tmsl.TileMatrixSetLimits[k];
                        tmslm.MaxTileCol = parseInt(tmslm.MaxTileCol);
                        tmslm.MaxTileRow = parseInt(tmslm.MaxTileRow);
                        tmslm.MinTileCol = parseInt(tmslm.MinTileCol);
                        tmslm.MinTileRow = parseInt(tmslm.MinTileRow);
                    }
                }
            }
            if (layer.WGS84BoundingBox) {
                var lowerCorner = parseCorner(layer.WGS84BoundingBox.LowerCorner);
                var upperCorner = parseCorner(layer.WGS84BoundingBox.UpperCorner);
                layer.WGS84BoundingBox = [
                    lowerCorner[0],
                    lowerCorner[1],
                    upperCorner[0],
                    upperCorner[1]
                ];
            }
        }
    };

    var processTMS = function (contents) {
        if (!contents.TileMatrixSet.length) {
            contents.TileMatrixSet = [contents.TileMatrixSet];
        }
        var tileMatrixSets = contents.TileMatrixSet;
        tileMatrixSets.forEach(function (tileMatrixSet) {
            tileMatrixSet.SupportedCRS = tileMatrixSet.SupportedCRS.trim();
            if (tileMatrixSet.BoundingBox) {
                var lowerCorner = parseCorner(tileMatrixSet.BoundingBox.LowerCorner);
                var upperCorner = parseCorner(tileMatrixSet.BoundingBox.UpperCorner);
                tileMatrixSet.BoundingBox = [
                    lowerCorner[0],
                    lowerCorner[1],
                    upperCorner[0],
                    upperCorner[1]
                ];
            }
            tileMatrixSet.TileMatrix.forEach(function (tileMatrix) {
                tileMatrix.MatrixHeight = parseInt(tileMatrix.MatrixHeight);
                tileMatrix.MatrixWidth = parseInt(tileMatrix.MatrixWidth);
                tileMatrix.TileHeight = parseInt(tileMatrix.TileHeight);
                tileMatrix.TileWidth = parseInt(tileMatrix.TileWidth);
                tileMatrix.ScaleDenominator = parseFloat(tileMatrix.ScaleDenominator);
                tileMatrix.TopLeftCorner = parseCorner(tileMatrix.TopLeftCorner);
            });
        });
    };

    var processDCPVerb = function (dcpVerb) {
        var verbs = dcpVerb.length ? dcpVerb : [dcpVerb];
        var result = new Array(verbs.length);
        for (var i = 0, len = verbs.length; i < len; i++) {
            var verb = verbs[i];
            if (!verb.Constraint.length) {
                verb.Constraint = [verb.Constraint];
                for (var j = 0, lenj = verb.Constraint.length; j < lenj; j++) {
                    var allowedValues = verb.Constraint[j].AllowedValues;
                    if (typeof allowedValues.Value === 'string') {
                        allowedValues.Value = [allowedValues.Value];
                    }
                }
            }
            result[i] = {
                Constraint: verb.Constraint,
                href: verb.href
            };
        }
        return result;
    };

    var processOM = function (om) {
        var operations = om.Operation.length ? om.Operation : [om.Operation];
        for (var i = 0, len = operations.length; i < len; i++) {
            var operation = operations[i];
            for (var protocol in operation.DCP) {
                var protocolProp = operation.DCP[protocol];
                for (var verb in protocolProp) {
                    protocolProp[verb] = processDCPVerb(protocolProp[verb]);
                }
            }
            om[operation.name] = {
                DCP: operation.DCP
            }
        }
        delete om.Operation;
    };

    var wfsParser = function () {
        var keys = ["name", "Name"],
            parameters = ["Parameter", "Constraint"],
            a2o = function (a) {
                return a.reduce(function (result, item, index) {
                    if (keys.some(k => { return Object.prototype.hasOwnProperty.call(item, k); })) {
                        var key = keys.find(k => { return Object.prototype.hasOwnProperty.call(item, k); });
                        var objName = (item[key].substring(item[key].indexOf(":") + 1));
                        delete item[key];
                        result[objName] = Object.prototype.hasOwnProperty.call(item, "AllowedValues") && item.AllowedValues.Value || item
                        return result;
                    }
                    else {
                        return (index === 0 ? [] : result).concat(item);
                    }
                }, {});
            },
            pp = function (p) {
                var o = {};
                if (p instanceof Array) {
                    o = a2o(p);
                }
                else {
                    o = Object.prototype.hasOwnProperty.call(p, "AllowedValues") &&
                        p.AllowedValues.Value && keys.find(k => { return Object.prototype.hasOwnProperty.call(p, k) }) &&
                        (o[p[keys.find(k => { return Object.prototype.hasOwnProperty.call(p, k) })]] = p.AllowedValues.Value) && o || p
                }
                return o;

            },
            e = {
                V1_0_0: "1.0.0",
                V1_1_0: "1.1.0",
                V2_0_0: "2.0.0"
            },
            r = function () {
                var r, n = [],
                    u = [],
                    p = [],
                    capabilites = arguments[0];
                switch (capabilites.version) {
                    case e.V1_0_0:
                        r = e.V1_0_0;
                        break;
                    case e.V1_1_0:
                        r = e.V1_1_0;
                        break;
                    case e.V2_0_0:
                        r = e.V2_0_0
                }
                n = t(capabilites, r), u = a(capabilites, r), p = i(capabilites, r);
                var o = s(capabilites, r),
                    l = {
                        Operations: n,
                        FeatureTypes: u,
                        Filters: p
                    };
                return Object.assign(l, o), l
            },
            t = function (r, t) {
                switch (t) {
                    case e.V1_0_0:
                        var a = r.Capability.Request;
                        if (a.GetFeature) {
                            var i = [];
                            for (var s in a.GetFeature.ResultFormat) i.push(s.toLowerCase());
                            a.GetFeature.outputFormat = i, delete a.GetFeature.ResultFormat, a.GetFeature.Operations = r.FeatureTypeList.Operations
                        }
                        return a;
                    case e.V1_1_0:
                        return {};
                    case e.V2_0_0:
                        var n = {};
                        for (var s in r.OperationsMetadata) {
                            var u = {};
                            if (!(r.OperationsMetadata[s] instanceof Array)) continue;
                            u[s] = a2o(r.OperationsMetadata[s]);
                            for (var p in u[s]) {
                                u[s][p] = ((o) => {
                                    var r = {};
                                    if (o instanceof Array)
                                        return a2o(o);
                                    for (var k in o) {
                                        if (parameters.find((i) => { return k === i })) {
                                            r = Object.assign(r, pp(o[parameters.find((i) => { return k === i })]));
                                        }
                                        else
                                            r[k] = o[k];
                                    } return r;
                                })(u[s][p]);
                            }
                            n = Object.assign(n, u[s]);
                        }
                        return n
                }
                return null
            },
            a = function (r, t) {
                switch (t) {
                    case e.V1_0_0:
                        r.FeatureTypeList.FeatureType = (r.FeatureTypeList.FeatureType instanceof Array) ? r.FeatureTypeList.FeatureType : [r.FeatureTypeList.FeatureType];
                        for (var a = {}, i = 0; i < r.FeatureTypeList.FeatureType.length; i++) {
                            var s = r.FeatureTypeList.FeatureType[i].Name;
                            a[s.substring(s.indexOf(":") + 1)] = r.FeatureTypeList.FeatureType[i]
                        }
                        return a;
                    case e.V1_1_0:
                        return {};
                    case e.V2_0_0:
                        r.FeatureTypeList.FeatureType = (r.FeatureTypeList.FeatureType instanceof Array) ? r.FeatureTypeList.FeatureType : [r.FeatureTypeList.FeatureType];
                        for (var a = {}, i = 0; i < r.FeatureTypeList.FeatureType.length; i++) {
                            var s = r.FeatureTypeList.FeatureType[i].Name;
                            a[s.substring(s.indexOf(":") + 1)] = r.FeatureTypeList.FeatureType[i]
                        }
                        return a
                }
                return null
            },
            i = function (r, t) {
                switch (t) {
                    case e.V1_0_0:
                        return r.Filter_Capabilities;
                    case e.V1_1_0:
                        return {};
                    case e.V2_0_0:
                        var a = r.Filter_Capabilities;
                        return a
                }
                return null
            },
            s = function (r, t) {
                switch (t) {
                    case e.V1_0_0:
                        var a = {};
                        for (var i in r) "string" == typeof r[i] && (a[i] = r[i]);
                        return a;
                    case e.V1_1_0:
                        return {};
                    case e.V2_0_0:
                        var a = {};
                        for (var i in r) "string" == typeof r[i] && (a[i] = r[i]);
                        return a
                }
                return {}
            }
        return {
            Parse: r
        }
    }();

    var postprocessWMS = function (xml) {
        var capabilities = xml.WMS_Capabilities || (xml['?xml'] && (xml['?xml'].WMS_Capabilities || xml['?xml'].WMT_MS_Capabilities));
        if (capabilities) {
            processWMSLayer(capabilities.Capability.Layer);
            var request = capabilities.Capability.Request;
            processDCPType(request.GetMap);
            if (request.GetFeatureInfo) {
                request.GetFeatureInfo.Format = typeof request.GetFeatureInfo.Format === 'string' ? [request.GetFeatureInfo.Format] : request.GetFeatureInfo.Format;
            }
        }
        return capabilities;
    };

    var postprocessWMTS = function (xml) {
        var capabilities = xml['?xml'] && xml['?xml'].Capabilities;
        if (capabilities) {
            processWMTSLayers(capabilities.Contents);
            processTMS(capabilities.Contents);
            processOM(capabilities.OperationsMetadata);
        }
        return capabilities;
    };
    var postprocessWFS = function (xml) {
        var capabilities = xml.WFS_Capabilities || (xml['?xml'] && (xml['?xml'].WFS_Capabilities));
        if (capabilities) {
            capabilities = wfsParser.Parse(capabilities);
            //añadir prefijo a los atributos simples y pue empiecen por http
            for (var attr in capabilities) {
                if (typeof (capabilities[attr]) === "string" && capabilities[attr].indexOf("http") === 0) {
                    capabilities["xmlns:" + attr] = capabilities[attr];
                    delete capabilities[attr];
                }
            }
            delete capabilities.updateSequence;
        }
        return capabilities;
    };

    onmessage = function (e) {

        //if (e.data.url)
        //    this.importScripts(e.data.url + 'TC/workers/tXml.js');
        //else
        //    this.importScripts('tXml.js');
        var xml = simplify(tXml(e.data.text));
        var capabilities;
        switch (e.data.type) {
            case "WMS":
                capabilities = postprocessWMS(xml);
                break;
            case "WMTS":
                capabilities = postprocessWMTS(xml);
                break;
            case "WFS":
                capabilities = postprocessWFS(xml);
                break;
        }
        postMessage({
            state: capabilities ? 'success' : 'error',
            capabilities: capabilities
        });
    };

})();

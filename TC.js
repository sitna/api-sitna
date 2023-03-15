import loadjs from 'loadjs';
import proj4 from 'proj4';

var TC = TC || {};

(function () {
    if (!TC.apiLocation) {
        var script;
        if (document.currentScript) {
            script = document.currentScript;
        }
        else {
            var scripts = document.getElementsByTagName('script');
            script = scripts[scripts.length - 1];
        }
        var src = script.getAttribute('src');
        TC.apiLocation = src.substr(0, src.lastIndexOf('/') + 1);
    }
})();

TC.control = {};
TC.capabilities = {};
TC.capabilitiesWFS = {};
TC.describeFeatureType = {};
TC.tool = {};

TC.cache = {};

if (typeof TC.isDebug !== "boolean") {
    TC.isDebug = true;
}

TC.alert = function (text) {
    alert(text);
};

TC.prompt = function (text, value, callback) {
    var newValue = prompt(text, value);
    if (TC.Util.isFunction(callback)) {
        callback(newValue);
    }
};

TC.confirm = function (text, accept, cancel) {
    if (confirm(text)) {
        if (TC.Util.isFunction(accept)) {
            accept();
        }
    }
    else {
        if (TC.Util.isFunction(cancel)) {
            cancel();
        }
    }
};

TC.error = function (text) {
    if (window.console) {
        console.error(text);
    }
};

/* 
 * proxify: returns cross-origin safe URL
 */
TC.proxify = function (url) {
    url = url.trim();
    var result = url;
    const cfgProxy = window.TC.Cfg.proxy;
    if (cfgProxy) {
        var prevent = false;
        const cfgProxyExceptions = window.TC.Cfg.proxyExceptions;
        if (cfgProxyExceptions) {
            for (var i = 0; i < cfgProxyExceptions.length; i++) {
                if (url.indexOf(cfgProxyExceptions[i]) > -1) {
                    prevent = true;
                    break;
                }
            }
        }

        if (!prevent && !TC.Util.isSameOrigin(url)) {
            if (typeof cfgProxy === "function") {
                result = cfgProxy(url);
            } else {
                result = cfgProxy;
                if (url.substr(0, 4) !== "http") result += window.location.protocol;
                result += encodeURIComponent(url);
            }
        }
    }
    return result;
};

const getHead = function () {
    var result;
    var d = document;
    var ah = d.getElementsByTagName("head");
    if (ah.length === 0) {
        result = d.createElement("head");
        d.documentElement.insertBefore(result, document.body);
    }
    else {
        result = ah[0];
    }
    return result;
};

var _showLoadFailedError = function (url) {
    let stack = "";
    try {
        throw new Error();
    } catch (error) {
        stack = error && error.stack ? error.stack : error.toString();
    }

    const mapObj = TC.Map.get(document.querySelector('.' + SITNA.Consts.classes.MAP));
    const subject = "Error al cargar " + url;
    const body = TC.Util.getLocaleString(mapObj ? mapObj.options.locale : 'es-ES', "urlFailedToLoad", { url: url });

    // tostada sin la pila
    TC.error(
        body,
        [SITNA.Consts.msgErrorMode.TOAST],
        subject);
    // email con pila
    TC.error(
        `${body}. Pila de la llamada al recurso: 
${stack && stack.length > 0 ? stack : ""}`,
        [SITNA.Consts.msgErrorMode.EMAIL],
        subject);
};

TC.syncLoadJS = function (url) {
    var _sendRequest = function (url, callbackErrorFn) {
        var req = new XMLHttpRequest();
        req.open("GET", url, false); // 'false': synchronous.
        var result;

        req.onreadystatechange = function (_e) {
            if (req.readyState === 4) {
                if (req.status === 404) {
                    result = false;
                    callbackErrorFn(true);
                } else if (req.status !== 200) {
                    callbackErrorFn();
                    result = false;
                } else {
                    result = req.responseText;
                }
            }
        };


        try {
            req.send(null);
        } catch (error) {
            result = false;
            callbackErrorFn();
        }

        return result;
    };

    if (!/(\.js|\/)$/i.test(url)) { // Si pedimos un archivo sin extensión se la ponemos según el entorno
        url = url + (TC.isDebug ? '.js' : '.min.js');
    }

    var reqResult = _sendRequest(url, function (is404) {
        if (is404) {
            _showLoadFailedError(url);
            return false;
        } else {
            return _sendRequest(url, function () {
                _showLoadFailedError(url);
            });
        }
    });

    if (reqResult) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.text = reqResult;
        getHead().appendChild(script);
    }
};

TC.loadJSInOrder = function (condition, url, callback) {
    return TC.loadJS(condition, url, callback, true);
};

const addCrossOriginAttr = function (path, scriptEl) {
    if (!TC.Util.isSameOrigin(path)) {
        scriptEl.crossOrigin = "anonymous";
    }
};

TC.loadJS = function (condition, url, callback, inOrder=false, notCrossOrigin) {
    return new Promise(function (resolve, _reject) {
        const endFn = function () {
            if (TC.Util.isFunction(callback)) {
                callback();
            }
            resolve();
        };

        var urls = Array.isArray(url) ? url : [url];
        urls = urls.map(function (elm) {
            if (!/\.js$/i.test(elm) && elm.indexOf(TC.apiLocation) === 0) { // Si pedimos un archivo sin extensión y es nuestro se la ponemos según el entorno
                return elm + (TC.isDebug ? '.js' : '.min.js');
            }
            return elm;
        });

        if (condition) {
            urls = urls instanceof Array ? urls : [urls];

            var name = "";
            const getName = function (path) {
                return path.split('/').reverse().slice(0, 2).reverse().join('_').toLowerCase();
            };
            if (urls.length > 1) {
                var toReduce = urls.slice(0).filter(function (path, index) {
                    if (loadjs.isDefined(getName(path))) {
                        urls.splice(index, 1);
                        loadjs.ready(getName(path), endFn);
                        return false;
                    } else {
                        return true;
                    }
                });
                if (toReduce.length === 1) {
                    name = getName(toReduce[0]);
                } else if (toReduce.length > 0) {
                    name = toReduce.reduce(function (prev, curr) {
                        return getName(prev) + "_" + getName(curr);
                    });
                }
            } else {
                name = getName(urls[0]);
            }

            if (name.length > 0) {
                if (!loadjs.isDefined(name)) {
                    var options = {
                        async: !inOrder,
                        numRetries: 1
                    };

                    if (!notCrossOrigin && !TC.Util.detectIE()) {
                        options.before = addCrossOriginAttr;
                    }

                    loadjs(urls, name, options);
                    loadjs.ready(name, {
                        success: function () {
                            endFn();
                        },
                        error: function (pathsNotFound) {
                            _showLoadFailedError(pathsNotFound);
                        }
                    });
                } else {
                    // Esto vuelve a añadir el script al head si se está pidiendo un script cargado previamente.
                    //urls.forEach(function (url) {
                    //    const urlObj = new URL(url, location.href);
                    //    const script = Array.from(document.scripts).filter((scr) => scr.src === urlObj.href)[0];
                    //    if (script) {
                    //        document.head.appendChild(script.cloneNode());
                    //    }
                    //});
                    loadjs.ready(name, endFn);
                }
            }
        }
        else {
            endFn();
        }
    });
};

TC.loadCSS = function (url) {
    const getName = function (path) {
        return path.split('/').reverse().slice(0, 2).reverse().join('_').toLowerCase();
    };

    const name = getName(url);
    if (!loadjs.isDefined(name)) {
        loadjs(url, name, {
            error: function (pathsNotFound) {
                _showLoadFailedError(pathsNotFound);
            },
            numRetries: 1
        });
    } else {
        loadjs.ready(name, {});
    }
};

// Transformación de petición AJAX de jQuery a promesa nativa
TC.ajax = function (options) {
    return new Promise(function (resolve, reject) {
        options = options || {};
        const method = options.method || 'GET';
        const isGET = method === 'GET';
        var data;
        if (options.data) {
            if (typeof options.data === 'string') {
                data = options.data;
            }
            else if (typeof options.data === 'object') {
                if (isGET && (options.contentType || typeof options.contentType === 'boolean')) {
                    data = TC.Util.getParamString(options.data);
                } else {
                    const paramArray = [];
                    for (var key in options.data) {
                        paramArray.push(key + '=' + options.data[key].toString());
                    }
                    data = paramArray.join('&');
                }
            }
        }
        var url = options.url;
        if (isGET && data) {
            url = url + '?' + data;
        }
        if (options.cache === false) {
            url += (url.indexOf('?') < 0 ? '?' : '&') + 'ts=' + Date.now();
        }

        const fetchOptions = {
            method: method,
            headers: new Headers()
        };
        if (options.contentType || typeof options.contentType === 'boolean') {
            if (options.contentType) {
                fetchOptions.headers.append('Content-Type', options.contentType + '; charset=UTF-8');
            }
        }
        else {
            fetchOptions.headers.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        }
        if (method === 'POST') {
            fetchOptions.body = data;
        }

        fetch(url, fetchOptions)
            .then(async response => {
                if (response.ok) {
                    try {
                        let responseData;
                        switch (options.responseType) {
                            case SITNA.Consts.mimeType.JSON:
                                //URI: Compruebo que la respuesta no es un XML de excepción
                                responseData = await response.json();
                                break;
                            case SITNA.Consts.mimeType.XML:
                                responseData = await response.text();
                                responseData = new DOMParser().parseFromString(responseData, 'application/xml');
                                break;
                            default:
                                responseData = await response.text();
                                break;
                        }
                        resolve({ data: responseData, contentType: response.headers.get("Content-type") });
                    }
                    catch (error) {
                        reject(error);
                    }
                }
                else {
                    reject({
                        status: response.status,
                        msg: response.statusText,
                        url: url
                    });
                }
            })
            .catch(err => reject(err));
    });
};

var projectionDataCache = {};

TC.getProjectionData = async function (options) {
    options = options || {};
    const crs = options.crs || '';
    const match = crs.match(/\d{4,5}$/g);
    let code = match ? match[0] : '';
    const url = SITNA.Consts.url.EPSG + '?format=json&q=' + code;
    let projData = projectionDataCache[code];
    if (projData) {
        if (options.sync) {
            return projData;
        }
        return Promise.resolve(projData);
    }
    if (options.sync) {
        let result;
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (_e) {
            if (xhr.readyState == 4) {
                if (xhr.status == 404) {
                    result = false;
                } else if (xhr.status != 200) {
                    result = false;
                } else {
                    result = xhr.responseText;
                }
            }
        };
        xhr.open('GET', url, false);

        try {
            xhr.send(null);
        } catch (error) {
            result = false;
        }
        if (result) {
            result = JSON.parse(result);
        }
        return result;
    }

    if (!TC.tool.Proxification) {
        TC.tool.Proxification = (await import('./TC/tool/Proxification')).default;
    }

    const proxificationTool = new TC.tool.Proxification(TC.proxify);
    const data = await proxificationTool.fetchJSON(url, options);
    projectionDataCache[code] = data;
    return data;
};

TC.loadProjDef = function (options) {
    options = options || {};
    const crs = options.crs;
    const epsgPrefix = 'EPSG:';
    const urnPrefix = 'urn:ogc:def:crs:EPSG::';
    const urnxPrefix = 'urn:x-ogc:def:crs:EPSG:';
    const ogcHttpUrlPrefix = 'http://www.opengis.net/gml/srs/epsg.xml#';
    const ogcHttpUriPrefix = 'http://www.opengis.net/def/crs/EPSG/0/';

    const fromHTTPURIToURN = function (name) {
        var match = /http:\/\/www\.opengis\.net\/def\/crs\/EPSG\/\d\/(\d{4,5})/.exec(name);
        if (match && match.length === 2) {
            return urnPrefix + match[1];
        }

        return name;
    };

    var getDef;
    getDef = function (name) {
        name = fromHTTPURIToURN(name);
        return proj4.defs(name);
    };
    const isFunction = function (obj) {
        return typeof obj === 'function';
    };
    const loadDef = function (code, def, name) {
        // Lista sacada de https://docs.geoserver.org/stable/en/user/services/wfs/webadmin.html#gml
        const epsgCode = epsgPrefix + code;
        const urnCode = urnPrefix + code;
        const urnxCode = urnxPrefix + code;
        const ogcHttpUrlCode = ogcHttpUrlPrefix + code;
        const ogcHttpUriCode = ogcHttpUriPrefix + code;
        var axisUnawareDef;
        if (typeof def === 'object') {
            axisUnawareDef = TC.Util.extend({}, def);
            def = TC.Util.extend({}, def);
            if (axisUnawareDef.axis) {
                delete axisUnawareDef.axis;
            }
        }
        else if (typeof def === 'string') {
            axisUnawareDef = def.replace('+axis=neu', '');
        }
        proj4.defs(epsgCode, def);
        proj4.defs(urnCode, def);
        proj4.defs(urnxCode, def);
        // Por convención, los CRS definidos por URL siempre tienen orden de coordenadas X-Y.
        proj4.defs(ogcHttpUrlCode, axisUnawareDef);
        proj4.defs(ogcHttpUriCode, def);
        if (crs.indexOf(ogcHttpUrlPrefix) === 0) {
            // El CRS es tipo URL, usado seguramente en un GML.
            proj4.defs(crs, axisUnawareDef);
            getDef(crs).name = name;
        }
        if (window.ol && ol.proj && !options.silent) {
            // https://openlayers.org/en/latest/apidoc/module-ol_proj_proj4.html
            ol.proj.proj4.register(proj4);
        }
        getDef(epsgCode).name = name;
        getDef(ogcHttpUrlCode).name = name;
        getDef(ogcHttpUriCode).name = name;
    };
    const loadDefResponse = function (data) {
        const result = data && data.status === 'ok' && data.number_result === 1;
        if (result) {
            var def = data.results[0];
            loadDef(def.code, def.proj4, def.name);
        }
        return result;
    };

    var idx = crs.lastIndexOf('#');
    if (idx < 0) {
        idx = crs.lastIndexOf('/');
    }
    if (idx < 0) {
        idx = crs.lastIndexOf(':');
    }
    var code = crs.substr(idx + 1);
    var def = getDef(crs);
    if (def) {
        loadDef(code, def, options.name);
        if (isFunction(options.callback)) {
            options.callback();
        }
    }
    else {
        if (options.def) {
            loadDef(code, options.def, options.name);
            if (isFunction(options.callback)) {
                options.callback();
            }
        }
        else {
            const loadDataAndExecCallback = function (data) {
                if (loadDefResponse(data) && isFunction(options.callback)) {
                    options.callback();
                }
            };
            if (options.sync) {
                const data = TC.getProjectionData(options);
                loadDataAndExecCallback(data);
            }
            else {
                TC.getProjectionData(options).then(loadDataAndExecCallback).catch(e => console.error(e));
            }
        }
    }
};

TC.inherit = function (childCtor, parentCtor) {
    childCtor.prototype = Object.create(parentCtor.prototype);
    childCtor.prototype.constructor = childCtor;
    childCtor._super = parentCtor.prototype;
};

TC.mix = function (targetCtor, ...mixins) {
    Object.assign(targetCtor.prototype, ...mixins);
};

const uids = new Map();
TC.getUID = function (options) {
    const opts = options || {};
    const prefix = opts.prefix || '';
    let value = uids.get(prefix);
    if (!value) {
        value = 1;
    }
    var result = prefix + value;
    uids.set(prefix, value + 1);
    if (opts.banlist && opts.banlist.includes(result)) {
        return TC.getUID(options);
    }
    return result;
};

TC.setUIDStart = function (count, options) {
    const opts = options || {};
    const prefix = opts.prefix || '';
    let currentValue = uids.get(prefix);
    if (!currentValue) {
        currentValue = 1;
    }
    if (count > currentValue) {
        uids.set(prefix, count);
        return count;
    }
    return currentValue;
};

const prefixes = ['', '-webkit-', '-moz-', '-o-', '-ms-'];
const randomText = ':-)';
const urlString = 'http://sitna.tracasa.es/';
var touch;
var inputTypeColor;
var urlParser;
const browserFeatures = {
    touch: function () {
        if (touch === undefined) {
            if (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch) {
                touch = true;
                return true;
            }
            const query = prefixes
                .map(function (prefix) { return '(' + prefix + 'touch-enabled)'; })
                .join();
            touch = matchMedia(query).matches;
        }
        return touch;
    },
    inputTypeColor: function () {
        if (inputTypeColor === undefined) {
            const elm = document.createElement('input');
            elm.setAttribute('type', 'color');
            inputTypeColor = elm.type !== 'text' && 'style' in elm;
            if (inputTypeColor) {
                elm.value = randomText;
                inputTypeColor = elm.value !== randomText;
            }
        }
        return inputTypeColor;
    },
    urlParser: function () {
        if (urlParser === undefined) {
            try {
                // have to actually try use it, because Safari defines a dud constructor
                const url = new URL(urlString);
                urlParser = url.href === urlString;
            } catch (e) {
                urlParser = false;
            }
        }
        return urlParser;
    }
};
TC.browserFeatures = browserFeatures;

const pluses = /\+/g;
function raw(s) {
    return s;
}
function decoded(s) {
    return decodeURIComponent(s.replace(pluses, ' '));
}

TC.cookie = function (key, value, options) {

    // key and at least value given, set cookie...
    if (arguments.length > 1 && (!/Object/.test(Object.prototype.toString.call(value)) || value === null)) {
        options = TC.Util.extend({}, options);

        if (value === null) {
            options.expires = -1;
        }

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setDate(t.getDate() + days);
        }

        value = String(value);

        return (document.cookie = [
            encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
            options.expires ? ';expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            options.path ? ';path=' + options.path : '',
            options.domain ? ';domain=' + options.domain : '',
            options.secure ? ';secure' : ''
        ].join(''));
    }

    // key and possibly options given, get cookie...
    options = value || {};
    var decode = options.raw ? raw : decoded;
    var cookies = document.cookie.split('; ');
    for (var i = 0, parts; (parts = cookies[i] && cookies[i].split('=')); i++) {
        if (decode(parts.shift()) === key) {
            return decode(parts.join('='));
        }
    }
    return null;
};

export default TC;
export { browserFeatures };
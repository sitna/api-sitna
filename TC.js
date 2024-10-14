import Consts from './TC/Consts';
import loadjs from 'loadjs';
import proj4 from 'proj4';

var TC = TC || {};

(function () {
    if (!TC.apiLocation) {
        if (typeof SITNA_BASE_URL !== "undefined") {
            // Obtenemos la URL base de la configuración SITNA_BASE_URL (necesario para usar como paquete npm)
            TC.apiLocation = SITNA_BASE_URL;
            if (!TC.apiLocation.endsWith('/')) {
                TC.apiLocation = TC.apiLocation + '/';
            }
        }
        else {
            // Obtenemos la URL base de la dirección del script
            const script = document.currentScript;
            const src = script.getAttribute('src');
            TC.apiLocation = src.substr(0, src.lastIndexOf('/') + 1);
            globalThis.SITNA_BASE_URL = TC.apiLocation;
        }
    }
})();

TC.control = {};
TC.capabilities = {};
TC.capabilitiesWFS = {};
TC.featureTypeDescriptions = {};
TC.legendFormat = {};
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
    const result = confirm(text);
    if (result) {
        if (TC.Util.isFunction(accept)) {
            accept();
        }
    }
    else {
        if (TC.Util.isFunction(cancel)) {
            cancel();
        }
    }
    return result;
};

TC.error = function (err) {
    const text = err.message ?? err;
    if (window.console) {
        if (err instanceof Error) {
            console.error(err);
        }
        else {
            console.error(text);
        }
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

    const mapObj = TC.Map.get(document.querySelector('.' + Consts.classes.MAP));
    const subject = "Error al cargar " + url;
    const body = TC.Util.getLocaleString(mapObj ? mapObj.options.locale : 'es-ES', "urlFailedToLoad", { url: url });

    // tostada sin la pila
    TC.error(
        body,
        [Consts.msgErrorMode.TOAST],
        subject);
    // email con pila
    TC.error(
        `${body}. Pila de la llamada al recurso: 
${stack && stack.length > 0 ? stack : ""}`,
        [Consts.msgErrorMode.EMAIL],
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

TC.loadJS = function (condition, url, callback, inOrder = false, notCrossOrigin) {
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
TC.ajax = function (options = {}) {
    return new Promise(function (resolve, reject) {
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
                            case Consts.mimeType.JSON:
                                //URI: Compruebo que la respuesta no es un XML de excepción
                                responseData = await response.json();
                                break;
                            case Consts.mimeType.XML:
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

const projectionDataCache = {
    // Precargamos los códigos más usados
    '25830': {
        accuracy: 1.0,
        area: "Europe between 6°W and 0°W: Faroe Islands offshore; Ireland - offshore; Jan Mayen - offshore; Norway including Svalbard - offshore; Spain - onshore and offshore.",
        authority: "EPSG",
        bbox: [
            80.49,
            -6.0,
            35.26,
            0.01
        ],
        code: "25830",
        default_trans: 1149,
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 30N",
        proj4: "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1149,
            1571,
            7913,
            7952,
            7953,
            8365,
            8442,
            9365,
            9369,
            9386,
            9454,
            9740,
            9759,
            9764,
            9867,
            9878,
            9941,
            9965,
            9970,
            9975,
            10108,
            15959
        ],
        unit: "metre",
        wkt: "PROJCS[\"ETRS89 / UTM zone 30N\",GEOGCS[\"ETRS89\",DATUM[\"European_Terrestrial_Reference_System_1989\",SPHEROID[\"GRS 1980\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"7019\"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY[\"EPSG\",\"6258\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4258\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-3],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"25830\"]]"
    },
    '4326': {
        accuracy: "",
        area: "World.",
        authority: "EPSG",
        bbox: [
            90.0,
            -180.0,
            -90.0,
            180.0
        ],
        code: "4326",
        default_trans: 0,
        kind: "CRS-GEOGCRS",
        name: "WGS 84",
        proj4: "+proj=longlat +datum=WGS84 +no_defs +type=crs",
        trans: [
            3858,
            3859,
            8037,
            9618,
            9704,
            9706,
            9708,
            10084,
            15781
        ],
        unit: "degree (supplier to define representation)",
        wkt: "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]"
    },
    '4258': {
        accuracy: "",
        area: "Europe - onshore and offshore: Albania; Andorra; Austria; Belgium; Bosnia and Herzegovina; Bulgaria; Croatia; Cyprus; Czechia; Denmark; Estonia; Faroe Islands; Finland; France; Germany; Gibraltar; Greece; Hungary; Ireland; Italy; Kosovo; Latvia; Liechtenstein; Lithuania; Luxembourg; Malta; Moldova; Monaco; Montenegro; Netherlands; North Macedonia; Norway including Svalbard and Jan Mayen; Poland; Portugal; Romania; San Marino; Serbia; Slovakia; Slovenia; Spain; Sweden; Switzerland; United Kingdom (UK) including Channel Islands and Isle of Man; Vatican City State.",
        authority: "EPSG",
        bbox: [
            84.73,
            -16.1,
            32.88,
            40.18
        ],
        code: "4258",
        default_trans: 0,
        kind: "CRS-GEOGCRS",
        name: "ETRS89",
        proj4: "+proj=longlat +ellps=GRS80 +no_defs +type=crs",
        trans: [
            5334,
            5335,
            7001,
            7711,
            7712,
            7713,
            7714,
            7715,
            7716,
            7717,
            7718,
            7719,
            7958,
            7959,
            8361,
            8362,
            9276,
            9278,
            9283,
            9304,
            9410,
            9411,
            9412,
            9413,
            9414,
            9484,
            9485,
            9499,
            9584,
            9585,
            9586,
            9587,
            9588,
            9589,
            9590,
            9591,
            9592,
            9593,
            9594,
            9597,
            9600,
            9605,
            9606,
            9607,
            9608,
            9609,
            9727,
            9728,
            9729,
            9730,
            9731,
            9750,
            9884,
            9885,
            9908,
            9909,
            9914,
            9915,
            9916,
            9917,
            9918,
            9919,
            9925,
            9926,
            10001,
            10003,
            10021,
            10022,
            10023,
            10024,
            10025,
            10026,
            10027,
            10028,
            10029,
            10030,
            10031,
            10032,
            10033,
            10034,
            10106,
            10107,
            10130,
            10133
        ],
        unit: "degree (supplier to define representation)",
        wkt: "GEOGCS[\"ETRS89\",DATUM[\"European_Terrestrial_Reference_System_1989\",SPHEROID[\"GRS 1980\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"7019\"]],AUTHORITY[\"EPSG\",\"6258\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4258\"]]"
    },
    '3857': {
        accuracy: "",
        area: "World between 85.06°S and 85.06°N.",
        authority: "EPSG",
        bbox: [
            85.06,
            -180.0,
            -85.06,
            180.0
        ],
        code: "3857",
        default_trans: 0,
        kind: "CRS-PROJCRS",
        name: "WGS 84 / Pseudo-Mercator",
        proj4: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
        trans: [
            9189,
            9690,
            9691,
            15960
        ],
        unit: "metre",
        wkt: "PROJCS[\"WGS 84 / Pseudo-Mercator\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]],PROJECTION[\"Mercator_1SP\"],PARAMETER[\"central_meridian\",0],PARAMETER[\"scale_factor\",1],PARAMETER[\"false_easting\",0],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],EXTENSION[\"PROJ4\",\"+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs\"],AUTHORITY[\"EPSG\",\"3857\"]]"
    },
    '900913': {
        accuracy: "",
        area: "",
        authority: "EPSG",
        bbox: [
            0.0,
            0.0,
            0.0,
            0.0
        ],
        code: "900913",
        default_trans: 0,
        kind: "CRS-PROJCRS",
        name: "Google Maps Global Mercator",
        proj4: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
        trans: [],
        unit: "",
        wkt: "PROJCS[\"Google Maps Global Mercator (deprecated)\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]],PROJECTION[\"Mercator_1SP\"],PARAMETER[\"central_meridian\",0],PARAMETER[\"scale_factor\",1],PARAMETER[\"false_easting\",0],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],EXTENSION[\"PROJ4\",\"+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs\"],AUTHORITY[\"EPSG\",\"900913\"]]"
    },
    '25828': {
        accuracy: 1.0,
        area: "Europe between 18°W and 12°W: Faroe Islands - offshore; Ireland - offshore; Jan Mayen - offshore; Portugal - offshore mainland; Spain - offshore mainland; United Kingdom (UKCS) - offshore.",
        authority: "EPSG",
        bbox: [
            72.44,
            -16.1,
            34.93,
            -11.99
        ],
        code: "25828",
        default_trans: 1149,
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 28N",
        proj4: "+proj=utm +zone=28 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1149,
            1571,
            7913,
            7952,
            7953,
            8365,
            8442,
            9365,
            9369,
            9386,
            9454,
            9740,
            9759,
            9764,
            9867,
            9878,
            9941,
            9965,
            9970,
            9975,
            10108,
            10161,
            10181,
            10186,
            10192,
            10197,
            10205,
            10210,
            10215,
            10220,
            10225,
            10230,
            10238,
            10251,
            10255,
            10259,
            10263,
            10267,
            10271,
            10273,
            10278,
            10469,
            15959
        ],
        unit: "metre",
        wkt: "PROJCS[\"ETRS89 / UTM zone 28N\",GEOGCS[\"ETRS89\",DATUM[\"European_Terrestrial_Reference_System_1989\",SPHEROID[\"GRS 1980\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"7019\"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY[\"EPSG\",\"6258\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4258\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-15],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"25828\"]]"
    },
    '25829': {
        accuracy: 1.0,
        area: "Europe between 12°W and 6°W: Faroe Islands - onshore and offshore; Ireland - offshore; Jan Mayen - onshore and offshore; Portugal - onshore and offshore; Spain - onshore and offshore; United Kingdom - UKCS offshore.",
        authority: "EPSG",
        bbox: [
            74.13,
            -12.0,
            34.91,
            -6.0
        ],
        code: "25829",
        default_trans: 1149,
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 29N",
        proj4: "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1149,
            1571,
            7913,
            7952,
            7953,
            8365,
            8442,
            9365,
            9369,
            9386,
            9454,
            9740,
            9759,
            9764,
            9867,
            9878,
            9941,
            9965,
            9970,
            9975,
            10108,
            10161,
            10181,
            10186,
            10192,
            10197,
            10205,
            10210,
            10215,
            10220,
            10225,
            10230,
            10238,
            10251,
            10255,
            10259,
            10263,
            10267,
            10271,
            10273,
            10278,
            10469,
            15959
        ],
        unit: "metre",
        wkt: "PROJCS[\"ETRS89 / UTM zone 29N\",GEOGCS[\"ETRS89\",DATUM[\"European_Terrestrial_Reference_System_1989\",SPHEROID[\"GRS 1980\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"7019\"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY[\"EPSG\",\"6258\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4258\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-9],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"25829\"]]"
    },
    '25831': {
        accuracy: 1.0,
        area: "Europe between 0°E and 6°E: Andorra; Belgium - onshore and offshore; Denmark - offshore; Germany - offshore; Jan Mayen - offshore; Norway including Svalbard - onshore and offshore; Spain - onshore and offshore.",
        authority: "EPSG",
        bbox: [
            82.45,
            0.0,
            37.0,
            6.01
        ],
        code: "25831",
        default_trans: 1149,
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 31N",
        proj4: "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1149,
            1571,
            7913,
            7952,
            7953,
            8365,
            8442,
            9365,
            9369,
            9386,
            9454,
            9740,
            9759,
            9764,
            9867,
            9878,
            9941,
            9965,
            9970,
            9975,
            10108,
            10161,
            10181,
            10186,
            10192,
            10197,
            10205,
            10210,
            10215,
            10220,
            10225,
            10230,
            10238,
            10251,
            10255,
            10259,
            10263,
            10267,
            10271,
            10273,
            10278,
            10469,
            15959
        ],
        unit: "metre",
        wkt: "PROJCS[\"ETRS89 / UTM zone 31N\",GEOGCS[\"ETRS89\",DATUM[\"European_Terrestrial_Reference_System_1989\",SPHEROID[\"GRS 1980\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"7019\"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY[\"EPSG\",\"6258\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4258\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",3],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"25831\"]]"
    },
    '23030': {
        accuracy: 10.0,
        area: "Europe - between 6°W and 0°W - Channel Islands (Jersey, Guernsey); France offshore; Gibraltar; Ireland offshore; Norway including Svalbard - offshore; Spain - onshore; United Kingdom - UKCS offshore.",
        authority: "EPSG",
        bbox: [
            80.49,
            -6.0,
            35.26,
            0.01
        ],
        code: "23030",
        default_trans: 1133,
        kind: "CRS-PROJCRS",
        name: "ED50 / UTM zone 30N",
        proj4: "+proj=utm +zone=30 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1025,
            1043,
            1052,
            1075,
            1087,
            1133,
            1134,
            1135,
            1136,
            1137,
            1138,
            1139,
            1140,
            1142,
            1143,
            1144,
            1145,
            1147,
            1245,
            1275,
            1311,
            1440,
            1450,
            1588,
            1589,
            1590,
            1612,
            1613,
            1626,
            1627,
            1628,
            1629,
            1630,
            1631,
            1632,
            1633,
            1634,
            1635,
            1650,
            1783,
            1784,
            1810,
            1853,
            1961,
            1985,
            1989,
            1998,
            1999,
            3904,
            5040,
            5661,
            8046,
            8047,
            8569,
            8570,
            8653,
            8654,
            9224,
            9408,
            9409,
            9735,
            9736,
            15753,
            15895,
            15907,
            15932,
            15933,
            15964
        ],
        unit: "metre",
        wkt: "PROJCS[\"ED50 / UTM zone 30N\",GEOGCS[\"ED50\",DATUM[\"European_Datum_1950\",SPHEROID[\"International 1924\",6378388,297],TOWGS84[-87,-98,-121,0,0,0,0]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4230\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-3],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"23030\"]]"
    },
    '23028': {
        accuracy: 10.0,
        area: "Europe - between 18°W and 12°W - Ireland offshore.",
        authority: "EPSG",
        bbox: [
            56.57,
            -16.1,
            48.43,
            -12.0
        ],
        code: "23028",
        default_trans: 1133,
        kind: "CRS-PROJCRS",
        name: "ED50 / UTM zone 28N",
        proj4: "+proj=utm +zone=28 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1025,
            1043,
            1052,
            1075,
            1087,
            1133,
            1134,
            1135,
            1136,
            1137,
            1138,
            1139,
            1140,
            1142,
            1143,
            1144,
            1145,
            1147,
            1245,
            1275,
            1311,
            1440,
            1450,
            1588,
            1589,
            1590,
            1612,
            1613,
            1626,
            1627,
            1628,
            1629,
            1630,
            1631,
            1632,
            1633,
            1634,
            1635,
            1650,
            1783,
            1784,
            1810,
            1853,
            1961,
            1985,
            1989,
            1998,
            1999,
            3904,
            5040,
            5661,
            8046,
            8047,
            8569,
            8570,
            8653,
            8654,
            9224,
            9408,
            9409,
            9735,
            9736,
            15753,
            15895,
            15907,
            15932,
            15933,
            15964
        ],
        unit: "metre",
        wkt: "PROJCS[\"ED50 / UTM zone 28N\",GEOGCS[\"ED50\",DATUM[\"European_Datum_1950\",SPHEROID[\"International 1924\",6378388,297],TOWGS84[-87,-98,-121,0,0,0,0]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4230\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-15],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"23028\"]]"
    },
    '23029': {
        accuracy: 10.0,
        area: "Europe - between 12°W and 6°W - Faroe Islands - onshore; Spain - mainland onshore; Ireland offshore.",
        authority: "EPSG",
        bbox: [
            62.41,
            -12.0,
            36.13,
            -6.0
        ],
        code: "23029",
        default_trans: 1133,
        kind: "CRS-PROJCRS",
        name: "ED50 / UTM zone 29N",
        proj4: "+proj=utm +zone=29 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1025,
            1043,
            1052,
            1075,
            1087,
            1133,
            1134,
            1135,
            1136,
            1137,
            1138,
            1139,
            1140,
            1142,
            1143,
            1144,
            1145,
            1147,
            1245,
            1275,
            1311,
            1440,
            1450,
            1588,
            1589,
            1590,
            1612,
            1613,
            1626,
            1627,
            1628,
            1629,
            1630,
            1631,
            1632,
            1633,
            1634,
            1635,
            1650,
            1783,
            1784,
            1810,
            1853,
            1961,
            1985,
            1989,
            1998,
            1999,
            3904,
            5040,
            5661,
            8046,
            8047,
            8569,
            8570,
            8653,
            8654,
            9224,
            9408,
            9409,
            9735,
            9736,
            15753,
            15895,
            15907,
            15932,
            15933,
            15964
        ],
        unit: "metre",
        wkt: "PROJCS[\"ED50 / UTM zone 29N\",GEOGCS[\"ED50\",DATUM[\"European_Datum_1950\",SPHEROID[\"International 1924\",6378388,297],TOWGS84[-87,-98,-121,0,0,0,0]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4230\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-9],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"23029\"]]"
    },
    '23031': {
        accuracy: 10.0,
        area: "Europe - between 0°E and 6°E - Andorra; Denmark (North Sea); Germany offshore; Netherlands offshore; Norway including Svalbard - onshore and offshore; Spain - onshore (mainland and Balearic Islands); United Kingdom (UKCS) offshore.",
        authority: "EPSG",
        bbox: [
            82.45,
            0.0,
            38.56,
            6.01
        ],
        code: "23031",
        default_trans: 1133,
        kind: "CRS-PROJCRS",
        name: "ED50 / UTM zone 31N",
        proj4: "+proj=utm +zone=31 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1025,
            1043,
            1052,
            1075,
            1087,
            1133,
            1134,
            1135,
            1136,
            1137,
            1138,
            1139,
            1140,
            1142,
            1143,
            1144,
            1145,
            1147,
            1245,
            1275,
            1311,
            1440,
            1450,
            1588,
            1589,
            1590,
            1612,
            1613,
            1626,
            1627,
            1628,
            1629,
            1630,
            1631,
            1632,
            1633,
            1634,
            1635,
            1650,
            1783,
            1784,
            1810,
            1853,
            1961,
            1985,
            1989,
            1998,
            1999,
            3904,
            5040,
            5661,
            8046,
            8047,
            8569,
            8570,
            8653,
            8654,
            9224,
            9408,
            9409,
            9735,
            9736,
            15753,
            15895,
            15907,
            15932,
            15933,
            15964
        ],
        unit: "metre",
        wkt: "PROJCS[\"ED50 / UTM zone 31N\",GEOGCS[\"ED50\",DATUM[\"European_Datum_1950\",SPHEROID[\"International 1924\",6378388,297],TOWGS84[-87,-98,-121,0,0,0,0]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4230\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",3],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"23031\"]]"
    },
    '32630': {
        accuracy: "",
        area: "Between 6°W and 0°W, northern hemisphere between equator and 84°N, onshore and offshore. Algeria. Burkina Faso. Côte' Ivoire (Ivory Coast). Faroe Islands - offshore. France. Ghana. Gibraltar. Ireland - offshore Irish Sea. Mali. Mauritania. Morocco. Spain. United Kingdom (UK).",
        authority: "EPSG",
        bbox: [
            84.0,
            -6.0,
            0.0,
            0.0
        ],
        code: "32630",
        default_trans: 0,
        kind: "CRS-PROJCRS",
        name: "WGS 84 / UTM zone 30N",
        proj4: "+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs +type=crs",
        trans: [
            9189,
            9690,
            9691,
            15960
        ],
        unit: "metre",
        wkt: "PROJCS[\"WGS 84 / UTM zone 30N\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-3],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"32630\"]]"
    },
    '32628': {
        accuracy: "",
        area: "Between 18°W and 12°W, northern hemisphere between equator and 84°N, onshore and offshore. Gambia. Greenland. Guinea. Guinea-Bissau. Iceland. Ireland - offshore Porcupine Basin. Mauritania. Morocco. Senegal. Sierra Leone. Western Sahara.",
        authority: "EPSG",
        bbox: [
            84.0,
            -18.0,
            0.0,
            -12.0
        ],
        code: "32628",
        default_trans: 0,
        kind: "CRS-PROJCRS",
        name: "WGS 84 / UTM zone 28N",
        proj4: "+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs +type=crs",
        trans: [
            9189,
            9690,
            9691,
            15960
        ],
        unit: "metre",
        wkt: "PROJCS[\"WGS 84 / UTM zone 28N\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-15],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"32628\"]]"
    },
    '32629': {
        accuracy: "",
        area: "Between 12°W and 6°W, northern hemisphere between equator and 84°N, onshore and offshore. Algeria. Côte D'Ivoire (Ivory Coast). Faroe Islands. Guinea. Ireland. Jan Mayen. Liberia, Mali. Mauritania. Morocco. Portugal. Sierra Leone. Spain. United Kingdom (UK). Western Sahara.",
        authority: "EPSG",
        bbox: [
            84.01,
            -12.01,
            0.0,
            -6.0
        ],
        code: "32629",
        default_trans: 0,
        kind: "CRS-PROJCRS",
        name: "WGS 84 / UTM zone 29N",
        proj4: "+proj=utm +zone=29 +datum=WGS84 +units=m +no_defs +type=crs",
        trans: [
            9189,
            9690,
            9691,
            15960
        ],
        unit: "metre",
        wkt: "PROJCS[\"WGS 84 / UTM zone 29N\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-9],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"32629\"]]"
    },
    '32631': {
        accuracy: "",
        area: "Between 0°E and 6°E, northern hemisphere between equator and 84°N, onshore and offshore. Algeria. Andorra. Belgium. Benin. Burkina Faso. Denmark - North Sea. France. Germany - North Sea. Ghana. Luxembourg. Mali. Netherlands. Niger. Nigeria. Norway. Spain. Togo. United Kingdom (UK) - North Sea.",
        authority: "EPSG",
        bbox: [
            84.0,
            0.0,
            0.0,
            6.0
        ],
        code: "32631",
        default_trans: 0,
        kind: "CRS-PROJCRS",
        name: "WGS 84 / UTM zone 31N",
        proj4: "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs +type=crs",
        trans: [
            9189,
            9690,
            9691,
            15960
        ],
        unit: "metre",
        wkt: "PROJCS[\"WGS 84 / UTM zone 31N\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",3],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],AUTHORITY[\"EPSG\",\"32631\"]]"
    },
    '4230': {
        accuracy: 10.0,
        area: "Europe - west: Andorra; Cyprus; Denmark - onshore and offshore; Faroe Islands - onshore; France - offshore; Germany - offshore North Sea; Gibraltar; Greece - offshore; Israel - offshore; Italy including San Marino and Vatican City State; Ireland offshore; Malta; Netherlands - offshore; North Sea; Norway including Svalbard - onshore and offshore; Portugal - mainland - offshore; Spain - onshore; Türkiye (Turkey) - onshore and offshore; United Kingdom - UKCS offshore east of 6°W including Channel Islands (Guernsey and Jersey). Egypt - Western Desert; Iraq - onshore; Jordan.",
        authority: "EPSG",
        bbox: [
            84.73,
            -16.1,
            25.71,
            48.61
        ],
        code: "4230",
        default_trans: 1133,
        kind: "CRS-GEOGCRS",
        name: "ED50",
        proj4: "+proj=longlat +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +no_defs +type=crs",
        trans: [
            1025,
            1043,
            1052,
            1075,
            1087,
            1133,
            1134,
            1135,
            1136,
            1137,
            1138,
            1139,
            1140,
            1142,
            1143,
            1144,
            1145,
            1147,
            1245,
            1275,
            1311,
            1440,
            1450,
            1588,
            1589,
            1590,
            1612,
            1613,
            1626,
            1627,
            1628,
            1629,
            1630,
            1631,
            1632,
            1633,
            1634,
            1635,
            1650,
            1783,
            1784,
            1810,
            1853,
            1961,
            1985,
            1989,
            1998,
            1999,
            3904,
            5040,
            5661,
            8046,
            8047,
            8569,
            8570,
            8653,
            8654,
            9224,
            9408,
            9409,
            9735,
            9736,
            15753,
            15895,
            15907,
            15932,
            15933,
            15964
        ],
        unit: "degree (supplier to define representation)",
        wkt: "GEOGCS[\"ED50\",DATUM[\"European_Datum_1950\",SPHEROID[\"International 1924\",6378388,297],TOWGS84[-87,-98,-121,0,0,0,0]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4230\"]]"
    },
    '3040': {
        accuracy: 1.0,
        area: "Europe between 18°W and 12°W: Faroe Islands - offshore; Ireland - offshore; Jan Mayen - offshore; Portugal - offshore mainland; Spain - offshore mainland; United Kingdom (UKCS) - offshore.",
        authority: "EPSG",
        bbox: [
            72.44,
            -16.1,
            34.93,
            -11.99
        ],
        code: "3040",
        default_trans: 1149,
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 28N (N-E)",
        proj4: "+proj=utm +zone=28 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1149,
            1571,
            7913,
            7952,
            7953,
            8365,
            8442,
            9365,
            9369,
            9386,
            9454,
            9740,
            9759,
            9764,
            9867,
            9878,
            9941,
            9965,
            9970,
            9975,
            10108,
            10161,
            10181,
            10186,
            10192,
            10197,
            10205,
            10210,
            10215,
            10220,
            10225,
            10230,
            10238,
            10251,
            10255,
            10259,
            10263,
            10267,
            10271,
            10273,
            10278,
            10469,
            15959
        ],
        unit: "metre",
        wkt: "PROJCS[\"ETRS89 / UTM zone 28N (N-E)\",GEOGCS[\"ETRS89\",DATUM[\"European_Terrestrial_Reference_System_1989\",SPHEROID[\"GRS 1980\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"7019\"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY[\"EPSG\",\"6258\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4258\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-15],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AUTHORITY[\"EPSG\",\"3040\"]]"
    },
    '3041': {
        accuracy: 1.0,
        area: "Europe between 12°W and 6°W: Faroe Islands - onshore and offshore; Ireland - offshore; Jan Mayen - onshore and offshore; Portugal - onshore and offshore; Spain - onshore and offshore; United Kingdom - UKCS offshore.",
        authority: "EPSG",
        bbox: [
            74.13,
            -12.0,
            34.91,
            -6.0
        ],
        code: "3041",
        default_trans: 1149,
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 29N (N-E)",
        proj4: "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1149,
            1571,
            7913,
            7952,
            7953,
            8365,
            8442,
            9365,
            9369,
            9386,
            9454,
            9740,
            9759,
            9764,
            9867,
            9878,
            9941,
            9965,
            9970,
            9975,
            10108,
            10161,
            10181,
            10186,
            10192,
            10197,
            10205,
            10210,
            10215,
            10220,
            10225,
            10230,
            10238,
            10251,
            10255,
            10259,
            10263,
            10267,
            10271,
            10273,
            10278,
            10469,
            15959
        ],
        unit: "metre",
        wkt: "PROJCS[\"ETRS89 / UTM zone 29N (N-E)\",GEOGCS[\"ETRS89\",DATUM[\"European_Terrestrial_Reference_System_1989\",SPHEROID[\"GRS 1980\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"7019\"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY[\"EPSG\",\"6258\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4258\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-9],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AUTHORITY[\"EPSG\",\"3041\"]]"
    },
    '3042': {
        accuracy: 1.0,
        area: "Europe between 6°W and 0°W: Faroe Islands offshore; Ireland - offshore; Jan Mayen - offshore; Norway including Svalbard - offshore; Spain - onshore and offshore.",
        authority: "EPSG",
        bbox: [
            80.49,
            -6.0,
            35.26,
            0.01
        ],
        code: "3042",
        default_trans: 1149,
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 30N (N-E)",
        proj4: "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1149,
            1571,
            7913,
            7952,
            7953,
            8365,
            8442,
            9365,
            9369,
            9386,
            9454,
            9740,
            9759,
            9764,
            9867,
            9878,
            9941,
            9965,
            9970,
            9975,
            10108,
            10161,
            10181,
            10186,
            10192,
            10197,
            10205,
            10210,
            10215,
            10220,
            10225,
            10230,
            10238,
            10251,
            10255,
            10259,
            10263,
            10267,
            10271,
            10273,
            10278,
            10469,
            15959
        ],
        unit: "metre",
        wkt: "PROJCS[\"ETRS89 / UTM zone 30N (N-E)\",GEOGCS[\"ETRS89\",DATUM[\"European_Terrestrial_Reference_System_1989\",SPHEROID[\"GRS 1980\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"7019\"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY[\"EPSG\",\"6258\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4258\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",-3],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AUTHORITY[\"EPSG\",\"3042\"]]"
    },
    '3043': {
        accuracy: 1.0,
        area: "Europe between 0°E and 6°E: Andorra; Belgium - onshore and offshore; Denmark - offshore; Germany - offshore; Jan Mayen - offshore; Norway including Svalbard - onshore and offshore; Spain - onshore and offshore.",
        authority: "EPSG",
        bbox: [
            82.45,
            0.0,
            37.0,
            6.01
        ],
        code: "3043",
        default_trans: 1149,
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 31N (N-E)",
        proj4: "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        trans: [
            1149,
            1571,
            7913,
            7952,
            7953,
            8365,
            8442,
            9365,
            9369,
            9386,
            9454,
            9740,
            9759,
            9764,
            9867,
            9878,
            9941,
            9965,
            9970,
            9975,
            10108,
            10161,
            10181,
            10186,
            10192,
            10197,
            10205,
            10210,
            10215,
            10220,
            10225,
            10230,
            10238,
            10251,
            10255,
            10259,
            10263,
            10267,
            10271,
            10273,
            10278,
            10469,
            15959
        ],
        unit: "metre",
        wkt: "PROJCS[\"ETRS89 / UTM zone 31N (N-E)\",GEOGCS[\"ETRS89\",DATUM[\"European_Terrestrial_Reference_System_1989\",SPHEROID[\"GRS 1980\",6378137,298.257222101,AUTHORITY[\"EPSG\",\"7019\"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY[\"EPSG\",\"6258\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4258\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",3],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AUTHORITY[\"EPSG\",\"3043\"]]"
    }
};

const parseResponseObject = function (obj) {
    let result = false;
    if (obj.status === 'ok' && obj.number_result > 0) {
        result = obj.results[0];
    }
    return result;
};

TC.getProjectionData = function (options = {}) {
    const crs = options.crs || '';
    const match = crs.match(/\d{4,6}$/g);
    let code = match ? match[0] : '';
    const url = Consts.url.EPSG + '?format=json&q=' + code + (options.deprecated ? '%20deprecated%3A1' : '');
    let projData = projectionDataCache[code];
    if (projData) {
        if (options.sync) {
            return projData;
        }
        return Promise.resolve(projData);
    }

    const deprecatedOpts = Object.assign({}, options, { deprecated: true });

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
            result = parseResponseObject(JSON.parse(result));
            if (result.number_result == 0 && !options.deprecated) {
                result = TC.getProjectionData(deprecatedOpts);
            }
        }
        return result;
    }

    const endFn = function (resolve) {
        const proxificationTool = new TC.tool.Proxification(TC.proxify);
        proxificationTool.fetchJSON(url, options).then((response) => {
            const data = parseResponseObject(response);
            if (!data && !options.deprecated) {
                TC.getProjectionData(deprecatedOpts).then((data) => resolve(data));
            }
            else {
                projectionDataCache[code] = data;
                resolve(data);
            }
        });
    };

    return new Promise(function (resolve, _reject) {
        if (!TC.tool.Proxification) {
            import('./TC/tool/Proxification').then((module) => {
                TC.tool.Proxification = module.default;
                endFn(resolve);
            });
        }
        else {
            endFn(resolve);
        }
    });
};

TC.loadProjDef = function (options = {}) {
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
        if (window.ol && ol.proj) {
            if (!options.silent) {
                if (!ol.proj.get(epsgCode) && !ol.proj.get(urnCode) && !ol.proj.get(urnxCode)) {
                    // https://openlayers.org/en/latest/apidoc/module-ol_proj_proj4.html
                    ol.proj.proj4.register(proj4);
                }
            }
        }
        getDef(epsgCode).name = name;
        getDef(ogcHttpUrlCode).name = name;
        const uriDef = getDef(ogcHttpUriCode);
        if (uriDef) uriDef.name = name;
    };
    const loadDefResponse = function (data) {
        const result = !!data;
        if (result) {
            loadDef(data.code, data.proj4, data.name);
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
                return TC.getProjectionData(options).then(loadDataAndExecCallback).catch(e => console.error(e));
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
    for (const mixin of mixins) {
        for (const [key, value] of Object.entries(mixin)) {
            if (!Object.prototype.hasOwnProperty.call(targetCtor.prototype, key)) {
                targetCtor.prototype[key] = value;
            }
        }
    }
};

const uids = new Map();
TC.getUID = function (options = {}) {
    const prefix = options.prefix || '';
    let value = uids.get(prefix);
    if (!value) {
        value = 1;
    }
    let result = prefix + value;
    uids.set(prefix, value + 1);
    if (options.banlist?.includes(result)) {
        return TC.getUID(options);
    }
    return result;
};

TC.setUIDStart = function (count, options = {}) {
    const prefix = options.prefix || '';
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
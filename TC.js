import Consts from './TC/Consts.js';
import proj4 from 'proj4';

var TC = TC || {};

(function () {
    if (!TC.apiLocation) {
        if (globalThis?.SITNA_BASE_URL) {
            // Obtenemos la URL base de la configuración SITNA_BASE_URL (necesario para usar como paquete npm)
            TC.apiLocation = globalThis.SITNA_BASE_URL;
            if (!TC.apiLocation.endsWith('/')) {
                TC.apiLocation = TC.apiLocation + '/';
            }
        }
        else {
            // Obtenemos la URL base de la dirección del script
            const script = document.currentScript ?? document.scripts[document.scripts.length - 1];
            const src = script.getAttribute('src');
            TC.apiLocation = src.substring(0, src.lastIndexOf('/') + 1);
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
    const body = TC.Util.getLocaleString(mapObj ? mapObj.getLocale() : 'es-ES', "urlFailedToLoad", { url: url });

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

const loadedUrls = new Set();

TC.loadJS = async function (condition, url, callback, inOrder = false, notCrossOrigin) {
    const requestPromises = [];
    if (condition) {
        const urls = Array.isArray(url) ? url : [url];
        for (const urlString of urls) {
            const url = new URL(urlString, location.href);
            const fullUrlString = url.toString();
            if (!loadedUrls.has(fullUrlString)) {
                loadedUrls.add(fullUrlString);
                requestPromises.push(new Promise((resolve, reject) => {
                    const elm = document.createElement('script');
                    elm.src = urlString;
                    elm.async = !inOrder;
                    if (!notCrossOrigin && !TC.Util.isSameOrigin(elm.src)) {
                        elm.crossOrigin = 'anonymous';
                    }
                    elm.onload = resolve;
                    elm.onerror = function (e) {
                        loadedUrls.remove(fullUrlString);
                        console.error(e);
                        reject();
                    };
                    document.head.appendChild(elm);
                }));
            }
        }
    }
    await Promise.all(requestPromises);
    if (TC.Util.isFunction(callback)) {
        callback();
    }
};

TC.loadCSS = function (url) {

    const urlObj = new URL(url, location.href);
    const fullUrlString = urlObj.toString();
    return new Promise((resolve, reject) => {
        if (loadedUrls.has(fullUrlString)) {
            resolve();
        }
        else {
            loadedUrls.add(fullUrlString);
            const elm = document.createElement('link');
            elm.rel = 'stylesheet';
            elm.href = url;
            elm.onload = resolve;
            elm.onerror = function (e) {
                loadedUrls.remove(fullUrlString);
                console.error(e);
                reject();
            };
            document.head.appendChild(elm);
        }
    });
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
        code: "25830",
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 30N",
        wkt: 'PROJCRS["ETRS89 / UTM zone 30N",BASEGEOGCRS["ETRS89",ENSEMBLE["European Terrestrial Reference System 1989 ensemble", MEMBER["European Terrestrial Reference Frame 1989", ID["EPSG",1178]], MEMBER["European Terrestrial Reference Frame 1990", ID["EPSG",1179]], MEMBER["European Terrestrial Reference Frame 1991", ID["EPSG",1180]], MEMBER["European Terrestrial Reference Frame 1992", ID["EPSG",1181]], MEMBER["European Terrestrial Reference Frame 1993", ID["EPSG",1182]], MEMBER["European Terrestrial Reference Frame 1994", ID["EPSG",1183]], MEMBER["European Terrestrial Reference Frame 1996", ID["EPSG",1184]], MEMBER["European Terrestrial Reference Frame 1997", ID["EPSG",1185]], MEMBER["European Terrestrial Reference Frame 2000", ID["EPSG",1186]], MEMBER["European Terrestrial Reference Frame 2005", ID["EPSG",1204]], MEMBER["European Terrestrial Reference Frame 2014", ID["EPSG",1206]], MEMBER["European Terrestrial Reference Frame 2020", ID["EPSG",1382]], ELLIPSOID["GRS 1980",6378137,298.257222101,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7019]], ENSEMBLEACCURACY[0.1],ID["EPSG",6258]],ID["EPSG",4258]],CONVERSION["UTM zone 30N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-3,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16030]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",25830]]',
        proj4: "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        bbox: [80.49, -6, 35.26, 0.01],
        unit: "metre",
        accuracy: 1
    },
    '4326': {
        code: "4326",
        kind: "CRS-GEOGCRS",
        name: "WGS 84",
        wkt: 'GEOGCRS["WGS 84",ENSEMBLE["World Geodetic System 1984 ensemble", MEMBER["World Geodetic System 1984 (Transit)", ID["EPSG",1166]], MEMBER["World Geodetic System 1984 (G730)", ID["EPSG",1152]], MEMBER["World Geodetic System 1984 (G873)", ID["EPSG",1153]], MEMBER["World Geodetic System 1984 (G1150)", ID["EPSG",1154]], MEMBER["World Geodetic System 1984 (G1674)", ID["EPSG",1155]], MEMBER["World Geodetic System 1984 (G1762)", ID["EPSG",1156]], MEMBER["World Geodetic System 1984 (G2139)", ID["EPSG",1309]], MEMBER["World Geodetic System 1984 (G2296)", ID["EPSG",1383]], ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7030]], ENSEMBLEACCURACY[2],ID["EPSG",6326]],CS[ellipsoidal,2,ID["EPSG",6422]],AXIS["Geodetic latitude (Lat)",north],AXIS["Geodetic longitude (Lon)",east],ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",4326]]',
        proj4: "+proj=longlat +datum=WGS84 +no_defs +type=crs",
        bbox: [90, -180, -90, 180],
        unit: "degree",
        accuracy: null
    },
    '3857': {
        code: "3857",
        kind: "CRS-PROJCRS",
        name: "WGS 84 / Pseudo-Mercator",
        wkt: 'PROJCRS["WGS 84 / Pseudo-Mercator",BASEGEOGCRS["WGS 84",ENSEMBLE["World Geodetic System 1984 ensemble", MEMBER["World Geodetic System 1984 (Transit)", ID["EPSG",1166]], MEMBER["World Geodetic System 1984 (G730)", ID["EPSG",1152]], MEMBER["World Geodetic System 1984 (G873)", ID["EPSG",1153]], MEMBER["World Geodetic System 1984 (G1150)", ID["EPSG",1154]], MEMBER["World Geodetic System 1984 (G1674)", ID["EPSG",1155]], MEMBER["World Geodetic System 1984 (G1762)", ID["EPSG",1156]], MEMBER["World Geodetic System 1984 (G2139)", ID["EPSG",1309]], MEMBER["World Geodetic System 1984 (G2296)", ID["EPSG",1383]], ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7030]], ENSEMBLEACCURACY[2],ID["EPSG",6326]],ID["EPSG",4326]],CONVERSION["Popular Visualisation Pseudo-Mercator",METHOD["Popular Visualisation Pseudo Mercator",ID["EPSG",1024]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["False easting",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",3856]],CS[Cartesian,2,ID["EPSG",4499]],AXIS["Easting (X)",east],AXIS["Northing (Y)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",3857]]',
        proj4: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
        bbox: [85.06, -180, -85.06, 180],
        unit: "metre",
        accuracy: null
    },
    '900913': {
        code: "900913",
        kind: "CRS-PROJCRS",
        name: "Google Maps Global Mercator",
        wkt: 'PROJCRS["Google_Maps_Global_Mercator",BASEGEOGCRS["WGS 84",DATUM["World Geodetic System 1984",ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1]]],PRIMEM["Greenwich",0,ANGLEUNIT["degree",0.0174532925199433]],ID["EPSG",4326]],CONVERSION["unnamed",METHOD["Popular Visualisation Pseudo Mercator",ID["EPSG",1024]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433],ID["EPSG",8802]],PARAMETER["False easting",0,LENGTHUNIT["metre",1],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1],ID["EPSG",8807]]],CS[Cartesian,2],AXIS["(E)",east,ORDER[1],LENGTHUNIT["metre",1]],AXIS["(N)",north,ORDER[2],LENGTHUNIT["metre",1]],ID["EPSG",900913]]',
        proj4: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
        bbox: [0, 0, 0, 0],
        unit: null,
        accuracy: null
    },
    '25828': {
        code: "25828",
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 28N",
        wkt: 'PROJCRS["ETRS89 / UTM zone 28N",BASEGEOGCRS["ETRS89",ENSEMBLE["European Terrestrial Reference System 1989 ensemble", MEMBER["European Terrestrial Reference Frame 1989", ID["EPSG",1178]], MEMBER["European Terrestrial Reference Frame 1990", ID["EPSG",1179]], MEMBER["European Terrestrial Reference Frame 1991", ID["EPSG",1180]], MEMBER["European Terrestrial Reference Frame 1992", ID["EPSG",1181]], MEMBER["European Terrestrial Reference Frame 1993", ID["EPSG",1182]], MEMBER["European Terrestrial Reference Frame 1994", ID["EPSG",1183]], MEMBER["European Terrestrial Reference Frame 1996", ID["EPSG",1184]], MEMBER["European Terrestrial Reference Frame 1997", ID["EPSG",1185]], MEMBER["European Terrestrial Reference Frame 2000", ID["EPSG",1186]], MEMBER["European Terrestrial Reference Frame 2005", ID["EPSG",1204]], MEMBER["European Terrestrial Reference Frame 2014", ID["EPSG",1206]], MEMBER["European Terrestrial Reference Frame 2020", ID["EPSG",1382]], ELLIPSOID["GRS 1980",6378137,298.257222101,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7019]], ENSEMBLEACCURACY[0.1],ID["EPSG",6258]],ID["EPSG",4258]],CONVERSION["UTM zone 28N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-15,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16028]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",25828]]',
        proj4: "+proj=utm +zone=28 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        bbox: [72.44, -16.1, 34.93, -11.99],
        unit: "metre",
        accuracy: 1
    },
    '25829': {
        code: "25829",
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 29N",
        wkt: 'PROJCRS["ETRS89 / UTM zone 29N",BASEGEOGCRS["ETRS89",ENSEMBLE["European Terrestrial Reference System 1989 ensemble", MEMBER["European Terrestrial Reference Frame 1989", ID["EPSG",1178]], MEMBER["European Terrestrial Reference Frame 1990", ID["EPSG",1179]], MEMBER["European Terrestrial Reference Frame 1991", ID["EPSG",1180]], MEMBER["European Terrestrial Reference Frame 1992", ID["EPSG",1181]], MEMBER["European Terrestrial Reference Frame 1993", ID["EPSG",1182]], MEMBER["European Terrestrial Reference Frame 1994", ID["EPSG",1183]], MEMBER["European Terrestrial Reference Frame 1996", ID["EPSG",1184]], MEMBER["European Terrestrial Reference Frame 1997", ID["EPSG",1185]], MEMBER["European Terrestrial Reference Frame 2000", ID["EPSG",1186]], MEMBER["European Terrestrial Reference Frame 2005", ID["EPSG",1204]], MEMBER["European Terrestrial Reference Frame 2014", ID["EPSG",1206]], MEMBER["European Terrestrial Reference Frame 2020", ID["EPSG",1382]], ELLIPSOID["GRS 1980",6378137,298.257222101,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7019]], ENSEMBLEACCURACY[0.1],ID["EPSG",6258]],ID["EPSG",4258]],CONVERSION["UTM zone 29N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-9,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16029]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",25829]]',
        proj4: "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        bbox: [74.13, -12, 34.91, -6],
        unit: "metre",
        accuracy: 1
    },
    '25831': {
        code: "25831",
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 31N",
        wkt: 'PROJCRS["ETRS89 / UTM zone 31N",BASEGEOGCRS["ETRS89",ENSEMBLE["European Terrestrial Reference System 1989 ensemble", MEMBER["European Terrestrial Reference Frame 1989", ID["EPSG",1178]], MEMBER["European Terrestrial Reference Frame 1990", ID["EPSG",1179]], MEMBER["European Terrestrial Reference Frame 1991", ID["EPSG",1180]], MEMBER["European Terrestrial Reference Frame 1992", ID["EPSG",1181]], MEMBER["European Terrestrial Reference Frame 1993", ID["EPSG",1182]], MEMBER["European Terrestrial Reference Frame 1994", ID["EPSG",1183]], MEMBER["European Terrestrial Reference Frame 1996", ID["EPSG",1184]], MEMBER["European Terrestrial Reference Frame 1997", ID["EPSG",1185]], MEMBER["European Terrestrial Reference Frame 2000", ID["EPSG",1186]], MEMBER["European Terrestrial Reference Frame 2005", ID["EPSG",1204]], MEMBER["European Terrestrial Reference Frame 2014", ID["EPSG",1206]], MEMBER["European Terrestrial Reference Frame 2020", ID["EPSG",1382]], ELLIPSOID["GRS 1980",6378137,298.257222101,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7019]], ENSEMBLEACCURACY[0.1],ID["EPSG",6258]],ID["EPSG",4258]],CONVERSION["UTM zone 31N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",3,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16031]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",25831]]',
        proj4: "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
        bbox: [82.45, 0, 37, 6.01],
        unit: "metre",
        accuracy: 1
    },
    '23030': {
        code: "23030",
        kind: "CRS-PROJCRS",
        name: "ED50 / UTM zone 30N",
        wkt: 'PROJCRS["ED50 / UTM zone 30N",BASEGEOGCRS["ED50",DATUM["European Datum 1950",ELLIPSOID["International 1924",6378388,297,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7022]],ID["EPSG",6230]],ID["EPSG",4230]],CONVERSION["UTM zone 30N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-3,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16030]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",23030]]',
        proj4: "+proj=utm +zone=30 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs +type=crs",
        bbox: [80.49, -6, 35.26, 0.01],
        unit: "metre",
        accuracy: 10
    },
    '23028': {
        code: "23028",
        kind: "CRS-PROJCRS",
        name: "ED50 / UTM zone 28N",
        wkt: 'PROJCRS["ED50 / UTM zone 28N",BASEGEOGCRS["ED50",DATUM["European Datum 1950",ELLIPSOID["International 1924",6378388,297,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7022]],ID["EPSG",6230]],ID["EPSG",4230]],CONVERSION["UTM zone 28N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-15,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16028]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",23028]]',
        proj4: "+proj=utm +zone=28 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs +type=crs",
        bbox: [56.57, -16.1, 48.43, -12],
        unit: "metre",
        accuracy: 10
    },
    '23029': {
        code: "23029",
        kind: "CRS-PROJCRS",
        name: "ED50 / UTM zone 29N",
        wkt: 'PROJCRS["ED50 / UTM zone 29N",BASEGEOGCRS["ED50",DATUM["European Datum 1950",ELLIPSOID["International 1924",6378388,297,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7022]],ID["EPSG",6230]],ID["EPSG",4230]],CONVERSION["UTM zone 29N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-9,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16029]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",23029]]',
        proj4: "+proj=utm +zone=29 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs +type=crs",
        bbox: [62.41, -12, 36.13, -6],
        unit: "metre",
        accuracy: 10
    },
    '23031': {
        code: "23031",
        kind: "CRS-PROJCRS",
        name: "ED50 / UTM zone 31N",
        wkt: 'PROJCRS["ED50 / UTM zone 31N",BASEGEOGCRS["ED50",DATUM["European Datum 1950",ELLIPSOID["International 1924",6378388,297,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7022]],ID["EPSG",6230]],ID["EPSG",4230]],CONVERSION["UTM zone 31N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",3,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16031]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",23031]]',
        proj4: "+proj=utm +zone=31 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs +type=crs",
        bbox: [82.45, 0, 38.56, 6.01],
        unit: "metre",
        accuracy: 10
    },
    '32630': {
        code: "32630",
        kind: "CRS-PROJCRS",
        name: "WGS 84 / UTM zone 30N",
        wkt: 'PROJCRS["WGS 84 / UTM zone 30N",BASEGEOGCRS["WGS 84",ENSEMBLE["World Geodetic System 1984 ensemble", MEMBER["World Geodetic System 1984 (Transit)", ID["EPSG",1166]], MEMBER["World Geodetic System 1984 (G730)", ID["EPSG",1152]], MEMBER["World Geodetic System 1984 (G873)", ID["EPSG",1153]], MEMBER["World Geodetic System 1984 (G1150)", ID["EPSG",1154]], MEMBER["World Geodetic System 1984 (G1674)", ID["EPSG",1155]], MEMBER["World Geodetic System 1984 (G1762)", ID["EPSG",1156]], MEMBER["World Geodetic System 1984 (G2139)", ID["EPSG",1309]], MEMBER["World Geodetic System 1984 (G2296)", ID["EPSG",1383]], ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7030]], ENSEMBLEACCURACY[2],ID["EPSG",6326]],ID["EPSG",4326]],CONVERSION["UTM zone 30N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-3,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16030]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",32630]]',
        proj4: "+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs +type=crs",
        bbox: [84, -6, 0, 0],
        unit: "metre",
        accuracy: null
    },
    '32628': {
        code: "32628",
        kind: "CRS-PROJCRS",
        name: "WGS 84 / UTM zone 28N",
        wkt: 'PROJCRS["WGS 84 / UTM zone 28N",BASEGEOGCRS["WGS 84",ENSEMBLE["World Geodetic System 1984 ensemble", MEMBER["World Geodetic System 1984 (Transit)", ID["EPSG",1166]], MEMBER["World Geodetic System 1984 (G730)", ID["EPSG",1152]], MEMBER["World Geodetic System 1984 (G873)", ID["EPSG",1153]], MEMBER["World Geodetic System 1984 (G1150)", ID["EPSG",1154]], MEMBER["World Geodetic System 1984 (G1674)", ID["EPSG",1155]], MEMBER["World Geodetic System 1984 (G1762)", ID["EPSG",1156]], MEMBER["World Geodetic System 1984 (G2139)", ID["EPSG",1309]], MEMBER["World Geodetic System 1984 (G2296)", ID["EPSG",1383]], ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7030]], ENSEMBLEACCURACY[2],ID["EPSG",6326]],ID["EPSG",4326]],CONVERSION["UTM zone 28N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-15,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16028]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",32628]]',
        proj4: "+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs +type=crs",
        bbox: [84, -18, 0, -12],
        unit: "metre",
        accuracy: null
    },
    '32629': {
        code: "32629",
        kind: "CRS-PROJCRS",
        name: "WGS 84 / UTM zone 29N",
        wkt: 'PROJCRS["WGS 84 / UTM zone 29N",BASEGEOGCRS["WGS 84",ENSEMBLE["World Geodetic System 1984 ensemble", MEMBER["World Geodetic System 1984 (Transit)", ID["EPSG",1166]], MEMBER["World Geodetic System 1984 (G730)", ID["EPSG",1152]], MEMBER["World Geodetic System 1984 (G873)", ID["EPSG",1153]], MEMBER["World Geodetic System 1984 (G1150)", ID["EPSG",1154]], MEMBER["World Geodetic System 1984 (G1674)", ID["EPSG",1155]], MEMBER["World Geodetic System 1984 (G1762)", ID["EPSG",1156]], MEMBER["World Geodetic System 1984 (G2139)", ID["EPSG",1309]], MEMBER["World Geodetic System 1984 (G2296)", ID["EPSG",1383]], ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7030]], ENSEMBLEACCURACY[2],ID["EPSG",6326]],ID["EPSG",4326]],CONVERSION["UTM zone 29N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-9,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16029]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",32629]]',
        proj4: "+proj=utm +zone=29 +datum=WGS84 +units=m +no_defs +type=crs",
        bbox: [84, -12, 0, -6],
        unit: "metre",
        accuracy: null
    },
    '32631': {
        code: "32631",
        kind: "CRS-PROJCRS",
        name: "WGS 84 / UTM zone 31N",
        wkt: 'PROJCRS["WGS 84 / UTM zone 31N",BASEGEOGCRS["WGS 84",ENSEMBLE["World Geodetic System 1984 ensemble", MEMBER["World Geodetic System 1984 (Transit)", ID["EPSG",1166]], MEMBER["World Geodetic System 1984 (G730)", ID["EPSG",1152]], MEMBER["World Geodetic System 1984 (G873)", ID["EPSG",1153]], MEMBER["World Geodetic System 1984 (G1150)", ID["EPSG",1154]], MEMBER["World Geodetic System 1984 (G1674)", ID["EPSG",1155]], MEMBER["World Geodetic System 1984 (G1762)", ID["EPSG",1156]], MEMBER["World Geodetic System 1984 (G2139)", ID["EPSG",1309]], MEMBER["World Geodetic System 1984 (G2296)", ID["EPSG",1383]], ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7030]], ENSEMBLEACCURACY[2],ID["EPSG",6326]],ID["EPSG",4326]],CONVERSION["UTM zone 31N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",3,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16031]],CS[Cartesian,2,ID["EPSG",4400]],AXIS["Easting (E)",east],AXIS["Northing (N)",north],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",32631]]',
        proj4: "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs +type=crs",
        bbox: [84, 0, 0, 6],
        unit: "metre",
        accuracy: null
    },
    '4258': {
        code: "4258",
        kind: "CRS-GEOGCRS",
        name: "ETRS89",
        wkt: "GEOGCRS[\"ETRS89\",ENSEMBLE[\"European Terrestrial Reference System 1989 ensemble\", MEMBER[\"European Terrestrial Reference Frame 1989\", ID[\"EPSG\",1178]], MEMBER[\"European Terrestrial Reference Frame 1990\", ID[\"EPSG\",1179]], MEMBER[\"European Terrestrial Reference Frame 1991\", ID[\"EPSG\",1180]], MEMBER[\"European Terrestrial Reference Frame 1992\", ID[\"EPSG\",1181]], MEMBER[\"European Terrestrial Reference Frame 1993\", ID[\"EPSG\",1182]], MEMBER[\"European Terrestrial Reference Frame 1994\", ID[\"EPSG\",1183]], MEMBER[\"European Terrestrial Reference Frame 1996\", ID[\"EPSG\",1184]], MEMBER[\"European Terrestrial Reference Frame 1997\", ID[\"EPSG\",1185]], MEMBER[\"European Terrestrial Reference Frame 2000\", ID[\"EPSG\",1186]], MEMBER[\"European Terrestrial Reference Frame 2005\", ID[\"EPSG\",1204]], MEMBER[\"European Terrestrial Reference Frame 2014\", ID[\"EPSG\",1206]], MEMBER[\"European Terrestrial Reference Frame 2020\", ID[\"EPSG\",1382]], ELLIPSOID[\"GRS 1980\",6378137,298.257222101,LENGTHUNIT[\"metre\",1,ID[\"EPSG\",9001]],ID[\"EPSG\",7019]], ENSEMBLEACCURACY[0.1],ID[\"EPSG\",6258]],CS[ellipsoidal,2,ID[\"EPSG\",6422]],AXIS[\"Geodetic latitude (Lat)\",north],AXIS[\"Geodetic longitude (Lon)\",east],ANGLEUNIT[\"degree\",0.0174532925199433,ID[\"EPSG\",9102]],ID[\"EPSG\",4258]]",
        proj4: "+proj=longlat +ellps=GRS80 +no_defs +type=crs +axis=neu",
        bbox: [33.26, -16.1, 84.73, 38.01],
        unit: "degree",
        "accuracy": null
    },
    '4230': {
        code: "4230",
        kind: "CRS-GEOGCRS",
        name: "ED50",
        wkt: 'GEOGCRS["ED50",DATUM["European Datum 1950",ELLIPSOID["International 1924",6378388,297,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7022]],ID["EPSG",6230]],CS[ellipsoidal,2,ID["EPSG",6422]],AXIS["Geodetic latitude (Lat)",north],AXIS["Geodetic longitude (Lon)",east],ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",4230]]',
        proj4: "+proj=longlat +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +no_defs +type=crs +axis=neu",
        bbox: [84.73, -16.1, 25.71, 48.61],
        unit: "degree",
        accuracy: 10
    },
    '3040': {
        code: "3040",
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 28N (N-E)",
        wkt: 'PROJCRS["ETRS89 / UTM zone 28N (N-E)",BASEGEOGCRS["ETRS89",ENSEMBLE["European Terrestrial Reference System 1989 ensemble", MEMBER["European Terrestrial Reference Frame 1989", ID["EPSG",1178]], MEMBER["European Terrestrial Reference Frame 1990", ID["EPSG",1179]], MEMBER["European Terrestrial Reference Frame 1991", ID["EPSG",1180]], MEMBER["European Terrestrial Reference Frame 1992", ID["EPSG",1181]], MEMBER["European Terrestrial Reference Frame 1993", ID["EPSG",1182]], MEMBER["European Terrestrial Reference Frame 1994", ID["EPSG",1183]], MEMBER["European Terrestrial Reference Frame 1996", ID["EPSG",1184]], MEMBER["European Terrestrial Reference Frame 1997", ID["EPSG",1185]], MEMBER["European Terrestrial Reference Frame 2000", ID["EPSG",1186]], MEMBER["European Terrestrial Reference Frame 2005", ID["EPSG",1204]], MEMBER["European Terrestrial Reference Frame 2014", ID["EPSG",1206]], MEMBER["European Terrestrial Reference Frame 2020", ID["EPSG",1382]], ELLIPSOID["GRS 1980",6378137,298.257222101,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7019]], ENSEMBLEACCURACY[0.1],ID["EPSG",6258]],ID["EPSG",4258]],CONVERSION["UTM zone 28N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-15,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16028]],CS[Cartesian,2,ID["EPSG",4500]],AXIS["Northing (N)",north],AXIS["Easting (E)",east],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",3040]]',
        proj4: "+proj=utm +zone=28 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs +axis=neu",
        bbox: [72.44, -16.1, 34.93, -11.99],
        unit: "metre",
        accuracy: 1
    },
    '3041': {
        code: "3041",
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 29N (N-E)",
        wkt: 'PROJCRS["ETRS89 / UTM zone 29N (N-E)",BASEGEOGCRS["ETRS89",ENSEMBLE["European Terrestrial Reference System 1989 ensemble", MEMBER["European Terrestrial Reference Frame 1989", ID["EPSG",1178]], MEMBER["European Terrestrial Reference Frame 1990", ID["EPSG",1179]], MEMBER["European Terrestrial Reference Frame 1991", ID["EPSG",1180]], MEMBER["European Terrestrial Reference Frame 1992", ID["EPSG",1181]], MEMBER["European Terrestrial Reference Frame 1993", ID["EPSG",1182]], MEMBER["European Terrestrial Reference Frame 1994", ID["EPSG",1183]], MEMBER["European Terrestrial Reference Frame 1996", ID["EPSG",1184]], MEMBER["European Terrestrial Reference Frame 1997", ID["EPSG",1185]], MEMBER["European Terrestrial Reference Frame 2000", ID["EPSG",1186]], MEMBER["European Terrestrial Reference Frame 2005", ID["EPSG",1204]], MEMBER["European Terrestrial Reference Frame 2014", ID["EPSG",1206]], MEMBER["European Terrestrial Reference Frame 2020", ID["EPSG",1382]], ELLIPSOID["GRS 1980",6378137,298.257222101,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7019]], ENSEMBLEACCURACY[0.1],ID["EPSG",6258]],ID["EPSG",4258]],CONVERSION["UTM zone 29N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-9,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16029]],CS[Cartesian,2,ID["EPSG",4500]],AXIS["Northing (N)",north],AXIS["Easting (E)",east],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",3041]]',
        proj4: "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs +axis=neu",
        bbox: [74.13, -12, 34.91, -6],
        unit: "metre",
        accuracy: 1
    },
    '3042': {
        code: "3042",
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 30N (N-E)",
        wkt: 'PROJCRS["ETRS89 / UTM zone 30N (N-E)",BASEGEOGCRS["ETRS89",ENSEMBLE["European Terrestrial Reference System 1989 ensemble", MEMBER["European Terrestrial Reference Frame 1989", ID["EPSG",1178]], MEMBER["European Terrestrial Reference Frame 1990", ID["EPSG",1179]], MEMBER["European Terrestrial Reference Frame 1991", ID["EPSG",1180]], MEMBER["European Terrestrial Reference Frame 1992", ID["EPSG",1181]], MEMBER["European Terrestrial Reference Frame 1993", ID["EPSG",1182]], MEMBER["European Terrestrial Reference Frame 1994", ID["EPSG",1183]], MEMBER["European Terrestrial Reference Frame 1996", ID["EPSG",1184]], MEMBER["European Terrestrial Reference Frame 1997", ID["EPSG",1185]], MEMBER["European Terrestrial Reference Frame 2000", ID["EPSG",1186]], MEMBER["European Terrestrial Reference Frame 2005", ID["EPSG",1204]], MEMBER["European Terrestrial Reference Frame 2014", ID["EPSG",1206]], MEMBER["European Terrestrial Reference Frame 2020", ID["EPSG",1382]], ELLIPSOID["GRS 1980",6378137,298.257222101,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7019]], ENSEMBLEACCURACY[0.1],ID["EPSG",6258]],ID["EPSG",4258]],CONVERSION["UTM zone 30N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",-3,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16030]],CS[Cartesian,2,ID["EPSG",4500]],AXIS["Northing (N)",north],AXIS["Easting (E)",east],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",3042]]',
        proj4: "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs +axis=neu",
        bbox: [80.49, -6, 35.26, 0.01],
        unit: "metre",
        accuracy: 1
    },
    '3043': {
        code: "3043",
        kind: "CRS-PROJCRS",
        name: "ETRS89 / UTM zone 31N (N-E)",
        wkt: 'PROJCRS["ETRS89 / UTM zone 31N (N-E)",BASEGEOGCRS["ETRS89",ENSEMBLE["European Terrestrial Reference System 1989 ensemble", MEMBER["European Terrestrial Reference Frame 1989", ID["EPSG",1178]], MEMBER["European Terrestrial Reference Frame 1990", ID["EPSG",1179]], MEMBER["European Terrestrial Reference Frame 1991", ID["EPSG",1180]], MEMBER["European Terrestrial Reference Frame 1992", ID["EPSG",1181]], MEMBER["European Terrestrial Reference Frame 1993", ID["EPSG",1182]], MEMBER["European Terrestrial Reference Frame 1994", ID["EPSG",1183]], MEMBER["European Terrestrial Reference Frame 1996", ID["EPSG",1184]], MEMBER["European Terrestrial Reference Frame 1997", ID["EPSG",1185]], MEMBER["European Terrestrial Reference Frame 2000", ID["EPSG",1186]], MEMBER["European Terrestrial Reference Frame 2005", ID["EPSG",1204]], MEMBER["European Terrestrial Reference Frame 2014", ID["EPSG",1206]], MEMBER["European Terrestrial Reference Frame 2020", ID["EPSG",1382]], ELLIPSOID["GRS 1980",6378137,298.257222101,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",7019]], ENSEMBLEACCURACY[0.1],ID["EPSG",6258]],ID["EPSG",4258]],CONVERSION["UTM zone 31N",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",0,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8801]],PARAMETER["Longitude of natural origin",3,ANGLEUNIT["degree",0.0174532925199433,ID["EPSG",9102]],ID["EPSG",8802]],PARAMETER["Scale factor at natural origin",0.9996,SCALEUNIT["unity",1,ID["EPSG",9201]],ID["EPSG",8805]],PARAMETER["False easting",500000,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8806]],PARAMETER["False northing",0,LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",8807]],ID["EPSG",16031]],CS[Cartesian,2,ID["EPSG",4500]],AXIS["Northing (N)",north],AXIS["Easting (E)",east],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",3043]]',
        proj4: "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs +axis=neu",
        bbox: [82.45, 0, 37, 6.01],
        unit: "metre",
        accuracy: 1
    },
};

for (const code of Object.keys(projectionDataCache)) {
    const obj = projectionDataCache[code];
    if (obj.proj4.includes('+proj=longlat')) {
        proj4.defs('EPSG:' + code, obj.wkt);
        proj4.defs('EPSG:' + code).units = 'degrees';
    }
}

TC.getProjectionData = function (options = {}) {
    const crs = options.crs || '';
    const match = crs.match(/\d{4,6}$/g);
    let code = match ? match[0] : '';
    let projData = projectionDataCache[code];
    if (projData) {
        if (options.sync) {
            return projData;
        }
        return Promise.resolve(projData);
    }

    if (options.sync) {
        const request = function (url) {
            let result = false;
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
            return result;
        };

        // Buscamos la definición del código EPSG en el archivo JSON agregado por sus 3 últimos dígitos.
        const jsonObj = JSON.parse(request(`${TC.apiLocation}resources/data/crs/${code.substring(code.length - 3)}.json`));
        projectionDataCache[code] = jsonObj[code];
        return jsonObj[code];
    }
    // Buscamos la definición del código EPSG en el archivo JSON agregado por sus 3 últimos dígitos.
    return fetch(`${TC.apiLocation}resources/data/crs/${code.substring(code.length - 3)}.json`)
        .then((response) => {
            return response
                .json()
                .then((json) => {
                    projectionDataCache[code] = json[code];
                    return json[code];
                })
                .catch(() => false);
        })
        .catch(() => false);
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
            axisUnawareDef = { ...def };
            def = { ...def };
            if (axisUnawareDef.axis) {
                delete axisUnawareDef.axis;
            }
        }
        else if (typeof def === 'string') {
            axisUnawareDef = def.replace('+axis=neu', '');
        }
        try {
            proj4.defs(epsgCode, def);
        }
        catch (e) {
            // proj4 no es compatible con los CRS que especifican el eje Z.
            if (e.message === 'Unknown axis direction: up') return;
            throw e;
        }
        proj4.defs(urnCode, def);
        proj4.defs(urnxCode, def);
        // Por convención, los CRS definidos por URL siempre tienen orden de coordenadas X-Y.
        proj4.defs(ogcHttpUrlCode, axisUnawareDef);
        proj4.defs(ogcHttpUriCode, def);
        if (crs.indexOf(ogcHttpUrlPrefix) === 0) {
            // El CRS es tipo URL, usado seguramente en un GML.
            proj4.defs(crs, axisUnawareDef);
            if (name) getDef(crs).name = name;
        }
        if (globalThis.ol && ol.proj) {
            if (!options.silent) {
                ol.proj.proj4.register(proj4);
            }
        }
        if (name) {
            getDef(epsgCode).name = name;
            getDef(ogcHttpUrlCode).name = name;
            const uriDef = getDef(ogcHttpUriCode);
            if (uriDef) uriDef.name = name;
        }
    };
    const loadDefResponse = function (data) {
        const result = !!data;
        if (result) {
            loadDef(data.code, data.wkt || data.proj4, data.name);
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

const projDataEntries = Object.entries(projectionDataCache);
for (let i = 0; i < projDataEntries.length; i++) {
    const projData = projDataEntries[i][1];
    TC.loadProjDef({
        crs: 'EPSG:' + projData.code,
        name: projData.name,
        def: projData.proj4,
        silent: i < projDataEntries.length - 1,
    });
}

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
        options = { ...options };

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
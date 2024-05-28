/**
 * @overview API SITNA: API JavaScript para la visualización de datos georreferenciados en aplicaciones web.
 * @version 4.2.0
 * @copyright 2019 Gobierno de Navarra
 * @license BSD-2-Clause
 * @author Fernando Lacunza <flacunza@itracasa.es>
 */

import TC from './TC';
import Util from './TC/Util';
import Consts from './TC/Consts';
import i18n from './TC/i18n';
import SitnaMap from './SITNA/Map';
import Feature from './SITNA/feature/Feature';
import Point from './SITNA/feature/Point';
import MultiPoint from './SITNA/feature/MultiPoint';
import Marker from './SITNA/feature/Marker';
import MultiMarker from './SITNA/feature/MultiMarker';
import Polyline from './SITNA/feature/Polyline';
import MultiPolyline from './SITNA/feature/MultiPolyline';
import Polygon from './SITNA/feature/Polygon';
import MultiPolygon from './SITNA/feature/MultiPolygon';
import Circle from './SITNA/feature/Circle';
import Layer from './SITNA/layer/Layer';
import Raster from './SITNA/layer/Raster';
import Vector from './SITNA/layer/Vector';
import './TC/tool/ExcelExport';
import './TC/tool/Proxification';
import Map from './TC/Map';
import Cfg from './TC/Cfg';
import wrap from './TC/wrap';
import { JL } from 'jsnlog';
// Importamos para precargar estilos y evitar FOUC
import Button from './SITNA/ui/Button';
import './SITNA/ui/Toggle';
import './SITNA/ui/Tab';

TC.isDebug = true;

const layer = {
    Layer,
    Raster,
    Vector
};

const feature = {
    Feature,
    Point,
    MultiPoint,
    Marker,
    MultiMarker,
    Polyline,
    MultiPolyline,
    Polygon,
    MultiPolygon,
    Circle
};

const ui= {
    Button: Button
}

const tool = TC.tool || {};

TC.feature = feature;
TC.layer = layer;
TC.tool = tool;
TC.Util = Util;
TC.Consts = Consts;
TC.i18n = i18n;
TC.Cfg = Cfg;
TC.Map = Map;
TC.wrap = wrap;
globalThis.TC = globalThis.TC || TC;
//window.JL = JL;

TC.version = '4.2.0';

TC.loadCSS(TC.apiLocation + 'css/sitna.css');

// Precargamos el CRS por defecto
TC.loadProjDef({ crs: 'EPSG:25830', name: 'ETRS89 / UTM zone 30N', def: '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs' });
// Precargamos los CRS de IDENA que tienen orden de ejes neu
TC.loadProjDef({ crs: 'EPSG:4258', name: 'ETRS89', def: '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +axis=neu' });
TC.loadProjDef({ crs: 'EPSG:3040', name: 'ETRS89 / UTM zone 28N (N-E)', def: '+proj=utm +zone=28 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +axis=neu' });
TC.loadProjDef({ crs: 'EPSG:3041', name: 'ETRS89 / UTM zone 29N (N-E)', def: '+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +axis=neu' });
TC.loadProjDef({ crs: 'EPSG:3042', name: 'ETRS89 / UTM zone 30N (N-E)', def: '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +axis=neu' });
TC.loadProjDef({ crs: 'EPSG:3043', name: 'ETRS89 / UTM zone 31N (N-E)', def: '+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +axis=neu' });
TC.loadProjDef({ crs: 'EPSG:4230', name: 'ED50', def: '+proj=longlat +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +no_defs +axis=neu' });
//resto de CRS nacionales
TC.loadProjDef({ crs: 'EPSG:25828', name: 'ETRS89 / UTM zone 28N', def: '+proj=utm +zone=28 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs' });
TC.loadProjDef({ crs: 'EPSG:25829', name: 'ETRS89 / UTM zone 29N', def: '+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs' });
TC.loadProjDef({ crs: 'EPSG:25831', name: 'ETRS89 / UTM zone 31N', def: '+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs' });


// Método que se usa en varios proyectos
// TODO: eliminar de todos los sitios
if (!Object.prototype.hasOwnProperty.call(Array.prototype, 'findByProperty')) {
    Object.defineProperty(Array.prototype, "findByProperty", {
        enumerable: false,
        writable: true,
        value: function (propertyName, value) {
            for (var i = 0; i < this.length; i++) {
                if (this[i][propertyName] == value)
                    return this[i];
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {

    // Completamos los datos de versión
    var mapLibrary = 'Unknown library';
    if (window.ol) {
        mapLibrary = 'OpenLayers ' + ol.VERSION;
    }
    TC.version = TC.version + ' (' + mapLibrary + '; @ ' + TC.apiLocation + ')';

    TC.browser = Util.getBrowser();

    fetch(TC.apiLocation + 'config/browser-versions.json')
        .then(r => {
            if (r.ok) {
                return r.json();
            }
            return Promise.resolve([]);
        })
        .then(browserVersions => {
            TC._isSupported = true;
            TC.Cfg.acceptedBrowserVersions = browserVersions;

            const match = browserVersions.find(item => item.name.toLowerCase() === TC.browser.name.toLowerCase());

            // GLS: 14/02/2019 Añadimos gestión para que no muestre tostada ni envíe correos en caso de que el navegador sea uno expirado
            if (match && match.expired) {
                TC.Cfg.loggingErrorsEnabled = false;
            } else {
                if (match && !Number.isNaN(match.version)) {
                    if (TC.browser.version < match.version) {
                        TC._isSupported = false;
                    }
                }

                if (TC.Cfg.oldBrowserAlert && !TC._isSupported) {
                    TC.Cfg.loggingErrorsEnabled = false;
                    // Timeout para evitar pedir el mapa antes de que se instancie
                    setTimeout(() => {
                        const mapObj = TC.Map.get(document.querySelector('.' + Consts.classes.MAP));

                        TC.i18n.loadResources(!TC.i18n[mapObj.options.locale], TC.apiLocation + 'TC/resources/', mapObj.options.locale).then(function () {
                            TC.error(Util.getLocaleString(mapObj.options.locale, 'outdatedBrowser'), Consts.msgErrorMode.TOAST);
                        });
                    }, 500);
                }
            }
        });


    if (/ip(ad|hone|od)/i.test(navigator.userAgent)) {
        // En iOS, el primer click es un mouseover, por eso usamos touchstart como sustituto.
        Consts.event.CLICK = "touchstart";
    }

    // Gestión de errores
    if (TC.Cfg.loggingErrorsEnabled) {

        JL.setOptions({
            defaultAjaxUrl: Consts.url.ERROR_LOGGER.includes('//localhost') ? '' : Consts.url.ERROR_LOGGER
        });

        const onError = (function () {
            var errorCount = 0;

            var mapObj;

            return function (e) {
                mapObj = mapObj || TC.Map.get(document.querySelector('.' + Consts.classes.MAP));

                if (!mapObj) {
                    return false;
                }

                var errorMsg, url = "", lineNumber = -1, column = -1, errorObj, apiError;

                if (e.type === "unhandledrejection") {
                    errorMsg = e.reason ?
                        e.reason instanceof XMLDocument ? e.reason.firstElementChild.outerHTML : e.reason.message
                        : "";
                    if (e.reason && e.reason.stack) {
                        apiError = e.reason.stack.indexOf(TC.apiLocation) >= 0;
                    } else {
                        apiError = true;
                    }
                    errorObj = e.reason;
                } else {
                    errorMsg = e.message;
                    url = e.filename;
                    lineNumber = e.lineno;
                    column = e.colno;
                    errorObj = e.error;
                    apiError = url.indexOf(TC.apiLocation) >= 0;
                }

                // Si notifyApplicationErrors === false solo capturamos los errores de la API
                if ((TC.Cfg.notifyApplicationErrors || apiError) && errorCount < TC.Cfg.maxErrorCount && TC.Cfg.loggingErrorsEnabled) {
                    // Send object with all data to server side log, using severity fatal, 
                    // from logger "onerrorLogger"

                    const previousMapState = mapObj.getPreviousMapState();

                    // 13/03/2020 añadimos el estado de los controles a la URL que se enviará por correo
                    const endProcess = function (appUrl) {
                        var msg = apiError ? Consts.text.API_ERROR : Consts.text.APP_ERROR;
                        JL("onerrorLogger").fatalException({
                            "msg": msg,
                            "errorMsg": errorMsg,
                            "url": url,
                            "lineNumber": lineNumber,
                            "column": column,
                            "appUrl": appUrl,
                            "apiVersion": TC.version,
                            "prevState": previousMapState,
                            "userAgent": navigator.userAgent
                        }, errorObj);
                        errorCount++;
                    };

                    let appUrl = location.href;
                    const controlStates = mapObj.exportControlStates() || [];
                    if (controlStates.length > 0) {
                        var currentUrl = location.href;
                        const hashPosition = currentUrl.indexOf('#');
                        if (hashPosition > 0) {
                            currentUrl = currentUrl.substring(0, hashPosition);
                        }

                        mapObj.getMapState({ extraStates: { ctl: controlStates } }).then(state => {
                            appUrl = currentUrl.concat("#", state);
                            endProcess(appUrl);
                        });
                    }
                    else {
                        endProcess(appUrl);
                    }

                    if (!TC.isDebug) {
                        var DEFAULT_CONTACT_EMAIL = "webmaster@itracasa.es";
                        TC.i18n.loadResources(!TC.i18n[mapObj.options.locale], TC.apiLocation + 'TC/resources/', mapObj.options.locale)
                            .then(function () {
                                TC.error(Util.getLocaleString(mapObj.options.locale, "genericError") + (mapObj.options.contactEmail || DEFAULT_CONTACT_EMAIL), { type: Consts.msgType.ERROR });
                            });
                    }
                }
                // Tell browser to run its own error handler as well   
                return false;
            };
        })();

        window.addEventListener('error', onError, false);
        window.addEventListener('unhandledrejection', onError, false);
    }
});

/**
 * Espacio de nombres donde se encuentran las clases de la API SITNA.
 * @namespace SITNA
 */

Cfg.layout = TC.apiLocation + 'layout/responsive';

export { Cfg, SitnaMap as Map, Consts, feature, layer, tool, ui };


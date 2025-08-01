/**
 * @overview API SITNA: API JavaScript para la visualización de datos georreferenciados en aplicaciones web.
 * @version 4.7.1
 * @copyright 2019 Gobierno de Navarra
 * @license BSD-2-Clause
 * @author Fernando Lacunza <flacunza@itracasa.es>
 */

import TC from './TC.js';
import Util from './TC/Util.js';
import Consts from './TC/Consts.js';
import i18n from './TC/i18n.js';
import SitnaMap from './SITNA/Map.js';
import Feature from './SITNA/feature/Feature.js';
import Point from './SITNA/feature/Point.js';
import MultiPoint from './SITNA/feature/MultiPoint.js';
import Marker from './SITNA/feature/Marker.js';
import MultiMarker from './SITNA/feature/MultiMarker.js';
import Polyline from './SITNA/feature/Polyline.js';
import MultiPolyline from './SITNA/feature/MultiPolyline.js';
import Polygon from './SITNA/feature/Polygon.js';
import MultiPolygon from './SITNA/feature/MultiPolygon.js';
import Circle from './SITNA/feature/Circle.js';
import Layer from './SITNA/layer/Layer.js';
import Raster from './SITNA/layer/Raster.js';
import Vector from './SITNA/layer/Vector.js';
import './TC/tool/ExcelExport.js';
import './TC/tool/Proxification.js';
import Map from './TC/Map.js';
import Cfg from './TC/Cfg.js';
import wrap from './TC/wrap.js';
import { JL } from 'jsnlog';
// Importamos para precargar estilos y evitar FOUC
import Button from './SITNA/ui/Button.js';
import './SITNA/ui/Toggle.js';
import './SITNA/ui/Tab.js';
import filter from './SITNA/filter.js';

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

const ui = {
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

TC.version = '4.7.1';

TC.loadCSS(TC.apiLocation + 'css/sitna.css');

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

export { Cfg, SitnaMap as Map, Consts, feature, layer, tool, filter, ui };



/**
  * Opciones del creador de mapas sin conexión.
  * 
  * Para que ese control funcione correctamente, es necesario cumplir estos dos requisitos:
  *    1. Debe instalarse en el ámbito de la aplicación que contiene el visor el _[Service Worker](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)_ creado para el funcionamiento de este control.
  *    Para ello basta con copiar el archivo [tc-cb-service-worker.js](https://raw.githubusercontent.com/sitna/api-sitna/master/workers/tc-cb-service-worker.js) a la carpeta raíz de dicha aplicación.
  *    2. Debe incluirse en la carpeta de la aplicación un archivo de texto con el nombre `manifest.appcache`. 
  *    Este archivo es un documento de manifiesto de [caché de aplicaciones](https://developer.mozilla.org/es/docs/Web/HTML/Using_the_application_cache#habilitando_cach%C3%A9_de_aplicaciones)[*] 
  *    que contiene una lista de las URL de todos los recursos que tienen que almacenarse en la cache del navegador y así asegurar la carga de la aplicación
  *    en ausencia de conexión a Internet.
  *    
  *    [*]: El estándar de caché de aplicaciones está obsoleto hoy en día y este control no hace realmente uso de él para ejercer su función, pero para funcionar necesita
  *    una lista de todos los recursos a cargar en la cache del navegador, y un manifiesto de caché de aplicaciones es precisamente una lista de ese tipo. 
  *    Se usa este formato por compatibilidad hacia atrás y por ser de un estándar bien documentado.
  * @typedef OfflineMapMakerOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {number} [averageTileSize=31000] - Tamaño medio estimado en bytes para cada una de las teselas del mapa. Este valor se utiliza para estimar el tamaño total que tendrá en disco el mapa sin conexión.
  * @property {HTMLElement|string} [offlineMapHintDiv] - Elemento del DOM en el que crear el indicador de que se está en un mapa offline. Si no se especifica dicho indicador se mostrará superpuesto al área del mapa.
  * @example <caption>[Ver en vivo](../examples/cfg.OfflineMapMakerOptions.html)</caption> {@lang html}
  * <div id="mapa"></div>
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Añadimos el control de selección de capas de fondo en el primer contenedor.
  *     SITNA.Cfg.controls.basemapSelector = {
  *         div: "slot1"
  *     };
  *     // Añadimos el control de creación de mapas sin conexión en el segundo contenedor.
  *     SITNA.Cfg.controls.offlineMapMaker = {
  *         div: "slot2"
  *     };
  *     var map = new SITNA.Map("mapa");
  * </script>
  * @example <caption>Documento de manifiesto [manifest.appcache](../examples/manifest.appcache)</caption> {@lang plain}
  * CACHE MANIFEST
  * # Documento de manifiesto para el ejemplo de uso del control offlineMapMaker
  *
  * CACHE:
  * cfg.MapControlOptions.offlineMapMaker.html
  * examples.css
  * examples.js
  * ../
  * ../css/tcmap.css
  * ../resources/es-ES.json
  * ../config/browser-versions.js
  * ../layout/responsive/style.css
  * ../css/fonts/sitna.woff
  * ../css/fonts/mapskin.woff
  * ../layout/responsive/fonts/fontawesome-webfont.woff?v=4.5.0
  * ../css/img/thumb-orthophoto.jpg
  * ../css/img/thumb-bta.png
  * ../css/img/thumb-basemap.png
  * ../css/img/thumb-cadaster.png
  * layout/ctl-container/config.json
  * layout/ctl-container/style.css
  * layout/ctl-container/script.js
  * layout/ctl-container/markup.html
  * layout/ctl-container/resources/es-ES.json
  * https://idena.navarra.es/ogc/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities
  */

import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Cfg from '../Cfg';
import SWCacheClient from './SWCacheClient';
import md5 from 'md5';

TC.control = TC.control || {};

Consts.classes.CONNECTION_OFFLINE = Consts.classes.CONNECTION_OFFLINE || 'tc-conn-offline';
Consts.classes.CONNECTION_WIFI = Consts.classes.CONNECTION_WIFI || 'tc-conn-wifi';
Consts.classes.CONNECTION_MOBILE = Consts.classes.CONNECTION_MOBILE || 'tc-conn-mobile';
Consts.classes.OFFLINE = Consts.classes.OFFLINE || 'tc-offline';

Consts.event.MAPCACHEDOWNLOAD = Consts.event.MAPCACHEDOWNLOAD || 'mapcachedownload.tc';
Consts.event.MAPCACHEDELETE = Consts.event.MAPCACHEDELETE || 'mapcachedelete.tc';
Consts.event.MAPCACHEPROGRESS = Consts.event.MAPCACHEPROGRESS || 'mapcacheprogress.tc';
Consts.event.MAPCACHEERROR = Consts.event.MAPCACHEERROR || 'mapcacheerror.tc';


const ALREADY_EXISTS = 'already_exists';


const getExtentFromString = function (str) {
    return decodeURIComponent(str).split(',').map(function (elm) {
        return parseFloat(elm);
    });
};

const requestManifest = async function () {
    const manifestFile = document.documentElement.getAttribute('manifest') || 'manifest.appcache';
    const response = await TC.ajax({
        url: Util.addURLParameters(manifestFile, { ts: Date.now() }),
        method: 'GET',
        responseType: 'text'
    });
    let data = response.data.normalize();
    var hash = md5(data);
    var idxEnd = data.indexOf('NETWORK:');
    if (idxEnd >= 0) {
        data = data.substr(0, idxEnd);
    }
    idxEnd = data.indexOf('FALLBACK:');
    if (idxEnd >= 0) {
        data = data.substr(0, idxEnd);
    }
    idxEnd = data.indexOf('SETTINGS:');
    if (idxEnd >= 0) {
        data = data.substr(0, idxEnd);
    }
    var lines = data.split(/[\n\r]/).filter(function (elm) {
        return elm.length > 0 && elm.indexOf('#') !== 0 && elm !== 'CACHE:';
    });
    // Eliminamos la primera línea porque siempre es CACHE MANIFEST
    lines.shift();
    return {
        hash: hash,
        urls: lines
    };
};

const formatNumber = function (number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const findTileMatrixLimits = function (schema, resolution) {
    var result = null;
    for (var i = 0, len = schema.tileMatrixLimits.length; i < len; i++) {
        result = schema.tileMatrixLimits[i];
        if (result.res <= resolution) {
            break;
        }
    }
    return result;
};

class OfflineMapMaker extends SWCacheClient {
    MAP_DEFINITION_PARAM_NAME = "map-def";
    MAP_EXTENT_PARAM_NAME = "map-extent";
    LOCAL_STORAGE_KEY_PREFIX = "SITNA.offline.map.";
    ROOT_CACHE_NAME = "root";
    SERVICE_WORKER_FLAG = 'sw';

    static state = {
        READY: 'ready',
        EDIT: 'editing',
        DOWNLOADING: 'downloading',
        DELETING: 'deleting'
    };
    static action = {
        CREATE: 'create',
        DELETE: 'delete'
    };

    offlineControls = [
        'attribution',
        'basemapSelector',
        'offlineMapMaker',
        'click',
        'coordinates',
        'dataLoader',
        'draw',
        'edit',
        'fileImport',
        'fullScreen',
        'geolocation',
        'loadingIndicator',
        'measure',
        'modify',
        'navBar',
        'popup',
        'print',
        'scale',
        'scaleBar',
        'scaleSelector',
        'state',
        'workLayerManager'
    ];
    #loadedCount;
    #offlineMapHintDiv;
    #selectors;
    #state;

    constructor() {
        super(...arguments);
        const self = this;

        const cs = '.' + self.CLASS;
        self.#selectors = {
            DRAW: cs + '-draw',
            DRAWING: cs + '-drawing',
            PROGRESS: cs + '-progress',
            NEW: cs + '-new',
            LIST: cs + '-list',
            LISTITEM: cs + '-list > li',
            OKBTN: cs + '-btn-ok',
            NEWBTN: cs + '-btn-new',
            SAVEBTN: '.tc-btn-save',
            CANCELBTN: '.tc-btn-cancel',
            EDITBTN: '.tc-btn-edit',
            VIEWBTN: '.tc-btn-view',
            DELETEBTN: '.tc-btn-delete',
            TILECOUNT: cs + '-tile-count',
            NAMETB: cs + '-txt-name',
            TEXTBOX: 'input.tc-textbox',
            EXIT: cs + '-link-exit',
            OFFPANEL: cs + '-off-panel',
            RESOLUTIONPANEL: cs + '-res-panel',
            BLLIST: cs + '-bl-list',
            BLLISTITEM: cs + '-bl-list > li',
            BLLISTTEXT: cs + '-bl-panel-txt',
            RNGMAXRES: cs + '-rng-maxres',
            SEARCH: cs + '-map-available-srch',
            EMPTYLIST: cs + '-map-available-empty',
            OFFLINEHIDDEN: '[data-no-cb]'
        };

        self.storedMaps = [];

        const mapDefString = Util.getParameterByName(self.MAP_DEFINITION_PARAM_NAME);
        const extentString = Util.getParameterByName(self.MAP_EXTENT_PARAM_NAME);
        self.mapIsOffline = !!mapDefString;
        if (mapDefString) {
            self.currentMapDefinition = JSON.parse(window.atob(decodeURIComponent(mapDefString)));
        }
        if (extentString) {
            self.currentMapExtent = getExtentFromString(extentString);
        }

        // Comprobación de disponibilidad de localStorage
        try {
            self.localStorage = window.localStorage;
            const key = "__delete_me__";
            self.localStorage.setItem(key, key);
            self.localStorage.removeItem(key);
        }
        catch (e) {
            self.localStorage = null;
            TC.error(self.getLocaleString('couldNotAccessLocalStorage'));
        }

        // Carga de mapas guardados
        if (self.localStorage) {
            for (var i = 0, len = self.localStorage.length; i < len; i++) {
                var key = self.localStorage.key(i);
                if ((key.indexOf(self.LOCAL_STORAGE_KEY_PREFIX) === 0 || key.indexOf('TC.offline.map.') === 0) &&
                    key !== self.LOCAL_STORAGE_KEY_PREFIX + self.ROOT_CACHE_NAME + '.hash' && 
                    key !== 'TC.offline.map.' + self.ROOT_CACHE_NAME + '.hash') {
                    // Es un nombre de mapa y no es el hash de integridad de la cache root
                    var values = self.localStorage.getItem(key).split(" ");
                    var extent = getExtentFromString(values.shift());
                    var name = values.join(" ");
                    var map = {
                        name: name,
                        extent: extent,
                        url: decodeURIComponent(key.substr(self.LOCAL_STORAGE_KEY_PREFIX.length))
                    };
                    self.storedMaps.push(map);
                }
            }
            self.storedMaps.sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });
        }

        var options = Util.extend({}, arguments.length > 1 ? arguments[1] : arguments[0]);
        self._dialogDiv = Util.getDiv(options.dialogDiv);
        if (!options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }

        if (self.mapIsOffline) {
            document.querySelectorAll(self.#selectors.OFFLINEHIDDEN).forEach(function (elm) {
                elm.classList.add(Consts.classes.HIDDEN);
            });
        }

        self.wrap = new TC.wrap.control.OfflineMapMaker(self);

        self.isDownloading = false;
        self.baseLayers = [];

        self.options.averageTileSize = self.options.averageTileSize || Cfg.averageTileSize;
        self.requestSchemas = [];
        self.minResolution = 0;
        self.currentMap = null;

        self.#loadedCount = 0;

        // Actualización del enlace al modo online
        // Parche para detectar cambios en el hash. Lo usamos para actualizar los enlaces a los idiomas
        var pushState = history.pushState;
        history.pushState = function (_state) {
            var result;
            //if (typeof history.onpushstate == "function") {
            //    history.onpushstate({ state: state });
            //}
            result = pushState.apply(history, arguments);
            if (self.#offlineMapHintDiv) {
                self.#offlineMapHintDiv.querySelector(self.#selectors.EXIT).setAttribute('href', self.getOnlineMapUrl());
            }
            return result;
        };

        // Detección de estado de conexión
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
        const onlineHandler = function () {
            if (self.#offlineMapHintDiv) {
                const panel = self.#offlineMapHintDiv.querySelector(self.#selectors.OFFPANEL);
                panel.classList.remove(
                    Consts.classes.CONNECTION_OFFLINE,
                    Consts.classes.CONNECTION_MOBILE,
                    Consts.classes.CONNECTION_WIFI);

                var type = connection.type;
                switch (type) {
                    case 1:
                    case 2:
                    case undefined:
                        panel.classList.add(Consts.classes.CONNECTION_WIFI);
                        break;
                    default:
                        panel.classList.add(Consts.classes.CONNECTION_MOBILE);
                        break;
                }
            }
        };
        const offlineHandler = function () {
            if (self.#offlineMapHintDiv) {
                const panel = self.#offlineMapHintDiv.querySelector(self.#selectors.OFFPANEL);
                panel.classList.add(Consts.classes.CONNECTION_OFFLINE);
                panel.classList.remove(Consts.classes.CONNECTION_MOBILE, Consts.classes.CONNECTION_WIFI);
            }
        };
        if (connection.addEventListener) {
            connection.addEventListener('typechange', onlineHandler);
        }
        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', offlineHandler);
        self.renderPromise().then(() => {
            if (!navigator.onLine) {
                offlineHandler();
            }
        });
    }

    async register(map) {
        const self = this;

        const swCacheClientPromise = super.register.call(self, map);

        self.getServiceWorker().then(
            function () {
                navigator.serviceWorker.ready.then(function () {
                    navigator.serviceWorker.addEventListener('message', function (event) {
                        switch (event.data.event) {
                            case 'progress':
                                self.trigger(Consts.event.MAPCACHEPROGRESS, {
                                    url: event.data.name,
                                    requestId: event.data.requestId,
                                    loaded: event.data.count,
                                    total: event.data.total
                                });
                                break;
                            case 'cached':
                                self.trigger(Consts.event.MAPCACHEDOWNLOAD, {
                                    url: event.data.name,
                                    requestId: event.data.requestId
                                });
                                break;
                            case 'deleted':
                                self.trigger(Consts.event.MAPCACHEDELETE, { url: event.data.name });
                                break;
                            case 'error':
                                if (event.data.action === OfflineMapMaker.action.CREATE) {
                                    TC.error(self.getLocaleString('cb.resourceDownload.error', { url: event.data.url }));
                                }
                                break;
                            default:
                                break;
                        }
                    });
                });

                if (navigator.onLine) {
                    // Cacheamos mediante service worker las URLs del manifiesto
                    requestManifest().then(function (obj) {
                        const hashStorageKey = self.LOCAL_STORAGE_KEY_PREFIX + self.ROOT_CACHE_NAME + '.hash';
                        var hash;
                        if (self.localStorage) {
                            hash = self.localStorage.getItem(hashStorageKey);
                        }
                        if (hash !== obj.hash) {
                            const firstLoad = !hash;
                            const requestId = self.cacheUrlList(obj.urls);
                            const onCacheDownload = function (e) {
                                if (e.requestId === requestId) {
                                    if (self.localStorage) {
                                        self.localStorage.setItem(hashStorageKey, obj.hash);
                                    }
                                    if (!firstLoad) {
                                        TC.confirm(self.getLocaleString('newAppVersionAvailable'), function () {
                                            location.reload();
                                        });
                                    }
                                    self.off(Consts.event.MAPCACHEDOWNLOAD, onCacheDownload);
                                }
                            };
                            self.on(Consts.event.MAPCACHEDOWNLOAD, onCacheDownload);
                        }
                    });
                }
            },
            function (error) {
                self.renderPromise().then(function () {
                    const container = self.div.querySelector(`.${self.CLASS}-new`);
                    const warning = document.createElement('div');
                    warning.classList.add('tc-alert', 'tc-alert-warning');
                    const header = document.createElement('p');
                    const text = document.createElement('strong');
                    text.innerHTML = self.getLocaleString('offlineMap.error');
                    header.appendChild(text);
                    const reason = document.createElement('p');
                    reason.innerHTML = error.message;
                    warning.appendChild(header);
                    warning.appendChild(reason);
                    container.querySelector(self.#selectors.NEWBTN).classList.add(Consts.classes.HIDDEN);
                    container.appendChild(warning);
                });
            }
        ).catch(() => console.log("No SW available: no events handled"));

        if (self.mapIsOffline) {
            map.div.classList.add(Consts.classes.OFFLINE);

            self.getRenderedHtml(self.CLASS + '-off-panel', { url: self.getOnlineMapUrl() }, function (html) {
                // Si no está especificado, el panel de aviso offline se cuelga del div del mapa
                self.#offlineMapHintDiv = Util.getDiv(self.options.offlineMapHintDiv);
                if (!self.options.offlineMapHintDiv) {
                    map.div.appendChild(self.#offlineMapHintDiv);
                }
                self.#offlineMapHintDiv.innerHTML = html;
                if (!navigator.onLine) {
                    const offPanel = self.#offlineMapHintDiv.querySelector(self.#selectors.OFFPANEL);
                    offPanel.classList.add(Consts.classes.CONNECTION_OFFLINE);
                    offPanel.classList.remove(Consts.classes.CONNECTION_MOBILE, Consts.classes.CONNECTION_WIFI);
                }
                self.#offlineMapHintDiv.querySelector(self.#selectors.EXIT).addEventListener(Consts.event.CLICK, function (e) {
                    TC.confirm(self.getLocaleString('offlineMapExit.confirm'),
                        null,
                        function () {
                            e.preventDefault();
                        });
                });
            });
        }

        const drawId = self.getUID();
        const layerId = self.getUID();
        self.layerPromise = map.addLayer({
            id: layerId,
            type: Consts.layerType.VECTOR,
            stealth: true,
            owner: self,
            styles: {
                line: map.options.styles.line
            }
        });
        self.layer = null;
        const objects = await Promise.all([
            self.layerPromise,
            self.renderPromise()
        ]);
        const layer = self.layer = objects[0];
        self.boxDraw = await map.addControl('draw', {
            id: drawId,
            div: self.div.querySelector(self.#selectors.DRAW),
            mode: Consts.geom.RECTANGLE,
            singleSketch: true
        });
        self.boxDraw.setLayer(layer);
        self.boxDraw
            .on(Consts.event.DRAWSTART, function (_e) {
                self.map.toast(self.getLocaleString('clickOnDownloadAreaOppositeCorner'), { type: Consts.msgType.INFO });
            })
            .on(Consts.event.DRAWEND, function (e) {
                var points = e.feature.geometry[0];
                var pStart = points[0];
                var pEnd = points[2];
                var minx = Math.min(pStart[0], pEnd[0]);
                var maxx = Math.max(pStart[0], pEnd[0]);
                var miny = Math.min(pStart[1], pEnd[1]);
                var maxy = Math.max(pStart[1], pEnd[1]);
                self.setExtent([minx, miny, maxx, maxy]);
                const checkboxes = self._dialogDiv.querySelectorAll('input[type=checkbox]');
                checkboxes.forEach(function (checkbox) {
                    // Comprobamos que la extensión del mapa está disponible a alguna resolución
                    const layer = self.map.getLayer(checkbox.value);
                    var li = checkbox;
                    while (li && li.tagName !== 'LI') {
                        li = li.parentElement;
                    }
                    if (layer.wrap.getCompatibleMatrixSets(map.crs).includes(layer.matrixSet)) {
                        const tml = self.wrap.getRequestSchemas({
                            extent: self.extent,
                            layers: [layer]
                        })[0].tileMatrixLimits;

                        li.classList.toggle(Consts.classes.HIDDEN, !tml.length);
                    }
                    else {
                        li.classList.add(Consts.classes.HIDDEN);
                    }
                });
                const visibleLi = self._dialogDiv.querySelector(self.#selectors.BLLISTITEM + ':not(.' + Consts.classes.HIDDEN + ')');
                self._dialogDiv.querySelector(self.#selectors.BLLISTTEXT).innerHTML = self.getLocaleString(visibleLi ? 'selectAtLeastOne' : 'cb.noMapsAtSelectedExtent');

                self.#updateThumbnails();
                self.#showEstimatedMapSize();
                Util.showModal(self._dialogDiv.querySelector(`.${self.CLASS}-dialog`), {
                    openCallback: function () {
                        setTimeout(function () { // Este timeout evita el pulsado accidental cuando sale el diálogo
                            checkboxes.forEach(function (cb) {
                                cb.disabled = false;
                            });
                        }, 100);
                        var time;
                        if (Date.prototype.toLocaleString) {
                            var opt = {};
                            opt.year = opt.month = opt.day = opt.hour = opt.minute = opt.second = 'numeric';
                            time = new Date().toLocaleString(self.map.options.locale.replace('_', '-'), opt);
                        }
                        else {
                            time = new Date().toString();
                        }
                        self._dialogDiv.querySelector(self.#selectors.NAMETB).value = time;
                        self.#updateReadyState();
                    },
                    closeCallback: function () {
                        checkboxes.forEach(function (cb) {
                            cb.disabled = true;
                        });
                        self.boxDraw.layer.clearFeatures();
                    }
                });
            });

        map.on(Consts.event.CONTROLDEACTIVATE, function (e) {
            if (self.boxDraw === e.control) {
                if (self.#state === OfflineMapMaker.state.EDITING) {
                    self.setReadyState();
                }
            }
        });

        var addRenderedListNode = function (layer) {
            var result = false;
            const blList = self._dialogDiv.querySelector(self.#selectors.BLLIST);
            const isLayerAdded = function () {
                return !!blList.querySelector('li[data-layer-uid="' + layer.id + '"]');
            };
            var isValidLayer = layer.type === Consts.layerType.WMTS && !layer.mustReproject;
            if (Util.detectSafari() && Util.detectIOS()) {
                isValidLayer = isValidLayer && Util.isSameOrigin(layer.url);
            }
            if (isValidLayer && !isLayerAdded()) {
                result = true;
                self.getRenderedHtml(self.CLASS + '-bl-node', layer, function (html) {
                    if (!isLayerAdded()) {
                        const parser = new DOMParser();
                        blList.appendChild(parser.parseFromString(html, 'text/html').body.firstChild);
                    }
                });
            }
            return result;
        };

        const addLayer = function (layer) {
            if (layer.isBase && self.mapIsOffline) {
                // Capamos las resoluciones de la capa
                const resolutions = layer.getResolutions();
                if (resolutions) {
                    const cachedResolutions = resolutions.filter(r => r >= self.currentMapDefinition.res);
                    if (cachedResolutions.length) {
                        layer.setResolutions(cachedResolutions);
                    }
                }
            }
            //14/03/2019 GLS: esperamos a que se haya renderizado el dialogo para obtener la lista
            self.renderPromise().then(function () {
                addRenderedListNode(layer);
            });
        };

        map
            .on(Consts.event.LAYERADD, function (e) {
                addLayer(e.layer);
            })
            .on(Consts.event.LAYERREMOVE, function (e) {
                //14/03/2019 GLS: esperamos a que se haya renderizado el dialogo para obtener la lista
                self.renderPromise().then(function () {
                    const layer = e.layer;
                    if (layer.type === Consts.layerType.WMTS) {
                        const li = self._dialogDiv
                            .querySelector(self.#selectors.BLLIST)
                            .querySelector('li[data-layer-uid="' + layer.id + '"]');
                        li.parentElement.removeChild(li);
                    }
                });
            })
            .on(Consts.event.PROJECTIONCHANGE, function (_e) {
                map.baseLayers.forEach(l => addLayer(l));
            });

        map.ready(function () {
            if (self.mapIsOffline) {
                // Deshabilitamos los controles que no son usables en modo offline
                var offCtls = [];
                self.offlineControls.forEach(function (offCtl) {
                    offCtl = offCtl.substr(0, 1).toUpperCase() + offCtl.substr(1);
                    offCtls = offCtls.concat(map.getControlsByClass('TC.control.' + offCtl));
                });

                const disablingReason = self.getLocaleString('thisControlCannotBeUsedInOfflineMode');

                map.controls.forEach(function enableOrDisable(control) {
                    if (offCtls.indexOf(control) < 0) {
                        control.disable({ reason: disablingReason });
                    }
                });

                document.querySelectorAll(self.#selectors.OFFLINEHIDDEN).forEach(function (elm) {
                    elm.classList.add(Consts.classes.HIDDEN);
                });
            }
        });

        map.loaded(function () {

            self.layerPromise.then(function (layer) {
                map.putLayerOnTop(layer);
            });

            self.renderPromise().then(function () {
                self.div.querySelector(self.#selectors.NEWBTN).disabled = false;
                map.baseLayers.forEach(addRenderedListNode);
            });

            if (self.mapIsOffline) {
                const mapDef = self.currentMapDefinition;
                const isSameLayer = function (layer, mapDefLayer) {
                    const layerUrl = layer.url.indexOf('//') === 0 ? location.protocol + layer.url : layer.url;
                    return layerUrl === mapDef.url[mapDefLayer.urlIdx] && layer.layerNames === mapDefLayer.id && layer.matrixSet === mapDef.tms[mapDefLayer.tmsIdx];
                };
                // Añadimos al mapa las capas guardadas que no están por defecto
                const missingLayers = map.options.availableBaseLayers
                    .filter((abl) => abl.type === Consts.layerType.WMTS) // Capas cacheables
                    .filter((abl) => { // Que estén en el mapa sin conexión
                        return mapDef.layers.some((l) => isSameLayer(abl, l));
                    })
                    .filter((abl) => { // Que no estén en las capas por defecto
                        return !map.baseLayers.some((l) => l.id === abl.id);
                    });
                Promise.all(missingLayers.map((layer) => {
                    return map.addLayer(Util.extend({}, layer, { isBase: true }));
                })).finally(function () {
                    // Obtenemos las capas cacheadas
                    const cachedLayers = [];
                    for (var i = 0, ii = mapDef.layers.length; i < ii; i++) {
                        for (var j = 0, jj = map.baseLayers.length; j < jj; j++) {
                            const baseLayer = map.baseLayers[j];
                            if (baseLayer && baseLayer.type === Consts.layerType.WMTS && isSameLayer(baseLayer, mapDef.layers[i])) {
                                cachedLayers.push(baseLayer);
                                break;
                            }
                        }
                    }
                    if (cachedLayers.length) {
                        map.setBaseLayer(cachedLayers[0], function () {
                            // Quitamos las capas no disponibles (la capa en blanco la mantenemos)
                            for (var i = map.baseLayers.length - 1; i >= 0; i--) {
                                const baseLayer = map.baseLayers[i];
                                if (baseLayer && baseLayer.type !== Consts.layerType.VECTOR && !cachedLayers.includes(baseLayer)) {
                                    map.removeLayer(baseLayer);
                                }
                            }

                            map.setExtent(self.currentMapExtent, { animate: false, contain: true });
                        });
                    }
                });
            }
        });

        self
            .on(Consts.event.MAPCACHEDOWNLOAD, function (e) {
                self.isDownloading = false;
                const removeHash = function (url) {
                    const hashIdx = url.indexOf('#');
                    return hashIdx >= 0 ? url.substr(0, hashIdx) : url;
                };
                const url = removeHash(e.url);
                const li = self.#getListElementByMapUrl(url);
                if (li && !self.serviceWorkerEnabled) {
                    // Se ha descargado un mapa cuando se quería borrar. Pasa cuando la cache ya estaba borrada pero la entrada en localStorage no.
                    li.classList.remove(Consts.classes.DISABLED);
                    TC.alert(self.getLocaleString('cb.delete.error'));
                }
                else {
                    if (self.currentMap && url === self.currentMap.url) {
                        self.#addMap();
                        map.toast(self.getLocaleString('mapDownloaded', { mapName: self.currentMap.name }));
                    }
                }
                self.currentMap = null;
                self.setReadyState();
            })
            .on(Consts.event.MAPCACHEDELETE, function (e) {
                self.isDownloading = false;
                var mapName = self.#removeMap(e.url) || self.currentMap && self.currentMap.name;
                self.currentMap = null;
                if (mapName) {
                    map.toast(self.getLocaleString('mapDeleted', { mapName: mapName }));
                }
                self.setReadyState();
            })
            .on(Consts.event.MAPCACHEPROGRESS, function (e) {
                var total = e.total;
                if (!total && self.requestSchemas) {
                    total = self.requestSchemas[0].tileCount;
                }
                var loaded = e.loaded;
                if (loaded) {
                    self.#loadedCount = loaded;
                }
                else {
                    self.#loadedCount += 1;
                    loaded = self.#loadedCount;
                }
                self.showDownloadProgress(loaded, total);
            })
            .on(Consts.event.MAPCACHEERROR, function (e) {
                self.isDownloading = false;
                self.setReadyState();
                var msg = self.getLocaleString('cb.mapCreation.error');
                var handleError = true;
                switch (e.reason) {
                    case 'quota':
                        msg += '. ' + self.getLocaleString('cb.mapCreation.error.reasonQuota');
                        break;
                    case 'resource':
                        msg += '. ' + self.getLocaleString('cb.mapCreation.error.reasonResource');
                        break;
                    case 'manifest':
                        if (e.status == '410') {
                            self.#removeMap(e.url);
                        }
                        handleError = false;
                        break;
                    case ALREADY_EXISTS:
                        msg += '. ' + self.getLocaleString('cb.mapCreation.error.reasonAlreadyExists');
                        break;
                    default:
                        break;
                }
                if (handleError) {
                    if (Util.detectIE()) {
                        TC.error(msg);
                        TC.alert(self.getLocaleString('cb.mapCreation.error.reasonEdge'));
                    }
                    else {
                        TC.alert(msg);
                    }
                }
                self.currentMap = null;
            });

        await swCacheClientPromise;
        return self;
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-omm.mjs');
        const mapNodeTemplatePromise = import('../templates/tc-ctl-omm-map-node.mjs');
        const baseLayerNodeTemplatePromise = import('../templates/tc-ctl-omm-bl-node.mjs');
        const dialogTemplatePromise = import('../templates/tc-ctl-omm-dialog.mjs');
        const offlinePanelTemplatePromise = import('../templates/tc-ctl-omm-off-panel.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-map-node'] = (await mapNodeTemplatePromise).default;
        template[self.CLASS + '-bl-node'] = (await baseLayerNodeTemplatePromise).default;
        template[self.CLASS + '-dialog'] = (await dialogTemplatePromise).default;
        template[self.CLASS + '-off-panel'] = (await offlinePanelTemplatePromise).default;
        self.template = template;
    }

    async render(callback) {
        const self = this;
        self._dialogDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-dialog', null);
        self._dialogDiv.querySelector(self.#selectors.NAMETB).addEventListener(Consts.event.CLICK, function (e) {
            e.preventDefault();
            this.selectionStart = 0;
            this.selectionEnd = this.value.length;
            this.focus();
        });

        const renderObject = { storedMaps: self.storedMaps, listId: self.CLASS + '-list-' + TC.getUID() };
        await self.renderData(renderObject, function () {
            const li = self.#getListElementByMapUrl(location.href);
            if (li) {
                li.classList.add(Consts.classes.ACTIVE);
            }

            self.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
        });

        // Control para evitar que se cancele una descarga de cache al salir de la página
        window.addEventListener('beforeunload', function (e) {
            if (self.isDownloading) {
                var msg = self.getLocaleString('cb.mapDownloading.warning');
                e.returnValue = msg;
                return msg;
            }
        }, true);
    }

    addUIEventListeners() {
        const self = this;
        self._dialogDiv.querySelector(self.#selectors.OKBTN).addEventListener(Consts.event.CLICK, function () {
            self.generateCache();
        }, { passive: true });
        self._dialogDiv.querySelector(self.#selectors.NAMETB).addEventListener('input', function () {
            self.#updateReadyState();
        });
        self.div.querySelector(self.#selectors.NEWBTN).addEventListener(Consts.event.CLICK, function () {
            self.setEditState();
        }, { passive: true });
        self.div.querySelector(`.${self.CLASS}-btn-cancel-draw`).addEventListener(Consts.event.CLICK, function () {
            self.setReadyState();
        }, { passive: true });

        self.div.querySelector(`.${self.CLASS}-btn-cancel-dl`).addEventListener(Consts.event.CLICK, function () {
            self.cancelCacheRequest();
        }, { passive: true });

        const list = self.div.querySelector(self.#selectors.LIST);
        list.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector(self.#selectors.DELETEBTN, function (e) {
            self.startDeleteMap(e.target.parentElement.querySelector('a').innerHTML);
        }), { passive: true });
        list.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector(self.#selectors.EDITBTN, function (e) {
            self.#setNameEditingState(e.target.parentElement);
        }), { passive: true });
        list.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector(self.#selectors.CANCELBTN, function (e) {
            const li = e.target.parentElement;
            li.querySelector(self.#selectors.TEXTBOX).value = li.querySelector('a').innerHTML;
            self.#setNameReadyState(li);
        }), { passive: true });
        list.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector(self.#selectors.SAVEBTN, function (e) {
            const li = e.target.parentElement;
            self.#setNameReadyState(li);
            const anchor = li.querySelector('a');
            const newName = li.querySelector(self.#selectors.TEXTBOX).value;
            const map = self.findStoredMap({ url: anchor.getAttribute('href') });
            if (map) {
                map.name = newName;
                anchor.innerHTML = newName;
                anchor.setAttribute('title', newName);
                self.#saveMapToStorage(map);
            }
        }), { passive: true });
        list.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector(self.#selectors.VIEWBTN, function (e) {
            const btn = e.target;
            var showExtent = !btn.classList.contains(Consts.classes.ACTIVE);
            self.div.querySelectorAll(self.#selectors.VIEWBTN).forEach(b => b.classList.remove(Consts.classes.ACTIVE));
            const mapName = btn.parentElement.querySelector('a').innerHTML;
            if (mapName) {
                var map = self.findStoredMap({ name: mapName });
                if (map) {
                    var extent = getExtentFromString(map.extent);
                    self.layer.clearFeatures();
                    if (showExtent) {
                        self.layer.addPolygon(
                            [
                                [
                                    [extent[0], extent[1]],
                                    [extent[0], extent[3]],
                                    [extent[2], extent[3]],
                                    [extent[2], extent[1]]
                                ]
                            ]
                            , {
                                showsPopup: false,
                                data: {
                                    map: map.name
                                }
                            }).then(function () {
                                self.layer.map.zoomToFeatures(self.layer.features);
                            });
                        btn.classList.add(Consts.classes.ACTIVE);
                        btn.setAttribute('title', self.getLocaleString('removeMapExtent'));
                    }
                }
            }
        }), { passive: true });

        const _filter = function (searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            //tc-ctl-omm-map-available-empty
            const lis = self.div.querySelectorAll(self.#selectors.LISTITEM);
            lis.forEach(function (li) {
                li.style.display = 'none';
            });
            const mapLis = [];
            lis.forEach(function (li) {
                if (li.matches('li:not([class]),li.' + Consts.classes.ACTIVE)) {
                    mapLis.push(li);
                }
            });

            if (searchTerm.length === 0) {
                mapLis.forEach(function (li) {
                    li.style.removeProperty('display');
                });
                self.div.querySelector(`.${self.CLASS}-map-search-icon`).style.visibility = 'visible';
            } else {
                self.div.querySelector(`.${self.CLASS}-map-search-icon`).style.visibility = 'hidden';
                var r = new RegExp(searchTerm, 'i');
                mapLis.forEach(function (li) {
                    li.style.display = r.test(li.querySelector('a').textContent) ? '' : 'none';
                });

                if (!mapLis.some(function (li) {
                    return !li.hidden;
                })) {
                    lis.forEach(function (li) {
                        if (li.matches('[class^="tc-ctl-omm-map-not"]')) {
                            li.style.removeProperty('display');
                        }
                    });
                }
            }
        };

        const trackSearch = self.div.querySelector(self.#selectors.SEARCH);
        const searchListener = function () {
            _filter(this.value.toLowerCase().trim());
        };
        trackSearch.addEventListener('keyup', searchListener);
        trackSearch.addEventListener('search', searchListener);

        self._dialogDiv.querySelector(self.#selectors.BLLIST).addEventListener('change', TC.EventTarget.listenerBySelector('input[type=checkbox]', function (e) {
            const checkbox = e.target;
            if (checkbox.checked) {
                self.baseLayers.push(self.map.getLayer(checkbox.value));
            }
            else {
                for (var i = 0, ii = self.baseLayers.length; i < ii; i++) {
                    const bl = self.baseLayers[i];
                    if (bl.id === checkbox.value) {
                        self.baseLayers.splice(i, 1);
                        break;
                    }
                }
            }
            self.updateRequestSchemas();
            self.#updateResolutions();
            self.#updateThumbnails();
            self.#updateReadyState();
            self.#showEstimatedMapSize();
        }));

        const range = self._dialogDiv.querySelector(self.#selectors.RNGMAXRES);
        const rangeListener = function (e) {
            self.#updateResolutions({
                rangeValue: e.target.value
            });
            self.#updateThumbnails();
            self.#showEstimatedMapSize();
        };
        range.addEventListener('input', rangeListener);
        range.addEventListener('change', rangeListener);
    }

    #setDownloadingState() {
        const self = this;
        self.#state = OfflineMapMaker.state.DOWNLOADING;
        Util.closeModal();
        self.showDownloadProgress(0, 1);
        self.div.querySelector(self.#selectors.NEW).classList.add(Consts.classes.HIDDEN);
        self.div.querySelector(self.#selectors.DRAWING).classList.add(Consts.classes.HIDDEN);
        self.div.querySelector(self.#selectors.PROGRESS).classList.remove(Consts.classes.HIDDEN);
        self._dialogDiv.querySelector(self.#selectors.OKBTN).disabled = true;
        self.div.querySelector(self.#selectors.NEWBTN).disabled = true;
        self.layer.clearFeatures();
        self.boxDraw.cancel();
    }

    #setDeletingState() {
        const self = this;
        self.#state = OfflineMapMaker.state.DELETING;
        self.showDownloadProgress(0, 1);
        self.div.querySelector(self.#selectors.DRAWING).classList.add(Consts.classes.HIDDEN);
        self.div.querySelector(self.#selectors.PROGRESS).classList.add(Consts.classes.HIDDEN);
        self.div.querySelector(self.#selectors.NEW).classList.remove(Consts.classes.HIDDEN);
        self.div.querySelectorAll(self.#selectors.LISTITEM).forEach(function (li) {
            li.classList.add(Consts.classes.DISABLED);
        });
        self._dialogDiv.querySelector(self.#selectors.OKBTN).disabled = true;
        self.div.querySelector(self.#selectors.NEWBTN).disabled = false;
        self._dialogDiv.querySelector(self.#selectors.TILECOUNT).innerHTML = '';
        self.boxDraw.cancel();
    }

    #setNameEditingState(li) {
        const self = this;
        li.querySelector('span').classList.add(Consts.classes.HIDDEN);
        const textbox = li.querySelector(self.#selectors.TEXTBOX);
        textbox.classList.remove(Consts.classes.HIDDEN);
        textbox.value = li.querySelector('span a').innerHTML;
        textbox.focus();
        li.querySelector(self.#selectors.SAVEBTN).classList.remove(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.CANCELBTN).classList.remove(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.EDITBTN).classList.add(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.VIEWBTN).classList.add(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.DELETEBTN).classList.add(Consts.classes.HIDDEN);
    }

    #setNameReadyState(li) {
        const self = this;
        li.querySelector('span').classList.remove(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.TEXTBOX).classList.add(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.SAVEBTN).classList.add(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.CANCELBTN).classList.add(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.EDITBTN).classList.remove(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.VIEWBTN).classList.remove(Consts.classes.HIDDEN);
        li.querySelector(self.#selectors.DELETEBTN).classList.remove(Consts.classes.HIDDEN);
    }

    #updateResolutions(options = {}) {
        const self = this;
        const resDiv = self._dialogDiv.querySelector(`.${self.CLASS}-res`);
        const range = self._dialogDiv.querySelector(self.#selectors.RNGMAXRES);
        var resolutions = self.getResolutions();
        var resText, resLevel, resLeft;
        if (resolutions.length) {
            range.setAttribute('max', resolutions.length - 1);
            if (self.minResolution) {
                // Si ya había resolución previa y no se ha tocado el slider, se actualiza su valor
                if (options.rangeValue === undefined) {
                    for (var i = 0, len = resolutions.length; i < len; i++) {
                        if (self.minResolution >= resolutions[i]) {
                            range.value = i;
                            break;
                        }
                    }
                }
            }
            else {
                if (options.rangeValue === undefined) {
                    // Si no había resolución previa se selecciona un valor inicial igual a la resolución actual
                    const currentResolution = self.map.getResolution();
                    range.value = resolutions.filter(r => r > currentResolution).length;
                }
            }
            resLevel = parseInt(range.value);
            var resValue = Math.floor(new Number(resolutions[resLevel]) * 1000) / 1000;
            resText = self.getLocaleString('metersPerPixel', {
                value: resValue.toLocaleString((self.map ? self.map.options.locale : Cfg.locale).replace('_', '-'))
            });
            resLeft = (resLevel + 1) * 100 / (resolutions.length + 1) + '%';
            range.disabled = false;
            self.minResolution = resolutions[range.value];
        }
        else {
            resLevel = 0;
            resText = '';
            range.value = 0;
            resLeft = '0';
            self.minResolution = 0;
            range.disabled = true;
        }
        self._dialogDiv.querySelector(self.#selectors.RESOLUTIONPANEL).classList.toggle(Consts.classes.HIDDEN, !!range.disabled);
        self._dialogDiv.querySelector(self.#selectors.TILECOUNT).classList.toggle(Consts.classes.HIDDEN, !!range.disabled);

        resDiv.style.left = resLeft;
        resDiv.innerHTML = resText;
    }

    #updateThumbnails() {
        const self = this;
        self._dialogDiv.querySelectorAll(`.${self.CLASS}-bl-node input[type=checkbox]`).forEach(function (cb, _idx) {
            if (cb.checked) {
                var schema = self.requestSchemas.find(function (elm) {
                    return elm.layerId === cb.value;
                });
                if (schema) {
                    var tml = findTileMatrixLimits(schema, self.minResolution);
                    if (tml) {
                        const tmsKey = '{TileMatrixSet}';
                        const tmKey = '{TileMatrix}';
                        const trKey = '{TileRow}';
                        const tcKey = '{TileCol}';
                        var url = schema.url;
                        if (url.indexOf(tmKey) < 0) {
                            // Caso KVP
                            var qsIdx = url.indexOf('?');
                            if (qsIdx >= 0) {
                                url = url.substr(0, qsIdx);
                            }
                            for (var j = 0, lenj = self.baseLayers.length; j < lenj; j++) {
                                var l = self.baseLayers[j];
                                if (l.id === schema.layerId) {
                                    url = url + '?layer=' + l.layerNames + '&style=default&tilematrixset=' + tmsKey +
                                        '&Service=WMTS&Request=GetTile&Version=1.0.0&Format=' + l.format +
                                        '&TileMatrix=' + tmKey + '&TileRow=' + trKey + '&TileCol=' + tcKey;
                                    break;
                                }
                            }
                        }
                        while (cb && cb.tagName !== 'LABEL') {
                            cb = cb.parentElement;
                        }
                        if (cb) {
                            cb.style.backgroundSize = 'auto';
                            cb.style.backgroundPosition = 'left bottom';
                            cb.style.backgroundImage = 'url(' + url
                                .replace(tmsKey, schema.tileMatrixSet)
                                .replace(tmKey, tml.mId)
                                .replace(trKey, tml.rt)
                                .replace(tcKey, tml.cl) + ')';
                        }
                    }
                }
            }
        });
    }

    #formatSize(size) {
        const self = this;
        let result;
        if (size < 1) {
            result = self.getLocaleString('lessThan1Mb');
        }
        else {
            result = self.getLocaleString('approxXMb', { quantity: formatNumber(size) });
        }
        return result;
    }

    #showEstimatedMapSize() {
        const self = this;
        let text = '';
        self.tileCount = 0;
        for (var i = 0, ii = self.requestSchemas.length; i < ii; i++) {
            var schema = self.requestSchemas[i];
            for (var j = 0, jj = schema.tileMatrixLimits.length; j < jj; j++) {
                var tml = schema.tileMatrixLimits[j];
                if (tml.res < self.minResolution) {
                    break;
                }
                self.tileCount += (tml.cr - tml.cl + 1) * (tml.rb - tml.rt + 1);
            }
        }
        if (self.tileCount) {
            self.estimatedMapSize = Math.round(self.tileCount * self.options.averageTileSize / 1048576);
            text = self.getLocaleString('xTiles', { quantity: formatNumber(self.tileCount) }) + ' (' + self.#formatSize(self.estimatedMapSize) + ')';
        }
        self._dialogDiv.querySelector(self.#selectors.TILECOUNT).innerHTML = text;
    }

    #getListElementByMapName(name) {
        const self = this;
        const lis = self.div.querySelectorAll(self.#selectors.LISTITEM);
        for (var i = 0, len = lis.length; i < len; i++) {
            const li = lis[i];
            const anchor = li.querySelector('a');
            if (anchor && anchor.innerHTML === name) {
                return li;
            }
        }
        return null;
    }

    #getListElementByMapUrl(url) {
        const self = this;
        var hashIdx = url.indexOf('#');
        if (hashIdx >= 0) {
            url = url.substr(0, hashIdx);
        }
        const lis = self.div.querySelectorAll(self.#selectors.LISTITEM);
        for (var i = 0, len = lis.length; i < len; i++) {
            const li = lis[i];
            const anchor = li.querySelector('a');
            if (anchor && anchor.getAttribute('href') === url) {
                return li;
            }
        }
        return null;
    }

    #saveMapToStorage(map) {
        const self = this;
        var result = false;
        if (self.localStorage) {
            self.localStorage.setItem(self.LOCAL_STORAGE_KEY_PREFIX + encodeURIComponent(map.url), map.extent + " " + map.name);
            result = true;
        }
        return result;
    }

    #removeMapFromStorage(url) {
        const self = this;
        var result = false;
        if (self.localStorage) {
            self.localStorage.removeItem(self.LOCAL_STORAGE_KEY_PREFIX + encodeURIComponent(url));
            result = true;
        }
        return result;
    }

    #addMap() {
        const self = this;
        const map = self.currentMap;
        if (self.#saveMapToStorage(map)) {
            self.getRenderedHtml(self.CLASS + '-map-node', { name: map.name, url: map.url }, function (html) {
                const parser = new DOMParser();
                self.div.querySelector(self.#selectors.LIST).appendChild(parser.parseFromString(html, 'text/html').body.firstChild);
                self.div.querySelector(self.#selectors.EMPTYLIST).setAttribute('hidden', 'hidden');
                self.div.querySelector(self.#selectors.SEARCH).disabled = false;
            });
            self.storedMaps.push(map);
        }
    }

    #removeMap(url) {
        const self = this;
        const map = self.findStoredMap({ url: url });
        if (map) {
            if (self.#removeMapFromStorage(url)) {
                const li = self.#getListElementByMapName(map.name);
                if (li) {
                    li.parentElement.removeChild(li);
                }
            }
            var idx = self.storedMaps.indexOf(map);
            self.storedMaps.splice(idx, 1);
            if (!self.storedMaps.length) {
                self.div.querySelector(self.#selectors.SEARCH).disabled = true;
                self.div.querySelector(self.#selectors.EMPTYLIST).removeAttribute('hidden');
            }

            self.layer.features
                .filter(f => f.data.map === map.name)
                .forEach(f => self.layer.removeFeature(f));

            return map.name;
        }

        return null;
    }

    setExtent(extent) {
        const self = this;
        if (Array.isArray(extent) && extent.length >= 4) {
            self.extent = extent;
            self.updateRequestSchemas();
        }
    }

    #updateReadyState() {
        const self = this;
        self._dialogDiv.querySelector(self.#selectors.OKBTN).disabled =
            !self.extent ||
            self._dialogDiv.querySelector(self.#selectors.NAMETB).value.length === 0 ||
            self._dialogDiv.querySelector(self.#selectors.RNGMAXRES).disabled;
    }

    setReadyState() {
        const self = this;
        self.#state = OfflineMapMaker.state.READY;
        self.showDownloadProgress(0, 1);
        self.div.querySelector(self.#selectors.DRAWING).classList.add(Consts.classes.HIDDEN);
        self.div.querySelector(self.#selectors.PROGRESS).classList.add(Consts.classes.HIDDEN);
        self.div.querySelector(self.#selectors.NEW).classList.remove(Consts.classes.HIDDEN);
        self.div.querySelectorAll(self.#selectors.LISTITEM).forEach(function (li) {
            li.classList.remove(Consts.classes.DISABLED);
        });
        self._dialogDiv.querySelector(self.#selectors.OKBTN).disabled = true;
        self.div.querySelector(self.#selectors.NEWBTN).disabled = false;
        self._dialogDiv.querySelector(self.#selectors.TILECOUNT).innerHTML = '';
        self.extent = null;
        self.#loadedCount = 0;
        if (self.boxDraw) {
            self.boxDraw.cancel();
        }
    }

    setEditState() {
        const self = this;
        self.#state = OfflineMapMaker.state.EDITING;
        self.showDownloadProgress(0, 1);
        self.div.querySelector(self.#selectors.NEW).classList.add(Consts.classes.HIDDEN);
        self.div.querySelector(self.#selectors.PROGRESS).classList.add(Consts.classes.HIDDEN);
        self.div.querySelector(self.#selectors.DRAWING).classList.remove(Consts.classes.HIDDEN);
        self.map.toast(self.getLocaleString('clickOnDownloadAreaFirstCorner'), { type: Consts.msgType.INFO });
        self._dialogDiv.querySelector(self.#selectors.OKBTN).disabled = true;
        self.div.querySelector(self.#selectors.NEWBTN).disabled = true;
        self._dialogDiv.querySelector(self.#selectors.NAMETB).value = '';
        self.boxDraw.activate();
    }

    generateCache() {
        const self = this;
        const options = {
            mapName: self._dialogDiv.querySelector(self.#selectors.NAMETB).value
        };
        if (self.findStoredMap({ name: options.mapName })) {
            TC.alert(self.getLocaleString('cb.mapNameAlreadyExists.error', options));
        }
        else {
            var startRequest = function () {
                self.div.querySelector(`.${self.CLASS}-name`).innerHTML = options.mapName;
                self.map.toast(self.getLocaleString('downloadingMap', { mapName: options.mapName }));
                self.#setDownloadingState();
                self.requestCache(options);
            };

            // Usamos Storage API si existe
            if (navigator.storage && navigator.storage.estimate) {
                navigator.storage.estimate().then(function (estimate) {
                    const availableMB = (estimate.quota - estimate.usage) / 1048576;
                    if (self.estimatedMapSize < availableMB) {
                        startRequest();
                    }
                    else {
                        TC.confirm(self.getLocaleString('cb.mapCreation.warning.reasonSize', {
                            mapName: options.mapName,
                            mapSize: self.#formatSize(self.estimatedMapSize),
                            availableStorage: self.#formatSize(Math.round(availableMB))
                        }), startRequest);
                    }
                });
            }
            else {
                startRequest();
            }
        }
    }

    cacheUrlList(urlList, options = {}) {
        const self = this;
        const requestId = Date.now().toString();
        self.createCache(options.name || self.LOCAL_STORAGE_KEY_PREFIX + self.ROOT_CACHE_NAME, {
            requestId: requestId,
            urlList: urlList,
            silent: options.silent
        });
        return requestId;
    }

    requestCache(options = {}) {
        const self = this;
        if (self.map) {
            var extent = options.extent || self.extent || self.map.getExtent();
            self.updateRequestSchemas({ extent: extent });

            if (self.requestSchemas) {
                var filterTml = function (elm, i, arr) {
                    var result = elm.res >= self.minResolution;
                    if (!result && i > 0) {
                        result = arr[i - 1].res > self.minResolution;
                    }
                    return result;
                };
                var trimTml = function (tml) {
                    return {
                        mId: tml.mId,
                        cl: tml.cl,
                        cr: tml.cr,
                        rt: tml.rt,
                        rb: tml.rb
                    };
                };
                // Solo mantenemos los esquemas hasta el nivel de resolución mínima o el inmediatamente inferior a ella si no lo tiene
                var requestSchemas = self.requestSchemas.map(function (schema) {
                    return {
                        layerId: schema.layerId,
                        tileMatrixSet: schema.tileMatrixSet,
                        tileMatrixLimits: schema.tileMatrixLimits.filter(filterTml)
                    };
                });
                // Actualizamos el extent para que coincida con las teselas del último nivel de los esquemas
                // También eliminamos del esquema todo lo irrelevante para la petición
                var intersectionExtent = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
                requestSchemas.forEach(function updateExtent(rs) {
                    const tml = rs.tileMatrixLimits[rs.tileMatrixLimits.length - 1];
                    const unitsPerTile = tml.res * tml.tSize;
                    intersectionExtent[0] = Math.min(intersectionExtent[0], tml.origin[0] + unitsPerTile * tml.cl);
                    intersectionExtent[1] = Math.min(intersectionExtent[1], tml.origin[1] - unitsPerTile * (tml.rb + 1));
                    intersectionExtent[2] = Math.max(intersectionExtent[2], tml.origin[0] + unitsPerTile * (tml.cr + 1));
                    intersectionExtent[3] = Math.max(intersectionExtent[3], tml.origin[1] - unitsPerTile * tml.rt);
                    rs.tileMatrixLimits = rs.tileMatrixLimits.map(trimTml);
                });

                // Redondeamos previamente para que por errores de redondeo no haya confusión al identificar un mapa
                var precision = Math.pow(10, self.map.wrap.isGeo() ? Consts.DEGREE_PRECISION : Consts.METER_PRECISION);
                intersectionExtent = intersectionExtent.map(function (elm, idx) {
                    var round = idx < 3 ? Math.ceil : Math.floor;
                    return round(elm * precision) / precision;
                });

                var mapDefinition = {
                    bBox: intersectionExtent,
                    res: Math.floor(self.minResolution * 1000) / 1000, // Redondeamos previamente para que por errores de redondeo no haya confusión al identificar un mapa
                    url: [],
                    tms: [],
                    format: [],
                    layers: new Array(self.baseLayers.length)
                };
                self.baseLayers.forEach(function addMapDefinitionLayer(layer, idx) {
                    var layerUrl = layer.url.indexOf('//') === 0 ? location.protocol + layer.url : layer.url;
                    var urlIdx = mapDefinition.url.indexOf(layerUrl);
                    if (urlIdx < 0) {
                        urlIdx = mapDefinition.url.push(layerUrl) - 1;
                    }
                    var tmsIdx = mapDefinition.tms.indexOf(layer.matrixSet);
                    if (tmsIdx < 0) {
                        tmsIdx = mapDefinition.tms.push(layer.matrixSet) - 1;
                    }
                    var shortFormat = layer.format.substr(layer.format.indexOf('/') + 1);
                    var formatIdx = mapDefinition.format.indexOf(shortFormat);
                    if (formatIdx < 0) {
                        formatIdx = mapDefinition.format.push(shortFormat) - 1;
                    }
                    mapDefinition.layers[idx] = {
                        urlIdx: urlIdx,
                        id: layer.layerNames,
                        tmsIdx: tmsIdx,
                        formatIdx: formatIdx
                    };
                });

                var params = Util.getQueryStringParams();
                var e = params[self.MAP_EXTENT_PARAM_NAME] = intersectionExtent.toString();
                params[self.MAP_DEFINITION_PARAM_NAME] = btoa(JSON.stringify(mapDefinition));
                if (self.serviceWorkerEnabled) {
                    params[self.SERVICE_WORKER_FLAG] = 1;
                }
                const u = location.origin + location.pathname + '?' + Util.getParamString(params);
                self.currentMap = { name: options.mapName, extent: e, url: u };
                self.isDownloading = true;

                // Guardado mediante service workers
                if (self.serviceWorkerEnabled) {
                    const urlList = [];
                    for (var i = 0, len = requestSchemas.length; i < len; i++) {
                        var schema = requestSchemas[i];
                        var urlPattern = null;
                        for (var j = 0, lenj = self.baseLayers.length; j < lenj; j++) {
                            var l = self.baseLayers[j];
                            if (l.id === schema.layerId) {
                                urlPattern = self.wrap.getGetTilePattern(l);
                                if (l.getFallbackLayer) {
                                    // Esto se usa para meter en almacenamiento local el capabilities de la capa de fallback y evitar errores cuando no haya red
                                    l.getFallbackLayer();
                                }
                                if (l.thumbnail) {
                                    urlList.push(l.thumbnail);
                                }
                                break;
                            }
                        }
                        if (urlPattern) {
                            for (var k = 0, lenk = schema.tileMatrixLimits.length; k < lenk; k++) {
                                const tml = schema.tileMatrixLimits[k];
                                for (var r = tml.rt; r <= tml.rb; r++) {
                                    for (var c = tml.cl; c <= tml.cr; c++) {
                                        urlList.push(urlPattern.replace('{TileMatrixSet}', schema.tileMatrixSet).replace('{TileMatrix}', tml.mId).replace('{TileCol}', c).replace('{TileRow}', r));
                                    }
                                }
                            }
                        }
                    }
                    urlList.push(u);
                    self.cacheUrlList(urlList, { name: u });
                }
            }
        }
    }

    cancelCacheRequest() {
        const self = this;
        if (self.currentMap) {
            self.deleteCache(self.currentMap.url).then(function (obj) {
                if (!obj) {
                    self.currentMap = null;
                }
            });
        }
        self.isDownloading = false;
        self.setReadyState();
    }

    deleteMap(name) {
        const self = this;

        const map = self.findStoredMap({ name: name });
        if (map) {
            self.deleteCache(map.url);
        }
    }

    startDeleteMap(name) {
        const self = this;
        if (navigator.onLine) {
            if (name) {
                var confirmText = self.getLocaleString('cb.delete.confirm', { mapName: name });
                if (!self.serviceWorkerEnabled) {
                    confirmText = confirmText + " " + self.getLocaleString('cb.delete.confirm.connect.warning');
                }
                if (confirm(confirmText)) {
                    if (navigator.onLine) {
                        self.#setDeletingState();
                        self.deleteMap(name);
                    } else {
                        TC.alert(self.getLocaleString('cb.delete.conn.alert'));
                    }
                }
            }
        } else {
            TC.alert(self.getLocaleString('cb.delete.conn.alert'));
        }
    }

    findStoredMap(options) {
        const self = this;
        return self.storedMaps.find(function (elm) {
            var result = true;
            if (options.name && options.name !== elm.name) {
                result = false;
            }
            if (result && options.url && options.url !== elm.url) {
                result = false;
            }
            return result;
        });
    }

    showDownloadProgress(current, total) {
        const self = this;
        const count = self.div.querySelector(`.${self.CLASS}-progress-count`);
        if (total) {
            var percent = Math.min(Math.round(current * 100 / total), 100);
            var percentString = percent + '%';
            const pr = self.div.querySelector(`.${self.CLASS}-progress-ratio`);
            if (pr) {
                pr.style.width = percentString;
            }
            if (count) {
                count.innerHTML = percentString;
            }
        }
        else {
            const pb = self.div.querySelector(`.${self.CLASS}-progress-bar`);
            if (pb) {
                pb.classList.add(Consts.classes.HIDDEN);
            }
            if (count) {
                count.innerHTML = self.getLocaleString('xFiles', { quantity: current });
            }
        }
    }

    updateRequestSchemas(options = {}) {
        const self = this;
        const opts = { ...options };
        opts.extent = opts.extent || self.extent;
        opts.layers = opts.layers || self.baseLayers;
        self.requestSchemas = self.wrap.getRequestSchemas(opts);
        return self.requestSchemas;
    }

    getResolutions() {
        const self = this;
        var result = [];

        const resolutionMapper = function (tml) {
            return tml.res;
        };
        // Obtenemos un array de resoluciones por cada esquema de cada capa
        const allResolutions = self.requestSchemas.map(function (schema) {
            return schema.tileMatrixLimits.map(resolutionMapper);
        });

        // "Hacemos la cremallera" con los arrays de resoluciones de todas las capas y añadimos resoluciones al array de resultados
        result = result
            .concat.apply(result, allResolutions)
            .sort((a, b) => b - a)
            .filter((elm, idx, arr) => idx === 0 || arr[idx - 1] !== elm);
        return result;
    }

    getOnlineMapUrl() {
        const self = this;
        const params = Util.getQueryStringParams();
        delete params[self.MAP_DEFINITION_PARAM_NAME];
        delete params[self.MAP_EXTENT_PARAM_NAME];
        delete params[self.SERVICE_WORKER_FLAG];
        var newParams = Util.getParamString(params);
        if (newParams.length) {
            newParams = '?' + newParams;
        }
        return location.pathname + newParams + location.hash;
    }
}

OfflineMapMaker.prototype.CLASS = 'tc-ctl-omm';
TC.control.OfflineMapMaker = OfflineMapMaker;
export default OfflineMapMaker;
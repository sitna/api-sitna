
/**
  * Opciones del creador de mapas sin conexión.
  * 
  * Para que ese control funcione correctamente, es necesario cumplir estos dos requisitos:
  *    1. Debe instalarse en el ámbito de la aplicación que contiene el visor el _[Service Worker](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)_ creado para el funcionamiento de este control.
  *    Para ello basta con copiar el archivo [tc-cb-service-worker.js](https://raw.githubusercontent.com/sitna/api-sitna/master/TC/workers/tc-cb-service-worker.js) a la carpeta raíz de dicha aplicación.
  *    2. Debe incluirse en la carpeta de la aplicación un archivo de texto con el nombre `manifest.appcache`. 
  *    Este archivo es un documento de manifiesto de [caché de aplicaciones](https://developer.mozilla.org/es/docs/Web/HTML/Using_the_application_cache#habilitando_cach%C3%A9_de_aplicaciones)[*] 
  *    que contiene una lista de las URL de todos los recursos que tienen que almacenarse en la cache del navegador y así asegurar la carga de la aplicación
  *    en ausencia de conexión a Internet.
  *    
  *    [*]: El estándar de caché de aplicaciones está obsoleto hoy en día y este control no hace realmente uso de él para ejercer su función, pero para funcionar necesita
  *    una lista de todos los recursos a cargar en la cache del navegador, y un manifiesto de caché de aplicaciones es precisamente una lista de ese tipo. 
  *    Se usa este formato por compatibilidad hacia atrás y por ser de un estándar bien documentado.
  * @typedef OfflineMapMakerOptions
  * @extends ControlOptions
  * @see MapControlOptions
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
  * ../TC/css/tcmap.css
  * ../TC/resources/es-ES.json
  * ../TC/config/browser-versions.js
  * ../TC/layout/responsive/style.css
  * ../TC/workers/tc-caps-web-worker.js
  * ../TC/css/fonts/sitna.woff
  * ../TC/css/fonts/mapskin.woff
  * ../TC/layout/responsive/fonts/fontawesome-webfont.woff?v=4.5.0
  * ../TC/css/img/thumb-orthophoto.jpg
  * ../TC/css/img/thumb-bta.png
  * ../TC/css/img/thumb-basemap.png
  * ../TC/css/img/thumb-cadaster.png
  * layout/ctl-container/config.json
  * layout/ctl-container/style.css
  * layout/ctl-container/script.js
  * layout/ctl-container/markup.html
  * layout/ctl-container/resources/es-ES.json
  * https://idena.navarra.es/ogc/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities
  */

TC.control = TC.control || {};

if (!TC.control.SWCacheClient) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/SWCacheClient');
}

(function () {

    TC.Consts.classes.CONNECTION_OFFLINE = TC.Consts.classes.CONNECTION_OFFLINE || 'tc-conn-offline';
    TC.Consts.classes.CONNECTION_WIFI = TC.Consts.classes.CONNECTION_WIFI || 'tc-conn-wifi';
    TC.Consts.classes.CONNECTION_MOBILE = TC.Consts.classes.CONNECTION_MOBILE || 'tc-conn-mobile';
    TC.Consts.classes.OFFLINE = TC.Consts.classes.OFFLINE || 'tc-offline';

    var ALREADY_EXISTS = 'already_exists';

    var requestManifest = function () {
        return new Promise(function (resolve, reject) {
            const manifestFile = document.documentElement.getAttribute('manifest') || 'manifest.appcache';
            TC.ajax({
                url: manifestFile,
                method: 'GET',
                responseType: 'text'
            }).then(function (response) {
                var data = response.data;
                TC.loadJS(
                    !window.hex_md5,
                    [TC.apiLocation + TC.Consts.url.HASH],
                    function () {
                        var hash = hex_md5(data);
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
                        resolve({
                            hash: hash,
                            urls: lines
                        });
                    }
                );
            }).catch(function (error) {
                reject(error);
            });
        });
    };

    TC.control.OfflineMapMaker = function () {
        var self = this;

        TC.control.SWCacheClient.apply(this, arguments);

        var cs = self._classSelector = '.' + self.CLASS;
        self._selectors = {
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

        const mapDefString = TC.Util.getParameterByName(self.MAP_DEFINITION_PARAM_NAME);
        const extentString = TC.Util.getParameterByName(self.MAP_EXTENT_PARAM_NAME);
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
                if (key.indexOf(self.LOCAL_STORAGE_KEY_PREFIX) === 0 && key !== self.LOCAL_STORAGE_KEY_PREFIX + self.ROOT_CACHE_NAME + '.hash') {
                    // Es un nombre de mapa y no es el hash de integridad de la cache root
                    var values = self.localStorage.getItem(key).split(" ");
                    var extent = getExtentFromString(values.shift());
                    var name = values.join(" ");
                    var map = {
                        name: name,
                        extent: extent,
                        url: decodeURIComponent(key.substr(self.LOCAL_STORAGE_KEY_PREFIX.length))
                    }
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

        var options = TC.Util.extend({}, len > 1 ? arguments[1] : arguments[0]);
        self._dialogDiv = TC.Util.getDiv(options.dialogDiv);
        if (window.$) {
            self._$dialogDiv = $(self._dialogDiv);
        }
        if (!options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }

        if (self.mapIsOffline) {
            document.querySelectorAll(self._selectors.OFFLINEHIDDEN).forEach(function (elm) {
                elm.classList.add(TC.Consts.classes.HIDDEN);
            })
        }

        TC.Control.apply(self, arguments);
        self.wrap = new TC.wrap.control.OfflineMapMaker(self);

        self.isDownloading = false;
        self.baseLayers = [];

        self.options.averageTileSize = self.options.averageTileSize || TC.Cfg.averageTileSize;
        self.requestSchemas = [];
        self.minResolution = 0;
        self.currentMap = null;

        self._loadedCount = 0;

        // Actualización del enlace al modo online
        // Parche para detectar cambios en el hash. Lo usamos para actualizar los enlaces a los idiomas
        var pushState = history.pushState;
        history.pushState = function (state) {
            var result;
            //if (typeof history.onpushstate == "function") {
            //    history.onpushstate({ state: state });
            //}
            result = pushState.apply(history, arguments);
            if (self._offlineMapHintDiv) {
                self._offlineMapHintDiv.querySelector(self._selectors.EXIT).setAttribute('href', self.getOnlineMapUrl());
            }
            return result;
        }

        // Detección de estado de conexión
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
        var onlineHandler = function () {
            if (self._offlineMapHintDiv) {
                const panel = self._offlineMapHintDiv.querySelector(self._selectors.OFFPANEL);
                panel.classList.remove(
                    TC.Consts.classes.CONNECTION_OFFLINE,
                    TC.Consts.classes.CONNECTION_MOBILE,
                    TC.Consts.classes.CONNECTION_WIFI);

                var type = connection.type;
                switch (type) {
                    case 1:
                    case 2:
                    case undefined:
                        panel.classList.add(TC.Consts.classes.CONNECTION_WIFI);
                        break;
                    default:
                        panel.classList.add(TC.Consts.classes.CONNECTION_MOBILE);
                        break;
                }
            }
        };
        if (connection.addEventListener) {
            connection.addEventListener('typechange', onlineHandler);
        }
        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', function () {
            if (self._offlineMapHintDiv) {
                const panel = self._offlineMapHintDiv.querySelector(self._selectors.OFFPANEL);
                panel.classList.add(TC.Consts.classes.CONNECTION_OFFLINE);
                panel.classList.remove(TC.Consts.classes.CONNECTION_MOBILE, TC.Consts.classes.CONNECTION_WIFI);
            }
        });
    };

    TC.inherit(TC.control.OfflineMapMaker, TC.control.SWCacheClient);

    var ctlProto = TC.control.OfflineMapMaker.prototype;

    ctlProto.CLASS = 'tc-ctl-omm';
    ctlProto.MAP_DEFINITION_PARAM_NAME = "map-def";
    ctlProto.MAP_EXTENT_PARAM_NAME = "map-extent";
    ctlProto.LOCAL_STORAGE_KEY_PREFIX = "TC.offline.map.";
    ctlProto.ROOT_CACHE_NAME = "root";
    ctlProto.SERVICE_WORKER_FLAG = 'sw';
    ctlProto._states = {
        READY: 'ready',
        EDIT: 'editing',
        DOWNLOADING: 'downloading',
        DELETING: 'deleting'
    };
    ctlProto._actions = {
        CREATE: 'create',
        DELETE: 'delete'
    };
    ctlProto.offlineControls = [
        'attribution',
        'basemapSelector',
        'offlineMapMaker',
        'click',
        'coordinates',
        'draw',
        'edit',
        'geolocation',
        'loadingIndicator',
        'measure',
        'navBar',
        'popup',
        'print',
        'scale',
        'scaleBar',
        'scaleSelector',
        'state',
        'fullScreen'
    ];

    TC.Consts.event.MAPCACHEDOWNLOAD = TC.Consts.event.MAPCACHEDOWNLOAD || 'mapcachedownload.tc';
    TC.Consts.event.MAPCACHEDELETE = TC.Consts.event.MAPCACHEDELETE || 'mapcachedelete.tc';
    TC.Consts.event.MAPCACHEPROGRESS = TC.Consts.event.MAPCACHEPROGRESS || 'mapcacheprogress.tc';
    TC.Consts.event.MAPCACHEERROR = TC.Consts.event.MAPCACHEERROR || 'mapcacheerror.tc';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-omm.hbs";
    ctlProto.template[ctlProto.CLASS + '-map-node'] = TC.apiLocation + "TC/templates/tc-ctl-omm-map-node.hbs";
    ctlProto.template[ctlProto.CLASS + '-bl-node'] = TC.apiLocation + "TC/templates/tc-ctl-omm-bl-node.hbs";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-omm-dialog.hbs";
    ctlProto.template[ctlProto.CLASS + '-off-panel'] = TC.apiLocation + "TC/templates/tc-ctl-omm-off-panel.hbs";

    const getExtentFromString = function (str) {
        return decodeURIComponent(str).split(',').map(function (elm) {
            return parseFloat(elm);
        });
    };

    const setDownloadingState = function (ctl) {
        ctl._state = ctl._states.DOWNLOADING;
        TC.Util.closeModal();
        ctl.showDownloadProgress(0, 1);
        ctl.div.querySelector(ctl._selectors.NEW).classList.add(TC.Consts.classes.HIDDEN);
        ctl.div.querySelector(ctl._selectors.DRAWING).classList.add(TC.Consts.classes.HIDDEN);
        ctl.div.querySelector(ctl._selectors.PROGRESS).classList.remove(TC.Consts.classes.HIDDEN);
        ctl._dialogDiv.querySelector(ctl._selectors.OKBTN).disabled = true;
        ctl.div.querySelector(ctl._selectors.NEWBTN).disabled = true;
        ctl.layer.clearFeatures();
        ctl.boxDraw.cancel();
    };

    const setDeletingState = function (ctl) {
        ctl._state = ctl._states.DELETING;
        ctl.showDownloadProgress(0, 1);
        ctl.div.querySelector(ctl._selectors.DRAWING).classList.add(TC.Consts.classes.HIDDEN);
        ctl.div.querySelector(ctl._selectors.PROGRESS).classList.add(TC.Consts.classes.HIDDEN);
        ctl.div.querySelector(ctl._selectors.NEW).classList.remove(TC.Consts.classes.HIDDEN);
        ctl.div.querySelectorAll(ctl._selectors.LISTITEM).forEach(function (li) {
            li.classList.add(TC.Consts.classes.DISABLED);
        });
        ctl._dialogDiv.querySelector(ctl._selectors.OKBTN).disabled = true;
        ctl.div.querySelector(ctl._selectors.NEWBTN).disabled = false;
        ctl._dialogDiv.querySelector(ctl._selectors.TILECOUNT).innerHTML = '';
        ctl.boxDraw.cancel();
    };

    const setNameEditingState = function (ctl, li) {
        li.querySelector('span').classList.add(TC.Consts.classes.HIDDEN);
        const textbox = li.querySelector(ctl._selectors.TEXTBOX);
        textbox.classList.remove(TC.Consts.classes.HIDDEN);
        textbox.value = li.querySelector('span a').innerHTML;
        textbox.focus();
        li.querySelector(ctl._selectors.SAVEBTN).classList.remove(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.CANCELBTN).classList.remove(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.EDITBTN).classList.add(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.VIEWBTN).classList.add(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.DELETEBTN).classList.add(TC.Consts.classes.HIDDEN);
    };

    const setNameReadyState = function (ctl, li) {
        li.querySelector('span').classList.remove(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.TEXTBOX).classList.add(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.SAVEBTN).classList.add(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.CANCELBTN).classList.add(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.EDITBTN).classList.remove(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.VIEWBTN).classList.remove(TC.Consts.classes.HIDDEN);
        li.querySelector(ctl._selectors.DELETEBTN).classList.remove(TC.Consts.classes.HIDDEN);
    };

    var formatNumber = function (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    var updateResolutions = function (ctl, options) {
        var opts = options || {};
        const resDiv = ctl._dialogDiv.querySelector(ctl._classSelector + '-res');
        const range = ctl._dialogDiv.querySelector(ctl._selectors.RNGMAXRES);
        var resolutions = ctl.getResolutions();
        var resText, resLevel, resLeft;
        if (resolutions.length) {
            range.setAttribute('max', resolutions.length - 1);
            if (ctl.minResolution) {
                // Si ya había resolución previa y no se ha tocado el slider, se actualiza su valor
                if (opts.rangeValue === undefined) {
                    for (var i = 0, len = resolutions.length; i < len; i++) {
                        if (ctl.minResolution >= resolutions[i]) {
                            range.value = i;
                            break;
                        }
                    }
                }
            }
            else {
                if (opts.rangeValue === undefined) {
                    // Si no había resolución previa se selecciona un valor inicial igual a la resolución actual
                    const currentResolution = ctl.map.getResolution();
                    range.value = resolutions.filter(r => r > currentResolution).length;
                }
            }
            resLevel = parseInt(range.value);
            var resValue = Math.floor(new Number(resolutions[resLevel]) * 1000) / 1000;
            resText = ctl.getLocaleString('metersPerPixel', {
                value: resValue.toLocaleString((ctl.map ? ctl.map.options.locale : TC.Cfg.locale).replace('_', '-'))
            });
            resLeft = (resLevel + 1) * 100 / (resolutions.length + 1) + '%';
            range.disabled = false;
            ctl.minResolution = resolutions[range.value];
        }
        else {
            resLevel = 0;
            resText = '';
            range.value = 0;
            resLeft = '0';
            ctl.minResolution = 0;
            range.disabled = true;
        }
        ctl._dialogDiv.querySelector(ctl._selectors.RESOLUTIONPANEL).classList.toggle(TC.Consts.classes.HIDDEN, !!range.disabled);
        ctl._dialogDiv.querySelector(ctl._selectors.TILECOUNT).classList.toggle(TC.Consts.classes.HIDDEN, !!range.disabled);

        resDiv.style.left = resLeft;
        resDiv.innerHTML = resText;
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

    const updateThumbnails = function (ctl) {
        ctl._dialogDiv.querySelectorAll(ctl._classSelector + '-bl-node input[type=checkbox]').forEach(function (cb, idx) {
            if (cb.checked) {
                var schema = ctl.requestSchemas.filter(function (elm) {
                    return elm.layerId === cb.value;
                })[0];
                if (schema) {
                    var tml = findTileMatrixLimits(schema, ctl.minResolution);
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
                            for (var j = 0, lenj = ctl.baseLayers.length; j < lenj; j++) {
                                var l = ctl.baseLayers[j];
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
    };

    const formatSize = function (ctl, size) {
        var result;
        if (size < 1) {
            result = ctl.getLocaleString('lessThan1Mb');
        }
        else {
            result = ctl.getLocaleString('approxXMb', { quantity: formatNumber(size) });
        }
        return result;
    };

    const showEstimatedMapSize = function (ctl) {
        var text = '';
        ctl.tileCount = 0;
        for (var i = 0, ii = ctl.requestSchemas.length; i < ii; i++) {
            var schema = ctl.requestSchemas[i];
            for (var j = 0, jj = schema.tileMatrixLimits.length; j < jj; j++) {
                var tml = schema.tileMatrixLimits[j];
                if (tml.res < ctl.minResolution) {
                    break;
                }
                ctl.tileCount += (tml.cr - tml.cl + 1) * (tml.rb - tml.rt + 1);
            }
        }
        if (ctl.tileCount) {
            ctl.estimatedMapSize = Math.round(ctl.tileCount * ctl.options.averageTileSize / 1048576);
            text = ctl.getLocaleString('xTiles', { quantity: formatNumber(ctl.tileCount) }) + ' (' + formatSize(ctl, ctl.estimatedMapSize) + ')';
        }
        ctl._dialogDiv.querySelector(ctl._selectors.TILECOUNT).innerHTML = text;
    };

    const getListElementByMapName = function (ctl, name) {
        const lis = ctl.div.querySelectorAll(ctl._selectors.LISTITEM);
        for (var i = 0, len = lis.length; i < len; i++) {
            const li = lis[i];
            const anchor = li.querySelector('a');
            if (anchor && anchor.innerHTML === name) {
                return li;
            }
        }
        return null;
    };

    const getListElementByMapUrl = function (ctl, url) {
        var hashIdx = url.indexOf('#');
        if (hashIdx >= 0) {
            url = url.substr(0, hashIdx);
        }
        const lis = ctl.div.querySelectorAll(ctl._selectors.LISTITEM);
        for (var i = 0, len = lis.length; i < len; i++) {
            const li = lis[i];
            const anchor = li.querySelector('a');
            if (anchor && anchor.getAttribute('href') === url) {
                return li;
            }
        }
        return null;
    };

    var saveMapToStorage = function (ctl, map) {
        var result = false;
        if (ctl.localStorage) {
            ctl.localStorage.setItem(ctl.LOCAL_STORAGE_KEY_PREFIX + encodeURIComponent(map.url), map.extent + " " + map.name);
            result = true;
        }
        return result;
    };

    var removeMapFromStorage = function (ctl, url) {
        var result = false;
        if (ctl.localStorage) {
            ctl.localStorage.removeItem(ctl.LOCAL_STORAGE_KEY_PREFIX + encodeURIComponent(url));
            result = true;
        }
        return result;
    };

    const addMap = function (ctl) {
        const map = ctl.currentMap;
        if (saveMapToStorage(ctl, map)) {
            ctl.getRenderedHtml(ctl.CLASS + '-map-node', { name: map.name, url: map.url }, function (html) {
                const parser = new DOMParser();
                ctl.div.querySelector(ctl._selectors.LIST).appendChild(parser.parseFromString(html, 'text/html').body.firstChild);
                ctl.div.querySelector(ctl._selectors.EMPTYLIST).setAttribute('hidden', 'hidden');
                ctl.div.querySelector(ctl._selectors.SEARCH).disabled = false;
            });
            ctl.storedMaps.push(map);
        }
    };

    const removeMap = function (ctl, url) {
        const map = ctl.findStoredMap({ url: url });
        if (map) {
            if (removeMapFromStorage(ctl, url)) {
                const li = getListElementByMapName(ctl, map.name);
                if (li) {
                    li.parentElement.removeChild(li);
                }
            }
            var idx = ctl.storedMaps.indexOf(map);
            ctl.storedMaps.splice(idx, 1);
            if (!ctl.storedMaps.length) {
                ctl.div.querySelector(ctl._selectors.SEARCH).disabled = true;
                ctl.div.querySelector(ctl._selectors.EMPTYLIST).removeAttribute('hidden');
            }

            return map.name;
        }

        return null;
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(new Promise(function (resolve, reject) {
            var renderObject = { storedMaps: self.storedMaps, listId: self.CLASS + '-list-' + TC.getUID() };
            self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
                self._dialogDiv.innerHTML = html;
                self._dialogDiv.querySelector(self._selectors.NAMETB).addEventListener(TC.Consts.event.CLICK, function (e) {
                    e.preventDefault();
                    this.selectionStart = 0;
                    this.selectionEnd = this.value.length;
                    this.focus();

                });
            }).then(function () {
                self.renderData(renderObject, function () {
                    self._dialogDiv.querySelector(self._selectors.OKBTN).addEventListener(TC.Consts.event.CLICK, function () {
                        self.generateCache();
                    }, { passive: true });
                    self._dialogDiv.querySelector(self._selectors.NAMETB).addEventListener('input', function () {
                        self._updateReadyState();
                    });
                    self.div.querySelector(self._selectors.NEWBTN).addEventListener(TC.Consts.event.CLICK, function () {
                        self.setEditState();
                    }, { passive: true });
                    self.div.querySelector(self._classSelector + '-btn-cancel-draw').addEventListener(TC.Consts.event.CLICK, function () {
                        self.setReadyState();
                    }, { passive: true });

                    self.div.querySelector(self._classSelector + '-btn-cancel-dl').addEventListener(TC.Consts.event.CLICK, function () {
                        self.cancelCacheRequest();
                    }, { passive: true });

                    const list = self.div.querySelector(self._selectors.LIST);
                    list.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector(self._selectors.DELETEBTN, function (e) {
                        self.startDeleteMap(e.target.parentElement.querySelector('a').innerHTML);
                    }), { passive: true });
                    list.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector(self._selectors.EDITBTN, function (e) {
                        setNameEditingState(self, e.target.parentElement);
                    }), { passive: true });
                    list.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector(self._selectors.CANCELBTN, function (e) {
                        const li = e.target.parentElement;
                        li.querySelector(self._selectors.TEXTBOX).value = li.querySelector('a').innerHTML;
                        setNameReadyState(self, li);
                    }), { passive: true });
                    list.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector(self._selectors.SAVEBTN, function (e) {
                        const li = e.target.parentElement;
                        setNameReadyState(self, li);
                        const anchor = li.querySelector('a');
                        const newName = li.querySelector(self._selectors.TEXTBOX).value;
                        const map = self.findStoredMap({ url: anchor.getAttribute('href') });
                        if (map) {
                            map.name = newName;
                            anchor.innerHTML = newName;
                            anchor.setAttribute('title', newName);
                            saveMapToStorage(self, map);
                        }
                    }), { passive: true });
                    list.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector(self._selectors.VIEWBTN, function (e) {
                        const btn = e.target;
                        var showExtent = !btn.classList.contains(TC.Consts.classes.ACTIVE);
                        const viewBtn = self.div.querySelector(self._selectors.VIEWBTN);
                        viewBtn.classList.remove(TC.Consts.classes.ACTIVE);
                        viewBtn.parentElement.classList.remove(TC.Consts.classes.ACTIVE);
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
                                            showsPopup: false
                                        }).then(function () {
                                            self.layer.map.zoomToFeatures(self.layer.features);
                                        });
                                    btn.classList.add(TC.Consts.classes.ACTIVE);
                                    btn.parentElement.classList.add(TC.Consts.classes.ACTIVE);
                                    btn.setAttribute('title', self.getLocaleString('removeMapExtent'));
                                }
                            }
                        }
                    }), { passive: true });

                    var _filter = function (searchTerm) {
                        searchTerm = searchTerm.toLowerCase();
                        //tc-ctl-omm-map-available-empty
                        const lis = self.div.querySelectorAll(self._selectors.LISTITEM);
                        lis.forEach(function (li) {
                            li.style.display = 'none';
                        });
                        const mapLis = [];
                        lis.forEach(function (li) {
                            if (li.matches('li:not([class]),li.' + TC.Consts.classes.ACTIVE)) {
                                mapLis.push(li);
                            }
                        });

                        if (searchTerm.length === 0) {
                            mapLis.forEach(function (li) {
                                li.style.removeProperty('display');
                            });
                            self.div.querySelector(self._classSelector + '-map-search-icon').style.visibility = 'visible';
                        } else {
                            self.div.querySelector(self._classSelector + '-map-search-icon').style.visibility = 'hidden';
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

                    const trackSearch = self.div.querySelector(self._selectors.SEARCH);
                    const searchListener = function () {
                        _filter(this.value.toLowerCase().trim());
                    };
                    trackSearch.addEventListener('keyup', searchListener);
                    trackSearch.addEventListener('search', searchListener);

                    self._dialogDiv.querySelector(self._selectors.BLLIST).addEventListener('change', TC.EventTarget.listenerBySelector('input[type=checkbox]', function (e) {
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
                        updateResolutions(self);
                        updateThumbnails(self);
                        self._updateReadyState();
                        showEstimatedMapSize(self);
                    }));

                    const range = self._dialogDiv.querySelector(self._selectors.RNGMAXRES);
                    const rangeListener = function (e) {
                        updateResolutions(self, {
                            rangeValue: e.target.value
                        });
                        updateThumbnails(self);
                        showEstimatedMapSize(self);
                    };
                    range.addEventListener('input', rangeListener);
                    range.addEventListener('change', rangeListener);

                    const li = getListElementByMapUrl(self, location.href);
                    if (li) {
                        li.classList.add(TC.Consts.classes.ACTIVE);
                    }

                    if (TC.Util.isFunction(callback)) {
                        callback();
                    }
                })
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        reject(err instanceof Error ? err : Error(err));
                    });
            });

            // Control para evitar que se cancele una descarga de cache al salir de la página
            window.addEventListener('beforeunload', function (e) {
                if (self.isDownloading) {
                    var msg = self.getLocaleString('cb.mapDownloading.warning');
                    e.returnValue = msg;
                    return msg;
                }
            }, true);
        }));
    };

    ctlProto.register = function (map) {
        var self = this;

        const result = TC.control.SWCacheClient.prototype.register.call(self, map);

        self.getServiceWorker().then(
            function () {
                navigator.serviceWorker.ready.then(function () {
                    navigator.serviceWorker.addEventListener('message', function (event) {
                        switch (event.data.event) {
                            case 'progress':
                                self.trigger(TC.Consts.event.MAPCACHEPROGRESS, { url: event.data.name, loaded: event.data.count, total: event.data.total });
                                break;
                            case 'cached':
                                self.trigger(TC.Consts.event.MAPCACHEDOWNLOAD, { url: event.data.name });
                                break;
                            case 'deleted':
                                self.trigger(TC.Consts.event.MAPCACHEDELETE, { url: event.data.name });
                                break;
                            case 'error':
                                if (event.data.action === self._actions.CREATE) {
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
                            self.cacheUrlList(obj.urls);
                            self.one(TC.Consts.event.MAPCACHEDOWNLOAD, function () {
                                const firstLoad = !hash;
                                if (self.localStorage) {
                                    self.localStorage.setItem(hashStorageKey, obj.hash);
                                }
                                if (!firstLoad) {
                                    TC.confirm(self.getLocaleString('newAppVersionAvailable'), function () {
                                        location.reload();
                                    });
                                }
                            });
                        }
                    });
                }
            },
            function (error) {
                self.renderPromise().then(function () {
                    const container = self.div.querySelector(`.${self.CLASS}-new`);
                    const warning = document.createElement('div');
                    warning.classList.add('tc-alert', 'alert-warning');
                    const header = document.createElement('p');
                    const text = document.createElement('strong');
                    text.innerHTML = self.getLocaleString('offlineMap.error');
                    header.appendChild(text);
                    const reason = document.createElement('p');
                    reason.innerHTML = error.message;
                    warning.appendChild(header);
                    warning.appendChild(reason);
                    container.querySelector(self._selectors.NEWBTN).classList.add(TC.Consts.classes.HIDDEN);
                    container.appendChild(warning);
                });
            }
        ).catch(() => console.log("No SW available: no events handled"));

        if (self.mapIsOffline) {
            map.div.classList.add(TC.Consts.classes.OFFLINE);

            // Si no está especificado, el panel de aviso offline se cuelga del div del mapa
            self._offlineMapHintDiv = TC.Util.getDiv(self.options.offlineMapHintDiv);
            if (!self.options.offlineMapHintDiv) {
                map.div.appendChild(self._offlineMapHintDiv);
            }
            self.getRenderedHtml(self.CLASS + '-off-panel', { url: self.getOnlineMapUrl() }, function (html) {
                self._offlineMapHintDiv.innerHTML = html;
                if (!navigator.onLine) {
                    const offPanel = self._offlineMapHintDiv.querySelector(self._selectors.OFFPANEL);
                    offPanel.classList.add(TC.Consts.classes.CONNECTION_OFFLINE);
                    offPanel.classList.remove(TC.Consts.classes.CONNECTION_MOBILE, TC.Consts.classes.CONNECTION_WIFI);
                }
                self._offlineMapHintDiv.querySelector(self._selectors.EXIT).addEventListener(TC.Consts.event.CLICK, function (e) {
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
            type: TC.Consts.layerType.VECTOR,
            stealth: true,
            owner: self,
            styles: {
                line: map.options.styles.line
            }
        });
        self.layer = null;
        Promise.all([
            self.layerPromise,
            self.renderPromise(),
            map.addControl('draw', {
                id: drawId,
                div: self.div.querySelector(self._selectors.DRAW),
                mode: TC.Consts.geom.RECTANGLE,
                persistent: false
            })
        ]).then(function (objects) {
            const layer = self.layer = objects[0];
            const boxDraw = self.boxDraw = objects[2];
            boxDraw.setLayer(layer);
            boxDraw
                .on(TC.Consts.event.DRAWSTART, function (e) {
                    self.map.toast(self.getLocaleString('clickOnDownloadAreaOppositeCorner'), { type: TC.Consts.msgType.INFO });
                })
                .on(TC.Consts.event.DRAWEND, function (e) {
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

                            li.classList.toggle(TC.Consts.classes.HIDDEN, !tml.length);
                        }
                        else {
                            li.classList.add(TC.Consts.classes.HIDDEN);
                        }
                    });
                    const visibleLi = self._dialogDiv.querySelector(self._selectors.BLLISTITEM + ':not(.' + TC.Consts.classes.HIDDEN + ')');
                    self._dialogDiv.querySelector(self._selectors.BLLISTTEXT).innerHTML = self.getLocaleString(visibleLi ? 'selectAtLeastOne' : 'cb.noMapsAtSelectedExtent');

                    updateThumbnails(self);
                    showEstimatedMapSize(self);
                    TC.Util.showModal(self._dialogDiv.querySelector(self._classSelector + '-dialog'), {
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
                            self._dialogDiv.querySelector(self._selectors.NAMETB).value = time;
                            self._updateReadyState();
                        },
                        closeCallback: function () {
                            checkboxes.forEach(function (cb) {
                                cb.disabled = true;
                            });
                            self.boxDraw.layer.clearFeatures();
                        }
                    });
                });

            map.on(TC.Consts.event.CONTROLDEACTIVATE, function (e) {
                if (boxDraw === e.control) {
                    if (self._state === self._states.EDITING) {
                        self.setReadyState();
                    }
                }
            });

        });

        var addRenderedListNode = function (layer) {
            var result = false;
            const blList = self._dialogDiv.querySelector(self._selectors.BLLIST);
            const isLayerAdded = function () {
                return !!blList.querySelector('li[data-layer-uid="' + layer.id + '"]');
            };
            var isValidLayer = layer.type === TC.Consts.layerType.WMTS && !layer.mustReproject;
            if (TC.Util.detectSafari() && TC.Util.detectIOS()) {
                isValidLayer = isValidLayer && TC.Util.isSameOrigin(layer.url);
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
            .on(TC.Consts.event.LAYERADD, function (e) {
                addLayer(e.layer);
            })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
                //14/03/2019 GLS: esperamos a que se haya renderizado el dialogo para obtener la lista
                self.renderPromise().then(function () {
                    const layer = e.layer;
                    if (layer.type === TC.Consts.layerType.WMTS) {
                        const li = self._dialogDiv
                            .querySelector(self._selectors.BLLIST)
                            .querySelector('li[data-layer-uid="' + layer.id + '"]');
                        li.parentElement.removeChild(li);
                    }
                });
            })
            .on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
                map.baseLayers.forEach(l => addLayer(l));
            });

        map.ready(function () {
            if (self.mapIsOffline) {
                // Deshabilitamos los controles que no son usables en modo offline
                var offCtls = [];
                var i, len;
                for (i = 0, len = self.offlineControls.length; i < len; i++) {
                    var offCtl = self.offlineControls[i];
                    offCtl = offCtl.substr(0, 1).toUpperCase() + offCtl.substr(1);
                    offCtls = offCtls.concat(map.getControlsByClass('TC.control.' + offCtl));
                }

                for (i = 0, len = map.controls.length; i < len; i++) {
                    var ctl = map.controls[i];
                    if (offCtls.indexOf(ctl) < 0) {
                        ctl.disable();
                    }
                }

                document.querySelectorAll(self._selectors.OFFLINEHIDDEN).forEach(function (elm) {
                    elm.classList.add(TC.Consts.classes.HIDDEN);
                });
            }
        });

        map.loaded(function () {

            self.layerPromise.then(function (layer) {
                map.putLayerOnTop(layer);
            });

            self.renderPromise().then(function () {
                self.div.querySelector(self._selectors.NEWBTN).disabled = false;
                map.baseLayers.forEach(addRenderedListNode);
            });

            if (self.mapIsOffline) {
                const mapDef = self.currentMapDefinition;
                const isSameLayer = function (layer, mapDefLayer) {
                    const layerUrl = layer.url.indexOf('//') === 0 ? location.protocol + layer.url : layer.url;
                    return (layerUrl === mapDef.url[mapDefLayer.urlIdx] && layer.layerNames === mapDefLayer.id && layer.matrixSet === mapDef.tms[mapDefLayer.tmsIdx]);
                };
                // Añadimos al mapa las capas guardadas que no están por defecto
                const missingLayers = map.options.availableBaseLayers
                    .filter((abl) => abl.type === TC.Consts.layerType.WMTS) // Capas cacheables
                    .filter((abl) => { // Que estén en el mapa sin conexión
                        return mapDef.layers.some((l) => isSameLayer(abl, l));
                    })
                    .filter((abl) => { // Que no estén en las capas por defecto
                        return !map.baseLayers.some((l) => l.id === abl.id);
                    });
                Promise.all(missingLayers.map((layer) => {
                    return map.addLayer(TC.Util.extend({}, layer, { isBase: true }));
                })).finally(function () {
                    // Obtenemos las capas cacheadas
                    const cachedLayers = [];
                    for (var i = 0, ii = mapDef.layers.length; i < ii; i++) {
                        for (var j = 0, jj = map.baseLayers.length; j < jj; j++) {
                            const baseLayer = map.baseLayers[j];
                            if (baseLayer && baseLayer.type === TC.Consts.layerType.WMTS && isSameLayer(baseLayer, mapDef.layers[i])) {
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
                                if (baseLayer && baseLayer.type !== TC.Consts.layerType.VECTOR && !cachedLayers.includes(baseLayer)) {
                                    map.removeLayer(baseLayer);
                                }
                            }

                            map.setExtent(self.currentMapExtent, { animate: false });
                        });
                    }
                });
            }
        });

        self
            .on(TC.Consts.event.MAPCACHEDOWNLOAD, function (e) {
                self.isDownloading = false;
                const removeHash = function (url) {
                    const hashIdx = url.indexOf('#');
                    return (hashIdx >= 0) ? url.substr(0, hashIdx) : url;
                }
                const url = removeHash(e.url);
                const li = getListElementByMapUrl(self, url);
                if (li && !self.serviceWorkerEnabled) {
                    // Se ha descargado un mapa cuando se quería borrar. Pasa cuando la cache ya estaba borrada pero la entrada en localStorage no.
                    li.classList.remove(TC.Consts.classes.DISABLED);
                    TC.alert(self.getLocaleString('cb.delete.error'));
                }
                else {
                    if (self.currentMap && url === self.currentMap.url) {
                        addMap(self);
                        map.toast(self.getLocaleString('mapDownloaded', { mapName: self.currentMap.name }));
                    }
                }
                self.currentMap = null;
                self.setReadyState();
            })
            .on(TC.Consts.event.MAPCACHEDELETE, function (e) {
                self.isDownloading = false;
                var mapName = removeMap(self, e.url) || (self.currentMap && self.currentMap.name);
                self.currentMap = null;
                if (mapName) {
                    map.toast(self.getLocaleString('mapDeleted', { mapName: mapName }));
                }
                self.setReadyState();
            })
            .on(TC.Consts.event.MAPCACHEPROGRESS, function (e) {
                var total = e.total;
                if (!total && self.requestSchemas) {
                    total = self.requestSchemas[0].tileCount;
                }
                var loaded = e.loaded;
                if (loaded) {
                    self._loadedCount = loaded;
                }
                else {
                    self._loadedCount += 1;
                    loaded = self._loadedCount;
                }
                self.showDownloadProgress(loaded, total);
            })
            .on(TC.Consts.event.MAPCACHEERROR, function (e) {
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
                            removeMap(self, e.url);
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
                    if (TC.Util.detectIE()) {
                        TC.error(msg);
                        TC.alert(self.getLocaleString('cb.mapCreation.error.reasonEdge'));
                    }
                    else {
                        TC.alert(msg);
                    }
                }
                self.currentMap = null;
            });

        return result;
    };

    ctlProto.setExtent = function (extent) {
        var self = this;
        if (Array.isArray(extent) && extent.length >= 4) {
            self.extent = extent;
            self.updateRequestSchemas();
        }
    };

    ctlProto._updateReadyState = function () {
        const self = this;
        self._dialogDiv.querySelector(self._selectors.OKBTN).disabled =
            !self.extent ||
            self._dialogDiv.querySelector(self._selectors.NAMETB).value.length === 0 ||
            self._dialogDiv.querySelector(self._selectors.RNGMAXRES).disabled;
    };

    ctlProto.setReadyState = function () {
        const self = this;
        self._state = self._states.READY;
        self.showDownloadProgress(0, 1);
        self.div.querySelector(self._selectors.DRAWING).classList.add(TC.Consts.classes.HIDDEN);
        self.div.querySelector(self._selectors.PROGRESS).classList.add(TC.Consts.classes.HIDDEN);
        self.div.querySelector(self._selectors.NEW).classList.remove(TC.Consts.classes.HIDDEN);
        self.div.querySelectorAll(self._selectors.LISTITEM).forEach(function (li) {
            li.classList.remove(TC.Consts.classes.DISABLED);
        });
        self._dialogDiv.querySelector(self._selectors.OKBTN).disabled = true;
        self.div.querySelector(self._selectors.NEWBTN).disabled = false;
        self._dialogDiv.querySelector(self._selectors.TILECOUNT).innerHTML = '';
        self.extent = null;
        self._loadedCount = 0;
        if (self.boxDraw) {
            self.boxDraw.cancel();
        }
    };

    ctlProto.setEditState = function () {
        const self = this;
        self._state = self._states.EDITING;
        self.showDownloadProgress(0, 1);
        self.div.querySelector(self._selectors.NEW).classList.add(TC.Consts.classes.HIDDEN);
        self.div.querySelector(self._selectors.PROGRESS).classList.add(TC.Consts.classes.HIDDEN);
        self.div.querySelector(self._selectors.DRAWING).classList.remove(TC.Consts.classes.HIDDEN);
        self.map.toast(self.getLocaleString('clickOnDownloadAreaFirstCorner'), { type: TC.Consts.msgType.INFO });
        self._dialogDiv.querySelector(self._selectors.OKBTN).disabled = true;
        self.div.querySelector(self._selectors.NEWBTN).disabled = true;
        self._dialogDiv.querySelector(self._selectors.NAMETB).value = '';
        self.boxDraw.activate();
    };

    ctlProto.generateCache = function () {
        const self = this;
        const options = {
            mapName: self._dialogDiv.querySelector(self._selectors.NAMETB).value
        };
        if (self.findStoredMap({ name: options.mapName })) {
            TC.alert(self.getLocaleString('cb.mapNameAlreadyExists.error', options));
        }
        else {
            var startRequest = function () {
                self.div.querySelector(self._classSelector + '-name').innerHTML = options.mapName;
                self.map.toast(self.getLocaleString('downloadingMap', { mapName: options.mapName }));
                setDownloadingState(self);
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
                            mapSize: formatSize(self, self.estimatedMapSize),
                            availableStorage: formatSize(self, Math.round(availableMB))
                        }), startRequest);
                    }
                });
            }
            else {
                startRequest();
            }
        }
    };

    ctlProto.cacheUrlList = function (urlList, options) {
        var self = this;
        var opts = options || {};
        self.createCache(opts.name || (self.LOCAL_STORAGE_KEY_PREFIX + self.ROOT_CACHE_NAME), {
            urlList: urlList,
            silent: opts.silent
        });
    };

    ctlProto.requestCache = function (options) {
        var self = this;
        var opts = options || {};
        if (self.map) {
            var extent = opts.extent || self.extent || self.map.getExtent();
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
                for (var i = 0, len = requestSchemas.length; i < len; i++) {
                    var rs = requestSchemas[i];
                    var tml = rs.tileMatrixLimits[rs.tileMatrixLimits.length - 1];
                    var unitsPerTile = tml.res * tml.tSize;
                    intersectionExtent[0] = Math.min(intersectionExtent[0], tml.origin[0] + unitsPerTile * tml.cl);
                    intersectionExtent[1] = Math.min(intersectionExtent[1], tml.origin[1] - unitsPerTile * (tml.rb + 1));
                    intersectionExtent[2] = Math.max(intersectionExtent[2], tml.origin[0] + unitsPerTile * (tml.cr + 1));
                    intersectionExtent[3] = Math.max(intersectionExtent[3], tml.origin[1] - unitsPerTile * tml.rt);
                    rs.tileMatrixLimits = rs.tileMatrixLimits.map(trimTml);
                }


                // Redondeamos previamente para que por errores de redondeo no haya confusión al identificar un mapa
                var precision = Math.pow(10, self.map.wrap.isGeo() ? TC.Consts.DEGREE_PRECISION : TC.Consts.METER_PRECISION);
                intersectionExtent = intersectionExtent.map(function (elm, idx) {
                    var round = (idx < 3) ? Math.ceil : Math.floor;
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
                for (var i = 0, len = self.baseLayers.length; i < len; i++) {
                    var layer = self.baseLayers[i];
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
                    mapDefinition.layers[i] = {
                        urlIdx: urlIdx,
                        id: layer.layerNames,
                        tmsIdx: tmsIdx,
                        formatIdx: formatIdx
                    };
                }

                var params = TC.Util.getQueryStringParams();
                var e = params[self.MAP_EXTENT_PARAM_NAME] = intersectionExtent.toString();
                params[self.MAP_DEFINITION_PARAM_NAME] = btoa(JSON.stringify(mapDefinition));
                if (self.serviceWorkerEnabled) {
                    params[self.SERVICE_WORKER_FLAG] = 1;
                }
                const u = location.origin + location.pathname + '?' + TC.Util.getParamString(params);
                self.currentMap = { name: opts.mapName, extent: e, url: u };
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
                                var tml = schema.tileMatrixLimits[k];
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

    ctlProto.cancelCacheRequest = function () {
        var self = this;
        if (self.currentMap) {
            self.deleteCache(self.currentMap.url).then(function (obj) {
                if (!obj) {
                    self.currentMap = null;
                }
            });
        }
        self.isDownloading = false;
        self.setReadyState();
    };

    ctlProto.deleteMap = function (name) {
        var self = this;

        var map = self.findStoredMap({ name: name });
        if (map) {
            self.deleteCache(map.url);
        }
    };

    ctlProto.startDeleteMap = function (name) {
        const self = this;
        if (navigator.onLine) {
            if (name) {
                var confirmText = self.getLocaleString('cb.delete.confirm', { mapName: name });
                if (!self.serviceWorkerEnabled) {
                    confirmText = confirmText + " " + self.getLocaleString('cb.delete.confirm.connect.warning');
                }
                if (confirm(confirmText)) {
                    if (navigator.onLine) {
                        setDeletingState(self);
                        self.deleteMap(name);
                    } else {
                        TC.alert(self.getLocaleString('cb.delete.conn.alert'));
                    }
                }
            }
        } else {
            TC.alert(self.getLocaleString('cb.delete.conn.alert'));
        }
    };

    ctlProto.findStoredMap = function (options) {
        var self = this;
        return self.storedMaps.filter(function (elm) {
            var result = true;
            if (options.name && options.name !== elm.name) {
                result = false;
            }
            if (result && options.url && options.url !== elm.url) {
                result = false;
            }
            return result;
        })[0];
    };

    ctlProto.showDownloadProgress = function (current, total) {
        const self = this;
        const cs = self._classSelector;
        const count = self.div.querySelector(cs + '-progress-count');
        if (total) {
            var percent = Math.min(Math.round(current * 100 / total), 100);
            var percentString = percent + '%';
            const pr = self.div.querySelector(cs + '-progress-ratio');
            if (pr) {
                pr.style.width = percentString;
            }
            if (count) {
                count.innerHTML = percentString;
            }
        }
        else {
            const pb = self.div.querySelector(cs + '-progress-bar');
            if (pb) {
                pb.classList.add(TC.Consts.classes.HIDDEN);
            }
            if (count) {
                count.innerHTML = self.getLocaleString('xFiles', { quantity: current });
            }
        }
    };

    ctlProto.updateRequestSchemas = function (options) {
        var self = this;
        var opts = options || {};
        opts.extent = opts.extent || self.extent;
        opts.layers = opts.layers || self.baseLayers;
        self.requestSchemas = self.wrap.getRequestSchemas(opts);
        return self.requestSchemas;
    };

    ctlProto.getResolutions = function () {
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
    };

    ctlProto.getOnlineMapUrl = function () {
        const self = this;
        const params = TC.Util.getQueryStringParams();
        delete params[self.MAP_DEFINITION_PARAM_NAME];
        delete params[self.MAP_EXTENT_PARAM_NAME];
        delete params[self.SERVICE_WORKER_FLAG];
        var newParams = TC.Util.getParamString(params);
        if (newParams.length) {
            newParams = '?' + newParams;
        }
        return location.pathname + newParams + location.hash;
    };

})();

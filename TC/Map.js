var TC = TC || {};

(function () {

    /**
     * <p>Objeto principal de la API, instancia un mapa dentro de un elemento del DOM. Nótese que el constructor es asíncrono, por tanto cualquier código que haga uso de este objeto debería
     * estar dentro de una función de callback pasada como parámetro al método {{#crossLink "TC.Map/loaded:method"}}{{/crossLink}}.</p>
     * <p>Puede consultar también online el <a href="../../examples/Map.1.html">ejemplo 1</a>, el <a href="../../examples/Map.2.html">ejemplo 2</a> y el <a href="../../examples/Map.3.html">ejemplo 3</a>.</p>
     * @class TC.Map
     * @extends TC.Object
     * @constructor
     * @async
     * @param {HTMLElement|string} div Elemento del DOM en el que crear el mapa o valor de atributo id de dicho elemento.
     * @param {object} [options] Objeto de opciones de configuración del mapa. Sus propiedades sobreescriben el objeto de configuración global {{#crossLink "TC.Cfg"}}{{/crossLink}}.
     * @param {string} [options.crs="EPSG:25830"] Código EPSG del sistema de referencia espacial del mapa.
     * @param {array} [options.initialExtent] Extensión inicial del mapa definida por x mínima, y mínima, x máxima, y máxima. 
     * Esta opción es obligatoria si el sistema de referencia espacial del mapa es distinto del sistema por defecto (ver TC.Cfg.{{#crossLink "TC.Cfg/crs:property"}}{{/crossLink}}).
     * Para más información consultar TC.Cfg.{{#crossLink "TC.Cfg/initialExtent:property"}}{{/crossLink}}.
     * @param {array} [options.maxExtent] Extensión máxima del mapa definida por x mínima, y mínima, x máxima, y máxima. Para más información consultar TC.Cfg.{{#crossLink "TC.Cfg/maxExtent:property"}}{{/crossLink}}.
     * @param {string} [options.layout] URL de una carpeta de maquetación. Consultar TC.Cfg.{{#crossLink "TC.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones.
     * @param {array} [options.baseLayers] Lista de identificadores de capa o instancias de la clase {{#crossLink "TC.cfg.LayerOptions"}}{{/crossLink}} para incluir dichas capas como mapas de fondo. 
     * @param {array} [options.workLayers] Lista de identificadores de capa o instancias de la clase {{#crossLink "TC.cfg.LayerOptions"}}{{/crossLink}} para incluir dichas capas como contenido del mapa. 
     * @param {TC.cfg.MapControlOptions} [options.controls] Opciones de controles de mapa.
     * @param {TC.cfg.StyleOptions} [options.styles] Opciones de estilo de entidades geográficas.
     * @param {string} [options.proxy] URL del proxy utilizado para peticiones a dominios remotos (ver TC.Cfg.{{#crossLink "TC.Cfg/proxy:property"}}{{/crossLink}}).
     * @example
     *     <div id="mapa"/>
     *     <script>
     *         // Crear un mapa con las opciones por defecto.
     *         var map = new TC.Map("mapa");
     *     </script>
     * @example
     *     <div id="mapa"/>
     *     <script>
     *         // Crear un mapa en el sistema de referencia WGS 84 con el de mapa de fondo.
     *         var map = new TC.Map("mapa", {
     *             crs: "EPSG:4326",
     *             initialExtent: [ // Coordenadas en grados decimales, porque el sistema de referencia espacial es WGS 84.
     *                 -2.84820556640625,
     *                 41.78912492257675,
     *                 -0.32135009765625,
     *                 43.55789822064767
     *             ],
     *             maxExtent: [
     *                 -2.84820556640625,
     *                 41.78912492257675,
     *                 -0.32135009765625,
     *                 43.55789822064767
     *             ],
     *             baseLayers: [
     * 				TC.Consts.layer.IDENA_DYNBASEMAP
     *             ]
     *         });
     *     </script>
     * @example
     *     <div id="mapa"></div>
     *     <script>
     *         // Crear un mapa que tenga como contenido las capas de toponimia y mallas cartográficas del WMS de IDENA.
     *         var map = new TC.Map("mapa", {
     *             workLayers: [
     *                 {
     *                     id: "topo_mallas",
     *                     title: "Toponimia y mallas cartográficas",
     *                     type: TC.Consts.layerType.WMS,
     *                     url: "//idena.navarra.es/ogc/wms",
     *                     layerNames: "IDENA:toponimia,IDENA:mallas"
     *                 }
     *             ]
     *         });
     *     </script>
     */
    var pendingLayers = [];
    var pendingLayerCallbacks = [];

    TC.Map = TC.Map || function (div, options) {
        ///<summary>
        ///Constructor
        ///</summary>
        ///<param name="div" type="HTMLElement|string">Elemento del DOM en el que crear el mapa o valor de atributo id de dicho elemento.</param>
        ///<param name="options" type="object" optional="true">Objeto de opciones de configuración del mapa. Sus propiedades sobreescriben el objeto de configuración global TC.Cfg.</param>
        ///<returns type="TC.Map"></returns>
        ///<field name='isReady' type='boolean'>Indica si todos los controles del mapa están cargados.</field>
        ///<field name='isLoaded' type='boolean' default='false'>Indica si todos los controles y todas las capas del mapa están cargados.</field>
        ///<field name='activeControl' type='TC.Control'>Control que está activo en el mapa, y que por tanto responderá a los eventos de ratón en su área de visualización.</field>
        ///<field name='layers' type='array' elementType='TC.Layer'>Lista de todas las capas base cargadas en el mapa.</field>
        ///<field name='controls' type='array' elementType='TC.Control'>Lista de todos los controles del mapa.</field>
        var self = this;
        self.$events = $(self);

        //TC.Object.apply(self, arguments);

        /**
         * Indica si todos los controles del mapa están cargados.
         * @property isReady
         * @type boolean
         * @default false
         */
        self.isReady = false;

        /**
         * Indica si todos los controles y todas las capas del mapa están cargados.
         * @property isLoaded
         * @type boolean
         * @default false
         */
        self.isLoaded = false;

        /**
         * Lista de todos los controles del mapa.
         * @property controls
         * @type array
         * @default []
         */
        self.controls = [];

        /**
         * Control que está activo en el mapa, y que por tanto responderá a los eventos de ratón en su área de visualización.
         * @property activeControl
         * @type TC.Control
         * @default null
         */
        self.activeControl = null;

        /**
         * Lista de todas las capas cargadas en el mapa.
         * @property layers
         * @type array
         * @default []
         */
        self.layers = [];

        /**
         * Lista de todas las capas base cargadas en el mapa.
         * @property baseLayers
         * @type array
         * @default []
         */
        self.baseLayers = [];

        /**
         * Lista de todas las capas de trabajo cargadas en el mapa.
         * @property workLayers
         * @type array
         * @default []
         */
        self.workLayers = [];

        /**
         * Capa base actual del mapa.
         * @property baseLayer
         * @type TC.Layer
         */
        self.baseLayer = null;
        /**
         * Capa donde se dibujan las entidades geográficas si no se especifica la capa explícitamente. Se instancia en el momento de añadir la primera entidad.
         * @property vectors
         * @type TC.layer.Vector
         * @default null
         */
        self.vectors = null;

        var loadingLayerCount = 0;
        /**
         * Elemento del DOM donde se ha creado el mapa.
         * @property div
         * @type HTMLElement
         */
        self.div = TC.Util.getDiv(div);
        self._$div = $(self.div);
        /**
         * El mapa ha cargado todas sus capas iniciales y todos sus controles
         * @event MAPLOAD
         */
        /**
         * El mapa ha cargado todos sus controles, pero no hay garantía de que estén cargadas las capas
         * @event MAPREADY
         */
        /**
         * Se va a añadir una capa al mapa.
         * @event BEFORELAYERADD
         * @param {TC.Layer} layer Capa que se va a añadir.
         */
        /**
         * Se ha añadido una capa al mapa.
         * @event LAYERADD
         * @param {TC.Layer} layer Capa que se ha añadido.
         */
        /**
         * Se ha eliminado una capa del mapa.
         * @event LAYERREMOVE
         * @param {TC.Layer} layer Capa que se ha eliminado.
         */
        /**
         * Se ha cambiado de posición una capa en la lista de capas del mapa.
         * @event LAYERORDER
         * @param {TC.Layer} layer Capa que se ha eliminado.
         * @param {number} oldIndex Índice de la posición antes del cambio.
         * @param {number} newIndex Índice de la posición después del cambio.
         */
        /**
         * Se va a actualizar una capa del mapa: se van a modificar sus entidades o se va solicitar una nueva imagen.
         * @event BEFORELAYERUPDATE
         * @param {TC.Layer} layer Capa que va a actualizarse.
         */
        /**
         * Se ha actualizado una capa del mapa: se ha modificado sus entidades o se ha cargado una imagen nueva.
         * @event LAYERUPDATE
         * @param {TC.Layer} layer Capa que se ha actualizado.
         */
        /**
         * Ha habido un error al cargar la capa, bien porque no se ha podido obtener su capabilities o porque no soporta CRS compatibles.
         * @event LAYERERROR
         * @param {TC.Layer} layer Capa que sufre el error.
         */
        /**
         * Se ha establecido una nueva capa como mapa base.
         * @event BASELAYERCHANGE
         * @param {TC.Layer} layer Capa que es el nuevo mapa base.
         */
        /**
         * Se va a actualizar alguna capa del mapa.
         * @event BEFOREUPDATE
         */

        self._$div.addClass(TC.Consts.classes.LOADING);
        self._$div.data('map', self);
        self._$div.addClass(TC.Consts.classes.MAP);

        // Para gestionar zoomToMarkers
        self._markerDeferreds = [];

        if (!TC.ready) {
            TC.Cfg = $.extend({}, TC.Defaults, TC.Cfg);
            TC.ready = true;
        }
        /**
         * Objeto de opciones del constructor.
         * @property options
         * @type object
         */
        self.options = mergeOptions(options);

        self._remainingLayers = 0;

        var init = function () {
            if (self.options.stateful) {
                _setupStateControl();
                self.state = self.checkLocation();
            }

            if (self.options.layout) {
                self.$events.trigger($.Event(TC.Consts.event.LAYOUTLOAD, { map: self }));
            }

            if (options && options.workLayers !== undefined) {
                self.options.workLayers = options.workLayers;
            }
            if (options && options.baseLayers !== undefined) {
                self.options.baseLayers = options.baseLayers;
            }

            self._remainingLayers = self.options.baseLayers.length + self.options.workLayers.length;

            if (self.options.zoomToFeatures) {
                // zoom a features solo cuando se cargue el mapa
                var handleFeaturesAdd = function handleFeaturesAdd(e) {
                    clearTimeout(self._zoomToFeaturesTimeout);

                    self._zoomToFeaturesTimeout = setTimeout(function () {
                        self.zoomToFeatures(e.layer.features, { animate: false });
                        self.off(TC.Consts.event.FEATURESADD, handleFeaturesAdd);
                    }, 100);
                };
                self.on(TC.Consts.event.FEATURESADD, handleFeaturesAdd);
            }
            else {
                var _handleLayerAdd = function _handleLayerAdd(e) {
                    if (e.layer.isBase && e.layer === self.baseLayer) {
                        if (typeof self.state !== "undefined") {
                            self.setExtent(self.state.ext);
                        }
                        self.off(TC.Consts.event.LAYERADD, _handleLayerAdd);
                    }
                };
                self.on(TC.Consts.event.LAYERADD, _handleLayerAdd);
            }

            /**
             * Well-known ID (WKID) del CRS del mapa.
             * @property crs
             * @type string
             */
            self.crs = self.options.crs;

            self.wrap = new TC.wrap.Map(self);

            TC.loadJS(
                !(TC.isLegacy ? window[TC.Consts.PROJ4JSOBJ_LEGACY] : window[TC.Consts.PROJ4JSOBJ]),
                [
                    TC.url.proj4js
                ],
                function () {
                    TC.loadJSInOrder(
                        !(TC.isLegacy ? window[TC.Consts.OLNS_LEGACY] : window[TC.Consts.OLNS]),
                        [
                            TC.url.ol,
                            TC.url.olConnector
                        ],
                        function () {
                            TC.loadProjDef(self.options.crs, function () {
                                self.wrap.setMap();
                                for (var name in self.options.controls) {
                                    if (self.options.controls[name]) {

                                        if (typeof self.options.controls[name] === 'boolean') {
                                            self.addControl(name);
                                        }
                                        else {
                                            var options = self.options.controls[name];
                                            name = name.substr(0, 1).toUpperCase() + name.substr(1);
                                            self.addControl(name, options);
                                        }
                                    }
                                }

                                self.on(TC.Consts.event.BEFORELAYERUPDATE, _triggerLayersBeforeUpdateEvent);
                                self.on(TC.Consts.event.LAYERUPDATE, _triggerLayersUpdateEvent);

                                var i;
                                var j;
                                var lyrCfg;
                                for (i = 0; i < self.options.baseLayers.length; i++) {
                                    lyrCfg = self.options.baseLayers[i];
                                    if (typeof lyrCfg === 'string') {
                                        for (j = 0; j < TC.Cfg.availableBaseLayers.length; j++) {
                                            if (TC.Cfg.availableBaseLayers[j].id === lyrCfg) {
                                                lyrCfg = TC.Cfg.availableBaseLayers[j];
                                                break;
                                            }
                                        }
                                    }
                                    self.addLayer($.extend({}, lyrCfg, { isBase: true, map: self }));
                                }

                                var setVisibility = function (layer) {
                                    if (layer.isRaster() && !layer.names) {
                                        layer.setVisibility(false);
                                    }
                                };
                                for (i = 0; i < self.options.workLayers.length; i++) {
                                    var layerDeleted = false;

                                    lyrCfg = $.extend({}, self.options.workLayers[i], { map: self });

                                    if (self.state) {
                                        if (lyrCfg.type !== TC.Consts.layerType.VECTOR) {

                                            for (var i = 0; i < self.state.layers.length; i++) {
                                                var _layer = self.state.layers[i];
                                                if (_layer.u === lyrCfg.url && lyrCfg.layerNames.indexOf(_layer.n) >= 0) {
                                                    lyrCfg.hideTitle = _layer.hideTitle;
                                                    lyrCfg.renderOptions = {
                                                        opacity: _layer.o,
                                                        hide: !_layer.v
                                                    };
                                                    _layer.Added = true;
                                                    break;
                                                }
                                                layerDeleted = true;
                                                //reducimos el contador de capas cargadas para que el feedback que bloquea el mapa no se quede forever.
                                                self._remainingLayers--;
                                            }
                                        }
                                    }

                                    if (!layerDeleted) {
                                        $.when(self.addLayer(lyrCfg)).then(setVisibility);
                                    }
                                }

                                if (self.state && self.state.layers) {
                                    self.state.layers.forEach(function (capa) {

                                        if (!capa.Added) {
                                            var op = capa.o;
                                            var visibility = capa.v;

                                            // añado como promesa cada una de las capas que se añaden
                                            self.addLayer({
                                                id: TC.getUID(),
                                                url: TC.Util.isOnCapabilities(capa.u, capa.u.indexOf(window.location.protocol) < 0) || capa.u,
                                                hideTitle: capa.h,
                                                layerNames: capa.n ? capa.n.split(',') : "",
                                                renderOptions: {
                                                    opacity: capa.o,
                                                    hide: !capa.v
                                                }
                                            }).then(function (layer) {
                                                layer.wrap.$events.on(TC.Consts.event.TILELOADERROR, function (event) {
                                                    var layer = this.parent;
                                                    if (event.error.code === 401 || event.error.code === 403)
                                                        layer.map.toast(event.error.text, { type: TC.Consts.msgType.ERROR });
                                                    layer.map.removeLayer(layer);
                                                });
                                                var rootNode = layer.wrap.getRootLayerNode();
                                                layer.title = rootNode.Title || rootNode.title;
                                                layer.setOpacity(op);
                                                layer.setVisibility(visibility);
                                            });
                                        }
                                    });
                                }
                                self.isReady = true;
                                self.$events.trigger($.Event(TC.Consts.event.MAPREADY));
                            });

                        }
                    );
                }
            );

            self.on(TC.Consts.event.FEATURECLICK, function (e) {
                if (!self.activeControl || !self.activeControl.isExclusive()) {
                    e.feature.showPopup();
                }
            });

            self.on(TC.Consts.event.NOFEATURECLICK, function (e) {
                e.layer._noFeatureClicked = true;
                var allLayersClicked = true;
                var i;
                var layer;
                for (i = 0; i < self.workLayers.length; i++) {
                    layer = self.workLayers[i];
                    if (layer instanceof TC.layer.Vector) {
                        if (!layer._noFeatureClicked) {
                            allLayersClicked = false;
                            break;
                        }
                    }
                }
                if (allLayersClicked) {
                    for (i = 0; i < self.workLayers.length; i++) {
                        layer = self.workLayers[i];
                        if (layer instanceof TC.layer.Vector) {
                            delete layer._noFeatureClicked;
                        }
                    }
                    var popups = self.getControlsByClass(TC.control.Popup);
                    for (var i = 0, len = popups.length; i < len; i++) {
                        popups[i].hide();
                    }
                }
            });
        };

        self.one(TC.Consts.event.MAPREADY, function () {
            setHeightFix(self._$div);
        });
        self.one(TC.Consts.event.MAPLOAD, function () {
            self._$div.removeClass(TC.Consts.classes.LOADING);
        });

        var _setupStateControl = function () {
            var MIN_TIMEOUT_VALUE = 4;

            if (!window.jsonpack) {
                TC.syncLoadJS(TC.apiLocation + TC.Consts.url.JSONPACK);
            }

            // eventos a los que estamos suscritos para obtener el estado
            var events = [
                TC.Consts.event.LAYERADD,
                TC.Consts.event.LAYERORDER,
                TC.Consts.event.LAYERREMOVE,
                //TC.Consts.event.LAYEROPACITY, // Este evento lo vamos a tratar por separado, para evitar exceso de actualizaciones de estado.
                TC.Consts.event.LAYERVISIBILITY,
                TC.Consts.event.ZOOM,
                TC.Consts.event.BASELAYERCHANGE].join(' ');

            // gestión siguiente - anterior
            self.on(TC.Consts.event.MAPLOAD, function () {

                self.loaded(function () {

                    // registramos el estado inicial                
                    self.replaceCurrent = true;
                    _addToHistory();

                    // nos suscribimos a los eventos para registrar el estado en cada uno de ellos
                    self.on(events, $.proxy(_addToHistory, self));

                    // a la gestión del evento de opacidad le metemos un retardo, para evitar que haya un exceso de actualizaciones de estado.
                    var layerOpacityHandlerTimeout;
                    self.on(TC.Consts.event.LAYEROPACITY, function (e) {
                        clearTimeout(layerOpacityHandlerTimeout);
                        layerOpacityHandlerTimeout = setTimeout(function () {
                            _addToHistory(e);
                        }, 500);
                    });

                    // gestión siguiente - anterior
                    window.addEventListener('popstate', function (e) {
                        var wait;
                        wait = self.loadingCtrl && self.loadingCtrl.addWait();
                        setTimeout(function () {
                            if (e && e.state != null) {
                                //self.registerState = false;

                                // eliminamos la suscripción para no registrar el cambio de estado que vamos a provocar
                                self.off(events, $.proxy(_addToHistory, self));

                                // gestionamos la actualización para volver a suscribirnos a los eventos del mapa                        
                                $.when(_loadIntoMap(e.state)).then(function () {
                                    setTimeout(function () {
                                        self.on(events, $.proxy(_addToHistory, self));
                                    }, 200);
                                    self.loadingCtrl && self.loadingCtrl.removeWait(wait);
                                });
                            }
                        }, MIN_TIMEOUT_VALUE);
                    });
                });
            });
        };

        var currentState = null;
        var previousState = null;

        var _addToHistory = function (e) {
            var CUSTOMEVENT = '.tc';

            var state = _getMapState();
            if (self.replaceCurrent) {
                window.history.replaceState(state, null, null);
                delete self.replaceCurrent;

                return;
            } else {

                /*if (self.registerState != undefined && !self.registerState) {
                    self.registerState = true;
                    return;
                }*/
                self.lastEventType = e.type;

                var saveState = function () {
                    previousState = currentState;
                    currentState = TC.Util.utf8ToBase64(state);
                    window.history.pushState(state, null, window.location.href.split('#').shift() + '#' + currentState);
                };

                if (e) {
                    switch (true) {
                        case (e.type == TC.Consts.event.BASELAYERCHANGE.replace(CUSTOMEVENT, '')):
                        case (e.type == TC.Consts.event.ZOOM.replace(CUSTOMEVENT, '')):
                        case (e.type == TC.Consts.event.LAYERORDER.replace(CUSTOMEVENT, '')):
                            saveState();
                            break;
                        case (e.type.toLowerCase().indexOf("LAYER".toLowerCase()) > -1):
                            // unicamente modifico el hash si la capa es WMS
                            if (e.layer.type == TC.Consts.layerType.WMS)
                                saveState();
                            break;
                    }
                }
            }
        };

        var _getMapState = function () {
            var state = {};

            var ext = self.getExtent();
            for (var i = 0; i < ext.length; i++) {
                if (Math.abs(ext[i]) > 180)
                    ext[i] = Math.floor(ext[i] * 1000) / 1000;
            }
            state.ext = ext;

            //determinar capa base
            state.base = self.getBaseLayer().id;

            //capas cargadas
            state.layers = [];

            var layer, entry;
            for (var i = 0; i < self.workLayers.length; i++) {
                layer = self.workLayers[i];
                if (layer.type == "WMS" && !layer.options.stateless) {
                    if (layer.layerNames && layer.layerNames.length) {
                        entry = {
                            u: TC.Util.isOnCapabilities(layer.url),
                            n: $.isArray(layer.names) ? layer.names.join(',') : layer.names,
                            o: layer.getOpacity(),
                            v: layer.getVisibility(),
                            h: layer.options.hideTitle
                        };

                        state.layers.push(entry);
                    }
                }
            }

            if (!window.jsonpack) {
                TC.syncLoadJS(TC.apiLocation + TC.Consts.url.JSONPACK);
            }
            return jsonpack.pack(state);
        };

        var _clearMap = function () {

            var layersToRemove = [];
            self.workLayers.forEach(function (layer) {
                if (layer.type != "vector") {
                    layersToRemove.push(layer);
                }
            });

            for (var i = 0; i < layersToRemove.length; i++) {
                self.removeLayer(layersToRemove[i]);
            }
        };

        var _loadIntoMap = function (stringOrJson) {

            var done = new $.Deferred(); // GLS lo añado para poder gestionar el final de la actualización de estado y volver a suscribirme a los eventos del mapa
            var promises = [];

            if (!self.loadingctrl) {
                self.loadingCtrl = self.getControlsByClass("TC.control.LoadingIndicator")[0];
            }

            if (!self.hasWait) {
                self.hasWait = self.loadingCtrl && self.loadingCtrl.addWait();
            }

            var resolved = function () {
                self.loadingCtrl && self.loadingCtrl.removeWait(self.hasWait);
                delete self.hasWait;
                done.resolve();
            };

            var obj;
            if (typeof (stringOrJson) == "string") {
                try {
                    obj = jsonpack.unpack(stringOrJson);
                }
                catch (error) {
                    try {
                        obj = JSON.parse(stringOrJson);
                    }
                    catch (err) {
                        TC.error(TC.Util.getLocaleString(self.options.locale, 'mapStateNotValid'));
                    }
                }
            } else {
                obj = stringOrJson;
            }

            if (obj) {

                //capa base
                if (obj.base != self.getBaseLayer().id) self.setBaseLayer(obj.base);

                //extent
                if (obj.ext) promises.push(self.setExtent(obj.ext));

                //capas cargadas        
                //borrar primero
                _clearMap();

                obj.layers = obj.layers || obj.capas || [];

                if (obj.layers.length > 0) {
                    for (var i = 0; i < obj.layers.length; i++) {
                        var capa = obj.layers[i];
                        var op = capa.o;
                        var visibility = capa.v;

                        var layerInConfig = false;
                        for (j = 0; j < self.options.workLayers.length; j++) {
                            var lyrCfg = $.extend({}, self.options.workLayers[j], { map: self });

                            if (lyrCfg.type !== TC.Consts.layerType.VECTOR) {

                                if (capa.u === lyrCfg.url && lyrCfg.layerNames.indexOf(capa.n)) {
                                    layerInConfig = true;
                                    lyrCfg.renderOptions.opacity = capa.o;
                                    lyrCfg.renderOptions.hide = !capa.v;
                                    promises.push(self.addLayer(lyrCfg).then(setVisibility));
                                    break;
                                }
                            }
                        }

                        if (!layerInConfig) {
                            promises.push(self.addLayer({
                                id: TC.getUID(),
                                url: TC.Util.isOnCapabilities(capa.u, capa.u.indexOf(window.location.protocol) < 0) || capa.u,
                                hideTitle: capa.h,
                                layerNames: capa.n ? capa.n.split(',') : "",
                                renderOptions: {
                                    opacity: capa.o,
                                    hide: !capa.v
                                }
                            }).then(function (layer) {
                                var rootNode = layer.wrap.getRootLayerNode();
                                layer.title = rootNode.Title || rootNode.title;
                                /*URI:el setOpacity recibe un nuevo parametro. Que indica si se no se va a lanzar evento LAYEROPACITY
                                esto es porque en el loadstate al establecer la opacidad dedido a un timeout pasados X segundos se lanzaba 
                                este evento y producía un push en el state innecesario*/
                                layer.setOpacity(op, true);
                                layer.setVisibility(visibility);
                            }));
                        }
                    }
                }

                $.when.apply($, promises).done(function () {
                    resolved();
                });
            }

            return done;
        };

        mapProto.getMapState = function () {
            var state = _getMapState();
            return TC.Util.utf8ToBase64(state);
        };

        mapProto.getPreviousMapState = function () {
            return previousState;
        };

        mapProto.checkLocation = function () {
            var hash = window.location.hash;

            if (hash && hash.length > 1) {
                hash = hash.substr(1);

                var obj;
                try {
                    obj = jsonpack.unpack(TC.Util.base64ToUtf8(hash));
                }
                catch (error) {
                    try {
                        obj = JSON.parse(TC.Util.base64ToUtf8(hash));
                    }
                    catch (err) {
                        TC.error(TC.Util.getLocaleString(self.options.locale, 'mapStateNotValid'), TC.Consts.msgErrorMode.TOAST);
                        return;
                    }
                }

                if (obj) {
                    var inValidState = false;
                    //chequeo la integriadad del objeto restaurado del State
                    if (!obj.hasOwnProperty("ext")) {
                        inValidState = true;
                        obj.ext = self.options.initialExtent;
                    }
                    if (!obj.hasOwnProperty("base")) {
                        inValidState = true;
                        obj.base = self.options.defaultBaseLayer;
                    }
                    if (!obj.hasOwnProperty("layers")) {
                        inValidState = true;
                        obj.layers = [];
                    }
                    else {
                        for (var i = obj.layers.length-1; i >=0; i--) {
                            if (!obj.layers[i] || !obj.layers[i].hasOwnProperty("u") || !obj.layers[i].hasOwnProperty("n")) { 
                                inValidState = true;
                                obj.layers.length = obj.layers.length - 1;
                                continue;
                            }
                            else if (!obj.layers[i].hasOwnProperty("o") || !obj.layers[i].hasOwnProperty("v") || !obj.layers[i].hasOwnProperty("h")) {
                                inValidState=true
                                jQuery.extend(obj.layers[i],{ 
                                    o:(obj.layers[i].o || 1),
                                    v: (obj.layers[i].v || true),
                                    h: (obj.layers[i].h || false)
                                });
                            }
                        }
                    }
                    if (inValidState)
                        TC.error(TC.Util.getLocaleString(self.options.locale, 'mapStateNotValid'), TC.Consts.msgErrorMode.TOAST);
                    return obj;
                }
                TC.error(TC.Util.getLocaleString(self.options.locale, 'mapStateNotValid'), TC.Consts.msgErrorMode.TOAST);
            }
            return;
        };

        var _checkIntegrity = function () {
        };

        /*
        *  _triggerLayersBeforeUpdateEvent: Triggers map beforeupdate event (jQuery.Event) when any layer starts loading
        *  Parameters: OpenLayers.Layer, event name ('loadstart', 'loadend')
        */
        var _triggerLayersBeforeUpdateEvent = function (e) {
            if (loadingLayerCount <= 0) {
                loadingLayerCount = 0;
                self.$events.trigger($.Event(TC.Consts.event.BEFOREUPDATE));
            }
            loadingLayerCount = loadingLayerCount + 1;
        };

        var _triggerLayersUpdateEvent = function (e) {
            loadingLayerCount = loadingLayerCount - 1;
            if (loadingLayerCount <= 0) {
                loadingLayerCount = 0;
                self.$events.trigger($.Event(TC.Consts.event.UPDATE));
            }
        };

        var buildLayout = function (layout) {
            var defered = $.Deferred();

            if (typeof (layout) === 'string') {
                var layoutName = layout;

                var tryGetFile = function (url, resource) {
                    var defer = $.Deferred();

                    //Comprobamos si existe el fichero enviando una petición HEAD
                    $.ajax({
                        type: 'HEAD',
                        url: url,
                        complete: function (message, text) {
                            defer.resolve({ resource: resource, found: message.status !== 404, url: url });
                        }
                    });

                    return defer.promise();
                };

                var isAbsoluteUrl = /^(https?:)?\/\//i.test(layoutName);

                var getFileFromAvailableLocation = function (key, fileName) {
                    var defered = $.Deferred();

                    // 1. Buscamos en un layout local
                    // 2. Buscamos en un layout en el API con el mismo nombre
                    // 3. Buscamos en el layout responsive del API
                    var urlsToQuery = [
                        layoutUrl + layoutName + '/' + fileName,
                        apiLayoutUrl + layoutName + '/' + fileName,
                        apiLayoutUrl + 'responsive' + '/' + fileName
                    ];

                    // flacunza: si la URL tiene pinta de ser absoluta es ella sola la más probable, así que la ponemos la primera
                    if (isAbsoluteUrl) {
                        urlsToQuery.unshift(layoutName + '/' + fileName);
                    }

                    var i = 0;
                    (function iterate(pos) {
                        tryGetFile(urlsToQuery[pos], key).done(function (result) {
                            if (result.found) {
                                defered.resolve(addFileToLayout(layout, result));
                            } else {
                                iterate(++pos);
                            }
                        });
                    })(i);


                    return defered.promise();
                };

                var addFileToLayout = function (layout, data) {
                    if (!(data.resource in layout)) {
                        var aux = $.extend(true, {}, layout);

                        var resourceUrl = (data.found ? data.url : apiLayoutUrl + layoutName + '/' + layoutFiles[data.resource]);
                        layout[data.resource] = resourceUrl;
                    }

                    return layout;
                };

                //buscamos el parámetro layout en la url del navegador
                var apiLayoutUrl = TC.apiLocation + 'TC/layout/';
                var layoutUrl = 'layout/';
                var defaultLayout = 'idena';
                var layout = {};
                //var layoutName = idena.layout ? idena.layout : defaultLayout;

                var layoutFiles = { script: 'script.js', style: 'style.css', markup: 'markup.html', config: 'config.json', i18n: 'resources' };
                var layoutFilesLength = Object.keys(layoutFiles).length;

                for (var key in layoutFiles) {
                    getFileFromAvailableLocation(key, layoutFiles[key]).done(function (layout) {
                        //Cuando hayamos rellenado el objeto layout, finalizamos
                        if (Object.keys(layout).length === layoutFilesLength) {
                            defered.resolve(layout);
                        }
                    });
                }
            } else {
                defered.resolve(layout);
            }

            return defered.promise();
        };


        TC.i18n = TC.i18n || {};
        // i18n: carga de recursos si no está cargados previamente
        TC.i18n.loadResources = TC.i18n.loadResources || function (condition, path, locale) {
            var result;
            if (condition) {
                result = $.ajax({
                    url: path + locale + '.json',
                    type: 'GET',
                    dataType: 'json',
                    success: function (data) {
                        TC.i18n[locale] = TC.i18n[locale] || {};
                        $.extend(TC.i18n[locale], data);
                        if (typeof (dust) !== 'undefined') {
                            dust.i18n.add(locale, TC.i18n[locale]);
                        }
                    }
                })
            }
            else {
                dust.i18n.add(locale, TC.i18n[locale]);
            }
            return result;
        };

        var i18nDeferreds = [];
        var locale = self.options.locale;
        var templatingDeferred = $.Deferred();
        i18nDeferreds.push(templatingDeferred);
        TC.loadJSInOrder(
            !window.dust || !window.dust.i18n,
            TC.url.templating,
            function () {
                if (locale) {
                    dust.i18n.setLanguages([locale]);

                    i18nDeferreds.push(TC.i18n.loadResources(!TC.i18n[locale], TC.apiLocation + 'TC/resources/', locale));
                }
                templatingDeferred.resolve();
            }
        );

        $.when.apply(this, i18nDeferreds).always(function () {

            if (self.options.layout) {
                buildLayout(self.options.layout).done(function (layout) {
                    self.$events.trigger($.Event(TC.Consts.event.BEFORELAYOUTLOAD, { map: self }));

                    var layoutURLs;
                    if (typeof layout === 'string') {
                        layoutURLs = { href: $.trim(layout) };
                    }
                    else if (
                        layout.hasOwnProperty('config') ||
                        layout.hasOwnProperty('markup') ||
                        layout.hasOwnProperty('style') ||
                        layout.hasOwnProperty('ie8Style') ||
                        layout.hasOwnProperty('script') ||
                        layout.hasOwnProperty('href') ||
                        layout.hasOwnProperty('i18n')
                    ) {
                        layoutURLs = $.extend({}, layout);
                    }
                    if (layoutURLs.href) {
                        layoutURLs.href += layoutURLs.href.match(/\/$/) ? '' : '/';
                    }
                    layoutURLs.config = layoutURLs.config || layoutURLs.href + 'config.json';
                    layoutURLs.markup = layoutURLs.markup || layoutURLs.href + 'markup.html';
                    layoutURLs.style = layoutURLs.style || layoutURLs.href + 'style.css';
                    layoutURLs.ie8Style = layoutURLs.ie8Style || layoutURLs.href + 'ie8.css';
                    layoutURLs.script = layoutURLs.script || layoutURLs.href + 'script.js';
                    layoutURLs.i18n = layoutURLs.i18n || layoutURLs.href + 'resources';
                    if (layoutURLs.i18n) {
                        layoutURLs.i18n += layoutURLs.i18n.match(/\/$/) ? '' : '/';
                    }

                    self.layout = layoutURLs;

                    var layoutDeferreds = [];

                    var i18LayoutDeferred = $.Deferred();
                    layoutDeferreds.push(i18LayoutDeferred);

                    if (layoutURLs.config) {
                        layoutDeferreds.push($.ajax({
                            url: layoutURLs.config,
                            type: 'GET',
                            dataType: 'json',
                            //async: Modernizr.canvas, // !IE8,
                            success: function (data) {
                                i18LayoutDeferred.resolve(data.i18n);
                                self.options = mergeOptions(data, options);
                            },
                            error: function (e, name, description) {
                                TC.error(name + ": " + description);
                                i18LayoutDeferred.resolve(false);
                            }
                        }));
                    }
                    else {
                        i18LayoutDeferred.resolve(false);
                    }

                    if (layoutURLs.markup) {
                        var markupDeferred;
                        if (locale) {
                            markupDeferred = $.Deferred();
                            layoutDeferreds.push(markupDeferred);
                        }
                        layoutDeferreds.push($.ajax({
                            url: layoutURLs.markup,
                            type: 'GET',
                            dataType: 'html',
                            //async: Modernizr.canvas, // !IE8
                            success: function (data) {
                                // markup.html puede ser una plantilla dust para soportar i18n, compilarla si es el caso
                                i18LayoutDeferred.then(function (i18n) {
                                    if (i18n && locale) {
                                        TC.i18n.loadResources(true, layoutURLs.i18n, locale).always(function () {
                                            var templateId = 'tc-markup';
                                            dust.loadSource(dust.compile(data, templateId));
                                            dust.render(templateId, null, function (err, out) {
                                                if (err) {
                                                    TC.error(err);
                                                    markupDeferred.reject();
                                                }
                                                else {
                                                    self._$div.append(out);
                                                    markupDeferred.resolve();
                                                }
                                            });
                                        });
                                    }
                                    else {
                                        self._$div.append(data);
                                        if (locale) {
                                            markupDeferred.resolve();
                                        }
                                    }
                                });
                            },
                            error: function () {
                                markupDeferred.reject();
                            }
                        }));
                    }

                    $.when.apply(this, layoutDeferreds).always(function () {
                        TC.loadJS(
                            layoutURLs.script,
                            layoutURLs.script,
                            function () {
                                setHeightFix(self._$div);
                                if (layoutURLs.style) {
                                    TC.loadCSS(layoutURLs.style);
                                }
                                if (!Modernizr.canvas && layoutURLs.ie8Style) {
                                    TC.loadCSS(layoutURLs.ie8Style);
                                }
                                init();
                            });
                    });
                });
            }
            else {
                init();
            }
        });

        // Borramos árboles de capas cacheados
        self.$events.on(TC.Consts.event.UPDATEPARAMS, function (e) {
            deleteTreeCache(e.layer);
        });
        self.$events.on(TC.Consts.event.ZOOM, function () {
            for (var i = 0; i < self.workLayers.length; i++) {
                deleteTreeCache(self.workLayers[i]);
            }
        });

        // Redefinimos TC.error para añadir un aviso en el mapa
        /*var oldError = TC.error;
        TC.error = function (text) {
            oldError(text);
            self.toast(text, { type: TC.Consts.msgType.ERROR, duration: TC.Cfg.toastDuration * 2 });
        };*/
        var oldError = TC.error;
        TC.error = function (text, options, subject) {
            if (!options) {
                oldError(text);
                self.toast(text, { type: TC.Consts.msgType.ERROR, duration: TC.Cfg.toastDuration * 2 });
            }
            else {
                var fnc = function (text, mode, subject) {
                    switch (mode) {
                        case TC.Consts.msgErrorMode.TOAST:
                            if (!self.toast) { console.warn("No existe el objeto Toast"); return; }
                            self.toast(text, { type: TC.Consts.msgType.ERROR, duration: TC.Cfg.toastDuration * 2 });
                            break;
                        case TC.Consts.msgErrorMode.EMAIL:
                            JL("onerrorLogger").fatalException(!subject ? text : {
                                "msg": subject,
                                "errorMsg": text,
                            }, null);
                            break;
                        case TC.Consts.msgErrorMode.CONSOLE:
                        default:
                            console.error(text)
                            break;
                    }
                }
                if (!$.isArray(options)) {
                    fnc(text, options, subject)
                }
                else {
                    for (var i = 0; i < options.length; i++)
                        fnc(text, options[i], subject)
                }
            }

        };
    };

    var deleteTreeCache = function (layer) {
        if (layer.type === TC.Consts.layerType.WMS) {
            layer.tree = null;
        }
    };

    /**
     * Función que mezcla opciones de mapa relativos a capa, teniendo cuidado de que puede haber objetos de opciones de capa o identificadores de capa.
     * En este último caso, si no son la opción prioritaria, hay que sustituirlos por los objetos de definiciones de capa.
     */
    var mergeLayerOptions = function (optionsArray, propertyName) {
        // lista de opciones de capa de los argumentos
        var layerOptions = $.map(optionsArray, function (elm) {
            var result = {};
            if (elm) {
                result[propertyName] = elm[propertyName];
            }
            return result;
        });
        // añadimos las opciones de capa de la configuración general
        var layerOption = {};
        layerOption[propertyName] = TC.Cfg[propertyName];
        layerOptions.unshift(layerOption);

        //Si se han definido baseLayers en el visor, hay que hacer un merge con las predefinidas en la API
        if (propertyName === 'baseLayers' && layerOptions[1]['baseLayers']) {
            layerOption = layerOptions[1];

            for (var i = 0; i < layerOption['baseLayers'].length; i++) {
                if (typeof layerOption['baseLayers'][i] === 'object') {
                    $.extend(layerOption['baseLayers'][i], $.grep(TC.Cfg.availableBaseLayers, function (elm) {
                        return elm.id === layerOption['baseLayers'][i].id;
                    })[0]);
                }
            }
        } else {
            layerOptions.unshift(true); // Deep merge
            layerOption = $.extend.apply(this, layerOptions);
        }

        return layerOption[propertyName];
    };

    var mergeOptions = function () {
        var result = $.extend.apply(this, $.merge([true, {}, TC.Cfg], arguments));
        result.baseLayers = mergeLayerOptions(arguments, 'baseLayers');
        result.workLayers = mergeLayerOptions(arguments, 'workLayers');
        return result;
    };

    var mapProto = TC.Map.prototype;

    /**
     * Añade una capa al mapa.
     * @method addLayer
     * @async
     * @param {TC.Layer|TC.cfg.LayerOptions|string} layer Objeto de capa, objeto de opciones del constructor de la capa, o identificador de capa.
     * @param {function} [callback] Función de callback.
     * @return {jQuery.Promise} Promesa de objeto {{#crossLink "TC.Layer"}}{{/crossLink}}
     */
    mapProto.addLayer = function (layer, callback) {
        var self = this;

        var rasterLayer = isRaster(layer);
        if (rasterLayer) {
            var plIdx;
            for (plIdx = 0, len = pendingLayers.length; plIdx < len; plIdx++) {
                if (!isRaster(pendingLayers[plIdx])) {
                    break;
                }
            }
            pendingLayers.splice(plIdx, 0, layer);
            pendingLayerCallbacks.splice(plIdx, 0, callback);
        }
        else {
            pendingLayers.push(layer);
            pendingLayerCallbacks.push(callback);
        }

        var layerDeferred = new $.Deferred();
        var getLayerId = function (l) {
            return typeof l === 'string' ? l : l.id;
        };
        // Si está el mapa cargando miramos si esta no es una de las capas planeadas en workLayers y baseLayers
        // Si es así, esperamos a esa también para que el mapa lance el evento MAPLOAD
        var layerId = getLayerId(layer);
        var layerFound = false;
        for (var i = 0; i < self.options.baseLayers.length && !layerFound; i++) {
            if (getLayerId(self.options.baseLayers[i]) === layerId) {
                layerFound = true;
            }
        }
        for (var i = 0; i < self.options.workLayers.length && !layerFound; i++) {
            if (getLayerId(self.options.workLayers[i]) === layerId) {
                layerFound = true;
            }
        }
        if (!layerFound && !self.isLoaded) {
            self._remainingLayers = self._remainingLayers + 1;
        }

        var lyr;
        var test;
        var objUrl;

        if (rasterLayer) {
            test = !TC.layer || !TC.layer.Raster;
            objUrl = TC.apiLocation + 'TC/layer/Raster.js';
        }
        else {
            test = !TC.layer || !TC.layer.Vector;
            objUrl = TC.apiLocation + 'TC/layer/Vector.js';
        }
        TC.loadJS(
            test,
            [objUrl],
            function () {
                if (typeof layer === 'string') {
                    for (var i = 0; i < TC.Cfg.availableBaseLayers.length; i++) {
                        if (TC.Cfg.availableBaseLayers[i].id === layer) {
                            lyr = new TC.layer.Raster($.extend({}, TC.Cfg.availableBaseLayers[i], { map: self }));
                            break;
                        }
                    }
                }
                else {
                    if (layer instanceof TC.Layer) {
                        lyr = layer;
                        lyr.map = self;
                    }
                    else {
                        layer.map = self;
                        if (layer.type === TC.Consts.layerType.VECTOR || layer.type === TC.Consts.layerType.KML || layer.type === TC.Consts.layerType.WFS) {
                            lyr = new TC.layer.Vector(layer);
                        }
                        else {
                            lyr = new TC.layer.Raster(layer);
                        }
                    }
                }

                var iLayer = $.inArray(layer, pendingLayers);
                if (iLayer < 0) iLayer = 0;
                pendingLayers[iLayer] = lyr;
                pendingLayerCallbacks[iLayer] = callback;
                self.$events.trigger($.Event(TC.Consts.event.BEFORELAYERADD, { layer: lyr }));

                $.when(self.wrap.getMap(), lyr.wrap.getLayer()).then(function () {

                    var processedLayers = $.grep(pendingLayers, function (elm) {
                        return elm.wrap && elm.wrap.isNative(elm.wrap.getLayer());
                    });
                    if (processedLayers.length === pendingLayers.length) {
                        // All OpenLayers layers loaded, we can add to OpenLayers map. This is done to preserve layer order.
                        var nPendingLayers = pendingLayers.length;
                        for (var i = 0; i < nPendingLayers; i++) {
                            var l = pendingLayers.shift();
                            var c = pendingLayerCallbacks.shift();
                            var idx = -1;
                            // Nos aseguramos de que las capas raster se quedan por debajo de las vectoriales
                            if (isRaster(l)) {
                                idx = self.wrap.indexOfFirstVector();
                            }
                            if (idx === -1) {
                                idx = self.wrap.getLayerCount();
                            }

                            if (l) {
                                if (l.isCompatible(self.crs)) {
                                    self.layers[self.layers.length] = l;
                                    if (l.isBase) {
                                        if (self.state) {
                                            l.isDefault = self.state.base === l.id;
                                        }
                                        else if (typeof self.options.defaultBaseLayer === 'string') {
                                            l.isDefault = self.options.defaultBaseLayer === l.id;
                                        }
                                        else if (typeof self.options.defaultBaseLayer === 'number') {
                                            l.isDefault = self.options.defaultBaseLayer === self.baseLayers.length;
                                        }
                                        if (l.isDefault) {
                                            self.wrap.setBaseLayer(l.wrap.getLayer());
                                            self.baseLayer = l;
                                        }
                                        self.baseLayers[self.baseLayers.length] = l;
                                        // If no base layer set, set the first one
                                        if (self.options.baseLayers.length === self.baseLayers.length && !self.baseLayer) {
                                            self.wrap.setBaseLayer(self.baseLayers[0].wrap.getLayer());
                                        }
                                    }
                                    else {
                                        self.wrap.insertLayer(l.wrap.getLayer(), idx);
                                        self.workLayers[self.workLayers.length] = l;
                                    }
                                    self.$events.trigger($.Event(TC.Consts.event.LAYERADD, { layer: l }));
                                    if ($.isFunction(c)) {
                                        c(l);
                                    }

                                }
                                else {
                                    var errorMessage = 'Layer "' + l.title + '" ("' + l.names + '"): ';
                                    var reason;
                                    if (l.isValidFromNames()) {
                                        reason = 'layerSrsNotCompatible'
                                    } else {
                                        reason = 'layerNameNotValid';
                                    }
                                    errorMessage += TC.Util.getLocaleString(self.options.locale, reason);
                                    TC.error(errorMessage);
                                    self.$events.trigger($.Event(TC.Consts.event.LAYERERROR, { layer: l, reason: reason }));
                                }
                            }
                            self._remainingLayers = self._remainingLayers - 1;
                            if (self._remainingLayers === 0) {
                                if (!self.isLoaded) {
                                    self.isLoaded = true;
                                    self.$events.trigger($.Event(TC.Consts.event.MAPLOAD));
                                }
                            }
                        }
                    }
                    layerDeferred.resolve(lyr);
                });
            }
        );
        return layerDeferred.promise();
    };


    mapProto.removeLayer = function (layer) {
        var self = this;
        var result = new $.Deferred();

        $.when(layer.wrap.getLayer()).then(function (olLayer) {
            for (var i = 0; i < self.layers.length; i++) {
                if (self.layers[i] === layer) {
                    self.layers.splice(i, 1);
                }
            }
            if (layer.isBase) {
                for (var i = 0; i < self.baseLayers.length; i++) {
                    if (self.baseLayers[i] === layer) {
                        self.baseLayers.splice(i, 1);
                        if (self.baseLayer === layer) {
                            self.setBaseLayer(self.baseLayers[0]);
                        }
                        break;
                    }
                }
            }
            else {
                for (var i = 0; i < self.workLayers.length; i++) {
                    if (self.workLayers[i] === layer) {
                        self.workLayers.splice(i, 1);
                        break;
                    }
                }
                if (layer === self.vectors) {
                    self.vectors = null;
                }
            }
            self.wrap.removeLayer(olLayer);
            self.$events.trigger($.Event(TC.Consts.event.LAYERREMOVE, { layer: layer }));
            result.resolve(layer);
        });

        return result;
    };


    mapProto.insertLayer = function (layer, idx, callback) {
        var self = this;
        var beforeIdx = -1;
        for (var i = 0; i < self.layers.length; i++) {
            if (layer === self.layers[i]) {
                beforeIdx = i;
                break;
            }
        }

        var promises = [];
        promises.push(layer.wrap.getLayer());
        var targetLayer = self.layers[idx];
        if (targetLayer) {
            promises.push(targetLayer.wrap.getLayer());
        }
        $.when.apply(this, promises).then(function (olLayer, olTargetLayer) {
            var olIdx = -1;
            if (olTargetLayer) {
                olIdx = self.wrap.getLayerIndex(olTargetLayer);
            }
            else {
                olIdx = self.wrap.getLayerCount();
            }
            if (olIdx >= 0) {
                layer.map = self;
                self.wrap.insertLayer(olLayer, olIdx);
                if (beforeIdx > -1) {
                    self.layers.splice(beforeIdx, 1);
                }
                self.layers.splice(idx, 0, layer);
                self.workLayers = $.grep(self.layers, function (elm) {
                    return !elm.isBase;
                });
                self.$events.trigger($.Event(TC.Consts.event.LAYERORDER, { layer: layer, oldIndex: beforeIdx, newIndex: idx }));
            }
            if ($.isFunction(callback)) {
                callback();
            }
        });
    };

    mapProto.setLayerIndex = function (layer, idx) {
        this.wrap.setLayerIndex(layer.wrap.getLayer(), idx);
    };

    mapProto.putLayerOnTop = function (layer) {
        var self = this;
        var n = self.wrap.getLayerCount();
        self.setLayerIndex(layer, n - 1);
    };

    /*
    *  setBaseLayer: Set a layer as base layer, must be in layers collection
    *  Parameters: TC.Layer or string, callback which accepts layer as parameter
    *  Returns: TC.Layer promise
    */
    mapProto.setBaseLayer = function (layer, callback) {
        var self = this;
        var result = null;
        var found = false;
        if (typeof layer === 'string') {
            var i;
            for (i = 0; i < self.layers.length; i++) {
                if (self.layers[i].id === layer) {
                    layer = self.layers[i];
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (i = 0; i < TC.Cfg.availableBaseLayers.length; i++) {
                    if (TC.Cfg.availableBaseLayers[i].id === layer) {
                        layer = self.addLayer($.extend(true, {}, TC.Cfg.availableBaseLayers[i], { isDefault: true, map: self }));
                        found = true;
                        break;
                    }
                }
            }
        }
        else {
            found = $.inArray(layer, self.layers) >= 0;
        }
        if (!found) {
            TC.error('Base layer is not in layers collection');
        }
        else {
            self.$events.trigger($.Event(TC.Consts.event.BEFOREBASELAYERCHANGE, { oldLayer: self.getBaseLayer(), newLayer: layer }));

            result = layer;
            $.when(self.wrap.getMap(), layer).then(function (olMap, lyr) {
                $.when(lyr.wrap.getLayer()).then(function (olLayer) {
                    self.wrap.setBaseLayer(olLayer).then(function () {
                        self.baseLayer = lyr;
                        self.$events.trigger($.Event(TC.Consts.event.BASELAYERCHANGE, { layer: lyr }));
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    });
                });
            });
        }
        return result;
    };

    //TC.inherit(TC.Map, TC.Object);
    mapProto.on = function (events, callback) {
        var obj = this;
        obj.$events.on(events, callback);
        return obj;
    };

    mapProto.one = function (events, callback) {
        var obj = this;
        obj.$events.one(events, callback);
        return obj;
    };

    mapProto.off = function (events, callback) {
        var obj = this;
        obj.$events.off(events, callback);
        return obj;
    };

    /**
     * Asigna un callback que se ejecutará cuando los controles del mapa se hayan cargado.
     * @method ready
     * @async
     * @param {function} [callback] Función a ejecutar.
     */
    mapProto.ready = function (callback) {
        var self = this;
        if ($.isFunction(callback)) {
            if (self.isReady) {
                callback();
            }
            else {
                self.one(TC.Consts.event.MAPREADY, callback);
            }
        }
    };

    /**
     * Asigna un callback que se ejecutará cuando los controles y las capas iniciales del mapa se hayan cargado.
     * @method loaded
     * @async
     * @param {function} [callback] Función a ejecutar.
     */
    mapProto.loaded = function (callback) {
        var self = this;
        if ($.isFunction(callback)) {
            if (self.isLoaded) {
                callback();
            }
            else {
                self.one(TC.Consts.event.MAPLOAD, callback);
            }
        }
    };



    /**
     * Devuelve un árbol de capas del mapa.
     * @method getLayerTree
     * @return {TC.LayerTree}
     */
    mapProto.getLayerTree = function () {


        var _traverse = function (o, func) {
            for (var i in o.children) {
                if (o.children && o.children.length > 0) {
                    //bajar un nivel en el árbol
                    _traverse(o.children[i], func);
                }

                func.apply(this, [o]);
            }
        };



        var self = this;
        var result = { baseLayers: [], workLayers: [] };
        if (self.baseLayer) {
            result.baseLayers[0] = self.baseLayer.getTree();
        }
        for (var i = 0; i < self.workLayers.length; i++) {
            var tree = self.workLayers[i].getTree();

            if (tree) {
                result.workLayers.unshift(tree);
            }
        }
        return result;
    };

    /**
     * Añade un control al mapa.
     * @method addControl
     * @async
     * @param {TC.Control|string} control Control a añadir o nombre del control
     * @param {object} [options] Objeto de opciones de configuración del control. Consultar el parámetro de opciones del constructor del control.
     * @return {jQuery.Promise} Promesa de objeto {{#crossLink "TC.Control"}}{{/crossLink}}
     */
    mapProto.addControl = function (control, options) {
        var self = this;
        var controlDeferred = new $.Deferred();

        var _addCtl = function (ctl) {
            self.controls.push(ctl);
            ctl.register(self);
            $dv = $(ctl.div);
            if ($dv.parent().length === 0) {
                $dv.appendTo(self._$div);
            }
            self.$events.trigger($.Event(TC.Consts.event.CONTROLADD, { control: ctl }));
            controlDeferred.resolve(ctl);
        };

        if (typeof control === 'string') {
            control = control.substr(0, 1).toUpperCase() + control.substr(1);
            TC.loadJS(
                !TC.Control || !TC.control[control],
                [TC.apiLocation + 'TC/control/' + control],
                function () {
                    _addCtl(new TC.control[control](null, options));
                }
            );
        }
        else {
            _addCtl(control);
        }

        return controlDeferred.promise();
    };

    /**
     * Devuelve la lista de controles que son de la clase especificada.
     * @method getControlsByClass
     * @param {function|string} classObj Nombre de la clase o función constructora de la clase.
     * @return {array}
     */
    mapProto.getControlsByClass = function (classObj) {
        var self = this;
        var result = [];
        var obj = classObj;
        if (typeof classObj === 'string') {
            obj = window;
            var namespaces = classObj.split('.');
            for (var i = 0; i < namespaces.length; i++) {
                obj = obj[namespaces[i]];
                if (!obj) {
                    break;
                }
            }
        }
        if ($.isFunction(obj)) {
            for (var i = 0; i < self.controls.length; i++) {
                var ctl = self.controls[i];
                if (ctl instanceof obj) {
                    result.push(ctl);
                }
            }
        }

        return result;
    };

    mapProto.getDefaultControl = function () {
        var candidate = this.getControlsByClass("TC.control.FeatureInfo");
        if (candidate && candidate.length)
            return candidate[0];
        else
            return null;
    };

    /**
     * Devuelve el primer control del mapa que sea de la clase {{#crossLink "TC.control.LoadingIndicator"}}{{/crossLink}}.
     * @method getLoadingIndicator
     * @return {TC.control.LoadingIndicator}
     */
    mapProto.getLoadingIndicator = function () {
        var result = null;
        var ctls = this.getControlsByClass('TC.control.LoadingIndicator');
        if (ctls.length) {
            result = ctls[0];
        }
        return result;
    };

    /**
     * Establece la extensión del mapa.
     * @method setExtent
     * @param {array} extent Array de cuatro números que representan las coordenadas x mínima, y mínima, x máxima e y máxima respectivamente.
     * @param {object} [options] Objeto de opciones.
     * @param {boolean} [options.animate=true] Establece si se realiza una animación al cambiar la extensión.
     * La unidad de las coordenadas es la correspondiente al CRS del mapa.
     */
    mapProto.setExtent = function (extent, options) {
        return this.wrap.setExtent(extent, options);
    };

    /**
     * Obtiene la extensión actual del mapa.
     * @method getExtent
     * @return {array} Array de cuatro números que representan las coordenadas x mínima, y mínima, x máxima e y máxima respectivamente.
     * La unidad de las coordenadas es la correspondiente al CRS del mapa.
     */
    mapProto.getExtent = function () {
        return this.wrap.getExtent();
    };

    /**
     * Establece el centro del mapa.
     * @method setCenter
     * @param {array} coord Array de dos números que representan la coordenada del punto en las unidades correspondientes al CRS del mapa.
     * @param {object} [options] Objeto de opciones.
     * @param {boolean} [options.animate=true] Establece si se realiza una animación al centrar.
     */
    mapProto.setCenter = function (coord, options) {
        this.wrap.setCenter(coord, options);
    };

    mapProto.getCenter = function () {
        return this.wrap.getCenter();
    };

    mapProto.setRotation = function (rotation) {
        this.wrap.setRotation(rotation);
    };

    mapProto.getRotation = function () {
        return this.wrap.getRotation();
    };

    mapProto.getViewHTML = function () {
        return this.wrap.getViewport();
    };

    /**
     * Obtiene una coordenada a partir de una posición del área de visualización del mapa en píxeles.
     * @method getCoordinateFromPixel
     * @param {array} xy Coordenada en píxeles de la posición en el área de visualización.
     * @return {array} Array de dos números que representa las coordenada del punto en las unidades correspondientes al CRS del mapa.
     */
    mapProto.getCoordinateFromPixel = function (xy) {
        return this.wrap.getCoordinateFromPixel(xy);
    };

    /**
     * Obtiene una posición en el área de visualización a partir de una coordenada.
     * @method getCoordinateFromPixel
     * @param {array} coord Coordenada en el mapa.
     * @return {array} Array de dos números que representa las posición del punto en píxeles.
     */
    mapProto.getPixelFromCoordinate = function (coord) {
        return this.wrap.getPixelFromCoordinate(coord);
    };

    /**
     * Establece la extensión del mapa de forma que abarque todas las entidades geográficas pasadas por parámetro.
     * @method zoomToFeatures
     * @param {array} features Array de entidades geográficas. Si está vacío este método no hace nada.
     * @param {object} [options] Objeto de opciones de zoom.
     * @param {number} [options.pointBoundsRadius=30] Radio en metros del área alrededor del punto que se respetará al hacer zoom.
     * @param {number} [options.extentMargin=0.2] Tamaño del margen que se aplicará a la extensión total de todas las entidades. 
     * @param {boolean} [options.animate=false] Realizar animación al hacer el zoom. 
     * El valor es la relación resultante de la diferencia de dimensiones entre la extensión ampliada y la original relativa a la original.
     */
    mapProto.zoomToFeatures = function (features, options) {
        var self = this;
        if (features.length > 0) {
            var bounds = [Infinity, Infinity, -Infinity, -Infinity];
            var opts = options || {};
            var radius = opts.pointBoundsRadius || self.options.pointBoundsRadius;
            radius = self.wrap.isGeo() ? radius / TC.Util.getMetersPerDegree(self.getExtent()) : radius;
            var extentMargin = opts.extentMargin;
            if (typeof extentMargin !== 'number') {
                extentMargin = self.options.extentMargin;
            }
            for (var i = 0; i < features.length; i++) {
                var b = features[i].getBounds();
                if (b) {
                    bounds[0] = Math.min(bounds[0], b[0]);
                    bounds[1] = Math.min(bounds[1], b[1]);
                    bounds[2] = Math.max(bounds[2], b[2]);
                    bounds[3] = Math.max(bounds[3], b[3]);
                }
            }
            if (bounds[2] - bounds[0] === 0) {
                bounds[0] = bounds[0] - radius;
                bounds[2] = bounds[2] + radius;
            }
            if (bounds[3] - bounds[1] === 0) {
                bounds[1] = bounds[1] - radius;
                bounds[3] = bounds[3] + radius;
            }
            if (self.options.extentMargin) {
                var dx = (bounds[2] - bounds[0]) * extentMargin / 2;
                var dy = (bounds[3] - bounds[1]) * extentMargin / 2;
                bounds[0] = bounds[0] - dx;
                bounds[1] = bounds[1] - dy;
                bounds[2] = bounds[2] + dx;
                bounds[3] = bounds[3] + dy;
            }
            if (self.options.maxExtent) {
                bounds[0] = Math.max(bounds[0], self.options.maxExtent[0]);
                bounds[1] = Math.max(bounds[1], self.options.maxExtent[1]);
                bounds[2] = Math.min(bounds[2], self.options.maxExtent[2]);
                bounds[3] = Math.min(bounds[3], self.options.maxExtent[3]);
            }
            self.wrap.setExtent(bounds, opts);

            // GLS: Necesito diferenciar un zoom programático de un zoom del usuario para la gestión del zoom en 3D
            self.$events.trigger($.Event(TC.Consts.event.ZOOMTO, { extent: bounds }));
        }
    };

    /**
     * Establece la extensión del mapa de forma que abarque todas los marcadores que existen en él.
     * El método espera a todos los marcadores pendientes de incluir, dado que el método {{#crossLink "TC.Map/addMarker:method"}}{{/crossLink}} es asíncrono.
     * @method zoomToMarkers
     */
    mapProto.zoomToMarkers = function (options) {
        var self = this;
        $.when.apply(this, self._markerDeferreds).then(function () {
            var markers = [];
            for (var i = 0; i < self.workLayers.length; i++) {
                var layer = self.workLayers[i];
                if (layer.type === TC.Consts.layerType.VECTOR) {
                    for (var j = 0; j < layer.features.length; j++) {
                        var feature = layer.features[j];
                        if (feature instanceof TC.feature.Marker) {
                            markers[markers.length] = feature;
                        }
                    }
                }
            }
            // Miramos los marcadores de la capa vectores que puede no estar todavía en workLayers.
            for (var i = 0; i < arguments.length; i++) {
                markers[markers.length] = arguments[i];
            }
            self.zoomToFeatures(markers, options);
            self._markerDeferreds = [];
        });
    };

    /**
     * Obtiene una capa por su identificador o devuelve la propia capa.
     * @method getLayer
     * @param {string|TC.Layer} layer Identificador de la capa u objeto de capa.
     * @return {TC.Layer}
     */
    mapProto.getLayer = function (layer) {
        var self = this;
        var result = null;
        if (typeof layer === 'string') {
            for (var i = 0; i < self.layers.length; i++) {
                if (self.layers[i].id === layer) {
                    result = self.layers[i];
                    break;
                }
            }
        }
        else if (TC.Layer && layer instanceof TC.Layer) {
            result = layer;
        }
        return result;
    };

    var _getVectors = function (map) {
        var result;
        if (!map.vectors) {
            result = map.addLayer({
                id: TC.getUID(), title: TC.i18n[map.options.locale]['vectors'], type: TC.Consts.layerType.VECTOR
            });
            map.vectors = result;
            $.when(result).then(function (vectors) {
                map.vectors = vectors;
            });
        }
        else {
            result = map.vectors;
        }
        return result;
    };

    /**
     * Añade un punto al mapa. Si no se especifica una capa en el parámetro de opciones se añadirá a una capa vectorial destinada a añadir entidades geográficas.
     * Esta capa se crea al añadir por primera vez una entidad sin especificar capa.
     * @method addPoint
     * @async
     * @param {array} coord Array de dos números representando la coordenada del punto en las unidades del CRS del mapa.
     * @param {TC.cfg.PointStyleOptions} [options] Opciones del punto.
     */
    mapProto.addPoint = function (coord, options) {
        var self = this;
        if (options && options.layer) {
            var layer = self.getLayer(options.layer);
            if (layer) {
                layer.addPoint(coord, options);
            }
        }
        else {
            $.when(_getVectors(self)).then(function (vectors) {
                vectors.addPoint(coord, options);
            });
        }
    };

    /**
     * Añade un marcador puntual al mapa. Si no se especifica una capa en el parámetro de opciones se añadirá a una capa vectorial destinada a añadir entidades geográficas.
     * Esta capa se crea al añadir por primera vez una entidad sin especificar capa.
     * @method addMarker
     * @async
     * @param {array} coord Array de dos números representando la coordenada del punto en las unidades del CRS del mapa.
     * @param {TC.cfg.MarkerStyleOptions} [options] Opciones del marcador.
     */
    mapProto.addMarker = function (coord, options) {
        var self = this;
        if (options && options.layer) {
            var layer = self.getLayer(options.layer);
            if (layer) {
                self._markerDeferreds.push(layer.addMarker(coord, options));

            }
        }
        else {
            // Se añade un deferred más para evitar que zoomToMarkers salte antes de poblarse el array _markerDeferreds.
            var vectorsAndMarkerDeferred = new $.Deferred();
            self._markerDeferreds.push(vectorsAndMarkerDeferred);
            $.when(_getVectors(self)).then(function (vectors) {
                $.when(vectors.addMarker(coord, options)).then(function (marker) {
                    vectorsAndMarkerDeferred.resolve(marker);
                });
            });
        }
    };

    /**
     * Añade una polilínea al mapa. Si no se especifica una capa en el parámetro de opciones se añadirá a una capa vectorial destinada a añadir entidades geográficas.
     * Esta capa se crea al añadir por primera vez una entidad sin especificar capa.
     * @method addPolyline
     * @async
     * @param {array} coords Array de arrays de dos números representando las coordenadas de los vértices en las unidades del CRS del mapa.
     * @param {object} [options] Opciones de la polilínea.
     */
    mapProto.addPolyline = function (coords, options) {
        var self = this;
        if (options && options.layer) {
            var layer = self.getLayer(options.layer);
            if (layer) {
                options.layer.addPolyline(coords, options);
            }
        }
        else {
            $.when(_getVectors(self)).then(function (vectors) {
                vectors.addPolyline(coords, options);
            });
        }
    };

    /**
     * Añade un polígono al mapa. Si no se especifica una capa en el parámetro de opciones se añadirá a una capa vectorial destinada a añadir entidades geográficas.
     * Esta capa se crea al añadir por primera vez una entidad sin especificar capa.
     * @method addPolygon
     * @async
     * @param {array} coords Array que contiene anillos. Estos a su vez son arrays de arrays de dos números representando las coordenadas de los vértices en las unidades del CRS del mapa.
     * El primer anillo es el exterior y el resto son islas. No es necesario cerrar los anillos (poner el mismo vértice al principio y al final).
     * @param {object} [options] Opciones del polígono.
     */
    mapProto.addPolygon = function (coords, options) {
        var self = this;
        if (options && options.layer) {
            var layer = self.getLayer(options.layer);
            if (layer) {
                options.layer.addPolygon(coords, options);
            }
        }
        else {
            $.when(_getVectors(self)).then(function (vectors) {
                vectors.addPolygon(coords, options);
            });
        }
    };




    mapProto.getBaseLayer = function () {
        return this.baseLayer || this.baseLayers[0];
    };

    mapProto.getResolutions = function () {
        return this.getBaseLayer().getResolutions();
    };

    mapProto.getResolution = function () {
        return this.wrap.getResolution();
    };

    mapProto.setResolution = function (resolution) {
        this.wrap.setResolution(resolution);
    };

    mapProto.exportFeatures = function (features, options) {
        var self = this;
        var opts = options || {};
        var loadingCtl = self.getLoadingIndicator();
        var waitId = loadingCtl && loadingCtl.addWait();
        var text = self.wrap.exportFeatures(features, opts);
        var mimeType = TC.Consts.mimeType[opts.format];
        var format = opts.format || "";
        TC.Util.downloadFile((opts.fileName || TC.getUID()) + '.' + format.toLowerCase(), mimeType, text);
        loadingCtl && loadingCtl.removeWait(waitId);
    };


    var toastContainerClass = 'tc-toast-container';
    var toastClass = 'tc-toast';
    var toasts = {};
    var toastHide = function () {
        var $toast = $(this);
        var $container = $toast.parent('.' + toastContainerClass);
        var text = $toast.html();
        $toast.addClass(TC.Consts.classes.HIDDEN);
        if (toasts[text] !== undefined) {
            toasts[text] = undefined;
        }
        setTimeout(function () {
            $toast.remove();
            if (!$container.find('.' + toastClass).length) {
                $container.remove();
            }
        }, 1000);
    };

    mapProto.toast = function (text, options) {
        var self = this;
        var opts = options || {
        };
        var duration = opts.duration || TC.Cfg.toastDuration;
        var toastInfo = toasts[text];
        if (toastInfo) {
            clearTimeout(toastInfo.timeout);
            toastInfo.$toast.remove();
        }
        var $container = self._$div.find('.' + toastContainerClass);
        if (!$container.length) {
            $container = $('<div>')
                .addClass(toastContainerClass)
                .appendTo(self._$div);
        }
        toastInfo = toasts[text] = {
            $toast: $('<div>')
                .addClass(toastClass)
                .html(text)
                .appendTo($container)
                .on(TC.Consts.event.CLICK, toastHide)
        }

        var className = '';
        switch (opts.type) {
            case TC.Consts.msgType.INFO:
                className = TC.Consts.classes.INFO;
                break;
            case TC.Consts.msgType.WARNING:
                className = TC.Consts.classes.WARNING;
                break;
            case TC.Consts.msgType.ERROR:
                className = TC.Consts.classes.ERROR;
                break;
        }
        toastInfo.$toast.addClass(className);

        toastInfo.timeout = setTimeout(function () {
            toastHide.call(toastInfo.$toast);
        }, duration);
    };

    // iPad iOS7 bug fix
    var mapHeightNeedsFix = false;
    var setHeightFix = function ($div) {
        if (/iPad/i.test(navigator.userAgent)) {
            var ih = window.innerHeight;
            var mh = $div.height();
            var dh = Modernizr.mq('only screen and (orientation : landscape)') ? 20 : 0;
            if (mh === ih + dh) {
                mapHeightNeedsFix = true;
            }
        }
        var fix = function () {
            $div.toggleClass(TC.Consts.classes.IPAD_IOS7_FIX, Modernizr.mq('only screen and (orientation : landscape)'));
        };
        if (mapHeightNeedsFix) {
            fix();
            $(window).on('resize', fix);
        }
        else {
            $(window).off('resize', fix);
        }
    };

    var isRaster = function (layer) {
        return typeof layer === 'string' || (layer.type !== TC.Consts.layerType.VECTOR && layer.type !== TC.Consts.layerType.KML && layer.type !== TC.Consts.layerType.WFS);
    };

    mapProto.exportImage = function () {
        var self = this;
        var result = null;
        var errorMsg = 'El mapa actual no es compatible con la exportación de imágenes';
        var canvas = self.wrap.getViewport({ synchronous: true }).getElementsByTagName('canvas')[0];
        if (canvas && self.options.crossOrigin) {
            try {
                result = canvas.toDataURL();
            }
            catch (e) {
                TC.error(errorMsg + ': ' + e.message);
            }
        }
        else {
            TC.error(errorMsg);
        }
        return result;
    };
})();

/**
 * Árbol de capas del mapa.
 * Esta clase no tiene constructor.
 * @class TC.LayerTree
 * @static
 */
/**
 * Lista de árboles de (objetos de la clase {{#crossLink "TC.layer.LayerTree"}}{{/crossLink}}) de todas las capas base del mapa.
 * @property baseLayers
 * @type array
 */
/**
 * Lista de árboles de (objetos de la clase {{#crossLink "TC.layer.LayerTree"}}{{/crossLink}}) de todas las capas de trabajo del mapa.
 * @property workLayers
 * @type array
 */

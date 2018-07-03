var TC = TC || {};

(function () {

    /**
     * <p>Objeto principal de la API, instancia un mapa dentro de un elemento del DOM. N\u00f3tese que el constructor es as\u00edncrono, por tanto cualquier c\u00f3digo que haga uso de este objeto deber\u00eda
     * estar dentro de una funci\u00f3n de callback pasada como par\u00e1metro al m\u00e9todo {{#crossLink "TC.Map/loaded:method"}}{{/crossLink}}.</p>
     * <p>Puede consultar tambi\u00e9n online el <a href="../../examples/Map.1.html">ejemplo 1</a>, el <a href="../../examples/Map.2.html">ejemplo 2</a> y el <a href="../../examples/Map.3.html">ejemplo 3</a>.</p>
     * @class TC.Map
     * @extends TC.Object
     * @constructor
     * @async
     * @param {HTMLElement|string} div Elemento del DOM en el que crear el mapa o valor de atributo id de dicho elemento.
     * @param {object} [options] Objeto de opciones de configuraci\u00f3n del mapa. Sus propiedades sobreescriben el objeto de configuraci\u00f3n global {{#crossLink "TC.Cfg"}}{{/crossLink}}.
     * @param {string} [options.crs="EPSG:25830"] C\u00f3digo EPSG del sistema de referencia espacial del mapa.
     * @param {array} [options.initialExtent] Extensi\u00f3n inicial del mapa definida por x m\u00ednima, y m\u00ednima, x m\u00e1xima, y m\u00e1xima. 
     * Esta opci\u00f3n es obligatoria si el sistema de referencia espacial del mapa es distinto del sistema por defecto (ver TC.Cfg.{{#crossLink "TC.Cfg/crs:property"}}{{/crossLink}}).
     * Para m\u00e1s informaci\u00f3n consultar TC.Cfg.{{#crossLink "TC.Cfg/initialExtent:property"}}{{/crossLink}}.
     * @param {array} [options.maxExtent] Extensi\u00f3n m\u00e1xima del mapa definida por x m\u00ednima, y m\u00ednima, x m\u00e1xima, y m\u00e1xima. Para m\u00e1s informaci\u00f3n consultar TC.Cfg.{{#crossLink "TC.Cfg/maxExtent:property"}}{{/crossLink}}.
     * @param {string} [options.layout] URL de una carpeta de maquetaci\u00f3n. Consultar TC.Cfg.{{#crossLink "TC.Cfg/layout:property"}}{{/crossLink}} para ver instrucciones de uso de maquetaciones.
     * @param {array} [options.baseLayers] Lista de identificadores de capa o instancias de la clase {{#crossLink "TC.cfg.LayerOptions"}}{{/crossLink}} para incluir dichas capas como mapas de fondo. 
     * @param {array} [options.workLayers] Lista de identificadores de capa o instancias de la clase {{#crossLink "TC.cfg.LayerOptions"}}{{/crossLink}} para incluir dichas capas como contenido del mapa. 
     * @param {TC.cfg.MapControlOptions} [options.controls] Opciones de controles de mapa.
     * @param {TC.cfg.StyleOptions} [options.styles] Opciones de estilo de entidades geogr\u00e1ficas.
     * @param {string} [options.locale="es-ES"] C\u00f3digo de idioma de la interfaz de usuario. Este c\u00f3digo debe ser obedecer la sintaxis definida por la <a href="https://en.wikipedia.org/wiki/IETF_language_tag">IETF</a>.
     * Los valores posibles son <code>es-ES</code>, <code>eu-ES</code> y <code>en-US</code>.
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
     *         // Crear un mapa que tenga como contenido las capas de toponimia y mallas cartogr\u00e1ficas del WMS de IDENA.
     *         var map = new TC.Map("mapa", {
     *             workLayers: [
     *                 {
     *                     id: "topo_mallas",
     *                     title: "Toponimia y mallas cartogr\u00e1ficas",
     *                     type: TC.Consts.layerType.WMS,
     *                     url: "//idena.navarra.es/ogc/wms",
     *                     layerNames: "IDENA:toponimia,IDENA:mallas"
     *                 }
     *             ]
     *         });
     *     </script>
     */

    const getReduceByBooleanFunction = function (prop) {
        return function (prev, cur, idx) {
            return cur[prop] ? idx : prev;
        };
    };
    const getReduceByIdFunction = function (id) {
        return function (prev, cur, idx, arr) {
            return cur.id === id ? idx : prev;
        };
    };
    const layerBuffer = {
        layers: [],
        contains: function (id) {
            return this.layers.some(function (l) {
                return l.id === id;
            });
        },
        getIndex: function (id) {
            return this.layers.reduce(getReduceByIdFunction(id), -1);
        },
        add: function (id, deferred, isRaster, isBase) {
            var idx;
            const obj = {
                id: id,
                deferred: deferred,
                isRaster: isRaster,
                isBase: isBase
            };
            if (isRaster) {
                idx = layerBuffer.getRasterIndex();
                this.layers.splice(idx, 0, obj);
            }
            else {
                idx = this.layers.length;
                this.layers[idx] = obj;
            }
        },
        remove: function (id) {
            this.layers.splice(this.getIndex(id), 1);
        },
        getMapLayers: function () {
            return this.layers
                .filter(function (l) {
                    return l.deferred.state() === 'resolved';
                })
                .map(function (l) {
                    return l.mapLayer;
                });
        },
        resolve: function (map, layer, isBase) {
            this.layers[this.getIndex(layer.id)].mapLayer = layer;
            map.layers = this.getMapLayers();
            if (isBase) {
                map.baseLayers = map.layers.filter(function (l) {
                    return l.isBase;
                });
            }
            else {
                map.workLayers = map.layers.filter(function (l) {
                    return !l.isBase;
                });
            }
        },
        getResolvedWorkLayerIndex: function (map, id) {
            return this.layers.filter(function (l) {
                return l.id === id || (!l.isBase && l.deferred.state() !== 'pending');
            }).reduce(getReduceByIdFunction(id), -1);
        },
        getResolvedVisibleLayerIndex: function (map, id) {
            var index = this.getResolvedWorkLayerIndex(map, id);
            if (map.baseLayer) {
                index = index + 1;
            }
            return index;
        },
        getRasterIndex: function () {
            return this.layers.reduce(getReduceByBooleanFunction('isRaster'), -1) + 1;
        },
        checkMapLoad: function (map) {
            const self = this;
            if (map.options.baseLayers
                .concat(map.options.workLayers)
                .every(function (l) {
                    return self.contains(l.id || l);
                }) && // Si ya se han empezado a procesar todas las capas de las opciones
                !this.layers.some(function (layer) {
                    return layer.deferred.state() === 'pending'; // Si ya se han terminado de procesar
                })) {
                const throwMapLoad = function () {
                    if (!map.isLoaded) {
                        map.isLoaded = true;
                        map.$events.trigger($.Event(TC.Consts.event.MAPLOAD));
                        map._$div.removeClass(TC.Consts.classes.LOADING);
                    }
                };
                // Gestionamos el final de la carga del mapa
                if (map.baseLayer) {
                    throwMapLoad();
                }
                else {
                    // Si no hay capa base cargada cargamos la primera compatible
                    const lastResortBaseLayer = map.baseLayers.filter(function (layer) {
                        return !layer.mustReproject;
                    })[0];
                    map.wrap.setBaseLayer(lastResortBaseLayer.wrap.getLayer());
                    map.baseLayer = lastResortBaseLayer;
                    throwMapLoad();
                }
            }
        }
    };

    const getAvailableBaseLayer = function (id) {
        const ablCollection = this instanceof TC.Map ? this.options.availableBaseLayers : TC.Cfg.availableBaseLayers;
        return ablCollection.filter(function (abl) {
            return abl.id === id;
        })[0];
    }

    TC.Map = TC.Map || function (div, options) {
        ///<summary>
        ///Constructor
        ///</summary>
        ///<param name="div" type="HTMLElement|string">Elemento del DOM en el que crear el mapa o valor de atributo id de dicho elemento.</param>
        ///<param name="options" type="object" optional="true">Objeto de opciones de configuraci\u00f3n del mapa. Sus propiedades sobreescriben el objeto de configuraci\u00f3n global TC.Cfg.</param>
        ///<returns type="TC.Map"></returns>
        ///<field name='isReady' type='boolean'>Indica si todos los controles del mapa est\u00e1n cargados.</field>
        ///<field name='isLoaded' type='boolean' default='false'>Indica si todos los controles y todas las capas del mapa est\u00e1n cargados.</field>
        ///<field name='activeControl' type='TC.Control'>Control que est\u00e1 activo en el mapa, y que por tanto responder\u00e1 a los eventos de rat\u00f3n en su \u00e1rea de visualizaci\u00f3n.</field>
        ///<field name='layers' type='array' elementType='TC.Layer'>Lista de todas las capas base cargadas en el mapa.</field>
        ///<field name='controls' type='array' elementType='TC.Control'>Lista de todos los controles del mapa.</field>
        var self = this;
        self.$events = $(self);

        //TC.Object.apply(self, arguments);

        /**
         * Indica si todos los controles del mapa est\u00e1n cargados.
         * @property isReady
         * @type boolean
         * @default false
         */
        self.isReady = false;

        /**
         * Indica si todos los controles y todas las capas del mapa est\u00e1n cargados.
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
         * Control que est\u00e1 activo en el mapa, y que por tanto responder\u00e1 a los eventos de rat\u00f3n en su \u00e1rea de visualizaci\u00f3n.
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
         * Capa donde se dibujan las entidades geogr\u00e1ficas si no se especifica la capa expl\u00edcitamente. Se instancia en el momento de a\u00f1adir la primera entidad.
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
         * El mapa ha cargado todos sus controles, pero no hay garant\u00eda de que est\u00e9n cargadas las capas
         * @event MAPREADY
         */
        /**
         * Se va a a\u00f1adir una capa al mapa.
         * @event BEFORELAYERADD
         * @param {TC.Layer} layer Capa que se va a a\u00f1adir.
         */
        /**
         * Se ha a\u00f1adido una capa al mapa.
         * @event LAYERADD
         * @param {TC.Layer} layer Capa que se ha a\u00f1adido.
         */
        /**
         * Se ha eliminado una capa del mapa.
         * @event LAYERREMOVE
         * @param {TC.Layer} layer Capa que se ha eliminado.
         */
        /**
         * Se ha cambiado de posici\u00f3n una capa en la lista de capas del mapa.
         * @event LAYERORDER
         * @param {TC.Layer} layer Capa que se ha eliminado.
         * @param {number} oldIndex \u00cdndice de la posici\u00f3n antes del cambio.
         * @param {number} newIndex \u00cdndice de la posici\u00f3n despu\u00e9s del cambio.
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

        // GLS: mergeOptions es inclusivo, para poder sobrescribir los tipos de b\u00fasqueda, a\u00f1ado con valor a false las que el usuario no haya configurado.
        if (options && options.controls && options.controls.search && options.controls.search.allowedSearchTypes) {
            for (var allowed in TC.Cfg.controls.search.allowedSearchTypes) {
                if (!options.controls.search.allowedSearchTypes.hasOwnProperty(allowed)) {
                    options.controls.search.allowedSearchTypes[allowed] = false;
                }
            }
        }

        // A\u00f1ado las capas disponibles a la configuraci\u00f3n general

        /**
         * Objeto de opciones del constructor.
         * @property options
         * @type object
         */
        options = options || {};
        mergeOptions.call(self, options);

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
                            if (self.state.crs) {
                                self.loaded(function () {
                                    self.setProjection({
                                        crs: self.state.crs,
                                        extent: self.state.ext
                                    });
                                });
                            }
                            else {
                                self.setExtent(self.state.ext);
                            }
                        }
                        self.off(TC.Consts.event.LAYERADD, _handleLayerAdd);
                    }
                };
                self.on(TC.Consts.event.LAYERADD, _handleLayerAdd);
            }

            if (self.state && self.state.vw3) { // GLS: aplico el estado 3d una vez que est\u00e9 todo cargado
                self.loaded(function () {
                    // accedo desde el control hasta que el 3d sea parte del mapa
                    var control = self.getControlsByClass(TC.control.ThreeD)[0];
                    control.setMapState(self.state.vw3);
                });
            }

            /**
             * Well-known ID (WKID) del CRS del mapa.
             * @property crs
             * @type string
             */
            self.crs = self.options.crs;
            self.initialExtent = self.options.initialExtent;
            self.maxExtent = self.options.maxExtent;

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
                            TC.loadProjDef({
                                crs: self.options.crs,
                                callback: function () {
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
                                            lyrCfg = getAvailableBaseLayer.call(self, lyrCfg);
                                        }
                                        self.addLayer($.extend({}, lyrCfg, { isBase: true, map: self }));
                                    }

                                    var setVisibility = function (layer) {
                                        if (layer.isRaster() && !layer.names) {
                                            layer.setVisibility(false);
                                        }
                                    };
                                    const workLayersNotInState = self.options.workLayers
                                        .map(function (workLayer) {
                                            return $.extend({}, workLayer, { map: self });
                                        })
                                        .filter(function (workLayer) {
                                            if (!self.state || !self.state.layers) {
                                                return true;
                                            }
                                            return !self.state.layers.some(function (stateLayer) {
                                                const result = stateLayer.u === workLayer.url && workLayer.layerNames.indexOf(stateLayer.n) >= 0;
                                                if (result) {
                                                    stateLayer.id = workLayer.id; // Hemos identificado la capa, le damos el id que le corresponde
                                                }
                                                return result;
                                            });
                                        });
                                    workLayersNotInState.forEach(function (workLayer) {
                                        self.addLayer(workLayer).then(setVisibility);
                                    });

                                    if (self.state && self.state.layers) {
                                        self.state.layers.forEach(function (stateLayer) {

                                            var op = stateLayer.o;
                                            var visibility = stateLayer.v;

                                            // a\u00f1ado como promesa cada una de las capas que se a\u00f1aden
                                            self.addLayer({
                                                id: stateLayer.id || TC.getUID(),
                                                url: TC.Util.isOnCapabilities(stateLayer.u, stateLayer.u.indexOf(window.location.protocol) < 0) || stateLayer.u,
                                                hideTitle: stateLayer.h,
                                                layerNames: stateLayer.n ? stateLayer.n.split(',') : "",
                                                renderOptions: {
                                                    opacity: stateLayer.o,
                                                    hide: !stateLayer.v
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
                                        });
                                    }
                                    self.isReady = true;
                                    self.$events.trigger($.Event(TC.Consts.event.MAPREADY));
                                    setHeightFix(self._$div);


                                }
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

            // gesti\u00f3n siguiente - anterior
            self.on(TC.Consts.event.MAPLOAD, function () {

                self.loaded(function () {

                    // registramos el estado inicial                
                    self.replaceCurrent = true;
                    _addToHistory();

                    // nos suscribimos a los eventos para registrar el estado en cada uno de ellos
                    self.on(events, $.proxy(_addToHistory, self));

                    // a la gesti\u00f3n del evento de opacidad le metemos un retardo, para evitar que haya un exceso de actualizaciones de estado.
                    var layerOpacityHandlerTimeout;
                    self.on(TC.Consts.event.LAYEROPACITY, function (e) {
                        clearTimeout(layerOpacityHandlerTimeout);
                        layerOpacityHandlerTimeout = setTimeout(function () {
                            _addToHistory(e);
                        }, 500);
                    });

                    // gesti\u00f3n siguiente - anterior
                    window.addEventListener('popstate', function (e) {
                        var wait;
                        wait = self.loadingCtrl && self.loadingCtrl.addWait();
                        setTimeout(function () {
                            if (e && e.state != null) {
                                //self.registerState = false;

                                // eliminamos la suscripci\u00f3n para no registrar el cambio de estado que vamos a provocar
                                self.off(events, $.proxy(_addToHistory, self));

                                // gestionamos la actualizaci\u00f3n para volver a suscribirnos a los eventos del mapa                        
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
                    if (currentState !== previousState) {
                        window.history.pushState(state, null, window.location.href.split('#').shift() + '#' + currentState);
                    }
                };

                if (e) {
                    switch (true) {
                        case (e.type == TC.Consts.event.BASELAYERCHANGE.replace(CUSTOMEVENT, '')):                        
                        case (e.type == TC.Consts.event.LAYERORDER.replace(CUSTOMEVENT, '')):
                        case (e.type == TC.Consts.event.ZOOM.replace(CUSTOMEVENT, '')):
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

            if (self.crs !== self.options.crs) {
                state.crs = self.crs;
            }

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

            /* GLS: de momento lo trato por el control hasta que el 3d sea parte del mapa */
            var control3D = self.getControlsByClass(TC.control.ThreeD);
            if (control3D.length > 0) {                
                if (control3D[0].mapIs3D && control3D[0].map3D.cameraControls) {
                    state.vw3 = control3D[0].map3D.cameraControls.getCameraState();
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
                if (!(layer instanceof (TC.layer.Vector))) {
                    layersToRemove.push(layer);
                }
            });

            for (var i = 0; i < layersToRemove.length; i++) {
                self.removeLayer(layersToRemove[i]);
            }
        };

        var _loadIntoMap = function (stringOrJson) {

            var done = new $.Deferred(); // GLS lo a\u00f1ado para poder gestionar el final de la actualizaci\u00f3n de estado y volver a suscribirme a los eventos del mapa
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
                // CRS
                if ((obj.crs && obj.crs !== self.crs) || (typeof obj.crs === 'undefined' && self.crs !== self.options.crs)) {
                    promises.push(self.setProjection({
                        crs: obj.crs || self.options.crs,
                        oldCrs: self.crs,
                        extent: obj.ext,
                        baseLayer: self.getLayer(obj.base)
                    }));
                }
                else {
                    //capa base
                    if (obj.base != self.getBaseLayer().id) {
                        if (self.getLayer(obj.base)) {
                            self.setBaseLayer(obj.base);
                        }
                        const firstOption = self.baseLayers.filter(function (baseLayer) {
                            return baseLayer.options.fallbackLayer === obj.base;
                        })[0];
                        if (firstOption) {
                            const fbPromise = self.addLayer(firstOption.getFallbackLayer());
                            promises.push(fbPromise);
                            fbPromise.then(function (newLayer) {
                                self.setBaseLayer(newLayer);
                            });
                        }
                    }

                    //extent
                    if (obj.ext) {
                        promises.push(self.setExtent(obj.ext));
                    }
                }

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

                            if (capa.u === lyrCfg.url && lyrCfg.layerNames.indexOf(capa.n) >= 0) {
                                layerInConfig = true;
                                lyrCfg.renderOptions = { "opacity": capa.o, "hide": !capa.v };
                                promises.push(self.addLayer(lyrCfg).then(function (layer) {
                                    layer.setVisibility(visibility);
                                    layer.setOpacity(op, true);
                                }));
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
                                este evento y produc\u00eda un push en el state innecesario*/
                                layer.setOpacity(op, true);
                                layer.setVisibility(visibility);
                            }));
                        }
                    }
                }

                $.when.apply($, promises).always(function () {
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
                        for (var i = obj.layers.length - 1; i >= 0; i--) {
                            if (!obj.layers[i] || !obj.layers[i].hasOwnProperty("u") || !obj.layers[i].hasOwnProperty("n")) {
                                inValidState = true;
                                obj.layers.length = obj.layers.length - 1;
                                continue;
                            }
                            else if (!obj.layers[i].hasOwnProperty("o") || !obj.layers[i].hasOwnProperty("v") || !obj.layers[i].hasOwnProperty("h")) {
                                inValidState = true
                                jQuery.extend(obj.layers[i], {
                                    o: (obj.layers[i].o || 1),
                                    v: (obj.layers[i].v || true),
                                    h: (obj.layers[i].h || false)
                                });
                            }
                        }
                    }

                    if (obj.hasOwnProperty("vw3")) {

                        if (!obj.vw3) {
                            inValidState = true;
                        }else if (!obj.vw3.cp || (obj.vw3.cp && obj.vw3.cp.length != 3) ||
                            !obj.vw3.chpr || (obj.vw3.chpr && obj.vw3.chpr.length != 3) ||
                            !obj.vw3.bcpd) {
                            inValidState = true;
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
            var deferred = $.Deferred();

            if (typeof (layout) === 'string') {
                var layoutPath = layout;

                var tryGetFile = function (url, resource) {
                    var defer = $.Deferred();

                    //Comprobamos si existe el fichero enviando una petici\u00f3n HEAD
                    $.ajax({
                        type: 'HEAD',
                        url: url,
                        complete: function (message, text) {
                            defer.resolve({ resource: resource, found: message.status !== 404, url: url });
                        }
                    });

                    return defer.promise();
                };

                var isAbsoluteUrl = /^(https?:)?\/\//i.test(layoutPath);

                var getFileFromAvailableLocation = function (key, fileName) {
                    var deferred = $.Deferred();

                    // 1. Buscamos en un layout local
                    // 2. Buscamos en un layout en el API con el mismo nombre
                    // 3. Buscamos en el layout responsive del API
                    var urlsToQuery = [
                        layoutPath + '/' + fileName,
                        apiTcUrl + layoutPath + '/' + fileName,
                        apiTcUrl + 'layout/responsive' + '/' + fileName
                    ];

                    // flacunza: si la URL tiene pinta de ser absoluta es ella sola la m\u00e1s probable, as\u00ed que la ponemos la primera
                    if (isAbsoluteUrl) {
                        urlsToQuery.unshift(layoutPath + '/' + fileName);
                    }

                    var i = 0;
                    (function iterate(pos) {
                        tryGetFile(urlsToQuery[pos], key).done(function (result) {
                            if (result.found) {
                                deferred.resolve(addFileToLayout(layout, result));
                            } else {
                                iterate(++pos);
                            }
                        });
                    })(i);


                    return deferred.promise();
                };

                var addFileToLayout = function (layout, data) {
                    if (!(data.resource in layout)) {
                        var aux = $.extend(true, {}, layout);

                        var resourceUrl = (data.found ? data.url : apiTcUrl + layoutPath + '/' + layoutFiles[data.resource]);
                        layout[data.resource] = resourceUrl;
                    }

                    return layout;
                };

                //buscamos el par\u00e1metro layout en la url del navegador
                var apiTcUrl = TC.apiLocation + 'TC/';
                //var defaultLayout = 'idena';
                var layout = {};
                //var layoutPath = idena.layout ? idena.layout : defaultLayout;

                var layoutFiles = { script: 'script.js', style: 'style.css', markup: 'markup.html', config: 'config.json', i18n: 'resources' };
                var layoutFilesLength = Object.keys(layoutFiles).length;

                for (var key in layoutFiles) {
                    getFileFromAvailableLocation(key, layoutFiles[key]).done(function (layout) {
                        //Cuando hayamos rellenado el objeto layout, finalizamos
                        if (Object.keys(layout).length === layoutFilesLength) {
                            deferred.resolve(layout);
                        }
                    });
                }
            } else {
                deferred.resolve(layout);
            }

            return deferred.promise();
        };


        TC.i18n = TC.i18n || {};
        // i18n: carga de recursos si no est\u00e1 cargados previamente
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
                            TC.loadJS(
                                !window.dust.i18n,
                                TC.apiLocation + TC.Consts.url.TEMPLATING_I18N,
                                function () {
                                    dust.i18n.add(locale, TC.i18n[locale]);

                                });
                        }
                    }
                });
            } else {
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
                                mergeOptions.call(self, data, options);
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
                                            var replacerFunction = function (str, match1, match2) {
                                                return TC.Util.getLocaleString(locale, match1 || match2);
                                            };
                                            //data = data.replace(/\{\{([^\}\{]+)\}\}/g, replacerFunction); // Estilo {{key}}
                                            //data = data.replace(/\{@i18n \$key="([^\}\{]+)"\/\}/g, replacerFunction); // Estilo {@i18n $key="key"/}
                                            data = data.replace(/(?:\{\{([^\}\{]+)\}\}|\{@i18n \$key="([^\}\{]+)"\/\})/g, replacerFunction); // Ambos estilos anteriores
                                            self._$div.append(data);
                                            markupDeferred.resolve();
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

        // Borramos \u00e1rboles de capas cacheados
        self.$events.on(TC.Consts.event.UPDATEPARAMS, function (e) {
            deleteTreeCache(e.layer);
        });
        self.$events.on(TC.Consts.event.ZOOM, function () {
            for (var i = 0; i < self.workLayers.length; i++) {
                deleteTreeCache(self.workLayers[i]);
            }
        });

        // Redefinimos TC.error para a\u00f1adir un aviso en el mapa
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
                            if (TC.Cfg.loggingErrorsEnabled) {
                                JL("onerrorLogger").fatalException(!subject ? text : {
                                    "msg": subject,
                                    "errorMsg": text,
                                }, null);
                            }
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
     * Funci\u00f3n que mezcla opciones de mapa relativos a capa, teniendo cuidado de que puede haber objetos de opciones de capa o identificadores de capa.
     * En este \u00faltimo caso, si no son la opci\u00f3n prioritaria, hay que sustituirlos por los objetos de definiciones de capa.
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
        if (propertyName === 'availableBaseLayers') console.log("layerOptions", layerOptions);
        // a\u00f1adimos las opciones de capa de la configuraci\u00f3n general
        var layerOption = {};
        layerOption[propertyName] = TC.Cfg[propertyName];
        layerOptions.unshift(layerOption);

        //Si se han definido baseLayers en el visor, hay que hacer un merge con las predefinidas en la API
        if (propertyName === 'baseLayers' && layerOptions[1]['baseLayers']) {
            layerOption = layerOptions[1];

            for (var i = 0; i < layerOption['baseLayers'].length; i++) {
                if (typeof layerOption['baseLayers'][i] === 'object') {
                    $.extend(layerOption['baseLayers'][i], getAvailableBaseLayer.call(this, layerOption['baseLayers'][i].id));
                }
            }
        } else {
            layerOptions.unshift(true); // Deep merge
            layerOption = $.extend.apply(this, layerOptions);
            if (propertyName === 'availableBaseLayers') console.log("layerOption", layerOption);
        }

        return layerOption[propertyName];
    };

    var mergeOptions = function () {
        const result = this.options = $.extend.apply(this, $.merge([true, {}, TC.Cfg], arguments));
        // Concatenamos las colecciones availableBaseLayers
        result.availableBaseLayers = TC.Cfg.availableBaseLayers.concat.apply(TC.Cfg.availableBaseLayers, Array.prototype.map.call(arguments, function (arg) {
            return arg.availableBaseLayers || [];
        }));
        result.baseLayers = mergeLayerOptions.call(this, arguments, 'baseLayers');
        result.workLayers = mergeLayerOptions.call(this, arguments, 'workLayers');
        return result;
    };

    var mapProto = TC.Map.prototype;

    var crsLayerError = function (map, layer) {
        var errorMessage = 'Layer "' + layer.title + '" ("' + layer.names + '"): ';
        var reason;
        if (layer.isValidFromNames()) {
            reason = 'layerSrsNotCompatible'
        } else {
            reason = 'layerNameNotValid';
        }
        errorMessage += TC.Util.getLocaleString(map.options.locale, reason);
        TC.error(errorMessage);
        map.$events.trigger($.Event(TC.Consts.event.LAYERERROR, { layer: layer, reason: reason }));
    };

    /**
     * A\u00f1ade una capa al mapa.
     * @method addLayer
     * @async
     * @param {TC.Layer|TC.cfg.LayerOptions|string} layer Objeto de capa, objeto de opciones del constructor de la capa, o identificador de capa.
     * @param {function} [callback] Funci\u00f3n de callback.
     * @return {jQuery.Promise} Promesa de objeto {{#crossLink "TC.Layer"}}{{/crossLink}}
     */
    mapProto.addLayer = function (layer, callback) {
        const self = this;

        const layerDeferred = new $.Deferred();

        layerDeferred.then(function (l) {
            layerBuffer.resolve(self, l, l.isBase);
            self.$events.trigger($.Event(TC.Consts.event.LAYERADD, { layer: l }));
            layerBuffer.checkMapLoad(self);
            if ($.isFunction(callback)) {
                callback(l);
            }
        },
            function (l) {
                layerBuffer.checkMapLoad(self);
            });

        const isLayerRaster = isRaster(layer);
        if (typeof layer === 'object' && !layer.id) {
            layer.id = TC.getUID();
        }
        layerBuffer.add(layer.id || layer, layerDeferred, isLayerRaster, layer.isBase);

        const fitToExtent = function (fit) {
            if (fit) {
                var opt = {
                    projection: self.wrap.map.getView().getProjection(),
                    extent: self.initialExtent
                };
                var resolutions = self.baseLayer.getResolutions();
                if (resolutions && resolutions.length) {
                    opt.resolutions = resolutions;
                }
                else {
                    opt.minZoom = self.wrap.map.getView().getMinZoom();
                    opt.maxZoom = self.wrap.map.getView().getMaxZoom();
                    var minResolution = self.baseLayer.wrap.layer.getMinResolution();
                    if (minResolution !== 0) {
                        opt.minResolution = minResolution;
                    }
                    var maxResolution = self.baseLayer.wrap.layer.getMaxResolution();
                    if (maxResolution !== Number.POSITIVE_INFINITY) {
                        opt.maxResolution = maxResolution;
                    }
                }

                self.wrap.map.setView(new ol.View(opt));
                self.wrap.map.getView().fit(self.initialExtent);
            }
        };

        var lyr;
        var test;
        var objUrl;

        if (isLayerRaster) {
            test = !TC.layer || !TC.layer.Raster;
            objUrl = TC.apiLocation + 'TC/layer/Raster';
        }
        else {
            test = !TC.layer || !TC.layer.Vector;
            objUrl = TC.apiLocation + 'TC/layer/Vector';
        }
        TC.loadJS(
            test,
            [objUrl],
            function () {
                if (typeof layer === 'string') {
                    lyr = new TC.layer.Raster($.extend({}, getAvailableBaseLayer.call(self, layer), { map: self }));
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

                self.$events.trigger($.Event(TC.Consts.event.BEFORELAYERADD, { layer: lyr }));

                $.when(self.wrap.getMap(), lyr.wrap.getLayer()).then(function () {

                    // Nos aseguramos de que las capas raster se quedan por debajo de las vectoriales
                    var idx;
                    if (isRaster(lyr)) {
                        idx = self.wrap.indexOfFirstVector();
                    }
                    if (idx === -1) {
                        idx = self.wrap.getLayerCount();
                    }

                    const currentCrs = self.state ? self.state.crs || self.crs : self.crs;
                    const isCompatible = lyr.isCompatible(currentCrs);
                    if (lyr.isBase) {
                        if (!isCompatible) {
                            if (!lyr.type === TC.Consts.layerType.WMTS) {
                                lyr.mustReproject = true;
                            }
                            else {
                                const compatibleMatrixSet = lyr.wrap.getCompatibleMatrixSets(currentCrs)[0];
                                if (compatibleMatrixSet) {
                                    lyr.wrap.setMatrixSet(compatibleMatrixSet);
                                }
                                else {
                                    lyr.mustReproject = true;
                                }
                            }
                        }
                        if (self.state) {
                            lyr.isDefault = (self.state.base === lyr.id) || (self.state.base === lyr.options.fallbackLayer);
                        }
                        else if (typeof self.options.defaultBaseLayer === 'string') {
                            if (self.options.defaultBaseLayer === lyr.id) {
                                lyr.isDefault = true;
                            }
                        }
                        else if (typeof self.options.defaultBaseLayer === 'number') {
                            if (self.options.defaultBaseLayer === self.baseLayers.length) {
                                lyr.isDefault = true;
                            }
                        }
                        if (lyr.isDefault) {

                            if (lyr.mustReproject) {
                                if (lyr.options.fallbackLayer && lyr.getFallbackLayer) {

                                    var fit = self.baseLayer === null;

                                    self.baseLayer = lyr.getFallbackLayer();
                                    self.addLayer(self.baseLayer).then(function (l) {
                                        self.wrap.setBaseLayer(l.wrap.getLayer());

                                        // GLS: Tema casita + initialExtent
                                        fitToExtent(fit);

                                        layerDeferred.resolve(lyr);
                                    });
                                }
                                else {
                                    crsLayerError(self, lyr);
                                    layerDeferred.reject(layer);
                                }
                            }
                            else {
                                var fit = self.baseLayer === null;

                                self.wrap.setBaseLayer(lyr.wrap.getLayer());
                                self.baseLayer = lyr;

                                // GLS: Tema casita + initialExtent
                                fitToExtent(fit);

                                layerDeferred.resolve(lyr);
                            }
                        }
                        else {
                            //self.baseLayers[self.baseLayers.length] = lyr;
                            layerDeferred.resolve(lyr);
                        }
                    }
                    else {
                        if (isCompatible) {
                            self.wrap.insertLayer(lyr.wrap.getLayer(), layerBuffer.getResolvedVisibleLayerIndex(self, lyr.id));
                            layerDeferred.resolve(lyr);
                        }
                        else {
                            crsLayerError(self, lyr);
                            layerDeferred.reject(layer);
                        }
                    }
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
            layerBuffer.remove(layer.id);
            self.$events.trigger($.Event(TC.Consts.event.LAYERREMOVE, { layer: layer }));
            layerBuffer.checkMapLoad(self);
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
                self.workLayers = self.layers.filter(function (elm) {
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
    *  setBaseLayer: Set a layer as base layer, it is added to layers collection it wasn't before
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
                layer = getAvailableBaseLayer.call(self, layer);
                if (layer) {
                    layer = self.addLayer($.extend(true, {}, layer, { isDefault: true, map: self }));
                    found = true;
                }
            }
        }
        else {
            if ($.inArray(layer, self.layers) < 0) {
                layer.isDefault = true;
                layer.map = self;
                self.addLayer(layer);
            }
            found = true;
        }
        if (!found) {
            TC.error('Base layer is not available');
        }
        else {
            if (layer.mustReproject) {
                TC.error('Base layer must be reprojected');
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
     * Asigna un callback que se ejecutar\u00e1 cuando los controles del mapa se hayan cargado.
     * @method ready
     * @async
     * @param {function} [callback] Funci\u00f3n a ejecutar.
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
     * Asigna un callback que se ejecutar\u00e1 cuando los controles y las capas iniciales del mapa se hayan cargado.
     * @method loaded
     * @async
     * @param {function} [callback] Funci\u00f3n a ejecutar.
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
     * Devuelve un \u00e1rbol de capas del mapa.
     * @method getLayerTree
     * @return {TC.LayerTree}
     */
    mapProto.getLayerTree = function () {


        var _traverse = function (o, func) {
            for (var i in o.children) {
                if (o.children && o.children.length > 0) {
                    //bajar un nivel en el \u00e1rbol
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
     * A\u00f1ade un control al mapa.
     * @method addControl
     * @async
     * @param {TC.Control|string} control Control a a\u00f1adir o nombre del control
     * @param {object} [options] Objeto de opciones de configuraci\u00f3n del control. Consultar el par\u00e1metro de opciones del constructor del control.
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
     * @param {function|string} classObj Nombre de la clase o funci\u00f3n constructora de la clase.
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
     * Establece la extensi\u00f3n del mapa.
     * @method setExtent
     * @param {array} extent Array de cuatro n\u00fameros que representan las coordenadas x m\u00ednima, y m\u00ednima, x m\u00e1xima e y m\u00e1xima respectivamente.
     * @param {object} [options] Objeto de opciones.
     * @param {boolean} [options.animate=true] Establece si se realiza una animaci\u00f3n al cambiar la extensi\u00f3n.
     * La unidad de las coordenadas es la correspondiente al CRS del mapa.
     */
    mapProto.setExtent = function (extent, options) {
        return this.wrap.setExtent(extent, options);
    };

    /**
     * Obtiene la extensi\u00f3n actual del mapa.
     * @method getExtent
     * @return {array} Array de cuatro n\u00fameros que representan las coordenadas x m\u00ednima, y m\u00ednima, x m\u00e1xima e y m\u00e1xima respectivamente.
     * La unidad de las coordenadas es la correspondiente al CRS del mapa.
     */
    mapProto.getExtent = function () {
        return this.wrap.getExtent();
    };

    /**
     * Establece el centro del mapa.
     * @method setCenter
     * @param {array} coord Array de dos n\u00fameros que representan la coordenada del punto en las unidades correspondientes al CRS del mapa.
     * @param {object} [options] Objeto de opciones.
     * @param {boolean} [options.animate=true] Establece si se realiza una animaci\u00f3n al centrar.
     */
    mapProto.setCenter = function (coord, options) {
        return this.wrap.setCenter(coord, options);
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


    mapProto.getCompatibleCRS = function (options) {
        const self = this;
        options = options || {};
        const layers = options.layers || self.workLayers.concat(self.baseLayer);
        const crsLists = layers
            .filter(function (layer) {
                return layer.isRaster();
            }) // capas raster
            .map(function (layer) {
                return layer.getCompatibleCRS({ normalized: true, includeFallback: options.includeFallbacks });
            });
        const otherCrsLists = crsLists.slice(1);
        return crsLists[0].filter(function (elm) {
            return otherCrsLists.every(function (crsList) {
                return crsList.indexOf(elm) >= 0;
            });
        });
    };

    mapProto.loadProjections = function (options) {
        const self = this;
        options = options || {};
        const deferred = $.Deferred();
        const crsList = options.crsList || [];
        $.when.apply(self, crsList
            .map(function (crs) {
                return TC.getProjectionData({
                    crs: TC.Util.getCRSCode(crs)
                });
            })).then(function () {
                var projList = Array.prototype.slice.call(arguments)
                    .filter(function (response) {
                        return response.status === 'ok' && response.number_result > 0;
                    })
                    .map(function (response) {
                        const projData = response.results[0];
                        const code = 'EPSG:' + projData.code;
                        TC.loadProjDef({
                            crs: code,
                            def: projData.def,
                            name: projData.name
                        });
                        return {
                            code: code,
                            name: projData.name,
                            proj4: projData.proj4,
                            unit: projData.unit
                        };
                    });
                if (options.orderBy) {
                    projList = projList
                        .sort(TC.Util.getSorterByProperty(options.orderBy));
                }
                deferred.resolve(projList);
            },
            function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    mapProto.setProjection = function (options) {
        const self = this;
        const deferred = $.Deferred();
        options = options || {};
        var baseLayer;
        if (options.crs) {
            if (options.baseLayer) {
                baseLayer = options.baseLayer;
            }
            else if (options.allowFallbackLayer) {
                // Cambiamos de capa de fondo si es mejor o no hay m\u00e1s remedio
                if (!self.baseLayer.isCompatible(options.crs) &&
                    self.baseLayer.wrap.getCompatibleMatrixSets(options.crs).length === 0) {
                    if (self.baseLayer.options.fallbackLayer) {
                        baseLayer = self.baseLayer.getFallbackLayer();
                    }
                }
                else if (self.baseLayer.firstOption && (self.baseLayer.firstOption.isCompatible(options.crs) ||
                    self.baseLayer.firstOption.wrap.getCompatibleMatrixSets(options.crs).length > 0)) {
                    baseLayer = self.baseLayer.firstOption;
                }
            }
            if (!baseLayer) {
                baseLayer = self.baseLayer;
            }
            if (self.baseLayers.indexOf(baseLayer) < 0) {
                // Si hemos cambiado de capa de fondo la a\u00f1adimos a la colecci\u00f3n
                self.baseLayers.push(baseLayer);
                const insertIdx = self.layers.reduce(getReduceByBooleanFunction('isBase'), -1) + 1;
                self.layers.splice(insertIdx, 0, baseLayer);
            }
            TC.loadProjDef({
                crs: options.crs,
                callback: function () {
                    baseLayer.getCapabilitiesPromise().then(function () {
                        const layerProjectionOptions = $.extend({}, options, { oldCrs: self.crs });
                        const setLayerProjection = function (layer) {
                            layer.setProjection(layerProjectionOptions);
                        };
                        if (baseLayer.isCompatible(options.crs) || baseLayer.wrap.getCompatibleMatrixSets(options.crs).length > 0) {
                            baseLayer.setProjection(layerProjectionOptions);
                            self.wrap.setProjection($.extend({}, options, { baseLayer: baseLayer }));
                            self.crs = options.crs;
                            // En las capas base disponibles, evaluar su compatibilidad con el nuevo CRS
                            self.baseLayers
                                .filter(function (layer) {
                                    return layer !== baseLayer;
                                })
                                .forEach(setLayerProjection);
                            // Reprojectamos capas cargadas
                            self.workLayers.forEach(setLayerProjection);
                            const resolveChange = function () {
                                self.$events.trigger($.Event(TC.Consts.event.PROJECTIONCHANGE, { crs: options.crs }));
                                deferred.resolve();
                            };
                            if (baseLayer && baseLayer !== self.baseLayer) {
                                self.setBaseLayer(baseLayer, resolveChange);
                            }
                            else {
                                resolveChange();
                            }
                        }
                        else {
                            deferred.reject();
                        }
                    });
                }
            });
        }
        return deferred.promise();
    };

    mapProto.getMetersPerUnit = function () {
        return this.wrap.getMetersPerUnit();
    };

    /**
     * Obtiene una coordenada a partir de una posici\u00f3n del \u00e1rea de visualizaci\u00f3n del mapa en p\u00edxeles.
     * @method getCoordinateFromPixel
     * @param {array} xy Coordenada en p\u00edxeles de la posici\u00f3n en el \u00e1rea de visualizaci\u00f3n.
     * @return {array} Array de dos n\u00fameros que representa las coordenada del punto en las unidades correspondientes al CRS del mapa.
     */
    mapProto.getCoordinateFromPixel = function (xy) {
        return this.wrap.getCoordinateFromPixel(xy);
    };

    /**
     * Obtiene una posici\u00f3n en el \u00e1rea de visualizaci\u00f3n a partir de una coordenada.
     * @method getCoordinateFromPixel
     * @param {array} coord Coordenada en el mapa.
     * @return {array} Array de dos n\u00fameros que representa las posici\u00f3n del punto en p\u00edxeles.
     */
    mapProto.getPixelFromCoordinate = function (coord) {
        return this.wrap.getPixelFromCoordinate(coord);
    };

    /**
     * Establece la extensi\u00f3n del mapa de forma que abarque todas las entidades geogr\u00e1ficas pasadas por par\u00e1metro.
     * @method zoomToFeatures
     * @param {array} features Array de entidades geogr\u00e1ficas. Si est\u00e1 vac\u00edo este m\u00e9todo no hace nada.
     * @param {object} [options] Objeto de opciones de zoom.
     * @param {number} [options.pointBoundsRadius=30] Radio en metros del \u00e1rea alrededor del punto que se respetar\u00e1 al hacer zoom.
     * @param {number} [options.extentMargin=0.2] Tama\u00f1o del margen que se aplicar\u00e1 a la extensi\u00f3n total de todas las entidades. 
     * @param {boolean} [options.animate=false] Realizar animaci\u00f3n al hacer el zoom. 
     * El valor es la relaci\u00f3n resultante de la diferencia de dimensiones entre la extensi\u00f3n ampliada y la original relativa a la original.
     */
    mapProto.zoomToFeatures = function (features, options) {
        var self = this;
        if (features.length > 0) {
            var bounds = [Infinity, Infinity, -Infinity, -Infinity];
            var opts = options || {};
            var radius = opts.pointBoundsRadius || self.options.pointBoundsRadius;
            radius = radius / self.getMetersPerUnit();
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

            // GLS: Necesito diferenciar un zoom program\u00e1tico de un zoom del usuario para la gesti\u00f3n del zoom en 3D
            self.$events.trigger($.Event(TC.Consts.event.ZOOMTO, { extent: bounds }));
        }
    };

    /**
     * Establece la extensi\u00f3n del mapa de forma que abarque todas los marcadores que existen en \u00e9l.
     * El m\u00e9todo espera a todos los marcadores pendientes de incluir, dado que el m\u00e9todo {{#crossLink "TC.Map/addMarker:method"}}{{/crossLink}} es as\u00edncrono.
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
            // Miramos los marcadores de la capa vectores que puede no estar todav\u00eda en workLayers.
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
            result.then(function (vectors) {
                map.vectors = vectors;
            });
        }
        else {
            result = map.vectors;
        }
        return result;
    };

    /**
     * A\u00f1ade un punto al mapa. Si no se especifica una capa en el par\u00e1metro de opciones se a\u00f1adir\u00e1 a una capa vectorial destinada a a\u00f1adir entidades geogr\u00e1ficas.
     * Esta capa se crea al a\u00f1adir por primera vez una entidad sin especificar capa.
     * @method addPoint
     * @async
     * @param {array} coord Array de dos n\u00fameros representando la coordenada del punto en las unidades del CRS del mapa.
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
     * A\u00f1ade un marcador puntual al mapa. Si no se especifica una capa en el par\u00e1metro de opciones se a\u00f1adir\u00e1 a una capa vectorial destinada a a\u00f1adir entidades geogr\u00e1ficas.
     * Esta capa se crea al a\u00f1adir por primera vez una entidad sin especificar capa.
     * @method addMarker
     * @async
     * @param {array} coord Array de dos n\u00fameros representando la coordenada del punto en las unidades del CRS del mapa.
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
            // Se a\u00f1ade un deferred m\u00e1s para evitar que zoomToMarkers salte antes de poblarse el array _markerDeferreds.
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
     * A\u00f1ade una polil\u00ednea al mapa. Si no se especifica una capa en el par\u00e1metro de opciones se a\u00f1adir\u00e1 a una capa vectorial destinada a a\u00f1adir entidades geogr\u00e1ficas.
     * Esta capa se crea al a\u00f1adir por primera vez una entidad sin especificar capa.
     * @method addPolyline
     * @async
     * @param {array} coords Array de arrays de dos n\u00fameros representando las coordenadas de los v\u00e9rtices en las unidades del CRS del mapa.
     * @param {object} [options] Opciones de la polil\u00ednea.
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
     * A\u00f1ade un pol\u00edgono al mapa. Si no se especifica una capa en el par\u00e1metro de opciones se a\u00f1adir\u00e1 a una capa vectorial destinada a a\u00f1adir entidades geogr\u00e1ficas.
     * Esta capa se crea al a\u00f1adir por primera vez una entidad sin especificar capa.
     * @method addPolygon
     * @async
     * @param {array} coords Array que contiene anillos. Estos a su vez son arrays de arrays de dos n\u00fameros representando las coordenadas de los v\u00e9rtices en las unidades del CRS del mapa.
     * El primer anillo es el exterior y el resto son islas. No es necesario cerrar los anillos (poner el mismo v\u00e9rtice al principio y al final).
     * @param {object} [options] Opciones del pol\u00edgono.
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
        return this.wrap.getResolutions();
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
        var errorMsg = 'El mapa actual no es compatible con la exportaci\u00f3n de im\u00e1genes';
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
 * \u00c1rbol de capas del mapa.
 * Esta clase no tiene constructor.
 * @class TC.LayerTree
 * @static
 */
/**
 * Lista de \u00e1rboles de (objetos de la clase {{#crossLink "TC.layer.LayerTree"}}{{/crossLink}}) de todas las capas base del mapa.
 * @property baseLayers
 * @type array
 */
/**
 * Lista de \u00e1rboles de (objetos de la clase {{#crossLink "TC.layer.LayerTree"}}{{/crossLink}}) de todas las capas de trabajo del mapa.
 * @property workLayers
 * @type array
 */

/**
  * Configuración adicional necesaria del control 3D en el mapa.  
  * @typedef ThreeDOptions
  * @extends ViewOptions
  * @see MapViewOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear la vista o valor de atributo id de dicho elemento.  
  *
  * @example <caption>[Ver en vivo](../examples/cfg.ThreeDOptions.html)</caption> {@lang html}
  * <div id="mapa"/>
  * <div id="vista3d"/>
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Añadimos el control de selector de mapa de fondos en el primer DIV del marcado markup.html contenido en el layout configurado en la propiedad SITNA.Cfg.layout.
  *     SITNA.Cfg.controls.basemapSelector = {
  *         div: "slot1"
  *     };
  *     // Añadimos el control de tabla de contenidos en el segundo DIV del marcado markup.html contenido en el layout configurado en la propiedad SITNA.Cfg.layout.
  *     SITNA.Cfg.controls.TOC = {
  *         div: "slot2"
  *     };
  *     // Añadimos una capa raster desde un servicio WMS y una capa vectorial
  *     // a partir de un archivo geográfico en formato GML.
  *     SITNA.Cfg.workLayers = [
  *         {
  *             id: "wms",
  *             title: "Camino de Santiago",
  *             type: SITNA.Consts.layerType.WMS,
  *             url: "//idena.navarra.es/ogc/wms",
  *             layerNames: "IDENA:PATRIM_Lin_CaminoSantR",
  *             format: SITNA.Consts.mimeType.PNG
  *         },
  *         {
  *             id: "gml",
  *             type: SITNA.Consts.layerType.VECTOR,
  *             url: "data/ESTACIONESTREN.gml"
  *         }
  *     ];
  *     // Añadimos el control 3D.
  *     SITNA.Cfg.controls.threeD = true;
  *     // Configuramos en la propiedad `views` del mapa la vista `threeD` que requiere el control threeD para el correcto funcionamiento.
  *     SITNA.Cfg.views = {
  *         threeD: {
  *             div: "vista3d" // Indicamos el identificador del DIV en el marcado en el cual cargar la vista 3D.
  *         }
  *     };
  *     var map = new SITNA.Map("mapa");
  * </script>
  */

TC.control = TC.control || {};

(function () {

    TC.control.ThreeD = function () {
        var self = this;

        TC.Control.apply(self, arguments);
    };

    TC.inherit(TC.control.ThreeD, TC.Control);

    var ctlProto = TC.control.ThreeD.prototype;

    ctlProto.CLASS = 'tc-ctl-3d';
    ctlProto.classes = {
        BETA: 'tc-beta-button',
        BTNACTIVE: 'active'
    };

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-3d.hbs";

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.Control.prototype.register.call(self, map);

        map.on(TC.Consts.event.VIEWCHANGE, function (e) {
            if (e.view == TC.Consts.view.THREED) { // cargamos la vista 3D desde el estado actualizamos el estado del botón
                self.activate();
            }
        });

        return result;
    };

    ctlProto.renderData = function (data, callback) {
        const self = this;

        return TC.Control.prototype.renderData.call(self, data, function () {
            self.button = self.div.querySelector('.' + self.CLASS + '-btn');

            self.button.addEventListener(TC.Consts.event.CLICK, function () {

                if (self.button.disabled) {
                    return;
                }

                if (!self.map.on3DView) {
                    self.activate();
                } else {
                    self.button.disabled = true;

                    TC.view.ThreeD.unapply({
                        callback: function () {
                            self.button.setAttribute('title', self.getLocaleString("threed.tip"));

                            self.button.classList.remove(self.classes.BTNACTIVE);

                            self.button.disabled = false;
                        }
                    });
                }
            }, { passive: true });

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        });
    };

    ctlProto.activate = function () {
        var self = this;

        if (!self.map.on3DView) {
            self.button.disabled = true;
        }

        self.browserSupportWebGL.call(self);

        const manageButton = function () {
            self.button.setAttribute('title', self.getLocaleString('threed.two.tip'));
            self.button.classList.remove(self.classes.BETA);

            self.button.classList.add(self.classes.BTNACTIVE);
        };

        const removeDisabled = function () {
            self.button.disabled = false;
        };

        if (!self.map.view3D) {
            TC.loadJS(
                !TC.view || !TC.view.ThreeD,
                TC.apiLocation + 'TC/view/ThreeD',
                function () {                                                           /* provisional */
                    TC.view.ThreeD.apply({ map: self.map, options: self.options, getRenderedHtml: self.getRenderedHtml, callback: removeDisabled });
                });
        } else if (!self.map.on3DView) {                                               /* provisional */
            TC.view.ThreeD.apply({ map: self.map, options: self.options, getRenderedHtml: self.getRenderedHtml, callback: removeDisabled });
        }

        manageButton();

        //TC.Control.prototype.activate.call(self);
    };

    ctlProto.deactivate = function () {
        var self = this;

        TC.Control.prototype.deactivate.call(self);
    };

    ctlProto.browserSupportWebGL = function () {
        var self = this;
        var result = false;

        //Check for webgl support and if not, then fall back to leaflet
        if (!window.WebGLRenderingContext) {
            // Browser has no idea what WebGL is. Suggest they
            // get a new browser by presenting the user with link to
            // http://get.webgl.org
            result = false;
        } else {
            var canvas = document.createElement('canvas');

            var webglOptions = {
                alpha: false,
                stencil: false,
                failIfMajorPerformanceCaveat: true
            };

            try {
                var gl = canvas.getContext("webgl", webglOptions) ||
                    canvas.getContext("experimental-webgl", webglOptions) ||
                    canvas.getContext("webkit-3d", webglOptions) ||
                    canvas.getContext("moz-webgl", webglOptions);
                if (!gl) {
                    // We couldn't get a WebGL context without a major performance caveat.  Let's see if we can get one at all.
                    webglOptions.failIfMajorPerformanceCaveat = false;
                    gl = canvas.getContext("webgl", webglOptions) ||
                        canvas.getContext("experimental-webgl", webglOptions) ||
                        canvas.getContext("webkit-3d", webglOptions) ||
                        canvas.getContext("moz-webgl", webglOptions);
                    if (!gl) {
                        // No WebGL at all.
                        result = false;
                    } else {
                        // We can do WebGL, but only with software rendering (or similar).
                        result = 'slow';
                        self.isSlower = true;
                    }
                } else {
                    // WebGL is good to go!
                    result = true;
                }
            } catch (e) {
                console.log(E);
            }

            if (result === "slow" || !result) {
                var warning = result === "slow" ? "threed.slowSupport.supported" : "threed.not.supported";
                self.map.toast(self.getLocaleString(warning), {
                    type: TC.Consts.msgType.WARNING,
                    duration: 10000
                });
            }

            return result;
        }
    };

})();
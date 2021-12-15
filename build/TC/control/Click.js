
/**
  * Opciones de control de clics de usuario.
  * @typedef ClickOptions
  * @property {boolean} [active] - Si se establece a `true`, el control asociado está activo, es decir, responde a los clics hechos en el mapa desde el que se carga.
  * Como máximo puede haber solamente un control activo en el mapa en cada momento.
  * @property {SITNA.Map~ClickCallback} callback - Función de callback que gestiona la respuesta al clic.
  */

/**
  * Función de callback que gestiona los clic del usuario en la ventana de visualización del mapa.
  * @callback SITNA.Map~ClickCallback
  * @param {number[]} coords - Coordenadas del punto donde se ha realizado clic, en las unidades del sistema de referencia de coordenadas del mapa (Ver propiedad `crs`de {@link MapOptions}). Array de dos números correspondientes a las coordenadas x e y.
  * @example <caption>[Ver en vivo](../examples/cfg.ClickOptions.html)</caption> {@lang html} 
  * <div id="mapa"/>
  * <script>
  *     // Creamos un mapa con el control de gestión de clics, con una función de callback personalizada
  *     var map = new SITNA.Map("mapa", {
  *         controls: {
  *             click: {
  *                 active: true,
  *                 callback: function (coord) {
  *                     alert("Has pulsado en la posición " + coord[0] + ", " + coord[1]);
  *                 }
  *             }
  *         }
  *     });
  * </script>
  */

TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Click = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    if (self.options && self.options.callback) {
        self.callback = self.options.callback;
    }

    self.wrap = new TC.wrap.control.Click(self);
};

TC.inherit(TC.control.Click, TC.Control);

(function () {
    var ctlProto = TC.control.Click.prototype;

    ctlProto.CLASS = 'tc-ctl-click';

    ctlProto.register = function (map) {
        var self = this;
        self.wrap.register(map);
        return TC.Control.prototype.register.call(self, map);
    };

    ctlProto.activate = function () {
        var self = this;
        TC.Control.prototype.activate.call(self);
        self.wrap.activate();
    };

    ctlProto.deactivate = function () {
        var self = this;
        self.wrap.deactivate();
        TC.Control.prototype.deactivate.call(self);
    };

    ctlProto.callback = function (coord, point) {
        console.log('[Click][' + coord[0] + ', ' + coord[1] + '][' + point[0] + ', ' + point[1] + ']');
    };
})();
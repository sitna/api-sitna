
/**
  * Opciones de control de clics de usuario.
  * @typedef ClickOptions
  * @memberof SITNA.control
  * @property {boolean} [active] - Si se establece a `true`, el control asociado está activo, es decir, responde a los clics hechos en el mapa desde el que se carga.
  * Como máximo puede haber solamente un control activo en el mapa en cada momento.
  * @property {SITNA.Map~ClickCallback} callback - Función de callback que gestiona la respuesta al clic.
  */

/**
  * Función de callback que gestiona los clic del usuario en la ventana de visualización del mapa.
  * @callback SITNA.Map~ClickCallback
  * @param {number[]} coords - Coordenadas del punto donde se ha realizado clic, en las unidades del sistema de referencia de coordenadas del mapa (Ver propiedad `crs`de {@link SITNA.MapOptions}). Array de dos números correspondientes a las coordenadas x e y.
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

import TC from '../../TC';
import wrap from '../ol/ol';
import Control from '../Control';

TC.control = TC.control || {};
TC.wrap = wrap;

class Click extends Control {
    constructor() {
        super(...arguments);
        const self = this;

        if (self.options && self.options.callback) {
            self.callback = self.options.callback;
        }

        self.wrap = new TC.wrap.control.Click(self);
    }

    register(map) {
        const self = this;
        self.wrap.register(map);
        return super.register.call(self, map);
    }

    activate() {
        const self = this;
        if (self.wrap) {
            self.wrap.activate();
        }
        super.activate.call(self);
    }

    deactivate() {
        const self = this;
        if (self.wrap) {
            self.wrap.deactivate();
        }
        super.deactivate.call(self);
    }

    callback(coord, point) {
        console.log('[Click][' + coord[0] + ', ' + coord[1] + '][' + point[0] + ', ' + point[1] + ']');
    }
}

Click.prototype.CLASS = 'tc-ctl-click';
TC.control.Click = Click;
export default Click;
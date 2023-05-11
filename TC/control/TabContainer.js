
/**
  * Opciones de un control que contiene pestañas de selección.
  * @typedef TabContainerOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {boolean} [deselectableTabs=false] - Si se establece a `true`, las pestañas se pueden deseleccionar pulsando sobre ellas 
  * cuando ya estaban seleccionadas previamente.
  * @example <caption>[Ver en vivo](../examples/cfg.TabContainerOptions.html)</caption> {@lang html}
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Añadimos una capa WMS que tenga un WFS asociado del que poder descargar datos.
  *     SITNA.Cfg.workLayers = [
  *         {
  *             id: "cp",
  *             type: SITNA.Consts.layerType.WMS,
  *             url: "https://idena.navarra.es/ogc/wms",
  *             layerNames: ["IDENA:DIRECC_Pol_CodPostal"]
  *         }
  *     ];
  *     // Creamos un mapa con el control de descargas en el que se pueden deseleccionar las pestañas.
  *     var map = new SITNA.Map("mapa", {
  *         controls: {
  *             download: {
  *                 div: "slot1",
  *                 deselectableTabs: true
  *             }
  *         }
  *     });
  * </script>
  */

import TC from '../../TC';
import Consts from '../Consts';
import Container from './Container';

TC.control = TC.control || {};
TC.control.Container = Container;

TC.control.TabContainer = function () {
    const self = this;

    TC.control.Container.apply(self, arguments);

    self._classSelector = '.' + self.CLASS;
};

TC.inherit(TC.control.TabContainer, TC.control.Container);

(function () {
    var ctlProto = TC.control.TabContainer.prototype;

    ctlProto.CLASS = 'tc-ctl-tctr';

    ctlProto.onRender = async function () {
        const self = this;

        self.title = self.title || self.getLocaleString(self.options.title || 'moreControls');
        self.div.querySelector('h2').innerHTML = self.title;

        self.controlOptions.forEach((ctl, i) => {
            let ctlName = "";
            let ctlOptions = {};

            // GLS: 20/01/2020 código compatibilidad hacia atrás
            if (ctl.name !== undefined && ctl.options !== undefined) {
                console.log('Gestionamos config de tabContainer antiguo');

                ctlName = ctl.name;
                ctlOptions = ctl.options;
            } else {
                ctlName = Object.keys(ctl).find(key => key !== "title");
                ctlOptions = ctl[ctlName];
            }

            self._ctlPromises[i] = self.map.addControl(ctlName, TC.Util.extend({
                id: self.uids[i],
                div: self.div.querySelector('.' + self.CLASS + '-elm-' + i)
            }, ctlOptions));
        });

        const writeTitle = async function (ctl, idx) {
            await ctl.renderPromise();
            const title = self.getLocaleString(self.controlOptions[idx].title) || ctl.div.querySelector('h2').innerHTML;
            var parent = ctl.div;
            do {
                parent = parent.parentElement;
            }
            while (parent && !parent.matches(self._classSelector));
            parent.querySelector(`sitna-tab[for="${self.id}-sel-${idx}"]`).text = title;
        };

        const controls = await Promise.all(self._ctlPromises);
        for (var i = 0, len = controls.length; i < len; i++) {
            const ctl = controls[i];
            ctl.containerControl = self;
            await writeTitle(ctl, i);
        }
        return self;
    };

    ctlProto.loadTemplates = async function () {
        const self = this;
        const module = await import('../templates/tc-ctl-tctr.mjs');
        self.template = module.default;
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(self.renderData({
            controlId: self.id,
            title: self.title,
            deselectableTabs: self.options.deselectableTabs,
            controls: self.controlOptions
        }, function () {

            self.div.querySelectorAll('sitna-tab').forEach(tab => {
                const target = tab.target;

                // GLS 24/01/2020 necesitamos un mutation observer para poder quitar el tc.collapsed cuando volvamos de  
                // otro control ya que no hay click porque la pestaña ya está activa.
                const observerTabElementAddCollapsedClass = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        if (mutation.target.classList.contains(Consts.classes.COLLAPSED)) {
                            mutation.target.classList.remove(Consts.classes.COLLAPSED);
                        }
                    });
                });
                observerTabElementAddCollapsedClass.observe(target, { attributes: true });

                tab.callback = function () {
                    if (this.selected) {
                        target.classList.remove(Consts.classes.COLLAPSED);
                    }
                };
            });

            // GLS: Si en el register de control se llama a render, ¿por qué volvemos a llamarlo aquí?
            //for (var i = 0, len = self._ctlPromises.length; i < len; i++) {
            //    self.getControl(i).then(function (ctl) {
            //        ctl.render();
            //    });
            //}

            if (typeof self.defaultSelection === 'number') {
                self.div.querySelectorAll('sitna-tab')[self.defaultSelection].onClick();
            }

            if (typeof callback === 'function') {
                callback();
            }
        }));
    };

    ctlProto.selectTab = function (index) {
        const self = this;
        const tab = self.div.querySelectorAll('sitna-tab')[index];
        if (tab) {
            tab.selected = true;
        }
    };

    ctlProto.onControlDisable = function (control) {
        const self = this;
        self.getControls().then(controls => {
            const controlIndex = controls.indexOf(control);
            if (controlIndex >= 0) {
                let nextControlIndex = controlIndex;
                let nextControl = control;
                do {
                    nextControlIndex = (nextControlIndex + 1) % controls.length;
                    nextControl = controls[nextControlIndex];
                }
                while (nextControl.isDisabled && nextControl !== control);
                if (nextControlIndex !== controlIndex) {
                    self.selectTab(nextControlIndex);
                }
            }
        });
    };
})();

const TabContainer = TC.control.TabContainer;
export default TabContainer;
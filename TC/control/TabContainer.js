
/**
  * Opciones de un control que contiene pestañas de selección.
  * @typedef TabContainerOptions
  * @ignore
  * @extends ControlOptions
  * @see MapControlOptions
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

TC.control = TC.control || {};

if (!TC.control.Container) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control/Container');
}

TC.control.TabContainer = function () {
    var self = this;

    TC.control.Container.apply(self, arguments);

    var cs = self._classSelector = '.' + self.CLASS;
    self._selectors = {
        TAB: cs + '-tab',
        RADIOBUTTON: `input[type=radio][name="${self.id}-sel"]`,
        ELEMENT: cs + '-elm'
    };    
};

TC.inherit(TC.control.TabContainer, TC.control.Container);

(function () {
    var ctlProto = TC.control.TabContainer.prototype;

    ctlProto.CLASS = 'tc-ctl-tctr';

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-tctr.hbs";

    ctlProto.onRender = function () {
        const self = this;

        return new Promise(function (resolve, reject) {
            self.title = self.title || self.getLocaleString(self.options.title || 'moreControls');
            self.div.querySelector('h2').innerHTML = self.title;

            var bufferPromises = new Array(self.ctlCount);
            for (var i = 0, len = self.controlOptions.length; i < len; i++) {
                var ctl = self.controlOptions[i];
                var ctlName = "";
                var ctlOptions = {};

                // GLS: 20/01/2020 código compatibilidad hacia atrás
                if (ctl["name"] !== undefined && ctl["options"] !== undefined) {
                    console.log('Gestionamos config de tabContainer antiguo');

                    ctlName = ctl["name"];
                    ctlOptions = ctl["options"];
                } else {
                    ctlName = Object.keys(ctl).filter((key) => {
                        return key !== "title";
                    })[0];
                    ctlOptions = ctl[ctlName];
                }

                bufferPromises[i] = self.map.addControl(ctlName, TC.Util.extend({
                    id: self.uids[i],
                    div: self.div.querySelector('.' + self.CLASS + '-elm-' + i)
                }, ctlOptions));
            }
            var writeTitle = function (ctl, idx) {
                ctl.renderPromise().then(function () {
                    const title = self.getLocaleString(self.controlOptions[idx].title) || ctl.div.querySelector('h2').innerHTML;
                    var parent = ctl.div;
                    do {
                        parent = parent.parentElement;
                    }
                    while (parent && !parent.matches(self._classSelector));
                    parent.querySelector(self._selectors.TAB + '-' + idx + ' span').innerHTML = title;
                });
            };
            Promise.all(bufferPromises).then(function (controls) {
                for (var i = 0, len = controls.length; i < len; i++) {
                    var ctl = controls[i];
                    ctl.containerControl = self;
                    writeTitle(ctl, i);
                }
                resolve(self);
            });
        });
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(self.renderData({
            controlId: self.id,
            title: self.title,
            controls: self.controlOptions,
            count: self.controlOptions.length
        }, function () {

            var clickHandler = function (e) {
                var closest = this;
                while (closest && !closest.matches(self._selectors.TAB)) {
                    closest = closest.parentElement;
                }
                var active, hidden = [];
                const checkbox = closest.querySelector(self._selectors.RADIOBUTTON);
                const newValue = checkbox.value;
                const elms = self.div.querySelectorAll(self._selectors.ELEMENT);
                if (self._oldValue === newValue && self.options.deselectableTabs) {
                    setTimeout(function () {
                        checkbox.checked = false;
                    }, 0);
                    self._oldValue = null;
                    active = null;
                    hidden = elms;
                }
                else {
                    elms.forEach(function (elm) {
                        if (elm.matches(self._selectors.ELEMENT + '-' + newValue)) {
                            active = elm;
                        }
                        else {
                            hidden.push(elm);
                        }
                    });
                    self._oldValue = newValue;
                }

                if (active && active.classList.contains(TC.Consts.classes.COLLAPSED)) {
                    active.classList.remove(TC.Consts.classes.COLLAPSED);

                    // GLS 24/01/2020 necesitamos un mutation observer para poder quitar el tc.collapsed cuando volvamos de  
                    // otro control ya que no hay click porque la pestaña ya está activa.
                    var observerTabElementAddCollapsedClass = new MutationObserver(function (mutations) {                        
                        mutations.forEach(function (mutation) {
                            if (mutation.target.classList.contains(TC.Consts.classes.COLLAPSED)) {
                                mutation.target.classList.remove(TC.Consts.classes.COLLAPSED);
                            }
                        });
                    });
                    
                    observerTabElementAddCollapsedClass.observe(active, { attributes: true });                    
                }

                if (active) {
                    active.classList.remove(TC.Consts.classes.HIDDEN);
                }
                hidden.forEach(function (elm) {
                    elm.classList.add(TC.Consts.classes.HIDDEN);
                });
                checkbox.checked = true;
            };

            self.div.querySelectorAll('span').forEach(function (span) {
                span.addEventListener(TC.Consts.event.CLICK, clickHandler, { passive: true });
            });

            // GLS: Si en el register de control se llama a render, ¿por qué volvemos a llamarlo aquí?
            //for (var i = 0, len = self._ctlPromises.length; i < len; i++) {
            //    self.getControl(i).then(function (ctl) {
            //        ctl.render();
            //    });
            //}

            if (typeof self.defaultSelection === 'number') {
                clickHandler.call(self.div.querySelectorAll(self._selectors.RADIOBUTTON)[self.defaultSelection]);
            }
        }));
    };

})();

import TC from '../../TC.js';
import Util from '../Util.js';
import Consts from '../Consts.js';
import Cfg from '../Cfg.js';
import i18n from '../i18n.js';
import Handlebars from '../../lib/handlebars/helpers.js';

TC.control = TC.control || {};
TC.i18n = TC.i18n || i18n;

const elementName = 'sitna-control';

/**
 * Clase base que implementa {@link MapControl}, la interfaz de programación de un control de usuario.
 * 
 * Si un desarrollador quiere crear un control personalizado, puede heredar de esta clase y sobreescribir
 * los métodos y propiedades que necesite. Además, como el control es elemento personalizado 
 * ([custom element](https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_custom_elements)) 
 * para usarlo en una página web hay que registrarlo mediante <code>window.customElements.define()</code> 
 * dándole un nombre de etiqueta HTML. Este nombre debe seguir la notación "Kebab" y contener un guión 
 * para que los navegadores lo reconozcan como un elemento personalizado.
 * @class Control
 * @memberof SITNA.control
 * @extends HTMLElement
 * @implements {MapControl}
 * @param {HTMLElement|string} [container] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
 * @param {ControlOptions} [options] - Opciones de configuración del control.
 * @see {@link SITNA.Map#addControl}
 * @example <caption>[Ver en vivo](../examples/control.custom.html)</caption> {@lang html}
    <div id="map-container"></div>
    <script>
        // Creamos una clase que herede de la clase abstracta de control genérico
        class BasemapRandomizer extends SITNA.control.Control {

            // Reescribimos métodos

            async register(map) {
                // Llamamos primero al método de la clase antecesora
                await super.register(map);

                // Añadimos lógica de interacción con el mapa
                map.addEventListener("sitna:layerupdate", (e) => {
                    this.querySelector("div.current-layer").textContent = e.layer.title;
                });

                // Devolvemos el propio control para mantener la signatura del método
                return this;
            }

            async loadTemplates() {
                // Asignamos a la propiedad template la dirección de la plantilla a utilizar
                this.template = "./data/BasemapRandomizer.hbs";
            }

            addUIEventListeners() {
                this.querySelector("button").addEventListener("click", () => {
                    this.randomize();
                });
            }

            // Añadimos métodos nuevos

            randomize() {
                const n = this.map.baseLayers.length;
                const currentIndex = this.map.baseLayers.findIndex((baseLayer) => baseLayer === this.map.baseLayer);
                let nextIndex;
                do {
                    nextIndex = Math.floor(Math.random() * n);
                }
                while (nextIndex === currentIndex);
                this.map.setBaseLayer(this.map.baseLayers[nextIndex]);
            }
        }

        // Registramos la clase como elemento personalizado
        customElements.define("basemap-randomizer", BasemapRandomizer);

        var map = new SITNA.Map("map-container");
        map.loaded(() => {
            const containerElement = document.createElement("div");
            containerElement.id = "control-container";
            map.div.insertAdjacentElement("beforeend", containerElement);
            map.addControl(new BasemapRandomizer("control-container"));
        });
    </script>
 * @example <caption>[Ver en vivo](../examples/control.markup.html)</caption> {@lang html}
    <div id="map-container"></div>
    <script>
        // Creamos una clase que herede de HTMLElement para crear un elemento personalizado
        class ZoomToExtent extends HTMLElement {
            #button;

            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
                this.#button = document.createElement("sitna-button");
                const slot = document.createElement("slot");
                this.#button.appendChild(slot);
                this.shadowRoot.appendChild(this.#button);
                this.#button.addEventListener("click", (e) => {
                    this.zoom();
                });
            }

            zoom() {
                const extentValue = this.getAttribute("extent");
                if (extentValue) {
                    const extent = extentValue.split(",").map((text) => parseFloat(text));
                    this.closest("poi-navigator").map.setExtent(extent);
                }
            }
        }

        // Registramos la clase como elemento personalizado
        customElements.define("zoom-extent", ZoomToExtent);

        // Creamos una clase que herede de la clase abstracta de control genérico
        class PoiNavigator extends SITNA.control.Control {

            // Reescribimos métodos

            // Reescribimos el método loadTemplates para utilizar plantillas HTML en vez de Handlebars
            async loadTemplates() {
                // Asignamos a la propiedad template la dirección de la plantilla a utilizar
                this.template = "./data/PoiNavigator.hbs";
            }

            async render() {
                const zoomButtons = Array.from(this.querySelectorAll('zoom-extent'));
                await this.renderData();
                const zoomButtonContainer = this.querySelector(".zoom-button-container");
                zoomButtons.forEach((button) => {
                    zoomButtonContainer.appendChild(button);
                });

                this.addUIEventListeners();
            }
        }

        // Registramos la clase como elemento personalizado
        customElements.define("poi-navigator", PoiNavigator);

        // Creamos un mapa con un maquetado que tiene en su HTML el elemento personalizado recién registrado
        var map = new SITNA.Map("map-container", {
            baseLayers: [SITNA.Consts.layer.IDENA_ORTHOPHOTO],
            layout: "layout/custom-control"
        });
    </script>
 */

/**
 * Interfaz de programación de un control de usuario que interactúa con el mapa. Cualquier control creado por 
 * el desarrollador debe cumplir esta interfaz.
 *  @interface MapControl
 * @see {@link SITNA.control.Control}
 * @see {@tutorial 2-controls}
 */
class WebComponentControl extends HTMLElement {
    /** 
     * Plantilla o colección de plantillas que utiliza el control para su representación. 
     * Si es un objeto, las claves son los nombres de las plantillas y los valores son las plantillas o las URLs 
     * desde las que obtenerlas. Si es una función, se asume que es una plantilla ya compilada que ejecutada 
     * devuelve el HTML resultante de la representación. Si es una cadena de texto, se asume que es la URL desde la que
     * obtener la plantilla.
     * 
     * Los controles integrados en la API SITNA utilizan plantillas de Handlebars. Si se quiere usar otro motor de plantillas,
     * hay que reimplementar el método {@link MapControl#render}.
     * 
     * @memberof MapControl
     * @type {object|function}
     * @instance
     */
    template;

    /**
     * Refencia al mapa en el que está insertado el control.
     * 
     * @memberof MapControl
     * @type {SITNA.Map|null}
     * @instance
     */
    map;
    #id;
    #onBySelectorMap = new WeakMap();
    #downloadDialog;
    #listeners = {};
    #firstRender;

    constructor() {
        super();
        const self = this;

        self.map = null;
        self.isActive = false;
        self.isDisabled = false;

        var len = arguments.length;

        self.options = self.mergeOptions(len > 1 ? arguments[1] : arguments[0]);
        let prefix;
        if (self.CLASS === WebComponentControl.prototype.CLASS && self.constructor !== WebComponentControl) {
            prefix = self.localName + '-';
        }
        else if (self.CLASS.startsWith(WebComponentControl.prototype.CLASS + '-')) {
            prefix = self.CLASS.substring(WebComponentControl.prototype.CLASS.length + 1) + '-';
        }
        else {
            prefix = self.CLASS + '-';
        }
        self.#id = self.options.id || TC.getUID({ prefix });

        const divOption = self.options.div || arguments[0];
        if (divOption) {
            const parentElement = Util.getDiv(divOption);
            self.div = parentElement;
        }
        else {
            self.div = self.parentElement;
        }

        self.template = self.options.template || self.template;
        self.exportsState = false;
    }

    connectedCallback() {
        const self = this;
        if (!self.id) {
            self.id = self.#id;
        }
        if (self.map) {
            return;
        }
        const mapOption = self.getAttribute('for');
        let map;
        if (mapOption) {
            const mapElement = document.getElementById(mapOption);
            if (mapElement) {
                map = TC.getMap(mapElement);
                if (map) {
                    map.addControl(self);
                }
                else {
                    const observer = new MutationObserver(function (mutationList, observer) {
                        for (const mutation of mutationList) {
                            if (mutation.type === 'childList') {
                                map = TC.getMap(mapElement);
                                if (map) {
                                    map.addControl(self);
                                    observer.disconnect();
                                }
                            }
                        }
                    });
                    observer.observe(mapElement, { childList: true });
                }
            }
        }
        else {
            let element = self;
            do {
                element = element.parentElement;
                if (!self.containerControl && element instanceof WebComponentControl) {
                    self.containerControl = element;
                }
            }
            while (element && !element.classList.contains(Consts.classes.MAP));
            map = TC.getMap(element);
            if (map) {
                map.addControl(self);
            }
            else {
                self.renderPromise();
            }
        }
    }

    disconnectedCallback() {
        this.unregister();
    }

    getId() {
        return this.#id;
    }

    mergeOptions(...options) {
        return Util.extend({}, ...options);
    }

    initProperty(name) {
        const self = this;
        if (Object.hasOwn(self.options, name)) {
            self[name] = self.options[name];
        }
        return self;
    }

    /**
     * Muestra el control en pantalla.
     * 
     * @function
     * @name show
     * @memberof MapControl
     * @returns {MapControl} El mismo control.
     * @instance
     */
    show() {
        this.style.display = '';
        return this;
    }

    /**
     * Oculta el control de la pantalla.
     * 
     * @function
     * @name hide
     * @memberof MapControl
     * @returns {MapControl} El mismo control.
     * @instance
     */
    hide() {
        const self = this;
        self.style.display = 'none';
        self.unhighlight();
        return self;
    }

    /**
     * Renderiza los contenidos del control. Esto incluye asignar a los elementos del control 
     * los gestores de eventos asociados a la interfaz de usuario si los hay.
     * 
     * Cualquier implementación de este método debe llevar a cabo los siguientes procesos:
     * 1. Si no está inicializada la propiedad template, cargar las plantillas. La manera heterodoxa de realizar esto es llamar a {@link MapControl#loadTemplates}.
     * 2. Procesar la plantilla y añadir el resultado al DOM (esto se puede hacer llamando a {@link SITNA.control.Control#getRenderedHtml} y pegando la cadena de texto resultante al contenido del control).
     * 3. Lanzar el evento {@link MapControl#sitna:controlrender} mediante `EventTarget#dispatchEvent`.
     * 4. Llamar a {@link MapControl#addUIEventListeners} para añadir eventos de interfaz de usuario a los elementos HTML recién creados.
     * 5. Si está definida, ejecutar la función `callback` pasada como parámetro.
     * 
     * Para realizar los puntos 1, 2 y 3 existe el método {@link SITNA.control.Control#renderData}, así que una implentación típica de `render` es llamar sucesivamente a 
     * {@link SITNA.control.Control#renderData} (pasándole como parámetro los datos oportunos) y después a {@link MapControl#addUIEventListeners}.
     * @function
     * @name render
     * @async
     * @memberof MapControl
     * @param {function} [callback] Función que se ejecuta cuando el control ha sido representado.
     * @returns {Promise}
     * @instance
     * @see {@link SITNA.control.Control#renderData}
     */
    render(callback) {
        const self = this;
        if (!self.id) {
            self.id = self.#id;
        }
        return self.renderData(null, function () {
            self.addUIEventListeners();
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    /**
     * @event MapControl#sitna:controlrender
     * @description Evento que dispara un objeto que cumple con la interfaz {@link MapControl} cuando se ha renderizado.
     */


    /**
     * Carga las plantillas que utiliza el control para su representación e inicializa la propiedad
     * {@link MapControl#template}.
     * 
     * Dependiendo de la implementación, este método cargará las plantillas haciendo peticiones a URLs, importando módulos, etc., 
     * después las procesará si es necesario y finalmente las asignará a {@link MapControl#template}.
     * @function
     * @name loadTemplates
     * @async
     * @memberof MapControl
     * @returns {Promise}
     * @instance
     * @example <caption>[Ver en vivo](../examples/control.template.html)</caption> {@lang html}
    <div id="map-container"></div>
    <template id="basemap-randomizer-template">
        <h2>Cambio aleatorio de mapa de fondo</h2>
        <div style="margin:1em;">
            <p>Capa actual: <span class="current-layer" data-key="title"></span></p>
            <sitna-button>Cambiar</sitna-button>
        </div>
    </template>
    <script>
        // Creamos una clase que herede de la clase abstracta de control genérico
        class BasemapRandomizer extends SITNA.control.Control {

            // Reescribimos métodos

            async register(map) {
                // Llamamos primero al método de la clase antecesora
                await super.register(map);

                // Añadimos lógica de interacción con el mapa
                map.addEventListener("sitna:baselayerchange", (e) => {
                    this.querySelector("span.current-layer").textContent = e.layer.title;
                });

                // Devolvemos el propio control para mantener la signatura del método
                return this;
            }

            // Reescribimos el método loadTemplates para utilizar plantillas HTML en vez de Handlebars
            async loadTemplates() {
                // Asignamos a la propiedad template un diccionario de pares clave/valor,
                // siendo la clave un identificador de plantilla y el valor una función que acepta un objeto de
                // datos como parámetro y devuelve el resultado de aplicar la plantilla en forma de cadena de texto.

                // En este ejemplo solamente hay una plantilla para todo el control, por tanto el diccionario solamente
                // tiene una entrada.
                // También, por decisión de diseño de este ejemplo, se utiliza el atributo data-key para marcar
                // los elementos a los que incrustar los datos pasados por parámetro. El desarrollador tiene libertad 
                // para diseñar el método de incorporación de datos a la plantilla.
                this.template = {
                    [this.localName]: function (data) {
                        const node = document.getElementById("basemap-randomizer-template").content.cloneNode(true);
                        for (const [key, value] of Object.entries(data)) {
                            const textContainer = node.querySelector(`[data-key="${key}"]`);
                            if (textContainer) textContainer.textContent = value;
                        }
                        const tempElm = document.createElement("div");
                        tempElm.appendChild(node);
                        return tempElm.innerHTML;
                    }
                };
            }

            async render(callback) {
                // Cualquier implementación del método render debe llevar a cabo los siguientes procesos:
                // 1 - Si no está inicializada la propiedad template, llamar a loadTemplates para cargar la plantilla
                // 2 - Procesar la plantilla e incrustar el HTML resultante en el control
                // 3 - Lanzar el evento sitna:controlrender
                // 4 - Ejecutar la función de callback pasada como parámetro
                // 5 - Llamar a addUIEventListeners para añadir eventos de interfaz de usuario a los elementos HTML recién creados

                // Una implementación típica es delegar los procesos 1-4 a renderData, pasándole 
                // como parámetros los datos que sean relevantes para el control
                await this.renderData({ title: this.map?.baseLayer.title }, callback);
                this.addUIEventListeners();
                return;
            }

            addUIEventListeners() {
                this.querySelector("sitna-button").addEventListener("click", () => {
                    this.randomize();
                });
            }

            // Añadimos métodos nuevos

            randomize() {
                const n = this.map.baseLayers.length;
                const currentIndex = this.map.baseLayers.findIndex((baseLayer) => baseLayer === this.map.baseLayer);
                let nextIndex;
                do {
                    nextIndex = Math.floor(Math.random() * n);
                }
                while (nextIndex === currentIndex);
                this.map.setBaseLayer(this.map.baseLayers[nextIndex]);
            }
        }

        // Registramos la clase como elemento personalizado
        customElements.define("basemap-randomizer", BasemapRandomizer);

        // Creamos un mapa con un maquetado que tiene elementos contenedores vacíos disponibles
        var map = new SITNA.Map("map-container", { layout: "layout/ctl-container" });
        map.loaded(() => {
            // Colocamos el control que hemos creado en el elemento con identificador "slot1"
            map.addControl(new BasemapRandomizer("slot1"));
        });
    </script>
     */
    async loadTemplates() {
        await this.#processTemplates();
    }

    /**
     * Renderiza los contenidos del control pasándole datos a la plantilla. Este es un método de utilidad que es llamado 
     * por la implementación de {@link MapControl#render} de {@link SITNA.control.Control}.
     * 
     * Este método lleva a cabo los siguientes procesos:
     * 1. Si no está inicializada la propiedad template, carga las plantillas. Para ello llama a su implementación de {@link MapControl#loadTemplates}.
     * 2. Procesa la plantilla con los datos pasados como parámetro (lo hace llamando a {@link SITNA.control.Control#getRenderedHtml} y pegando la cadena de texto resultante al contenido del control).
     * 3. Lanza el evento `sitna:controlrender` mediante el método `dispatchEvent` de la interfaz `EventTarget`.
     * 4. Si está definida, ejecuta la función de callback pasada como parámetro.
     * @function
     * @name renderData
     * @async
     * @memberof SITNA.control.Control
     * @param {object} data - Datos que se pasan a la plantilla para su representacón. 
     * Generalmente es un diccionario de pares clave-valor, para que la plantilla los utilice.
     * @param {function} [callback] Función que se ejecuta cuando el control ha sido representado.
     * @returns {Promise}
     * @instance
     * @see {@link SITNA.control.Control#getRenderedHtml}
     */
    async renderData(data, callback) {
        const self = this;
        if (self.map) {
            self.trigger(Consts.event.BEFORECONTROLRENDER, { dataObject: data });
        }
        self.classList.add(WebComponentControl.prototype.CLASS, self.CLASS);
        self.classList.toggle(Consts.classes.DISABLED, self.isDisabled);

        const renderPromise = self.getRenderedHtml(self.getDefaultTemplateName(), data);
        self.#firstRender ??= renderPromise;
        const html = await renderPromise;
        self.innerHTML = html;
        if (!self.parentElement && self.div) {
            self.div.appendChild(self);
        }
        if (self.map) {
            self.trigger(Consts.event.CONTROLRENDER);
        }
        if (Util.isFunction(callback)) {
            callback();
        }
    }

    /**
     * Obtiene el HTML resultante de renderizar una plantilla con unos datos.
     * 
     * Si la propiedad {@link MapControl#template} no está definida, 
     * se llama al método {@link MapControl#loadTemplates} para cargar las plantillas.
     * 
     * @function
     * @name getRenderedHtml
     * @async
     * @memberof SITNA.control.Control
     * @param {string} templateId - Identificador de la plantilla que se quiere renderizar.
     * @param {object} data - Datos que se pasan a la plantilla para su representación. 
     * Generalmente es un diccionario de pares clave-valor, para que la plantilla los utilice.
     * @param {function} [callback] Función que se ejecuta cuando el control ha sido representado.
     * @returns {Promise<string>} Cadena de texto con el HTML resultante de la representación.
     * @instance
     */
    async getRenderedHtml(templateId, data, callback) {
        const self = this;

        if (!self.template) {
            await self.loadTemplates();
        }
        const defaultTemplateName = this.getDefaultTemplateName();
        let template = self.template[templateId];
        if (!template && defaultTemplateName === templateId) {
            template = self.template;
            self.template = { [defaultTemplateName]: template };
        }
        if (typeof template !== 'function') {
            await self.#processTemplates();
            template = self.template[templateId];
        }
        if (typeof template === 'undefined') {
            return '';
        }
        const html = template(data);
        if (Util.isFunction(callback)) {
            callback(html);
        }
        return html;
    }

    getDefaultTemplateName() {
        return this.CLASS === WebComponentControl.prototype.CLASS ? this.localName : this.CLASS;
    }

    async #processTemplates() {
        const templates = this.template;
        if (!templates) return;

        const templatePromises = [];
        for (let key in templates) {
            const templateName = key;
            let template = templates[templateName];
            if (typeof template === 'string') {
                templatePromises.push(new Promise(function (res, rej) {
                    TC.ajax({
                        url: template,
                        method: 'GET',
                        responseType: 'text'
                    })
                        .then(function (response) {
                            templates[templateName] = template = Handlebars.compile(response.data); // TODO: add optimization options
                            res(template);
                        })
                        .catch(function (err) {
                            console.log("Error fetching template: " + err);
                            rej(err);
                        });
                }));
            }
            else {
                if (typeof template === 'object') {
                    templates[key] = template = Handlebars.template(template);
                }
            }
        }

        await Promise.all(templatePromises);
        const defaultTemplateName = this.getDefaultTemplateName();
        for (const [key, t] of Object.entries(templates)) {
            if (t && key !== defaultTemplateName) {
                Handlebars.registerPartial(key, t);
            }
        }
    }

    /**
     * Registra el control en el mapa. Normalmente no es necesario llamar a este método directamente,
     * ya que se le llama desde {@link SITNA.Map#addControl}.
     * 
     * Se puede sobreescribir para añadir lógica de interacciones del control con el mapa.
     * 
     * @function
     * @name register
     * @async
     * @memberof MapControl
     * @param {SITNA.Map} map - Instancia del mapa en el que se registra el control.
     * @returns {Promise<MapControl>} El propio control.
     * @instance
     */
    async register(map) {
        this.map = map;
        await this.render();
        if (!this.parentElement) {
            if (this.div && this.div instanceof HTMLElement) this.div.appendChild(this);
            else {
                map.div.appendChild(this);
                this.div = map.div;
            }
        }
        if (this.options.active) {
            this.activate();
        }
        return this;
    }

    /**
     * Desregistra el control del mapa. Normalmente no es necesario llamar a este método directamente,
     * ya que se le llama siempre que se elimine el control de entre los descendientes del elemento contenedor 
     * del mapa.
     * 
     * @function
     * @name unregister
     * @memberof MapControl
     * @returns {MapControl} El propio control.
     * @instance
     */
    unregister() {
        const self = this;
        if (self.map) {
            self.map.layers.slice().forEach(layer => {
                if (layer.owner === self) {
                    self.map.removeLayer(layer);
                }
            });
            const idx = self.map.controls.indexOf(self);
            if (idx >= 0) {
                self.map.controls.splice(idx, 1);
            }
            self.map = null;
        }
        return self;
    }

    /**
     * Activa el control como gestor de las acciones de puntero en el área del mapa. 
     * Si hay otro control activo, lo desactiva antes.
     * 
     * En ocasiones, es necesario realizar acciones específicas mediante pulsaciones en el mapa, por ejemplo,
     * para dibujar geometrías. En estos casos, se activa el control que gestiona estas acciones.
     * 
     * En cada momento sólo puede haber un control activo en un mapa. Si se activa un control, el control que
     * estuviera activo hasta entonces se desactiva automáticamente.
     * @function
     * @name activate
     * @memberof MapControl
     * @returns {MapControl} El propio control.
     * @instance
     */
    activate() {
        const self = this;
        if (self.map && self.map.activeControl && self.map.activeControl !== self) {
            self.map.previousActiveControl = self.map.activeControl;
            self.map.activeControl.deactivate();
        }
        self.isActive = true;
        if (self.map) {
            self.map.activeControl = self;
            self.map.trigger(Consts.event.CONTROLACTIVATE, { control: self });
            self.trigger(Consts.event.CONTROLACTIVATE, { control: self });
        }
        return self;
    }

    /**
     * Desactiva el control como gestor de las acciones de puntero en el área del mapa. Por defecto,
     * se activa automáticamente el control predeterminado del mapa o, si no hay control predeterminado,
     * el control que estuviera activo antes que éste.
     * @function
     * @name deactivate
     * @memberof MapControl
     * @param {boolean} [stopChain=false] - Si es <code>true</code>, no se activa automáticamente ningún otro control.
     * @returns {MapControl} El propio control.
     * @instance
     */
    deactivate(stopChain = false) {
        const self = this;
        self.isActive = false;
        if (self.map) {
            self.map.activeControl = null;

            if (!stopChain) {
                //determinar cuál es el control predeterminado para reactivarlo
                //salvo que sea yo mismo, claro
                var nextControl = self.map.getDefaultControl();
                if (nextControl === self) nextControl = null;
                else if (self.map.previousActiveControl === self) // GLS: Validamos antes de activar que el control activo anterior sea distinto al control actual
                    nextControl = null;
                else if (!nextControl) {
                    nextControl = self.map.previousActiveControl;
                }

                if (nextControl)
                    nextControl.activate();
            }
            self.map.trigger(Consts.event.CONTROLDEACTIVATE, { control: self });
            self.trigger(Consts.event.CONTROLDEACTIVATE, { control: self });
        }
        return self;
    }

    enable() {
        const self = this;
        self.isDisabled = false;
        self.classList.remove(Consts.classes.DISABLED);
        delete self.dataset.tcMessage;
        if (self.containerControl && self.containerControl.onControlEnable) {
            self.containerControl.onControlEnable(self);
        }
        return self;
    }

    disable(options = {}) {
        const self = this;
        self.isDisabled = true;
        self.classList.add(Consts.classes.DISABLED);
        let message = self.getLocaleString('disabledControl');
        if (options.reason) {
            message = `${message} - ${options.reason}`;
        }
        self.dataset.tcMessage = message;
        if (self.containerControl && self.containerControl.onControlDisable) {
            self.containerControl.onControlDisable(self);
        }
        return self;
    }

    highlight() {
        const self = this;
        if (self.div) {
            self.div.classList.add(Consts.classes.HIGHLIGHTED);
        }
        if (self.map) {
            self.map.trigger(Consts.event.CONTROLHIGHLIGHT, { control: self });
        }
        return self;
    }

    unhighlight() {
        const self = this;
        if (self.div) {
            self.div.classList.remove(Consts.classes.HIGHLIGHTED);
        }
        if (self.map) {
            self.map.trigger(Consts.event.CONTROLUNHIGHLIGHT, { control: self });
        }
        return self;
    }

    isHighlighted() {
        const self = this;
        if (self.div) {
            return self.div.classList.contains(Consts.classes.HIGHLIGHTED);
        }
        return false;
    }

    renderPromise() {
        const self = this;
        return self.#firstRender || new Promise(function (resolve, _reject) {
            self.one(Consts.event.CONTROLRENDER, function () {
                resolve(self);
            });
        });
    }

    addUIEventListener(selector, event, listener) {
        const self = this;
        const elements = selector ? self.querySelectorAll(selector) : [self];
        elements.forEach(function (elm) {
            elm.addEventListener(event, listener);
        });
        return self;
    }

    /**
     * Añade los gestores de eventos asociados a la interfaz de usuario del control.
     * 
     * @function
     * @name addUIEventListeners
     * @memberof MapControl
     * @returns {MapControl} El propio control.
     * @instance
     */
    addUIEventListeners() {
        return this;
    }

    isExclusive() {
        return false;
    }

    getLocaleString(key, texts) {
        const map = this.map ?? TC.Map.get(this.closest(`.${Consts.classes.MAP}`));
        const locale = map ? map.getLocale() : Cfg.locale;
        return Util.getLocaleString(locale, key, texts);
    }

    getUID() {
        return TC.getUID({
            prefix: this.#id + '-'
        });
    }

    exportState() {
        if (this.exportsState) {
            return {};
        }
        return null;
    }

    importState(_state) {
        return this;
    }

    async getDownloadDialog() {
        const self = this;
        self.#downloadDialog ??= self.map.getControlsByClass('TC.control.FeatureDownloadDialog')[0];
        if (!self.#downloadDialog) {
            self.#downloadDialog = await self.map.addControl('FeatureDownloadDialog');
        }
        self.#downloadDialog.caller = self;
        return self.#downloadDialog;
    }

    async getElevationTool() {
        const self = this;
        if (!self.displayElevation && !self.options.displayElevation) {
            return null;
        }
        if (self.elevation) {
            return self.elevation;
        }
        if (!TC.tool.Elevation) {
            await import('../tool/Elevation');
        }
        if (typeof self.options.displayElevation === 'boolean') {
            if (self.map) {
                const mapElevation = await self.map.getElevationTool();
                if (mapElevation) {
                    self.elevation = mapElevation;
                }
                else {
                    self.elevation = new TC.tool.Elevation();
                }
            }
            else {
                self.elevation = new TC.tool.Elevation();
            }
        }
        else {
            if (self.map) {
                const mapElevation = await self.map.getElevationTool();
                if (mapElevation) {
                    self.elevation = new TC.tool.Elevation(Util.extend(true, {}, mapElevation.options, self.options.displayElevation));
                }
                else {
                    self.elevation = new TC.tool.Elevation(self.options.displayElevation);
                }
            }
            else {
                self.elevation = new TC.tool.Elevation(self.options.displayElevation);
            }
        }
        return self.elevation;
    }

    #getNativeListener(evt, callback) {
        const self = this;
        const result = function (evt) {
            const cbParameter = {
                type: evt.type,
                target: self,
                currentTarget: self
            };
            if (evt.detail) {
                Object.keys(evt.detail).forEach(function (key) {
                    if (!(key in cbParameter)) {
                        cbParameter[key] = evt.detail[key];
                    }
                });
            }
            return callback.call(self, cbParameter);
        }.bind(this);
        const stack = self.#listeners[evt] = self.#listeners[evt] || new Map();
        stack.set(callback, result);
        return result;
    }

    #onInternal(events, callback, options) {
        const self = this;
        events.split(' ').forEach(function (evt) {
            self.addEventListener(evt, self.#getNativeListener(evt, callback), options);
        });
        return self;
    }

    on(events, callback) {
        return this.#onInternal(events, callback);
    }

    one(events, callback) {
        return this.#onInternal(events, callback, { once: true });
    }

    off(events, callback) {
        const self = this;
        const eventList = events.split(' ');
        if (callback) {
            eventList.forEach(function (evt) {
                const stack = self.#listeners[evt];
                if (stack && stack.has(callback)) {
                    self.removeEventListener(evt, stack.get(callback));
                }
            });
        }
        else {
            eventList.forEach(function (evt) {
                const stack = self.#listeners[evt];
                if (stack) {
                    stack.forEach(function (cb) {
                        self.removeEventListener(evt, cb);
                    });
                    stack.clear();
                }
            });
        }
        return self;
    }

    trigger(type, options) {
        const self = this;
        let ceOptions;
        if (options) {
            ceOptions = {
                detail: options
            };
        }
        const event = new CustomEvent(type, ceOptions);
        self.dispatchEvent(event);
    }

    listenerBySelector(selector, callback) {
        const self = this;
        // Crea una estructura a partir de un mapa cuyas claves son los elementos.
        // Los valores son objetos cuyas claves son tipos de eventos
        // y cuyos valores son objetos que tienen como claves los selectores
        // y cuyos valores son las funciones de callback.
        // Se crea una función que va buscando la primera correspondencia con un selector.
        // En cuanto la encuentra, ejecuta el callback y deja de procesar.
        return function (e) {
            const element = this;
            const eventType = e.type;
            var eventTypes = self.#onBySelectorMap.get(element);
            if (!eventTypes) {
                eventTypes = {};
                self.#onBySelectorMap.set(element, eventTypes);
            }
            var selectors = eventTypes[eventType];
            if (!selectors) {
                eventTypes[eventType] = selectors = {};
            }
            if (!selectors[selector]) {
                selectors[selector] = callback;
            }
            // Para cada evento en cada elemento hay que llamar una sola vez al callback que toque.
            // Así que si se ejecuta un callback, prohibimos al resto de los listeners resolverse.
            if (!e._listenerBySelectorCalled) {
                var matches = false;
                var elm = e.target;
                var result;
                while (elm && elm !== element) {
                    for (selector in selectors) {
                        if (elm.matches && elm.matches(selector)) {
                            matches = true;
                            result = selectors[selector].call(element, e);
                            e._listenerBySelectorCalled = true;
                        }
                    }
                    if (matches) {
                        return result;
                    }
                    elm = elm.parentNode;
                }
            }
        }
    }

    static async create(type, options) {
        const ctorName = type.substr(0, 1).toUpperCase() + type.substr(1);
        if (!TC.control[ctorName]) {
            const module = await import('./' + ctorName);
            TC.control[ctorName] = module.default;
        }
        return new TC.control[ctorName](void (0), options);
    }
}

WebComponentControl.prototype.CLASS = 'tc-ctl';
customElements.get(elementName) || customElements.define(elementName, WebComponentControl);
TC.control.WebComponentControl = WebComponentControl;
export default WebComponentControl;
import TC from '../../TC.js';
import Consts from '../Consts.js';
import { Defaults } from '../Cfg.js';
import Util from '../Util.js';
import WebComponentControl from './WebComponentControl.js';
import './FeatureStyler.js';
import Controller from '../Controller.js';
import Observer from '../Observer.js';
import ControlEvent from '../../SITNA/control/ControlEvent.js';
import DrawWrapper from '../ol/Draw.js';

TC.control = TC.control || {};

Consts.event.DRAWSTART = ControlEvent.type.DRAWSTART;
Consts.event.DRAWEND = ControlEvent.type.DRAWEND;
Consts.event.DRAWCANCEL = ControlEvent.type.DRAWCANCEL;
Consts.event.DRAWUNDO = ControlEvent.type.DRAWUNDO;
Consts.event.DRAWREDO = ControlEvent.type.DRAWREDO;
Consts.event.POINTDRAW = ControlEvent.type.POINTDRAW;
Consts.event.MEASURE = 'measure.tc';
Consts.event.MEASUREPARTIAL = 'measurepartial.tc';
Consts.event.STYLECHANGE = 'stylechange.tc';
Consts.event.CHANGE = 'change';

class DrawModel {
    constructor() {
        this.new = "";
        this.undo = "";
        this.redo = "";
        this.cancel = "";
        this.end = "";
        this.tooltip = "";
    }
}

/**
  * @interface DrawOptions
  * @summary Opciones de control de dibujo.
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {SITNA.layer.Vector|string} [layer] - Capa vectorial o identificador de dicha capa en la que se dibujarán las 
  * entidades geográficas. Si no se especifica, el control creará una capa propia para este fin. 
  * @property {string} [mode] - Modo de dibujo, es decir, qué tipo de geometría se va a dibujar.
  * 
  * Para establecer el modo hay que darle un valor de [SITNA.Consts.geom]{@link SITNA.Consts}. Este control tiene tres modos:
  * punto, línea y polígono, correspondientes con los valores [SITNA.Consts.geom.POINT]{@link SITNA.Consts}, [SITNA.Consts.geom.POLYLINE]{@link SITNA.Consts} y 
  * [SITNA.Consts.geom.POLYGON]{@link SITNA.Consts}.
  * @property {boolean} [singleSketch=false] - Indica si el control solamente permite dibujar una sola entidad cada la vez.
  * @property {boolean|SITNA.layer.Vector|Array<SITNA.feature.Feature>} [snapping] - Especifica si el dibujo de 
  * geometrías tiene autoajuste, y en caso afirmativo, qué capa o entidades se usan para el ajuste. 
  * 
  * - Si se establece a verdadero, los vértices de las geometrías dibujadas se ajustarán a los vértices de las geometrías de las 
  * entidades dibujadas previamente.
  * - Si el valor es una instancia de [SITNA.layer.Vector]{@link SITNA.layer.Vector}, los vértices de las geometrías dibujadas 
  * se ajustarán a los vértices de las geometrías de las entidades de la capa correspondiente. 
  * - Si el valor es un array de [SITNA.feature.Feature]{@link SITNA.feature.Feature}, 
  * los vértices de las geometrías dibujadas se ajustarán a los vértices de las geometrías de las entidades del array.
  * @property {boolean} [stylable=false] - Indica si el control incluye herramientas para modificar el estilo de la entidad dibujada (color y grosor de trazo, color de relleno, etc.).
  * @property {VectorStyleOptions} [styles] - Estilos para el dibujo de las entidades geográficas. Si se especifica, sobrescribe los estilos por defecto del control para el tipo de geometría que se esté dibujando.
  * Si se establece a `false`, el control se instanciará sin capa asociada y no dibujará nada en el mapa, hasta que se le asigne una capa con el método {@link SITNA.control.Draw#setLayer}.
  * @example <caption>Ejemplo de uso de la propiedad `snapping` [Ver en vivo](../examples/DrawOptions.snapping.html)</caption> {@lang html}
    <div class="instructions radio-input">
        <p>Seleccionar una opción de ajuste:</p>
        <label><input type="radio" name="snapping-type" id="radio-true" value="true"><strong>true</strong> (Se fija a entidades dibujadas)</label>
        <label><input type="radio" name="snapping-type" id="radio-layer" value="layer"><strong>SITNA.layer.Vector</strong> (Se fija a entidades de una capa específica)</label>
        <label><input type="radio" name="snapping-type" id="radio-features" checked value="features"><strong>SITNA.feature.Feature[]</strong> (Se fija a entidades geográficas específicas)</label>
    </div>
    <div id="my-map"></div>
    <script>
        // Definimos una capa de referencia para los ajustes de vértices.
        const referenceLayer = new SITNA.layer.Vector({
            id: "reference",
            type: SITNA.Consts.layerType.VECTOR,
            title: "Elementos de referencia para ajuste"
        });
        // Creamos dos estilos para diferenciar las entidades de la capa de referencia.
        const depotStyle = {
            fillColor: "rgb(255 128 0 / 0.2)",
            strokeColor: "rgb(255 128 0 / 1)",
            strokeWidth: 2
        };
        const homeStyle = {
            fillColor: "rgb(0 128 255 / 0.2)",
            strokeColor: "rgb(0 128 255 / 1)",
            strokeWidth: 2
        };
        // Creamos dos colecciones de entidades para la capa de referencia.
        const depots = [
            new SITNA.feature.Polygon([
                [
                    [610490.206, 4733953.307],
                    [610498.028, 4734002.693],
                    [610517.778, 4733999.564],
                    [610509.956, 4733950.177],
                    [610490.206, 4733953.307]
                ]
            ], depotStyle),
            new SITNA.feature.Polygon([
                [
                    [610456.033, 4733945.572],
                    [610466.99, 4733938.033],
                    [610458.01, 4733924.984],
                    [610447.054, 4733932.523],
                    [610456.033, 4733945.572]
                ]
            ], depotStyle)
        ];
        const homes = [
            new SITNA.feature.Polygon([
                [
                    [610460.061, 4734008.732],
                    [610446.861, 4734010.438],
                    [610450.08, 4734035.297],
                    [610463.276, 4734033.591],
                    [610460.061, 4734008.732]
                ]
            ], homeStyle),
            new SITNA.feature.Polygon([
                [
                    [610426.048, 4733952.592],
                    [610429.269, 4733977.499],
                    [610442.44, 4733975.795],
                    [610439.219, 4733950.888],
                    [610426.048, 4733952.592]
                ]
            ], homeStyle),
            new SITNA.feature.Polygon([
                [
                    [610460.061, 4734008.732],
                    [610456.847, 4733983.879],
                    [610443.648, 4733985.585],
                    [610446.861, 4734010.438],
                    [610460.061, 4734008.732]
                ]
            ], homeStyle),
            new SITNA.feature.Polygon([
                [
                    [610463.276, 4734033.591],
                    [610476.472, 4734031.884],
                    [610473.257, 4734007.025],
                    [610460.061, 4734008.732],
                    [610463.276, 4734033.591]
                ]
            ], homeStyle),
            new SITNA.feature.Polygon([
                [
                    [610439.219, 4733950.888],
                    [610442.44, 4733975.795],
                    [610455.61, 4733974.092],
                    [610452.389, 4733949.185],
                    [610439.219, 4733950.888]
                ]
            ], homeStyle),
            new SITNA.feature.Polygon([
                [
                    [610446.861, 4734010.438],
                    [610433.67, 4734012.144],
                    [610436.885, 4734037.003],
                    [610450.08, 4734035.297],
                    [610446.861, 4734010.438]
                ]
            ], homeStyle),
            new SITNA.feature.Polygon([
                [
                    [610452.389, 4733949.185],
                    [610455.61, 4733974.092],
                    [610468.777, 4733972.389],
                    [610465.557, 4733947.482],
                    [610452.389, 4733949.185]
                ]
            ], homeStyle),
            new SITNA.feature.Polygon([
                [
                    [610473.257, 4734007.025],
                    [610470.043, 4733982.172],
                    [610456.847, 4733983.879],
                    [610460.061, 4734008.732],
                    [610473.257, 4734007.025]
                ]
            ], homeStyle),
            new SITNA.feature.Polygon([
                [
                    [610446.861, 4734010.438],
                    [610443.648, 4733985.585],
                    [610430.456, 4733987.292],
                    [610433.67, 4734012.144],
                    [610446.861, 4734010.438]
                ]
            ], homeStyle)
        ];
        const allLandLots = depots.concat(homes);

        // Creamos la lógica de selección de tipo de propiedad snapping según el radio button seleccionado.
        const radioTrue = document.getElementById("radio-true");
        const radioLayer = document.getElementById("radio-layer");
        const radioFeatures = document.getElementById("radio-features");
        radioTrue.addEventListener("change", () => {
            if (radioTrue.checked) {
                document.querySelector("sitna-draw").setSnapping(true);
            }
        });
        radioLayer.addEventListener("change", () => {
            if (radioLayer.checked) {
                document.querySelector("sitna-draw").setSnapping(referenceLayer);
            }
        });
        radioFeatures.addEventListener("change", () => {
            if (radioFeatures.checked) {
                document.querySelector("sitna-draw").setSnapping(depots);
            }
        });

        // Instanciamos el mapa con un layout simplificado con el control de dibujo en el primer contenedor.
        // Añadimos una capa de referencia para los ajustes de vértices.
        const myMap = new SITNA.Map("my-map", {
            layout: "layout/ctl-container",
            initialExtent: [610231, 4733866, 610711, 4734095],
            controls: {
                draw: {
                    div: "slot1",
                    mode: SITNA.Consts.geom.POLYGON,
                    snapping: depots // Activamos el ajuste de vértices solamente con las entidades de un grupo.
                }
            }
        });
        myMap.loaded(() => {
            myMap.addLayer(referenceLayer);
            referenceLayer.addFeatures(allLandLots);
        });
    </script>
  * @see {@link SITNA.control.Draw}
  */

/**
 * Este control ofrece al usuario una interfaz para dibujar entidades puntuales, lineales y poligonales en el mapa.
 * Otros controles hacen uso de este control cuando necesitan funcionalidades de dibujo.
 * @class Draw
 * @memberof SITNA.control
 * @extends SITNA.control.Control
 * @summary `<sitna-draw>`<p>Clase que implementa el control de dibujo de entidades geográficas.</p>
 * @implements {MapControl}
 * @param {HTMLElement|string} [container] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
 * @param {DrawOptions} [options] - Opciones de configuración del control.
 * @see {@link SITNA.Map#addControl}
 */

/**
 * @event SITNA.control.Draw#sitna:drawstart
 * @type {SITNA.control.ControlEvent}
 * @summary Evento que se dispara cuando se inicia un dibujo.
 * @property {SITNA.feature.Feature} feature - Entidad que se está dibujando.
 */

/**
 * @event SITNA.control.Draw#sitna:drawend
 * @type {SITNA.control.ControlEvent}
 * @summary Evento que se dispara cuando se finaliza un dibujo.
 * @property {SITNA.feature.Feature} feature - Entidad que se ha dibujado.
 */

/**
 * @event SITNA.control.Draw#sitna:drawcancel
 * @type {SITNA.control.ControlEvent}
 * @summary Evento que se dispara cuando se cancela un dibujo.
 */

/**
 * @event SITNA.control.Draw#sitna:drawundo
 * @type {SITNA.control.ControlEvent}
 * @summary Evento que se dispara cuando se deshace un paso de dibujo.
 */

/**
 * @event SITNA.control.Draw#sitna:drawredo
 * @type {SITNA.control.ControlEvent}
 * @summary Evento que se dispara cuando se rehace un paso de dibujo.
 */

/**
 * @event SITNA.control.Draw#sitna:pointdraw
 * @type {SITNA.control.ControlEvent}
 * @summary Evento que se dispara cuando se dibuja un punto, bien como entidad completa o bien como vértice de una 
 * línea o polígono.
 * @property {number[]} point - Punto que se ha dibujado.
 */

class Draw extends WebComponentControl {

    static {
        customElements.define('sitna-draw', this);
    }

    #classSelector = '.' + Draw.prototype.CLASS;
    #style;
    #styler;
    #snapping;
    #pointClass = Draw.prototype.CLASS + '-point';
    #lineClass = Draw.prototype.CLASS + '-line';
    #polygonClass = Draw.prototype.CLASS + '-polygon';
    #rectangleClass = Draw.prototype.CLASS + '-rectangle';
    #hasOwnLayer;
    #layerPromise;
    #newBtn;
    #cancelBtn;
    #endBtn;
    #undoBtn;
    #redoBtn;
    #previousStyles = new WeakMap();

    static extensibility = {
        DISABLED: 'disabled',
        ENABLED: 'enabled',
        EXTEND_ONLY: 'extend_only'
    };

    constructor() {
        super(...arguments);

        this.styles = this.options.styles || Util.extend(true, {}, Defaults.styles);
        this
            .initProperty('measurer')
            .initProperty('stylable')
            .initProperty('singleSketch')
            .initProperty('extensibleSketch')
            .initProperty('mode');
        // Si this.options.layer === false se instancia el control sin capa asociada
        this.#hasOwnLayer = !(this.options.layer === false);
        this.#snapping = this.options.snapping;

        this.history = [];
        this.historyIndex = 0;
        this.exportsState = true;

        this.#layerPromise = null;

        this.addEventListener(ControlEvent.type.DRAWSTART, (e) => {
            this.resetValues();
            if (e.feature) {
                this.history = e.feature.getCoordinates();
                this.historyIndex = this.history.length;
            }
        });
        this.addEventListener(ControlEvent.type.POINTDRAW, (e) => {
            if (this.layer && this.singleSketch && this.layer.features && this.layer.features.length > 0) {
                this.layer.clearFeatures();
            }

            this.history.length = this.historyIndex;
            this.history[this.historyIndex++] = e.point;
            this.#setDrawState();
        });
        this.addEventListener(ControlEvent.type.DRAWEND, (e) => {
            this.#setFeatureAddReadyState();
            e.feature.setId(this.layer.getNextFeatureId());
            this.getStyler().then((styler) => e.feature.setStyle(styler.getStyle()));

            if (this.callback) {
                this.callback(e.feature);
            }
        });
        this.model = new DrawModel();
    }

    connectedCallback() {
        super.connectedCallback();
        const self = this;
        self.#hasOwnLayer = !self.hasAttribute('borrowed-layer');
    }

    static get observedAttributes() {
        return ['mode', 'stylable'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'stylable') {
            self.#onStylableChange();
        }
        if (name === 'mode') {
            self.#onModeChange();
        }
    }

    /**
     * Modo de dibujo activo. Puede ser punto, línea o polígono. Los valores están disponibles en la propiedad `geom` de {@link SITNA.Consts}.
     * @summary Atributo HTML: `mode`
     * @name mode
     * @instance
     * @memberof SITNA.control.Draw
     * @type {string}
     * @default {@link SITNA.Consts}.geom.POLYLINE
     */
    get mode() {
        const self = this;
        if (self.hasAttribute('mode')) {
            return self.getAttribute('mode');
        }
        return Consts.geom.POLYLINE;
    }

    set mode(value) {
        const self = this;
        if (value) {
            self.setAttribute('mode', value);
        }
        else {
            self.removeAttribute('mode');
        }
    }

    async #onModeChange() {
        const self = this;
        const mode = self.mode;
        await self.renderPromise();
        (await self.getStyler()).mode = mode;
    }

    /**
     * Determina si el control incluye herramientas para modificar el estilo de la entidad (color y grosor de trazo, color de relleno, etc.).
     * @summary Atributo HTML: `stylable`
     * @name stylable
     * @instance
     * @memberof SITNA.control.Draw
     * @type {boolean}
     * @default false
     */
    get stylable() {
        return this.hasAttribute('stylable');
    }

    set stylable(value) {
        this.toggleAttribute('stylable', !!value);
    }

    async #onStylableChange() {
        const self = this;
        await self.renderPromise();
        self.querySelector(`.${self.CLASS}-style`).classList.toggle(Consts.classes.HIDDEN, !self.stylable);
    }

    get measurer() {
        return this.hasAttribute('measurer');
    }

    set measurer(value) {
        this.toggleAttribute('measurer', !!value);
    }

    /**
     * @method getSnapping
     * @memberof SITNA.control.Draw
     * @instance
     * @summary Obtiene el estado del control de ajuste (snapping) del control de dibujo.
     * @returns {boolean|SITNA.layer.Vector|Array<SITNA.feature.Feature>} El estado del control de ajuste, 
     * tal como se define en la propiedad `snapping` de {@link DrawOptions}.
     * @see DrawOptions
     */
    getSnapping() {
        return this.#snapping;
    }

    /**
     * @method setSnapping
     * @memberof SITNA.control.Draw
     * @instance
     * @summary Establece el estado del control de ajuste (snapping) del control de dibujo.
     * @param {boolean|SITNA.layer.Vector|Array<SITNA.feature.Feature>} value - El estado del control de ajuste, 
     * tal como se define en la propiedad `snapping` de {@link DrawOptions}.
     * @returns {this} La instancia del control, para permitir el encadenamiento de métodos.
     * @see DrawOptions
     */
    setSnapping(value) {
        this.#snapping = value;
        if (this.isActive) {
            this.wrap.setSnapping(value);
        }
        return this;
    }

    /**
     * Determina si el control solamente permite dibujar una sola entidad cada la vez. 
     * Si se establece a `true`, al iniciar un nuevo dibujo se eliminará el dibujo anterior. 
     * Si se establece a `false`, se podrán dibujar varias entidades, y cada nueva entidad se añadirá a la capa sin eliminar las anteriores.
     * @summary Atributo HTML: `single-sketch`
     * @name singleSketch
     * @instance
     * @memberof SITNA.control.Draw
     * @type {boolean}
     * @default false
     */
    get singleSketch() {
        return this.hasAttribute('single-sketch');
    }

    set singleSketch(value) {
        this.toggleAttribute('single-sketch', !!value);
    }

    /**
     * Determina si se permite prolongar un dibujo existente, pulsando sobre el último punto dibujado. 
     * Esta propiedad solamente tiene efecto si el control está en modo de dibujo de líneas.
     * @summary Atributo HTML: `extensible-sketch`
     * @name extensibleSketch
     * @instance
     * @memberof SITNA.control.Draw
     * @type {boolean}
     * @default false
     */
    get extensibleSketch() {
        return this.hasAttribute('extensible-sketch');
    }

    set extensibleSketch(value) {
        this.toggleAttribute('extensible-sketch', !!value);
    }

    async loadTemplates() {
        const self = this;
        const module = await import(
            /* webpackChunkName: "tc-ctl-draw" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-draw.mjs'
        );
        self.template = module.default;
    }

    render(callback) {
        const self = this;
        switch (self.mode) {
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
                self.model.tooltip = self.getLocaleString('drawLine');
                self.classList.add(self.#lineClass);
                break;
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
                self.model.tooltip = self.getLocaleString('drawPolygon');
                self.classList.add(self.#polygonClass);
                break;
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
                self.model.tooltip = self.getLocaleString('drawPoint');
                self.classList.add(self.#pointClass);
                break;
            case Consts.geom.RECTANGLE:
                self.model.tooltip = self.getLocaleString('drawRectangle');
                self.classList.add(self.#rectangleClass);
                break;
            default:
                self.model.tooltip = self.getLocaleString('draw');
                break;
        }
        const renderObject = {
            stylable: self.stylable
        };
        return self.renderData(renderObject, function () {
            self.reset = true;
            self.callback = null;

            if (Util.isFunction(self.options.callback)) {
                self.callback = self.options.callback;
            }

            self.wrap = new DrawWrapper(self);

            self.getStyler().then(styler => {
                styler.setStyles(self.styles);
            });

            self.#newBtn = self.querySelector(self.#classSelector + '-btn-new');
            self.#cancelBtn = self.querySelector(self.#classSelector + '-btn-cancel');
            self.#endBtn = self.querySelector(self.#classSelector + '-btn-end');
            self.#undoBtn = self.querySelector(self.#classSelector + '-btn-undo');
            self.#redoBtn = self.querySelector(self.#classSelector + '-btn-redo');

            self.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
            self.controller = new Controller(self.model, new Observer(self));
            self.updateModel();
        });
    }

    addUIEventListeners() {
        const self = this;
        self.getStyler().then((styler) => {
            styler.addEventListener(Consts.event.STYLECHANGE, (_e) => self.wrap.setStyle());
        });

        self.#newBtn.addEventListener(Consts.event.CLICK, function () {
            self.new();
        }, { passive: true });
        self.#cancelBtn.addEventListener(Consts.event.CLICK, function () {
            self.cancel();
        }, { passive: true });
        self.#endBtn.addEventListener(Consts.event.CLICK, function () {
            self.end();
        }, { passive: true });
        self.#undoBtn.addEventListener(Consts.event.CLICK, function () {
            self.undo();
        }, { passive: true });
        self.#redoBtn.addEventListener(Consts.event.CLICK, function () {
            self.redo();
        }, { passive: true });
    }

    async register(map) {
        const self = this;
        self.styles = Util.extend(true, {}, map.options.styles, self.options.styles);
        await super.register(map);

        const styler = await self.getStyler();
        styler.setStyles(self.styles);

        self.map
            .on(Consts.event.VIEWCHANGE, function () {
                if (self.map.view === Consts.view.PRINTING) {
                    self.end();

                    // No lanzo el evento porque da error al no llegar una feature
                    // self.trigger(Consts.event.DRAWEND);
                }
            })
            .on(Consts.event.PROJECTIONCHANGE, function (e) {
                self.history.forEach(function (point, idx, arr) {
                    arr[idx] = Util.reproject(point, e.oldCrs, e.newCrs);
                });
            });

        self.#layerPromise = new Promise(function (resolve, _reject) {
            map.loaded(function () {
                if (self.options.layer) {
                    self.setLayer(self.options.layer);
                    resolve(self.layer);
                }
                else {
                    if (!self.#hasOwnLayer) {
                        resolve(null);
                    }
                    else {
                        map.addLayer({
                            id: self.getUID(),
                            title: 'DrawControl',
                            stealth: true,
                            owner: self,
                            type: Consts.layerType.VECTOR,
                            styles: {
                                point: Object.assign({}, self.styles.point),
                                line: Object.assign({}, self.styles.line),
                                polygon: Object.assign({}, self.styles.polygon)
                            }
                        }).then(function (layer) {
                            map.putLayerOnTop(layer);
                            self.setLayer(layer);
                            resolve(self.layer);
                        });
                    }
                }
            });
        });

        return self;
    }

    unregister() {
        this.map.controls.splice(this.map.controls.findIndex((c) => c == this), 1);
    }

    new() {
        if (this.layer && this.singleSketch) {
            this.layer.clearFeatures();
        }
        this.#cancelBtn.disabled = false;
        this.#onModeChange();
        if (this.mode) this.activate();
        return this;
    }

    undo() {
        let result = this.wrap.undo();
        if (result) {
            this.historyIndex--;
            this.#setDrawState();

            if (this.historyIndex <= 0) {
                this.resetValues();
            }
            this.dispatchEvent(new ControlEvent(ControlEvent.type.DRAWUNDO, { control: this }));
        }

        return result;
    }

    redo() {
        let result = this.wrap.redo();
        if (result) {
            this.historyIndex++;
            this.#setDrawState();
            this.dispatchEvent(new ControlEvent(ControlEvent.type.DRAWREDO, { control: this }));
        }
        return result;
    }

    cancel() {
        this.resetValues();
        this.#setFeatureAddReadyState();
        this.#cancelBtn.disabled = true;
        this.dispatchEvent(new ControlEvent(ControlEvent.type.DRAWCANCEL, { control: this }));
        return this;
    }

    /**
     * @method activate
     * @memberof SITNA.control.Draw
     * @instance
     * @summary Activa el control de dibujo, de forma que los eventos de puntero en el mapa se capturan para dibujar las entidades geográficas.
     * @returns {SITNA.control.Draw} La instancia del control de dibujo, para permitir el encadenamiento de métodos.
     */
    activate() {
        const self = this;
        self.#newBtn.active = true;
        self.#cancelBtn.disabled = false;
        super.activate.call(self);
        self.wrap.activate(self.mode);
        self.classList.remove(self.#pointClass, self.#lineClass, self.#polygonClass, self.#rectangleClass);
        self.getStyler().then((styler) => {
            styler.mode = self.mode;
            styler.setLayer(self.layer);
        });
        switch (self.mode) {
            case Consts.geom.POINT:
                self.classList.add(self.#pointClass);
                break;
            case Consts.geom.POLYLINE:
                self.classList.add(self.#lineClass);
                break;
            case Consts.geom.POLYGON:
                self.classList.add(self.#polygonClass);
                break;
            case Consts.geom.RECTANGLE:
                self.classList.add(self.#rectangleClass);
                break;
            default:
                break;
        }
        return self;
    }

    /**
     * @method deactivate
     * @memberof SITNA.control.Draw
     * @instance
     * @summary Desactiva el control de dibujo, de forma que ya no captura los eventos de puntero en el mapa.
     * @returns {SITNA.control.Draw} La instancia del control de dibujo, para permitir el encadenamiento de métodos.
     */
    deactivate() {
        const self = this;
        if (self.#newBtn) {
            self.#newBtn.active = false;
        }
        if (self.#cancelBtn) {
            self.#cancelBtn.disabled = true;
        }
        super.deactivate.call(self);
        if (self.wrap) {
            self.wrap.deactivate();
        }
        self.resetValues();
        //self.dispatchEvent(new ControlEvent(ControlEvent.type.DRAWCANCEL, { control: self }));
        return self;
    }

    clear() {
        if (this.layer) {
            this.layer.clearFeatures();
        }
        this.resetValues();
        return this;
    }

    isExclusive() {
        return true;
    }

    end() {
        const self = this;
        self.wrap.end();
        self.resetValues();
        return self;
    }

    setMode(mode, activate) {
        const self = this;

        self.mode = mode;
        if (activate && mode) {
            //if (self.layer) {
            //self.layer.map.putLayerOnTop(self.layer);
            //}
            self.activate();
        }
        else {
            if (self.isActive) {
                self.deactivate();
            }
        }
        return self;
    }

    setStyle(style) {
        const self = this;
        style = Util.extend(self.#style, style);

        switch (self.mode) {
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
            case Consts.geom.RECTANGLE:
                self.styles.line = style;
                break;
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
                self.styles.polygon = style;
                break;
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
                self.styles.point = style;
                break;
            default:
                style = {};
                break;
        }
        self.getStyler().then(styler => {
            styler.setStyles(self.styles);
            self.wrap.setStyle();
        });
    }

    getStyle() {
        return this.#styler?.getStyle();
    }

    resetStyle() {
        const self = this;
        self.getStyler().then(styler => styler.resetStyle());
        return self;
    }

    setStrokeColor(color) {
        const self = this;
        self.styler.setStrokeColor(color);
        return self;
    }

    setFillColor(color) {
        const self = this;
        self.styler.setFillColor(color);
        return self;
    }

    setFillOpacity(alpha) {
        const self = this;
        self.styler.setFillOpacityWatch(alpha);
        return self;
    }

    setStrokeWidth(width) {
        const self = this;
        self.styler.setStrokeWidth(width);
        return self;
    }

    #toggleTools(tools, visible) {
        if (tools) {
            const classToggle = visible !== undefined ? !visible : undefined;
            tools.classList.toggle(Consts.classes.HIDDEN, classToggle);
        }
    }

    toggleStyleTools(visible) {
        const self = this;
        self.#toggleTools(self.querySelector(`.${self.CLASS}-style`), visible);
        return self;
    }

    /**
     * @method getLayer
     * @async
     * @memberof SITNA.control.Draw
     * @instance
     * @summary Obtiene la capa vectorial en la que se dibujan las entidades geográficas.
     * @returns {Promise<SITNA.layer.Vector>} La capa vectorial en la que el control dibuja.
     */
    getLayer() {
        const self = this;
        if (self.layer) {
            return Promise.resolve(self.layer);
        }
        return this.#layerPromise;
    }

    /**
     * @method setLayer
     * @memberof SITNA.control.Draw
     * @instance
     * @summary Establece la capa vectorial en la que se dibujarán las entidades geográficas.
     * @param {SITNA.layer.Vector|string} layer - Capa vectorial o id de la capa vectorial en la que se dibujarán las entidades geográficas.
     * @returns {this} La instancia del control de dibujo, para permitir el encadenamiento de métodos.
     */
    setLayer(layer) {
        const self = this;
        if (self.map) {
            if (self.layer) {
                self.#previousStyles.set(self.layer, Object.assign({}, self.#style));
            }
            if (typeof layer === "string") {
                self.layer = self.map.getLayer(layer);
            }
            else {
                self.layer = layer;
            }

            self.getStyler().then(function (styler) {
                styler.setLayer(layer);
            });


            //self.styles = {};
            //const previousStyle = self.#previousStyles.get(layer);
            //if (previousStyle) {
            //    self.setStyle(previousStyle);
            //}
            //else {
            //    const layerStyles = self.layer && self.layer.styles || Cfg.styles;
            //    Util.extend(true, self.styles, self.options.styles || layerStyles);
            //    self.resetStyle();
            //}
            if (!layer && self.isActive) {
                self.deactivate();
            }
        }
        return self;
    }

    setFeature(feature) {
        this.getStyler().then(styler => styler.setFeature(feature));
        return self;
    }

    resetValues() {
        this.history.length = 0;
        this.historyIndex = 0;
        this.#setDrawState();
        return this;
    }

    async getStyler() {
        const self = this;
        await self.renderPromise();
        self.#styler = self.querySelector('sitna-feature-styler');
        return self.#styler;
    }

    getSketch() {
        return this.wrap.getSketch();
    }

    getExtendedFeature() {
        return this.wrap.getExtendedFeature();
    }

    exportState() {
        const self = this;
        if (self.exportsState && self.layer) {
            return {
                id: self.getId(),
                layer: self.layer.exportState()
            };
        }
        return null;
    }

    importState(state) {
        const self = this;
        self.getLayer().then(function (layer) {
            layer.importState(state.layer);
        });
        return self;
    }

    async #setDrawState() {
        const self = this;
        await self.renderPromise();
        const mode = self.mode;
        self.#endBtn.disabled =
            self.historyIndex === 0 ||
            mode === Consts.geom.POLYGON && self.historyIndex < 3 ||
            mode === Consts.geom.POLYLINE && self.historyIndex < 2 ||
            mode === Consts.geom.RECTANGLE;
        self.#redoBtn.disabled = self.history.length === self.historyIndex;
        self.#undoBtn.disabled = self.historyIndex === 0 || self.mode === Consts.geom.RECTANGLE;
    }


    async #setFeatureAddReadyState() {
        const self = this;
        await self.renderPromise();
        self.resetValues();
        self.#endBtn.disabled = true;
        self.#cancelBtn.disabled = false;
    }
    updateModel() {
        this.model.new = this.getLocaleString('new');
        this.model.undo = this.getLocaleString('undo');
        this.model.redo = this.getLocaleString('redo');
        this.model.end = this.getLocaleString('end');
        this.model.cancel = this.getLocaleString('cancel');
        switch (this.mode) {
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
                this.model.tooltip = this.getLocaleString('drawLine');
                break;
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
                this.model.tooltip = this.getLocaleString('drawPolygon');
                break;
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
                this.model.tooltip = this.getLocaleString('drawPoint');
                break;
            case Consts.geom.RECTANGLE:
                this.model.tooltip = this.getLocaleString('drawRectangle');
                break;
            default:
                this.model.tooltip = this.getLocaleString('draw');
                break;
        }
    }

}

Draw.prototype.CLASS = 'tc-ctl-draw';
TC.control.Draw = Draw;
export default Draw;
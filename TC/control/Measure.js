import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import WebComponentControl from './WebComponentControl.js';
import './Draw.js';
import Controller from '../Controller.js';
import Observer from '../Observer.js';
import ControlEvent from '../../SITNA/control/ControlEvent.js';

/**
  * @interface MeasureOptions
  * @extends DrawOptions
  * @summary Opciones del control de medida de geometrías en el mapa.
  * @see MapControlsOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {boolean|ElevationOptions} [displayElevation=false] - Si se establece a un valor verdadero, los puntos dibujados mostrarán la elevación del mapa en las 
  * coordenadas del punto, y las líneas dibujadas mostrarán un gráfico con su perfil de elevación.
  * @property {SITNA.layer.Vector|string} [layer] - Capa vectorial o identificador de dicha capa en la que se dibujarán las 
  * líneas y los polígonos que asisten en la medida. Si no se especifica, el control creará una capa propia para este fin. 
  * @property {string} [mode] - Modo de dibujo inicial, es decir, qué tipo de geometría se va a dibujar.
  * 
  * Para establecer el modo hay que darle un valor de [SITNA.Consts.geom]{@link SITNA.Consts}. Si el control configurado 
  * es una instancia de {@link SITNA.control.Measure}, hay disponibles dos modos: línea y polígono, correspondientes con los valores 
  * [SITNA.Consts.geom.POLYLINE]{@link SITNA.Consts} y [SITNA.Consts.geom.POLYGON]{@link SITNA.Consts}.
  * Si el control configurado es una instancia de {@link SITNA.control.DrawMeasureModify}, se puede establecer también 
  * a punto ([SITNA.Consts.geom.POINT]{@link SITNA.Consts}).
  * 
  * Si esta opción no se especifica, el control se inicializa sin mostrar ningún modo activo.
  * @property {boolean} [singleSketch] - Indica si el control solamente permite dibujar una sola entidad cada la vez.
  * Por defecto tiene valor `true`, si el control es una instancia de {@link SITNA.control.Measure}, y `false` si el control es una instancia de {@link SITNA.control.DrawMeasureModify}.
  * @property {boolean|SITNA.layer.Vector|Array<SITNA.feature.Feature>} [snapping] - Especifica si el dibujo de 
  * geometrías tiene ajuste, y en caso afirmativo, qué capa o entidades se usan para el ajuste. 
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
  * @example <caption>Ejemplo de uso de la propiedad `displayElevation` [Ver en vivo](../examples/MeasureOptions.displayElevation.html)</caption> {@lang html}
    <div id="my-map"/>
    <script>
        const myMap = new SITNA.Map("my-map", {
            // Establecemos un layout simplificado apto para hacer demostraciones de controles.
            layout: "layout/ctl-container",
            controls: {
                // Añadimos el control de dibujo, medida y modificación de geometrías en el primer contenedor.
                drawMeasureModify: {
                    div: "slot1",
                    displayElevation: { // Se mostrarán elevaciones en los resultados de medida
                        sampleNumber: 100 // se mostrará el perfil mediante 100 puntos equiespaciados a lo largo de la línea
                    }
                }
            }
        });
    </script>
  */


TC.control = TC.control || {};

class MeasureModel {
    constructor() {
        //super();        
        this.measure = "";
        this.length = "";
        this.areaAndPerimeter = "";
    }
}

/**
 * Este control ofrece al usuario una herramienta para dibujar líneas y polígonos en el mapa y obtener 
 * las medidas de dichas geometrías (longitud, perímetro, área)
 * @class Measure
 * @memberof SITNA.control
 * @extends SITNA.control.Control
 * @summary `<sitna-measure>`<p>Clase que implementa el control de medición de líneas y polígonos.</p>
 * @implements {MapControl}
 * @param {HTMLElement|string} [container] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
 * @param {MeasureOptions} [options] - Opciones de configuración del control.
 * @see {@link SITNA.Map#addControl}
 */


class Measure extends WebComponentControl {

    static {
        customElements.define('sitna-measure', this);
    }

    #snapping;

    constructor() {
        super(...arguments);

        this.singleSketch = true;

        this
            .initProperty('snapping')
            .initProperty('singleSketch')
            .initProperty('mode');


        this.drawControls = [];
        this.NOMEASURE = '-';

        this.exportsState = true;

        this.renderPromise().then(() => {
            this.history = [];
            this.historyIndex = 0;
            this.reset = true;
        });
        this.model = new MeasureModel();
    }

    static get observedAttributes() {
        return ['mode'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        if (name === 'mode') {
            this.#onModeChange();
        }
    }

    /**
     * Modo de dibujo activo. Puede ser línea o polígono. Los valores están disponibles en la propiedad `geom` de {@link SITNA.Consts}.
     * @summary Atributo HTML: `mode`
     * @name mode
     * @instance
     * @memberof SITNA.control.Measure
     * @type {string}
     */
    get mode() {
        const self = this;
        if (self.hasAttribute('mode')) {
            return self.getAttribute('mode');
        }
        return null;
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
        const mode = this.mode;
        Array.from(this.querySelectorAll('sitna-draw')).find((ctl) => ctl.mode !== mode && ctl.isActive)?.deactivate();
        this.displayMode(this.mode);
        this.resetValues();

        return this;
    }

    /**
     * @method getSnapping
     * @memberof SITNA.control.Measure
     * @instance
     * @summary Obtiene el estado del control de ajuste (snapping) para el dibujo de entidades.
     * @returns {boolean|SITNA.layer.Vector|Array<SITNA.feature.Feature>} El estado del control de ajuste, 
     * tal como se define en la propiedad `snapping` de {@link DrawOptions}.
     * @see DrawOptions
     */
    getSnapping() {
        return this.#snapping;
    }

    /**
     * @method setSnapping
     * @memberof SITNA.control.Measure
     * @instance
     * @summary Establece el estado del control de ajuste (snapping) para el dibujo de entidades.
     * @param {boolean|SITNA.layer.Vector|Array<SITNA.feature.Feature>} value - El estado del control de ajuste, 
     * tal como se define en la propiedad `snapping` de {@link DrawOptions}.
     * @returns {this} La instancia del control, para permitir el encadenamiento de métodos.
     * @see DrawOptions
     */
    setSnapping(value) {
        this.#snapping = value;
        this.getLineDrawControl().then((ctl) => ctl.setSnapping(value));
        this.getPolygonDrawControl().then((ctl) => ctl.setSnapping(value));

        return this;
    }

    async loadTemplates() {
        const module = await import(
            /* webpackChunkName: "tc-ctl-meas" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-meas.mjs'
        );
        this.template = module.default;
    }

    async render(callback) {
        //const drawControls = this.querySelectorAll("sitna-draw");
        //const selectedIndex = Array.from(this.querySelectorAll("sitna-tab")).findIndex((tab) => tab.selected);

        await super.renderData({
            controlId: this.getId(),
            displayElevation: this.options.displayElevation,
            singleSketch: this.singleSketch,
            extensibleSketch: !this.singleSketch,
            stylable: !this.singleSketch,
        });

        this.lineMeasurementControl = this.querySelector('sitna-measurement[mode="polyline"]')
        this.polygonMeasurementControl = this.querySelector('sitna-measurement[mode="polygon"]')
        this.lineMeasurementControl.displayElevation = this.options.displayElevation;

        this.querySelectorAll('.tc-ctl-meas-select sitna-tab').forEach((tab) => {
            const self = this;
            tab.callback = function () {
                const target = this.target;
                if (target) {
                    self.activateMode(target.id.substr(target.id.indexOf('-mode-') + 6), true);
                }
            };
        });        
        const controls = await Promise.all([this.getLineDrawControl(), this.getPolygonDrawControl()]);
        this.lineDrawControl = controls[0];
        this.polygonDrawControl = controls[1];
        this.lineDrawControl.id = this.drawLinesId;
        this.polygonDrawControl.id = this.drawPolygonsId;
        this.lineDrawControl.setLayer(this.layer);
        this.polygonDrawControl.setLayer(this.layer);
        this.lineDrawControl.setSnapping(this.snapping);
        this.polygonDrawControl.setSnapping(this.snapping);
        for (const ctl of controls) {
            ctl.containerControl = this;
            this.drawControls.push(ctl);
            ctl.addEventListener(ControlEvent.type.DRAWSTART, (_e) => this.resetValues());
            ctl
                .on(Consts.event.MEASURE + ' ' + Consts.event.MEASUREPARTIAL, (e) => {
                    this.displayMeasurements(e);
                });
            ctl.addEventListener(ControlEvent.type.DRAWCANCEL, (_e) => {
                // Alerta de condición de carrera si no ponemos un timeout:
                // 1- Se llama a cancel de un control Draw.
                // 2- Se llama a deactivate (como es mediante cancel, no se se corta la cadena de activación controles).
                // 3- Si el control activo anterior era otro de los modos de dibujo de Measure, se activa.
                // 4- Se llama a cancel desde aquí.
                // 5- Se llama a deactivate del control que acabamos de activar en 3.
                // El activate de 3 y el deactivate de 5 sobre el mismo control entran en condición de carrera al crear/destruir la interaction
                // por tanto se puede quedar en un estado inconsistente. Para evitar eso, separamos 3 de 5 por el siguiente timeout.
                setTimeout(() => {
                    this.cancel();
                }, 100);
            });
            // Desactivamos el método exportState que ya se encarga el control padre de ello
            ctl.exportsState = false;
        }

        this.displayMode(this.mode);

        if (Util.isFunction(callback)) {
            callback();
        }

        this.controller = new Controller(this.model, new Observer(this));

        //if (selectedIndex >= 0) {
        //    this.querySelector("sitna-tab:nth-child(" + (selectedIndex + 1) + ")").toggleAttribute('selected', true);
        //    this.querySelectorAll("sitna-draw")[selectedIndex].renderPromise().then((drawCtl) => {
        //        this.querySelectorAll("sitna-draw")[selectedIndex].activate();
        //    });
        //}
    }

    async register(map) {
        const self = this;
        

        const layerId = self.getUID();
        self.drawLinesId = self.getUID();
        self.drawPolygonsId = self.getUID();

        self.units = self.options.units ? self.options.units : ["m", "km"];

        if (self.options.layerLess) {
            self.layerPromise = Promise.resolve(null);
        }
        else {
            self.layerPromise = map.addLayer({
                id: layerId,
                title: self.getLocaleString('measure'),
                owner: self,
                stealth: true,
                type: Consts.layerType.VECTOR,
                styles: {
                    point: map.options.styles.point,
                    line: map.options.styles.line,
                    polygon: map.options.styles.polygon
                }
            });
        }
        self.layer = await self.layerPromise;

        await super.register.call(self, map);
        self.map.on(Consts.event.VIEWCHANGE, function () {
            if (self.map.view === Consts.view.PRINTING) {
                self.trigger(Consts.event.DRAWEND);
            }
        });

        await self.renderPromise();
        if (self.layer) {
            map.putLayerOnTop(self.layer);
        }

        self.updateModel();

        return self;
    }

    displayMode(mode) {
        const self = this;

        const modes = [];
        self.querySelectorAll('.tc-ctl-meas-mode').forEach(function (elm) {
            modes.push(elm);
        });
        switch (mode) {
            case Consts.geom.POLYLINE:
                self._activeMode = modes.find(function (elm) {
                    return elm.matches('.tc-ctl-meas-len');
                });
                break;
            case Consts.geom.POLYGON:
                self._activeMode = modes.find(function (elm) {
                    return elm.matches('.tc-ctl-meas-area');
                });
                break;
            case null:
            case undefined:
                self._activeMode = null;
                break;
            default:
                break;
        }

        const hiddenModes = modes.filter(function (elm) {
            return elm !== self._activeMode;
        });

        if (mode) {
            const tab = self.querySelector(`sitna-tab[group="${self.getId()}-mode"][for="${self.getId()}-mode-${mode}"]`);
            tab.selected = true;
        }
        else {
            self.querySelectorAll(`sitna-tab[group="${self.getId()}-mode"]`).forEach(function (tab) {
                tab.selected = false;
            });
        }
        if (self._activeMode) {
            self._activeMode.classList.remove(Consts.classes.HIDDEN);
            self._activeMode.querySelector('.tc-ctl').classList.remove(Consts.classes.COLLAPSED);
        }
        hiddenModes.forEach(function (elm) {
            elm.classList.add(Consts.classes.HIDDEN);
        });
        return self;
    }

    /**
     * @method activateMode
     * @memberof SITNA.control.Measure
     * @instance
     * @summary Activa el modo de dibujo (línea o polígono).
     * @param {string} mode - Modo de dibujo. Puede tomar un valor del enumerado `geom` en {@link SITNA.Consts}.
     * @returns {SITNA.control.Measure} La instancia del control de dibujo, para permitir el encadenamiento de métodos.
     */
    activateMode(mode) {
        const self = this;

        self.mode = mode;

        var event;
        switch (mode) {
            case Consts.geom.POLYLINE:
                self.lineDrawControl.activate();
                event = Consts.event.CONTROLACTIVATE;
                break;
            case Consts.geom.POLYGON:
                self.polygonDrawControl.activate();
                event = Consts.event.CONTROLACTIVATE;
                break;
            case null:
            case undefined:
                self.drawControls.forEach(function (ctl) {
                    if (ctl.isActive) {
                        ctl.deactivate();
                    }
                });
                event = Consts.event.CONTROLDEACTIVATE;
                break;
            default:
                event = Consts.event.CONTROLACTIVATE;
                break;
        }

        if (event && self.map) {
            self.map.trigger(event, { control: self });
        }

        return self;
    }

    cancel() {
        this.activateMode(null);
        return this;
    }

    displayMeasurements(options = {}) {
        if (Object.hasOwn(options, 'area')) {
            this.polygonMeasurementControl.displayMeasurement(options);
        }
        if (Object.hasOwn(options, 'length')) {
            this.lineMeasurementControl.displayMeasurement(options);
        }
        return this;
    }

    async getLineMeasurementControl() {
        await this.renderPromise();
        return this.querySelector('sitna-measurement[mode="polyline"]');
    }

    async getPolygonMeasurementControl() {
        await this.renderPromise();
        return this.querySelector('sitna-measurement[mode="polygon"]');
    }

    resetValues() {
        const self = this;
        self.getLineMeasurementControl().then(ctl => ctl.clearMeasurement());
        self.getPolygonMeasurementControl().then(ctl => ctl.clearMeasurement());
        return self;
    }

    getDrawLines() {

    }

    /**
     * @method getLayer
     * @async
     * @memberof SITNA.control.Measure
     * @instance
     * @summary Obtiene la capa vectorial en la que están las entidades geográficas dibujadas/medidas.
     * @returns {Promise<SITNA.layer.Vector>} La capa vectorial en la que el control dibuja.
     */
    getLayer() {
        const self = this;
        if (self.layer) {
            return Promise.resolve(self.layer);
        }
        return self.layerPromise;
    }

    /**
     * @method setLayer
     * @memberof SITNA.control.Measure
     * @instance
     * @summary Establece la capa vectorial en la que se dibujarán las entidades geográficas medidas.
     * @param {SITNA.layer.Vector|string} layer - Capa vectorial o id de la capa vectorial en la que se dibujarán las entidades geográficas medidas.
     * @returns {this} La instancia del control de medida, para permitir el encadenamiento de métodos.
     */
    async setLayer(layer) {
        const self = this;
        self.layer = layer;
        for await (const control of [self.getLineDrawControl(), self.getPolygonDrawControl()]) {
            control.setLayer(self.layer);
        }
        return self;
    }

    async getLineDrawControl() {
        const self = this;
        await self.renderPromise();
        return self.querySelector('.tc-ctl-meas-len sitna-draw');
    }

    async getPolygonDrawControl() {
        const self = this;
        await self.renderPromise();
        return self.querySelector('.tc-ctl-meas-area sitna-draw');
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
        self.layerPromise.then(function (layer) {
            layer.importState(state.layer).then(() => {
                if (self.map.on3DView) {
                    self.map.view3D.UI.ImportState(layer.features);                    
                }
            });
        });
    }
    updateModel() {
        this.model.length = this.getLocaleString("length");
        this.model.areaAndPerimeter = this.getLocaleString("areaAndPerimeter");
        this.model.measure = this.getLocaleString("measure");
    }

}

Measure.prototype.CLASS = 'tc-ctl-meas';
TC.control.Measure = Measure;
export default Measure;
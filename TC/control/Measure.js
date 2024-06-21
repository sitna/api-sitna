import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Control from '../Control';
import './Draw';

TC.control = TC.control || {};

class Measure extends Control {
    constructor() {
        super(...arguments);
        const self = this;

        self.snapping = self.options.snapping;

        self.drawControls = [];
        self.persistentDrawControls = false;
        self.NOMEASURE = '-';

        self.exportsState = true;

        this.renderPromise().then(function () {
            self.measureMode = self.options.mode;

            self.history = [];
            self.historyIndex = 0;
            self.reset = true;

            self.wrap = new TC.wrap.control.Measure(self);
        });
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-meas.mjs');
        self.template = module.default;
    }

    async render(callback) {
        const self = this;
        await super.renderData.call(self, {
            controlId: self.id,
            displayElevation: self.options.displayElevation,
            singleSketch: !self.persistentDrawControls,
            extensibleSketch: self.persistentDrawControls,
            stylable: self.persistentDrawControls
        });
        if (self.options.mode) {
            self.div.querySelector('.tc-ctl-meas-select').classList.add(Consts.classes.HIDDEN);
        }

        self.lineMeasurementControl = self.div.querySelector('sitna-measurement[mode="polyline"]')
        self.polygonMeasurementControl = self.div.querySelector('sitna-measurement[mode="polygon"]')
        self.lineMeasurementControl.containerControl = self;
        self.lineMeasurementControl.displayElevation = self.options.displayElevation;
        self.polygonMeasurementControl.containerControl = self;

        self.div.querySelectorAll('.tc-ctl-meas-select sitna-tab').forEach(function (tab) {
            tab.callback = function () {
                const target = this.target;
                if (target) {
                    self.setMode(target.id.substr(target.id.indexOf('-mode-') + 6), true);
                }
            };
        });

        if (Util.isFunction(callback)) {
            callback();
        }
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);
        self.map.on(Consts.event.VIEWCHANGE, function () {
            if (self.map.view === Consts.view.PRINTING) {
                self.trigger(Consts.event.DRAWEND);
            }
        });

        const layerId = self.getUID();
        const drawLinesId = self.getUID();
        const drawPolygonsId = self.getUID();

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
        await self.renderPromise();
        if (self.layer) {
            map.putLayerOnTop(self.layer);
        }

        const controls = await Promise.all([self.getLineDrawControl(), self.getPolygonDrawControl()]);
        self.lineDrawControl = controls[0];
        self.polygonDrawControl = controls[1];
        self.lineDrawControl.id = drawLinesId;
        self.polygonDrawControl.id = drawPolygonsId;
        self.lineDrawControl.setLayer(self.layer);
        self.polygonDrawControl.setLayer(self.layer);
        self.lineDrawControl.snapping = self.snapping;
        self.polygonDrawControl.snapping = self.snapping;
        controls.forEach(function (ctl) {
            ctl.containerControl = self;
            self.drawControls.push(ctl);
            ctl
                .on(Consts.event.DRAWSTART, function (_e) {
                    self.resetValues();
                })
                .on(Consts.event.MEASURE + ' ' + Consts.event.MEASUREPARTIAL, function (e) {
                    self.displayMeasurements(e);
                })
                .on(Consts.event.DRAWCANCEL, function (_e) {
                    // Alerta de condición de carrera si no ponemos un timeout:
                    // 1- Se llama a cancel de un control Draw.
                    // 2- Se llama a deactivate (como es mediante cancel, no se se corta la cadena de activación controles).
                    // 3- Si el control activo anterior era otro de los modos de dibujo de Measure, se activa.
                    // 4- Se llama a cancel desde aquí.
                    // 5- Se llama a deactivate del control que acabamos de activar en 3.
                    // El activate de 3 y el deactivate de 5 sobre el mismo control entran en condición de carrera al crear/destruir la interaction
                    // por tanto se puede quedar en un estado inconsistente. Para evitar eso, separamos 3 de 5 por el siguiente timeout.
                    setTimeout(function () {
                        self.cancel();
                    }, 100);
                });
            // Desactivamos el método exportState que ya se encarga el control padre de ello
            ctl.exportsState = false;
        });

        self.setMode(self.options.mode);
        return self;
    }

    displayMode(mode) {
        const self = this;

        const modes = [];
        self.div.querySelectorAll('.tc-ctl-meas-mode').forEach(function (elm) {
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
            const tab = self.div.querySelector(`sitna-tab[group="${self.id}-mode"][for="${self.id}-mode-${mode}"]`);
            tab.selected = true;
        }
        else {
            self.div.querySelectorAll(`sitna-tab[group="${self.id}-mode"]`).forEach(function (tab) {
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

    setMode(mode) {
        const self = this;

        self.mode = mode;
        self.displayMode(mode);

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

        self.resetValues();

        if (event && self.map) {
            self.map.trigger(event, { control: self });
        }
    }

    cancel() {
        this.setMode(null, false);
        return this;
    }

    displayMeasurements(options = {}) {
        const self = this;
        if (Object.prototype.hasOwnProperty.call(options, 'area')) {
            self.polygonMeasurementControl.displayMeasurement(options);
        }
        if (Object.prototype.hasOwnProperty.call(options, 'length')) {
            self.lineMeasurementControl.displayMeasurement(options);
        }
        return self;
    }

    async getLineMeasurementControl() {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('sitna-measurement[mode="polyline"]');
    }

    async getPolygonMeasurementControl() {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('sitna-measurement[mode="polygon"]');
    }

    resetValues() {
        const self = this;
        self.getLineMeasurementControl().then(ctl => ctl.clearMeasurement());
        self.getPolygonMeasurementControl().then(ctl => ctl.clearMeasurement());
        return self;
    }

    getDrawLines() {

    }

    getLayer() {
        const self = this;
        if (self.layer) {
            return Promise.resolve(self.layer);
        }
        return self.layerPromise;
    }

    async setLayer(layer) {
        const self = this;
        self.layer = layer;
        for await (const control of [self.getLineDrawControl(), self.getPolygonDrawControl()]) {
            control.setLayer(self.layer);
        }
    }

    async getLineDrawControl() {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('.tc-ctl-meas-len sitna-draw');
    }

    async getPolygonDrawControl() {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('.tc-ctl-meas-area sitna-draw');
    }

    exportState() {
        const self = this;
        if (self.exportsState && self.layer) {
            return {
                id: self.id,
                layer: self.layer.exportState()
            };
        }
        return null;
    }

    importState(state) {
        const self = this;
        self.layerPromise.then(function (layer) {
            layer.importState(state.layer);
        });
    }
}

Measure.prototype.CLASS = 'tc-ctl-meas';
TC.control.Measure = Measure;
export default Measure;
import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';
import Draw from './Draw';

TC.control = TC.control || {};
TC.control.Draw = Draw;
TC.Control = Control;

TC.control.Measure = function () {
    var self = this;

    TC.Control.apply(self, arguments);

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
};

TC.inherit(TC.control.Measure, TC.Control);

(function () {
    var ctlProto = TC.control.Measure.prototype;

    ctlProto.CLASS = 'tc-ctl-meas';

    ctlProto.loadTemplates = async function () {
        const self = this;
        const module = await import('../templates/tc-ctl-meas.mjs');
        self.template = module.default;
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(TC.Control.prototype.renderData.call(self, {
            controlId: self.id,
            displayElevation: self.options.displayElevation,
            singleSketch: !self.persistentDrawControls,
            extensibleSketch: self.persistentDrawControls,
            stylable: self.persistentDrawControls
        }, function () {
            if (self.options.mode) {
                self.div.querySelector('.tc-ctl-meas-select').classList.add(Consts.classes.HIDDEN);
            }

            self.lineMeasurementControl = self.div.querySelector('sitna-measurement[mode="polyline"]')
            self.polygonMeasurementControl = self.div.querySelector('sitna-measurement[mode="polygon"]')
            self.lineMeasurementControl.containerControl = self;
            self.lineMeasurementControl.displayElevation = self.options.displayElevation;
            self.polygonMeasurementControl.containerControl = self;

            self.div.querySelectorAll(`.${TC.control.Measure.prototype.CLASS}-select sitna-tab`).forEach(function (tab) {
                tab.callback = function () {
                    const target = this.target;
                    if (target) {
                        self.setMode(target.id.substr(target.id.indexOf('-mode-') + 6), true);
                    }
                };
            });

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        }));
    };

    ctlProto.register = async function (map) {
        const self = this;
        await TC.Control.prototype.register.call(self, map);
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
    };

    ctlProto.displayMode = function (mode) {
        const self = this;

        const modes = [];
        self.div.querySelectorAll('.tc-ctl-meas-mode').forEach(function (elm) {
            modes.push(elm);
        });
        switch (mode) {
            case Consts.geom.POLYLINE:
                self._activeMode = modes.filter(function (elm) {
                    return elm.matches('.tc-ctl-meas-len');
                })[0];
                break;
            case Consts.geom.POLYGON:
                self._activeMode = modes.filter(function (elm) {
                    return elm.matches('.tc-ctl-meas-area');
                })[0];
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
    };

    ctlProto.setMode = function (mode) {
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
    };

    ctlProto.cancel = function () {
        this.setMode(null, false);
        return this;
    };

    ctlProto.displayMeasurements = function (options) {
        const self = this;
        options = options || {};
        if (Object.prototype.hasOwnProperty.call(options, 'area')) {
            self.polygonMeasurementControl.displayMeasurement(options);
        }
        if (Object.prototype.hasOwnProperty.call(options, 'length')) {
            self.lineMeasurementControl.displayMeasurement(options);
        }
        return self;
    };

    ctlProto.getLineMeasurementControl = async function () {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('sitna-measurement[mode="polyline"]');
    };

    ctlProto.getPolygonMeasurementControl = async function () {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('sitna-measurement[mode="polygon"]');
    };

    ctlProto.resetValues = function () {
        const self = this;
        self.getLineMeasurementControl().then(ctl => ctl.clearMeasurement());
        self.getPolygonMeasurementControl().then(ctl => ctl.clearMeasurement());
        return self;
    };

    ctlProto.getDrawLines = function () {

    };

    ctlProto.getLayer = function () {
        const self = this;
        if (self.layer) {
            return Promise.resolve(self.layer);
        }
        return self.layerPromise;
    };

    ctlProto.setLayer = async function (layer) {
        const self = this;
        self.layer = layer;
        for await (const control of [self.getLineDrawControl(), self.getPolygonDrawControl()]) {
            control.setLayer(self.layer);
        }
    };

    ctlProto.getLineDrawControl = async function () {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('.tc-ctl-meas-len sitna-draw');
    };

    ctlProto.getPolygonDrawControl = async function () {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('.tc-ctl-meas-area sitna-draw');
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState && self.layer) {
            return {
                id: self.id,
                layer: self.layer.exportState()
            };
        }
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        self.layerPromise.then(function (layer) {
            layer.importState(state.layer);
        });
    };

})();

const Measure = TC.control.Measure;
export default Measure;
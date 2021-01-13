TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

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

        self._len = self.div.querySelector('.tc-ctl-meas-val-len');
        self._area = self.div.querySelector('.tc-ctl-meas-val-area');
        self._peri = self.div.querySelector('.tc-ctl-meas-val-peri');

        self.setMode(self.options.mode);
    });
};
TC.control.Measure.units = {
    "m": { peso: 0, abbr: "m&sup2;" },
    "dam": { peso: 1, abbr: "dam&sup2;", precision: 2 },
    "hm": { peso: 2, abbr: "hm&sup2;", precision: 2 },
    "ha": { peso: 2, abbr: "ha", precision: 3 },
    "km": { peso: 3, abbr: "km&sup2;", precision: 3 }
}

TC.inherit(TC.control.Measure, TC.Control);

(function () {
    var ctlProto = TC.control.Measure.prototype;

    ctlProto.CLASS = 'tc-ctl-meas';

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-meas.hbs";

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(TC.Control.prototype.renderData.call(self, { controlId: self.id }, function () {
            TC.loadJS(
                !TC.control.Draw,
                TC.apiLocation + 'TC/control/Draw',
                function () {
                    if (self.options.mode) {
                        self.div.querySelector('.tc-ctl-meas-select').classList.add(TC.Consts.classes.HIDDEN);
                    }

                    self.div.querySelectorAll(`.${TC.control.Measure.prototype.CLASS}-select span`).forEach(function (span) {
                        span.addEventListener(TC.Consts.event.CLICK, function (e) {
                            var label = this;
                            while (label && label.tagName !== 'LABEL') {
                                label = label.parentElement;
                            }
                            var checkbox = label.querySelector(`input[type=radio][name="${self.id}-mode"]`);
                            var newMode = checkbox.value;

                            checkbox.checked = true;
                            self.setMode(newMode, true);
                        }, { passive: true });
                    });

                    if (TC.Util.isFunction(callback)) {
                        callback();
                    }
                });
        }));
    };

    ctlProto.register = function (map) {
        const self = this;
        return new Promise(function (resolve, reject) {
            TC.Control.prototype.register.call(self, map).then(function () {
                self.map.on(TC.Consts.event.VIEWCHANGE, function () {
                    if (self.map.view === TC.Consts.view.PRINTING) {
                        self.trigger(TC.Consts.event.DRAWEND);
                    }
                });

                const layerId = self.getUID();
                const drawLinesId = self.getUID();
                const drawPolygonsId = self.getUID();

                self.units = self.options.units ? self.options.units : ["m", "km"];

                self.layerPromise = map.addLayer({
                    id: layerId,
                    title: self.getLocaleString('measure'),
                    owner: self,
                    stealth: true,
                    type: TC.Consts.layerType.VECTOR,
                    styles: {
                        point: map.options.styles.point,
                        line: map.options.styles.line,
                        polygon: map.options.styles.polygon
                    }
                });

                Promise.all([self.layerPromise, self.renderPromise()]).then(function (objects) {
                    const layer = objects[0];
                    self.layer = layer;
                    self.layer.map.putLayerOnTop(self.layer);

                    self._lineDrawControlPromise = map.addControl('draw', {
                        id: drawLinesId,
                        div: self.div.querySelector('.tc-ctl-meas-line'),
                        mode: TC.Consts.geom.POLYLINE,
                        measure: true,
                        persistent: self.persistentDrawControls,
                        styleTools: self.persistentDrawControls,
                        layer: self.layer
                    });
                    self._polygonDrawControlPromise = map.addControl('draw', {
                        id: drawPolygonsId,
                        div: self.div.querySelector('.tc-ctl-meas-polygon'),
                        mode: TC.Consts.geom.POLYGON,
                        measure: true,
                        persistent: self.persistentDrawControls,
                        styleTools: self.persistentDrawControls,
                        layer: self.layer
                    });

                    Promise.all([self._lineDrawControlPromise, self._polygonDrawControlPromise]).then(function (controls) {
                        self.lineDrawControl = controls[0];
                        self.polygonDrawControl = controls[1];
                        controls.forEach(function (ctl) {
                            ctl.containerControl = self;
                            self.drawControls.push(ctl);
                            ctl
                                .on(TC.Consts.event.MEASURE + ' ' + TC.Consts.event.MEASUREPARTIAL, function (e) {
                                    self.showMeasures(e);
                                })
                                .on(TC.Consts.event.DRAWCANCEL, function (e) {
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

                        resolve(self);
                        self.setMode(self.options.mode);
                    }).catch(reject);
                }).catch(reject);
            });
        });
    };

    ctlProto.displayMode = function (mode) {
        const self = this;

        const modes = [];
        self.div.querySelectorAll('.tc-ctl-meas-mode').forEach(function (elm) {
            modes.push(elm);
        });
        var event;
        switch (mode) {
            case TC.Consts.geom.POLYLINE:
                self._activeMode = modes.filter(function (elm) {
                    return elm.matches('.tc-ctl-meas-len');
                })[0];
                break;
            case TC.Consts.geom.POLYGON:
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
            const radio = self.div.querySelector(`input[type=radio][name="${self.id}-mode"][value="${mode}"]`);
            radio.checked = true;
        }
        else {
            self.div.querySelectorAll(`input[type=radio][name="${self.id}-mode"]`).forEach(function (radio) {
                radio.checked = false;
            });
        }
        if (self._activeMode) {
            self._activeMode.classList.remove(TC.Consts.classes.HIDDEN);
            self._activeMode.querySelector('.tc-ctl').classList.remove(TC.Consts.classes.COLLAPSED);
        }
        hiddenModes.forEach(function (elm) {
            elm.classList.add(TC.Consts.classes.HIDDEN);
        });
        return self;
    };

    ctlProto.setMode = function (mode) {
        const self = this;

        self.mode = mode;
        self.displayMode(mode);

        var event;
        switch (mode) {
            case TC.Consts.geom.POLYLINE:
                self.lineDrawControl.activate();
                event = TC.Consts.event.CONTROLACTIVATE;
                break;
            case TC.Consts.geom.POLYGON:
                self.polygonDrawControl.activate();
                event = TC.Consts.event.CONTROLACTIVATE;
                break;
            case null:
            case undefined:
                self.drawControls.forEach(function (ctl) {
                    if (ctl.isActive) {
                        ctl.cancel();
                    }
                });
                event = TC.Consts.event.CONTROLDEACTIVATE;
                break;
            default:
                event = TC.Consts.event.CONTROLACTIVATE;
                break;
        }

        self.resetValues();

        if (event && self.map) {
            self.map.trigger(event, { control: self });
        }
        return self;
    };

    ctlProto.cancel = function () {
        this.setMode(null, false);
        return this;
    }

    ctlProto.showMeasures = function (options) {
        const self = this;
        options = options || {};
        var units = options.units;
        var precision;
        const locale = self.map.options.locale || TC.Cfg.locale
        if (options.area) {
            var area = options.area;
            (self.units instanceof Array ? self.units : self.units.split(",")).forEach(function (unit, index, array) {
                const difPeso = TC.control.Measure.units[unit.trim()].peso - TC.control.Measure.units["m"].peso;
                let precision = TC.control.Measure.units[unit.trim()].precision ? TC.control.Measure.units[unit.trim()].precision : 0;
                if (array.length === 1 || area >= Math.pow(100, difPeso) / Math.pow(10, precision ? precision - 1 : precision)) {
                    self._area.innerHTML = TC.Util.formatNumber((area / Math.pow(100, (difPeso))).toFixed(precision), locale) + ' ' + TC.control.Measure.units[unit].abbr;
                }
            });
        }
        if (options.perimeter) {
            var perimeter = options.perimeter;
            if (perimeter > 1000) {
                perimeter = perimeter / 1000;
                units = 'km';
            }
            precision = units === 'm' ? 0 : 3;
            self._peri.innerHTML = TC.Util.formatNumber(perimeter.toFixed(precision), locale) + ' ' + units;
        }
        if (options.length) {
            var length = options.length;
            if (length > 1000) {
                length = length / 1000;
                units = 'km';
            }
            precision = units === 'm' ? 0 : 3;
            self._len.innerHTML = TC.Util.formatNumber(length.toFixed(precision), locale) + ' ' + units;
        }
        return self;
    };

    ctlProto.resetValues = function () {
        const self = this;
        if (self._len) {
            self._len.textContent = self.NOMEASURE;
            self._area.textContent = self.NOMEASURE;
            self._peri.textContent = self.NOMEASURE;
        }
        return self;
    };

    ctlProto.getDrawLines = function () {

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
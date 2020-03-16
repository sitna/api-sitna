TC.control = TC.control || {};

if (!TC.control.FeatureInfoCommons) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/FeatureInfoCommons');
}
(function () {
    TC.control.MultiFeatureInfo = function () {
        var self = this;
        TC.Control.apply(self, arguments);
        self.modes = self.options.modes || {};
        if (typeof self.modes[TC.Consts.geom.POINT] === 'undefined') {
            self.modes[TC.Consts.geom.POINT] = true;
        }
        if (typeof self.modes[TC.Consts.geom.POLYGON] === 'undefined') {
            self.modes[TC.Consts.geom.POLYGON] = true;
        }
        self.featureInfoControl = null;
        self.lineFeatureInfoControl = null;
        self.polygonFeatureInfoControl = null;
        self.featureInfoControls = [];
        self.lastCtrlActive = null;
        self.popup = null;
        self.exportsState = false; // Los controles que exportan estado son los hijos
    };

    TC.inherit(TC.control.MultiFeatureInfo, TC.control.FeatureInfoCommons);

    var ctlProto = TC.control.MultiFeatureInfo.prototype;

    ctlProto.CLASS = 'tc-ctl-m-finfo';

    ctlProto.template = TC.apiLocation + "TC/templates/MultiFeatureInfo.html";

    const mergeOptions = function (opt1, opt2) {
        if (opt1) {
            if (opt1 === true) {
                opt1 = {};
            }
            return TC.Util.extend(true, opt1, opt2);
        }
        return opt1;
    };

    ctlProto.register = function (map) {
        const self = this;

        self.div.querySelectorAll('input[type=radio]').forEach(function (input) {
            input.checked = false;
        });


        return new Promise(function (resolve, reject) {
            const ctlPromises = [TC.Control.prototype.register.call(self, map)]
            const styles = self.options.styles || {};
            if (self.modes[TC.Consts.geom.POINT]) {
                ctlPromises.push(map.addControl("featureInfo", mergeOptions(self.modes[TC.Consts.geom.POINT],
                    { displayMode: self.options.displayMode })).then(function (control) {
                        self.featureInfoControl = control;
                        self.featureInfoControls.push(control);
                        return control;
                    }));
            }
            if (self.modes[TC.Consts.geom.POLYLINE]) {
                ctlPromises.push(map.addControl("lineFeatureInfo", mergeOptions(self.modes[TC.Consts.geom.POLYLINE],
                    { displayMode: self.options.displayMode, style: styles.line })).then(function (control) {
                        self.lineFeatureInfoControl = control;
                        self.featureInfoControls.push(control);
                        return control;
                    }));
            }
            if (self.modes[TC.Consts.geom.POLYGON]) {
                ctlPromises.push(map.addControl("polygonFeatureInfo", mergeOptions(self.modes[TC.Consts.geom.POLYGON],
                    { displayMode: self.options.displayMode, style: styles.polygon })).then(function (control) {
                        self.polygonFeatureInfoControl = control;
                        self.featureInfoControls.push(control);
                        return control;
                    }));
            }

            map.on(`${TC.Consts.event.LAYERADD} ${TC.Consts.event.LAYERREMOVE} ${TC.Consts.event.LAYERVISIBILITY}`, function (e) {
                self.updateUI();
            });

            map.on(`${TC.Consts.event.CONTROLACTIVATE} ${TC.Consts.event.CONTROLDEACTIVATE}`, function (e) {
                if (e.control === self.featureInfoControl || e.control === self.lineFeatureInfoControl || e.control === self.polygonFeatureInfoControl) {
                    self.updateUI();
                }
            });

            Promise.all(ctlPromises).then(function () {
                if (self.featureInfoControl) {
                    self.featureInfoControl.activate();
                    self.lastCtrlActive = self.featureInfoControl;
                }
                self.updateUI();
                resolve(self);
            });
        });

    };

    ctlProto.render = function (callback) {
        const self = this;
        var renderData = {};
        if (self.modes[TC.Consts.geom.POINT]) {
            renderData.pointSelectValue = TC.Consts.geom.POINT;
        }
        if (self.modes[TC.Consts.geom.POLYLINE]) {
            renderData.lineSelectValue = TC.Consts.geom.POLYLINE;
        }
        if (self.modes[TC.Consts.geom.POLYGON]) {
            renderData.polygonSelectValue = TC.Consts.geom.POLYGON;
        }
        return self._set1stRenderPromise(self.renderData(renderData,
            function () {
                var changeEvent = function () {
                    switch (this.value) {
                        case TC.Consts.geom.POLYLINE:
                            //modo línea
                            self.lineFeatureInfoControl.activate();
                            self.lastCtrlActive = self.lineFeatureInfoControl;
                            break;
                        case TC.Consts.geom.POLYGON:
                            //modo poligono
                            self.polygonFeatureInfoControl.activate();
                            self.lastCtrlActive = self.polygonFeatureInfoControl;
                            break;
                        default:
                            //modo point
                            self.featureInfoControl.activate();
                            self.lastCtrlActive = self.featureInfoControl;
                            break;
                    }
                };
                self.div.querySelectorAll('input[type=radio]').forEach(function (input) {
                    input.addEventListener('change', changeEvent);
                });

                //URI bind del click del boton de borrar seleccionadas
                const delFeaturesBtn = self.div.querySelector(`.${self.CLASS}-btn-remove`);
                delFeaturesBtn.addEventListener(TC.Consts.event.CLICK, function (event) {
                    event.preventDefault();
                    self.featureInfoControls.forEach(ctl => {
                        ctl.info = null;
                        ctl._infoHistory = {};
                        ctl.resultsLayer.features.slice().forEach(f => ctl.downplayFeature(f));
                        ctl.filterLayer.features.slice().forEach(f => f.layer.removeFeature(f));
                    });
                });
                self.map
                    //.on(TC.Consts.event.FEATUREINFO, function () {
                    //    delFeaturesBtn.disabled = false;
                    //})
                    //.on(TC.Consts.event.NOFEATUREINFO, function (e) {
                    //    if (e.control && e.control.filterFeature) {
                    //        delFeaturesBtn.disabled = false;
                    //    }
                    //})
                    .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                        if (self.featureInfoControls.some(ctl => ctl.resultsLayer === e.layer || ctl.filterLayer === e.layer)) {
                            self.updateUI();
                        }
                    })
                    .on(TC.Consts.event.FEATUREADD + ' ' + TC.Consts.event.FEATURESADD, function (e) {
                        if (self.featureInfoControls.some(ctl => ctl.resultsLayer === e.layer || ctl.filterLayer === e.layer)) {
                            self.updateUI();
                        }
                    });

                if (TC.Util.isFunction(callback)) {
                    callback();
                }
            }));
    };

    ctlProto.activate = function () {
        var self = this;
        if (self.lastCtrlActive)
            self.lastCtrlActive.activate();
    };

    ctlProto.deactivate = function () {
        var self = this;
        self.lastCtrlActive.deactivate(false);
    };

    ctlProto.updateUI = function () {
        const self = this;
        self.renderPromise().then(function () {
            const enabled = self.map.workLayers.some(l => l.type === TC.Consts.layerType.WMS && l.getVisibility());
            self.div.querySelectorAll('input').forEach(function (input) {
                input.disabled = !enabled;
            });
            if (self.featureInfoControl) {
                const input = self.div.querySelector(`input[value=${TC.Consts.geom.POINT}]`);
                if (input) {
                    input.checked = self.featureInfoControl.isActive;
                }
            }
            if (self.lineFeatureInfoControl) {
                const input = self.div.querySelector(`input[value=${TC.Consts.geom.POLYLINE}]`);
                if (input) {
                    input.checked = self.lineFeatureInfoControl.isActive;
                }
            }
            if (self.polygonFeatureInfoControl) {
                const input = self.div.querySelector(`input[value=${TC.Consts.geom.POLYGON}]`);
                if (input) {
                    input.checked = self.polygonFeatureInfoControl.isActive;
                }
            }

            const delFeaturesBtn = self.div.querySelector(`.${self.CLASS}-btn-remove`);
            delFeaturesBtn.classList.toggle(TC.Consts.classes.HIDDEN, !self.featureInfoControls.some(c => c.options.persistentHighlights));
            delFeaturesBtn.disabled = self.featureInfoControls.every(ctl => ctl.resultsLayer && ctl.resultsLayer.features.length === 0 && ctl.filterLayer && ctl.filterLayer.features.length === 0);


            // Hack para compensar bug de Edge: no se actualiza el estilo al cambiar el estado del radio.
            const displayValue = self.div.style.display;
            self.div.style.display = 'none';
            if (displayValue) {
                self.div.style.display = displayValue;
            }
            else {
                self.div.style.removeProperty('display');
            }
        });
    };

})();
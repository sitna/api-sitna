TC.control = TC.control || {};

if (!TC.control.FeatureInfoCommons) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/FeatureInfoCommons');
}
(function () {
    TC.control.MultiFeatureInfo = function () {
        var self = this;
        self.lineColor = null;
        TC.Control.apply(self, arguments);
        self.modes = self.options.modes || {};
        if (typeof self.modes[TC.Consts.geom.POINT] === 'undefined') {
            self.modes[TC.Consts.geom.POINT] = true;
        }
        if (typeof self.modes[TC.Consts.geom.POLYGON] === 'undefined') {
            self.modes[TC.Consts.geom.POLYGON] = true;
        }
        self.fInfoCtrl = null;
        self.lineFInfoCtrl = null;
        self.polygonFInfoCtrl = null;
        self.lastCtrlActive = null;
        self.popup = null;
        self.exportsState = false; // Los controles que exportan estado son los hijos
    };

    TC.inherit(TC.control.MultiFeatureInfo, TC.control.FeatureInfoCommons);

    var ctlProto = TC.control.MultiFeatureInfo.prototype;

    ctlProto.CLASS = 'tc-ctl-m-finfo';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/MultiFeatureInfo.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS,body_0);function body_0(chk,ctx){return chk.w("<div class=\"tc-ctl-m-finfo-select\"><form><span>").h("i18n",ctx,{},{"$key":"selection"}).w("</span>").x(ctx.get(["pointSelectValue"], false),ctx,{"block":body_1},{}).x(ctx.get(["lineSelectValue"], false),ctx,{"block":body_2},{}).x(ctx.get(["polygonSelectValue"], false),ctx,{"block":body_3},{}).w("</form></div>");}body_0.__dustBody=!0;function body_1(chk,ctx){return chk.w("<label class=\"tc-ctl-m-finfo-btn-point\" title=\"").h("i18n",ctx,{},{"$key":"selectionByPoint"}).w("\"><input type=\"radio\" name=\"selectmode\" value=\"").f(ctx.get(["pointSelectValue"], false),ctx,"h").w("\" checked /><span class=\"tc-ctl-btn\">").h("i18n",ctx,{},{"$key":"byPoint"}).w("</span></label>");}body_1.__dustBody=!0;function body_2(chk,ctx){return chk.w("<label class=\"tc-ctl-m-finfo-btn-line\" title=\"").h("i18n",ctx,{},{"$key":"selectionByLine"}).w("\"><input type=\"radio\" name=\"selectmode\" value=\"").f(ctx.get(["lineSelectValue"], false),ctx,"h").w("\" /><span class=\"tc-ctl-btn\">").h("i18n",ctx,{},{"$key":"byLine"}).w("</span></label>");}body_2.__dustBody=!0;function body_3(chk,ctx){return chk.w("<label class=\"tc-ctl-m-finfo-btn-polygon\" title=\"").h("i18n",ctx,{},{"$key":"selectionByPrecinct"}).w("\"><input type=\"radio\" name=\"selectmode\" value=\"").f(ctx.get(["polygonSelectValue"], false),ctx,"h").w("\" /><span class=\"tc-ctl-btn\">").h("i18n",ctx,{},{"$key":"byPrecinct"}).w("</span></label>");}body_3.__dustBody=!0;return body_0};
    }

    const mergeOptions = function (opt1, opt2) {
        if (opt1 === true) {
            opt1 = {};
            return TC.Util.extend(opt1, opt2);
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
            if (self.modes[TC.Consts.geom.POINT]) {
                ctlPromises.push(map.addControl("featureInfo", mergeOptions(self.modes[TC.Consts.geom.POINT],
                    { displayMode: self.options.displayMode })).then(function (control) {
                        self.fInfoCtrl = control;
                        return control;
                    }));
            }
            if (self.modes[TC.Consts.geom.POLYLINE]) {
                ctlPromises.push(map.addControl("lineFeatureInfo", mergeOptions(self.modes[TC.Consts.geom.POLYLINE],
                    { displayMode: self.options.displayMode, lineColor: self.lineColor })).then(function (control) {
                        self.lineFInfoCtrl = control;
                        return control;
                    }));
            }
            if (self.modes[TC.Consts.geom.POLYGON]) {
                ctlPromises.push(map.addControl("polygonFeatureInfo", mergeOptions(self.modes[TC.Consts.geom.POLYGON],
                    { displayMode: self.options.displayMode, lineColor: self.lineColor })).then(function (control) {
                        self.polygonFInfoCtrl = control;
                        return control;
                    }));
            }

            map.on(`${TC.Consts.event.LAYERADD} ${TC.Consts.event.LAYERREMOVE} ${TC.Consts.event.LAYERVISIBILITY}`, function (e) {
                self.updateUI();
            });

            map.on(`${TC.Consts.event.CONTROLACTIVATE} ${TC.Consts.event.CONTROLDEACTIVATE}`, function (e) {
                if (e.control === self.fInfoCtrl || e.control === self.lineFInfoCtrl || e.control === self.polygonFInfoCtrl) {
                    self.updateUI();
                }
            });

            Promise.all(ctlPromises).then(function () {
                if (self.fInfoCtrl) {
                    self.fInfoCtrl.activate();
                    self.lastCtrlActive = self.fInfoCtrl;
                }
                self.updateUI();
                resolve(self);
            });
        });

    };

    ctlProto.render = function (callback) {
        const self = this;
        self.lineColor = !self.options.lineColor ? "#c00" : self.options.lineColor;
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
        return TC.Control.prototype.renderData.call(self, renderData,
            function () {
                var changeEvent = function () {
                    switch (this.value) {
                        case TC.Consts.geom.POLYLINE:
                            //modo línea
                            self.lineFInfoCtrl.activate();
                            self.lastCtrlActive = self.lineFInfoCtrl;
                            break;
                        case TC.Consts.geom.POLYGON:
                            //modo poligono
                            self.polygonFInfoCtrl.activate();
                            self.lastCtrlActive = self.polygonFInfoCtrl;
                            break;
                        default:
                            //modo point
                            self.fInfoCtrl.activate();
                            self.lastCtrlActive = self.fInfoCtrl;
                            break;
                    }
                };
                self.div.querySelectorAll('input[type=radio]').forEach(function (input) {
                    input.addEventListener('change', changeEvent);
                });

                if (TC.Util.isFunction(callback)) {
                    callback();
                }
            });
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
        if (self.map) {
            const enabled = self.map.workLayers.some(l => l.type === TC.Consts.layerType.WMS && l.getVisibility());
            self.div.querySelectorAll('input').forEach(function (input) {
                input.disabled = !enabled;
            });
            if (self.fInfoCtrl) {
                const input = self.div.querySelector(`input[value=${TC.Consts.geom.POINT}]`);
                if (input) {
                    input.checked = self.fInfoCtrl.isActive;
                }
            }
            if (self.lineFInfoCtrl) {
                const input = self.div.querySelector(`input[value=${TC.Consts.geom.POLYLINE}]`);
                if (input) {
                    input.checked = self.lineFInfoCtrl.isActive;
                }
            }
            if (self.polygonFInfoCtrl) {
                const input = self.div.querySelector(`input[value=${TC.Consts.geom.POLYGON}]`);
                if (input) {
                    input.checked = self.polygonFInfoCtrl.isActive;
                }
            }
            // Hack para compensar bug de Edge: no se actualiza el estilo al cambiar el estado del radio.
            const displayValue = self.div.style.display;
            self.div.style.display = 'none';
            if (displayValue) {
                self.div.style.display = displayValue;
            }
            else {
                self.div.style.removeProperty('display');
            }
        }
    };

})();
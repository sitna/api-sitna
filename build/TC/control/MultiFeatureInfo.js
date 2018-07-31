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


    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);
        map.loaded(function () {
            var ctlDeferreds = [];
            if (self.modes[TC.Consts.geom.POINT]) {
                var finfoDeferred = $.Deferred();
                ctlDeferreds.push(finfoDeferred);
                $.when(map.addControl("featureInfo", { displayMode: self.options.displayMode })).then(function (control) {
                    self.fInfoCtrl = control;
                    finfoDeferred.resolve();
                });
            }
            if (self.modes[TC.Consts.geom.POLYLINE]) {
                var lfinfoDeferred = $.Deferred();
                ctlDeferreds.push(lfinfoDeferred);
                $.when(map.addControl("lineFeatureInfo", { displayMode: self.options.displayMode, lineColor: self.lineColor })).then(function (control) {
                    self.lineFInfoCtrl = control;
                    lfinfoDeferred.resolve();
                });
            }
            if (self.modes[TC.Consts.geom.POLYGON]) {
                var pfinfoDeferred = $.Deferred();
                ctlDeferreds.push(pfinfoDeferred);
                $.when(map.addControl("polygonFeatureInfo", { displayMode: self.options.displayMode, lineColor: self.lineColor })).then(function (control) {
                    self.polygonFInfoCtrl = control;
                    pfinfoDeferred.resolve();
                });
            }
            $.when.apply(this, ctlDeferreds).then(function () {
                if (self.fInfoCtrl) {
                    self.fInfoCtrl.activate();
                    self.lastCtrlActive = self.fInfoCtrl;
                }
            });
        });
    };

    ctlProto.render = function (callback) {
        var self = this;
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
        TC.Control.prototype.renderData.call(self, renderData,
            function () {
                var changeEvent = function () {
                    switch (this.value) {
                        case TC.Consts.geom.POLYLINE:
                            //modo línea
                            console.log("seleccion por línea");
                            if (self.map.activeControl === self.fInfoCtrl || self.map.activeControl === self.polygonFInfoCtrl)
                                self.lineFInfoCtrl.activate();
                            self.lastCtrlActive = self.lineFInfoCtrl;
                            break;
                        case TC.Consts.geom.POLYGON:
                            //modo poligono
                            console.log("seleccion por polígono");
                            if (self.map.activeControl === self.fInfoCtrl || self.map.activeControl === self.lineFInfoCtrl)
                                self.polygonFInfoCtrl.activate();
                            self.lastCtrlActive = self.polygonFInfoCtrl;
                            break;
                        default:
                            //modo point
                            console.log("seleccion por punto");
                            if (self.map.activeControl === self.polygonFInfoCtrl || self.map.activeControl === self.lineFInfoCtrl)
                                self.fInfoCtrl.activate();
                            self.lastCtrlActive = self.fInfoCtrl;
                            break;
                    }
                };
                self._$div.find('input[type=radio]').on('change', changeEvent);

                if ($.isFunction(callback)) {
                    callback();
                }
            });
    };
    ctlProto.activate = function () {
        var self = this;
        if (self.lastCtrlActive)
            self.lastCtrlActive.activate();
    }
    ctlProto.deactivate = function () {
        var self = this;
        self.lastCtrlActive.deactivate(false);
    }


    TC.Map.prototype.getDefaultControl = function () {
        var candidate = this.getControlsByClass("TC.control.MultiFeatureInfo");
        if (candidate && candidate.length)
            return candidate[0].lastCtrlActive;
        else {
            candidate = this.getControlsByClass("TC.control.FeatureInfo");
            if (candidate && candidate.length)
                return candidate[0];
            else
                return null;
        }
    };

})();
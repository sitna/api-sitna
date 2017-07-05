TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}
if (!TC.Feature || !TC.feature.Point) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Point');
}
if (!TC.Feature || !TC.feature.Polyline) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Polyline');
}
if (!TC.Feature || !TC.feature.Polygon) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Polygon');
}

TC.Consts.event.DRAWSTART = 'drawstart.tc';
TC.Consts.event.DRAWEND = 'drawend.tc';
TC.Consts.event.DRAWCANCEL = 'drawcancel.tc';
TC.Consts.event.MEASURE = 'measure.tc';
TC.Consts.event.MEASUREPARTIAL = 'measurepartial.tc';

(function () {

    TC.control.Draw = function () {
        var self = this;

        TC.Control.apply(self, arguments);

        self._classSelector = '.' + self.CLASS;

        self._pointClass = self.CLASS + '-point';
        self._lineClass = self.CLASS + '-line';
        self._polygonClass = self.CLASS + '-polygon';

        self.history = [];
        self.historyIndex = 0;
        this.renderPromise().then(function () {
            self.reset = true;
            self.callBack = null;
            self.measure = false;
            self._cancelClick = false;

            self.mode = self.options.mode || TC.Consts.geom.POLYLINE;

            if (self.options.measure)
                self.measure = self.options.measure
            if ($.isFunction(self.options.callback))
                self.callBack = self.options.callback;


            self.wrap = new TC.wrap.control.Draw(self);

            self._$newBtn = self._$div.find(self._classSelector + '-btn-new').on(TC.Consts.event.CLICK, function () {
                self.new();
            });

            self._$cancelBtn = self._$div.find(self._classSelector + '-btn-cancel').on(TC.Consts.event.CLICK, function () {
                self.cancel();
            });

            self._$endBtn = self._$div.find(self._classSelector + '-btn-end').on(TC.Consts.event.CLICK, function () {
                self.end();
            });

            self._$undoBtn = self._$div.find(self._classSelector + '-btn-undo').on(TC.Consts.event.CLICK, function () {
                self.undo();
            });

            self._$redoBtn = self._$div.find(self._classSelector + '-btn-redo').on(TC.Consts.event.CLICK, function () {
                self.redo();
            });

            self.$events.on(TC.Consts.event.MEASURE, function (e) {
                self.resetValues();
            });
            self.$events.on(TC.Consts.event.POINT, function (e) {
                if (self.layer && self.layer.features && self.layer.features.length > 0) {
                    self.layer.clearFeatures();
                    self.resetValues();
                }                

                self.history.length = self.historyIndex;
                self.history[self.historyIndex++] = e.point;                

                setDrawState(self);
            });
            self.$events.on(TC.Consts.event.DRAWEND, function (e) {
                setFeatureAddReadyState(self);
                if (self.callBack) {
                    self.callBack(e.geometry);
                }
            });

        });
    };

    TC.inherit(TC.control.Draw, TC.Control);

    var ctlProto = TC.control.Draw.prototype;

    ctlProto.CLASS = 'tc-ctl-draw';

    var setDrawState = function (ctl) {
        ctl._$endBtn.prop('disabled',
            ctl.historyIndex === 0 ||
            (ctl.mode === TC.Consts.geom.POLYGON && ctl.historyIndex < 3) ||
            (ctl.mode === TC.Consts.geom.POLYLINE && ctl.historyIndex < 2));
        ctl._$redoBtn.prop('disabled', ctl.history.length === ctl.historyIndex);
        ctl._$undoBtn.prop('disabled', ctl.historyIndex === 0);
    };

    var setFeatureAddReadyState = function (ctl) {
        ctl.resetValues();
        ctl._$endBtn.prop('disabled', true);
        ctl._$cancelBtn.prop('disabled', false);
    };

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/Draw.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w(" <button class=\"tc-ctl-btn tc-ctl-draw-btn-new\" title=\"").f(ctx.get(["tooltip"], false), ctx, "h").w("\">").h("i18n", ctx, {}, { "$key": "new" }).w("</button><button class=\"tc-ctl-btn tc-ctl-draw-btn-undo\" disabled title=\"").h("i18n", ctx, {}, { "$key": "undo" }).w("\">").h("i18n", ctx, {}, { "$key": "undo" }).w("</button><button class=\"tc-ctl-btn tc-ctl-draw-btn-redo\" disabled title=\"").h("i18n", ctx, {}, { "$key": "redo" }).w("\">").h("i18n", ctx, {}, { "$key": "redo" }).w("</button><button class=\"tc-ctl-btn tc-ctl-draw-btn-end\" title=\"").h("i18n", ctx, {}, { "$key": "end" }).w("\">").h("i18n", ctx, {}, { "$key": "end" }).w("</button><button class=\"tc-ctl-btn tc-ctl-draw-btn-cancel\" title=\"").h("i18n", ctx, {}, { "$key": "cancel" }).w("\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</button> "); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.render = function (callback) {
        var self = this;
        var strToolTip;
        switch (self.options.mode) {
            case TC.Consts.geom.POLYLINE:
            case TC.Consts.geom.MULTIPOLYLINE:
                strToolTip = self.getLocaleString('drawLine');
                self._$div.addClass(self._lineClass);
                break;
            case TC.Consts.geom.POLYGON:
            case TC.Consts.geom.MULTIPOLYGON:
                strToolTip = self.getLocaleString('drawPolygon');
                self._$div.addClass(self._polygonClass);
                break;
            case TC.Consts.geom.POINT:
            case TC.Consts.geom.MULTIPOINT:
                strToolTip = self.getLocaleString('draw');
                self._$div.addClass(self._pointClass);
                break;
            default:
                strToolTip = self.getLocaleString('draw');
                break;
        }
        self.renderData({ tooltip: strToolTip }, function () {
            if ($.isFunction(callback)) {
                callback();
            }
        });
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);
        map.loaded(function () {
            if (self.options.layer) {
                self.setLayer(self.options.layer);
            }
            else {
                // Si self.options.layer === false se instancia el control sin capa asociada
                if (typeof self.options.layer !== 'boolean') {
                    map.loaded(function () {
                        self.layerPromise = map.addLayer({
                            id: TC.getUID(),
                            title: 'DrawControl',
                            stealth: true,
                            type: TC.Consts.layerType.VECTOR,
                            styles: {
                                point: $.extend({}, map.options.styles.point, { fillOpacity: 0 }),
                                line: map.options.styles.line,
                                polygon: map.options.styles.polygon
                            }
                        });

                        $.when(self.layerPromise).then(function (layer) {
                            self.layer = layer;
                            map.putLayerOnTop(self.layer);
                        });
                    });
                }
            }
        });
    };

    ctlProto.new = function () {
        var self = this;
        if (self.layer) {
            self.layer.clearFeatures();
        }
        self.setMode(self.mode, true);
    };

    ctlProto.undo = function () {
        var self = this;
        var result = self.wrap.undo();
        if (result) {
            self.historyIndex--;
            setDrawState(self);

            if (self.historyIndex <= 0) {
                self.resetValues();
            }
        }

        return result;
    };

    ctlProto.redo = function () {
        var self = this;
        var result = this.wrap.redo();
        if (result) {
            self.historyIndex++;
            setDrawState(self);
        }
        return result;
    };

    ctlProto.cancel = function () {
        var self = this;
        self._cancelClick = true;
        this.setMode(null, false);
        self.resetValues();
        setFeatureAddReadyState(self);
        self.$events.trigger($.Event(TC.Consts.event.DRAWCANCEL, { ctrl: self }));
    };

    ctlProto.activate = function () {
        var self = this;
        self._$newBtn.addClass(TC.Consts.classes.ACTIVE);
        TC.Control.prototype.activate.call(self);
        self.wrap.activate(self.mode);
        self._$div
            .removeClass(self._pointClass)
            .removeClass(self._lineClass)
            .removeClass(self._polygonClass);
        switch (self.mode) {
            case TC.Consts.geom.POINT:
                self._$div.addClass(self._pointClass);
                break;
            case TC.Consts.geom.POLYLINE:
                self._$div.addClass(self._lineClass);
                break;
            case TC.Consts.geom.POLYGON:
                self._$div.addClass(self._polygonClass);
                break;
            default:
                break;
        }

    };

    ctlProto.deactivate = function () {
        var self = this;
        if (self._$newBtn) {
            self._$newBtn.removeClass(TC.Consts.classes.ACTIVE);
        }
        TC.Control.prototype.deactivate.call(self, !self._cancelClick);
        if (self.wrap) {
            self.wrap.deactivate();
        }
        self.resetValues();
        //self.$events.trigger($.Event(TC.Consts.event.DRAWCANCEL, { ctrl: self }));
        self._cancelClick = false;
    };

    ctlProto.isExclusive = function () {
        return true;
    };

    ctlProto.end = function () {
        var self = this;
        self.wrap.end();
        self.resetValues();
    };

    ctlProto.setMode = function (mode, activate) {
        var self = this;

        if (mode)
            self.mode = mode;

        if (activate && mode) {
            if (self.layer) {
                self.layer.map.putLayerOnTop(self.layer);
            }
            self.activate();
        }
        else {
            self.deactivate();
        }

        var event = activate ? TC.Consts.event.CONTROLACTIVATE : TC.Consts.event.CONTROLDEACTIVATE;
        if (self.map) {
            self.map.$events.trigger($.Event(event, { control: self }));
        }
    };

    ctlProto.getLayer = function () {
        var self = this;
        // Se ha instanciado un control sin capa asociada
        if (self.options && typeof self.options.layer === 'boolean' && !self.options.layer) {
            return null;
        }
        return self.layer ? self.layer : self.layerPromise;
    };

    ctlProto.setLayer = function (layer) {
        var self = this;
        if (self.map) {
            if (typeof (layer) === "string") {
                self.layer = self.map.getLayer(layer);
            }
            else {
                self.layer = layer;
            }
        }
    };

    ctlProto.resetValues = function () {
        var self = this;
        self.history.length = 0;
        self.historyIndex = 0;
        setDrawState(self);
    };

})();
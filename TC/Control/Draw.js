TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}
if (!TC.Feature || !TC.feature.Polyline) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Polyline.js');
}
if (!TC.Feature || !TC.feature.Polygon) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Polygon.js');
}

TC.Consts.event.DRAWEND = 'drawend.tc';
TC.Consts.event.DRAWCANCEL = 'drawcancel.tc';

TC.control.Draw = function () {
    var self = this;

    TC.Control.apply(self, arguments);
    this.renderPromise().then(function () {
        self.history = [];
        self.historyIndex = 0;
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

        self._$newBtn = self._$div.find('.tc-ctl-draw-btn-new').on(TC.Consts.event.CLICK, function () {
            self.new();
        });

        self._$cancelBtn = self._$div.find('.tc-ctl-draw-btn-cancel').on(TC.Consts.event.CLICK, function () {
            self.cancel();
        });

        self._$endBtn = self._$div.find('.tc-ctl-draw-btn-end').on(TC.Consts.event.CLICK, function () {
            if (!$(this).hasClass(TC.Consts.classes.DISABLED)) {
                self.end();
            }
        });

        self._$undoBtn = self._$div.find('.tc-ctl-draw-btn-undo').on(TC.Consts.event.CLICK, function () {
            if (!$(this).hasClass(TC.Consts.classes.DISABLED)) {
                self.undo();
            }
        });

        self._$redoBtn = self._$div.find('.tc-ctl-draw-btn-redo').on(TC.Consts.event.CLICK, function () {
            if (!$(this).hasClass(TC.Consts.classes.DISABLED)) {
                self.redo();
            }
        });

        self.$events.on(TC.Consts.event.MEASURE + ' ' + TC.Consts.event.MEASUREPARTIAL, function (e) {

        }).on(TC.Consts.event.MEASURE, function (e) {
            self.historyIndex = 0;
            self.history.length = self.historyIndex;
            self._$undoBtn.addClass(TC.Consts.classes.DISABLED);
            self._$redoBtn.addClass(TC.Consts.classes.DISABLED);
        });
        self.$events.on(TC.Consts.event.POINT, function (e) {
            if (self.layer.features && self.layer.features.length > 0) {
                self.layer.clearFeatures();
                self.resetValues();
            }
            self.history.length = self.historyIndex;
            self.history[self.historyIndex++] = e.point;
            self._$undoBtn.toggleClass(TC.Consts.classes.DISABLED, self.historyIndex <= 0);
            self._$redoBtn.addClass(TC.Consts.classes.DISABLED);
            self._$endBtn.removeClass(TC.Consts.classes.DISABLED);
        });
        self.$events.on(TC.Consts.event.DRAWEND, function (e) {
            self.historyIndex = 0;
            self.history.length = self.historyIndex;
            self._$undoBtn.addClass(TC.Consts.classes.DISABLED);
            self._$redoBtn.addClass(TC.Consts.classes.DISABLED);
            if (self.callBack)
                self.callBack(e.geometry);
        });

    });
};

TC.inherit(TC.control.Draw, TC.Control);

(function () {
    var ctlProto = TC.control.Draw.prototype;

    ctlProto.CLASS = 'tc-ctl-draw';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/Draw.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w(" <a class=\"tc-ctl-btn tc-ctl-draw-btn-new\" title=\"").f(ctx.get(["tooltip"], false), ctx, "h").w("\">").h("i18n", ctx, {}, { "$key": "new" }).w("</a><a class=\"tc-ctl-btn tc-ctl-draw-btn-undo tc-disabled\" title=\"").h("i18n", ctx, {}, { "$key": "undo" }).w("\">").h("i18n", ctx, {}, { "$key": "undo" }).w("</a><a class=\"tc-ctl-btn tc-ctl-draw-btn-redo tc-disabled\" title=\"").h("i18n", ctx, {}, { "$key": "redo" }).w("\">").h("i18n", ctx, {}, { "$key": "redo" }).w("</a><a class=\"tc-ctl-btn tc-ctl-draw-btn-end\" title=\"").h("i18n", ctx, {}, { "$key": "end" }).w("\">").h("i18n", ctx, {}, { "$key": "end" }).w("</a><a class=\"tc-ctl-btn tc-ctl-draw-btn-cancel\" title=\"").h("i18n", ctx, {}, { "$key": "cancel" }).w("\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</a> "); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.render = function (callback) {
        var self = this;
        var strToolTip;
        switch (self.options.mode) {
            case TC.Consts.geom.POLYLINE:
                strToolTip = self.getLocaleString('drawLine');
                break;
            case TC.Consts.geom.POLYGON:
                strToolTip = self.getLocaleString('drawPolygon');
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
                if (typeof (self.options.layer) === "string") {

                }
                else
                    self.layer = self.options.layer;
            }
            else {
                var map = self.map;
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
                        self.layer.map.putLayerOnTop(self.layer);
                    });
                });
            }
        });
    };

    ctlProto.new = function () {
        var self = this;
        self.layer.clearFeatures();
        self.setMode(self.mode, true);
    };

    ctlProto.undo = function () {
        var self = this;
        var result = this.wrap.undo();
        if (result) {
            self.historyIndex--;
            self._$redoBtn.removeClass(TC.Consts.classes.DISABLED);

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
            self._$undoBtn.removeClass(TC.Consts.classes.DISABLED);
        }
        self._$redoBtn.toggleClass(TC.Consts.classes.DISABLED, self.historyIndex >= self.history.length);
        return result;
    };

    ctlProto.cancel = function () {
        var self = this;
        self._cancelClick = true;
        this.setMode(null, false);
        self.resetValues();
        self.$events.trigger($.Event(TC.Consts.event.DRAWCANCEL, { ctrl: self }));
    };

    ctlProto.activate = function () {
        var self = this;
        self._$newBtn.addClass(TC.Consts.classes.ACTIVE);
        TC.Control.prototype.activate.call(self);
        self.wrap.activate(self.mode);
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
        self.$events.trigger($.Event(TC.Consts.event.DRAWCANCEL, { ctrl: self }));
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
            self.layer.map.putLayerOnTop(self.layer);
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
        return self.layer ? self.layer : self.layerPromise;
    };

    ctlProto.resetValues = function () {
        var self = this;
        self._$undoBtn.addClass(TC.Consts.classes.DISABLED);
        self._$redoBtn.addClass(TC.Consts.classes.DISABLED);
    };

})();
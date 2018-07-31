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
TC.Consts.event.DRAWUNDO = 'drawundo.tc';
TC.Consts.event.DRAWREDO = 'drawredo.tc';
TC.Consts.event.MEASURE = 'measure.tc';
TC.Consts.event.MEASUREPARTIAL = 'measurepartial.tc';
TC.Consts.event.STYLECHANGE = 'stylechange.tc';
TC.Consts.event.CHANGE = 'change.tc';

(function () {

    const formatColor = function (color) {
        const match = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
        if (match && match.length) {
            return '#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3];
        }
        return color;
    };

    TC.control.Draw = function () {
        var self = this;

        TC.Control.apply(self, arguments);

        self._classSelector = '.' + self.CLASS;

        self._pointClass = self.CLASS + '-point';
        self._lineClass = self.CLASS + '-line';
        self._polygonClass = self.CLASS + '-polygon';

        self.history = [];
        self.historyIndex = 0;
        self.exportsState = true;

        self.$events.on(TC.Consts.event.DRAWSTART, function (e) {
            self.resetValues();
        });
        self.$events.on(TC.Consts.event.POINT, function (e) {
            if (self.layer && !self.persistent && self.layer.features && self.layer.features.length > 0) {
                self.layer.clearFeatures();
            }

            self.history.length = self.historyIndex;
            self.history[self.historyIndex++] = e.point;

            setDrawState(self);
        });
        self.$events.on(TC.Consts.event.DRAWEND, function (e) {
            setFeatureAddReadyState(self);

            if (self.callBack) {
                self.callBack(e.feature);
            }
        });

        self.layerPromise = $.Deferred();

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
            if (self.options.persistent === undefined) {
                self.persistent = true;
            }
            else {
                self.persistent = self.options.persistent;
            }

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

            if (self.options.styleTools) {
                self._$strokeColorPicker = self._$div.find(self._classSelector + '-str-c').on(TC.Consts.event.CHANGE, function (e) {
                    self.setStrokeColor(e.target.value);
                });

                self._$strokeWidthSelector = self._$div.find(self._classSelector + '-str-w').on(TC.Consts.event.CHANGE, function (e) {
                    self.setStrokeWidth(e.target.value);
                });
                self._$strokeWidthWatch = self._$div.find(self._classSelector + '-str-w-watch');
            }
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
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-draw-tools\"><button class=\"tc-ctl-btn tc-ctl-draw-btn-new\" title=\"").f(ctx.get(["tooltip"], false), ctx, "h").w("\">").h("i18n", ctx, {}, { "$key": "new" }).w("</button><button class=\"tc-ctl-btn tc-ctl-draw-btn-undo\" disabled title=\"").h("i18n", ctx, {}, { "$key": "undo" }).w("\">").h("i18n", ctx, {}, { "$key": "undo" }).w("</button><button class=\"tc-ctl-btn tc-ctl-draw-btn-redo\" disabled title=\"").h("i18n", ctx, {}, { "$key": "redo" }).w("\">").h("i18n", ctx, {}, { "$key": "redo" }).w("</button><button class=\"tc-ctl-btn tc-ctl-draw-btn-end\" disabled title=\"").h("i18n", ctx, {}, { "$key": "end" }).w("\">").h("i18n", ctx, {}, { "$key": "end" }).w("</button><button class=\"tc-ctl-btn tc-ctl-draw-btn-cancel\" title=\"").h("i18n", ctx, {}, { "$key": "cancel" }).w("\">").h("i18n", ctx, {}, { "$key": "cancel" }).w("</button></div>").x(ctx.get(["styleTools"], false), ctx, { "block": body_1 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<div class=\"tc-ctl-draw-style\">").h("i18n", ctx, {}, { "$key": "strokeColor" }).w("<input type=\"color\" class=\"tc-ctl-col tc-ctl-draw-str-c\" value=\"").f(ctx.get(["strokeColor"], false), ctx, "h").w("\" title=\"").h("i18n", ctx, {}, { "$key": "selectColor" }).w("\" />").h("i18n", ctx, {}, { "$key": "strokeWidth" }).w("<div class=\"tc-ctl-draw-str-w-watch\" style=\"border-bottom-width:").f(ctx.get(["strokeWidth"], false), ctx, "h").w("px;\"> </div><input type=\"number\" class=\"tc-ctl-draw-str-w tc-textbox\" value=\"").f(ctx.get(["strokeWidth"], false), ctx, "h").w("\" min=\"1\" max=\"15\" /></div>"); } body_1.__dustBody = !0; return body_0 };
    }

    ctlProto.render = function (callback) {
        var self = this;
        var strToolTip;
        var strokeColor;
        var strokeWidth;
        switch (self.options.mode) {
            case TC.Consts.geom.POLYLINE:
            case TC.Consts.geom.MULTIPOLYLINE:
                strToolTip = self.getLocaleString('drawLine');
                self._$div.addClass(self._lineClass);
                strokeColor = TC.Cfg.styles.line.strokeColor;
                strokeWidth = TC.Cfg.styles.line.strokeWidth;
                break;
            case TC.Consts.geom.POLYGON:
            case TC.Consts.geom.MULTIPOLYGON:
                strToolTip = self.getLocaleString('drawPolygon');
                self._$div.addClass(self._polygonClass);
                strokeColor = TC.Cfg.styles.polygon.strokeColor;
                strokeWidth = TC.Cfg.styles.polygon.strokeWidth;
                break;
            case TC.Consts.geom.POINT:
            case TC.Consts.geom.MULTIPOINT:
                strToolTip = self.getLocaleString('drawPoint');
                self._$div.addClass(self._pointClass);
                strokeColor = TC.Cfg.styles.point.strokeColor;
                strokeWidth = TC.Cfg.styles.point.strokeWidth;
                break;
            default:
                strToolTip = self.getLocaleString('draw');
                strokeColor = TC.Cfg.styles.line.strokeColor;
                strokeWidth = TC.Cfg.styles.line.strokeWidth;
                break;
        }
        const renderObject = {
            tooltip: strToolTip,
            strokeColor: formatColor(strokeColor),
            strokeWidth: strokeWidth,
            styleTools: self.options.styleTools
        };
        self.renderData(renderObject, function () {
            if (Modernizr.inputtypes.color) {
                if ($.isFunction(callback)) {
                    callback();
                }
            }
            else {
                // El navegador no soporta input[type=color], cargamos polyfill
                TC.loadJS(
                    !$.fn.spectrum,
                    TC.apiLocation + 'lib/spectrum/spectrum.min.js',
                    function () {
                        TC.loadCSS(TC.apiLocation + 'lib/spectrum/spectrum.css');
                        self._$div.find('input[type=color]').spectrum({
                            preferredFormat: 'hex',
                            showPalette: true,
                            palette: [],
                            selectionPalette: [],
                            cancelText: self.getLocaleString('cancel'),
                            chooseText: self.getLocaleString('ok'),
                            replacerClassName: self.CLASS + '-str-c'
                        });
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    }
                );
            }
        });
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        const setStyles = function () {
            self.styles = {};
            $.extend(true, self.styles, self.options.styles || self.layer.options.styles);
        };

        map.loaded(function () {
            if (self.options.layer) {
                self.setLayer(self.options.layer);
                setStyles();
            }
            else {
                // Si self.options.layer === false se instancia el control sin capa asociada
                if (typeof self.options.layer !== 'boolean') {
                    map.addLayer({
                        id: self.getUID(),
                        title: 'DrawControl',
                        stealth: true,
                        type: TC.Consts.layerType.VECTOR,
                        styles: {
                            point: map.options.styles.point,
                            line: map.options.styles.line,
                            polygon: map.options.styles.polygon
                        }
                    }).then(function (layer) {
                        self.layer = layer;
                        setStyles();
                        map.putLayerOnTop(self.layer);
                        self.layerPromise.resolve(layer);
                    });
                }
            }
        });
    };

    ctlProto.new = function () {
        var self = this;
        if (self.layer && !self.persistent) {
            self.layer.clearFeatures();
        }
        self._$cancelBtn.prop('disabled', false);
        self.setMode(self.mode, true);
        return self;
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
            self.$events.trigger($.Event(TC.Consts.event.DRAWUNDO));
        }

        return result;
    };

    ctlProto.redo = function () {
        var self = this;
        var result = this.wrap.redo();
        if (result) {
            self.historyIndex++;
            setDrawState(self);
            self.$events.trigger($.Event(TC.Consts.event.DRAWREDO));
        }
        return result;
    };

    ctlProto.cancel = function () {
        var self = this;
        self._cancelClick = true;
        this.setMode(null, false);
        self.resetValues();
        setFeatureAddReadyState(self);
        self._$cancelBtn.prop('disabled', true);
        self.$events.trigger($.Event(TC.Consts.event.DRAWCANCEL, { ctrl: self }));
        return self;
    };

    ctlProto.activate = function () {
        var self = this;
        self._$newBtn.addClass(TC.Consts.classes.ACTIVE);
        self._$cancelBtn.prop('disabled', false);
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
        if (self._$cancelBtn) {
            self._$cancelBtn.prop('disabled', true);
        }
        TC.Control.prototype.deactivate.call(self, !self._cancelClick);
        if (self.wrap) {
            self.wrap.deactivate();
        }
        self.resetValues();
        //self.$events.trigger($.Event(TC.Consts.event.DRAWCANCEL, { ctrl: self }));
        self._cancelClick = false;
    };

    ctlProto.clear = function () {
        const self = this;
        if (self.layer) {
            self.layer.clearFatures();
        }
        self.resetValues();
        return self;
    };

    ctlProto.isExclusive = function () {
        return true;
    };

    ctlProto.end = function () {
        const self = this;
        self.wrap.end();
        self.resetValues();
        return self;
    };

    ctlProto.setMode = function (mode, activate) {
        const self = this;

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
        return self;
    };

    ctlProto.setStyle = function (style) {
        const self = this;
        if (style) {
            $.extend(self.style, style);
        }
        else {
            switch (self.options.mode) {
                case TC.Consts.geom.POLYLINE:
                case TC.Consts.geom.MULTIPOLYLINE:
                    style = { line: self.styles.line };
                    break;
                case TC.Consts.geom.POLYGON:
                case TC.Consts.geom.MULTIPOLYGON:
                    style = { polygon: self.styles.polygon };
                    break;
                case TC.Consts.geom.POINT:
                case TC.Consts.geom.MULTIPOINT:
                    style = { point: self.styles.point };
                    break;
                default:
                    style = {};
                    break;
            }
        }
        if (self.isActive) {
            self.wrap.setStyle(style);
        }
    };

    ctlProto.getModeStyle = function(mode) {
        const self = this;
        mode = mode || self.options.mode;
        switch (mode) {
            case TC.Consts.geom.POLYLINE:
            case TC.Consts.geom.MULTIPOLYLINE:
                return self.styles.line;
            case TC.Consts.geom.POLYGON:
            case TC.Consts.geom.MULTIPOLYGON:
                return self.styles.polygon;
            case TC.Consts.geom.POINT:
            case TC.Consts.geom.MULTIPOINT:
                return self.styles.point;
            default:
                return null;
                break;
        }
    };

    ctlProto.setStrokeColorWatch = function (color) {
        const self = this;
        if (self.options.styleTools) {
            if (color === undefined) {
                color = self.getModeStyle().strokeColor;
            }
            const match = color.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
            if (match && match.length) {
                color = '#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3];
            }
            self._$strokeColorPicker.val(color);
            if (!Modernizr.inputtypes.color) {
                self._$strokeColorPicker.spectrum('set', color);
            }
        }
        return self;
    };

    ctlProto.setStrokeColor = function (color) {
        const self = this;
        const style = self.getModeStyle();
        if (style) {
            style.strokeColor = color;
        }

        // Resetea el estilo
        if (self.isActive) {
            self.setStyle();
        }

        self.setStrokeColorWatch(color);
        self.$events.trigger($.Event(TC.Consts.event.STYLECHANGE, { property: 'strokeColor', value: color }));
        return self;
    };

    ctlProto.setStrokeWidthWatch = function (width) {
        const self = this;
        if (self.options.styleTools) {
            if (width === undefined) {
                width = self.getModeStyle().strokeWidth;
            }
            width = parseInt(width, 10);
            if (width !== Number.NaN) {
                self._$strokeWidthSelector.val(width);
                self._$strokeWidthWatch.css('border-bottom-width', width + 'px');
            }
        }
        return self;
    };

    ctlProto.setStrokeWidth = function(width) {
        const self = this;
        width = parseInt(width, 10);
        if (width !== Number.NaN) {
            const style = self.getModeStyle();
            if (style) {
                style.strokeWidth = width;
            }

            // Resetea el estilo
            if (self.isActive) {
                self.setStyle();
            }

            self.setStrokeWidthWatch(width);
            self.$events.trigger($.Event(TC.Consts.event.STYLECHANGE, { property: 'strokeWidth', value: width }));
        }
        return self;
    };

    ctlProto.getLayer = function() {
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
            self.layerPromise.resolve(self.layer);
        }
    };

    ctlProto.resetValues = function () {
        const self = this;
        self.history.length = 0;
        self.historyIndex = 0;
        setDrawState(self);
        return self;
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState) {
            return {
                id: self.id,
                layer: self.layer.exportState()
            };
        }
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        $.when(self.getLayer()).then(function (layer) {
            layer.importState(state.layer);
        });
    };
})();
TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.Consts.event.POINT = 'point.tc';

TC.control.Measure = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    self.drawControls = [];
    self.persistentDrawControls = false;
    self.NOMEASURE = '-';

    this.renderPromise().then(function () {
        self.measureMode = self.options.mode;

        self.history = [];
        self.historyIndex = 0;
        self.reset = true;

        self.wrap = new TC.wrap.control.Measure(self);

        self._$len = self._$div.find('.tc-ctl-meas-val-len');
        self._$area = self._$div.find('.tc-ctl-meas-val-area');
        self._$peri = self._$div.find('.tc-ctl-meas-val-peri');

        self.setMode(self.options.mode);
    });
};

TC.inherit(TC.control.Measure, TC.Control);

(function () {
    var ctlProto = TC.control.Measure.prototype;

    ctlProto.CLASS = 'tc-ctl-meas';

    if (TC.isDebug)
        ctlProto.template = TC.apiLocation + "TC/templates/Measure.html";
    else
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "measure" }).w("</h2><div class=\"tc-ctl-meas-select\"><form><label class=\"tc-ctl-meas-btn-len\"><input type=\"radio\" name=\"mode\" value=\"polyline\" /><span>").h("i18n", ctx, {}, { "$key": "length" }).w("</span></label><label class=\"tc-ctl-meas-btn-area\"><input type=\"radio\" name=\"mode\" value=\"polygon\" /><span>").h("i18n", ctx, {}, { "$key": "areaAndPerimeter" }).w("</span></label></form></div><div class=\"tc-ctl-meas-mode tc-ctl-meas-len tc-hidden\"><div class=\"tc-ctl-meas-line\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "length" }).w(": <span class=\"tc-ctl-meas-val-len\"></span></div></div><div class=\"tc-ctl-meas-mode tc-ctl-meas-area tc-hidden\"><div class=\"tc-ctl-meas-polygon\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "area" }).w(": <span class=\"tc-ctl-meas-val-area\"></span>, ").h("i18n", ctx, {}, { "$key": "perimeter" }).w(": <span class=\"tc-ctl-meas-val-peri\"></span></div></div>"); } body_0.__dustBody = !0; return body_0 };

    ctlProto.render = function (callback) {
        var self = this;
        TC.Control.prototype.render.call(self, function () {
            TC.loadJS(
                !TC.control.Draw,
                TC.apiLocation + 'TC/control/Draw',
                function () {
                    if (self.options.mode) {
                        self._$div.find('.tc-ctl-meas-select').addClass(TC.Consts.classes.HIDDEN);
                    }

                    self._$div.find('span').on(TC.Consts.event.CLICK, function (e) {
                        var $cb = $(this).closest('label').find('input[type=radio][name=mode]');
                        var newMode = $cb.val();

                        $cb.prop("checked", true);
                        self.setMode(newMode, true);
                    });

                    if ($.isFunction(callback)) {
                        callback();
                    }
                });
        });
    };

    ctlProto.register = function (map) {
        const self = this;
        TC.Control.prototype.register.call(self, map);

        const layerId = self.getUID();
        const drawLinesId = self.getUID();
        const drawPolygonsId = self.getUID();

        self.layerPromise = map.addLayer({
            id: layerId,
            title: self.getLocaleString('measure'),
            stealth: true,
            type: TC.Consts.layerType.VECTOR,
            styles: {
                point: map.options.styles.point,
                line: map.options.styles.line,
                polygon: map.options.styles.polygon
            }
        });

        $.when(self.layerPromise, self.renderPromise()).then(function (layer) {

            self.layer = layer;
            self.layer.map.putLayerOnTop(self.layer);

            self._drawLinesPromise = map.addControl('draw', {
                id: drawLinesId,
                div: self._$div.find('.tc-ctl-meas-line'),
                mode: TC.Consts.geom.POLYLINE,
                measure: true,
                persistent: self.persistentDrawControls,
                styleTools: self.persistentDrawControls,
                layer: self.layer
            });
            self._drawPolygonsPromise = map.addControl('draw', {
                id: drawPolygonsId,
                div: self._$div.find('.tc-ctl-meas-polygon'),
                mode: TC.Consts.geom.POLYGON,
                measure: true,
                persistent: self.persistentDrawControls,
                styleTools: self.persistentDrawControls,
                layer: self.layer
            });

            $.when(self._drawLinesPromise, self._drawPolygonsPromise).then(function (drawLines, drawPolygons) {
                self.drawLines = drawLines;
                self.drawPolygons = drawPolygons;
                [drawLines, drawPolygons].forEach(function (ctl) {
                    ctl.containerControl = self;
                    self.drawControls.push(ctl);
                    ctl.$events
                        .on(TC.Consts.event.MEASURE + ' ' + TC.Consts.event.MEASUREPARTIAL, function (e) {
                            self.showMeasures(e);
                        })
                        .on(TC.Consts.event.DRAWCANCEL, function (e) {
                            self.cancel();
                        });
                    // Desactivamos el método exportState que ya se encarga el control padre de ello
                    ctl.exportsState = false;
                });

                self.setMode(self.options.mode);
            });
        });
    };

    ctlProto.displayMode = function (mode) {
        const self = this;

        const $modes = self._$div.find('.tc-ctl-meas-mode');
        var event;
        switch (mode) {
            case TC.Consts.geom.POLYLINE:
                self._$activeMode = $modes.filter('.tc-ctl-meas-len');
                break;
            case TC.Consts.geom.POLYGON:
                self._$activeMode = $modes.filter('.tc-ctl-meas-area');
                break;
            case null:
            case undefined:
                self._$activeMode = $();
                break;
            default:
                break;
        }

        const $hiddenModes = $modes.not(self._$activeMode);

        // Class TC.Consts.classes.CHECKED is for IE8 support
        var $radio;
        if (mode) {
            $radio = self._$div.find('input[type=radio][name=mode][value=' + mode + ']').prop('checked', true).addClass(TC.Consts.classes.CHECKED);
            $radio.next().addClass(TC.Consts.classes.CHECKED);
        }
        else {
            $radio = self._$div.find('input[type=radio][name=mode]').prop('checked', false).removeClass(TC.Consts.classes.CHECKED);
            $radio.next().removeClass(TC.Consts.classes.CHECKED);
        }
        self._$activeMode.removeClass(TC.Consts.classes.HIDDEN);
        self._$activeMode.find('.tc-ctl').removeClass(TC.Consts.classes.COLLAPSED);
        $hiddenModes.addClass(TC.Consts.classes.HIDDEN);
        return self;
    };

    ctlProto.setMode = function (mode) {
        const self = this;

        self.mode = mode;
        self.displayMode(mode);

        var event;
        switch (mode) {
            case TC.Consts.geom.POLYLINE:
                self.drawLines.activate();
                event = TC.Consts.event.CONTROLACTIVATE;
                break;
            case TC.Consts.geom.POLYGON:
                self.drawPolygons.activate();
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
            self.map.$events.trigger($.Event(event, { control: self }));
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
            if (area > 10000) {
                area = area / 1000000;
                units = 'km';
            }
            precision = units === 'm' ? 0 : 3;
            self._$area.html(TC.Util.formatNumber(area.toFixed(precision), locale) + ' ' + units + '&sup2;');
        }
        if (options.perimeter) {
            var perimeter = options.perimeter;
            if (perimeter > 1000) {
                perimeter = perimeter / 1000;
                units = 'km';
            }
            precision = units === 'm' ? 0 : 3;
            self._$peri.html(TC.Util.formatNumber(perimeter.toFixed(precision), locale) + ' ' + units);
        }
        if (options.length) {
            var length = options.length;
            if (length > 1000) {
                length = length / 1000;
                units = 'km';
            }
            precision = units === 'm' ? 0 : 3;
            self._$len.html(TC.Util.formatNumber(length.toFixed(precision), locale) + ' ' + units);
        }
        return self;
    };

    ctlProto.resetValues = function () {
        const self = this;
        if (self._$len) {
            self._$len.text(self.NOMEASURE);
            self._$area.text(self.NOMEASURE);
            self._$peri.text(self.NOMEASURE);
        }
        return self;
    };

    ctlProto.getDrawLines = function () {

    };

    ctlProto.exportState = function () {
        const self = this;
        return {
            id: self.id,
            layer: self.layer.exportState()
        };
    };

    ctlProto.importState = function (state) {
        const self = this;
        self.layerPromise.then(function (layer) {
            layer.importState(state.layer);
        });
    };

})();
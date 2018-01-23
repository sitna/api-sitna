TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.Consts.event.POINT = 'point.tc';

TC.control.Measure = function () {
    var self = this;

    TC.Control.apply(self, arguments);

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
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "measure" }).w("</h2><div class=\"tc-ctl-meas-select\"><form><label class=\"tc-ctl-meas-btn-len\"><input type=\"radio\" name=\"mode\" value=\"polyline\" /><span>").h("i18n", ctx, {}, { "$key": "length" }).w("</span></label><label class=\"tc-ctl-meas-btn-area\"><input type=\"radio\" name=\"mode\" value=\"polygon\" /><span>").h("i18n", ctx, {}, { "$key": "areaAndPerimeter" }).w("</span></label></form></div><div class=\"tc-ctl-meas-len tc-hidden\"><div class=\"tc-ctl-meas-lines\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "length" }).w(": <span class=\"tc-ctl-meas-val-len\"></span></div></div><div class=\"tc-ctl-meas-area tc-hidden\"><div class=\"tc-ctl-meas-polygon\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "area" }).w(": <span class=\"tc-ctl-meas-val-area\"></span>, ").h("i18n", ctx, {}, { "$key": "perimeter" }).w(": <span class=\"tc-ctl-meas-val-peri\"></span></div></div>"); } body_0.__dustBody = !0; return body_0 };

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
        var self = this;
        TC.Control.prototype.register.call(self, map);

        self.renderPromise().then(function () {
            map.loaded(function () {
                self.layerPromise = map.addLayer({
                    id: TC.getUID(),
                    title: 'Medición',
                    stealth: true,
                    type: TC.Consts.layerType.VECTOR,
                    styles: {
                        point: $.extend({}, map.options.styles.point, { fillOpacity: 0 }),
                        line: map.options.styles.line,
                        polygon: map.options.styles.polygon
                    }
                });

                self.layerPromise.then(function (layer) {
                    self.layer = layer;
                    self.layer.map.putLayerOnTop(self.layer);

                    TC.loadJS(
                    !TC.control.Draw,
                    TC.apiLocation + 'TC/control/Draw',
                    function () {
                        self.drawLines = new TC.control.Draw({
                            "div": self._$div.find('.tc-ctl-meas-lines'),
                            "mode": TC.Consts.geom.POLYLINE,
                            "measure": true,
                            "layer": self.layer
                        });
                        self.drawPolygons = new TC.control.Draw({
                            "div": self._$div.find('.tc-ctl-meas-polygon'),
                            "mode": TC.Consts.geom.POLYGON,
                            "measure": true,
                            "layer": self.layer
                        });

                        $.when(map.addControl(self.drawLines), map.addControl(self.drawPolygons)).then(function () {
                            var drawMeasures = function (e) {
                                var precision = e.units === 'm' ? 0 : 3;
                                if (e.area) {
                                    self._$area.html(e.area.toFixed(precision).replace('.', ',') + ' ' + e.units + '&sup2;');
                                } else if (e.area === 0) {
                                    self.resetValues();
                                }
                                if (e.perimeter) {
                                    self._$peri.html(e.perimeter.toFixed(precision).replace('.', ',') + ' ' + e.units);
                                } else if (e.perimeter === 0) {
                                    self.resetValues();
                                }
                                if (e.length) {
                                    self._$len.html(e.length.toFixed(precision).replace('.', ',') + ' ' + e.units);
                                } else if (e.length === 0) {
                                    self.resetValues();
                                }
                            }
                            self.drawLines.$events.on(TC.Consts.event.MEASURE + ' ' + TC.Consts.event.MEASUREPARTIAL, function (e) {
                                drawMeasures(e);
                            }).on(TC.Consts.event.DRAWCANCEL, function () {
                                self.cancel();
                            });
                            self.drawPolygons.$events.on(TC.Consts.event.MEASURE + ' ' + TC.Consts.event.MEASUREPARTIAL, function (e) {
                                drawMeasures(e);
                            }).on(TC.Consts.event.DRAWCANCEL, function () {
                                self.cancel();
                            });
                        });

                        self.setMode(self.options.mode);
                    });

                });
            });
        });
    };

    ctlProto.activate = function () {
        var self = this;
        TC.Control.prototype.activate.call(self);
    };

    ctlProto.deactivate = function () {
        var self = this;
        TC.Control.prototype.deactivate.call(self);

    }

    ctlProto.setMode = function (mode, activate) {
        var self = this;

        self.mode = mode;

        var $active, $hidden;
        var event;
        switch (mode) {
            case TC.Consts.geom.POLYLINE:
                self.drawLines.activate();
                $active = self._$div.find('.tc-ctl-meas-len');
                $hidden = self._$div.find('.tc-ctl-meas-area');
                event = TC.Consts.event.CONTROLACTIVATE;
                break;
            case TC.Consts.geom.POLYGON:
                self.drawPolygons.activate();
                $active = self._$div.find('.tc-ctl-meas-area');
                $hidden = self._$div.find('.tc-ctl-meas-len');
                event = TC.Consts.event.CONTROLACTIVATE;
                break;
            case null:
            case undefined:
                if (self.drawLines && self.drawLines.isActive) {
                    self.drawLines.cancel();
                    //self.drawLines.deactivate();
                }

                if (self.drawPolygons && self.drawPolygons.isActive) {
                    self.drawPolygons.cancel();
                    //self.drawPolygons.deactivate();
                }

                $active = $();
                $hidden = self._$div.find('.tc-ctl-meas-area,.tc-ctl-meas-len');
                event = TC.Consts.event.CONTROLDEACTIVATE;

                break;
            default:
                self.drawLines.activate();
                $active = self._$div.find('.tc-ctl-meas-area,.tc-ctl-meas-len');
                $hidden = $();
                event = TC.Consts.event.CONTROLACTIVATE;
                break;
        }

        self.resetValues();

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
        $active.removeClass(TC.Consts.classes.HIDDEN);
        $hidden.addClass(TC.Consts.classes.HIDDEN);


        if (event && self.map) {
            self.map.$events.trigger($.Event(event, { control: self }));
        }

        window.meas = self;
    };

    ctlProto.cancel = function () {
        this.setMode(null, false);
    }
    ctlProto.resetValues = function () {
        var self = this;
        self.NOMEASURE = '-';
        if (self._$len) {
            self._$len.text(self.NOMEASURE);
            self._$area.text(self.NOMEASURE);
            self._$peri.text(self.NOMEASURE);
        }
    };

})();
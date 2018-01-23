
TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.Consts.event.RESULTTOOLTIP = 'resulttooltip.tc';
TC.Consts.event.RESULTTOOLTIPEND = 'resulttooltipend.tc';
TC.Consts.event.DRAWCHART = 'drawchart.tc';
TC.Consts.event.DRAWTABLE = 'drawtable.tc';
TC.Consts.event.RESULTSPANELMIN = 'resultspanelmin.tc';
TC.Consts.event.RESULTSPANELMAX = 'resultspanelmax.tc';
TC.Consts.event.RESULTSPANELCLOSE = 'resultspanelclose.tc';

TC.control.ResultsPanel = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    self.data = {};
    self.classes = {
        FA: 'fa'
    };

    self.contentType = {
        TABLE: {
            fnOpen: TC.control.ResultsPanel.prototype.openTable,
            collapsedClass: '.fa-list-alt'
        },
        CHART: {
            fnOpen: TC.control.ResultsPanel.prototype.openChart,
            collapsedClass: '.fa-area-chart'
        }
    };

    self.content = self.contentType.TABLE;

    if (self.options) {
        if (self.options.content)
            self.content = self.contentType[self.options.content.toUpperCase()];

        if (self.options.chart)
            self.chart = self.options.chart;

        if (self.options.table)
            self.table = self.options.table;

        if (self.options.save)
            self.save = self.options.save;
    }
};

TC.inherit(TC.control.ResultsPanel, TC.Control);

TC.control.ResultsPanel.prototype.CLASS = 'tc-ctl-p-results';
TC.control.ResultsPanel.prototype.template = {};

if (TC.isDebug) {
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS] = TC.apiLocation + "TC/templates/ResultsPanel.html";
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS + '-table'] = TC.apiLocation + "TC/templates/ResultsPanelTable.html";
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS + '-chart'] = TC.apiLocation + "TC/templates/ResultsPanelChart.html";
} else {
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS] = function () { dust.register(TC.control.ResultsPanel.prototype.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div class=\"prpanel-group prsidebar-body \" style=\"display: none\" data-no-cb><div class=\"prpanel prpanel-default\"><div class=\"prpanel-heading\"><h4 class=\"prpanel-title\"><span class=\"prpanel-title-text\"></span> <span class=\"prcollapsed-pull-right prcollapsed-slide-submenu prcollapsed-slide-submenu-close\" title=\"").h("i18n", ctx, {}, { "$key": "close" }).w("\"><i class=\"fa fa-times\"></i></span><span class=\"prcollapsed-pull-right prcollapsed-slide-submenu prcollapsed-slide-submenu-min\" title=\"").h("i18n", ctx, {}, { "$key": "hide" }).w("\"><i class=\"fa fa-chevron-left\"></i></span><span class=\"prcollapsed-pull-right prcollapsed-slide-submenu prcollapsed-slide-submenu-csv\" hidden title=\"Exportar a Excel\"><i class=\"fa fa-file-excel-o\"></i></span></h4></div><div id=\"results\" class=\"prpanel-collapse collapse in\"><div class=\"prpanel-body list-group tc-ctl-p-results-table\"> </div><div class=\"prpanel-body list-group tc-ctl-p-results-chart\"></div></div></div></div><div class=\"prcollapsed prcollapsed-max prcollapsed-pull-left\" style=\"display: none;\" title=\"").h("i18n", ctx, {}, { "$key": "expand" }).w("\" data-no-cb><i class=\"fa-list-alt\" hidden></i><i class=\"fa-area-chart\" hidden></i></div>"); } body_0.__dustBody = !0; return body_0 };
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS + '-table'] = function () { dust.register(TC.control.ResultsPanel.prototype.CLASS + '-table', body_0); function body_0(chk, ctx) { return chk.w("<table class=\"table\" style=\"display:none;\"><thead>").s(ctx.get(["columns"], false), ctx, { "block": body_1 }, {}).w("</thead><tbody>").s(ctx.get(["results"], false), ctx, { "block": body_2 }, {}).w("</tbody></table>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<th>").f(ctx.getPath(true, []), ctx, "h").w("</th>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<tr>").h("iterate", ctx, { "block": body_3 }, { "on": ctx.getPath(true, []) }).w("</tr>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<td>").f(ctx.get(["value"], false), ctx, "h").w("</td>"); } body_3.__dustBody = !0; return body_0 };
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS + '-chart'] = function () { dust.register(TC.control.ResultsPanel.prototype.CLASS + '-chart', body_0); function body_0(chk, ctx) { return chk.w("<div id=\"track-chart\">").x(ctx.get(["msg"], false), ctx, { "else": body_1, "block": body_2 }, {}).w("</div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<span id=\"elevationGain\" >").h("i18n", ctx, {}, { "$key": "geo.trk.chart.elevationGain" }).w(": +").f(ctx.get(["upHill"], false), ctx, "h").w("m, -").f(ctx.get(["downHill"], false), ctx, "h").w("m</span><div id=\"chart\"></div>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.f(ctx.get(["msg"], false), ctx, "h"); } body_2.__dustBody = !0; return body_0 };
}

TC.control.ResultsPanel.prototype.isVisible = function () {
    var self = this;

    self._$div.find('.prsidebar-body').is(':visible') || self._$div.find('.prcollapsed-max').is(':visible');
};

TC.control.ResultsPanel.prototype.render = function (callback) {
    var self = this;

    TC.Control.prototype.render.call(self, function () {

        self.$mainTitle = self._$div.find('.prpanel-title-text');

        self.$minimize = self._$div.find('.prcollapsed-slide-submenu-min');
        self.$minimize.on('click', function () {
            self.minimize();
        });

        self.$close = self._$div.find('.prcollapsed-slide-submenu-close');
        self.$close.on('click', function () {
            self.close();
        });

        self.$maximize = self._$div.find('.prcollapsed-max');
        self.$maximize.on('click', function () {
            self.maximize();
        });

        if (self.save) {
            self.$save = self._$div.find('.prcollapsed-slide-submenu-csv');
            self.$save.on('click', function () {
                self.exportToExcel();
            });
            self.$save.removeAttr("hidden");
        }



        if (self.content) {
            self.content = self.content;

            if (self.options.titles) {

                if (self.options.titles.main) {
                    self.$mainTitle.attr('title', self.options.titles.main);
                    self.$mainTitle.html(self.options.titles.main);
                }

                if (self.options.titles.max) {
                    self.$maximize.attr('title', self.options.titles.max);
                }
            }
        }

        self._$div.find(self.content.collapsedClass).removeAttr('hidden').addClass(self.classes.FA);

        self.$divTable = self._$div.find('.' + self.CLASS + '-table');
        self.$divChart = self._$div.find('.' + self.CLASS + '-chart');

        TC.loadJS(Modernizr.touch, TC.apiLocation + 'lib/jQuery/jquery.touchSwipe.min.js', function () {
            if (Modernizr.touch) {
                var $head = self._$div.swipe({
                    swipeLeft: function () {
                        self.minimize();
                    }
                });
            }
        });

        if (callback && typeof (callback) === "function")
            callback.call();
    });
};

TC.control.ResultsPanel.prototype.minimize = function () {
    var self = this;

    if (self._$div.find(self.content.collapsedClass + ':visible').length == 0) { // ya está minimizado
        if (!self._$div.find(self.content.collapsedClass).hasClass(self.classes.FA))
            self._$div.find(self.content.collapsedClass).addClass(self.classes.FA);

        self._$div.find(self.content.collapsedClass).removeAttr('hidden');


        self._$div.find('.prsidebar-body').toggle('slide', function () {
            self._$div.find('.prcollapsed-max').fadeIn();
        });

        self.map.$events.trigger($.Event(TC.Consts.event.RESULTSPANELMIN), {});
    }
};

TC.control.ResultsPanel.prototype.maximize = function () {
    var self = this;

    if (self._$div.find(self.content.collapsedClass + ':hidden').length == 0) { // ya está maximizado
        self._$div.find(self.content.collapsedClass).attr('hidden', 'hidden');

        self._$div.find('.prsidebar-body').toggle('slide');
        self._$div.find('.prcollapsed-max').hide();

        self.map.$events.trigger($.Event(TC.Consts.event.RESULTSPANELMAX), {});
    }
};

TC.control.ResultsPanel.prototype.close = function () {
    var self = this;

    self._$div.find('.prsidebar-body').fadeOut('slide');
    self._$div.find('.prcollapsed-max').hide();
    self._$div.find(self.content.collapsedClass).attr('hidden', 'hidden').removeClass(self.classes.FA);

    if (self.chart && self.chart.chart) {
        self.chart.chart = self.chart.chart.destroy();
    }

    self.map.$events.trigger($.Event(TC.Consts.event.RESULTSPANELCLOSE, { control: self }));
};

TC.control.ResultsPanel.prototype.openChart = function () {
    var self = this;

    var data = arguments.data || arguments[0].data;
    if (data) {

        if (data.msg) {
            self.map.toast(data.msg);
        }
        else {

            var locale = TC.Util.getMapLocale(self.map);
            self.getRenderedHtml(TC.control.ResultsPanel.prototype.CLASS + '-chart', { upHill: data.upHill.toLocaleString(locale), downHill: data.downHill.toLocaleString(locale) }, function (out) {

                self._$div.find('.' + TC.control.ResultsPanel.prototype.CLASS + '-chart').html(out);

                var chartOptions = {
                    bindto: '#chart',
                    padding: {
                        top: 0,
                        right: 15,
                        bottom: 0,
                        left: 45,
                    },
                    legend: {
                        show: false
                    }
                };

                if (self.chart.tooltip) {
                    chartOptions.tooltip = {
                        contents: function (d) {
                            var fn = self.chart.tooltip;
                            if (typeof (fn) !== "function")
                                fn = TC.Util.getFNFromString(self.chart.tooltip);
                            return fn.call(eval(self.chart.ctx), d);
                        }
                    }
                }

                if (self.chart && self.chart.onmouseout) {
                    chartOptions.onmouseout = function () {
                        var fn = self.chart.onmouseout;
                        if (typeof (fn) !== "function")
                            fn = TC.Util.getFNFromString(self.chart.onmouseout);
                        fn.call(eval(self.chart.ctx));
                    };
                }

                chartOptions = $.extend({}, chartOptions, data);
                chartOptions.onrendered = function () {
                    self.map.$events.trigger($.Event(TC.Consts.event.DRAWCHART), { svg: this.svg[0][0] });
                    self._$div.find('.prsidebar-body').fadeIn('slide');

                    self._$div.find('.' + self.CLASS + '-table').hide();
                };

                if (window.c3) {
                    // GLS: Override de la función generateDrawLine y generateDrawArea para establecer otro tipo de interpolación en la línea
                    window.c3.chart.internal.fn.generateDrawLine = function (lineIndices, isSub) {
                        var $$ = this, config = $$.config,
                            line = $$.d3.svg.line(),
                            getPoints = $$.generateGetLinePoints(lineIndices, isSub),
                            yScaleGetter = isSub ? $$.getSubYScale : $$.getYScale,
                            xValue = function (d) { return (isSub ? $$.subxx : $$.xx).call($$, d); },
                            yValue = function (d, i) {
                                return config.data_groups.length > 0 ? getPoints(d, i)[0][1] : yScaleGetter.call($$, d.id)(d.value);
                            };
                        line = config.axis_rotated ? line.x(yValue).y(xValue) : line.x(xValue).y(yValue);
                        if (!config.line_connectNull) { line = line.defined(function (d) { return d.value != null; }); }
                        return function (d) {
                            var values = config.line_connectNull ? $$.filterRemoveNull(d.values) : d.values,
                                x = isSub ? $$.x : $$.subX, y = yScaleGetter.call($$, d.id), x0 = 0, y0 = 0, path;
                            if ($$.isLineType(d)) {
                                if (config.data_regions[d.id]) {
                                    path = $$.lineWithRegions(values, x, y, config.data_regions[d.id]);
                                } else {
                                    if ($$.isStepType(d)) { values = $$.convertValuesToStep(values); }
                                    path = line.interpolate('linear')(values);
                                }
                            } else {
                                if (values[0]) {
                                    x0 = x(values[0].x);
                                    y0 = y(values[0].value);
                                }
                                path = config.axis_rotated ? "M " + y0 + " " + x0 : "M " + x0 + " " + y0;
                            }
                            return path ? path : "M 0 0";
                        };
                    };
                    window.c3.chart.internal.fn.generateDrawArea = function (areaIndices, isSub) {
                        var $$ = this, config = $$.config, area = $$.d3.svg.area(),
                            getPoints = $$.generateGetAreaPoints(areaIndices, isSub),
                            yScaleGetter = isSub ? $$.getSubYScale : $$.getYScale,
                            xValue = function (d) { return (isSub ? $$.subxx : $$.xx).call($$, d); },
                            value0 = function (d, i) {
                                return config.data_groups.length > 0 ? getPoints(d, i)[0][1] : yScaleGetter.call($$, d.id)(0);
                            },
                            value1 = function (d, i) {
                                return config.data_groups.length > 0 ? getPoints(d, i)[1][1] : yScaleGetter.call($$, d.id)(d.value);
                            };
                        area = config.axis_rotated ? area.x0(value0).x1(value1).y(xValue) : area.x(xValue).y0(value0).y1(value1);
                        if (!config.line_connectNull) {
                            area = area.defined(function (d) { return d.value !== null; });
                        }
                        return function (d) {
                            var values = config.line_connectNull ? $$.filterRemoveNull(d.values) : d.values,
                                x0 = 0, y0 = 0, path;
                            if ($$.isAreaType(d)) {
                                if ($$.isStepType(d)) { values = $$.convertValuesToStep(values); }
                                path = area.interpolate('linear')(values);
                            } else {
                                if (values[0]) {
                                    x0 = $$.x(values[0].x);
                                    y0 = $$.getYScale(d.id)(values[0].value);
                                }
                                path = config.axis_rotated ? "M " + y0 + " " + x0 : "M " + x0 + " " + y0;
                            }
                            return path ? path : "M 0 0";
                        };
                    };

                    self.chart.chart = c3.generate(chartOptions);
                }
            });
        }
    } else {
        self.map.toast(data.msg);
    }

    self.map.getLoadingIndicator().hide();
};

TC.control.ResultsPanel.prototype.openTable = function () {
    var self = this;

    var data = arguments[0];
    if (data) {

        var deleteColumns = function () {
            for (var i = 0; i < data.length; i++) {
                for (var k in data[i]) {
                    if (columns.indexOf(k) < 0) {
                        delete data[i][k];
                    }
                }
            }
        };

        var css;
        if (data.css) {
            css = data.css;
        }
        var columns = data.columns, data = data.data;

        if (data && data.length > 0) {
            //Si no recibe columnas, las extrae de las claves del primer objeto de la colección de datos
            if (!columns) {
                columns = [];
                for (var k in data[0]) {
                    columns.push(k);
                }
            }

            //deleteColumns();

            self.tableData = {
                columns: columns,
                results: data,
                css: css
            }
            self.getRenderedHtml(self.CLASS + '-table', self.tableData).then(function (html) {
                var table = self._$div.find('.' + self.CLASS + '-table');
                var parent = table.parent();
                table.detach();
                table.append(html);
                parent.append(table);
            });

            self._$div.find('.' + self.CLASS + '-chart').hide();
            self._$div.find('.prsidebar-body').fadeIn('slide');
        }
    }

    self.map.getLoadingIndicator().hide();

};

TC.control.ResultsPanel.prototype.open = function (html) {
    var self = this;

    var toCheck = self._$div.find('.' + self.CLASS + '-table');
    var checkIsRendered = function () {
        var clientRect = toCheck[0].getBoundingClientRect();
        if (clientRect && clientRect.width > 100) {
            window.cancelAnimationFrame(this.requestIsRendered);

            this.map.$events.trigger($.Event(TC.Consts.event.DRAWTABLE), {});
        }
    };

    self.requestIsRendered = window.requestAnimationFrame(checkIsRendered.bind(self));

    if (html) {
        self._$div.find('.' + self.CLASS + '-table').html(html);
    }
    self._$div.find('.' + self.CLASS + '-chart').hide();

    // si está minimizado
    if (self._$div.find(self.content.collapsedClass + ':visible').length == 1) {
        self.maximize();
    }

    self._$div.find('.prsidebar-body').fadeIn('slide');

    self.map.getLoadingIndicator().hide();
};

TC.control.ResultsPanel.prototype.register = function (map) {
    var self = this;

    TC.Control.prototype.register.call(self, map);

    if (self.openOn) {
        self.map.$events.one(self.openOn, function (e, args) {
            self.content.fnOpen.call(self, args);
        });
    }

    if (self.closeOn) {
        self.map.$events.one(self.closeOn, function (e, args) {
            self.close();
        });
    }

    if (self.options.openOn) {
        self.map.$events.on(self.options.openOn, function (e, args) {
            self.content.fnOpen.call(self, args);
        });
    }

    if (self.options.closeOn) {
        self.map.$events.on(self.options.closeOn, function (e, args) {
            self.close();
        });
    }


};

TC.control.ResultsPanel.prototype.exportToExcel = function () {
    var _ctl = this;

    var rows = [_ctl.tableData.columns];

    $.each(_ctl.tableData.results, function (index, value) {
        var row = [];
        for (var k in value) {
            if (value.hasOwnProperty(k) && k !== "Id" && k !== "Geom") { //Las columnas ID y Geom no aparece en la exportaci\u00f3n
                row.push(value[k]);
            }
        }
        rows.push(row);
    });
    var _fncSave = function (exporter) {
        var fileName = _ctl.save.fileName ? _ctl.save.fileName : 'resultados.xls';
        var title = (_ctl.options.titles && _ctl.options.titles.main ? _ctl.options.titles.main : null);
        exporter.Save(fileName, rows, title);
    }
    if (!TC.Util.ExcelExport)
        TC.loadJS(true, TC.apiLocation + 'TC/TC.Util.ExcelExport', function () {
            _fncSave(new TC.Util.ExcelExport());
        });
    else
        _fncSave(new TC.Util.ExcelExport());

};
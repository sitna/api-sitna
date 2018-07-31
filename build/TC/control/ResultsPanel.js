
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

    self.wrap = new TC.wrap.control.ResultsPanel(self);

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

(function () {

    const ctlProto = TC.control.ResultsPanel.prototype;

    ctlProto.CLASS = 'tc-ctl-p-results';
    ctlProto.template = {};

    ctlProto.CHART_SIZE = {
        MIN_HEIGHT: 70,
        MAX_HEIGHT: 128,

        MIN_WIDTH: 215,
        MEDIUM_WIDTH: 310,
        MAX_WIDTH: 445        
    };

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/ResultsPanel.html";
        ctlProto.template[ctlProto.CLASS + '-table'] = TC.apiLocation + "TC/templates/ResultsPanelTable.html";
        ctlProto.template[ctlProto.CLASS + '-chart'] = TC.apiLocation + "TC/templates/ResultsPanelChart.html";
    } else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div class=\"prpanel-group prsidebar-body \" style=\"display: none\" data-no-cb><div class=\"prpanel prpanel-default\"><div class=\"prpanel-heading\"><h4 class=\"prpanel-title\"><span class=\"prpanel-title-text\"></span> <span class=\"prcollapsed-pull-right prcollapsed-slide-submenu prcollapsed-slide-submenu-close\" title=\"").h("i18n", ctx, {}, { "$key": "close" }).w("\"><i class=\"fa fa-times\"></i></span><span class=\"prcollapsed-pull-right prcollapsed-slide-submenu prcollapsed-slide-submenu-min\" title=\"").h("i18n", ctx, {}, { "$key": "hide" }).w("\"><i class=\"fa fa-chevron-left\"></i></span><span class=\"prcollapsed-pull-right prcollapsed-slide-submenu prcollapsed-slide-submenu-csv\" hidden title=\"").h("i18n", ctx, {}, { "$key": "export.excel" }).w("\"><i class=\"fa fa-file-excel-o\"></i></span></h4></div><div id=\"results\" class=\"prpanel-collapse collapse in\"><div class=\"prpanel-body list-group tc-ctl-p-results-table\"> </div><div class=\"prpanel-body list-group tc-ctl-p-results-chart\"></div></div></div></div><div class=\"prcollapsed prcollapsed-max prcollapsed-pull-left\" style=\"display: none;\" title=\"").h("i18n", ctx, {}, { "$key": "expand" }).w("\" data-no-cb><i class=\"fa-list-alt\" hidden></i><i class=\"fa-area-chart\" hidden></i></div>"); } body_0.__dustBody = !0; return body_0; };
        ctlProto.template[ctlProto.CLASS + '-table'] = function () { dust.register(ctlProto.CLASS + '-table', body_0); function body_0(chk, ctx) { return chk.w("<table class=\"table\" style=\"display:none;\"><thead>").s(ctx.get(["columns"], false), ctx, { "block": body_1 }, {}).w("</thead><tbody>").s(ctx.get(["results"], false), ctx, { "block": body_2 }, {}).w("</tbody></table>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<th>").f(ctx.getPath(true, []), ctx, "h").w("</th>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<tr>").h("iterate", ctx, { "block": body_3 }, { "on": ctx.getPath(true, []) }).w("</tr>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<td>").f(ctx.get(["value"], false), ctx, "h").w("</td>"); } body_3.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-chart'] = function () { dust.register(ctlProto.CLASS + '-chart', body_0); function body_0(chk, ctx) { return chk.w("<div id=\"track-chart\">").x(ctx.get(["msg"], false), ctx, { "else": body_1, "block": body_2 }, {}).w("</div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<span id=\"elevationGain\" >").h("i18n", ctx, {}, { "$key": "geo.trk.chart.elevationGain" }).w(": +").f(ctx.get(["upHill"], false), ctx, "h").w("m, -").f(ctx.get(["downHill"], false), ctx, "h").w("m</span><div id=\"chart\"></div>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.f(ctx.get(["msg"], false), ctx, "h"); } body_2.__dustBody = !0; return body_0 };
    }

    ctlProto.isVisible = function () {
        var self = this;

        self._$div.find('.prsidebar-body').is(':visible') || self._$div.find('.prcollapsed-max').is(':visible');
    };

    ctlProto.render = function (callback) {
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

    ctlProto.minimize = function () {
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

    ctlProto.maximize = function () {
        var self = this;

        if (self._$div.find(self.content.collapsedClass + ':hidden').length == 0) { // ya está maximizado
            self._$div.find(self.content.collapsedClass).attr('hidden', 'hidden');

            self._$div.find('.prsidebar-body').toggle('slide');
            self._$div.find('.prcollapsed-max').hide();

            self.map.$events.trigger($.Event(TC.Consts.event.RESULTSPANELMAX), {});
        }
    };

    ctlProto.isMinimized = function () {
        const self = this;
        return self._$div.find('.prcollapsed-max:visible').length === 1 && self._$div.find('.prsidebar-body:visible').length === 0;
    }

    ctlProto.close = function () {
        var self = this;

        self._$div.find('.prsidebar-body').fadeOut('slide');
        self._$div.find('.prcollapsed-max').hide();
        self._$div.find(self.content.collapsedClass).attr('hidden', 'hidden').removeClass(self.classes.FA);

        if (self.chart && self.chart.chart) {
            self.chart.chart = self.chart.chart.destroy();
        }

        self.map.$events.trigger($.Event(TC.Consts.event.RESULTSPANELCLOSE, { control: self }));
    };

    ctlProto.openChart = function (data) {
        const self = this;

        if (data) {

            if (data.msg) {
                self.map.toast(data.msg);
            }
            else {
                self.elevationProfileCoordinates = data.coords;
                self.renderElevationProfileChart({
                    data: data,
                    div: self._$div.find('.' + ctlProto.CLASS + '-chart')
                });
            }
        } else {
            self.map.toast(options.msg);
        }

        self.map.getLoadingIndicator().hide();
    };

    ctlProto.renderElevationProfileChart = function (options) {
        const self = this;
        options = options || {};
        TC.loadJS(!window.c3,
            TC.Consts.url.D3C3 || TC.apiLocation + 'lib/d3c3/d3c3.min.js',
            function () {
                const data = options.data;
                const $div = $(options.div);
                var locale = TC.Util.getMapLocale(self.map);
                self.getRenderedHtml(ctlProto.CLASS + '-chart', { upHill: data.upHill.toLocaleString(locale), downHill: data.downHill.toLocaleString(locale) }, function (out) {

                    $div.html(out);
                    $div.show();

                    if (self.options.titles) {

                        if (self.options.titles.main) {
                            self._$div.find('.prpanel-title-text').attr('title', self.options.titles.main);
                            self._$div.find('.prpanel-title-text').html(self.options.titles.main);
                        }

                        if (self.options.titles.max) {
                            self._$div.find('.prcollapsed-max').attr('title', self.options.titles.max);
                        }
                    }
                    var chartOptions = $.extend({
                        bindto: $div.find('.tc-chart')[0],
                        padding: {
                            top: 0,
                            right: 15,
                            bottom: 0,
                            left: 45,
                        },
                        legend: {
                            show: false
                        }
                    }, self.createChartOptions(data));

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

                    chartOptions.onrendered = function () {
                        if ($.isFunction(chartOptions._onrendered)) {
                            chartOptions._onrendered.call(this);
                        }
                        self.map.$events.trigger($.Event(TC.Consts.event.DRAWCHART, { control: self, svg: this.svg[0][0], chart: this }));
                    };

                    if (window.c3) {

                        if (!c3._isOverriden) {
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
                            c3._isOverriden = true;
                        }

                        self.chart.chart = c3.generate(chartOptions);
                    }
                });
            }
        );
    };

    ctlProto.openTable = function () {
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
            var callback = data.callback;
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
                    css: css,
                    callback: callback
                }
                self.getRenderedHtml(self.CLASS + '-table', self.tableData).then(function (html) {
                    var table = self._$div.find('.' + self.CLASS + '-table');
                    var parent = table.parent();
                    table.detach();
                    table.append(html);
                    parent.append(table);
                    if (self.tableData.callback)
                        self.tableData.callback(table);
                });

                self._$div.find('.' + self.CLASS + '-chart').hide();
                self._$div.find('.prsidebar-body').fadeIn('slide');
            }
        }

        self.map.getLoadingIndicator().hide();

    };

    ctlProto.open = function (html) {
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
            self._$div.find('.' + self.CLASS + '-table').show();
        }
        self._$div.find('.' + self.CLASS + '-chart').hide();

        if (self.options.titles) {

            if (self.options.titles.main) {
                self._$div.find('.prpanel-title-text').attr('title', self.options.titles.main);
                self._$div.find('.prpanel-title-text').html(self.options.titles.main);
            }

            if (self.options.titles.max) {
                self._$div.find('.prcollapsed-max').attr('title', self.options.titles.max);
            }
        }

        // si está minimizado
        if (self._$div.find(self.content.collapsedClass + ':visible').length == 1) {
            self.maximize();
        }

        self._$div.find('.prsidebar-body').fadeIn('slide');

        self.map.getLoadingIndicator().hide();
    };

    ctlProto.createChartOptions = function (options) {
        const self = this;
        var result = {};
        options = options || {};
        const locale = options.locale || TC.Util.getMapLocale(self.map);
        switch (options.chartType) {
            default:
                if (options.ele != null) {
                    const getChartSize = function () {
                        const docWidth = document.documentElement.clientWidth / 100 * 40; // css panel contendor
                        return {
                            height: docWidth > 445 ? options.maxHeight || self.CHART_SIZE.MAX_HEIGHT : options.minHeight || self.CHART_SIZE.MIN_HEIGHT,
                            width: docWidth > 445 ? options.maxWidth || self.CHART_SIZE.MAX_WIDTH : docWidth > 310 ? options.mediumWidth || self.CHART_SIZE.MEDIUM_WIDTH : options.minWidth || self.CHART_SIZE.MIN_WIDTH
                        };
                    };

                    var maxy = Number.NEGATIVE_INFINITY;
                    var miny = Number.POSITIVE_INFINITY;
                    options.ele.forEach(function (y) {
                        if (typeof y === 'number') {
                            maxy = Math.max(y, maxy);
                            miny = Math.min(y, miny);
                        }
                    });

                    const gradId = 'grad' + TC.getUID();

                    result = {
                        data: {
                            x: 'x',
                            columns: [['x'].concat(options.x), ['ele'].concat(options.ele)],
                            types: { 'ele': 'area-spline' }, colors: {
                                "ele": 'url(#' + gradId + ')'
                            }
                        },
                        size: getChartSize(),
                        point: {
                            show: false
                        },
                        axis: {
                            x: {
                                tick: {
                                    outer: false,
                                    count: 5, format: function (d) {
                                        d = d / 1000;
                                        var dist;
                                        var measure;
                                        if (d < 1) {
                                            dist = Math.round(d * 1000);
                                            measure = ' m';
                                        } else {
                                            dist = Math.round(d * 100) / 100;
                                            measure = ' km';
                                        }

                                        dist = dist.toLocaleString(locale);
                                        return dist + measure;
                                    }
                                }
                            },
                            y: {
                                padding: {
                                    top: 0, bottom: 0
                                },
                                max: maxy,
                                min: miny,
                                tick: {
                                    count: 2,
                                    format: function (d) {
                                        return (parseInt(d.toFixed(0)) || 0).toLocaleString(locale) + 'm';
                                    }
                                }
                            }
                        },
                        onresize: function () {
                            this.api.resize(getChartSize());
                        }
                    }

                    if (options.time) result.time = ("00000" + options.time.h).slice(-2) + ':' + ("00000" + options.time.m).slice(-2) + ':' + ("00000" + options.time.s).slice(-2);

                    result._onrendered = function () {
                        const svg = this.svg[0][0];
                        var svgDefsElement = svg.getElementsByTagName('defs')[0];
                        var xmlns = "http://www.w3.org/2000/svg";
                        var grad = document.createElementNS(xmlns, "linearGradient");
                        grad.setAttributeNS(null, "id", gradId);
                        grad.setAttributeNS(null, "x1", "0%");
                        grad.setAttributeNS(null, "x2", "0%");
                        grad.setAttributeNS(null, "y1", "0%");
                        grad.setAttributeNS(null, "y2", "100%");
                        grad.setAttributeNS(null, "gradientUnits", "userSpaceOnUse");

                        const stop0 = document.createElementNS(xmlns, "stop");
                        stop0.setAttributeNS(null, "offset", "0%");
                        stop0.setAttributeNS(null, "stop-color", "red");
                        stop0.setAttributeNS(null, "stop-opacity", "0.7");
                        grad.appendChild(stop0);

                        const stop50 = document.createElementNS(xmlns, "stop");
                        stop50.setAttributeNS(null, "offset", "50%");
                        stop50.setAttributeNS(null, "stop-color", "orange");
                        stop50.setAttributeNS(null, "stop-opacity", "0.9");
                        grad.appendChild(stop50);

                        const stop100 = document.createElementNS(xmlns, "stop");
                        stop100.setAttributeNS(null, "offset", "100%");
                        stop100.setAttributeNS(null, "stop-color", "green");
                        stop100.setAttributeNS(null, "stop-opacity", "1");
                        grad.appendChild(stop100);

                        svgDefsElement.appendChild(grad);

                        $(d3.select(".c3-brush").node()).remove();

                        d3.select(".c3-event-rects,.c3-event-rects-single")
                            .selectAll("rect")
                            .style("cursor", "pointer")
                            .on("click", function (e) {
                                d3.event.stopPropagation();
                                const point = self.elevationProfileCoordinates[e.index].slice(0, 2);
                                if (point) {
                                    TC.loadJS(!TC.feature || (TC.feature && !TC.feature.Point),
                                        [TC.apiLocation + 'TC/feature/Point'],
                                        function () {
                                            self.map.zoomToFeatures([new TC.feature.Point(point)]);
                                        }
                                    );
                                }
                            });

                        var pattern = d3.select('.c3-axis.c3-axis-x').select('path').attr('d');
                        var match = /^M\d\,(\d)V\dH\d{3}V(\d)$/i.exec(pattern);
                        if (match) { // quitamos las barritas de los extremos del axis-x
                            pattern = pattern.replace(/(M\d\,)\d/i, "$10").replace(/(H\d{3}V)(\d)/i, "$10");
                            d3.select('.c3-axis.c3-axis-x').select('path').attr('d', pattern);
                        } else {
                            var match = /^M\s\d\s(\d)\sV\s\d\sH\s\d{3}\sV\s(\d)$/i.exec(pattern);
                            if (match) { // quitamos las barritas de los extremos del axis-x
                                pattern = pattern.replace(/(M\s\d\s)\d/i, "$10").replace(/(H\s\d{3}\sV\s)(\d)/i, "$10");
                                d3.select('.c3-axis.c3-axis-x').select('path').attr('d', pattern);
                            }
                        }

                        const $svg = $(svg);
                        const chartSize = {
                            width: $svg.width(),
                            height: $svg.height()
                        };

                        // ¿es necesario pasar los labels a multiline?
                        var setMultilineLabels = function () {
                            var x = d3.scale.ordinal().rangeRoundBands([0, chartSize.width], .1, .3);
                            d3.select('.c3-axis-x').selectAll('text:not(.c3-axis-x-label)')
                                .call(function (textNode, width) {
                                    textNode.each(function () {
                                        textNode.each(function (d, i) {
                                            if (i == 0) return;

                                            d3text = d3.select(this);

                                            if (!d3text.attr('edited')) {
                                                d3text.attr('edited', true);
                                                var clone = d3text.select('tspan').node().cloneNode();
                                                var words = d3text.text().split(' ');

                                                d3text.select('tspan').text(words[0]);
                                                clone.textContent = words[1];
                                                var dy = clone.getAttribute('dy');
                                                dy = dy ? parseFloat(clone.getAttribute('dy')) : .71;
                                                dy = dy + 0.18 + 'em';
                                                clone.setAttribute('dy', dy);
                                                d3text.node().appendChild(clone);
                                            }
                                        });
                                    });
                                }, x.rangeBand());
                        };
                        if (!d3.select('.c3-axis-x').node().getBoundingClientRect().width) {

                            if (self.elevationChartLabelsRAF) {
                                window.cancelAnimationFrame(self.elevationChartLabelsRAF);
                                self.elevationChartLabelsRAF = undefined;
                            }

                            function hasSize() {
                                if (d3.select('.c3-axis-x').length && !(d3.select('.c3-axis-x').node())) {
                                    self.elevationChartLabelsRAF = requestAnimationFrame(hasSize);
                                }
                                else if (d3.select('.c3-axis-x').length && d3.select('.c3-axis-x').node() &&
                                    !d3.select('.c3-axis-x').node().getBoundingClientRect().width) {
                                    self.elevationChartLabelsRAF = requestAnimationFrame(hasSize);
                                } else {
                                    window.cancelAnimationFrame(self.elevationChartLabelsRAF);
                                    self.elevationChartLabelsRAF = undefined;

                                    if (((d3.select('.c3-axis-x').node().getBoundingClientRect().width >= chartSize.width - d3.select('.c3-axis-y').node().getBoundingClientRect().width) ||
                                        (d3.select('.c3-axis-x').node().getBoundingClientRect().width * 100 / (chartSize.width - d3.select('.c3-axis-y').node().getBoundingClientRect().width) > 90))) {
                                        setMultilineLabels();
                                    }
                                }
                            }

                            self.elevationChartLabelsRAF = requestAnimationFrame(hasSize);
                        }
                        else if (((d3.select('.c3-axis-x').node().getBoundingClientRect().width >= chartSize.width - d3.select('.c3-axis-y').node().getBoundingClientRect().width) ||
                            (d3.select('.c3-axis-x').node().getBoundingClientRect().width * 100 / (chartSize.width - d3.select('.c3-axis-y').node().getBoundingClientRect().width) > 90))) {
                            setMultilineLabels();
                        }

                        if (!self.isMinimized()) {
                            self._$div.find('.prsidebar-body').fadeIn('slide');
                        }

                        self._$div.find('.' + self.CLASS + '-table').hide();

                    }
                }
                else {
                    result = {
                        msg: self.getLocaleString("geo.trk.chart.chpe.empty")
                    };
                }
                break;
        }
        return result;
    };

    const getTime = function (timeFrom, timeTo) {
        var diff = timeTo - timeFrom;
        var d = {
            s: Math.floor((diff / 1000) % 60),
            m: Math.floor(((diff / (1000 * 60)) % 60)),
            h: Math.floor(((diff / (1000 * 60 * 60)) % 24))
        };

        return $.extend({}, d, { toString: ("00000" + d.h).slice(-2) + ':' + ("00000" + d.m).slice(-2) + ':' + ("00000" + d.s).slice(-2) });
    };

    ctlProto.getElevationChartTooltip = function (data) {
        const self = this;
        const coords = self.elevationProfileCoordinates;
        var distance = data[0].x;
        distance = distance / 1000;

        const p = coords[data[0].index];
        var doneTime;
        if (coords[0].length == 4 && coords[0][3] > 0) {
            doneTime = getTime(coords[0][3], p[3]);
        }

        const locale = self.map.options.locale && self.map.options.locale.replace('_', '-') || undefined;
        const ele = parseInt(data[0].value.toFixed(0)).toLocaleString(locale);
        var dist;
        var measure;
        if (distance < 1) {
            dist = Math.round(distance * 1000);
            measure = ' m';
        } else {
            dist = Math.round(distance * 100) / 100;
            measure = ' km';
        }
        dist = dist.toLocaleString(locale);
        return '<div class="track-elevation-tooltip"><div><span>' + ele + ' m </span><br><span>' + dist + measure + ' </span></div>' + (doneTime ? '<span>' + doneTime.toString + '</span><div/>' : '');
    };

    ctlProto.register = function (map) {
        var self = this;

        TC.Control.prototype.register.call(self, map);

        self.wrap.register(map);

        if (self.openOn) {
            self.map.$events.one(self.openOn, function (e, args) {
                self.content.fnOpen.call(self, args.data);
            });
        }

        if (self.closeOn) {
            self.map.$events.one(self.closeOn, function (e, args) {
                self.close();
            });
        }

        if (self.options.openOn) {
            self.map.$events.on(self.options.openOn, function (e, args) {
                self.content.fnOpen.call(self, args.data);
            });
        }

        if (self.options.closeOn) {
            self.map.$events.on(self.options.closeOn, function (e, args) {
                self.close();
            });
        }
    };

    ctlProto.exportToExcel = function () {
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
        if (!TC.Util.ExcelExport) {
            TC.loadJS(true, TC.apiLocation + 'TC/TC.Util.ExcelExport', function () {
                _fncSave(new TC.Util.ExcelExport());
            });
        }
        else {
            _fncSave(new TC.Util.ExcelExport());
        }
    };
})();
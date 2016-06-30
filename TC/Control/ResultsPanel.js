TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

TC.Consts.event.RESULTTOOLTIP = 'resulttooltip.tc';
TC.Consts.event.RESULTTOOLTIPEND = 'resulttooltipend.tc';
TC.control.ResultsPanel = function () {
    var self = this;
    self.data = {};

    self.contentType = {
        TABLE: {            
            fnOpen: TC.control.ResultsPanel.prototype.openTable
        },
        CHART: {            
            fnOpen: TC.control.ResultsPanel.prototype.openChart
        }
    };

    self.content = self.contentType.TABLE;

    TC.Control.apply(self, arguments);
};

TC.inherit(TC.control.ResultsPanel, TC.Control);

TC.control.ResultsPanel.prototype.CLASS = 'tc-ctl-results';
TC.control.ResultsPanel.prototype.template = {};

if (TC.isDebug) {
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS] = TC.apiLocation + "TC/templates/ResultsPanel.html";
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS + '-table'] = TC.apiLocation + "TC/templates/ResultsPanelTable.html";
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS + '-chart'] = TC.apiLocation + "TC/templates/ResultsPanelChart.html";
} else {
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS] = function () { dust.register(TC.control.ResultsPanel.prototype.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div class=\"panel-group sidebar-body \" id=\"accordion-left\" style=\"display: none\"><div class=\"panel panel-default\"><div class=\"panel-heading\"><h4 class=\"panel-title\"><label>").h("i18n", ctx, {}, { "$key": "geo.trk.chart.chpe" }).w("</label> <span class=\"pull-right slide-submenu slide-submenu-close\" title=\"").h("i18n", ctx, {}, { "$key": "close" }).w("\"><i class=\"fa fa-times\"></i></span><span class=\"pull-right slide-submenu slide-submenu-min\" title=\"").h("i18n", ctx, {}, { "$key": "hide" }).w("\"><i class=\"fa fa-chevron-left\"></i></span><span class=\"pull-right slide-submenu slide-submenu-csv\" hidden title=\"").h("i18n", ctx, {}, { "$key": "export.excel" }).w("\"><i class=\"fa fa-file-excel-o\"></i></span></h4></div><div id=\"results\" class=\"panel-collapse collapse in\"><div class=\"panel-body list-group tc-ctl-results-table\">").p("tc-ctl-results-table", ctx, ctx.rebase(ctx.getPath(true, [])), {}).w("</div><div class=\"panel-body list-group tc-ctl-results-chart\"></div></div></div></div><div class=\"mini-submenu mini-submenu-max pull-left\" style=\"display: none;\" title=\"").h("i18n", ctx, {}, { "$key": "show" }).w("\"><i class=\"fa fa-list-alt\"></i></div>"); } body_0.__dustBody = !0; return body_0 };
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS + '-table'] = function () { dust.register(TC.control.ResultsPanel.prototype.CLASS + '-table', body_0); function body_0(chk, ctx) { return chk.w("<table class=\"table\" style=\"display:none;\"><thead>").s(ctx.get(["columns"], false), ctx, { "block": body_1 }, {}).w("</thead><tbody>").s(ctx.get(["results"], false), ctx, { "block": body_2 }, {}).w("</tbody></table>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<th>").f(ctx.getPath(true, []), ctx, "h").w("</th>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<tr>").h("iterate", ctx, { "block": body_3 }, { "on": ctx.getPath(true, []) }).w("</tr>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<td>").f(ctx.get(["value"], false), ctx, "h").w("</td>"); } body_3.__dustBody = !0; return body_0 };
    TC.control.ResultsPanel.prototype.template[TC.control.ResultsPanel.prototype.CLASS + '-chart'] = function () { dust.register(TC.control.ResultsPanel.prototype.CLASS + '-chart', body_0); function body_0(chk, ctx) { return chk.w("<div id=\"track-chart\">").x(ctx.get(["msg"], false), ctx, { "else": body_1, "block": body_2 }, {}).w("</div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<span id=\"spentTime\" style=\"display:none;\">").f(ctx.get(["time"], false), ctx, "h").w("</span><div id=\"chart\"></div>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.f(ctx.get(["msg"], false), ctx, "h"); } body_2.__dustBody = !0; return body_0 };
}

TC.control.ResultsPanel.prototype.render = function (callback) {
    var self = this;

    TC.Control.prototype.render.call(self, function () {
        self._$div.find('.slide-submenu-min').on('click', function () {
            self.minimize();
        });

        self._$div.find('.slide-submenu-close').on('click', function () {
            self.close();
        });

        self._$div.find('.mini-submenu-max').on('click', function () {
            self.maximize();
        });

        self.content = self.contentType[self.options.content.toUpperCase()] || self.content;        
    });
};

TC.control.ResultsPanel.prototype.minimize = function () {
    var self = this;

    self._$div.find('.sidebar-body').toggle('slide', function () {
        self._$div.find('.mini-submenu-max').fadeIn();
    });
};

TC.control.ResultsPanel.prototype.maximize = function () {
    var self = this;

    self._$div.find('.sidebar-body').toggle('slide');
    self._$div.find('.mini-submenu-max').hide();
};

TC.control.ResultsPanel.prototype.close = function () {
    var self = this;

    self._$div.find('.sidebar-body').fadeOut('slide');
};

TC.control.ResultsPanel.prototype.openChart = function () {
    var self = this;

    var data = arguments.data || arguments[0].data;
    if (data) {

        if (data.msg) {
            self.map.toast(data.msg);
        }
        else {
            self.getRenderedHtml(TC.control.ResultsPanel.prototype.CLASS + '-chart', { time: data.time }, function (out) {
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

                if (self.options.chart.tooltip) {
                    chartOptions.tooltip = {
                        contents: function (d) {
                            return TC.Util.getFNFromString(self.options.chart.tooltip).call(eval(self.options.chart.ctx), d);
                        }
                    }
                }

                if (self.options.chart && self.options.chart.onmouseout) {
                    chartOptions.onmouseout = function () {
                        TC.Util.getFNFromString(self.options.chart.onmouseout).call(eval(self.options.chart.ctx));
                    };
                }

                chartOptions = $.extend({}, chartOptions, data);
                
                if (window.c3) {
                    c3.generate(chartOptions);
                }
                else {
                    TC.loadJS(!window.c3, [TC.Consts.url.D3C3], function () {
                        c3.generate(chartOptions);
                    });
                }
            });

            self._$div.find('.sidebar-body').fadeIn('slide');
        }
    } else {
        self.map.toast(data.msg);        
    }

    self.map.getLoadingIndicator().hide();
};

TC.control.ResultsPanel.prototype.openTable = function () {
    var self = this;

    var columns = arguments.columns, data = arguments.data;

    /**
     * Borra del JSON de datos las columnas que no se quieren mostrar
     */
    var deleteColumns = function () {
        for (var i = 0; i < data.length; i++) {
            for (var k in data[i]) {
                if (columns.indexOf(k) < 0) {
                    delete data[i][k];
                }
            }
        }
    };

    if (data && data.length > 0) {
        //Si no recibe columnas, las extrae de las claves del primer objeto de la colección de datos
        if (!columns) {
            columns = [];
            for (var k in data[0]) {
                columns.push(k);
            }
        }

        deleteColumns();

        self.tableData = {
            columnNames: columns,
            data: data
        }

        dust.render(TC.control.ResultsPanel.prototype.CLASS + '-table', {
            columns: columns, results: data
        }, function (err, out) {
            self._$div.find('.' + TC.control.ResultsPanel.prototype.CLASS + '-table').html(out);
        });

        self._$div.find('.sidebar-body').fadeIn('slide');
    } else {
        TC.alert("No se han encontrado resultados");
    }

    self.map.getLoadingIndicator().hide();

};

TC.control.ResultsPanel.prototype.open = function (data, columns) {
    var self = this;

    /**
     * Borra del JSON de datos las columnas que no se quieren mostrar
     */
    var deleteColumns = function () {
        for (var i = 0; i < data.length; i++) {
            for (var k in data[i]) {
                if (columns.indexOf(k) < 0) {
                    delete data[i][k];
                }
            }
        }
    };

    if (data && data.length > 0) {
        //Si no recibe columnas, las extrae de las claves del primer objeto de la colección de datos
        if (!columns) {
            columns = [];
            for (var k in data[0]) {
                columns.push(k);
            }
        }

        deleteColumns();

        self.tableData = {
            columnNames: columns,
            data: data
        }

        dust.render(TC.control.ResultsPanel.prototype.CLASS + '-table', {
            columns: columns, results: data
        }, function (err, out) {
            self._$div.find('.' + TC.control.ResultsPanel.prototype.CLASS + '-table').html(out);
        });

        self._$div.find('.sidebar-body').fadeIn('slide');
    } else {
        TC.alert("No se han encontrado resultados");
    }


    self.map.getLoadingIndicator().hide();

};

TC.control.ResultsPanel.prototype.register = function (map) {
    var self = this;
    TC.Control.prototype.register.call(self, map);

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


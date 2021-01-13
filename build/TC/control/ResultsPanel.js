
TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

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
        FA: 'fa',
        SHOW_IN: 'showIn',
        SHOW_OUT: 'showOut'
    };

    self.content = self.contentType.TABLE;

    if (TC.Util.isEmptyObject(self.options)) {
        self.options = { content: "table" };
    }

    if (self.options || { content: "table" }) {
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

    ctlProto.CHART_SIZE = {
        MIN_HEIGHT: 75,
        MAX_HEIGHT: 128,

        MIN_WIDTH: 215,
        MEDIUM_WIDTH: 310,
        MAX_WIDTH: 445
    };

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-p-results.hbs";
    ctlProto.template[ctlProto.CLASS + '-table'] = TC.apiLocation + "TC/templates/tc-ctl-p-results-table.hbs";
    ctlProto.template[ctlProto.CLASS + '-chart'] = TC.apiLocation + "TC/templates/tc-ctl-p-results-chart.hbs";

    const isElementVisible = function (elm) {
        const computedStyle = getComputedStyle(elm);
        return (elm && !elm.hidden && computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden');
    };

    ctlProto.isVisible = function () {
        const self = this;
        const bodyElm = self.div.querySelector('.prsidebar-body');
        const maximizeElm = self.div.querySelector('.prcollapsed-max');
        return isElementVisible(bodyElm) || isElementVisible(maximizeElm);
    };

    ctlProto.isMinimized = function () {
        const self = this;
        const bodyElm = self.div.querySelector('.prsidebar-body');
        const maximizeElm = self.div.querySelector('.prcollapsed-max');
        return isElementVisible(maximizeElm) && !isElementVisible(bodyElm);
    };

    const manageClassList = function (classElement, toAdd, toRemove) {
        const self = this;

        const elm = self.div.querySelector('.' + classElement);
        if (elm) {
            elm.classList.add(toAdd);
            elm.classList.remove(toRemove);
        }
    };

    ctlProto.show = function (classElement) {
        const self = this;

        const elm = self.div.querySelector('.' + classElement);
        if (elm && elm.style.display === 'none') {
            elm.style.display = '';
        }

        manageClassList.call(self, classElement, self.classes.SHOW_IN, self.classes.SHOW_OUT);
    };

    ctlProto.hide = function (classElement) {
        const self = this;

        manageClassList.call(self, classElement, self.classes.SHOW_OUT, self.classes.SHOW_IN);

        const elm = self.div.querySelector('.' + classElement);
        if (elm) {
            elm.style.display = 'none';
        }
    };

    ctlProto.doVisible = function () {
        const self = this;

        self.div.classList.remove(TC.Consts.classes.HIDDEN);
        self.show('prsidebar-body');
    };

    ctlProto.render = function (callback) {
        const self = this;

        self.div.classList.add(TC.Consts.classes.HIDDEN);

        return TC.Control.prototype.render.call(self, function () {

            self.mainTitleElm = self.div.querySelector('.prpanel-title-text');

            self.minimizeButton = self.div.querySelector('.prcollapsed-slide-submenu-min');
            self.minimizeButton.addEventListener('click', function () {
                self.minimize();
            });

            self.closeButton = self.div.querySelector('.prcollapsed-slide-submenu-close');
            self.closeButton.addEventListener('click', function () {
                self.close();
            });

            self.maximizeButton = self.div.querySelector('.prcollapsed-max');
            self.maximizeButton.addEventListener('click', function () {
                self.maximize();
            });                     

            if (self.save) {
                self.saveButton = self.div.querySelector('.prcollapsed-slide-submenu-csv');
                self.saveButton.addEventListener('click', function () {
                    self.exportToExcel();
                });
                self.saveButton.removeAttribute('hidden');
            }
            if (self.options.download && self.options.content === "table") {
                self.downloadButton = self.div.querySelector('.prcollapsed-slide-submenu-dwn');
                self.downloadButton.addEventListener('click', function () {
                    if (TC.Util.isFunction(self.options.download)) {
                        self.options.download.apply(self, []);
                    }
                });
                self.downloadButton.removeAttribute('hidden');
            }


            if (self.content) {
                self.content = self.content;

                if (self.options.titles) {

                    if (self.options.titles.main) {
                        self.mainTitleElm.setAttribute('title', self.options.titles.main);
                        self.mainTitleElm.innerHTML = self.options.titles.main;
                    }

                    if (self.options.titles.max) {
                        self.maximizeButton.setAttribute('title', self.options.titles.max);
                    }                    
                } else {
                    self.mainTitleElm.setAttribute('title', self.getLocaleString("rsp.title"));
                    self.mainTitleElm.innerHTML = self.getLocaleString("rsp.title");
                }
            }

            const collapsedElm = self.div.querySelector(self.content.collapsedClass);
            //collapsedElm.hidden = false;
            collapsedElm.classList.add(self.classes.FA);

            self.infoDiv = self.div.querySelector('.' + self.CLASS + '-info');
            self.tableDiv = self.div.querySelector('.' + self.CLASS + '-table');
            //self.$divChart = self._$div.find('.' + self.CLASS + '-chart');
            self.menuDiv = self.div.querySelector('.' + self.CLASS + '-menu');

            if (TC.browserFeatures.touch()) {
                TC.Util.swipe(self.div, {
                    left: function () {
                        self.minimize();
                    }
                });
            }

            if (callback && typeof (callback) === "function")
                callback.call();
        });
    };

    ctlProto.minimize = function () {
        const self = this;

        const collapsedElm = self.div.querySelector(self.content.collapsedClass);
        if (!isElementVisible(collapsedElm)) { // ya está minimizado
            collapsedElm.classList.add(self.classes.FA);
            collapsedElm.hidden = false;

            self.hide('prsidebar-body');
            self.show('prcollapsed-max');

            self.map.trigger(TC.Consts.event.RESULTSPANELMIN, { control: self });
        }
    };

    ctlProto.maximize = function () {
        const self = this;

        const collapsedElm = self.div.querySelector(self.content.collapsedClass);
        if (isElementVisible(collapsedElm)) { // ya está maximizado
            collapsedElm.hidden = true;

            self.show('prsidebar-body');
            self.hide('prcollapsed-max');

            self.map.trigger(TC.Consts.event.RESULTSPANELMAX, { control: self });
        }
    };    

    ctlProto.close = function () {
        const self = this;

        self.div.classList.add(TC.Consts.classes.HIDDEN);

        if (self.chart && self.chart.chart) {
            self.chart.chart = self.chart.chart.destroy();
        }

        const body = self.div.querySelector('.prsidebar-body');
        if (body) {
            body.style.display = 'none';
            self.div.querySelector('.prcollapsed-max').style.display = 'none';

            const collapsedElm = self.div.querySelector(self.content.collapsedClass);
            collapsedElm.hidden = true;
            collapsedElm.classList.remove(self.classes.FA);

            self.map.trigger(TC.Consts.event.RESULTSPANELCLOSE, { control: self });
        }
    };

    ctlProto.openChart = function (data) {
        const self = this;

        self.div.classList.remove(TC.Consts.classes.HIDDEN);

        // Cerramos el resto de los perfiles
        self.map.getControlsByClass(TC.control.ResultsPanel)
            .filter(function (ctl) {
                return ctl !== self;
            })
            .filter(function (ctl) {
                return ctl.options.content === 'chart';
            })
            .forEach(function (ctl) {
                ctl.close();
            });

        if (data) {

            if (data.msg) {
                self.map.toast(data.msg);
                if (self.isVisible()) {
                    self.hide('prsidebar-body');
                }
            }
            else {
                self.elevationProfileChartData = data;
                self.renderElevationProfileChart({
                    data: data,
                    div: self.div.querySelector('.' + ctlProto.CLASS + '-chart')
                });
            }
        } else {
            self.map.toast(options.msg);
        }
    };

    const formatYAxis = function (d, locale) {
        let y = (parseInt(d.toFixed(0)) || 0);
        return y.toLocaleString(locale) + ' m';
    };

    ctlProto.renderElevationProfileChart = function (options) {
        const self = this;
        options = options || {};
        TC.loadJS(!window.c3,
            TC.Consts.url.D3C3 || TC.apiLocation + 'lib/d3c3/d3c3.min.js',
            function () {
                const data = options.data;
                data.ele = data.ele.map(val => val === null ? 0 : val);
                const div = options.div;
                let locale = TC.Util.getMapLocale(self.map);

                var templateData = {
                    upHill: data.upHill ? data.upHill.toLocaleString(locale) : '0',
                    downHill: data.downHill ? data.downHill.toLocaleString(locale) : '0'
                };

                if (data.elevationFromServiceChartData) {
                    templateData.min = formatYAxis(data.min, locale);
                    templateData.max = formatYAxis(data.max, locale);

                    templateData.secondChart = {
                        upHill: data.elevationFromServiceChartData.upHill ? data.elevationFromServiceChartData.upHill.toLocaleString(locale) : '0',
                        downHill: data.elevationFromServiceChartData.downHill ? data.elevationFromServiceChartData.downHill.toLocaleString(locale) : '0',
                        min: formatYAxis(data.elevationFromServiceChartData.min, locale),
                        max: formatYAxis(data.elevationFromServiceChartData.max, locale)
                    };
                }

                self.getRenderedHtml(ctlProto.CLASS + '-chart', templateData, function (out) {

                    div.innerHTML = out;
                    div.style.display = '';

                    if (self.options.titles) {

                        if (self.options.titles.main) {
                            const titleElm = self.div.querySelector('.prpanel-title-text');
                            titleElm.setAttribute('title', self.options.titles.main);
                            titleElm.innerHTML = self.options.titles.main;
                        }

                        if (self.options.titles.max) {
                            self.div.querySelector('.prcollapsed-max').setAttribute('title', self.options.titles.max);
                        }
                    }

                    var legendOptions = { show: false };
                    if (data.elevationFromServiceChartData) {
                        legendOptions = {
                            position: 'inset',
                            inset: {
                                anchor: "bottom-left",
                                x: -55,
                                y: -30,
                                step: 1
                            }
                        };
                    }

                    var chartOptions = TC.Util.extend({
                        bindto: div.querySelector('.tc-chart'),
                        padding: {
                            top: 13, // por el nuevo diseño del tooltip añado 13  //data.elevationFromServiceChartData ? 10 : 0,
                            right: 15,
                            bottom: 0,
                            left: 45,
                        },
                        legend: legendOptions
                    }, self.createChartOptions(data));

                    if (self.chart.tooltip) {
                        chartOptions.tooltip = {
                            position: function (data, width, height, element) {
                                let container = document.querySelector('.c3-tooltip-container');
                                let chartOffsetX = document.querySelector(".c3").getBoundingClientRect().left;
                                let graphOffsetX = document.querySelector(".c3 g.c3-axis-y").getBoundingClientRect().right;
                                let tooltipWidth = container.clientWidth;
                                let x = (parseInt(element.getAttribute('x'))) + graphOffsetX - chartOffsetX - Math.floor(tooltipWidth / 2);                                

                                // alto del tooltipOnBottom
                                let xAxisHeight = document.querySelector(".c3 g.c3-axis-x").getBoundingClientRect().height + 2;
                                let onBottom = container.querySelector(".onBottom");
                                if (onBottom && xAxisHeight) {
                                    onBottom.style.height = xAxisHeight + 'px';
                                }
                                return { top: 0, left: x };
                            },
                            contents: function (d) {
                                var fn = self.chart.tooltip;
                                if (typeof (fn) !== "function")
                                    fn = TC.Util.getFnFromString(self.chart.tooltip);
                                return fn.call(eval(self.chart.ctx), d);
                            }
                        }
                    }

                    if (self.chart && self.chart.onmouseout) {
                        chartOptions.onmouseout = function () {
                            var fn = self.chart.onmouseout;
                            if (typeof (fn) !== "function")
                                fn = TC.Util.getFnFromString(self.chart.onmouseout);
                            fn.call(eval(self.chart.ctx));
                        };
                    }

                    chartOptions.onrendered = function () {
                        if (TC.Util.isFunction(chartOptions._onrendered)) {
                            chartOptions._onrendered.call(this);
                        }
                        self.map.trigger(TC.Consts.event.DRAWCHART, { control: self, svg: this.svg[0][0], chart: this });
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

    const closeOpenedTableResultsPanel = function () {
        const self = this;

        self.map.getControlsByClass(TC.control.ResultsPanel)
            .filter(function (ctl) {
                return ctl !== self && ctl.isVisible();
            })
            .filter(function (ctl) {
                return ctl.options.content !== 'chart';
            })
            .forEach(function (ctl) {
                ctl.close();
            });
    };

    ctlProto.openTable = function () {
        var self = this;

        self.div.classList.remove(TC.Consts.classes.HIDDEN);

        var data = arguments[0];
        if (data) {

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
                    const table = self.div.querySelector('.' + self.CLASS + '-table');
                    const parent = table.parentElement;
                    parent.removeChild(table);
                    table.innerHTML = html;
                    parent.appendChild(table);
                    if (self.tableData.callback) {
                        self.tableData.callback(table);
                    }

                    closeOpenedTableResultsPanel.call(self);

                    self.map.trigger(TC.Consts.event.DRAWTABLE, { control: self });
                });

                self.div.querySelector('.' + self.CLASS + '-chart').style.display = 'none';
                self.div.querySelector('.' + self.CLASS + '-info').style.display = 'none';

                self.show('prsidebar-body');
            }
        }
    };

    ctlProto.open = function (html, container) {
        const self = this;
        
        self.div.classList.remove(TC.Consts.classes.HIDDEN);

        const toCheck = container || self.div.querySelector('.' + self.CLASS + '-table');
        var checkIsRendered = function () {
            var clientRect = toCheck.getBoundingClientRect();
            if (clientRect && clientRect.width > 100) {
                window.cancelAnimationFrame(this.requestIsRendered);

                //closeOpenedTableResultsPanel.call(self);
                this.map.trigger(TC.Consts.event.DRAWTABLE, { control: self });
            }
        };

        self.requestIsRendered = window.requestAnimationFrame(checkIsRendered.bind(self));

        const chartElm = self.div.querySelector('.' + self.CLASS + '-chart');
        chartElm.style.display = 'none';
        const tableElm = self.div.querySelector('.' + self.CLASS + '-table');
        tableElm.style.display = 'none';
        const infoElm = self.div.querySelector('.' + self.CLASS + '-info');
        infoElm.style.display = 'none';

        if (html) {
            if (container) {
                self.getTableContainer = function () {
                    return container;
                };
                container.innerHTML = html;
                container.style.display = '';
            } else {
                tableElm.innerHTML = html;
                tableElm.style.display = '';
            }
        }
        else {
            if (chartElm.childElementCount) {
                chartElm.style.display = '';
            }
            else if (tableElm.childElementCount) {
                tableElm.style.display = '';
            }
            else if (infoElm.childElementCount) {
                infoElm.style.display = '';
            }
        }

        const maximizeElm = self.div.querySelector('.prcollapsed-max');

        if (self.options.titles) {

            if (self.options.titles.main) {
                const titleElm = self.div.querySelector('.prpanel-title-text');
                titleElm.setAttribute('title', self.options.titles.main);
                titleElm.innerHTML = self.options.titles.main;
            }

            if (self.options.titles.max) {
                maximizeElm.setAttribute('title', self.options.titles.max);
            }
        }

        if (self.options.classes) {
            if (self.options.classes.collapsed) {
                maximizeElm.querySelector('i.fa-list-alt').classList.add(self.options.classes.collapsed);
            }
        }

        // si está minimizado
        const collapsedElm = self.div.querySelector(self.content.collapsedClass);
        if (isElementVisible(collapsedElm)) {
            self.maximize();
        }

        self.show('prsidebar-body');
        self.hide('prcollapsed-max');
    };

    ctlProto.loadDataOnChart = function (data) {
        const self = this;

        // puede llegar aquí después de borrar un track.
        if (self.chart && self.chart.chart) {
            self.chart.chart.unload({
                done: function () {
                    self.elevationProfileChartData = data;
                    self.renderElevationProfileChart({
                        data: data,
                        div: self.div.querySelector('.' + ctlProto.CLASS + '-chart')
                    });
                }
            });
        }
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
                        const panelStyle = getComputedStyle(self.getContainerElement());
                        const docWidth = document.documentElement.clientWidth / 100 * 40; // css panel contendor
                        const r = {
                            height: docWidth > 445 ? options.maxHeight || self.CHART_SIZE.MAX_HEIGHT : options.minHeight || self.CHART_SIZE.MIN_HEIGHT
                        };
                        // Si el panel ocupa el ancho del mapa dejamos el ancho del perfil que ocupe todo, en cualquier otro caso tenemos tres anchos predefinidos.
                        if (panelStyle.width === getComputedStyle(self.map.div).width) {
                            r.width = parseFloat(panelStyle.width) * 0.95;
                        }
                        else {
                            r.width = docWidth > 445 ? options.maxWidth || self.CHART_SIZE.MAX_WIDTH : docWidth > 310 ? options.mediumWidth || self.CHART_SIZE.MEDIUM_WIDTH : options.minWidth || self.CHART_SIZE.MIN_WIDTH
                        }
                        return r;
                    };
                    const gradIds = ['grad' + TC.getUID()];

                    let maxy = Number.NEGATIVE_INFINITY;
                    let miny = Number.POSITIVE_INFINITY;
                    options.ele.forEach(function (y) {
                        if (typeof y === 'number') {
                            maxy = Math.max(y, maxy);
                            miny = Math.min(y, miny);
                        }
                    });

                    let xColumn = [...options.x];
                    let eleColumn = [...options.ele];

                    result = {
                        data: {
                            x: 'x',
                            columns: [
                                ['x'].concat(xColumn),
                                ['ele'].concat(eleColumn)
                            ],
                            types: {
                                'ele': 'area-spline'
                            },
                            colors: {
                                "ele": 'url(#' + gradIds[0] + ')'
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
                                        return formatYAxis(d, locale);
                                    }
                                }
                            }
                        },
                        onresize: function () {
                            this.api.resize(getChartSize());
                        }
                    };

                    if (options.elevationFromServiceChartData) {
                        result.data.names = {
                            ele: self.getLocaleString("geo.profile.fromTrack"),
                            ele2: self.getLocaleString("mdt")
                        };
                        result.data.columns.push(['ele2'].concat(options.elevationFromServiceChartData.ele));

                        result.data.types.ele2 = options.elevationFromServiceChartData.type;
                        gradIds.push('grad' + TC.getUID());
                        result.data.colors.ele2 = 'url(#' + gradIds[gradIds.length - 1] + ')';
                        result.data.axes = {
                            ele: 'y'
                        };                        

                        if (eleColumn.every((val) => val === 0)) {
                            result.axis.y.min = Math.min(...options.elevationFromServiceChartData.ele);
                            result.axis.y.max = Math.max(...options.elevationFromServiceChartData.ele);
                        } else if (options.elevationFromServiceChartData.ele.every((val) => val === 0)) {
                            result.axis.y.min = Math.min(...eleColumn);
                            result.axis.y.max = Math.max(...eleColumn);
                        } else {
                            result.axis.y.min = Math.min(...eleColumn.concat(options.elevationFromServiceChartData.ele));
                            result.axis.y.max = Math.max(...eleColumn.concat(options.elevationFromServiceChartData.ele));
                        }
                    }

                    if (options.time) result.time = ("00000" + options.time.h).slice(-2) + ':' + ("00000" + options.time.m).slice(-2) + ':' + ("00000" + options.time.s).slice(-2);

                    var rendered = false;
                    result._onrendered = function () {
                        if (!rendered) {
                            rendered = true;

                            if (options.elevationFromServiceChartData) {
                                // redondeamos los cuadritos de la leyenda.
                                document.querySelectorAll('.c3-legend-item-tile').forEach((item) => {
                                    item.setAttribute('rx', 5);
                                    item.setAttribute('ry', 1);
                                });
                                // añdimos title a los elementos de la leyenda
                                document.querySelectorAll('.c3-legend-item').forEach((item) => {
                                    var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                                    title.textContent = self.getLocaleString("hide");
                                    item.appendChild(title);

                                    item.addEventListener(TC.Consts.event.CLICK, function () {
                                        if (item.classList.contains(TC.Consts.classes.HIDDEN)) {
                                            item.querySelector('title').textContent = self.getLocaleString("hide");
                                        } else {
                                            item.querySelector('title').textContent = self.getLocaleString("show");
                                        }

                                        item.classList.toggle(TC.Consts.classes.HIDDEN);
                                    }, { passive: true });
                                });
                            }
                        }

                        const svg = this.svg[0][0];
                        var svgDefsElement = svg.getElementsByTagName('defs')[0];
                        var xmlns = "http://www.w3.org/2000/svg";

                        const createLinearGradient = function (id, colors) {
                            var grad = document.createElementNS(xmlns, "linearGradient");
                            grad.setAttributeNS(null, "id", id);
                            grad.setAttributeNS(null, "x1", "0%");
                            grad.setAttributeNS(null, "x2", "0%");
                            grad.setAttributeNS(null, "y1", "0%");
                            grad.setAttributeNS(null, "y2", "100%");
                            grad.setAttributeNS(null, "gradientUnits", "userSpaceOnUse");

                            const stop0 = document.createElementNS(xmlns, "stop");
                            stop0.setAttributeNS(null, "offset", "0%");
                            stop0.setAttributeNS(null, "stop-color", colors[0]);
                            stop0.setAttributeNS(null, "stop-opacity", "0.7");
                            grad.appendChild(stop0);

                            const stop50 = document.createElementNS(xmlns, "stop");
                            stop50.setAttributeNS(null, "offset", "50%");
                            stop50.setAttributeNS(null, "stop-color", colors[1]);
                            stop50.setAttributeNS(null, "stop-opacity", "0.9");
                            grad.appendChild(stop50);

                            const stop100 = document.createElementNS(xmlns, "stop");
                            stop100.setAttributeNS(null, "offset", "100%");
                            stop100.setAttributeNS(null, "stop-color", colors[2]);
                            stop100.setAttributeNS(null, "stop-opacity", "1");
                            grad.appendChild(stop100);

                            svgDefsElement.appendChild(grad);
                        };

                        createLinearGradient(gradIds[0], ["red", "orange", "green"]);
                        if (options.elevationFromServiceChartData) {
                            createLinearGradient(gradIds[gradIds.length - 1], ["blue", "cian", "green"]);
                        }

                        const d3Node = d3.select(".c3-brush").node();
                        if (d3Node) {
                            d3Node.parentNode.removeChild(d3Node);
                        }

                        d3.select(".c3-event-rects,.c3-event-rects-single")
                            .selectAll("rect")
                            .style("cursor", "pointer")
                            .on("click", function (e) {
                                d3.event.stopPropagation();
                                let point = self.elevationProfileChartData.coords[e.index];
                                if (point) {
                                    point = point.slice(0, 2);
                                    TC.loadJS(!TC.feature || (TC.feature && !TC.feature.Point),
                                        [TC.apiLocation + 'TC/feature/Point'],
                                        function () {
                                            self.map.zoomToFeatures([new TC.feature.Point(point, {})]);
                                        }
                                    );
                                }
                            });

                        const path = d3.select('.c3-axis.c3-axis-x').select('path');
                        if (!path.empty()) {
                            let pattern = path.attr('d');
                            let match = /^M\d\,(\d)V\dH\d{3}V(\d)$/i.exec(pattern);
                            if (match) { // quitamos las barritas de los extremos del axis-x
                                pattern = pattern.replace(/(M\d\,)\d/i, "$10").replace(/(H\d{3}V)(\d)/i, "$10");
                                path.attr('d', pattern);
                            } else {
                                let match = /^M\s\d\s(\d)\sV\s\d\sH\s\d{3}\sV\s(\d)$/i.exec(pattern);
                                if (match) { // quitamos las barritas de los extremos del axis-x
                                    pattern = pattern.replace(/(M\s\d\s)\d/i, "$10").replace(/(H\s\d{3}\sV\s)(\d)/i, "$10");
                                    path.attr('d', pattern);
                                }
                            }
                        }
                        


                        const svgRect = svg.getBoundingClientRect();
                        const chartSize = {
                            width: svgRect.width,
                            height: svgRect.height
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

                                            if (d3text.node().childNodes.length === 1) {
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

                        // pasamos el perfil original adelante si no no se aprecian bien las diferencias por el color y si lo gestionamos antes afecta a la leyenda
                        d3.select('svg').select(".c3-chart-lines").selectAll(".c3-target-ele").each(function () {
                            this.parentNode.appendChild(this);
                        });

                        if (!self.isMinimized()) {
                            self.show('prsidebar-body');
                            self.hide('prcollapsed-max');
                        }


                        self.div.querySelector('.' + self.CLASS + '-table').style.display = '';
                        self.div.querySelector('.' + self.CLASS + '-info').style.display = '';
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
        var d = {};
        var daysDifference = Math.floor(diff / 1000 / 60 / 60 / 24);
        diff -= daysDifference * 1000 * 60 * 60 * 24;

        var hoursDifference = Math.floor(diff / 1000 / 60 / 60);
        diff -= hoursDifference * 1000 * 60 * 60;

        d.h = hoursDifference + (daysDifference * 24);

        var minutesDifference = Math.floor(diff / 1000 / 60);
        diff -= minutesDifference * 1000 * 60;

        d.m = minutesDifference;

        d.s = Math.floor(diff / 1000);

        return TC.Util.extend({}, d, { toString: ("00000" + d.h).slice(-2) + ':' + ("00000" + d.m).slice(-2) + ':' + ("00000" + d.s).slice(-2) });
    };

    ctlProto.getElevationChartTooltip = function (data) {        
        const self = this;
        const locale = self.map.options.locale && self.map.options.locale.replace('_', '-') || undefined;
        const coords = self.elevationProfileChartData.coords;
        const getElevationByDataElem = function (dataElem) {
            return dataElem.value ? parseInt(dataElem.value.toFixed(0)).toLocaleString(locale) : "0";
        };
        const p = coords[data[0].index];
        let doneTime;
        if (coords[0].length == 4 && coords[0][3] > 0 && p) {
            doneTime = getTime(coords[0][3], p[3]);
        }
        let distance = data[0].x / 1000;
        let distanceFormatted = (distance < 1 ? Math.round(distance * 1000) : Math.round(distance * 100) / 100).toLocaleString(locale) + (distance < 1 ? ' m' : ' km');

        let elevationDiv = '<div class="onTop">' +
            '<span>' +
            data.map((elem, index) => {
                if (elem) {
                    return (index === 0 ? '<span data-isNumber class="' + (elem.id === "ele" ? "original" : "mdt") + '">' + getElevationByDataElem(elem) + ' m' + '</span>' :
                        '<span data-isNumber class="' + (elem.id === "ele" ? "original" : "mdt") + '">' + getElevationByDataElem(elem) + ' m ' + '</span>');
                } else {
                    return "";
                }
            }).join('') +
            '</span >' +
            '</div>';

        let distanceAndTimeDiv = '<div class="onBottom">' +
            '<span>' + distanceFormatted + ' </span>' +
            (doneTime ? '<span>' + doneTime.toString + '</span>' + '<div/>' : '<div/>');


        return elevationDiv + distanceAndTimeDiv;        
    };

    ctlProto.getTableContainer = function () {
        return this.tableDiv;
    };

    ctlProto.getInfoContainer = function () {
        return this.infoDiv;
    };

    ctlProto.getMenuElement = function () {
        return this.menuDiv;
    };

    ctlProto.getContainerElement = function () {
        return this.div.querySelector('.prsidebar-body') || null;
    };

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.Control.prototype.register.call(self, map);

        self.wrap.register(map);

        if (self.openOn) {
            self.map.one(self.openOn, function (e, args) {
                self.content.fnOpen.call(self, e.data);
            });
        }

        if (self.closeOn) {
            self.map.one(self.closeOn, function (e, args) {
                self.close();
            });
        }

        if (self.options.openOn) {
            self.map.on(self.options.openOn, function (e, args) {
                self.content.fnOpen.call(self, e.data);
            });
        }

        if (self.options.closeOn) {
            self.map.on(self.options.closeOn, function (e, args) {
                self.close();
            });
        }

        //map.on(TC.Consts.event.VIEWCHANGE, function () {

        //    map.getControlsByClass(TC.control.ResultsPanel).filter(function (ctl) {
        //        return ctl.options.content !== "chart" && ($(ctl.div).find('.' + ctl.CLASS + '-info:visible').length === 1 || $(ctl.div).find('.' + ctl.CLASS + '-table:visible').length === 1);
        //    }).forEach(function (ctl) {
        //        ctl.close();
        //    });
        //});

        return result;
    };

    ctlProto.exportToExcel = function () {
        var _ctl = this;

        var rows = [_ctl.tableData.columns];

        _ctl.tableData.results.forEach(function (value) {
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
            TC.loadJS(true, TC.apiLocation + 'TC/Util.ExcelExport', function () {
                _fncSave(new TC.Util.ExcelExport());
            });
        }
        else {
            _fncSave(new TC.Util.ExcelExport());
        }
    };

    ctlProto.contentType = {
        TABLE: {
            fnOpen: ctlProto.openTable,
            collapsedClass: '.fa-list-alt'
        },
        CHART: {
            fnOpen: ctlProto.openChart,
            collapsedClass: '.fa-area-chart'
        }
    };
})();
import TC from '../../TC.js';
import Consts from "../Consts.js";
import WebComponentControl from "./WebComponentControl";
import Util from "../Util.js";
import Geometry from "../Geometry.js";
import Observer from "../Observer.js";
import Controller from "../Controller.js";
//import ControlEvent from "../../SITNA/control/ControlEvent.js";
import Feature from "../../SITNA/feature/Feature.js";
import Point from "../../SITNA/feature/Point.js";
import Polyline from "../../SITNA/feature/Polyline.js";
import MultiPolyline from "../../SITNA/feature/MultiPolyline.js";

const elementName = 'sitna-elevation-profile';

const elevationProfileCache = new Map();

class ElevationProfileModel {
    constructor() {
        this["geo.trk.chart.elevationGain"] = "";
        this.noElevationData = "";
    }
}

class ElevationProfile extends WebComponentControl {

    currentFeature = null;
    displayElevation = true;
    chart = {};

    #gradientsColors = {
        "mdt": ["#c52737", "#c52737", "#c52737"],
        "gps": ["#3b3bc6", "#3b3bc6", "#3b3bc6"],
        "mds": ["#60a934", "#60a934", "#60a934"]
    }


    static chartSize = {
        MIN_HEIGHT: 75,
        MAX_HEIGHT: 128,

        //MIN_WIDTH: 215,
        //MEDIUM_WIDTH: 310,
        //MAX_WIDTH: 445
    };

    static classes = {
        RESIZABLE: 'tc-resizable',
        POSITION_BOTTOM: 'tc-pos-bottom',
        POSITION_TOP: 'tc-pos-top'
    };



    #depTimestamp = 0;

    constructor() {
        super(...arguments);

        this.chart.ctx = this;
        this.chart.tooltip = this.getElevationTooltip;
        this.chart.onmouseout = this.removeElevationTooltip;

        this.wrap = new TC.wrap.control.ElevationProfile(this);

        this.model = new ElevationProfileModel();

    }

    async loadTemplates() {
        const mainTemplatePromise = import('../templates/tc-ctl-rpanel-chart.mjs');

        const template = {};
        template[this.CLASS] = (await mainTemplatePromise).default;
        this.template = template;
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);

        map
            .on(Consts.event.FEATUREMODIFY, function (e) {
                if (e.geometryChanged) self.#removeProfileFromCache(e.feature);
            })
            .on(Consts.event.FEATUREREMOVE, function (e) {
                self.#removeProfileFromCache(e.feature);
            })
            .on(Consts.event.LAYERREMOVE, function (e) {
                e.layer.features?.forEach((feat) => self.#removeProfileFromCache(feat));
            })
            .on(Consts.event.PROJECTIONCHANGE, function (e) {
                if (self.chartData) {
                    self.chartData.coords = Util.reproject(self.chartData.coords, e.oldCrs, e.newCrs);
                    if (self.chartData.secondaryElevationProfileChartData && self.chartData.secondaryElevationProfileChartData.length)
                        self.chartData.secondaryElevationProfileChartData.forEach((secElevChartData) => {
                            secElevChartData.coords = Util.reproject(secElevChartData.coords, e.oldCrs, e.newCrs);
                        });
                }
            })
            .on(Consts.event.THREED_TILES_CHANGE, function (e) {
                if (e.change === "visibility") {
                    if (self.chartData) {
                        if (e.tileset.visible) {
                            self.set3DtileData?.();
                        }
                        else {
                            self.removeDataOnChart("mds");
                        }
                    }
                }
            });

        return self;
    }

    async render() {
        await super.render();
        this.controller = new Controller(this.model, new Observer(this));
    }

    async displayElevationProfile(featureOrCoords, options = {}) {
        const self = this;
        let lines;
        switch (true) {
            case featureOrCoords instanceof Polyline:
                lines = [featureOrCoords.geometry];
                break;
            case featureOrCoords instanceof MultiPolyline:
                lines = featureOrCoords.geometry;
                break;
            case featureOrCoords instanceof Feature:
                return;
            default:
                lines = [featureOrCoords];
        }
        if (self.map.on3DView && featureOrCoords?.wrap?.feature3D) {
            lines[0] = TC.Util.reproject(lines[0], self.map.view3D.view2DCRS, self.map.getCRS());
        }
        if (featureOrCoords instanceof Feature) {
            this.currentFeature = featureOrCoords;
            const profile = this.#getCachedProfile(featureOrCoords);
            if (profile) {
                this.renderChart({
                    key: "mdt",
                    colorClass: "tc-mdt",
                    data: profile
                });
                return;
            }
        }
        const render = function (elevCoordLines, options) {
            let elevLines = elevCoordLines;
            let maxElevation = Number.NEGATIVE_INFINITY;
            let minElevation = Number.POSITIVE_INFINITY;
            const isGeo = self.map.wrap.isGeo();
            const destCrs = isGeo ? self.map.options.utmCrs : self.map.crs;
            if (self.map.getCRS() !== destCrs) {
                elevLines = Util.reproject(elevCoordLines, self.map.getCRS(), destCrs);
            }
            const profile = elevLines
                .map(line => {
                    let distance = 0.0;
                    return line.map(function calculateDistanceAndExtremes(point, idx, arr) {
                        let prev = idx === 0 ? point : arr[idx - 1];
                        distance += Math.hypot(point[0] - prev[0], point[1] - prev[1]);
                        var ele = point[2] || 0;
                        if (typeof ele === 'number') {
                            maxElevation = Math.max(ele, maxElevation);
                            minElevation = Math.min(ele, minElevation);
                        }
                        return [distance, ele];
                    });
                })
                .reduce(function (prev, curr) {
                    const lastDistance = prev[prev.length - 1][0];
                    curr.forEach(elm => elm[0] += lastDistance);
                    return prev.concat(curr);
                });

            if (profile.length === 1) {
                // Espera una línea, duplicamos el punto para que no se rompa el renderizado del gráfico
                profile.push(profile[0]);
            }
            const coords = elevLines.flat();
            let elevationData = {
                x: profile.map(function (elm) {
                    return elm[0];
                }),
                ele: profile.map(function (elm) {
                    return elm[1] || 0;
                }),
                coords,
                min: minElevation,
                max: maxElevation,
                colorClass: options.colorClass,
            };

            const elevationGainOptions = { coords };
            if (typeof self.options === 'object' && self.map.options.elevation) {
                elevationGainOptions.hillDeltaThreshold = self.options.hillDeltaThreshold || self.map.options.elevation.hillDeltaThreshold;
            }
            if (minElevation === 0 && maxElevation === 0 && options.onlyOriginalElevation) {
                elevationData = {
                    msg: self.getLocaleString("geo.trk.chart.chpe.empty")
                };
            }

            self.renderChart({ ...options, data: elevationData }).then(() => {
                // Cacheamos el perfil
                if (featureOrCoords instanceof Feature && !options.ignoreCaching) {
                    self.#cacheProfile(featureOrCoords, self.chartData);
                }
            });
        };

        await self.map?.wait(async () => {

            const tool = await self.getElevationTool();

            if (options.originalElevation) {
                render(lines, { ...options, key: 'gps' });
            }
            if (options.onlyOriginalElevation) {
                return;
            }

            const timestamp = Date.now();
            self.#depTimestamp = timestamp;
            const elevationOptionsTemplate = {
                crs: self.map.getCRS()
            };

            if (Object.prototype.hasOwnProperty.call(tool.options, "resolution")) {
                //si con coordenadas geograficas paso la resolución a grados
                if (self.map.wrap.isGeo())
                    elevationOptionsTemplate.resolution = Util.metersToDegrees(tool.options.resolution, self.map.getCenter()[1]).latDeg;                    
                //si es 3D(coordenadas geograficas) saco la latitud del centro de extent y paso la resolución a grados
                else if (self.map.on3DView) { 
                    const center = (self.map.view3D.getExtent()[1] + self.map.view3D.getExtent()[3]) / 2;
                    const latLong = Util.metersToDegrees(tool.options.resolution, center);
                    elevationOptionsTemplate.resolution = (latLong.latDeg + latLong.lonDeg)/2;
                }                    
                else
                    elevationOptionsTemplate.resolution =  tool.options.resolution;
            }
            const sampleNumber = Object.prototype.hasOwnProperty.call(tool.options, "sampleNumber") ? tool.options.sampleNumber : 0;
            if (sampleNumber > 0) {
                elevationOptionsTemplate.resolution = 0;
            }

            // Repartimos las muestras proporcionalmente entre todas las líneas
            const sampleNumberCollection = new Array(lines.length);
            sampleNumberCollection.fill(sampleNumber);
            if (sampleNumber > 0) {
                const lineDistances = new Array(lines.length);
                let totalDistance = 0;
                lines.forEach((line, idx) => {
                    const pl = new Polyline(line);
                    const lineDistance = pl.getLength();
                    lineDistances[idx] = lineDistance;
                    totalDistance += lineDistance;
                });
                sampleNumberCollection.forEach((sn, idx, arr) => {
                    arr[idx] = Math.floor(sn * lineDistances[idx] / totalDistance);
                });
            }
            const interpolatedLines = lines.map((line, idx) => {
                const interpolationOptions = Object.assign({}, elevationOptionsTemplate, {
                    sampleNumber: sampleNumberCollection[idx]
                });
                return Geometry.interpolate(line, interpolationOptions);
            });

            const get3DtilesElevation = async (tileset, copyInterpolatedLines) => {
                const arrMap = copyInterpolatedLines.map(async (interpolatedLine2, idx) => {
                    const dataAvailable = await self.map.view3D.getHeightFromTileset(interpolatedLine2, tileset);
                    if (dataAvailable) {
                        const elevationOptions2 = Object.assign({}, elevationOptionsTemplate, {
                            coordinates: interpolatedLine2,
                            partialCallback: function () {
                                //self.map.view3D.getHeightFromTileset(elevCoords);
                                copyInterpolatedLines[idx] = interpolatedLine2;
                                render(copyInterpolatedLines, {
                                    isSecondary: true,
                                    ignoreCaching: true,
                                    key: "mds",
                                    colorClass: "tc-mds"
                                });
                            },
                            resolution: 0,
                            sampleNumber: 0
                        });
                        tool.getElevation(elevationOptions2);
                    }
                });
                await Promise.all(arrMap);
            }

            const elevationPromises = interpolatedLines.map((interpolatedLine, idx) => {
                const elevationOptions = Object.assign({}, elevationOptionsTemplate, {
                    coordinates: interpolatedLine,
                    partialCallback: async function (elevCoords) {
                        if (timestamp === self.#depTimestamp) { // Evitamos que una petición anterior machaque una posterior
                            interpolatedLines[idx] = elevCoords;
                            render(interpolatedLines, {
                                isSecondary: Object.keys(options).length === 0 ? false : true,
                                ignoreCaching: options.ignoreCaching,
                                key: "mdt",
                                colorClass: "tc-mdt",
                            });
                            if (self.map.on3DView) {
                                await get3DtilesElevation(null, Array.from(interpolatedLines));
                                self.set3DtileData = async (tileset) => {
                                    await get3DtilesElevation(tileset, Array.from(interpolatedLines));
                                }
                            }
                        }
                    },
                    resolution: 0,
                    sampleNumber: 0
                });
                return tool.getElevation(elevationOptions);
            });

            try {
                await Promise.all(elevationPromises);
                if (options.callback && Util.isFunction(options.callback)) {
                    options.callback();
                }
            }
            catch (_error) {
                self.reset();
            }
        });
    }

    async getElevationTool() {
        let result;
        if (this.caller) {
            result = await this.caller.getElevationTool();
        }
        if (!result) {
            result = await super.getElevationTool();
        }
        return result;
    }

    async renderChart(options = {}) {
        const c3 = (await import(/* webpackMode: "lazy-once" */ 'c3')).default;
        let data = options.data;
        Util.extend(data, Util.getElevationGain({ ...data, hillDeltaThreshold: options.hillDeltaThreshold }), options);
        data.ele = data.ele.map(val => val === null ? 0 : val);
        let locale = Util.getMapLocale(this.map);

        if (options.isSecondary) {
            if (this.chartData) {
                if (!this.chartData.secondaryElevationProfileChartData) {
                    this.chartData.showLegend = true;
                    this.chartData.secondaryElevationProfileChartData = [];
                }
                const currentIndex = this.chartData.secondaryElevationProfileChartData.findIndex((secondaryProfile) => secondaryProfile?.key === options.key);
                if (currentIndex >= 0) {
                    this.chartData.secondaryElevationProfileChartData[currentIndex] = data
                }
                else {
                    this.chartData.secondaryElevationProfileChartData.push(data);
                }
            }
        }
        else {
            this.chartData = data;
        }

        var templateData = {
            uphill: data.uphill ? data.uphill.toLocaleString(locale) : '0',
            downhill: data.downhill ? data.downhill.toLocaleString(locale) : '0',
            colorClass: data.colorClass || "",            
        };

        const hasSecondaryElevationProfileChartData = this.chartData.secondaryElevationProfileChartData &&
            Array.isArray(this.chartData.secondaryElevationProfileChartData) &&
            this.chartData.secondaryElevationProfileChartData.length > 0 && this.chartData.secondaryElevationProfileChartData[0];

        if (hasSecondaryElevationProfileChartData) {
            templateData.min = this.#formatYAxis(this.chartData.min, locale);
            templateData.max = this.#formatYAxis(this.chartData.max, locale);
            templateData.colorClass = this.chartData.colorClass;
            templateData.uphill = this.chartData.uphill
            templateData.downhill = this.chartData.downhill;

            templateData.secondChart = [];
            this.chartData.secondaryElevationProfileChartData.forEach((secondaryProfile) => {
                templateData.secondChart.push({
                    uphill: secondaryProfile.uphill ? secondaryProfile.uphill.toLocaleString(locale) : '0',
                    downhill: secondaryProfile.downhill ? secondaryProfile.downhill.toLocaleString(locale) : '0',
                    min: this.#formatYAxis(secondaryProfile.min, locale),
                    max: this.#formatYAxis(secondaryProfile.max, locale),
                    colorClass: secondaryProfile.colorClass || "",
                });
            });
        }
        this.innerHTML = await this.getRenderedHtml(this.CLASS, templateData);
        this.querySelector('.tc-track-chart-warning').classList.toggle(Consts.classes.HIDDEN,
            Geometry.isPoint(data.coords) || !data.coords.every(elm => elm[2] === null || elm[2] === undefined));
        this.style.display = '';

        this.controller = new Controller(new ElevationProfileModel(), new Observer(this));
        this.controller.model["geo.trk.chart.elevationGain"] = this.getLocaleString("geo.trk.chart.elevationGain");
        this.controller.model.noElevationData = this.getLocaleString("noElevationData");


        var legendOptions = { show: false };
        if (hasSecondaryElevationProfileChartData) {
            legendOptions = {
                position: 'inset',
                inset: {
                    anchor: "bottom-left",
                    x: -45,
                    y: -5,
                    step: 1 + this.chartData.secondaryElevationProfileChartData.length
                }
            };
        }

        if (!this.isConnected) return;

        let chartOptions = Util.extend({
            bindto: this.querySelector('.tc-chart'),
            padding: {
                top: 13, // por el nuevo diseño del tooltip añado 13  //data.secondaryElevationProfileChartData[0] ? 10 : 0,
                right: 15,
                bottom: 0,
                left: 45
            },
            legend: legendOptions
        }, this.createChartOptions(this.chartData));

        if (this.chart.tooltip) {
            chartOptions.tooltip = {
                position: function (_data, _width, _height, element) {
                    let container = document.querySelector('.c3-tooltip-container');
                    let chartOffsetX = document.querySelector(".c3").getBoundingClientRect().left;
                    let graphOffsetX = document.querySelector(".c3 g.c3-axis-y").getBoundingClientRect().right;
                    let tooltipWidth = container.clientWidth;
                    let x = parseInt(d3.mouse(element)[0]) + graphOffsetX - chartOffsetX - Math.floor(tooltipWidth / 2);

                    // alto del tooltipOnBottom
                    let xAxisHeight = document.querySelector(".c3 g.c3-axis-x").getBoundingClientRect().height + 2;
                    let onBottom = container.querySelector(`.${ElevationProfile.classes.POSITION_BOTTOM}`);
                    if (onBottom && xAxisHeight) {
                        onBottom.style.height = xAxisHeight + 'px';
                    }
                    return { top: 0, left: x };
                },
                contents: (d) => {
                    var fn = this.chart.tooltip;
                    if (typeof fn !== "function")
                        fn = Util.getFnFromString(this.chart.tooltip);
                    return fn.call(eval(this.chart.ctx), d);
                }
            };
        }

        if (this.chart?.onmouseout) {
            chartOptions.onmouseout = () => {
                var fn = this.chart.onmouseout;
                if (typeof fn !== "function")
                    fn = Util.getFnFromString(this.chart.onmouseout);
                fn.call(eval(this.chart.ctx));
            };
        }

        const self = this;
        chartOptions.onrendered = function () {
            if (Util.isFunction(chartOptions._onrendered)) {
                chartOptions._onrendered.call(this);
            }
            self.map.trigger(Consts.event.DRAWCHART, { control: self, svg: this.svg[0][0], chart: this });
            //this.map.dispatchEvent(new ControlEvent(Consts.event.INFODISPLAY, { control: this }));
        };

        if (!c3._isOverriden) {
            // GLS: Override de la función generateDrawLine y generateDrawArea para establecer otro tipo de interpolación en la línea
            c3.chart.internal.fn.generateDrawLine = function (lineIndices, isSub) {
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
            c3.chart.internal.fn.generateDrawArea = function (areaIndices, isSub) {
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

        this.chart.chart = c3.generate(chartOptions);
    }

    createChartOptions(options = {}) {
        const self = this;
        var result = {};
        const locale = options.locale || Util.getMapLocale(self.map);
        switch (options.chartType) {
            default:
                if (options.ele != null) {
                    const getChartSize = function () {
                        const panelStyle = getComputedStyle(self);
                        const docWidth = document.documentElement.clientWidth / 100 * 40; // css panel contendor
                        return {
                            height: docWidth > 445 ? options.maxHeight || ElevationProfile.chartSize.MAX_HEIGHT : options.minHeight || ElevationProfile.chartSize.MIN_HEIGHT,
                            width: parseFloat(panelStyle.width) * 0.95,
                        };
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
                                [options.key].concat(eleColumn)
                            ],
                            types: {
                                [options.key]: 'area-spline'
                            },
                            colors: {
                                [options.key]: 'url(#' + gradIds[0] + ')'
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
                                    count: 5,
                                    format: function (d) {
                                        return Util.getDistanceText(d, locale);
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
                                        return self.#formatYAxis(d, locale);
                                    }
                                }
                            }
                        },
                        onresize: function () {
                            let size = self.getChartSize();
                            if (size) {
                                this.api.resize(size);
                            }
                        }
                    };

                    const hasSecondaryElevationProfileChartData = options.secondaryElevationProfileChartData &&
                        Array.isArray(options.secondaryElevationProfileChartData) &&
                        options.secondaryElevationProfileChartData.length > 0 && options.secondaryElevationProfileChartData[0];

                    if (hasSecondaryElevationProfileChartData) {                           
                        result.data.names = {
                            [options.key]: self.getLocaleString(options.key) || self.getLocaleString("geo.profile.fromTrack")
                        }
                        options.secondaryElevationProfileChartData.forEach((secondaryProfile) => {
                            result.data.columns.push([secondaryProfile.key].concat(secondaryProfile.ele));
                            result.data.types[secondaryProfile.key] = 'area-spline';
                            result.data.names[secondaryProfile.key] = self.getLocaleString(secondaryProfile.key)
                            gradIds.push('grad' + TC.getUID());
                            result.data.colors[secondaryProfile.key] = 'url(#' + gradIds[gradIds.length - 1] + ')';
                        });

                        result.data.axes = {
                            [options.key]: 'y'
                        };

                        options.secondaryElevationProfileChartData.forEach((secondaryProfile) => {
                            if (eleColumn.every((val) => val === 0)) {
                                result.axis.y.min = secondaryProfile.min;
                                result.axis.y.max = secondaryProfile.max;
                            } else if (secondaryProfile.ele.every((val) => val === 0)) {
                                result.axis.y.min = Math.min(...eleColumn);
                                result.axis.y.max = Math.max(...eleColumn);
                            } else {
                                result.axis.y.min = Math.min(...eleColumn.concat(secondaryProfile.min));
                                result.axis.y.max = Math.max(...eleColumn.concat(secondaryProfile.max));
                            }
                        })
                    }

                    if (options.time) result.time = ("00000" + options.time.h).slice(-2) + ':' + ("00000" + options.time.m).slice(-2) + ':' + ("00000" + options.time.s).slice(-2);

                    var rendered = false;
                    result._onrendered = function () {
                        if (!rendered) {
                            rendered = true;

                            if (hasSecondaryElevationProfileChartData) {
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

                                    item.addEventListener(Consts.event.CLICK, function () {
                                        if (item.classList.contains(Consts.classes.HIDDEN)) {
                                            item.querySelector('title').textContent = self.getLocaleString("hide");
                                        } else {
                                            item.querySelector('title').textContent = self.getLocaleString("show");
                                        }

                                        item.classList.toggle(Consts.classes.HIDDEN);
                                    }, { passive: true });
                                });
                            }
                        }

                        if (!this.svg) {
                            return; // es posible que lleguemos aquí y el usuario justo haya deseleccionado el track de la lista.
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

                        createLinearGradient(gradIds[0], self.#gradientsColors[options.key]);
                        if (options.secondaryElevationProfileChartData) {
                            options.secondaryElevationProfileChartData.forEach((secondaryProfile, i) => {
                                createLinearGradient(gradIds[i + 1], self.#gradientsColors[secondaryProfile.key]);
                            });
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
                                let point = self.chartData.coords[e.index];
                                if (point) {
                                    point = point.slice(0, 2);
                                    if (self.map.crs !== self.map.options.utmCrs) {
                                        point = Util.reproject(point, self.map.options.utmCrs, self.map.crs);
                                    }
                                    self.map.zoomToFeatures([new Point(point, {})]);
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

                        // revisar
                        //svg.removeAttribute('height');
                        //svg.removeAttribute('width');

                        //svg.setAttribute('viewbox', '0 0 ' + chartSize.width + ' ' + chartSize.height);

                        // ¿es necesario pasar los labels a multiline?
                        var setMultilineLabels = function () {
                            var x = d3.scale.ordinal().rangeRoundBands([0, chartSize.width], .1, .3);
                            d3.select('.c3-axis-x').selectAll('text:not(.c3-axis-x-label)')
                                .call(function (textNode, _width) {
                                    textNode.each(function () {
                                        textNode.each(function (d, i) {
                                            if (i === 0) {
                                                return;
                                            }

                                            const d3text = d3.select(this);

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

                        const xAxisNodeRect = d3.select('.c3-axis-x').node().getBoundingClientRect();
                        if (!xAxisNodeRect.width) {

                            if (self.elevationChartLabelsRAF) {
                                window.cancelAnimationFrame(self.elevationChartLabelsRAF);
                                self.elevationChartLabelsRAF = undefined;
                            }

                            const hasSize = function () {
                                const xAxis = d3.select('.c3-axis-x');
                                const xAxisNode = xAxis.node();
                                if (xAxis.length && !xAxisNode) {
                                    self.elevationChartLabelsRAF = requestAnimationFrame(hasSize);
                                }
                                else if (xAxis.length && xAxisNode &&
                                    !xAxisNode.getBoundingClientRect().width) {
                                    self.elevationChartLabelsRAF = requestAnimationFrame(hasSize);
                                } else {
                                    window.cancelAnimationFrame(self.elevationChartLabelsRAF);
                                    self.elevationChartLabelsRAF = undefined;

                                    const _xAxisNodeRect = xAxisNode.getBoundingClientRect();
                                    const _yAxisNodeRect = d3.select('.c3-axis-y').node().getBoundingClientRect();
                                    if (_xAxisNodeRect.width >= chartSize.width - _yAxisNodeRect.width ||
                                        _xAxisNodeRect.width * 100 / (chartSize.width - _yAxisNodeRect.width) > 90) {
                                        setMultilineLabels();
                                    }
                                }
                            };

                            self.elevationChartLabelsRAF = requestAnimationFrame(hasSize);
                        }
                        else {
                            const yAxisNodeRect = d3.select('.c3-axis-y').node().getBoundingClientRect();
                            if (xAxisNodeRect.width >= chartSize.width - yAxisNodeRect.width ||
                                xAxisNodeRect.width * 100 / (chartSize.width - yAxisNodeRect.width) > 90) {
                                setMultilineLabels();
                            }
                        }

                        // pasamos el perfil original adelante si no no se aprecian bien las diferencias por el color y si lo gestionamos antes afecta a la leyenda
                        d3.select('svg').select(".c3-chart-lines").selectAll(".c3-target-ele").each(function () {
                            this.parentNode.appendChild(this);
                        });                        
                    };
                }
                else {
                    result = {
                        msg: self.getLocaleString("geo.trk.chart.chpe.empty")
                    };
                }
                break;
        }
        return result;
    }

    removeDataOnChart(key) {        
        const idxToRemove = this.chartData.secondaryElevationProfileChartData?.findIndex((secondaryProfile) => secondaryProfile.key === key);        
        if (idxToRemove >= 0) {
            this.chartData.secondaryElevationProfileChartData.splice(idxToRemove, 1);
            this.renderChart({
                data: this.chartData,
                //div: this.querySelector('.' + this.CLASS + '-chart'),
            });
        }
    }

    setSecondaryElevationProfileCoordinates(sourceCoordinates) {
        const secProfileData = self.chartData?.secondaryElevationProfileChartData?.[0];

        if (secProfileData?.ele && !secProfileData?.coords) {

            // Aplanamos a una lista de puntos
            let level = -2;
            let levelElm = sourceCoordinates;
            do {
                level++;
                levelElm = levelElm[0];
            }
            while (Array.isArray(levelElm));
            secProfileData.coords = sourceCoordinates
                .flat(level)
                .map((c, i) => [c[0], c[1], secProfileData.ele[i]]);
        }
    }

    #formatYAxis(value, locale) {
        let y = parseInt(value.toFixed(0)) || 0;
        return y.toLocaleString(locale) + ' m';
    }

    getChartSize() {
        return this.querySelector('.tc-chart.c3').getBoundingClientRect();
    }

    getElevationTooltip(d) {
        this.wrap.showElevationMarker({
            data: d,
            layer: this.currentFeature?.layer,
            coords: this.chartData.coords
        });

        return this.getElevationChartTooltip(d);
    }

    removeElevationTooltip() {
        if (this.chart?.chart) {
            this.chart.chart.tooltip.hide();
        }
        this.wrap.hideElevationMarker();
    }

    getElevationChartTooltip(data) {
        const locale = this.map.getLocale() || undefined;
        const coords = this.chartData.coords;
        const getElevationByDataElem = function (dataElem) {
            return dataElem.value ? parseInt(dataElem.value.toFixed(0)).toLocaleString(locale) : "0";
        };
        const p = coords[data[0].index];
        let doneTime;
        if (coords[0].length === 4 && coords[0][3] > 0 && p) {
            doneTime = this.#getTime(coords[0][3], p[3]);
        }
        let distance = data[0].x / 1000;
        let distanceFormatted = (distance < 1 ? Math.round(distance * 1000) : Math.round(distance * 100) / 100).toLocaleString(locale) + (distance < 1 ? ' m' : ' km');

        let elevationDiv = `<div class="${ElevationProfile.classes.POSITION_TOP}">` +
            '<span>' +
            data.map((elem, index) => {
                if (elem) {
                    let classCss;
                    switch (elem.id) {
                        case "mdt":
                            classCss = "tc-mdt";
                            break;
                        case "mds":
                            classCss = "tc-mds";
                            break;
                        case "gps":
                        default:
                            classCss = "tc-original";
                            break;
                    }
                    return index === 0 ? '<span data-isNumber class="' + classCss + '">' + getElevationByDataElem(elem) + ' m' + '</span>' :
                        '<span data-isNumber class="' + classCss + '">' + getElevationByDataElem(elem) + ' m ' + '</span>';
                } else {
                    return "";
                }
            }).join('') +
            '</span >' +
            '</div>';

        let distanceAndTimeDiv = `<div class="${ElevationProfile.classes.POSITION_BOTTOM}"><span>${distanceFormatted} </span>` +
            (doneTime ? '<span>' + doneTime.toString + '</span><div/>' : '<div/>');


        return elevationDiv + distanceAndTimeDiv;
    }

    #getTime(timeFrom, timeTo) {
        var diff = timeTo - timeFrom;
        var d = {};
        var daysDifference = Math.floor(diff / 1000 / 60 / 60 / 24);
        diff -= daysDifference * 1000 * 60 * 60 * 24;

        var hoursDifference = Math.floor(diff / 1000 / 60 / 60);
        diff -= hoursDifference * 1000 * 60 * 60;

        d.h = hoursDifference + daysDifference * 24;

        var minutesDifference = Math.floor(diff / 1000 / 60);
        diff -= minutesDifference * 1000 * 60;

        d.m = minutesDifference;

        d.s = Math.floor(diff / 1000);

        return Util.extend({}, d, { toString: ("00000" + d.h).slice(-2) + ':' + ("00000" + d.m).slice(-2) + ':' + ("00000" + d.s).slice(-2) });
    }


    reset() {
        this.renderChart({
            key: "mdt",
            colorClass: "tc-mdt",
            data: {
                x: [0],
                ele: [0],
                coords: [0, 0, 0],
                uphill: 0,
                downhill: 0
            }
        });
    }

    #cacheProfile(feature, data) {
        if (feature) {
            const coords = feature.getCoords();
            if (coords) {
                elevationProfileCache.set(coords.toString(), data);
            }
        }
    }

    #getCachedProfile(feature) {
        if (feature) {
            const coords = feature.getCoords();
            if (coords) {
                return elevationProfileCache.get(coords.toString());
            }
            return null;
        }
    }

    #removeProfileFromCache(feature) {
        if (feature) {
            const coords = feature.getCoords();
            if (coords) {
                elevationProfileCache.delete(coords.toString());
            }
        }
    }

    getContainerElement() {
        return this;
    }

    updateModel() {
        for (const key of Object.keys(this.model)) {
            if (!key.startsWith("#")) {
                this.model[key] = this.getLocaleString(key);
            }
        }
    }
}

ElevationProfile.prototype.CLASS = 'tc-ctl-elev-profile';
customElements.get(elementName) || customElements.define(elementName, ElevationProfile);
export default ElevationProfile;
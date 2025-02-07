import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Util from '../Util';
import Control from '../Control';
import Feature from '../../SITNA/feature/Feature';
import Point from '../../SITNA/feature/Point';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Geometry from '../Geometry';
import InfoDisplay from './InfoDisplay';

TC.control = TC.control || {};

const pointElevationCache = new WeakMap();
const elevationProfileCache = new Map();

const getElevationProfileFromCache = function (feature) {
    if (feature) {
        const coords = feature.getCoords();
        if (coords) {
            return elevationProfileCache.get(coords.toString());
        }
        return null;
    }
};

const cacheElevationProfile = function (feature, data) {
    if (feature) {
        const coords = feature.getCoords();
        if (coords) {
            elevationProfileCache.set(coords.toString(), data);
        }
    }
};

const removeElevationProfileFromCache = function (feature) {
    if (feature) {
        const coords = feature.getCoords();
        if (coords) {
            elevationProfileCache.delete(coords.toString());
        }
    }
};

class Elevation extends Control {
    #depTimestamp;
    #resultsPanelPromise;

    constructor() {
        super(...arguments);
        const self = this;

        self.displayElevation = true;
        self.resultsPanel = null;
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);

        map
            .on(Consts.event.FEATUREMODIFY, function (e) {
                if (e.geometryChanged) removeElevationProfileFromCache(e.feature);
            })
            .on(Consts.event.FEATUREREMOVE, function (e) {
                removeElevationProfileFromCache(e.feature);
            })
            .on(Consts.event.FEATUREREMOVE, function (e) {
                removeElevationProfileFromCache(e.feature);
            })
            .on(Consts.event.LAYERREMOVE, function (e) {
                e.layer.features && e.layer.features.forEach(feat => removeElevationProfileFromCache(feat));
            })
            .on(Consts.event.POPUP + ' ' + Consts.event.DRAWTABLE, function (e) {
                // Añadimos datos de elevación si se han añadido previamente
                if (pointElevationCache.has(e.control.currentFeature)) {
                    self.displayElevationValue(e.control.currentFeature);
                }
            });

        return self;
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-ftools.mjs');
        const valueTemplatePromise = import('../templates/tc-ctl-elev-val.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-val'] = (await valueTemplatePromise).default;
        self.template = template;
    }

    async getElevationTool() {
        const self = this;
        const proxyObj = {
            options: {
                displayElevation: self.options || true
            },
            elevation: self.elevation,
            map: self.map
        };
        const ctl = await super.getElevationTool.call(proxyObj);
        self.elevation = ctl;
        return ctl;
    }

    setElevationToolOptions(options) {
        const self = this;
        Util.extend(self.options, options);
        if (self.elevation) {
            Util.extend(self.elevation.options, self.options);
        }
    }

    async displayElevationValue(feature, options = {}) {
        const self = this;
        if (feature instanceof Point) {
            let elevationValues;
            if (options.ignoreCache) {
                pointElevationCache.delete(feature);
            }
            else {
                elevationValues = pointElevationCache.get(feature);
            }
            if (!elevationValues) {
                const tool = await self.getElevationTool();
                const elevation = await tool.getElevation({
                    crs: self.map.crs,
                    coordinates: [feature.geometry]
                });
                if (elevation.length) {
                    const point = elevation[0];
                    const tValue = point[2];
                    const sValue = point.length > 3 ? point[3] : null;
                    elevationValues = {
                        elevation: tValue,
                        height: sValue
                    };
                    pointElevationCache.set(feature, elevationValues);
                }
            }
            if (elevationValues) {
                const targets = [];
                let target;
                const locale = self.map.options.locale || Cfg.locale;
                const displayControls = self.map.getControlsByClass(InfoDisplay);
                displayControls
                    .filter(ctl => ctl.caller && ctl.caller.highlightedFeature === feature)
                    .forEach(function addElevElmToGfiCtl(ctl) {
                        const featElm = ctl.caller.getFeatureElement(feature);
                        if (featElm) {
                            target = featElm.querySelector('tbody');
                            targets.push(target);
                        }
                    });
                displayControls
                    .filter(ctl => ctl.currentFeature === feature)
                    .forEach(function addElevElmToCtl(ctl) {
                        const container = ctl.getInfoContainer();
                        if (container) {
                            target = container.querySelector('tbody');
                            targets.push(target);
                        }
                    });

                const renderOptions = {
                    elevationValue: elevationValues.elevation !== null ? Util.formatNumber(Math.round(elevationValues.elevation), locale) : '',
                    heightValue: elevationValues.height ? elevationValues.height.toLocaleString(locale, { maximumFractionDigits: 1 }) : ''
                };
                // Si la geometría ya tiene elevación y es distinta de la obtenida por MDT, la mostramos
                const geometryElevation = feature.geometry[2];
                if (typeof geometryElevation === 'number' && geometryElevation !== elevationValues.elevation) {
                    renderOptions.originalValue = Util.formatNumber(Math.round(geometryElevation));
                }
                targets.forEach(function addElevElmToTarget(target) {
                    self.getRenderedHtml(self.CLASS + '-val', renderOptions, function (html) {
                        target.querySelectorAll(`tr[class|=${self.CLASS}-pair]`).forEach(elm => elm.remove());
                        target.insertAdjacentHTML('beforeend', html);
                    });
                });
            }
        }
    }

    async displayElevationProfile(featureOrCoords, opts) {
        const self = this;
        const options = opts || {};
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
        self.getProfilePanel().then(function (resultsPanel) {
            resultsPanel.open();
        });
        const renderProfile = function (profile) {
            self.getProfilePanel().then(function (resultsPanel) {
                resultsPanel.renderPromise().then(function () {
                    self.renderElevationProfile(profile);
                });
            });
        };
        if (featureOrCoords instanceof Feature) {
            self.getProfilePanel().then(function (resultsPanel) {
                resultsPanel.setCurrentFeature(featureOrCoords);
            });
            const profile = getElevationProfileFromCache(featureOrCoords);
            if (profile) {
                renderProfile(profile);
                return;
            }
        }
        const render = function (elevCoordLines, options) {
            let elevLines = elevCoordLines;
            let maxElevation = Number.NEGATIVE_INFINITY;
            let minElevation = Number.POSITIVE_INFINITY;
            if (self.map.getCRS() !== self.map.options.utmCrs) {
                elevLines = Util.reproject(elevCoordLines, self.map.getCRS(), self.map.options.utmCrs);
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
                coords: coords,
                min: minElevation,
                max: maxElevation
            };

            const elevationGainOptions = {
                coords: coords
            };
            if (typeof self.options === 'object' && self.map.options.elevation) {
                elevationGainOptions.hillDeltaThreshold = self.options.hillDeltaThreshold || self.map.options.elevation.hillDeltaThreshold;
            }
            if (minElevation === 0 && maxElevation === 0 && options.onlyOriginalElevation) {
                elevationData = {
                    msg: self.getLocaleString("geo.trk.chart.chpe.empty")
                };
            }
            Util.extend(elevationData, TC.tool.Elevation.getElevationGain(elevationGainOptions), options);

            if (options.isSecondary && self.elevationProfileChartData) {
                if (!self.elevationProfileChartData.secondaryElevationProfileChartData) {
                    self.elevationProfileChartData.showLegend = true;
                    self.elevationProfileChartData.secondaryElevationProfileChartData = [];
                    self.elevationProfileChartData.secondaryElevationProfileChartData.push(elevationData);
                } else {
                    self.elevationProfileChartData.secondaryElevationProfileChartData[0] = elevationData;
                }
            }

            // Cacheamos el perfil
            if (featureOrCoords instanceof Feature && !options.ignoreCaching) {
                cacheElevationProfile(featureOrCoords, elevationData);
            }

            renderProfile(elevationData);
        };

        await self.map?.wait(async () => {

            const tool = await self.getElevationTool();

            if (options.originalElevation) {
                render(lines, options);
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
                elevationOptionsTemplate.resolution = tool.options.resolution;
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

            const elevationPromises = interpolatedLines.map((interpolatedLine, idx) => {
                const elevationOptions = Object.assign({}, elevationOptionsTemplate, {
                    coordinates: interpolatedLine,
                    partialCallback: function (elevCoords) {
                        if (timestamp === self.#depTimestamp) { // Evitamos que una petición anterior machaque una posterior
                            interpolatedLines[idx] = elevCoords;
                            render(interpolatedLines, {
                                isSecondary: Object.keys(options).length === 0 ? false : true,
                                ignoreCaching: options.ignoreCaching
                            });
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
                self.resetElevationProfile();
            }
        });
    }

    async createProfilePanel() {
        const self = this;

        const resultsPanelOptions = {
            id: self.getUID(),
            content: "chart",
            titles: {
                main: self.getLocaleString("geo.trk.chart.chpe"),
                max: self.getLocaleString("geo.trk.chart.chpe")
            },
            chart: {
                ctx: self,
                onmouseout: self.removeElevationTooltip,
                tooltip: self.getElevationTooltip
            }
        };

        let addControlPromise;
        const addResultsPanelChart = function (controlContainer) {
            resultsPanelOptions.position = controlContainer.POSITION.RIGHT;
            addControlPromise = controlContainer.addControl('resultsPanel', resultsPanelOptions);
        };

        if (self.options.displayOn) {
            let controlContainer = self.map.getControlsByClass('TC.control.' + self.options.displayOn[0].toUpperCase() + self.options.displayOn.substring(1))[0];
            if (!controlContainer) {
                controlContainer = await self.map.addControl(self.options.displayOn);
            }
            addResultsPanelChart(controlContainer);
        } else {
            resultsPanelOptions.div = document.createElement('div');
            self.map.div.appendChild(resultsPanelOptions.div);
            addControlPromise = self.map.addControl('resultsPanel', resultsPanelOptions);
        }

        const resultsPanel = await addControlPromise;
        resultsPanel.caller = self;
        self.resultsPanel = resultsPanel;
        self._decorateChartPanel();
        return resultsPanel;
    }

    async getProfilePanel() {
        const self = this;
        if (!self.#resultsPanelPromise) {
            self.#resultsPanelPromise = self.createProfilePanel();
        }
        return await self.#resultsPanelPromise;
    }

    resetElevationProfile() {
        const self = this;
        if (self.options.displayElevation && self.resultsPanel) {
            self.elevationProfileChartData = {
                x: [0],
                ele: [0],
                coords: [0, 0, 0],
                upHill: 0,
                downHill: 0
            };
            self.resultsPanel.openChart(self.elevationProfileChartData);
        }
    }

    renderElevationProfile(profileData) {
        const self = this;
        if (!profileData.isSecondary) {
            self.elevationProfileChartData = profileData || self.elevationProfileChartData;
        }
        self.getProfilePanel().then(function (resultsPanel) {
            if (!resultsPanel.div.classList.contains(Consts.classes.HIDDEN)) {
                if (profileData.isSecondary) {
                    resultsPanel.loadDataOnChart(self.elevationProfileChartData);
                } else {
                    resultsPanel.openChart(self.elevationProfileChartData);
                }
                if (!resultsPanel.isMinimized()) {
                    resultsPanel.doVisible();
                }
            }
        });
    }

    closeElevationProfile() {
        const self = this;
        self.getProfilePanel().then(function (resultsPanel) {
            resultsPanel.close();
        });
    }

    _decorateChartPanel() {
        const self = this;
        self.resultsPanel.setCurrentFeature = function (feature) {
            const that = this;
            if (that.currentFeature) {
                that.currentFeature.toggleSelectedStyle(false);
            }
            that.currentFeature = feature;
            if (feature) {
                feature.toggleSelectedStyle(true);
            }
        };

        const oldClose = self.resultsPanel.close;
        self.resultsPanel.close = function () {
            const that = this;
            if (that.currentFeature) {
                that.currentFeature.toggleSelectedStyle(false);
            }
            oldClose.call(that);
        };
    }

    getElevationTooltip(d) {
        const self = this;
        self.resultsPanel.wrap.showElevationMarker({
            data: d,
            layer: self.resultsPanel.currentFeature && self.resultsPanel.currentFeature.layer,
            coords: self.elevationProfileChartData.coords
        });

        return self.resultsPanel.getElevationChartTooltip(d);
    }

    removeElevationTooltip() {
        const self = this;
        if (self.resultsPanel) {
            if (self.resultsPanel.chart && self.resultsPanel.chart.chart) {
                self.resultsPanel.chart.chart.tooltip.hide();
            }
            self.resultsPanel.wrap.hideElevationMarker();
        }
    }
}

Elevation.prototype.CLASS = 'tc-ctl-elev';
TC.control.Elevation = Elevation;
export default Elevation;
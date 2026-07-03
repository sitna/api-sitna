import TC from '../../TC.js';
import Consts from '../Consts.js';
import Cfg from '../Cfg.js';
import Util from '../Util.js';
import Control from '../Control.js';
import Feature from '../../SITNA/feature/Feature.js';
import Point from '../../SITNA/feature/Point.js';
import InfoDisplay from './InfoDisplay.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';
TC.control = TC.control || {};

const pointElevationCache = new WeakMap();
const elevationProfileCache = new Map();

const removeElevationProfileFromCache = function (feature) {
    if (feature) {
        const coords = feature.getCoords();
        if (coords) {
            elevationProfileCache.delete(coords.toString());
        }
    }
};

class ElevationModel {
    constructor() {
        this.originalValue = "";
        this.ele = "";
        this.mdt = "";
        this["elevation.explained"] = "";
        this["heightOverTerrain"] = "";
    }
}

class Elevation extends Control {
    #depTimestamp;
    #resultsPanelPromise;

    constructor() {
        super(...arguments);
        const self = this;

        self.displayElevation = true;
        self.resultsPanel = null;
    }

    async render(callback) {
        this.elevationDataModel = new ElevationModel();
        return await super.render(callback);
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
            .on(Consts.event.LAYERREMOVE, function (e) {
                e.layer.features && e.layer.features.forEach(feat => removeElevationProfileFromCache(feat));
            })
            .on(Consts.event.POPUP + ' ' + Consts.event.DRAWTABLE, function (e) {
                // Añadimos datos de elevación si se han añadido previamente
                if (pointElevationCache.has(e.control.currentFeature)) {
                    self.displayElevationValue(e.control.currentFeature);
                }
            })
            .on(Consts.event.THREED_TILES_CHANGE, function (e) {
                if (e.change === "visibility") {
                    self.getProfilePanel().then(function (resultsPanel) {
                        if (resultsPanel.elevationProfileChartData && resultsPanel.isVisible()) { 
                            if (e.tileset.visible) {
                                if (self.set3DtileData) self.set3DtileData(e.tileset.url);
                            }
                            else {
                                resultsPanel.removeDataOnChart("mds");
                            }
                        }                            
                    });                    
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
                    crs: self.map.getCRS(),
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
                const locale = self.map.getLocale() || Cfg.locale;
                const displayControls = self.map.getControlsByClass(InfoDisplay);
                displayControls
                    .filter(ctl => ctl.caller && ctl.caller.highlightedFeature === feature)
                    .forEach(function addElevElmToGfiCtl(ctl) {
                        const featElm = ctl.caller.getFeatureElement(feature);
                        if (featElm) {
                            target = featElm.querySelector('tbody');
                            if (target) targets.push(target);
                        }
                    });
                displayControls
                    .filter(ctl => ctl.currentFeature === feature)
                    .forEach(function addElevElmToCtl(ctl) {
                        const container = ctl.getInfoContainer();
                        if (container) {
                            target = container.querySelector('tbody');
                            if (target) targets.push(target);
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
                        self.elevationDataController = new Controller(self.elevationDataModel, new Observer(target));
                        self.updateModel();
                    });
                });
            }
        }
    }

    async displayElevationProfile(featureOrCoords, options = {}) {
        const panel = await this.getProfilePanel();
        const profile = panel.getElevationProfileControl();        
        panel.open();
        profile.reset();        
        if (featureOrCoords instanceof Feature) {
            panel.currentFeature = featureOrCoords;
        }
        else {
            //borrar el contenido alfanumerico
            const resultsPanel = await this.getProfilePanel();
            if (resultsPanel.infoDiv.firstChild) resultsPanel.infoDiv.removeChild(resultsPanel.infoDiv.firstChild);
        }
        //URI: delay de 200ms para esperar a que la animacion css termine
        await Util.getTimedPromise(null, 200);
        return await profile.displayElevationProfile(featureOrCoords, options);
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

        let resultsPanel;

        if (self.options.displayOn) {
            let controlContainer = self.map.getControlsByClass('TC.control.' + self.options.displayOn[0].toUpperCase() + self.options.displayOn.substring(1))[0];
            if (!controlContainer) {
                controlContainer = await self.map.addControl(self.options.displayOn);
            }
            resultsPanelOptions.position = controlContainer.POSITION.RIGHT;
            resultsPanel = await controlContainer.addControl('resultsPanel', resultsPanelOptions);
        } else {
            resultsPanelOptions.div = document.createElement('div');
            self.map.div.appendChild(resultsPanelOptions.div);
            resultsPanel = await self.map.addControl('resultsPanel', resultsPanelOptions);
        }

        resultsPanel.caller = self;
        self.resultsPanel = resultsPanel;
        self._decorateChartPanel();
        return resultsPanel;
    }

    async getProfilePanel() {
        if (!this.#resultsPanelPromise) {
            this.#resultsPanelPromise = this.createProfilePanel();
        }
        return await this.#resultsPanelPromise;
    }

    resetElevationProfile() {
        if (this.options.displayElevation && this.resultsPanel) {
            this.resultsPanel.getElevationProfileControl().reset();
        }
    }

    renderElevationProfile(profileData) {
        const self = this;
        self.getProfilePanel().then(function (resultsPanel) {
            if (!resultsPanel.div.classList.contains(Consts.classes.HIDDEN)) {
                if (profileData.isSecondary) {
                    resultsPanel.loadDataOnChart(profileData);
                } else {
                    resultsPanel.openChart(profileData);
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
    }

    getElevationProfileChartData() {
        return this.resultsPanel?.div.querySelector('sitna-elevation-profile')?.chartData;
    }

    getElevationTooltip(d) {
        return this.resultsPanel?.div.querySelector('sitna-elevation-profile')?.getElevationTooltip(d);
    }

    removeElevationTooltip() {
        this.resultsPanel?.div.querySelector('sitna-elevation-profile')?.removeElevationTooltip();
    }

    async updateModel() {
        const self = this;
        const profilePanel = await self.getProfilePanel();
        profilePanel.setTitles({
            main: self.getLocaleString("geo.trk.chart.chpe"),
            max: self.getLocaleString("geo.trk.chart.chpe")
        });
        if (self.elevationDataModel) {
            self.elevationDataModel.originalValue = self.getLocaleString("originalValue");
            self.elevationDataModel.ele = self.getLocaleString("originalValue");
            self.elevationDataModel.mdt = self.getLocaleString("originalValue");
            self.elevationDataModel["elevation.explained"] = self.getLocaleString("elevation.explained");
            self.elevationDataModel["heightOverTerrain"] = self.getLocaleString("heightOverTerrain");
        }

    }
}

Elevation.prototype.CLASS = 'tc-ctl-elev';
TC.control.Elevation = Elevation;
export default Elevation;
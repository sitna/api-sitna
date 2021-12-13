TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Elevation = function () {
    const self = this;

    TC.Control.apply(self, arguments);

    self.displayElevation = true;
    self.resultsPanel = null;
};

TC.inherit(TC.control.Elevation, TC.Control);

(function () {
    const ctlProto = TC.control.Elevation.prototype;

    ctlProto.CLASS = 'tc-ctl-elev';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-ftools.hbs";
    ctlProto.template[ctlProto.CLASS + '-val'] = TC.apiLocation + "TC/templates/tc-ctl-elev-val.hbs";


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

    ctlProto.register = function (map) {
        const self = this;
        return new Promise(function (resolve, reject) {
            TC.Control.prototype.register.call(self, map).then(function () {

                map
                    .on(TC.Consts.event.FEATUREMODIFY + ' ' + TC.Consts.event.FEATUREREMOVE, function (e) {
                        removeElevationProfileFromCache(e.feature);
                    })
                    .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                        removeElevationProfileFromCache(e.feature);
                    })
                    .on(TC.Consts.event.LAYERREMOVE, function (e) {
                        e.layer.features && e.layer.features.forEach(feat => removeElevationProfileFromCache(feat));
                    });

                resolve(self);

            }).catch(function (error) {
                reject(error);
            });
        });
    };

    ctlProto.getElevationTool = function () {
        const self = this;
        return new Promise(function (resolve, reject) {
            const proxyObj = {
                options: {
                    displayElevation: self.options || true
                },
                elevation: self.elevation,
                map: self.map
            };
            TC.Control.prototype.getElevationTool.call(proxyObj).then(ctl => {
                self.elevation = ctl;
                resolve(ctl);
            });
        });
    };

    ctlProto.setElevationToolOptions = function (options) {
        const self = this;
        TC.Util.extend(self.options, options);       
        if (self.elevation) {
            TC.Util.extend(self.elevation.options, self.options);
        }
    };

    ctlProto.displayElevationValue = function (feature) {
        const self = this;
        if (feature instanceof TC.feature.Point) {
            self.getElevationTool().then(function (tool) {
                tool.getElevation({
                    crs: self.map.crs,
                    coordinates: [feature.geometry]
                }).then(function (elevation) {
                    if (elevation.length) {
                        const targets = [];
                        const locale = self.map.options.locale || TC.Cfg.locale;
                        const point = elevation[0];
                        const tValue = point[2];
                        const sValue = point.length > 3 ? point[3] : null;

                        const displayControls = self.map.getControlsByClass('TC.control.Popup')
                            .concat(self.map.getControlsByClass('TC.control.ResultsPanel'));
                        displayControls
                            .filter(ctl => (ctl.caller && ctl.caller.highlightedFeature) === feature)
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
                                let container;
                                switch (true) {
                                    case TC.control.Popup && ctl instanceof TC.control.Popup:
                                        container = ctl.getContainerElement();
                                        break;
                                    case TC.control.ResultsPanel && ctl instanceof TC.control.ResultsPanel:
                                        container = ctl.getInfoContainer();
                                        break;
                                    default:
                                        break;
                                }
                                if (container) {
                                    target = container.querySelector('tbody');
                                    targets.push(target);
                                }
                            });

                        targets.forEach(function addElevElmToTarget(target) {
                            self.getRenderedHtml(self.CLASS + '-val', {
                                originalValue: feature.geometry[2] ? TC.Util.formatNumber(Math.round(feature.geometry[2]), locale) : '',
                                elevationValue: tValue !== null ? TC.Util.formatNumber(Math.round(tValue), locale) : '',
                                heightValue: sValue ? sValue.toLocaleString(locale, { maximumFractionDigits: 1 }) : ''
                            }, function (html) {
                                target.querySelectorAll(`tr[class|=${self.CLASS}-pair]`).forEach(elm => elm.remove());
                                target.insertAdjacentHTML('beforeend', html);
                            });
                        });
                    }
                });
            });
        }
    };

    ctlProto.displayElevationProfile = function (featureOrCoords, opts) {
        const self = this;
        const options = opts || {};
        let coords;
        switch (true) {
            case TC.feature.Polyline && featureOrCoords instanceof TC.feature.Polyline:
                coords = featureOrCoords.geometry;
                break;
            case TC.feature.MultiPolyline && featureOrCoords instanceof TC.feature.MultiPolyline:
                coords = featureOrCoords.geometry[0];
                break;
            case featureOrCoords instanceof TC.Feature:
                return;
            default:
                coords = featureOrCoords;
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
        if (featureOrCoords instanceof TC.Feature) {
            self.getProfilePanel().then(function (resultsPanel) {
                resultsPanel.setCurrentFeature(featureOrCoords);
            });
            const profile = getElevationProfileFromCache(featureOrCoords);
            if (profile) {
                renderProfile(profile);
                return;
            }
        }
        const li = self.map.getLoadingIndicator();
        const waitId = li && li.addWait();
        const render = function (elevCoords, options) {
            let distance = 0.0;
            let maxElevation = Number.NEGATIVE_INFINITY;
            let minElevation = Number.POSITIVE_INFINITY;
            if (self.map.crs !== self.map.options.utmCrs) {
                elevCoords = TC.Util.reproject(elevCoords, self.map.crs, self.map.options.utmCrs);
            }
            const profile = elevCoords
                .map(function calculateDistanceAndExtremes(point, idx, arr) {
                    let prev = idx === 0 ? point : arr[idx - 1];
                    const dx = point[0] - prev[0];
                    const dy = point[1] - prev[1];
                    distance += Math.sqrt(dx * dx + dy * dy);
                    var ele = point[2] || 0;
                    if (typeof ele === 'number') {
                        maxElevation = Math.max(ele, maxElevation);
                        minElevation = Math.min(ele, minElevation);
                    }
                    return [distance, ele];
                });
            if (profile.length === 1) {
                // Espera una línea, duplicamos el punto para que no se rompa el renderizado del gráfico
                profile.push(profile[0]);
            }
            let elevationData = {
                x: profile.map(function (elm) {
                    return elm[0];
                }),
                ele: profile.map(function (elm) {
                    return elm[1] || 0;
                }),
                coords: elevCoords,
                min: minElevation,
                max: maxElevation,
            };

            const elevationGainOptions = {
                coords: elevCoords
            };
            if (typeof self.options === 'object' && self.map.options.elevation) {
                elevationGainOptions.hillDeltaThreshold = self.options.hillDeltaThreshold || self.map.options.elevation.hillDeltaThreshold;
            }
            if (minElevation === 0 && maxElevation === 0 && options.onlyOriginalElevation) {
                elevationData = {
                    msg: self.getLocaleString("geo.trk.chart.chpe.empty")
                };
            }
            TC.Util.extend(elevationData, TC.tool.Elevation.getElevationGain(elevationGainOptions), options);

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
            if (featureOrCoords instanceof TC.Feature && !options.ignoreCaching) {
                cacheElevationProfile(featureOrCoords, elevationData);
            }

            renderProfile(elevationData);
        };
        
        self.getElevationTool().then(function (tool) {
            if (options.originalElevation) {
                render(coords, options);
            }
            if (options.onlyOriginalElevation) {
                li && li.removeWait(waitId);
                return;
            }

            const timestamp = Date.now();
            self._depTimestamp = timestamp;
            const elevationOptions = {
                crs: self.map.crs,
                coordinates: coords,
                partialCallback: function (elevCoords) {
                    if (timestamp === self._depTimestamp) { // Evitamos que una petición anterior machaque una posterior
                        render(elevCoords, { isSecondary: Object.keys(options).length === 0 ? false : true, ignoreCaching: options.ignoreCaching });
                    }
                }
            };
            if (tool.options.hasOwnProperty("resolution")) {
                elevationOptions.resolution = tool.options.resolution;
            }
            if (tool.options.hasOwnProperty("sampleNumber") && tool.options.sampleNumber !== 0) {
                elevationOptions.resolution = 0;
            }
            tool.getElevation(elevationOptions)
                .then(function () {
                    if (options.callback && TC.Util.isFunction(options.callback)) {
                        options.callback();
                    }
                    li && li.removeWait(waitId);
                })
                .catch(function (error) {
                    self.resetElevationProfile();
                    li && li.removeWait(waitId);
                });
        });
    };

    ctlProto.createProfilePanel = function () {
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
                onmouseout: ctlProto.removeElevationTooltip,
                tooltip: ctlProto.getElevationTooltip
            }
        };

        return new Promise(function (resolve, reject) {
            var addControlPromise;
            const addResultsPanelChart = function (controlContainer) {
                resultsPanelOptions.position = controlContainer.POSITION.RIGHT;
                addControlPromise = controlContainer.addControl('resultsPanel', resultsPanelOptions);
            };

            if (self.options.displayOn) {
                var controlContainer = self.map.getControlsByClass('TC.control.' + self.options.displayOn[0].toUpperCase() + self.options.displayOn.substring(1))[0];
                if (!controlContainer) {
                    self.map.addControl(self.options.displayOn).then(addResultsPanelChart);
                } else {
                    addResultsPanelChart(controlContainer);
                }
            } else {
                resultsPanelOptions.div = document.createElement('div');
                self.map.div.appendChild(resultsPanelOptions.div);
                addControlPromise = self.map.addControl('resultsPanel', resultsPanelOptions);
            }

            addControlPromise.then(function (resultsPanel) {
                resultsPanel.caller = self;
                self.resultsPanel = resultsPanel;
                self._decorateChartPanel();
                resolve(resultsPanel);
            });
        });
    };

    ctlProto.getProfilePanel = async function () {
        const self = this;
        if (!self._resultsPanelPromise) {
            self._resultsPanelPromise = self.createProfilePanel();
        }
        return await self._resultsPanelPromise;
    };

    ctlProto.resetElevationProfile = function () {
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
    };

    ctlProto.renderElevationProfile = function (profileData) {
        const self = this;
        if (!profileData.isSecondary) {
            self.elevationProfileChartData = profileData || self.elevationProfileChartData;
        }
        self.getProfilePanel().then(function (resultsPanel) {
            if (!resultsPanel.div.classList.contains(TC.Consts.classes.HIDDEN)) {
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
    };

    ctlProto.closeElevationProfile = function () {
        const self = this;
        self.getProfilePanel().then(function (resultsPanel) {
            resultsPanel.close();
        });
    };

    ctlProto._decorateChartPanel = function () {
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
    };

    ctlProto.getElevationTooltip = function (d) {
        const self = this;
        self.resultsPanel.wrap.showElevationMarker({
            data: d,
            layer: self.resultsPanel.currentFeature && self.resultsPanel.currentFeature.layer,
            coords: self.elevationProfileChartData.coords
        });

        return self.resultsPanel.getElevationChartTooltip(d);
    };

    ctlProto.removeElevationTooltip = function () {
        const self = this;
        if (self.resultsPanel) {
            if (self.resultsPanel.chart && self.resultsPanel.chart.chart) {
                self.resultsPanel.chart.chart.tooltip.hide();
            }
            self.resultsPanel.wrap.hideElevationMarker();
        }
    }
})();
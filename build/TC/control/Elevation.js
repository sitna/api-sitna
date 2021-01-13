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

    const elevationProfileCache = new WeakMap();

    const getElevationProfileFromCache = function (feature) {
        return elevationProfileCache.get(feature);
    };

    const cacheElevationProfile = function (feature, data) {
        elevationProfileCache.set(feature, data);
    };

    const removeElevationProfileFromCache = function (feature) {
        elevationProfileCache.delete(feature);
    };

    ctlProto.register = function (map) {
        const self = this;
        return new Promise(function (resolve, reject) {
            TC.Control.prototype.register.call(self, map).then(function () {

                map.on(TC.Consts.event.FEATUREMODIFY + ' ' + TC.Consts.event.FEATUREREMOVE + ' ' + TC.Consts.event.FEATURESCLEAR, function (e) {
                    removeElevationProfileFromCache(e.feature);
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

    ctlProto.displayElevationProfile = function (featureOrCoords) {
        const self = this;
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
        self.getElevationTool().then(function (tool) {
            const timestamp = Date.now();
            self._depTimestamp = timestamp;
            const elevationOptions = {
                crs: self.map.crs,
                coordinates: coords,
                partialCallback: function (elevCoords) {
                    li && li.removeWait(waitId);
                    if (timestamp === self._depTimestamp) { // Evitamos que una petición anterior machaque una posterior
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
                                var ele = point[2];
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
                        const elevationData = {
                            x: profile.map(function (elm) {
                                return elm[0];
                            }),
                            ele: profile.map(function (elm) {
                                return elm[1];
                            }),
                            coords: elevCoords
                        };
                        const elevationGainOptions = {
                            coords: elevCoords
                        };
                        if (typeof self.options.displayElevation === 'object') {
                            elevationGainOptions.hillDeltaThreshold = self.map.options.elevation.hillDeltaThreshold || self.options.displayElevation.hillDeltaThreshold;
                        }
                        TC.Util.extend(elevationData, TC.tool.Elevation.getElevationGain(elevationGainOptions));

                        // Cacheamos el perfil
                        if (featureOrCoords instanceof TC.Feature) {
                            cacheElevationProfile(featureOrCoords, elevationData);
                        }

                        renderProfile(elevationData);
                    }
                }
            };
            if (tool.options.sampleNumber) {
                elevationOptions.resolution = 0;
            }
            tool.getElevation(elevationOptions).catch(function (error) {
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
        self.elevationProfileChartData = profileData || self.elevationProfileChartData;
        self.getProfilePanel().then(function (resultsPanel) {
            if (!resultsPanel.div.classList.contains(TC.Consts.classes.HIDDEN)) {
                resultsPanel.openChart(self.elevationProfileChartData);
                if (!resultsPanel.isMinimized()) {
                    resultsPanel.show();
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
        self.resultsPanel.wrap.hideElevationMarker();
    }

})();
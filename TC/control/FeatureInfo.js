TC.control = TC.control || {};

if (!TC.control.FeatureInfoCommons) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/FeatureInfoCommons');
}

(function () {
    TC.control.FeatureInfo = function () {
        var self = this;
        TC.control.FeatureInfoCommons.apply(this, arguments);
        self.wrap = new TC.wrap.control.FeatureInfo(self);

        TC.Consts.classes.FROMLEFT = 'tc-fromleft';
        TC.Consts.classes.FROMRIGHT = 'tc-fromright';
    };

    TC.inherit(TC.control.FeatureInfo, TC.control.FeatureInfoCommons);

    var ctlProto = TC.control.FeatureInfo.prototype;

    var roundCoordinates = function roundCoordinates(obj, precision) {
        var result;
        var n = 20;
        if (Array.isArray(obj)) {
            result = obj.slice();
            for (var i = 0, len = result.length; i < len; i++) {
                result[i] = roundCoordinates(result[i]);
            }
        }
        else if (typeof obj === "number") {
            result = Math.round(obj.toFixed(precision));
        }
        else {
            result = obj;
        }
        return result;
    };

    ctlProto.register = function (map) {
        const self = this;
        return new Promise(function (resolve, reject) {
            TC.control.FeatureInfoCommons.prototype.register.call(self, map).then(
                function (ctl) {
                    // Le ponemos un padre al div. Evitamos con esto que se añada el div al mapa (no es necesario, ya que es un mero buffer)
                    document.createElement('div').appendChild(self.div);
                    resolve(ctl);
                },
                error => reject(error)
            );
        });
    };

    ctlProto.callback = function (coords, xy) {
        const self = this;

        self.querying = true;

        const elevationTool = self.getElevationTool();
        elevationTool.then(function (tool) {
            if (tool) {
                self.elevationRequest = tool.getElevation({
                    crs: self.map.crs,
                    coordinates: [coords]
                });
            }
        });

        if (self.map && self.filterLayer) {
            //aquí se pone el puntito temporal
            var title = self.getLocaleString('featureInfo');
            var markerOptions = TC.Util.extend({}, self.map.options.styles.marker, self.markerStyle, { title: title, set: title, showsPopup: false });
            self.filterLayer.clearFeatures();
            self.highlightedFeature = null;
            self.filterFeature = null;
            self.filterLayer.addMarker(coords, markerOptions).then(function afterMarkerAdd(marker) {
                ////cuando se queda el puntito es porque esto sucede tras el cierre de la popup
                ////o sea
                ////lo normal es que primero se ejecute esto, y luego se procesen los eventos FEATUREINFO o NOFEATUREINFO
                ////pero en el caso raro (la primera vez), ocurre al revés. Entonces, ya se habrá establecido lastFeatureCount (no será null)
                //if (self.lastFeatureCount === null) {
                //    self.map.putLayerOnTop(self.filterLayer);
                //    self.filterFeature = marker;
                //}
                //else {
                //    self.filterLayer.clearFeatures();
                //}
                self.map.putLayerOnTop(self.filterLayer);
                self.filterFeature = marker;

                elevationTool.then(function (tool) {
                    self.renderResults({ coords: marker.geometry, displayElevation: tool, loading: true }, function () {
                        self.displayResults();
                    });
                });

                var visibleLayers = false;
                for (var i = 0; i < self.map.workLayers.length; i++) {
                    var layer = self.map.workLayers[i];
                    if (layer.type === TC.Consts.layerType.WMS) {
                        if (layer.getVisibility() && layer.names.length > 0) {
                            visibleLayers = true;
                            break;
                        }
                    }
                }
                var resolution = self.map.getResolution();
                if (visibleLayers) {
                    self.wrap.getFeatureInfo(coords, resolution);
                }
                else {
                    // Metemos setTimeout para salirnos del hilo. Sin él se corre el riesgo de que se ejecute esto antes del evento BEFOREFEATUREINFO
                    setTimeout(function () {
                        self.responseCallback({ coords: coords });
                    });
                }
            });
        }
    };

    ctlProto.responseCallback = function (options) {
        const self = this;

        TC.control.FeatureInfoCommons.prototype.responseCallback.call(self, options);
        if (self.filterFeature) {
            var services = options.services;

            // Eliminamos capas sin resultados
            if (services) {
                for (var i = 0; i < services.length; i++) {
                    var service = services[i];
                    for (var j = 0; j < service.layers.length; j++) {
                        if (!service.layers[j].features.length) {
                            service.layers.splice(j, 1);
                            j = j - 1;
                        }
                    }
                    if (!service.layers.length) {
                        services.splice(i, 1);
                        i = i - 1;
                    }
                }
            }

            self.info.defaultFeature = options.defaultFeature;

            if (self.elevationRequest) {
                options.displayElevation = true;
            }
            self.renderResults(options, function () {
                self.insertLinks();

                if (self.sharedFeatureInfo) {
                    self.div.querySelectorAll('ul.' + self.CLASS + '-services li').forEach(function (li) {
                        li.classList.add(TC.Consts.classes.CHECKED);
                    })
                    var sharedFeature;
                    var featureObj = self.sharedFeatureInfo;
                    for (var i = 0, ii = self.info.services.length; i < ii; i++) {
                        var service = self.info.services[i];
                        if (service.mapLayers.some(function (ml) { return ml.url === featureObj.s })) {
                            for (var j = 0, jj = service.layers.length; j < jj; j++) {
                                var layer = service.layers[j];
                                if (layer.name === featureObj.l) {
                                    for (var k = 0, kk = layer.features.length; k < kk; k++) {
                                        var feature = layer.features[k];
                                        if (feature.id === featureObj.f) {
                                            sharedFeature = feature;
                                            var hash = hex_md5(JSON.stringify({
                                                data: feature.getData(),
                                                geometry: roundCoordinates(feature.geometry, TC.Consts.DEGREE_PRECISION) // Redondeamos a la precisión más fina (grado)
                                            }));
                                            if (featureObj.h !== hash) {
                                                TC.alert(self.getLocaleString('finfo.featureChanged.warning'));
                                            }
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    if (sharedFeature) {
                        self.highlightedFeature = sharedFeature;
                        self.map.addLayer({
                            id: self.getUID(),
                            type: TC.Consts.layerType.VECTOR,
                            title: self.getLocaleString('foi'),
                            owner: self,
                            stealth: true
                        }).then(function (layer) {
                            self.sharedFeatureLayer = layer;
                            self.filterLayer.clearFeatures();
                            self.filterFeature = null;
                            layer.addFeature(sharedFeature);
                            self.map.zoomToFeatures([sharedFeature]);
                        });
                    }
                    delete self.sharedFeatureInfo;
                }
                else {
                    self.displayResults();
                }
                //capturamos el click de label y enlaces para no propagarlos a las tablas y que haga zoom cuando no se quiere
                self.div.querySelectorAll('ul.' + self.CLASS + '-services label, ul.' + self.CLASS + '-services a').forEach(function (label) {
                    label.addEventListener(TC.Consts.event.CLICK, function (e) {
                        e.stopPropagation();
                    }, { passive: true })
                })
            });
        }
    };

    ctlProto.displayResultsCallback = function () {
        const self = this;
        TC.control.FeatureInfoCommons.prototype.displayResultsCallback.call(self);

        if (self.elevationRequest) {
            const ctl = self.getDisplayControl();
            self.getDisplayTarget().querySelectorAll(`.${self.CLASS}-elev,.${self.CLASS}-height`).forEach(elm => elm.classList.add(TC.Consts.classes.HIDDEN));
            self.elevationRequest.then(function (elevationCoords) {
                if (ctl.currentFeature && elevationCoords.length) {
                    const currentCoords = ctl.currentFeature.geometry;
                    const elevPoint = elevationCoords[0];
                    if (currentCoords[0] === elevPoint[0] && currentCoords[1] === elevPoint[1]) {
                        const elevationValues = elevationCoords.length ? elevationCoords[0].slice(2) : null;
                        self.displayElevation(elevationValues);
                    }
                }
                //self.elevationRequest = null;
            });
        }
        else if (!self.querying && (!self.info || !self.info.services)) {
            self.closeResults();
        }
    };

    ctlProto.renderResults = function (options, callback) {
        const self = this;
        if (self.filterFeature) {
            const currentCoords = self.filterFeature.geometry;
            if (options.coords && currentCoords[0] === options.coords[0] && currentCoords[1] === options.coords[1]) {
                options.isGeo = self.map.wrap.isGeo();
                if (options.coords) {
                    options.crs = self.map.crs;
                    options.coords = options.coords.map(function (value) {
                        const precision = options.isGeo ? TC.Consts.DEGREE_PRECISION : TC.Consts.METER_PRECISION;
                        return TC.Util.formatCoord(value, precision);
                    });
                }
                self.renderData(options, callback);
            }
        }
    };

    ctlProto.displayElevation = function (value) {
        const self = this;
        let tValue, sValue;
        if (Array.isArray(value)) {
            tValue = value[0];
            sValue = value.length > 1 ? value[1] : null;
        }
        else {
            tValue = value;
            sValue = null;
        }
        const locale = self.map.options.locale || TC.Cfg.locale;
        let elevationString = tValue === null ? '-' : TC.Util.formatNumber(Math.round(tValue), locale) + ' m';
        let heightString = sValue ? sValue.toLocaleString(locale, { maximumFractionDigits: 1 }) + ' m' : '-';
        const elevationDisplay = self.getDisplayTarget().querySelector(`.${self.CLASS}-elev`);
        const heightDisplay = self.getDisplayTarget().querySelector(`.${self.CLASS}-height`);
        elevationDisplay.classList.toggle(TC.Consts.classes.HIDDEN, tValue === null);
        heightDisplay.classList.toggle(TC.Consts.classes.HIDDEN, !sValue);
        elevationDisplay.querySelector(`.${self.CLASS}-coords-val`).innerHTML = elevationString;
        heightDisplay.querySelector(`.${self.CLASS}-coords-val`).innerHTML = heightString;
    };

    ctlProto.loadSharedFeature = function (featureObj) {
        // Función para dar compatibilidad hacia atrás, ahora las features se comparten por URL
        const self = this;
        if (featureObj) {
            //buscamos si la feature compartida pertenece a alguna de las capas añadidas
            if (self.map.workLayers.filter(function (item, i) {
                return item.type === TC.Consts.layerType.WMS && item.url === featureObj.s && item.getDisgregatedLayerNames().indexOf(featureObj.l) >= 0
            }).length === 0) {
                TC.error(self.getLocaleString('sharedFeatureNotValid'), TC.Consts.msgErrorMode.TOAST);
                return;
            }
            self.sharedFeatureInfo = featureObj;
            TC.loadJS(
                !window.hex_md5,
                [TC.apiLocation + TC.Consts.url.HASH],
                function () {
                    // Creamos una consulta getFeatureInfo ad-hoc, con la resolución a la que estaba la consulta original.
                    const coords = [-100, -100];
                    self.beforeRequest({ xy: coords }); // xy negativo para que no se vea el marcador, ya que no sabemos dónde ponerlo.
                    //aquí se pone el puntito temporal
                    self.filterLayer.clearFeatures();
                    self.filterFeature = null;
                    self.filterLayer.addMarker(coords).then(function (marker) {
                        self.filterFeature = marker;
                        self.wrap.getFeatureInfo(featureObj.xy, featureObj.r, {
                            serviceUrl: featureObj.s,
                            layerName: featureObj.l,
                            featureId: featureObj.f
                        });
                    });
                }
            );
        }
    };

})();
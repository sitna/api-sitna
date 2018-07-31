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

        if (self.options.displayElevation) {
            TC.loadJS(
                !TC.tool || !TC.tool.Elevation,
                TC.apiLocation + 'TC/tool/Elevation',
                function () {
                    const elevationOptions = typeof self.options.displayElevation === 'boolean' ? {} : self.options.displayElevation;
                    self.elevation = new TC.tool.Elevation(elevationOptions);
                }
            );
        }
    };

    TC.inherit(TC.control.FeatureInfo, TC.control.FeatureInfoCommons);

    var ctlProto = TC.control.FeatureInfo.prototype;

    ctlProto.FEATURE_PARAM = 'showfeature';

    var loadSharedFeature = function (ctl, featureObj) {
        //buscamos si la feature compartida pertenece a alguna de las capas añadidas
        if (jQuery.grep(ctl.map.workLayers, function (item,i) {
            return item.type === TC.Consts.layerType.WMS && item.url === featureObj.s && item.getDisgregatedLayerNames().indexOf(featureObj.l) >= 0
        }).length === 0) {
            TC.error(TC.Util.getLocaleString(ctl.map.options.locale, 'sharedFeatureNotValid'), TC.Consts.msgErrorMode.TOAST);
            return;
        }
        ctl.sharedFeatureInfo = featureObj;
        TC.loadJS(
            !window.hex_md5,
            [TC.apiLocation + TC.Consts.url.HASH],
            function () {
                // Creamos una consulta getFeatureInfo ad-hoc, con la resolución a la que estaba la consulta original.
                const coords = [-100, -100];
                ctl.beforeRequest({ xy: coords }); // xy negativo para que no se vea el marcador, ya que no sabemos dónde ponerlo.
                //aquí se pone el puntito temporal
                ctl.filterLayer.clearFeatures();
                $.when(ctl.filterLayer.addMarker(coords)).then(function (marker) {
                    ctl.filterFeature = marker;
                    ctl.wrap.getFeatureInfo(featureObj.xy, featureObj.r, {
                        serviceUrl: featureObj.s,
                        layerName: featureObj.l,
                        featureId: featureObj.f
                    });
                });
            }
        );
    };

    var roundCoordinates = function roundCoordinates(obj, precision) {
        var result;
        var n = 20;
        if ($.isArray(obj)) {
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
        var self = this;
        TC.control.FeatureInfoCommons.prototype.register.call(self, map);

        // Le ponemos un padre al div. Evitamos con esto que se añada el div al mapa (no es necesario, ya que es un mero buffer)
        self._$div.appendTo('<div>');

        map.loaded(function () {
            self._layersDeferred.then(function () {
                // Comprobamos si es un mapa con feature compartida
                var featureToShow = TC.Util.getParameterByName(self.FEATURE_PARAM);
                if (featureToShow) {
                    var featureObj;
                    try {
                        featureObj = JSON.parse(decodeURIComponent(escape(window.atob(featureToShow))));
                    }
                    catch (error) {
                        TC.error(TC.Util.getLocaleString(self.map.options.locale, 'sharedFeatureNotValid'), TC.Consts.msgErrorMode.TOAST);
                    }
                    if (featureObj) {
                        loadSharedFeature(self, featureObj);
                    }
                }
            });
        });
    };

    ctlProto.onShowModal = function () {
        var self = this;
        var $featureLi = $(self.getDisplayTarget()).find('ul.' + self.CLASS + '-features li.' + TC.Consts.classes.CHECKED);
        var shareCtl = self._shareCtl;
        shareCtl.extraParams = null;
        var $layerLi = $featureLi.parents('li').first();
        var $serviceLi = $layerLi.parents('li').first();
        var service = self.info.services[$serviceLi.index()];
        if (service) {
            var layer = service.layers[$layerLi.index()];
            if (layer) {
                var feature = layer.features[$featureLi.index()];
                TC.loadJS(
                    !window.hex_md5,
                    [TC.apiLocation + TC.Consts.url.HASH],
                    function () {
                        var hash = hex_md5(JSON.stringify({
                            data: feature.getData(),
                            geometry: roundCoordinates(feature.geometry, TC.Consts.DEGREE_PRECISION) // Redondeamos a la precisión más fina (grado)
                        }));
                        shareCtl.extraParams = {};
                        shareCtl.extraParams[self.FEATURE_PARAM] = window.btoa(unescape(encodeURIComponent(JSON.stringify({
                            xy: feature.wrap.getInnerPoint(),
                            r: self.map.getResolution(),
                            s: service.mapLayer.url,
                            l: layer.name,
                            f: feature.id,
                            h: hash
                        }))));

                        var $shareDiv = shareCtl._$div;
                        $shareDiv.find(".tc-url input[type=text]").val(shareCtl.generateLink());
                        $shareDiv.find(".tc-iframe input[type=text]").val(shareCtl.generateIframe());
                    }
                );
            }
        }
    };

    ctlProto.callback = function (coords, xy) {
        var self = this;

        if (self.elevation) {
            self.querying = true;

            self.elevationRequest = self.elevation.getElevation({
                crs: self.map.crs,
                coordinates: coords
            });
        }

        if (self.map && self.filterLayer) {
            //aquí se pone el puntito temporal
            var title = self.getLocaleString('featureInfo');
            var markerOptions = $.extend({}, self.map.options.styles.marker, self.markerStyle, { title: title, set: title });
            if (self.displayMode !== TC.control.FeatureInfoCommons.POPUP) {
                markerOptions.showsPopup = false;
            }
            self.filterLayer.clearFeatures();
            $.when(self.filterLayer.addMarker(coords, markerOptions)
            ).then(function (marker) {
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
                    self.responseCallback({ coords: coords });
                }
            });
        }
    };

    ctlProto.responseCallback = function (options) {
        var self = this;
        const endCallback = function (elevCoords) {

            TC.control.FeatureInfoCommons.prototype.responseCallback.call(self, options);
            self.querying = true;

            if (self.filterFeature) {
                var services = options.services;
                self.info = { services: services, defaultFeature: options.defaultFeature };

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

                var locale = self.map.options.locale || TC.Cfg.locale;
                options.isGeo = self.map.wrap.isGeo();
                if (elevCoords.length) {
                    const elevationValue = elevCoords[0][2];
                    options.elevation = elevationValue === null ? null : TC.Util.formatNumber(Math.round(elevationValue), locale);
                }
                if (options.coords) {
                    options.crs = self.map.crs;
                    options.coords = options.coords.map(function (value) {
                        return TC.Util.formatNumber(value.toFixed(options.isGeo ? TC.Consts.DEGREE_PRECISION : TC.Consts.METER_PRECISION), locale);
                    });
                }
                if ((services && services.length) || options.elevation !== null) {
                    self.renderData(options, function () {
                        self.insertLinks();

                        if (self.sharedFeatureInfo) {
                            self._$div.find('ul.' + self.CLASS + '-services li')
                                .addClass(TC.Consts.classes.CHECKED);
                            var sharedFeature;
                            var featureObj = self.sharedFeatureInfo;
                            for (var i = 0, ii = self.info.services.length; i < ii; i++) {
                                var service = self.info.services[i];
                                if (service.mapLayer.url === featureObj.s) {
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
                                self.map.addControl('popup', { div: TC.Util.getDiv(), closeButton: true }).then(function (popup) {
                                    sharedFeature.data = self._$div.html();
                                    popup.$popupDiv.addClass(self.CLASS + '-lite');
                                    var btnTitle = self.getLocaleString('deleteFeature');
                                    self.getRenderedHtml(self.CLASS + '-del-btn', null, function (html) {
                                        popup.$popupDiv.append(html);
                                        popup.$popupDiv.find('.' + self.CLASS + '-del-btn')
                                            .on(TC.Consts.event.CLICK, function (e) {
                                                TC.confirm(self.getLocaleString('deleteFeature.confirm'), function () {
                                                    self.map.removeLayer(self.sharedFeatureLayer);
                                                    delete self.sharedFeatureLayer;
                                                });
                                            });
                                    });
                                    sharedFeature.showsPopup = true;
                                    sharedFeature.popup = popup;
                                    self.map.addLayer({
                                        id: self.getUID(),
                                        type: TC.Consts.layerType.VECTOR,
                                        title: self.getLocaleString('foi'),
                                    }).then(function (layer) {
                                        self.sharedFeatureLayer = layer;
                                        self.filterLayer.clearFeatures();
                                        layer.addFeature(sharedFeature);
                                        self.map.zoomToFeatures([sharedFeature]);
                                    });
                                    self.map.on(TC.Consts.event.POPUP, function (e) {
                                        if (e.control === popup) {
                                            popup.$popupDiv.find('table').on(TC.Consts.event.CLICK, function (e) {
                                                self.map.zoomToFeatures([sharedFeature]);
                                            });
                                        }
                                    });
                                });
                            }
                            delete self.sharedFeatureInfo;
                        }
                        else {
                            self.displayResults();
                        }
                    });
                }
                else {
                    self.resultsLayer.clearFeatures();
                    self.filterLayer.clearFeatures();
                }

                self.querying = false;
            }
        };
        if (self.elevationRequest) {
            self.elevationRequest.then(endCallback);
        }
        else {
            endCallback([]);
        }
    };
})();
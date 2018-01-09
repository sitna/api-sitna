TC.control = TC.control || {};

if (!TC.control.FeatureInfoCommons) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/FeatureInfoCommons');
}

(function () {
    TC.control.GeometryFeatureInfo = function () {
        var self = this;
        TC.control.FeatureInfoCommons.apply(this, arguments);
        self.wrap = new TC.wrap.control.GeometryFeatureInfo(self);
        self.lineColor = !self.options.lineColor ? "#c00" : self.options.lineColor
        self.callback = function (coords, xy) {
            if (self._drawToken)
                return;
            self.closeResults();
            //self.filterLayer.clearFeatures();
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
            if (visibleLayers) {
                self.closeResults();
                self.wrap.beginDraw({
                    geometryType: self.geometryType,
                    xy: coords,
                    layer: self.filterLayer,
                    callback: function (feature) {
                        self.wrap.getFeaturesByGeometry(feature);
                    }
                });
            }
        };
        self._isDrawing = false;
        self._isSearching = false;
        self._drawToken = false;
    };

    TC.inherit(TC.control.GeometryFeatureInfo, TC.control.FeatureInfoCommons);

    var ctlProto = TC.control.GeometryFeatureInfo.prototype;

    ctlProto.register = function (map) {
        var self = this;
        TC.control.FeatureInfoCommons.prototype.register.call(self, map);

        map
            .on(TC.Consts.event.FEATUREINFOERROR, function (e) {
                if (e.xhr && e.xhr.status === 404) {
                    map.toast(e.control.getLocaleString("featureInfo.tooManyLayers"), { type: TC.Consts.msgType.ERROR });
                }
                self.lastFeatureCount = 0;
                self.closeResults();
            });

        self.$events.on(TC.Consts.event.CONTROLDEACTIVATE, function (e) {
            self.wrap.cancelDraw();
        });
    };

    ctlProto.responseCallback = function (e) {
        var self = this;
        if (self.filterFeature) {
            var services = e.services;
            self.info = { services: services };

            // Eliminamos capas sin resultados a no ser que tenga un error
            for (var i = 0; i < services.length; i++) {
                var service = services[i];
                if (service.hasLimits) {
                    delete service.layers
                    service.hasLimits = service.hasLimits;
                }
                else {
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
            if (services.length) {
                self.renderData(e, function () {
                    // Insert links
                    self._$div.find('td.' + self.CLASS + '-val').each(function (idx, elm) {
                        var $td = $(elm);
                        var text = $td.text();
                        if (TC.Util.isURL(text)) {
                            $td.html('<a href="' + text + '" target="_blank">' + text + '</a>');
                        }
                    });

                    self.displayResults();
                });
            }
            else {
                self.resultsLayer.clearFeatures();
            }
        }
    };

})();
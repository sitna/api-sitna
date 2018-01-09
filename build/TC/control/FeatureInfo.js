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

        self.callback = function (coords, xy) {
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
                self.wrap.getFeatureInfo(xy);
            }
            else {
                self.map.$events.trigger($.Event(TC.Consts.event.NOFEATUREINFO, { xy: xy, control: self }));
            }
        };
    };

    TC.inherit(TC.control.FeatureInfo, TC.control.FeatureInfoCommons);

    var ctlProto = TC.control.FeatureInfo.prototype;

    ctlProto.FEATURE_PARAM = 'showfeature';

    var hashUrl = TC.apiLocation + 'lib/jshash/md5-min.js';

    var loadSharedFeature = function (ctl, featureObj) {
        //buscamos si la feature compartida pertenece a alguna de las capas a\u00f1adidas
        if (jQuery.grep(ctl.map.workLayers, function (item,i) {
            return item.type === TC.Consts.layerType.WMS && item.url === featureObj.s && item.getDisgregatedLayerNames().indexOf(featureObj.l) >= 0
        }).length === 0) {
            TC.error(TC.Util.getLocaleString(ctl.map.options.locale, 'sharedFeatureNotValid'), TC.Consts.msgErrorMode.TOAST);
            return;
        }
        ctl.sharedFeatureInfo = featureObj;
        TC.loadJS(
            !window.hex_md5,
            [hashUrl],
            function () {
                // Creamos una consulta getFeatureInfo ad-hoc, con la resoluci\u00f3n a la que estaba la consulta original.
                // Hacemos la consulta sobre un cuadro de la anchura del radio de tolerancia.
                var radius = ctl.map.options.pixelTolerance || TC.Cfg.pixelTolerance;
                var mapWidth = 2 * radius + 1;
                var ij = [radius, radius];
                var boxHalfWidth = mapWidth * featureObj.r / 2;
                var bbox = [
                    featureObj.xy[0] - boxHalfWidth,
                    featureObj.xy[1] - boxHalfWidth,
                    featureObj.xy[0] + boxHalfWidth,
                    featureObj.xy[1] + boxHalfWidth
                ];
                ctl.beforeGetFeatureInfo({ xy: ij, control: ctl });
                ctl.wrap.getFeatureInfo(ij, {
                    serviceUrl: featureObj.s,
                    layerName: featureObj.l,
                    featureId: featureObj.f,
                    mapSize: [mapWidth, mapWidth],
                    boundingBox: bbox
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

        // Le ponemos un padre al div. Evitamos con esto que se a\u00f1ada el div al mapa (no es necesario, ya que es un mero buffer)
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

    ctlProto.beforeGetFeatureInfo = function (e) {
        var self = this;
        TC.control.FeatureInfoCommons.prototype.beforeGetFeatureInfo.call(self, e);

        if (e.control === self && self.map && self.filterLayer) {

            //aqu\u00ed se pone el puntito temporal
            var xy = null;
            while (!xy) {
                xy = self.map.getCoordinateFromPixel(e.xy)
            }
            var title = self.getLocaleString('featureInfo');
            var markerOptions = $.extend({}, self.map.options.styles.marker, self.markerStyle, { title: title, set: title });
            if (self.displayMode !== TC.control.FeatureInfoCommons.POPUP) {
                markerOptions.showsPopup = false;
            }
            self.filterLayer.clearFeatures();
            $.when(self.filterLayer.addMarker(xy, markerOptions)
            ).then(function (marker) {
                //cuando se queda el puntito es porque esto sucede tras el cierre de la popup
                //o sea
                //lo normal es que primero se ejecute esto, y luego se procesen los eventos FEATUREINFO o NOFEATUREINFO
                //pero en el caso raro (la primera vez), ocurre al rev\u00e9s. Entonces, ya se habr\u00e1 establecido lastFeatureCount (no ser\u00e1 null)
                if (self.lastFeatureCount === null) {
                    self.map.putLayerOnTop(self.filterLayer);
                    self.filterFeature = marker;
                }
                else {
                    self.filterLayer.clearFeatures();
                }
            });
        }
    };

    ctlProto.onShowModal = function () {
        var self = this;
        var $featureLi = self.getDisplayTarget().find('ul.' + self.CLASS + '-features li.' + TC.Consts.classes.CHECKED);
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
                    [hashUrl],
                    function () {
                        var hash = hex_md5(JSON.stringify({
                            data: feature.getData(),
                            geometry: roundCoordinates(feature.geometry, TC.Consts.DEGREE_PRECISION) // Redondeamos a la precisi\u00f3n m\u00e1s fina (grado)
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

    ctlProto.responseCallback = function (e) {
        var self = this;
        if (self.filterFeature) {
            var services = e.services;
            self.info = { services: services, defaultFeature: e.defaultFeature };

            // Eliminamos capas sin resultados
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
            if (services.length) {
                self.renderData(e, function () {
                    // Insert links
                    self._$div.find('td.' + self.CLASS + '-val').each(function (idx, elm) {
                        var $td = $(elm);
                        var text = $td.text();
                        if (TC.Util.isURL(text)) {
                            $td.html('<a href="' + text + '" target="_blank" title="' + self.getLocaleString('linkInNewWindow') + '">' + text + '</a>');
                        }
                    });

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
                                                    geometry: roundCoordinates(feature.geometry, TC.Consts.DEGREE_PRECISION) // Redondeamos a la precisi\u00f3n m\u00e1s fina (grado)
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
                            self.map.addControl(new TC.control.Popup({ div: TC.Util.getDiv(), closeButton: true })).then(function (popup) {
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
                                    id: TC.getUID(),
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
        }
    };
})();
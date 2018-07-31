TC.control = TC.control || {};

if (!TC.control.Measure) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/Measure');
}

TC.control.DrawMeasureModify = function () {
    var self = this;

    TC.control.Measure.apply(self, arguments);

    self.persistentDrawControls = true;

    self.renderPromise().then(function () {
        self._$coord = self._$div.find('.tc-ctl-meas-val-coord');
    });

    self._$dialogDiv = $(TC.Util.getDiv(self.options.dialogDiv));
    if (!self.options.dialogDiv) {
        self._$dialogDiv.appendTo('body');
    }

    if (self.options.displayElevation) {
        self.elevationActive = true;
        self.elevationProfileActive = true;
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

TC.inherit(TC.control.DrawMeasureModify, TC.control.Measure);

(function () {
    var ctlProto = TC.control.DrawMeasureModify.prototype;

    ctlProto.CLASS = 'tc-ctl-dmm';

    TC.Consts.event.DRAWCHART = TC.Consts.event.DRAWCHART || 'drawchart.tc';

    const elevationProfileCache = [];

    const getElevationProfileFromCache = function (feature) {
        return elevationProfileCache.filter(function (elm) {
            return elm.feature === feature;
        })[0];
    };

    const cacheElevationProfile = function (feature, data) {
        var result = getElevationProfileFromCache(feature);
        if (!result) {
            result = {
                feature: feature
            };
            elevationProfileCache.push(result);
        }
        result.data = data;
        return result;
    };

    const removeElevationProfileFromCache = function (feature) {
        const featIdx = elevationProfileCache.reduce(function (prev, cur, idx) {
            if (cur.feature === feature) {
                return idx;
            }
            return prev;
        }, -1);
        if (featIdx >= 0) {
            elevationProfileCache.splice(featIdx, 1);
        }
    };

    const clearElevationProfileCache = function () {
        elevationProfileCache.length = 0;
    };

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/DrawMeasureModify.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/DrawMeasureModifyDialog.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "drawAndMeasure" }).w(" <span class=\"tc-beta\">").h("i18n", ctx, {}, { "$key": "beta" }).w("</span></h2><div class=\"tc-ctl-meas-select\"><form><label class=\"tc-ctl-meas-btn-pt\"><input type=\"radio\" name=\"mode\" value=\"point\" /><span>").h("i18n", ctx, {}, { "$key": "points" }).w("</span></label><label class=\"tc-ctl-meas-btn-len\"><input type=\"radio\" name=\"mode\" value=\"polyline\" /><span>").h("i18n", ctx, {}, { "$key": "lines" }).w("</span></label><label class=\"tc-ctl-meas-btn-area\"><input type=\"radio\" name=\"mode\" value=\"polygon\" /><span>").h("i18n", ctx, {}, { "$key": "polygons" }).w("</span></label></form></div><div class=\"tc-ctl-meas-mode tc-ctl-meas-pt tc-hidden\"><div class=\"tc-ctl-meas-point\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "search.list.coordinates" }).w(": <span class=\"tc-ctl-meas-val-coord\"></span></div></div><div class=\"tc-ctl-meas-mode tc-ctl-meas-len tc-hidden\"><div class=\"tc-ctl-meas-line\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "2dLength" }).w(": <span class=\"tc-ctl-meas-val-len\"></span><button class=\"tc-ctl-meas-prof-btn tc-active\" title=\"").h("i18n", ctx, {}, { "$key": "deactivateElevationProfile" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.chart.chpe" }).w("</button></div></div><div class=\"tc-ctl-meas-mode tc-ctl-meas-area tc-hidden\"><div class=\"tc-ctl-meas-polygon\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "area" }).w(": <span class=\"tc-ctl-meas-val-area\"></span>, ").h("i18n", ctx, {}, { "$key": "2dPerimeter" }).w(": <span class=\"tc-ctl-meas-val-peri\"></span></div></div><div class=\"tc-ctl-dmm-tool\"><div class=\"tc-ctl-dmm-mod\"></div><div class=\"tc-ctl-dmm-cmd\"><button class=\"tc-ctl-dmm-btn-clr\" disabled title=\"").h("i18n", ctx, {}, { "$key": "deleteAll" }).w("\">").h("i18n", ctx, {}, { "$key": "deleteAll" }).w("</button><button class=\"tc-ctl-dmm-btn-dl\" disabled title=\"").h("i18n", ctx, {}, { "$key": "download" }).w("\">").h("i18n", ctx, {}, { "$key": "download" }).w("...</button></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-dmm-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "downloadSketch" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><div class=\"tc-ctl-dmm-dialog-ip\"><h4>").h("i18n", ctx, {}, { "$key": "interpolateCoordsFromElevProfile" }).w("</h4><label><input type=\"radio\" name=\"ip-coords\" value=\"0\" checked /><span>").h("i18n", ctx, {}, { "$key": "no" }).w("</span></label><label><input type=\"radio\" name=\"ip-coords\" value=\"1\"/><span>").h("i18n", ctx, {}, { "$key": "yes" }).w("</span></label><div class=\"tc-ctl-dmm-dialog-ip-m tc-hidden\">").h("i18n", ctx, {}, { "$key": "interpolateEveryXMeters.1" }).w("<input type=\"number\" min=\"1\" step=\"1\" class=\"tc-textbox\" value=\"").f(ctx.get(["interpolationInterval"], false), ctx, "h").w("\" />").h("i18n", ctx, {}, { "$key": "interpolateEveryXMeters.2" }).w("</div></div><div class=\"tc-ctl-dmm-dialog-dl\"><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-kml\" data-format=\"KML\" title=\"KML\">KML</button><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-gml\" data-format=\"GML\" title=\"GML\">GML</button><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-geojson\" data-format=\"GeoJSON\" title=\"GeoJSON\">GeoJSON</button><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-wkt\" data-format=\"WKT\" title=\"WKT\">WKT</button><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-gpx\" data-format=\"GPX\" title=\"GPX\">GPX</button></div></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.render = function (callback) {
        var self = this;
        TC.control.Measure.prototype.render.call(self, function () {
            self._$clearBtn = self._$div.find('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-clr').on(TC.Consts.event.CLICK, function (e) {
                TC.confirm(self.getLocaleString('deleteAll.confirm'), function () {
                    self.clear();
                });
            });
            self._$downloadBtn = self._$div.find('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-dl').on(TC.Consts.event.CLICK, function (e) {
                self.showSketchDownloadDialog();
            });

            self._$elevProfileBtn = self._$div.find('.tc-ctl-meas-prof-btn').on(TC.Consts.event.CLICK, function (e) {
                self.elevationProfileActive ? self.deactivateElevationProfile() : self.activateElevationProfile();
            });

            if (!self.options.displayElevation) {
                self._$elevProfileBtn.hide();
            }

            if ($.isFunction(callback)) {
                callback();
            }
        });

        const renderOptions = {};
        if (self.options.displayElevation) {
            renderOptions.interpolationInterval = self.options.displayElevation.resolution;
        }
        self.getRenderedHtml(self.CLASS + '-dialog', renderOptions, function(html) {
            const endExport = function (format) {
                const exportOptions = {
                    fileName: self.getLocaleString('sketch').toLowerCase().replace(' ', '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true),
                    format: format
                };
                if (self.options.displayElevation) {
                    const interpolateCoords = self._$dialogDiv.find('input[type=radio][name=ip-coords]:checked').val() === "1";
                    const elevOptionsTemplate = {
                        crs: self.map.crs,
                        sampleNumber: 0 // No queremos limitar el número de muestras
                    };
                    if (interpolateCoords) {
                        elevOptionsTemplate.resolution = self._$dialogDiv.find('.' + self.CLASS + '-dialog-ip-m input[type=number]').val() || self.options.displayElevation.resolution;
                    }
                    else {
                        elevOptionsTemplate.resolution = 0;
                    }
                    if (elevOptionsTemplate.resolution) {
                        // Validador de número de coordenadas máximo
                        const totalLength = self.layer.features.reduce(function (acc, feat) {
                            switch (true) {
                                case TC.feature.Polyline && feat instanceof TC.feature.Polyline:
                                case TC.feature.Polygon && feat instanceof TC.feature.Polygon:
                                    return acc + feat.getLength();
                                    break;
                                default:
                                    return acc;
                                    break;
                            }
                        }, 0);
                        if (totalLength / elevOptionsTemplate.resolution > self.options.displayElevation.maxCoordLength) {
                            TC.alert(self.getLocaleString('tooManyCoordinatesForElevation.warning'));
                            return;
                        }
                    }
                    TC.Util.closeModal();
                    const li = self.map.getLoadingIndicator();
                    const waitId = li && li.addWait();
                    $.when.apply(this, self.layer.features.map(function (feature) {
                        const isPolygon = TC.feature.Polygon && feature instanceof TC.feature.Polygon;
                        if (isPolygon || (TC.feature.Polyline && feature instanceof TC.feature.Polyline)) {
                            const deferred = $.Deferred();
                            const data = feature.getData();
                            const elevOptions = $.extend({ coordinates: feature.geometry }, elevOptionsTemplate);
                            self.elevation.getElevation(elevOptions).then(
                                function (points) {
                                    // Eliminamos las elevaciones nulas
                                    // En GPX hay un bug con los valores cero, que hace que se tome el valor de elevación del punto previo, por eso ponemos NaN.
                                    const elevSubst = exportOptions.format === TC.Consts.format.GPX ? Number.NaN : 0;
                                    points.forEach(function (point) {
                                        if (point[2] === null) {
                                            point[2] = elevSubst;
                                        }
                                    });
                                    const newFeat = isPolygon ? new TC.feature.Polygon([points], feature.options) : new TC.feature.Polyline(points, feature.options);
                                    newFeat.setData(data);
                                    newFeat.setStyle(feature.getStyle());
                                    deferred.resolve(newFeat);
                                },
                                function (error) {
                                    deferred.reject(error);
                                }
                                );
                            return deferred.promise();
                        }
                        return feature;
                    })).then(
                        function () {
                            li && li.removeWait(waitId);
                            self.map.exportFeatures(Array.prototype.slice.call(arguments), exportOptions);
                        },
                        function (error) {
                            li && li.removeWait(waitId);
                            TC.error(self.getLocaleString('elevation.error'));
                        });
                }
                else {
                    TC.Util.closeModal();
                    self.map.exportFeatures(self.layer.features, exportOptions);
                }
            };
            self._$dialogDiv
                .html(html)
                .on('change', 'input[type=radio][name=ip-coords]', function (e) {
                    self._$dialogDiv.find('.' + self.CLASS + '-dialog-ip-m').toggleClass(TC.Consts.classes.HIDDEN, e.target.value === '0');
                })
                .on(TC.Consts.event.CLICK, 'button[data-format]', function (e) {
                    const format = $(e.target).data('format');
                    if (format === TC.Consts.format.GPX) {
                        if (self.layer.features.some(function (feature) {
                            return TC.feature.Polygon && feature instanceof TC.feature.Polygon;
                        })) {
                            TC.confirm(self.getLocaleString('gpxNotCompatible.confirm'), function () {
                                endExport(format);
                            });
                        }
                        else {
                            endExport(format);
                        }
                    }
                    else {
                        endExport(format);
                    }
                });
        });
    };

    ctlProto.register = function (map) {
        const self = this;
        TC.control.Measure.prototype.register.call(self, map);
        const drawPointsId = self.getUID();
        const modifyId = self.getUID();

        $.when(self.layerPromise, self.renderPromise()).then(function (layer) {
            self._modifyPromise = map.addControl('modify', {
                id: modifyId,
                div: self._$div.find('.' + self.CLASS + '-mod'),
                layer: layer
            });
            
            self._modifyPromise.then(function (modify) {

                self.modify = modify;
                modify
                    .on(TC.Consts.event.FEATURESSELECT, function (e) {
                        const feature = e.features[e.features.length - 1];
                        if (feature) {
                            self.showMeasures(self.getFeatureMeasureData(feature));
                            const style = feature._originalStyle || feature.getStyle();
                            switch (true) {
                                case TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                                    self.displayMode(TC.Consts.geom.POLYGON);
                                    self.drawPolygons
                                        .setStrokeColorWatch(style.strokeColor)
                                        .setStrokeWidthWatch(style.strokeWidth);
                                    break;
                                case TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                                    self.displayMode(TC.Consts.geom.POLYLINE);
                                    self.drawLines
                                        .setStrokeColorWatch(style.strokeColor)
                                        .setStrokeWidthWatch(style.strokeWidth);
                                    const profile = getElevationProfileFromCache(feature);
                                    if (profile) {
                                        self.renderElevationChart(profile.data);
                                    }
                                    break;
                                case TC.feature.Point && feature instanceof TC.feature.Point:
                                    self.displayMode(TC.Consts.geom.POINT);
                                    self.drawPoints
                                        .setStrokeColorWatch(style.strokeColor)
                                        .setStrokeWidthWatch(style.strokeWidth);
                                    break;
                                default:
                                    break;
                            }
                            self.modify
                                .setFontColorWatch(style.fontColor)
                                .setFontSizeWatch(style.fontSize);
                        }
                    })
                    .on(TC.Consts.event.FEATURESUNSELECT, function (e) {
                        const features = self.modify.getSelectedFeatures();
                        if (!features.length) {
                            self.resetDrawWatches();
                        }
                        self.resetElevationProfile();
                        if (self.resultsPanelChart) {
                            self.resultsPanelChart.hide();
                        }
                    })
                    .on(TC.Consts.event.FEATUREMODIFY, function (e) {
                        if (e.layer === self.layer) {
                            removeElevationProfileFromCache(e.feature);
                            const setMeasures = function (feature) {
                                const measureData = self.getFeatureMeasureData(feature);
                                self.showMeasures(measureData);
                                self.setFeatureMeasureData(feature);
                            };
                            setMeasures(e.feature);

                            if (self.options.displayElevation) {
                                self.elevation.setGeometry({
                                    feature: e.feature,
                                    crs: self.map.crs
                                }).then(setMeasures);
                            }

                            const popups = self.map.getControlsByClass('TC.control.Popup');
                            popups.forEach(function (pu) {
                                if (pu.isVisible() && pu.currentFeature === e.feature) {
                                    pu.hide();
                                }
                            });
                        }
                    });

                map
                    .on(TC.Consts.event.CONTROLDEACTIVATE, function (e) {
                        if (e.control === self.modify) {
                            self.resetDrawWatches();
                            self.resetElevationProfile();
                            if (self.resultsPanelChart) {
                                self.resultsPanelChart.hide();
                            }
                        }
                        else if (e.control === self.drawLines) {
                            self.resetElevationProfile();
                            if (self.resultsPanelChart) {
                                self.resultsPanelChart.hide();
                            }
                        }
                    })
                    .on(TC.Consts.event.FEATURECLICK, function (e) {
                        if (TC.feature.Polyline && e.feature instanceof TC.feature.Polyline && self.layer.features.indexOf(e.feature) >= 0) {
                            const profile = getElevationProfileFromCache(e.feature);
                            if (profile) {
                                self.renderElevationChart(profile.data);
                            }
                            else {
                                self.displayElevationProfile(e.feature.geometry);
                            }
                            if (self.elevationProfileActive) {
                                map.getControlsByClass('TC.control.Popup').forEach(function (ctl) {
                                    if (ctl.currentFeature === e.feature) {
                                        ctl.hide();
                                    }
                                });
                            }
                        }
                    });
            });

            self._drawLinesPromise.then(function (drawLines) {
                drawLines.$events
                    .on(TC.Consts.event.DRAWSTART, function () {
                        //self.resetElevationProfile();
                        self.resetValues();
                    })
                    .on(TC.Consts.event.DRAWUNDO + ' ' + TC.Consts.event.DRAWREDO, function () {
                        const drawLines = this;
                        self.displayElevationProfile(drawLines.history.slice(0, drawLines.historyIndex));
                    })
                    .on(TC.Consts.event.POINT, function (e) {
                        const drawLines = this;
                        const coords = drawLines.history.slice(0, drawLines.historyIndex);
                        const lastCoord = coords[coords.length - 1];
                        if (lastCoord[0] !== e.point[0] || lastCoord[1] !== e.point[1]) {
                            coords.push(e.point);
                        }
                        self.displayElevationProfile(coords);
                    })
                    .on(TC.Consts.event.STYLECHANGE, function (e) {
                        self.onStyleChange(e);
                    });
            });

            self._drawPolygonsPromise.then(function (drawPolygons) {
                drawPolygons.$events
                    .on(TC.Consts.event.DRAWSTART, function () {
                        self.resetValues();
                    })
                    .on(TC.Consts.event.DRAWEND, function (e) {
                        if (self.options.displayElevation) {
                            self.elevation.setGeometry({
                                feature: e.feature,
                                crs: self.map.crs
                            });
                        }
                    })
                    .on(TC.Consts.event.STYLECHANGE, function (e) {
                        self.onStyleChange(e);
                    });
            });

            self._drawPointsPromise = map.addControl('draw', {
                id: drawPointsId,
                div: self._$div.find('.' + TC.control.Measure.prototype.CLASS + '-point'),
                mode: TC.Consts.geom.POINT,
                persistent: self.persistentDrawControls,
                styleTools: true,
                layer: self.layer
            });

            self._drawPointsPromise.then(function (drawPoints) {

                drawPoints.containerControl = self;
                self.drawControls.push(drawPoints);
                self.drawPoints = drawPoints;

                self.resetValues();

                drawPoints.$events
                    .on(TC.Consts.event.DRAWEND, function (e) {
                        const updateChanges = function (feat) {
                            self.showMeasures({ coords: feat.geometry, units: map.wrap.isGeo() ? 'degrees' : 'm' });
                            self.setFeatureMeasureData(feat);
                        };
                        updateChanges(e.feature);
                        if (self.options.displayElevation) {
                            self.elevation.setGeometry({
                                feature: e.feature,
                                crs: self.map.crs
                            }).then(updateChanges)
                        }
                    })
                    .on(TC.Consts.event.DRAWCANCEL, function (e) {
                        self.cancel();
                    })
                    .on(TC.Consts.event.STYLECHANGE, function (e) {
                        self.onStyleChange(e);
                    });
                // Desactivamos el método exportState que ya se encarga el control padre de ello
                drawPoints.exportsState = false;
            });

            self.setMode(self.options.mode);

            map
                .on(TC.Consts.event.FEATUREADD, function (e) {
                    if (e.layer === self.layer) {
                        self.setFeatureMeasureData(e.feature);
                        self._modifyPromise.then(function (modify) {
                            modify.displayLabelText(e.feature.getStyle().label);
                        });
                        self._$clearBtn.prop('disabled', false);
                        self._$downloadBtn.prop('disabled', false);
                    }
                })
                .on(TC.Consts.event.FEATUREREMOVE + ' ' + TC.Consts.event.FEATURESCLEAR, function (e) {
                    if (e.layer === self.layer) {
                        if (self.layer.features.length === 0) {
                            self._$clearBtn.prop('disabled', true);
                            self._$downloadBtn.prop('disabled', true);
                            self.resetValues();
                            clearElevationProfileCache();
                        }
                        else if (e.feature) {
                            removeElevationProfileFromCache(e.feature);
                        }
                    }
                });
        });
    };

    ctlProto.displayMode = function (mode) {
        const self = this;
        if (mode === TC.Consts.geom.POINT) {
            self._$activeMode = self._$div.find('.tc-ctl-meas-pt');
        }
        if (self.modify) {
            self.modify._$div.removeClass(TC.Consts.classes.COLLAPSED);
        }
        return TC.control.Measure.prototype.displayMode.call(self, mode);
    };

    ctlProto.setMode = function (mode) {
        const self = this;
        if (mode === TC.Consts.geom.POINT) {
            self.drawPoints.activate();
        }
        return TC.control.Measure.prototype.setMode.call(self, mode);
    };

    ctlProto.setFeatureMeasureData = function (feature) {
        const self = this;
        const data = {};
        switch (true) {
            case TC.feature.Point && feature instanceof TC.feature.Point:
                data[self.getLocaleString('search.list.coordinates')] = self._$coord.html();
                feature.setData(data);
                break;
            case TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                data[self.getLocaleString('2dLength')] = self._$len.html();
                feature.setData(data);
                break;
            case TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                data[self.getLocaleString('area')] = self._$area.html();
                data[self.getLocaleString('2dPerimeter')] = self._$peri.html();
                feature.setData(data);
                break;
            default:
                break;
        }
        return self;
    };

    ctlProto.getFeatureMeasureData = function (feature) {
        const self = this;
        const result = {
            units: 'm'
        };
        const measureOptions = {};
        if (self.map.wrap.isGeo()) {
            measureOptions.crs = TC.Cfg.utmCrs;
        }
        switch (true) {
            case TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                result.area = feature.getArea(measureOptions);
                result.perimeter = feature.getLength(measureOptions);
                break;
            case TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                result.length = feature.getLength(measureOptions);
                const profile = getElevationProfileFromCache(feature);
                if (profile) {
                    self.renderElevationChart(profile.data);
                }
                else {
                    self.displayElevationProfile(feature.geometry);
                }
                break;
            case TC.feature.Point && feature instanceof TC.feature.Point:
                result.coords = feature.geometry;
                break;
            default:
                break;
        }
        return result;
    };

    ctlProto.showMeasures = function (options) {
        const self = this;
        TC.control.Measure.prototype.showMeasures.call(self, options);
        options = options || {};
        var units = options.units;
        const locale = self.map.options.locale || TC.Cfg.locale
        if (options.coords) {
            var html = options.units === 'm' ?
                'x: ' + TC.Util.formatNumber(options.coords[0].toFixed(TC.Consts.METER_PRECISION), locale) +
                ', y: ' + TC.Util.formatNumber(options.coords[1].toFixed(TC.Consts.METER_PRECISION), locale) :
                TC.Util.formatNumber(options.coords[1].toFixed(TC.Consts.DEGREE_PRECISION), locale) + ', ' +
                TC.Util.formatNumber(options.coords[0].toFixed(TC.Consts.DEGREE_PRECISION), locale);
            if (options.coords.length > 2) {
                html += ', ' + self.getLocaleString('ele') + ': ' + TC.Util.formatNumber(options.coords[2].toFixed(TC.Consts.METER_PRECISION));
            }
            self._$coord.html(html);
        }
        return self;
    };

    ctlProto.resetValues = function () {
        const self = this;
        TC.control.Measure.prototype.resetValues.call(self);

        if (self._$coord) {
            self._$coord.text(self.NOMEASURE);
        }
        return self;
    };

    ctlProto.resetDrawWatches = function () {
        const self = this;
        self.drawControls.forEach(function (ctl) {
            ctl
                .setStrokeColorWatch()
                .setStrokeWidthWatch();
        });
    };

    ctlProto.clear = function () {
        const self = this;
        self.resetValues();
        self.layer.clearFeatures();
        if (self.modify.isActive) {
            self.modify.deactivate();
        }
        if (self.options.displayElevation) {
            self.resetElevationProfile();
            if (self.resultsPanelChart) {
                self.resultsPanelChart.hide();
            }
        }
        self._$clearBtn.prop('disabled', true);
        self._$downloadBtn.prop('disabled', true);
        return self;
    };

    ctlProto.showSketchDownloadDialog = function (options) {
        const self = this;

        const $dialog = self._$dialogDiv.find('.' + self.CLASS + '-dialog');

        // Si no hay líneas o polígonos, no es necesario preguntar si descargarmos las coordenadas del perfil
        $dialog.find('.' + self.CLASS + '-dialog-ip').toggleClass(TC.Consts.classes.HIDDEN, !self.layer.features.some(function (feature) {
            return (TC.feature.Polyline && feature instanceof TC.feature.Polyline) || (TC.feature.Polygon && feature instanceof TC.feature.Polygon);
        }));

        TC.Util.showModal($dialog, options);
        return self;
    };

    ctlProto.onStyleChange = function (e) {
        const self = this;
        var featureCtor;
        switch (e.target.mode) {
            case TC.Consts.geom.POLYGON:
                featureCtor = TC.feature.Polygon;
                break;
            case TC.Consts.geom.POLYLINE:
                featureCtor = TC.feature.Polyline;
                break;
            case TC.Consts.geom.POINT:
                featureCtor = TC.feature.Point;
                break;
            default:
                break;
        }
        if (featureCtor) {
            self.modify.getSelectedFeatures().forEach(function (feature) {
                if (feature instanceof featureCtor) {
                    const styleOptions = {};
                    styleOptions[e.property] = e.value;
                    //feature._originalStyle[e.property] = e.value;
                    feature.setStyle(styleOptions);
                    //clearTimeout(feature._selectionStyleTimeout);
                    //feature._selectionStyleTimeout = setTimeout(function () {
                    //    feature.setStyle(self.modify.styleFunction(feature));
                    //}, self.options.styleChangeDisplayTimeout || 1000);
                }
            });
        }
    }

    ctlProto.displayElevationProfile = function (coords) {
        const self = this;
        if (coords.length === 1) {
             // Espera una línea, metemos un segundo punto
            coords = coords.slice();
            coords.push(coords[0]);
        }
        const li = self.map.getLoadingIndicator();
        const waitId = li && li.addWait();
        self.elevation.getElevation({
            crs: self.map.crs,
            coordinates: coords
        }).then(
            function (elevCoords) {
                li && li.removeWait(waitId);
                var distance = 0.0;
                var maxElevation = Number.NEGATIVE_INFINITY;
                var minElevation = Number.POSITIVE_INFINITY;
                const profile = elevCoords
                    .map(function (point, idx, arr) {
                        const prev = idx === 0 ? point : arr[idx - 1];
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

                self.elevationProfileData = {
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
                    elevationGainOptions.hillDeltaThreshold = self.options.displayElevation.hillDeltaThreshold;
                }
                $.extend(self.elevationProfileData, TC.tool.Elevation.getElevationGain(elevationGainOptions));

                // Cacheamos el perfil
                const matchingFeature = self.layer.features
                    .filter(function (feat) {
                        return TC.feature.Polyline && feat instanceof TC.feature.Polyline;
                    })
                    .filter(function (line) {
                        for (var i = 0, len = coords.length; i < len; i++) {
                            const coord = coords[i];
                            const lineCoord = line.geometry[i];
                            if (coord[0] !== lineCoord[0] || coord[1] !== lineCoord[1]) {
                                return false;
                            }
                        }
                        return true;
                    })[0];
                if (matchingFeature) {
                    cacheElevationProfile(matchingFeature, self.elevationProfileData);
                }

                if (self.resultsPanelChart) {
                    self.renderElevationChart();
                }
                else {
                    const chartPanel = self.map.getControlsByClass(TC.control.ResultsPanel).filter(function (ctl) {
                        return ctl.options.content === 'chart';
                    })[0];
                    const $panelDiv = chartPanel ? chartPanel._$div : $('<div>').appendTo(self.map._$div);
                    self.map.addControl('resultsPanel', {
                        id: self.getUID(),
                        div: $panelDiv,
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
                    }).then(function (resultsPanelChart) {
                        self.resultsPanelChart = resultsPanelChart;
                        self.resultsPanelChart.render(function () {
                            self.renderElevationChart();
                        });
                    });
                }
            },
            function (error) {
                self.resetElevationProfile();
                li && li.removeWait(waitId);
            });

    };

    ctlProto.renderElevationChart = function (profileData) {
        const self = this;
        self.elevationProfileData = profileData || self.elevationProfileData;
        if (self.resultsPanelChart && self.elevationProfileActive) {
            self.resultsPanelChart.openChart(self.elevationProfileData);
            if (!self.resultsPanelChart.isMinimized()) {
                self.resultsPanelChart.show();
            }
        }
    };

    ctlProto.getElevationTooltip = function (d) {
        const self = this;
        self.resultsPanelChart.wrap.showElevationMarker({
            data: d,
            layer: self.layer,
            coords: self.elevationProfileData.coords
        });

        return self.resultsPanelChart.getElevationChartTooltip(d);
    };

    ctlProto.removeElevationTooltip = function () {
        var self = this;
        self.resultsPanelChart.wrap.hideElevationMarker();
    }

    ctlProto.activateElevationProfile = function () {
        const self = this;
        self.elevationProfileActive = true;
        self._$elevProfileBtn
            .addClass(TC.Consts.classes.ACTIVE)
            .attr('title', self.getLocaleString('deactivateElevationProfile'));
        var profileDrawn = false;
        if (self.drawLines.historyIndex > 1) {
            self.displayElevationProfile(self.drawLines.history.slice(0, self.drawLines.historyIndex));
            profileDrawn = true;
        }
        else {
            const features = self.modify.getActiveFeatures().filter(function (feat) {
                return TC.feature.Polyline && feat instanceof TC.feature.Polyline;
            });
            if (features.length) {
                const feature = features[features.length - 1];
                self.displayElevationProfile(feature.geometry);
                profileDrawn = true;
            }
        }
        if (!profileDrawn) {
            self.resetElevationProfile();
        }
        if (self.resultsPanelChart) {
            self.resultsPanelChart.show();
        }
    };

    ctlProto.deactivateElevationProfile = function () {
        const self = this;
        self.elevationProfileActive = false;
        self._$elevProfileBtn
            .removeClass(TC.Consts.classes.ACTIVE)
            .attr('title', self.getLocaleString('activateElevationProfile'));
        self.resetElevationProfile();
        if (self.resultsPanelChart) {
            self.resultsPanelChart.hide();
        }
    };

    ctlProto.resetElevationProfile = function () {
        const self = this;
        if (self.options.displayElevation) {
            self.elevationProfileData = {
                x: [0],
                ele: [0],
                coords: [0, 0, 0],
                upHill: 0,
                downHill: 0
            };
            if (self.resultsPanelChart) {
                self.renderElevationChart();
            }
        }
    };

})();
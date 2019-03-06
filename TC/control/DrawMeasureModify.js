TC.control = TC.control || {};

if (!TC.control.Measure) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/Measure');
}

TC.control.DrawMeasureModify = function () {
    var self = this;

    TC.control.Measure.apply(self, arguments);

    const cs = self._classSelector = '.' + self.CLASS;
    self._selectors = {
        ELEVATION_CHECKBOX: cs + '-dialog-elev input[type=checkbox]'
    };

    self.persistentDrawControls = true;

    self.renderPromise().then(function () {
        self._$1stCoordText = self._$div.find('.tc-ctl-meas-val-coord-1-t');
        self._$2ndCoordText = self._$div.find('.tc-ctl-meas-val-coord-2-t');
        self._$1stCoordValue = self._$div.find('.tc-ctl-meas-val-coord-1-v');
        self._$2ndCoordValue = self._$div.find('.tc-ctl-meas-val-coord-2-v');
        self._$elevationText = self._$div.find('.tc-ctl-meas-val-coord-ele-t');
        self._$elevationValue = self._$div.find('.tc-ctl-meas-val-coord-ele-v');
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

    var _dataKeys = {
        VALUE: 'tcValue'
    };


    TC.Consts.event.RESULTSPANELCLOSE = TC.Consts.event.RESULTSPANELCLOSE || 'resultspanelclose.tc';
    TC.Consts.event.FEATURESSELECT = TC.Consts.event.FEATURESSELECT || "featuresselect.tc";

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
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "drawAndMeasure" }).w("</h2><div class=\"tc-ctl-meas-select\"><form><label class=\"tc-ctl-meas-btn-pt\"><input type=\"radio\" name=\"mode\" value=\"point\" /><span>").h("i18n", ctx, {}, { "$key": "points" }).w("</span></label><label class=\"tc-ctl-meas-btn-len\"><input type=\"radio\" name=\"mode\" value=\"polyline\" /><span>").h("i18n", ctx, {}, { "$key": "lines" }).w("</span></label><label class=\"tc-ctl-meas-btn-area\"><input type=\"radio\" name=\"mode\" value=\"polygon\" /><span>").h("i18n", ctx, {}, { "$key": "polygons" }).w("</span></label></form></div><div class=\"tc-ctl-meas-mode tc-ctl-meas-pt tc-hidden\"><div class=\"tc-ctl-meas-point\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "search.list.coordinates" }).w(" <span class=\"tc-ctl-meas-val-coord\"><span class=\"tc-ctl-meas-val-coord-1-t\"></span> <span class=\"tc-ctl-meas-val-coord-1-v\"></span> <span class=\"tc-ctl-meas-val-coord-2-t\"></span> <span class=\"tc-ctl-meas-val-coord-2-v\"></span> <span class=\"tc-ctl-meas-val-coord-ele-t\"></span> <span class=\"tc-ctl-meas-val-coord-ele-v\"></span></span></div></div><div class=\"tc-ctl-meas-mode tc-ctl-meas-len tc-hidden\"><div class=\"tc-ctl-meas-line\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "2dLength" }).w(": <span class=\"tc-ctl-meas-val-len\"></span><button class=\"tc-ctl-meas-prof-btn tc-active\" title=\"").h("i18n", ctx, {}, { "$key": "deactivateElevationProfile" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.chart.chpe" }).w("</button></div></div><div class=\"tc-ctl-meas-mode tc-ctl-meas-area tc-hidden\"><div class=\"tc-ctl-meas-polygon\"></div><div class=\"tc-ctl-meas-txt\">").h("i18n", ctx, {}, { "$key": "area" }).w(": <span class=\"tc-ctl-meas-val-area\"></span>, ").h("i18n", ctx, {}, { "$key": "2dPerimeter" }).w(": <span class=\"tc-ctl-meas-val-peri\"></span></div></div><div class=\"tc-ctl-dmm-tool\"><div class=\"tc-ctl-dmm-mod\"></div><div class=\"tc-ctl-dmm-cmd\"><button class=\"tc-ctl-dmm-btn-clr\" disabled title=\"").h("i18n", ctx, {}, { "$key": "deleteAll" }).w("\">").h("i18n", ctx, {}, { "$key": "deleteAll" }).w("</button><button class=\"tc-ctl-dmm-btn-dl\" disabled title=\"").h("i18n", ctx, {}, { "$key": "download" }).w("\">").h("i18n", ctx, {}, { "$key": "download" }).w("...</button></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-dmm-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "downloadSketch" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\">").s(ctx.get(["elevation"], false), ctx, { "block": body_1 }, {}).w("<div class=\"tc-ctl-dmm-dialog-dl\"><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-kml\" data-format=\"KML\" title=\"KML\">KML</button><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-gml\" data-format=\"GML\" title=\"GML\">GML</button><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-geojson\" data-format=\"GeoJSON\" title=\"GeoJSON\">GeoJSON</button><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-wkt\" data-format=\"WKT\" title=\"WKT\">WKT</button><button class=\"tc-button tc-btn-dl tc-ctl-dmm-dl-btn-gpx\" data-format=\"GPX\" title=\"GPX\">GPX</button></div></div></div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<div class=\"tc-ctl-dmm-dialog-elev\"><input id=\"").f(ctx.get(["checkboxId"], false), ctx, "h").w("\" type=\"checkbox\" checked /><label for=\"").f(ctx.get(["checkboxId"], false), ctx, "h").w("\" class=\"tc-ctl-ftools-dialog-elev-label\">").h("i18n", ctx, {}, { "$key": "includeElevations" }).w("</label></div>").x(ctx.get(["resolution"], false), ctx, { "block": body_2 }, {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<div class=\"tc-ctl-dmm-dialog-ip\"><h4>").h("i18n", ctx, {}, { "$key": "interpolateCoordsFromElevProfile" }).w("</h4><label><input type=\"radio\" name=\"ip-coords\" value=\"0\" checked /><span>").h("i18n", ctx, {}, { "$key": "no" }).w("</span></label><label><input type=\"radio\" name=\"ip-coords\" value=\"1\"/><span>").h("i18n", ctx, {}, { "$key": "yes" }).w("</span></label><div class=\"tc-ctl-dmm-dialog-ip-m tc-hidden\">").h("i18n", ctx, {}, { "$key": "interpolateEveryXMeters.1" }).w("<input type=\"number\" min=\"1\" step=\"1\" class=\"tc-textbox\" value=\"").f(ctx.get(["resolution"], false), ctx, "h").w("\" />").h("i18n", ctx, {}, { "$key": "interpolateEveryXMeters.2" }).w("</div></div>"); } body_2.__dustBody = !0; return body_0 };
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

        const renderOptions = {
            checkboxId: self.getUID(),
            elevation: self.options.displayElevation
        };
        self.getRenderedHtml(self.CLASS + '-dialog', renderOptions, function(html) {
            const endExport = function (format) {
                TC.Util.closeModal();
                const exportOptions = {
                    fileName: self.getLocaleString('sketch').toLowerCase().replace(' ', '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true),
                    format: format
                };
                const includeElevation = self._$dialogDiv.find(self._selectors.ELEVATION_CHECKBOX).prop('checked');
                if (includeElevation) {
                    const interpolateCoords = self._$dialogDiv.find('input[type=radio][name=ip-coords]:checked').val() === "1";
                    const li = self.map.getLoadingIndicator();
                    const waitId = li && li.addWait();

                    const elevOptions = {
                        crs: self.map.crs,
                        features: self.layer.features.map(function (feat) {
                            // Solo mantenemos las features de las que hay que obtener elevación:
                            // - Las que no tienen elevación
                            // - Cuando hay interpolación, todas las líneas y los polígonos
                            if (feat.getGeometryStride() >= 3) {
                                if (!interpolateCoords || (TC.feature.Point && feat instanceof TC.feature.Point)) {
                                    return null;
                                }
                            }
                            return feat.clone();
                        }),
                        maxCoordQuantity: self.options.displayElevation.maxCoordQuantity,
                        sampleNumber: 0 // No queremos determinar el número de muestras
                    };
                    if (interpolateCoords) {
                        elevOptions.resolution = parseFloat(self._$dialogDiv.find('.' + self.CLASS + '-dialog-ip-m input[type=number]').val()) || self.options.displayElevation.resolution;
                    }
                    self.elevation.setGeometry(elevOptions)
                        .then(
                        function (features) {
                            // Volvemos a añadir las features de las que no hemos pedido elevación
                            features.forEach(function (feat, idx) {
                                if (!feat) {
                                    features[idx] = self.layer.features[idx];
                                }
                            });
                            self.map.exportFeatures(features, exportOptions);
                        },
                        function (msg, type) {
                            if (type === TC.tool.Elevation.errors.MAX_COORD_QUANTITY_EXCEEDED) {
                                TC.alert(self.getLocaleString('tooManyCoordinatesForElevation.warning'));
                                return;
                            }
                            TC.error(self.getLocaleString('elevation.error'));
                        }
                        )
                        .always(function () {
                            li && li.removeWait(waitId);
                        });
                }
                else {
                    var features;
                    if (self.options.displayElevation && !includeElevation) { // Hay que quitar elevaciones
                        features = self.layer.features
                            .map(function (feat) {
                                var f = feat.clone();
                                if (f.getGeometryStride() > 2) {
                                    f.getCoordsArray().forEach(function (coord) {
                                        coord.length = 2;
                                    });
                                    f.setCoords(f.geometry);
                                }
                                return f;
                            });
                    }
                    else {
                        features = self.layer.features;
                    }
                    self.map.exportFeatures(features, exportOptions);
                }
            };
            self._$dialogDiv
                .html(html)
                .on('change', self._selectors.ELEVATION_CHECKBOX, function (e) {
                    self.showSketchDownloadDialog(); // Recalculamos todo el aspecto del diálogo de descarga
                })
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
        const result = TC.control.Measure.prototype.register.call(self, map);
        const drawPointsId = self.getUID();
        const modifyId = self.getUID();

        $.when(self.layerPromise, self.renderPromise()).then(function (layer) {

            layer.title = self.getLocaleString('sketch');

            self._modifyPromise = map.addControl('modify', {
                id: modifyId,
                div: self._$div.find('.' + self.CLASS + '-mod'),
                layer: layer
            });
            
            self._modifyPromise.then(function (modify) {

                self.modify = modify;
                modify
                    .on(TC.Consts.event.FEATURESSELECT, function (e) {
                        if (self.resultsPanelChart && !e.features.some(function (feature) {
                            return self.resultsPanelChart.currentFeature === feature;
                        })) {
                            self.resultsPanelChart.setCurrentFeature(null);
                        }
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
                                        self.resultsPanelChart.setCurrentFeature(feature);
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
                            self.resultsPanelChart.close();
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

                            // Si es un punto metemos la elevación en la geometría (porque la mostramos en las medidas)
                            if (self.options.displayElevation && TC.feature.Point && e.feature instanceof TC.feature.Point) {
                                self.elevation.setGeometry({
                                    features: [e.feature],
                                    crs: self.map.crs
                                }).then(function (features) {
                                    setMeasures(features[0]);
                                });
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
                                self.resultsPanelChart.setCurrentFeature(null);
                                self.resultsPanelChart.close();
                            }
                        }
                        else if (e.control === self.drawLines) {
                            self.resetElevationProfile();
                            if (self.resultsPanelChart) {
                                self.resultsPanelChart.close();
                            }
                        }
                    })
                    .on(TC.Consts.event.FEATURECLICK, function (e) {
                        // No queremos que se muestre el perfil de la feature ya dibujada si estamos dibujando o seleccionando otra
                        if (!(map.activeControl instanceof TC.control.Draw || map.activeControl instanceof TC.control.Modify)) {
                            if (TC.feature.Polyline && e.feature instanceof TC.feature.Polyline && self.layer.features.indexOf(e.feature) >= 0) {
                                if (self.elevationProfileActive) {
                                    if (self.resultsPanelChart) {
                                        self.resultsPanelChart.setCurrentFeature(e.feature);
                                    }
                                    map.getControlsByClass('TC.control.Popup').forEach(function (ctl) {
                                        if (ctl.currentFeature === e.feature) {
                                            ctl.hide();
                                        }
                                    });
                                }
                                const profile = getElevationProfileFromCache(e.feature);
                                if (self.resultsPanelChart && self.resultsPanelChart.isMinimized()) {
                                    self.resultsPanelChart.maximize();
                                }
                                if (profile) {
                                    self.renderElevationChart(profile.data);
                                }
                                else {
                                    self.displayElevationProfile(e.feature.geometry);
                                }
                            }
                        }
                    });
            });

            self._drawLinesPromise.then(function (drawLines) {
                drawLines.$events
                    .on(TC.Consts.event.DRAWSTART, function () {
                        //self.resetElevationProfile();
                        if (self.resultsPanelChart && self.resultsPanelChart.currentFeature) {
                            self.resultsPanelChart.setCurrentFeature(null);
                        }
                        self.resetValues();
                    })
                    .on(TC.Consts.event.DRAWUNDO + ' ' + TC.Consts.event.DRAWREDO, function () {
                        const drawLines = this;
                        self.displayElevationProfile(drawLines.history.slice(0, drawLines.historyIndex));
                    })
                    .on(TC.Consts.event.DRAWEND, function (e) {
                        if (self.resultsPanelChart) {
                            self.resultsPanelChart.currentFeature = e.feature;
                        }
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
                    //.on(TC.Consts.event.DRAWEND, function (e) {
                    //    if (self.options.displayElevation) {
                    //        self.elevation.setGeometry({
                    //            features: [e.feature],
                    //            crs: self.map.crs
                    //        });
                    //    }
                    //})
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
                                features: [e.feature],
                                crs: self.map.crs
                            }).then(function (features) {
                                updateChanges(features[0]);
                            })
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
                })
                .on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                    if (e.control.setCurrentFeature) {
                        e.control.setCurrentFeature(null);
                    }                    
                });
        });

        return result;
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
                const firstCoordText = self._$1stCoordText.html();
                const secondCoordText = self._$2ndCoordText.html();
                const elevationText = self._$elevationText.html();
                data.CRS = self.map.crs;
                data[firstCoordText.substr(0, firstCoordText.indexOf(':'))] = self._$1stCoordValue.data(_dataKeys.VALUE);
                data[secondCoordText.substr(0, secondCoordText.indexOf(':'))] = self._$2ndCoordValue.data(_dataKeys.VALUE);
                if (elevationText) {
                    data[self.getLocaleString('ele')] = self._$elevationValue.data(_dataKeys.VALUE);
                }
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
            var precision;
            var coord1, coord2;
            if (options.units === 'm') {
                precision = TC.Consts.METER_PRECISION;
                coord1 = options.coords[0];
                coord2 = options.coords[1];
                self._$1stCoordText.html('x: ');
                self._$2ndCoordText.html('y: ');
            }
            else {
                precision = TC.Consts.DEGREE_PRECISION;
                coord1 = options.coords[1];
                coord2 = options.coords[0];
                self._$1stCoordText.html('lat: ');
                self._$2ndCoordText.html('lon: ');
            }
            const factor = Math.pow(10, precision);
            const round = function (val) {
                return Math.round(val * factor) / factor;
            }
            self._$1stCoordValue.html(TC.Util.formatNumber(coord1.toFixed(precision), locale)).data(_dataKeys.VALUE, round(coord1));
            self._$2ndCoordValue.html(TC.Util.formatNumber(coord2.toFixed(precision), locale)).data(_dataKeys.VALUE, round(coord2));
            if (options.coords.length > 2) {
                const elevation = Math.round(options.coords[2]);
                self._$elevationText.html(self.getLocaleString('ele').toLowerCase() + ': ');
                self._$elevationValue.html(TC.Util.formatNumber(elevation.toFixed(TC.Consts.METER_PRECISION), locale) + ' m').data(_dataKeys.VALUE, elevation);
            }
            else {
                self._$elevationText.html('');
                self._$elevationValue.html('').data(_dataKeys.VALUE, null);
            }
        }
        return self;
    };

    ctlProto.resetValues = function () {
        const self = this;
        TC.control.Measure.prototype.resetValues.call(self);

        if (self._$1stCoordText) {
            self._$1stCoordText.html(self.NOMEASURE);
            self._$2ndCoordText.html('');
            self._$1stCoordValue.html('').data(_dataKeys.VALUE, null);
            self._$2ndCoordValue.html('').data(_dataKeys.VALUE, null);
            self._$elevationText.html('');
            self._$elevationValue.html('').data(_dataKeys.VALUE, null);
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
                self.resultsPanelChart.close();
            }
        }
        self._$clearBtn.prop('disabled', true);
        self._$downloadBtn.prop('disabled', true);
        return self;
    };

    ctlProto.showSketchDownloadDialog = function (options) {
        const self = this;

        const $dialog = self._$dialogDiv.find('.' + self.CLASS + '-dialog');
        const hasPoints = self.layer.features.some(function (feature) {
            return (TC.feature.Point && feature instanceof TC.feature.Point) ||
                (TC.feature.MultiPoint && feature instanceof TC.feature.MultiPoint);
        });
        const hasLines = self.layer.features.some(function (feature) {
            return (TC.feature.Polyline && feature instanceof TC.feature.Polyline) ||
                (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline);
        });
        const hasPolygons = self.layer.features.some(function (feature) {
            return (TC.feature.Polygon && feature instanceof TC.feature.Polygon) ||
                (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon);
        });

        // Si no hay líneas o polígonos, no es necesario preguntar si queremos interpolar
        $dialog.find('.' + self.CLASS + '-dialog-ip').toggleClass(TC.Consts.classes.HIDDEN,
            !self._$dialogDiv.find(self._selectors.ELEVATION_CHECKBOX).prop('checked') || (!hasLines && !hasPolygons));

        // Si no hay líneas o puntos, no es necesario mostrar el botón de GPX
        $dialog.find('button[data-format=GPX]').toggleClass(TC.Consts.classes.HIDDEN, !hasLines && !hasPoints);

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
                    self.createChartPanel().then(function (resultsPanelChart) {
                        self.resultsPanelChart.renderPromise().then(function () {
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

    ctlProto.createChartPanel = function () {
        const self = this;
        const deferred = $.Deferred();
        self.map.addControl('resultsPanel', {
            id: self.getUID(),
            div: $('<div>').appendTo(self.map._$div),
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
            resultsPanelChart.caller = self;
            self.resultsPanelChart = resultsPanelChart;
            self._decorateChartPanel();
            deferred.resolve(resultsPanelChart);
        });
        return deferred.promise();
    };

    ctlProto._decorateChartPanel = function () {
        const self = this;
        self.resultsPanelChart.setCurrentFeature = function (feature) {
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
            self.resultsPanelChart.close();
        }
    };

    ctlProto.resetElevationProfile = function () {
        const self = this;
        if (self.options.displayElevation && self.resultsPanelChart) {
            self.elevationProfileData = {
                x: [0],
                ele: [0],
                coords: [0, 0, 0],
                upHill: 0,
                downHill: 0
            };
            self.resultsPanelChart.openChart(self.elevationProfileData);
        }
    };

})();
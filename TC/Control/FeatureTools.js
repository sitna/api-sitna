TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.Consts.event.POPUP = TC.Consts.event.POPUP || 'popup.tc';
TC.Consts.event.POPUPHIDE = TC.Consts.event.POPUPHIDE || 'popuphide.tc';
TC.Consts.event.DRAWCHART = TC.Consts.event.DRAWCHART || 'drawchart.tc';
TC.Consts.event.DRAWTABLE = TC.Consts.event.DRAWTABLE || 'drawtable.tc';

TC.control.FeatureTools = function () {
    const self = this;

    TC.Control.apply(self, arguments);

    self.layer = null;
    self.exportsState = true;

    const cs = self._classSelector = '.' + self.CLASS;
    self._selectors = {
        ELEVATION_CHECKBOX: cs + '-dialog-elev input[type=checkbox]',
        INTERPOLATION_RADIO: 'input[type=radio][name=finfo-ip-coords]',
        INTERPOLATION_DISTANCE: cs + '-dialog-ip-m'
    };

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

    self._$dialogDiv = $(TC.Util.getDiv(self.options.dialogDiv));
    if (!self.options.dialogDiv) {
        self._$dialogDiv.appendTo('body');
    }
};

TC.inherit(TC.control.FeatureTools, TC.Control);

(function () {
    var ctlProto = TC.control.FeatureTools.prototype;

    ctlProto.CLASS = 'tc-ctl-ftools';

    ctlProto.TITLE_SEPARATOR = ' • ';
    ctlProto.FILE_TITLE_SEPARATOR = '__';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/FeatureTools.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/FeatureToolsDialog.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-ftools\"><button class=\"tc-ctl-ftools-dl-btn\" title=\"").h("i18n", ctx, {}, { "$key": "download" }).w("\">").h("i18n", ctx, {}, { "$key": "download" }).w("</button><button class=\"tc-ctl-ftools-share-btn\" title=\"").h("i18n", ctx, {}, { "$key": "share" }).w("\">").h("i18n", ctx, {}, { "$key": "share" }).w("</button><button class=\"tc-ctl-ftools-zoom-btn\" title=\"").h("i18n", ctx, {}, { "$key": "zoomToFeature" }).w("\">").h("i18n", ctx, {}, { "$key": "zoomToFeature" }).w("</button><button class=\"tc-ctl-ftools-del-btn\" title=\"").h("i18n", ctx, {}, { "$key": "deleteFeature" }).w("\">").h("i18n", ctx, {}, { "$key": "deleteFeature" }).w("</button></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-ftools-dialog tc-ctl-ftools-dl-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "feature" }).w(" - ").h("i18n", ctx, {}, { "$key": "download" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\">").s(ctx.get(["elevation"], false), ctx, { "block": body_1 }, {}).w("<div class=\"tc-ctl-ftools-dialog-dl\"><div><button class=\"tc-button tc-btn-dl tc-ctl-ftools-dl-btn-kml\" data-format=\"KML\" title=\"KML\">KML</button><button class=\"tc-button tc-btn-dl tc-ctl-ftools-dl-btn-gml\" data-format=\"GML\" title=\"GML\">GML</button><button class=\"tc-button tc-btn-dl tc-ctl-ftools-dl-btn-geojson\" data-format=\"GeoJSON\" title=\"GeoJSON\">GeoJSON</button><button class=\"tc-button tc-btn-dl tc-ctl-ftools-dl-btn-wkt\" data-format=\"WKT\" title=\"WKT\">WKT</button><button class=\"tc-button tc-btn-dl tc-ctl-ftools-dl-btn-gpx\" data-format=\"GPX\" title=\"GPX\">GPX</button></div></div></div></div></div><div class=\"tc-ctl-ftools-dialog tc-ctl-ftools-share-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "feature" }).w(" - ").h("i18n", ctx, {}, { "$key": "share" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\"><div class=\"tc-ctl-ftools-share-dialog-ctl\"></div></div></div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<div class=\"tc-ctl-ftools-dialog-elev\"><input id=\"").f(ctx.get(["checkboxId"], false), ctx, "h").w("\" type=\"checkbox\"><label for=\"").f(ctx.get(["checkboxId"], false), ctx, "h").w("\" class=\"tc-ctl-ftools-dialog-elev-label\">").h("i18n", ctx, {}, { "$key": "includeElevations" }).w("</label></div>").x(ctx.get(["resolution"], false), ctx, { "block": body_2 }, {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<div class=\"tc-ctl-ftools-dialog-ip tc-hidden\"><h4>").h("i18n", ctx, {}, { "$key": "interpolateCoordsFromElevProfile" }).w("</h4><label><input type=\"radio\" name=\"finfo-ip-coords\" value=\"0\" checked /><span>").h("i18n", ctx, {}, { "$key": "no" }).w("</span></label><label><input type=\"radio\" name=\"finfo-ip-coords\" value=\"1\"/><span>").h("i18n", ctx, {}, { "$key": "yes" }).w("</span></label><div class=\"tc-ctl-ftools-dialog-ip-m tc-hidden\">").h("i18n", ctx, {}, { "$key": "interpolateEveryXMeters.1" }).w("<input type=\"number\" min=\"1\" step=\"1\" class=\"tc-textbox\" value=\"").f(ctx.get(["resolution"], false), ctx, "h").w("\" />").h("i18n", ctx, {}, { "$key": "interpolateEveryXMeters.2" }).w("</div></div>"); } body_2.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        const self = this;
        const deferred = $.Deferred();
        const basePromise = TC.Control.prototype.register.call(self, map);

        $.when(basePromise, self.renderPromise()).then(function () {
            self.map.addControl('share', {
                id: self.getUID(),
                div: self._$dialogDiv.find('.tc-modal-body .' + self.CLASS + '-share-dialog-ctl'),
                includeControls: false // Establecemos el control para que no exporte estados de controles, así no se comparte la feature dos veces
            }).then(function (ctl) {
                self._shareCtl = ctl;
                deferred.resolve(self);
            });
        });

        map
            .on(TC.Consts.event.POPUP + ' ' + TC.Consts.event.DRAWTABLE + ' ' + TC.Consts.event.DRAWCHART, function (e) {
                self.currentDisplay = e.control;
                if (self.currentDisplay.caller) {
                    self.highlightedFeature = self.currentDisplay.caller.highlightedFeature;
                    if (self.highlightedFeature) {
                        self.highlightedFeature.showsPopup = true;
                    }
                }
                self.addUI(e.control);
            })
            .on(TC.Consts.event.POPUPHIDE + ' ' + TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                self.currentDisplay = null;
            })
            .on(TC.Consts.event.FEATUREADD, function (e) {
                if (self.currentDisplay && self.currentDisplay.caller && e.feature === self.currentDisplay.caller.highlightedFeature) {
                    self.highlightedFeature = e.feature;
                    self.highlightedFeature.showsPopup = true;
                }
            }).on(TC.Consts.event.FEATUREREMOVE, function (e) {
                if (e.feature === self.highlightedFeature) {
                    const highlightedFeature = e.feature.clone();
                    highlightedFeature.showsPopup = true;
                    // Si la feature se eliminó por un cierre de popup provocado por la apertura de otro, 
                    // reasignamos la feature nueva al popup, ya que este está apuntando a una feature que ya no está en el mapa.
                    map.getControlsByClass('TC.control.Popup').concat(map.getControlsByClass('TC.control.ResultsPanel')).forEach(function (ctl) {
                        if (ctl.currentFeature === self.highlightedFeature) {
                            ctl.currentFeature = highlightedFeature;
                        }
                    });
                    self.getHighlightLayer().then(function (layer) {
                        layer.addFeature(highlightedFeature);
                    });
                }
            });

        return deferred.promise();
    };

    ctlProto.render = function (callback) {
        const self = this;
        self.getRenderedHtml(self.CLASS + '-dialog', {
            checkboxId: self.getUID(),
            elevation: self.options.displayElevation
        }, function (html) {
            self._$dialogDiv
                .html(html)
                .on(TC.Consts.event.CLICK, 'button[data-format]', function (e) {
                    TC.Util.closeModal();
                    const li = self.map.getLoadingIndicator();
                    const waitId = li && li.addWait();

                    const shareOptions = {};
                    if (self._$dialogDiv.find(self._selectors.ELEVATION_CHECKBOX).prop('checked')) {
                        const interpolateCoords = self._$dialogDiv.find(self._selectors.INTERPOLATION_RADIO + ':checked').val() === "1";
                        shareOptions.elevation = {
                            resolution: interpolateCoords ? parseFloat(self._$dialogDiv.find(self._selectors.INTERPOLATION_DISTANCE + ' input[type=number]').val()) || self.options.displayElevation.resolution : 0
                        };
                    }
                    prepareFeatureToShare(self, shareOptions)
                        .then(
                        function (feature) {
                            self.map.exportFeatures([feature], {
                                fileName: self._getFeatureFilename(feature),
                                format: $(e.target).data('format')
                            });
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
                })
                .on('change', self._selectors.ELEVATION_CHECKBOX, function (e) {
                    self.showDownloadDialog(); // Recalculamos todo el aspecto del diálogo de descarga
                })
                .on('change', self._selectors.INTERPOLATION_RADIO, function (e) {
                    self._$dialogDiv.find(self._selectors.INTERPOLATION_DISTANCE).toggleClass(TC.Consts.classes.HIDDEN, e.target.value === '0');
                });

            self._firstRender.resolve();
            self.$events.trigger($.Event(TC.Consts.event.CONTROLRENDER));
            if ($.isFunction(callback)) {
                callback();
            }
        });
    };

    ctlProto.addUI = function (ctl) {
        const self = this;
        const $menuContainer = $(ctl.getMenuElement());
        // Nos aseguramos de que el se decora el control una sola vez
        const menuIsMissing = function () {
            return $menuContainer.length && !$menuContainer.find('.' + self.CLASS).length;
        };
        if (menuIsMissing()) {
            // Añadimos los botones de herramientas
            self.getRenderedHtml(self.CLASS, null, function (html) {
                if (menuIsMissing()) {
                    const $tools = $menuContainer
                        .append(html)
                        .find('.' + self.CLASS);

                    self.updateUI(ctl);

                    if (!self.map.options.stateful) {
                        // Compartir no funciona sin estado
                        $tools.find('.' + self.CLASS + '-share-btn').remove();
                    }
                    self._setToolButtonHandlers($tools);
                }
            });
        }
        else {
            self.updateUI(ctl);
        }
    };

    ctlProto.updateUI = function (ctl) {
        const self = this;
        const $uiDiv = $(ctl.getMenuElement()).find('.' + self.CLASS);
        $uiDiv.removeClass(TC.Consts.classes.ACTIVE);
        clearTimeout(self._uiUpdateTimeout);
        self._uiUpdateTimeout = setTimeout(function () {
            const currentFeature = self.getCurrentFeature();
            $uiDiv.toggleClass(TC.Consts.classes.ACTIVE, !!currentFeature && currentFeature.showsPopup);
        }, 100);
    };

    ctlProto._setToolButtonHandlers = function ($container) {
        const self = this;

        // Evento para mostrar diálogo modal de descarga
        $container.find('.' + self.CLASS + '-dl-btn').on(TC.Consts.event.CLICK, function (e) {
            self.showDownloadDialog();
        });

        // Evento para mostrar diálogo modal de compartir
        $container.find('.' + self.CLASS + '-share-btn').on(TC.Consts.event.CLICK, function (e) {
            self.showShareDialog();
        });

        // Evento para hacer zoom
        $container.find('.' + self.CLASS + '-zoom-btn').on(TC.Consts.event.CLICK, function (e) {
            self.zoomToCurrentFeature();
        });

        // Evento para borrar la feature
        $container.find('.' + self.CLASS + '-del-btn').on(TC.Consts.event.CLICK, function (e) {
            self.removeCurrentFeature();
        });
    };

    ctlProto.getHighlightLayer = function () {
        const self = this;
        const deferred = $.Deferred();
        if (self.layer) {
            deferred.resolve(self.layer);
        }
        else {
            self.map.addLayer({
                id: self.getUID(),
                title: self.CLASS + ': Highlighted features layer',
                type: TC.Consts.layerType.VECTOR,
                stealth: true
            }).then(function (layer) {
                if (!self.layer) {
                    self.layer = layer;
                }
                deferred.resolve(self.layer);
            });
        }
        return deferred.promise();
    };

    ctlProto.showDownloadDialog = function () {
        const self = this;

        const $dialog = self._$dialogDiv.find('.' + self.CLASS + '-dialog');
        const feature = self.getCurrentFeature();
        const isPoint = (TC.feature.Point && feature instanceof TC.feature.Point) ||
            (TC.feature.MultiPoint && feature instanceof TC.feature.MultiPoint);
        const isLine = (TC.feature.Polyline && feature instanceof TC.feature.Polyline) ||
            (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline);
        const isPolygon = (TC.feature.Polygon && feature instanceof TC.feature.Polygon) ||
            (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon);

        // Si no es una línea o polígono, no es necesario preguntar si queremos interpolar
        $dialog.find('.' + self.CLASS + '-dialog-ip').toggleClass(TC.Consts.classes.HIDDEN,
            !self._$dialogDiv.find(self._selectors.ELEVATION_CHECKBOX).prop('checked') || (!isLine && !isPolygon));
        // Si es un polígono, no es necesario mostrar el botón de GPX
        $dialog.find('button[data-format=GPX]').toggleClass(TC.Consts.classes.HIDDEN, !!isPolygon);

        TC.Util.showModal(self._$dialogDiv.find('.' + self.CLASS + '-dl-dialog'));
    };

    ctlProto.showShareDialog = function () {
        const self = this;
        TC.Util.showModal(self._$dialogDiv.find('.' + self.CLASS + '-share-dialog'), {
            openCallback: function () {
                self.onShowShareDialog();
            },
            closeCallback: function () {
                self._shareCtl.featureToShare = null;
            }
        });
    };

    ctlProto.getCurrentFeature = function () {
        const self = this;
        return self.currentDisplay && ((self.currentDisplay.caller && self.currentDisplay.caller.highlightedFeature) ||
            self.currentDisplay.currentFeature);
    };

    ctlProto.zoomToCurrentFeature = function () {
        const self = this;
        if (self.map) {
            self.map.zoomToFeatures([self.getCurrentFeature()], { animate: true });
        }
    };

    ctlProto.removeCurrentFeature = function () {
        const self = this;
        const currentFeature = self.getCurrentFeature();
        const removeFeature = function () {
            self.highlightedFeature = null;
            if (currentFeature && currentFeature.layer) {
                currentFeature.layer.removeFeature(currentFeature);
            }
        };
        const closeDisplay = function () {
            if (self.currentDisplay) {
                self.currentDisplay.close ? self.currentDisplay.close() : self.currentDisplay.hide();
            }
        };
        // No pedimos confirmación para borrar si es un resalte de GFI o una de las features añadidas por FeatureTools.
        if ((self.currentDisplay && self.currentDisplay.caller && self.currentDisplay.caller.highlightedFeature === currentFeature) ||
            currentFeature.layer === self.layer) {
            removeFeature();
            closeDisplay();
        }
        else {
            TC.confirm(self.getLocaleString('deleteFeature.confirm'), function () {
                removeFeature();
                closeDisplay();
            });
        }
    };

    const prepareFeatureToShare = function (ctl, options) {
        options = options || {};
        const deferred = $.Deferred();
        const currentFeature = ctl.getCurrentFeature();
        if (currentFeature) {
            const feature = currentFeature.clone();
            feature.setId(currentFeature.id);
            feature.layer = currentFeature.layer;
            if (options.elevation) {
                var mustGetElevations = true;
                if (!options.elevation.resolution && feature.getGeometryStride() > 2) {
                    mustGetElevations = false;
                }
                if (mustGetElevations) {
                    const elevOptions = {
                        crs: ctl.map.crs,
                        features: [feature],
                        maxCoordQuantity: ctl.options.displayElevation && ctl.options.displayElevation.maxCoordQuantity,
                        resolution: options.elevation.resolution,
                        sampleNumber: 0 // No queremos determinar el número de muestras
                    };
                    ctl.elevation.setGeometry(elevOptions).then(
                        function (features) {
                            deferred.resolve(features[0]);
                        },
                        function (msg, type) {
                            deferred.reject(msg, type);
                        }
                    );
                }
                else {
                    deferred.resolve(feature);
                }
            }
            else {
                const coordsArray = feature.getCoordsArray();
                const firstCoord = coordsArray[0];
                if (firstCoord && firstCoord.length > 2) {
                    coordsArray.forEach(function (coord) {
                        coord.length = 2;
                    });
                    feature.setCoords(feature.geometry);
                }
                deferred.resolve(feature);
            }
        }
        else {
            deferred.resolve(null);
        }
        return deferred.promise();
    };

    ctlProto.onShowShareDialog = function () {
        const self = this;
        const shareCtl = self._shareCtl;
        shareCtl.extraParams = null;
        prepareFeatureToShare(self).then(function (feature) {
            shareCtl.featureToShare = feature;
            var $shareDiv = shareCtl._$div;
            const link = shareCtl.generateLink();
            $shareDiv.find(".tc-url input[type=text]").val(link);
            $shareDiv.find(".tc-iframe input[type=text]").val(shareCtl.generateIframe(link));
        });
    };

    ctlProto.getFeatureTitle = function (feature) {
        const self = this;
        var result = "";
        if (feature) {
            result = feature.id;
        }
        return result;
    };

    ctlProto._getFeatureFilename = function (feature) {
        const self = this;
        const layerTitle = self.getFeatureTitle(feature).replace(new RegExp(self.TITLE_SEPARATOR, 'g'), self.FILE_TITLE_SEPARATOR) || self.getLocaleString('feature');
        return layerTitle.toLowerCase().replace(/\s/gi, '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true);
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState && self.layer) {
            return {
                id: self.id,
                layer: self.layer.exportState()
            };
        }
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        if (state.layer) {
            self.getHighlightLayer().then(function (layer) {
                layer.importState(state.layer);
            });
        }
    };
})();

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

    self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
    self._$dialogDiv = $(self._dialogDiv);
    if (!self.options.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
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
        map
            .on(TC.Consts.event.POPUP + ' ' + TC.Consts.event.DRAWTABLE + ' ' + TC.Consts.event.DRAWCHART, function (e) {
                self.currentDisplay = e.control;              // caso feature compartida
                if (self.currentDisplay.caller || (!self.currentDisplay.caller && self.currentDisplay.currentFeature)) {
                    self.highlightedFeature = !(!self.currentDisplay.caller && self.currentDisplay.currentFeature) ? self.currentDisplay.caller.highlightedFeature : self.currentDisplay.currentFeature;
                    if (self.highlightedFeature) {
                        self.highlightedFeature.showsPopup = true;
                    }

                    self.addUI(self.currentDisplay);
                }                
            })
            .on(TC.Consts.event.POPUPHIDE + ' ' + TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                self.currentDisplay = null;
            })
            .on(TC.Consts.event.FEATUREADD, function (e) {
                const feature = e.feature;
                if (self.currentDisplay && self.currentDisplay.caller && feature === self.currentDisplay.caller.highlightedFeature) {
                    self.highlightedFeature = feature;
                    self.highlightedFeature.showsPopup = true;
                }
            })
            .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                const feature = e.feature;
                if (feature === self.highlightedFeature) {
                    const highlightedFeature = feature.clone();
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

        return new Promise(function (resolve, reject) {
            Promise.all([TC.Control.prototype.register.call(self, map), self.renderPromise()]).then(function () {
                self.map.addControl('share', {
                    id: self.getUID(),
                    div: self._dialogDiv.querySelector('.tc-modal-body .' + self.CLASS + '-share-dialog-ctl'),
                    includeControls: false // Establecemos el control para que no exporte estados de controles, así no se comparte la feature dos veces
                }).then(function (ctl) {
                    self._shareCtl = ctl;
                    resolve(self);
                }).catch(function (err) {
                    reject(err instanceof Error ? err : Error(err));
                });
            });
        });
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(self.getRenderedHtml(self.CLASS + '-dialog', {
            checkboxId: self.getUID(),
            elevation: self.options.displayElevation
        }, function (html) {
            self._dialogDiv.innerHTML = html;
            self._dialogDiv.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector('button[data-format]', function (e) {
                TC.Util.closeModal();
                const li = self.map.getLoadingIndicator();
                const waitId = li && li.addWait();

                const shareOptions = {};
                if (self._dialogDiv.querySelector(self._selectors.ELEVATION_CHECKBOX) && self._dialogDiv.querySelector(self._selectors.ELEVATION_CHECKBOX).checked) {
                    const interpolateCoords = self._dialogDiv.querySelector(self._selectors.INTERPOLATION_RADIO + ':checked').value === "1";
                    shareOptions.elevation = {
                        resolution: interpolateCoords ? parseFloat(self._dialogDiv.querySelector(self._selectors.INTERPOLATION_DISTANCE + ' input[type=number]').value) || self.options.displayElevation.resolution : 0
                    };
                }
                prepareFeatureToShare(self, shareOptions)
                    .then(
                    function (feature) {
                        self.map.exportFeatures([feature], {
                            fileName: self._getFeatureFilename(feature),
                            format: e.target.dataset.format
                        });
                    },
                    function (error) {
                        if (TC.tool.Elevation && error === TC.tool.Elevation.errors.MAX_COORD_QUANTITY_EXCEEDED) {
                            TC.alert(self.getLocaleString('tooManyCoordinatesForElevation.warning'));
                            return;
                        }
                        TC.error(self.getLocaleString('elevation.error'));
                    }
                    )
                    .finally(function () {
                        li && li.removeWait(waitId);
                    });
            }));
            self._dialogDiv.addEventListener('change', TC.EventTarget.listenerBySelector(self._selectors.ELEVATION_CHECKBOX, function (e) {
                self.showDownloadDialog(); // Recalculamos todo el aspecto del diálogo de descarga
            }));
            self._dialogDiv.addEventListener('change', TC.EventTarget.listenerBySelector(self._selectors.INTERPOLATION_RADIO, function (e) {
                const idDiv = self._dialogDiv.querySelector(self._selectors.INTERPOLATION_DISTANCE);
                if (e.target.value === '0') {
                    idDiv.classList.add(TC.Consts.classes.HIDDEN);
                }
                else {
                    idDiv.classList.remove(TC.Consts.classes.HIDDEN);
                }
            }));

            self.trigger(TC.Consts.event.CONTROLRENDER);
            if ($.isFunction(callback)) {
                callback();
            }
        }));
    };

    ctlProto.addUI = function (ctl) {
        const self = this;
        const menuContainer = ctl.getMenuElement();
        // Nos aseguramos de que el se decora el control una sola vez
        const menuIsMissing = function () {
            return menuContainer && !menuContainer.querySelector('.' + self.CLASS);
        };
        if (menuIsMissing()) {
            // Añadimos los botones de herramientas
            self.getRenderedHtml(self.CLASS, null, function (html) {
                if (menuIsMissing()) {
                    const parser = new DOMParser();
                    const tools = parser.parseFromString(html, 'text/html').body.firstChild;
                    menuContainer.appendChild(tools);

                    self.updateUI(ctl);

                    if (!self.map.options.stateful) {
                        // Compartir no funciona sin estado
                        const shareBtn = tools.querySelector('.' + self.CLASS + '-share-btn');
                        shareBtn.parentElement.removeChild(shareBtn);
                    }
                    self._setToolButtonHandlers(tools);
                    self._decorateDisplay(ctl.getContainerElement());
                }
            });
        }
        else {
            self.updateUI(ctl);
        }
    };

    ctlProto._decorateDisplay = function (container) {
        const self = this;        

        if (self.highlightedFeature) {

            // Añadimos un zoom a la feature al pulsar en la tabla
            if (container.querySelector('table.tc-attr')) {
                container.querySelector('table.tc-attr').addEventListener(TC.Consts.event.CLICK, function (e) {
                    self.zoomToCurrentFeature();
                });

                container.querySelector('table.tc-attr').classList.add(self.CLASS + '-zoom');
                container.querySelector('table.tc-attr').setAttribute('title', self.getLocaleString('clickToCenter'));
            }                        

            // Añadimos botón de imprimir
            TC.loadJS(
                !TC.control.Print,
                [TC.apiLocation + 'TC/control/Print'],
                function () {
                    var printTitle = "";

                    if (self.highlightedFeature) {
                        printTitle = self.highlightedFeature.id;

                        if (self.highlightedFeature.showsPopup === true) {
                            new TC.control.Print({
                                target: container,
                                title: printTitle
                            });
                        }
                    }
                });
        }        
    };

    ctlProto.updateUI = function (ctl) {
        const self = this;
        const uiDiv = ctl.getMenuElement().querySelector('.' + self.CLASS);
        uiDiv.classList.remove(TC.Consts.classes.ACTIVE);
        clearTimeout(self._uiUpdateTimeout);
        self._uiUpdateTimeout = setTimeout(function () {
            const currentFeature = self.getCurrentFeature();
            if (currentFeature && currentFeature.showsPopup) {
                uiDiv.classList.add(TC.Consts.classes.ACTIVE);
            }
            else {
                uiDiv.classList.remove(TC.Consts.classes.ACTIVE);
            }
        }, 100);
    };

    ctlProto._setToolButtonHandlers = function (container) {
        const self = this;

        // Evento para mostrar diálogo modal de descarga
        container.querySelector('.' + self.CLASS + '-dl-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.showDownloadDialog();
        });

        if (self.map.options.stateful) {
            // Evento para mostrar diálogo modal de compartir
            container.querySelector('.' + self.CLASS + '-share-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
                self.showShareDialog();
            });
        }

        // Evento para hacer zoom
        container.querySelector('.' + self.CLASS + '-zoom-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.zoomToCurrentFeature();
        });

        // Evento para borrar la feature
        container.querySelector('.' + self.CLASS + '-del-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.removeCurrentFeature();
        });
    };

    ctlProto.getHighlightLayer = function () {
        const self = this;
        return new Promise(function (resolve, reject) {
            if (self.layer) {
                resolve(self.layer);
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
                    resolve(self.layer);
                });
            }
        });
    };

    ctlProto.showDownloadDialog = function () {
        const self = this;

        const dialog = self._dialogDiv.querySelector('.' + self.CLASS + '-dialog');
        const feature = self.getCurrentFeature();
        const isPoint = (TC.feature.Point && feature instanceof TC.feature.Point) ||
            (TC.feature.MultiPoint && feature instanceof TC.feature.MultiPoint);
        const isLine = (TC.feature.Polyline && feature instanceof TC.feature.Polyline) ||
            (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline);
        const isPolygon = (TC.feature.Polygon && feature instanceof TC.feature.Polygon) ||
            (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon);

        // Si no es una línea o polígono, no es necesario preguntar si queremos interpolar
        const ipDiv = dialog.querySelector('.' + self.CLASS + '-dialog-ip');
        if (ipDiv) {
            if ((self._dialogDiv.querySelector(self._selectors.ELEVATION_CHECKBOX) && !self._dialogDiv.querySelector(self._selectors.ELEVATION_CHECKBOX).checked) || (!isLine && !isPolygon)) {
                ipDiv.classList.add(TC.Consts.classes.HIDDEN);
            }
            else {
                ipDiv.classList.remove(TC.Consts.classes.HIDDEN);
            }
        }
        // Si es un polígono, no es necesario mostrar el botón de GPX
        const gpxBtn = dialog.querySelector('button[data-format=GPX]');
        if (isPolygon) {
            gpxBtn.classList.add(TC.Consts.classes.HIDDEN);
        }
        else {
            gpxBtn.classList.remove(TC.Consts.classes.HIDDEN);
        }

        TC.Util.showModal(self._dialogDiv.querySelector('.' + self.CLASS + '-dl-dialog'));
    };

    ctlProto.showShareDialog = function () {
        const self = this;
        TC.Util.showModal(self._dialogDiv.querySelector('.' + self.CLASS + '-share-dialog'), {
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
        return new Promise(function (resolve, reject) {
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
                                resolve(features[0]);
                            },
                            function (error) {
                                reject(Error(error));
                            }
                        );
                    }
                    else {
                        resolve(feature);
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
                    resolve(feature);
                }
            }
            else {
                resolve(null);
            }
        });
    };

    ctlProto.onShowShareDialog = function () {
        const self = this;
        const shareCtl = self._shareCtl;
        shareCtl.extraParams = null;
        prepareFeatureToShare(self).then(function (feature) {
            shareCtl.featureToShare = feature;
            const shareDiv = shareCtl.div;
            const link = shareCtl.generateLink();
            shareDiv.querySelector(".tc-url input[type=text]").value = link;
            shareDiv.querySelector(".tc-iframe input[type=text]").value = shareCtl.generateIframe(link);
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
        const layerTitle = self.getFeatureTitle(feature).toString().replace(new RegExp(self.TITLE_SEPARATOR, 'g'), self.FILE_TITLE_SEPARATOR) || self.getLocaleString('feature');
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

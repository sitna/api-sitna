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
    if (window.$) {
        self._$dialogDiv = $(self._dialogDiv);
    }
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
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/FeatureTools.html";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/FeatureToolsDialog.html";

    var downloadDialog = null;

    ctlProto.register = function (map) {
        const self = this;
        map
            .on(TC.Consts.event.POPUP + ' ' + TC.Consts.event.DRAWTABLE + ' ' + TC.Consts.event.DRAWCHART, function (e) {
                self.currentDisplay = e.control;              // caso feature compartida
                if (self.currentDisplay.caller || (!self.currentDisplay.caller && self.currentDisplay.currentFeature)) {
                    self.highlightedFeature = !(!self.currentDisplay.caller && self.currentDisplay.currentFeature) ? self.currentDisplay.caller.highlightedFeature : self.currentDisplay.currentFeature;
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
                }
            });
        //.on(TC.Consts.event.FEATUREREMOVE, function (e) {
        //    const feature = e.feature;
        //    if (feature === self.highlightedFeature) {
        //        const highlightedFeature = feature.clone();
        //        highlightedFeature.showsPopup = true;
        //        // Si la feature se eliminó por un cierre de popup provocado por la apertura de otro, 
        //        // reasignamos la feature nueva al popup, ya que este está apuntando a una feature que ya no está en el mapa.
        //        map.getControlsByClass('TC.control.Popup').concat(map.getControlsByClass('TC.control.ResultsPanel')).forEach(function (ctl) {
        //            if (ctl.currentFeature === self.highlightedFeature) {
        //                ctl.currentFeature = highlightedFeature;
        //            }
        //        });
        //        self.getHighlightLayer().then(function (layer) {
        //            layer.addFeature(highlightedFeature);
        //        });
        //    }
        //});

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

    ctlProto.render = function () {
        const self = this;

        return self._set1stRenderPromise(self.getRenderedHtml(self.CLASS + '-dialog', {
            checkboxId: self.getUID(),
            elevation: self.options.displayElevation
        }, function (html) {
            self._dialogDiv.innerHTML = html;
            if (!downloadDialog) {
                self.map.addControl('FeatureDownloadDialog').then(ctl => {
                    downloadDialog = ctl;
                });
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

                    const container = ctl.getContainerElement();
                    self._decorateDisplay(container);

                    // Añadimos botón de imprimir
                    TC.loadJS(
                        !TC.control.Print,
                        [TC.apiLocation + 'TC/control/Print'],
                        function () {
                            var printTitle = "";

                            if (!container.querySelectorAll('.' + TC.control.Print.prototype.CLASS + '-btn').length) {
                                if (self.highlightedFeature) {
                                    printTitle = self.highlightedFeature.id;

                                    if (self.highlightedFeature.showsPopup === true) {
                                        new TC.control.Print({
                                            target: menuContainer,
                                            printableElement: container,
                                            title: printTitle
                                        });
                                    }
                                }
                            }
                        });
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
            const attributeTable = container.querySelector('table.tc-attr');
            if (attributeTable) {
                attributeTable.addEventListener(TC.Consts.event.CLICK, function (e) {
                    self.zoomToCurrentFeature();
                });

                attributeTable.querySelectorAll('a, table label, table input').forEach(function (a) {
                    a.addEventListener(TC.Consts.event.CLICK, function (e) {
                        e.stopPropagation(); // No queremos zoom si pulsamos en un enlace
                    });
                });

                attributeTable.classList.add(self.CLASS + '-zoom');
                attributeTable.setAttribute('title', self.getLocaleString('clickToCenter'));
            }
        }
    };

    ctlProto.updateUI = function (ctl) {
        const self = this;
        const uiDiv = ctl.getMenuElement().querySelector('.' + self.CLASS);
        uiDiv.classList.remove(TC.Consts.classes.ACTIVE);
        clearTimeout(self._uiUpdateTimeout);
        self._uiUpdateTimeout = setTimeout(function () {
            const currentFeature = self.getCurrentFeature();
            uiDiv.classList.toggle(TC.Consts.classes.ACTIVE, currentFeature && currentFeature.layer.owner ? currentFeature.layer.owner.filterLayer !== currentFeature.layer : true);
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

    ctlProto.showDownloadDialog = function () {
        const self = this;

        const feature = self.getCurrentFeature();

        var options = {
            title: self.getLocaleString("feature") + " - " + self.getLocaleString("download"),
            fileName: self._getFeatureFilename(feature)
        };

        if (self.options.displayElevation !== true)
            options = Object.assign({}, options, { elevation: Object.assign({}, self.map.elevation && self.map.elevation.options, self.options.displayElevation) });
        else
            options = Object.assign({}, options, { elevation: self.map.elevation && self.map.elevation.options });

        if (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon || TC.feature.Polygon && feature instanceof TC.feature.Polygon)
            options = Object.assign({}, options, { excludedFormats: ["GPX"] });

        downloadDialog.open(feature, options);
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
        // No pedimos confirmación para borrar si es un resalte de GFI.
        if (currentFeature && currentFeature.layer.owner && currentFeature.layer === currentFeature.layer.owner.resultsLayer) {
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
                                reject(error instanceof Error ? error : Error(error));
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

})();

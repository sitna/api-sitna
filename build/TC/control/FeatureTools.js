TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.Consts.event.POPUP = TC.Consts.event.POPUP || 'popup.tc';
TC.Consts.event.POPUPHIDE = TC.Consts.event.POPUPHIDE || 'popuphide.tc';
TC.Consts.event.DRAWCHART = TC.Consts.event.DRAWCHART || 'drawchart.tc';
TC.Consts.event.DRAWTABLE = TC.Consts.event.DRAWTABLE || 'drawtable.tc';
TC.Consts.event.DIALOG = TC.Consts.event.DIALOG || 'dialog.tc';
TC.Consts.event.FEATUREHIGHLIGHT = TC.Consts.event.FEATUREHIGHLIGHT || 'featurehighlight.tc';
TC.Consts.event.FEATUREDOWNPLAY = TC.Consts.event.FEATUREDOWNPLAY || 'featuredownplay.tc';

TC.control.FeatureTools = function () {
    const self = this;

    TC.Control.apply(self, arguments);

    const cs = self._classSelector = '.' + self.CLASS;
    self._selectors = {
        ELEVATION_CHECKBOX: cs + '-dialog-elev input[type=checkbox]',
        INTERPOLATION_RADIO: 'input[type=radio][name=finfo-ip-coords]',
        INTERPOLATION_DISTANCE: cs + '-dialog-ip-m'
    };

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
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-ftools.hbs";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-ftools-dialog.hbs";

    ctlProto.register = function (map) {
        const self = this;
        map
            .on(TC.Consts.event.POPUP + ' ' + TC.Consts.event.DRAWTABLE + ' ' + TC.Consts.event.DRAWCHART, function (e) {
                const control = e.control;
                if (control.caller || (!control.caller && control.currentFeature)) {
                    self.addUI(control);
                }
                // TODO: ¿Y si miramos si la feature del control ya está asociada a otro control abierto para decir si decoramos o no?
            })
            .on(TC.Consts.event.FEATUREHIGHLIGHT, function (e) {
                self.addUI(e.control.getDisplayControl());
            })
            .on(TC.Consts.event.FEATUREDOWNPLAY, function (e) {
                self.updateUI(e.control.getDisplayControl());
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

    ctlProto.render = function () {
        const self = this;

        return self._set1stRenderPromise(Promise.all([
            self.renderData({ elevation: self.options.displayElevation }),
            self.getRenderedHtml(self.CLASS + '-dialog', {
                checkboxId: self.getUID(),
                elevation: self.options.displayElevation
            }, function (html) {
                self._dialogDiv.innerHTML = html;
            })
        ]));
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

                // Añadimos botón de imprimir
                TC.loadJS(
                    !TC.control.Print,
                    [TC.apiLocation + 'TC/control/Print'],
                    function () {
                        if (menuIsMissing()) {
                            let endAddUIPromise = Promise.resolve();
                            const container = ctl.getContainerElement();
                            if (!container.querySelectorAll('.' + TC.control.Print.prototype.CLASS + '-btn').length) {
                                const highlightedFeature = (!ctl.caller && ctl.currentFeature) ? ctl.currentFeature : ctl.caller.highlightedFeature;
                                if (highlightedFeature && highlightedFeature.showsPopup === true) {
                                    self.printControl = new TC.control.Print({
                                        target: menuContainer,
                                        printableElement: container,
                                        title: highlightedFeature.id
                                    });
                                    endAddUIPromise = self.printControl.renderPromise();
                                }
                            }

                            endAddUIPromise.then(function endAddUI() {
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
                                    self._setToolButtonHandlers(ctl);

                                    self._decorateDisplay(ctl);
                                }
                            });
                        }
                    });
            });
        }
        else {
            self.updateUI(ctl);
        }
    };

    ctlProto._decorateDisplay = function (displayControl) {
        const self = this;

        if (!displayControl.caller && displayControl.currentFeature) { // Si es un popup/panel propio de la feature

            // Añadimos un zoom a la feature al pulsar en la tabla
            const attributeTable = displayControl.getContainerElement().querySelector('table.tc-attr');
            if (attributeTable) {
                attributeTable.addEventListener(TC.Consts.event.CLICK, function (e) {
                    self.zoomToFeature(self.getCurrentFeature(displayControl));
                }, { passive: true });

                attributeTable.querySelectorAll('a, table label, table input').forEach(function (a) {
                    a.addEventListener(TC.Consts.event.CLICK, function (e) {
                        e.stopPropagation(); // No queremos zoom si pulsamos en un enlace
                    }, { passive: true });
                });

                attributeTable.classList.add(self.CLASS + '-zoom');
                attributeTable.setAttribute('title', self.getLocaleString('clickToCenter'));
            }
        }
    };

    ctlProto.updateUI = function (ctl) {
        const self = this;
        const uiDiv = ctl.getMenuElement().querySelector('.' + self.CLASS);
        const currentFeature = self.getCurrentFeature(ctl);
        // Primer caso para que isActive == true: que esté resaltada una feature.
        // Segundo caso: que la feature no sea de GFI.
        // Se puede haber llamado a updateUI después de haber eliminado la feature(FEATUREDOWNPLAY)
        // por es necesario que la feature tenga capa para considerar isActive == true.
        const isActive = currentFeature && currentFeature.layer && currentFeature.layer.owner ?
            currentFeature.layer.owner.filterLayer !== currentFeature.layer : currentFeature && !!currentFeature.layer;
        if (isActive) {
            if (currentFeature) {
                uiDiv.dataset.layerId = currentFeature.layer.id;
                uiDiv.dataset.featureId = currentFeature.id;
                const profileBtn = uiDiv.querySelector(`.${self.CLASS}-prof-btn`);
                if (profileBtn) {
                    profileBtn.classList.toggle(TC.Consts.classes.HIDDEN,
                        !(currentFeature instanceof TC.feature.Polyline || currentFeature instanceof TC.feature.MultiPolyline));
                }
            }
            else {
                delete uiDiv.dataset.layerId;
                delete uiDiv.dataset.featureId;
            }
        }
        if (self.printControl && currentFeature) {
            self.printControl.title = currentFeature.id
        }
        if (uiDiv) {
            uiDiv.classList.remove(TC.Consts.classes.ACTIVE);
            setTimeout(function () {
                uiDiv.classList.toggle(TC.Consts.classes.ACTIVE, !!isActive);
            }, 100);
        }
    };

    ctlProto._setToolButtonHandlers = function (ctl) {
        const self = this;

        const container = ctl.getMenuElement();

        // Evento para mostrar diálogo modal de descarga
        container.querySelector('.' + self.CLASS + '-dl-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.showDownloadDialog(self.getFeatureFromElement(this.parentElement));
        }, { passive: true });

        if (self.map.options.stateful) {
            // Evento para mostrar diálogo modal de compartir
            container.querySelector('.' + self.CLASS + '-share-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
                self.showShareDialog(self.getFeatureFromElement(this.parentElement));
            }, { passive: true });
        }

        // Evento para hacer zoom
        container.querySelector('.' + self.CLASS + '-zoom-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.zoomToFeature(self.getFeatureFromElement(this.parentElement));
        }, { passive: true });

        // Evento para hacer ver perfil
        const profileBtn = container.querySelector(`.${self.CLASS}-prof-btn`);
        if (profileBtn) {
            profileBtn.addEventListener(TC.Consts.event.CLICK, function (e) {
                self.getElevationControl().then(elevCtl => elevCtl && elevCtl.displayElevationProfile(self.getCurrentFeature(ctl)));
            }, { passive: true });
        }

        // Evento para borrar la feature
        container.querySelector('.' + self.CLASS + '-del-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.removeFeature(self.getFeatureFromElement(this.parentElement));
        }, { passive: true });
    };

    ctlProto.getElevationControl = async function () {
        const self = this;
        if (!self.options.displayElevation) {
            return null;
        }
        if (!self.elevationControl) {
            self.elevationControl = await self.map.addControl('elevation');
        }
        return self.elevationControl;
    };

    ctlProto.showDownloadDialog = async function (feature) {
        const self = this;

        const downloadDialog = await self.getDownloadDialog();

        var options = {
            title: self.getLocaleString("feature") + " - " + self.getLocaleString("download"),
            fileName: self._getFeatureFilename(feature)
        };

        if (self.map.elevation || self.options.displayElevation) {
            options = Object.assign({}, options, {
                elevation: Object.assign({}, self.map.elevation && self.map.elevation.options, self.options.displayElevation)
            });
        }

        options.openCallback = function () {
            self.map.trigger(TC.Consts.event.DIALOG, { control: downloadDialog });
        };

        downloadDialog.open(feature, options);
    };

    ctlProto.showShareDialog = function (feature) {
        const self = this;
        const shareDialog = self._dialogDiv.querySelector('.' + self.CLASS + '-share-dialog');
        shareDialog.dataset.layerId = feature.layer.id;
        shareDialog.dataset.featureId = feature.id;
        TC.Util.showModal(shareDialog, {
            openCallback: function () {
                self.onShowShareDialog(shareDialog);
            },
            closeCallback: function () {
                self._shareCtl.featureToShare = null;
            }
        });
    };

    ctlProto.getCurrentFeature = function (ctl) {
        return ctl && ((ctl.caller && ctl.caller.highlightedFeature) ||
            ctl.currentFeature);
    };

    ctlProto.getFeatureFromElement = function (elm) {
        const self = this;
        const layer = self.map.getLayer(elm.dataset.layerId);
        if (layer) {
            return layer.getFeatureById(elm.dataset.featureId);
        }
        return null;
    }

    ctlProto.zoomToFeature = function (feature) {
        const self = this;
        if (self.map) {
            self.map.zoomToFeatures([feature], { animate: true });
        }
    };

    ctlProto.removeFeature = function (feature) {
        const self = this;
        const removeFeature = function () {
            if (feature && feature.layer) {
                feature.layer.removeFeature(feature);
            }
        };
        const closeDisplay = function () {
            const filterFn = ctl => ctl.caller && ctl.caller.highlightedFeature === feature && ctl.isVisible();
            const popups = self.map.getControlsByClass(TC.control.Popup);
            popups
                .filter(filterFn)
                .forEach(pu => pu.hide());

            const panels = self.map.getControlsByClass(TC.control.ResultsPanel);
            panels
                .filter(filterFn)
                .forEach(p => p.close());
        };
        // No pedimos confirmación para borrar si es un resalte de GFI.
        if (feature && feature.layer.owner && feature.layer === feature.layer.owner.resultsLayer) {
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
            const currentFeature = options.feature;
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
                        ctl.getElevationToool().then(function (tool) {
                            tool.setGeometry(elevOptions).then(
                                function (features) {
                                    resolve(features[0]);
                                },
                                function (error) {
                                    reject(error instanceof Error ? error : Error(error));
                                }
                            );
                        });
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

    ctlProto.onShowShareDialog = function (dialog) {
        const self = this;
        const shareCtl = self._shareCtl;
        shareCtl.extraParams = null;
        const feature = self.getFeatureFromElement(dialog);
        prepareFeatureToShare(self, { feature: feature }).then(async function (f) {
            shareCtl.featureToShare = f;
            const shareDiv = shareCtl.div;
            const link = await shareCtl.generateLink();
            const input = shareDiv.querySelector(".tc-url input[type=text]");
            input.value = link;
            delete input.dataset["update"];
            delete input.dataset["shortened"];
            shareDiv.querySelector(".tc-iframe input[type=text]").value = await shareCtl.generateIframe(link);
        });
    };

    ctlProto.getFeatureTitle = function (feature) {
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

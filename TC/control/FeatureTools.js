TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

if (!TC.control.infoShare) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/infoShare');
}

TC.Consts.event.POPUP = TC.Consts.event.POPUP || 'popup.tc';
TC.Consts.event.POPUPHIDE = TC.Consts.event.POPUPHIDE || 'popuphide.tc';
TC.Consts.event.DRAWCHART = TC.Consts.event.DRAWCHART || 'drawchart.tc';
TC.Consts.event.DRAWTABLE = TC.Consts.event.DRAWTABLE || 'drawtable.tc';
TC.Consts.event.DIALOG = TC.Consts.event.DIALOG || 'dialog.tc';
TC.Consts.event.FEATUREHIGHLIGHT = TC.Consts.event.FEATUREHIGHLIGHT || 'featurehighlight.tc';
TC.Consts.event.FEATUREDOWNPLAY = TC.Consts.event.FEATUREDOWNPLAY || 'featuredownplay.tc';

TC.control.FeatureTools = function() {
    const self = this;

    TC.Control.apply(self, arguments);

    self.exportsState = true;
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
TC.mix(TC.control.FeatureTools, TC.control.infoShare);

(function() {
    var ctlProto = TC.control.FeatureTools.prototype;

    ctlProto.CLASS = 'tc-ctl-ftools';

    ctlProto.TITLE_SEPARATOR = ' • ';
    ctlProto.FILE_TITLE_SEPARATOR = '__';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-ftools.hbs";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-ftools-dialog.hbs";

    ctlProto.register = function(map) {
        const self = this;
        map
            .on(TC.Consts.event.POPUP + ' ' + TC.Consts.event.DRAWTABLE + ' ' + TC.Consts.event.DRAWCHART, function(e) {
                const control = e.control;
                if (control.caller || (!control.caller && control.currentFeature)) {
                    self.addUI(control);
                }
                // TODO: ¿Y si miramos si la feature del control ya está asociada a otro control abierto para decir si decoramos o no?
            })
            .on(TC.Consts.event.FEATUREHIGHLIGHT, function(e) {
                self.addUI(e.control.getDisplayControl());
            })
            .on(TC.Consts.event.FEATUREDOWNPLAY, function(e) {
                self.updateUI(e.control.getDisplayControl());
            });

        return new Promise(function(resolve, reject) {
            Promise.all([TC.Control.prototype.register.call(self, map), self.renderPromise()]).then(function() {
                self.getShareDialog().then(function() {
                    resolve(self);
                }).catch(function(err) {
                    reject(err instanceof Error ? err : Error(err));
                });
            });
        });
    };

    ctlProto.render = function() {
        const self = this;

        return self._set1stRenderPromise(Promise.all([
            self.renderData({ elevation: self.options.displayElevation }),
            self.getRenderedHtml(self.CLASS + '-dialog', {
                checkboxId: self.getUID(),
                elevation: self.options.displayElevation
            }, function(html) {
                self._dialogDiv.innerHTML = html;
            })
        ]));
    };

    ctlProto.addUI = function(ctl) {
        const self = this;
        const menuContainer = ctl.getMenuElement();
        // Nos aseguramos de que el se decora el control una sola vez
        const menuIsMissing = function() {
            return menuContainer && !menuContainer.querySelector('.' + self.CLASS);
        };

        if (self.getCurrentFeature(ctl)) {
            if (menuIsMissing()) {
                // Añadimos los botones de herramientas
                self.getRenderedHtml(self.CLASS, null, function(html) {

                    // Añadimos botón de imprimir
                    TC.loadJS(
                        !TC.control.Print,
                        [TC.apiLocation + 'TC/control/Print'],
                        function() {
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
        }
    };

    ctlProto._decorateDisplay = function(displayControl) {
        const self = this;

        displayControl.getContainerElement().querySelectorAll('table.tc-attr').forEach(function(attributeTable) {
            if (!displayControl.caller && displayControl.currentFeature) { // Si es un popup/panel propio de la feature

                // Añadimos un zoom a la feature al pulsar en la tabla
                attributeTable.addEventListener(TC.Consts.event.CLICK, function(e) {
                    self.zoomToFeatures([self.getCurrentFeature(displayControl)]);
                }, { passive: true });

                attributeTable.classList.add(self.CLASS + '-zoom');
                attributeTable.setAttribute('title', self.getLocaleString('clickToCenter'));
            }

            attributeTable.querySelectorAll('a, label, input, video, audio').forEach(function(a) {
                a.addEventListener(TC.Consts.event.CLICK, function(e) {
                    e.stopPropagation(); // No queremos zoom si pulsamos en un enlace
                }, { passive: true });
            });
        });
    };

    ctlProto.updateUI = function(ctl) {
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

                const isCluster = !!currentFeature.layer.cluster && currentFeature.features.length > 1;
                const shareBtn = uiDiv.querySelector(`.${self.CLASS}-share-btn`);
                shareBtn && shareBtn.classList.toggle(TC.Consts.classes.HIDDEN, isCluster);
                uiDiv.querySelector(`.${self.CLASS}-dl-btn`).classList.toggle(TC.Consts.classes.HIDDEN, isCluster);
                uiDiv.querySelector(`.${self.CLASS}-del-btn`).classList.toggle(TC.Consts.classes.HIDDEN, isCluster);

                self.getElevationTool().then(function(tool) {
                    const profileBtn = uiDiv.querySelector(`.${self.CLASS}-prof-btn`);
                    if (profileBtn) {
                        profileBtn.classList.toggle(TC.Consts.classes.HIDDEN,
                            !tool ||
                            !((TC.feature.Polyline && currentFeature instanceof TC.feature.Polyline) ||
                                (TC.feature.MultiPolyline && currentFeature instanceof TC.feature.MultiPolyline)) ||
                            !!ctl.chart);
                    }
                    const elevBtn = uiDiv.querySelector(`.${self.CLASS}-elev-btn`);
                    if (elevBtn) {
                        elevBtn.classList.toggle(TC.Consts.classes.HIDDEN, !tool || !(currentFeature instanceof TC.feature.Point) || isCluster);
                    }
                });
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
            setTimeout(function() {
                uiDiv.classList.toggle(TC.Consts.classes.ACTIVE, !!isActive);
            }, 100);
        }
    };

    const getSingleClusteredFeature = function (feature) {
        if (feature && Array.isArray(feature.features)) {
            if (feature.features.length === 1) {
                return feature.features[0];
            }
            return null;
        }
        return feature;
    };

    const getClusteredFeatures = function (feature) {
        if (feature) {
            if (Array.isArray(feature.features)) {
                return feature.features;
            }
            return [feature];
        }
        return [];
    };

    ctlProto.onDownloadButtonClick = function (e) {
        const self = this;
        let feature = getSingleClusteredFeature(self.getFeatureFromElement(e.target.parentElement));
        if (feature) {
            self.showDownloadDialog(feature);
        }
    };

    ctlProto.onShareButtonClick = function (e) {
        const self = this;
        const feature = getSingleClusteredFeature(self.getFeatureFromElement(e.target.parentElement));
        if (feature) {
            prepareFeatureToShare(self, { feature: feature }).then(async function (f) {
                self.toShare = {
                    feature: f
                };

                self.showShareDialog();
            });
        } else {
            throw "FeatureTools: there is not a feature to share";
        }
    };

    ctlProto.onZoomButtonClick = function (e) {
        const self = this;
        const features = getClusteredFeatures(self.getFeatureFromElement(e.target.parentElement));
        if (features.length) {
            self.zoomToFeatures(features);
        }
    };

    ctlProto.onDeleteButtonClick = function (e) {
        const self = this;
        self.removeFeature(self.getFeatureFromElement(e.target.parentElement));
    };

    ctlProto.onProfileButtonClick = function (e) {
        const self = this;
        const feature = getSingleClusteredFeature(self.getFeatureFromElement(e.target.parentElement));
        const depOptions = {};
        if (feature) {
            self.getElevationControl().then(function (elevCtl) {
                if (elevCtl) {
                    if (feature.getGeometryStride() > 2) {
                        depOptions.originalElevation = true;
                        depOptions.onlyOriginalElevation = false;

                        elevCtl.setElevationToolOptions({
                            resolution: self.options.resolution || 0,
                            sampleNumber: self.options.sampleNumber || 0
                        });
                    } else {
                        elevCtl.setElevationToolOptions(Object.assign({}, self.map.elevation && self.map.elevation.options, self.options.displayElevation));
                    }
                    elevCtl.displayElevationProfile(feature, depOptions);
                }
            });
        }
    };

    ctlProto.onElevationButtonClick = function (e) {
        const self = this;
        self.getElevationControl().then(elevCtl => elevCtl && elevCtl.displayElevationValue(getSingleClusteredFeature(self.getFeatureFromElement(e.target.parentElement))));
    };

    ctlProto._setToolButtonHandlers = function(ctl) {
        const self = this;

        const container = ctl.getMenuElement();

        // Evento para mostrar diálogo modal de descarga
        container.querySelector('.' + self.CLASS + '-dl-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.onDownloadButtonClick(e);
        }, { passive: true });

        // Evento para mostrar diálogo modal de compartir
        container.querySelector('.' + self.CLASS + '-share-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.onShareButtonClick(e);
        }, { passive: true });

        // Evento para hacer zoom
        container.querySelector('.' + self.CLASS + '-zoom-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.onZoomButtonClick(e);
        }, { passive: true });

        // Evento para hacer ver perfil
        const profileBtn = container.querySelector(`.${self.CLASS}-prof-btn`);
        if (profileBtn) {
            profileBtn.addEventListener(TC.Consts.event.CLICK, function (e) {
                self.onProfileButtonClick(e);
            }, { passive: true });
        }

        // Evento para hacer ver elevación
        const elevBtn = container.querySelector(`.${self.CLASS}-elev-btn`);
        if (elevBtn) {
            elevBtn.addEventListener(TC.Consts.event.CLICK, function (e) {
                self.onElevationButtonClick(e);
            }, { passive: true });
        }

        // Evento para borrar la feature
        container.querySelector('.' + self.CLASS + '-del-btn').addEventListener(TC.Consts.event.CLICK, function (e) {
            self.onDeleteButtonClick(e);
        }, { passive: true });
    };

    ctlProto.getElevationControl = async function() {
        const self = this;
        if (!self.options.displayElevation) {
            return null;
        }
        if (!self.elevationControl) {
            self.elevationControl = await self.map.addControl('elevation', self.options.displayElevation);
        }
        return self.elevationControl;
    };

    ctlProto.showDownloadDialog = async function(feature) {
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

        options.openCallback = function() {
            self.map.trigger(TC.Consts.event.DIALOG, { control: downloadDialog, action: "download" });
        };

        downloadDialog.open(feature, options);
    };

    ctlProto.getCurrentFeature = function(ctl) {
        return ctl && ((ctl.caller && ctl.caller.highlightedFeature) ||
            ctl.currentFeature);
    };

    ctlProto.getFeatureFromElement = function(elm) {
        const self = this;
        const layer = self.map.getLayer(elm.dataset.layerId);
        if (layer) {
            return layer.getFeatureById(elm.dataset.featureId);
        }
        return null;
    }

    ctlProto.zoomToFeatures = function(features) {
        const self = this;
        if (self.map) {
            self.map.zoomToFeatures(features, { animate: true });
        }
    };

    ctlProto.removeFeature = function(feature) {
        const self = this;
        const removeFeature = function () {
            if (feature && feature.layer) {
                feature.layer.removeFeature(feature);
            }
        };
        const closeDisplay = function() {
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
        if (feature && feature.layer && feature.layer.owner && feature.layer === feature.layer.owner.resultsLayer) {
            removeFeature();
            closeDisplay();
        }
        else {
            TC.confirm(self.getLocaleString('deleteFeature.confirm'), function() {
                removeFeature();
                closeDisplay();
            });
        }
    };

    const prepareFeatureToShare = function(ctl, options) {
        options = options || {};
        return new Promise(function(resolve, reject) {
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
                        ctl.getElevationTool().then(function(tool) {
                            tool.setGeometry(elevOptions).then(
                                function(features) {
                                    resolve(features[0]);
                                },
                                function(error) {
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
                        coordsArray.forEach(function(coord) {
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

    ctlProto.getFeatureTitle = function(feature) {
        var result = "";
        if (feature) {
            result = feature.id;
        }
        return result;
    };

    ctlProto._getFeatureFilename = function(feature) {
        const self = this;
        const layerTitle = self.getFeatureTitle(feature).toString().replace(new RegExp(self.TITLE_SEPARATOR, 'g'), self.FILE_TITLE_SEPARATOR) || self.getLocaleString('feature');
        return layerTitle.toLowerCase().replace(/\s/gi, '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true);
    };

    ctlProto.exportState = function() {
        const self = this;

        if (self.toShare) {
            const state = {};
            if (self.toShare.doZoom) {
                state.doZoom = self.toShare.doZoom;
            }
            state.id = self.id;
            if (self.toShare.feature) {
                let layerState;
                const featureToShare = self.toShare.feature.clone();
                featureToShare.showsPopup = true;
                layerState = self.toShare.feature.layer.exportState({
                    features: [featureToShare]
                });
                state.features = layerState.features;
                if (layerState.crs) {
                    state.crs = layerState.crs;
                }
            } else if (self.toShare.features) {
                state.features = self.toShare.features;
                if (self.sharedFeaturesLayer) {
                    let layerState = self.sharedFeaturesLayer.exportState();
                    state.features = layerState.features;
                }
                if (self.toShare.crs) {
                    state.crs = self.toShare.crs;
                }
            }
            return state;

        }
        return null;
    };

    ctlProto.importState = function(state) {
        const self = this;
        if (self.map && state.features && state.features.length) {
            self.toShare = {
                features: state.features
            };
            if (state.crs) {
                self.toShare.crs = state.crs;
            }
            self.map.addLayer({
                id: self.getUID(),
                owner: self,
                type: TC.Consts.layerType.VECTOR,
                title: self.getLocaleString('foi'),
                stealth: true
            }).then(function(layer) {
                self.sharedFeaturesLayer = layer;
                layer.importState({ features: state.features, crs: state.crs }).then(function() {
                    if (state.doZoom) {
                        self.map.zoomToFeatures(layer.features);
                    }
                });
            });
        }
    };

})();

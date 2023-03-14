import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';
import infoShare from './infoShare';
import Print from './Print';
import Point from '../../SITNA/feature/Point';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';

TC.control = TC.control || {};
TC.control.infoShare = infoShare;
TC.control.Print = Print;
TC.Control = Control;

Consts.event.POPUP = Consts.event.POPUP || 'popup.tc';
Consts.event.POPUPHIDE = Consts.event.POPUPHIDE || 'popuphide.tc';
Consts.event.DRAWCHART = Consts.event.DRAWCHART || 'drawchart.tc';
Consts.event.DRAWTABLE = Consts.event.DRAWTABLE || 'drawtable.tc';
Consts.event.DIALOG = Consts.event.DIALOG || 'dialog.tc';
Consts.event.FEATUREHIGHLIGHT = Consts.event.FEATUREHIGHLIGHT || 'featurehighlight.tc';
Consts.event.FEATUREDOWNPLAY = Consts.event.FEATUREDOWNPLAY || 'featuredownplay.tc';

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

class FeatureTools extends Control {
    TITLE_SEPARATOR = ' › ';
    FILE_TITLE_SEPARATOR = '__';
    #selectors;
    #classSelector;
    _dialogDiv;
    _parentCtl;

    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.add(self.CLASS);

        self.template = {};
        self.template[self.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-ftools.hbs";
        self.template[self.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-ftools-dialog.hbs";

        self.exportsState = true;
        const cs = self.#classSelector = '.' + self.CLASS;
        self.#selectors = {
            ELEVATION_CHECKBOX: cs + '-dialog-elev input[type=checkbox]',
            INTERPOLATION_RADIO: 'input[type=radio][name=finfo-ip-coords]',
            INTERPOLATION_DISTANCE: cs + '-dialog-ip-m'
        };

        self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
        if (!self.options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }
    }

    getClassName() {
        return 'tc-ctl-ftools';
    }

    async register(map) {
        const self = this;
        map
            .on(Consts.event.POPUP + ' ' + Consts.event.DRAWTABLE + ' ' + Consts.event.DRAWCHART, function (e) {
                const control = e.control;
                if (control.caller || control.currentFeature) {
                    self.addUI(control);
                }
                // TODO: ¿Y si miramos si la feature del control ya está asociada a otro control abierto para decir si decoramos o no?
            })
            .on(Consts.event.FEATUREHIGHLIGHT, function (e) {
                self.addUI(e.control.getDisplayControl());
            })
            .on(Consts.event.FEATUREDOWNPLAY, function (e) {
                self.updateUI(e.control.getDisplayControl());
            });

        await Promise.all([TC.Control.prototype.register.call(self, map), self.renderPromise()]);
        await self.getShareDialog();
        return self;
    }

    render() {
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
    }

    addUI(ctl) {
        const self = this;
        self._parentCtl = ctl;
        const menuContainer = ctl.getMenuElement();
        // Nos aseguramos de que el se decora el control una sola vez
        const menuIsMissing = function () {
            return menuContainer && !menuContainer.querySelector('.' + self.CLASS);
        };

        if (self.getCurrentFeature(ctl)) {
            if (menuIsMissing()) {
                // Añadimos los botones de herramientas
                self.getRenderedHtml(self.CLASS, null, function (html) {

                    // Añadimos botón de imprimir
                    if (menuIsMissing()) {
                        let endAddUIPromise = Promise.resolve();
                        const container = ctl.getContainerElement();
                        if (!container.querySelectorAll('.' + TC.control.Print.prototype.CLASS + '-btn').length) {
                            const highlightedFeature = !ctl.caller && ctl.currentFeature ? ctl.currentFeature : ctl.caller.highlightedFeature;
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

                                self.#setToolButtonHandlers(ctl);

                                self.#decorateDisplay(ctl);
                            }
                        });
                    }
                });
            }
            else {
                self.updateUI(ctl);
            }
        }
    }

    #decorateDisplay(displayControl) {
        const self = this;

        displayControl.getContainerElement().querySelectorAll('table.tc-attr').forEach(function (attributeTable) {
            if (!displayControl.caller && displayControl.currentFeature) { // Si es un popup/panel propio de la feature

                // Añadimos un zoom a la feature al pulsar en la tabla
                attributeTable.addEventListener(Consts.event.CLICK, function (_e) {
                    self.zoomToFeatures([self.getCurrentFeature(displayControl)]);
                }, { passive: true });

                attributeTable.classList.add(self.CLASS + '-zoom');
                attributeTable.setAttribute('title', self.getLocaleString('clickToCenter'));
            }

            attributeTable.querySelectorAll('a, label, input, video, audio').forEach(function (a) {
                a.addEventListener(Consts.event.CLICK, function (e) {
                    e.stopPropagation(); // No queremos zoom si pulsamos en un enlace
                }, { passive: true });
            });
        });
        const table = displayControl.getContainerElement().querySelector(`.${displayControl.CLASS}-body > table`);
        if (table) table.parentElement.classList.add(self.CLASS + '-zoom');
    }

    updateUI(ctl) {
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
                shareBtn && shareBtn.classList.toggle(Consts.classes.HIDDEN, isCluster);
                uiDiv.querySelector(`.${self.CLASS}-dl-btn`).classList.toggle(Consts.classes.HIDDEN, isCluster);
                uiDiv.querySelector(`.${self.CLASS}-del-btn`).classList.toggle(Consts.classes.HIDDEN, isCluster);

                self.getElevationTool().then(function (tool) {
                    const profileBtn = uiDiv.querySelector(`.${self.CLASS}-prof-btn`);
                    if (profileBtn) {
                        profileBtn.classList.toggle(Consts.classes.HIDDEN,
                            !tool ||
                            !(currentFeature instanceof Polyline || currentFeature instanceof MultiPolyline) ||
                            !!ctl.chart);
                    }
                    const elevBtn = uiDiv.querySelector(`.${self.CLASS}-elev-btn`);
                    if (elevBtn) {
                        elevBtn.classList.toggle(Consts.classes.HIDDEN, !tool ||
                            !(currentFeature instanceof Point) ||
                            isCluster);
                    }
                });
            }
            else {
                delete uiDiv.dataset.layerId;
                delete uiDiv.dataset.featureId;
            }
        }
        if (self.printControl && currentFeature) {
            self.printControl.title = currentFeature.id;
        }
        if (uiDiv) {
            uiDiv.classList.remove(Consts.classes.ACTIVE);
            setTimeout(function () {
                uiDiv.classList.toggle(Consts.classes.ACTIVE, !!isActive);
            }, 100);
        }
    }

    onDownloadButtonClick(e) {
        const self = this;
        const feature = getSingleClusteredFeature(self.getFeatureFromElement(e.target.parentElement));
        if (feature) {
            self.showDownloadDialog(feature);
        }
    }

    onShareButtonClick(e) {
        const self = this;
        const feature = getSingleClusteredFeature(self.getFeatureFromElement(e.target.parentElement));
        if (feature) {
            self.#prepareFeatureToShare({ feature: feature }).then(async function (f) {
                self.toShare = {
                    feature: f
                };

                self.showShareDialog();
            });
        } else {
            throw Error("FeatureTools: there is no feature to share");
        }
    }

    onZoomButtonClick(e) {
        const self = this;
        const features = getClusteredFeatures(self.getFeatureFromElement(e.target.parentElement));
        if (features.length) {
            self.zoomToFeatures(features);
        }
    }

    onDeleteButtonClick(e) {
        const self = this;
        self.removeFeature(self.getFeatureFromElement(e.target.parentElement));
    }

    onProfileButtonClick(e) {
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
    }

    onElevationButtonClick(e) {
        const self = this;
        self.getElevationControl().then(elevCtl => elevCtl &&
            elevCtl.displayElevationValue(getSingleClusteredFeature(self.getFeatureFromElement(e.target.parentElement)), {
                ignoreCache: true
            }));
    }

    #setToolButtonHandlers(ctl) {
        const self = this;

        const container = ctl.getMenuElement();

        // Evento para mostrar diálogo modal de descarga
        container.querySelector('.' + self.CLASS + '-dl-btn').addEventListener(Consts.event.CLICK, function (e) {
            self.onDownloadButtonClick(e);
        }, { passive: true });

        // Evento para mostrar diálogo modal de compartir
        container.querySelector('.' + self.CLASS + '-share-btn').addEventListener(Consts.event.CLICK, function (e) {
            self.onShareButtonClick(e);
        }, { passive: true });

        // Evento para hacer zoom
        container.querySelector('.' + self.CLASS + '-zoom-btn').addEventListener(Consts.event.CLICK, function (e) {
            self.onZoomButtonClick(e);
        }, { passive: true });

        // Evento para hacer ver perfil
        const profileBtn = container.querySelector(`.${self.CLASS}-prof-btn`);
        if (profileBtn) {
            profileBtn.addEventListener(Consts.event.CLICK, function (e) {
                self.onProfileButtonClick(e);
            }, { passive: true });
        }

        // Evento para hacer ver elevación
        const elevBtn = container.querySelector(`.${self.CLASS}-elev-btn`);
        if (elevBtn) {
            elevBtn.addEventListener(Consts.event.CLICK, function (e) {
                self.onElevationButtonClick(e);
            }, { passive: true });
        }

        // Evento para borrar la feature
        container.querySelector('.' + self.CLASS + '-del-btn').addEventListener(Consts.event.CLICK, function (e) {
            self.onDeleteButtonClick(e);
        }, { passive: true });
    }

    async getElevationControl() {
        const self = this;
        if (!self.options.displayElevation) {
            return null;
        }
        if (!self.elevationControl) {
            self.elevationControl = await self.map.addControl('elevation', self.options.displayElevation);
        }
        return self.elevationControl;
    }

    async showDownloadDialog(feature) {
        const self = this;

        const downloadDialog = await self.getDownloadDialog();

        var options = {
            title: self.getLocaleString("feature") + " - " + self.getLocaleString("download"),
            fileName: self.#getFeatureFilename(feature)
        };

        if (self.map.elevation || self.options.displayElevation) {
            options = Object.assign({}, options, {
                elevation: Object.assign({}, self.map.elevation && self.map.elevation.options, self.options.displayElevation)
            });
        }

        options.openCallback = function () {
            self.map.trigger(Consts.event.DIALOG, { control: downloadDialog, action: "download" });
        };

        downloadDialog.open(feature, options);
    }

    getCurrentFeature(ctl) {
        return ctl?.caller?.highlightedFeature || ctl?.currentFeature;
    }

    getFeatureFromElement(elm) {
        const self = this;
        const layer = self.map.getLayer(elm.dataset.layerId);
        if (layer) {
            return layer.getFeatureById(elm.dataset.featureId);
        }
        return null;
    }

    zoomToFeatures(features) {
        const self = this;
        if (self.map) {
            self.map.zoomToFeatures(features, { animate: true });
        }
    }

    removeFeature(feature) {
        const self = this;
        const removeFeature = function () {
            if (feature && feature.layer) {
                feature.layer.removeFeature(feature);
            }
        };
                // No pedimos confirmación para borrar si es un resalte de GFI.
        if (feature && feature.layer && feature.layer.owner && feature.layer === feature.layer.owner.resultsLayer) {
            removeFeature();
            //closeDisplay();
            if (self._parentCtl?.caller?.removeFeature) self._parentCtl?.caller?.removeFeature(feature);
        }
        else {
            TC.confirm(self.getLocaleString('deleteFeature.confirm'), function () {
                removeFeature();
                //closeDisplay();
                if (self._parentCtl?.caller?.removeFeature)self._parentCtl?.caller?.removeFeature(feature);
            });
        }
    }

    async #prepareFeatureToShare(options) {
        const self = this;
        options = options || {};
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
                        crs: self.map.crs,
                        features: [feature],
                        maxCoordQuantity: self.options.displayElevation?.maxCoordQuantity,
                        resolution: options.elevation.resolution,
                        sampleNumber: 0 // No queremos determinar el número de muestras
                    };
                    const tool = await self.getElevationTool();
                    const features = await tool.setGeometry(elevOptions);
                    return features[0];
                }
                else {
                    return feature;
                }
            }
            else {
                feature.removeZ();
                return feature;
            }
        }
        return null;
    }

    getFeatureTitle(feature) {
        var result = "";
        if (feature) {
            result = feature.id;
        }
        return result;
    }

    #getFeatureFilename(feature) {
        const self = this;
        const layerTitle = self.getFeatureTitle(feature).toString().replace(new RegExp(self.TITLE_SEPARATOR, 'g'), self.FILE_TITLE_SEPARATOR) || self.getLocaleString('feature');
        return layerTitle.toLowerCase().replace(/\s/gi, '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true);
    }

    exportState() {
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
    }

    importState(state) {
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
                type: Consts.layerType.VECTOR,
                title: self.getLocaleString('foi'),
                stealth: true
            }).then(function (layer) {
                self.sharedFeaturesLayer = layer;
                layer.importState({ features: state.features, crs: state.crs }).then(function () {
                    if (state.doZoom) {
                        self.map.zoomToFeatures(layer.features);
                    }
                });
            });
        }
    }
}

TC.mix(FeatureTools, infoShare);

TC.control.FeatureTools = FeatureTools;
export default FeatureTools;
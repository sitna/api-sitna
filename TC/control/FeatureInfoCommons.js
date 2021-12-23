TC.control = TC.control || {};

if (!TC.control.Click) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/Click');
}

if (!TC.control.infoShare) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/infoShare');
}

TC.Consts.event.POPUP = TC.Consts.event.POPUP || 'popup.tc';
TC.Consts.event.POPUPHIDE = TC.Consts.event.POPUPHIDE || 'popuphide.tc';
TC.Consts.event.DRAWCHART = TC.Consts.event.DRAWCHART || 'drawchart.tc';
TC.Consts.event.DRAWTABLE = TC.Consts.event.DRAWTABLE || 'drawtable.tc';
TC.Consts.event.RESULTSPANELCLOSE = TC.Consts.event.RESULTSPANELCLOSE || 'resultspanelclose.tc';
TC.Consts.event.FEATUREHIGHLIGHT = 'featurehighlight.tc';
TC.Consts.event.FEATUREDOWNPLAY = 'featuredownplay.tc';

TC.control.FeatureInfoCommons = function () {
    const self = this;
    TC.control.Click.apply(self, arguments);

    self._selectors = {
        LIST_ITEM: `ul.${self.CLASS}-features li`,
        SHOW_ALL_CHECKBOX: `.${self.CLASS}-btn input[type="checkbox"].${self.CLASS}-btn-show-all`,
        SHOW_ALL_LABEL: `.${self.CLASS}-btn label.${self.CLASS}-btn-show-all`,
        ZOOM_ALL_BUTTON: `.${self.CLASS}-btn .${self.CLASS}-btn-zoom-all`,
        DEL_ALL_BUTTON: `.${self.CLASS}-btn .${self.CLASS}-btn-del-all`
    };

    self.resultsLayer = null;
    self.filterLayer = null;
    self._layersPromise = null;
    self.filterFeature = null;
    self.info = null;
    self._infoHistory = {};
    self.popup = null;
    self.resultsPanel = null;
    self.lastFeatureCount = null;
    self.exportsState = true;

    self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
    if (window.$) {
        self._$dialogDiv = $(self._dialogDiv);
    }
    if (!self.options.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
    }
};

(function () {

    var layerCount = function (ctl) {
        return ctl.info && ctl.info.services ?
            ctl.info.services.reduce(function (sCount, service) {
                return sCount + service.layers.reduce(function (lCount, layer) {
                    return lCount + 1;
                }, 0);
            }, 0) : 0;
    };

    TC.inherit(TC.control.FeatureInfoCommons, TC.control.Click);
    TC.mix(TC.control.FeatureInfoCommons, TC.control.infoShare);

    var ctlProto = TC.control.FeatureInfoCommons.prototype;

    ctlProto.CLASS = 'tc-ctl-finfo';

    ctlProto.CURRENT_CLASS = 'tc-current';

    ctlProto.TITLE_SEPARATOR = ' • ';
    ctlProto.DEFAULT_STROKE_COLOR = '#0000ff';
    
    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-finfo.hbs";
    ctlProto.template[ctlProto.CLASS + "-attr"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-attr.hbs";
    ctlProto.template[ctlProto.CLASS + "-object"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-object.hbs";
    ctlProto.template[ctlProto.CLASS + "-buttons"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-buttons.hbs";
    ctlProto.template[ctlProto.CLASS + "-dialog"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-dialog.hbs";
    ctlProto.template[ctlProto.CLASS + "-attr-val"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-attr-val.hbs";
    ctlProto.template[ctlProto.CLASS + "-attr-video"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-attr-video.hbs";
    ctlProto.template[ctlProto.CLASS + "-attr-image"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-attr-image.hbs";
    ctlProto.template[ctlProto.CLASS + "-attr-audio"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-attr-audio.hbs";
    ctlProto.template[ctlProto.CLASS + "-attr-embed"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-attr-embed.hbs";


    const setShowAllUI = function () {
        const self = this;
        const menu = self.getMenuTarget();
        const showAllCb = menu.querySelector(self._selectors.SHOW_ALL_CHECKBOX);
        if (showAllCb) {
            showAllCb.checked = true;
            const text = self.getLocaleString('doNotShowOnMapAllResults');
            menu.querySelector(self._selectors.SHOW_ALL_LABEL).setAttribute('title', text);
            showAllCb.innerHTML = text;
        }
        menu.querySelector(self._selectors.ZOOM_ALL_BUTTON).classList.remove(TC.Consts.classes.HIDDEN);
        menu.querySelector(self._selectors.DEL_ALL_BUTTON).classList.remove(TC.Consts.classes.HIDDEN);
    };

    const setNotShowAllUI = function () {
        const self = this;
        const menu = self.getMenuTarget();
        const showAllCb = menu.querySelector(self._selectors.SHOW_ALL_CHECKBOX);
        if (showAllCb) {
            showAllCb.checked = false;
            const text = self.getLocaleString('showOnMapAllResults');
            showAllCb.innerHTML = text;
            menu.querySelector(self._selectors.SHOW_ALL_LABEL).setAttribute('title', text);
            menu.querySelector(self._selectors.ZOOM_ALL_BUTTON).classList.add(TC.Consts.classes.HIDDEN);
            menu.querySelector(self._selectors.DEL_ALL_BUTTON).classList.add(TC.Consts.classes.HIDDEN);
        }
    };

    ctlProto.register = async function (map) {
        const self = this;

        const clickRegisterPromise = TC.control.Click.prototype.register.call(self, map);

        self._createLayers();

        map.loaded(function () {
            const shareCtl = map.getControlsByClass('TC.control.Share')[0];
            if (shareCtl) {
                self.loadSharedFeature(shareCtl.loadParamFeature());
            }
            self.setDisplayMode(self.options.displayMode || map.defaultInfoContainer || TC.Consts.infoContainer.POPUP);
        });

        map
            .on(TC.Consts.event.POPUPHIDE + ' ' + TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                if (e.control === self.getDisplayControl() && self.resultsLayer) {
                    if (self.highlightedFeature && !self.options.persistentHighlights) {
                        self.downplayFeature(self.highlightedFeature);
                        self.highlightedFeature = null;
                    }
                    if (!self.querying && e.feature) {
                        self.filterLayer.removeFeature(e.feature);
                    }
                }
            })
            //.on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
            //    self.highlightedFeature = null;
            //})
            .on(TC.Consts.event.POPUP + ' ' + TC.Consts.event.DRAWTABLE + ' ' + TC.Consts.event.DRAWCHART, function (e) {
                const control = e.control;
                if (control.currentFeature !== self.filterFeature) {
                    self.highlightedFeature = control.currentFeature;
                }

                // GLS: si la feature es resultado de GFI decoramos
                if (e.control.caller == self) {
                    self._decorateDisplay(control);
                }

            })
            .on(TC.Consts.event.DRAWCHART, function (e) {
                setTimeout(function () {
                    self.highlightedFeature = e.control.currentFeature;
                }, 50);
            })
            .on(TC.Consts.event.LAYERREMOVE, function () {
                if (Object.keys(self._infoHistory).length) {
                    const services = {};
                    self.map.workLayers
                        .filter(function (layer) {
                            return layer.type === TC.Consts.layerType.WMS;
                        })
                        .forEach(function (layer) {
                            const names = services[layer.url] || [];
                            services[layer.url] = names.concat(layer.getDisgregatedLayerNames())
                        });
                    let featuresDeleted = false;
                    for (let url in self._infoHistory) {
                        const historyService = self._infoHistory[url];
                        if (services.hasOwnProperty(url)) {
                            const service = services[url];
                            for (let name in historyService) {
                                const historyLayer = historyService[name];
                                if (service.indexOf(name) < 0) {
                                    historyLayer.slice().forEach(f => self.downplayFeature(f));
                                    historyLayer.length = 0;
                                    featuresDeleted = true;
                                }
                            }
                        }
                        else {
                            for (let name in historyService) {
                                const historyLayer = historyService[name];
                                historyLayer.slice().forEach(f => self.downplayFeature(f));
                                featuresDeleted = true;
                            }
                            delete self._infoHistory[url];
                        }
                    }
                    if (featuresDeleted) {
                        self.closeResults();
                    }
                }
            })
            .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                // Quitamos del historial de resaltes las entidades que se borran
                if (e.layer === self.resultsLayer) {
                    for (let url in self._infoHistory) {
                        const historyService = self._infoHistory[url];
                        for (let name in historyService) {
                            const historyLayer = historyService[name];
                            for (var i = 0, ii = historyLayer.length; i < ii; i++) {
                                const historyFeature = historyLayer[i];
                                if (historyFeature === e.feature) {
                                    historyLayer.splice(i, 1);
                                    return;
                                }
                            }
                        }
                    }
                }
            })
            .on(TC.Consts.event.FEATURESCLEAR, function (e) {
                if (e.layer === self.resultsLayer) {
                    self._infoHistory = {};
                }
            })
            .on(TC.Consts.event.VIEWCHANGE, function (e) {
                self.closeResults();
            });

        await clickRegisterPromise;
        if (self.options.share) {
            await self.getShareDialog();
        }
        return self;
    };

    ctlProto.render = function () {
        const self = this;
        // Este div se usa como buffer, así que no debe ser visible.
        self.div.classList.add(TC.Consts.classes.HIDDEN);
        return self._set1stRenderPromise(self.getRenderedHtml(self.CLASS + '-dialog', {
            checkboxId: self.getUID(),
            elevation: self.options.displayElevation
        }, function (html) {
            self._dialogDiv.innerHTML = html;
        }));
    };

    ctlProto.responseCallback = function (options) {
        const self = this;
        self.querying = false;

        if (self.filterFeature) {
            self.info = { services: options.services };
            if (self.options.persistentHighlights) {
                // Eliminamos de la respuesta las entidades que ya están resaltadas
                for (let url in self._infoHistory) {
                    const infoService = self.info.services.filter(s => s.url === url)[0];
                    if (infoService) {
                        const historyService = self._infoHistory[url];
                        for (let name in historyService) {
                            const infoLayer = infoService.layers.filter(l => l.name === name)[0];
                            if (infoLayer) {
                                const historyLayer = historyService[name];
                                historyLayer.forEach(function (feature) {
                                    const id = feature.wrap.getId();
                                    const idx = infoLayer.features.findIndex(f => f.wrap.getId() === id);
                                    if (idx !== -1) {
                                        infoLayer.features.splice(idx, 1);
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }

        if (!options.featureCount) {
            self.lastFeatureCount = 0;
            self.map.trigger(TC.Consts.event.NOFEATUREINFO, { control: self });
        }
        else {
            self._addSourceAttributes();
            self.lastFeatureCount = options.featureCount;
            self.map.trigger(TC.Consts.event.FEATUREINFO, TC.Util.extend({ control: self }, options));
        }
    };

    ctlProto.responseError = function (options) {
        const self = this;
        if (options.status === 404) {
            self.map.toast(self.getLocaleString("featureInfo.tooManyLayers"), { type: TC.Consts.msgType.ERROR });
        }
        self.responseCallback({});
    };

    ctlProto.markerStyle = {
        cssClass: TC.Consts.classes.POINT,
        anchor: [0.5, 0.5],
        width: 15,
        height: 15,
        noPrint: true
    };

    ctlProto.setDisplayMode = function (mode) {
        const self = this;
        self.displayMode = mode;
        const map = self.map;
        switch (mode) {
            case TC.Consts.infoContainer.RESULTS_PANEL:
                if (!self.resultsPanel) {
                    let ctlPromise;
                    const resultsPanelOptions = {
                        content: "table",
                        titles: {
                            main: self.getLocaleString("threed.rs.panel.gfi"),
                            max: self.getLocaleString("threed.rs.panel.gfi")
                        },
                        share: self.options.share
                    };
                    const container = map.getControlsByClass('TC.control.ControlContainer')[0];
                    if (container) {
                        resultsPanelOptions.position = container.POSITION.RIGHT;
                        ctlPromise = container.addControl('resultsPanel', resultsPanelOptions);
                    }
                    else {
                        resultsPanelOptions.div = document.createElement('div');
                        map.div.appendChild(resultsPanelOptions.div);
                        ctlPromise = map.addControl('resultsPanel', resultsPanelOptions);
                    }
                    ctlPromise
                        .then(function (rp) {
                            self.resultsPanel = rp;
                            rp.caller = self;
                        });
                }
                break;
            default:
                self.displayMode = TC.Consts.infoContainer.POPUP;
                if (!self.popup) {
                    map.addControl('popup', {
                        closeButton: true,
                        draggable: self.options.draggable,
                        share: self.options.share
                    }).then(function (popup) {
                        self.popup = popup;
                        popup.caller = self;
                        map.on(TC.Consts.event.POPUP, function (e) {
                            self.onShowPopup(e);
                        });
                    });
                }
                break;
        }
    };

    ctlProto.getDisplayControl = function () {
        var self = this;
        switch (self.displayMode) {
            case TC.Consts.infoContainer.RESULTS_PANEL:
                return self.resultsPanel;
            default:
                return self.popup;
        }
    };

    ctlProto.getDisplayTarget = function (options) {
        var self = this;
        options = options || {};
        if (options.control) {
            switch (true) {
                case TC.control.Popup && options.control instanceof TC.control.Popup:
                    return options.control.getContainerElement();
                case TC.control.ResultsPanel && options.control instanceof TC.control.ResultsPanel:
                    return options.control.getInfoContainer();
                default:
                    return null;
            }
        }
        switch (self.displayMode) {
            case TC.Consts.infoContainer.RESULTS_PANEL:
                return self.resultsPanel.getInfoContainer();
            default:
                return self.popup.getContainerElement();
        }
    };

    ctlProto.getMenuTarget = function () {
        var self = this;
        switch (self.displayMode) {
            case TC.Consts.infoContainer.RESULTS_PANEL:
                return self.resultsPanel.getMenuElement();
            default:
                return self.popup.getMenuElement();
        }
    };

    ctlProto.displayResults = function () {
        var self = this;
        const clone = self.div.cloneNode(true);
        clone.classList.remove(TC.Consts.classes.HIDDEN);
        self.filterFeature.data = clone.outerHTML;
        switch (self.displayMode) {
            case TC.Consts.infoContainer.RESULTS_PANEL:
                if (self.resultsPanel) {
                    // GLS: si contamos con el control de controles no es necesario cerrar los paneles visibles ya que no habría solape
                    if (self.map.getControlsByClass(TC.control.ControlContainer).length === 0) {
                        self.map.getControlsByClass(TC.control.ResultsPanel).forEach(function (p) {
                            if (p.isVisible()) {
                                p.close();
                            }
                        });
                    }

                    // cerramos los paneles con feature asociada
                    const panels = self.map.getControlsByClass('TC.control.ResultsPanel');
                    panels.forEach(function (p) {
                        if (p !== self.resultsPanel && p.currentFeature && !p.chart) {
                            p.close();
                        }
                    });

                    self.resultsPanel.currentFeature = self.filterFeature;
                    self.resultsPanel.open(self.filterFeature.data, self.resultsPanel.getInfoContainer());
                    
                    self.getMenuTarget().innerHTML = "";
                    self.displayResultsCallback();
                   
                }

                break;
            default:
                if (self.popup) {
                    self.filterFeature.showPopup(self.popup);
                }
                break;
        }
    };

    const getElementIndex = function (elm) {
        return Array.from(elm.parentElement.children).indexOf(elm);
    };

    const getParentElement = function (elm, tagName) {
        var result = elm;
        do {
            result = result.parentElement;
        }
        while (result && result.tagName !== tagName);
        return result;
    };

    const getFeatureFromListItem = function (ctl, li) {
        const currentFeatureLi = li;
        const currentLayerLi = getParentElement(li, 'LI');
        const currentServiceLi = getParentElement(currentLayerLi, 'LI');
        return ctl.getFeature(getElementIndex(currentServiceLi), getElementIndex(currentLayerLi), getElementIndex(currentFeatureLi));
    };

    ctlProto.getFeatureElement = function (feature) {
        const self = this;
        let result;

        const lis = self.getDisplayTarget().querySelectorAll(self._selectors.LIST_ITEM);
        for (let i = 0, ii = lis.length; i < ii; i++) {
            const li = lis[i];
            const feat = getFeatureFromListItem(self, li);
            if (feat === feature) {
                result = li;
                break;
            }
        }
        return result;
    };

    ctlProto.getNextFeatureElement = function (delta) {
        const self = this;
        const lis = self.getDisplayTarget().querySelectorAll('ul.' + self.CLASS + '-features > li');
        const length = lis.length;
        for (var i = 0; i < length; i++) {
            if (lis[i].matches('.' + self.CURRENT_CLASS)) {
                return lis[(i + delta + length) % length]
            }
        }
        return null;
    };

    ctlProto.getFeaturePath = function (feature) {
        const self = this;
        if (self.info && self.info.services) {
            for (var i = 0, ii = self.info.services.length; i < ii; i++) {
                const service = self.info.services[i];
                for (var j = 0, jj = service.layers.length; j < jj; j++) {
                    const layer = service.layers[j];
                    for (var k = 0, kk = layer.features.length; k < kk; k++) {
                        if (layer.features[k] === feature) {
                            return {
                                service: service.title || service.mapLayers.reduce(function (prev, cur) {
                                    return prev || cur.title;
                                }, ''),
                                layer: layer.path
                            };
                        }
                    }
                }
            }
        }
        return null;
    };

    ctlProto.closeResults = function () {
        var self = this;
        switch (self.displayMode) {
            case TC.Consts.infoContainer.RESULTS_PANEL:
                if (self.resultsPanel && self.resultsPanel.isVisible()) {
                    self.resultsPanel.close();
                }
                break;
            default:
                if (self.popup && self.popup.isVisible()) {
                    self.popup.hide();
                }
                break;
        }
    };

    ctlProto.displayResultsCallback = function () {
        var self = this;
        const content = self.getDisplayTarget().querySelector('.' + self.CLASS);

        //// Evento para resaltar una feature
        //const onListItemClick = function (e) {
        //    self.highlightFeature(e.target);
        //};
        //// En iPad se usa click en vez de touchstart para evitar que se resalte una feature al hacer scroll
        //content.querySelectorAll(self._selectors.LIST_ITEM).forEach(li => li.addEventListener('click', onListItemClick));

        // Evento para ir a la siguiente feature
        const nextBtn = content.querySelector(`.${self.CLASS}-btn-next`);
        if (nextBtn) {
            nextBtn.addEventListener(TC.Consts.event.CLICK, function (e) {
                self.highlightFeature(self.getNextFeatureElement(1), 1);
                return false;
            }, { passive: true });
        }

        // Evento para ir a la feature anterior
        const prevBtn = content.querySelector(`.${self.CLASS}-btn-prev`);
        if (prevBtn) {
            prevBtn.addEventListener(TC.Consts.event.CLICK, function (e) {
                self.highlightFeature(self.getNextFeatureElement(-1), -1);
                return false;
            }, { passive: true });
        }

        // Evento para desplegar/replegar features de capa
        const onTitleClick = function (e) {
            const li = getParentElement(e.target, 'LI');
            if (li.classList.contains(TC.Consts.classes.CHECKED)) {
                // Si no está en modo móvil ocultamos la capa (si hay más de una)
                const anotherLayer = content.querySelector(`.${self.CLASS}-layers li:not(.tc-checked)`);
                if (anotherLayer && getComputedStyle(anotherLayer).display !== 'none') {
                    self.downplayFeatures();
                }
            }
            else {
                self.highlightFeature(li.querySelector(self._selectors.LIST_ITEM));
                if (self.displayMode === TC.Consts.infoContainer.POPUP) {
                    self.popup.fitToView(true);
                }
            }
        };
        content.querySelectorAll(`ul.${self.CLASS}-layers h4`).forEach(h => h.addEventListener(TC.Consts.event.CLICK, onTitleClick, { passive: true }));
        if (self.displayMode === TC.Consts.infoContainer.POPUP) {
            content.querySelectorAll('img').forEach(img => img.addEventListener('load', () => self.popup.fitToView()));
        }

        // Evento para borrar la feature resaltada
        //selector = '.' + self.CLASS + '-del-btn';
        //content.addEventListener(eventType, TC.EventTarget.listenerBySelector(selector, function (e) {
        //    self.downplayFeatures();
        //    self.closeResults();
        //}));

        if (self.info) {
            const features = self.getFeatures();
            const menu = self.getMenuTarget();
            if (features.length > 1) {
                // Hay más de una feature
                self.getRenderedHtml(`${self.CLASS}-buttons`, { id: self.id }).then(function (html) {
                    if (!menu.querySelector(`.${self.CLASS}-btn-dl`)) {
                        menu.insertAdjacentHTML('beforeend', html);
                        menu.querySelector(`.${self.CLASS}-btn-dl`).addEventListener(TC.Consts.event.CLICK, async function (e) {
                            const downloadDialog = await self.getDownloadDialog();
                            let options = {
                                title: self.getLocaleString("featureInfo") + " - " + self.getLocaleString("download"),
                                fileName: self._getFileName()
                            };

                            if (self.map.elevation || self.options.displayElevation) {
                                options = Object.assign({}, options, {
                                    elevation: Object.assign({}, self.map.elevation && self.map.elevation.options, self.options.displayElevation)
                                });
                            }
                            downloadDialog.open(features, options);
                        }, { passive: true });

                        menu.querySelector(self._selectors.SHOW_ALL_CHECKBOX).addEventListener('change', function (e) {
                            if (e.target.checked) {
                                self.showAllFeatures();
                            }
                            else {
                                self.hideAllFeatures();
                            }
                        }, { passive: true });

                        menu.querySelector(self._selectors.ZOOM_ALL_BUTTON).addEventListener(TC.Consts.event.CLICK, function (e) {
                            self.map.zoomToFeatures(features);
                        }, { passive: true });

                        menu.querySelector(self._selectors.DEL_ALL_BUTTON).addEventListener(TC.Consts.event.CLICK, function (e) {
                            self.downplayFeatures();
                            self.filterLayer.removeFeature(self.filterFeature);
                        }, { passive: true });
                    }
                });
            }
            else {
                const button = menu.querySelector(`.${self.CLASS}-btn`);
                if (button) {
                    button.remove();
                }
            }
            if (self.info.defaultFeature && self.getFeatureElement(self.info.defaultFeature)) {
                self.getFeatureElement(self.info.defaultFeature).classList.add(TC.Consts.classes.DEFAULT);
                self.highlightFeature(self.info.defaultFeature);
            }
            else if (content.querySelector(self._selectors.LIST_ITEM)) {
                self.highlightFeature(content.querySelector(self._selectors.LIST_ITEM));
            }
        }

        content.querySelectorAll('table:not(.complexAttr)').forEach(function (table) {
            if (!table.parentElement.classList.contains(TC.Consts.classes.CHECKED)) {
                table.setAttribute('title', self.getLocaleString('clickToShowOnMap'));
            }
            // En iPad se usa click en vez de touchstart para evitar que se resalte una feature al hacer scroll
            table.addEventListener('click', function (e) {
                const li = this.parentElement;
                if (li.classList.contains(TC.Consts.classes.DISABLED)) {
                    return;
                }
                if (li.classList.contains(TC.Consts.classes.CHECKED)) {
                    // Si ya está seleccionada hacemos zoom
                    const feature = getFeatureFromListItem(self, li);
                    if (feature && window.getSelection() && window.getSelection().toString().trim().length === 0) {
                        // Proceso para desactivar highlightFeature mientras hacemos zoom
                        var zoomHandler = function zoomHandler() {
                            self._zooming = false;
                            self.map.off(TC.Consts.event.ZOOM, zoomHandler);
                        };
                        self.map.on(TC.Consts.event.ZOOM, zoomHandler);
                        self._zooming = true;
                        ///////

                        self.map.zoomToFeatures([feature], { animate: true });
                    }
                }
                else {
                    // Si no está seleccionada la seleccionamos
                    self.highlightFeature(li);
                }
                e.stopPropagation();
            }, { passive: true });
        });
        content.querySelectorAll('table a, table label, table input').forEach(function (a) {
            a.addEventListener(TC.Consts.event.CLICK, function (e) {
                e.stopPropagation();
            }, { passive: true });
        });

        if (TC.browserFeatures.touch() && self.displayMode === TC.Consts.infoContainer.RESULTS_PANEL) {
            const prevBtn = content.querySelector('.' + self.CLASS + '-btn-prev');
            if (!prevBtn || prevBtn.style.display !== 'none') { // Si los botones de anterior/siguiente están visibles, montamos el swipe
                if (self.resultsPanel) {
                    TC.Util.swipe(self.resultsPanel.div, 'disable');
                }

                if (layerCount(self) > 1) {
                    TC.Util.swipe(content, {
                        left: function () {
                            self.highlightFeature(self.getNextFeatureElement(1), 1);
                        },
                        right: function () {
                            self.highlightFeature(self.getNextFeatureElement(-1), -1);
                        }
                    });
                }
            }
        }
    };

    ctlProto.onShowPopup = function (e) {
        const self = this;
        if (e.control === self.popup) {
            self.displayResultsCallback();
        }
    };

    ctlProto.loadSharedFeature = function (featureObj) {

    };

    ctlProto.insertLinks = function () {
        var self = this;
        const linkText = self.getLocaleString('open');
        const titleText = self.getLocaleString('linkInNewWindow');
        self.div.querySelectorAll('td.' + self.CLASS + '-val').forEach(function (td) {
            const text = td.textContent;
            if (TC.Util.isURL(text)) {
                td.innerHTML = '<a href="' + text + '" target="_blank" title="' + titleText + '">' + linkText + '</a>';
            }
        });
    };

    ctlProto.highlightFeature = function (featureOrElement, delta) {
        const self = this;
        var feature;
        if (!self._zooming) {
            var featureLi;
            // this puede ser o el elemento HTML de la lista correspondiente a la feature o la feature en sí
            if (featureOrElement instanceof TC.Feature) {
                feature = featureOrElement;
                featureLi = self.getFeatureElement(feature);
            }
            else {
                featureLi = featureOrElement;
                while (featureLi && featureLi.tagName !== 'LI') {
                    featureLi = featureLi.parentElement;
                }
            }
            const layerLi = getParentElement(featureLi, 'LI');
            const serviceLi = getParentElement(layerLi, 'LI');

            const serviceIdx = getElementIndex(serviceLi);
            const layerIdx = getElementIndex(layerLi);
            const featureIdx = getElementIndex(featureLi);
            feature = feature || self.getFeature(serviceIdx, layerIdx, featureIdx);

            self.downplayFeatures({ exception: feature });

            // Añadimos feature al historial de features resaltadas
            const service = self.info.services[serviceIdx];
            if (!self._infoHistory.hasOwnProperty(service.url)) {
                self._infoHistory[service.url] = {};
            }
            const historyService = self._infoHistory[service.url];
            const layer = service.layers[layerIdx];
            const historyLayer = historyService[layer.name] || [];
            historyService[layer.name] = historyLayer.concat(feature);

            const displayTarget = self.getDisplayTarget();
            displayTarget.querySelectorAll('li').forEach(elm => elm.classList.remove(self.CURRENT_CLASS));
            featureLi.classList.add(TC.Consts.classes.CHECKED, self.CURRENT_CLASS);
            layerLi.classList.add(TC.Consts.classes.CHECKED, self.CURRENT_CLASS);
            serviceLi.classList.add(TC.Consts.classes.CHECKED, self.CURRENT_CLASS);
            if (delta > 0) {
                featureLi.classList.add(TC.Consts.classes.FROMLEFT);
                layerLi.classList.add(TC.Consts.classes.FROMLEFT);
                serviceLi.classList.add(TC.Consts.classes.FROMLEFT);
            }
            else if (delta < 0) {
                featureLi.classList.add(TC.Consts.classes.FROMRIGHT);
                layerLi.classList.add(TC.Consts.classes.FROMRIGHT);
                serviceLi.classList.add(TC.Consts.classes.FROMRIGHT);
            }

            if (featureLi.querySelector('table')) {
                featureLi.querySelector('table').setAttribute('title', self.getLocaleString('clickToCenter'));
            }

            // Añadida esta condición porque si el servicio no devuelve datos parseables como feature se devuelve una pseudofeature sin geometría
            if (!(feature instanceof TC.Feature)) {
                feature = null;
            }

            //Si la feature a resaltar ya está resaltada, no hacemos nada. Así evitamos parpadeo
            if (feature && feature === self.highlightedFeature) {
                return;
            }

            self.highlightedFeature = feature;

            const counter = displayTarget.querySelector('.' + self.CLASS + '-counter-current');
            if (counter) {
                counter.innerHTML = self.getFeatureIndex(serviceIdx, layerIdx, featureIdx) + 1;
            }


            if (!self.options.persistentHighlights) {
                self.resultsLayer.features.slice().forEach(f => {
                    if (f !== feature) {
                        self.downplayFeature(f);
                    }
                });
            }
            if (feature) {
                const triggerEvent = f => self.map.trigger(TC.Consts.event.FEATUREHIGHLIGHT, { feature: f, control: self });
                if (feature.geometry) {
                    feature.showsPopup = self.options.persistentHighlights;
                    // Si persistentHighlights == true, es posible que la entidad que queremos añadir ya está en la capa de una consulta anterior
                    // En ese caso, no añadimos entidad nueva
                    let prevFeat;
                    if (self.options.persistentHighlights) {
                        prevFeat = self.resultsLayer.getFeatureById(feature.wrap.getId());
                        if (prevFeat) {
                            triggerEvent(prevFeat);
                        }
                    }
                    if (!prevFeat) {
                        self.resultsLayer.addFeature(feature).then(function (f) {
                            triggerEvent(feature);
                        });
                    }
                }
                else {
                    featureLi.classList.add(TC.Consts.classes.DISABLED);
                    triggerEvent(feature);
                }
            }
        }
    };

    ctlProto.downplayFeature = function (feature) {
        const self = this;
        const li = self.getFeatureElement(feature);
        if (li) {
            li.classList.remove(TC.Consts.classes.CHECKED);
        }
        // Si persistentHighlights = true, puede que la entidad a borrar sea una persistida de una petición anterior
        let prevFeat;
        if (self.options.persistentHighlights) {
            prevFeat = self.resultsLayer.getFeatureById(feature.wrap.getId());
        }
        self.resultsLayer.removeFeature(prevFeat || feature);
        for (url in self._infoHistory) {
            const service = self._infoHistory[url];
            for (name in service) {
                const layer = service[name];
                const idx = layer.indexOf(feature);
                if (idx >= 0) {
                    layer.splice(idx, 1);
                    if (!layer.length) {
                        delete service[name];
                    }
                }
            }
        }
        if (self.highlightedFeature === feature) {
            self.highlightedFeature = null;
        }
        self.map.trigger(TC.Consts.event.FEATUREDOWNPLAY, { feature: feature, control: self });
    };

    ctlProto.downplayFeatures = function (options) {
        const self = this;
        options = options || {};
        const prevHlFeature = self.highlightedFeature;
        if (prevHlFeature && prevHlFeature !== options.exception) {
            self.downplayFeature(prevHlFeature);
            self.highlightedFeature = null;
        }
        self.getFeatures()
            .filter(f => f !== prevHlFeature)
            .forEach(f => self.resultsLayer.removeFeature(f));

        const exceptionFLi = options.exception ? self.getFeatureElement(options.exception) : undefined;
        var exceptionLLi, exceptionSLi;
        if (exceptionFLi) {
            exceptionLLi = getParentElement(exceptionFLi, 'LI');
            exceptionSLi = getParentElement(exceptionLLi, 'LI');
        }

        const target = self.getDisplayTarget();
        Array.from(target.querySelectorAll('ul.' + self.CLASS + '-services li'))
            .filter(function (li) {
                return li !== exceptionFLi && li !== exceptionLLi && li !== exceptionSLi;
            })
            .forEach(function (li) {
                li.classList.remove(
                    TC.Consts.classes.CHECKED,
                    TC.Consts.classes.DISABLED,
                    TC.Consts.classes.FROMLEFT,
                    TC.Consts.classes.FROMRIGHT);
            });
        target.querySelectorAll('.' + self.CLASS + '-features table:not(.complexAttr)').forEach(function (table) {
            table.setAttribute('title', self.getLocaleString('clickToShowOnMap'));
        });

        setNotShowAllUI.call(self);
    };

    ctlProto.showAllFeatures = function () {
        const self = this;
        if (self.highlightedFeature) {
            self.downplayFeature(self.highlightedFeature);
        }
        const features = self.getFeatures();
        features.forEach(f => {
            f.showsPopup = self.options.persistentHighlights;
            if (self.resultsLayer.features.indexOf(f) < 0) {
                self.resultsLayer.addFeature(f);
            }
        });
        setShowAllUI.call(self);
    };

    ctlProto.hideAllFeatures = function () {
        const self = this;
        const checkedLayer = self.getDisplayTarget().querySelector(`ul.${self.CLASS}-layers > li.${TC.Consts.classes.CHECKED}`);
        self.downplayFeatures();
        if (checkedLayer) {
            checkedLayer.classList.add(TC.Consts.classes.CHECKED);
        }
        //setNotShowAllUI.call(self);
    };

    ctlProto.getFeature = function (serviceIdx, layerIdx, featureIdx) {
        const self = this;
        var result;
        const info = self.info;
        if (info && info.services) {
            result = info.services[serviceIdx];
            if (result) {
                result = result.layers[layerIdx];
                if (result) {
                    result = result.features[featureIdx];
                }
            }
        }
        return result;
    };

    ctlProto.getFeatures = function () {
        const self = this;
        let result = [];
        const info = self.info;
        if (info && info.services) {
            result = info.services.reduce((prev, cur) => {
                return prev.concat(cur.layers.reduce((p, c) => {
                    return p.concat(c.features);
                }, []));
            }, result);
        }
        return result;
    };

    ctlProto.getFeatureIndex = function (serviceIdx, layerIdx, featureIdx) {
        const self = this;
        var result = -1;
        const info = self.info;
        if (info) {
            for (var i = 0; i <= serviceIdx; i++) {
                var service = info.services[i];
                var maxj = i === serviceIdx ? layerIdx : service.layers.length - 1;
                for (var j = 0; j <= maxj; j++) {
                    var layer = service.layers[j];
                    var maxk = j === layerIdx ? featureIdx : layer.features.length - 1;
                    for (var k = 0; k <= maxk; k++) {
                        result = result + 1;
                    }
                }
            }
        }
        return result;
    };

    ctlProto.beforeRequest = function (options) {
        var self = this;
        self.querying = true;
        self.map.trigger(TC.Consts.event.BEFOREFEATUREINFO, {
            xy: options.xy,
            control: self
        });
        self.closeResults();
        if (self.map && self.resultsLayer) {
            self.lastFeatureCount = null;

            if (!self.options.persistentHighlights) {
                self.resultsLayer.features.slice().forEach(f => self.downplayFeature(f));
            }
            self.info = null;
        }
    };

    ctlProto.activate = function () {
        var self = this;
        if (self.wrap) {
            self.wrap.activate();
        }
        TC.Control.prototype.activate.call(self);
    };

    ctlProto.deactivate = function (stopChain) {
        var self = this;
        if (self.popup && self.popup.isVisible()) {
            self.popup.hide();
        }
        if (!self.options.persistentHighlights) {
            self.resultsLayer.features.slice().forEach(f => self.downplayFeature(f));
            self.info = null;
            self._infoHistory = {};
        }
        self.filterLayer && self.filterLayer.clearFeatures();
        self.filterFeature = null;
        if (self.wrap) {
            self.wrap.deactivate();
        }
        TC.Control.prototype.deactivate.call(self, stopChain);
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState && self.resultsLayer) {
            const exportStateOptions = {};
            // Si exportamos una consulta, tenemos que quitar las entidades resaltadas para evitar exportarlas dos veces
            if (self.toShare) {
                exportStateOptions.features = [];
            }
            return {
                id: self.id,
                layer: self.resultsLayer.exportState(exportStateOptions),
                query: self.toShare
            };
        }
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        self._layersPromise.then(function () {
            self.resultsLayer.importState(state.layer);
            if (state.query) {
                self.importQuery(state.query);
            }
        });
    };

    ctlProto._createLayers = function () {
        const self = this;

        var resultsLayer;
        if (self.options.resultsLayer) { // En caso de que se haya indicado una capa por configuración, la utilizamos
            resultsLayer = self.options.resultsLayer;
        } else {
            resultsLayer = {
                id: self.getUID(),
                title: self.CLASS + ': Results layer',
                type: TC.Consts.layerType.VECTOR,
                owner: self,
                stealth: true
            };
        }
        var filterLayer;
        if (self.options.filterLayer) {
            filterLayer = self.options.filterLayer;
        }
        else {
            const styles = {};
            if (self.geometryType === TC.Consts.geom.POLYLINE) {
                styles.line = self.style;
            }
            if (self.geometryType === TC.Consts.geom.POLYGON) {
                styles.polygon = self.style;
            }

            filterLayer = {
                id: self.getUID(),
                title: self.CLASS + ': Filter layer',
                owner: self,
                stealth: true,
                type: TC.Consts.layerType.VECTOR,
                styles: styles
            };
        }

        const map = self.map;
        self._layersPromise = new Promise(function (resolve, reject) {
            map.loaded(function () {
                const rlPromise = map.layers.indexOf(resultsLayer) >= 0 ?
                    Promise.resolve(resultsLayer) : map.addLayer(resultsLayer);
                const flPromise = map.layers.indexOf(filterLayer) >= 0 ?
                    Promise.resolve(filterLayer) : map.addLayer(filterLayer);
                Promise.all([rlPromise, flPromise]).then(function (layers) {
                    self.resultsLayer = layers[0];
                    self.filterLayer = layers[1];
                    resolve();
                });
            });
        });

        return self._layersPromise;
    };

    ctlProto._decorateDisplay = function (displayControl) {
        const self = this;

        const resultsContainer = self.getMenuTarget({ control: displayControl });

        // Añadimos botón de imprimir
        TC.loadJS(
            !TC.control.Print,
            [TC.apiLocation + 'TC/control/Print'],
            function () {
                const printBtn = resultsContainer.querySelector('.' + TC.control.Print.prototype.CLASS + '-btn');
                if (printBtn) {
                    // Si no hay datos porque el popup es de un GFI sin éxito y no es de una feature resaltada borramos impresora
                    if (!self.lastFeatureCount && (!displayControl.currentFeature || displayControl.currentFeature.showsPopup !== true)) {
                        printBtn.remove();
                    }
                }
                else {
                    var printTitle = self.getLocaleString("feature");
                    if (displayControl === self.getDisplayControl()) {
                        if (TC.feature.Point && self.filterFeature instanceof TC.feature.Point) {
                            const geom = self.filterFeature.geometry;
                            printTitle = self.getLocaleString('featuresAt', {
                                crs: self.map.crs,
                                x: TC.Util.formatCoord(geom[0], self.map.wrap.isGeo() ? TC.Consts.DEGREE_PRECISION : TC.Consts.METER_PRECISION),
                                y: TC.Util.formatCoord(geom[1], self.map.wrap.isGeo() ? TC.Consts.DEGREE_PRECISION : TC.Consts.METER_PRECISION)
                            });
                        }
                        else {
                            printTitle = self.getLocaleString('spatialQueryResults');
                        }
                    }
                    else if (displayControl.currentFeature) {
                        printTitle = displayControl.currentFeature.id;
                    }

                    // Si hay datos porque el popup es de un GFI con éxito o es de una feature resaltada damos la opción de imprimirlos
                    if (self.lastFeatureCount || (displayControl.currentFeature && displayControl.currentFeature.showsPopup === true)) {
                        new TC.control.Print({
                            target: resultsContainer,
                            printableElement: self.getDisplayTarget({ control: displayControl }),
                            title: printTitle
                        });
                    }
                }
            }
        );

        TC.control.FeatureInfoCommons.addSpecialAttributeEventListeners(displayControl.getContainerElement());

    };

    ctlProto._addSourceAttributes = function () {
        const self = this;
        const serviceAttrName = 'h3_' + self.getLocaleString('service');
        const layerAttrName = 'h4_' + self.getLocaleString('layer');
        // Añadimos como atributos los títulos de servicio y capa
        if (self.info && self.info.services) {
            self.info.services.forEach(function (service) {
                service.layers.forEach(function (layer) {
                    layer.features.forEach(function (feature) {
                        if (feature instanceof TC.Feature) {
                            const path = self.getFeaturePath(feature);
                            if (path) {
                                const newData = {};
                                newData[serviceAttrName] = path.service;
                                if (path.layer) {
                                    newData[layerAttrName] = path.layer.join(self.TITLE_SEPARATOR);
                                }
                                const allData = TC.Util.extend(newData, feature.getData());
                                feature.clearData();
                                feature.setData(allData);
                            }
                        }
                    });
                });
            });
        }
    };

    ctlProto._getFileName = function () {
        const self = this;
        return self.getLocaleString('featureInfo').toLowerCase().replace(/\s/gi, '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true);
    };

    ctlProto.showShareDialog = function (dialogDiv) {
        const self = this;
        self.toShare = self.exportQuery();
        return TC.control.infoShare.showShareDialog.call(self, dialogDiv);
    };

    ctlProto.exportQuery = function () {
        const self = this;
        const result = {};
        if (self.filterFeature) {
            const filterLayerState = self.filterLayer.exportState();
            filterLayerState.features.forEach(f => delete f.data);
            result.filter = filterLayerState;
            if (self.highlightedFeature) {
                result.hlf = self.highlightedFeature.getId();
            }
        }
        return result;
    };

    ctlProto.importQuery = function (query) {
        const self = this;
        if (query.filter) {
            self.activate();
            self.filterLayer.importState(query.filter)
                .then(function () {
                    self.filterFeature = self.filterLayer.features[0];
                    self.sendRequest(self.filterFeature);
                    const onFeatureHighlight = function (e) {
                        if (e.control === self) {
                            const feature = self.getFeatures().find(f => f.getId() === query.hlf);
                            if (feature) {
                                self.highlightFeature(feature);
                            }
                            else {
                                if (!query.hasOwnProperty("hlf")) {
                                    // timeout porque se está generando asíncronamente el botón de mostrar todas
                                    setTimeout(() => self.showAllFeatures(), 100);
                                }
                            }
                            self.map.off(TC.Consts.event.FEATUREHIGHLIGHT, onFeatureHighlight);
                        }
                    };
                    self.map.on(TC.Consts.event.FEATUREHIGHLIGHT, onFeatureHighlight);
                });
        }
    };

    const staticMethodMock = {};

    TC.control.FeatureInfoCommons.renderFeatureAttributeTable = function (options) {
        if (!staticMethodMock.template) {
            staticMethodMock.template = TC.Util.extend({}, ctlProto.template);
        }
        return ctlProto.getRenderedHtml.call(staticMethodMock, ctlProto.CLASS + '-attr', options);
    };

    TC.control.FeatureInfoCommons.renderFeatureAttribute = function (options) {
        if (!staticMethodMock.template) {
            staticMethodMock.template = TC.Util.extend({}, ctlProto.template);
        }
        return ctlProto.getRenderedHtml.call(staticMethodMock, ctlProto.CLASS + '-attr-val', options);
    };

    TC.control.FeatureInfoCommons.showImageDialog = function (img) {
        if (!staticMethodMock.template) {
            staticMethodMock.template = TC.Util.extend({}, ctlProto.template);
        }
        return new Promise(function (resolve, reject) {
            ctlProto.getRenderedHtml.call(staticMethodMock, ctlProto.CLASS + '-dialog', {
                src: img.getAttribute('src')
            }).then(function (html) {
                const container = document.createElement('div');
                document.body.appendChild(container);
                container.innerHTML = html;
                TC.Util.showModal(container.querySelector(`.${ctlProto.CLASS}-img-dialog`), {
                    closeCallback: () => container.remove()
                });
                container.querySelector('.tc-modal-img img').addEventListener(TC.Consts.event.CLICK, function (e) {
                    TC.Util.closeModal();
                }, { passive: true });
                resolve(container);
            });
        });
    };

    TC.control.FeatureInfoCommons.addSpecialAttributeEventListeners = function (container) {
        container.querySelectorAll('img.tc-img-attr').forEach(function (img) {
            img.addEventListener(TC.Consts.event.CLICK, function (e) {
                setTimeout(() => TC.control.FeatureInfoCommons.showImageDialog(e.target), 50);
                e.stopPropagation(); // No queremos zoom si pulsamos en una imagen
            }, { passive: true });
        })
    };

})();

TC.control = TC.control || {};

if (!TC.control.Click) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/Click');
}

TC.Consts.event.POPUP = TC.Consts.event.POPUP || 'popup.tc';
TC.Consts.event.POPUPHIDE = TC.Consts.event.POPUPHIDE || 'popuphide.tc';
TC.Consts.event.DRAWCHART = TC.Consts.event.DRAWCHART || 'drawchart.tc';
TC.Consts.event.DRAWTABLE = TC.Consts.event.DRAWTABLE || 'drawtable.tc';
TC.Consts.event.RESULTSPANELCLOSE = TC.Consts.event.RESULTSPANELCLOSE || 'resultspanelclose.tc';

TC.control.FeatureInfoCommons = function () {
    const self = this;
    TC.control.Click.apply(self, arguments);

    const cs = self._classSelector = '.' + self.CLASS;
    self._selectors = {
        LIST_ITEM: 'ul' + cs + '-features li'
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
};

TC.control.FeatureInfoCommons.displayMode = {
    POPUP: 'popup',
    RESULTS_PANEL: 'resultsPanel'
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

    var ctlProto = TC.control.FeatureInfoCommons.prototype;

    ctlProto.CLASS = 'tc-ctl-finfo';

    ctlProto.TITLE_SEPARATOR = ' • ';
    ctlProto.DEFAULT_STROKE_COLOR = '#0000ff';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/FeatureInfo.html";
    ctlProto.template[ctlProto.CLASS + "-object"] = TC.apiLocation + "TC/templates/FeatureInfoObject.html";

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.control.Click.prototype.register.call(self, map);

        self._createLayers();

        map.loaded(function () {
            const shareCtl = map.getControlsByClass('TC.control.Share')[0];
            if (shareCtl) {
                self.loadSharedFeature(shareCtl.loadParamFeature());
            }
        });

        self.displayMode = self.options.displayMode || TC.control.FeatureInfoCommons.displayMode.POPUP;
        self.setDisplayMode(self.displayMode);

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
            .on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                self.highlightedFeature = null;
            })
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
            .on(TC.Consts.event.VIEWCHANGE, function (e) {
                self.closeResults();
            });

        return result;
    };

    ctlProto.render = function () {
        const self = this;
        // Este div se usa como buffer, así que no debe ser visible.
        self.div.classList.add(TC.Consts.classes.HIDDEN);
        return self._set1stRenderPromise(Promise.resolve());
    };

    ctlProto.responseCallback = function (options) {
        const self = this;
        self.querying = false;

        if (self.filterFeature) {
            self.info = { services: options.services };
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
        var self = this;
        self.displayMode = mode;
        var map = self.map;
        switch (mode) {
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
                if (!self.resultsPanel) {
                    map.addControl('resultsPanel')
                        .then(function (rp) {
                            self.resultsPanel = rp;
                            rp.caller = self;
                        });
                }
                break;
            default:
                self.displayMode = TC.control.FeatureInfoCommons.displayMode.POPUP;
                if (!self.popup) {
                    map.addControl('popup', {
                        closeButton: true,
                        draggable: self.options.draggable
                    }).then(function (popup) {
                        self.popup = popup;
                        popup.caller = self;
                        map.on(TC.Consts.event.POPUP, function (e) {
                            self.onShowPopup(e);
                        });

                        map.on(TC.Consts.event.POPUPHIDE, function (e) {
                            if (e.control === popup) {
                                //restaurar el ancho automático
                                self._resetSize();
                            }
                        });
                    });
                }
                break;
        }
    };

    ctlProto.getDisplayControl = function () {
        var self = this;
        switch (self.displayMode) {
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
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
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
                return self.resultsPanel.getInfoContainer();
            default:
                return self.popup.getContainerElement();
        }
    };

    ctlProto.getMenuTarget = function () {
        var self = this;
        switch (self.displayMode) {
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
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
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
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
                    
                    TC.loadJS(
                        !TC.control.Print,
                        [TC.apiLocation + 'TC/control/Print'],
                        function () {
                            // Eliminamos la impresora porque al pintar los resultados ya se añadirá
                            const printBtn = self.getMenuTarget().querySelectorAll('.' + TC.control.Print.prototype.CLASS + '-btn');
                            if (printBtn.length > 0) {
                                printBtn[0].remove();
                            }

                            self.displayResultsCallback();
                        });
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

    ctlProto.getFeatureElement = function (feature) {
        const self = this;
        var result;
        const getIndex = function (elm) {
            return Array.from(elm.parentElement.childNodes).getIndex(elm);
        };
        self.getDisplayTarget().querySelectorAll(self._selectors.LIST_ITEM).forEach(function (li) {
            const currentFeatureLi = li;
            const currentLayerLi = getParentElement(li, 'LI');
            const currentServiceLi = getParentElement(currentLayerLi, 'LI');
            var feat = self.getFeature(getElementIndex(currentServiceLi), getElementIndex(currentLayerLi), getElementIndex(currentFeatureLi));
            if (feat === feature) {
                result = currentFeatureLi;
            }
        });
        return result;
    };

    ctlProto.getNextFeatureElement = function (delta) {
        const self = this;
        const lis = self.getDisplayTarget().querySelectorAll('ul.' + self.CLASS + '-features > li');
        const length = lis.length;
        for (var i = 0; i < length; i++) {
            if (lis[i].matches('.' + TC.Consts.classes.CHECKED)) {
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
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
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

        var selector;
        // Evento para resaltar una feature
        var eventType = 'click'; // En iPad se usa click en vez de touchstart para evitar que se resalte una feature al hacer scroll
        content.addEventListener(eventType, TC.EventTarget.listenerBySelector(self._selectors.LIST_ITEM, function (e) {
            self.highlightFeature(e.target);
        }));

        // Evento para ir a la siguiente feature
        eventType = TC.Consts.event.CLICK;
        selector = '.' + self.CLASS + '-btn-next';
        content.addEventListener(eventType, TC.EventTarget.listenerBySelector(selector, function (e) {
            self.highlightFeature(self.getNextFeatureElement(1), 1);
            return false;
        }));

        // Evento para ir a la feature anterior
        selector = '.' + self.CLASS + '-btn-prev';
        content.addEventListener(eventType, TC.EventTarget.listenerBySelector(selector, function (e) {
            self.highlightFeature(self.getNextFeatureElement(-1), -1);
            return false;
        }));

        // Evento para desplegar/replegar features de capa
        selector = 'ul.' + self.CLASS + '-layers h4';

        content.addEventListener(eventType, TC.EventTarget.listenerBySelector(selector, function (e) {
            const li = getParentElement(e.target, 'LI');
            if (li.classList.contains(TC.Consts.classes.CHECKED)) {
                // Si no está en modo móvil ocultamos la capa (si hay más de una)
                const anotherLayer = content.querySelector('.tc-ctl-finfo-layers li:not(.tc-checked)');
                if (anotherLayer && getComputedStyle(anotherLayer).display !== 'none') {
                    self.downplayFeatures();
                }
            }
            else {
                self.highlightFeature(li.querySelector(self._selectors.LIST_ITEM));
                if (self.displayMode === TC.control.FeatureInfoCommons.displayMode.POPUP) {
                    self.popup.fitToView(true);
                }
            }
        }));

        // Evento para borrar la feature resaltada
        selector = '.' + self.CLASS + '-del-btn';
        content.addEventListener(eventType, TC.EventTarget.listenerBySelector(selector, function (e) {
            self.downplayFeatures();
            self.closeResults();
        }));

        if (self.info) {
            if (self.info.defaultFeature && self.getFeatureElement(self.info.defaultFeature)) {
                self.getFeatureElement(self.info.defaultFeature).classList.add(TC.Consts.classes.DEFAULT);
                self.highlightFeature(self.info.defaultFeature);
            }
            else if (content.querySelector(self._selectors.LIST_ITEM)) {
                self.highlightFeature(content.querySelector(self._selectors.LIST_ITEM));
            }
        }

        content.querySelectorAll('table:not(.complexAttr)').forEach(function (table) {
            table.addEventListener(TC.Consts.event.CLICK, function (e) {
                const li = this.parentElement;
                if (li.classList.contains(TC.Consts.classes.DISABLED)) {
                    return;
                }
                if (li.classList.contains(TC.Consts.classes.CHECKED)) {
                    // Si ya está seleccionada hacemos zoom
                    if (self.resultsLayer.features[0] && window.getSelection() && window.getSelection().toString().trim().length === 0) {
                        // Proceso para desactivar highlightFeature mientras hacemos zoom
                        var zoomHandler = function zoomHandler() {
                            self._zooming = false;
                            self.map.off(TC.Consts.event.ZOOM, zoomHandler);
                        };
                        self.map.on(TC.Consts.event.ZOOM, zoomHandler);
                        self._zooming = true;
                        ///////

                        self.map.zoomToFeatures([self.resultsLayer.features[0]], { animate: true });
                    }
                }
                else {
                    // Si no está seleccionada la seleccionamos
                    self.highlightFeature(li);
                }
                e.stopPropagation();
            });
        });
        content.querySelectorAll('table a, table label, table input').forEach(function (a) {
            a.addEventListener(TC.Consts.event.CLICK, function (e) {
                e.stopPropagation();
            });
        });

        if (TC.browserFeatures.touch() && self.displayMode === TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL) {
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

            //ajustar el ancho para que no sobre a la derecha
            self._fitSize();
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

            featureLi.classList.add(TC.Consts.classes.CHECKED);
            layerLi.classList.add(TC.Consts.classes.CHECKED);
            serviceLi.classList.add(TC.Consts.classes.CHECKED);
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

            self.highlightedFeature = feature;

            if (self.getDisplayTarget().querySelector('.' + self.CLASS + '-counter-current')) {
                self.getDisplayTarget().querySelector('.' + self.CLASS + '-counter-current').innerHTML = self.getFeatureIndex(serviceIdx, layerIdx, featureIdx) + 1;
            }


            var features = self.resultsLayer.features.slice();
            var featureAlreadyHighlighted = features.filter(function (item) {
                return feature && feature.id === item.id;
            });

            //Si la feature a resaltar ya está resaltada, no hacemos nada. Así evitamos parpadeo
            if (featureAlreadyHighlighted.length > 0) {
                self.highlightedFeature = featureAlreadyHighlighted[0]; // Asignamos la original, la seleccionada inicialmente es un clon
                return;
            }

            if (!self.options.persistentHighlights) {
                features.forEach(f => {
                    if (f !== self.filterFeature) {
                        self.downplayFeature(f);
                    }
                });
            }
            if (feature && feature.geometry) {
                feature.showsPopup = self.options.persistentHighlights;
                self.resultsLayer.addFeature(feature);
            }
            else {
                featureLi.classList.add(TC.Consts.classes.DISABLED);
            }
        }
    };

    ctlProto.downplayFeature = function (feature) {
        const self = this;
        self.resultsLayer.removeFeature(feature);
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
    };

    ctlProto.downplayFeatures = function (options) {
        const self = this;
        options = options || {};
        if (self.highlightedFeature && self.highlightedFeature !== options.exception) {
            self.downplayFeature(self.highlightedFeature);
            self.highlightedFeature = null;
        }
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
    };

    ctlProto._fitSize = function () {
        const self = this;
        const target = self.getDisplayTarget();
        var max = 0;
        //medir la máxima anchura de <ul>
        target.querySelectorAll("input").forEach(function (checkbox) { checkbox.checked = true })
        target.querySelectorAll(".tc-ctl-finfo-features li").forEach(function (elm) {
            max = Math.max(max, elm.offsetLeft + elm.offsetWidth);
        });

        //alert("max=" + max);
        if (max) {
            target.style.width = max + 50 + 'px';
        }
        target.querySelectorAll("input").forEach(function (checkbox) { checkbox.checked = false })
    };

    ctlProto._resetSize = function () {
        const self = this;
        self.getDisplayTarget().style.removeProperty('width');
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
            return {
                id: self.id,
                layer: self.resultsLayer.exportState()
            };
        }
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        self._layersPromise.then(function () {
            self.resultsLayer.importState(state.layer);
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
                Promise.all([map.addLayer(resultsLayer), map.addLayer(filterLayer)]).then(function (layers) {
                    self.resultsLayer = layers[0];
                    self.filterLayer = layers[1];
                    resolve();
                });
            });
        });

        return self._layersPromise;
    };

    ctlProto._decorateDisplay = function (ctl) {
        const self = this;

        const resultsContainer = self.getMenuTarget({ control: ctl });

        // Añadimos botón de imprimir
        TC.loadJS(
            !TC.control.Print,
            [TC.apiLocation + 'TC/control/Print'],
            function () {

                if (!resultsContainer.querySelectorAll('.' + TC.control.Print.prototype.CLASS + '-btn').length) {
                    var printTitle = self.getLocaleString("feature");
                    if (ctl === self.getDisplayControl()) {
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
                    else if (ctl.currentFeature) {
                        printTitle = ctl.currentFeature.id;
                    }

                    // Si hay datos porque el popup es de un GFI con éxito o es de una feature resaltada damos la opción de imprimirlos
                    if (self.lastFeatureCount || (ctl.currentFeature && ctl.currentFeature.showsPopup === true)) {
                        new TC.control.Print({
                            target: resultsContainer,
                            printableElement: self.getDisplayTarget({ control: ctl }),
                            title: printTitle
                        });
                    }
                }
            }
        );
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

})();

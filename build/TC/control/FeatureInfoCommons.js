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
        return ctl.info.services ?
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

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/FeatureInfo.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.x(ctx.get(["displayElevation"], false), ctx, { "block": body_1 }, {}).w("<ul class=\"tc-ctl-finfo-services\">").s(ctx.get(["services"], false), ctx, { "else": body_4, "block": body_6 }, {}).w("</ul>").x(ctx.get(["featureCount"], false), ctx, { "block": body_30 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<div class=\"tc-ctl-finfo-coords\"><span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-crs\">CRS: <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.get(["crs"], false), ctx, "h").w("</span></span> ").x(ctx.get(["isGeo"], false), ctx, { "else": body_2, "block": body_3 }, {}).w(" <span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-elev\">").h("i18n", ctx, {}, { "$key": "ele" }).w(": <span class=\"tc-ctl-finfo-coords-val\"></span></span></div>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-x\">x: <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.getPath(false, ["coords", "0"]), ctx, "h").w("</span></span> <span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-x\">y: <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.getPath(false, ["coords", "1"]), ctx, "h").w("</span></span> "); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-lat\">").h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.getPath(false, ["coords", "1"]), ctx, "h").w("</span></span> <span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-lon\">").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.getPath(false, ["coords", "0"]), ctx, "h").w("</span></span> "); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.nx(ctx.get(["displayElevation"], false), ctx, { "block": body_5 }, {}); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<li class=\"tc-ctl-finfo-empty\">").h("i18n", ctx, {}, { "$key": "noData" }).w("</li>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<li><h3>").x(ctx.get(["title"], false), ctx, { "else": body_7, "block": body_10 }, {}).w("</h3><div class=\"tc-ctl-finfo-service-content\">").s(ctx.get(["hasLimits"], false), ctx, { "else": body_11, "block": body_29 }, {}).w("</div></li>"); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.x(ctx.getPath(false, ["layers", "0", "title"]), ctx, { "else": body_8, "block": body_9 }, {}); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.f(ctx.getPath(false, ["layer", "name"]), ctx, "h"); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.f(ctx.getPath(false, ["layers", "0", "title"]), ctx, "h"); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.f(ctx.get(["title"], false), ctx, "h"); } body_10.__dustBody = !0; function body_11(chk, ctx) { return chk.w("<ul class=\"tc-ctl-finfo-layers\">").s(ctx.get(["layers"], false), ctx, { "else": body_12, "block": body_13 }, {}).w("</ul>"); } body_11.__dustBody = !0; function body_12(chk, ctx) { return chk.w("<li class=\"tc-ctl-finfo-empty\">").h("i18n", ctx, {}, { "$key": "noDataAtThisService" }).w("</li>"); } body_12.__dustBody = !0; function body_13(chk, ctx) { return chk.w("<li><h4><span class=\"tc-ctl-finfo-layer-n\">").f(ctx.getPath(false, ["features", "length"]), ctx, "h").w("</span> ").s(ctx.get(["path"], false), ctx, { "block": body_14 }, {}).w("</h4> <div class=\"tc-ctl-finfo-layer-content\"><ul class=\"tc-ctl-finfo-features\">").s(ctx.get(["features"], false), ctx, { "else": body_16, "block": body_17 }, {}).w("</ul></div></li>"); } body_13.__dustBody = !0; function body_14(chk, ctx) { return chk.f(ctx.getPath(true, []), ctx, "h").h("sep", ctx, { "block": body_15 }, {}); } body_14.__dustBody = !0; function body_15(chk, ctx) { return chk.w(" &bull; "); } body_15.__dustBody = !0; function body_16(chk, ctx) { return chk.w("<li class=\"tc-ctl-finfo-empty\">").h("i18n", ctx, {}, { "$key": "noDataInThisLayer" }).w("</li>"); } body_16.__dustBody = !0; function body_17(chk, ctx) { return chk.w("<li>").x(ctx.get(["rawContent"], false), ctx, { "else": body_18, "block": body_23 }, {}).w("</li>"); } body_17.__dustBody = !0; function body_18(chk, ctx) { return chk.x(ctx.get(["error"], false), ctx, { "else": body_19, "block": body_22 }, {}); } body_18.__dustBody = !0; function body_19(chk, ctx) { return chk.w("<h5>").f(ctx.get(["id"], false), ctx, "h").w("</h5><table").x(ctx.get(["geometry"], false), ctx, { "block": body_20 }, {}).w("><tbody>").s(ctx.get(["attributes"], false), ctx, { "block": body_21 }, {}).w("</tbody></table>"); } body_19.__dustBody = !0; function body_20(chk, ctx) { return chk.w(" title=\"").h("i18n", ctx, {}, { "$key": "clickToShowOnMap" }).w("\""); } body_20.__dustBody = !0; function body_21(chk, ctx) { return chk.w("<tr><th class=\"tc-ctl-finfo-attr\">").f(ctx.get(["name"], false), ctx, "h").w("</th><td class=\"tc-ctl-finfo-val\">").f(ctx.get(["value"], false), ctx, "h").w("</td></tr>"); } body_21.__dustBody = !0; function body_22(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-errors\">").h("i18n", ctx, {}, { "$key": "fi.error" }).w("<span class=\"tc-ctl-finfo-error-text\">").f(ctx.get(["error"], false), ctx, "h").w("</span></span>"); } body_22.__dustBody = !0; function body_23(chk, ctx) { return chk.w("<h5>").h("i18n", ctx, {}, { "$key": "feature" }).w("</h5>").h("eq", ctx, { "else": body_24, "block": body_25 }, { "key": ctx.get(["rawFormat"], false), "value": "text/html" }); } body_23.__dustBody = !0; function body_24(chk, ctx) { return chk.w("<pre>").f(ctx.get(["rawContent"], false), ctx, "h").w("</pre>"); } body_24.__dustBody = !0; function body_25(chk, ctx) { return chk.w(" ").x(ctx.get(["expandUrl"], false), ctx, { "block": body_26 }, {}); } body_25.__dustBody = !0; function body_26(chk, ctx) { return chk.h("ne", ctx, { "else": body_27, "block": body_28 }, { "key": ctx.get(["expandUrl"], false), "value": "" }); } body_26.__dustBody = !0; function body_27(chk, ctx) { return chk.w("<iframe src=\"").f(ctx.get(["rawUrl"], false), ctx, "h").w("\"></iframe>"); } body_27.__dustBody = !0; function body_28(chk, ctx) { return chk.w("<div class=\"tc-ctl-finfo-features-iframe-cnt\"><iframe src=\"").f(ctx.get(["rawUrl"], false), ctx, "h").w("\"></iframe><a class=\"tc-ctl-finfo-open\" onclick=\"window.open('").f(ctx.get(["expandUrl"], false), ctx, "h").w("', '_blank')\" title=\"").h("i18n", ctx, {}, { "$key": "expand" }).w("\"></a></div>"); } body_28.__dustBody = !0; function body_29(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-errors\">").f(ctx.get(["hasLimits"], false), ctx, "h").w("</span>"); } body_29.__dustBody = !0; function body_30(chk, ctx) { return chk.h("gt", ctx, { "block": body_31 }, { "key": ctx.get(["featureCount"], false), "value": "1", "type": "number" }); } body_30.__dustBody = !0; function body_31(chk, ctx) { return chk.w("<a class=\"tc-ctl-btn tc-ctl-finfo-btn-prev\">").h("i18n", ctx, {}, { "$key": "previous" }).w("</a><div class=\"tc-ctl-finfo-counter\"><span class=\"tc-ctl-finfo-counter-current\"></span>/").f(ctx.get(["featureCount"], false), ctx, "h").w("</div><a class=\"tc-ctl-btn tc-ctl-finfo-btn-next\">").h("i18n", ctx, {}, { "$key": "next" }).w("</a>"); } body_31.__dustBody = !0; return body_0 };
    }

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
                    if (self.highlightedFeature) {
                        self.resultsLayer.removeFeature(self.highlightedFeature);
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
                if (e.control.currentFeature &&
                    e.control.currentFeature.layer &&
                    self.filterLayer &&
                    self.resultsLayer &&
                    [self.filterLayer.id, self.resultsLayer.id].indexOf(e.control.currentFeature.layer.id) > -1) {
                    self._decorateDisplay(control);
                }
            })
            .on(TC.Consts.event.DRAWCHART, function (e) {
                setTimeout(function () {
                    self.highlightedFeature = e.control.currentFeature;
                }, 50);
            })
            .on(TC.Consts.event.LAYERREMOVE, function () {
                if (self.info && self.info.services) {
                    const services = {};
                    self.map.workLayers
                        .filter(function (layer) {
                            return layer.type === TC.Consts.layerType.WMS;
                        })
                        .forEach(function (layer) {
                            const names = services[layer.url] || [];
                            services[layer.url] = names.concat(layer.getDisgregatedLayerNames())
                        });
                    for (var i = 0, len = self.info.services.length; i < len; i++) {
                        const service = self.info.services[i];
                        const mapNames = services[service.mapLayers[0].url] || [];
                        const infoNames = service.layers.reduce(function (arr, layer) {
                            return arr.concat(layer.name);
                        }, []);
                        if (!infoNames.every(function (name) {
                            return mapNames.indexOf(name) >= 0;
                        })) {
                            // En el objeto info hay capas que no están ya en el mapa: borramos resultados.
                            self.downplayFeatures();
                            self.info = null;
                            self.closeResults();
                            break;
                        }
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
            self.closeResults();
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
                    var rp = map.getControlsByClass('TC.control.ResultsPanel').filter(function (ctrl) { return ctrl.options.content === "table" })[0];
                    if (rp) {
                        self.resultsPanel = rp;
                        rp.caller = self;
                    }
                    else {
                        var setResultsPanel = function setResultsPanel(e) {
                            const control = e.control;
                            if (TC.control.ResultsPanel && control instanceof TC.control.ResultsPanel) {
                                self.resultsPanel = control;
                                control.caller = self;
                                map.off(TC.Consts.event.CONTROLADD, setResultsPanel);
                            }
                        };
                        map.on(TC.Consts.event.CONTROLADD, setResultsPanel);
                    }
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
                    return options.control.getTableContainer();
                default:
                    return null;
            }
        }
        switch (self.displayMode) {
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
                return self.resultsPanel.getTableContainer();
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
                    } else {
                        // cerramos los paneles con feature asociada
                        const panels = self.map.getControlsByClass('TC.control.ResultsPanel');
                        panels.forEach(function (p) {
                            if (p !== self.resultsPanel && p.currentFeature) {
                                p.close();
                            }
                        });
                    }

                    self.resultsPanel.currentFeature = self.filterFeature;
                    self.resultsPanel.open(self.filterFeature.data, self.resultsPanel.getInfoContainer());
                    

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
        return Array.from(elm.parentElement.childNodes).indexOf(elm);
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

        content.querySelectorAll('table').forEach(function (table) {
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
        content.querySelectorAll('table a').forEach(function (a) {
            a.addEventListener(TC.Consts.event.CLICK, function (e) {
                e.stopPropagation();
            });
        });

        if (TC.browserFeatures.touch() && self.displayMode === TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL) {
            if (content.querySelector('.' + self.CLASS + '-btn-prev').style.display !== 'none') { // Si los botones de anterior/siguiente están visibles, montamos el swipe
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
                return;
            }

            for (var i = 0; i < features.length; i++) {
                var f = features[i];
                if (f !== self.filterFeature) {
                    self.resultsLayer.removeFeature(f);
                }
            }
            if (feature && feature.geometry) {
                self.resultsLayer.addFeature(feature);
            }
            else {
                featureLi.classList.add(TC.Consts.classes.DISABLED);
            }
        }
    };

    ctlProto.downplayFeatures = function (options) {
        const self = this;
        options = options || {};
        if (self.highlightedFeature !== options.exception) {
            self.highlightedFeature = null;
        }
        const exceptionFLi = options.exception ? self.getFeatureElement(options.exception) : undefined;
        var exceptionLLi, exceptionSLi;
        if (exceptionFLi) {
            exceptionLLi = getParentElement(exceptionFLi, 'LI');
            exceptionSLi = getParentElement(exceptionLLi, 'LI');
        }

        self.resultsLayer.clearFeatures();
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
        target.querySelectorAll('.' + self.CLASS + '-features table').forEach(function (table) {
            table.setAttribute('title', self.getLocaleString('clickToShowOnMap'));
        });
    };

    ctlProto._fitSize = function () {
        const self = this;
        const target = self.getDisplayTarget();
        var max = 0;
        //medir la máxima anchura de <ul>
        target.querySelectorAll(".tc-ctl-finfo-features li").forEach(function (elm) {
            max = Math.max(max, elm.offsetLeft + elm.offsetWidth);
        });

        //alert("max=" + max);
        if (max) {
            target.style.width = max + 50 + 'px';
        }
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

            self.resultsLayer.features.forEach(function (feature) {
                self.resultsLayer.removeFeature(feature);
            });
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
        if (self.popup) {
            self.popup.hide();
        }
        self.resultsLayer.clearFeatures();
        self.filterLayer.clearFeatures();
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
                stealth: true
            };
        }
        var filterLayer;
        if (self.options.filterLayer) {
            filterLayer = self.options.filterLayer;
        }
        else {
            filterLayer = {
                id: self.getUID(),
                title: self.CLASS + ': Filter layer',
                stealth: true,
                type: TC.Consts.layerType.VECTOR
                , styles: {
                    line: { strokeColor: self.lineColor, strokeWidth: 2 },
                    polygon: { strokeColor: self.lineColor, strokeWidth: 2, fillColor: "#000", fillOpacity: 0.3 }
                }
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

        const resultsContainer = self.getDisplayTarget({ control: ctl });

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
                                x: TC.Util.formatNumber(geom[0], self.map.locale),
                                y: TC.Util.formatNumber(geom[1], self.map.locale)
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

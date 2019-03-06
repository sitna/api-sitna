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
    self._layersDeferred = $.Deferred();
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
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.x(ctx.get(["elevation"], false), ctx, { "block": body_1 }, {}).w("<ul class=\"tc-ctl-finfo-services\">").s(ctx.get(["services"], false), ctx, { "else": body_4, "block": body_6 }, {}).w("</ul>").x(ctx.get(["featureCount"], false), ctx, { "block": body_30 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<div class=\"tc-ctl-finfo-coords\"><span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-crs\">CRS: <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.get(["crs"], false), ctx, "h").w("</span></span> ").x(ctx.get(["isGeo"], false), ctx, { "else": body_2, "block": body_3 }, {}).w(" <span class=\"tc-ctl-finfo-coords-pair\">").h("i18n", ctx, {}, { "$key": "ele" }).w(": <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.get(["elevation"], false), ctx, "h").w(" m</span></span></div>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-x\">x: <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.getPath(false, ["coords", "0"]), ctx, "h").w("</span></span> <span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-x\">y: <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.getPath(false, ["coords", "1"]), ctx, "h").w("</span></span> "); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-lat\">").h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.getPath(false, ["coords", "1"]), ctx, "h").w("</span></span> <span class=\"tc-ctl-finfo-coords-pair tc-ctl-finfo-coords-lon\">").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-finfo-coords-val\">").f(ctx.getPath(false, ["coords", "0"]), ctx, "h").w("</span></span> "); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.nx(ctx.get(["elevation"], false), ctx, { "block": body_5 }, {}); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<li class=\"tc-ctl-finfo-empty\">").h("i18n", ctx, {}, { "$key": "noData" }).w("</li>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<li><h3>").x(ctx.get(["title"], false), ctx, { "else": body_7, "block": body_10 }, {}).w("</h3><div class=\"tc-ctl-finfo-service-content\">").s(ctx.get(["hasLimits"], false), ctx, { "else": body_11, "block": body_29 }, {}).w("</div></li>"); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.x(ctx.getPath(false, ["layers", "0", "title"]), ctx, { "else": body_8, "block": body_9 }, {}); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.f(ctx.getPath(false, ["layer", "name"]), ctx, "h"); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.f(ctx.getPath(false, ["layers", "0", "title"]), ctx, "h"); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.f(ctx.get(["title"], false), ctx, "h"); } body_10.__dustBody = !0; function body_11(chk, ctx) { return chk.w("<ul class=\"tc-ctl-finfo-layers\">").s(ctx.get(["layers"], false), ctx, { "else": body_12, "block": body_13 }, {}).w("</ul>"); } body_11.__dustBody = !0; function body_12(chk, ctx) { return chk.w("<li class=\"tc-ctl-finfo-empty\">").h("i18n", ctx, {}, { "$key": "noDataAtThisService" }).w("</li>"); } body_12.__dustBody = !0; function body_13(chk, ctx) { return chk.w("<li><h4><span class=\"tc-ctl-finfo-layer-n\">").f(ctx.getPath(false, ["features", "length"]), ctx, "h").w("</span> ").s(ctx.get(["path"], false), ctx, { "block": body_14 }, {}).w("</h4> <div class=\"tc-ctl-finfo-layer-content\"><ul class=\"tc-ctl-finfo-features\">").s(ctx.get(["features"], false), ctx, { "else": body_16, "block": body_17 }, {}).w("</ul></div></li>"); } body_13.__dustBody = !0; function body_14(chk, ctx) { return chk.f(ctx.getPath(true, []), ctx, "h").h("sep", ctx, { "block": body_15 }, {}); } body_14.__dustBody = !0; function body_15(chk, ctx) { return chk.w(" &bull; "); } body_15.__dustBody = !0; function body_16(chk, ctx) { return chk.w("<li class=\"tc-ctl-finfo-empty\">").h("i18n", ctx, {}, { "$key": "noDataInThisLayer" }).w("</li>"); } body_16.__dustBody = !0; function body_17(chk, ctx) { return chk.w("<li>").x(ctx.get(["rawContent"], false), ctx, { "else": body_18, "block": body_23 }, {}).w("</li>"); } body_17.__dustBody = !0; function body_18(chk, ctx) { return chk.x(ctx.get(["error"], false), ctx, { "else": body_19, "block": body_22 }, {}); } body_18.__dustBody = !0; function body_19(chk, ctx) { return chk.w("<h5>").f(ctx.get(["id"], false), ctx, "h").w("</h5><table").x(ctx.get(["geometry"], false), ctx, { "block": body_20 }, {}).w("><tbody>").s(ctx.get(["attributes"], false), ctx, { "block": body_21 }, {}).w("</tbody></table>"); } body_19.__dustBody = !0; function body_20(chk, ctx) { return chk.w(" title=\"").h("i18n", ctx, {}, { "$key": "clickToShowOnMap" }).w("\""); } body_20.__dustBody = !0; function body_21(chk, ctx) { return chk.w("<tr><th class=\"tc-ctl-finfo-attr\">").f(ctx.get(["name"], false), ctx, "h").w("</th><td class=\"tc-ctl-finfo-val\">").f(ctx.get(["value"], false), ctx, "h").w("</td></tr>"); } body_21.__dustBody = !0; function body_22(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-errors\">").h("i18n", ctx, {}, { "$key": "fi.error" }).w("<span class=\"tc-ctl-finfo-error-text\">").f(ctx.get(["error"], false), ctx, "h").w("</span></span>"); } body_22.__dustBody = !0; function body_23(chk, ctx) { return chk.w("<h5>").h("i18n", ctx, {}, { "$key": "feature" }).w("</h5>").h("eq", ctx, { "else": body_24, "block": body_25 }, { "key": ctx.get(["rawFormat"], false), "value": "text/html" }); } body_23.__dustBody = !0; function body_24(chk, ctx) { return chk.w("<pre>").f(ctx.get(["rawContent"], false), ctx, "h").w("</pre>"); } body_24.__dustBody = !0; function body_25(chk, ctx) { return chk.w(" ").x(ctx.get(["expandUrl"], false), ctx, { "block": body_26 }, {}); } body_25.__dustBody = !0; function body_26(chk, ctx) { return chk.h("ne", ctx, { "else": body_27, "block": body_28 }, { "key": ctx.get(["expandUrl"], false), "value": "" }); } body_26.__dustBody = !0; function body_27(chk, ctx) { return chk.w("<iframe src=\"").f(ctx.get(["rawUrl"], false), ctx, "h").w("\" />"); } body_27.__dustBody = !0; function body_28(chk, ctx) { return chk.w("<div class=\"tc-ctl-finfo-features-iframe-cnt\"><iframe src=\"").f(ctx.get(["rawUrl"], false), ctx, "h").w("\" /><a class=\"tc-ctl-finfo-open\" onclick=\"window.open('").f(ctx.get(["expandUrl"], false), ctx, "h").w("', '_blank')\" title=\"").h("i18n", ctx, {}, { "$key": "expand" }).w("\"></a></div>"); } body_28.__dustBody = !0; function body_29(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-errors\">").f(ctx.get(["hasLimits"], false), ctx, "h").w("</span>"); } body_29.__dustBody = !0; function body_30(chk, ctx) { return chk.h("gt", ctx, { "block": body_31 }, { "key": ctx.get(["featureCount"], false), "value": "1", "type": "number" }); } body_30.__dustBody = !0; function body_31(chk, ctx) { return chk.w("<a class=\"tc-ctl-btn tc-ctl-finfo-btn-prev\">").h("i18n", ctx, {}, { "$key": "previous" }).w("</a><div class=\"tc-ctl-finfo-counter\"><span class=\"tc-ctl-finfo-counter-current\"></span>/").f(ctx.get(["featureCount"], false), ctx, "h").w("</div><a class=\"tc-ctl-btn tc-ctl-finfo-btn-next\">").h("i18n", ctx, {}, { "$key": "next" }).w("</a>"); } body_31.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        const self = this;
        const deferred = $.Deferred();

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
                    if (!self.querying) {
                        self.filterLayer.clearFeatures();
                    }
                }
            })
            .on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                self.highlightedFeature = null;
            })
            .on(TC.Consts.event.POPUP + ' ' + TC.Consts.event.DRAWTABLE + ' ' + TC.Consts.event.DRAWCHART, function (e) {
                if (e.control.currentFeature !== self.filterFeature) {
                    self.highlightedFeature = e.control.currentFeature;
                }
                self._decorateDisplay(e.control);
            })
            .on(TC.Consts.event.DRAWCHART, function (e) {
                setTimeout(function () {
                    self.highlightedFeature = e.control.currentFeature;
                }, 50);
            })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
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
            .on(TC.Consts.event.VIEWCHANGE, function () {
                if (map.view === TC.Consts.view.PRINTING) {
                    self.closeResults();
                }
            });

        return result;
    };

    ctlProto.render = function (callback) {
        const self = this;
        // Este div se usa como buffer, así que no debe ser visible.
        self._$div.addClass(TC.Consts.classes.HIDDEN);
    };

    ctlProto.responseCallback = function (options) {
        const self = this;
        self.querying = false;

        if (self.filterFeature) {
            self.info = { services: options.services };
        }

        if (!options.featureCount) {
            self.lastFeatureCount = 0;
            self.map.$events.trigger($.Event(TC.Consts.event.NOFEATUREINFO, { control: self }));
            self.closeResults();
        }
        else {
            self._addSourceAttributes();
            self.lastFeatureCount = options.featureCount;
            self.map.$events.trigger($.Event(TC.Consts.event.FEATUREINFO, $.extend({ control: self }, options)));
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
                            if (TC.control.ResultsPanel && e.control instanceof TC.control.ResultsPanel) {
                                self.resultsPanel = e.control;
                                e.control.caller = self;
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
                    $.when(map.addControl('popup', {
                        closeButton: true,
                        draggable: self.options.draggable
                    })).then(function (popup) {
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
        self.filterFeature.data = $('<div>').append(self._$div.clone().removeClass(TC.Consts.classes.HIDDEN)).html();
        switch (self.displayMode) {
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
                if (self.resultsPanel) {                    

                    self.map.getControlsByClass(TC.control.ResultsPanel).forEach(function (p) {
                        if (p.isVisible()) {
                            p.close();
                        }
                    });

                    self.resultsPanel.currentFeature = self.filterFeature;
                    self.resultsPanel.open(self.filterFeature.data, self.resultsPanel.getInfoContainer());

                    // GLS: lanzo el evento drawTable para que el control featureTools guarde referencia a highlightedFeature, si no lo lanzo, el orden de los eventos hace que no obtenga la referencia y al cerrar el panel borra la feature resaltada
                    self.map.$events.trigger($.Event(TC.Consts.event.DRAWTABLE, { control: self.resultsPanel }));

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

    ctlProto.getFeatureElement = function (feature) {
        var self = this;
        var $featureLi;
        $(self.getDisplayTarget()).find(self._selectors.LIST_ITEM).each(function (idx, li) {
            var $currentFeatureLi = $(li);
            var $currentLayerLi = $currentFeatureLi.parents('li').first();
            var $currentServiceLi = $currentLayerLi.parents('li').first();
            var feat = self.getFeature($currentServiceLi.index(), $currentLayerLi.index(), $currentFeatureLi.index());
            if (feat === feature) {
                $featureLi = $currentFeatureLi;
            }
        });
        return $featureLi && $featureLi.get(0);
    };

    ctlProto.getNextFeatureElement = function (delta) {
        var self = this;
        var $lis = $(self.getDisplayTarget()).find('ul.' + self.CLASS + '-features > li');
        var length = $lis.length;
        var $checkedLi = $lis.filter('.' + TC.Consts.classes.CHECKED);
        var checkedIdx = $lis.index($checkedLi.get(0));
        return $lis.get((checkedIdx + delta + length) % length);
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
        var $content = $(self.getDisplayTarget()).find('.' + self.CLASS).first();

        var selector;
        // Evento para resaltar una feature
        var events = 'click'; // En iPad se usa click en vez de touchstart para evitar que se resalte una feature al hacer scroll
        $content.on(events, self._selectors.LIST_ITEM, function (e) {
            self.highlightFeature(this);
        });

        // Evento para ir a la siguiente feature
        events = TC.Consts.event.CLICK;
        selector = '.' + self.CLASS + '-btn-next';
        $content.on(events, selector, function (e) {
            self.highlightFeature(self.getNextFeatureElement(1), 1);
            return false;
        });

        // Evento para ir a la feature anterior
        selector = '.' + self.CLASS + '-btn-prev';
        $content.on(events, selector, function (e) {
            self.highlightFeature(self.getNextFeatureElement(-1), -1);
            return false;
        });

        // Evento para desplegar/replegar features de capa
        selector = 'ul.' + self.CLASS + '-layers h4';

        $content.on(events, selector, function (e) {
            var $li = $(e.target).parents('li').first();
            if ($li.hasClass(TC.Consts.classes.CHECKED)) {
                // Si no está en modo móvil ocultamos la capa (si hay más de una)
                if ($content.find('.tc-ctl-finfo-btn-next').css('display') === 'none') {
                    if (layerCount(self) > 1) {
                        self.downplayFeatures();
                    }
                }
            }
            else {
                self.highlightFeature($li.find(self._selectors.LIST_ITEM).first()[0]);
                if (self.displayMode === TC.control.FeatureInfoCommons.displayMode.POPUP) {
                    self.popup.fitToView(true);
                }
            }
        });

        // Evento para borrar la feature resaltada
        selector = '.' + self.CLASS + '-del-btn';
        $content.on(events, selector, function (e) {
            self.downplayFeatures();
            self.closeResults();
        });

        if (self.info) {
            if (self.info.defaultFeature) {
                $(self.getFeatureElement(self.info.defaultFeature)).addClass(TC.Consts.classes.DEFAULT);
                self.highlightFeature(self.info.defaultFeature);
            }
            else {
                self.highlightFeature($content.find(self._selectors.LIST_ITEM).first()[0]);
            }
        }

        $content.find('table').on(TC.Consts.event.CLICK, function (e) {
            const $li = $(this).parent();
            if ($li.hasClass(TC.Consts.classes.DISABLED)) {
                return;
            }
            if ($li.hasClass(TC.Consts.classes.CHECKED)) {
                // Si ya está seleccionada hacemos zoom
                if (self.resultsLayer.features[0]) {
                    // Proceso para desactivar highlightFeature mientras hacemos zoom
                    var zoomHandler = function zoomHandler() {
                        self._zooming = false;
                        self.map.off(TC.Consts.event.ZOOM, zoomHandler);
                    }
                    self.map.on(TC.Consts.event.ZOOM, zoomHandler);
                    self._zooming = true;
                    ///////
                    self.map.zoomToFeatures([self.resultsLayer.features[0]], { animate: true });
                }
            }
            else {
                // Si no está seleccionada la seleccionamos
                self.highlightFeature($li);
            }
            e.stopPropagation();
        });
        $content.find('table a').on("click", function (e) {
            e.stopPropagation();
        });

        if (Modernizr.touch && self.displayMode === TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL) {
            if ($content.find('.' + self.CLASS + '-btn-prev').css('display') !== 'none') { // Si los botones de anterior/siguiente están visibles, montamos el swipe
                if (self.resultsPanel) {
                    self.resultsPanel._$div.swipe('disable');
                }

                if (layerCount(self) > 1) {
                    $content.swipe({
                        swipeLeft: function (e) {
                            self.highlightFeature(self.getNextFeatureElement(1), 1);
                            e.stopPropagation();
                        },
                        swipeRight: function (e) {
                            self.highlightFeature(self.getNextFeatureElement(-1), -1);
                            e.stopPropagation();
                        }
                    });
                }
            }
        }
    };

    ctlProto.onShowPopup = function (e) {
        var self = this;
        var map = self.map;
        var transitionEnd = 'transitionend.tc';
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
        self._$div.find('td.' + self.CLASS + '-val').each(function (idx, elm) {
            const $td = $(elm);
            const text = $td.text();
            if (TC.Util.isURL(text)) {
                $td.html('<a href="' + text + '" target="_blank" title="' + titleText + '">' + linkText + '</a>');
            }
        });
    };

    ctlProto.highlightFeature = function (featureOrElement, delta) {
        const self = this;
        var feature;
        if (!self._zooming) {
            var $featureLi;
            var $layerLi;
            var $serviceLi;
            // this puede ser o el elemento HTML de la lista correspondiente a la feature o la feature en sí
            if (featureOrElement instanceof TC.Feature) {
                feature = featureOrElement;
                var li = self.getFeatureElement(feature);
                if (li) {
                    $featureLi = $(li);
                }
            }
            else {
                $featureLi = $(featureOrElement);
            }
            $layerLi = $featureLi.parents('li').first();
            $serviceLi = $layerLi.parents('li').first();

            const serviceIdx = $serviceLi.index();
            const layerIdx = $layerLi.index();
            const featureIdx = $featureLi.index();
            feature = feature || self.getFeature(serviceIdx, layerIdx, featureIdx);

            self.downplayFeatures({ exception: feature });
            $featureLi.addClass(TC.Consts.classes.CHECKED);
            $layerLi.addClass(TC.Consts.classes.CHECKED);
            $serviceLi.addClass(TC.Consts.classes.CHECKED);
            if (delta > 0) {
                $featureLi.addClass(TC.Consts.classes.FROMLEFT);
                $layerLi.addClass(TC.Consts.classes.FROMLEFT);
                $serviceLi.addClass(TC.Consts.classes.FROMLEFT);
            }
            else if (delta < 0) {
                $featureLi.addClass(TC.Consts.classes.FROMRIGHT);
                $layerLi.addClass(TC.Consts.classes.FROMRIGHT);
                $serviceLi.addClass(TC.Consts.classes.FROMRIGHT);
            }
            $featureLi
                .find('table')
                .attr('title', self.getLocaleString('clickToCenter'));

            self.highlightedFeature = feature;

            $(self.getDisplayTarget())
                .find('.' + self.CLASS + '-counter-current')
                .html(self.getFeatureIndex(serviceIdx, layerIdx, featureIdx) + 1);



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
                $featureLi.addClass(TC.Consts.classes.DISABLED);
            }
        }
    };

    ctlProto.downplayFeatures = function (options) {
        const self = this;
        options = options || {};
        if (self.highlightedFeature !== options.exception) {
            self.highlightedFeature = null;
        }
        const $exceptionFLi = $(options.exception ? self.getFeatureElement(options.exception) : undefined);
        const $exceptionLLi = $exceptionFLi.parents('li').first();
        const $exceptionSLi = $exceptionLLi.parents('li').first();

        self.resultsLayer.clearFeatures();
        $target = $(self.getDisplayTarget());
        $target
            .find('ul.' + self.CLASS + '-services li')
            .not($exceptionFLi)
            .not($exceptionLLi)
            .not($exceptionSLi)
            .removeClass(TC.Consts.classes.CHECKED)
            .removeClass(TC.Consts.classes.DISABLED)
            .removeClass(TC.Consts.classes.FROMLEFT)
            .removeClass(TC.Consts.classes.FROMRIGHT);
        $target
            .find('.' + self.CLASS + '-features table')
            .attr('title', self.getLocaleString('clickToShowOnMap'));
        $(self.getMenuTarget())
            .find('.' + self.CLASS + '-tools')
            .removeClass(TC.Consts.classes.ACTIVE);
    };

    ctlProto._fitSize = function () {
        const self = this;
        const $div = $(self.getDisplayTarget());
        var max = 0;
        //medir la máxima anchura de <ul>
        $div.find(".tc-ctl-finfo-features li").each(function (ix, elto) {
            var x = self;
            max = Math.max(max, $(elto).position().left + $(elto).width());
        });

        //alert("max=" + max);
        if (max) $div.css('width', max + 50);
    };

    ctlProto._resetSize = function () {
        const self = this;
        const $div = $(self.getDisplayTarget());
        $div.css('width', '');
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
        self.map.$events.trigger($.Event(TC.Consts.event.BEFOREFEATUREINFO, {
            xy: options.xy,
            control: self
        }));
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
        self._layersDeferred.then(function () {
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
        map.loaded(function () {
            $.when(map.addLayer(resultsLayer), map.addLayer(filterLayer)).then(function (rl, fl) {
                self.resultsLayer = rl;
                self.filterLayer = fl;
                self._layersDeferred.resolve();
            });
        });

        return self._layersDeferred.promise();
    };

    ctlProto._decorateDisplay = function (ctl) {
        const self = this;
        const $resultsContainer = $(self.getDisplayTarget({ control: ctl }));

        // Añadimos un zoom a la feature al pulsar en la tabla
        $resultsContainer.find('table.tc-attr').on(TC.Consts.event.CLICK, function (e) {
            self.map.zoomToFeatures([self.highlightedFeature]);
        });

        // Añadimos botón de imprimir
        TC.loadJS(
            !TC.control.Print,
            [TC.apiLocation + 'TC/control/Print'],
            function () {
                if (!$resultsContainer.find('.' + TC.control.Print.prototype.CLASS + '-btn').length) {
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
                            target: $resultsContainer,
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
                        const path = self.getFeaturePath(feature);
                        if (path) {
                            const newData = {};
                            newData[serviceAttrName] = path.service;
                            newData[layerAttrName] = path.layer.join(self.TITLE_SEPARATOR);
                            const allData = $.extend(newData, feature.getData());
                            feature.clearData();
                            feature.setData(allData);
                        }
                    });
                });
            });
        }
    };

})();

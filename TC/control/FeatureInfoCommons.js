TC.control = TC.control || {};

if (!TC.control.Click) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/Click');
}

TC.Consts.event.POPUPHIDE = TC.Consts.event.POPUPHIDE || 'popuphide.tc';
TC.Consts.event.RESULTSPANELCLOSE = TC.Consts.event.RESULTSPANELCLOSE || 'resultspanelclose.tc';

TC.control.FeatureInfoCommons = function () {
    var self = this;
    TC.control.Click.apply(self, arguments);

    self.resultsLayer = null;
    self.filterLayer = null;
    self._layersDeferred = $.Deferred();
    self.filterFeature = null;
    self.info = null;
    self.popup = null;
    self.resultsPanel = null;
    self.lastFeatureCount = null;

    self._$dialogDiv = $(TC.Util.getDiv(self.options.dialogDiv));
    if (!self.options.dialogDiv) {
        self._$dialogDiv.appendTo('body');
    }
};

TC.control.FeatureInfoCommons.displayMode = {
    POPUP: 'popup',
    RESULTS_PANEL: 'resultsPanel'
};

(function () {

    var liSelector = 'ul.tc-ctl-finfo-features li';

    var downplayFeatures = function (ctl) {
        ctl.getDisplayTarget().find('ul.' + ctl.CLASS + '-services li')
            .removeClass(TC.Consts.classes.CHECKED)
            .removeClass(TC.Consts.classes.DISABLED)
            .removeClass(TC.Consts.classes.FROMLEFT)
            .removeClass(TC.Consts.classes.FROMRIGHT);
    };

    var highlightFeature = function (ctl, delta) {
        if (!ctl._zooming) {
            var feature;
            var $featureLi;
            var $layerLi;
            var $serviceLi;
            // this puede ser o el elemento HTML de la lista correspondiente a la feature o la feature en sí
            if (this instanceof TC.Feature) {
                feature = this;
                ctl.getDisplayTarget().find(liSelector).each(function (idx, li) {
                    var $currentFeatureLi = $(li);
                    var $currentLayerLi = $currentFeatureLi.parents('li').first();
                    var $currentServiceLi = $currentLayerLi.parents('li').first();
                    var feat = ctl.getFeature(ctl.info, $currentServiceLi.index(), $currentLayerLi.index(), $currentFeatureLi.index());
                    if (feat === feature) {
                        $featureLi = $currentFeatureLi;
                        $layerLi = $currentLayerLi;
                        $serviceLi = $currentServiceLi;
                    }
                });
            }
            else {
                $featureLi = $(this);
            }
            $layerLi = $layerLi || $featureLi.parents('li').first();
            $serviceLi = $serviceLi || $layerLi.parents('li').first();

            downplayFeatures(ctl);
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
            feature = feature || ctl.getFeature(ctl.info, $serviceLi.index(), $layerLi.index(), $featureLi.index());

            
            var features = ctl.resultsLayer.features.slice();
            var featureAlreadyHighlighted = features.filter(function (item) {
                return feature && feature.id === item.id;
            });

            //Si la feature a resaltar ya está resaltada, no hacemos nada. Así evitamos parpadeo
            if (featureAlreadyHighlighted.length > 0) {
                return;
            }

            for (var i = 0; i < features.length; i++) {
                var f = features[i];
                if (f !== ctl.filterFeature) {
                    ctl.resultsLayer.removeFeature(f);
                }
            }
            if (feature && feature.geometry) {
                ctl.resultsLayer.addFeature(feature);
            }
            else {
                $featureLi.addClass(TC.Consts.classes.DISABLED);
            }
        }
    };

    var getNextLi = function (ctl, delta) {
        var $lis = ctl.getDisplayTarget().find('ul.' + ctl.CLASS + '-features > li');
        var length = $lis.length;
        var $checkedLi = $lis.filter('.' + TC.Consts.classes.CHECKED);
        var checkedIdx = $lis.index($checkedLi.get(0));
        return $lis.get((checkedIdx + delta + length) % length);
    }

    TC.inherit(TC.control.FeatureInfoCommons, TC.control.Click);

    var ctlProto = TC.control.FeatureInfoCommons.prototype;

    ctlProto.CLASS = 'tc-ctl-finfo';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/FeatureInfo.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/FeatureInfoDialog.html";
        ctlProto.template[ctlProto.CLASS + '-del-btn'] = TC.apiLocation + "TC/templates/FeatureInfoDeleteButton.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<ul class=\"tc-ctl-finfo-services\">").s(ctx.get(["services"], false), ctx, { "else": body_1, "block": body_2 }, {}).w("</ul>").x(ctx.get(["featureCount"], false), ctx, { "block": body_25 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li class=\"tc-ctl-finfo-empty\">").h("i18n", ctx, {}, { "$key": "noData" }).w("</li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<li><h3>").x(ctx.getPath(false, ["mapLayer", "title"]), ctx, { "else": body_3, "block": body_4 }, {}).w("</h3><div class=\"tc-ctl-finfo-service-content\">").s(ctx.get(["hasLimits"], false), ctx, { "else": body_5, "block": body_24 }, {}).w("</div></li>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.f(ctx.getPath(false, ["mapLayer", "id"]), ctx, "h"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.f(ctx.getPath(false, ["mapLayer", "title"]), ctx, "h"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<ul class=\"tc-ctl-finfo-layers\">").s(ctx.get(["layers"], false), ctx, { "else": body_6, "block": body_7 }, {}).w("</ul>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<li class=\"tc-ctl-finfo-empty\">").h("i18n", ctx, {}, { "$key": "noDataAtThisService" }).w("</li>"); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w("<li><h4>").s(ctx.get(["path"], false), ctx, { "block": body_8 }, {}).w(" <span class=\"tc-ctl-finfo-layer-n\">").f(ctx.getPath(false, ["features", "length"]), ctx, "h").w("</span> </h4> <div class=\"tc-ctl-finfo-layer-content\"><ul class=\"tc-ctl-finfo-features\">").s(ctx.get(["features"], false), ctx, { "else": body_10, "block": body_11 }, {}).w("</ul></div></li>"); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.f(ctx.getPath(true, []), ctx, "h").h("sep", ctx, { "block": body_9 }, {}); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.w(" &bull; "); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.w("<li class=\"tc-ctl-finfo-empty\">").h("i18n", ctx, {}, { "$key": "noDataInThisLayer" }).w("</li>"); } body_10.__dustBody = !0; function body_11(chk, ctx) { return chk.w("<li>").x(ctx.get(["rawContent"], false), ctx, { "else": body_12, "block": body_18 }, {}).w("</li>"); } body_11.__dustBody = !0; function body_12(chk, ctx) { return chk.x(ctx.get(["error"], false), ctx, { "else": body_13, "block": body_17 }, {}); } body_12.__dustBody = !0; function body_13(chk, ctx) { return chk.w("<h5>").f(ctx.get(["id"], false), ctx, "h").w("</h5><table").x(ctx.get(["geometry"], false), ctx, { "block": body_14 }, {}).w("><tbody>").s(ctx.get(["attributes"], false), ctx, { "block": body_15 }, {}).w("</tbody></table>").x(ctx.get(["geometry"], false), ctx, { "block": body_16 }, {}); } body_13.__dustBody = !0; function body_14(chk, ctx) { return chk.w(" title=\"").h("i18n", ctx, {}, { "$key": "clickToCenter" }).w("\""); } body_14.__dustBody = !0; function body_15(chk, ctx) { return chk.w("<tr><th class=\"tc-ctl-finfo-attr\">").f(ctx.get(["name"], false), ctx, "h").w("</th><td class=\"tc-ctl-finfo-val\">").f(ctx.get(["value"], false), ctx, "h").w("</td></tr>"); } body_15.__dustBody = !0; function body_16(chk, ctx) { return chk.w("<div class=\"tc-ctl-finfo-tools\"><button class=\"tc-ctl-finfo-tools-btn\" title=\"").h("i18n", ctx, {}, { "$key": "tools" }).w("\">").h("i18n", ctx, {}, { "$key": "tools" }).w("</button></div>"); } body_16.__dustBody = !0; function body_17(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-errors\">").h("i18n", ctx, {}, { "$key": "fi.error" }).w("<span class=\"tc-ctl-finfo-error-text\">").f(ctx.get(["error"], false), ctx, "h").w("</span></span>"); } body_17.__dustBody = !0; function body_18(chk, ctx) { return chk.w("<h5>").h("i18n", ctx, {}, { "$key": "feature" }).w("</h5>").h("eq", ctx, { "else": body_19, "block": body_20 }, { "key": ctx.get(["rawFormat"], false), "value": "text/html" }); } body_18.__dustBody = !0; function body_19(chk, ctx) { return chk.w("<pre>").f(ctx.get(["rawContent"], false), ctx, "h").w("</pre>"); } body_19.__dustBody = !0; function body_20(chk, ctx) { return chk.w(" ").x(ctx.get(["expandUrl"], false), ctx, { "block": body_21 }, {}); } body_20.__dustBody = !0; function body_21(chk, ctx) { return chk.h("ne", ctx, { "else": body_22, "block": body_23 }, { "key": ctx.get(["expandUrl"], false), "value": "" }); } body_21.__dustBody = !0; function body_22(chk, ctx) { return chk.w("<iframe src=\"").f(ctx.get(["rawUrl"], false), ctx, "h").w("\" />"); } body_22.__dustBody = !0; function body_23(chk, ctx) { return chk.w("<div class=\"tc-ctl-finfo-features-iframe-cnt\"><iframe src=\"").f(ctx.get(["rawUrl"], false), ctx, "h").w("\" /><a class=\"tc-ctl-finfo-open\" onclick=\"window.open('").f(ctx.get(["expandUrl"], false), ctx, "h").w("', '_blank')\" title=\"").h("i18n", ctx, {}, { "$key": "expand" }).w("\"></a></div>"); } body_23.__dustBody = !0; function body_24(chk, ctx) { return chk.w("<span class=\"tc-ctl-finfo-errors\">").f(ctx.get(["hasLimits"], false), ctx, "h").w("</span>"); } body_24.__dustBody = !0; function body_25(chk, ctx) { return chk.h("gt", ctx, { "block": body_26 }, { "key": ctx.get(["featureCount"], false), "value": "1", "type": "number" }); } body_25.__dustBody = !0; function body_26(chk, ctx) { return chk.w("<a class=\"tc-ctl-btn tc-ctl-finfo-btn-prev\">").h("i18n", ctx, {}, { "$key": "previous" }).w("</a><div class=\"tc-ctl-finfo-counter\"><span class=\"tc-ctl-finfo-idx\"></span>/").f(ctx.get(["featureCount"], false), ctx, "h").w("</div><a class=\"tc-ctl-btn tc-ctl-finfo-btn-next\">").h("i18n", ctx, {}, { "$key": "next" }).w("</a>"); } body_26.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-finfo-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "feature" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><div class=\"tc-ctl-finfo-dialog-dl\"><h2>").h("i18n", ctx, {}, { "$key": "download" }).w("</h2><div><button class=\"tc-button tc-ctl-finfo-dl-btn-kml\" data-format=\"KML\" title=\"KML\">KML</button><button class=\"tc-button tc-ctl-finfo-dl-btn-gml\" data-format=\"GML\" title=\"GML\">GML</button><button class=\"tc-button tc-ctl-finfo-dl-btn-geojson\" data-format=\"GeoJSON\" title=\"GeoJSON\">GeoJSON</button><button class=\"tc-button tc-ctl-finfo-dl-btn-wkt\" data-format=\"WKT\" title=\"WKT\">WKT</button></div></div><div class=\"tc-ctl-finfo-dialog-share\"></div></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-del-btn'] = function () { dust.register(ctlProto.CLASS + '-del-btn', body_0); function body_0(chk, ctx) { return chk.w("<button class=\"tc-ctl-finfo-del-btn\" title=\"").h("i18n", ctx, {}, { "$key": "deleteFeature" }).w("\">").h("i18n", ctx, {}, { "$key": "deleteFeature" }).w("</button>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.control.Click.prototype.register.call(self, map);

        var resultsLayer;
        if (self.options.resultsLayer) { // En caso de que se haya indicado una capa por configuración, la utilizamos
            resultsLayer = self.options.resultsLayer;
        } else {
            resultsLayer = {
                id: TC.getUID(),
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
                id: TC.getUID(),
                title: self.CLASS + ': Filter layer',
                stealth: true,
                type: TC.Consts.layerType.VECTOR
                , styles: {
                    line: { strokeColor: self.lineColor, strokeWidth: 2 },
                    polygon: { strokeColor: self.lineColor, strokeWidth: 2, fillColor: "#000", fillOpacity: 0.3 }
                }
            };
        }

        map.loaded(function () {
            $.when(map.addLayer(resultsLayer), map.addLayer(filterLayer)).then(function (rl, fl) {
                self.resultsLayer = rl;
                self.filterLayer = fl;
                self._layersDeferred.resolve();
            });
        });

        self.displayMode = self.options.displayMode || TC.control.FeatureInfoCommons.displayMode.POPUP;
        self.setDisplayMode(self.displayMode);

        map
            .on(TC.Consts.event.BEFOREFEATUREINFO, function (e) {
                self.querying = true;
                self.beforeGetFeatureInfo(e);
            })
            .on(TC.Consts.event.FEATUREINFO, function (e) {
                self.querying = false;
                if (self.isActive) {
                    self.lastFeatureCount = self.countFeatures(e);
                    self.responseCallback(e);
                }
            })
            .on(TC.Consts.event.NOFEATUREINFO, function (e) {
                self.querying = false;
                self.lastFeatureCount = 0;
                self.closeResults();
            })
            .on(TC.Consts.event.POPUPHIDE + ' ' + TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                if (e.control === self.getDisplayControl() && self.resultsLayer) {
                    self.resultsLayer.clearFeatures();
                    clearTimeout(self._removeFilterFeatureTimeout);
                    self._removeFilterFeatureTimeout = setTimeout(function () {
                        if (!self.querying) {
                            self.filterLayer.clearFeatures();
                        }
                    }, 50);
                }
            });
    };

    ctlProto.render = function (callback) {
        var self = this;
        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv
                .html(html)
                .on(TC.Consts.event.CLICK, 'button[data-format]', function (e) {
                    TC.Util.closeModal();
                    var feature = self.resultsLayer.features[self.resultsLayer.features.length - 1];
                    self.map.exportFeatures([feature], {
                        fileName: feature.id,
                        format: $(e.target).data('format')
                    });
                });

        });
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
                    var rp = map.getControlsByClass('TC.control.ResultsPanel')[0];
                    if (rp) {
                        self.resultsPanel = rp;
                    }
                    else {
                        var setResultsPanel = function setResultsPanel(e) {
                            if (TC.control.ResultsPanel && e.control instanceof TC.control.ResultsPanel) {
                                self.resultsPanel = e.control;
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
                            self.onShowPopUp(e);
                        });

                        map.on(TC.Consts.event.POPUPHIDE, function (e) {
                            if (e.control === popup) {
                                //restaurar el ancho automático
                                self.popup.$popupDiv.css("width", "auto");
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

    ctlProto.getDisplayTarget = function () {
        var self = this;
        switch (self.displayMode) {
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
                return self.resultsPanel.$divTable;
            default:
                return self.popup.$popupDiv;
        }
    };

    ctlProto.displayResults = function () {
        var self = this;
        self.filterFeature.data = $('<div>').append(self._$div.clone()).html();
        switch (self.displayMode) {
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
                self.getDisplayTarget().html(self.filterFeature.data);
                self.resultsPanel.open();
                self.displayResultsCallback();
                break;
            default:
                if (self.popup) {
                    self.filterFeature.showPopup(self.popup);
                }
                break;
        }
    };

    ctlProto.closeResults = function () {
        var self = this;
        switch (self.displayMode) {
            case TC.control.FeatureInfoCommons.displayMode.RESULTS_PANEL:
                if (self.resultsPanel) {
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
        var $target = self.getDisplayTarget();

        // Añadimos eventos si no están añadidos de antes
        var handlerKey = 'ficHandlers';
        var hasHandlers = $target.data(handlerKey);
        if (!hasHandlers) {
            var selector;
            // Evento para resaltar una feature
            var events = 'click'; // En iPad se usa click en vez de touchstart para evitar que se resalte una feature al hacer scroll
            $target.on(events, liSelector, function (e) {
                highlightFeature.call(this, self.map.activeControl);
            });

            events = 'mouseenter';
            var mouseoverTimeout;
            $target.on(events, liSelector, function (e) {
                var that = this;
                if ($(that).parents('.' + self.CLASS + '-layers > li').hasClass(TC.Consts.classes.CHECKED)) {
                    highlightFeature.call(that, self.map.activeControl);
                }
            });

            // Evento para ir a la siguiente feature
            events = TC.Consts.event.CLICK;
            selector = '.' + self.CLASS + '-btn-next';
            $target.on(events, selector, function (e) {
                highlightFeature.call(getNextLi(self.map.activeControl, 1), self.map.activeControl, 1);
                return false;
            });

            // Evento para ir a la feature anterior
            selector = '.' + self.CLASS + '-btn-prev';
            $target.on(events, selector, function (e) {
                highlightFeature.call(getNextLi(self.map.activeControl, -1), self.map.activeControl, -1);
                return false;
            });

            // Evento para desplegar/replegar features de capa
            selector = 'ul.' + self.CLASS + '-layers h4';
            $target.on(events, selector, function (e) {
                var $li = $(e.target).parent();
                if ($li.hasClass(TC.Consts.classes.CHECKED)) {
                    // Si no está en modo móvil ocultamos la capa
                    if ($target.find('.tc-ctl-finfo-btn-next').css('display') === 'none') {
                        downplayFeatures(self.map.activeControl);
                    }
                }
                else {
                    highlightFeature.call($li.find(liSelector).first()[0], self.map.activeControl);
                    if (self.displayMode === TC.control.FeatureInfoCommons.displayMode.POPUP) {
                        self.popup.fitToView(true);
                    }
                }
            });

            // Evento para activar botones de herramientas
            selector = '.' + self.CLASS + '-tools-btn';
            $target.on(events, selector, function (e) {
                var done = new $.Deferred();

                if (!self.map.activeControl._shareCtl) {
                    self.map.addControl('share', {
                        div: self.map.activeControl._$dialogDiv.find('.tc-modal-body .tc-ctl-finfo-dialog-share')
                    }).then(function (ctl) {
                        self.map.activeControl._shareCtl = ctl;
                        done.resolve();
                    });
                } else {
                    done.resolve();
                }

                $.when(done).then(function () {
                    TC.Util.showModal(self.map.activeControl._$dialogDiv.find('.' + self.map.activeControl.CLASS + '-dialog'), {
                        openCallback: function () {
                            self.map.activeControl.onShowModal();
                        }
                    });
                });
            });

            $target.data(handlerKey, true);
        }

        if (self.info) {
            if (self.info.defaultFeature) {
                highlightFeature.call(self.info.defaultFeature, self);
            }
            else {
                highlightFeature.call($target.find(liSelector).first()[0], self);
            }
        }

        $target.find('table').on("click", function (e) {
            if ($(this).parent().hasClass(TC.Consts.classes.DISABLED))
                return;
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
            e.stopPropagation();
        });
        $target.find('table a').on("click", function (e) {
            e.stopPropagation();
        });
    };

    ctlProto.onShowPopUp = function (e) {
        var self = this;
        var map = self.map;
        var transitionEnd = 'transitionend.tc';
        if (e.control === self.popup) {

            self.displayResultsCallback();

            //ajustar el ancho para que no sobre a la derecha
            self.fitSize();
        }
    };

    ctlProto.onShowModal = function () {

    };

    ctlProto.highlightFeature = function (feature) {
        highlightFeature.call(feature, this);
    };

    ctlProto.fitSize = function () {
        var self = this;
        var $div = self.getDisplayTarget();
        var max = 0;
        //medir la máxima anchura de <ul>
        $div.find(".tc-ctl-finfo-features li").each(function (ix, elto) {
            var x = self;
            max = Math.max(max, $(elto).position().left + $(elto).width());
        });

        //alert("max=" + max);
        if (max) $div.width(max + 50);
    };

    ctlProto.countFeatures = function (e) {
        var sum = 0;
        for (var i = 0; i < e.services.length; i++) {
            e.services[i].layers.forEach(function (ly) { sum += ly.features.length; });
        }
        return sum;
    };

    ctlProto.getFeature = function (info, serviceIdx, layerIdx, featureIdx) {
        var result;
        if (info) {
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

    ctlProto.getFeatureIdx = function (info, serviceIdx, layerIdx, featureIdx) {
        var result = -1;
        if (info) {
            for (var i = 0; i < serviceIdx; i++) {
                var service = info.services[i];
                var maxj = i === serviceIdx - 1 ? layerIdx : service.layers.length;
                for (var j = 0; j < maxj; j++) {
                    var layer = service.layers[j];
                    var maxk = j === layerIdx - 1 ? featureIdx : layer.features.length;
                    for (var k = 0; k < maxk; k++) {
                        result = result + 1;
                    }
                }
            }
        }
        return result;
    };

    ctlProto.beforeGetFeatureInfo = function (e) {
        var self = this;
        self.closeResults();
        if (e.control === self && self.map && self.resultsLayer) {
            self.lastFeatureCount = null;

            self.resultsLayer.clearFeatures();
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

})();

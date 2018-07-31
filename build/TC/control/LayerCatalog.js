TC.control = TC.control || {};

if (!TC.control.ProjectionSelector) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/ProjectionSelector');
}

(function () {

    TC.control.LayerCatalog = function () {
        var self = this;

        self.layers = [];
        self.searchInit = false;

        TC.control.ProjectionSelector.apply(self, arguments);

        self._selectors = {
            LAYER_ROOT: 'div.' + self.CLASS + '-tree > ul.' + self.CLASS + '-branch > li.' + self.CLASS + '-node'
        };

        self._readyDeferred = $.Deferred();

        if (!TC.Consts.classes.SELECTABLE) {
            TC.Consts.classes.SELECTABLE = 'tc-selectable';
        }
        if (!TC.Consts.classes.INCOMPATIBLE) {
            TC.Consts.classes.INCOMPATIBLE = 'tc-incompatible';
        }
        if (!TC.Consts.classes.ACTIVE) {
            TC.Consts.classes.ACTIVE = 'tc-active';
        }

        self._$div.on('mouseup.tc', 'li', function (e) {
            var $li = $(e.target);
            if (!$li.hasClass(self.CLASS + '-leaf')) {
                $li.toggleClass(TC.Consts.classes.COLLAPSED);
                $li.find('ul').first().toggleClass(TC.Consts.classes.COLLAPSED);
                e.stopPropagation();
            }
        });
    };

    TC.inherit(TC.control.LayerCatalog, TC.control.ProjectionSelector);

    var ctlProto = TC.control.LayerCatalog.prototype;

    ctlProto.CLASS = 'tc-ctl-lcat';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/LayerCatalog.html";
        ctlProto.template[ctlProto.CLASS + '-branch'] = TC.apiLocation + "TC/templates/LayerCatalogBranch.html";
        ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/LayerCatalogNode.html";
        ctlProto.template[ctlProto.CLASS + '-info'] = TC.apiLocation + "TC/templates/LayerCatalogInfo.html";
        ctlProto.template[ctlProto.CLASS + '-results'] = TC.apiLocation + "TC/templates/LayerCatalogResults.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/LayerCatalogDialog.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "availableLayers" }).x(ctx.get(["enableSearch"], false), ctx, { "block": body_1 }, {}).w("</h2><div class=\"tc-ctl-lcat-search tc-hidden tc-collapsed\"><div class=\"tc-group\"><input type=\"search\" class=\"tc-ctl-lcat-input tc-textbox\" placeholder=\"").h("i18n", ctx, {}, { "$key": "textToSearchInLayers" }).w("\" /></div><ul></ul></div><div class=\"tc-ctl-lcat-tree\">").x(ctx.get(["layerTrees"], false), ctx, { "else": body_3, "block": body_4 }, {}).w("</div><div class=\"tc-ctl-lcat-info tc-hidden\">").p("tc-ctl-lcat-info", ctx, ctx.rebase(ctx.getPath(true, [])), {}).w("</div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.x(ctx.get(["layerTrees"], false), ctx, { "block": body_2 }, {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<button class=\"tc-ctl-lcat-btn-search\" title=\"").h("i18n", ctx, {}, { "$key": "searchLayersbytext" }).w("\"></button>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<div class=\"tc-ctl tc-ctl-lcat-loading\"><span>").h("i18n", ctx, {}, { "$key": "loadingLayerTree" }).w("...</span></div>"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("<ul class=\"tc-ctl-lcat-branch\">").s(ctx.get(["layerTrees"], false), ctx, { "block": body_5 }, {}).w("</ul>"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.p("tc-ctl-lcat-branch", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_5.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-branch'] = function () { dust.register(ctlProto.CLASS + '-branch', body_0); function body_0(chk, ctx) { return chk.w("<li ").x(ctx.get(["children"], false), ctx, { "else": body_1, "block": body_2 }, {}).w(" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><span>").f(ctx.get(["title"], false), ctx, "h").w("</span><ul class=\"tc-ctl-lcat-branch tc-collapsed\">").s(ctx.get(["children"], false), ctx, { "block": body_3 }, {}).w("</ul></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("class=\"tc-ctl-lcat-node tc-ctl-lcat-leaf\""); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("class=\"tc-ctl-lcat-node tc-collapsed\""); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.p("tc-ctl-lcat-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_3.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.x(ctx.get(["isVisible"], false), ctx, { "block": body_1 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li ").x(ctx.get(["children"], false), ctx, { "else": body_2, "block": body_3 }, {}).w(" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><span data-tooltip=\"").x(ctx.get(["name"], false), ctx, { "block": body_4 }, {}).w("\">").f(ctx.get(["title"], false), ctx, "h").w("</span>").x(ctx.get(["name"], false), ctx, { "block": body_5 }, {}).w("<ul class=\"tc-ctl-lcat-branch tc-collapsed\">").s(ctx.get(["children"], false), ctx, { "block": body_6 }, {}).w("</ul></li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("class=\"tc-ctl-lcat-node tc-ctl-lcat-leaf\""); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("class=\"tc-ctl-lcat-node tc-collapsed\""); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "clickToAddToMap" }); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<button class=\"tc-ctl-lcat-btn-info\"/>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.p("tc-ctl-lcat-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_6.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-info'] = function () { dust.register(ctlProto.CLASS + '-info', body_0); function body_0(chk, ctx) { return chk.w("<a class=\"tc-ctl-lcat-info-close\"></a><h2>").h("i18n", ctx, {}, { "$key": "layerInfo" }).w("</h2><h3 class=\"tc-ctl-lcat-title\">").f(ctx.get(["title"], false), ctx, "h").w("</h3>").x(ctx.get(["abstract"], false), ctx, { "block": body_1 }, {}).x(ctx.get(["metadata"], false), ctx, { "block": body_2 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<div class=\"tc-ctl-lcat-abstract\"><h4>").h("i18n", ctx, {}, { "$key": "abstract" }).w("</h4><div>").f(ctx.get(["abstract"], false), ctx, "h").w("</div></div>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<div class=\"tc-ctl-lcat-metadata\"><h4>").h("i18n", ctx, {}, { "$key": "metadata" }).w("</h4><ul>").s(ctx.get(["metadata"], false), ctx, { "block": body_3 }, {}).w("</ul></div>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<li><a href=\"").f(ctx.get(["url"], false), ctx, "h", ["s"]).w("\" type=\"").f(ctx.get(["format"], false), ctx, "h").w("\" title=\"").f(ctx.get(["formatDescription"], false), ctx, "h").w("\" target=\"_blank\">").f(ctx.get(["formatDescription"], false), ctx, "h").w("</a></li>"); } body_3.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-results'] = function () { dust.register(ctlProto.CLASS + '-results', body_0); function body_0(chk, ctx) { return chk.s(ctx.get(["servicesFound"], false), ctx, { "else": body_1, "block": body_2 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li class=\"tc-ctl-lcat-no-results\"><h5>").h("i18n", ctx, {}, { "$key": "noMatches" }).w("</h5></li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.h("gt", ctx, { "block": body_3 }, { "key": ctx.get(["servicesLooked"], false), "value": 1 }).s(ctx.get(["founds"], false), ctx, { "block": body_5 }, {}).h("gt", ctx, { "block": body_8 }, { "key": ctx.get(["servicesLooked"], false), "value": 1 }); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<li class=\"tc-ctl-lcat-search-group ").x(ctx.getPath(false, ["service", "isCollapsed"]), ctx, { "block": body_4 }, {}).w("\" data-tc-service-index=\"").f(ctx.getPath(false, ["service", "index"]), ctx, "h").w("\"><h5>").f(ctx.getPath(false, ["service", "title"]), ctx, "h").w("</h5><ul>"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("tc-collapsed"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<li data-tc-layer-name=\"").f(ctx.get(["Name"], false), ctx, "h").w("\" ").x(ctx.get(["alreadyAdded"], false), ctx, { "else": body_6, "block": body_7 }, {}).w("><h5 class=\"tc-selectable\">").f(ctx.get(["Title"], false), ctx, "h").w("</h5><button class=\"tc-ctl-lcat-search-btn-info\" /></li>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w(" data-tooltip=\"").h("i18n", ctx, {}, { "$key": "clickToAddToMap" }).w("\" "); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w(" data-tooltip=\"").h("i18n", ctx, {}, { "$key": "layerAlreadyAdded" }).w("\" class=\"tc-checked\" "); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("</ul></li>"); } body_8.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-lcat-crs-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "changeCRS" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p>").h("i18n", ctx, {}, { "$key": "wmsLayerNotCompatible.instructions|h" }).w("</p><ul class=\"tc-ctl-lcat-crs-list tc-crs-list\"></ul></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }



    var _dataKeys = {
        LAYER: 'tcLayer',
        LAYERNAME: 'tcLayerName',
        LAYERINFO: 'tcLayerInfo',
        SERVICEINDEX: 'tcServiceIndex',
        PROJCODE: 'tcProjCode'
    };

    const showProjectionChangeDialog = function (ctl, layer) {
        ctl.showProjectionChangeDialog({
            layer: layer,
            closeCallback: function () {
                $(ctl.getLayerNodes(layer))
                    .removeClass(TC.Consts.classes.LOADING)
                    .find('span')
                    .attr(TOOLTIP_DATA_ATTR, ctl.getLocaleString('clickToAddToMap'));
            }
        });
    };

    var SEARCH_MIN_LENGTH = 3;

    var TOOLTIP_DATA_ATTR = 'data-tooltip';

    ctlProto.register = function (map) {
        var self = this;

        TC.control.ProjectionSelector.prototype.register.call(self, map);

        var load = function () {
            if ($.isArray(self.options.layers)) {
                for (var i = 0; i < self.options.layers.length; i++) {
                    var layer = self.options.layers[i];
                    if (!layer.type || layer.type === TC.Consts.layerType.WMS) {
                        if (!layer.id) {
                            layer.id = TC.getUID();
                        }
                        if ($.isPlainObject(layer)) {
                            layer = new TC.layer.Raster(layer);
                        }
                        self.layers.push(layer);
                    }
                }
                self.render(function () {
                    self._readyDeferred.resolve();
                });
            }
            else {
                self._readyDeferred.resolve();
            }
        };

        var waitLoad = function (e) {
            if (e.layer === map.baseLayer) {
                load();
                map.off(TC.Consts.event.LAYERUPDATE, waitLoad);
            }
        };

        map.loaded(function () {
            if (!map.baseLayer.state || map.baseLayer.state === TC.Layer.state.IDLE) {
                load();
            }
            else {
                map.on(TC.Consts.event.LAYERUPDATE, waitLoad);
            }
        });

        var $findResultNodes = function (layer) {
            var $result = $();
            if (!layer.isBase) {
                var url = layer.options.url;
                if (self.$list) {
                    self.$list.find("li").each(function (idx, elm) {
                        var $li = $(elm);
                        var lyr = $li.data(_dataKeys.LAYER);
                        if (lyr && lyr.type === layer.type && lyr.options.url === url) {
                            for (var i = 0; i < layer.names.length; i++) {
                                if ($li.is('li[data-tc-layer-name="' + layer.names[i] + '"]'))
                                    $result = $result.add($li);
                            }
                        }
                    });
                }
            }
            return $result;
        };

        var _refreshResultList = function () {
            if ("createEvent" in document) {
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent("keyup", false, true);
                if (self.$text) {
                    self.$text[0].dispatchEvent(evt);
                }
            }
            else {
                if (self.$text) {
                    self.$text[0].fireEvent("keyup");
                }
            }
        };

        /**
         * Marca todas las capas del TOC como añadidas excepto la que se está borrando que se recibe como parámetro.
         */
        var _markWorkLayersAsAdded = function (layerRemoved) {
            var wlCtrl = self.map.getControlsByClass(TC.control.WorkLayers)[0];
            if (wlCtrl) {
                var layers = wlCtrl.layers;

                for (var i = 0; i < layers.length; i++) {
                    var layer = layers[i];

                    if (layer !== layerRemoved) {
                        $(self.getLayerNodes(layer)).addClass(TC.Consts.classes.CHECKED).find('span').attr(TOOLTIP_DATA_ATTR, layerAddedText);
                    }
                }
            }
        };

        var layerAddedText = self.getLocaleString('layerAlreadyAdded');
        var clickToAddText = self.getLocaleString('clickToAddToMap');

        map.on(TC.Consts.event.BEFORELAYERADD + ' ' + TC.Consts.event.BEFOREUPDATEPARAMS, function (e) {
            const $layerNodes = $(self.getLayerNodes(e.layer));
            if (!$layerNodes.hasClass(TC.Consts.classes.LOADING)) {
                $layerNodes.addClass(TC.Consts.classes.LOADING).find('span').removeAttr(TOOLTIP_DATA_ATTR);
            }
        }).on(TC.Consts.event.LAYERADD + ' ' + TC.Consts.event.UPDATEPARAMS, function (e) {
            var layer = e.layer;
            if (!layer.isBase && layer.type === TC.Consts.layerType.WMS) {
                self._readyDeferred.then(function () { // Esperamos a que cargue primero las capas de la configuración
                    var $layerNode = $(self.getLayerRootNode(layer));
                    var updateControl = function () {
                        $(self.getLayerNodes(layer)).removeClass(TC.Consts.classes.LOADING).addClass(TC.Consts.classes.CHECKED).find('span').attr(TOOLTIP_DATA_ATTR, layerAddedText);
                        _refreshResultList();
                    };
                    if ($layerNode.length) {
                        updateControl();
                    }
                    else {
                        // la capa no está renderizada, pero podría estar en proceso, comprobamos que no está en la lista de capas del control
                        var layerAlreadyAdded = false;
                        for (var i = 0, len = self.layers.length; i < len; i++) {
                            var lyr = self.layers[i];
                            if (lyr.type === layer.type && lyr.options.url === layer.options.url) {
                                layerAlreadyAdded = true;
                                break;
                            }
                        }
                        if (!layerAlreadyAdded) {
                            self.addLayer(new TC.layer.Raster({
                                url: layer.options.url,
                                type: layer.type,
                                layerNames: [],
                                title: layer.title || layer.wrap.getServiceTitle(),
                                hideTitle: true,
                                hideTree: false
                            })).then(function () {
                                $layerNode = $(self.getLayerRootNode(layer));
                                updateControl();
                            });
                        }
                    }
                });
            }
        }).on(TC.Consts.event.LAYERERROR, function (e) {
            if (e.reason) {
                TC.alert(self.getLocaleString(e.reason, { url: e.layer.url }));
            }
            $(self.getLayerNodes(e.layer)).removeClass(TC.Consts.classes.LOADING);
        }).on(TC.Consts.event.LAYERREMOVE, function (e) {
            $(self.getLayerNodes(e.layer)).removeClass(TC.Consts.classes.CHECKED).find('span').attr(TOOLTIP_DATA_ATTR, clickToAddText);
            $findResultNodes(e.layer).removeClass(TC.Consts.classes.CHECKED).attr(TOOLTIP_DATA_ATTR, clickToAddText);

            //Marcamos como añadidas aquellas capas que estén en el control de capas cargadas. Esto previene que si borramos una capa padre, todas
            //sus hijas aparezcan como no añadidas, a pesar que que alguna de ellas haya sido añadida previamente de manera individual
            _markWorkLayersAsAdded(e.layer);

            //refresh del searchList            
            _refreshResultList();
        }).on(TC.Consts.event.EXTERNALSERVICEADDED, function (e) {
            if (e && e.layer) {
                self.addLayer(e.layer);
                self._$div.removeClass("tc-collapsed");
            }
        }).on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
            self.update();
        });

        self._$div.on(TC.Consts.event.CLICK, 'span', function (e) {
            var $span = $(e.target);
            var $li = $span.parent();
            if (!$li.hasClass(TC.Consts.classes.LOADING) && !$li.hasClass(TC.Consts.classes.CHECKED)) {
                e.preventDefault;

                var layerName = $li.data(_dataKeys.LAYERNAME);
                layerName = (layerName !== undefined) ? layerName.toString() : '';
                var layer = self._$roots.has($li).data(_dataKeys.LAYER);
                if (!layer) {
                    layer = $li.data(_dataKeys.LAYER);
                }
                if (layer && layerName) {
                    var redrawTime = 1;

                    if (/iPad/i.test(navigator.userAgent))
                        redrawTime = 10;
                    else if (TC.Util.detectFirefox())
                        redrawTime = 250;

                    if (!layer.title) {
                        layer.title = layer.getTree().title;
                    }

                    $li.addClass(TC.Consts.classes.LOADING).find('span').attr(TOOLTIP_DATA_ATTR, '');

                    var reDraw = function ($element) {
                        var deferred = new $.Deferred();
                        setTimeout(function () {
                            $element[0].offsetHeight = $element[0].offsetHeight;
                            $element[0].offsetWidth = $element[0].offsetWidth;

                            deferred.resolve();
                        }, redrawTime);
                        return deferred.promise();
                    };

                    reDraw($li).then(function () {
                        self.addLayerToMap(layer, layerName);
                        e.stopPropagation();
                    });
                }
            }
        });
    };

    ctlProto.render = function (callback) {
        var self = this;

        var deferreds = $.map(self.layers, function (layer) {
            return layer.wrap.getLayer();
        });

        $.when.apply(self, deferreds).then(function () {

            var layerTrees = $.map(self.layers, function (layer) {
                var result = layer.getTree();
                var makeNodeVisible = function makeNodeVisible(node) {
                    var result = false;
                    var childrenVisible = false;
                    for (var i = 0; i < node.children.length; i++) {
                        if (makeNodeVisible(node.children[i])) {
                            childrenVisible = true;
                        }
                    }
                    if (node.hasOwnProperty('isVisible')) {
                        node.isVisible = (!layer.names || !layer.names.length) || childrenVisible || node.isVisible;
                    }
                    return node.isVisible;
                };
                makeNodeVisible(result);
                return result;
            });

            self.renderData({ layerTrees: layerTrees, enableSearch: self.options.enableSearch }, function () {

                var addedLayerText = self.getLocaleString('layerAlreadyAdded');

                self._$roots = self._$div.find(self._selectors.LAYER_ROOT);
                self._$roots.each(function (idx, elm) {
                    var layer = self.layers[idx];
                    var $root = $(elm).data(_dataKeys.LAYER, layer);

                    var $as = $root.find('.' + self.CLASS + '-btn-info');
                    var formatDescriptions = {};
                    $as.each(function (i, e) {
                        var $a = $(e);
                        var $span = $a.parent().find('span').first();
                        var name = $a.parent().data(_dataKeys.LAYERNAME).toString();
                        if (name) {
                            $span.addClass(TC.Consts.classes.SELECTABLE);
                            var info = layer.wrap.getInfo(name);
                            if (!info.hasOwnProperty('abstract') && !info.hasOwnProperty('legend') && !info.hasOwnProperty('metadata')) {
                                $a.remove();
                            }
                            else {
                                if (info.metadata) {
                                    for (var j = 0, len = info.metadata.length; j < len; j++) {
                                        var md = info.metadata[j];
                                        md.formatDescription = formatDescriptions[md.format] =
                                            formatDescriptions[md.format] ||
                                            self.getLocaleString(TC.Util.getSimpleMimeType(md.format)) ||
                                            self.getLocaleString('viewMetadata');
                                    }
                                }
                                $a.data(_dataKeys.LAYERINFO, info);
                                $a.on(TC.Consts.event.CLICK, function () {
                                    if (!$(this).hasClass(TC.Consts.classes.CHECKED)) {
                                        self.showLayerInfo(layer, name);
                                        $(this).addClass(TC.Consts.classes.CHECKED);

                                    } else {
                                        $(this).removeClass(TC.Consts.classes.CHECKED);
                                        self.hideLayerInfo();
                                    }
                                });
                            }
                            if (layer.compatibleLayers && layer.compatibleLayers.indexOf(name) < 0) {
                                $span
                                    .addClass(TC.Consts.classes.INCOMPATIBLE)
                                    .attr('title', self.getLocaleString('reprojectionNeeded'));
                                //console.log("capa " + name + " incompatible");
                            }
                            if (self.map) {
                                for (var j = 0, len = self.map.workLayers.length; j < len; j++) {
                                    var wl = self.map.workLayers[j];
                                    if (wl.type === TC.Consts.layerType.WMS && wl.url === layer.url && wl.names.length === 1 && wl.names[0] === name) {
                                        $span.parent().addClass(TC.Consts.classes.CHECKED);
                                        $span.attr(TOOLTIP_DATA_ATTR, addedLayerText);
                                    }
                                }
                            }
                        }
                        else {
                            $span.attr(TOOLTIP_DATA_ATTR, '');
                            $a.remove();
                        }
                    });
                });

                self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
                    self._$dialogDiv.html(html);
                });

                self.$text = self._$div.find("." + self.CLASS + "-input");
                self.$list = self._$div.find("." + self.CLASS + "-search ul");
                // Clear results list when x button is pressed in the search input
                self.$text.on('mouseup', function (e) {
                    var oldValue = self.$text.val();

                    if (oldValue === '') {
                        return;
                    }

                    // When this event is fired after clicking on the clear button
                    // the value is not cleared yet. We have to wait for it.
                    setTimeout(function () {
                        var newValue = self.$text.val();

                        if (newValue === '') {
                            self.$list.empty();
                        }
                    }, 1);
                });

                var layerCheckedList = [];
                //Definir el autocomplete del buscador de capas por texto
                TC._search = TC._search || {};
                TC._search.retryTimeout = null;

                TC.loadJS(
                    !self.$text.autocomplete,
                    [TC.apiLocation + 'lib/jQuery/autocomplete.js'],
                    function () {
                        self.$text.autocomplete({
                            link: '#',
                            target: self.$list,
                            minLength: 0,
                            source: function (text, callback) {
                                //lista de capas marcadas
                                layerCheckedList = [];
                                self._$roots.find("li." + TC.Consts.classes.CHECKED).each(function (i, item) {
                                    layerCheckedList.push($(item).data(_dataKeys.LAYERNAME).toString());
                                });

                                //con texto vacío, limpiar  y ocultar la lista de resultados
                                text = text.trim();
                                if (text.length < SEARCH_MIN_LENGTH) {
                                    self.$list.html("");
                                }
                                else if (text.length >= SEARCH_MIN_LENGTH) {
                                    if (TC._search.retryTimeout)
                                        clearTimeout(TC._search.retryTimeout);
                                    TC._search.retryTimeout = setTimeout(function () {
                                        var results = [];
                                        for (var index = 0; index < self.layers.length; index++) {
                                            var _founds = self.layers[index].searchSubLayers(text);
                                            if (_founds.length) {
                                                results.push({
                                                    service: {
                                                        index: index,
                                                        title: self.layers[index].title || self.layers[index].id
                                                    },
                                                    founds: _founds
                                                });
                                            }
                                        }
                                        callback({ servicesFound: results, servicesLooked: self.layers.length });
                                    }, TC._search.interval);
                                }
                            },
                            callback: function (e) {
                                self.$text.val(e.target.text || e.target.innerText);
                                TC._search.lastPattern = self.$text.val();
                                self.goToResult(unescape(e.target.hash).substring(1));
                                self.$text.autocomplete('clear');
                            },
                            buildHTML: function (data) {
                                //si hay resultados, mostramos la lista
                                if (data.results && data.results.servicesFound.length > 0) {
                                    var workLayers = self.map.getLayerTree().workLayers;
                                    for (var k = 0; k < data.results.servicesFound.length; k++) {
                                        var founds = data.results.servicesFound[k].founds;
                                        for (var j = 0; j < founds.length; j++) {
                                            delete founds[j].alreadyAdded;
                                            for (var i = 0; i < workLayers.length; i++) {
                                                //if (workLayers[i].title == data.results[j].Title ) {
                                                if (layerCheckedList.indexOf(founds[j].Name) >= 0) {
                                                    founds[j].alreadyAdded = true;
                                                    break;
                                                }
                                            }
                                            //Si la capa no tiene Name, no se puede añadir al TOC
                                            if (!founds[j].Name) {
                                                founds.splice(j, 1);
                                                j--;
                                            }
                                        }
                                        if (!data.results.servicesFound[k].founds.length) {
                                            data.results.servicesFound.splice(k, 1);
                                            continue;
                                        }
                                        //si estaba collapsado mantenemos el estado
                                        data.results.servicesFound[k].service.isCollapsed = $(self._$div.find(".tc-ctl-lcat-search-group")[k]).hasClass(TC.Consts.classes.COLLAPSED);
                                    }
                                }
                                var ret = "";
                                dust.render(self.CLASS + '-results', data.results, function (err, out) {
                                    ret = out;
                                });
                                return ret;
                            }
                        });
                    });


                if (!self.searchInit) {
                    //botón de la lupa para alternar entre búsqueda y árbol
                    self._$div.on("click", "h2 button", function () {
                        var wasCollapsed = self._$div.hasClass("tc-collapsed");
                        self._$div.removeClass("tc-collapsed");

                        var searchPane = self._$div.find("." + self.CLASS + "-search");
                        var treePane = self._$div.find("." + self.CLASS + "-tree");
                        var infoPane = self._$div.find("." + self.CLASS + "-info");

                        if (searchPane.hasClass(TC.Consts.classes.HIDDEN) || wasCollapsed) {
                            searchPane.removeClass(TC.Consts.classes.HIDDEN);
                            treePane.addClass(TC.Consts.classes.HIDDEN);
                            self.$text[0].focus();
                            $(this).addClass(self.CLASS + "-btn-tree");
                            $(this).attr("title", self.getLocaleString('viewAvailableLayersTree'));
                            $(this).removeClass(self.CLASS + "-btn-search");

                            //Si no hay resultados resaltados en el buscador, ocultamos el panel de info
                            var selectedCount = $('.tc-ctl-lcat-search li button.tc-checked').length;
                            if (selectedCount === 0) {
                                infoPane.addClass(TC.Consts.classes.HIDDEN);
                            }
                        }
                        else {
                            searchPane.addClass(TC.Consts.classes.HIDDEN);
                            treePane.removeClass(TC.Consts.classes.HIDDEN);
                            $(this).addClass(self.CLASS + "-btn-search");
                            $(this).attr("title", self.getLocaleString('searchLayersByText'));
                            $(this).removeClass(self.CLASS + "-btn-tree");

                            //Si hay resaltados en el árbol, mostramos el panel de info
                            var selectedCount = $('.tc-ctl-lcat-tree li button.tc-checked').length;
                            if (selectedCount > 0) {
                                infoPane.removeClass(TC.Consts.classes.HIDDEN);
                            }
                        }
                    });


                    //evento de expandir nodo de info
                    //self._$div.off("click", ".tc-ctl-lcat-search button");                        
                    self._$div.on("click", "." + self.CLASS + "-search button." + self.CLASS + "-search-btn-info", function (evt) {
                        evt.stopPropagation();
                        if (!$(this).hasClass(TC.Consts.classes.CHECKED)) {
                            var $li = $(this).parent();
                            self.showLayerInfo(self.layers[$li.parents('li').data(_dataKeys.SERVICEINDEX)], $li.data(_dataKeys.LAYERNAME));
                            $(this).addClass(TC.Consts.classes.CHECKED);

                        } else {
                            $(this).removeClass(TC.Consts.classes.CHECKED);
                            self.hideLayerInfo();
                        }
                    });

                    //click en un resultado - añadir capa
                    self._$div.on("click", ".tc-ctl-lcat-search li", function (evt) {
                        evt.stopPropagation();
                        var $li = $(this);
                        if ($li.hasClass("tc-ctl-lcat-no-results")) return; //si clicko en el li de "no hay resultados" rompo el ciclo de ejecución
                        if ($li.hasClass("tc-ctl-lcat-search-group")) {
                            $li.toggleClass(TC.Consts.classes.COLLAPSED);
                            return;
                        }
                        var layerName = $li.data(_dataKeys.LAYERNAME);
                        layerName = (layerName !== undefined) ? layerName.toString() : '';

                        //si la capa ya ha sido anteriormente, no la añadimos y mostramos un mensaje
                        if ($(this).hasClass(TC.Consts.classes.CHECKED)) {
                            return;
                        } else {
                            var $liParent = $li.parents("li.tc-ctl-lcat-search-group");

                            var url = self.layers[($liParent.length == 0 ? 0 : $liParent.data(_dataKeys.SERVICEINDEX))].options.url;
                            var title = self.layers[($liParent.length == 0 ? 0 : $liParent.data(_dataKeys.SERVICEINDEX))].title;

                            const layer = new TC.layer.Raster({
                                id: self.getUID(),
                                url: url,
                                title: title,
                                hideTitle: true,
                                layerNames: [layerName]
                            });
                            if (layer.isCompatible(self.map.crs)) {
                                self.map.addLayer(layer, function (layer) {
                                    $li.data(_dataKeys.LAYER, layer);
                                    layer.wrap.$events.on(TC.Consts.event.TILELOADERROR, function (event) {
                                        var layer = this.parent;
                                        if (event.error.code === 401 || event.error.code === 403)
                                            layer.map.toast(event.error.text, { type: TC.Consts.msgType.ERROR });
                                        layer.map.removeLayer(layer);
                                    });
                                });
                                //marcamos el resultado como añadido
                                $(this).addClass(TC.Consts.classes.CHECKED);
                                $(this).attr(TOOLTIP_DATA_ATTR, addedLayerText);
                            }
                            else {
                                showProjectionChangeDialog(self, layer);
                            }
                        }
                    });

                    self.searchInit = true;
                }

                if ($.isFunction(callback)) {
                    callback();
                }
            });
        });
    };

    ctlProto.getLayerRootNode = function (layer) {
        const self = this;
        var result = null;
        if (!layer.isBase) {
            var url = layer.options.url;
            if (self._$roots) {
                self._$roots.each(function (idx, elm) {
                    var $li = $(elm);
                    var lyr = $li.data(_dataKeys.LAYER);
                    if (lyr && lyr.type === layer.type && lyr.options.url === url) {
                        result = elm;
                    }
                });
            }
        }
        return result;
    };

    ctlProto.getLayerNodes = function (layer) {
        const self = this;
        var result = [];
        var $rn = $(self.getLayerRootNode(layer));
        if ($rn.length) {
            for (var i = 0; i < layer.names.length; i++) {
                const $liLayer = $rn.find('li[data-tc-layer-name="' + layer.names[i] + '"]');
                if ($liLayer.length == 0)
                    continue;
                result[result.length] = $liLayer[0];
                $liLayer.find('li').each(function (idx, li) {
                    result[result.length] = li;
                });
            }
        }
        return result;
    };

    ctlProto.showLayerInfo = function (layer, name) {
        var self = this;
        var result = null;

        var $info = self._$div.find('.' + self.CLASS + '-info');

        var toggleInfo = function (layerName, info) {
            var result = false;
            var lName = $info.data(_dataKeys.LAYERNAME);
            //if (lName !== undefined && lName.toString() === layerName) {
            //    $info.data(_dataKeys.LAYERNAME, '');
            //    $info.removeClass(TC.Consts.classes.HIDDEN);
            //}
            //else {
            if (info) {
                result = true;
                $info.data(_dataKeys.LAYERNAME, layerName);
                $info.removeClass(TC.Consts.classes.HIDDEN);
                dust.render(self.CLASS + '-info', info, function (err, out) {
                    $info.html(out);
                    if (err) {
                        TC.error(err);
                    }
                    $info.find('.' + self.CLASS + '-info-close').on(TC.Consts.event.CLICK, function () {
                        self.hideLayerInfo();
                    });
                });
            }
            //}
            return result;
        };

        self._$div.find('.' + self.CLASS + '-btn-info, .' + self.CLASS + '-search-btn-info').removeClass(TC.Consts.classes.CHECKED);

        self._$roots.each(function (idx, elm) {
            var $root = $(elm);
            if ($root.data(_dataKeys.LAYER) === layer) {
                var $as = $root.find('.' + self.CLASS + '-btn-info');
                $as.each(function (i, e) {
                    var $a = $(e);
                    var n = $a.parent().data(_dataKeys.LAYERNAME).toString();
                    if (n === name) {
                        var info = $a.data(_dataKeys.LAYERINFO);
                        self._$div.find('li [data-tc-layer-name="' + n + '"] > button').toggleClass(TC.Consts.classes.CHECKED, toggleInfo(n, info));
                        result = info;
                        return false;
                    }
                });
                return false;
            }
        });

        return result;
    };

    ctlProto.update = function () {
        const self = this;
        self.layers.forEach(function (layer) {
            layer.getCapabilitiesPromise().then(function () {
                layer.compatibleLayers = layer.wrap.getCompatibleLayers(self.map.crs);

                $(self.getLayerRootNode(layer))
                    .find('li[data-tc-layer-name]')
                    .each(function (idx, li) {
                        const $li = $(li);
                        const name = $li.data(_dataKeys.LAYERNAME);
                        const $span = $li.find('span.' + TC.Consts.classes.SELECTABLE);
                        if (layer.compatibleLayers.indexOf(name) < 0) {
                            $span
                                .addClass(TC.Consts.classes.INCOMPATIBLE)
                                .attr('title', self.getLocaleString('reprojectionNeeded'));
                        }
                        else {
                            $span
                                .removeClass(TC.Consts.classes.INCOMPATIBLE)
                                .attr('title', null);
                        }
                    });
            });
        });
    };

    ctlProto.hideLayerInfo = function () {
        var self = this;
        self._$div.find('.' + self.CLASS + '-btn-info, .' + self.CLASS + '-search-btn-info').removeClass(TC.Consts.classes.CHECKED);
        self._$div.find('.' + self.CLASS + '-info').addClass(TC.Consts.classes.HIDDEN);
    };

    ctlProto.addLayer = function (layer) {
        var result = $.Deferred();
        var self = this;
        var fromLayerCatalog = [];

        if (self.options.layers && self.options.layers.length) {
            fromLayerCatalog = $.grep(self.options.layers, function (l) {
                var getMap = TC.Util.reqGetMapOnCapabilities(l.url);
                return getMap && getMap.replace(TC.Util.regex.PROTOCOL) == layer.url.replace(TC.Util.regex.PROTOCOL);
            });
        }

        if (fromLayerCatalog.length == 0)
            fromLayerCatalog = $.grep(self.layers, function (l) {
                return l.url.replace(TC.Util.regex.PROTOCOL) == layer.url.replace(TC.Util.regex.PROTOCOL);
            });

        if (fromLayerCatalog.length == 0) {
            self.layers.push(layer);
            layer.getCapabilitiesPromise().then(function () {
                layer.compatibleLayers = layer.wrap.getCompatibleLayers(self.map.crs);
                layer.title = layer.title || layer.wrap.getServiceTitle();
                self.render(function () {
                    result.resolve(); //ver linea 55 y por ahí
                });
            });
        } else { result.resolve(); }

        return result;
    };

    ctlProto.addLayerToMap = function (layer, layerName) {
        const self = this;
        const layerOptions = $.extend({}, layer.options);
        layerOptions.id = self.getUID();
        layerOptions.layerNames = [layerName];
        layerOptions.title = layer.title;
        const newLayer = new TC.layer.Raster(layerOptions);
        if (newLayer.isCompatible(self.map.crs)) {
            self.map.addLayer(layerOptions).then(function (layer) {
                layer.wrap.$events.on(TC.Consts.event.TILELOADERROR, function (event) {
                    var layer = this.parent;
                    if (event.error.code === 401 || event.error.code === 403)
                        layer.map.toast(event.error.text, { type: TC.Consts.msgType.ERROR });
                    layer.map.removeLayer(layer);
                });
            });
        }
        else {
            showProjectionChangeDialog(self, newLayer);
        }
    };

    ctlProto.loaded = function () {
        return this._readyDeferred.promise();
    };

    ctlProto.getAvailableCRS = function (options) {
        const self = this;
        options = options || {};
        return self.map.getCompatibleCRS({
            layers: self.map.workLayers.concat(self.map.baseLayer, options.layer),
            includeFallbacks: true
        });
    };

    ctlProto.setProjection = function (options) {
        const self = this;
        options = options || {};

        TC.loadProjDef({
            crs: options.crs,
            callback: function () {
                self.map.setProjection(options).then(function () {
                    if (self._layerToAdd) {
                        self.map.addLayer(self._layerToAdd);
                    }
                    TC.Util.closeModal();
                });
            }
        });
    };

    ctlProto.showProjectionChangeDialog = function (options) {
        const self = this;
        self._layerToAdd = options.layer;
        TC.control.ProjectionSelector.prototype.showProjectionChangeDialog.call(self, options);
    };

})();
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

        if (!TC.Consts.classes.SELECTABLE) {
            TC.Consts.classes.SELECTABLE = 'tc-selectable';
        }
        if (!TC.Consts.classes.INCOMPATIBLE) {
            TC.Consts.classes.INCOMPATIBLE = 'tc-incompatible';
        }
        if (!TC.Consts.classes.ACTIVE) {
            TC.Consts.classes.ACTIVE = 'tc-active';
        }
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
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "availableLayers" }).x(ctx.get(["enableSearch"], false), ctx, { "block": body_1 }, {}).w("</h2><div class=\"tc-ctl-lcat-search tc-hidden tc-collapsed\"><div class=\"tc-group\"><input type=\"search\" class=\"tc-ctl-lcat-input tc-textbox\" placeholder=\"").h("i18n", ctx, {}, { "$key": "textToSearchInLayers" }).w("\"></input></div><ul></ul></div><div class=\"tc-ctl-lcat-tree\">").x(ctx.get(["layerTrees"], false), ctx, { "else": body_3, "block": body_4 }, {}).w("</div><div class=\"tc-ctl-lcat-info tc-hidden\">").p("tc-ctl-lcat-info", ctx, ctx.rebase(ctx.getPath(true, [])), {}).w("</div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.x(ctx.get(["layerTrees"], false), ctx, { "block": body_2 }, {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<button class=\"tc-ctl-lcat-btn-search\" title=\"").h("i18n", ctx, {}, { "$key": "searchLayersbytext" }).w("\"></button>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<div class=\"tc-ctl tc-ctl-lcat-loading\"><span>").h("i18n", ctx, {}, { "$key": "loadingLayerTree" }).w("...</span></div>"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("<ul class=\"tc-ctl-lcat-branch\">").s(ctx.get(["layerTrees"], false), ctx, { "block": body_5 }, {}).w("</ul>"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.p("tc-ctl-lcat-branch", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_5.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-branch'] = function () { dust.register(ctlProto.CLASS + '-branch', body_0); function body_0(chk, ctx) { return chk.w("<li ").x(ctx.get(["children"], false), ctx, { "else": body_1, "block": body_2 }, {}).w(" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><button class=\"tc-ctl-lcat-collapse-btn\"></button><span>").f(ctx.get(["title"], false), ctx, "h").w("</span><ul class=\"tc-ctl-lcat-branch tc-collapsed\">").s(ctx.get(["children"], false), ctx, { "block": body_3 }, {}).w("</ul></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("class=\"tc-ctl-lcat-node tc-ctl-lcat-leaf\""); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("class=\"tc-ctl-lcat-node tc-collapsed\""); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.p("tc-ctl-lcat-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_3.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.x(ctx.get(["isVisible"], false), ctx, { "block": body_1 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li ").x(ctx.get(["children"], false), ctx, { "else": body_2, "block": body_3 }, {}).w(" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\">").x(ctx.get(["children"], false), ctx, { "block": body_4 }, {}).w("<span data-tooltip=\"").x(ctx.get(["name"], false), ctx, { "block": body_5 }, {}).w("\">").f(ctx.get(["title"], false), ctx, "h").w("</span>").x(ctx.get(["name"], false), ctx, { "block": body_6 }, {}).w("<ul class=\"tc-ctl-lcat-branch tc-collapsed\">").s(ctx.get(["children"], false), ctx, { "block": body_7 }, {}).w("</ul></li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("class=\"tc-ctl-lcat-node tc-ctl-lcat-leaf\""); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("class=\"tc-ctl-lcat-node tc-collapsed\""); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("<button class=\"tc-ctl-lcat-collapse-btn\"></button>"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "clickToAddToMap" }); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<button title=\"").h("i18n", ctx, {}, { "$key": "infoFromThisLayer" }).w("\" class=\"tc-ctl-lcat-btn-info\"></button>"); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.p("tc-ctl-lcat-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_7.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-info'] = function () { dust.register(ctlProto.CLASS + '-info', body_0); function body_0(chk, ctx) { return chk.w("<a class=\"tc-ctl-lcat-info-close\"></a><h2>").h("i18n", ctx, {}, { "$key": "layerInfo" }).w("</h2><h3 class=\"tc-ctl-lcat-title\">").f(ctx.get(["title"], false), ctx, "h").w("</h3>").x(ctx.get(["abstract"], false), ctx, { "block": body_1 }, {}).x(ctx.get(["metadata"], false), ctx, { "block": body_2 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<div class=\"tc-ctl-lcat-abstract\"><h4>").h("i18n", ctx, {}, { "$key": "abstract" }).w("</h4><div><pre>").f(ctx.get(["abstract"], false), ctx, "h", ["s"]).w("</pre></div></div>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<div class=\"tc-ctl-lcat-metadata\"><h4>").h("i18n", ctx, {}, { "$key": "metadata" }).w("</h4><ul>").s(ctx.get(["metadata"], false), ctx, { "block": body_3 }, {}).w("</ul></div>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<li><a href=\"").f(ctx.get(["url"], false), ctx, "h", ["s"]).w("\" type=\"").f(ctx.get(["format"], false), ctx, "h").w("\" title=\"").f(ctx.get(["formatDescription"], false), ctx, "h").w("\" target=\"_blank\">").f(ctx.get(["formatDescription"], false), ctx, "h", ["s"]).w("</a></li>"); } body_3.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-results'] = function () { dust.register(ctlProto.CLASS + '-results', body_0); function body_0(chk, ctx) { return chk.s(ctx.get(["servicesFound"], false), ctx, { "else": body_1, "block": body_2 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li class=\"tc-ctl-lcat-no-results\"><h5>").h("i18n", ctx, {}, { "$key": "noMatches" }).w("</h5></li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.h("gt", ctx, { "block": body_3 }, { "key": ctx.get(["servicesLooked"], false), "value": 1 }).s(ctx.get(["founds"], false), ctx, { "block": body_5 }, {}).h("gt", ctx, { "block": body_8 }, { "key": ctx.get(["servicesLooked"], false), "value": 1 }); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<li class=\"tc-ctl-lcat-search-group ").x(ctx.getPath(false, ["service", "isCollapsed"]), ctx, { "block": body_4 }, {}).w("\" data-tc-service-index=\"").f(ctx.getPath(false, ["service", "index"]), ctx, "h").w("\"><h5>").f(ctx.getPath(false, ["service", "title"]), ctx, "h").w("</h5><ul>"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("tc-collapsed"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<li data-tc-layer-name=\"").f(ctx.get(["Name"], false), ctx, "h").w("\" ").x(ctx.get(["alreadyAdded"], false), ctx, { "else": body_6, "block": body_7 }, {}).w("><h5 class=\"tc-selectable\">").f(ctx.get(["Title"], false), ctx, "h").w("</h5><button class=\"tc-ctl-lcat-search-btn-info\" title=\"").h("i18n", ctx, {}, { "$key": "infoFromThisLayer" }).w("\"></button></li>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w(" data-tooltip=\"").h("i18n", ctx, {}, { "$key": "clickToAddToMap" }).w("\" "); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w(" data-tooltip=\"").h("i18n", ctx, {}, { "$key": "layerAlreadyAdded" }).w("\" class=\"tc-checked\" "); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("</ul></li>"); } body_8.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-lcat-crs-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "changeCRS" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p>").h("i18n", ctx, {}, { "$key": "wmsLayerNotCompatible.instructions|h" }).w("</p><ul class=\"tc-ctl-lcat-crs-list tc-crs-list\"></ul></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
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
                ctl.getLayerNodes(layer).forEach(function (node) {
                    node.classList.remove(TC.Consts.classes.LOADING);
                    node.querySelector('span').setAttribute(TOOLTIP_DATA_ATTR, ctl.getLocaleString('clickToAddToMap'));
                });
            }
        });
    };

    var SEARCH_MIN_LENGTH = 3;

    var TOOLTIP_DATA_ATTR = 'data-tooltip';

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.control.ProjectionSelector.prototype.register.call(self, map);

        const load = function (resolve, reject) {
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
                    resolve();
                });
            }
            else {
                resolve();
            }
        };

        self._readyPromise = new Promise(function (resolve, reject) {
            const waitLoad = function (e) {
                if (e.layer === map.baseLayer) {
                    load(resolve, reject);
                    map.off(TC.Consts.event.LAYERUPDATE, waitLoad);
                }
            };

            map.loaded(function () {
                if (!map.baseLayer.state || map.baseLayer.state === TC.Layer.state.IDLE) {
                    load(resolve, reject);
                }
                else {
                    map.on(TC.Consts.event.LAYERUPDATE, waitLoad);
                }
            });
        });

        const findResultNodes = function (layer) {
            const result = [];
            if (!layer.isBase) {
                var url = layer.options.url;
                if (self.list) {
                    self.list.querySelectorAll('li').forEach(function (li) {
                        const $li = $(li);
                        var lyr = $li.data(_dataKeys.LAYER);
                        if (lyr && lyr.type === layer.type && lyr.options.url === url) {
                            for (var i = 0; i < layer.names.length; i++) {
                                if (li.dataset.tcLayerName === layer.names[i]) {
                                    result.push(li);
                                }
                            }
                        }
                    });
                }
            }
            return result;
        };

        var _refreshResultList = function () {
            if ("createEvent" in document) {
                var evt = document.createEvent('HTMLEvents');
                evt.initEvent("keyup", false, true);
                if (self.textInput) {
                    self.textInput.dispatchEvent(evt);
                }
            }
            else {
                if (self.textInput) {
                    self.textInput.fireEvent("keyup");
                }
            }
        };

        /**
         * Marca todas las capas del TOC como añadidas excepto la que se está borrando que se recibe como parámetro.
         */
        const _markWorkLayersAsAdded = function (layerRemoved) {
            var wlCtrl = self.map.getControlsByClass(TC.control.WorkLayerManager)[0];
            if (wlCtrl) {
                var layers = wlCtrl.layers;

                for (var i = 0; i < layers.length; i++) {
                    var layer = layers[i];

                    if (layer !== layerRemoved) {
                        self.getLayerNodes(layer).forEach(function (node) {
                            node.classList.add(TC.Consts.classes.CHECKED);
                            node.querySelector('span').setAttribute(TOOLTIP_DATA_ATTR, layerAddedText);
                        });
                    }
                }
            }
        };

        var layerAddedText = self.getLocaleString('layerAlreadyAdded');
        var clickToAddText = self.getLocaleString('clickToAddToMap');

        map
            .on(TC.Consts.event.BEFORELAYERADD + ' ' + TC.Consts.event.BEFOREUPDATEPARAMS, function (e) {
                self.getLayerNodes(e.layer).forEach(function (node) {
                    node.classList.add(TC.Consts.classes.LOADING);
                    node.querySelector('span').removeAttribute(TOOLTIP_DATA_ATTR);
                });
            })
            .on(TC.Consts.event.LAYERADD + ' ' + TC.Consts.event.UPDATEPARAMS, function (e) {
                const layer = e.layer;
                if (!layer.isBase && layer.type === TC.Consts.layerType.WMS) {
                    self.loaded().then(function () { // Esperamos a que cargue primero las capas de la configuración
                        const updateControl = function () {
                            self.getLayerNodes(layer).forEach(function (node) {
                                node.classList.remove(TC.Consts.classes.LOADING);
                                node.classList.add(TC.Consts.classes.CHECKED);
                                node.querySelector('span').setAttribute(TOOLTIP_DATA_ATTR, layerAddedText);
                            });
                            _refreshResultList();
                        };
                        if (self.getLayerRootNode(layer)) {
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
                                    updateControl();
                                });
                            }
                        }
                    });
                }
            })
            .on(TC.Consts.event.LAYERERROR, function (e) {
                const reason = e.reason;
                if (reason) {
                    TC.alert(self.getLocaleString(reason, { url: e.layer.url }));
                }
                self.getLayerNodes(e.layer).forEach(function (node) {
                    node.classList.remove(TC.Consts.classes.LOADING);
                });
            })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
                const layer = e.layer;
                self.getLayerNodes(layer).forEach(function (node) {
                    node.classList.remove(TC.Consts.classes.CHECKED);
                    node.querySelector('span').setAttribute(TOOLTIP_DATA_ATTR, clickToAddText);
                });
                findResultNodes(layer).forEach(function (node) {
                    node.classList.remove(TC.Consts.classes.CHECKED);
                    node.setAttribute(TOOLTIP_DATA_ATTR, clickToAddText);
                });

                //Marcamos como añadidas aquellas capas que estén en el control de capas cargadas. Esto previene que si borramos una capa padre, todas
                //sus hijas aparezcan como no añadidas, a pesar que que alguna de ellas haya sido añadida previamente de manera individual
                _markWorkLayersAsAdded(layer);

                //refresh del searchList            
                _refreshResultList();
            })
            .on(TC.Consts.event.EXTERNALSERVICEADDED, function (e) {
                if (e && e.layer) {
                    self.addLayer(e.layer);
                    self.div.classList.remove(TC.Consts.classes.COLLAPSED);
                }
            })
            .on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
                self.update();
            });

        return result;
    };

    const onCollapseButtonClick = function (e) {
        e.target.blur();
        e.stopPropagation();
        const li = e.target.parentElement;
        if (li.tagName === 'LI' && !li.classList.contains(self.CLASS + '-leaf')) {
            if (li.classList.contains(TC.Consts.classes.COLLAPSED)) {
                li.classList.remove(TC.Consts.classes.COLLAPSED);
            }
            else {
                li.classList.add(TC.Consts.classes.COLLAPSED);
            }
            const ul = li.querySelector('ul');
            if (ul.classList.contains(TC.Consts.classes.COLLAPSED)) {
                ul.classList.remove(TC.Consts.classes.COLLAPSED);
            }
            else {
                ul.classList.add(TC.Consts.classes.COLLAPSED);
            }
        }
    };

    const onSpanClick = function (e, ctl) {
        const li = e.target.parentNode;
        if (!li.classList.contains(TC.Consts.classes.LOADING) && !li.classList.contains(TC.Consts.classes.CHECKED)) {
            e.preventDefault;

            var layerName = $(li).data(_dataKeys.LAYERNAME);
            layerName = (layerName !== undefined) ? layerName.toString() : '';
            var layer;
            for (var i = 0, len = ctl._roots.length; i < len; i++) {
                const root = ctl._roots[i];
                if (root.contains(li)) {
                    layer = $(root).data(_dataKeys.LAYER);
                    break;
                }
            }
            if (!layer) {
                layer = $(li).data(_dataKeys.LAYER);
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

                li.classList.add(TC.Consts.classes.LOADING);
                li.querySelector('span').setAttribute(TOOLTIP_DATA_ATTR, '');

                const reDraw = function (element) {
                    return new Promise(function (resolve, reject) {
                        setTimeout(function () {
                            element.offsetHeight = element.offsetHeight;
                            element.offsetWidth = element.offsetWidth;

                            resolve();
                        }, redrawTime);
                    });
                };

                reDraw(li).then(function () {
                    ctl.addLayerToMap(layer, layerName);
                });
                e.stopPropagation();
            }
        }
    };


    ctlProto.render = function (callback) {
        const self = this;

        return self._set1stRenderPromise(new Promise(function (resolve, reject) {
            const promises = $.map(self.layers, function (layer) {
                return layer.wrap.getLayer();
            });

            Promise.all(promises).then(function () {

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

                    const addedLayerText = self.getLocaleString('layerAlreadyAdded');

                    self.div.querySelectorAll('li > button.' + self.CLASS + '-collapse-btn').forEach(function (btn) {
                        btn.addEventListener('click', onCollapseButtonClick);
                    });

                    self.div.querySelectorAll('span').forEach(function (span) {
                        span.addEventListener('click', function (e) {
                            onSpanClick(e, self);
                        });
                    })


                    self._roots = self.div.querySelectorAll(self._selectors.LAYER_ROOT);
                    self._roots.forEach(function (root, idx) {
                        var layer = self.layers[idx];
                        $(root).data(_dataKeys.LAYER, layer);

                        var formatDescriptions = {};
                        root.querySelectorAll('.' + self.CLASS + '-btn-info').forEach(function (a) {
                            const span = a.parentElement.querySelector('span');
                            const name = $(a.parentElement).data(_dataKeys.LAYERNAME).toString();
                            if (name) {
                                span.classList.add(TC.Consts.classes.SELECTABLE);
                                var info = layer.wrap.getInfo(name);
                                if (!info.hasOwnProperty('abstract') && !info.hasOwnProperty('legend') && !info.hasOwnProperty('metadata')) {
                                    a.parentElement.removeChild(a);
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
                                    $(a).data(_dataKeys.LAYERINFO, info);
                                    a.addEventListener(TC.Consts.event.CLICK, function (e) {
                                        e.stopPropagation();
                                        const elm = this;
                                        if (!elm.classList.contains(TC.Consts.classes.CHECKED)) {
                                            self.showLayerInfo(layer, name);
                                            elm.classList.add(TC.Consts.classes.CHECKED);

                                        } else {
                                            elm.classList.remove(TC.Consts.classes.CHECKED);
                                            self.hideLayerInfo();
                                        }
                                    });
                                }
                                if (layer.compatibleLayers && layer.compatibleLayers.indexOf(name) < 0) {
                                    span.classList.add(TC.Consts.classes.INCOMPATIBLE);
                                    span.setAttribute('title', self.getLocaleString('reprojectionNeeded'));
                                    //console.log("capa " + name + " incompatible");
                                }
                                if (self.map) {
                                    for (var j = 0, len = self.map.workLayers.length; j < len; j++) {
                                        var wl = self.map.workLayers[j];
                                        if (wl.type === TC.Consts.layerType.WMS && wl.url === layer.url && wl.names.length === 1 && wl.names[0] === name) {
                                            span.parentElement.classList.add(TC.Consts.classes.CHECKED);
                                            span.setAttribute(TOOLTIP_DATA_ATTR, addedLayerText);
                                        }
                                    }
                                }
                            }
                            else {
                                span.setAttribute(TOOLTIP_DATA_ATTR, '');
                                a.parentElement.removeChild(a);
                            }
                        });
                    });

                    self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
                        self._dialogDiv.innerHTML = html;
                    });

                    self.textInput = self.div.querySelector("." + self.CLASS + "-input");
                    self.list = self.div.querySelector("." + self.CLASS + "-search ul");
                    // Clear results list when x button is pressed in the search input
                    self.textInput.addEventListener('mouseup', function (e) {
                        var oldValue = self.textInput.value;

                        if (oldValue === '') {
                            return;
                        }

                        // When this event is fired after clicking on the clear button
                        // the value is not cleared yet. We have to wait for it.
                        setTimeout(function () {
                            var newValue = self.textInput.value;

                            if (newValue === '') {
                                self.list.innerHTML = '';
                            }
                        }, 1);
                    });

                    var layerCheckedList = [];
                    //Definir el autocomplete del buscador de capas por texto
                    TC._search = TC._search || {};
                    TC._search.retryTimeout = null;

                    TC.loadJS(
                        !TC.UI || !TC.UI.autocomplete,
                        [TC.apiLocation + 'TC/ui/autocomplete.js'],
                        function () {
                            TC.UI.autocomplete.call(self.textInput, {
                                link: '#',
                                target: self.list,
                                minLength: 0,
                                source: function (text, callback) {
                                    //lista de capas marcadas
                                    layerCheckedList = [];
                                    self._roots.forEach(function (root) {
                                        root.querySelectorAll("li." + TC.Consts.classes.CHECKED).forEach(function (item) {
                                            layerCheckedList.push($(item).data(_dataKeys.LAYERNAME).toString());
                                        });
                                    });

                                    //con texto vacío, limpiar  y ocultar la lista de resultados
                                    text = text.trim();
                                    if (text.length < SEARCH_MIN_LENGTH) {
                                        self.list.innerHTML = '';
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
                                    self.textInput.value = e.target.text || e.target.innerText;
                                    TC._search.lastPattern = self.textInput.value;
                                    self.goToResult(unescape(e.target.hash).substring(1));
                                    TC.UI.autocomplete.call(self.textInput, 'clear');
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
                                            if (self.div.querySelectorAll(".tc-ctl-lcat-search-group")[k]) {
                                                data.results.servicesFound[k].service.isCollapsed = self.div.querySelectorAll(".tc-ctl-lcat-search-group")[k].classList.contains(TC.Consts.classes.COLLAPSED);
                                            }
                                        }
                                    }
                                    var ret = '';
                                    dust.render(self.CLASS + '-results', data.results, function (err, out) {
                                        ret = out;
                                    });
                                    return ret;
                                }
                            });
                        });


                    if (!self.searchInit) {
                        //botón de la lupa para alternar entre búsqueda y árbol
                        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('h2 button', function (e) {
                            const wasCollapsed = self.div.classList.contains(TC.Consts.classes.COLLAPSED);
                            self.div.classList.remove(TC.Consts.classes.COLLAPSED);

                            const searchPane = self.div.querySelector('.' + self.CLASS + '-search');
                            const treePane = self.div.querySelector('.' + self.CLASS + '-tree');
                            const infoPane = self.div.querySelector('.' + self.CLASS + '-info');

                            if (searchPane.classList.contains(TC.Consts.classes.HIDDEN) || wasCollapsed) {
                                searchPane.classList.remove(TC.Consts.classes.HIDDEN);
                                treePane.classList.add(TC.Consts.classes.HIDDEN);
                                self.textInput.focus();
                                e.target.classList.add(self.CLASS + '-btn-tree');
                                e.target.setAttribute('title', self.getLocaleString('viewAvailableLayersTree'));
                                e.target.classList.remove(self.CLASS + '-btn-search');

                                //Si no hay resultados resaltados en el buscador, ocultamos el panel de info
                                const selectedCount = self.div.querySelectorAll('.tc-ctl-lcat-search li button.tc-checked').length;
                                if (selectedCount === 0) {
                                    infoPane.classList.add(TC.Consts.classes.HIDDEN);
                                }
                            }
                            else {
                                searchPane.classList.add(TC.Consts.classes.HIDDEN);
                                treePane.classList.remove(TC.Consts.classes.HIDDEN);
                                e.target.classList.add(self.CLASS + '-btn-search');
                                e.target.setAttribute('title', self.getLocaleString('searchLayersByText'));
                                e.target.classList.remove(self.CLASS + '-btn-tree');

                                //Si hay resaltados en el árbol, mostramos el panel de info
                                const selectedCount = self.div.querySelectorAll('.tc-ctl-lcat-tree li button.tc-checked').length;
                                if (selectedCount > 0) {
                                    infoPane.classList.remove(TC.Consts.classes.HIDDEN);
                                }
                            }
                        }));


                        //evento de expandir nodo de info
                        //self._$div.off("click", ".tc-ctl-lcat-search button");                        
                        self.div.addEventListener("click", TC.EventTarget.listenerBySelector("." + self.CLASS + "-search button." + self.CLASS + "-search-btn-info", function (evt) {
                            evt.stopPropagation();
                            const target = evt.target;
                            if (!target.classList.contains(TC.Consts.classes.CHECKED)) {
                                const li = target.parentElement;
                                var parent = li;
                                do {
                                    parent = parent.parentElement;
                                }
                                while (parent && parent.tagName !== 'LI');
                                self.showLayerInfo(self.layers.length > 1 ? self.layers[$(parent).data(_dataKeys.SERVICEINDEX)] : self.layers[0], $(li).data(_dataKeys.LAYERNAME));
                                target.classList.add(TC.Consts.classes.CHECKED);

                            } else {
                                target.classList.remove(TC.Consts.classes.CHECKED);
                                self.hideLayerInfo();
                            }
                        }));

                        //click en un resultado - añadir capa
                        const searchListElementSelector = '.' + self.CLASS + ' li';
                        self.div.addEventListener('click', TC.EventTarget.listenerBySelector(searchListElementSelector, function (evt) {
                            evt.stopPropagation();
                            var li = evt.target;
                            while (li && !li.matches(searchListElementSelector)) {
                                li = li.parentElement;
                            }
                            if (li.classList.contains(self.CLASS + '-no-results')) {
                                return; //si clicko en el li de "no hay resultados" rompo el ciclo de ejecución
                            }
                            if (li.classList.contains(self.CLASS + '-search-group')) {
                                if (li.classList.contains(TC.Consts.classes.COLLAPSED)) {
                                    li.classList.remove(TC.Consts.classes.COLLAPSED);
                                }
                                else {
                                    li.classList.add(TC.Consts.classes.COLLAPSED);
                                }
                                return;
                            }
                            var layerName = $(li).data(_dataKeys.LAYERNAME);
                            if (!layerName) {
                                return;
                            }
                            layerName = layerName.toString();

                            //si la capa ya ha sido anteriormente, no la añadimos y mostramos un mensaje
                            if (li.classList.contains(TC.Consts.classes.CHECKED)) {
                                return;
                            } else {
                                var liParent = li;
                                do {
                                    liParent = liParent.parentElement;
                                }
                                while (liParent && !liParent.matches('li.' + self.CLASS + '-search-group'));

                                const layerIdx = (!liParent ? 0 : $(liParent).data(_dataKeys.SERVICEINDEX));
                                const url = self.layers[layerIdx].options.url;
                                const title = self.layers[layerIdx].title;

                                const layer = new TC.layer.Raster({
                                    id: self.getUID(),
                                    url: url,
                                    title: title,
                                    hideTitle: self.layers[layerIdx].hideTitle || self.layers[layerIdx].options.hideTitle,
                                    hideTree: false,
                                    layerNames: [layerName]
                                });
                                if (layer.isCompatible(self.map.crs)) {
                                    self.map.addLayer(layer, function (layer) {
                                        $(li).data(_dataKeys.LAYER, layer);
                                        layer.wrap.$events.on(TC.Consts.event.TILELOADERROR, function (event) {
                                            var layer = this.parent;
                                            if (event.error.code === 401 || event.error.code === 403)
                                                layer.map.toast(event.error.text, { type: TC.Consts.msgType.ERROR });
                                            layer.map.removeLayer(layer);
                                        });
                                    });
                                    //marcamos el resultado como añadido
                                    li.classList.add(TC.Consts.classes.CHECKED);
                                    li.setAttribute(TOOLTIP_DATA_ATTR, addedLayerText);
                                }
                                else {
                                    showProjectionChangeDialog(self, layer);
                                }
                            }
                        }));

                        self.searchInit = true;
                    }

                    if ($.isFunction(callback)) {
                        callback();
                    }
                }).then(function () {
                    resolve();
                }).catch(function (err) {
                    reject(err);
                })
            });
        }));
    };

    ctlProto.getLayerRootNode = function (layer) {
        const self = this;
        var result = null;
        if (!layer.isBase) {
            var url = layer.options.url;
            if (self._roots) {
                self._roots.forEach(function (li) {
                    var lyr = $(li).data(_dataKeys.LAYER);
                    if (lyr && lyr.type === layer.type && lyr.options.url === url) {
                        result = li;
                    }
                });
            }
        }
        return result;
    };

    ctlProto.getLayerNodes = function (layer) {
        const self = this;
        const result = [];
        const rootNode = self.getLayerRootNode(layer);
        if (rootNode) {
            for (var i = 0; i < layer.names.length; i++) {
                const liLayer = rootNode.querySelector('li[data-tc-layer-name="' + layer.names[i] + '"]');
                if (!liLayer) {
                    continue;
                }
                result[result.length] = liLayer;
                liLayer.querySelectorAll('li').forEach(function (li) {
                    result[result.length] = li;
                });
            }
        }
        return result;
    };

    ctlProto.showLayerInfo = function (layer, name) {
        const self = this;
        var result = null;

        var info = self.div.querySelector('.' + self.CLASS + '-info');

        const toggleInfo = function (layerName, infoObj) {
            var result = false;
            var lName = $(info).data(_dataKeys.LAYERNAME);
            //if (lName !== undefined && lName.toString() === layerName) {
            //    $info.data(_dataKeys.LAYERNAME, '');
            //    $info.removeClass(TC.Consts.classes.HIDDEN);
            //}
            //else {
            if (infoObj) {
                result = true;
                $(info).data(_dataKeys.LAYERNAME, layerName);
                info.classList.remove(TC.Consts.classes.HIDDEN);
                dust.render(self.CLASS + '-info', infoObj, function (err, out) {
                    info.innerHTML = out;
                    if (err) {
                        TC.error(err);
                    }
                    info.querySelector('.' + self.CLASS + '-info-close').addEventListener(TC.Consts.event.CLICK, function () {
                        self.hideLayerInfo();
                    });
                });
            }
            //}
            return result;
        };

        self.div.querySelectorAll('.' + self.CLASS + '-btn-info, .' + self.CLASS + '-search-btn-info').forEach(function (btn) {
            btn.classList.remove(TC.Consts.classes.CHECKED);
        });

        for (var i = 0, ii = self._roots.length; i < ii; i++) {
            const root = self._roots[i];
            if ($(root).data(_dataKeys.LAYER) === layer) {
                const as = root.querySelectorAll('.' + self.CLASS + '-btn-info');
                for (var j = 0, jj = as.length; j < jj; j++) {
                    const a = as[j];
                    var n = $(a.parentElement).data(_dataKeys.LAYERNAME).toString();
                    if (n === name) {
                        const info = $(a).data(_dataKeys.LAYERINFO);
                        const checked = toggleInfo(n, info);
                        const infoBtn = self.div.querySelector('li [data-tc-layer-name="' + n + '"] > button.' + self.CLASS + '-btn-info');
                        if (toggleInfo(n, info)) {
                            infoBtn.classList.add(TC.Consts.classes.CHECKED);
                        }
                        else {
                            infoBtn.classList.remove(TC.Consts.classes.CHECKED);
                        }
                        result = info;
                        break;
                    }
                }
                break;
            }
        }

        return result;
    };

    ctlProto.update = function () {
        const self = this;
        self.layers.forEach(function (layer) {
            layer.getCapabilitiesPromise().then(function () {
                layer.compatibleLayers = layer.wrap.getCompatibleLayers(self.map.crs);

                const rootNode = self.getLayerRootNode(layer);
                if (rootNode) {
                    rootNode
                        .querySelectorAll('li[data-tc-layer-name]')
                        .forEach(function (li) {
                            const name = $(li).data(_dataKeys.LAYERNAME);
                            const span = li.querySelector('span.' + TC.Consts.classes.SELECTABLE);
                            if (layer.compatibleLayers.indexOf(name) < 0) {
                                span.classList.add(TC.Consts.classes.INCOMPATIBLE);
                                span.setAttribute('title', self.getLocaleString('reprojectionNeeded'));
                            }
                            else {
                                span.classList.remove(TC.Consts.classes.INCOMPATIBLE)
                                span.removeAttribute('title');
                            }
                        });
                }
            });
        });
    };

    ctlProto.hideLayerInfo = function () {
        var self = this;
        self.div.querySelectorAll('.' + self.CLASS + '-btn-info, .' + self.CLASS + '-search-btn-info').forEach(function (btn) {
            btn.classList.remove(TC.Consts.classes.CHECKED);
        });
        self.div.querySelector('.' + self.CLASS + '-info').classList.add(TC.Consts.classes.HIDDEN);
    };

    ctlProto.addLayer = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {
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
                        resolve(); //ver linea 55 y por ahí
                    });
                });
            } else { resolve(); }
        });
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
        return this._readyPromise;
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
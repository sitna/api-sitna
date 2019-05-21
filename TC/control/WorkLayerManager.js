TC.control = TC.control || {};

if (!TC.control.TOC) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/TOC');
}

TC.control.WorkLayerManager = function (options) {
    var self = this;
    TC.control.TOC.apply(self, arguments);
    self.layers = [];
    self.queries = self.options.queries;
};

TC.inherit(TC.control.WorkLayerManager, TC.control.TOC);

(function () {
    var ctlProto = TC.control.WorkLayerManager.prototype;

    ctlProto.CLASS = 'tc-ctl-wlm';
    ctlProto.CLICKEVENT = 'click';

    TC.Consts.classes.DRAG = TC.Consts.classes.DRAG || 'tc-drag';
    TC.Consts.classes.DRAGEND = TC.Consts.classes.DRAGEND || 'tc-dragend';

    TC.Consts.event.TOOLSOPEN = TC.Consts.event.TOOLSOPEN || 'toolsopen.tc';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/WorkLayerManager.html";
        ctlProto.template[ctlProto.CLASS + '-elm'] = TC.apiLocation + "TC/templates/WorkLayerManagerElement.html";
        ctlProto.template[ctlProto.CLASS + '-type-sgl'] = TC.apiLocation + "TC/templates/WorkLayerManagerTooltipSingle.html";
        ctlProto.template[ctlProto.CLASS + '-type-grp'] = TC.apiLocation + "TC/templates/WorkLayerManagerTooltipGroup.html";
        ctlProto.template[ctlProto.CLASS + '-type-grp-node'] = TC.apiLocation + "TC/templates/WorkLayerManagerTooltipGroupNode.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "loadedLayers" }).w("<span class=\"tc-ctl-wlm-n\"></span><button class=\"tc-ctl-wlm-del-all tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "removeAllLayersFromMap" }).w("\"></button></h2><div class=\"tc-ctl-wlm-empty\">").h("i18n", ctx, {}, { "$key": "noData" }).w("</div><div class=\"tc-ctl-wlm-content tc-hidden\"><form><ul>").s(ctx.get(["workLayers"], false), ctx, { "block": body_1 }, {}).w("</ul></form></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-wlm-elm", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-elm'] = function () { dust.register(ctlProto.CLASS + '-elm', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-wlm-elm\" tabindex=\"-1\"><div class=\"tc-ctl-wlm-lyr\">").x(ctx.get(["path"], false), ctx, { "block": body_1 }, {}).w("</div><div class=\"tc-ctl-wlm-type\"></div><div class=\"tc-ctl-wlm-path\" title=\"").s(ctx.get(["path"], false), ctx, { "else": body_2, "block": body_3 }, {}).w("\">").s(ctx.get(["path"], false), ctx, { "else": body_5, "block": body_6 }, {}).w("</div><div class=\"tc-ctl-wlm-buttons\"><div class=\"tc-ctl-wlm-btn-info\" title=\"").h("i18n", ctx, {}, { "$key": "infoFromThisLayer" }).w("\"></div><input type=\"range\" value=\"").f(ctx.get(["opacity"], false), ctx, "h").w("\" title=\"").h("i18n", ctx, {}, { "$key": "transparencyOfThisLayer" }).w("\" /><input type=\"checkbox\" ").nx(ctx.get(["hide"], false), ctx, { "block": body_8 }, {}).w(" title=\"").h("i18n", ctx, {}, { "$key": "visibilityOfThisLayer" }).w("\" /></div><div class=\"tc-ctl-wlm-info tc-hidden\">").x(ctx.get(["abstract"], false), ctx, { "block": body_9 }, {}).x(ctx.get(["customLegend"], false), ctx, { "else": body_10, "block": body_13 }, {}).x(ctx.get(["metadata"], false), ctx, { "block": body_14 }, {}).w("</div><div class=\"tc-ctl-wlm-dd ").x(ctx.get(["hide"], false), ctx, { "block": body_16 }, {}).w("\" title=\"").h("i18n", ctx, {}, { "$key": "dragToReorder" }).w("\"></div><div class=\"tc-ctl-wlm-del ").x(ctx.get(["unremovable"], false), ctx, { "block": body_17 }, {}).w(" ").nx(ctx.get(["hide"], false), ctx, { "block": body_18 }, {}).w("\" ").nx(ctx.get(["unremovable"], false), ctx, { "block": body_19 }, {}).w("></div></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.f(ctx.get(["title"], false), ctx, "h"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.f(ctx.get(["title"], false), ctx, "h"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.f(ctx.getPath(true, []), ctx, "h").h("sep", ctx, { "block": body_4 }, {}); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w(" &bull; "); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.f(ctx.get(["title"], false), ctx, "h"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.f(ctx.getPath(true, []), ctx, "h").h("sep", ctx, { "block": body_7 }, {}); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w(" &bull; "); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("checked=\"checked\""); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.w("<div class=\"tc-ctl-wlm-abstract\"><h4>").h("i18n", ctx, {}, { "$key": "abstract" }).w("</h4><div><pre>").f(ctx.get(["abstract"], false), ctx, "h", ["s"]).w("</pre></div></div>"); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.x(ctx.get(["legend"], false), ctx, { "block": body_11 }, {}); } body_10.__dustBody = !0; function body_11(chk, ctx) { return chk.w("<div class=\"tc-ctl-wlm-legend\" data-tc-layer-name=\"").f(ctx.get(["layerNames"], false), ctx, "h").w("\"><h4>").h("i18n", ctx, {}, { "$key": "content" }).w("</h4>").s(ctx.get(["legend"], false), ctx, { "block": body_12 }, {}).w("</div>"); } body_11.__dustBody = !0; function body_12(chk, ctx) { return chk.w("<div><p>").f(ctx.get(["title"], false), ctx, "h").w("</p><img data-tc-img=\"").f(ctx.get(["src"], false), ctx, "h").w("\" /></div>"); } body_12.__dustBody = !0; function body_13(chk, ctx) { return chk.w("<ul class=\"tc-ctl-wlm-custom-legend\">").f(ctx.get(["customLegend"], false), ctx, "h", ["s"]).w("</ul>"); } body_13.__dustBody = !0; function body_14(chk, ctx) { return chk.w("<div class=\"tc-ctl-wlm-metadata\"><h4>").h("i18n", ctx, {}, { "$key": "metadata" }).w("</h4><ul>").s(ctx.get(["metadata"], false), ctx, { "block": body_15 }, {}).w("</ul></div>"); } body_14.__dustBody = !0; function body_15(chk, ctx) { return chk.w("<li><a href=\"").f(ctx.get(["url"], false), ctx, "h", ["s"]).w("\" type=\"").f(ctx.get(["format"], false), ctx, "h").w("\" title=\"").f(ctx.get(["formatDescription"], false), ctx, "h").w("\" target=\"_blank\">").f(ctx.get(["formatDescription"], false), ctx, "h").w("</a></li>"); } body_15.__dustBody = !0; function body_16(chk, ctx) { return chk.w("tc-hidden"); } body_16.__dustBody = !0; function body_17(chk, ctx) { return chk.w("disabled"); } body_17.__dustBody = !0; function body_18(chk, ctx) { return chk.w("tc-hidden"); } body_18.__dustBody = !0; function body_19(chk, ctx) { return chk.w("title=\"").h("i18n", ctx, {}, { "$key": "removeLayerFromMap" }).w("\""); } body_19.__dustBody = !0; return body_0; };
        ctlProto.template[ctlProto.CLASS + '-type-sgl'] = function () { dust.register(ctlProto.CLASS + '-type-sgl', body_0); function body_0(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "singleLayer" }); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-type-grp'] = function () { dust.register(ctlProto.CLASS + '-type-grp', body_0); function body_0(chk, ctx) { return chk.w("<div>").h("i18n", ctx, {}, { "$key": "groupLayerThatContains" }).w(":</div><ul>").s(ctx.get(["Layer"], false), ctx, { "block": body_1 }, {}).w("</ul>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-wlm-type-grp-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-type-grp-node'] = function () { dust.register(ctlProto.CLASS + '-type-grp-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-wlm-tip-grp-elm\"><span>").f(ctx.get(["Title"], false), ctx, "h").w("</span><ul>").s(ctx.get(["Layer"], false), ctx, { "block": body_1 }, {}).w("</ul></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-wlm-type-grp-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
    }

    const _dataKeys = {
        layer: 'tcLayer'
    };

    const findLayerElement = function (ctl, layer) {
        return ctl.getLayerUIElements().filter(function (li) {
            return $(li).data(_dataKeys.layer) === layer;
        })[0];
    };

    var getElligibleLayersNumber = function (ctl) {
        return $.grep(ctl.map.workLayers, function (lyr) {
            return !lyr.stealth;
        }).length;
    };

    const shouldBeDelAllVisible = function (ctl) {
        return !ctl.layers.some(function (layer) { return layer.unremovable });
    };

    const moveLayer = function (ctl, listItem, oldIndex, newIndex, callback) {
        const layerItems = ctl.getLayerUIElements();
        var targetItem;
        if (newIndex > oldIndex) {
            targetItem = layerItems[newIndex - 1];
        }
        else if (newIndex < oldIndex) {
            targetItem = layerItems[newIndex + 1];
        }
        else {
            return;
        }
        const sourceLayer = $(listItem).data(_dataKeys.layer);
        const targetLayer = $(targetItem).data(_dataKeys.layer);
        var newIdx = -1;
        for (var i = 0; i < ctl.map.layers.length; i++) {
            if (targetLayer === ctl.map.layers[i]) {
                newIdx = i;
                break;
            }
        }
        if (newIdx >= 1 && newIdx < ctl.map.layers.length) {
            ctl.map.insertLayer(sourceLayer, newIdx, callback);
        }
    };

    ctlProto.render = function (callback, options) {
        const self = this;
        return self._set1stRenderPromise(self.map ? self.renderData(options ? $.extend(self.map.getLayerTree(), options) : self.map.getLayerTree(), function () {
            self.addUIEventListeners();
            TC.loadJS(
                !window.Sortable,
                [TC.apiLocation + 'lib/sortable/Sortable.min.js'],
                function () {
                    self.map.workLayers
                        .filter(function (layer) {
                            return !layer.stealth;
                        })
                        .forEach(function (layer) {
                            self.updateLayerTree(layer);
                        });


                    const ul = self.div.querySelector('ul');
                    self._sortable = Sortable.create(ul, {
                        handle: '.' + self.CLASS + '-dd',
                        animation: 150,
                        onSort: function (e) {
                            moveLayer(self, e.item, e.oldIndex, e.newIndex);
                        }
                    });

                    ul.addEventListener('keydown', TC.EventTarget.listenerBySelector('li', function (e) {
                        // Para mover capas con el teclado.
                        var elm = e.target;
                        while (elm.tagName !== 'LI') {
                            elm = elm.parentElement;
                            if (!elm) {
                                return;
                            }
                        }
                        const swap = function (oldIdx, newIdx) {
                            const sortableItems = self._sortable.toArray();
                            const buffer = sortableItems[oldIdx];
                            sortableItems[oldIdx] = sortableItems[newIdx];
                            sortableItems[newIdx] = buffer;
                            self._sortable.sort(sortableItems);
                            moveLayer(self, elm, oldIdx, newIdx);
                        };
                        const listItems = self.getLayerUIElements();
                        const elmIdx = listItems.indexOf(elm);
                        switch (true) {
                            case /Up$/.test(e.key):
                                if (elmIdx > 0) {
                                    swap(elmIdx, elmIdx - 1);
                                    elm.focus();
                                    e.stopPropagation();
                                }
                                break;
                            case /Down$/.test(e.key):
                                if (elmIdx < listItems.length - 1) {
                                    swap(elmIdx, elmIdx + 1);
                                    elm.focus();
                                    e.stopPropagation();
                                }
                                break;
                            case /Enter$/.test(e.key):
                                elm.blur();
                                e.stopPropagation();
                                break;
                            default:
                                break;
                        }
                    }));

                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            );
        }) : Promise.reject());
    };

    ctlProto.register = function (map) {
        const self = this;

        return new Promise(function (resolve, reject) {
            TC.control.TOC.prototype.register.call(self, map).then(function () {

                map
                    .on(TC.Consts.event.LAYEROPACITY, function (e) {
                        const li = findLayerElement(self, e.layer);
                        if (li) {
                            li.querySelector('input[type=range]').value = Math.round(e.opacity * 100);
                        }
                    })
                    .on(TC.Consts.event.FEATURESIMPORT, function (e) {
                        var fileName = e.fileName;
                        if (e.features && e.features.length > 0) { // GLS: Escuchamos al evento FEATURESIMPORT para poder desplegar el control de capas cargadas
                            // Ignoramos los GPX (se supone que los gestionará Geolocation)
                            var pattern = '.' + TC.Consts.format.GPX.toLowerCase();
                            if (e.fileName.toLowerCase().indexOf(pattern) === e.fileName.length - pattern.length) {
                                return;
                            }

                            map.one(TC.Consts.event.LAYERADD, function (e) {
                                if (e && e.layer && e.layer.title == fileName) {
                                    // Desplegamos el control capas cargadas
                                    if (self.map && self.map.layout && self.map.layout.accordion) {
                                        if (self.div.classList.contains(TC.Consts.classes.COLLAPSED)) {
                                            for (var i = 0; i < self.map.controls.length; i++) {
                                                if (self.map.controls[i] !== self) {
                                                    self.map.controls[i].div.classList.add(TC.Consts.classes.COLLAPSED);
                                                }
                                            }
                                        }
                                    }

                                    // abrimos el panel de herramientas
                                    self.map.trigger(TC.Consts.event.TOOLSOPEN);

                                    self.div.classList.remove(TC.Consts.classes.COLLAPSED);
                                }
                            });
                        }
                    });
                if (self.queries) {
                    if (!TC.control.WFSQuery) {
                        TC.syncLoadJS(TC.apiLocation + 'TC/Control/WFSQuery');
                    }
                    ctlProto.queryControl = new TC.control.WFSQuery(null, self.queries instanceof Object ? self.queries : null);
                    self.map.addControl(ctlProto.queryControl);
                }
                resolve(self);
            });
        });
    };

    ctlProto.onExternalServiceAdded = function (e, map) {
        // Este control no tiene que aceptar servicios externos directamente
    };

    ctlProto.addUIEventListeners = function () {
        const self = this;

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector('input[type=checkbox]', function (e) {
            // al estar en ipad el evento pasa a ser touchstart en la constante: TC.Consts.event.CLICK, los checkbox no funcionan bien con este evento
            const checkbox = e.target;
            var li = checkbox;
            do {
                li = li.parentElement;
            }
            while (li && !li.matches('li.' + self.CLASS + '-elm'));

            const layer = $(li).data(_dataKeys.layer);
            layer.setVisibility(checkbox.checked);
            e.stopPropagation();
        }));

        const inputRangeListener = function (e) {
            const range = e.target;
            var li = range;
            do {
                li = li.parentElement;
            }
            while (li && li.tagName !== 'LI');

            const layer = $(li).data(_dataKeys.layer);
            layer.setOpacity(range.value / 100);
        };
        self.div.addEventListener('change', TC.EventTarget.listenerBySelector('input[type=range]', inputRangeListener));
        self.div.addEventListener('input', TC.EventTarget.listenerBySelector('input[type=range]', inputRangeListener));

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector('.' + self.CLASS + '-del' + ':not(.disabled)', function (e) {
            var li = e.target;
            do {
                li = li.parentElement;
            }
            while (li && li.tagName !== 'LI');
            const layer = $(li).data(_dataKeys.layer);
            self.map.removeLayer(layer);
        }));

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector('.' + self.CLASS + '-del-all', function (e) {
            TC.confirm(self.getLocaleString('layersRemove.confirm'), function () {
                self.getLayerUIElements()
                    .map(function (li) {
                        return $(li).data(_dataKeys.layer);
                    })
                    .forEach(function (layer) {
                        self.map.removeLayer(layer);
                    });
            });
        }));

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector('.' + self.CLASS + '-btn-info', function (e) {
            const a = e.target;
            var li = a;
            do {
                li = li.parentElement;
            }
            while (li && li.tagName !== 'LI');
            const info = li.querySelector('.' + self.CLASS + '-info');
            const layer = $(li).data(_dataKeys.layer);
            // Cargamos la imagen de la leyenda
            info.querySelectorAll('.' + self.CLASS + '-legend img').forEach(function (img) {
                self.styleLegendImage(img, layer);
            });
            if (info.classList.contains(TC.Consts.classes.HIDDEN)) {
                info.classList.remove(TC.Consts.classes.HIDDEN);
            }
            else {
                info.classList.add(TC.Consts.classes.HIDDEN);
            }

            if (li.querySelector('input[type="checkbox"]').checked) {
                const dragHandle = li.querySelector('.' + self.CLASS + '-dd');
                if (info.classList.contains(TC.Consts.classes.HIDDEN)) {
                    dragHandle.classList.remove(TC.Consts.classes.HIDDEN);
                }
                else {
                    dragHandle.classList.add(TC.Consts.classes.HIDDEN);
                }
            }

            if (a.classList.contains(TC.Consts.classes.CHECKED)) {
                a.classList.remove(TC.Consts.classes.CHECKED);
            }
            else {
                a.classList.add(TC.Consts.classes.CHECKED);
            }
        }));

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector('.' + self.CLASS + '-btn-query', function (e) {
            if (e.target.classList.contains('tc-unavailable') || e.target.classList.contains('tc-loading')) {
                return;
            }
            const a = e.target;
            var li = a;
            do {
                li = li.parentElement;
            }
            while (li && li.tagName !== 'LI');
            const layer = $(li).data(_dataKeys.layer);
            self.queryControl.renderModalDialog(layer);
        }));
    };

    ctlProto.updateLayerVisibility = function (layer) {
        const self = this;
        const li = findLayerElement(self, layer);
        if (li) {
            const visible = layer.getVisibility();
            li.querySelector('input[type="checkbox"]').checked = visible;
            const delBtn = li.querySelector('.' + self.CLASS + '-del');
            const info = li.querySelector('.' + self.CLASS + '-info');
            const dragHandle = li.querySelector('.' + self.CLASS + '-dd');
            if (visible) {
                delBtn.classList.add(TC.Consts.classes.HIDDEN);
                if (info.classList.contains(TC.Consts.classes.HIDDEN)) {
                    dragHandle.classList.remove(TC.Consts.classes.HIDDEN);
                }
            }
            else {
                delBtn.classList.remove(TC.Consts.classes.HIDDEN);
                if (info.classList.contains(TC.Consts.classes.HIDDEN)) {
                    dragHandle.classList.add(TC.Consts.classes.HIDDEN);
                }
            }
        }
    };

    ctlProto.updateLayerTree = function (layer) {
        var self = this;

        var getLegendImgByPost = function (layer) {
            return new Promise(function (resolve, reject) {
                if (layer && layer.options.method && layer.options.method === "POST") {
                    layer.getLegendGraphicImage()
                        .then(function (src) {
                            resolve(src);
                        })
                        .catch(function (err) { TC.error(err); });
                } else {
                    resolve();
                }
            });
        };

        if (!layer.isBase && !layer.options.stealth) {
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            var alreadyExists = false;
            for (var i = 0, len = self.layers.length; i < len; i++) {
                if (layer === self.layers[i]) {
                    alreadyExists = true;
                    break;
                }
            }

            if (!alreadyExists) {
                var template = self.CLASS + '-elm';
                self.layers.push(layer);

                TC.loadJSInOrder(
                    !window.dust,
                    TC.url.templating,
                    function () {
                        var domReadyPromise;
                        var layerTitle = layer.title || layer.wrap.getServiceTitle();
                        var layerData = {
                            title: layer.options.hideTitle ? '' : layerTitle,
                            hide: layer.renderOptions && layer.renderOptions.hide ? true : false,
                            opacity: layer.renderOptions && layer.renderOptions.opacity ? (layer.renderOptions.opacity * 100) : 100,
                            customLegend: layer.customLegend,
                            unremovable: layer.unremovable
                        };
                        var isRaster = layer.isRaster();
                        if (isRaster) {
                            layerData.layerNames = layer.layerNames;
                            var path = layer.getPath();
                            path.shift();
                            layerData.path = path;
                            var name = layer.names[0];
                            var info = layer.wrap.getInfo(name);
                            layerData.legend = info.legend;
                            layerData['abstract'] = info['abstract'];
                            var hasInfo = (info.hasOwnProperty('abstract') || info.hasOwnProperty('legend') || info.hasOwnProperty('metadata'));
                            var metadata;
                            if (layer.tree && layer.tree.children && layer.tree.children.length && layer.tree.children[0].children && layer.tree.children[0].children.length) {
                                metadata = null;
                            }
                            else {
                                metadata = info.metadata;
                                if (metadata) {
                                    for (var j = 0, len = metadata.length; j < len; j++) {
                                        var md = metadata[j];
                                        md.formatDescription = self.getLocaleString(TC.Util.getSimpleMimeType(md.format)) || self.getLocaleString('viewMetadata');
                                    }
                                }
                            }
                            layerData.metadata = metadata;
                            if (self.queries) {
                                domReadyPromise = checkWFSAvailable(layer);
                            }
                        }


                        getLegendImgByPost(layer).then(function (src) {
                            if (src) {
                                legend.src = src; // ya se ha validado en getLegendImgByPost
                            }

                            dust.render(template, layerData, function (err, out) {
                                const parser = new DOMParser();
                                const li = parser.parseFromString(out, 'text/html').body.firstChild;
                                var layerNode;
                                var isGroup = false;
                                if (isRaster) {
                                    isGroup = layer.names.length > 1;
                                    if (!isGroup) {
                                        var layerNodes = layer.wrap.getAllLayerNodes();
                                        for (var i = 0; i < layerNodes.length; i++) {
                                            var node = layerNodes[i];
                                            if (layer.wrap.getName(node) === name) {
                                                layerNode = node;
                                                if (layer.wrap.getLayerNodes(node).length > 0) {
                                                    isGroup = true;
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }

                                const typeElm = li.querySelector('.' + self.CLASS + '-type');
                                const className = isGroup ? self.CLASS + '-type-grp' : self.CLASS + '-type-sgl';
                                typeElm.classList.add(className);

                                if (!hasInfo) {
                                    li.querySelector('.' + self.CLASS + '-btn-info').classList.add(TC.Consts.classes.HIDDEN);
                                }

                                if (layerNode) {
                                    layer.wrap.normalizeLayerNode(layerNode);

                                    dust.render(className, layerNode, function (err, out) {
                                        var tip;
                                        
                                        typeElm.addEventListener('mouseover', function (e) {
                                            const mapDiv = self.map.div;
                                            const typeElmRect = typeElm.getBoundingClientRect();
                                            tip = document.createElement('div');
                                            tip.classList.add(self.CLASS + '-tip');
                                            tip.innerHTML = out;
                                            tip.style.top = (typeElmRect.top - mapDiv.offsetTop) + 'px';
                                            tip.style.right = mapDiv.offsetWidth - (typeElmRect.left - mapDiv.offsetLeft) + 'px';
                                            mapDiv.appendChild(tip);
                                        });
                                        typeElm.addEventListener('mouseout', function (e) {
                                            tip.parentElement.removeChild(tip);
                                        });
                                    });
                                }
                                const ul = self.div.querySelector('ul');
                                $(li).data(_dataKeys.layer, layer);

                                const lis = self.getLayerUIElements();
                                const layerList = self.map.workLayers
                                    .filter(function (l) {
                                        return !l.stealth;
                                    });
                                const layerIdx = layerList.indexOf(layer);
                                var inserted = false;
                                for (var i = 0, ii = lis.length; i < ii; i++) {
                                    const referenceLi = lis[i];
                                    const referenceLayer = $(referenceLi).data(_dataKeys.layer);
                                    const referenceLayerIdx = layerList.indexOf(referenceLayer);
                                    if (referenceLayerIdx < layerIdx) {
                                        referenceLi.insertAdjacentElement('beforebegin', li);
                                        inserted = true;
                                        break;
                                    }
                                }
                                if (!inserted) {
                                    ul.appendChild(li);
                                }
                                if (domReadyPromise) domReadyPromise(li);
                                self.updateScale();
                            });
                        });
                    }
                );

                var elligibleLayersNum = getElligibleLayersNumber(self);
                const numElm = self.div.querySelector('.' + self.CLASS + '-n');
                const emptyElm = self.div.querySelector('.' + self.CLASS + '-empty');
                const contentElm = self.div.querySelector('.' + self.CLASS + '-content');
                numElm.textContent = elligibleLayersNum;
                if (elligibleLayersNum > 0) {
                    numElm.classList.add(TC.Consts.classes.VISIBLE);
                    emptyElm.classList.add(TC.Consts.classes.HIDDEN);
                    contentElm.classList.remove(TC.Consts.classes.HIDDEN);
                }
                else {
                    numElm.classList.remove(TC.Consts.classes.VISIBLE);
                    emptyElm.classList.remove(TC.Consts.classes.HIDDEN);
                    contentElm.classList.add(TC.Consts.classes.HIDDEN);
                }

                const deleteAllElm = self.div.querySelector('.' + self.CLASS + '-del-all');
                if (shouldBeDelAllVisible(self)) {
                    deleteAllElm.classList.remove(TC.Consts.classes.HIDDEN);
                } else {
                    deleteAllElm.classList.add(TC.Consts.classes.HIDDEN);
                }
            }
        }
    };

    ctlProto.updateScale = function () {
        var self = this;
        self.getLayerUIElements().forEach(function (li) {
            var layer = $(li).data(_dataKeys.layer);
            if (layer.names) {
                var isVisible = false;
                for (var i = 0; i < layer.names.length; i++) {
                    if (layer.isVisibleByScale(layer.names[i])) {
                        isVisible = true;
                        break;
                    }
                }
                const notVisibleClass = self.CLASS + '-elm-notvisible';
                if (isVisible) {
                    li.classList.remove(notVisibleClass);
                }
                else {
                    li.classList.add(notVisibleClass);
                }
            }
        });
    };

    ctlProto.updateLayerOrder = function (layer, oldIdx, newIdx) {
        //TC.control.MapContents.prototype.updateLayerOrder.call(this, layer, oldIdx, newIdx);
        const self = this;
        self.map.workLayers
            .filter(function (layer) {
                return !layer.stealth;
            })
            .forEach(function (layer) {
                const li = findLayerElement(self, layer);
                if (li) {
                    li.parentElement.firstChild.insertAdjacentElement('beforebegin', li);
                }
            });
    };

    ctlProto.removeLayer = function (layer) {
        var self = this;
        var idx = self.layers.indexOf(layer);
        if (idx >= 0) {
            self.layers.splice(idx, 1);
        }
        self.getLayerUIElements().forEach(function (li) {
            if ($(li).data(_dataKeys.layer) === layer) {
                li.parentElement.removeChild(li);
            }
        });
        const contentElm = self.div.querySelector('.' + self.CLASS + '-content');
        const emptyElm = self.div.querySelector('.' + self.CLASS + '-empty');
        const numberElm = self.div.querySelector('.' + self.CLASS + '-n');
        var nChildren = getElligibleLayersNumber(self);
        numberElm.textContent = nChildren;
        if (nChildren > 0) {
            contentElm.classList.remove(TC.Consts.classes.HIDDEN);
            emptyElm.classList.add(TC.Consts.classes.HIDDEN);
            numberElm.classList.add(TC.Consts.classes.VISIBLE);
        }
        else {
            if (shouldBeDelAllVisible(self)) {
                self.div.querySelector('.' + self.CLASS + '-del-all').classList.add(TC.Consts.classes.HIDDEN);
            }
            contentElm.classList.add(TC.Consts.classes.HIDDEN);
            emptyElm.classList.remove(TC.Consts.classes.HIDDEN);
            numberElm.classList.remove(TC.Consts.classes.VISIBLE);
        }
    };

    ctlProto.getLayerUIElements = function () {
        const self = this;
        const result = [];
        const children = self.div.querySelector('ul').children;
        for (var i = 0, len = children.length; i < len; i++) {
            child = children[i];
            if (child.matches('li.' + self.CLASS + '-elm')) {
                result[result.length] = child;
            }
        }
        return result;
    };

    //analiza la nueva capa añadida si tiene habilitado o no el WFS
    const checkWFSAvailable = function (layer) {
        var fncResolve = null;
        var domReadyPromise = new Promise(function (resolve, reject) {
            fncResolve = resolve;
        })
        var cssClassUnavailable = 'tc-unavailable';
        
        var queryButton;
        domReadyPromise.then(function (li) {
            queryButton = document.createElement('div');
            queryButton.classList.add(ctlProto.CLASS + '-btn-query');
            queryButton.classList.add(TC.Consts.classes.LOADING);
            queryButton.setAttribute('title', ctlProto.getLocaleString('query.tooltipMagnifBtn'));
            li.querySelector('.' + ctlProto.CLASS + '-btn-info').insertAdjacentElement('afterend', queryButton);
        });
        var getCapProm = layer.getWFSCapabilitiesPromise()
        const noWFSAvailabeManage = function () {
            if (queryButton) {
                queryButton.classList.remove(TC.Consts.classes.LOADING);
                queryButton.classList.add(cssClassUnavailable);
            }
            //queryButton.attr("title", getLocaleString("query.tooltipMagnifBtnDisabled"));
            console.log("El servicio " + (layer.title || layer.tree.title) + " no tiene disponible el WFS");
        }
        Promise.all([getCapProm, domReadyPromise]).then(function () {
            var capabilities = arguments[0][0];
            //comprobamos que la solo es una capa y existe en el capabilities del WFS                        
            if (queryButton) {
                queryButton.classList.remove(TC.Consts.classes.LOADING)
                var layers = layer.getDisgregatedLayerNames();
                if (layers.length === 1 && !capabilities.FeatureTypes.hasOwnProperty(layers[0].substring(layers[0].indexOf(":") + 1))) {
                    queryButton.classList.add(cssClassUnavailable);
                    //queryButton.attr("title", getLocaleString("query.tooltipMagnifBtnDisabled"));
                    console.log("El servicio WFS de " + (layer.title || layer.tree.title) + " no dispone de la capa " + layers[0]);
                }
            }

        }).catch(noWFSAvailabeManage);
        getCapProm.catch(noWFSAvailabeManage);
        return fncResolve;
    }
})();
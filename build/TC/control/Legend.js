TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/MapContents');
}

TC.control.Legend = function () {
    TC.control.MapContents.apply(this, arguments);
};

TC.inherit(TC.control.Legend, TC.control.MapContents);

(function () {
    var ctlProto = TC.control.Legend.prototype;

    ctlProto.CLASS = 'tc-ctl-legend';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Legend.html";
        ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/LegendNode.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "legend" }).w("</h2><div class=\"tc-ctl-legend-tree\"><ul class=\"tc-ctl-legend-branch\">").s(ctx.get(["workLayers"], false), ctx, { "else": body_1, "block": body_2 }, {}).w("</ul></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li class=\"tc-ctl-legend-empty\">").h("i18n", ctx, {}, { "$key": "noData" }).w("</li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.p("tc-ctl-legend-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_2.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.x(ctx.get(["customLegend"], false), ctx, { "else": body_1, "block": body_11 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li ").x(ctx.get(["children"], false), ctx, { "else": body_2, "block": body_3 }, {}).w(" data-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><div class=\"tc-ctl-legend-title\">").f(ctx.get(["title"], false), ctx, "h").w("</div>").x(ctx.get(["legend"], false), ctx, { "block": body_4 }, {}).w("<ul class=\"tc-ctl-legend-branch\">").s(ctx.get(["children"], false), ctx, { "block": body_10 }, {}).w("</ul></li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("class=\"tc-ctl-legend-node tc-ctl-legend-leaf\" "); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("class=\"tc-ctl-legend-node\" "); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("<div class=\"tc-ctl-legend-watch\">").x(ctx.getPath(false, ["legend", "src"]), ctx, { "else": body_5, "block": body_8 }, {}).w("</div><div class=\"tc-ctl-legend-nvr\">").h("i18n", ctx, {}, { "$key": "notVisibleAtCurrentResolution" }).w("</div>"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.x(ctx.getPath(false, ["legend", "width"]), ctx, { "block": body_6 }, {}); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<div class=\"tc-ctl-legend-img\" style=\"border:solid ").f(ctx.getPath(false, ["legend", "strokeWidth"]), ctx, "h").w("px ").f(ctx.getPath(false, ["legend", "strokeColor"]), ctx, "h").w(";background-color:").f(ctx.getPath(false, ["legend", "fillColor"]), ctx, "h").x(ctx.getPath(false, ["legend", "width"]), ctx, { "block": body_7 }, {}).w("\"></div>"); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w(";width:").f(ctx.getPath(false, ["legend", "width"]), ctx, "h").w("px;height:").f(ctx.getPath(false, ["legend", "height"]), ctx, "h").w("px;border-radius:50%"); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("<img src=\"\" data-img=\"").f(ctx.getPath(false, ["legend", "src"]), ctx, "h").w("\" ").x(ctx.getPath(false, ["legend", "width"]), ctx, { "block": body_9 }, {}).w(" />"); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.w("style=\"width:").f(ctx.getPath(false, ["legend", "width"]), ctx, "h").w("px;height:").f(ctx.getPath(false, ["legend", "height"]), ctx, "h").w("px;\" "); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.p("tc-ctl-legend-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_10.__dustBody = !0; function body_11(chk, ctx) { return chk.f(ctx.get(["customLegend"], false), ctx, "h", ["s"]); } body_11.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        const self = this;

        map.on(TC.Consts.event.VIEWCHANGE, function (e) {
            const view = e.view;
            const onLayerAdd = self.loadGraphics.bind(self);

            if (view === TC.Consts.view.THREED) {                
                map.on(TC.Consts.event.LAYERADD, onLayerAdd);
            } else if (view === TC.Consts.view.DEFAULT) {
                map.off(TC.Consts.event.LAYERADD, onLayerAdd);
            }
        });

        return TC.control.MapContents.prototype.register.call(self, map);
    };

    ctlProto.loadGraphics = function () {
        const self = this;
        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);
            if (layer) {
                li.querySelectorAll('li.' + self.CLASS + '-node-visible').forEach(function (l) {
                    const img = l.querySelector('img');
                    if (img && img.getAttribute('src') !== undefined && img.getAttribute('src').length === 0) {
                        self.styleLegendImage(img, layer);
                    }
                });
            }
        });
    };

    ctlProto.updateScale = function () {
        const self = this;
        const inScale = self.CLASS + '-node-inscale';
        const outOfScale = self.CLASS + '-node-outofscale';

        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);

            if (layer) {
                var layersInScale = false;
                li.querySelectorAll('li').forEach(function (l) {
                    if (l.classList.contains(self.CLASS + '-node-visible')) {
                        const uid = l.dataset.layerUid;
                        if (layer.isVisibleByScale(uid)) {
                            layersInScale = true;
                            l.classList.remove(outOfScale);
                            l.classList.add(inScale);
                            const img = l.querySelector('img');
                            if (img) {
                                self.styleLegendImage(img, layer);
                            }
                        }
                        else {
                            l.classList.add(outOfScale);
                            l.classList.remove(inScale);
                        }
                    }
                });
                li.classList.toggle(inScale, layersInScale);
                li.classList.toggle(outOfScale, !layersInScale);
            }
        });
    };

    ctlProto.update = function () {
        const self = this;

        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);
            if (layer) {
                layer.getTree();

                li.querySelectorAll('li').forEach(function (l) {
                    const uid = l.dataset.layerUid;
                    var visible = self.CLASS + '-node-visible';
                    var notVisible = self.CLASS + '-node-notvisible';
                    var hasVisible = self.CLASS + '-node-hasvisible';

                    switch (layer._cache.visibilityStates[uid]) {
                        case TC.Consts.visibility.NOT_VISIBLE:
                            l.classList.remove(visible, hasVisible);
                            l.classList.add(notVisible);                            
                            break;
                        case TC.Consts.visibility.HAS_VISIBLE:
                            l.classList.remove(visible, notVisible);
                            l.classList.add(hasVisible);                            
                            break;
                        default:
                            // visible
                            l.classList.remove(notVisible, hasVisible);
                            l.classList.add(visible);                            
                            break;
                    }
                });

                self.updateLayerVisibility(layer);
            }
        });
        self.updateScale();
    };

    ctlProto.updateLayerTree = function (layer) {
        var self = this;        

        if (!layer.isBase && !layer.options.stealth) {
            
            //// 09/04/2019 GLS: ignoramos el atributo que venga en la capa porque en la leyenda queremos que el árbol se muestre siempre y 
            //// nos ahorramos el tener que pasarlo en el estado del mapa
            if (layer.hideTree || layer.options.hideTree) {
                layer.tree = null;
                layer.hideTree = layer.options.hideTree = false;

                layer._cache.visibilityStates = {};
            }            

            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            self.div.querySelector('.' + self.CLASS + '-empty').classList.add(TC.Consts.classes.HIDDEN);            

            TC.loadJSInOrder(
                !window.dust,
                TC.url.templating,
                function () {
                    dust.render(self.CLASS + '-node', self.layerTrees[layer.id], function (err, out) {
                        const parser = new DOMParser();
                        const newLi = parser.parseFromString(out, 'text/html').body.firstChild;
                        const uid = newLi.dataset.layerUid;
                        const ul = self.div.querySelector('ul.' + self.CLASS + '-branch');
                        const lis = ul.querySelectorAll('li[data-layer-uid="' + uid + '"]');
                        if (lis.length === 1) {
                            const li = lis[0];
                            li.innerHTML = newLi.innerHTML;
                            li.setAttribute('class', newLi.getAttribute('class')); // Esto actualiza si un nodo deja de ser hoja o pasa a ser hoja
                        }
                        else {
                            newLi.dataset.layerId = layer.id;
                            ul.insertBefore(newLi, ul.firstChild);
                        }
                        if (err) {
                            TC.error(err);
                        }
                    });
                    self.update();
                }
            );
        }
    };

    ctlProto.removeLayer = function (layer) {
        if (!layer.isBase) {
            TC.control.MapContents.prototype.removeLayer.call(this, layer);
        }
    };

    ctlProto.updateLayerVisibility = function (layer) {
        var self = this;
        self.getLayerUIElements().forEach(function (li) {
            if (li.dataset.layerId === layer.id) {
                li.classList.toggle(self.CLASS + '-node-notvisible', !layer.getVisibility());
            }
        });
    };

    ctlProto.getLayerUIElements = function () {
        const self = this;
        return self.div.querySelector('ul.' + self.CLASS + '-branch').querySelectorAll('li.' + self.CLASS + '-node');
    };
})();

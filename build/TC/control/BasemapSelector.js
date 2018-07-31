TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/MapContents');
}

(function () {

    TC.control.BasemapSelector = function () {
        var self = this;
        //options = options || {};

        TC.control.MapContents.apply(self, arguments);

        self._$dialogDiv = $(TC.Util.getDiv(self.options.dialogDiv));
        if (!self.options.dialogDiv) {
            self._$dialogDiv.appendTo('body');
        }

        self._$dialogDiv.on(TC.Consts.event.CLICK, 'button', function (e) {
            TC.Util.closeModal();
            const $btn = $(e.target);
            const crs = $btn.data(_dataKeys.PROJCODE);
            const $dialog = self._$dialogDiv.find('.' + self.CLASS + '-crs-dialog');
            const layer = $dialog.data(_dataKeys.LAYER);
            if (layer) {
                if (crs) {
                    TC.loadProjDef({
                        crs: crs,
                        callback: function () {
                            self.map.setProjection({
                                crs: crs,
                                baseLayer: layer
                            });
                        }
                    });
                }
                else {
                    const fallbackLayer = $btn.data(_dataKeys.FALLBACK_LAYER);
                    if (fallbackLayer) {
                        self.map.setBaseLayer(fallbackLayer);
                    }
                }
            }
        });
    };

    TC.inherit(TC.control.BasemapSelector, TC.control.MapContents);

    var ctlProto = TC.control.BasemapSelector.prototype;

    ctlProto.CLASS = 'tc-ctl-bms';

    var _dataKeys = {
        LAYER: 'tcLayer',
        FALLBACK_LAYER: 'tcFallbackLayer',
        PROJCODE: 'tcProjCode'
    };

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/BasemapSelector.html";
        ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/BasemapSelectorNode.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/BasemapSelectorDialog.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "backgroundMaps" }).w("</h2><div class=\"tc-ctl-bms-tree\"><form><ul class=\"tc-ctl-bms-branch\">").s(ctx.get(["baseLayers"], false), ctx, { "block": body_1 }, {}).w("</ul></form></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-bms-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-bms-node\" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><label").x(ctx.get(["legend"], false), ctx, { "block": body_1 }, {}).w("><input type=\"radio\" name=\"bms\" value=\"").f(ctx.get(["name"], false), ctx, "h").w("\"").x(ctx.get(["mustReproject"], false), ctx, { "block": body_2 }, {}).w(" /><span>").f(ctx.get(["title"], false), ctx, "h").w("</span></label></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w(" style=\"background-image: url(").f(ctx.getPath(false, ["legend", "src"]), ctx, "h").w(")\""); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w(" class=\"tc-disabled\""); } body_2.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-bms-crs-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "baseLayerNotCompatible" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p>").h("i18n", ctx, {}, { "$key": "baseLayerNotCompatible.instructions|h" }).w("</p><ul class=\"tc-ctl-bms-crs-list tc-crs-list\"></ul></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;

        TC.control.MapContents.prototype.register.call(self, map);

        map.on(TC.Consts.event.BASELAYERCHANGE + ' ' + TC.Consts.event.PROJECTIONCHANGE, function () {
            self.update();
        });

        self._$div.on('change', 'input[type=radio]', function (e) {
            var $radio = $(e.target);
            var layer = $radio.closest('li').data(_dataKeys.LAYER);
            if (layer != layer.map.getBaseLayer()) {
                if (layer.mustReproject) {
                    self._$currentSelection.prop('checked', true);
                    // Buscamos alternativa
                    const dialogOptions = {
                        layer: layer
                    };
                    const fallbackLayer = layer.getFallbackLayer();
                    if (fallbackLayer) {
                        fallbackLayer._capabilitiesPromise.then(function () {
                            if (fallbackLayer.isCompatible(self.map.crs)) {
                                dialogOptions.fallbackLayer = fallbackLayer;
                            }
                            self.showProjectionChangeDialog(dialogOptions);
                        });
                    }
                    else {
                        self.showProjectionChangeDialog(dialogOptions);
                    }
                    //layer.getCompatibleCRS({ normalized: true });
                }
                else {
                    layer.map.setBaseLayer(layer);
                }
            }
            e.stopPropagation();
        });
    };

    ctlProto.render = function (callback) {
        var self = this;
        TC.control.MapContents.prototype.render.call(self, callback);

        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv.html(html);
        });
    };

    ctlProto.update = function () {
        var self = this;

        self._$currentSelection = null;
        self._$div.find('ul.' + self.CLASS + '-branch').children('li').each(function (idx, elm) {
            var $li = $(elm);
            var layer = $li.data(_dataKeys.LAYER);
            var $radio = $li.find('input[type=radio]').first();
            var checked = self.map.baseLayer === layer || (layer.getFallbackLayer && self.map.baseLayer === layer.getFallbackLayer());
            $radio
                .prop('checked', checked)
                .toggleClass(TC.Consts.classes.DISABLED, layer.mustReproject || false);
            $li.attr('title', layer.mustReproject ? self.getLocaleString('reprojectionNeeded') : null);

            if (checked) {
                self._$currentSelection = $radio;
            }
        });

        self.updateScale();
    };

    ctlProto.updateLayerTree = function (layer) {
        var self = this;
        if (layer.isBase && !layer.options.stealth) {
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            var template = self.CLASS + '-node';
            TC.loadJSInOrder(
                !window.dust,
                TC.url.templating,
                function () {
                    dust.render(template, self.layerTrees[layer.id], function (err, out) {
                        var $newLi = $(out);
                        var uid = $newLi.data('tcLayerUid');
                        var $ul = self._$div.find('.' + self.CLASS + '-branch');
                        var $li = $ul.find('li[data-tc-layer-uid="' + uid + '"]');
                        if ($li.length === 1) {
                            $li.html($newLi.html());
                        }
                        else {
                            $newLi.data(_dataKeys.LAYER, layer);
                            // Insertamos elemento en el lugar correcto, según indica la colección baseLayers
                            const idx = self.map.baseLayers.reduce(function (prev, cur, idx) {
                                if (self.map.baseLayers[idx].id === layer.id) {
                                    return idx;
                                }
                                return prev;
                            }, -1);
                            if (idx < 0) {
                                $ul.append($newLi);
                            }
                            else {
                                const $lis = $ul.find('li');
                                if (idx >= $lis.length) {
                                    $ul.append($newLi);
                                }
                                else {
                                    $newLi.insertBefore($ul.find('li').get(idx));
                                }
                            }
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

    ctlProto.updateLayerOrder = function (layer, oldIdx, newIdx) {
        // Este control no tiene que hacer nada
    };

    ctlProto.removeLayer = function (layer) {
        var self = this;
        if (layer.isBase) {
            var $lis = self._$div.find('.' + self.CLASS + '-branch').children('li');
            $lis.each(function (idx, elm) {
                var $li = $(elm);
                if ($li.data(_dataKeys.LAYER) === layer) {
                    $li.remove();
                    return false;
                }
            });
        }
    };

    ctlProto.showProjectionChangeDialog = function (options) {
        const self = this;
        options = options || {};
        const layer = options.layer;
        const $dialog = self._$dialogDiv.find('.' + self.CLASS + '-crs-dialog');
        $dialog.data(_dataKeys.LAYER, layer);
        const $ul = $dialog
            .find('ul.' + self.CLASS + '-crs-list')
            .empty();
        self.map.loadProjections({
            crsList: self.map.getCompatibleCRS({
                layers: self.map.workLayers.concat(layer)
            }),
            orderBy: 'name'
        }).then(function (projList) {
            projList
                .forEach(function (projObj) {
                    $ul
                        .append($('<li>')
                            .append($('<button>')
                                .html(self.getLocaleString('changeMapToCrs', { crs: projObj.name + ' (' + projObj.code + ')' }))
                                .data(_dataKeys.PROJCODE, projObj.code)));
                });

            if (options.fallbackLayer) {
                $ul
                    .append($('<li>')
                        .append($('<button>')
                            .html(self.getLocaleString('reprojectOnTheFly'))
                            .data(_dataKeys.FALLBACK_LAYER, options.fallbackLayer)));
            }
        });
        $dialog.find('.' + self.CLASS + '-name').html(layer.title || layer.name);
        TC.Util.showModal($dialog);
    };

})();

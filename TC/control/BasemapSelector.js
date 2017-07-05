TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/MapContents');
}

TC.control.BasemapSelector = function () {
    var self = this;

    TC.control.MapContents.apply(self, arguments);
};

TC.inherit(TC.control.BasemapSelector, TC.control.MapContents);

(function () {
    var ctlProto = TC.control.BasemapSelector.prototype;

    ctlProto.CLASS = 'tc-ctl-bms';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/BasemapSelector.html";
        ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/BasemapSelectorNode.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "backgroundMaps" }).w("</h2><div class=\"tc-ctl-bms-tree\"><form><ul class=\"tc-ctl-bms-branch\">").s(ctx.get(["baseLayers"], false), ctx, { "block": body_1 }, {}).w("</ul></form></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-bms-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-bms-node\" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><label").x(ctx.get(["legend"], false), ctx, { "block": body_1 }, {}).w("><input type=\"radio\" name=\"bms\" value=\"").f(ctx.get(["name"], false), ctx, "h").w("\" /><span>").f(ctx.get(["title"], false), ctx, "h").w("</span></label></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w(" style=\"background-size: 100% 100%; background-image: url(").f(ctx.getPath(false, ["legend", "src"]), ctx, "h").w(")\""); } body_1.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;

        TC.control.MapContents.prototype.register.call(self, map);

        map.on(TC.Consts.event.BASELAYERCHANGE, function () {
            self.update();
        });

        self._$div.on('change', 'input[type=radio]', function (e) {
            var $radio = $(e.target);
            if (!Modernizr.canvas) {
                // IE8 support
                self._$div.find('label > span').removeClass(TC.Consts.classes.CHECKED);
                $radio.next().addClass(TC.Consts.classes.CHECKED);
            }
            var layer = $radio.closest('li').data('layer');
            if (layer != layer.map.getBaseLayer()) {
                layer.map.setBaseLayer(layer);
            }
            e.stopPropagation();

        });
    };

    ctlProto.update = function () {
        var self = this;

        self._$div.find('ul.' + self.CLASS + '-branch').children('li').each(function (idx, elm) {
            var $li = $(elm);
            var layer = $li.data('layer');
            var $radio = $li.find('input[type=radio]').first();
            var checked = self.map.baseLayer === layer;
            $radio.prop('checked', checked);
            if (!Modernizr.canvas) {
                // IE8 support
                $radio.next().toggleClass(TC.Consts.classes.CHECKED, checked);
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
                            $newLi.data('layer', layer);
                            $ul.append($newLi);
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
                if ($li.data('layer') === layer) {
                    $li.remove();
                    return false;
                }
            });
        }
    };

})();

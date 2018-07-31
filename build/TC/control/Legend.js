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
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.x(ctx.get(["customLegend"], false), ctx, { "else": body_1, "block": body_11 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li ").x(ctx.get(["children"], false), ctx, { "else": body_2, "block": body_3 }, {}).w(" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><div class=\"tc-ctl-legend-title\">").f(ctx.get(["title"], false), ctx, "h").w("</div>").x(ctx.get(["legend"], false), ctx, { "block": body_4 }, {}).w("<ul class=\"tc-ctl-legend-branch\">").s(ctx.get(["children"], false), ctx, { "block": body_10 }, {}).w("</ul></li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("class=\"tc-ctl-legend-node tc-ctl-legend-leaf\" "); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("class=\"tc-ctl-legend-node\" "); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("<div class=\"tc-ctl-legend-watch\">").x(ctx.getPath(false, ["legend", "src"]), ctx, { "else": body_5, "block": body_8 }, {}).w("</div><div class=\"tc-ctl-legend-nvr\">").h("i18n", ctx, {}, { "$key": "notVisibleAtCurrentResolution" }).w("</div>"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.x(ctx.getPath(false, ["legend", "width"]), ctx, { "block": body_6 }, {}); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<div class=\"tc-ctl-legend-img\" style=\"border:solid ").f(ctx.getPath(false, ["legend", "strokeWidth"]), ctx, "h").w("px ").f(ctx.getPath(false, ["legend", "strokeColor"]), ctx, "h").w(";background-color:").f(ctx.getPath(false, ["legend", "fillColor"]), ctx, "h").x(ctx.getPath(false, ["legend", "width"]), ctx, { "block": body_7 }, {}).w("\"></div>"); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w(";width:").f(ctx.getPath(false, ["legend", "width"]), ctx, "h").w("px;height:").f(ctx.getPath(false, ["legend", "height"]), ctx, "h").w("px;border-radius:50%"); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("<img src=\"\" data-tc-img=\"").f(ctx.getPath(false, ["legend", "src"]), ctx, "h").w("\" ").x(ctx.getPath(false, ["legend", "width"]), ctx, { "block": body_9 }, {}).w(" />"); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.w("style=\"width:").f(ctx.getPath(false, ["legend", "width"]), ctx, "h").w("px;height:").f(ctx.getPath(false, ["legend", "height"]), ctx, "h").w("px;\" "); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.p("tc-ctl-legend-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_10.__dustBody = !0; function body_11(chk, ctx) { return chk.f(ctx.get(["customLegend"], false), ctx, "h", ["s"]); } body_11.__dustBody = !0; return body_0 };
    }

    var _dataKeys = {
        layer: 'tcLayer',
        layerUid: 'tcLayerUid'
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.control.MapContents.prototype.register.call(self, map);
    };

    ctlProto.loadGraphics = function () {
        var self = this;
        self._$div.find('ul.' + self.CLASS + '-branch').first().children('li').not('.' + self.CLASS + '-empty').each(function (idx, elm) {
            var $li = $(elm);
            var layer = $li.data(_dataKeys.layer);
            if (layer) {
                $li.find('li.tc-ctl-legend-node-visible').each(function (i, e) {
                    var $_li = $(e);
                    var $img = $_li.find('img').first();
                    if ($img && $img.attr('src') != undefined && $img.attr('src').length == 0) {
                        self.styleLegendImage($img, layer);
                    }
                });
            }
        });
    };

    ctlProto.updateScale = function () {
        var self = this;
        var inScale = self.CLASS + '-node-inscale';
        var outOfScale = self.CLASS + '-node-outofscale';

        self._$div.find('ul.' + self.CLASS + '-branch').first().children('li').not('.' + self.CLASS + '-empty').each(function (idx, elm) {
            var $li = $(elm);
            var layer = $li.data(_dataKeys.layer);

            if (layer) {
                var layersInScale = false;
                $li.find('li').each(function (i, e) {
                    var $_li = $(e);
                    if ($_li.hasClass(self.CLASS + '-node-visible')) {
                        var uid = $_li.data(_dataKeys.layerUid);
                        if (layer.isVisibleByScale((uid))) {
                            layersInScale = true;
                            $_li.removeClass(outOfScale).addClass(inScale);
                            var $img = $_li.find('img').first();
                            if ($img.length > 0) {
                                self.styleLegendImage($img, layer);
                            }
                        }
                        else {
                            $_li.addClass(outOfScale).removeClass(inScale);
                        }
                    }
                });
                $li.toggleClass(inScale, layersInScale);
                $li.toggleClass(outOfScale, !layersInScale);
            }
        });
    };

    ctlProto.update = function () {
        var self = this;

        self._$div.find('ul.' + self.CLASS + '-branch').first().children('li').each(function (idx, elm) {
            var $li = $(elm);
            var layer = $li.data(_dataKeys.layer);
            if (layer) {
                layer.getTree();

                $li.find('li').each(function (i, e) {
                    var $_li = $(e);
                    var uid = $_li.data(_dataKeys.layerUid);
                    var visible = self.CLASS + '-node-visible';
                    var notVisible = self.CLASS + '-node-notvisible';
                    var hasVisible = self.CLASS + '-node-hasvisible';

                    switch (layer._cache.visibilityStates[uid]) {
                        case TC.Consts.visibility.NOT_VISIBLE:
                            $_li.removeClass(visible + ' ' + hasVisible).addClass(notVisible);
                            break;
                        case TC.Consts.visibility.HAS_VISIBLE:
                            $_li.removeClass(visible + ' ' + notVisible).addClass(hasVisible);
                            break;
                        default:
                            // visible
                            $_li.removeClass(notVisible + ' ' + hasVisible).addClass(visible);
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
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            self._$div.find('.' + self.CLASS + '-empty').addClass(TC.Consts.classes.HIDDEN);

            TC.loadJSInOrder(
                !window.dust,
                TC.url.templating,
                function () {
                    dust.render(self.CLASS + '-node', self.layerTrees[layer.id], function (err, out) {
                        var $newLi = $(out);
                        var uid = $newLi.data(_dataKeys.layerUid);
                        var $ul = self._$div.find('ul.' + self.CLASS + '-branch').first();
                        var $li = $ul.find('li[data-tc-layer-uid="' + uid + '"]');
                        if ($li.length === 1) {
                            $li.html($newLi.html());
                        }
                        else {
                            $newLi.data(_dataKeys.layer, layer);
                            $ul.prepend($newLi);
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
        var self = this;
        var $getLis = function () {
            return self._$div.find('.' + self.CLASS + '-branch').first().children('li').not('.' + self.CLASS + '-empty');
        };
        if (!layer.isBase) {
            var $lis = $getLis();
            $lis.each(function (idx, elm) {
                var $li = $(elm);
                if ($li.data(_dataKeys.layer) === layer) {
                    $li.remove();
                    $lis = $getLis();
                    return false;
                }
            });
            if ($lis.length === 0) {
                self._$div.find('.' + self.CLASS + '-empty').removeClass(TC.Consts.classes.HIDDEN);
            }
        }
    };

    ctlProto.updateLayerVisibility = function (layer) {
        var self = this;
        self._$div.find('.' + self.CLASS + '-branch').first().children('li').each(function (idx, elm) {
            var $li = $(elm);
            if ($li.data(_dataKeys.layer) === layer) {
                $li.toggleClass(self.CLASS + '-node-notvisible', !layer.getVisibility());
                return false;
            }
        });
    };

    ctlProto.getLayerUIElements = function () {
        var self = this;
        return self._$div.find('ul.' + self.CLASS + '-branch').first().children('li.' + self.CLASS + '-node');
    };
})();

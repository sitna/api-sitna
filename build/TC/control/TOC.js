TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/MapContents');
}

TC.control.TOC = function () {
    var self = this;

    TC.control.MapContents.apply(self, arguments);
};

TC.inherit(TC.control.TOC, TC.control.MapContents);

(function () {
    var ctlProto = TC.control.TOC.prototype;

    ctlProto.CLASS = 'tc-ctl-toc';

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/TOC.html";
        ctlProto.template[ctlProto.CLASS + '-branch'] = TC.apiLocation + "TC/templates/TOCBranch.html";
        ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/TOCNode.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "worklayers" }).w("</h2><div class=\"tc-ctl-toc-tree\"><form><div class=\"tc-ctl-toc-empty\">").h("i18n", ctx, {}, { "$key": "noData" }).w("</div><ul class=\"tc-ctl-toc-branch tc-ctl-toc-wl\">").s(ctx.get(["workLayers"], false), ctx, { "block": body_1 }, {}).w("</ul></form></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-toc-wlbranch", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-branch'] = function () { dust.register(ctlProto.CLASS + '-branch', body_0); function body_0(chk, ctx) { return chk.w("<li ").x(ctx.get(["children"], false), ctx, { "else": body_1, "block": body_2 }, {}).w(" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><input type=\"checkbox\" class=\"tc-ctl-toc-branch-cb\" name=\"toc\" value=\"").f(ctx.get(["name"], false), ctx, "h").w("\"").x(ctx.get(["isVisible"], false), ctx, { "block": body_3 }, {}).w(" /><span>").f(ctx.get(["title"], false), ctx, "h").w("</span><ul class=\"tc-ctl-toc-branch\">").s(ctx.get(["children"], false), ctx, { "block": body_4 }, {}).w("</ul></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("class=\"tc-ctl-toc-node tc-ctl-toc-leaf\""); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("class=\"tc-ctl-toc-node\""); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w(" checked"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.p("tc-ctl-toc-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_4.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.w("<li ").x(ctx.get(["children"], false), ctx, { "else": body_1, "block": body_2 }, {}).w(" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><input type=\"checkbox\" name=\"toc\" value=\"").f(ctx.get(["name"], false), ctx, "h").w("\"").x(ctx.get(["isVisible"], false), ctx, { "block": body_3 }, {}).w(" /><span>").f(ctx.get(["title"], false), ctx, "h").w("</span><ul class=\"tc-ctl-toc-branch\">").s(ctx.get(["children"], false), ctx, { "block": body_4 }, {}).w("</ul></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("class=\"tc-ctl-toc-node tc-ctl-toc-leaf\""); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("class=\"tc-ctl-toc-node\""); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w(" checked"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.p("tc-ctl-toc-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_4.__dustBody = !0; return body_0 };
    }

    var _dataKeys = {
        layer: 'tcLayer',
        layerUid: 'tcLayerUid'
    };

    var CLICKEVENT = 'click.tc';

    ctlProto.register = function (map) {
        var self = this;
        TC.control.MapContents.prototype.register.call(self, map);
        self._addBrowserEventHandlers();

        map.on(TC.Consts.event.EXTERNALSERVICEADDED, function (e) {
            if (e && e.layer) {
                e.layer.map = map;
                map.addLayer(e.layer);
                self.updateLayerTree(e.layer);
            }
        });
    };

    ctlProto._addBrowserEventHandlers = function () {
        var self = this;
        self._$div
            .on(CLICKEVENT, 'input[type=checkbox]', function (e) { // No usamos TC.Consts.event.CLICK porque en iPad los eventos touchstart no van bien en los checkbox
                var $cb = $(e.target);
                var layer = $cb.closest('ul.' + self.CLASS + '-wl').children('li').has($cb).data(_dataKeys.layer);
                var uid = $cb.parents('li').first().data(_dataKeys.layerUid);

                var checked = $cb.prop('checked');
                layer.setNodeVisibility(uid, checked);

                e.stopPropagation();
            })
            .on(TC.Consts.event.MOUSEUP, 'li', function (e) {
                var $li = $(e.target);
                if (!$li.hasClass(self.CLASS + '-leaf')) {
                    $li.toggleClass(TC.Consts.classes.COLLAPSED);
                    $li.find('ul').first().toggleClass(TC.Consts.classes.COLLAPSED);
                    e.stopPropagation();
                }
            });
    };

    ctlProto.update = function () {
        var self = this;

        var _getCheckbox = function ($li) {
            return $li.children('input[type=checkbox]');
        };

        var $ul = self._$div.find('ul.' + self.CLASS + '-wl').first();
        $ul.children('li').each(function (idx, elm) {
            var $li = $(elm);
            var layer = $li.data(_dataKeys.layer);
            if (layer) {
                var isVisible = layer.getVisibility();
                _getCheckbox($li).prop('checked', isVisible);

                layer.tree = null;

                $li.find('li').each(function (i, li) {
                    var $_li = $(li);
                    var $cb = _getCheckbox($_li);
                    var uid = $_li.data(_dataKeys.layerUid);
                    switch (layer.getNodeVisibility(uid)) {
                        case TC.Consts.visibility.VISIBLE:
                            $cb.prop('checked', true);
                            $cb.prop('indeterminate', false);
                            break;
                        case TC.Consts.visibility.NOT_VISIBLE_AT_RESOLUTION:
                            $cb.prop('checked', true);
                            $cb.prop('indeterminate', false);
                            break;
                        case TC.Consts.visibility.HAS_VISIBLE:
                            $cb.prop('checked', false);
                            $cb.prop('indeterminate', true);
                            break;
                        default:
                            $cb.prop('checked', false);
                            $cb.prop('indeterminate', false);
                    }
                });
            }
        });

        self.updateScale();
    };

    ctlProto.updateScale = function () {
        var self = this;
        self._$div.find('ul.' + self.CLASS + '-wl').children('li').each(function (idx, elm) {
            var $li = $(elm);
            var layer = $li.data(_dataKeys.layer);
            $li.find('li').each(function (i, e) {
                var $_li = $(e);
                $_li.toggleClass(self.CLASS + '-node-notvisible', !layer.isVisibleByScale($_li.data(_dataKeys.layerUid)));
            });
        });
    };

    ctlProto.updateLayerTree = function (layer) {
        var self = this;

        if (!layer.isBase && !layer.options.stealth) {
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            self._$div.find('.' + self.CLASS + '-empty').addClass(TC.Consts.classes.HIDDEN);

            var template = self.CLASS + '-branch';
            TC.loadJSInOrder(
                !window.dust,
                TC.url.templating,
                function () {
                    dust.render(template, self.layerTrees[layer.id], function (err, out) {
                        var $newLi = $(out);
                        // IE8 support
                        if (!Modernizr.canvas) {
                            $newLi.find('li:last-child').addClass(TC.Consts.classes.LASTCHILD);
                        }
                        var uid = $newLi.data(_dataKeys.layerUid);
                        var $ul = self._$div.find('.' + self.CLASS + '-wl');
                        var $li = $ul.find('li[data-tc-layer-uid="' + uid + '"]');
                        if ($li.length === 1) {
                            $li.html($newLi.html());
                            if (!$li.data(_dataKeys.layer)) {
                                $li.data(_dataKeys.layer, layer);
                            }
                        }
                        else {
                            $newLi.data(_dataKeys.layer, layer);
                            $ul.prepend($newLi);
                        }
                        if (err) {
                            TC.error(err);
                        }
                    });
                    var wl = 'ul.' + self.CLASS + '-wl';
                    var branch = 'ul.' + self.CLASS + '-branch';
                    var node = 'li.' + self.CLASS + '-node';
                    var leaf = 'li.' + self.CLASS + '-leaf';
                    self._$div.find(wl + ' ' + branch + ' ' + branch + ',' + wl + ' ' + branch + ' ' + node).not(leaf).addClass(TC.Consts.classes.COLLAPSED);
                    self.update();
                }
            );
        }
    };

    ctlProto.removeLayer = function (layer) {
        if (!layer.isBase) {
            var self = this;
            var $getLis = function () {
                return self._$div.find('.' + self.CLASS + '-wl').children('li');
            };
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
        self._$div.find('.' + self.CLASS + '-wl').children('li').each(function (idx, elm) {
            var $li = $(elm);
            if ($li.data(_dataKeys.layer) === layer) {
                var isHidden = !layer.getVisibility();
                var $cb = $li.find('input[type=checkbox]');
                var $brcb = $cb.filter('.' + self.CLASS + '-branch-cb');
                $brcb.prop('checked', !isHidden);
                $cb.not($brcb).prop('disabled', isHidden);
                return false;
            }
        });
    };

    ctlProto.updateLayerOrder = function (layer, oldIdx, newIdx) {
        // Este control no tiene que hacer nada
    };

    ctlProto.render = function (callback) {
        var self = this;

        TC.Control.prototype.render.call(self, function () {

            var controlOptions = self.options.controls || [];

            if (controlOptions.length > 0) {
                var ctl = controlOptions[0];
                var newDiv = $('<div/>');
                self._$div.append(newDiv);
                self.map.addControl(ctl.name, $.extend({ 'div': newDiv }, ctl.options));
            }

            if ($.isFunction(callback)) {
                callback();
            }
        });
    };
})();

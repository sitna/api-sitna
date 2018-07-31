TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Attribution = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    self.apiAttribution = '';
    self.mainDataAttribution = '';
    self.dataAttributions = [];
    if (self.options.dataAttributions) {
        self.dataAttributions = self.options.dataAttributions instanceof Array ? self.options.dataAttributions : [self.options.dataAttributions];
    }
};

TC.inherit(TC.control.Attribution, TC.Control);

(function () {
    var ctlProto = TC.control.Attribution.prototype;

    ctlProto.CLASS = 'tc-ctl-attrib';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/Attribution.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div><span>&copy; ").f(ctx.get(["api"], false), ctx, "h", ["s"]).w("</span> - ").h("i18n", ctx, {}, { "$key": "data" }).w(": ").x(ctx.getPath(false, ["mainData", "site"]), ctx, { "else": body_1, "block": body_2 }, {}).x(ctx.get(["otherData"], false), ctx, { "block": body_3 }, {}).w("<div class=\"tc-ctl-attrib-other tc-collapsed\">").s(ctx.get(["otherData"], false), ctx, { "block": body_4 }, {}).w("</div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<span>&copy; ").f(ctx.getPath(false, ["mainData", "name"]), ctx, "h").w("</span>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<span>&copy; <a href=\"").f(ctx.getPath(false, ["mainData", "site"]), ctx, "h").w("\" target=\"_blank\">").f(ctx.getPath(false, ["mainData", "name"]), ctx, "h").w("</a></span>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w(" - <span class=\"tc-ctl-attrib-cmd\">").h("i18n", ctx, {}, { "$key": "others" }).w("...</span>"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.x(ctx.getPath(false, ["otherData", ctx.get(["$idx"], false), "site"]), ctx, { "else": body_5, "block": body_6 }, {}).h("sep", ctx, { "block": body_7 }, {}); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<span>&copy; ").f(ctx.getPath(false, ["otherData", ctx.get(["$idx"], false), "name"]), ctx, "h").w("</span>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<span>&copy; <a href=\"").f(ctx.getPath(false, ["otherData", ctx.get(["$idx"], false), "site"]), ctx, "h").w("\" target=\"_blank\">").f(ctx.getPath(false, ["otherData", ctx.get(["$idx"], false), "name"]), ctx, "h").w("</a></span>"); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w(", "); } body_7.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        self.apiAttribution = self.map.options.attribution || self.apiAttribution;

        var addData = function (layer) {
            if (layer) {
                // TODO: sanitizer
                var attr = layer.wrap.getAttribution(TC.capabilities[layer.url]);
                if (attr) {
                    if (/IDENA/.test(attr.name)) {
                        self.mainDataAttribution = {
                            name: 'IDENA',
                            site: 'http://idena.navarra.es/'
                        };
                    }
                    else {
                        var textExists = false;
                        for (var i = 0; i < self.dataAttributions.length; i++) {
                            if (attr.name === self.dataAttributions[i].name) {
                                textExists = true;
                                break;
                            }
                        }
                        if (!textExists) {
                            self.dataAttributions.push(attr);
                        }
                    }
                }
            }
        };

        var removeData = function (layer) {
            if (layer) {

                var checkRemoveData = function () {
                    if (layer.map.workLayers.length > 0) {
                        var _wl = layer.map.workLayers.slice().reverse();
                        for (var i = 0; i < _wl.length; i++) {
                            if (_wl[i].url == layer.url && _wl[i].getVisibility())
                                return false;
                        }

                        return true;
                    }

                    return true;
                };

                if (checkRemoveData()) {
                    // TODO: sanitizer
                    var attr = layer.wrap.getAttribution(TC.capabilities[layer.url]);

                    if (attr) {
                        var index = self.dataAttributions.reduce(function (prev, cur, idx) {
                            if (cur.name === attr.name) {
                                return idx;
                            }
                            return prev;
                        }, -1);
                        if (index > -1) {
                            self.dataAttributions.splice(index, 1);
                        }
                    }
                }
            }
        };

        self.render();

        map.on(TC.Consts.event.LAYERADD, function (e) {
            if (e.layer.wrap.getAttribution) {
                addData(e.layer);
                self.render();
            }
        });
        map.on(TC.Consts.event.LAYERREMOVE, function (e) {
            if (e.layer.wrap.getAttribution) {
                removeData(e.layer);
                self.render();
            }
        });
        map.on(TC.Consts.event.LAYERVISIBILITY, function (e) {
            if (e.layer.wrap.getAttribution) {
                if (e.layer.getVisibility()) {
                    addData(e.layer);
                } else {
                    removeData(e.layer);
                }
                self.render();
            }
        });
    };

    ctlProto.render = function (callback) {
        var self = this;
        self.renderData({ api: self.apiAttribution, mainData: self.mainDataAttribution, otherData: self.dataAttributions }, function () {
            self._$div.find('.' + self.CLASS + '-cmd').on(TC.Consts.event.CLICK, function () {
                self._$div.find('.' + self.CLASS + '-other').toggleClass(TC.Consts.classes.COLLAPSED);
            });

            if ($.isFunction(callback)) {
                callback();
            }
        });
    };

})();

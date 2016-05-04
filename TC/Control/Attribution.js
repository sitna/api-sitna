TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

TC.control.Attribution = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    self.apiAttribution = '';
    self.mainDataAttribution = '';
    self.dataAttributions = [];
};

TC.inherit(TC.control.Attribution, TC.Control);

(function () {
    var ctlProto = TC.control.Attribution.prototype;

    ctlProto.CLASS = 'tc-ctl-attrib';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/Attribution.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div><span>&copy; ").f(ctx.get(["api"], false), ctx, "h", ["s"]).w("</span> - ").h("i18n", ctx, {}, { "$key": "data" }).w(": <span>").f(ctx.get(["mainData"], false), ctx, "h", ["s"]).w("</span>").x(ctx.get(["otherData"], false), ctx, { "block": body_1 }, {}).w("<div class=\"tc-ctl-attrib-other tc-collapsed\">").s(ctx.get(["otherData"], false), ctx, { "block": body_2 }, {}).w("</div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w(" - <span class=\"tc-ctl-attrib-cmd\">").h("i18n", ctx, {}, { "$key": "other" }).w("</span>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<span>").f(ctx.getPath(false, ["otherData", ctx.get(["$idx"], false)]), ctx, "h", ["s"]).w("</span>").h("sep", ctx, { "block": body_3 }, {}); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w(", "); } body_3.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        self.apiAttribution = self.map.options.attribution || self.apiAttribution;

        var addData = function (layer) {
            if (layer) {
                var attr = $("<div/>").html($.trim(layer.wrap.getAttribution(TC.capabilities[layer.url]))).text();
                if (attr) {
                    if (/^IDENA /.test(attr)) {
                        self.mainDataAttribution = '<a href="http://idena.navarra.es/" target="_blank">IDENA</a>';
                    }
                    else {
                        var textExists = false;
                        for (var i = 0; i < self.dataAttributions.length; i++) {
                            if (attr === self.dataAttributions[i]) {
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
                        var _wl = layer.map.workLayers.reverse();
                        for (var i = 0; i < _wl.length; i++) {
                            if (_wl[i].url == layer.url && _wl[i].getVisibility())
                                return false;                        
                        }

                        return true;
                    }

                    return true;
                };

                if (checkRemoveData()) {
                    var attr = $("<div/>").html($.trim(layer.wrap.getAttribution(TC.capabilities[layer.url]))).text();

                    if (attr) {
                        var index = self.dataAttributions.indexOf(attr);
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

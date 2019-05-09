TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Attribution = function () {
    const self = this;

    TC.Control.apply(self, arguments);

    self.apiAttribution = '';
    self.mainDataAttribution = null;
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
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div><span>&copy; ").f(ctx.get(["api"], false), ctx, "h", ["s"]).w("</span>").x(ctx.get(["mainData"], false), ctx, { "block": body_1 }, {}).x(ctx.get(["otherData"], false), ctx, { "block": body_5 }, {}).w("<div class=\"tc-ctl-attrib-other ").x(ctx.get(["isCollapsed"], false), ctx, { "block": body_6 }, {}).w("\">").s(ctx.get(["otherData"], false), ctx, { "block": body_7 }, {}).w("</div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w(" - ").h("i18n", ctx, {}, { "$key": "data" }).w(":").x(ctx.getPath(false, ["mainData", "site"]), ctx, { "else": body_2, "block": body_4 }, {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.x(ctx.getPath(false, ["mainData", "name"]), ctx, { "block": body_3 }, {}); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<span> &copy; ").f(ctx.getPath(false, ["mainData", "name"]), ctx, "h").w("</span>"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("<span> &copy; <a href=\"").f(ctx.getPath(false, ["mainData", "site"]), ctx, "h").w("\" target=\"_blank\">").f(ctx.getPath(false, ["mainData", "name"]), ctx, "h").w("</a></span>"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w(" - <span class=\"tc-ctl-attrib-cmd\">").h("i18n", ctx, {}, { "$key": "others" }).w("...</span>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w(" tc-collapsed "); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.x(ctx.getPath(false, ["otherData", ctx.get(["$idx"], false), "site"]), ctx, { "else": body_8, "block": body_9 }, {}).h("sep", ctx, { "block": body_10 }, {}); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("<span>&copy; ").f(ctx.getPath(false, ["otherData", ctx.get(["$idx"], false), "name"]), ctx, "h").w("</span>"); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.w("<span>&copy; <a href=\"").f(ctx.getPath(false, ["otherData", ctx.get(["$idx"], false), "site"]), ctx, "h").w("\" target=\"_blank\">").f(ctx.getPath(false, ["otherData", ctx.get(["$idx"], false), "name"]), ctx, "h").w("</a></span>"); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.w(", "); } body_10.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);

        self.apiAttribution = self.map.options.attribution || self.apiAttribution;

        var addData = function (obj) {
            if (obj) {
                // TODO: sanitizer
                var attr = obj.getAttribution();
                if (attr) {
                    if (/IDENA/.test(attr.name) || /Tracasa Instrumental/.test(attr.name)) {
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

        var removeData = function (obj) {
            if (obj) {

                var checkRemoveData = function () {
                    if (obj.map.workLayers.length > 0) {
                        var _wl = obj.map.workLayers.slice().reverse();
                        for (var i = 0; i < _wl.length; i++) {
                            if (_wl[i].url == obj.url && _wl[i].getVisibility())
                                return false;
                        }

                        return true;
                    }

                    return true;
                };

                if (obj instanceof TC.Layer ? checkRemoveData() : true) {
                    // TODO: sanitizer
                    var attr = obj.getAttribution();

                    if (attr) {
                        var index = self.dataAttributions.reduce(function (prev, cur, idx) {
                            if (cur.name === attr.name) {
                                return idx;
                            }
                            return prev;
                        }, -1);

                        const checkIsSameAttribution = function (toCheckName) {
                            return (/IDENA/.test(attr.name) || /Tracasa Instrumental/.test(attr.name)) &&
                                (/IDENA/.test(toCheckName) || /Tracasa Instrumental/.test(toCheckName)) ||
                                    (attr.name === toCheckName);
                        };

                        // Validamos si las atribuciones a borrar son también del mapa base
                        if (self.map.baseLayer && self.map.baseLayer.wrap.getAttribution() && checkIsSameAttribution(self.map.baseLayer.wrap.getAttribution().name)) {
                            return;
                        } else {
                            // Validamos si las atribuciones a borrar son también de alguna de las capas raster cargadas
                            if (self.map.workLayers.filter(function (layer) {
                                return layer.type === TC.Consts.layerType.WMS || layer.type === TC.Consts.layerType.WMTS;
                            }).some(function (layer) {
                                var workLayerAttribution = layer.wrap.getAttribution();
                                return workLayerAttribution && checkIsSameAttribution(workLayerAttribution.name);
                            })) {
                                return;
                            }
                        }

                        if (index > -1) {
                            self.dataAttributions.splice(index, 1);
                        } else if (/IDENA/.test(attr.name) || /Tracasa Instrumental/.test(attr.name)) {
                            self.mainDataAttribution = null;
                        }
                    }
                }
            }
        };

        self.render();

        map.loaded(function () {
            if (map.baseLayer.wrap.getAttribution) {
                addData(map.baseLayer.wrap);
                self.render();
            }
        });

        map.on(TC.Consts.event.LAYERADD, function (e) {
            const layer = e.layer;
            if (!layer.isBase && layer.wrap.getAttribution) {
                addData(layer.wrap);
                self.render();
            }
        });

        map.on(TC.Consts.event.BEFOREBASELAYERCHANGE + " " + TC.Consts.event.OVERVIEWBASELAYERCHANGE, function (e) {
            const type = e.type;
            const newLayer = e.newLayer;
            const oldLayer = e.oldLayer;
            if (TC.Consts.event.OVERVIEWBASELAYERCHANGE.indexOf(type) > -1) {
                self.ignoreLayer = newLayer;
            }

            if (oldLayer && oldLayer.wrap.getAttribution) {
                removeData(oldLayer.wrap);
            }

            if (newLayer && newLayer.wrap.getAttribution) {
                addData(newLayer.wrap);
            }

            self.render();
        });

        map.on(TC.Consts.event.LAYERREMOVE, function (e) {
            const layer = e.layer;
            if (layer.wrap.getAttribution) {
                removeData(layer.wrap);
                self.render();
            }
        });

        map.on(TC.Consts.event.TERRAINPROVIDERADD, function (e) {
            const terrainProvider = e.terrainProvider;
            if (terrainProvider.getAttribution) {
                addData(terrainProvider);
                self.render();
            }
        });

        map.on(TC.Consts.event.TERRAINPROVIDERREMOVE, function (e) {
            const terrainProvider = e.terrainProvider;
            if (terrainProvider.getAttribution) {
                removeData(terrainProvider);
                self.render();
            }
        });

        map.on(TC.Consts.event.LAYERVISIBILITY, function (e) {
            const layer = e.layer;
            if (self.ignoreLayer === layer) {
                return;
            }

            if (layer.wrap.getAttribution) {
                if (layer.getVisibility()) {
                    addData(layer.wrap);
                } else {
                    removeData(layer.wrap);
                }
                self.render();
            }
        });

        return result;
    };

    ctlProto.render = function (callback) {
        const self = this;

        return self._set1stRenderPromise(self.renderData({
            api: self.apiAttribution,
            mainData: self.mainDataAttribution,
            otherData: self.dataAttributions,
            isCollapsed: self.div.querySelector('.' + self.CLASS + '-other') ? self.div.querySelector('.' + self.CLASS + '-other').classList.contains(TC.Consts.classes.COLLAPSED) : true
        }, function () {
            const cmd = self.div.querySelector('.' + self.CLASS + '-cmd');
            cmd && cmd.addEventListener(TC.Consts.event.CLICK, function () {
                self.toggleOtherAttributions();
            });

            if (typeof callback === 'function') {
                callback();
            }
        }));
    };

    ctlProto.toggleOtherAttributions = function () {
        const self = this;
        const other = self.div.querySelector('.' + self.CLASS + '-other');
        if (other.classList.contains(TC.Consts.classes.COLLAPSED)) {
            other.classList.remove(TC.Consts.classes.COLLAPSED);
        }
        else {
            other.classList.add(TC.Consts.classes.COLLAPSED);
        }
    };
})();

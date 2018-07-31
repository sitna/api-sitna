TC.control = TC.control || {};
TC.Consts = TC.Consts || {};
TC.Consts.SCREEN_SIZE_KEY = 'TC.Map.screenSize';

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Scale = function () {
    TC.Control.apply(this, arguments);
};

TC.inherit(TC.control.Scale, TC.Control);

(function () {
    var ctlProto = TC.control.Scale.prototype;

    ctlProto.CLASS = 'tc-ctl-scl';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/Scale.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div class=\"ol-scale-line ol-unselectable\"><span>1:").h("math", ctx, {}, { "key": body_1, "method": "round" }).w("</span> <input type=\"button\" value=\"").f(ctx.get(["screenSize"], false), ctx, "h").w("''\" title=\"").h("i18n", ctx, {}, { "$key": "estimatedMapSize" }).w("\" /></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.f(ctx.get(["scale"], false), ctx, "h"); } body_1.__dustBody = !0; return body_0 };
    }

    ctlProto.render = function (callback) {
        var self = this;
        $('input[type=button]', self._$div).off();
        self.renderData({ scale: self.getScale(), screenSize: TC.Cfg.screenSize }, function () {

            var $span = self._$div.find('span')
            $span.text('1:' + self.format($span.text().substr(2)));

            self._$div.find('input[type="button"]').on(TC.Consts.event.CLICK, function () { self.setScreenSize.call(self); });

            if ($.isFunction(callback)) {
                callback();
            }
        });
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);
        var screenSize = TC.Util.storage.getLocalValue(TC.Consts.SCREEN_SIZE_KEY);
        if (screenSize) {
            TC.Cfg.screenSize = screenSize;
        }
        self.render(function () {
            map.on(TC.Consts.event.ZOOM, function () {
                delete self.metersPerDegree;
                self.update();
            });
        });
    };

    ctlProto.update = function () {
        this.render();
    };

    /*
     *  setScreenSize: Prompts for screen size in inches, updates and stores value
     */
    ctlProto.setScreenSize = function () {
        var self = this;
        TC.prompt(self.getLocaleString('selectScreenSize'), TC.Cfg.screenSize, function (value) {
            if (value) {
                TC.Cfg.screenSize = parseFloat(value);
                TC.Util.storage.setLocalValue(TC.Consts.SCREEN_SIZE_KEY, TC.Cfg.screenSize);
                self.update();
            }
        });
    };

    /*
     *  getScale: Gets scale denominator with a resolution or current map resolution and estimated screen DPI
     *  Parameters: number (optional), the resolution to get scale from. If no parameter is given, current map resolution is used
     *  Returns: number
     */
    ctlProto.getScale = function (resolution) {
        var self = this;
        var result = 0;
        var res = (!resolution && self.map) ? self.map.wrap.getResolution() : resolution;
        if (res) {
            result = res * self.getDpi(TC.Cfg.screenSize) / .0254;
            if (window.devicePixelRatio) {
                result = result * window.devicePixelRatio;
            }
        }
        if (self.map && self.map.wrap.isGeo()) {
            if (!self.metersPerDegree) {
                var extent = self.map.getExtent();
                if (extent) {
                    self.metersPerDegree = TC.Util.getMetersPerDegree(extent);
                }
            }
            if (self.metersPerDegree) {
                result = result * self.metersPerDegree;
            }
        }
        return result;
    };

    /*
     *  getDpi: Gets estimated DPI based on screen resolution and screenSize value
     *  Returns: number
     */
    ctlProto.getDpi = function (screenSize) {
        var self = this;
        self.dpi = Math.sqrt(screen.width * screen.width + screen.height * screen.height) / screenSize;
        return self.dpi;
    };


    ctlProto.format = function (number) {
        var n = (new Number(number)).toFixed(0);
        var a = [];
        while (n.length > 3) {
            var l = n.length - 3;
            a.unshift(n.substr(l));
            n = n.substr(0, l);
        }
        if (n) {
            a.unshift(n);
        }
        return a.join('.');
    };

})();
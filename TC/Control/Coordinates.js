TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

TC.control.Coordinates = function () {
    var self = this;

    self.crs = '';
    self.xy = [0, 0];
    self.latLon = [0, 0];
    self.units = 'm';
    self.isGeo = false;

    TC.Control.apply(self, arguments);
    self.geoCrs = self.options.geoCrs || TC.Cfg.geoCrs;
};

TC.inherit(TC.control.Coordinates, TC.Control);

(function () {
    var ctlProto = TC.control.Coordinates.prototype;
    
    ctlProto.CLASS = 'tc-ctl-coords';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/Coordinates.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div>CRS: <span class=\"tc-ctl-coords-crs\">").f(ctx.get(["crs"], false), ctx, "h").w("</span></div><div class=\"tc-ctl-coords-xy\">").x(ctx.get(["isGeo"], false), ctx, { "else": body_1, "block": body_2 }, {}).w("</div>").x(ctx.get(["showGeo"], false), ctx, { "block": body_3 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("X: <span class=\"tc-ctl-coords-x\">").f(ctx.get(["x"], false), ctx, "h").w("</span> Y: <span class=\"tc-ctl-coords-y\">").f(ctx.get(["y"], false), ctx, "h").w("</span>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-coords-lat\">").f(ctx.get(["lat"], false), ctx, "h").w("</span> ").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-coords-lon\">").f(ctx.get(["lon"], false), ctx, "h").w("</span>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<div class=\"tc-ctl-coords-alt\">CRS: <span class=\"tc-ctl-coords-geocrs\">").f(ctx.get(["geoCrs"], false), ctx, "h").w("</span></div><div class=\"tc-ctl-coords-xy\">").h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-coords-lat\">").f(ctx.get(["lat"], false), ctx, "h").w("</span> ").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-coords-lon\">").f(ctx.get(["lon"], false), ctx, "h").w("</span></div>"); } body_3.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        self.crs = self.map.crs;

        if (!self.wrap) {
            self.wrap = new TC.wrap.control.Coordinates(self);
        }
        self.clear();
        map.loaded(function () {
            // Se espera antes de registrar el control a que se cargue el mapa para evitar que muestre valores extraños
            self.wrap.register(map).then(function () {
        self.render(function () {
            self.update();
            self.clear();
        });
            });
        });
    };

    ctlProto.render = function (callback) {
        var self = this;
        self.renderData({
            x: self.xy[0],
            y: self.xy[1],
            lat: self.latLon[0],
            lon: self.latLon[1],
            crs: self.crs,
            geoCrs: self.geoCrs,
            isGeo: self.isGeo,
            showGeo: self.options.showGeo
        }, function () {
            self.$crs = self._$div.find('.' + self.CLASS + '-crs');
            self.$geoCrs = self._$div.find('.' + self.CLASS + '-geocrs');
            self.$x = self._$div.find('.' + self.CLASS + '-x');
            self.$y = self._$div.find('.' + self.CLASS + '-y');
            self.$lat = self._$div.find('.' + self.CLASS + '-lat');
            self.$lon = self._$div.find('.' + self.CLASS + '-lon');

            if ($.isFunction(callback)) {
                callback();
            }
        });
    };


    ctlProto.formatCoord = function (x, nDecimales)
    {
        var result;
        result = x.toFixed(nDecimales);
        if (nDecimales <= 3) {
            result = result.replace(/\B(?=(\d{3})+(?!\d))/g, "|");
        }
        result = result.replace(".", ",").replace(/\|/g, ".");
        return result;
    };

    ctlProto.update = function () {
        var self = this;

        //a veces está sin renderizar.
        //ignorar; para la próxima probablemente estará bien
        if (self.$crs)
        {
            if (!self.isGeo && self.options.showGeo) {
                self.latLon = TC.Util.reproject(self.xy, self.crs, self.geoCrs).reverse();
            }
            self.$crs.text(self.crs);
            self.$geoCrs.text(self.geoCrs);
            if (!self.isGeo) {
                self.$x.text(self.formatCoord(self.xy[0], TC.Consts.METER_PRECISION));
                self.$y.text(self.formatCoord(self.xy[1], TC.Consts.METER_PRECISION));
            }
            if (self.isGeo || self.options.showGeo) {
                self.$lat.text(self.formatCoord(self.latLon[0], TC.Consts.DEGREE_PRECISION));
                self.$lon.text(self.formatCoord(self.latLon[1], TC.Consts.DEGREE_PRECISION));
            }
            self._$div.removeClass(TC.Consts.classes.HIDDEN);
        }
    };

    ctlProto.clear = function () {
        var self = this;
        self._$div.addClass(TC.Consts.classes.HIDDEN);
    };

})();
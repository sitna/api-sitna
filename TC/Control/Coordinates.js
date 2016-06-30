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
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div>CRS: <span class=\"tc-ctl-coords-crs\">").f(ctx.get(["crs"], false), ctx, "h").w("</span></div><div class=\"tc-ctl-coords-xy\">").x(ctx.get(["isGeo"], false), ctx, { "else": body_1, "block": body_2 }, {}).w("</div>").x(ctx.get(["showGeo"], false), ctx, { "block": body_3 }, {}).w("<!--se inserta en el div del mapa--><div class=\"tc-ctl-coords-showCoords tc-hidden\"><div class=\"tc-ctl-coords-icon-cross\" style=\"display: none;\"></div><button class=\"tc-button tc-icon-button\" title=\"").h("i18n", ctx, {}, { "$key": "geo.coords" }).w("\"></button></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("X: <span class=\"tc-ctl-coords-x\">").f(ctx.get(["x"], false), ctx, "h").w("</span> Y: <span class=\"tc-ctl-coords-y\">").f(ctx.get(["y"], false), ctx, "h").w("</span>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-coords-lat\">").f(ctx.get(["lat"], false), ctx, "h").w("</span> ").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-coords-lon\">").f(ctx.get(["lon"], false), ctx, "h").w("</span>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<div class=\"tc-ctl-coords-alt\">CRS: <span class=\"tc-ctl-coords-geocrs\">").f(ctx.get(["geoCrs"], false), ctx, "h").w("</span></div><div class=\"tc-ctl-coords-xy\">").h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-coords-lat\">").f(ctx.get(["lat"], false), ctx, "h").w("</span> ").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-coords-lon\">").f(ctx.get(["lon"], false), ctx, "h").w("</span></div>"); } body_3.__dustBody = !0; return body_0 };
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

            if (!TC.Util.detectMouse()) {
                $.when(map.addLayer({
                    id: TC.getUID(),
                    type: TC.Consts.layerType.VECTOR,
                    stealth: true,
                    title: 'Coordenadas',
                })).then(function (layer) {
                    self.layer = layer;
                });
            }
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

            //Sólo visible en modo "móvil"
            if (!TC.Util.detectMouse()) {
                self.$mobileDiv = self._$div.find('.' + self.CLASS + '-showCoords');
                self.$button = self._$div.find('.' + self.CLASS + '-showCoords button');
                self.$textCoords = self._$div.find('.' + self.CLASS + '-showCoords-txt');

                self.$mobileDiv.toggleClass(TC.Consts.classes.HIDDEN, false);

                self.$button.on('click', function () {

                    if ($(this).hasClass(self.CLASS + '-active')) {
                        self.deactivateCoords();
                    } else {
                        self.activateCoords();
                    }
                });

                self.$mobileDiv.appendTo(self.map._$div);
            }

            if ($.isFunction(callback)) {
                callback();
            }
        });
    };


    ctlProto.formatCoord = function (x, nDecimales) {
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
        if (self.$crs) {
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

            if (TC.Util.detectMouse()) {
                self._$div.removeClass(TC.Consts.classes.HIDDEN);
            }
        }
    };

    ctlProto.clear = function () {
        var self = this;

        if (TC.Util.detectMouse()) {
            self._$div.addClass(TC.Consts.classes.HIDDEN);
        }
    };

    ctlProto.deactivateCoords = function () {
        var self = this;

        self.$button.removeClass(self.CLASS + '-active');
        self._$div.toggleClass(TC.Consts.classes.HIDDEN, true);
        self.clear();

        self.wrap.coordsDeactivate();
        self.cleanCoordsPointer();
    };

    ctlProto.cleanCoordsPointer = function () {
        var self = this;

        delete self.currentCoordsMarker;

        $.when(self.getLayer()).then(function (layer) {
            if (layer)
                layer.clearFeatures();
        });
    };

    ctlProto.activateCoords = function () {
        var self = this;

        self.$button.toggleClass(self.CLASS + '-active');
        self._$div.toggleClass(TC.Consts.classes.HIDDEN, false);
        self.getCoords();
        self.wrap.coordsActivate();
    };

    ctlProto.getCoords = function () {
        var self = this;
        if (self.$button.hasClass(self.CLASS + '-active')) {

            // si hay visible un popup, establecemos la posición de la cruz en el punto en el cual se ha abierto el popup
            var popup = self.map.getControlsByClass(TC.control.Popup);
            if (popup && popup.length > 0 && popup[0].isVisible()) {
                self.coordsToPopup(popup[0]);
            }
            else { // si no hay popup, calculamos el centro del mapa                
                self.updateCoordsCtrl([(self.map.getExtent()[0] + self.map.getExtent()[2]) / 2, (self.map.getExtent()[1] + self.map.getExtent()[3]) / 2]);

                self.coordsToClick.call(self, { coordinate: self.xy });
            }
        }
    };

    ctlProto.coordsToPopup = function (popup) {
        var self = this;

        if (popup) {
            self.updateCoordsCtrl(popup.wrap.popup.getPosition());
        }
    };

    ctlProto.updateCoordsCtrl = function (position) {
        var self = this;

        if (position) {
            self.x = position[0];
            self.y = position[1];
            self.xy = [self.x, self.y];

            self.update();
        }
    };

    // Establece la posición de la cruz en la posición recibida
    ctlProto.coordsToClick = function (e) {
        var self = this;

        self.updateCoordsCtrl(e.coordinate);
        self.coordsMarkerAdd(e.coordinate);
    };

    ctlProto.coordsMarkerAdd = function (position) {
        var self = this;

        if (!self.currentCoordsMarker) {
            $.when(self.getLayer()).then(function (layer) {
                if (layer) {
                    $.when(layer.addMarker(position, { title: 'Coord', cssClass: TC.Consts.classes.POINT, anchor: [0.5, 0.5] }))
                        .then(function (marker) {
                            self.currentCoordsMarker = marker;
                        });
                }
            });
        } else {
            self.currentCoordsMarker.setCoords(position);
        }
    };

    ctlProto.getLayer = function () {
        var self = this;
        var done = new $.Deferred();
        if (self.layer == undefined) {
            $.when(self.map.addLayer({
                id: TC.getUID(),
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                title: 'Coordenadas',
            })).then(function (layer) {
                self.layer = layer;
                self.layer.map.putLayerOnTop(self.layer);
                done.resolve(self.layer);
            });
        } else done.resolve(self.layer);
        return done;
    };
})();
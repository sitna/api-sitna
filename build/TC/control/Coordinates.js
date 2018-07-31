TC.control = TC.control || {};

if (!TC.control.ProjectionSelector) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/ProjectionSelector');
}

(function () {
    TC.control.Coordinates = function (options) {
        var self = this;
        options = options || {};

        self.crs = '';
        self.xy = [0, 0, 0];
        self.latLon = [0, 0, 0];
        self.x = 0;
        self.y = 0;
        self.lat = 0;
        self.lon = 0;
        self.units = 'm';
        self.isGeo = false;

        TC.control.ProjectionSelector.apply(self, arguments);

        $.extend(self._cssClasses, {
            CRS: self.CLASS + '-crs',
            GEOCRS: self.CLASS + '-geocrs',
            X: self.CLASS + '-x',
            Y: self.CLASS + '-y',
            LAT: self.CLASS + '-lat',
            LON: self.CLASS + '-lon',
            ELEVATION: self.CLASS + '-elevation'
        });

        self.geoCrs = self.options.geoCrs || TC.Cfg.geoCrs;
        self.wrap = new TC.wrap.control.Coordinates(self);
    };

    TC.inherit(TC.control.Coordinates, TC.control.ProjectionSelector);

    var ctlProto = TC.control.Coordinates.prototype;

    ctlProto.CLASS = 'tc-ctl-coords';

    var _dataKeys = {
        PROJCODE: 'tcProjCode'
    };

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Coordinates.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/CoordinatesDialog.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div>CRS: <span class=\"tc-ctl-coords-crs\">").f(ctx.get(["crs"], false), ctx, "h").w("</span><button class=\"tc-ctl-coords-crs\" title=\"").h("i18n", ctx, {}, { "$key": "changeCRS" }).w("\">").f(ctx.get(["crs"], false), ctx, "h").w("</button></div><div class=\"tc-ctl-coords-xy\">").x(ctx.get(["isGeo"], false), ctx, { "else": body_1, "block": body_3 }, {}).w("</div>").x(ctx.get(["showGeo"], false), ctx, { "block": body_5 }, {}).w("<span class=\"close\"></span>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("x: <span class=\"tc-ctl-coords-x\">").f(ctx.get(["x"], false), ctx, "h").w("</span> y: <span class=\"tc-ctl-coords-y\">").f(ctx.get(["y"], false), ctx, "h").w("</span> ").x(ctx.get(["ele"], false), ctx, { "block": body_2 }, {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w(" z: <span class=\"tc-ctl-coords-elevation\">").f(ctx.get(["ele"], false), ctx, "h").w("</span> "); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-coords-lat\">").f(ctx.get(["lat"], false), ctx, "h").w("</span> ").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-coords-lon\">").f(ctx.get(["lon"], false), ctx, "h").w("</span> ").x(ctx.get(["ele"], false), ctx, { "block": body_4 }, {}); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w(" ").h("i18n", ctx, {}, { "$key": "ele" }).w(": <span class=\"tc-ctl-coords-elevation\">").f(ctx.get(["ele"], false), ctx, "h").w("</span> "); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<div class=\"tc-ctl-coords-alt\">CRS: <span class=\"tc-ctl-coords-geocrs\">").f(ctx.get(["geoCrs"], false), ctx, "h").w("</span></div><div class=\"tc-ctl-coords-xy\">").h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-coords-lat\">").f(ctx.get(["lat"], false), ctx, "h").w("</span> ").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-coords-lon\">").f(ctx.get(["lon"], false), ctx, "h").w("</span> ").x(ctx.get(["ele"], false), ctx, { "block": body_6 }, {}).w(" </div>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w(" ").h("i18n", ctx, {}, { "$key": "ele" }).w(": <span class=\"tc-ctl-coords-elevation\">").f(ctx.get(["ele"], false), ctx, "h").w("</span> "); } body_6.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-coords-crs-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "changeCRS" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p>").h("i18n", ctx, {}, { "$key": "coords.currentProjection|h" }).w("</p><p class=\"tc-ctl-coords-no-change\">").h("i18n", ctx, {}, { "$key": "coords.noCrs.warning|s" }).w("</p><div class=\"tc-ctl-coords-change\"><p>").h("i18n", ctx, {}, { "$key": "coords.instructions|s" }).w("</p><p class=\"tc-msg-warning tc-hidden\">").h("i18n", ctx, {}, { "$key": "coords.instructions.warning|s" }).w("</p></div><ul class=\"tc-ctl-coords-crs-list tc-crs-list\"></ul></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.control.ProjectionSelector.prototype.register.call(self, map);

        self.crs = self.map.crs;

        self.clear();


        map.loaded(function () {
            // Se espera antes de registrar el control a que se cargue el mapa para evitar que muestre valores extraños
            self.wrap.register(map).then(function () {
                self.render(function () {
                    //self.update();
                    self.clear();
                });
            });

            if (TC.Util.detectMobile()) {
                self.getLayer();

                self.activateCoords();
            }

            map.on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
                self.isGeo = map.wrap.isGeo();
                self.crs = e.crs;
                self.render();
            });

            $.when(self.map.wrap.getViewport()).then(function (viewport) {
                $(viewport)
                    .on(TC.Consts.event.MOUSEMOVE + '.coords', function (e) {
                        self.onMouseMove(e);
                    })
                    .on(TC.Consts.event.MOUSELEAVE + '.coords', function (e) {
                        self.onMouseLeave(e);
                    });
            });
        });
    };

    ctlProto.render = function (callback) {
        var self = this;

        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv.html(html);
        }).then(function () {
            TC.Control.prototype.renderData.call(self, {
                x: self.x,
                y: self.y,
                lat: self.lat,
                lon: self.lon,
                ele: self.isGeo && self.latLon.length > 2 ? self.latLon[2] : (!self.isGeo && self.xy.length > 2 ? self.xy[2] : null),
                crs: self.crs,
                geoCrs: self.geoCrs,
                isGeo: self.isGeo,
                showGeo: !self.isGeo && self.options.showGeo
            }, function () {
                self.$crs = self._$div.find('.' + self._cssClasses.CRS);
                self.$geoCrs = self._$div.find('.' + self._cssClasses.GEOCRS);
                self.$x = self._$div.find('.' + self._cssClasses.X);
                self.$y = self._$div.find('.' + self._cssClasses.Y);
                self.$lat = self._$div.find('.' + self._cssClasses.LAT);
                self.$lon = self._$div.find('.' + self._cssClasses.LON);
                self.$ele = self._$div.find('.' + self._cssClasses.ELEVATION);

                self.$crs.filter('button').on(TC.Consts.event.CLICK, function (e) {
                    self.showProjectionChangeDialog();
                });

                //self._$div.on('mousemove' + '.coords', function (e) {
                //    self.setVisibility([e.clientX, e.clientY]);
                //});

                if ($.isFunction(callback)) {
                    callback();
                }
            });
        });
    };

    ctlProto.onMouseMove = function (e) {
        this.wrap.onMouseMove(e);
    };

    ctlProto.onMouseLeave = function (e) {
        var self = this;
        setTimeout(function () {
            var clientRect = self.div.getBoundingClientRect();
            if (!self.isPointerOver(e)) {
                self._$div.css("visibility", "hidden");
                self.clear();
            }
        }, 200);
    };

    ctlProto.isPointerOver = function (e) {
        var self = this;

        var clientRect = self.div.getBoundingClientRect();
        return (clientRect.left <= e.clientX &&
            clientRect.left + clientRect.width >= e.clientX &&
            clientRect.top <= e.clientY &&
            clientRect.top + clientRect.height >= e.clientY);
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

        if (!self.isGeo && self.options.showGeo) {
            self.latLon = TC.Util.reproject(self.xy, self.crs, self.geoCrs).reverse();
        }

        if (!self.isGeo) {
            self.x = self.formatCoord(self.xy[0], TC.Consts.METER_PRECISION);
            self.y = self.formatCoord(self.xy[1], TC.Consts.METER_PRECISION);
        }

        if (self.isGeo || self.options.showGeo) {
            self.lat = self.formatCoord(self.latLon[0], TC.Consts.DEGREE_PRECISION);
            self.lon = self.formatCoord(self.latLon[1], TC.Consts.DEGREE_PRECISION);
        }

        self.render(function () {
            if (!TC.Util.detectMobile()) {
                self._$div.removeClass(TC.Consts.classes.HIDDEN);
                self._$div.css("visibility", "visible");
                self._$div.find('span.close').hide();
            } else {
                self._$div.find('span.close').click(function () {
                    self._$div.toggleClass(TC.Consts.classes.HIDDEN, true);
                    self.clear();
                });

                self._$div.find('span.close').show();
            }
        });
    };

    ctlProto.clear = function () {
        var self = this;

        self._$div.addClass(TC.Consts.classes.HIDDEN);
        self._$div.css("visibility", "hidden");

        delete self.currentCoordsMarker;
        self.getLayer().then(function (layer) {
            layer.clearFeatures();
        });
    };

    ctlProto.deactivateCoords = function () {
        var self = this;

        self._$div.toggleClass(TC.Consts.classes.HIDDEN, true);
        self.clear();

        self.wrap.coordsDeactivate();
    };

    ctlProto.activateCoords = function () {
        var self = this;

        self.wrap.coordsActivate();
    };

    ctlProto.getCoords = function () {
        var self = this;
        // si hay visible un popup, establecemos la posición de la cruz en el punto en el cual se ha abierto el popup
        var popup = self.map.getControlsByClass(TC.control.Popup);
        if (popup && popup.length > 0 && popup[0].isVisible()) {
            self.coordsToPopup(popup[0]);
        }
        else { // si no hay popup, calculamos el centro del mapa                
            self.updateCoordsCtrl([(self.map.getExtent()[0] + self.map.getExtent()[2]) / 2, (self.map.getExtent()[1] + self.map.getExtent()[3]) / 2]);

            self.coordsToClick.call(self, { coordinate: self.xy });
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
            if (!self.isGeo) {
                self.x = position[0];
                self.y = position[1];
                self.xy = [self.x, self.y];

                if (position.length > 2) {
                    self.xy.push(position[2]);
                }
            }
            if (self.isGeo || self.options.showGeo) {
                self.lat = position[0];
                self.lon = position[1];
                self.latLon = [self.lat, self.lon];

                if (position.length > 2) {
                    self.latLon.push(position[2]);
                }
            }

            self.update();
        }
    };

    // Establece la posición de la cruz en la posición recibida
    var animationTimeout;
    ctlProto.coordsToClick = function (e) {
        var self = this;

        // Si streetView está activo, no responde al click
        if (!$(self.map._$div).hasClass('tc-ctl-sv-active ' + TC.Consts.classes.COLLAPSED)) {

            var coordsBounding = self._$div[0].getBoundingClientRect();
            if ((coordsBounding.left <= e.clientX && e.clientX <= coordsBounding.right && coordsBounding.top <= e.clientY && e.clientY <= coordsBounding.bottom)) {
                self._$div.toggleClass(TC.Consts.classes.HIDDEN, true);
                self.clear();

                return;
            }

            $(self._$div).stop(true, true);

            if (animationTimeout)
                clearTimeout(animationTimeout);

            self.updateCoordsCtrl(e.coordinate);
            self.coordsMarkerAdd(e.coordinate, e.cssClass);

            self._$div.removeClass(TC.Consts.classes.HIDDEN);
            self._$div.css("visibility", "visible");

            $(self._$div).css({ opacity: 0.7 });

            animationTimeout = setTimeout(function () {
                $(self._$div).animate({ opacity: 0 }, 3000, "linear",
                    function () {
                        self.clear();
                    });
            }, 5000);
        }
    };

    ctlProto.coordsMarkerAdd = function (position, cssClass) {
        var self = this;

        if (!self.currentCoordsMarker) {
            self.getLayer().then(function (layer) {
                $.when(layer.addMarker(position, { title: 'Coord', showsPopup: false, cssClass: cssClass || TC.Consts.classes.POINT, anchor: [0.5, 0.5] }))
                    .then(function (marker) {
                        self.currentCoordsMarker = marker;
                    });
            });
        } else {
            self.currentCoordsMarker.setCoords(position);
        }
    };

    ctlProto.getLayer = function () {
        var self = this;
        var done = new $.Deferred();
        if (self.layer == undefined) {
            self.map.addLayer({
                id: self.getUID(),
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                title: 'Coordenadas',
            }).then(function (layer) {
                self.layer = layer;
                self.layer.map.putLayerOnTop(self.layer);
                done.resolve(self.layer);
            });
        } else done.resolve(self.layer);
        return done;
    };

})();
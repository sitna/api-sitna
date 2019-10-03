TC.control = TC.control || {};

if (!TC.control.ProjectionSelector) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/ProjectionSelector');
}

TC.control.Coordinates = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    self.crs = '';
    self.xy = [0, 0, 0];
    self.latLon = [0, 0, 0];
    self.x = 0;
    self.y = 0;
    self.lat = 0;
    self.lon = 0;
    self.units = TC.Consts.units.METERS;
    self.isGeo = false;

    TC.control.ProjectionSelector.apply(self, arguments);

    TC.Util.extend(self._cssClasses, {
        CRS: self.CLASS + '-crs',
        GEOCRS: self.CLASS + '-geocrs',
        X: self.CLASS + '-x',
        Y: self.CLASS + '-y',
        LAT: self.CLASS + '-lat',
        LON: self.CLASS + '-lon',
        ELEVATION: self.CLASS + '-elevation',
        THREEDMARKER: self.CLASS + '-threed'
    });

    self.geoCrs = self.options.geoCrs || TC.Cfg.geoCrs;
    self.wrap = new TC.wrap.control.Coordinates(self);
};

TC.inherit(TC.control.Coordinates, TC.control.ProjectionSelector);

(function () {
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
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div>CRS: <span class=\"tc-ctl-coords-crs\">").f(ctx.get(["crs"], false), ctx, "h").w("</span><button class=\"tc-ctl-coords-crs\" title=\"").h("i18n", ctx, {}, { "$key": "changeCRS" }).w("\">").f(ctx.get(["crs"], false), ctx, "h").w("</button></div><div class=\"tc-ctl-coords-xy\">").x(ctx.get(["isGeo"], false), ctx, { "else": body_1, "block": body_3 }, {}).w("</div>").x(ctx.get(["showGeo"], false), ctx, { "block": body_5 }, {}).w("<span class=\"close\"></span>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("x: <span class=\"tc-ctl-coords-x\">").f(ctx.get(["x"], false), ctx, "h").w("</span> y: <span class=\"tc-ctl-coords-y\">").f(ctx.get(["y"], false), ctx, "h").w("</span> ").x(ctx.get(["ele"], false), ctx, { "block": body_2 }, {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("z: <span class=\"tc-ctl-coords-elevation\">").f(ctx.get(["ele"], false), ctx, "h").w("</span> "); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-coords-lat\">").f(ctx.get(["lat"], false), ctx, "h").w("</span> ").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-coords-lon\">").f(ctx.get(["lon"], false), ctx, "h").w("</span> ").x(ctx.get(["ele"], false), ctx, { "block": body_4 }, {}); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "ele" }).w(": <span class=\"tc-ctl-coords-elevation\">").f(ctx.get(["ele"], false), ctx, "h").w("</span> "); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.w("<div class=\"tc-ctl-coords-alt\"><div class=\"tc-ctl-coords-xy\">").h("i18n", ctx, {}, { "$key": "lat" }).w(": <span class=\"tc-ctl-coords-lat\">").f(ctx.get(["lat"], false), ctx, "h").w("</span> ").h("i18n", ctx, {}, { "$key": "lon" }).w(": <span class=\"tc-ctl-coords-lon\">").f(ctx.get(["lon"], false), ctx, "h").w("</span> ").x(ctx.get(["ele"], false), ctx, { "block": body_6 }, {}).w("</div></div>"); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "ele" }).w(": <span class=\"tc-ctl-coords-elevation\">").f(ctx.get(["ele"], false), ctx, "h").w("</span> "); } body_6.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-coords-crs-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "changeCRS" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p>").h("i18n", ctx, {}, { "$key": "coords.currentProjection|h" }).w("</p><p class=\"tc-ctl-coords-no-change\">").h("i18n", ctx, {}, { "$key": "coords.noCrs.warning|s" }).w("</p><div class=\"tc-ctl-coords-change\"><p>").h("i18n", ctx, {}, { "$key": "coords.instructions|s" }).w("</p><p class=\"tc-msg-warning tc-hidden\">").h("i18n", ctx, {}, { "$key": "coords.instructions.warning|s" }).w("</p></div><ul class=\"tc-ctl-coords-crs-list tc-crs-list\"></ul></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        const result = TC.control.ProjectionSelector.prototype.register.call(self, map);

        self.crs = self.map.crs;

        self.clear();

        map.on(TC.Consts.event.VIEWCHANGE, function (e) {
            const view = e.view;
            if (view === TC.Consts.view.PRINTING) {
                return;
            }

            const _3dContainerListener = function (e) {
                if (!self.isPointerOver(e)) {
                    self.clear();
                }
            };

            if (view === TC.Consts.view.THREED) {
                self.isGeo = true;
                self.units = TC.Consts.units.DEGREES;
                self.crs = self.map.view3D.crs;

                self.map.view3D.container.addEventListener('mouseout', _3dContainerListener);

                /* provisional: faltaría el off cuando pasemos a default*/
                self.map.view3D.on(TC.Consts.event.MOUSEMOVE, function (coords) {
                    if (coords) {
                        if (TC.Util.detectMobile()) { // si estamos en móvil añadimos marcador al mapa 3D                            

                            self.clear();

                            self.coordsToClick({ coordinate: [coords.lon, coords.lat, coords.ele], cssClass: self._cssClasses.THREEDMARKER });
                        }

                        self.latLon = [coords.lat, coords.lon];
                        if (coords.ele > 0) {
                            var locale = TC.Util.getMapLocale(self.map);
                            self.latLon.push(coords.ele.toLocaleString(locale) + "m");
                        }

                        self.update();
                    } else {
                        self.clear();
                    }
                });

            } else if (view === TC.Consts.view.DEFAULT) {
                self.isGeo = self.map.wrap.isGeo();
                self.units = TC.Consts.units.METERS;
                self.crs = self.map.crs;

                if (self.map.view3D) {
                    self.map.view3D.container.removeEventListener('mouseout', _3dContainerListener);
                }                
            }

            if (self.map.view3D) {
                self.geoCrs = self.map.view3D.crs;
                self.render();
            }            
        });

        map.loaded(function () {
            // Se espera antes de registrar el control a que se cargue el mapa para evitar que muestre valores extraños
            self.wrap.register(map).then(function () {
                self.render(function () {
                    //self.update();
                    self.clear();
                });
            });

            if (TC.Util.detectMobile()) {
                self.renderPromise().then(function () {
                    self.getLayer();
                    self.activateCoords();
                });                
            }

            map.on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
                if (!map.on3DView) {
                    self.isGeo = map.wrap.isGeo();
                    self.crs = e.crs;
                    self.render();
                }                
            });

            self.map.wrap.getViewport().then(function (viewport) {
                self.renderPromise().then(function () {
                    viewport.addEventListener(TC.Consts.event.MOUSEMOVE, function (e) {
                        if (self.map.on3DView) {
                            return;
                        }

                        self.onMouseMove(e);
                    });
                    viewport.addEventListener(TC.Consts.event.MOUSELEAVE, function (e) {
                        self.onMouseLeave(e);
                    });
                });                
            });
        });

        return result;
    };

    ctlProto.render = function (callback) {
        const self = this;

        return self._set1stRenderPromise(self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;
        }).then(function () {
            return TC.Control.prototype.renderData.call(self, {
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
                self.div.querySelector('button.' + self._cssClasses.CRS).addEventListener(TC.Consts.event.CLICK, function (e) {
                    self.showProjectionChangeDialog();
                });

                //self.div.addEventListener('mousemove', function (e) {
                //    self.setVisibility([e.clientX, e.clientY]);
                //});

                if (TC.Util.isFunction(callback)) {
                    callback();
                }
            });
        }));
    };

    ctlProto.onMouseMove = function (e) {
        this.wrap.onMouseMove(e);
    };

    ctlProto.onMouseLeave = function (e) {
        const self = this;
        setTimeout(function () {
            if (!self.isPointerOver(e)) {
                self.div.style.visibility = 'hidden';
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
        const self = this;

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
            const closeSpan = self.div.querySelector('span.close');
            if (TC.Util.detectMobile()) {
                closeSpan.addEventListener('click', function () {
                    self.div.classList.add(TC.Consts.classes.HIDDEN);
                    self.clear();
                });

                closeSpan.style.display = '';
            }
            else {
                self.div.classList.remove(TC.Consts.classes.HIDDEN);
                self.div.style.visibility = 'visible';
                closeSpan.style.display = 'none';
            }
        });
    };

    ctlProto.clear = function () {
        const self = this;

        self.div.classList.add(TC.Consts.classes.HIDDEN);
        self.div.style.visibility = 'hidden';

        delete self.currentCoordsMarker;
        self.getLayer().then(function (layer) {
            layer.clearFeatures();
        });
    };

    ctlProto.deactivateCoords = function () {
        var self = this;

        self.div.classList.add(TC.Consts.classes.HIDDEN);
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
    //var animationTimeout;
    ctlProto.coordsToClick = function (e) {
        var self = this;

        // Si streetView está activo, no responde al click
        if (!self.map.div.classList.contains('tc-ctl-sv-active ' + TC.Consts.classes.COLLAPSED)) {

            var coordsBounding = self.div.getBoundingClientRect();
            if ((coordsBounding.left <= e.clientX && e.clientX <= coordsBounding.right && coordsBounding.top <= e.clientY && e.clientY <= coordsBounding.bottom)) {
                self.div.classList.add(TC.Consts.classes.HIDDEN);
                self.clear();

                return;
            }

            self.div.classList.remove('tc-fading');
            setTimeout(function () {
                self.div.classList.add('tc-fading');
            }, 10);

            self.updateCoordsCtrl(e.coordinate);

            if (!self.map.on3DView) {
                self.coordsMarkerAdd(e.coordinate, e.cssClass);
            }

            self.div.classList.remove(TC.Consts.classes.HIDDEN);
            //self.div.style.visibility = 'visible';

            //self.div.style.opacity = '0.7';

            //animationTimeout = setTimeout(function () {
            //    $(self.div).animate({ opacity: 0 }, 3000, "linear",
            //        function () {
            //            self.clear();
            //        });
            //}, 5000);
        }
    };

    ctlProto.coordsMarkerAdd = function (position, cssClass) {
        var self = this;

        if (!self.currentCoordsMarker) {
            self.getLayer().then(function (layer) {
                layer.addMarker(position, { title: 'Coord', showsPopup: false, cssClass: cssClass || TC.Consts.classes.POINT, anchor: [0.5, 0.5] })
                    .then(function (marker) {
                        self.currentCoordsMarker = marker;
                    });
            });
        } else {
            self.currentCoordsMarker.setCoords(position);
        }
    };

    ctlProto.getLayer = function () {
        const self = this;
        return new Promise(function (resolve, reject) {
            if (self.layer == undefined) {
                self.map.addLayer({
                    id: self.getUID(),
                    type: TC.Consts.layerType.VECTOR,
                    stealth: true,
                    title: 'Coordenadas',
                }).then(function (layer) {
                    self.layer = layer;
                    self.layer.map.putLayerOnTop(self.layer);
                    resolve(self.layer);
                });
            } else {
                resolve(self.layer);
            }
        });
    };

})();
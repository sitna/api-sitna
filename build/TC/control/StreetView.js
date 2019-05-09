/// <reference path="../feature/Marker.js" />
/// <reference path="../feature/Point.js" />
/// <reference path="../ol/ol.js" />


if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

(function () {
    TC.Consts.url.GOOGLEMAPS = '//maps.googleapis.com/maps/api/js?v=3';
    var gMapsUrl = TC.Consts.url.GOOGLEMAPS;
    TC.Cfg.proxyExceptions = TC.Cfg.proxyExceptions || [];
    TC.Cfg.proxyExceptions.push(TC.Consts.url.GOOGLEMAPS);

    TC.control.StreetView = function () {
        var self = this;
        self._sv = null;
        self._mapActiveControl = null;

        TC.Control.apply(self, arguments);

        if (self.options.googleMapsKey) {
            gMapsUrl += '&key=' + self.options.googleMapsKey;
        }

        self.viewDiv = null;
        self._startLonLat = null;

        //self.render();
    };

    TC.inherit(TC.control.StreetView, TC.Control);

    var ctlProto = TC.control.StreetView.prototype;

    ctlProto.CLASS = 'tc-ctl-sv';

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/StreetView.html";
        ctlProto.template[ctlProto.CLASS + '-view'] = TC.apiLocation + "TC/templates/StreetViewView.html";
    } else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-sv-btn\" title=\"").h("i18n", ctx, {}, { "$key": "sv.tip" }).w("\"><div class=\"tc-ctl-sv-drag\"></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-view'] = function () { dust.register(ctlProto.CLASS + '-view', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-sv-btn-close\" title=\"").h("i18n", ctx, {}, { "$key": "closeStreetView" }).w("\"></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    const dispatchCanvasResize = function () {
        var event = document.createEvent('HTMLEvents');
        event.initEvent('resize', true, false);
        this.map.div.querySelector('canvas').dispatchEvent(event);
    };

    var preset = function (ctl) {
        ctl.div.querySelector('.' + ctl.CLASS + '-btn').classList.add(TC.Consts.classes.CHECKED);
        ctl.map.div.classList.add(ctl.CLASS + '-active');
    };

    var reset = function (ctl) {
        const view = ctl.viewDiv;
        const transitionEvents = ['webkitTransitionEnd', 'msTransitionEnd', 'oTransitionEnd', 'transitionend'];
        const onTransitionend = function () {
            if (!TC.Util.detectSafari()) {
                transitionEvents.forEach(function (eventName) {
                    view.removeEventListener(eventName, onTransitionend);
                });
            }

            dispatchCanvasResize.call(ctl);
        };

        // Safari no lanza transitionend
        if (TC.Util.detectSafari()) {
            setTimeout(function () {
                dispatchCanvasResize.call(ctl);
            }, 500);
        } else {
            transitionEvents.forEach(function (eventName) {
                view.addEventListener(eventName, onTransitionend);
            });
        }

        ctl.layer.clearFeatures();
        ctl.div.querySelector('.' + ctl.CLASS + '-btn').classList.remove(TC.Consts.classes.CHECKED);
        ctl.div.querySelector('.' + ctl.CLASS + '-drag').classList.remove(TC.Consts.classes.HIDDEN);
        ctl.map.div.classList.remove(ctl.CLASS + '-active');
        ctl._startLonLat = null;
    };

    var resolve = function (ctl) {
        var result = false;
        const btn = ctl.div.querySelector('.' + ctl.CLASS + '-btn');
        const drag = ctl.div.querySelector('.' + ctl.CLASS + '-drag');

        var btnRect = btn.getBoundingClientRect();
        var dragRect = drag.getBoundingClientRect();
        drag.classList.add(TC.Consts.classes.HIDDEN);
        if (dragRect.top < btnRect.top || dragRect.top > btnRect.bottom ||
            dragRect.left < btnRect.left || dragRect.left > btnRect.right) {
            // Hemos soltado fuera del botón: activar StreetView
            result = true;
            // Precarga de marcadores
            var extent = ctl.map.getExtent();
            var xy = [extent[2], extent[3]];
            var deferreds = new Array(16);
            for (var i = 0; i < 16; i++) {
                ctl.layer.addMarker(xy, {
                    cssClass: 'tc-marker-sv-' + i,
                    width: 48,
                    height: 48,
                    anchor: [0, 1]
                });
            }
            /////////////////////
            // Activamos StreetView
            var mapRect = ctl.map.div.getBoundingClientRect();
            var xpos = (((dragRect.left * window.devicePixelRatio) + (dragRect.right * window.devicePixelRatio)) / 2) - (mapRect.left * window.devicePixelRatio);
            var ypos = (dragRect.bottom * window.devicePixelRatio) - (mapRect.top * window.devicePixelRatio);
            var coords = ctl.map.wrap.getCoordinateFromPixel([xpos, ypos]);
            ctl.callback(coords);
        }
        else {
            reset(ctl);
        }
        return result;
    };

    ctlProto.register = function (map) {
        const self = this;

        if (!self.viewDiv) {
            self.viewDiv = TC.Util.getDiv(self.options.viewDiv);
            self.viewDiv.classList.add(self.CLASS + '-view');
            self.viewDiv.classList.add(TC.Consts.classes.HIDDEN);
            if (!self.options.viewDiv) {
                map.div.insertAdjacentElement('beforebegin', self.viewDiv);
            }
        }

        const result = TC.Control.prototype.register.call(self, map);

        self.layer = null;
        var layerId = self.getUID();
        for (var i = 0; i < map.workLayers.length; i++) {
            var layer = map.workLayers[i];
            if (layer.type === TC.Consts.layerType.VECTOR && layer.id === layerId) {
                self.layer = layer;
                break;
            }
        }
        if (!self.layer) {
            map.loaded(function () {
                map.addLayer({
                    id: layerId,
                    stealth: true,
                    type: TC.Consts.layerType.VECTOR
                }).then(function (layer) {
                    self.layer = layer;
                });
            });
        }

        self.renderPromise().then(function () {
            TC.loadJS(
                !window.Draggabilly,
                [TC.apiLocation + 'lib/draggabilly/draggabilly.pkgd.min.js'],
                function () {
                    const drag = new Draggabilly(self.div.querySelector('.' + self.CLASS + '-drag'), {
                        containment: self.map.div
                    });
                    drag.on('dragStart', function (e) {
                        preset(self);
                    });
                    drag.on('dragEnd', function (e) {
                        resolve(self);
                        drag.setPosition(0, 0);
                    });
                }
            );

            const view = self.viewDiv;
            view.querySelector('.' + self.CLASS + '-btn-close').addEventListener(TC.Consts.event.CLICK, function (e) {
                const mapDiv = self.map.div;
                const endProcess = function () {
                    mapDiv.classList.remove(TC.Consts.classes.COLLAPSED);
                    const resizeEvent = document.createEvent('HTMLEvents');
                    resizeEvent.initEvent('resize', false, false);
                    mapDiv.dispatchEvent(resizeEvent); // Para evitar que salga borroso el mapa tras cerrar SV.
                };
                const transitionend = 'transitionend';
                const onTransitionend = function (e) {
                    if (e.propertyName === 'width' || e.propertyName === 'height') {
                        view.removeEventListener(transitionend, onTransitionend);
                        endProcess();
                    }
                };
                view.removeEventListener(transitionend, onTransitionend);
                view.addEventListener(transitionend, onTransitionend);
                setTimeout(endProcess, 1000); // backup por si falla la transición.

                view.classList.add(TC.Consts.classes.HIDDEN);
                view.classList.remove(TC.Consts.classes.VISIBLE);
                self.div.querySelector('.' + self.CLASS + '-drag').classList.remove(TC.Consts.classes.HIDDEN);
                self.layer.wrap.setDraggable(false);
                reset(self);
                self._sv.setVisible(false);
                e.stopPropagation();
                const header = document.body.querySelector('header');
                if (header) {
                    header.style.display = '';
                }

                if (self._previousActiveControl) {
                    self._previousActiveControl.activate();
                }
            });
        }
            , function (a, b, c) {
                TC.error("Error de renderizado StreetView");
            });

        return result;
    };



    ctlProto.render = function () {
        const self = this;

        return self._set1stRenderPromise(new Promise(function (resolve, reject) {
            self.renderData(null, function () {
                if (dust.cache[self.CLASS + '-view']) {
                    dust.render(self.CLASS + '-view', null, function (err, out) {
                        //lo normal sería hacer el resolve después de volcar out en viewDiv
                        //pero a veces fallaba
                        //no se detonaba, sin dar error alguno
                        //así que lo arreglo como a mí me gusta:
                        setTimeout(function () {
                            self.viewDiv.innerHTML = out;
                            if (err) {
                                TC.error(err);
                            }
                            resolve(self);
                        }
                            , 300);


                        //console.log("Casi resuelto... " + out.length);
                        //self._$viewDiv.html(out);
                        //if (err)
                        //{
                        //    TC.error(err);
                        //}
                        //resolve(self);
                        //console.log("Resuelto!");

                    });
                }
                else {
                    TC.error("No hay dust.cache para StreetView");
                    resolve(self);
                }
            });
        }));
    };

    var waitId = 0;

    ctlProto.callback = function (coords) {
        var self = this;
        var geogCrs = 'EPSG:4326';

        var ondrop = function (feature) {
            if (self._sv) {
                var bounds = feature.getBounds();                
                lonLat = TC.Util.reproject([(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2], self.map.crs, geogCrs);                
                self._sv.setPosition({ lng: lonLat[0], lat: lonLat[1] });
            }
        }

        var ondrag = function (feature) {
            if (self._sv) {
                var bounds = feature.getBounds();
                self._startLonLat = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
            }
        }

        var li = self.map.getLoadingIndicator();
        if (li) {
            waitId = li.addWait(waitId);
        }

        const mapDiv = self.map.div;

        var setMarker = function (sv, center) {
            self.layer.clearFeatures();

            var xy;
            var heading;
            if (sv) {
                var latLon = sv.getPosition();
                xy = TC.Util.reproject([latLon.lng(), latLon.lat()], geogCrs, self.map.crs);
                heading = sv.getPov().heading;
            }
            else {
                xy = coords;
                heading = 0;
            }
            self.map.addMarker(xy, {
                cssClass: 'tc-marker-sv-' + (Math.round(16.0 * heading / 360) + 16) % 16,
                width: 48,
                height: 48,
                anchor: [0.4791666666666667, 0.7083333333333333],
                layer: self.layer,
                showsPopup: false
            });
            Promise.all(self.map._markerPromises).then(function () {
                // Para poder arrastrar a pegman                
                self.layer.wrap.setDraggable(true, ondrop, ondrag);
            });

            if (center) {
                var setCenter = function () {
                    self.map.setCenter(xy);
                };
                // Esperamos a que el mapa esté colapsado para centrarnos: ahorramos ancho de banda
                if (mapDiv.classList.contains(TC.Consts.classes.COLLAPSED)) {
                    setCenter();
                }
                else {
                    setTimeout(setCenter, 1200);
                }
            }
        };

        TC.loadJS(
            !window.google || !google.maps,
            gMapsUrl,
            function () {

                if (window.google) {

                    setMarker();

                    const view = self.viewDiv;
                    var lonLat = TC.Util.reproject(coords, self.map.crs, geogCrs);
                    var svDone = view.classList.contains(TC.Consts.classes.VISIBLE);

                    var svOptions = {
                        position: new google.maps.LatLng(lonLat[1], lonLat[0]),
                        pov: {
                            heading: 0,
                            pitch: 0
                        },
                        zoom: 1,
                        fullscreenControl: false,
                        zoomControlOptions: {
                            position: google.maps.ControlPosition.LEFT_TOP
                        },
                        panControlOptions: {
                            position: google.maps.ControlPosition.LEFT_TOP
                        }
                    };

                    if (!self._sv) {
                        self._sv = new google.maps.StreetViewPanorama(view, svOptions);
                        google.maps.event.addListener(self._sv, 'position_changed', function () {
                            setMarker(self._sv, view.classList.contains(TC.Consts.classes.VISIBLE));
                        });
                        google.maps.event.addListener(self._sv, 'pov_changed', function () {
                            if (self.layer.features && self.layer.features.length > 0) {
                                var pegmanMarker = self.layer.features[0];

                                delete pegmanMarker.options.url;
                                pegmanMarker.options.cssClass = 'tc-marker-sv-' + ((Math.round(16.0 * self._sv.getPov().heading / 360) + 16) % 16);
                                pegmanMarker.setStyle(pegmanMarker.options);

                                self.layer.refresh();
                            }
                        });
                        google.maps.event.addListener(self._sv, 'status_changed', function () {
                            var svStatus = self._sv.getStatus();
                            if (li) {
                                li.removeWait(waitId);
                            }
                            if (svStatus === google.maps.StreetViewStatus.OK) {

                                mapDiv.classList.add(TC.Consts.classes.COLLAPSED);
                                const resizeEvent = document.createEvent('HTMLEvents');
                                resizeEvent.initEvent('resize', false, false);
                                mapDiv.dispatchEvent(resizeEvent);

                                const endProcess = function () {
                                    google.maps.event.trigger(self._sv, 'resize');

                                    dispatchCanvasResize.call(self);
                                };
                                var transitionend = 'transitionend';
                                const onTransitionend = function (e) {
                                    if (e.propertyName === 'width' || e.propertyName === 'height') {
                                        if (!svDone) {
                                            svDone = true;
                                            view.removeEventListener(transitionend, onTransitionend);
                                            endProcess();
                                        }
                                    }
                                };
                                view.removeEventListener(transitionend, onTransitionend);
                                view.addEventListener(transitionend, onTransitionend);

                                setTimeout(endProcess, 1000); // Backup por si no salta el transitionend.

                                if (!view.classList.contains(TC.Consts.classes.VISIBLE)) {
                                    self._sv.setVisible(true);
                                    setMarker(self._sv, true);

                                    //apagar lo que sea que esté encendido (probablemente featInfo)
                                    //al cerrar con el aspa, volverá a detonarse StreetView.deactivate()
                                    //que, a su vez, restaurará el control anterior (FeatureInfo)
                                    if (self.map.activeControl) {
                                        self._previousActiveControl = self.map.activeControl;
                                        self.map.activeControl.deactivate(true);
                                    }

                                    setTimeout(function () {
                                        view.style.left = '';
                                        view.style.top = '';
                                        // triggers transitionend
                                        view.classList.remove(TC.Consts.classes.HIDDEN);
                                        view.classList.add(TC.Consts.classes.VISIBLE);
                                    }, 200);

                                    const header = document.body.querySelector('header');
                                    if (header) {
                                        header.style.display = 'none';
                                    }
                                }
                            }
                            else {
                                TC.alert(svStatus === google.maps.StreetViewStatus.ZERO_RESULTS ? self.getLocaleString('noStreetView') : self.getLocaleString('streetViewUnknownError'));
                                if (self._startLonLat) {
                                    self.callback(self._startLonLat);
                                }
                                else {
                                    self.layer.wrap.setDraggable(false);
                                    reset(self);
                                }
                            }
                        });
                    }
                    else {
                        self._sv.setOptions(svOptions);
                    }
                    setMarker(self._sv);
                }
                else {
                    reset(self);
                }
            }, false, true);
    };
})();
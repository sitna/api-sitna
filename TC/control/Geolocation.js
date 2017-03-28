(function () {
    Math.hypot = Math.hypot || function () {
        var y = 0;
        var length = arguments.length;

        for (var i = 0; i < length; i++) {
            if (arguments[i] === Infinity || arguments[i] === -Infinity) {
                return Infinity;
            }
            y += arguments[i] * arguments[i];
        }
        return Math.sqrt(y);
    };
}());
(function () {
    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        // Feature check for performance (high-resolution timers)
        hasPerformance = !!(window.performance && window.performance.now);

    for (var x = 0, max = vendors.length; x < max && !window.requestAnimationFrame; x += 1) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                                   || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }

    // Add new wrapper for browsers that don't have performance
    if (!hasPerformance) {
        // Store reference to existing rAF and initial startTime
        var rAF = window.requestAnimationFrame,
            startTime = +new Date;

        // Override window rAF to include wrapped callback
        window.requestAnimationFrame = function (callback, element) {
            // Wrap the given callback to pass in performance timestamp
            var wrapped = function (timestamp) {
                // Get performance-style timestamp
                var performanceTimestamp = (timestamp < 1e12) ? timestamp : timestamp - startTime;

                return callback(performanceTimestamp);
            };

            // Call original rAF with wrapped callback
            rAF(wrapped, element);
        }
    }
})();

TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

TC.control.Geolocation = function (options) {
    var self = this;
    self.$events = $(self);
    self._classSelector = '.' + self.CLASS;

    self.Const = {
        Classes: {
            ACTIVE: 'tc-ctl-geolocation-active',
            CLOSED: 'closed',
            SELECTEDTRACK: 'selectedTrack',
            DRAWACTIVATED: 'draw-activated',
            SIMULATIONACTIVATED: 'simulation-activated'
        },
        Selector: {
            SIMULATE: '.tc-btn-simulate',
            DRAW: '.tc-draw',
            EDIT: '.tc-btn-edit',
            DELETE: '.tc-btn-delete',
            SAVE: '.tc-btn-save',
            CANCEL: '.tc-btn-cancel',
            EXPORT_GPX: '.tc-btn-export-gpx',
            EXPORT_KML: '.tc-btn-export-kml',
            STOP: '.tc-btn-stop',
            PAUSE: '.tc-btn-pause',
            BACKWARD: '.tc-btn-backward',
            FORWARD: '.tc-btn-forward',
            SPEED: '.tc-spn-speed'
        },
        LocalStorageKey: {
            TRACKING: 'trk',
            TRACKINGTEMP: 'trktemp',
            TRACKINGSHOWADVERTISEMENT: 'trkAdvertisement',
            GPSSHOWADVERTISEMENT: 'gpsAdvertisement',
            TEST: 'test'
        },
        Message: {
            VALIDATENAME: '',
        },
        Event: {
            POSITIONCHANGE: 'positionchange.tc.geolocation',
            GPSPOSITIONCHANGE: 'gpspositionchange.tc.geolocation',
            GPSPOSITIONERROR: 'positionerror.tc.geolocation',
            STATEUPDATED: 'stateupdated.tc.geolocation',
            GPSADD: 'gpsadd.tc.geolocation',
            TRACKSNAPPING: 'tracksnapping.tc.geolocation',
            DRAWTRACK: 'drawtrack.tc.geolocation',
            CLEARTRACK: 'cleartrack.tc.geolocation',
            IMPORTEDTRACK: 'importedtrack.tc.geolocation'
        },
        MimeMap: {
            KML: 'application/vnd.google-earth.kml+xml',
            GPX: 'application/gpx+xml'
        },
        Tabs: {
            GPS: "gps"
        },
        Layers: {
            GPS: "gps",
            TRACK: "track",
            TRACKING: "tracking"
        }
    };

    TC.Control.apply(self, arguments);

    var opts = options || {};
    self._$dialogDiv = $(TC.Util.getDiv(opts.dialogDiv));
    if (!opts.dialogDiv) {
        self._$dialogDiv.appendTo('body');
    }
    self.delta = 500;
    self.walkingSpeed = 5000;
    self.gapHill = self.options.gapHill || 20;
};

TC.inherit(TC.control.Geolocation, TC.Control);

(function () {
    var ctlProto = TC.control.Geolocation.prototype;

    ctlProto.CLASS = 'tc-ctl-geolocation';

    TC.Consts.event.TOOLSCLOSE = TC.Consts.event.TOOLSCLOSE || 'toolsclose.tc';
    TC.Consts.event.TOOLSOPEN = TC.Consts.event.TOOLSOPEN || 'toolsopen.tc';

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Geolocation.html";
        ctlProto.template[ctlProto.CLASS + '-track-node'] = TC.apiLocation + "TC/templates/GeolocationTrackNode.html";
        ctlProto.template[ctlProto.CLASS + '-track-snapping-node'] = TC.apiLocation + "TC/templates/GeolocationTrackSnappingNode.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/GeolocationDialog.html";
        ctlProto.template[ctlProto.CLASS + '-tracking-toast'] = TC.apiLocation + "TC/templates/GeolocationTrackingToast.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "geo" }).w("</h2><div class=\"tc-ctl-geolocation-content\"> <div class=\"tc-ctl-geolocation-track\"><div class=\"tc-ctl-geolocation-track-snap-info\"></div><div class=\"tc-ctl-geolocation-info-tracking tc-hidden\"><div class=\"tc-ctl-p-results\"><div class=\"prpanel-group prsidebar-body \"><div class=\"prpanel prpanel-default\"><div class=\"prpanel-heading\"><h4 class=\"prpanel-title\"><label>").h("i18n", ctx, {}, { "$key": "geo.mylocation" }).w("</label> <span id=\"trackingInfoClose\" class=\"prcollapsed-pull-right prcollapsed-slide-submenu prcollapsed-slide-submenu-close\" title=\"").h("i18n", ctx, {}, { "$key": "close" }).w("\"><i class=\"fa fa-times\"></i></span><span id=\"trackingInfoMin\" class=\"prcollapsed-pull-right prcollapsed-slide-submenu prcollapsed-slide-submenu-min\" title=\"").h("i18n", ctx, {}, { "$key": "hide" }).w("\"><i class=\"fa fa-chevron-left\"></i></span> </h4></div><div id=\"results\" class=\"prpanel-collapse\"><div class=\"prpanel-body list-group\"> </div> </div></div></div><div id=\"trackingInfoMax\" class=\"prcollapsed prcollapsed-max prcollapsed-pull-left\" style=\"display: none;\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.3" }).w("\"><i class=\"fa fa-list-alt\"></i></div></div></div><!-- img se insertan en el div del mapa--> <div id=\"tc-ctl-geolocation-track-elevation-marker\" class=\"tc-ctl-geolocation-trackMarker elevation\" style=\"display: none;\" /> <div class=\"tc-ctl-geolocation-track-panel-block\"><input id=\"tc-ctl-geolocation-track-panel-opened\" type=\"checkbox\" checked/><label for=\"tc-ctl-geolocation-track-panel-opened\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.1" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.2" }).w("</label><i class=\"tc-ctl-geolocation-track-panel-help icon-question-sign\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.3" }).w("\"></i></div><div class=\"tc-ctl-geolocation-track-mng\"><div class=\"tc-ctl-geolocation-select\"><form> <label class=\"tc-ctl-geolocation-btn-track\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track.title" }).w("\"><input type=\"radio\" name=\"mode\" value=\"tracks\" /><span>").h("i18n", ctx, {}, { "$key": "geo.gps" }).w("</span></label><label class=\"tc-ctl-geolocation-btn-tracks\" title=\"").h("i18n", ctx, {}, { "$key": "geo.tracks.title" }).w("\"><input type=\"radio\" name=\"mode\" value=\"track-available\" /><span>").h("i18n", ctx, {}, { "$key": "geo.tracks" }).w("</span></label> </form></div> <div class=\"tc-ctl-geolocation-track-available tc-ctl-geolocation-track-cnt tc-ctl-geolocation-panel tc-hidden\"><i class=\"tc-ctl-geolocation-track-search-icon\"></i><input id=\"tc-ctl-geolocation-track-available-srch\" type=\"search\" list=\"tc-ctl-geolocation-track-available-lst\" class=\"tc-ctl-geolocation-track-available-srch tc-textbox\" placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.filter.plhr" }).w("\" maxlength=\"200\" /> <ol id=\"tc-ctl-geolocation-track-available-lst\" class=\"tc-ctl-geolocation-track-available-lst\"><li class=\"tc-ctl-geolocation-track-available-empty\"><span>").h("i18n", ctx, {}, { "$key": "geo.noTracks" }).w("</span></li><li class=\"tc-ctl-geolocation-track-not\" hidden><span>").h("i18n", ctx, {}, { "$key": "noMatches" }).w("</span></li></ol><div class=\"tc-ctl-geolocation-track-cnt\"><input name=\"uploaded-file\" id=\"uploaded-file\" type=\"file\" class=\"tc-ctl-geolocation-track-import tc-button\" accept=\".gpx,.kml\" disabled /><label class=\"tc-button tc-icon-button\" for=\"uploaded-file\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.import.upload" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.import.lbl" }).w("</label></div></div><div class=\"tc-ctl-geolocation-tracks tc-ctl-geolocation-panel tc-hidden\"> <div class=\"tc-alert alert-warning tc-hidden\"><p id=\"panel-msg\">").h("i18n", ctx, {}, { "$key": "geo.trk.panel.1" }).w(" <ul><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.2" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.3" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.4" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.5" }).w("</li></ul></p></div> <div class=\"tc-ctl-geolocation-track-ui\"> <div class=\"tc-ctl-geolocation-track-render\"><input id=\"tc-ctl-geolocation-track-render\" type=\"checkbox\" hidden checked /><label for=\"tc-ctl-geolocation-track-render\" class=\"tc-ctl-geolocation-track-render\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.render" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.render" }).w("</label></div><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-ui-activate\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track.activate.title" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.track.activate" }).w("</button><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-ui-deactivate tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track.deactivate.title" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.track.deactivate" }).w("</button></div><div class=\"tc-ctl-geolocation-track-current tc-ctl-geolocation-track-cnt\"><input type=\"text\" class=\"tc-ctl-geolocation-track-title tc-textbox\" disabled placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.trk.name.plhr" }).w("\" maxlength=\"200\" /><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-save\" disabled title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.name.save" }).w("\"></button><input type=\"text\" class=\"tc-ctl-geolocation-track-waypoint tc-textbox\" disabled placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.trk.wyp.plhr" }).w("\" maxlength=\"200\" /><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-add-wpt\" disabled title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.wyp.save" }).w("\"></button></div></div></div></div></div><!--se inserta en el div del mapa--><div class=\"tc-ctl-geolocation-track-center tc-hidden\"> <button class=\"tc-ctl-btn tc-button tc-icon-button\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.center" }).w("\"></button></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-track-node'] = function () { dust.register(ctlProto.CLASS + '-track-node', body_0); function body_0(chk, ctx) { return chk.w("<li data-id=\"").f(ctx.get(["id"], false), ctx, "h").w("\" data-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><span class=\"tc-draw tc-selectable\" title=\"").f(ctx.get(["name"], false), ctx, "h").w("\">").f(ctx.get(["name"], false), ctx, "h").w("</span><input class=\"tc-textbox tc-hidden\" type=\"text\" value=\"").f(ctx.get(["name"], false), ctx, "h").w("\" /> <button class=\"tc-btn-simulate\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.simulate" }).w("\"></button><button hidden class=\"tc-btn-stop\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.stop" }).w("\"></button><button class=\"tc-btn-edit\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.edit" }).w("\"></button><button hidden class=\"tc-btn-pause\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.pause" }).w("\"></button> <button hidden class=\"tc-btn-backward\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.backward" }).w("\"></button><label hidden class=\"tc-spn-speed\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.velocity" }).w("\"></label><button hidden class=\"tc-btn-forward\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.forward" }).w("\"></button> <button class=\"tc-btn-save tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "save" }).w("\"></button><button class=\"tc-btn-cancel tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.cancel" }).w("\"></button><button class=\"tc-btn-delete\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.delete" }).w("\"></button><button class=\"tc-btn-export-gpx\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.exportGPX" }).w("\"></button><button class=\"tc-btn-export-kml\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.exportKML" }).w("\"></button> </li>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-track-snapping-node'] = function () { dust.register(ctlProto.CLASS + '-track-snapping-node', body_0); function body_0(chk, ctx) { return chk.w("<ul>").x(ctx.get(["n"], false), ctx, { "block": body_1 }, {}).w("<li> <span>X:</span> ").f(ctx.get(["x"], false), ctx, "h").w(" </li><li> <span>Y:</span> ").f(ctx.get(["y"], false), ctx, "h").w(" </li>").x(ctx.get(["z"], false), ctx, { "block": body_2 }, {}).x(ctx.get(["m"], false), ctx, { "block": body_4 }, {}).w("</ul>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li> <span>").h("i18n", ctx, {}, { "$key": "geo.trk.snapping.name" }).w(":</span> ").f(ctx.get(["n"], false), ctx, "h").w(" </li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.h("ne", ctx, { "block": body_3 }, { "key": ctx.get(["z"], false), "value": 0 }).w(" "); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<li> <span>Z:</span> ").f(ctx.get(["z"], false), ctx, "h").w(" </li>"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("<li> ").f(ctx.get(["m"], false), ctx, "h").w(" </li>"); } body_4.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-geolocation-continue-track-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "geo.gps" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><button class=\"tc-button tc-ctl-geolocation-track-continue\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.cnt" }).w(" </button><button class=\"tc-button tc-ctl-geolocation-track-new\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.new" }).w(" </button> <button class=\"tc-button tc-modal-close\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.cancel" }).w(" </button></div></div></div><div class=\"tc-ctl-geolocation-track-advert-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "geo.track.activate.title" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p id=\"pageBlurMsg\">").h("i18n", ctx, {}, { "$key": "geo.trk.page.blur" }).w("</p><p class=\"tc-ctl-geolocation-track-advertisement p\"> <label> <input type=\"checkbox\" name=\"checkbox\" id=\"advertisement\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.advertisement" }).w(" </label> </p></div><div class=\"tc-modal-footer\"><button class=\"tc-button tc-ctl-geolocation-track-advert-ok\"> ").h("i18n", ctx, {}, { "$key": "ok" }).w(" </button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-tracking-toast'] = function () { dust.register(ctlProto.CLASS + '-tracking-toast', body_0); function body_0(chk, ctx) { return chk.w("<ul><li><span>X:</span> ").f(ctx.get(["x"], false), ctx, "h").w("<br /><span>Y:</span> ").f(ctx.get(["y"], false), ctx, "h").w("<br />").x(ctx.get(["z"], false), ctx, { "block": body_1 }, {}).w("</li><li>").x(ctx.get(["accuracy"], false), ctx, { "block": body_2 }, {}).x(ctx.get(["speed"], false), ctx, { "block": body_3 }, {}).w("</li></ul>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<span>Z:</span> ").f(ctx.get(["z"], false), ctx, "h").w(" m<br />"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<span>").h("i18n", ctx, {}, { "$key": "geo.trk.accuracy" }).w(":</span> ").f(ctx.get(["accuracy"], false), ctx, "h").w(" m<br />"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<span>").h("i18n", ctx, {}, { "$key": "geo.trk.speed" }).w(":</span> ").f(ctx.get(["speed"], false), ctx, "h").w(" km/h<br />"); } body_3.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        self.wrap = new TC.wrap.control.Geolocation(self);
        self.wrap.register(map);

        map.loaded(function () {
            $.when(map.addLayer({
                id: TC.getUID(),
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                title: 'Posicionar.GPS',
            })).then(function (layer) {
                self.layerGPS = layer;
            });
            $.when(map.addLayer({
                id: TC.getUID(),
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                title: 'Posicionar.Tracking',
            })).then(function (layer) {
                self.layerTracking = layer;
            });


            // GLS: falta la gestión del drag&drop al fileInput aunque debería saltar el mismo evento y funcionar correctamente
            map.on(TC.Consts.event.FEATURESIMPORT, function (e) {
                var self = this;

                if (e.fileName && e.features && e.features.length > 0) {

                    var isKML = /.kml/g.test(e.fileName.toLowerCase()) && self.importedByMe || false;

                    if (/.gpx/g.test(e.fileName.toLowerCase()) || isKML) {

                        if (self.layerTrack) {
                            self.map.removeLayer(self.layerTrack);
                            self.layerTrack = undefined;
                        }

                        if (isKML) { // si trata de un KML importado desde el control Ubicar borro la capa del TOC
                            for (var i = 0; i < self.map.workLayers.slice().reverse().length; i++) {
                                var layer = self.map.workLayers.slice().reverse()[i];
                                if (layer.title && layer.title.toLowerCase().trim() === e.fileName.toLowerCase().trim()) {
                                    self.map.removeLayer(layer);
                                    break;
                                }
                            }
                            self.importedByMe = false;
                        }

                        // GLS: añadimos la capa para que se muestre en el TOC
                        self.getLayer(self.Const.Layers.TRACK).then(function (layer) {

                            var wait = self.getLoadingIndicator().addWait();
                            self.importedFileName = e.fileName;
                            for (var i = 0, len = e.features.length; i < len; i++) {
                                self.layerTrack.addFeature(e.features[i]);
                            }
                            self.wrap.processImportedFeatures(wait);

                            if (self.layerTrack) { // Si tenemos capa es que todo ha ido bien y gestionamos el despliegue del control
                                // Desplegamos el control "ubicar" al importar mediante drag&drop
                                if (self.map && self.map.layout && self.map.layout.accordion) {
                                    if (self._$div.hasClass(TC.Consts.classes.COLLAPSED)) {
                                        for (var i = 0; i < self.map.controls.length; i++) {
                                            if (self.map.controls[i] !== self) {
                                                self.map.controls[i]._$div.addClass(TC.Consts.classes.COLLAPSED);
                                            }
                                        }
                                    }
                                }

                                self._$div.removeClass(TC.Consts.classes.COLLAPSED);
                                $('.' + self.CLASS + '-btn-tracks > span').click();

                                // abrimos el panel de herramientas
                                self.map.$events.trigger($.Event(TC.Consts.event.TOOLSOPEN), {});
                            }
                        });
                    }
                }
            }.bind(self));
            map.on(TC.Consts.event.LAYERVISIBILITY + ' ' + TC.Consts.event.LAYEROPACITY + ' ' + TC.Consts.event.LAYERREMOVE, function (e) {
                var self = this;
                if (e.layer == self.layerTrack) {
                    switch (true) {
                        case e.type + '.' + e.namespace === TC.Consts.event.LAYERREMOVE:
                            self.wrap.deactivateSnapping();
                            var selected = self.getSelectedTrack();
                            if (selected) {
                                self.clearSelectedTrack();
                            }
                            if (self.resultsPanelChart)
                                self.resultsPanelChart.close();

                            // GLS: limpiamos la referencia a la capa para poder gestionar las nuevas selecciones en la lista/importaciones
                            self.layerTrack = undefined;
                            break;
                        case e.opacity > 0 && e.opacity < 1:
                            return;
                        case e.layer.getVisibility() == false:
                            if (self.resultsPanelChart)
                                self.resultsPanelChart.minimize();
                        case e.opacity == 0:
                            self.wrap.deactivateSnapping();
                            break;
                        case e.layer.getVisibility() == true:
                            if (self.resultsPanelChart)
                                self.resultsPanelChart.maximize();
                        case e.opacity == 1:
                            self.wrap.activateSnapping();
                            break;
                    }
                }
            }.bind(self));
        });
    };

    ctlProto.render = function (callback) {
        var self = this;
        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv.html(html);
        }).then(function () {
            TC.Control.prototype.render.call(self, callback);
        });
    };

    var visibilityTrack = true;
    ctlProto.renderData = function (data, callback) {
        var self = this;

        var removeClassFn = function (index, css) {
            return (css.match(/(moveTop.*)/g) || []).join(' ');
        };

        self.trackingActive = {
            isTrackingActive: false,
            get: function () {
                return this.isTrackingActive;
            },
            set: function (val) {
                this.isTrackingActive = val;

                if (!self.$geoInfoResult)
                    self.$geoInfoResult = $('.' + self.CLASS + '-info-tracking div.tc-ctl-p-results');

                switch (this.isTrackingActive) {
                    case true: {
                        if (self.elevationActiveCollapsed.get()) {
                            self.$geoInfoResult.removeClass(removeClassFn).addClass('moveTop57');
                            self.$geoInfoResult.find('.prcollapsed').removeClass('prcollapsed-samehw');
                            self.$geoInfoResult.find('.prpanel-heading').removeClass('prpanel-heading-samehw');
                        } else if (self.elevationActive.get()) {
                            self.$geoInfoResult.removeClass(removeClassFn).addClass('moveTop159');
                            self.$geoInfoResult.find('.prcollapsed').addClass('prcollapsed-samehw');
                            self.$geoInfoResult.find('.prpanel-heading').addClass('prpanel-heading-samehw');
                        } else {
                            self.$geoInfoResult.removeClass(removeClassFn).addClass('moveTop33');
                            self.$geoInfoResult.find('.prcollapsed').removeClass('prcollapsed-samehw');
                            self.$geoInfoResult.find('.prpanel-heading').removeClass('prpanel-heading-samehw');
                        }

                        break;
                    }
                    case false: {
                        break;
                    }
                }
            }
        };

        self.elevationActive = {
            isElevationActive: false,
            get: function () {
                return this.isElevationActive;
            },
            set: function (val) {
                this.isElevationActive = val;

                if (!self.$geoInfoResult)
                    self.$geoInfoResult = $('.' + self.CLASS + '-info-tracking div.tc-ctl-p-results');

                switch (this.isElevationActive) {
                    case true: {
                        if (self.trackingActive.get()) {
                            self.$geoInfoResult.removeClass(removeClassFn).addClass('moveTop159');
                            self.$geoInfoResult.find('.prcollapsed').addClass('prcollapsed-samehw');
                            self.$geoInfoResult.find('.prpanel-heading').addClass('prpanel-heading-samehw');
                        }
                        break;
                    }
                    case false: {
                        if (self.trackingActive.get()) {
                            self.$geoInfoResult.removeClass(removeClassFn).addClass('moveTop33');
                            self.$geoInfoResult.find('.prcollapsed').removeClass('prcollapsed-samehw');
                            self.$geoInfoResult.find('.prpanel-heading').removeClass('prpanel-heading-samehw');
                        }
                        break;
                    }
                }
            }
        };

        self.elevationActiveCollapsed = {
            isElevationActiveCollapsed: false,
            get: function () {
                return this.isElevationActiveCollapsed;
            },
            set: function (val) {
                this.isElevationActiveCollapsed = val;

                if (!self.$geoInfoResult)
                    self.$geoInfoResult = $('.' + self.CLASS + '-info-tracking div.tc-ctl-p-results');

                switch (this.isElevationActiveCollapsed) {
                    case true: {
                        if (self.trackingActive.get()) {
                            self.$geoInfoResult.removeClass(removeClassFn).addClass('moveTop57');
                            self.$geoInfoResult.find('.prcollapsed').removeClass('prcollapsed-samehw');
                            self.$geoInfoResult.find('.prpanel-heading').removeClass('prpanel-heading-samehw');
                        }
                        break;
                    }
                    case false: {
                        if (self.trackingActive.get()) {
                            self.$geoInfoResult.removeClass(removeClassFn).addClass('moveTop159');
                            self.$geoInfoResult.find('.prcollapsed').addClass('prcollapsed-samehw');
                            self.$geoInfoResult.find('.prpanel-heading').addClass('prpanel-heading-samehw');
                        }
                        break;
                    }
                }
            }
        };

        var sel = self.Const.Selector;

        TC.Control.prototype.renderData.call(self, data, function () {

            var $options = self._$div.find(self._classSelector + '-panel');
            self._$div.find('.tc-ctl-geolocation-select span').on(TC.Consts.event.CLICK, function (e) {
                var $cb = $(this).closest('label').find('input[type=radio][name=mode]');

                var newFormat = $cb.val();
                $options.removeClass(TC.Consts.classes.HIDDEN);
                $options.not('.tc-ctl-geolocation-' + newFormat).addClass(TC.Consts.classes.HIDDEN);
            });

            self.gps = {};
            self.gps.$activateButton = self._$div.find(self._classSelector + '-locate-show');
            self.gps.$deactivateButton = self._$div.find(self._classSelector + '-locate-hide');

            self.track = {};
            self.track.$activateButton = self._$div.find(self._classSelector + '-track-ui-activate');
            self.track.$deactivateButton = self._$div.find(self._classSelector + '-track-ui-deactivate');
            self.track.$info = self._$div.find(self._classSelector + '-info-tracking').appendTo(self.map._$div);

            $(document).on('click', '#trackingInfoMin', function () {
                var $divRP = $(this).closest('div.tc-ctl-p-results');
                $divRP.find('.prsidebar-body').toggle('slide', function () {
                    $divRP.find('.prcollapsed-max').fadeIn();
                });
            });
            $(document).on('click', '#trackingInfoMax', function () {
                var $divRP = $(this).closest('div.tc-ctl-p-results');
                $divRP.find('.prsidebar-body').toggle('slide');
                $divRP.find('.prcollapsed-max').hide();
            });
            $(document).on('click', '#trackingInfoClose', function () {
                $(this).closest('div.tc-ctl-p-results').find('.prsidebar-body').fadeOut('slide');
            });

            self.track.$trackSearch = self._$div.find(self._classSelector + '-track-available-srch');
            self.track.$trackList = self._$div.find(self._classSelector + '-track-available-lst');

            self.track.$trackToolPanelOpened = self._$div.find('#tc-ctl-geolocation-track-panel-opened');

            self._$div.find('.' + ctlProto.CLASS + '-track-panel-help').click(function () {
                _showAlerMsg.call(self);
            });

            self.track.$trackName = self._$div.find(self._classSelector + '-track-title');
            self.track.$trackSave = self._$div.find(self._classSelector + '-track-save');

            self.track.$trackWPT = self._$div.find(self._classSelector + '-track-waypoint');
            self.track.$trackAdd = self._$div.find(self._classSelector + '-track-add-wpt');

            self.track.$trackContinue = self._$dialogDiv.find('.tc-ctl-geolocation-track-continue');
            self.track.$trackRenew = self._$dialogDiv.find('.tc-ctl-geolocation-track-new');
            self.track.$trackClose = self._$dialogDiv.find('.tc-ctl-geolocation-continue-track-dialog button.tc-modal-close');
            self.track.$trackAddSegment = self._$div.find('#tc-ctl-geolocation-track-segment');

            self.track.$trackAdvertisementOK = self._$dialogDiv.find('.tc-ctl-geolocation-track-advert-ok');

            self.track.$trackImportFile = self._$div.find(self._classSelector + '-track-import');


            if (TC.Util.detectMobile()) {
                if (Modernizr.mq('screen and (max-height: 50em) and (max-width: 50em)'))
                    self.track.$trackToolPanelOpened.prop('checked', false);
            }

            if (window.File && window.FileReader && window.FileList && window.Blob) {
                self.track.$trackImportFile.removeAttr('disabled');
                self.track.$trackImportFile.on(TC.Consts.event.CLICK, function (e) {
                    $(this).wrap('<form>').closest('form').get(0).reset();
                    $(this).unwrap();
                })
                self.track.$trackImportFile.on('change', function (e) {
                    if (!self._cleaning) { // Valido que el evento import no lo provoco yo al limpiar el fileinput (al limpiar se lanza el change)                        
                        self.clear(self.Const.Layers.TRACK);

                        if (self.map) {
                            self.map.on(TC.Consts.event.LAYERERROR, _layerError);
                            self.importedByMe = true;
                            self.map.wrap.loadFiles(e.target.files);
                        }
                    }
                });
            } else {
                console.log('no es posible la importación');
            }

            self.gps.$activateButton.on('click', function () {
                self.activateGPS();
            });
            self.gps.$deactivateButton.on('click', function () {
                self.deactivateGPS();
            });

            self.track.$activateButton.on('click', function () {
                self.activateTracking();
                _activateTrackingBtns.call(self);

            });
            self.track.$deactivateButton.on('click', function () {
                self.deactivateTracking();
                _deactivateTrackingBtns.call(self);
            });

            var _filter = function (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                //tc-ctl-geolocation-track-available-empty
                var $li = self.track.$trackList.find('li').hide();
                var $trackLi = $li.filter('li:not([class]),li.' + self.Const.Classes.SELECTEDTRACK);

                if (searchTerm.length === 0) {
                    $trackLi.show();
                    self._$div.find(self._classSelector + '-track-search-icon').css('visibility', 'visible');
                } else {
                    self._$div.find(self._classSelector + '-track-search-icon').css('visibility', 'hidden');
                    var r = new RegExp(searchTerm, 'i');
                    $trackLi.each(function () {
                        var $this = $(this);
                        $this.toggle(r.test($this.children('span').text()));
                    });

                    if ($trackLi.filter(':visible').length === 0)
                        $li.filter('[class^="tc-ctl-geolocation-track-not"]').show();
                }
            };
            self.track.$trackSearch.on("keyup search", function () {
                _filter($(this).val().toLowerCase().trim());
            });

            // IE10 polyfill
            try {
                if (self.track.$trackSearch.has($('::-ms-clear'))) {
                    var oldValue;
                    self.track.$trackSearch.on('mouseup', function (e) {
                        oldValue = self.track.$trackSearch.val();

                        if (oldValue === '') {
                            return;
                        }

                        // When this event is fired after clicking on the clear button
                        // the value is not cleared yet. We have to wait for it.
                        setTimeout(function () {
                            var newValue = self.track.$trackSearch.val();

                            if (newValue === '') {
                                _filter(newValue);
                            }
                        }, 1);
                    });
                }
            }
            catch (e) { }

            // en el panel
            self.track.$trackSave.on('click', $.proxy(self.saveTrack, self));
            self.track.$trackAdd.on('click', $.proxy(self.addWaypoint, self));

            // en lista
            var _edit = function (edit, $self) {
                if (!$self.is('li'))
                    $self = $self.parent();

                if (edit) {

                    $self.find('input').first().removeClass(TC.Consts.classes.HIDDEN);
                    $self.find('span').first().addClass(TC.Consts.classes.HIDDEN);

                    $self.find('input').first().focus().val($self.find('span').first().text());

                    $self.find(sel.SIMULATE).first().addClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.EDIT).first().addClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.DELETE).first().addClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.DRAW).first().addClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.EXPORT_GPX).first().addClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.EXPORT_KML).first().addClass(TC.Consts.classes.HIDDEN);

                    $self.find(sel.SAVE).first().removeClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.CANCEL).first().removeClass(TC.Consts.classes.HIDDEN);
                } else {

                    $self.find('input').first().addClass(TC.Consts.classes.HIDDEN);
                    $self.find('span').first().removeClass(TC.Consts.classes.HIDDEN);

                    $self.find(sel.SIMULATE).first().removeClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.EDIT).first().removeClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.DELETE).first().removeClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.DRAW).first().removeClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.EXPORT_GPX).first().removeClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.EXPORT_KML).first().removeClass(TC.Consts.classes.HIDDEN);

                    $self.find(sel.SAVE).first().addClass(TC.Consts.classes.HIDDEN);
                    $self.find(sel.CANCEL).first().addClass(TC.Consts.classes.HIDDEN);
                }
            };
            self.uiSimulate = function (simulate, $self) {
                var editControls = [
                    sel.SIMULATE,
                    sel.EDIT,
                    sel.DELETE,
                    sel.EXPORT_GPX,
                    sel.EXPORT_KML
                ];
                var simulateControls = [sel.STOP, sel.PAUSE, sel.BACKWARD, sel.FORWARD, sel.SPEED];
                var cnt = $self.is('li') ? $self : $self.parent();

                if (simulate) {
                    for (var i = 0; i < editControls.length; i++)
                        $(cnt).find(editControls[i]).first().attr('hidden', 'hidden');

                    for (var i = 0; i < simulateControls.length; i++)
                        $(cnt).find(simulateControls[i]).first().removeAttr('hidden');
                } else {
                    for (var i = 0; i < simulateControls.length; i++) {
                        $(cnt).find(simulateControls[i]).first().attr('hidden', 'hidden');
                    }

                    for (var i = 0; i < editControls.length; i++)
                        $(cnt).find(editControls[i]).first().removeAttr('hidden');
                }
            };
            $(document).on("click", sel.SIMULATE, function () {
                var wait = self.getLoadingIndicator().addWait();

                $(this).parent().find(sel.SPEED).text('x 1');

                $.when(_loadTrack(self, this)).then(function () { //Para evitar el bloqueo de la interfaz en móviles
                    self.getLoadingIndicator().removeWait(wait)
                });
            });
            $(document).on("click", sel.DRAW, function () {
                var wait = self.getLoadingIndicator().addWait();

                $.when(_drawTrack(self, this)).then(function () {
                    self.getLoadingIndicator().removeWait(wait)
                });
            });

            self.$events.on(self.Const.Event.IMPORTEDTRACK, function (e, index) {
                var $listElement = self.track.$trackList.find('li[data-id="' + index + '"]');
                _drawTrack(self, $listElement.find(sel.DRAW));
                self.track.$trackList.animate({
                    scrollTop: index * $listElement.outerHeight()
                }, 'slow');
            });

            var _stopOtherTracks = function (self, trackLiId) {
                var trackListItems = self.track.$trackList.find('li[data-id]');

                for (var i = 0; i < trackListItems.length; i++) {
                    var $listItem = $(trackListItems[i]);


                    if ($listItem && $listItem.attr('data-id') !== trackLiId) {
                        var $btnSimulate = $listItem.find(sel.SIMULATE);
                        var $btnPause = $listItem.find(sel.PAUSE);

                        $btnSimulate.toggleClass(self.Const.Classes.SIMULATIONACTIVATED, false);
                        $btnSimulate.attr('title', self.getLocaleString("tr.lst.simulate"));
                        $btnPause.toggleClass('play', false);
                        $btnPause.attr('title', self.getLocaleString("tr.lst.pause"));

                        self.uiSimulate(false, $listItem);
                        _edit(false, $listItem);
                    }
                }

                self.clear(self.Const.Layers.TRACK);
            };

            var _drawTrack = function (self, btnDraw) {
                var deferred = $.Deferred();
                var $trackLi = $(btnDraw).parent();

                setTimeout(function () {
                    if ($trackLi.hasClass(self.Const.Classes.SELECTEDTRACK)) {
                        self.uiSimulate(false, $(btnDraw));
                        self.clear(self.Const.Layers.TRACK);

                        $(btnDraw).attr("title", $(btnDraw).text());
                        self.elevationActive.set(false);

                        // GLS: Eliminamos la capa para que el TOC pueda reflejar el cambio
                        if (self.layerTrack !== undefined) {
                            self.map.removeLayer(self.layerTrack);
                            self.layerTrack = undefined;
                        }
                    }
                    else if (self.getSelectedTrack().length > 0) { // GLS: si hay elemento seleccionado actuamos
                        _stopOtherTracks(self, $trackLi.attr('data-id'));
                        self.drawTrack($trackLi);
                    } else { self.drawTrack($trackLi); }
                    deferred.resolve();
                }, 0);

                return deferred.promise();
            };

            var _loadTrack = function (self, btnSimulate) {
                var deferred = $.Deferred();

                setTimeout(function () {
                    var $trackLi = $(btnSimulate).parent();

                    // GLS: creo una capa nueva cada vez que selecciona un track de la lista porque si no los cambios de la capa mediante el TOC no son "escuchables"                    
                    self.getLayer(self.Const.Layers.TRACK).then(function (layer) {

                        _stopOtherTracks(self, $trackLi.attr('data-id'));
                        self.uiSimulate(false, self.getSelectedTrack());
                        $(this).parent().addClass(self.Const.Classes.SELECTEDTRACK);
                        self.uiSimulate(true, $(btnSimulate));

                        self.simulate_paused = false;
                        self.simulateTrack($(btnSimulate).parent());

                        deferred.resolve();
                    });
                }, 0);

                return deferred.promise();
            };


            $(document).on("click", self._classSelector + ' ' + sel.EDIT, function () {
                _edit(true, $(this));
            });
            $(document).on("click", self._classSelector + ' ' + sel.DELETE, function () {
                _stopOtherTracks(self);
                self.removeTrack($(this).parent());
            });
            $(document).on("click", self._classSelector + ' ' + sel.SAVE, function () {
                var newName = $(this).parent().find('input').first().val();
                if (newName.trim().length == 0) {
                    TC.alert(self.getLocaleString("geo.trk.edit.alert"));
                }
                else {
                    self.editTrackName($(this).parent().attr('data-id'), $(this).parent().find('input').first().val());
                    _edit(false, $(this));
                }
            });
            $(document).on("click", self._classSelector + ' ' + sel.CANCEL, function () {
                _edit(false, $(this));
            });

            $(document).on("click", self._classSelector + ' ' + sel.EXPORT_GPX + "," + self._classSelector + ' ' + sel.EXPORT_KML, function () {
                var that = this;
                var prefix = 'tc-btn-export-';
                var className = $.grep($(this).attr('class').split(' '), function (cls) {
                    return cls.indexOf(prefix) === 0;
                })[0];
                var mimeType = className.replace(prefix, '').toUpperCase();

                self.export(mimeType, $(this).parent()).then(function (data) {
                    if (data) TC.Util.downloadFile($(that).parent().find('span').first().text() + '.' + mimeType.toLowerCase(), self.Const.MimeMap[mimeType], data);
                    else TC.alert(self.getLocaleString("geo.error.export"));
                });
            });


            $(document).on("click", self._classSelector + ' ' + sel.STOP, function () {
                self.uiSimulate(false, $(this));
                self.wrap.simulateTrackEnd();
                //$(this).parent().find(sel.DRAW).attr('title', self.getLocaleString("tr.lst.draw"));
                var $btnPause = $(this).parent().find(sel.PAUSE);
                $btnPause.toggleClass('play', false);
                $btnPause.attr('title', self.getLocaleString("tr.lst.pause"));

                $(this).parent().find(sel.SPEED).text('x 1');
                self.simulate_speed = 1;
            });
            $(document).on("click", self._classSelector + ' ' + sel.PAUSE, function () {
                self.simulate_paused = !$(this).hasClass('play');
                if (self.simulate_paused)
                    self.simulate_pausedElapse = -1;

                $(this).attr('title', self.getLocaleString(self.simulate_paused ? "tr.lst.play" : "tr.lst.pause"));
                $(this).toggleClass('play', self.simulate_paused);
            });

            var lapse = 0.5;
            $(document).on("click", self._classSelector + " " + sel.BACKWARD, function () {
                if (self.simulate_speed == 1)
                    self.simulate_speed = lapse;
                else self.simulate_speed = self.simulate_speed / 2;

                $(self._classSelector + " " + sel.FORWARD).removeAttr('disabled');

                $(this).parent().find(sel.SPEED).text(self.simulate_speed < 1 ? '/ ' + (1 / self.simulate_speed) : 'x ' + self.simulate_speed);

                if (self.simulate_speed == 0.000244140625) {
                    $(this).attr('disabled', 'disabled');
                }
            });
            $(document).on("click", self._classSelector + " " + sel.FORWARD, function () {
                self.simulate_speed = self.simulate_speed / lapse;

                $(this).parent().find(sel.SPEED).text(self.simulate_speed < 1 ? '/ ' + (1 / self.simulate_speed) : 'x ' + self.simulate_speed);

                $(self._classSelector + " " + sel.BACKWARD).removeAttr('disabled');

                if (self.simulate_speed == 4096) {
                    $(this).attr('disabled', 'disabled');
                }
            });


            // popup
            self.track.$trackContinue.on('click', function () {
                // cerramos popup y continuamos con el track de session y almacenando en session
                TC.Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                _tracking.call(self);
            });
            self.track.$trackRenew.on('click', function () {
                // eliminamos el track actual de session - restablecemos el tracking
                delete self.sessionTracking;
                TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, undefined);
                localforage.removeItem(self.Const.LocalStorageKey.TRACKINGTEMP);
                // cerramos el popup
                TC.Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                _tracking.call(self);
            });
            self.track.$trackClose.on('click', function () {
                _deactivateTrackingBtns.call(self);
            });
            self.track.$trackAddSegment.on('click', function () {
                TC.alert('pendiente');
                // cerramos el popup
                TC.Util.closeModal();
            });

            // popup advertencia
            self.track.$trackAdvertisementOK.on('click', function () {

                var checkbox = $(body).find('input[name*="Advertisement"]:checked');

                if (checkbox.length > 0) {
                    var done = new $.Deferred();
                    if (window.localforage)
                        done.resolve();
                    else {
                        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                            done.resolve();
                        });
                    }

                    done.then(function () {
                        localforage.setItem(checkbox.first().attr('name'), false);
                    });
                }

                TC.Util.closeModal();
            });

            self.track.renderTrack = $('#tc-ctl-geolocation-track-render').change(function () {
                if (self.track.$activateButton.hasClass(TC.Consts.classes.HIDDEN))
                    self.wrap.setTrackOnMapVisibility(this.checked);

                visibilityTrack = this.checked;
            });

            if (window.localforage)
                self.bindTracks();
            else {
                TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                    self.bindTracks();
                });
            }
        });

        if ($.isFunction(callback)) {
            callback();
        }
    };

    ctlProto.activate = function () {
        var self = this;
        TC.Control.prototype.activate.call(self);        
    };

    ctlProto.deactivate = function () {
        var self = this;
        
        self.clearSelection();
        self.deactivateTracking();
        TC.Control.prototype.deactivate.call(self);
    };

    var _layerError = function () {
        var self = this;

        self.map.off(TC.Consts.event.LAYERERROR, _layerError);
        self.clearFileInput(self.track.$trackImportFile);

        TC.alert(self.getLocaleString("geo.trk.upload.error3"));
    };
    var _activateTrackingBtns = function () {
        var self = this;

        self.track.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
        self.track.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
    };

    var _deactivateTrackingBtns = function () {
        var self = this;

        self.track.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
        self.track.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
    };

    var _showAlerMsg = function () {
        var self = this;
        self.map.toast(self._$div.find(".alert-warning").html(), {
            duration: 10000
        });
    };

    ctlProto.getLayer = function (layerType) {
        var self = this;

        var isLayer = true;
        var newLayer = "";
        var styles;

        switch (true) {
            case layerType == self.Const.Layers.TRACKING:
                isLayer = self.layerTracking !== undefined;
                newLayer = "layerTracking";
                break;
            case layerType == self.Const.Layers.TRACK:
                isLayer = self.layerTrack !== undefined;
                newLayer = "layerTrack";
                styles = {
                    line: {
                        strokeWidth: 2,
                        strokeColor: "#C52737"
                    },
                    point: {
                        radius: 3,
                        fillColor: "#C52737",
                        strokeColor: "#ffffff",
                        fontColor: "#C52737",
                        fontSize: 10,
                        fontWeight: "bold",
                        labelOutlineColor: "#ffffff",
                        labelOutlineWidth: 2,                        
                        label: function (feature) {
                            var name = feature.getData()['name'];
                            if (name && (name + '').trim().length > 0) {
                                name = (name + '').trim().toLowerCase();
                            } else {
                                name = '';
                            }

                            return name;
                        }
                    }
                };
                break;
            case layerType == self.Const.Layers.GPS:
                isLayer = self.layerGPS !== undefined;
                newLayer = "layerGPS";
                break;
        }

        if (this[newLayer]) {
            var done = new $.Deferred();
            done.resolve(this[newLayer]);
            return done;
        } else if (!self.layerPromise || self.layerPromise.state() === "resolved") {
            self.layerPromise = new $.Deferred();

            var opt = {
                id: TC.getUID(),
                type: TC.Consts.layerType.VECTOR,
                title: self.getLocaleString("geo") + ' - ' + layerType,
                stealth: true
            };

            if (styles) {
                opt.styles = styles;
            }

            $.when(self.map.addLayer(opt)).then(function (layer) {
                this[newLayer] = layer;
                this[newLayer].map.putLayerOnTop(layer);
                self.layerPromise.resolve(this[newLayer]);
            }.bind(self));

            return self.layerPromise;
        }
        else {
            return self.layerPromise;
        }
    };

    ctlProto.activateGPS = function () {
        var self = this;

        self.deactivateTracking();

        advertisement.call(self, self.Const.LocalStorageKey.GPSSHOWADVERTISEMENT);

        addVideoKeepScreenOn.apply(self);
        addWindowEvents.apply(self);

        self.gps.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
        self.gps.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, false);

        if (!self.track.$trackToolPanelOpened.prop('checked')) {
            self.map.$events.trigger($.Event(TC.Consts.event.TOOLSCLOSE), {});
        }

        $.when(self.getLayer(self.Const.Layers.GPS)).then(function (layer) {

            self.currentPositionWaiting = self.getLoadingIndicator().addWait();

            if (navigator.geolocation) {
                var options = {
                    timeout: 60000
                };

                var watch = function (data) {
                    data = data.coords;

                    self.geopositionGPS = true;

                    var projectedPosition = TC.Util.reproject([data.longitude, data.latitude], 'EPSG:4326', self.map.crs);

                    self.getLoadingIndicator().removeWait(self.currentPositionWaiting);
                    if (layer)
                        layer.clearFeatures();

                    // desde el control de búsquedas
                    var insideLimit = function (point) {
                        var getIntersectsBounds = function (extent, point) {
                            if (extent instanceof Array)
                                return point[0] >= extent[0] && point[0] <= extent[2] && point[1] >= extent[1] && point[1] <= extent[3];
                            else return true;
                        };

                        if (getIntersectsBounds(self.map.options.maxExtent, point)) {
                            return true;
                        }

                        return false;
                    };

                    if (insideLimit(projectedPosition)) {
                        $.when(
                            layer.addCircle([projectedPosition, data.accuracy]),
                            layer.addMarker(projectedPosition, {
                                title: 'GPS', cssClass: TC.Consts.classes.POINT, anchor: [0.5, 0.5]
                            })
                        ).then(function (circle, point) {
                            self.gps.accuracyCircle = circle;
                            self.gps.geoPosition = point;

                            if (!self.wrap.pulsated) {
                                self.map.zoomToFeatures(layer.features, {
                                    animate: false
                                });
                                self.wrap.pulsate(circle);
                            }
                        });
                    }
                    else TC.alert(self.getLocaleString("geo.error.out"));
                };

                if (navigator.geolocation) {

                    navigator.geolocation.getCurrentPosition(function (data) {
                        self.data = data;
                        watch(data);
                        self.currentPosition = navigator.geolocation.watchPosition(watch, self.onGeolocateError.bind(self));
                    }, self.onGeolocateError.bind(self));

                    // FIX para IE y FF. Si el usuario cierra el diálogo de pedida de permisos del navegador con el aspa, no se produce respuesta, y por tanto
                    // el indicador de loading se queda visible de manera indefinida
                    setTimeout(function () {
                        if (!self.data) {
                            self.getLoadingIndicator().removeWait(self.currentPositionWaiting);
                            self.map.toast(self.getLocaleString("geo.error.permission_denied"), {
                                type: TC.Consts.msgType.WARNING
                            });
                            self.gps.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
                            self.gps.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
                        }
                    }, options.timeout + 1000); // Wait extra second

                } else {
                    alert('not supported');
                }

            } else {
                self.onGeolocateError();
            }
        });
    };

    ctlProto.deactivateGPS = function () {
        var self = this;

        delete self.geopositionGPS;

        removeVideoKeepScreenOn();
        removeWindowEvents();

        // eliminamos el flag que nos indica cuándo animar
        delete self.wrap.pulsated;

        if (navigator.geolocation && self.currentPosition) {
            navigator.geolocation.clearWatch(self.currentPosition);
        }

        $.when(self.getLayer(self.Const.Layers.GPS)).then(function (layer) {
            if (layer)
                layer.clearFeatures();
        });

        self.gps.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
        self.gps.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, true);

        if (self.currentPositionWaiting)
            self.getLoadingIndicator().removeWait(self.currentPositionWaiting);

        return true;
    };


    var duringTrackingToolsPanel = function () {
        var self = this;

        if (!self.track.$trackToolPanelOpened.prop('checked'))
            self.map.$events.trigger($.Event(TC.Consts.event.TOOLSCLOSE), {});
    };

    var _tracking = function () {
        var self = this;

        self.activate();

        _activateTrackingBtns.call(self);
        duringTrackingToolsPanel.call(self);

        self.track.$info.find('.prsidebar-body').show();

        self.$events.on(self.Const.Event.POSITIONCHANGE, function (d) {

            self.currentPoint = d.pd;

            var data = {};
            var locale = TC.Util.getMapLocale(self.map);
            data.x = Math.round(d.pd.position[0]).toLocaleString(locale);
            data.y = Math.round(d.pd.position[1]).toLocaleString(locale);
            data.z = (Math.round(d.pd.altitude).toLocaleString(locale));
            data.accuracy = (Math.round(d.pd.accuracy).toLocaleString(locale));
            data.speed = d.pd.speed.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

            if (data) {
                self.getRenderedHtml(self.CLASS + '-tracking-toast', data, function (html) {

                    self.track.$info.find('.prpanel-body').html(html);

                    if (self.track.$info.hasClass(TC.Consts.classes.HIDDEN)) {
                        self.track.$info.removeClass(TC.Consts.classes.HIDDEN);
                    }

                    self.trackingActive.set(true);
                });
            }

            self.track.$trackName.removeAttr('disabled');
            self.track.$trackSave.removeAttr('disabled');

            self.track.$trackWPT.removeAttr('disabled');
            self.track.$trackAdd.removeAttr('disabled');

            // cada vez que se registra una nueva posición almacenamos en sessionStorage
            TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.formattedToStorage(self.layerTracking));
        });
        self.$events.on(self.Const.Event.STATEUPDATED, function (data) {
            //$(self.track.htmlMarker).attr('src', data.moving ? 'layout/idena/img/geo-marker-heading.png' : 'layout/idena/img/geo-marker.png');
        });

        self.clear(self.Const.Layers.TRACKING);

        advertisement.call(self, self.Const.LocalStorageKey.TRACKINGSHOWADVERTISEMENT);

        self.wrap.setTracking(true);
    };

    /* inicio gestión suspensión de la pantalla en móviles */
    var _onpauseVideo;
    var addVideoKeepScreenOn = function () {
        var self = this;

        if (!self.videoScreenOn) {
            var media = {
                WebM: "data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA=",
                MP4: "data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthADAowdbb9/AAAC6W1vb3YAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIVdHJhawAAAFx0a2hkAAAAD3wlsIB8JbCAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAgbWRoZAAAAAB8JbCAfCWwgAAAA+gAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVxtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEcc3RibAAAALhzdHNkAAAAAAAAAAEAAACobXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAIAAgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAFJlc2RzAAAAAANEAAEABDwgEQAAAAADDUAAAAAABS0AAAGwAQAAAbWJEwAAAQAAAAEgAMSNiB9FAEQBFGMAAAGyTGF2YzUyLjg3LjQGAQIAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAEwAAAAEAAAAUc3RjbwAAAAAAAAABAAAALAAAAGB1ZHRhAAAAWG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAAK2lsc3QAAAAjqXRvbwAAABtkYXRhAAAAAQAAAABMYXZmNTIuNzguMw=="
            };

            self.videoScreenOn = document.createElement('video');
            self.videoScreenOn.setAttribute("loop", "");
            self.videoScreenOn.setAttribute("muted", "");
            self.videoScreenOn.setAttribute("webkit-playsinline", "");
            self.videoScreenOn.setAttribute("playsinline", "");
            self.videoScreenOn.setAttribute("style", "transform: translateZ(0px);");

            var sourceWebM = document.createElement('source');
            sourceWebM.src = media.WebM;
            sourceWebM.type = "video/webm";
            self.videoScreenOn.appendChild(sourceWebM);

            var sourceMP4 = document.createElement('source');
            sourceMP4.src = media.MP4;
            sourceMP4.type = "video/mp4";
            self.videoScreenOn.appendChild(sourceMP4);
        }

        self.videoScreenOn.play();
    };
    var removeVideoKeepScreenOn = function () {
        var self = this;
        if (self.videoScreenOn) {
            self.videoScreenOn.pause();
        }
    };

    var _onWindowBlurred;
    var onWindowBlurred = function () {
        var self = this;

        console.log('onWindowBlurred');
        console.log('video is: ' + self.videoScreenOn.paused);

        fromSessionToStorage.apply(self);

        return 'Texto de aviso';
    };

    var _onWindowFocused;
    var onWindowFocused = function () {
        var self = this;

        console.log('onWindowFocused');
        console.log('video is: ' + self.videoScreenOn.paused);

        if (self.videoScreenOn.paused)
            self.videoScreenOn.play();

        fromStorageToSession.apply(self);

        console.log('video is: ' + self.videoScreenOn.paused);
    };

    var getHiddenProperty = function () {
        var prefixes = ['webkit', 'moz', 'ms', 'o'];

        if ('hidden' in document) return 'hidden';

        for (var i = 0; i < prefixes.length; i++) {
            if ((prefixes[i] + 'Hidden') in document)
                return prefixes[i] + 'Hidden';
        }

        return null;
    };
    var _onWindowVisibility;
    var onWindowVisibility = function () {
        var self = this;

        var hidden = getHiddenProperty();

        if (!document[hidden])
            onWindowFocused.apply(self);

        console.log('video is: ' + self.videoScreenOn.paused);
    };
    var addWindowEvents = function () {
        var self = this;

        if (!_onWindowVisibility)
            _onWindowVisibility = onWindowVisibility.bind(self);

        if (!_onWindowBlurred)
            _onWindowBlurred = onWindowBlurred.bind(self);

        if (!_onWindowFocused)
            _onWindowFocused = onWindowFocused.bind(self);

        window.addEventListener('visibilitychange', _onWindowVisibility, false);

        // ipad / iphone / ipod (Safari mobile, not Android default browsers not Chrome Mobile that is)
        if (TC.Util.detectSafari() && Modernizr.touch && !navigator.userAgent.match(/Android/i) && !navigator.userAgent.match(/CriOS/i)) {
            window.addEventListener('pagehide', _onWindowBlurred, false);
            window.addEventListener('pageshow', _onWindowFocused, false);
        } else { // the rest            
            window.addEventListener('blur', _onWindowBlurred, false);
            window.addEventListener('focus', _onWindowFocused, false);
        }
    }
    var removeWindowEvents = function () {

        window.removeEventListener('visibilitychange', _onWindowVisibility, false);

        // ipad / iphone / ipod (Safari mobile, not Android default browsers not Chrome Mobile that is)
        if (TC.Util.detectSafari() && Modernizr.touch && !navigator.userAgent.match(/Android/i) && !navigator.userAgent.match(/CriOS/i)) {
            window.removeEventListener('pagehide', _onWindowBlurred, false);
            window.removeEventListener('pageshow', _onWindowFocused, false);
        } else { // the rest            
            window.removeEventListener('blur', _onWindowBlurred, false);
            window.removeEventListener('focus', _onWindowFocused, false);
        }
    };

    var fromSessionToStorage = function () {
        var self = this;

        var sessionTracking = TC.Util.storage.getSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP);
        if (sessionTracking && sessionTracking.length > 0)
            localforage.setItem(self.Const.LocalStorageKey.TRACKINGTEMP, typeof (sessionTracking) === "string" ? sessionTracking : JSON.stringify(sessionTracking));
    };
    var fromStorageToSession = function () {
        var self = this;

        localforage.getItem(self.Const.LocalStorageKey.TRACKINGTEMP).then(function (storageData) {
            if (storageData !== null && storageData !== "null" && storageData.length > 0) {
                TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, storageData);
            }
        });
    };
    /* final gestión suspensión de la pantalla en móviles */

    var advertisement = function (showAdvertisement) {
        var self = this;

        var done = new $.Deferred();
        if (window.localforage)
            done.resolve();
        else {
            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                done.resolve();
            });
        }

        done.then(function () {
            localforage.getItem(showAdvertisement).then(function (registeredShowAdvertisement) {
                if (registeredShowAdvertisement == null) {
                    var $dialog = self._$dialogDiv.find('.tc-ctl-geolocation-track-advert-dialog');
                    $dialog.find('input[type="checkbox"]').first().attr('name', showAdvertisement).removeAttr('checked');

                    if (!TC.Util.detectMobile()) {
                        $('#pageBlurMsg').text(self.getLocaleString('geo.trk.page.blur.desktop'));
                    } else { $('#pageBlurMsg').text(self.getLocaleString('geo.trk.page.blur')); }

                    if (showAdvertisement == self.Const.LocalStorageKey.GPSSHOWADVERTISEMENT)
                        $dialog.find('h3').text(self.getLocaleString("geo.track.activate") + " " + self.getLocaleString("geo.gps"));
                    else $dialog.find('h3').text(self.getLocaleString('geo.track.activate.title'));

                    TC.Util.showModal(self._$dialogDiv.find('.tc-ctl-geolocation-track-advert-dialog'));
                }
            });
        });

        self.map.toast(!TC.Util.detectMobile() ? self.getLocaleString('geo.trk.page.blur.desktop') : self.getLocaleString('geo.trk.page.blur'), {
            type: TC.Consts.msgType.WARNING
        });
    };

    ctlProto.activateTracking = function () {
        var self = this;
        var trackingAvailable = true;

        self.clear(self.Const.Layers.TRACKING);

        try {
            TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TEST, self.Const.LocalStorageKey.TEST);
        } catch (error) {
            if (error.code === DOMException.QUOTA_EXCEEDED_ERR)
                TC.alert(self.getLocaleString("geo.error.trackinglocalstorage"));
            else TC.error(error);

            trackingAvailable = false;
        }

        if (trackingAvailable) {
            addVideoKeepScreenOn.apply(self);
            addWindowEvents.apply(self);

            self.sessionTracking = TC.Util.storage.getSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP);
            if (self.sessionTracking) {
                TC.Util.showModal(self._$dialogDiv.find('.tc-ctl-geolocation-continue-track-dialog'), {
                    closeCallback: function () {
                        _deactivateTrackingBtns.call(self);
                    }
                });
            } else _tracking.call(self);
        } else { _deactivateTrackingBtns.call(self); }
    };

    ctlProto.deactivateTracking = function () {
        var self = this;

        var _deactivateTracking = function () {

            self.track.$info.addClass(TC.Consts.classes.HIDDEN);
            $('#trackingInfoMax').hide();

            fromSessionToStorage.apply(self);

            self.wrap.setTracking(false);


            delete self.geopositionTracking;

            if (!visibilityTrack)
                $(self._classSelector + '-track-render').find('label').click();

            removeVideoKeepScreenOn.apply(self);
            removeWindowEvents.apply(self);

            self.$events.off(self.Const.Event.POSITIONCHANGE);
            self.$events.off(self.Const.Event.STATEUPDATED);

            _deactivateTrackingBtns.call(self);

            self.trackingActive.set(false);

            self.track.$trackName.val('');
            self.track.$trackName.attr('disabled', 'disabled');
            self.track.$trackSave.attr('disabled', 'disabled');

            self.track.$trackWPT.val('');
            self.track.$trackWPT.attr('disabled', 'disabled');
            self.track.$trackAdd.attr('disabled', 'disabled');

            self.clear(self.Const.Layers.TRACKING);
            self.clear(self.Const.Layers.GPS);

            return true;
        };

        if (self.wrap.hasCoordinates()) {
            self.map.toast(self.getLocaleString("geo.trk.deactivate.alert"), {
                duration: 10000
            });
            //TC.alert(self.getLocaleString("geo.trk.deactivate.alert"));
            return _deactivateTracking();
        } else return _deactivateTracking();
    };

    /* Obtengo los tracks desde localForage */
    ctlProto.getStoredTracks = function () {
        var self = this;
        var done = new $.Deferred();
        var tracks = {};

        localforage.getItem(self.Const.LocalStorageKey.TRACKING)
            .then(function (strTracks) {

                if (strTracks && strTracks.length > 0) {
                    tracks = JSON.parse(strTracks);
                }

                var tracksArray = _orderTracks(tracks);

                self.availableTracks = tracksArray;
                done.resolve(tracksArray);
            });

        return done;
    };

    /**
     * Recibe una sucesión de tracks y la ordena por nombre.
     */
    var _orderTracks = function (tracks) {
        var tracksArray = [];

        for (var index in tracks) {
            if (tracks[index]) {
                tracksArray.push(tracks[index]);
                tracksArray.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
            }
        }

        return tracksArray;
    };

    /* Almaceno los tracks mediante localForage, actualizo la vble availableTracks y actualizo la lista de tracks */
    ctlProto.setStoredTracks = function (tracks) {
        var self = this;
        var done = new $.Deferred();

        localforage.setItem(self.Const.LocalStorageKey.TRACKING, JSON.stringify(tracks)).then(function () {
            self.getStoredTracks().then(function () {
                self.bindTracks();

                done.resolve();
            });
        });

        return done;
    };

    /* Obtengo los tracks desde vble local */
    ctlProto.getAvailableTracks = function () {
        var self = this;
        var done = new $.Deferred();

        if (!self.availableTracks) {
            self.getStoredTracks().then(function (availableTracks) {
                done.resolve(availableTracks);
            });
        }
        else done.resolve(self.availableTracks);

        return done;
    };

    ctlProto.bindTracks = function () {
        var self = this;

        self.track.$trackList.find('li:not([class^="tc-ctl-geolocation-track-available-empty"])').hide();
        self.track.$trackList.find('li[class^="tc-ctl-geolocation-track-available-empty"]').hide();

        self.getAvailableTracks().then(function (tracks) {

            if (_isEmpty(tracks)) {
                self.track.$trackList.find('li[class^="tc-ctl-geolocation-track-available-empty"]').show();
                self.track.$trackSearch.attr('disabled', 'disabled');
            }
            else {
                var currentSelectedTrackId = $(self.getSelectedTrack()[0]).attr('data-uid');
                self.track.$trackList.find('li[data-id]').remove();
                for (var t in tracks) {
                    self.getRenderedHtml(self.CLASS + '-track-node', {
                        id: t, uid: tracks[t].uid, name: tracks[t].name ? tracks[t].name.trim() : ''
                    }, function (html) {
                        self.track.$trackList.append(html);
                    });
                }

                self.setSelectedTrack(self.track.$trackList.find('li[data-uid="' + currentSelectedTrackId + '"]'));
                self.track.$trackSearch.removeAttr('disabled');
            }
        });
    };

    ctlProto.simulateTrack = function (li) {
        var self = this;

        self.simulate_speed = 1;

        self.drawTrack(li, false);
        self.wrap.simulateTrack();
    };

    ctlProto.drawTrack = function (li, activateSnapping) {
        var self = this;

        duringTrackingToolsPanel.call(self);

        // GLS: creo una capa nueva cada vez que selecciona un track de la lista porque si no los cambios de la capa mediante el TOC no son "escuchables"                    
        self.getLayer(self.Const.Layers.TRACK).then(function (layer) {
            self.setSelectedTrack(li);
            self.drawTrackingData(li);
            self.elevationTrack(li);

            self.activate();
        });
    };

    
    ctlProto.elevationTrack = function (li, resized) {
        var self = this;

        if (resized) {
            self.wrap.simulateTrackEnd();
            self.uiSimulate(false, li);
        }

        if (!self.onResize) {
            self.onResize = self.elevationTrack.bind(self, li, true);
            window.addEventListener("resize", self.onResize, false);
        }
        var elevationGain = {};
        var time = {};
        var km = 0;
        self.chart = {
            coordinates: []
        };

        //duringTrackingToolsPanel.call(self);

        if (self.track.elevationChart)
            self.track.elevationChart = self.track.elevationChart.destroy();

        var getChartData = function (li) {
            var done = new $.Deferred();
            var x, ele;
            x = [];
            ele = [];

            self.getTrackingData(li).then(function (geoJSON) {
                if (geoJSON) {
                    var f = (new ol.format.GeoJSON()).readFeatures(geoJSON);
                    for (var i = 0; i < f.length; i++) {
                        var geom = f[i].getGeometry();

                        var getDistance = function () {
                            var distance = geom.getLength();
                            return parseFloat((distance / 1000).toFixed(2));
                        };
                        var getTime = function () {
                            if (geom.getLayout() == ol.geom.GeometryLayout.XYZM) {
                                var diff = geom.getLastCoordinate()[3] - geom.getFirstCoordinate()[3];
                                return {
                                    s: Math.floor((diff / 1000) % 60),
                                    m: Math.floor(((diff / (1000 * 60)) % 60)),
                                    h: Math.floor(((diff / (1000 * 60 * 60)) % 24))
                                };
                            }

                            return null;
                        };
                        var getHill = function (coords) {
                            if (coords && coords.length > 0 && coords[0].length > 2) { // si tenemos la Z
                                var uphill = 0;
                                var downhill = 0;

                                var previousHeight = 0;
                                var sectorMinHeight = 0;
                                var sectorMaxHeight = 0;
                                var previousUphill = true;

                                for (var c = 0; c < coords.length; c++) {
                                    var point = coords[c];
                                    var height = point[2];
                                    if (c == 0) //--inicializar
                                    {
                                        previousHeight = height;
                                        sectorMinHeight = height;
                                        sectorMaxHeight = height;
                                    }

                                    sectorMinHeight = Math.min(sectorMinHeight, height); //--actualizar mínimo y máximo del sector
                                    sectorMaxHeight = Math.max(sectorMaxHeight, height);

                                    var delta = height - previousHeight; //--calcular desnivel del punto respecto al anterior
                                    // self.gapHill: altura de los dientes a despreciar
                                    if (delta > self.gapHill || (delta > 0 && c == coords.length - 1)) //--Si se sube más del filtro (o se acaba el segmento subiendo)
                                    {
                                        if (previousUphill) //--Si en el segmento anterior también se subía, incrementamos el desnivel positivo acumulado
                                        {
                                            uphill += delta;
                                        }
                                        else //--Si en el segmento anterior se bajaba, incrementamos los desniveles acumulados que no habíamos contabilizado desde el último salto del filtro (sector) 
                                        {
                                            downhill -= sectorMinHeight - previousHeight;
                                            uphill += height - sectorMinHeight;
                                            previousUphill = true; //--preparar para el paso siguiente
                                        }
                                        previousHeight = height; //--preparar para el paso siguiente
                                        sectorMinHeight = height;
                                        sectorMaxHeight = height;
                                    }
                                    else if (delta < -self.gapHill || (delta < 0 && c == coords.length - 1)) //--Si se baja más del filtro (o se acaba el segmento bajando)
                                    {
                                        if (!previousUphill) //--Si en el segmento anterior también se bajaba, incrementamos el desnivel negativo acumulado
                                        {
                                            downhill -= delta;
                                        }
                                        else //--Si en el segmento anterior se subía, incrementamos los desniveles acumulados que no habíamos contabilizado desde el último salto del filtro (sector) 
                                        {
                                            uphill += sectorMaxHeight - previousHeight;
                                            downhill -= height - sectorMaxHeight;
                                            previousUphill = false; //--preparar para el paso siguiente
                                        }
                                        previousHeight = height; //--preparar para el paso siguiente
                                        sectorMinHeight = height;
                                        sectorMaxHeight = height;
                                    }

                                }

                                return {
                                    upHill: Math.round(uphill),
                                    downHill: Math.round(downhill)
                                };

                            } else { return null; }
                        };

                        switch (geom.getType().toLowerCase()) {
                            case 'point':
                                continue;
                                break;
                            case 'linestring':
                                time = getTime(geom);
                                km = getDistance(geom);
                                elevationGain = getHill(geom.getCoordinates());
                                self.chart.coordinates = self.chart.coordinates.concat(geom.getCoordinates());
                                break;
                            case 'multilinestring':
                                var _time;
                                var ls = geom.getLineStrings();
                                for (var i = 0; i < ls.length; i++) {
                                    km = km + getDistance(ls[i]);

                                    if (ls[i].getLayout() == ol.geom.GeometryLayout.XYZM)
                                        _time = _time + (ls[i].getLastCoordinate()[3] - ls[i].getFirstCoordinate()[3]);

                                    self.chart.coordinates = self.chart.coordinates.concat(ls[i].getCoordinates());
                                }

                                if (_time)
                                    time = getTime(_time);
                                break;
                            default:
                                return null;
                                break;
                        }

                        /* x */

                        if (self.chart.coordinates.length > 0) {
                            var distance = 0;
                            x.push(distance);

                            for (var i = 1; i <= self.chart.coordinates.length - 1; i++) {
                                var p = self.chart.coordinates[i];
                                var prevP = self.chart.coordinates[i - 1];

                                distance += Math.hypot(p[0] - prevP[0], p[1] - prevP[1]);
                                x.push(parseFloat(distance.toFixed(2)));
                            }
                        }


                        /* ele */
                        var empty = true;
                        var y = [];
                        var minEle;
                        var maxEle;
                        for (var i = 0; i < self.chart.coordinates.length; i++) {
                            if (self.chart.coordinates[i].length > 2) {
                                var v = (Math.round(self.chart.coordinates[i][2] * 10) / 10);
                                if (empty && v > 0)
                                    empty = false;

                                ele.push(v);

                                if (i == 0)
                                    minEle = maxEle = v;

                                minEle = Math.min(minEle, v);
                                maxEle = Math.max(maxEle, v);

                            } else return done.resolve(null);
                        }
                    }
                }

                if (ele instanceof Array && ele.length == 0)
                    empty = true;

                self.chartData = !empty ? $.extend({}, { time: time, ele: ele, x: x, miny: minEle, maxy: maxEle }, elevationGain) : null;
                return done.resolve(self.chartData);
            });

            return done;
        };

        getChartData(li).then(function (data) {
            var locale = TC.Util.getMapLocale(self.map);
            if (data != null) {
                if (data.time) data.time = ("00000" + data.time.h).slice(-2) + ':' + ("00000" + data.time.m).slice(-2) + ':' + ("00000" + data.time.s).slice(-2);
                var delta = self.map.options.pointBoundsRadius;

                self.elevationChartSize = {
                    height: Modernizr.mq('(min-width: 50em)') ? 128 : 70,
                    width: Modernizr.mq('(min-width: 50em)') ? 445 : (Modernizr.mq('(min-width: 40em)') ? 310 : 215)
                };

                data = $.extend({}, data, {
                    size: {
                        height: self.elevationChartSize.height,
                        width: self.elevationChartSize.width
                    },
                    data: {
                        x: 'x',
                        columns: [['x'].concat(data.x), ['ele'].concat(data.ele)],
                        types: { 'ele': 'area-spline' }, colors: {
                            "ele": 'url(#grad1)'
                        }
                    },
                    point: {
                        show: false
                    },
                    axis: {
                        x: {
                            tick: {
                                count: 5, format: function (d) {
                                    d = d / 1000;
                                    var dist;
                                    var measure;
                                    if (d < 1) {
                                        dist = Math.round(d * 1000);
                                        measure = ' m';
                                    } else {
                                        dist = Math.round(d * 100) / 100;
                                        measure = ' km';
                                    }

                                    dist = dist.toLocaleString(locale);
                                    return dist + measure;
                                }
                            }
                        },
                        y: {
                            padding: {
                                top: 0, bottom: 0
                            },
                            max: data.maxy,
                            min: data.miny,
                            tick: {
                                count: 2,
                                format: function (d) {
                                    return parseInt(d.toFixed(0)).toLocaleString(locale) + 'm';
                                }
                            }
                        }
                    }
                });
                self.hasElevation = true;
                self.elevationActive.set(true);
            }
            else {
                self.hasElevation = false;
                data = {
                    msg: self.getLocaleString("geo.trk.chart.chpe.empty")
                };

                self.elevationActive.set(false);
            }

            if (!self.resultsPanelChart) {

                if (!TC.control.ResultsPanel)
                    TC.syncLoadJS(TC.apiLocation + 'TC/control/ResultsPanel.js');

                if (!window.c3)
                    TC.syncLoadJS(TC.Consts.url.D3C3 || TC.apiLocation + 'lib/d3c3/d3c3.min.js');

                self.resultsPanelChart = new TC.control.ResultsPanel({
                    "div": "results-panel",
                    "content": "chart",
                    "titles": { "max": self.getLocaleString("geo.trk.chart.chpe") },
                    "openOn": self.Const.Event.DRAWTRACK,
                    "closeOn": self.Const.Event.CLEARTRACK,
                    "chart": {
                        "ctx": self,
                        "onmouseout": TC.control.Geolocation.prototype.removeTooltip,
                        "tooltip": TC.control.Geolocation.prototype.getTooltip
                    }
                });

                self.resultsPanelChart.register(self.map);
                self.resultsPanelChart.render(function () {

                    self.track.htmlElevationMarker = document.getElementById('tc-ctl-geolocation-track-elevation-marker');

                    self.map.on(TC.Consts.event.RESULTSPANELMIN, function () {
                        $(self.wrap.miDiv).hide();
                        self.elevationActiveCollapsed.set(true);
                    });
                    self.map.on(TC.Consts.event.RESULTSPANELMAX, function () {
                        $(self.wrap.miDiv).show();
                        self.elevationActiveCollapsed.set(false);
                    });
                    self.map.on(TC.Consts.event.RESULTSPANELCLOSE, function () {
                        $(self.wrap.miDiv).hide(); self.elevationActive.set(false);
                    });
                    self.map.on(TC.Consts.event.DRAWCHART, function (e, data) {

                        var svgDefsElement = data.svg.getElementsByTagName('defs')[0];
                        var xmlns = "http://www.w3.org/2000/svg";
                        var grad = document.createElementNS(xmlns, "linearGradient");
                        grad.setAttributeNS(null, "id", "grad1");
                        grad.setAttributeNS(null, "x1", "0%");
                        grad.setAttributeNS(null, "x2", "0%");
                        grad.setAttributeNS(null, "y1", "0%");
                        grad.setAttributeNS(null, "y2", "100%");
                        grad.setAttributeNS(null, "gradientUnits", "userSpaceOnUse");

                        var stop0 = document.createElementNS(xmlns, "stop");
                        stop0.setAttributeNS(null, "offset", "0%");
                        stop0.setAttributeNS(null, "stop-color", "red");
                        stop0.setAttributeNS(null, "stop-opacity", "0.7");
                        grad.appendChild(stop0);

                        var stop50 = document.createElementNS(xmlns, "stop");
                        stop50.setAttributeNS(null, "offset", "50%");
                        stop50.setAttributeNS(null, "stop-color", "orange");
                        stop50.setAttributeNS(null, "stop-opacity", "0.9");
                        grad.appendChild(stop50);

                        var stop100 = document.createElementNS(xmlns, "stop");
                        stop100.setAttributeNS(null, "offset", "100%");
                        stop100.setAttributeNS(null, "stop-color", "green");
                        stop100.setAttributeNS(null, "stop-opacity", "1");
                        grad.appendChild(stop100);

                        svgDefsElement.appendChild(grad);

                        $(d3.select(".c3-brush").node()).remove();

                        d3.select(".c3-event-rects,.c3-event-rects-single").selectAll("rect")
                            .style("cursor", "pointer")
                            .on("click", function (e) {
                                d3.event.stopPropagation();
                                var point = this.chart.coordinates[e.index].slice(0, 2);
                                if (point) {
                                    TC.loadJS(!TC.feature || (TC.feature && !TC.feature.Point),
                                       [TC.apiLocation + 'TC/feature/Point.js'],
                                       function () {
                                           this.map.zoomToFeatures([new TC.feature.Point(point)]);
                                       }.bind(self)
                                    );
                                }
                            }.bind(self));

                        var pattern = d3.select('.c3-axis.c3-axis-x').select('path').attr('d');
                        var match = /^M\d\,(\d)V\dH\d{3}V(\d)$/i.exec(pattern);
                        if (match) { // quitamos las barritas de los extremos del axis-x
                            pattern = pattern.replace(/(M\d\,)\d/i, "$10").replace(/(H\d{3}V)(\d)/i, "$10");
                            d3.select('.c3-axis.c3-axis-x').select('path').attr('d', pattern);
                        } else {
                            var match = /^M\s\d\s(\d)\sV\s\d\sH\s\d{3}\sV\s(\d)$/i.exec(pattern);
                            if (match) { // quitamos las barritas de los extremos del axis-x
                                pattern = pattern.replace(/(M\s\d\s)\d/i, "$10").replace(/(H\s\d{3}\sV\s)(\d)/i, "$10");
                                d3.select('.c3-axis.c3-axis-x').select('path').attr('d', pattern);
                            }
                        }

                        // ¿es necesario pasar los labels a multiline?
                        var setMultilineLabels = function () {
                            var x = d3.scale.ordinal().rangeRoundBands([0, self.elevationChartSize.width], .1, .3);
                            d3.select('.c3-axis-x').selectAll('text:not(.c3-axis-x-label)')
                                .call(function (textNode, width) {
                                    textNode.each(function () {
                                        textNode.each(function (d, i) {
                                            if (i == 0) return;

                                            d3text = d3.select(this);

                                            if (!d3text.attr('edited')) {
                                                d3text.attr('edited', true);
                                                var clone = d3text.select('tspan').node().cloneNode();
                                                var words = d3text.text().split(' ');

                                                d3text.select('tspan').text(words[0]);
                                                clone.textContent = words[1];
                                                var dy = clone.getAttribute('dy');
                                                dy = dy ? parseFloat(clone.getAttribute('dy')) : .71;
                                                dy = dy + 0.18 + 'em';
                                                clone.setAttribute('dy', dy);
                                                d3text.node().appendChild(clone);
                                            }
                                        });
                                    });
                                }, x.rangeBand());
                        };
                        if (!d3.select('.c3-axis-x').node().getBoundingClientRect().width) {

                            if (self.elevationChartLabelsRAF) {
                                window.cancelAnimationFrame(self.elevationChartLabelsRAF);
                                self.elevationChartLabelsRAF = undefined;
                            }

                            function hasSize() {
                                if (d3.select('.c3-axis-x').length && !(d3.select('.c3-axis-x').node())) {
                                    self.elevationChartLabelsRAF = requestAnimationFrame(hasSize);
                                }
                                else if (d3.select('.c3-axis-x').length && d3.select('.c3-axis-x').node() &&
                                    !d3.select('.c3-axis-x').node().getBoundingClientRect().width) {
                                    self.elevationChartLabelsRAF = requestAnimationFrame(hasSize);
                                } else {
                                    window.cancelAnimationFrame(self.elevationChartLabelsRAF);
                                    self.elevationChartLabelsRAF = undefined;

                                    if (((d3.select('.c3-axis-x').node().getBoundingClientRect().width >= self.elevationChartSize.width - d3.select('.c3-axis-y').node().getBoundingClientRect().width) ||
                                         (d3.select('.c3-axis-x').node().getBoundingClientRect().width * 100 / (self.elevationChartSize.width - d3.select('.c3-axis-y').node().getBoundingClientRect().width) > 90))) {
                                        setMultilineLabels();
                                    }
                                }
                            }

                            self.elevationChartLabelsRAF = requestAnimationFrame(hasSize);
                        }
                        else if (((d3.select('.c3-axis-x').node().getBoundingClientRect().width >= self.elevationChartSize.width - d3.select('.c3-axis-y').node().getBoundingClientRect().width) ||
                            (d3.select('.c3-axis-x').node().getBoundingClientRect().width * 100 / (self.elevationChartSize.width - d3.select('.c3-axis-y').node().getBoundingClientRect().width) > 90))) {
                            setMultilineLabels();
                        }
                    });

                    self.map.$events.trigger($.Event(self.Const.Event.DRAWTRACK), { data: data });
                });
            } else {
                self.map.$events.trigger($.Event(self.Const.Event.DRAWTRACK), { data: data });
            }
        });
    };

    ctlProto.clear = function (layerType) {
        var self = this;

        if (self.onResize) {
            window.removeEventListener("resize", self.onResize, false);
            self.onResize = undefined;
        }

        if (layerType == self.Const.Layers.TRACK) {
            // gráfico perfil de elevación
            if (self.resultsPanelChart)
                self.resultsPanelChart.close();
            delete self.chartData;

            // overlay de la simulación
            self.wrap.simulateTrackEnd();

            // eliminamos la selección en la lista de tracks
            self.track.$trackList.find('li').removeClass(self.Const.Classes.SELECTEDTRACK);

            // eliminamos la capa para que pueda reflejarlo el TOC
            if (self.layerTrack !== undefined) {
                self.map.removeLayer(self.layerTrack);
                self.layerTrack = undefined;
            }

            self.map.$events.trigger($.Event(self.Const.Event.CLEARTRACK), {});
        } else {
            self.getLayer(layerType).then(function (layer) {
                self.wrap.clear(layer);
            });
        }
    };

    ctlProto.saveTrack = function () {
        var self = this;
        var done = new $.Deferred();
        var message = arguments.length > 0 && typeof (arguments[0]) == "string" ? arguments[0] : self.getLocaleString("geo.trk.save.alert");

        var _save = function (layerType) {
            self.getLayer(layerType).then(function (layer) {
                var wait;
                wait = self.getLoadingIndicator().addWait();

                var trackName = self.importedFileName || self.track.$trackName.val().trim();

                var tracks = self.availableTracks;
                if (!tracks)
                    tracks = {};

                var uid = TC.getUID();
                tracks.push({
                    name: trackName,
                    data: self.wrap.formattedToStorage(layer, true),
                    uid: parseInt(uid)
                });
                tracks = _orderTracks(tracks);

                var clean = function (wait) {
                    self.track.$trackName.val('');
                    self.track.$trackName.attr('disabled', 'disabled');
                    self.track.$trackSave.attr('disabled', 'disabled');

                    self.track.$trackWPT.val('');
                    self.track.$trackWPT.attr('disabled', 'disabled');
                    self.track.$trackAdd.attr('disabled', 'disabled');

                    self.getLoadingIndicator().removeWait(wait);

                    duringTrackingToolsPanel.call(self);
                };

                try {
                    self.setStoredTracks(tracks).then(function () {
                        self.map.toast(message, { duration: 3000 });

                        clean(wait);
                        var index;
                        for (var i = 0; i < tracks.length; i++) {
                            if (parseInt(tracks[i].uid) === parseInt(uid)) {
                                index = i;
                                break;
                            }
                        }
                        done.resolve(index);
                    });

                } catch (error) {
                    TC.alert(self.getLocaleString("geo.error.savelocalstorage") + ': ' + error.message);
                    clean(wait);
                    done.reject();
                }
            });
        };

        if (self.importedFileName)
            _save(self.Const.Layers.TRACK);
        else if (self.track.$trackName.val().trim().length == 0) {
            self.track.$trackName.val(new Date().toLocaleString());
            _save(self.Const.Layers.TRACKING);
        }
        else {
            _save(self.Const.Layers.TRACKING);
        }

        return done;
    };

    ctlProto.addWaypoint = function () {
        var self = this;

        var waypointName = self.track.$trackWPT.val().trim();
        if (!waypointName) {
            waypointName = new Date().toLocaleString();
        }

        var wait = self.getLoadingIndicator().addWait();

        duringTrackingToolsPanel.call(self);

        self.wrap.addWaypoint(self.currentPoint.position, {
            name: waypointName,
            ele: self.currentPoint.heading,
            time: new Date().getTime() // GLS: lo quito ya que hemos actualizado la función que gestiona la fechas para la exportación a GPX - espera la fecha en segundos -> / 1000 // para la exportación a GPX - espera la fecha en segundos
        });

        self.track.$trackWPT.val('');
        self.track.$trackWPT.attr('disabled', 'disabled');
        self.track.$trackAdd.attr('disabled', 'disabled');

        // cada vez que se añade un waypoint almacenamos en sessionStorage
        TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.formattedToStorage(self.layerTracking));

        self.getLoadingIndicator().removeWait(wait);
    };

    ctlProto.editTrackName = function (trackId, newName) {
        var self = this;

        self.getAvailableTracks().then(function (tracks) {
            if (tracks) {
                if (tracks[trackId]) {
                    tracks[trackId].name = newName;

                    self.setStoredTracks(tracks);
                }
            }
        });
    };

    ctlProto.removeTrack = function (li) {
        var self = this;

        self.getAvailableTracks().then(function (tracks) {
            if (tracks) {
                var dataId = $(li).attr('data-id');
                if (tracks[dataId]) {

                    TC.confirm(self.getLocaleString("geo.trk.delete.alert"), function () {
                        delete tracks[dataId];

                        if (self.getSelectedTrack().length > 0 && $(self.getSelectedTrack()[0]).attr('data-id') == dataId)
                            self.clear(self.Const.Layers.TRACK);

                        self.setStoredTracks(tracks);
                    }, function () { });
                }
            }
        });
    };

    ctlProto.setSelectedTrack = function (li) {
        var self = this;

        self.track.$trackList.find('li[data-id] > span').each(function () {
            $(this).attr("title", $(this).text());
        });
        self.track.$trackList.find('li').removeClass(self.Const.Classes.SELECTEDTRACK);

        li.addClass(self.Const.Classes.SELECTEDTRACK);

        $(li).find(self.Const.Selector.DRAW).attr('title', self.getLocaleString("tr.lst.clear"));
    };

    ctlProto.getSelectedTrack = function () {
        var self = this;

        return self.track.$trackList.find('li.' + self.Const.Classes.SELECTEDTRACK);
    };

    ctlProto.clearSelectedTrack = function () {
        var self = this;

        var selected = self.getSelectedTrack();
        if (selected) {

            if (self.onResize) {
                window.removeEventListener("resize", self.onResize, false);
                self.onResize = undefined;
            }

            selected.removeClass(self.Const.Classes.SELECTEDTRACK);
            $(selected).find(self.Const.Selector.DRAW).attr('title', $(selected).text());
        }
    };

    ctlProto.clearSelection = function () {
        var self = this;

        self.wrap.deactivateSnapping();
        var selected = self.getSelectedTrack();
        if (selected) {
            self.clearSelectedTrack();
        }
        if (self.resultsPanelChart)
            self.resultsPanelChart.close();

        self.clear(self.Const.Layers.TRACK);        
    };

    ctlProto.drawTrackingData = function (li) {
        var self = this;

        self.wrap.clear();

        self.getTrackingData(li).then(function (data) {
            if (data)
                self.wrap.drawTrackingData(data).then(function () {
                    var showFeatures = self.layerTrack.features;
                    if (showFeatures && showFeatures.length > 0) {
                        var lineTrack;
                        for (var i = 0; i < showFeatures.length; i++) {
                            if (showFeatures[i].STYLETYPE.indexOf('line') > -1) {
                                lineTrack = showFeatures[i];
                            }

                            showFeatures[i].showsPopup = false;
                        }
                    }

                    if (lineTrack && lineTrack.geometry) {
                        var first = lineTrack.geometry[0];
                        var last = lineTrack.geometry[lineTrack.geometry.length - 1];

                        if (first && !(first === last)) {
                            self.layerTrack.addMarker(first.slice().splice(0, 2), {
                                showsPopup: false, cssClass: self.CLASS + '-track-marker-icon-end', anchor: [0.5, 1]
                            });
                        }

                        if (last) {
                            self.layerTrack.addMarker(last.slice().splice(0, 2), {
                                showsPopup: false, cssClass: self.CLASS + '-track-marker-icon', anchor: [0.5, 1]
                            });
                        }
                    }
                });
        });
    };

    ctlProto.getTrackingData = function (li) {
        var self = this;
        var _li = li;
        var done = new $.Deferred();

        self.getAvailableTracks().then(function (tracks) {
            if (tracks) {
                var dataId = $(_li).attr('data-id');
                if (tracks[dataId]) {
                    return done.resolve(tracks[dataId].data);
                }
            }

            return done.resolve();
        });


        return done;
    };

    ctlProto.export = function (type, li) {
        var self = this;

        return self.wrap.export(type, li);
    };

    ctlProto.getTooltip = function (d) {
        var self = this;

        return self.wrap.getTooltip(d);
    };

    ctlProto.removeTooltip = function () {
        var self = this;

        $(self.track.htmlElevationMarker).hide();
    }

    ctlProto.clearFileInput = function (fileInput) {
        var $fi = $(fileInput);
        $fi.wrap('<form>').closest('form').get(0).reset();
        $fi.unwrap();
    };

    ctlProto.getLoadingIndicator = function () {
        var self = this;

        if (!self.loading) {
            self.loading = self.map.getControlsByClass(TC.control.LoadingIndicator);
            if (self.loading && self.loading.length > 0)
                self.loading = self.loading[0];
        }

        return self.loading;
    };

    ctlProto.onGeolocateError = function (error) {
        var self = this;

        if (navigator.geolocation) {
            if (self.currentPosition)
                navigator.geolocation.clearWatch(self.currentPosition);
            if (self.currentPositionTrk)
                navigator.geolocation.clearWatch(self.currentPositionTrk);
        }

        if (self.currentPositionWaiting)
            self.getLoadingIndicator().removeWait(self.currentPositionWaiting);

        var errorMsg;
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMsg = self.getLocaleString("geo.error.permission_denied");
                break;
            case error.POSITION_UNAVAILABLE:
                errorMsg = self.getLocaleString("geo.error.position_unavailable");
                break;
            case error.TIMEOUT:
                errorMsg = self.getLocaleString("geo.error.timeout");
                break;
            default:
                errorMsg = self.getLocaleString("geo.error.default");
                break;
        }

        self.map.toast(errorMsg, { type: TC.Consts.msgType.WARNING });

        if (!self.geopositionTracking && self.track) {
            self.track.$activateButton.toggleClass(TC.Consts.classes.HIDDEN, false);
            self.track.$deactivateButton.toggleClass(TC.Consts.classes.HIDDEN, true);
        }
    };

    var _isEmpty = function (obj) {
        return !obj || obj.length === 0;
    };
})();
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
(function () {
    // Polyfill window.performance.now
    if (!window.performance) {
        window.performance = {
            offset: Date.now(),
            now: function () {
                return Date.now() - this.offset;
            }
        };
    } else if (window.performance && !window.performance.now) {
        window.performance.offset = Date.now();
        window.performance.now = function () {
            return Date.now() - window.performance.offset;
        };
    }
}());

TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Geolocation = function (options) {
    var self = this;
    self._classSelector = '.' + self.CLASS;

    self._layerPromises = {};

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
        SupportedFileExtensions: [
            '.kml',
            '.gpx'
        ],
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
    self._dialogDiv = TC.Util.getDiv(opts.dialogDiv);
    self._$dialogDiv = $(self._dialogDiv);
    if (!opts.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
    }
    self.delta = 500;
    self.walkingSpeed = 5000;
    self.gapHill = self.options.gapHill || 20;

    self.snappingTolerance = self.options.snappingTolerance || 50;

    self.exportsState = true;

    self.storageCRS = 'EPSG:4326';
};

TC.inherit(TC.control.Geolocation, TC.Control);

(function () {
    var ctlProto = TC.control.Geolocation.prototype;

    ctlProto.CLASS = 'tc-ctl-geolocation';

    ctlProto.CHART_SIZE = {
        MIN_HEIGHT: 75,
        MAX_HEIGHT: 128,

        MIN_WIDTH: 300,
        MEDIUM_WIDTH: 310,
        MAX_WIDTH: 445
    };

    ctlProto.featuresToShare = [];

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
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "geo" }).w("</h2><div class=\"tc-ctl-geolocation-content\"> <div class=\"tc-ctl-geolocation-track\"><div class=\"tc-ctl-geolocation-track-snap-info\"></div> <!-- img se insertan en el div del mapa--> <div id=\"tc-ctl-geolocation-track-elevation-marker\" class=\"tc-ctl-geolocation-trackMarker elevation\" style=\"display: none;\"></div> <div class=\"tc-ctl-geolocation-track-panel-block\" ><input id=\"tc-ctl-geolocation-track-panel-opened\" type=\"checkbox\" checked/><label for=\"tc-ctl-geolocation-track-panel-opened\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.1" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.2" }).w("</label><i class=\"tc-ctl-geolocation-track-panel-help icon-question-sign\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.panel.help.3" }).w("\"></i></div><div class=\"tc-ctl-geolocation-track-mng\"><div class=\"tc-ctl-geolocation-select\"><form> <label class=\"tc-ctl-geolocation-btn-track\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track.title" }).w("\"><input type=\"radio\" name=\"mode\" checked value=\"tracks\" /><span>").h("i18n", ctx, {}, { "$key": "geo.gps" }).w("</span></label><label class=\"tc-ctl-geolocation-btn-tracks\" title=\"").h("i18n", ctx, {}, { "$key": "geo.tracks.title" }).w("\"><input type=\"radio\" name=\"mode\" value=\"track-available\" /><span>").h("i18n", ctx, {}, { "$key": "geo.tracks" }).w("</span></label> </form></div> <div class=\"tc-ctl-geolocation-track-available tc-ctl-geolocation-track-cnt tc-ctl-geolocation-panel tc-hidden\"><i class=\"tc-ctl-geolocation-track-search-icon\"></i><input id=\"tc-ctl-geolocation-track-available-srch\" type=\"search\" list=\"tc-ctl-geolocation-track-available-lst\" class=\"tc-ctl-geolocation-track-available-srch tc-textbox\" placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.filter.plhr" }).w("\" maxlength=\"200\" /> <ol id=\"tc-ctl-geolocation-track-available-lst\" class=\"tc-ctl-geolocation-track-available-lst\"><li class=\"tc-ctl-geolocation-track-available-empty\"><span>").h("i18n", ctx, {}, { "$key": "geo.noTracks" }).w("</span></li><li class=\"tc-ctl-geolocation-track-not\" hidden><span>").h("i18n", ctx, {}, { "$key": "noMatches" }).w("</span></li></ol><div class=\"tc-ctl-geolocation-track-cnt\"><input name=\"uploaded-file\" id=\"uploaded-file\" type=\"file\" class=\"tc-ctl-geolocation-track-import tc-button\" accept=\".gpx,.kml\" disabled /><label class=\"tc-button tc-icon-button\" for=\"uploaded-file\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.import.upload" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.import.lbl" }).w("</label></div></div><div class=\"tc-ctl-geolocation-tracks tc-ctl-geolocation-panel\"> <div class=\"tc-alert alert-warning tc-hidden\" ><p id=\"panel-msg\">").h("i18n", ctx, {}, { "$key": "geo.trk.panel.1" }).w(" <ul><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.2" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.3" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.4" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "geo.trk.panel.5" }).w("</li></ul></p></div> <div class=\"tc-ctl-geolocation-track-ui\"> <div class=\"tc-ctl-geolocation-track-render\"><input id=\"tc-ctl-geolocation-track-render\" type=\"checkbox\" hidden checked /><label for=\"tc-ctl-geolocation-track-render\" class=\"tc-ctl-geolocation-track-render\" title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.render" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.trk.render" }).w("</label></div><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-ui-activate\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track.activate.title" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.track.activate" }).w("</button><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-ui-deactivate tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "geo.track.deactivate.title" }).w("\">").h("i18n", ctx, {}, { "$key": "geo.track.deactivate" }).w("</button></div><div class=\"tc-ctl-geolocation-track-current tc-ctl-geolocation-track-cnt\"><input type=\"text\" class=\"tc-ctl-geolocation-track-title tc-textbox\" disabled placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.trk.name.plhr" }).w("\" maxlength=\"200\" /><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-save\" disabled title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.name.save" }).w("\"></button><input type=\"text\" class=\"tc-ctl-geolocation-track-waypoint tc-textbox\" disabled placeholder=\"").h("i18n", ctx, {}, { "$key": "geo.trk.wyp.plhr" }).w("\" maxlength=\"200\" /><button class=\"tc-button tc-icon-button tc-ctl-geolocation-track-add-wpt\" disabled title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.wyp.save" }).w("\"></button></div></div></div></div></div><div class=\"tc-ctl-geolocation-track-center tc-hidden\"><button title=\"").h("i18n", ctx, {}, { "$key": "geo.trk.center" }).w("\"></button></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-track-node'] = function () { dust.register(ctlProto.CLASS + '-track-node', body_0); function body_0(chk, ctx) { return chk.w("<li data-id=\"").f(ctx.get(["id"], false), ctx, "h").w("\" data-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\"><span class=\"tc-draw tc-selectable\" title=\"").f(ctx.get(["name"], false), ctx, "h").w("\">").f(ctx.get(["name"], false), ctx, "h").w("</span><input class=\"tc-textbox tc-hidden\" type=\"text\" value=\"").f(ctx.get(["name"], false), ctx, "h").w("\" /> <button class=\"tc-btn-simulate\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.simulate" }).w("\"></button><button hidden class=\"tc-btn-stop\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.stop" }).w("\"></button><button class=\"tc-btn-edit\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.edit" }).w("\"></button><button hidden class=\"tc-btn-pause\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.pause" }).w("\"></button> <button hidden class=\"tc-btn-backward\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.backward" }).w("\"></button><label hidden class=\"tc-spn-speed\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.velocity" }).w("\"></label><button hidden class=\"tc-btn-forward\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.forward" }).w("\"></button> <button class=\"tc-btn-save tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "save" }).w("\"></button><button class=\"tc-btn-cancel tc-hidden\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.cancel" }).w("\"></button><button class=\"tc-btn-delete\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.delete" }).w("\"></button><button class=\"tc-btn-export-gpx\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.exportGPX" }).w("\"></button><button class=\"tc-btn-export-kml\" title=\"").h("i18n", ctx, {}, { "$key": "tr.lst.exportKML" }).w("\"></button> </li>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-track-snapping-node'] = function () { dust.register(ctlProto.CLASS + '-track-snapping-node', body_0); function body_0(chk, ctx) { return chk.w("<ul>").x(ctx.get(["n"], false), ctx, { "block": body_1 }, {}).w("<li> <span>").x(ctx.get(["isGeo"], false), ctx, { "else": body_2, "block": body_3 }, {}).w(":</span> ").f(ctx.get(["x"], false), ctx, "h").w("</li><li> <span>").x(ctx.get(["isGeo"], false), ctx, { "else": body_4, "block": body_5 }, {}).w(":</span> ").f(ctx.get(["y"], false), ctx, "h").w(" </li>").x(ctx.get(["z"], false), ctx, { "block": body_6 }, {}).x(ctx.get(["m"], false), ctx, { "block": body_8 }, {}).w("</ul>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<li><span>").h("i18n", ctx, {}, { "$key": "geo.trk.snapping.name" }).w(":</span> ").f(ctx.get(["n"], false), ctx, "h").w("</li>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("X"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "lon" }); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("Y"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "lat" }); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.h("ne", ctx, { "block": body_7 }, { "key": ctx.get(["z"], false), "value": 0 }); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w("<li> <span>Z:</span> ").f(ctx.get(["z"], false), ctx, "h").w(" </li>"); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("<li> ").f(ctx.get(["m"], false), ctx, "h").w(" </li>"); } body_8.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-geolocation-continue-track-dialog tc-modal\" ><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "geo.gps" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\"><button class=\"tc-button tc-ctl-geolocation-track-continue\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.cnt" }).w(" </button><button class=\"tc-button tc-ctl-geolocation-track-new\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.new" }).w(" </button> <button class=\"tc-button tc-modal-close\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.cancel" }).w(" </button></div></div></div><div class=\"tc-ctl-geolocation-track-advert-dialog tc-modal\" ><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "geo.track.activate.title" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p id=\"pageBlurMsg\">").h("i18n", ctx, {}, { "$key": "geo.trk.page.blur" }).w("</p><p class=\"tc-ctl-geolocation-track-advertisement p\"> <label> <input type=\"checkbox\" name=\"checkbox\" id=\"advertisement\"> ").h("i18n", ctx, {}, { "$key": "geo.trk.dialog.advertisement" }).w(" </label> </p></div><div class=\"tc-modal-footer\"><button class=\"tc-button tc-ctl-geolocation-track-advert-ok\"> ").h("i18n", ctx, {}, { "$key": "ok" }).w(" </button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-tracking-toast'] = function () { dust.register(ctlProto.CLASS + '-tracking-toast', body_0); function body_0(chk, ctx) { return chk.w("<table class=\"tc-ctl-geolocation-info-tracking\"><tr><th>").x(ctx.get(["isGeo"], false), ctx, { "else": body_1, "block": body_2 }, {}).w(":</th><td> ").f(ctx.get(["x"], false), ctx, "h").w(" </td>").x(ctx.get(["accuracy"], false), ctx, { "block": body_3 }, {}).w("</tr><tr><th>").x(ctx.get(["isGeo"], false), ctx, { "else": body_4, "block": body_5 }, {}).w(":</th><td> ").f(ctx.get(["y"], false), ctx, "h").w(" </td>").x(ctx.get(["speed"], false), ctx, { "block": body_6 }, {}).w("</tr><tr>").x(ctx.get(["z"], false), ctx, { "block": body_7 }, {}).x(ctx.get(["mdt"], false), ctx, { "block": body_10 }, {}).w("</tr> </table>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("X"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "lon" }); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<th>").h("i18n", ctx, {}, { "$key": "geo.trk.accuracy" }).w(":</th><td> ").f(ctx.get(["accuracy"], false), ctx, "h").w(" m </td>"); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("Y"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "lat" }); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<th>").h("i18n", ctx, {}, { "$key": "geo.trk.speed" }).w(":</th><td>").f(ctx.get(["speed"], false), ctx, "h").w(" km/h</td>"); } body_6.__dustBody = !0; function body_7(chk, ctx) { return chk.w("<th>").x(ctx.get(["isGeo"], false), ctx, { "else": body_8, "block": body_9 }, {}).w(":</th><td> ").f(ctx.get(["z"], false), ctx, "h").w(" m </td>"); } body_7.__dustBody = !0; function body_8(chk, ctx) { return chk.w("Z"); } body_8.__dustBody = !0; function body_9(chk, ctx) { return chk.h("i18n", ctx, {}, { "$key": "ele" }); } body_9.__dustBody = !0; function body_10(chk, ctx) { return chk.w("<th title=\"").h("i18n", ctx, {}, { "$key": " mdt.title" }).w("\">").h("i18n", ctx, {}, { "$key": "ele" }).w(" (").h("i18n", ctx, {}, { "$key": "mdt" }).w("):</th><td>").f(ctx.get(["mdt"], false), ctx, "h").w(" m </td>"); } body_10.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);

        self.wrap = new TC.wrap.control.Geolocation(self);
        self.wrap.register(map);

        map.addLayer({
            id: self.getUID(),
            type: TC.Consts.layerType.VECTOR,
            stealth: true,
            title: 'Posicionar.GPS',
        }).then(function (layer) {
            self.layerGPS = layer;
        });
        map.addLayer({
            id: self.getUID(),
            type: TC.Consts.layerType.VECTOR,
            stealth: true,
            title: 'Posicionar.Tracking',
            styles: {
                point: {
                    radius: 3,
                    fillColor: "#00ced1",
                    fillOpacity: function () {
                        return this.track.renderTrack.checked ? 1 : 0;
                    }.bind(self),
                    strokeColor: "#ffffff",
                    fontColor: "#00ced1",
                    labelOutlineColor: "#ffffff",
                    labelOutlineWidth: 1,
                    label: function (feature) {
                        var name = feature.getData()['name'];
                        if (name && (name + '').trim().length > 0) {
                            name = (name + '').trim().toLowerCase();
                        } else {
                            name = '';
                        }

                        return name;
                    }
                },
                line: {
                    strokeOpacity: function () {
                        return this.track.renderTrack.checked ? 1 : 0;
                    }.bind(self),
                    strokeWidth: 2,
                    strokeColor: "#00ced1",
                    lineDash: [.1, 6]
                }
            }
        }).then(function (layer) {
            self.layerTracking = layer;
        });
        map.addLayer({
            id: self.getUID(),
            type: TC.Consts.layerType.VECTOR,
            stealth: true,
            title: 'Posicionar.Track',
            styles: {
                line: {
                    strokeWidth: 2,
                    strokeColor: "#C52737"
                },
                point: {
                    radius: function (feature) {
                        var name = feature.getData()['name'];
                        if (name && (name + '').trim().length > 0) {
                            return 3;
                        } else {
                            return 6;
                        }

                        return 3;
                    },
                    fillColor: "#C52737",
                    strokeColor: "#ffffff",
                    fontColor: "#C52737",
                    fontSize: 10,
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
            }
        }).then(function (layer) {
            self.layerTrack = layer;
        });

        map.on(TC.Consts.event.FEATURESIMPORT, function (e) {
            const self = this;
            const fileName = e.fileName;
            const target = e.dropTarget;
            var kmlPattern = '.' + TC.Consts.format.KML.toLowerCase();
            var gpxPattern = '.' + TC.Consts.format.GPX.toLowerCase();

            // GLS: ¿es un GPX?
            if (fileName.toLowerCase().indexOf(gpxPattern) === fileName.length - gpxPattern.length ||
                // GLS: ¿es un KML y viene desde el upload de Geolocation?
                (fileName.toLowerCase().indexOf(kmlPattern) === fileName.length - kmlPattern.length && target === self)) {

                self.clear(self.Const.Layers.TRACK);
                self.importTrack(e);

                if (/.kml$/g.test(fileName.toLowerCase()) && self.layerTrack) {
                    if (self.layerTrack.styles) {
                        self.layerTrack.features.forEach(function (feature) {
                            if (feature instanceof TC.feature.Point && self.layerTrack.styles.point) {
                                feature.setStyle(self.layerTrack.styles.point);
                            } else if (feature instanceof TC.feature.Polyline && self.layerTrack.styles.line) {
                                feature.setStyle(self.layerTrack.styles.line);
                            }
                        });
                    }
                }
            } else {
                //GLS: si es un KML pero viene desde el mapa o es otro tipo de archivo que no es ni GPX ni KML, lo ignoramos
                return;
            }
        }.bind(self));

        return result;
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;
        }).then(function () {
            return TC.Control.prototype.render.call(self, callback);
        });
    };

    ctlProto.importTrack = function (options) {
        var self = this;

        if (!self.isDisabled) {
            if (options.fileName && options.features && options.features.length > 0) {

                var wait = self.getLoadingIndicator().addWait();
                self.importedFileName = options.fileName;
                const addPromises = [];
                for (var i = 0, len = options.features.length; i < len; i++) {
                    addPromises.push(self.layerTrack.addFeature(options.features[i]));
                }
                Promise.all(addPromises).then(function () {
                    self.wrap.processImportedFeatures({ wait: wait, notReproject: options.notReproject });

                    if (self.layerTrack) { // Si tenemos capa es que todo ha ido bien y gestionamos el despliegue del control
                        // Desplegamos el control "ubicar" al importar mediante drag&drop
                        if (self.map && self.map.layout && self.map.layout.accordion) {
                            if (self.div.classList.contains(TC.Consts.classes.COLLAPSED)) {
                                self.map.controls
                                    .filter(function (ctl) {
                                        // Todos los otros controles que no cuelgan de otro control
                                        return ctl !== self && !ctl.containerControl;
                                    })
                                    .forEach(function (ctl) {
                                        ctl.div.classList.add(TC.Consts.classes.COLLAPSED);
                                    });
                            }
                        }

                        self.div.classList.remove(TC.Consts.classes.COLLAPSED);
                        self.div.querySelector('.' + self.CLASS + '-btn-tracks > span').click();

                        if (!options.isShared) {
                            // abrimos el panel de herramientas
                            self.map.trigger(TC.Consts.event.TOOLSOPEN);
                        }                        
                    }
                });
            }
        } else if (/.gpx$/g.test(options.fileName.toLowerCase())) {
            self.map.toast(self.getLocaleString("geo.trk.import.disabled"), { type: TC.Consts.msgType.WARNING });
        }
    };

    ctlProto.prepareFeaturesToShare = function (trackUid) {
        const self = this;

        return new Promise(function (resolve, reject) {
            if (trackUid) {

                var storageData = self.availableTracks.filter(function (saved) {
                    return saved.uid.toString() === trackUid.toString();
                })[0].data;

                // Aplicamos una precisión un dígito mayor que la del mapa, si no, al compartir algunas parcelas se deforman demasiado
                var precision = Math.pow(10, TC.Consts.DEGREE_PRECISION + 1);

                var storageFeatures = new ol.format.GeoJSON().readFeatures(storageData);
                const promises = new Array(storageFeatures.length);
                storageFeatures.forEach(function (f, idx) {
                    promises[idx] = TC.wrap.Feature.createFeature(f);
                });

                Promise.all(promises).then(function (tcFeatures) {
                    self.featuresToShare = tcFeatures.map(function (f) {
                        const fObj = {};
                        var layerStyle;
                        switch (true) {
                            case TC.feature.Marker && f instanceof TC.feature.Marker:
                                fObj.type = TC.Consts.geom.MARKER;
                                break;
                            case TC.feature.Point && f instanceof TC.feature.Point:
                                fObj.type = TC.Consts.geom.POINT;
                                break;
                            case TC.feature.Polyline && f instanceof TC.feature.Polyline:
                                fObj.type = TC.Consts.geom.POLYLINE;
                                break;
                            case TC.feature.MultiPolyline && f instanceof TC.feature.MultiPolyline:
                                fObj.type = TC.Consts.geom.MULTIPOLYLINE;
                                break;
                        }
                        fObj.id = f.id;
                        fObj.geom = TC.Util.compactGeometry(f.geometry, precision);
                        fObj.data = f.getData();

                        return fObj;
                    });

                    resolve();
                });
            } else {
                resolve();
            }
        });


    };

    var visibilityTrack = true;
    ctlProto.renderData = function (data, callback) {
        const self = this;

        var sel = self.Const.Selector;

        return TC.Control.prototype.renderData.call(self, data, function () {

            const options = self.div.querySelectorAll(self._classSelector + '-panel');
            self.div.querySelectorAll('.' + self.CLASS + '-select span').forEach(function (span) {
                span.addEventListener(TC.Consts.event.CLICK, function (e) {
                    var label = e.target;
                    while (label && label.tagName !== 'LABEL') {
                        label = label.parentElement;
                    }
                    const newFormat = label.querySelector('input[type=radio][name=mode]').value;

                    options.forEach(function (option) {
                        if (option.matches('.' + self.CLASS + '-' + newFormat)) {
                            option.classList.remove(TC.Consts.classes.HIDDEN);
                        }
                        else {
                            option.classList.add(TC.Consts.classes.HIDDEN);
                        }
                    });
                });
            });

            self.track = {
                activateButton: self.div.querySelector(self._classSelector + '-track-ui-activate'),
                deactivateButton: self.div.querySelector(self._classSelector + '-track-ui-deactivate'),
                trackSearch: self.div.querySelector(self._classSelector + '-track-available-srch'),
                trackImportFile: self.div.querySelector(self._classSelector + '-track-import'),
                trackSave: self.div.querySelector(self._classSelector + '-track-save'),
                trackAdd: self.div.querySelector(self._classSelector + '-track-add-wpt'),
                trackContinue: self._dialogDiv.querySelector('.tc-ctl-geolocation-track-continue'),
                trackRenew: self._dialogDiv.querySelector('.tc-ctl-geolocation-track-new'),
                trackClose: self._dialogDiv.querySelector('.tc-ctl-geolocation-continue-track-dialog button.tc-modal-close'),
                //trackAddSegment: self.div.querySelector('#tc-ctl-geolocation-track-segment'),
                trackAdvertisementOK: self._dialogDiv.querySelector('.tc-ctl-geolocation-track-advert-ok')
            };

            self.track.trackList = self.div.querySelector(self._classSelector + '-track-available-lst');

            self.track.trackToolPanelOpened = self.div.querySelector('#tc-ctl-geolocation-track-panel-opened');

            self.div.querySelector('.' + ctlProto.CLASS + '-track-panel-help').addEventListener('click', function () {
                _showAlerMsg.call(self);
            });

            self.track.trackName = self.div.querySelector(self._classSelector + '-track-title');

            self.track.trackWPT = self.div.querySelector(self._classSelector + '-track-waypoint');

            if (TC.Util.detectMobile()) {
                if (Modernizr.mq('screen and (max-height: 50em) and (max-width: 50em)'))
                    self.track.trackToolPanelOpened.checked = false;
            }

            if (window.File && window.FileReader && window.FileList && window.Blob) {
                self.track.trackImportFile.disabled = false;
                // GLS: Eliminamos el archivo subido, sin ello no podemos subir el mismo archivo seguido varias veces
                self.track.trackImportFile.addEventListener(TC.Consts.event.CLICK, function (e) {
                    // Envolvemos el input en un form
                    const input = this;
                    const form = document.createElement('form');
                    const parent = input.parentElement;
                    parent.insertBefore(form, input);
                    form.appendChild(input);
                    form.reset();
                    // Desenvolvemos el input del form
                    form.insertAdjacentElement('afterend', input);
                    parent.removeChild(form);
                });
                self.track.trackImportFile.addEventListener('change', function (e) {
                    if (!self._cleaning) { // Valido que el evento import no lo provoco yo al limpiar el fileinput (al limpiar se lanza el change)                        
                        self.clear(self.Const.Layers.TRACK);

                        if (self.map) {
                            self.map.on(TC.Consts.event.LAYERERROR, _layerError);
                            self.map.wrap.loadFiles(e.target.files, { control: self });
                        }
                    }
                });
            } else {
                console.log('no es posible la importación');
            }

            self.track.activateButton.addEventListener('click', function () {
                self.activateTracking();
                _activateTrackingBtns.call(self);

            });
            self.track.deactivateButton.addEventListener('click', function () {
                self.deactivateTracking();
                _deactivateTrackingBtns.call(self);
            });

            var _filter = function (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                //tc-ctl-geolocation-track-available-empty
                const lis = Array.from(self.track.trackList.querySelectorAll('li'));
                lis.forEach(function (li) {
                    li.style.display = 'none';
                });
                const trackLis = lis.filter(function (li) {
                    return li.matches('li:not([class]),li.' + self.Const.Classes.SELECTEDTRACK);
                });

                const searchIcon = self.div.querySelector(self._classSelector + '-track-search-icon');
                if (searchTerm.length === 0) {
                    trackLis.forEach(function (li) {
                        li.style.display = '';
                    });
                    searchIcon.style.visibility = 'visible';
                } else {
                    searchIcon.style.visibility = 'hidden';
                    var r = new RegExp(searchTerm, 'i');
                    trackLis.forEach(function (li) {
                        li.style.display = r.test(li.querySelector('span').textContent) ? '' : 'none';
                    });

                    if (!trackLis.some(function (li) {
                        return li.style.display === '';
                    })) {
                        lis.forEach(function (li) {
                            if (li.matches('[class^="tc-ctl-geolocation-track-not"]')) {
                                li.style.display = '';
                            }
                        });
                    }
                }
            };
            const trackSearchListener = function () {
                _filter(this.value.toLowerCase().trim());
            };
            self.track.trackSearch.addEventListener("keyup", trackSearchListener);
            self.track.trackSearch.addEventListener("search", trackSearchListener);

            // IE10 polyfill
            try {
                if (self.track.trackSearch.querySelector('::-ms-clear')) {
                    var oldValue;
                    self.track.trackSearch.addEventListener('mouseup', function (e) {
                        oldValue = self.track.trackSearch.value;

                        if (oldValue === '') {
                            return;
                        }

                        // When this event is fired after clicking on the clear button
                        // the value is not cleared yet. We have to wait for it.
                        setTimeout(function () {
                            var newValue = self.track.trackSearch.value;

                            if (newValue === '') {
                                _filter(newValue);
                            }
                        }, 1);
                    });
                }
            }
            catch (e) { }

            // en el panel
            self.track.trackSave.addEventListener('click', self.saveTrack.bind(self));
            self.track.trackAdd.addEventListener('click', self.addWaypoint.bind(self));

            const list = self.div.querySelector(self._classSelector + '-track-available-lst');

            // en lista
            var _edit = function (edit, elm) {
                if (elm.tagName !== 'LI') {
                    elm = elm.parentElement;
                }

                const input = elm.querySelector('input');
                const span = elm.querySelector('span');

                if (edit) {

                    input.classList.remove(TC.Consts.classes.HIDDEN);
                    input.focus();
                    input.value = span.textContent;
                    span.classList.add(TC.Consts.classes.HIDDEN);

                    elm.querySelector(sel.SIMULATE).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EDIT).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.DELETE).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.DRAW).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EXPORT_GPX).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EXPORT_KML).classList.add(TC.Consts.classes.HIDDEN);

                    elm.querySelector(sel.SAVE).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.CANCEL).classList.remove(TC.Consts.classes.HIDDEN);
                } else {

                    input.classList.add(TC.Consts.classes.HIDDEN);
                    span.classList.remove(TC.Consts.classes.HIDDEN);

                    elm.querySelector(sel.SIMULATE).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EDIT).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.DELETE).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.DRAW).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EXPORT_GPX).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EXPORT_KML).classList.remove(TC.Consts.classes.HIDDEN);

                    elm.querySelector(sel.SAVE).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.CANCEL).classList.add(TC.Consts.classes.HIDDEN);
                }
            };

            self.uiSimulate = function (simulate, elm) {
                if (elm) {
                    var editControls = [
                        sel.SIMULATE,
                        sel.EDIT,
                        sel.DELETE,
                        sel.EXPORT_GPX,
                        sel.EXPORT_KML
                    ];
                    var simulateControls = [
                        sel.STOP,
                        sel.PAUSE,
                        sel.BACKWARD,
                        sel.FORWARD,
                        sel.SPEED
                    ];
                    var cnt = elm.tagName === 'LI' ? elm : elm.parentNode;

                    editControls.forEach(function (ctl) {
                        cnt.querySelector(ctl).hidden = simulate;
                    });

                    simulateControls.forEach(function (ctl) {
                        cnt.querySelector(ctl).hidden = !simulate;
                    });
                }
            };

            list.addEventListener('click', TC.EventTarget.listenerBySelector(sel.SIMULATE, function (e) {
                var wait = self.getLoadingIndicator().addWait();

                e.target.parentElement.querySelector(sel.SPEED).textContent = 'x 1';

                _loadTrack(self, e.target).then(function () { //Para evitar el bloqueo de la interfaz en móviles
                    self.getLoadingIndicator().removeWait(wait)
                });
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(sel.DRAW, function (e) {
                var wait = self.getLoadingIndicator().addWait();

                _drawTrack(self, e.target).then(function () {
                    self.getLoadingIndicator().removeWait(wait);
                });
            }));

            self.on(self.Const.Event.IMPORTEDTRACK, function (e) {
                if (!self.isDisabled) {
                    const listElement = self.track.trackList.querySelector('li[data-id="' + e.index + '"]');
                    _drawTrack(self, listElement.querySelector(sel.DRAW));
                    $(self.track.trackList).animate({
                        scrollTop: e.index * listElement.offsetHeight
                    }, 'slow');
                } else {
                    self.map.toast(self.getLocaleString("geo.trk.import.disabled"), { type: TC.Consts.msgType.WARNING });
                }
            });

            const _stopOtherTracks = function (self, trackLiId) {
                self.track.trackList.querySelectorAll('li[data-id]').forEach(function (listItem) {
                    if (listItem.dataset.id !== trackLiId) {
                        const btnSimulate = listItem.querySelector(sel.SIMULATE);
                        const btnPause = listItem.querySelector(sel.PAUSE);

                        btnSimulate.classList.remove(self.Const.Classes.SIMULATIONACTIVATED);
                        btnSimulate.setAttribute('title', self.getLocaleString("tr.lst.simulate"));
                        btnPause.classList.remove('play');
                        btnPause.setAttribute('title', self.getLocaleString("tr.lst.pause"));

                        self.uiSimulate(false, listItem);
                        _edit(false, listItem);
                    }
                });

                self.clear(self.Const.Layers.TRACK);
            };

            var _drawTrack = function (self, btnDraw) {
                return new Promise(function (resolve, reject) {

                    const trackLi = btnDraw.parentElement;

                    setTimeout(function () {
                        if (trackLi.classList.contains(self.Const.Classes.SELECTEDTRACK)) {
                            self.uiSimulate(false, btnDraw);

                            self.clear(self.Const.Layers.TRACK);

                            btnDraw.setAttribute('title', btnDraw.textContent);
                        }
                        else if (self.getSelectedTrack()) { // GLS: si hay elemento seleccionado actuamos
                            _stopOtherTracks(self, trackLi.dataset.id);
                            self.drawTrack(trackLi);
                        } else {
                            self.drawTrack(trackLi);
                        }

                        /* GLS: 15/02/2019 Preparamos la feature por si se comparte, necesito hacerlo aquí 
                           porque la gestión en asíncrona y todo el flujo de exportación es síncrono */
                        if (trackLi.classList.contains(self.Const.Classes.SELECTEDTRACK)) {
                            self.prepareFeaturesToShare(trackLi.dataset.uid).then(function () {
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    }, 0);
                });
            };

            var _loadTrack = function (self, btnSimulate) {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        const trackLi = btnSimulate.parentElement;

                        _stopOtherTracks(self, trackLi.dataset.id);
                        self.uiSimulate(false, self.getSelectedTrack());
                        self.uiSimulate(true, btnSimulate);

                        self.simulate_paused = false;
                        self.simulateTrack(trackLi);

                        resolve();
                    }, 0);
                });
            };

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.EDIT, function (e) {
                _edit(true, e.target);
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.DELETE, function (e) {
                self.removeTrack(e.target.parentElement);
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.SAVE, function (e) {
                var newName = e.target.parentElement.querySelector('input').value;
                if (newName.trim().length === 0) {
                    TC.alert(self.getLocaleString('geo.trk.edit.alert'));
                }
                else {
                    self.editTrackName(e.target.parentElement.dataset.id, e.target.parentElement.querySelector('input').value);
                    _edit(false, e.target);
                }
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.CANCEL, function (e) {
                _edit(false, e.target);
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.EXPORT_GPX + ',' + self._classSelector + ' ' + sel.EXPORT_KML, function (e) {
                const parent = e.target.parentElement;
                var prefix = 'tc-btn-export-';
                var className = Array.from(e.target.classList).filter(function (cls) {
                    return cls.indexOf(prefix) === 0;
                })[0];
                var mimeType = className.replace(prefix, '').toUpperCase();

                self.export(mimeType, parent).then(function (data) {
                    if (data) {
                        var filename = parent.querySelector('span').textContent;
                        var regex = new RegExp(self.Const.SupportedFileExtensions.join('|'), 'gi');
                        var cleanFilename = filename.replace(regex, '');
                        TC.Util.downloadFile(cleanFilename + '.' + mimeType.toLowerCase(), self.Const.MimeMap[mimeType], data);
                    } else {
                        TC.alert(self.getLocaleString('geo.error.export'));
                    }
                });
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.STOP, function (e) {
                self.uiSimulate(false, e.target);
                self.wrap.simulateTrackEnd();
                const btnPause = e.target.parentElement.querySelector(sel.PAUSE);
                btnPause.classList.remove('play');
                btnPause.setAttribute('title', self.getLocaleString('tr.lst.pause'));

                e.target.parentElement.querySelector(sel.SPEED).textContent = 'x 1';
                self.simulate_speed = 1;
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.PAUSE, function (e) {
                self.simulate_paused = !e.target.classList.contains('play');
                if (self.simulate_paused)
                    self.simulate_pausedElapse = -1;

                e.target.setAttribute('title', self.getLocaleString(self.simulate_paused ? 'tr.lst.play' : 'tr.lst.pause'));
                if (self.simulate_paused) {
                    e.target.classList.add('play');
                }
                else {
                    e.target.classList.remove('play');
                }
            }));

            var lapse = 0.5;
            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.BACKWARD, function (e) {
                if (self.simulate_speed == 1)
                    self.simulate_speed = lapse;
                else self.simulate_speed = self.simulate_speed / 2;

                e.target.parentElement.querySelector(self._classSelector + " " + sel.FORWARD).disabled = false;

                e.target.parentElement.querySelector(sel.SPEED).textContent = self.simulate_speed < 1 ? '/ ' + (1 / self.simulate_speed) : 'x ' + self.simulate_speed;

                if (self.simulate_speed == 0.000244140625) {
                    e.target.disabled = true;
                }
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.FORWARD, function (e) {
                self.simulate_speed = self.simulate_speed / lapse;

                e.target.parentElement.querySelector(sel.SPEED).textContent = self.simulate_speed < 1 ? '/ ' + (1 / self.simulate_speed) : 'x ' + self.simulate_speed;

                e.target.parentElement.querySelector(self._classSelector + " " + sel.BACKWARD).disabled = false;

                if (self.simulate_speed == 4096) {
                    e.target.disabled = true;
                }
            }));


            // popup
            self.track.trackContinue.addEventListener('click', function () {
                // cerramos popup y continuamos con el track de session y almacenando en session
                TC.Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                _tracking.call(self);
            });
            self.track.trackRenew.addEventListener('click', function () {
                // eliminamos el track actual de session - restablecemos el tracking
                delete self.sessionTracking;
                TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, undefined);
                localforage.removeItem(self.Const.LocalStorageKey.TRACKINGTEMP);
                // cerramos el popup
                TC.Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                _tracking.call(self);
            });
            self.track.trackClose.addEventListener('click', function () {
                _deactivateTrackingBtns.call(self);
            });
            //self.track.trackAddSegment.addEventListener('click', function () {
            //    TC.alert('pendiente');
            //    // cerramos el popup
            //    TC.Util.closeModal();
            //});

            // popup advertencia
            self.track.trackAdvertisementOK.addEventListener('click', function () {

                const checkboxes = document.body.querySelectorAll('input[name*="Advertisement"]:checked');

                if (checkboxes.length > 0) {
                    const promise = new Promise(function (resolve, reject) {
                        if (window.localforage)
                            resolve();
                        else {
                            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                                resolve();
                            });
                        }
                    });

                    promise.then(function () {
                        localforage.setItem(checkboxes[0].getAttribute('name'), false);
                    });
                }

                TC.Util.closeModal();
            });

            self.track.renderTrack = document.querySelector('#tc-ctl-geolocation-track-render');
            self.track.renderTrack.addEventListener('change', function () {
                if (self.track.activateButton.classList.contains(TC.Consts.classes.HIDDEN)) {
                    self.layerTracking.setVisibility(this.checked);
                }

                visibilityTrack = this.checked;
            });

            if (window.localforage)
                self.bindTracks();
            else {
                TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                    self.bindTracks();
                });
            }

            if ($.isFunction(callback)) {
                callback();
            }
        });
    };

    ctlProto.activate = function () {
        var self = this;
        //TC.Control.prototype.activate.call(self);
    };

    ctlProto.deactivate = function () {
        var self = this;

        TC.Util.closeModal();
        self.clearSelection();
        self.deactivateTracking();
        //TC.Control.prototype.deactivate.call(self);
    };

    var _layerError = function () {
        var self = this;

        self.map.off(TC.Consts.event.LAYERERROR, _layerError);
        self.clearFileInput(self.track.trackImportFile);

        TC.alert(self.getLocaleString("geo.trk.upload.error3"));
    };
    var _activateTrackingBtns = function () {
        var self = this;

        self.track.activateButton.classList.add(TC.Consts.classes.HIDDEN);
        self.track.deactivateButton.classList.remove(TC.Consts.classes.HIDDEN);
    };

    var _deactivateTrackingBtns = function () {
        var self = this;

        self.track.activateButton.classList.remove(TC.Consts.classes.HIDDEN);
        self.track.deactivateButton.classList.add(TC.Consts.classes.HIDDEN);
    };

    var _showAlerMsg = function () {
        var self = this;
        self.map.toast(self.div.querySelector(".alert-warning").innerHTML, {
            duration: 10000
        });
    };

    ctlProto.markerStyle = {
        radius: 7,
        fillColor: [255, 0, 0, 100],
        strokeColor: [255, 255, 255, 255],
        strokeWidth: 2
    };

    ctlProto.lineStyle = {
        strokeWidth: 2,
        strokeColor: [0, 206, 209, 255]
    };

    ctlProto.setFormatInfoNewPosition = function (newPosition) {
        var self = this;

        var data = {};
        var locale = TC.Util.getMapLocale(self.map);

        if (self.map.on3DView) {
            var geoCoords = self.map.crs !== self.map.view3D.crs ? TC.Util.reproject(newPosition.position, self.map.crs, self.map.view3D.crs) : newPosition.position;
            data.x = geoCoords[0].toLocaleString(locale);
            data.y = geoCoords[1].toLocaleString(locale);

            data.mdt = Math.round(self.map.view3D.getHeightFromMDT(geoCoords)).toLocaleString(locale);

            data.isGeo = true;

        } else {
            data.x = Math.round(newPosition.position[0]).toLocaleString(locale);
            data.y = Math.round(newPosition.position[1]).toLocaleString(locale);
        }

        data.z = (Math.round(newPosition.altitude).toLocaleString(locale));
        data.accuracy = (Math.round(newPosition.accuracy).toLocaleString(locale));
        data.speed = newPosition.speed.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

        return data;
    };

    ctlProto.renderInfoNewPosition = function (d) {
        var self = this;

        self.getRenderedHtml(self.CLASS + '-tracking-toast', self.setFormatInfoNewPosition(d.pd), function (html) {

            if (!self.track.infoPanel) {
                self.track.infoPanel = true;

                var resultsPanelOptions = {
                    content: "table",
                    titles: {
                        main: self.getLocaleString("geo.mylocation"),
                        max: self.getLocaleString("geo.mylocation.show")
                    },
                    classes: {
                        collapsed: "tracking"
                    }
                };

                var ctlPromise;
                const addResultsPanelInfo = function (controlContainer) {
                    resultsPanelOptions.side = controlContainer.SIDE.RIGHT;
                    ctlPromise = controlContainer.addControl('resultsPanel', resultsPanelOptions);
                };

                if (self.options.displayOn) {
                    var controlContainer = self.map.getControlsByClass('TC.control.' + self.options.displayOn[0].toUpperCase() + self.options.displayOn.substring(1))[0];
                    if (!controlContainer) {
                        self.map.addControl(self.options.displayOn).then(addResultsPanelInfo);
                    } else {
                        addResultsPanelInfo(controlContainer);
                    }
                } else {
                    resultsPanelOptions.div = document.createElement('div');
                    self.map.div.appendChild(resultsPanelOptions.div);
                    ctlPromise = self.map.addControl('resultsPanel', resultsPanelOptions);
                }

                ctlPromise.then(function (resultsPanelInfo) {
                    resultsPanelInfo.caller = self;
                    self.map.getControlsByClass('TC.control.ResultsPanel').filter(function (panel) {
                        return panel.content === "table" && panel !== resultsPanelInfo;
                    }).forEach(function (panel) {
                        panel.close();
                    });

                    self.track.infoPanel = resultsPanelInfo;

                    resultsPanelInfo.renderPromise().then(function () {
                        resultsPanelInfo.open(html);
                    });
                });
            } else if (typeof (self.track.infoPanel) !== "boolean" && !self.track.infoPanel.isMinimized()) {
                self.track.infoPanel.renderPromise().then(function () {
                    self.track.infoPanel.getTableContainer().innerHTML = html;
                    if (!self.track.infoPanel.isVisible()) {
                        self.track.infoPanel.doVisible();
                    }
                });
            }
        });
    };


    var duringTrackingToolsPanel = function () {
        var self = this;

        if (!self.track.trackToolPanelOpened.checked) {
            self.map.trigger(TC.Consts.event.TOOLSCLOSE);
        }
    };

    var _tracking = function () {
        var self = this;

        self.activate();

        _activateTrackingBtns.call(self);
        duringTrackingToolsPanel.call(self);

        self.on(self.Const.Event.POSITIONCHANGE, function (d) {

            self.currentPoint = d.pd;
            self.renderInfoNewPosition(d);

            self.track.trackName.disabled = false;
            self.track.trackSave.disabled = false;

            self.track.trackWPT.disabled = false;
            self.track.trackAdd.disabled = false;

            // cada vez que se registra una nueva posición almacenamos en sessionStorage
            TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.formattedToStorage(self.layerTracking).features);
        });
        self.on(self.Const.Event.STATEUPDATED, function (data) {
            //self.track.htmlMarker.setAttribute('src', data.moving ? 'layout/idena/img/geo-marker-heading.png' : 'layout/idena/img/geo-marker.png');
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

        fromSessionToStorage.apply(self);
    };

    var _onWindowFocused;
    var onWindowFocused = function () {
        var self = this;

        if (self.videoScreenOn.paused)
            self.videoScreenOn.play();

        fromStorageToSession.apply(self);
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

        var done = new Promise(function (resolve, reject) {
            if (window.localforage)
                resolve();
            else {
                TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                    resolve();
                });
            }
        });

        done.then(function () {
            localforage.getItem(showAdvertisement).then(function (registeredShowAdvertisement) {
                if (registeredShowAdvertisement == null) {
                    const dialog = self._dialogDiv.querySelector('.tc-ctl-geolocation-track-advert-dialog');
                    const checkbox = dialog.querySelector('input[type="checkbox"]');
                    checkbox.setAttribute('name', showAdvertisement);
                    checkbox.checked = false;

                    document.querySelector('#pageBlurMsg').textContent = TC.Util.detectMobile() ? self.getLocaleString('geo.trk.page.blur'): self.getLocaleString('geo.trk.page.blur.desktop');

                    dialog.querySelector('h3').textContent = showAdvertisement == self.Const.LocalStorageKey.GPSSHOWADVERTISEMENT ?
                        self.getLocaleString("geo.track.activate") + " " + self.getLocaleString("geo.gps") :
                        self.getLocaleString('geo.track.activate.title');

                    TC.Util.showModal(self._dialogDiv.querySelector('.tc-ctl-geolocation-track-advert-dialog'));
                }
            });
        });

        self.map.toast(!TC.Util.detectMobile() ? self.getLocaleString('geo.trk.page.blur.desktop') : self.getLocaleString('geo.trk.page.blur'), {
            type: TC.Consts.msgType.WARNING
        });
    };

    ctlProto._askTracking = function (callback) {
        var self = this;

        TC.Util.showModal(self._dialogDiv.querySelector('.tc-ctl-geolocation-continue-track-dialog'), {
            closeCallback: function () {

                if ($.isFunction(callback)) {
                    callback();
                }
            }
        });

        return true;
    };

    ctlProto.activateTracking = function () {
        var self = this;
        var trackingAvailable = true;

        if (!self.isActive) {
            self.activate();
        }

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
                var asked = self._askTracking(function () {
                    _deactivateTrackingBtns.call(self);
                });

                if (!asked) {
                    self.track.trackRenew.click();
                }
            } else _tracking.call(self);
        } else { _deactivateTrackingBtns.call(self); }
    };

    ctlProto.deactivateTracking = function () {
        var self = this;

        var _deactivateTracking = function () {

            self.track.infoPanel.close();

            fromSessionToStorage.apply(self);

            self.wrap.setTracking(false);


            delete self.geopositionTracking;

            if (!visibilityTrack) {
                self.div.querySelector(self._classSelector + '-track-render').querySelector('label').click();
            }

            removeVideoKeepScreenOn.apply(self);
            removeWindowEvents.apply(self);

            self.off(self.Const.Event.POSITIONCHANGE);
            self.off(self.Const.Event.STATEUPDATED);

            _deactivateTrackingBtns.call(self);

            self.track.trackName.value = '';
            self.track.trackName.disabled = true;
            self.track.trackSave.disabled = true;

            self.track.trackWPT.value = '';
            self.track.trackWPT.disabled = true;
            self.track.trackAdd.disabled = true;

            self.clear(self.Const.Layers.TRACKING);
            self.clear(self.Const.Layers.GPS);

            //TC.Control.prototype.deactivate.call(self);

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
        const self = this;
        return new Promise(function (resolve, reject) {
            var tracks = [];

            localforage.keys().then(function (keys) {
                keys = keys.filter(function (k) {
                    if (!(k.indexOf(self.Const.LocalStorageKey.TRACKINGTEMP) === 0) && k.indexOf(self.Const.LocalStorageKey.TRACKING) === 0) {
                        return /trk#\d/i.exec(k);
                    }
                    return false;
                });

                if (keys.length == 0) {
                    self.availableTracks = tracks;
                    resolve(tracks);
                }

                const promises = new Array(keys.length);
                keys.forEach(function (key, idx) {
                    promises[idx] = new Promise(function (res, rej) {
                        localforage.getItem(key, function (e, v) {
                            res(v);
                        });
                    });
                });

                Promise.all(promises).then(function (results) {
                    if (results && results.length) {
                        results.forEach(function (r) {
                            var r = JSON.parse(r);
                            if (r instanceof Array) {
                                tracks = tracks.concat(r);
                            } else {
                                tracks.push(r);
                            }
                        });

                        var tracksArray = tracks.length > 1 ? _orderTracks(tracks) : tracks;
                        self.availableTracks = tracksArray;
                        resolve(tracksArray);
                    }
                });
            });
        });
    };

    /**
     * Recibe una sucesión de tracks y la ordena por nombre.
     */
    var _orderTracks = function (tracks) {
        var tracksArray = [];

        for (var index in tracks) {
            if (tracks[index] && typeof (tracks[index]) === "object") {
                tracksArray.push(tracks[index]);
                tracksArray.sort(function (a, b) {
                    if (typeof (a.name) === "string") {
                        return $.isFunction(a.name.localeCompare) ? a.name.localeCompare(b.name) : 0;
                    } else { return 0; }
                });
            }
        }

        return tracksArray;
    };

    /* Almaceno los tracks mediante localForage, actualizo la vble availableTracks y actualizo la lista de tracks */
    ctlProto.setStoredTracks = function (tracks) {
        const self = this;
        return new Promise(function (resolve, reject) {
            const promises = [];
            tracks.forEach(function (t) {
                promises.push(new Promise(function (res, rej) {
                    localforage.setItem(self.Const.LocalStorageKey.TRACKING + "#" + t.uid, JSON.stringify(t), function (e, v) {
                        res(v);
                    });
                }));
            });

            Promise.all(promises).then(function () {
                self.getStoredTracks().then(function () {
                    self.bindTracks();
                    resolve();
                });
            });
        });
    };

    /* Obtengo los tracks desde vble local */
    ctlProto.getAvailableTracks = function () {
        const self = this;
        return new Promise(function (resolve, reject) {
            if (!self.availableTracks) {
                self.getStoredTracks().then(function (availableTracks) {
                    resolve(availableTracks);
                });
            }
            else {
                resolve(self.availableTracks);
            }
        });
    };

    ctlProto.bindTracks = function () {
        var self = this;

        const listItems = self.track.trackList.querySelectorAll('li');
        listItems.forEach(function (li) {
            li.style.display = 'none';
        });

        self.getAvailableTracks().then(function (tracks) {

            if (_isEmpty(tracks)) {
                self.track.trackList.querySelectorAll('li[class^="tc-ctl-geolocation-track-available-empty"]').forEach(function (li) {
                    li.style.display = '';
                });
                self.track.trackSearch.disabled = true;
            }
            else {
                const currentSelectedTrack = self.getSelectedTrack();
                var currentSelectedTrackId;
                if (currentSelectedTrack) {
                    currentSelectedTrackId = currentSelectedTrack.dataset.uid
                }
                self.track.trackList.querySelectorAll('li[data-id]').forEach(function (li) {
                    self.track.trackList.removeChild(li);
                });

                for (var i = 0; i < tracks.length; i++) {
                    var t = tracks[i];
                    if (typeof (t) === "object") {
                        self.getRenderedHtml(self.CLASS + '-track-node', {
                            id: i, uid: t.uid, name: t.name ? t.name.trim() : ''
                        }, function (html) {
                            const parser = new DOMParser();
                            const newLi = parser.parseFromString(html, 'text/html').body.firstChild;
                            self.track.trackList.appendChild(newLi);
                        });
                    }
                }

                if (currentSelectedTrackId) {
                    self.setSelectedTrack(self.track.trackList.querySelector('li[data-uid="' + currentSelectedTrackId + '"]'));
                }

                self.track.trackSearch.disabled = false;
            }
        });
    };

    ctlProto.chartProgressInit = function () {
        const self = this;

        if (!window.d3) {
            TC.syncLoadJS(TC.Consts.url.D3C3);
        }

        const dataDiv = d3.select(".c3-event-rects,.c3-event-rects-single").node().getBoundingClientRect();
        self.miDiv = document.createElement('div');
        self.miDiv.classList.add('miDiv');
        self.miDiv.style.width = dataDiv.width + 'px';
        self.miDiv.style.height = dataDiv.height + 'px';

        self.miProgressDiv = document.createElement('div');
        self.miProgressDiv.classList.add('miProgressDiv');
        self.miProgressDiv.classList.add(self.CLASS + '-track-elevation-chart-progress');
        self.miProgressDiv.classList.add(TC.Consts.classes.HIDDEN);
        self.miProgressDiv.style.width = '0%';
        self.miProgressDiv.style.height = dataDiv.height + 'px';

        self.miProgressTextDiv = document.createElement('div');
        self.miProgressTextDiv.classList.add('miProgressTextDiv');
        self.miProgressTextDiv.classList.add('tc-ctl-geolocation-track-elevation-chart-progress');
        self.miProgressTextDiv.classList.add('text');
        self.miProgressTextDiv.style.width = dataDiv.width + 'px';
        self.miProgressTextDiv.style.height = dataDiv.height + 'px';

        self.miDiv.style.top = dataDiv.top + 'px';
        self.miDiv.style.left = dataDiv.left + 'px';
        self.miDiv.style.bottom = dataDiv.bottom + 'px';
        self.miDiv.style.right = dataDiv.right + 'px';
        self.miDiv.style.position = 'absolute';
        self.miDiv.style.zIndex = 10008;
        self.miDiv.style.display = 'none';

        self.miProgressDiv.appendChild(self.miProgressTextDiv);
        self.miDiv.appendChild(self.miProgressDiv);
        document.body.appendChild(self.miDiv);

    };

    ctlProto.chartProgressClear = function () {
        const self = this;
        if (self.miDiv) {
            self.miDiv.parentElement.removeChild(self.miDiv);
            self.miDiv = null;
            self.miProgressDiv = null;
            self.miProgressTextDiv = null;
        }
    };

    ctlProto.chartSetProgress = function (previous, current, distance, doneTime) {
        var self = this;

        if (self.miDiv) {
            if (self.miDiv.style.display === 'none') {
                self.miDiv.style.display = '';
            }

            self.miProgressDiv.classList.remove(TC.Consts.classes.HIDDEN);

            var done = previous.d;
            var progress = (done + Math.hypot(previous.p[0] - current[0], previous.p[1] - current[1])) / distance * 100;

            self.miProgressDiv.style.width = progress + '%';

            var locale = self.map.options.locale && self.map.options.locale.replace('_', '-') || undefined;
            var ele = parseInt(current[2].toFixed(0)).toLocaleString(locale);
            var dist;
            var measure;
            if ((done / 1000) < 1) {
                dist = Math.round((done / 1000) * 1000);
                measure = ' m';
            } else {
                dist = Math.round((done / 1000) * 100) / 100;
                measure = ' km';
            }

            dist = dist.toLocaleString(locale);

            self.miProgressTextDiv.innerHTML = '<div><span>' + ele + ' m' + '</span>' + '<br>' + '<span>' + dist + measure + '</span></div>' + (doneTime ? '<br><span>' + doneTime.toString + '</span>' : '');
        }
    };

    ctlProto._getTime = function (timeFrom, timeTo) {
        var diff = timeTo - timeFrom;
        var d = {};
        var daysDifference = Math.floor(diff / 1000 / 60 / 60 / 24);
        diff -= daysDifference * 1000 * 60 * 60 * 24;

        var hoursDifference = Math.floor(diff / 1000 / 60 / 60);
        diff -= hoursDifference * 1000 * 60 * 60;

        d.h = hoursDifference + (daysDifference * 24);

        var minutesDifference = Math.floor(diff / 1000 / 60);
        diff -= minutesDifference * 1000 * 60;

        d.m = minutesDifference;

        d.s = Math.floor(diff / 1000);

        return $.extend({}, d, { toString: ("00000" + d.h).slice(-2) + ':' + ("00000" + d.m).slice(-2) + ':' + ("00000" + d.s).slice(-2) });
    };

    ctlProto.simulateTrack = function (li) {
        var self = this;

        self.simulate_speed = 1;

        self.drawTrack(li, false).then(function () {
            self.wrap.simulateTrack();
        });
    };

    ctlProto.drawTrack = function (li, activateSnapping) {
        var self = this;

        duringTrackingToolsPanel.call(self);
        return new Promise(function (resolve, reject) {
            self.setSelectedTrack(li);
            self.drawTrackingData(li).then(function () {
                self.elevationTrack(li);

                self.activate();
                resolve();
            });
        });
    };


    ctlProto.elevationTrack = function (li, resized) {
        var self = this;

        if (resized) {            

            self.wrap.simulateTrackEnd();
            self.uiSimulate(false, li);
            return;
        }

        if (!self.onResize) {
            self.onResize = self.elevationTrack.bind(self, li, true);
            window.addEventListener("resize", self.onResize, false);
        }

        self.chart = {
            coordinates: []
        };

        if (self.track.elevationChart)
            self.track.elevationChart = self.track.elevationChart.destroy();

        var getChartData = function (li) {
            return new Promise(function (resolve, reject) {
                TC.loadJS(
                    !TC.tool || !TC.tool.Elevation,
                    TC.apiLocation + 'TC/tool/Elevation',
                    function () {
                        self.getTrackingData(li).then(function (track) {
                            var geoJSON = track.data;
                            if (geoJSON) {
                                var x, ele; x = []; ele = [];
                                var empty = true;
                                var minEle, maxEle;
                                var elevationGain = {};
                                var time = {};
                                var km = 0;
                                var geom;

                                var f = (new ol.format.GeoJSON()).readFeatures(geoJSON);

                                var getDistance = function () {
                                    if (geom.getLayout() == ol.geom.GeometryLayout.XYZ ||
                                        geom.getLayout() == ol.geom.GeometryLayout.XYZM) {
                                        var distance = 0;
                                        if (self.map.crs !== self.map.options.utmCrs) {
                                            line = new ol.geom.LineString(TC.Util.reproject(geom.getCoordinates(), self.map.crs, self.map.options.utmCrs));
                                            distance = line.getLength();
                                        } else {
                                            distance = geom.getLength();
                                        }
                                        return parseFloat((distance / 1000).toFixed(2));
                                    }

                                    return null;
                                };
                                var getTime = function () {
                                    if (geom.getLayout() == ol.geom.GeometryLayout.XYZM ||
                                        geom.getLayout() == ol.geom.GeometryLayout.XYM) {
                                        var diff = geom.getLastCoordinate()[3] - geom.getFirstCoordinate()[3];
                                        return {
                                            s: Math.floor((diff / 1000) % 60),
                                            m: Math.floor(((diff / (1000 * 60)) % 60)),
                                            h: Math.floor(((diff / (1000 * 60 * 60)) % 24))
                                        };
                                    }

                                    return null;
                                };

                                var addX = function (x) {
                                    if (self.chart.coordinates.length > 0) {
                                        var distance = 0;
                                        self.chart.coordinates
                                            .forEach(function (point, idx, arr) {
                                                var prev = idx === 0 ? point : arr[idx - 1];

                                                if (self.map.crs !== self.map.options.utmCrs) {
                                                    point = TC.Util.reproject(point, self.map.crs, self.map.options.utmCrs);
                                                    prev = TC.Util.reproject(prev, self.map.crs, self.map.options.utmCrs);
                                                }

                                                const dx = point[0] - prev[0];
                                                const dy = point[1] - prev[1];
                                                distance += Math.sqrt(dx * dx + dy * dy);

                                                x.push(parseFloat(distance.toFixed(2)));
                                            });
                                    }
                                };

                                var addElevation = function (ele) {
                                    var y = [];
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

                                        }
                                        else {
                                            resolve(null);
                                            return;
                                        }
                                    }
                                };

                                f.filter(function (feature) {
                                    return feature.getGeometry().getType().toLowerCase() === 'linestring' || feature.getGeometry().getType().toLowerCase() === 'multilinestring';
                                }).forEach(function (feature) {
                                    geom = feature.getGeometry();

                                    switch (geom.getType().toLowerCase()) {
                                        case 'linestring':

                                            if (track.layout === ol.geom.GeometryLayout.XYZM ||
                                                track.layout === ol.geom.GeometryLayout.XYZ) {

                                                time = getTime(geom);
                                                km = getDistance(geom);
                                                elevationGain = TC.tool.Elevation.getElevationGain({ coords: geom.getCoordinates(), hillDeltaThreshold: self.gapHill });
                                                self.chart.coordinates = self.chart.coordinates.concat(geom.getCoordinates());

                                                addX(x);
                                                addElevation(ele);
                                            }
                                            break;
                                        case 'multilinestring':

                                            if (track.layout === ol.geom.GeometryLayout.XYZM ||
                                                track.layout === ol.geom.GeometryLayout.XYZ) {

                                                var _time;
                                                var ls = geom.getLineStrings();
                                                for (var i = 0; i < ls.length; i++) {
                                                    km = km + getDistance(ls[i]);

                                                    if (ls[i].getLayout() == ol.geom.GeometryLayout.XYZM)
                                                        _time = _time + (ls[i].getLastCoordinate()[3] - ls[i].getFirstCoordinate()[3]);

                                                    self.chart.coordinates = self.chart.coordinates.concat(ls[i].getCoordinates());

                                                    if (_time) { time = getTime(_time); }

                                                    addX(x);
                                                    addElevation(ele);
                                                }
                                            }

                                            break;
                                        default:
                                            return null;
                                            break;
                                    }
                                });

                                if (ele instanceof Array && ele.length == 0) {
                                    empty = true;
                                }

                                self.chartData = !empty ? $.extend({}, { time: time, ele: ele, x: x, miny: minEle, maxy: maxEle }, elevationGain) : null;

                                resolve(self.chartData);
                                return;
                            }

                            resolve(null);
                            return;
                        });
                    }
                );
            });
        };

        getChartData(li).then(function (data) {
            var locale = TC.Util.getMapLocale(self.map);
            if (data != null) {
                if (data.time) data.time = ("00000" + data.time.h).slice(-2) + ':' + ("00000" + data.time.m).slice(-2) + ':' + ("00000" + data.time.s).slice(-2);
                data.coords = self.chart.coordinates;
                self.hasElevation = true;
            }
            else {
                self.hasElevation = false;
                data = {
                    msg: self.getLocaleString("geo.trk.chart.chpe.empty")
                };
            }

            data.minHeight = self.CHART_SIZE.MIN_HEIGHT;
            data.maxHeight = self.CHART_SIZE.MAX_HEIGHT;

            data.minWidth = self.CHART_SIZE.MIN_WIDTH;
            data.mediumWidth = self.CHART_SIZE.MEDIUM_WIDTH;
            data.maxWidth = self.CHART_SIZE.MAX_WIDTH;

            self.map.one(TC.Consts.event.DRAWCHART, function (e) {
                self.chartProgressInit();
            });

            if (!self.resultsPanelChart) {

                if (!window.c3) {
                    TC.syncLoadJS(TC.Consts.url.D3C3 || TC.apiLocation + 'lib/d3c3/d3c3.min.js');
                }

                var resultsPanelOptions = {
                    content: "chart",
                    titles: {
                        main: self.getLocaleString("geo.trk.chart.chpe"),
                        max: self.getLocaleString("geo.trk.chart.chpe")
                    },
                    openOn: self.Const.Event.DRAWTRACK,
                    closeOn: self.Const.Event.CLEARTRACK,
                    chart: {
                        ctx: self,
                        onmouseout: ctlProto.removeElevationTooltip,
                        tooltip: ctlProto.getElevationTooltip
                    }
                };

                var ctlPromise;
                const addResultsPanelChart = function (controlContainer) {
                    resultsPanelOptions.side = controlContainer.SIDE.RIGHT;
                    ctlPromise = controlContainer.addControl('resultsPanel', resultsPanelOptions);
                };

                if (self.options.displayOn) {
                    var controlContainer = self.map.getControlsByClass('TC.control.' + self.options.displayOn[0].toUpperCase() + self.options.displayOn.substring(1))[0];
                    if (!controlContainer) {
                        self.map.addControl(self.options.displayOn).then(addResultsPanelChart);
                    } else {
                        addResultsPanelChart(controlContainer);
                    }
                } else {
                    resultsPanelOptions.div = document.createElement('div');
                    self.map.div.appendChild(resultsPanelOptions.div);
                    ctlPromise = self.map.addControl('resultsPanel', resultsPanelOptions);
                }

                ctlPromise.then(function (resultsPanelChart) {
                    resultsPanelChart.caller = self;
                    self.resultsPanelChart = resultsPanelChart;
                    resultsPanelChart.renderPromise().then(function () {

                        resultsPanelChart.activateSnapping = function (e) {
                            if (self.layerTrack && (!self.layerTrack.getVisibility() && self.layerTrack.getOpacity() == 0))
                                self.wrap.deactivateSnapping.call(self.wrap);
                        };
                        resultsPanelChart.deactivateSnapping = function (e) {
                            if (self.layerTrack && self.layerTrack.getVisibility() && self.layerTrack.getOpacity() > 0)
                                self.wrap.activateSnapping.call(self.wrap);
                        };

                        resultsPanelChart.div.addEventListener('mouseover', resultsPanelChart.deactivateSnapping);
                        resultsPanelChart.div.addEventListener('mouseout', resultsPanelChart.activateSnapping);

                        self.map
                            .on(TC.Consts.event.RESULTSPANELMIN, function () {
                                if (self.miDiv) {
                                    self.miDiv.style.display = 'none';
                                }
                            })
                            .on(TC.Consts.event.RESULTSPANELMAX, function () {
                                if (self.miDiv) {
                                    self.miDiv.style.display = '';
                                }
                            })
                            .on(TC.Consts.event.RESULTSPANELCLOSE, function () {
                                if (self.miDiv) {
                                    self.miDiv.style.display = 'none';
                                }
                            });

                        self.map.trigger(self.Const.Event.DRAWTRACK, { data: data });
                    });
                });
            } else {
                self.resultsPanelChart.open();
                self.map.trigger(self.Const.Event.DRAWTRACK, { data: data });
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

            self.layerTrack.clearFeatures();

            // gráfico perfil de elevación
            if (self.resultsPanelChart)
                self.resultsPanelChart.close();
            delete self.chartData;

            // overlay de la simulación
            self.wrap.simulateTrackEnd();

            self.wrap.clear();

            // eliminamos la selección en la lista de tracks
            self.track.trackList.querySelectorAll('li').forEach(function (li) {
                li.classList.remove(self.Const.Classes.SELECTEDTRACK);
            });

            self.map.trigger(self.Const.Event.CLEARTRACK);

            self.featuresToShare = [];

            //TC.Control.prototype.deactivate.call(self);

        } else {
            self.layerTracking.clearFeatures();
            self.layerGPS.clearFeatures();
        }
    };

    ctlProto.saveTrack = function (options) {
        const self = this;
        return new Promise(function (resolve, reject) {

            var message = options.message || self.getLocaleString("geo.trk.save.alert");

            var _save = function (layer) {
                var wait;
                wait = self.getLoadingIndicator().addWait();

                var trackName = options.importedFileName || self.track.trackName.value.trim();

                var tracks = self.availableTracks;
                if (!tracks) {
                    tracks = [];
                }

                var formatted = self.wrap.formattedToStorage(layer, true, options.notReproject);

                var clean = function (wait) {
                    self.track.trackName.value = '';
                    self.track.trackName.disabled = true;
                    self.track.trackSave.disabled = true;

                    self.track.trackWPT.value = '';
                    self.track.trackWPT.disabled = true;
                    self.track.trackAdd.disabled = true;

                    self.getLoadingIndicator().removeWait(wait);

                    duringTrackingToolsPanel.call(self);
                };

                var newTrack = {
                    name: trackName,
                    data: formatted.features,
                    layout: formatted.layout,
                    crs: self.storageCRS
                };

                TC.loadJS(
                    !window.hex_md5,
                    [TC.apiLocation + TC.Consts.url.HASH],
                    function () {
                        var hash = hex_md5(JSON.stringify(newTrack));

                        var sameTrackUID = tracks.map(function (savedTrack) {
                            var clonedTrack = JSON.parse(JSON.stringify(savedTrack));
                            delete clonedTrack.uid;
                            if (hash === hex_md5(JSON.stringify(clonedTrack))) {
                                return savedTrack.uid;
                            } else {
                                const jsonFormat = new ol.format.GeoJSON();
                                // validamos si se trata de un track exportado/importado ya que se compacta la geometría
                                var features = jsonFormat.readFeatures(clonedTrack.data);
                                // Aplicamos una precisión un dígito mayor que la del mapa, si no, al compartir algunas parcelas se deforman demasiado
                                var precision = Math.pow(10, TC.Consts.DEGREE_PRECISION + 1);

                                features.forEach(function (feature) {
                                    var geom = TC.Util.explodeGeometry(TC.Util.compactGeometry(feature.getGeometry().getCoordinates(), precision));
                                    feature.getGeometry().setCoordinates(geom);
                                });

                                clonedTrack.data = jsonFormat.writeFeatures(features);

                                if (hash === hex_md5(JSON.stringify(clonedTrack))) {
                                    return savedTrack.uid;
                                } else {
                                    return null;
                                }
                            }

                        }).filter(function (uid) {
                            return uid !== null
                        });

                        const getTrackIndex = function (uid) {
                            return self.getStoredTracks().then(function () {
                                self.bindTracks();

                                var index;
                                for (var i = 0; i < self.availableTracks.length; i++) {
                                    if (self.availableTracks[i].uid === uid) {
                                        index = i;
                                        break;
                                    }
                                }

                                return index;
                            });
                        };

                        if (sameTrackUID.length === 0) {

                            newTrack.uid = Date.now() + Math.random();
                            tracks.push(newTrack);
                            tracks = _orderTracks(tracks);

                            try {
                                self.setStoredTracks(tracks).then(function () {
                                    self.map.toast(message, { duration: 3000 });

                                    clean(wait);

                                    getTrackIndex(newTrack.uid).then(function (index) {
                                        resolve(index);
                                    });
                                });

                            } catch (error) {
                                TC.alert(self.getLocaleString("geo.error.savelocalstorage") + ': ' + error.message);
                                clean(wait);
                                reject();
                            }
                        } else {
                            console.log('Ya existe un track con ese mismo hash');

                            clean(wait);

                            getTrackIndex(sameTrackUID[0]).then(function (index) {
                                resolve(index);
                            });
                        }
                    });

            };

            const createTCFeatures = function (features) {
                return new Promise(function (resolve, reject) {
                    var featurePromises = features.filter(function (feature) {
                        return !feature._wrap;
                    }).forEach(function (elm) {
                        return TC.wrap.Feature.createFeature(elm);
                    });

                    Promise.all(featurePromises).then(function (tcFeatures) {
                        resolve();
                    });
                });
            };

            if (self.importedFileName)
                _save(self.layerTrack);
            else if (self.track.trackName.value.trim().length == 0) {
                self.track.trackName.value = new Date().toLocaleString();
                _save(self.layerTracking);
            }
            else {
                _save(self.layerTracking);
            }
        });
    };

    ctlProto.addWaypoint = function () {
        var self = this;

        var waypointName = self.track.trackWPT.value.trim();
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

        self.track.trackWPT.value = '';
        self.track.trackWPT.disabled = true;
        self.track.trackAdd.disabled = true;

        // cada vez que se añade un waypoint almacenamos en sessionStorage
        TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.formattedToStorage(self.layerTracking).features);

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
                var dataId = li.dataset.id;
                if (tracks[dataId]) {
                    var uid = tracks[dataId].uid;

                    TC.confirm(self.getLocaleString("geo.trk.delete.alert"), function () {

                        const selectedTrack = self.getSelectedTrack();
                        if (selectedTrack && selectedTrack.dataset.id === dataId) {
                            self.clear(self.Const.Layers.TRACK);
                        }

                        localforage.removeItem(self.Const.LocalStorageKey.TRACKING + '#' + uid).then(function () {
                            self.getStoredTracks().then(function () {
                                self.bindTracks();
                            });
                        }).catch(function (err) {
                            console.log(err);
                        });

                    }, function () { });
                }
            }
        });
    };

    ctlProto.setSelectedTrack = function (li) {
        var self = this;

        if (!self.isActive) {
            self.activate();
        }

        self.track.trackList.querySelectorAll('li[data-id] > span').forEach(function (span) {
            span.setAttribute('title', span.textContent);
        });
        self.track.trackList.querySelectorAll('li').forEach(function (li) {
            li.classList.remove(self.Const.Classes.SELECTEDTRACK);
        });

        li.classList.add(self.Const.Classes.SELECTEDTRACK);

        li.setAttribute('title', self.getLocaleString("tr.lst.clear") + " " + li.querySelector('span').textContent);
        li.querySelector(self.Const.Selector.DRAW).setAttribute('title', li.getAttribute('title'));
    };

    ctlProto.getSelectedTrack = function () {
        var self = this;

        return self.track.trackList.querySelector('li.' + self.Const.Classes.SELECTEDTRACK);
    };

    ctlProto.clearSelectedTrack = function () {
        const self = this;

        const selected = self.getSelectedTrack();
        if (selected) {

            if (self.onResize) {
                window.removeEventListener('resize', self.onResize, false);
                self.onResize = undefined;
            }

            selected.classList.remove(self.Const.Classes.SELECTEDTRACK);
            selected.setAttribute('title', selected.textContent);
            selected.querySelector(self.Const.Selector.DRAW).setAttribute('title', selected.getAttribute('title'));
        }
    };

    ctlProto.clearSelection = function () {
        var self = this;

        self.wrap.deactivateSnapping();
        var selected = self.getSelectedTrack();
        if (selected) {
            self.clearSelectedTrack();
        }
        if (self.resultsPanelChart) {

            self.resultsPanelChart.div.removeEventListener('mouseover', self.resultsPanelChart.deactivateSnapping);
            self.resultsPanelChart.div.removeEventListener('mouseout', self.resultsPanelChart.activateSnapping);

            self.resultsPanelChart.close();
        }

        self.clear(self.Const.Layers.TRACK);
    };

    ctlProto.drawTrackingData = function (li) {
        const self = this;

        return new Promise(function (resolve, reject) {
            self.wrap.clear();

            self.getTrackingData(li).then(function (track) {
                var data = track.data;
                if (track.data)
                    self.wrap.drawTrackingData(track).then(function () {
                        var showFeatures = self.layerTrack.features;
                        if (showFeatures && showFeatures.length > 0) {

                            var coordinates = showFeatures.filter(function (feature) {
                                feature.showsPopup = false;
                                if (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline) {
                                    return true;
                                } else if (feature instanceof TC.feature.Polyline) {
                                    return true;
                                }
                                return false;
                            }).map(function (feature) {
                                if (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline) {
                                    return feature.geometry[0];
                                } else if (feature instanceof TC.feature.Polyline) {
                                    return feature.geometry;
                                }
                            })[0];

                            if (coordinates) {
                                var first = coordinates[0];
                                var last = coordinates[coordinates.length - 1];

                                if (first && !(first === last)) {
                                    self.layerTrack.addMarker(first.slice().splice(0, 2), {
                                        showsPopup: false, cssClass: self.CLASS + '-track-marker-icon-end', anchor: [0.5, 1], notExport: true
                                    });
                                }

                                if (last) {
                                    self.layerTrack.addMarker(last.slice().splice(0, 2), {
                                        showsPopup: false, cssClass: self.CLASS + '-track-marker-icon', anchor: [0.5, 1], notExport: true
                                    });
                                }
                            }
                        }
                        self.layerTrack.setVisibility(true);
                        resolve();
                    });
            });
        });
    };

    ctlProto.getTrackingData = function (li) {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.getAvailableTracks().then(function (tracks) {
                if (tracks) {
                    const dataId = li.dataset.id;
                    if (tracks[dataId]) {
                        var track = tracks[dataId].data;

                        // GLS: tengo que transformar de 4326 al crs del mapa en el momento de pintar, porque si lo hacemos al cargar la lista
                        // y después hay cambio de crs, en el momento de pintar no sé desde qué crs debo tranformar
                        track = self.wrap.formattedFromStorage(track);

                        resolve({ data: track, layout: tracks[dataId].layout });
                    }
                } else {
                    resolve();
                }
            });
        });
    };

    ctlProto.export = function (type, li) {
        var self = this;

        return self.wrap.export(type, li);
    };

    ctlProto.getElevationTooltip = function (d) {
        const self = this;
        self.wrap.showElevationMarker(d);

        return self.resultsPanelChart.getElevationChartTooltip(d);
    };

    ctlProto.removeElevationTooltip = function () {
        var self = this;
        self.wrap.hideElevationMarker();
    }

    ctlProto.clearFileInput = function (fileInput) {
        const form = document.createElement('form');
        const parent = fileInput.parentElement;
        parent.insertBefore(form, fileInput);
        form.appendChild(fileInput);
        form.reset();
        // Desenvolvemos el input del form
        form.insertAdjacentElement('afterend', fileInput);
        parent.removeChild(form);
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
            if (self.currentPositionTrk) {
                self.currentPositionTrk = self.currentPositionTrk instanceof Array ? self.currentPositionTrk : [self.currentPositionTrk];

                self.currentPositionTrk.forEach(function (watch) {
                    navigator.geolocation.clearWatch(watch);
                });

                self.currentPositionTrk = [];
            }
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
            self.track.activateButton.classList.remove(TC.Consts.classes.HIDDEN);
            self.track.deactivateButton.classList.add(TC.Consts.classes.HIDDEN);
        }
    };

    var _isEmpty = function (obj) {
        return !obj || obj.length === 0;
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState) {
            const state = {};
            if (self.layerTrack) {
                var features = self.layerTrack.features;

                if (features.length > 0 && self.featuresToShare && self.featuresToShare.length > 0) {
                    state.features = self.featuresToShare;
                } else {
                    const layerState = self.layerTrack.exportState({
                        features: features
                    });

                    state.features = layerState.features;
                }

                state.id = self.id;
                const selectedTrack = self.getSelectedTrack();
                if (selectedTrack) {
                    state.trackName = selectedTrack.querySelector('span').innerHTML;
                }
                return state;
            }
        }
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        if (self.map) {
            if (state.features && state.features.length) {
                self.enable();

                if (state.features.length > 0) {
                    const promises = new Array(state.features.length);
                    state.features.forEach(function (f, idx) {
                        const featureOptions = { data: f.data, id: f.id, showsPopup: f.showsPopup };
                        var addFn;
                        var geom = TC.Util.explodeGeometry(f.geom);
                        switch (f.type) {
                            case TC.Consts.geom.POLYLINE:
                                promises[idx] = new TC.feature.Polyline(geom, featureOptions);
                                break;
                            case TC.Consts.geom.MULTIPOLYLINE:
                                promises[idx] = new TC.feature.MultiPolyline(geom, featureOptions);
                                break;
                            case TC.Consts.geom.MARKER:
                                promises[idx] = new TC.feature.Marker(geom, featureOptions);
                                break;
                            case TC.Consts.geom.POINT:
                                promises[idx] = new TC.feature.Point(geom, featureOptions);
                                break;
                        }
                    });

                    Promise.all(promises).then(function (tcFeatures) {
                        var options = { features: tcFeatures, fileName: state.trackName, notReproject: true, isShared: true };
                        if (!self.availableTracks) {
                            self.getStoredTracks().then(function () {
                                self.importTrack(options);
                            });
                        } else {
                            self.importTrack(options);
                        }
                    });
                }
            }
        }
    };
})();
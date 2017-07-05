TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}
(function () {
    if (!Array.prototype.filter) {
        Array.prototype.filter = function (fun/*, thisArg*/) {
            'use strict';

            if (this === void 0 || this === null) {
                throw new TypeError();
            }

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== 'function') {
                throw new TypeError();
            }

            var res = [];
            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i];

                    // NOTE: Technically this should Object.defineProperty at
                    //       the next index, as push can be affected by
                    //       properties on Object.prototype and Array.prototype.
                    //       But that method's new, and collisions should be
                    //       rare, so use the more-compatible alternative.
                    if (fun.call(thisArg, val, i, t)) {
                        res.push(val);
                    }
                }
            }

            return res;
        };
    }
})();
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
    TC.Consts.classes.THREED = TC.Consts.classes.THREED || 'tc-threed';
    TC.Consts.event.TERRAINLOADED = TC.Consts.event.TERRAINLOADED || 'terrainloaded.tc.threed';
    TC.Consts.event.TERRAINRECEIVING = TC.Consts.event.TERRAINRECEIVING || 'terrainreceiving.tc.threed';

    TC.control.ThreeD = function () {
        var self = this;

        TC.Control.apply(self, arguments);

        self.$events = $(self);

        self.selectors = {
            divThreedMap: self.options.divMap
        };

        self.Consts = {
            BLANK_BASE: 'blank',
            DEFAULT_TILE_SIZE: 256,
            TERRAIN_URL: 'https://pmpwvinet18.tcsa.local/customcesiumterrain/epsg3857/geodetic/_5m/5m',
            events: {
                GFI: "gfi.tc.threed"
            }
        };

        if (self.options.terrainURL)
            self.Consts.TERRAIN_URL = self.options.terrainURL;

        if (self.options.isDebug)
            TC.Consts.url.CESIUM = TC.apiLocation + 'lib/cesium/debug/Cesium.js';
    };

    TC.inherit(TC.control.ThreeD, TC.Control);

    var ctlProto = TC.control.ThreeD.prototype;

    ctlProto.CLASS = 'tc-ctl-threed';
    ctlProto.classes = {
        MAPTHREED: 'tc-map-threed',
        LOADING: 'tc-loading',
        BTNACTIVE: 'active',
        CAMERACTRARROWDISABLED: 'disabled-arrow',
        BETA: 'tc-beta-button',
        FOCUS: 'focus',
        HIGHLIGHTED: 'highlighted',
        DISABLED: 'disabled',
        OUTFOCUS: 'outfocus',
        GFIRESULTSTR: '-gfiTR',
        GFIRESULTSTH: '-gfiTH',
        GFIRESULTSTD: '-gfiTD'
    };
    ctlProto.direction = {
        TO_TWO_D: 'two_d',
        TO_THREE_D: 'three_d'
    };
    ctlProto.threeDControls = [
        "search",
        "attribution",
        "basemapSelector",
        "listTOC",
        "selectContainer",
        "externalWMS",
        "fileImport",
        "layerCatalog",
        "click",
        "fullScreen",
        "loadingIndicator",
        "navBar",
        "overviewMap",
        "legend",
        "fullScreen",
        "threeD"
    ];

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/ThreeD.html";
        ctlProto.template[ctlProto.CLASS + '-overlay'] = TC.apiLocation + "TC/templates/ThreeDOverlay.html";
        ctlProto.template[ctlProto.CLASS + '-cm-ctls'] = TC.apiLocation + "TC/templates/ThreeDCameraControls.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS + '-cm-ctls'] = function () { dust.register(ctlProto.CLASS + '-cm-ctls', body_0); function body_0(chk, ctx) { return chk.w("<div><svg xmlns:dc=\"http://purl.org/dc/elements/1.1/\"xmlns:cc=\"http://creativecommons.org/ns#\"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"xmlns:svg=\"http://www.w3.org/2000/svg\"xmlns=\"http://www.w3.org/2000/svg\"xmlns:sodipodi=\"http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd\"xmlns:inkscape=\"http://www.inkscape.org/namespaces/inkscape\"width=\"220\"height=\"135\"viewBox=\"0 0 63.40233 35.531682\"version=\"1.1\"id=\"threedControls\"><g inkscape:groupmode=\"layer\"id=\"backgroundLayer\"inkscape:label=\"backgroundLayer\"transform=\"translate(-2.3693123,-42.387899)\"><path style=\"fill:#ffffff;fill-opacity:0.23999999;stroke:none;stroke-width:0.2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:0.3169643;paint-order:stroke fill markers\"d=\"M 48.005285,42.387899 A 17.766048,17.766048 0 0 0 34.067635,49.16888 17.754217,17.754217 0 0 0 20.123267,42.399784 17.754217,17.754217 0 0 0 2.3693123,60.153739 a 17.754217,17.754217 0 0 0 17.7539547,17.75447 17.754217,17.754217 0 0 0 13.923699,-6.76961 17.766048,17.766048 0 0 0 13.958319,6.78098 17.766048,17.766048 0 0 0 17.766357,-17.76584 17.766048,17.766048 0 0 0 -17.766357,-17.76584 z\"id=\"background\"inkscape:connector-curvature=\"0\" /></g><g inkscape:label=\"tiltLayer\"inkscape:groupmode=\"layer\"id=\"tiltLayer\"transform=\"translate(-26.69084,-42.254264)\"style=\"display:inline\"><g class=\"tc-ctl-threed-cm-tilt-indicator\"><path class=\"tc-ctl-threed-cm-tilt-inner\"id=\"tiltInner\"d=\"m 44.44423,52.861576 c 3.959106,0 7.167321,3.203889 7.167321,7.168124 0,3.964234 -3.208215,7.174892 -7.167321,7.174892 -3.959106,0 -7.160559,-3.210658 -7.160559,-7.174892 0,-3.964235 3.201453,-7.168124 7.160559,-7.168124 z\"inkscape:connector-curvature=\"0\"><title>").h("i18n", ctx, {}, { "$key": "threed.tilt.reset" }).w("</title></path><path class=\"tc-ctl-threed-cm-tilt-inner-image\"d=\"m 40.116095,64.124648 c -0.12075,-0.119221 -0.171366,-0.928328 -0.171366,-2.739326 0,-2.143319 0.03709,-2.606753 0.223349,-2.79065 0.19727,-0.194769 0.269957,-0.196719 0.622509,-0.01671 0.219537,0.112088 0.761654,0.542242 1.204705,0.955894 l 0.805547,0.752098 v 0.939855 c 0,0.51692 -0.06955,1.085596 -0.154558,1.263727 -0.173436,0.363428 -1.919571,1.804317 -2.186551,1.804317 -0.09475,0 -0.249383,-0.07614 -0.343635,-0.169192 z m 3.287741,-0.05029 c -0.307698,-0.212789 -0.317387,-0.295835 -0.317387,-2.721198 0,-1.757783 0.05096,-2.552024 0.171366,-2.670904 0.120776,-0.119243 0.941399,-0.169194 2.779684,-0.169194 2.432612,0 2.618273,0.01838 2.756146,0.27272 0.08484,0.156511 0.147831,1.267987 0.147831,2.608402 0,3.088986 0.189068,2.899662 -2.895738,2.899662 -1.872744,0 -2.3862,-0.04266 -2.641902,-0.219488 z m 0.586357,-6.180807 c -0.314529,-0.267117 -0.397432,-0.458143 -0.397432,-0.915756 0,-0.785501 0.427643,-1.207722 1.223233,-1.207722 1.162181,0 1.675866,1.23538 0.851939,2.048861 -0.522115,0.515494 -1.126934,0.542392 -1.67774,0.07462 z m 2.780604,-0.09201 c -0.374474,-0.369724 -0.423284,-0.501051 -0.3506,-0.943285 0.118405,-0.72038 0.53618,-1.088187 1.236028,-1.088187 0.699848,0 1.117624,0.367807 1.236028,1.088187 0.07269,0.442234 0.02388,0.573561 -0.3506,0.943285 -0.300932,0.297119 -0.573881,0.429526 -0.885428,0.429526 -0.311544,0 -0.584496,-0.132407 -0.885428,-0.429526 z\"id=\"tiltImage\"inkscape:connector-curvature=\"0\"><title>").h("i18n", ctx, {}, { "$key": "threed.tilt.reset" }).w("</title></path><path class=\"tc-ctl-threed-cm-tilt-outer tc-ctl-threed-cm-tilt-outer-circle\"id=\"tiltOuter\"d=\"m 44.44423,48.705554 c -6.246102,0 -11.312196,5.070128 -11.312196,11.324146 0,6.254017 5.066094,11.330914 11.312196,11.330914 6.246102,0 11.312196,-5.076897 11.312196,-11.330914 0,-6.254018 -5.066094,-11.324146 -11.312196,-11.324146 z m 0,4.156022 c 3.959106,0 7.167321,3.203889 7.167321,7.168124 0,3.964234 -3.208215,7.174892 -7.167321,7.174892 -3.959106,0 -7.160559,-3.210658 -7.160559,-7.174892 0,-3.964235 3.201453,-7.168124 7.160559,-7.168124 z\"inkscape:connector-curvature=\"0\"><title>").h("i18n", ctx, {}, { "$key": "threed.tilt.drag" }).w("</title></path><path class=\"tc-ctl-threed-cm-tilt-outer tc-ctl-threed-cm-tilt-outer-shell-circle\"sodipodi:nodetypes=\"ssssssccccsccccssccsssccscccccccsccssscsssssccccccccccccccc\"inkscape:connector-curvature=\"0\"id=\"tiltShell\"d=\"m 44.44423,48.705554 c -6.246102,0 -11.312196,5.070128 -11.312196,11.324146 0,6.254017 5.066094,11.330914 11.312196,11.330914 6.246102,0 11.312196,-5.076897 11.312196,-11.330914 0,-6.254018 -5.066094,-11.324146 -11.312196,-11.324146 z m 0,0.379051 c 2.995132,0 5.705501,1.203885 7.681205,3.154245 l -2.386853,2.382605 0.135232,0.135376 2.386853,-2.382606 c 1.930016,1.972963 3.12387,4.674054 3.12387,7.655475 0,2.981421 -1.193854,5.680844 -3.12387,7.655474 l -2.386853,-2.382605 -0.135232,0.135375 2.386853,2.382606 c -1.975664,1.951759 -4.686314,3.161013 -7.681205,3.161013 -1.94179,0 -3.766282,-0.506879 -5.347316,-1.395323 -0.850442,-0.477894 -1.630441,-1.06619 -2.320365,-1.745384 l 2.407138,-2.402912 c 1.358381,1.325983 3.214811,2.145699 5.260543,2.145699 4.163407,0 7.545972,-3.385283 7.545972,-7.553943 0,-4.168661 -3.382565,-7.547175 -7.545972,-7.547175 -2.045732,0 -3.902162,0.81461 -5.260543,2.13893 l -2.407138,-2.402912 c 1.972594,-1.940536 4.681097,-3.133938 7.667681,-3.133938 z m -0.189325,0.182756 v 3.01887 h 0.378651 v -3.01887 z m -7.606826,3.086558 2.400376,2.402912 C 37.721509,56.11715 36.90502,57.97796 36.90502,60.0297 c 0,2.05174 0.816489,3.910884 2.143435,5.272869 l -2.400376,2.402912 c -0.435151,-0.44326 -0.832923,-0.923297 -1.188195,-1.435068 -0.462681,-0.666492 -0.853281,-1.386809 -1.160484,-2.149815 -0.508689,-1.263436 -0.788715,-2.64392 -0.788715,-4.090898 0,-2.99182 1.197141,-5.70104 3.137394,-7.675781 z m 7.796151,0.507657 c 3.959106,0 7.167321,3.203889 7.167321,7.168124 0,3.964234 -3.208215,7.174892 -7.167321,7.174892 -3.959106,0 -7.160559,-3.210658 -7.160559,-7.174892 0,-3.964235 3.201453,-7.168124 7.160559,-7.168124 z m -10.744219,6.978598 v 0.379051 h 3.022445 v -0.379051 z m 18.513325,0 v 0.379051 h 3.029207 v -0.379051 z m -7.931385,7.932994 v 3.01887 h 0.37189 v -3.01887 z\"><title>").h("i18n", ctx, {}, { "$key": "threed.tilt.drag" }).w("</title></path></g></g><g id=\"rotateLayer\"inkscape:groupmode=\"layer\"inkscape:label=\"rotateLayer\"style=\"display:inline\"transform=\"translate(-2.3693123,-42.387899)\"><path class=\"tc-ctl-threed-cm-rotate-right\"sodipodi:nodetypes=\"cccccccc\"inkscape:connector-curvature=\"0\"id=\"right\"d=\"m 53.241331,72.907368 0.900176,1.930847 c 3.602027,-1.827343 6.291427,-4.493353 8.092762,-8.066897 l 0.969844,0.452626 -0.663464,-4.788009 -3.222445,2.974451 0.983506,0.459005 c -1.447339,3.107391 -3.949649,5.598011 -7.060379,7.037977 z\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.right" }).w("</title></path><path class=\"tc-ctl-threed-cm-rotate-left\"sodipodi:nodetypes=\"cccccccc\"inkscape:connector-curvature=\"0\"id=\"left\"d=\"m 42.795431,72.906221 -0.900176,1.930846 c -3.602027,-1.827342 -6.291427,-4.493352 -8.092762,-8.066896 l -0.969844,0.452626 0.663465,-4.788009 3.222444,2.974451 -0.983506,0.459005 c 1.44734,3.107391 3.949649,5.598011 7.060379,7.037977 z\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.left" }).w("</title></path><path class=\"tc-ctl-threed-cm-tilt-up\"sodipodi:nodetypes=\"cccccccc\"inkscape:connector-curvature=\"0\"id=\"up\"d=\"M 7.737296,54.610066 5.80645,53.70989 c 1.827342,-3.602027 4.493352,-6.291427 8.066896,-8.092762 l -0.452626,-0.969844 4.788009,0.663465 -2.974451,3.222444 -0.459005,-0.983506 c -3.107391,1.44734 -5.598011,3.949649 -7.037977,7.060379 z\"><title>").h("i18n", ctx, {}, { "$key": "threed.tilt.left" }).w("</title></path><path class=\"tc-ctl-threed-cm-tilt-down\"sodipodi:nodetypes=\"cccccccc\"inkscape:connector-curvature=\"0\"id=\"down\"d=\"m 7.684579,65.708846 -1.930847,0.900176 c 1.827343,3.602027 4.493353,6.291427 8.066897,8.092762 l -0.452626,0.969844 4.788009,-0.663464 -2.974451,-3.222445 -0.459005,0.983506 C 11.615165,71.321886 9.124545,68.819576 7.684579,65.708846 Z\"><title>").h("i18n", ctx, {}, { "$key": "threed.tilt.right" }).w("</title></path><g class=\"tc-ctl-threed-cm-rotate-indicator\"><path class=\"tc-ctl-threed-cm-rotate-inner\"inkscape:connector-curvature=\"0\"d=\"m 48.010487,52.995444 c 3.959106,0 7.167321,3.203889 7.167321,7.168124 0,3.964234 -3.208215,7.174892 -7.167321,7.174892 -3.959106,0 -7.160559,-3.210658 -7.160559,-7.174892 0,-3.964235 3.201453,-7.168124 7.160559,-7.168124 z\"id=\"rotateInner\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.reset" }).w("</title></path><path class=\"tc-ctl-threed-cm-rotate-inner-image\"d=\"m 45.461645,60.604061 c 0.860585,-1.857231 1.777009,-3.864779 2.036499,-4.461218 0.471802,-1.084433 0.471802,-1.084433 0.66474,-0.667935 2.070474,4.46957 3.86201,8.443545 3.825603,8.485934 -0.02561,0.02982 -0.943964,-0.165127 -2.040793,-0.433206 -1.994234,-0.487419 -1.994234,-0.487419 -3.881098,-0.01711 -1.037775,0.258673 -1.950491,0.470314 -2.028258,0.470314 -0.07777,0 0.562721,-1.519553 1.423307,-3.376784 z m 1.23418,2.027617 c 1.353421,-0.310159 1.353421,-0.310159 1.353421,-2.998288 0,-1.534227 -0.05572,-2.627602 -0.129797,-2.547123 -0.101525,0.110295 -2.316061,4.831583 -2.659547,5.670031 -0.09645,0.23543 -0.15884,0.240844 1.435923,-0.12462 z\"id=\"rotateImage\"inkscape:connector-curvature=\"0\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.reset" }).w("</title></path><path class=\"tc-ctl-threed-cm-rotate-outer tc-ctl-threed-cm-rotate-outer-circle\"inkscape:connector-curvature=\"0\"d=\"m 48.010487,48.839422 c -6.246102,0 -11.312196,5.070128 -11.312196,11.324146 0,6.254017 5.066094,11.330914 11.312196,11.330914 6.246102,0 11.312196,-5.076897 11.312196,-11.330914 0,-6.254018 -5.066094,-11.324146 -11.312196,-11.324146 z m 0,4.156022 c 3.959106,0 7.167321,3.203889 7.167321,7.168124 0,3.964234 -3.208215,7.174892 -7.167321,7.174892 -3.959106,0 -7.160559,-3.210658 -7.160559,-7.174892 0,-3.964235 3.201453,-7.168124 7.160559,-7.168124 z\"id=\"rotateOuter\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.drag" }).w("</title></path><path class=\"tc-ctl-threed-cm-rotate-outer tc-ctl-threed-cm-rotate-outer-shell-circle\"d=\"m 48.010487,48.839422 c -6.246102,0 -11.312196,5.070128 -11.312196,11.324146 0,6.254017 5.066094,11.330914 11.312196,11.330914 6.246102,0 11.312196,-5.076897 11.312196,-11.330914 0,-6.254018 -5.066094,-11.324146 -11.312196,-11.324146 z m 0,0.379051 c 2.995132,0 5.705501,1.203885 7.681205,3.154245 l -2.386853,2.382605 0.135232,0.135376 2.386853,-2.382606 c 1.930016,1.972963 3.12387,4.674054 3.12387,7.655475 0,2.981421 -1.193854,5.680844 -3.12387,7.655474 l -2.386853,-2.382605 -0.135232,0.135375 2.386853,2.382606 c -1.975664,1.951759 -4.686314,3.161013 -7.681205,3.161013 -1.94179,0 -3.766282,-0.506879 -5.347316,-1.395323 -0.850442,-0.477894 -1.630441,-1.06619 -2.320365,-1.745384 l 2.407138,-2.402912 c 1.358381,1.325983 3.214811,2.145699 5.260543,2.145699 4.163407,0 7.545972,-3.385283 7.545972,-7.553943 0,-4.168661 -3.382565,-7.547175 -7.545972,-7.547175 -2.045732,0 -3.902162,0.81461 -5.260543,2.13893 l -2.407138,-2.402912 c 1.972594,-1.940536 4.681097,-3.133938 7.667681,-3.133938 z m -0.189325,0.182756 v 3.01887 h 0.378651 v -3.01887 z m -7.606826,3.086558 2.400376,2.402912 c -1.326946,1.360319 -2.143435,3.221129 -2.143435,5.272869 0,2.05174 0.816489,3.910884 2.143435,5.272869 l -2.400376,2.402912 c -0.435151,-0.44326 -0.832923,-0.923297 -1.188195,-1.435068 -0.462681,-0.666492 -0.853281,-1.386809 -1.160484,-2.149815 -0.508689,-1.263436 -0.788715,-2.64392 -0.788715,-4.090898 0,-2.99182 1.197141,-5.70104 3.137394,-7.675781 z m 7.796151,0.507657 c 3.959106,0 7.167321,3.203889 7.167321,7.168124 0,3.964234 -3.208215,7.174892 -7.167321,7.174892 -3.959106,0 -7.160559,-3.210658 -7.160559,-7.174892 0,-3.964235 3.201453,-7.168124 7.160559,-7.168124 z m -10.744219,6.978598 v 0.379051 h 3.022445 v -0.379051 z m 18.513325,0 v 0.379051 H 58.8088 v -0.379051 z m -7.931385,7.932994 v 3.01887 h 0.37189 v -3.01887 z\"id=\"rotateShell\"inkscape:connector-curvature=\"0\"sodipodi:nodetypes=\"ssssssccccsccccssccsssccscccccccsccssscsssssccccccccccccccc\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.drag" }).w("</title></path></g></g></svg></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-overlay'] = function () { dust.register(ctlProto.CLASS + '-overlay', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-threed-overlay\" hidden><svg class=\"tc-ctl-threed-overlay-svg\"><defs><filter id=\"fGaussian\" x=\"0\" y=\"0\"><feGaussianBlur in=\"SourceGraphic\" stdDeviation=\"3\" /></filter></defs><rect width=\"100%\" height=\"100%\" fill=\"white\" fill-opacity=\"0.5\" filter=\"url(#fGaussian)\" /> </svg> </div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<button class=\"tc-ctl-threed-btn tc-beta-button\" title=\"").h("i18n", ctx, {}, { "$key": "threed.tip" }).w("\"></button>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.viewer;
    ctlProto.mapView;
    ctlProto.terrainProvider;

    ctlProto.register = function (map) {
        var self = this;

        TC.Control.prototype.register.call(self, map);

        self.mapView = new MapView(map, self);
    };

    ctlProto.renderData = function (data, callback) {
        var self = this;

        TC.Control.prototype.renderData.call(self, data, function () {

            self.getRenderedHtml(self.CLASS + '-overlay', {}, function (html) {
                self.overlay = $(html);
            });

            self.$button = self._$div.find('.' + self.CLASS + '-btn');

            self.$button.on(TC.Consts.event.CLICK, function () {

                self.$button.attr('disabled', 'disabled');

                if (!self.waiting)
                    self.waiting = self.map.getLoadingIndicator().addWait();

                var ctls = [];
                for (var i = 0, len = self.threeDControls.length; i < len; i++) {
                    var ctl = self.threeDControls[i];
                    ctl = ctl.substr(0, 1).toUpperCase() + ctl.substr(1);
                    ctls = ctls.concat(self.map.getControlsByClass('TC.control.' + ctl));
                }

                self.ctrlsToMng = ctls;

                if (!self.mapIs3D) {

                    self.activate();

                    if (self.browserSupportWebGL.call(self) || !self.browserSupportWebGL.call(self)) {
                        self.mapIs3D = true;

                        self.overlay.removeAttr('hidden');
                        self.overlay.appendTo(self.map._$div.parent());

                        self.map._$div.addClass(TC.Consts.classes.THREED);

                        self.$divThreedMap = $('#' + self.selectors.divThreedMap);
                        self.$divThreedMap.addClass(self.classes.MAPTHREED);
                        self.$divThreedMap.addClass(self.classes.LOADING);

                        self.$button.attr('title', self.getLocaleString("threed.two.tip"));
                        self.$button.removeClass(self.classes.BETA);

                        self.map3D.loadViewer.call(self).then(function () {

                            self.$divThreedMap.removeClass("tc-ctl-threed-divMap-fadeOut").addClass("tc-ctl-threed-divMap-fadeIn");
                            $(self.mapView.viewHTML).removeClass("tc-ctl-threed-divMap-fadeIn").addClass("tc-ctl-threed-divMap-fadeOut");

                            self.$divThreedMap.removeClass(self.classes.LOADING);
                            self.$button.toggleClass(self.classes.BTNACTIVE);

                            if (self.options.allowedGFI) {

                                self.map3D.linked2DControls.featureInfo = new TwoDLinkedFeatureInfo(self);

                                var handler = new Cesium.ScreenSpaceEventHandler(self.viewer.canvas, false);
                                handler.setInputAction(function (movement) {
                                    var ray = self.viewer.camera.getPickRay(movement.position);
                                    var position = self.viewer.scene.globe.pick(ray, self.viewer.scene);
                                    if (position) {
                                        self.map3D.getInfoOnPickedPosition.call(self, position);
                                    }
                                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
                            }

                            // extent
                            self.map3D.setCameraFromMapView.call(self);

                            // mapa de fondo
                            self.map3D.setBaseLayer.call(self, self.map.baseLayer);

                            // capas de trabajo
                            self.map.workLayers.filter(function (elem) {
                                return elem instanceof TC.layer.Raster;
                            }).reverse().forEach(function (layer) {
                                self.map3D.addLayer.call(self, layer);
                            });

                            $.when(self.viewer.readyPromise).then(function () {

                                if (!self.cameraControls) self.cameraControls = new CameraControls(self);
                                else self.cameraControls.render.call(self.cameraControls);

                                var angle = Cesium.Math.toRadians(50);
                                var pickBP = pickBottomPoint(self.viewer.scene);
                                pickBP = Cesium.Matrix4.fromTranslation(pickBP);

                                var animationCallback = function () {

                                    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = self.map3D.initialRectangle = self.viewer.camera.computeViewRectangle();
                                    Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

                                    self.$button.removeAttr('disabled');

                                    self.overlay.attr('hidden', 'hidden');
                                    self.map.getLoadingIndicator().removeWait(self.waiting);
                                    delete self.waiting;

                                    self.$events.on(TC.Consts.event.TERRAINLOADED, function () {

                                        if (self.viewer.billboardCollection) {

                                            for (var i = 0; i < self.viewer.billboardCollection.length; i++) {

                                                var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(self.viewer.billboardCollection.get(i).position);
                                                var height = self.viewer.scene.globe.getHeight(cartographic);
                                                var finalCartographic = {
                                                    longitude: cartographic.longitude,
                                                    latitude: cartographic.latitude,
                                                    height: cartographic.height + height
                                                };

                                                self.viewer.billboardCollection.get(i).position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(finalCartographic);
                                            }

                                            self.map3D.customRender.restart();
                                        }
                                    });
                                };

                                self.map3D.rotateAroundAxis(self.viewer.scene.camera, -angle, self.viewer.scene.camera.right, pickBP, {
                                    duration: 2000,
                                    callback: animationCallback
                                });
                            }.bind(self));
                        });
                    }
                } else {

                    self.deactivate();

                    self.cameraControls.resetRotation({ duration: 1000 }).then(function () {

                        var animationCallback = function () {

                            self.mapIs3D = false;

                            self.map._$div.removeClass(TC.Consts.classes.THREED);

                            self.$button.attr('title', self.getLocaleString("threed.tip"));

                            self.map3D.destroy.call(self);

                            self.map3D.setViewFromCameraView.call(self).then(function () {
                                self.$divThreedMap.removeClass(self.classes.MAPTHREED);

                                self.$divThreedMap.removeClass("tc-ctl-threed-divMap-fadeIn").addClass("tc-ctl-threed-divMap-fadeOut");
                                $(self.mapView.viewHTML).removeClass("tc-ctl-threed-divMap-fadeOut").addClass("tc-ctl-threed-divMap-fadeIn");

                                self.viewer.destroy();
                                self.viewer = null;

                                self.$button.removeAttr('disabled');
                                self.$button.toggleClass(self.classes.BTNACTIVE);

                                self.map.getLoadingIndicator().removeWait(self.waiting);
                                delete self.waiting;
                            });

                            self.mapView.setRotation(0);
                            self._ovMap.wrap.draw3DCamera(null);
                        };

                        var bottom = pickBottomPoint(self.viewer.scene);
                        var transform = Cesium.Matrix4.fromTranslation(bottom);
                        var angle = computeAngleToZenith(self.viewer.scene, bottom);

                        self.map3D.rotateAroundAxis(self.viewer.scene.camera, -angle, self.viewer.scene.camera.right, transform, {
                            duration: 1500,
                            callback: animationCallback
                        });
                    });
                }
            });
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
        TC.Control.prototype.deactivate.call(self);
    };

    MapView = function (map, parent) {
        var self = this;
        self.map = map;
        self.parent = parent;

        $.when(self.map.getViewHTML()).then(function (html) {
            self.viewHTML = html;
        }.bind(self));

        self.proj4Obj = proj4(self.map.crs);
        self.proj4Obj.oProj.METERS_PER_UNIT = 1;

        self.maxResolution;

        //flacunza: modificamos TC.Map.setCenter para que se haga desde la vista 3D cuando está activa
        //así evitamos parpadeos en el mapa de situación
        self._oldMapSetCenter = map.setCenter;
        map.setCenter = function (coords, options) {
            if (parent.mapIs3D) {
                parent.map3D.flyToMapCoordinates.call(parent, coords);
            }
            else {
                self._oldMapSetCenter.call(map, coords, options);
            }
        };
    };
    MapView.prototype.getCenter = function () {
        return this.map.getCenter();
    };
    MapView.prototype.getExtent = function () {
        return this.map.getExtent();
    };
    MapView.prototype.getResolution = function () {
        return this.map.getResolution();
    };
    MapView.prototype.getRotation = function () {
        return this.map.getRotation();
    };
    MapView.prototype.getMaxResolution = function () {
        if (this.maxResolution)
            return this.maxResolution;

        if (this.map.getResolutions() !== null)
            this.maxResolution = this.map.getResolutions()[0];
        else {
            var extent = this.map.options.baselayerExtent;
            this.maxResolution = (extent[2] - extent[0]) / this.parent.Consts.DEFAULT_TILE_SIZE;
        }

        return this.maxResolution;
    };
    MapView.prototype.getPixelFromCoordinate = function (coords) {
        return this.map.getPixelFromCoordinate(coords);
    };
    MapView.prototype.setCenter = function (center) {
        this._oldMapSetCenter.call(this.map, center);
    };
    MapView.prototype.setExtent = function (extent) {
        this.map.setExtent(extent);
    };
    MapView.prototype.setResolution = function (resolution) {
        this.map.setResolution(resolution);
    };
    MapView.prototype.setRotation = function (rotation) {
        this.map.setRotation(rotation);
    };

    // Funciones para cálculo de FOV
    var getFarCoords = function (origin, nearPoint) {
        var radius = 1000000; // 1000 km
        var dx = nearPoint[0] - origin[0];
        var dy = nearPoint[1] - origin[1];
        var angle = Math.atan(dy / dx);
        // Math.atan solo da resultados entre -90º y 90º, si estamos mirando al hemisferio oeste hay que sumar 180º al ángulo
        if (dx < 0) {
            angle = angle + Math.PI;
        }
        return [origin[0] + radius * Math.cos(angle), origin[1] + radius * Math.sin(angle)];
    };

    var distanceSquared = function (p1, p2) {
        var dx = p2[0] - p1[0];
        var dy = p2[1] - p1[1];
        return dx * dx + dy * dy;
    };

    var getFarMapCoords = function (obj) {
        // Calculamos puntos lejanos cuando no los tenemos (cuando estamos mirando al horizonte).
        // Cogemos un punto proyectado desde la esquina inferior del canvas, 
        // cogemos un segundo punto en el lateral del canvas inmediatamente por encima 
        // y prologamos la línea que pasa por ambos puntos proyectados.
        var self = this;
        obj = obj || {};
        if (obj.nearMapCoords) {
            var nextPixel = obj.bottomPixel.clone();
            nextPixel.y = Math.round(nextPixel.y * 9 / 10);
            var nextCoords = pickMapCoords.call(self, nextPixel);
            if (nextCoords) {
                // Ordenamos la dupla por distancia, porque si estamos mirando desde dentro de un monte 
                // el punto que se supone que es el más lejano en realidad está más cerca.
                var coordsArray = [obj.nearMapCoords, nextCoords].sort(function (a, b) {
                    return distanceSquared(obj.cameraPosition, a) - distanceSquared(obj.cameraPosition, b);
                });
                return getFarCoords.apply(this, coordsArray);
            }
        }
        return null;
    };

    var pickMapCoords = function (pixel) {
        var self = this;
        var pickPoint = pickOnTerrainOrEllipsoid(self.viewer.scene, pixel);
        if (pickPoint) {
            pickPoint = Cesium.Cartographic.fromCartesian(pickPoint);
            return TC.Util.reproject([Cesium.Math.toDegrees(pickPoint.longitude), Cesium.Math.toDegrees(pickPoint.latitude)], self.map3D.crs, self.map.crs);
        }
        return null;
    }

    // Funciones utilidades cámara
    var calcDistanceForResolution = function (resolution, latitude) {
        var self = this;

        var fovy = self.viewer.camera.frustum.fovy;
        var metersPerUnit = self.mapView.proj4Obj.oProj.METERS_PER_UNIT;
        var visibleMapUnits = resolution * self.mapView.viewHTML.getBoundingClientRect().height;
        var relativeCircumference = Math.cos(Math.abs(latitude));
        var visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;

        return (visibleMeters / 2) / Math.tan(fovy / 2);
    };

    var calcResolutionForDistance = function (distance, latitude) {
        var self = this;

        var canvas = self.viewer.scene.canvas;
        var fovy = self.viewer.camera.frustum.fovy;
        var metersPerUnit = self.mapView.proj4Obj.oProj.METERS_PER_UNIT;

        var visibleMeters = 2 * distance * Math.tan(fovy / 2);
        var relativeCircumference = Math.cos(Math.abs(latitude));
        var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
        var resolution = visibleMapUnits / canvas.clientHeight;

        // validamos que la resolución calculada esté disponible en el array de resoluciones disponibles
        // si no contamos con un array de resoluciones lo calculamos
        var resolutions = self.map.getResolutions();
        if (resolutions == null) {
            resolutions = new Array(22);
            for (var i = 0, ii = resolutions.length; i < ii; ++i) {
                resolutions[i] = self.mapView.getMaxResolution() / Math.pow(2, i);
            }
        }

        // obtenemos la resolución más próxima a la calculada
        for (var i = 0; i < resolutions.length; i++) {
            if (resolutions[i] < Math.abs(resolution)) {
                resolution = resolutions[i - 1];
                break;
            } else if (resolutions[i] === Math.abs(resolution)) {
                resolution = resolutions[i];
                break;
            } else if (i === resolutions.length - 1) {
                resolution = resolutions[i];
            }
        }

        return resolution;
    };

    var rotateAroundAxis = function (camera, angle, axis, transform, opt_options) {
        var clamp = Cesium.Math.clamp;
        var defaultValue = Cesium.defaultValue;

        var options = opt_options || {};
        var duration = defaultValue(options.duration, 500); // ms

        var linear = function (a) {
            return a
        };
        var easing = defaultValue(options.easing, linear);
        var callback = options.callback;

        var start;
        var lastProgress = 0;
        var oldTransform = new Cesium.Matrix4();

        var done = new $.Deferred();

        function animation(timestamp) {
            if (!start)
                start = timestamp;

            var progress = easing(clamp((timestamp - start) / duration, 0, 1));

            camera.transform.clone(oldTransform);
            var stepAngle = (progress - lastProgress) * angle;
            lastProgress = progress;
            camera.lookAtTransform(transform);
            camera.rotate(axis, stepAngle);
            camera.lookAtTransform(oldTransform);

            if (progress < 1) {
                requestAnimationFrame(animation);
            } else {
                if (callback) {
                    callback();
                }
                done.resolve();
            }

        }

        requestAnimationFrame(animation);

        return done;
    };

    var pickOnTerrainOrEllipsoid = function (scene, pixel) {
        var self = this;

        var ray = scene.camera.getPickRay(pixel);
        var target = scene.globe.pick(ray, scene);
        return target || scene.camera.pickEllipsoid(pixel);
    };

    var pickCenterPoint = function (scene) {
        var self = this;

        var canvas = scene.canvas;
        var center = new Cesium.Cartesian2(
            canvas.clientWidth / 2,
            canvas.clientHeight / 2);
        return pickOnTerrainOrEllipsoid(scene, center);
    };

    var pickBottomPoint = function (scene) {
        var self = this;

        var canvas = scene.canvas;
        var bottom = new Cesium.Cartesian2(
            canvas.clientWidth / 2, canvas.clientHeight);
        return pickOnTerrainOrEllipsoid(scene, bottom);
    };

    var bottomFovRay = function (scene) {
        var self = this;

        var camera = scene.camera;
        var fovy2 = camera.frustum.fovy / 2;
        var direction = camera.direction;
        var rotation = Cesium.Quaternion.fromAxisAngle(camera.right, fovy2);
        var matrix = Cesium.Matrix3.fromQuaternion(rotation);
        var vector = new Cesium.Cartesian3();
        Cesium.Matrix3.multiplyByVector(matrix, direction, vector);
        return new Cesium.Ray(camera.position, vector);
    };

    var setHeadingUsingBottomCenter = function (scene, heading, bottomCenter, opt_options) {
        var self = this;

        var camera = scene.camera;
        // Compute the camera position to zenith quaternion
        var angleToZenith = computeAngleToZenith(scene, bottomCenter);
        var axis = camera.right;
        var quaternion = Cesium.Quaternion.fromAxisAngle(axis, angleToZenith);
        var rotation = Cesium.Matrix3.fromQuaternion(quaternion);

        // Get the zenith point from the rotation of the position vector
        var vector = new Cesium.Cartesian3();
        Cesium.Cartesian3.subtract(camera.position, bottomCenter, vector);
        var zenith = new Cesium.Cartesian3();
        Cesium.Matrix3.multiplyByVector(rotation, vector, zenith);
        Cesium.Cartesian3.add(zenith, bottomCenter, zenith);

        // Actually rotate around the zenith normal
        var transform = Cesium.Matrix4.fromTranslation(zenith);
        rotateAroundAxis(camera, heading, zenith, transform, opt_options);
    };

    var signedAngleBetween = function (first, second, normal) {
        var self = this;

        // We are using the dot for the angle.
        // Then the cross and the dot for the sign.
        var a = new Cesium.Cartesian3();
        var b = new Cesium.Cartesian3();
        var c = new Cesium.Cartesian3();
        Cesium.Cartesian3.normalize(first, a);
        Cesium.Cartesian3.normalize(second, b);
        Cesium.Cartesian3.cross(a, b, c);

        var cosine = Cesium.Cartesian3.dot(a, b);
        var sine = Cesium.Cartesian3.magnitude(c);

        // Sign of the vector product and the orientation normal
        var sign = Cesium.Cartesian3.dot(normal, c);
        var angle = Math.atan2(sine, cosine);
        return sign >= 0 ? angle : -angle;
    };

    var computeAngleToZenith = function (scene, pivot) {
        var self = this;

        // This angle is the sum of the angles 'fy' and 'a', which are defined
        // using the pivot point and its surface normal.
        //        Zenith |    camera
        //           \   |   /
        //            \fy|  /
        //             \ |a/
        //              \|/pivot
        var camera = scene.camera;
        var fy = camera.frustum.fovy / 2;
        var ray = bottomFovRay(scene);
        var direction = Cesium.Cartesian3.clone(ray.direction);
        Cesium.Cartesian3.negate(direction, direction);

        var normal = new Cesium.Cartesian3();
        Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(pivot, normal);

        var left = new Cesium.Cartesian3();
        Cesium.Cartesian3.negate(camera.right, left);

        var a = signedAngleBetween(normal, direction, left);
        return a + fy;
    };

    var computeSignedTiltAngleOnGlobe = function (scene) {
        var self = this;

        var camera = scene.camera;
        var ray = new Cesium.Ray(camera.position, camera.direction);
        var target = scene.globe.pick(ray, scene);

        if (!target) {
            // no tiles in the area were loaded?
            var ellipsoid = Cesium.Ellipsoid.WGS84;
            var obj = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
            if (obj) {
                target = Cesium.Ray.getPoint(ray, obj.start);
            }
        }

        if (!target) {
            return undefined;
        }

        var normal = new Cesium.Cartesian3();
        Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(target, normal);

        var angleBetween = signedAngleBetween;
        var angle = angleBetween(camera.direction, normal, camera.right) - Math.PI;
        return Cesium.Math.convertLongitudeRange(angle);
    };

    CameraControls = function (parent) {
        var self = this;

        self.parent = parent;

        var outHandler = function (e) {
            var self = this;

            self.isFocusingCameraCtrls = false;
        };
        var inHandler = function () {
            var self = this;

            self.isFocusingCameraCtrls = true;
            self.lastFocused = performance.now();

            if (self.$div.hasClass(self.parent.classes.OUTFOCUS)) {
                self.$div.removeClass(self.parent.classes.OUTFOCUS);
                self.$tiltIndicatorOuterCircle.attr('class', self.$tiltIndicatorOuterCircle.attr('class').replace(self.parent.classes.OUTFOCUS, ''));
                self.$tiltIndicatorOuterShellCircle.attr('class', self.$tiltIndicatorOuterShellCircle.attr('class').replace(self.parent.classes.OUTFOCUS, ''));
                self.$rotateIndicatorOuterCircle.attr('class', self.$rotateIndicatorOuterCircle.attr('class').replace(self.parent.classes.OUTFOCUS, ''));
                self.$rotateIndicatorOuterShellCircle.attr('class', self.$rotateIndicatorOuterShellCircle.attr('class').replace(self.parent.classes.OUTFOCUS, ''));
            }
        };

        var moveStartHandler = function () {
            var self = this;
            self.moving = true;
        };
        var moveEndHandler = function () {
            var self = this;
            self.moving = false;
        };
        var postRenderHandler = function () {
            var self = this;
            var ctl = self.parent;

            if (self.parent.map3D.isLoadingTiles.call(self.parent))
                self.customCollisionDetection();

            var camera = self.getCamera();
            var position = camera.positionCartographic;

            if (self.moving) {

                cssRotate(self.$tiltIndicator, camera.pitch);
                cssRotate(self.$rotateIndicator, -camera.heading);

                self.disableTilt(5);

                self._coordsXY = TC.Util.reproject([Cesium.Math.toDegrees(position.longitude), Cesium.Math.toDegrees(position.latitude)], ctl.map3D.crs, ctl.map.crs);
                ctl.mapView.setCenter(self._coordsXY);
                ctl.mapView.setResolution(calcResolutionForDistance.call(ctl, position.height, position.latitude));
                //ctl.mapView.setRotation(-camera.heading);
            }

            // flacunza: calculamos el polígono de FOV para dibujar en el mapa de situación
            // Lo calculamos aunque no nos estemos moviendo porque el terreno puede estar cargándose
            if (self._coordsXY) {
                ctl._ovMap = ctl._ovMap || ctl.map.getControlsByClass('TC.control.OverviewMap')[0];
                if (ctl._ovMap) {
                    var scene = ctl.viewer.scene;
                    var canvas = scene.canvas;
                    var bottomLeft = new Cesium.Cartesian2(0, canvas.clientHeight - 1);
                    var bottomRight = new Cesium.Cartesian2(canvas.clientWidth - 1, canvas.clientHeight - 1);
                    var fovCoords = [
                        bottomLeft,
                        bottomRight,
                        new Cesium.Cartesian2(canvas.clientWidth - 1, 0),
                        new Cesium.Cartesian2(0, 0)
                    ].map(function (elm) {
                        return pickMapCoords.call(ctl, elm);
                    }).filter(function (elm) {
                        return elm !== null;
                    });
                    if (fovCoords.length && fovCoords.length < 4) { // Vemos horizonte
                        // flacunza: Si vemos horizonte no tenemos puntos de terreno para las esquinas superiores, 
                        // por eso intentamos calcular unos puntos "en el infinito".
                        var farCoordsLeft = getFarMapCoords.call(ctl, {
                            nearMapCoords: fovCoords[0],
                            bottomPixel: bottomLeft,
                            cameraPosition: self._coordsXY
                        });
                        var farCoordsRight = getFarMapCoords.call(ctl, {
                            nearMapCoords: fovCoords[1],
                            bottomPixel: bottomRight,
                            cameraPosition: self._coordsXY
                        });
                        if (farCoordsLeft && farCoordsRight) {
                            fovCoords[2] = farCoordsRight;
                            fovCoords[3] = farCoordsLeft;
                        }

                    }
                    ctl._ovMap.wrap.draw3DCamera({ position: self._coordsXY, heading: camera.heading, fov: fovCoords });
                }
            }

        };
        var cssRotate = function (element, angle) {
            var coord = $(element)[0].getBBox();
            value = 'rotate(' + Cesium.Math.toDegrees(angle) + ' ' + (coord.x + (coord.width / 2)) + ' ' + (coord.y + (coord.height / 2)) + ')';
            document.getElementsByClassName(element[0].className.baseVal)[0].setAttribute('transform', value);
        };

        self.outControlsEvents = TC.Util.detectMouse() ? 'mouseleave' : 'touchleave, touchend';
        self.outControls = outHandler.bind(self);

        self.inControlsEvents = TC.Util.detectMouse() ? 'mouseenter' : 'touchmove, touchstart';
        self.inControls = inHandler.bind(self);

        self.moveStart = moveStartHandler.bind(self);
        self.moveEnd = moveEndHandler.bind(self);
        self.postRender = postRenderHandler.bind(self);

        self.selectors = {
            tilt: '-cm-tilt',
            rotate: '-cm-rotate',
            indicator: '-indicator',
            leftArrow: '-left',
            rightArrow: '-right',
            downArrow: '-down',
            upArrow: '-up'
        };

        self.render();
    };
    CameraControls.prototype.bind = function () {
        var self = this;

        // conexión de los controles con el visor de cesium
        self.getCamera().moveStart.addEventListener(self.moveStart);
        self.getCamera().moveEnd.addEventListener(self.moveEnd);
        self.parent.viewer.scene.postRender.addEventListener(self.postRender);

        // gestionamos la opacidad de los controles pasados 5 segundos
        self.$div.on(self.outControlsEvents, self.outControls);
        self.$div.on(self.inControlsEvents, self.inControls);

        function setOpacity() {
            if (!self.lastFocused)
                self.lastFocused = performance.now();

            var progress = performance.now() - self.lastFocused;
            if (progress > 5000 && self.isFocusingCameraCtrls !== true) {
                if (!self.$div.hasClass(self.parent.classes.OUTFOCUS)) {
                    self.$div.addClass(self.parent.classes.OUTFOCUS);
                    self.$tiltIndicatorOuterCircle.attr('class', self.$tiltIndicatorOuterCircle.attr('class') + ' ' + self.parent.classes.OUTFOCUS);
                    self.$tiltIndicatorOuterShellCircle.attr('class', self.$tiltIndicatorOuterShellCircle.attr('class') + ' ' + self.parent.classes.OUTFOCUS);
                    self.$rotateIndicatorOuterCircle.attr('class', self.$rotateIndicatorOuterCircle.attr('class') + ' ' + self.parent.classes.OUTFOCUS);
                    self.$rotateIndicatorOuterShellCircle.attr('class', self.$rotateIndicatorOuterShellCircle.attr('class') + ' ' + self.parent.classes.OUTFOCUS);
                }
            }

            self.rAFInOutControls = requestAnimationFrame(setOpacity);
        }
        self.rAFInOutControls = requestAnimationFrame(setOpacity);
    };
    CameraControls.prototype.unbind = function () {
        var self = this;

        self.$div.addClass(TC.Consts.classes.HIDDEN);

        // conexión de los controles con el visor de cesium
        self.getCamera().moveStart.removeEventListener(self.moveStart);
        self.getCamera().moveEnd.removeEventListener(self.moveEnd);
        self.parent.viewer.scene.postRender.removeEventListener(self.postRender);

        // gestionamos la opacidad de los controles pasados 5 segundos
        self.$div.off(self.outControlsEvents, self.outControls);
        self.$div.off(self.inControlsEvents, self.inControls);
        window.cancelAnimationFrame(self.rAFInOutControls);
        self.lastFocused = undefined;
        self.rAFInOutControls = undefined;
    };
    CameraControls.prototype.getCamera = function () {
        var self = this;

        return self.parent.viewer.scene.camera;
    };
    CameraControls.prototype.render = function () {
        var self = this;

        if (self.$div) {
            self.$div.removeClass(TC.Consts.classes.HIDDEN);
            self.bind();
        }
        else {
            self.parent.getRenderedHtml(self.parent.CLASS + '-cm-ctls', {}, function (html) {
                // contenedor controles
                self.$div = $('<div class="' + self.parent.CLASS + '-cm-ctls' + '"></div>');
                self.$div.appendTo(self.parent.map._$div);
                $(html).appendTo(self.$div);


                // tilt
                var tiltSelector = '.' + self.parent.CLASS + self.selectors.tilt;

                self.$tiltIndicatorInner = self.$div.find("[class^=" + tiltSelector.replace('.', '') + "-inner" + "]");
                self.$tiltIndicatorInner.on(TC.Consts.event.CLICK, self.resetTilt.bind(self));

                self.$tiltIndicator = self.$div.find(tiltSelector + '-indicator');

                self.$tiltIndicatorOuterCircle = self.$div.find(tiltSelector + '-outer-circle');
                self.$tiltIndicatorOuterShellCircle = self.$div.find(tiltSelector + '-outer-shell-circle');

                self.$tiltIndicatorCircle = self.$div.find("[class^=" + tiltSelector.replace('.', '') + "-outer" + "]");
                self.$tiltIndicatorCircle.on('mousedown', function (e) {
                    var self = this;

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    var vectorScratch = new Cesium.Cartesian2();
                    var element = e.currentTarget;
                    var rectangle = e.currentTarget.getBoundingClientRect();
                    var center = new Cesium.Cartesian2((rectangle.right - rectangle.left) / 2.0, (rectangle.bottom - rectangle.top) / 2.0);
                    var clickLocation = new Cesium.Cartesian2(e.clientX - rectangle.left, e.clientY - rectangle.top);
                    var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);

                    self.draggingTilt.call(self, element, vector);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // left
                self.$tiltUp = self.$div.find(tiltSelector + self.selectors.upArrow);
                self.$tiltUp.on(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {

                    if ($(e.target).attr('disabled') !== undefined) {
                        if (e.stopPropagation) e.stopPropagation();
                        if (e.preventDefault) e.preventDefault();

                        e.cancelBubble = true;
                        e.returnValue = false;
                        return false;
                    }

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = TC.Util.detectMouse() ? 'mouseup' : 'touchend';

                    document.removeEventListener(upEvent, self.tiltUpMouseUpFunction, false);
                    self.tiltUpMouseUpFunction = undefined;

                    self.tilt.call(self, +5);

                    self.tiltUpInterval = setInterval(function () {
                        if (!self.isTiltUpDisabled) self.tilt.call(self, +5);
                        else self.tiltUpMouseUpFunction();
                    }.bind(self), 101);

                    self.tiltUpMouseUpFunction = function () {
                        clearInterval(self.tiltUpInterval);
                        self.tiltUpInterval = undefined;

                        document.removeEventListener(upEvent, self.tiltUpMouseUpFunction, false);
                        self.tiltUpMouseUpFunction = undefined;
                    };

                    document.addEventListener(upEvent, self.tiltUpMouseUpFunction, false);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // right
                self.$tiltDown = self.$div.find(tiltSelector + self.selectors.downArrow);
                self.$tiltDown.on(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {


                    if ($(e.target).attr('disabled') !== undefined) {
                        if (e.stopPropagation) e.stopPropagation();
                        if (e.preventDefault) e.preventDefault();

                        e.cancelBubble = true;
                        e.returnValue = false;
                        return false;
                    }

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = TC.Util.detectMouse() ? 'mouseup' : 'touchend';

                    document.removeEventListener(upEvent, self.tiltDownMouseUpFunction, false);
                    self.tiltDownMouseUpFunction = undefined;

                    self.tilt.call(self, -5);

                    self.tiltDownInterval = setInterval(function () {
                        if (!self.isTiltDownDisabled) self.tilt.call(self, -5);
                        else self.tiltDownMouseUpFunction();
                    }.bind(self), 101);

                    self.tiltDownMouseUpFunction = function () {
                        clearInterval(self.tiltDownInterval);
                        self.tiltDownInterval = undefined;

                        document.removeEventListener(upEvent, self.tiltDownMouseUpFunction, false);
                        self.tiltDownMouseUpFunction = undefined;
                    };

                    document.addEventListener(upEvent, self.tiltDownMouseUpFunction, false);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // rotation
                var rotateSelector = '.' + self.parent.CLASS + self.selectors.rotate;

                self.$rotateIndicatorInner = self.$div.find("[class^=" + rotateSelector.replace('.', '') + "-inner" + "]");
                self.$rotateIndicatorInner.on(TC.Consts.event.CLICK, self.resetRotation.bind(self));

                self.$rotateIndicator = self.$div.find(rotateSelector + '-indicator');

                self.$rotateIndicatorOuterCircle = self.$div.find(rotateSelector + '-outer-circle');
                self.$rotateIndicatorOuterShellCircle = self.$div.find(rotateSelector + '-outer-shell-circle');

                self.$rotateIndicatorCircle = self.$div.find("[class^=" + rotateSelector.replace('.', '') + "-outer" + "]");
                self.$rotateIndicatorCircle.on('mousedown', function (e) {
                    var self = this;

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    var vectorScratch = new Cesium.Cartesian2();
                    var element = e.currentTarget;
                    var rectangle = e.currentTarget.getBoundingClientRect();
                    var center = new Cesium.Cartesian2((rectangle.right - rectangle.left) / 2.0, (rectangle.bottom - rectangle.top) / 2.0);
                    var clickLocation = new Cesium.Cartesian2(e.clientX - rectangle.left, e.clientY - rectangle.top);
                    var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);

                    self.draggingRotate.call(self, element, vector);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }.bind(self));

                // left
                self.$rotateLeft = self.$div.find(rotateSelector + self.selectors.leftArrow);
                self.$rotateLeft.on(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = TC.Util.detectMouse() ? 'mouseup' : 'touchend';

                    document.removeEventListener(upEvent, self.rotateLeftMouseUpFunction, false);
                    self.rotateLeftMouseUpFunction = undefined;

                    self.rotate.call(self, -15);

                    self.rotateLeftInterval = setInterval(function () {
                        self.rotate.call(self, -15);
                    }.bind(self), 101);

                    self.rotateLeftMouseUpFunction = function () {
                        clearInterval(self.rotateLeftInterval);
                        self.rotateLeftInterval = undefined;

                        document.removeEventListener(upEvent, self.rotateLeftMouseUpFunction, false);
                        self.rotateLeftMouseUpFunction = undefined;
                    };

                    document.addEventListener(upEvent, self.rotateLeftMouseUpFunction, false);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;

                }.bind(self));

                self.$rotateRight = self.$div.find(rotateSelector + self.selectors.rightArrow);
                self.$rotateRight.on(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function (e) {

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    self.inControls(e);

                    var upEvent = TC.Util.detectMouse() ? 'mouseup' : 'touchend';

                    document.removeEventListener(upEvent, self.rotateRightMouseUpFunction, false);
                    self.rotateRightMouseUpFunction = undefined;

                    self.rotate.call(self, +15);

                    self.rotateRightInterval = setInterval(function () {
                        self.rotate.call(self, +15);
                    }.bind(self), 101);

                    self.rotateRightMouseUpFunction = function () {
                        clearInterval(self.rotateRightInterval);
                        self.rotateRightInterval = undefined;

                        document.removeEventListener(upEvent, self.rotateRightMouseUpFunction, false);
                        self.rotateRightMouseUpFunction = undefined;
                    };

                    document.addEventListener(upEvent, self.rotateRightMouseUpFunction, false);

                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;

                }.bind(self));

                self.bind();

            }.bind(this));
        }
    };
    CameraControls.prototype.disableTilt = function (angle) {
        var self = this;

        var _angle = Cesium.Math.toRadians(Math.abs(angle));

        if (pickBottomPoint(self.parent.viewer.scene) == undefined)
            self.isTiltUpDisabled = true;
        else self.isTiltUpDisabled = self.getCamera().pitch + _angle >= Cesium.Math.PI_OVER_TWO;

        self.isTiltDownDisabled = self.getCamera().pitch - _angle <= -Cesium.Math.PI_OVER_TWO;

        // left
        self.$tiltUp.attr('disabled', self.isTiltUpDisabled);
        if (self.isTiltUpDisabled) {
            if (self.$tiltUp.attr('class').indexOf(self.parent.classes.CAMERACTRARROWDISABLED) == -1) {
                self.$tiltUp.attr('class', self.$tiltUp.attr('class') + ' ' + self.parent.classes.CAMERACTRARROWDISABLED);
            }
        }
        else {
            self.$tiltUp.attr('class', self.$tiltUp.attr('class').replace(' ' + self.parent.classes.CAMERACTRARROWDISABLED, ''));
        }


        // right
        self.$tiltDown.attr('disabled', self.isTiltDownDisabled);
        if (self.isTiltDownDisabled) {
            if (self.$tiltDown.attr('class').indexOf(self.parent.classes.CAMERACTRARROWDISABLED) == -1) {
                self.$tiltDown.attr('class', self.$tiltDown.attr('class') + ' ' + self.parent.classes.CAMERACTRARROWDISABLED);
            }
        }
        else {
            self.$tiltDown.attr('class', self.$tiltDown.attr('class').replace(' ' + self.parent.classes.CAMERACTRARROWDISABLED, ''));
        }

    };
    CameraControls.prototype.tilt = function (angle) {
        var self = this;

        self.disableTilt(angle);

        if (pickCenterPoint(self.parent.viewer.scene) == undefined) {
            if (angle > 0) self.getCamera().lookUp();
            else self.getCamera().lookDown();
        }

        if ((angle >= Cesium.Math.PI_OVER_TWO && self.isTiltUpDisabled) ||
            (angle <= -Cesium.Math.PI_OVER_TWO && self.isTiltDownDisabled)) {
            return;
        }

        var _angle = Cesium.Math.toRadians(angle);
        var pivot = pickCenterPoint(self.parent.viewer.scene);
        if (pivot) {
            var transform = Cesium.Matrix4.fromTranslation(pivot);
            self.parent.map3D.rotateAroundAxis(self.getCamera(), -_angle, self.getCamera().right, transform, { duration: 100 });
        }
    };
    CameraControls.prototype.rotate = function (angle) {
        var self = this;

        angle = Cesium.Math.toRadians(angle);
        var bottom = pickBottomPoint(self.parent.viewer.scene);
        if (bottom) {
            setHeadingUsingBottomCenter(self.parent.viewer.scene, angle, bottom, { duration: 100 });
        }
    };
    CameraControls.prototype.draggingTilt = function (tiltElement, cursorVector) {
        var self = this;

        self.$tiltIndicatorOuterCircle.attr('class', self.$tiltIndicatorOuterCircle.attr('class') + ' ' + self.parent.classes.HIGHLIGHTED);

        var oldTransformScratch = new Cesium.Matrix4();
        var newTransformScratch = new Cesium.Matrix4();
        var vectorScratch = new Cesium.Cartesian2();

        document.removeEventListener('mousemove', self.tiltMouseMoveFunction, false);
        document.removeEventListener('mouseup', self.tiltMouseUpFunction, false);

        if (self.tiltTickFunction) {
            self.parent.viewer.clock.onTick.removeEventListener(self.tiltTickFunction);
        }

        self.tiltMouseMoveFunction = undefined;
        self.tiltMouseUpFunction = undefined;
        self.tiltTickFunction = undefined;

        self.isTilting = true;
        self.tiltLastTimestamp = performance.now();

        var scene = self.parent.viewer.scene;
        var camera = scene.camera;

        var pivot = pickCenterPoint(scene);
        if (!pivot) {
            self.tiltFrame = Cesium.Transforms.eastNorthUpToFixedFrame(camera.positionWC, Cesium.Ellipsoid.WGS84, newTransformScratch);
            self.tiltIsLook = true;
        } else {
            self.tiltFrame = Cesium.Transforms.eastNorthUpToFixedFrame(pivot, Cesium.Ellipsoid.WGS84, newTransformScratch);
            self.tiltIsLook = false;
        }

        var angle = Math.atan2(-cursorVector.y, cursorVector.x);
        self.tiltInitialCursorAngle = Cesium.Math.zeroToTwoPi(angle - Cesium.Math.PI_OVER_TWO);
        self.tiltInitialCameraAngle = Math.atan2(camera.position.y, camera.position.x);

        self.tiltTickFunction = function (e) {
            var self = this;

            var timestamp = performance.now();
            var deltaT = timestamp - self.tiltLastTimestamp;

            var pivot = pickCenterPoint(scene);
            if (pivot && !self.tiltLastPivot)
                self.tiltLastPivot = pivot;

            if (!pivot && self.tiltLastPivot) {
                pivot = self.tiltLastPivot;
            } else if (!self.tiltLastPivot) {
                return;
            }

            var angle = self.tiltCursorAngle + Cesium.Math.PI_OVER_TWO;
            var angleDifference = angle - self.tiltInitialCursorAngle;

            scene = self.parent.viewer.scene;
            camera = scene.camera;

            var oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
            camera.lookAtTransform(self.tiltFrame);

            var newCameraAngle = Cesium.Math.zeroToTwoPi(self.tiltInitialCameraAngle - angleDifference);
            var currentCameraAngle = Math.atan2(camera.position.y, camera.position.x);

            var y = Math.sin(newCameraAngle - currentCameraAngle) * 0.02;

            if (self.tiltIsLook) {
                camera.look(camera.right, -y);
            } else {
                camera.rotateUp(y);
            }

            camera.lookAtTransform(oldTransform);

            self.tiltLastTimestamp = timestamp;
        }.bind(self);

        self.tiltMouseMoveFunction = function (e) {
            var self = this;
            var tiltRectangle = tiltElement.getBoundingClientRect();
            center = new Cesium.Cartesian2((tiltRectangle.right - tiltRectangle.left) / 2.0, (tiltRectangle.bottom - tiltRectangle.top) / 2.0);
            var clickLocation = new Cesium.Cartesian2(e.clientX - tiltRectangle.left, e.clientY - tiltRectangle.top);
            var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);

            var angle = Math.atan2(-vector.y, vector.x);
            self.tiltCursorAngle = Cesium.Math.zeroToTwoPi(angle - Cesium.Math.PI_OVER_TWO);
        }.bind(self);

        self.tiltMouseUpFunction = function (e) {
            self.$tiltIndicatorOuterCircle.attr('class', self.$tiltIndicatorOuterCircle.attr('class').replace(self.parent.classes.HIGHLIGHTED, ''));

            self.isTilting = false;
            document.removeEventListener('mousemove', self.tiltMouseMoveFunction, false);
            document.removeEventListener('mouseup', self.tiltMouseUpFunction, false);

            if (self.tiltTickFunction !== undefined) {
                self.parent.viewer.clock.onTick.removeEventListener(self.tiltTickFunction);
            }

            self.tiltMouseMoveFunction = undefined;
            self.tiltMouseUpFunction = undefined;
            self.tiltTickFunction = undefined;
        };

        document.addEventListener('mousemove', self.tiltMouseMoveFunction, false);
        document.addEventListener('mouseup', self.tiltMouseUpFunction, false);
        self._unsubscribeFromClockTick = self.parent.viewer.clock.onTick.addEventListener(self.tiltTickFunction);

        var angle = Math.atan2(-cursorVector.y, cursorVector.x);
        self.tiltCursorAngle = Cesium.Math.zeroToTwoPi(angle - Cesium.Math.PI_OVER_TWO);
    };
    CameraControls.prototype.draggingRotate = function (rotateElement, cursorVector) {
        var self = this;

        self.$rotateIndicatorOuterCircle.attr('class', self.$rotateIndicatorOuterCircle.attr('class') + ' ' + self.parent.classes.HIGHLIGHTED);

        var oldTransformScratch = new Cesium.Matrix4();
        var newTransformScratch = new Cesium.Matrix4();
        var vectorScratch = new Cesium.Cartesian2();

        document.removeEventListener('mousemove', self.rotateMouseMoveFunction, false);
        document.removeEventListener('mouseup', self.rotateMouseUpFunction, false);

        self.rotateMouseMoveFunction = undefined;
        self.rotateMouseUpFunction = undefined;

        self.isRotating = true;
        self.rotateInitialCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

        var scene = self.parent.viewer.scene;
        var camera = scene.camera;

        var viewCenter = pickCenterPoint(self.parent.viewer.scene);
        if (viewCenter == null || viewCenter == undefined) {
            viewCenter = pickBottomPoint(self.parent.viewer.scene);
            if (viewCenter == null || viewCenter == undefined) {
                self.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(camera.positionWC, Cesium.Ellipsoid.WGS84, newTransformScratch);
                self.rotateIsLook = true;
            } else {
                self.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(viewCenter, Cesium.Ellipsoid.WGS84, newTransformScratch);
                self.rotateIsLook = false;
            }
        } else {
            self.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(viewCenter, Cesium.Ellipsoid.WGS84, newTransformScratch);
            self.rotateIsLook = false;
        }

        try {
            var oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
            camera.lookAtTransform(self.rotateFrame);
            self.rotateInitialCameraAngle = Math.atan2(camera.position.y, camera.position.x);
            self.rotateInitialCameraDistance = Cesium.Cartesian3.magnitude(new Cesium.Cartesian3(camera.position.x, camera.position.y, 0.0));
            camera.lookAtTransform(oldTransform);
        } catch (e) {
            self.rotateMouseUpFunction();
        }

        self.rotateMouseMoveFunction = function (e) {
            var rotateRectangle = rotateElement.getBoundingClientRect();
            var center = new Cesium.Cartesian2((rotateRectangle.right - rotateRectangle.left) / 2.0, (rotateRectangle.bottom - rotateRectangle.top) / 2.0);
            var clickLocation = new Cesium.Cartesian2(e.clientX - rotateRectangle.left, e.clientY - rotateRectangle.top);
            var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);
            var angle = Math.atan2(-vector.y, vector.x);

            var angleDifference = angle - self.rotateInitialCursorAngle;
            var newCameraAngle = Cesium.Math.zeroToTwoPi(self.rotateInitialCameraAngle - angleDifference);

            camera = self.parent.viewer.scene.camera;

            try {
                oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
                camera.lookAtTransform(self.rotateFrame);
                var currentCameraAngle = Math.atan2(camera.position.y, camera.position.x);
                camera.rotateRight(newCameraAngle - currentCameraAngle);
                camera.lookAtTransform(oldTransform);
            } catch (e) {
                self.rotateMouseUpFunction();
            }
        };

        self.rotateMouseUpFunction = function (e) {
            self.isRotating = false;

            self.$rotateIndicatorOuterCircle.attr('class', self.$rotateIndicatorOuterCircle.attr('class').replace(self.parent.classes.HIGHLIGHTED, ''));

            document.removeEventListener('mousemove', self.rotateMouseMoveFunction, false);
            document.removeEventListener('mouseup', self.rotateMouseUpFunction, false);

            self.rotateMouseMoveFunction = undefined;
            self.rotateMouseUpFunction = undefined;
        };

        document.addEventListener('mousemove', self.rotateMouseMoveFunction, false);
        document.addEventListener('mouseup', self.rotateMouseUpFunction, false);
    };
    CameraControls.prototype.resetTilt = function () {
        var self = this;
        // lo dejamos como al principio a 50 grados
        var angle = -self.getCamera().pitch - Cesium.Math.toRadians(50);
        self.tilt(Cesium.Math.toDegrees(angle));
    };
    CameraControls.prototype.resetRotation = function (options) {
        var self = this;
        var done = new $.Deferred();

        var currentRotation;
        currentRotation = -self.getCamera().heading;

        while (currentRotation < -Math.PI) {
            currentRotation += 2 * Math.PI;
        }
        while (currentRotation > Math.PI) {
            currentRotation -= 2 * Math.PI;
        }

        if (!options)
            done.resolve();
        else {
            options.callback = function () {
                done.resolve();
            };
        }

        var bottom = pickBottomPoint(self.parent.viewer.scene);
        if (bottom) {
            setHeadingUsingBottomCenter(self.parent.viewer.scene, currentRotation, bottom, options);
        }

        return done;
    };
    CameraControls.prototype.customCollisionDetection = function () {
        var self = this;

        var scratchAdjustHeightTransform = new Cesium.Matrix4();
        var scratchAdjustHeightCartographic = new Cesium.Cartographic();

        var scene = self.parent.viewer.scene;
        var camera = self.parent.viewer.scene.camera;

        var screenSpaceCameraController = scene.screenSpaceCameraController;
        var enableCollisionDetection = screenSpaceCameraController.enableCollisionDetection;
        var minimumCollisionTerrainHeight = screenSpaceCameraController.minimumCollisionTerrainHeight;
        var minimumZoomDistance = screenSpaceCameraController.minimumZoomDistance;
        var globe = scene.globe;

        var ellipsoid = globe.ellipsoid;
        var projection = scene.mapProjection;

        var transform;
        var mag;
        if (!Cesium.Matrix4.equals(camera.transform, Cesium.Matrix4.IDENTITY)) {
            transform = Cesium.Matrix4.clone(camera.transform, scratchAdjustHeightTransform);
            mag = Cesium.Cartesian3.magnitude(camera.position);
            camera._setTransform(Cesium.Matrix4.IDENTITY);
        }

        var cartographic = scratchAdjustHeightCartographic;
        ellipsoid.cartesianToCartographic(camera.position, cartographic);

        var heightUpdated = false;
        if (cartographic.height < minimumCollisionTerrainHeight) {
            var height = globe.getHeight(cartographic);
            if (height !== undefined && height !== null) {
                height += minimumZoomDistance;
                if (cartographic.height < height) {
                    cartographic.height = height;
                    ellipsoid.cartographicToCartesian(cartographic, camera.position);
                    heightUpdated = true;
                }
            }
        }

        if (transform !== undefined && transform !== null) {
            camera._setTransform(transform);
            if (heightUpdated) {
                Cesium.Cartesian3.normalize(camera.position, camera.position);
                Cesium.Cartesian3.negate(camera.position, camera.direction);
                Cesium.Cartesian3.multiplyByScalar(camera.position, Math.max(mag, minimumZoomDistance), camera.position);
                Cesium.Cartesian3.normalize(camera.direction, camera.direction);
                Cesium.Cartesian3.cross(camera.direction, camera.up, camera.right);
                Cesium.Cartesian3.cross(camera.right, camera.direction, camera.up);
            }
        }
    };
    CameraControls.prototype.limitCameraToInitExtent = function () {
        var self = this;

        var pos = self.viewer.camera.positionCartographic.clone();

        if (!(pos.longitude >= self.initExtent.west &&
            pos.longitude <= self.initExtent.east &&
            pos.latitude >= self.initExtent.south &&
            pos.latitude <= self.initExtent.north)) {
            // add a padding based on the camera height
            var maxHeight = self.viewer.scene.screenSpaceCameraController.maximumZoomDistance;
            var padding = pos.height * 0.05 / maxHeight;
            pos.longitude = Math.max(self.initExtent.west - padding, pos.longitude);
            pos.latitude = Math.max(self.initExtent.south - padding, pos.latitude);
            pos.longitude = Math.min(self.initExtent.east + padding, pos.longitude);
            pos.latitude = Math.min(self.initExtent.north + padding, pos.latitude);
            self.viewer.camera.setView({
                destination: Cesium.Ellipsoid.WGS84.cartographicToCartesian(pos),
                orientation: {
                    heading: self.viewer.camera.heading,
                    pitch: self.viewer.camera.pitch
                }
            });
        }

        // Set the minimumZoomDistance according to the camera height
        self.viewer.scene.screenSpaceCameraController.minimumZoomDistance = pos.height > 1800 ? 400 : 200;
    };

    // Apache v2 license
    // https://github.com/TerriaJS/terriajs/blob/
    // ebd382a8278a817fce316730d9e459bbb9b829e9/lib/Models/Cesium.js
    CustomRenderLoop = function (map2D, map3D, debug) {
        this.map2D = map2D;
        this.listentTo = [TC.Consts.event.LAYERADD, TC.Consts.event.LAYERORDER, TC.Consts.event.LAYERREMOVE, TC.Consts.event.LAYEROPACITY, TC.Consts.event.LAYERVISIBILITY, TC.Consts.event.ZOOM, TC.Consts.event.BASELAYERCHANGE, TC.Consts.event.FEATUREADD, TC.Consts.event.FEATUREREMOVE, TC.Consts.event.LAYERUPDATE, TC.Consts.event.TERRAINLOADED, TC.Consts.event.ZOOMTO].join(' ');
        this.map3D = map3D;

        this.scene_ = this.map3D.scene;
        this.verboseRendering = debug;
        this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);

        this.lastCameraViewMatrix_ = new Cesium.Matrix4();
        this.lastCameraMoveTime_ = 0;
        this.stoppedRendering = false;

        this._removeTileLoadProgressListener = this.scene_.globe.tileLoadProgressEvent.addEventListener(function (event) {
            if (event === 0) {
                this.tilesWaiting = false;
            }
            else {
                this.tilesWaiting = true;
            }
        }.bind(this));

        this._removePostRenderListener = this.scene_.postRender.addEventListener(this.postRender.bind(this));

        // Detect available wheel event
        this._wheelEvent = '';
        if ('onwheel' in this.scene_.canvas) {
            // spec event type
            this._wheelEvent = 'wheel';
        } else if (!!document['onmousewheel']) {
            // legacy event type
            this._wheelEvent = 'mousewheel';
        } else {
            // older Firefox
            this._wheelEvent = 'DOMMouseScroll';
        }

        this._originalLoadWithXhr = Cesium.loadWithXhr.load;
        this._originalScheduleTask = Cesium.TaskProcessor.prototype.scheduleTask;
        this._originalCameraSetView = Cesium.Camera.prototype.setView;
        this._originalCameraMove = Cesium.Camera.prototype.move;
        this._originalCameraRotate = Cesium.Camera.prototype.rotate;
        this._originalCameraLookAt = Cesium.Camera.prototype.lookAt;
        this._originalCameraFlyTo = Cesium.Camera.prototype.flyTo;

        this.enable();
    };
    CustomRenderLoop.prototype.repaintOn_ = function (key, capture) {
        var canvas = this.scene_.canvas;
        canvas.addEventListener(key, this._boundNotifyRepaintRequired, capture);
    };
    CustomRenderLoop.prototype.removeRepaintOn_ = function (key, capture) {
        var canvas = this.scene_.canvas;
        canvas.removeEventListener(key, this._boundNotifyRepaintRequired, capture);
    };
    CustomRenderLoop.prototype.enable = function () {
        this.repaintOn_('mousemove', false);
        this.repaintOn_('mousedown', false);
        this.repaintOn_('mouseup', false);
        this.repaintOn_('touchstart', false);
        this.repaintOn_('touchend', false);
        this.repaintOn_('touchmove', false);

        if (!!window['PointerEvent']) {
            this.repaintOn_('pointerdown', false);
            this.repaintOn_('pointerup', false);
            this.repaintOn_('pointermove', false);
        }

        this.repaintOn_(this._wheelEvent, false);


        window.addEventListener('resize', this._boundNotifyRepaintRequired, false);

        // Hacky way to force a repaint when an async load request completes
        var that = this;
        Cesium.loadWithXhr.load = function (url, responseType, method, data,
            headers, deferred, overrideMimeType, preferText, timeout) {
            deferred['promise']['always'](that._boundNotifyRepaintRequired);
            that._originalLoadWithXhr(url, responseType, method, data, headers,
                deferred, overrideMimeType, preferText, timeout);
        };

        // Hacky way to force a repaint when a web worker sends something back.
        Cesium.TaskProcessor.prototype.scheduleTask = function (parameters, transferableObjects) {
            var result = that._originalScheduleTask.call(this, parameters,
                transferableObjects);

            var taskProcessor = this;
            if (!taskProcessor._originalWorkerMessageSinkRepaint) {
                var worker = taskProcessor['_worker'];
                taskProcessor._originalWorkerMessageSinkRepaint = worker.onmessage;
                worker.onmessage = function (event) {
                    taskProcessor._originalWorkerMessageSinkRepaint(event);
                    that.notifyRepaintRequired();
                };
            }

            return result;
        };

        Cesium.Camera.prototype.setView = function () {
            that._originalCameraSetView.apply(this, arguments);
            that.notifyRepaintRequired();
        };
        Cesium.Camera.prototype.move = function () {
            that._originalCameraMove.apply(this, arguments);
            that.notifyRepaintRequired();
        };
        Cesium.Camera.prototype.rotate = function () {
            that._originalCameraRotate.apply(this, arguments);
            that.notifyRepaintRequired();
        };
        Cesium.Camera.prototype.lookAt = function () {
            that._originalCameraLookAt.apply(this, arguments);
            that.notifyRepaintRequired();
        };
        Cesium.Camera.prototype.flyTo = function () {
            that._originalCameraFlyTo.apply(this, arguments);
            that.notifyRepaintRequired();
        };

        // conectamos con los cambios del map 2d
        this.map2D.on(this.listentTo, this._boundNotifyRepaintRequired);
    };
    CustomRenderLoop.prototype.disable = function () {
        if (!!this._removePostRenderListener) {
            this._removePostRenderListener();
            this._removePostRenderListener = undefined;
        }

        if (!!this._removeTileLoadProgressListener) {
            this._removeTileLoadProgressListener();
            this._removeTileLoadProgressListener = undefined;
        }

        this.removeRepaintOn_('mousemove', false);
        this.removeRepaintOn_('mousedown', false);
        this.removeRepaintOn_('mouseup', false);
        this.removeRepaintOn_('touchstart', false);
        this.removeRepaintOn_('touchend', false);
        this.removeRepaintOn_('touchmove', false);

        if (!!window['PointerEvent']) {
            this.removeRepaintOn_('pointerdown', false);
            this.removeRepaintOn_('pointerup', false);
            this.removeRepaintOn_('pointermove', false);
        }

        this.removeRepaintOn_(this._wheelEvent, false);

        window.removeEventListener('resize', this._boundNotifyRepaintRequired, false);

        Cesium.loadWithXhr.load = this._originalLoadWithXhr;
        Cesium.TaskProcessor.prototype.scheduleTask = this._originalScheduleTask;
        Cesium.Camera.prototype.setView = this._originalCameraSetView;
        Cesium.Camera.prototype.move = this._originalCameraMove;
        Cesium.Camera.prototype.rotate = this._originalCameraRotate;
        Cesium.Camera.prototype.lookAt = this._originalCameraLookAt;
        Cesium.Camera.prototype.flyTo = this._originalCameraFlyTo;

        // desconectamos de los cambios del map 2d
        this.map2D.off(this.listentTo, this._boundNotifyRepaintRequired);
    };
    CustomRenderLoop.prototype.postRender = function (date) {
        // We can safely stop rendering when:
        //  - the camera position hasn't changed in over 3 second,
        //  - there are no tiles waiting to load, and
        //  - the clock is not animating
        //  - there are no tweens in progress

        var now = Date.now();

        var scene = this.scene_;
        var camera = scene.camera;

        if (!Cesium.Matrix4.equalsEpsilon(this.lastCameraViewMatrix_,
            camera.viewMatrix, 1e-5)) {
            this.lastCameraMoveTime_ = now;
        }

        var cameraMovedIn3LastSecond = now - this.lastCameraMoveTime_ < 3000;

        var tweens = scene['tweens'];
        if (!cameraMovedIn3LastSecond && !this.tilesWaiting && tweens.length == 0) {
            if (this.verboseRendering) {
                console.log('stopping rendering @ ' + Date.now());
            }
            this.parent.setBlockRendering(true);
            this.stoppedRendering = true;
        }

        Cesium.Matrix4.clone(camera.viewMatrix, this.lastCameraViewMatrix_);
    };
    CustomRenderLoop.prototype.restart = function () {
        this.notifyRepaintRequired();
    };
    CustomRenderLoop.prototype.notifyRepaintRequired = function () {
        if (this.verboseRendering && this.stoppedRendering) {
            console.log('starting rendering @ ' + Date.now());
        }
        this.lastCameraMoveTime_ = Date.now();
        // TODO: do not unblock if not blocked by us
        this.parent.setBlockRendering(false);
        this.stoppedRendering = false;
    };
    CustomRenderLoop.prototype.setDebug = function (debug) {
        this.verboseRendering = debug;
    };

    CustomRender = function (map2D, map3D, isSlower) {
        this.idRequestAnimationFrame = null;

        this._blockRendering = false;
        this._canvasClientWidth = 0.0;
        this._canvasClientHeight = 0.0;
        this._resolutionScale = 1.0;

        this._viewer = map3D;
        this._canvas = map3D.scene.canvas;
        this._clock = map3D.clock || new Cesium.Clock();

        this._handleResize = function (vw) {
            var width = this._canvas.clientWidth;
            var height = this._canvas.clientHeight;

            if (width === 0 | height === 0) {
                // The canvas DOM element is not ready yet.
                return;
            }

            if (width === this._canvasClientWidth &&
                height === this._canvasClientHeight) {
                return;
            }

            var resolutionScale = this._resolutionScale;

            this._canvasClientWidth = width;
            this._canvasClientHeight = height;

            width *= resolutionScale;
            height *= resolutionScale;

            this._canvas.width = width;
            this._canvas.height = height;
            vw.scene.camera.frustum.aspectRatio = width / height;
        };
        this._renderingAnimation = function () {

            function animation() {
                if (!this._blockRendering) {
                    this._viewer.scene.initializeFrame();
                    this._handleResize(this._viewer);
                    var currentTime = this._clock.tick() || Cesium.JulianDate.now();
                    this._viewer.scene.render(currentTime);
                } else {
                    this._clock.tick();
                }

                this.idRequestAnimationFrame = requestAnimationFrame(animation.bind(this));
            };
            this.idRequestAnimationFrame = requestAnimationFrame(animation.bind(this));
        };

        if (isSlower) {
            /* según he leído, al detectar que el navegador cuenta con webgl pero aun así es lento,
                                   podemos renderizar en el canvas disponible un globo más pequeño mejorando el rendimiento y perdiendo calidad. 
                                   Tenemos controlado si el usuario está en un navegador lento mostrando advertencia.
                                   Para ello: setResolutionScale(1/(window.devicePixelRatio || 1.0)) */
            this._resolutionScale = 0.5;
        }
        this.renderLoop = new CustomRenderLoop(map2D, map3D, false);
        this.renderLoop.parent = this;
    };
    CustomRender.prototype.start = function (debug) {
        this.renderLoop.setDebug(debug || false);
        this._renderingAnimation();
    };
    CustomRender.prototype.stop = function () {
        window.cancelAnimationFrame(this.idRequestAnimationFrame);
    };
    CustomRender.prototype.restart = function () {
        this.renderLoop.restart();
    };
    CustomRender.prototype.setBlockRendering = function (block) {
        this._blockRendering = block;
    };
    CustomRender.prototype.getCanvas = function () {
        return this._canvas;
    };

    TwoDLinkedFeatureInfo = function (map) {
        this.layer = null;

        var marker = null;
        var ctlResultsPanel = null;
        var ctlFeatureInfo = null;
        var saved$popupDiv = null;

        var getResultsPanelCtl = function () {
            var done = new $.Deferred();

            if (!ctlResultsPanel) {
                if (!TC.control.ResultsPanel) {
                    TC.syncLoadJS(TC.apiLocation + 'TC/control/ResultsPanel')
                }

                ctlResultsPanel = new TC.control.ResultsPanel({
                    "div": "results-panel",
                    "content": "table",
                    "titles": {
                        "main": map.getLocaleString("threed.rs.panel.gfi"),
                        "max": map.getLocaleString("threed.rs.panel.gfi")
                    },
                    "openOn": map.Consts.events.GFI
                });
                ctlResultsPanel.register(map.map);
                ctlResultsPanel.render(function () {

                    ctlResultsPanel.onClose = function () {
                        removeMarker();
                        map.map.$events.trigger($.Event(TC.Consts.event.POPUPHIDE, { control: ctlFeatureInfo.popup }));
                    }.bind(this);

                    map.map.on(TC.Consts.event.RESULTSPANELCLOSE, ctlResultsPanel.onClose);

                    done.resolve();
                });
            } else {
                done.resolve();
            }

            return done;
        };
        var setMarker = function (pickedPosition) {
            if (!marker) {
                var markerStyle = TC.control.FeatureInfoCommons.prototype.markerStyle;

                var billboard = {
                    position: pickedPosition,
                    billboard: {
                        image: TC.Util.getBackgroundUrlFromCss(map.CLASS + '-marker'),
                        eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    }
                };

                marker = map.map3D.addNativeFeature.call(map, billboard);

            } else {
                marker.position = pickedPosition;
            }
        };
        var removeMarker = function () {
            map.map3D.removeFeature.call(map, marker);
            marker = null;
        };

        ctlFeatureInfo = map.map.getControlsByClass(TC.control.FeatureInfo)[0];
        if (ctlFeatureInfo) {
            ctlFeatureInfo.marker = true;
            saved$popupDiv = ctlFeatureInfo.popup.$popupDiv;
            ctlFeatureInfo.popup.hide();

            this.layer = ctlFeatureInfo.layer;
            map.map3D.vector2DLayers.push(this.layer);
        }


        this.clear = function () {

            this.layer = null;
            removeMarker();

            if (ctlResultsPanel) {
                if (ctlResultsPanel.onClose) {
                    map.map.off(TC.Consts.event.RESULTSPANELCLOSE, ctlResultsPanel.onClose);
                }

                ctlResultsPanel.close();
            }
            if (ctlFeatureInfo) {
                ctlFeatureInfo.popup.$popupDiv = saved$popupDiv;
                ctlFeatureInfo.popup.hide();
            }
        };
        this.send = function (pickedPosition) {
            var done = new $.Deferred();

            if (!map.waiting)
                map.waiting = map.map.getLoadingIndicator().addWait();

            ctlFeatureInfo.popup.$popupDiv = saved$popupDiv;

            setMarker(pickedPosition);

            $.when(getResultsPanelCtl()).then(function () {

                var pickedLocation = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pickedPosition);
                var reprojected = TC.Util.reproject([Cesium.Math.toDegrees(pickedLocation.longitude), Cesium.Math.toDegrees(pickedLocation.latitude)], map.map3D.crs, map.map.crs);
                var radius = (map.map.options.pixelTolerance || TC.Cfg.pixelTolerance);
                var mapWidth = 2 * radius + 1;

                var tilesToRender = map.viewer.scene.globe._surface._tilesToRender;
                var pickedTile;

                for (var textureIndex = 0; !pickedTile && textureIndex < tilesToRender.length; ++textureIndex) {
                    var tile = tilesToRender[textureIndex];
                    if (Cesium.Rectangle.contains(tile.rectangle, pickedLocation)) {
                        pickedTile = tile;
                    }
                }

                if (!pickedTile) {
                    return done;
                }

                var imageryTiles = pickedTile.data.imagery;
                for (var i = imageryTiles.length - 1; i >= 0; --i) {
                    var terrainImagery = imageryTiles[i];
                    var imagery = terrainImagery.readyImagery;
                    if (!imagery) {
                        return done;
                    }
                }

                var resolution = calcResolutionForDistance.call(map,
                    map.viewer.camera.positionCartographic.height,
                    map.viewer.camera.positionCartographic.latitude);
                var boxHalfWidth = mapWidth * resolution / 2;

                var bbox = [
                    reprojected[0] - boxHalfWidth,
                    reprojected[1] - boxHalfWidth,
                    reprojected[0] + boxHalfWidth,
                    reprojected[1] + boxHalfWidth
                ];
                var ij = [radius, radius];

                map.map.one(TC.Consts.event.POPUP, function (e) {
                    ctlResultsPanel.open(e.control.$popupDiv.find('.' + ctlFeatureInfo.CLASS).clone(true, true));
                    ctlFeatureInfo.popup.$popupDiv = ctlResultsPanel.$divTable;
                    ctlFeatureInfo.onShowPopUp(e);
                    ctlFeatureInfo.popup.$popupDiv.removeAttr('style');

                    done.resolve(e);
                });

                map.map.one(TC.Consts.event.NOFEATUREINFO, function (e) {
                    ctlFeatureInfo.isActive = savedIsActive;

                    removeMarker(s);

                    if (ctlResultsPanel) {
                        ctlResultsPanel.close();
                    }

                    done.resolve(e);
                });

                map.map.one(TC.Consts.event.FEATUREINFO, function (e) {
                    ctlFeatureInfo.isActive = savedIsActive;

                    if (e.featureCount == 0) {
                        removeMarker();

                        if (ctlResultsPanel) {
                            ctlResultsPanel.close();
                        }
                    }

                    done.resolve(e);
                });

                savedIsActive = ctlFeatureInfo.isActive;
                ctlFeatureInfo.isActive = true;
                ctlFeatureInfo.beforeGetFeatureInfo({ xy: ij, control: ctlFeatureInfo });
                ctlFeatureInfo.wrap.getFeatureInfo(ij, {
                    mapSize: [mapWidth, mapWidth],
                    boundingBox: bbox
                });
            });

            return done;
        };
    };
    TwoDLinkedLegend = function (map) {
        var ctlLegend = map.map.getControlsByClass(TC.control.Legend)[0];
        this.refresh = function () {
            if (ctlLegend && map.map3D.workLayers.length > 0) {
                ctlLegend.loadGraphics();
            }
        }
    };

    RasterConverter = function (crsPattern) {
        this.layerCrs = null;

        var crsPattern = crsPattern;

        var paths = {
            CRS: ["Capability", "Layer", "CRS"],
            TILEMATRIXSET: ["Contents", "TileMatrixSet", "Identifier"],
            TILEMATRIXSETLABELS: ["Contents", "TileMatrixSet"]
        };
        var getOfPath = function (obj, p, i) {
            if (i < p.length - 1) {
                if (obj.hasOwnProperty(p[i]))
                    return getOfPath(obj[p[i]], p, ++i);
                else return null;
            } else {
                if (obj instanceof Array) {
                    var _obj = [];
                    for (var a = 0; a < obj.length; a++) {
                        if (obj[a].hasOwnProperty(p[i]))
                            _obj.push(obj[a][p[i]]);
                    }

                    return _obj;
                } else return obj[p[i]];
            }
        };
        var getCRSByLayerOnCapabilities = function (layer) {
            if ((capsURL = TC.Util.isOnCapabilities(layer.url))) {
                if ((caps = TC.capabilities[capsURL])) {
                    return getOfPath(caps, paths.CRS, 0) || getOfPath(caps, paths.TILEMATRIXSET, 0);
                }
            }

            return null;
        };
        var getTileMatrixSetLabelByLayerOnCapabilities = function (layer, crs) {
            if ((capsURL = TC.Util.isOnCapabilities(layer.url))) {
                if ((caps = TC.capabilities[capsURL])) {
                    var tileMatrixSet = getOfPath(caps, paths.TILEMATRIXSETLABELS, 0);
                    for (var a = 0; a < tileMatrixSet.length; a++) {
                        if (tileMatrixSet[a]["Identifier"] === crs) {
                            return getOfPath(tileMatrixSet[a], ["TileMatrix", "Identifier"], 0);
                        }
                    }
                }
            }

            return null;
        };

        var wmtsLayer = function (layer) {
            var tileMatrixSetLabels = getTileMatrixSetLabelByLayerOnCapabilities(layer, this.layerCrs);

            var options = {
                url: layer.options.urlPattern,
                layer: layer.layerNames,
                style: 'default',
                format: layer.format || layer.options.format,
                tileMatrixSetID: this.layerCrs,
                tileMatrixLabels: tileMatrixSetLabels,
                tilingScheme: new Cesium.GeographicTilingScheme()
            };

            if (layer.usesProxy) {
                options.proxy = {
                    getURL: function (url) {
                        return TC.proxify(url);
                    }
                };
            }

            return new Cesium.WebMapTileServiceImageryProvider(options);
        }
        var wmsLayer = function (layer) {
            var options = {
                url: layer.url,
                layers: layer.layerNames,
                parameters: {
                    version: "1.3.0",
                    transparent: true,
                    format: layer.format || layer.options.format
                }
            };

            if (layer.usesProxy ||
                (layer.usesSSL && !TC.Util.isSameOrigin(layer.url))) {
                options.proxy = {
                    getURL: function (url) {
                        return TC.proxify(url);
                    }
                };
            }

            return new Cesium.WebMapServiceImageryProvider(options);
        };

        this.isCompatible = function (layer) {
            var crs = getCRSByLayerOnCapabilities(layer);
            if (crs && crs.length && crsPattern.test(crs.join(','))) {
                this.layerCrs = crs.join(',').match(crsPattern)[0];
                return true;
            } else { return false; }
        };
        this.convert = function (layer) {
            var csmLayer;

            this.isCompatible(layer);

            if (this.layerCrs != null) {
                switch (true) {
                    case TC.Consts.layerType.WMTS == layer.type:
                        csmLayer = wmtsLayer.call(this, layer);
                        break;
                    case TC.Consts.layerType.WMS == layer.type:
                        csmLayer = wmsLayer(layer);
                        break;
                }

                if (csmLayer) {
                    if (csmLayer["enablePickFeatures"] !== undefined) {
                        csmLayer.enablePickFeatures = false;
                        csmLayer["tcLayer"] = layer;
                    }

                    return csmLayer;
                }
            }

            return null;
        };
    };
    FeatureConverter = function () {
        var scene = null;
        var toCesiumColor = function (hexStringColor, alpha) {
            if (hexStringColor instanceof Array) {
                hexStringColor = "rgba(" + hexStringColor[0] + ", " + hexStringColor[1] + ", " + hexStringColor[2] + ", " + hexStringColor[3] + ")";
            }
            var color = Cesium.Color.fromCssColorString(hexStringColor);
            if (alpha) {
                return color.withAlpha(alpha);
            }

            return color;
        }
        var setStyleProperties = function (styles, properties, feature) {
            for (var key in properties) { // recorremos el diccionario de propiedades que admitimos como estilo
                var attr = styles[properties[key].prop];
                if (attr) {
                    if (typeof (attr) === "function") { // si la propiedad del estilo es una función (como en el control de búsquedas) invocamos para obtener el valor
                        var val = attr(feature);
                        if (val) {
                            properties[key].val = val;
                        }
                    } else {
                        properties[key].val = attr; // obtenenemos el valor
                    }
                }
            }
        }
        var getPixelSize = function (coords) {
            var rectangle;

            if (coords.length == 1) {
                var point = coords[0];
                var delta = 1000;
                var minx, miny, maxx, maxy;
                minx = new Cesium.Cartesian3(point.x - delta, point.y, point.z);
                miny = new Cesium.Cartesian3(point.x, point.y - delta, point.z);
                maxx = new Cesium.Cartesian3(point.x + delta, point.y, point.z);
                maxy = new Cesium.Cartesian3(point.x, point.y + delta, point.z);

                rectangle = Cesium.Rectangle.fromCartesianArray([minx, miny, maxx, maxy], Cesium.Ellipsoid.WGS84);
            } else {
                rectangle = Cesium.Rectangle.fromCartesianArray(coords, Cesium.Ellipsoid.WGS84);
            }

            var neededCameraPosition = scene.camera.getRectangleCameraCoordinates(rectangle);
            var distance = Cesium.Cartesian3.distance(neededCameraPosition, Cesium.BoundingSphere.fromPoints(coords).center);
            var pixelSize = scene.camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, distance, new Cesium.Cartesian2());
            pixelSize = Math.max(pixelSize.x, pixelSize.y);
            return Math.round(pixelSize) == 0 ? 1 : pixelSize;
        };

        var getFeatureStyle = function (feature) {
            var self = this;
            var styles;

            if (!feature.layer.hasOwnProperty('styles')) {
                styles = TC.Defaults.styles;
            } else {
                styles = feature.layer.styles;
            }

            styles = styles[feature.STYLETYPE] == undefined ?
                styles[(feature.STYLETYPE === "polyline" ? "line" : feature.STYLETYPE)] :
                styles[(feature.STYLETYPE === "multipolygon" ? "polygon" : feature.STYLETYPE)];

            styles = $.extend({}, styles, feature.options, feature.getStyle());

            return styles;
        }
        var polygonConverter = function (feature) {
            var self = this;
            var polygon = {};
            var styles = getFeatureStyle(feature);

            polygon.options = function () {
                var opt = {};
                var properties = {
                    color: { prop: 'fillColor' },
                    opacity: { prop: 'fillOpacity' },
                    outlineColor: { prop: 'strokeColor' },
                    outlineOpacity: { prop: 'strokeOpacity' },
                    width: { prop: 'strokeWidth' }
                };

                setStyleProperties(styles, properties, feature);
                var color;
                if (properties.color.hasOwnProperty('val')) {
                    if (properties.opacity.hasOwnProperty('val')) {
                        color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        color = toCesiumColor(properties.color.val);
                    }
                }

                opt.color = Cesium.ColorGeometryInstanceAttribute.fromColor(color);

                if (properties.outlineColor.hasOwnProperty('val')) {
                    if (properties.outlineOpacity.hasOwnProperty('val')) {
                        color = toCesiumColor(properties.outlineColor.val, properties.outlineOpacity.val);
                    } else {
                        color = toCesiumColor(properties.outlineColor.val);
                    }
                }

                opt.outlineColor = Cesium.ColorGeometryInstanceAttribute.fromColor(color);

                if (properties.width.hasOwnProperty('val')) {
                    opt.width = properties.width.val;
                }

                return opt;
            };

            if (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon) {
                polygon.geometryType = function (coords, options) {
                    var geomPolys = [];
                    var geomOutlines = [];

                    var getPolyGeom = function (polygonHierarchy) {
                        return new Cesium.GeometryInstance({
                            id: feature.id,
                            geometry: new Cesium.PolygonGeometry({
                                polygonHierarchy: polygonHierarchy
                            }),
                            attributes: {
                                color: options.color
                            }
                        });
                    };

                    var getOutlineGeom = function (outlineCoords) {
                        return new Cesium.GeometryInstance({
                            id: feature.id + 'outLine',
                            geometry: new Cesium.CorridorGeometry({
                                positions: outlineCoords,
                                width: getPixelSize(outlineCoords) * options.width
                            }),
                            attributes: {
                                color: options.outlineColor
                            }
                        });
                    };

                    for (var i = 0; i < coords.length; i++) {
                        for (var j = 0; j < coords[i].length; j++) {
                            var hierarchy;
                            if (j == 0) {
                                geomOutlines.push(getOutlineGeom(coords[i][0]));
                                hierarchy = new Cesium.PolygonHierarchy(coords[i][0]);
                            } else {
                                geomOutlines.push(getOutlineGeom(coords[i][j]));
                                hierarchy.holes.push(new Cesium.PolygonHierarchy(coords[i][j]));
                            }
                        }

                        geomPolys.push(getPolyGeom(hierarchy));
                    }

                    return [
                        new Cesium.GroundPrimitive({
                            geometryInstances: geomPolys
                        }),
                        new Cesium.GroundPrimitive({
                            geometryInstances: geomOutlines
                        })
                    ];
                };
            }
            else if (TC.feature.Polygon && feature instanceof TC.feature.Polygon) {
                polygon.geometryType = function (coords, options) {
                    return [
                        new Cesium.GroundPrimitive({
                            geometryInstances: new Cesium.GeometryInstance({
                                id: feature.id,
                                geometry: new Cesium.PolygonGeometry({
                                    polygonHierarchy: new Cesium.PolygonHierarchy(coords)
                                }),
                                attributes: {
                                    color: options.color
                                }
                            })
                        }),
                        new Cesium.GroundPrimitive({
                            geometryInstances: new Cesium.GeometryInstance({
                                id: feature.id + 'outLine',
                                geometry: new Cesium.CorridorGeometry({
                                    positions: coords,
                                    width: getPixelSize(coords) * options.width
                                }),
                                attributes: {
                                    color: options.outlineColor
                                }
                            })
                        })
                    ];
                };
            }

            return polygon;
        };
        var lineConverter = function (feature) {
            var self = this;
            var line = {};
            var styles = getFeatureStyle(feature);

            line.options = function () {
                var opt = {};
                var properties = {
                    color: { prop: 'strokeColor' },
                    opacity: { prop: 'strokeOpacity' },
                    width: { prop: 'strokeWidth' }
                };

                setStyleProperties(styles, properties, feature);

                if (properties.width.hasOwnProperty('val')) {
                    opt.width = properties.width.val;
                }

                var color;
                if (properties.color.hasOwnProperty('val')) {
                    if (properties.opacity.hasOwnProperty('val')) {
                        color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        color = toCesiumColor(properties.color.val);
                    }
                }

                opt.color = Cesium.ColorGeometryInstanceAttribute.fromColor(color);

                return opt;
            };

            if (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline) {
                line.geometryType = function (coords, options) {
                    // GLS: con lo siguiente pinta bien calles
                    if (coords.length == 1) {
                        coords = coords[0];
                    }

                    return new Cesium.GroundPrimitive({
                        geometryInstances: new Cesium.GeometryInstance({
                            id: feature.id,
                            geometry: new Cesium.CorridorGeometry({
                                positions: coords,
                                width: getPixelSize(coords) * options.width
                            }),
                            attributes: {
                                color: options.color
                            }
                        })
                    });
                };
            }
            else if (TC.feature.Polyline && feature instanceof TC.feature.Polyline) {
                line.geometryType = function (coords, options) {
                    return new Cesium.GroundPrimitive({
                        geometryInstances: new Cesium.GeometryInstance({
                            id: feature.id,
                            geometry: new Cesium.CorridorGeometry({
                                positions: coords,
                                width: getPixelSize(coords) * options.width
                            }),
                            attributes: {
                                color: options.color
                            }
                        })
                    });
                };
            }

            return line;
        };
        var pointConverter = function (feature) {
            var self = this;
            var point = {};
            var styles = getFeatureStyle(feature);

            point.options = function () {
                var opt = {};

                var properties = {
                    rotation: { prop: 'angle' },
                    label: { prop: 'label' },
                    fontSize: { prop: 'fontSize' },
                    fontColor: { prop: 'fontColor' },
                    outlineLabelColor: { prop: 'labelOutlineColor' },
                    outlineLabelWidth: { prop: 'labelOutlineWidth' },
                    anchor: { prop: 'anchor' },
                    height: { prop: 'height' },
                    width: { prop: 'width' },
                    url: { prop: 'url' },
                    color: { prop: 'fillColor' },
                    opacity: { prop: 'fillOpacity' },
                    outlineColor: { prop: 'strokeColor' },
                    outlineOpacity: { prop: 'strokeOpacity' },
                    outlineWidth: { prop: 'strokeWidth' },
                    radius: { prop: 'radius' }
                };

                setStyleProperties(styles, properties, feature);

                if (properties.anchor.hasOwnProperty('val')) {
                    if (!(properties.url.hasOwnProperty('val')) && feature.options.url) {
                        opt.url = feature.options.url;
                    } else {
                        opt.url = properties.url.val;
                    }

                    opt.anchor = properties.anchor.val;
                }

                if (properties.height.hasOwnProperty('val')) {
                    opt.height = properties.height.val;
                }

                if (properties.width.hasOwnProperty('val')) {
                    opt.width = properties.width.val;
                }

                if (properties.rotation.hasOwnProperty('val')) {
                    opt.rotation = properties.rotation.val;
                }

                if (properties.label.hasOwnProperty('val')) {
                    opt.label = properties.label.val;
                }

                if (properties.fontSize.hasOwnProperty('val')) {
                    opt.fontSize = properties.fontSize.val;
                }

                if (properties.fontColor.hasOwnProperty('val')) {
                    opt.fontColor = toCesiumColor(properties.fontColor.val);
                }

                if (properties.outlineLabelColor.hasOwnProperty('val')) {
                    opt.outlineLabelColor = toCesiumColor(properties.outlineLabelColor.val);
                }

                if (properties.outlineLabelWidth.hasOwnProperty('val')) {
                    opt.outlineLabelWidth = properties.outlineLabelWidth.val;
                }


                var color;
                if (properties.color.hasOwnProperty('val')) {
                    if (properties.opacity.hasOwnProperty('val')) {
                        opt.color = toCesiumColor(properties.color.val, properties.opacity.val);
                    } else {
                        opt.color = toCesiumColor(properties.color.val);
                    }
                }

                if (properties.outlineColor.hasOwnProperty('val')) {
                    if (properties.outlineOpacity.hasOwnProperty('val')) {
                        opt.outlineColor = toCesiumColor(properties.outlineColor.val, properties.outlineOpacity.val);
                    } else {
                        opt.outlineColor = toCesiumColor(properties.outlineColor.val);
                    }
                }

                if (properties.outlineWidth.hasOwnProperty('val')) {
                    opt.outlineWidth = properties.outlineWidth.val;
                }

                if (properties.radius.hasOwnProperty('val')) {
                    opt.radius = properties.radius.val;
                }

                return opt;
            };

            if (TC.feature.Marker && feature instanceof TC.feature.Marker) {
                point.geometryType = function (coords, options) {
                    var billboard = {
                        id: feature.id,
                        name: feature.id,
                        position: coords[0],
                        billboard: {
                            image: options.url,
                            width: options.width,
                            height: options.height,
                            eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                            pixelOffset: new Cesium.Cartesian2(options.anchor[0], options.anchor[1]),
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                        }
                    };

                    if (!options.label) {
                        return billboard;
                    } else {
                        return [billboard, {
                            id: feature.id,
                            name: feature.id,
                            position: coords[0],
                            label: {
                                text: options.label,
                                font: '14pt sans-serif',
                                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                fillColor: options.fontColor,
                                showBackground: true,
                                eyeOffset: new Cesium.Cartesian3(0, 0, -100)
                            }
                        }];
                    }
                };
            }
            else if (TC.feature.Point && feature instanceof TC.feature.Point) {
                var pinBuilder = new Cesium.PinBuilder();

                point.geometryType = function (coords, options) {
                    var text = options.label;

                    if (text && !/^[0-9]*\-{0,1}[a-z]{0,4}$/gi.test(text)) {
                        return {
                            id: feature.id,
                            name: feature.id,
                            position: coords[0],
                            label: {
                                text: options.label,
                                font: '14' + 'px san-serif Arial',
                                showBackground: true,
                                eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                verticalOrigin: Cesium.VerticalOrigin.BASELINE,
                                fillColor: Cesium.Color.WHITE
                            }
                        };
                    } else if (/^[0-9]*\-{0,1}[a-z]{0,4}$/gi.test(text)) {
                        return {
                            id: feature.id,
                            name: feature.id,
                            position: coords[0],
                            billboard: {
                                image: pinBuilder.fromText(text, options.fontColor, 48).toDataURL(),
                                eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                            }
                        };
                    }
                    //else if (options.radius) {
                    //    return [
                    //        new Cesium.GroundPrimitive({
                    //            geometryInstances: new Cesium.GeometryInstance({
                    //                id: feature.id,
                    //                geometry: new Cesium.CircleGeometry({
                    //                    center: coords[0],
                    //                    radius: getPixelSize(coords) * options.radius
                    //                }),
                    //                attributes: {
                    //                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(options.color)
                    //                }
                    //            })
                    //        })
                    //        /*,
                    //        new Cesium.GroundPrimitive({
                    //            geometryInstances: new Cesium.GeometryInstance({
                    //                id: feature.id + 'outLine',
                    //                geometry: new Cesium.CorridorGeometry({
                    //                    positions: coords,
                    //                    width: getPixelSize(coords) * options.outlineWidth
                    //                }),
                    //                attributes: {
                    //                    color: options.outlineColor
                    //                }
                    //            })
                    //        })*/
                    //    ];
                    //}
                    else {
                        return {
                            id: feature.id,
                            name: feature.id,
                            position: coords[0],
                            billboard: {
                                image: pinBuilder.fromColor(Cesium.Color.fromCssColorString(TC.Cfg.styles.point.fillColor), 24).toDataURL(),
                                eyeOffset: new Cesium.Cartesian3(0, 0, -100),
                                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                            }
                        };
                    }
                };
            }

            return point;
        };

        this.convert = function (scn, feature, sourceCrs, targetCrs) {
            scene = scn;

            var cartesians = [];
            var toCartesian = function (coord, arr) {
                coord = TC.Util.reproject(coord, sourceCrs, targetCrs);

                arr.push(coord.length > 2 ?
                    Cesium.Cartesian3.fromDegrees(coord[0], coord[1], coord[2]) :
                    Cesium.Cartesian3.fromDegrees(coord[0], coord[1]));
            };

            var obj;
            var geometry = feature.geometry;
            var converted;

            var point,
                points,
                ringsOrPolylines,
                polygons;

            var forPoints = function (points, arr) {
                if ($.isArray(points)) {
                    for (var i = 0; i < points.length; i++) {
                        toCartesian(points[i], arr);
                    }
                }
            };
            var forRingsOrPolylines = function (ringsOrPolylines, arr) {
                if ($.isArray(ringsOrPolylines)) {
                    for (var i = 0; i < ringsOrPolylines.length; i++) {
                        arr.push([]);
                        forPoints(ringsOrPolylines[i], arr[arr.length - 1]);
                    }
                }
            };
            var forPolygons = function (polygons) {
                if ($.isArray(polygons)) {
                    for (var i = 0; i < polygons.length; i++) {
                        cartesians.push([]);
                        forRingsOrPolylines(polygons[i], cartesians[cartesians.length - 1]);
                    }
                }
            };

            switch (true) {
                case (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon):
                    polygons = geometry;
                    if ($.isArray(polygons)) {
                        forPolygons(polygons);

                        converted = polygonConverter.call(self, feature);
                    }
                    break;
                case ((TC.feature.Polygon && feature instanceof TC.feature.Polygon) || (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline)):
                    ringsOrPolylines = geometry;
                    if ($.isArray(ringsOrPolylines)) {
                        forRingsOrPolylines(ringsOrPolylines, cartesians);

                        if (feature instanceof TC.feature.Polygon) {
                            converted = polygonConverter(feature);
                        }
                        else if (feature instanceof TC.feature.MultiPolyline) {
                            converted = lineConverter(feature);
                        }
                    }
                    break;
                case (TC.feature.Polyline && feature instanceof TC.feature.Polyline):
                    points = geometry;
                    if ($.isArray(points)) {
                        forPoints(points, cartesians);

                        converted = lineConverter(feature);
                    }
                    break;
                case (TC.feature.Marker && feature instanceof TC.feature.Marker):
                    points = [geometry];
                    forPoints(points, cartesians);

                    converted = pointConverter(feature);
                    break;
                case (TC.feature.Point && feature instanceof TC.feature.Point):
                    points = [geometry];
                    forPoints(points, cartesians);

                    converted = pointConverter(feature);
                    break;
            }

            if (cartesians.length == 0) {
                return null;
            }

            obj = {
                id: feature.id,
                attributes: feature.data,
                geometry: converted.geometryType(cartesians, converted.options()),
                boundigSphere: Cesium.BoundingSphere.fromPoints(cartesians)
            };

            return obj;
        };
    };

    ctlProto.map3D = (function () {

        var currentMapCfg = {
            baseMap: '',
            baseMaps: [],
            baseVector: ''
        };
        var analogLayers = {
            layers: [],
            getProperties: function (layer) {
                var self = this;
                // almacenamos la configuración análoga para el mapa de fondo no soportado.
                if (layer.options && layer.options.hasOwnProperty('4326')) {
                    analogLayers.layers.push({ id: layer.id, opts: layer.options["4326"] });
                    return analogLayers.layers[analogLayers.layers.length - 1].opts;
                }
                else return null;
            },
            findById: function (id) {
                if (this.layers.length == 0)
                    return null;
                else {
                    for (var i = 0; i < this.layers.length; i++) {
                        if (this.layers[i].id.toLowerCase().trim() === id.toLowerCase().trim())
                            return this.layers[i].opts;
                    }

                    return null;
                }
            }
        };
        var checkCompatibleBaseMaps = function (map) {
            var self = this;

            var isBaseRaster = map.baseLayer instanceof TC.layer.Raster;

            if (isBaseRaster) {
                if ((crs = rasterConverter.isCompatible(map.baseLayer)) == null)
                    if (analogLayers.getProperties.call(self, self.map.baseLayer) == null)
                        map.toast(self.getLocaleString('threed.baseLayerNoCompatible', { name: map.baseLayer.layerNames }));
            } else {
                currentMapCfg.baseVector = map.baseLayer;
            }

            if (currentMapCfg.baseMaps.length === 0) {
                for (var i = 0; i < map.baseLayers.length; i++) {
                    if (map.baseLayers[i] instanceof TC.layer.Raster && !rasterConverter.isCompatible(map.baseLayers[i]))
                        if (analogLayers.getProperties.call(self, map.baseLayers[i]) == null)
                            currentMapCfg.baseMaps.push({ l: map.baseLayers[i], i: i });
                }
            }

            currentMapCfg.baseMap = isBaseRaster ? map.baseLayer : self.Consts.BLANK_BASE;
        };
        var removeNoCompatibleBaseLayers = function (map) {
            var selectNewBaseLayer = false;

            if (currentMapCfg.baseMaps && currentMapCfg.baseMaps.length) {
                for (var i = 0; i < currentMapCfg.baseMaps.length; i++) {
                    for (var j = 0; j < map.baseLayers.length; j++) {
                        if (map.baseLayers[j] === currentMapCfg.baseMaps[i].l) {

                            if (currentMapCfg.baseMap == map.baseLayers[j]) {
                                // si uno de los mapas de fondo no soportados para 3d es el mapa de fondo seleccionado ahora mismo
                                // seleciono otro de los que sí son soportados
                                selectNewBaseLayer = true;
                            }

                            map.$events.trigger($.Event(TC.Consts.event.LAYERREMOVE, { layer: map.baseLayers[j] }));
                            map.baseLayers.splice(j, 1);
                            break;
                        }
                    }
                }

                if (selectNewBaseLayer) {
                    // si uno de los mapas de fondo no soportados para 3d es el mapa de fondo seleccionado ahora mismo
                    // seleciono otro de los que sí son soportados

                    map.baseLayer = map.baseLayers[0];
                    map.$events.trigger($.Event(TC.Consts.event.BASELAYERCHANGE, { layer: map.baseLayer }));
                }
            }
        };
        var addNoCompatibleBaseLayers = function (map) {
            if (currentMapCfg.baseMaps && currentMapCfg.baseMaps.length) {
                for (var i = 0; i < currentMapCfg.baseMaps.length; i++) {
                    map.$events.trigger($.Event(TC.Consts.event.LAYERADD, { layer: currentMapCfg.baseMaps[i].l }));
                    map.baseLayers.splice(currentMapCfg.baseMaps[i].i, 0, currentMapCfg.baseMaps[i].l);
                }
            }
        }

        var rasterConverter = new RasterConverter(/(EPSG\:?4326)/i);
        var featureConverter = new FeatureConverter();

        var getCesiumLibrary = function () {
            var self = this;
            var done = new $.Deferred();
            if (window.Cesium)
                done.resolve();
            else {
                TC.loadJS(!window.Cesium, [TC.Consts.url.CESIUM], function () {
                    done.resolve();
                });
            }

            return done;
        };
        var overrideDesktopZoom = function () {
            var self = this;

            if (!TC.Util.detectMobile()) {
                self.viewer.scene.screenSpaceCameraController.enableZoom = false;

                var element = self.viewer.scene.canvas;
                // detect available wheel event
                var wheelEvent;
                if ('onwheel' in element) {
                    // spec event type
                    wheelEvent = 'wheel';
                } else if (document.onmousewheel !== undefined) {
                    // legacy event type
                    wheelEvent = 'mousewheel';
                } else {
                    // older Firefox
                    wheelEvent = 'DOMMouseScroll';
                }
                element.addEventListener(wheelEvent, function (event) {
                    var delta;
                    // standard wheel event uses deltaY.  sign is opposite wheelDelta.
                    // deltaMode indicates what unit it is in.
                    if (event.deltaY) {
                        var deltaMode = event.deltaMode;
                        if (deltaMode === event.DOM_DELTA_PIXEL) {
                            delta = -event.deltaY;
                        } else if (deltaMode === event.DOM_DELTA_LINE) {
                            delta = -event.deltaY * 40;
                        } else {
                            // DOM_DELTA_PAGE
                            delta = -event.deltaY * 120;
                        }
                    } else if (event.detail > 0) {
                        // old Firefox versions use event.detail to count the number of clicks. The sign
                        // of the integer is the direction the wheel is scrolled.
                        delta = event.detail * -120;
                    } else {
                        delta = event.wheelDelta;
                    }

                    self.map3D.zoomToCartesian.call(self, self.map3D._lastMousePosition, delta);

                }, false);

                var eventHandler = new Cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
                eventHandler.setInputAction(function (event) {
                    self.map3D._lastMousePosition = event;
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                eventHandler.setInputAction(function (wheelZoomAmount) {
                    self.map3D.zoomToCartesian.call(self, self.map3D._lastMousePosition, wheelZoomAmount);
                }, Cesium.ScreenSpaceEventType.WHEEL);
                var pinchCenterPosition = new Cesium.Cartesian2();
                var pinchAmount = 0;
                eventHandler.setInputAction(function (event) {
                    Cesium.Cartesian2.lerp(event.position1, event.position2, 0.5, pinchCenterPosition);
                }, Cesium.ScreenSpaceEventType.PINCH_START);
                eventHandler.setInputAction(function (event) {
                    var diff = event.distance.endPosition.y - event.distance.startPosition.y;
                    var rangeWindowRatio = diff / self.viewer.scene.canvas.clientHeight;
                    rangeWindowRatio = Math.min(rangeWindowRatio, self.viewer.scene.screenSpaceCameraController.maximumMovementRatio);
                    pinchAmount = rangeWindowRatio;
                }, Cesium.ScreenSpaceEventType.PINCH_MOVE);
                eventHandler.setInputAction(function (event) {
                    self.map3D.zoomToCartesian.call(self, { endPosition: pinchCenterPosition }, pinchAmount);
                }, Cesium.ScreenSpaceEventType.PINCH_END);
            }
        };

        var addFeature = function (csFeature) {
            var addedFeature = csFeature;
            switch (true) {
                case csFeature instanceof Cesium.GroundPrimitive: {
                    this.viewer.scene.groundPrimitives.add(csFeature);
                    break;
                }
                case csFeature instanceof Object && csFeature.hasOwnProperty('billboard'): {
                    if (!this.viewer.billboardCollection) {
                        this.viewer.billboardCollection = this.viewer.scene.primitives.add(new Cesium.BillboardCollection({
                            scene: this.viewer.scene
                        }));
                    }

                    var billboardAtCollection = this.viewer.billboardCollection.add({
                        position: csFeature.position,
                        image: csFeature.billboard.image,
                        verticalOrigin: csFeature.billboard.verticalOrigin,
                        heightReference: csFeature.billboard.heightReference
                    });

                    addedFeature = billboardAtCollection;
                    break;
                }
                case csFeature instanceof Object: {
                    addedFeature = this.viewer.entities.add(csFeature);
                    break;
                }
            }

            return addedFeature;
        };
        var linkFeature = function (map, idLayer, feature) {
            if (!map.vector2DFeatures.hasOwnProperty(idLayer)) {
                map.vector2DFeatures[idLayer] = [feature];
            } else {
                map.vector2DFeatures[idLayer].push(feature);
            }
        };

        var listenTo = [
            TC.Consts.event.BEFOREBASELAYERCHANGE, TC.Consts.event.BASELAYERCHANGE,
            TC.Consts.event.LAYERADD, TC.Consts.event.LAYERREMOVE, TC.Consts.event.LAYERVISIBILITY, TC.Consts.event.LAYEROPACITY, TC.Consts.event.LAYERORDER,
            TC.Consts.event.FEATUREADD, TC.Consts.event.FEATUREREMOVE, TC.Consts.event.FEATURESCLEAR,
            TC.Consts.event.ZOOM, TC.Consts.event.ZOOMTO];
        var event2DHandler = function (e) {
            var self = this;

            var eventType = e.type + '.tc';
            switch (true) {
                case eventType == TC.Consts.event.BEFOREBASELAYERCHANGE:
                    if (!self.waiting)
                        self.waiting = self.map.getLoadingIndicator().addWait();
                    break;
                case eventType == TC.Consts.event.BASELAYERCHANGE: {
                    self.map3D.setBaseLayer.call(self, e.layer);
                    break;
                }
                case eventType == TC.Consts.event.LAYERADD: {
                    self.map3D.addLayer.call(self, e.layer);
                    break;
                }
                case eventType == TC.Consts.event.LAYERREMOVE: {
                    self.map3D.removeLayer.call(self, e.layer);
                    break;
                }
                case eventType == TC.Consts.event.LAYERVISIBILITY: {
                    self.map3D.setRenderOptionsLayer.call(self, e.layer, { visibility: e.layer.getVisibility() });
                    break;
                }
                case eventType == TC.Consts.event.LAYEROPACITY: {
                    self.map3D.setRenderOptionsLayer.call(self, e.layer, { opacity: e.layer.getOpacity() });
                    break;
                }
                case eventType == TC.Consts.event.LAYERORDER: {
                    for (var i = 0; i < self.map3D.workLayers.length; i++) {
                        if (self.map3D.workLayers[i].imageryProvider && self.map3D.workLayers[i].imageryProvider.layers.join(',') === e.layer.names.join(',')) {

                            if (e.oldIndex > e.newIndex) {
                                var positions = e.oldIndex - e.newIndex;
                                for (var p = 0; p < positions; p++) {
                                    self.viewer.scene.imageryLayers.lower(self.map3D.workLayers[i]);
                                }

                            } else {
                                var positions = e.newIndex - e.oldIndex;
                                for (var p = 0; p < positions; p++) {
                                    self.viewer.scene.imageryLayers.raise(self.map3D.workLayers[i]);
                                }
                            }

                            self.map3D.workLayers.splice(e.newIndex, 0, self.map3D.workLayers.splice(e.oldIndex, 1)[0]);
                            break;
                        }
                    }
                    break;
                }
                case eventType == TC.Consts.event.FEATUREADD: {
                    self.map3D.addFeature.call(self, e.feature);
                    break;
                }
                case eventType == TC.Consts.event.FEATUREREMOVE: {
                    if (self.map3D.vector2DFeatures && self.map3D.vector2DFeatures.hasOwnProperty(e.layer.id)) {
                        var threedFeature = self.map3D.vector2DFeatures[e.layer.id];

                        for (var i = 0; i < threedFeature.length; i++) {
                            self.map3D.removeFeature.call(self, threedFeature[i]);
                        }

                        delete self.map3D.vector2DFeatures[e.layer.id];
                    }
                    break;
                }
                case eventType == TC.Consts.event.FEATURESCLEAR: {
                    if (self.map3D.vector2DFeatures && self.map3D.vector2DFeatures.hasOwnProperty(e.layer.id)) {
                        var threedFeature = self.map3D.vector2DFeatures[e.layer.id];

                        for (var i = 0; i < threedFeature.length; i++) {
                            self.map3D.removeFeature.call(self, threedFeature[i]);
                        }

                        delete self.map3D.vector2DFeatures[e.layer.id];
                    }
                    break;
                }
                case eventType == TC.Consts.event.ZOOM: {
                    if (self.cameraControls && !self.cameraControls.moving) {
                        self.map3D.flyToMapCoordinates.call(self, self.mapView.getCenter());
                    }
                    break;
                }
                case eventType == TC.Consts.event.ZOOMTO: {
                    if (self.lastZoom && performance.now() - self.lastZoom < 50) {
                        return;
                    }
                    self.lastZoom = performance.now();

                    var coordsXY = TC.Util.reproject(e.extent.slice(0, 2), self.map.crs, self.map3D.crs);
                    var coordsXY2 = TC.Util.reproject(e.extent.slice(2), self.map.crs, self.map3D.crs);
                    var rectangle = Cesium.Rectangle.fromDegrees(coordsXY[0], coordsXY[1], coordsXY2[0], coordsXY2[1]);

                    self.map3D.flyToRectangle.call(self, rectangle);
                    break;
                }
            }
        };

        var alterAllowedControls = function (direction) {
            var self = this;

            for (var i = 0, len = self.map.controls.length; i < len; i++) {
                var ctl = self.map.controls[i];
                if (self.ctrlsToMng.indexOf(ctl) < 0) {

                    switch (true) {
                        case (self.direction.TO_TWO_D == direction):
                            ctl.enable();
                            break;
                        case (self.direction.TO_THREE_D == direction):
                            ctl.disable();
                            break;
                    }
                }
            }

            switch (true) {
                case (self.direction.TO_TWO_D == direction):
                    $('[data-no-3d]').removeClass(TC.Consts.classes.HIDDEN);
                    self.ctrlsToMng.forEach(function (ctl) {
                        ctl._$div.removeClass(TC.Consts.classes.THREED);
                    });
                    break;
                case (self.direction.TO_THREE_D == direction):
                    $('[data-no-3d]').addClass(TC.Consts.classes.HIDDEN);
                    self.ctrlsToMng.forEach(function (ctl) {
                        ctl._$div.addClass(TC.Consts.classes.THREED);
                    });
                    break;
            }

            self.map3D.linked2DControls.legend = new TwoDLinkedLegend(self);
        };
        var getAllowedControlsLayer = function () {
            var self = this;

            var done = new $.Deferred();
            var workLayers = [];

            // obtengo de los controles habilitados en 3D y sus correspondientes capas 
            for (var i = 0; i < self.threeDControls.length; i++) {
                var ctl = self.threeDControls[i];
                ctl = ctl.substr(0, 1).toUpperCase() + ctl.substr(1);
                var ctrl = self.map.getControlsByClass('TC.control.' + ctl);
                if (ctrl && ctrl.length && ctrl[0].getLayer) {
                    workLayers.push(ctrl[0].getLayer());
                }
                else if (ctrl[0].layer) {
                    workLayers.push(ctrl[0].layer);
                } else if (ctrl[0].layers) {
                    ctrl[0].layers.forEach(function (elem) {
                        if (elem instanceof TC.layer.Vector) {
                            workLayers.push(elem);
                        }
                    });
                }
            }

            $.when.apply($, workLayers).then(function () {

                if (arguments && arguments.length) {

                    self.map3D.vector2DLayers = Array.prototype.slice.call(arguments, 0).filter(function (elem) {
                        return elem instanceof TC.layer.Vector;
                    });

                    self.map3D.vector2DLayers.forEach(function (layer) {
                        if (layer.features && layer.features.length) {
                            layer.features.forEach(function (feature) {
                                self.map3D.addFeature.call(self, feature);
                            });
                        }
                    });
                }

                done.resolve();
            });

            return done;
        };

        var override2DZoom = function (activate) {
            var self = this;

            var amount = 200.0;
            var initialExtent, zoomin, zoomout;

            var zoom = function (amount) {
                var self = this;

                var center = new Cesium.Cartesian2(
                    self.viewer.scene.canvas.clientWidth / 2,
                    self.viewer.scene.canvas.clientHeight / 2);

                self.map3D.zoomToCartesian.call(self, { endPosition: center }, amount);
            };

            if (activate) {
                initialExtent = function (e) {
                    var self = this;

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    var coordsXY = TC.Util.reproject(self.map.options.initialExtent.slice(0, 2), self.map.crs, self.map3D.crs);
                    var coordsXY2 = TC.Util.reproject(self.map.options.initialExtent.slice(2), self.map.crs, self.map3D.crs);
                    var rectangle = Cesium.Rectangle.fromDegrees(coordsXY[0], coordsXY[1], coordsXY2[0], coordsXY2[1]);

                    self.map3D.flyToRectangle.call(self, rectangle, { duration: 0.1 });

                    return false;

                }.bind(self);

                zoomin = function (e) {
                    zoom.call(self, amount);
                }.bind(self);

                zoomout = function (e) {
                    zoom.call(self, -amount);
                }.bind(self);

                $('.' + TC.control.NavBar.prototype.CLASS + '-btn-home').on('click', initialExtent);
                $('.' + TC.control.NavBar.prototype.CLASS + '-btn-zoomin').on('click', zoomin);
                $('.' + TC.control.NavBar.prototype.CLASS + '-btn-zoomout').on('click', zoomout);
            }
            else {
                $('.' + TC.control.NavBar.prototype.CLASS + '-btn-home').off('click', initialExtent);
                $('.' + TC.control.NavBar.prototype.CLASS + '-btn-zoomin').off('click', zoomin);
                $('.' + TC.control.NavBar.prototype.CLASS + '-btn-zoomout').off('click', zoomout);
            }
        };

        return {
            crs: 'EPSG:4326',
            crsPattern: /(EPSG\:?4326)/i,

            customRender: null,

            baseLayer: null,

            workLayers: [],
            vector2DLayers: [],
            vector2DFeatures: {},

            linked2DControls: {},

            isLoadingTiles: function () {
                var self = this;

                var surface = self.viewer.scene.globe['_surface'];
                return !surface['_tileProvider'].ready ||
                    surface['_tileLoadQueueHigh'].length > 0 ||
                    surface['_tileLoadQueueMedium'].length > 0 ||
                    surface['_tileLoadQueueLow'].length > 0 ||
                    surface['_debug']['tilesWaitingForChildren'] > 0;
            },

            loadTerrainProvider: function () {
                var self = this;
                if (!self.terrainProvider)
                    self.terrainProvider = new Cesium.CesiumTerrainProvider({
                        url: self.Consts.TERRAIN_URL,
                        requestWaterMask: true,
                        requestVertexNormals: true
                    });

                return self.terrainProvider;
            },
            loadViewer: function () {
                var self = this;
                var done = new $.Deferred();

                if (!self.viewer) {
                    getCesiumLibrary().then(function () {

                        var globe = new Cesium.Globe();
                        globe.baseColor = Cesium.Color.WHITE;
                        globe.enableLighting = true;

                        self.viewer = self.map3D.viewer = new Cesium.Viewer(self.selectors.divThreedMap, {
                            terrainProvider: self.map3D.loadTerrainProvider.call(self),
                            terrainExaggeration: 1.0,
                            terrainShadows: Cesium.ShadowMode.ENABLED,

                            animation: false,
                            timeline: false,
                            fullscreenButton: false,
                            baseLayerPicker: false,
                            imageryProvider: false,
                            navigationInstructionsInitiallyVisible: false,
                            navigationHelpButton: false,
                            geocoder: false,
                            homeButton: false,
                            infoBox: false,
                            sceneModePicker: false,
                            selectionIndicator: false,
                            globe: globe,
                            useDefaultRenderLoop: !self.options.customRender
                        });

                        if (self.options.customRender) {
                            // lanzamos el nuestro render                    
                            self.map3D.customRender = new CustomRender(self.map, self.viewer, self.isSlower);
                            self.map3D.customRender.start(self.options.isDebug || false);
                            self.map3D.customRender.parent = self;
                        }

                        self.viewer.readyPromise = new $.Deferred();

                        // personalización de la escena
                        self.viewer.scene.backgroundColor = Cesium.Color.WHITE;
                        self.viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
                        self.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 500000;
                        self.viewer.scene.globe.depthTestAgainstTerrain = true;

                        // borramos cualquier capa que haya
                        self.viewer.scene.imageryLayers.removeAll();

                        // registramos listeners para capturar errores del terreno y del render
                        self.viewer.terrainProvider.errorEvent.addEventListener(function (e) {
                            var self = this;

                            if (e.error) {
                                switch (e.error.statusCode) {
                                    case 403:
                                    case 404: break;
                                }
                            }
                        }, self);
                        self.viewer.scene.renderError.addEventListener(function (e) {
                            var self = this;

                            self.$divThreedMap.addClass(self.classes.LOADING);
                            self.map.toast('Error', { type: TC.Consts.msgType.ERROR });
                        }, self);

                        // controlamos la carga de tiles para mostrar loading cuando pida tiles
                        self.map3D.tileLoadingHandler = new Cesium.EventHelper();
                        self.map3D.tileLoadingHandler.add(self.viewer.scene.globe.tileLoadProgressEvent, function (data) {
                            if (!self.waiting)
                                self.waiting = self.map.getLoadingIndicator().addWait();

                            if (data === 0) {
                                self.map.getLoadingIndicator().removeWait(self.waiting);
                                delete self.waiting;

                                self.viewer.readyPromise.resolve();

                                self.$events.trigger(TC.Consts.event.TERRAINLOADED, {});
                            } else {
                                self.$events.trigger(TC.Consts.event.TERRAINRECEIVING, {});
                            }
                        }.bind(self));

                        // deshabilitamos el zoom por defecto y manejamos nosotros zoom con rueda
                        overrideDesktopZoom.call(self);
                        // sobrescribimos el comportamiento de lo botones + /- y la casita
                        override2DZoom.call(self, true);

                        // eliminamos los creditos de cesium (no encuentro la manera de que no los ponga)
                        $('.cesium-viewer-bottom').remove();

                        // enlazamos con los eventos del mapa 2D
                        self.map3D._event2DHandler = event2DHandler.bind(self);
                        self.map.on(listenTo.join(' '), self.map3D._event2DHandler);

                        // modificamos los controles disponibles
                        alterAllowedControls.call(self, self.direction.TO_THREE_D);

                        // obtenemos las capas de trabajo de los controles habilitados
                        getAllowedControlsLayer.call(self);

                        done.resolve(self.viewer);
                    });
                } else { done.resolve(self.viewer); }

                return done;
            },

            setBaseLayer: function (layer) {
                var self = this;

                if (!self.map3D.baseLayer) {

                    checkCompatibleBaseMaps.call(self, self.map);
                    removeNoCompatibleBaseLayers.call(self, self.map);

                    if (layer instanceof TC.layer.Raster) {

                        if (layer.options.relatedWMTS) {
                            self.map.baseLayer = layer = self.map.getLayer(layer.options.relatedWMTS);
                            self.map.$events.trigger($.Event(TC.Consts.event.BASELAYERCHANGE, { layer: self.map.baseLayer }));
                        } else if ((obj = analogLayers.findById(self.map.baseLayer.id)) != null) {
                            $.extend(obj, { map: self.map });
                            layer = new TC.layer.Raster(obj);
                            layer.isBase = true;
                        }

                        self.map3D.addLayer.call(self, layer);
                    }
                    else {
                        self.map3D.baseLayer = self.Consts.BLANK_BASE;
                    }
                } else {

                    if (self.map3D.baseLayer !== self.Consts.BLANK_BASE) {
                        self.viewer.scene.imageryLayers.raiseToTop(self.map3D.baseLayer);
                        self.viewer.scene.imageryLayers.remove(self.map3D.baseLayer, true);
                    }

                    if (layer instanceof TC.layer.Vector) {
                        self.map3D.baseLayer = self.Consts.BLANK_BASE;

                        self.map.getLoadingIndicator().removeWait(self.waiting);
                        delete self.waiting;
                    }
                    else {
                        if ((obj = analogLayers.findById(layer.id)) != null) {
                            $.extend(obj, { map: self.map });
                            layer = new TC.layer.Raster(obj);
                            layer.isBase = true;
                        }

                        self.map3D.addLayer.call(self, layer);
                    }
                }

                currentMapCfg.baseMap = self.map.baseLayer;
            },

            addLayer: function (layer) {
                var self = this;

                switch (true) {
                    case TC.Consts.layerType.VECTOR == layer.type: {
                        self.map3D.vector2DLayers.push(layer);
                        break;
                    }
                    case TC.Consts.layerType.WMTS == layer.type:
                    case TC.Consts.layerType.WMS == layer.type: {
                        if (!rasterConverter.isCompatible(layer)) {
                            self.map.toast(self.getLocaleString('threed.crsNoCompatible', { name: layer.layerNames }));
                        } else {
                            var convertedLayer = rasterConverter.convert(layer);
                            if (convertedLayer) {
                                var newImageryLayer = self.viewer.scene.imageryLayers.addImageryProvider(convertedLayer);

                                if (layer.isBase) { // si la capa es el mapa de fondo lo envío al fondo de las capas en 3D
                                    self.map3D.baseLayer = newImageryLayer;
                                    self.viewer.scene.imageryLayers.lowerToBottom(newImageryLayer);
                                } else {
                                    newImageryLayer.show = layer.getVisibility();
                                    newImageryLayer.alpha = layer.getOpacity();

                                    self.map3D.workLayers.push(newImageryLayer);

                                    self.map3D.linked2DControls.legend.refresh();
                                }
                            }
                        }
                        break;
                    }
                }
            },
            removeLayer: function (layer) {
                var self = this;

                switch (true) {
                    case TC.Consts.layerType.VECTOR == layer.type: {

                        if (self.map3D.vector2DFeatures && self.map3D.vector2DFeatures.hasOwnProperty(layer.id)) {
                            var threedFeature = self.map3D.vector2DFeatures[layer.id];

                            for (var i = 0; i < threedFeature.length; i++) {
                                self.map3D.removeFeature.call(self, threedFeature[i]);
                            }

                            delete self.map3D.vector2DFeatures[layer.id];
                        }

                        // GLS revisar, debería estar en workLayers¿? 
                        // self.map3D.workLayers.splice(i, 1);
                        break;
                    }
                    case TC.Consts.layerType.WMTS == layer.type:
                    case TC.Consts.layerType.WMS == layer.type: {
                        for (var i = 0; i < self.map3D.workLayers.length; i++) {
                            if (layer.names && self.map3D.workLayers[i].imageryProvider.layers.join(',') === layer.names.join(',') ||
                                layer.title && self.map3D.workLayers[i].imageryProvider.layers.join(',') === layer.title) {
                                self.viewer.scene.imageryLayers.raiseToTop(self.map3D.workLayers[i]);
                                self.viewer.scene.imageryLayers.remove(self.map3D.workLayers[i], true);

                                self.map3D.workLayers.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            },
            setRenderOptionsLayer: function (layer, options) {
                var self = this;

                switch (true) {
                    case TC.Consts.layerType.Vector == layer.type: {
                        if (self.map3D.vector2DFeatures[layer.id]) {
                            var features = self.map3D.vector2DFeatures[layer.id];
                            for (var i = 0; i < features.length; i++) {
                                self.map3D.setRenderOptionsFeature(features[i], { show: !features[i].show });
                            }
                        }
                        break;
                    }
                    case TC.Consts.layerType.WMTS == layer.type:
                    case TC.Consts.layerType.WMS == layer.type: {
                        for (var i = 0; i < self.map3D.workLayers.length; i++) {
                            if (layer.names && self.map3D.workLayers[i].imageryProvider.layers.join(',') === layer.names.join(',') ||
                                layer.title && self.map3D.workLayers[i].imageryProvider.layers.join(',') === layer.title) {

                                if (options.hasOwnProperty('visibility')) {
                                    self.map3D.workLayers[i].show = options.visibility;
                                }

                                if (options.hasOwnProperty('opacity')) {
                                    self.map3D.workLayers[i].alpha = options.opacity;
                                }
                                break;
                            }
                        }
                    }
                }
            },

            flyToMapCoordinates: function (coords) {
                var self = this;
                var lonlat = TC.Util.reproject(coords, self.map.crs, self.map3D.crs);
                var height = self.viewer.camera.positionCartographic.height;
                var destination = Cesium.Cartesian3.fromDegrees(lonlat[0], lonlat[1], height);

                var camera = self.viewer.camera;
                camera.flyTo({
                    destination: destination,
                    orientation: {
                        heading: camera.heading,
                        pitch: camera.pitch
                    }
                });
            },
            flyToRectangle: function (rectangle, options) {
                var self = this;
                var done = $.Deferred();

                options = options || {};

                var epsilon = Cesium.Math.EPSILON3;
                if (rectangle.east === rectangle.west) {
                    rectangle.east += epsilon;
                    rectangle.west -= epsilon;
                }

                if (rectangle.north === rectangle.south) {
                    rectangle.north += epsilon;
                    rectangle.south -= epsilon;
                }

                var enlargeFactor = 0.2;
                var marginX = rectangle.width * enlargeFactor / 2;
                var marginY = rectangle.height * enlargeFactor / 2;
                rectangle.east -= marginX;
                rectangle.west += marginY;
                rectangle.north += marginY;
                rectangle.south -= marginY;

                var scene = self.viewer.scene;
                var camera = scene.camera;

                var destinationCartesian = camera.getRectangleCameraCoordinates(rectangle);

                var destination = Cesium.Ellipsoid.WGS84.cartesianToCartographic(destinationCartesian);

                var terrainProvider = scene.globe.terrainProvider;
                var level = 6;
                var center = [Cesium.Rectangle.center(rectangle)];

                Cesium.sampleTerrain(terrainProvider, level, center).then(function (results) {

                    var finalDestinationCartographic = {
                        longitude: destination.longitude,
                        latitude: destination.latitude,
                        height: destination.height + results[0].height
                    };

                    var finalDestination = Cesium.Ellipsoid.WGS84.cartographicToCartesian(finalDestinationCartographic);

                    self.$events.one(TC.Consts.event.TERRAINLOADED, function () {

                        var withTerrainDestinationCartesian = camera.getRectangleCameraCoordinates(rectangle);
                        var withTerrainDestinationCarto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(withTerrainDestinationCartesian);

                        var height = self.viewer.scene.globe.getHeight(withTerrainDestinationCarto);

                        var withTerrainFinalCartographic = {
                            longitude: withTerrainDestinationCarto.longitude,
                            latitude: withTerrainDestinationCarto.latitude,
                            height: withTerrainDestinationCarto.height + height
                        };

                        var withTerrainFinalDestination = Cesium.Ellipsoid.WGS84.cartographicToCartesian(withTerrainFinalCartographic);

                        camera.flyTo({
                            duration: 3,
                            destination: withTerrainFinalDestination,
                            complete: function () {
                                var angle = Cesium.Math.toRadians(50);
                                var pickBP = pickBottomPoint(this.viewer.scene);
                                pickBP = Cesium.Matrix4.fromTranslation(pickBP);

                                this.map3D.rotateAroundAxis(this.viewer.scene.camera, -angle, this.viewer.scene.camera.right, pickBP, {
                                    duration: 250,
                                    callback: function () {
                                        done.resolve();
                                    }
                                });
                            }.bind(self)
                        });
                    });

                    camera.flyTo({
                        duration: options.duration || 1,
                        destination: finalDestination,
                        complete: function () {
                            if (!self.map3D.isLoadingTiles.call(self)) {
                                self.$events.trigger(TC.Consts.event.TERRAINLOADED, {});
                            }
                        }
                    });
                });

                return done;
            },

            zoomToCartesian: function (position, amount) {
                var self = this;
                var scene = self.viewer.scene;

                if (!position || !position.endPosition) {
                    var canvas = scene.canvas;
                    var center = new Cesium.Cartesian2(
                        canvas.clientWidth / 2,
                        canvas.clientHeight / 2);
                    position = { endPosition: center };
                }

                var pickRay = scene.camera.getPickRay(position.endPosition);
                var intersection = scene.globe.pick(pickRay, scene);
                if (intersection) {

                    var distanceMeasure = Cesium.Cartesian3.distance(pickRay.origin, intersection);
                    if (distanceMeasure < 1) { return; }
                    else {
                        if (!self.map3D._zoomTo) {
                            self.map3D._zoomTo = {
                                amount: 0
                            };
                        }
                        self.map3D._zoomTo.direction = amount > 0 ? 1 : 0;
                        self.map3D._zoomTo.amount += (distanceMeasure * 5 / 100);
                        self.map3D._zoomTo.endPosition = position.endPosition;
                    }
                }

                var setNewPosition = function (data) {
                    var self = this;
                    var scene = self.viewer.scene;

                    var pickRay = scene.camera.getPickRay(position.endPosition || data.endPosition);
                    var intersection = scene.globe.pick(pickRay, scene);
                    if (intersection) {

                        var distanceMeasure = Cesium.Cartesian3.distance(pickRay.origin, intersection);
                        if (distanceMeasure < 1) { return; }
                        else {

                            var cameraPosition = scene.camera.position;
                            var cameraDirection = scene.camera.direction;

                            var toMove = toGo = new Cesium.Cartesian3();
                            Cesium.Cartesian3.multiplyByScalar(pickRay.direction, data.direction == 1 ? data.amount : -data.amount, toMove);
                            Cesium.Cartesian3.add(cameraPosition, toMove, toGo);

                            var ray = new Cesium.Ray(toGo, pickRay.direction);
                            var intersectionToGo = scene.globe.pick(ray, scene);
                            if (intersectionToGo) {

                                var reset = function () {
                                    this.map3D._zoomTo = {
                                        direction: 1,
                                        amount: 0,
                                        endPosition: {}
                                    };

                                    return;
                                };

                                if (Cesium.Cartesian3.distance(toGo, intersectionToGo) < 1 ||
                                    Math.abs(Cesium.Ellipsoid.WGS84.cartesianToCartographic(toGo).height) < scene.screenSpaceCameraController.minimumZoomDistance) {
                                    reset.call(self);
                                }
                                else {
                                    self.viewer.camera.flyTo({
                                        destination: toGo,
                                        orientation: {
                                            heading: scene.camera.heading,
                                            pitch: scene.camera.pitch,
                                            roll: scene.camera.roll
                                        },
                                        duration: 1,
                                        easingFunction: Cesium.EasingFunction.LINEAR_NONE,
                                        complete: function (distance) {
                                            this.map3D._zoomTo = {
                                                direction: 1,
                                                amount: 0,
                                                endPosition: {}
                                            };
                                        }.bind(self, Cesium.Cartesian3.distance(toGo, intersectionToGo))
                                    });
                                }
                            }
                        }
                    }
                };

                setTimeout(function () { // GLS: No hemos encontrado otra forma para acumular pasos de la rueda
                    setNewPosition.call(self, self.map3D._zoomTo);
                }.bind(self), 50);
            },

            rotateAroundAxis: function (camera, angle, axis, transform, opt_options) {
                return rotateAroundAxis(camera, angle, axis, transform, opt_options);
            },

            addFeature: function (feature, options) {
                var self = this;

                if (self.map3D.linked2DControls.featureInfo) {
                    if (feature.layer === self.map3D.linked2DControls.featureInfo.layer && feature instanceof TC.feature.Marker) {
                        return;
                    }
                }

                if (self.map3D.vector2DLayers.indexOf(feature.layer) > -1) {

                    var csfeature = featureConverter.convert(self.viewer.scene, feature, self.map.crs, self.map3D.crs);
                    if (csfeature) {
                        if (csfeature.geometry instanceof Array) {
                            csfeature.geometry.forEach(function (geom) {
                                geom = addFeature.call(self, geom);
                                linkFeature(self.map3D, feature.layer.id, geom);
                            });
                        }
                        else {
                            var geom = addFeature.call(self, csfeature.geometry);
                            linkFeature(self.map3D, feature.layer.id, geom);
                        }
                    }
                }
            },
            removeFeature: function (feature) {
                var self = this;

                if (feature) {
                    switch (true) {
                        case feature instanceof Cesium.GroundPrimitive:
                            self.viewer.scene.groundPrimitives.remove(feature);
                            break;
                        case feature instanceof Cesium.Billboard:
                            self.viewer.billboardCollection.remove(feature);
                            break;
                        case feature instanceof Object:
                            self.viewer.entities.removeById(feature.id);
                            break;
                    }

                    self.map3D.customRender.restart();
                }
            },
            setRenderOptionsFeature: function (feature, options) {
                if (feature) {
                    feature.show = options.show;
                }
            },

            addNativeFeature: function (cesiumFeature) {
                return addFeature.call(this, cesiumFeature);
            },

            setCameraFromMapView: function () {
                var self = this;

                var center = self.mapView.getCenter();

                if (!center) {
                    return;
                }

                var latlon = TC.Util.reproject(center, self.map.crs, self.map3D.crs);
                var distance = calcDistanceForResolution.call(self, self.mapView.getResolution() || 0, Cesium.Math.toRadians(latlon[0]));

                var latlon = TC.Util.reproject(center, self.map.crs, self.map3D.crs);
                var carto = new Cesium.Cartographic(Cesium.Math.toRadians(latlon[0]), Cesium.Math.toRadians(latlon[1]));
                if (self.viewer.scene.globe) {
                    carto.height = self.viewer.scene.globe.getHeight(carto) || 0;
                }

                var destination = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
                var orientation = {
                    pitch: Cesium.Math.toRadians(-90),
                    heading: -self.mapView.getRotation(),
                    roll: 0.0
                };

                self.viewer.camera.setView({
                    destination: destination,
                    orientation: orientation
                });

                self.viewer.camera.moveBackward(distance);
            },
            setViewFromCameraView: function () {
                var self = this;

                if (!self.setViewFromCameraViewInProgress || self.setViewFromCameraViewInProgress.state() == "resolved") {
                    self.setViewFromCameraViewInProgress = new $.Deferred();

                    var ellipsoid = Cesium.Ellipsoid.WGS84;
                    var scene = self.viewer.scene;
                    var target = target_ = pickCenterPoint(scene);

                    if (!target_) {
                        var globe = self.viewer.scene.globe;
                        var carto = self.viewer.camera.positionCartographic.clone();
                        var height = globe.getHeight(carto);
                        carto.height = height || 0;
                        target_ = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
                    }


                    var distance = Cesium.Cartesian3.distance(target_, self.viewer.camera.position);
                    var targetCartographic = ellipsoid.cartesianToCartographic(target_);

                    var centerMapCRS = TC.Util.reproject(
                        [Cesium.Math.toDegrees(targetCartographic.longitude), Cesium.Math.toDegrees(targetCartographic.latitude)],
                        self.map3D.crs, self.map.crs);

                    self.mapView.setCenter(centerMapCRS);

                    self.mapView.setResolution(calcResolutionForDistance.call(self, distance, targetCartographic ? targetCartographic.latitude : 0));

                    self.setViewFromCameraViewInProgress.resolve();
                    // GLS: No tenemos la rotación del mapa activada por problemas con el iPad
                    //if (target) {
                    //    var pos = self.viewer.camera.position;

                    //    var targetNormal = new Cesium.Cartesian3();
                    //    ellipsoid.geocentricSurfaceNormal(target, targetNormal);

                    //    var targetToCamera = new Cesium.Cartesian3();
                    //    Cesium.Cartesian3.subtract(pos, target, targetToCamera);
                    //    Cesium.Cartesian3.normalize(targetToCamera, targetToCamera);

                    //    // HEADING
                    //    var up = self.viewer.camera.up;
                    //    var right = self.viewer.camera.right;
                    //    var normal = new Cesium.Cartesian3(-target.y, target.x, 0);
                    //    var heading = Cesium.Cartesian3.angleBetween(right, normal);
                    //    var cross = Cesium.Cartesian3.cross(target, up, new Cesium.Cartesian3());
                    //    var orientation = cross.z;

                    //    self.mapView.setRotation((orientation < 0 ? heading : -heading));
                    //    self.setViewFromCameraViewInProgress.resolve();
                    //}
                }

                return self.setViewFromCameraViewInProgress;
            },

            getInfoOnPickedPosition: function (pickedPosition) {
                var self = this;

                if (!pickedPosition) {
                    return;
                } else {

                    self.map.one(TC.Consts.event.DRAWTABLE, function (e) {
                        self.map.getLoadingIndicator().removeWait(self.waiting);
                        delete self.waiting;
                    });

                    self.map3D.linked2DControls.featureInfo.send.call(self, pickedPosition).then(function (e) {
                        self.map.getLoadingIndicator().removeWait(self.waiting);
                        delete self.waiting;
                    });
                }
            },

            destroy: function () {
                var self = this;

                // paramos nuestro render
                self.map3D.customRender.stop();
                self.map3D.vector2DLayers = [];
                self.map3D.vector2DFeatures = {};

                // eliminamos el enlace con los eventos del mapa 2D
                self.map.off(listenTo.join(' '), self.map3D._event2DHandler);

                // modificamos los controles disponibles
                alterAllowedControls.call(self, self.direction.TO_TWO_D);

                // sobrescribimos el comportamiento de lo botones + /- y la casita
                override2DZoom.call(self, false);

                addNoCompatibleBaseLayers();

                self.map.baseLayer = currentMapCfg.baseMap == self.Consts.BLANK_BASE ? currentMapCfg.baseVector : currentMapCfg.baseMap;
                self.map.$events.trigger($.Event(TC.Consts.event.BASELAYERCHANGE, { layer: self.map.baseLayer }));
                currentMapCfg.baseMap = '';

                self.map3D.baseLayer = null;

                self.map3D.workLayers = [];

                self.cameraControls.unbind();

                if (self.map3D.linked2DControls.featureInfo) {
                    self.map3D.linked2DControls.featureInfo.clear(self.map);
                }

                self.map3D.tileLoadingHandler.removeAll();
                delete self.map3D.tileLoadingHandler;
            }
        }
    })();

    ctlProto.browserSupportWebGL = function () {
        var self = this;
        var result = false;

        //Check for webgl support and if not, then fall back to leaflet
        if (!window.WebGLRenderingContext) {
            // Browser has no idea what WebGL is. Suggest they
            // get a new browser by presenting the user with link to
            // http://get.webgl.org
            result = false;
        } else {
            var canvas = document.createElement('canvas');

            var webglOptions = {
                alpha: false,
                stencil: false,
                failIfMajorPerformanceCaveat: true
            };

            try {
                var gl = canvas.getContext("webgl", webglOptions) ||
                    canvas.getContext("experimental-webgl", webglOptions) ||
                    canvas.getContext("webkit-3d", webglOptions) ||
                    canvas.getContext("moz-webgl", webglOptions);
                if (!gl) {
                    // We couldn't get a WebGL context without a major performance caveat.  Let's see if we can get one at all.
                    webglOptions.failIfMajorPerformanceCaveat = false;
                    gl = canvas.getContext("webgl", webglOptions) ||
                        canvas.getContext("experimental-webgl", webglOptions) ||
                        canvas.getContext("webkit-3d", webglOptions) ||
                        canvas.getContext("moz-webgl", webglOptions);
                    if (!gl) {
                        // No WebGL at all.
                        result = false;
                    } else {
                        // We can do WebGL, but only with software rendering (or similar).
                        result = 'slow';
                        self.isSlower = true;
                    }
                } else {
                    // WebGL is good to go!
                    result = true;
                }
            } catch (e) {
                console.log(E);
            }

            if (result === "slow" || !result) {
                var warning = result === "slow" ? "threed.slowSupport.supported" : "threed.not.supported";
                self.map.toast(self.getLocaleString(warning), {
                    type: TC.Consts.msgType.WARNING,
                    duration: 10000
                });
            }

            return result;
        }
    };
})();
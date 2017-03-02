TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}
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

    TC.control.ThreeD = function () {
        var self = this;

        TC.Control.apply(self, arguments);

        self.crs = 'EPSG:4326';
        self.crsPattern = /(EPSG\:?4326)/i;

        self.currentMapCfg = {
            baseMap: '',
            baseMaps: [],
            baseVector: ''
        };

        self.workLayers = [];

        self.selectors = {
            divThreedMap: self.options.divMap
        };

        self.Consts = {
            BLANK_BASE: 'blank',
            DEFAULT_TILE_SIZE: 256
        };
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
        OUTFOCUS: 'outfocus'
    };
    ctlProto.direction = {
        TO_TWO_D: 'two_d',
        TO_THREE_D: 'three_d'
    };
    ctlProto.threeDControls = [
        "attribution",
        "basemapSelector",
        "listTOC",
        "selectContainer",
        "externalWMS",
        "layerCatalog",
        "click",
        "fullScreen",
        "loadingIndicator",
        "navBar",
        "state",
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
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<button class=\"tc-ctl-threed-btn\" title=\"").h("i18n", ctx, {}, { "$key": "threed.tip" }).w("\"></button>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-overlay'] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-threed-overlay\" hidden><svg class=\"tc-ctl-threed-overlay-svg\"><defs><filter id=\"fGaussian\" x=\"0\" y=\"0\"><feGaussianBlur in=\"SourceGraphic\" stdDeviation=\"3\" /></filter></defs><rect width=\"100%\" height=\"100%\" fill=\"white\" fill-opacity=\"0.5\" filter=\"url(#fGaussian)\" /> </svg> </div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-cm-ctls'] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div><div class=\"tc-ctl-threed-cm-tilt\"> <button class=\"tc-ctl-threed-cm-up-arrow\" title=\"").h("i18n", ctx, {}, { "$key": "threed.tilt.left" }).w("\"><img src=\"data:image/png;base64,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\" /></button><div><svg width=\"95\" height=\"95\" viewBox=\"0 0 145 145\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><defs><pattern id='video' width=\"100%\" height=\"100%\" viewBox=\"25 27 100 100\"><image x=\"40\" y=\"40\" height=\"65\" width=\"65\" xlink:href='data:image/png;base64,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'></image></pattern></defs><g class=\"tc-ctl-threed-cm-tilt-outer tc-ctl-threed-cm-tilt-outer-circle\"> <title>").h("i18n", ctx, {}, { "$key": "threed.rotate.drag" }).w("</title> <path d=\" M 72.5,20.21875 c -28.867432,0 -52.28125,23.407738 -52.28125,52.28125 0,28.87351 23.413818,52.3125 52.28125,52.3125 28.86743,0 52.28125,-23.43899 52.28125,-52.3125 0,-28.873512 -23.41382,-52.28125 -52.28125,-52.28125 z M 72.5,39.40625 c 18.297686,0 33.125,14.791695 33.125,33.09375 0,18.302054 -14.827314,33.125 -33.125,33.125 -18.297687,0 -33.09375,-14.822946 -33.09375,-33.125 0,-18.302056 14.796063,-33.09375 33.09375,-33.09375 z \"></path></g> <g class=\"tc-ctl-threed-cm-tilt-outer tc-ctl-threed-cm-tilt-outer-shell-circle\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.drag" }).w("</title><path d=\"M 72.5,20.21875 c -28.867432,0 -52.28125,23.407738 -52.28125,52.28125 0,28.87351 23.413818,52.3125 52.28125,52.3125 28.86743,0 52.28125,-23.43899 52.28125,-52.3125 0,-28.873512 -23.41382,-52.28125 -52.28125,-52.28125 z m 0,1.75 c 13.842515,0 26.368948,5.558092 35.5,14.5625 l -11.03125,11 0.625,0.625 11.03125,-11 c 8.9199,9.108762 14.4375,21.579143 14.4375,35.34375 0,13.764606 -5.5176,26.22729 -14.4375,35.34375 l -11.03125,-11 -0.625,0.625 11.03125,11 c -9.130866,9.01087 -21.658601,14.59375 -35.5,14.59375 -13.801622,0 -26.321058,-5.53481 -35.4375,-14.5 l 11.125,-11.09375 c 6.277989,6.12179 14.857796,9.90625 24.3125,9.90625 19.241896,0 34.875,-15.629154 34.875,-34.875 0,-19.245847 -15.633104,-34.84375 -34.875,-34.84375 -9.454704,0 -18.034511,3.760884 -24.3125,9.875 L 37.0625,36.4375 C 46.179178,27.478444 58.696991,21.96875 72.5,21.96875 z m -0.875,0.84375 0,13.9375 1.75,0 0,-13.9375 -1.75,0 z M 36.46875,37.0625 47.5625,48.15625 C 41.429794,54.436565 37.65625,63.027539 37.65625,72.5 c 0,9.472461 3.773544,18.055746 9.90625,24.34375 L 36.46875,107.9375 c -8.96721,-9.1247 -14.5,-21.624886 -14.5,-35.4375 0,-13.812615 5.53279,-26.320526 14.5,-35.4375 z M 72.5,39.40625 c 18.297686,0 33.125,14.791695 33.125,33.09375 0,18.302054 -14.827314,33.125 -33.125,33.125 -18.297687,0 -33.09375,-14.822946 -33.09375,-33.125 0,-18.302056 14.796063,-33.09375 33.09375,-33.09375 z M 22.84375,71.625 l 0,1.75 13.96875,0 0,-1.75 -13.96875,0 z m 85.5625,0 0,1.75 14,0 0,-1.75 -14,0 z M 71.75,108.25 l 0,13.9375 1.71875,0 0,-13.9375 -1.71875,0 z\"></path>\t</g><g class=\"tc-ctl-threed-cm-tilt-indicator\" hidden><path d=\"M 36.46875,37.0625 47.5625,48.15625 C 41.429794,54.436565 37.65625,63.027539 37.65625,72.5 c 0,9.472461 3.773544,18.055746 9.90625,24.34375 L 36.46875,107.9375 c -8.96721,-9.1247 -14.5,-21.624886 -14.5,-35.4375 0,-13.812615 5.53279,-26.320526 14.5,-35.4375 z\"></path></g><g class=\"tc-ctl-threed-cm-tilt-inner\"><title>").h("i18n", ctx, {}, { "$key": "threed.tilt.reset" }).w("</title><path d=\"M 72.5,39.40625 c 18.297686,0 33.125,14.791695 33.125,33.09375 0,18.302054 -14.827314,33.125 -33.125,33.125 -18.297687,0 -33.09375,-14.822946 -33.09375,-33.125 0,-18.302056 14.796063,-33.09375 33.09375,-33.09375 z\"></path></g></svg> </div> <button class=\"tc-ctl-threed-cm-down-arrow\" title=\"").h("i18n", ctx, {}, { "$key": "threed.tilt.right" }).w("\"><img src=\"data:image/png;base64,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\" /></button> </div><div class=\"tc-ctl-threed-cm-rotate\"><div class=\"tc-ctl-threed-cm-rotate-buttons\"><button class=\"tc-ctl-threed-cm-left-arrow\" title=\"").h("i18n", ctx, {}, { "$key": "threed.rotate.left" }).w("\"><img src=\"data:image/png;base64,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\" /></button><button class=\"tc-ctl-threed-cm-right-arrow\" title=\"").h("i18n", ctx, {}, { "$key": "threed.rotate.right" }).w("\"><img src=\"data:image/png;base64,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\" /></button></div> <div><svg width=\"95\" height=\"95\" viewBox=\"0 0 145 145\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"><defs><pattern id='arrow' width=\"100%\" height=\"100%\" viewBox=\"22 30 100 100\"><image x=\"40\" y=\"40\" height=\"65\" width=\"65\" xlink:href='data:image/png;base64,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'></image></pattern></defs><g class=\"tc-ctl-threed-cm-rotate-outer tc-ctl-threed-cm-rotate-outer-circle\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.drag" }).w("</title><path d=\" M 72.5,20.21875 c -28.867432,0 -52.28125,23.407738 -52.28125,52.28125 0,28.87351 23.413818,52.3125 52.28125,52.3125 28.86743,0 52.28125,-23.43899 52.28125,-52.3125 0,-28.873512 -23.41382,-52.28125 -52.28125,-52.28125 z M 72.5,39.40625 c 18.297686,0 33.125,14.791695 33.125,33.09375 0,18.302054 -14.827314,33.125 -33.125,33.125 -18.297687,0 -33.09375,-14.822946 -33.09375,-33.125 0,-18.302056 14.796063,-33.09375 33.09375,-33.09375 z \"></path></g> <g class=\"tc-ctl-threed-cm-rotate-outer tc-ctl-threed-cm-rotate-outer-shell-circle\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.drag" }).w("</title><path d=\"M 72.5,20.21875 c -28.867432,0 -52.28125,23.407738 -52.28125,52.28125 0,28.87351 23.413818,52.3125 52.28125,52.3125 28.86743,0 52.28125,-23.43899 52.28125,-52.3125 0,-28.873512 -23.41382,-52.28125 -52.28125,-52.28125 z m 0,1.75 c 13.842515,0 26.368948,5.558092 35.5,14.5625 l -11.03125,11 0.625,0.625 11.03125,-11 c 8.9199,9.108762 14.4375,21.579143 14.4375,35.34375 0,13.764606 -5.5176,26.22729 -14.4375,35.34375 l -11.03125,-11 -0.625,0.625 11.03125,11 c -9.130866,9.01087 -21.658601,14.59375 -35.5,14.59375 -13.801622,0 -26.321058,-5.53481 -35.4375,-14.5 l 11.125,-11.09375 c 6.277989,6.12179 14.857796,9.90625 24.3125,9.90625 19.241896,0 34.875,-15.629154 34.875,-34.875 0,-19.245847 -15.633104,-34.84375 -34.875,-34.84375 -9.454704,0 -18.034511,3.760884 -24.3125,9.875 L 37.0625,36.4375 C 46.179178,27.478444 58.696991,21.96875 72.5,21.96875 z m -0.875,0.84375 0,13.9375 1.75,0 0,-13.9375 -1.75,0 z M 36.46875,37.0625 47.5625,48.15625 C 41.429794,54.436565 37.65625,63.027539 37.65625,72.5 c 0,9.472461 3.773544,18.055746 9.90625,24.34375 L 36.46875,107.9375 c -8.96721,-9.1247 -14.5,-21.624886 -14.5,-35.4375 0,-13.812615 5.53279,-26.320526 14.5,-35.4375 z M 72.5,39.40625 c 18.297686,0 33.125,14.791695 33.125,33.09375 0,18.302054 -14.827314,33.125 -33.125,33.125 -18.297687,0 -33.09375,-14.822946 -33.09375,-33.125 0,-18.302056 14.796063,-33.09375 33.09375,-33.09375 z M 22.84375,71.625 l 0,1.75 13.96875,0 0,-1.75 -13.96875,0 z m 85.5625,0 0,1.75 14,0 0,-1.75 -14,0 z M 71.75,108.25 l 0,13.9375 1.71875,0 0,-13.9375 -1.71875,0 z\"></path>\t</g><g class=\"tc-ctl-threed-cm-rotate-inner\"><title>").h("i18n", ctx, {}, { "$key": "threed.rotate.reset" }).w("</title><path d=\"M 72.5,39.40625 c 18.297686,0 33.125,14.791695 33.125,33.09375 0,18.302054 -14.827314,33.125 -33.125,33.125 -18.297687,0 -33.09375,-14.822946 -33.09375,-33.125 0,-18.302056 14.796063,-33.09375 33.09375,-33.09375 z\"></path></g></svg> </div> </div><div class=\"tc-ctl-threed-cm-help\"></div></div>"); } body_0.__dustBody = !0; return body_0 };
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

            self.beforeBaseLayerChanged = self.BaseMap.Events.beforeBaseLayerChanged.bind(self);
            self.baseLayerChanged = self.BaseMap.Events.baseLayerChanged.bind(self);

            self.layerAdded = self.Layer.Events.layerAdded.bind(self);
            self.layerRemoved = self.Layer.Events.layerRemoved.bind(self);
            self.layerVisibility = self.Layer.Events.layerVisibility.bind(self);
            self.layerOpacity = self.Layer.Events.layerOpacity.bind(self);
            self.layerOrder = self.Layer.Events.layerOrder.bind(self);

            self.initialExtent = self.OverrideControls.Events.initialExtent.bind(self);
            self.zoomin = self.OverrideControls.Events.zoomin.bind(self);
            self.zoomout = self.OverrideControls.Events.zoomout.bind(self);

            self.$button = self._$div.find('.' + self.CLASS + '-btn');

            self.$button.on(TC.Consts.event.CLICK, function () {

                self.$button.attr('disabled', 'disabled');

                if (!self.waitting)
                    self.waitting = self.map.getLoadingIndicator().addWait();

                var ctls = [];
                for (var i = 0, len = self.threeDControls.length; i < len; i++) {
                    var ctl = self.threeDControls[i];
                    ctl = ctl.substr(0, 1).toUpperCase() + ctl.substr(1);
                    ctls = ctls.concat(self.map.getControlsByClass('TC.control.' + ctl));
                }

                self.ctrlsToMng = ctls;

                if (!self.mapIs3D) {
                    if (self.Util.browserSupportWebGL.call(self) || !self.Util.browserSupportWebGL.call(self)) {
                        self.mapIs3D = true;

                        self.overlay.removeAttr('hidden');
                        self.overlay.appendTo(self.map._$div.parent());

                        self.map._$div.addClass(TC.Consts.classes.THREED);

                        self.$divThreedMap = $('#' + self.selectors.divThreedMap);
                        self.$divThreedMap.addClass(self.classes.MAPTHREED);
                        self.$divThreedMap.addClass(self.classes.LOADING);

                        self.$button.attr('title', self.getLocaleString("threed.two.tip"));
                        self.$button.removeClass(self.classes.BETA);

                        self.Cesium.getViewer.call(self).then(function (cesiumViewer) {

                            self.$divThreedMap.removeClass("tc-ctl-threed-divMap-fadeOut").addClass("tc-ctl-threed-divMap-fadeIn");
                            $(self.mapView.viewHTML).removeClass("tc-ctl-threed-divMap-fadeIn").addClass("tc-ctl-threed-divMap-fadeOut");

                            self.$divThreedMap.removeClass(self.classes.LOADING);
                            self.$button.toggleClass(self.classes.BTNACTIVE);

                            self.OverrideControls.adapter.call(self, self.direction.TO_THREE_D);
                            self.Cesium.setCameraFromMapView.call(self);
                            self.BaseMap.synchronizer.call(self, self.direction.TO_THREE_D);
                            self.Layer.synchronizer.call(self);

                            $.when(self.viewer.readyPromise).then(function () {

                                if (!self.cameraControls) self.cameraControls = new CameraControls(self);
                                else self.cameraControls.render.call(self.cameraControls);

                                var angle = Cesium.Math.toRadians(50);
                                var pickBP = self.Cesium.Util.pickBottomPoint(self.viewer.scene);
                                pickBP = Cesium.Matrix4.fromTranslation(pickBP);

                                var animationCallback = function () {

                                    self.$button.removeAttr('disabled');

                                    self.overlay.attr('hidden', 'hidden');
                                    self.map.getLoadingIndicator().removeWait(self.waitting);
                                    delete self.waitting;
                                };

                                self.Cesium.Util.rotateAroundAxis(self.viewer.scene.camera, -angle, self.viewer.scene.camera.right, pickBP, {
                                    duration: 2000,
                                    callback: animationCallback
                                });
                            }.bind(self));

                            self.map.on(TC.Consts.event.BEFOREBASELAYERCHANGE, self.beforeBaseLayerChanged);
                            self.map.on(TC.Consts.event.BASELAYERCHANGE, self.baseLayerChanged);

                            self.map.on(TC.Consts.event.LAYERADD, self.layerAdded);
                            self.map.on(TC.Consts.event.LAYERREMOVE, self.layerRemoved);
                            self.map.on(TC.Consts.event.LAYERVISIBILITY, self.layerVisibility);
                            self.map.on(TC.Consts.event.LAYEROPACITY, self.layerOpacity);
                            self.map.on(TC.Consts.event.LAYERORDER, self.layerOrder);

                            $('.tc-ctl-nav-btn-home').on('click', self.initialExtent);
                            $('.tc-ctl-nav-btn-zoomin').on('click', self.zoomin);
                            $('.tc-ctl-nav-btn-zoomout').on('click', self.zoomout);
                        });
                    }
                } else {

                    self.cameraControls.resetRotation({ duration: 1000 }).then(function () {

                        var animationCallback = function () {

                            self.mapIs3D = false;

                            self.map._$div.removeClass(TC.Consts.classes.THREED);

                            self.$button.attr('title', self.getLocaleString("threed.tip"));
                            //self.$button.addClass(self.classes.BETA);

                            // paramos nuestro render
                            self.Cesium.CustomRender.stop();

                            self.map.off(TC.Consts.event.BEFOREBASELAYERCHANGE, self.beforeBaseLayerChanged);
                            self.map.off(TC.Consts.event.BASELAYERCHANGE, self.baseLayerChanged);

                            self.map.off(TC.Consts.event.LAYERADD, self.layerAdded);
                            self.map.off(TC.Consts.event.LAYERREMOVE, self.layerRemoved);
                            self.map.off(TC.Consts.event.LAYERVISIBILITY, self.layerVisibility);
                            self.map.off(TC.Consts.event.LAYEROPACITY, self.layerOpacity);
                            self.map.off(TC.Consts.event.LAYERORDER, self.layerOrder);

                            $('.tc-ctl-nav-btn-home').off('click', self.initialExtent);
                            $('.tc-ctl-nav-btn-zoomin').off('click', self.zoomin);
                            $('.tc-ctl-nav-btn-zoomout').off('click', self.zoomout);

                            self.OverrideControls.adapter.call(self, self.direction.TO_TWO_D);
                            self.BaseMap.synchronizer.call(self, self.direction.TO_TWO_D);
                            self.Util.reset3D.call(self);

                            self.Cesium.setViewFromCameraView.call(self).then(function () {
                                self.$divThreedMap.removeClass(self.classes.MAPTHREED);

                                self.$divThreedMap.removeClass("tc-ctl-threed-divMap-fadeIn").addClass("tc-ctl-threed-divMap-fadeOut");
                                $(self.mapView.viewHTML).removeClass("tc-ctl-threed-divMap-fadeOut").addClass("tc-ctl-threed-divMap-fadeIn");

                                self.viewer.destroy();
                                self.viewer = null;

                                self.$button.removeAttr('disabled');
                                self.$button.toggleClass(self.classes.BTNACTIVE);

                                self.map.getLoadingIndicator().removeWait(self.waitting);
                                delete self.waitting;
                            });
                        };

                        var bottom = self.Cesium.Util.pickBottomPoint(self.viewer.scene);
                        var transform = Cesium.Matrix4.fromTranslation(bottom);
                        var angle = self.Cesium.Util.computeAngleToZenith(self.viewer.scene, bottom);

                        self.Cesium.Util.rotateAroundAxis(self.viewer.scene.camera, -angle, self.viewer.scene.camera.right, transform, {
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
        this.map = map;
        this.parent = parent;

        $.when(this.map.getViewHTML()).then(function (html) {
            this.viewHTML = html;
        }.bind(this));

        this.proj4Obj = proj4(this.map.crs);
        this.proj4Obj.oProj.METERS_PER_UNIT = 1;

        this.maxResolution;
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
    MapView.prototype.setCenter = function (center) {
        this.map.setCenter(center);
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

    CameraControls = function (parent) {
        var self = this;

        self.parent = parent;

        var outHandler = function () {
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
                self.$imgs.css({ 'opacity': '1' });
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

            if (self.parent.Cesium.arePendingTiles.call(self.parent))
                self.customCollisionDetection();

            if (self.moving) {

                cssRotate(self.$tiltIndicator, self.getCamera().pitch);
                cssRotate(self.$rotateIndicator, -self.getCamera().heading);

                self.disableTilt(5);
            }
        };
        var cssRotate = function (element, angle) {
            var value = 'rotate(' + angle + 'rad)';
            element.css({
                '-ms-transform': value,
                '-webkit-transform': value,
                'transform': value
            });
        };

        self.outControls = outHandler.bind(self);
        self.inControls = inHandler.bind(self);

        self.moveStart = moveStartHandler.bind(self);
        self.moveEnd = moveEndHandler.bind(self);
        self.postRender = postRenderHandler.bind(self);

        self.selectors = {
            tilt: '-cm-tilt',
            rotate: '-cm-rotate',
            indicator: '-indicator',
            leftArrow: '-cm-left-arrow',
            rightArrow: '-cm-right-arrow',
            downArrow: '-cm-down-arrow',
            upArrow: '-cm-up-arrow'
        };

        self.render();
    };
    CameraControls.prototype.bind = function () {
        var self = this;

        // conexi\u00f3n de los controles con el visor de cesium
        self.getCamera().moveStart.addEventListener(self.moveStart);
        self.getCamera().moveEnd.addEventListener(self.moveEnd);
        self.parent.viewer.scene.postRender.addEventListener(self.postRender);

        // gestionamos la opacidad de los controles pasados 5 segundos
        self.$div.on(TC.Util.detectMouse() ? 'mouseout' : 'touchleave, touchend', self.outControls);
        self.$div.on(TC.Util.detectMouse() ? 'mouseover' : 'touchmove, touchstart', self.inControls);

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
                    self.$imgs.css({ 'opacity': '0.2' });
                }
            }

            self.rAFInOutControls = requestAnimationFrame(setOpacity);
        }
        self.rAFInOutControls = requestAnimationFrame(setOpacity);
    };
    CameraControls.prototype.unbind = function () {
        var self = this;

        self.$div.addClass(TC.Consts.classes.HIDDEN);

        // conexi\u00f3n de los controles con el visor de cesium
        self.getCamera().moveStart.removeEventListener(self.moveStart);
        self.getCamera().moveEnd.removeEventListener(self.moveEnd);
        self.parent.viewer.scene.postRender.removeEventListener(self.postRender);

        // gestionamos la opacidad de los controles pasados 5 segundos
        self.$div.off(TC.Util.detectMouse() ? 'mouseout' : 'touchleave, touchend', self.outControls);
        self.$div.off(TC.Util.detectMouse() ? 'mouseover' : 'touchmove, touchstart', self.inControls);
        window.cancelAnimationFrame(self.rAFInOutControls);
        self.lastFocused = undefined;
        self.rAFInOutControls = undefined;
    };
    CameraControls.prototype.getCamera = function () {
        var self = this;

        return self.parent.Cesium.Camera.getCamera.call(self.parent);
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

                self.$imgs = $.merge(self.$div.find('img'), self.$div.find('image'));

                var mouseDown = function (e) {
                    var self = this;

                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();

                    var vectorScratch = new Cesium.Cartesian2();
                    var element = e.currentTarget;
                    var rectangle = e.currentTarget.getBoundingClientRect();
                    var maxDistance = rectangle.width / 2.0;
                    var center = new Cesium.Cartesian2((rectangle.right - rectangle.left) / 2.0, (rectangle.bottom - rectangle.top) / 2.0);
                    var clickLocation = new Cesium.Cartesian2(e.clientX - rectangle.left, e.clientY - rectangle.top);
                    var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);
                    var distanceFromCenter = Cesium.Cartesian2.magnitude(vector);

                    var distanceFraction = distanceFromCenter / maxDistance;

                    var nominalTotalRadius = 145;
                    var norminalResetRadius = 50;

                    if (distanceFraction < norminalResetRadius / nominalTotalRadius) {
                        return 0;
                    } else if (distanceFraction < 1.0) {
                        return { element: element, vector: vector };
                    } else {
                        return true;
                    }
                };

                // tilt
                self.$tilt = $('.' + self.parent.CLASS + self.selectors.tilt, self.$div);
                self.$tiltIndicator = self.$tilt.find('svg');
                self.$tiltIndicator.on('mousedown', function (e) {
                    var self = this;

                    var eventType = mouseDown.call(self, e);

                    if (eventType == 0) {
                        self.resetTilt.call(self);
                    } else if (eventType.hasOwnProperty('element')) {
                        self.draggingTilt.call(self, eventType.element, eventType.vector);
                    }
                }.bind(self));
                self.$tiltIndicatorInner = self.$tiltIndicator.find('.' + self.parent.CLASS + self.selectors.tilt + '-inner');
                self.$tiltIndicatorInner.on(TC.Consts.event.CLICK, self.resetTilt.bind(self));
                self.$tiltIndicatorOuter = self.$tiltIndicator.find('.' + self.parent.CLASS + self.selectors.tilt + '-outer');

                self.$tiltIndicatorOuterCircle = $('.' + self.parent.CLASS + self.selectors.tilt + '-outer-circle');
                self.$tiltIndicatorOuterShellCircle = $('.' + self.parent.CLASS + self.selectors.tilt + '-outer-shell-circle');

                // left
                self.$tiltUp = self.$tilt.find('.' + self.parent.CLASS + self.selectors.upArrow);
                self.$tiltUp.on(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function () {

                    self.$tiltUp.blur();

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
                }.bind(self));

                // right
                self.$tiltDown = self.$tilt.find('.' + self.parent.CLASS + self.selectors.downArrow);
                self.$tiltDown.on(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function () {

                    self.$tiltDown.blur();

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
                }.bind(self));

                // rotation
                self.$rotate = $('.' + self.parent.CLASS + self.selectors.rotate, self.$div);
                self.$rotateIndicator = self.$rotate.find('svg');
                self.$rotateIndicatorInner = self.$rotateIndicator.find('.' + self.parent.CLASS + self.selectors.rotate + '-inner');
                self.$rotateIndicator.on('mousedown', function (e) {
                    var self = this;

                    var eventType = mouseDown.call(self, e);

                    if (eventType == 0) {
                        self.resetRotation.call(self);
                    } else if (eventType.hasOwnProperty('element') == 1) {
                        self.draggingRotate.call(self, eventType.element, eventType.vector);
                    }
                }.bind(self));

                self.$rotateIndicatorOuterCircle = $('.' + self.parent.CLASS + self.selectors.rotate + '-outer-circle');
                self.$rotateIndicatorOuterShellCircle = $('.' + self.parent.CLASS + self.selectors.rotate + '-outer-shell-circle');

                // left - right
                self.$rotateLeft = self.$rotate.find('.' + self.parent.CLASS + self.selectors.leftArrow);
                self.$rotateLeft.on(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function () {

                    self.$rotateLeft.blur();

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

                }.bind(self));

                self.$rotateRight = self.$rotate.find('.' + self.parent.CLASS + self.selectors.rightArrow);
                self.$rotateRight.on(TC.Util.detectMouse() ? 'mousedown' : 'touchstart', function () {

                    self.$rotateRight.blur();

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

                }.bind(self));

                self.bind();

            }.bind(this));
        }
    };
    CameraControls.prototype.disableTilt = function (angle) {
        var self = this;

        var _angle = Cesium.Math.toRadians(Math.abs(angle));

        if (self.parent.Cesium.Util.pickBottomPoint(self.parent.viewer.scene) == undefined)
            self.isTiltUpDisabled = true;
        else self.isTiltUpDisabled = self.getCamera().pitch + _angle >= Cesium.Math.PI_OVER_TWO;
        self.isTiltDownDisabled = self.getCamera().pitch - _angle <= -Cesium.Math.PI_OVER_TWO;

        // left
        if (self.isTiltUpDisabled) self.$tiltUp.addClass(self.parent.classes.CAMERACTRARROWDISABLED);
        else self.$tiltUp.removeClass(self.parent.classes.CAMERACTRARROWDISABLED);
        self.$tiltUp.attr('disabled', self.isTiltUpDisabled);

        // right
        if (self.isTiltDownDisabled) self.$tiltDown.addClass(self.parent.classes.CAMERACTRARROWDISABLED);
        else self.$tiltDown.removeClass(self.parent.classes.CAMERACTRARROWDISABLED);
        self.$tiltDown.attr('disabled', self.isTiltDownDisabled);
    };
    CameraControls.prototype.tilt = function (angle) {
        var self = this;

        self.disableTilt(angle);

        if (self.parent.Cesium.Util.pickBottomPoint(self.parent.viewer.scene) == undefined) {
            if (angle > 0) self.getCamera().lookUp();
            else self.getCamera().lookDown();
        }

        if ((angle >= Cesium.Math.PI_OVER_TWO && self.isTiltUpDisabled) ||
            (angle <= -Cesium.Math.PI_OVER_TWO && self.isTiltDownDisabled)) {
            return;
        }

        var _angle = Cesium.Math.toRadians(angle);
        var pivot = self.parent.Cesium.Util.pickBottomPoint(self.parent.viewer.scene);
        if (pivot) {
            var transform = Cesium.Matrix4.fromTranslation(pivot);
            self.parent.Cesium.Util.rotateAroundAxis(self.getCamera(), -_angle, self.getCamera().right, transform, { duration: 100 });
        }
    };
    CameraControls.prototype.rotate = function (angle) {
        var self = this;

        angle = Cesium.Math.toRadians(angle);
        var bottom = self.parent.Cesium.Util.pickBottomPoint(self.parent.viewer.scene);
        if (bottom) {
            self.parent.Cesium.Util.setHeadingUsingBottomCenter(self.parent.viewer.scene, angle, bottom, { duration: 100 });
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

        var pivot = self.parent.Cesium.Util.pickBottomPoint(scene);
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

            var pivot = self.parent.Cesium.Util.pickBottomPoint(scene);
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

        self.$rotateInner = $(rotateElement).find('.' + self.parent.CLASS + self.selectors.rotate + '-outer-circle');
        self.$rotateInner.attr('class', self.$rotateInner.attr('class') + ' ' + self.parent.classes.HIGHLIGHTED);

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

        var viewCenter = self.parent.Cesium.Util.pickCenterPoint(self.parent.viewer.scene);
        if (viewCenter == null || viewCenter == undefined) {
            viewCenter = self.parent.Cesium.Util.pickBottomPoint(self.parent.viewer.scene);
            if (viewCenter == null || viewCenter == undefined) {
                self.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(camera.positionWC, Cesium.Ellipsoid.WGS84, newTransformScratch);
                self.rotateIsLook = true;
            }
        } else {
            self.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(viewCenter, Cesium.Ellipsoid.WGS84, newTransformScratch);
            self.rotateIsLook = false;
        }

        var oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
        camera.lookAtTransform(self.rotateFrame);
        self.rotateInitialCameraAngle = Math.atan2(camera.position.y, camera.position.x);
        self.rotateInitialCameraDistance = Cesium.Cartesian3.magnitude(new Cesium.Cartesian3(camera.position.x, camera.position.y, 0.0));
        camera.lookAtTransform(oldTransform);

        self.rotateMouseMoveFunction = function (e) {
            var rotateRectangle = rotateElement.getBoundingClientRect();
            var center = new Cesium.Cartesian2((rotateRectangle.right - rotateRectangle.left) / 2.0, (rotateRectangle.bottom - rotateRectangle.top) / 2.0);
            var clickLocation = new Cesium.Cartesian2(e.clientX - rotateRectangle.left, e.clientY - rotateRectangle.top);
            var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);
            var angle = Math.atan2(-vector.y, vector.x);

            var angleDifference = angle - self.rotateInitialCursorAngle;
            var newCameraAngle = Cesium.Math.zeroToTwoPi(self.rotateInitialCameraAngle - angleDifference);

            camera = self.parent.viewer.scene.camera;

            oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
            camera.lookAtTransform(self.rotateFrame);
            var currentCameraAngle = Math.atan2(camera.position.y, camera.position.x);
            camera.rotateRight(newCameraAngle - currentCameraAngle);
            camera.lookAtTransform(oldTransform);
        };

        self.rotateMouseUpFunction = function (e) {
            self.isRotating = false;

            self.$rotateInner.attr('class', self.$rotateInner.attr('class').replace(self.parent.classes.HIGHLIGHTED, ''));

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

        var bottom = self.parent.Cesium.Util.pickBottomPoint(self.parent.viewer.scene);
        if (bottom) {
            self.parent.Cesium.Util.setHeadingUsingBottomCenter(self.parent.viewer.scene, currentRotation, bottom, options);
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

    // Apache v2 license
    // https://github.com/TerriaJS/terriajs/blob/
    // ebd382a8278a817fce316730d9e459bbb9b829e9/lib/Models/Cesium.js
    CustomRenderLoop = function (map2D, map3D, debug) {
        this.map2D = map2D;
        this.listentTo = [TC.Consts.event.LAYERADD, TC.Consts.event.LAYERORDER, TC.Consts.event.LAYERREMOVE, TC.Consts.event.LAYEROPACITY, TC.Consts.event.LAYERVISIBILITY, TC.Consts.event.ZOOM, TC.Consts.event.BASELAYERCHANGE].join(' ');
        this.map3D = map3D;

        this.scene_ = this.map3D.scene;
        this.verboseRendering = debug;
        this._boundNotifyRepaintRequired = this.notifyRepaintRequired.bind(this);

        this.lastCameraViewMatrix_ = new Cesium.Matrix4();
        this.lastCameraMoveTime_ = 0;
        this.stoppedRendering = false;

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

        // PENDIENTE DE GESTIONAR CUANDO TENGAMOS PICKING
        // Handle left click by picking objects from the map.        
        //this.map3D.screenSpaceEventHandler.setInputAction(function (e) {
        //    this.pickFromScreenPosition(e.position);
        //}.bind(this), ScreenSpaceEventType.LEFT_CLICK);

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

        var surface = scene.globe['_surface'];
        var tilesWaiting = !surface['_tileProvider'].ready ||
            surface['_tileLoadQueueHigh'].length > 0 || surface['_tileLoadQueueMedium'].length > 0 || surface['_tileLoadQueueLow'].length > 0 || surface['_debug']['tilesWaitingForChildren'] > 0;

        var tweens = scene['tweens'];
        if (!cameraMovedIn3LastSecond && !tilesWaiting && tweens.length == 0) {
            if (this.verboseRendering) {
                console.log('stopping rendering @ ' + Date.now());
            }
            this.parent.setBlockRendering(true);
            this.stoppedRendering = true;
        }

        Cesium.Matrix4.clone(camera.viewMatrix, this.lastCameraViewMatrix_);
    };
    CustomRenderLoop.prototype.restartRenderLoop = function () {
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

    idRequestAnimationFrame = null;
    ctlProto.Cesium = {
        CustomRender: {
            _blockRendering: false,
            _canvasClientWidth: 0.0,
            _canvasClientHeight: 0.0,
            _resolutionScale: 1.0,
            _canvas: null,
            _clock: null,

            _handleResize: function (vw) {
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
                //if (!olcs.supportsImageRenderingPixelated()) {
                //    resolutionScale *= window.devicePixelRatio || 1.0;
                //}                

                this._canvasClientWidth = width;
                this._canvasClientHeight = height;

                width *= resolutionScale;
                height *= resolutionScale;

                this._canvas.width = width;
                this._canvas.height = height;
                vw.scene.camera.frustum.aspectRatio = width / height;
            },
            _renderingAnimation: function (viewer) {
                var self = this;
                var vw = viewer;
                function animation() {
                    if (!self._blockRendering) {
                        vw.scene.initializeFrame();
                        self._handleResize(vw);
                        var currentTime = self._clock.tick() || Cesium.JulianDate.now();
                        vw.scene.render(currentTime);
                    } else {
                        self._clock.tick();
                    }

                    idRequestAnimationFrame = requestAnimationFrame(animation);
                };
                idRequestAnimationFrame = requestAnimationFrame(animation);
            },

            start: function (map2D, map3D, isSlower) {
                this._canvas = map3D.scene.canvas;
                this._clock = map3D.clock || new Cesium.Clock();
                if (isSlower) {
                    /* seg\u00fan he le\u00eddo, al detectar que el navegador cuenta con webgl pero aun as\u00ed es lento,
                                           podemos renderizar en el canvas disponible un globo m\u00e1s peque\u00f1o mejorando el rendimiento y perdiendo calidad. 
                                           Tenemos controlado si el usuario est\u00e1 en un navegador lento mostrando advertencia.
                                           Para ello: setResolutionScale(1/(window.devicePixelRatio || 1.0)) */
                    this._resolutionScale = 0.5;
                }
                this.customRender = new CustomRenderLoop(map2D, map3D, true);
                this.customRender.parent = this;
                this._renderingAnimation(map3D);
            },
            stop: function () {
                window.cancelAnimationFrame(idRequestAnimationFrame);
            },
            setBlockRendering: function (block) {
                this._blockRendering = block;
            }
        },
        arePendingTiles: function () {
            var self = this;

            var surface = self.viewer.scene.globe['_surface'];
            return !surface['_tileProvider'].ready ||
                surface['_tileLoadQueueHigh'].length > 0 ||
                surface['_tileLoadQueueMedium'].length > 0 ||
                surface['_tileLoadQueueLow'].length > 0 ||
                surface['_debug']['tilesWaitingForChildren'] > 0;
        },
        getCesium: function () {
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
        },
        getTerrainProvider: function () {
            var self = this;
            if (!self.terrainProvider)
                self.terrainProvider = new Cesium.CesiumTerrainProvider({
                    url: 'https://pmpwvinet18.tcsa.local/customcesiumterrain/epsg3857/geodetic/_5m/5m',
                    requestWaterMask: true,
                    requestVertexNormals: true
                });

            return self.terrainProvider;
        },
        getViewer: function () {
            var self = this;
            var done = new $.Deferred();

            if (!self.viewer) {
                self.Cesium.getCesium().then(function () {

                    var globe = new Cesium.Globe();
                    globe.baseColor = Cesium.Color.WHITE;
                    globe.enableLighting = true;

                    self.viewer = self.Cesium._viewer = new Cesium.Viewer(self.selectors.divThreedMap, {
                        terrainProvider: self.Cesium.getTerrainProvider(),
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
                        self.Cesium.CustomRender.start(self.map, self.viewer, self.isSlower);
                    }

                    self.viewer.readyPromise = new $.Deferred();

                    // personalizaci\u00f3n de la escena
                    self.viewer.scene.backgroundColor = Cesium.Color.WHITE;
                    self.viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
                    self.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 500000;

                    // borramos cualquier capa que haya
                    self.viewer.scene.imageryLayers.removeAll();

                    // A\u00f1adimos bot\u00f3n que pinta una caja en cada uno de los tiles renderizados con una etiqueta que indica las coordenadas (X,Y, Nivel) del tile
                    if (self.options && self.options.showTileCoordinates) {
                        var tileCoordsLayer;

                        self.$divThreedMap.append('<button class="tc-ctl-threed-show-tile-btn"></button>');
                        self.$btnShowTileCoords = $('.tc-ctl-threed-show-tile-btn');
                        self.$btnShowTileCoords.on(TC.Consts.event.CLICK, function () {
                            if ($(this).hasClass('showing')) {
                                self.viewer.scene.imageryLayers.raiseToTop(tileCoordsLayer);
                                self.viewer.scene.imageryLayers.remove(tileCoordsLayer, true);
                            } else {
                                tileCoordsLayer = self.viewer.scene.imageryLayers.addImageryProvider(new Cesium.TileCoordinatesImageryProvider());
                            }

                            $(this).toggleClass('showing');
                        });
                    }

                    // registramos listeners para capturar errores del terreno y del render
                    self.viewer.terrainProvider.errorEvent.addEventListener(self.Cesium.Events.tileProviderError.bind(self));
                    self.viewer.scene.renderError.addEventListener(self.Cesium.Events.renderError.bind(self));

                    // controlamos la carga de tiles para mostrar loading cuando pida tiles
                    self.Cesium.Util.tileLoadHelper = new Cesium.EventHelper();
                    self.Cesium.Util.tileLoadHelper.add(self.viewer.scene.globe.tileLoadProgressEvent, function (data) {
                        if (!self.waitting)
                            self.waitting = self.map.getLoadingIndicator().addWait();

                        if (data === 0) {
                            self.map.getLoadingIndicator().removeWait(self.waitting);
                            delete self.waitting;

                            self.viewer.readyPromise.resolve();
                        }
                    }.bind(self));

                    // deshabilitamos el zoom por defecto y manejamos nosotros zoom con rueda y botones +/-
                    self.Cesium.Util.zoomHandler.call(self);

                    // eliminamos los creditos de cesium (no encuentro la manera de que no los ponga)
                    $('.cesium-viewer-bottom').remove();

                    done.resolve(self.viewer);
                });
            } else { done.resolve(self.viewer); }

            return done;
        },

        setCameraFromMapView: function () {
            var self = this;
            var center = self.mapView.getCenter();
            var latlon = TC.Util.reproject(center, self.map.crs, self.crs);
            self.distance = self.Cesium.Util.calcDistanceForResolution.call(self, self.mapView.getResolution() || 0, Cesium.Math.toRadians(latlon[0]));

            self.Cesium.Camera.updateCamera.call(self);
        },
        setViewFromCameraView: function () {
            var self = this;

            if (!self.setViewFromCameraViewInProgress || self.setViewFromCameraViewInProgress.state() == "resolved") {
                self.setViewFromCameraViewInProgress = new $.Deferred();

                var ellipsoid = Cesium.Ellipsoid.WGS84;
                var scene = self.viewer.scene;
                var target = target_ = self.Cesium.Util.pickCenterPoint(scene);

                if (!target_) {
                    var globe = self.viewer.scene.globe;
                    var carto = self.viewer.camera.positionCartographic.clone();
                    var height = globe.getHeight(carto);
                    carto.height = height || 0;
                    target_ = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
                }


                self.distance = Cesium.Cartesian3.distance(target_, self.viewer.camera.position);
                var targetCartographic = ellipsoid.cartesianToCartographic(target_);

                var centerMapCRS = TC.Util.reproject(
                    [Cesium.Math.toDegrees(targetCartographic.longitude), Cesium.Math.toDegrees(targetCartographic.latitude)],
                    self.crs, self.map.crs);

                self.mapView.setCenter(centerMapCRS);

                self.mapView.setResolution(self.Cesium.Util.calcResolutionForDistance.call(self, self.distance, targetCartographic ? targetCartographic.latitude : 0));

                self.setViewFromCameraViewInProgress.resolve();
                // GLS: No tenemos la rotaci\u00f3n del mapa activada por problemas con el iPad
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

        Events: {
            Zoom: {
                _toZoom: {
                    direction: 1,
                    amount: 0,
                    endPosition: {}
                },
                zoom: function (position, amount) {
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
                            // cerca / lejos
                            self.Cesium.Events.Zoom._toZoom.direction = amount > 0 ? 1 : 0;
                            self.Cesium.Events.Zoom._toZoom.amount += (distanceMeasure * 5 / 100);
                            self.Cesium.Events.Zoom._toZoom.endPosition = position.endPosition;
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
                                        this.Cesium.Events.Zoom._toZoom = {
                                            direction: 1,
                                            amount: 0,
                                            endPosition: {}
                                        };

                                        return;
                                    };

                                    if (Cesium.Cartesian3.distance(toGo, intersectionToGo) < 1 ||
                                        Cesium.Ellipsoid.WGS84.cartesianToCartographic(toGo).height > scene.screenSpaceCameraController.maximumZoomDistance ||
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
                                                this.Cesium.Events.Zoom._toZoom = {
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
                        setNewPosition.call(self, self.Cesium.Events.Zoom._toZoom);
                    }.bind(self), 50);
                },
                buttomsZoom: function (position, amount) {
                    var self = this;

                    self.Cesium.Events.Zoom.zoom.call(self, { endPosition: position }, amount);
                },
                wheelZoom: function (wheelZoomAmount) {
                    var self = this;

                    self.Cesium.Events.Zoom.zoom.call(self, self.Cesium._mousePosition, wheelZoomAmount);
                }
            },
            renderError: function (e) {
                var self = this;

                self.$divThreedMap.addClass(self.classes.LOADING);
                self.map.toast('Error', { type: TC.Consts.msgType.ERROR });
            },
            tileProviderError: function (e) {
                var self = this;

                switch (e.error.statusCode) {
                    case 403:
                    case 404: break;
                }
            }
        },

        Camera: {
            limitCamera: function () {
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
            },
            updateCamera: function () {
                var self = this;

                var center = self.mapView.getCenter();
                if (!center) {
                    return;
                }

                var latlon = TC.Util.reproject(center, self.map.crs, self.crs);
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

                self.viewer.camera.moveBackward(self.distance);
            },
            getCamera: function () {
                var self = this;

                return self.viewer.scene.camera;
            },
            getHeight: function () {
                var self = this;

                return Cesium.Ellipsoid.WGS84.cartesianToCartographic(self.Cesium.Camera.getCamera.call(self).position).height;
            }
        },

        Util: {

            calcDistanceForResolution: function (resolution, latitude) {
                var self = this;

                var fovy = self.viewer.camera.frustum.fovy;
                var metersPerUnit = self.mapView.proj4Obj.oProj.METERS_PER_UNIT;
                var visibleMapUnits = resolution * self.mapView.viewHTML.getBoundingClientRect().height;
                var relativeCircumference = Math.cos(Math.abs(latitude));
                var visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;

                return (visibleMeters / 2) / Math.tan(fovy / 2);
            },
            calcResolutionForDistance: function (distance, latitude) {
                var self = this;

                var canvas = self.viewer.scene.canvas;
                var fovy = self.viewer.camera.frustum.fovy;
                var metersPerUnit = self.mapView.proj4Obj.oProj.METERS_PER_UNIT;

                var visibleMeters = 2 * distance * Math.tan(fovy / 2);
                var relativeCircumference = Math.cos(Math.abs(latitude));
                var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
                var resolution = visibleMapUnits / canvas.clientHeight;

                // validamos que la resoluci\u00f3n calculada est\u00e9 disponible en el array de resoluciones disponibles
                // si no contamos con un array de resoluciones lo calculamos
                var resolutions = self.map.getResolutions();
                if (resolutions == null) {
                    resolutions = new Array(22);
                    for (var i = 0, ii = resolutions.length; i < ii; ++i) {
                        resolutions[i] = self.mapView.getMaxResolution() / Math.pow(2, i);
                    }
                }

                // obtenemos la resoluci\u00f3n m\u00e1s pr\u00f3xima a la calculada
                for (var i = 0; i < resolutions.length; i++) {
                    if (resolutions[i] < resolution) {
                        resolution = resolutions[i];
                        break;
                    }
                }

                return resolution;
            },

            rotateAroundAxis: function (camera, angle, axis, transform, opt_options) {
                var self = this;

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
            },

            pickOnTerrainOrEllipsoid: function (scene, pixel) {
                var self = this;

                var ray = scene.camera.getPickRay(pixel);
                var target = scene.globe.pick(ray, scene);
                return target || scene.camera.pickEllipsoid(pixel);
            },
            pickCenterPoint: function (scene) {
                var self = this;

                var canvas = scene.canvas;
                var center = new Cesium.Cartesian2(
                    canvas.clientWidth / 2,
                    canvas.clientHeight / 2);
                return self.pickOnTerrainOrEllipsoid(scene, center);
            },
            pickBottomPoint: function (scene) {
                var self = this;

                var canvas = scene.canvas;
                var bottom = new Cesium.Cartesian2(
                    canvas.clientWidth / 2, canvas.clientHeight);
                return self.pickOnTerrainOrEllipsoid(scene, bottom);
            },

            bottomFovRay: function (scene) {
                var self = this;

                var camera = scene.camera;
                var fovy2 = camera.frustum.fovy / 2;
                var direction = camera.direction;
                var rotation = Cesium.Quaternion.fromAxisAngle(camera.right, fovy2);
                var matrix = Cesium.Matrix3.fromQuaternion(rotation);
                var vector = new Cesium.Cartesian3();
                Cesium.Matrix3.multiplyByVector(matrix, direction, vector);
                return new Cesium.Ray(camera.position, vector);
            },

            setHeadingUsingBottomCenter: function (scene, heading, bottomCenter, opt_options) {
                var self = this;

                var camera = scene.camera;
                // Compute the camera position to zenith quaternion
                var angleToZenith = self.computeAngleToZenith(scene, bottomCenter);
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
                self.rotateAroundAxis(camera, heading, zenith, transform, opt_options);
            },

            signedAngleBetween: function (first, second, normal) {
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
            },

            computeAngleToZenith: function (scene, pivot) {
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
                var ray = self.bottomFovRay(scene);
                var direction = Cesium.Cartesian3.clone(ray.direction);
                Cesium.Cartesian3.negate(direction, direction);

                var normal = new Cesium.Cartesian3();
                Cesium.Ellipsoid.WGS84.geocentricSurfaceNormal(pivot, normal);

                var left = new Cesium.Cartesian3();
                Cesium.Cartesian3.negate(camera.right, left);

                var a = self.signedAngleBetween(normal, direction, left);
                return a + fy;
            },
            computeSignedTiltAngleOnGlobe: function (scene) {
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

                var angleBetween = self.signedAngleBetween;
                var angle = angleBetween(camera.direction, normal, camera.right) - Math.PI;
                return Cesium.Math.convertLongitudeRange(angle);
            },

            zoomHandler: function () {
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

                        self.Cesium.Events.Zoom.wheelZoom.call(self, delta);

                    }, false);

                    var eventHandler = new Cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
                    eventHandler.setInputAction(function (event) {
                        self.Cesium._mousePosition = event;
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
                    eventHandler.setInputAction(function (wheelZoomAmount) {
                        self.Cesium.Events.Zoom.wheelZoom.call(self, wheelZoomAmount);
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
                        self.Cesium.Events.Zoom.zoom.call(self, { endPosition: pinchCenterPosition }, pinchAmount);
                    }, Cesium.ScreenSpaceEventType.PINCH_END);
                }
            }
        }
    };

    ctlProto.OverrideControls = {
        adapter: function (direction) {
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
                    break;
                case (self.direction.TO_THREE_D == direction):
                    $('[data-no-3d]').addClass(TC.Consts.classes.HIDDEN);
                    break;
            }
        },
        Cfg: {
            zoomAmount: 200.0
        },
        Events: {
            initialExtent: function (e) {
                var self = this;

                if (self.map.options.initialExtent && self.map.options.initialExtent.length == 4) {

                    $.when(self.map.setExtent(self.map.options.initialExtent)).then(function () {

                        var ext = self.map.getExtent();
                        var coordsXY = TC.Util.reproject(ext.slice(0, 2), self.map.crs, self.crs);
                        var coordsXY2 = TC.Util.reproject(ext.slice(2), self.map.crs, self.crs);

                        self.initExtent = Cesium.Rectangle.fromDegrees(coordsXY[0], coordsXY[1], coordsXY2[0], coordsXY2[1]);

                        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = self.initExtent;
                        Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

                        self.viewer.camera.flyHome(4);

                    }.bind(self));
                }
            },
            zoomin: function (e) {
                var self = this;

                var center = new Cesium.Cartesian2(
                    self.viewer.scene.canvas.clientWidth / 2,
                    self.viewer.scene.canvas.clientHeight / 2);
                self.Cesium.Events.Zoom.buttomsZoom.call(self, center, self.OverrideControls.Cfg.zoomAmount);
            },
            zoomout: function (e) {
                var self = this;

                var center = new Cesium.Cartesian2(
                    self.viewer.scene.canvas.clientWidth / 2,
                    self.viewer.scene.canvas.clientHeight / 2);
                self.Cesium.Events.Zoom.buttomsZoom.call(self, center, -self.OverrideControls.Cfg.zoomAmount);
            }
        }
    };

    ctlProto.BaseMap = {
        analogLayers: {
            layers: [],
            getProperties: function (layer) {
                var self = this;
                // almacenamos la configuraci\u00f3n an\u00e1loga para el mapa de fondo no soportado.
                if (layer.options && layer.options.hasOwnProperty('4326')) {
                    self.BaseMap.analogLayers.layers.push({ id: layer.id, opts: layer.options["4326"] });
                    return self.BaseMap.analogLayers.layers[self.BaseMap.analogLayers.layers.length - 1].opts;
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
        },
        synchronizer: function (direction) {
            var self = this;

            switch (true) {
                case (self.direction.TO_TWO_D == direction):
                    self.BaseMap.Util.addNoCompatibleBaseLayers.call(self);

                    self.map.baseLayer = self.currentMapCfg.baseMap == self.Consts.BLANK_BASE ? self.currentMapCfg.baseVector : self.currentMapCfg.baseMap;
                    self.map.$events.trigger($.Event(TC.Consts.event.BASELAYERCHANGE, { layer: self.map.baseLayer }));
                    break;
                case (self.direction.TO_THREE_D == direction):
                    self.BaseMap.Util.checkCompatibleBaseMaps.call(self);
                    self.BaseMap.Util.removeNoCompatibleBaseLayers.call(self);

                    if (self.map.baseLayer instanceof TC.layer.Raster) {
                        var layer = self.map.baseLayer;

                        if (layer.options.relatedWMTS) {
                            self.map.baseLayer = layer = self.map.getLayer(layer.options.relatedWMTS);
                            self.map.$events.trigger($.Event(TC.Consts.event.BASELAYERCHANGE, { layer: self.map.baseLayer }));
                        } else if ((obj = self.BaseMap.analogLayers.findById(self.map.baseLayer.id)) != null) {
                            $.extend(obj, { map: self.map });
                            layer = new TC.layer.Raster(obj);
                            layer.isBase = true;
                        }

                        self.Raster.synchronizer.call(self, layer);
                    }
                    else self.baseLayer = self.Consts.BLANK_BASE;

                    break;
            }
        },

        Events: {
            beforeBaseLayerChanged: function (e) {
                var self = this;

                if (!self.waitting)
                    self.waitting = self.map.getLoadingIndicator().addWait();
            },
            baseLayerChanged: function (e) {
                var self = this;

                if (self.baseLayer && self.baseLayer !== self.Consts.BLANK_BASE) {
                    self.viewer.scene.imageryLayers.raiseToTop(self.baseLayer);
                    self.viewer.scene.imageryLayers.remove(self.baseLayer, true);
                }

                if (e.layer instanceof TC.layer.Vector)
                    self.baseLayer = self.Consts.BLANK_BASE;
                else {
                    var layer = e.layer;
                    if ((obj = self.BaseMap.analogLayers.findById(e.layer.id)) != null) {
                        $.extend(obj, { map: self.map });
                        layer = new TC.layer.Raster(obj);
                        layer.isBase = true;
                    }

                    self.Raster.synchronizer.call(self, layer);
                }

                self.currentMapCfg.baseMap = self.map.baseLayer;
            },
        },

        Util: {
            checkCompatibleBaseMaps: function () {
                var self = this;
                var isBaseRaster = self.map.baseLayer instanceof TC.layer.Raster;

                if (isBaseRaster) {
                    if ((crs = self.Raster.isCompatible.call(self, self.map.baseLayer)) == null)
                        if (self.BaseMap.analogLayers.getProperties.call(self, self.map.baseLayer) == null)
                            self.map.toast(self.getLocaleString('threed.baseLayerNoCompatible', { name: self.map.baseLayer.layerNames }));
                } else {
                    self.currentMapCfg.baseVector = self.map.baseLayer;
                }

                if (self.currentMapCfg.baseMaps.length === 0) {
                    for (var i = 0; i < self.map.baseLayers.length; i++) {
                        if (self.map.baseLayers[i] instanceof TC.layer.Raster && !self.Raster.isCompatible.call(self, self.map.baseLayers[i]))
                            if (self.BaseMap.analogLayers.getProperties.call(self, self.map.baseLayers[i]) == null)
                                self.currentMapCfg.baseMaps.push({ l: self.map.baseLayers[i], i: i });
                    }
                }

                self.currentMapCfg.baseMap = isBaseRaster ? self.map.baseLayer : self.Consts.BLANK_BASE;
            },
            removeNoCompatibleBaseLayers: function () {
                var self = this;
                var selectNewBaseLayer = false;

                if (self.currentMapCfg.baseMaps && self.currentMapCfg.baseMaps.length) {
                    for (var i = 0; i < self.currentMapCfg.baseMaps.length; i++) {
                        for (var j = 0; j < self.map.baseLayers.length; j++) {
                            if (self.map.baseLayers[j] === self.currentMapCfg.baseMaps[i].l) {

                                if (self.currentMapCfg.baseMap == self.map.baseLayers[j]) {
                                    // si uno de los mapas de fondo no soportados para 3d es el mapa de fondo seleccionado ahora mismo
                                    // seleciono otro de los que s\u00ed son soportados
                                    selectNewBaseLayer = true;
                                }

                                self.map.$events.trigger($.Event(TC.Consts.event.LAYERREMOVE, { layer: self.map.baseLayers[j] }));
                                self.map.baseLayers.splice(j, 1);
                                break;
                            }
                        }
                    }

                    if (selectNewBaseLayer) {
                        // si uno de los mapas de fondo no soportados para 3d es el mapa de fondo seleccionado ahora mismo
                        // seleciono otro de los que s\u00ed son soportados

                        self.map.baseLayer = self.map.baseLayers[0];
                        self.map.$events.trigger($.Event(TC.Consts.event.BASELAYERCHANGE, { layer: self.map.baseLayer }));
                    }
                }
            },
            addNoCompatibleBaseLayers: function () {
                var self = this;

                if (self.currentMapCfg.baseMaps && self.currentMapCfg.baseMaps.length) {
                    for (var i = 0; i < self.currentMapCfg.baseMaps.length; i++) {
                        self.map.$events.trigger($.Event(TC.Consts.event.LAYERADD, { layer: self.currentMapCfg.baseMaps[i].l }));
                        self.map.baseLayers.splice(self.currentMapCfg.baseMaps[i].i, 0, self.currentMapCfg.baseMaps[i].l);
                    }
                }
            }
        }
    };

    ctlProto.Layer = {
        synchronizer: function () {
            var self = this;

            var workLayers = self.map.workLayers.slice().reverse();

            for (var i = 0; i < workLayers.length; i++) {
                var layer = workLayers[i];

                if (layer instanceof TC.layer.Raster)
                    self.Raster.synchronizer.call(self, layer);
                //else if (layer instanceof TC.layer.Vector)
                //    self.Vector.synchronizer.call(self, layer);
            }
        },

        Events: {
            layerAdded: function (e) {
                var self = this;

                self.Raster.synchronizer.call(self, e.layer);
            },
            layerRemoved: function (e) {
                var self = this;

                for (var i = 0; i < self.workLayers.length; i++) {
                    if (self.workLayers[i].imageryProvider.layers.join(',') === e.layer.names.join(',')) {
                        self.viewer.scene.imageryLayers.raiseToTop(self.workLayers[i]);
                        self.viewer.scene.imageryLayers.remove(self.workLayers[i], true);

                        self.workLayers.splice(i, 1);
                        break;
                    }
                }
            },
            layerVisibility: function (e) {
                var self = this;

                for (var i = 0; i < self.workLayers.length; i++) {
                    if (self.workLayers[i].imageryProvider.layers.join(',') === e.layer.names.join(',')) {
                        self.workLayers[i].show = e.layer.getVisibility();
                        break;
                    }
                }
            },
            layerOpacity: function (e) {
                var self = this;

                for (var i = 0; i < self.workLayers.length; i++) {
                    if (self.workLayers[i].imageryProvider.layers.join(',') === e.layer.names.join(',')) {
                        self.workLayers[i].alpha = e.layer.getOpacity();
                        break;
                    }
                }
            },
            layerOrder: function (e) {
                var self = this;

                for (var i = 0; i < self.workLayers.length; i++) {
                    if (self.workLayers[i].imageryProvider && self.workLayers[i].imageryProvider.layers.join(',') === e.layer.names.join(',')) {

                        if (e.oldIndex > e.newIndex) {
                            var positions = e.oldIndex - e.newIndex;
                            for (var p = 0; p < positions; p++) {
                                self.viewer.scene.imageryLayers.lower(self.workLayers[i]);
                            }

                        } else {
                            var positions = e.newIndex - e.oldIndex;
                            for (var p = 0; p < positions; p++) {
                                self.viewer.scene.imageryLayers.raise(self.workLayers[i]);
                            }
                        }

                        self.workLayers.splice(e.newIndex, 0, self.workLayers.splice(e.oldIndex, 1)[0]);
                        break;
                    }
                }
            }
        }
    };

    ctlProto.Raster = {
        isCompatible: function (layer) {
            var self = this;

            var crs = self.Util.getCRSByLayerOnCapabilities(layer);
            if (crs && crs.length && self.crsPattern.test(crs.join(',')))
                return crs.join(',').match(self.crsPattern)[0];
            else return null;
        },
        getWMTSLayerSynchronizer: function (layer, crs) {
            var self = this;

            var tileMatrixSetLabels = this.Util.getTileMatrixSetLabelByLayerOnCapabilities(layer, crs);

            return new Cesium.WebMapTileServiceImageryProvider({
                url: layer.options.urlPattern,
                layer: layer.layerNames,
                style: 'default',
                format: layer.format || layer.options.format,
                tileMatrixSetID: crs,
                tileMatrixLabels: tileMatrixSetLabels,
                tilingScheme: new Cesium.GeographicTilingScheme()
            });
        },
        getWMSLayerSynchronizer: function (layer) {
            var self = this;

            return new Cesium.WebMapServiceImageryProvider({
                url: layer.url,
                layers: layer.layerNames,
                parameters: {
                    transparent: true,
                    format: layer.format || layer.options.format
                }
            });
        },
        synchronizer: function (layer) {
            var self = this;

            if (layer instanceof TC.layer.Raster) {
                var csmLayer;

                switch (true) {
                    case TC.Consts.layerType.WMTS == layer.type: {
                        if ((crs = self.Raster.isCompatible.call(self, layer)) != null) {
                            csmLayer = self.Raster.getWMTSLayerSynchronizer.call(self, layer, crs);
                        }
                        else {
                            self.map.toast(self.getLocaleString('threed.crsNoCompatible', { name: layer.layerNames }));
                        }
                        break;
                    }
                    case TC.Consts.layerType.WMS == layer.type: {
                        if ((crs = self.Raster.isCompatible.call(self, layer)) != null) {
                            csmLayer = self.Raster.getWMSLayerSynchronizer(layer);
                        }
                        else {
                            self.map.toast(self.getLocaleString('threed.crsNoCompatible', { name: layer.layerNames }));
                        }
                        break;
                    }
                }

                if (csmLayer) {

                    var newImageryLayer = self.viewer.scene.imageryLayers.addImageryProvider(csmLayer);

                    if (layer.isBase) { // si la capa es el mapa de fondo lo env\u00edo al fondo de las capas en 3D
                        self.baseLayer = newImageryLayer;
                        self.viewer.scene.imageryLayers.lowerToBottom(newImageryLayer);
                    } else {
                        newImageryLayer.show = layer.getVisibility();
                        newImageryLayer.alpha = layer.getOpacity();

                        self.workLayers.push(newImageryLayer);
                    }
                }
            }
        }
    };

    ctlProto.Vector = {
        getPosition: function (coords) {
            var self = this;

            if (coords) {
                return TC.Util.reproject(coords, self.map.crs, self.crs);;
            }
        },
        getIcon: function (opt) {
            var self = this;

            if (opt.url && opt.width && opt.height)
                return {
                    image: opt.url,
                    width: opt.width,
                    height: opt.height
                };
        },
        createEntity: function (feature) {
            var self = this;
            var entity;

            switch (true) {
                case feature instanceof TC.feature.Marker:
                    var position = this.getPosition.call(self, feature.getCoords());
                    var icon = this.getIcon.call(self, feature.options)

                    entity = new Cesium.Entity({
                        position: Cesium.Cartesian3.fromDegrees(position[0], position[1])
                    });

                    if (icon)
                        entity.billboard = icon;

                case feature instanceof TC.feature.Point:
                    break;
            }
            //if (feature instanceof TC.feature.Circle) { }
            //if (feature instanceof TC.feature.Polyline) { }
            //if (feature instanceof TC.feature.Polygon) { }
            //if (feature instanceof TC.feature.MultiPolygon) { }

            if (entity)
                self.viewer.entities.add(entity);
        },
        synchronizer: function (layer) {
            var self = this;

            if (layer.features && layer.features.length) {
                for (var i = 0; i < layer.features.length; i++) {
                    this.createEntity.call(self, layer.features[i]);
                }
            }
        }
    };

    ctlProto.Util = {
        browserSupportWebGL: function () {
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
        },
        paths: {
            CRS: ["Capability", "Layer", "CRS"],
            TILEMATRIXSET: ["Contents", "TileMatrixSet", "Identifier"],
            TILEMATRIXSETLABELS: ["Contents", "TileMatrixSet"]
        },
        getOfPath: function (obj, p, i) {
            if (i < p.length - 1) {
                if (obj.hasOwnProperty(p[i]))
                    return this.getOfPath(obj[p[i]], p, ++i);
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
        },
        getCRSByLayerOnCapabilities: function (layer) {
            if ((capsURL = TC.Util.isOnCapabilities(layer.url))) {
                if ((caps = TC.capabilities[capsURL])) {
                    return this.getOfPath(caps, this.paths.CRS, 0) || this.getOfPath(caps, this.paths.TILEMATRIXSET, 0);
                }
            }

            return null;
        },
        getTileMatrixSetLabelByLayerOnCapabilities: function (layer, crs) {
            if ((capsURL = TC.Util.isOnCapabilities(layer.url))) {
                if ((caps = TC.capabilities[capsURL])) {
                    var tileMatrixSet = this.getOfPath(caps, this.paths.TILEMATRIXSETLABELS, 0);
                    for (var a = 0; a < tileMatrixSet.length; a++) {
                        if (tileMatrixSet[a]["Identifier"] === crs) {
                            return this.getOfPath(tileMatrixSet[a], ["TileMatrix", "Identifier"], 0);
                        }
                    }
                }
            }

            return null;
        },
        reset3D: function () {
            var self = this;

            self.currentMapCfg.baseMap = '';
            self.workLayers = [];

            self.cameraControls.unbind();

            self.Cesium.Util.tileLoadHelper.removeAll();
            delete self.Cesium.Util.tileLoadHelper;
        }
    };
})();
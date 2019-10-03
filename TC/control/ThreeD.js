TC.control = TC.control || {};

(function () {

    TC.control.ThreeD = function () {
        var self = this;

        TC.Control.apply(self, arguments);
    };

    TC.inherit(TC.control.ThreeD, TC.Control);

    var ctlProto = TC.control.ThreeD.prototype;

    ctlProto.CLASS = 'tc-ctl-threed';
    ctlProto.classes = {
        BETA: 'tc-beta-button',
        BTNACTIVE: 'active'
    };

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/ThreeD.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<button class=\"tc-ctl-threed-btn tc-beta-button\" title=\"").h("i18n", ctx, {}, { "$key": "threed.tip" }).w("\"></button>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.Control.prototype.register.call(self, map);

        map.on(TC.Consts.event.VIEWCHANGE, function (e) {
            if (e.view == TC.Consts.view.THREED) { // cargamos la vista 3D desde el estado actualizamos el estado del botón
                self.activate();
            }
        });

        return result;
    };

    ctlProto.renderData = function (data, callback) {
        const self = this;

        return TC.Control.prototype.renderData.call(self, data, function () {
            self.button = self.div.querySelector('.' + self.CLASS + '-btn');

            self.button.addEventListener(TC.Consts.event.CLICK, function () {

                if (self.button.getAttribute("disabled") === "disabled") {
                    return;
                }

                if (!self.map.on3DView) {
                    self.activate();
                } else {
                    self.button.setAttribute("disabled", "disabled");

                    TC.view.ThreeD.unapply({
                        callback: function () {
                            self.button.setAttribute('title', self.getLocaleString("threed.tip"));

                            self.button.classList.remove(self.classes.BTNACTIVE);

                            self.button.removeAttribute("disabled");
                        }
                    });
                }
            });

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        });
    };

    ctlProto.activate = function () {
        var self = this;

        self.button.setAttribute("disabled", "disabled");

        self.browserSupportWebGL.call(self);

        const manageButton = function () {
            self.button.setAttribute('title', self.getLocaleString('threed.two.tip'));
            self.button.classList.remove(self.classes.BETA);

            self.button.classList.add(self.classes.BTNACTIVE);
        };

        const removeDisabled = function () {
            self.button.removeAttribute("disabled");
        };

        if (!self.map.view3D) {
            TC.loadJS(
                !TC.view || !TC.view.ThreeD,
                TC.apiLocation + 'TC/view/ThreeD',
                function () {                                                           /* provisional */
                    TC.view.ThreeD.apply({ map: self.map, options: self.options, getRenderedHtml: self.getRenderedHtml, callback: removeDisabled });
                });
        } else if (!self.map.on3DView) {                                               /* provisional */
            TC.view.ThreeD.apply({ map: self.map, options: self.options, getRenderedHtml: self.getRenderedHtml, callback: removeDisabled });
        }

        manageButton();

        //TC.Control.prototype.activate.call(self);
    };

    ctlProto.deactivate = function () {
        var self = this;

        TC.Control.prototype.deactivate.call(self);
    };

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
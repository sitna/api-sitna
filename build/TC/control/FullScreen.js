TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.FullScreen = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    self.fullScreenElement = document.documentElement;
};

TC.inherit(TC.control.FullScreen, TC.Control);

(function () {
    var ctlProto = TC.control.FullScreen.prototype;

    ctlProto.CLASS = 'tc-ctl-fscreen';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/FullScreen.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<button class=\"tc-ctl-fscreen-btn\" title=\"").h("i18n", ctx, {}, { "$key": "fscreen.tip" }).w("\"></button>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        self.renderPromise().then(function () {
            var $btn = self._$div.find('.' + self.CLASS + '-btn');

            if (self.enabledFullScreen()) {
                $btn.on('click', function () {
                    self.toggleFullScreen();                    
                });

                $(document).on('fullscreenchange mozfullscreenchange webkitfullscreenchange MSFullscreenChange', function () {
                    $btn.toggleClass(TC.Consts.classes.ACTIVE, self.isFullScreen());
                    $btn.attr('title', self.isFullScreen() ? self.getLocaleString("fscreen.tip.return") : self.getLocaleString("fscreen.tip"));
            });
            } else { $btn.addClass(TC.Consts.classes.HIDDEN); }
        });
    };

    ctlProto.requestFullScreen = function () {
        var self = this;
        var elm = self.fullScreenElement;
        document.documentElement.requestFullScreen ? elm.requestFullScreen() :
            elm.mozRequestFullScreen ? elm.mozRequestFullScreen() :
            elm.webkitRequestFullScreen ? elm.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT) :
            elm.msRequestFullscreen && elm.msRequestFullscreen();
    };

    ctlProto.cancelFullScreen = function () {
        var self = this;
        document.cancelFullScreen ? document.cancelFullScreen() :
            document.mozCancelFullScreen ? document.mozCancelFullScreen() :
            document.webkitCancelFullScreen ? document.webkitCancelFullScreen() :
            document.msExitFullscreen && document.msExitFullscreen();
    };

    ctlProto.isFullScreen = function () {
        return document.fullScreenElement || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement;
    };

    ctlProto.toggleFullScreen = function () {
        var self = this;
        self.isFullScreen() ? self.cancelFullScreen() : self.requestFullScreen();
    };

    ctlProto.enabledFullScreen = function () {
        var self = this;        
        var elm = self.fullScreenElement;
        var enabled = document.documentElement.requestFullScreen || elm.mozRequestFullScreen || elm.webkitRequestFullScreen || elm.msRequestFullscreen;        
        return enabled && typeof (enabled) == "function";
    };

})();

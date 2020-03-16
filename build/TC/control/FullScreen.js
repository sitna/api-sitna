TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.FullScreen = function () {
    var self = this;

    TC.Control.apply(self, arguments);
};

TC.inherit(TC.control.FullScreen, TC.Control);

(function () {
    var ctlProto = TC.control.FullScreen.prototype;

    ctlProto.CLASS = 'tc-ctl-fscreen';

    ctlProto.template = TC.apiLocation + "TC/templates/FullScreen.html";

    const key = {
        fullscreenEnabled: 0,
        fullscreenElement: 1,
        requestFullscreen: 2,
        exitFullscreen: 3,
        fullscreenchange: 4,
        fullscreenerror: 5,
    };

    const webkit = [
        'webkitFullscreenEnabled',
        'webkitFullscreenElement',
        'webkitRequestFullscreen',
        'webkitExitFullscreen',
        'webkitfullscreenchange',
        'webkitfullscreenerror',
    ];

    const moz = [
        'mozFullScreenEnabled',
        'mozFullScreenElement',
        'mozRequestFullScreen',
        'mozCancelFullScreen',
        'mozfullscreenchange',
        'mozfullscreenerror',
    ];

    const ms = [
        'msFullscreenEnabled',
        'msFullscreenElement',
        'msRequestFullscreen',
        'msExitFullscreen',
        'MSFullscreenChange',
        'MSFullscreenError',
    ];

    const document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};

    const vendor = (
        ('fullscreenEnabled' in document && Object.keys(key)) ||
        (webkit[0] in document && webkit) ||
        (moz[0] in document && moz) ||
        (ms[0] in document && ms) ||
        []
    );

    ctlProto.fscreen = {
        inFullscreen: false,
        requestFullscreen: element => element[vendor[key.requestFullscreen]](),
        requestFullscreenFunction: element => element[vendor[key.requestFullscreen]],
        get exitFullscreen() { return document[vendor[key.exitFullscreen]].bind(document); },
        addEventListener: (type, handler, options) => document.addEventListener(vendor[key[type]], handler, options),
        removeEventListener: (type, handler, options) => document.removeEventListener(vendor[key[type]], handler, options),
        get fullscreenEnabled() { return Boolean(document[vendor[key.fullscreenEnabled]]); },
        set fullscreenEnabled(val) { },
        get fullscreenElement() { return document[vendor[key.fullscreenElement]]; },
        set fullscreenElement(val) { },
        get onfullscreenchange() { return document[("on" + vendor[key.fullscreenchange]).toLowerCase()]; },
        set onfullscreenchange(handler) { return document[("on" + vendor[key.fullscreenchange]).toLowerCase()] = handler; },
        get onfullscreenerror() { return document["on" + vendor[key.fullscreenerror].toLowerCase()]; },
        set onfullscreenerror(handler) { return document["on" + vendor[key.fullscreenerror].toLowerCase()] = handler; }
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);

        result.then(function () {
            const btn = self.div.querySelector('.' + self.CLASS + '-btn');
            
            if (self.fscreen.fullscreenEnabled) {                
                self.fscreen.addEventListener('fullscreenchange', function () {
                    self.fscreen.inFullscreen = self.fscreen.fullscreenElement !== null;
                    btn.classList.toggle(TC.Consts.classes.ACTIVE, self.fscreen.inFullscreen);
                    btn.setAttribute('title', self.fscreen.inFullscreen ? self.getLocaleString("fscreen.tip.return") : self.getLocaleString("fscreen.tip"));
                }, false);

                btn.addEventListener('click', function () {
                    if (!self.fscreen.inFullscreen) {
                        self.fscreen.requestFullscreen(self.map.div);
                    } else {
                        self.fscreen.exitFullscreen();
                    }
                }, false);

            } else {
                // GLS: 19/02/2019 en lugar de ocultar el botón, deshabilitamos el control para que no quede espacio de más entre los botones
                self.disable();
            }            
        });

        return result;
    };    

})();

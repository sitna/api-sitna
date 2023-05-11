import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';
import Util from '../Util';

TC.control = TC.control || {};
TC.Control = Control;

TC.control.FullScreen = function () {
    var self = this;

    TC.Control.apply(self, arguments);
};

TC.inherit(TC.control.FullScreen, TC.Control);

(function () {
    var ctlProto = TC.control.FullScreen.prototype;

    ctlProto.CLASS = 'tc-ctl-fscreen';

    const key = {
        fullscreenEnabled: 0,
        fullscreenElement: 1,
        requestFullscreen: 2,
        exitFullscreen: 3,
        fullscreenchange: 4,
        fullscreenerror: 5
    };

    const webkit = [
        'webkitFullscreenEnabled',
        'webkitFullscreenElement',
        'webkitRequestFullscreen',
        'webkitExitFullscreen',
        'webkitfullscreenchange',
        'webkitfullscreenerror'
    ];

    const moz = [
        'mozFullScreenEnabled',
        'mozFullScreenElement',
        'mozRequestFullScreen',
        'mozCancelFullScreen',
        'mozfullscreenchange',
        'mozfullscreenerror'
    ];

    const ms = [
        'msFullscreenEnabled',
        'msFullscreenElement',
        'msRequestFullscreen',
        'msExitFullscreen',
        'MSFullscreenChange',
        'MSFullscreenError'
    ];

    const document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};

    const vendor = 'fullscreenEnabled' in document && Object.keys(key) ||
        webkit[0] in document && webkit ||
        moz[0] in document && moz ||
        ms[0] in document && ms ||
        [];

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

    ctlProto.loadTemplates = async function () {
        const self = this;
        const module = await import('../templates/tc-ctl-fscreen.mjs');
        self.template = module.default;
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);

        result.then(function () {
            const btn = self.div.querySelector('.' + self.CLASS + '-btn');

            if (self.fscreen.fullscreenEnabled) {

                const doFullscreenChange = () => {
                    btn.classList.toggle(Consts.classes.ACTIVE, self.fscreen.inFullscreen);
                    btn.setAttribute('title', self.fscreen.inFullscreen ? self.getLocaleString("fscreen.tip.return") : self.getLocaleString("fscreen.tip"));
                };

                self.fscreen.addEventListener('fullscreenchange', () => {
                    self.fscreen.inFullscreen = self.fscreen.fullscreenElement !== null;
                    doFullscreenChange();
                }, false);

                btn.addEventListener('click', function () {
                    self.byBtn = true;
                    if (!self.fscreen.inFullscreen) {
                        self.fscreen.requestFullscreen(document.body);
                    } else {
                        self.fscreen.exitFullscreen();
                    }
                }, false);

                if (!Util.detectMobile()) {
                    window.addEventListener('resize', () => {
                        if (self.byBtn) {
                            self.byBtn = false;
                            return;
                        }

                        const windowWidth = window.innerWidth * window.devicePixelRatio;
                        const windowHeight = window.innerHeight * window.devicePixelRatio;
                        const screenWidth = window.screen.width;
                        const screenHeight = window.screen.height;

                        if (windowWidth / screenWidth >= 0.95 && windowHeight / screenHeight >= 0.95) {
                            self.fscreen.inFullscreen = true;
                        } else {
                            self.fscreen.inFullscreen = false;
                        }

                        doFullscreenChange();

                        let header = document.body.getElementsByTagName('header');
                        if (self.fscreen.inFullscreen) {
                            btn.setAttribute('disabled', 'disabled');

                            if (header.length > 0) {
                                header[0].classList.add("tc-ctl-fscreenToHeader");
                            }

                            self.map.div.classList.add("tc-ctl-fscreenToMap");
                            if (self.map.view3D) {
                                self.map.view3D.container.classList.add("tc-ctl-fscreenToMap");
                            }

                        } else {
                            btn.removeAttribute('disabled');

                            if (header.length > 0) {
                                header[0].classList.remove("tc-ctl-fscreenToHeader");
                            }

                            self.map.div.classList.remove("tc-ctl-fscreenToMap");
                            if (self.map.view3D) {
                                self.map.view3D.container.classList.remove("tc-ctl-fscreenToMap");
                            }
                        }

                        btn.setAttribute('title', self.fscreen.inFullscreen ? self.getLocaleString('fscreen.tip.keyboard') : self.getLocaleString("fscreen.tip"));

                        const resizeEvent = document.createEvent('HTMLEvents');
                        resizeEvent.initEvent('resize', false, false);
                        self.map.div.dispatchEvent(resizeEvent); // Para evitar que el mapa quede estirado o achatado después de gestionar la cabecera.
                    });
                }
            } else {
                // GLS: 19/02/2019 en lugar de ocultar el botón, deshabilitamos el control para que no quede espacio de más entre los botones
                self.disable();
            }
        });

        return result;
    };

})();

const FullScreen = TC.control.FullScreen;
export default FullScreen;
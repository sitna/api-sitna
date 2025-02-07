import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';
import Util from '../Util';
import Controller from '../Controller';
import Observer from '../Observer';

TC.control = TC.control || {};

const document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};
class FullScreenModel {
    constructor() {
        this["fscreen.tip"] = "";
    }
}

class FullScreen extends Control {
    #byBtn = false;

    async register(map) {
        const self = this;
        await super.register.call(self, map);

        self.model = new FullScreenModel();

        const btn = self.div.querySelector('.' + self.CLASS + '-btn');

        if (document.fullscreenEnabled) {

            const onFullscreenChange = () => {
                const isFullScreen = btn.classList.toggle(Consts.classes.ACTIVE, self.isFullScreen() || self.isElementFullScreen());
                const titleKey = isFullScreen ?
                    (self.isElementFullScreen() ? 'fscreen.tip.return' : 'fscreen.tip.keyboard') :
                    'fscreen.tip';
                btn.setAttribute('title', self.getLocaleString(titleKey));
            };

            document.addEventListener('fullscreenchange', onFullscreenChange, false);

            btn.addEventListener('click', function () {
                self.#byBtn = true;
                if (self.isFullScreen()) {
                    document.exitFullscreen();
                } else {
                    document.body.requestFullscreen();
                }
            }, false);

            if (!Util.detectMobile()) {
                window.addEventListener('resize', () => {
                    if (self.#byBtn) {
                        self.#byBtn = false;
                        return;
                    }

                    onFullscreenChange();

                    let header = document.body.getElementsByTagName('header');
                    if (self.isFullScreen()) {
                        if (!self.isElementFullScreen()) {
                            btn.disabled = true;
                        }

                        if (header.length > 0) {
                            header[0].classList.add(self.CLASS + '-to-header');
                        }

                        self.map.div.classList.add(self.CLASS + '-to-map');
                        if (self.map.view3D) {
                            self.map.view3D.container.classList.add(self.CLASS + '-to-map');
                        }

                    } else {
                        btn.disabled = false;

                        if (header.length > 0) {
                            header[0].classList.remove(self.CLASS + '-to-header');
                        }

                        self.map.div.classList.remove(self.CLASS + '-to-map');
                        if (self.map.view3D) {
                            self.map.view3D.container.classList.remove(self.CLASS + '-to-map');
                        }
                    }

                    const resizeEvent = document.createEvent('HTMLEvents');
                    resizeEvent.initEvent('resize', false, false);
                    self.map.div.dispatchEvent(resizeEvent); // Para evitar que el mapa quede estirado o achatado después de gestionar la cabecera.
                });
            }
        } else {
            // GLS: 19/02/2019 en lugar de ocultar el botón, deshabilitamos el control para que no quede espacio de más entre los botones
            self.disable();
        }
    
        self.renderPromise().then(function () {
            self.controller = new Controller(self.model, new Observer(self.div));
            self.updateModel();
        });

        return self;
    }

    isFullScreen() {
        const windowWidth = window.innerWidth * window.devicePixelRatio;
        const windowHeight = window.innerHeight * window.devicePixelRatio;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;

        return windowWidth / screenWidth >= 0.95 && windowHeight / screenHeight >= 0.95;
    }

    isElementFullScreen() {
        return document.fullscreenElement !== null;
    }

    async loadTemplates() {
        const module = await import('../templates/tc-ctl-fscreen.mjs');
        this.template = module.default;
    }

    updateModel(){
        this.model["fscreen.tip"] = this.getLocaleString("fscreen.tip");
    }
    async changeLanguage() {
        const self = this;
        self.updateModel();
    }
}

FullScreen.prototype.CLASS = 'tc-ctl-fscreen';
TC.control.FullScreen = FullScreen;
export default FullScreen;
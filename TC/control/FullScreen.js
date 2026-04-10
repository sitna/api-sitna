import Consts from '../Consts.js';
import WebComponentControl from './WebComponentControl.js';
import Util from '../Util.js';
import Controller from '../Controller.js';
import Observer from '../Observer.js';

const elementName = 'sitna-fullscreen';

const document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};
class FullScreenModel {
    constructor() {
        this["fscreen.tip"] = "";
    }
}

class FullScreen extends WebComponentControl {
    #byBtn = false;

    async register(map) {
        const self = this;
        await super.register.call(self, map);

        self.model = new FullScreenModel();

        const btn = self.querySelector('.' + self.CLASS + '-btn');

        if (document.fullscreenEnabled) {

            const onFullscreenChange = () => {
                const isFullScreen = btn.classList.toggle(Consts.classes.ACTIVE, Util.detectMobile() ? self.isElementFullScreen() : self.isElementFullScreen());
                const titleKey = isFullScreen ?
                    (self.isElementFullScreen() ? 'fscreen.tip.return' : 'fscreen.tip.keyboard') :
                    'fscreen.tip';
                btn.setAttribute('title', self.getLocaleString(titleKey));
            };

            document.addEventListener('fullscreenchange', onFullscreenChange, false);

            btn.addEventListener('click', function () {
                self.#byBtn = true;
                if (Util.detectMobile() ? self.isElementFullScreen() : self.isFullScreen()) {
                    // Si se ha activado el modo pantalla desde F11, mostrará el error "Document not active"
                    document.exitFullscreen().catch((e) => {
                        if (!(e instanceof TypeError)) throw e;
                        return false;
                    });
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
            self.controller = new Controller(self.model, new Observer(self));
            self.updateModel();
        });

        return self;
    }

    isFullScreen() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;

        return windowWidth / screenWidth >= 0.95 && windowHeight / screenHeight >= 0.95;
    }

    isElementFullScreen() {
        if (document.fullscreenElement === null) return false;
        if (document.mozFullscreenElement === null) return false;
        if (document.webkitFullscreenElement === null) return false;
        return true;
    }

    async loadTemplates() {
        const module = await import('../templates/tc-ctl-fscreen.mjs');
        this.template = module.default;
    }

    updateModel(){
        this.model["fscreen.tip"] = this.getLocaleString("fscreen.tip");
    }

}

FullScreen.prototype.CLASS = 'tc-ctl-fscreen';
customElements.get(elementName) || customElements.define(elementName, FullScreen);
export default FullScreen;
import TC from '../../TC.js';
import WebComponentControl from './WebComponentControl.js';
import Controller from '../Controller.js';
import Observer from '../Observer.js';
import NavBarWrapper from '../ol/NavBar.js';

class NavBarModel {
    constructor() {
        this.zoomIn = "";
        this.zoomOut = "";
        this.zoomBar = "";
    }
}
class NavBar extends WebComponentControl {

    static {
        customElements.define('sitna-zoom-bar', this);
    }

    render() {
        const self = this;
        if (!self.wrap) {
            self.wrap = new NavBarWrapper(self);
        }
        self.classList.add(WebComponentControl.prototype.CLASS, self.CLASS);
        const renderPromise = Promise.resolve();
        self._firstRender ??= renderPromise;
        return renderPromise;
    }

    async register(map) {
        const self = this;
        const superRegisterPromise = super.register.call(self, map);
        await self.wrap.register(map);

        if (self.options.home === undefined || self.options.home) {
            await map.addControl('navBarHome');
        }

        //esta chama es para que la primera vez se ajuste la barrita de escala (debido a otra chama con el maxResolution, que es culpa de OL)
        map.loaded(function () {
            self.wrap.refresh();
        });      

        await superRegisterPromise;

        self.model = new NavBarModel();
        self.controller = new Controller(self.model, new Observer(self));
        self.model.zoomIn = self.getLocaleString('zoomIn');
        self.model.zoomOut = self.getLocaleString('zoomOut');
        self.model.zoomBar = self.getLocaleString('zoomBar');
        return self;
    }
    async updateLanguage() {
        const self = this;
        self.model.zoomIn = self.getLocaleString('zoomIn');
        self.model.zoomOut = self.getLocaleString('zoomOut');
        self.model.zoomBar = self.getLocaleString('zoomBar');
    }

}

NavBar.prototype.CLASS = 'tc-ctl-nav';
export default NavBar;
import TC from '../../TC';
import Control from '../Control';
import Controller from '../Controller';
import Observer from '../Observer';

TC.control = TC.control || {};
class NavBarModel {
    constructor() {
        this.zoomIn = "";
        this.zoomOut = "";
    }
}
class NavBar extends Control {

    render() {
        const self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.NavBar(self);
        }
        const renderPromise = Promise.resolve();
        self._firstRender ??= renderPromise;
        renderPromise.then(() => {
            
        });
        return renderPromise;
    }

    async register(map) {
        const self = this;
        const superRegisterPromise = super.register.call(self, map);
        self.wrap.register(map);

        if (self.options.home === undefined || self.options.home) {
            await map.addControl('navBarHome');
        }

        //esta chama es para que la primera vez se ajuste la barrita de escala (debido a otra chama con el maxResolution, que es culpa de OL)
        map.loaded(function () {
            self.wrap.refresh();
        });      

        await superRegisterPromise;

        self.model = new NavBarModel();
        self.controller = new Controller(self.model, new Observer(self.div));
        self.model.zoomIn = self.getLocaleString('zoomIn');
        self.model.zoomOut = self.getLocaleString('zoomOut');
        return self;
    }
    async changeLanguage() {
        const self = this;
        self.model.zoomIn = self.getLocaleString('zoomIn');
        self.model.zoomOut = self.getLocaleString('zoomOut');
    }

}

NavBar.prototype.CLASS = 'tc-ctl-nav';
TC.control.NavBar = NavBar;
export default NavBar;
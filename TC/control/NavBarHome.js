import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import WebComponentControl from './WebComponentControl.js';
import Controller from '../Controller.js';
import Observer from '../Observer.js';
import NavBarHomeWrapper from '../ol/NavBarHome.js';

TC.control = TC.control || {};
class NavBarHomeModel{
    constructor() {
        this.zoomToInitialExtent = "";
    }
}
class NavBarHome extends WebComponentControl {

    static {
        customElements.define('sitna-home', this);
    }

    render() {
        const self = this;
        if (!self.wrap) {
            self.wrap = new NavBarHomeWrapper(self);
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

        map.on(Consts.event.PROJECTIONCHANGE, function (e) {
            const crs = e.newCrs;
            const bottomLeft = Util.reproject([map.options.initialExtent[0], map.options.initialExtent[1]], map.options.crs, crs);
            const topRight = Util.reproject([map.options.initialExtent[2], map.options.initialExtent[3]], map.options.crs, crs);
            self.wrap.setInitialExtent([bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]]);
        });
        await superRegisterPromise;

        self.model = new NavBarHomeModel();
        self.controller = new Controller(self.model, new Observer(self.div));
        self.model.zoomToInitialExtent = self.getLocaleString('zoomToInitialExtent');

        return self;
    }

    async updateLanguage() {
        const self = this;
        self.model.zoomToInitialExtent = self.getLocaleString('zoomToInitialExtent');
    }
}

NavBarHome.prototype.CLASS = 'tc-ctl-nav-home';
export default NavBarHome;
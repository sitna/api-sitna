import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Control from '../Control';
import Controller from '../Controller';
import Observer from '../Observer';


TC.control = TC.control || {};
class NavBarHomeModel{
    constructor() {
        this.zoomToInitialExtent = "";
    }
}
class NavBarHome extends Control {

    render() {
        const self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.NavBarHome(self);
        }
        const renderPromise = Promise.resolve();
        self._firstRender ??= renderPromise;
        return renderPromise;
    }

    async register(map) {
        const self = this;
        const superRegisterPromise = super.register.call(self, map);
        self.wrap.register(map);

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

    async changeLanguage() {
        const self = this;
        self.model.zoomToInitialExtent = self.getLocaleString('zoomToInitialExtent');
    }
}

NavBarHome.prototype.CLASS = 'tc-ctl-nav-home';
TC.control.NavBarHome = NavBarHome;
export default NavBarHome;
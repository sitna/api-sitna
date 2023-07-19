import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';

TC.control = TC.control || {};

class NavBarHome extends Control {
    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.add(self.CLASS);
    }

    getClassName() {
        return 'tc-ctl-nav-home';
    }

    render() {
        const self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.NavBarHome(self);
        }
        return Promise.resolve();
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);
        self.wrap.register(map);

        map.on(Consts.event.PROJECTIONCHANGE, function (e) {
            const crs = e.newCrs;
            const bottomLeft = TC.Util.reproject([map.options.initialExtent[0], map.options.initialExtent[1]], map.options.crs, crs);
            const topRight = TC.Util.reproject([map.options.initialExtent[2], map.options.initialExtent[3]], map.options.crs, crs);
            self.wrap.setInitialExtent([bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]]);
        });

        return self;
    }
}

TC.control.NavBarHome = NavBarHome;
export default NavBarHome;
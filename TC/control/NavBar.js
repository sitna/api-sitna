import TC from '../../TC';
import Control from '../Control';

TC.control = TC.control || {};

class NavBar extends Control {
    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.add(self.CLASS);
    }

    getClassName() {
        return 'tc-ctl-nav';
    }

    render() {
        const self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.NavBar(self);
        }
        return self._set1stRenderPromise(Promise.resolve());
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
        return self;
    }
}

TC.control.NavBar = NavBar;
export default NavBar;
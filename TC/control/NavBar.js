import TC from '../../TC';
import Control from '../Control';

TC.control = TC.control || {};

class NavBar extends Control {

    render() {
        const self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.NavBar(self);
        }
        const renderPromise = Promise.resolve();
        self._firstRender ??= renderPromise;
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
        return self;
    }
}

NavBar.prototype.CLASS = 'tc-ctl-nav';
TC.control.NavBar = NavBar;
export default NavBar;
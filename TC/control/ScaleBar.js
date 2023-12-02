import TC from '../../TC';
import Control from '../Control';

TC.control = TC.control || {};

class ScaleBar extends Control {
    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.add(self.CLASS);
    }

    getClassName() {
        return 'tc-ctl-sb';
    }

    render() {
        const self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.ScaleBar(self);
        }
        self.wrap.render();
        return self._set1stRenderPromise(Promise.resolve());
    }

    async register(map) {
        const self = this;
        const objects = await Promise.all([super.register.call(self, map), map.wrap.getMap()]);
        objects[1].addControl(self.wrap.ctl);
        return self;
    }

    getText() {
        const self = this;

        return self.wrap.getText();
    }
}

TC.control.ScaleBar = ScaleBar;
export default ScaleBar;
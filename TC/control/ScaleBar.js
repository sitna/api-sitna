import TC from '../../TC';
import Control from '../Control';

TC.control = TC.control || {};

class ScaleBar extends Control {

    render() {
        const self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.ScaleBar(self);
        }
        self.wrap.render();
        const renderPromise = Promise.resolve();
        self._firstRender ??= renderPromise;
        return renderPromise;
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

ScaleBar.prototype.CLASS = 'tc-ctl-sb';
TC.control.ScaleBar = ScaleBar;
export default ScaleBar;
import TC from '../../TC';
import Control from '../Control';

TC.control = TC.control || {};
TC.Control = Control;

TC.control.ScaleBar = function () {
    TC.Control.apply(this, arguments);
};

TC.inherit(TC.control.ScaleBar, TC.Control);

(function () {
    var ctlProto = TC.control.ScaleBar.prototype;

    ctlProto.CLASS = 'tc-ctl-sb';

    ctlProto.render = function () {
        var self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.ScaleBar(self);
        }
        self.wrap.render();
        return self._set1stRenderPromise(Promise.resolve());
    };

    ctlProto.register = async function (map) {
        const self = this;
        const objects = await Promise.all([TC.Control.prototype.register.call(self, map), map.wrap.getMap()]);
        objects[1].addControl(self.wrap.ctl);
        return self;
    };

    ctlProto.getText = function () {
        var self = this;

        return self.wrap.getText();
    };

})();

const ScaleBar = TC.control.ScaleBar;
export default ScaleBar;
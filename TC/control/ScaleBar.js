import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';

TC.Consts = Consts;
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

    ctlProto.register = function (map) {
        const self = this;
        return new Promise(function (resolve, _reject) {
            Promise.all([TC.Control.prototype.register.call(self, map), map.wrap.getMap()]).then(function (objects) {
                objects[1].addControl(self.wrap.ctl);
                resolve(self);
            });
        });
    };

    ctlProto.getText = function () {
        var self = this;

        return self.wrap.getText();
    };

})();

const ScaleBar = TC.control.ScaleBar;
export default ScaleBar;
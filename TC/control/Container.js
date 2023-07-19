import TC from '../../TC';
import Control from '../Control';

TC.control = TC.control || {};

const Container = function () {
    var self = this;

    Control.apply(self, arguments);    

    self.controlOptions = self.options.controls || [];

    self.ctlCount = self.controlOptions instanceof Array ? self.controlOptions.length : Object.keys(self.controlOptions).length;    
    self.defaultSelection = self.options.defaultSelection;

    self._ctlPromises = new Array(self.ctlCount);
};

TC.inherit(Container, Control);

(function () {
    var ctlProto = Container.prototype;

    ctlProto.register = async function (map) {
        const self = this;
        const ctlRegister = Control.prototype.register.call(self, map);

        self.uids = new Array(self.ctlCount);
        self.uids.forEach(function (_elm, idx, arr) {
            arr[idx] = self.getUID();
        });

        await Promise.all([ctlRegister, self.renderPromise()]);
        const ctl = await self.onRender();
        return ctl;
    };

    ctlProto.onRender = function () {
        return Promise.resolve(this);
    };

    ctlProto.render = function (_callback) { };

    ctlProto.getControl = function (idx) {
        var promise = this._ctlPromises[idx];
        if (!promise) {
            return Promise.reject(Error('No control found'));            
        }

        return promise;
    };

    ctlProto.getControls = function () {
        return Promise.all(this._ctlPromises);
    };

    ctlProto.onControlDisable = function (_control) {
    };

    ctlProto.onControlEnable = function (_control) {
    };
})();

TC.control.Container = Container;
export default Container;

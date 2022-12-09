import TC from '../../TC';
import Control from '../Control';

TC.control = TC.control || {};
TC.Control = Control;

TC.control.Container = function () {
    var self = this;

    TC.Control.apply(self, arguments);    

    self.controlOptions = self.options.controls || [];

    self.ctlCount = self.controlOptions instanceof Array ? self.controlOptions.length : Object.keys(self.controlOptions).length;    
    self.defaultSelection = self.options.defaultSelection;

    self._ctlPromises = new Array(self.ctlCount);
};

TC.inherit(TC.control.Container, TC.Control);

(function () {
    var ctlProto = TC.control.Container.prototype;

    ctlProto.register = function (map) {
        const self = this;
        const ctlRegister = TC.Control.prototype.register.call(self, map);

        self.uids = new Array(self.ctlCount);
        self.uids.forEach(function (_elm, idx, arr) {
            arr[idx] = self.getUID();
        });

        return new Promise(function (resolve, _reject) {
            Promise.all([ctlRegister, self.renderPromise()]).then(function () {
                self.onRender().then(ctl => resolve(ctl));
            });
        });        
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

const Container = TC.control.Container;
export default Container;

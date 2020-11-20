TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Container = function () {
    var self = this;

    TC.Control.apply(self, arguments);    

    self.controlOptions = self.options.controls || [];

    self.ctlCount = self.controlOptions instanceof Array ? self.controlOptions.length : Object.keys(self.controlOptions).length;    
    self.defaultSelection = self.options.defaultSelection;
};

TC.inherit(TC.control.Container, TC.Control);

(function () {
    var ctlProto = TC.control.Container.prototype;

    ctlProto.register = function (map) {
        const self = this;
        const ctlRegister = TC.Control.prototype.register.call(self, map);

        self.uids = new Array(self.ctlCount);
        self.uids.forEach(function (elm, idx, arr) {
            arr[idx] = self.getUID();
        });

        return new Promise(function (resolve, reject) {
            Promise.all([ctlRegister, self.renderPromise()]).then(function () {
                self.onRender().then(ctl => resolve(ctl));
            });
        });        
    };

    ctlProto.onRender = function () {
        return Promise.resolve(this);
    };

    ctlProto.render = function (callback) { };

    ctlProto.getControl = function (idx) {
        var promise = this._ctlPromises[idx];
        if (!promise) {
            return Promise.reject(Error('No control found'));            
        }

        return promise;
    };

})();

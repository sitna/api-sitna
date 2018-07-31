TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Click = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    if (self.options && self.options.callback) {
        self.callback = self.options.callback;
    }

    self.wrap = new TC.wrap.control.Click(self);
};

TC.inherit(TC.control.Click, TC.Control);

(function () {
    var ctlProto = TC.control.Click.prototype;

    ctlProto.CLASS = 'tc-ctl-click';

    ctlProto.register = function (map) {
        var self = this;
        self.wrap.register(map);
        TC.Control.prototype.register.call(self, map);
    };

    ctlProto.activate = function () {
        var self = this;
        TC.Control.prototype.activate.call(self);
        self.wrap.activate();
    };

    ctlProto.deactivate = function () {
        var self = this;
        self.wrap.deactivate();
        TC.Control.prototype.deactivate.call(self);
    };

    ctlProto.callback = function (coord, point) {
        console.log('[Click][' + coord[0] + ', ' + coord[1] + '][' + point[0] + ', ' + point[1] + ']');
    };
})();
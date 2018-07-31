TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

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
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);
        map.wrap.getMap().addControl(self.wrap.ctl);
    };

    ctlProto.getText = function () {
        var self = this;

        return self.wrap.getText();
    };

})();
TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.NavBarHome = function () {
    TC.Control.apply(this, arguments);
};

TC.inherit(TC.control.NavBarHome, TC.Control);

(function () {
    var ctlProto = TC.control.NavBarHome.prototype;

    ctlProto.CLASS = 'tc-ctl-nav-home';

    ctlProto.render = function () {
        var self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.NavBarHome(self);
        }
        return Promise.resolve();
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);
        self.wrap.register(map);        

        map.on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
            const crs = e.newCrs;
            var bottomLeft = TC.Util.reproject([map.options.initialExtent[0], map.options.initialExtent[1]], map.options.crs, crs);
            var topRight = TC.Util.reproject([map.options.initialExtent[2], map.options.initialExtent[3]], map.options.crs, crs);
            self.wrap.setInitialExtent([bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]]);
        });

        return result;
    };

})();
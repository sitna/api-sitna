TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.NavBar = function () {
    TC.Control.apply(this, arguments);
};

TC.inherit(TC.control.NavBar, TC.Control);

(function () {
    var ctlProto = TC.control.NavBar.prototype;

    ctlProto.CLASS = 'tc-ctl-nav';

    ctlProto.render = function () {
        var self = this;
        if (!self.wrap) {
            self.wrap = new TC.wrap.control.NavBar(self);
        }
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);
        self.wrap.register(map);

        //esta chama es para que la primera vez se ajuste la barrita de escala (debido a otra chama con el maxResolution, que es culpa de OL)
        map.loaded(function () {
            self.wrap.refresh();
        });

        map.on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
            var bottomLeft = TC.Util.reproject([map.options.initialExtent[0], map.options.initialExtent[1]], map.options.crs, e.crs);
            var topRight = TC.Util.reproject([map.options.initialExtent[2], map.options.initialExtent[3]], map.options.crs, e.crs);
            self.wrap.setInitialExtent([bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]]);
        });
    };

})();
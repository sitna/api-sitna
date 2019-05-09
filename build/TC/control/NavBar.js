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
        return self._set1stRenderPromise(Promise.resolve());
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);
        self.wrap.register(map);

        if (self.options.home === undefined || self.options.home) {
            map.addControl('navBarHome');
        }        

        //esta chama es para que la primera vez se ajuste la barrita de escala (debido a otra chama con el maxResolution, que es culpa de OL)
        map.loaded(function () {
            self.wrap.refresh();
        });        

        return result;
    };

})();
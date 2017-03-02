TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
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

            //setTimeout(function () {
                //console.log('GLS: modifico la altura y el ancho del slider');
                //$('.ol-zoomslider').css({
                //    'width': '2em',
                //    'height': '10em'
                //});
            //    console.log('GLS: modificado');
            //}, 500);
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
    };

})();
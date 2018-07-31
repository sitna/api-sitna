TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

TC.feature.Circle = function (coords, options) {
    var self = this;

    TC.Feature.apply(self, arguments);

    var opts;
    if (self.wrap.isNative(coords)) {
        coords._wrap = self.wrap;
        self.wrap.feature = coords;
    }
    else {
        opts = self.options = $.extend(true, self.options, TC.Cfg.styles.polygon, options);
        self.wrap.createCircle(coords, opts);
    }
};

TC.inherit(TC.feature.Circle, TC.Feature);

(function () {
    var featProto = TC.feature.Circle.prototype;

    featProto.STYLETYPE = TC.Consts.geom.POLYGON;

    featProto.CLASSNAME = 'TC.feature.Circle';

    featProto.getCoords = function () {
        return this.wrap.getGeometry();
    };

    featProto.setCoords = function (coords) {
        return this.wrap.setGeometry(coords);
    };

})();
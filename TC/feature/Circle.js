TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

TC.feature.Circle = function (coords, options) {
    const self = this;

    TC.Feature.apply(self, arguments);

    if (!self.wrap.isNative(coords)) {
        options = self.options = TC.Util.extend(true, self.options, TC.Cfg.styles.polygon, options);
        self.wrap.createCircle(coords, options);
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
        const self = this;
        if (Array.isArray(coords) &&
            Array.isArray(coords[0])
            && !Array.isArray(coords[0][0]) && !Array.isArray(coords[0][1])
            && !Array.isArray(coords[1])) {
            return TC.Feature.prototype.setCoords.call(self, coords);
        }
        else {
            throw new Error('Coordinates not valid for circle');
        }
    };

})();
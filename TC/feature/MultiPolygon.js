TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

/*
 * MultiPolygon
 * Parameters: coords, array of array of array of 2 element arrays of numbers; options, object
 */
TC.feature.MultiPolygon = function (coords, options) {
    var self = this;
    TC.Feature.apply(self, arguments);

    var opts;
    if (self.wrap.isNative(coords)) {
        coords._wrap = self.wrap;
        self.wrap.feature = coords;
    }
    else {
        opts = self.options = $.extend(true, self.options, TC.Cfg.styles.polygon, options);
        self.wrap.createMultiPolygon(coords, opts);
    }
};

TC.inherit(TC.feature.MultiPolygon, TC.Feature);

TC.feature.MultiPolygon.prototype.STYLETYPE = TC.Consts.geom.POLYGON;

TC.feature.MultiPolygon.prototype.CLASSNAME = 'TC.feature.MultiPolygon';

TC.feature.MultiPolygon.prototype.getCoords = function (options) {
    options = options || {};
    const coords = TC.Feature.prototype.getCoords.call(this, options);
    if (options.pointArray) {
        return [].concat.apply([], [].concat.apply([], coords));
    }
    return coords;
};

TC.feature.MultiPolygon.prototype.getLength = function (options) {
    return this.wrap.getLength(options);
};
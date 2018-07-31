TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

/*
 * Polygon
 * Parameters: coords, array of array of 2 element arrays of numbers; options, object
 */
TC.feature.Polygon = function (coords, options) {
    var self = this;

    TC.Feature.apply(self, arguments);

    var opts;
    if (self.wrap.isNative(coords)) {
        coords._wrap = self.wrap;
        self.wrap.feature = coords;
    }
    else {
        opts = self.options = $.extend(true, self.options, TC.Cfg.styles.polygon, options);
        self.wrap.createPolygon(coords, opts);
    }
};

TC.inherit(TC.feature.Polygon, TC.Feature);

TC.feature.Polygon.prototype.STYLETYPE = TC.Consts.geom.POLYGON;

TC.feature.Polygon.prototype.CLASSNAME = 'TC.feature.Polygon';

TC.feature.Polygon.prototype.getLength = function (options) {
    return this.wrap.getLength(options);
};

TC.feature.Polygon.prototype.getArea = function (options) {
    return this.wrap.getArea(options);
};
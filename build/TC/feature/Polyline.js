TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

/*
 * Polyline
 * Parameters: coords, array of 2 element arrays of numbers; options, object
 */
TC.feature.Polyline = function (coords, options) {
    var self = this;

    TC.Feature.apply(self, arguments);

    var opts;
    if (self.wrap.isNative(coords)) {
        coords._wrap = self.wrap;
        self.wrap.feature = coords;
    }
    else {
        opts = self.options = $.extend(true, self.options, TC.Cfg.styles.line, options);
        self.wrap.createPolyline(coords, opts);
    }
};

TC.inherit(TC.feature.Polyline, TC.Feature);

TC.feature.Polyline.prototype.STYLETYPE = "line";

TC.feature.Polyline.prototype.CLASSNAME = 'TC.feature.Polyline';

TC.feature.Polyline.prototype.getLength = function (options) {
    return this.wrap.getLength(options);
};
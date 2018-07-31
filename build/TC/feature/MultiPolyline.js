TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

/*
 * Polyline
 * Parameters: coords, array of 2 element arrays of numbers; options, object
 */
TC.feature.MultiPolyline = function (coords, options) {
    var self = this;

    TC.Feature.apply(self, arguments);

    var opts;
    if (self.wrap.isNative(coords)) {
        coords._wrap = self.wrap;
        self.wrap.feature = coords;
    }
    else {
        opts = self.options = $.extend(true, self.options, TC.Cfg.styles.line, options);
        self.wrap.createMultiPolyline(coords, opts);
    }
};

TC.inherit(TC.feature.MultiPolyline, TC.Feature);

TC.feature.MultiPolyline.prototype.STYLETYPE = "line";

TC.feature.MultiPolyline.prototype.CLASSNAME = 'TC.feature.MultiPolyline';
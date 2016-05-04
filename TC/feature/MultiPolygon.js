TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature.js');
}

/*
 * Polyline
 * Parameters: coords, array of 2 element arrays of numbers; options, object
 */

TC.feature.MultiPolygon = function (coords, options) {
    var self = this;
    TC.Feature.apply(self, arguments);

    var opts;
    if (self.wrap.isNative(coords)) {
        coords._wrap = self.wrap;
        self.wrap.feature = coords;
        self.geometry = self.wrap.getCoords(coords.geometry);
    }
    else {
        opts = self.options = $.extend(true, self.options, TC.Cfg.styles.polygon, options);
        self.wrap.createPolygon(coords[0], opts);
    }
};

TC.inherit(TC.feature.MultiPolygon, TC.Feature);

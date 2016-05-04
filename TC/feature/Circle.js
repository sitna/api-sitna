TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature.js');
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

    featProto.getCoords = function () {
        return this.wrap.getGeometry();
    };

    featProto.setCoords = function (coords) {
        return this.wrap.setGeometry(coords);
    };

    featProto.getInfo = function () {
        var self = this;
        var result = TC.Feature.prototype.getInfo.apply(self, arguments);
        if (!result) {
            result = self.title;
            if (self.group) {
                result += ' ' + self.group;
            }
        }
        if (!result) {
            result = TC.Util.getLocaleString(TC.Cfg.locale, 'noData');
        }
        return result;
    };

})();
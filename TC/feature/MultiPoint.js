TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

TC.feature.MultiPoint = function (coords, options) {
    var self = this;

    TC.Feature.apply(self, arguments);

    if (!self.wrap.isNative(coords)) {
        self.wrap.feature = coords;
        self.wrap.createMultiPoint(coords, options);
    }
};

TC.inherit(TC.feature.MultiPoint, TC.Feature);

TC.feature.MultiPoint.prototype.STYLETYPE = TC.Consts.geom.POINT;

TC.feature.MultiPoint.prototype.CLASSNAME = 'TC.feature.MultiPoint';

TC.feature.MultiPoint.prototype.setCoords = function (coords) {
    const self = this;
    if (Array.isArray(coords)) {
        if(!Array.isArray(coords[0])) {
            coords = [coords];
        }
    }
    else {
        throw new Error('Coordinates not valid for multipoint');
    }
    return TC.Feature.prototype.setCoords.call(self, coords);
};

TC.feature.MultiPoint.prototype.getCoords = function (options) {
    options = options || {};
    const coords = TC.Feature.prototype.getCoords.call(this, options);
    return coords;
};
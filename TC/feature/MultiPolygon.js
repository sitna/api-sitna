TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

/*
 * MultiPolygon
 * Parameters: coords, array of array of array of 2 element arrays of numbers; options, object
 */
TC.feature.MultiPolygon = function (coords, options) {
    const self = this;

    TC.Feature.apply(self, arguments);

    if (!self.wrap.isNative(coords)) {
        options = self.options = TC.Util.extend(true, self.options, TC.Cfg.styles.polygon, options);
        self.wrap.createMultiPolygon(coords, options);
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

TC.feature.MultiPolygon.prototype.setCoords = function (coords) {
    const self = this;
    if (Array.isArray(coords) && Array.isArray(coords[0])) {
        if (!Array.isArray(coords[0][0])) {
            coords = [[coords]];
        }
        else if (!Array.isArray(coords[0][0][0])) {
            coords = [coords];
        }
    }
    else {
        throw new Error('Coordinates not valid for multipolygon');
    }
    coords.forEach(function (polygon) {
        polygon.forEach(function (ring) {
            const startPoint = ring[0];
            const endPoint = ring[ring.length - 1];
            if (startPoint[0] !== endPoint[0] || startPoint[1] !== endPoint[1]) {
                ring[ring.length] = startPoint;
            }
        });
    });
    return TC.Feature.prototype.setCoords.call(self, coords);
};

TC.feature.MultiPolygon.prototype.getLength = function (options) {
    return this.wrap.getLength(options);
};
TC.feature = TC.feature || {};

if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}

/*
 * Polygon
 * Parameters: coords, array of array of 2 element arrays of numbers; options, object
 */
TC.feature.Polygon = function (coords, options) {
    const self = this;

    TC.Feature.apply(self, arguments);

    if (!self.wrap.isNative(coords)) {
        self.wrap.createPolygon(coords, options);
    }
};

TC.inherit(TC.feature.Polygon, TC.Feature);

TC.feature.Polygon.prototype.STYLETYPE = TC.Consts.geom.POLYGON;

TC.feature.Polygon.prototype.CLASSNAME = 'TC.feature.Polygon';

TC.feature.Polygon.prototype.getCoords = function (options) {
    options = options || {};
    const coords = TC.Feature.prototype.getCoords.call(this, options);
    if (options.pointArray) {
        return [].concat.apply([], coords);
    }
    return coords;
};

TC.feature.Polygon.prototype.setCoords = function (coords) {
    const self = this;
    if (Array.isArray(coords) && Array.isArray(coords[0])) {
        if (!Array.isArray(coords[0][0])) {
            coords = [coords];
        }
    }
    else {
        throw new Error('Coordinates not valid for polygon');
    }
    coords.forEach(function (ring) {
        const startPoint = ring[0];
        const endPoint = ring[ring.length - 1];
        if (startPoint[0] !== endPoint[0] || startPoint[1] !== endPoint[1]) {
            ring[ring.length] = startPoint;
        }
    });
    return TC.Feature.prototype.setCoords.call(self, coords);
};

TC.feature.Polygon.prototype.getLength = function (options) {
    return this.wrap.getLength(options);
};

TC.feature.Polygon.prototype.getArea = function (options) {
    return this.wrap.getArea(options);
};
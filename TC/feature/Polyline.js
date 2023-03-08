import TC from '../../TC';
import Feature from '../Feature';
TC.Feature = Feature;
TC.feature = TC.feature || {};

/*
 * Polyline
 * Parameters: coords, array of 2 element arrays of numbers; options, object
 */
TC.feature.Polyline = function (coords, options) {
    const self = this;

    TC.Feature.apply(self, arguments);

    if (!self.wrap.isNative(coords)) {
        self.wrap.createPolyline(coords, options);
    }
};

TC.inherit(TC.feature.Polyline, TC.Feature);

TC.feature.Polyline.prototype.STYLETYPE = "line";

TC.feature.Polyline.prototype.CLASSNAME = 'TC.feature.Polyline';

TC.feature.Polyline.prototype.setCoords = function (coords) {
    const self = this;
    if (Array.isArray(coords) && !Array.isArray(coords[0])) {
        coords = [coords];
    }
    return TC.Feature.prototype.setCoords.call(self, coords);
};

TC.feature.Polyline.prototype.getLength = function (options) {
    return this.wrap.getLength(options);
};

const Polyline = TC.feature.Polyline;
export default Polyline;
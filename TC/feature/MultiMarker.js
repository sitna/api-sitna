import TC from '../../TC';
import Feature from '../Feature';
import MultiPoint from './MultiPoint';
TC.Feature = Feature;
TC.feature = TC.feature || {};
TC.feature.MultiPoint = MultiPoint;

TC.feature.MultiMarker = function (coords, options) {
    var self = this;

    TC.Feature.apply(self, arguments);

    if (!self.wrap.isNative(coords)) {
        self.wrap.feature = coords;
        self.wrap.createMultiMarker(coords, options);
    }
};

TC.inherit(TC.feature.MultiMarker, TC.feature.MultiPoint);

TC.feature.MultiMarker.prototype.STYLETYPE = 'marker';

TC.feature.MultiMarker.prototype.CLASSNAME = 'TC.feature.MultiMarker';

TC.feature.MultiMarker.prototype.setCoords = function (coords) {
    const self = this;
    if (Array.isArray(coords)) {
        if(!Array.isArray(coords[0])) {
            coords = [coords];
        }
    }
    else {
        throw new Error('Coordinates not valid for multimarker');
    }
    return TC.Feature.prototype.setCoords.call(self, coords);
};

TC.feature.MultiMarker.prototype.getCoords = function (options) {
    options = options || {};
    const coords = TC.Feature.prototype.getCoords.call(this, options);
    return coords;
};

const MultiMarker = TC.feature.MultiMarker;
export default MultiMarker;
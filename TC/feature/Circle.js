import TC from '../../TC';
import Feature from '../Feature';
TC.Feature = Feature;
TC.feature = TC.feature || {};

TC.feature.Circle = function (coords, options) {
    const self = this;

    TC.Feature.apply(self, arguments);

    if (!self.wrap.isNative(coords)) {
        self.wrap.createCircle(coords, options);
    }
};

TC.inherit(TC.feature.Circle, TC.Feature);

(function () {
    var featProto = TC.feature.Circle.prototype;

    featProto.STYLETYPE = TC.Consts.geom.POLYGON;

    featProto.CLASSNAME = 'TC.feature.Circle';

    featProto.getCoords = function () {
        return this.wrap.getGeometry();

    };

    featProto.setCoords = function (coords) {
        const self = this;
        if (Array.isArray(coords) &&
            Array.isArray(coords[0]) && 
            !Array.isArray(coords[0][0]) && !Array.isArray(coords[0][1]) && 
            !Array.isArray(coords[1])) {
            return TC.Feature.prototype.setCoords.call(self, coords);
        }
        else {
            throw new Error('Coordinates not valid for circle');
        }
    };

})();

const Circle = TC.feature.Circle;
export default Circle;
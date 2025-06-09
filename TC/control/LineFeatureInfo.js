import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import GeometryFeatureInfo from './GeometryFeatureInfo.js';

TC.control = TC.control || {};

class LineFeatureInfo extends GeometryFeatureInfo {
    constructor() {
        super(...arguments);
        const self = this;
        self.geometryType = Consts.geom.POLYLINE;
        self.style = Util.extend(true, { strokeColor: self.DEFAULT_STROKE_COLOR, strokeWidth: 2 }, self.options.style);
    }
}

TC.control.LineFeatureInfo = LineFeatureInfo;
export default LineFeatureInfo;
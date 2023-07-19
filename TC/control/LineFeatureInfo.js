import TC from '../../TC';
import Consts from '../Consts';
import GeometryFeatureInfo from './GeometryFeatureInfo';

TC.control = TC.control || {};

class LineFeatureInfo extends GeometryFeatureInfo {
    constructor() {
        super(...arguments);
        const self = this;
        self.geometryType = Consts.geom.POLYLINE;
        self.style = TC.Util.extend(true, { strokeColor: self.DEFAULT_STROKE_COLOR, strokeWidth: 2 }, self.options.style);
    }
}

TC.control.LineFeatureInfo = LineFeatureInfo;
export default LineFeatureInfo;
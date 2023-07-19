import TC from '../../TC';
import Consts from '../Consts';
import GeometryFeatureInfo from './GeometryFeatureInfo';

TC.control = TC.control || {};

class PolygonFeatureInfo extends GeometryFeatureInfo {
    constructor() {
        super(...arguments);
        const self = this;
        self.geometryType = Consts.geom.POLYGON;
        self.style = TC.Util.extend(true, { strokeColor: self.DEFAULT_STROKE_COLOR, strokeWidth: 2, fillColor: "#000", fillOpacity: 0.3 }, self.options.style);
    }
}

TC.control.PolygonFeatureInfo = PolygonFeatureInfo;
export default PolygonFeatureInfo;
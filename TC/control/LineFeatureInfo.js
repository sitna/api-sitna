import TC from '../../TC';
import Consts from '../Consts';
import GeometryFeatureInfo from './GeometryFeatureInfo';

TC.control = TC.control || {};
TC.Consts = Consts;
TC.control.GeometryFeatureInfo = GeometryFeatureInfo;


(function () {
    TC.control.LineFeatureInfo = function () {
        var self = this;
        TC.control.GeometryFeatureInfo.apply(this, arguments);
        self.geometryType = TC.Consts.geom.POLYLINE;
        self.style = TC.Util.extend(true, { strokeColor: self.DEFAULT_STROKE_COLOR, strokeWidth: 2 }, self.options.style); 
    };

    TC.inherit(TC.control.LineFeatureInfo, TC.control.GeometryFeatureInfo);

    var ctlProto = TC.control.LineFeatureInfo.prototype;

    ctlProto.CLASS = 'tc-ctl-finfo';

})();

const LineFeatureInfo = TC.control.LineFeatureInfo;
export default LineFeatureInfo;
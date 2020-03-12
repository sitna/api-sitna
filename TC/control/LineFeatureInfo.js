TC.control = TC.control || {};

if (!TC.control.GeometryFeatureInfo) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/GeometryFeatureInfo');
}

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
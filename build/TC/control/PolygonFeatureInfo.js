TC.control = TC.control || {};

if (!TC.control.GeometryFeatureInfo) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/GeometryFeatureInfo');
}

(function () {
    TC.control.PolygonFeatureInfo = function () {
        var self = this;
        TC.control.GeometryFeatureInfo.apply(this, arguments);
        self.geometryType = TC.Consts.geom.POLYGON;
    };

    TC.inherit(TC.control.PolygonFeatureInfo, TC.control.GeometryFeatureInfo);

    var ctlProto = TC.control.PolygonFeatureInfo.prototype;

    ctlProto.CLASS = 'tc-ctl-finfo';

})();
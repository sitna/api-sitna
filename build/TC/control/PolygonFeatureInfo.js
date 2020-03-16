TC.control = TC.control || {};

if (!TC.control.GeometryFeatureInfo) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/GeometryFeatureInfo');
}

(function () {
    TC.control.PolygonFeatureInfo = function () {
        var self = this;
        TC.control.GeometryFeatureInfo.apply(this, arguments);
        self.geometryType = TC.Consts.geom.POLYGON;
        self.style = TC.Util.extend(true, { strokeColor: self.DEFAULT_STROKE_COLOR, strokeWidth: 2, fillColor: "#000", fillOpacity: 0.3 }, self.options.style);
    };

    TC.inherit(TC.control.PolygonFeatureInfo, TC.control.GeometryFeatureInfo);

    var ctlProto = TC.control.PolygonFeatureInfo.prototype;

    ctlProto.CLASS = 'tc-ctl-finfo';

})();
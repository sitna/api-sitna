import TC from '../TC';
import EventTarget from './EventTarget';

// OpenLayers connectors
const wrap = {
    Map: function (map) {
        var self = this;
        self.parent = map;
        self.map = null;
        /*
         *  wrap.getMap: Gets OpenLayers map or a promise for the OpenLayers map
         */
        self.getMap = function () {
            return self._promise;
        };
    },
    Layer: function (layer) {
        var self = this;
        self.parent = layer;
        self.layer = null;
        EventTarget.call(self);
        /*
         *  getLayer: Gets OpenLayers layer or a promise for the OpenLayers layer
         */
        self.getLayer = function () {
            if (self.layer) {
                return Promise.resolve(self.layer);
            }
            return self._promise;
        };
        /*
         *  setLayer: Resolves the deferred layer object
         * Parameter: the OpenLayers layer
         */
        self.setLayer = function (olLayer) {
            self.layer = olLayer;
        };
    },
    layer: {
        Raster: function () { wrap.Layer.apply(this, arguments); },
        Vector: function () { wrap.Layer.apply(this, arguments); }
    },
    Control: function (ctl) {
        var self = this;
        self.parent = ctl;
    },
    control: {
        Click: function () { wrap.Control.apply(this, arguments); },
        ScaleBar: function () { wrap.Control.apply(this, arguments); },
        NavBar: function () { wrap.Control.apply(this, arguments); },
        NavBarHome: function () { wrap.Control.apply(this, arguments); },
        Coordinates: function () { wrap.Control.apply(this, arguments); },
        Search: function () { wrap.Control.apply(this, arguments); },
        Measure: function () { wrap.Control.apply(this, arguments); },
        OverviewMap: function () { wrap.Control.apply(this, arguments); },
        FeatureInfo: function () { wrap.Control.apply(this, arguments); },
        Popup: function () { wrap.Control.apply(this, arguments); },
        GeometryFeatureInfo: function () { wrap.Control.apply(this, arguments); },
        Geolocation: function () { wrap.Control.apply(this, arguments); },
        Draw: function () { wrap.Control.apply(this, arguments); },
        Modify: function () { wrap.Control.apply(this, arguments); },
        OfflineMapMaker: function () { wrap.Control.apply(this, arguments); },
        Edit: function () { wrap.Control.apply(this, arguments); },
        ResultsPanel: function () { wrap.Control.apply(this, arguments); }
    },
    Feature: function () { },
    Geometry: function () { },
};

TC.inherit(wrap.Layer, EventTarget);
TC.inherit(wrap.layer.Raster, wrap.Layer);
TC.inherit(wrap.layer.Vector, wrap.Layer);
TC.inherit(wrap.control.Click, wrap.Control);
TC.inherit(wrap.control.ScaleBar, wrap.Control);
TC.inherit(wrap.control.NavBar, wrap.Control);
TC.inherit(wrap.control.NavBarHome, wrap.Control);
TC.inherit(wrap.control.Coordinates, wrap.Control);
TC.inherit(wrap.control.Measure, wrap.Control);
TC.inherit(wrap.control.OverviewMap, wrap.Control);
TC.inherit(wrap.control.Popup, wrap.Control);
TC.inherit(wrap.control.FeatureInfo, wrap.control.Click);
TC.inherit(wrap.control.GeometryFeatureInfo, wrap.control.Click);
TC.inherit(wrap.control.Geolocation, wrap.Control);
TC.inherit(wrap.control.Draw, wrap.Control);
TC.inherit(wrap.control.OfflineMapMaker, wrap.Control);
TC.inherit(wrap.control.Edit, wrap.Control);
TC.inherit(wrap.control.ResultsPanel, wrap.Control);

export default wrap;
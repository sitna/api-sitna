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
    Feature: function () { },
    Geometry: function () { },
};

export default wrap;
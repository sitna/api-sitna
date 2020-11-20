TC.tool = TC.tool || {};

if (!TC.tool.ElevationService) {
    TC.syncLoadJS(TC.apiLocation + 'TC/tool/ElevationService');
}

TC.tool.ElevationServiceIGNFr = function (options) {
    const self = this;
    TC.tool.ElevationService.apply(self, arguments);
    self.url = self.options.url || '//wxs.ign.fr/njfzwf3vgc55gekk8ra4zezx/alti/wps';
    self.process = self.options.process || 'gs:WPSElevation';
    self.profileProcess = self.options.profileProcess || 'gs:WPSLineElevation';
    self.minimumElevation = self.options.minimumElevation || -99998;
    self.nativeCRS = 'EPSG:4326';
};

TC.inherit(TC.tool.ElevationServiceIGNFr, TC.tool.ElevationService);

(function () {
    const toolProto = TC.tool.ElevationServiceIGNFr.prototype;

    toolProto.request = function (options) {
        const self = this;
        options = options || {};
        let coordinateList = options.coordinates;
        if (options.crs && options.crs !== self.nativeCRS) {
            coordinateList = TC.Util.reproject(coordinateList, options.crs, self.nativeCRS);
        }
        const dataInputs = {
            lon: coordinateList.map(function (coord) {
                return coord[0];
            }).join('|'),
            lat: coordinateList.map(function (coord) {
                return coord[1];
            }).join('|'),
            crs: 'crs:84',
            format: 'json'
        };
        return TC.tool.ElevationService.prototype.request.call(self, { dataInputs: dataInputs, process: self.process });
    };

    toolProto.parseResponse = function (response, options) {
        var self = this;
        if (response.elevations) {
            var elevations = response.elevations.map(function (elev) {
                return [elev.lon, elev.lat, elev.z];
            });
            if (options.crs && options.crs !== self.nativeCRS) {
                elevations = TC.Util.reproject(elevations, self.nativeCRS, options.crs);
            }
            return TC.tool.ElevationService.prototype.parseResponse.call(self, { coordinates: elevations }, options);
        }
        return [];
    };
})();
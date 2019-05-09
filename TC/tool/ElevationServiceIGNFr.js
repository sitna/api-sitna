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
        var coordinateListArray;
        var isPolygon = false;
        switch (true) {
            case TC.Geometry.isPoint(options.coordinates):
                coordinateListArray = [[options.coordinates]];
                break;
            case TC.Geometry.isRing(options.coordinates):
                coordinateListArray = [options.coordinates];
                break;
            case TC.Geometry.isRingCollection(options.coordinates):
                coordinateListArray = options.coordinates;
                isPolygon = true;
                break;
            default:
                break;
        }
        if (options.crs && options.crs !== self.CRS) {
            coordinateListArray = TC.Util.reproject(coordinateListArray, options.crs, self.nativeCRS);
        }
        const flatCoordinateListArray = [].concat.apply([], coordinateListArray);
        const dataInputs = {
            lon: flatCoordinateListArray.map(function (coord) {
                return coord[0];
            }).join('|'),
            lat: flatCoordinateListArray.map(function (coord) {
                return coord[1];
            }).join('|'),
            crs: 'crs:84',
            format: 'json'
        };
        var process = self.process;
        if (options.sampleNumber) {
            process = self.profileProcess;
            dataInputs.sampling = options.sampleNumber;
        }
        else if (options.resolution) {
            process = self.profileProcess;
            const getDistance = function (p1, p2) {
                const dx = p2[0] - p1[0];
                const dy = p2[1] - p1[1];
                return Math.sqrt(dx * dx + dy * dy);
            };
            var totalDistance = 0;
            coordinateListArray.forEach(function (coordList) {
                totalDistance += coordList
                    .map(function (coord, i, arr) {
                        const prev = arr[i - 1];
                        if (prev) {
                            return getDistance(prev, coord);
                        }
                        return 0;
                    })
                    .reduce(function (prev, curr) {
                        return prev + curr;
                    }, 0);
                if (isPolygon) {
                    totalDistance += getDistance(coordList[coordList.length - 1], coordList[0]);
                }
            });

            dataInputs.sampling = totalDistance / options.resolution;
        }
        return TC.tool.ElevationService.prototype.request.call(self, { dataInputs: dataInputs, process: process });
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
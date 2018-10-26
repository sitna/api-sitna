TC.tool = TC.tool || {};

if (!TC.tool.ElevationService) {
    TC.syncLoadJS(TC.apiLocation + 'TC/tool/ElevationService');
}

TC.tool.ElevationServiceIDENA = function (options) {
    const self = this;
    TC.tool.ElevationService.apply(self, arguments);
    self.url = self.options.url || '//idena.navarra.es/ogc/wps';
    self.process = self.options.process || 'gs:ExtractRasterPoints';
    self.minimumElevation = self.options.minimumElevation || -9998;
};

TC.inherit(TC.tool.ElevationServiceIDENA, TC.tool.ElevationService);

(function () {
    const toolProto = TC.tool.ElevationServiceIDENA.prototype;

    toolProto.request = function (options) {
        const self = this;
        options = options || {};
        const geometryOptions = {
            coordinates: options.coordinates
        };
        var coordinateListArray;
        switch (true) {
            case TC.Geometry.isPoint(options.coordinates):
                geometryOptions.type = TC.Consts.geom.POINT;
                coordinateListArray = [[options.coordinates]];
                break;
            case TC.Geometry.isRing(options.coordinates):
                geometryOptions.type = TC.Consts.geom.POLYLINE;
                coordinateListArray = [options.coordinates];
                break;
            case TC.Geometry.isRingCollection(options.coordinates):
                geometryOptions.type = TC.Consts.geom.POLYGON;
                coordinateListArray = options.coordinates;
                break;
            default:
                break;
        }
        const dataInputs = {
            coverageClass: options.coverageClass,
            geometry: {
                mimeType: TC.Consts.mimeType.JSON,
                value: TC.wrap.Geometry.toGeoJSON(geometryOptions)
            }
        };
        if (options.crs) {
            var idx = options.crs.lastIndexOf(':');
            if (idx < 0) {
                idx = options.crs.lastIndexOf('#');
            }
            dataInputs.srid = options.crs.substr(idx + 1);
        }
        if (options.sampleNumber) {
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
                if (geometryOptions.type === TC.Consts.geom.POLYGON) {
                    totalDistance += getDistance(coordList[coordList.length - 1], coordList[0]);
                }
            });

            // Calculamos la distancia entre muestras dividiendo entre el número de muestras menos uno,
            // porque las muestras están entre segmentos y por tanto hay una más que segmentos.
            dataInputs.splitDistance = totalDistance / (options.sampleNumber - 1);
        }
        else if (options.resolution) {
            dataInputs.splitDistance = options.resolution;
        }
        return TC.tool.ElevationService.prototype.request.call(self, { dataInputs: dataInputs }, options);
    };
})();
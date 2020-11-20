TC.tool = TC.tool || {};

if (!TC.tool.ElevationService) {
    TC.syncLoadJS(TC.apiLocation + 'TC/tool/ElevationService');
}

TC.tool.ElevationServiceIDENA = function (options) {
    const self = this;
    TC.tool.ElevationService.apply(self, arguments);
    self.url = self.options.url || '//idena.navarra.es/ogc/wps';
    self.process = self.options.process || 'gs:ExtractRasterPoints';
    self.coverageClass = self.options.coverageClass || 'MDT_maxima_actualidad,Alturas_maxima_actualidad',
    self.minimumElevation = self.options.minimumElevation || -9998;
};

TC.inherit(TC.tool.ElevationServiceIDENA, TC.tool.ElevationService);

(function () {
    const toolProto = TC.tool.ElevationServiceIDENA.prototype;

    toolProto.request = function (options) {
        const self = this;
        options = options || {};
        const geometryOptions = {
            coordinates: options.coordinates,
            type: TC.Consts.geom.POLYLINE
        };
        if (options.coordinates.length === 1) {
            geometryOptions.coordinates = options.coordinates[0];
            geometryOptions.type = TC.Consts.geom.POINT;
        }
        let coverageClass = options.coverageClass || self.coverageClass;
        const sepIdx = coverageClass.indexOf(',');
        if (coverageClass && sepIdx >= 0 && !options.includeHeights) {
            coverageClass = coverageClass.substr(0, sepIdx);
        }
        const dataInputs = {
            coverageClass: coverageClass,
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
        return TC.tool.ElevationService.prototype.request.call(self, { dataInputs: dataInputs }, options);
    };

    toolProto.parseResponse = function (response, options) {
        const self = this;
        const coverageClass = options.coverageClass || self.coverageClass
        const coverageClassCount = (options.includeHeights && coverageClass) ? coverageClass.split(',').length : 1;
        if (coverageClassCount <= 1) {
            return TC.tool.ElevationService.prototype.parseResponse.call(self, response, options);
        }
        if (response.coordinates) {
            const coords = response.coordinates;
            const coordinateCount = coords.length / coverageClassCount;
            const result = coords.slice(0, coordinateCount);
            for (var i = 0; i < coordinateCount; i++) {
                const point = result[i];
                if (point[2] < self.minimumElevation) {
                    point[2] = null;
                }
            }
            for (var i = 1; i < coverageClassCount; i++) {
                const offset = i * coordinateCount;
                for (var j = 0; j < coordinateCount; j++) {
                    const elevation = coords[j + offset][2];
                    result[j].push(elevation < self.minimumElevation ? null : elevation);
                }
            }
            return result;
        }
        return [];
    };
})();
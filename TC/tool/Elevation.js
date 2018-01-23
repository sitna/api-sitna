TC.tool = TC.tool || {};

TC.tool.Elevation = function (options) {
    const self = this;
    self.options = options || {};
    self.url = self.options.url || '//idena.navarra.es/ogc/wps';
    self.process = self.options.process || 'gs:ExtractRasterPoints';
    self.minimumElevation = self.options.minimumElevation || -9998;
};

(function () {
    const toolProto = TC.tool.Elevation.prototype;

    toolProto.getElevation = function (options) {
        const self = this;
        options = options || {};
        const deferred = $.Deferred();

        TC.loadJS(
            !TC.Geometry,
            TC.apiLocation + 'TC/Geometry',
            function () {
                self
                    .request(options)
                    .then(
                    function (response) {
                        deferred.resolve((options.responseCallback || self.parseResponse).call(self, response));
                    },
                    function (error) {
                        deferred.reject(error);
                    }
                    );
            }
        );
        
        return deferred.promise();
    }

    toolProto.request = function (options) {
        const self = this;
        options = options || {};
        const deferred = $.Deferred();
        if (options.coordinates) {
            TC.loadJS(
                !TC.format || !TC.format.WPS,
                TC.apiLocation + 'TC/format/WPS',
                function () {
                    const geometryOptions = {
                        coordinates: options.coordinates,
                        type: TC.Geometry.isPoint(options.coordinates) ? TC.Consts.geom.POINT : TC.Consts.geom.POLYLINE
                    };
                    const data = {
                        process: self.process,
                        dataInputs: {
                            coverageClass: options.coverageClass,
                            geometry: {
                                mimeType: TC.Consts.mimeType.JSON,
                                value: TC.wrap.Geometry.toGeoJSON(geometryOptions)
                            }
                        },
                        responseType: TC.Consts.mimeType.JSON
                    };
                    if (options.crs) {
                        data.dataInputs.srid = options.crs;
                    }
                    $.ajax({
                        url: self.url,
                        type: 'POST',
                        contentType: TC.Consts.mimeType.XML,
                        data: TC.format.WPS.buildExecuteQuery(data)
                    }).then(function (response) {
                        deferred.resolve(response);
                    }, function (error) {
                        deferred.reject(error);
                    });
                }
            );
        }
        else {
            deferred.reject();
        }
        return deferred.promise();
    };

    toolProto.parseResponse = function (response) {
        var self = this;
        if (response.coordinates[0][2] < self.minimumElevation) {
            return null;
        }
        return response.coordinates;
    };

})();
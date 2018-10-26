TC.tool = TC.tool || {};

TC.tool.ElevationService = function (options) {
    const self = this;
    self.options = options || {};
    self.url = self.options.url;
    self.process = self.options.process;
    self.minimumElevation = self.options.minimumElevation;
    if ($.isFunction(self.options.request)) {
        self.request = self.options.request;
    }
    if ($.isFunction(self.options.parseResponse)) {
        self.parseResponse = self.options.parseResponse;
    }
};

(function () {
    const toolProto = TC.tool.ElevationService.prototype;

    toolProto.getElevation = function (options) {
        const self = this;
        options = options || {};
        if (options.resolution === undefined) {
            options.resolution = self.options.resolution
        }
        if (options.sampleNumber === undefined) {
            options.sampleNumber = self.options.sampleNumber;
        }
        const deferred = $.Deferred();

        TC.loadJS(
            !TC.Geometry,
            TC.apiLocation + 'TC/Geometry',
            function () {
                self
                    .request(options)
                    .then(
                    function (response) {
                        deferred.resolve((options.responseCallback || self.parseResponse).call(self, response, options));
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
        if (options.dataInputs || options.body) {
            TC.loadJS(
                !TC.format || !TC.format.WPS,
                TC.apiLocation + 'TC/format/WPS',
                function () {
                    const data = {
                        process: options.process || self.process,
                        dataInputs: options.dataInputs,
                        responseType: TC.Consts.mimeType.JSON,
                        version: options.serviceVersion || self.serviceVersion || '1.0.0',
                        output: options.output
                    };
                    const contentType = typeof options.contentType === 'boolean' ? options.contentType : options.contentType || TC.Consts.mimeType.XML;
                    $.ajax({
                        url: self.url,
                        type: 'POST',
                        contentType: contentType,
                        data: options.body || TC.format.WPS.buildExecuteQuery(data)
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

    toolProto.parseResponse = function (response, options) {
        var self = this;
        if (response.coordinates) {
            const coords = response.coordinates;
            coords.forEach(function (coord) {
                if (coord[2] < self.minimumElevation) {
                    coord[2] = null;
                }
            });
        }
        return response.coordinates || [];
    };

})();
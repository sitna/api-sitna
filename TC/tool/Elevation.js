TC.tool = TC.tool || {};

TC.tool.Elevation = function (options) {
    const self = this;
    self.options = options || {};
    self.url = self.options.url || '//idena.navarra.es/ogc/wps';
    self.process = self.options.process || 'gs:ExtractRasterPoints';
    self.minimumElevation = self.options.minimumElevation || -9998;
};

TC.tool.Elevation.getElevationGain = function (options) {
    options = options || {};
    const coords = options.coords;
    if (coords && coords.length > 0 && coords[0].length > 2) { // si tenemos la Z
        var uphill = 0;
        var downhill = 0;
        const hillDeltaThreshold = options.hillDeltaThreshold || 0;

        var previousHeight;
        var sectorMinHeight;
        var sectorMaxHeight;
        var previousUphill = true;

        for (var c = 0; c < coords.length; c++) {
            var point = coords[c];
            var height = point[2];
            if (height !== null) {
                if (previousHeight === undefined) //--inicializar
                {
                    previousHeight = height;
                    sectorMinHeight = height;
                    sectorMaxHeight = height;
                }

                sectorMinHeight = Math.min(sectorMinHeight, height); //--actualizar mínimo y máximo del sector
                sectorMaxHeight = Math.max(sectorMaxHeight, height);

                var delta = height - previousHeight; //--calcular desnivel del punto respecto al anterior
                // hillDeltaThreshold: altura de los dientes a despreciar
                if (delta > hillDeltaThreshold || (delta > 0 && c == coords.length - 1)) //--Si se sube más del filtro (o se acaba el segmento subiendo)
                {
                    if (previousUphill) //--Si en el segmento anterior también se subía, incrementamos el desnivel positivo acumulado
                    {
                        uphill += delta;
                    }
                    else //--Si en el segmento anterior se bajaba, incrementamos los desniveles acumulados que no habíamos contabilizado desde el último salto del filtro (sector) 
                    {
                        downhill -= sectorMinHeight - previousHeight;
                        uphill += height - sectorMinHeight;
                        previousUphill = true; //--preparar para el paso siguiente
                    }
                    previousHeight = height; //--preparar para el paso siguiente
                    sectorMinHeight = height;
                    sectorMaxHeight = height;
                }
                else if (delta < -hillDeltaThreshold || (delta < 0 && c == coords.length - 1)) //--Si se baja más del filtro (o se acaba el segmento bajando)
                {
                    if (!previousUphill) //--Si en el segmento anterior también se bajaba, incrementamos el desnivel negativo acumulado
                    {
                        downhill -= delta;
                    }
                    else //--Si en el segmento anterior se subía, incrementamos los desniveles acumulados que no habíamos contabilizado desde el último salto del filtro (sector) 
                    {
                        uphill += sectorMaxHeight - previousHeight;
                        downhill -= height - sectorMaxHeight;
                        previousUphill = false; //--preparar para el paso siguiente
                    }
                    previousHeight = height; //--preparar para el paso siguiente
                    sectorMinHeight = height;
                    sectorMaxHeight = height;
                }
            }
        }

        return {
            upHill: Math.round(uphill),
            downHill: Math.round(downhill)
        };

    } else { return null; }
};

(function () {
    const toolProto = TC.tool.Elevation.prototype;

    toolProto.getElevation = function (options) {
        const self = this;
        options = options || {};
        options.resolution = options.resolution || self.options.resolution;
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
                        var idx = options.crs.lastIndexOf(':');
                        if (idx < 0) {
                            idx = options.crs.lastIndexOf('#');
                        }
                        data.dataInputs.srid = options.crs.substr(idx + 1);
                    }
                    if (options.sampleNumber) {
                        const totalDistance = options.coordinates
                            .map(function (coord, i, arr) {
                                const prev = arr[i - 1];
                                if (prev) {
                                    const dx = coord[0] - prev[0];
                                    const dy = coord[1] - prev[1];
                                    return Math.sqrt(dx * dx + dy * dy);
                                }
                                return 0;
                            })
                            .reduce(function (prev, curr) {
                                return prev + curr;
                            }, 0);
                        data.dataInputs.splitDistance = totalDistance / options.sampleNumber;
                    }
                    else if (options.resolution) {
                        data.dataInputs.splitDistance = options.resolution;
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
        if (response.coordinates) {
            response.coordinates.forEach(function (coords) {
                if (coords[2] < self.minimumElevation) {
                    coords[2] = null;
                }
            });
        }
        return response.coordinates || [];
    };

})();
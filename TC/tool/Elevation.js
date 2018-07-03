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

    toolProto.setGeometry = function (options) {
        const self = this;
        options = options || {};
        const deferred = $.Deferred();
        const feature = options.feature;
        if (feature) {
            var getFeatureCoords;
            var setFeatureCoords;
            switch (true) {
                case TC.feature && TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                    getFeatureCoords = function (feat) {
                        const arr = [];
                        return arr.concat.apply(arr, feat.geometry);
                    };
                    setFeatureCoords = function (feat, coords) {
                        var idx = 0;
                        feat.geometry.forEach(function (ring) {
                            ring.forEach(function (coord, i) {
                                ring[i] = coords[idx++];
                            });
                        });
                        feat.setCoords(feat.geometry);
                    };
                    break;
                case TC.feature && TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                    getFeatureCoords = function (feat) {
                        return feat.geometry;
                    };
                    setFeatureCoords = function (feat, coords) {
                        feat.geometry = coords;
                        feat.setCoords(feat.geometry);
                    };
                    break;
                default:
                    getFeatureCoords = function (feat) {
                        return feat.geometry;
                    };
                    setFeatureCoords = function (feat, coords) {
                        feat.setCoords(coords[0]);
                    };
                    break;
            }
            self.getElevation({
                crs: options.crs,
                coordinates: getFeatureCoords(feature),
                resolution: 0,
                sampleNumber: 0
            }).then(
                function (coords) {
                    if (coords.length) {
                        if (coords.some(function (c) { // Hay datos de elevación
                            return c[2] !== null;
                        })) {
                            setFeatureCoords(feature, coords);
                        }
                    }
                    deferred.resolve(feature);
                },
                function (error) {
                    deferred.reject(error);
                }
                );
        }
        else {
            deferred.resolve(null);
        }
        return deferred.promise();
    };

})();

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

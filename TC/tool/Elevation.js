TC.tool = TC.tool || {};

TC.tool.Elevation = function (options) {
    const self = this;
    self.options = options || {};
    self._servicePromises = [];
    const serviceOptions = self.options.services || [
        'elevationServiceIDENA',
        //'elevationServiceIGNEs',
        'elevationServiceIGNFr'
    ];
    serviceOptions.forEach(function (srv, idx) {
        const deferred = $.Deferred();
        self._servicePromises[idx] = deferred.promise();
        var ctorName = 'ElevationService';
        var path = TC.apiLocation + 'TC/tool/ElevationService';
        var srvOptions = srv;
        if (typeof srv === 'string') {
            ctorName = srv.substr(0, 1).toUpperCase() + srv.substr(1);
            path = TC.apiLocation + 'TC/tool/' + ctorName;
            srvOptions = {};
        }
        TC.loadJS(
            !TC.tool[ctorName],
            [path],
            function () {
                deferred.resolve(new TC.tool[ctorName](srvOptions));
            }
        );
    });
};

(function () {
    const toolProto = TC.tool.Elevation.prototype;

    toolProto.getService = function (idx) {
        return this._servicePromises[idx];
    };

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
        const onError = function (error) {
            deferred.reject(error);
        };

        TC.loadJS(
            !TC.Geometry,
            TC.apiLocation + 'TC/Geometry',
            function () {
                $.when.apply(this, self._servicePromises).then(function () {
                    const services = Array.prototype.map.call(arguments, function (arg) {
                        return arg;
                    });
                    // Creamos un array de promesas que se resuelven falle o no la petición
                    const alwaysPromises = new Array(services.length);
                    for (var i = 0, ii = alwaysPromises.length; i < ii; i++) {
                        alwaysPromises[i] = $.Deferred();
                    }
                    services
                        .map(function (srv) {
                            return srv.request(options);
                        })
                        .forEach(function (dfrd, idx) {
                            const rp = alwaysPromises[idx];
                            dfrd.then(
                                function (response) {
                                    rp.resolve(response);
                                },
                                function () {
                                    rp.resolve(null);
                                }
                            );
                        });
                    $.when.apply(this, alwaysPromises).then(
                        function () {
                            const args = arguments;
                            const responses =
                                services
                                    .map(function (srv, idx) { // Parseamos las respuestas que haya
                                        const arg = args[idx];
                                        if (!arg) {
                                            return null;
                                        }
                                        return srv.parseResponse(arg, options);
                                    })
                                    .filter(function (r) { // Eliminamos los servicios sin respuesta
                                        return r !== null;
                                    });

                            var numPoints = responses.length ? responses[0].length : 0;
                            var elevation = new Array(numPoints);
                            if (numPoints) {

                                const reduceFnFactory = function (idx) {
                                    return function (prev, cur, arr) {
                                        const point = cur[idx];
                                        const result = prev;
                                        if (prev[0] === null) {
                                            result[0] = point[0];
                                        }
                                        if (prev[1] === null) {
                                            result[1] = point[1];
                                        }
                                        if (prev[2] === null) {
                                            result[2] = point[2];
                                        }
                                        return result;
                                    };
                                };

                                //const firstResponse = responses[0];
                                for (var i = 0; i < numPoints; i++) {
                                    var fn = reduceFnFactory(i);
                                    elevation[i] = responses.reduce(fn, [null, null, null]);
                                }
                            }
                            deferred.resolve(elevation);
                        }, onError
                    );
                }, onError);
            }
        );
        
        return deferred.promise();
    }

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

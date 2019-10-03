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
        self._servicePromises[idx] = new Promise(function (resolve, reject) {
            var ctorName = 'ElevationService';
            var path = TC.apiLocation + 'TC/tool/ElevationService';
            const paths = [];
            var srvOptions = srv;
            if (typeof srv === 'string') {
                if (!TC.tool[ctorName]) {
                    paths.push(path);
                }
                ctorName = srv.substr(0, 1).toUpperCase() + srv.substr(1);
                path = TC.apiLocation + 'TC/tool/' + ctorName;
                srvOptions = {};
                paths.push(path);
            }
            TC.loadJSInOrder(
                !TC.tool[ctorName],
                paths,
                function () {
                    resolve(new TC.tool[ctorName](srvOptions));
                }
            );
        });
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
        return new Promise(function (resolve, reject) {
            const onError = function (msg, type) {
                reject(msg, type);
            };

            TC.loadJS(
                !TC.Geometry,
                TC.apiLocation + 'TC/Geometry',
                function () {
                    Promise.all(self._servicePromises).then(function (services) {
                        // Creamos un array de promesas que se resuelven falle o no la petición
                        const alwaysPromises = new Array(services.length);
                        services
                            .forEach(function (srv, idx) {
                                alwaysPromises[idx] = new Promise(function (res, rej) {
                                    srv.request(options).then(
                                        function (response) {
                                            res(response);
                                        },
                                        function () {
                                            res(null);
                                        }
                                    );
                                });
                            });
                        Promise.all(alwaysPromises).then(
                            function (resps) {
                                const responses =
                                    services
                                        .map(function (srv, idx) { // Parseamos las respuestas que haya
                                            const r = resps[idx];
                                            if (!r) {
                                                return null;
                                            }
                                            return srv.parseResponse(r, options);
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

                                    for (var i = 0; i < numPoints; i++) {
                                        var fn = reduceFnFactory(i);
                                        elevation[i] = responses.reduce(fn, [null, null, null]);
                                    }
                                }
                                resolve(elevation);
                            }, onError
                        );
                    }, onError);
                }
            );
        });
    }

    toolProto.setGeometry = function (options) {
        const self = this;
        options = options || {};
        const features = options.features || [];

        if (features.length) {

            const conditionToPromises = function (promises, resolve, reject) {
                Promise.all(promises).then(
                    function (results) {
                        resolve(results);
                    },
                    function (error) {
                        reject(error);
                    }
                );
            };

            return new Promise(function (resolve, reject) {
                if (options.maxCoordQuantity) {
                    if (options.resolution) {
                        // Validador de número de coordenadas máximo
                        const numPoints = features.reduce(function (acc, feat) {
                            if (feat) {
                                acc = acc + feat.getCoords({ pointArray: true }).length;
                                switch (true) {
                                    case TC.feature.Polyline && feat instanceof TC.feature.Polyline:
                                    case TC.feature.Polygon && feat instanceof TC.feature.Polygon:
                                    case TC.feature.MultiPolyline && feat instanceof TC.feature.MultiPolyline:
                                    case TC.feature.MultiPolygon && feat instanceof TC.feature.MultiPolygon:
                                        acc = acc + Math.floor(feat.getLength() / options.resolution);
                                        break;
                                    default:
                                        break;
                                }
                            }
                            return acc;
                        }, 0);
                        if (numPoints > options.maxCoordQuantity) {
                            reject(Error(TC.tool.Elevation.errors.MAX_COORD_QUANTITY_EXCEEDED));
                        }
                    }
                }
                const resolution = options.resolution || 0;
                const getElevOptions = function (coords) {
                    return {
                        crs: options.crs,
                        coordinates: coords,
                        resolution: resolution,
                        sampleNumber: 0
                    };
                };
                const getRingElevPromises = function (ring) {
                    return self.getElevation(getElevOptions(ring));
                }
                const coordPromises = features.map(function (feature) {
                    return new Promise(function (res, rej) {

                        switch (true) {
                            case !feature:
                                res(null);
                                break;
                            case TC.feature && TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon:
                                const polPromises = feature
                                    .getCoords()
                                    .map(function (polygon) {
                                        return new Promise(function (rs, rj) {
                                            conditionToPromises(polygon.map(getRingElevPromises), rs, rj);
                                        });
                                    });
                                conditionToPromises(polPromises, res, rej);
                                break;
                            case TC.feature && TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                            case TC.feature && TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline:
                                const ringPromises = feature
                                    .getCoords()
                                    .map(getRingElevPromises);
                                conditionToPromises(ringPromises, res, rej);
                                break;
                            case TC.feature && TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                                self.getElevation(getElevOptions(feature.getCoords())).then(
                                    function (coords) {
                                        res(coords);
                                    },
                                    function (error) {
                                        rej(Error(error));
                                    }
                                );
                                break;
                            case TC.feature && TC.feature.Point && feature instanceof TC.feature.Point:
                                self.getElevation(getElevOptions(feature.getCoords())).then(
                                    function (coords) {
                                        res(coords[0]);
                                    },
                                    function (error) {
                                        rej(Error(error));
                                    }
                                );
                                break;
                            default:
                                rej(Error("Geometry not supported"));
                                break;
                        }
                    });
                });

                Promise.all(coordPromises).then(
                    function (coordsArray) {
                        coordsArray.forEach(function (coords, idx) {
                            const feat = features[idx];
                            if (feat) {
                                console.log("Estableciendo elevaciones a geometría de tipo " + feat.CLASSNAME);
                                features[idx].setCoords(coords);
                            }
                        });
                        resolve(features);
                    },
                    function (error) {
                        reject(error);
                    }
                );
            });
        }
        else {
            return Promise.resolve([]);
        }
    };

})();

TC.tool.Elevation.errors = {
    MAX_COORD_QUANTITY_EXCEEDED: 'max_coord_quantity_exceeded',
    UNDEFINED: 'undefined'
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

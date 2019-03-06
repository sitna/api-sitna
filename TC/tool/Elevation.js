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
        const onError = function (msg, type) {
            deferred.reject(msg, type);
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
        const features = options.features || [];

        if (features.length) {

            if (options.maxCoordQuantity) {
                if (options.resolution) {
                    const getDistance = function (p1, p2) {
                        const dx = p2[0] - p1[0];
                        const dy = p2[1] - p1[1];
                        return Math.sqrt(dx * dx + dy * dy);
                    };
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
                        deferred.reject('Maximum count of coordinates exceeded', TC.tool.Elevation.errors.MAX_COORD_QUANTITY_EXCEEDED);
                        return deferred;
                    }
                }
            }

            const conditionDeferredToPromises = function (deferred, promises) {
                $.when.apply($, promises).then(
                    function () {
                        deferred.resolve(Array.prototype.slice.call(arguments));
                    },
                    function (error) {
                        deferred.reject(error);
                    }
                );
            };
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
                const coordDef = $.Deferred();
                switch (true) {
                    case !feature:
                        coordDef.resolve(null);
                        break;
                    case TC.feature && TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon:
                        const polPromises = feature
                            .getCoords()
                            .map(function (polygon) {
                                const polDef = $.Deferred();
                                const ringPromises = polygon.map(getRingElevPromises);
                                conditionDeferredToPromises(polDef, ringPromises);
                                return polDef.promise();
                            });
                        conditionDeferredToPromises(coordDef, polPromises);
                        break;
                    case TC.feature && TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                    case TC.feature && TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline:
                        const ringPromises = feature
                            .getCoords()
                            .map(getRingElevPromises);
                        conditionDeferredToPromises(coordDef, ringPromises);
                        break;
                    case TC.feature && TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                        self.getElevation(getElevOptions(feature.getCoords())).then(
                            function (coords) {
                                coordDef.resolve(coords);
                            },
                            function (error) {
                                coordDef.reject(error);
                            }
                        );
                        break;
                    case TC.feature && TC.feature.Point && feature instanceof TC.feature.Point:
                        self.getElevation(getElevOptions(feature.getCoords())).then(
                            function (coords) {
                                coordDef.resolve(coords[0]);
                            },
                            function (error) {
                                coordDef.reject(error);
                            }
                        );
                        break;
                    default:
                        coordDef.reject("Geometry not supported");
                        break;
                }
                return coordDef.promise();
            });

            $.when.apply($, coordPromises).then(
                function () {
                    Array.prototype.slice.call(arguments).forEach(function (coords, idx) {
                        const feat = features[idx];
                        if (feat) {
                            console.log("Estableciendo elevaciones a geometría de tipo " + feat.CLASSNAME);
                            features[idx].setCoords(coords);
                        }
                    });
                    deferred.resolve(features);
                },
                function (error) {
                    deferred.reject(error);
                }
            );
        }
        else {
            deferred.resolve([]);
        }
        return deferred.promise();
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

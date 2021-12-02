TC.tool = TC.tool || {};

TC.tool.Elevation = function (options) {
    const self = this;
    self.options = options || {};
    self._servicePromises = [];
    const serviceOptions = self.options.services || [
        'elevationServiceIDENA',
        'elevationServiceIGNFr',
        'elevationServiceIGNEs',
        'elevationServiceGoogle'
    ];

    const abstractServicePromise = new Promise(function (resolve, reject) {
        TC.loadJS(
            !TC.tool.ElevationService,
            TC.apiLocation + 'TC/tool/ElevationService',
            function () {
                resolve();
            }
        );
    });

    serviceOptions.forEach(function (srv, idx) {
        self._servicePromises[idx] = new Promise(function (resolve, reject) {
            const serviceName = (typeof srv === 'string') ? srv : srv.name;
            const ctorName = serviceName.substr(0, 1).toUpperCase() + serviceName.substr(1);
            const path = TC.apiLocation + 'TC/tool/' + ctorName;
            const srvOptions = (typeof srv === 'string') ? {} : srv;
            TC.loadJS(
                !TC.tool[ctorName],
                path,
                function () {
                    abstractServicePromise.then(function () {
                        resolve(new TC.tool[ctorName](srvOptions));
                    });
                }
            );
        });
    });
};

(function () {
    const toolProto = TC.tool.Elevation.prototype;

    let requestUID = 1;
    const getRequestUID = function () {
        const result = requestUID.toString();
        requestUID++;
        return result;
    };

    toolProto.getService = function (idx) {
        return this._servicePromises[idx];
    };

    toolProto.getServices = function () {
        return Promise.all(this._servicePromises);
    };

    toolProto.getElevation = function (options) {
        const self = this;
        options = options || {};
        options.id = getRequestUID();
        if (options.resolution === undefined) {
            options.resolution = self.options.resolution;
        }
        if (options.sampleNumber === undefined) {
            options.sampleNumber = self.options.sampleNumber;
        }
        let done = false;
        let partialResult;
        let partialCallback;
        if (TC.Util.isFunction(options.partialCallback)) {
            partialCallback = options.partialCallback;
        }

        return new Promise(function (resolve, reject) {
            TC.loadJS(
                !TC.Geometry,
                TC.apiLocation + 'TC/Geometry',
                function () {
                    let coordinateList = options.coordinates;
                    const isSinglePoint = coordinateList.length === 1;

                    if (!isSinglePoint) {
                        if (options.resolution) {
                            const newCoordinateList = [];
                            coordinateList.forEach(function (point, idx, arr) {
                                if (idx) {
                                    const prev = arr[idx - 1];
                                    const distance = TC.Geometry.getDistance(prev, point);
                                    if (distance > options.resolution) {
                                        // posición en el segmento del primer punto interpolado
                                        let pos = (distance % options.resolution) / 2;
                                        // x··$·····|·····|··x
                                        let n = Math.ceil(distance / options.resolution);
                                        if (pos === 0) {
                                            n = n - 1;
                                            pos = options.resolution;
                                        }
                                        const x = point[0] - prev[0];
                                        const y = point[1] - prev[1];
                                        const sin = y / distance;
                                        const cos = x / distance;
                                        let xpos = prev[0] + pos * cos;
                                        let ypos = prev[1] + pos * sin;
                                        let dx = options.resolution * cos;
                                        let dy = options.resolution * sin;
                                        for (var i = 0; i < n; i++) {
                                            newCoordinateList.push([xpos, ypos]);
                                            xpos += dx;
                                            ypos += dy;
                                        }
                                    }
                                }
                                newCoordinateList.push(point);
                            });
                            coordinateList = newCoordinateList;
                            options.resolution = 0;
                            options.sampleNumber = 0;
                        }
                        else if (options.sampleNumber) {
                            const numPoints = coordinateList.length;
                            if (numPoints > options.sampleNumber) {
                                // Sobran puntos. Nos quedamos con los puntos más cercanos a los puntos kilométricos
                                // de los intervalos definidos por sampleNumber.
                                const milestones = [];
                                let accumulatedDistance = 0;
                                coordinateList.forEach(function (point, idx, arr) {
                                    if (idx) {
                                        accumulatedDistance += TC.Geometry.getDistance(arr[idx - 1], point);
                                    }
                                    milestones.push({
                                        index: idx,
                                        distance: accumulatedDistance
                                    });
                                });
                                const intervalLength = accumulatedDistance / options.sampleNumber;
                                let nextMilestoneDistance = 0;
                                milestones.forEach(function (milestone, idx, arr) {
                                    const dd = milestone.distance - nextMilestoneDistance;
                                    if (dd === 0) {
                                        milestone.included = true;
                                    }
                                    else if (dd > 0) {
                                        if (milestone.index) {
                                            const prevMilestone = arr[idx - 1];
                                            if (nextMilestoneDistance - prevMilestone.distance < dd) {
                                                prevMilestone.included = true;
                                            }
                                            else {
                                                milestone.included = true;
                                            }
                                        }
                                        while (milestone.distance > nextMilestoneDistance) {
                                            nextMilestoneDistance += intervalLength;
                                        }
                                    }
                                });
                                milestones.filter(m => !m.included).forEach(function (m) {
                                    coordinateList[m.index] = null;
                                });
                                coordinateList = coordinateList.filter(p => p !== null);
                            }
                            else if (numPoints < options.sampleNumber) {
                                // Faltan puntos. Insertamos puntos en las segmentos más largos.
                                const insertBefore = function (arr, idx, count) {
                                    const p1 = arr[idx - 1];
                                    const p2 = arr[idx];
                                    const n = count + 1;
                                    let x = p1[0];
                                    let y = p1[1];
                                    const dx = (p2[0] - x) / n;
                                    const dy = (p2[1] - y) / n;
                                    const spliceParams = new Array(count + 2);
                                    spliceParams[0] = idx;
                                    spliceParams[1] = 0;
                                    for (var i = 2, ii = spliceParams.length; i < ii; i++) {
                                        x += dx;
                                        y += dy;
                                        spliceParams[i] = [x, y];
                                    }
                                    arr.splice.apply(arr, spliceParams);
                                };
                                let totalDistance = 0;
                                const distances = coordinateList.map(function (point, idx, arr) {
                                    let distance = 0;
                                    if (idx) {
                                        distance = TC.Geometry.getDistance(arr[idx - 1], point);
                                        totalDistance += distance;
                                    }
                                    return {
                                        index: idx,
                                        distance: distance
                                    };
                                });
                                // Hacemos copia de la lista porque vamos a insertar puntos
                                coordinateList = coordinateList.slice();
                                const defaultCount = options.sampleNumber - numPoints;
                                let leftCount = defaultCount;
                                let insertionCount = 0;
                                for (var i = 0, ii = distances.length; leftCount && i < ii; i++) {
                                    const obj = distances[i];
                                    if (obj.distance !== 0) {
                                        const partialInsertionCount = Math.min(Math.round(defaultCount * obj.distance / totalDistance), leftCount) || 1;
                                        leftCount -= partialInsertionCount;
                                        insertBefore(coordinateList, obj.index + insertionCount, partialInsertionCount);
                                        insertionCount += partialInsertionCount;
                                    }
                                }
                            }
                            options.resolution = 0;
                            options.sampleNumber = 0;
                        }
                    }

                    options.coordinates = coordinateList;
                    partialResult = coordinateList.map(p => [p[0], p[1], null]);
                    
                    if (!options.hasOwnProperty('includeHeights')) {
                        options.includeHeights = isSinglePoint;
                    }
                    self.getServices().then(function (services) {
                        const responses = new Array(services.length);
                        responses.fill(false);
                        services
                            .forEach(function (srv, idx) {
                                // Creamos una promesa que se resuelve falle o no la petición
                                const alwaysPromise = new Promise(function (res, rej) {
                                    srv.request(options).then(
                                        function (response) {
                                            if (done) {
                                                res(null); // Ya no escuchamos a esta respuesta porque hemos terminado el proceso antes
                                            }
                                            else {
                                                res(srv.parseResponse(response, options));
                                            }
                                        },
                                        function () {
                                            res(null);
                                        }
                                    );
                                });
                                alwaysPromise.then(function (response) {
                                    if (!done) {
                                        responses[idx] = response;
                                        if (response !== null) {
                                            if (self._updatePartialResult(partialResult, responses)) {
                                                done = true;
                                            }
                                            if (partialCallback) {
                                                partialCallback(partialResult);
                                            }
                                        }
                                        if (done) {
                                            responses.forEach((r, ri) => r === false && services[ri].cancelRequest(options.id));
                                            resolve(partialResult.some(p => p[2] !== null) ? partialResult : []);
                                        }
                                    }
                                }, function (error) {
                                    console.error(error);
                                });
                            });
                    }, function (msg) {
                        reject(msg);
                    });
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
                            return;
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
                                self.getElevation(getElevOptions([feature.getCoords()])).then(
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
                        const copyElevation = function (source, target) {
                            if (TC.Geometry.isPoint(source)) {
                                target[2] = source[2];
                                if (source.length > 3) {
                                    target[3] = source[3];
                                }
                            }
                            else if (Array.isArray(source)) {
                                source.forEach(function (node, idx) {
                                    copyElevation(node, target[idx]);
                                });
                            }
                        };
                        const getNumVertices = function (coords) {
                            if (TC.Geometry.isPoint(coords)) {
                                return 1;
                            }
                            if (Array.isArray(coords)) {
                                return coords.reduce((prev, cur) => prev + getNumVertices(cur), 0);
                            }
                            return 0;
                        };
                        coordsArray.forEach(function (coords, idx) {
                            const feat = features[idx];
                            if (feat) {
                                console.log("Estableciendo elevaciones a geometría de tipo " + feat.CLASSNAME);
                                const featCoords = feat.getCoords();
                                if (getNumVertices(featCoords) === getNumVertices(coords)) {
                                    copyElevation(coords, featCoords);
                                    feat.setCoords(featCoords);
                                }
                                else if (coords) {
                                    feat.setCoords(coords);
                                }
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

    toolProto._updatePartialResult = function (coordinates, responses) {
        let done = false;
        let pending = false;
        for (var i = 0, ii = coordinates.length; i < ii; i++) {
            const point = coordinates[i];
            let elevation = null;
            let height = null;
            const validResponses = responses.filter(r => r !== null);
            for (var j = 0, jj = validResponses.length; j < jj; j++) {
                const r = validResponses[j];
                if (r === false) {
                    pending = true;
                }
                if (Array.isArray(r)) {
                    const rPoint = r[i];
                    if (elevation === null && rPoint) {
                        elevation = rPoint[2];
                        if (rPoint.length > 3 && height === null) {
                            height = rPoint[3];
                        }
                    }
                }
                if (elevation !== null) {
                    point[2] = elevation;
                    if (height !== null) {
                        point[3] = height;
                    }
                    break;
                }
            }
        }
        // Condiciones para acabar:
        // 1: Tengo todas las elevaciones y no hay peticiones más prioritarias pendientes
        // 2: Han contestado todos los servicios
        done = (!pending && coordinates.every(p => p[2] !== null)) || responses.every(r => r !== false);
        return done;
    };

})();

TC.tool.Elevation.errors = {
    MAX_COORD_QUANTITY_EXCEEDED: 'max_coord_quantity_exceeded',
    UNDEFINED: 'undefined'
};

TC.tool.Elevation.getElevationGain = function (options) {
    return TC.Util.getElevationGain(options);
};

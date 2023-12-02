import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Geometry from '../Geometry';

/**
 * Colección de identificadores de servicios para obtener elevaciones de puntos.
 * @member elevationService
 * @memberof SITNA.Consts
 * @readonly
 * @property {string} GOOGLE - Identificador del servicio de elevación de la API de Google Maps.
 * @property {string} IDENA - Identificador del servicio de elevación de IDENA.
 * @property {string} IGN_ES - Identificador del servicio de elevación del Instituto Geográfico Nacional de España.
 * @property {string} IGN_FR - Identificador del servicio de elevación del Instituto Geográfico Nacional Francés.
 * @see SITNA.ElevationOptions
 */
Consts.elevationService = {
    GOOGLE: 'elevationServiceGoogle',
    IDENA: 'elevationServiceIDENA',
    IGN_ES: 'elevationServiceIGNEs',
    IGN_FR: 'elevationServiceIGNFr'
};

/**
 * Opciones de la herramienta de elevación.
 * @typedef ElevationOptions
 * @memberof SITNA
 * @see SITNA.control.DrawMeasureModifyOptions
 * @property {number} [resolution] - Distancia máxima en metros entre puntos con elevaciones. 
 * Si la distancia entre vértices de la geometría de la que queremos obtener los valores de elevación es mayor 
 * que este valor, se añaden puntos intermedios hasta que esa distancia sea menor o igual a este valor.
 * @property {number} [sampleNumber] - Número total de puntos de la geometría con elevación.
 * 
 * Si la geometría tiene más puntos que el valor de esta propiedad, se elminarán de manera repartida los 
 * puntos sobrantes.
 * 
 * Si la geometría tiene menos puntos que este valor, se insertarán puntos de manera repartida a lo largo de la geometría.
 * 
 * Si esta propiedad entra en conflicto con la propiedad `resolution`, prevalece `resolution`.
 * @property {string[]|SITNA.ElevationServiceOptions[]} [services=[SITNA.Consts.elevationService.IDENA]{@link SITNA.Consts}, [SITNA.Consts.elevationService.IGN_FR]{@link SITNA.Consts}, [SITNA.Consts.elevationService.IGN_ES]{@link SITNA.Consts}] - Lista priorizada con identificadores de servicio de elevación
 * (miembros de [SITNA.Consts.elevationService]{@link SITNA.Consts}) u objetos de configuración de servicio a los que se consulta para obtener el dato de elevación.
 * Si varios servicios devuelven un valor válido para un punto, se toma el valor del servicio que esté representado antes en esta lista.
 */

TC.tool = TC.tool || {};

const Elevation = function (options) {
    const self = this;
    self.options = options || {};
    self._servicePromises = [];
    const serviceOptions = self.options.services || [
        Consts.elevationService.IDENA,
        Consts.elevationService.IGN_FR,
        Consts.elevationService.IGN_ES/*,
        Consts.elevationService.GOOGLE*/
    ];      

    serviceOptions.forEach(function (srv, idx) {
        self._servicePromises[idx] = new Promise(function (resolve, _reject) {
            const serviceName = typeof srv === 'string' ? srv : srv.name;
            const ctorName = serviceName.substr(0, 1).toUpperCase() + serviceName.substr(1);
            
            const srvOptions = typeof srv === 'string' ? {} : srv;
            import('./' + ctorName).then(function (elevationModule) {
                const ElevationService = elevationModule.default;
                TC.tool[ctorName] = ElevationService;
                resolve(new ElevationService(srvOptions));
            });
        });
    });
};

(function () {
    const toolProto = Elevation.prototype;

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

    toolProto.getElevation = async function (options) {
        const self = this;
        const opts = Object.assign({}, options);
        opts.id = getRequestUID();
        if (opts.resolution === undefined) {
            opts.resolution = self.options.resolution;
        }
        if (opts.sampleNumber === undefined) {
            opts.sampleNumber = self.options.sampleNumber;
        }
        let done = false;
        let partialResult;
        let partialCallback;
        if (Util.isFunction(opts.partialCallback)) {
            partialCallback = opts.partialCallback;
        }

        const isSinglePoint = opts.coordinates.length === 1;
        opts.coordinates = Geometry.interpolate(opts.coordinates, opts);
        opts.resolution = 0;
        opts.sampleNumber = 0;

        partialResult = opts.coordinates.map(p => [p[0], p[1], null]);

        if (!Object.prototype.hasOwnProperty.call(opts, 'includeHeights')) {
            opts.includeHeights = isSinglePoint;
        }
        const services = await self.getServices();
        const responses = new Array(services.length);
        responses.fill(false);
        for (var i = 0, ii = services.length; i < ii; i++) {
            const idx = i;
            const srv = services[i];

            // Creamos una promesa que se resuelve falle o no la petición
            const request = async function () {
                if (navigator.onLine) {
                    try {
                        const response = await srv.request(opts);
                        if (done) {
                            return null; // Ya no escuchamos a esta respuesta porque hemos terminado el proceso antes
                        }
                        else {
                            return srv.parseResponse(response, opts);
                        }
                    }
                    catch (_e) {
                        return null;
                    }
                }
                return null;
            }
            let response;
            try {
                response = await request();
            }
            catch (error) {
                console.error(error);
            }

            if (!done) {
                responses[idx] = response;
                if (response === null) {
                    // Respuesta fallida. Comprobamos si han fallado todas para terminar.
                    if (responses.every(r => r === null)) {
                        throw Error('No services available');
                    }
                }
                else {
                    if (self._updatePartialResult(partialResult, responses)) {
                        done = true;
                    }
                    if (partialCallback) {
                        partialCallback(partialResult);
                    }
                }
                if (done) {
                    responses.forEach((r, ri) => r === false && services[ri].cancelRequest(options.id));
                    return partialResult.some(p => p[2] !== null) ? partialResult : [];
                }
            }
        }
    };

    toolProto.setGeometry = async function (options) {
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

            if (options.maxCoordQuantity) {
                if (options.resolution) {
                    // Validador de número de coordenadas máximo
                    const numPoints = features.reduce(function (acc, feat) {
                        if (feat) {
                            acc = acc + feat.getCoords({ pointArray: true }).length;
                            switch (true) {
                                case SITNA.feature.Polyline && feat instanceof SITNA.feature.Polyline:
                                case SITNA.feature.Polygon && feat instanceof SITNA.feature.Polygon:
                                case SITNA.feature.MultiPolyline && feat instanceof SITNA.feature.MultiPolyline:
                                case SITNA.feature.MultiPolygon && feat instanceof SITNA.feature.MultiPolygon:
                                    acc = acc + Math.floor(feat.getLength() / options.resolution);
                                    break;
                                default:
                                    break;
                            }
                        }
                        return acc;
                    }, 0);
                    if (numPoints > options.maxCoordQuantity) {
                        throw Error(Elevation.errors.MAX_COORD_QUANTITY_EXCEEDED);
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
            };
            const coordPromises = features.map(function (feature) {
                return new Promise(function (res, rej) {

                    switch (true) {
                        case !feature:
                            res(null);
                            break;
                        case SITNA.feature && SITNA.feature.MultiPolygon && feature instanceof SITNA.feature.MultiPolygon: {
                            const polPromises = feature
                                .getCoords()
                                .map(function (polygon) {
                                    return new Promise(function (rs, rj) {
                                        conditionToPromises(polygon.map(getRingElevPromises), rs, rj);
                                    });
                                });
                            conditionToPromises(polPromises, res, rej);
                            break;
                        }
                        case SITNA.feature && SITNA.feature.Polygon && feature instanceof SITNA.feature.Polygon:
                        case SITNA.feature && SITNA.feature.MultiPolyline && feature instanceof SITNA.feature.MultiPolyline: {
                            const ringPromises = feature
                                .getCoords()
                                .map(getRingElevPromises);
                            conditionToPromises(ringPromises, res, rej);
                            break;
                        }
                        case SITNA.feature && SITNA.feature.Polyline && feature instanceof SITNA.feature.Polyline:
                            self.getElevation(getElevOptions(feature.getCoords())).then(
                                function (coords) {
                                    res(coords);
                                },
                                function (error) {
                                    rej(Error(error));
                                }
                            );
                            break;
                        case SITNA.feature && SITNA.feature.Point && feature instanceof SITNA.feature.Point:
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

            const coordsArray = await Promise.all(coordPromises);
            const copyElevation = function (source, target) {
                if (Geometry.isPoint(source)) {
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
                if (Geometry.isPoint(coords)) {
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
                    if (TC.isDebug) {
                        console.log("Estableciendo elevaciones a entidad:", feat);
                    }
                    const featCoords = feat.getCoords();
                    if (getNumVertices(featCoords) === getNumVertices(coords)) {
                        copyElevation(coords, featCoords);
                        feat.setCoordinates(featCoords);
                    }
                    else if (coords) {
                        feat.setCoordinates(coords);
                    }
                }
            });
            return features;
        }
        else {
            return [];
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
        done = !pending && coordinates.every(p => p[2] !== null) || responses.every(r => r !== false);
        return done;
    };

})();

Elevation.errors = {
    MAX_COORD_QUANTITY_EXCEEDED: 'max_coord_quantity_exceeded',
    UNDEFINED: 'undefined'
};

Elevation.getElevationGain = function (options) {
    return Util.getElevationGain(options);
};

TC.tool.Elevation = Elevation;
export default Elevation;

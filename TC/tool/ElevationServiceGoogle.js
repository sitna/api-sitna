import TC from '../../TC';
import ElevationService from './ElevationService';
import Util from '../Util';
import Consts from '../Consts';

// https://developers.google.com/maps/documentation/javascript/elevation?hl=es

let googleElevator;
const currentRequestIds = new Map();

const upRequestId = function (id, count) {
    let currentCount = currentRequestIds.get(id) || 0;
    currentCount += count;
    currentRequestIds.set(id, currentCount);
};

const downRequestId = function (id) {
    let currentCount = currentRequestIds.get(id);
    if (currentCount) {
        currentCount -= 1;
        if (currentCount <= 0) {
            currentRequestIds.delete(id);
        }
        return true;
    }
    return false;
};

class ElevationServiceGoogle extends ElevationService {
    constructor() {
        super(...arguments);
        const self = this;
        self.url = self.options.url || '//maps.googleapis.com/maps/api/js?v=3';
        const intIdx = self.url.lastIndexOf('?');
        if (intIdx < 0) {
            self.url += '?';
        }
        else if (intIdx < self.url.length - 1) {
            self.url += '&';
        }

        //ahora google pide en la url de google maps una función función global que se llamará una vez que la API de Maps JavaScript se cargue por completo.
        let fnCallBackSV = "SV_" + (Math.random() + 1).toString(36).substring(7);

        window[fnCallBackSV] = function () {
            delete window[fnCallBackSV];
        }

        self.url += 'key=' + self.options.googleMapsKey + "&callback=" + fnCallBackSV;
        self.minimumElevation = self.options.minimumElevation || -9998;
        self.nativeCRS = 'EPSG:4326';
        self.maxCoordinateCountPerRequest = 512;
        self.minRetryInterval = 5100;
        self.maxRetries = Number.isInteger(self.options.maxRetries) ? self.options.maxRetries : 0;
    }

    request(options) {
        const self = this;
        options = options || {};
        if (!self.options.googleMapsKey) {
            return Promise.reject(Error('Missing Google Maps key'));
        }
        const requestId = options.id;

        const cancelledResponse = { status: 'CANCELLED' };
        let geomType;
        let coordinateList = options.coordinates;
        if (coordinateList.length === 1) {
            geomType = Consts.geom.POINT;
        }
        else {
            geomType = Consts.geom.POLYLINE;
        }

        if (self.options.allowedGeometryTypes && !self.options.allowedGeometryTypes.includes(geomType)) {
            return Promise.reject(Error(geomType + ' geometry type not allowed by configuration'));
        }

        if (coordinateList.length > self.maxCoordinateCountPerRequest) {
            // Google no soporta tantos puntos por petición, dividimos la petición en varias
            return new Promise(function (resolve, _reject) {
                const chunks = [];
                for (var i = 0, ii = coordinateList.length; i < ii; i += self.maxCoordinateCountPerRequest) {
                    chunks.push(coordinateList.slice(i, i + self.maxCoordinateCountPerRequest));
                }
                upRequestId(requestId, chunks.length);
                let retries = 0;
                const subrequests = chunks.map(function subrequest(chunk) {
                    const requestOptions = Util.extend({}, options, { coordinates: chunk, id: requestId });
                    return new Promise(function (res, rej) {
                        if (!currentRequestIds.has(requestId)) {
                            res(cancelledResponse);
                        }
                        else {
                            self.request(requestOptions)
                                .then(function (result) {
                                    if (result.status === 'OVER_QUERY_LIMIT') {
                                        console.log("OVER_QUERY_LIMIT status reached for request " + requestId);
                                        if (!currentRequestIds.has(requestId)) {
                                            res(cancelledResponse);
                                        }
                                        else {
                                            // Peticiones demasiado seguidas: esperamos y volvemos a pedir
                                            if (!self.maxRetries || retries < self.maxRetries) {
                                                retries = retries + 1;
                                                setTimeout(function () {
                                                    subrequest(chunk)
                                                        .then(r => res(r))
                                                        .catch(e => rej(e));
                                                }, self.minRetryInterval);
                                            }
                                            else {
                                                res(result);
                                            }
                                        }
                                    }
                                    else {
                                        res(result);
                                    }
                                })
                                .catch(e => rej(e));
                        }
                    });
                });
                Promise.all(subrequests).then(function mergeResponses(responses) {
                    const results = Array.prototype.concat.apply([], responses
                        .filter(r => r.status === 'OK')
                        .map(r => r.elevations));
                    downRequestId(requestId);
                    resolve({
                        status: 'OK',
                        elevations: results
                    });
                });
            });
        }

        if (options.crs && options.crs !== self.nativeCRS) {
            coordinateList = Util.reproject(coordinateList, options.crs, self.nativeCRS);
        }

        return new Promise(function (resolve, _reject) {
            const googleMapsIsLoaded = window.google && window.google.maps;
            if (!googleMapsIsLoaded) {
                TC.Cfg.proxyExceptions = TC.Cfg.proxyExceptions || [];
                TC.Cfg.proxyExceptions.push(self.url);
            }
            TC.loadJS(
                !googleMapsIsLoaded,
                self.url,
                function () {
                    googleElevator = googleElevator || new google.maps.ElevationService();
                    const coords = coordinateList.map(p => ({ lat: p[1], lng: p[0] }));
                    googleElevator.getElevationForLocations({
                        locations: coords
                    }, function (elevations, status) {
                        downRequestId(requestId);
                        resolve({
                            elevations: elevations,
                            status: status
                        });
                    });
                },
                false,
                true
            );
        });
    }

    parseResponse(response, options) {
        const self = this;
        switch (response.status) {
            case 'OK':
                return response.elevations.map(function (r) {
                    if (options.crs && options.crs !== self.nativeCRS) {
                        return Util.reproject([r.location.lng(), r.location.lat()], self.nativeCRS, options.crs).concat(r.elevation);
                    }
                    else {
                        return [r.location.lng(), r.location.lat(), r.elevation];
                    }
                });
            //case 'OVER_DAILY_LIMIT':
            //case 'OVER_QUERY_LIMIT':
            //case 'REQUEST_DENIED':
            //    self.serviceIsDisabled = true;
            default:
                return [];
        }
    }

    cancelRequest(id) {
        currentRequestIds.delete(id);
    }
}

export default ElevationServiceGoogle;
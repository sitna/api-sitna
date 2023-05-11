import ElevationService from './ElevationService';
import Util from '../Util';

class ElevationServiceIGNFr extends ElevationService {
    constructor() {
        super(...arguments);
        const self = this;
        self.url = self.options.url || '//wxs.ign.fr/essentiels/alti/wps';
        self.process = self.options.process || 'gs:WPSElevation';
        self.profileProcess = self.options.profileProcess || 'gs:WPSLineElevation';
        self.minimumElevation = self.options.minimumElevation || -99998;
        self.nativeCRS = 'EPSG:4326';
    }

    request(options) {
        const self = this;
        options = options || {};
        let coordinateList = options.coordinates;
        if (options.crs && options.crs !== self.nativeCRS) {
            coordinateList = Util.reproject(coordinateList, options.crs, self.nativeCRS);
        }
        const dataInputs = {
            lon: coordinateList.map(function (coord) {
                return coord[0];
            }).join('|'),
            lat: coordinateList.map(function (coord) {
                return coord[1];
            }).join('|'),
            crs: 'crs:84',
            format: 'json'
        };
        return super.request.call(self, { dataInputs: dataInputs, process: self.process });
    }

    parseResponse(response, options) {
        const self = this;
        if (response.elevations) {
            var elevations = response.elevations.map(function (elev) {
                return [elev.lon, elev.lat, elev.z];
            });
            if (options.crs && options.crs !== self.nativeCRS) {
                elevations = Util.reproject(elevations, self.nativeCRS, options.crs);
            }
            return super.parseResponse.call(self, { coordinates: elevations }, options);
        }
        return [];
    }
}

export default ElevationServiceIGNFr;
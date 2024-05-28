import OgcApiProcessesElevationService from './OgcApiProcessesElevationService';
import Util from '../Util';

class ElevationServiceIGNEs extends OgcApiProcessesElevationService {
    constructor() {
        super(...arguments);
        this.url = this.options.url || 'https://api-processes.idee.es/processes/getElevation';
        this.minimumElevation = this.options.minimumElevation || -9998;
        this.nativeCRS = 'EPSG:4326';
    }

    async request(options = {}) {
        const opts = {
            ...options,
            data: {
                formato: 'geojson',
                withCoord: true,
                outputFormat: 'array'
            }
        };

        let coordinateList;
        if (options.crs !== this.nativeCRS) {
            coordinateList = Util.reproject(options.coordinates, options.crs, this.nativeCRS);
        }
        else {
            coordinateList = options.coordinates;
        }

        const geom = {
            type: 'FeatureCollection',
            features: coordinateList.map((c) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: c
                }
            }))
        }
        opts.data.geom = JSON.stringify(geom);

        return await super.request(opts);
    }

    parseResponse(response, options) {
        let coordinates = [];
        if (response.values) {
            if (options.crs !== this.nativeCRS) {
                coordinates = Util.reproject(response.values, this.nativeCRS, options.crs);
            }
            else {
                coordinates = response.values;
            }
        }
        return super.parseResponse({ coordinates }, options);
    }
}

export default ElevationServiceIGNEs;
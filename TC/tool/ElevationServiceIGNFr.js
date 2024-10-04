import ElevationService from './ElevationService';
import Util from '../Util';

const FALLBACK_RESOURCE_ID = 'ign_rge_alti_wld';
const DELIMITER = '|';

class ElevationServiceIGNFr extends ElevationService {
    #resourcesUrl = 'https://data.geopf.fr/altimetrie/resources?keywords=Altitude';
    resourceId;

    constructor() {
        super(...arguments);
        this.url = this.options.url || 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json';
        this.minimumElevation = this.options.minimumElevation || -99998;
        this.nativeCRS = 'EPSG:4326';
    }

    async request(options = {}) {
        await this.#init();

        let coordinateList = options.coordinates;
        if (options.crs && options.crs !== this.nativeCRS) {
            coordinateList = Util.reproject(coordinateList, options.crs, this.nativeCRS);
        }

        const requestObj = {
            lon: coordinateList.map((coord) => coord[0]).join(DELIMITER),
            lat: coordinateList.map((coord) => coord[1]).join(DELIMITER),
            resource: this.resourceId,
            delimiter: DELIMITER,
            indent: 'false',
            measures: 'false',
            zonly: 'false'
        };

        return await (await this.getProxificationTool()).fetchJSON(this.url, {
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify(requestObj)
        });
    }

    parseResponse(response, options) {
        if (response.elevations) {
            let elevations = response.elevations.map((elev) => [elev.lon, elev.lat, elev.z]);
            if (options.crs && options.crs !== this.nativeCRS) {
                elevations = Util.reproject(elevations, this.nativeCRS, options.crs);
            }
            return super.parseResponse.call(this, { coordinates: elevations }, options);
        }
        return [];
    }

    async #init() {
        if (!this.resourceId) {
            const setFallbackResourceId = () => {
                this.resourceId = FALLBACK_RESOURCE_ID;
            };

            let response;
            try {
                response = await (await this.getProxificationTool()).fetchJSON(this.#resourcesUrl);
            }
            catch (e) {
                console.error(e);
                setFallbackResourceId();
            }
            if (response.resources?.length) {
                const resource = response.resources[0];
                this.resourceId = resource._id;
            }
            else {
                setFallbackResourceId();
            }
        }
    }
}

export default ElevationServiceIGNFr;
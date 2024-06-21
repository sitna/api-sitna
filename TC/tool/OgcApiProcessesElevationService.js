import ElevationService from './ElevationService';

class OgcApiProcessesElevationService extends ElevationService {
    async request(options = {}) {
        const requestUrl = this.url + '/execution';
        return await (await this.getProxificationTool()).fetchJSON(requestUrl, {
            method: 'POST',
            data: JSON.stringify({
                inputs: options.data
            })
        });
    }
}

export default OgcApiProcessesElevationService;
import TC from '../../TC';
import ElevationService from './ElevationService';
import Util from '../Util';

let proxificationTool;

class ElevationServiceIGNEs extends ElevationService {
    constructor() {
        super(...arguments);
        const self = this;
        self.url = self.options.url || '//servicios.idee.es/wcs-inspire/mdt';
        self.minimumElevation = self.options.minimumElevation || -9998;
        self.nativeCRS = 'EPSG:25830';
    }

    async request(options) {
        const self = this;
        options = options || {};
        if (options.coordinates.length === 1) {
            let point = options.coordinates[0];

            if (options.crs && options.crs !== self.nativeCRS) {
                point = Util.reproject(point, options.crs, self.nativeCRS);
            }

            let coverageName = 'Elevacion25830_5';
            let coverageResolution = 3;
            const halfRes1 = coverageResolution / 2;
            const halfRes2 = coverageResolution - halfRes1;

            const bbox = [
                point[0] - halfRes1,
                point[1] - halfRes1,
                point[0] + halfRes2,
                point[1] + halfRes2
            ];
            const requestUrl = self.url + '?SERVICE=WCS&REQUEST=GetCoverage&VERSION=2.0.1' +
                '&SUBSET=' + encodeURIComponent('x,' + self.nativeCRS + '(' + bbox[0] + ',' + bbox[2] + ')') +
                '&SUBSET=' + encodeURIComponent('y,' + self.nativeCRS + '(' + bbox[1] + ',' + bbox[3] + ')') +
                '&COVERAGEID=' + encodeURIComponent(coverageName) +
                '&RESOLUTION=x(1)' +
                '&RESOLUTION=y(1)' +
                '&FORMAT=' + encodeURIComponent('application/asc') +
                '&EXCEPTIONS=XML';

            if (!proxificationTool) {
                const Proxification = (await import('./Proxification')).default;
                proxificationTool = new Proxification(TC.proxify);
            }
            const response = await proxificationTool.fetch(requestUrl);
            return response.responseText;
        }

        throw new Error('ign.es elevation service supports only points');
    }

    parseResponse(response, options) {
        const self = this;
        const lines = response.split('\n');
        const nColsLine = lines.find(line => line.indexOf('ncols') === 0);
        const nCols = parseInt(nColsLine && nColsLine.substr(nColsLine.lastIndexOf(' ')));
        const nRowsLine = lines.find(line => line.indexOf('nrows') === 0);
        const nRows = parseInt(nColsLine && nRowsLine.substr(nRowsLine.lastIndexOf(' ')));
        if (nCols && nRows) {
            const xllCornerLine = lines.find(line => line.indexOf('xllcorner') === 0);
            const x = parseFloat(xllCornerLine && xllCornerLine.substr(xllCornerLine.lastIndexOf(' ')));
            const yllCornerLine = lines.find(line => line.indexOf('yllcorner') === 0);
            const y = parseFloat(yllCornerLine && yllCornerLine.substr(yllCornerLine.lastIndexOf(' ')));
            if (!isNaN(x) && !isNaN(y)) {
                const cellSizeIndex = lines.findIndex(line => line.indexOf('cellsize') === 0);
                let elevation = parseFloat(lines[cellSizeIndex + Math.round(nRows / 2)].trim().split(' ')[Math.round(nCols / 2) - 1]);
                if (isNaN(elevation)) {
                    elevation = null;
                }
                let point = options.coordinates[0].slice();
                point[2] = elevation;
                if (options.crs && options.crs !== self.nativeCRS) {
                    point = Util.reproject(point, self.nativeCRS, options.crs);
                }
                return super.parseResponse.call(self, { coordinates: [point] }, options);
            }
        }
        return [];
    }
}

export default ElevationServiceIGNEs;
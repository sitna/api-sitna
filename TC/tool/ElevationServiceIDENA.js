import TC from '../../TC';
import ElevationService from './ElevationService';
import Consts from '../Consts';

class ElevationServiceIDENA extends ElevationService {
    constructor() {
        super(...arguments);
        const self = this;
        self.url = self.options.url || '//idena.navarra.es/ogc/wps';
        self.process = self.options.process || 'gs:ExtractRasterPoints';
        self.coverageClass = self.options.coverageClass || 'MDT_maxima_actualidad,Alturas_maxima_actualidad';
        self.minimumElevation = self.options.minimumElevation || -9998;
    }

    request(options) {
        const self = this;
        options = options || {};
        const geometryOptions = {
            coordinates: options.coordinates,
            type: Consts.geom.POLYLINE
        };
        if (options.coordinates.length === 1) {
            geometryOptions.coordinates = options.coordinates[0];
            geometryOptions.type = Consts.geom.POINT;
        }
        let coverageClass = options.coverageClass || self.coverageClass;
        const sepIdx = coverageClass.indexOf(',');
        if (coverageClass && sepIdx >= 0 && !options.includeHeights) {
            coverageClass = coverageClass.substr(0, sepIdx);
        }
        const dataInputs = {
            coverageClass: coverageClass,
            geometry: {
                mimeType: Consts.mimeType.JSON,
                value: TC.wrap.Geometry.toGeoJSON(geometryOptions)
            }
        };
        if (options.crs) {
            var idx = options.crs.lastIndexOf(':');
            if (idx < 0) {
                idx = options.crs.lastIndexOf('#');
            }
            dataInputs.srid = options.crs.substr(idx + 1);
        }
        return super.request.call(self, { dataInputs: dataInputs }, options);
    }

    parseResponse(response, options) {
        const self = this;
        const coverageClass = options.coverageClass || self.coverageClass;
        const coverageClassCount = options.includeHeights && coverageClass ? coverageClass.split(',').length : 1;
        if (coverageClassCount <= 1) {
            return super.parseResponse.call(self, response, options);
        }
        if (response.coordinates) {
            const coords = response.coordinates;
            const coordinateCount = coords.length / coverageClassCount;
            const result = coords.slice(0, coordinateCount);
            var i;
            for (i = 0; i < coordinateCount; i++) {
                const point = result[i];
                if (point[2] < self.minimumElevation) {
                    point[2] = null;
                }
            }
            for (i = 1; i < coverageClassCount; i++) {
                const offset = i * coordinateCount;
                for (var j = 0; j < coordinateCount; j++) {
                    const elevation = coords[j + offset][2];
                    result[j].push(elevation < self.minimumElevation ? null : elevation);
                }
            }
            return result;
        }
        return [];
    }
}

export default ElevationServiceIDENA;
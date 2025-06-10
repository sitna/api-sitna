import FeatureFormat from '../../node_modules/ol/format/Feature.js';
import GeoJSON from '../../node_modules/ol/format/GeoJSON.js';

class BinaryFormat extends FeatureFormat {
    #geoJsonFormat;

    constructor(options) {
        super(options);
        this.#geoJsonFormat = new GeoJSON(options);
    }

    getType() {
        return 'arraybuffer';
    }

    readGeoJsonFeatures(jsonObj, options) {
        return this.#geoJsonFormat.readFeatures(jsonObj, options);
    }
}

class FieldNameError extends TypeError {
}

class TimeNotSupportedError extends TypeError {
    constructor() {
        super(...arguments);
        this.message = 'Time not supported in this format';
    }
}

export default BinaryFormat;
export { FieldNameError, TimeNotSupportedError };

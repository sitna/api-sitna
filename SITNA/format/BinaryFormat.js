import FeatureFormat from 'ol/format/Feature';
import GeoJSON from 'ol/format/GeoJSON';

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

export default BinaryFormat;
export { FieldNameError };

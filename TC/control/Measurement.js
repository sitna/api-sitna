import WebComponentControl from './WebComponentControl';
import TC from '../../TC';
import Feature from '../../SITNA/feature/Feature';
import Point from '../../SITNA/feature/Point';
import Polyline from '../../SITNA/feature/Polyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';
import Cfg from '../Cfg';
import Consts from '../Consts';
import Util from '../Util';

TC.control = TC.control || {};

const elementName = 'sitna-measurement';

class Measurement extends WebComponentControl {

    static units = {
        m: { weight: 0, abbr: "m&sup2;" },
        dam: { weight: 1, abbr: "dam&sup2;", precision: 2 },
        hm: { weight: 2, abbr: "hm&sup2;", precision: 2 },
        ha: { weight: 2, abbr: "ha", precision: 3 },
        km: { weight: 3, abbr: "km&sup2;", precision: 3 }
    };

    NOMEASURE = '-';

    #c1Value;
    #c1Text;
    #c2Value;
    #c2Text;
    #elevationText;
    #elevationValue;
    #lengthValue;
    #perimeterValue;
    #areaValue;
    #profileButton;
    #measurementData;

    constructor() {
        super(...arguments);
        const self = this;
        self
            .initProperty('enabledProfile')
            .initProperty('mode')
            .initProperty('units');
    }

    static get observedAttributes() {
        return ['mode', 'enabled-profile'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'enabled-profile') {
            self.#onEnabledProfileChange();
        }
        if (name === 'mode') {
            self.#onModeChange();
        }
    }

    getClassName() {
        return 'tc-ctl-msmt';
    }

    get enabledProfile() {
        return this.hasAttribute('enabled-profile');
    }

    set enabledProfile(value) {
        this.toggleAttribute('enabled-profile', !!value);
    }

    #onEnabledProfileChange() {
        this.render();
    }

    get mode() {
        return this.getAttribute('mode');
    }

    set mode(value) {
        if (value) {
            this.setAttribute('mode', value);
        }
        else {
            this.removeAttribute('mode');
        }
    }

    #onModeChange() {
        this.render();
    }

    setMode(value) {
        const self = this;
        return new Promise(function (resolve, _reject) {
            const oldMode = self.mode;
            if (oldMode === value) {
                self.renderPromise().then(() => resolve(value));
            }
            self.mode = value;
            self.render().then(() => resolve(value));
        });
    }

    get units() {
        const self = this;
        const attributeValue = self.getAttribute('units');
        if (attributeValue) {
            return attributeValue.split(',');
        }
        return ["m", "km"];
    }

    set units(value) {
        const self = this;
        if (Array.isArray(value)) {
            self.setAttribute('units', value.join());
        }
        else {
            self.setAttribute('units', value);
        }
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-msmt.mjs');
        self.template = module.default;
    }

    render(callback) {
        const self = this;
        const dataObj = {
            enabledProfile: self.enabledProfile
        };
        const mode = self.mode;
        if (mode) {
            dataObj[mode] = true;
        }
        return self._set1stRenderPromise(new Promise(function (resolve, _reject) {
            self.renderData(dataObj, function () {
                self.#c1Text = self.querySelector(`.${self.CLASS}-val-coord-1-t`);
                self.#c1Value = self.querySelector(`.${self.CLASS}-val-coord-1-v`);
                self.#c2Text = self.querySelector(`.${self.CLASS}-val-coord-2-t`);
                self.#c2Value = self.querySelector(`.${self.CLASS}-val-coord-2-v`);
                self.#elevationText = self.querySelector(`.${self.CLASS}-val-coord-ele-t`);
                self.#elevationValue = self.querySelector(`.${self.CLASS}-val-coord-ele-v`);
                self.#lengthValue = self.querySelector(`.${self.CLASS}-val-len`);
                self.#areaValue = self.querySelector(`.${self.CLASS}-val-area`);
                self.#perimeterValue = self.querySelector(`.${self.CLASS}-val-peri`);
                self.#profileButton = self.querySelector('sitna-toggle.tc-ctl-msmt-prof-btn');
                self.addUIEventListeners();
                self.clearMeasurement();
                if (typeof callback === 'function') {
                    callback();
                }
                resolve();
            });
        }));
    }

    addUIEventListeners() {
        const self = this;
        self.#profileButton?.addEventListener('change', function (e) {
            const containerControl = self.containerControl;
            if (e.target.checked) {
                containerControl.activateElevationProfile();
                e.target.setAttribute('text', self.getLocaleString('deactivateElevationProfile'));
            }
            else {
                containerControl.deactivateElevationProfile();
                e.target.setAttribute('text', self.getLocaleString('activateElevationProfile'));
            }
        }, { passive: true });
    }

    getFeatureMeasurementData(feature) {
        const self = this;
        const result = {
            units: 'm'
        };
        const measureOptions = {
            crs: self.map.options.utmCrs
        };
        switch (true) {
            case feature instanceof Polygon:
            case feature instanceof MultiPolygon:
                result.area = feature.getArea(measureOptions);
                result.perimeter = feature.getLength(measureOptions);
                break;
            case feature instanceof Polyline:
            case feature instanceof MultiPolyline:
                result.length = feature.getLength(measureOptions);
                break;
            case feature instanceof Point:
                result.coordinates = feature.geometry;
                result.units = self.map.wrap.isGeo() ? 'degrees' : 'm';
                break;
            case feature instanceof MultiPoint:
                result.coordinates = feature.geometry[0];
                result.units = self.map.wrap.isGeo() ? 'degrees' : 'm';
                break;
            default:
                break;
        }
        return result;
    }

    setFeatureMeasurementData(feature) {
        const self = this;
        const data = {};
        switch (true) {
            case feature instanceof Point: {
                const firstCoordText = self.#measurementData.coord1Text;
                const secondCoordText = self.#measurementData.coord2Text;
                const elevationText = self.#measurementData.elevationText;
                if (Object.prototype.hasOwnProperty.call(self.#measurementData, "coord1") &&
                    Object.prototype.hasOwnProperty.call(self.#measurementData, "coord2")) {
                    data.CRS = self.map.getCRS();
                    data[firstCoordText.substr(0, firstCoordText.indexOf(':'))] = self.#measurementData.coord1;
                    data[secondCoordText.substr(0, secondCoordText.indexOf(':'))] = self.#measurementData.coord2;
                    if (elevationText) {
                        data[self.getLocaleString('ele')] = self.#measurementData.elevation;
                    }
                    feature.setData(data);
                }
                break;
            }
            case feature instanceof Polyline:
                if (Object.prototype.hasOwnProperty.call(self.#measurementData, "length")) {                    
                    data[self.getLocaleString('2dLength')] = self.#measurementData.length;
                    feature.setData(data);
                }
                break;
            case feature instanceof Polygon:
                if (Object.prototype.hasOwnProperty.call(self.#measurementData, "area") &&
                    Object.prototype.hasOwnProperty.call(self.#measurementData, "perimeter")) {
                    data[self.getLocaleString('area')] = self.#measurementData.area;
                    data[self.getLocaleString('2dPerimeter')] = self.#measurementData.perimeter;                    
                    feature.setData(data);
                }
                break;
            default:
                break;
        }
        return self;
    }

    displayMeasurement(featureOrOptions) {
        const self = this;
        let options = featureOrOptions;
        let mode;
        let precision;
        let feature;
        if (featureOrOptions instanceof Feature) {
            feature = featureOrOptions;
            options = self.getFeatureMeasurementData(featureOrOptions);
        }
        self.currentFeature = feature;
        self.#measurementData = {};
        let units = options.units;
        if (options.coordinates) {
            mode = Consts.geom.POINT;
            const round = function (val, precision) {
                const factor = Math.pow(10, precision);
                return Math.round(val * factor) / factor;
            };
            if (units === 'm') {
                precision = Consts.METER_PRECISION;
                self.#measurementData.coord1 = options.coordinates[0];
                self.#measurementData.coord2 = options.coordinates[1];
                self.#measurementData.coord1Text = 'x: ';
                self.#measurementData.coord2Text = 'y: ';
            }
            else {
                precision = Consts.DEGREE_PRECISION;
                self.#measurementData.coord1 = options.coordinates[1];
                self.#measurementData.coord2 = options.coordinates[0];
                self.#measurementData.coord1Text = 'lat: ';
                self.#measurementData.coord2Text = 'lon: ';
            }
            self.#measurementData.coord1 = round(self.#measurementData.coord1, precision);
            self.#measurementData.coord2 = round(self.#measurementData.coord2, precision);

            if (options.coordinates.length > 2) {
                self.#measurementData.elevation = Math.round(options.coordinates[2]);
                self.#measurementData.elevationText = self.getLocaleString('ele').toLowerCase() + ': ';
            }
        }
        else if (Object.prototype.hasOwnProperty.call(options, 'area')) {
            mode = Consts.geom.POLYGON;
            self.#measurementData.area = options.area;
            self.#measurementData.perimeter = options.perimeter;
        }
        else {
            mode = Consts.geom.POLYLINE;
            self.#measurementData.length = options.length;
        }
        self.setMode(mode).then(function () {
            const locale = self.map.options.locale || Cfg.locale;
            if (mode === Consts.geom.POLYGON) {
                let area = self.#measurementData.area;
                self.units.forEach(function (unit, _index, array) {
                    const key = unit.trim();
                    const weightDiff = Measurement.units[key].weight - Measurement.units.m.weight;
                    let precision = Measurement.units[key].precision ? Measurement.units[key].precision : 0;
                    if (array.length === 1 ||
                        area >= Math.pow(100, weightDiff) / Math.pow(10, precision ? precision - 1 : precision)) {
                        self.#areaValue.innerHTML = Util.formatNumber((area / Math.pow(100, weightDiff)).toFixed(precision), locale) +
                            ' ' + Measurement.units[unit].abbr;
                    }
                });
                let perimeter = self.#measurementData.perimeter;
                if (perimeter > 1000) {
                    perimeter = perimeter / 1000;
                    units = 'km';
                }
                precision = units === 'm' ? 0 : 3;
                self.#perimeterValue.innerHTML = Util.formatNumber(perimeter.toFixed(precision), locale) + ' ' + units;
            }
            else if (mode === Consts.geom.POLYLINE) {
                let length = self.#measurementData.length;
                if (length > 1000) {
                    length = length / 1000;
                    units = 'km';
                }
                precision = units === 'm' ? 0 : 3;
                self.#lengthValue.innerHTML = Util.formatNumber(length.toFixed(precision), locale) + ' ' + units;
            }
            else if (mode === Consts.geom.POINT) {
                self.#c1Text.innerHTML = self.#measurementData.coord1Text;
                self.#c2Text.innerHTML = self.#measurementData.coord2Text;
                self.#c1Value.innerHTML = Util.formatNumber(self.#measurementData.coord1.toFixed(precision), locale);
                self.#c1Value.dataset.value = self.#measurementData.coord1;
                self.#c2Value.innerHTML = Util.formatNumber(self.#measurementData.coord2.toFixed(precision), locale);
                self.#c2Value.dataset.value = self.#measurementData.coord2;
                if (Object.prototype.hasOwnProperty.call(self.#measurementData, 'elevation')) {
                    self.#elevationText.innerHTML = self.#measurementData.elevationText;
                    self.#elevationValue.innerHTML = Util.formatNumber(self.#measurementData.elevation.toFixed(Consts.METER_PRECISION), locale) + ' m';
                    self.#elevationValue.dataset.value = self.#measurementData.elevation;
                }
                else {
                    self.#elevationText.innerHTML = '';
                    self.#elevationValue.innerHTML = '';
                    self.#elevationValue.dataset.value = '';
                }
            }
        });
        return self;
    }

    getFormattedCoordinates() {

    }

    clearMeasurement() {
        const self = this;
        if (self.#c1Value) {
            self.#c1Value.innerHTML = self.NOMEASURE;
        }
        if (self.#c2Value) {
            self.#c2Value.innerHTML = self.NOMEASURE;
        }
        if (self.#elevationText) {
            self.#elevationText.innerHTML = '';
        }
        if (self.#elevationValue) {
            self.#elevationValue.innerHTML = '';
        }
        if (self.#lengthValue) {
            self.#lengthValue.innerHTML = self.NOMEASURE;
        }
        if (self.#perimeterValue) {
            self.#perimeterValue.innerHTML = self.NOMEASURE;
        }
        if (self.#areaValue) {
            self.#areaValue.innerHTML = self.NOMEASURE;
        }

    }

    clear() {
        this.mode = null;
    }
}

customElements.get(elementName) || customElements.define(elementName, Measurement);
TC.control.Measurement = Measurement;
export default Measurement;
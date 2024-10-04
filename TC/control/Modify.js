import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Cfg from '../Cfg';
import WebComponentControl from './WebComponentControl';
import Point from '../../SITNA/feature/Point';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';
import './FeatureStyler';

TC.control = TC.control || {};

Consts.event.BEFOREFEATUREMODIFY = "beforefeaturemodify.tc";
Consts.event.FEATUREMODIFY = "featuremodify.tc";
Consts.event.FEATURESSELECT = "featuresselect.tc";
Consts.event.FEATURESUNSELECT = "featuresunselect.tc";
Consts.event.CHANGE = 'change';

//const styleFunction = function (feature, mapStyles) {
//    var result;
//    switch (true) {
//        case feature instanceof Polygon:
//        case feature instanceof MultiPolygon:
//            result = Util.extend({}, mapStyles.polygon);
//            break;
//        case feature instanceof Point:
//        case feature instanceof MultiPoint:
//            result = Util.extend({}, mapStyles.point);
//            break;
//        default:
//            result = Util.extend({}, mapStyles.line);
//            break;
//    }
//    const style = feature.getStyle();
//    if (style.label) {
//        result.label = style.label;
//        result.fontSize = style.fontSize;
//        result.fontColor = style.fontColor;
//        result.labelOutlineColor = style.labelOutlineColor;
//        result.labelOutlineWidth = style.labelOutlineWidth;
//    }
//    return result;
//};

//const setFeatureSelectedStyle = function (ctl, features) {
//    const mapStyles = ctl.map.options.styles.selection;
//    features.forEach(function (feature) {
//        feature._originalStyle = Util.extend({}, feature.getStyle());
//        feature.setStyle(ctl.styleFunction(feature));
//    });
//};

//const setFeatureUnselectedStyle = function (ctl, features) {
//    features.forEach(function (feature) {
//        if (feature._originalStyle) {
//            const style = feature.getStyle();
//            if (style.label) {
//                const originalStyle = feature._originalStyle;
//                originalStyle.label = style.label;
//                originalStyle.fontSize = style.fontSize;
//                originalStyle.fontColor = style.fontColor;
//                originalStyle.labelOutlineColor = style.labelOutlineColor;
//                originalStyle.labelOutlineWidth = style.labelOutlineWidth;
//            }
//            feature.setStyle(feature._originalStyle);
//            feature._originalStyle = undefined;
//        }
//    })
//};

const complexGeometryFilter = function (elm) {
    var result = false;
    if (elm instanceof MultiPolygon || elm instanceof MultiPolyline) {
        if (elm.geometry.length > 1) {
            result = true;
        }
    }
    return result;
};

const vertexGeometryFilter = function (elm) {
    return elm instanceof Polygon ||
        elm instanceof Polyline ||
        elm instanceof MultiPolygon ||
        elm instanceof MultiPolyline;
};

const className = 'tc-ctl-mod';
const elementName = 'sitna-modify';

class Modify extends WebComponentControl {
    #classSelector = '.' + className;
    #deleteBtn;
    #selectBtn;
    #deleteVertexBtn;
    #joinBtn;
    #splitBtn;
    #textBtn;
    #textInput;
    #fontColorPicker;
    #labelSection;
    #styler;
    #fontSizeSelector;
    #layerPromise;

    static mode = {
        SELECT: 'select',
        VERTEX_DELETE: 'vertex_delete'
    };

    constructor() {
        super(...arguments);
        const self = this;

        self.wrap = new TC.wrap.control.Modify(self);
        self
            .initProperty('mode')
            .initProperty('snapping')
            .initProperty('stylable');
    }

    static get observedAttributes() {
        return ['mode', 'stylable'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'stylable') {
            self.#onStylableChange();
        }
        if (name === 'mode') {
            self.#onModeChange();
        }
    }

    get snapping() {
        return this.hasAttribute('snapping');
    }

    set snapping(value) {
        this.toggleAttribute('snapping', !!value);
    }

    get mode() {
        const self = this;
        if (self.hasAttribute('mode')) {
            return self.getAttribute('mode');
        }
        return Modify.mode.SELECT;
    }

    set mode(value) {
        this.setAttribute('mode', value || Modify.mode.SELECT);
    }

    async #onModeChange() {
        const self = this;
        await self.renderPromise();
        self.#setVertexDeleteModeState(self.getSelectedFeatures());
    }

    get stylable() {
        return this.hasAttribute('stylable');
    }

    set stylable(value) {
        this.toggleAttribute('stylable', !!value);
    }

    #onStylableChange() {
        const self = this;
        self.#getStylingElement()?.classList
            .toggle(Consts.classes.HIDDEN, !(self.stylable && self.getSelectedFeatures().length));
    }

    #getStylingElement() {
        const self = this;
        return self.querySelector(`.${self.CLASS}-style`);
    }

    #setFeatureSelectedState(features) {
        const self = this;
        self.#deleteBtn.disabled = features.length === 0;
        self.#deleteVertexBtn.disabled = !features.some(vertexGeometryFilter);
        self.#joinBtn.disabled = features.length < 2;
        self.#splitBtn.disabled = !features.some(complexGeometryFilter);
        self.displayLabelText();
        self.#onStylableChange();
        self.getStyler().then(styler => styler.setFeature(features[0]));
    }

    #setVertexDeleteModeState(features) {
        const self = this;
        self.#deleteVertexBtn.disabled = !features.some(vertexGeometryFilter);
        const mode = self.mode;
        self.#deleteVertexBtn.classList.toggle(Consts.classes.ACTIVE, mode === Modify.mode.VERTEX_DELETE);
        self.#selectBtn.classList.toggle(Consts.classes.ACTIVE, self.isActive && mode !== Modify.mode.VERTEX_DELETE);
    }

    register(map) {
        const self = this;

        self.styles = Util.extend(true, {}, Cfg.styles.selection, map.options.styles?.selection, self.options.styles);
        self.styles.snapping = Util.extend(true, {}, Cfg.styles.snapping, map.options.styles?.snapping, self.options.styles?.snapping);
        self.styles.text = self.styles.text || {
            fontSize: self.styles.line.fontSize,
            fontColor: self.styles.line.fontColor,
            labelOutlineColor: self.styles.line.labelOutlineColor,
            labelOutlineWidth: self.styles.line.labelOutlineWidth
        };

        const result = super.register.call(self, map);
        if (self.options.layer) {
            self.setLayer(self.options.layer);
        }

        map
            .on(Consts.event.FEATUREADD + ' ' + Consts.event.FEATURESADD, function (e) {
                Promise.all([self.getLayer(), self.renderPromise()]).then(function (objects) {
                    const layer = objects[0];
                    if (e.layer === layer) {
                        self.setSelectableState(true);
                    }
                });
            })
            .on(Consts.event.FEATUREREMOVE + ' ' + Consts.event.FEATURESCLEAR, function (e) {
                const layer = e.layer;
                const feature = e.feature;
                Promise.all([self.getLayer(), self.renderPromise()]).then(function (objects) {
                    if (layer === objects[0]) {
                        if (feature) {
                            self.unselectFeatures([feature]);
                        }
                        else {
                            self.unselectFeatures();
                        }
                        self.#setFeatureSelectedState(self.getSelectedFeatures());
                        if (layer.features.length === 0) {
                            self.setSelectableState(false);
                            self.setTextMode(false);
                        }
                    }
                });
            })
            .on(Consts.event.LAYERUPDATE, function (e) {
                const layer = e.layer;
                Promise.all([self.getLayer(), self.renderPromise()]).then(function (objects) {
                    if (layer === objects[0]) {
                        self.#setFeatureSelectedState(self.getSelectedFeatures());
                    }
                });
            });

        self.on(Consts.event.FEATURESSELECT + ' ' + Consts.event.FEATURESUNSELECT, function () {
            const selectedFeatures = self.getSelectedFeatures();
            self.#setFeatureSelectedState(selectedFeatures);
            const unselectedFeatures = self.layer.features.filter(function (feature) {
                return selectedFeatures.indexOf(feature) < 0;
            });
            unselectedFeatures.forEach(function (feature) {
                feature.toggleSelectedStyle(false);
            });
            selectedFeatures.forEach(function (feature) {
                feature.toggleSelectedStyle(true);
            });
        });

        return result;
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-mod.mjs');
        const attributesTemplatePromise = import('../templates/tc-ctl-mod-attr.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-attr'] = (await attributesTemplatePromise).default;
        self.template = template;
    }

    async render(callback) {
        const self = this;

        const styles = self.styles || {};

        await self.renderData({
            stylable: self.stylable,
            fontSize: styles.text?.fontSize,
            fontColor: styles.text?.fontColor,
            labelOutlineColor: styles.text?.labelOutlineColor,
            labelOutlineWidth: styles.text?.labelOutlineWidth
        }, function () {
            self.#selectBtn = self.querySelector('.' + self.CLASS + '-btn-select');
            self.#deleteBtn = self.querySelector('.' + self.CLASS + '-btn-delete');
            self.#deleteVertexBtn = self.querySelector('.' + self.CLASS + '-btn-del-vertex');
            self.#textBtn = self.querySelector('.' + self.CLASS + '-btn-text');
            self.#joinBtn = self.querySelector('.' + self.CLASS + '-btn-join');
            self.#splitBtn = self.querySelector('.' + self.CLASS + '-btn-split');
            self.#textInput = self.querySelector('input.' + self.CLASS + '-txt');
            self.#labelSection = self.querySelector('.' + self.CLASS + '-style-label');
            self.#fontColorPicker = self.querySelector(self.#classSelector + '-fnt-c');
            self.#fontSizeSelector = self.querySelector('.' + self.CLASS + '-fnt-s');

            self.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
        });
    }

    addUIEventListeners() {
        const self = this;
        self.#selectBtn.addEventListener(Consts.event.CLICK, function (e) {
            if (!e.target.disabled) {
                if (self.isActive) {
                    if (self.mode !== Modify.mode.VERTEX_DELETE) {
                        self.deactivate();
                    }
                    else {
                        self.setMode(Modify.mode.SELECT, true);
                    }
                }
                else {
                    self.activate();
                }
            }
        }, { passive: true });
        self.#deleteBtn.addEventListener(Consts.event.CLICK, function () {
            self.deleteSelectedFeatures();
        }, { passive: true });
        self.#deleteVertexBtn.addEventListener(Consts.event.CLICK, function () {
            const newMode = self.mode === Modify.mode.VERTEX_DELETE ?
                Modify.mode.SELECT : Modify.mode.VERTEX_DELETE;
            self.setMode(newMode, true);
        }, { passive: true });
        self.#textBtn.addEventListener(Consts.event.CLICK, function () {
            self.setTextMode(!self.textActive);
        }, { passive: true });
        self.#textInput.addEventListener('input', function (e) {
            self.labelFeatures(e.target.value);
        });
        self.#fontColorPicker.addEventListener(Consts.event.CHANGE, function (e) {
            self.setFontColor(e.target.value);
        });
        self.#fontSizeSelector.addEventListener(Consts.event.CHANGE, function (e) {
            self.setFontSize(e.target.value);
        });

        self.getStyler().then(styler => styler.addEventListener(Consts.event.STYLECHANGE, e => {
            self.getSelectedFeatures().forEach(f => {
                const newData = {};
                newData[e.detail.property] = e.detail.value;
                const newStyle = Object.assign({}, f.getStyle(), newData);
                f.setStyle(newStyle);
            });
        }));
    }

    activate() {
        const self = this;
        self.#selectBtn.classList.add(Consts.classes.ACTIVE);
        super.activate.call(self);
        self.wrap.activate(self.mode);
        self.#setVertexDeleteModeState(self.getSelectedFeatures());
    }

    deactivate() {
        const self = this;
        super.deactivate.call(self);
        if (self.#selectBtn) {
            self.#setFeatureSelectedState([]);
        }
        if (self.#selectBtn) {
            self.#selectBtn.classList.remove(Consts.classes.ACTIVE);
            if (self.layer) {
                self.unselectFeatures(self.getSelectedFeatures());
            }
        }
        if (self.wrap) {
            self.wrap.deactivate();
        }
        self.mode = Modify.mode.SELECT;
    }

    clear() {
        const self = this;
        if (self.layer) {
            self.layer.clearFatures();
        }
        return self;
    }

    isExclusive() {
        return true;
    }

    end() {
        const self = this;
        self.wrap.end();
        return self;
    }

    setMode(mode, activate) {
        const self = this;

        if (mode) {
            self.mode = mode;
        }

        if (activate && mode) {
            if (self.layer) {
                self.layer.map.putLayerOnTop(self.layer);
            }
            self.activate();
        }
        else {
            self.deactivate();
        }
        return self;
    }

    getLayer() {
        var self = this;
        // Se ha instanciado un control sin capa asociada
        if (self.options && typeof self.options.layer === 'boolean' && !self.options.layer) {
            return Promise.resolve(null);
        }
        if (self.layer) {
            return Promise.resolve(self.layer);
        }
        return self.#layerPromise;
    }

    setLayer(layer) {
        const self = this;
        if (self.map) {
            self.setSelectedFeatures([]);
            self.#layerPromise = new Promise(function (resolve, _reject) {
                if (typeof (layer) === "string") {
                    self.map.loaded(function () {
                        self.layer = self.map.getLayer(layer);
                        resolve(self.layer);
                    });
                }
                else {
                    if (!layer && self.isActive) {
                        self.deactivate();
                    }
                    self.layer = layer;
                    resolve(self.layer);
                }
            });
            Promise.all([self.#layerPromise, self.renderPromise()]).then(function (objs) {
                const layer = objs[0];
                self.setSelectableState(layer && layer.features.length > 0);
            });
        }
    }

    setSelectableState(active) {
        this.#selectBtn.disabled = !active;
        this.setLabelableState(active);
    }

    setLabelableState(active) {
        this.#textBtn.disabled = !active;
    }

    getSelectedFeatures() {
        return this.wrap.getSelectedFeatures();
    }

    setSelectedFeatures(features) {
        const self = this;
        const result = self.wrap.setSelectedFeatures(features);
        self.displayLabelText();
        return result;
    }

    getActiveFeatures() {
        const result = this.getSelectedFeatures();
        if (!result.length) {
            if (this.map?.activeControl?.getSketch) {
                const sketch = this.map.activeControl.getSketch();
                if (sketch) {
                    result.push(sketch);
                }
            }
            if (!result.length && this.layer?.features.length) {
                result.push(this.layer.features[this.layer?.features.length - 1]);
            }
        } 
        return result;
    }

    unselectFeatures(features) {
        features = features || [];
        this.wrap.unselectFeatures(features.map(function (feat) {
            return feat.wrap.feature;
        }));
        return this;
    }

    deleteSelectedFeatures() {
        const self = this;
        const features = self.getSelectedFeatures();
        self.wrap.unselectFeatures(features);
        features.forEach(function (feature) {
            self.layer.removeFeature(feature);
            self.trigger(Consts.event.FEATUREREMOVE, { feature: feature });
        });
        return self;
    }

    styleFunction(feature, _resolution) {
        const self = this;
        var result;
        const mapStyles = self.map.options.styles.selection;
        switch (true) {
            case feature instanceof Polygon:
            case feature instanceof MultiPolygon:
                result = Util.extend({}, mapStyles.polygon);
                break;
            case feature instanceof Point:
            case feature instanceof MultiPoint:
                result = Util.extend({}, mapStyles.point);
                break;
            default:
                result = Util.extend({}, mapStyles.line);
                break;
        }
        const style = feature.getStyle();
        if (style.label) {
            result.label = style.label;
            result.fontSize = style.fontSize;
            result.fontColor = style.fontColor;
            result.labelOutlineColor = style.labelOutlineColor;
            result.labelOutlineWidth = style.labelOutlineWidth;
        }
        return result;
    }

    setTextMode(active) {
        const self = this;
        self.textActive = active;
        if (active) {
            self.#textBtn.classList.add(Consts.classes.ACTIVE, active);
            self.#labelSection.classList.remove(Consts.classes.HIDDEN);
        }
        else {
            self.#textBtn.classList.remove(Consts.classes.ACTIVE, active);
            self.#labelSection.classList.add(Consts.classes.HIDDEN);
        }
        self.displayLabelText();
        return self;
    }

    setFontColorWatch(color, outlineColor) {
        const self = this;
        if (color === undefined) {
            color = self.styles.text.fontColor;
        }
        color = Util.colorArrayToString(color);
        outlineColor = outlineColor || self.getLabelOutlineColor(color);
        self.renderPromise().then(function () {
            self.#fontColorPicker.value = color;
            self.#textInput.style.color = color;
            self.#textInput.style.textShadow = '0 0 ' + self.styles.text.labelOutlineWidth + 'px ' + outlineColor;
            if (!TC.browserFeatures.inputTypeColor()) {
                self.#fontColorPicker.style.backgroundColor = color;
                self.#fontColorPicker.blur();
            }
        });
        return self;
    }

    setFontColor(color) {
        const self = this;
        self.styles.text.fontColor = color;
        self.styles.text.labelOutlineColor = self.getLabelOutlineColor(color);
        self.setFontColorWatch(color, self.styles.text.labelOutlineColor);
        const features = self.getActiveFeatures();
        features.forEach(function (feature) {
            const style = feature.getStyle();
            style.fontColor = color;
            style.labelOutlineColor = self.styles.text.labelOutlineColor;
            feature.setStyle(style);
        });
        return self;
    }

    setFontSizeWatch(size) {
        const self = this;
        if (size === undefined) {
            size = self.styles.text.fontSize;
        }
        const sizeValue = parseInt(size);
        if (!Number.isNaN(sizeValue)) {
            self.renderPromise().then(function () {
                self.#fontSizeSelector.value = sizeValue;
                self.#textInput.style.fontSize = sizeValue + 'pt';
            });
        }
        return self;
    }

    setFontSize(size) {
        const self = this;
        const sizeValue = parseInt(size);
        if (!Number.isNaN(sizeValue)) {
            self.styles.text.fontSize = sizeValue;
            self.setFontSizeWatch(sizeValue);
            const features = self.getActiveFeatures();
            features.forEach(function (feature) {
                const style = feature.getStyle();
                style.fontSize = sizeValue;
                if (style.font)
                    style.font = style.font.replace(/^\d+/, sizeValue);
                feature.setStyle(style);
            });
        }
        return self;
    }

    getLabelOutlineColor(fontColor) {
        if (fontColor) {
            fontColor = Util.colorArrayToString(fontColor);
            const matchForShort = fontColor.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
            if (matchForShort && matchForShort.length) {
                fontColor = '#' + matchForShort[1] + matchForShort[1] + matchForShort[2] + matchForShort[2] + matchForShort[3] + matchForShort[3];
            }
            const matchForLong = fontColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            if (matchForLong && matchForLong.length) {
                const r = parseInt(matchForLong[1], 16);
                const g = parseInt(matchForLong[2], 16);
                const b = parseInt(matchForLong[3], 16);
                return (r + g + b) / 3 < 128 ? '#ffffff' : '#000000';
            }
        }
        return '#ffffff';
    }

    displayLabelText() {
        const self = this;
        const features = self.getActiveFeatures();
        var text;
        var size;
        var color;
        if (features.length) {
            const feature = features[features.length - 1];
            const style = feature.getStyle();
            text = style.label;
            color = style.fontColor;
            size = style.fontSize;
        }
        else {
            text = '';
            color = self.styles.text.fontColor;
            size = self.styles.text.fontSize;
        }
        self.renderPromise().then(function () {
            self
                .setFontSizeWatch(size)
                .setFontColorWatch(color)
                .#textInput.value = text || '';
        });
        return self;
    }

    labelFeatures(text) {
        const self = this;
        const features = self.getActiveFeatures();
        if (features.length) {
            const style = features[0].getStyle();
            features.forEach(function (feature) {
                const textStyle = Util.extend({}, self.styles.text, style);
                style.label = text;
                style.labelOffset = textStyle.labelOffset;
                style.fontColor = textStyle.fontColor;
                style.fontSize = textStyle.fontSize;
                style.labelOutlineColor = textStyle.labelOutlineColor;
                style.labelOutlineWidth = textStyle.labelOutlineWidth;
                feature.setStyle(style);
            });
        }
        return self;
    }

    async getStyler() {
        const self = this;
        await self.renderPromise();
        self.#styler = self.querySelector('sitna-feature-styler');
        return self.#styler;
    }

    joinFeatures(features) {
        const self = this;
        if (self.geometryType === Consts.geom.MULTIPOLYLINE ||
            self.geometryType === Consts.geom.MULTIPOLYGON ||
            self.geometryType === Consts.geom.MULTIPOINT) {
            self._joinedFeatureAttributes = [];
            let newFeature;
            if (features.length > 1) {
                var geometries = features.map(function (elm) {
                    self._joinedFeatureAttributes.push(elm.getData());
                    return elm.geometry;
                });
                var newGeometry = geometries.reduce(function (a, b) {
                    return a.concat(b);
                });
                newFeature = new features[0].constructor(newGeometry);
                for (var i = 0, len = features.length; i < len; i++) {
                    var feature = features[i];
                    self.layer.removeFeature(feature);
                    self.trigger(Consts.event.FEATUREREMOVE, { feature: feature });
                }
                self.layer.addFeature(newFeature).then(function (feat) {
                    self.setSelectedFeatures([newFeature]);
                    self.trigger(Consts.event.FEATUREADD, { feature: feat });
                    feat.showPopup(self.attributeEditor);
                });
            }
            self.#setFeatureSelectedState([newFeature]);
        }
    }
}

Modify.prototype.CLASS = 'tc-ctl-mod';
customElements.get(elementName) || customElements.define(elementName, Modify);
TC.control.Modify = Modify;
export default Modify;
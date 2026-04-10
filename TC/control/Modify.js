import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import Cfg from '../Cfg.js';
import WebComponentControl from './WebComponentControl.js';
import Point from '../../SITNA/feature/Point.js';
import MultiPoint from '../../SITNA/feature/MultiPoint.js';
import Polyline from '../../SITNA/feature/Polyline.js';
import MultiPolyline from '../../SITNA/feature/MultiPolyline.js';
import Polygon from '../../SITNA/feature/Polygon.js';
import MultiPolygon from '../../SITNA/feature/MultiPolygon.js';
import './FeatureStyler.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';
import FeatureHistory from '../tool/FeatureHistory.js';

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

class ModifyModel {
    constructor() {
        this.select = "";
        this.deleteSelectedFeatures = "";
        this.deleteVertices = "";
        this["joinGeometries.tooltip"] = "";
        this.joinGeometries = "";
        this.splitGeometry = "";
        this.addText = "";
        this.writeTextForFeature = "";
        this.textColor = "";
        this.fontSize = "";
        this.undoChanges = "";
        this.redoChanges = "";
        this.undoAllChanges = "";
        this.showDeletedFeatures = "";
        this.showDeletedFeature = "";
        this.deletedFeatures = "";
        this.recoverFeature = "";
    }
}

class Modify extends WebComponentControl {
    #classSelector = '.' + className;
    #deleteBtn;
    #showDeletedBtn;
    #undoBtn;
    #redoBtn;
    #undoAllBtn;
    #selectBtn;
    #deleteVertexBtn;
    #joinBtn;
    #splitBtn;
    #textBtn;
    #deletedFeatureList;
    #textInput;
    #fontColorPicker;
    #labelSection;
    #styler;
    #fontSizeSelector;
    #layerPromise;
    #deletedFeatures = new Map();
    #deletedFeaturesLayer;
    history;

    LAYER_FEATURE_SEPARATOR = ' \u203A '

    static mode = {
        SELECT: 'select',
        VERTEX_DELETE: 'vertex_delete'
    };

    constructor() {
        super(...arguments);

        this.history = new FeatureHistory();

        this.wrap = new TC.wrap.control.Modify(this);
        this
            .initProperty('mode')
            .initProperty('snapping')
            .initProperty('stylable');
        this.model = new ModifyModel();
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
        this.renderPromise().then(() => {
            this.#deleteBtn.disabled = features.length === 0;
            this.#showDeletedBtn.disabled = this.#deletedFeatures.size === 0;
            if (this.#showDeletedBtn.disabled) this.#showDeletedBtn.active = false;
            this.#showDeletedBtn.classList.toggle(Consts.classes.HIDDEN, this.#deletedFeatures.size === 0);
            if (!this.#showDeletedBtn.active) {
                this.#deletedFeatureList.parentElement.classList.add(Consts.classes.HIDDEN);
                this.getDeletedFeaturesLayer().then((layer) => layer.clearFeatures());
                this.#deletedFeatureList.querySelectorAll('li').forEach((li) => li.classList.remove(Consts.classes.CHECKED));
            }
            this.#deleteVertexBtn.disabled = !features.some(vertexGeometryFilter);
            this.#undoBtn.disabled = !features.some((feature) => this.history.canUndo(feature));
            this.#redoBtn.disabled = !features.some((feature) => this.history.canRedo(feature));
            this.#undoAllBtn.disabled = this.#undoBtn.disabled;
            this.#joinBtn.disabled = features.length < 2;
            this.#splitBtn.disabled = !features.some(complexGeometryFilter);
            this.displayLabelText();
            this.#onStylableChange();
            this.getStyler().then((styler) => styler.setFeature(features[0]));
        });
    }

    #setVertexDeleteModeState(features) {
        const self = this;
        self.#deleteVertexBtn.disabled = !features.some(vertexGeometryFilter);
        const mode = self.mode;
        self.#deleteVertexBtn.active = mode === Modify.mode.VERTEX_DELETE;
        self.#selectBtn.active = self.isActive && mode !== Modify.mode.VERTEX_DELETE;
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
            .on(Consts.event.FEATURESCLEAR + ' ' + Consts.event.LAYERREMOVE, function (e) {
                if (e.layer === self.layer) {
                    self.#flushDeletedFeatures();
                }
            })
            .on(Consts.event.LAYERUPDATE, function (e) {
                const layer = e.layer;
                Promise.all([self.getLayer(), self.renderPromise()]).then(function (objects) {
                    if (layer === objects[0]) {
                        self.#setFeatureSelectedState(self.getSelectedFeatures());
                    }
                });
            });

        const onFeaturesSelectionChange = function (e) {
            const selectedFeatures = self.getSelectedFeatures();
            self.#setFeatureSelectedState(selectedFeatures);
            e.features?.forEach((feature) => feature.toggleSelectedStyle(e.type === Consts.event.FEATURESSELECT));
        };
        self.addEventListener(Consts.event.FEATURESSELECT, onFeaturesSelectionChange);
        self.addEventListener(Consts.event.FEATURESUNSELECT, onFeaturesSelectionChange);

        self.on(Consts.event.FEATUREMODIFY, function (_e) {
            self.#setFeatureSelectedState(self.getSelectedFeatures());
        });

        const onHistoryChange = function (e) {
            const selectedFeatures = self.getSelectedFeatures();
            if (selectedFeatures.includes(e.feature)) {
                self.#setFeatureSelectedState(selectedFeatures);
            }
        };
        self.history.addEventListener('push', onHistoryChange);
        self.history.addEventListener('undo', function (e) {
            if (e.action.type === FeatureHistory.action.REMOVE) {
                if (Array.from(self.#deletedFeatures.values()).includes(e.feature)) {
                    const selectedFeatures = self.getSelectedFeatures();
                    if (!selectedFeatures.includes(e.feature)) {
                        self.setSelectedFeatures(selectedFeatures.concat([e.feature]));
                    }
                    self.#removeDeletedItemFromList(e.feature);
                }
            }
            onHistoryChange(e);
        });
        self.history.addEventListener('redo', function (e) {
            if (e.action.type === FeatureHistory.action.REMOVE) {
                self.#addDeletedItemToList(e.feature, e.action.oldData).then(() => {
                    onHistoryChange(e);
                });
            }
            else {
                onHistoryChange(e);
            }
        });

        return result;
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-mod.mjs');
        const deletedItemTemplatePromise = import('../templates/tc-ctl-mod-deleted.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-deleted'] = (await deletedItemTemplatePromise).default;
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
            labelOutlineWidth: styles.text?.labelOutlineWidth,
        }, function () {
            self.#selectBtn = self.querySelector('.' + self.CLASS + '-btn-select');
            self.#deleteBtn = self.querySelector('.' + self.CLASS + '-btn-delete');
            self.#showDeletedBtn = self.querySelector('.' + self.CLASS + '-btn-deleted-show');
            self.#undoBtn = self.querySelector('.' + self.CLASS + '-btn-undo');
            self.#redoBtn = self.querySelector('.' + self.CLASS + '-btn-redo');
            self.#undoAllBtn = self.querySelector('.' + self.CLASS + '-btn-undo-all');
            self.#deleteVertexBtn = self.querySelector('.' + self.CLASS + '-btn-del-vertex');
            self.#textBtn = self.querySelector('.' + self.CLASS + '-btn-text');
            self.#joinBtn = self.querySelector('.' + self.CLASS + '-btn-join');
            self.#splitBtn = self.querySelector('.' + self.CLASS + '-btn-split');
            self.#deletedFeatureList = self.querySelector('.' + self.CLASS + '-deleted-feature-list');
            self.#textInput = self.querySelector('input.' + self.CLASS + '-txt');
            self.#labelSection = self.querySelector('.' + self.CLASS + '-style-label');
            self.#fontColorPicker = self.querySelector(self.#classSelector + '-fnt-c');
            self.#fontSizeSelector = self.querySelector('.' + self.CLASS + '-fnt-s');

            self.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
            self.controller = new Controller(self.model, new Observer(self));
            self.updateModel();
        });
    }

    addUIEventListeners() {
        this.#selectBtn.addEventListener(Consts.event.CLICK, (e) => {
            if (!e.target.disabled) {
                if (this.isActive) {
                    if (this.mode !== Modify.mode.VERTEX_DELETE) {
                        this.deactivate();
                    }
                    else {
                        this.setMode(Modify.mode.SELECT, true);
                    }
                }
                else {
                    this.activate();
                }
            }
        }, { passive: true });

        this.#deleteBtn.addEventListener(Consts.event.CLICK, () => {
            this.onDeleteButtonClick();
        }, { passive: true });

        this.#showDeletedBtn.addEventListener(Consts.event.CLICK, () => {
            this.onShowDeletedButtonClick();
        }, { passive: true });

        this.#undoBtn.addEventListener(Consts.event.CLICK, () => {
            let selectedFeatures = this.getSelectedFeatures();
            if (selectedFeatures.length > 0) {
                selectedFeatures.forEach((feature) => this.history.undo(feature));
            }
            else {
                selectedFeatures = Array.from(this.#deletedFeatures.values());
                selectedFeatures.forEach((feature) => this.#recoverDeletedFeature(feature));
            }
            this.setSelectedFeatures(selectedFeatures);
            this.#setFeatureSelectedState(selectedFeatures);
        }, { passive: true });

        this.#redoBtn.addEventListener(Consts.event.CLICK, () => {
            const selectedFeatures = this.getSelectedFeatures();
            selectedFeatures.forEach((feature) => this.history.redo(feature));
            //const selectedFeaturesAfterRedo = this.getSelectedFeatures();
            //if (selectedFeaturesAfterRedo.length !== selectedFeatures.length) {
            //    selectedFeatures.forEach((feature) => this.#deletedFeatures.push(feature));
            //}
            //this.#setFeatureSelectedState(selectedFeaturesAfterRedo);
        }, { passive: true });

        this.#undoAllBtn.addEventListener(Consts.event.CLICK, () => {
            let selectedFeatures = this.getSelectedFeatures();
            if (selectedFeatures.length > 0) {
                selectedFeatures.forEach((feature) => this.history.undoAll(feature));
            }
            else {
                selectedFeatures = Array.from(this.#deletedFeatures.values());
                selectedFeatures.slice().forEach((feature) => this.history.undoAll(feature));
            }
            this.setSelectedFeatures(selectedFeatures);
            this.#setFeatureSelectedState(selectedFeatures);
        }, { passive: true });

        this.#deleteVertexBtn.addEventListener(Consts.event.CLICK, () => {
            const newMode = this.mode === Modify.mode.VERTEX_DELETE ?
                Modify.mode.SELECT : Modify.mode.VERTEX_DELETE;
            this.setMode(newMode, true);
        }, { passive: true });

        this.#textBtn.addEventListener(Consts.event.CLICK, () => {
            this.setTextMode(!this.textActive);
        }, { passive: true });
        this.#textInput.addEventListener('input', (e) => {
            this.labelFeatures(e.target.value);
        });

        this.#fontColorPicker.addEventListener(Consts.event.CHANGE, (e) => {
            this.setFontColor(e.target.value);
        });

        this.#fontSizeSelector.addEventListener(Consts.event.CHANGE, (e) => {
            this.setFontSize(e.target.value);
        });

        this.getStyler().then((styler) => styler.addEventListener(Consts.event.STYLECHANGE, (_e) => {
            this.getSelectedFeatures().forEach((f) => {
                const newStyle = Object.assign({}, f.getStyle(), styler.getStyle());
                this.history.setStyle(f, newStyle);
            });
        }));
    }

    activate() {
        this.#selectBtn.active = true;
        super.activate.call(this);
        this.wrap.activate(this.mode);
        // Cerramos los popups de las features de la capa
        this.getLayer().then((layer) => {
            layer?.features.forEach((feature) => feature.closeInfoControls());
        });
        this.#setVertexDeleteModeState(this.getSelectedFeatures());
    }

    deactivate() {
        if (this.#selectBtn) {
            this.#setFeatureSelectedState([]);
            this.#selectBtn.active = false;
            if (this.layer) {
                this.unselectFeatures(this.getSelectedFeatures());
            }
        }

        super.deactivate.call(this);

        if (this.wrap) {
            this.wrap.deactivate();
        }
        
        this.mode = Modify.mode.SELECT;
    }

    clear() {
        const self = this;
        if (self.layer) {
            self.layer.clearFeatures();
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
        this.getSelectedFeatures()
            .filter(((f) => !features.includes(f)))
            .forEach((f) => f.toggleSelectedStyle(false));
        features.forEach((f) => f.toggleSelectedStyle(true));
        const result = this.wrap.setSelectedFeatures(features);
        this.#setFeatureSelectedState(features);
        this.displayLabelText();
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

    setFeatureCoordinates(feature, coordinates, oldCoordinates) {
        this.history.setCoordinates(feature, coordinates, oldCoordinates);
        return this;
    }

    onDeleteButtonClick() {
        const self = this;
        const features = self.getSelectedFeatures();
        self.wrap.unselectFeatures(features);
        features.forEach(async function (feature) {
            await self.#addDeletedItemToList(feature, feature.layer);
            self.history.removeFeature(feature);
            self.trigger(Consts.event.FEATUREREMOVE, { feature: feature });
        });
        return self;
    }

    onShowDeletedButtonClick() {
        this.#showDeletedBtn.active = !this.#showDeletedBtn.active;
        this.#deletedFeatureList.parentElement.classList.toggle(Consts.classes.HIDDEN, !this.#showDeletedBtn.active);
        if (!this.#showDeletedBtn.active) {
            this.#deletedFeatureList.querySelectorAll('li').forEach((li) => li.classList.remove(Consts.classes.CHECKED));
            this.getDeletedFeaturesLayer().then((layer) => layer.clearFeatures());
        }
        return this;
    }

    onViewDeletedButtonClick(e) {
        this.getDeletedFeaturesLayer().then((layer) => {
            const li = e.target.closest('li');
            const deletedFeatureId = li.dataset.deletedFeatureId;
            const isChecked = li.classList.toggle(Consts.classes.CHECKED);
            if (isChecked) {
                layer.addFeature(this.#deletedFeatures.get(deletedFeatureId).clone()).then((feature) => {
                    li.dataset.featureId = feature.getId();
                });
            }
            else {
                const featureId = li.dataset.featureId;
                const feature = layer.features.find((f) => f.getId() === featureId);
                if (feature) layer.removeFeature(feature);
            }
        });
    }

    onRecoverButtonClick(e) {
        const li = e.target.closest('li');
        const deletedFeatureId = li.dataset.deletedFeatureId;
        if (deletedFeatureId) {
            this.setSelectedFeatures([]);
            this.#recoverDeletedFeature(this.#deletedFeatures.get(deletedFeatureId));
        }
        return self;
    }

    async #addDeletedItemToList(feature, layer) {
        let deletedFeatureId;
        if (!Array.from(this.#deletedFeatures.values()).includes(feature)) {
            deletedFeatureId = this.getUID();
            this.#deletedFeatures.set(deletedFeatureId, feature);
        }
        const html = await this.getRenderedHtml(this.CLASS + '-deleted', {
            path: layer.title + this.LAYER_FEATURE_SEPARATOR + feature.id,
        });
        this.#deletedFeatureList.insertAdjacentHTML('afterbegin', html);
        const listItem = this.#deletedFeatureList.querySelector('.' + this.CLASS + '-deleted-item');
        listItem.dataset.deletedFeatureId = deletedFeatureId;
        listItem.querySelector('.' + this.CLASS + '-deleted-btn-view')
            .addEventListener(Consts.event.CLICK, (e) => this.onViewDeletedButtonClick(e), { passive: true });
        listItem.querySelector('.' + this.CLASS + '-deleted-btn-recover')
            .addEventListener(Consts.event.CLICK, (e) => this.onRecoverButtonClick(e), { passive: true });
        this.controller.add(listItem);
        this.updateModel();
    }

    #removeDeletedItemFromList(feature) {
        this.getDeletedFeaturesLayer().then((layer) => {
            const entry = Array.from(this.#deletedFeatures.entries()).find(([, value]) => value === feature);
            if (entry) {
                const deletedFeatureId = entry[0];
                const li = this.#deletedFeatureList.querySelector(`li[data-deleted-feature-id="${deletedFeatureId}"]`);
                if (li) {
                    const clone = layer.features.find((f) => f.id === li.dataset.featureId);
                    if (clone) layer.removeFeature(clone);
                    this.#deletedFeatures.delete(deletedFeatureId);
                    li.remove();
                }
            }
        });
    }

    #recoverDeletedFeature(feature) {
        if (Array.from(this.#deletedFeatures.values()).includes(feature)) {
            this.history.undo(feature);
        }
        return self;
    }

    #flushDeletedFeatures() {
        this.#deletedFeatures.clear();
        this.getDeletedFeaturesLayer().then((layer) => layer.clearFeatures());
        this.#deletedFeatureList.querySelectorAll('li').forEach((li) => li.remove());
    }

    async getDeletedFeaturesLayer() {
        const self = this;
        if (!this.#deletedFeaturesLayer) {
            this.#deletedFeaturesLayer = await this.map.addLayer({
                id: this.getUID(),
                type: Consts.layerType.VECTOR,
                title: this.getLocaleString('deletedFeatures'),
                stealth: true,
            });
        }
        return self.#deletedFeaturesLayer;
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
        const style = feature.getStyle() ?? {};
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
            self.#textBtn.active = true;
            self.#labelSection.classList.remove(Consts.classes.HIDDEN);
        }
        else {
            self.#textBtn.active = false;
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
            const style = feature.getStyle() ?? {};
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
                const style = feature.getStyle() ?? {};
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
            const style = feature.getStyle() ?? {};
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
            const style = features[0].getStyle() ?? {};
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

    updateModel() {      
        for (const key of Object.keys(this.model)) {
            if (!key.startsWith("#")) {
                this.model[key] = this.getLocaleString(key);
            }
        }
    }

}

Modify.prototype.CLASS = 'tc-ctl-mod';
customElements.get(elementName) || customElements.define(elementName, Modify);
TC.control.Modify = Modify;
export default Modify;
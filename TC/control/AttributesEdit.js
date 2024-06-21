import WebComponentControl from './WebComponentControl';
import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Modify from './Modify';
import Draw from './Draw';
import Toggle from '../../SITNA/ui/Toggle';

TC.control = TC.control || {};

const elementName = 'sitna-attributes-edit';

class AttributesEdit extends WebComponentControl {

    #feature;
    #attributeData = [];
    #clientControl;
    #onFeatureSelect;
    #onDrawEnd;
    #onDrawStart;
    #onDrawCancel;
    #selectors;
    attributeProposal;

    constructor() {
        super(...arguments);
        const self = this;

        self.#selectors = {
            ATTRIBUTE_VALUE: 'td input,td select,td sitna-toggle',
            NEW_ATTRIBUTE_KEY: `input.${AttributesEdit.prototype.CLASS}-new-key`,
            NEW_ATTRIBUTE_VALUE: `td.${AttributesEdit.prototype.CLASS}-new-value input,td.${AttributesEdit.prototype.CLASS}-new-value sitna-toggle`,
            TYPE_SELECT: `select.${AttributesEdit.prototype.CLASS}-type`,
            ATTRIBUTE_REMOVE: `td sitna-button.${AttributesEdit.prototype.CLASS}-remove`,
            NUMBER_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="number"]`,
            BOOLEAN_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value sitna-toggle`,
            DATE_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="date"]`,
            TIME_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="time"]`,
            DATETIME_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="datetime-local"]`,
            TEXT_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="text"]`
        }
    }

    get sealed() {
        return this.hasAttribute('sealed');
    }

    set sealed(value) {
        this.toggleAttribute('sealed', !!value);
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = await import('../templates/tc-ctl-attr-edit.mjs');
        const rowTemplatePromise = await import('../templates/tc-ctl-attr-edit-row.mjs');
        const newRowTemplatePromise = await import('../templates/tc-ctl-attr-edit-new.mjs');
        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-row'] = (await rowTemplatePromise).default;
        template[self.CLASS + '-new'] = (await newRowTemplatePromise).default;
        self.template = template;
    }

    async render(callback) {
        const self = this;

        const renderObject = {
            attributeProposal: self.attributeProposal
        };

        if (self.#feature) {
            let featureData = self.#feature.getData();
            const layer = self.#feature.layer;
            self.#attributeData = [];
            if (layer) {
                let layerAttributeMetadata;
                try {
                    const featureTypeMetadata = await layer.getFeatureTypeMetadata();
                    layerAttributeMetadata = featureTypeMetadata.attributes;
                    renderObject.sealed = layer.type === Consts.layerType.WFS;
                }
                catch (_e) { }
                const allOtherFeatures = layer.features.filter(f => f !== self.#feature);
                if (!layerAttributeMetadata && !Object.keys(featureData).length) {
                    // Inferimos estructura de atributos de otras entidades del mismo tipo
                    layerAttributeMetadata = [];
                    const getCommonAttributeData = function (features) {
                        return features
                            .map(f => {
                                const result = [];
                                const featureData = f.getData();
                                for (var key in featureData) {
                                    const value = featureData[key];
                                    const attributeData = {
                                        name: key
                                    }
                                    if (value !== null) {
                                        attributeData.value = value;
                                        attributeData.type = typeof value;
                                    }
                                    result.push(attributeData);
                                }
                                return result;
                            })
                            .reduce((attributeData, currentAttributeData, featureIndex) => {
                                if (featureIndex > 0) {
                                    let newAttributeData = null;
                                    if (attributeData === null) {
                                        return null;
                                    }
                                    currentAttributeData.forEach((attr, idx) => {
                                        const prevAttr = attributeData[idx];
                                        if (attr.name === prevAttr?.name) {
                                            const newAttr = { name: attr.name };
                                            if (Object.prototype.hasOwnProperty.call(attr, 'type') && !Object.prototype.hasOwnProperty.call(prevAttr, 'type')) {
                                                newAttr.type = attr.type;
                                            }
                                            else if (attr.type === prevAttr.type || !Object.prototype.hasOwnProperty.call(attr, 'type')) {
                                                newAttr.type = prevAttr.type;
                                            }
                                            newAttributeData ??= [];
                                            newAttributeData.push(newAttr);
                                            if (Object.prototype.hasOwnProperty.call(prevAttr, 'value')) {
                                                if (attr.value === prevAttr.value) {
                                                    newAttr.value = attr.value;
                                                }
                                            }
                                        }
                                    });
                                    return newAttributeData;
                                }
                                return currentAttributeData;
                            }, null);
                    };
                    // Para obtener la estructura de atributos primero miramos en todas las entidades de la capa
                    // Si no hay estructura común miramos solamente en las entidades de la misma geometría
                    let featureAttributeData = getCommonAttributeData(allOtherFeatures);
                    if (!featureAttributeData) {
                        featureAttributeData = getCommonAttributeData(allOtherFeatures.filter(f => f instanceof self.#feature.constructor));
                    }
                    if (featureAttributeData) {
                        featureAttributeData.forEach(data => {
                            layerAttributeMetadata.push({ ...data });
                        });
                    }
                }
                // Recogemos los atributos no geométricos y definimos la geometría
                const newData = {};
                for (let attr of layerAttributeMetadata) {
                    if (!self.#isGeometryType(attr.type) && !attr.isId) {
                        // Añadimos los atributos que no tenga ya la entidad
                        if (!Object.prototype.hasOwnProperty.call(featureData, attr.name)) {
                            let value = null;
                            if (Object.prototype.hasOwnProperty.call(attr, 'value')) {
                                value = attr.value;
                            }
                            newData[attr.name] = value;
                        }
                    }
                }
                if (Object.keys(newData).length) {
                    self.#feature.setData(newData);
                    featureData = self.#feature.getData();
                }
                for (let attr of layerAttributeMetadata) {
                    if (!self.#isGeometryType(attr.type)) {
                        self.#attributeData.push({
                            name: attr.name,
                            type: attr.type,
                            value: featureData[attr.name]
                        });
                    }
                }
            }

            if (!self.#attributeData.length) {
                for (var key in featureData) {
                    self.#attributeData.push({
                        name: key,
                        value: featureData[key]
                    });
                }
            }
            renderObject.data = self.#attributeData;
            renderObject.sealed ??= self.sealed;
        }

        await self.renderData(renderObject, function () {
            self.#setAttributeElements();
            self.addUIEventListeners();

            if (self.#feature) {
                self.show();
            }
            else {
                self.hide();
            }

            if (Util.isFunction(callback)) {
                callback();
            }
        });
    }

    async addAttributeElement({ name, type, value }) {
        if (this.#feature) {
            const sealed = this.#feature.layer.type === Consts.layerType.WFS;
            const html = await this.getRenderedHtml(this.CLASS + '-row', { name, type, value, sealed });
            const buffer = document.createElement('tbody');
            buffer.innerHTML = html;
            this.#addUIEventListeners(buffer);
            const anchor = this.querySelector('table tr:last-of-type');
            anchor.insertAdjacentElement('afterend', buffer.firstElementChild);
            this.#setAttributeElements();
        }
    }

    removeAttributeElement(name) {
        this.querySelector(`tr[data-attribute-name="${name}"]`)?.remove();
        return this;
    }

    #setAttributeElements() {
        this.newAttributeElement = this.querySelector(`.${this.CLASS}-new`);
        this.attributeProposalElement = this.querySelector(`.${this.CLASS}-proposal`);
    }

    addUIEventListeners() {
        return this.#addUIEventListeners(this);
    }

    #addUIEventListeners(root) {
        const self = this;
        const onInputChange = function (_e) {
            if (self.#feature) {
                const key = this.getAttribute('name');
                if (key) {
                    const value = this instanceof Toggle || this.getAttribute('type') === 'checkbox' ?
                        this.checked : this.value;
                    self.setFeatureAttribute(key, value);
                }
            }
        };
        root.querySelectorAll(self.#selectors.ATTRIBUTE_VALUE).forEach(elm => {
            elm.addEventListener('change', onInputChange);
        });
        const onRemoveButtonClick = function (_e) {
            if (self.#feature) {
                const key = this.dataset.key;
                if (key) {
                    if (key === self.attributeProposal) {
                        self.removeAttributeElement(key);
                        self.attributeProposal = null;
                    }
                    else {
                        TC.confirm(self.getLocaleString('removeAttribute.confirm', { name: key }), () => {
                            const featureData = self.#feature.getData();
                            delete featureData[key];
                            self.#feature.unsetData(key);
                            self.removeAttributeElement(key);
                            self.#triggerFeatureModify();
                        });
                    }
                }
            }
        };
        root.querySelectorAll(self.#selectors.ATTRIBUTE_REMOVE).forEach(elm => {
            elm.addEventListener('click', onRemoveButtonClick);
        });
        root.querySelector(self.#selectors.NEW_ATTRIBUTE_KEY)?.addEventListener('change', function (_e) {
            if (self.#feature) {
                if (Object.keys(self.#feature.getData()).includes(this.value)) {
                    self.map.toast(self.getLocaleString('attributeAlreadyExists.warning', this.value), { type: Consts.msgType.WARNING });
                    this.value = '';
                    return;
                }
                self.attributeProposal = this.value;
                self.newAttributeElement.remove();
                self.newAttributeElement = null;
                self.addAttributeElement({ name: this.value });
            }
        });

        root.querySelector(self.#selectors.TYPE_SELECT)?.addEventListener('change', async function (_e) {
            self.attributeProposal = null;
            self.attributeProposalElement.remove();
            self.attributeProposalElement = null;
            await self.addAttributeElement({ name: this.dataset.attributeName, type: this.value });
            await self.addAttributeElement({});
        });
        const onNewValueChange = function (_e) {
            if (self.#feature) {
                let newData = {};
                newData[this.name] = this.value;
                newData = { ...self.#feature.getData(), ...newData };
                self.#feature.setData(newData);
                self.#triggerFeatureModify();
                const rowObject = { name: this.name, value: this.value };
                if (this.tagName === 'SITNA-TOGGLE') {
                    rowObject.type = 'boolean';
                }
                else {
                    const inputType = this.getAttribute('type');
                    switch (inputType) {
                        case 'datetime-local':
                            rowObject.type = 'datetime';
                            break;
                        case 'number':
                            rowObject.type = 'float';
                            break;
                        default:
                            rowObject.type = inputType;
                            break;
                    }
                }
                self.addAttributeElement(rowObject);
            }
        }
        root.querySelectorAll(self.#selectors.NEW_ATTRIBUTE_VALUE).forEach((input) => input.addEventListener('change', onNewValueChange));
    }

    async register(map) {
        const self = this;

        await super.register.call(self, map);

        self.containerControl?.on(Consts.event.FEATURESSELECT + ' ' + Consts.event.FEATURESUNSELECT, function (_e) {
            const features = self.containerControl.getSelectedFeatures();
            self.feature = features[0];
        });

        map
            .on(Consts.event.FEATUREREMOVE, function (e) {
                if (e.feature === self.feature) {
                    self.feature = null;
                }
            })
            .on(Consts.event.FEATURESCLEAR, function (e) {
                if (e.layer === self.feature?.layer) {
                    self.feature = null;
                }
            });
        return self;
    }

    get feature() {
        return this.#feature;
    }

    set feature(value) {
        if (this.#feature !== value) {
            this.#feature = value;
            this.render();
        }
    }

    get clientControl() {
        return this.#clientControl;
    }

    set clientControl(value) {
        const self = this;
        if (self.#clientControl) {
            if (self.#clientControl instanceof Modify) {
                self.#clientControl.off(Consts.event.FEATURESSELECT + ' ' + Consts.event.FEATURESUNSELECT, self.#onFeatureSelect);
            }
            else if (self.#clientControl instanceof Draw) {
                self.#clientControl.off(Consts.event.DRAWEND, self.#onDrawEnd);
                self.#clientControl.off(Consts.event.DRAWSTART, self.#onDrawStart);
                self.#clientControl.off(Consts.event.DRAWCANCEL, self.#onDrawCancel);
            }
        }
        self.#clientControl = value;
        if (self.#clientControl instanceof Modify) {
            self.#onFeatureSelect = function (_e) {
                self.feature = self.#clientControl.getSelectedFeatures()[0];
            };
            self.#clientControl.on(Consts.event.FEATURESSELECT + ' ' + Consts.event.FEATURESUNSELECT, self.#onFeatureSelect);
            self.#onFeatureSelect();
        }
        else if (self.#clientControl instanceof Draw) {
            self.#onDrawEnd = function (e) {
                setTimeout(() => {
                    self.feature = e.feature;
                }, 100);
            };
            self.#clientControl.on(Consts.event.DRAWEND, self.#onDrawEnd);
            self.#onDrawStart = self.#onDrawCancel = function (_e) {
                if (this.mode !== Consts.geom.POINT) {
                    self.feature = null;
                }
            };
            self.#clientControl.on(Consts.event.DRAWSTART, self.#onDrawStart);
            self.#clientControl.on(Consts.event.DRAWCANCEL, self.#onDrawCancel);
            self.#onDrawEnd({});
        }
    }

    setFeatureAttribute(name, value) {
        const self = this;
        if (self.#feature) {
            let newData = {};
            newData[name] = value;
            const attributeData = self.#attributeData.find(elm => elm.name === name);
            if (attributeData) {
                let parsedValue;
                switch (attributeData.type) {
                    case 'int':
                    case 'integer':
                    case 'byte':
                    case 'long':
                    case 'negativeInteger':
                    case 'nonNegativeInteger':
                    case 'nonPositiveInteger':
                    case 'positiveInteger':
                    case 'short':
                    case 'unsignedLong':
                    case 'unsignedInt':
                    case 'unsignedShort':
                    case 'unsignedByte':
                        parsedValue = parseInt(value);
                        if (!Number.isNaN(parsedValue)) {
                            newData[name] = parsedValue;
                        }
                        break;
                    case 'double':
                    case 'float':
                    case 'decimal':
                        parsedValue = parseFloat(value);
                        if (!Number.isNaN(parsedValue)) {
                            newData[name] = parsedValue;
                        }
                        break;
                    case 'date':
                        // Obtiene el valor yyyy-mm-dd
                        if (value) {
                            newData[name] = new Date(value).toISOString().substr(0, 10);
                        }
                        else {
                            newData[name] = value;
                        }
                        break;
                    case 'dateTime':
                        // Obtiene el valor yyyy-mm-ddThh:mm:ss
                        if (value) {
                            newData[name] = new Date(value).toISOString().substr(0, 19);
                        }
                        else {
                            newData[name] = value;
                        }
                        break;
                    case 'boolean':
                        newData[name] = !!value;
                        break;
                    case undefined:
                        break;
                    default:
                        newData[name] = value;
                        break;
                }
            }

            newData = Object.assign({}, self.#feature.getData(), newData);
            self.#feature.setData(newData);
            self.#triggerFeatureModify();
        }
    }

    #triggerFeatureModify() {
        const self = this;
        self.containerControl?.trigger(Consts.event.FEATUREMODIFY, {
            feature: self.#feature,
            layer: self.#feature.layer
        });
    }

    #isGeometryType(type) {
        switch (type) {
            case Consts.geom.POINT:
            case Consts.geom.MULTIPOINT:
            case Consts.geom.POLYLINE:
            case Consts.geom.MULTIPOLYLINE:
            case Consts.geom.POLYGON:
            case Consts.geom.MULTIPOLYGON:
            case Consts.geom.CIRCLE:
            case Consts.geom.RECTANGLE:
            case 'gml:LinearRingPropertyType':
            case 'gml:PolygonPropertyType':
            case 'LinearRingPropertyType':
            case 'PolygonPropertyType':
            case 'gml:MultiPolygonPropertyType':
            case 'gml:MultiSurfacePropertyType':
            case 'MultiPolygonPropertyType':
            case 'MultiSurfacePropertyType':
            case 'gml:LineStringPropertyType':
            case 'gml:CurvePropertyType':
            case 'LineStringPropertyType':
            case 'CurvePropertyType':
            case 'gml:MultiLineStringPropertyType':
            case 'gml:MultiCurvePropertyType':
            case 'MultiLineStringPropertyType':
            case 'MultiCurvePropertyType':
            case 'gml:PointPropertyType':
            case 'gml:MultiPointPropertyType':
            case 'PointPropertyType':
            case 'MultiPointPropertyType':
            case 'gml:BoxPropertyType':
            case 'BoxPropertyType':
            case 'gml:GeometryCollectionPropertyType':
            case 'gml:GeometryAssociationType':
            case 'gml:GeometryPropertyType':
            case 'GeometryCollectionPropertyType':
            case 'GeometryAssociationType':
            case 'GeometryPropertyType':
                return true;
            default:
                return false;
        }
    }
}

AttributesEdit.prototype.CLASS = 'tc-ctl-attr-edit';
customElements.get(elementName) || customElements.define(elementName, AttributesEdit);
TC.control.AttributesEdit = AttributesEdit;
export default AttributesEdit;
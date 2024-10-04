import WebComponentControl from './WebComponentControl';
import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Modify from './Modify';
import Draw from './Draw';
import Toggle from '../../SITNA/ui/Toggle';
import Feature from '../../SITNA/feature/Feature';

TC.control = TC.control || {};

const elementName = 'sitna-attributes-edit';

const getDataType = (value) => {
    if (value === null) {
        return;
    }
    let type = typeof value;
    if (type === 'number') {
        type = Consts.dataType.FLOAT;
    }
    return type;
};

const genericEquals = (n1, n2) => n1 === n2;
const byName = function (name, equalsPredicate) {
    const equals = equalsPredicate ?? genericEquals;
    return function (obj) {
        return equals(obj.name, name);
    };
};

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

    static PROPOSAL = 'proposal';

    constructor() {
        super(...arguments);

        this.#selectors = {
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
        const mainTemplatePromise = import('../templates/tc-ctl-attr-edit.mjs');
        const tableTemplatePromise = import('../templates/tc-ctl-attr-edit-table.mjs');
        const rowTemplatePromise = import('../templates/tc-ctl-attr-edit-row.mjs');
        const newRowTemplatePromise = import('../templates/tc-ctl-attr-edit-new.mjs');
        const template = {};
        template[this.CLASS] = (await mainTemplatePromise).default;
        template[this.CLASS + '-table'] = (await tableTemplatePromise).default;
        template[this.CLASS + '-row'] = (await rowTemplatePromise).default;
        template[this.CLASS + '-new'] = (await newRowTemplatePromise).default;
        this.template = template;
    }

    async render(callback) {
        const renderObject = {
            attributeProposal: this.attributeProposal
        };

        if (this.#feature) {
            let featureData = this.#feature.getData();
            const layer = this.#feature.layer;
            this.#attributeData = [];

            const getFeatureMetadata = function (featureData, layerMetadata, equalsPredicate) {
                const result = [];
                if (!featureData) {
                    return layerMetadata;
                }
                for (var key in featureData) {
                    const value = featureData[key];
                    // Algunas entidades pueden tener otras entidades como propiedades
                    // Las saltamos para evitar bucles infinitos
                    if (value instanceof Feature) {
                        continue;
                    }
                    const attributeData = {
                        name: key
                    }
                    let layerMetadataItem;
                    if (Array.isArray(layerMetadata)) {
                        layerMetadataItem = layerMetadata?.find(byName(key, equalsPredicate));
                    }
                    attributeData.type = layerMetadataItem?.type ?? getDataType(value);
                    if (attributeData.type === 'object') {
                        attributeData.value = getFeatureMetadata(value, layerMetadataItem?.value, equalsPredicate);
                    }
                    else {
                        attributeData.value = value;
                    }
                    result.push(attributeData);
                }
                return result;
            };

            const mergeFeatureMetadata = function (target, source, greedy, equalsPredicate) {
                let result = null;
                if (Array.isArray(target) && Array.isArray(source)) {
                    for (const targetItem of target) {
                        const sourceItem = source.find(byName(targetItem.name, equalsPredicate));
                        if (sourceItem) {
                            const newItem = { name: targetItem.name };
                            if (Object.prototype.hasOwnProperty.call(targetItem, 'type') && !Object.prototype.hasOwnProperty.call(sourceItem, 'type')) {
                                newItem.type = targetItem.type;
                            }
                            else if (targetItem.type === sourceItem.type || !Object.prototype.hasOwnProperty.call(targetItem, 'type')) {
                                newItem.type = sourceItem.type;
                            }
                            newItem.value = mergeFeatureMetadata(targetItem.value, sourceItem.value, false, equalsPredicate);
                            if (newItem.value === null) {
                                if (sourceItem.value === targetItem.value) {
                                    newItem.value = targetItem.value;
                                }
                                else {
                                    if (greedy && targetItem.value === undefined) {
                                        newItem.value = sourceItem.value;
                                    }
                                    else {
                                        newItem.value = undefined;
                                    }
                                }
                            }
                            result ??= [];
                            result.push(newItem);
                        }
                    }
                }
                return result;
            };

            const getDataFromMetadata = function (metadata) {
                if (!Array.isArray(metadata)) {
                    return metadata;
                }
                const result = {};
                for (const item of metadata) {
                    let value;
                    if (item.type === 'object' || !item.type && Array.isArray(item.value)) {
                        value = getDataFromMetadata(item.value);
                    }
                    else {
                        value = item.value;
                    }
                    // No consideramos los atributos XML, que son opcionales por defecto
                    if (item.name
                        && !item.optional) {
                        result[item.name] = value;
                    }
                }
                return result;
            }

            let layerAttributeMetadata = [];
            let geometriesMetadata;
            let featureTypeMetadata;
            if (layer) {
                layerAttributeMetadata = [];
                try {
                    featureTypeMetadata = await layer.getFeatureTypeMetadata();
                    layerAttributeMetadata = featureTypeMetadata.attributes;
                    geometriesMetadata = featureTypeMetadata.geometries;
                    renderObject.sealed = layer.type === Consts.layerType.WFS;
                }
                catch (_e) { }

                const featuresToCheck = Object.keys(featureData).length ? layer.features : layer.features.filter((f) => f !== this.#feature);
                // Inferimos estructura de atributos de otras entidades del mismo tipo
                const getCommonAttributeData = function (features) {
                    return features
                        .map((f) => f.getData())
                        .map(getFeatureMetadata)
                        .reduce((accAttributeMetadata, currentAttributeMetadata, featureIndex) => {
                            if (featureIndex > 0) {
                                if (accAttributeMetadata === null) {
                                    return null;
                                }
                                return mergeFeatureMetadata(accAttributeMetadata, currentAttributeMetadata);
                            }
                            return currentAttributeMetadata;
                        }, null);
                };
                // Para obtener la estructura de atributos primero miramos en todas las entidades de la capa
                // Si no hay estructura común miramos solamente en las entidades de la misma geometría
                let featureAttributeData = getCommonAttributeData(featuresToCheck);
                if (!featureAttributeData) {
                    featureAttributeData = getCommonAttributeData(featuresToCheck.filter(f => f instanceof this.#feature.constructor));
                }
                if (featureAttributeData) {
                    if (layerAttributeMetadata.length) {
                        const mergeAttributes = function (layerAttributes, featureAttributes) {
                            if (featureAttributes) {
                                for (const featureAttribute of featureAttributes) {
                                    const layerAttribute = layerAttributes.find(byName(featureAttribute.name, featureTypeMetadata.equals));
                                    if (layerAttribute) {
                                        layerAttribute.name = featureAttribute.name;
                                        layerAttribute.optional = false;
                                        if (layerAttribute.type === 'object') {
                                            mergeAttributes(layerAttribute.value, featureAttributes.value);
                                        }
                                        else if (featureAttribute.value) {
                                            layerAttribute.value = featureAttribute.value;
                                        }
                                    }
                                }
                            }
                        };
                        mergeAttributes(layerAttributeMetadata, featureAttributeData);
                    }
                    else {
                        featureAttributeData.forEach(data => {
                            layerAttributeMetadata.push({ ...data });
                        });
                    }
                }

                const newData = {};
                for (let attr of layerAttributeMetadata) {
                    if (!attr.isId && !attr.optional) {
                        // Añadimos los atributos que no tenga ya la entidad
                        if (attr.name) {
                            const featureAttrEntry = Object.entries(featureData).find(([key]) => {
                                const equals = featureTypeMetadata?.equals ?? genericEquals;
                                return equals(key, attr.name);
                            });
                            if (!featureAttrEntry) {
                                let value = null;
                                if (Object.prototype.hasOwnProperty.call(attr, 'value')) {
                                    value = getDataFromMetadata(attr.value);
                                }
                                newData[attr.name] = value;
                            }
                        }
                    }
                }
                if (Object.keys(newData).length) {
                    this.#feature.setData(newData);
                    featureData = this.#feature.getData();
                }

                // Quitamos los atributos geométricos
                if (geometriesMetadata) {
                    for (const geomMetadata of geometriesMetadata) {
                        const path = Array.isArray(geomMetadata.name) ? geomMetadata.name : [geomMetadata.name];
                        let attributes = featureData;
                        for (let i = 0; i < path.length - 1; i++) {
                            attributes = attributes[path[i]];
                        }
                        delete attributes[path[path.length - 1]];
                    }
                }

                this.#attributeData = mergeFeatureMetadata(
                    getFeatureMetadata(featureData, layerAttributeMetadata, featureTypeMetadata?.equals),
                    layerAttributeMetadata.filter((item) => !item.isId), true, featureTypeMetadata?.equals);
            }

            let attributeIndex = -1;
            for (var key in featureData) {
                const currentAttributeIndex = this.#attributeData.findIndex(byName(key));
                const attribute = this.#attributeData[currentAttributeIndex];
                if (attribute) {
                    attributeIndex = currentAttributeIndex;
                    if (attribute.type === 'object') {
                        attribute.value = getFeatureMetadata(featureData[key], layerAttributeMetadata.find(byName(key))?.value, featureTypeMetadata?.equals);
                    }
                    else {
                        attribute.value = featureData[key];
                    }
                }
                else {
                    const attributeValue = featureData[key];
                    const featureAttribute = {
                        name: key,
                        value: attributeValue
                    };
                    if (attributeValue && typeof attributeValue === 'object') {
                        featureAttribute.type = 'object';
                    }
                    this.#attributeData.splice(++attributeIndex, 0, featureAttribute);
                }
            }
            renderObject.value = this.#attributeData;
            renderObject.sealed ??= this.sealed;
        }

        await this.renderData(renderObject, () => {
            this.#setAttributeElements();
            this.addUIEventListeners();

            if (this.#feature) {
                this.show();
            }
            else {
                this.hide();
            }

            if (Util.isFunction(callback)) {
                callback();
            }
        });
    }

    async addAttributeElement({ name, type, value }) {
        if (this.#feature) {
            if (!name) {
                // Línea que espera un nuevo atributo. Comprobamos que no haya ya una.
                if (this.querySelector(this.CLASS + '-new')) {
                    return;
                }
            }
            const sealed = this.#feature.layer.type === Consts.layerType.WFS;
            const html = await this.getRenderedHtml(this.CLASS + '-row', { name, type, value, sealed });
            const buffer = document.createElement('tbody');
            buffer.innerHTML = html;
            this.#addUIEventListeners(buffer);
            const anchor = this.querySelector(`.${this.CLASS}-body > table > tbody > tr:last-of-type`);
            anchor.insertAdjacentElement('afterend', buffer.firstElementChild);
            this.#setAttributeElements();
        }
    }

    removeAttributeElement(name) {
        this.querySelectorAll(`.${this.CLASS}-body > table > tbody > tr[data-attribute-name="${name}"]`)
            .forEach((elm) => elm.remove());
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
                    const attributePath = [];
                    let elm = this;
                    do {
                        if (elm.dataset.attributeName) {
                            attributePath.unshift(elm.dataset.attributeName);
                        }
                        elm = elm.parentElement;
                    }
                    while (elm && !(elm instanceof AttributesEdit));

                    const inputType = this.getAttribute('type');
                    const value = this instanceof Toggle || inputType === 'checkbox' ?
                        this.checked : (inputType === 'number' ? this.valueAsNumber : this.value);
                    self.setFeatureAttribute(attributePath, value);
                }
            }
        };
        root.querySelectorAll(self.#selectors.ATTRIBUTE_VALUE).forEach(elm => {
            elm.addEventListener('change', onInputChange);
        });

        const onRemoveButtonClick = function (_e) {
            self.removeFeatureAttribute(this.dataset.key);
        };
        root.querySelectorAll(self.#selectors.ATTRIBUTE_REMOVE).forEach(elm => {
            elm.addEventListener('click', onRemoveButtonClick);
        });

        root.querySelector(self.#selectors.NEW_ATTRIBUTE_KEY)?.addEventListener('change', function (_e) {
            self.#setProposalState(this.value).catch((err) => self.map.toast(err.message, { type: Consts.msgType.WARNING }));
        });

        root.querySelector(self.#selectors.TYPE_SELECT)?.addEventListener('change', function (_e) {
            self.#acceptProposal(this.value).catch((err) => TC.error(err));
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
        if (this.#clientControl) {
            if (this.#clientControl instanceof Modify) {
                this.#clientControl.removeEventListener(Consts.event.FEATURESSELECT, this.#onFeatureSelect);
                this.#clientControl.removeEventListener(Consts.event.FEATURESUNSELECT, this.#onFeatureSelect);
            }
            else if (this.#clientControl instanceof Draw) {
                this.#clientControl.removeEventListener(Consts.event.DRAWEND, this.#onDrawEnd);
                this.#clientControl.removeEventListener(Consts.event.DRAWSTART, this.#onDrawStart);
                this.#clientControl.removeEventListener(Consts.event.DRAWCANCEL, this.#onDrawCancel);
            }
        }
        this.#clientControl = value;
        if (this.#clientControl instanceof Modify) {
            this.#onFeatureSelect = (_e) => {
                this.feature = this.clientControl.getSelectedFeatures()[0];
            };
            this.#clientControl.addEventListener(Consts.event.FEATURESSELECT, this.#onFeatureSelect);
            this.#clientControl.addEventListener(Consts.event.FEATURESUNSELECT, this.#onFeatureSelect);
            this.#onFeatureSelect();
        }
        else if (this.#clientControl instanceof Draw) {
            this.#onDrawEnd = (e) => {
                setTimeout(() => {
                    this.feature = e.detail?.feature;
                }, 100);
            };
            this.#clientControl.addEventListener(Consts.event.DRAWEND, this.#onDrawEnd);
            this.#onDrawStart = this.#onDrawCancel = (_e) => {
                if (this.mode !== Consts.geom.POINT) {
                    this.feature = null;
                }
            };
            this.#clientControl.addEventListener(Consts.event.DRAWSTART, this.#onDrawStart);
            this.#clientControl.addEventListener(Consts.event.DRAWCANCEL, this.#onDrawCancel);
            this.#onDrawEnd({});
        }
    }

    setFeatureAttribute(nameOrPath, value) {
        if (this.#feature) {
            const path = Array.isArray(nameOrPath) ? nameOrPath : [nameOrPath];
            const name = path[path.length - 1];
            let newData = Util.extend(true, {}, this.#feature.getData());
            let pointer = newData;
            for (let i = 0; i < path.length - 1; i++) {
                pointer = pointer[path[i]];
            }
            pointer[name] = value;
            const attributeData = this.#attributeData.find(byName(name));
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
                            pointer[name] = parsedValue;
                        }
                        break;
                    case 'double':
                    case 'float':
                    case 'decimal':
                        parsedValue = parseFloat(value);
                        if (!Number.isNaN(parsedValue)) {
                            pointer[name] = parsedValue;
                        }
                        break;
                    case 'date':
                        // Obtiene el valor yyyy-mm-dd
                        if (value) {
                            pointer[name] = new Date(value).toISOString().substr(0, 10);
                        }
                        else {
                            pointer[name] = value;
                        }
                        break;
                    case 'dateTime':
                        // Obtiene el valor yyyy-mm-ddThh:mm:ss
                        if (value) {
                            pointer[name] = new Date(value).toISOString().substr(0, 19);
                        }
                        else {
                            pointer[name] = value;
                        }
                        break;
                    case 'boolean':
                        pointer[name] = !!value;
                        break;
                    case undefined:
                        break;
                    default:
                        pointer[name] = value;
                        break;
                }
            }

            this.#feature.setData(newData);
            this.#triggerFeatureModify();
        }
    }

    removeFeatureAttribute(name) {
        if (this.#feature) {
            if (name) {
                if (name === this.attributeProposal) {
                    this.removeAttributeElement(name);
                    this.attributeProposal = null;
                    this.addAttributeElement({});
                }
                else {
                    const layer = this.#feature.layer;
                    layer.getFeatureTypeMetadata().then((featureTypeMetadata) => {
                        let warningMessage = 'removeAttribute.confirm';
                        let optionalAttribute = false;
                        if (featureTypeMetadata) {
                            if (featureTypeMetadata.attributes.find(byName(name))?.optional) {
                                optionalAttribute = true;
                            }
                            else {
                                warningMessage = 'deleteTableMetadata.warning';
                            }
                        }
                        TC.confirm(this.getLocaleString(warningMessage, { name }), () => {
                            let featuresToChange = [this.#feature];
                            if (!optionalAttribute) {
                                if (featureTypeMetadata) {
                                    const idx = featureTypeMetadata.attributes.findIndex(byName(name));
                                    if (idx >= 0) {
                                        featureTypeMetadata.attributes.splice(idx, 1);
                                        featuresToChange = layer.features;
                                    }
                                }
                            }
                            featuresToChange.forEach((f) => {
                                const featureData = f.getData();
                                delete featureData[name];
                                f.unsetData(name);
                            });
                            this.removeAttributeElement(name);
                            this.#triggerFeatureModify();
                        });

                    });
                }
            }
        }
    }

    #triggerFeatureModify() {
        this.containerControl?.trigger(Consts.event.FEATUREMODIFY, {
            feature: this.#feature,
            layer: this.#feature.layer
        });
    }

    async #setProposalState(attributeName) {
        if (this.#feature) {
            const proposalInput = this.querySelector(this.#selectors.NEW_ATTRIBUTE_KEY);
            let name = attributeName ?? proposalInput.value;
            proposalInput.value = name;
            const lcName = name.toLowerCase();
            const existingAttr = Object.keys(this.#feature.getData()).find((key) => key.toLowerCase() === lcName);
            if (existingAttr) {
                const errorMessage = this.getLocaleString('attributeAlreadyExists.warning', { name: existingAttr });
                proposalInput.value = '';
                throw Error(errorMessage);
            }
            const featureTypeMetadata = await this.#feature.layer.getFeatureTypeMetadata();
            if (!featureTypeMetadata || TC.confirm(this.getLocaleString('tableMetadataExists.warning'))) {
                this.attributeProposal = proposalInput.value;
                this.newAttributeElement.remove();
                this.newAttributeElement = null;
                this.addAttributeElement({ name: proposalInput.value, type: AttributesEdit.PROPOSAL });
            }
        }
    }

    async #acceptProposal(type) {
        if (type) {
            const name = this.attributeProposal;
            this.attributeProposal = null;
            this.attributeProposalElement.remove();
            this.attributeProposalElement = null;
            if (this.#feature) {
                const value = type === Consts.dataType.BOOLEAN ? false : null;
                const layer = this.#feature.layer;
                const featureTypeMetadata = await layer.getFeatureTypeMetadata();
                if (featureTypeMetadata) {
                    const lcName = name.toLowerCase();
                    const existingAttr = featureTypeMetadata.attributes.find((attr) => attr.name.toLowerCase() === lcName);
                    if (existingAttr) {
                        throw Error(this.getLocaleString('attributeAlreadyExists.warning', existingAttr));
                    }
                    featureTypeMetadata.attributes.push({ name, type, isId: false });
                    layer.setFeatureTypeMetadata(featureTypeMetadata);
                    layer
                        .features
                        .forEach((f) => {
                            f.setData({ [name]: value });
                        });
                }
                else {
                    this.#feature.setData({ [name]: value });
                }
            }
            await this.addAttributeElement({ name, type });
            await this.addAttributeElement({});
        }
    }
}

AttributesEdit.prototype.CLASS = 'tc-ctl-attr-edit';
customElements.get(elementName) || customElements.define(elementName, AttributesEdit);
TC.control.AttributesEdit = AttributesEdit;
export default AttributesEdit;
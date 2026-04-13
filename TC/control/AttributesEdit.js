import WebComponentControl from './WebComponentControl.js';
import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import Modify from './Modify.js';
import Draw from './Draw.js';
import Toggle from '../../SITNA/ui/Toggle.js';
import Feature from '../../SITNA/feature/Feature.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';
import FeatureHistory from '../tool/FeatureHistory.js';

TC.control = TC.control || {};

const elementName = 'sitna-attributes-edit';

const getDataTypeFromValue = (value) => {
    if (value === null) {
        return;
    }
    let type = typeof value;
    if (type === 'number') {
        type = Consts.dataType.FLOAT;
    }
    if (type === 'string') {
        // Revisamos casos especiales
        if (Date.parse(value) && !/EPSG/.test(value)) {
            if (/:/.test(value)) return Consts.dataType.DATETIME;
            if (/\//.test(value)) return Consts.dataType.DATE;
        }
        if (/^[0-2]\d:[0-5]\d$/.test(value)) {
            return Consts.dataType.TIME;
        }
        return Consts.dataType.STRING;
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

const findAttribute = (attributes, path, equalsPredicate) => {
    let collection = attributes;
    let attribute;
    for (const name of path) {
        attribute = collection?.find(byName(name, equalsPredicate));
        if (attribute) {
            collection = attribute.value;
        }
    }
    return attribute;
}
class AttributesEditModel {
    constructor() {
        this.featureAttributes = "";
        this.addItem = "";
        this.addNewAttribute = "";
        this.removeAttribute = "";
        this.selectDataType = "";
        this.text = "";
        this.number = "";
        this.integer = "";
        this.boolean = "";
        this.date = "";
        this.time = "";
        this.datetime = "";
    }
}

class AttributesEdit extends WebComponentControl {

    #feature;
    #attributeData = [];
    #clientControl;
    #clientControlAbortController;
    #selectors;
    #attributeProposals = new WeakMap();
    #newAttributes = new WeakMap();

    history;

    static PROPOSAL = 'proposal';

    constructor() {
        super(...arguments);

        this.#selectors = {
            BODY: `.${AttributesEdit.prototype.CLASS}-body`,
            ATTRIBUTE_VALUE: 'td input,td select,td sitna-toggle',
            NEW_ATTRIBUTE_KEY: `input.${AttributesEdit.prototype.CLASS}-new-key`,
            NEW_ATTRIBUTE_VALUE: `td.${AttributesEdit.prototype.CLASS}-new-value input,td.${AttributesEdit.prototype.CLASS}-new-value sitna-toggle`,
            TYPE_SELECT: `select.${AttributesEdit.prototype.CLASS}-type`,
            ATTRIBUTE_REMOVE: `td sitna-button.${AttributesEdit.prototype.CLASS}-remove`,
            ITEM_ADD: `td sitna-button.${AttributesEdit.prototype.CLASS}-add`,
            NUMBER_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="number"]`,
            BOOLEAN_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value sitna-toggle`,
            DATE_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="date"]`,
            TIME_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="time"]`,
            DATETIME_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="datetime-local"]`,
            TEXT_INPUT: `.${AttributesEdit.prototype.CLASS}-new-value input[type="text"]`,
            TOGGLE: `.${AttributesEdit.prototype.CLASS}-body > table sitna-toggle`
        }

        this.history = new FeatureHistory();

        this.autofill = this.options.autofill !== false;
        this.model = new AttributesEditModel();
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
        const renderObject = {};

        if (this.#feature) {
            renderObject.attributeProposal = this.#attributeProposals.get(this.#feature);
            const newAttributes = this.#newAttributes.get(this.#feature);
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
                    const newAttributeMetadata = newAttributes?.find((attr) => attr.name === key);
                    attributeData.type = layerMetadataItem?.type ??
                        newAttributeMetadata?.type ??
                        getDataTypeFromValue(value);
                    attributeData.optional = layerMetadataItem?.optional ?? newAttributeMetadata?.optional;
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
                        result ??= [];
                        if (sourceItem) {
                            const newItem = { name: targetItem.name };
                            if (sourceItem.multiple || targetItem.multiple) {
                                newItem.multiple = true;
                            }
                            if (sourceItem.optional && targetItem.optional) {
                                newItem.optional = true;
                            }
                            if (Object.prototype.hasOwnProperty.call(targetItem, 'type') && !Object.prototype.hasOwnProperty.call(sourceItem, 'type')) {
                                newItem.type = targetItem.type;
                            }
                            else if (targetItem.type === sourceItem.type || !Object.prototype.hasOwnProperty.call(targetItem, 'type')) {
                                newItem.type = sourceItem.type;
                            }
                            newItem.value = mergeFeatureMetadata(targetItem.value, sourceItem.value, false, equalsPredicate);
                            if (newItem.value.length === 0) {
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
                            result.push(newItem);
                        }
                        else {
                            result.push(targetItem);
                        }
                    }
                }
                return result ?? [];
            };

            const getCommonFeatureMetadata = function (metadata1, metadata2, equalsPredicate) {
                let result = null;
                if (Array.isArray(metadata1) && Array.isArray(metadata2)) {
                    for (const item1 of metadata1) {
                        const item2 = metadata2.find(byName(item1.name, equalsPredicate));
                        result ??= [];
                        if (item2) {
                            if (item2.multiple !== item1.multiple) {
                                continue;
                            }
                            if (item2.optional !== item1.optional) {
                                continue;
                            }
                            if (item1.type !== item2.type) {
                                continue;
                            }
                            const newItem = { ...item1 };
                            newItem.value = getCommonFeatureMetadata(item1.value, item2.value, equalsPredicate);
                            if (newItem.value.length === 0) {
                                if (item2.value === item1.value && self.autofill) {
                                    newItem.value = item1.value;
                                }
                                else {
                                    newItem.value = undefined;
                                }
                            }
                            result.push(newItem);
                        }
                    }
                }
                return result ?? [];
            };

            const getDataFromMetadata = function (metadata) {
                if (!Array.isArray(metadata)) {
                    return metadata;
                }
                let result = {};
                // Los metadatos de array tienen elementos name: indíce, convertimos a array
                if (metadata.every((elm) => /^\d+$/.test(elm.name))) {
                    result = [];
                }
                for (const item of metadata) {
                    let value;
                    if (item.type === 'object' || !item.type && Array.isArray(item.value)) {
                        value = getDataFromMetadata(item.value);
                    }
                    else {
                        value = item.value;
                    }
                    if (item.name) {
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
                    featureTypeMetadata = await this.#getFeatureTypeMetadata(layer);
                    layerAttributeMetadata = featureTypeMetadata?.attributes ?? [];
                    geometriesMetadata = featureTypeMetadata?.geometries;
                    renderObject.sealed = layer.type === Consts.layerType.WFS;
                }
                catch (_e) { }

                const featuresToCheck = layer.features;
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
                                return getCommonFeatureMetadata(accAttributeMetadata, currentAttributeMetadata);
                            }
                            return currentAttributeMetadata;
                        }, null);
                };
                // Para obtener la estructura de atributos primero miramos en todas las entidades de la capa
                // Si no hay estructura común miramos solamente en las entidades de la misma geometría
                // Si sigue sin haber, quitamos la entidad actual si está vacía (entidad nueva)
                let featureAttributeData;
                if (Object.keys(this.#feature.getData()).length) {
                    featureAttributeData = getCommonAttributeData(featuresToCheck);
                    if (!featureAttributeData.length) {
                        featureAttributeData = getCommonAttributeData(featuresToCheck.filter((f) => f instanceof this.#feature.constructor));
                    }
                }
                else {
                    featureAttributeData = getCommonAttributeData(featuresToCheck.filter((f) => f !== this.#feature));
                }
                if (featureAttributeData.length) {
                    if (layerAttributeMetadata.length) {
                        const mergeAttributes = function (layerAttributes, featureAttributes) {
                            if (featureAttributes) {
                                let lastIndex = 0;
                                let result = layerAttributes.slice();
                                for (const featureAttribute of featureAttributes) {
                                    const layerAttribute = layerAttributes.find(byName(featureAttribute.name, featureTypeMetadata.equals));
                                    if (layerAttribute) {
                                        const newLayerAttribute = {
                                            name: featureAttribute.name,
                                            optional: !!layerAttribute.optional,
                                            type: layerAttribute.type
                                        };
                                        if (layerAttribute.multiple) {
                                            newLayerAttribute.multiple = true;
                                        }
                                        if (layerAttribute.type === 'object') {
                                            newLayerAttribute.value = mergeAttributes(layerAttribute.value, featureAttribute.value);
                                        }
                                        else if (featureAttribute.value) {
                                            newLayerAttribute.value = featureAttribute.value;
                                        }
                                        const resultIndex = result.findIndex(byName(featureAttribute.name, featureTypeMetadata.equals));
                                        result[resultIndex] = newLayerAttribute;
                                        lastIndex = resultIndex;
                                    }
                                    else {
                                        result.splice(++lastIndex, 0, featureAttribute);
                                    }
                                }
                                // Criterio adoptado:
                                // Solamente devolvemos los atributos de la capa que están en todas las entidades existentes
                                if (!renderObject.sealed) result = result.filter((attr) => featureAttributes.find(byName(attr.name, featureTypeMetadata.equals)));
                                return result;
                            }
                            return layerAttributes;
                        };
                        layerAttributeMetadata = mergeAttributes(layerAttributeMetadata, featureAttributeData);
                    }
                    else {
                        featureAttributeData.forEach(data => {
                            layerAttributeMetadata.push({ ...data, ...{ optional: true } });
                        });
                    }
                }

                const newData = {};
                const addNewData = function (newData, layerAttributeMetadata) {
                    for (let attr of layerAttributeMetadata) {
                        if (!attr.isId) {
                            // Añadimos los atributos que no tenga ya la entidad
                            if (attr.name) {
                                const featureAttrEntry = Object.entries(featureData).find(([key]) => {
                                    const equals = featureTypeMetadata?.equals ?? genericEquals;
                                    return equals(key, attr.name);
                                });
                                if (!featureAttrEntry) {
                                    let value;
                                    if (Object.prototype.hasOwnProperty.call(attr, 'value')) {
                                        value = getDataFromMetadata(attr.value);
                                    }
                                    if (value === undefined && !attr.optional) {
                                        if (attr.nonNullable) {
                                            switch (attr.type) {
                                                case 'boolean':
                                                    value = false;
                                                    break;
                                                default:
                                                    value = '';
                                            }
                                        }
                                        else {
                                            value = null;
                                        }
                                    }
                                    newData[attr.name] = value;
                                    if (attr.type === 'object') {
                                        addNewData(value, attr.value);
                                    }
                                }
                            }
                        }
                    }
                };
                addNewData(newData, layerAttributeMetadata);
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
                        if (attributes) {
                            delete attributes[path[path.length - 1]];
                        }
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
            this.#setUndefinedToggles();

            if (this.#feature) {
                this.show();
            }
            else {
                this.hide();
            }

            if (Util.isFunction(callback)) {
                callback();
            }
            this.controller = new Controller(this.model, new Observer(this));
            this.updateModel();
        });
    }

    async #getFeatureTypeMetadata(layer) {
        let result = null;
        if (layer) {
            result = await layer.getFeatureTypeMetadata();
            if (Util.isFunction(result)) {
                result = result(this.#feature);
            }
        }
        return result;
    }

    async addAttributeElement({ name, type, value }) {
        if (this.#feature) {
            let html;
            if (name) {
                const sealed = this.#feature.layer.type === Consts.layerType.WFS;
                const optional = this.#feature.layer.type !== Consts.layerType.WFS;
                html = await this.getRenderedHtml(this.CLASS + '-row', { name, type, value, sealed, optional });
            }
            else {
                // Línea que espera un nuevo atributo. Comprobamos que no haya ya una.
                if (this.querySelector(this.CLASS + '-new')) {
                    return;
                }
                html = await this.getRenderedHtml(this.CLASS + '-new');
            }
            const buffer = document.createElement('tbody');
            buffer.insertAdjacentHTML('beforeend', html);
            this.#addUIEventListeners(buffer);
            const tbody = this.querySelector(`${this.#selectors.BODY} > table > tbody`);
            const lastRows = Array.from(tbody.querySelectorAll('tr:last-of-type'));
            const anchor = lastRows[lastRows.length - 1];
            if (anchor) anchor.insertAdjacentElement('afterend', buffer.firstElementChild);
            else tbody.appendChild(buffer.firstElementChild);
            this.#setAttributeElements();
            this.controller.add(tbody);
        }
    }

    removeAttributeElement(path) {
        const selector = `${this.#selectors.BODY} > table > tbody > ` + path
            .map(name => `tr[data-attribute-name="${name}"]`)
            .join(' ');
        this.querySelectorAll(selector)
            .forEach((elm) => elm.remove());
        return this;
    }

    #setUndefinedToggles() {
        if (this.#feature) {
            const data = this.#feature.getData();
            const toggles = this.div.querySelectorAll(this.#selectors.TOGGLE);
            for (const toggle of toggles) {
                let properties = data;
                const path = this.#getPathFromElement(toggle);
                for (const name of path) {
                    properties = properties[name];
                }
                toggle.indeterminate = properties === undefined || properties === null;
            }
        }
    }

    #setAttributeElements() {
        this.newAttributeElement = this.querySelector(`.${this.CLASS}-new`);
        this.attributeProposalElement = this.querySelector(`.${this.CLASS}-proposal`);
    }

    addUIEventListeners() {
        return this.#addUIEventListeners(this);
    }

    #getPathFromElement(element) {
        let parent = element;
        const path = [];
        do {
            parent = parent.parentElement;
            if (parent?.matches('tr[data-attribute-name]')) {
                path.unshift(parent.dataset.attributeName);
            }
        }
        while (parent && !parent.matches(this.#selectors.BODY));
        return path;
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
            self.removeFeatureAttribute(self.#getPathFromElement(this));
        };

        root.querySelectorAll(self.#selectors.ATTRIBUTE_REMOVE).forEach(elm => {
            elm.addEventListener('click', onRemoveButtonClick);
        });

        const onAddButtonClick = function (_e) {
            const path = self.#getPathFromElement(this);
            const scrollTop = self.div.querySelector(self.#selectors.BODY).scrollTop;
            self.addFeatureAttributeItem(path).then((newItem) => {
                if (newItem) {
                    const body = self.div.querySelector(self.#selectors.BODY);
                    body.scrollTo(0, scrollTop);
                }
            });
        };

        root.querySelectorAll(self.#selectors.ITEM_ADD).forEach(elm => {
            elm.addEventListener('click', onAddButtonClick);
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
                self.setFeatureData(self.#feature, newData);
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

        const onFeaturesSelectionChange = function (_e) {
            const features = self.containerControl.getSelectedFeatures();
            self.feature = features[0];
        };
        self.containerControl?.addEventListener(Consts.event.FEATURESSELECT, onFeaturesSelectionChange);
        self.containerControl?.addEventListener(Consts.event.FEATURESUNSELECT, onFeaturesSelectionChange);

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

        self.history.addEventListener('undo', function (e) {
            if (e.action.type === FeatureHistory.action.ATTRIBUTESCHANGE && e.feature === self.feature) {
                self.render();
            }
            if (e.action.type === FeatureHistory.action.REMOVE) {
                self.feature = e.feature;
            }
        });
        self.history.addEventListener('redo', function (e) {
            if (e.action.type === FeatureHistory.action.ATTRIBUTESCHANGE && e.feature === self.feature) {
                self.render();
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
        // Quitamos los listener del control previo
        this.#clientControlAbortController?.abort();
        this.#clientControlAbortController = new AbortController();
        const { signal } = this.#clientControlAbortController;
        this.#clientControl = value;
        if (this.#clientControl instanceof Modify) {
            const onFeatureSelect = (_e) => {
                this.feature = this.clientControl.getSelectedFeatures()[0];
            };
            this.#clientControl.addEventListener(Consts.event.FEATURESSELECT, onFeatureSelect, { signal });
            this.#clientControl.addEventListener(Consts.event.FEATURESUNSELECT, onFeatureSelect, { signal });
            onFeatureSelect();
        }
        else if (this.#clientControl instanceof Draw) {
            const onDrawEnd = (e) => {
                setTimeout(() => {
                    this.feature = e.detail?.feature;
                }, 100);
            };
            this.#clientControl.addEventListener(Consts.event.DRAWEND, onDrawEnd, { signal });
            const onDrawReset = (_e) => {
                if (this.mode !== Consts.geom.POINT) {
                    this.feature = null;
                }
            };
            this.#clientControl.addEventListener(Consts.event.DRAWSTART, onDrawReset, { signal });
            this.#clientControl.addEventListener(Consts.event.DRAWCANCEL, onDrawReset, { signal });
            onDrawEnd({});
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
                            pointer[name] = new Date(value).toISOString().substring(0, 10);
                        }
                        else {
                            pointer[name] = value;
                        }
                        break;
                    case 'dateTime':
                        // Obtiene el valor yyyy-mm-ddThh:mm:ss
                        if (value) {
                            pointer[name] = new Date(value).toISOString().substring(0, 19);
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

            this.setFeatureData(this.#feature, newData);
        }
    }

    removeFeatureAttribute(path) {
        if (this.#feature) {
            if (path.length) {
                const proposal = this.#attributeProposals.get(this.#feature);
                if (path.length ===1 && path[0] === proposal) {
                    this.removeAttributeElement(path);
                    this.#attributeProposals.delete(this.#feature);
                    this.addAttributeElement({});
                }
                else {
                    const layer = this.#feature.layer;
                    this.#getFeatureTypeMetadata(layer).then((featureTypeMetadata) => {
                        let everyFeature = false;
                        let featuresToChange = [this.#feature];
                        let warningMessage = 'removeAttribute.confirm';
                        // Revisamos si el atributo está en todas las entidades de la capa
                        if (layer.features.length > 1 && layer.features.every((f) => {
                            let featureData = f.getData();
                            for (const pathElement of path) {
                                if (Object.prototype.hasOwnProperty.call(featureData, pathElement)) {
                                    featureData = featureData[pathElement];
                                }
                                else {
                                    return false;
                                }
                            }
                            return true;
                        })) {
                            everyFeature = true;
                            featuresToChange = layer.features;
                            warningMessage = 'deleteTableMetadata.warning';
                        }

                        if (featureTypeMetadata) {
                            const attribute = findAttribute(featureTypeMetadata.attributes, path, featureTypeMetadata.equals);
                            if (attribute && !attribute.optional) {
                                throw Error(this.getLocaleString('removeAttribute.error', { name: attribute.name }));
                            }
                        }
                        TC.confirm(this.getLocaleString(warningMessage, { name: path.join(' › ') }), () => {
                            if (everyFeature) {
                                if (featureTypeMetadata) {
                                    let collection = featureTypeMetadata.attributes;
                                    if (path.length > 1) {
                                        const parentPath = path.slice(0, path.length - 1);
                                        const parentAttr = findAttribute(featureTypeMetadata.attributes, parentPath, featureTypeMetadata.equals);
                                        collection = parentAttr.value;
                                    }
                                    const idx = collection.findIndex(byName(path[path.length - 1]));
                                    if (idx >= 0) {
                                        collection.splice(idx, 1);
                                    }
                                }
                            }
                            featuresToChange.forEach((f) => {
                                let featureData = f.getData();
                                const eventData = {};
                                eventData.oldData = JSON.parse(JSON.stringify(featureData));
                                const name = path[path.length - 1];
                                if (path.length === 1) {
                                    f.unsetData(name);
                                }
                                else {
                                    for (let i = 0, ii = path.length - 1; i < ii; i++) {
                                        featureData = featureData[path[i]];
                                    }
                                }
                                delete featureData[name];
                                eventData.newData = JSON.parse(JSON.stringify(f.getData()));
                                this.#triggerFeatureModify(eventData);
                            });
                            const newAttributes = this.#newAttributes.get(this.#feature);
                            const attributeIndex = newAttributes?.findIndex((attr) => attr.name === path[path.length - 1]);
                            if (attributeIndex >= 0) newAttributes.splice(attributeIndex, 1);
                            this.removeAttributeElement(path);
                        });

                    });
                }
            }
        }
    }

    #getValueFromAttributeDefinition(attribute) {
        let result;
        if (attribute.type === 'object') {
            result = {};
            if (attribute.value) {
                for (const valueItem of attribute.value) {
                    result[valueItem.name] = this.#getValueFromAttributeDefinition(valueItem);
                }
            }
        }
        return result;
    }

    async addFeatureAttributeItem(path) {
        if (this.#feature) {
            if (path.length) {
                const layer = this.#feature.layer;
                const featureTypeMetadata = await this.#getFeatureTypeMetadata(layer);
                const name = path[path.length - 1];
                let featureData = this.#feature.getData();
                const eventData = {};
                eventData.oldData = JSON.parse(JSON.stringify(featureData));
                for (let i = 0, ii = path.length - 1; i < ii; i++) {
                    featureData = featureData[path[i]];
                }
                let value = featureData[name];
                let newItem;
                if (!Array.isArray(value)) {
                    featureData[name] = [value];
                    value = featureData[name];
                }
                if (featureTypeMetadata) {
                    const attribute = findAttribute(featureTypeMetadata.attributes, path, featureTypeMetadata.equals);
                    if (!attribute?.multiple) {
                        return;
                    }
                    newItem = this.#getValueFromAttributeDefinition(attribute);
                }
                else {
                    const previousItem = value[0];
                    newItem = Util.extend(true, {}, previousItem);
                    const clearValues = (obj) => {
                        for (const key in obj) {
                            const val = obj[key];
                            if (val && typeof val === 'object') {
                                clearValues(val);
                            }
                            else {
                                obj[key] = undefined;
                            }
                        }
                    };
                    clearValues(newItem);
                }
                value.push(newItem);
                eventData.newData = JSON.parse(JSON.stringify(this.#feature.getData()));
                this.#triggerFeatureModify(eventData);
                await this.render();
                return newItem;
            }
        }
        return null;
    }

    setFeatureData(feature, data) {
        const actionData = this.history.setData(feature, data);
        this.#triggerFeatureModify(actionData);
        return this;
    }

    #triggerFeatureModify(eventData) {
        this.trigger(Consts.event.FEATUREMODIFY, {
            feature: this.#feature,
            layer: this.#feature.layer,
            geometryChanged: false,
            oldData: eventData.oldData,
            newData: eventData.newData,
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
            let type = AttributesEdit.PROPOSAL;
            let attribute;
            const featureTypeMetadata = await this.#getFeatureTypeMetadata(this.#feature.layer);
            if (featureTypeMetadata) {
                attribute = findAttribute(featureTypeMetadata.attributes, [attributeName], featureTypeMetadata.equals);
                if (attribute) {
                    type = attribute.type;
                }
                else if (featureTypeMetadata.sealed) {
                    proposalInput.value = '';
                    throw Error(this.getLocaleString('forbiddenAttribute.error', { name: attributeName }));
                }
            }
            if (!featureTypeMetadata || attribute?.optional ||
                this.#feature.layer.features.length === 1 ||
                TC.confirm(this.getLocaleString('tableMetadataExists.warning'))) {
                if (attribute) {
                    type = attribute.type;
                }
                this.#attributeProposals.set(this.#feature, proposalInput.value);
                this.newAttributeElement.remove();
                this.newAttributeElement = null;
                await this.addAttributeElement({ name: proposalInput.value, type: AttributesEdit.PROPOSAL });
                if (type !== AttributesEdit.PROPOSAL) {
                    this.#acceptProposal(type);
                }
            }
        }
    }

    async #acceptProposal(type) {
        if (type) {
            if (this.#feature) {
                const name = this.#attributeProposals.get(this.#feature);
                this.#attributeProposals.delete(this.#feature);
                let newAttributes;
                if (!this.#newAttributes.has(this.#feature)) {
                    newAttributes = [];
                    this.#newAttributes.set(this.#feature, newAttributes);
                }
                newAttributes.push({ name, type, optional: true });
                this.attributeProposalElement.remove();
                this.attributeProposalElement = null;
                const value = type === Consts.dataType.BOOLEAN ? false : null;
                const newData = { [name]: value };
                const layer = this.#feature.layer;
                const featureTypeMetadata = await this.#getFeatureTypeMetadata(layer);
                if (featureTypeMetadata) {
                    const lcName = name.toLowerCase();
                    const existingAttr = featureTypeMetadata?.attributes.find((attr) => attr.name.toLowerCase() === lcName);
                    if (!existingAttr) {
                        featureTypeMetadata.attributes.push({ name, type, isId: false, optional: true });
                        layer.setFeatureTypeMetadata(featureTypeMetadata);
                    }
                    layer.features.forEach((f) => f.setData({ ...newData }));
                }
                else {
                    this.#feature.setData(newData);
                }
                await this.addAttributeElement({ name, type });
                await this.addAttributeElement({});
            }
        }
    }
    updateModel() {
        const self = this;
        self.model.featureAttributes = self.getLocaleString("featureAttributes");
        self.model.addItem = self.getLocaleString("featureAttributes");
        self.model.removeAttribute = self.getLocaleString("removeAttribute");
        self.model.selectDataType = self.getLocaleString("selectDataType");
        self.model.text = self.getLocaleString("text");
        self.model.number = self.getLocaleString("number");
        self.model.integer = self.getLocaleString("integer");
        self.model.boolean = self.getLocaleString("boolean");
        self.model.date = self.getLocaleString("date");
        self.model.time = self.getLocaleString("time");
        self.model.datetime = self.getLocaleString("datetime");
        self.model.addNewAttribute = self.getLocaleString("addNewAttribute");
    }

}

AttributesEdit.prototype.CLASS = 'tc-ctl-attr-edit';
customElements.get(elementName) || customElements.define(elementName, AttributesEdit);
TC.control.AttributesEdit = AttributesEdit;
export default AttributesEdit;
import BasemapSelector from './BasemapSelector.js';
import Util from '../Util.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';

class CompactBasemapSelectorModel {
    constructor() {
        this.backgroundMap = "";
        this.changeBackgroundLayer = "";
    }
}

class CompactBasemapSelector extends BasemapSelector {

    constructor() {
        super(...arguments);
        this.model = new CompactBasemapSelectorModel();
    }

    async loadTemplates() {
        this.template = {};
        const mainTemplatePromise = import(
            /* webpackChunkName: "tc-ctl-cbms" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-cbms.mjs'
        );
        this.template[this.CLASS] = (await mainTemplatePromise).default;
    }

    async render(callback) {
        await super.render();

        this.getChangeLayerButton().addEventListener('click', (_e) => {
            this.bmsControl.showMoreLayersDialog();
        }, { passive: true });

        this.controller = new Controller(this.model, new Observer(this.div));
        this.updateModel();

        if (Util.isFunction(callback)) {
            callback();
        }
    }

    async register(map) {

        const div = document.createElement('div');
        this.bmsControl = new BasemapSelector(div, { dialogMore: true });
        const objs = Promise.all([super.register.call(this, map), this.bmsControl.register(map)]);
        map.on(TC.Consts.event.BASELAYERCHANGE, (e) => {
            this.update(this.div, e.layer);
        });

        map.loaded(() => this.update(this.div, map.baseLayer));

        return objs[0];
    }

    updateLayerTree() {

    }

    async update(_div, baseLayer) {
        await this.renderPromise();
        const changeLayerButton = this.getChangeLayerButton();
        changeLayerButton.innerHTML = baseLayer.title;
        changeLayerButton.style.backgroundImage = `url(${baseLayer.thumbnail})`;
    }

    getChangeLayerButton() {
        return this.div.querySelector(`.${this.CLASS}-btn`);
    }

    updateModel() {
        for (const key of Object.keys(this.model)) {
            if (!key.startsWith("#")) {
                this.model[key] = this.getLocaleString(key);
            }
        }
    }
}

CompactBasemapSelector.prototype.CLASS = 'tc-ctl-cbms';
export default CompactBasemapSelector;
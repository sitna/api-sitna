import Consts from '../Consts.js';
import Cfg from '../Cfg.js';
import Util from '../Util.js';
import Scale from './Scale.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';

class ScaleSelector extends Scale {
    static {
        customElements.define('sitna-scale-select', this);
    }

    scales = null;

    async loadTemplates() {
        const module = await import(
            /* webpackChunkName: "tc-ctl-ss" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-ss.mjs'
        );
        this.template = module.default;
    }

    async render(callback) {
        if (!this.map) {
            throw Error('ScaleSelector no registrado');
        }
        if (!this.scales && this.map.options.resolutions) {
            this.scales = this.map.options.resolutions.map(this.getScale, this);
        }
        if (!this.scales) {
            await this.map.wrap.getMap();
        }
        this.scales = this.map.wrap.getResolutions().map(this.getScale, this);
        await this.renderData({ scale: this.getScale(), screenSize: Cfg.screenSize, scales: this.scales }, () => {

            this.querySelectorAll('option').forEach((option) => {
                option.textContent = '1:' + this.format(option.textContent.substring(2));
            });

            this.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
            this.controller = new Controller(this.model, new Observer(this));
            this.updateModel();
        });
    }

    addUIEventListeners() {
        this.querySelector('input[type="button"]').addEventListener(Consts.event.CLICK, () => {
            this.setScreenSize();
        }, { passive: true });

        this.querySelector('select').addEventListener('change', (e) => {
            this.setScale(e.target.value);
        });
    }

/*
 *  setScale: Sets the resolution of the map from a scale denominator and estimated screen DPI
 *  Parameters: number, the scale denominator
 *  Returns: number, the resolution
 */
    setScale(scale) {
        let result = scale * .0254 / this.getDpi(Cfg.screenSize);
        if (window.devicePixelRatio) {
            result = result / window.devicePixelRatio;
        }
        if (this.metersPerDegree) {
            result = result / this.metersPerDegree;
        }
        this.map.wrap.setResolution(result);
        return result;
    }
    
    updateModel() {
        this.model.estimatedMapSize = this.getLocaleString("estimatedMapSize");
    }

}

ScaleSelector.prototype.CLASS = 'tc-ctl-ss';
export default ScaleSelector;
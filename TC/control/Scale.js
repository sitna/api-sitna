import TC from '../../TC.js';
import Consts from '../Consts.js';
import Cfg from '../Cfg.js';
import Util from '../Util.js';
import WebComponentControl from './WebComponentControl.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';

Consts.SCREEN_SIZE_KEY = 'TC.Map.screenSize';

class ScaleModel {
    constructor() {
        this.estimatedMapSize = "";
    }
}

class Scale extends WebComponentControl {

    static {
        customElements.define('sitna-scale', this);
    }

    async loadTemplates() {
        const module = await import(
            /* webpackChunkName: "tc-ctl-scl" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-scl.mjs'
        );
        this.template = module.default;
    }

    render(callback) {
        this.model = new ScaleModel();
        return this.renderData({ scale: this.getScale(), screenSize: Cfg.screenSize }, () => {

            const span = this.div.querySelector('span');
            span.textContent = '1:' + this.format(span.textContent.substr(2));

            this.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
            this.controller = new Controller(this.model, new Observer(this.div))
            this.updateModel();
        });
    }

    addUIEventListeners() {
        this.div.querySelector('input[type="button"]').addEventListener(Consts.event.CLICK, () => {
            this.setScreenSize();
        }, { passive: true });
    }

    register(map) {
        const result = super.register.call(this, map);
        let screenSize = Util.storage.getLocalValue(Consts.SCREEN_SIZE_KEY);
        if (screenSize) {
            Cfg.screenSize = screenSize;
        }
        

        this.render(() => {
            map.on(Consts.event.ZOOM, () => {
                delete this.metersPerDegree;
                this.update();
            });            
        });

        return result;
    }

    update() {
        this.render();
    }

    /*
     *  setScreenSize: Prompts for screen size in inches, updates and stores value
     */
    setScreenSize() {
        TC.prompt(this.getLocaleString('selectScreenSize'), Cfg.screenSize, (value) => {
            if (value) {
                Cfg.screenSize = parseFloat(value);
                Util.storage.setLocalValue(Consts.SCREEN_SIZE_KEY, Cfg.screenSize);
                this.update();
            }
        });
    }

    /*
     *  getScale: Gets scale denominator with a resolution or current map resolution and estimated screen DPI
     *  Parameters: number (optional), the resolution to get scale from. If no parameter is given, current map resolution is used
     *  Returns: number
     */
    getScale(resolution) {
        var result = 0;
        var res = !resolution && this.map ? this.map.wrap.getResolution() : resolution;
        if (res) {
            result = res * this.getDpi(Cfg.screenSize) / .0254;
            if (window.devicePixelRatio) {
                result = result * window.devicePixelRatio;
            }
        }
        if (this.map && this.map.wrap.isGeo()) {
            if (!this.metersPerDegree) {
                var extent = this.map.getExtent();
                if (extent) {
                    this.metersPerDegree = Util.getMetersPerDegree(extent);
                }
            }
            if (this.metersPerDegree) {
                result = result * this.metersPerDegree;
            }
        }
        return result;
    }

    /*
     *  getDpi: Gets estimated DPI based on screen resolution and screenSize value
     *  Returns: number
     */
    getDpi(screenSize) {
        this.dpi = Math.sqrt(screen.width * screen.width + screen.height * screen.height) / screenSize;
        return this.dpi;
    }

    format(number) {
        const n = Math.round(new Number(number));
        return Util.formatNumber(n);
    }
    updateModel() {
        this.model.estimatedMapSize = this.getLocaleString("estimatedMapSize");
    }

}

Scale.prototype.CLASS = 'tc-ctl-scl';
export default Scale;
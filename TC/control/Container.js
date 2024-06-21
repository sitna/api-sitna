import TC from '../../TC';
import Control from '../Control';

TC.control = TC.control || {};

class Container extends Control {
    constructor() {
        super(...arguments);

        this.controlOptions = this.options.controls;

        this.ctlCount = this.controlOptions.length;
        this.defaultSelection = this.options.defaultSelection;

        this._ctlPromises = new Array(this.ctlCount);
    }

    async register(map) {
        const ctlRegister = super.register.call(this, map);

        this.uids = new Array(self.ctlCount);
        this.uids.forEach((_elm, idx, arr) => {
            arr[idx] = this.getUID();
        });

        await Promise.all([ctlRegister, this.renderPromise()]);
        const ctl = await this.onRender();
        return ctl;
    }

    mergeOptions(...options) {
        const newOptions = super.mergeOptions(...options);
        const controlOptions = options
            .map(opts => opts.controls ?? [])
            .map(opts => {
                if (!Array.isArray(opts)) {
                    return Object.keys(opts).map(key => {
                        const ctlOptions = { ...opts[key] };
                        delete ctlOptions.position;
                        return { [key]: ctlOptions, position: opts[key].position };
                    });
                }
                return opts;
            });
        newOptions.controls = controlOptions[controlOptions.length - 1];
        return newOptions;
    }

    onRender() {
        return Promise.resolve(this);
    }

    async render(_callback) { }

    async getControl(idx) {
        const ctl = await this._ctlPromises[idx];
        if (!ctl) {
            throw Error('No control found');
        }
        return ctl;
    }

    getControls() {
        return Promise.all(this._ctlPromises);
    }

    onControlDisable(_control) {
    }

    onControlEnable(_control) {
    }
}

TC.control.Container = Container;
export default Container;

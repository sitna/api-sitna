import WebComponentControl from './WebComponentControl.js';
import ScaleBarWrapper from '../ol/ScaleBar.js';

class ScaleBar extends WebComponentControl {

    static {
        customElements.define('sitna-scale-bar', this);
    }

    constructor() {
        super(...arguments);
        this.wrap = new ScaleBarWrapper(this);
    }

    render() {
        this.classList.add(WebComponentControl.prototype.CLASS, this.CLASS);
        this.wrap.render();
        const renderPromise = Promise.resolve();
        this._firstRender ??= renderPromise;
        return renderPromise;
    }

    async register(map) {
        await super.register.call(this, map);
        await this.wrap.register(map);
        return this;
    }

    getText() {
        const self = this;

        return self.wrap.getText();
    }

    enable() {
        this.wrap.enable();
        super.enable();
    }

    disable() {
        super.disable();
        this.wrap.disable();
    }
}

ScaleBar.prototype.CLASS = 'tc-ctl-sb';
export default ScaleBar;
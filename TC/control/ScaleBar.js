import TC from '../../TC.js';
import WebComponentControl from './WebComponentControl.js';

const elementName = 'sitna-scale-bar';

class ScaleBar extends WebComponentControl {

    render() {
        this.classList.add(WebComponentControl.prototype.CLASS, this.CLASS);
        if (!this.wrap) {
            this.wrap = new TC.wrap.control.ScaleBar(this);
        }
        this.wrap.render();
        const renderPromise = Promise.resolve();
        this._firstRender ??= renderPromise;
        return renderPromise;
    }

    async register(map) {
        const [, olMap] = await Promise.all([super.register.call(this, map), map.wrap.getMap()]);
        olMap.addControl(this.wrap.ctl);
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
customElements.get(elementName) || customElements.define(elementName, ScaleBar);
export default ScaleBar;
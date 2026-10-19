import ControlWrapper from '../wrap/Control.js';
import { ScaleLine } from 'ol/control.js';

export default class ScaleBarWrapper extends ControlWrapper {
    #ctl;

    async register(map) {
        await super.register(map);
        this.map.addControl(this.#ctl);
    }

    render() {
        if (!this.#ctl) {
            this.#ctl = new ScaleLine({
                target: this.parent
            });
        }
        else {
            this.#ctl.updateElement_();
        }
    }

    getText() {
        if (this.#ctl) {
            return this.#ctl.renderedHTML_;
        }
    }

    enable() {
        if (this.#ctl) {
            this.parent.map.wrap.getMap().then((olMap) => this.#ctl.setMap(olMap));
        }
    }

    disable() {
        if (this.#ctl) {
            this.#ctl.setMap(null);
        }
    }
}
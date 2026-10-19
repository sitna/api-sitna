import ControlWrapper from '../wrap/Control.js';
import { ZoomToExtent } from 'ol/control.js';

export default class NavBarHomeWrapper extends ControlWrapper {

    #zoomToExtentControl;

    async register(map) {
        const olMap = await super.register(map);
        const target = this.parent;

        this.#zoomToExtentControl = new ZoomToExtent({ target, extent: map.initialExtent, tipLabel: '' });

        olMap.addControl(this.#zoomToExtentControl);

        target.querySelectorAll('button').forEach(function (button) {
            button.style.display = 'block';
            button.innerHTML = '';
        });
        const homeBtn = target.querySelector('.ol-zoom-extent button');
        homeBtn.classList.add('tc-ctl-btn', 'tc-float-btn', this.parent.CLASS + '-btn');
        homeBtn.setAttribute('title', "[[zoomToInitialExtent]]");
        //homeBtn.setAttribute('title', this.parent.getLocaleString('zoomToInitialExtent'));        
    }

    setInitialExtent(extent) {
        this.#zoomToExtentControl.extent = extent;
    }
}
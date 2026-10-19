import ControlWrapper from '../wrap/Control.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import MapBrowserEventType from 'ol/MapBrowserEventType.js';

export default class ClickWrapper extends ControlWrapper {
    #hitTolerance = Util.detectMouse() ? 3 : 10;

    async register(map) {
        await super.register(map);
        this._trigger = (e) => {
            if (this.parent.map.view === Consts.view.PRINTING) {
                return;
            }
            let featureCount = 0;
            this.map.forEachFeatureAtPixel(e.pixel,
                function (feature, _layer) {
                    if (feature._wrap && feature._wrap.parent.showsPopup) {
                        featureCount++;
                    }
                },
                {
                    hitTolerance: this.#hitTolerance
                });
            if (!featureCount) {
                // GLS: lanzo el evento click, para que los controles que no pueden heredar de click y definir un callback pueda suscribirse al evento
                this.parent.map.trigger(Consts.event.CLICK, {
                    coordinate: e.coordinate, pixel: e.pixel
                });
                this.parent.callback(e.coordinate, e.pixel);
            }
            // Seguimos adelante si no se han pinchado featuers
            return featureCount === 0;
        };
    }

    activate() {
        const self = this;
        this.parent.map.wrap.getMap().then((olMap) => {
            olMap.on(MapBrowserEventType.SINGLECLICK, self._trigger);
        });
    }

    deactivate() {
        const self = this;
        this.parent.map.wrap.getMap().then((olMap) => {
            olMap.un(MapBrowserEventType.SINGLECLICK, self._trigger);
        });
    }
}
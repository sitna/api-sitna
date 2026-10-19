import ControlWrapper from '../wrap/Control.js';
import MapBrowserEventType from 'ol/MapBrowserEventType.js';
import Consts from '../Consts.js';

export default class CoordinatesWrapper extends ControlWrapper {

    #coordsTrigger;

    async register(map) {
        const olMap = await super.register(map);

        this.#coordsTrigger = (e) => {
            this.parent.coordsToClick(e);
        };

        if (!this.parent.map.on3DView) {
            var projection = olMap.getView().getProjection();
            this.parent.crs = projection.getCode();
            this.parent.units = projection.getUnits();
        } else {
            this.parent.crs = this.parent.map.view3D.crs;
            this.parent.units = Consts.units.DEGREES;
        }

        this.parent.isGeo = this.parent.units === Consts.units.DEGREES;

        //$(olMap.getViewport()).add(this.parent.div);
    }

    onMouseMove(e) {
        if (this.map) {
            var coords = this.map.getEventCoordinate(e);
            if (coords) {
                if (this.parent.isGeo) {
                    this.parent.latLon = coords.reverse();
                } else {
                    this.parent.xy = coords;
                }

                this.parent.update.apply(this.parent, arguments);
            }
        }
    }


    async coordsActivate() {
        //URI en IOS se usa antes olMap de ser definido
        (this.map || await this.parent.map.wrap.getMap()).on(MapBrowserEventType.CLICK, this.#coordsTrigger);
    }

    coordsDeactivate() {
        this.map.un(MapBrowserEventType.CLICK, this.#coordsTrigger);
    }
}
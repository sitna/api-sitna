import Overlay from 'ol/Overlay.js';
import ControlWrapper from '../wrap/Control.js';
import Util from '../Util.js';

const olOverlayPositioning = {
    CENTER_CENTER: 'center-center',
};
export default class ElevationProfileWrapper extends ControlWrapper {

    showElevationMarker = (options = {}) => {
        const data = options.data;
        const layer = options.layer;
        const coords = options.coords;

        if (!this.elevationMarker) {
            const elm = document.createElement('div');
            elm.style.display = 'none';
            elm.classList.add(this.parent.CLASS + '-overlay', 'tc-elevation');
            this.elevationMarker = new Overlay({
                id: 'ovElevationMarker',
                element: elm,
                offset: [0, 0],
                positioning: olOverlayPositioning.CENTER_CENTER,
                stopEvent: false
            });
        }

        // GLS: si la capa del track está visible mostramos marcamos punto del gráfico en el mapa
        if (!layer || layer.getVisibility() && layer.getOpacity() > 0) {
            let position = coords[data[0].index];
            const map = this.parent.map;
            this.elevationMarker.getElement().style.display = '';
            const olMap = map.wrap.map;
            if (!olMap.getOverlayById(this.elevationMarker.getId())) {
                olMap.addOverlay(this.elevationMarker);
            }
            this.elevationMarker.setPosition(position);
            if (map.on3DView && position) {
                map.view3D.setElevationMarker(Util.reproject(position, map.view3D.view2DCRS, map.getCRS()), this.parent);
            }
        }
    }

    hideElevationMarker() {
        const olMap = this.parent.map.wrap.map;
        if (this.elevationMarker) {
            olMap.removeOverlay(this.elevationMarker);
            this.elevationMarker = null;

            if (this.parent.map.on3DView) {
                this.parent.map.view3D.hideElevationMarker(this.parent);
            }
        }
    }

}
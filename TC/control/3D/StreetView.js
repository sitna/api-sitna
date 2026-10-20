import Consts from '../../Consts.js';
import Control from './Control.js';
export default class StreetView extends Control {    
    #pegman;
    constructor(options) {
        super(options.map.viewer);
        this.map = options.map;
        this.twoDControl = options.twoDControl;        
        this.map.view3D.linked2DControls[this.twoDControl.id] = this;
        if (this.twoDControl.clickControl) {
            this.map.view3D.linked2DControls[this.twoDControl.clickControl.id] = this;
        }
        const self = this;
        this.map.dragDropInteraction.addEventListener("drop", (evt) => {
            if (self.#pegman === evt.entity) {
                var positionCartographic = cesium.Ellipsoid.WGS84.cartesianToCartographic(evt.endPosition);
                var positionCartographicOld = cesium.Ellipsoid.WGS84.cartesianToCartographic(evt.startPosition);
                //const newPosition = cesium.Cartographic.fromCartesian(movement.position);
                self.map.map.trigger(Consts.event.THREED_DRAG, { pickedFeature: evt.entity, newCoords: [cesium.Math.toDegrees(positionCartographic.longitude), cesium.Math.toDegrees(positionCartographic.latitude)], oldCoords: [cesium.Math.toDegrees(positionCartographicOld.longitude), cesium.Math.toDegrees(positionCartographicOld.latitude)] });                    
            }
        })
        //this.eventHandlers = {};
        //this.eventHandlers.handlerOfFeatures = new cesium.ScreenSpaceEventHandler(this.#viewer.scene.canvas);
    }
    setPegman(position, angle) { 
        if (!(position instanceof cesium.Cartesian3 || position instanceof cesium.Cartesian2)) {
            position = cesium.Cartesian3.fromDegrees(position[0], position[1]);
        }
        const heading = cesium.Math.toRadians(angle - 90);
        const pitch = 0;
        const roll = 0;
        const hpr = new cesium.HeadingPitchRoll(heading, pitch, roll);
        const orientation = cesium.Transforms.headingPitchRollQuaternion(
            position,
            hpr
        );
        this.#pegman = this.viewer.entities.getById("pegman");
        if (!this.#pegman) {
            this.#pegman = this.viewer.entities.add({
                id: "pegman",
                position: position,
                orientation: orientation,
                model: {
                    uri: TC.apiLocation + "resources/data/pegman.glb",
                    heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
                    minimumPixelSize: 50,
                }
            });
            this.map.dragDropInteraction.addDraggableEntity(this.#pegman);
        }
        else {
            this.#pegman.position = position;
            this.#pegman.orientation = orientation;
            this.#pegman.show = true;
        }
        this.viewer.refresh();
        
        return this.#pegman;
    }
}
import Control from './Control.js';
export default class Click extends Control {
    constructor(options) {
        super(options.map.viewer);
        this.eventHandlers = {};
        this.eventHandlers.handlerOfFeatures = new cesium.ScreenSpaceEventHandler(options.map.viewer.scene.canvas);
    }
    activate() {
        const self = this;
        //bindeo de eventos
        this.eventHandlers.handlerOfFeatures.setInputAction((movement) => {            
            if(self.isActive) self._clickManagement(movement.position);            
        }, cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
    deactivate() {
        //unbind de eventos
        this.eventHandlers.handlerOfFeatures.removeInputAction(cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
}

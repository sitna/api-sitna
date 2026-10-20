export default class ThreeDMouseMove extends EventTarget {
    #viewer;
    #dataSourceBlackList = {}
    constructor(viewer) {
        super();
        this.#viewer = viewer;        
        this.eventHandlers = {};
        this.eventHandlers.handlerOfFeatures = new cesium.ScreenSpaceEventHandler(this.#viewer.scene.canvas);
    }
    isClickable(entity) {        
        const dataSourceName = entity.entityCollection.owner.name;
        if (this.#dataSourceBlackList[dataSourceName]) {
            return this.#dataSourceBlackList[dataSourceName].apply();
        }
        return true;
    }
    activate() {
        const self = this;
        //bindeo de eventos
        this.eventHandlers.handlerOfFeatures.setInputAction((movement) => {
            if (!self.#viewer.isDragging) { 
                var pickedFeatures = self.#viewer.scene.drillPick(movement.endPosition);
                if (pickedFeatures.length) { 
                    const pickedFeature = pickedFeatures.find((p) => p.id && self.isClickable(p.id))
                    if (pickedFeature && pickedFeature.id) {
                        if (self.isClickable(pickedFeature.id)) {
                            self.#viewer.canvas.style.cursor = 'pointer';
                            return;
                        }
                    }
                }
                
                self.#viewer.canvas.style.cursor = 'default';
            }
        }, cesium.ScreenSpaceEventType.MOUSE_MOVE);        
    }
    addCondition(dataSourceName, rule) { 
        this.#dataSourceBlackList[dataSourceName] = rule;
    }
    
    deactivate() {
        //unbind de eventos
        this.eventHandlers.handlerOfFeatures.removeInputAction(cesium.ScreenSpaceEventType.MOUSE_MOVE);        
    }
    destroy() {
        this.eventHandlers.handlerOfFeatures.destroy();
    }
}
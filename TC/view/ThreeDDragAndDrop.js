export default class ThreeDDragAndDrop extends EventTarget {
    #viewer;
    #draggableEntities = [];
    #startPosition;
    #endPosition;

    constructor(viewer) {
        super();
        this.#viewer = viewer;
        this.draggingEntity = null;
        this.draggingPosition = null;
        this.eventHandlers = {};
        this.eventHandlers.handlerOfFeatures = new cesium.ScreenSpaceEventHandler(this.#viewer.scene.canvas);
        this.dropCallback;
    }
    isDraggable(entity) {
        if (this.#draggableEntities.includes(entity)) {
            return true;
        }
        if (entity._wrap?.parent?.layer?.isDraggable) {
            return true;
        }
        return false;
    }
    addDraggableEntity(entity) {
        this.#draggableEntities.push(entity);
    }
    activate() {
        const self = this;
        //bindeo de eventos
        this.eventHandlers.handlerOfFeatures.setInputAction((movement) => {
            if (self.draggingEntity) {                
                self.draggingPosition = self._getPosition(movement.endPosition);
            }
            else { 
                var pickedFeature = self.#viewer?.scene?.pick(movement.endPosition);
                if (pickedFeature && pickedFeature.id) {
                    if (self.isDraggable(pickedFeature.id)) {
                        self.#viewer.canvas.style.cursor = 'grab';
                        return;
                    }                    
                }
            }
        }, cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.eventHandlers.handlerOfFeatures.setInputAction((movement) => {
            var pickedFeature = self.#viewer?.scene?.pick(movement.position);
            if (pickedFeature && pickedFeature.id) {
                if (self.isDraggable(pickedFeature.id)) {
                    self.draggingEntity = pickedFeature.id;
                    self.#viewer.isDragging = true;
                    self.draggingPosition = self._getPosition(movement.position);
                    self.displacement = cesium.Cartesian3.subtract(self.draggingPosition, self.draggingEntity.position.getValue(), new cesium.Cartesian3());
                    self.draggingEntity.position = new cesium.CallbackProperty(() => cesium.Cartesian3.subtract(self.draggingPosition, self.displacement,new cesium.Cartesian3())  , false)
                    self.#viewer.canvas.style.cursor = 'grabbing';
                    self.#viewer.scene.screenSpaceCameraController.enableInputs = false;
                    self.#startPosition = self.draggingEntity.position.getValue();
                    self.#viewer.scene.requestRenderMode = false;
                }
            }
        }, cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.eventHandlers.handlerOfFeatures.setInputAction((movement) => {
            var pickedFeature = self.#viewer?.scene?.pick(movement.position);
            if (pickedFeature && pickedFeature.id) {
                if (self.isDraggable(pickedFeature.id)) {
                    self.#viewer.canvas.style.cursor = 'grab';
                    self.#viewer.scene.screenSpaceCameraController.enableInputs = true;
                    self.draggingEntity.position = cesium.Cartesian3.subtract(self._getPosition(movement.position), self.displacement, new cesium.Cartesian3);
                    self.draggingPosition = null;
                    const dropEvent = new Event("drop");
                    dropEvent.entity = self.draggingEntity;
                    dropEvent.startPosition = self.#startPosition;
                    dropEvent.endPosition = self.draggingEntity.position.getValue();
                    self.dispatchEvent(dropEvent);
                    delete self.#viewer.isDragging;
                    self.draggingEntity = null;
                    self.#viewer.scene.requestRenderMode = true;
                }
            }
        }, cesium.ScreenSpaceEventType.LEFT_UP);
    }
    deactivate() {
        //unbind de eventos
        this.eventHandlers.handlerOfFeatures.removeInputAction(cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.eventHandlers.handlerOfFeatures.removeInputAction(cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.eventHandlers.handlerOfFeatures.removeInputAction(cesium.ScreenSpaceEventType.LEFT_UP);
    }
    destroy() {
        this.eventHandlers.handlerOfFeatures.destroy();
    }
    _getPosition(position) { 
        const ray = this.#viewer.camera.getPickRay(position);
        return this.#viewer.scene.globe.pick(ray, this.#viewer.scene);
    }
}
import Consts from '../../Consts.js';
import Control from './Control.js';
import { ThreeDDraw } from './ThreeDDraw.js';
import { tcFeatureConstructor, tcFeatureFromEntity } from '../../view/ThreeDUtils.js';
import ControlEvent from '../../../SITNA/control/ControlEvent.js';
import FeatureHistory from '../../tool/FeatureHistory.js';
export default class DrawMeasureModify extends Control {
    #control;
    #layer;
    #control2dAbortController;
    #mode;    
    #pickedEntity
    constructor(options) {
        super(options.map.viewer);
        this.map = options.map;
        this.twoDControl = options.twoDControl;
        const self = this;
        this.twoDControl.drawControls.forEach((drawControl) => {
            this.map.view3D.linked2DControls[drawControl.id] = self;
        });
        this.map.mouseInteraction.addCondition("drawing", () => {
            return !!self.#control?.entityForEdit;
        })        
        this.map.mouseInteraction.addCondition(this.twoDControl.layer.id, () => {
            return !self.#control?.entityForEdit;
        })
        this.twoDControl.modify.history.addEventListener('undo', function (e) {
            if (e.action.type === FeatureHistory.action.REMOVE) {
                if (self.twoDControl.layer.features.includes(e.feature))
                    setTimeout(() => {
                        if (e.feature.wrap.feature3D) {
                            if (e.feature.hasSelectedStyle() || e.feature.wrap.feature3D?.editing) {
                                self.#control.setSelectedEntity(e.feature.wrap.feature3D);
                                e.feature.wrap.feature3D.unhighlight();
                            }
                        }
                    }, 100);
            }
        })
    }
    #initialize3DInteration(mode = "point") {
        const self = this;
        this.#control = new ThreeDDraw(this.viewer, mode, {
            dataSource: this.map.view3D.dataSources.get((this.twoDControl.layer))
        });
        this.#control.addEventListener('drawend', (evt) => {
            const map = TC.Map.get(self.map.view3D.map);
            map.activeControl?.dispatchEvent(new ControlEvent(ControlEvent.type.MEASURE, {}));
            const apiFeature = tcFeatureConstructor(evt.detail.positions, evt.detail.type);
            if (self.map.view3D.view2DCRS !== self.map.view3D.crs)
                apiFeature.setCoordinates(apiFeature.getCoordinates({ geometryCrs: self.map.view3D.crs, crs: self.map.view3D.view2DCRS }));
            apiFeature.setStyle(evt.detail.entity.getStyle());
            map.activeControl?.dispatchEvent(new ControlEvent(ControlEvent.type.DRAWEND, {
                feature: apiFeature,
                transform: { geometryCrs: self.map.view3D.view2DCRS, crs: self.map.view3D.crs }
            }));
            this.twoDControl.layer.addFeature(apiFeature);
        });
        this.#control.addEventListener('drawstart', (_evt) => {
            const map = TC.Map.get(self.map.view3D.map);
            map.activeControl?.trigger(Consts.event.DRAWSTART, {});
        });
        this.#control.addEventListener('drawupdate', (evt) => {
            const map = TC.Map.get(self.map.view3D.map);
            map.activeControl?.trigger(Consts.event.MEASUREPARTIAL, evt.detail.measurements);
        });
        this.#control.addEventListener('point', (evt) => {
            const map = TC.Map.get(self.map.view3D.map);
            const geoCoords = cesium.Cartographic.fromCartesian(evt.detail.position);
            map.activeControl?.dispatchEvent(new ControlEvent(ControlEvent.type.POINTDRAW, {
                point: [cesium.Math.toDegrees(geoCoords.longitude), cesium.Math.toDegrees(geoCoords.latitude)]
            }));
        });
        this.#control.addEventListener('drawmodify', (evt) => {
            const map = self.map;
            const oldCoordinates = evt.detail.entity._wrap.parent.getCoordinates();
            const newFeature = tcFeatureConstructor(evt.detail.positions, evt.detail.type)
            const originalFeat = evt.detail.entity._wrap.parent;
            originalFeat.setCoordinates(newFeature.getCoordinates({ geometryCrs: this.map.view3D.crs, crs: this.map.view3D.view2DCRS }));
            const newCoordinates = originalFeat.getCoordinates();
            originalFeat.setCoordinates(newFeature.getCoordinates());
            map.map.activeControl?.history.setCoordinates(originalFeat, newCoordinates, oldCoordinates);
            map.map.activeControl?.trigger(Consts.event.FEATUREMODIFY, {
                feature: originalFeat,
                layer: originalFeat.layer,
                geometryChanged: true
            });
            this.map.view3D.getScene().forceRender();
        });
        this.#control.addEventListener('unselect', (e) => {
            const map = self.map;
            const controlEvent = new ControlEvent(Consts.event.FEATURESUNSELECT, { control: self });
            controlEvent.features = e.detail.features;
            map.map.activeControl?.dispatchEvent(controlEvent);
        });
        self.map.map.addEventListener(Consts.event.FEATUREADD, function (e) {            
            //const feature = e.detail.feature;
            //if (self.twoDControl.layer.features.includes(feature))
            //    setTimeout(() => {
            //        if (feature.wrap.feature3D) {
            //            if (feature.hasSelectedStyle() || feature.wrap.feature3D?.editing) {
            //                self.#control.setSelectedEntity(feature.wrap.feature3D);
            //                feature.wrap.feature3D.unhighlight();
            //            }
            //        }
            //    }, 100);

        });
        self.map.map.addEventListener(Consts.event.FEATUREREMOVE, function (e) {
            const feature = e.detail.feature;
            if (self.twoDControl.layer !== e.detail.layer) return;
            if (feature.wrap.feature3D) {
                self.#control.deactivateEditing();
            }
        });
    }
    activate(mode) {
        const self = this;
        mode = mode || this.twoDControl.drawControls.find((dc) => dc.isActive).mode;
        if (!this.#control) {
            self.#initialize3DInteration(mode);
        }
        else
            this.#control.setType(mode);
        this.#control.activate();
        const control2D = this.twoDControl.drawControls.find((dc) => dc.isActive);
        this.#control.setStyle(control2D.getStyle());
        this.#control2dAbortController?.abort();
        this.#control2dAbortController = new AbortController();
        const { signal } = this.#control2dAbortController;
        control2D.addEventListener(Consts.event.STYLECHANGE, (_e) => {
            this.#setStyle(control2D.getStyle());
        }, { signal });
    }
    activateEdit(mode) {
        const self = this;
        this.map.map.on(Consts.event.FEATUREREMOVE, this.#remove.bind(self));
        this.map.map.on(Consts.event.CONTROLDEACTIVATE, this.unselectFeatures.bind(self));
        if (!this.#control) { 
            self.#initialize3DInteration(mode);
        }
        this.#control.vertexRemove(mode !== "select");
        if (this.#control.entityForEdit && mode === "select") this.#control.activate();
        if (mode === "select")
            this.#control.activeSelectMode(function (selectedEntity) {
                if (cesium.defined(selectedEntity)) {
                    self.#pickedEntity = selectedEntity;
                    const controlEvent = new ControlEvent(Consts.event.FEATURESSELECT, { control: this.twoDControl });
                    controlEvent.features = [(selectedEntity._wrap?.parent || tcFeatureFromEntity(selectedEntity))];
                    self.map.map.activeControl.dispatchEvent(controlEvent);
                }
                else {
                    self.#pickedEntity = null
                }
            });
        else
            this.#control.deactivateSelectMode();
    }
    deactivateEdit() {
        const self = this;
        this.#control.deactivateSelectMode();
        this.#control.vertexRemove(false);
        this.#control.deactivateEditing();
        this.map.map.off(Consts.event.FEATUREREMOVE, this.#remove.bind(self));
        this.map.map.off(Consts.event.CONTROLDEACTIVATE, this.unselectFeatures.bind(self));
        this.#control.editMode = false;
    }
    #setStyle(style) {
        this.#control.setStyle(style);
    }
    deactivate() {
        this.#control.deactivate();
        this.#control2dAbortController?.abort();
    }
    destroy() {
        this.deactivate();
    }

    popCoordinate() {
        return this.#control.popCoordinate();
    }
    pushCoordinate(coordinate) {
        this.#control.pushCoordinate(coordinate);
    }
    end() {
        this.#control.end();
    }
    visibility(visible) {
        this.#control.visibility(visible);
    }
    
    #remove(event) {
        if (event.feature.wrap?.feature3D && this.#layer === event.layer) {
            this.#control.remove(event.feature.wrap.feature3D);
            this.#pickedEntity = null;
        }
    }
    unselectFeatures(evt) {
        if (this.#pickedEntity) {
            const unseletedFeature = (this.#pickedEntity._wrap?.parent || tcFeatureFromEntity(this.#pickedEntity));
            unseletedFeature.setCoordinates(tcFeatureFromEntity(this.#pickedEntity).getCoordinates({ geometryCrs: this.map.view3D.crs, crs: this.map.view3D.view2DCRS }));
            unseletedFeature.toggleSelectedStyle(false)
            //this.#selectCallback({ selected: [], deselected: [unseletedFeature.wrap.feature] });
            this.#pickedEntity = null;
        }
    }
    getSelectedFeatures() {
        if (this.#pickedEntity)
            return [this.#pickedEntity._wrap?.parent || tcFeatureFromEntity(this.#pickedEntity)];
        else
            return [];
    }
}

////////class Select3D {
////////    #control;
////////    #layer;
////////    #view;
////////    #map
////////    #selectCallback;
////////    #pickedEntity;
////////    constructor(layer, view) {
////////        const self = this;
////////        this.#layer = layer;
////////        this.#view = view;
////////        this.#control = new ThreeDDraw(this.#view.viewer, null, {
////////            dataSource: this.#view.dataSources.get(this.#layer)
////////        });
////////        this.#map = TC.Map.get(this.#view.map);
////////        this.features_ = {
////////            clear: function () {
////////            },
////////            extend: function () {
////////            }
////////        }
////////        this.#control.addEventListener('drawmodify', (evt) => {
////////            const map = TC.Map.get(self.#view.map);
////////            const oldCoordinates = evt.detail.entity._wrap.parent.getCoordinates();
////////            const newFeature = tcFeatureConstructor(evt.detail.positions, evt.detail.type)
////////            const originalFeat = evt.detail.entity._wrap.parent;
////////            originalFeat.setCoordinates(newFeature.getCoordinates({ geometryCrs: this.#view.crs, crs: this.#view.view2DCRS }));
////////            const newCoordinates = originalFeat.getCoordinates();
////////            originalFeat.setCoordinates(newFeature.getCoordinates());
////////            map.activeControl?.history.setCoordinates(originalFeat, newCoordinates, oldCoordinates);
////////            map.activeControl?.trigger(Consts.event.FEATUREMODIFY, {
////////                feature: originalFeat,
////////                layer: originalFeat.layer,
////////                geometryChanged: true
////////            });
////////            this.#view.getScene().forceRender();
////////        });
////////        this.#control.addEventListener('unselect', (e) => {
////////            const map = TC.Map.get(self.#view.map);
////////            const controlEvent = new ControlEvent(Consts.event.FEATURESUNSELECT, { control: self });
////////            controlEvent.features = e.detail.features;
////////            map.activeControl?.dispatchEvent(controlEvent);
////////        });
////////    }
////////    #remove(event){
////////        if (event.feature.wrap?.feature3D && this.#layer === event.layer) {
////////            this.#control.remove(event.feature.wrap.feature3D);
////////            this.#pickedEntity = null;
////////        }
////////    }
////////    //#unselectFeature(evt) {
////////    //    if (evt.control instanceof Modify && this.#pickedEntity) {
////////    //        const unseletedFeature = (this.#pickedEntity._wrap?.parent || tcFeatureFromEntity(this.#pickedEntity));
////////    //        unseletedFeature.setCoordinates(tcFeatureFromEntity(this.#pickedEntity).getCoordinates({ geometryCrs: this.#view.crs, crs: this.#view.view2DCRS }));
////////    //        unseletedFeature.toggleSelectedStyle(false)
////////    //        this.#selectCallback({ selected: [], deselected: [unseletedFeature.wrap.feature] });
////////    //        this.#pickedEntity = null;
////////    //    }
////////    //}
////////    activate(deleteMode) {
////////        const self = this;
////////        this.#map.on(Consts.event.FEATUREREMOVE, this.#remove.bind(self));
////////        this.#map.on(Consts.event.CONTROLDEACTIVATE, this.#unselectFeature.bind(self));
////////        this.#control.vertexRemove(deleteMode);
////////        if (this.#control.entityForEdit && !deleteMode) this.#control.activate();
////////        if (!deleteMode)
////////            this.#control.activeSelectMode(function (selectedEntity) {
////////                if (cesium.defined(selectedEntity)) {
////////                    self.#pickedEntity = selectedEntity;
////////                    self.#selectCallback({
////////                        selected: [(selectedEntity._wrap?.parent || tcFeatureFromEntity(selectedEntity)).wrap.feature], deselected: []
////////                    });
////////                }
////////            });
////////        else
////////            this.#control.deactivateSelectMode();
////////    }
////////    deactivate() {
////////        this.#control.deactivateSelectMode();
////////        this.#control.vertexRemove(false);
////////        this.#control.deactivateEditing();
////////        this.#map.off(Consts.event.FEATUREREMOVE, this.#remove);
////////        this.#map.off(Consts.event.CONTROLDEACTIVATE, this.unselectFeature);
////////        this.#control.editMode = false;
////////    }
////////    setActive (active) {
////////        active ? this.activate() : this.deactivate();
////////    }
////////    on(event, callback) {
////////        this.#selectCallback = callback;
////////    }
////////    getFeatures () {
////////        if (!this.#control.getSelectedEntity()) {
////////            return new ol.Collection();
////////        }
////////        return new ol.Collection([(this.#control.getSelectedEntity()._wrap?.parent || tcFeatureFromEntity(this.#control.getSelectedEntity())).wrap.feature]);
////////    }
////////    setSelected(entity){
////////        this.#control.setSelectedEntity(entity);
////////    }
////////    //features_: {
////////    //    clear: function () {
////////    //    },
////////    //    extend: function () {
////////    //    }
////////    //}
////////}
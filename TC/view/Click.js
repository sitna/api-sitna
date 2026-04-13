
export default class Click extends EventTarget {
    #viewer;
    constructor(viewer) {
        super();
        this.#viewer = viewer;

        this.eventHandlers = {};
        this.eventHandlers.handlerOfFeatures = new cesium.ScreenSpaceEventHandler(this.#viewer.scene.canvas);
    }
    activate() {
        const self = this;
        //bindeo de eventos
        this.eventHandlers.handlerOfFeatures.setInputAction((movement) => {            
            if(self.isActive) self._clickManagement(movement.position);
            //Si estamos anclados a una entidad ignoro los click en el terreno
            //    if (self.viewer.trackedEntity) {
            //        return;
            //    }


            //    if (self.map.activeControl instanceof Draw || self.map.activeControl instanceof Modify) {
            //        let position = self.viewer.scene.pickPosition(movement.position);
            //        arrayDePuntos[arrayDePuntos.length] = position;
            //    }
            //    else {
            //        const getFeature = (id) => {
            //            for (var layerId in self.view3D.vector2DFeatures) {
            //                if (hasOwnProperty.call(self.view3D.vector2DFeatures[layerId], id)) {
            //                    const feature2D = self
            //                        .map
            //                        .workLayers
            //                        .find(workLayer => workLayer.id === layerId)
            //                        .features
            //                        .filter(feature => id.indexOf(feature.id) > -1 && feature.showsPopup);

            //                    if (feature2D && feature2D.length > 0) {
            //                        return feature2D[0].wrap.feature3D
            //                    }
            //                }
            //            }
            //            return null;
            //        };
            //        const pickedFeature = self.viewer.pick(movement.position);

            //        if (pickedFeature) {
            //            if (pickedFeature.id && !(pickedFeature.id._wrap && pickedFeature.id._wrap.parent.layer.owner instanceof TC.control.Geolocation)) {
            //                const feature = pickedFeature.id instanceof cesium.Entity ? pickedFeature.id : getFeature(pickedFeature.id);
            //                if (feature?.id === "pegman") {
            //                    return;
            //                }
            //                //resalte 3D
            //                if (!feature._wrap) {
            //                    //esto es cuando pinchamoos en un punto que es resalte de un entidad de tipo punto
            //                    const originalPoint = pickedFeature.id.entityCollection._entities._array.find((f) => f.position === pickedFeature.id.position && f._wrap);
            //                    if (originalPoint?._wrap)
            //                        self.map.trigger(Consts.event.FEATURECLICK, { feature: originalPoint._wrap.parent });
            //                }
            //                else
            //                    self.map.trigger(Consts.event.FEATURECLICK, { feature: feature._wrap.parent });
            //            }
            //            else if (pickedFeature.primitive && pickedFeature.primitive instanceof cesium.Cesium3DTileset && pickedFeature.primitive.show) {
            //                var ray = self.viewer.camera.getPickRay(movement.position);
            //                var position = pickedFeature.primitive.pick(ray, self.viewer.scene);
            //                //const positionGround = self.viewer.scene.globe.pick(new cesium.Ray(position, cesium.Cartesian3.negate(position, new cesium.Cartesian3())), self.viewer.scene)
            //                self.view3D.getInfoOnPickedPosition.call(self, position, true);
            //            }
            //            else {
            //                getFeatureInfo();
            //            }
            //        }
            //        else
            //        {
            //            if (self.map.activeControl instanceof TC.control.Click) {
            //                if (self.map.activeControl.callback) {
            //                    const ray = self.viewer.camera.getPickRay(movement.position);
            //                    const position = self.viewer.scene.globe.pick(ray, self.viewer.scene);
            //                    const geoPosition = cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
            //                    self.map.activeControl.callback(Util.reproject([cesium.Math.toDegrees(geoPosition.longitude), cesium.Math.toDegrees(geoPosition.latitude)], self.view3D.crs, self.view3D.view2DCRS));
            //                }
            //            }
            //            else
            //                getFeatureInfo();
            //        }
            //    }
        }, cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
    deactivate() {
        //unbind de eventos
        this.eventHandlers.handlerOfFeatures.removeInputAction(cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
}

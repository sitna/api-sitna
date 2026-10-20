import Click from './Click.js';
import Consts from '../../Consts.js';
export default class Route extends Click {

    constructor(options) {
        super(options);
        this.map = options.map;
        this.twoDControl = options.twoDControl;
        this.map.view3D.linked2DControls[this.twoDControl.id] = this;
        if (this.twoDControl.clickControl) {
            this.map.view3D.linked2DControls[this.twoDControl.clickControl.id] = this;
        }        
        const self = this;
        //const moveFrontMainRoute = () => {
        //    const entity = self.twoDControl.currentRoute.wrap.feature3D;
        //    if (entity) {
        //        setTimeout(() => {
        //            const dataSource = entity.entityCollection;
        //            dataSource.remove(entity);
        //            dataSource.add(entity);
        //        }, 500);
        //    }
        //}
        self.map.dragDropInteraction.addEventListener("drop", (evt) => {
            //actualizar la coordena de la feature 2D
            const cartographic = cesium.Cartographic.fromCartesian(evt.entity.position.getValue());
            // Pasar a grados
            const longitude = cesium.Math.toDegrees(cartographic.longitude);
            const latitude = cesium.Math.toDegrees(cartographic.latitude);
            //proyectar si hace falta
            if (evt.entity._wrap?.parent) { 
                evt.entity._wrap.parent.setCoordinates(TC.Util.reproject([longitude, latitude], self.map.view3D.crs, self.map.view3D.view2DCRS))
                self.twoDControl.onMarkerDrop(evt.entity._wrap.parent);
            }
            
        });
        if (this.twoDControl.currentRoute) { 
            this.twoDControl.map.addEventListener(Consts.event.VIEWCHANGE, (evt) => {
                if (evt.detail.view === TC.Consts.view.THREED) {
                    //self.map.applyEndPromise.then(moveFrontMainRoute);
                }
            });
        }
        //this.twoDControl.addEventListener("change", moveFrontMainRoute)
    }
    activate() {        
        super.activate();
        this.isActive = true;
    }

    deactivate() {
        super.deactivate();        
        this.isActive = false;
    }
    _clickManagement(pickPosition) {
        const self = this.map;
        var ray = self.viewer.camera.getPickRay(pickPosition);
        var position = self.viewer.scene.globe.pick(ray, self.viewer.scene);
        if (position) {
            const pickedFeature = self.viewer.scene.pick(pickPosition);            
            if (pickedFeature && pickedFeature.id && this.twoDControl.routeLayer.features.includes(pickedFeature.id._wrap.parent)) {
                const routeIndex = this.twoDControl.getAlternativeRouteIndex(pickedFeature.id._wrap.parent);
                this.twoDControl.setActiveAlternative(routeIndex);
            }
            else { 
                const coordinates = cesium.Cartographic.fromCartesian(position, cesium.Ellipsoid.WGS84);
                this.twoDControl.clickControl.callback(TC.Util.reproject([cesium.Math.toDegrees(coordinates.longitude), cesium.Math.toDegrees(coordinates.latitude)], self.view3D.crs, self.view3D.view2DCRS));
            }            
        }
    }
    reset() { 

    }
}

import Util from '../../TC/Util.js';
import Cfg from '../../TC/Cfg.js';

//import { load, encode } from '@loaders.gl/core';
//import { LASLoader } from '@loaders.gl/las';
//import { Tile3DWriter } from '@loaders.gl/3d-tiles';
//import { Tileset3D } from '@loaders.gl/tiles';

const heightToMatrix = (height, tileset) => {
        const cartographic = cesium.Cartographic.fromCartesian(
            tileset.boundingSphere.center,
        );
        const surface = cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            0.0,
        );
        const offset = cesium.Cartesian3.fromRadians(
            cartographic.longitude,
            cartographic.latitude,
            height,
        );
        const translation = cesium.Cartesian3.subtract(
            offset,
            surface,
            new cesium.Cartesian3(),
        );
        return cesium.Matrix4.fromTranslation(translation);
    }
const updateHeight = (viewer, down) => {
    
    for(var i=0;i<viewer.dataSources.length;i++){
        const currentDataSource=viewer.dataSources.get(i);
        currentDataSource.entities._entities._array.forEach((entity)=>{
            if (entity.point) {
                entity.point.heightReference = down ? cesium.HeightReference.CLAMP_TO_TERRAIN : cesium.HeightReference.CLAMP_TO_3D_TILE
            }
        });
    }
    const entities = viewer.entities.values;
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].point) {
            entities[i].point.heightReference.setValue(down ? cesium.HeightReference.CLAMP_TO_TERRAIN : cesium.HeightReference.CLAMP_TO_3D_TILE);
        }
        if (entities[i].billboard) {
            entities[i].billboard.heightReference.setValue(down ? cesium.HeightReference.CLAMP_TO_TERRAIN : cesium.HeightReference.CLAMP_TO_3D_TILE);
        }
    }    
    viewer.refresh();
}
const isSunAboveHorizon = function(viewer) {
    const time = viewer.clock.currentTime;

    // Posición del sol en Earth-Fixed
    const sunICRF = cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(time);
    const icrfToFixed = cesium.Transforms.computeIcrfToFixedMatrix(time);
    const sunFixed = cesium.Matrix3.multiplyByVector(icrfToFixed, sunICRF, new cesium.Cartesian3());

    // Posición del observador
    const observer = viewer.camera.positionWC;

    // Vector hacia el sol
    const toSun = cesium.Cartesian3.normalize(
        cesium.Cartesian3.subtract(sunFixed, observer, new cesium.Cartesian3()),
        new cesium.Cartesian3()
    );

    // Vector hacia arriba en el observador
    const up = cesium.Cartesian3.normalize(observer, new cesium.Cartesian3());

    // Ángulo entre ambos vectores
    const dot = cesium.Cartesian3.dot(toSun, up);
    return dot > 0; // true si el sol está sobre el horizonte
}
const _getTilesetHeight = async function (coordinates, tileset) {
    let dataAvailable = false;
    if (!tileset.tilesLoaded) {
        await (new Promise((resolve) => {
            tileset.allTilesLoaded.addEventListener(function () {
                resolve();
            });
        }));
    }
    //chequear si la linea se superpone a un tileset
    coordinates.forEach((coordinate) => {
        let height = tileset.getHeight(cesium.Cartographic.fromDegrees(coordinate[0], coordinate[1], 0), this.viewer.scene);
        if (height) {
            dataAvailable = true;
            coordinate[2] = height;
        }
    });
    return dataAvailable;
}
const pointCloudStyles = {
    RGB: {

    },
    CLASSIFICATION: {
    },
    HEIGHT: {

    }
}

class TileSetManager {
    #measureMng;
    constructor(viewer) {
        this.viewer = viewer;
        this.tilesets = {};
        this.#measureMng = new TileSetMeasure(viewer);
    }

    isSunVisible() {
        return isSunAboveHorizon(this.viewer);
    }
    exists(url) { 
        const self = this;
        return !!self.tilesets[url];
    }
    async showHide3DTileset(url , index, height, visible = true, opacity = 100) {
        const self = this;
        if (!self.tilesets[url]) {
            const isUrl = Number.isNaN(Number(url));
            const tileset = isUrl ? await cesium.Cesium3DTileset.fromUrl((url || "") + ((url || "").match(/\.json$/gi)?"":"/tileset.json"),
                {
                    enableCollision: true, show: visible, enablePick: true,
                }) :
                await cesium.Cesium3DTileset.fromIonAssetId(url,
                    { enableCollision: false, show: visible, enablePick: true });
            
            tileset.cacheBytes = 1024 * 1024 * 1024; // 512 MB
            tileset.maximumCacheOverflowBytes = 512 * 1024 * 1024; // 256 MB

            if (height)
                tileset.modelMatrix = heightToMatrix(height, tileset);                        
            self.tilesets[url] = { tileset, opacity };
            if (opacity !== 100) { 
                tileset.style = new cesium.Cesium3DTileStyle({
                    //color: 'rgba(255,255,255, ' + opacity / 100 + ')'
                    color: 'rgba(${red},${green},${blue}, ' + opacity / 100 + ')'
                });
            }
            self.heightReference = cesium.HeightReference.CLAMP_TO_3D_TILE;            
            self.viewer.scene.primitives.add(tileset, Math.min(index, self.viewer.scene.primitives.length));
            

        } else {
            self.tilesets[url].tileset.show = visible; // !self.tilesets[url].tileset.show;            
            self.heightReference = Object.keys(self.tilesets).some((key) => self.tilesets[key].tileset.show) ? cesium.HeightReference.CLAMP_TO_3D_TILE : cesium.HeightReference.CLAMP_TO_TERRAIN;                        
        }        
        updateHeight(self.viewer, !self.tilesets[url].tileset.show);
        if (self.tilesets[url].tileset.tilesLoaded)
            return Promise.resolve(self.tilesets[url].tileset);
        else { 

            const boundingSphere = self.tilesets[url].tileset.boundingSphere;
            const cullingVolume = self.viewer.camera.frustum.computeCullingVolume(self.viewer.camera.position, self.viewer.camera.direction, self.viewer.camera.up);
            if (cullingVolume.computeVisibility(boundingSphere) !== -1 /*cesium.Intersect.OUTSIDE*/) { 
                return new Promise((resolve) => {
                    self.tilesets[url].tileset.allTilesLoaded.addEventListener(function () {
                        //if (tileset.pointCloudShading)
                        //    tileset.style = cesiumStyle
                        resolve(self.tilesets[url].tileset);
                    });
                });                
            }
            else
                return Promise.resolve(self.tilesets[url].tileset);
        }
            
        //self.viewer.scene.requestRender();
    }    
    zoomTo3DTileset (url) {
    if (this.tilesets[url]) {
        this.viewer.zoomTo(this.tilesets[url].tileset);
    }
    }
    showHideShadow(show) {
        this.viewer.shadows = show;
        this.viewer.scene.requestRender();
    }
    opacity3DTileset(url, opacity) {
        if (this.tilesets[url]) {
            this.tilesets[url].opacity = opacity
            this.tilesets[url].tileset.style = new cesium.Cesium3DTileStyle({
                //color: 'rgba(255,255,255, ' + opacity / 100 + ')'
                color: 'rgba(${red},${green},${blue}, ' + opacity / 100 + ')'
            });
            this.viewer.scene.requestRender();
        }
    }
    set3DTilesetHeight (url, height) {
        if (this.tilesets[url])
            this.tilesets[url].tileset.modelMatrix = heightToMatrix(height, this.tilesets[url].tileset);
    }
    setPointCloudStyle(url, style) {
        if (this.tilesets[url]) {
            if (this.tilesets[url].tileset.style) {
                this.tilesets[url].tileset.style = this.tilesets[url].style = new cesium.Cesium3DTileStyle(Object.assign({}, this.tilesets[url].tileset.style.style, style));
            }
            else {
                this.tilesets[url].style = this.tilesets[url].tileset.style = new cesium.Cesium3DTileStyle({
                    style
                });
            }
            this.viewer.refresh();
        }
    }
    set3DTilesetPointSize(url, pointSize) {
        if (this.tilesets[url]) { 
            this.tilesets[url].pointSize = pointSize
            if (this.tilesets[url].tileset.style) {
                this.tilesets[url].tileset.style = this.tilesets[url].style = new cesium.Cesium3DTileStyle(Object.assign({}, this.tilesets[url].tileset.style.style, { pointSize: pointSize }));
            }
            else {
                this.tilesets[url].style = this.tilesets[url].tileset.style = new cesium.Cesium3DTileStyle({
                    pointSize: pointSize
                });
            }
            this.viewer.refresh();
        }
            
    }
    setViewerTime(dateTimeISO) {
        this.viewer.clock.currentTime = cesium.JulianDate.fromIso8601(dateTimeISO);
        this.viewer.scene.requestRender();
    }    
    async getTileSetHeight(coordinates,tileset) {
        let dataAvailable = false;
        if (!tileset)
            await Promise.all(Object.keys(this.tilesets).map(async (key) => {
                if (this.tilesets[key].tileset.show)
                    dataAvailable = await _getTilesetHeight.apply(this, [coordinates, this.tilesets[key].tileset]);
            }))
        else if (tileset.tileset.show) {
            dataAvailable = await _getTilesetHeight.apply(this, [coordinates, tileset.tileset]);            
        }            
        return dataAvailable;
    }
    refresh(viewer) {
        this.viewer = viewer;
        let i = 0;
        for (let key in this.tilesets) {
            const current = this.tilesets[key];            
            this.viewer.readyPromise.then(() => {
                const visibility = this.tilesets[key].tileset.show;
                delete this.tilesets[key];
                this.showHide3DTileset(key, i++, current.height, visibility, current.opacity);
            })
        }
    }    
    
}

class TileSetMeasure {
    #active;
    #startCoordinate;    
    #endCoordinate;
    #groundCoordinate;
    #horizontalLine;
    #eventHandler;
    #point1;
    #point2;
    #height;
    #measure;
    constructor(viewer) {
        this.viewer = viewer;    
        this.#active = false;
        this.#eventHandler = new cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    }
    activate(mode) {
        this.#active = true;
        switch (mode) {
            case tileSetMeasureMode.height:
                break;
            case tileSetMeasureMode.width:
                break;
        }
        this.#eventHandler.setInputAction(this.#begin.bind(this), cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.#eventHandler.setInputAction(this.#move.bind(this), cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    deactivate() {
        this.viewer.scene.requestRenderMode = true;
        this.#startCoordinate=null;
        this.#endCoordinate = null;
        this.#groundCoordinate = null;
        this.#measure = null;
    }
    #begin(movement) {
        const pickedFeature = this.viewer.scene.pick(movement.position);
        if (pickedFeature && pickedFeature.primitive && pickedFeature.primitive instanceof cesium.Cesium3DTileset && pickedFeature.primitive.show) {             
            const cartographic = cesium.Cartographic.fromCartesian(this.viewer.scene.pickPosition(movement.position));
            const longitude = cesium.Math.toDegrees(cartographic.longitude);
            const latitude = cesium.Math.toDegrees(cartographic.latitude);
            this.#height = cartographic.height;
            const point1 = cesium.Cartesian3.fromDegrees(longitude, latitude, this.#height);
            //const point2 = cesium.Cartesian3.fromDegrees(longitude + 0.001, latitude, height); // desplazamiento este-oeste
            this.#startCoordinate = point1;
            const self = this;
            this.viewer.scene.requestRenderMode = false;

            this.#horizontalLine = this.viewer.entities.add({
                polyline: {
                    positions: new cesium.CallbackProperty(function () {
                        if (self.#startCoordinate && self.#endCoordinate) {
                            return [self.#startCoordinate, self.#endCoordinate];
                        }
                        return [];
                    }, false),

                    width: 3,
                    material: cesium.Color.YELLOW
                }
            });
            this.viewer.entities.add({
                polyline: {
                    positions: new cesium.CallbackProperty(function () {
                        if (self.#endCoordinate) {
                            return [self.#endCoordinate, self.#groundCoordinate];
                        }
                        return [];
                    }, false),

                    width: 1,
                    material: cesium.Color.YELLOW
                }
            });            
            this.viewer.entities.add({
                position: new cesium.CallbackProperty(function () {
                    if (self.#endCoordinate) {
                        return self.#endCoordinate;
                    }
                    return null;
                }, false),
                label: {
                    // This callback updates the length to print each frame.
                    text: new cesium.CallbackProperty(function () {
                        if (self.#measure) {
                            return Util.formatNumber(self.#measure, Cfg.locale) + " m";
                        }
                        return "";
                    }, false),
                    font: "16px sans-serif",
                    fillColor: cesium.Color.YELLOW,
                    outlineColor: cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: cesium.LabelStyle.FILL_AND_OUTLINE,
                    horizontalOrigin: cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new cesium.Cartesian2(0, -20)
                }
            });
        }
    }    
    #move(movement) {
        if (this.#startCoordinate) { 
            const pickPosition = this.viewer.scene.pickPosition(movement.endPosition);
            if (pickPosition) { 
                const cartographic = cesium.Cartographic.fromCartesian(this.viewer.scene.pickPosition(movement.endPosition));
                const longitude = cesium.Math.toDegrees(cartographic.longitude);
                const latitude = cesium.Math.toDegrees(cartographic.latitude);
                this.#endCoordinate = cesium.Cartesian3.fromDegrees(longitude, latitude, this.#height);
                this.#groundCoordinate = cesium.Cartesian3.fromDegrees(longitude, latitude, 0);                
                const ray = new cesium.Ray(this.#endCoordinate, cesium.Cartesian3.normalize(
                    cesium.Cartesian3.subtract(this.#groundCoordinate, this.#endCoordinate, new cesium.Cartesian3()),
                    new cesium.Cartesian3()
                ));
                const result = this.viewer.scene.pickFromRay(ray);
                this.#measure = this.#height - cesium.Cartographic.fromCartesian(result.position).height;
                //this.#horizontalLine.label.text = (this.#height - cesium.Cartographic.fromCartesian(result.position).height) + " m";
            }
            
        }
        
    }
    get active() {
        return this.#active;
    }
    
}
const tileSetMeasureMode = {
    height: "tc-3D-meas-height",
    width: "tc-3D-meas-width"
}
//export { TileSetMeasure };
export default TileSetManager;
export { pointCloudStyles as PointCloudStyles };


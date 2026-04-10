
window.CESIUM_BASE_URL = TC.apiLocation + 'lib/cesium/build/';

import {
    ApproximateTerrainHeights
    , Billboard
    , BillboardCollection
    , BillboardGraphics
    , BoundingSphere
    , CallbackProperty
    , Camera
    , Cartesian2
    , Cartesian3
    , Cartographic
    , CesiumTerrainProvider
    , CircleGeometry
    , Clock
    , ClockRange
    , ClockStep
    , Color
    , ColorGeometryInstanceAttribute
    , ColorMaterialProperty
    , combine
    , clone
    , Credit
    , CzmlDataSource
    , Cesium3DTile
    , Cesium3DTileset
    , Cesium3DTileStyle
    , CustomDataSource
    , CustomHeightmapTerrainProvider
    , DataSourceCollection
    , DataSourceDisplay    
    , DeveloperError
    , EasingFunction
    , Ellipsoid
    , EllipsoidGeodesic
    , EllipsoidTerrainProvider
    , EllipsoidTangentPlane 
    , Entity
    , Event
    , EventHelper
    , GeographicTilingScheme
    , GeometryInstance
    , getImagePixels
    , Globe
    , GpxDataSource
    , GroundPrimitive
    , HeadingPitchRange
    , HeadingPitchRoll 
    , HeightReference
    , HeightmapTerrainData
    , HorizontalOrigin
    , ImageryLayer
    , ImageryState
    , Ion
    , IntersectionTests
    , JulianDate
    , LabelStyle
    , Math
    , Matrix3
    , Matrix4
    , NearFarScalar
    , PinBuilder
    , PolygonGeometry
    , PolygonHierarchy
    , PolygonPipeline
    , PolylineDashMaterialProperty
    , PolylineOutlineMaterialProperty    
    , Property
    , PropertyBag
    , Quaternion
    , QuantizedMeshTerrainData
    , Ray
    , Rectangle
    , RequestScheduler
    , RequestState
    , Resource
    , RuntimeError
    , Simon1994PlanetaryPositions
    , ScreenSpaceEventHandler
    , ScreenSpaceEventType
    , SkyAtmosphere
    , SkyBox
    , Terrain
    , TerrainProvider
    , TileCoordinatesImageryProvider
    , TileProviderError
    , TimeIntervalCollection
    , createTaskProcessorWorker
    , Transforms
    , TrustedServers
    , VerticalOrigin
    , Viewer
    , WebMapServiceImageryProvider
    , WebMapTileServiceImageryProvider
    , defined
    , deprecationWarning
    , sampleTerrainMostDetailed
    , Request
    , RequestType
    , TimeInterval
    , VERSION

} from 'cesium';

//import CesiumTerrainProvider from './CesiumTerrainProvider.js';

const cesium = {

    ApproximateTerrainHeights
    , Billboard
    , BillboardCollection
    , BillboardGraphics
    , BoundingSphere
    , CallbackProperty
    , Camera
    , Cartesian2
    , Cartesian3
    , Cartographic
    , Cesium3DTileStyle
    , CesiumTerrainProvider
    , CircleGeometry
    , Clock
    , ClockRange
    , ClockStep
    , Color
    , ColorGeometryInstanceAttribute
    , ColorMaterialProperty
    , combine
    , clone
    , Credit
    , CzmlDataSource
    , Cesium3DTile
    , Cesium3DTileset
    , CustomDataSource
    , CustomHeightmapTerrainProvider
    , DataSourceCollection
    , DataSourceDisplay    
    , DeveloperError
    , EasingFunction
    , Ellipsoid
    , EllipsoidGeodesic
    , EllipsoidTerrainProvider
    , EllipsoidTangentPlane 
    , Entity
    , Event
    , EventHelper
    , GeographicTilingScheme
    , GeometryInstance
    , getImagePixels
    , Globe
    , GpxDataSource
    , GroundPrimitive
    , HeadingPitchRange
    , HeadingPitchRoll 
    , HeightReference
    , HeightmapTerrainData
    , HorizontalOrigin
    , ImageryLayer
    , ImageryState
    , Ion
    , IntersectionTests
    , JulianDate
    , LabelStyle
    , Math
    , Matrix3
    , Matrix4
    , NearFarScalar
    , PinBuilder
    , PolygonGeometry
    , PolygonHierarchy
    , PolygonPipeline
    , PolylineDashMaterialProperty
    , PolylineOutlineMaterialProperty
    , Property
    , PropertyBag
    , Quaternion
    , QuantizedMeshTerrainData
    , Ray
    , Rectangle
    , RequestScheduler
    , RequestState
    , Resource
    , RuntimeError
    , Simon1994PlanetaryPositions
    , ScreenSpaceEventHandler
    , ScreenSpaceEventType
    , SkyAtmosphere
    , SkyBox
    , Terrain
    , TerrainProvider
    , TileCoordinatesImageryProvider
    , TileProviderError
    , TimeIntervalCollection
    , createTaskProcessorWorker
    , Transforms
    , TrustedServers
    , VerticalOrigin
    , Viewer
    , WebMapServiceImageryProvider
    , WebMapTileServiceImageryProvider
    , defined
    , deprecationWarning
    , sampleTerrainMostDetailed
    , Request
    , RequestType
    , TimeInterval
    , VERSION
};

const TOO_MANY_PARALLEL_REQUESTS = "Too many parallel requests, so postpone loading tile";
window.cesium = cesium;

/* sobrescribimos y extendemos lo necesario para que todas las peticiones pasen por el algoritmo de proxificación */
// requerido para añadir la referencia a la capa TC
cesium.Resource.prototype._clone = cesium.Resource.prototype.clone;
cesium.Resource.prototype.clone = function () {
    let cloned = cesium.Resource.prototype._clone.apply(this, arguments);
    //cloned.headers["credentials"] = "omit";
    cloned.tcLayer = this.tcLayer;
    if (this.tcLayer && this.tcLayer.time ) {
        const from = this.tcLayer.getTime().split("/")[0];
        const to = this.tcLayer.getTime().split("/")[1] || null;
        cloned._queryParameters.time = new Date(Number.parseFloat(from)).toISOString() + (to ?"/" + new Date(Number.parseFloat(to)).toISOString() : "");
    }
    return cloned;
};

// requerido para gestionar la promesa rechaza directamente que vamos a retornar en lugar del undefined que retorna cesium en fetchImage
cesium.ImageryLayer.prototype._requestImagery = function (imagery) {
    const imageryProvider = this._imageryProvider;

    const that = this;

    function success(image) {
        if (!defined(image)) {
            return failure();
        }

        imagery.image = image;
        imagery.state = cesium.ImageryState.RECEIVED;
        imagery.request = undefined;

        cesium.TileProviderError.reportSuccess(that._requestImageError);
    }
    function failure(e) {

        if (typeof e === 'string' && e === TOO_MANY_PARALLEL_REQUESTS) {
            // Too many parallel requests, so postpone loading tile.
            imagery.state = cesium.ImageryState.UNLOADED;
            imagery.request = undefined;
            return;
        } else if (e.status && e.status.toString() === "200") {
            // si llega alguna excepción en XML como cuerpo de la petición de una imagen, pasamos de ella
            imagery.state = cesium.ImageryState.FAILED;
            imagery.request = undefined;
            return;
        }

        if (imagery.request.state === RequestState.CANCELLED) {
            // Cancelled due to low priority - try again later.
            imagery.state = ImageryState.UNLOADED;
            imagery.request = undefined;
            return;
        }

        // Initially assume failure. An error handler may retry, in which case the state will
        // change to TRANSITIONING.
        imagery.state = ImageryState.FAILED;
        imagery.request = undefined;

        const message = `Failed to obtain image tile X: ${imagery.x} Y: ${imagery.y} Level: ${imagery.level}.`;
        that._requestImageError = cesium.TileProviderError.reportError(
            that._requestImageError,
            imageryProvider,
            imageryProvider.errorEvent,
            message,
            imagery.x,
            imagery.y,
            imagery.level,
            e,
        );
        if (that._requestImageError.retry) {
            doRequest();
        }
    }

    function doRequest() {
        const request = new Request({
            throttle: false,
            throttleByServer: true,
            type: RequestType.IMAGERY,
        });
        imagery.request = request;
        imagery.state = ImageryState.TRANSITIONING;
        const imagePromise = imageryProvider.requestImage(
            imagery.x,
            imagery.y,
            imagery.level,
            request,
        );

        if (!cesium.defined(imagePromise)) {
            // Too many parallel requests, so postpone loading tile.
            imagery.state = ImageryState.UNLOADED;
            imagery.request = undefined;
            return;
        }

        if (!cesium.defined(imageryProvider.getTileCredits)) {
            imagery.credits = imageryProvider.getTileCredits(
                imagery.x,
                imagery.y,
                imagery.level,
            );
        }

        imagePromise
            .then(function (image) {                
                success(image);
            })
            .catch(function (e) {
                failure(e);
            });
    }

    doRequest();
};

// requerido para que pasar por el algoritmo de proxificación
cesium.Resource.prototype._fetchImage = cesium.Resource.prototype.fetchImage;

cesium.Resource.prototype.fetchImage = function () {
    if (this.tcLayer) {
        let self = this;
        let options = arguments;

        let deferred = Promise.withResolvers();

        this.tcLayer.getWebGLUrl.call(this.tcLayer, this.url)
            .then(function (params) {
                self.url = params.url;
                let image;
                if (params.image) {
                    image = new Promise((resolve) => { resolve(params.image) })
                    image.then(deferred.resolve);
                }
                else {
                    self.request.throttleByServer = false;
                    cesium.Resource.prototype._fetchImage.apply(self, options).then(deferred.resolve, deferred.reject);
                }
            })
            .catch(function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    } else {
        return cesium.Resource.prototype._fetchImage.apply(this, arguments);
    }
};
cesium.Entity.prototype.setStyle = function (style) {
    if (this.point) {
        this.point.color = cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.fillOpacity);//cesium.Color.fromBytes.apply(this, [...style.fillColor.slice(0, 3), 255 * style.fillColor[3]]);
        this.point.pixelSize = (style.radius - style.strokeWidth) * 2;//(style.radius * 2) - style.strokeWidth / 2;
        this.point.outlineWidth = style.strokeWidth;
        this.point.outlineColor = cesium.Color.fromCssColorString(style.strokeColor);
    }
    if (this.polygon) {
        if (!this.properties)
            this.properties = new cesium.PropertyBag();
        if (this.properties.hasProperty("fillOpacity"))
            this.properties["fillOpacity"].setValue(style.fillOpacity);
        else
            this.properties.addProperty("fillOpacity", style.fillOpacity);
        if (this.properties.hasProperty("fillColor"))
            this.properties["fillColor"].setValue(style.fillColor);
        else
            this.properties.addProperty("fillColor", style.fillColor);
        //this.polygon.material = cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.fillOpacity);
        //this.polygon.material = new cesium.ColorMaterialProperty(cesium.Color.fromCssColorString(style.fillColor).withAlpha(style.fillOpacity));
        if (!(this.polygon.material.color instanceof cesium.CallbackProperty)) {
            this.polygon.material.color = new cesium.CallbackProperty(() => {
                return cesium.Color.fromCssColorString(this.properties["fillColor"].getValue()).withAlpha(this.properties["fillOpacity"].getValue());
            }, false);
        }
        
    }
    if (this.polyline) {
        //this.polyline.width = style.strokeWidth;
        this.polyline.width = new cesium.CallbackProperty(() => {
            if (this.highLighted)
                return style.strokeWidth + (4);
            else
                return style.strokeWidth;

        }, false);
        if (style.strokeColor) {
            const strokeColor = cesium.Color.fromCssColorString(style.strokeColor);
            this.polyline.material = new cesium.PolylineDashMaterialProperty(this.highLighted ?
                Object.assign({}, this.polyline.material.getValue(), {
                    color: strokeColor,
                    gapColor: new cesium.Color(window.Math.abs(strokeColor.red - 1), window.Math.abs(strokeColor.green - 1), window.Math.abs(strokeColor.blue - 1), strokeColor.alpha),
                    dashLength: 30
                }) :
                Object.assign({}, this.polyline.material.getValue(), {
                    color: cesium.Color.fromCssColorString(style.strokeColor),
                    gapColor: cesium.Color.fromCssColorString(style.strokeColor),
                    dashLength: 30
                })
            );
        }
    }
    if (this.billboard) {
        this.billboard.image = style.url;
        this.billboard.width = style.width;
        this.billboard.height = style.height;
    }    
}

cesium.Entity.prototype.setLabel = function (style) {
    this.position = this.point ? this.position.getValue() : cesium.BoundingSphere.fromPoints(this.polyline.positions.getValue()).center;

    this.label = style ? {
        outlineColor: cesium.Color.fromCssColorString(style.outlineColor),
        fillColor: cesium.Color.fromCssColorString(style.fontColor),
        outlineWidth: style.outlineWidth,
        font: style.font,
        text: style.text,
        style: cesium.LabelStyle.FILL_AND_OUTLINE,
        heightReference: cesium.HeightReference.CLAMP_TO_GROUND,
        pixelOffset: this.polyline ? new cesium.Cartesian2(0, 0) : new cesium.Cartesian2(0, -25)
    } : null;
}

const isPointInPolygon = function (point, polygon) {
    if (!polygon || !point)
        return false;
    point = cesium.Ellipsoid.WGS84.cartesianToCartographic(point);
    polygon = polygon.map(p => cesium.Ellipsoid.WGS84.cartesianToCartographic(p))
    const x = point.longitude, y = point.latitude;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude, yi = polygon[i].latitude;
        const xj = polygon[j].longitude, yj = polygon[j].latitude;

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

cesium.Viewer.prototype.pick = function (position) {
    const drillBabyDrill = this.scene.drillPick(position);
    if (drillBabyDrill.length) {
        const pickPosition = this.scene.pickPosition(position);
        return drillBabyDrill.filter(d => !d.id?.polygon || isPointInPolygon(pickPosition, d.id?.polygon?.hierarchy.getValue().positions))[0] || false;
    }
}

cesium.Viewer.prototype.refresh = function () {    
    if (this && this.scene) { 
        this.scene.requestRender();
        setTimeout(() => {
            if(!this.isDestroyed())this.scene.forceRender(cesium.JulianDate.now());
        }, 100);
    }
        
}
cesium.Viewer.prototype.areaPlanarFromEntityPolygon = function(positions) {

    if (!positions || positions.length < 3) return 0;

    // Plano tangente local en torno al primer vértice (o el centroide si lo calculas)
    const ellipsoid = this.scene.globe.ellipsoid;
    const tangentPlane = new cesium.EllipsoidTangentPlane(positions[0], ellipsoid);

    // Proyectar a 2D (x,y) en el plano
    const points2D = positions.map(p => {
        //const projected = tangentPlane.projectPointOntoPlane(p);
        //const local = tangentPlane.ellipsoid.cartesianToCartographic(projected);
        // Convertir a coordenadas del plano (u,v)
        const uv = tangentPlane.projectPointToNearestOnPlane(p);
        // uv es un Cartesian2 en metros
        return uv;
    });

    // Área por fórmula del zapato (shoelace)
    let area = 0.0;
    for (let i = 0, j = points2D.length - 1; i < points2D.length; j = i++) {
        area += (points2D[j].x * points2D[i].y - points2D[i].x * points2D[j].y);
    }
    area = window.Math.abs(area) * 0.5; // en m²
    return area;
}

cesium.Entity.prototype.getStyle = function () {
    const returnValue = {}
    if (this.polygon) {
        Object.assign(returnValue, /*TC.Cfg.styles.polygon,*/ {
            fillColor: this.polygon.material.getValue().color.toCssHexString().substring(0, 7),
            fillOpacity: this.polygon.material.getValue().color.alpha,
            strokeColor: this.polyline.material.getValue().color.toCssHexString().substring(0, 7),
            strokeWidth: this.highLighted ? this.polyline.width.getValue() - (2 * 2) : this.polyline.width.getValue()
        });
    }
    else if (this.polyline) {
        Object.assign(returnValue, /*TC.Cfg.styles.line,*/ {
            strokeColor: this.polyline.material.getValue().color.toCssHexString().substring(0, 7),
            strokeWidth: this.highLighted ? this.polyline.width.getValue() - (2 * 2) : this.polyline.width.getValue()
        });
    }
    else if (this.point) {
        Object.assign(returnValue, /*TC.Cfg.styles.point,*/ {
            fillColor: this.point.color.getValue().toCssHexString().substring(0, 7),
            fillOpacity: this.point.color.getValue().alpha,
            //fontSize
            strokeColor: this.point.outlineColor.getValue().toCssHexString().substring(0, 7),
            strokeWidth: this.point.outlineWidth.getValue(),
            radius: (this.point.pixelSize.getValue() / 2) + this.point.outlineWidth.getValue()
            //radius: this.point.pixelSize.getValue() / 2
        });
    }
    //else if (this.billboard) {

    //}
    if (this.label) {
        returnValue["fontColor"] = this.label?.fillColor?.getValue().toCssHexString();
        returnValue["font"] = this.label?.font?.getValue();
    }

    return returnValue;
}

cesium.CustomDataSource.prototype.refresh = function () {
    this.show = false;
    this.show = true;
}   

export default cesium;
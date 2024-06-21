
window.CESIUM_BASE_URL = TC.apiLocation + 'lib/cesium/build/';

import {
    ApproximateTerrainHeights
    , Billboard
    , BillboardCollection
    , BoundingSphere
    , CallbackProperty
    , Camera
    , Cartesian2
    , Cartesian3
    , Cartographic
    , CesiumTerrainProvider
    , CircleGeometry
    , ClockRange
    , ClockStep
    , Color
    , ColorGeometryInstanceAttribute
    , ColorMaterialProperty
    , combine
    , Credit
    , CzmlDataSource
    , CustomDataSource
    , DataSourceCollection
    , DataSourceDisplay
    , DeveloperError
    , EasingFunction
    , Ellipsoid
    , EllipsoidGeodesic
    , EllipsoidTerrainProvider
    , Entity
    , Event
    , EventHelper
    , GeographicTilingScheme
    , GeometryInstance
    , Globe
    , GroundPrimitive
    , HeadingPitchRange
    , HeightReference
    , HeightmapTerrainData
    , HorizontalOrigin
    , ImageryLayer
    , ImageryState
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
    , Property
    , Quaternion
    , Ray
    , Rectangle
    , RequestScheduler
    , RequestState
    , Resource
    , RuntimeError
    , ScreenSpaceEventHandler
    , ScreenSpaceEventType
    , SkyAtmosphere
    , SkyBox
    , TerrainProvider
    , TileCoordinatesImageryProvider
    , TileProviderError
    , TimeIntervalCollection
    , Transforms
    , TrustedServers
    , VerticalOrigin
    , Viewer
    , WebMapServiceImageryProvider
    , WebMapTileServiceImageryProvider
    , when
    , defaultValue
    , defined
    , deprecationWarning
    , sampleTerrainMostDetailed
    , Request
    , RequestType
    , TimeInterval
    , VERSION

} from 'cesium';



const cesium = {

    ApproximateTerrainHeights
    , Billboard
    , BillboardCollection
    , BoundingSphere
    , CallbackProperty
    , Camera
    , Cartesian2
    , Cartesian3
    , Cartographic
    , CesiumTerrainProvider
    , CircleGeometry
    , ClockRange
    , ClockStep
    , Color
    , ColorGeometryInstanceAttribute
    , ColorMaterialProperty
    , combine
    , Credit
    , CzmlDataSource
    , CustomDataSource
    , DataSourceCollection
    , DataSourceDisplay
    , DeveloperError
    , EasingFunction
    , Ellipsoid
    , EllipsoidGeodesic
    , EllipsoidTerrainProvider
    , Entity
    , Event
    , EventHelper
    , GeographicTilingScheme
    , GeometryInstance
    , Globe
    , GroundPrimitive
    , HeadingPitchRange
    , HeightReference
    , HeightmapTerrainData
    , HorizontalOrigin
    , ImageryLayer
    , ImageryState
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
    , Property
    , Quaternion
    , Ray
    , Rectangle
    , RequestScheduler
    , RequestState
    , Resource
    , RuntimeError
    , ScreenSpaceEventHandler
    , ScreenSpaceEventType
    , SkyAtmosphere
    , SkyBox
    , TerrainProvider
    , TileCoordinatesImageryProvider
    , TileProviderError
    , TimeIntervalCollection
    , Transforms
    , TrustedServers
    , VerticalOrigin
    , Viewer
    , WebMapServiceImageryProvider
    , WebMapTileServiceImageryProvider
    , when
    , defaultValue
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

if (!cesium.WCSTerrainProvider) {
    //TC.syncLoadJS(TC.apiLocation + 'TC/cesium/mergeTerrainProvider/MergeTerrainProvider');
    import('./mergeTerrainProvider/MergeTerrainProvider').then(function (MergeTerrainProvider) {
        cesium.MergeTerrainProvider = MergeTerrainProvider.default;
    })
}

/* sobrescribimos y extendemos lo necesario para que todas las peticiones pasen por el algoritmo de proxificación */
// requerido para añadir la referencia a la capa TC
cesium.Resource.prototype._clone = cesium.Resource.prototype.clone;
cesium.Resource.prototype.clone = function () {
    let cloned = cesium.Resource.prototype._clone.apply(this, arguments);
    cloned.tcLayer = this.tcLayer;
    return cloned;
};

// requerido para gestionar la promesa rechaza directamente que vamos a retornar en lugar del undefined que retorna cesium en fetchImage
cesium.ImageryLayer.prototype.__requestImagery = cesium.ImageryLayer.prototype._requestImagery;
cesium.ImageryLayer.prototype._requestImagery = function (imagery) {
    var imageryProvider = this._imageryProvider;

    var that = this;

    function success(image) {
        if (!cesium.defined(image)) {
            return failure();
        }

        imagery.image = image;
        imagery.state = cesium.ImageryState.RECEIVED;
        imagery.request = undefined;

        cesium.TileProviderError.handleSuccess(that._requestImageError);
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

        if (imagery.request.state === cesium.RequestState.CANCELLED) {
            // Cancelled due to low priority - try again later.
            imagery.state = cesium.ImageryState.UNLOADED;
            imagery.request = undefined;
            return;
        }

        // Initially assume failure.  handleError may retry, in which case the state will
        // change to TRANSITIONING.
        imagery.state = cesium.ImageryState.FAILED;
        imagery.request = undefined;

        var message =
            "Failed to obtain image tile X: " +
            imagery.x +
            " Y: " +
            imagery.y +
            " Level: " +
            imagery.level +
            ".";
        that._requestImageError = cesium.TileProviderError.handleError(
            that._requestImageError,
            imageryProvider,
            imageryProvider.errorEvent,
            message,
            imagery.x,
            imagery.y,
            imagery.level,
            doRequest,
            e
        );
    }

    function doRequest() {
        var request = new cesium.Request({
            throttle: false,
            throttleByServer: true,
            type: cesium.RequestType.IMAGERY,
        });
        imagery.request = request;
        imagery.state = cesium.ImageryState.TRANSITIONING;
        var imagePromise = imageryProvider.requestImage(
            imagery.x,
            imagery.y,
            imagery.level,
            request
        );

        // cesium hace lo siguiente y es lo que no nos encaja y que nosotros gestionamos en failure
        if (!cesium.defined(imagePromise)) {
            // Too many parallel requests, so postpone loading tile.
            imagery.state = cesium.ImageryState.UNLOADED;
            imagery.request = undefined;
            return;
        }

        if (cesium.defined(imageryProvider.getTileCredits)) {
            imagery.credits = imageryProvider.getTileCredits(
                imagery.x,
                imagery.y,
                imagery.level
            );
        }

        cesium.when(imagePromise, success, failure);
    }

    doRequest();
};

// requerido para que pasar por el algoritmo de proxificación
cesium.Resource.prototype._fetchImage = cesium.Resource.prototype.fetchImage;
cesium.Resource.prototype.fetchImage = function () {
    if (this.tcLayer) {
        let self = this;
        let options = arguments;

        let deferred = cesium.when.defer();

        this.tcLayer.getWebGLUrl.call(this.tcLayer, this.url)
            .then(function (params) {
                self.url = params.url;
                let image = params.image ? new Promise((resolve) => { resolve(params.image) }) : cesium.Resource.prototype._fetchImage.apply(self, options);
                if (image) {
                    image.then(deferred.resolve);
                } else {
                    deferred.reject(TOO_MANY_PARALLEL_REQUESTS);
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

export default cesium;
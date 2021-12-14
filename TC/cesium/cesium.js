; (function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['../../lib/cesium/build/cesium-sitna'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../../lib/cesium/build/cesium-sitna'));
    } else {
        root.cesium = factory(root.cesium);
    }

})(this, function (cesium) {

    window.CESIUM_BASE_URL = TC.apiLocation + 'lib/cesium/build/';

    const TOO_MANY_PARALLEL_REQUESTS = "Too many parallel requests, so postpone loading tile";

    if (!cesium.WCSTerrainProvider) {
        TC.syncLoadJS(TC.apiLocation + 'TC/cesium/mergeTerrainProvider/MergeTerrainProvider');
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
                .then(function (url) {
                    self.url = url;
                    let image = cesium.Resource.prototype._fetchImage.apply(self, options);
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

    return cesium;
});
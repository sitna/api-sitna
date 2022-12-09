/**
  * Opciones de servicio de obtención de elevaciones de puntos.
  * @typedef ElevationServiceOptions
  * @see ElevationOptions
  * @property {string[]} [allowedGeometryTypes] - Si se establece, indica para qué geometrías se van a hacer consultas 
  * de elevación al servicio. Esto es conveniente por ejemplo si el servicio solo permite obtener elevaciones de un punto simple,
  * invalidándolo para la consulta si la geometría es un polígono o una línea. Los elementos del array tienen que ser cadenas 
  * cuyos valores deben ser los definidos por {@link SITNA.Consts.geom}.
  * @property {string} [googleMapsKey] - Valor de una clave válida de la API de Google Maps. Solamente es necesaria cuando 
  * el valor de la propiedad `name` es {@link SITNA.Consts.elevationService.GOOGLE}.
  *
  * Puede obtener más información en el [sitio para desarrolladores de Google](https://developers.google.com/maps/documentation/javascript/get-api-key).
  * @property {string} name - Nombre del servicio que queremos utilizar. Debe tener un valor de {@link SITNA.Consts.elevationService}.
  * @property {string} [url] - URL del servicio. Cada servicio de elevaciones de puntos tiene asignada una URL por defecto, 
  * así que rara vez será necesario establecer esta propiedad.
  */

TC.tool = TC.tool || {};

TC.tool.ElevationService = function (options) {
    const self = this;
    self.options = options || {};
    self.url = self.options.url;
    self.process = self.options.process;
    self.minimumElevation = self.options.minimumElevation;
    if (TC.Util.isFunction(self.options.request)) {
        self.request = self.options.request;
    }
    if (TC.Util.isFunction(self.options.parseResponse)) {
        self.parseResponse = self.options.parseResponse;
    }
};

(function () {
    const toolProto = TC.tool.ElevationService.prototype;

    toolProto.getElevation = function (options) {
        const self = this;
        options = options || {};
        if (options.resolution === undefined) {
            options.resolution = self.options.resolution;
        }
        if (options.sampleNumber === undefined) {
            options.sampleNumber = self.options.sampleNumber;
        }
        return new Promise(function (resolve, reject) {
            TC.loadJS(
                !TC.Geometry,
                TC.apiLocation + 'TC/Geometry',
                function () {
                    self
                        .request(options)
                        .then(function (response) {
                            resolve((options.responseCallback || self.parseResponse).call(self, response, options));
                        })
                        .catch(function (error) {
                            reject(error instanceof Error ? error : Error(error));
                        });
                }
            );
        });
    };

    toolProto.request = function (options) {
        const self = this;
        options = options || {};
        return new Promise(function (resolve, reject) {
            if (options.dataInputs || options.body) {
                TC.loadJS(
                    !TC.format || !TC.format.WPS,
                    TC.apiLocation + 'TC/format/WPS',
                    function () {
                        const data = {
                            process: options.process || self.process,
                            dataInputs: options.dataInputs,
                            responseType: TC.Consts.mimeType.JSON,
                            version: options.serviceVersion || self.serviceVersion || '1.0.0',
                            output: options.output
                        };
                        const contentType = typeof options.contentType === 'boolean' ? options.contentType : options.contentType || TC.Consts.mimeType.XML;
                        TC.ajax({
                            url: self.url,
                            method: 'POST',
                            contentType: contentType,
                            responseType: TC.Consts.mimeType.JSON,
                            data: options.body || TC.format.WPS.buildExecuteQuery(data)
                        }).then(function (response) {
                            resolve(response.data);
                        }, function (error) {
                            reject(error instanceof Error ? error : Error(error));
                        });
                    }
                );
            }
            else {
                reject(Error('Request is not valid for elevation service'));
            }
        });
    };

    toolProto.parseResponse = function (response, _options) {
        var self = this;
        if (response.coordinates) {
            const coords = response.coordinates;
            coords.forEach(function (coord) {
                if (coord[2] < self.minimumElevation) {
                    coord[2] = null;
                }
            });
        }
        return response.coordinates || [];
    };

    toolProto.cancelRequest = function (_id) {

    };

})();
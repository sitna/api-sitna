TC.layer = TC.layer || {};

if (!TC.Layer) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Layer');
}

(function () {

    var capabilitiesPromises = {};

    /**
     * Opciones de capa vectorial.
     * Esta clase no tiene constructor.
     * @class TC.cfg.VectorOptions
     * @extend TC.cfg.LayerOptions
     * @static
     */
    /**
     * Tipo de capa.
     * @property type
     * @type TC.consts.LayerType
     * @default TC.Consts.layerType.VECTOR
     */
    /**
     * URL del servicio WFS o del documento que define la capa.
     * @property url
     * @type string|undefined
     */

    /**
     * Capa de tipo vectorial, como la de un WFS o un KML.
     * @class TC.layer.Vector
     * @extends TC.Layer
     * @constructor
     * @async
     * @param {TC.Cfg.layer} [options] Objeto de opciones de configuración de la capa.
     */
    TC.layer.Vector = function () {
        var self = this;

        //esta promise se resolverá cuando el capabilities esté descargado y parseado
        //se utiliza para saber cuándo está listo el capabilities en los casos en los que se instancia el layer pero no se añade al mapa
        //porque la forma habitual de detectar esto es por los eventos del mapa (que en esos casos no saltarán)
        self._capabilitiesPromise = null;
        self.capabilities = null;

        TC.Layer.apply(self, arguments);

        self.type = self.options.type || TC.Consts.layerType.VECTOR;
        /**
         * Lista de entidades geográficas que hay en la capa.
         * @property features
         * @type array
         * @default []
         */
        self.features = [];
        /**
         * Lista de entidades geográficas seleccionadas en la capa.
         * @property selectedFeatures
         * @type array
         * @default []
         */
        self.selectedFeatures = [];

        const getFileExtension = function (url) {
            url = url || '';
            var idx = url.indexOf('?');
            if (idx >= 0) {
                url = url.substr(0, idx);
            }
            else {
                idx = url.indexOf('#');
                if (idx >= 0) {
                    url = url.substr(0, idx);
                }
            }
            return url.substr(url.lastIndexOf('.')).toLowerCase();
        };

        const getFormatFromExtension = function (extension) {
            switch (extension) {
                case '.kml':
                    return TC.Consts.format.KML;
                case '.gpx':
                    return TC.Consts.format.GPX;
                case '.json':
                case '.geojson':
                    return TC.Consts.format.GEOJSON;
                case '.gml':
                    return TC.Consts.format.GML;
                case '.wkt':
                    return TC.Consts.format.WKT;
                case '.topojson':
                    return TC.Consts.format.TOPOJSON;
                default:
                    return null;
            }
        };
        const getFormatFromMimeType = function (mimeType) {
            switch (mimeType) {
                case TC.Consts.mimeType.KML:
                    return TC.Consts.format.KML;
                case TC.Consts.mimeType.GPX:
                    return TC.Consts.format.GPX;
                case TC.Consts.mimeType.JSON:
                case TC.Consts.mimeType.GEOJSON:
                    return TC.Consts.format.GEOJSON;
                case TC.Consts.mimeType.GML:
                    return TC.Consts.format.GML;
                default:
                    return null;
            }
        };
        /**
         * URL del servicio o documento al que pertenenece la capa.
         * @property url
         * @type string
         */
        const extension = getFileExtension(self.url);
        const format = getFormatFromMimeType(self.options.format) || getFormatFromExtension(extension);
        if (format || self.type === TC.Consts.layerType.KML) {
            if (format === TC.Consts.format.KML) {
                self.type = TC.Consts.layerType.KML;
            }

            var getFileName = function (url) {
                url = url || '';
                var result = url;
                var regexp = new RegExp('([^/]+' + extension + ')', 'i');
                for (var i = 0; i < 3; i++) {
                    url = decodeURIComponent(url);
                    var match = regexp.exec(url);
                    if (match.length > 1) {
                        result = match[1];
                        break;
                    }

                }
                return result;
            };
            self.title = self.options.title || getFileName(self.url);
        }

        self.wrap = new TC.wrap.layer.Vector(self);

        self.wrap._promise = new Promise((resolve, reject) => {
            var ollyr = null;
            ollyr = self.wrap.createVectorLayer();
            self.wrap.setLayer(ollyr);
            resolve(ollyr);
        })//Promise.resolve(ollyr);

    };

    TC.inherit(TC.layer.Vector, TC.Layer);

    (function () {
        var layerProto = TC.layer.Vector.prototype;

        /*
         *  getTree: returns service layer tree { name, title, children }
         */
        layerProto.getTree = function () {
            const self = this;
            var result = null;
            if (!self.options.stealth) {
                result = {};
                result.children = [];
                for (var i = 0; i < self.features.length; i++) {
                    var path = self.features[i].getPath();
                    if (path.length) {
                        var node = TC.Util.addArrayToTree(path, result);
                        if (node) {
                            node.legend = self.features[i].getLegend();
                        }
                    }
                }
                if (self.styles) {
                    const multiGeom = Object.keys(self.styles).length > 1;
                    const locale = self.map ? self.map.options.locale : null;
                    if (self.styles.point) {
                        const node = multiGeom ? TC.Util.addArrayToTree([TC.Util.getLocaleString(locale, 'points')], result) : result;
                        node.legend = { src: TC.Util.getLegendImageFromStyle(self.styles.point, { geometryType: TC.Consts.geom.POINT }) };
                    }
                    if (self.styles.line) {
                        const node = multiGeom ? TC.Util.addArrayToTree([TC.Util.getLocaleString(locale, 'lines')], result) : result;
                        node.legend = { src: TC.Util.getLegendImageFromStyle(self.styles.line, { geometryType: TC.Consts.geom.POLYLINE }) };
                    }
                    if (self.styles.polygon) {
                        const node = multiGeom ? TC.Util.addArrayToTree([TC.Util.getLocaleString(locale, 'polygons')], result) : result;
                        node.legend = { src: TC.Util.getLegendImageFromStyle(self.styles.polygon, { geometryType: TC.Consts.geom.POLYGON }) };
                    }
                }
                result.name = self.name || result.name;
                result.customLegend = self.options.customLegend; //Atributo para pasar una plantilla HTML diferente a la por defecto (LegendNode.html)
                result.title = self.title || result.title;
                result.uid = self.id;
            }
            return result;
        };

        var addFeatureInternal = function (layer, multipleFeatureFunction, coord, options) {
            return new Promise(function (resolve, reject) {
                multipleFeatureFunction.call(layer, [coord], options).then(function (features) {
                    resolve(features[0]);
                    if (layer.map) {
                        layer.map.trigger(TC.Consts.event.FEATUREADD, { layer: layer, feature: features[0] });
                    }
                });
            });
        };

        var addFeaturesInternal = function (layer, coordsArray, constructorName, styleType, options) {
            var opts = TC.Util.extend(true, {}, options);
            return new Promise(function (resolve, reject) {
                var FeatureConstructor;
                const endFn = function () {
                    FeatureConstructor = FeatureConstructor || TC.feature[constructorName];
                    var features = new Array(coordsArray.length);
                    var nativeFeatures = [];
                    for (var i = 0, len = coordsArray.length; i < len; i++) {
                        var coords = coordsArray[i];
                        var feature;
                        const isNative = TC.wrap.Feature.prototype.isNative(coords);
                        if (coords instanceof FeatureConstructor || "TC.feature." + constructorName === coords.CLASSNAME) {
                            feature = coords;
                        }
                        else {
                            if (isNative) {
                                feature = coords._wrap && coords._wrap.parent;
                            }
                            if (!feature) {
                                opts.layer = layer;
                                const layerStyle = layer.styles && layer.styles[styleType];
                                if (TC.Util.hasStyleOptions(opts) || !layerStyle) {
                                    // Si las opciones tienen estilos, o la capa no los tiene, creamos un objeto de estilos para la feature
                                    TC.Util.extend(true, opts, TC.Cfg.styles[styleType], layerStyle || {}, options);
                                }
                                feature = new FeatureConstructor(coords, opts);
                            }
                        }
                        feature.layer = layer;
                        features[i] = feature;
                        layer.features.push(feature);
                        if (!isNative) {
                            nativeFeatures.push(feature.wrap.feature);
                        }
                        if (feature.options.showPopup) {
                            feature.showPopup();
                        }
                        // Este evento mata el rendimiento
                        //self.map.trigger(TC.Consts.event.FEATUREADD, { layer: self, feature: marker });
                    }
                    if (nativeFeatures.length) {
                        layer.wrap.addFeatures(nativeFeatures);
                    }
                    resolve(features);
                };
                if (constructorName) {
                    TC.loadJS(
                        !TC.feature || (TC.feature && !TC.feature[constructorName]),
                        [TC.apiLocation + 'TC/feature/' + constructorName],
                        endFn
                    );
                }
                else {
                    FeatureConstructor = TC.Feature;
                    endFn();
                }
            });
        };

        /**
         * Añade un punto a la capa.
         * @method addPoint
         * @async
         * @param {array|TC.feature.Point|ol.geom.Point|OpenLayers.Geometry.Point} coord Si es un array, contiene dos números (la coordenada del punto).
         * @param {TC.cfg.PointStyleOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un objeto de la clase TC.feature.Point
         */
        layerProto.addPoint = function (coord, options) {
            return addFeatureInternal(this, this.addPoints, coord, options);
        };

        /**
         * Añade una lista de puntos a la capa.
         * @method addPoints
         * @async
         * @param {array} coordsArray Los elementos de esta lista son cualquiera de los que acepta el método {{#crossLink "TC.layer.Vector/addPoint:method"}}{{/crossLink}}.
         * @param {TC.cfg.PointStyleOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un array de objetos de la clase TC.feature.Point
         */
        layerProto.addPoints = function (coordsArray, options) {
            return addFeaturesInternal(this, coordsArray, 'Point', TC.Consts.geom.POINT, options);
        };

        /**
         * Añade un marcador a la capa.
         * @method addMarker
         * @async
         * @param {array|TC.feature.Marker|ol.geom.Point|OpenLayers.Geometry.Point} coord Si es un array, contiene dos números (la coordenada del punto).
         * @param {TC.cfg.MarkerStyleOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un objeto de la clase TC.feature.Marker
         */
        layerProto.addMarker = function (coord, options) {
            return addFeatureInternal(this, this.addMarkers, coord, options);
        };

        /**
         * Añade una lista de marcadores a la capa.
         * @method addMarkers
         * @async
         * @param {array} coordsArray Los elementos de esta lista son cualquiera de los que acepta el método {{#crossLink "TC.layer.Vector/addMarker:method"}}{{/crossLink}}.
         * @param {TC.cfg.MarkerStyleOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un array de objetos de la clase TC.feature.Marker
         */
        layerProto.addMarkers = function (coordsArray, options) {
            return addFeaturesInternal(this, coordsArray, 'Marker', 'marker', options);
        };

        /**
         * Añade una polilínea a la capa.
         * @method addPolyline
         * @async
         * @param {array|TC.feature.Polyline|ol.geom.MultiLineString|OpenLayers.Geometry.LineString} coords Si es un array, contiene arrays de dos números (coordenadas de puntos).
         * @param {TC.cfg.PolylineOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un objeto de la clase TC.feature.Polyline
         */
        layerProto.addPolyline = function (coords, options) {
            return addFeatureInternal(this, this.addPolylines, coords, options);
        };


        /**
         * Añade una lista de polilíneas a la capa.
         * @method addPolylines
         * @async
         * @param {array} coordsArray Los elementos de esta lista son cualquiera de los que acepta el método {{#crossLink "TC.layer.Vector/addPolyline:method"}}{{/crossLink}}.
         * @param {TC.cfg.PolylineOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un array de objetos de la clase TC.feature.Polyline
         */
        layerProto.addPolylines = function (coordsArray, options) {
            //URI: El tipo de estilo se especifica LINE pero realmente deberia ser TC.Const.Style.LINE
            return addFeaturesInternal(this, coordsArray, 'Polyline', "line", options);
        };

        layerProto.addMultiPolyline = function (coords, options) {
            return addFeatureInternal(this, this.addMultiPolylines, coords, options);
        };


        layerProto.addMultiPolylines = function (coordsArray, options) {
            //URI: El tipo de estilo se especifica LINE pero realmente deberia ser TC.Const.Style.LINE
            return addFeaturesInternal(this, coordsArray, 'MultiPolyline', "line", options);
        };

        /**
         * Añade un polígono a la capa.
         * @method addPolygon
         * @async
         * @param {array|TC.feature.Polygon|ol.geom.Polygon|OpenLayers.Geometry.Polygon} coords Si es un array, contiene arrays de coordenadas, que son a su vez arrays de dos números. El primer
         * elemento de ese array es el anillo exterior, los siguientes son anillos interiores.
         * @param {TC.cfg.PolygonOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un objeto de la clase TC.feature.Polygon
         */
        layerProto.addPolygon = function (coords, options) {
            return addFeatureInternal(this, this.addPolygons, coords, options);
        };

        /**
         * Añade una lista de polígonos a la capa.
         * @method addPolygons
         * @async
         * @param {array} coordsArray Los elementos de esta lista son cualquiera de los que acepta el método {{#crossLink "TC.layer.Vector/addPolygon:method"}}{{/crossLink}}.
         * @param {TC.cfg.PolygonOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un array de objetos de la clase TC.feature.Polygon
         */
        layerProto.addPolygons = function (coordsArray, options) {
            //URI: El tipo de style se especifica POLIGON pero realmente deberia ser TC.Const.Style.POLYGON
            return addFeaturesInternal(this, coordsArray, 'Polygon', TC.Consts.geom.POLYGON, options);
        };

        layerProto.addMultiPolygon = function (coords, options) {
            return addFeatureInternal(this, this.addMultiPolygons, coords, options);
        };


        layerProto.addMultiPolygons = function (coordsArray, options) {
            //URI: El tipo de style se especifica POLIGON pero realmente deberia ser TC.Const.Style.POLYGON
            return addFeaturesInternal(this, coordsArray, 'MultiPolygon', TC.Consts.geom.POLYGON, options);
        };

        /**
         * Añade un círculo a la capa.
         * @method addCircle
         * @async
         * @param {array|TC.feature.Circle|ol.geom.Circle} coord Si es un array, contiene un array de dos números (la coordenada del centro) y un número (el radio).
         * @param {TC.cfg.PolygonStyleOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un objeto de la clase TC.feature.Circle
         */
        layerProto.addCircle = function (coord, options) {
            return addFeatureInternal(this, this.addCircles, coord, options);
        };

        /**
         * Añade una lista de círculos a la capa.
         * @method addCircles
         * @async
         * @param {array} coordsArray Los elementos de esta lista son cualquiera de los que acepta el método {{#crossLink "TC.layer.Vector/addCircle:method"}}{{/crossLink}}.
         * @param {TC.cfg.PolygonStyleOptions} [options]
         * @return {jQuery promise} La promesa al resolverse devuelve un array de objetos de la clase TC.feature.Circle
         */
        layerProto.addCircles = function (coordsArray, options) {
            //URI: El tipo de geometria se especifica POLIGON pero realmente deberia ser TC.Const.Style.POLYGON
            return addFeaturesInternal(this, coordsArray, 'Circle', TC.Consts.geom.POLYGON, options);
        };
        /**
         * Añade una entidad geográfica a la capa.
         * @method addFeature
         * @async
         * @param {TC.Feature} feature 
         * @return {jQuery promise} La promesa al resolverse devuelve un objeto de la clase TC.Feature
         */
        layerProto.addFeature = function (feature) {
            const self = this;
            var result;
            if (TC.feature) {
                if (TC.feature.Point && feature instanceof TC.feature.Point || feature.CLASSNAME === "TC.feature.Point") {
                    result = self.addPoint(feature);
                }
                else if (TC.feature.Polyline && feature instanceof TC.feature.Polyline || feature.CLASSNAME === "TC.feature.Polyline") {
                    result = self.addPolyline(feature);
                }
                else if (TC.feature.Polygon && feature instanceof TC.feature.Polygon || feature.CLASSNAME === "TC.feature.Polygon") {
                    result = self.addPolygon(feature);
                }
                else if (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon || feature.CLASSNAME === "TC.feature.MultiPolygon") {
                    result = self.addMultiPolygon(feature);
                }
                else if (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline || feature.CLASSNAME === "TC.feature.MultiPolyline") {
                    result = self.addMultiPolyline(feature);
                }
                else if (TC.feature.Circle && feature instanceof TC.feature.Circle || feature.CLASSNAME === "TC.feature.Circle") {
                    result = self.addCircle(feature);
                }
                else {
                    result = addFeaturesInternal(self, [feature]);
                }
            }
            return result;
        };

        layerProto.addFeatures = function (features) {
            return addFeaturesInternal(this, features);
        };

        /**
         * Elimina una entidad geográfica de la capa.
         * @method removeFeature
         * @param {TC.Feature} feature 
         */
        layerProto.removeFeature = function (feature) {
            const self = this;
            if (feature.layer && self.features.indexOf(feature) >= 0) {
                if (self.map) {
                    const filterFn = ctl => ctl.currentFeature === feature && ctl.isVisible();
                    const popups = self.map.getControlsByClass('TC.control.Popup');
                    popups
                        .filter(filterFn)
                        .forEach(pu => pu.hide());

                    const panels = self.map.getControlsByClass('TC.control.ResultsPanel');
                    panels
                        .filter(filterFn)
                        .forEach(p => p.close());
                }
                if (feature.layer) { // Volvemos a comprobar porque el cierre del popup puede haber borrado ya la feature
                    self.wrap.removeFeature(feature);
                }
                feature.layer = null;
            }
        };

        layerProto.getFeatureById = function (id) {
            const self = this;
            let result = null;
            var olFeat = self.wrap.getFeatureById(id);
            if (olFeat) {
                result = olFeat._wrap.parent;
            }
            return result;
        };

        /**
         * Borra todas las entidades geográficas de la capa.
         * @method clearFeatures
         */
        layerProto.clearFeatures = function () {
            var self = this;
            if (self.features && self.wrap) {
                if (self.map) {
                    const popups = self.map.getControlsByClass('TC.control.Popup');
                    popups.forEach(function (pu) {
                        if (pu.isVisible() && self.features.indexOf(pu.currentFeature) >= 0) {
                            pu.hide();
                        }
                    });
                }
                self.features.length = 0;
                self.wrap.clearFeatures();
            }
        };

        //layerProto.getGetCapabilitiesUrl = function () {
        //    const self = this;
        //    const version = self.options.version || '1.1.0';
        //    return self.url + '?service=WFS&' + 'version=' + version + '&request=GetCapabilities';
        //};

        layerProto.getDescribeFeatureTypeUrl = function (layerNames) {
            const self = this;
            const version = self.options.version || self.capabilities.version || '1.1.0';
            const featureType = Array.isArray(layerNames) ? layerNames : [layerNames];
            return self.url + '?service=WFS&' + 'version=' + version + '&request=DescribeFeatureType&typename=' + featureType.join(',') + '&outputFormat=' + encodeURIComponent(self.capabilities.Operations.DescribeFeatureType.outputFormat);
        };

        const _getStoredFeatureTypes = function (layerName, collection) {
            if (!(layerName instanceof Array))
                layerName = layerName.split(",");
            return layerName.reduce(function (vi, va) {
                var temp = [];
                temp[va] = collection[va]
                return Object.assign(vi, temp);
            }, {});
        }

        layerProto.describeFeatureType = function (layerName, callback, error) {
            const self = this;
            if (!layerName) layerName = self.options.featureType;
            const result = new Promise(function (resolve, reject) {
                self.getCapabilitiesPromise()
                    .then(function (capabilities) {
                        if (!capabilities.Operations.DescribeFeatureType) {
                            reject("No esta disponible el método describeFeatureType")
                            return;
                        }
                        if (window.hasOwnProperty('Worker')) {
                            var promsObj = {};
                            const wwGetUrl = async function () {
                                var wwLocation = TC.apiLocation + 'TC/workers/tc-dft-web-worker.js';
                                if (TC.Util.isSameOrigin(TC.apiLocation)) {
                                    return (wwLocation);
                                }
                                else {
                                    try {
                                        const response = await TC.ajax({
                                            url: wwLocation,
                                            method: 'GET',
                                            responseType: 'text'
                                        });
                                        const data = response.data;
                                        var blob = new Blob([data], { type: "text/javascript" });
                                        var url = window.URL.createObjectURL(blob);
                                        return url;
                                    }
                                    catch (err) {
                                        throw err
                                    }
                                }
                            }
                            const wwInit = async function () {
                                try {
                                    if (!self.WebWorkerDFT) {
                                        self.WebWorkerDFT = new Worker(await wwGetUrl());
                                    }
                                    self.WebWorkerDFT.onmessage = async function (e) {
                                        if (!(e.data instanceof Object)) {
                                            var data = await self.toolProxification.fetchXML(e.data);
                                            self.WebWorkerDFT.postMessage({
                                                url: e.data,
                                                response: data.documentElement.outerHTML
                                            });
                                            return;
                                        }
                                        if (e.data.state === 'success') {
                                            let key = Object.keys(e.data.DFTCollection).join(",");
                                            if (promsObj.hasOwnProperty(key)) {
                                                promsObj[key].call(null, e.data.DFTCollection);
                                            }
                                            else {
                                                throw "No se encuentra la clave " + key + " en la colección";
                                            }
                                            TC.describeFeatureType = Object.assign(TC.describeFeatureType, e.data.DFTCollection);
                                        }
                                        else {
                                            throw "Ha habido problemas procesando el Describe feature type";
                                            //reject("loquesea");
                                        }
                                    };

                                }
                                catch (err) {
                                    throw err;
                                }

                            }
                            const wwProcess = async function (layers, callback) {
                                var data = await self.toolProxification.fetchXML(self.getDescribeFeatureTypeUrl(layers || self.featureType));
                                //checkear si excepciones del servidor
                                if (data.querySelector("Exception") || data.querySelector("exception")) {
                                    throw (data.querySelector("Exception") || data.querySelector("exception")).textContent.trim()
                                }
                                self.WebWorkerDFT.postMessage({
                                    layerName: layers,
                                    xml: data.documentElement.outerHTML,
                                    url: (TC.apiLocation.indexOf("http") >= 0 ? TC.apiLocation : document.location.protocol + TC.apiLocation)
                                });
                                promsObj[layers instanceof Array ? layers.join(",") : layers] = callback;
                            }
                            try {
                                wwInit();
                            }
                            catch (err) {
                                reject(err);
                            }
                            //si no es una array convierto en Array
                            if (!(layerName instanceof Array)) layerName = layerName.split(",");
                            //si tiene distinto Namespace separo las pediciones describeFeatureType										
                            var arrPromises = (Object.entries(layerName.reduce(function (vi, va) {
                                let preffix = va.substring(0, va.indexOf(":"));
                                if (!vi[preffix]) {
                                    let temp = {};
                                    temp[preffix] = [va]
                                    return Object.assign(vi, temp);
                                } else {
                                    vi[preffix].push(va)
                                    return vi;
                                }
                            }, {})).map(function (params) {
                                var layers = params[1];
                                return new Promise(async function (resolve, reject) {
                                    if (TC.describeFeatureType[layers]) {
                                        resolve(_getStoredFeatureTypes(layers, TC.describeFeatureType));
                                        return;
                                    }
                                    try {
                                        await wwProcess(layers, function (data) {
                                            resolve(data);
                                        });
                                    }
                                    catch (err) {
                                        reject(err);
                                    }
                                })
                            }));
                            Promise.all(arrPromises).then(function (response) {
                                let objReturned = response.reduce(function (vi, va) {
                                    return Object.assign(vi, va)
                                }, {});

                                //si solo hay un objeto devuelvo directamente los atributos	de este				
                                resolve(Object.keys(objReturned).length === 1 ? objReturned[Object.keys(objReturned)[0]] : objReturned);
                            }).catch(reject);
                        }
                        else {
                            reject("No esta disponible el WebWorker")
                        }
                    })
                    .catch(err => reject(err));
            });
            result.then(
                function (data) {
                    if (TC.Util.isFunction(callback)) {
                        callback(data);
                    }
                },
                function (errorText) {
                    if (TC.Util.isFunction(error)) {
                        error(errorText);
                    }
                }
            );
            return result;
        };

        layerProto.CAPABILITIES_STORE_KEY_PREFIX = 'TC.capabilities.';

        layerProto.import = function (options) {
            this.wrap.import(options);
        };

        layerProto.setNodeVisibility = function (id, visible) {
            var self = this;

            self.state = TC.Layer.state.LOADING;
            self.map.trigger(TC.Consts.event.BEFOREUPDATE);
            self.map.trigger(TC.Consts.event.BEFORELAYERUPDATE, { layer: self });

            if (!self.tree) {
                self.tree = self.getTree();
            }

            var node = self.findNode(id, self.tree);
            if (node === self.tree) {
                self.setVisibility(visible);
            }
            else {
                var cache = self._cache.visibilityStates;
                cache[id] = visible ? TC.Consts.visibility.VISIBLE : TC.Consts.visibility.NOT_VISIBLE;

                var found = false;
                var i;
                var f;
                for (i = 0; i < self.features.length; i++) {
                    f = self.features[i];
                    if (f.id == id) {
                        found = true;
                        f.setVisibility(visible);
                        break;
                    }
                }
                if (!found) {
                    for (i = 0; i < self.features.length; i++) {
                        f = self.features[i];
                        if (f._path === undefined) {
                            f._path = '/' + f.getPath().join('/');
                        }
                        if (f._path === id) {
                            f.setVisibility(visible);
                        }
                    }
                }
            }
            self.state = TC.Layer.state.IDLE;
            self.map.trigger(TC.Consts.event.LAYERUPDATE, { layer: self });
            self.map.trigger(TC.Consts.event.UPDATE);
        };

        layerProto.getNodeVisibility = function (id) {
            var self = this;
            var result = TC.Layer.prototype.getNodeVisibility.call(self, id);
            if (!self.tree) {
                self.tree = self.getTree();
            }

            var node = self.findNode(id, self.tree);
            if (node === self.tree) {
                result = self.getVisibility() ? TC.Consts.visibility.VISIBLE : TC.Consts.visibility.NOT_VISIBLE;
            }
            else {
                var cache = self._cache.visibilityStates;
                var r = cache[id];
                if (r !== undefined) {
                    result = r;
                }
            }
            return result;
        };

        layerProto.setModifiable = function (modifiable) {
            this.wrap.setModifiable(modifiable);
        };

        layerProto.applyEdits = function (inserts, updates, deletes) {
            return this.wrap.sendTransaction(inserts, updates, deletes);
        };

        layerProto.refresh = function () {
            return this.wrap.reloadSource();
        };

        layerProto.getFeaturesInCurrentExtent = function (tolerance) {
            var self = this;

            var extent = self.map.getExtent();
            return this.getFeaturesInExtent(extent, tolerance);
        };

        layerProto.getFeaturesInExtent = function (extent, tolerance) {
            return this.wrap.getFeaturesInExtent(extent, tolerance);
        };

        layerProto.setProjection = function (options) {
            const self = this;
            self.wrap.setProjection(options);
            if (options.crs && options.oldCrs) {
                self.map.trigger(TC.Consts.event.BEFORELAYERUPDATE, { layer: self });
                self.features.forEach(function (feat) {
                    feat.wrap.setGeometry(TC.Util.reproject(feat.geometry, options.oldCrs, options.crs));
                    feat.geometry = feat.wrap.getGeometry();
                });
                self.map.trigger(TC.Consts.event.LAYERUPDATE, { layer: self });
            }
        };

        layerProto.setStyles = function (options) {
            const self = this;
            self.styles = TC.Util.extend({}, options);
            self.wrap.setStyles(options);
        };

        layerProto.exportState = function (options) {
            const self = this;
            options = options || {};
            const lObj = {
                id: self.id
            };
            if (self.map && self.map.crs !== self.map.options.crs) {
                lObj.crs = self.map.crs;
            }

            // Aplicamos una precisión un dígito mayor que la del mapa, si no, al compartir algunas parcelas se deforman demasiado
            var precision = Math.pow(10, (self.map.wrap.isGeo() ? TC.Consts.DEGREE_PRECISION : TC.Consts.METER_PRECISION) + 1);

            const features = options.features || self.features;
            lObj.features = features
                .map(function (f) {
                    const fObj = {};
                    var layerStyle;
                    switch (true) {
                        case TC.feature.Marker && f instanceof TC.feature.Marker:
                            fObj.type = TC.Consts.geom.POINT;
                            layerStyle = self.options.styles && self.options.styles.marker;
                            break;
                        case TC.feature.Point && f instanceof TC.feature.Point:
                            fObj.type = TC.Consts.geom.POINT;
                            layerStyle = self.options.styles && self.options.styles.point;
                            break;
                        //case TC.feature.MultiPoint && f instanceof TC.feature.MultiPoint:
                        //    fObj.type = TC.Consts.geom.MULTIPOINT;
                        //    break;
                        case TC.feature.Polyline && f instanceof TC.feature.Polyline:
                            fObj.type = TC.Consts.geom.POLYLINE;
                            layerStyle = self.options.styles && self.options.styles.line;
                            break;
                        case TC.feature.MultiPolyline && f instanceof TC.feature.MultiPolyline:
                            fObj.type = TC.Consts.geom.MULTIPOLYLINE;
                            layerStyle = self.options.styles && self.options.styles.line;
                            break;
                        case TC.feature.Polygon && f instanceof TC.feature.Polygon:
                            fObj.type = TC.Consts.geom.POLYGON;
                            layerStyle = self.options.styles && self.options.styles.polygon;
                            break;
                        case TC.feature.MultiPolygon && f instanceof TC.feature.MultiPolygon:
                            fObj.type = TC.Consts.geom.MULTIPOLYGON;
                            layerStyle = self.options.styles && self.options.styles.polygon;
                            break;
                        case TC.feature.Circle && f instanceof TC.feature.Circle:
                            fObj.type = TC.Consts.geom.CIRCLE;
                            layerStyle = self.options.styles && self.options.styles.polygon;
                            break;
                        default:
                            break;
                    }
                    fObj.id = f.id;
                    fObj.geom = TC.Util.compactGeometry(f.geometry, precision);
                    fObj.data = f.getData();
                    fObj.showsPopup = f.showsPopup;
                    if (options.exportStyles === undefined || options.exportStyles) {
                        layerStyle = TC.Util.extend({}, layerStyle);
                        for (var key in layerStyle) {
                            var val = layerStyle[key];
                            if (TC.Util.isFunction(val)) {
                                layerStyle[key] = val(f);
                            }
                        }
                        fObj.style = TC.Util.extend(layerStyle, f.getStyle());
                    }
                    return fObj;
                });
            return lObj;
        };

        layerProto.importState = function (obj) {
            const self = this;
            return new Promise(function (resolve, reject) {
                const promises = new Array(obj.features.length);
                obj.features.forEach(function (f, idx) {
                    const featureOptions = TC.Util.extend(f.style, { data: f.data, id: f.id, showsPopup: f.showsPopup });
                    var addFn;
                    switch (f.type) {
                        case TC.Consts.geom.POLYGON:
                            addFn = self.addPolygon;
                            break;
                        case TC.Consts.geom.MULTIPOLYGON:
                            addFn = self.addMultiPolygon;
                            break;
                        case TC.Consts.geom.POLYLINE:
                            addFn = self.addPolyline;
                            break;
                        case TC.Consts.geom.MULTIPOLYLINE:
                            addFn = self.addMultiPolyline;
                            break;
                        case TC.Consts.geom.CIRCLE:
                            addFn = self.addCircle;
                            break;
                        case TC.Consts.geom.POINT:
                            if (f.style && (f.style.url || f.style.className)) {
                                addFn = self.addMarker;
                            }
                            else {
                                addFn = self.addPoint;
                            }
                            break;
                        default:
                            break;
                    }
                    if (addFn) {
                        var geom = TC.Util.explodeGeometry(f.geom);
                        if (obj.crs && self.map.crs !== obj.crs) {
                            promises[idx] = new Promise(function (res, rej) {
                                self.map.one(TC.Consts.event.PROJECTIONCHANGE, function (e) {
                                    addFn.call(self, geom, featureOptions).then(
                                        function () {
                                            res();
                                        },
                                        function () {
                                            rej(Error('addFn failed'));
                                        }
                                    );
                                });
                            });
                        }
                        else {
                            promises[idx] = addFn.call(self, geom, featureOptions);
                        }
                    }
                });
                Promise.all(promises).then(
                    function () {
                        resolve();
                    },
                    function (err) {
                        reject(err instanceof Error ? err : Error(err));
                    });
            });
        };

        layerProto.getGetCapabilitiesUrl = function () {
            const self = this;
            if (self.type === TC.Consts.layerType.WFS) {
                const getUrl = function () { return self.options.url || self.url };
                const _src = !TC.Util.isSecureURL(getUrl()) && TC.Util.isSecureURL(TC.Util.toAbsolutePath(getUrl())) ? self.getBySSL_(getUrl()) : getUrl();

                var params = {
                }
                params.SERVICE = 'WFS';
                params.VERSION = '2.0.0';
                params.REQUEST = 'GetCapabilities';

                return _src + '?' + TC.Util.getParamString(params);
            }
            else
                return null;
        };

        layerProto.getCapabilitiesPromise = function () {
            const self = this;
            if (self.type === TC.Consts.layerType.WFS) {
                return new Promise((resolve, reject) => {
                    const processedCapabilities = function (capabilities) {
                        // Si existe el capabilities no machacamos, porque provoca efectos indeseados en la gestión de capas.
                        // En concreto, se regeneran los UIDs de capas, como consecuencia los controles de la API interpretan como distintas capas que son la misma.
                        self.capabilities = self.capabilities || capabilities;
                        TC.capabilitiesWFS[self.options.url || self.url] = TC.capabilitiesWFS[self.options.url || self.url] || capabilities;
                        TC.capabilitiesWFS[actualUrl] = TC.capabilitiesWFS[actualUrl] || capabilities;
                        resolve(capabilities);
                    };

                    var actualUrl = (self.options.url || self.url).replace(/https ?:/gi, '');

                    if (self.capabilities) {
                        resolve(self.capabilities);
                        self._capabilitiesPromise = Promise.resolve(self.capabilities);
                    }
                    if (TC.capabilitiesWFS[actualUrl]) {
                        resolve(TC.capabilitiesWFS[actualUrl]);
                        self._capabilitiesPromise = Promise.resolve(TC.capabilitiesWFS[actualUrl]);

                    }

                    self.toolProxification = new TC.tool.Proxification(TC.proxify);

                    const cachePromise = capabilitiesPromises[actualUrl];
                    capabilitiesPromises[actualUrl] = self._capabilitiesPromise = cachePromise || new Promise(function (res, rej) {
                        const onlinePromise = self.getCapabilitiesOnline();
                        const storagePromise = self.getCapabilitiesFromStorage();

                        onlinePromise
                            .then(function (capabilities) {
                                res(capabilities);
                            })
                            .catch(function (error) {
                                storagePromise.catch(function () {
                                    rej(error);
                                });
                            });
                        storagePromise
                            .then(function (capabilities) {
                                res(capabilities);
                            })
                            .catch(function () {
                                onlinePromise.catch(function (error) {
                                    rej(error);
                                });
                            });
                    });

                    capabilitiesPromises[actualUrl].then(function (capabilities) {
                        processedCapabilities(capabilities);
                    })
                        .catch(function (error) {
                            if (self.map) {
                                self.map.trigger(TC.Consts.event.LAYERERROR, { layer: self, reason: 'couldNotGetCapabilities' });
                            }
                            reject(error)
                        });
                });
            }
            else {
                return Promise.reject(new Error(`Layer "${self.id}" does not have capabilities document`));
            }
        };

    })();
})();
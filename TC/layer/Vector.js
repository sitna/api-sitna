TC.layer = TC.layer || {};

if (!TC.Layer) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Layer.js');
}

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
    var _layer = this;
    TC.Layer.apply(_layer, arguments);

    _layer.type = _layer.options.type || TC.Consts.layerType.VECTOR;
    /**
     * Lista de entidades geográficas que hay en la capa.
     * @property features
     * @type array
     * @default []
     */
    _layer.features = [];
    /**
     * Lista de entidades geográficas seleccionadas en la capa.
     * @property selectedFeatures
     * @type array
     * @default []
     */
    _layer.selectedFeatures = [];

    var _isKml = function (url) {
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
        return (url.substr(url.length - 4).toLowerCase() === '.kml');
    };
    /**
     * URL del servicio o documento al que pertenenece la capa.
     * @property url
     * @type string
     */
    if (_layer.url && (_isKml(_layer.url) || _layer.type === TC.Consts.layerType.KML)) {
        _layer.type = TC.Consts.layerType.KML;

        var getFileName = function (url) {
            var result = url;
            var regexp = new RegExp('([^/]+\.kml)', 'i');
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
        _layer.title = _layer.options.title || getFileName(_layer.url);
    }

    _layer.wrap = new TC.wrap.layer.Vector(_layer);

    var ollyr = _layer.wrap.createVectorLayer();
    _layer.wrap.setLayer(ollyr);
};

TC.inherit(TC.layer.Vector, TC.Layer);

(function () {
    var layerProto = TC.layer.Vector.prototype;

    /*
     *  getTree: returns service layer tree { name, title, children }
     */
    layerProto.getTree = function () {
        var _layer = this;
        var result = null;
        if (!_layer.options.stealth) {
            result = {};
            result.children = [];
            for (var i = 0; i < _layer.features.length; i++) {
                var path = _layer.features[i].getPath();
                if (path.length) {
                    var node = TC.Util.addArrayToTree(path, result);
                    if (node) {
                        node.legend = _layer.features[i].getLegend();
                    }
                }
            }
            result.name = _layer.name || result.name;
            result.title = _layer.title || result.title;
            result.uid = _layer.id;
        }
        return result;
    };

    var addFeatureInternal = function (layer, multipleFeatureFunction, coord, options) {
        var result = new $.Deferred();
        $.when(multipleFeatureFunction.call(layer, [coord], options)).then(function (features) {
            result.resolve(features[0]);
            layer.map.$events.trigger($.Event(TC.Consts.event.FEATUREADD, { layer: layer, feature: features[0] }));
        });
        return result;
    };

    var addFeaturesInternal = function (layer, coordsArray, constructorName, styleType, options) {
        var deferred = new $.Deferred();
        var style = (layer.options.styles && layer.options.styles[styleType]) || TC.Cfg.styles[styleType];
        var opts = $.extend(true, {}, style, options);
        TC.loadJS(
            !TC.feature || (TC.feature && !TC.feature[constructorName]),
            [TC.apiLocation + 'TC/feature/' + constructorName + '.js'],
            function () {
                var FeatureConstructor = TC.feature[constructorName]
                var features = new Array(coordsArray.length);
                var nativeFeatures = [];
                for (var i = 0, len = coordsArray.length; i < len; i++) {
                    var coords = coordsArray[i];
                    var feature;
                    if (coords instanceof FeatureConstructor) {
                        feature = coords;
                        feature.layer = layer;
                    }
                    else {
                        opts.layer = layer;
                        feature = new FeatureConstructor(coords, opts);
                    }
                    features[i] = feature;
                    layer.features[layer.features.length] = feature;
                    if (!feature.wrap.isNative(coords)) {
                        nativeFeatures[nativeFeatures.length] = feature.wrap.feature;
                    }
                    if (feature.options.showPopup) {
                        feature.showPopup();
                    }
                    // Este evento mata el rendimiento
                    //_layer.map.$events.trigger($.Event(TC.Consts.event.FEATUREADD, { layer: _layer, feature: marker }));
                }
                if (nativeFeatures.length) {
                    layer.wrap.addFeatures(nativeFeatures);
                }
                deferred.resolve(features);
            }
        );
        return deferred;
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
        return addFeaturesInternal(this, coordsArray, 'Polyline', TC.Consts.geom.POLYLINE, options);
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
        return addFeaturesInternal(this, coordsArray, 'Polygon', TC.Consts.geom.POLYGON, options);
    };

    layerProto.addMultiPolygon = function (coords, options) {
        return addFeatureInternal(this, this.addMultiPolygons, coords, options);
    };


    layerProto.addMultiPolygons = function (coordsArray, options) {
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
        var layer = this;
        var result;
        if (TC.feature) {
            if (TC.feature.Point && feature instanceof TC.feature.Point) {
                result = layer.addPoint(feature);
            }
            else if (TC.feature.Polyline && feature instanceof TC.feature.Polyline) {
                result = layer.addPolyline(feature);
            }
            else if (TC.feature.Polygon && feature instanceof TC.feature.Polygon) {
                result = layer.addPolygon(feature);
            }
            else if (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon) {
                result = layer.addMultiPolygon(feature);
            }
            else if (TC.feature.Circle && feature instanceof TC.feature.Circle) {
                result = layer.addCircle(feature);
            }
        }
        return result;
    };

    /**
     * Elimina una entidad geográfica de la capa.
     * @method removeFeature
     * @param {TC.Feature} feature 
     */
    layerProto.removeFeature = function (feature) {
        this.wrap.removeFeature(feature);
    };

    /**
     * Borra todas las entidades geográficas de la capa.
     * @method clearFeatures
     */
    layerProto.clearFeatures = function () {
        var _layer = this;
        if (_layer.features && _layer.wrap) {
            _layer.features.length = 0;
            _layer.wrap.clearFeatures();
        }
    };

    layerProto.setNodeVisibility = function (id, visible) {
        var _layer = this;

        _layer.map.$events.trigger($.Event(TC.Consts.event.BEFOREUPDATE));
        _layer.map.$events.trigger($.Event(TC.Consts.event.BEFORELAYERUPDATE, { layer: _layer }));

        if (!_layer.tree) {
            _layer.tree = _layer.getTree();
        }

        var node = _layer.findNode(id, _layer.tree);
        if (node === _layer.tree) {
            _layer.setVisibility(visible);
        }
        else {
            var cache = _layer._cache.visibilityStates;
            cache[id] = visible ? TC.Consts.visibility.VISIBLE : TC.Consts.visibility.NOT_VISIBLE;

            var found = false;
            var i;
            var f;
            for (i = 0; i < _layer.features.length; i++) {
                f = _layer.features[i];
                if (f.id == id) {
                    found = true;
                    f.setVisibility(visible);
                    break;
                }
            }
            if (!found) {
                for (i = 0; i < _layer.features.length; i++) {
                    f = _layer.features[i];
                    if (f._path === undefined) {
                        f._path = '/' + f.getPath().join('/');
                    }
                    if (f._path === id) {
                        f.setVisibility(visible);
                    }
                }
            }
        }
        _layer.map.$events.trigger($.Event(TC.Consts.event.LAYERUPDATE, { layer: _layer }));
        _layer.map.$events.trigger($.Event(TC.Consts.event.UPDATE));
    };

    layerProto.getNodeVisibility = function (id) {
        var _layer = this;
        var result = TC.Layer.prototype.getNodeVisibility.call(_layer, id);
        if (!_layer.tree) {
            _layer.tree = _layer.getTree();
        }

        var node = _layer.findNode(id, _layer.tree);
        if (node === _layer.tree) {
            result = _layer.getVisibility() ? TC.Consts.visibility.VISIBLE : TC.Consts.visibility.NOT_VISIBLE;
        }
        else {
            var cache = _layer._cache.visibilityStates;
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
        var self = this;
        return this.wrap.reloadSource();
    };
})();
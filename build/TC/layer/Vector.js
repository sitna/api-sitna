TC.layer = TC.layer || {};

if (!TC.Layer) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Layer');
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
    var self = this;
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

    var ollyr = self.wrap.createVectorLayer();
    self.wrap.setLayer(ollyr);
};

TC.inherit(TC.layer.Vector, TC.Layer);

(function () {
    var layerProto = TC.layer.Vector.prototype;

    /*
     *  getTree: returns service layer tree { name, title, children }
     */
    layerProto.getTree = function () {
        var self = this;
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
            result.name = self.name || result.name;
            result.customLegend = self.options.customLegend; //Atributo para pasar una plantilla HTML diferente a la por defecto (LegendNode.html)
            result.title = self.title || result.title;
            result.uid = self.id;
        }
        return result;
    };

    var addFeatureInternal = function (layer, multipleFeatureFunction, coord, options) {
        var result = new $.Deferred();
        $.when(multipleFeatureFunction.call(layer, [coord], options)).then(function (features) {
            result.resolve(features[0]);
            if (layer.map) {
                layer.map.$events.trigger($.Event(TC.Consts.event.FEATUREADD, { layer: layer, feature: features[0] }));
            }
        });
        return result;
    };

    var addFeaturesInternal = function (layer, coordsArray, constructorName, styleType, options) {
        var deferred = new $.Deferred();
        var style = (layer.options.styles && layer.options.styles[styleType]) || TC.Cfg.styles[styleType];
        var opts = $.extend(true, {}, style, options);
        TC.loadJS(
            !TC.feature || (TC.feature && !TC.feature[constructorName]),
            [TC.apiLocation + 'TC/feature/' + constructorName],
            function () {
                var FeatureConstructor = TC.feature[constructorName]
                var features = new Array(coordsArray.length);
                var nativeFeatures = [];
                for (var i = 0, len = coordsArray.length; i < len; i++) {
                    var coords = coordsArray[i];
                    var feature;
                    const isNative = TC.wrap.Feature.prototype.isNative(coords);
                    if (coords instanceof FeatureConstructor) {
                        feature = coords;
                    }
                    else {
                        opts.layer = layer;
                        if (isNative) {
                            feature = coords._wrap && coords._wrap.parent;
                        }
                        if (!feature) {
                            feature = new FeatureConstructor(coords, opts);
                        }
                    }
                    feature.layer = layer;
                    features[i] = feature;
                    layer.features[layer.features.length] = feature;
                    if (!isNative) {
                        nativeFeatures[nativeFeatures.length] = feature.wrap.feature;
                    }
                    if (feature.options.showPopup) {
                        feature.showPopup();
                    }
                    // Este evento mata el rendimiento
                    //self.map.$events.trigger($.Event(TC.Consts.event.FEATUREADD, { layer: self, feature: marker }));
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

    layerProto.addMultiPolyline = function (coords, options) {
        return addFeatureInternal(this, this.addMultiPolylines, coords, options);
    };


    layerProto.addMultiPolylines = function (coordsArray, options) {
        return addFeaturesInternal(this, coordsArray, 'MultiPolyline', TC.Consts.geom.POLYLINE, options);
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
            else if (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline) {
                result = layer.addMultiPolyline(feature);
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
        const self = this;
        if (self.map) {
            const popups = self.map.getControlsByClass('TC.control.Popup');
            popups.forEach(function (pu) {
                if (pu.isVisible() && pu.currentFeature === feature) {
                    pu.hide();
                }
            });
        }
        self.wrap.removeFeature(feature);
    };

    layerProto.getFeatureById = function (id) {
        var result = null;
        var olFeat = this.wrap.getFeatureById(id);
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

    layerProto.describeFeatureType = function (callback, error) {
        var self = this;
        var deferred = $.Deferred();
        $.ajax({
            url: self.wrap.getDescribeFeatureTypeUrl(),
            type: 'GET',
            dataType: 'xml'
        }).then(function (data) {
            var ns = 'http://www.w3.org/2001/XMLSchema';
            var complexType = data.getElementsByTagNameNS(ns, 'complexType')[0];
            if (complexType) {
                var elements = complexType.getElementsByTagNameNS(ns, 'element');
                var result = new Array(elements.length);
                for (var i = 0, len = elements.length; i < len; i++) {
                    var element = elements[i];
                    result[i] = {
                        name: element.getAttribute('name'),
                        type: element.getAttribute('type'),
                        nillable: element.getAttribute('nillable') === 'true' ? true : false,
                        minOccurs: parseInt(element.getAttribute('minOccurs')),
                        maxOccurs: parseInt(element.getAttribute('maxOccurs'))
                    }
                }
                deferred.resolve(result);
            }
            else {
                var exception = data.getElementsByTagName('Exception')[0];
                if (exception) {
                    deferred.reject(exception.getElementsByTagName('ExceptionText')[0].innerHTML);
                }
            }
        },
        function (jqXHR, textStatus, errorThrown) {
            deferred.reject(errorThrown);
        });
        deferred.then(
            function (data) {
                if ($.isFunction(callback)) {
                    callback(data);
                }
            },
            function (errorText) {
                if ($.isFunction(error)) {
                    error(errorText);
                }
            }
        );
        return deferred.promise();
    };

    layerProto.import = function (options) {
        this.wrap.import(options);
    };

    layerProto.setNodeVisibility = function (id, visible) {
        var self = this;

        self.state = TC.Layer.state.LOADING;
        self.map.$events.trigger($.Event(TC.Consts.event.BEFOREUPDATE));
        self.map.$events.trigger($.Event(TC.Consts.event.BEFORELAYERUPDATE, { layer: self }));

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
        self.map.$events.trigger($.Event(TC.Consts.event.LAYERUPDATE, { layer: self }));
        self.map.$events.trigger($.Event(TC.Consts.event.UPDATE));
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
        var self = this;
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
            self.map.$events.trigger($.Event(TC.Consts.event.BEFORELAYERUPDATE, { layer: self }));
            self.features.forEach(function (feat) {
                feat.wrap.setGeometry(TC.Util.reproject(feat.geometry, options.oldCrs, options.crs));
                feat.geometry = feat.wrap.getGeometry();
            });
            self.map.$events.trigger($.Event(TC.Consts.event.LAYERUPDATE, { layer: self }));
        }
    };

    const cloneMappingFunction = function (elm) {
        var result;
        if ($.isArray(elm)) {
            return elm.map(cloneMappingFunction);
        }
        return elm;
    };

    const compactGeometry = function (geometry, precision) {
        const origin = [Number.MAX_VALUE, Number.MAX_VALUE];
        const newGeom = geometry.map(cloneMappingFunction);
        const firstIterationFunction = function (elm, idx) {
            if ($.isArray(elm)) {
                elm.forEach(firstIterationFunction);
            }
            else {
                if (idx === 0 && elm < origin[0]) {
                    origin[0] = elm;
                }
                else if (idx === 1 && elm < origin[1]) {
                    origin[1] = elm;
                }
            }
        };
        newGeom.forEach(firstIterationFunction);

        const round = function (val) {
            return Math.round(val * precision) / precision;
        }
        origin[0] = round(origin[0]);
        origin[1] = round(origin[1]);
        const secondIterationFunction = function (elm, idx, arr) {
            if ($.isArray(elm)) {
                elm.forEach(secondIterationFunction);
            }
            else {
                if (idx === 0) {
                    arr[0] = round(elm - origin[0]);
                }
                if (idx === 1) {
                    arr[1] = round(elm - origin[1]);
                }
            }
        };
        newGeom.forEach(secondIterationFunction);
        return {
            origin: origin,
            geom: newGeom
        }
    }

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

        lObj.features = self.features
            .map(function (f) {
                const fObj = {};
                var layerStyle;
                switch (true) {
                    case TC.feature.Point && f instanceof TC.feature.Point:
                        fObj.type = TC.Consts.geom.POINT;
                        layerStyle = self.options.styles && self.options.styles.point;
                        break;
                    //case TC.feature.MultiPoint && f instanceof TC.feature.MultiPoint:
                    //    fObj.type = TC.Consts.geom.MULTIPOINT;
                    //    break;
                    case TC.feature.Marker && f instanceof TC.feature.Marker:
                        fObj.type = TC.Consts.geom.POINT;
                        layerStyle = self.options.styles && self.options.styles.marker;
                        break;
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
                fObj.geom = compactGeometry(f.geometry, precision);
                fObj.data = f.getData();
                fObj.showsPopup = f.showsPopup;
                if (options.exportStyles === undefined || options.exportStyles) {
                    layerStyle = $.extend({}, layerStyle);
                    for (var key in layerStyle) {
                        var val = layerStyle[key];
                        if ($.isFunction(val)) {
                            layerStyle[key] = val(f);
                        }
                    }
                    fObj.style = $.extend(layerStyle, f.getStyle());
                }
                return fObj;
            });
        return lObj;
    };

    const explodeGeometry = function (obj) {
        const origin = obj.origin;
        const iterationFunction = function (elm, idx, arr) {
            if ($.isArray(elm)) {
                elm.forEach(iterationFunction);
            }
            else {
                if (idx === 0) {
                    arr[0] = elm + origin[0];
                }
                if (idx === 1) {
                    arr[1] = elm + origin[1];
                }
            }
        };
        obj.geom.forEach(iterationFunction);
        return obj.geom;
    };

    layerProto.importState = function (obj) {
        const self = this;
        const deferred = $.Deferred();
        const deferreds = new Array(obj.features.length);
        obj.features.forEach(function (f, idx) {
            const featureOptions = $.extend(f.style, { data: f.data, id: f.id, showsPopup: f.showsPopup });
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
                var geom = explodeGeometry(f.geom);
                if (obj.crs && self.map.crs !== obj.crs) {
                    geom = TC.Util.reproject(geom, obj.crs, self.map.crs);
                }
                deferreds[idx] = addFn.call(self, geom, featureOptions);
            }
        });
        $.when.apply($, deferreds).then(
            function () {
                deferred.resolve();
            },
            function () {
                deferred.reject();
            });
        return deferred.promise();
    };
})();
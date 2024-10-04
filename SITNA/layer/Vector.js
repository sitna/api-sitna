import TC from '../../TC';
import Cfg from '../../TC/Cfg';
import Util from '../../TC/Util';
import Consts from '../../TC/Consts';
import Layer from './Layer';
import Feature from '../feature/Feature';
import Point from '../feature/Point';
import Marker from '../feature/Marker';
import Polyline from '../feature/Polyline';
import Polygon from '../feature/Polygon';
import MultiPoint from '../feature/MultiPoint';
import MultiMarker from '../feature/MultiMarker';
import MultiPolyline from '../feature/MultiPolyline';
import MultiPolygon from '../feature/MultiPolygon';
import Circle from '../feature/Circle';
import FeatureTypeParser from '../../TC/tool/FeatureTypeParser';

TC.Layer = Layer;
TC.layer = TC.layer || {};
const featureNamespace = {};
featureNamespace.Point = Point;
featureNamespace.Marker = Marker;
featureNamespace.Polyline = Polyline;
featureNamespace.Polygon = Polygon;
featureNamespace.MultiPoint = MultiPoint;
featureNamespace.MultiMarker = MultiMarker;
featureNamespace.MultiPolyline = MultiPolyline;
featureNamespace.MultiPolygon = MultiPolygon;
featureNamespace.Circle = Circle;

const capabilitiesPromises = {};
const visibilityCache = new Map();


const getMergedLegendImage = function (images) {
    let offset = 0;
    const margin = 2;
    const svgs = images
        .map(str => str.replace('data:image/svg+xml,', ''))
        .map(str => decodeURIComponent(str));
    const widths = svgs.map(str => parseFloat(str.match(/ width="([\d\.]*)"/)[1]));
    const heights = svgs.map(str => parseFloat(str.match(/ height="([\d\.]*)"/)[1]));
    const width = widths.reduce((acc, cur) => acc + cur + margin, 0);
    const height = Math.max(...heights);
    const offsetSvgs = svgs
        .map((str, idx) => {
            const result = str.replace('<svg xmlns="http://www.w3.org/2000/svg"', `<svg x="${offset}" y="${(height - heights[idx]) / 2}" `);
            offset += widths[idx] + margin;
            return result;
        });
    return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${offsetSvgs.join('')}</svg>`);
};

//URI esta función compara los estilos de las features extrayendo la parte comun para sacarla a los estilos de capa
const compareStyles = function (objTo, objFrom, distinct = true) {
    const fnCompare = function (value1, value2, mode) {
        return mode ? value1 !== value2 : value1 === value2;
    };
    for (let key in objFrom) {
        //si es un array o un objeto
        const objFromValue = objFrom[key];
        if (Array.isArray(objFromValue)) {
            let toStyle = objTo[key];
            if (toStyle) {
                toStyle = Array.isArray(toStyle) ? toStyle : [toStyle];
            }
            else {
                toStyle = [];
            }
            if (Object.prototype.hasOwnProperty.call(objTo, key) && fnCompare(objFromValue.join(), toStyle.join(), distinct)) {
                delete objTo[key];
            }
        }
        else if (typeof objFromValue === 'object') {
            objTo[key] = compareStyles(objTo[key], objFromValue);
        }
        else {
            if (Object.prototype.hasOwnProperty.call(objTo, key) && fnCompare(objFromValue, objTo[key], distinct)) {
                delete objTo[key];
            }
        }
    }
    return objTo;
};

/**
 * Capa con entidades geográficas vectoriales.
 * @class Vector
 * @memberof SITNA.layer
 * @extends SITNA.layer.Layer
 * @param {SITNA.layer.VectorOptions} [options] Objeto de opciones de configuración de la capa.
 * @see SITNA.Map#getLayer
 */
class Vector extends Layer {

    /**
     * Lista de entidades geográficas que hay en la capa.
     * @member features
     * @memberof SITNA.layer.Vector
     * @instance
     * @type Array.<SITNA.feature.Feature>
     */
    features = [];

    selectedFeatures = [];

    //esta promise se resolverá cuando el capabilities esté descargado y parseado
    //se utiliza para saber cuándo está listo el capabilities en los casos en los que se instancia el layer pero no se añade al mapa
    //porque la forma habitual de detectar esto es por los eventos del mapa (que en esos casos no saltarán)
    #capabilitiesPromise = null;
    #allowedGeometryTypes = new Set();
    #featureTypeMetadata;
    #featureTypeParser;

    constructor() {
        super(...arguments);
        const self = this;

        self.type = self.options.type || Consts.layerType.VECTOR;
        self.featureType = self.options.featureType;
        if (self.options.file) {
            self.file = self.options.file;
        }
        if (self.options.fileSystemFile) {
            self.fileSystemFile = self.options.fileSystemFile;
        }

        self.setAllowedGeometryTypes(self.options.allowedGeometryTypes);

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

        const getFormatFromMimeType = function (mimeType) {
            switch (mimeType) {
                case Consts.mimeType.KML:
                    return Consts.format.KML;
                case Consts.mimeType.GPX:
                    return Consts.format.GPX;
                case Consts.mimeType.JSON:
                case Consts.mimeType.GEOJSON:
                    return Consts.format.GEOJSON;
                case Consts.mimeType.GML:
                    return Consts.format.GML;
                default:
                    return null;
            }
        };

        const extension = getFileExtension(self.url);
        const format = getFormatFromMimeType(self.format) || Util.getFormatFromFileExtension(extension);
        if (format || self.type === Consts.layerType.KML) {
            if (format === Consts.format.KML) {
                self.type = Consts.layerType.KML;
            }

            var getFileName = function (url) {
                url = url || '';
                var result = url;
                var regexp = new RegExp('([\\w|\\-|\\.]+\\' + extension + ')', 'i');
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

        self.wrap._promise = new Promise((resolve, _reject) => {
            var ollyr = null;
            ollyr = self.wrap.createVectorLayer();
            self.wrap.setLayer(ollyr);
            resolve(ollyr);
        });//Promise.resolve(ollyr);
    }

    getTree() {
        const self = this;
        if (self.tree) return self.tree;
        let result = null;
        if (!self.options.stealth) {
            result = {
                children: []
            };
            const nodes = new Set();
            self.features.forEach(f => {
                const path = f.getPath();
                if (path.length) {
                    const node = Util.addArrayToTree(path, result);
                    if (!nodes.has(node)) {
                        nodes.add(node);
                        if (f.getVisibilityState() === Consts.visibility.NOT_VISIBLE) {
                            if (!Object.prototype.hasOwnProperty.call(node, "visibilityState")) {
                                node.visibilityState = Consts.visibility.NOT_VISIBLE;
                            }
                        }
                        else {
                            node.visibilityState = Consts.visibility.VISIBLE;
                        }

                        node.legend = [];
                    }
                    const featureLegend = f.getLegend();
                    let nodeLegend = node.legend.find(f => f.src === featureLegend.src);
                    if (!nodeLegend) {
                        nodeLegend = Object.assign({}, featureLegend);
                        nodeLegend.features = [];
                        node.legend.push(nodeLegend);
                    }
                    nodeLegend.features.push(f);
                }
            });

            // Repasamos los nodos por si hay que hacerles una leyenda temática
            nodes.forEach(function createMultiLegend(node) {
                if (node.legend.length > 1) {
                    // Hay varios símbolos para la carpeta, hay que confeccionar la leyenda
                    const commonPropertiesByLegendWatch = [];
                    // Averiguamos qué propiedades tienen valor común en cada grupo
                    node.legend.forEach(function getFolderCommonPropertyValues(l) {
                        const commonProperties = l.features
                            .map(f => f.getData())
                            .reduce(function getFeatureCommonPropertyValues(properties, data) {
                                for (var key in properties) {
                                    const property = data[key];
                                    if (property && Object.prototype.hasOwnProperty.call(property, 'value')) {
                                        if (property.value !== properties[key].value) {
                                            delete properties[key];
                                        }
                                    }
                                    else {
                                        if (property !== properties[key]) {
                                            delete properties[key];
                                        }
                                    }
                                }
                                return properties;
                            }, Object.assign({}, l.features[0].getData()));
                        // Las propiedades pueden ser complejas, teniendo propiedades value y displayName
                        // En ese caso aplanamos
                        const commonPropertiesObj = {};
                        for (var key in commonProperties) {
                            const value = commonProperties[key];
                            commonPropertiesObj[value?.displayName || key] = value?.value || value;
                        }
                        commonPropertiesByLegendWatch.push(commonPropertiesObj);
                    });
                    // Averiguamos qué propiedades comunes dentro de grupo son distintas entre grupos
                    const keys = Object.keys(commonPropertiesByLegendWatch[0]);
                    const distinctKeys = [];
                    keys.forEach(function fillDistinctKeysArray(key) {
                        const values = commonPropertiesByLegendWatch.map(props => props[key]);
                        const hasDuplicates = new Set(values).size < values.length;
                        if (!hasDuplicates) {
                            distinctKeys.push(key);
                        }
                    });
                    // Completamos los textos para cada símbolo de la leyenda
                    const distinctKey = distinctKeys[0];
                    if (distinctKey) {
                        node.legendTitle = distinctKey;
                        node.legend.forEach(function addTexts(l, idx) {
                            l.value = commonPropertiesByLegendWatch[idx][distinctKey];
                        });
                    }
                }
            });

            if (self.styles || self.cluster) {
                const legendImages = [];
                if (self.cluster) {
                    legendImages.push(Util.getLegendImageFromStyle(
                        Util.extend({}, self.cluster.styles?.point, { radius: Cfg.styles.point.radius + 2, offset: [0, 6] }),
                        { geometryType: Consts.geom.POINT }
                    ));
                }
                if (self.styles?.point) {
                    legendImages.push(Util.getLegendImageFromStyle(self.styles.point, { geometryType: Consts.geom.POINT }));
                }
                if (self.styles?.line) {
                    legendImages.push(Util.getLegendImageFromStyle(self.styles.line, { geometryType: Consts.geom.POLYLINE }));
                }
                if (self.styles?.polygon) {
                    legendImages.push(Util.getLegendImageFromStyle(self.styles.polygon, { geometryType: Consts.geom.POLYGON }));
                }
                result.legend = {
                    src: getMergedLegendImage(legendImages)
                };
            }
            result.name = self.name || result.name;
            result.customLegend = self.options.customLegend; //Atributo para pasar una plantilla HTML diferente a la por defecto (LegendNode.html)
            result.title = self.title || result.title;
            result.uid = self.id;
        }
        self.tree = result
        return result;
    }

    async #addFeatureInternal(multipleFeatureFunction, coord, options) {
        const self = this;
        const features = await multipleFeatureFunction.call(self, [coord], options);
        if (self.map) {
            self.map.trigger(Consts.event.FEATUREADD, { layer: self, feature: features[0] });
        }
        return features[0];
    }

    async #addFeaturesInternal(coordsArray, constructorName, styleType, options) {
        const self = this;
        let FeatureConstructor;
        if (constructorName) {
            FeatureConstructor = featureNamespace[constructorName];
        }
        else {
            FeatureConstructor = Feature;
        }
        var features = new Array(coordsArray.length);
        var nativeFeatures = [];
        for (var i = 0, len = coordsArray.length; i < len; i++) {
            const opts = Util.extend(true, {}, options);
            let coords = coordsArray[i];
            let feature;
            const isNative = TC.wrap.Feature.prototype.isNative(coords);
            if (coords instanceof FeatureConstructor) {
                feature = coords;
            }
            else {
                if (isNative) {
                    feature = coords._wrap && coords._wrap.parent;
                }
                if (!feature) {
                    opts.layer = self;
                    const layerStyle = self.styles && self.styles[styleType];
                    if (Util.hasStyleOptions(opts) || !layerStyle) {
                        // Si las opciones tienen estilos, o la capa no los tiene, creamos un objeto de estilos para la feature
                        const externalStyles = Object.assign({}, Cfg.styles, self.map ? self.map.options.styles : null);
                        Object.assign(opts, externalStyles[styleType], layerStyle, options);
                    }
                    feature = new FeatureConstructor(coords, opts);
                }
            }
            feature.layer = self;
            features[i] = feature;
            self.features.push(feature);
            if (!isNative) {
                nativeFeatures.push(feature.wrap.feature);
            }
            if (feature.options.showPopup) {
                feature.showInfo();
            }
            // Este evento mata el rendimiento
            //self.map.trigger(Consts.event.FEATUREADD, { layer: self, feature: marker });
        }
        if (nativeFeatures.length) {
            self.wrap.addFeatures(nativeFeatures);
        }
        return features;
    }

    /**
     * Añade un punto a la capa.
     * @method addPoint
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {number[]|SITNA.feature.Point} coordsOrPoint - Si es un array, contiene dos números (la coordenada del punto).
     * @param {SITNA.feature.PointOptions} [options] - Este parámetro se ignora si `coordsOrPoint` es una instancia de {@link SITNA.feature.Point}.
     * @returns {Promise<SITNA.feature.Point>} Punto añadido.
     * @see [Ejemplo de uso](../examples/feature.Point.html)
     */
    addPoint(coordsOrPoint, options) {
        return this.#addFeatureInternal(this.addPoints, coordsOrPoint, options);
    }

    /**
     * Añade una colección de puntos a la capa.
     * @method addPoints
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<number[]>|Array.<SITNA.feature.Point>} coordsOrPoints - Los elementos de esta lista son cualquiera de los que acepta el método [addPoint]{@link SITNA.layer.Vector#addPoint}.
     * @param {SITNA.feature.PointOptions} [options] - Este parámetro se ignora si `coordsOrPointArray` contiene instancias de {@link SITNA.feature.Point}.
     * @returns {Promise<SITNA.feature.Point[]>} Array de puntos.
     * @see [Ejemplo de uso](../examples/feature.Point.html)
     */
    addPoints(coordsOrPointArray, options) {
        return this.#addFeaturesInternal(coordsOrPointArray, 'Point', Consts.geom.POINT, options);
    }

    /**
     * Añade una entidad de varios puntos a la capa.
     * @method addMultiPoint
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<number[]>|SITNA.feature.MultiPoint} coordsOrMultiPoint - Array con las coordenadas de los puntos en el CRS del mapa
     * u objeto {@link SITNA.feature.MultiPoint}.
     * @param {SITNA.feature.PointOptions} [options]
     * @returns {Promise<SITNA.feature.MultiPoint>} Entidad añadida.
     * @see [Ejemplo de uso](../examples/feature.MultiPoint.html)
     */
    addMultiPoint(coordsOrMultiPoint, options) {
        return this.#addFeatureInternal(this.addMultiPoints, coordsOrMultiPoint, options);
    }

    /**
     * Añade una colección de entidades de varios puntos a la capa.
     * @method addMultiPoints
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<Array.<number[]>|SITNA.feature.MultiPoint>} coordsOrMultiPoint - Array cuyos elementos son objetos {@link SITNA.feature.MultiPoint}
     * o sus coordenadas en el CRS del mapa.
     * @param {SITNA.feature.PointOptions} [options]
     * @returns {Promise<SITNA.feature.MultiPoint[]>} Array de entidades añadidas.
     */
    addMultiPoints = function (coordsOrMultiPointArray, options) {
        return this.#addFeaturesInternal(coordsOrMultiPointArray, 'MultiPoint', "point", options);
    }

    /**
     * Añade un marcador a la capa.
     * @method addMarker
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<number[]>|SITNA.feature.Marker} coordsOrMarker - Las coordenadas del marcador en el CRS del mapa
     * o un objeto {@link SITNA.feature.Marker}.
     * @param {SITNA.feature.MarkerOptions} [options]
     * @return {Promise<SITNA.feature.Marker>} Marcador añadido.
     * @see [Ejemplo de uso](../examples/feature.Marker.html)
     */
    addMarker(coord, options) {
        return this.#addFeatureInternal(this.addMarkers, coord, options);
    }

    /**
     * Añade una colección de de marcadores a la capa.
     * @method addMarkers
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<Array.<number[]>|SITNA.feature.Marker>} coordsOrMarkers - Los elementos de esta lista 
     * son cualquiera de los que acepta el método [addMarker]{@link SITNA.layer.Vector#addMarker}.
     * @param {SITNA.feature.MarkerOptions} [options]
     * @return {Promise<SITNA.feature.Marker[]>} Array de marcadores añadidos.
     */
    addMarkers(coordsOrMarkerArray, options) {
        return this.#addFeaturesInternal(coordsOrMarkerArray, 'Marker', 'marker', options);
    }

    /**
     * Añade una entidad de varios marcadores a la capa.
     * @method addMultiMarker
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<number[]>|SITNA.feature.MultiMarker} coordsOrMultiMarker - Array con las coordenadas de los puntos en el CRS del mapa
     * u objeto {@link SITNA.feature.MultiMarker}.
     * @param {SITNA.feature.MarkerOptions} [options]
     * @returns {Promise<SITNA.feature.MultiMarker>} Entidad añadida.
     * @see [Ejemplo de uso](../examples/feature.MultiMarker.html)
     */
    addMultiMarker(coordsOrMultiMarker, options) {
        return this.#addFeatureInternal(this.addMultiMarkers, coordsOrMultiMarker, options);
    }

    /**
     * Añade una colección de entidades de varios marcadores a la capa.
     * @method addMultiMarkers
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<Array.<number[]>|SITNA.feature.MultiMarker>} coordsOrMultiMarker - Array cuyos elementos son objetos {@link SITNA.feature.MultiMarker}
     * o sus coordenadas en el CRS del mapa.
     * @param {SITNA.feature.MarkerOptions} [options]
     * @returns {Promise<SITNA.feature.MultiMarker[]>} Array de entidades añadidas.
     */
    addMultiMarkers(coordsOrMultiMarkerArray, options) {
        return this.#addFeaturesInternal(coordsOrMultiMarkerArray, 'MultiMarker', "marker", options);
    }

    /**
     * Añade una entidad geográfica de línea de varios segmentos a la capa.
     * @method addPolyline
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<number[]>|SITNA.feature.Polyline} coordsOrPolyline - Array de las coordenadas de los vértices de la línea
     * u objeto {@link SITNA.feature.Polyline}.
     * @param {SITNA.feature.PolylineOptions} [options]
     * @return {Promise<SITNA.feature.Polyline>} Entidad añadida.
     * @see [Ejemplo de uso](../examples/feature.Polyline.html)
     */
    addPolyline(coordsOrPolyline, options) {
        return this.#addFeatureInternal(this.addPolylines, coordsOrPolyline, options);
    }

    /**
     * Añade una colección de entidades geográficas de línea de varios segmentos a la capa.
     * @method addPolylines
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {array} coordsOrPolylines - Los elementos de esta lista son cualquiera de los que acepta 
     * el método [addPolyline]{@link SITNA.layer.Vector#addPolyline}.
     * @param {SITNA.feature.PolylineOptions} [options]
     * @return {Promise<SITNA.feature.Polyline[]>} Array de entidades añadidas.
     * @see [Ejemplo de uso](../examples/feature.Polyline.html)
     */
    addPolylines(coordsOrPolylineArray, options) {
        //URI: El tipo de estilo se especifica LINE pero realmente deberia ser TC.Const.Style.LINE
        return this.#addFeaturesInternal(coordsOrPolylineArray, 'Polyline', "line", options);
    }

    /**
     * Añade una entidad geográfica de varias líneas de varios segmentos a la capa.
     * @method addMultiPolyline
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<Array.<number[]>>|SITNA.feature.MultiPolyline} coordsOrMultiPolyline - Array cuyos elementos son coordenadas de objetos {@link SITNA.feature.Polyline}
     * u objeto {@link SITNA.feature.MultiPolyline}.
     * @param {SITNA.feature.PolylineOptions} [options]
     * @return {Promise<SITNA.feature.MultiPolyline>} Entidad añadida.
     * @see [Ejemplo de uso](../examples/feature.MultiPolyline.html)
     */
    addMultiPolyline(coordsOrMultiPolyline, options) {
        return this.#addFeatureInternal(this.addMultiPolylines, coordsOrMultiPolyline, options);
    }

    /**
     * Añade una colección de entidades de varias líneas multisegmento a la capa.
     * @method addMultiPolylines
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<Array.<Array.<number[]>>|SITNA.feature.MultiPolyline>} coordsOrMultiPolylines - Array cuyos elementos son objetos {@link SITNA.feature.MultiPolyline}
     * o sus coordenadas en el CRS del mapa.
     * @param {SITNA.feature.PolylineOptions} [options]
     * @returns {Promise<SITNA.feature.MultiPolyline[]>} Array de entidades añadidas.
     * @see [Ejemplo de uso](../examples/feature.MultiPolyline.html)
     */
    addMultiPolylines(coordsOrMultiPolylineArray, options) {
        //URI: El tipo de estilo se especifica LINE pero realmente deberia ser TC.Const.Style.LINE
        return this.#addFeaturesInternal(coordsOrMultiPolylineArray, 'MultiPolyline', "line", options);
    }

    /**
     * Añade un polígono a la capa.
     * @method addPolygon
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<Array.<number[]>>|SITNA.feature.Polygon} coordsOrPolygon - Array de las coordenadas de los contornos del polígono
     * u objeto {@link SITNA.feature.Polygon}.
     * @param {SITNA.feature.PolygonOptions} [options]
     * @return {Promise<SITNA.feature.Polygon>} Entidad añadida.
     * @see [Ejemplo de uso](../examples/feature.Polygon.html)
     */
    addPolygon(coordsOrPolygon, options) {
        return this.#addFeatureInternal(this.addPolygons, coordsOrPolygon, options);
    }

    /**
     * Añade una colección de polígonos a la capa.
     * @method addPolygons
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {array} coordsOrPolygons - Los elementos de esta lista son cualquiera de los que acepta el método [addPolygon]{@link SITNA.layer.Vector#addPolygon}.
     * @param {SITNA.feature.PolygonOptions} [options]
     * @returns {Promise<SITNA.feature.Polygon[]>} Array de entidades añadidas.
     * @see [Ejemplo de uso](../examples/feature.Polygon.html)
     */
    addPolygons(coordsOrPolygonArray, options) {
        //URI: El tipo de style se especifica POLIGON pero realmente deberia ser TC.Const.Style.POLYGON
        return this.#addFeaturesInternal(coordsOrPolygonArray, 'Polygon', Consts.geom.POLYGON, options);
    }

    /**
     * Añade una entidad geográfica de varios polígonos a la capa.
     * @method addMultiPolygon
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<Array.<Array.<number[]>>>|SITNA.feature.MultiPolygon} coordsOrMultiPolygon - Array cuyos elementos son coordenadas de objetos {@link SITNA.feature.Polygon}
     * u objeto {@link SITNA.feature.MultiPolygon}.
     * @param {SITNA.feature.PolygonOptions} [options]
     * @return {Promise<SITNA.feature.MultiPolygon>} Entidad añadida.
     * @see [Ejemplo de uso](../examples/feature.MultiPolygon.html)
     */
    addMultiPolygon(coordsOrMultiPolygon, options) {
        return this.#addFeatureInternal(this.addMultiPolygons, coordsOrMultiPolygon, options);
    }

    /**
     * Añade una colección de entidades de varios polígonos a la capa.
     * @method addMultiPolygons
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<Array.<Array.<Array.<number[]>>>|SITNA.feature.MultiPolygon>} coordsOrMultiPolygons - Array cuyos elementos son objetos {@link SITNA.feature.MultiPolygon}
     * o sus coordenadas en el CRS del mapa.
     * @param {SITNA.feature.PolygonOptions} [options]
     * @returns {Promise<SITNA.feature.MultiPolygon[]>} Array de entidades añadidas.
     */
    addMultiPolygons(coordsOrMultiPolygonArray, options) {
        //URI: El tipo de style se especifica POLIGON pero realmente deberia ser TC.Const.Style.POLYGON
        return this.#addFeaturesInternal(coordsOrMultiPolygonArray, 'MultiPolygon', Consts.geom.POLYGON, options);
    }

    /**
     * Añade una entidad con geometría circular a la capa.
     * @method addCircle
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array|SITNA.feature.CircleGeometry|SITNA.feature.Circle} geometryOrCircle - Si es un array, contiene dos elementos, el primero es
     * un array de dos números (la coordenada del centro) y el segundo es un número (el radio).
     * @param {SITNA.feature.PolygonOptions} [options]
     * @returns {Promise<SITNA.feature.Circle>} Entidad añadida.
     * @see [Ejemplo de uso](../examples/feature.Circle.html)
     */
    addCircle(geometryOrCircle, options) {
        return this.#addFeatureInternal(this.addCircles, geometryOrCircle, options);
    }

    /**
     * Añade una colección de entidades con geometría circular a la capa.
     * @method addCircles
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {Array.<Array|SITNA.feature.CircleGeometry|SITNA.feature.Circle>} geometryOrCircles - Array
     * cuyos elementos son cualquiera de los que acepta el método [addCircle]{@link SITNA.layer.Vector#addCircle}.
     * @param {SITNA.feature.PolygonOptions} [options]
     * @returns {Promise<SITNA.feature.Circle[]>} Array de entidades añadidas.
     * @see [Ejemplo de uso](../examples/feature.Circle.html)
     */
    addCircles(geometryOrCircleArray, options) {
        //URI: El tipo de geometria se especifica POLIGON pero realmente deberia ser TC.Const.Style.POLYGON
        return this.#addFeaturesInternal(geometryOrCircleArray, 'Circle', Consts.geom.POLYGON, options);
    }

    /**
     * Añade una entidad geográfica a la capa.
     * @method addFeature
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {SITNA.feature.Feature} feature - Entidad geográfica a añadir
     * @returns {Promise<SITNA.feature.Feature>} Entidad añadida.
     */
    addFeature(feature) {
        const self = this;
        var result;
        if (feature instanceof Point) {
            result = self.addPoint(feature);
        }
        else if (feature instanceof Polyline) {
            result = self.addPolyline(feature);
        }
        else if (feature instanceof Polygon) {
            result = self.addPolygon(feature);
        }
        else if (feature instanceof MultiPolygon) {
            result = self.addMultiPolygon(feature);
        }
        else if (feature instanceof MultiPolyline) {
            result = self.addMultiPolyline(feature);
        }
        else if (feature instanceof Circle) {
            result = self.addCircle(feature);
        }
        else {
            result = self.#addFeaturesInternal([feature]);
        }
        return result;
    }

    /**
     * Añade una colección de entidades geográficas a la capa.
     * @method addFeatures
     * @memberof SITNA.layer.Vector
     * @instance
     * @async
     * @param {SITNA.feature.Feature[]} features - Array de entidades geográficas a añadir
     * @returns {Promise<SITNA.feature.Feature[]>} Array de entidades añadidas.
     */
    addFeatures(features) {
        return this.#addFeaturesInternal(features);
    }

    /**
     * Elimina una entidad geográfica de la capa.
     * @method removeFeature
     * @memberof SITNA.layer.Vector
     * @instance
     * @param {SITNA.feature.Feature} feature - Entidad a eliminar
     */
    removeFeature(feature) {
        const self = this;
        if (feature.layer && self.features.indexOf(feature) >= 0) {
            self.wrap.removeFeature(feature);
            feature.layer = null;
        }
    }

    /**
     * Obtiene de la capa la entidad geográfica especificada por el parámetro.
     * @method getFeature
     * @memberof SITNA.layer.Vector
     * @instance
     * @param {string|SITNA.feature.Feature} feature - Identificador de la entidad geográfica 
     * que estamos buscando o instancia de la clase de entidad geográfica.
     * @returns {SITNA.feature.Feature|null} Entidad o `null` si no se ha encontrado ninguna en la capa.
     */
    getFeature(feature) {
        const self = this;
        if (feature instanceof Feature) {
            if (self.features.includes(feature)) {
                return feature;
            }
        }
        else {
            return self.getFeatureById(feature);
        }
        return null;
    }

    getFeatureById(id) {
        const self = this;
        let result = null;
        var olFeat = self.wrap.getFeatureById(id);
        if (olFeat) {
            result = olFeat._wrap.parent;
        }
        return result;
    }

    /**
     * Borra todas las entidades de la capa.
     * @method clearFeatures
     * @memberof SITNA.layer.Vector
     * @instance
     */
    clearFeatures() {
        const self = this;
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
    }

    getDescribeFeatureTypeUrl(layerNames) {
        const self = this;
        const version = self.options.version || self.capabilities.version || '1.1.0';
        let featureType = layerNames || self.featureType;
        featureType = Array.isArray(featureType) ? featureType : [featureType];
        return self.url + '?service=WFS&' + 'version=' + version + '&request=DescribeFeatureType&typename=' + featureType.join(',') + '&outputFormat=' + encodeURIComponent(self.capabilities.Operations.DescribeFeatureType.outputFormat);
    }

    async describeFeatureType(layerName, callback, error) {
        const self = this;
        let result;
        if (!layerName) {
            layerName = self.featureType;
        }
        const _getStoredFeatureTypes = function (layerName, collection) {
            if (!Array.isArray(layerName)) layerName = layerName.split(',');
            return layerName.reduce((acc, name) => Object.assign(acc, { [name]: collection[name] }), {});
        };
        try {
            const capabilities = await self.getCapabilitiesPromise();
            if (!capabilities.Operations.DescribeFeatureType) {
                throw Error("No esta disponible el método describeFeatureType");
            }
            self.#featureTypeParser ??= new FeatureTypeParser();
            const dftProcess = async function (layers) {
                var data = await self.proxificationTool.fetchXML(self.getDescribeFeatureTypeUrl(layers || self.featureType));
                return await self.#featureTypeParser.parseFeatureTypeDescription(data, layers);
            };

            //si no es una array convierto en Array
            if (!Array.isArray(layerName)) layerName = layerName.split(',');
            //si tiene distinto Namespace separo las pediciones describeFeatureType										
            var arrPromises = Object.entries(layerName.reduce(function (vi, va) {
                let prefix = va.substring(0, va.indexOf(":"));
                if (!vi[prefix]) {
                    let temp = {};
                    temp[prefix] = [va];
                    return Object.assign(vi, temp);
                } else {
                    vi[prefix].push(va);
                    return vi;
                }
            }, {})).map(function (params) {
                var layers = params[1];
                if (self.#featureTypeParser.getFeatureTypeDescription(layers)) {
                    return _getStoredFeatureTypes(layers, self.#featureTypeParser.getFeatureTypeDescriptions());
                }
                return dftProcess(layers);
            });
            const response = await Promise.all(arrPromises);
            let objReturned = response.reduce(function (vi, va) {
                return Object.assign(vi, va);
            }, {});

            //si solo hay un objeto devuelvo directamente los atributos	de este				
            result = Object.keys(objReturned).length === 1 ? objReturned[Object.keys(objReturned)[0]] : objReturned;

            if (Util.isFunction(callback)) {
                callback(result);
            }
        }
        catch (e) {
            if (Util.isFunction(error)) {
                error(e);
            }
            throw e;
        }

        return result;
    }

    import(options) {
        this.wrap.import(options);
    }

    setNodeVisibility(id, visible) {
        const self = this;

        const nodes = [];
        id = Array.isArray(id) ? id : [id];


        self.state = Layer.state.LOADING;
        self.map.trigger(Consts.event.BEFOREUPDATE);
        self.map.trigger(Consts.event.BEFORELAYERUPDATE, { layer: self });

        id.forEach(function (id) {
            nodes.push(Layer.prototype.setNodeVisibility.call(self, id, visible));
        });
        if (nodes.some((node) => !node.parent)) { // Si es el nodo raíz, es la capa entera
            self.setVisibility(visible);
        }
        else {

            nodes.forEach((node) => {
                visibilityCache.set(node.uid, visible ? Consts.visibility.VISIBLE : Consts.visibility.NOT_VISIBLE);
                //02/02/2022 URI: Si se pincha en un nodo que tiene hijos se cambian los estos con el valor dado
                //salvo que se quiera hace visible un nodo que no esta en la cache.
                node.children.forEach((children) => {
                    self.setNodeVisibility(children.uid, visible);
                });
                if (node.parent) {
                    const parentNodeVisibility = visibilityCache.get(node.parent.uid);
                    ////si todos los hijos están visible se hace visible el padre
                    //if ((parentNode === Consts.visibility.NOT_VISIBLE || self.isRoot(node.parent)) && 
                    //  node.parent.children.length > 0 && 
                    //  node.parent.children.every(c => {
                    //        const n = visibilityCache.get(c.uid);
                    //        return n === undefined || n !== Consts.visibility.NOT_VISIBLE);
                    //    }) {
                    ////if ((parentNode === Consts.visibility.NOT_VISIBLE || !visibilityCache.has(node.parent.uid)) && node.parent.children.length > 0 && node.parent.children.every(c => {
                    //        const n = visibilityCache.get(c.uid);
                    //        return n === undefined || n !== Consts.visibility.NOT_VISIBLE);
                    //    })) {
                    //    self.setNodeVisibility(node.parent.uid, true);
                    //}
                    //si todos los hijos estan ocultos se oculta el padre
                    if (parentNodeVisibility !== Consts.visibility.NOT_VISIBLE &&
                        node.parent.children.length > 0 &&
                        node.parent.children.every(c => visibilityCache.get(c.uid) === Consts.visibility.NOT_VISIBLE)) {
                        self.setNodeVisibility(node.parent.uid, false);
                    }
                }
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
                        //URI: 31/12/2021 Si un KML tiene elementos anidados en 2 o mas folders cambiar la visibilidad de los superiores no afectaba a las features descendientes
                        if (f._path === id || f._path.startsWith(id)) {
                            f.setVisibility(visible);
                        }
                    }
                }
            })

        }
        self.state = Layer.state.IDLE;
        self.map.trigger(Consts.event.LAYERUPDATE, { layer: self });
        self.map.trigger(Consts.event.UPDATE);
        return nodes.length > 1 ? nodes : nodes[0];
    }

    getNodeVisibility(id) {
        var self = this;
        var result = super.getNodeVisibility.call(self, id);

        var node = self.findNode(id, self.getTree());
        if (!node) return undefined;
        if (node === self.getTree()) {
            result = self.getVisibility() ? Consts.visibility.VISIBLE : Consts.visibility.NOT_VISIBLE;
            if (result === Consts.visibility.VISIBLE &&
                Array.from(visibilityCache.values()).some(v => v === Consts.visibility.NOT_VISIBLE)) {
                result = Consts.visibility.HAS_VISIBLE;
            }
        }
        else {
            var r = visibilityCache.get(id);
            if (r !== undefined) {
                result = r;
                const someOppositeState = Array.from(visibilityCache.entries()).some(arr => arr[0] !== id && arr[0].startsWith(id) && arr[1] !== result);
                if (someOppositeState) {
                    result = Consts.visibility.HAS_VISIBLE;
                }
            }
            else {
                const someHidden = Array.from(visibilityCache.entries()).some(arr => arr[0] !== id && arr[0].startsWith(id) && !arr[1]);
                const everyHidden = node.children.length > 0 && node.children.every(c => visibilityCache.get(c.uid) === Consts.visibility.NOT_VISIBLE);
                if (everyHidden) {
                    result = Consts.visibility.NOT_VISIBLE;
                }
                else if (someHidden) {
                    result = Consts.visibility.HAS_VISIBLE;
                }
                else {
                    result = Consts.visibility.VISIBLE;
                }
            }
        }
        return result;
    }

    getPath() {
        const result = [];
        if (this.file) {
            if (this.fileSystemFile && this.fileSystemFile !== this.file) {
                result.push(this.fileSystemFile);
            }
            result.push(this.file);
        }
        return result;
    }

    setModifiable(modifiable) {
        this.wrap.setModifiable(modifiable);
    }

    applyEdits(inserts, updates, deletes) {
        return this.wrap.sendTransaction(inserts, updates, deletes);
    }

    refresh() {
        const self = this;
        self.clearFeatures();
        return self.wrap.reloadSource();
    }

    getFeaturesInCurrentExtent(tolerance) {
        const self = this;
        const extent = self.map.getExtent();
        return self.getFeaturesInExtent(extent, tolerance);
    }

    //getGetCapabilitiesUrl() {
    //    const self = this;
    //    const version = self.options.version || '1.1.0';
    //    return self.url + '?service=WFS&' + 'version=' + version + '&request=GetCapabilities';
    //};

    getFeaturesInExtent(extent, tolerance) {
        return this.wrap.getFeaturesInExtent(extent, tolerance);
    }

    setProjection(options) {
        const self = this;
        self.wrap.setProjection(options);
        if (options.crs && options.oldCrs) {
            self.map.trigger(Consts.event.BEFORELAYERUPDATE, { layer: self });
            self.features.forEach(function (feat) {
                feat.setCoordinates(feat.getCoordinates({
                    geometryCrs: options.oldCrs,
                    crs: options.crs
                }));
            });
            self.map.trigger(Consts.event.LAYERUPDATE, { layer: self });
        }
    }

    getAllowedGeometryTypes() {
        return [...this.#allowedGeometryTypes.values()];
    }

    setAllowedGeometryTypes(types = []) {
        this.#allowedGeometryTypes = new Set(types);
        return this;
    }

    isGeometryTypeAllowed(feature) {
        if (this.#allowedGeometryTypes.size === 0) {
            return true;
        }
        return this.#allowedGeometryTypes.has(feature.getGeometryType());
    }

    async getFeatureTypeMetadata() {
        if (this.type === Consts.layerType.WFS && !this.#featureTypeMetadata) {
            try {
                const featureTypeDescription = await this.describeFeatureType();
                this.#featureTypeMetadata = {
                    name: this.featureType,
                    origin: Consts.layerType.WFS,
                    originaData: featureTypeDescription,
                    geometries: [],
                    attributes: []
                };
                const getType = (wfsType) => {
                    switch (wfsType) {
                        case 'number':
                        case 'double':
                        case 'float':
                        case 'decimal':
                            return Consts.dataType.FLOAT;
                        case 'boolean':
                            return Consts.dataType.BOOLEAN;
                        case 'int':
                        case 'integer':
                        case 'byte':
                        case 'long':
                        case 'negativeInteger':
                        case 'nonNegativeInteger':
                        case 'nonPositiveInteger':
                        case 'positiveInteger':
                        case 'short':
                        case 'unsignedLong':
                        case 'unsignedInt':
                        case 'unsignedShort':
                        case 'unsignedByte':
                            return Consts.dataType.INTEGER;
                        case 'date':
                            return Consts.dataType.DATE;
                        case 'time':
                            return Consts.dataType.TIME;
                        case 'dateTime':
                            return Consts.dataType.DATETIME;
                        default:
                            return Consts.dataType.STRING;
                    }
                }
                for (let name in featureTypeDescription) {
                    const attribute = featureTypeDescription[name];
                    const geometryType = Util.getGeometryType(attribute.type);
                    if (geometryType) {
                        const geometryMetadata = {
                            name,
                            originalType: attribute.type
                        };
                        geometryMetadata.type = geometryType;
                        this.#featureTypeMetadata.geometries.push(geometryMetadata);
                    }
                    else {
                        const attributeMetadata = {
                            name,
                            type: getType(attribute.type),
                            originalType: attribute.type
                        };
                        if (typeof attribute.type === 'string' && attribute.type.substring(attribute.type.indexOf(':') + 1) === 'ID') {
                            attributeMetadata.isId = true;
                        }
                        if (attribute['@minOccurs'] === 0) {
                            attributeMetadata.optional = true;
                        }
                        this.#featureTypeMetadata.attributes.push(attributeMetadata);
                    }
                }
            }
            catch (_e) { }
        }
        return this.#featureTypeMetadata;
    }

    setFeatureTypeMetadata(obj) {
        this.#featureTypeMetadata = obj;
        return this;
    }

    setStyles(options) {
        const self = this;
        self.styles = Util.extend({}, options);
        self.wrap.setStyles(options);
    }

    exportState(options = {}) {
        const self = this;
        const lObj = {
            id: self.id
        };
        if (self.map && self.map.crs !== self.map.options.crs) {
            lObj.crs = self.map.crs;
        }

        // Aplicamos una precisión un dígito mayor que la del mapa, si no, al compartir algunas parcelas se deforman demasiado
        var precision = Math.pow(10, (self.map.wrap.isGeo() ? Consts.DEGREE_PRECISION : Consts.METER_PRECISION) + 1);
        let commonStyles = null;
        const features = options.features || self.features;
        const sanitizeData = (data) => {
            if (data && typeof data === 'object') {
                const result = {};
                for (const key in data) {
                    result[key] = sanitizeData(data[key]);
                }
                return result;
            }
            if (Util.isFunction(data)) {
                return null;
            }
            return data;
        };
        lObj.features = features
            .map(function (f) {
                const fObj = {
                    id: f.id,
                    type: f.getGeometryType(),
                    geom: Util.compactGeometry(f.geometry, precision),
                    data: sanitizeData(f.getData()),
                    autoPopup: f.autoPopup,
                    showsPopup: f.showsPopup
                };
                let layerStyle = self.styles?.[f.STYLETYPE] ||
                    self.map?.options?.styles?.[f.STYLETYPE] || TC.Cfg.styles?.[f.STYLETYPE];
                if (options.exportStyles === undefined || options.exportStyles) {
                    layerStyle = Util.extend({}, layerStyle);
                    for (var key in layerStyle) {
                        var val = layerStyle[key];
                        if (Util.isFunction(val)) {
                            layerStyle[key] = val(f);
                        }
                    }
                    fObj.style = Util.extend(layerStyle, f.getStyle());
                    if (!commonStyles) commonStyles = Object.assign({}, fObj.style);
                    else
                        commonStyles = compareStyles(commonStyles, fObj.style);
                }
                return fObj;
            });
        if (!options.features && commonStyles && Object.keys(commonStyles).length) {
            //Ahora borramos las propiedades de cada feature que son comunes a todos
            lObj.features.forEach(function (feature) {
                feature.style = compareStyles(feature.style, commonStyles, false);
            });
            lObj.style = commonStyles;
        }
        return lObj;
    }

    async importState(obj) {
        const self = this;
        const promises = new Array(obj.features.length);
        obj.features.forEach(function (f, idx) {
            let style = Util.extend({}, obj.style || {}, f.style);
            const featureOptions = Util.extend({}, style, {
                data: f.data,
                id: f.id,
                showsPopup: f.showsPopup,
                showPopup: f.autoPopup
            });
            var addFn;
            switch (f.type) {
                case Consts.geom.POLYGON:
                    addFn = self.addPolygon;
                    break;
                case Consts.geom.MULTIPOLYGON:
                    addFn = self.addMultiPolygon;
                    break;
                case Consts.geom.POLYLINE:
                    addFn = self.addPolyline;
                    break;
                case Consts.geom.MULTIPOLYLINE:
                    addFn = self.addMultiPolyline;
                    break;
                case Consts.geom.CIRCLE:
                    addFn = self.addCircle;
                    break;
                case Consts.geom.MULTIPOINT:
                    if (f.style && (f.style.url || f.style.className)) {
                        addFn = self.addMultiMarker;
                    }
                    else {
                        addFn = self.addMultiPoint;
                    }
                    break;
                case Consts.geom.POINT:
                    if (style && (style.url || style.className)) {
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
                var geom = Util.explodeGeometry(f.geom);
                if (obj.crs && self.map.crs !== obj.crs) {
                    promises[idx] = new Promise(function (res, rej) {
                        self.map.one(Consts.event.PROJECTIONCHANGE, function (_e) {
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
        await Promise.all(promises);
    }

    clone() {
        const self = this;
        const clone = super.clone.call(self);
        self.features.forEach(f => clone.addFeature(f.clone()));
        return clone;
    }

    getGetCapabilitiesUrl() {
        const self = this;
        if (self.type === Consts.layerType.WFS) {
            const getUrl = () => self.options.url || self.url;
            const _src = !Util.isSecureURL(getUrl()) && Util.isSecureURL(Util.toAbsolutePath(getUrl())) ? self.getBySSL_(getUrl()) : getUrl();

            var params = {};
            params.SERVICE = 'WFS';
            params.VERSION = '2.0.0';
            params.REQUEST = 'GetCapabilities';

            return _src + '?' + Util.getParamString(params);
        }
        return null;
    }

    getCapabilitiesPromise() {
        const self = this;
        if (self.type === Consts.layerType.WFS) {
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
                    self.#capabilitiesPromise = Promise.resolve(self.capabilities);
                }
                if (TC.capabilitiesWFS[actualUrl]) {
                    resolve(TC.capabilitiesWFS[actualUrl]);
                    self.#capabilitiesPromise = Promise.resolve(TC.capabilitiesWFS[actualUrl]);

                }

                const cachePromise = capabilitiesPromises[actualUrl];
                capabilitiesPromises[actualUrl] = self.#capabilitiesPromise = cachePromise || new Promise(function (res, rej) {
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
                            self.map.trigger(Consts.event.LAYERERROR, { layer: self, reason: 'couldNotGetCapabilities' });
                        }
                        reject(error);
                    });
            });
        }
        else {
            return Promise.reject(new Error(`Layer "${self.id}" does not have capabilities document`));
        }
    }

    setDraggable(draggable, onend, onstart) {
        this.wrap.setDraggable(draggable, onend, onstart);
        return this;
    }
}

TC.layer.Vector = Vector;
export default Vector;

/**
 * Opciones de capa vectorial. Este objeto se utiliza al [configurar un mapa]{@linkplain SITNA.MapOptions} o el [control del catálogo de capas]{@linkplain LayerCatalogOptions},
 * o como parámetro al [añadir una capa]{@linkplain SITNA.Map#addLayer}.
 * @typedef VectorOptions
 * @memberof SITNA.layer
 * @extends SITNA.layer.LayerOptions
 * @see SITNA.MapOptions
 * @see SITNA.control.LayerCatalogOptions
 * @see SITNA.Map#addLayer
 * @see SITNA.Map#setBaseLayer
 * @property {string} id - Identificador único de capa. No puede haber en un mapa dos capas con el mismo valor de `id`.
 * @property {SITNA.layer.ClusterOptions} [cluster] - La capa agrupa sus entidades puntuales cercanas entre sí en grupos (clusters).
 * @property {string} [featureType] - Nombre de la capa del servicio WFS que queremos representar. Propiedad obligatoria
 * solamente en capas de tipo `WFS`.
 * @property {string} [format] - Tipo MIME del formato de archivo de datos geográficos que queremos cargar (GeoJSON, KML, etc.).

  * Para asignar valor a esta propiedad se pueden usar las constantes definidas en [SITNA.Consts.mimeType]{@link SITNA.Consts}.
 * @property {boolean} [hideTree] - Aplicable a capas de tipo [KML]{@link SITNA.Consts}.
 * Si se establece a `true`, la capa no muestra la jerarquía de grupos de capas en la tabla de contenidos ni en la leyenda.
 * @property {boolean} [isBase] - Si se establece a `true`, la capa es un mapa de fondo.
 * @property {boolean} [isDefault] - *__Obsoleta__: En lugar de esta propiedad es recomendable usar la propiedad `defaultBaseLayer`de {@link SITNA.MapOptions}.*
 *
 * Si se establece a true, la capa se muestra por defecto si forma parte de los mapas de fondo.
 * @property {SITNA.layer.LayerOptions|string} [overviewMapLayer] - Definición de la capa que se utilizará como fondo en el control de mapa de situación cuando esta capa está de fondo en el mapa principal.
 * Si el valor es de tipo `string`, tiene que ser un identificador de capas de la API SITNA (un miembro de [SITNA.Consts.layer]{@link SITNA.Consts}).
 *
 * La capa del mapa de situación debe ser compatible con el sistema de referencia de coordenadas del mapa principal (ver propiedad `crs` de {@link SITNA.MapOptions}).
 * @property {boolean} [stealth] - Si se establece a `true`, la capa no aparece en la tabla de contenidos ni en la leyenda.
 * De este modo se puede añadir una superposición de capas de trabajo que el usuario la perciba como parte del mapa de fondo.
 * @property {SITNA.layer.StyleOptions} [styles] - Descripción de los estilos que tendrán las entidades geográficas de la capa.
 * @property {string} [thumbnail] - URL de una imagen en miniatura a mostrar en el selector de mapas de fondo.
 * @property {string} [title] - Título de capa. Este valor se mostrará en la tabla de contenidos y la leyenda.
 * @property {string} [type=[SITNA.Consts.layerType.VECTOR]{@link SITNA.Consts}] - Tipo de capa.
 * La lista de valores posibles está definida en [SITNA.Consts.layerType]{@link SITNA.Consts}.
 * @property {string} [url] - URL del servicio OGC o del archivo de datos geográficos que define la capa.
 * Propiedad obligatoria en capas de tipo [WFS]{@link SITNA.Consts} y [KML]{@link SITNA.Consts}.
 *
 * Los archivos de datos geográficos soportados son [KML]{@link SITNA.Consts}, [GeoJSON]{@link SITNA.Consts}, [GPX]{@link SITNA.Consts}, [GML]{@link SITNA.Consts}, [WKT]{@link SITNA.Consts} y [TopoJSON]{@link SITNA.Consts}.
 * El formato se deduce de la extensión del nombre de archivo, pero también se puede especificar utilizando la propiedad `format`.
 *
 * En el caso de que un fichero KML tenga definido el <a target="_blank" href="https://developers.google.com/kml/documentation/kmlreference#balloonstyle">estilo del bocadillo</a>, este formato será usado al renderizar el bocadillo en visores basados en la API SITNA.
 */

/**
 * Opciones de clustering de puntos de una capa, define si los puntos se tienen que agrupar cuando están más cerca entre sí que un valor umbral.
 *
 * Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef ClusterOptions
 * @memberof SITNA.layer
 * @property {number} distance - Distancia en píxels que tienen que tener como máximo los puntos entre sí para que se agrupen en un cluster.
 * @property {boolean} [animate] - Si se establece a `true`, los puntos se agrupan y desagrupan con una transición animada.
 * @property {SITNA.layer.ClusterStyleOptions} [styles] - Opciones de estilo de los clusters.
 * @see SITNA.layer.VectorOptions
 * @example <caption>[Ver en vivo](../examples/cfg.LayerOptions.cluster.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Creamos un mapa con una capa de puntos de un KML,
 *     // clustering activado a 50 pixels y transiciones animadas.
 *     var map = new SITNA.Map("mapa", {
 *         workLayers: [
 *             {
 *                 id: "cluster",
 *                 type: SITNA.Consts.layerType.KML,
 *                 url: "data/PromocionesViviendas.kml",
 *                 title: "Clusters",
 *                 cluster: {
 *                     distance: 50,
 *                     animate: true
 *                 }
 *             }
 *         ]
 *     });
 * </script>
 */

/**
 * Opciones de estilo de cluster de puntos. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef ClusterStyleOptions
 * @memberof SITNA.layer
 * @see SITNA.layer.StyleOptions
 * @see layout_cfg
 * @property {SITNA.feature.PointStyleOptions} [point] - Opciones de estilo del punto que representa el cluster.
 * @see SITNA.layer.ClusterOptions
 * @example <caption>[Ver en vivo](../examples/cfg.ClusterStyleOptions.point.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Creamos un mapa con una capa vectorial,
 *     // clustering activado a 50 pixels y estilos personalizados.
 *     var map = new SITNA.Map("mapa", {
 *         workLayers: [
 *             {
 *                 id: "cluster",
 *                 type: SITNA.Consts.layerType.VECTOR,
 *                 title: "Clusters",
 *                 styles: {
 *                     point: {
 *                         strokeColor: "#0000ff",
 *                         strokeWidth: 2,
 *                         fillColor: "#0000ff",
 *                         fillOpacity: 0.2,
 *                         radius: 6
 *                     }
 *                 },
 *                 cluster: {
 *                     distance: 50,
 *                     styles: {
 *                         point: {
 *                             fillColor: "#f90",
 *                             fillOpacity: 1,
 *                             strokeColor: "#c60",
 *                             strokeWidth: 2,
 *                             fontColor: "#f90"
 *                         }
 *                     }
 *                 }
 *             }
 *         ]
 *     });
 *
 *     map.loaded(function () {
 *         // Añadimos puntos aleatorios
 *         var extent = SITNA.Cfg.initialExtent;
 *         var dx = extent[2] - extent[0];
 *         var dy = extent[3] - extent[1];
 *
 *         var randomPoint = function () {
 *             var x = extent[0] + Math.random() * dx;
 *             var y = extent[1] + Math.random() * dy;
 *             return [x, y];
 *         }
 *
 *         for (var i = 0; i < 200; i++) {
 *             var point = randomPoint();
 *             map.addMarker(point, {
 *                 layer: "cluster",
 *                 data: {
 *                     x: point[0],
 *                     y: point[1]
 *                 }
 *             });
 *         }
 *     });
 * </script>
 */

/**
 * Opciones de estilo de mapa de calor. Hay que tener en cuenta que el archivo `config.json` de una maquetación puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef HeatmapStyleOptions
 * @memberof SITNA.layer
 * @see SITNA.layer.StyleOptions
 * @see layout_cfg
 * @property {number} [blur=15] - Ancho en píxeles del difuminado de las manchas del mapa de calor.
 * @property {string[]} [gradient=["#00f", "#0ff", "#0f0", "#ff0", "#f00"]] - Gradiente de colores de las manchas de mapa
 * de calor. Debe ser un array de cadenas CSS de color.
 * @property {number} [radius=8] - Radio en píxeles de la mancha unitaria en el mapa de calor.
 * @example <caption>[Ver en vivo](../examples/cfg.HeatmapStyleOptions.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *     // Crear un mapa con una capa vectorial, mapa de calor activado con un radio de 32 píxeles,
 *     // un difuminado de 16 píxeles y un gradiente de colores azul-rojo-dorado.
 *     var map = new SITNA.Map("mapa", {
 *         workLayers: [
 *             {
 *                 id: "heatmap",
 *                 type: SITNA.Consts.layerType.VECTOR,
 *                 title: "Mapa de calor",
 *                 heatmap: {
 *                     radius: 16,
 *                     blur: 32,
 *                     gradient: [
 *                         "#00008b",
 *                         "#dc143c",
 *                         "#ffd700"
 *                     ]
 *                 }
 *             }
 *         ]
 *     });
 *
 *     map.loaded(function () {
 *         // Añadimos puntos aleatorios
 *         var extent = SITNA.Cfg.initialExtent;
 *         var dx = extent[2] - extent[0];
 *         var dy = extent[3] - extent[1];
 *
 *         var randomPoint = function () {
 *             var x = extent[0] + Math.random() * dx;
 *             var y = extent[1] + Math.random() * dy;
 *             return [x, y];
 *         }
 *
 *         for (var i = 0; i < 200; i++) {
 *             var point = randomPoint();
 *             map.addMarker(point, {
 *                 layer: "heatmap",
 *                 data: {
 *                     x: point[0],
 *                     y: point[1]
 *                 }
 *             });
 *         }
 *     });
 * </script>
 */

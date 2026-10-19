import EventType from 'ol/events/EventType.js';
import VectorEventType from 'ol/source/VectorEventType.js';
import LayerWrapper from "./Layer.js";
import Consts from "../../Consts.js";
import Util from "../../Util.js";
import {
    getStyleFromNative,
    getFormatFromName,
    getNativeFeatureStyle,
    createNativeStyle,
    mergeMapAndGeneralStyles,
    getRGBA,
} from "../ol.js";
import { unByKey } from 'ol/Observable.js';
import { Style, Circle as CircleStyle, Fill, Icon, Stroke } from 'ol/style.js';
import { loadFeaturesXhr } from 'ol/featureloader.js';
import { Vector as VectorSource, Cluster } from 'ol/source.js';
import { Layer, Vector as VectorLayer, /*WebGLVector,*/ Heatmap } from 'ol/layer.js';
import { Translate } from 'ol/interaction.js';
import {
    Point,
    MultiPoint,
    Polygon,
    MultiPolygon,
} from 'ol/geom.js';
import GML2 from 'ol/format/GML2.js';
import GML3 from 'ol/format/GML3.js';
import GML32 from '../../../lib/ol/format/GML32.js';
import { WFS } from 'ol/format.js';
import KML from '../../../lib/ol/format/KML.js';
import GeoJSON from '../../../lib/ol/format/GeoJSON.js';
import SitnaLayer from "../../../SITNA/layer/Layer.js";
import SitnaFeature from "../../../SITNA/feature/Feature.js";
import SitnaPoint from "../../../SITNA/feature/Point.js";
import SitnaPolyline from "../../../SITNA/feature/Polyline.js";
import SitnaPolygon from "../../../SITNA/feature/Polygon.js";
import SitnaMultiPolyline from "../../../SITNA/feature/MultiPolyline.js";
import SitnaMultiPolygon from "../../../SITNA/feature/MultiPolygon.js";
import LayerEvent from "../../../SITNA/layer/LayerEvent.js";
import { GMLFilter } from '../../../SITNA/filter.js';

// En OL3 la imagen tiene el tamaño original. Escalamos si hace falta.
const setScaleFunction = function (imageStyle, iconWidth, olFeat) {
    if (imageStyle && imageStyle instanceof Icon) {
        var setScaleForWidth = function (imgWidth) {
            var markerWidth = (olFeat && olFeat._wrap ? olFeat._wrap.parent.options.width : null) || iconWidth;
            if (markerWidth < imgWidth) {
                var factor = markerWidth / imgWidth;
                imageStyle.setScale(factor);
            }
        };
        var imageSize = imageStyle.getSize();
        if (imageSize) {
            setScaleForWidth(imageSize[0]);
        }
        else {
            var img = imageStyle.getImage();
            if (img.naturalWidth) {
                setScaleForWidth(img.naturalWidth);
            }
            else {
                const fragment = document.createDocumentFragment();
                const img = document.createElement('img');
                img.src = imageStyle.getSrc();
                fragment.appendChild(img);
                return new Promise(function (resolve) {
                    img.addEventListener('load', function () {
                        setScaleForWidth(this.naturalWidth);
                        resolve(this);
                    });
                });
            }
        }
    }
};

// readFeatures es ahora asíncrono: Rehacemos xhr de ol/featureloader.js para que el callback sea asíncrono y poder usar async/await
const xhr = function (url, format) {
    /**
     * @param {import("./extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {import("./proj/Projection.js").default} projection Projection.
     * @param {function(Array<FeatureType>): void} [success] Success
     *      Function called when loading succeeded.
     * @param {function(): void} [failure] Failure
     *      Function called when loading failed.
     * @this {import("./source/Vector.js").default<FeatureType>}
     */
    return function (extent, resolution, projection, success, failure) {
        loadFeaturesXhr(
            url,
            format,
            extent,
            resolution,
            projection,
            /**
             * @param {Array<FeatureType>} features The loaded features.
             * @param {import("./proj/Projection.js").default} dataProjection Data
             * projection.
             */
            async (features, _dataProjection) => {
                features = await features;
                this.addFeatures(features);
                if (success !== undefined) {
                    success(features);
                }
            },
            () => {
                this.changed();
                if (failure !== undefined) {
                    failure();
                }
            },
        );
    };
};

export default class VectorWrapper extends LayerWrapper {

    getStyle() {
        return getStyleFromNative(this.layer.getStyle());
    }

    reloadSource() {
        const self = this;
        return new Promise(function (resolve, _reject) {
            const layerOptions = self.createVectorSource(self.parent, self.createStyles(self.parent));

            if (self.parent.type === Consts.layerType.WFS) {
                var listenerKey = layerOptions.source.on('change', function (_e) {
                    if (layerOptions.source.getState() === 'ready') {
                        unByKey(listenerKey);

                        resolve();
                    }
                });
            }

            var features = self.layer.getSource().getFeatures();
            self.layer.setSource(layerOptions.source);

            if (layerOptions.style)
                self.layer.setStyle(layerOptions.style);

            if (self.parent.type !== Consts.layerType.WFS) {
                layerOptions.source.addFeatures(features);
                resolve();
            }
        });
    }

    import(options) {
        var self = this;
        var opts = Util.extend({
        }, options);
        opts.type = options.format;

        var oldFeatures = self.layer.getSource().getFeatures();
        var layerOptions = self.createVectorSource(opts, self.createStyles(self.parent));
        self.layer.setSource(layerOptions.source);
        if (layerOptions.style) {
            self.layer.setStyle(layerOptions.style);
        }

        layerOptions.source.addFeatures(oldFeatures);
    }

    createVectorSource(options, nativeStyle) {
        const self = this;

        var createGenericLoader = function (url, format) {
            var internalLoader = xhr(url, format);
            return function (extent, resolution, projection) {
                self.parent.state = SitnaLayer.state.LOADING;
                if (self.parent.map) {
                    self.parent.map.dispatchEvent(new LayerEvent(Consts.event.BEFORELAYERUPDATE, {
                        layer: self.parent
                    }));
                }
                internalLoader.call(this, extent, resolution, projection);
            };
        };
        var usesGenericLoader = false;

        var source;
        var vectorOptions;

        const isHeatmap = options.styles && options.styles.heatmap;
        if (Array.isArray(options.url) || options.urls) {
            var urls = options.urls || options.url;
            urls = urls.map(function (elm, _idx) {
                return TC.proxify(elm);
            });
            vectorOptions = {
                url: urls,
                //10/11/2021 URI:Ahora el KML Custom es una modificación directa del KML y no una sobrecarga de éste. Se añade al build de ol al compilar
                //format: new ol.format.KMLCustom({
                format: new KML({
                    showPointNames: false,
                    extractStyles: !isHeatmap,
                    iconUrlFunction: TC.proxify,
                }),
                projection: options.crs
            };
        }
        else if (options.url && options.type !== Consts.layerType.WFS) {
            vectorOptions = {
                url: options.url,//TC.proxify(options.url),
                projection: options.crs
            };
            vectorOptions.format = getFormatFromName(options.format, !isHeatmap) ||
                getFormatFromName(Util.getMimeTypeFromUrl(options.url), !isHeatmap) ||
                getFormatFromName(options.type, !isHeatmap);
            vectorOptions.loader = !(vectorOptions.format instanceof KML) ? createGenericLoader(vectorOptions.url, vectorOptions.format) : function (_extent, _resolution, projection) {
                const url = vectorOptions.url;
                const format = vectorOptions.format;
                self.parent.state = SitnaLayer.state.LOADING;
                if (self.parent.map) {
                    self.parent.map.dispatchEvent(new LayerEvent(Consts.event.BEFORELAYERUPDATE, {
                        layer: self.parent
                    }));
                }
                self.parent.proxificationTool.fetch(url, { method: "GET", nomanage: true }).then(async function (response) {
                    if (response.ok) {
                        const text = await response.text()
                        var features = await format.readFeatures(text, { featureProjection: projection });
                        const xDocFilename = new DOMParser().parseFromString(text, "text/xml").querySelector("Document > name");

                        self.addFeatures(features);
                        self.parent.state = SitnaLayer.state.IDLE;
                        if (response.headers.has("content-disposition") && /(attachment);([^;]*)/gi.test(response.headers.get("content-disposition"))) {
                            const contentDisposition = response.headers.get("content-disposition");
                            var name;
                            try {
                                name = /filename\*?=\"?([\w|-]*\'\')?(.*\.\w*)\"?/gi.exec(contentDisposition)[2];
                            } catch (ex) {
                                try {
                                    name = contentDisposition.substring((contentDisposition.lastIndexOf("'") || contentDisposition.indexOf("=")) + 1);
                                } catch (ex2) { }
                            }
                            self.parent.title = (xDocFilename ? xDocFilename.textContent : "") + (name ? (xDocFilename && xDocFilename.textContent != name ? " (" + name + ")" : name) : "")
                        }
                        else
                            self.parent.title = (xDocFilename ? xDocFilename.textContent : "") + (xDocFilename && xDocFilename.textContent != self.parent.title ? " (" + self.parent.title + ")" : self.parent.title)

                        if (self.parent.map) {
                            self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERUPDATE, {
                                layer: self.parent
                            }));
                        }
                    }
                }).catch(function (response) {
                    self.parent.state = SitnaLayer.state.IDLE;
                    if (self.parent.map) {
                        self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERERROR, {
                            layer: self.parent,
                            message: response
                        }));
                    }
                })

            };
            usesGenericLoader = true;
        }
        else if (options.data) {
            vectorOptions = {
                projection: options.crs,
                loader: function (extent, resolution, projection) {
                    self.parent.state = SitnaLayer.state.LOADING;
                    if (self.parent.map) {
                        self.parent.map.dispatchEvent(new LayerEvent(Consts.event.BEFORELAYERUPDATE, {
                            layer: self.parent
                        }));
                    }
                    var format = this.getFormat();
                    try {
                        var fs = format.readFeatures(options.data, {
                            featureProjection: projection
                        });
                        this.addFeatures(fs);
                        self.parent.state = SitnaLayer.state.IDLE;
                        if (self.parent.map) {
                            self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERUPDATE, {
                                layer: self.parent, newData: options.data
                            }));
                        }
                    }
                    catch (e) {
                        self.parent.state = SitnaLayer.state.IDLE;
                        if (self.parent.map) {
                            self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERERROR, {
                                layer: self.parent,
                                message: e.message
                            }));
                        }
                    }
                }
            };
            vectorOptions.format = getFormatFromName(options.format) || getFormatFromName(options.type);
        }
        else if (options.type === Consts.layerType.WFS) {
            var outputFormat;
            var mimeType;
            switch (options.outputFormat) {
                case Consts.format.JSON:
                    outputFormat = new GeoJSON({
                        geometryName: options.geometryName
                    });
                    mimeType = 'json';
                    break;
                case Consts.format.GML3:
                    outputFormat = new WFS({ gmlFormat: new GML3() });
                    mimeType = Consts.mimeType.GML;
                    break;
                case Consts.format.GML32:
                    outputFormat = new WFS({ gmlFormat: new GML32() });
                    mimeType = Consts.mimeType.GML;
                    break;
                default:
                    outputFormat = new WFS({ gmlFormat: new GML2() });
                    mimeType = Consts.mimeType.GML;
                    options.outputFormat = Consts.format.GML2;
                    break;
            }
            vectorOptions = {
                format: outputFormat,
                loader: function (_extent, _resolution, projection) {
                    var sOrigin = this;
                    var serviceUrl = options.url;
                    if (serviceUrl) {
                        self.parent.state = SitnaLayer.state.LOADING;
                        self.parent.map.dispatchEvent(new LayerEvent(Consts.event.BEFORELAYERUPDATE, {
                            layer: self.parent
                        }));

                        const isFilterText = function () {
                            return typeof options.properties === "string";
                        };
                        const manageResponse = (response) => {
                            const data = response.data;
                            let feats;
                            try {
                                feats = outputFormat.readFeatures(data);
                            }
                            catch (e) {
                                self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERERROR, { layer: self.parent, message: e.message }));
                            }
                            const triggerLayerUpdate = function () {
                                self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERUPDATE, {
                                    layer: self.parent, newData: data
                                }));
                            };
                            const onFeaturesAdd = function (e) {
                                if (e.layer === self.parent) {
                                    self.parent.map.off(Consts.event.FEATURESADD, onFeaturesAdd);
                                    triggerLayerUpdate();
                                }
                            };
                            if (feats && feats.length) {
                                self.parent.map.on(Consts.event.FEATURESADD, onFeaturesAdd);
                                sOrigin.addFeatures(feats);
                            }
                            else {
                                triggerLayerUpdate();
                            }
                            self.parent.state = SitnaLayer.state.IDLE;
                        };
                        const manageError = (error) => {
                            if (error instanceof XMLDocument) {
                                self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERERROR, { layer: self.parent, message: error.querySelector("ExceptionText").innerHTML }));
                            }
                            else {
                                self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERERROR, { layer: self.parent, message: error }));
                            }
                        };
                        const getRequestLength = (options) => {
                            let data;
                            if (options.data) {
                                if (typeof options.data === 'string') {
                                    data = options.data;
                                }
                                else if (typeof options.data === 'object') {
                                    if (options.contentType || typeof options.contentType === 'boolean') {
                                        data = TC.Util.getParamString(options.data);
                                    } else {
                                        const paramArray = [];
                                        for (var key in options.data) {
                                            paramArray.push(key + '=' + options.data[key].toString());
                                        }
                                        data = paramArray.join('&');
                                    }
                                }
                            }
                            var url = options.url;
                            if (data) {
                                url = url + '?' + data;
                            }
                            if (options.cache === false) {
                                url += (url.indexOf('?') < 0 ? '?' : '&') + 'ts=' + Date.now();
                            }
                            return url.length;

                        }



                        const makeAjaxCall = (onlyHits, capabilities) => {
                            let ajaxOptions = {};
                            let crs = projection.getCode();
                            let version = options.version || capabilities.version || '1.1.0';
                            capabilities.version ??= version;
                            let url = serviceUrl;
                            let featureType = Array.isArray(options.featureType) ? options.featureType : [options.featureType];
                            //const isSpatial = function (filter) {
                            //    switch (true) {
                            //        case filter instanceof TC.filter.LogicalNary:
                            //            return filter.conditions.some(f => isSpatial(f));
                            //        case filter instanceof TC.filter.Spatial:
                            //            return true;
                            //        case typeof filter === "string":
                            //            return Object.keys(window.TC.filter).filter(f => new TC.filter[f]() instanceof TC.filter.Spatial).some(f => filter.indexOf(f) > -1);
                            //        default:
                            //            return false;
                            //    }
                            //};
                            const GETRequestBuider = (options) => {
                                const _ajaxOptions = {};
                                _ajaxOptions.method = 'GET';
                                _ajaxOptions.url = url;
                                _ajaxOptions.data = {
                                    service: "WFS",
                                    request: "GetFeature",
                                    outputFormat: options.outputFormat,
                                    version: version,
                                    srsname: crs
                                };
                                if (options.properties) {
                                    _ajaxOptions.data.propertyName = options.properties
                                }
                                if (options.filter) {
                                    //primero miramos si es un objeto TC.filter
                                    if (options.filter instanceof TC.filter.Filter) {
                                        if (options.filter instanceof TC.filter.Bbox) {
                                            _ajaxOptions.data = Object.assign(_ajaxOptions.data, {
                                                BBOX: Util.formatTemplate('{0},{1},{2},{3},{4}', options.filter.extent.concat([crs]))
                                            });
                                        }
                                        else
                                            //URI en IOS peta Lookbehind in JS regular expressions https://caniuse.com/js-regexp-lookbehind
                                            _ajaxOptions.data = Object.assign(_ajaxOptions.data, {
                                                // quita los prefijos ogc: y fes: del filtro esto afecta a las etiquetas de apertura de cierre
                                                filter: options.filter.getText(version).replace(/\<(fes\:|ogc\:)/g, "<").replace(/\<\/(fes\:|ogc\:)/g, "</")
                                            });
                                    }
                                    //luego miramos si en un objeto filtro de los nuevos
                                    else if (options.filter instanceof GMLFilter) {
                                        _ajaxOptions.data.filter = options.filter.getFilterText({
                                            outputFormat: options.outputFormat,
                                            srsName: crs,
                                            version: version,
                                            propertyNames: options.properties ? [...options.properties] : null,
                                            featureNS: options.featureNS,
                                            featurePrefix: options.featurePrefix,
                                            featureTypes: featureType,
                                            resultType: onlyHits ? "hits" : ""
                                        });
                                    }
                                    //se puede parsear a XML, asumimos que es GML
                                    else if (!new DOMParser().parseFromString(options.filter, 'text/xml').querySelector("parsererror")) {
                                        _ajaxOptions.data.filter = options.filter;
                                    }
                                    //Si no, asumimos que es CQL
                                    else {
                                        _ajaxOptions.data.cql_filter = options.filter;
                                    }
                                }

                                let prefix = options.featurePrefix ?? options.featureNS ?? "";
                                if (prefix.length) prefix = prefix + ":";
                                _ajaxOptions.data["typename" + (version === "2.0.0" ? "s" : "")] = prefix + options.featureType;
                                if (onlyHits)
                                    _ajaxOptions.data = Object.assign(_ajaxOptions.data, {
                                        resultType: "hits"
                                    });
                                if (!onlyHits && options.filter) {
                                    self.parent.map.trigger(Consts.event.BEFOREAPPLYQUERY, { layer: self.parent, query: _ajaxOptions.data });
                                }
                                if (options.maxFeatures)
                                    _ajaxOptions.data = Object.assign(_ajaxOptions.data, {
                                        maxFeatures: options.maxFeatures
                                    });
                                return _ajaxOptions;
                            }
                            const POSTRequestBuider = (options) => {
                                const _ajaxOptions = {};
                                _ajaxOptions.method = 'POST';
                                _ajaxOptions.url = url;
                                if (options.filter instanceof TC.filter.Filter)
                                    _ajaxOptions.data = Util.WFSQueryBuilder(featureType, options.filter, capabilities, onlyHits ? null : options.outputFormat, onlyHits, crs, options.maxFeatures);
                                else if (options.filter instanceof GMLFilter) {
                                    ajaxOptions.data = options.filter.getGeatureText({
                                        outputFormat: options.outputFormat,
                                        srsName: crs,
                                        version: version,
                                        propertyNames: options.properties ? [...options.properties] : null,
                                        featureNS: options.featureNS,
                                        featurePrefix: options.featurePrefix,
                                        featureTypes: featureType,
                                        resultType: onlyHits ? "hits" : ""
                                    });
                                }
                                return _ajaxOptions;
                            };

                            const verbs = Object.keys(capabilities.Operations.GetFeature.DCP.HTTP).map((a) => a.toUpperCase());
                            if (verbs.includes("GET") || !verbs.length) {
                                ajaxOptions = GETRequestBuider(options);
                                if (verbs.includes("POST") && getRequestLength(ajaxOptions) > Consts.URL_MAX_LENGTH)
                                    ajaxOptions = POSTRequestBuider(options);
                            }
                            else {
                                ajaxOptions = POSTRequestBuider(options);
                            }
                            switch (onlyHits ? "" : mimeType) {
                                case 'json':
                                    ajaxOptions.responseType = Consts.mimeType.JSON;
                                    break;
                                default:
                                    ajaxOptions.responseType = Consts.mimeType.XML;
                                    break;
                            }
                            ajaxOptions.contentType = Consts.mimeType.XML;
                            return TC.ajax(ajaxOptions);
                        };

                        self.parent.getCapabilitiesPromise().then((_capabilities) => {
                            const capabilities = _capabilities;
                            //obtenos del capabilities nummax de features
                            let numMaxFeatures = capabilities.Operations?.GetFeature?.CountDefault?.DefaultValue;
                            if (numMaxFeatures) {
                                if (!options.maxFeatures) {
                                    options.maxFeatures = numMaxFeatures;
                                }
                                let filterText = isFilterText();
                                makeAjaxCall(filterText ? false : true, capabilities).then((response) => {
                                    if (filterText) {
                                        manageResponse(response);
                                        return;
                                    }
                                    var firstNode = response.data.children[0];
                                    if (firstNode.tagName.toLowerCase().indexOf("exception") >= 0) {
                                        self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERERROR, { layer: self.parent, message: firstNode.querySelector("ExceptionText").innerHTML }));
                                    }
                                    else if (firstNode.tagName.toLowerCase().indexOf("featurecollection") >= 0) {
                                        let numOfFeaturesFounded = parseInt((firstNode.attributes.numberMatched || firstNode.attributes.numberOfFeatures).value, 10);
                                        if (Number.isNaN(numOfFeaturesFounded) || numOfFeaturesFounded >= parseInt(numMaxFeatures, 10)) {
                                            self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERERROR, { layer: self.parent, message: Consts.WFSErrors.MAX_NUM_FEATURES, data: { limit: parseInt(numMaxFeatures, 10), founded: numOfFeaturesFounded } }));
                                            return;
                                        }
                                        else if (!Number.isNaN(numOfFeaturesFounded) && numOfFeaturesFounded === 0) {
                                            //si no encuentra nada. LLamo a la función para 
                                            manageResponse({
                                                data: outputFormat instanceof GeoJSON ? { "type": "FeatureCollection", "totalFeatures": 0, "features": [], "crs": null } : outputFormat.writeFeatures([])
                                            });
                                            return;
                                        }
                                        makeAjaxCall(false, capabilities).then(manageResponse).catch(manageError);
                                    }
                                }).catch(manageError);
                            }
                            else {
                                makeAjaxCall(false, capabilities).then(manageResponse).catch(manageError);
                            }
                        });
                        self._requestUrl = serviceUrl;
                    }
                },
                //strategy: ol.loadingstrategy.all(),
                projection: options.crs
            };
        }

        if (options.features) {
            vectorOptions = vectorOptions || {};
            vectorOptions.features = options.features.map(f => f instanceof SitnaFeature ? f.wrap.feature : f);
        }

        source = new VectorSource(vectorOptions);

        if (usesGenericLoader) {
            source.on(EventType.CHANGE, function (_e) {
                if (self.parent.map) {
                    self.parent.map.dispatchEvent(new LayerEvent(Consts.event.LAYERUPDATE, {
                        layer: self.parent
                    }));
                }
            });
        }

        source._tcLayer = self.parent;

        var markerStyle = options.style && options.style.marker ? options.style.marker : TC.Cfg.styles.marker;
        if (!options.style || !options.style.marker) {
            markerStyle = Util.extend({}, markerStyle, {
                anchor: TC.Cfg.styles.point.anchor
            });
        }

        // Si habilitamos el clustering la fuente es especial
        if (options.cluster) {
            source = new Cluster({
                projection: options.crs,
                distance: options.cluster.distance,
                source: source
            });

            // Animación
            if (options.cluster.animate) {
                var getCurrentCoordinates = function (fromCoords, toCoords, duration, start) {
                    var fraction = Math.min((Date.now() - start) / duration, 1);
                    var dx = (toCoords[0] - fromCoords[0]) * fraction;
                    var dy = (toCoords[1] - fromCoords[1]) * fraction;
                    return [fromCoords[0] + dx, fromCoords[1] + dy];
                };
                var animate = function (parent, child) {
                    var start = Date.now();
                    var pCoords = parent.getGeometry().getCoordinates();
                    var cCoords = child.getGeometry().getCoordinates();
                    child.setGeometry(new Point(pCoords));
                    var step = function step() {
                        var coords = getCurrentCoordinates(pCoords, cCoords, Consts.CLUSTER_ANIMATION_DURATION, start);
                        child.setGeometry(new Point(coords));
                        if (coords[0] !== cCoords[0] && coords[1] !== cCoords[1]) {
                            requestAnimationFrame(step);
                        }
                        else {
                            clusterCache.splice(clusterCache.indexOf(parent), 1);
                        }
                    };
                    requestAnimationFrame(step);
                };
                var clusterCache = [];
                source.addEventListener(VectorEventType.REMOVEFEATURE, function (e) {
                    var features = e.feature.get('features');
                    if (features && features.length > 1) {
                        clusterCache.push(e.feature);
                    }
                });
                source.addEventListener(VectorEventType.ADDFEATURE, function (e) {
                    var features = e.feature.get('features');
                    if (features) {
                        var coords = features[0].getGeometry().getCoordinates();
                        if (features.length > 1) {
                            var match = clusterCache.filter(function (elm) {
                                var elmCoords = elm.getGeometry().getCoordinates();
                                return elmCoords[0] === coords[0] && elmCoords[1] === coords[1];
                            });
                            if (match.length) {
                                clusterCache.splice(clusterCache.indexOf(match[0]), 1);
                            }
                        }
                        var parent = clusterCache.filter(function (elm) {
                            var children = elm.get('features');
                            if (children && children.length > 0) {
                                var child = children.filter(function (cElm) {
                                    var cCoords = cElm.getGeometry().getCoordinates();
                                    return cCoords[0] === coords[0] && cCoords[1] === coords[1];
                                });
                                return child.length > 0;
                            }
                        });
                        if (parent.length) {
                            animate(parent[parent.length - 1], e.feature);
                        }
                    }
                });
            }
        }

        var s = source;
        do {
            s.addEventListener(VectorEventType.ADDFEATURE, function (e) {
                var olFeat = e.feature;
                // OL3 dibuja el tamaño original del icono del marcador, lo escalamos si es necesario:
                var style = getNativeFeatureStyle(olFeat, true);
                if (style) {
                    const result = setScaleFunction(style.getImage(), markerStyle.width, olFeat);
                    if (result) {
                        result.then(function () {
                            if (e.feature._wrap.parent._legend) {
                                const layer = e.feature._wrap.parent.layer;
                                delete e.feature._wrap.parent._legend;
                                layer.map.trigger(Consts.event.VECTORUPDATE, { "layer": layer });
                            }
                        });
                    }
                }
            });
            if (Util.isFunction(s.getSource)) {
                s = s.getSource();
            }
            else {
                s = null;
            }
        }
        while (s);

        source.addEventListener(VectorEventType.ADDFEATURE, async function (e) {
            const olFeat = e.feature;

            if (!olFeat._wrap ||
                !olFeat._wrap.parent.layer ||
                !olFeat._wrap.parent.layer.features.includes(olFeat._wrap.parent)) { // Solo actuar si no es una feature añadida desde la API
                const feat = TC.wrap.Feature.createFeature(olFeat);
                let addFn;
                switch (true) {
                    case feat instanceof SitnaPoint:
                        addFn = self.parent.addPoint;
                        break;
                    case feat instanceof SitnaPolyline:
                        addFn = self.parent.addPolyline;
                        break;
                    case feat instanceof SitnaPolygon:
                        addFn = self.parent.addPolygon;
                        break;
                    case feat instanceof SitnaMultiPolygon:
                        addFn = self.parent.addMultiPolygon;
                        break;
                    case feat instanceof SitnaMultiPolyline:
                        addFn = self.parent.addMultiPolyline;
                        break;
                    default:
                        addFn = self.parent.addFeature;
                        break;
                }
                if (addFn) {
                    const f = await addFn.call(self.parent, olFeat);
                    var features = olFeat.get('features');
                    if (Array.isArray(features)) {
                        // Es una feature de fuente ol.source.Cluster
                        f.features = features.map(function (elm) {
                            return new feat.constructor(elm);
                        });
                    }
                }
            }
            // Timeout porque OL3 no tiene evento featuresadded. El timeout evita ejecuciones a lo tonto.
            if (self._featuresAddTimeout) {
                clearTimeout(self._featuresAddTimeout);
            }
            if (!self._addedFeatures) self._addedFeatures = [];
            self._addedFeatures.push(olFeat._wrap.parent);
            self._featuresAddTimeout = setTimeout(function () {
                self.parent.tree = null;//eliminar cache del arbol de la capa ya que se cambia las features
                self.parent.map?.trigger(Consts.event.FEATURESADD, {
                    layer: self.parent, features: self._addedFeatures
                });
                self._addedFeatures = null;
            }, 50);
        });

        source.addEventListener(VectorEventType.ADDFEATURE, function (e) {
            // Parche para añadir fondo transparente cuando no hay fondo (sin fondo los polígonos no son pulsables)
            const olFeat = e.feature;
            const geom = olFeat.getGeometry();
            switch (true) {
                case geom instanceof Point:
                case geom instanceof MultiPoint:
                case geom instanceof Polygon:
                case geom instanceof MultiPolygon: {
                    const getFilledStyles = (s) => {
                        let styles = s;
                        if (!Array.isArray(styles)) {
                            styles = [styles];
                        }
                        if (!styles.some(s => s.getFill())) {
                            styles[0].setFill(new Fill({
                                color: "rgba(0,0,0,0)"
                            }));
                        }
                        return styles;
                    };
                    const style = olFeat.getStyle();
                    let newStyles;
                    if (style) {
                        if (Util.isFunction(style)) {
                            newStyles = function (f, r) {
                                return getFilledStyles(style(f, r));
                            };
                        }
                        else {
                            newStyles = getFilledStyles(style);
                        }
                        olFeat.setStyle(newStyles);
                    }
                    break;
                }
                default:
                    break;
            }
        });

        source.addEventListener(VectorEventType.REMOVEFEATURE, function (e) {
            var olFeat = e.feature;
            if (olFeat._wrap) {
                var idx = self.parent.features.indexOf(olFeat._wrap.parent);
                if (idx > -1) {
                    self.parent.map.trigger(Consts.event.BEFOREFEATUREREMOVE, {
                        layer: self.parent, feature: olFeat._wrap.parent
                    });
                    self.parent.features.splice(idx, 1);
                    self.parent.tree = null;//eliminar cache del arbol de la capa ya que se cambia las features
                    self.parent.map.trigger(Consts.event.FEATUREREMOVE, {
                        layer: self.parent, feature: olFeat._wrap.parent
                    });
                }
            }
        });

        source.addEventListener(VectorEventType.ADDFEATURE, function (_e) {
            if (self.parent.map) {
                self.parent.tree = null;//eliminar cache del arbol de la capa ya que se cambia las features
                self.parent.map.trigger(Consts.event.VECTORUPDATE, {
                    layer: self.parent
                });
            }
        });

        source.addEventListener(VectorEventType.REMOVEFEATURE, function () {
            if (self.parent.map) {
                self.parent.tree = null;//eliminar cache del arbol de la capa ya que se cambia las features
                self.parent.map.trigger(Consts.event.VECTORUPDATE, {
                    layer: self.parent
                });
            }
        });

        source.addEventListener(VectorEventType.CLEAR, function () {
            if (self.parent.map) {
                self.parent.tree = null;//eliminar cache del arbol de la capa ya que se cambia las features
                self.parent.map.trigger(Consts.event.FEATURESCLEAR, {
                    layer: self.parent
                });
            }
        });

        var layerOptions = {
            source: source
        };

        if (options.minResolution) {
            layerOptions.minResolution = options.minResolution;
        }
        if (options.maxResolution) {
            layerOptions.maxResolution = options.maxResolution;
        }

        // En KML conservamos el estilo que viene con el archivo, así que no entramos aquí.
        // A no ser que tenga clusters, porque OL no soporta por defecto la combinación de estilo KML con clusters.
        if (!(vectorOptions && vectorOptions.format instanceof KML) || options.cluster) {
            layerOptions.style = nativeStyle || options.styles;
        }

        return layerOptions;
    }

    createStyles(options) {
        var self = this;

        var dynamicStyle = false;

        options = Util.extend({}, options);
        options.crs = options.crs || TC.Cfg.crs;
        if (Util.isFunction(options.styles)) {
            dynamicStyle = true;
            self.styleFunction = function (olFeat) {
                return createNativeStyle({ styles: options.styles(olFeat._wrap.parent) });
            }
        }
        else {
            const externalStyles = mergeMapAndGeneralStyles(self.parent);
            const newStyles = Util.extend(true, externalStyles, options.styles);
            var isDynamicStyle = function isDynamicStyle(obj) {
                for (var key in obj) {
                    var prop = obj[key];
                    switch (typeof prop) {
                        // Quitar cuando el estilo sea plano
                        case 'string':
                            if (/^\$\{(.+)\}$/.test(prop)) {
                                return true;
                            }
                            break;
                        ////////////////
                        case 'object':
                            if (isDynamicStyle(prop)) {
                                return true;
                            }
                            break;
                        case 'function':
                            return true;
                        default:
                            break;
                    }
                }
                return false;
            };

            dynamicStyle = !!(options.cluster && options.cluster.styles) || isDynamicStyle(newStyles);
            const opts = {
                styles: Object.assign({}, newStyles)
            };
            if (self.parent.styles) {
                opts.styles = Object.assign(opts.styles, self.parent.styles);
            }
            if (options.cluster && options.cluster.styles) {
                opts.styles = Object.assign({}, opts.styles, { cluster: options.cluster.styles });
            }
            self.styleFunction = function (olFeat) {
                opts.layer = self.parent;
                let nativeStyle = createNativeStyle(opts, olFeat);
                if (Util.isFunction(nativeStyle)) {
                    nativeStyle = nativeStyle(olFeat);
                }
                return nativeStyle;
            };
        }

        var nativeStyle = dynamicStyle ? self.styleFunction : self.styleFunction();

        return nativeStyle;
    }

    setStyles(options) {
        const self = this;
        self.getLayer().then(function (olLayer) {
            if (options && options.heatmap || olLayer instanceof Heatmap) {
                const features = olLayer.getSource().getFeatures();
                features.forEach(f => f.setStyle(null));
                const newOptions = Util.extend(true, { features: features }, self.parent.options);
                delete newOptions.styles;
                self.layer = self.createVectorLayer(Util.extend(newOptions, { styles: options }));
                if (self.parent.map) {
                    const mapWrap = self.parent.map.wrap;
                    mapWrap.insertLayer(self.layer, mapWrap.getLayerIndex(olLayer));
                    mapWrap.removeLayer(olLayer);
                }
            }
            else {
                olLayer.setStyle(self.createStyles({ styles: options }));
                if (self.parent.map?.on3DView) {
                    const features = olLayer.getSource().getFeatures();

                    features.forEach((f) => {
                        f._wrap.feature3D.setStyle(options[f._wrap.parent.STYLETYPE]);
                        self.parent.map.view3D.viewer?.refresh();
                    });
                }

            }
            //self.parent.map?.trigger(Consts.event.VECTORUPDATE, { layer: self.parent });
        });
    }

    createVectorLayer(options) {
        const self = this;
        var result = null;

        options = options || self.parent.options;

        const layerOptions = self.createVectorSource(options, self.createStyles(options));

        //layerOptions.declutter = options.declutter || false;
        if (options.styles && options.styles.heatmap) {
            const hmOptions = Util.extend({}, options.styles.heatmap);
            if (Util.isFunction(hmOptions.weight)) {
                const oldWeightFn = hmOptions.weight;
                hmOptions.weight = function (olFeat) {
                    return oldWeightFn(olFeat._wrap.parent);
                };
            }
            result = new Heatmap(Util.extend({ source: layerOptions.source }, hmOptions));
        }
        else {
            result = new VectorLayer(layerOptions);
        }
        result._wrap = self;

        self.addCommonEvents(result);

        return result;
    }

    async addFeatures(features) {
        const l = await this.getLayer();
        if (l instanceof Heatmap) {
            features.forEach(f => f.setStyle(null));
        }
        var source = l;
        while (Util.isFunction(source.getSource)) {
            source = source.getSource();
        }
        for (const f of features) {
            if (!f._wrap) TC.wrap.Feature.createFeature(f);
            if (f._wrap.parent && !this.parent.features.includes(f._wrap.parent)) {
                this.parent.features.push(f._wrap.parent);
                f._wrap.parent.layer = this.parent;
            }
        }
        source.addFeatures(features);
    }

    getFeatures() {
        var olLayer = this.getLayer();
        if (olLayer instanceof Layer) {
            return olLayer.getSource().getFeatures();
        }
        else {
            return [];
        }
    }

    getFeatureById(id) {
        var olLayer = this.layer;
        if (olLayer instanceof Layer) {
            return olLayer.getSource().getFeatureById(id);
        }
        else {
            return null;
        }
    }

    removeFeature(feature) {
        const self = this;
        const commit = function (l) {
            if (feature.wrap.feature) {
                let source = l.getSource();
                let id = feature.wrap.feature.getId();
                if (id && source.getFeatureById(id)) {
                    source.removeFeature(feature.wrap.feature);
                    if (source.getSource && Array.isArray(feature.features)) {
                        const subSource = source.getSource();
                        feature.features.slice().forEach(f => subSource.removeFeature(f.wrap.feature));
                    }
                }
            }
        };
        if (self.layer) {
            commit(self.layer);
        }
        else {
            self.getLayer().then(commit);
        }
    }

    clearFeatures() {
        const self = this;
        const commit = function (l) {
            var source = l.getSource();
            if (source.clearFeatures) {
                source.clearFeatures();
            }
            else {
                source.clear();
            }
        };
        if (self.layer) {
            commit(self.layer);
        }
        else {
            self.getLayer().then(commit);
        }
    }

    setFeatureVisibility(feature, visible) {
        var self = this;

        var fillOptions = {
            color: 'rgba(0, 0, 0, 0)'
        };
        var strokeOptions = {
            color: 'rgba(0, 0, 0, 0)'
        };
        var displayNoneStyle = new Style({
            image: new CircleStyle({
                radius: 0,
                fill: new Fill(fillOptions),
                stroke: new Stroke(strokeOptions)
            }),
            fill: new Fill(fillOptions),
            stroke: new Stroke(strokeOptions)
        });
        var idx = self.parent.features.indexOf(feature);
        if (idx >= 0) {
            var olFeat = feature.wrap.feature;
            self.getLayer().then(function (_olLayer) {
                if (visible && Object.hasOwn(olFeat, '_originalStyle')) {
                    olFeat.setStyle(olFeat._originalStyle);
                }
                else {
                    olFeat._originalStyle = olFeat.getStyle();
                    olFeat.setStyle(displayNoneStyle);
                }
                self.parent.map.trigger(Consts.event.VECTORUPDATE, {
                    layer: self.parent
                });
            });
        }
    }

    getRGBA(color, opacity) {
        return getRGBA(color, opacity);
    }

    findFeature(_values) {
        // TODO: añadir ol.animation.zoom
    }

    getGetFeatureUrl() {
        return this._requestUrl;
    }

    sendTransaction(inserts, updates, deletes) {
        const self = this;
        const getNativeFeature = function (feat) {
            return feat.wrap.feature;
        };
        return new Promise(function (resolve, reject) {
            const olInserts = inserts.map(getNativeFeature);
            const olUpdates = updates.map(getNativeFeature);
            const olDeletes = deletes.map(getNativeFeature);
            if (inserts.length || updates.length || deletes.length) {
                self.getLayer().then(function () {
                    var format = new WFS();
                    var options = self.parent.options;
                    var transaction = format.writeTransaction(olInserts, olUpdates, olDeletes, {
                        featurePrefix: options.featurePrefix,
                        featureNS: options.featureNS,
                        featureType: options.featureType[0]
                    });
                    var ajaxOptions = {
                        url: self.parent.url,
                        method: 'POST',
                        contentType: Consts.mimeType.XML,
                        responseType: Consts.mimeType.XML,
                        data: transaction.outerHTML
                    };
                    TC.ajax(ajaxOptions)
                        .then(function (response) {
                            const data = response.data;
                            const ns = 'http://www.opengis.net/ows';
                            var er = data.getElementsByTagNameNS(ns, 'ExceptionReport')[0];
                            var errorObj = {
                                reason: ''
                            };
                            if (er) {
                                var e = er.getElementsByTagNameNS(ns, 'Exception')[0];
                                if (e) {
                                    errorObj.code = e.getAttribute('exceptionCode');
                                    var texts = e.getElementsByTagNameNS(ns, 'ExceptionText');
                                    for (var i = 0, len = texts.length; i < len; i++) {
                                        errorObj.reason += '\n' + texts[i].innerHTML;
                                    }
                                }
                                reject(errorObj);
                            }
                            else {
                                var transactionResponse = format.readTransactionResponse(data);
                                resolve(transactionResponse);
                            }
                        })
                        .catch(function (err) {
                            const errObj = {
                                code: err.status || '',
                                reason: err.msg || 'unknown'
                            };
                            reject(errObj);
                        });
                });
            }
            else {
                resolve(self.parent);
            }
        });
    }

    setDraggable(draggable, onend, onstart) {
        const self = this;
        //tiene que estar a nivel de control para poder retirarla después
        //var interaction;
        Promise.all([self.parent.map.wrap.getMap(), self.getLayer()]).then(function (olObjects) {
            const olMap = olObjects[0];
            const olLayer = olObjects[1];
            if (self.translateInteraction) {
                olMap.removeInteraction(self.translateInteraction);
                self.translateInteraction = null;
            }
            if (draggable) {
                self.translateInteraction = new Translate({
                    layers: [olLayer],
                });
                if (Util.isFunction(onend)) {
                    self.translateInteraction.on('translateend', function (e) {
                        if (e.features.getLength()) {
                            onend(e.features.item(0)._wrap.parent);
                        }
                    });
                }
                if (Util.isFunction(onstart)) {
                    self.translateInteraction.on('translatestart', function (e) {
                        if (e.features.getLength()) {
                            onstart(e.features.item(0)._wrap.parent);
                        }
                    });
                }
                olMap.addInteraction(self.translateInteraction);
            }
        });
    }

    getFeaturesInExtent(extent, tolerance) {
        if (tolerance) {
            let leftCorner = this.parent.map.getPixelFromCoordinate([extent[0], extent[1]]);
            let rightCorner = this.parent.map.getPixelFromCoordinate([extent[2], extent[3]]);
            leftCorner[0] -= tolerance[0] / 2;
            leftCorner[1] += tolerance[1];
            rightCorner[0] += tolerance[0] / 2;
            extent = this.parent.map.getCoordinateFromPixel(leftCorner).concat(this.parent.map.getCoordinateFromPixel(rightCorner));
        }

        return this.layer.getSource().getFeaturesInExtent(extent).map((f) => f._wrap.parent);
    }

    getAttribution() {
        return null;
    }

    getGetMapUrl() {
        var result = null;
        var self = this;
        switch (self.getServiceType()) {
            case Consts.layerType.WFS:
                try {
                    result = self.parent.capabilities.Operations.GetFeature.DCP.HTTP.Get.href;
                }
                catch (ex) {
                }
                break;
            default:
                break;
        }
        const fragment = document.createDocumentFragment();
        const textarea = document.createElement('textarea');
        fragment.appendChild(textarea);
        textarea.innerHTML = result;
        result = textarea.textContent;
        return result;
    }

    getServiceType() {
        var result = null;
        //URI: Si se tiene capabilities se supone que es un servicio WFS
        if (this.parent.capabilities) {
            result = Consts.layerType.WFS;
        }
        return result;
    }
}
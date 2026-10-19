import Feature from 'ol/Feature.js';
import GeoJSON from '../../lib/ol/format/GeoJSON.js';
import { WFS, WMSGetFeatureInfo } from 'ol/format.js';
import GML2 from 'ol/format/GML2.js';
import GML3 from 'ol/format/GML3.js';
import { Draw, DoubleClickZoom } from 'ol/interaction.js';
import { Point } from 'ol/geom.js';

import ClickWrapper from './Click.js';
import MapBrowserEventType from 'ol/MapBrowserEventType.js';
import VectorEventType from 'ol/source/VectorEventType.js';
import Consts from '../Consts.js';
import Util from '../Util.js';

const olGeometryType = {
    POINT: 'Point',
    MULTI_POINT: 'MultiPoint',
    LINE_STRING: 'LineString',
    MULTI_LINE_STRING: 'MultiLineString',
    POLYGON: 'Polygon',
    MULTI_POLYGON: 'MultiPolygon'
};

var readFeaturesFromResponse = function (map, data, contentType) {
    var format;
    var iFormat = contentType;
    if (iFormat && iFormat.indexOf(";") > -1)
        iFormat = iFormat.substr(0, iFormat.indexOf(";")).trim();

    if (!iFormat) iFormat = data.requestedFormat;
    switch (iFormat) {
        case 'application/json':
            format = new GeoJSON();
            break;
        case 'application/vnd.ogc.gml':
            if (data.responseText.indexOf("FeatureCollection") > -1)
                format = new WFS({
                    gmlFormat: new GML2({
                        srsName: map.crs
                    })
                });
            else
                format = new WMSGetFeatureInfo();
            break;
        case 'application/vnd.ogc.gml/3.1.1':
            format = new GML3({
                srsName: map.crs
            });
            break;
        case "text/xml":
        case "application/xml": {
            //posible error
            const doc = new DOMParser().parseFromString(data, "text/xml");
            const exception = doc.querySelector("ServiceException");
            if (exception)
                TC.error(exception);
            format = null;
            break;
        }
        default:
            format = null;
            break;
    }
    if (format) {
        return format.readFeatures(data, {
            featureProjection: ol.proj.get(map.crs)
        });
    }
    else {
        return null;
        ////si no hay formato reconocido y parseable, metemos un iframe con la respuesta
        ////y prau
        ////para eso, creo una falsa entrada de tipo feature, con un campo especial rawUrl o rawContent
        //var l = service.layers[0];
        //l.features.push({
        //    error: response.responseText
        //});
    }
};
var featureToServiceDistributor = async function (features, service) {
    const apiFeatures = [];
    var featureInsertionPoints = new WeakMap();
    var isParentOrSame = function (layer, na, nb) {
        var result = false;
        if (na === nb || na.indexOf(nb) === 0) {
            result = true;
        }
        else {
            var pa = layer.getPath(na);
            var pb = layer.getPath(nb);
            if (pa.length > 0 && pb.length >= pa.length) {
                result = true;
                for (var i = 0; i < pa.length; i++) {
                    if (pa[i] !== pb[i]) {
                        result = false;
                        break;
                    }
                }
            }
        }
        return result;
    };

    var fakeLayers = {};
    for (const feature of features) {
        if (feature instanceof Feature) {
            var fid = feature.getId() || TC.getUID();
            var found = false;
            var layerName = fid.substr(0, fid.lastIndexOf('.'));
            for (const serviceLayer of service.layers) {
                var lName = serviceLayer.name.substr(serviceLayer.name.indexOf(':') + 1);
                const mapLayer = service.mapLayers.find((mapLayer) => isParentOrSame(mapLayer, lName, layerName));
                if (mapLayer) {
                    found = true;
                    const apiFeature = TC.wrap.Feature.createFeature(feature);
                    apiFeatures.push(apiFeature);
                    featureInsertionPoints.set(apiFeature, serviceLayer.features);
                    serviceLayer.path = mapLayer.getPath(serviceLayer.name).slice(1);
                    if (!serviceLayer.title || serviceLayer.title === serviceLayer.name) {
                        serviceLayer.title = serviceLayer.path[serviceLayer.path.length - 1];
                    }
                    break;
                }
            }

            //si llegamos aqu\u00ed y no he encontrado su layer, es que no cuadraba el prefijo del fid con el id del layer
            //esto pasa, p.ej, en cartociudad
            if (!found) {
                //as\u00ed que creo un layer de palo para la respuesta del featInfo
                var fakeLayer;
                if (fakeLayers[layerName]) fakeLayer = fakeLayers[layerName];
                else {
                    fakeLayer = {
                        name: layerName, title: layerName, features: []
                    };
                    fakeLayers[layerName] = fakeLayer;
                    service.layers.push(fakeLayer);
                }

                const apiFeature = TC.wrap.Feature.createFeature(feature);
                apiFeatures.push(apiFeature);
                featureInsertionPoints.set(apiFeature, fakeLayer.features);
            }
        }
    }//iteraci\u00f3n sobre las features de esta respuesta

    apiFeatures.forEach(function (feat) {
        feat.attributes = [];
        //feat.showsPopup = false;
        for (var key in feat.data) {
            var value = feat.data[key];
            if (typeof value !== 'object') {
                feat.attributes.push({
                    name: key, value: value
                });
            }
            else {
                feat.attributes.push({
                    name: key,
                    value: value//"objeto complejo"
                });
            }
        }
        featureInsertionPoints.get(feat).push(feat);
    });
    return { service };
};
export default class GeometryFeatureInfoWrapper extends ClickWrapper {

    async register(map) {
        await super.register(map);
        const _clickTrigger = this._trigger;
        this._trigger = (e) => {
            this.hasSuitableLayers().then((hasLayers) => {
                if (hasLayers) {
                    if (!this.parent._isSearching) {
                        if (e.type === MapBrowserEventType.SINGLECLICK && !this.parent._isDrawing && !this.parent._isSearching) {
                            _clickTrigger.call(this, e);
                        }
                    }
                }
            });
        };
    }

    async hasSuitableLayers() {
        const map = this.parent.map;
        let ret = false;
        this.map.getLayers().forEach(function (olLayer) {
            var layer = olLayer._wrap.parent;
            var source = olLayer.getSource();
            //Por qué en workLayers están el vectorial de medición, y cosas así?
            if (source.getFeatureInfoUrl && map.workLayers.indexOf(layer) >= 0) {
                ret = true;
                return false;   //break del foreach
            }
        });
        return ret;
    }

    beginDraw(options = {}) {
        let xy = options.xy;
        var layer = options.layer || this.parent.filterLayer;
        var callback = options.callback;
        var geometryType = options.geometryType;
        var semaphore = false;
        if (!this.drawCtrl) {
            layer.wrap.getLayer().then((olLayer) => {
                let olGeomType;
                switch (geometryType) {
                    case Consts.geom.POLYLINE:
                        olGeomType = olGeometryType.LINE_STRING;
                        break;
                    default:
                        olGeomType = olGeometryType.POLYGON;
                        break;
                }
                const layerStyle = olLayer.getStyle();
                // Si la geometría es del tipo correcto, cogemos el estilo de la capa
                const styleFunction = function (olFeature) {
                    if (olFeature && olFeature.getGeometry().getType() === olGeomType) {
                        if (Util.isFunction(layerStyle)) {
                            return layerStyle(olFeature);
                        }
                        return layerStyle;
                    }
                    return null;
                };
                this.drawCtrl = new Draw({
                    source: olLayer.getSource(),
                    type: olGeomType,
                    style: styleFunction
                });
                olLayer.getSource().on(VectorEventType.ADDFEATURE, function (event) {
                    TC.wrap.Feature.createFeature(event.feature).showsPopup = false;
                });
                this.drawCtrl.handleEvent = function (event) {
                    //esta ñapa para solucionar cuando haces un primer punto y acontinuación otro muy rápido
                    if (event.type === MapBrowserEventType.SINGLECLICK) {
                        var points = olGeomType === olGeometryType.POLYGON ? this.sketchCoords_[0] : this.sketchCoords_;
                        if (semaphore && points.length === 2 && this.sketchFeature_ !== null) {// GLS: Añado la misma validación (this.sketchFeature_ !== null) que tiene el código de OL antes de invocar addToDrawing_ 
                            this.addToDrawing_(event);
                        }
                        else {
                            semaphore = true;
                        }
                    }
                    return Draw.prototype.handleEvent.call(this, event);
                };
                const map = this.parent.map;
                const olMap = map.wrap.map;
                olMap.addInteraction(this.drawCtrl);
                this.drawCtrl.on('drawstart', (_event) => {
                    this.parent._isDrawing = true;
                    olMap.getInteractions().forEach(function (item, _i) {
                        if (item instanceof DoubleClickZoom) {
                            item.setActive(false);
                        }
                    });
                });
                this.drawCtrl.startDrawing_(xy);
                const self = this;
                this.drawCtrl.on('drawend', function(event) {
                    self.parent._isDrawing = false;
                    olMap.getInteractions().forEach(function (item, _i) {
                        if (item instanceof DoubleClickZoom) {
                            item.setActive(false);
                        }
                    });
                    olMap.removeInteraction(self.drawCtrl);
                    this.setActive(false);
                    self.drawCtrl = null;
                    olLayer.getSource().clear();
                    self.parent._drawToken = true;
                    setTimeout(function () {
                        self.parent._drawToken = false;
                    }, 500);
                    event.feature.setId(self.parent.getUID());

                    const feat = TC.wrap.Feature.createFeature(event.feature, { showsPopup: false });
                    self.parent.filterFeature = feat;
                    feat.layer = self.parent.filterLayer;
                    if (callback) {
                        callback(feat);
                    }
                });
            });

        }
        else {
            this.drawCtrl.setActive(true);
            this.drawCtrl.startDrawing_(xy);
        }
    }

    cancelDraw(_xy, _layer, _callback) {
        if (this.drawCtrl && this.parent._isDrawing) {
            this.parent._isDrawing = false;
            this.drawCtrl.setActive(false);
            this.drawCtrl.source_.clear();

        }
    }

    async getFeaturesByGeometry(feature, xy) {

        const timestamp = Date.now();
        var map = this.parent.map;

        const olMap = await map.wrap.getMap();

        var olGeometry = feature.wrap.feature.getGeometry();
        var stride = olGeometry.stride;
        var flatCoordinates = olGeometry.getFlatCoordinates();
        //calcular el punto mas alto
        if (!xy) {
            var bestPoint = null;
            for (var i = 1, len = flatCoordinates.length; i < len; i += stride) {
                if (!bestPoint || bestPoint[1] < flatCoordinates[i]) {
                    bestPoint = [flatCoordinates[i - 1], flatCoordinates[i]];
                }
            }
            xy = olMap.getPixelFromCoordinate(new Point(bestPoint).getCoordinates());
        }

        this.parent.beforeRequest({ xy });

        // Agrupamos las peticiones por servicio WFS
        const wmsLayers = map.workLayers
            .filter((layer) => layer.type === Consts.layerType.WMS)
            .filter((layer) => layer.getVisibility());
        const wmsLayersWithWfs = (await Promise.all(wmsLayers.map(async (layer) => {
            try {
                const capabilities = await layer.getWFSCapabilities();
                if (capabilities) return layer;
                return null;
            }
            catch (e) {
                return null;
            }
        }))).filter((layer) => layer !== null);
        const wmsLayersWithoutWfs = wmsLayers.filter((layer) => !wmsLayersWithWfs.includes(layer));
        for (const layer of wmsLayersWithoutWfs) {
            map.toast(this.parent.getLocaleString('wfsGFI.inValidService', { serviceTitle: layer.title }), { type: Consts.msgType.WARNING });
        }

        const layersByService = Object.groupBy(wmsLayersWithWfs, (layer) => layer.url);

        const serviceUrls = Object.keys(layersByService);
        const requestsByService = Object.values(layersByService)
            .map((layers) => Promise.all(map.extractFeatures({
                layers,
                filter: new TC.filter.intersects(feature, map.crs),
            })));


        const services = serviceUrls.map((url) => ({
            url,
            layers: [],
            mapLayers: layersByService[url],
            title: layersByService[url][0].getPath()[0],
            layerNames: [],
            pending: true,
        }));

        let featureCount = 0;

        while (serviceUrls.length > 0) {
            let extractFeaturesResponse;
            try {
                extractFeaturesResponse = await Promise.any(requestsByService);
            }
            catch (e) {
                for (const service of services) {
                    if (service.pending) {
                        service.pending = false;
                        service.layers ??= [];
                    }
                }
                this.parent.responseCallback({
                    timestamp,
                    services,
                    featureCount,
                    lastResponse: true
                });
                break;
            }

            // El array solamente tiene una entrada porque se ha agrupado previamente por servicio
            const responseObj = extractFeaturesResponse[0];

            if (!responseObj) {
                this.parent.responseCallback({
                    timestamp,
                    xy: xy || null,
                    services,
                    featureCount,
                    lastResponse: serviceUrls.length === 1,
                });
                break;
            }

            if (responseObj.service) responseObj.service.title = responseObj.service.mapLayers[0].title;

            if (responseObj.errors && responseObj.errors.length) {
                for (const error of responseObj.errors) {
                    let errorMsg, errorType = Consts.msgType.WARNING;
                    switch (error.key) {
                        case Consts.WFSErrors.MAX_NUM_FEATURES:
                            errorMsg = this.parent.getLocaleString("wfs.tooManyFeatures", error.params);
                            break;
                        /*case Consts.WFSErrors.NO_LAYERS:
                            errorMsg = this.parent.getLocaleString('noLayersLoaded');
                        break;*/
                        case Consts.WFSErrors.GETCAPABILITIES:
                            errorMsg = this.parent.getLocaleString('wfsGFI.inValidService', error.params);
                            break;
                        case Consts.WFSErrors.NO_FEATURES:
                            //si no hay features nos callamos. Quizas en un futuro se muestre una alerta
                            continue;
                        case Consts.WFSErrors.INDETERMINATE:
                            errorMsg = this.parent.getLocaleString("wfs.IndeterminateError");
                            TC.error(`Error:${error.params.err}
Descripcion: ${error.params.errorThrown}
Servicio: ${error.params.serviceTitle}`, Consts.msgErrorMode.CONSOLE);
                            errorType = Consts.msgType.ERROR;
                            break;
                        default:
                            errorMsg = this.parent.getLocaleString("wfsGFI." + error.key, error.params);
                            break;
                    }

                    map.toast(errorMsg, { type: errorType });
                }
            }


            //ahora se distribuye la features por servicio y capa
            const currentService = services.find((service) => service.url.toLowerCase() === responseObj.service.url);
            currentService.pending = false;
            currentService.layers = responseObj.service.layers;
            // Puede no haber response porque la URL no es correcta, metemos un condicional
            const featuresFound = responseObj.response ? readFeaturesFromResponse(map, responseObj.response.responseText, responseObj.response.contentType) : [];
            if (featuresFound) {
                await featureToServiceDistributor(featuresFound, currentService);
                featureCount = featureCount + featuresFound.length;
            }
            else {
                TC.error(this.parent.getLocaleString('wfsGFI.invalidResponse', { serviceTitle: responseObj.service.title }));
            }

            const serviceIndex = serviceUrls.indexOf(responseObj.service.url);
            serviceUrls.splice(serviceIndex, 1);
            requestsByService.splice(serviceIndex, 1);

            this.parent.responseCallback({
                timestamp, xy: xy || null, services, featureCount, lastResponse: serviceUrls.length === 0
            });
        }
    }
}
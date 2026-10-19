import Feature from 'ol/Feature.js';
import { Image } from 'ol/layer.js';
import { ImageWMS } from 'ol/source.js';
import { WFS, WMSGetFeatureInfo } from 'ol/format.js';
import GeoJSON from '../../lib/ol/format/GeoJSON.js';
import GML2 from 'ol/format/GML2.js';
import GML3 from 'ol/format/GML3.js';

import ClickWrapper from './Click.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import { GMLFilter } from '../../SITNA/filter.js';
import Raster from '../../SITNA/layer/Raster.js';

var bufferElm;
var getElementText = function (elm) {
    var text = elm.innerHTML || elm.textContent;
    bufferElm = bufferElm || document.createElementNS("http://www.w3.org/1999/xhtml", "textarea");
    bufferElm.innerHTML = text;
    return bufferElm.value;
};

var esriXmlParser = {
    readFeatures: function (text) {
        var result = [];
        var dom = (new DOMParser()).parseFromString(text, 'text/xml');
        if (dom.documentElement.tagName === 'FeatureInfoResponse') {
            var fiCollections = dom.documentElement.getElementsByTagName('FeatureInfoCollection');
            for (var i = 0, len = fiCollections.length; i < len; i++) {
                var fic = fiCollections[i];
                var layerName = fic.getAttribute('layername');
                var fInfos = fic.getElementsByTagName('FeatureInfo');
                for (var j = 0, lenj = fInfos.length; j < lenj; j++) {
                    var fields = fInfos[j].getElementsByTagName('Field');
                    var attributes = {
                    };
                    for (var k = 0, lenk = fields.length; k < lenk; k++) {
                        var field = fields[k];
                        attributes[getElementText(field.getElementsByTagName('FieldName')[0])] = getElementText(field.getElementsByTagName('FieldValue')[0]);
                    }
                    var feature = new Feature(attributes);
                    feature.setId(layerName + '.' + TC.getUID());
                    result.push(feature);
                }
            }
        }
        return result;
    }
};

var addLayerToService = function (service, layer, name) {
    var path = layer.getPath(name);
    service.layers.push({
        name: name,
        title: path[path.length - 1],
        path: path.slice(1),
        features: [],
        filter: layer.filter
    });
};

export default class FeatureInfoWrapper extends ClickWrapper {

    async register(map) {
        await super.register(map);
        const _clickTrigger = this._trigger;
        this._trigger = (e) => {
            this.parent.beforeRequest({ xy: e.pixel });
            const result = _clickTrigger.call(this, e);
            if (!result) {
                this.parent.map.trigger(Consts.event.NOFEATUREINFO, { control: this.parent });
            }
        };
    }

    async getFeatureInfo(coords, resolution, options = {}) {
        const map = this.parent.map;
        const olMap = await map.wrap.getMap();
        const targetServices = {};
        const auxInfo = {};
        const requestPromises = [];
        const requestDataArray = [];
        const sitnaFeatures = [];
        const services = [];

        const timestamp = Date.now();

        //var infoFormats = [];
        const layers = olMap.getLayers().getArray();

        // GLS: filtro el array de capas para quedarnos con las capas que son raster y visibles.
        const rasterLayers = layers.filter((layer) => layer instanceof Image && layer.getVisible());

        for (var j = 0; j < rasterLayers.length; j++) {
            var olLayer = rasterLayers[j];
            var layer = olLayer._wrap.parent;
            const source = olLayer.getSource();
            //console.log("Source: " + layer.layerNames.join(","));
            //Por qué en workLayers están el vectorial de medición, y cosas así?
            if (source.getFeatureInfoUrl && map.workLayers.indexOf(layer) >= 0 && layer.names.length > 0
                && (!options.serviceUrl || options.serviceUrl === layer.url)) { // Mirar si en las opciones pone que solo busque en un servicio

                //
                let targetService;
                if (!targetServices[layer.url]) {
                    targetService = {
                        url: layer.url,
                        layers: [],
                        mapLayers: [],
                        title: layer.title,
                        request: null,
                        pending: true,
                    };
                    targetServices[layer.url] = targetService;
                    auxInfo[layer.url] = {
                        source: new ImageWMS({
                            url: source.getUrl(),
                            crossOrigin: source.crossOrigin_,
                            params: { ...source.getParams() },
                            ratio: TC.Cfg.imageRatio,
                            imageLoadFunction: layer.getImageLoad.bind(layer),
                            serverType: source.serverType_
                        }),
                        layers: []
                    };
                }
                else {

                    targetService = targetServices[layer.url];
                    auxInfo[layer.url].source.updateParams(Util.extend(auxInfo[layer.url].source.getParams(), source.getParams()));
                }
                targetService.mapLayers.push(layer);

                //var targetService = {
                //    layers: [], mapLayers: [layer]
                //};

                let isFromRasterOrigin;
                try {
                    isFromRasterOrigin = (await layer.describeLayer(true)).every((l) => l.owsType === "WCS");
                }
                catch (e) {
                    isFromRasterOrigin = false;
                }

                var disgregatedNames = isFromRasterOrigin ? layer.availableNames : layer.getDisgregatedLayerNames();
                if (options.layerName) { // Mirar si en las opciones pone que solo busque en una capa
                    if (disgregatedNames.indexOf(options.layerName) >= 0 && olLayer._wrap.getInfo(options.layerName).queryable) {
                        addLayerToService(targetService, layer, options.layerName);
                        auxInfo[layer.url].layers.push(options.layerName);
                    }
                }
                else {
                    for (var i = 0; i < disgregatedNames.length; i++) {
                        var name = disgregatedNames[i];
                        if (olLayer._wrap.getInfo(name).queryable) {
                            addLayerToService(targetService, layer, name);
                        }
                        else {
                            Util.consoleRegister('Capa "' + disgregatedNames[i] + '" no queryable, la eliminamos de la petición GFI');
                            disgregatedNames.splice(i, 1);
                            i = i - 1;
                        }

                    }

                    // GLS: validamos si nos queda alguna capa a la cual consultar
                    if (disgregatedNames.length > 0) {
                        auxInfo[layer.url].layers = auxInfo[layer.url].layers.concat(disgregatedNames);
                    }
                }
            }
        }
        const _isGMLFilter = function (filter) {
            return filter && (/<(Filter|fes:Filter|ogc:Filter).*<\/(Filter|fes:Filter|ogc:Filter)>/.test(filter) || filter instanceof TC.filter.Filter || filter instanceof GMLFilter);
        };
        const getGMLFilter = function (filter, params) {
            if (filter instanceof TC.filter.Filter) return filter.getText();
            if (filter instanceof GMLFilter) return params.filter;
            return filter;
        };
        for (var serviceUrl in targetServices) {
            services.push(targetServices[serviceUrl]);
            const targetService = targetServices[serviceUrl];
            const source = auxInfo[serviceUrl]?.source;
            if (source) {
                const serviceLayers = auxInfo[serviceUrl].layers;

                // GLS: validamos si hay capas a las cuales consultar, si no hay continuamos con el siguiente servicio
                if (!serviceLayers || serviceLayers.length === 0) {
                    continue;
                }

                var params = source.getParams();
                if (params.filter) {
                    params.filter = targetService.layers.map(function (i) {
                        return "(" + (!_isGMLFilter(i.filter) ? "" : getGMLFilter(i.filter, params)) + ")";
                    }).join("");
                }
                if (params.cql_filter) params.cql_filter = targetService.layers.map(function (i) { return !i.filter || _isGMLFilter(i.filter) ? "INCLUDE" : i.filter; }).join(";");
                params.LAYERS = serviceLayers.join(',');
                var gfiURL = source.getFeatureInfoUrl(coords, resolution, map.crs, {
                    'QUERY_LAYERS': serviceLayers.join(','),
                    'INFO_FORMAT': params.INFO_FORMAT,
                    'FEATURE_COUNT': 1000,
                    'radius': map.options.pixelTolerance,
                    'buffer': map.options.pixelTolerance
                });

                gfiURL = gfiURL.replace(/sld_body=[a-zA-Z%0-9._]*/); // Quitamos el parámetro sld_body


                const requestData = {
                    serviceUrl,
                    requestedFormat: params.INFO_FORMAT,
                    expandUrl: gfiURL,
                    requestIndex: requestPromises.length,
                };
                requestDataArray.push(requestData);
                requestPromises.push(new Promise(function (resolve, reject) {
                    const mapLayer = targetService.mapLayers[0];
                    if (!mapLayer) {
                        reject({ error: new Error('No map layer found for service ' + serviceUrl), requestIndex: requestData.requestIndex });
                        return;
                    }
                    mapLayer.proxificationTool.fetch(gfiURL)
                        .then(function (data) {
                            mapLayer.proxificationTool.cacheHost.getAction(requestData.expandUrl).then(function (cache) {
                                requestData.originalUrl = cache.action.call(mapLayer.proxificationTool, requestData.expandUrl);
                                resolve(Util.extend({}, data, requestData));
                            });
                        })
                        .catch(function (error) {
                            reject({ error, requestIndex: requestData.requestIndex });
                        });
                }));
                Util.consoleRegister("Lanzamos GFI");
            }
        }

        let pendingRequestPromises = [...requestPromises];
        let featureCount = 0;

        if (requestPromises.length > 0) {

            const featureInsertionPoints = new WeakMap();

            while (pendingRequestPromises.length > 0) {
                let featureInfo;
                try {
                    featureInfo = await Promise.any(pendingRequestPromises);
                }
                catch (e) {
                    const service = targetServices[requestDataArray[e.requestIndex].serviceUrl];
                    service.pending = false;
                    this.parent.responseCallback({
                        coords, resolution, services, featureCount
                    });
                    map.toast(this.parent.getLocaleString('featureInfo.error'), {
                        type: Consts.msgType.ERROR
                    });
                    return;
                }

                var service = targetServices[requestDataArray[featureInfo.requestIndex].serviceUrl];
                service.text = featureInfo.responseText;
                var format;
                var iFormat = featureInfo.contentType;
                if (iFormat && iFormat.indexOf(";") > -1)
                    iFormat = iFormat.substr(0, iFormat.indexOf(";")).trim();

                if (!iFormat) iFormat = featureInfo.requestedFormat;

                if (iFormat === featureInfo.requestedFormat) {
                    switch (iFormat) {
                        case 'application/json':
                            format = new GeoJSON();
                            break;
                        case 'application/vnd.ogc.gml':
                            if (featureInfo.responseText.indexOf("FeatureCollection") > -1) {
                                format = new WFS({
                                    gmlFormat: new GML2({
                                        srsName: map.crs
                                    })
                                });
                            }
                            else {
                                format = new WMSGetFeatureInfo();
                            }
                            break;
                        case 'application/vnd.ogc.gml/3.1.1':
                            format = new GML3({
                                srsName: map.crs
                            });
                            break;
                        case 'application/vnd.esri.wms_featureinfo_xml':
                            format = esriXmlParser;
                            break;
                        default:
                            format = null;
                            break;
                    }

                    if (format) {
                        var features;
                        try {
                            features = format.readFeatures(featureInfo.responseText, {
                                featureProjection: ol.proj.get(map.crs)
                            });
                        }
                        catch (e) {
                            TC.error(this.parent.getLocaleString('featureInfo.error.badResponse', { url: featureInfo.serviceUrl }) + ': ' + e.message);
                            features = [];
                            continue;
                        }
                        featureCount = featureCount + features.length;
                        var isParentOrSame = function (layer, na, nb) {
                            var result = false;
                            if (na === nb) {
                                result = true;
                            }
                            else {
                                var pa = layer.getNodePath(na);
                                var pb = layer.getNodePath(nb);
                                if (pa.length > 0 && pb.length >= pa.length) {
                                    result = true;
                                    for (var i = 0; i < pa.length; i++) {
                                        if (layer.wrap.getName(pa[i]) !== layer.wrap.getName(pb[i])) {
                                            result = false;
                                            break;
                                        }
                                    }
                                }
                            }
                            return result;
                        };

                        var fakeLayers = {
                        };

                        for (const feature of features) {
                            if (feature instanceof Feature) {
                                var fid = feature.getId() || TC.getUID();
                                var found = false;
                                var layerName = fid.substr(0, fid.lastIndexOf('.'));
                                for (const l of service.layers) {
                                    var lName = l.name.substr(l.name.indexOf(':') + 1);
                                    if (service.mapLayers.some(mapLayer => isParentOrSame(mapLayer, lName, layerName))) {
                                        found = true;
                                        if (!options.featureId || feature.getId() === options.featureId) { // Mirar si en las opciones pone que solo busque una feature
                                            const sitnaFeature = TC.wrap.Feature.createFeature(feature, { showsPopup: false });
                                            sitnaFeatures.push(sitnaFeature);
                                            featureInsertionPoints.set(sitnaFeature, l.features);
                                        }
                                        break;
                                    }
                                }

                                //si llegamos aquí y no he encontrado su layer, es que no cuadraba el prefijo del fid con el id del layer
                                //esto pasa, p.ej, en cartociudad
                                if (!found) {
                                    //así que creo un layer de palo para la respuesta del featInfo
                                    var fakeLayer;
                                    if (fakeLayers[layerName]) fakeLayer = fakeLayers[layerName];
                                    else {
                                        fakeLayer = {
                                            name: layerName, title: layerName, path: [layerName], features: []
                                        };
                                        fakeLayers[layerName] = fakeLayer;
                                        service.layers.push(fakeLayer);
                                    }

                                    if (!options.featureId || feature.getId() === options.featureId) { // Mirar si en las opciones pone que solo busque una feature
                                        const sitnaFeature = TC.wrap.Feature.createFeature(feature, { showsPopup: false });
                                        sitnaFeatures.push(sitnaFeature);
                                        featureInsertionPoints.set(sitnaFeature, fakeLayer.features);
                                    }
                                }
                            }
                        }//iteración sobre las features de esta respuesta


                    }
                    else {
                        //si no hay formato reconocido y parseable, metemos un iframe con la respuesta
                        //y prau
                        //para eso, creo una falsa entrada de tipo feature, con un campo especial rawUrl o rawContent

                        const compoundLayer = {
                            name: 'layer' + TC.getUID(), title: 'Datos en el punto', features: [{
                                rawUrl: featureInfo.originalUrl, expandUrl: featureInfo.expandUrl, rawContent: featureInfo.responseText, rawFormat: iFormat
                            }]
                        };

                        service.layers.push(compoundLayer);
                        featureCount = featureCount + 1;
                    }
                }
                else { // iFormat !== featureInfo.requestedFormat

                    // GLS:
                    Util.consoleRegister("Respuesta GFI: lo más probable es que el servidor esté devolviendo una excepción");
                    Util.consoleRegister("Lanzamos los eventos que corresponde y mostramos tostada");

                    // En este caso lo más probable es que el servidor esté devolviendo una excepción
                    this.parent.responseError({
                        message: featureInfo.responseText,
                        status: featureInfo.status
                    });
                    // GLS: misma gestión de error que en ol.js - > function (a, b, c) { // error...
                    map.toast(this.parent.getLocaleString('featureInfo.error'), {
                        type: Consts.msgType.ERROR
                    });
                }

                var defaultFeature;
                for (const feat of sitnaFeatures) {
                    feat.attributes = [];
                    for (var key in feat.data) {
                        var value = feat.data[key];
                        if (typeof value !== 'object') {
                            feat.attributes.push({
                                name: key,
                                value: typeof value === "number" ? value.toLocaleString(Util.getMapLocale(this.parent.map)) : value
                            });
                        }
                        else {
                            feat.attributes.push({
                                name: key,
                                value: value//"objeto complejo"
                            });
                        }
                    }
                    if (!defaultFeature && TC.Geometry.isInside(coords, feat.geometry)) {
                        defaultFeature = feat;
                    }
                    const featureInsertionPoint = featureInsertionPoints.get(feat);
                    // Añadimos la feature si no ha sido ya añadida (por ejemplo porque hay dos capas en el 
                    // mapa que tienen features coincidentes)
                    if (!featureInsertionPoint.some(f => f.id === feat.id)) {
                        featureInsertionPoint.push(feat);
                    }
                }

                service.pending = false;
                requestPromises[featureInfo.requestIndex] = null;
                pendingRequestPromises = requestPromises.filter((p) => p);

                this.parent.responseCallback({
                    timestamp,
                    coords,
                    resolution,
                    services,
                    featureCount,
                    defaultFeature,
                    lastResponse: pendingRequestPromises.length === 0,
                });
            }
        }
        else {

            if (map.workLayers.filter(function (layer) {
                return layer instanceof Raster;
            }).length > 0) {
                map.toast(this.parent.getLocaleString('featureInfo.notQueryableLayers'), {
                    type: Consts.msgType.INFO
                });
            }

            // GLS: nos suscribimos Consts.event.BEFOREFEATUREINFO y lanzamos el mismo evento de zero resultados ya que puede darse que la resolución se lance antes del before.
            map.on(Consts.event.BEFOREFEATUREINFO, () => {
                this.parent.responseCallback({ timestamp, coords, resolution, services, featureCount });
            });

            this.parent.responseCallback({ timestamp, coords, resolution, services, featureCount, lastResponse: true });
        }
    }
}
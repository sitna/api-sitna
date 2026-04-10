
/**
  * Opciones de control de obtención de información de entidades de mapa por línea o por recinto.
  * @interface GeometryFeatureInfoOptions
  * @extends FeatureInfoOptions
  * @see MultiFeatureInfoModeOptions
  * @property {PolylineStyleOptions|PolygonStyleOptions} [filterStyle] - Estilo de la entidad cuya geometría servirá de filtro espacial para la consulta.
  * @property {boolean} [persistentHighlights] - Cuando el control muestra los resultados de la consulta muestra también resaltadas sobre el mapa las geometrías
  * de las entidades geográficas de la respuesta. Si este valor es verdadero, dichas geometrías se quedan resaltadas en el mapa indefinidamente. 
  * En caso contrario, las geometrías resaltadas se borran en el momento en que se cierra el bocadillo de resultados o se hace una nueva consulta.
  */


import TC from '../../TC.js';
import Consts from '../Consts.js';
import FeatureInfoCommons from './FeatureInfoCommons.js';
import filter from '../filter.js';

TC.control = TC.control || {};
TC.filter = filter;

class GeometryFeatureInfo extends FeatureInfoCommons {
    constructor() {
        super(...arguments);
        const self = this;
        self.wrap = new TC.wrap.control.GeometryFeatureInfo(self);
        self._isDrawing = false;
        self._isSearching = false;
        self._drawToken = false;
    }

    async register(map) {
        const self = this;
        const result = super.register.call(self, map);

        self.on(Consts.event.CONTROLDEACTIVATE, function (_e) {
            self.wrap.cancelDraw();
        });

        map.on(Consts.event.LAYERREMOVE, function (_e) {
            if (map.workLayers.every((layer) => layer.stealth)) {
                self.filterLayer && self.filterLayer.clearFeatures();
                self.filterFeature = null;
            }
        });
        map.on(Consts.event.VIEWCHANGE, function (_e) {
            if (_e.view === Consts.view.DEFAULT && self.isActive)
                self.activate();
        });

        return await result;
    }

    callback(coords, _xy) {
        const self = this;
        return new Promise(function (resolve, _reject) {
            if (self._drawToken) {
                resolve();
                return;
            }
            self.closeResults();
            if (self.filterFeature) {
                self.filterLayer.removeFeature(self.filterFeature);
                self.filterFeature = null;
            }
            self.highlightedFeature = null;
            var visibleLayers = false;
            for (var i = 0; i < self.map.workLayers.length; i++) {
                var layer = self.map.workLayers[i];
                if (layer.type === Consts.layerType.WMS) {
                    if (layer.getVisibility() && layer.names.length > 0) {
                        visibleLayers = true;
                        break;
                    }
                }
            }
            if (visibleLayers) {
                self.closeResults();
                self.wrap.beginDraw({
                    geometryType: self.geometryType,
                    xy: coords,
                    layer: self.filterLayer,
                    callback: function (feature) {
                        self.wrap.getFeaturesByGeometry(feature).then(resolve);
                    }
                });
            }
            else {
                resolve();
            }
        });
    }

    sendRequest(filter) {
        return this.wrap.getFeaturesByGeometry(filter);
    }

    responseCallback(options = {}) {
        const self = this;
        if (self.lastTimestamp > options.timestamp) return;

        super.responseCallback.call(self, options);

        if (self.filterFeature) {
            const services = self.info.services;

            // Eliminamos capas sin resultados a no ser que tenga un error
            for (const service of services) {
                if (service.pending) continue;
                if (service.hasLimits) {
                    delete service.layers;
                    //service.hasLimits = service.hasLimits;
                }
                else {
                    for (var j = 0; j < service.layers.length; j++) {
                        if (!service.layers[j].features.length) {
                            service.layers.splice(j, 1);
                            j = j - 1;
                        }
                    }
                }
            }
            if (options.coords && options.featureCount === 0) {
                //esto significa que se ha borrado la ultima feature
                self.popup.hide();
            }
            else {
                const renderOptions = { ...self.info };
                renderOptions.services = options.services?.toReversed();
                self.renderData(renderOptions, async function () {
                    const serviceList = self.div.querySelector(`ul.${self.CLASS}-services`);
                    if (self.info) {
                        for (const service of self.info.services) {
                            let serviceElement = serviceList.querySelector(`li[data-url="${service.url}"]`);
                            if (!service.layers?.some((layer) => layer.features.length > 0)) {
                                serviceElement?.remove();
                            }
                            else {
                                const html = await self.getRenderedHtml(`${self.CLASS}-service`, service);
                                if (serviceElement) {
                                    serviceElement.insertAdjacentHTML('afterend', html);
                                    serviceElement.remove();
                                }
                                else {
                                    serviceList.insertAdjacentHTML('beforeend', html);
                                }
                            }
                        }
                    }
                    self.setFeatureCountUI();
                    self.insertLinks();
                    self.div.querySelector(`.${self.CLASS}-coords`).classList.add(Consts.classes.HIDDEN);
                    if (!self.info || !self.info.services.length || self.info.services.every((service) => service.layers.length === 0)) {
                        if (options.lastResponse) {
                            self.map.toast(self.getLocaleString('query.msgNoResults'), { type: Consts.msgType.INFO });
                        }
                        return;
                    }
                    self.displayResults();
                });
            }
        }
    }
}

TC.control.GeometryFeatureInfo = GeometryFeatureInfo;
export default GeometryFeatureInfo;
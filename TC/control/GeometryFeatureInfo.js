
/**
  * Opciones de control de obtención de información de entidades de mapa por línea o por recinto.
  * @typedef GeometryFeatureInfoOptions
  * @extends FeatureInfoOptions
  * @memberof SITNA.control
  * @see SITNA.control.MultiFeatureInfoModeOptions
  * @property {PolylineStyleOptions|PolygonStyleOptions} [filterStyle] - Estilo de la entidad cuya geometría servirá de filtro espacial para la consulta.
  * @property {boolean} [persistentHighlights] - Cuando el control muestra los resultados de la consulta muestra también resaltadas sobre el mapa las geometrías
  * de las entidades geográficas de la respuesta. Si este valor es verdadero, dichas geometrías se quedan resaltadas en el mapa indefinidamente. 
  * En caso contrario, las geometrías resaltadas se borran en el momento en que se cierra el bocadillo de resultados o se hace una nueva consulta.
  */


import TC from '../../TC';
import Consts from '../Consts';
import FeatureInfoCommons from './FeatureInfoCommons';
import filter from '../filter';

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

    responseCallback(options) {
        const self = this;

        super.responseCallback.call(self, options);

        if (self.filterFeature) {
            var services = options.services;

            // Eliminamos capas sin resultados a no ser que tenga un error
            for (var i = 0; i < services.length; i++) {
                var service = services[i];
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
                    if (!service.layers.length) {
                        services.splice(i, 1);
                        i = i - 1;
                    }
                }

            }
            if (options.coords && options.featureCount === 0) {
                //esto significa que se ha borrado la ultima feature
                self.popup.hide();
            }
            else
            self.renderData(options, function () {
                if (services.length) {
                    self.insertLinks();
                }
                self.div.querySelector(`.${self.CLASS}-coords`).classList.add(Consts.classes.HIDDEN);
                if (!self.info || !self.info.services.length) {
                    self.map.toast(self.getLocaleString('query.msgNoResults'), { type: Consts.msgType.INFO });
                    return;
                }
                self.displayResults();
            });
        }
    }
}

TC.control.GeometryFeatureInfo = GeometryFeatureInfo;
export default GeometryFeatureInfo;
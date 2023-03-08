
/**
  * Opciones de control de obtención de información de entidades de mapa por línea o por recinto.
  * @typedef GeometryFeatureInfoOptions
  * @extends FeatureInfoOptions
  * @see MultiFeatureInfoModeOptions
  * @property {LineStyleOptions|PolygonStyleOptions} [filterStyle] - Estilo de la entidad cuya geometría servirá de filtro espacial para la consulta.
  * @property {boolean} [persistentHighlights] - Cuando el control muestra los resultados de la consulta muestra también resaltadas sobre el mapa las geometrías
  * de las entidades geográficas de la respuesta. Si este valor es verdadero, dichas geometrías se quedan resaltadas en el mapa indefinidamente. 
  * En caso contrario, las geometrías resaltadas se borran en el momento en que se cierra el bocadillo de resultados o se hace una nueva consulta.
  */


import TC from '../../TC';
import Consts from '../Consts';
import FeatureInfoCommons from './FeatureInfoCommons';
import filter from '../filter';

TC.control = TC.control || {};
TC.Consts = Consts;
TC.control.FeatureInfoCommons = FeatureInfoCommons;
TC.filter = filter;

(function () {
    TC.control.GeometryFeatureInfo = function () {
        var self = this;
        TC.control.FeatureInfoCommons.apply(this, arguments);
        self.wrap = new TC.wrap.control.GeometryFeatureInfo(self);
        self._isDrawing = false;
        self._isSearching = false;
        self._drawToken = false;
    };

    TC.inherit(TC.control.GeometryFeatureInfo, TC.control.FeatureInfoCommons);

    var ctlProto = TC.control.GeometryFeatureInfo.prototype;

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.control.FeatureInfoCommons.prototype.register.call(self, map);

        self.on(TC.Consts.event.CONTROLDEACTIVATE, function (_e) {
            self.wrap.cancelDraw();
        });

        return result;
    };

    ctlProto.callback = function (coords, _xy) {
        var self = this;
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
                if (layer.type === TC.Consts.layerType.WMS) {
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
                        self.wrap.getFeaturesByGeometry(feature).then(() => resolve());
                    }
                });
            }
            else {
                resolve();
            }
        });
    };

    ctlProto.sendRequest = function (filter) {
        return this.wrap.getFeaturesByGeometry(filter);
    };

    ctlProto.responseCallback = function (options) {
        var self = this;

        TC.control.FeatureInfoCommons.prototype.responseCallback.call(self, options);

        if (self.filterFeature) {
            var services = options.services;

            // Eliminamos capas sin resultados a no ser que tenga un error
            for (var i = 0; i < services.length; i++) {
                var service = services[i];
                if (service.hasLimits) {
                    delete service.layers;
                    service.hasLimits = service.hasLimits;
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
            self.renderData(options, function () {
                if (services.length) {
                    self.insertLinks();
                }
                self.div.querySelector(`.${self.CLASS}-coords`).classList.add(TC.Consts.classes.HIDDEN);
                if (!self.info || !self.info.services.length) {
                    self.map.toast(self.getLocaleString('query.msgNoResults'), { type: TC.Consts.msgType.INFO });
                    return;
                }
                self.displayResults();
            });
        }
    };

})();

const GeometryFeatureInfo = TC.control.GeometryFeatureInfo;
export default GeometryFeatureInfo;
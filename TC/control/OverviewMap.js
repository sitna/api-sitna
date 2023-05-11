
/**
  * Opciones de control de mapa de situación.
  * @typedef OverviewMapOptions
  * @extends SITNA.control.ControlOptions
  * @see SITNA.control.MapControlOptions
  * @memberof SITNA.control
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {string|object} layer - Identificador de capa para usar como mapa de fondo u objeto de opciones de capa.
  */

import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Control from '../Control';
import Raster from '../../SITNA/layer/Raster';
import Vector from '../../SITNA/layer/Vector';

TC.control = TC.control || {};
TC.Control = Control;

class OverviewMap extends Control {
    #wrapPromise;

    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.add(self.CLASS);

        self.isLoaded = false;
        self.layer = null;
    }

    getClassName() {
        return 'tc-ctl-ovmap';
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-ovmap.mjs');
        self.template = module.default;
    }

    async register(map) {
        const self = this;

        const instanceLayer = function (layer) {
            var lyr;

            var findLayerById = function (id, layers) {
                var result = null;
                for (var i = 0; i < layers.length; i++) {
                    var lyr = layers[i];
                    var l = lyr.id || lyr;
                    if (l === id) {
                        result = lyr;
                        break;
                    }
                }
                return result;
            };

            if (typeof layer === 'string') {
                var lyrObj = findLayerById(layer, map.options.availableBaseLayers);
                if (!Util.isPlainObject(lyrObj)) {
                    lyrObj = findLayerById(layer, map.options.baseLayers);
                }
                if (Util.isPlainObject(lyrObj)) {
                    lyr = new Raster(lyrObj);
                }
            }
            else {
                if (layer instanceof Raster || layer instanceof Vector) {
                    lyr = layer;
                }
                else if (layer.type === Consts.layerType.VECTOR || layer.type === Consts.layerType.KML || layer.type === Consts.layerType.WFS) {
                    lyr = new Vector(layer);
                }
                else {
                    lyr = new Raster(layer);
                }
            }

            return lyr;
        };

        const registerLayer = function (layer) {
            var lyr;

            lyr = instanceLayer(layer);

            return lyr;
        };

        const resetOVMapProjection = function (_e) {
            const resetOptions = {};
            self.layer.getCapabilitiesPromise().then(function () {
                if (!self.layer.isCompatible(map.crs) && self.layer.wrap.getCompatibleMatrixSets(map.crs).length === 0) {
                    resetOptions.layer = self.layer.getFallbackLayer();
                }
                self.wrap.reset(resetOptions);
            });
        };

        const changeBaseLayer = function (e) {
            const self = this;

            if (self.map.baseLayer.type === Consts.layerType.WMS || self.map.baseLayer.type === Consts.layerType.WMTS || self.options.layer) {
                var newLayer = self.map.baseLayer.overviewMapLayer || self.options.layer;
                let ovMapLayer;
                if (self.layer.id !== newLayer) {
                    ovMapLayer = registerLayer(newLayer);
                } else if (Consts.event.PROJECTIONCHANGE.includes(e.type)) {
                    ovMapLayer = self.layer;
                }
                if (ovMapLayer) {
                    self.wrap.reset({
                        layer: ovMapLayer
                    }).then(function (layer) {
                        self.layer = layer;
                    });
                }
            }
        };

        const ctl = await super.register.call(self, map);
        self.wrap = new TC.wrap.control.OverviewMap(self);
        map.loaded(function () {
            self.defaultLayer = registerLayer(self.options.layer);
            self.layer = registerLayer(map.baseLayer.overviewMapLayer || self.options.layer || map.options.baseLayers[0] || map.options.availableBaseLayers[0]);

            self.#registerWrap().then(() => resetOVMapProjection({ crs: map.crs }));

            map.on(Consts.event.PROJECTIONCHANGE + ' ' + Consts.event.BASELAYERCHANGE, changeBaseLayer.bind(self));
        });

        return ctl;
    }

    loaded(callback) {
        const self = this;

        if (Util.isFunction(callback)) {
            if (self.isLoaded && self.map && self.map.isLoaded) {
                callback();
            }
            else {
                self.on(Consts.event.MAPLOAD, callback);
            }
        }
    }

    activate() {
        this.enable();
    }

    deactivate() {
        this.disable();
    }

    enable() {
        const self = this;
        super.enable.call(self);
        self.#registerWrap().then(() => self.wrap.enable());
    }

    disable() {
        const self = this;
        super.disable.call(self);
        self.#registerWrap().then(() => self.wrap.disable());
    }

    #registerWrap() {
        const self = this;
        if (!self.#wrapPromise && self.map) {
            self.#wrapPromise = self.wrap.register(self.map);
        }
        return self.#wrapPromise;
    }
}

TC.control.OverviewMap = OverviewMap;
export default OverviewMap;

/**
  * Opciones de control de mapa de situación.
  * @typedef OverviewMapOptions
  * @extends ControlOptions
  * @see MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {string|object} layer - Identificador de capa para usar como mapa de fondo u objeto de opciones de capa.
  */

TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.OverviewMap = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    self.isLoaded = false;

    self.layer = null;
};

TC.inherit(TC.control.OverviewMap, TC.Control);

(function () {
    var ctlProto = TC.control.OverviewMap.prototype;

    ctlProto.CLASS = 'tc-ctl-ovmap';

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-ovmap.hbs";

    ctlProto.register = function (map) {
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
                if (!TC.Util.isPlainObject(lyrObj)) {
                    lyrObj = findLayerById(layer, map.options.baseLayers);
                }
                if (TC.Util.isPlainObject(lyrObj)) {
                    lyr = new TC.layer.Raster(lyrObj);
                }
            }
            else {
                if (layer instanceof TC.Layer) {
                    lyr = layer;
                }
                else if (layer.type === TC.Consts.layerType.VECTOR || layer.type === TC.Consts.layerType.KML || layer.type === TC.Consts.layerType.WFS) {
                    lyr = new TC.layer.Vector(layer);
                }
                else {
                    lyr = new TC.layer.Raster(layer);
                }
            }

            return lyr;
        };

        const registerLayer = function (layer) {
            var lyr;

            lyr = instanceLayer(layer);

            return lyr;
        };

        const resetOVMapProjection = function (e) {
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

            if (self.map.baseLayer.type === TC.Consts.layerType.WMS || self.map.baseLayer.type === TC.Consts.layerType.WMTS || self.options.layer) {
                var newLayer = self.map.baseLayer.overviewMapLayer || self.options.layer;
                if (self.layer.id !== newLayer) {
                    var overviewMapLayer = registerLayer(newLayer);
                    self.wrap.reset({
                        layer: overviewMapLayer
                    }).then(function (layer) {
                        self.layer = layer;
                    });
                } else if (TC.Consts.event.PROJECTIONCHANGE.indexOf(e.type) > -1) {
                    self.wrap.reset({
                        layer: self.layer
                    }).then(function (layer) {
                        self.layer = layer;
                    });
                }
            }
        };

        const result = new Promise(function (resolve, reject) {
            TC.Control.prototype.register.call(self, map)
                .then(function (ctl) {
                    self.wrap = new TC.wrap.control.OverviewMap(self);
                    map.loaded(function () {
                        self.defaultLayer = registerLayer(self.options.layer);
                        self.layer = registerLayer(map.baseLayer.overviewMapLayer || self.options.layer || map.options.baseLayers[0] || map.options.availableBaseLayers[0]);

                        self.wrap.register(map);                        

                        resetOVMapProjection({ crs: map.crs });

                        map.on(TC.Consts.event.PROJECTIONCHANGE + ' ' + TC.Consts.event.BASELAYERCHANGE, changeBaseLayer.bind(self));
                    });
                    resolve(ctl);
                })
                .catch(function (err) {
                    reject(err);
                });
        });

        return result;
    };

    ctlProto.loaded = function (callback) {
        var self = this;

        if (TC.Util.isFunction(callback)) {
            if (self.isLoaded && self.map && self.map.isLoaded) {
                callback();
            }
            else {
                self.on(TC.Consts.event.MAPLOAD, callback);
            }
        }
    };

    ctlProto.activate = function () {
        this.enable();
    };

    ctlProto.deactivate = function () {
        this.disable();
    };

    ctlProto.enable = function () {
        var self = this;
        TC.Control.prototype.enable.call(self);
        self.wrap.enable();
    };

    ctlProto.disable = function () {
        var self = this;
        TC.Control.prototype.disable.call(self);
        self.wrap.disable();
    };

})();
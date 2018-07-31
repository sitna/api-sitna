TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.OverviewMap = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    self.$events = $(self);
    self.isLoaded = false;

    self.layer = null;

    self.wrap = new TC.wrap.control.OverviewMap(self);
};

TC.inherit(TC.control.OverviewMap, TC.Control);

(function () {
    var ctlProto = TC.control.OverviewMap.prototype;

    ctlProto.CLASS = 'tc-ctl-ovmap';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/OverviewMap.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-ovmap-load tc-hidden\"></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;

        var layer = self.options.layer;

        TC.Control.prototype.register.call(self, map);

        map.loaded(function () {
            var lyr;
            if (typeof layer === 'string') {
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
                var lyrObj = findLayerById(layer, map.options.availableBaseLayers);
                if (!$.isPlainObject(lyrObj)) {
                    lyrObj = findLayerById(layer, map.options.baseLayers);
                }
                if ($.isPlainObject(lyrObj)) {
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

            // GLS: Referencio el mapa en la capa. Como no se añade la capa al mapa, no hay referencia.
            lyr.map = map;

            self.layer = lyr;
            self.wrap.register(map);

            const resetOVMapProjection = function (e) {
                const resetOptions = {};
                self.layer.getCapabilitiesPromise().then(function () {
                    if (!self.layer.isCompatible(map.crs) && self.layer.wrap.getCompatibleMatrixSets(map.crs).length === 0) {
                        resetOptions.layer = self.layer.getFallbackLayer();
                    }
                    self.wrap.reset(resetOptions);
                });
            };

            resetOVMapProjection({ crs: map.crs });

            map.on(TC.Consts.event.PROJECTIONCHANGE, resetOVMapProjection);
        });
    };

    ctlProto.loaded = function (callback) {
        var self = this;

        if ($.isFunction(callback)) {
            if (self.isLoaded && self.map && self.map.isLoaded) {
                callback();
            }
            else {
                self.$events.on(TC.Consts.event.MAPLOAD, callback);
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
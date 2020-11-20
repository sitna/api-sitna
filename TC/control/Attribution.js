TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Attribution = function () {
    const self = this;

    TC.Control.apply(self, arguments);

    self.apiAttribution = '';
    self.mainDataAttribution = null;
    self.dataAttributions = [];
    if (self.options.dataAttributions) {
        self.dataAttributions = self.options.dataAttributions instanceof Array ? self.options.dataAttributions : [self.options.dataAttributions];
    }
};

TC.inherit(TC.control.Attribution, TC.Control);

(function () {
    var ctlProto = TC.control.Attribution.prototype;

    ctlProto.CLASS = 'tc-ctl-attrib';

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-attrib.hbs";

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);

        self.apiAttribution = self.map.options.attribution || self.apiAttribution;

        var addData = function (obj) {
            if (obj) {
                // TODO: sanitizer
                var attr = obj.getAttribution();
                if (attr) {
                    if (/IDENA/.test(attr.name) || /Tracasa Instrumental/.test(attr.name)) {
                        self.mainDataAttribution = {
                            name: 'IDENA',
                            site: 'https://idena.navarra.es/'
                        };
                    }
                    else {
                        var textExists = false;
                        for (var i = 0; i < self.dataAttributions.length; i++) {
                            if (attr.name === self.dataAttributions[i].name) {
                                textExists = true;
                                break;
                            }
                        }
                        if (!textExists) {
                            self.dataAttributions.push(attr);
                        }
                    }
                }
            }
        };

        var removeData = function (obj) {
            if (obj) {

                var checkRemoveData = function () {
                    if (obj.map.workLayers.length > 0) {
                        var _wl = obj.map.workLayers.slice().reverse();
                        for (var i = 0; i < _wl.length; i++) {
                            if (_wl[i].url == obj.url && _wl[i].getVisibility())
                                return false;
                        }

                        return true;
                    }

                    return true;
                };

                if (obj instanceof TC.Layer ? checkRemoveData() : true) {
                    // TODO: sanitizer
                    var attr = obj.getAttribution();

                    if (attr) {
                        var index = self.dataAttributions.reduce(function (prev, cur, idx) {
                            if (cur.name === attr.name) {
                                return idx;
                            }
                            return prev;
                        }, -1);

                        const checkIsSameAttribution = function (toCheckName) {
                            return (/IDENA/.test(attr.name) || /Tracasa Instrumental/.test(attr.name)) &&
                                (/IDENA/.test(toCheckName) || /Tracasa Instrumental/.test(toCheckName)) ||
                                    (attr.name === toCheckName);
                        };

                        // 07/10/2020 Validamos contra el mapa de fondo antes de cambiar de mapa de fondo así que no se borran cuando deberían.
                        // Validamos que la capa a borrar no sea la de fondo actual
                        // Validamos si las atribuciones a borrar son también del mapa base
                        if (self.map.baseLayer && self.map.baseLayer.wrap.getAttribution() && checkIsSameAttribution(self.map.baseLayer.wrap.getAttribution().name) && 
                            obj.parent.id !== self.map.baseLayer.id) {
                            return;
                        } else {
                            // Validamos si las atribuciones a borrar son también de alguna de las capas raster cargadas
                            if (self.map.workLayers.filter(function (layer) {
                                return layer.type === TC.Consts.layerType.WMS || layer.type === TC.Consts.layerType.WMTS;
                            }).some(function (layer) {
                                var workLayerAttribution = layer.wrap.getAttribution();
                                return workLayerAttribution && checkIsSameAttribution(workLayerAttribution.name);
                            })) {
                                return;
                            }
                        }

                        if (index > -1) {
                            self.dataAttributions.splice(index, 1);
                        } else if (/IDENA/.test(attr.name) || /Tracasa Instrumental/.test(attr.name)) {
                            self.mainDataAttribution = null;
                        }
                    }
                }
            }
        };
        //URI: Si las atribuciones están vacias evito hace una llamada al renderizado del control ya que lo obtendría sin datos.
        //self.render();

        map.loaded(function () {
            if (map.baseLayer.wrap.getAttribution) {
                addData(map.baseLayer.wrap);
                self.render();
            }
        });

        map.on(TC.Consts.event.LAYERADD, function (e) {
            const layer = e.layer;
            if (!layer.isBase && layer.wrap.getAttribution && layer.wrap.getAttribution()) {
                addData(layer.wrap);
                self.render();
            }
        });

        map.on(TC.Consts.event.BEFOREBASELAYERCHANGE + " " + TC.Consts.event.OVERVIEWBASELAYERCHANGE, function (e) {
            const type = e.type;
            const newLayer = e.newLayer;
            const oldLayer = e.oldLayer;
            if (TC.Consts.event.OVERVIEWBASELAYERCHANGE.indexOf(type) > -1) {
                self.ignoreLayer = newLayer;
            }

            if (oldLayer && oldLayer.wrap.getAttribution) {
                removeData(oldLayer.wrap);
            }

            if (newLayer && newLayer.wrap.getAttribution) {
                addData(newLayer.wrap);
            }

            self.render();
        });

        map.on(TC.Consts.event.LAYERREMOVE, function (e) {
            const layer = e.layer;
            if (layer.wrap.getAttribution) {
                removeData(layer.wrap);
                self.render();
            }
        });

        map.on(TC.Consts.event.TERRAINPROVIDERADD, function (e) {
            const terrainProvider = e.terrainProvider;
            if (terrainProvider.getAttribution) {
                addData(terrainProvider);
                self.render();
            }
        });

        map.on(TC.Consts.event.TERRAINPROVIDERREMOVE, function (e) {
            const terrainProvider = e.terrainProvider;
            if (terrainProvider.getAttribution) {
                removeData(terrainProvider);
                self.render();
            }
        });

        map.on(TC.Consts.event.LAYERVISIBILITY, function (e) {
            const layer = e.layer;
            if (self.ignoreLayer === layer) {
                return;
            }

            if (layer.wrap.getAttribution) {
                if (layer.getVisibility()) {
                    addData(layer.wrap);
                } else {
                    removeData(layer.wrap);
                }
                self.render();
            }
        });

        return result;
    };

    ctlProto.render = function (callback) {
        const self = this;        

        return self._set1stRenderPromise(self.renderData({
            api: (typeof (self.apiAttribution) === 'function' ? self.apiAttribution.apply(self) : self.getLocaleString(self.apiAttribution)),
            mainData: self.mainDataAttribution,
            otherData: self.dataAttributions,
            isCollapsed: self.div.querySelector('.' + self.CLASS + '-other') ? self.div.querySelector('.' + self.CLASS + '-other').classList.contains(TC.Consts.classes.COLLAPSED) : true
        }, function () {
            const cmd = self.div.querySelector('.' + self.CLASS + '-cmd');
            cmd && cmd.addEventListener(TC.Consts.event.CLICK, function () {
                self.toggleOtherAttributions();
            }, { passive: true });

            if (typeof callback === 'function') {
                callback();
            }
        }));
    };

    ctlProto.toggleOtherAttributions = function () {
        const self = this;
        const other = self.div.querySelector('.' + self.CLASS + '-other');
        other.classList.toggle(TC.Consts.classes.COLLAPSED);
    };
})();

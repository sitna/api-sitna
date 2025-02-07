﻿import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';
import Layer from '../../SITNA/layer/Layer';
import Observer from '../Observer';
import Controller from '../Controller';

TC.control = TC.control || {};
TC.Control = Control;


class AttributionModel {
    constructor() {
        //super();
        this.data = "";
        this.others = "";
        this.attributionGithubTooltip = "";
    }
}

class AttributionView extends Observer {
    constructor(object) {
        super(object);
    }

    update(model) {
        //this.heading.innerText = model.heading;
    }
}

class Attribution extends Control {
    constructor() {
        super(...arguments);
        const self = this;

        self.apiAttribution = '';
        self.mainDataAttribution = null;
        self.dataAttributions = [];
        if (self.options.dataAttributions) {
            self.dataAttributions = self.options.dataAttributions instanceof Array ? self.options.dataAttributions : [self.options.dataAttributions];
        }

        self.model = new AttributionModel();

    }

    register(map) {
        const self = this;
        const result = super.register.call(self, map);

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
                        const wlArr = obj.map.workLayers
                            .slice()
                            .reverse();
                        for (var i = 0; i < wlArr.length; i++) {
                            const wl = wlArr[i];
                            if (wl.url == obj.url && wl.getVisibility()) {
                                return false;
                            }
                        }

                        return true;
                    }

                    return true;
                };

                if (obj instanceof Layer ? checkRemoveData() : true) {
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
                                attr.name === toCheckName;
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
                                return layer.type === Consts.layerType.WMS || layer.type === Consts.layerType.WMTS;
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

        self.updateModel();

        map.loaded(function () {
            if (map.baseLayer.wrap.getAttribution) {
                addData(map.baseLayer.wrap);
                self.render();
                self.updateModel();
            }
        });

        map.on(Consts.event.LAYERADD, function (e) {
            const layer = e.layer;
            if (!layer.isBase && layer.wrap.getAttribution && layer.wrap.getAttribution()) {
                addData(layer.wrap);
                self.render();
            }
        });

        map.on(Consts.event.BEFOREBASELAYERCHANGE + " " + Consts.event.OVERVIEWBASELAYERCHANGE, function (e) {
            const type = e.type;
            const newLayer = e.newLayer;
            const oldLayer = e.oldLayer;
            if (Consts.event.OVERVIEWBASELAYERCHANGE.indexOf(type) > -1) {
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

        map.on(Consts.event.LAYERREMOVE, function (e) {
            const layer = e.layer;
            if (layer.wrap.getAttribution) {
                removeData(layer.wrap);
                self.render();
            }
        });

        map.on(Consts.event.TERRAINPROVIDERADD, function (e) {
            const terrainProvider = e.terrainProvider;
            if (terrainProvider.getAttribution) {
                addData(terrainProvider);
                self.render();
            }
        });

        map.on(Consts.event.TERRAINPROVIDERREMOVE, function (e) {
            const terrainProvider = e.terrainProvider;
            if (terrainProvider.getAttribution) {
                removeData(terrainProvider);
                self.render();
            }
        });

        map.on(Consts.event.LAYERVISIBILITY, function (e) {
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
    }

    async loadTemplates() {
        const self = this;
        const { default: template } = await import('../templates/tc-ctl-attrib.mjs');
        self.template = template;
    }

    async render(callback) {
        const self = this;

        await self.renderData({
            api: typeof self.apiAttribution === 'function' ? self.apiAttribution.apply(self) : self.getLocaleString(self.apiAttribution),
            mainData: self.mainDataAttribution,
            otherData: self.dataAttributions,
            isCollapsed: self.div.querySelector('.' + self.CLASS + '-other') ? self.div.querySelector('.' + self.CLASS + '-other').classList.contains(Consts.classes.COLLAPSED) : true,
            lang: self.map?.options.locale
        }, function () {
            //if(!self.controller)
            self.controller = new Controller(self.model, new AttributionView(self.div));

            self.addUIEventListeners();

            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    addUIEventListeners() {
        const self = this;
        const cmd = self.div.querySelector('.' + self.CLASS + '-cmd');
        cmd && cmd.addEventListener(Consts.event.CLICK, function () {
            self.toggleOtherAttributions();
        }, { passive: true });
    }

    toggleOtherAttributions() {
        const self = this;
        const other = self.div.querySelector('.' + self.CLASS + '-other');
        other.classList.toggle(Consts.classes.COLLAPSED);
    }

    updateModel() {
        const self = this;
        self.model.data = self.getLocaleString("data");
        self.model.attributionGithubTooltip = self.getLocaleString("attributionGithubTooltip");
        self.model.others = self.getLocaleString("others");
    }
    async changeLanguage() {
        const self = this;
        self.updateModel();
    }
}

Attribution.prototype.CLASS = 'tc-ctl-attrib';
TC.control.Attribution = Attribution;
export default Attribution;
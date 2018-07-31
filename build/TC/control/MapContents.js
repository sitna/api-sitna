TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.MapContents = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    self.layerTrees = {};
};

TC.inherit(TC.control.MapContents, TC.Control);

(function () {
    var ctlProto = TC.control.MapContents.prototype;

    ctlProto.CLASS = 'tc-ctl-mc';

    var _dataKeys = {
        layer: 'tcLayer',
        img: 'tcImg'
    };

    ctlProto.render = function (callback) {
        var self = this;
        if (self.map) {
            self.renderData(self.map.getLayerTree(), callback);
        }
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);
        self.render(function () {

            for (var i = 0, len = map.layers.length; i < len; i++) {
                self.updateLayerTree(map.layers[i]);
            }

            map.on(TC.Consts.event.ZOOM + ' ' + TC.Consts.event.PROJECTIONCHANGE, function () {
                self.updateScale();
            }).on(TC.Consts.event.UPDATEPARAMS, function (e) {
                var names = e.layer.names;
                var containsName = function containsName(node) {
                    var result = false;
                    if (node) {
                        if ($.inArray(node.name, names) >= 0) {
                            result = true;
                        }
                        else {
                            for (var i = 0; i < node.children.length; i++) {
                                if (containsName(node.children[i])) {
                                    result = true;
                                    break;
                                }
                            }
                        }
                    }
                    return result;
                };
                if (containsName(self.layerTrees[e.layer.id]) || names.length === 0) {
                    self.update();
                }
                else {
                    self.updateLayerTree(e.layer);
                }
            }).on(TC.Consts.event.LAYERVISIBILITY, function (e) {
                self.updateLayerVisibility(e.layer);
            }).on(TC.Consts.event.LAYERADD, function (e) {
                self.updateLayerTree(e.layer);
            }).on(TC.Consts.event.VECTORUPDATE + ' ' + TC.Consts.event.FEATUREADD + ' ' + TC.Consts.event.FEATURESADD, function (e) {
                // Se introduce un timeout porque pueden venir muchos eventos de este tipo seguidos y no tiene sentido actualizar con cada uno
                if (self._updateLayerTreeTimeout) {
                    clearTimeout(self._updateLayerTreeTimeout);
                }
                self._updateLayerTreeTimeout = setTimeout(function () {
                    if (self.map.workLayers.indexOf(e.layer) > -1) {
                        // GLS: Validamos si la capa que ha provocado el evento sigue en worklayers, si es borrada debido a la espera del timeout el TOC puede reflejar capas que ya no están
                        self.updateLayerTree(e.layer);
                        delete self._updateLayerTreeTimeout;
                    }
                }, 100);
            }).on(TC.Consts.event.LAYERREMOVE, function (e) {
                self.removeLayer(e.layer);
            }).on(TC.Consts.event.LAYERORDER, function (e) {
                self.updateLayerOrder(e.layer, e.oldIndex, e.newIndex);
            });
        });
    };

    ctlProto.updateScale = function () {
    };

    ctlProto.updateLayerVisibility = function (layer) {
    };

    ctlProto.updateLayerTree = function (layer) {
        this.layerTrees[layer.id] = layer.getTree();
    };

    ctlProto.updateLayerOrder = function (layer, oldIdx, newIdx) {
        var self = this;
        if (oldIdx >= 0 && oldIdx !== newIdx) {
            var $currentElm, $previousElm;
            var $elms = self.getLayerUIElements();
            for (var i = self.map.workLayers.length - 1; i >= 0; i--) {
                var l = self.map.workLayers[i];
                $previousElm = $currentElm;
                $elms.each(function (idx, elm) {
                    var $elm = $(elm);
                    if ($elm.data(_dataKeys.layer) === l) {
                        $currentElm = $elm;
                        return false;
                    }
                });
                if (l === layer) {
                    if ($previousElm) {
                        $previousElm.after($currentElm);
                    }
                    else {
                        $elms.parent().prepend($currentElm);
                    }
                    break;
                }
            }
        }
    };

    ctlProto.removeLayer = function (layer) {
        this.update();
    };

    ctlProto.getLayerUIElements = function () {
        var self = this;
        return self._$div.find('ul').first().children();
    };

    var isGetLegendGraphic = function (url) {
        return /[&?]REQUEST=getLegendGraphic/i.test(url);
    };

    /**
     * Carga y le da estilo a la imagen de la leyenda.
     * @param {string} requestMethod Si queremos pedir la imagen de la leyenda por POST, podemos especificarlo utilizando el parámetro requestMethod.
     */
    ctlProto.styleLegendImage = function ($img, layer) {
        if (!$img.attr('src')) {
            var imgSrc = $img.data(_dataKeys.img);

            var ERROR = 'error.tc';
            $img.off(ERROR).on(ERROR, function () {
                var imgSRC_protocol = $img.attr('src');
                // GLS: hemos modificado el protocolo?¿
                if (imgSRC_protocol.indexOf(layer.url) === -1) {
                    var protocolRegex = /^(https?:\/\/)/i;
                    if (protocolRegex.test(imgSRC_protocol) && protocolRegex.test(layer.url)) {
                        imgSRC_protocol = imgSRC_protocol.replace(imgSRC_protocol.match(protocolRegex)[1], layer.url.match(protocolRegex)[1]);
                    }
                }

                $img.off('error.tc');

                $img.attr('src', layer instanceof TC.layer.Raster ? layer.getByProxy_(imgSRC_protocol) : TC.proxify(imgSRC_protocol));
            }.bind(layer));

            if (layer && layer.options.method && layer.options.method === "POST") {
                layer.getLegendGraphicImage()
                .done(function (src) {
                    $img.attr('src', layer.getLegendUrl(src));
                })
                .fail(function (err) { TC.error(err); });
            } else {
                if (isGetLegendGraphic(imgSrc)) {
                    var $watch = $img.parent();
                    // A\u00f1adimos el par\u00e1metro que define el estilo de los textos en la imagen
                    var colorStr = $watch.css('color');
                    // Convertimos el color de formato rgb(r,g,b) a 0xRRGGBB
                    var openIdx = colorStr.indexOf('(');
                    var closeIdx = colorStr.indexOf(')');
                    if (openIdx >= 0 && closeIdx > openIdx) {
                        color = colorStr
                            .substr(0, closeIdx)
                            .substr(openIdx + 1)
                            .split(',');
                        colorStr = '0x';
                        for (var i = 0; i < 3; i++) {
                            var component = parseInt(color[i]).toString(16);
                            colorStr += component.length === 1 ? '0' + component : component;
                        }
                    }
                    else {
                        colorStr.replace('#', '0x');
                    }
                    imgSrc += '&LEGEND_OPTIONS=fontName:' + $watch.css('font-family') +
                        ';fontSize:' + parseInt($watch.css('font-size')) +
                        ';fontColor:' + colorStr +
                        ';fontAntiAliasing:true';
                    if (layer.params && layer.params.sld_body) {
                        imgSrc = TC.Util.addURLParameters(imgSrc, { sld_body: layer.params.sld_body });
                    }
                    $img.data(_dataKeys.img, layer.getLegendUrl(imgSrc));
                }
                $img.attr('src', layer.getLegendUrl(imgSrc));
            }
        }
    };

})();
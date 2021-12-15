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

    ctlProto.render = function (callback, options) {
        const self = this;
        return self._set1stRenderPromise(self.map ? self.renderData(options ? TC.Util.extend(self.map.getLayerTree(), options) : self.map.getLayerTree(), function () {
            self.addUIEventListeners();
            if (typeof callback === 'function') {
                callback();
            }
        }) : Promise.reject(Error('Cannot render: control has no map')));
    };

    ctlProto.register = function (map) {
        const self = this;
        return new Promise(function (resolve, reject) {
            Promise.all([TC.Control.prototype.register.call(self, map), self.renderPromise()]).then(function () {
                for (var i = 0, len = map.layers.length; i < len; i++) {
                    self.updateLayerTree(map.layers[i]);
                }

                map
                    .on(TC.Consts.event.ZOOM + ' ' + TC.Consts.event.PROJECTIONCHANGE, function () {
                        self.updateScale();
                    })
                    .on(TC.Consts.event.UPDATEPARAMS, function (e) {
                        const layer = e.layer;
                        var names = layer.names;
                        var containsName = function containsName(node) {
                            var result = false;
                            if (node) {
                                if (names.indexOf(node.name) >= 0) {
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
                        if (containsName(self.layerTrees[layer.id]) || names.length === 0) {
                            self.update();
                        }
                        else {
                            self.updateLayerTree(layer);
                        }
                    })
                    .on(TC.Consts.event.LAYERVISIBILITY, function (e) {
                        self.updateLayerVisibility(e.layer);
                    })
                    .on(TC.Consts.event.LAYERADD, function (e) {
                        self.updateLayerTree(e.layer);
                    })
                    .on(TC.Consts.event.VECTORUPDATE + ' ' + TC.Consts.event.FEATUREADD + ' ' + TC.Consts.event.FEATURESADD, function (e) {
                        const layer = e.layer;
                        // Se introduce un timeout porque pueden venir muchos eventos de este tipo seguidos y no tiene sentido actualizar con cada uno
                        self._updateLayerTreeTimeouts = self._updateLayerTreeTimeouts || {};
                        if (self._updateLayerTreeTimeouts[layer.id]) {
                            clearTimeout(self._updateLayerTreeTimeouts[layer.id]);
                        }
                        self._updateLayerTreeTimeouts[layer.id] = setTimeout(function () {
                            if (self.map.workLayers.indexOf(layer) > -1) {
                                // GLS: Validamos si la capa que ha provocado el evento sigue en worklayers, si es borrada debido a la espera del timeout el TOC puede reflejar capas que ya no están
                                self.updateLayerTree(layer);
                                delete self._updateLayerTreeTimeouts[layer.id];
                            }
                        }, 100);
                    })
                    .on(TC.Consts.event.LAYERREMOVE, function (e) {
                        self.removeLayer(e.layer);
                    })
                    .on(TC.Consts.event.LAYERORDER, function (e) {
                        self.updateLayerOrder(e.layer, e.oldIndex, e.newIndex);
                    })
                    .on(TC.Consts.event.LAYERERROR, function (e) {
                        self.onErrorLayer(e.layer);                                                    
                    });

                resolve(self);
            }).catch(function (err) {
                reject(err instanceof Error ? err : Error(err));
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

    ctlProto.updateLayerOrder = function (layer, oldIdx, newIdx, collection) {
        const self = this;
        if (oldIdx >= 0 && oldIdx !== newIdx) {
            var currentElm, previousElm;
            const elms = self.getLayerUIElements();

            collection = collection || self.map.workLayers;

            for (var i = collection.length - 1; i >= 0; i--) {
                const l = collection[i];
                previousElm = currentElm;
                for (var j = 0, jj = elms.length; j < jj; j++) {
                    const elm = elms[j];
                    if (elm.dataset.layerId === l.id) {
                        currentElm = elm;
                        break;
                    }
                }
                if (l === layer) {
                    if (currentElm) {
                        if (previousElm) {
                            previousElm.insertAdjacentElement('afterend', currentElm);
                        }
                        else {
                            currentElm.parentElement.firstChild.insertAdjacentElement('beforebegin', currentElm);
                        }
                    }
                    break;
                }
            }
        }
    };

    ctlProto.removeLayer = function (layer) {
        const self = this;
        const liCollection = self.getLayerUIElements();
        for (var i = 0, len = liCollection.length; i < len; i++) {
            const li = liCollection[i];
            if (li.dataset.layerId === layer.id) {
                li.parentElement.removeChild(li);
                break;
            }
        }
        if (self.getLayerUIElements().length === 0) {
            self.div.querySelector('.' + self.CLASS + '-empty').classList.remove(TC.Consts.classes.HIDDEN);
        }
    };

    ctlProto.onErrorLayer = function (layer) { };

    ctlProto.getLayerUIElements = function () {
        return this.div.querySelector('ul').children;
    };

    var isGetLegendGraphic = function (url) {
        return /[&?]REQUEST=getLegendGraphic/i.test(url);
    };

    /*
     * Carga y le da estilo a la imagen de la leyenda.
     * @param {string} requestMethod Si queremos pedir la imagen de la leyenda por POST, podemos especificarlo utilizando el parámetro requestMethod.
     */
    ctlProto.styleLegendImage = function (img, layer) {
        if (!img.getAttribute('src')) {
            var imgSrc = img.dataset.img;

            const toolProxification = new TC.tool.Proxification(TC.proxify);

            if (layer && layer.options.method && layer.options.method === "POST") {
                layer.getLegendGraphicImage()
                    .then(function (src) {
                        img.src = src; // ya se ha validado en getLegendGraphicImage
                    }).catch(function (err) {
                        TC.error(err);
                    });
            } else {
                if (isGetLegendGraphic(imgSrc)) {
                    const watch = img.parentElement;
                    // A\u00f1adimos el par\u00e1metro que define el estilo de los textos en la imagen
                    var colorStr = watch.style.color;
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
                    imgSrc += '&LEGEND_OPTIONS=fontName:' + watch.style.fontFamily +
                        ';fontSize:' + parseInt(watch.style.fontSize) +
                        ';fontColor:' + colorStr +
                        ';fontAntiAliasing:true';
                    if (layer.params && layer.params.sld_body) {
                        imgSrc = TC.Util.addURLParameters(imgSrc, { sld_body: layer.params.sld_body });
                    }

                    toolProxification.fetchImage(imgSrc).then(function (img) {
                        img.dataset.img = img.src;
                    }).catch(function (err) {
                        TC.error(err);
                    });
                }

                toolProxification.fetchImage(imgSrc).then(function (i) {
                    img.src = i.src;
                }).catch(function (err) {
                    if (err.status && (err.status === 404 || err.status === 401))
                        TC.error(TC.Util.getLocaleString(layer.map.options.locale, 'simbologyImgNotFound',
                            { url: imgSrc }));
                    else
                        TC.error(err);
                });                
            }
        }
    };

})();
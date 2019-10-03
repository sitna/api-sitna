TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/MapContents');
}

(function () {

    TC.control.BasemapSelector = function () {
        var self = this;
        //options = options || {};

        TC.control.MapContents.apply(self, arguments);

        self._cssClasses = {
            LOAD_CRS_BUTTON: self.CLASS + '-crs-btn-load',
            CRS_DIALOG: self.CLASS + '-crs-dialog',
            CRS_LIST: self.CLASS + '-crs-list',
            CURRENT_CRS_NAME: self.CLASS + '-cur-crs-name',
            CURRENT_CRS_CODE: self.CLASS + '-cur-crs-code'
        };

        self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
        if (window.$) {
            self._$dialogDiv = $(self._dialogDiv);
        }
        if (!self.options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }

        self._dialogDiv.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector('button:not(.tc-modal-close)', function (e) {

            if (e.target.classList.contains(self._cssClasses.LOAD_CRS_BUTTON)) {
                self.loadFallbackProjections();
                return;
            }

            TC.Util.closeModal();
            const btn = e.target;
            const crs = btn.dataset.crsCode;

            // dependerá del que esté activo
            const dialog = self._dialogDiv.querySelector('.' + self.CLASS + '-crs-dialog');
            dialog.classList.add(TC.Consts.classes.HIDDEN);

            const layer = self.getLayer(dialog.dataset.layerId);
            if (layer) {
                if (crs) {
                    TC.loadProjDef({
                        crs: crs,
                        callback: function () {
                            self.map.setProjection({
                                crs: crs,
                                baseLayer: layer
                            });
                        }
                    });
                }
                else {
                    const fallbackLayer = self.getFallbackLayer(btn.dataset.fallbackLayerId);
                    if (fallbackLayer) {
                        self.map.setBaseLayer(fallbackLayer);
                    }
                }
            }
        }));
    };

    TC.inherit(TC.control.BasemapSelector, TC.control.MapContents);

    var ctlProto = TC.control.BasemapSelector.prototype;

    ctlProto.CLASS = 'tc-ctl-bms';

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/BasemapSelector.html";
        ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/BasemapSelectorNode.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/BasemapSelectorDialog.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () {
            dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "backgroundMaps" }).w("</h2><div class=\"tc-ctl-bms-tree\"><form><ul class=\"tc-ctl-bms-branch\">").s(ctx.get(["baseLayers"], false), ctx, { "block": body_1 }, {}).s(ctx.get(["dialogMore"], false), ctx, { "block": body_2 }, {}).w("</ul></form></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-bms-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<li class=\"tc-ctl-bms-node\"><label class=\"tc-ctl-bms-more-node\" title=\"").h("i18n", ctx, {}, { "$key": "moreBackgroundMaps" }).w("\"><input type=\"radio\" name=\"bms\" value=\"moreLayers\"><span></span></label></li>"); } body_2.__dustBody = !0; return body_0
        };
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-bms-node\" data-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\" ><label").x(ctx.get(["legend"], false), ctx, { "block": body_1 }, {}).x(ctx.get(["thumbnail"], false), ctx, { "block": body_2 }, {}).w("><input type=\"radio\" name=\"bms\" value=\"").f(ctx.get(["name"], false), ctx, "h").w("\"").x(ctx.get(["mustReproject"], false), ctx, { "block": body_3 }, {}).w("><span>").f(ctx.get(["title"], false), ctx, "h").w("</span></label></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w(" style=\"background-image: url(").f(ctx.getPath(false, ["legend", "src"]), ctx, "h").w(")\""); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w(" style=\"background-image: url(").f(ctx.get(["thumbnail"], false), ctx, "h").w(")\""); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w(" class=\"tc-disabled\""); } body_3.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-bms-more-dialog tc-modal tc-hidden\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "backgroundMaps" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\"></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div><div class=\"tc-ctl-bms-crs-dialog tc-modal tc-hidden\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "baseLayerNotCompatible" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p>").h("i18n", ctx, {}, { "$key": "baseLayerNotCompatible.instructions|h" }).w("</p><ul class=\"tc-ctl-bms-crs-list tc-crs-list\"></ul></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    const getClosestParent = function (elm, selector) {
        while (elm && !elm.matches(selector)) {
            elm = elm.parentElement;
        }
        return elm;
    };

    const changeInputRadioBaseMap = function (e, callback) {
        const self = this;
        var flagToCallback = true;

        var radio = e.target;

        var layer = self.getLayer(getClosestParent(radio, 'li').dataset.layerId);

        if (self.options.dialogMore && getClosestParent(radio, '.' + self.CLASS + '-more-dialog')) {
            const radios = self.div.querySelectorAll('input[type=radio]');
            for (var i = 0, len = radios.length; i < len; i++) {
                const bmsLayer = self.getLayer(getClosestParent(radios[i], 'li').dataset.layerId);
                if (bmsLayer) {
                    switch (true) {
                        case bmsLayer.id === layer.id:
                            layer = bmsLayer;
                            break;
                    }
                }
            };
        }

        if (layer != self.map.getBaseLayer()) {
            if (layer.mustReproject) {

                if (self.map.on3DView) {
                    if (!layer.getFallbackLayer()) {
                        self._currentSelection.checked = true;
                        e.stopPropagation();
                        return;
                    } else if (layer.getFallbackLayer()) {
                        const fallbackLayer = layer.getFallbackLayer();
                        if (fallbackLayer) {
                            fallbackLayer._capabilitiesPromise.then(function () {
                                if (fallbackLayer.isCompatible(self.map.getCRS())) {
                                    self.map.setBaseLayer(layer);
                                }
                            });
                        }

                        flagToCallback = true;
                    }
                } else {
                    // provisonal
                    if (self._currentSelection) {
                        self._currentSelection.checked = true;
                    }

                    // Buscamos alternativa
                    const dialogOptions = {
                        layer: layer
                    };
                    const fallbackLayer = layer.getFallbackLayer();
                    if (fallbackLayer) {
                        fallbackLayer._capabilitiesPromise.then(function () {
                            if (fallbackLayer.isCompatible(self.map.getCRS())) {
                                dialogOptions.fallbackLayer = fallbackLayer;
                            }
                            self.showProjectionChangeDialog(dialogOptions);
                        });
                    }
                    else {
                        self.showProjectionChangeDialog(dialogOptions);
                    }
                    //layer.getCompatibleCRS({ normalized: true });
                    flagToCallback = false;
                }

            }
            else {

                if (layer.type === TC.Consts.layerType.WMS || layer.type === TC.Consts.layerType.WMTS && layer.getProjection() !== self.map.crs) {
                    layer.setProjection({ crs: self.map.crs });
                }

                self.map.setBaseLayer(layer);
            }
        }

        if (this._currentSelection) {
            this._currentSelection.checked = true;
        }


        if (callback) {
            callback(flagToCallback);
        }
    };

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.control.MapContents.prototype.register.call(self, map);

        if (self.options.dialogMore) {
            map.on(TC.Consts.event.VIEWCHANGE, function () {
                self._getMoreBaseLayers();
            });
        }

        map.on(TC.Consts.event.BASELAYERCHANGE + ' ' + TC.Consts.event.PROJECTIONCHANGE + ' ' + TC.Consts.event.VIEWCHANGE, function (e) {
            self.update(self.div, e.layer);
        });


        self.div.addEventListener('change', TC.EventTarget.listenerBySelector('input[type=radio]', function (e) {

            if (e.target.value === "moreLayers") {
                self.showMoreLayersDialog();
            } else {
                changeInputRadioBaseMap.call(self, e);
            }

            e.stopPropagation();
        }));

        return result;
    };

    ctlProto.render = function (callback) {
        const self = this;
        const result = TC.control.MapContents.prototype.render.call(self, callback, self.options);

        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;

            if (self.options.dialogMore) {
                const dialog = self._dialogDiv.querySelector('.' + self.CLASS + '-more-dialog');

                dialog.addEventListener('change', TC.EventTarget.listenerBySelector('input[type=radio]', function (e) {
                    changeInputRadioBaseMap.call(self, e, function (close) {
                        if (close) {
                            TC.Util.closeModal();
                        }
                    });

                    e.stopPropagation();
                }));
            }
        });

        return result;
    };

    ctlProto.update = function (div, baseLayer) {
        const self = this;

        div = div || self.div;

        div.querySelector('ul.' + self.CLASS + '-branch').querySelectorAll('li').forEach(function (li) {
            const layer = self.getLayer(li.dataset.layerId);
            if (layer) {
                const curBaseLayer = baseLayer || self.map.baseLayer;
                const radio = li.querySelector('input[type=radio]');
                const checked = curBaseLayer && (curBaseLayer === layer || curBaseLayer.id === layer.id ||
                    (layer.getFallbackLayer && (curBaseLayer === layer.getFallbackLayer() || (layer.getFallbackLayer() && curBaseLayer.id === layer.getFallbackLayer().id))));

                if (self.map.on3DView && layer.mustReproject && layer.fallbackLayer && layer.getFallbackLayer) {
                    layer.getFallbackLayer().getCapabilitiesPromise().then(function () {
                        var mustReproject = !layer.getFallbackLayer().isCompatible(self.map.getCRS());

                        radio.checked = checked;
                        if (mustReproject) {
                            radio.classList.add(TC.Consts.classes.DISABLED);
                            li.setAttribute('title', self.map.on3DView ? self.getLocaleString('notAvailableTo3D') : self.getLocaleString('reprojectionNeeded'));
                        }
                        else {
                            radio.classList.remove(TC.Consts.classes.DISABLED);
                            li.removeAttribute('title');
                        }
                    });
                } else {
                    radio.checked = checked;
                    if (layer.mustReproject) {
                        radio.classList.add(TC.Consts.classes.DISABLED);
                        li.setAttribute('title', self.map.on3DView ? self.getLocaleString('notAvailableTo3D') : self.getLocaleString('reprojectionNeeded'));
                    }
                    else {
                        radio.classList.remove(TC.Consts.classes.DISABLED);
                        li.removeAttribute('title');
                    }
                }

                if (checked) {
                    self._currentSelection = radio;
                }
            }
        });

        self.updateScale();
    };

    ctlProto.updateLayerTree = function (layer) {
        const self = this;        
        if (layer.isBase && !layer.options.stealth) {
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            var template = self.CLASS + '-node';
            TC.loadJSInOrder(
                !window.dust,
                TC.url.templating,
                function () {
                    dust.render(template, self.layerTrees[layer.id], function (err, out) {
                        const parser = new DOMParser();
                        const newLi = parser.parseFromString(out, 'text/html').body.firstChild;
                        var uid = newLi.dataset.layerUid;
                        const ul = self.div.querySelector('.' + self.CLASS + '-branch');
                        const currentLi = ul.querySelector('li[data-layer-uid="' + uid + '"]');
                        if (currentLi) {
                            currentLi.innerHTML = newLi.innerHTML;
                        }
                        else {
                            newLi.dataset.layerId = layer.id;

                            // Insertamos elemento en el lugar correcto, según indica la colección baseLayers
                            var idx = self.map.baseLayers.filter(function (baseLayer) {
                                // Buscamos capas que deban mostrarse o capas que están siendo fallbacks de capas que deben mostrarse
                                return !baseLayer.stealth;
                            }).map(function (baseLayer) {
                                return baseLayer.id;
                            }).indexOf(layer.id);

                            const lis = ul.querySelectorAll('li');
                            if (idx < 0 || idx >= lis.length) {
                                ul.appendChild(newLi);
                            }
                            else {
                                ul.insertBefore(newLi, lis[idx]);
                            }
                        }
                        if (err) {
                            TC.error(err);
                        }
                    });
                    self.update();
                }
            );
        }
    };

    ctlProto.updateLayerOrder = function (layer, oldIdx, newIdx) {
        // no hace nada
    };

    ctlProto.removeLayer = function (layer) {
        const self = this;
        if (layer.isBase) {
            const lis = self.div.querySelector('.' + self.CLASS + '-branch').querySelectorAll('li');
            for (var i = 0, len = lis.length; i < len; i++) {
                const li = lis[i];
                if (li.dataset.layerId === layer.id) {
                    li.parentElement.removeChild(li);
                    break;
                }
            }
        }
    };

    ctlProto.onErrorLayer = function (layer) {
        const self = this;

        if (layer.isBase && !layer.options.stealth) {
            self.map.toast(self.getLocaleString('baseLayerNotAvailable', { mapName: layer.title }), { type: TC.Consts.msgType.ERROR });
        }
    };

    ctlProto.getFallbackLayer = function (id) {
        const self = this;
        const filterFn = function (layer) {
            return layer.fallbackLayer && layer.fallbackLayer.id === id;
        };
        var result = self.map.baseLayers.filter(filterFn)[0].fallbackLayer;
        if (!result && self._moreBaseLayers) {
            result = self._moreBaseLayers.filter(filterFn)[0].fallbackLayer;
        }
        return result;
    };

    ctlProto.loadFallbackProjections = function () {
        const self = this;
        const lis = self._dialogDiv
            .querySelector('.' + self._cssClasses.CRS_DIALOG)
            .querySelectorAll('ul.' + self._cssClasses.CRS_LIST + ' li');
        lis.forEach(function (li) {
            li.classList.remove(TC.Consts.classes.HIDDEN);
            if (li.querySelector('button.' + self._cssClasses.LOAD_CRS_BUTTON)) {
                li.classList.add(TC.Consts.classes.HIDDEN);
            }
        });
    };

    ctlProto.showProjectionChangeDialog = function (options) {
        const self = this;
        options = options || {};
        const layer = options.layer;
        const dialog = self._dialogDiv.querySelector('.' + self.CLASS + '-crs-dialog');
        const modalBody = dialog.querySelector('.tc-modal-body');
        modalBody.classList.add(TC.Consts.classes.LOADING);
        const blCRSList = layer.getCompatibleCRS();

        dialog.classList.remove(TC.Consts.classes.HIDDEN);

        dialog.dataset.layerId = layer.id;
        const ul = dialog.querySelector('ul.' + self.CLASS + '-crs-list');
        ul.innerHTML = '';
        self.map.loadProjections({
            crsList: self.map.getCompatibleCRS({
                layers: self.map.workLayers.concat(layer),
                includeFallbacks: true
            }),
            orderBy: 'name'
        }).then(function (projList) {
            var hasFallbackCRS = false;
            const fragment = document.createDocumentFragment();
            projList
                .forEach(function (projObj) {
                    const li = document.createElement('li');
                    const button = document.createElement('button');

                    if (blCRSList.filter(function (crs) {
                        return TC.Util.CRSCodesEqual(crs, projObj.code)
                    }).length === 0) {
                        // Es un CRS del fallback
                        hasFallbackCRS = true;

                        button.innerHTML = projObj.name + ' (' + projObj.code + ')';
                        if (options.layer.fallbackLayer) {
                            button.dataset.fallbackLayerId = options.layer.fallbackLayer.id;
                        }
                        button.dataset.crsCode = projObj.code;
                        button.classList.add(TC.Consts.classes.WARNING);
                        li.classList.add(TC.Consts.classes.HIDDEN);
                    } else {
                        button.innerHTML = self.getLocaleString('changeMapToCrs', { crs: projObj.name + ' (' + projObj.code + ')' });
                        button.dataset.crsCode = projObj.code;
                    }

                    li.appendChild(button);
                    fragment.appendChild(li);
                });

            if (options.fallbackLayer) {
                const li = document.createElement('li');
                const button = document.createElement('button');
                button.innerHTML = self.getLocaleString('reprojectOnTheFly');
                button.dataset.fallbackLayerId = options.fallbackLayer.id;
                li.appendChild(button);
                fragment.appendChild(li);
            }

            if (hasFallbackCRS) {
                const li = document.createElement('li');
                const button = document.createElement('button');
                button.classList.add(self._cssClasses.LOAD_CRS_BUTTON);
                button.innerHTML = self.getLocaleString('showOnTheFlyProjections');
                li.appendChild(button);
                fragment.appendChild(li);
            }
            ul.appendChild(fragment);

            modalBody.classList.remove(TC.Consts.classes.LOADING);
        });
        dialog.querySelector('.' + self.CLASS + '-name').innerHTML = layer.title || layer.name;
        TC.Util.showModal(dialog);
    };

    ctlProto.showMoreLayersDialog = function () {
        const self = this;

        const dialog = self._dialogDiv.querySelector('.' + self.CLASS + '-more-dialog');

        dialog.classList.toggle(TC.Consts.classes.THREED, !!self.map.on3DView);

        const modalBody = dialog.querySelector('.tc-modal-body');
        modalBody.innerHTML = '';
        modalBody.classList.add(TC.Consts.classes.LOADING);
        dialog.classList.remove(TC.Consts.classes.HIDDEN);

        TC.Util.showModal(dialog, {
            closeCallback: function () {
                // no hay selección, vuelvo a seleccionar el mapa de fondo actual del mapa.
                this._currentSelection.checked = true;
                this.update();
            }.bind(self)
        });

        dialog.querySelector('.tc-modal-window').classList.add(self.CLASS + '-more-dialog');

        self._getMoreBaseLayers().then(function () {

            self.getRenderedHtml(self.CLASS, { baseLayers: self._moreBaseLayers }, function (html) {
                modalBody.innerHTML = html;
                modalBody.classList.remove(TC.Consts.classes.LOADING);
                modalBody.querySelectorAll('li').forEach(function (li, idx) {
                    li.dataset.layerId = self._moreBaseLayers[idx].id;
                });

                self.update(modalBody);
            });
        });
    };

    ctlProto.getLayer = function (id) {
        const self = this;
        return self.map && (self.map.getLayer(id) || (self._moreBaseLayers && self._moreBaseLayers.filter(function (layer) {
            return layer.id === id;
        })[0]));
    };

    const getTo3DVIew = function (baseLayer) {
        const self = this;

        return new Promise(function (resolve, reject) {
            Promise.all([
                baseLayer.getCapabilitiesPromise(),
                baseLayer.getFallbackLayer() ? baseLayer.getFallbackLayer().getCapabilitiesPromise() : Promise.resolve()
            ]).then(function () {
                resolve();
            });
        });
    };

    ctlProto._getMoreBaseLayers = function () {
        const self = this;

        if (!self._moreBaseLayers && !self._moreBaseLayersPromise) {

            self._moreBaseLayersPromise = new Promise(function (resolve, reject) {

                // GLS: Carlos no quiere que se muestren los respectivos dinámicos así que los filtro.
                var noDyn = TC.Cfg.availableBaseLayers.filter(function (l) {
                    return TC.Cfg.availableBaseLayers.filter(function (l) {
                        return l.fallbackLayer
                    }).map(function (l) {
                        return l.fallbackLayer
                    }).indexOf(l.id) == -1
                }).map(function (baseLayer) {
                    if (baseLayer.type === TC.Consts.layerType.WMS || baseLayer.type === TC.Consts.layerType.WMTS) {
                        return new TC.layer.Raster(baseLayer);
                    } else if (baseLayer.type == TC.Consts.layerType.VECTOR) {
                        return new TC.layer.Vector(baseLayer);
                    }
                });

                Promise.all(noDyn).then(function (baseLayers) {
                    self._moreBaseLayers = new Array(baseLayers.length);

                    var numToAdd = baseLayers.length;

                    const resolvePromise = function () {
                        self._moreBaseLayers = self._moreBaseLayers.filter(function (baseLayer) {
                            return baseLayer !== null;
                        });

                        resolve(self._moreBaseLayers);
                    };
                    const addLayer = function (i) {
                        const baseLayer = this;

                        baseLayer.map = self.map;
                        baseLayer.isBase = baseLayer.options.isBase = true;

                        if (baseLayer.type === TC.Consts.layerType.WMTS) {
                            var matrixSet = baseLayer.wrap.getCompatibleMatrixSets(self.map.getCRS())[0];
                            baseLayer.mustReproject = !matrixSet;
                        } else if (baseLayer.type === TC.Consts.layerType.WMS) {
                            baseLayer.mustReproject = !baseLayer.isCompatible(self.map.getCRS());
                        }

                        if (self.map.on3DView && baseLayer.mustReproject && baseLayer.getFallbackLayer && baseLayer.getFallbackLayer()) {
                            baseLayer.mustReproject = !baseLayer.getFallbackLayer().isCompatible(self.map.getCRS());
                        }

                        self._moreBaseLayers.splice(i, 1, baseLayer);
                        numToAdd--;

                        if (numToAdd === 0) {
                            resolvePromise();
                        }
                    };

                    baseLayers.forEach(function (baseLayer, i) {
                        if (baseLayer.type === TC.Consts.layerType.WMS || baseLayer.type === TC.Consts.layerType.WMTS) {
                            var promise = self.map.on3DView ? getTo3DVIew(baseLayer) : baseLayer.getCapabilitiesPromise();
                            promise.then(
                                addLayer.bind(baseLayer, i),
                                function (fail) {
                                    self._moreBaseLayers.splice(i, 1, null);
                                    numToAdd--;

                                    if (numToAdd === 0) {
                                        resolvePromise();
                                    }
                                });
                        } else {
                            addLayer.call(baseLayer, i);
                        }
                    });
                });
            });

        } else if (self._moreBaseLayers) {

            return new Promise(function (resolve, reject) {
                Promise.all(self._moreBaseLayers.filter(function (baseLayer) {
                    return baseLayer.type === TC.Consts.layerType.WMS || baseLayer.type === TC.Consts.layerType.WMTS;
                }).map(function (baseLayer) {
                    return self.map.on3DView ? getTo3DVIew(baseLayer) : baseLayer.getCapabilitiesPromise();
                })).then(function () {

                    self._moreBaseLayers = self._moreBaseLayers.map(function (baseLayer) {

                        if (baseLayer.type === TC.Consts.layerType.WMTS) {
                            var matrixSet = baseLayer.wrap.getCompatibleMatrixSets(self.map.getCRS())[0];
                            baseLayer.mustReproject = !matrixSet;
                        } else if (baseLayer.type === TC.Consts.layerType.WMS) {
                            baseLayer.mustReproject = !baseLayer.isCompatible(self.map.getCRS());
                        }
                        if (self.map.on3DView && baseLayer.mustReproject && baseLayer.getFallbackLayer && baseLayer.getFallbackLayer()) {
                            baseLayer.mustReproject = !baseLayer.getFallbackLayer().isCompatible(self.map.getCRS());

                            return baseLayer;
                        }

                        return baseLayer;
                    });

                    resolve(self._moreBaseLayers);
                });
            });
        }

        return self._moreBaseLayersPromise;
    };
})();

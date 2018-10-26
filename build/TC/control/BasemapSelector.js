TC.control = TC.control || {};

if (!TC.control.MapContents) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/MapContents');
}

(function () {

    TC.control.BasemapSelector = function () {
        var self = this;
        //options = options || {};

        TC.control.MapContents.apply(self, arguments);

        self._$dialogDiv = $(TC.Util.getDiv(self.options.dialogDiv));
        if (!self.options.dialogDiv) {
            self._$dialogDiv.appendTo('body');
        }

        self._$dialogDiv.on(TC.Consts.event.CLICK, 'button:not(.tc-modal-close)', function (e) {

            TC.Util.closeModal();
            const $btn = $(e.target);
            const crs = $btn.data(_dataKeys.PROJCODE);

            // dependerá del que esté activo
            const $dialog = self._$dialogDiv.find('.' + self.CLASS + '-crs-dialog');
            $dialog.addClass(TC.Consts.classes.HIDDEN);

            const layer = $dialog.data(_dataKeys.LAYER);
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
                    const fallbackLayer = $btn.data(_dataKeys.FALLBACK_LAYER);
                    if (fallbackLayer) {
                        self.map.setBaseLayer(layer);
                    }
                }
            }
        });
    };

    TC.inherit(TC.control.BasemapSelector, TC.control.MapContents);

    var ctlProto = TC.control.BasemapSelector.prototype;

    ctlProto.CLASS = 'tc-ctl-bms';

    var _dataKeys = {
        LAYER: 'tcLayer',
        FALLBACK_LAYER: 'tcFallbackLayer',
        PROJCODE: 'tcProjCode'
    };

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/BasemapSelector.html";
        ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/BasemapSelectorNode.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/BasemapSelectorDialog.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "backgroundMaps" }).w("</h2><div class=\"tc-ctl-bms-tree\"><form><ul class=\"tc-ctl-bms-branch\">").s(ctx.get(["baseLayers"], false), ctx, { "block": body_1 }, {}).s(ctx.get(["dialogMore"], false), ctx, { "block": body_2 }, {}).w("</ul></form></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.p("tc-ctl-bms-node", ctx, ctx.rebase(ctx.getPath(true, [])), {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<li class=\"tc-ctl-bms-node\"><label class=\"tc-ctl-bms-more-node\" title=\"").h("i18n", ctx, {}, { "$key": "moreBackgroundMaps" }).w("\"><input type=\"radio\" name=\"bms\" value=\"moreLayers\" /><span></span></label></li>"); } body_2.__dustBody = !0; return body_0
        };
        ctlProto.template[ctlProto.CLASS + '-node'] = function () { dust.register(ctlProto.CLASS + '-node', body_0); function body_0(chk, ctx) { return chk.w("<li class=\"tc-ctl-bms-node\" data-tc-layer-name=\"").f(ctx.get(["name"], false), ctx, "h").w("\" data-tc-layer-uid=\"").f(ctx.get(["uid"], false), ctx, "h").w("\" ><label").x(ctx.get(["legend"], false), ctx, { "block": body_1 }, {}).x(ctx.get(["thumbnail"], false), ctx, { "block": body_2 }, {}).w("><input type=\"radio\" name=\"bms\" value=\"").f(ctx.get(["name"], false), ctx, "h").w("\"").x(ctx.get(["mustReproject"], false), ctx, { "block": body_3 }, {}).w(" /><span>").f(ctx.get(["title"], false), ctx, "h").w("</span></label></li>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w(" style=\"background-image: url(").f(ctx.getPath(false, ["legend", "src"]), ctx, "h").w(")\""); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w(" style=\"background-image: url(").f(ctx.get(["thumbnail"], false), ctx, "h").w(")\""); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w(" class=\"tc-disabled\""); } body_3.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-bms-more-dialog tc-modal tc-hidden\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "backgroundMaps" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div><div class=\"tc-ctl-bms-crs-dialog tc-modal tc-hidden\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "baseLayerNotCompatible" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p>").h("i18n", ctx, {}, { "$key": "baseLayerNotCompatible.instructions|h" }).w("</p><ul class=\"tc-ctl-bms-crs-list tc-crs-list\"></ul></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    const changeInputRadioBaseMap = function (e, callback) {
        const self = this;
        var flagToCallback = true;

        var $radio = $(e.target);

        var layer = $radio.closest('li').data(_dataKeys.LAYER);

        if (self.options.dialogMore && $radio.closest('.' + self.CLASS + '-more-dialog').length > 0) {
            self._$div.find('input[type=radio]').each(function (index, input) {
                var bmsLayer = $(input).closest('li').data(_dataKeys.LAYER);
                if (bmsLayer) {
                    switch (true) {
                        case bmsLayer.id === layer.id:
                            layer = bmsLayer;
                            $radio = $(input);
                            return false;
                    }
                }
            });
        }

        if (layer != self.map.getBaseLayer()) {
            if (layer.mustReproject) {

                if (self.map.on3DView) {
                    if (!layer.getFallbackLayer()) {
                        self._$currentSelection.prop('checked', true);
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
                    if (self._$currentSelection) {
                        self._$currentSelection.prop('checked', true);
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
                }

                flagToCallback = false;
            }
            else {

                if (layer.type === TC.Consts.layerType.WMS || layer.type === TC.Consts.layerType.WMTS && layer.getProjection() !== self.map.crs) {
                    layer.setProjection({ crs: self.map.crs });
                }

                self.map.setBaseLayer(layer);
            }
        }

        if (this._$currentSelection) {
            this._$currentSelection.prop('checked', true);
        }


        if (callback) {
            callback(flagToCallback);
        }
    };

    const moveElement = function (array, from, to) {
        array.splice(to, 0, array.splice(from, 1)[0]);
    };

    const limitElements = function () {
        const self = this;

        // mantenemos el número de elementos configurados y reordenamos la propiedad baseLayers del mapa.
        if (self.options.dialogMore) {
            const $ul = self._$div.find('.' + self.CLASS + '-branch');
            const $lis = $ul.find('li');

            var numElements = self.options.dialogMore.max - 1;
            if ($lis.length > numElements) {
                $lis.slice(numElements, $lis.length - 1).addClass(TC.Consts.classes.HIDDEN);
            }

            $lis.each(function (i, li) {
                var layer = $(li).data(_dataKeys.LAYER);
                if (layer) {
                    if (self.map.baseLayers[i].id !== layer.id) {
                        moveElement(self.map.baseLayers, self.map.baseLayers.indexOf(layer), i);
                    }
                }
            });
        }
    };

    ctlProto.register = function (map) {
        var self = this;

        TC.control.MapContents.prototype.register.call(self, map);

        if (self.options.dialogMore) {
            map.on(TC.Consts.event.VIEWCHANGE, function () {
                self._getMoreBaseLayers();
            });
        }

        map.on(TC.Consts.event.BASELAYERCHANGE + ' ' + TC.Consts.event.PROJECTIONCHANGE + ' ' + TC.Consts.event.VIEWCHANGE, function (e) {
            self.update(self._$div, e.layer);
        });


        self._$div.on('change', 'input[type=radio]', function (e) {
            const self = this;

            var $radio = $(e.target);

            if ($radio.val() == "moreLayers") {
                self.showMoreLayersDialog();
            } else {
                changeInputRadioBaseMap.call(self, e);
            }

            e.stopPropagation();
        }.bind(self));
    };

    ctlProto.render = function (callback) {
        var self = this;
        TC.control.MapContents.prototype.render.call(self, callback, self.options);

        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv.html(html);

            if (self.options.dialogMore) {
                const $dialog = self._$dialogDiv.find('.' + self.CLASS + '-more-dialog');

                $dialog.on('change', 'input[type=radio]', function (e) {
                    const self = this;

                    changeInputRadioBaseMap.call(self, e, function (close) {
                        if (close) {
                            TC.Util.closeModal();
                        }
                    });

                    e.stopPropagation();

                }.bind(self));
            }
        });
    };

    ctlProto.update = function ($div, baseLayer) {
        var self = this;

        $div = $div || self._$div;

        $div.find('ul.' + self.CLASS + '-branch').children('li').each(function (idx, elm) {
            var $li = $(elm);
            var layer = $li.data(_dataKeys.LAYER);
            if (layer) {
                var curBaseLayer = baseLayer || self.map.baseLayer;
                var $radio = $li.find('input[type=radio]').first();
                var checked = curBaseLayer && (curBaseLayer === layer || curBaseLayer.id === layer.id || (layer.getFallbackLayer && (curBaseLayer === layer.getFallbackLayer() || (layer.getFallbackLayer() && curBaseLayer.id === layer.getFallbackLayer().id))));

                if (self.map.on3DView && layer.mustReproject && layer.fallbackLayer && layer.getFallbackLayer) {
                    layer.getFallbackLayer().getCapabilitiesPromise().then(function () {
                        var mustReproject = !layer.getFallbackLayer().isCompatible(self.map.getCRS());

                        $radio
                            .prop('checked', checked)
                            .toggleClass(TC.Consts.classes.DISABLED, mustReproject || false);
                        $li.attr('title', mustReproject ? self.map.on3DView ? self.getLocaleString('notAvailableTo3D') : self.getLocaleString('reprojectionNeeded') : null);
                    });
                } else {
                    $radio
                        .prop('checked', checked)
                        .toggleClass(TC.Consts.classes.DISABLED, layer.mustReproject || false);
                    $li.attr('title', layer.mustReproject ? self.map.on3DView ? self.getLocaleString('notAvailableTo3D') : self.getLocaleString('reprojectionNeeded') : null);
                }

                if (checked) {
                    self._$currentSelection = $radio;
                }
            }
        });

        self.updateScale();
    };

    ctlProto.updateLayerTree = function (layer) {
        var self = this;
        if (layer.isBase && !layer.options.stealth) {
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            var template = self.CLASS + '-node';
            TC.loadJSInOrder(
                !window.dust,
                TC.url.templating,
                function () {
                    dust.render(template, self.layerTrees[layer.id], function (err, out) {
                        var $newLi = $(out);
                        var uid = $newLi.data('tcLayerUid');
                        var $ul = self._$div.find('.' + self.CLASS + '-branch');
                        var $li = $ul.find('li[data-tc-layer-uid="' + uid + '"]');
                        if ($li.length === 1) {
                            $li.html($newLi.html());
                        }
                        else {
                            $newLi.data(_dataKeys.LAYER, layer);

                            // Insertamos elemento en el lugar correcto, según indica la colección baseLayers
                            var idx = self.map.baseLayers.filter(function (baseLayer) {
                                return !baseLayer.stealth;
                            }).map(function (baseLayer) {
                                return baseLayer.id;
                            }).indexOf(layer.id);

                            if (idx < 0) {
                                $ul.append($newLi);
                            }
                            else {
                                const $lis = $ul.find('li');
                                if (idx >= $lis.length) {
                                    $ul.append($newLi);
                                }
                                else {
                                    $newLi.insertBefore($ul.find('li').get(idx));
                                }
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
        var self = this;
        if (layer.isBase) {
            var $lis = self._$div.find('.' + self.CLASS + '-branch').children('li');
            $lis.each(function (idx, elm) {
                var $li = $(elm);
                if ($li.data(_dataKeys.LAYER) === layer) {
                    $li.remove();
                    return false;
                }
            });
        }
    };

    ctlProto.showProjectionChangeDialog = function (options) {
        const self = this;
        options = options || {};
        const layer = options.layer;
        const $dialog = self._$dialogDiv.find('.' + self.CLASS + '-crs-dialog');
        const $modalBody = $dialog.find('.tc-modal-body').addClass(TC.Consts.classes.LOADING);

        $dialog.removeClass(TC.Consts.classes.HIDDEN);

        $dialog.data(_dataKeys.LAYER, layer);
        const $ul = $dialog
            .find('ul.' + self.CLASS + '-crs-list')
            .empty();
        self.map.loadProjections({
            crsList: self.map.getCompatibleCRS({
                layers: self.map.workLayers.concat(layer)
            }),
            orderBy: 'name'
        }).then(function (projList) {
            projList
                .forEach(function (projObj) {
                    $ul
                        .append($('<li>')
                            .append($('<button>')
                                .html(self.getLocaleString('changeMapToCrs', { crs: projObj.name + ' (' + projObj.code + ')' }))
                                .data(_dataKeys.PROJCODE, projObj.code)));
                });

            if (options.fallbackLayer) {
                $ul
                    .append($('<li>')
                        .append($('<button>')
                            .html(self.getLocaleString('reprojectOnTheFly'))
                            .data(_dataKeys.FALLBACK_LAYER, options.fallbackLayer)));
            }

            $modalBody.removeClass(TC.Consts.classes.LOADING);
        });
        $dialog.find('.' + self.CLASS + '-name').html(layer.title || layer.name);
        TC.Util.showModal($dialog);
    };

    ctlProto.showMoreLayersDialog = function () {
        const self = this;

        const $dialog = self._$dialogDiv.find('.' + self.CLASS + '-more-dialog');

        if (self.map.on3DView) {
            $dialog.addClass(TC.Consts.classes.THREED);
        } else if ($dialog.hasClass(TC.Consts.classes.THREED)) {
            $dialog.removeClass(TC.Consts.classes.THREED);
        }

        $dialog.find('.tc-modal-body').empty();

        const $modalBody = $dialog.find('.tc-modal-body').addClass(TC.Consts.classes.LOADING);
        $dialog.removeClass(TC.Consts.classes.HIDDEN);

        TC.Util.showModal($dialog, {
            closeCallback: function () {
                // no hay selección, vuelvo a seleccionar el mapa de fondo actual del mapa.
                this._$currentSelection.prop('checked', true);
                this.update();
            }.bind(self)
        });

        if (!$dialog.find('.tc-modal-window').hasClass(self.CLASS + '-more-dialog')) {
            $dialog.find('.tc-modal-window').addClass(self.CLASS + '-more-dialog');
        }

        self._getMoreBaseLayers().then(function () {

            self.getRenderedHtml(self.CLASS, { baseLayers: self._moreBaseLayers }, function (html) {
                $modalBody.html(html);
                $modalBody.removeClass(TC.Consts.classes.LOADING);
                $modalBody.find('li').each(function (i, li) {
                    $(li).data(_dataKeys.LAYER, self._moreBaseLayers[i]);
                });

                self.update($modalBody);
            });
        });
    };

    const getTo3DVIew = function (baseLayer) {
        const self = this;

        var promise = new $.Deferred;
        var fallbackPromise = new $.Deferred;

        $.when.apply(this, [baseLayer.getCapabilitiesPromise(), baseLayer.getFallbackLayer() ? baseLayer.getFallbackLayer().getCapabilitiesPromise() : fallbackPromise.resolve()]).then(function () {
            promise.resolve();
        });

        return promise;
    };

    ctlProto._getMoreBaseLayers = function () {
        const self = this;

        if (!self._moreBaseLayers && !self._moreBaseLayersPromise) {

            self._moreBaseLayersPromise = new $.Deferred;

            // GLS: Carlos no quiere que se muestren los respectivos dinámicos así que los filtro.
            var noDyn = TC.Cfg.availableBaseLayers.filter(function (l) {
                return TC.Cfg.availableBaseLayers.filter(function (l) {
                    return l.fallbackLayer
                }).map(function (l) {
                    return l.fallbackLayer
                }).indexOf(l.id) == -1
            });

            $.when.apply(this, noDyn.map(function (baseLayer) {
                if (baseLayer.type === TC.Consts.layerType.WMS || baseLayer.type === TC.Consts.layerType.WMTS) {
                    return new TC.layer.Raster(baseLayer);
                } else if (baseLayer.type == TC.Consts.layerType.VECTOR) {
                    return new TC.layer.Vector(baseLayer);
                }
            })).then(function () {

                var baseLayers = Array.prototype.slice.call(arguments);

                $.when.apply(this, baseLayers.filter(function (baseLayer) {
                    return baseLayer.type === TC.Consts.layerType.WMS || baseLayer.type === TC.Consts.layerType.WMTS;
                }).map(function (baseLayer) {
                    return self.map.on3DView ? getTo3DVIew(baseLayer) : baseLayer.getCapabilitiesPromise();
                })).then(function () {

                    self._moreBaseLayers = baseLayers.map(function (baseLayer) {
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

                            return baseLayer;
                        }

                        return baseLayer;
                    });

                    self._moreBaseLayersPromise.resolve(self._moreBaseLayers);
                });
            });

        } else if (self._moreBaseLayers) {

            $.when.apply(this, self._moreBaseLayers.filter(function (baseLayer) {
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
            });

            self._moreBaseLayersPromise.resolve(self._moreBaseLayers);
        }

        return self._moreBaseLayersPromise.promise();
    };
})();

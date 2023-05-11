import TC from '../../TC';
import Consts from '../Consts';
import MapContents from './MapContents';

TC.control = TC.control || {};
TC.control.MapContents = MapContents;

(function () {

    TC.control.BasemapSelector = function () {
        var self = this;
        //options = options || {};

        TC.control.MapContents.apply(self, arguments);

        self.layerInfos = {};

        self._cssClasses = {
            LOAD_CRS_BUTTON: self.CLASS + '-crs-btn-load',
            CRS_DIALOG: self.CLASS + '-crs-dialog',
            CRS_LIST: self.CLASS + '-crs-list',
            VIEW_BTN: self.CLASS + '-btn-view',
            CURRENT_CRS_NAME: self.CLASS + '-cur-crs-name',
            CURRENT_CRS_CODE: self.CLASS + '-cur-crs-code',
            TREE: self.CLASS + '-tree',
            DETAILS: 'tc-details',
            GRID: 'tc-grid'
        };

        self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
        if (window.$) {
            self._$dialogDiv = $(self._dialogDiv);
        }
        if (!self.options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }

        self._dialogDiv.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('button:not(.tc-modal-close)', function (e) {

            if (e.target.classList.contains(self._cssClasses.LOAD_CRS_BUTTON)) {
                self.loadFallbackProjections();
                return;
            }

            TC.Util.closeModal();
            const btn = e.target;
            const crs = btn.dataset.crsCode;

            // dependerá del que esté activo
            const dialog = self._dialogDiv.querySelector('.' + self.CLASS + '-crs-dialog');
            dialog.classList.add(Consts.classes.HIDDEN);

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
        }), { passive: true });
    };

    TC.inherit(TC.control.BasemapSelector, TC.control.MapContents);

    var ctlProto = TC.control.BasemapSelector.prototype;

    ctlProto.CLASS = 'tc-ctl-bms';

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
            }
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
                            fallbackLayer.getCapabilitiesPromise().then(function () {
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
                        fallbackLayer.getCapabilitiesPromise().then(function () {
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

                if (layer.type === Consts.layerType.WMS || layer.type === Consts.layerType.WMTS && layer.getProjection() !== self.map.crs) {
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

    ctlProto.register = async function (map) {
        const self = this;

        const ctl = await TC.control.MapContents.prototype.register.call(self, map);
        self.div.querySelector(`.${self._cssClasses.VIEW_BTN}`).addEventListener(Consts.event.CLICK, function (e) {
            self.toggleView();
            e.target.blur();
        }, { passive: true });

        if (self.options.dialogMore) {
            map.on(Consts.event.VIEWCHANGE, function () {
                self._getMoreBaseLayers();
            });
        }

        map.on(Consts.event.BASELAYERCHANGE + ' ' + Consts.event.PROJECTIONCHANGE + ' ' + Consts.event.VIEWCHANGE, function (e) {
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

        return ctl;
    };

    ctlProto.loadTemplates = async function () {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-bms.mjs');
        const nodeTemplatePromise = import('../templates/tc-ctl-bms-node.mjs');
        const dialogTemplatePromise = import('../templates/tc-ctl-bms-dialog.mjs');

        const template = {};
        template[ctlProto.CLASS] = (await mainTemplatePromise).default;
        template[ctlProto.CLASS + '-node'] = (await nodeTemplatePromise).default;
        template[ctlProto.CLASS + '-dialog'] = (await dialogTemplatePromise).default;
        self.template = template;
    };

    ctlProto.render = function (callback) {
        const self = this;
        const result = TC.control.MapContents.prototype.render.call(self, callback, TC.Util.extend({}, self.options, { controlId: self.id }));

        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;

            if (self.options.dialogMore) {
                const dialog = self._dialogDiv.querySelector('.' + self.CLASS + '-more-dialog');

                dialog.querySelector(`.${self._cssClasses.VIEW_BTN}`).addEventListener(Consts.event.CLICK, function (e) {
                    self.toggleMoreLayersDialogView();
                    e.target.blur();
                    e.stopPropagation();
                }, { passive: true });

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

    ctlProto.update = async function (div, baseLayer) {
        const self = this;

        div = div || self.div;

        await (self._moreBaseLayersPromise || self._getMoreBaseLayers());
        Array.from(div.querySelectorAll(`ul.${self.CLASS}-branch li`)).forEach(function (li, _idx, arr) {
            const layer = self.getLayer(li.dataset.layerId);
            if (layer) {
                const curBaseLayer = baseLayer || self.map.baseLayer;
                const radio = li.querySelector('input[type=radio]');
                const fbLayer = layer.getFallbackLayer && layer.getFallbackLayer();
                let checked = curBaseLayer && (curBaseLayer === layer || curBaseLayer.id === layer.id);
                if (!checked) {
                    const otherLayerIsFallback = fbLayer && arr
                        .filter(elm => elm !== li)
                        .some(elm => elm.dataset.layerId === fbLayer.id);
                    checked = !otherLayerIsFallback && curBaseLayer && (curBaseLayer === fbLayer || fbLayer && curBaseLayer.id === fbLayer.id);
                }

                if (self.map.on3DView && layer.mustReproject && fbLayer) {
                    fbLayer.getCapabilitiesPromise().then(function () {
                        var mustReproject = !layer.getFallbackLayer().isCompatible(self.map.getCRS());

                        radio.checked = checked;
                        if (mustReproject) {
                            radio.classList.add(Consts.classes.DISABLED);
                            li.setAttribute('title', self.map.on3DView ? self.getLocaleString('notAvailableTo3D') : self.getLocaleString('reprojectionNeeded'));
                        }
                        else {
                            radio.classList.remove(Consts.classes.DISABLED);
                            li.removeAttribute('title');
                        }
                    });
                } else {
                    radio.checked = checked;
                    if (layer.mustReproject) {
                        radio.classList.add(Consts.classes.DISABLED);
                        li.setAttribute('title', self.map.on3DView ? self.getLocaleString('notAvailableTo3D') : self.getLocaleString('reprojectionNeeded'));
                    }
                    else {
                        radio.classList.remove(Consts.classes.DISABLED);
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
        // Actuamos cuando la capa es base y es visible en tablas de contenidos o es hija de una visible
        if (layer.isBase && (!layer.options.stealth || layer.firstOption && !layer.firstOption.options.stealth)) {
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            const displayLayer = layer.firstOption || layer;

            if (displayLayer !== layer) {
                self.layerTrees[displayLayer.id] = displayLayer.getTree();
            }

            if (displayLayer.getInfo) {
                self.layerInfos[displayLayer.id] = displayLayer.getInfo(displayLayer.names[0]);
            }

            self.getRenderedHtml(self.CLASS + '-node', { layer: self.layerTrees[displayLayer.id], info: self.layerInfos[displayLayer.id], controlId: self.id }).then(function (out) {
                const parser = new DOMParser();
                const newLi = parser.parseFromString(out, 'text/html').body.firstChild;
                var uid = newLi.dataset.layerUid;
                const ul = self.div.querySelector('.' + self.CLASS + '-branch');
                const currentLi = ul.querySelector('li[data-layer-uid="' + uid + '"]');
                if (currentLi) {
                    currentLi.innerHTML = newLi.innerHTML;
                }
                else {
                    newLi.dataset.layerId = displayLayer.id;

                    // Insertamos elemento en el lugar correcto, según indica la colección baseLayers
                    const setLayerIds = self.map.baseLayers
                        .map(baseLayer => baseLayer.firstOption || baseLayer)
                        .filter(baseLayer => baseLayer && !baseLayer.stealth) // Buscamos capas que deban mostrarse
                        .map(baseLayer => baseLayer.id);
                    const idx = setLayerIds.indexOf(displayLayer.id);
                    let inserted = false;
                    let i;
                    for (i = idx - 1; i >= 0; i--) {
                        const curLi = ul.querySelector(`li[data-layer-id="${setLayerIds[i]}"]`);
                        if (curLi) {
                            curLi.insertAdjacentElement('afterend', newLi);
                            inserted = true;
                            break;
                        }
                    }
                    if (!inserted) {
                        for (i = idx + 1; i < setLayerIds.length; i++) {
                            const curLi = ul.querySelector(`li[data-layer-id="${setLayerIds[i]}"]`);
                            if (curLi) {
                                curLi.insertAdjacentElement('beforebegin', newLi);
                                inserted = true;
                                break;
                            }
                        }
                        if (!inserted) {
                            const moreLabel = ul.querySelector(`.${self.CLASS}-more-node`);
                            if (moreLabel) {
                                moreLabel.parentElement.insertAdjacentElement('beforebegin', newLi);
                            }
                            else {
                                ul.appendChild(newLi);
                            }
                        }
                    }
                    self.update();
                }
            }).catch(function (err) {
                TC.error(err);
            });
        }
    };

    ctlProto.updateLayerOrder = function (_layer, _oldIdx, _newIdx) {
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
            self.map.toast(self.getLocaleString('baseLayerNotAvailable', { mapName: layer.title }), { type: Consts.msgType.ERROR });
        }
    };

    ctlProto.getFallbackLayer = function (id) {
        const self = this;
        const filterFn = function (layer) {
            return layer.fallbackLayer && layer.fallbackLayer.id === id;
        };
        let baseLayersWithFallback = self.map.baseLayers.filter(filterFn);
        let result = baseLayersWithFallback.length ? baseLayersWithFallback[0].fallbackLayer : null;
        if (!result && self._moreBaseLayers) {
            baseLayersWithFallback = self._moreBaseLayers.filter(filterFn);
            result = baseLayersWithFallback.length ? baseLayersWithFallback[0].fallbackLayer : null;
        }
        return result;
    };

    ctlProto.loadFallbackProjections = function () {
        const self = this;
        const lis = self._dialogDiv
            .querySelector('.' + self._cssClasses.CRS_DIALOG)
            .querySelectorAll('ul.' + self._cssClasses.CRS_LIST + ' li');
        lis.forEach(function (li) {
            li.classList.remove(Consts.classes.HIDDEN);
            if (li.querySelector('button.' + self._cssClasses.LOAD_CRS_BUTTON)) {
                li.classList.add(Consts.classes.HIDDEN);
            }
        });
    };

    ctlProto.showProjectionChangeDialog = function (options) {
        const self = this;
        options = options || {};
        const layer = options.layer;
        const dialog = self._dialogDiv.querySelector('.' + self.CLASS + '-crs-dialog');
        const modalBody = dialog.querySelector('.tc-modal-body');
        modalBody.classList.add(Consts.classes.LOADING);
        const blCRSList = layer.getCompatibleCRS();

        dialog.classList.remove(Consts.classes.HIDDEN);

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
                    button.setAttribute('type', 'button');

                    if (blCRSList.filter(function (crs) {
                        return TC.Util.CRSCodesEqual(crs, projObj.code);
                    }).length === 0) {
                        // Es un CRS del fallback
                        hasFallbackCRS = true;

                        button.innerHTML = projObj.name + ' (' + projObj.code + ')';
                        if (options.layer.fallbackLayer) {
                            button.dataset.fallbackLayerId = options.layer.fallbackLayer.id;
                        }
                        button.dataset.crsCode = projObj.code;
                        button.classList.add(Consts.classes.WARNING);
                        li.classList.add(Consts.classes.HIDDEN);
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
                button.setAttribute('type', 'button');
                button.innerHTML = self.getLocaleString('reprojectOnTheFly');
                button.dataset.fallbackLayerId = options.fallbackLayer.id;
                li.appendChild(button);
                fragment.appendChild(li);
            }

            if (hasFallbackCRS) {
                const li = document.createElement('li');
                const button = document.createElement('button');
                button.setAttribute('type', 'button');
                button.classList.add(self._cssClasses.LOAD_CRS_BUTTON);
                button.innerHTML = self.getLocaleString('showOnTheFlyProjections');
                li.appendChild(button);
                fragment.appendChild(li);
            }
            ul.appendChild(fragment);

            modalBody.classList.remove(Consts.classes.LOADING);
        });
        dialog.querySelector('.' + self.CLASS + '-name').innerHTML = layer.title || layer.name;
        TC.Util.showModal(dialog);
    };

    ctlProto.showMoreLayersDialog = function () {
        const self = this;

        const dialog = self._dialogDiv.querySelector('.' + self.CLASS + '-more-dialog');

        dialog.classList.toggle(Consts.classes.THREED, !!self.map.on3DView);

        const modalBody = dialog.querySelector('.tc-modal-body');
        modalBody.innerHTML = '';
        modalBody.classList.add(Consts.classes.LOADING);
        dialog.classList.remove(Consts.classes.HIDDEN);

        TC.Util.showModal(dialog, {
            closeCallback: function () {
                // no hay selección, vuelvo a seleccionar el mapa de fondo actual del mapa.
                this.update().then(() => this._currentSelection.checked = true);
            }.bind(self)
        });

        const parentTree = self.div.querySelector(`.${self._cssClasses.TREE}`);
        const isGrid = parentTree.classList.contains(self._cssClasses.GRID);
        const button = dialog.querySelector(`.${self._cssClasses.VIEW_BTN}`);
        button.classList.toggle(self._cssClasses.DETAILS, isGrid);
        button.classList.toggle(self._cssClasses.GRID, !isGrid);
        button.setAttribute('title', self.getLocaleString(isGrid ? 'showDetailsView' : 'showGridView'));

        const processLayer = bl => {
            if (bl) {
                const info = bl.getInfo ? bl.getInfo(bl.names[0]) : null;
                return { layer: bl, info: info, controlId: self.id };
            }
            return {};
        };
        const renderBody = function () {
            const isGrid = dialog.querySelector(`.${self._cssClasses.VIEW_BTN}`).classList.contains(self._cssClasses.DETAILS);
            const moreBaseLayers = self._moreBaseLayers.slice();
            for (var i = 0, ii = moreBaseLayers.length; i < ii; i++) {
                if (!moreBaseLayers[i]) {
                    moreBaseLayers[i] = false;
                }
            }
            self.getRenderedHtml(self.CLASS, {
                baseLayers: moreBaseLayers.map(processLayer),
                controlId: self.id
            }, function (html) {
                modalBody.innerHTML = html;
                const tree = modalBody.querySelector(`.${self._cssClasses.TREE}`);
                tree.classList.toggle(self._cssClasses.DETAILS, !isGrid);
                tree.classList.toggle(self._cssClasses.GRID, isGrid);
                modalBody.classList.remove(Consts.classes.LOADING);

                self.update(modalBody);
            });
        };
        self._getMoreBaseLayers(function (layerIdx) {
            if (modalBody.classList.contains(Consts.classes.LOADING)) {
                renderBody();
            }
            else {
                const li = modalBody.querySelector(`li.${self.CLASS}-node:nth-child(${layerIdx + 1})`);
                const bl = self._moreBaseLayers[layerIdx];
                if (bl) {
                    self.getRenderedHtml(self.CLASS + '-node', processLayer(bl), function (html) {
                        li.insertAdjacentHTML('beforebegin', html);
                        li.remove();
                        self.update(modalBody);
                    });
                }
            }
        }).then(function () {
            renderBody();
        });
    };

    const toggleUI = function (ctl, container) {
        const tree = container.querySelector(`.${ctl._cssClasses.TREE}`);
        if (tree) {
            const btn = container.querySelector(`.${ctl._cssClasses.VIEW_BTN}`);
            const isGrid = btn.classList.toggle(ctl._cssClasses.DETAILS);
            btn.setAttribute('title', ctl.getLocaleString(btn.classList.toggle(ctl._cssClasses.GRID) ? 'showGridView' : 'showDetailsView'));
            tree.classList.remove(ctl._cssClasses.DETAILS, ctl._cssClasses.GRID);
            setTimeout(() => tree.classList.add(isGrid ? ctl._cssClasses.GRID : ctl._cssClasses.DETAILS), 20);
        }
    };

    ctlProto.toggleView = function () {
        const self = this;
        toggleUI(self, self.div);
    };

    ctlProto.toggleMoreLayersDialogView = function () {
        const self = this;
        if (self._dialogDiv) {
            toggleUI(self, self._dialogDiv);
        }
    };

    ctlProto.getLayer = function (id) {
        const self = this;
        return self.map && (self.map.getLayer(id) || self._moreBaseLayers && self._moreBaseLayers.filter(layer => layer.id === id)[0]);
    };

    const getTo3DVIew = function (baseLayer) {
        return Promise.all([
            baseLayer.getCapabilitiesPromise(),
            baseLayer.getFallbackLayer() ? baseLayer.getFallbackLayer().getCapabilitiesPromise() : Promise.resolve()
        ]);
    };

    ctlProto._getMoreBaseLayers = function (partialCallback) {
        const self = this;

        if (!self._moreBaseLayers && !self._moreBaseLayersPromise) {

            self._moreBaseLayersPromise = new Promise(function (resolve, _reject) {

                // GLS: Carlos no quiere que se muestren los respectivos dinámicos así que los filtro.
                var noDyn = TC.Cfg.availableBaseLayers
                    .filter(function (lyr) {
                        return TC.Cfg.availableBaseLayers
                            .filter(l => l.fallbackLayer)
                            .map(l => l.fallbackLayer)
                            .indexOf(lyr.id) === -1;
                    })
                    .map(function (baseLayer) {
                        if (baseLayer.type === Consts.layerType.WMS || baseLayer.type === Consts.layerType.WMTS) {
                            return new TC.layer.Raster(baseLayer);
                        } else if (baseLayer.type === Consts.layerType.VECTOR) {
                            return new TC.layer.Vector(baseLayer);
                        }
                    });

                self._moreBaseLayers = new Array(noDyn.length);

                const resolvePromise = function () {
                    self._moreBaseLayers = self._moreBaseLayers.filter(function (baseLayer) {
                        return baseLayer !== null;
                    });

                    resolve(self._moreBaseLayers);
                };
                const addLayer = async function (i) {
                    const baseLayer = this;

                    baseLayer.map = self.map;
                    baseLayer.isBase = baseLayer.options.isBase = true;

                    if (baseLayer.type === Consts.layerType.WMTS) {
                        await baseLayer.getCapabilitiesPromise();
                        var matrixSet = baseLayer.wrap.getCompatibleMatrixSets(self.map.getCRS())[0];
                        baseLayer.mustReproject = !matrixSet;
                    } else if (baseLayer.type === Consts.layerType.WMS) {
                        await baseLayer.getCapabilitiesPromise();
                        baseLayer.mustReproject = !baseLayer.isCompatible(self.map.getCRS());
                    }

                    if (self.map.on3DView && baseLayer.mustReproject && baseLayer.getFallbackLayer) {
                        const fbLayer = baseLayer.getFallbackLayer();
                        if (fbLayer) {
                            await fbLayer.getCapabilitiesPromise();
                            baseLayer.mustReproject = !fbLayer.isCompatible(self.map.getCRS());
                        }
                    }

                    self._moreBaseLayers.splice(i, 1, baseLayer);
                    if (TC.Util.isFunction(partialCallback)) {
                        partialCallback(i);
                    }
                };

                Promise.all(noDyn.map(function (baseLayer, i) {
                    return new Promise(function (res, _rej) {
                        if (baseLayer.type === Consts.layerType.WMS || baseLayer.type === Consts.layerType.WMTS) {
                            var promise = self.map.on3DView ? getTo3DVIew(baseLayer) : baseLayer.getCapabilitiesPromise();
                            promise.then(
                                function () {
                                    addLayer.call(baseLayer, i).then(res);
                                },
                                function (_fail) {
                                    self._moreBaseLayers.splice(i, 1, null);
                                    if (TC.Util.isFunction(partialCallback)) {
                                        partialCallback(i);
                                    }
                                    res();
                                });
                        } else {
                            addLayer.call(baseLayer, i).then(res);
                        }
                    });
                })).finally(resolvePromise);
            });

        } else if (self._moreBaseLayers) {

            return new Promise(function (resolve, _reject) {
                Promise.all(self._moreBaseLayers.filter(function (baseLayer) {
                    return baseLayer.type === Consts.layerType.WMS || baseLayer.type === Consts.layerType.WMTS;
                }).map(function (baseLayer) {
                    return self.map.on3DView ? getTo3DVIew(baseLayer) : baseLayer.getCapabilitiesPromise();
                })).then(function () {

                    self._moreBaseLayers = self._moreBaseLayers.map(function (baseLayer) {

                        if (baseLayer.type === Consts.layerType.WMTS) {
                            var matrixSet = baseLayer.wrap.getCompatibleMatrixSets(self.map.getCRS())[0];
                            baseLayer.mustReproject = !matrixSet;
                        } else if (baseLayer.type === Consts.layerType.WMS) {
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

const BasemapSelector = TC.control.BasemapSelector;
export default BasemapSelector;
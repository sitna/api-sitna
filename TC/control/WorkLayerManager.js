TC.control = TC.control || {};

if (!TC.control.TOC) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/TOC');
}

TC.control.WorkLayerManager = function (options) {
    var self = this;
    TC.control.TOC.apply(self, arguments);
    self.layers = [];
    self.layerTools = [];

    self.addLayerTool({
        renderFn: function (container, layerId) {
            const className = self.CLASS + '-cb-info';

            let checkbox = container.querySelector('input[type="checkbox"].' + className);
            if (!checkbox) {
                const layer = self.map.getLayer(layerId);
                if (layer.isRaster()) {
                    const info = layer.getInfo();
                    if (info.hasOwnProperty('abstract') || info.hasOwnProperty('legend') || info.hasOwnProperty('metadata')) {
                        const text = self.getLocaleString('infoFromThisLayer');
                        checkbox = document.createElement('input');
                        checkbox.setAttribute('type', 'checkbox');
                        const checkboxId = className + '-' + layerId;
                        checkbox.setAttribute('id', checkboxId);
                        checkbox.setAttribute('title', text);
                        checkbox.classList.add(className);
                        checkbox.dataset.layerId = layerId;
                        const label = document.createElement('label');
                        label.innerHTML = text;
                        label.setAttribute('title', text);
                        label.setAttribute('for', checkboxId);
                        label.classList.add(className + '-label');
                        container.appendChild(checkbox);
                        container.appendChild(label);
                    }
                }
            }
            return checkbox;
        },
        actionFn: function () {
            const checkbox = this;
            var li = checkbox;
            do {
                li = li.parentElement;
            }
            while (li && li.tagName !== 'LI');
            const info = li.querySelector('.' + self.CLASS + '-info');
            const layer = self.map.getLayer(checkbox.dataset.layerId);
            // Cargamos la imagen de la leyenda
            info.querySelectorAll('.' + self.CLASS + '-legend img').forEach(function (img) {
                self.styleLegendImage(img, layer);
            });
            info.classList.toggle(TC.Consts.classes.HIDDEN, !checkbox.checked);

            if (li.querySelector('input[type="checkbox"].tc-ctl-wlm-tools-visibility').checked) {
                const dragHandle = li.querySelector('.' + self.CLASS + '-dd');
                dragHandle.classList.toggle(TC.Consts.classes.HIDDEN, !info.classList.contains(TC.Consts.classes.HIDDEN));
            }
        }
    });

    self.addLayerTool({
        renderFn: function (container, layerId) {
            const className = self.CLASS + '-btn-dl';

            let button = container.querySelector('button.' + className);
            if (!button) {
                const layer = self.map.getLayer(layerId);
                if (TC.layer.Vector && layer instanceof TC.layer.Vector) {
                    const text = self.getLocaleString('downloadFeatures');
                    button = document.createElement('button');
                    button.innerHTML = text;
                    button.setAttribute('title', text);
                    button.classList.add(className);
                    button.dataset.layerId = layerId;
                    container.appendChild(button);
                }
            }
            return button;
        },
        actionFn: function () {
            const button = this;
            var li = button;
            do {
                li = li.parentElement;
            }
            while (li && li.tagName !== 'LI');
            const layer = self.map.getLayer(button.dataset.layerId);
            self.getDownloadDialog().then(function (control) {
                const title = layer.title || '';
                const options = {
                    title: `${title} - ${self.getLocaleString('downloadFeatures')}`,
                    fileName: /\.[a-z0-9]+$/i.test(title) ? title.substr(0, title.lastIndexOf('.')) : title,
                    elevation: self.map.elevation && self.map.elevation.options
                };
                control.open(layer.features, options);
            });
        }
    });
};

TC.inherit(TC.control.WorkLayerManager, TC.control.TOC);

(function () {
    var ctlProto = TC.control.WorkLayerManager.prototype;

    ctlProto.CLASS = 'tc-ctl-wlm';
    ctlProto.CLICKEVENT = 'click';

    TC.Consts.classes.DRAG = TC.Consts.classes.DRAG || 'tc-drag';
    TC.Consts.classes.DRAGEND = TC.Consts.classes.DRAGEND || 'tc-dragend';

    TC.Consts.event.TOOLSOPEN = TC.Consts.event.TOOLSOPEN || 'toolsopen.tc';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-wlm.hbs";
    ctlProto.template[ctlProto.CLASS + '-elm'] = TC.apiLocation + "TC/templates/tc-ctl-wlm-elm.hbs";
    ctlProto.template[ctlProto.CLASS + '-type-sgl'] = TC.apiLocation + "TC/templates/tc-ctl-wlm-type-sgl.hbs";
    ctlProto.template[ctlProto.CLASS + '-type-grp'] = TC.apiLocation + "TC/templates/tc-ctl-wlm-type-grp.hbs";
    ctlProto.template[ctlProto.CLASS + '-type-grp-node'] = TC.apiLocation + "TC/templates/tc-ctl-wlm-type-grp-node.hbs";

    const findLayerElement = function (ctl, layer) {
        return ctl.getLayerUIElements().filter(function (li) {
            return li.dataset.layerId === layer.id;
        })[0];
    };

    var getElligibleLayersNumber = function (ctl) {
        return ctl.layers.length;
    };

    const shouldBeDelAllVisible = function (ctl) {
        return !ctl.layers.some(function (layer) { return layer.unremovable });
    };

    const moveLayer = function (ctl, listItem, oldIndex, newIndex, callback) {
        const layerItems = ctl.getLayerUIElements();
        var targetItem;
        if (newIndex > oldIndex) {
            targetItem = layerItems[newIndex - 1];
        }
        else if (newIndex < oldIndex) {
            targetItem = layerItems[newIndex + 1];
        }
        else {
            return;
        }
        const sourceLayer = ctl.map.getLayer(listItem.dataset.layerId);
        const targetLayer = ctl.map.getLayer(targetItem.dataset.layerId);
        const newIdx = ctl.map.layers.indexOf(targetLayer);
        if (newIdx >= 1 && newIdx < ctl.map.layers.length) {
            ctl.map.insertLayer(sourceLayer, newIdx, callback);
        }
    };

    ctlProto.render = function (callback, options) {
        const self = this;
        return self._set1stRenderPromise(self.map ? self.renderData(options ? TC.Util.extend(self.map.getLayerTree(), options) : self.map.getLayerTree(), function () {
            self.addUIEventListeners();
            TC.loadJS(
                !window.Sortable,
                [TC.apiLocation + 'lib/sortable/Sortable.min.js'],
                function () {
                    self.map.workLayers
                        .filter(function (layer) {
                            return !layer.stealth;
                        })
                        .forEach(function (layer) {
                            self.updateLayerTree(layer);
                        });


                    const ul = self.div.querySelector('ul');
                    self._sortable = Sortable.create(ul, {
                        handle: '.' + self.CLASS + '-dd',
                        animation: 150,
                        onSort: function (e) {
                            moveLayer(self, e.item, e.oldIndex, e.newIndex);
                        }
                    });

                    ul.addEventListener('keydown', TC.EventTarget.listenerBySelector('li', function (e) {
                        // Para mover capas con el teclado.
                        var elm = e.target;
                        while (elm.tagName !== 'LI') {
                            elm = elm.parentElement;
                            if (!elm) {
                                return;
                            }
                        }
                        const swap = function (oldIdx, newIdx) {
                            const sortableItems = self._sortable.toArray();
                            const buffer = sortableItems[oldIdx];
                            sortableItems[oldIdx] = sortableItems[newIdx];
                            sortableItems[newIdx] = buffer;
                            self._sortable.sort(sortableItems);
                            moveLayer(self, elm, oldIdx, newIdx);
                        };
                        const listItems = self.getLayerUIElements();
                        const elmIdx = listItems.indexOf(elm);
                        switch (true) {
                            case /Up$/.test(e.key):
                                if (elmIdx > 0) {
                                    swap(elmIdx, elmIdx - 1);
                                    elm.focus();
                                    e.stopPropagation();
                                }
                                break;
                            case /Down$/.test(e.key):
                                if (elmIdx < listItems.length - 1) {
                                    swap(elmIdx, elmIdx + 1);
                                    elm.focus();
                                    e.stopPropagation();
                                }
                                break;
                            case /Enter$/.test(e.key):
                                elm.blur();
                                e.stopPropagation();
                                break;
                            default:
                                break;
                        }
                    }));

                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            );
        }) : Promise.reject(Error('Cannot render: control has no map')));
    };

    ctlProto.register = function (map) {
        const self = this;

        return new Promise(function (resolve, reject) {
            TC.control.TOC.prototype.register.call(self, map).then(function () {

                map.loaded(function () {                   
                    self.updateScale();
                });

                map
                    .on(TC.Consts.event.LAYEROPACITY, function (e) {
                        const li = findLayerElement(self, e.layer);
                        if (li) {
                            li.querySelector('input[type=range]').value = Math.round(e.opacity * 100);
                        }
                    })
                    .on(TC.Consts.event.FEATURESIMPORT, function (e) {
                        var fileName = e.fileName;
                        if (e.features && e.features.length > 0) { // GLS: Escuchamos al evento FEATURESIMPORT para poder desplegar el control de capas cargadas
                            // Ignoramos los GPX (se supone que los gestionará Geolocation)
                            var pattern = '.' + TC.Consts.format.GPX.toLowerCase();
                            if (e.fileName.toLowerCase().indexOf(pattern) === e.fileName.length - pattern.length) {
                                return;
                            }

                            map.one(TC.Consts.event.LAYERADD, function (e) {
                                if (e && e.layer && e.layer.title == fileName) {
                                    // Desplegamos el control capas cargadas
                                    if (self.map && self.map.layout && self.map.layout.accordion) {
                                        if (self.div.classList.contains(TC.Consts.classes.COLLAPSED)) {
                                            self.map.controls
                                                .filter(function (ctl) {
                                                    // Todos los otros controles que no cuelgan de otro control
                                                    return ctl !== self && !ctl.containerControl;
                                                })
                                                .forEach(function (ctl) {
                                                    ctl.div.classList.add(TC.Consts.classes.COLLAPSED);
                                                });
                                        }
                                    }

                                    // abrimos el panel de herramientas
                                    self.map.trigger(TC.Consts.event.TOOLSOPEN);

                                    self.div.classList.remove(TC.Consts.classes.COLLAPSED);
                                }
                            });
                        }
                    });
                resolve(self);
            });
        });
    };

    ctlProto.onExternalServiceAdded = function (e) {
        // Este control no tiene que aceptar servicios externos directamente
    };

    ctlProto.addUIEventListeners = function () {
        const self = this;

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector(`input.${self.CLASS}-tools-visibility[type="checkbox"]`, function (e) {
            // al estar en ipad el evento pasa a ser touchstart en la constante: TC.Consts.event.CLICK, los checkbox no funcionan bien con este evento
            const checkbox = e.target;
            var li = checkbox;
            do {
                li = li.parentElement;
            }
            while (li && !li.matches('li.' + self.CLASS + '-elm'));

            const layer = self.map.getLayer(li.dataset.layerId);
            layer.setVisibility(checkbox.checked);
            e.stopPropagation();
        }));

        const inputRangeListener = function (e) {
            const range = e.target;
            var li = range;
            do {
                li = li.parentElement;
            }
            while (li && li.tagName !== 'LI');

            const layer = self.map.getLayer(li.dataset.layerId);
            layer.setOpacity(range.value / 100);
        };
        self.div.addEventListener('change', TC.EventTarget.listenerBySelector('input[type=range]', inputRangeListener));
        self.div.addEventListener('input', TC.EventTarget.listenerBySelector('input[type=range]', inputRangeListener));

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector(`.${self.CLASS}-btn-del:not(.disabled)`, function (e) {
            var li = e.target;
            do {
                li = li.parentElement;
            }
            while (li && li.tagName !== 'LI');
            const layer = self.map.getLayer(li.dataset.layerId);
            self.map.removeLayer(layer);
        }));

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector('.' + self.CLASS + '-del-all', function (e) {
            TC.confirm(self.getLocaleString('layersRemove.confirm'), function () {
                self.getLayerUIElements()
                    .map(function (li) {
                        return self.map.getLayer(li.dataset.layerId);
                    })
                    .forEach(function (layer) {
                        self.map.removeLayer(layer);
                    });
            });
        }));

    };

    ctlProto.updateLayerVisibility = function (layer) {
        const self = this;
        const li = findLayerElement(self, layer);
        if (li) {
            const visible = layer.getVisibility();
            li.querySelector(`input.${self.CLASS}-tools-visibility[type="checkbox"]`).checked = visible;
        }
    };

    ctlProto.updateLayerTree = function (layer) {
        var self = this;        

        var getLegendImgByPost = function (layer) {
            return new Promise(function (resolve, reject) {
                if (layer && layer.options.method && layer.options.method === "POST") {
                    layer.getLegendGraphicImage()
                        .then(function (src) {
                            resolve(src);
                        })
                        .catch(function (err) { TC.error(err); });
                } else {
                    resolve();
                }
            });
        };

        if (!layer.isBase && !layer.options.stealth) {
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            var alreadyExists = false;
            for (var i = 0, len = self.layers.length; i < len; i++) {
                if (layer === self.layers[i]) {
                    alreadyExists = true;
                    break;
                }
            }

            if (!alreadyExists) {
                self.layers.push(layer);

                var domReadyPromise;
                var layerTitle = layer.title || (layer.wrap.getServiceTitle && layer.wrap.getServiceTitle());                
                layer._title = layerTitle;
                var layerData = {
                    title: layer.options.hideTitle ? '' : layerTitle,
                    hide: layer.renderOptions && layer.renderOptions.hide ? true : false,
                    opacity: layer.renderOptions && layer.renderOptions.opacity ? (layer.renderOptions.opacity * 100) : 100,
                    customLegend: layer.customLegend,
                    unremovable: layer.unremovable,
                    id: layer.id
                };
                var isRaster = layer.isRaster();
                if (isRaster) {
                    layerData.hasExtent = !!layer.getExtent();
                    layerData.layerNames = layer.layerNames;
                    const path = layer.names.map(n => layer.getPath(n));
                    path.forEach(p => p.shift());
                    layerData.path = path;
                    layerData.legend = [];
                    layerData.abstract = [];
                    layerData.metadata = [];
                    layer.names.forEach(function (name) {
                        var info = layer.getInfo(name);
                        layerData.legend.push(info.legend);
                        layerData.abstract.push(info.abstract);
                        layerData.metadata.push(info.metadata);
                    });
                }
                else {
                    layerData.hasExtent = true;
                }


                getLegendImgByPost(layer).then(function (src) {
                    if (src) {
                        legend.src = src; // ya se ha validado en getLegendImgByPost
                    }
                             
                    self.getRenderedHtml(self.CLASS + '-elm', layerData).then(function (out) {
                        const parser = new DOMParser();
                        const li = parser.parseFromString(out, 'text/html').body.firstChild;
                        var layerNode;
                        var isGroup = false;
                        if (isRaster) {
                            isGroup = layer.names.length > 1;
                            if (!isGroup) {
                                var layerNodes = layer.wrap.getAllLayerNodes();
                                for (var i = 0; i < layerNodes.length; i++) {
                                    var node = layerNodes[i];
                                    if (layer.wrap.getName(node) === name) {
                                        layerNode = node;
                                        if (layer.wrap.getLayerNodes(node).length > 0) {
                                            isGroup = true;
                                        }
                                        break;
                                    }
                                }
                            }
                        }

                        const typeElm = li.querySelector('.' + self.CLASS + '-type');
                        const className = isGroup ? self.CLASS + '-type-grp' : self.CLASS + '-type-sgl';
                        typeElm.classList.add(className);

                        const zoomBtn = li.querySelector(`.${self.CLASS}-btn-zoom`);
                        if (zoomBtn) {
                            zoomBtn.addEventListener(TC.Consts.event.CLICK, function (e) {
                                self.map.zoomToLayer(li.dataset.layerId, { animate: true });
                            }, { passive: true });
                        }

                        if (layerNode) {
                            layer.wrap.normalizeLayerNode(layerNode);

                            self.getRenderedHtml(className, layerNode).then(function (out) {
                                var tip;

                                typeElm.addEventListener('mouseover', function (e) {
                                    const mapDiv = self.map.div;
                                    const typeElmRect = typeElm.getBoundingClientRect();
                                    tip = document.createElement('div');
                                    tip.classList.add(self.CLASS + '-tip');
                                    tip.innerHTML = out;
                                    tip.style.top = (typeElmRect.top - mapDiv.offsetTop) + 'px';
                                    tip.style.right = mapDiv.offsetWidth - (typeElmRect.left - mapDiv.offsetLeft) + 'px';
                                    mapDiv.appendChild(tip);
                                });
                                typeElm.addEventListener('mouseout', function (e) {
                                    tip.parentElement.removeChild(tip);
                                });
                            });
                        }
                        const ul = self.div.querySelector('ul');
                        li.dataset.layerId = layer.id;

                        const lis = self.getLayerUIElements();
                        const layerList = self.map.workLayers
                            .filter(function (l) {
                                return !l.stealth;
                            });
                        const layerIdx = layerList.indexOf(layer);

                        self.layerTools.forEach(tool => self.addLayerToolUI(li, tool));

                        var inserted = false;
                        for (var i = 0, ii = lis.length; i < ii; i++) {
                            const referenceLi = lis[i];
                            const referenceLayerIdx = layerList.indexOf(self.map.getLayer(referenceLi.dataset.layerId));
                            if (referenceLayerIdx < layerIdx) {
                                referenceLi.insertAdjacentElement('beforebegin', li);
                                inserted = true;
                                break;
                            }
                        }
                        if (!inserted) {
                            ul.appendChild(li);
                        }

                        if (domReadyPromise) domReadyPromise(li);
                        self.updateScale();
                    });
                });

                var elligibleLayersNum = getElligibleLayersNumber(self);
                const numElm = self.div.querySelector('.' + self.CLASS + '-n');
                const emptyElm = self.div.querySelector('.' + self.CLASS + '-empty');
                const contentElm = self.div.querySelector('.' + self.CLASS + '-content');
                numElm.textContent = elligibleLayersNum;
                if (elligibleLayersNum > 0) {
                    numElm.classList.add(TC.Consts.classes.VISIBLE);
                    emptyElm.classList.add(TC.Consts.classes.HIDDEN);
                    contentElm.classList.remove(TC.Consts.classes.HIDDEN);
                }
                else {
                    numElm.classList.remove(TC.Consts.classes.VISIBLE);
                    emptyElm.classList.remove(TC.Consts.classes.HIDDEN);
                    contentElm.classList.add(TC.Consts.classes.HIDDEN);
                }

                const deleteAllElm = self.div.querySelector('.' + self.CLASS + '-del-all');
                deleteAllElm.classList.toggle(TC.Consts.classes.HIDDEN, !shouldBeDelAllVisible(self));
            }
            else {
                var layerTitle = layer.title || layer.wrap.getServiceTitle();
                //comprobar si hay capas con títulos repetidos                 
                while (self.layers.filter(function (l) { return l !== layer && (layer._timeStamp !== l._timeStamp) }).find(function (l) { return (l._title || l.title) === layerTitle; })) {
                    var nameRegExp = new RegExp(/(.+\.\w+ )\(([0-9]+)\)$/gi).exec(layerTitle)
                    layerTitle = !nameRegExp ? layerTitle + " (2)" : nameRegExp[1] + "(" + (parseInt(nameRegExp[2], 10) + 1) + ")";
                }
                layer._title = layerTitle;
                const prevLi = self.div.querySelector("ul li[data-layer-id='" + layer.id + "']");
                if (layer.features && layer.features.length) {
                    if (layer.features[0].getPath().length) {
                        prevLi.querySelector(".tc-ctl-wlm-lyr").innerHTML = layerTitle;
                        prevLi.querySelector(".tc-ctl-wlm-path").innerHTML = layer.features[0].getPath().join(' &bull; ');
                    }
                    else
                        prevLi.querySelector(".tc-ctl-wlm-path").innerHTML = layerTitle

                }
            }
        }
    };

    ctlProto.updateScale = function () {
        var self = this;
        self.getLayerUIElements().forEach(function (li) {
            var layer = self.map.getLayer(li.dataset.layerId);
            if (layer && layer.names) {
                var isVisible = false;
                for (var i = 0; i < layer.names.length; i++) {
                    if (layer.isVisibleByScale(layer.names[i])) {
                        isVisible = true;
                        break;
                    }
                }
                li.classList.toggle(self.CLASS + '-elm-notvisible', !isVisible);
            }
        });
    };

    ctlProto.update = function () {
        var self = this;

        var _getCheckbox = function (li) {
            return li.querySelector(`input.${self.CLASS}-tools-visibility[type="checkbox"]`);
        };

        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);
            if (layer) {
                _getCheckbox(li).checked = layer.getVisibility();

                layer.tree = null;

                //li.querySelectorAll('li').forEach(function (l) {
                //    const checkbox = _getCheckbox(l);
                //    const uid = l.dataset.layerUid;
                //    switch (layer.getNodeVisibility(uid)) {
                //        case TC.Consts.visibility.VISIBLE:
                //            checkbox.checked = true;
                //            checkbox.indeterminate = false;
                //            break;
                //        case TC.Consts.visibility.NOT_VISIBLE_AT_RESOLUTION:
                //            checkbox.checked = true;
                //            checkbox.indeterminate = false;
                //            break;
                //        case TC.Consts.visibility.HAS_VISIBLE:
                //            checkbox.checked = false;
                //            checkbox.indeterminate = true;
                //            break;
                //        default:
                //            checkbox.checked = false;
                //            checkbox.indeterminate = false;
                //    }
                //});
            }
        });

        self.updateScale();
    };

    ctlProto.updateLayerOrder = function (layer, oldIdx, newIdx) {
        //TC.control.MapContents.prototype.updateLayerOrder.call(this, layer, oldIdx, newIdx);
        const self = this;
        self.map.workLayers
            .filter(function (layer) {
                return !layer.stealth;
            })
            .forEach(function (layer) {
                const li = findLayerElement(self, layer);
                if (li) {
                    li.parentElement.firstChild.insertAdjacentElement('beforebegin', li);
                }
            });
    };

    ctlProto.removeLayer = function (layer) {
        var self = this;
        var idx = self.layers.indexOf(layer);
        if (idx >= 0) {
            self.layers.splice(idx, 1);
        }
        self.getLayerUIElements().forEach(function (li) {
            if (li.dataset.layerId === layer.id) {
                li.parentElement.removeChild(li);
            }
        });
        const contentElm = self.div.querySelector('.' + self.CLASS + '-content');
        const emptyElm = self.div.querySelector('.' + self.CLASS + '-empty');
        const numberElm = self.div.querySelector('.' + self.CLASS + '-n');
        var nChildren = getElligibleLayersNumber(self);
        numberElm.textContent = nChildren;
        if (nChildren > 0) {
            contentElm.classList.remove(TC.Consts.classes.HIDDEN);
            emptyElm.classList.add(TC.Consts.classes.HIDDEN);
            numberElm.classList.add(TC.Consts.classes.VISIBLE);
        }
        else {
            if (shouldBeDelAllVisible(self)) {
                self.div.querySelector('.' + self.CLASS + '-del-all').classList.add(TC.Consts.classes.HIDDEN);
            }
            contentElm.classList.add(TC.Consts.classes.HIDDEN);
            emptyElm.classList.remove(TC.Consts.classes.HIDDEN);
            numberElm.classList.remove(TC.Consts.classes.VISIBLE);
        }
    };

    ctlProto.getLayerUIElements = function () {
        const self = this;
        return Array.from(self.div.querySelectorAll(`ul > li.${self.CLASS}-elm`));
    };

    ctlProto.addLayerToolUI = function (elm, tool) {
        const self = this;
        if (TC.Util.isFunction(tool.renderFn)) {
            const button = tool.renderFn(elm.querySelector(`.${self.CLASS}-tools`), elm.dataset.layerId);
            if (button) {
                if (TC.Util.isFunction(tool.actionFn)) {
                    const eventName = button.getAttribute('type') === 'checkbox' ? 'change' : TC.Consts.event.CLICK;
                    button.addEventListener(eventName, function (e) {
                        tool.actionFn.call(button);
                    }, { passive: true });
                }
                if (TC.Util.isFunction(tool.updateFn) && tool.updateEvents) {
                    map.on(tool.updateEvents.join(' '), function (e) {
                        if (!e.layer || e.layer.id === button.dataset.layerId) {
                            tool.updateFn.call(button, e);
                        }
                    });
                }
            }
        }
    };

    ctlProto.addLayerTool = function (options) {
        const self = this;
        self.layerTools.push(options);
        self.getLayerUIElements().forEach(function (elm) {
            self.addLayerToolUI(elm, options);
        });
    };
})();
TC.control = TC.control || {};

if (!TC.control.ProjectionSelector) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/ProjectionSelector');
}

(function () {

    TC.control.LayerCatalog = function () {
        var self = this;

        self.layers = [];
        self.searchInit = false;

        TC.control.ProjectionSelector.apply(self, arguments);

        self._selectors = {
            LAYER_ROOT: 'div.' + self.CLASS + '-tree > ul.' + self.CLASS + '-branch > li.' + self.CLASS + '-node'
        };

        if (!TC.Consts.classes.SELECTABLE) {
            TC.Consts.classes.SELECTABLE = 'tc-selectable';
        }
        if (!TC.Consts.classes.INCOMPATIBLE) {
            TC.Consts.classes.INCOMPATIBLE = 'tc-incompatible';
        }
        if (!TC.Consts.classes.ACTIVE) {
            TC.Consts.classes.ACTIVE = 'tc-active';
        }
    };

    TC.inherit(TC.control.LayerCatalog, TC.control.ProjectionSelector);

    var ctlProto = TC.control.LayerCatalog.prototype;

    ctlProto.CLASS = 'tc-ctl-lcat';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/LayerCatalog.html";
    ctlProto.template[ctlProto.CLASS + '-branch'] = TC.apiLocation + "TC/templates/LayerCatalogBranch.html";
    ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/LayerCatalogNode.html";
    ctlProto.template[ctlProto.CLASS + '-info'] = TC.apiLocation + "TC/templates/LayerCatalogInfo.html";
    ctlProto.template[ctlProto.CLASS + '-results'] = TC.apiLocation + "TC/templates/LayerCatalogResults.html";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/LayerCatalogDialog.html";

    const showProjectionChangeDialog = function (ctl, layer) {
        ctl.showProjectionChangeDialog({
            layer: layer,
            closeCallback: function () {
                ctl.getLayerNodes(layer).forEach(function (node) {
                    node.classList.remove(TC.Consts.classes.LOADING);
                    node.querySelector('span').dataset.tooltip = ctl.getLocaleString('clickToAddToMap');
                });
            }
        });
    };

    var SEARCH_MIN_LENGTH = 3;

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.control.ProjectionSelector.prototype.register.call(self, map);

        const load = function (resolve, reject) {
            if (Array.isArray(self.options.layers)) {
                for (var i = 0; i < self.options.layers.length; i++) {
                    var layer = self.options.layers[i];
                    if (!layer.type || layer.type === TC.Consts.layerType.WMS) {
                        if (!layer.id) {
                            layer.id = TC.getUID();
                        }                        
                        if (TC.Util.isPlainObject(layer)) {
                            layer = new TC.layer.Raster(layer);
                        }                        
                        self.layers.push(layer);
                    }
                }
                self.render(function () {
                    resolve();
                });
            }
            else {
                resolve();
            }
        };

        self._readyPromise = new Promise(function (resolve, reject) {
            const waitLoad = function (e) {
                if (e.layer === map.baseLayer) {
                    load(resolve, reject);
                    map.off(TC.Consts.event.LAYERUPDATE, waitLoad);
                }
            };

            map.loaded(function () {
                if (!map.baseLayer.state || map.baseLayer.state === TC.Layer.state.IDLE) {
                    load(resolve, reject);
                }
                else {
                    map.on(TC.Consts.event.LAYERUPDATE, waitLoad);
                }
            });
        });

        const findResultNodes = function (layer) {
            const result = [];
            if (!layer.isBase) {
                var url = layer.options.url;
                if (self.list) {
                    self.list.querySelectorAll('li').forEach(function (li) {
                        const lyr = self.getLayer(li.dataset.layerId);
                        if (lyr && lyr.type === layer.type && lyr.options.url === url) {
                            for (var i = 0; i < layer.names.length; i++) {
                                if (li.dataset.layerName === layer.names[i]) {
                                    result.push(li);
                                    break;
                                }
                            }
                        }
                    });
                }
            }
            return result;
        };

        /**
         * Marca todas las capas del TOC como añadidas excepto la que se está borrando que se recibe como parámetro.
         */
        const _markWorkLayersAsAdded = function (layerRemoved) {
            var wlCtrl = self.map.getControlsByClass(TC.control.WorkLayerManager)[0];
            if (wlCtrl) {
                var layers = wlCtrl.layers;

                for (var i = 0; i < layers.length; i++) {
                    var layer = layers[i];

                    if (layer !== layerRemoved) {
                        self.getLayerNodes(layer).forEach(function (node) {
                            node.classList.add(TC.Consts.classes.CHECKED);
                            node.querySelector('span').dataset.tooltip = self.getLocaleString('layerAlreadyAdded');
                        });
                    }
                }
            }
        };

        var clickToAddText = self.getLocaleString('clickToAddToMap');

        map
            .on(TC.Consts.event.BEFORELAYERADD + ' ' + TC.Consts.event.BEFOREUPDATEPARAMS, function (e) {
                self.getLayerNodes(e.layer).forEach(function (node) {
                    node.classList.add(TC.Consts.classes.LOADING);
                    delete node.querySelector('span').dataset.tooltip;
                });
            })
            .on(TC.Consts.event.LAYERADD + ' ' + TC.Consts.event.UPDATEPARAMS, function (e) {
                const layer = e.layer;
                if (!layer.isBase && layer.type === TC.Consts.layerType.WMS) {
                    self.loaded().then(function () { // Esperamos a que cargue primero las capas de la configuración

                        if (self.getLayerRootNode(layer)) {
                            updateControl.call(self, layer);
                        }
                        else {
                            // la capa no está renderizada, pero podría estar en proceso, comprobamos que no está en la lista de capas del control
                            var layerAlreadyAdded = false;
                            for (var i = 0, len = self.layers.length; i < len; i++) {
                                var lyr = self.layers[i];
                                if (lyr.type === layer.type && lyr.options.url === layer.options.url) {
                                    layerAlreadyAdded = true;
                                    break;
                                }
                            }

                            // 12/03/2019 GLS la capa forma parte de los servicios configurados pero el nodo aún no se ha cargado, la guardamos
                            if (layerAlreadyAdded) {
                                if (!self.layersToSetChecked) {
                                    self.layersToSetChecked = [];
                                }

                                self.layersToSetChecked.push(layer);
                            } else {
                                self.addLayer(new TC.layer.Raster({
                                    url: layer.options.url,
                                    type: layer.type,
                                    layerNames: [],
                                    title: layer.title || layer.wrap.getServiceTitle(),
                                    hideTitle: true,
                                    hideTree: false
                                })).then(function () {
                                    updateControl.call(self, layer);
                                });
                            }
                        }
                    });
                }
            })
            .on(TC.Consts.event.LAYERERROR, function (e) {
                const reason = e.reason;
                if (self.layers.some((f) => { return f == e.layer })) {
                    if (reason) {
                        TC.alert(self.getLocaleString(reason, { url: e.layer.url }));
                    }
                    self.getLayerNodes(e.layer).forEach(function (node) {
                        node.classList.remove(TC.Consts.classes.LOADING);
                    });
                }                
            })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
                const layer = e.layer;
                self.getLayerNodes(layer).forEach(function (node) {
                    node.classList.remove(TC.Consts.classes.CHECKED);
                    node.querySelector('span').dataset.tooltip = clickToAddText;
                });
                findResultNodes(layer).forEach(function (node) {
                    node.classList.remove(TC.Consts.classes.CHECKED);
                    node.querySelector('h5').dataset.tooltip = clickToAddText;
                });

                //Marcamos como añadidas aquellas capas que estén en el control de capas cargadas. Esto previene que si borramos una capa padre, todas
                //sus hijas aparezcan como no añadidas, a pesar que que alguna de ellas haya sido añadida previamente de manera individual
                _markWorkLayersAsAdded(layer);

                //refresh del searchList            
                _refreshResultList.call(self);
            })
            .on(TC.Consts.event.EXTERNALSERVICEADDED, function (e) {
                if (e && e.layer) {
                    self.addLayer(e.layer);
                    self.div.classList.remove(TC.Consts.classes.COLLAPSED);
                }
            })
            .on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
                self.update();
            });

        return result;
    };

    const onCollapseButtonClick = function (e) {
        e.target.blur();
        e.stopPropagation();
        const li = e.target.parentElement;
        if (li.tagName === 'LI' && !li.classList.contains(self.CLASS + '-leaf')) {
            li.classList.toggle(TC.Consts.classes.COLLAPSED);
            const ul = li.querySelector('ul');
            ul.classList.toggle(TC.Consts.classes.COLLAPSED);
        }
    };

    const onSpanClick = function (e, ctl) {
        const li = e.target.parentNode;
        if (!li.classList.contains(TC.Consts.classes.LOADING) && !li.classList.contains(TC.Consts.classes.CHECKED)) {
            e.preventDefault;

            var layerName = li.dataset.layerName;
            layerName = (layerName !== undefined) ? layerName.toString() : '';
            var layer;
            for (var i = 0, len = ctl._roots.length; i < len; i++) {
                const root = ctl._roots[i];
                if (root.contains(li)) {
                    layer = ctl.getLayer(root.dataset.layerId);
                    break;
                }
            }
            if (!layer) {
                layer = ctl.getLayer(li.dataset.layerId);
            }
            if (layer && layerName) {
                var redrawTime = 1;

                if (/iPad/i.test(navigator.userAgent))
                    redrawTime = 10;
                else if (TC.Util.detectFirefox())
                    redrawTime = 250;

                if (!layer.title) {
                    layer.title = layer.getTree().title;
                }

                li.classList.add(TC.Consts.classes.LOADING);
                li.querySelector('span').dataset.tooltip = '';

                const reDraw = function (element) {
                    return new Promise(function (resolve, reject) {
                        setTimeout(function () {
                            element.offsetHeight = element.offsetHeight;
                            element.offsetWidth = element.offsetWidth;

                            resolve();
                        }, redrawTime);
                    });
                };

                reDraw(li).then(function () {
                    ctl.addLayerToMap(layer, layerName);
                });
                e.stopPropagation();
            }
        }
    };

    const createSearchAutocomplete = function () {
        const self = this;

        self.textInput = self.div.querySelector("." + self.CLASS + "-input");
        self.list = self.div.querySelector("." + self.CLASS + "-search ul");
        // Clear results list when x button is pressed in the search input
        self.textInput.addEventListener('mouseup', function (e) {
            var oldValue = self.textInput.value;

            if (oldValue === '') {
                return;
            }

            // When this event is fired after clicking on the clear button
            // the value is not cleared yet. We have to wait for it.
            setTimeout(function () {
                var newValue = self.textInput.value;

                if (newValue === '') {
                    self.list.innerHTML = '';
                }
            }, 1);
        });

        var layerCheckedList = [];
        //Definir el autocomplete del buscador de capas por texto
        TC._search = TC._search || {};
        TC._search.retryTimeout = null;

                    TC.loadJS(
                        !TC.UI || !TC.UI.autocomplete,
                        [TC.apiLocation + 'TC/ui/autocomplete.js'],
                        function () {
                            TC.UI.autocomplete.call(self.textInput, {
                                link: '#',
                                target: self.list,
                                minLength: 0,
                                source: function (text, callback) {
                                    //lista de capas marcadas
                                    layerCheckedList = [];
                                    self._roots.forEach(function (root) {
                                        root.querySelectorAll("li." + TC.Consts.classes.CHECKED).forEach(function (item) {
                                            layerCheckedList.push(item.dataset.layerName);
                                        });
                                    });

                        //con texto vacío, limpiar  y ocultar la lista de resultados
                        text = text.trim();
                        if (text.length < SEARCH_MIN_LENGTH) {
                            self.list.innerHTML = '';
                        }
                        else if (text.length >= SEARCH_MIN_LENGTH) {
                            if (TC._search.retryTimeout)
                                clearTimeout(TC._search.retryTimeout);
                            TC._search.retryTimeout = setTimeout(function () {
                                var results = [];
                                for (var index = 0; index < self.sourceLayers.length; index++) {
                                    var _founds = self.sourceLayers[index].searchSubLayers(text);
                                    if (_founds.length) {
                                        results.push({
                                            service: {
                                                index: index,
                                                title: self.sourceLayers[index].title || self.sourceLayers[index].id
                                            },
                                            founds: _founds
                                        });
                                    }
                                }
                                callback({ servicesFound: results, servicesLooked: self.sourceLayers.length });
                            }, TC._search.interval);
                        }
                    },
                    callback: function (e) {
                        self.textInput.value = e.target.text || e.target.innerText;
                        TC._search.lastPattern = self.textInput.value;
                        self.goToResult(unescape(e.target.hash).substring(1));
                        TC.UI.autocomplete.call(self.textInput, 'clear');
                    },
                    buildHTML: function (data) {
                        var container = this.target;
                        //si hay resultados, mostramos la lista
                        if (data.results && data.results.servicesFound.length > 0) {
                            var workLayers = self.map.getLayerTree().workLayers;
                            for (var k = 0; k < data.results.servicesFound.length; k++) {
                                var founds = data.results.servicesFound[k].founds;
                                for (var j = 0; j < founds.length; j++) {
                                    delete founds[j].alreadyAdded;
                                    for (var i = 0; i < workLayers.length; i++) {
                                        //if (workLayers[i].title == data.results[j].Title ) {
                                        if (layerCheckedList.indexOf(founds[j].Name) >= 0) {
                                            founds[j].alreadyAdded = true;
                                            break;
                                        }
                                    }
                                    //Si la capa no tiene Name, no se puede añadir al TOC
                                    if (!founds[j].Name) {
                                        founds.splice(j, 1);
                                        j--;
                                    }
                                }
                                if (!data.results.servicesFound[k].founds.length) {
                                    data.results.servicesFound.splice(k, 1);
                                    continue;
                                }
                                //si estaba collapsado mantenemos el estado
                                if (self.div.querySelectorAll(".tc-ctl-lcat-search-group")[k]) {
                                    data.results.servicesFound[k].service.isCollapsed = self.div.querySelectorAll(".tc-ctl-lcat-search-group")[k].classList.contains(TC.Consts.classes.COLLAPSED);
                                }
                            }
                        }
                        var ret = ''
                        self.getRenderedHtml(self.CLASS + '-results', data.results).then(function (out) {
                            container.innerHTML = ret = out;
                        });
                        return ret;
                    }
                });
            });


        if (!self.searchInit) {
            //botón de la lupa para alternar entre búsqueda y árbol
            self.div.addEventListener('click', TC.EventTarget.listenerBySelector('h2 button', function (e) {
                const wasCollapsed = self.div.classList.contains(TC.Consts.classes.COLLAPSED);
                self.div.classList.remove(TC.Consts.classes.COLLAPSED);

                const searchPane = self.div.querySelector('.' + self.CLASS + '-search');
                const treePane = self.div.querySelector('.' + self.CLASS + '-tree');
                const infoPane = self.div.querySelector('.' + self.CLASS + '-info');

                const searchPaneMustShow = !!(searchPane.classList.contains(TC.Consts.classes.HIDDEN) || wasCollapsed);
                searchPane.classList.toggle(TC.Consts.classes.HIDDEN, !searchPaneMustShow);
                treePane.classList.toggle(TC.Consts.classes.HIDDEN, searchPaneMustShow);
                e.target.classList.toggle(self.CLASS + '-btn-tree', searchPaneMustShow);
                e.target.classList.toggle(self.CLASS + '-btn-search', !searchPaneMustShow);
                if (searchPaneMustShow) {
                    self.textInput.focus();
                    e.target.setAttribute('title', self.getLocaleString('viewAvailableLayersTree'));

                    //Si no hay resultados resaltados en el buscador, ocultamos el panel de info
                    const selectedCount = self.div.querySelectorAll('.tc-ctl-lcat-search li button.tc-checked').length;
                    if (selectedCount === 0) {
                        infoPane.classList.add(TC.Consts.classes.HIDDEN);
                    }
                }
                else {
                    e.target.setAttribute('title', self.getLocaleString('searchLayersByText'));

                    //Si hay resaltados en el árbol, mostramos el panel de info
                    const selectedCount = self.div.querySelectorAll('.tc-ctl-lcat-tree li button.tc-checked').length;
                    if (selectedCount > 0) {
                        infoPane.classList.remove(TC.Consts.classes.HIDDEN);
                    }
                }
            }));


            //evento de expandir nodo de info
            //self._$div.off("click", ".tc-ctl-lcat-search button");                        
            self.div.addEventListener("click", TC.EventTarget.listenerBySelector("." + self.CLASS + "-search button." + self.CLASS + "-search-btn-info", function (evt) {
                evt.stopPropagation();
                const target = evt.target;
                if (!target.classList.contains(TC.Consts.classes.CHECKED)) {
                    const li = target.parentElement;
                    var parent = li;
                    do {
                        parent = parent.parentElement;
                    }
                    while (parent && parent.tagName !== 'LI');
                    self.showLayerInfo(self.layers.length > 1 ? self.layers[parent.dataset.serviceIndex] : self.layers[0], li.dataset.layerName);
                    target.classList.add(TC.Consts.classes.CHECKED);

                } else {
                    target.classList.remove(TC.Consts.classes.CHECKED);
                    self.hideLayerInfo();
                }
            }));

                        //click en un resultado - añadir capa
            const searchListElementSelector = '.' + self.CLASS + '-search li';
            self.div.addEventListener('click', TC.EventTarget.listenerBySelector(searchListElementSelector, function (evt) {
                evt.stopPropagation();
                var li = evt.target;
                while (li && !li.matches(searchListElementSelector)) {
                    li = li.parentElement;
                }
                if (li.classList.contains(self.CLASS + '-no-results')) {
                    return; //si clicko en el li de "no hay resultados" rompo el ciclo de ejecución
                }
                if (li.classList.contains(self.CLASS + '-search-group')) {
                    li.classList.toggle(TC.Consts.classes.COLLAPSED);
                    return;
                }
                var layerName = li.dataset.layerName;
                if (!layerName) {
                    return;
                }
                layerName = layerName.toString();

                if (layerName.trim().length === 0) {
                    return;
                }

                //si la capa ya ha sido anteriormente, no la añadimos y mostramos un mensaje
                if (li.classList.contains(TC.Consts.classes.CHECKED)) {
                    return;
                } else {
                    var liParent = li;
                    do {
                        liParent = liParent.parentElement;
                    }
                    while (liParent && !liParent.matches('li.' + self.CLASS + '-search-group'));

                    const layerIdx = !liParent ? 0 : liParent.dataset.serviceIndex;
                    const url = self.layers[layerIdx].options.url;
                    const title = self.layers[layerIdx].title;

                    const layer = new TC.layer.Raster({
                        id: self.getUID(),
                        url: url,
                        title: title,
                        hideTitle: self.layers[layerIdx].hideTitle || self.layers[layerIdx].options.hideTitle,
                        hideTree: false,
                        layerNames: [layerName]
                    });
                    if (layer.isCompatible(self.map.crs)) {
                        self.map.addLayer(layer, function (layer) {
                            li.dataset.layerId = layer.id;
                            layer.wrap.$events.on(TC.Consts.event.TILELOADERROR, function (event) {
                                var layer = this.parent;
                                if (event.error.code === 401 || event.error.code === 403)
                                    layer.map.toast(event.error.text, { type: TC.Consts.msgType.ERROR });
                                layer.map.removeLayer(layer);
                            });
                        });
                        //marcamos el resultado como añadido
                        li.classList.add(TC.Consts.classes.CHECKED);
                        li.querySelector('h5').dataset.tooltip = self.getLocaleString('layerAlreadyAdded');
                    }
                    else {
                        showProjectionChangeDialog(self, layer);
                    }
                }
            }));

            self.searchInit = true;
        }
    };

    const getLayerTree = function (layer) {
        var result = layer.getTree();
        var makeNodeVisible = function makeNodeVisible(node) {
            var result = false;
            var childrenVisible = false;
            for (var i = 0; i < node.children.length; i++) {
                if (makeNodeVisible(node.children[i])) {
                    childrenVisible = true;
                }
            }
            if (node.hasOwnProperty('isVisible')) {
                node.isVisible = (!layer.names || !layer.names.length) || childrenVisible || node.isVisible;
            }
            return node.isVisible;
        };
        makeNodeVisible(result);
        return result;
    };

    const _refreshResultList = function () {
        const self = this;

        if ("createEvent" in document) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("keyup", false, true);
            if (self.textInput) {
                self.textInput.dispatchEvent(evt);
            }
        }
        else {
            if (self.textInput) {
                self.textInput.fireEvent("keyup");
            }
        }
    };

    const updateControl = function (layer) {
        const self = this;

        self.getLayerNodes(layer).forEach(function (node) {
            node.classList.remove(TC.Consts.classes.LOADING);
            node.classList.add(TC.Consts.classes.CHECKED);
            node.querySelector('span').dataset.tooltip = self.getLocaleString('layerAlreadyAdded');
        });
        _refreshResultList.call(self);
    };

    const setCheckedLayersOnNode = function () {
        const self = this;

        if (self.layersToSetChecked && self.layersToSetChecked.length > 0) {
            self.layersToSetChecked.forEach(function (layer, index, array) {
                if (self.getLayerRootNode(layer)) {
                    updateControl.call(self, layer);

                    array.splice(index, 1);
                }
            });
        }
    };

    const addLogicToNode = function (node, layer) {
        const self = this;

        node.querySelectorAll('li > button.' + self.CLASS + '-collapse-btn').forEach(function (btn) {
            btn.addEventListener('click', onCollapseButtonClick);
        });

        node.querySelectorAll('span').forEach(function (span) {
            span.addEventListener('click', function (e) {
                onSpanClick(e, self);
            });
        });

        self._roots = self.div.querySelectorAll(self._selectors.LAYER_ROOT);                
        
        node.dataset.layerId = layer.id;

        var formatDescriptions = {};
        node.querySelectorAll('.' + self.CLASS + '-btn-info').forEach(function (a) {
            const span = a.parentElement.querySelector('span');
            const name = a.parentElement.dataset.layerName;
            if (name) {
                span.classList.add(TC.Consts.classes.SELECTABLE);
                var info = layer.wrap.getInfo(name);
                if (!info.hasOwnProperty('abstract') && !info.hasOwnProperty('legend') && !info.hasOwnProperty('metadata')) {
                    a.parentElement.removeChild(a);
                }
                else {                    
                    a.addEventListener(TC.Consts.event.CLICK, function (e) {
                        e.stopPropagation();
                        const elm = this;
                        if (elm.classList.toggle(TC.Consts.classes.CHECKED)) {
                            self.showLayerInfo(layer, name);
                        } else {
                            self.hideLayerInfo();
                        }
                    });
                }
                if (layer.compatibleLayers && layer.compatibleLayers.indexOf(name) < 0) {
                    span.classList.add(TC.Consts.classes.INCOMPATIBLE);
                    span.setAttribute('title', self.getLocaleString('reprojectionNeeded'));
                    //console.log("capa " + name + " incompatible");
                }
                if (self.map) {
                    for (var j = 0, len = self.map.workLayers.length; j < len; j++) {
                        var wl = self.map.workLayers[j];
                        if (wl.type === TC.Consts.layerType.WMS && wl.url === layer.url && wl.names.length === 1 && wl.names[0] === name) {
                            span.parentElement.classList.add(TC.Consts.classes.CHECKED);
                            span.dataset.tooltip = self.getLocaleString('layerAlreadyAdded');
                        }
                    }
                }
            }
            else {
                span.dataset.tooltip = '';
                a.parentElement.removeChild(a);
            }
        });        

        setCheckedLayersOnNode.call(self);

        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;
        });
    };

    ctlProto.renderBranch = function (layer, callback, promiseRenderResolve) {
        const self = this;

        layer.getCapabilitiesPromise()
            .then(function (result) {

                self.sourceLayers.push(layer);

                self.getRenderedHtml(self.CLASS + '-branch', getLayerTree(this), function (html) {
                    var template = document.createElement('template');
                    template.innerHTML = html;

                    var newChild = template.content ? template.content.firstChild : template.firstChild;
                    var oldChild = self.div.querySelector('.' + self.CLASS + '-branch').querySelector('li.' + self.CLASS + '-loading-node[data-layer-id="' + this.id + '"]');

                    if (oldChild) {
                        self.div.querySelector('.' + self.CLASS + '-branch').replaceChild(newChild, oldChild);
                    } else {
                        self.div.querySelector('.' + self.CLASS + '-branch').appendChild(newChild);
                    }

                    addLogicToNode.call(self, newChild, this);

                    if (self.div.querySelector('.' + self.CLASS + '-branch').childElementCount === 1) {
                        promiseRenderResolve();
                    }

                    if (TC.Util.isFunction(callback)) {
                        // pasamos el callback el item 
                        callback(self.sourceLayers[self.sourceLayers.map(function (l) { return l.id }).indexOf(this.id)]);
                    }

                }.bind(this));

            }.bind(layer))
            .catch(function (error) {
                var index = self.layers.map(function (l) { return l.id }).indexOf(this.id);
                self.layers.splice(index, 1);

                var errorMessage = self.getLocaleString("lyrCtlg.errorLoadingNode", { serviceName: this.title });
                var liError = self.div.querySelector('.' + self.CLASS + '-branch').querySelector('li.' + self.CLASS + '-loading-node[data-layer-id="' + this.id + '"]');
                liError.classList.add('error');
                liError.setAttribute('title', errorMessage);

                self.map.toast(errorMessage, { type: TC.Consts.msgType.ERROR });

            }.bind(layer));
    };

    ctlProto.render = function (callback) {
        const self = this;

        self.sourceLayers = [];

        return self._set1stRenderPromise(new Promise(function (resolve, reject) {
            if (self.layers.length === 0) {
                self.renderData({ layerTrees: [], enableSearch: false }, function () {

                    if (TC.Util.isFunction(callback)) {
                        callback();
                    }

                    resolve();
                });
            } else {
                self.renderData({ layers: self.layers, enableSearch: true }, function () {

                    createSearchAutocomplete.call(self);

                    self.layers.forEach(function (layer) {
                        self.renderBranch(layer, callback, resolve);
                    });
                });
            }
        }));
    };

    ctlProto.getLayerRootNode = function (layer) {
        const self = this;
        var result = null;
        if (!layer.isBase) {
            var url = layer.options.url;
            if (self._roots) {
                self._roots.forEach(function (li) {
                    const lyr = self.getLayer(li.dataset.layerId);
                    if (lyr && lyr.type === layer.type && lyr.options.url === url) {
                        result = li;
                    }
                });
            }
        }
        return result;
    };

    ctlProto.getLayerNodes = function (layer) {
        const self = this;
        const result = [];
        const rootNode = self.getLayerRootNode(layer);
        if (rootNode) {
            for (var i = 0; i < layer.names.length; i++) {
                const liLayer = rootNode.querySelector('li[data-layer-name="' + layer.names[i] + '"]');
                if (!liLayer) {
                    continue;
                }
                result[result.length] = liLayer;
                liLayer.querySelectorAll('li').forEach(function (li) {
                    result[result.length] = li;
                });
            }
        }
        return result;
    };

    ctlProto.showLayerInfo = function (layer, name) {
        const self = this;
        var result = null;

        var info = self.div.querySelector('.' + self.CLASS + '-info');

        const toggleInfo = function (layerName, infoObj) {
            var result = false;
            //if (lName !== undefined && lName.toString() === layerName) {
            //    info.dataset.layerName = '';
            //    $info.removeClass(TC.Consts.classes.HIDDEN);
            //}
            //else {
            if (infoObj) {
                result = true;
                info.dataset.layerName = layerName;
                info.classList.remove(TC.Consts.classes.HIDDEN);
                self.getRenderedHtml(self.CLASS + '-info', infoObj)
                    .then(function (out) {
                        info.innerHTML = out;
                        info.querySelector('.' + self.CLASS + '-info-close').addEventListener(TC.Consts.event.CLICK, function () {
                            self.hideLayerInfo();
                        })
                    })
                    .catch(function (err) {
                        TC.error(err);
                    });
            }
            //}
            return result;
        };

        self.div.querySelectorAll('.' + self.CLASS + '-btn-info, .' + self.CLASS + '-search-btn-info').forEach(function (btn) {
            btn.classList.remove(TC.Consts.classes.CHECKED);
        });

        const formatDescriptions = {};
        for (var i = 0, ii = self._roots.length; i < ii; i++) {
            const root = self._roots[i];
            if (root.dataset.layerId === layer.id) {
                const as = root.querySelectorAll('.' + self.CLASS + '-btn-info');
                for (var j = 0, jj = as.length; j < jj; j++) {
                    const a = as[j];
                    var n = a.parentElement.dataset.layerName;
                    if (n === name) {
                        const info = layer.wrap.getInfo(name);
                        if (info.metadata) {
                            info.metadata.forEach(function (md) {
                                md.formatDescription = formatDescriptions[md.format] =
                                    formatDescriptions[md.format] ||
                                    self.getLocaleString(TC.Util.getSimpleMimeType(md.format)) ||
                                    self.getLocaleString('viewMetadata');
                            });
                        }
                        const infoBtn = self.div.querySelector('li [data-layer-name="' + n + '"] > button.' + self.CLASS + '-btn-info');
                        infoBtn.classList.toggle(TC.Consts.classes.CHECKED, toggleInfo(n, info));
                        result = info;
                        break;
                    }
                }
                break;
            }
        }

        return result;
    };

    ctlProto.update = function () {
        const self = this;
        self.sourceLayers.forEach(function (layer) {
            layer.getCapabilitiesPromise().then(function () {
                layer.compatibleLayers = layer.wrap.getCompatibleLayers(self.map.crs);

                const rootNode = self.getLayerRootNode(layer);
                if (rootNode) {
                    rootNode
                        .querySelectorAll('li[data-layer-name]')
                        .forEach(function (li) {
                            const name = li.dataset.layerName;
                            const span = li.querySelector('span.' + TC.Consts.classes.SELECTABLE);
                            if (layer.compatibleLayers.indexOf(name) < 0) {
                                span.classList.add(TC.Consts.classes.INCOMPATIBLE);
                                span.setAttribute('title', self.getLocaleString('reprojectionNeeded'));
                            }
                            else {
                                span.classList.remove(TC.Consts.classes.INCOMPATIBLE)
                                span.removeAttribute('title');
                            }
                        });
                }
            });
        });
    };

    ctlProto.hideLayerInfo = function () {
        var self = this;
        self.div.querySelectorAll('.' + self.CLASS + '-btn-info, .' + self.CLASS + '-search-btn-info').forEach(function (btn) {
            btn.classList.remove(TC.Consts.classes.CHECKED);
        });
        self.div.querySelector('.' + self.CLASS + '-info').classList.add(TC.Consts.classes.HIDDEN);
    };

    ctlProto.addLayer = function (layer) {
        const self = this;
        return new Promise(function (resolve, reject) {
            var fromLayerCatalog = [];

            if (self.options.layers && self.options.layers.length) {
                fromLayerCatalog = self.options.layers.filter(function (l) {
                    var getMap = TC.Util.reqGetMapOnCapabilities(l.url);
                    return getMap && getMap.replace(TC.Util.regex.PROTOCOL) == layer.url.replace(TC.Util.regex.PROTOCOL);
                });
            }

            if (fromLayerCatalog.length == 0)
                fromLayerCatalog = self.layers.filter(function (l) {
                    return l.url.replace(TC.Util.regex.PROTOCOL) == layer.url.replace(TC.Util.regex.PROTOCOL);
                });

            if (fromLayerCatalog.length == 0) {
                self.layers.push(layer);
                layer.getCapabilitiesPromise().then(function () {
                    layer.compatibleLayers = layer.wrap.getCompatibleLayers(self.map.crs);
                    layer.title = layer.title || layer.wrap.getServiceTitle();
                    self.renderBranch(layer, function () {
                        resolve(); //ver linea 55 y por ahí
                    });
                });
            } else { resolve(); }
        });
    };

    ctlProto.getLayer = function (id) {
        const self = this;
        for (var i = 0, len = self.layers.length; i < len; i++) {
            const layer = self.layers[i];
            if (layer.id === id) {
                // 10/04/2019 GLS: validamos si es una capa que viene de configuración o es un WMS externo o por estado 
                // para decidir si mostramos el título del servicio o no
                var configLayer = self.options.layers.filter(l => l.id === id);

                if (configLayer.length > 0) {
                    layer.hideTitle = layer.options.hideTitle = configLayer[0].hideTitle;
                } else {
                    layer.hideTitle = layer.options.hideTitle = false;
                }                
                
                return layer;
            }
        }
        return null;
    };

    ctlProto.addLayerToMap = function (layer, layerName) {
        const self = this;
        const layerOptions = TC.Util.extend({}, layer.options);
        layerOptions.id = self.getUID();
        layerOptions.layerNames = [layerName];
        layerOptions.title = layer.title;
        const newLayer = new TC.layer.Raster(layerOptions);
        if (newLayer.isCompatible(self.map.crs)) {
            self.map.addLayer(layerOptions);
        }
        else {
            showProjectionChangeDialog(self, newLayer);
        }
    };

    ctlProto.loaded = function () {
        return this._readyPromise;
    };

    ctlProto.getAvailableCRS = function (options) {
        const self = this;
        options = options || {};
        return self.map.getCompatibleCRS({
            layers: self.map.workLayers.concat(self.map.baseLayer, options.layer),
            includeFallbacks: true
        });
    };

    ctlProto.setProjection = function (options) {
        const self = this;
        options = options || {};

        TC.loadProjDef({
            crs: options.crs,
            callback: function () {
                self.map.setProjection(options).then(function () {
                    if (self._layerToAdd) {
                        self.map.addLayer(self._layerToAdd);
                    }
                    TC.Util.closeModal();
                });
            }
        });
    };

    ctlProto.showProjectionChangeDialog = function (options) {
        const self = this;
        self._layerToAdd = options.layer;
        TC.control.ProjectionSelector.prototype.showProjectionChangeDialog.call(self, options);
    };

})();
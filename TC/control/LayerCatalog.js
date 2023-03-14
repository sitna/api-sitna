
/**
  * Opciones de control de catálogo de capas disponibles. 
  * 
  * Con este control se dispone de las siguientes funcionalidades:
  *
  *    - Consultar las capas disponibles en uno o varios WMS.
  *    - Buscar capas mediante texto libre. Se busca el texto en los títulos y los resúmenes descriptivos de cada capa, que se publican en el [documento de capacidades](https://github.com/7o9/implementer-friendly-standards/blob/master/introduction.rst#getcapabilities) del servicio.
  *    - Añadir capas al mapa como capas de trabajo.
  * @typedef LayerCatalogOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {boolean} [enableSearch] - Propiedad que establece si se puede buscar capas por texto. La búsqueda del texto se realiza en los títulos 
  * y los resúmenes descriptivos de cada capa, que se publican en el [documento de capacidades](https://github.com/7o9/implementer-friendly-standards/blob/master/introduction.rst#getcapabilities) del servicio.
  * @property {LayerOptions[]} layers - Lista de objetos de definición de las con capas de servicios WMS que queremos añadir al catálogo.
  * 
  * En estos objetos, si se asigna un valor a la propiedad `layerNames`, solo las capas especificadas y sus hijas estarán disponibles para ser añadidas al mapa. 
  * Sin embargo, si esta propiedad se deja sin asignar, todas las capas publicadas en el servicio WMS estarán disponibles para ser añadidas.
  * @example <caption>[Ver en vivo](../examples/cfg.MapControlOptions.layerCatalog_workLayerManager.html)</caption> {@lang html}
  * <div id="mapa"></div>
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Añadimos el control de capas cargadas en la primera posición.
  *     SITNA.Cfg.controls.workLayerManager = {
  *         div: "slot1"
  *     };
  *     // Establecemos un proxy porque se hacen peticiones a otro dominio.
  *     SITNA.Cfg.proxy = "proxy/proxy.ashx?";
  *     // Añadimos en la segunda posición el catálogo de capas con dos servicios.
  *     SITNA.Cfg.controls.layerCatalog = {
  *         div: "slot2",
  *         enableSearch: true,
  *         layers: [
  *             {
  *                 id: "idena",
  *                 title: "IDENA",
  *                 hideTitle: true,
  *                 type: SITNA.Consts.layerType.WMS,
  *                 url: "//idena.navarra.es/ogc/wms",
  *                 hideTree: false
  *             },
  *             {
  *                 id: "sismica",
  *                 title: "Información sísmica y volcánica",
  *                 type: SITNA.Consts.layerType.WMS,
  *                 url: "//www.ign.es/wms-inspire/geofisica",
  *                 layerNames: ["Ultimos10dias", "Ultimos30dias", "Ultimos365dias"],
  *                 hideTree: false
  *             }
  *         ]
  *     };
  *     var map = new SITNA.Map("mapa");
  * </script>
  */

import TC from '../../TC';
import Consts from '../Consts';
import ProjectionSelector from './ProjectionSelector';
import autocomplete from '../ui/autocomplete';

TC.control = TC.control || {};
TC.UI = TC.UI || {};
TC.UI.autocomplete = autocomplete;
TC.control.ProjectionSelector = ProjectionSelector;

(function () {

    TC.control.LayerCatalog = function () {
        var self = this;

        self.layers = [];
        self.searchInit = false;

        TC.control.ProjectionSelector.apply(self, arguments);

        self._selectors = {
            LAYER_ROOT: 'div.' + self.CLASS + '-tree > ul.' + self.CLASS + '-branch > li.' + self.CLASS + '-node'
        };

        if (!Consts.classes.SELECTABLE) {
            Consts.classes.SELECTABLE = 'tc-selectable';
        }
        if (!Consts.classes.INCOMPATIBLE) {
            Consts.classes.INCOMPATIBLE = 'tc-incompatible';
        }
        if (!Consts.classes.ACTIVE) {
            Consts.classes.ACTIVE = 'tc-active';
        }
    };

    TC.inherit(TC.control.LayerCatalog, TC.control.ProjectionSelector);

    var ctlProto = TC.control.LayerCatalog.prototype;

    ctlProto.CLASS = 'tc-ctl-lcat';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-lcat.hbs";
    ctlProto.template[ctlProto.CLASS + '-branch'] = TC.apiLocation + "TC/templates/tc-ctl-lcat-branch.hbs";
    ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/tc-ctl-lcat-node.hbs";
    ctlProto.template[ctlProto.CLASS + '-info'] = TC.apiLocation + "TC/templates/tc-ctl-lcat-info.hbs";
    ctlProto.template[ctlProto.CLASS + '-results'] = TC.apiLocation + "TC/templates/tc-ctl-lcat-results.hbs";
    ctlProto.template[ctlProto.CLASS + '-results-path'] = TC.apiLocation + "TC/templates/tc-ctl-lcat-results-path.hbs";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-lcat-dialog.hbs";

    const showProjectionChangeDialog = function (ctl, layer) {
        ctl.showProjectionChangeDialog({
            layer: layer,
            closeCallback: function () {
                ctl.getLayerNodes(ctl._layerToAdd).forEach(function (node) {
                    node.classList.remove(Consts.classes.LOADING);
                    node.querySelector('span').dataset.tooltip = ctl.getLocaleString('clickToAddToMap');
                });
            }
        });
    };

    var SEARCH_MIN_LENGTH = 3;

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.control.ProjectionSelector.prototype.register.call(self, map);

        const load = function (resolve, _reject) {
            if (Array.isArray(self.options.layers)) {
                for (var i = 0; i < self.options.layers.length; i++) {
                    var layer = self.options.layers[i];
                    if (!layer.type || layer.type === Consts.layerType.WMS) {
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
                    map.off(Consts.event.LAYERUPDATE, waitLoad);
                }
            };

            map.loaded(function () {
                if (!map.baseLayer.state || map.baseLayer.state === TC.Layer.state.IDLE) {
                    load(resolve, reject);
                }
                else {
                    map.on(Consts.event.LAYERUPDATE, waitLoad);
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

        /*
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
                            node.classList.add(Consts.classes.CHECKED);
                            node.querySelector('span').dataset.tooltip = self.getLocaleString('layerAlreadyAdded');
                        });
                    }
                }
            }
        };

        var clickToAddText = self.getLocaleString('clickToAddToMap');

        map
            .on(Consts.event.BEFORELAYERADD + ' ' + Consts.event.BEFOREUPDATEPARAMS, function (e) {
                self.getLayerNodes(e.layer).forEach(function (node) {
                    node.classList.add(Consts.classes.LOADING);
                    delete node.querySelector('span').dataset.tooltip;
                });
            })
            .on(Consts.event.LAYERADD + ' ' + Consts.event.UPDATEPARAMS, function (e) {
                const layer = e.layer;
                if (!layer.isBase && layer.type === Consts.layerType.WMS) {
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
            .on(Consts.event.LAYERERROR, function (e) {
                const reason = e.reason;
                if (self.layers.some(f => f === e.layer)) {
                    if (reason) {
                        TC.alert(self.getLocaleString(reason, { url: e.layer.url }));
                    }
                    self.getLayerNodes(e.layer).forEach(function (node) {
                        node.classList.remove(Consts.classes.LOADING);
                    });
                }                
            })
            .on(Consts.event.LAYERREMOVE, function (e) {
                const layer = e.layer;
                self.getLayerNodes(layer).forEach(function (node) {
                    node.classList.remove(Consts.classes.CHECKED);
                    node.querySelector('span').dataset.tooltip = clickToAddText;
                });
                findResultNodes(layer).forEach(function (node) {
                    node.classList.remove(Consts.classes.CHECKED);
                    node.querySelector('h5').dataset.tooltip = clickToAddText;
                });

                //Marcamos como añadidas aquellas capas que estén en el control de capas cargadas. Esto previene que si borramos una capa padre, todas
                //sus hijas aparezcan como no añadidas, a pesar que que alguna de ellas haya sido añadida previamente de manera individual
                _markWorkLayersAsAdded(layer);

                //refresh del searchList            
                _refreshResultList.call(self);
            })
            .on(Consts.event.EXTERNALSERVICEADDED, function (e) {
                if (e && e.layer) {
                    self.addLayer(e.layer);
                    self.div.classList.remove(Consts.classes.COLLAPSED);
                }
            })
            .on(Consts.event.PROJECTIONCHANGE, function (_e) {
                self.update();
            });

        return result;
    };

    const onCollapseButtonClick = function (e) {
        e.target.blur();
        e.stopPropagation();
        const li = e.target.parentElement;
        if (li.tagName === 'LI' && !li.classList.contains(ctlProto.CLASS + '-leaf')) {
            li.classList.toggle(Consts.classes.COLLAPSED);
            const ul = li.querySelector('ul');
            ul.classList.toggle(Consts.classes.COLLAPSED);
        }
    };

    const onSpanClick = function (e, ctl, getLayerObject) {
        const li = e.target.parentNode;
        if (!li.classList.contains(Consts.classes.LOADING) && !li.classList.contains(Consts.classes.CHECKED)) {
            e.preventDefault;

            var layerName = li.dataset.layerName;
            layerName = layerName !== undefined ? layerName.toString() : '';
            var layer = getLayerObject.call(ctl,li);            
            if (layer && layerName) {
                var redrawTime = 1;

                if (/iPad/i.test(navigator.userAgent))
                    redrawTime = 10;
                else if (TC.Util.detectFirefox())
                    redrawTime = 250;

                if (!layer.title) {
                    layer.title = layer.getTree().title;
                }

                li.classList.add(Consts.classes.LOADING);
                li.querySelector('span,h5').dataset.tooltip = '';

                const reDraw = function (element) {
                    return new Promise(function (resolve, _reject) {
                        setTimeout(function () {
                            element.setAttribute('offsetHeight', element.offsetHeight);
                            element.setAttribute('offsetWidth', element.offsetWidth);

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
        self.textInput.addEventListener('mouseup', function (_e) {
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

        TC.UI.autocomplete.call(self.textInput, {
            link: '#',
            target: self.list,
            minLength: 0,
            source: function (text, callback) {
                //lista de capas marcadas
                layerCheckedList = [];
                self._roots.forEach(function (root) {
                    root.querySelectorAll("li." + Consts.classes.CHECKED).forEach(function (item) {
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
                        for (var i = 0, ii = self.sourceLayers.length; i < ii; i++) {
                            const sourceLayer = self.sourceLayers[i];
                            var _founds = sourceLayer.searchSubLayers(text);
                            if (_founds.length) {
                                results.push({
                                    service: {
                                        id: sourceLayer.id,
                                        title: sourceLayer.title || sourceLayer.id
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
                            data.results.servicesFound[k].service.isCollapsed = self.div.querySelectorAll(".tc-ctl-lcat-search-group")[k].classList.contains(Consts.classes.COLLAPSED);
                        }
                    }
                }
                var ret = '';
                self.getRenderedHtml(self.CLASS + '-results', data.results).then(function (out) {
                    //URI: Expresión regular que busca la cadena de filtrado pero distinguiend si se trata de un titulo de capa es decier está entre
                    //caracteres > y < y no se trada de un atributo data
                    const cojoExpRegular = new RegExp('(?<pre>[\\;|\\>][\\w\\s\\\\r\\\\n\\t\\\\(À-ÿ]*)(?<match>' + TC.Util.patternFn(self.textInput.value) + ')(?<post>[\\w\\s\\\\r\\n\\t\\\\À-ÿ)]*[\\<|\\&])', 'gi')
                    container.innerHTML = ret = out.replace(cojoExpRegular,"$<pre><strong>$<match></strong>$<post>");
                    // Marcamos el botón "i" correspondiente si el panel de info está abierto
                    const visibleInfoPane = self.div.querySelector(`.${self.CLASS}-info`);
                    if (visibleInfoPane) {
                        const serviceId = visibleInfoPane.dataset.serviceId;
                        const layerName = visibleInfoPane.dataset.layerName;
                        let selector = `li[data-layer-name="${layerName}"] input[type="checkbox"].${self.CLASS}-search-btn-info`;
                        if (self.sourceLayers.length > 1) {
                            selector = `li[data-service-id="${serviceId}"] ${selector}`;
                        }
                        const infoCheckbox = container.querySelector(selector);
                        if (infoCheckbox) {
                            infoCheckbox.checked = true;
                        }
                    }
                });
                return ret;
            }
        });


        if (!self.searchInit) {
            //botón de la lupa para alternar entre búsqueda y árbol
            self.div.querySelector('h2 button').addEventListener(Consts.event.CLICK, function (e) {
                e.target.blur();
                
                const searchPane = self.div.querySelector('.' + self.CLASS + '-search');
                const treePane = self.div.querySelector('.' + self.CLASS + '-tree');
                const infoPane = self.div.querySelector('.' + self.CLASS + '-info');

                const searchPaneMustShow = searchPane.classList.contains(Consts.classes.HIDDEN);
                searchPane.classList.toggle(Consts.classes.HIDDEN, !searchPaneMustShow);
                treePane.classList.toggle(Consts.classes.HIDDEN, searchPaneMustShow);
                e.target.classList.toggle(self.CLASS + '-btn-tree', searchPaneMustShow);
                e.target.classList.toggle(self.CLASS + '-btn-search', !searchPaneMustShow);
                if (searchPaneMustShow) {
                    self.textInput.focus();
                    e.target.setAttribute('title', self.getLocaleString('viewAvailableLayersTree'));
                }
                else {
                    e.target.setAttribute('title', self.getLocaleString('searchLayersByText'));

                    //Si hay resaltados en el árbol, mostramos el panel de info
                    const selectedCount = self.div.querySelectorAll('.tc-ctl-lcat-tree li input[type=checkbox]:checked').length;
                    if (selectedCount > 0) {
                        infoPane.classList.remove(Consts.classes.HIDDEN);
                    }
                }
            }, { passive: true });


            //evento de expandir nodo de info
            //self._$div.off("click", ".tc-ctl-lcat-search button");                        
            self.div.addEventListener("change", TC.EventTarget.listenerBySelector("." + self.CLASS + "-search input[type=checkbox]." + self.CLASS + "-search-btn-info", function (evt) {
                evt.stopPropagation();
                const target = evt.target;
                if (target.checked) {
                    const li = target.parentElement;
                    var parent = li;
                    do {
                        parent = parent.parentElement;
                    }
                    while (parent && parent.tagName !== 'LI');
                    self.showLayerInfo(self.layers.length > 1 ? self.layers.filter(l => l.id === parent.dataset.serviceId)[0] : self.layers[0], li.dataset.layerName);

                } else {
                    self.hideLayerInfo();
                }
            }));

            self.div.addEventListener("click", TC.EventTarget.listenerBySelector("." + self.CLASS + "-search input[type=checkbox]." + self.CLASS + "-search-btn-info", function (evt) {
                evt.stopPropagation();
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
                    li.classList.toggle(Consts.classes.COLLAPSED);
                    return;
                }
                onSpanClick(evt, self, function () {
                    if (this.layers.length === 1) {
                        return this.layers[0];
                    }
                    return this.getLayer(li.closest(".tc-ctl-lcat-search-group") && li.closest(".tc-ctl-lcat-search-group").dataset.serviceId);
                });               
               
            }));

            self.searchInit = true;
        }
    };

    const getLayerTree = function (layer) {
        var result = layer.getTree();
        const makeNodeVisible = function makeNodeVisible(node) {
            var childrenVisible = false;
            for (var i = 0; i < node.children.length; i++) {
                if (makeNodeVisible(node.children[i])) {
                    childrenVisible = true;
                }
            }
            if (Object.prototype.hasOwnProperty.call(node, 'isVisible')) {
                node.isVisible = !layer.names || !layer.names.length || childrenVisible || node.isVisible;
            }
            return node.isVisible;
        };
        const expandNode = function (node, level) {
            if (layer.options.expandedNodeLevel > level) {
                node.expanded = true;
                for (var i = 0; i < node.children.length; i++) {
                    expandNode(node.children[i], level + 1);
                }
            }
        };
        makeNodeVisible(result);
        expandNode(result, 0);
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

        const lisToCheck = self.map.workLayers
            .filter(l => l.type === layer.type && l.url === layer.url) // Capas del mismo servicio
            .map(l => self.getLayerNodes(l)) // Elementos li de esas capas
            .flat();
        lisToCheck.forEach(function (node) {
            node.classList.remove(Consts.classes.LOADING);
            node.classList.add(Consts.classes.CHECKED);
            node.querySelector('span').dataset.tooltip = self.getLocaleString('layerAlreadyAdded');
        });
        self.getLayerRootNode(layer).querySelectorAll("li.tc-ctl-lcat-node.tc-ctl-lcat-leaf.tc-checked").forEach(function (node) {
            if (!lisToCheck.find(n => n === node)) {
                node.classList.remove(Consts.classes.CHECKED);
                node.querySelector('span').dataset.tooltip=self.getLocaleString('clickToAddToMap');
            }
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
                onSpanClick(e, self, function (li) {
                    for (var i = 0, len = this._roots.length; i < len; i++) {
                        const root = this._roots[i];
                        if (root.contains(li)) {
                            return this.getLayer(root.dataset.layerId);
                        }
                    }
                    return self.getLayer(li.dataset.layerId);
                });
            });
        });

        self._roots = self.div.querySelectorAll(self._selectors.LAYER_ROOT);                
        
        node.dataset.layerId = layer.id;

        node.querySelectorAll('.' + self.CLASS + '-btn-info').forEach(function (a) {
            const span = a.parentElement.querySelector('span');
            const name = a.parentElement.dataset.layerName;
            if (name) {
                span.classList.add(Consts.classes.SELECTABLE);
                var info = layer.getInfo(name);
                if (!Object.prototype.hasOwnProperty.call(info, 'abstract') &&
                    !Object.prototype.hasOwnProperty.call(info, 'legend') &&
                    !Object.prototype.hasOwnProperty.call(info, 'metadata')) {
                    a.parentElement.removeChild(a);
                }
                else {                    
                    a.addEventListener('change', function (e) {
                        e.stopPropagation();
                        const elm = this;
                        if (elm.checked) {
                            self.showLayerInfo(layer, name);
                        } else {
                            self.hideLayerInfo();
                        }
                    }, { passive: true });
                    a.addEventListener(Consts.event.CLICK, function (e) {
                        e.stopPropagation();
                    }, { passive: true });
                }
                if (layer.compatibleLayers && layer.compatibleLayers.indexOf(name) < 0) {
                    span.classList.add(Consts.classes.INCOMPATIBLE);
                    span.setAttribute('title', self.getLocaleString('reprojectionNeeded'));
                    //console.log("capa " + name + " incompatible");
                }
                if (self.map) {
                    for (var j = 0, len = self.map.workLayers.length; j < len; j++) {
                        var wl = self.map.workLayers[j];
                        if (wl.type === Consts.layerType.WMS && wl.url === layer.url && wl.names.length === 1 && wl.names[0] === name) {
                            span.parentElement.classList.add(Consts.classes.CHECKED);
                            span.dataset.tooltip = self.getLocaleString('layerAlreadyAdded');
                        }
                    }
                }
            }
            else {
                a.addEventListener('change', function (e) {
                    e.stopPropagation();
                    const elm = this;
                    if (elm.checked) {
                        self.showLayerInfo(layer, name, span.innerText);
                    } else {
                        self.hideLayerInfo();
                    }
                }, { passive: true });

                a.addEventListener(Consts.event.CLICK, function (e) {
                    e.stopPropagation();
                }, { passive: true });
            }
        });        

        setCheckedLayersOnNode.call(self);

        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;
        });
    };

    ctlProto.renderBranch = function (layer, callback, promiseRenderResolve) {
        const self = this;

        self.sourceLayers.unshift(layer);
        layer.getCapabilitiesPromise()
            .then(function (_result) {

                self.getRenderedHtml(self.CLASS + '-branch', getLayerTree(this), function (html) {
                    var template = document.createElement('template');
                    template.innerHTML = html;

                    const branch = self.div.querySelector('.' + self.CLASS + '-branch');
                    var newChild = template.content ? template.content.firstChild : template.firstChild;
                    var oldChild = branch.querySelector('li.' + self.CLASS + '-loading-node[data-layer-id="' + this.id + '"]');

                    if (oldChild) {
                        branch.replaceChild(newChild, oldChild);
                    } else {
                        branch.insertAdjacentElement('afterbegin', newChild);
                    }

                    addLogicToNode.call(self, newChild, this);

                    if (branch.childElementCount === 1) {
                        promiseRenderResolve();
                    }

                    if (TC.Util.isFunction(callback)) {
                        // pasamos el callback el item 
                        callback(self.sourceLayers[self.sourceLayers.map(l => l && l.id).indexOf(this.id)]);
                    }

                }.bind(this));

            }.bind(layer))
            .catch(function (_error) {
                var index = self.layers.map(l => l.id).indexOf(this.id);
                self.layers.splice(index, 1);

                var errorMessage = self.getLocaleString("lyrCtlg.errorLoadingNode", { serviceName: this.title });
                var liError = self.div.querySelector('.' + self.CLASS + '-branch').querySelector('li.' + self.CLASS + '-loading-node[data-layer-id="' + this.id + '"]');
                liError.classList.add('tc-error');
                liError.setAttribute('title', errorMessage);

                self.map.toast(errorMessage, { type: Consts.msgType.ERROR });

            }.bind(layer));
    };

    ctlProto.render = function (callback) {
        const self = this;

        self.sourceLayers = [];

        return self._set1stRenderPromise(new Promise(function (resolve, _reject) {
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
                    if (lyr && lyr.type === layer.type && lyr.options.url.toLowerCase() === url.toLowerCase()) {
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
                result.push(liLayer);
                liLayer.querySelectorAll('li').forEach(function (li) {
                    result.push(li);
                });
            }
        }
        return result;
    };

    ctlProto.showLayerInfo = function (layer, name, title) {
        const self = this;
        var result = null;

        var info = self.div.querySelector('.' + self.CLASS + '-info');

        const toggleInfo = function (layerName, infoObj) {
            var result = false;
            //if (lName !== undefined && lName.toString() === layerName) {
            //    info.dataset.layerName = '';
            //    $info.removeClass(Consts.classes.HIDDEN);
            //}
            //else {
            if (infoObj) {
                result = true;
                info.dataset.serviceId = layer.id;
                info.dataset.layerName = layerName;
                info.classList.remove(Consts.classes.HIDDEN);
                self.getRenderedHtml(self.CLASS + '-info', infoObj)
                    .then(function (out) {
                        info.innerHTML = out;
                        info.querySelector('.' + self.CLASS + '-info-close').addEventListener(Consts.event.CLICK, function () {
                            self.hideLayerInfo();
                        }, { passive: true });
                    })
                    .catch(function (err) {
                        TC.error(err);
                    });
            }
            //}
            return result;
        };

        self.div.querySelectorAll('.' + self.CLASS + '-btn-info, .' + self.CLASS + '-search-btn-info').forEach(function (btn) {
            btn.checked = false;
        });        

        const getInfoByTitle = function (layer, title) {
            if (layer.Title === title) {
                return {
                    title: title,
                    abstract: layer.Abstract,
                    metadata: !layer.MetadataURL ? null : layer.MetadataURL.reduce(function (vi, va) {
                        vi.push({
                            format: va.Format,
                            formatDescription: TC.Util.getLocaleString(self.map.options.locale, TC.Util.getSimpleMimeType(va.Format)) ||
                                TC.Util.getLocaleString(self.map.options.locale, 'viewMetadata'),
                            type: va.type,
                            url: va.OnlineResource
                        });
                        return vi;
                    }, [])
                };
            }
            if (layer.Layer) {
                for (var i = 0; i < layer.Layer.length; i++) {
                    const res = getInfoByTitle(layer.Layer[i], title);
                    if (res) {
                        return res;
                    }
                }
            }
        };

        for (var i = 0, ii = self._roots.length; i < ii; i++) {
            const root = self._roots[i];
            if (root.dataset.layerId === layer.id) {
                const infoToggles = root.querySelectorAll('.' + self.CLASS + '-btn-info');
                for (var j = 0, jj = infoToggles.length; j < jj; j++) {
                    const infoToggle = infoToggles[j];
                    var n = infoToggle.parentElement.dataset.layerName;
                    if (name && n === name) {
                        const info = layer.getInfo(name);
                        const infoBtn = self.div.querySelector('li[data-layer-name="' + n + '"] > input[type="checkbox"].' + self.CLASS + '-btn-info');
                        infoBtn.checked = toggleInfo(n, info);
                        const infoSearchBtn = self.div.querySelector('li[data-layer-name="' + n + '"] > input[type="checkbox"].' + self.CLASS + '-search-btn-info');
                        if (infoSearchBtn) {
                            infoSearchBtn.checked = infoBtn.checked;
                        }
                        result = info;
                        break;
                    }
                    const t = infoToggle.parentElement.querySelector('span').innerText;
                    if (!name && title && t === title){
                        //buscar en el capapabilities por nombre de capa;
                        const info = getInfoByTitle(layer.capabilities.Capability.Layer, title);
                        //const infoBtn = self.div.querySelector('li [data-layer-name="' + n + '"] > button.' + self.CLASS + '-btn-info');
                        infoToggle.checked = toggleInfo(t, info);
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
                            const span = li.querySelector('span.' + Consts.classes.SELECTABLE);
                            if (layer.compatibleLayers.indexOf(name) < 0) {
                                span.classList.add(Consts.classes.INCOMPATIBLE);
                                span.setAttribute('title', self.getLocaleString('reprojectionNeeded'));
                            }
                            else {
                                span.classList.remove(Consts.classes.INCOMPATIBLE);
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
            btn.checked = false;
        });
        const infoPanel = self.div.querySelector('.' + self.CLASS + '-info');
        delete infoPanel.dataset.serviceId;
        delete infoPanel.dataset.layerName;
        infoPanel.classList.add(Consts.classes.HIDDEN);
    };

    ctlProto.addLayer = function (layer) {
        const self = this;
        return new Promise(function (resolve, _reject) {
            var fromLayerCatalog = [];

            if (self.options.layers && self.options.layers.length) {
                fromLayerCatalog = self.options.layers.filter(function (l) {
                    var getMap = TC.Util.reqGetMapOnCapabilities(l.url);
                    return getMap && getMap.replace(TC.Util.regex.PROTOCOL) === layer.url.replace(TC.Util.regex.PROTOCOL);
                });
            }

            if (fromLayerCatalog.length === 0)
                fromLayerCatalog = self.layers.filter(function (l) {
                    return l.url.replace(TC.Util.regex.PROTOCOL) === layer.url.replace(TC.Util.regex.PROTOCOL);
                });

            if (fromLayerCatalog.length === 0) {
                self.layers.unshift(layer);
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
        layerOptions.hideTree = true;
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

const LayerCatalog = TC.control.LayerCatalog;
export default LayerCatalog;
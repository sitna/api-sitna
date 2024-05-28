import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import TOC from './TOC';
import Button from '../../SITNA/ui/Button';
import '../../SITNA/ui/Toggle';
import MapContents from './MapContents';
import Vector from '../../SITNA/layer/Vector';
import itemToolContainer from './itemToolContainer';
import { LayerLegend, CreateSymbolizer } from './LayerLegend';
import ImageMagnifier from './ImageMagnifier';

TC.control = TC.control || {};

Consts.classes.DRAG = Consts.classes.DRAG || 'tc-drag';
Consts.classes.DRAGEND = Consts.classes.DRAGEND || 'tc-dragend';
Consts.event.TOOLSOPEN = Consts.event.TOOLSOPEN || 'toolsopen.tc';

//const fileOriginCompare = async function (l1, l2) {
//    if (l1._fileHandle && l2._fileHandle) {
//        return l1._fileHandle == l2._fileHandle;
//        //const aaa = (await l1._fileHandle.isSameEntry(l2._fileHandle));
//        //return aaa;
//    }

//    else
//        return l1._timeStamp === l2._timeStamp
//};


class WorkLayerManager extends TOC {
    CLICKEVENT = 'click';
    #sortable;

    constructor() {
        super(...arguments);
        const self = this;

        self.layers = [];

        self.hidePath = self.options.hidePath  || false

        self._uiElementSelector = `ul > li.${self.CLASS}-elm`;
        self._toolContainerSelector = `.${self.CLASS}-tools`;

        self.addItemTool({
            renderFn: function (container, layerId) {
                const className = self.CLASS + '-btn-dl';

                let button = container.querySelector('sitna-button.' + className);
                if (!button) {
                    const layer = self.map.getLayer(layerId);
                    if (layer instanceof Vector) {
                        const text = self.getLocaleString('downloadFeatures');
                        button = new Button();
                        button.variant = Button.variant.MINIMAL;
                        button.text = text;
                        button.icon = Button.action.DOWNLOAD_ALL;
                        button.setAttribute('title', text);
                        button.dataset.layerId = layerId;
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
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-wlm.mjs');
        const elementTemplatePromise = import('../templates/tc-ctl-wlm-elm.mjs');
        const singleTemplatePromise = import('../templates/tc-ctl-wlm-type-sgl.mjs');
        const groupTemplatePromise = import('../templates/tc-ctl-wlm-type-grp.mjs');
        const groupNodeTemplatePromise = import('../templates/tc-ctl-wlm-type-grp-node.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-elm'] = (await elementTemplatePromise).default;
        template[self.CLASS + '-type-sgl'] = (await singleTemplatePromise).default;
        template[self.CLASS + '-type-grp'] = (await groupTemplatePromise).default;
        template[self.CLASS + '-type-grp-node'] = (await groupNodeTemplatePromise).default;
        self.template = template;
    }

    async render(callback, options) {
        const self = this;
        if (!self.map) {
            throw Error('Cannot render: control has no map');
        }
        await self.renderData(options ? Util.extend(self.map.getLayerTree(), options) : self.map.getLayerTree());
        self.addUIEventListeners();
        const Sortable = (await import('sortablejs')).default;
        self.map.workLayers
            .filter(function (layer) {
                return !layer.stealth;
            })
            .forEach(function (layer) {
                self.updateLayerTree(layer);
            });


        const ul = self.div.querySelector('ul');
        self.#sortable = Sortable.create(ul, {
            handle: '.' + self.CLASS + '-dd',
            animation: 150,
            onSort: function (e) {
                self.#moveLayer(e.item, e.oldIndex, e.newIndex);
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
                const sortableItems = self.#sortable.toArray();
                const buffer = sortableItems[oldIdx];
                sortableItems[oldIdx] = sortableItems[newIdx];
                sortableItems[newIdx] = buffer;
                self.#sortable.sort(sortableItems);
                self.#moveLayer(elm, oldIdx, newIdx);
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

        if (Util.isFunction(callback)) {
            callback();
        }
    }

    async register(map) {
        const self = this;
        await super.register(map);

        if (self.options.fileEditing) {
            await map.addControl('fileEdit', { caller: self, snapping: true });
        }

        map.loaded(function () {
            self.updateScale();
        });

        map
            .on(Consts.event.LAYEROPACITY, function (e) {
                const li = self.#findLayerElement(e.layer);
                if (li) {
                    li.querySelector('input[type=range]').value = Math.round(e.opacity * 100);
                }
            })
            .on(Consts.event.FEATURESIMPORT, function (e) {
                var fileName = e.fileName;
                if (e.features && e.features.length > 0) { // GLS: Escuchamos al evento FEATURESIMPORT para poder desplegar el control de capas cargadas
                    // Ignoramos los GPX (se supone que los gestionará Geolocation)
                    var pattern = '.' + Consts.format.GPX.toLowerCase();
                    if (e.fileName.toLowerCase().indexOf(pattern) === e.fileName.length - pattern.length) {
                        return;
                    }

                    map.one(Consts.event.LAYERADD, function (e) {
                        if (e && e.layer && e.layer.title === fileName) {
                            // Desplegamos el control capas cargadas
                            self.highlight();

                            // abrimos el panel de herramientas
                            self.map.trigger(Consts.event.TOOLSOPEN);
                        }
                    });
                }
            });
        if (!map.magnifier) {
            map.magnifier = new ImageMagnifier(3, {
                textToOpen: Util.getLocaleString(map.options.locale, "clickToEnlarge"),
                textToClose: Util.getLocaleString(map.options.locale, "clickToClose")
            });
            document.body.appendChild(map.magnifier);
        }
            
        return self;
    }

    onExternalServiceAdded(_e) {
        // Este control no tiene que aceptar servicios externos directamente
    }

    addUIEventListeners() {
        const self = this;

        self.div.addEventListener('change', TC.EventTarget.listenerBySelector(`sitna-toggle.${self.CLASS}-cb-visibility`, function (e) {
            // al estar en ipad el evento pasa a ser touchstart en la constante: Consts.event.CLICK, los checkbox no funcionan bien con este evento
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

        self.div.addEventListener('change', TC.EventTarget.listenerBySelector(`.${self.CLASS}-cb-info`, function (e) {
            const checkbox = e.target;
            var li = checkbox;
            do {
                li = li.parentElement;
            }
            while (li && li.tagName !== 'LI');
            const info = li.querySelector('.' + self.CLASS + '-info');
            const layer = self.map.getLayer(li.dataset.layerId);
            
            // Cargamos la imagen de la leyenda
            info.querySelectorAll('.' + self.CLASS + '-legend img, .' + self.CLASS + '-custom-legend img').forEach(async function (img) {                
                self.styleLegendImage(img, layer);
            });
            info.classList.toggle(Consts.classes.HIDDEN, !checkbox.checked);
        }));

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector(`.${self.CLASS}-btn-del:not(:disabled)`, function (e) {
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
            e.stopPropagation();
        }));

        self.div.addEventListener(self.CLICKEVENT, TC.EventTarget.listenerBySelector(`.${self.CLASS}-btn-more`, function (e) {
            const button = e.target;
            const container = button.parentElement;
            const isExpanded = container.classList.toggle('tc-expanded');
            button.text = self.getLocaleString(isExpanded ? 'collapse' : 'otherTools');
            button.iconText = isExpanded ? '\u2bc7' /* ⯇ */ : '\u2022\u2022\u2022' /* ••• */;
        }));
        return self;
    }

    updateLayerVisibility(layer) {
        const self = this;
        const li = self.#findLayerElement(layer);
        if (li) {
            const visible = layer.getVisibility();
            li.querySelector(`sitna-toggle.${self.CLASS}-cb-visibility`).checked = visible;
        }
    }
    
    updateLayerTree(layer) {
        const self = this;

        var getLegendImgByPost = async function (layer) {
            if (layer && layer.options.method && layer.options.method === "POST") {
                try {
                    const src = await layer.getLegendGraphicImage();
                    return src;
                }
                catch (err) {
                    TC.error(err);
                }
            }
        };

        if (!layer.isBase && !layer.options.stealth) {
            MapContents.prototype.updateLayerTree.call(self, layer);

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
                const layerTitle = layer.title || layer.wrap.getServiceTitle && layer.wrap.getServiceTitle();
                layer._title = layerTitle;
                var layerData = {
                    title: layer.hideTitle ? '' : layerTitle,
                    hide: layer.renderOptions && layer.renderOptions.hide ? true : false,
                    opacity: layer.renderOptions && layer.renderOptions.opacity ? layer.renderOptions.opacity * 100 : 100,
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
                    if(!self.hidePath)
                        layerData.path = path;
                    layerData.legend = [];
                    layerData.abstract = [];
                    layerData.metadata = [];
                    layer.names.forEach(function (name) {
                        var info = layer.getInfo(name);
                        info.legend && layerData.legend.push(info.legend);
                        info.abstract && layerData.abstract.push(info.abstract);
                        info.metadata && layerData.metadata.push(info.metadata);
                    });

                    const info = layer.getInfo();
                    layerData.hasInfo = Object.prototype.hasOwnProperty.call(info, 'abstract') ||
                        Object.prototype.hasOwnProperty.call(info, 'legend') ||
                        Object.prototype.hasOwnProperty.call(info, 'metadata');
                    
                }
                else {
                    layerData.hasExtent = true;
                    layerData.hasInfo = false;
                    layerData.path = [layer.getPath()];
                }

                getLegendImgByPost(layer).then(async function (_src) {

                    try {
                        const legendObject = layer.getLegend ? await layer.getLegend(true) : null;
                        if (legendObject) {

                            const legendObjets = legendObject//await layer.getLegend(true);
                            for (var i = 0; i < (legendObjets[0]?.length || 0); i++) {
                                if (!layerData.legend[0][i]) layerData.legend[0][i] = {};
                                if (legendObjets[0][i].rules)
                                    layerData.legend[0][i].symbols = await Promise.all(await legendObjets[0][i].rules
                                        .map(async (rule, index) => {
                                            return {
                                                src: await CreateSymbolizer(rule),
                                                title: rule.title || rule.name
                                            }
                                        }));
                                else if (legendObjets[0][i].src) {
                                    layerData.legend[0][i] = {
                                        src: legendObjets[0][i].src,
                                        title: legendObjets[0][i].title || legendObjets[0][i].name
                                    }
                                }

                              //  }

                            }
                        }
                    }
                    catch (ex) {
                        console.info(ex);
                    }

                    self.getRenderedHtml(self.CLASS + '-elm', layerData).then(function (out) {
                        const parser = new DOMParser();
                        const li = parser.parseFromString(out, 'text/html').body.firstChild;
                        var layerNode;
                        var isGroup = false;
                        var i;
                        if (isRaster) {
                            isGroup = layer.names.length > 1;
                            if (!isGroup) {
                                const name = layer.names[0];
                                const layerNodes = layer.wrap.getAllLayerNodes();
                                for (i = 0; i < layerNodes.length; i++) {
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
                            zoomBtn.addEventListener(Consts.event.CLICK, function (_e) {
                                self.map.zoomToLayer(li.dataset.layerId, { animate: true });
                            }, { passive: true });
                        }

                        if (layerNode) {
                            layer.wrap.normalizeLayerNode(layerNode);

                            self.getRenderedHtml(className, layerNode).then(function (out) {
                                var tip;

                                typeElm.addEventListener('mouseover', function (_e) {
                                    const mapDiv = self.map.div;
                                    const typeElmRect = typeElm.getBoundingClientRect();
                                    tip = document.createElement('div');
                                    tip.classList.add(self.CLASS + '-tip');
                                    tip.innerHTML = out;
                                    tip.style.top = typeElmRect.top - mapDiv.offsetTop + 'px';
                                    tip.style.right = mapDiv.offsetWidth - (typeElmRect.left - mapDiv.offsetLeft) + 'px';
                                    mapDiv.appendChild(tip);
                                });
                                typeElm.addEventListener('mouseout', function (_e) {
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

                        self.getItemTools().forEach(tool => self.addItemToolUI(li, tool));

                        var inserted = false;
                        for (i = 0; i < lis.length; i++) {
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
                        self.map.magnifier?.addNode(".tc-ctl-wlm-legend img",4);

                    });
                });

                var elligibleLayersNum = self.#getElligibleLayersNumber();
                const numElm = self.div.querySelector('.' + self.CLASS + '-n');
                const emptyElm = self.div.querySelector('.' + self.CLASS + '-empty');
                const contentElm = self.div.querySelector('.' + self.CLASS + '-content');
                numElm.textContent = elligibleLayersNum;
                if (elligibleLayersNum > 0) {
                    numElm.classList.add(Consts.classes.VISIBLE);
                    emptyElm.classList.add(Consts.classes.HIDDEN);
                    contentElm.classList.remove(Consts.classes.HIDDEN);
                }
                else {
                    numElm.classList.remove(Consts.classes.VISIBLE);
                    emptyElm.classList.remove(Consts.classes.HIDDEN);
                    contentElm.classList.add(Consts.classes.HIDDEN);
                }

                const deleteAllElm = self.div.querySelector('.' + self.CLASS + '-del-all');
                deleteAllElm.classList.toggle(Consts.classes.HIDDEN, !self.#shouldBeDelAllVisible());
            }
            else {
                const getFullTitle = function (layer) {
                    let layerTitle = layer.title || layer.wrap.getServiceTitle && layer.wrap.getServiceTitle();
                    const layerPath = layer.getPath();
                    if (layerPath.length) {
                        layerTitle = layerPath.join(' &rsaquo; ');
                    }
                    return layerTitle;
                };
                let layerTitle = getFullTitle(layer);
                //comprobar si hay capas con títulos repetidos
                const regExpConstr = function () {
                    return new RegExp(layer.id.replace(/([\w]*-\d)(-\d)*/gi, "$1-\\d"), "gi");
                };
                //filtramos las capas por aquellas que sean hermanas es decir file-1-[numero_fichero]-[numero capa] y busco la posición de la capa actual
                //en el array filtrado
                const index = (self.layers.filter((l) => getFullTitle(l) === layerTitle).reduce((vi, va) => {
                    const layerIdRoot = regExpConstr().exec(va.id) ? regExpConstr().exec(va.id)[0] : va.id;
                    return vi.indexOf(layerIdRoot) >= 0 ? vi : vi.concat(layerIdRoot);
                }, []).findIndex((l) => { const _match = /^[\w]*-\d-\d/gi.exec(layer.id); return l === (_match ? _match[0] : layer.id) }));
                //Si la posición es mayor que 0, añado el ordinal al titulo de capa
                if (index > 0) {
                    layer._title = layerTitle = layerTitle + " (" + (index + 1) + ")";
                }
                const prevLi = self.div.querySelector("ul li[data-layer-id='" + layer.id + "']");
                if (layer.features?.length) {
                    if (layer.features.some(f => f.getPath().length)) {
                        const mainTitleElm = prevLi.querySelector(".tc-ctl-wlm-lyr");
                        mainTitleElm.innerHTML = layerTitle;
                        mainTitleElm.title = mainTitleElm.textContent;
                        // Obtenemos las rutas de todas las entidades y eliminamos los duplicados
                        const uniquePaths = [...new Set(layer.features.map(f => f.getPath().join(' &rsaquo; ')))];
                        prevLi.querySelector(".tc-ctl-wlm-path").innerHTML = uniquePaths.join(' &bull; ');
                    }
                    else {
                        const secTitleElm = prevLi.querySelector(".tc-ctl-wlm-path");
                        secTitleElm.innerHTML = layerTitle;
                        secTitleElm.title = secTitleElm.textContent;
                    }
                }                
            }
        }
    }

    updateScale() {
        const self = this;
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
    }

    update() {
        const self = this;

        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);
            if (layer) {
                li.querySelector(`sitna-toggle.${self.CLASS}-cb-visibility`).checked = layer.getVisibility();
                layer.tree = null;
            }
        });

        self.updateScale();
    }

    updateLayerOrder(_layer, _oldIdx, _newIdx) {
        const self = this;
        self.map.workLayers
            .filter(function (layer) {
                return !layer.stealth;
            })
            .forEach(function (layer) {
                const li = self.#findLayerElement(layer);
                if (li) {
                    li.parentElement.firstChild.insertAdjacentElement('beforebegin', li);
                }
            });
    }

    removeLayer(layer) {
        const self = this;
        const idx = self.layers.indexOf(layer);
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
        var nChildren = self.#getElligibleLayersNumber();
        numberElm.textContent = nChildren;
        if (nChildren > 0) {
            contentElm.classList.remove(Consts.classes.HIDDEN);
            emptyElm.classList.add(Consts.classes.HIDDEN);
            numberElm.classList.add(Consts.classes.VISIBLE);
        }
        else {
            if (self.#shouldBeDelAllVisible()) {
                self.div.querySelector('.' + self.CLASS + '-del-all').classList.add(Consts.classes.HIDDEN);
            }
            contentElm.classList.add(Consts.classes.HIDDEN);
            emptyElm.classList.remove(Consts.classes.HIDDEN);
            numberElm.classList.remove(Consts.classes.VISIBLE);
        }
    }

    getLayerUIElements() {
        const self = this;
        return Array.from(self.div.querySelectorAll(`ul > li.${self.CLASS}-elm`));
    }

    #findLayerElement(layer) {
        this.getLayerUIElements().find(li => li.dataset.layerId === layer.id);
    }

    #shouldBeDelAllVisible = function () {
        return !this.layers.some(layer => layer.unremovable);
    }

    #getElligibleLayersNumber() {
        return this.layers.length;
    }

    #moveLayer = function (listItem, oldIndex, newIndex, callback) {
        const self = this;
        const layerItems = self.getLayerUIElements();
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
        const sourceLayer = self.map.getLayer(listItem.dataset.layerId);
        const targetLayer = self.map.getLayer(targetItem.dataset.layerId);
        const newIdx = self.map.layers.indexOf(targetLayer);
        if (newIdx >= 1 && newIdx < self.map.layers.length) {
            self.map.insertLayer(sourceLayer, newIdx, callback);
        }
    }
}

TC.mix(WorkLayerManager, itemToolContainer);

WorkLayerManager.prototype.CLASS = 'tc-ctl-wlm';
TC.control.WorkLayerManager = WorkLayerManager;
export default WorkLayerManager;
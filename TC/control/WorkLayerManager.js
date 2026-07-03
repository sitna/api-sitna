import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import TOC from './TOC.js';
import Button from '../../SITNA/ui/Button.js';
import '../../SITNA/ui/Toggle.js';
import MapContents from './MapContents.js';
import Vector from '../../SITNA/layer/Vector.js';
import itemToolContainer from './itemToolContainer.js';
import { CreateSymbolizer } from './LayerLegend.js';
import ImageMagnifier from './ImageMagnifier.js';
import Controller from '../Controller.js';
import Observer from '../Observer.js';

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

class WorkLayerManagerModel {
    constructor() {
        //super();        
        this.loadedLayers = "";
        this.removeAllLayersFromMap = "";
        this.noData = "";
    }
}
class WorkLayerManagerNodeModel {
    constructor() {
        //super();        
        this.infoFromThisLayer = "";
        this.visibilityOfThisLayer = "";
        this.zoomToLayerExtent = "";
        this.removeLayerFromMap = "";
        this.otherTools = "";
        this.transparencyOfThisLayer = "";
        this.abstract = "";
        this.content = "";
        this.metadata = "";
        this.dragToReorder = "";        
        this.editStyle = "";
        this.close = "";
    }
}
class WorkLayerManagerGroupModel {
    constructor() {
        //super();
        this.singleLayer = "";
        this.groupLayerThatContains = "";
    }
}

class WorkLayerManager extends TOC {
    CLICKEVENT = 'click';

    constructor() {
        super(...arguments);
        const self = this;

        self.layers = [];

        self.hidePath = self.options.hidePath  || false

        self._uiElementSelector = `ul > li.${self.CLASS}-elm`;
        self._toolContainerSelector = `.${self.CLASS}-tools`;
        self._addonsContainerSelector = `.${self.CLASS}-addonsContainer`;

        self.model = new WorkLayerManagerModel();

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

        self.groupModel = new WorkLayerManagerGroupModel();
        self.nodeModel = new WorkLayerManagerNodeModel();
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-wlm.mjs');
        const elementTemplatePromise = import('../templates/tc-ctl-wlm-elm.mjs');
        const elementInfoTemplatePromise = import('../templates/tc-ctl-wlm-elm-info.mjs');
        const elementInfoLegendTemplatePromise = import('../templates/tc-ctl-wlm-elm-info-legend.mjs');
        const singleTemplatePromise = import('../templates/tc-ctl-wlm-type-sgl.mjs');
        const groupTemplatePromise = import('../templates/tc-ctl-wlm-type-grp.mjs');
        const groupNodeTemplatePromise = import('../templates/tc-ctl-wlm-type-grp-node.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-elm'] = (await elementTemplatePromise).default;
        template[self.CLASS + '-elm-info'] = (await elementInfoTemplatePromise).default;
        template[self.CLASS + '-elm-info-legend'] = (await elementInfoLegendTemplatePromise).default;
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
        self.map.workLayers
            .filter(function (layer) {
                return !layer.stealth;
            })
            .forEach(function (layer) {
                if (options?.refresh) {
                    if (layer.renderOptions) {
                        layer.renderOptions.hide = !layer.getVisibility();
                        layer.renderOptions.opacity = layer.getOpacity();
                    }
                    else {
                        layer.renderOptions = { hide: !layer.getVisibility(), opacity : layer.getOpacity() };
                    }
                }
                    
                self.updateLayerTree(layer, options?.refresh || false);
            });


        const ul = self.div.querySelector('ul');

        Util.makeSortableList(self.div.querySelector('ul'), {
            handleSelector: `.${this.CLASS}-dd`,
            callback: (listItem, newIndex, oldIndex) => {
                if (newIndex > oldIndex) {
                    self.#moveLayer(listItem, oldIndex, newIndex - 1);
                }
                else if (newIndex < oldIndex) {
                    self.#moveLayer(listItem, oldIndex, newIndex + 1);
                }
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
            const listItems = self.getLayerUIElements();
            const swap = async function (oldIdx, newIdx) {
                const layerId = elm.dataset.layerId;
                await self.#moveLayer(elm, oldIdx, newIdx);
                const newElm = ul.querySelector(`[data-layer-id="${layerId}"]`);
                if (newElm) newElm.focus();
            };
            const elmIdx = listItems.indexOf(elm);
            switch (true) {
                case /Up$/.test(e.key):
                    if (elmIdx > 0) {
                        swap(elmIdx, elmIdx - 1);
                        e.stopPropagation();
                    }
                    break;
                case /Down$/.test(e.key):
                    if (elmIdx < listItems.length - 1) {
                        swap(elmIdx, elmIdx + 1);
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

        self.controller = new Controller(self.model, new Observer(self.div));

        if (Util.isFunction(callback)) {
            callback();
        }
    }

    async register(map) {
        const self = this;
        await super.register(map);

        if (!map.magnifier) {
            map.magnifier = new ImageMagnifier(3, {
                textToOpen: Util.getLocaleString(map.getLocale(), "clickToEnlarge"),
                textToClose: Util.getLocaleString(map.getLocale(), "clickToClose")
            });
            map.div.appendChild(map.magnifier);
        }

        if (self.options.fileEditing) {
            self.fileEdit = await map.addControl('fileEdit', { caller: self, snapping: true });
        }

        self.updateModel();

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
            })
            .on(Consts.event.LAYERVISIBILITY, function (e) { 
                const li = self.#findLayerElement(e.layer);
                if (li) {
                    li.querySelector('input[type=range]').disabled = !e.layer.getVisibility();
                }
            });
        
            
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
            //Si el slider esta en el contenedor de addons no escucho el evento
            if (self.div.querySelector(self._addonsContainerSelector).contains(e.target))
                return;
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
    
    async updateLayerTree(layer, refreshing) {
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

            const getTitle = (layer) => layer.title || layer.wrap.getServiceTitle && layer.wrap.getServiceTitle();

            var alreadyExists = false;
            for (const layerElm of self.layers) {
                if (layer === layerElm) {
                    alreadyExists = true;
                    break;
                }
            }

            if (!alreadyExists || refreshing) {
                if (!refreshing)
                    self.layers.push(layer);

                var domReadyPromise;
                const layerTitle = layer.title || layer.wrap.getServiceTitle && layer.wrap.getServiceTitle();
                layer._title = layerTitle;
                var layerData = {
                    title: layer.hideTitle ? '' : layerTitle,
                    hide: layer.renderOptions && layer.renderOptions.hide ? true : false,
                    opacity: layer.renderOptions && layer.renderOptions?.opacity >= 0 ? layer.renderOptions.opacity * 100 : 100,
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
                    if (!self.hidePath)
                        layerData.path = path;
                    layerData.legend = [];
                    layerData.abstract = [];
                    layerData.metadata = [];
                    layer.names.forEach(function (name) {
                        var info = layer.getInfo(name);
                        if (info.legend) layerData.legend = layerData.legend.concat(info.legend);
                        info.abstract && layerData.abstract.push(info.abstract);
                        info.metadata && layerData.metadata.push(info.metadata);
                    });

                    const info = layer.getInfo();
                    layerData.hasInfo = Object.hasOwn(info, 'abstract') ||
                        Object.hasOwn(info, 'legend') ||
                        Object.hasOwn(info, 'metadata');

                }
                else {
                    layerData.hasExtent = true;
                    layerData.hasInfo = 'styles' in layer;
                    const tree = layer.getTree();
                    layerData.legend = tree.legend;
                    layerData.children = tree.children;
                    layerData.path = [layer.getPath()];
                }

                await getLegendImgByPost(layer);

                try {
                    if (!layer.customLegend && layer.availableNames?.some((name) => layer.getInfo(name).legend?.length)) {
                        const legendObject = layer.getLegend ? await layer.getLegend(true) : null;
                        if (legendObject) {

                            const legendObjects = legendObject//await layer.getLegend(true);
                            for (let j = 0; j < (legendObjects?.length || 0); j++) {
                                for (let i = 0; i < (legendObjects[j]?.length || 0); i++) {
                                    let index = i + j;
                                    if (!layerData.legend[index]) layerData.legend[index] = {};
                                    if (legendObjects[j][i].rules) {
                                        layerData.legend[index].symbols = (await CreateSymbolizer(legendObjects[j][i].rules, layer)).map((obj) => { return { src: obj.src, title: obj.value } });
                                    }
                                    else if (legendObjects[j][i].src) {
                                        layerData.legend[index] = {
                                            src: legendObjects[j][i].src,
                                            title: legendObjects[j][i].title || legendObjects[j][i].name
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch (ex) {
                    console.info(ex);
                }
                layerData.customLegend = layer.customLegend;
                const html = await self.getRenderedHtml(self.CLASS + '-elm', layerData);
                const parser = new DOMParser();
                const li = parser.parseFromString(html, 'text/html').body.firstChild;
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

                    const html = await self.getRenderedHtml(className, layerNode);
                    var tip;
                    tip = document.createElement('div');
                    tip.classList.add(self.CLASS + '-tip');
                    tip.innerHTML = html;
                    self.map.div.appendChild(tip);

                    if (!self.groupController)
                        self.groupController = new Controller(self.groupModel, new Observer(tip));
                    else
                        self.groupController.add(tip);

                    typeElm.addEventListener('mouseover', function (_e) {
                        const mapDiv = self.map.div;
                        const typeElmRect = typeElm.getBoundingClientRect();
                        tip.classList.remove(Consts.classes.HIDDEN)
                        tip.style.top = typeElmRect.top - mapDiv.offsetTop + 'px';
                        tip.style.right = mapDiv.offsetWidth - (typeElmRect.left - mapDiv.offsetLeft) + 'px';

                    });
                    typeElm.addEventListener('mouseout', function (_e) {
                        tip.classList.add(Consts.classes.HIDDEN)
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
                self.getAddons().forEach(tool => self.addAddonUI(li, tool));


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
                
                if (!self.nodeController) {
                    self.nodeController = new Controller(self.nodeModel, new Observer(li));
                }
                else {
                    self.nodeController.add(li);
                }

                self.map.magnifier?.addNode(li.querySelectorAll(".tc-ctl-wlm-legend img"), 4);

                self.#updateSubmodels();

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
                let layerTitle = getTitle(layer);
                //comprobar si hay capas con títulos repetidos
                const siblingFindRegExp = new RegExp(layer.id.replace(/([\w]*-\d)(-\d)*/gi, "$1-\\d"), "gi");
                //filtramos las capas por aquellas que sean hermanas es decir file-1-[numero_fichero]-[numero capa] y busco la posición de la capa actual
                //en el array filtrado
                const index = self.layers
                    .filter((l) => getTitle(l) === layerTitle)
                    .reduce((vi, va) => {
                        const match = siblingFindRegExp.exec(va.id);
                        const layerIdRoot = match ? match[0] : va.id;
                        return vi.indexOf(layerIdRoot) >= 0 ? vi : vi.concat(layerIdRoot);
                    }, [])
                    .findIndex((l) => {
                        const match = /^[\w]*-\d-\d/gi.exec(layer.id);
                        return l === (match ? match[0] : layer.id)
                    });
                //Si la posición es mayor que 0, añado el ordinal al titulo de capa
                if (index > 0) {
                    layer._title = layerTitle = layerTitle + " (" + (index + 1) + ")";
                }
                const prevLi = this.#findLayerElement(layer);
                if (prevLi) {
                    const mainTitleElm = prevLi.querySelector(`.${self.CLASS}-lyr`);
                    mainTitleElm.textContent = layer._title;
                    mainTitleElm.title = layer._title;
                    const secTitleElm = prevLi.querySelector(`.${self.CLASS}-path`);
                    if (layer.features?.length) {
                        if (layer.features.some(f => f.getPath().length)) {
                            //const mainTitleElm = prevLi.querySelector(".tc-ctl-wlm-lyr");
                            //mainTitleElm.innerHTML = layerTitle;
                            //mainTitleElm.title = mainTitleElm.textContent;
                            // Obtenemos las rutas de todas las entidades y eliminamos los duplicados
                            const uniquePaths = [...new Set(layer.features.map(f => f.getPath().join(' &rsaquo; ')))];
                            if (uniquePaths.length >= 1) secTitleElm.innerHTML = uniquePaths.join(' &bull; ');
                        }
                        else {
                            let fullTitle = layerTitle;
                            const layerPath = layer.getPath();
                            if (layerPath.length) {
                                fullTitle = layerPath.join(' &rsaquo; ');
                            }
                            secTitleElm.innerHTML = fullTitle;
                            secTitleElm.title = secTitleElm.textContent;
                        }
                    }

                    const tree = layer.getTree();
                    const html = await self.getRenderedHtml(self.CLASS + '-elm-info', {
                        hasExtent: true,
                        hasInfo: 'styles' in layer,
                        legend: tree.legend,
                        children: tree.children,
                        path: layer.getPath(),
                    });
                    const info = prevLi.querySelector(`.${self.CLASS}-info`);
                    info.innerHTML = html;
                    self.nodeController.add(info);
                    self.map.magnifier?.addNode(info.querySelectorAll(".tc-ctl-wlm-legend img"), 4);
                    self.#updateSubmodels();
                }
            }

            const li = self.#findLayerElement(layer);
            if (li) {
                const imgs = li.querySelectorAll(`.${self.CLASS}-legend-elm[data-geometry-type] img[data-img]`);
                imgs.forEach((img) => img.setAttribute('src', img.dataset.img));

                li.querySelectorAll('sitna-feature-styler').forEach((styler) => {
                    styler.containerControl = self;
                    styler.setLayer(layer);
                    styler.addEventListener(Consts.event.STYLECHANGE, function (_e) {
                        const styles = { ...layer.styles };
                        const style = styles[styler.getStyleName(styler.getAttribute('mode'))];
                        Object.assign(style, styler.getStyle());
                        layer.setStyles(styles);
                        const img = li.querySelector(`.${self.CLASS}-legend-elm[data-geometry-type="${styler.mode}"] img[data-img]`);
                        if (img) {
                            img.dataset.src = Util.getLegendImageFromStyle(style, { geometryType: styler.mode });
                            img.setAttribute('src', img.dataset.src);
                        }
                    });
                });

                const onEditClick = function (e) {
                    const tools = e.target.parentElement.querySelector(`.${self.CLASS}-legend-elm-edit-tools`);
                    if (tools) {
                        tools.classList.remove(Consts.classes.HIDDEN);
                        e.target.classList.add(Consts.classes.HIDDEN);
                    }
                };
                li.querySelectorAll(`sitna-button.${self.CLASS}-legend-elm-edit`).forEach((btn) => {
                    btn.addEventListener(Consts.event.CLICK, onEditClick, { passive: true });
                });

                const onCloseClick = function (e) {
                    const tools = e.target.closest(`.${self.CLASS}-legend-elm-edit-tools`);
                    if (tools) {
                        tools.classList.add(Consts.classes.HIDDEN);
                        tools
                            .parentElement
                            .querySelector(`sitna-button.${self.CLASS}-legend-elm-edit`)
                            .classList.remove(Consts.classes.HIDDEN);
                    }
                };
                li.querySelectorAll(`sitna-button.${self.CLASS}-legend-elm-edit-tools-close`).forEach((btn) => {
                    btn.addEventListener(Consts.event.CLICK, onCloseClick, { passive: true });
                });
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
        const layerElements = this.map.workLayers
            .filter(function (layer) {
                return !layer.stealth;
            })
            .map((layer) => this.#findLayerElement(layer))
            .filter((element) => element != null);
        const listElement = this.div.querySelector('ul');
        listElement.replaceChildren();
        layerElements.forEach((element) => {
            listElement.insertAdjacentElement('afterbegin', element);
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
        return this.getLayerUIElements().find(li => li.dataset.layerId === layer.id);
    }

    #shouldBeDelAllVisible() {
        return !this.layers.some(layer => layer.unremovable);
    }

    #getElligibleLayersNumber() {
        return this.layers.length;
    }

    async #moveLayer(listItem, _oldIndex, newIndex, callback) {
        const self = this;
        const layerItems = self.getLayerUIElements();
        const targetItem = layerItems[newIndex];
        const sourceLayer = self.map.getLayer(listItem.dataset.layerId);
        const targetLayer = self.map.getLayer(targetItem.dataset.layerId);
        if (sourceLayer === targetLayer) return;
        const newIdx = self.map.layers.indexOf(targetLayer);
        if (newIdx >= 1 && newIdx < self.map.layers.length) {
            await self.map.insertLayer(sourceLayer, newIdx, callback);
        }
    }
    updateModel() {
        const self= this;
        self.model.loadedLayers = self.getLocaleString("loadedLayers");
        self.model.removeAllLayersFromMap = self.getLocaleString("removeAllLayersFromMap");
        self.model.noData = self.getLocaleString("noData");

        self.#updateSubmodels();
    }

    #updateSubmodels() {
        this.nodeModel.infoFromThisLayer = this.getLocaleString("infoFromThisLayer");
        this.nodeModel.visibilityOfThisLayer = this.getLocaleString("visibilityOfThisLayer");
        this.nodeModel.zoomToLayerExtent = this.getLocaleString("zoomToLayerExtent");
        this.nodeModel.removeLayerFromMap = this.getLocaleString("removeLayerFromMap");
        this.nodeModel.otherTools = this.getLocaleString("otherTools");
        this.nodeModel.transparencyOfThisLayer = this.getLocaleString("transparencyOfThisLayer");
        this.nodeModel.abstract = this.getLocaleString("abstract");
        this.nodeModel.content = this.getLocaleString("content");
        this.nodeModel.metadata = this.getLocaleString("metadata");
        this.nodeModel.dragToReorder = this.getLocaleString("dragToReorder");
        //currentModel.singleLayer = this.getLocaleString("singleLayer");
        //currentModel.groupLayerThatContains = this.getLocaleString("groupLayerThatContains");

        this.groupModel.singleLayer = this.getLocaleString("singleLayer");
        this.groupModel.groupLayerThatContains = this.getLocaleString("groupLayerThatContains");
        this.nodeModel.editStyle = this.getLocaleString("editStyle");
        this.nodeModel.close = this.getLocaleString("close");
    }

    async updateLanguage() {
        const self = this;
        self.updateModel();
        if (self.map ?.magnifier ?.model){
            self.map.magnifier.model.textToOpen = self.getLocaleString("clickToEnlarge");
            self.map.magnifier.model.textToClose = self.getLocaleString("clickToClose");
        }
    }
}

TC.mix(WorkLayerManager, itemToolContainer);

WorkLayerManager.prototype.CLASS = 'tc-ctl-wlm';
TC.control.WorkLayerManager = WorkLayerManager;
export default WorkLayerManager;
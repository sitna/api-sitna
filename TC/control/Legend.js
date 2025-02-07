import TC from '../../TC';
import Consts from '../Consts';
import MapContents from './MapContents';
import './LayerLegend';
import Controller from '../Controller';
import Observer from '../Observer';


TC.control = TC.control || {};
const layerLoaded = [];

class LegendModel {
    constructor() {
        this.legend = "";
        this.noData = "";
    }
}

class Legend extends MapContents {

    register(map) {
        const self = this;

        map.on(Consts.event.VIEWCHANGE, function (e) {
            const view = e.view;
            const onLayerAdd = self.loadGraphics.bind(self);

            if (view === Consts.view.THREED) {
                map.on(Consts.event.LAYERADD, onLayerAdd);
            } else if (view === Consts.view.DEFAULT) {
                map.off(Consts.event.LAYERADD, onLayerAdd);
            }
        });

        self.model = new LegendModel();

        self.renderPromise().then(function () {
            self.controller = new Controller(self.model, new Observer(self.div));
            self.updateModel();
        });

        return super.register.call(self, map);

    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-legend.mjs');
        const nodeTemplatePromise = import('../templates/tc-ctl-legend-node.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-node'] = (await nodeTemplatePromise).default;
        self.template = template;
    }

    loadGraphics() {
        const self = this;
        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);
            if (layer) {
                li.querySelectorAll('li.' + self.CLASS + '-node-visible').forEach(function (l) {
                    l.querySelectorAll('img').forEach(function (img) {
                        if (img && img.hasAttribute('src') && img.getAttribute('src').length === 0) {
                            self.styleLegendImage(img, layer);
                        }
                    });
                });
            }
        });
        return self;
    }

    updateScale() {
        const self = this;
        const inScale = self.CLASS + '-node-inscale';
        const outOfScale = self.CLASS + '-node-outofscale';

        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);

            if (layer && !layer.customLegend) {
                let layersInScale = false;
                const lis = li.querySelectorAll('li.' + self.CLASS + '-leaf');
                lis.forEach(function (l) {
                    if (l.classList.contains(self.CLASS + '-node-visible') && l.querySelectorAll("img").length) {
                        const uid = l.dataset.layerUid;
                        if (layer.isVisibleByScale(uid)) {
                            layersInScale = true;
                            l.classList.remove(outOfScale);
                            l.classList.add(inScale);
                            l.querySelectorAll('img').forEach(function (img) {
                                self.styleLegendImage(img, layer);
                            });
                        }
                        else {
                            l.classList.add(outOfScale);
                            l.classList.remove(inScale);
                        }
                    }
                });
                layersInScale = layersInScale || !lis.length;
                if (!lis.length) {
                    li.querySelectorAll('img').forEach(function (img) {
                        self.styleLegendImage(img, layer);
                    });
                }
                li.classList.toggle(inScale, layersInScale);
                li.classList.toggle(outOfScale, !layersInScale);
            }
        });
        return self;
    }

    update() {
        const self = this;

        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);
            if (layer && (!layer.customLegend || !layer.getVisibility())) {
                const tree = layer.getTree(false, true);

                li.querySelectorAll('li').forEach(function (l) {
                    const visible = self.CLASS + '-node-visible';
                    const notVisible = self.CLASS + '-node-notvisible';
                    const hasVisible = self.CLASS + '-node-hasvisible';

                    switch (layer.getNodeVisibility(l.dataset.layerUid, tree)) {
                        case Consts.visibility.VISIBLE:
                            l.classList.remove(notVisible, hasVisible);
                            l.classList.add(visible);
                            break;
                        case Consts.visibility.NOT_VISIBLE:
                            l.classList.remove(visible, hasVisible);
                            l.classList.add(notVisible);
                            break;
                        case Consts.visibility.HAS_VISIBLE:
                            l.classList.remove(visible, notVisible);
                            l.classList.add(hasVisible);
                            break;
                        case null:
                            // No encuentro nodo: no visible
                            l.classList.remove(visible, hasVisible);
                            l.classList.add(notVisible);
                            break;
                        default:
                            // Estado no definido: por defecto visible
                            l.classList.remove(notVisible, hasVisible);
                            l.classList.add(visible);
                            break;
                    }
                });

                self.updateLayerVisibility(layer);
            }
        });
        self.updateScale();

        return self;
    }

    async updateLayerTree(layer,refresh) {
        const self = this;
        
        if (!layer.isBase &&
            !layer.options.stealth &&
            (!layer.availableNames || layer.availableNames?.some((name) => layer.getInfo(name).legend.length))) {

            //// 09/04/2019 GLS: ignoramos el atributo que venga en la capa porque en la leyenda queremos que el árbol se muestre siempre y 
            //// nos ahorramos el tener que pasarlo en el estado del mapa
            if (layer.hideTree || layer.options.hideTree) {
                // 21/10/2021 URI: El Parche anterior estropeaba el funcionamiento del TOC ya que modificaba la propiedad de configuracion de la capa "hideTree"
                //He implementado una funcion llamada getFullTree que obtiene el arbol completo sin importar la configracion y sin modificar la propiedad "tree" de la capa
                //que es donde se guarda cacheada la estructura del albol de capas hijas.
                /*layer.tree = null;
                layer.hideTree = layer.options.hideTree = false;*/
            }                  
            self.div.querySelector('.' + self.CLASS + '-empty')?.classList.add(Consts.classes.HIDDEN);            
            //URI:Si la capa se ha añadido pero todavía no se han obtenido las features no se dibuja la leyenda. Esto es por las capas KML que si tienen leyenda 
            //pero hasta que no se añaden la features no se puede obtener la simbología.
            if (layer.features && !layer.features.length) return;
            let layerLegend;
            layerLegend = self.div.querySelector('sitna-layer-legend#stl-' + layer.id);
            if (!layerLegend) {
                layerLegend = document.createElement('sitna-layer-legend');
                layerLegend.id = "stl-" + layer.id;
                layerLegend.dataset.layerId = layer.id;
                layerLegend.containerControl = self;
                layerLoaded.push(layer.id);
            }
            var params = layer.type === Consts.layerType.WMS ?
                { customLegend: layerLegend.innerHTML } :
                (layer.getNestedTree ? layer.getNestedTree() : layer.getTree());
            if (layer._title && layer._title !== layer.title) {
                params = Object.assign(params, { "title": layer._title });
            }
            
            try {
                const html = await self.getRenderedHtml(self.CLASS + '-node', params);
                layerLegend.innerHTML = html;//parser.parseFromString(out, 'text/html').body.firstChild;
                const uid = layerLegend.dataset.layerUid || layerLegend.dataset.layerId;
                const ul = self.div.querySelector('ul.' + self.CLASS + '-branch');
                const lis = ul?.querySelectorAll('li[data-layer-uid="' + uid + '"]');
                if (lis && lis.length === 1) {
                    const li = lis[0];
                    if (li.innerHTML !== layerLegend.innerHTML) {//URI: Si el html nuevo y el viejo son iguales no copio para no hacer un parpadeo en el navegador.
                        li.innerHTML = layerLegend.innerHTML;
                        li.setAttribute('class', layerLegend.getAttribute('class')); // Esto actualiza si un nodo deja de ser hoja o pasa a ser hoja
                    }
                    self.update();

                    }
                    else {
                        layerLegend.dataset.layerId = layer.id;
                        const loadOrder = self.map.workLayers.filter((wl) => layerLoaded.includes(wl.id)).map((wl => wl.id)).reverse()
                        const getReferenceElement = (index) => {
                            if (index === 0) return ul.firstChild;
                            if (loadOrder.length - 1 === index) return ul.lastElementChild;
                            const layerId = loadOrder[index+1];
                            const referenceElement = ul.querySelector('*[data-layer-id="' + layerId + '"]');
                            return referenceElement || getReferenceElement(++index);

                    };
                    ul.insertBefore(layerLegend, getReferenceElement(loadOrder.indexOf(layer.id)));
                    if (layer instanceof TC.layer.Raster)
                        layerLegend.addEventListener('update', (e) => {                        
                            self.map?.magnifier?.addNode(e.srcElement.querySelectorAll(".tc-ctl-legend-watch img"), 4);
                            self.update();
                        });
                    else
                        self.update();
                }                
            }
            catch (err) {
                TC.error(err);
            }
        }
        return self;
    }

    removeLayer(layer) {
        const self = this;
        if (!layer.isBase) {
            super.removeLayer.call(self, layer);
            layerLoaded.splice(layerLoaded.indexOf(layer.id),1);
        }
        return self;
    }

    updateLayerVisibility(layer) {
        const self = this;
        self.getLayerUIElements().forEach(function (li) {
            if (li.dataset.layerId === layer.id) {
                li.classList.toggle(self.CLASS + '-node-notvisible', !layer.getVisibility());
            }
        });
        return self;
    }

    //getLayerUIElements(tagNode) {
    //    const self = this;
    //    return self.div.querySelector('ul.' + self.CLASS + '-branch').querySelectorAll((tagNode ? tagNode:"li")+'.' + self.CLASS + '-node');
    //}
    getLayerUIElements() {
        const self = this;
        return self.div.querySelector('ul.' + self.CLASS + '-branch').querySelectorAll('sitna-layer-legend, li.' + self.CLASS + '-node');
    }

    updateModel() {
        this.model.legend = this.getLocaleString("legend");
        this.model.noData = this.getLocaleString("noData");
    }

    async changeLanguage() {
        const self = this;        
        //////eliminar los cartuchos antes de redibujarlos
        //this.map.workLayers.forEach((layer) => {
        //    self.updateLayerTree(layer,true);
        //});
        //////if (self.div.querySelector('.' + self.CLASS + '-empty'))
        //////await self.render();
        //return self._firstRender;
        self.updateModel();
        if (self.map ?.magnifier ?.model){
            self.map.magnifier.model.textToOpen = self.getLocaleString("clickToEnlarge");
            self.map.magnifier.model.textToClose = self.getLocaleString("clickToClose");
        }
            
    }
}

Legend.prototype.CLASS = 'tc-ctl-legend';
TC.control.Legend = Legend;
export default Legend;
import TC from '../../TC';
import Consts from '../Consts';
import MapContents from './MapContents';

TC.Consts = Consts;
TC.control = TC.control || {};
TC.control.MapContents = MapContents;

TC.control.Legend = function () {
    TC.control.MapContents.apply(this, arguments);
};

TC.inherit(TC.control.Legend, TC.control.MapContents);

(function () {
    var ctlProto = TC.control.Legend.prototype;

    ctlProto.CLASS = 'tc-ctl-legend';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-legend.hbs";
    ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/tc-ctl-legend-node.hbs";

    ctlProto.register = function (map) {
        const self = this;

        map.on(TC.Consts.event.VIEWCHANGE, function (e) {
            const view = e.view;
            const onLayerAdd = self.loadGraphics.bind(self);

            if (view === TC.Consts.view.THREED) {                
                map.on(TC.Consts.event.LAYERADD, onLayerAdd);
            } else if (view === TC.Consts.view.DEFAULT) {
                map.off(TC.Consts.event.LAYERADD, onLayerAdd);
            }
        });

        return TC.control.MapContents.prototype.register.call(self, map);
    };

    ctlProto.loadGraphics = function () {
        const self = this;
        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);
            if (layer) {
                li.querySelectorAll('li.' + self.CLASS + '-node-visible').forEach(function (l) {
                    const img = l.querySelector('img');
                    if (img && img.getAttribute('src') !== undefined && img.getAttribute('src').length === 0) {
                        self.styleLegendImage(img, layer);
                    }
                });
            }
        });
    };

    ctlProto.updateScale = function () {
        const self = this;
        const inScale = self.CLASS + '-node-inscale';
        const outOfScale = self.CLASS + '-node-outofscale';

        self.getLayerUIElements().forEach(function (li) {
            const layer = self.map.getLayer(li.dataset.layerId);

            if (layer && !layer.customLegend ) {
                let layersInScale = false;
                const lis = li.querySelectorAll('li');
                lis.forEach(function (l) {
                    if (l.classList.contains(self.CLASS + '-node-visible')) {
                        const uid = l.dataset.layerUid;
                        if (layer.isVisibleByScale(uid)) {
                            layersInScale = true;
                            l.classList.remove(outOfScale);
                            l.classList.add(inScale);
                            const img = l.querySelector('img');
                            if (img) {
                                self.styleLegendImage(img, layer);
                            }
                        }
                        else {
                            l.classList.add(outOfScale);
                            l.classList.remove(inScale);
                        }
                    }
                });
                layersInScale = layersInScale || !lis.length;
                if (!lis.length) {
                    const img = li.querySelector('img');
                    if (img) {
                        self.styleLegendImage(img);
                    }
                }
                li.classList.toggle(inScale, layersInScale);
                li.classList.toggle(outOfScale, !layersInScale);
            }
        });
    };

    ctlProto.update = function () {
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
                        case TC.Consts.visibility.VISIBLE:
                            l.classList.remove(notVisible, hasVisible);
                            l.classList.add(visible);
                            break;
                        case TC.Consts.visibility.NOT_VISIBLE:
                            l.classList.remove(visible, hasVisible);
                            l.classList.add(notVisible);
                            break;
                        case TC.Consts.visibility.HAS_VISIBLE:
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
    };

    ctlProto.updateLayerTree = function (layer) {
        var self = this;        

        if (!layer.isBase && !layer.options.stealth) {
            
            //// 09/04/2019 GLS: ignoramos el atributo que venga en la capa porque en la leyenda queremos que el árbol se muestre siempre y 
            //// nos ahorramos el tener que pasarlo en el estado del mapa
            if (layer.hideTree || layer.options.hideTree) {
                // 21/10/2021 URI: El Parche anterior estropeaba el funcionamiento del TOC ya que modificaba la propiedad de configuracion de la capa "hideTree"
                //He implementado una funcion llamada getFullTree que obtiene el arbol completo sin importar la configracion y sin modificar la propiedad "tree" de la capa
                //que es donde se guarda cacheada la estructura del albol de capas hijas.
                /*layer.tree = null;
                layer.hideTree = layer.options.hideTree = false;*/
            }      

            self.div.querySelector('.' + self.CLASS + '-empty').classList.add(TC.Consts.classes.HIDDEN);            
            var params = layer.getNestedTree ? layer.getNestedTree() : layer.getTree();//self.layerTrees[layer.id];
            if (layer._title && layer._title !== layer.title)
                params = Object.assign(params,{ "title": layer._title });
            self.getRenderedHtml(self.CLASS + '-node', params)
                .then(function (out) {
                    const parser = new DOMParser();
                    const newLi = parser.parseFromString(out, 'text/html').body.firstChild;
                    const uid = newLi.dataset.layerUid;
                    const ul = self.div.querySelector('ul.' + self.CLASS + '-branch');
                    const lis = ul.querySelectorAll('li[data-layer-uid="' + uid + '"]');
                    if (lis.length === 1) {
                        const li = lis[0];
                        if (li.innerHTML !== newLi.innerHTML) {//URI: Si el html nuevo y el viejo son iguales no copio para no hacer un parpadeo en el navegador.
                            li.innerHTML = newLi.innerHTML;
                            li.setAttribute('class', newLi.getAttribute('class')); // Esto actualiza si un nodo deja de ser hoja o pasa a ser hoja
                        }
                        
                    }
                    else {
                        newLi.dataset.layerId = layer.id;
                        ul.insertBefore(newLi, ul.firstChild);
                    }

                    self.update();
                })
                .catch(function (err) {
                    TC.error(err);
                });
        }
    };

    ctlProto.removeLayer = function (layer) {
        if (!layer.isBase) {
            TC.control.MapContents.prototype.removeLayer.call(this, layer);
        }
    };

    ctlProto.updateLayerVisibility = function (layer) {
        var self = this;
        self.getLayerUIElements().forEach(function (li) {
            if (li.dataset.layerId === layer.id) {
                li.classList.toggle(self.CLASS + '-node-notvisible', !layer.getVisibility());
            }
        });
    };

    ctlProto.getLayerUIElements = function () {
        const self = this;
        return self.div.querySelector('ul.' + self.CLASS + '-branch').querySelectorAll('li.' + self.CLASS + '-node');
    };
})();

const Legend = TC.control.Legend;
export default Legend;
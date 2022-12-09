import TC from '../../TC';
import Consts from '../Consts';
import MapContents from './MapContents';

TC.Consts = Consts;
TC.control = TC.control || {};
TC.control.MapContents = MapContents;

TC.control.TOC = function () {
    var self = this;

    TC.control.MapContents.apply(self, arguments);
};

TC.inherit(TC.control.TOC, TC.control.MapContents);

(function () {
    var ctlProto = TC.control.TOC.prototype;

    ctlProto.CLASS = 'tc-ctl-toc';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-toc.hbs";
    ctlProto.template[ctlProto.CLASS + '-branch'] = TC.apiLocation + "TC/templates/tc-ctl-toc-branch.hbs";
    ctlProto.template[ctlProto.CLASS + '-node'] = TC.apiLocation + "TC/templates/tc-ctl-toc-node.hbs";

    var CLICKEVENT = 'click';

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.control.MapContents.prototype.register.call(self, map);

        map.on(TC.Consts.event.EXTERNALSERVICEADDED, function (e) {
            self.onExternalServiceAdded(e);
        });

        return result;
    };

    ctlProto.onExternalServiceAdded = function (e) {
        const self = this;
        if (e && e.layer) {
            e.layer.map = self.map;
            self.map.addLayer(e.layer).then(function (_layer) {
                self.updateLayerTree(e.layer);
            });
        }
    };

    ctlProto.addUIEventListeners = function () {
        const self = this;
        self.div.addEventListener(CLICKEVENT, TC.EventTarget.listenerBySelector('input[type=checkbox]', function (e) { // No usamos TC.Consts.event.CLICK porque en iPad los eventos touchstart no van bien en los checkbox
            const checkbox = e.target;
            var ul = checkbox;
            while (ul && !ul.matches('ul.' + self.CLASS + '-wl')) {
                ul = ul.parentElement;
            }
            const lis = [];
            var i;
            for (i = 0; i < ul.children.length; i++) {
                const child = ul.children[i];
                if (child.tagName === 'LI') {
                    lis.push(child);
                }
            }
            for (i = 0; i < lis.length; i++) {
                const li = lis[i];
                if (li.contains(checkbox)) {
                    const layer = self.map.getLayer(li.dataset.layerId);
                    var parent = checkbox;
                    do {
                        parent = parent.parentElement;
                    }
                    //URI: El arbol de capas vecotriales falla si tiene una profuncidad de 2 o mas nodos
                    while (parent && parent.tagName !== 'LI' && !layer.getNodeVisibility(parent.dataset.layerUid));
                    const uid = parent.dataset.layerUid;
                    layer.setNodeVisibility(uid, checkbox.checked);
                    break;
                }
            }

            e.stopPropagation();
        }));
        self.div.addEventListener(TC.Consts.event.MOUSEUP, TC.EventTarget.listenerBySelector('button.' + self.CLASS + '-collapse-btn', function (e) {
            e.target.blur();
            const li = e.target.parentElement;
            if (!li.classList.contains(self.CLASS + '-leaf')) {
                li.classList.toggle(TC.Consts.classes.COLLAPSED);
                const ul = li.querySelector('ul');
                ul.classList.toggle(TC.Consts.classes.COLLAPSED);
                e.stopPropagation();
            }
        }));
    };

    ctlProto.update = function (layer) {
        var self = this;

        var _getCheckbox = function (li) {
            for (var i = 0, len = li.children.length; i < len; i++) {
                const child = li.children[i];
                if (child.matches('input[type=checkbox]')) {
                    return child;
                }
            }
            return null;
        };

        const li = self.getLayerUIElements().find(ui => ui.dataset.layerId === layer.id);
        if (!li) return;
        _getCheckbox(li).checked = layer.getVisibility();

        layer.tree = null;
        const tree = layer.getTree(true);
        li.querySelectorAll('li').forEach(function (l) {
            const checkbox = _getCheckbox(l);
            const uid = l.dataset.layerUid;
            switch (layer.getNodeVisibility(uid, tree)) {
                case TC.Consts.visibility.VISIBLE:
                    checkbox.checked = true;
                    checkbox.indeterminate = false;
                    break;
                case TC.Consts.visibility.NOT_VISIBLE:
                    checkbox.checked = false;
                    checkbox.indeterminate = false;
                    break;
                case TC.Consts.visibility.NOT_VISIBLE_AT_RESOLUTION:
                    checkbox.checked = true;
                    checkbox.indeterminate = false;
                    break;
                case TC.Consts.visibility.HAS_VISIBLE:
                    checkbox.checked = false;
                    checkbox.indeterminate = true;
                    break;
                case null:
                    // Nodo no encontrado, no visible
                    checkbox.checked = false;
                    checkbox.indeterminate = true;
                    break;
                default: {
                    // visibilityState no establecido, miramos isVisible
                    const node = layer.findNode(uid, tree);
                    const isVisible = Object.prototype.hasOwnProperty.call(node, "isVisible") ? node.isVisible : true;
                    checkbox.checked = isVisible;
                    checkbox.indeterminate = false;
                }
        }
        });
    };

    ctlProto.updateScale = function (layer) {
        const self = this;
        const setVisibilityByScale = function (li, layer) {
            if (!li) return;
            li.querySelectorAll('li').forEach(function (elm) {
                const uid = elm.dataset.layerUid;
                elm.classList.toggle(self.CLASS + '-node-notvisible', !layer.isVisibleByScale(uid));
            });
        };
        if (!layer)
            self.getLayerUIElements().forEach(function (li) {
                setVisibilityByScale(li, self.map.getLayer(li.dataset.layerId));

            });
        else
            setVisibilityByScale(self.getLayerUIElements().find(ui => ui.dataset.layerId === layer.id), layer);        
    };

    ctlProto.updateLayerTree = function (layer) {
        var self = this;

        if (!layer.isBase && !layer.options.stealth) {
            TC.control.MapContents.prototype.updateLayerTree.call(self, layer);

            self.div.querySelector('.' + self.CLASS + '-empty').classList.add(TC.Consts.classes.HIDDEN);
            self.getRenderedHtml(self.CLASS + '-branch', self.layerTrees[layer.id])
                .then(function (out) {
                    const parser = new DOMParser();
                    const newLi = parser.parseFromString(out, 'text/html').body.firstChild;
                    const uid = newLi.dataset.layerUid;
                    const li = self.div.querySelector('.' + self.CLASS + '-wl li[data-layer-uid="' + uid + '"]') ||
                        self.div.querySelector('.' + self.CLASS + '-wl li[data-layer-id="' + layer.id + '"]');
                    if (!li) {
                        newLi.dataset.layerId = layer.id;
                        const ul = self.div.querySelector('.' + self.CLASS + '-wl');
                        ul.insertBefore(newLi, ul.firstChild);

                        //if (layer instanceof TC.layer.Vector || li)
                        /*if (li) {
                            li.innerHTML = newLi.innerHTML;
                            li.setAttribute('class', newLi.getAttribute('class')); // Esto actualiza si un nodo deja de ser hoja o pasa a ser hoja
                            if (!li.dataset.layerId) {
                                li.dataset.layerId = layer.id;
                            }
                        }
                        else {
                            newLi.dataset.layerId = layer.id;
                            const ul = self.div.querySelector('.' + self.CLASS + '-wl');
                            ul.insertBefore(newLi, ul.firstChild);
                        }*/

                        const wl = 'ul.' + self.CLASS + '-wl';
                        const branch = 'ul.' + self.CLASS + '-branch';
                        const node = 'li.' + self.CLASS + '-node';
                        const leaf = 'li.' + self.CLASS + '-leaf';
                        newLi.querySelectorAll(wl + ' ' + branch + ' ' + branch + ',' + wl + ' ' + branch + ' ' + node).forEach(function (node_) {
                            if (!node_.matches(leaf)) {
                                node_.classList.add(TC.Consts.classes.COLLAPSED);
                            }
                        });
                    } else if (layer instanceof TC.layer.Vector) {
                        const wl = 'ul.' + self.CLASS + '-wl';
                        const branch = 'ul.' + self.CLASS + '-branch';
                        const node = 'li.' + self.CLASS + '-node';
                        const leaf = 'li.' + self.CLASS + '-leaf';
                        //guardo los no collapsados
                        const notCollapsedNodesUid = Array.from(li.querySelectorAll("li.tc-ctl-toc-node:not(.tc-ctl-toc-leaf):not(.tc-collapsed)")).reduce(function (previousValue, currentValue) {
                            console.log(previousValue);
                            previousValue.push(currentValue.dataset.layerUid);
                            return previousValue;
                        }, []);
                        li.innerHTML = newLi.innerHTML;
                        li.setAttribute('class', newLi.getAttribute('class')); // Esto actualiza si un nodo deja de ser hoja o pasa a ser hoja
                        if (!li.dataset.layerId) {
                            li.dataset.layerId = layer.id;
                        }
                        li.querySelectorAll(wl + ' ' + branch + ' ' + branch + ',' + wl + ' ' + branch + ' ' + node).forEach(function (node_) {
                            //colapso todos los nodos que no son hoja y que previamente no estaban collapsados
                            if (!node_.matches(leaf) &&
                                !(node_.tagName === "LI" && notCollapsedNodesUid.some(notCollapsedUid => notCollapsedUid === node_.dataset.layerUid) ||
                                node_.tagName === "UL" && notCollapsedNodesUid.some(notCollapsedUid => notCollapsedUid === node_.parentElement.dataset.layerUid)
                                )) {
                                node_.classList.add(TC.Consts.classes.COLLAPSED);
                            }
                        });
                    }
                   
                    self.update(layer);
                    self.updateScale(layer);
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
                var isHidden = !layer.getVisibility();
                li.querySelectorAll('input[type=checkbox]').forEach(function (checkbox) {
                    if (checkbox.matches('.' + self.CLASS + '-branch-cb')) {
                        checkbox.checked = !isHidden;
                    }
                    else {
                        checkbox.disabled = isHidden;
                    }
                });
            }
        });
    };

    ctlProto.updateLayerOrder = function (_layer, _oldIdx, _newIdx) {
        // Este control no tiene que hacer nada
    };

    ctlProto.render = function (callback) {
        const self = this;

        return TC.Control.prototype.render.call(self, function () {

            var controlOptions = self.options.controls || [];

            if (controlOptions.length > 0) {
                var ctl = controlOptions[0];
                var newDiv = document.createElement("div");
                self.div.appendChild(newDiv);
                self.map.addControl(ctl.name, TC.Util.extend({ 'div': newDiv }, ctl.options));
            }

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        });
    };

    ctlProto.getLayerUIElements = function () {
        const self = this;
        const result = [];
        const children = self.div.querySelector('ul.' + self.CLASS + '-wl').children;
        for (var i = 0, len = children.length; i < len; i++) {
            const child = children[i];
            if (child.tagName === 'LI') {
                result.push(child);
            }
        }
        return result;
    };
        
})();

const TOC = TC.control.TOC;
export default TOC;
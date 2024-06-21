import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Control from '../Control';
import MapContents from './MapContents';
import Raster from '../../SITNA/layer/Raster';
import Vector from '../../SITNA/layer/Vector';

TC.control = TC.control || {};

var CLICKEVENT = 'click';

class TOC extends MapContents {

    register(map) {
        const self = this;

        map.on(Consts.event.EXTERNALSERVICEADDED, function (e) {
            self.onExternalServiceAdded(e);
        });

        return super.register.call(self, map);
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-toc.mjs');
        const branchTemplatePromise = import('../templates/tc-ctl-toc-branch.mjs');
        const nodeTemplatePromise = import('../templates/tc-ctl-toc-node.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-branch'] = (await branchTemplatePromise).default;
        template[self.CLASS + '-node'] = (await nodeTemplatePromise).default;
        self.template = template;
    }

    render(callback) {
        const self = this;

        return Control.prototype.render.call(self, function () {

            var controlOptions = self.options.controls || [];

            if (controlOptions.length > 0) {
                var ctl = controlOptions[0];
                var newDiv = document.createElement("div");
                self.div.appendChild(newDiv);
                self.map.addControl(ctl.name, Util.extend({ 'div': newDiv }, ctl.options));
            }

            if (Util.isFunction(callback)) {
                callback();
            }
        });
    }

    onExternalServiceAdded(e) {
        const self = this;
        if (e && e.layer) {
            e.layer.map = self.map;
            self.map.addLayer(e.layer).then(function (_layer) {
                self.updateLayerTree(e.layer);
            });
        }
    }

    addUIEventListeners() {
        const self = this;
        self.div.addEventListener(CLICKEVENT, TC.EventTarget.listenerBySelector('input[type=checkbox]', function (e) { // No usamos Consts.event.CLICK porque en iPad los eventos touchstart no van bien en los checkbox
            const checkbox = e.target;
            var ul = checkbox;

            //Si es un nodo raiz...
            if (checkbox.parentElement.dataset.layerId) {
                const layer = self.map.getLayer(checkbox.parentElement.dataset.layerId);
                //y está chequeado y tiene algún nodo desmarcado
                if (checkbox.checked && checkbox.parentElement.querySelectorAll("ul input:not(:checked").length > 0) {
                    //marcamos todos los checkbox que estén desmarcados
                    const selectorCSS = "ul " + (layer instanceof Raster ? ("li." + self.CLASS + "-leaf ") : "") + "input:not(:checked)";
                    const uids = Array.from(e.target.parentElement.querySelectorAll(selectorCSS)).map((cb) => {
                        return cb.parentElement.dataset.layerUid;
                    });
                    layer.setNodeVisibility(uids, checkbox.checked);

                }
            }
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
                    if (!layer.getVisibility() && checkbox.checked) layer.setVisibility(checkbox.checked);
                    layer.setNodeVisibility(uid, checkbox.checked);
                    break;
                }
            }

            e.stopPropagation();
        }));
        self.div.addEventListener(Consts.event.MOUSEUP, TC.EventTarget.listenerBySelector('button.' + self.CLASS + '-collapse-btn', function (e) {
            e.target.blur();
            const li = e.target.parentElement;
            if (!li.classList.contains(self.CLASS + '-leaf')) {
                li.classList.toggle(Consts.classes.COLLAPSED);
                const ul = li.querySelector('ul');
                ul.classList.toggle(Consts.classes.COLLAPSED);
                e.stopPropagation();
            }
        }));
        return self;
    }

    update(layer) {
        const self = this;

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

        layer.tree = null;
        const tree = layer.getTree(false);
        const rootCheck = _getCheckbox(li);
        rootCheck.checked = layer.getVisibility();
        //si la capa está visible pero alguno de los hijos está oculto le ponemos como indeterminado
        if (rootCheck.checked && layer.getNodeVisibility(tree.uid, tree) === Consts.visibility.HAS_VISIBLE) {
            rootCheck.checked = false;
            rootCheck.indeterminate = true;
        }
        if (rootCheck.checked && layer.getNodeVisibility(tree.uid, tree) === Consts.visibility.NOT_VISIBLE) {
            rootCheck.checked = rootCheck.indeterminate = false;
        }
        li.querySelectorAll('li').forEach(function (l) {
            const checkbox = _getCheckbox(l);
            const uid = l.dataset.layerUid;
            switch (layer.getNodeVisibility(uid, tree)) {
                case Consts.visibility.VISIBLE:
                    checkbox.checked = true;
                    checkbox.indeterminate = false;
                    break;
                case Consts.visibility.NOT_VISIBLE:
                    checkbox.checked = false;
                    checkbox.indeterminate = false;
                    break;
                case Consts.visibility.NOT_VISIBLE_AT_RESOLUTION:
                    checkbox.checked = true;
                    checkbox.indeterminate = false;
                    break;
                case Consts.visibility.HAS_VISIBLE:
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
                    if (node.children && node.children.length && !(layer instanceof Vector)) {
                        const isAllChildrenVisibles = node.children.every(c => c.isVisible || (c.visibilityState && c.visibilityState === Consts.visibility.VISIBLE));
                        const isAllChildrenHidden = node.children.every(c => !c.isVisible || (c.visibilityState && c.visibilityState === Consts.visibility.NOT_VISIBLE));
                        checkbox.checked = isAllChildrenVisibles;
                        checkbox.indeterminate = !isAllChildrenVisibles && !isAllChildrenHidden;
                    }
                    else {
                        checkbox.checked = isVisible;
                        checkbox.indeterminate = false;
                    }

                }
            }
        });
        Array.from(li.parentElement.querySelectorAll('li:not(.' + self.CLASS + '-leaf)')).reverse().forEach((l) => {
            const someChecked = !!li.parentElement.querySelector("li[data-layer-uid='" + l.dataset.layerUid + "'] > ul > li > input:checked");
            const someNotChecked = !!li.parentElement.querySelector("li[data-layer-uid='" + l.dataset.layerUid + "'] > ul > li > input:not(:checked)");
            const someIndeterminated = !!li.parentElement.querySelector("li[data-layer-uid='" + l.dataset.layerUid + "'] > ul > li > input:indeterminate");
            l.querySelector("input").indeterminate = (someChecked && someNotChecked) || someIndeterminated;
            l.querySelector("input").checked = someChecked && !someNotChecked && !someIndeterminated;
        });
        return self;
    }

    updateScale(layer) {
        const self = this;
        const setVisibilityByScale = function (li, layer) {
            if (!li) return;
            li.querySelectorAll('li').forEach(function (elm) {
                const uid = elm.dataset.layerUid;
                elm.classList.toggle(self.CLASS + '-node-notvisible', !layer.isVisibleByScale(uid));
            });
        };
        if (!layer) {
            self.getLayerUIElements().forEach(function (li) {
                setVisibilityByScale(li, self.map.getLayer(li.dataset.layerId));

            });
        }
        else {
            setVisibilityByScale(self.getLayerUIElements().find(ui => ui.dataset.layerId === layer.id), layer);
        }
        return self;
    }

    updateLayerTree(layer) {
        const self = this;

        if (!layer.isBase && !layer.options.stealth) {
            super.updateLayerTree.call(self, layer);

            self.div.querySelector('.' + self.CLASS + '-empty').classList.add(Consts.classes.HIDDEN);
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
                        //politica de ordenacion según se defina en el config.json
                        //ul.insertAdjacentElement('afterbegin', newLi);
                        const index = self.map.workLayers.indexOf(layer);
                        if (!index) {
                            ul.insertAdjacentElement('afterbegin', newLi);
                        }
                        else {
                            ul.children[index - 1].insertAdjacentElement('afterend', newLi);
                        }

                        const wl = 'ul.' + self.CLASS + '-wl';
                        const branch = 'ul.' + self.CLASS + '-branch';
                        const node = 'li.' + self.CLASS + '-node';
                        const leaf = 'li.' + self.CLASS + '-leaf';
                        newLi.querySelectorAll(wl + ' ' + branch + ' ' + branch + ',' + wl + ' ' + branch + ' ' + node).forEach(function (node_) {
                            if (!node_.matches(leaf)) {
                                node_.classList.add(Consts.classes.COLLAPSED);
                            }
                        });
                        if (layer instanceof Raster) {
                            newLi.querySelector("input[type='checkbox']").classList.add(Consts.classes.HIDDEN);
                        }
                    } else if (layer instanceof Vector) {
                        const wl = 'ul.' + self.CLASS + '-wl';
                        const branch = 'ul.' + self.CLASS + '-branch';
                        const node = 'li.' + self.CLASS + '-node';
                        const leaf = 'li.' + self.CLASS + '-leaf';
                        //guardo los no collapsados
                        const notCollapsedNodesUid = Array.from(li.querySelectorAll("li.tc-ctl-toc-node:not(.tc-ctl-toc-leaf):not(.tc-collapsed)")).reduce(function (previousValue, currentValue) {
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
                                node_.classList.add(Consts.classes.COLLAPSED);
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
        return self;
    }

    removeLayer(layer) {
        const self = this;
        if (!layer.isBase) {
            super.removeLayer.call(self, layer);
        }
        return self;
    }

    updateLayerVisibility(layer) {
        const self = this;
        self.getLayerUIElements().forEach(function (li) {
            if (li.dataset.layerId === layer.id) {
                var isHidden = !layer.getVisibility();
                if (isHidden) {
                    li.querySelectorAll('input[type=checkbox]').forEach(function (checkbox) {
                        checkbox.checked = !isHidden;
                        if (layer instanceof Vector) {
                            layer.setNodeVisibility(checkbox.parentElement.dataset.layerUid, false);
                        }
                    });
                    if (layer instanceof Raster) {
                        self.map.getLayer("idena").setLayerNames("");
                    }
                }
                else {
                    if (layer instanceof Raster && li.querySelector("input.tc-ctl-toc-branch-cb:checked")) {
                        layer.setLayerNames(Array.from(li.querySelectorAll('li.' + self.CLASS + '-leaf'))
                            .reduce((vi, va) => { return vi.concat(va.dataset.layerName) }, []));
                    }
                }
            }
        });
        return self;
    }

    updateLayerOrder(_layer, _oldIdx, _newIdx) {
        // Este control no tiene que hacer nada
        return this;
    }

    getLayerUIElements() {
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
    }

    exportState() {
    }

    importState(_state) {
    }
}

TOC.prototype.CLASS = 'tc-ctl-toc';
TC.control.TOC = TOC;
export default TOC;
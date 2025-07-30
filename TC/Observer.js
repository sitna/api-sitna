import TC from '../TC.js';
import Util from './Util.js';

function getAllElements(node) {
    let elements = [];

    function traverse(element) {
        elements.push(element);
        for (let i = 0; i < element.childNodes.length; i++) {
            traverse(element.childNodes[i]);
        }
    }

    traverse(node);
    return elements;
}

class Observer { 
    #listener;
    constructor(object) {
        /*const instance = this;*/
        this.#listener = new Map();
        this.#addElement(object);
        
    }
    
    #readAttributes(attribute, element) {
        const observer = this;
        switch (attribute.name.toLowerCase()) {

            case "tc-vc-model":
                this.#addListener(attribute.value, {
                    node: element,
                    get: function () {
                        return element.value;
                    },
                    set: function (value) {
                        element.value = value;
                    }
                });

                break;

            //Modelado de eventos
            case "tc-vc-click":                
                element.addEventListener("click", this.getEventListener.bind(element, attribute.value, this));
                delete element[attribute.name.toLowerCase()];
                break;

            case "tc-vc-change":
                element.addEventListener("change", this.getEventListener.bind(element, attribute.value, this));
                delete element[attribute.name.toLowerCase()];
                break;
            //modelado de propiedades
            case "tc-vc-value":                
                this.#addProperty(attribute.value, {
                    node: element,
                    get: function () {
                        return element.value;
                    },
                    set: function (value) {
                        element.value = value;
                    }
                });
                element.attributes.removeNamedItem(attribute.name.toLowerCase())
                break;
            case "tc-vc-disabled":
                var conditions = {};
                var reduceHandler = attribute.value.includes("&") ? (vi, va) => vi & va : (vi, va) => vi | va;
                var initialValue = attribute.value.includes("&");
                attribute.value.split(/\||\&/gm).forEach((condition) => {
                    condition = condition.trim();
                    observer.#addProperty(condition.startsWith("!") ? condition.substr(1) : condition, {
                        node: element,
                        get: function () {
                            return !!element.disabled;
                        },
                        set: function (value) {
                            conditions[condition] = (value == (condition.startsWith("!") ? false : true));
                            element.disabled = !!Object.values(conditions).reduce(reduceHandler, initialValue)
                        }
                    });
                })                
                element.attributes.removeNamedItem(attribute.name.toLowerCase())
                break;
            case "tc-vc-visible":
                this.#addProperty(attribute.value.startsWith("!") ? attribute.value.substr(1) : attribute.value, {
                    node: element,
                    get: function () {
                        return element.style.display !== "none";
                    },
                    set: function (value) {
                        element.style.display = (attribute.value.startsWith("!") ? !value : value) ? "" : "none";
                    }
                });
                element.attributes.removeNamedItem(attribute.name.toLowerCase())
                break;
        }
    }
    #addElement(_element) {
        if (!_element) return;
        // Get all elements within the root element
        const elements = _element instanceof Array ?
            [..._element, ..._element.reduce((pv, va) => { return pv.concat(...va.querySelectorAll('*')) }, [])]
            : [_element, ..._element.querySelectorAll('*')];
        //const regex = /\[{2}\s*(?<key>.+)\s*\]{2}/gmi;

        elements.forEach((element) => {
            // Get all attributes of the element                
            Array.from(element.attributes).forEach(attr => {
                let m;
                if ((m = /\[{2}\s*(?<key>.+)\s*\]{2}/gmi.exec(attr.value)) != null) {
                    this.#addListener(m.groups.key, {
                        node: element,
                        attribute: attr.name,
                        get: function () {
                            return element[attr.name] || element.attributes[attr.name].value;
                        },
                        set: function (value) {
                            if (element[attr.name]) element[attr.name] = value;
                            else element.setAttribute(attr.name, value);
                        }
                    });
                }
                if (attr.name.toLowerCase().startsWith("tc-vc-")) {
                    this.#readAttributes(attr, element)
                }
            });
            //busca en el contenido
            getAllElements(element).filter(node => node.nodeType === 3).forEach((node) => {
                let m;
                if ((m = /\[{2}\s*(?<key>.+)\s*\]{2}/gmi.exec(node.textContent)) != null) {
                    node._original = node.textContent;
                    this.#addListener(m.groups.key, {
                        node: node,
                        get: function (n) {
                            return n.textContent;
                        },
                        set: function (value, n) {
                            if (value?.match(/.*\<.+\>/gm)) {
                                //eliminar nodos creados anteriormente
                                Array.from(n.parentElement.childNodes).filter((node) => node !== n).forEach((node) => node.remove());
                                n.parentElement.insertAdjacentHTML("beforeend", value);
                                n.textContent = "";
                            }
                            else
                                n.textContent = Util.htmlToText(n._original.replace(m[0], value));
                        }
                    });
                }
            });
        });        
    }
    #addListener(key, properties) {
        if (this.#listener.has(key)){
            if (!this.#listener.get(key).find((prop) => properties.node === prop.node && properties.attribute === prop.attribute ))
                this.#listener.set(key, [...this.#listener.get(key), properties]);
            //console.log(key + ": " + this.#listener.get(key));
        }
        else{
            this.#listener.set(key, [properties]);
        }
        if (!Object.prototype.hasOwnProperty.call(this, key)) {
            if (typeof (key[properties]) !== 'function') {
                Object.defineProperty(this, key, {
                    get: function () {
                        const prop = this.#listener.get(key)[0];
                        return prop.get(prop.node);
                    },
                    set: function (value) {
                        this.#listener.get(key).forEach((prop, i) => {
                            if (prop.node.nodeType===1 && prop.node[key] !== undefined)
                                prop.node[key] = value;
                            else
                                prop.set(value, prop.node);
                        })
                    },
                    enumerable: true,
                    configurable: true
                });
            }
            else
                this[properties] = key[properties];
        }        
    }
    #addProperty(key, properties) {
        if (this.#listener.has(key)) {
            if (!this.#listener.get(key).find((prop) => properties.node === prop.node))
                this.#listener.set(key, [...this.#listener.get(key), properties]);
            //console.log(key + ": " + this.#listener.get(key));
        }
        else {
            this.#listener.set(key, [properties]);
        }
        if (!Object.prototype.hasOwnProperty.call(this, key)) {
            Object.defineProperty(this, key, {
                get: function () {
                    const prop = this.#listener.get(key)[0];                    
                    return prop.get(prop.node);
                },
                set: function (value) {
                    this.#listener.get(key).forEach((prop, i) => {
                        if (prop.node[key] !== undefined)
                            prop.node[key] = value;
                        else
                            prop.set(value, prop.node);
                    })
                },
                enumerable: true,
                configurable: true
            });
            
        }    
    }
    add(node) {
        this.#addElement(node);
    }
    addListener(key, properties) {
        this.#addListener(key, properties);
    }
    getEventListener(key,view,event) { 
        view.#listener.get(key).apply(this, [event]);
    }
    addEventListener(model,key) {
        this.#listener.set(key, model[key]);
    }
    
}
TC.mvc = TC.mvc || {};
TC.mvc.Observer = Observer;
export default Observer;
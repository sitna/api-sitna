import TC from '../TC';

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
        const instance = this;
        this.#listener = new Map();
        this.#addElement(object);
        
    }
    #addElement(_element) {
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
                            return element.attributes[attr.name].value;
                        },
                        set: function (value) {
                            element.setAttribute(attr.name, value);
                        }
                    });
                }
                if (attr.name.toLowerCase().startsWith("tc-vc-")) {
                    switch (attr.name.toLowerCase()) {
                        case "tc-vc-model":
                            this.#addListener(attr.value, {
                                node: element,
                                get: function () {
                                    return element.value;
                                },
                                set: function (value) {
                                    element.value = value;
                                }
                            });

                            break;
                        case "tc-vc-click":
                            element.addEventListener("click", (evt) => { instance.handler.apply(instance, [attr.value, evt]) })
                            break;
                        case "tc-vc-change":
                            element.addEventListener("change", (evt) => { instance.handler.apply(instance, [attr.value, evt]) })
                            break;
                    }
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
                                n.textContent = n._original.replace(m[0], value);
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
        if (!this.hasOwnProperty(key)) {
            Object.defineProperty(this, key, {
                get: function() {
                    const prop = this.#listener.get(key)[0];
                    return prop.get(prop.node);
                },
                set: function(value) {
                    this.#listener.get(key).forEach((prop,i) => {
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
    
}
TC.mvc = TC.mvc || {};
TC.mvc.Observer = Observer;
export default Observer;
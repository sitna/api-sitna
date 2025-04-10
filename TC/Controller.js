import TC from '../TC';

class Controller {
    constructor(model, view) {        
        this.model = model;
        this.view = view;
        //recorrer todos los atributos de la vista
        Object.getOwnPropertyNames(this.model).forEach((propName) => {
            if (Object.prototype.hasOwnProperty.call(view, propName)) {
                this.model["#" + propName] = this.model[propName];
                Object.defineProperty(this.model, propName, {
                    get: function () {
                        return this["#" + propName];
                    },
                    set: function (value) {
                        this["#" + propName] = value;
                        view[propName] = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                view[propName] = model[propName];
            }
            if (typeof model[propName] === 'function' || model[propName] instanceof Promise) {
                this.view.addListener(model,propName, model[propName]);
            }
        })
        
        //this.view.bindUpdateText(this.handleUpdateText.bind(this));
        //this.view.updateText(this.model.getText());
    }
    //handleUpdateText(newText) {
    //    this.model.setText(newText);
    //    this.view.updateText(this.model.getText());
    //}
    add(nodes) {
        const self = this;
        self.view.add(nodes);
        //check if the model need a new getter and setter
        Object.getOwnPropertyNames(self.view).forEach((property) => {
            const _prop = Object.getOwnPropertyDescriptor(self.model, property);
            //had not getter a setter, then I create once por the new property
            if (!_prop.get && !_prop.set) {
                self.model["#" + property] = self.model[property];
                Object.defineProperty(self.model, property, {
                    get: function () {
                        return this["#" + property];
                    },
                    set: function (value) {
                        this["#" + property] = value;
                        self.view[property] = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                //
            }
            self.view[property] = self.model[property];
        })
    }
    setPropertyModel(key,model) {
        const self = this;
        Object.defineProperty(model, key, {
            get: function () {
                return this["#" + key];
            },
            set: function (value) {
                this["#" + key] = value;
                self.view[key] = value;
            },
            enumerable: true,
            configurable: true
        });
    }
    setAttribute(property, attrName, node) {
        if (Object.prototype.hasOwnProperty.call(this.model, property)) {
            const model = this.model;
            const view = this.view;
            const _prop = Object.getOwnPropertyDescriptor(model, property);
            //had not getter a setter, then I create once por the new property
            if (!_prop.get && !_prop.set) {
                model["#" + property] = model[property];
                Object.defineProperty(model, property, {
                    get: function () {
                        return this["#" + property];
                    },
                    set: function (value) {
                        this["#" + property] = value;
                        view[property] = value;
                    },
                    enumerable: true,
                    configurable: true
                });
            }
                //
            view.addListener(property, {
                node: node,
                attribute: attrName,
                get: function () {
                    return node.attributes[attrName].value;
                },
                set: function (value) {
                    node.setAttribute(attrName, value);
                }
            })
            
            view[property] = model[property];
        }
        else {
            throw 'No existe esta clave en el modelo';
        }
    }
}
TC.mvc = TC.mvc || {};
TC.mvc.Controller = Controller;
export default Controller;
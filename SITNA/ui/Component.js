import TC from '../../TC.js';

const elementName = 'sitna-component';

class Component extends HTMLElement {

    // Diccionario de estilos precargados para evitar FOUC
    static #preloadedStyles = new Map();

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleText = Component.#preloadedStyles.get(this.elementName);
        if (styleText) {
            const style = document.createElement('style');
            style.textContent = styleText;
            this.shadowRoot.appendChild(style);
        }
        else {
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.href = `${Component.#getStylePath()}${this.elementName}.css`;
            this.shadowRoot.appendChild(link);
        }
    }

    get elementName() {
        return elementName;
    }

    createTemplate() {
        const templateId = `for-${this.tagName.toLowerCase()}`;
        let template = document.querySelector(`template[id="${templateId}"]`);
        if (!template) {
            template = document.createElement('template');
            template.setAttribute('id', templateId);
            template.innerHTML = '<slot></slot>';
            document.body.appendChild(template);
            return true;
        }
        return false;
    }

    getTemplate() {
        return document.querySelector(`template[id="for-${this.tagName.toLowerCase()}"]`);
    }

    static #getStylePath() {
        return `${TC.apiLocation}css/ui/`;
    }

    static async preloadStyle(elmName) {
        const response = await TC.ajax({
            url: `${Component.#getStylePath()}${elmName}.css`
        });
        Component.#preloadedStyles.set(elmName, response.data);
    }
}

export default Component;
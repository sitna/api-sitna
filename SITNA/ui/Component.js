import TC from '../../TC';

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
            style.innerText = styleText;
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
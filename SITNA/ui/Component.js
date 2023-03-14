import TC from '../../TC';

const elementName = 'sitna-component';

class Component extends HTMLElement {

    constructor() {
        super();
        const self = this;
        self.attachShadow({ mode: 'open' });
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.href = `${Component.#getStylePath()}${self.elementName}.css`;
        self.shadowRoot.appendChild(link);
    }

    get elementName() {
        return elementName;
    }

    static #getStylePath() {
        return `${TC.apiLocation}css/ui/`;
    }

    static preloadStyle(elmName) {
        if (globalThis.document) {
            const link = document.createElement('link');
            link.setAttribute('rel', 'preload');
            link.setAttribute('as', 'style');
            link.href = `${Component.#getStylePath()}${elmName}.css`;
            document.head.appendChild(link);
        }
    }
}

export default Component;
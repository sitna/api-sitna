import TC from '../../TC';

const elementName = 'sitna-component';

class Component extends HTMLElement {

    constructor() {
        super();
        const self = this;
        self.attachShadow({ mode: 'open' });
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.href = `${TC.apiLocation}css/ui/${self.elementName}.css`;
        self.shadowRoot.appendChild(link);
    }

    get elementName() {
        return elementName;
    }
}

export default Component;
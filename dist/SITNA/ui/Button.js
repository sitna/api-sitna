import Component from './Component';

const elementName = "sitna-button";

class Button extends Component {

    #button;
    #variant = Button.variant.DEFAULT;
    #active = false;

    static variant = {
        DEFAULT: 'default',
        ICON: 'icon',
        ICONLEFT: 'iconleft',
        LINK: 'link',
        MINIMAL: 'minimal'
    }

    static action = {
        CLOSE: 'close',
        DELETE: 'delete',
        DOWNLOAD: 'download',
        DOWNLOAD_ALL: 'download_all',
        EDIT: 'edit',
        SHARE: 'share'
    }

    constructor() {
        super();
        const self = this;
        self.#button = document.createElement('button');
        self.#button.setAttribute('type', 'button');
        self.shadowRoot.appendChild(self.#button);
    }

    connectedCallback() {
        const self = this;
        self.text = self.text;
        self.variant = self.variant;
        self.active = self.active;
        self.disabled = self.disabled;
        self.icon = self.icon;
        self.iconText = self.iconText;
    }

    static get observedAttributes() {
        return ['text', 'icon', 'variant', 'disabled', 'active', 'icon-text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'disabled') {
            self.disabled = self.hasAttribute(name);
        }
        else if (name === 'active') {
            self.active = self.hasAttribute(name);
        }
        if (oldValue !== newValue) {
            if (name === 'text') {
                self.text = newValue;
            }
            if (name === 'icon') {
                self.icon = newValue;
            }
            if (name === 'variant') {
                self.variant = newValue;
            }
            if (name === 'icon-text') {
                self.iconText = newValue;
            }
        }
    }

    get elementName() {
        return elementName;
    }

    get variant() {
        return this.#variant;
    }

    set variant(value) {
        const self = this;

        self.#button.classList.remove(self.#variant);
        if (value && value !== Button.variant.DEFAULT) {
            self.#button.classList.add(value);
            self.setAttribute('variant', value);
        }
        else {
            self.removeAttribute('variant');
        }
        if (value === Button.variant.ICON || value === Button.variant.MINIMAL || value === Button.variant.LINK) {
            self.#button.setAttribute('title', self.text);
        }
        else {
            self.#button.removeAttribute('title');
        }
        self.#variant = value || Button.variant.DEFAULT;
    }

    get text() {
        return this.getAttribute('text');
    }

    set text(value) {
        const self = this;
        self.#button.innerHTML = value;
        self.setAttribute('text', value);
    }

    get iconText() {
        return this.getAttribute('icon-text');
    }

    #setDataValue(name, value) {
        const self = this;
        if (value) {
            self.#button.setAttribute('data-' + name, value);
            self.setAttribute(name, value);
        }
        else {
            delete self.#button.removeAttribute('data-' + name);
            self.removeAttribute(name);
        }
    }

    set iconText(value) {
        const self = this;
        self.#setDataValue('icon-text', value);
    }

    get icon() {
        return this.getAttribute('icon');
    }

    set icon(value) {
        const self = this;
        self.#setDataValue('icon', value);
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        const self = this;
        const boolValue = !!value;
        self.toggleAttribute('disabled', boolValue);
        self.#button.disabled = boolValue;
    }

    get active() {
        return this.#active;
    }

    set active(value) {
        const self = this;
        const boolValue = !!value;
        self.toggleAttribute('active', boolValue);
        self.#button.classList.toggle('active', boolValue);
    }}

customElements.define(elementName, Button);
export default Button;
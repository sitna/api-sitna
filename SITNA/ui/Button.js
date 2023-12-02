import Component from './Component';

const elementName = "sitna-button";

class Button extends Component {

    #button;
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
        return ['text', 'icon', 'variant', 'disabled', 'active', 'icon-text', 'title'];
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
            switch (name) {
                case 'text':
                    self.text = newValue;
                    break;
                case 'icon':
                    self.icon = newValue;
                    break;
                case 'variant':
                    self.variant = newValue;
                    break;
                case 'icon-text':
                    self.iconText = newValue;
                    break;
                case 'title':
                    if (self.hasAttribute(name)) {
                        if (self.#button.hasAttribute('title')) {
                            self.#button.setAttribute('title', newValue);
                        }
                    }
                    else {
                        if (self.#button.hasAttribute('title')) {
                            self.text = self.text;
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }

    get elementName() {
        return elementName;
    }

    get variant() {
        return this.getAttribute('variant') || Button.variant.DEFAULT;
    }

    set variant(value) {
        const self = this;
        value = value || Button.varian.DEFAULT;

        self.#button.classList.remove(self.variant);
        if (value !== Button.variant.DEFAULT) {
            self.#button.classList.add(value);
            self.setAttribute('variant', value);
        }
        else {
            self.removeAttribute('variant');
        }
        const text = self.text;
        if (text && (value === Button.variant.ICON || value === Button.variant.MINIMAL || value === Button.variant.LINK)) {
            self.#button.setAttribute('title', text);
        }
        else {
            self.#button.removeAttribute('title');
        }
    }

    get text() {
        return this.getAttribute('text');
    }

    set text(value) {
        const self = this;
        self.#button.innerHTML = value ?? '';
        if (value) {
            self.setAttribute('text', value);
        }
        else {
            self.removeAttribute('text');
        }
        const variant = self.variant;
        if (variant === Button.variant.ICON || variant === Button.variant.MINIMAL || variant === Button.variant.LINK) {
            if (value) {
                self.#button.setAttribute('title', value);
            }
            else {
                self.#button.removeAttribute('title');
            }
        }
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
        return this.hasAttribute('active');
    }

    set active(value) {
        const self = this;
        const boolValue = !!value;
        self.toggleAttribute('active', boolValue);
        self.#button.classList.toggle('active', boolValue);
    }
}

if (!customElements.get(elementName)) {
    Component.preloadStyle(elementName);
    customElements.define(elementName, Button);
}
export default Button;
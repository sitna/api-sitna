import Component from './Component';

const elementName = "sitna-button";

class Button extends Component {

    #button;

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
        this.#button = document.createElement('button');
        this.#button.setAttribute('type', 'button');
        this.shadowRoot.appendChild(this.#button);
    }

    connectedCallback() {
        this.text = this.text;
        this.variant = this.variant;
        this.active = this.active;
        this.disabled = this.disabled;
        this.icon = this.icon;
        this.iconText = this.iconText;
    }

    static get observedAttributes() {
        return ['text', 'icon', 'variant', 'disabled', 'active', 'icon-text', 'title'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        if (name === 'disabled') {
            this.disabled = this.hasAttribute(name);
        }
        else if (name === 'active') {
            this.active = this.hasAttribute(name);
        }
        if (oldValue !== newValue) {
            switch (name) {
                case 'text':
                    this.text = newValue;
                    break;
                case 'icon':
                    this.icon = newValue;
                    break;
                case 'variant':
                    this.variant = newValue;
                    break;
                case 'icon-text':
                    this.iconText = newValue;
                    break;
                case 'title':
                    if (this.hasAttribute(name)) {
                        if (this.#button.hasAttribute('title')) {
                            this.#button.setAttribute('title', newValue);
                        }
                    }
                    else {
                        if (this.#button.hasAttribute('title')) {
                            this.text = this.text;
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
        value = value || Button.varian.DEFAULT;

        this.#button.classList.remove(this.variant);
        if (value !== Button.variant.DEFAULT) {
            this.#button.classList.add(value);
            this.setAttribute('variant', value);
        }
        else {
            this.removeAttribute('variant');
        }
        const text = this.text;
        if (text && (value === Button.variant.ICON || value === Button.variant.MINIMAL || value === Button.variant.LINK)) {
            this.#button.setAttribute('title', text);
        }
        else {
            this.#button.removeAttribute('title');
        }
    }

    get text() {
        return this.getAttribute('text');
    }

    set text(value) {
        this.#button.innerHTML = value ?? '';
        if (value) {
            this.setAttribute('text', value);
        }
        else {
            this.removeAttribute('text');
        }
        const variant = this.variant;
        if (variant === Button.variant.ICON || variant === Button.variant.MINIMAL || variant === Button.variant.LINK) {
            if (value) {
                this.#button.setAttribute('title', value);
            }
            else {
                this.#button.removeAttribute('title');
            }
        }
    }

    get iconText() {
        return this.getAttribute('icon-text');
    }

    #setDataValue(name, value) {
        if (value) {
            this.#button.setAttribute('data-' + name, value);
            this.setAttribute(name, value);
        }
        else {
            delete this.#button.removeAttribute('data-' + name);
            this.removeAttribute(name);
        }
    }

    set iconText(value) {
        this.#setDataValue('icon-text', value);
    }

    get icon() {
        return this.getAttribute('icon');
    }

    set icon(value) {
        this.#setDataValue('icon', value);
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        const boolValue = !!value;
        this.toggleAttribute('disabled', boolValue);
        this.#button.disabled = boolValue;
    }

    get active() {
        return this.hasAttribute('active');
    }

    set active(value) {
        const boolValue = !!value;
        this.toggleAttribute('active', boolValue);
        this.#button.classList.toggle('active', boolValue);
    }
}

if (!customElements.get(elementName)) {
    Component.preloadStyle(elementName);
    customElements.define(elementName, Button);
}
export default Button;
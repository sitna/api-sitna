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
        this.#onTextChange();
        this.#onVariantChange(this.variant, this.variant);
        this.#onActiveChange();
        this.#onDisabledChange();
        this.#onIconChange();
        this.#onIconTextChange();
    }

    static get observedAttributes() {
        return ['text', 'icon', 'variant', 'disabled', 'active', 'icon-text', 'title'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        if (name === 'disabled') {
            this.#onDisabledChange();
        }
        else if (name === 'active') {
            this.#onActiveChange();
        }
        if (oldValue !== newValue) {
            switch (name) {
                case 'text':
                    this.#onTextChange();
                    break;
                case 'icon':
                    this.#onIconChange();
                    break;
                case 'variant':
                    this.#onVariantChange(oldValue, newValue);
                    break;
                case 'icon-text':
                    this.#onIconTextChange();
                    break;
                case 'title':
                    if (this.hasAttribute(name)) {
                        if (this.#button.hasAttribute('title')) {
                            this.#button.setAttribute('title', newValue);
                        }
                    }
                    else {
                        if (this.#button.hasAttribute('title')) {
                            this.#onTextChange();
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

    get text() {
        return this.getAttribute('text');
    }

    set text(value) {
        this.#setOptionalAttribute('text', value);
    }

    #onTextChange() {
        const text = this.text;
        this.#button.innerHTML = text ?? '';
        const variant = this.variant;
        if (variant === Button.variant.ICON || variant === Button.variant.MINIMAL || variant === Button.variant.LINK) {
            if (text) {
                this.#button.setAttribute('title', text);
            }
            else {
                this.#button.removeAttribute('title');
            }
        }
    }

    get icon() {
        return this.getAttribute('icon');
    }

    set icon(value) {
        this.#setOptionalAttribute('icon', value);
    }

    #onIconChange() {
        this.#setDataValue('icon', this.icon);
    }

    get variant() {
        return this.getAttribute('variant') || Button.variant.DEFAULT;
    }

    set variant(value) {
        this.#setOptionalAttribute('variant', value);
    }

    #onVariantChange(oldValue, newValue) {
        this.#button.classList.remove(oldValue);
        newValue ??= Button.variant.DEFAULT;
        if (newValue !== Button.variant.DEFAULT) {
            this.#button.classList.add(newValue);
        }
        const text = this.text;
        if (text && (newValue === Button.variant.ICON || newValue === Button.variant.MINIMAL || newValue === Button.variant.LINK)) {
            this.#button.setAttribute('title', text);
        }
        else {
            this.#button.removeAttribute('title');
        }
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        this.toggleAttribute('disabled', !!value);
    }

    #onDisabledChange() {
        this.#button.disabled = this.disabled;
    }

    get active() {
        return this.hasAttribute('active');
    }

    set active(value) {
        this.toggleAttribute('active', !!value);
    }

    #onActiveChange() {
        this.#button.classList.toggle('active', this.active);
    }

    get iconText() {
        return this.getAttribute('icon-text');
    }

    set iconText(value) {
        this.#setOptionalAttribute('icon-text', value);
    }

    #onIconTextChange() {
        this.#setDataValue('icon-text', this.iconText);
    }

    #setOptionalAttribute(name, value) {
        if (value) {
            this.setAttribute(name, value);
        }
        else {
            this.removeAttribute(name);
        }
    }

    #setDataValue(name, value) {
        if (value) {
            this.#button.setAttribute('data-' + name, value);
        }
        else {
            this.#button.removeAttribute('data-' + name);
        }
    }
}

if (!customElements.get(elementName)) {
    Component.preloadStyle(elementName);
    customElements.define(elementName, Button);
}
export default Button;
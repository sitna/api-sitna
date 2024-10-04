import Component from './Component';

const elementName = "sitna-toggle";

class Toggle extends Component {

    #checkbox;

    constructor() {
        super();
        this.#checkbox = document.createElement('input');
        this.#checkbox.setAttribute('type', 'checkbox');
        this.#checkbox.addEventListener('change', (_e) => {
            this.checked = this.#checkbox.checked;
            const event = new Event('change', { bubbles: true });
            this.dispatchEvent(event);
        });
        this.shadowRoot.appendChild(this.#checkbox);
    }

    connectedCallback() {
        this.#onTextChange();
        this.#onCheckedChange();
        this.#onCheckedIconTextChange();
        this.#onUncheckedIconTextChange();
        this.#onDisabledChange();
    }

    static get observedAttributes() {
        return ['text', 'disabled', 'checked', 'checked-icon-text', 'unchecked-icon-text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        if (name === 'disabled') {
            this.#onDisabledChange();
        }
        else if (name === 'checked') {
            this.#onCheckedChange();
        }
        if (oldValue !== newValue) {
            if (name === 'text') {
                this.#onTextChange();
            }
            if (name === 'checked-icon-text') {
                this.#onCheckedIconTextChange();
            }
            if (name === 'unchecked-icon-text') {
                this.#onUncheckedIconTextChange();
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
        this.setAttribute('text', value);
    }

    #onTextChange() {
        this.#checkbox.setAttribute('title', this.text);
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        this.toggleAttribute('disabled', !!value);
    }

    #onDisabledChange() {
        this.#checkbox.disabled = this.disabled;
    }

    get checked() {
        return this.hasAttribute('checked');
    }

    set checked(value) {
        this.toggleAttribute('checked', !!value);
    }

    #onCheckedChange() {
        this.#checkbox.checked = this.checked;
    }

    get checkedIconText() {
        return this.getAttribute('checked-icon-text');
    }

    set checkedIconText(value) {
        this.#setOptionalAttribute('checked-icon-text', value);
    }

    #onCheckedIconTextChange() {
        this.#setDataValue('checked-icon-text', this.checkedIconText);
    }

    get uncheckedIconText() {
        return this.getAttribute('unchecked-icon-text');
    }

    set uncheckedIconText(value) {
        this.#setOptionalAttribute('unchecked-icon-text', value);
    }

    #onUncheckedIconTextChange() {
        this.#setDataValue('unchecked-icon-text', this.uncheckedIconText);
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
            this.#checkbox.setAttribute('data-' + name, value);
        }
        else {
            this.#checkbox.removeAttribute('data-' + name);
        }
    }
}

if (!customElements.get(elementName)) {
    Component.preloadStyle(elementName);
    customElements.define(elementName, Toggle);
}
export default Toggle;
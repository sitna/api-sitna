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
        this.text = this.text;
        this.checked = this.checked;
        this.checkedIconText = this.checkedIconText;
        this.uncheckedIconText = this.uncheckedIconText;
        this.disabled = this.disabled;
    }

    static get observedAttributes() {
        return ['text', 'disabled', 'checked', 'checked-icon-text', 'unchecked-icon-text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        if (name === 'disabled') {
            this.disabled = this.disabled;
        }
        else if (name === 'checked') {
            this.checked = this.checked;
        }
        if (oldValue !== newValue) {
            if (name === 'text') {
                this.text = newValue;
            }
            if (name === 'checked-icon-text') {
                this.checkedIconText = newValue;
            }
            if (name === 'unchecked-icon-text') {
                this.uncheckedIconText = newValue;
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
        this.#checkbox.setAttribute('title', value);
        this.setAttribute('text', value);
    }

    get checkedIconText() {
        return this.getAttribute('checked-icon-text');
    }

    get uncheckedIconText() {
        return this.getAttribute('unchecked-icon-text');
    }

    #setDataValue(name, value) {
        if (value) {
            this.#checkbox.setAttribute('data-' + name, value);
            this.setAttribute(name, value);
        }
        else {
            delete this.#checkbox.removeAttribute('data-' + name);
            this.removeAttribute(name);
        }
    }

    set checkedIconText(value) {
        this.#setDataValue('checked-icon-text', value);
    }

    set uncheckedIconText(value) {
        this.#setDataValue('unchecked-icon-text', value);
    }

    get checked() {
        return this.hasAttribute('checked');
    }

    set checked(value) {
        const boolValue = !!value;
        this.toggleAttribute('checked', boolValue);
        this.#checkbox.checked = boolValue;
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        const boolValue = !!value;
        this.toggleAttribute('disabled', boolValue);
        this.#checkbox.disabled = boolValue;
    }
}

if (!customElements.get(elementName)) {
    Component.preloadStyle(elementName);
    customElements.define(elementName, Toggle);
}
export default Toggle;
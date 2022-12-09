import Component from './Component';

const elementName = "sitna-toggle";

class Toggle extends Component {

    #checkbox;

    constructor() {
        super();
        const self = this;
        self.#checkbox = document.createElement('input');
        self.#checkbox.setAttribute('type', 'checkbox');
        self.#checkbox.addEventListener('change', function (_e) {
            self.checked = self.#checkbox.checked;
            const event = new Event('change', { bubbles: true });
            self.dispatchEvent(event);
        });
        self.shadowRoot.appendChild(self.#checkbox);
    }

    connectedCallback() {
        const self = this;
        self.text = self.text;
        self.checked = self.checked;
        self.checkedIconText = self.checkedIconText;
        self.uncheckedIconText = self.uncheckedIconText;
        self.disabled = self.disabled;
    }

    static get observedAttributes() {
        return ['text', 'disabled', 'checked', 'checked-icon-text', 'unchecked-icon-text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'disabled') {
            self.disabled = self.disabled;
        }
        else if (name === 'checked') {
            self.checked = self.checked;
        }
        if (oldValue !== newValue) {
            if (name === 'text') {
                self.text = newValue;
            }
            if (name === 'checked-icon-text') {
                self.checkedIconText = newValue;
            }
            if (name === 'unchecked-icon-text') {
                self.uncheckedIconText = newValue;
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
        const self = this;
        self.#checkbox.setAttribute('title', value);
        self.setAttribute('text', value);
    }

    get checkedIconText() {
        return this.getAttribute('checked-icon-text');
    }

    get uncheckedIconText() {
        return this.getAttribute('unchecked-icon-text');
    }

    #setDataValue(name, value) {
        const self = this;
        if (value) {
            self.#checkbox.setAttribute('data-' + name, value);
            self.setAttribute(name, value);
        }
        else {
            delete self.#checkbox.removeAttribute('data-' + name);
            self.removeAttribute(name);
        }
    }

    set checkedIconText(value) {
        const self = this;
        self.#setDataValue('checked-icon-text', value);
    }

    set uncheckedIconText(value) {
        const self = this;
        self.#setDataValue('unchecked-icon-text', value);
    }

    get checked() {
        return this.hasAttribute('checked');
    }

    set checked(value) {
        const self = this;
        const boolValue = !!value;
        self.toggleAttribute('checked', boolValue);
        self.#checkbox.checked = boolValue;
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        const self = this;
        const boolValue = !!value;
        self.toggleAttribute('disabled', boolValue);
        self.#checkbox.disabled = boolValue;
    }
}

customElements.define(elementName, Toggle);
export default Toggle;
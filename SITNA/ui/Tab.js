import Component from './Component';
import Consts from '../../TC/Consts';
import Util from '../../TC/Util';

const elementName = "sitna-tab";

class Tab extends Component {
    #text;

    constructor() {
        super();
        this.#text = document.createTextNode('');
        this.shadowRoot.appendChild(this.#text);
        this.addEventListener(Consts.event.CLICK, (_e) => this.onClick(), { passive: true });
    }

    connectedCallback() {
        this.#onTextChange();
        this.toggleAttribute('selected', this.selected);
        this.#onSelectedChange();
    }

    static get observedAttributes() {
        return ['text', 'selected', 'disabled', 'deselectable'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        if (name === 'text') {
            this.#onTextChange();
        }
        else if (name === 'selected') {
            this.#onSelectedChange();
        }
    }

    get elementName() {
        return elementName;
    }

    get text() {
        return this.getAttribute('text') || '';
    }

    set text(value) {
        if (value) {
            this.setAttribute('text', value);
        }
        else {
            this.removeAttribute('text');
        }
    }

    #onTextChange() {
        this.shadowRoot.removeChild(this.#text);
        this.#text = document.createTextNode(this.text);
        this.shadowRoot.appendChild(this.#text);
    }

    get group() {
        return this.getAttribute('group');
    }

    get target() {
        const targetId = this.getAttribute('for');
        if (targetId) {
            return document.getElementById(targetId);
        }
        return null;
    }

    get selected() {
        return this.hasAttribute('selected');
    }

    set selected(value) {
        this.toggleAttribute('selected', !!value);
    }

    #onSelectedChange() {
        const siblings = this.siblings;
        const allTabs = siblings.concat(this);
        if (this.selected) {
            siblings.forEach(s => {
                s.removeAttribute('selected');
            });
        }
        const tabSelected = allTabs.some(s => s.selected);
        allTabs.forEach(t => {
            t.toggleAttribute('no-selection', !tabSelected);
            const target = t.target;
            if (target) {
                target.classList.toggle(Consts.classes.HIDDEN, !t.selected);
            }
        });
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        this.toggleAttribute('disabled', !!value);
    }

    get deselectable() {
        return this.hasAttribute('deselectable');
    }

    set deselectable(value) {
        this.toggleAttribute('deselectable', !!value);
    }

    get siblings() {
        const allTabs = Array.from(document.querySelectorAll(`${this.elementName}[group="${this.group}"]`));
        return allTabs.filter(t => t !== this);
    }

    onClick() {
        if (!this.disabled) {
            const condition = this.deselectable ? !this.selected : true;
            this.toggleAttribute('selected', condition);
            if (Util.isFunction(this.callback)) {
                this.callback();
            }
        }
    }
}

if (!customElements.get(elementName)) {
    Component.preloadStyle(elementName);
    customElements.define(elementName, Tab);
}
export default Tab;
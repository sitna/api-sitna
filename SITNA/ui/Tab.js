import Component from './Component';
import Consts from '../../TC/Consts';
import Util from '../../TC/Util';

const elementName = "sitna-tab";

class Tab extends Component {
    #text;

    constructor() {
        super();
        const self = this;
        self.#text = document.createTextNode('');
        self.shadowRoot.appendChild(self.#text);
        self.addEventListener(Consts.event.CLICK, function (_e) {
            self.onClick();
        }, { passive: true });
    }

    connectedCallback() {
        const self = this;
        self.text = self.text;
        self.toggleAttribute('selected', self.selected);
        self.#onSelectedChange();
    }

    static get observedAttributes() {
        return ['text', 'selected', 'disabled', 'deselectable'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'selected') {
            self.#onSelectedChange();
        }
    }

    get elementName() {
        return elementName;
    }

    get text() {
        return this.getAttribute('text') || '';
    }

    set text(value) {
        const self = this;
        self.shadowRoot.removeChild(self.#text);
        self.#text = document.createTextNode(value);
        self.shadowRoot.appendChild(self.#text);
        if (value) {
            self.setAttribute('text', value);
        }
        else {
            self.removeAttribute('text');
        }
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
        const self = this;
        const siblings = self.siblings;
        const allTabs = siblings.concat(self);
        if (self.selected) {
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
        const self = this;
        const allTabs = Array.from(document.querySelectorAll(`${self.elementName}[group="${self.group}"]`));
        return allTabs.filter(t => t !== self);
    }

    onClick() {
        const self = this;
        if (!self.disabled) {
            const condition = self.deselectable ? !self.selected : true;
            self.toggleAttribute('selected', condition);
            if (Util.isFunction(self.callback)) {
                self.callback();
            }
        }
    }
}

if (!customElements.get(elementName)) {
    Component.preloadStyle(elementName);
    customElements.define(elementName, Tab);
}
export default Tab;
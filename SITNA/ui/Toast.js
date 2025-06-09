import Component from './Component';
import Consts from '../../TC/Consts';

const elementName = "sitna-toast";

class Toast extends Component {
    #duration;
    #fuse;
    #destroyTimeout;

    static type = {
        GENERIC: 'generic',
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
    }

    constructor() {
        super();
        this.createTemplate();
        const template = this.getTemplate();
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.#fuse = this.shadowRoot.querySelector('.fuse');
        this.addEventListener(Consts.event.CLICK, (_e) => this.onClick(), { passive: true });
        this.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'display') {
                getComputedStyle(this).getPropertyValue('display') === 'none' && this.remove();
            }
            else if (e.propertyName === 'opacity') {
                getComputedStyle(this).getPropertyValue('opacity') == 0 && this.remove();
            }
        });
    }

    connectedCallback() {
        this.#onTypeChange();
        this.#onDurationChange();
    }

    static get observedAttributes() {
        return ['type', 'duration'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        if (name === 'type') {
            this.#onTypeChange();
        }
        else if (name === 'duration') {
            this.#onDurationChange();
        }
    }

    get elementName() {
        return elementName;
    }

    createTemplate() {
        const result = super.createTemplate();
        if (result) {
            const template = this.getTemplate();
            template.innerHTML = '';
            const container = document.createElement('div');
            container.classList.add('container');
            template.content.appendChild(container);
            const slot = document.createElement('slot');
            container.appendChild(slot);
            const fuse = document.createElement('div');
            fuse.classList.add('fuse');
            template.content.appendChild(fuse);
        }
        return result;
    }

    get type() {
        return this.getAttribute('type') || Toast.type.GENERIC;
    }

    set type(value) {
        if (value && value !== Toast.type.GENERIC) {
            this.setAttribute('type', value);
        }
        else {
            this.removeAttribute('type');
        }
    }

    #onTypeChange() {
        // TO DO
    }

    get duration() {
        return this.getAttribute('duration') || getComputedStyle(this).getPropertyValue('--sitna-toast-duration');
    }

    set duration(value) {
        if (typeof value === 'number') value = `${value}ms`;
        if (value) {
            this.setAttribute('duration', value);
        }
        else {
            this.removeAttribute('duration');
        }
    }

    #onDurationChange() {
        const durationValue = this.duration;
        if (/^[\d.]+s$/.test(durationValue)) this.#duration = parseFloat(durationValue) * 1000;
        else this.#duration = parseInt(durationValue);
        this.#fuse.style.setProperty('--sitna-toast-duration', `${this.#duration}ms`);
        if (this.#destroyTimeout) {
            clearTimeout(this.#destroyTimeout);
        }
        this.#destroyTimeout = setTimeout(() => {
            this.destroy();
        }, this.#duration);
    }

    onClick() {
        // TO DO
    }

    destroy() {
        this.style.opacity = 0;
    }
}

if (!customElements.get(elementName)) {
    Component.preloadStyle(elementName);
    customElements.define(elementName, Toast);
}
export default Toast;
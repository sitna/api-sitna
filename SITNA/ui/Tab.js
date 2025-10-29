import Component from './Component.js';
import Consts from '../../TC/Consts.js';
import Util from '../../TC/Util.js';

const elementName = "sitna-tab";

/**
 * Componente web que representa una pestaña. Este componente se utiliza en grupos de más de un elemento y permite visualizar 
 * distintos contenidos relacionados en función de la pestaña seleccionada.
 * 
 * Como web component, puede instanciarse programáticamente con JavaScript o se puede crear directamente en HTML, mediante 
 * el elemento `<sitna-tab>`.
 * 
 * Como este componente tiene un [shadow DOM](https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_shadow_DOM), 
 * los estilos del botón no son accesibles desde el DOM de la página. Para personalizar los estilos,
 * se pueden usar las [variables CSS]{@tutorial 4-css_variables} disponibles.
 * @class Tab
 * @memberof SITNA.ui
 * @extends HTMLElement
 * @see [Usando shadow DOM](https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_shadow_DOM)
 * @see [Uso de propiedades personalizadas (variables) en CSS](https://developer.mozilla.org/es/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
 */
class Tab extends Component {
    #text;

    constructor() {
        super();
        this.createTemplate();
        const template = this.getTemplate();
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this.#onTextChange());
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

    /**
     * Texto de la pestaña. Alternativamente, se puede usar la propiedad de elemento HTML `textContent` o en el HTML incluir el texto 
     * dentro del elemento.
     * @memberof SITNA.ui.Tab
     * @instance
     * @type {string}
     * @name text
     */
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
        const text = this.text || this.textContent;
        if (this.textContent !== text) this.textContent = text;
    }

    /**
     * Grupo al que pertenece la pestaña. En las pestañas de un mismo grupo, solo puede estar seleccionada una a la vez. 
     * Esta propiedad existe también como atributo HTML.
     * @memberof SITNA.ui.Tab
     * @instance
     * @type {string}
     * @name group
     */
    get group() {
        return this.getAttribute('group');
    }

    /**
     * Elemento HTML controlado por la pestaña. Si la pestaña está seleccionada, el elemento objetivo se muestra; si no, se oculta.
     * Para establecer el elemento objetivo se debe usar el atributo HTML `for`, que debe contener el valor del atributo `id` de
     * dicho elemento.
     * @memberof SITNA.ui.Tab
     * @instance
     * @readonly
     * @type {HTMLElement}
     * @name target
     */
    get target() {
        const targetId = this.getAttribute('for');
        if (targetId) {
            return document.getElementById(targetId);
        }
        return null;
    }

    /**
     * Propiedad que define si la pestaña está seleccionada.
     * @memberof SITNA.ui.Tab
     * @instance
     * @type {boolean}
     * @name selected
     */
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

    /**
     * Propiedad que define si la pestaña se puede deseleccionar si se pulsa sobre ella cuando ya está seleccionada.
     * Esta propiedad existe también como atributo HTML.
     * @memberof SITNA.ui.Tab
     * @instance
     * @type {boolean}
     * @name deselectable
     */
    get deselectable() {
        return this.hasAttribute('deselectable');
    }

    set deselectable(value) {
        this.toggleAttribute('deselectable', !!value);
    }

    /**
     * Colección de las otras pestañas que pertenecen al mismo grupo que esta.
     * @memberof SITNA.ui.Tab
     * @instance
     * @readonly
     * @type {Tab[]}
     * @name siblings
     */
    get siblings() {
        const allTabs = Array.from(document.querySelectorAll(`${this.elementName}[group="${this.group}"]`));
        return allTabs.filter(t => t !== this);
    }

    /**
     * Método al que se llama cuando se hace clic sobre la pestaña. La funcionalidad por defecto establece que si la pestaña 
     * no está seleccionada, se selecciona, y si ya lo está y la propiedad `deselectable` es verdadera, se deselecciona.
     * @memberof SITNA.ui.Tab
     * @instance
     * @function
     * @name onClick
     * @example <caption>[Ver en vivo](../examples/ui.tab.onClick.html)</caption> {@lang html}
<div class="container">
    <sitna-tab group="tab-group" for="div-1">Primera pestaña</sitna-tab>
    <sitna-tab group="tab-group" for="div-2">Segunda pestaña</sitna-tab>
    <sitna-tab group="tab-group" for="div-3">Tercera pestaña</sitna-tab>
</div>
<div class="container">
    <section id="div-1" class="tc-hidden">Primera sección, veces seleccionada: <span>0</span></section>
    <section id="div-2" class="tc-hidden">Segunda sección, veces seleccionada: <span>0</span></section>
    <section id="div-3" class="tc-hidden">Tercera sección, veces seleccionada: <span>0</span></section>
</div>
<script>
    document.querySelectorAll("sitna-tab").forEach((tab) => {
        tab.onClick = function () {
            SITNA.ui.Tab.prototype.onClick.call(this);
            const span = this.target.querySelector("span");
            const times = parseInt(span.textContent);
            span.textContent = times + 1;
        }
    });
</script>
     */
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
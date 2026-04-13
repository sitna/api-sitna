import Component from './Component.js';

const elementName = "sitna-toggle";

/**
 * Componente web que representa un interruptor. Admite dos estilos visuales (variantes): casilla de verificación y
 * conmutador.
 * 
 * Como web component, puede instanciarse programáticamente con JavaScript o se puede crear directamente en HTML, mediante 
 * el elemento `<sitna-toggle>`.
 * 
 * Como este componente tiene un [shadow DOM](https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_shadow_DOM), 
 * los estilos del botón no son accesibles desde el DOM de la página. Para personalizar los estilos,
 * se pueden usar las [variables CSS]{@tutorial 4-css_variables} disponibles.
 * @class Toggle
 * @memberof SITNA.ui
 * @extends HTMLElement
 * @see [Usando shadow DOM](https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_shadow_DOM)
 * @see [Uso de propiedades personalizadas (variables) en CSS](https://developer.mozilla.org/es/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
 * @see {@tutorial 4-css_variables}
 */
class Toggle extends Component {

    #checkbox;
    #label;

    /**
     * @memberof SITNA.ui.Toggle
     * @enum {string} Enumerado con las variantes visuales disponibles para el botón.
     * @property {string} CHECKBOX="checkbox" - Estilo casilla de verificación (variedad por defecto).
     * @property {string} SWITCH="switch" - Estilo conmutador.
     * @static
     * @readonly
     */
    static variant = {
        CHECKBOX: 'checkbox',
        SWITCH: 'switch',
    };

    constructor() {
        super();
        this.#checkbox = document.createElement('input');
        this.#checkbox.setAttribute('type', 'checkbox');
        this.#checkbox.setAttribute('id', 'cb');
        this.#checkbox.addEventListener('change', (_e) => {
            this.checked = this.#checkbox.checked;
            const event = new Event('change', { bubbles: true });
            this.dispatchEvent(event);
        });
        this.shadowRoot.appendChild(this.#checkbox);

        this.#label = document.createElement('label');
        this.#label.setAttribute('for', 'cb');
        this.shadowRoot.appendChild(this.#label);

        this.createTemplate();
        const template = this.getTemplate();
        this.#label.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {        
        this.#onCheckedChange();
        this.#onCheckedIconTextChange();
        this.#onUncheckedIconTextChange();
        this.#onIndeterminateIconTextChange();
        this.#onDisabledChange();
        this.#onValueChange();
    }

    static get observedAttributes() {
        return ['disabled', 'checked', 'checked-icon-text', 'unchecked-icon-text', 'indeterminate-icon-text', 'value'];
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
            if (name === 'checked-icon-text') {
                this.#onCheckedIconTextChange();
            }
            if (name === 'unchecked-icon-text') {
                this.#onUncheckedIconTextChange();
            }
            if (name === 'indeterminate-icon-text') {
                this.#onIndeterminateIconTextChange();
            }
            if (name === 'value') {
                this.#onValueChange();
            }            
        }
    }

    get elementName() {
        return elementName;
    }

    /**
     * Variante visual del elemento interruptor. Los valores posibles son los definidos en el enumerado estático `SITNA.ui.Toggle.variant`. El valor por defecto es `checkbox`.
     * Esta propiedad existe como atributo HTML y como propiedad JavaScript.
     * @memberof SITNA.ui.Toggle
     * @instance
     * @type {string}
     * @name variant
     * @example <caption>[Ver en vivo](../examples/ui.toggle.variant.html)</caption> {@lang html}
    <table>
        <tr>
            <td><sitna-toggle id="variant-setter" variant="switch">Casilla de verificación/Interruptor</sitna-toggle></td>
        </tr>
        <tr class="target-toggle-container">
            <td colspan="4"><sitna-toggle id="target-toggle" checked-icon-text="&#xe910;" unchecked-icon-text="&#xe911;">Soy una casilla de verificación</sitna-toggle></td>
        </tr>
    </table>
    <script>
        const variantSetter = document.getElementById("variant-setter");
        const targetToggle = document.getElementById("target-toggle");

        const onToggleChange = function (e) {
            targetToggle.textContent = variantSetter.checked ?
                "Soy un interruptor " + (targetToggle.checked ? "encendido" : "apagado") :
                "Soy una casilla " + (targetToggle.checked ? "marcada" : "desmarcada");
        };
        onToggleChange();

        variantSetter.addEventListener("change", function (e) {
            targetToggle.variant = this.checked ? SITNA.ui.Toggle.variant.SWITCH : SITNA.ui.Toggle.variant.CHECKBOX;
            onToggleChange();
        });

        targetToggle.addEventListener("change", onToggleChange);
    </script>
     */
    get variant() {
        return this.getAttribute('variant') || Toggle.variant.CHECKBOX;
    }

    set variant(value) {
        this.#setOptionalAttribute('variant', value);
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

    get indeterminate() {
        return this.#checkbox.indeterminate;
    }

    set indeterminate(value) {
        const bool = !!value;
        this.#checkbox.classList.toggle('indeterminate', bool);
        this.#checkbox.indeterminate = bool;
    }

    click() {
        this.#checkbox.click();
    }

    #onCheckedChange() {
        this.#checkbox.checked = this.checked;
        this.indeterminate = false;
    }

    /**
     * Texto del icono del elemento cuando está marcado. La idea de este atributo es que su valor sea algún carácter gráfico de los que ofrece Unicode o 
     * las fuentes tipográficas que son colecciones de iconos. En este segundo caso, se puede especificar qué fuente tipográfica es 
     * asignando su nombre como valor a la variable CSS `--sitna-icon-font-family`, dentro del ámbito del elemento.
     * 
     * Esta propiedad también existe como el atributo HTML `checked-icon-text` o como la variable CSS `--sitna-checked-icon-text`.
     * @memberof SITNA.ui.Toggle
     * @instance
     * @type {string}
     * @default "\2714\fe0e"
     * @name checkedIconText
     * @see [Uso de propiedades personalizadas (variables) en CSS](https://developer.mozilla.org/es/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
     * @see {@tutorial 4-css_variables}
     * @example <caption>[Ver en vivo](../examples/ui.toggle.icon-text.html)</caption> {@lang html}
        <p>A continuación se muestran tres conmutadores con la misma configuración definida de tres maneras distintas.</p>

        <p>Usando <a href="../doc/SITNA.ui.Toggle.html#checkedIconText">las propiedades JavaScript</a>:</p>
        <sitna-toggle id="toggle-1"></sitna-toggle>
        <script>
            const toggle = document.getElementById("toggle-1");
            toggle.checkedIconText = "\ue910";
            toggle.uncheckedIconText = "\ue911";
        </script>

        <p>Usando atributos HTML:</p>
        <sitna-toggle id="toggle-2" checked-icon-text="&#xe910;" unchecked-icon-text="&#xe911;"></sitna-toggle>

        <p>Usando <a href="../doc/tutorial-3-css_variables.html#variables-css-para-conmutadores-sitnauitoggle">variables CSS</a>:</p>
        <sitna-toggle id="toggle-3" style="--sitna-checked-icon-text:'\e910';--sitna-unchecked-icon-text:'\e911';"></sitna-toggle>
     */
    get checkedIconText() {
        return this.getAttribute('checked-icon-text');
    }

    set checkedIconText(value) {
        this.#setOptionalAttribute('checked-icon-text', value);
    }

    #onCheckedIconTextChange() {
        this.#setDataValue('checked-icon-text', this.checkedIconText);
    }


    /**
     * Texto del icono del elemento cuando está desmarcado. La idea de este atributo es que su valor sea algún carácter gráfico de los que ofrece Unicode o 
     * las fuentes tipográficas que son colecciones de iconos. En este segundo caso, se puede especificar qué fuente tipográfica es 
     * asignando su nombre como valor a la variable CSS `--sitna-icon-font-family`, dentro del ámbito del elemento.
     * 
     * Esta propiedad también existe como el atributo HTML `unchecked-icon-text` o como la variable CSS `--sitna-unchecked-icon-text`.
     * @memberof SITNA.ui.Toggle
     * @instance
     * @type {string}
     * @default ""
     * @name uncheckedIconText
     * @see [Uso de propiedades personalizadas (variables) en CSS](https://developer.mozilla.org/es/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
     * @see {@tutorial 4-css_variables}
     * @see {@link SITNA.ui.Toggle#checkedIconText}
     */
    get uncheckedIconText() {
        return this.getAttribute('unchecked-icon-text');
    }

    set uncheckedIconText(value) {
        this.#setOptionalAttribute('unchecked-icon-text', value);
    }    

    #onUncheckedIconTextChange() {
        this.#setDataValue('unchecked-icon-text', this.uncheckedIconText);
    }

    /**
     * Texto del icono del elemento cuando está en estado indeterminado. La idea de este atributo es que su valor sea algún 
     * carácter gráfico de los que ofrece Unicode o las fuentes tipográficas que son colecciones de iconos. En este segundo caso, 
     * se puede especificar qué fuente tipográfica es asignando su nombre como valor a la variable CSS `--sitna-icon-font-family`, 
     * dentro del ámbito del elemento.
     * 
     * Esta propiedad también existe como el atributo HTML `indeterminate-icon-text` o como la variable CSS `--sitna-unchecked-icon-text`.
     * @memberof SITNA.ui.Toggle
     * @instance
     * @type {string}
     * @default ""
     * @name indeterminateIconText
     * @see [Uso de propiedades personalizadas (variables) en CSS](https://developer.mozilla.org/es/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
     * @see {@tutorial 4-css_variables}
     * @see {@link SITNA.ui.Toggle#checkedIconText}
     */
    get indeterminateIconText() {
        return this.getAttribute('indeterminate-icon-text');
    }

    set indeterminateIconText(value) {
        this.#setOptionalAttribute('indeterminate-icon-text', value);
    }

    #onIndeterminateIconTextChange() {
        this.#setDataValue('indeterminate-icon-text', this.indeterminateIconText);
    }

    get value() {
        return this.#checkbox.value;
    }

    set value(value) {
        this.setAttribute('value', value);
    }

    #onValueChange() {
        this.#checkbox.value = this.getAttribute('value');
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
import Component from './Component.js';

const elementName = "sitna-button";

/**
 * Componente web que representa un botón. Puede tener un icono y un texto, y admite varios estilos visuales (variantes).
 * 
 * Como web component, puede instanciarse programáticamente con JavaScript o se puede crear directamente en HTML, mediante 
 * el elemento `<sitna-button>`.
 * 
 * Como este componente tiene un [shadow DOM](https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_shadow_DOM), 
 * los estilos del botón no son accesibles desde el DOM de la página. Para personalizar los estilos,
 * se pueden usar las [variables CSS]{@tutorial 4-css_variables} disponibles.
 * @class Button
 * @memberof SITNA.ui
 * @extends HTMLElement
 * @see [Usando shadow DOM](https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_shadow_DOM)
 * @see [Uso de propiedades personalizadas (variables) en CSS](https://developer.mozilla.org/es/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
 * @see {@tutorial 4-css_variables}
 */
class Button extends Component {

    #button;

    /**
     * @memberof SITNA.ui.Button
     * @enum {string} Enumerado con las variantes visuales disponibles para el botón.
     * @property {string} DEFAULT="default" - Variante visual por defecto (botón rectangular con texto y opcionalmente un icono a la izquierda del texto).
     * @property {string} TEXTLESS="textless" - Variante visual en la que no hay texto de botón.
     * @property {string} LINK="link" - Variante visual en la que el botón toma el aspecto de un enlace de hipertexto.
     * @property {string} MINIMAL="minimal" - Variante visual en la que el botón consiste en un icono enmarcado en un cuadrado ajustado.
     * @static
     * @readonly
     */
    static variant = {
        DEFAULT: 'default',
        TEXTLESS: 'textless',
        LINK: 'link',
        MINIMAL: 'minimal'
    };

    static action = {
        CLOSE: 'close',
        DELETE: 'delete',
        DOWNLOAD: 'download',
        DOWNLOAD_ALL: 'download-all',
        EDIT: 'edit',
        SHARE: 'share'
    };

    constructor() {
        super();
        this.#button = document.createElement('button');
        this.#button.setAttribute('type', 'button');
        this.createTemplate();
        const template = this.getTemplate();
        this.#button.appendChild(template.content.cloneNode(true));
        this.#button.querySelector('slot').addEventListener('slotchange', () => this.#onTextChange());
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
                    this.#button.ariaLabel = newValue;
                    break;
                default:
                    break;
            }
        }
    }

    get elementName() {
        return elementName;
    }
    /**
     * Texto del botón. En las variantes visuales `textless` y `minimal`, el texto se utiliza como información emergente (tooltip) del botón.
     * Alternativamente, se puede usar la propiedad de elemento HTML `textContent` o en el HTML incluir el texto dentro del
     * elemento.
     * @memberof SITNA.ui.Button
     * @instance
     * @type {string}
     * @name text
     */
    get text() {
        return this.getAttribute('text');
    }

    set text(value) {
        this.#setOptionalAttribute('text', value);
    }

    #onTextChange() {
        const text = this.text || this.textContent;
        if (this.textContent !== text) this.textContent = text ?? '';
        const variant = this.variant;
        if (variant === Button.variant.TEXTLESS || variant === Button.variant.MINIMAL ||
            (variant === Button.variant.LINK && !this.hasAttribute('title'))) {
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

    /**
     * Variante visual del botón. Los valores posibles son los definidos en el enumerado estático `SITNA.ui.Button.variant`. El valor por defecto es `default`.
     * Esta propiedad existe como atributo HTML y como propiedad JavaScript.
     * @memberof SITNA.ui.Button
     * @instance
     * @type {string}
     * @name variant
     * @example <caption>[Ver en vivo](../examples/ui.button.variant.html)</caption> {@lang html}
<p class="instructions">Pulsa en los botones de la primera fila para cambiar La variante visual del botón de la segunda fila.</p>
<table>
    <tr>
        <td><sitna-button id="default-variant">Por defecto</sitna-button></td>
        <td><sitna-button id="textless-variant">Sin texto</sitna-button></td>
        <td><sitna-button id="link-variant">Enlace</sitna-button></td>
        <td><sitna-button id="minimal-variant">Mínimo</sitna-button></td>
    </tr>
    <tr class="target-button-container">
        <td colspan="4"><sitna-button id="target-button" icon-text="&#xe932;">Botón</sitna-button></td>
    </tr>
</table>
<script>
    const targetButton = document.getElementById("target-button");
    document.getElementById("default-variant").addEventListener("click", () => {
        targetButton.variant = SITNA.ui.Button.variant.DEFAULT;
    });
    document.getElementById("textless-variant").addEventListener("click", () => {
        targetButton.variant = SITNA.ui.Button.variant.TEXTLESS;
    });
    document.getElementById("link-variant").addEventListener("click", () => {
        targetButton.variant = SITNA.ui.Button.variant.LINK;
    });
    document.getElementById("minimal-variant").addEventListener("click", () => {
        targetButton.variant = SITNA.ui.Button.variant.MINIMAL;
    });
</script>
     */
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
        if (text && (newValue === Button.variant.TEXTLESS || newValue === Button.variant.MINIMAL ||
            (newValue === Button.variant.LINK && !this.hasAttribute('title')))) {
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

    get value() {
        return this.getAttribute('value');
    }

    set value(val) {
        this.setAttribute('value', val);
    }

    #onDisabledChange() {
        this.#button.disabled = this.disabled;
    }


    /**
     * Indica si el botón está activo o no. El significado de esta propiedad depende del contexto en el que se use el botón, pero en general
     * se refiere a que el botón está "presionado" o "seleccionado". Visualmente el botón se muestra con un color de resalte.
     * @memberof SITNA.ui.Button
     * @instance
     * @type {string}
     * @name active
     * @example <caption>[Ver en vivo](../examples/ui.button.active.html)</caption> {@lang html}
<p class="instructions">Botones en distintas variables visuales con la propiedad active establecida o no.</p>
<table>
    <tr>
        <th>Variante</th>
        <th>active == true</th>
        <th>active == false</th>
    </tr>
    <tr>
        <th>Por defecto</th>
        <td><sitna-button active icon-text="&#xe932;">Botón</sitna-button></td>
        <td><sitna-button icon-text="&#xe932;">Botón</sitna-button></td>
    </tr>
    <tr>
        <th>Sin texto</th>
        <td><sitna-button variant="textless" active icon-text="&#xe932;">Botón</sitna-button></td>
        <td><sitna-button variant="textless" icon-text="&#xe932;">Botón</sitna-button></td>
    </tr>
    <tr>
        <th>Enlace</th>
        <td><sitna-button variant="link" active>Botón</sitna-button></td>
        <td><sitna-button variant="link">Botón</sitna-button></td>
    </tr>
    <tr>
        <th>Mínima</th>
        <td><sitna-button variant="minimal" active icon-text="&#xe932;">Botón</sitna-button></td>
        <td><sitna-button variant="minimal" icon-text="&#xe932;">Botón</sitna-button></td>
    </tr>
</table>
     */
    get active() {
        return this.hasAttribute('active');
    }
    set active(value) {
        this.toggleAttribute('active', !!value);
    }

    #onActiveChange() {
        this.#button.classList.toggle('active', this.active);
    }

    /**
     * Texto del icono del botón. La idea de este atributo es que su valor sea algún carácter gráfico de los que ofrece Unicode o 
     * las fuentes tipográficas que son colecciones de iconos. En este segundo caso, se puede especificar qué fuente tipográfica es 
     * asignando su nombre como valor a la variable CSS `--sitna-icon-font-family`, dentro del ámbito del botón.
     * 
     * Esta propiedad también existe como el atributo HTML `icon-text`.
     * @memberof SITNA.ui.Button
     * @instance
     * @type {string}
     * @name iconText
     * @example <caption>[Ver en vivo](../examples/ui.button.icon-text.html)</caption> {@lang html}
    <style>
        sitna-button {
            --sitna-icon-font-family: sitna;
        }
        sitna-button.unicode {
            --sitna-icon-font-family: initial;
        }
        sitna-button.text {
            --sitna-icon-font-family: Times New Roman;
        }
    </style>
    <p class="instructions">Pulsa en los botones de la primera fila para cambiar el icono del botón de la segunda fila.</p>
    <table>
        <tr class="source-buttons-container">
            <td><sitna-button icon-text="&#xe91b;">Impresora</sitna-button></td>
            <td><sitna-button icon-text="&#x1F5B6;" class="unicode">Impresora Unicode</sitna-button></td>
            <td><sitna-button icon-text="&#xe909;">Lápiz</sitna-button></td>
            <td><sitna-button icon-text="&#x270E;" class="unicode">Lápiz Unicode</sitna-button></td>
            <td><sitna-button icon-text="A" class="text">Texto</sitna-button></td>
        </tr>
        <tr>
            <td colspan="4"><sitna-button id="target-button" active>Botón</sitna-button></td>
        </tr>
    </table>
    <script>
        document.querySelectorAll(".source-buttons-container sitna-button").forEach((sourceButton) => {
            sourceButton.addEventListener("click", function () {
                const targetButton = document.getElementById("target-button");
                targetButton.iconText = sourceButton.iconText;
                targetButton.classList.toggle("unicode", sourceButton.classList.contains("unicode"));
                targetButton.classList.toggle("text", sourceButton.classList.contains("text"));
            });
        });
    </script>
     */

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
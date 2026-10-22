export default class Component extends HTMLElement {
    static get observedAttributes(): string[];

    constructor();

    connectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;

    get elementName(): string;
}

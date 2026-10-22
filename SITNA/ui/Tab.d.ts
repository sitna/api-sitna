import Component from './Component';

export default class Tab extends Component {
    static get observedAttributes(): string[];

    constructor();

    get deselectable(): boolean;
    set deselectable(value: boolean);

    get group(): string | null;

    get selected(): boolean;
    set selected(value: boolean);

    get siblings(): Tab[];
    
    get target(): HTMLElement | null;
    
    get text(): string;
    set text(value: string | null);

    onClick(): void;
}

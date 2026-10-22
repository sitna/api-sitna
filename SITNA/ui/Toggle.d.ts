import Component from './Component';

export interface ToggleVariant {
    CHECKBOX: string;
    SWITCH: string;
}

export default class Toggle extends Component {
    static variant: ToggleVariant;
    static get observedAttributes(): string[];

    constructor();

    get checkedIconText(): string | null;
    set checkedIconText(value: string | null);

    get indeterminateIconText(): string | null;
    set indeterminateIconText(value: string | null);

    get uncheckedIconText(): string | null;
    set uncheckedIconText(value: string | null);

    get variant(): string;
    set variant(value: string | null);
}

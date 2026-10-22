import Component from './Component';

export interface ButtonVariant {
    DEFAULT: string;
    TEXTLESS: string;
    LINK: string;
    MINIMAL: string;
    OVERLAY: string;
}

export interface ButtonAction {
    CLOSE: string;
    DELETE: string;
    DOWNLOAD: string;
    DOWNLOAD_ALL: string;
    EDIT: string;
    SHARE: string;
}

export default class Button extends Component {
    static variant: ButtonVariant;
    static action: ButtonAction;
    static get observedAttributes(): string[];

    constructor();

    get text(): string | null;
    set text(value: string | null);

    get icon(): string | null;
    set icon(value: string | null);

    get variant(): string;
    set variant(value: string | null);

    get disabled(): boolean;
    set disabled(value: boolean);

    get value(): string | null;
    set value(val: string | null);

    get active(): boolean;
    set active(value: boolean);

    get iconText(): string | null;
    set iconText(value: string | null);
}

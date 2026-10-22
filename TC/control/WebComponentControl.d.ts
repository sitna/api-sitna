import Map, { ControlOptions } from '../Map';

export interface WebComponentControlOptions extends ControlOptions {
    id?: string;
    template?: string | Record<string, any> | ((data?: any) => string);
    active?: boolean;
    displayMode?: string;
    displayElevation?: boolean | Record<string, any>;
    [key: string]: any;
}

export interface WebComponentControlDisplayMode {
    DOCUMENT: string;
    PANEL: string;
    MODAL: string;
}

export default class WebComponentControl extends HTMLElement {
    static displayMode: WebComponentControlDisplayMode;

    template: string | Record<string, any> | ((data?: any) => string);
    map: Map | null;
    div: HTMLElement | null;

    constructor(container?: HTMLElement | string, options?: WebComponentControlOptions);

    connectedCallback(): void;
    disconnectedCallback(): void;

    show(): Promise<void>;
    hide(): this;
    render(callback?: () => void): Promise<void>;
    loadTemplates(): Promise<void>;
    renderData(data?: any, callback?: () => void): Promise<void>;
    getRenderedHtml(templateId: string, data?: any, callback?: (html: string) => void): Promise<string>;

    register(map: Map): Promise<this>;
    unregister(): this;

    activate(): this;
    deactivate(stopChain?: boolean): this;

    addUIEventListeners(): this;
}

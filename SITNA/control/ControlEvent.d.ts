import Control from './Control';
import Feature from '../feature/Feature';

export interface ControlEventType {
    DRAWSTART: string;
    DRAWEND: string;
    DRAWCANCEL: string;
    DRAWUNDO: string;
    DRAWREDO: string;
    POINTDRAW: string;
}

export interface ControlEventOptions extends EventInit {
    control: Control;
    message?: string;
    feature?: Feature;
    point?: number[];
    transform?: any;
}

export default class ControlEvent extends Event {
    static type: ControlEventType;

    control: Control;
    message?: string;
    feature?: Feature;
    point?: number[];
    transform?: any;

    constructor(type: string, options: ControlEventOptions);
}

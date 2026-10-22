import Vector, { VectorStyleOptions } from '../../SITNA/layer/Vector';
import Feature from '../../SITNA/feature/Feature';
import WebComponentControl, { WebComponentControlOptions } from './WebComponentControl';

export interface DrawOptions extends WebComponentControlOptions {
    layer?: string | Vector;
    mode?: string;
    singleSketch?: boolean;
    snapping?: boolean | Vector | Feature[];
    stylable?: boolean;
    styles?: VectorStyleOptions;
}

export default class Draw extends WebComponentControl {
    extensibleSketch: boolean;
    mode: string;
    singleSketch: boolean;
    stylable: boolean;
    constructor(container?: HTMLElement | string, options?: DrawOptions);

    getLayer(): Vector;
    getSnapping(): boolean | Vector | Feature[];
    setLayer(layer: string | Vector): this;
    setSnapping(snapping: boolean | Vector | Feature[]): this;
}

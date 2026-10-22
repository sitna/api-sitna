import Vector, { VectorStyleOptions } from '../../SITNA/layer/Vector';
import Feature from '../../SITNA/feature/Feature';
import WebComponentControl, { WebComponentControlOptions } from './WebComponentControl';

export interface MeasureOptions extends WebComponentControlOptions {
    layer?: string | Vector;
    mode?: string;
    singleSketch?: boolean;
    snapping?: boolean | Vector | Feature[];
    stylable?: boolean;
    styles?: VectorStyleOptions;
}

export default class Measure extends WebComponentControl {
    mode: string;

    constructor(container?: HTMLElement | string, options?: MeasureOptions);

    getLayer(): Vector;
    getSnapping(): boolean | Vector | Feature[];
    setLayer(layer: string | Vector): this;
    setSnapping(snapping: boolean | Vector | Feature[]): this;
}

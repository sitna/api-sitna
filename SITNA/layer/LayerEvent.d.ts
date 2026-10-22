import Layer from './Layer';

export interface LayerEventType {
    BASELAYERCHANGE: string,
    LAYERADD: string,
    LAYERERROR: string,
    LAYERREMOVE: string,
    LAYERUPDATE: string,
}

export interface LayerEventOptions extends EventInit {
    layer: Layer;
    newData?: any;
}

export default class LayerEvent extends Event {
    static type: LayerEventType;

    layer: Layer; // The layer that triggered the event
    newData?: any; // Optional new data associated with the event

    constructor(type: string, options: LayerEventOptions);
}

export type LayerEventCallback = (event: LayerEvent) => void;
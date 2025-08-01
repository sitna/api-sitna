import Layer from './Layer';
export default interface LayerEvent extends Event {
    layer: Layer; // The layer that triggered the event
    newData?: any; // Optional new data associated with the event
}

export type LayerEventCallback = (event: LayerEvent) => void;
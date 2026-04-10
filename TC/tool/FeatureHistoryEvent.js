export default class FeatureHistoryEvent extends Event {
    feature;
    action;
    undoStack;
    redoStack;
    constructor(type, options) {
        super(type, options);
        Object.assign(this, options);
    }
}
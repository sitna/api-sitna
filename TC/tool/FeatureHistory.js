import FeatureHistoryEvent from './FeatureHistoryEvent.js';

class FeatureHistory extends EventTarget {
    static action = {
        ATTRIBUTESCHANGE: 'attributesChange',
        GEOMETRYCHANGE: 'geometryChange',
        STYLECHANGE: 'styleChange',
        ADD: 'add',
        REMOVE: 'remove',
    }

    #historyStacks = new Map();

    pushHistory(feature, action) {
        let historyStacks = this.#historyStacks.get(feature);
        if (!historyStacks) {
            historyStacks = {
                undo: [],
                redo: [],
            };
            this.#historyStacks.set(feature, historyStacks);
        }
        historyStacks.undo.push(action);
        historyStacks.redo.length = 0;
        this.throwEvent(feature, 'push', action);
        return action;
    }

    throwEvent(feature, type, action) {
        let historyStacks = this.#historyStacks.get(feature);
        if (historyStacks) {
            const event = new FeatureHistoryEvent(type, {
                feature,
                action,
                undoStack: historyStacks.undo,
                redoStack: historyStacks.redo,
            });
            this.dispatchEvent(event);
        }
    }

    canUndo(feature) {
        const historyStacks = this.#historyStacks.get(feature);
        if (historyStacks) {
            return historyStacks.undo.length > 0;
        }
        return false;
    }

    canRedo(feature) {
        const historyStacks = this.#historyStacks.get(feature);
        if (historyStacks) {
            return historyStacks.redo.length > 0;
        }
        return false;
    }

    undo(feature) {
        if (this.canUndo(feature)) {
            const historyStacks = this.#historyStacks.get(feature);
            const action = historyStacks.undo.pop();
            historyStacks.redo.push(action);
            switch (action.type) {
                case FeatureHistory.action.ATTRIBUTESCHANGE:
                    for (const key in action.newData) {
                        if (!Object.hasOwn(action.oldData, key)) feature.unsetData(key);
                    }
                    feature.setData(action.oldData);
                    break;
                case FeatureHistory.action.GEOMETRYCHANGE:
                    feature.setCoordinates(action.oldData);
                    break;
                case FeatureHistory.action.STYLECHANGE:
                    feature.setStyle(null); // Reset style to default before applying new style
                    feature.setStyle(action.oldData);
                    break;
                case FeatureHistory.action.REMOVE:
                    action.oldData.addFeature?.(feature);
                    break;
            }
            this.throwEvent(feature, 'undo', action);
            return historyStacks.undo.length;
        }
        return -1;
    }

    redo(feature) {
        if (this.canRedo(feature)) {
            const historyStacks = this.#historyStacks.get(feature);
            const action = historyStacks.redo.pop();
            historyStacks.undo.push(action);
            switch (action.type) {
                case FeatureHistory.action.ATTRIBUTESCHANGE:
                    for (const key in action.oldData) {
                        if (!Object.hasOwn(action.newData, key)) feature.unsetData(key);
                    }
                    feature.setData(action.newData);
                    break;
                case FeatureHistory.action.GEOMETRYCHANGE:
                    feature.setCoordinates(action.newData);
                    break;
                case FeatureHistory.action.STYLECHANGE:
                    feature.setStyle(null); // Reset style to default before applying new style
                    feature.setStyle(action.newData);
                    break;
                case FeatureHistory.action.REMOVE:
                    action.oldData.removeFeature(feature);
                    break;
            }
            this.throwEvent(feature, 'redo', action);
            return historyStacks.redo.length;
        }
        return -1;
    }

    setCoordinates(feature, coordinates, oldCoordinates) {
        const oldData = structuredClone(oldCoordinates ?? feature.getCoordinates());
        const newData = structuredClone(coordinates);
        feature.setCoordinates(coordinates);
        return this.pushHistory(feature, {
            type: FeatureHistory.action.GEOMETRYCHANGE,
            oldData,
            newData,
        });
    }

    setData(feature, data) {
        const oldData = JSON.parse(JSON.stringify(feature.getData()));
        feature.setData(data);
        const newData = JSON.parse(JSON.stringify(feature.getData()));
        return this.pushHistory(feature, {
            type: FeatureHistory.action.ATTRIBUTESCHANGE,
            oldData,
            newData,
        });
    }

    setStyle(feature, style) {
        const oldData = JSON.parse(JSON.stringify(feature.getStyle()));
        feature.setStyle(style);
        const newData = JSON.parse(JSON.stringify(feature.getStyle()));
        return this.pushHistory(feature, {
            type: FeatureHistory.action.STYLECHANGE,
            oldData,
            newData,
        });
    }

    removeFeature(feature) {
        const oldData = feature.layer;
        feature.layer.removeFeature(feature);
        return this.pushHistory(feature, {
            type: FeatureHistory.action.REMOVE,
            oldData,
            newData: null,
        });
    }

    undoAll(feature) {
        while (this.canUndo(feature)) {
            this.undo(feature);
        }
    }
}

export default FeatureHistory;
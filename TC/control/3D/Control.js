export default class Control extends EventTarget {
    #viewer;
    constructor(viewer) {
        super();
        this.#viewer = viewer;
    }

    get viewer() {
        return this.#viewer;
    }
    set viewer(value) {
        this.#viewer = value;
    }

    reset() {

    }
    activate() {
    }
    deactivate() {

    }
}
import Wrapper from "./Wrapper.js";

export default class ControlWrapper extends Wrapper {
    map;

    async register(map) {
        this.map = await map.wrap.getMap();
        return this.map;
    }
}
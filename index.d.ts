import { Cfg, Consts, feature, layer, Map } from "./sitna";

type SITNANamespace = {
    Cfg: typeof Cfg;
    Map: typeof Map;
    Consts: typeof Consts;
    feature: feature;
    layer: layer;
};

declare global {
    interface Window {
        SITNA: SITNANamespace;
    }
    // For environments where globalThis is used
    var SITNA: SITNANamespace;
}

export { Cfg, Consts, feature, layer, Map as default };

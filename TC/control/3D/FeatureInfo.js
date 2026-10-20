
import ThreeDGFI from './ThreeDGFI.js';
export default class FeatureInfo extends ThreeDGFI {

    constructor(options) {
        super(options);
        this.map = options.map;
        this.twoDControl = options.twoDControl;
        this.map.view3D.linked2DControls[this.twoDControl.id] = this;
        this.twoDControl.highlightedFeature?.toggleSelectedStyle(false);
        //this.map.mouseInteraction.addCondition(this.twoDControl.resultsLayer.id, () => {
        //    return false;
        //})
    }
}
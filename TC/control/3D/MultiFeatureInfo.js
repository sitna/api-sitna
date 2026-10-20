import ThreeDGFI from './ThreeDGFI.js';
import FeatureInfo from './FeatureInfo.js';
export default class MultiFeatureInfo extends ThreeDGFI {
    constructor(options) {
        super(options);
        const map = this.map = options.map;
        this.twoDControl = options.twoDControl;

        this.twoDControl.featureInfoControls.forEach((ctl) => {
            map.view3D.linked2DControls[ctl.id] = map.view3D.linked2DControls[ctl.id] || new FeatureInfo({ map: map, twoDControl: ctl });
            ctl.highlightedFeature?.toggleSelectedStyle(false);            
        });
    }
}
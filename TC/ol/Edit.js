import ControlWrapper from '../wrap/Control.js';
import Consts from '../Consts.js';
import ControlEvent from '../../SITNA/control/ControlEvent.js';

export default class EditWrapper extends ControlWrapper {

    cancel(_deactivate, _cancelTxt) {
        this.points = [];
        this.histPoints = [];
        if (this.selectInteraction) {
            var features = this.selectInteraction.getFeatures();
            const controlEvent = new ControlEvent(Consts.event.FEATURESUNSELECT, { control: this.parent });
            controlEvent.feature = features.get(0)._wrap.parent;
            this.parent.dispatchEvent(controlEvent);
            features.clear();
            this.selectInteraction.setActive(false);
        }
    }

    deleteFeatures(features) {
        if (Array.isArray(features)) {
            var olFeatures = features.map(function (elm) {
                return elm.wrap.feature;
            });
            this.parent.layer.wrap.getLayer().then((olLayer) => {
                var selectedFeatures = this.selectInteraction ? this.selectInteraction.getFeatures() : null;
                for (var i = 0, len = olFeatures.length; i < len; i++) {
                    var olFeature = olFeatures[i];
                    if (selectedFeatures) {
                        selectedFeatures.remove(olFeature);
                        const controlEvent = new ControlEvent(Consts.event.FEATURESUNSELECT, { control: this.parent });
                        controlEvent.feature = olFeature._wrap.parent;
                        this.parent.dispatchEvent(controlEvent);
                    }
                    olLayer.getSource().removeFeature(olFeature);
                    this.parent.trigger(Consts.event.FEATUREREMOVE, { feature: olFeature._wrap.parent });
                }
            });
        }
    }
}

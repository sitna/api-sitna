import TC from '../../TC';
import Consts from '../Consts';


// Mixin
const layerOwner = {

    getLayers: function () {
        const self = this;
        if (!self.layers) {
            self.layers = [];
        }
        return self.layers;
    },

    registerLayerAdd: function () {
        const self = this;
        self.map.on(Consts.event.LAYERADD, function (e) {
            const match = self.getIdCount(e.layer.id);
            if (match) {
                TC.setUIDStart(match + 1, { prefix: self.id + '-' });
                e.layer.owner = self;
            }
        });
    },

    getIdCount: function (id) {
        const self = this;
        const regEx = new RegExp(`^${self.id}(-(\\d+))*$`);
        const match = id.match(regEx);
        if (match) {
            return parseInt(match[1]);
        }
        return 0;
    }

};

export default layerOwner;
import Control from './Control.js';
import Util from '../../Util.js';

export default class OfflineMapMaker extends Control {
    constructor(options) {
        super(options.map.viewer);
        this.twoDControl = options.twoDControl;
        this.twoDControl.setReadyState();
        Util.closeModal();
    }
}
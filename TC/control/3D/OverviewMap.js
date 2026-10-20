import Consts from '../../Consts.js';
import Control from './Control.js';

export default class OverviewMap extends Control {    
    constructor(options) {
        super(options.map.viewer);
        this.map = options.map;
        this.twoDControl = options.twoDControl;        
        this.map.view3D.linked2DControls[this.twoDControl.id] = this;        
        this.twoDControl.div.classList.add(Consts.classes.THREED);
        setTimeout(() => {
            this.map.view3D?.cameraControls?.postRender();
        }, 1000);
    }
    reset() {
        this.twoDControl.div.classList.remove(Consts.classes.THREED);
    }
}
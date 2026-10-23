import WebComponentControl, { WebComponentControlDisplayMode } from '../TC/control/WebComponentControl';
import Draw, { DrawOptions } from '../TC/control/Draw';
import DrawMeasureModify from '../TC/control/DrawMeasureModify.js';
import LayerComparer, { LayerComparerOptions } from '../TC/control/LayerComparer';
import Measure, { MeasureOptions } from '../TC/control/Measure';
import ControlEvent from './control/ControlEvent';

export default interface Control {
    Control: typeof WebComponentControl;
    ControlEvent: typeof ControlEvent;
    Draw: typeof Draw;
    DrawOptions: typeof DrawOptions;
    Measure: typeof Measure;
    MeasureOptions: typeof MeasureOptions;
    DrawMeasureModify: typeof DrawMeasureModify;
    LayerComparer: typeof LayerComparer;
    LayerComparerOptions: typeof LayerComparerOptions;
}
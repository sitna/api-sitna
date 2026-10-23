import Layer, { LayerOptions, LayerTree } from "./layer/Layer";
import Raster, { RasterOptions } from "./layer/Raster";
import Vector, { VectorOptions } from "./layer/Vector";

export default interface layer {
    Layer: typeof Layer;
    LayerOptions: typeof LayerOptions;
    Raster: typeof Raster;
    RasterOptions: typeof RasterOptions;
    Vector: typeof Vector;
    VectorOptions: typeof VectorOptions;
}
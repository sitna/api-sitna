import Circle from "./SITNA/feature/Circle";
import Feature from "./SITNA/feature/Feature";
import Marker from "./SITNA/feature/Marker";
import MultiMarker from "./SITNA/feature/MultiMarker";
import MultiPoint from "./SITNA/feature/MultiPoint";
import MultiPolygon from "./SITNA/feature/MultiPolygon";
import MultiPolyline from "./SITNA/feature/MultiPolyline";
import Point from "./SITNA/feature/Point";
import Polygon from "./SITNA/feature/Polygon";
import Polyline from "./SITNA/feature/Polyline";
import Layer from "./SITNA/layer/Layer";
import Raster from "./SITNA/layer/Raster";
import Vector from "./SITNA/layer/Vector";
import { SitnaMap } from "./SITNA/Map";
import Cfg from "./TC/Cfg";
import Consts from "./TC/Consts";
import LayerComparer from "./TC/control/LayerComparer";
import { LayerComparerOptions } from "./TC/control/LayerComparer";

interface layer {
    Layer: typeof Layer;
    Raster: typeof Raster;
    Vector: typeof Vector;
}

interface feature {
    Feature: typeof Feature;
    Point: typeof Point;
    MultiPoint: typeof MultiPoint;
    Marker: typeof Marker;
    MultiMarker: typeof MultiMarker;
    Polyline: typeof Polyline;
    MultiPolyline: typeof MultiPolyline;
    Polygon: typeof Polygon;
    MultiPolygon: typeof MultiPolygon;
    Circle: typeof Circle;
}

interface control {
    LayerComparer: typeof LayerComparer;
    LayerComparerOptions: typeof LayerComparerOptions;
}

export { Cfg, Consts, feature, layer, control, SitnaMap as Map };

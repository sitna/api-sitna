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
import filter, { Filter } from "./TC/filter";
import { SitnaMap } from "./SITNA/Map";
import Cfg from "./TC/Cfg";
import Consts from "./TC/Consts";
import WebComponentControl from "./TC/control/WebComponentControl";
import control from "./SITNA/control";
import layer from "./SITNA/layer";
import ui from "./SITNA/ui";

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

export { Cfg, Consts, feature, layer, control, ui, filter, Filter, SitnaMap as Map };

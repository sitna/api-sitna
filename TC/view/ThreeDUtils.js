import Point from '../../SITNA/feature/Point.js';
import Polyline from '../../SITNA/feature/Polyline.js';
import Polygon from '../../SITNA/feature/Polygon.js';

export function tcFeatureConstructor (activeShapePoints, type) {
    let geometry;
    switch (type) {
        case 'polyline':
            geometry = new Polyline(activeShapePoints.map(function (point) {
                return cartesianToArray(point);
            }));
            break;
        case 'polygon':
            geometry = new Polygon(activeShapePoints.map(function (point) {
                return cartesianToArray(point);
            }));
            break;
        case 'point':
            geometry = new Point(cartesianToArray(activeShapePoints instanceof Array ? activeShapePoints[0] : activeShapePoints));
            break;
    }
    return geometry;
}

export function  cartesianToArray(cartesian) {
    const geoCoords = cesium.Cartographic.fromCartesian(cartesian);
    //return Util.reproject([cesium.Math.toDegrees(geoCoords.longitude), cesium.Math.toDegrees(geoCoords.latitude)], self.map.view3D.crs, self.map.view3D.view2DCRS);
    return [cesium.Math.toDegrees(geoCoords.longitude), cesium.Math.toDegrees(geoCoords.latitude)];
}

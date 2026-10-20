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
export function toCesiumColor(hexStringColor, alpha) {
    if (hexStringColor instanceof Array) {
        hexStringColor = "rgba(" + hexStringColor[0] + ", " + hexStringColor[1] + ", " + hexStringColor[2] + ", " + (hexStringColor[3] || 1) + ")";
    }
    var color = cesium.Color.fromCssColorString(hexStringColor);
    if (alpha !== undefined) {
        return color.withAlpha(alpha);
    }
    return color;
}
export function tcFeatureFromEntity (entity) {
    if (entity.polygon)
        return new Polygon(entity.polygon.hierarchy.getValue().positions.map(function (point) {
            return cartesianToArray(point);
        }), { id: entity.id })
    else if (entity.polyline)
        return new Polyline(entity.polyline.positions.getValue().map(function (point) {
            return cartesianToArray(point);
        }), { id: entity.id })
    else
        return new Point(cartesianToArray(entity.position.getValue(cesium.JulianDate.now)), { id: entity.id });
}
export async function joinBillboardLabel(style) {
    const image = await cesium.Resource.fetchImage(style.url);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = image.width = style.width;
    canvas.height = image.height = style.height;
    ctx.drawImage(image, 0, 0, image.width, image.height);
    ctx.font = style.font || style.fontSize +  "pt sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (style.labelOutlineWidth) {
        ctx.strokeStyle = style.labelOutlineColor;
        ctx.lineWidth = style.labelOutlineWidth;
        ctx.strokeText(style.label,
            (style.width / 2) + (style.labelOffset[0] || 0),
            style.height + (style.labelOffset[1] || 0));
    }
    if (style.fontColor) {
        ctx.fillStyle = style.fontColor;
    }
    ctx.fillText(style.label,
        (style.width / 2) + (style.labelOffset[0] || 0),
        style.height + (style.labelOffset[1] || 0));
    return canvas
}
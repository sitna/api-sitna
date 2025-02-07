import Util from '../Util';
import { circle, square, triangle, polygon, line } from './WellKnowNameTemplates';
const equilateralTrianglePoints = function  (sideLength, offset = 0) {
    // Calcular la altura del triángulo equilátero
    const height = (Math.sqrt(3) / 2) * sideLength;

    // Definir los puntos del triángulo equilátero
    const point1 = Util.formatTemplate("{x} {y}", { x: offset, y: height + offset });
    const point2 = Util.formatTemplate("{x} {y}", { x: sideLength + offset, y: height + offset });
    const point3 = Util.formatTemplate("{x} {y}", { x: (sideLength / 2) + offset, y: offset });
    return [point1, point2, point3, point1];
}

const fivePointStarPoints=function (outerRadius, offset = 0) {
    const innerRadius = outerRadius * Math.sin(Math.PI / 10) / Math.sin(7 * Math.PI / 10);
    const points = [];

    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI / 5) + Math.PI / 2; // Rotar 90 grados para que una punta esté hacia arriba
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        points.push(Util.formatTemplate("{x} {y}", {
            x: outerRadius + radius * Math.cos(angle) + offset,
            y: outerRadius - radius * Math.sin(angle) + offset
        }));
    }
    
    return points;
}
export function crossPoints(armLength, armWidth = armLength * (1 / 3),offset=0) {
    const halfWidth = armWidth / 2;
    const points = [
        Util.formatTemplate("{x} {y}", { x: -halfWidth + offset, y: -halfWidth +  offset }),
        Util.formatTemplate("{x} {y}", { x: -halfWidth + offset, y: -armLength + offset }),
        Util.formatTemplate("{x} {y}", { x: halfWidth + offset, y: -armLength + offset }),
        Util.formatTemplate("{x} {y}", { x: halfWidth + offset, y: -halfWidth + offset }),
        Util.formatTemplate("{x} {y}", { x: armLength + offset, y: -halfWidth + offset }),
        Util.formatTemplate("{x} {y}", { x: armLength + offset, y: halfWidth + offset }),
        Util.formatTemplate("{x} {y}", { x: halfWidth + offset, y: halfWidth + offset }),
        Util.formatTemplate("{x} {y}", { x: halfWidth + offset, y: armLength + offset }),
        Util.formatTemplate("{x} {y}", { x: -halfWidth + offset, y: armLength + offset }),
        Util.formatTemplate("{x} {y}", { x: -halfWidth + offset, y: halfWidth + offset }),
        Util.formatTemplate("{x} {y}", { x: -armLength + offset, y: halfWidth + offset }),
        Util.formatTemplate("{x} {y}", { x: -armLength + offset, y: -halfWidth + offset })
    ];

    return points;
}
export function xShapePoints(armLength) {
    const points = [
        { x: -armLength, y: -armLength },
        { x: -armLength / 2, y: -armLength / 2 },
        { x: 0, y: 0 },
        { x: armLength / 2, y: armLength / 2 },
        { x: armLength, y: armLength },
        { x: armLength / 2, y: -armLength / 2 },
        { x: 0, y: 0 },
        { x: -armLength / 2, y: armLength / 2 },
        { x: -armLength, y: -armLength }
    ];

    return points;
}

export default class WKNFactory {
    constructor(height, width) {
        this.height = height;
        this.width = width;
    }
    square(size,exceptionalSize, style, transform) {
        return Util.formatTemplate(square, { x: (Math.max(this.width, size) - size) / 2, y: (Math.max(this.height, size) - size) / 2, width: size, height: size, style: style, transform: transform });
    }
    triangle(size, exceptionalSize, style, transform) {
        return Util.formatTemplate(triangle, { points: equilateralTrianglePoints(Math.min(this.width, size), (Math.max(this.width, exceptionalSize) - size) / 2).join(","), style: style, transform: transform });
    }
    star(size, exceptionalSize, style, transform) {
        return Util.formatTemplate(triangle, { points: fivePointStarPoints(size / 2, (Math.max(this.width, exceptionalSize) - size) / 2).join(","), style: style, transform: transform });
    }
    cross(size, exceptionalSize, style, transform) {
        return Util.formatTemplate(triangle, { points: crossPoints(size / 2, undefined, Math.max(this.width, exceptionalSize) / 2).join(","), style: style, transform: transform });
    }
    circle(size, exceptionalSize, style, transform) {
        return Util.formatTemplate(circle, { x: (Math.max(this.width, size)) / 2, y: (Math.max(this.height, size)) / 2, radius: size / 2, style: style, transform: transform });
    }
    
}

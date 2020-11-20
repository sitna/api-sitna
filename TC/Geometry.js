; var TC = TC || {};
(function (root, factory) {
    if (typeof exports === "object") { // CommonJS
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) { // AMD
        define([], factory);
    } else {
        root.Geometry = factory();
    }
})(TC, function () {

    // intersect a segment against one of the 4 lines that make up the bbox
    const intersectBox = function (a, b, edge, bbox) {
        return edge & 8 ? [a[0] + (b[0] - a[0]) * (bbox[3] - a[1]) / (b[1] - a[1]), bbox[3]] : // top
            edge & 4 ? [a[0] + (b[0] - a[0]) * (bbox[1] - a[1]) / (b[1] - a[1]), bbox[1]] : // bottom
                edge & 2 ? [bbox[2], a[1] + (b[1] - a[1]) * (bbox[2] - a[0]) / (b[0] - a[0])] : // right
                    edge & 1 ? [bbox[0], a[1] + (b[1] - a[1]) * (bbox[0] - a[0]) / (b[0] - a[0])] : // left
                        null;
    };

    // bit code reflects the point position relative to the bbox:

    //         left  mid  right
    //    top  1001  1000  1010
    //    mid  0001  0000  0010
    // bottom  0101  0100  0110
    const bitCode = function (p, bbox) {
        let code = 0;

        if (p[0] < bbox[0]) code |= 1; // left
        else if (p[0] > bbox[2]) code |= 2; // right

        if (p[1] < bbox[1]) code |= 4; // bottom
        else if (p[1] > bbox[3]) code |= 8; // top

        return code;
    };

    const Geometry = {
        isPoint: function (geometry) {
            return Array.isArray(geometry) && geometry.length >= 2 && typeof geometry[0] === 'number' && typeof geometry[1] === 'number';
        },
        isRing: function (geometry) {
            return Array.isArray(geometry) && (geometry.length === 0 || Geometry.isPoint(geometry[0]));
        },
        isRingCollection: function (geometry) {
            return Array.isArray(geometry) && (geometry.length === 0 || Geometry.isRing(geometry[0]));
        },
        isMultiRingCollection: function (geometry) {
            return Array.isArray(geometry) && (geometry.length === 0 || Geometry.isRingCollection(geometry[0]));
        },
        getNearest: function getNearest(point, candidates) {
            return TC.wrap.Geometry.getNearest(point, candidates);
        },
        isInside: function isInside(point, ring) {
            var result = false;
            if (Geometry.isPoint(point)) {
                if (Geometry.isPoint(ring)) {
                    result = point[0] === ring[0] && point[1] === ring[1];
                }
                else if (Geometry.isRing(ring)) {
                    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                        var xi = ring[i][0], yi = ring[i][1];
                        var xj = ring[j][0], yj = ring[j][1];

                        var intersect = ((yi > point[1]) != (yj > point[1]))
                            && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
                        if (intersect) result = !result;
                    }
                }
                else if (Geometry.isRingCollection(ring) && ring.length > 0) {
                    // polígono con agujeros
                    // miramos si está en el polígono exterior
                    if (isInside(point, ring[0])) {
                        var insideHole = false;
                        // miramos si está en un agujero
                        for (var i = 1; i < ring.length; i++) {
                            if (isInside(point, ring[i])) {
                                insideHole = true;
                                break;
                            }
                        }
                        if (!insideHole) {
                            result = true;
                        }
                    }
                }
                else if (Geometry.isMultiRingCollection(ring) && ring.length > 0) {
                    // multipolígono
                    // miramos si está en alguno de los polígonos
                    for (var i = 0, len = ring.length; i < len; i++) {
                        if (isInside(point, ring[i])) {
                            result = true;
                            break;
                        }
                    }
                }
            }
            return result;
        },
        getSquaredDistance: function (p1, p2) {
            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            return dx * dx + dy * dy;
        },
        getDistance: function (p1, p2) {
            return Math.sqrt(Geometry.getSquaredDistance(p1, p2));
        },
        getFlatCoordinates: function (geom) {
            const reductionFn = function (prev, cur) {
                return prev.concat(cur);
            };
            switch (true) {
                case Geometry.isPoint(geom):
                    return [geom];
                case Geometry.isRing(geom):
                    return geom;
                case Geometry.isRingCollection(geom):
                    return geom.reduce(reductionFn);
                case Geometry.isMultiRingCollection(geom):
                    return geom.reduce(reductionFn).reduce(reductionFn);
                default:
                    return [];
            }
        },
        intersects: function (geom1, geom2) {
            const flatIntersects = function (coords, geom) {
                for (var i = 0, ii = coords.length; i < ii; i++) {
                    if (Geometry.isInside(coords[i], geom)) {
                        return true;
                    }
                }
                return false;
            }
            if (flatIntersects(Geometry.getFlatCoordinates(geom1), geom2) || flatIntersects(Geometry.getFlatCoordinates(geom2), geom1)) {
                return true;
            }
            return false;
        },
        clipPolygon: function (coords, bbox) {
            return coords
                .map(ring => Geometry.clipRing(ring, bbox))
                .filter(ring => ring.length);
        },
        clipRing: function (coords, bbox) {
            // Algoritmo Sutherland-Hodgeman de recorte de anillos
            let result, edge, prev, prevInside, inside;

            // clip against each side of the clip rectangle
            for (edge = 1; edge <= 8; edge *= 2) {
                result = [];
                prev = coords[coords.length - 1];
                prevInside = !(bitCode(prev, bbox) & edge);

                coords.forEach(point => {
                    inside = !(bitCode(point, bbox) & edge);

                    // if segment goes through the clip window, add an intersection
                    if (inside !== prevInside) result.push(intersectBox(prev, point, edge, bbox));

                    if (inside) result.push(point); // add a point if it's inside

                    prev = point;
                    prevInside = inside;
                });

                coords = result;

                if (!coords.length) break;
            }

            return result;
        },
        clipPolyline: function (coords, bbox) {
            // Algoritmo Cohen-Sutherland de clipping de líneas
            let len = coords.length,
                codeA = bitCode(coords[0], bbox),
                part = [],
                i, a, b, codeB, lastCode;

            let result = [];

            for (i = 1; i < len; i++) {
                a = coords[i - 1];
                b = coords[i];
                codeB = lastCode = bitCode(b, bbox);

                while (true) {

                    if (!(codeA | codeB)) { // accept
                        part.push(a);

                        if (codeB !== lastCode) { // segment went outside
                            part.push(b);

                            if (i < len - 1) { // start a new line
                                result = result.concat(part);
                                part = [];
                            }
                        } else if (i === len - 1) {
                            part.push(b);
                        }
                        break;

                    } else if (codeA & codeB) { // trivial reject
                        break;

                    } else if (codeA) { // a outside, intersect with clip edge
                        a = intersectBox(a, b, codeA, bbox);
                        codeA = bitCode(a, bbox);

                    } else { // b outside
                        b = intersectBox(a, b, codeB, bbox);
                        codeB = bitCode(b, bbox);
                    }
                }

                codeA = lastCode;
            }

            if (part.length) {
                result = result.concat(part);
            }

            return result;
        }
    };
    return Geometry;
});
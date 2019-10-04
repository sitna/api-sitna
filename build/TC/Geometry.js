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
            }
        };
        return Geometry;
    });
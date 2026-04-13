import TC from '../TC.js';

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

const getDoubleAreaUnderEdge = (ring, idx) => {
    const nIdx = (idx + 1) % ring.length;
    const cur = ring[idx];
    const next = ring[nIdx];
    return (next[1] + cur[1]) * (next[0] - cur[0]);
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
    getArea: function (geometry) {
        if (Geometry.isRingCollection(geometry) || Geometry.isMultiRingCollection(geometry)) {
            return geometry.reduce((accArea, elm) => accArea + Geometry.getArea(elm), 0);
        }
        if (Geometry.isRing(geometry)) {
            let doubleArea = 0;
            for (let i = 0; i < geometry.length; i++) {
                doubleArea += getDoubleAreaUnderEdge(geometry, i);
            }
            return doubleArea / 2;
        }
        return 0;
    },
    getCentroid: function (geom) {
        const coords = this.getFlatCoordinates(geom);
        if (coords.length === 1) return coords[0];

        // Primera aproximación: media de las coordenadas
        const centroid = coords
            .reduce(([accx, accy], [curx, cury]) => [accx + curx, accy + cury])
            .map((coord) => coord / coords.length);
        let sx = 0;
        let sy = 0;
        let area = 0;
        const centeredCoords = coords.map(([x, y]) => [x - centroid[0], y - centroid[1]]);
        for (let i = 0; i < centeredCoords.length - 1; i++) {
            const [x1, y1] = centeredCoords[i];
            const [x2, y2] = centeredCoords[i + 1];
            const cross = x1 * y2 - x2 * y1;
            area += cross;
            sx += (x1 + x2) * cross;
            sy += (y1 + y2) * cross;
        }
        if (area !== 0) {
            area *= 0.5;
            centroid[0] += sx / (6 * area);
            centroid[1] += sy / (6 * area);
        }
        return centroid;
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

                    var intersect = yi > point[1] !== yj > point[1] &&
                        point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi;
                    if (intersect) result = !result;
                }
            }
            else if (Geometry.isRingCollection(ring) && ring.length > 0) {
                // polígono con agujeros
                // miramos si está en el polígono exterior
                if (isInside(point, ring[0])) {
                    var insideHole = false;
                    // miramos si está en un agujero
                    for (i = 1; i < ring.length; i++) {
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
                for (i = 0; i < ring.length; i++) {
                    if (isInside(point, ring[i])) {
                        result = true;
                        break;
                    }
                }
            }
        }
        return result;
    },
    equals: function (g1, g2) {
        if (Array.isArray(g1) && Array.isArray(g2)) {
            return g1.length === g2.length && g1.every((elm, idx) => Geometry.equals(elm, g2[idx]));
        }
        if (Array.isArray(g1) || Array.isArray(g2)) {
            return false;
        }
        return g1 === g2;
    },
    getSquaredDistance: function (p1, p2) {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        return dx * dx + dy * dy;
    },
    getDistance: function (p1, p2) {
        return Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    },
    getFlatCoordinates: function (geom) {
        switch (true) {
            case Geometry.isPoint(geom):
                return [geom];
            case Geometry.isRing(geom):
                return geom;
            case Geometry.isRingCollection(geom):
                return geom.flat();
            case Geometry.isMultiRingCollection(geom):
                return geom.flat(2);
            default:
                return [];
        }
    },
    // Función generator que itera por los puntos de una geometría
    iterateCoordinates: function* iterateCoords(geometry) {
        if (Array.isArray(geometry)) {
            if (Geometry.isPoint(geometry)) {
                yield geometry;
            }
            else {
                for (var i = 0, ii = geometry.length; i < ii; i++) {
                    yield* iterateCoords(geometry[i]);
                }
            }
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
        };
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
    },
    interpolate: function (coords, options) {
        let coordinateList = coords;
        const isSinglePoint = coordinateList.length === 1;

        if (!isSinglePoint) {
            if (options.resolution) {
                const newCoordinateList = [];
                coordinateList.forEach(function (point, idx, arr) {
                    if (idx) {
                        const prev = arr[idx - 1];
                        const distance = Geometry.getDistance(prev, point);
                        if (distance > options.resolution) {
                            // posición en el segmento del primer punto interpolado
                            let pos = distance % options.resolution / 2;
                            // x··$·····|·····|··x
                            let n = Math.ceil(distance / options.resolution);
                            if (pos === 0) {
                                n = n - 1;
                                pos = options.resolution;
                            }
                            const x = point[0] - prev[0];
                            const y = point[1] - prev[1];
                            const sin = y / distance;
                            const cos = x / distance;
                            let xpos = prev[0] + pos * cos;
                            let ypos = prev[1] + pos * sin;
                            let dx = options.resolution * cos;
                            let dy = options.resolution * sin;
                            for (var i = 0; i < n; i++) {
                                newCoordinateList.push([xpos, ypos]);
                                xpos += dx;
                                ypos += dy;
                            }
                        }
                    }
                    newCoordinateList.push(point);
                });
                coordinateList = newCoordinateList;
            }
            else if (options.sampleNumber) {
                const numPoints = coordinateList.length;
                if (numPoints > options.sampleNumber) {
                    // Sobran puntos. Nos quedamos con los puntos más cercanos a los puntos kilométricos
                    // de los intervalos definidos por sampleNumber.
                    const milestones = [];
                    let accumulatedDistance = 0;
                    coordinateList.forEach(function (point, idx, arr) {
                        if (idx) {
                            accumulatedDistance += Geometry.getDistance(arr[idx - 1], point);
                        }
                        milestones.push({
                            index: idx,
                            distance: accumulatedDistance
                        });
                    });
                    const intervalLength = accumulatedDistance / options.sampleNumber;
                    let nextMilestoneDistance = 0;
                    milestones.forEach(function (milestone, idx, arr) {
                        const dd = milestone.distance - nextMilestoneDistance;
                        if (dd === 0) {
                            milestone.included = true;
                        }
                        else if (dd > 0) {
                            if (milestone.index) {
                                const prevMilestone = arr[idx - 1];
                                if (nextMilestoneDistance - prevMilestone.distance < dd) {
                                    prevMilestone.included = true;
                                }
                                else {
                                    milestone.included = true;
                                }
                            }
                            while (milestone.distance > nextMilestoneDistance) {
                                nextMilestoneDistance += intervalLength;
                            }
                        }
                    });
                    milestones.filter(m => !m.included).forEach(function (m) {
                        coordinateList[m.index] = null;
                    });
                    coordinateList = coordinateList.filter(p => p !== null);
                }
                else if (numPoints < options.sampleNumber) {
                    // Faltan puntos. Insertamos puntos en las segmentos más largos.
                    const insertBefore = function (arr, idx, count) {
                        const p1 = arr[idx - 1];
                        const p2 = arr[idx];
                        const n = count + 1;
                        let x = p1[0];
                        let y = p1[1];
                        const dx = (p2[0] - x) / n;
                        const dy = (p2[1] - y) / n;
                        const spliceParams = new Array(count + 2);
                        spliceParams[0] = idx;
                        spliceParams[1] = 0;
                        for (var i = 2, ii = spliceParams.length; i < ii; i++) {
                            x += dx;
                            y += dy;
                            spliceParams[i] = [x, y];
                        }
                        arr.splice.apply(arr, spliceParams);
                    };
                    let totalDistance = 0;
                    const distances = coordinateList.map(function (point, idx, arr) {
                        let distance = 0;
                        if (idx) {
                            distance = Geometry.getDistance(arr[idx - 1], point);
                            totalDistance += distance;
                        }
                        return {
                            index: idx,
                            distance: distance
                        };
                    });
                    // Hacemos copia de la lista porque vamos a insertar puntos
                    coordinateList = coordinateList.slice();
                    const defaultCount = options.sampleNumber - numPoints;
                    let leftCount = defaultCount;
                    let insertionCount = 0;
                    for (var i = 0, ii = distances.length; leftCount && i < ii; i++) {
                        const obj = distances[i];
                        if (obj.distance !== 0) {
                            const partialInsertionCount = Math.min(Math.round(defaultCount * obj.distance / totalDistance), leftCount) || 1;
                            leftCount -= partialInsertionCount;
                            insertBefore(coordinateList, obj.index + insertionCount, partialInsertionCount);
                            insertionCount += partialInsertionCount;
                        }
                    }
                }
            }
        }
        return coordinateList;
    },
    getPointAlongLine: function (coords, distance) {
        if (coords.length === 0) {
            return null;
        }
        if (coords.length === 1) {
            return coords[0];
        }
        let accumulatedDistance = 0;
        for (let i = 1; i < coords.length; i++) {
            const segStart = coords[i - 1];
            const segEnd = coords[i];
            const segLength = Geometry.getDistance(segStart, segEnd);
            if (accumulatedDistance + segLength >= distance) {
                const remainingDistance = distance - accumulatedDistance;
                const ratio = remainingDistance / segLength;
                const x = segStart[0] + ratio * (segEnd[0] - segStart[0]);
                const y = segStart[1] + ratio * (segEnd[1] - segStart[1]);
                return [x, y];
            }
            accumulatedDistance += segLength;
        }
        // Si la distancia es mayor que la longitud total, devolvemos el último punto
        return coords[coords.length - 1];
    },
    getPoleOfInaccessibility: function (ring, precision = 1.0) {
        // Polylabel algorithm: finds the pole of inaccessibility for a polygon
        // (the most distant internal point from the polygon outline)
        // Based on https://github.com/mapbox/polylabel

        if (!Geometry.isRing(ring) || ring.length < 3) {
            return null;
        }

        // Calculate polygon bounding box
        let [minX, minY] = ring[0];
        let [maxX, maxY] = ring[0];
        for (let i = 1; i < ring.length; i++) {
            const [px, py] = ring[i];
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px > maxX) maxX = px;
            if (py > maxY) maxY = py;
        }

        const width = maxX - minX;
        const height = maxY - minY;
        const cellSize = Math.min(width, height);
        let h = cellSize / 2;

        if (cellSize === 0) {
            return [minX, minY];
        }

        // Priority queue of cells in order of their "potential" (max distance to polygon edge)
        const cellQueue = [];

        // Cover polygon with initial cells
        for (let x = minX; x < maxX; x += cellSize) {
            for (let y = minY; y < maxY; y += cellSize) {
                cellQueue.push(new Cell(x + h, y + h, h, ring));
            }
        }

        // Take centroid as initial best guess
        let bestCell = getCentroidCell(ring);

        // Special case for rectangular-ish polygons
        const bboxCell = new Cell(minX + width / 2, minY + height / 2, 0, ring);
        if (bboxCell.distance > bestCell.distance) {
            bestCell = bboxCell;
        }

        while (cellQueue.length) {
            // Pick the most promising cell
            const cell = cellQueue.pop();

            // Update the best cell if we found a better one
            if (cell.distance > bestCell.distance) {
                bestCell = cell;
            }

            // Do not drill down further if there's no chance of a better solution
            if (cell.max - bestCell.distance <= precision) continue;

            // Split the cell into four cells
            h = cell.h / 2;
            if (h === 0) continue;

            cellQueue.push(new Cell(cell.x - h, cell.y - h, h, ring));
            cellQueue.push(new Cell(cell.x + h, cell.y - h, h, ring));
            cellQueue.push(new Cell(cell.x - h, cell.y + h, h, ring));
            cellQueue.push(new Cell(cell.x + h, cell.y + h, h, ring));

            // Sort queue by potential distance (max) in descending order
            cellQueue.sort((a, b) => b.max - a.max);
        }

        return [bestCell.x, bestCell.y];
    }
};

// Helper class for pole of inaccessibility algorithm
class Cell {
    constructor(x, y, h, ring) {
        this.x = x;
        this.y = y;
        this.h = h;
        this.distance = pointToPolygonDistance(x, y, ring);
        this.max = this.distance + this.h * Math.SQRT2;
    }
}

// Get polygon centroid
const getCentroidCell = function (ring) {
    let area = 0;
    let x = 0;
    let y = 0;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[i];
        const b = ring[j];
        const f = a[0] * b[1] - b[0] * a[1];
        x += (a[0] + b[0]) * f;
        y += (a[1] + b[1]) * f;
        area += f * 3;
    }

    if (area === 0) {
        return new Cell(ring[0][0], ring[0][1], 0, ring);
    }

    return new Cell(x / area, y / area, 0, ring);
};

// Signed distance from point to polygon outline (negative if point is outside)
const pointToPolygonDistance = function (x, y, ring) {
    let inside = false;
    let minDistSq = Infinity;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[i];
        const b = ring[j];

        if ((a[1] > y !== b[1] > y) &&
            (x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0])) {
            inside = !inside;
        }

        minDistSq = Math.min(minDistSq, getSegDistSq(x, y, a, b));
    }

    return (inside ? 1 : -1) * Math.sqrt(minDistSq);
};

// Get squared distance from a point to a segment
const getSegDistSq = function (px, py, a, b) {
    let x = a[0];
    let y = a[1];
    let dx = b[0] - x;
    let dy = b[1] - y;

    if (dx !== 0 || dy !== 0) {
        const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = b[0];
            y = b[1];
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = px - x;
    dy = py - y;

    return dx * dx + dy * dy;
};

export default Geometry;
describe('TC.Geometry', () => {
    describe('isPoint', () => {
        it('should return true for valid points', () => {
            expect(TC.Geometry.isPoint([1, 2])).to.equal(true);
            expect(TC.Geometry.isPoint([0, 0])).to.equal(true);
        });

        it('should return false for invalid points', () => {
            expect(TC.Geometry.isPoint([])).to.equal(false);
            expect(TC.Geometry.isPoint([1])).to.equal(false);
            expect(TC.Geometry.isPoint(['a', 'b'])).to.equal(false);
        });
    });

    describe('isRing', () => {
        it('should return true for valid rings', () => {
            expect(TC.Geometry.isRing([[1, 2], [3, 4], [5, 6]])).to.equal(true);
            expect(TC.Geometry.isRing([])).to.equal(true);
        });

        it('should return false for invalid rings', () => {
            expect(TC.Geometry.isRing([1, 2])).to.equal(false);
            expect(TC.Geometry.isRing([['a', 'b'], [3, 4]])).to.equal(false);
        });
    });

    describe('getArea', () => {
        it('should calculate the area of a ring', () => {
            const ring = [[0, 0], [4, 0], [4, 3], [0, 3]];
            expect(TC.Geometry.getArea(ring)).to.equal(-12); // Area of rectangle
        });

        it('should calculate the area of a ring collection', () => {
            const ringCollection = [
                [[0, 0], [4, 0], [4, 3], [0, 3]], // Rectangle
                [[0, 0], [2, 0], [2, 2], [0, 2]]  // Smaller rectangle
            ];
            expect(TC.Geometry.getArea(ringCollection)).to.equal(-16);
        });

        it('should return 0 for invalid geometries', () => {
            expect(TC.Geometry.getArea([])).to.equal(0);
            expect(TC.Geometry.getArea([1, 2])).to.equal(0);
        });
    });

    describe('isInside', () => {
        it('should return true if a point is inside a ring', () => {
            const ring = [[0, 0], [4, 0], [4, 4], [0, 4]];
            expect(TC.Geometry.isInside([2, 2], ring)).to.equal(true);
        });

        it('should return false if a point is outside a ring', () => {
            const ring = [[0, 0], [4, 0], [4, 4], [0, 4]];
            expect(TC.Geometry.isInside([5, 5], ring)).to.equal(false);
        });

        it('should handle polygons with holes', () => {
            const polygonWithHole = [
                [[0, 0], [6, 0], [6, 6], [0, 6]], // Outer ring
                [[2, 2], [4, 2], [4, 4], [2, 4]]  // Inner hole
            ];
            expect(TC.Geometry.isInside([3, 3], polygonWithHole)).to.equal(false); // Inside the hole
            expect(TC.Geometry.isInside([1, 1], polygonWithHole)).to.equal(true);  // Inside the outer ring
        });
    });

    describe('equals', () => {
        it('should return true for equal geometries', () => {
            expect(TC.Geometry.equals([1, 2], [1, 2])).to.equal(true);
            expect(TC.Geometry.equals([[1, 2], [3, 4]], [[1, 2], [3, 4]])).to.equal(true);
        });

        it('should return false for different geometries', () => {
            expect(TC.Geometry.equals([1, 2], [2, 1])).to.equal(false);
            expect(TC.Geometry.equals([[1, 2], [3, 4]], [[1, 2], [4, 3]])).to.equal(false);
        });
    });

    describe('getDistance', () => {
        it('should calculate the distance between two points', () => {
            expect(TC.Geometry.getDistance([0, 0], [3, 4])).to.equal(5); // 3-4-5 triangle
        });
    });

    describe('intersects', () => {
        it('should return true if two geometries intersect', () => {
            const geom1 = [[0, 0], [4, 0], [4, 4], [0, 4]];
            const geom2 = [[2, 2], [6, 2], [6, 6], [2, 6]];
            expect(TC.Geometry.intersects(geom1, geom2)).to.equal(true);
        });

        it('should return false if two geometries do not intersect', () => {
            const geom1 = [[0, 0], [4, 0], [4, 4], [0, 4]];
            const geom2 = [[5, 5], [6, 5], [6, 6], [5, 6]];
            expect(TC.Geometry.intersects(geom1, geom2)).to.equal(false);
        });
    });

    describe('clipPolygon', () => {
        it('should clip a polygon to a bounding box', () => {
            const polygon = [[-1, -1], [3, -1], [3, 3], [-1, 3]];
            const bbox = [0, 0, 2, 2];
            const clipped = TC.Geometry.clipPolygon([polygon], bbox);
            expect(clipped.length).to.be.greaterThan(0);
        });
    });

    describe('interpolate', () => {
        it('should interpolate points along a line', () => {
            const line = [[0, 0], [4, 0]];
            const interpolated = TC.Geometry.interpolate(line, { resolution: 1 });
            expect(interpolated.length).to.equal(5); // Points at 0, 1, 2, 3, 4
        });
    });
});


describe('Tests de SITNA.layer.Vector', function () {

    const createVector = function () {
        return new SITNA.layer.Vector({ id: 'test' });
    };

    const pointLike = [0, 0];
    const lineLike = [[0, 0], [1, 1], [2, 2]];
    const polygonLike = [lineLike];
    const multiPolygonLike = [polygonLike];
    
    describe('addPoint', function () {

        it("Debe devolver un punto", async function () {

            const layer = createVector();
            const point = await layer.addPoint(pointLike);

            expect(point).to.be.instanceof(SITNA.feature.Point);
        });
    });

    describe('addPoints', function () {

        it("Debe devolver un array de puntos", async function () {

            const layer = createVector();
            const points = await layer.addPoints([pointLike]);

            expect(points).to.be.an('array');
            expect(points[0]).to.be.instanceof(SITNA.feature.Point);
        });
    });

    describe('addMarker', function () {

        it("Debe devolver un marcador", async function () {

            const layer = createVector();
            const marker = await layer.addMarker(pointLike);

            expect(marker).to.be.instanceof(SITNA.feature.Marker);
        });
    });

    describe('addMarkers', function () {

        it("Debe devolver un array de marcadores", async function () {

            const layer = createVector();
            const markers = await layer.addMarkers([pointLike]);

            expect(markers).to.be.an('array');
            expect(markers[0]).to.be.instanceof(SITNA.feature.Marker);
        });
    });

    describe('addPolyline', function () {

        it("Debe devolver una línea", async function () {

            const layer = createVector();
            const polyline = await layer.addPolyline(lineLike);

            expect(polyline).to.be.instanceof(SITNA.feature.Polyline);
        });
    });

    describe('addPolylines', function () {

        it("Debe devolver un array de líneas", async function () {

            const layer = createVector();
            const polylines = await layer.addPolylines([lineLike]);

            expect(polylines).to.be.an('array');
            expect(polylines[0]).to.be.instanceof(SITNA.feature.Polyline);
        });
    });

    describe('addPolygon', function () {

        it("Debe devolver un polígono", async function () {

            const layer = createVector();
            const polygon = await layer.addPolygon(polygonLike);

            expect(polygon).to.be.instanceof(SITNA.feature.Polygon);
        });
    });

    describe('addPolygons', function () {

        it("Debe devolver un array de polígonos", async function () {

            const layer = createVector();
            const polygons = await layer.addPolygons([polygonLike]);

            expect(polygons).to.be.an('array');
            expect(polygons[0]).to.be.instanceof(SITNA.feature.Polygon);
        });
    });

    describe('addMultiPoint', function () {

        it("Debe devolver un multipunto", async function () {

            const layer = createVector();
            const multipoint = await layer.addMultiPoint(lineLike);

            expect(multipoint).to.be.instanceof(SITNA.feature.MultiPoint);
        });
    });

    describe('addMultiPoints', function () {

        it("Debe devolver un array de multipuntos", async function () {

            const layer = createVector();
            const multipoints = await layer.addMultiPoints([lineLike]);

            expect(multipoints).to.be.an('array');
            expect(multipoints[0]).to.be.instanceof(SITNA.feature.MultiPoint);
        });
    });


    describe('addMultiMarker', function () {

        it("Debe devolver un multimarcador", async function () {

            const layer = createVector();
            const multimarker = await layer.addMultiMarker(lineLike);

            expect(multimarker).to.be.instanceof(SITNA.feature.MultiMarker);
        });
    });

    describe('addMultiMarkers', function () {

        it("Debe devolver un array de multimarcadores", async function () {

            const layer = createVector();
            const multimarkers = await layer.addMultiMarkers([lineLike]);

            expect(multimarkers).to.be.an('array');
            expect(multimarkers[0]).to.be.instanceof(SITNA.feature.MultiMarker);
        });
    });

    describe('addMultiPolyline', function () {

        it("Debe devolver una multilínea", async function () {

            const layer = createVector();
            const multipolyline = await layer.addMultiPolyline(polygonLike);

            expect(multipolyline).to.be.instanceof(SITNA.feature.MultiPolyline);
        });
    });

    describe('addMultiPolylines', function () {

        it("Debe devolver un array de multilíneas", async function () {

            const layer = createVector();
            const multipolylines = await layer.addMultiPolylines([polygonLike]);

            expect(multipolylines).to.be.an('array');
            expect(multipolylines[0]).to.be.instanceof(SITNA.feature.MultiPolyline);
        });
    });

    describe('addMultiPolygon', function () {

        it("Debe devolver un multipolígono", async function () {

            const layer = createVector();
            const multipolygon = await layer.addMultiPolygon(multiPolygonLike);

            expect(multipolygon).to.be.instanceof(SITNA.feature.MultiPolygon);
        });
    });

    describe('addMultiPolygons', function () {

        it("Debe devolver un array de multipolígonos", async function () {

            const layer = createVector();
            const multipolygons = await layer.addMultiPolygons([multiPolygonLike]);

            expect(multipolygons).to.be.an('array');
            expect(multipolygons[0]).to.be.instanceof(SITNA.feature.MultiPolygon);
        });
    });

    describe('addCircle', function () {

        it("Debe devolver un círculo", async function () {

            const layer = createVector();
            const circle = await layer.addCircle(lineLike);

            expect(circle).to.be.instanceof(SITNA.feature.Circle);
        });
    });

    describe('addCircles', function () {

        it("Debe devolver un array de círculos", async function () {

            const layer = createVector();
            const circles = await layer.addCircles([lineLike]);

            expect(circles).to.be.an('array');
            expect(circles[0]).to.be.instanceof(SITNA.feature.Circle);
        });
    });

});
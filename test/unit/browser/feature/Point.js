describe('Tests de SITNA.feature.Point', function () {

    describe('getCoordinates', function () {

        it("Debe devolver una coordenada", async function () {

            const point = new SITNA.feature.Point([0, 0]);
            const coords = point.getCoordinates();

            expect(coords).to.be.an('array');
            expect(coords[0]).to.equal(0);
            expect(coords[1]).to.equal(0);
        });

        it("Debe devolver un array de una coordenada", async function () {

            const point = new SITNA.feature.Point([0, 0]);
            const coords = point.getCoordinates({ pointArray: true });

            expect(coords).to.be.an('array');
            expect(coords.length).to.equal(1);
            expect(coords[0]).to.be.an('array');
            expect(coords[0][0]).to.equal(0);
            expect(coords[0][1]).to.equal(0);
        });
    });

    describe('getCoordsArray', function () {

        it("Debe devolver un array de una coordenada", async function () {

            const point = new SITNA.feature.Point([0, 0]);
            const coords = point.getCoordsArray();

            expect(coords).to.be.an('array');
            expect(coords.length).to.equal(1);
            expect(coords[0]).to.be.an('array');
            expect(coords[0][0]).to.equal(0);
            expect(coords[0][1]).to.equal(0);
        });
    });
});
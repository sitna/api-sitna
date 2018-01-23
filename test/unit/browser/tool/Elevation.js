var expect = chai.expect;

// only critical error messages
$.mockjaxSettings.logging = 0;

describe('Tests de TC.tool.Elevation', function () {

    // Mocks
    TC.loadJS = (condition, url, callback) => {
        callback();
    };

    TC.format = {
        WPS: {
            buildExecuteQuery: () => ""
        }
    };

    TC.Geometry = {
        isPoint: () => true
    };

    const elevation = new TC.tool.Elevation();
    const testOptions = { coordinates: [600000, 4700000] };
    const mockNormalResponse = {
        type: "MultiPoint",
        coordinates: [[611921.3421, 4740079.4945, 444.541]]
    };
    const mockOffLimitsResponse = {
        type: "MultiPoint",
        coordinates: [[611921.3421, 4740079.4945, elevation.minimumElevation - 1]]
    };
    const resetMockjax = () => {
        $.mockjax({
            url: elevation.url,
            responseText: mockNormalResponse
        });
    };
    const clearMockjax = () => {
        $.mockjax.clear(elevation.url);
    };

    describe('request', function () {
        it('deberia devolver un objeto con coordenadas', function (done) {
            resetMockjax();
            elevation.request(testOptions)
                .then(function (response) {
                    expect(response).to.have.property("coordinates");
                    expect(response.coordinates[0]).to.be.an.array;
                    clearMockjax();
                })
                .then(done);
        });
    });

    describe('parseResponse', function () {
        it('deberia devolver un array', function () {
            expect(elevation.parseResponse(mockNormalResponse)).to.be.an.array;
        });
        it('deberia devolver null si la respuesta devuelve un valor preestablecido', function () {
            expect(elevation.parseResponse(mockOffLimitsResponse)).to.be.null;
        });
    });

    describe('getElevation', function () {
        it('deberia devolver un array con un array', function (done) {
            resetMockjax();
            elevation.getElevation(testOptions)
                .then(function (coordinates) {
                    expect(coordinates).to.be.an.array;
                    expect(coordinates[0]).to.be.an.array;
                    clearMockjax();
                })
                .then(done);
        });
    });
});

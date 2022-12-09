describe('Tests de TC.tool.Elevation', function () {
    var expect = chai.expect;

    // only critical error messages
    try {
        $.mockjaxSettings.logging = 0;
    }
    catch (e) { };


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
    const testOptions = { coordinates: [[600000, 4700000]] };
    const x = 611921.3421;
    const y = 4740079.4945;
    const elev1 = 444.541;
    const elev2 = 123.456;
    const mockNormalResponse = {
        type: "MultiPoint",
        coordinates: [[x, y, elev1]]
    };
    const mockOffLimitsResponse = {
        type: "MultiPoint",
        coordinates: [[x, y, elevation.minimumElevation - 1]]
    };
    const valuedPartialResult = [
        [x, y, elev1]
    ];
    const valuedPartialResult2 = [
        [x, y, elev2]
    ];
    const nullPartialResult = [
        [x, y, null]
    ];
    const pendingResponseValuedResponse = [false, valuedPartialResult2];
    const pendingResponseValuelessResponse = [false, nullPartialResult];
    const valuedResponsePendingResponse = [valuedPartialResult, false];
    const valuelessResponsePendingResponse = [nullPartialResult, false];
    const nullResponseValuedResponse = [null, valuedPartialResult2];
    const nullResponseValuelessResponse = [null, nullPartialResult];
    const valuedResponseNullResponse = [valuedPartialResult, null];
    const valuelessResponseNullResponse = [nullPartialResult, null];
    const emptyResponseValuedResponse = [[], valuedPartialResult2];
    const emptyResponseValuelessResponse = [[], nullPartialResult];
    const valuedResponseEmptyResponse = [valuedPartialResult, []];
    const valuelessResponseEmptyResponse = [nullPartialResult, []];
    const emptyResponseEmptyResponse = [[], []];
    const valuedResponseValuedResponse = [valuedPartialResult, valuedPartialResult2];
    const valuedResponseValuelessResponse = [valuedPartialResult, nullPartialResult];
    const valuelessResponseValuedResponse = [nullPartialResult, valuedPartialResult2];
    const valuelessResponseValuelessResponse = [nullPartialResult, nullPartialResult];
    //const nullResponse = [nullPartialResult];
    const resetMockjax = () => {
        $.mockjax({
            url: elevation.url,
            responseText: mockNormalResponse
        });
    };
    const clearMockjax = () => {
        $.mockjax.clear(elevation.url);
    };

    describe('_updatePartialResult', function () {
        it('deberia devolver false cuando una respuesta prioritaria está pendiente y otra respuesta tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], pendingResponseValuedResponse)).to.be.false;
        });
        it('deberia establecer valor cuando una respuesta prioritaria está pendiente y otra respuesta tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, pendingResponseValuedResponse);
            expect(partialResult[0][2]).to.equal(elev2);
        });
        it('deberia devolver false cuando una respuesta prioritaria está pendiente y otra respuesta no tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], pendingResponseValuelessResponse)).to.be.false;
        });
        it('deberia no establecer valor cuando una respuesta prioritaria está pendiente y otra respuesta no tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, pendingResponseValuelessResponse);
            expect(partialResult[0][2]).to.be.null;
        });
        it('deberia devolver true cuando una respuesta prioritaria tiene valor y otra respuesta está pendiente', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuedResponsePendingResponse)).to.be.true;
        });
        it('deberia establecer valor cuando una respuesta prioritaria tiene valor y otra respuesta está pendiente', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuedResponsePendingResponse);
            expect(partialResult[0][2]).to.equal(elev1);
        });
        it('deberia devolver false cuando una respuesta prioritaria no tiene valor y otra respuesta está pendiente', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuelessResponsePendingResponse)).to.be.false;
        });
        it('deberia no establecer valor cuando una respuesta prioritaria no tiene valor y otra respuesta está pendiente', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuelessResponsePendingResponse);
            expect(partialResult[0][2]).to.be.null;
        });

        it('deberia devolver true cuando una respuesta prioritaria es nula y otra respuesta tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], nullResponseValuedResponse)).to.be.true;
        });
        it('deberia establecer valor cuando una respuesta prioritaria es nula y otra respuesta tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, nullResponseValuedResponse);
            expect(partialResult[0][2]).to.equal(elev2);
        });
        it('deberia devolver true cuando una respuesta prioritaria es nula y otra respuesta no tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], nullResponseValuelessResponse)).to.be.true;
        });
        it('deberia no establecer valor cuando una respuesta prioritaria es nula y otra respuesta no tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, nullResponseValuelessResponse);
            expect(partialResult[0][2]).to.be.null;
        });
        it('deberia devolver true cuando una respuesta prioritaria tiene valor y otra respuesta es nula', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuedResponseNullResponse)).to.be.true;
        });
        it('deberia establecer valor cuando una respuesta prioritaria tiene valor y otra respuesta es nula', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuedResponseNullResponse);
            expect(partialResult[0][2]).to.equal(elev1);
        });
        it('deberia devolver true cuando una respuesta prioritaria no tiene valor y otra respuesta es nula', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuelessResponseNullResponse)).to.be.true;
        });
        it('deberia no establecer valor cuando una respuesta prioritaria no tiene valor y otra respuesta es nula', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuelessResponseNullResponse);
            expect(partialResult[0][2]).to.be.null;
        });

        it('deberia devolver true cuando una respuesta prioritaria está vacía y otra respuesta tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], emptyResponseValuedResponse)).to.be.true;
        });
        it('deberia establecer valor cuando una respuesta prioritaria está vacía y otra respuesta tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, emptyResponseValuedResponse);
            expect(partialResult[0][2]).to.equal(elev2);
        });
        it('deberia devolver true cuando una respuesta prioritaria está vacía y otra respuesta no tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], emptyResponseValuelessResponse)).to.be.true;
        });
        it('deberia no establecer valor cuando una respuesta prioritaria está vacía y otra respuesta no tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, emptyResponseValuelessResponse);
            expect(partialResult[0][2]).to.be.null;
        });
        it('deberia devolver true cuando una respuesta prioritaria tiene valor y otra respuesta está vacía', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuedResponseEmptyResponse)).to.be.true;
        });
        it('deberia establecer valor cuando una respuesta prioritaria tiene valor y otra respuesta está vacía', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuedResponseEmptyResponse);
            expect(partialResult[0][2]).to.equal(elev1);
        });
        it('deberia devolver true cuando una respuesta prioritaria no tiene valor y otra respuesta está vacía', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuelessResponseEmptyResponse)).to.be.true;
        });
        it('deberia no establecer valor cuando una respuesta prioritaria no tiene valor y otra respuesta está vacía', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuelessResponseEmptyResponse);
            expect(partialResult[0][2]).to.be.null;
        });
        it('deberia devolver true todas las respuestas están vacías', function () {
            expect(elevation._updatePartialResult([[x, y, null]], emptyResponseEmptyResponse)).to.be.true;
        });
        it('deberia no establecer valor cuando todas las respuestas están vacías', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, emptyResponseEmptyResponse);
            expect(partialResult[0][2]).to.be.null;
        });

        it('deberia devolver true cuando una respuesta prioritaria tiene valor y otra respuesta tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuedResponseValuedResponse)).to.be.true;
        });
        it('deberia establecer el primer valor cuando una respuesta prioritaria tiene valor y otra respuesta tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuedResponseValuedResponse);
            expect(partialResult[0][2]).to.equal(elev1);
        });
        it('deberia devolver true cuando una respuesta prioritaria tiene valor y otra respuesta no tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuedResponseValuelessResponse)).to.be.true;
        });
        it('deberia establecer el primer valor cuando una respuesta prioritaria tiene valor y otra respuesta no tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuedResponseValuelessResponse);
            expect(partialResult[0][2]).to.equal(elev1);
        });
        it('deberia devolver true cuando una respuesta prioritaria no tiene valor y otra respuesta tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuelessResponseValuedResponse)).to.be.true;
        });
        it('deberia establecer el segundo valor cuando una respuesta prioritaria no tiene valor y otra respuesta tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuelessResponseValuedResponse);
            expect(partialResult[0][2]).to.equal(elev2);
        });
        it('deberia devolver true cuando ninguna respuesta tiene valor', function () {
            expect(elevation._updatePartialResult([[x, y, null]], valuelessResponseValuelessResponse)).to.be.true;
        });
        it('deberia no establecer valor cuando ninguna respuesta tiene valor', function () {
            const partialResult = [[x, y, null]];
            elevation._updatePartialResult(partialResult, valuelessResponseValuelessResponse);
            expect(partialResult[0][2]).to.be.null;
        });

        //it('deberia devolver false cuando no tenemos valor', function () {
        //    expect(elevation._updatePartialResult([[x, y, null]], nullResponse)).to.be.false;
        //});
    });

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

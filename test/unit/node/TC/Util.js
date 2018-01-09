var expect = require('chai').expect;
var util = require('../../../../TC/Util');

describe('Tests de TC.Util', function () {
    describe('getMapLocale', function () {
        it('sin locale deberia devolver es-ES', function () {
            expect(util.getMapLocale({})).to.equal('es-ES');
        });
    });
});
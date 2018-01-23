var expect = require('chai').expect;
var util = require('../../../../TC/Util');

describe('Tests de TC.Util', function () {
    describe('getMapLocale', function () {
        it('sin locale deberia devolver es-ES', function () {
            expect(util.getMapLocale({})).to.equal('es-ES');
        });
    });

    const epsg25830 = 'EPSG:25830';
    const epsg4326 = 'EPSG:4326';
    const urn25830 = 'urn:ogc:def:crs:EPSG::25830';
    const urn25830v2 = 'urn:ogc:def:crs:EPSG:2:25830';
    const gml25830 = 'http://www.opengis.net/gml/srs/epsg.xml#25830';

    describe('CRSCodesEqual', function () {
        it('con dos CRS iguales deberia devolver true', function () {
            expect(util.CRSCodesEqual(epsg25830, epsg25830)).to.be.true;
        });
        it('con dos CRS distintos deberia devolver false', function () {
            expect(util.CRSCodesEqual(epsg25830, epsg4326)).to.be.false;
        });
        it('con dos CRS equivalentes deberia devolver true', function () {
            expect(util.CRSCodesEqual(epsg25830, urn25830)).to.be.true;
            expect(util.CRSCodesEqual(urn25830, epsg25830)).to.be.true;
            expect(util.CRSCodesEqual(urn25830v2, epsg25830)).to.be.true;
        });
    });

    describe('getCRSCode', function () {
        it('algo que no sea un CRS válido devuelve null', function () {
            expect(util.getCRSCode("voyafallar:2020")).to.be.null;
        });
        it('un código en formato EPSG devuelve su valor', function () {
            expect(util.getCRSCode(epsg25830)).to.equal('25830');
        });
        it('un código en formato URN sin versión devuelve su valor', function () {
            expect(util.getCRSCode(urn25830)).to.equal('25830');
        });
        it('un código en formato URN con versión devuelve su valor', function () {
            expect(util.getCRSCode(urn25830v2)).to.equal('25830');
        });
        it('un código en formato GML devuelve su valor', function () {
            expect(util.getCRSCode(gml25830)).to.equal('25830');
        });
    });
});
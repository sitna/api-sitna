console.log('Test del manejo de las peticiones WFS para la descarga y la consulta alfanumérica');
var expect = chai.expect;
describe('Tests de TC.WFSGetFeatureBuilder y TC.Filter', function () {
    describe('TC.Filter', function () {
        it('Debe ser un filtro de tipo And con 3 condiciones', function (done) {
            var testFilter = new TC.filter.And([new TC.filter.EqualTo("campo1", "valor", true), new TC.filter.GreaterThan("campo2", "2015-01-01"), new TC.filter.bbox([0, 0, 100, 100])]);
            expect(testFilter.conditions).to.be.an.array;
            expect(testFilter.tagName_).to.equal("And");            
            done();
        });
    });    
    
    describe('GetWFSCApabilities y TC.Util.WFSQueryBuilder', function () {
        var url = "https://idena.navarra.es/ogc/wms";
        TC.capabilities[url] ='<WMS_Capabilities version="1.3.0" updateSequence="1630" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wms https://idena.navarra.es/schemas/wms/1.3.0/capabilities_1_3_0.xsd"></WMS_Capabilities>'
        layer = new TC.layer.Raster({ url: url });
        
        it('Debe resolver la promesa de método getWFSCapabilitiesPromise', function (done) {
            layer.getWFSCapabilitiesPromise().then(function () {
                done();
            });
        });
        it('Debe una cadena de texto con un xml de una operacion GetFeature', function (done) {
            layer.getWFSCapabilitiesPromise().then(function (capabilities) {
                var query = TC.Util.WFSQueryBuilder(["CATAST_Pol_ParcelaUrba"], null, capabilities, "json", true);
                expect(query).to.be.an('string');
                done();
            });
        });

        it('Debe resolver la promesa de método getWFSCapabilitiesPromis y comprobar que existe la capa CATAST_Pol_ParcelaUrba', function (done) {
            layer.getWFSCapabilitiesPromise().then(function (capabilities) {
                expect(capabilities.FeatureTypes).to.have.property('CATAST_Pol_ParcelaUrba');
                done();
            });
        });        
    });    
});
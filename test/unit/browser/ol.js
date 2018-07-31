/*global _comma_separated_list_of_variables_*/
describe('Tests de ol.js', function () {
    describe('ol.proj.get', function () {
        it('"EPSG:4326" debe devolver una proyeccion WGS84', function () {
            chai.expect(ol.proj.get('EPSG:4326')).to.be.instanceof(ol.proj.EPSG4326.Projection_);
        });
        it('"http://www.opengis.net/gml/srs/epsg.xml#4326" debe devolver una proyeccion WGS84', function () {
            chai.expect(ol.proj.get('http://www.opengis.net/gml/srs/epsg.xml#4326')).to.be.instanceof(ol.proj.EPSG4326.Projection_);
        });
        it('"urn:ogc:def:crs:EPSG::4326" debe devolver una proyeccion WGS84', function () {
            chai.expect(ol.proj.get('urn:ogc:def:crs:EPSG::4326')).to.be.instanceof(ol.proj.EPSG4326.Projection_);
        });
        it('"http://www.opengis.net/gml/srs/epsg.xml#4326" debe devolver una proyeccion WGS84', function () {
            chai.expect(ol.proj.get('http://www.opengis.net/gml/srs/epsg.xml#4326')).to.be.instanceof(ol.proj.EPSG4326.Projection_);
        });
        it('un objeto ol.proj.Projection debe devolver un objeto ol.proj.Projection', function () {
            chai.expect(ol.proj.get(new ol.proj.Projection({ code: '25831' }))).to.be.instanceof(ol.proj.Projection);
        });
    });

    describe('ol.format.GMLBase.prototype.readGeometryElement', function () {
        var shouldReturnUndefined = function (format) {
            var parent = ol.xml.DOCUMENT.createElement('nodo');
            var child = ol.xml.DOCUMENT.createElement('nodo');
            parent.appendChild(child);
            return format.readGeometryElement(parent, [{}]);
        };
        it('en GML un nodo sin geometria debe devolver undefined', function () {
            chai.expect(shouldReturnUndefined(new ol.format.GML())).to.be.undefined;
        });
        it('en GML2 un nodo sin geometria debe devolver undefined', function () {
            chai.expect(shouldReturnUndefined(new ol.format.GML2())).to.be.undefined;
        });
    });

    describe('ol.format.GMLBase.prototype.readFeatureElement', function () {
        var gml = new ol.format.GML();
        var gml2 = new ol.format.GML2();
        var text = 'texto demo';
        var shouldReturnEmptyFeature = function (format) {
            var node = ol.xml.DOCUMENT.createElement('nodo');
            return format.readFeatureElement(node, [{}]);
        };
        var shouldReturnProperty = function (format) {
            var nodeName = 'nodo';
            var parent = ol.xml.DOCUMENT.createElement('nodo');
            var child = ol.xml.DOCUMENT.createElement(nodeName);
            var textNode = ol.xml.DOCUMENT.createTextNode(text);
            child.appendChild(textNode);
            parent.appendChild(child);
            return format.readFeatureElement(parent, [{}]).getProperties()[nodeName];
        };
        var shouldTryReadGeometry = function (format) {
            var parent = ol.xml.DOCUMENT.createElement('parent');
            var child = ol.xml.DOCUMENT.createElement('child');
            var grandChild = ol.xml.DOCUMENT.createElement('grandchild');
            child.appendChild(grandChild);
            parent.appendChild(child);
            return format.readFeatureElement(parent, [{}]);
        };
        it('en GML un nodo debe devolver un objeto ol.Feature', function () {
            chai.expect(shouldReturnEmptyFeature(gml)).to.be.instanceof(ol.Feature);
        });
        it('en GML2 un nodo debe devolver un objeto ol.Feature', function () {
            chai.expect(shouldReturnEmptyFeature(gml2)).to.be.instanceof(ol.Feature);
        });
        it('en GML debe leer una propiedad de un nodo', function () {
            chai.expect(shouldReturnProperty(gml)).to.equal(text);
        });
        it('en GML2 debe leer una propiedad de un nodo', function () {
            chai.expect(shouldReturnProperty(gml2)).to.equal(text);
        });
        it('en GML debe intentar leer una geometria de un nodo con nietos', function () {
            chai.expect(shouldTryReadGeometry(gml)).to.be.instanceof(ol.Feature);
        });
        it('en GML2 debe intentar leer una geometria de un nodo con nietos', function () {
            chai.expect(shouldTryReadGeometry(gml2)).to.be.instanceof(ol.Feature);
        });
    });

    describe('ol.format.KML.createStyleDefaults_', function () {
        it('debe devolver un estilo', function () {
            var result = ol.format.KML.createStyleDefaults_();
            chai.expect(result).to.be.ok;
            chai.expect(result[0]).to.be.instanceof(ol.style.Style);
        });
    });

    describe('ol.format.KML.readDocumentOrFolder_', function () {
        it('un nodo "nodo" debe devolver un array vacio', function () {
            var format = new ol.format.KML();
            var node = ol.xml.DOCUMENT.createElement('nodo');
            chai.expect(format.readDocumentOrFolder_(node, [{}])).to.have.lengthOf(0);
        });
    });

    describe('ol.format.KML.readStyle_', function () {
        it('un nodo vacio debe devolver un estilo', function () {
            var node = ol.xml.DOCUMENT.createElement('nodo');
            var result = ol.format.KML.readStyle_(node, [{}]);
            chai.expect(result).to.be.ok;
            chai.expect(result[0]).to.be.instanceof(ol.style.Style);
        });
    });

    //describe('ol.format.KML.readURI_', function () {
    //    it('un nodo con una URL debe devolver esa URL', function () {
    //        var text = 'http://example.com';
    //        var node = ol.xml.DOCUMENT.createElement('nodo');
    //        var textNode = ol.xml.DOCUMENT.createTextNode(text);
    //        node.appendChild(textNode);
    //        var result = ol.format.KML.readStyle_(node, [{}]);
    //        chai.expect(ol.format.KML.readURI_(node)).to.equal(text);
    //    });
    //});

    describe('ol.format.KML.whenParser_', function () {
        it('un nodo "when" debe ejecutarse', function () {
            var node = ol.xml.DOCUMENT.createElement('when');
            chai.expect(ol.format.KML.whenParser_(node, [{ whens: []}])).to.be.undefined;
        });
    });

    describe('ol.format.KML.prototype.readFeatures', function () {
        it('un documento kml vacio debe devolver un array vacio', function () {
            var format = new ol.format.KML();
            chai.expect(format.readFeatures('<kml></kml>')).to.be.empty;
        });
    });

    describe('ol.format.XSD.readDateTime', function () {
        it('un nodo vacio debe devolver undefined', function () {
            var node = ol.xml.DOCUMENT.createElement('nodo');
            chai.expect(ol.format.XSD.readDateTime(node)).to.be.undefined;
        });
        it('un nodo con una fecha debe devolver un numero', function () {
            var node = ol.xml.DOCUMENT.createElement('nodo');
            var textNode = ol.xml.DOCUMENT.createTextNode('01/01/00');
            node.appendChild(textNode);
            chai.expect(ol.format.XSD.readDateTime(node)).to.be.a.number;
        });
    });

    describe('ol.format.GML3Patched', function () {
        it('debe ser un constructor de la clase ol.format.GML3', function () {
            chai.expect(new ol.format.GML3Patched()).to.be.instanceof(ol.format.GML3);
        });
    });

    describe('ol.format.GML3CRS84', function () {
        it('debe ser un constructor de la clase ol.format.GML3', function () {
            chai.expect(new ol.format.GML3CRS84()).to.be.instanceof(ol.format.GML3);
        });
    });

    describe('ol.format.GML2CRS84', function () {
        it('debe ser un constructor de la clase ol.format.GML2', function () {
            chai.expect(new ol.format.GML2CRS84()).to.be.instanceof(ol.format.GML2);
        });
    });

    describe('ol.format.GMLBase.prototype.readFeaturesInternal', function () {
        var gml = new ol.format.GML();
        var gml2 = new ol.format.GML2();
        var text = 'prueba nodo';
        var shouldReturnEmptyArray = function (format) {
            var node = ol.xml.DOCUMENT.createElement('nodo');
            return format.readFeaturesInternal(node, [{}]);
        };
        var shouldReturnElementArray = function (format, nodeName) {
            var node = ol.xml.DOCUMENT.createElement(nodeName);
            var child = ol.xml.DOCUMENT.createElement('nodo');
            var textNode = ol.xml.DOCUMENT.createTextNode(text);
            child.appendChild(textNode);
            node.appendChild(child);
            return format.readFeaturesInternal(node, [{}]);
        };
        it('en GML un nodo cualquiera debe devolver un array vacio', function () {
            chai.expect(shouldReturnEmptyArray(gml)).to.be.empty;
        });
        it('en GML2 un nodo cualquiera debe devolver un array vacio', function () {
            chai.expect(shouldReturnEmptyArray(gml2)).to.be.empty;
        });
        it('en GML un nodo "member" debe devolver ol.Feature', function () {
            chai.expect(shouldReturnElementArray(gml, "member")).to.be.instanceof(ol.Feature);
        });
        it('en GML2 un nodo "member" debe devolver ol.Feature', function () {
            chai.expect(shouldReturnElementArray(gml2, "member")).to.be.instanceof(ol.Feature);
        });
        it('en GML un nodo "featureMember" debe devolver ol.Feature', function () {
            chai.expect(shouldReturnElementArray(gml, "featureMember")).to.be.instanceof(ol.Feature);
        });
        it('en GML2 un nodo "featureMember" debe devolver ol.Feature', function () {
            chai.expect(shouldReturnElementArray(gml2, "featureMember")).to.be.instanceof(ol.Feature);
        });
        it('en GML un nodo "featureMembers" debe devolver un array de ol.Feature', function () {
            chai.expect(shouldReturnElementArray(gml, "featureMembers")[0]).to.be.instanceof(ol.Feature);
        });
        it('en GML2 un nodo "featureMembers" debe devolver un array de ol.Feature', function () {
            chai.expect(shouldReturnElementArray(gml2, "featureMembers")[0]).to.be.instanceof(ol.Feature);
        });
        it('en GML un nodo "FeatureCollection" debe devolver un array', function () {
            chai.expect(shouldReturnElementArray(gml, "FeatureCollection")).to.have.lengthOf(0);
        });
        it('en GML2 un nodo "FeatureCollection" debe devolver un array', function () {
            chai.expect(shouldReturnElementArray(gml2, "FeatureCollection")).to.have.lengthOf(0);
        });
    });

    describe('ol.control.OverviewMap.prototype.validateExtent_', function () {
        it('se debe poder ejecutar', function () {
            chai.expect(ol.control.OverviewMap).to.respondTo('_validateExtent_');
        });
    });

    describe('ol.control.OverviewMap.prototype.resetExtent_', function () {
        it('se debe poder ejecutar', function () {
            chai.expect(ol.control.OverviewMap).to.respondTo('_resetExtent_');
        });
    });

    describe('TC.wrap.Map.prototype.exportFeatures', function () {
        var self = {
            parent: {
                crs: 'EPSG:25830',
                options: {
                    styles: {
                        point: {
                            fillColor: '#f00',
                            fillOpacity: 0.5,
                            strokeColor: '#f00',
                            strokeWidth: 2,
                            radius: 6
                        }
                    }
                }
            }
        };
        var feature = {
            wrap: {
                feature: new ol.Feature({ geometry: new ol.geom.Point([0, 0]), '3D length': 23 })
            }
        };
        var options = {
            fileName: 'prueba',
            format: 'GML'
        };
        it('debe poder generar GML', function () {
            chai.expect(TC.wrap.Map.prototype.exportFeatures.call(self, [feature], options)).to.be.a('string');
        });
    });

    describe('ol.Map.prototype.updateSize', function () {
        it('se debe poder ejecutar', function () {
            chai.expect(ol.Map).to.respondTo('updateSize');
        });
    });

    describe('Enumeraciones, propiedades y funciones internas de OL que usamos siguen disponibles', function () {
        it("Propiedad extent sigue disponible", function (done) {
            
            expect(new ol.control.ZoomToExtent().hasOwnProperty('extent')).to.be.true;

            done();
        });
    });
});
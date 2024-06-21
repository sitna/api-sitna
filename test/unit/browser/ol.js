/*global _comma_separated_list_of_variables_*/
describe('Tests de ol.js', function () {
    describe('ol.proj.get', function () {
        it('un objeto ol.proj.Projection debe devolver un objeto ol.proj.Projection', function () {
            chai.expect(ol.proj.get(new ol.proj.Projection({ code: '25831' }))).to.be.instanceof(ol.proj.Projection);
        });
    });

    describe('ol.format.GMLBase.prototype.readGeometryElement', function () {
        var shouldReturnUndefined = function (format) {
            var parent = document.createElement('nodo');
            var child = document.createElement('nodo');
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
            var node = document.createElement('nodo');
            return format.readFeatureElement(node, [{}]);
        };
        var shouldReturnProperty = function (format) {
            var nodeName = 'nodo';
            var parent = document.createElement('nodo');
            var child = document.createElement(nodeName);
            var textNode = document.createTextNode(text);
            child.appendChild(textNode);
            parent.appendChild(child);
            return format.readFeatureElement(parent, [{}]).getProperties()[nodeName];
        };
        var shouldTryReadGeometry = function (format) {
            var parent = document.createElement('parent');
            var child = document.createElement('child');
            var grandChild = document.createElement('grandchild');
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
            var node = document.createElement('nodo');
            return format.readFeaturesInternal(node, [{}]);
        };
        var shouldReturnElementArray = function (format, nodeName) {
            var node = document.createElement(nodeName);
            var child = document.createElement('nodo');
            var textNode = document.createTextNode(text);
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
        //it('en GML un nodo "member" debe devolver ol.Feature', function () {
        //    chai.expect(shouldReturnElementArray(gml, "member")).to.be.instanceof(ol.Feature);
        //});
        //it('en GML2 un nodo "member" debe devolver ol.Feature', function () {
        //    chai.expect(shouldReturnElementArray(gml2, "member")).to.be.instanceof(ol.Feature);
        //});
        //it('en GML un nodo "featureMember" debe devolver ol.Feature', function () {
        //    chai.expect(shouldReturnElementArray(gml, "featureMember")).to.be.instanceof(ol.Feature);
        //});
        //it('en GML2 un nodo "featureMember" debe devolver ol.Feature', function () {
        //    chai.expect(shouldReturnElementArray(gml2, "featureMember")).to.be.instanceof(ol.Feature);
        //});
        //it('en GML un nodo "featureMembers" debe devolver un array de ol.Feature', function () {
        //    chai.expect(shouldReturnElementArray(gml, "featureMembers")[0]).to.be.instanceof(ol.Feature);
        //});
        //it('en GML2 un nodo "featureMembers" debe devolver un array de ol.Feature', function () {
        //    chai.expect(shouldReturnElementArray(gml2, "featureMembers")[0]).to.be.instanceof(ol.Feature);
        //});
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
                },
                getCRS: function () {
                    return this.crs;
                }
            }
        };
        var feature = {
            wrap: {
                feature: new ol.Feature({ geometry: new ol.geom.Point([0, 0]), '3D length': 23 }),
                cloneFeature: function () {
                    return this.feature.clone();
                }
            },
            getGeometryStride: function () {
                return 2;
            },
            getPath: function () {
                return ['carpeta1', 'carpeta2'];
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
        it("Propiedad target de la interacción Drag&Drop sigue disponible", function (done) {
            expect(new ol.interaction.DragAndDrop().hasOwnProperty('target')).to.be.true;
            done();
        });
    });    
});
if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.FileImport = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    if ($.isArray(self.options.formats)) {
        self.formats = self.options.formats;
    }
    else {
        self.formats = [
            TC.Consts.format.KML,
            TC.Consts.format.GML,
            TC.Consts.format.GML2,
            TC.Consts.format.GEOJSON,
            TC.Consts.format.WKT,
            TC.Consts.format.GPX
        ];
    }

    self.apiAttribution = '';
    self.mainDataAttribution = '';
    self.dataAttributions = [];
};

TC.inherit(TC.control.FileImport, TC.Control);

(function () {
    var ctlProto = TC.control.FileImport.prototype;

    ctlProto.CLASS = 'tc-ctl-file';

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/FileImport.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "openFile" }).w("</h2><div><p>").h("i18n", ctx, {}, { "$key": "fileImport.instructions" }).w("</p><div class=\"tc-ctl-file-open\"><label class=\"tc-button tc-ctl-file-open-label tc-icon-button\"><input type=\"file\" class=\"tc-ctl-file-open-ipt tc-button\" accept=\"").s(ctx.get(["formats"], false), ctx, { "block": body_1 }, {}).w("\" />").h("i18n", ctx, {}, { "$key": "openFile" }).w("</label></div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w(".").f(ctx.getPath(true, []), ctx, "h").h("sep", ctx, { "block": body_2 }, {}); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w(","); } body_2.__dustBody = !0; return body_0 };
    }

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        if (self.options.enableDragAndDrop) {
            map.wrap.enableDragAndDrop(self.options);
        }

        map
            .on(TC.Consts.event.FEATURESIMPORT, function (e) {
                // Ignoramos los GPX (se supone que los gestionará Geolocation)
                var pattern = '.' + TC.Consts.format.GPX.toLowerCase();
                if (e.fileName.toLowerCase().indexOf(pattern) === e.fileName.length - pattern.length) {
                    return;
                }
                map.addLayer({
                    id: self.getUID(),
                    title: e.fileName,
                    type: TC.Consts.layerType.VECTOR
                }).then(function (layer) {
                    var geogCrs = 'EPSG:4326';
                    const flatten = function (prev, cur) {
                        return prev.concat(cur);
                    };
                    var projectGeom = function (feature) {
                        var geom = feature.geometry;
                        if (geom) {
                            var coordinates;
                            switch (true) {
                                case TC.feature.Point && feature instanceof TC.feature.Point:
                                    coordinates = [geom];
                                    break;
                                case TC.feature.MultiPoint && feature instanceof TC.feature.MultiPoint:
                                case TC.feature.Polyline && feature instanceof TC.feature.Polyline:
                                    coordinates = geom;
                                    break;
                                case TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline:
                                case TC.feature.Polygon && feature instanceof TC.feature.Polygon:
                                    coordinates = geom.reduce(flatten);
                                    break;
                                case TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon:
                                    coordinates = geom.reduce(flatten).reduce(flatten);
                                    break;
                                default:
                                    break;
                            }
                            if (coordinates.every(function (coord) {
                                return Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90; // Parecen geográficas
                            })) {
                                feature.setCoords(TC.Util.reproject(geom, geogCrs, self.map.crs));
                            }
                        }

                        return feature;
                    };

                    for (var i = 0, len = e.features.length; i < len; i++) {
                        var projectedFeature = projectGeom(e.features[i]);
                        layer.addFeature(projectedFeature);
                    }
                    setTimeout(function () {
                        map.zoomToFeatures(layer.features);
                    }, 100);
                });
            })
            .on(TC.Consts.event.FEATURESIMPORTERROR, function (e) {
                var dictKey;
                var fileName = e.file.name;
                if (fileName.toLowerCase().substr(fileName.length - 4) === '.kmz') {
                    dictKey = 'fileImport.error.reasonKmz';
                }
                else {
                    dictKey = 'fileImport.error.reasonUnknown';
                }

                TC.error(self.getLocaleString(dictKey, { fileName: fileName }), TC.Consts.msgErrorMode.TOAST);

                var reader = new FileReader();
                reader.onload = function (event) {
                    TC.error("Nombre del archivo: " + fileName + " \n Contenido del archivo: \n\n" + event.target.result, TC.Consts.msgErrorMode.EMAIL,"Error en la subida de un archivo");
                };
                reader.readAsText(e.file);                
            });
    };

    ctlProto.render = function () {
        var self = this;
        self.renderData({ formats: self.formats }, function () {            
            self._$div.find('input[type=file]')
                // GLS: Eliminamos el archivo subido, sin ello no podemos subir el mismo archivo seguido varias veces
                .on(TC.Consts.event.CLICK, function (e) {
                    $(this).wrap('<form>').closest('form').get(0).reset();
                    $(this).unwrap();
                })
                .on('change', function (e) {
                    if (self.map) {
                        console.log('salta el change');
                        self.map.wrap.loadFiles(e.target.files);
                    }
                });
        });
    };

})();

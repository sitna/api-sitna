if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.FileImport = function () {
    var self = this;

    TC.Control.apply(self, arguments);

    if (Array.isArray(self.options.formats)) {
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
    if (window.JSZip) {
        if (window.JSZip instanceof Promise)
            window.JSZip.then(function () {
                self.formats.splice(1, 0, TC.Consts.format.KMZ);
            });
        else
            self.formats.splice(1, 0, TC.Consts.format.KMZ);
    }

    self.layers = [];

    self.apiAttribution = '';
    self.mainDataAttribution = '';
    self.dataAttributions = [];

    self.exportsState = true;
};

TC.inherit(TC.control.FileImport, TC.Control);

(function () {
    var ctlProto = TC.control.FileImport.prototype;

    ctlProto.CLASS = 'tc-ctl-file';

    ctlProto.template = TC.apiLocation + "TC/templates/FileImport.html";

    ctlProto.register = function (map) {
        var self = this;
        const result = TC.Control.prototype.register.call(self, map);

        if (self.options.enableDragAndDrop) {
            map.wrap.enableDragAndDrop(self.options);
        }

        map
            .on(TC.Consts.event.FEATURESIMPORT, function (e) {
                const fileName = e.fileName;
                const target = e.dropTarget;
                const features = e.features;
                // Ignoramos los GPX (se supone que los gestionará Geolocation)
                var gpxPattern = '.' + TC.Consts.format.GPX.toLowerCase();
                if (fileName.toLowerCase().indexOf(gpxPattern) === fileName.length - gpxPattern.length || target !== self.map.div && target !== self) {
                    return;
                }
                
                map.addLayer({
                    id: self.getUID(),
                    title: fileName,
                    owner: self,
                    type: TC.Consts.layerType.VECTOR
                }).then(function (layer) {
                    self.layers.push(layer);
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
                            if (coordinates && coordinates.every(function (coord) {
                                return Math.abs(coord[0]) <= 180 && Math.abs(coord[1]) <= 90; // Parecen geográficas
                            })) {
                                feature.setCoords(TC.Util.reproject(geom, geogCrs, self.map.crs));
                            }
                        }

                        return feature;
                    };

                    for (var i = 0, len = features.length; i < len; i++) {
                        var projectedFeature = projectGeom(features[i]);
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
                    TC.error("Nombre del archivo: " + fileName + " \n Contenido del archivo: \n\n" + event.target.result, TC.Consts.msgErrorMode.EMAIL, "Error en la subida de un archivo");
                };
                reader.readAsText(e.file);
            })
            .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                // Eliminamos la capa cuando ya no quedan features en ella
                const layer = e.layer;
                if (self.layers.indexOf(layer) >= 0) {
                    if (!layer.features.length) {
                        self.map.removeLayer(layer);
                    }
                }
            })
            .on(TC.Consts.event.LAYERREMOVE, function (e) {
                const idx = self.layers.indexOf(e.layer);
                if (idx >= 0) {
                    self.layers.splice(idx, 1);
                }
            });

        return result;
    };

    ctlProto.render = function () {
        const self = this;
        return self._set1stRenderPromise(self.renderData({ formats: self.formats }, function () {            
            const fileInput = self.div.querySelector('input[type=file]');
            // GLS: Eliminamos el archivo subido, sin ello no podemos subir el mismo archivo seguido varias veces
            fileInput.addEventListener(TC.Consts.event.CLICK, function (e) {
                const input = this;
                // Envolvemos el input en un form
                const form = document.createElement('form');
                const parent = input.parentElement;
                parent.insertBefore(form, input);
                form.appendChild(input);
                form.reset();
                // Desenvolvemos el input del form
                form.insertAdjacentElement('afterend', input);
                parent.removeChild(form);
            });
            fileInput.addEventListener('change', function (e) {
                if (self.map) {
                    console.log('salta el change');
                    self.map.wrap.loadFiles(e.target.files, { control: self });
                }
            });
        }));
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.exportsState) {
            return {
                id: self.id,
                layers: self.layers.map(function (layer) {
                    return {
                        title: layer.title,
                        state: layer.exportState()
                    };
                })
            };
        }
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;
        if (self.map) {
            const layerPromises = [];
            state.layers.forEach(function (layerData) {
                layerPromises.push(self.map.addLayer({
                    id: self.getUID(),
                    title: layerData.title,
                    owner: self,
                    type: TC.Consts.layerType.VECTOR
                }));
            });

            Promise.all(layerPromises).then(function (layers) {
                for (var i = 0, len = layers.length; i < len; i++) {
                    const layer = layers[i];
                    layer.importState(state.layers[i].state);
                    self.layers.push(layer);
                }
            });
        }
    };

})();


TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}


TC.control.FeatureDownloadDialog = function () {
    var self = this;
    TC.Control.apply(self, arguments);
    self.title = self.options.title;
    self.cssClass = self.options.cssClass || "";

    self._selectors = {
        ELEVATION_CHECKBOX: "." + self.CLASS + '-elev input[type=checkbox]',
        INTERPOLATION_PANEL: "." + self.CLASS + '-ip',
        INTERPOLATION_RADIO: 'input[type=radio][name=finfo-ip-coords]',
        INTERPOLATION_DISTANCE: "." + self.CLASS + '-ip-m'
    };
};

TC.inherit(TC.control.FeatureDownloadDialog, TC.Control);

(function () {

    const ctlProto = TC.control.FeatureDownloadDialog.prototype;

    ctlProto.CLASS = 'tc-ctl-dwn-dialog';

    var _formats= ["KML", "GML", "GeoJSON", "WKT", "GPX"];

    //if (window.JSZip) {
    //    if (window.JSZip instanceof Promise)
    //        window.JSZip.then(function () {
    //            _formats.splice(1, 0, "KMZ");
    //        });
    //    else
    //        _formats.splice(1, 0, "KMZ");
    //}

    var displayElevation, interpolation = false;
    var interpolationDistance = null;

    ctlProto.template = {};   

    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/FeatureDownloadDialog.html";

    const addElevationAndInterpolation = function (featureOrFeatures, options) {
        const self = this;
        options = options || {};
        const features = Array.isArray(featureOrFeatures) ? featureOrFeatures : [featureOrFeatures];
        return new Promise(function (resolve, reject) {

            //si no se incluyen las elevaciones quito las Z de las geometrias que las tuvieran
            if (!options.displayElevation) {
                resolve(features.map(function (feat) {
                    if (feat.getGeometryStride() > 2) {
                        const f = feat.clone();
                        f.getCoordsArray().forEach(coord => coord.length = 2);
                        f.setCoords(f.geometry);
                        return f;
                    }
                    return feat;
                }));
                return;
            }

            let mustInterpolate = options.elevation && options.elevation.resolution;
            // Array con features sin altura y nulo donde habia feature con alturas
            let featuresToAddElevation = mustInterpolate ? features.map(f => f.clone()) : features.map(f => f.getGeometryStride() > 2 ? null : f.clone());
            
            if (mustInterpolate || featuresToAddElevation.some(f => f !== null)) {
                const elevOptions = {
                    crs: self.map.crs,
                    features: featuresToAddElevation,
                    maxCoordQuantity: options.elevation && options.elevation.maxCoordQuantity,
                    resolution: options.elevation.resolution,
                    sampleNumber: options.elevation.sampleNumber || 0
                };                    
                (self.map.elevation || new TC.tool.Elevation(typeof self.options.elevation === 'boolean' ? {} : self.options.elevation)).setGeometry(elevOptions).then(
                    function (processedFeatures) {
                        // Recombinamos features procesadas y sin procesar
                        processedFeatures.forEach((f, index) => {
                            if (!f) {
                                processedFeatures[index] = features[index];
                            }
                        });
                        resolve(processedFeatures);
                    },
                    function (error) {
                        reject(error instanceof Error ? error : Error(error));
                    }
                );
            }
            else {
                resolve(features);
            }
        });
    };

    ctlProto.render = function (callback) {
        const self = this;
        const result = TC.Control.prototype.render.call(self, callback);
        return result;
        
    };

    ctlProto.open = function (features, options) {
        const self = this;

        ctlProto.getRenderedHtml(ctlProto.CLASS, Object.assign({}, {
            cssClass: self.cssClass,
            checkboxId: self.getUID(),
            elevation: options.elevation,//options.elevation ? (options.elevation instanceof Object ? options.elevation : self.map.elevation.options) : options.elevation,
            formats: _formats.filter(function (item) {
                return (options && options.excludedFormats && options.excludedFormats.indexOf(item) < 0) | (!options | !options.excludedFormats)
            })
        }, options), function (html) {
            var template = document.createElement('template');
            template.innerHTML = html;
            var modal = template.content ? template.content.firstChild : template.firstChild;            
            document.body.appendChild(modal);

            var modalBody = modal.getElementsByClassName("tc-modal-body")[0];
            modalBody.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector('button[data-format]', function (e) {

                var resolution = displayElevation && interpolation ? parseFloat(modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + ' input[type=number]').value) || (self.options.elevation || self.map.elevation.options).resolution : 0

                const endExport = async (features) => {

                    //checkear si son features con datos complejos
                    var cancel = false;
                    if (format !== TC.Consts.format.GEOJSON && options.format !== TC.Consts.format.WKT && (features instanceof Array ? features : [features]).some(function (feat) {
                        for (var attr in feat.getData()) {
                            if (feat.data[attr] instanceof Object)
                                return true
                        }
                        return false;
                    }))
                        await TC.confirm(self.getLocaleString("dl.export.complexAttr").format(format), null,
                            function () {
                                cancel = true
                            });
                    if (cancel) { return };

                    const li = self.map.getLoadingIndicator();
                    const waitId = li && li.addWait();


                    TC.Util.closeModal();
                    addElevationAndInterpolation.apply(self, [features,
                        {
                            displayElevation: displayElevation,
                            elevation: displayElevation ? Object.assign({}, options.elevation || self.map.elevation.options, { resolution: resolution }) : null
                        }]).then(
                        function (features) {
                            let fileName = (options ? (options.fileName || options.title.toLowerCase().replace(/ /g, '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true) || "download_" + TC.Util.getFormattedDate(new Date().toString(), true)) : (options.title.toLowerCase().replace(/ /g, '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true) || "download_" + TC.Util.getFormattedDate(new Date().toString(), true)));                            
                            self.map.exportFeatures(features, {
                                fileName: fileName,
                                format: format
                            });
                        },
                        function (error) {
                            self.open(features, options)
                            if (TC.tool.Elevation && error.message === TC.tool.Elevation.errors.MAX_COORD_QUANTITY_EXCEEDED) {
                                TC.alert(self.getLocaleString('tooManyCoordinatesForElevation.warning'));
                                return;
                            }
                            TC.error(self.getLocaleString('elevation.error'));
                        }
                        ).finally(function () {
                            li && li.removeWait(waitId);
                        });
                }

                const format = e.target.dataset.format;
                if (format === TC.Consts.format.GPX) {

                    if ((features instanceof Array ? features : [features]).some(function (feature) {
                        return TC.feature.Polygon && feature instanceof TC.feature.Polygon;
                    })) {
                        TC.confirm(self.getLocaleString('gpxNotCompatible.confirm'), function () {
                            endExport((features instanceof Array ? features : [features]).filter((f) => { return TC.feature.Polygon && !(f instanceof TC.feature.Polygon); }));
                        });
                    }
                    else {
                        endExport(features);
                    }
                }
                else {
                    endExport(features);
                }


            }));

            const hasLines = (features instanceof Array ? features : [features]).some(function (feature) {
                return (TC.feature.Polyline && feature instanceof TC.feature.Polyline) ||
                    (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline);
            });
            const hasPolygons = (features instanceof Array ? features : [features]).some(function (feature) {
                return (TC.feature.Polygon && feature instanceof TC.feature.Polygon) ||
                    (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon);
            });
            if (options.elevation) {
                modalBody.querySelector(self._selectors.ELEVATION_CHECKBOX).checked = (displayElevation == true);
                if (displayElevation && (hasLines || hasPolygons) && options.elevation.resolution) {
                    modalBody.querySelector(self._selectors.INTERPOLATION_PANEL).classList.remove(TC.Consts.classes.HIDDEN);                    
                }
                if (modalBody.querySelector(self._selectors.INTERPOLATION_PANEL)) {
                    modalBody.querySelectorAll(self._selectors.INTERPOLATION_RADIO)[interpolation ? 1 : 0].checked = true;
                    if (interpolation) {
                        modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE).classList.remove(TC.Consts.classes.HIDDEN);
                        modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + " input").value = interpolationDistance || modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + " input").value;
                    }
                }
            }

            modalBody.addEventListener('change', TC.EventTarget.listenerBySelector(self._selectors.ELEVATION_CHECKBOX, function (e) {
                //self.showDownloadDialog(); // Recalculamos todo el aspecto del diálogo de descarga
                var ipPanel = modalBody.querySelector(self._selectors.INTERPOLATION_PANEL);
                if (ipPanel) { ipPanel.classList.toggle(TC.Consts.classes.HIDDEN, displayElevation || !(hasLines || hasPolygons)); }
                displayElevation = !displayElevation;
            }));
            modalBody.addEventListener('change', TC.EventTarget.listenerBySelector(self._selectors.INTERPOLATION_RADIO, function (e) {
                const idDiv = modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE);
                idDiv.classList.toggle(TC.Consts.classes.HIDDEN);
                interpolation = !interpolation;
                if (interpolation) modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + " input").value = interpolationDistance || modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + " input").value;
            }));
            modalBody.addEventListener('change', TC.EventTarget.listenerBySelector(self._selectors.INTERPOLATION_DISTANCE, function (e) {
                interpolationDistance = e.target.value;
            }));

            TC.Util.showModal(modal, {
                closeCallback: function () {
                    modal.parentElement.removeChild(modal);
                }
            });
        });
    };
    
})();
import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';
import Point from '../../SITNA/feature/Point';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';

TC.control = TC.control || {};
TC.Control = Control;

TC.control.FeatureDownloadDialog = function () {
    var self = this;
    TC.Control.apply(self, arguments);
    self.title = self.options.title;
    self.cssClass = self.options.cssClass || "";

    self._selectors = {
        ELEVATION_CHECKBOX: "." + self.CLASS + '-elev input[type=checkbox]',
        INTERPOLATION_PANEL: "." + self.CLASS + '-ip',
        INTERPOLATION_RADIO: `input[type=radio][name=${self.id}-finfo-ip-coords]`,
        INTERPOLATION_DISTANCE: "." + self.CLASS + '-ip-m'
    };
    self.features = [];
    self.options = {};
};

TC.inherit(TC.control.FeatureDownloadDialog, TC.Control);

(function () {

    const ctlProto = TC.control.FeatureDownloadDialog.prototype;

    ctlProto.CLASS = 'tc-ctl-dldlog';

    var _formats = ["KMZ",/*"KML",*/ "GML", "GeoJSON", "WKT", "GPX", "SHP", "GPKG"];

    var displayElevation, interpolation = false;
    var interpolationDistance = null;

    const addElevationAndInterpolation = async function (features, options) {
        const self = this;
        options = options || {};
        const cloneWithId = function (feat) {
            const result = feat.clone();
            result.id = feat.id;
            return result;
        };
        //si no se incluyen las elevaciones quito las Z de las geometrias que las tuvieran
        if (!options.displayElevation) {
            return features.map(function (feat) {
                if (feat.getGeometryStride() > 2) {
                    const f = cloneWithId(feat);
                    f.id = feat.id;
                    f.layer = feat.layer;
                    f.removeZ();
                    return f;
                }
                return feat;
            });
        }

        let mustInterpolate = options.elevation && options.elevation.resolution;
        // Array con features sin altura y nulo donde habia feature con alturas
        let featuresToAddElevation = mustInterpolate ? features.map(f => cloneWithId(f)) : features.map(f => {
            return f.getCoordsArray().every(p => !p[2]) ? cloneWithId(f) : null;
        });

        if (mustInterpolate || featuresToAddElevation.some(f => f !== null)) {
            const elevOptions = {
                crs: self.map.getCRS(),
                features: featuresToAddElevation,
                maxCoordQuantity: options.elevation && options.elevation.maxCoordQuantity,
                resolution: options.elevation.resolution,
                sampleNumber: options.elevation.sampleNumber || 0
            };
            const processedFeatures = await (self.map.elevation || new TC.tool.Elevation(typeof options.elevation === 'boolean' ? {} : options.elevation)).setGeometry(elevOptions);
            // Recombinamos features procesadas y sin procesar
            processedFeatures.forEach((f, index) => {
                if (!f) {
                    processedFeatures[index] = features[index];
                }
            });
            return processedFeatures;
        }
        else {
            return features;
        }
    };

    const hasPoints = function () {
        return this.getFeatures().some(feature => feature instanceof Point ||
            feature instanceof MultiPoint);
    };
    const hasLines = function () {
        return this.getFeatures().some(feature => feature instanceof Polyline ||
            feature instanceof MultiPolyline);
    };
    const hasPolygons = function () {
        return this.getFeatures().some(feature => feature instanceof Polygon ||
            feature instanceof MultiPolygon);
    };

    ctlProto.loadTemplates = async function () {
        const self = this;
        const module = await import('../templates/tc-ctl-dldlog.mjs');
        self.template = module.default;
    };

    ctlProto.render = function (callback) {
        const self = this;
        const result = TC.Control.prototype.renderData.call(self, { controlId: self.id }, callback);
        return result;
    };

    ctlProto.close = function (_callback) {
        const self = this;

        if (self.modal && self.modal.parentElement) {
            TC.Util.closeModal();
            self.modal.parentElement.removeChild(self.modal);
        }
    };

    ctlProto.open = function (featureOrFeatures, options) {
        const self = this;

        self.close();

        self.setFeatures(featureOrFeatures);
        options = options || {};
        options = Object.assign({}, {
            controlId: self.id,
            cssClass: self.cssClass,
            checkboxId: self.getUID(),
            elevation: options.elevation//options.elevation ? (options.elevation instanceof Object ? options.elevation : self.map.elevation.options) : options.elevation,
        }, options);
        //si solo hay poligonos ocultamos el botón de formato GPX
        const excludedFormats = options.excludedFormats ? options.excludedFormats.slice() : [];
        if (!hasPoints.call(self) && !hasLines.call(self) && hasPolygons.call(self)) {
            excludedFormats.push(Consts.format.GPX);
        }
        options.formats = _formats.filter(item => excludedFormats.indexOf(item) < 0);
        self.setOptions(options);

        self.getRenderedHtml(ctlProto.CLASS, options, function (html) {
            const template = document.createElement('template');
            template.innerHTML = html;
            self.modal = template.content ? template.content.firstChild : template.firstChild;
            document.body.appendChild(self.modal);

            const modalBody = self.modalBody = self.modal.getElementsByClassName("tc-modal-body")[0];
            modalBody.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('button[data-format]', function (e) {

                var resolution = displayElevation && interpolation ? parseFloat(modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + ' input[type=number]').value) || (self.options.elevation || self.map.elevation && self.map.elevation.options).resolution : 0;

                const endExport = async (features, opts) => {

                    //checkear si son features con datos complejos
                    var cancel = false;
                    if (format !== Consts.format.GEOJSON && opts.format !== Consts.format.WKT && features.some(function (feat) {
                        for (var attr in feat.getData()) {
                            if (feat.data[attr] instanceof Object)
                                return true;
                        }
                        return false;
                    }))
                        await TC.confirm(self.getLocaleString("dl.export.complexAttr").format(format), null,
                            function () {
                                cancel = true;
                            });
                    if (cancel) {
                        return;
                    }

                    const li = self.map.getLoadingIndicator();
                    const waitId = li && li.addWait();


                    TC.Util.closeModal();
                    addElevationAndInterpolation.apply(self, [features,
                        {
                            displayElevation: displayElevation,
                            elevation: displayElevation ? Object.assign({}, opts.elevation || self.map.elevation && self.map.elevation.options, { resolution: resolution }) : null
                        }]).then(
                            function (features) {
                                const innerFileName = opts.fileName ||
                                    (opts.title ? opts.title.toLowerCase().replace(/ /g, '_') : 'download');
                                let fileName = opts.fileName || innerFileName + ' ' + TC.Util.getFormattedDate(new Date().toString(), true);
                                self.map.exportFeatures(features, {
                                    fileName: innerFileName,
                                    format: format
                                }).then(data => {
                                    fileName = fileName || TC.getUID();
                                    switch (format) {
                                        case Consts.format.SHAPEFILE:
                                            TC.Util.downloadBlob(fileName + ".zip", data);
                                            break;
                                        case Consts.format.GEOPACKAGE:
                                            TC.Util.downloadFile(fileName + ".gpkg", "application/geopackage+sqlite3", data);
                                            break;
                                        case Consts.format.KMZ:
                                            TC.Util.downloadBlob(fileName + ".kmz", data);
                                            break;
                                        default: {
                                            const mimeType = Consts.mimeType[options.format];
                                            TC.Util.downloadFile(fileName + '.' + format.toLowerCase(), mimeType, data);
                                            break;
                                        }
                                    }
                                });
                            },
                        function (error) {
                            self.open(features, opts);
                            if (TC.tool.Elevation && error.message === TC.tool.Elevation.errors.MAX_COORD_QUANTITY_EXCEEDED) {
                                TC.alert(self.getLocaleString('tooManyCoordinatesForElevation.warning'));
                                return;
                            }
                            TC.error(self.getLocaleString('elevation.error'));
                        }
                        ).finally(function () {
                            li && li.removeWait(waitId);
                        });
                };

                const format = e.target.dataset.format;
                if (format === Consts.format.GPX) {
                    if (hasPolygons.call(self)) {
                        TC.confirm(self.getLocaleString('gpxNotCompatible.confirm'), function () {
                            endExport(self.getFeatures().filter(function (feature) {
                                return !(feature instanceof Polygon) && !(feature instanceof MultiPolygon);
                            }), self.getOptions());
                        });
                    }
                    else {
                        endExport(self.getFeatures(), self.getOptions());
                    }
                }
                else {
                    endExport(self.getFeatures(), self.getOptions());
                }


            }), { passive: true });

            const interpolationPanel = modalBody.querySelector(self._selectors.INTERPOLATION_PANEL);
            const elevationCheckbox = modalBody.querySelector(self._selectors.ELEVATION_CHECKBOX);

            if (options.elevation) {
                displayElevation = options.elevation.checked ? options.elevation.checked : displayElevation;

                elevationCheckbox.checked = displayElevation;

                if (interpolationPanel) {
                    if (displayElevation) {
                        interpolationPanel.classList.remove(Consts.classes.HIDDEN);
                    } else {                        
                        if (!interpolationPanel.classList.contains(Consts.classes.HIDDEN)) {
                            interpolationPanel.classList.add(Consts.classes.HIDDEN);
                        }                        
                    }

                    if (displayElevation && (hasLines.call(self) || hasPolygons.call(self)) && options.elevation.resolution) {
                        interpolationPanel.classList.remove(Consts.classes.HIDDEN);
                    } else {
                        if (!interpolationPanel.classList.contains(Consts.classes.HIDDEN)) {
                            interpolationPanel.classList.add(Consts.classes.HIDDEN);
                        }
                    }

                    modalBody.querySelectorAll(self._selectors.INTERPOLATION_RADIO)[interpolation ? 1 : 0].checked = true;
                    if (interpolation) {
                        modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE).classList.remove(Consts.classes.HIDDEN);
                        modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + " input").value = interpolationDistance || modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + " input").value;
                    }
                }
            }

            modalBody.addEventListener('change', TC.EventTarget.listenerBySelector(self._selectors.ELEVATION_CHECKBOX, function (_e) {
                //self.showDownloadDialog(); // Recalculamos todo el aspecto del diálogo de descarga

                displayElevation = !displayElevation;

                if (interpolationPanel) {
                    if (displayElevation) {
                        interpolationPanel.classList.remove(Consts.classes.HIDDEN);
                    } else {
                        if (!interpolationPanel.classList.contains(Consts.classes.HIDDEN)) {
                            interpolationPanel.classList.add(Consts.classes.HIDDEN);
                        }
                    }

                    if (displayElevation && (hasLines.call(self) || hasPolygons.call(self))) {
                        interpolationPanel.classList.remove(Consts.classes.HIDDEN);
                    } else {
                        if (!interpolationPanel.classList.contains(Consts.classes.HIDDEN)) {
                            interpolationPanel.classList.add(Consts.classes.HIDDEN);
                        }
                    }
                }               
                
            }));
            modalBody.addEventListener('change', TC.EventTarget.listenerBySelector(self._selectors.INTERPOLATION_RADIO, function (_e) {
                const idDiv = modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE);
                idDiv.classList.toggle(Consts.classes.HIDDEN);
                interpolation = !interpolation;
                if (interpolation) modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + " input").value = interpolationDistance || modalBody.querySelector(self._selectors.INTERPOLATION_DISTANCE + " input").value;
            }));
            modalBody.addEventListener('change', TC.EventTarget.listenerBySelector(self._selectors.INTERPOLATION_DISTANCE, function (e) {
                interpolationDistance = e.target.value;
            }));

            let modalOptions = {
                closeCallback: function () {
                    self.modal.parentElement.removeChild(self.modal);
                }
            };

            if (options.openCallback) {
                modalOptions.openCallback = options.openCallback;
            }

            TC.Util.showModal(self.modal, modalOptions);
        });
    };

    ctlProto.setFeatures = function (features) {
        this.features = Array.isArray(features) ? features : [features];
    };

    ctlProto.getFeatures = function () {
        return this.features;
    };

    ctlProto.setOptions = function (options) {
        this.options = Object.assign(this.options, options);
    };

    ctlProto.getOptions = function () {
        return this.options;
    };

})();

const FeatureDownloadDialog = TC.control.FeatureDownloadDialog;
export default FeatureDownloadDialog;
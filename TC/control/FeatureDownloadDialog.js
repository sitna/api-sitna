import TC from '../../TC';
import Util from '../Util';
import Consts from '../Consts';
import Control from '../Control';
import Point from '../../SITNA/feature/Point';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';
import { FieldNameError } from '../../SITNA/format/BinaryFormat';

TC.control = TC.control || {};

class FeatureDownloadDialog extends Control {
    #displayElevation;
    #interpolation = false;
    #interpolationDistance = null;
    #formats = ["KMZ",/*"KML",*/ "GML", "GeoJSON", "WKT", "WKB", "GPX", "SHP", "GPKG"];
    #interpolationPanel;
    #selectors;

    constructor() {
        super(...arguments);
        const self = this;
        self.title = self.options.title;
        self.cssClass = self.options.cssClass || "";

        self.#selectors = {
            ELEVATION_CHECKBOX: "." + self.CLASS + '-elev input[type=checkbox]',
            INTERPOLATION_PANEL: "." + self.CLASS + '-ip',
            INTERPOLATION_RADIO: `input[type=radio][name=${self.id}-finfo-ip-coords]`,
            INTERPOLATION_DISTANCE: "." + self.CLASS + '-ip-m'
        };
        self.features = [];
        self.options = {};
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-dldlog.mjs');
        self.template = module.default;
    }

    render(callback) {
        const self = this;
        return super.renderData.call(self, { controlId: self.id }, callback);
    }

    addUIEventListeners() {
        const self = this;
        if (self.modalBody) {
            const modalBody = self.modalBody;

            modalBody.querySelectorAll('button[data-format]').forEach((btn) => btn.addEventListener(Consts.event.CLICK, function (e) {
                self.download({ format: e.target.dataset.format });
            }, { passive: true }));

            if (self.options?.elevation) {

                modalBody.querySelector(self.#selectors.ELEVATION_CHECKBOX).addEventListener('change', function (_e) {
                    //self.showDownloadDialog(); // Recalculamos todo el aspecto del diálogo de descarga

                    self.#displayElevation = !self.#displayElevation;

                    self.#interpolationPanel?.classList.toggle(Consts.classes.HIDDEN, !self.#displayElevation || !self.#hasLines() && !self.#hasPolygons());

                });

                if (self.options.elevation?.resolution) {
                    modalBody.querySelectorAll(self.#selectors.INTERPOLATION_RADIO).forEach((radio) => radio.addEventListener('change', function (_e) {
                        const idDiv = modalBody.querySelector(self.#selectors.INTERPOLATION_DISTANCE);
                        idDiv.classList.toggle(Consts.classes.HIDDEN);
                        self.#interpolation = !self.#interpolation;
                        if (self.#interpolation) modalBody.querySelector(self.#selectors.INTERPOLATION_DISTANCE + " input").value = self.#interpolationDistance || modalBody.querySelector(self.#selectors.INTERPOLATION_DISTANCE + " input").value;
                    }));

                    modalBody.querySelector(self.#selectors.INTERPOLATION_DISTANCE).addEventListener('change', function (e) {
                        self.#interpolationDistance = e.target.value;
                    });
                }
            }            
        }
    }

    #hasPoints() {
        return this.getFeatures().some(feature => feature instanceof Point ||
            feature instanceof MultiPoint);
    }

    #hasLines() {
        return this.getFeatures().some(feature => feature instanceof Polyline ||
            feature instanceof MultiPolyline);
    }

    #hasPolygons() {
        return this.getFeatures().some(feature => feature instanceof Polygon ||
            feature instanceof MultiPolygon);
    }

    async #addElevationAndInterpolation(features, options = {}) {
        const self = this;
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
    }

    async open(featureOrFeatures, options) {
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
        if (!self.#hasPoints(self) && !self.#hasLines(self) && self.#hasPolygons(self)) {
            excludedFormats.push(Consts.format.GPX);
        }
        options.formats = self.#formats.filter(item => excludedFormats.indexOf(item) < 0);
        self.setOptions(options);

        const html = await self.getRenderedHtml(self.CLASS, options);
        const template = document.createElement('template');
        template.innerHTML = html;
        self.modal = template.content ? template.content.firstChild : template.firstChild;
        document.body.appendChild(self.modal);

        const modalBody = self.modalBody = self.modal.getElementsByClassName("tc-modal-body")[0];

        self.#interpolationPanel = modalBody.querySelector(self.#selectors.INTERPOLATION_PANEL);
        const elevationCheckbox = modalBody.querySelector(self.#selectors.ELEVATION_CHECKBOX);

        if (options.elevation) {
            self.#displayElevation = options.elevation.checked ? options.elevation.checked : self.#displayElevation;

            elevationCheckbox.checked = self.#displayElevation;

            if (self.#interpolationPanel) {
                self.#interpolationPanel.classList.toggle(Consts.classes.HIDDEN, !self.#displayElevation || !self.#hasLines() && !self.#hasPolygons() || !options.elevation.resolution);

                modalBody.querySelectorAll(self.#selectors.INTERPOLATION_RADIO)[self.#interpolation ? 1 : 0].checked = true;
                if (self.#interpolation) {
                    modalBody.querySelector(self.#selectors.INTERPOLATION_DISTANCE).classList.remove(Consts.classes.HIDDEN);
                    const input = modalBody.querySelector(self.#selectors.INTERPOLATION_DISTANCE + " input");
                    input.value = self.#interpolationDistance || input.value;
                }
            }
        }

        self.addUIEventListeners();

        let modalOptions = {
            closeCallback: function () {
                self.modal.parentElement.removeChild(self.modal);
            }
        };

        if (options.openCallback) {
            modalOptions.openCallback = options.openCallback;
        }

        Util.showModal(self.modal, modalOptions);
    }

    close(_callback) {
        const self = this;

        if (self.modal && self.modal.parentElement) {
            Util.closeModal();
            self.modal.parentElement.removeChild(self.modal);
        }
    }

    download(options = {}) {
        const self = this;
        if (!options.format) {
            return;
        }

        var resolution = self.#displayElevation && self.#interpolation ?
            parseFloat(self.modalBody.querySelector(self.#selectors.INTERPOLATION_DISTANCE + ' input[type=number]').value) || (self.options.elevation || self.map.elevation?.options)?.resolution : 0;
        const format = options.format;

        const endExport = async (features, opts) => {

            //checkear si son features con datos complejos
            var cancel = false;
            if (format !== Consts.format.GEOJSON &&
                opts.format !== Consts.format.WKT &&
                format !== Consts.format.GML &&
                features.some(function (feat) {
                    for (var attr in feat.getData()) {
                        if (feat.data[attr] instanceof Object)
                            return true;
                    }
                    return false;
                })) {
                if (!options.acceptedDataDestruction) {
                    await TC.confirm(Util.formatIndexedTemplate(self.getLocaleString("dl.export.complexAttr"), format),
                        () => {
                            options.acceptedDataDestruction = true;
                        },
                        () => {
                            cancel = true;
                        });
                }
            }
            if (cancel) {
                return;
            }

            await self.map.wait(async () => {
                Util.closeModal();
                try {
                    const proccessedFeatures = await self.#addElevationAndInterpolation(features, {
                        displayElevation: self.#displayElevation,
                        elevation: self.#displayElevation ? Object.assign({}, opts.elevation || self.map.elevation && self.map.elevation.options, { resolution: resolution }) : null
                    });
                    const innerFileName = opts.fileName ||
                        (opts.title ? opts.title.toLowerCase().replace(/ /g, '_') : 'download');
                    let fileName = opts.fileName || innerFileName + ' ' + Util.getFormattedDate(new Date().toString(), true);
                    try {
                        const data = await self.map.exportFeatures(proccessedFeatures, {
                            fileName: innerFileName,
                            format,
                            adaptNames: options.adaptNames
                        })
                        fileName = fileName || TC.getUID();
                        switch (format) {
                            case Consts.format.SHAPEFILE:
                                Util.downloadBlob(fileName + ".zip", data);
                                break;
                            case Consts.format.GEOPACKAGE:
                                Util.downloadFile(fileName + ".gpkg", "application/geopackage+sqlite3", data);
                                break;
                            case Consts.format.KMZ:
                                Util.downloadBlob(fileName + ".kmz", data);
                                break;
                            default: {
                                const mimeType = Consts.mimeType[format];
                                Util.downloadFile(fileName + '.' + format.toLowerCase(), mimeType, data);
                                break;
                            }
                        }
                    }
                    catch (e) {
                        if (e instanceof FieldNameError) {
                            const message = self.getLocaleString('fileWrite.fieldNameError', { name: e.cause });
                            if (options.adaptNames) {
                                TC.error(message, [Consts.msgErrorMode.TOAST, Consts.msgErrorMode.CONSOLE]);
                            }
                            else {
                                TC.confirm(self.getLocaleString('fileWrite.fieldNameWarning'), () => {
                                    const newOpts = { ...options };
                                    newOpts.adaptNames = true;
                                    self.download(newOpts);
                                }, () => {
                                    self.map.toast(message, { type: Consts.msgType.INFO });
                                });
                            }
                        }
                        else {
                            TC.error(e);
                        }
                    }
                }
                catch (error) {
                    self.open(features, opts);
                    if (TC.tool.Elevation && error.message === TC.tool.Elevation.errors.MAX_COORD_QUANTITY_EXCEEDED) {
                        TC.alert(self.getLocaleString('tooManyCoordinatesForElevation.warning'));
                        return;
                    }
                    TC.error(self.getLocaleString('elevation.error'));
                }
            });
        };

        if (format === Consts.format.GPX) {
            if (self.#hasPolygons()) {
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
    }

    setFeatures(features) {
        this.features = Array.isArray(features) ? features : [features];
    }

    getFeatures() {
        return this.features;
    }

    setOptions(options) {
        this.options = Object.assign(this.options, options);
    }

    getOptions() {
        return this.options;
    }
}

FeatureDownloadDialog.prototype.CLASS = 'tc-ctl-dldlog';
TC.control.FeatureDownloadDialog = FeatureDownloadDialog;
export default FeatureDownloadDialog;
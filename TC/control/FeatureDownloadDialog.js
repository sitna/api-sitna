import TC from '../../TC.js';
import Util from '../Util.js';
import Consts from '../Consts.js';
import WebComponentControl from './WebComponentControl.js';
import Point from '../../SITNA/feature/Point.js';
import MultiPoint from '../../SITNA/feature/MultiPoint.js';
import Polyline from '../../SITNA/feature/Polyline.js';
import MultiPolyline from '../../SITNA/feature/MultiPolyline.js';
import Polygon from '../../SITNA/feature/Polygon.js';
import MultiPolygon from '../../SITNA/feature/MultiPolygon.js';
import { FieldNameError, TimeNotSupportedError } from '../../SITNA/format/BinaryFormat.js';
import Elevation from '../tool/Elevation.js'

TC.control = TC.control || {};

const elementName = 'sitna-download-file';

class FeatureDownloadDialog extends WebComponentControl {
    displaysElevation;
    #interpolation = false;
    #interpolationDistance = null;
    #interpolationPanel;
    #elevationSourcePanel;
    #selectors;
    usesDtm = false;
    static persistenceMode = {
        SAVE: 'save',
        DOWNLOAD: 'download',
    };
    formats = [
        Consts.format.KMZ,
        Consts.format.GML,
        Consts.format.GEOJSON,
        Consts.format.WKT,
        Consts.format.WKB,
        Consts.format.GPX,
        Consts.format.SHAPEFILE,
        Consts.format.GEOPACKAGE,
    ];

    persistenceMode = FeatureDownloadDialog.persistenceMode.DOWNLOAD;

    constructor() {
        super(...arguments);
        if (this.options.title) this.title = this.options.title;
        this.cssClass = this.options.cssClass || "";

        const className = this.constructor.prototype.CLASS;
        this.#selectors = {
            ELEVATION_CHECKBOX: `.${className}-elev sitna-toggle`,
            ELEVATION_PANEL: `.${className}-elev-ipt`,
            ELEVATION_SOURCE_PANEL: `.${className}-elev-src`,
            SOURCE_RADIO: `.${className}-elev-src input[type=radio]`,
            INTERPOLATION_PANEL: `.${className}-elev-ip`,
            INTERPOLATION_RADIO: `.${className}-elev-ip input[type=radio]`,
            INTERPOLATION_DISTANCE: `.${className}-elev-ip-m`,
        };
        this.features = [];
        this.options = {};
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-dldlog.mjs');
        self.template = module.default;
    }

    render(callback) {
        const self = this;
        return super.renderData.call(self, { uid: TC.getUID(), controlId: this.getId() }, callback);
    }

    addUIEventListeners() {
        const self = this;
        if (self.modalBody) {
            const modalBody = self.modalBody;

            modalBody.querySelectorAll('sitna-button[data-format]').forEach((btn) => btn.addEventListener(Consts.event.CLICK, function (e) {
                self.persist({ format: e.target.dataset.format }).catch((e) => TC.error(e));
            }, { passive: true }));

            if (self.options?.elevation) {

                modalBody.querySelector(self.#selectors.ELEVATION_CHECKBOX).addEventListener('change', function (_e) {
                    //self.showDownloadDialog(); // Recalculamos todo el aspecto del diálogo de descarga

                    self.displaysElevation = !self.displaysElevation;

                    self.#setElevationUIState();

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

                modalBody.querySelectorAll(self.#selectors.SOURCE_RADIO).forEach((radio, idx) => radio.addEventListener('change', function (_e) {
                    self.usesDtm = idx === 1;
                    self.#setElevationUIState();
                }));
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
        //si no se incluyen las elevaciones quito las Z de las geometrias que las tuvieran
        if (!options.displayElevation) {
            for (const feat of features) {
                if (feat.getGeometryStride() > 2) {
                    feat.removeZ();
                }
            }
            return features;
        }

        let mustInterpolate = options.elevation && options.elevation.resolution;
        // Array con features sin altura y nulo donde habia feature con alturas
        let featuresToAddElevation;
        if (self.usesDtm) {
            featuresToAddElevation = features;
        }
        else {
            featuresToAddElevation = mustInterpolate ?
                features : features.map((f) => f.getCoordsArray().every(p => !p[2]) ? f : null);
        }

        if (mustInterpolate || featuresToAddElevation.some((f) => f !== null)) {
            const elevOptions = {
                crs: self.map.getCRS(),
                features: featuresToAddElevation,
                maxCoordQuantity: options.elevation && options.elevation.maxCoordQuantity,
                resolution: options.elevation.resolution,
                sampleNumber: options.elevation.sampleNumber || 0
            };
            const processedFeatures = await (self.map.elevation || new Elevation(typeof options.elevation === 'boolean' ? {} : options.elevation)).setGeometry(elevOptions);
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

    async open(featureOrFeatures, options = {}) {
        const self = this;

        self.close();

        self.hiddenElevationSourceSelection = options.hiddenElevationSourceSelection ?? false;

        self.setFeatures(featureOrFeatures);
        options = Object.assign({}, {
            controlId: self.getId(),
            cssClass: self.cssClass,
            elevation: options.elevation//options.elevation ? (options.elevation instanceof Object ? options.elevation : self.map.elevation.options) : options.elevation,
        }, options);
        //si solo hay poligonos ocultamos el botón de formato GPX
        const excludedFormats = options.excludedFormats ? options.excludedFormats.slice() : [];
        if (!self.#hasPoints(self) && !self.#hasLines(self) && self.#hasPolygons(self)) {
            excludedFormats.push(Consts.format.GPX);
        }
        options.formats ??= self.formats.filter((format) => excludedFormats.indexOf(format) < 0);
        self.persistenceMode = options.persistenceMode ?? FeatureDownloadDialog.persistenceMode.DOWNLOAD;
        self.setOptions(options);

        const html = await self.getRenderedHtml(self.CLASS, options);
        const template = document.createElement('template');
        template.innerHTML = html;
        self.modal = template.content ? template.content.firstChild : template.firstChild;
        self.appendChild(self.modal);

        const modalBody = self.modalBody = self.modal.getElementsByClassName("tc-modal-body")[0];

        self.#elevationSourcePanel = modalBody.querySelector(self.#selectors.ELEVATION_SOURCE_PANEL);
        self.#interpolationPanel = modalBody.querySelector(self.#selectors.INTERPOLATION_PANEL);

        if (options.elevation) {
            self.displaysElevation = options.elevation.checked ? options.elevation.checked : self.displaysElevation;
            self.#setElevationUIState();
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

    #setElevationUIState() {
        const featuresHaveZ = this.getFeatures().some((f) => f.getGeometryStride() > 2);
        if (!featuresHaveZ) this.usesDtm = true;
        const modalBody = this.modalBody = this.modal.getElementsByClassName("tc-modal-body")[0];
        modalBody.querySelector(this.#selectors.ELEVATION_CHECKBOX).checked = this.displaysElevation;
        const interpolationRadio = modalBody.querySelectorAll(this.#selectors.INTERPOLATION_RADIO)[this.#interpolation ? 1 : 0];
        if (interpolationRadio) interpolationRadio.checked = true;
        modalBody.querySelector(this.#selectors.INTERPOLATION_DISTANCE)?.classList.toggle(Consts.classes.HIDDEN, !this.#interpolation);
        const sourceRadio = modalBody.querySelectorAll(this.#selectors.SOURCE_RADIO)[this.usesDtm ? 1 : 0];
        if (sourceRadio) sourceRadio.checked = true;
        this.#elevationSourcePanel?.classList.toggle(Consts.classes.HIDDEN, this.hiddenElevationSourceSelection || !(this.displaysElevation && featuresHaveZ));
        this.#interpolationPanel?.classList.toggle(Consts.classes.HIDDEN, !this.usesDtm || !this.displaysElevation || !this.#hasLines() && !this.#hasPolygons());
        const input = modalBody.querySelector(this.#selectors.INTERPOLATION_DISTANCE + " input");
        input.value = this.#interpolationDistance || input.value;
    }

    async persist(options = {}) {
        const self = this;
        if (!options.format) {
            return;
        }

        var resolution = self.displaysElevation && self.#interpolation ?
            parseFloat(self.modalBody.querySelector(self.#selectors.INTERPOLATION_DISTANCE + ' input[type=number]').value) || (self.options.elevation || self.map.elevation?.options)?.resolution : 0;
        const format = options.format;

        let features = self.getFeatures();
        if (format === Consts.format.GPX) {
            if (self.#hasPolygons()) {
                if (TC.confirm(self.getLocaleString('gpxNotCompatible.confirm'))) {
                    features = features.filter((f) => !(f instanceof Polygon) && !(f instanceof MultiPolygon));
                }
                else {
                    return;
                }
            }
        }

        const controlOptions = self.getOptions();

        //comprobar si son features con datos complejos
        if (format !== Consts.format.GEOJSON &&
            controlOptions.format !== Consts.format.WKT &&
            format !== Consts.format.GML &&
            features.some(function (feat) {
                for (var attr in feat.getData()) {
                    if (feat.data[attr] instanceof Object)
                        return true;
                }
                return false;
            })) {
            if (!options.acceptedDataDestruction) {
                if (TC.confirm(Util.formatIndexedTemplate(self.getLocaleString("dl.export.complexAttr"), format))) {
                    options.acceptedDataDestruction = true;
                }
                else {
                    return;
                }
            }
        }

        // Comprobar si el formato soporta estilos
        if (format !== Consts.format.KMZ) {
            const layerChangedStyle = features.some((f) => {
                if (f.layer) {
                    const layer = f.layer;
                    for (const geom in layer.styles) {
                        const layerStyle = layer.styles[geom];
                        if (!Util.stylesEqual(layerStyle, layer.options.styles?.[geom])) {
                            return true;
                        }
                    }
                }
                return false;
            })
            const featuresHaveStyle = features.some((f) => Object.keys(f.getStyle() ?? {}).length > 0);
            if (layerChangedStyle || featuresHaveStyle) {
                if (!options.acceptedStyleLoss) {
                    if (TC.confirm(Util.formatIndexedTemplate(self.getLocaleString("dl.export.styleLoss"), format))) {
                        options.acceptedStyleLoss = true;
                    }
                    else {
                        return;
                    }
                }
            }
        }

        return await self.map.wait(async () => {
            let result = null;
            Util.closeModal();
            const persistBySaving = this.persistenceMode === FeatureDownloadDialog.persistenceMode.SAVE && 
                !!window.showSaveFilePicker;
            // Si descargamos, clonamos las features para no modificar las originales
            // Si guardamos, modificamos las features originales
            let proccessedFeatures = persistBySaving ? features : features.map((feat) => {
                const result = feat.clone();
                result.setId(feat.id);
                result.layer = feat.layer;
                return result;
            });
            try {
                await self.#addElevationAndInterpolation(proccessedFeatures, {
                    displayElevation: self.displaysElevation,
                    elevation: self.displaysElevation ? Object.assign({}, controlOptions.elevation || self.map.elevation && self.map.elevation.options, { resolution: resolution }) : null
                });
            }
            catch (error) {
                self.open(features, controlOptions);
                if (error.message === Elevation.errors.MAX_COORD_QUANTITY_EXCEEDED) {
                    TC.alert(self.getLocaleString('tooManyCoordinatesForElevation.warning'));
                    return;
                }
                TC.error(self.getLocaleString('elevation.error'));
                return;
            }

            let exportedFileName = controlOptions.fileName ||
                (controlOptions.title ? controlOptions.title.toLowerCase().replace(/ /g, '_') : 'download');
            let fileName = controlOptions.fileName || exportedFileName + ' ' + Util.getFormattedDate(new Date().toString(), true);
            switch (format) {
                case Consts.format.SHAPEFILE:
                    exportedFileName = exportedFileName + '.zip';
                    break;
                case Consts.format.KMZ:
                    exportedFileName = exportedFileName + '.kmz';
                    break;
                default: {
                    exportedFileName = null; // no se usa más que en los casos anteriores
                    break;
                }
            }
            fileName = fileName || TC.getUID();
            let extension;
            switch (format) {
                case Consts.format.SHAPEFILE:
                    extension = ".zip";
                    break;
                case Consts.format.GEOPACKAGE:
                    extension = ".gpkg";
                    break;
                case Consts.format.KMZ:
                    extension = ".kmz";
                    break;
                default: {
                    extension = '.' + format.toLowerCase();
                    break;
                }
            }
            fileName = fileName + extension;

            let data;
            try {
                data = await self.map.exportFeatures(proccessedFeatures, {
                    fileName: exportedFileName,
                    format,
                    adaptNames: options.adaptNames,
                    acceptTimeLoss: options.acceptTimeLoss,
                });
            }
            catch (e) {
                if (e instanceof FieldNameError) {
                    const message = self.getLocaleString('fileWrite.fieldNameError', { name: e.cause });
                    if (options.adaptNames) {
                        TC.error(message, [Consts.msgErrorMode.TOAST, Consts.msgErrorMode.CONSOLE]);
                    }
                    else {
                        if (TC.confirm(self.getLocaleString('fileWrite.fieldNameWarning'))) {
                            const newOpts = { ...options };
                            newOpts.adaptNames = true;
                            self.persist(newOpts);
                        }
                        else {
                            self.map.toast(message, { type: Consts.msgType.INFO });
                        }
                    }
                }
                else if (e instanceof TimeNotSupportedError) {
                    if (!options.acceptTimeLoss) {
                        if (TC.confirm(self.getLocaleString('dl.export.timeData', format))) {
                            const newOpts = { ...options };
                            newOpts.acceptTimeLoss = true;
                            self.persist(newOpts);
                        }
                    }
                }
                else {
                    throw e;
                }
                return;
            }

            if (persistBySaving) {
                // Save as file
                const getPermission = async function (handle) {
                    const permissionDescriptor = { mode: 'readwrite' };
                    let result = await handle.queryPermission(permissionDescriptor);
                    if (result !== 'granted') {
                        result = await handle.requestPermission(permissionDescriptor);
                    }
                    return result;
                };
                const types = [{
                    accept: {
                        [Util.getMimeTypeFromUrl(format)]: [extension]
                    },
                    description: this.querySelector(`[data-format="${format}"]`).textContent,
                }];
                const fileHandle = await window.showSaveFilePicker({ types, suggestedName: fileName });
                const permission = await getPermission(fileHandle);
                const fileSystemFileName = fileHandle.name;
                result = fileHandle;
                fileName = fileSystemFileName;

                if (permission === 'granted') {
                    const writeData = async function (handle, data) {
                        try {
                            const writable = await handle.createWritable();
                            await writable.write(data);
                            await writable.close();
                            return true;
                        }
                        catch (e) {
                            TC.error(self.getLocaleString('fileWrite.error'), [Consts.msgErrorMode.TOAST, Consts.msgErrorMode.CONSOLE]);
                            return false;
                        }
                    };
                    const writeOk = await writeData(fileHandle, data);
                    if (writeOk) {
                        const sorter = (a, b) => {
                            let result = 0;
                            if (a.layer && b.layer) {
                                result = a.layer.id.localeCompare(b.layer.id);
                            }
                            if (result === 0) result = a.id.localeCompare(b.id);
                            return result;
                        };
                        const layers = new Set();
                        const oldFileHandles = new Set();
                        features.forEach((f) => f.layer && layers.add(f.layer));
                        const sortedFeatures = features.sort(sorter);
                        const sortedLayerFeatures = Array.from(layers).map((l) => l.features).flat().sort(sorter);
                        let updateLayers = true;
                        for (let i = 0; i < sortedFeatures.length; i++) {
                            if (sortedFeatures[i] !== sortedLayerFeatures[i]) {
                                updateLayers = false;
                                break;
                            }
                        }
                        if (updateLayers) {
                            layers.forEach((layer) => {
                                oldFileHandles.add(layer._fileHandle);
                                layer._fileHandle = fileHandle;
                                self.map.trigger(Consts.event.VECTORUPDATE, { layer });
                            });
                        }

                        oldFileHandles.forEach((oldFileHandle) => {
                            self.map.trigger(Consts.event.FILESAVE, { fileHandle, oldFileHandle });
                        });
                        await self.map.addRecentFileEntry({ mainHandle: fileHandle });
                        await self.map.refreshMapState();
                        self.map.toast(self.getLocaleString('fileSaved'), { type: Consts.msgType.INFO });
                    }
                }
            }
            else {
                // Download
                switch (format) {
                    case Consts.format.SHAPEFILE:
                    case Consts.format.KMZ:
                        Util.downloadBlob(fileName, data);
                        break;
                    case Consts.format.GEOPACKAGE:
                        Util.downloadFile(fileName, "application/geopackage+sqlite3", data);
                        break;
                    default: {
                        const mimeType = Consts.mimeType[format];
                        Util.downloadFile(fileName, mimeType, data);
                        break;
                    }
                }
            }

            return result;
        });
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

    setPersistenceMode(mode) {
        this.persistenceMode = mode;
    }
}

FeatureDownloadDialog.prototype.CLASS = 'tc-ctl-dldlog';
customElements.get(elementName) || customElements.define(elementName, FeatureDownloadDialog);
TC.control.FeatureDownloadDialog = FeatureDownloadDialog;
export default FeatureDownloadDialog;
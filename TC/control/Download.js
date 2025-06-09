
import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import MapInfo from './MapInfo.js';
import filter from '../filter.js';
import Polygon from '../../SITNA/feature/Polygon.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';

TC.control = TC.control || {};
TC.filter = filter;

const toFixed = function (number) {
    let result = number.toFixed(20);
    if (result.indexOf('.') >= 0) {
        result = result.replace(/0+$/, '').replace(/\.$/, '');
    }
    return result;
};
class DownloadModel {
    constructor() {
        this.download = "";
        this["dl.export.map"] = "";
        this["dl.export.vector"] = "";
        this.format = "";
        this.createQrCodeToImage = "";
        this.appendQRCode = "";
        this["appendWorldFile.explanation"] = "";
        this.appendWorldFile = "";
        this.copyImageFromCurrentMap = "";
        this.copyClipboard = "";
        this.downloadImageFromCurrentMap = "";
        this.qrAdvice = "";
        this.showDownloadHelp = "";
        this.downloadLayersFromCurrentExtent = "";
        this.tooManyFeatures = "";
        this["tooManyFeatures.instructions"] = "";
        this.noLayersLoaded = "";
        this["noLayersLoaded.instructions"] = "";
        this.tooManySelectedLayers = "";
        this["tooManySelectedLayers.instructions"] = "";
        this.noData = "";
        this["noData.instructions"] = "";
        this.noValidService = "";
        this["noValidService.instructions"] = "";
        this.formatImageTitle = "";
        this.formatVectorTitle = "";
    }
}
class DownloadDialogModel {
    constructor() {
        this.downloadData = "";
        this["dl.instructions.1"] = "";
        this["dl.instructions.2"] = "";
        this["dl.instructions.3"] = "";
        this["dl.instructions.4"] = "";
        this["dl.instructions.5"] = "";
        this["dl.instructions.6"] = "";
        this.close = "";
    }
}

class Download extends MapInfo {
    #activeElement;

    constructor(options = {}) {
        super(...arguments);
        const self = this;

        self._dialogDiv = Util.getDiv(options.dialogDiv);
        if (!options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }
        self.model = new DownloadModel();
        self.dialogModel = new DownloadDialogModel();
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-download.mjs');
        const dialogTemplatePromise = import('../templates/tc-ctl-download-dialog.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-dialog'] = (await dialogTemplatePromise).default;
        self.template = template;
    }

    async render(callback) {
        const self = this;
        await super.renderData.call(self, {
            controlId: self.id,
            deselectableTabs: self.options.deselectableTabs,
            clipboard: !!navigator?.clipboard?.write
        }, function () {
            const firstTab = self.div.querySelector(`.tc-ctl-tctr-select sitna-tab:first-of-type`);
            if (firstTab && firstTab.attributes["for"]) {
                self.#activeElement = document.getElementById(firstTab.attributes["for"].value);
            }

            self.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
            self.controller = new Controller(self.model, new Observer(self.div));
            self.updateModel();
        });
        self._dialogDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-dialog');
        self.dialogController = new Controller(self.dialogModel, new Observer(self._dialogDiv));

    }

    addUIEventListeners() {
        const self = this;
        self.div.querySelectorAll(`.tc-ctl-tctr-select sitna-tab`).forEach(function (tab) {
            tab.callback = function () {
                const target = this.target;
                if (target) {
                    self.#activeElement = target;
                }
            };
        });
        self.div.querySelector('.' + self.CLASS + '-image select').addEventListener("change", function (e) {
            self.div.querySelector(".tc-ctl-clipboard-btn").disabled = !ClipboardItem.supports(e.target.value);
        });
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);

        // GLS: Añado el flag al mapa para tenerlo en cuenta cuando se establece la función de carga de imágenes
        self.map.crossOrigin = 'anonymous';

        self.div.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('.tc-ctl-download-btn', () => self.#download()), { passive: true });
        self.div.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('.tc-ctl-download-help', (evt) => self.#showHelp(evt)), { passive: true });
        self.div.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('.tc-ctl-clipboard-btn', () => self.#copyImage()), { passive: true });

        self.div.addEventListener('change', TC.EventTarget.listenerBySelector(`.${self.CLASS}-image-qr`, function (e) {
            if (e.target.checked) {
                self.generateLink();
            } else {
                self.div.querySelector('.' + self.CLASS + '-alert').classList.add(Consts.classes.HIDDEN);
            }
        }));

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('h2', function (_evt) {
            if (!self.registeredListeners) {
                self.generateLink();
            }
            self.registerListeners();
        }));

        return self;
    }

    async #downLoadImage(format) {
        const self = this;
        const li = self.map.getLoadingIndicator();
        const wait = li && li.addWait();

        const includeQR = !self.#activeElement.querySelector(`.${self.CLASS}-image-qr[disabled]`) &&
            self.#activeElement.querySelector(`.${self.CLASS}-image-qr[checked]`);
        const fileName = window.location.hostname + '_' + self.map.crs.replace(':', '') + '_' + Util.getFormattedDate(new Date().toString(), true);
        const fileExtension = '.' + format.split('/')[1];
        if (self.#activeElement.querySelector(`.${self.CLASS}-image-wld[checked]`) && !self.map.on3DView) {            
            const worldFileExtension = format === Consts.mimeType.JPEG ? '.jgw' : '.pgw';
            const blob = await self.generateImage(format, true, includeQR);
            const extent = self.map.getExtent();
            import('jszip').then(async (module) => {
                const JSZip = module.default;
                var canvases = self.map.wrap.getCanvas();
                var newCanvas = canvases.length > 1 ? Util.mergeCanvases(canvases) : canvases[0];
                const xScale = (extent[2] - extent[0]) / newCanvas.width;
                const ySkew = 0;
                const xSkew = 0;
                const yScale = (extent[1] - extent[3]) / newCanvas.height;
                const xOrigin = extent[0];
                const yOrigin = extent[3];
                const zip = new JSZip();                
                zip.file(fileName + fileExtension, blob);
                zip.file(fileName + worldFileExtension, `${toFixed(xScale)}
${ySkew.toFixed(1)}
${xSkew.toFixed(1)}
${toFixed(yScale)}
${toFixed(xOrigin)}
${toFixed(yOrigin)}`);
                zip.generateAsync({ type: "blob" }).then(function (blob) {
                    Util.downloadBlob(fileName + ".zip", blob);
                    li && li.removeWait(wait);
                }, function (err) {
                    TC.error(self.getLocaleString('dl.export.map.error') + ': ' + err.message);
                    li && li.removeWait(wait);
                });
            });

        }
        else {
            
            try {
                const dataURL = await self.generateImage(format, false, includeQR);
                Util.downloadDataURI(fileName + fileExtension, format, dataURL);
            } catch (e) {
                TC.error(self.getLocaleString('dl.export.map.error') + ': ' + e.message);
            }
            li && li.removeWait(wait);
        }
    }
    
/*
 * Descarga las features de las capas de trabajo actualmente seleccionadas. Comprueba que el número de features a descargar
 * no excede el límite impuesto por el servidor.
 */

    #downloadFeatures(format) {
        this.map?.wait(async () => {
            const _filterBuilder = () => {
                if (this.map.on3DView) {
                    return new filter.Within(null, new Polygon(this.map.view3D.getFovCoords(this.map.view3D.crs)), this.map.view3D.crs);
                }
                else {
                    return new filter.bbox(this.map.getExtent(), this.map.getCRS());
                }
            }

            const arrPromises = this.map.extractFeatures({
                filter: _filterBuilder(),
                outputFormat: format,
                download: true
            });
            const responseArray = await Promise.all(arrPromises);

            var responses = responseArray.filter(item => !!item);
            if (responses.length === 0) {
                this.#showAlert({ key: Consts.WFSErrors.NO_LAYERS });
                return;
            }
            var arrDownloads = [];
            for (var i = 0; i < responses.length; i++) {
                //errores del WFS
                if (responses[i].errors && responses[i].errors.length) {
                    for (var j = 0; j < responses[i].errors.length; j++) {
                        var error = responses[i].errors[j];
                        this.#showAlert(error);
                    }
                    continue;
                }
                var data = responses[i].data;
                var url = responses[i].url;
                if (data && url)
                    arrDownloads.push({ url: url + "?download=zip", data: data });
            }
            try {
                await Util.downloadFileForm(arrDownloads);
            }
            catch (err) {
                if (err.key === Consts.DownloadError.MIMETYPE_NOT_SUPORTED) {
                    const service = responseArray.find(response => response.data === err.data).service;
                    const params = {
                        plural: service.layers.length > 1 ? this.getLocaleString("dl.format.notSupported.plural") : "",
                        layerNames: service.layers.reduce((vi, va, i, array) => {
                            return (vi instanceof Array ? vi : [vi]).concat([va.title]).join(i < array.length - 1 ? ", " : " " + this.getLocaleString("dl.format.notSupported.conjunction") + " ");
                        }, []),
                        serviceTitle: service.mapLayers[0].title,
                        format: format
                    };
                    this.map.toast(Util.formatTemplate(this.getLocaleString("dl.format.notSupported"), params), { type: Consts.msgType.ERROR });
                }
            }
        });
    }

    async #copyImage() {
        const self = this;
        const li = self.map.getLoadingIndicator();
        const wait = li && li.addWait();
        const format=this.#activeElement.querySelector('select').value;
        const includeQR = !self.#activeElement.querySelector(`.${self.CLASS}-image-qr[disabled]`) &&
            self.#activeElement.querySelector(`.${self.CLASS}-image-qr[checked]`);
        const blob = await self.generateImage(format, true, includeQR);
        const clipboardItemData = {
            [blob.type]: blob
        };
        const clipboardItem = new ClipboardItem(clipboardItemData);
        try {
            await navigator.clipboard.write([clipboardItem]);
            li && li.removeWait(wait);
            self.map.toast(self.getLocaleString('copiedClipboard'), { type: Consts.msgType.INFO });
        }
        catch (e) {
            TC.error(e.message);
            li && li.removeWait(wait);
        }
    }

    #download() {
        let format = '';
        if (this.#activeElement) {
            format = this.#activeElement.querySelector('select').value;
        }
        if (format.indexOf('image') > -1) {
            this.#downLoadImage(format);
        }
        else {
            this.#downloadFeatures(format);
        }
    }

    #showAlert(error) {
        const self = this;
        const alert = self.div.querySelector('.tc-alert-warning:not(.' + self.CLASS + '-alert)');
        var errorMsg;
        switch (error.key) {
            case Consts.WFSErrors.MAX_NUM_FEATURES:
                errorMsg = Util.formatTemplate(alert.querySelector("#zoom-msg-" + self.id).innerHTML, { serviceName: error.params.serviceTitle });
                break;
            case Consts.WFSErrors.NO_LAYERS:
                errorMsg = self.getLocaleString('noLayersLoaded');
                break;
            case Consts.WFSErrors.GETCAPABILITIES:
                errorMsg = Util.formatTemplate(alert.querySelector("#novalid-msg-" + self.id).innerHTML, { serviceName: error.params.serviceTitle });
                break;
            case Consts.WFSErrors.NO_FEATURES:
                errorMsg = alert.querySelector("#noFeatures-msg-" + self.id).innerHTML;
                break;
            case Consts.WFSErrors.INDETERMINATE:
                errorMsg = self.getLocaleString("wfs.IndeterminateError");
                self.map.toast(errorMsg, { type: Consts.msgType.ERROR });
                TC.error(Util.formatTemplate("Error:{error} \r\n Descripcion:{descripcion} \r\n Servicio:{serviceName}", { error: error.params.err, descripcion: error.params.errorThrown, serviceName: error.params.serviceTitle }), Consts.msgErrorMode.CONSOLE);
                return;
            case Consts.WFSErrors.NO_VALID_FORMAT:
                errorMsg = self.getLocaleString("wfs.NoValidFormat", { serviceTitle: error.params.serviceTitle, format: error.params.format.toUpperCase() });
                break;
            default:
                errorMsg = self.getLocaleString("wfs." + error.key, error.params);
                break;
        }
        self.map.toast(errorMsg, { type: Consts.msgType.WARNING });
    }
    
    #showHelp = function (evt) {
        const self = this;
        evt.stopPropagation();
        Util.showModal(self._dialogDiv.querySelector(`.${self.CLASS}-help-dialog`));
    }

    manageMaxLengthExceed(maxLengthExceed) {
        const self = this;
        const alert = self.div.querySelector('.' + self.CLASS + '-alert');
        const checkboxQR = self.div.querySelector(`.${self.CLASS}-image-qr`);

        checkboxQR.disabled = maxLengthExceed.qr;

        if (checkboxQR.checked) {
            alert.classList.toggle(Consts.classes.HIDDEN, !maxLengthExceed.qr);
        } else {
            alert.classList.add(Consts.classes.HIDDEN);
        }
    }

    async generateLink() {
        const self = this;
        const checkbox = self.div.querySelector(`.${self.CLASS}-div .${self.CLASS}-image-qr`);
        checkbox.disabled = true;
        checkbox.classList.add(Consts.classes.LOADING);
        const result = await super.generateLink.call(self);
        checkbox.classList.remove(Consts.classes.LOADING);
        return result;
    }
    updateModel() {
        const self = this;
        self.model.download = self.getLocaleString("download");
        self.model["dl.export.map"] = self.getLocaleString("dl.export.map");
        self.model["dl.export.vector"] = self.getLocaleString("dl.export.vector");
        self.model.format = self.getLocaleString("format");
        self.model.createQrCodeToImage = self.getLocaleString("createQrCodeToImage");
        self.model.appendQRCode = self.getLocaleString("appendQRCode");
        self.model["appendWorldFile.explanation"] = self.getLocaleString("appendWorldFile.explanation");
        self.model.appendWorldFile = self.getLocaleString("appendWorldFile");
        self.model.copyImageFromCurrentMap = self.getLocaleString("copyImageFromCurrentMap");
        self.model.copyClipboard = self.getLocaleString("copyClipboard");
        self.model.downloadImageFromCurrentMap = self.getLocaleString("downloadImageFromCurrentMap");
        self.model.qrAdvice = self.getLocaleString("qrAdvice");
        self.model.showDownloadHelp = self.getLocaleString("showDownloadHelp");
        self.model.downloadLayersFromCurrentExtent = self.getLocaleString("downloadLayersFromCurrentExtent");
        self.model.tooManyFeatures = self.getLocaleString("tooManyFeatures");
        self.model["tooManyFeatures.instructions"] = self.getLocaleString("tooManyFeatures.instructions");
        self.model.noLayersLoaded = self.getLocaleString("noLayersLoaded");
        self.model["noLayersLoaded.instructions"] = self.getLocaleString("noLayersLoaded.instructions");
        self.model.tooManySelectedLayers = self.getLocaleString("tooManySelectedLayers");
        self.model["tooManySelectedLayers.instructions"] = self.getLocaleString("tooManySelectedLayers.instructions");
        self.model.noData = self.getLocaleString("noData");
        self.model["noData.instructions"] = self.getLocaleString("noData.instructions");
        self.model.noValidService = self.getLocaleString("noValidService");
        self.model["noValidService.instructions"] = self.getLocaleString("noValidService.instructions");
        self.model.formatImageTitle = self.getLocaleString("format");
        self.model.formatVectorTitle = self.getLocaleString("format");

        self.dialogModel.downloadData = self.getLocaleString("downloadData");
        self.dialogModel["dl.instructions.1"] = self.getLocaleString("dl.instructions.1");
        self.dialogModel["dl.instructions.2"] = self.getLocaleString("dl.instructions.2");
        self.dialogModel["dl.instructions.3"] = self.getLocaleString("dl.instructions.3");
        self.dialogModel["dl.instructions.4"] = self.getLocaleString("dl.instructions.4");
        self.dialogModel["dl.instructions.5"] = self.getLocaleString("dl.instructions.5");
        self.dialogModel["dl.instructions.6"] = self.getLocaleString("dl.instructions.6");
        self.dialogModel.close = self.getLocaleString("close");
    }
    async updateLanguage() {
        const self = this;
        self.updateModel();
    }
}

Download.prototype.CLASS = 'tc-ctl-download';
TC.control.Download = Download;
export default Download;
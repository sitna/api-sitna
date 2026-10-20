
import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import EventTarget from '../EventTarget.js';
import MapInfo from './MapInfo.js';
import filter from '../filter.js';
import Polygon from '../../SITNA/feature/Polygon.js';
import Observer from '../Observer.js';
import Controller from '../Controller.js';

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

    static {
        customElements.define('sitna-download', this);
    }

    #activeElement;

    constructor() {
        super(...arguments);

        this.model = new DownloadModel();
    }

    async loadTemplates() {
        const mainTemplatePromise = import(
            /* webpackChunkName: "tc-ctl-download" */
            /* webpackMode: "lazy" */
            '../templates/tc-ctl-download.mjs'
        );

        const template = {};
        template[this.CLASS] = (await mainTemplatePromise).default;
        this.template = template;
    }

    async render(callback) {
        await super.renderData.call(this, {
            controlId: this.getId(),
            deselectableTabs: this.options.deselectableTabs,
            clipboard: !!navigator?.clipboard?.write
        }, () => {
            const firstTab = this.querySelector(`.tc-ctl-tctr-select sitna-tab:first-of-type`);
            if (firstTab && firstTab.attributes["for"]) {
                this.#activeElement = document.getElementById(firstTab.attributes["for"].value);
            }

            this.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
            this.controller = new Controller(this.model, new Observer(this));
            this.updateModel();
        });
    }

    addUIEventListeners() {
        this.querySelectorAll(`.tc-ctl-tctr-select sitna-tab`).forEach((tab) => {
            tab.callback = () => {
                const target = tab.target;
                if (target) {
                    this.#activeElement = target;
                }
            };
        });
        this.querySelector('.' + this.CLASS + '-image select').addEventListener("change", (e) => {
            this.querySelector(".tc-ctl-clipboard-btn").disabled = !ClipboardItem.supports(e.target.value);
        });

        const closeDialog = (e) => e.currentTarget.closest('dialog').close();
        this.querySelectorAll(`dialog sitna-button.tc-modal-close`).forEach((btn) => {
            btn.addEventListener(Consts.event.CLICK, closeDialog);
        });
    }

    async register(map) {
        await super.register.call(this, map);

        // GLS: Añado el flag al mapa para tenerlo en cuenta cuando se establece la función de carga de imágenes
        this.map.crossOrigin = 'anonymous';

        this.addEventListener(Consts.event.CLICK, EventTarget.listenerBySelector('.tc-ctl-download-btn', () => this.#download()), { passive: true });
        this.addEventListener(Consts.event.CLICK, EventTarget.listenerBySelector('.tc-ctl-download-help', (evt) => this.#showHelp(evt)), { passive: true });
        this.addEventListener(Consts.event.CLICK, EventTarget.listenerBySelector('.tc-ctl-clipboard-btn', () => this.#copyImage()), { passive: true });

        this.addEventListener('change', EventTarget.listenerBySelector(`.${this.CLASS}-image-qr`, (e) => {
            if (e.target.checked) {
                this.generateLink();
            } else {
                this.querySelector('.' + this.CLASS + '-alert').classList.add(Consts.classes.HIDDEN);
            }
        }));

        this.addEventListener('click', EventTarget.listenerBySelector('h2', (_evt) => {
            if (!this.registeredListeners) {
                this.generateLink();
            }
            this.registerListeners();
        }));

        return this;
    }

    async #downLoadImage(format) {
        const li = this.map.getLoadingIndicator();
        const wait = li && li.addWait();

        const includeQR = !this.#activeElement.querySelector(`.${this.CLASS}-image-qr[disabled]`) &&
            this.#activeElement.querySelector(`.${this.CLASS}-image-qr[checked]`);
        const fileName = window.location.hostname + '_' + this.map.crs.replace(':', '') + '_' + Util.getFormattedDate(new Date().toString(), true);
        const fileExtension = '.' + format.split('/')[1];
        if (this.#activeElement.querySelector(`.${this.CLASS}-image-wld[checked]`) && !this.map.on3DView) {            
            const worldFileExtension = format === Consts.mimeType.JPEG ? '.jgw' : '.pgw';
            const blob = await this.generateImage(format, true, includeQR);
            const extent = this.map.getExtent();
            import('jszip').then(async (module) => {
                const JSZip = module.default;
                var canvases = this.map.wrap.getCanvas();
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
                }, (err) => {
                    TC.error(this.getLocaleString('dl.export.map.error') + ': ' + err.message);
                    li && li.removeWait(wait);
                });
            });

        }
        else {
            
            try {
                const dataURL = await this.generateImage(format, false, includeQR);
                Util.downloadDataURI(fileName + fileExtension, format, dataURL);
            } catch (e) {
                TC.error(this.getLocaleString('dl.export.map.error') + ': ' + e.message);
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

            var responses = responseArray
                .filter((item) => !!item)
                .filter((item) => item.service.layers.length > 0);
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
        const li = this.map.getLoadingIndicator();
        const wait = li && li.addWait();
        const format=this.#activeElement.querySelector('select').value;
        const includeQR = !this.#activeElement.querySelector(`.${this.CLASS}-image-qr[disabled]`) &&
            this.#activeElement.querySelector(`.${this.CLASS}-image-qr[checked]`);
        const blob = await this.generateImage(format, true, includeQR);
        const clipboardItemData = {
            [blob.type]: blob
        };
        const clipboardItem = new ClipboardItem(clipboardItemData);
        try {
            await navigator.clipboard.write([clipboardItem]);
            li && li.removeWait(wait);
            this.map.toast(this.getLocaleString('copiedClipboard'), { type: Consts.msgType.INFO });
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
        const alert = this.querySelector('.tc-alert-warning:not(.' + this.CLASS + '-alert)');
        var errorMsg;
        switch (error.key) {
            case Consts.WFSErrors.MAX_NUM_FEATURES:
                errorMsg = Util.formatTemplate(alert.querySelector("#zoom-msg-" + this.getId()).innerHTML, { serviceName: error.params.serviceTitle });
                break;
            case Consts.WFSErrors.NO_LAYERS:
                errorMsg = this.getLocaleString('noLayersLoaded');
                break;
            case Consts.WFSErrors.GETCAPABILITIES:
                errorMsg = Util.formatTemplate(alert.querySelector("#novalid-msg-" + this.getId()).innerHTML, { serviceName: error.params.serviceTitle });
                break;
            case Consts.WFSErrors.NO_FEATURES:
                errorMsg = alert.querySelector("#noFeatures-msg-" + this.getId()).innerHTML;
                break;
            case Consts.WFSErrors.INDETERMINATE:
                errorMsg = this.getLocaleString("wfs.IndeterminateError");
                this.map.toast(errorMsg, { type: Consts.msgType.ERROR });
                TC.error(Util.formatTemplate("Error:{error} \r\n Descripcion:{descripcion} \r\n Servicio:{serviceName}", { error: error.params.err, descripcion: error.params.errorThrown, serviceName: error.params.serviceTitle }), Consts.msgErrorMode.CONSOLE);
                return;
            case Consts.WFSErrors.NO_VALID_FORMAT:
                errorMsg = this.getLocaleString("wfs.NoValidFormat", { serviceTitle: error.params.serviceTitle, format: error.params.format.toUpperCase() });
                break;
            default:
                errorMsg = this.getLocaleString("wfs." + error.key, error.params);
                break;
        }
        this.map.toast(errorMsg, { type: Consts.msgType.WARNING });
    }
    
    #showHelp = function (evt) {
        evt.stopPropagation();
        this.querySelector(`dialog.${this.CLASS}-help-dialog`).showModal();
    }

    manageMaxLengthExceed(maxLengthExceed) {
        const alert = this.querySelector('.' + this.CLASS + '-alert');
        const checkboxQR = this.querySelector(`.${this.CLASS}-image-qr`);

        checkboxQR.disabled = maxLengthExceed.qr;

        if (checkboxQR.checked) {
            alert.classList.toggle(Consts.classes.HIDDEN, !maxLengthExceed.qr);
        } else {
            alert.classList.add(Consts.classes.HIDDEN);
        }
    }

    async generateLink() {
        const checkbox = this.querySelector(`.${this.CLASS}-div .${this.CLASS}-image-qr`);
        checkbox.disabled = true;
        checkbox.classList.add(Consts.classes.LOADING);
        const result = await super.generateLink.call(this);
        checkbox.classList.remove(Consts.classes.LOADING);
        return result;
    }

    updateModel() {
        for (const key of Object.keys(this.model)) {
            if (!key.startsWith("#")) {
                this.model[key] = this.getLocaleString(key);
            }
        }
    }
}

Download.prototype.CLASS = 'tc-ctl-download';
export default Download;
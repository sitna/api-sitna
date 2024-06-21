
import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import MapInfo from './MapInfo';
import filter from '../filter';
import Polygon from '../../SITNA/feature/Polygon';
import ScaleBar from './ScaleBar';

TC.control = TC.control || {};
TC.filter = filter;

const toFixed = function (number) {
    let result = number.toFixed(20);
    if (result.indexOf('.') >= 0) {
        result = result.replace(/0+$/, '').replace(/\.$/, '');
    }
    return result;
};

class Download extends MapInfo {
    #activeElement;

    constructor(options = {}) {
        super(...arguments);
        const self = this;

        self._dialogDiv = Util.getDiv(options.dialogDiv);
        if (!options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }
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
            deselectableTabs: self.options.deselectableTabs
        }, function () {
            const firstTab = self.div.querySelector(`.tc-ctl-tctr-select sitna-tab:first-of-type`);
            if (firstTab && firstTab.attributes["for"]) {
                self.#activeElement = document.getElementById(firstTab.attributes["for"].value);
            }

            self.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
        });
        self._dialogDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-dialog');
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
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);

        // GLS: Añado el flag al mapa para tenerlo en cuenta cuando se establece la función de carga de imágenes
        self.map.crossOrigin = 'anonymous';

        self.div.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('.tc-ctl-download-btn', () => self.#download()), { passive: true });
        self.div.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('.tc-ctl-download-help', () => self.#showHelp()), { passive: true });

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

    #downLoadImage(format) {
        const self = this;
        const li = self.map.getLoadingIndicator();
        const wait = li && li.addWait();
        const extent = self.map.getExtent();
        const doneQR = new Promise(function (resolve, _reject) {
            var canvases = self.map.wrap.getCanvas();
            var newCanvas = canvases.length > 1 ? Util.mergeCanvases(canvases) : canvases[0];

            var sb = self.map.getControlsByClass(ScaleBar);
            if (sb && !self.map.on3DView) {
                self.drawScaleBarIntoCanvas({ canvas: newCanvas, fill: true });
            }

            if (!self.#activeElement.querySelector(`.${self.CLASS}-image-qr:disabled`) &&
                self.#activeElement.querySelector(`.${self.CLASS}-image-qr:checked`)) {
                const codeContainerId = 'qrcode';
                var codeContainer = document.getElementById(codeContainerId);
                if (codeContainer) {
                    codeContainer.innerHTML = '';
                }
                else {
                    codeContainer = document.createElement('div');
                    codeContainer.setAttribute('id', codeContainerId);
                    document.body.appendChild(codeContainer);
                }

                codeContainer.style.top = '-200px';
                codeContainer.style.left = '-200px';
                codeContainer.style.position = 'absolute';

                self.makeQRCode(codeContainer, 87).then(function (qrCodeBase64) {
                    if (qrCodeBase64) {
                        var ctx = newCanvas.getContext("2d");
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(newCanvas.width - 91, newCanvas.height - 91, 91, 91);

                        Util.addToCanvas(newCanvas, qrCodeBase64, { x: newCanvas.width - 88, y: newCanvas.height - 88 }).then(function (mapCanvas) {
                            resolve(mapCanvas);
                        });
                    } else {
                        li && li.removeWait(wait);
                    }
                });
            } else {
                resolve(newCanvas);
            }
        });

        doneQR.then(function (_canvas) {
            const fileName = window.location.hostname + '_' + self.map.crs.replace(':', '') + '_' + Util.getFormattedDate(new Date().toString(), true);
            const fileExtension = '.' + format.split('/')[1];
            const worldFileExtension = format === Consts.mimeType.JPEG ? '.jgw' : '.pgw';
            if (self.#activeElement.querySelector(`.${self.CLASS}-image-wld:checked`) && !self.map.on3DView) {
                import('jszip').then(module => {
                    const JSZip = module.default;
                    const xScale = (extent[2] - extent[0]) / _canvas.width;
                    const ySkew = 0;
                    const xSkew = 0;
                    const yScale = (extent[1] - extent[3]) / _canvas.height;
                    const xOrigin = extent[0];
                    const yOrigin = extent[3];
                    const zip = new JSZip();
                    _canvas.toBlob(function (blob) {
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
                    }, format);
                });
            }
            else {
                try {
                    const res = _canvas.toDataURL(format);
                    Util.downloadDataURI(fileName + fileExtension, format, res);
                } catch (e) {
                    TC.error(self.getLocaleString('dl.export.map.error') + ': ' + e.message);
                }
                li && li.removeWait(wait);
            }
        });
    }

/*
 * Descarga las features de las capas de trabajo actualmente seleccionadas. Comprueba que el número de features a descargar
 * no excede el límite impuesto por el servidor.
 */

    #downloadFeatures(format) {
        const self = this;
        const li = self.map.getLoadingIndicator();
        const wait = li && li.addWait();

        const _filterBuilder = function () {
            if (self.map.on3DView) {
                return new filter.Within(null, new Polygon(self.map.view3D.getFovCoords(self.map.view3D.crs)), self.map.view3D.crs);
            }
            else {
                return new filter.bbox(self.map.getExtent(), self.map.getCRS());
            }
        }

        const arrPromises = self.map.extractFeatures({
            filter: _filterBuilder(),
            outputFormat: format,
            download: true
        });
        Promise.all(arrPromises).then(async function (responseArray) {

            var responses = responseArray.filter(item => !!item);
            if (responses.length === 0) {
                self.#showAlert({ key: Consts.WFSErrors.NO_LAYERS }, wait);
                return;
            }
            var arrDownloads = [];
            for (var i = 0; i < responses.length; i++) {
                //errores del WFS
                if (responses[i].errors && responses[i].errors.length) {
                    for (var j = 0; j < responses[i].errors.length; j++) {
                        var error = responses[i].errors[j];
                        self.#showAlert(error, wait);
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
                        plural: service.layers.length > 1 ? self.getLocaleString("dl.format.notSupported.plural") : "",
                        layerNames: service.layers.reduce(function (vi, va, i, array) {
                            return (vi instanceof Array ? vi : [vi]).concat([va.title]).join(i < array.length - 1 ? ", " : " " + self.getLocaleString("dl.format.notSupported.conjunction") + " ");
                        }, []),
                        serviceTitle: service.mapLayers[0].title,
                        format: format
                    };
                    self.map.toast(Util.formatTemplate(self.getLocaleString("dl.format.notSupported"), params), { type: Consts.msgType.ERROR });
                }
            }

            li && li.removeWait(wait);
        });
    }

    #download() {
        const self = this;
        let format = '';
        if (self.#activeElement) {
            format = self.#activeElement.querySelector('select').value;
        }
        if (format.indexOf('image') > -1) {
            self.#downLoadImage(format);
        }
        else {
            self.#downloadFeatures(format);
        }
    }

    #showAlert(error, wait) {
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
                self.map.getLoadingIndicator().removeWait(wait);
                return;
            default:
                errorMsg = self.getLocaleString("wfs." + error.key, error.params);
                break;
        }
        self.map.toast(errorMsg, { type: Consts.msgType.WARNING });

        self.map.getLoadingIndicator().removeWait(wait);
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
        const checkbox = self.div.querySelector(`.${self.CLASS}-div input.${self.CLASS}-image-qr`);
        const label = self.div.querySelector(`label.${self.CLASS}-image-qr-label`);
        checkbox.disabled = true;
        label.classList.add(Consts.classes.LOADING);
        const result = await super.generateLink.call(self);
        label.classList.remove(Consts.classes.LOADING);
        return result;
    }
}

Download.prototype.CLASS = 'tc-ctl-download';
TC.control.Download = Download;
export default Download;
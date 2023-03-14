
import TC from '../../TC';
import Consts from '../Consts';
import MapInfo from './MapInfo';
import filter from '../filter';

TC.control = TC.control || {};
TC.control.MapInfo = MapInfo;
TC.filter = filter;

TC.control.Download = function (options) {
    var self = this;
    self._classSelector = '.' + self.CLASS;

    TC.Control.apply(self, arguments);

    self._hiddenElms = [];

    var opts = options || {};
    self._dialogDiv = TC.Util.getDiv(opts.dialogDiv);
    if (window.$) {
        self._$dialogDiv = $(self._dialogDiv);
    }
    if (!opts.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
    }    
};

TC.inherit(TC.control.Download, TC.control.MapInfo);

(function () {
    var ctlProto = TC.control.Download.prototype;

    ctlProto.CLASS = 'tc-ctl-download';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-download.hbs";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-download-dialog.hbs";

    ctlProto.render = function (callback) {
        const self = this;
        return self._set1stRenderPromise(self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;
        }).then(function () {
            return TC.Control.prototype.renderData.call(self, {
                controlId: self.id,
                deselectableTabs: self.options.deselectableTabs
            }, function () {
                const cs = 'tctr';                
                self.div.querySelectorAll(`.tc-ctl-${cs}-select sitna-tab`).forEach(function (tab) {
                    tab.callback = function () {
                        const target = this.target;
                        if (target) {
                            self._activeElm = target;
                        }
                    };
                });
                const firstTab = self.div.querySelector(`.tc-ctl-${cs}-select sitna-tab:first-of-type`);
                if (firstTab && firstTab.attributes["for"]) {
                    self._activeElm = document.getElementById(firstTab.attributes["for"].value);
                }

                if (TC.Util.isFunction(callback)) {
                    callback();
                }
            });
        }));
    };

    const toFixed = function (number) {
        let result = number.toFixed(20);
        if (result.indexOf('.') >= 0) {
            result = result.replace(/0+$/, '').replace(/\.$/, '');
        }
        return result;
    };

    ctlProto.register = function (map) {
        var self = this;
        const result = TC.control.MapInfo.prototype.register.call(self, map);

        // GLS: Añado el flag al mapa para tenerlo en cuenta cuando se establece la función de carga de imágenes
        self.map.crossOrigin = 'anonymous';

        const downLoadImage = function (format) {
            const li = self.map.getLoadingIndicator();
            const wait = li && li.addWait();
            const extent = self.map.getExtent();
            const doneQR = new Promise(function (resolve, _reject) {
                var canvases = self.map.wrap.getCanvas();
                var newCanvas = TC.Util.mergeCanvases(canvases);

                var sb = self.map.getControlsByClass(TC.control.ScaleBar);
                if (sb) {
                    self.drawScaleBarIntoCanvas({ canvas: newCanvas, fill: true });
                }

                if (!self._activeElm.querySelector(`.${self.CLASS}-image-qr:disabled`) &&
                    self._activeElm.querySelector(`.${self.CLASS}-image-qr:checked`)) {
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

                            TC.Util.addToCanvas(newCanvas, qrCodeBase64, { x: newCanvas.width - 88, y: newCanvas.height - 88 }).then(function (mapCanvas) {
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
                const fileName = window.location.hostname + '_' + self.map.crs.replace(':', '') + '_' + TC.Util.getFormattedDate(new Date().toString(), true);
                const fileExtension = '.' + format.split('/')[1];
                const worldFileExtension = format === Consts.mimeType.JPEG ? '.jgw' : '.pgw';
                if (self._activeElm.querySelector(`.${self.CLASS}-image-wld:checked`)) {
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
                                TC.Util.downloadBlob(fileName + ".zip", blob);
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
                        TC.Util.downloadDataURI(fileName + fileExtension, format, res);
                    } catch (e) {
                        TC.error(self.getLocaleString('dl.export.map.error') + ': ' + e.message);
                    }
                    li && li.removeWait(wait);
                }
            });
        };


        /*
         * Descarga las features de las capas de trabajo actualmente seleccionadas. Comprueba que el número de features a descargar
         * no excede el límite impuesto por el servidor.
         */

        const downloadFeatures = function (format) {
            const li = self.map.getLoadingIndicator();
            const wait = li && li.addWait();

            const arrPromises = self.map.extractFeatures({
                filter: TC.filter.bbox(self.map.getExtent(), self.map.getCRS()),
                outputFormat: format,
                download: true
            });
            Promise.all(arrPromises).then(async function (responseArray) {

                var responses = responseArray.filter(item => !!item);
                if (responses.length === 0) {
                    _showAlertMsg({ key: Consts.WFSErrors.NO_LAYERS }, wait);
                    return;
                }
                var arrDownloads = [];
                for (var i = 0; i < responses.length; i++) {
                    //errores del WFS
                    if (responses[i].errors && responses[i].errors.length) {
                        for (var j = 0; j < responses[i].errors.length; j++) {
                            var error = responses[i].errors[j];
                            _showAlertMsg(error, wait);
                        }
                        continue;
                    }
                    var data = responses[i].data;
                    var url = responses[i].url;
                    if (data && url)
                        arrDownloads.push({ url: url + "?download=zip", data: data });
                }
                try {
                    await TC.Util.downloadFileForm(arrDownloads);
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
                        self.map.toast(self.getLocaleString("dl.format.notSupported").format(params), { type: Consts.msgType.ERROR });
                    }
                }

                li && li.removeWait(wait);
            });
        };

        var _download = function () {
            var format = '';
            if (self._activeElm) {
                format = self._activeElm.querySelector('select').value;
            }
            if (format.indexOf('image') > -1) {
                downLoadImage(format);
            }
            else {
                downloadFeatures(format);
            }
        };

        var _showAlertMsg = function (error, wait) {
            const alert = self.div.querySelector('.tc-alert-warning:not(.' + self.CLASS + '-alert)');
            var errorMsg;
            switch (error.key) {
                case Consts.WFSErrors.MAX_NUM_FEATURES:
                    errorMsg = alert.querySelector("#zoom-msg-" + self.id).innerHTML.format({ serviceName: error.params.serviceTitle });
                    break;
                case Consts.WFSErrors.NO_LAYERS:
                    errorMsg = self.getLocaleString('noLayersLoaded');
                    break;
                case Consts.WFSErrors.GETCAPABILITIES:
                    errorMsg = alert.querySelector("#novalid-msg-" + self.id).innerHTML.format({ serviceName: error.params.serviceTitle });
                    break;
                case Consts.WFSErrors.NO_FEATURES:
                    errorMsg = alert.querySelector("#noFeatures-msg-" + self.id).innerHTML;
                    break;
                case Consts.WFSErrors.INDETERMINATE:
                    errorMsg = self.getLocaleString("wfs.IndeterminateError");
                    self.map.toast(errorMsg, { type: Consts.msgType.ERROR });
                    TC.error("Error:{error} \r\n Descripcion:{descripcion} \r\n Servicio:{serviceName}".format({ error: error.params.err, descripcion: error.params.errorThrown, serviceName: error.params.serviceTitle }), Consts.msgErrorMode.CONSOLE);
                    self.map.getLoadingIndicator().removeWait(wait);
                    return;
                default:
                    errorMsg = self.getLocaleString("wfs." + error.key, error.params);
                    break;
            }
            self.map.toast(errorMsg, { type: Consts.msgType.WARNING });

            self.map.getLoadingIndicator().removeWait(wait);
        };

        var _showHelp = function (evt) {
            evt.stopPropagation();
            TC.Util.showModal(self._dialogDiv.querySelector(self._classSelector + '-help-dialog'));
        };

        self.div.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('.tc-ctl-download-btn', _download), { passive: true });
        self.div.addEventListener(Consts.event.CLICK, TC.EventTarget.listenerBySelector('.tc-ctl-download-help', _showHelp), { passive: true });

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

        return result;
    };

    ctlProto.manageMaxLengthExceed = function (maxLengthExceed) {
        const self = this;
        const alert = self.div.querySelector('.' + self.CLASS + '-alert');
        const checkboxQR = self.div.querySelector(`.${self.CLASS}-image-qr`);

        checkboxQR.disabled = maxLengthExceed.qr;

        if (checkboxQR.checked) {
            alert.classList.toggle(Consts.classes.HIDDEN, !maxLengthExceed.qr);
        } else {
            alert.classList.add(Consts.classes.HIDDEN);
        }
    };

    ctlProto.generateLink = async function () {
        const self = this;
        const checkbox = self.div.querySelector(`.${self.CLASS}-div input.${self.CLASS}-image-qr`);
        const label = self.div.querySelector(`label.${self.CLASS}-image-qr-label`);
        checkbox.disabled = true;
        label.classList.add(Consts.classes.LOADING);
        const result = await TC.control.MapInfo.prototype.generateLink.call(self);
        label.classList.remove(Consts.classes.LOADING);
        return result;
    };

})();

const Download = TC.control.Download;
export default Download;
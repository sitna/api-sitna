TC.control = TC.control || {};

if (!TC.control.MapInfo) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/MapInfo');
}

if (!TC.filter) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Filter');
}

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

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Download.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/DownloadDialog.html";
    } else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "download" }).w(" </h2><div class=\"tc-ctl-tctr tc-ctl-tctr-select\"><form><label class=\"tc-ctl-tctr-tab tc-ctl-download-image\" style=\"width:calc(100%/2 - 1px)\"><input type=\"radio\" name=\"sctnr-sel\" value=\"image\" /><span>").h("i18n", ctx, {}, { "$key": "dl.export.map" }).w("</span></label><label class=\"tc-ctl-tctr-tab tc-ctl-download-data\" style=\"width:calc(100%/2 - 1px)\"><input type=\"radio\" name=\"sctnr-sel\" value=\"data\" /><span>").h("i18n", ctx, {}, { "$key": "dl.export.vector" }).w("</span></label></form></div><div class=\"tc-ctl tc-ctl-tctr-elm tc-ctl-tctr-elm-image tc-group tc-ctl-download-cnt tc-ctl-download-image tc-collapsed\"><div><label>").h("i18n", ctx, {}, { "$key": "format" }).w(":</label><select id=\"download-format-image\" class=\"tc-combo\"><option value=\"image/png\">PNG</option><option value=\"image/jpeg\">JPEG</option></select><div class=\"tc-ctl-download-div\"><input id=\"tc-ctl-download-image-qr\" class=\"tc-hidden\" type=\"checkbox\" checked style=\"display:none;\" /><label for=\"tc-ctl-download-image-qr\" class=\"tc-ctl-download-image-qr-label\" title=\"").h("i18n", ctx, {}, { "$key": "createQrCodeToImage" }).w("\">").h("i18n", ctx, {}, { "$key": "appendQRCode" }).w("</label></div><div class=\"tc-group tc-group tc-ctl-download-cnt\" style=\"text-align:right;\"><button type=\"button\" class=\"tc-ctl-download-btn tc-button tc-icon-button\" title=\"").h("i18n", ctx, {}, { "$key": "downloadImageFromCurrentMap" }).w("\" name=\"descargar\">").h("i18n", ctx, {}, { "$key": "download" }).w("</button></div><div class=\"tc-ctl-download-alert tc-alert alert-warning tc-hidden\"><p>").h("i18n", ctx, {}, { "$key": "qrAdvice|s" }).w("</p></div></div></div><div class=\"tc-ctl tc-ctl-tctr-elm tc-ctl-tctr-elm-data tc-group tc-ctl-download-cnt tc-collapsed\"><div><label>").h("i18n", ctx, {}, { "$key": "format" }).w(":</label><select id=\"download-format\" class=\"tc-combo\"><option value=\"GML32\">GML</option><option value=\"application/json\">GeoJSON</option><option value=\"application/vnd.google-earth.kml+xml\">KML (Google Earth)</option><option value=\"shape-zip\">Shape (ESRI)</option></select><div class=\"tc-ctl-download-div\"><i class=\"tc-ctl-download-help icon-question-sign\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "showDownloadHelp" }).w("\"></i></div><div class=\"tc-group tc-group tc-ctl-download-cnt\" style=\"text-align:right;\"><button type=\"button\" class=\"tc-ctl-download-btn tc-button tc-icon-button\" title=\"").h("i18n", ctx, {}, { "$key": "downloadLayersFromCurrentExtent" }).w("\" name=\"descargar\">").h("i18n", ctx, {}, { "$key": "download" }).w("</button></div><div class=\"tc-alert alert-warning tc-hidden\"><p id=\"zoom-msg\"><strong>").h("i18n", ctx, {}, { "$key": "tooManyFeatures" }).w(": </strong>").h("i18n", ctx, {}, { "$key": "tooManyFeatures.instructions" }).w("</p><p id=\"layers-msg\"><strong>").h("i18n", ctx, {}, { "$key": "noLayersLoaded" }).w(": </strong>").h("i18n", ctx, {}, { "$key": "noLayersLoaded.instructions" }).w("</p><p id=\"url-msg\"><strong>").h("i18n", ctx, {}, { "$key": "tooManySelectedLayers" }).w(": </strong>").h("i18n", ctx, {}, { "$key": "tooManySelectedLayers.instructions" }).w("</p><p id=\"noFeatures-msg\"><strong>").h("i18n", ctx, {}, { "$key": "noData" }).w(": </strong>").h("i18n", ctx, {}, { "$key": "noData.instructions" }).w("</p><p id=\"novalid-msg\"><strong>").h("i18n", ctx, {}, { "$key": "noValidService" }).w(": </strong>").h("i18n", ctx, {}, { "$key": "noValidService.instructions" }).w("</p></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-download-help-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "downloadData" }).w("</h3><div class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p>").h("i18n", ctx, {}, { "$key": "dl.instructions.1|s" }).w("</p><ul><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.2|s" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.3|s" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.4|s" }).w("<ul><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.5|s" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.6|s" }).w("</li></ul></li></ul></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.render = function (callback) {
        const self = this;
        return self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;
        }).then(function () {
            return TC.Control.prototype.render.call(self, function () {

                const cs = '.tc-ctl-tctr';
                self._selectors = {
                    TAB: cs + '-tab',
                    RADIOBUTTON: 'input[type=radio][name=sctnr-sel]',
                    ELEMENT: cs + '-elm'
                };

                const clickHandler = function (e) {
                    var tab = this;
                    while (tab && !tab.matches(self._selectors.TAB)) {
                        tab = tab.parentElement;
                    }
                    if (tab) {
                        const checkbox = tab.querySelector(self._selectors.RADIOBUTTON);
                        const newValue = checkbox.value;
                        const elms = self.div.querySelectorAll(self._selectors.ELEMENT);
                        if (self._oldValue === newValue && self.options.deselectable) {
                            setTimeout(function () {
                                checkbox.checked = false;
                            }, 0);
                            self._oldValue = null;
                            self._activeElm = null;
                            elms.forEach(function (elm) {
                                self._hiddenElms.push(elm);
                            });
                        }
                        else {
                            elms.forEach(function (elm) {
                                if (elm.matches(self._selectors.ELEMENT + '-' + newValue)) {
                                    self._activeElm = elm;
                                }
                                else {
                                    self._hiddenElms.push(elm);
                                }
                            });
                            self._oldValue = newValue;
                        }

                        self._hiddenElms.forEach(function (elm) {
                            elm.classList.add(TC.Consts.classes.COLLAPSED);
                        });
                        if (self._activeElm) {
                            self._activeElm.classList.remove(TC.Consts.classes.COLLAPSED);
                        }
                        checkbox.checked = true;
                    }
                };

                self.div.querySelectorAll('span').forEach(function (span) {
                    span.addEventListener(TC.Consts.event.CLICK, clickHandler);
                });
                if (callback) {
                    callback();
                }
            });
        });
    };

    ctlProto.register = function (map) {
        var self = this;
        const result = TC.control.MapInfo.prototype.register.call(self, map);

        // GLS: Añado el flag al mapa para tenerlo en cuenta cuando se establece la función de carga de imágenes
        self.map.mustBeExportable = true;

        /**
         * Descarga las features de las capas de trabajo actualmente seleccionadas. Comprueba que el número de features a descargar
         * no excede el límite impuesto por el servidor.
         */       

        var _download = function () {
            var wait = self.map.getLoadingIndicator().addWait();

            var format = '';
            if (self._activeElm) {
                format = self._activeElm.querySelector('select').value;
            }
            if (format.indexOf('image') > -1) {
                const doneQR = new Promise(function (resolve, reject) {
                    var canvas = self.map.wrap.getViewport({ synchronous: true }).getElementsByTagName('canvas')[0];
                    var newCanvas = TC.Util.cloneCanvas(canvas);

                    var sb = self.map.getControlsByClass(TC.control.ScaleBar);
                    if (sb) {
                        self.drawScaleBarIntoCanvas({ canvas: newCanvas, fill: true });
                    }

                    if (self._activeElm.querySelector('#' + self.CLASS + '-image-qr:checked')) {
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

                        self.makeQRCode(codeContainer, 87, 87).then(function (qrCodeBase64) {
                            if (qrCodeBase64) {
                                var ctx = newCanvas.getContext("2d");
                                ctx.fillStyle = "#ffffff";
                                ctx.fillRect(newCanvas.width - 91, newCanvas.height - 91, 91, 91);

                                TC.Util.addToCanvas(newCanvas, qrCodeBase64, { x: newCanvas.width - 88, y: newCanvas.height - 88 }).then(function (mapCanvas) {
                                    resolve(mapCanvas);
                                });
                            } else {
                                TC.error(self.getLocaleString('dl.export.map.error') + ': ' + 'QR');
                                self.map.getLoadingIndicator().removeWait(wait);
                            }
                        });
                    } else {
                        resolve(newCanvas);
                    }
                });

                doneQR.then(function (_canvas) {
                    try {
                        const res = _canvas.toDataURL(format);
                        TC.Util.downloadDataURI(window.location.hostname + '_' + TC.Util.getFormattedDate(new Date().toString(), true) + '.' + format.split('/')[1], format, res);
                    } catch (e) {
                        TC.error(self.getLocaleString('dl.export.map.error') + ': ' + e.message);
                    }

                    self.map.getLoadingIndicator().removeWait(wait);
                });
            }
            else {
                var extent = self.map.getExtent();
                
                var arrPromises = TC.WFSGetFeatureBuilder(self.map, new TC.filter.bbox(extent, self.map.getCRS()), format, true);
                Promise.all(arrPromises).then(function (responseArray) {

                    var responses = responseArray.filter(function (item) { return item != null });
                    if (responses.length === 0) {
                        _showAlertMsg({ key: TC.Consts.WFSErrors.NoLayers }, wait);
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

                    TC.Util.downloadFileForm(arrDownloads);
                    self.map.getLoadingIndicator().removeWait(wait);
                });
            }
        };

        /**
         * Comprueba si hay capas visibles en el panel de capas cargadas.
         */
        var _getVisibleLayers = function () {
            var visibleLayers = [];
            for (var i = 0; i < self.map.workLayers.length; i++) {
                var layer = self.map.workLayers[i];
                if (layer.type === TC.Consts.layerType.WMS) {
                    if (layer.getVisibility() && layer.names.length > 0) {
                        visibleLayers.push(layer);
                    }
                }
            }
            return visibleLayers;
        };

        var _showAlertMsg = function (error, wait) {
            const alert = self.div.querySelector('.alert-warning:not(.' + self.CLASS + '-alert)');
            var errorMsg;
            switch (error.key) {
                case TC.Consts.WFSErrors.NumMaxFeatures:
                    errorMsg = alert.querySelector("#zoom-msg").innerHTML.format({ serviceName: error.params.serviceTitle });
                    break;
                case TC.Consts.WFSErrors.NoLayers:
                    errorMsg = self.getLocaleString('noLayersLoaded');
                    break;
                case TC.Consts.WFSErrors.GetCapabilities:
                    errorMsg = alert.querySelector("#novalid-msg").innerHTML.format({ serviceName: error.params.serviceTitle });
                    break;
                case TC.Consts.WFSErrors.NoFeatures:
                    errorMsg = alert.querySelector("#noFeatures-msg").innerHTML;
                    break;
                case TC.Consts.WFSErrors.Indeterminate:
                    errorMsg = self.getLocaleString("wfs.IndeterminateError");
                    self.map.toast(errorMsg, { type: TC.Consts.msgType.ERROR });
                    TC.error("Error:{error} \r\n Descripcion:{descripcion} \r\n Servicio:{serviceName}".format({ error: error.params.err, descripcion: error.params.errorThrown, serviceName: error.params.serviceTitle }), TC.Consts.msgErrorMode.CONSOLE);
                    self.map.getLoadingIndicator().removeWait(wait);
                    return
                    break;
                default:
                    errorMsg = self.getLocaleString("wfs." + error.key, error.params);
                    break;
            }
            self.map.toast(errorMsg, { type: TC.Consts.msgType.WARNING });

            self.map.getLoadingIndicator().removeWait(wait);
        };

        var _showHelp = function (evt) {
            evt.stopPropagation();
            TC.Util.showModal(self._dialogDiv.querySelector(self._classSelector + '-help-dialog'));
        };

        self.div.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector('.tc-ctl-download-btn', _download));
        self.div.addEventListener(TC.Consts.event.CLICK, TC.EventTarget.listenerBySelector('.tc-ctl-download-help', _showHelp));

        self.div.addEventListener('change', TC.EventTarget.listenerBySelector("#" + self.CLASS + "-image-qr", function (e) {
            if (e.target.checked) {
                self.generateLink();
            } else {
                self.div.querySelector('.' + self.CLASS + '-alert').classList.add(TC.Consts.classes.HIDDEN);
            }
        }));

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('h2', function (evt) {            
            self.generateLink();
            self.registerListeners();
        }));

        return result;
    };

    ctlProto.manageMaxLengthExceed = function (maxLengthExceed) {
        const self = this;
        const alert = self.div.querySelector('.' + self.CLASS + '-alert');
        if (document.getElementById(self.CLASS + '-image-qr').checked) {
            alert.classList.toggle(TC.Consts.classes.HIDDEN, !maxLengthExceed.qr);
        } else {
            alert.classList.add(TC.Consts.classes.HIDDEN);
        }
    };

})();

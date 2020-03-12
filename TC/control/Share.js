TC.control = TC.control || {};

if (!TC.control.MapInfo) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/MapInfo');
}

TC.control.Share = function (options) {
    var self = this;
    self._classSelector = '.' + self.CLASS;

    TC.Control.apply(self, arguments);

    self.exportsState = true;

    var opts = options || {};
    self._dialogDiv = TC.Util.getDiv(opts.dialogDiv);
    if (window.$) {
        self._$dialogDiv = $(self._dialogDiv);
    }
    if (!opts.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
    }

    self.render();
};

TC.inherit(TC.control.Share, TC.control.MapInfo);

(function () {
    var ctlProto = TC.control.Share.prototype;

    ctlProto.CLASS = 'tc-ctl-share';
    ctlProto.MAILTO_MAX_LENGTH = 256;
    ctlProto.IFRAME_WIDTH = '600px';
    ctlProto.IFRAME_HEIGHT = '450px';
    ctlProto.FEATURE_PARAM = 'showfeature';

    ctlProto.MOBILEFAV = 'Siga las instrucciones del navegador del dispositivo móvil para añadir como favorito. Se guardará el estado actual del mapa.';
    ctlProto.NAVALERT = ' +D para guardar en marcadores.';


    ctlProto.render = function (callback) {
        const self = this;
        return self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;
        }).then(function () {
            return TC.Control.prototype.render.call(self, function () {
                //Si el navegador no soporta copiar al portapapeles, ocultamos el botón de copiar
                if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                    self.div.querySelectorAll('button').forEach(function (btn) {
                        btn.classList.remove('hide');
                    });
                    self.div.querySelectorAll('input[type=text]').forEach(function (input) {
                        delete input.dataset.dataOriginalTitle;
                    });
                }

                // Si el SO no es móvil, ocultamos el botón de compartir a WhatsApp
                if (!TC.Util.detectMobile()) {
                    self.div.querySelector(".share-whatsapp").classList.add(TC.Consts.classes.HIDDEN);
                }

                const options = self.div.querySelectorAll('.' + self.CLASS + '-url-box');
                self.div.querySelectorAll('span:not(.tc-beta)').forEach(function (span) {
                    span.addEventListener(TC.Consts.event.CLICK, function (e) {
                        var label = this;
                        while (label && label.tagName !== 'LABEL') {
                            label = label.parentElement;
                        }
                        const newFormat = label.querySelector('input[type=radio][name=format]').value;

                        options.forEach(function (option) {
                            option.classList.toggle(TC.Consts.classes.HIDDEN, !option.matches('.tc-' + newFormat));
                        });
                    });
                });
                if (TC.Util.isFunction(callback)) {
                    callback();
                }
            });
        });
    };

    /**
     * Obtiene una URL "limpia" para compartir el mapa.
     */
    ctlProto.getLocation = function () {
        var result = window.location.href;
        if (window.location.hash) {
            result = result.substr(0, result.indexOf(window.location.hash));
        }
        return result;
    };

    ctlProto.manageMaxLengthExceed = function (maxLengthExceed) {
        const self = this;

        const browserAlert = self.div.querySelector('.' + self.CLASS + '-alert');
        //Si la URL sobrepasa el tamaño máximo avisamos que puede fallar en Edge
        browserAlert.classList.toggle(TC.Consts.classes.HIDDEN, !maxLengthExceed.browser);

        const qrAlert = self._dialogDiv.querySelector('.' + self.CLASS + '-qr-alert');
        qrAlert.classList.toggle(TC.Consts.classes.HIDDEN, !maxLengthExceed.qr);
    };

    ctlProto.generateIframe = function (url) {
        var self = this;
        var urlString = url || this.generateLink();
        if (urlString) {
            return '<iframe style="width:' + self.IFRAME_WIDTH + ';height:' + self.IFRAME_HEIGHT + ';" src="' + urlString + '"></iframe>';
        }
    }

    ctlProto.loadParamFeature = function () {
        const self = this;
        var result = null;
        var featureToShow = TC.Util.getParameterByName(self.FEATURE_PARAM);
        if (featureToShow) {
            var featureObj;
            try {
                featureObj = JSON.parse(decodeURIComponent(escape(window.atob(featureToShow))));
            }
            catch (error) {
                TC.error(self.getLocaleString('sharedFeatureNotValid'), TC.Consts.msgErrorMode.TOAST);
            }
            if (featureObj && self.map) {
                if (featureObj.geom) {
                    self.map.addLayer({
                        id: self.getUID(),
                        type: TC.Consts.layerType.VECTOR,
                        title: self.getLocaleString('foi'),
                        owner: self,
                        stealth: true
                    }).then(function (layer) {
                        self.paramFeatureLayer = layer;
                        layer.importState({ features: [featureObj] }).then(function () {
                            self.map.zoomToFeatures(layer.features);
                        });
                    });
                }
                else {
                    result = featureObj;
                }
            }
        }
        return result;
    };

    ctlProto.register = function (map) {
        const self = this;

        const result = TC.control.MapInfo.prototype.register.call(self, map);

        self.exportsState = true;

        self.MOBILEFAV = self.getLocaleString('mobileBookmarks.instructions');
        self.NAVALERT = self.getLocaleString('bookmarks.instructions');

        var selectInputField = function (elm) {
            const input = elm.parentElement.querySelector("input[type=text]");
            input.value = input.classList.contains('tc-url') ? self.generateLink() : self.generateIframe();
            input.select();
        };

        var unselectInputField = function () {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(document.createRange());
        };

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('h2', function (evt) {
            const link = self.generateLink();
            self.registerListeners();
            self.div.querySelector('.tc-url input[type=text]').value = link;
            self.div.querySelector('.tc-iframe input[type=text]').value = self.generateIframe(link);
        }));

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('.tc-ctl-share-url-box button', function (evt) {
            const copyBtn = evt.target;
            selectInputField(copyBtn);
            document.execCommand('copy');

            copyBtn.textContent = self.getLocaleString('copied');


            setTimeout(function () {
                copyBtn.textContent = self.getLocaleString('copy');
                unselectInputField();
            }, 1000);

        }));

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('input[type=text]', function (evt) {
            selectInputField(evt.target);
        }));

        //Deshabilitar el click de ratón en los enlaces de compartir cuando están deshabilitados
        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('.ga-share-icon.disabled', function (evt) {
            evt.stopImmediatePropagation();
            evt.preventDefault();
            return false;
        }));

        //Enviar por e-mail
        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('a.share-email', function (evt) {
            evt.preventDefault();
            var url = self.generateLink();

            if (url) {
                const body = encodeURIComponent(url + "\n");
                if (body.length > self.MAILTO_MAX_LENGTH) {
                    map.toast(self.getLocaleString('urlTooLongForMailto'), { type: TC.Consts.msgType.WARNING });
                }
                window.location.href = 'mailto:?body=' + body;
            }
        }));

        //Generar código QR        
        self.div.addEventListener("click", TC.EventTarget.listenerBySelector("a.qr-generator", function (evt) {
            evt.preventDefault();
            const qrContainer = self._dialogDiv.querySelector(".qrcode");
            qrContainer.innerHTML = '';

            if (self._dialogDiv.querySelector('.' + self.CLASS + '-qr-alert').classList.contains(TC.Consts.classes.HIDDEN)) {                
                self.makeQRCode(qrContainer, 256, 256).then(function (qrCodeBase64) {
                    if (qrCodeBase64) {
                        TC.Util.showModal(self._dialogDiv.querySelector(self._classSelector + '-qr-dialog'));
                    }
                });
            } else {
                TC.Util.showModal(self._dialogDiv.querySelector(self._classSelector + '-qr-dialog'));
            }
        }));

        
        const openSocialMedia = function (win, url, process) {
            if (url && url.trim().length > 0) {
                win.location.href = process(url);
            } else {
                TC.error(self.getLocaleString('urlTooLongForShortener'));
                win.close();
            }
        };

        //Compartir en Facebook
        self.div.addEventListener("click", TC.EventTarget.listenerBySelector("a.share-fb", function (evt) {
            evt.preventDefault();

            const w = window.open();
            self.shortenedLink().then(function (url) {
                openSocialMedia(w, url, function (url) {
                    return "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url)
                });
            });

            return false;
        }));

        //Compartir en Twitter
        self.div.addEventListener("click", TC.EventTarget.listenerBySelector("a.share-twitter", function (evt) {
            evt.preventDefault();

            const w = window.open();
            self.shortenedLink().then(function (url) {
                openSocialMedia(w, url, function (url) {
                    var titulo = encodeURIComponent(window.document.title ? window.document.title : "Visor API SITNA");
                    return "https://twitter.com/intent/tweet?text=" + titulo + "&amp;url=" + encodeURIComponent(url);
                });
            });

            return false;
        }));

        //Compartir en Whatsapp
        if (TC.Util.detectMobile()) {
            self.div.addEventListener("click", TC.EventTarget.listenerBySelector("a.share-whatsapp", function (evt) {
                evt.preventDefault();

                self.shortenedLink().then(function (url) {
                    var waText = 'whatsapp://send?text=';
                    if (url !== undefined) {
                        location.href = waText + encodeURIComponent(url);
                    } else {
                        location.href = waText + encodeURIComponent(self.generateLink());
                    }
                });

                return false;
            }));
        }

        //Guardar en marcadores
        self.div.addEventListener("click", TC.EventTarget.listenerBySelector("a.share-star", function (evt) {
            evt.preventDefault();

            var bookmarkURL = self.generateLink();
            var bookmarkTitle = document.title;

            if (TC.Util.detectMobile()) {
                // Mobile browsers
                alert(ctlProto.MOBILEFAV);
            } else if (window.sidebar && window.sidebar.addPanel) {
                // Firefox version < 23
                window.sidebar.addPanel(bookmarkTitle, bookmarkURL, '');
            } else if ((window.sidebar && /Firefox/i.test(navigator.userAgent)) || (window.opera && window.print)) {
                // Firefox version >= 23 and Opera Hotlist                

                window.location.href = bookmarkURL;
                alert((/Mac/i.test(navigator.userAgent) ? 'Cmd' : 'Ctrl') + ctlProto.NAVALERT);

            } else if (window.external && ('AddFavorite' in window.external)) {
                // IE Favorite
                window.external.AddFavorite(bookmarkURL, bookmarkTitle);
            } else {
                // Other browsers (mainly WebKit - Chrome/Safari)                
                window.location.href = bookmarkURL;
                alert((/Mac/i.test(navigator.userAgent) ? 'Cmd' : 'Ctrl') + ctlProto.NAVALERT);
            }

            return false;
        }));

        //Cuando se añada o borre una capa, comprobamos de nuevo si la URL cumple los requisitos de longitud para habilitar el control
        //map.on(TC.Consts.event.MAPLOAD, function () {
        //    map.on(TC.Consts.event.LAYERREMOVE + ' ' + TC.Consts.event.LAYERADD, function (e) {
        //        self.generateLink();
        //    });
        //});        

        return result;
    };

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Share.html";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/ShareDialog.html";

})();
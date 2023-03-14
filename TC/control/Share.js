import TC from '../../TC';
import Util from '../Util';
import Consts from '../Consts';
import MapInfo from './MapInfo';

TC.control = TC.control || {};

class Share extends MapInfo {
    MAILTO_MAX_LENGTH = 256;
    IFRAME_WIDTH = '600px';
    IFRAME_HEIGHT = '450px';
    FEATURE_PARAM = 'showfeature';
    MOBILEFAV;
    NAVALERT;
    #dialogDiv;

    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.add(self.CLASS);

        self.template = {};
        self.template[self.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-share.hbs";
        self.template[self.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-share-dialog.hbs";

        self.#dialogDiv = Util.getDiv(self.options.dialogDiv);
        if (!self.options.dialogDiv) {
            document.body.appendChild(self.#dialogDiv);
        }
    }

    getClassName() {
        return 'tc-ctl-share';
    }

    async register(map) {
        const self = this;

        await super.register.call(self, map);
        self.exportsState = true;

        self.MOBILEFAV = self.getLocaleString('mobileBookmarks.instructions');
        self.NAVALERT = self.getLocaleString('bookmarks.instructions');

        self.map.on(Consts.event.MAPCHANGE, function (_e) {
            const self = this;
            const input = self.div.querySelector('.tc-url input[type=text]');
            if (input) {
                input.dataset.update = true;
            }

            delete self.map._controlStatesCache;
        }.bind(self));

        //Cuando se añada o borre una capa, comprobamos de nuevo si la URL cumple los requisitos de longitud para habilitar el control
        //map.on(Consts.event.MAPLOAD, function () {
        //    map.on(Consts.event.LAYERREMOVE + ' ' + Consts.event.LAYERADD, function (e) {
        //        self.generateLink();
        //    });
        //});     

        map.loaded(() => {
            if (!self.div.classList.contains(Consts.classes.COLLAPSED)) {
                self.update();
            }
        });

        return self;
    }

    async render(callback) {
        const self = this;
        self.#dialogDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-dialog', null);
        return await self._set1stRenderPromise(super.renderData.call(self, { controlId: self.id }, function () {
            //Si el navegador no soporta copiar al portapapeles, ocultamos el botón de copiar
            if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                self.div.querySelectorAll('button').forEach(function (btn) {
                    btn.classList.remove('hide');
                });
                self.div.querySelectorAll('input[type=text]').forEach(function (input) {
                    delete input.dataset.dataOriginalTitle;
                });
            }

            self.div.querySelector('h2').addEventListener('click', function (_e) {
                self.update();
            });

            // Si el SO no es móvil, ocultamos el botón de compartir a WhatsApp
            if (!Util.detectMobile()) {
                self.div.querySelector(`sitna-button.${self.CLASS}-btn-whatsapp`).classList.add(Consts.classes.HIDDEN);
            }

            self.div.querySelector(`.${self.CLASS}-url-box button.${self.CLASS}-btn-shorten`).addEventListener('click', function (e) {
                const btn = e.target;
                self.#selectInputField(btn, true);
            });

            self.div.querySelectorAll(`.${self.CLASS}-url-box button.${self.CLASS}-btn-copy`).forEach(elm => {
                elm.addEventListener('click', async function (e) {
                    const btn = e.target;

                    await self.#selectInputField(btn);

                    document.execCommand('copy');

                    btn.textContent = self.getLocaleString('copied');

                    setTimeout(function () {
                        btn.textContent = self.getLocaleString('copy');
                        self.#unselectInputField();
                    }, 1000);
                });
            });

            self.div.querySelector('input[type=text]').addEventListener('click', function (e) {
                self.#selectInputField(e.target);
            });

            //Enviar por e-mail
            self.div.querySelector(`sitna-button.${self.CLASS}-btn-email`).addEventListener('click', async function (_e) {
                const url = await self.shortenedLink();
                if (url) {
                    const body = encodeURIComponent(url + "\n");
                    if (body.length > self.MAILTO_MAX_LENGTH) {
                        self.map.toast(self.getLocaleString('urlTooLongForMailto'), { type: Consts.msgType.WARNING });
                    }
                    window.location.href = 'mailto:?body=' + body;
                }
            });

            //Generar código QR        
            self.div.querySelector(`sitna-button.${self.CLASS}-btn-qr`).addEventListener("click", function (_e) {
                const qrContainer = self.#dialogDiv.querySelector(`.${self.CLASS}-qrcode`);
                qrContainer.innerHTML = '';

                if (self.#dialogDiv.querySelector(`.${self.CLASS}-qr-alert`).classList.contains(Consts.classes.HIDDEN)) {
                    self.makeQRCode(qrContainer, 256).then(function (qrCodeBase64) {
                        if (qrCodeBase64) {
                            Util.showModal(self.#dialogDiv.querySelector(`.${self.CLASS}-qr-dialog`));
                        }
                    });
                } else {
                    Util.showModal(self.#dialogDiv.querySelector(`.${self.CLASS}-qr-dialog`));
                }
            });

            const openSocialMedia = function (win, url, process) {
                if (url && url.trim().length > 0) {
                    win.location.href = process(url);
                } else {
                    TC.error(self.getLocaleString('urlTooLongForShortener'));
                    win.close();
                }
            };

            //Compartir en Facebook
            self.div.querySelector(`sitna-button.${self.CLASS}-btn-facebook`).addEventListener("click", function (_e) {
                const w = window.open();
                self.shortenedLink().then(function (url) {
                    openSocialMedia(w, url, function (url) {
                        return "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
                    });
                });
            });

            //Compartir en Twitter
            self.div.querySelector(`sitna-button.${self.CLASS}-btn-twitter`).addEventListener("click", function (_e) {
                const w = window.open();
                self.shortenedLink().then(function (url) {
                    openSocialMedia(w, url, function (url) {
                        var titulo = encodeURIComponent(window.document.title ? window.document.title : "Visor API SITNA");
                        return "https://twitter.com/intent/tweet?text=" + titulo + "&url=" + encodeURIComponent(url);
                    });
                });
            });

            //Compartir en Whatsapp
            if (Util.detectMobile()) {
                self.div.querySelector(`sitna-button.${self.CLASS}-btn-whatsapp`).addEventListener("click", function (_e) {
                    self.shortenedLink().then(async function (url) {
                        var waText = 'whatsapp://send?text=';
                        if (url !== undefined) {
                            location.href = waText + encodeURIComponent(url);
                        } else {
                            location.href = waText + encodeURIComponent(await self.generateLink());
                        }
                    });
                });
            }

            //Guardar en marcadores
            self.div.querySelector(`sitna-button.${self.CLASS}-btn-bookmark`).addEventListener("click", async function (_e) {
                var bookmarkURL = await self.generateLink();
                var bookmarkTitle = document.title;

                if (Util.detectMobile()) {
                    // Mobile browsers
                    alert(self.MOBILEFAV);
                } else if (window.sidebar && window.sidebar.addPanel) {
                    // Firefox version < 23
                    window.sidebar.addPanel(bookmarkTitle, bookmarkURL, '');
                } else if (window.sidebar && /Firefox/i.test(navigator.userAgent) || window.opera && window.print) {
                    // Firefox version >= 23 and Opera Hotlist                

                    window.location.href = bookmarkURL;
                    alert((/Mac/i.test(navigator.userAgent) ? 'Cmd' : 'Ctrl') + self.NAVALERT);

                } else if (window.external && 'AddFavorite' in window.external) {
                    // IE Favorite
                    window.external.AddFavorite(bookmarkURL, bookmarkTitle);
                } else {
                    // Other browsers (mainly WebKit - Chrome/Safari)                
                    window.location.href = bookmarkURL;
                    alert((/Mac/i.test(navigator.userAgent) ? 'Cmd' : 'Ctrl') + self.NAVALERT);
                }
            });

            if (Util.isFunction(callback)) {
                callback();
            }
        }));
    }

    async #selectInputField(elm, shorten) {
        const self = this;
        const input = elm.parentElement.querySelector("input[type=text]");

        if (shorten) {
            if (input.dataset.update || !input.dataset.shortened) {
                const value = await self.shortenedLink();
                if (value && value.trim().length > 0) {

                    elm.textContent = self.getLocaleString('shortened');
                    setTimeout(function () {
                        elm.textContent = self.getLocaleString('shorten');
                        self.#unselectInputField();
                    }, 1000);

                    delete input.dataset.update;
                    input.dataset.shortened = true;
                    input.value = value;

                    input.select();

                } else {
                    delete input.dataset.update;
                    delete input.dataset.shortened;
                    input.value = await self.generateLink();
                }
            }
        } else {
            if (!input.classList.contains('tc-url')) {
                input.value = await self.generateIframe();
            } else {
                if (input.dataset.update) {
                    delete input.dataset.update;
                    delete input.dataset.shortened;
                    input.value = await self.generateLink();
                }
            }

            input.select();
        }
    }

    #unselectInputField() {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(document.createRange());
    }

    /*
     * Obtiene una URL "limpia" para compartir el mapa.
     */
    getLocation() {
        var result = window.location.href;
        if (window.location.hash) {
            result = result.substr(0, result.indexOf(window.location.hash));
        }
        return result;
    }

    manageMaxLengthExceed(maxLengthExceed) {
        const self = this;

        const browserAlert = self.div.querySelector(`.${self.CLASS}-alert`);
        //Si la URL sobrepasa el tamaño máximo avisamos que puede fallar en Edge
        browserAlert.classList.toggle(Consts.classes.HIDDEN, !maxLengthExceed.browser);

        const qrAlert = self.#dialogDiv.querySelector(`.${self.CLASS}-qr-alert`);
        qrAlert.classList.toggle(Consts.classes.HIDDEN, !maxLengthExceed.qr);
    }

    async generateIframe(url) {
        const self = this;
        const urlString = url || await self.generateLink();
        if (urlString) {
            return '<iframe style="width:' + self.IFRAME_WIDTH + ';height:' + self.IFRAME_HEIGHT + ';" src="' + urlString + '"></iframe>';
        }
        return '';
    }

    loadParamFeature() {
        const self = this;
        let result = null;
        const featureToShow = Util.getParameterByName(self.FEATURE_PARAM);
        if (featureToShow) {
            let featureObj;
            try {
                featureObj = JSON.parse(decodeURIComponent(escape(window.atob(featureToShow))));
            }
            catch (error) {
                TC.error(self.getLocaleString('sharedFeatureNotValid'), Consts.msgErrorMode.TOAST);
            }
            if (featureObj && self.map) {
                if (featureObj.geom) {
                    self.map.addLayer({
                        id: self.getUID(),
                        type: Consts.layerType.VECTOR,
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
    }

    async update() {
        const self = this;
        const input = self.div.querySelector('.tc-url input[type=text]');
        if (input.value.trim().length === 0) {
            const link = await self.generateLink();
            self.registerListeners();
            input.value = link;
            self.div.querySelector('.tc-iframe input[type=text]').value = await self.generateIframe(link);
        }
    }

    async generateLink() {
        const self = this;
        const shareIconContainer = self.div.querySelector(`.${self.CLASS}-icons`);
        const textboxes = self.div.querySelectorAll(`.${self.CLASS}-url-box tc-textbox`);
        const buttons = self.div.querySelectorAll(`.${self.CLASS}-url-box button`);
        const alert = self.div.querySelector('.' + self.CLASS + '-alert');
        shareIconContainer.classList.add(Consts.classes.LOADING);
        textboxes.forEach(tb => tb.disabled = true);
        buttons.forEach(btn => {
            btn.classList.add(Consts.classes.LOADING);
            btn.disabled = true;
        });
        alert.classList.add(Consts.classes.LOADING);
        const result = await MapInfo.prototype.generateLink.call(self);
        textboxes.forEach(tb => tb.disabled = false);
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove(Consts.classes.LOADING);
        });
        shareIconContainer.classList.remove(Consts.classes.LOADING);
        alert.classList.remove(Consts.classes.LOADING);
        return result;
    }

}

TC.control.Share = Share;
export default Share;
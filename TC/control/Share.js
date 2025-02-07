import TC from '../../TC.js';
import Util from '../Util.js';
import Consts from '../Consts.js';
import MapInfo from './MapInfo.js';
import Controller from '../Controller';
import Observer from '../Observer';

TC.control = TC.control || {};

class ShareModel {
    constructor() {
        this.share = "";
        this.shareLink = "";
        this.embedMap = "";
        this.image = "";
        this.shareMapAsImage = "";        
        this["shareLink.tip.1"] = "";
        this["shareLink.tip.2"] = "";
        this["shareLink.tip.3"] = "";
        this.shareURL = "";
        this.sendMapByEmail = "";
        this.createQrCode = "";
        this.shareMapToWhatsapp = "";
        this.shareMapToTwitter = "";
        this.shareMapToFacebook = "";
        this.addToBookmarks = "";
        this["embedMap.tip.1"] = "";
        this["embedMap.tip.2"] = "";
        this.createQrCodeToImage = "";
        this.appendQRCode = "";
        this.sharePNG = "";
        this.shareJPG = "";
        this.tooManyLayersLoaded = "";
        this.shorten = "";
    }
}

class ShareDialogModel {
    constructor() {
        this.qrCode = "";
        this.qrAdvice = "";
        this.close = "";
    }
}

class Share extends MapInfo {
    MAILTO_MAX_LENGTH = 256;
    IFRAME_WIDTH = '600px';
    IFRAME_HEIGHT = '450px';
    FEATURE_PARAM = 'showfeature';
    MOBILEFAV;
    NAVALERT;
    #dialogDiv;
    #dialogConfirmDiv;

    constructor() {
        super(...arguments);
        const self = this;

        self.#dialogDiv = Util.getDiv(self.options.dialogDiv);
        if (!self.options.dialogDiv) {
            document.body.appendChild(self.#dialogDiv);
        }
        self.model = new ShareModel();
        self.dialogModel = new ShareDialogModel();
    }

    async register(map) {
        const self = this;

        await super.register.call(self, map);

        // URI: Añado el flag al mapa, de la misma manera que se hace con el control de download, para tenerlo en cuenta cuando se establece la función de carga de imágenes
        self.map.crossOrigin = 'anonymous';

        self.exportsState = true;        

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

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-share.mjs');
        const dialogTemplatePromise = import('../templates/tc-ctl-share-dialog.mjs');
        const dialogConfirmTemplatePromise = import('../templates/tc-ctl-share-confirm-dialog.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-dialog'] = (await dialogTemplatePromise).default;
        template[self.CLASS + '-confirm-dialog'] = (await dialogConfirmTemplatePromise).default;
        self.template = template;
    }

    async render(callback) {
        const self = this;
        self.#dialogDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-dialog', null);        
        await super.renderData.call(self, { controlId: self.id, native: !!navigator.share }, function () {

            //Si el navegador no soporta copiar al portapapeles, ocultamos el botón de copiar
            if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                self.div.querySelectorAll('button').forEach(function (btn) {
                    btn.classList.remove('hide');
                });
                self.div.querySelectorAll('input[type=text]').forEach(function (input) {
                    delete input.dataset.dataOriginalTitle;
                });
            }

            self.addUIEventListeners();

            if (Util.isFunction(callback)) {
                callback();
            }
            self.controller = new Controller(self.model, new Observer(self.div));
            self.dialogController = new Controller(self.dialogModel, new Observer(self.#dialogDiv));
            self.updateModel();
        });
    }

    addUIEventListeners() {
        const self = this;

        self.div.querySelector('h2').addEventListener('click', function (_e) {
            self.update();
        });
                
        self.div.querySelector(`.${self.CLASS}-url-box input.${self.CLASS}-btn-shorten`).addEventListener('change', function (e) {
            const btn = e.target;
            btn.disabled = true;
            if (!btn.checked)
                self.div.querySelector("input.tc-textbox.tc-url").dataset.update = true
            self.#selectInputField(btn, btn.checked).then(() => {
                btn.disabled = false;
            })
        });
        //copiar  al portapapeles
        self.div.querySelectorAll(`.${self.CLASS}-url-box sitna-button.${self.CLASS}-btn-copy`).forEach(elm => {
            elm.addEventListener('click', async function (_e) {
                const btn = _e.target;
                const input = btn.closest(".tc-ctl-share-url-box").querySelector("input.tc-textbox");
                const chkShorten = self.div.querySelector(`.${self.CLASS}-url-box input.${self.CLASS}-btn-shorten`);
                if (chkShorten) chkShorten.checked = !!input.dataset.shortened;
                if (navigator.clipboard?.writeText) {
                    _e.target.classList.add(Consts.classes.LOADING);

                    await self.#selectInputField(btn, chkShorten?.checked, input);                    

                    navigator.clipboard?.writeText(input.value).then(() => {
                        _e.target.classList.remove(Consts.classes.LOADING);
                        self.map.toast(self.getLocaleString('copied'), { type: Consts.msgType.INFO });
                    }).catch((err) => {
                        if (err.name !== "AbortError") {
                            TC.error(err);
                        }
                        _e.target.classList.remove(Consts.classes.LOADING);
                    });

                }
                else {
                    await self.#selectInputField(btn, chkShorten?.checked, input);

                    document.execCommand('copy');

                    _e.target.classList.add(Consts.classes.LOADING);

                    setTimeout(function () {
                        _e.target.classList.remove(Consts.classes.LOADING);
                        self.#unselectInputField();
                    }, 1000);
                }
            });
        });

        self.div.querySelector('input[type=text]').addEventListener('click', function (e) {
            const chk = self.div.querySelector(`.${self.CLASS}-url-box input.${self.CLASS}-btn-shorten`);
            if (chk.checked && e.target.dataset.update) chk.checked = false;
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
        
        self.div.querySelector(`sitna-button.${self.CLASS}-btn-whatsapp`).addEventListener("click", function (_e) {
            self.shortenedLink().then(async function (url) {
                if (Util.detectMobile()) {
                    const waText = 'whatsapp://send?text=';
                    if (url !== undefined) {
                        location.href = waText + encodeURIComponent(url);
                    } else {
                        location.href = waText + encodeURIComponent(await self.generateLink());
                    }                    
                }
                else {
                    const waText = 'https://wa.me/?text=';
                    if (url !== undefined) {
                        window.open(waText + encodeURIComponent(url),"_blank");
                    } else {
                        window.open(waText + encodeURIComponent(await self.generateLink()), "_blank");
                    }
                }
            });
        });

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
        //Compartir nativo
        self.div.querySelector(`sitna-button.${self.CLASS}-btn-native`)?.addEventListener("click", async function (_e) {
            _e.target.classList.add(Consts.classes.LOADING);
            self.shortenedLink().then(async function (url) {
                try {
                    const sharedOps = {
                        title: document.title,
                        url: url
                    }
                    //obtenemos la descripcion
                    sharedOps["text"] = document.querySelector("meta[name='description'][lang='" + self.map.options.locale + "'],meta[name='description'][lang='" + self.map.options.locale.substring(0, 2) + "']")?.getAttribute("content")
                    if (navigator.userActivation?.isActive)
                        await navigator.share(sharedOps);
                    else {
                        await self.confirmDialog(self.getLocaleString("shareURLConfirm"));
                        await navigator.share(sharedOps);
                    }
                }
                catch (err) {
                    if (err && err.name !== "AbortError") {
                        TC.error(err);
                    }
                }
                _e.target.classList.remove(Consts.classes.LOADING);
            });
            
        });
        //Compartir PNG nativo
        self.div.querySelector(`button.${self.CLASS}-btn-png-native`)?.addEventListener("click", async function (_e) {
            _e.target.classList.add(Consts.classes.LOADING);
            try {
                self.#shareImage("image/png").then(() => {
                    _e.target.classList.remove(Consts.classes.LOADING);
                })
            }
            catch (err) {
                if (err.name !== "AbortError") {
                    TC.error(err);
                }
            }
            _e.target.classList.remove(Consts.classes.LOADING);
            _e.target.active = false;
        });
        //Compartir JPG nativo
        self.div.querySelector(`button.${self.CLASS}-btn-jpg-native`)?.addEventListener("click", async function (_e) {
            _e.target.classList.add(Consts.classes.LOADING);
            try {
                await self.#shareImage("image/jpeg").then(() => {
                    _e.target.classList.remove(Consts.classes.LOADING);
                })
            }
            catch (err) {
                if (err.name !== "AbortError") {
                    TC.error(err);
                }
            }
            _e.target.classList.remove(Consts.classes.LOADING);
            _e.target.active = false;
        });
        

    }

    async #selectInputField(elm, shorten, _input=null) {
        const self = this;
        const input = _input || self.div.querySelector("input.tc-textbox.tc-url");

        if (shorten) {
            if (input.dataset.update || !input.dataset.shortened) {
                const value = await self.shortenedLink();
                if (value && value.trim().length > 0) {

                    const previousTitle = elm.title;
                    elm.title = self.getLocaleString('shortened');
                    setTimeout(function () {
                        elm.title = previousTitle;
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

    async #shareImage(format) {
        const self = this;
        const includeQR = self.div.querySelector(`.${self.CLASS}-chk-qr`).checked;
        const blob = await self.generateImage(format, true, includeQR);
        const fileName = document.title + "." + format.substr(format.indexOf("/") + 1);
        const file = new File([blob], fileName, { type: format })
        const sharedData = {
            title: fileName,
            files: [file]
        };
        if (navigator.canShare(sharedData)) {
            if (navigator.userActivation?.isActive)
                return navigator.share(sharedData);
            else {
                try{
                    await self.confirmDialog(self.getLocaleString("shareImageConfirm"));
                    return navigator.share(sharedData);
                }
                catch(err){
                    if (err && err.name)
                        TC.error(err);
                }                  
            }            
        }
        else {
            self.map.toast(self.getLocaleString("shareFileNotsupported"), { type: Consts.msgType.ERROR });
        }
        return;
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
            self.updateUI();
            const link = await self.generateLink();
            self.registerListeners();
            input.value = link;
            self.div.querySelector('.tc-iframe input[type=text]').value = await self.generateIframe(link);
        }
    }

    updateUI() {
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
        textboxes.forEach(tb => tb.disabled = false);
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove(Consts.classes.LOADING);
        });
        shareIconContainer.classList.remove(Consts.classes.LOADING);
        alert.classList.remove(Consts.classes.LOADING);
    }

    async generateLink() {
        const self = this;        
        return await MapInfo.prototype.generateLink.call(self);
    }

    async confirmDialog(message) {
        const self = this;
        if (!self.#dialogConfirmDiv) {
            self.#dialogConfirmDiv = Util.getDiv();
            document.body.appendChild(self.#dialogConfirmDiv);
            self.#dialogConfirmDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-confirm-dialog', { message: message });
        }
        else {
            self.#dialogConfirmDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-confirm-dialog', { message: message });
        }
        return new Promise((resolve, reject) => {
            const manageYesFnc=()=>{
                Util.closeModal();
                resolve();
            };
            const okBtn = self.#dialogConfirmDiv.querySelector(".tc-modal-ok");            
            okBtn.addEventListener("click", manageYesFnc);
            //okBtn.removeEventListener("click", resolve);                
            Util.showModal(self.#dialogConfirmDiv.querySelector(`.${self.CLASS}-confirm-dialog`), {
                closeCallback: () => {
                    okBtn.removeEventListener("click", manageYesFnc);
                    reject();
                }
            });
        });
    }
    updateModel() {
        this.model.share = this.getLocaleString("share");
        this.model.shareLink = this.getLocaleString("shareLink");
        this.model.embedMap = this.getLocaleString("embedMap");
        this.model.image = this.getLocaleString("image");
        this.model.shareMapAsImage = this.getLocaleString("shareMapAsImage");
        this.model["shareLink.tip.1"] = this.getLocaleString("shareLink.tip.1");
        this.model["shareLink.tip.2"] = this.getLocaleString("shareLink.tip.2");
        this.model["shareLink.tip.3"] = this.getLocaleString("shareLink.tip.3");
        this.model.shareURL = this.getLocaleString("shareURL");
        this.model.sendMapByEmail = this.getLocaleString("sendMapByEmail");
        this.model.createQrCode = this.getLocaleString("createQrCode");
        this.model.shareMapToWhatsapp = this.getLocaleString("shareMapToWhatsapp");
        this.model.shareMapToTwitter = this.getLocaleString("shareMapToTwitter");
        this.model.shareMapToFacebook = this.getLocaleString("shareMapToFacebook");
        this.model.addToBookmarks = this.getLocaleString("addToBookmarks");
        this.model["embedMap.tip.1"] = this.getLocaleString("embedMap.tip.1");
        this.model["embedMap.tip.2"] = this.getLocaleString("embedMap.tip.2");
        this.model.createQrCodeToImage = this.getLocaleString("createQrCodeToImage");
        this.model.appendQRCode = this.getLocaleString("appendQRCode");
        this.model.sharePNG = this.getLocaleString("sharePNG");
        this.model.shareJPG = this.getLocaleString("shareJPG");
        this.model.tooManyLayersLoaded = this.getLocaleString("tooManyLayersLoaded");
        this.model.shorten = this.getLocaleString("shorten");

        this.dialogModel.qrCode = this.getLocaleString("qrCode");
        this.dialogModel.qrAdvice = this.getLocaleString("qrAdvice");
        this.dialogModel.close = this.getLocaleString("close");

        this.MOBILEFAV = this.getLocaleString('mobileBookmarks.instructions');
        this.NAVALERT = this.getLocaleString('bookmarks.instructions');
    }
    async changeLanguage() {
        const self = this;
        self.updateModel();
    }
}

Share.prototype.CLASS = 'tc-ctl-share';
TC.control.Share = Share;
export default Share;
TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.Share = function (options) {
    var self = this;
    self._classSelector = '.' + self.CLASS;

    TC.Control.apply(self, arguments);

    var opts = options || {};
    self._$dialogDiv = $(TC.Util.getDiv(opts.dialogDiv));
    if (!opts.dialogDiv) {
        self._$dialogDiv.appendTo('body');
    }

    self.render();
};

TC.inherit(TC.control.Share, TC.Control);

(function () {
    var ctlProto = TC.control.Share.prototype;

    ctlProto.CLASS = 'tc-ctl-share';
    ctlProto.QR_MAX_LENGTH = 150;
    ctlProto.MAILTO_MAX_LENGTH = 256;
    ctlProto.IFRAME_WIDTH = '600px';
    ctlProto.IFRAME_HEIGHT = '450px';

    ctlProto.MOBILEFAV = 'Siga las instrucciones del navegador del dispositivo móvil para añadir como favorito. Se guardará el estado actual del mapa.';
    ctlProto.NAVALERT = ' +D para guardar en marcadores.';


    ctlProto.render = function (callback) {
        var self = this;
        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv.html(html);
        }).then(function () {
            TC.Control.prototype.render.call(self, function () {
                //Si el navegador no soporta copiar al portapapeles, ocultamos el botón de copiar
                if (TC.Util.detectChrome() || TC.Util.detectIE() >= 10 || TC.Util.detectFirefox() >= 41) {
                    self._$div.find("button").removeClass("hide");
                    var input = self._$div.find("input[type=text]");
                    input.removeAttr("data-original-title");
                }

                // Si el SO no es móvil, ocultamos el botón de compartir a WhatsApp
                if (!TC.Util.detectMobile()) {
                    self._$div.find(".share-whatsapp").addClass(TC.Consts.classes.HIDDEN);
                }

                var $options = self._$div.find('.' + self.CLASS + '-url-box');
                self._$div.find('span:not(.tc-beta)').on(TC.Consts.event.CLICK, function (e) {
                    var $cb = $(this).closest('label').find('input[type=radio][name=format]');

                    var newFormat = $cb.val();
                    $options.removeClass(TC.Consts.classes.HIDDEN);
                    $options.not('.tc-' + newFormat).addClass(TC.Consts.classes.HIDDEN);
                });
                if ($.isFunction(callback)) {
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

    /**
     * Genera el link para compartir el mapa.
     */
    ctlProto.generateLink = function () {
        var self = this;

        var currentUrl = window.location.href;
        var hashPosition = currentUrl.indexOf('#');
        if (hashPosition > 0) {
            currentUrl = currentUrl.substring(0, hashPosition);
        }

        if (self.extraParams) {
            // Hacemos merge de parámetros de URL
            var params = TC.Util.getQueryStringParams(currentUrl);
            $.extend(params, self.extraParams);
            var qsPosition = currentUrl.indexOf('?');
            if (qsPosition >= 0) {
                currentUrl = currentUrl.substring(0, qsPosition);
            }
            currentUrl = currentUrl.concat('?', $.param(params));
        }

        // eliminamos el parámetro del idioma, si no lo arrastramos al compartir
        if (TC.Util.getParameterByName('lang').length > 0) {
            if (currentUrl.indexOf('&') > -1) { // tenemos más parámetros en la url
                currentUrl = currentUrl.replace("lang" + "=" + TC.Util.getParameterByName('lang') + '&', '');
            } else {
                currentUrl = currentUrl.replace('?' + "lang" + "=" + TC.Util.getParameterByName('lang'), '');
            }
        }

        const controlStates = self.exportControlStates();
        const extraStates = controlStates.length ? { ctl: controlStates } : undefined;

        var hashState = self.map.getMapState(extraStates);


        var url = currentUrl.concat("#", hashState);
        //Si la URL sobrepasa el tamaño máximo avisamos que puede fallar en IE
        self._$div.find('.' + self.CLASS + '-alert').toggleClass(TC.Consts.classes.HIDDEN, url.length <= TC.Consts.URL_MAX_LENGTH);
        return url;
    };

    ctlProto.generateIframe = function (url) {
        var self = this;
        var urlString = url || this.generateLink();
        if (urlString) {
            return '<iframe style="width:' + self.IFRAME_WIDTH + ';height:' + self.IFRAME_HEIGHT + ';" src="' + urlString + '"></iframe>';
        }
    }

    ctlProto.exportControlStates = function () {
        const self = this;
        if (self.map) {
            return self.map.controls
                .map(function (ctl) {
                    return ctl.exportState();
                })
                .filter(function (state) {
                    // Quitamos los estados nulos
                    return state;
                });
        }
        return [];
    };

    ctlProto.importControlStates = function (stateArray) {
        const self = this;
        if (self.map) {
            stateArray.forEach(function (state) {
                const ctl = self.map.getControlById(state.id);
                if (ctl) {
                    ctl.importState(state);
                }
            });
        }
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        self.MOBILEFAV = self.getLocaleString('mobileBookmarks.instructions');
        self.NAVALERT = self.getLocaleString('bookmarks.instructions');

        var selectInputField = function (elm) {
            var input = $(elm).parent().find("input[type=text]");
            input.val(input.hasClass('tc-url') ? self.generateLink() : self.generateIframe());
            input.select();
        };

        var unselectInputField = function () {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(document.createRange());
        };

        self._$div.on("click", "h2", function (evt) {
            self._$div.find(".tc-url input[type=text]").val(self.generateLink());
            self._$div.find(".tc-iframe input[type=text]").val(self.generateIframe());
        });

        self._$div.on("click", ".tc-ctl-share-url-box button", function (evt) {
            selectInputField(evt.target);
            document.execCommand("copy");

            var copyBtn = $(this);
            copyBtn.text(self.getLocaleString("copied"));
            

            setTimeout(function () {
                copyBtn.text(self.getLocaleString("copy"));
                unselectInputField();
            }, 1000);

        });

        self._$div.on("click", "input[type=text]", function (evt) {
            selectInputField(evt.target);
        });

        //Deshabilitar el click de ratón en los enlaces de compartir cuando están deshabilitados
        self._$div.on("click", ".ga-share-icon.disabled", function (evt) {
            evt.stopImmediatePropagation();
            evt.preventDefault()
            return false;
        });

        //Enviar por e-mail
        self._$div.on("click", "a.share-email", function (evt) {
            evt.preventDefault();
            var url = self.generateLink();

            if (url) {
                const body = encodeURIComponent(url + "\n");
                if (body.length > self.MAILTO_MAX_LENGTH) {
                    map.toast(self.getLocaleString('urlTooLongForMailto'), { type: TC.Consts.msgType.WARNING });
                }
                window.location.href = 'mailto:?body=' + body;
            }
        });

        //Generar código QR
        //Desde localhost no funciona para URLs de más de 300 caracteres, ya que hay que acortarla y bitly no soporta URLs a localhost
        self._$div.on("click", "a.qr-generator", function (evt) {
            evt.preventDefault();
            var url = self.generateLink();

            if (url) {
                TC.loadJS(
                    typeof QRCode === 'undefined',
                    [TC.apiLocation + 'lib/qrcode/qrcode.min.js'],
                    function () {

                        if (url.length > self.QR_MAX_LENGTH) {
                            url = TC.Util.shortenUrl(url);
                        }

                        if (url !== undefined) {
                            TC.Util.showModal(self._$dialogDiv.find(self._classSelector + '-qr-dialog'));
                            var $qrContainer = self._$dialogDiv.find(".qrcode");
                            $qrContainer.empty();
                            new QRCode($qrContainer[0], url);
                        }
                        else {
                            TC.error(self.getLocaleString('urlTooLongForShortener'));
                        }
                    });
            }
        });

        //Compartir en Facebook
        self._$div.on("click", "a.share-fb", function (evt) {
            evt.preventDefault();
            var url = self.generateLink();

            if (url) {
                var shortUrl = TC.Util.shortenUrl(url); // desde localhost no funciona la reducción de url

                if (shortUrl !== undefined) {
                    window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shortUrl));
                } else {
                    TC.error(self.getLocaleString('urlTooLongForShortener'));
                }
                return false;
            }
        });

        //Compartir en Twitter
        self._$div.on("click", "a.share-twitter", function (evt) {
            evt.preventDefault();
            var url = self.generateLink();

            if (url) {
                var shortUrl = TC.Util.shortenUrl(url); // desde localhost no funciona la reducción de url

                if (shortUrl !== undefined) {
                    var titulo = encodeURIComponent(window.document.title ? window.document.title : "Visor API SITNA");
                    window.open("https://twitter.com/intent/tweet?text=" + titulo + "&amp;url=" + encodeURIComponent(shortUrl));
                } else {
                    TC.error(self.getLocaleString('urlTooLongForShortener'));
                }
                return false;
            }
        });

        //Compartir en Whatsapp
        if (TC.Util.detectMobile()) {
            self._$div.on("click", "a.share-whatsapp", function (evt) {
                evt.preventDefault();
                var url = self.generateLink();

                if (url) {
                    var shortUrl = TC.Util.shortenUrl(url); // desde localhost no funciona la reducción de url

                    var waText = 'whatsapp://send?text=';
                    if (shortUrl !== undefined) {
                        location.href = waText + encodeURIComponent(shortUrl);
                    } else {
                        location.href = waText + encodeURIComponent(url);
                    }
                    return false;
                }
            });
        }

        //Guardar en marcadores
        self._$div.on("click", "a.share-star", function (evt) {
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
        });

        //Cuando se añada o borre una capa, comprobamos de nuevo si la URL cumple los requisitos de longitud para habilitar el control
        //map.on(TC.Consts.event.MAPLOAD, function () {
        //    map.on(TC.Consts.event.LAYERREMOVE + ' ' + TC.Consts.event.LAYERADD, function (e) {
        //        self.generateLink();
        //    });
        //});

        map.loaded(function () {
            const controlStates = map.state && map.state.ctl;
            if (controlStates) {
                self.importControlStates(controlStates);
            }
        });
    };

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Share.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/ShareDialog.html";
    } else {
        ctlProto.template[ctlProto.CLASS] = function () {
            dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "share" }).w(" <span class=\"tc-beta tc-hidden\">").h("i18n", ctx, {}, { "$key": "beta" }).w("</span></h2><div><div class=\"ga-share-icons\"><a class=\"ga-share-icon share-email\" target=\"_blank\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "sendMapByEmail" }).w("\"href=\"#\"><i class=\"icon-envelope-alt\"></i></a><a class=\"ga-share-icon qr-generator\" target=\"_blank\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "createQrCode" }).w("\"href=\"#\"><i class=\"icon-qrcode\"></i></a><a class=\"ga-share-icon share-fb\" target=\"_blank\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "shareMapToFacebook" }).w("\"href=\"#\"><i class=\"icon-facebook\"></i></a><a class=\"ga-share-icon share-twitter\" target=\"_blank\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "shareMapToTwitter" }).w("\"href=\"#\"><i class=\"icon-twitter\"></i></a><a class=\"ga-share-icon share-whatsapp\" target=\"_blank\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "shareMapToWhatsapp" }).w("\"href=\"#\"><i class=\"icon-whatsapp\"></i></a><a class=\"ga-share-icon share-star\" target=\"_blank\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "addToBookmarks" }).w("\"href=\"#\"><i class=\"icon-star\"></i></a></div><div class=\"tc-ctl-share-select\"><form><label class=\"tc-ctl-share-btn-url\"><input type=\"radio\" checked=\"checked\" name=\"format\" value=\"url\" /><span>").h("i18n", ctx, {}, { "$key": "shareLink" }).w("</span></label><label class=\"tc-ctl-share-btn-iframe\"><input type=\"radio\" name=\"format\" value=\"iframe\" /><span>").h("i18n", ctx, {}, { "$key": "embedMap" }).w("</span></label></form></div><div class=\"tc-ctl-share-url-box tc-group tc-url\"><input type=\"text\" class=\"tc-textbox tc-url\" readonly data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "shareLink.tip.1" }).w("\" /><button class=\"tc-button hide\" title=\"").h("i18n", ctx, {}, { "$key": "shareLink.tip.2" }).w("\">").h("i18n", ctx, {}, { "$key": "copy" }).w("</button></div><div class=\"tc-ctl-share-url-box tc-group tc-iframe tc-hidden\"><input type=\"text\" class=\"tc-textbox tc-iframe\" readonly data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "embedMap.tip.1" }).w("\" /><button class=\"tc-button hide\" title=\"").h("i18n", ctx, {}, { "$key": "embedMap.tip.2" }).w("\">").h("i18n", ctx, {}, { "$key": "copy" }).w("</button></div><div class=\"tc-ctl-share-alert tc-alert alert-warning tc-hidden\"><p>").h("i18n", ctx, {}, { "$key": "tooManyLayersLoaded|s" }).w("</p> </div></div>"); } body_0.__dustBody = !0; return body_0
        };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () {
            dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-share-qr-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "qrCode" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><div class=\"qrcode\"></div></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0
        };
    }
})();
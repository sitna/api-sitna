TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

TC.control.ExternalWMS = function (options) {
    if (TC.isLegacy) {
        console.warn("El control ExternalWMS no soporta modo legacy");
        return;
    }
    var self = this;
    this.count = 0;
    this._addedUrls = [];

    TC.Control.apply(self, arguments);
};

TC.inherit(TC.control.ExternalWMS, TC.Control);

(function () {
    var ctlProto = TC.control.ExternalWMS.prototype;

    ctlProto.CLASS = 'tc-ctl-xwms';

    /**
     * Marca como seleccionadas aquellas opciones del desplegable correspondientes a servicios WMS ya añadidos al TOC.
     */
    ctlProto.markServicesAsSelected = function (options) {
        if (options.length > 0) {
            var $optionSelected = $(options[0]);
            $optionSelected.attr("disabled", "true");
            $optionSelected.addClass("tc-ctl-xwms-option-selected");
        }
    };

    ctlProto.register = function (map) {
        if (TC.isLegacy) {
            console.warn("El control ExternalWMS no soporta modo legacy");
            return;
        }

        var self = this;
        TC.Control.prototype.register.call(self, map);

        self._$div.on("change", "select", function (evt) {
            if (this.value != "") {
                self._$div.find("input").val(this.value);
                $(this).val("");
            }
        });

        /**
         * Borra parámetros no necesarios de la URL del servicio WMS.
         */
        var _removeParamsFromUrl = function (url) {
            var unwantedParams = ["version", "service", "request"];
            for (var i = 0; i < unwantedParams.length; i++) {
                url = TC.Util.removeURLParameter(url, unwantedParams[i]);
            }
            if (url.match(/\?$/)) {
                url = url.substr(0, url.length - 1);
            }
            return url;
        }

        self._$div.on("click", "button[name='agregar']", function (evt) {
            var url = self._$div.find("input").val();

            if (!url) {
                TC.alert(self.getLocaleString('typeAnAddress'));
            }
            else if (!/^((https?|ftp):)?(\/\/)?(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url)) {
                TC.alert(self.getLocaleString('typeAValidAddress'));
            }
            else {
                if (self._addedUrls.indexOf(url) > -1) {
                    TC.alert(self.getLocaleString('serviceAlreadyAdded'));
                }
                else {
                    url = _removeParamsFromUrl(url);
                    var loadingCtrl = self.map.getControlsByClass("TC.control.LoadingIndicator")[0];
                    loadingCtrl.show();
                    var $addButton = self._$div.find("button");
                    $addButton.attr("disabled", "true");

                    //Si la URL no tiene protocolo, le asignamos HTTP
                    if (!/^((https?|ftp))/i.test(url)) {
                        if (url.indexOf("//") == 0) {
                            url = "http:" + url;
                        } else {
                            url = "http://" + url;
                        }
                    }

                    var obj = {
                        "id": "xwms" + (++self.count),
                        //"title": "Servicio externo",
                        "type": "WMS",
                        "url": url,
                        "hideTree": false
                    };

                    var layer = new TC.layer.Raster(obj);
                    layer.getCapabilitiesPromise().then(function (cap) {
                        if (typeof (cap.Capability) === 'undefined') {
                            TC.alert(self.getLocaleString('noLayersFoundInService'));
                            loadingCtrl.hide();
                            $addButton.removeAttr("disabled");
                            return;
                        } else {
                            var root = cap.Capability.Layer;
                            if (root.CRS && root.CRS.indexOf(self.map.crs) == -1) {
                                //no soportado. avisar y fallar
                                TC.alert(self.getLocaleString('serviceSrsNotCompatible'));
                                loadingCtrl.hide();
                                $addButton.removeAttr("disabled");
                                return;
                            }

                            var catalog = self.map.getControlsByClass("TC.control.LayerCatalog");
                            if (catalog.length == 0)
                                console.error("No hay lista de capas a la que añadir");
                            else {
                                catalog = catalog[0];
                                catalog.addLayer(layer);
                                $(catalog.div).removeClass("tc-collapsed");
                                self._$div.find("input").val("");
                                var optionSelected = self._$div.find("select option[value='" + url + "']");
                                self.markServicesAsSelected(optionSelected);
                                self._addedUrls.push(url);
                            }
                            loadingCtrl.hide();
                            $addButton.removeAttr("disabled");
                        }
                    },
                    function (error) {
                        TC.alert(self.getLocaleString('serviceCouldNotBeLoaded') + ":\n" + error);
                        loadingCtrl.hide();
                        $addButton.removeAttr("disabled");
                    });
                }
            }

        });

        map.on(TC.Consts.event.LAYERCATALOGADD, function (e) {
            var url = e.layer.url;
            var optionSelected = self._$div.find("select option[value='" + url + "']");
            self.markServicesAsSelected(optionSelected);
            self._addedUrls.push(url);
        });
    };

    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/ExternalWMS.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () {
            dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "addMaps" }).w("</h2><div><div class=\"tc-group tc-ctl-xwms-cnt\"> <select id=\"add-wms-select\" class=\"tc-combo\"><option value=\"\">URL</option>").s(ctx.get(["suggestions"], false), ctx, { "block": body_1 }, {}).w("</select> <input type=\"text\" class=\"tc-textbox\" placeholder=\"").h("i18n", ctx, {}, { "$key": "writeAddressOrSelect" }).w("...\" /></div><div class=\"tc-group tc-group tc-ctl-xwms-cnt\" style=\"text-align:right;\"><button type=\"button\" style=\"width:70px\" class=\"tc-button\" name=\"agregar\">").h("i18n", ctx, {}, { "$key": "add" }).w("</button></div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<optgroup label=\"").f(ctx.get(["group"], false), ctx, "h").w("\">").s(ctx.get(["items"], false), ctx, { "block": body_2 }, {}).w("</optgroup>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<option value=\"").f(ctx.get(["url"], false), ctx, "h").w("\">").f(ctx.get(["name"], false), ctx, "h").w("</option>"); } body_2.__dustBody = !0; return body_0 };
    }



    ctlProto.render = function (callback) {
        var self = this;
        self.renderData(self.options);
    };

})();
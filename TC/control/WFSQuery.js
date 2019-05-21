TC.control = TC.control || {};

/*pollyfill*/
if (!HTMLElement.prototype.appendHTML) {
    HTMLElement.prototype.appendHTML = function (html) {
        var d = document.createElement("div");
        d.innerHTML = html;
        if (d.childNodes.length > 1) {
            for (var i = 0; i < d.childNodes.length; i++) {
                this.appendChild(d.childNodes[i]);
            }
        }
        if (d.childNodes.length > 0)
            this.appendChild(d.firstChild);
        return null;
    };
};
if (!Document.prototype.createHTMLElement) {
    Document.prototype.createHTMLElement = function (html) {
        var d = document.createElement("div");
        d.innerHTML = html;
        if (d.childNodes.length > 0)
            return d.firstChild;
        return null;
    };
};
if (!HTMLElement.prototype.empty) {
    HTMLElement.prototype.empty = function () {
        while (this.children.length) {
            this.removeChild(this.children[0]);
        }
    };
};

if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) { // .length of function is 2
            'use strict';
            if (target == null) { // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) { // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}


if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.WFSQuery = function (options) {
    var self = this;
    TC.Control.apply(this, arguments);
    self.styles = self.options.styles;
    self.highLightStyles = self.options.highLightStyles;
};

TC.inherit(TC.control.WFSQuery, TC.Control);

(function () {
    var ctlProto = TC.control.WFSQuery.prototype;

    var cssClassLoading = "tc-loading";
    var cssClassUnavailable = "tc-unavailable";
    var modalBody = null;
    var modalDialog = null;
    var ctlResultsPanel = null;
    var resultLayer = null;
    var logicalOperator = TC.Consts.logicalOperator.AND;
    var timer = null;
    var autoCompletePromise = null;
    var locale = null;

    var filterByOperation = {
        eq: TC.filter.equalTo,
        not: TC.filter.notEqualTo,
        gt: TC.filter.greaterThan,
        lt: TC.filter.lessThan,
        ge: TC.filter.greaterThanOrEqualTo,
        le: TC.filter.lessThanOrEqualTo,
        like: TC.filter.like,
        contains: TC.filter.like,
        start: TC.filter.like,
        end: TC.filter.like,
        bw: TC.filter.between
    }
    var map = null;
    var _currentLayer = null;
    var _currentLayercapabilities = null;
    var _currentLayerTitle = null;
    var _currentLayerURL = null;
    var _maxRecordCount = null;
    var _getStyles = function () { return null };
    var _getHighLightStyles = function () { return null };
    var getLocaleString=null;
    ctlProto.CLASS = 'tc-ctl-wfsquery';
    ctlProto.template = {};
    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS + "-dialog"] = TC.apiLocation + "TC/templates/WFSQueryDialog.html";
        ctlProto.template[ctlProto.CLASS + "-form"] = TC.apiLocation + "TC/templates/WFSQueryForm.html";
        ctlProto.template[ctlProto.CLASS + "-filter"] = TC.apiLocation + "TC/templates/WFSQueryfilter.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () {
            dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-wfsquery-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window tc-ctl-wfsquery-modal-window\" ><div class=\"tc-modal-header\"><h3>").f(ctx.get(["layerName"], false), ctx, "h").w("</h3><div title=\"").h("i18n", ctx, {}, { "$key": "query.tooltipCloseDialogBtn" }).w("\" class=\"tc-modal-close\"></div></div><div class=\"tc-modal-body\">").h("gt", ctx, { "block": body_1 }, { "key": ctx.getPath(false, ["layers", "length"]), "value": 1 }).w("<div class=\"tc-modal-form\"></div><div class=\"tc-ctl-wfsquery-message tc-hidden\"></div> </div><div class=\"tc-modal-footer\"><button type=\"button\" title=\"").h("i18n", ctx, {}, { "$key": "query.tooltipSendQueryBtn" }).w("\" class=\"tc-button tc-ctl-wlm-btn-launch\">").h("i18n", ctx, {}, { "$key": "query.sendQueryBtnText" }).w("</button><button type=\"button\" title=\"").h("i18n", ctx, {}, { "$key": "query.cancelQueryTooltip" }).w("\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "query.cancelQueryButton" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w(" <div><select class=\"tc-combo\" name=\"availableLayers\"><option value=\"\">").h("i18n", ctx, {}, { "$key": "query.chooseALayerCombo" }).w("</option>").s(ctx.get(["layers"], false), ctx, { "block": body_2 }, {}).w("</select></div> "); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<option value=\"").f(ctx.get(["name"], false), ctx, "h").w("\">").f(ctx.get(["title"], false), ctx, "h").w("</option>"); } body_2.__dustBody = !0; return body_0;
        };
        ctlProto.template[ctlProto.CLASS + '-form'] = function () {
            dust.register(ctlProto.CLASS + '-form', body_0); function body_0(chk, ctx) { return chk.w("<div>").h("countif", ctx, { "else": body_1, "block": body_2 }, { "key": ctx.get(["attributes"], false), "excludedKeys": "the_geom,FEATURE" }).w("</div><div class=\"tc-ctl-wfsquery-operacion tc-hidden\"><div class=\"tc-ctl-wfsquery tc-ctl-wfsquery-numeric tc-hidden\"><input type=\"radio\" id=\"cond_1\" name=\"codicion\" value=\"eq\" /><label for=\"cond_1\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.equalToBtn" }).w("</label><input type=\"radio\" id=\"cond_2\" name=\"codicion\" value=\"not\" /><label for=\"cond_2\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.notEqualToBtn" }).w("</label><input type=\"radio\" id=\"cond_3\" name=\"codicion\" value=\"gt\" /><label for=\"cond_3\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.greatherThanBtn" }).w("</label><input type=\"radio\" id=\"cond_4\" name=\"codicion\" value=\"lt\" /><label for=\"cond_4\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.lowerThanBtn" }).w("</label><input type=\"radio\" id=\"cond_5\" name=\"codicion\" value=\"ge\" /><label for=\"cond_5\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.greatherOrEqualThanBtn" }).w("</label><input type=\"radio\" id=\"cond_6\" name=\"codicion\" value=\"le\" /><label for=\"cond_6\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.lowerOrEqualThanBtn" }).w("</label><!--<input type=\"radio\" id=\"cond_7\" name=\"codicion\" value=\"like\" /><label for=\"cond_7\" class=\"tc-ctl-wfsquery-cond\">es como</label>--></div><div class=\"tc-ctl-wfsquery tc-ctl-wfsquery-text tc-hidden\"><input type=\"radio\" id=\"cond_8\" name=\"codicion\" value=\"eq\" /><label for=\"cond_8\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.equalToBtn" }).w("</label><input type=\"radio\" id=\"cond_9\" name=\"codicion\" value=\"contains\" /><label for=\"cond_9\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.containsBtn" }).w("</label><input type=\"radio\" id=\"cond_10\" name=\"codicion\" value=\"start\" /><label for=\"cond_10\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.startsByBtn" }).w("</label><input type=\"radio\" id=\"cond_11\" name=\"codicion\" value=\"end\" /><label for=\"cond_11\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.endsByBtn" }).w("</label></div><div class=\"tc-ctl-wfsquery tc-ctl-wfsquery-date tc-hidden\"><input type=\"radio\" id=\"cond_12\" name=\"codicion\" value=\"bw\" /><label for=\"cond_12\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.equalToBtn" }).w("</label><input type=\"radio\" id=\"cond_13\" name=\"codicion\" value=\"nbw\" /><label for=\"cond_13\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.notEqualToBtn" }).w("</label><input type=\"radio\" id=\"cond_14\" name=\"codicion\" value=\"gt\" /><label for=\"cond_14\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.greatherThanBtn" }).w("</label><input type=\"radio\" id=\"cond_15\" name=\"codicion\" value=\"lt\" /><label for=\"cond_15\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.lowerThanBtn" }).w("</label><input type=\"radio\" id=\"cond_16\" name=\"codicion\" value=\"ge\" /><label for=\"cond_16\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.greatherOrEqualThanBtn" }).w("</label><input type=\"radio\" id=\"cond_17\" name=\"codicion\" value=\"le\" /><label for=\"cond_17\" class=\"tc-ctl-btn tc-ctl-wfsquery-cond\">").h("i18n", ctx, {}, { "$key": "query.lowerOrEqualThanBtn" }).w("</label><!--<input type=\"radio\" id=\"cond_7\" name=\"codicion\" value=\"like\" /><label for=\"cond_7\" class=\"tc-ctl-wfsquery-cond\">es como</label>--></div><div class=\"tc-ctl-wfsquery-where tc-hidden\"><input type=\"search\" placeholder=\"").h("i18n", ctx, {}, { "$key": "query.searchFieldPhd" }).w("\" class=\"tc-textbox\" /><button type=\"button\" title=\"").h("i18n", ctx, {}, { "$key": "query.tooltipAddCondBtn" }).w("\" class=\"tc-button\">").h("i18n", ctx, {}, { "$key": "query.textAddCondBtn" }).w("</button><ul class=\"tc-ctl-wfsquery-list tc-ctl-search-list tc-hidden\"></ul><div class=\"tc-ctl-wfsquery-key\"><label>").h("i18n", ctx, {}, { "$key": "query.logicalOpLbl" }).w("</label></div><div class=\"tc-ctl-wfsquery-value\"><input type=\"radio\" id=\"log_op_1\" class=\"tc-ctl-btn tc-ctl-wfsquery-logOpRadio\" checked name=\"log_op\" value=\"AND\" /><label for=\"log_op_1\" class=\"tc-ctl-btn tc-ctl-wfsquery-logOp\">").h("i18n", ctx, {}, { "$key": "query.logicalOpAndLbl" }).w("</label><input type=\"radio\" id=\"log_op_2\" class=\"tc-ctl-btn tc-ctl-wfsquery-logOpRadio\" name=\"log_op\" value=\"OR\" /><label for=\"log_op_2\" class=\"tc-ctl-btn tc-ctl-wfsquery-logOp\">").h("i18n", ctx, {}, { "$key": "query.logicalOpOrLbl" }).w("</label></div><div class=\"tc-ctl-wfsquery-whereList\"></div></div></div>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">").h("i18n", ctx, {}, { "$key": "query.noAttributes" }).w("</div>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<select class=\"tc-combo\" id=\"attributes\" name=\"attributes\"><option value=\"\">").h("i18n", ctx, {}, { "$key": "query.chooseAttrCombo" }).w("</option>").h("iterate", ctx, { "block": body_3 }, { "on": ctx.get(["attributes"], false), "excludedKeys": "the_geom,FEATURE" }).w("</select>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("<option value=\"").f(ctx.get(["key"], false), ctx, "h").w("\">").f(ctx.get(["key"], false), ctx, "h").w("</option>"); } body_3.__dustBody = !0; return body_0
        };
        ctlProto.template[ctlProto.CLASS + '-filter'] = function () {
            dust.register(ctlProto.CLASS + '-filter', body_0); function body_0(chk, ctx) { return chk.s(ctx.get(["conditions"], false), ctx, { "block": body_1 }, {}); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<div class=\"tc-ctl-wfsquery-where-cond\">").f(ctx.get(["field"], false), ctx, "h").w("&nbsp;").f(ctx.get(["opText"], false), ctx, "h").w("&nbsp;").x(ctx.get(["isString"], false), ctx, { "block": body_2 }, {}).f(ctx.get(["valueToShow"], false), ctx, "h", ["numberSeparator"]).x(ctx.get(["isString"], false), ctx, { "block": body_3 }, {}).w("</div><div class=\"tc-ctl-wfsquery-del-cond\" title=\"").h("i18n", ctx, {}, { "$key": "query.tooltipRemoveCond" }).w("\"></div>\t"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("&quot;"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.w("&quot;"); } body_3.__dustBody = !0; return body_0; 
        };        
    }

    var checkInput = function (type) {
        var input = document.createElement("input");
        input.setAttribute("type", type);
        return input.type == type;
    };

    var _loadDatePolyFill = function () {
        return new Promise(function (resolve, reject) {
            if (typeof (IMask) !== "undefined") {
                setTimeout(function () {
                    resolve();
                }, 10);
            }
            else {
                TC.loadJS(true,
                    [TC.apiLocation + '/lib/polyfill/IMask' + (TC.isDebug ? '' : '.min') + '.js'],
                    function () {
                        console.log("Imask loaded");
                        resolve();
                    });
            }
        });
    };
    var _loadNumberPolyFill = function () {
        return new Promise(function (resolve, reject) {
            if (typeof (IMask) !== "undefined") {
                setTimeout(function () {
                    resolve();
                }, 10);
            }
            else {
                TC.loadJS(true,
                    [TC.apiLocation + '/lib/polyfill/IMask' + (TC.isDebug ? '' : '.min') + '.js'],
                    function () {
                        console.log("Imask loaded");
                        resolve();
                    });
            }
        });
    }
    var _renderModalDialog = function (layer, layerName, capabilities, callback) {        
        var layers = [];
        layer.getDisgregatedLayerNames().forEach(function (value, index) {
            var path = layer.getPath(value);
            //quitamos aquellas que no estén disponibles en el WFS
            if (capabilities.FeatureTypes.hasOwnProperty(value.substring(value.indexOf(":") + 1)))
                layers.push({ name: value, title: path[path.length - 1] });
        });
        layers.sort(function (a, b) {
            if (a.title < b.title) return -1;
            if (a.title > b.title) return 1;
            return 0;
        });

        ctlProto.getRenderedHtml(ctlProto.CLASS + "-dialog",
            {
                layerName: getLocaleString("query.titleDialog", { "layerName": layerName }),
                layers: layers
            }, function (html) {
                var modal = document.createHTMLElement(html);
                document.body.appendChild(modal);
                modalBody = modal.getElementsByClassName("tc-modal-body")[0]
                modalBody.classList.add(cssClassLoading);

                TC.Util.showModal(modal, {
                    closeCallback: function () {
                        modal.parentElement.removeChild(modal);
                    }
                });
                //IE me hace la puñeta con los estilos, no me fuciona el calc el el max-height así que lo calculo cada vez que muestro el dialogo
                if (TC.Util.detectIE()) {
                    var coef = 1;
                    switch (true) {
                        case document.body.clientWidth > 768 && document.body.clientWidth < document.body.clientHeight:
                        case document.body.clientWidth > 1024:
                            coef = 0.8;
                        case document.body.clientWidth > 1140:
                            coef = 0.7;
                            break;
                    }
                    modalBody.style.maxHeight = (document.body.clientHeight * coef) - modalBody.nextElementSibling.clientHeight - modalBody.previousElementSibling.clientHeight;
                }
                modalDialog = modal;
                modal.getElementsByClassName("tc-button tc-ctl-wlm-btn-launch")[0].addEventListener("click", function () {
                    _sendQuery();
                })
                if (callback) callback(modal);
            });
    }

    var _renderQueryForm = function (args) {
        var layer = args[0], dialog = args[1], capabilities = args[2];
        _currentLayercapabilities = capabilities;
        _currentLayerURL = capabilities.Operations.DescribeFeatureType.DCP.HTTP.Get["xlink:href"];
        if (capabilities.Operations.GetFeature.CountDefault)
            _maxRecordCount = capabilities.Operations.GetFeature.CountDefault.DefaultValue;
        else
            _maxRecordCount = null;
        //analizamos si es una o varias capas, si es una agrupación la disgregamos 
        var layers = layer.getDisgregatedLayerNames();
        //quitamos aquellas que no estén disponibles en el WFS
        layers = layers.filter(function (l) {
            return capabilities.FeatureTypes.hasOwnProperty(l.substring(l.indexOf(":") + 1));
        });
        if (layers.length > 1) {
            modalBody.classList.remove(cssClassLoading);
            //bindeamos el onchange de combo
            dialog.getElementsByClassName("tc-combo")[0].addEventListener("change", function () {
                if (!this.value) {
                    var form = dialog.getElementsByClassName("tc-modal-form")[0];
                    form.empty();
                    for (var i = 0; i < form.children.length; i++) form.removeChild(form.children[i]);
                    _clear();
                    return;
                }
                dialog.querySelector(".tc-modal-body .tc-ctl-wfsquery-message", dialog).classList.add(TC.Consts.classes.HIDDEN);
                _currentLayerTitle = this.options[this.selectedIndex].text;
                modalBody.classList.add(cssClassLoading);
                _getDescribeFeature(this.value, capabilities).then(function (data) { _manageDescribeFeature(data, dialog); }, function () {
                    var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                    tbody.classList.remove(cssClassLoading);
                    tbody.appendHTML("<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                    tbody.empty();
                });
            });
        }
        else {
            //comprabamos que la capa existe en el capabilities
            var layerCapabilities = capabilities.FeatureTypes[layers[0].substring(layers[0].indexOf(":") + 1)];
            if (layerCapabilities) {
                _currentLayerTitle = capabilities.FeatureTypes[layers[0].substring(layers[0].indexOf(":") + 1)].Title;
                _getDescribeFeature(layers[0], capabilities).then(function (data) { _manageDescribeFeature(data, dialog); }, function () {
                    var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                    tbody.classList.remove(cssClassLoading);
                    tbody.appendHTML("<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                    tbody.empty();
                });
            }
            else {
                var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                tbody.classList.remove(cssClassLoading);
                tbody.appendHTML("<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                //TC.Util.closeModal();
                //layer.map.toast("Mal", { type: TC.Consts.msgType.WARNING });
            }

        }
    }

    var _getDescribeFeature = function (layerName, capabilities) {
        _currentLayer = layerName;
        return new Promise(function (resolve, reject) {
            if (!capabilities.Operations.DescribeFeatureType) {
                TC.error("No está habilitado DescribeFeatureType en este servicio", TC.Consts.msgErrorMode.TOAST);
                return;
            }
            var url = capabilities.Operations.DescribeFeatureType.DCP.HTTP.Get["xlink:href"] + "?REQUEST=DescribeFeatureType&TYPENAME=" + layerName + "&OUTPUTFORMAT=" + capabilities.Operations.DescribeFeatureType.outputFormat
            TC.ajax({
                url: url,
                method: "GET",
                responseType: "application/xml"
                /*,error: function (xhr, err, message) {
                    TC.error(message);
                },*/
            }).then(function (response) {
                var obj = xml2json(response);
                var objLayer = obj[layerName.substring(layerName.indexOf(":") + 1)];
                if (objLayer) {
                    var type = objLayer.type
                    resolve(obj[type.substring(type.indexOf(":") + 1)].complexContent.extension.sequence);
                }
                else {
                    reject();
                }
                }).catch(function (error) {
                    TC.error(error);
                });
        });
    }
    var _getValue = function (input) {
        if (inputMaskNumber) {
            return inputMaskNumber.unmaskedValue;

        } else if (dateInputMask) {
            //si es texto con mascara de fecha convertierto la fecha de dd/mm/yyyy a yyyy-mm-dd
            return dateInputMask.unmaskedValue.substring(4) + "-" + dateInputMask.unmaskedValue.substring(2, 4) + "-" + dateInputMask.unmaskedValue.substring(0, 2)
        }
        return input.value;//en el resto de los casos la devuelvo tal cual

    }
    var _getValueToShow = function (input) {
        if (inputMaskNumber) {
            return inputMaskNumber.value;
        }
        else if (dateInputMask) {
            //si es de tipo date devolvemos la fecha en formato dd/mm/yyyy
            return dateInputMask.value;
        }
        else if (input.type === "date") {
            return new Date(input.value).toLocaleDateString(locale)
        }
        else if (input.type === "number") {
            var dotOrComma = 1.1.toLocaleString(locale).substring(1, 2);
            return input.value.replace(".", dotOrComma);
        }
        return input.value;//en el resto de los casos la devuelvo tal cual

    }
    var dateInputMask = null;
    var inputMaskNumber = null;
    var _createDateMask = function (txtBox) {
        if (checkInput("date"))
            txtBox.type = "date";
        else {
            txtBox.type = "search";
            _loadDatePolyFill().then(function () {
                //construir el polyfill
                dateInputMask = new IMask(txtBox, {
                    mask: Date,
                    pattern: ((!locale || locale === "es-ES") ? 'd/`m/`Y' : (locale === "eu-ES" ? 'Y/`m/`d' : 'm/`d/`Y')),
                    lazy: false,
                    format: function (date) {
                        var day = date.getDate();
                        var month = date.getMonth() + 1;
                        var year = date.getFullYear();
                        if (day < 10) day = "0" + day;
                        if (month < 10) month = "0" + month;
                        switch (locale) {
                            case "eu-ES":
                                return [year, month, day].join('/');
                                break;
                            case "en-US":
                                return [month, day, year].join('/');
                                break;
                            case "es-ES":
                            default:
                                return [day, month, year].join('/');
                                break;
                        }

                    },
                    // define str -> date convertion
                    parse: function (str) {
                        switch (locale) {
                            case "eu-ES":
                                return new Date(str.split('/')[1] + "/" + str.split('/')[2] + "/" + str.split('/')[0])
                                break;
                            case "en-US":
                                return new Date(str)
                                break;
                            case "es-ES":
                            default:
                                return new Date(str.split('/')[1] + "/" + str.split('/')[0] + "/" + str.split('/')[2])
                                break;
                        }

                    },
                    blocks: {
                        d: {
                            mask: IMask.MaskedRange,
                            from: 1,
                            to: 31,
                            maxLength: 2,
                        },
                        m: {
                            mask: IMask.MaskedRange,
                            from: 1,
                            to: 12,
                            maxLength: 2,
                        },
                        Y: {
                            mask: IMask.MaskedRange,
                            from: 1900,
                            to: 9999,
                        }
                    }
                });
            });
        }
    };
    var _destroyDateMask = function () {
        if (dateInputMask) {
            var input = dateInputMask.el.input;
            dateInputMask.destroy();
            dateInputMask = null;
            input.value = "";
            input.type = "search";
        }
    };
    var destroyNumberMask = function () {
        if (inputMaskNumber) {
            var input = inputMaskNumber.el.input;
            inputMaskNumber.destroy();
            inputMaskNumber = null;
            input.value = "";
            input.type = "search";
        }
    };
    var _getDataTypes = function () {
        return _internalGetDataTypes();
    }
    var _manageDescribeFeature = function (data, dialog) {
        _clear();
        _internalGetDataTypes = function () {
            return data;
        };
        ctlProto.getRenderedHtml(ctlProto.CLASS + "-form",
            {
                attributes: data
            }, function (html) {
                var form = dialog.getElementsByClassName("tc-modal-form")[0];
                form.empty();
                form.appendHTML(html);
                modalBody.classList.remove(cssClassLoading);
                TC.loadJS(
                    true,
                    [TC.apiLocation + 'TC/ui/autocomplete.js'],
                    function () {
                        console.log("autocomplete loaded");
                    });
                var type = null;
                var combo = form.getElementsByClassName("tc-combo");
                if (combo.length == 0)
                    dialog.getElementsByClassName("tc-button tc-ctl-wlm-btn-launch")[0].setAttribute("disabled", "");
                else {
                    dialog.getElementsByClassName("tc-button tc-ctl-wlm-btn-launch")[0].removeAttribute("disabled");
                    combo[0].addEventListener("change", function () {
                        var valueField = form.querySelector(".tc-ctl-wfsquery-where .tc-textbox");
                        if (valueField.dataset["autocomplete"])
                            TC.UI.autocomplete.call(valueField, "clear");
                        if (!data[this.value]) {
                            form.getElementsByClassName("tc-ctl-wfsquery-numeric")[0].classList.add("tc-hidden");
                            form.getElementsByClassName("tc-ctl-wfsquery-date")[0].classList.add("tc-hidden");
                            form.getElementsByClassName("tc-ctl-wfsquery-text")[0].classList.add("tc-hidden");
                            form.getElementsByClassName("tc-ctl-wfsquery-where")[0].classList.add("tc-hidden");
                            form.getElementsByClassName("tc-ctl-wfsquery-operacion")[0].classList.add("tc-hidden");
                            return;
                        }
                        type = data[this.value].type;
                        form.getElementsByClassName("tc-ctl-wfsquery-operacion")[0].classList.remove("tc-hidden");
                        TC.UI.autocomplete.call(valueField, "clear");
                        //$(valueField).unbind("keydown");
                        destroyNumberMask();
                        valueField.type = "search";
                        switch (true) {
                            case type.indexOf("int") >= 0:
                            case type.indexOf("float") >= 0:
                            case type.indexOf("double") >= 0:
                            case type.indexOf("long") >= 0:
                            case type.indexOf("decimal") >= 0:
                                form.getElementsByClassName("tc-ctl-wfsquery-numeric")[0].classList.remove("tc-hidden");
                                form.getElementsByClassName("tc-ctl-wfsquery-text")[0].classList.add("tc-hidden");
                                form.getElementsByClassName("tc-ctl-wfsquery-date")[0].classList.add("tc-hidden");
                                form.getElementsByClassName("tc-ctl-wfsquery-where")[0].classList.remove("tc-hidden");

                                if (form.querySelectorAll("tc-ctl-wfsquery-numeric input:checked").length === 0)
                                    form.querySelector(".tc-ctl-wfsquery-numeric :first-child").checked = true;                                
                                _destroyDateMask();
                                
                                if (checkInput("number")) {
                                    if (TC.Util.detectIE()) {
                                        valueField.type = "text";
                                        _loadNumberPolyFill().then(function () {
                                            inputMaskNumber = new IMask(valueField, {
                                                mask: Number,  // enable number mask
                                                scale: (type.indexOf("int") >= 0 || type.indexOf("long") >= 0) ? 0 : 2,  // digits after point, 0 for integers
                                                signed: false,  // disallow negative
                                                thousandsSeparator: (locale && locale === "en-US") ? ',' : '.',  // any single char
                                                padFractionalZeros: false,  // if true, then pads zeros at end to the length of scale
                                                normalizeZeros: true,  // appends or removes zeros at ends
                                                radix: (locale && locale === "en-US") ? '.' : ',',  // fractional delimiter
                                            })
                                        });
                                    }
                                    else {
                                        valueField.type = "number";
                                        if (type.indexOf("int") >= 0 || type.indexOf("long") >= 0)
                                            valueField.step = "1";
                                        else
                                            valueField.step = "0.0001";
                                    }
                                }
                                break
                            case type.indexOf("dateTime") >= 0:

                                form.getElementsByClassName("tc-ctl-wfsquery-numeric")[0].classList.add("tc-hidden");
                                form.getElementsByClassName("tc-ctl-wfsquery-text")[0].classList.add("tc-hidden");
                                form.getElementsByClassName("tc-ctl-wfsquery-date")[0].classList.remove("tc-hidden");
                                form.getElementsByClassName("tc-ctl-wfsquery-where")[0].classList.remove("tc-hidden");

                                if (form.querySelectorAll("tc-ctl-wfsquery-date input:checked").length === 0)
                                    form.querySelector(".tc-ctl-wfsquery-date :first-child").checked = true;
                                _createDateMask(valueField);
                                break;
                            case type.indexOf("string") >= 0:
                                form.getElementsByClassName("tc-ctl-wfsquery-numeric")[0].classList.add("tc-hidden");
                                form.getElementsByClassName("tc-ctl-wfsquery-text")[0].classList.remove("tc-hidden");
                                form.getElementsByClassName("tc-ctl-wfsquery-date")[0].classList.add("tc-hidden");
                                form.getElementsByClassName("tc-ctl-wfsquery-where")[0].classList.remove("tc-hidden");

                                if (form.querySelectorAll("tc-ctl-wfsquery-text input:checked").length === 0)
                                    form.querySelector(".tc-ctl-wfsquery-text :first-child").checked = true;
                                _destroyDateMask();                                
                                _autocompleteConstructor(valueField, this.value, form.getElementsByClassName(ctlProto.CLASS + "-list tc-ctl-search-list")[0]);
                                break;
                        }
                    });
                    form.querySelector(".tc-ctl-wfsquery-where  input[type='radio']").addEventListener("change", function () {
                        logicalOperator = this.value === "OR" ? TC.Consts.logicalOperator.OR : TC.Consts.logicalOperator.AND
                        //reemplazar en la lista
                        form.getElementsByClassName("tc-ctl-wfsquery-whereList-op")[0].innerHTML = this.nextElementSibling.innerHTML;
                    });
                    
                    form.querySelector(".tc-button").addEventListener("click", function () {
                        var valueField = form.querySelector('input.tc-textbox');
                        TC.UI.autocomplete.call(valueField, "clear");
                        if (inputMaskNumber)
                            inputMaskNumber.masked.remove();
                        if (!_validate(form)) {
                            return;
                        }
                        var field = form.querySelector('.tc-combo').value;
                        var checkeOp = form.querySelector('.tc-ctl-wfsquery input[type="radio"]:checked');
                        var op = checkeOp.value;
                        var opText = checkeOp.nextElementSibling.innerText;

                        var value = _getValue(valueField);
                        var valueToShow = _getValueToShow(valueField);
                        var logOp = form.querySelector('.tc-ctl-wfsquery-where  input[type="radio"]:checked').nextElementSibling.innerText;
                                               
                        //reemplazo < y > por y &lt;&gt;
                        value = value.replace("<", "&lt;").replace(">", "&gt;");
                        //escapo los caracteres no alfamericos                    
                        //value = value.replace(/[^a-z\dáéíóúü]/gi, '!' + '$&');
                        //se añade asterisco al principio y/o final del valor para las busquedas: "empieza por", "termina en" o "contiene"
                        var f;
                        if (type.indexOf("dateTime") >= 0) {
                            if (op !== "nbw")
                                f = new filterByOperation[op](field, value + "T00:00:00Z", value + "T23:59:59Z");
                            else//el not bettween es un caso es especial por que concatena un filtro not y otro between
                            {
                                f = new TC.filter.not(TC.filter.between(field, value + "T00:00:00Z", value + "T23:59:59Z"));
                            }
                        }
                        else
                            f = new filterByOperation[op](
                                field,
                                (((op === "end" || op === "contains") ? '*' : '') + value + ((op === "start" || op === "contains") ? '*' : '')));
                        f.matchCase = false;
                        whereObjList.push(f);
                        switch (true) {
                            case type.indexOf("int") >= 0:
                                valueToShow = parseInt(value,10)
                                break;
                            case type.indexOf("float") >= 0:
                            case type.indexOf("double") >= 0:
                            case type.indexOf("long") >= 0:
                            case type.indexOf("decimal") >= 0:
                                valueToShow = parseFloat(value, 10)
                                break;
                        }
                        whereFilterList.push({
                            "field": field,
                            "opText": opText,
                            "isString": type.indexOf("string")>=0,
                            "valueToShow": valueToShow
                        });
                        
                        _renderFiltersConditions(form);
                        valueField.value = "";
                    });
                }
            });
    };
    var _renderFiltersConditions = function (form) {

        if (!dust.filters.numberSeparator)
            dust.filters.numberSeparator = function (value) {
                return value.toLocaleString(locale);
            };

        var whereDiv = form.getElementsByClassName("tc-ctl-wfsquery-whereList")[0];
        whereDiv.empty();
        ctlProto.getRenderedHtml(ctlProto.CLASS + "-filter", {
            conditions: whereFilterList
        }, function (html) {
            form.getElementsByClassName("tc-ctl-wfsquery-whereList")[0].innerHTML = html;
            var delBtnCollection = form.getElementsByClassName("tc-ctl-wfsquery-del-cond");
            for (var i = 0; i < delBtnCollection.length; i++) {
                delBtnCollection[i].addEventListener("click", function () {
                    var index = Array.prototype.indexOf.call(delBtnCollection, this);
                    whereObjList.splice(index, 1);
                    whereFilterList.splice(index, 1);
                    _renderFiltersConditions(form);
                });
            }
        });
    }
    var _clear = function () {
        whereObjList = [];
        whereFilterList = [];
    };
    var _validate = function (form) {
        var opcion = form.querySelector('.tc-ctl-wfsquery input[type="radio"]:checked');

        if (dateInputMask && !dateInputMask.masked.isComplete) {
            if (/^(?=\d)(?:(?:31(?!.(?:0?[2469]|11))|(?:30|29)(?!.0?2)|29(?=.0?2.(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(?:\x20|$))|(?:2[0-8]|1\d|0?[1-9]))([-.\/])(?:1[012]|0?[1-9])\1(?:1[6-9]|[2-9]\d)?\d\d(?:(?=\x20\d)\x20|$))?(((0?[1-9]|1[012])(:[0-5]\d){0,2}(\x20[AP]M))|([01]\d|2[0-3])(:[0-5]\d){1,2})?$/.test(str) === false)
                _showMessage("Fecha " + str + " inválida", TC.Consts.msgType.ERROR);
            return false;
        }
        if (opcion.length == 0) {
            _showMessage(getLocaleString("query.msgNoCondition"));
            return false;
        }
        if (form.querySelectorAll('input[type=\'date\']').length && !form.querySelector('input[type=\'date\']').checkValidity()) {
            _showMessage(getLocaleString("query.msgNoValidDate"));
            return false;
        }
        var number
        if (form.querySelectorAll('input[type=\'number\']').length && ((number = form.querySelector('input[type=\'number\']')) != null) && !number.checkValidity()) {
            if (number.step === "1")
                _showMessage(getLocaleString("query.msgNoValidNumberMustInt"));
            else
                _showMessage(getLocaleString("query.msgNoValidNumber"));
            return false;
        }
        if (form.querySelector('input.tc-textbox').value.trim() === "") {
            _showMessage(getLocaleString("query.msgNoValueCondition"));
            return false;
        }
        return true;
    };
    var _sendQuery = function () {

        if (!_validateQuery()) {
            _showMessage(getLocaleString("query.msgNoQueryFilter"));
            return;
        }
        modalDialog.getElementsByClassName("tc-modal-body")[0].classList.add(cssClassLoading);
        var _fncLoadVectorLayer = function () {
            var filtro = filterConstructor();

            _createResultPanel(_currentLayerTitle);

            if (!resultLayer) {
                _createVectorLayer({
                    id: "WFSQueryResults",
                    type: TC.Consts.layerType.WFS,
                    url: _currentLayerURL,
                    version: "1.1.0",
                    stealth: true,
                    geometryName: "the_geom",
                    featurePrefix: _currentLayer.substring(0, _currentLayer.indexOf(":")),
                    featureType: _currentLayer.substring(_currentLayer.indexOf(":") + 1),
                    maxFeatures: _maxRecordCount,
                    properties: filtro,
                    outputFormat: TC.Consts.format.JSON,
                    styles: _getStyles()
                });
                map.on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                    if (e.control !== ctlResultsPanel)
                        return;
                    if (Modernizr.touch) {
                        TC.Util.swipe(e.control.div, "enable");
                    }
                    resultLayer.clearFeatures();
                    resultLayer.setVisibility(false);
                    map.off(TC.Consts.event.LAYERUPDATE, _featuresUpdate);
                });
            }
            else {
                resultLayer.setVisibility(false);
                resultLayer.clearFeatures();
                //borro el evento featureUpdate por si hago una búsqueda sin cerra el panel previamente
                map.off(TC.Consts.event.LAYERUPDATE, _featuresUpdate);
                map.on(TC.Consts.event.LAYERUPDATE, _featuresUpdate);
                resultLayer.url = _currentLayerURL;
                resultLayer.featurePrefix = _currentLayer.substring(0, _currentLayer.indexOf(":"));
                resultLayer.featureType = _currentLayer.substring(_currentLayer.indexOf(":") + 1);
                resultLayer.maxFeatures = _maxRecordCount;
                resultLayer.properties = filtro;
                resultLayer.setVisibility(true);
                resultLayer.refresh();
            }

        }

        if (_maxRecordCount)
            _numHits().then(_fncLoadVectorLayer, function (error) {
                modalDialog.getElementsByClassName("tc-modal-body")[0].classList.remove(cssClassLoading)
                if (error.err === "NumMaxFeatures") {
                    _showMessage(getLocaleString("query.msgTooManyResults", { limit: error.limit }), TC.Consts.msgType.WARNING)
                }
                else if (error.err === "Empty") {
                    _showMessage(getLocaleString("query.msgNoResults"), TC.Consts.msgType.INFO);
                }
                else {
                    console.error(error.errorThrown)
                    _showMessage(getLocaleString("query.errorUndefined"), TC.Consts.msgType.ERROR);
                }

            });
        else
            _fncLoadVectorLayer();
        //si está disponible el atributo CountDefault compruebo que no se sobrepasa la longitud

    }
    var _createVectorLayer = function (layerOptions) {
        map.addLayer(layerOptions).then(function (layer) {
            resultLayer = layer;
            layer.map.on(TC.Consts.event.LAYERUPDATE, _featuresUpdate);
        });
    };
    var filterConstructor = function () {
        if (whereObjList.length > 1) {
            var condicion = document.querySelector(".tc-ctl-wfsquery-logOpRadio:checked").value;
            return TC.filter[TC.Consts.logicalOperator[condicion]].apply(null, whereObjList);
        }
        else if (whereObjList.length === 0)
            return null
        else
            return whereObjList[0];
    }
    var _featuresUpdate = function (e) {
        if (e.layer == resultLayer) {
            var features = e.layer.features;
            if (features.length > 0) {
                map.zoomToFeatures(features);
                _showResultPanel(
                    (features.length > 1 ?
                        features.reduce(function (vi, va, index) {
                            return (vi instanceof Array ? vi : [vi.data]).concat([va.data])
                        })
                        :
                        [features[0].data])
                    , resultLayer, _currentLayerTitle);
            }
            else {
                modalDialog.getElementsByClassName("tc-modal-body")[0].classList.remove(cssClassLoading);
                _showMessage("No hay resultados", TC.Consts.msgType.INFO);
                e.layer.map.off(TC.Consts.event.LAYERUPDATE, _featuresUpdate);
            }
        }
    };
    var _createResultPanel = function (layerName) {
        var _layerName = layerName;
        new Promise(function (resolve, reject) {
            if (!TC.control.ResultsPanel) {
                TC.loadJS(true, TC.apiLocation + 'TC/control/ResultsPanel', function () {
                    resolve(TC.control.ResultsPanel);
                });
            }
            else
                resolve(TC.control.ResultsPanel);
        }).then(function (ResultsPanel) {
            if (!ctlResultsPanel) {
                var fncResultPanelAdded = function (ctl) {
                    ctlResultsPanel = ctl;
                    delete dust.cache[ctlResultsPanel.CLASS + "-table"];
                    if (TC.isDebug) {
                        ctlResultsPanel.template[ctlResultsPanel.CLASS + "-table"] = TC.apiLocation + "TC/templates/WFSQueryResultsTable.html";
                    }
                    else {
                        ctlResultsPanel.template[ctlResultsPanel.CLASS + "-table"] = dust.register(ctlResultsPanel.CLASS + "-table", body_0); function body_0(chk, ctx) { return chk.w("<table class=\"table\"><thead>").s(ctx.get(["columns"], false), ctx, { "block": body_1 }, {}).w("</thead><tbody>").s(ctx.get(["results"], false), ctx, { "block": body_2 }, {}).w("</tbody></table>"); } body_0.__dustBody = !0; function body_1(chk, ctx) { return chk.w("<th>").f(ctx.getPath(true, []), ctx, "h").w("</th>"); } body_1.__dustBody = !0; function body_2(chk, ctx) { return chk.w("<tr title=\"").h("i18n", ctx, {}, { "$key": "zoomToFeature" }).w("\" data-id=\"").f(ctx.get(["Id"], false), ctx, "h").w("\" data-index=\"").f(ctx.get(["$idx"], false), ctx, "h").w("\" class=\"tc-selectable\">").h("iterate", ctx, { "block": body_3 }, { "on": ctx.getPath(true, []) }).w("</tr>"); } body_2.__dustBody = !0; function body_3(chk, ctx) { return chk.h("select", ctx, { "block": body_4 }, { "key": ctx.get(["key"], false) }); } body_3.__dustBody = !0; function body_4(chk, ctx) { return chk.w("<td class=\"").f(ctx.get(["key"], false), ctx, "h", ["removeAccents", "downcase"]).w("\">").h("startsWith", ctx, { "else": body_5, "block": body_6 }, { "key": ctx.get(["value"], false), "value": "http" }).w("</td>"); } body_4.__dustBody = !0; function body_5(chk, ctx) { return chk.f(ctx.get(["value"], false), ctx, "h", ["numberSeparator"]); } body_5.__dustBody = !0; function body_6(chk, ctx) { return chk.w("<a href=\"").f(ctx.get(["value"], false), ctx, "h").w("\" target=\"_blank\" title=\"").h("i18n", ctx, {}, { "$key": "query.linkOpenAtNewTab" }).w("\">").h("i18n", ctx, {}, { "$key": "query.linkText" }).w("</a>"); } body_6.__dustBody = !0; return body_0
                    }
                    ctlResultsPanel.options.titles.max = ctlResultsPanel.getLocaleString('geo.trk.chart.exp');                    
                }
                var ccontainer = map.getControlsByClass(TC.control.ControlContainer);
                if (ccontainer.length == 0) {
                    map.addControl("ResultsPanel",
                        {
                            "content": "table",
                            "titles": {
                                "main": "",
                                "max": ""
                            },
                            "save": {
                                "fileName": _layerName + ".xls"
                            }
                        }).then(fncResultPanelAdded);
                }
                else {
                    ccontainer[0].addControl("ResultsPanel", {
                        "content": "table",
                        "titles": {
                            "main": "",
                            "max": ""
                        },
                        "save": {
                            "fileName": _layerName + ".xls"
                        }, "side": "right"
                    }).then(fncResultPanelAdded);
                }
            }
            else {
                ctlResultsPanel.options.save.fileName = _layerName + ".xls";
                ctlResultsPanel.options.titles.max = ctlResultsPanel.getLocaleString('geo.trk.chart.exp');
            }
        });
    };
    var _showResultPanel = function (data, layer, layername) {

        //map.$events.trigger(TC.Consts.event.SEARCHDONE, { data: data } );

        var truthTest = function (name, test) {
            return function (chunk, context, bodies, params) {
                return filter(chunk, context, bodies, params, name, test);
            };
        }        
        
        //en funcion del número de elementos cargo un título en singular o plural

        ctlResultsPanel.div.querySelector(".prpanel-title-text").innerText = ctlResultsPanel.getLocaleString(data.length > 1 ? 'query.titleResultPaneMany' : 'query.titleResultPanelOne', { "numero": data.length, "layerName": layername });
                
        ctlResultsPanel.div.classList.add("tc-ctl-wfsquery-results");
        
        modalDialog.parentElement.removeChild(modalDialog);
        
        ctlResultsPanel.openTable({
            data: data,
            css: {
                trClass: "trClass",
                tdClass: "tdClass",
                thClass: "thClass",
            },
            callback: function (tabla) {
                
                ctlResultsPanel.maximize();
                console.log("render del panel de resultados");
                var col = tabla.getElementsByTagName("tr");
                var dataTypes = _getDataTypes();
                var j = 1;
                for (var i in data[0]) {
                    if (dataTypes.hasOwnProperty(i)) {
                        if (dataTypes[i].type.indexOf("int") >= 0 ||
                            dataTypes[i].type.indexOf("float") >= 0 ||
                            dataTypes[i].type.indexOf("double") >= 0 ||
                            dataTypes[i].type.indexOf("long") >= 0 ||
                            dataTypes[i].type.indexOf("decimal") >= 0) {
                            var tdNumeric = tabla.querySelectorAll("td:nth-child(" + j + ")");
                            for (var k = 0; k < tdNumeric.length; k++) {
                                tdNumeric[k].classList.add("tc-numeric");
                            }
                        }
                    }
                    j++;
                }

                
                for (var i = 0; i < col.length; i++) {
                    col[i].addEventListener("click", function (e) {
                        e.stopPropagation();
                        var index = this.dataset.index;
                        if (index != undefined)
                            layer.map.zoomToFeatures([layer.features[index]]);
                    });
                    col[i].addEventListener("mouseenter", function () {
                        var index = this.dataset.index;
                        if (index == undefined) return;
                        var feat = layer.features[index]
                        if (feat && feat.geometry) {
                            //feat.select();
                            _select(feat);
                        }
                        for (var i = 0; i < this.children.length; i++) {
                            var td = this.children[i];
                            if (td.offsetWidth < td.scrollWidth)
                                td.title = td.innerText;
                        }

                    });
                    col[i].addEventListener("mouseleave", function () {
                        var index = this.dataset.index;
                        if (index == undefined) return;
                        var feat = layer.features[index]
                        if (feat && feat.geometry) {
                            //feat.unselect();
                            _unselect(feat)
                            //esto es porque el unselect no devulve al estilo por defecto
                            //feat.setStyle(TC.Cfg.styles[feat.STYLETYPE]);
                        }
                    });
                }

                //se deshabilita el swipe para que se pueda hacer scroll horizontal del panel de resultados
                if (Modernizr.touch) {
                    TC.Util.swipe(ctlResultsPanel.div, 'disable');
                }
                //politica para replegar el panel de herramientas:
                //si el panel de herramientas se superpone al panel de resultados lo repliego
                var toolPanel = document.getElementById("tools-panel") || document.body.querySelector(".tools-panel");
                if (toolPanel && ctlResultsPanel.div.getElementsByClassName("prpanel-group")[0].colliding(toolPanel))
                        toolPanel.classList.add("right-collapsed");
            }
        });

    }
    var _validateQuery = function () {
        return whereObjList.length > 0;
    };
    var _showMessage = function (Message, type) {
        var messageDiv = modalBody.getElementsByClassName("tc-ctl-wfsquery-message")[0];
        if (timer) {
            clearTimeout(timer);
        }
        else {
            messageDiv.innerHTML=Message;
            switch (type) {
                case TC.Consts.msgType.INFO:
                    messageDiv.classList.add("tc-msg-info")
                    break;
                case TC.Consts.msgType.WARNING:
                    messageDiv.classList.add("tc-msg-warning")
                    break;
                case TC.Consts.msgType.ERROR:
                default:
                    messageDiv.classList.add("tc-msg-error")
                    break;
            }
            messageDiv.classList.remove(TC.Consts.classes.HIDDEN);
        }
        timer = setTimeout(function () {
            timer = null;
            messageDiv.classList.add(TC.Consts.classes.HIDDEN);
        }, 3000)
    };
    var _getPossibleValues = function (field, value) {
        return new Promise(function (resolve, reject) {
            var _capabilities = Object.assign({}, _currentLayercapabilities);
            _capabilities.version = "1.1.0";
            switch (document.querySelector(".tc-ctl-wfsquery.tc-ctl-wfsquery-text input:checked").value) {
                case "start":
                    value = (value + "*");
                    break;
                case "contains":
                case "eq":
                    value = ("*" + value + "*");
                    break;
                case "end":
                    value = ("*" + value);
                    break;
            }
            if (autoCompletePromise) {
                autoCompletePromise = null;
            }
            autoCompletePromise = TC.ajax({
                url: _currentLayerURL + '?' + Date.now(),
                data: TC.Util.WFSQueryBuilder([_currentLayer], TC.filter.like(field, value, undefined, undefined, undefined, false), _capabilities, "JSON", false),
                contentType: "application/xml",
                responseType: "application/json",
                method: "POST",
            });
            autoCompletePromise.then(function (response) {
                if (response.features && response.features.length > 0) {
                    var arr;
                    if (response.features.length === 1)
                        arr = [response.features[0].properties[field]];
                    if (response.features.length > 1)
                        arr = response.features.reduce(function (pv, cv) {
                            if (pv && pv instanceof Array) {
                                if (pv.indexOf(cv.properties[field]) < 0)
                                    return pv.concat(cv.properties[field]);
                                else
                                    return pv;
                            }
                            else {
                                if (pv.properties[field] === cv.properties[field])
                                    return [pv.properties[field]]
                                else
                                    return [pv.properties[field], cv.properties[field]]
                            }
                        });
                    //arr.sort();
                    resolve(arr);
                } else reject(null);
            });
        });
    };
    var _autocompleteConstructor = function (control, property, listCtrl) {

        TC.UI.autocomplete.call(control, {
            minLength: 3,
            target: listCtrl,
            source: function (text, callback) {
                var _self = this;
                _self.target.innerHTML = '<li><a class="tc-ctl-search-li-loading" href="#">' + getLocaleString("searching") + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>'
                _self.target.classList.remove("tc-hidden");
                _getPossibleValues(property, text).then(callback).catch(function () {
                    _self.target.classList.add("tc-hidden");
                });
            },
            callback: function (e) {
                control.value = e.currentTarget.dataset["value"];
                this.target.classList.add("tc-hidden");
            },
            buildHTML: function (data) {
                var pattern = control.value;
                this.target.style.maxHeight = "";
                if (data.results.length > 1)
                    return data.results.reduce(function (pv, cp, i) {
                        return (i > 1 ? pv : _highlightText(pv, pattern)) + _highlightText(cp, pattern);
                    });
                else
                    return _highlightText(data.results[0], pattern);
            }
        });
        control.addEventListener("targetCleared.autocomplete", function () {
            listCtrl.classList.add("tc-hidden");
        });
        control.addEventListener('keypress', function (e) {
            if (e.which == 13) {
                TC.UI.autocomplete.call(control, "clear");
            }
        });
        control.addEventListener("search", function (e) {
            if (control.value.length === 0) {
                TC.UI.autocomplete.call(control, "clear")
            }
        });
        control.addEventListener("input", function (e) {
            if (control.value.length === 0) {
                TC.UI.autocomplete.call(control, "clear")
            }
        });
    };
    var _highlightText = function (text, pattern) {
        pattern = new RegExp(pattern, "gi");
        return "<li><a href=\"#\" data-value=\"" + text + "\">" + text.replace(pattern, '<b>$&</b>') + "</a></li>";
    };
    var _numHits = function () {
        return new Promise(function (resolve, reject) {
            var filtro = filterConstructor();
            var _capabilities = Object.assign({}, _currentLayercapabilities);
            _capabilities.version = "1.1.0";
            TC.ajax({
                url: _currentLayerURL,
                data: TC.Util.WFSQueryBuilder([_currentLayer], filtro, _capabilities, null, true),
                contentType: "application/xml",
                method: "POST"
            }).then(function () {
                var capabilitiesAsJSON = xml2json(new DOMParser().parseFromString(arguments[0], 'application/xml'));
                if (capabilitiesAsJSON.Exception) {
                    reject({
                        err: capabilitiesAsJSON.Exception.exceptionCode, errorThrown: capabilitiesAsJSON.Exception.ExceptionText
                    });
                    return;
                }
                var featFounds = parseInt(capabilitiesAsJSON.numberMatched || capabilitiesAsJSON.numberOfFeatures, 10)
                if (isNaN(featFounds) || featFounds >= parseInt(_maxRecordCount, 10)) {
                    reject({
                        err: "NumMaxFeatures", limit: _maxRecordCount
                    });
                    return;
                }
                else if (!isNaN(featFounds) && featFounds === 0) {
                    reject({
                        err: "Empty"
                    });
                    return;
                }
                resolve();
            }, function (xhr, state, message) {
                reject({
                    err: state, errorThrown: message
                });
            });
        });
    };
    var _select = function (feature) {
        var _addFeature = function (layer, feature) {
            var result
            if (feature instanceof TC.feature.Point) {
                result = layer.addPoint(feature.getCoords());
            }
            else if (feature instanceof TC.feature.Polyline) {
                result = layer.addPolyline(feature.getCoords());
            }
            else if (feature instanceof TC.feature.Polygon) {
                result = layer.addPolygon(feature.getCoords());
            }
            else if (feature instanceof TC.feature.MultiPolygon) {
                result = layer.addMultiPolygon(feature.getCoords());
            }
            else if (feature instanceof TC.feature.MultiPolyline) {
                result = layer.addMultiPolyline(feature.getCoords());
            }
            return result;
        };
        if (!feature.layer)
            return;
        var layer = feature.layer.map.getLayer("WFSQueryResultsHighlight");
        if (!layer) {
            feature.layer.map.addLayer({
                id: "WFSQueryResultsHighlight",
                type: TC.Consts.layerType.VECTOR,
                stealth: true,
                styles: _getHighLightStyles()
            }, function (layer) {
                _addFeature(layer, feature);
            });
        }
        else
            _addFeature(layer, feature);             
    };
    var _unselect = function (feature) {
        var layer = feature.layer.map.getLayer("WFSQueryResultsHighlight");
        if (layer) {
            layer.clearFeatures();
        }
    };
    ctlProto.render = function (callback) {
        const self = this;
        const result = TC.Control.prototype.render.call(self, callback);
        return result;
    };

    ctlProto.register = function (_map) {
        const self = this;
        map = _map;
        return new Promise(function (resolve) {

            //condición IF si una coleccion de atributos tiene 1 o mas elementos. Tiene una lista negra llamada excludedKeys
            dust.helpers.countif = function (chunk, context, bodies, params) {
                params = params || {};
                var body = bodies.block, skip = bodies['else'], key = params["key"] || context.current();
                var excludedKeys = params.excludedKeys != null ? params.excludedKeys.split(',') : null;
                var _count = 0
                for (var k in key) {
                    if (excludedKeys == null || excludedKeys.indexOf(k) < 0) {
                        _count++;
                    }
                }
                if (_count > 0) {
                    chunk = chunk.render(body, context);
                }
                else if (skip) {
                    chunk = chunk.render(skip, context);
                }
                return chunk;
            }

            TC.Control.prototype.register.call(self, map).then(function () {                
                _getStyles = function () {
                    var _default = $.extend(true, {}, TC.Cfg.styles, {
                        "polygon": {
                            fillColor: "#ffffff",
                            fillOpacity: 0,
                            strokeColor: "#ff0000",
                            strokeWidth: 2
                        },
                        "polyline": {
                            strokeColor: "#ff0000",
                            strokeWidth: 2
                        },
                        "point": {
                            strokeColor: "#ff0000"
                        }
                    });
                    return self.styles ? Object.assign(_default, self.styles) : _default;
                };
                _getHighLightStyles = function () {
                    var _default = $.extend(true, {}, TC.Cfg.styles, {
                        "polygon": {
                            fillColor: "#0099FF",
                            fillOpacity: 0,
                            strokeColor: "#0099FF",
                            strokeWidth: 4
                        },
                        "polyline": {
                            strokeColor: "#0099FF",
                            strokeWidth: 4
                        },
                        "point": {
                            strokeColor: "#0099FF"
                        }
                    });
                    return self.highLightStyles ? Object.assign(_default, self.highLightStyles) : _default;
                };

                locale = map.options.locale;

                getLocaleString = function (key, texts) {
                    return TC.Util.getLocaleString(locale, key, texts);
                }
                resolve();
            });
        });
    };
    ctlProto.renderModalDialog = function (layer) {
        var path = layer.getPath();
        var renderDialogPromise = new Promise(function (resolve, reject) {
            layer.getWFSCapabilitiesPromise().then(function (capabilities) {
                _renderModalDialog(layer, path[path.length - 1], capabilities, function (modal) {
                    resolve(modal);
                });
            })
        });

        Promise.all([layer, renderDialogPromise, layer.getWFSCapabilitiesPromise()]).then(_renderQueryForm);
    };

})();
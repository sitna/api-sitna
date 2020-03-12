TC.control = TC.control || {};

/*pollyfill*/

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

if (!TC.filter) {
    TC.syncLoadJS(TC.apiLocation + 'TC/filter');
}
//cargo los objetos features si no, no resaltara las geometria
if (!TC.Feature) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Feature');
}
if (!TC.feature.Point) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Point');
}
if (!TC.feature.Polyline) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Polyline');
}
if (!TC.feature.Polygon) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/Polygon');
}
if (!TC.feature.MultiPolyline) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/MultiPolyline');
}
if (!TC.feature.MultiPolygon) {
    TC.syncLoadJS(TC.apiLocation + 'TC/feature/MultiPolygon');
}

TC.control.WFSQuery = function (options) {
    var self = this;

    TC.Control.apply(this, arguments);
    self.styles = self.options.styles;
    self.highlightStyles = self.options.highlightStyles || self.options.highLightStyles;
    self.download = self.options.download;

    const cs = '.' + self.CLASS;
    self._selectors = {
        ELEVATION_CHECKBOX: cs + '-dialog-elev input[type=checkbox]',
        INTERPOLATION_RADIO: 'input[type=radio][name=finfo-ip-coords]',
        INTERPOLATION_DISTANCE: cs + '-dialog-ip-m'
    };
};

TC.inherit(TC.control.WFSQuery, TC.Control);

(function () {
    var ctlProto = TC.control.WFSQuery.prototype;

    var cssClassLoading = "tc-loading";
    var modalBody = null;
    var modalDialog = null;
    var ctlResultsPanel = null;
    var resultLayer = null;
    var logicalOperator = TC.Consts.logicalOperator.AND;
    var timer = null;
    var timerAutocomplete = null;
    var controller = null;
    var locale = null;

    const empty= function (node) {
        if(node)
            while (node.children.length) {
                node.removeChild(node.children[0]);
            }
    };

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
    var _currentLayerName = null;
    var _currentLayercapabilities = null;
    var _currentLayerTitle = null;
    var _currentLayerURL = null;
    var _getStyles = function () { return null };
    var _getHighLightStyles = function () { return null };
    var getLocaleString = null;
    var downloadDialog = null;
    var type = null;
    ctlProto.CLASS = 'tc-ctl-wfsquery';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS + "-dialog"] = TC.apiLocation + "TC/templates/WFSQueryDialog.html";
    ctlProto.template[ctlProto.CLASS + "-form"] = TC.apiLocation + "TC/templates/WFSQueryForm.html";
    ctlProto.template[ctlProto.CLASS + "-filter"] = TC.apiLocation + "TC/templates/WFSQueryfilter.html";
    ctlProto.template[ctlProto.CLASS + "-table-object"] = TC.apiLocation + "TC/templates/WFSQueryResultsTableObject.html";


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
        const self = this;
        let layers;
        if (layer.getDisgregatedLayerNames) {
            layers = [];
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
        }
        else {
            layers = layer.featureType;
        }

        ctlProto.getRenderedHtml(ctlProto.CLASS + "-dialog",
            {
                layerName: getLocaleString("query.titleDialog", { "layerName": layerName }),
                layers: layers
            }, function (html) {                
                var d = document.createElement("div");
                d.insertAdjacentHTML('beforeEnd',html);
                var modal = null;
                if (d.childNodes.length > 0) {
                    modal = d.firstChild;
                    document.body.appendChild(modal);
                }
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
                    _sendQuery.apply(self, []);
                })
                if (callback) callback(modal);
            });
    };

    var _renderQueryForm = function (args) {
        var layer = args[0], dialog = args[1], capabilities = args[2];
        _currentLayer = layer;
        _currentLayercapabilities = capabilities;
        _currentLayerURL = capabilities.Operations.DescribeFeatureType.DCP.HTTP.Get["href"];
        _currentLayerURL = _currentLayerURL.substring(_currentLayerURL.indexOf(":") + 1);
        if (capabilities.Operations.GetFeature.CountDefault)
            _maxRecordCount = capabilities.Operations.GetFeature.CountDefault.DefaultValue;
        else
            _maxRecordCount = null;
        //analizamos si es una o varias capas, si es una agrupación la disgregamos 
        var layers = layer.getDisgregatedLayerNames ? layer.getDisgregatedLayerNames() : layer.featureType;
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
                    empty(form);
                    for (var i = 0; i < form.children.length; i++) form.removeChild(form.children[i]);
                    _clear();
                    return;
                }
                dialog.querySelector(".tc-modal-body .tc-ctl-wfsquery-message", dialog).classList.add(TC.Consts.classes.HIDDEN);
                _currentLayerTitle = this.options[this.selectedIndex].text;
                modalBody.classList.add(cssClassLoading);
                _currentLayerName = this.value;
                _currentLayer.describeFeatureType(this.value).then(function (data) {
                    var entries = Object.entries(data);
                    _manageDescribeFeature(entries.length > 1 ? data : entries[0][1], dialog);
                }, function () {
                    var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                    tbody.classList.remove(cssClassLoading);
                    tbody.insertAdjacentHTML('beforeend',"<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                    empty(tbody);
                });
            });
        }
        else if (layers.length === 1) {
            //comprabamos que la capa existe en el capabilities
            var layerCapabilities = capabilities.FeatureTypes[layers[0].substring(layers[0].indexOf(":") + 1)];
            if (layerCapabilities) {
                _currentLayerTitle = capabilities.FeatureTypes[layers[0].substring(layers[0].indexOf(":") + 1)].Title;
                _currentLayerName = layers[0];
                _currentLayer.describeFeatureType(layers[0]).then(function (data) {
                    var entries = Object.entries(data);
                    _manageDescribeFeature(entries.length > 1 ? data : entries[0][1], dialog);
                }, function () {
                    var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                    tbody.classList.remove(cssClassLoading);
                    tbody.insertAdjacentHTML('beforeend',"<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                    empty(tbody);
                });
            }
            else {
                var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                tbody.classList.remove(cssClassLoading);
                tbody.insertAdjacentHTML('beforeend',"<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                //TC.Util.closeModal();
                //layer.map.toast("Mal", { type: TC.Consts.msgType.WARNING });
            }

        }
        else {
            TC.Util.closeModal();
            layer.map.toast(TC.Util.getLocaleString(layer.map.options.locale, "query.LayerNotAvailable"), { type: TC.Consts.msgType.ERROR });
        }
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
        let objFiltered = {};
        for (var i in data) {
            if (!TC.Util.isGeometry(data[i].type)) {
                objFiltered[i] = data[i];
            }
        }
        data = objFiltered;
        ctlProto.getRenderedHtml(ctlProto.CLASS + "-form",
            {
                attributes: data
            }, function (html) {
                var form = dialog.getElementsByClassName("tc-modal-form")[0];
                empty(form);
                form.insertAdjacentHTML('beforeend', html);
                modalBody.classList.remove(cssClassLoading);
                TC.loadJS(
                    true,
                    [TC.apiLocation + 'TC/ui/autocomplete.js'],
                    function () {
                        console.log("autocomplete loaded");
                    });
                var combo = form.getElementsByClassName("tc-combo");
                if (combo.length == 0)
                    dialog.getElementsByClassName("tc-button tc-ctl-wlm-btn-launch")[0].setAttribute("disabled", "");
                else {
                    dialog.getElementsByClassName("tc-button tc-ctl-wlm-btn-launch")[0].removeAttribute("disabled");
                    combo[0].addEventListener("change", function () {
                        _changeAttributeEvent.apply(this, [form, data]);
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
                        var field = [].reduce.call(form.querySelectorAll('.tc-combo'), function (vi, va) {
                            return vi + (vi ? "/" : "") + va.value;
                        }, '');
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
                                valueToShow = parseInt(value, 10)
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
                            "isString": type.indexOf("string") >= 0,
                            "valueToShow": valueToShow
                        });

                        _renderFiltersConditions(form);
                        valueField.value = "";
                    });
                }
            });
    };
    
    var _manageComplexTypes = function (type, form) {

        var html = '';
        html += ('<option value="">' + getLocaleString('query.chooseAttrCombo') + '</option>');
        for (var key in type) {
            if (!type[key].type || TC.Util.isGeometry(type[key].type)) continue;    
            html += '<option value="' + (type[key].name || key) + '">' + key + '</option>';
        }
        var container = document.createElement("div")
        container.insertAdjacentHTML('beforeend', '<select class="' + this.className + '" name="' + this.name + '">' + html + '</select>');
        this.parentNode.parentNode.insertBefore(container, this.parentNode.nextSibling).firstElementChild.addEventListener("change", function () {
            _changeAttributeEvent.apply(this, [form, type]);
        });

    }
    var _changeAttributeEvent = function (form, data) {
        //borrar los hijos		
        var combo = this;
        combo.parentElement.parentElement.querySelectorAll("select").forEach(function (element) {
            if (combo.offsetTop < element.offsetTop) {
                element.parentElement.parentElement.removeChild(element.parentElement);
            }
        });

        var valueField = form.querySelector(".tc-ctl-wfsquery-where .tc-textbox");
        if (valueField.dataset["autocomplete"])
            TC.UI.autocomplete.call(valueField, "clear");
        if (!data[this.selectedOptions[0].text]) {
            form.getElementsByClassName("tc-ctl-wfsquery-numeric")[0].classList.add("tc-hidden");
            form.getElementsByClassName("tc-ctl-wfsquery-date")[0].classList.add("tc-hidden");
            form.getElementsByClassName("tc-ctl-wfsquery-text")[0].classList.add("tc-hidden");
            form.getElementsByClassName("tc-ctl-wfsquery-where")[0].classList.add("tc-hidden");
            form.getElementsByClassName("tc-ctl-wfsquery-operacion")[0].classList.add("tc-hidden");
            return;
        }
        type = data[this.selectedOptions[0].text].type;
        form.getElementsByClassName("tc-ctl-wfsquery-operacion")[0].classList.remove("tc-hidden");
        TC.UI.autocomplete.call(valueField, "clear");
        //$(valueField).unbind("keydown");
        destroyNumberMask();
        valueField.type = "search";
        form.querySelector(".tc-ctl-wfsquery-numeric").classList.add("tc-hidden");
        form.querySelector(".tc-ctl-wfsquery-text").classList.add("tc-hidden");
        form.querySelector(".tc-ctl-wfsquery-date").classList.add("tc-hidden");
        form.querySelector(".tc-ctl-wfsquery-where").classList.add("tc-hidden");
        switch (true) {
            case !type:
                console.log("type es nulo");
                break;
            case type instanceof Object:
                _manageComplexTypes.apply(this, [type, form]);                
                break;
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
                const value = [].slice.call(form.querySelectorAll('select[name=' + this.name + ']')).reduce(function (vi, va) { return vi + (vi ? "/" : "") + va.value; }, "");
                _autocompleteConstructor(valueField, value, form.getElementsByClassName(ctlProto.CLASS + "-list tc-ctl-search-list")[0]);
                break;
        }
    }
    var _renderFiltersConditions = function (form) {

        if (!dust.filters.numberSeparator)
            dust.filters.numberSeparator = function (value) {
                return value.toLocaleString(locale);
            };

        if (TC._hbs && !TC._hbs.helpers.numberSeparator) {
            TC._hbs.registerHelper("numberSeparator", function (value) {
                return value.toLocaleString(locale);
            });
        }

        var whereDiv = form.getElementsByClassName("tc-ctl-wfsquery-whereList")[0];
        empty(whereDiv);
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
        const self = this;
        if (!_validateQuery()) {
            _showMessage(getLocaleString("query.msgNoQueryFilter"));
            return;
        }
        modalDialog.getElementsByClassName("tc-modal-body")[0].classList.add(cssClassLoading);
        var _fncLoadVectorLayer = function () {
            var filtro = filterConstructor();

            _createResultPanel.apply(self, [_currentLayerTitle]);

            _currentLayer.toolProxification.cacheHost.getAction(_currentLayerURL).then(function (cacheHost) {
                const url = cacheHost.action(_currentLayerURL);
                if (!resultLayer) {
                    _createVectorLayer({
                        id: "WFSQueryResults",
                        type: TC.Consts.layerType.WFS,
                        url: url,
                        version: "1.1.0",
                        owner: self,
                        stealth: true,
                        geometryName: "the_geom",
                        featurePrefix: _currentLayerName.substring(0, _currentLayerName.indexOf(":")),
                        featureType: _currentLayerName.substring(_currentLayerName.indexOf(":") + 1),
                        properties: filtro,
                        outputFormat: TC.Consts.format.JSON,
                        styles: _getStyles()
                    });
                    map.on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                        if (e.control !== ctlResultsPanel)
                            return;
                        if (TC.browserFeatures.touch()) {
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
                    resultLayer.url = url;
                    resultLayer.featurePrefix = _currentLayerName.substring(0, _currentLayerName.indexOf(":"));
                    resultLayer.featureType = _currentLayerName.substring(_currentLayerName.indexOf(":") + 1);
                    resultLayer.properties = filtro;
                    resultLayer.setVisibility(true);
                    resultLayer.refresh();
                }
            });
        }
        _fncLoadVectorLayer();
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
            if (e.newData && e.newData.totalFeatures === 0) {
                modalDialog.getElementsByClassName("tc-modal-body")[0].classList.remove(cssClassLoading);
                _showMessage(getLocaleString("query.msgNoResults"), TC.Consts.msgType.INFO);
                return;
            }
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
            }
            e.layer.map.off(TC.Consts.event.LAYERUPDATE, _featuresUpdate);
        }
    };
    const _getLayerName = () => { return _currentLayerTitle };
    var _createResultPanel = function (layerName) {
        const self = this;
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
                    ctlResultsPanel.template[ctlResultsPanel.CLASS + "-table"] = TC.apiLocation + "TC/templates/WFSQueryResultsTable.html";
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
                            },
                            "download": () => { _downloadClickHandler(self, _getLayerName) }
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
                        },
                        "download": () => { _downloadClickHandler(self, _getLayerName) }, "position": "right"
                    }).then(fncResultPanelAdded);
                }
            }
            else {
                ctlResultsPanel.options.save.fileName = _layerName + ".xls";
                ctlResultsPanel.options.titles.max = ctlResultsPanel.getLocaleString('geo.trk.chart.exp');
            }
        });

        var _downloadClickHandler = function (_self, layerName) {
            const self = _self;
            new Promise(function (resolve, reject) {
                if (!downloadDialog) {
                    self.map.addControl('FeatureDownloadDialog').then(ctl => {
                        downloadDialog = ctl;
                        resolve(downloadDialog);
                    });
                }
                else {
                    resolve(downloadDialog);
                }
            }).then(function (control) {
                var options = {
                    title: layerName()
                };
                if (self.options.displayElevation !== true)
                    options = Object.assign({}, options, { elevation: Object.assign({}, self.map.elevation && self.map.elevation.options, self.options.displayElevation) });
                else
                    options = Object.assign({}, options, { elevation: self.map.elevation && self.map.elevation.options });

                //si algún elemento de la colección es un polígono exclyo el botón GPX
                if (resultLayer.features.some(function (feature) {
                    return (TC.feature.Polygon && feature instanceof TC.feature.Polygon) ||
                        (TC.feature.MultiPolygon && feature instanceof TC.feature.MultiPolygon);
                }))
                    options = Object.assign({}, options, { excludedFormats: ["GPX"] });

                control.open(resultLayer.features, options);
            });
        };
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
                var col = tabla.querySelectorAll(".table>tbody>tr")
                var dataTypes = _getDataTypes();
                var j = 1;
                for (var i in data[0]) {
                    if (dataTypes.hasOwnProperty(i)) {
                        if (dataTypes[i].type && !(dataTypes[i].type instanceof Object))
                            if ((dataTypes[i].type.indexOf("int") >= 0 ||
                                dataTypes[i].type.indexOf("float") >= 0 ||
                                dataTypes[i].type.indexOf("double") >= 0 ||
                                dataTypes[i].type.indexOf("long") >= 0 ||
                                dataTypes[i].type.indexOf("decimal") >= 0)) {
                                var tdNumeric = tabla.querySelectorAll("td:nth-child(" + j + ")");
                                for (var k = 0; k < tdNumeric.length; k++) {
                                    tdNumeric[k].classList.add("tc-numeric");
                                }
                            }
                        if (dataTypes[i].type && (dataTypes[i].type instanceof Object)) {
                            console.log("aki lo que sea");
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
                        var celdasHoja = this.querySelectorAll("td.value div");
                        if (celdasHoja.length > 0) {
                            celdasHoja.forEach(function (celda) {
                                if (celda.offsetWidth < celda.scrollWidth)
                                    celda.title = celda.innerText;
                            })
                        }
                        else
                            this.querySelectorAll("td").forEach(function (td) {
                                if (td.offsetWidth < td.scrollWidth)
                                    td.title = td.innerText;
                            });

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
                tabla.querySelectorAll(".complexAttr label,.complexAttr input").forEach(function (label) {
                    label.addEventListener("click", function (e) {
                        e.stopPropagation();
                    })
                });
                tabla.querySelectorAll(".complexAttr input").forEach(function (chkBox) {
                    chkBox.addEventListener("change", function (e) {
                        if (this.checked) {
                            this.nextElementSibling.querySelectorAll("td.value div").forEach(function (div) {
                                if (div.offsetWidth < div.scrollWidth)
                                    div.title = div.innerText;
                            });
                        }
                    })
                });

                ////se deshabilita el swipe para que se pueda hacer scroll horizontal del panel de resultados
                if (TC.browserFeatures.touch()) {
                    TC.Util.swipe(ctlResultsPanel.div, 'disable');
                }
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
            messageDiv.innerHTML = Message;
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
    var _getPossibleValues = async function (field, value) {
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

        if (controller) {
            controller.abort();
        }
        controller = new AbortController();
        let signal = controller.signal;

        try {
            var data = await _currentLayer.toolProxification.fetchJSON(_currentLayerURL, {
                data: TC.Util.WFSQueryBuilder([_currentLayerName], TC.filter.like(field, value, undefined, undefined, undefined, false), _capabilities, "JSON", false),
                contentType: "application/xml",
                method: "POST",
                signal: signal
            })
            if (data.features && data.features.length > 0) {
                var arr;
                if (data.features.length === 1)
                    arr = [field.split("/").reduce(function (vi, va) { return vi[va.substring(va.indexOf(":") + 1)] }, data.features[0].properties)];
                if (data.features.length > 1)
                    arr = data.features.reduce(function (pv, cv) {
                        if (pv && pv instanceof Array) {
                            if (pv.indexOf(cv.properties[field]) < 0)
                                return pv.concat(field.split("/").reduce(function (vi, va) { return vi[va.substring(va.indexOf(":") + 1)] }, cv.properties));
                            else
                                return pv;
                        }
                    }, []);
                //arr.sort();
                return arr;
            } else
                return [];
        }
        catch (err) {
            return null
        }
    };
    var _autocompleteConstructor = function (control, property, listCtrl) {

        TC.UI.autocomplete.call(control, {
            minLength: 3,
            target: listCtrl,
            source: function (text, callback) {
                var _self = this;
                _self.target.innerHTML = '<li><a class="tc-ctl-search-li-loading" href="#">' + getLocaleString("searching") + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>'
                _self.target.classList.remove("tc-hidden");
                if (timerAutocomplete)
                    window.clearTimeout(timerAutocomplete);
                timerAutocomplete = window.setTimeout(async function () {
                    var data = await _getPossibleValues(property, text)
                    if (data) {
                        if (data.length)
                            callback(data);
                        else
                            _self.target.classList.add("tc-hidden");
                    }
                }, 500);
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
                owner: self,
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

            _map.on(TC.Consts.event.LAYERERROR, (e) => {
                if (e.layer === resultLayer) {
                    modalDialog.getElementsByClassName("tc-modal-body")[0].classList.remove(cssClassLoading)
                    if (e.reason === TC.Consts.WFSErrors.MAX_NUM_FEATURES) {
                        _showMessage(getLocaleString("query.msgTooManyResults", { limit: e.data.limit }), TC.Consts.msgType.WARNING)
                    }                    
                    else {
                        console.error(e.reason);
                        _showMessage(getLocaleString("query.errorUndefined"), TC.Consts.msgType.ERROR);
                    }
                }
            })

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

            if (TC._hbs) {
                TC._hbs.registerHelper("countif", function (obj, excludedKeys) {
                    const excKeys = excludedKeys ? excludedKeys.split(',') : [];
                    let _count = 0
                    for (let k in obj) {
                        if (excKeys.indexOf(k) < 0) {
                            _count++;
                        }
                    }
                    return _count > 0;
                });
            }

            TC.Control.prototype.register.call(self, map).then(function (ctrl) {
                var self = ctrl;
                _getStyles = function () {
                    var styleFN = function (geomType, property) {
                        return this.options.styles && this.options.styles[geomType] ? (this.options.styles[geomType][property] || TC.Cfg.styles[geomType][property]) : TC.Cfg.styles[geomType][property]
                    }
                    return {
                        polygon: {
                            fillColor: styleFN.bind(self, 'polygon', 'fillColor'),
                            fillOpacity: styleFN.bind(self, 'polygon', 'fillOpacity'),
                            strokeColor: styleFN.bind(self, 'polygon', 'strokeColor'),
                            strokeOpacity: styleFN.bind(self, 'polygon', 'strokeOpacity'),
                            strokeWidth: styleFN.bind(self, 'polygon', 'strokeWidth')
                        },
                        line: {
                            strokeColor: styleFN.bind(self, 'line', 'strokeColor'),
                            strokeOpacity: styleFN.bind(self, 'line', 'strokeOpacity'),
                            strokeWidth: styleFN.bind(self, 'line', 'strokeWidth')
                        },
                        point: {
                            radius: styleFN.bind(self, 'point', 'radius'),
                            height: styleFN.bind(self, 'point', 'height'),
                            width: styleFN.bind(self, 'point', 'width'),
                            fillColor: styleFN.bind(self, 'point', 'fillColor'),
                            fillOpacity: styleFN.bind(self, 'point', 'fillOpacity'),
                            strokeColor: styleFN.bind(self, 'point', 'strokeColor'),
                            strokeWidth: styleFN.bind(self, 'point', 'strokeWidth'),
                            fontSize: styleFN.bind(self, 'point', 'fontSize'),
                            fontColor: styleFN.bind(self, 'point', 'fontColor'),
                            labelOutlineColor: styleFN.bind(self, 'point', 'labelOutlineColor'),
                            labelOutlineWidth: styleFN.bind(self, 'point', 'labelOutlineWidth'),
                            label: styleFN.bind(self, 'point', 'label'),
                            angle: styleFN.bind(self, 'point', 'angle')
                        }
                    }
                };
                _getHighLightStyles = function () {
                    var _default = {
                        "polygon": TC.Util.extend(true, {}, TC.Cfg.styles.polygon, {
                            fillColor: "#0099FF",
                            fillOpacity: 1,
                            strokeColor: "#0099FF",
                            strokeWidth: 2
                        }),
                        "line": TC.Util.extend(true, {}, TC.Cfg.styles.line, {
                            strokeColor: "#0099FF",
                            strokeWidth: 2
                        }),
                        "point": TC.Util.extend(true, {}, TC.Cfg.styles.point, {
                            strokeColor: "#0099FF"
                        })
                    };
                    return self.highlightStyles ? {
                        "polygon": TC.Util.extend(true, {}, _default.polygon, self.highlightStyles.polygon ? self.highlightStyles.polygon : {}),
                        "line": TC.Util.extend(true, {}, _default.line, self.highlightStyles.line ? self.highlightStyles.line : {}),
                        "point": TC.Util.extend(true, {}, _default.point, self.highlightStyles.point ? self.highlightStyles.point : {})
                    } : _default;
                };

                locale = map.options.locale;

                getLocaleString = function (key, texts) {
                    return TC.Util.getLocaleString(locale, key, texts);
                }

                map.ready(function () {
                    map.getControlsByClass('TC.control.WorkLayerManager').forEach(function (ctl) {
                        ctl.addLayerTool({
                            renderFn: function (container, layerId) {
                                const className = self.CLASS + '-btn-open';
                                let button = container.querySelector('button.' + className);
                                if (!button) {
                                    const layer = map.getLayer(layerId);
                                    if (layer.type === TC.Consts.layerType.WMS || layer.type === TC.Consts.layerType.WFS) {
                                        const text = self.getLocaleString('query.tooltipMagnifBtn');
                                        button = document.createElement('button');
                                        button.innerHTML = text;
                                        button.setAttribute('title', text);
                                        button.classList.add(className);
                                        button.dataset.layerId = layerId;
                                        container.appendChild(button);
                                        if (layer.type === TC.Consts.layerType.WMS) {
                                            button.classList.add(TC.Consts.classes.LOADING);
                                            layer.getWFSCapabilities().then((WFSCapabilities) => {
                                                //check si tiene GetFeature Disponible
                                                if (!WFSCapabilities.Operations.GetFeature) {
                                                    button.classList.add(TC.Consts.classes.HIDDEN);
                                                    return;
                                                }
                                                //check si las capas hijas están en capabilties WFS
                                                var layers = layer.getDisgregatedLayerNames ? layer.getDisgregatedLayerNames() : layer.featureType;
                                                layers = layers.filter(function (l) {
                                                    return WFSCapabilities.FeatureTypes.hasOwnProperty(l.substring(l.indexOf(":") + 1));
                                                });
                                                if (!layers.length) {
                                                    button.classList.add(TC.Consts.classes.HIDDEN);
                                                    return;
                                                }
                                            }).catch(() => button.classList.add(TC.Consts.classes.HIDDEN))
                                            .finally(() => button.classList.remove(TC.Consts.classes.LOADING));
                                        }
                                    }
                                }
                                return button;
                            },
                            updateEvents: [],
                            actionFn: function () {
                                const button = this;
                                if (button.classList.contains('tc-unavailable') || button.classList.contains('tc-loading')) {
                                    return;
                                }
                                const layer = self.map.getLayer(button.dataset.layerId);
                                self.renderModalDialog(layer);
                            }
                        });
                    });
                });

                resolve(self);
            });
        });
    };
    ctlProto.renderModalDialog = function (layer) {
        const self = this;
        let title;
        let capabilitiesPromise;
        if (layer.type === TC.Consts.layerType.WMS) {
            const path = layer.getPath();
            title = path[path.length - 1];
            capabilitiesPromise = layer.getWFSCapabilities();
        }
        else if (layer.type === TC.Consts.layerType.WFS) {
            title = layer.title;
            capabilitiesPromise = layer.getCapabilitiesPromise();
        }
        else {
            return;
        }
        let renderDialogPromise = new Promise(function (resolve, reject) {
            capabilitiesPromise.then(function (capabilities) {
                _renderModalDialog.apply(self, [
                    layer,
                    title,
                    capabilities,
                    function (modal) {
                        resolve(modal);
                    }]);
            })
        });

        Promise.all([layer, renderDialogPromise, capabilitiesPromise]).then(_renderQueryForm);
    };

})();
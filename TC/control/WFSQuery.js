/// <reference path="popup.js" />

/**
  * Opciones de control de consultas.
  * 
  * Algunos servidores tienen servicios WMS y WFS que actúan en paralelo, es decir, están alojados dentro del mismo nombre de host y publican las mismas capas.
  * Si el control `WFSQuery` está en el mapa, verifica si las capas de servicios WMS están asociadas a un WFS paralelo. Si es así, ofrece un interfaz de usuario
  * para poder hacer consultas a la capa en base a los valores de las propiedades de los elementos de la capa. Esta interfaz de usuario es accesible desde el control
  * `workLayerManager`.
  * @typedef WFSQueryOptions
  * @see MapControlOptions
  * @property {StyleOptions} [styles] - Opciones de estilo de las geometrías de las entidades resultado de la consulta.
  * @property {StyleOptions} [highlightStyles] - Opciones de estilo de las geometrías de las entidades resaltadas.
  * @example <caption>[Ver en vivo](../examples/cfg.WFSQueryOptions.html)</caption> {@lang html}
  * <div id="mapa" />
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Añadimos el control de capas cargadas en la primera posición.
  *     SITNA.Cfg.controls.workLayerManager = {
  *         div: "slot1"
  *     };
  *     //Si se añade el control WFSQuery, el control busca un servicio WFS pareado al WMS de cada capa añadida al mapa y si lo encuentra habilita la lupa que da acceso al constructor de consultas.
  *     SITNA.Cfg.controls.WFSQuery = {
  *         //Establecemos el estilo de las geometrías de las entidades resultado de la consulta
  *         styles: {
  *             //Estilo de polígonos y multipolígonos
  *             polygon: {
  *                 strokeColor: "#057f28",
  *                 strokeWidth: 4,
  *                 fillColor: "#057f28",
  *                 fillOpacity: 0.3
  *             },
  *             //Estilo de polilíneas y multipolilíneas
  *             line: {
  *                 strokeColor: "#057f28",
  *                 strokeWidth: 4
  *             },
  *             //Estilo de puntos y multipuntos
  *             point: {
  *                 strokeColor: "#057f28"
  *             }
  *         },
  *         //Establecemos el estilo de las geometrías de las entidades resaltadas
  *         highlightStyles: {
  *             //Estilo de polígonos y multipolígonos
  *             polygon: {
  *                 strokeColor: "#ff7f27",
  *                 strokeWidth: 4,
  *                 fillColor: "#ff7f27",
  *                 fillOpacity: 0.3
  *             },
  *             //Estilo de polilíneas y multipolilíneas
  *             line: {
  *                 strokeColor: "#ff7f27",
  *                 strokeWidth: 4
  *             },
  *             //Estilo de puntos y multipuntos
  *             point: {
  *                 strokeColor: "#ff7f27"
  *             }
  *         }
  *     };
  *     var map = new SITNA.Map("mapa", {
  *         workLayers: [{
  *             id: "paisajes",
  *             title: "Paisajes singulares",
  *             type: SITNA.Consts.layerType.WMS,
  *             url: "//idena.navarra.es/ogc/wms",
  *             layerNames: "IDENA:BIODIV_Pol_PaisajesSing"
  *         },
  *         {
  *             id: "meteorologia",
  *             title: "Meteorología",
  *             type: SITNA.Consts.layerType.WMS,
  *             url: "//idena.navarra.es/ogc/wms",
  *             layerNames: "IDENA:estacMeteor"
  *         },
  *         {
  *             id: "plazaola",
  *             title: "Vía Verde del Plazaola",
  *             type: SITNA.Consts.layerType.WMS,
  *             url: "//idena.navarra.es/ogc/wms",
  *             layerNames: "IDENA:DOTACI_Lin_VVPlazaola"
  *         }]
  *     });
  * </script>
  */

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

if (!TC.control.infoShare) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/infoShare');
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

    self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
    if (!self.options.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
    }

    self.exportsState = true;

    self.styles = self.options.styles;
    self.highlightStyles = self.options.highlightStyles || self.options.highLightStyles;
    self.download = self.options.download;
    self.resultsPanel = null;
    self.geometryPanel = null;
    self.filters = [];
    self.styles = TC.Util.extend(true, {
        polygon: {
            strokeColor: self.DEFAULT_STROKE_COLOR,
            strokeWidth: 2, fillColor: "#000",
            fillOpacity: 0.3
        },
        line: {
            strokeColor: self.DEFAULT_STROKE_COLOR,
            strokeWidth: 2, fillColor: "#000"
        }
    }, self.options.styles);

    const cs = '.' + self.CLASS;
    self._selectors = {
        ELEVATION_CHECKBOX: cs + '-dialog-elev input[type=checkbox]',
        INTERPOLATION_RADIO: 'input[type=radio][name=finfo-ip-coords]',
        INTERPOLATION_DISTANCE: cs + '-dialog-ip-m'
    };
};

TC.inherit(TC.control.WFSQuery, TC.Control);
TC.mix(TC.control.WFSQuery, TC.control.infoShare);

(function () {
    const ctlProto = TC.control.WFSQuery.prototype;
    ctlProto.DEFAULT_STROKE_COLOR = '#0000ff';

    const loadingCssClass = TC.Consts.classes.LOADING;
    const hiddenCssClass = TC.Consts.classes.HIDDEN;
    const spatialCssClass = 'tc-spatial';
    var modalBody = null;
    var logicalOperator = TC.Consts.logicalOperator.AND;
    var timer = null;
    var timerAutocomplete = null;
    var controller = null;
    var locale = null;

    const empty = function (node) {
        if (node)
            while (node.children.length) {
                node.removeChild(node.children[0]);
            }
    };

    const getTemplateObjFromFilter = function (ctl, filter) {
        const isSpatial = filter instanceof TC.filter.Spatial;
        return {
            field: isSpatial ? ctl.getLocaleString('geometry') : filter.propertyName,
            opText: ctl.getLocaleString(filterByOperation[filter._abbr].key),
            valueToShow: filter._valueToShow,
            isSpatial: isSpatial
        }
    };

    const filterByOperation = {
        eq: {
            Ctor: TC.filter.equalTo,
            key: 'query.equalTo'
        },
        neq: {
            Ctor: TC.filter.notEqualTo,
            key: 'query.notEqualTo'
        },
        gt: {
            Ctor: TC.filter.greaterThan,
            key: 'query.greaterThan'
        },
        lt: {
            Ctor: TC.filter.lessThan,
            key: 'query.lowerThan'
        },
        gte: {
            Ctor: TC.filter.greaterThanOrEqualTo,
            key: 'query.greaterThanOrEqualTo'
        },
        lte: {
            Ctor: TC.filter.lessThanOrEqualTo,
            key: 'query.lowerThanOrEqualTo'
        },
        contains: {
            Ctor: TC.filter.like,
            key: 'query.contains'
        },
        starts: {
            Ctor: TC.filter.like,
            key: 'query.startsBy'
        },
        ends: {
            Ctor: TC.filter.like,
            key: 'query.endsBy'
        },
        btw: {
            Ctor: TC.filter.between,
            key: 'query.equalTo'
        },
        nbtw: {
            key: 'query.notEqualTo'
        },
        intersects: {
            Ctor: TC.filter.like,
            key: 'query.intersects'
        },
        within: {
            Ctor: TC.filter.between,
            key: 'query.within'
        },
        empty: {
            Ctor: TC.filter.equalTo,
            key: 'query.empty'
        },
        null: {
            Ctor: TC.filter.isNull,
            key: 'query.empty'
        }
    };

    var _currentLayer = null;
    var _currentLayerName = null;
    var _currentLayercapabilities = null;
    var _currentLayerTitle = null;
    var _currentLayerURL = null;
    var _getStyles = function () { return null };
    var _getHighLightStyles = function () { return null };
    var getLocaleString = null;
    var type = null;
    ctlProto.CLASS = 'tc-ctl-wfsquery';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS + "-dialog"] = TC.apiLocation + "TC/templates/tc-ctl-wfsquery-dialog.hbs";
    ctlProto.template[ctlProto.CLASS + "-form"] = TC.apiLocation + "TC/templates/tc-ctl-wfsquery-form.hbs";
    ctlProto.template[ctlProto.CLASS + "-filter"] = TC.apiLocation + "TC/templates/tc-ctl-wfsquery-filter.hbs";
    ctlProto.template[ctlProto.CLASS + "-table"] = TC.apiLocation + "TC/templates/tc-ctl-wfsquery-table.hbs";
    ctlProto.template["tc-ctl-finfo-attr-val"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-attr-val.hbs";
    ctlProto.template["tc-ctl-finfo-object"] = TC.apiLocation + "TC/templates/tc-ctl-finfo-object.hbs";
    ctlProto.template[ctlProto.CLASS + "-geom"] = TC.apiLocation + "TC/templates/tc-ctl-wfsquery-geom.hbs";
    ctlProto.template[ctlProto.CLASS + "-share-dialog"] = TC.apiLocation + "TC/templates/tc-ctl-wfsquery-share-dialog.hbs";


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
            return new Date(input.value).toLocaleDateString(locale,{timeZone: "UTC" })
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

    const _changeAttributeEvent = function (form, data) {
        //borrar los hijos		
        var combo = this;
        combo.parentElement.parentElement.querySelectorAll("select").forEach(function (element) {
            if (combo.offsetTop < element.offsetTop) {
                element.parentElement.parentElement.removeChild(element.parentElement);
            }
        });

        const numericSection = form.querySelector(`.${ctlProto.CLASS}-numeric`);
        const textSection = form.querySelector(`.${ctlProto.CLASS}-text`);
        const dateSection = form.querySelector(`.${ctlProto.CLASS}-date`);
        const geomSection = form.querySelector(`.${ctlProto.CLASS}-geom`);
        const whereSection = form.querySelector(`.${ctlProto.CLASS}-where`);
        const opSection = form.querySelector(`.${ctlProto.CLASS}-op`);
        var valueField = whereSection.querySelector(".tc-textbox");
        valueField.disabled = false;
        if (valueField.dataset["autocomplete"]) {
            TC.UI.autocomplete.call(valueField, "clear");
        }
        numericSection.classList.add(hiddenCssClass);
        dateSection.classList.add(hiddenCssClass);
        textSection.classList.add(hiddenCssClass);
        geomSection.classList.add(hiddenCssClass);
        whereSection.classList.add(hiddenCssClass);
        if (!data[this.selectedOptions[0].value.substring(this.selectedOptions[0].value.indexOf(":") + 1)]) {
            opSection.classList.add(hiddenCssClass);
            return;
        }
        type = data[this.selectedOptions[0].value.substring(this.selectedOptions[0].value.indexOf(":") + 1)].type;
        opSection.classList.remove(hiddenCssClass);
        TC.UI.autocomplete.call(valueField, "destroy");
        //$(valueField).unbind("keydown");
        destroyNumberMask();
        valueField.type = "search";
        switch (true) {
            case !type:
                console.log("type es nulo");
                break;
            case type instanceof Object:
                _manageComplexTypes.apply(this, [type, form]);
                break;
            case TC.Util.isGeometry(type):
                geomSection.classList.remove(hiddenCssClass);
                whereSection.classList.remove(hiddenCssClass);
                whereSection.classList.add(spatialCssClass);

                if (geomSection.querySelectorAll("input:checked").length === 0) {
                    geomSection.firstElementChild.checked = true;
                }
                _destroyDateMask();
                //const value = [].slice.call(form.querySelectorAll('select[name=' + this.name + ']')).reduce(function (vi, va) { return vi + (vi ? "/" : "") + va.value; }, "");
                //_autocompleteConstructor(valueField, value, form.getElementsByClassName(ctlProto.CLASS + "-list tc-ctl-search-list")[0]);
                break;
            case type.indexOf("int") >= 0:
            case type.indexOf("float") >= 0:
            case type.indexOf("double") >= 0:
            case type.indexOf("long") >= 0:
            case type.indexOf("decimal") >= 0:
                numericSection.classList.remove(hiddenCssClass);
                whereSection.classList.remove(hiddenCssClass, spatialCssClass);

                if (numericSection.querySelectorAll("input:checked").length === 0) {
                    numericSection.firstElementChild.checked = true;
                }
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
            case type.indexOf("date") >= 0:            

                dateSection.classList.remove(hiddenCssClass);
                whereSection.classList.remove(hiddenCssClass, spatialCssClass);

                if (dateSection.querySelectorAll("input:checked").length === 0) {
                    dateSection.firstElementChild.checked = true;
                }
                _createDateMask(valueField);
                break;            
            case type.indexOf("string") >= 0:
                textSection.classList.remove(hiddenCssClass);
                whereSection.classList.remove(hiddenCssClass, spatialCssClass);

                if (textSection.querySelectorAll("input:checked").length === 0) {
                    textSection.firstElementChild.checked = true;
                }
                _destroyDateMask();
                const value = [].slice.call(form.querySelectorAll('select[name=' + this.name + ']')).reduce(function (vi, va) { return vi + (vi ? "/" : "") + va.value; }, "");
                _autocompleteConstructor(valueField, value, form.getElementsByClassName(ctlProto.CLASS + "-list tc-ctl-search-list")[0]);
                break;
        }
    };

    const _renderFilterConditions = function (ctl) {
        const form = ctl.getForm();
        const whereDiv = form.querySelector(`.${ctl.CLASS}-where-list`);
        empty(whereDiv);
        ctlProto.getRenderedHtml(ctl.CLASS + "-filter", {
            conditions: ctl.filters.map(f => getTemplateObjFromFilter(ctl, f))
        }, function (html) {
            whereDiv.innerHTML = html;
            whereDiv.querySelectorAll(`.${ctl.CLASS}-where-cond-view`).forEach(function (btn, idx) {
                btn.addEventListener(TC.Consts.event.CLICK, function () {
                    ctl.map.zoomToFeatures([ctl.filters.filter(f => f instanceof TC.filter.Spatial)[idx].geometry]);
                    ctl.showGeometryPanel();
                }, { passive: true });
            });
            form.querySelectorAll(`.${ctl.CLASS}-del-cond`).forEach(function (btn, idx) {
                btn.addEventListener(TC.Consts.event.CLICK, function () {
                    ctl.removeFilter(idx);
                }, { passive: true });
            });
        });
    }

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
        if (form.querySelector('input.tc-textbox').value.trim() === "" && (opcion.value !== "empty" && opcion.value !== "null")) {
            _showMessage(getLocaleString("query.msgNoValueCondition"));
            return false;
        }
        return true;
    };

    const _getLayerName = () => { return _currentLayerTitle };

    var _createResultPanel = function (layerName) {
        const self = this;
        var _layerName = layerName;
        var _downloadClickHandler = function (_self, layerName) {
            const self = _self;
            self.getDownloadDialog().then(function (control) {
                var options = {
                    title: layerName()
                };
                if (self.map.elevation || self.options.displayElevation) {
                    options = Object.assign({}, options, {
                        elevation: Object.assign({}, self.map.elevation && self.map.elevation.options, self.options.displayElevation)
                    });
                }

                control.open(self.resultsLayer.features, options);
            });
        };
        return new Promise(async function (resolve) {
            if (!self.resultsPanel) {
                var ccontainer = self.map.getControlsByClass(TC.control.ControlContainer);
                const panelOptions = {
                    content: "table",
                    titles: {
                        main: "",
                        max: ""
                    },
                    save: {
                        fileName: _layerName + ".xls"
                    },
                    download: () => _downloadClickHandler(self, _getLayerName),
                    share: true,
                    resize: true
                };
                if (ccontainer.length == 0) {
                    self.resultsPanel = await self.map.addControl('resultsPanel', panelOptions);
                    self.resultsPanel.caller = self;
                }
                else {
                    panelOptions.position = "right";
                    self.resultsPanel = await ccontainer[0].addControl('resultsPanel', panelOptions);
                    self.resultsPanel.caller = self;
                }
                self.resultsPanel.template[self.resultsPanel.CLASS + "-table"] = self.template[self.CLASS + "-table"];
            }
            else {
                self.resultsPanel.options.save.fileName = _layerName + ".xls";
            }
            self.resultsPanel.options.titles.max = self.resultsPanel.getLocaleString('geo.trk.chart.exp');
            resolve();
        });
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
            messageDiv.classList.remove(hiddenCssClass);
        }
        timer = setTimeout(function () {
            timer = null;
            messageDiv.classList.add(hiddenCssClass);
        }, 3000)
    };
    var _getPossibleValues = async function (field, value) {
        var _capabilities = Object.assign({}, _currentLayercapabilities);
        switch (document.querySelector(".tc-ctl-wfsquery.tc-ctl-wfsquery-text input:checked").value) {
            case "starts":
                value = (value + "*");
                break;
            case "contains":
            case "eq":
                value = ("*" + value + "*");
                break;
            case "ends":
                value = ("*" + value);
                break;
        }

        if (controller) {
            controller.abort();
        }
        controller = new AbortController();
        let signal = controller.signal;

        try {
            var data = await _currentLayer.toolProxification.fetch(_currentLayerURL, {
                //URI:si el valor de field contiene "/" se supone que es un dato compuesto entonces no establezco propiedades a devolver sino que se deja vacío para que devuelva todos.
                data: TC.Util.WFGetPropertyValue(_currentLayerName, field.indexOf("/") >= 0 ? false : field, TC.filter.like(field, value, undefined, undefined, undefined, false), _capabilities),//TC.Util.WFSQueryBuilder([_currentLayerName], TC.filter.like(field, value, undefined, undefined, undefined, false), _capabilities, "JSON", false),
                contentType: "application/xml",
                method: "POST",
                signal: signal
            })

            if (data.contentType.startsWith("application/xml") || data.contentType.startsWith("text/xml")) {
                let xmlDoc = new DOMParser().parseFromString(data.responseText, "text/xml");
                let error = xmlDoc.querySelector("Exception ExceptionText");
                if (error) {
                    _showMessage(error.innerHTML, TC.Consts.msgType.ERROR);
                    return [];
                }
                //parser de features XML
                var arr = [];
                xmlDoc.querySelectorAll("member > *").forEach(function (item) { if (arr.indexOf(item.innerHTML) < 0) arr[arr.length] = item.innerHTML });
                return arr;

            }
            if (data.contentType.startsWith("application/json")) {
                data = JSON.parse(data.responseText);
            }
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
            if (err instanceof DOMException && err.name !== "AbortError")
                _showMessage(err, TC.Consts.msgType.ERROR);
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
                _self.target.classList.remove(hiddenCssClass);
                if (timerAutocomplete)
                    window.clearTimeout(timerAutocomplete);
                timerAutocomplete = window.setTimeout(async function () {
                    if (!document.querySelector(".tc-ctl-wfsquery.tc-ctl-wfsquery-text").classList.contains(TC.Consts.classes.HIDDEN)) {
                        var data = await _getPossibleValues(property, text)
                        if (data) {
                            if (data.length)
                                callback(data.sort());
                            else
                                _self.target.classList.add(hiddenCssClass);
                        }
                    }
                }, 500);
            },
            callback: function (e) {
                control.value = e.currentTarget.dataset["value"];
                this.target.classList.add(hiddenCssClass);
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
            listCtrl.classList.add(hiddenCssClass);
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
        pattern = new RegExp(pattern.replace(/\W/g, ''), "gi");
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

        return self._set1stRenderPromise(Promise.all([
            TC.Control.prototype.render.call(self, callback),
            self.getRenderedHtml(self.CLASS + '-share-dialog', {}, function (html) {
                self._dialogDiv.innerHTML = html;
            })
        ]));
    };

    ctlProto.register = function (map) {
        const self = this;
        return new Promise(function (resolve, reject) {

            map.on(TC.Consts.event.LAYERERROR, (e) => {
                if (e.layer === self.resultsLayer) {
                    if (self.modalDialog) {
                        self.modalDialog.getElementsByClassName("tc-modal-body")[0].classList.remove(loadingCssClass);
                    }
                    if (e.reason === TC.Consts.WFSErrors.MAX_NUM_FEATURES) {
                        _showMessage(getLocaleString("query.msgTooManyResults", { limit: e.data.limit }), TC.Consts.msgType.WARNING)
                    }
                    else {
                        console.error(e.reason);
                        _showMessage(getLocaleString("query.errorUndefined"), TC.Consts.msgType.ERROR);
                    }
                }
            })

            TC.Control.prototype.register.call(self, map).then(function (ctrl) {
                var self = ctrl;

                if (TC._hbs && !TC._hbs.helpers.formatNumber) {
                    TC._hbs.registerHelper("formatNumber", function (value) {
                        return value.toLocaleString(locale);
                    });
                }

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
                                            button.classList.add(loadingCssClass);
                                            layer.getWFSCapabilities().then((WFSCapabilities) => {
                                                //check si tiene GetFeature Disponible
                                                if (!WFSCapabilities.Operations.GetFeature) {
                                                    button.classList.add(hiddenCssClass);
                                                    return;
                                                }
                                                //check si las capas hijas están en capabilties WFS
                                                var layers = layer.getDisgregatedLayerNames ? layer.getDisgregatedLayerNames() : layer.featureType;
                                                layers = layers.filter(function (l) {
                                                    return WFSCapabilities.FeatureTypes.hasOwnProperty(l.substring(l.indexOf(":") + 1));
                                                });
                                                if (!layers.length) {
                                                    button.classList.add(hiddenCssClass);
                                                    return;
                                                }
                                            }).catch(() => button.classList.add(hiddenCssClass))
                                                .finally(() => button.classList.remove(loadingCssClass));
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

                self.getShareDialog().then(function () {
                    resolve(self);
                }).catch(function (err) {
                    reject(err instanceof Error ? err : Error(err));
                });
            });
        });
    };

    const _onFeaturesUpdate = function (e) {
        const ctl = e.layer.owner;
        if (ctl && e.layer == ctl.resultsLayer) {            
            if (e.newData && e.newData.totalFeatures === 0) {
                ctl.modalDialog.getElementsByClassName("tc-modal-body")[0].classList.remove(loadingCssClass);
                _showMessage(getLocaleString("query.msgNoResults"), TC.Consts.msgType.INFO);
                return;
            }
            var features = e.layer.features;
            if (features.length > 0) {
                if (ctl.toShare && ctl.toShare.doZoom) {                    
                    ctl._setQueryToSearch({ doZoom: false });
                    ctl.map.zoomToFeatures(features);
                }
                const serviceAttrName = 'h3_' + ctl.getLocaleString('service');
                const layerAttrName = 'h4_' + ctl.getLocaleString('layer');
                const title_separator = ctl.map.getControlsByClass(TC.control.Click).some((c) => { return c.TITLE_SEPARATOR }) ? ctl.map.getControlsByClass(TC.control.Click).find((c) => { return c.TITLE_SEPARATOR }).TITLE_SEPARATOR : ' • ';
                
				for(var i=0;i<features.length;i++){
					const path = _currentLayer.getPath(_currentLayerName).slice(1)
					if (path) {
						const newData = {};
						newData[serviceAttrName] = _currentLayer.title;
                        newData[layerAttrName] = path.join(title_separator);						
						const allData = TC.Util.extend(newData, features[i].getData());
						features[i].clearData();
						features[i].setData(allData);
					}
				}
                ctl.showResultsPanel(
                    (features.length > 1 ?
                        features.reduce(function (vi, va, index) {
                            return (vi instanceof Array ? vi : [vi.data]).concat([va.data])
                        })
                        :
                        [features[0].data])
                    , _currentLayerTitle);
            }

            e.layer.map.off(TC.Consts.event.LAYERUPDATE, _onFeaturesUpdate);
        }
    };

    const _onBeforeApplyQuery = function (e) {
        const ctl = e.layer.owner;
        if (ctl && e.layer == ctl.resultsLayer && e.query) {
            ctl._setQueryToSearch({ filter: e.query });
        }
    };

    ctlProto._sendQuery = async function (filter) {
        const self = this;

        if (_currentLayer && _currentLayerName && _currentLayerTitle && filter) {
            var _url = await _currentLayer.getWFSURL();
            await _createResultPanel.apply(self, [_currentLayerTitle]);
            _currentLayer.toolProxification.cacheHost.getAction(_url).then(function (cacheHost) {
                const url = cacheHost.action(_url);
                if (self.resultsLayer && self.resultsLayer.url !== url) {
                    self.map.removeLayer(self.resultsLayer);
                    self.resultsLayer = null;
                }
                if (!self.resultsLayer) {
                    self.map.on(TC.Consts.event.BEFOREAPPLYQUERY, _onBeforeApplyQuery);
                    self.map
                        .addLayer({
                            id: "WFSQueryResults",
                            type: TC.Consts.layerType.WFS,
                            url: url,
                            owner: self,
                            stealth: true,
                            geometryName: "the_geom",
                            featurePrefix: _currentLayerName.substring(0, _currentLayerName.indexOf(":")),
                            featureType: _currentLayerName.substring(_currentLayerName.indexOf(":") + 1),
                            properties: filter,
                            outputFormat: TC.Consts.format.JSON,
                            styles: _getStyles()
                        })
                        .then(function (layer) {
                            self.resultsLayer = layer;                            
                            layer.map.on(TC.Consts.event.LAYERUPDATE, _onFeaturesUpdate);
                        });

                    self.map.on(TC.Consts.event.RESULTSPANELCLOSE, function (e) {
                        if (e.control !== self.resultsPanel)
                            return;
                        if (TC.browserFeatures.touch()) {
                            TC.Util.swipe(e.control.div, "enable");
                        }
                        self.resultsLayer.clearFeatures();
                        self.resultsLayer.setVisibility(false);
                        self.clearFilters();
                        self.map.off(TC.Consts.event.LAYERUPDATE, _onFeaturesUpdate);
                        self.map.off(TC.Consts.event.BEFOREAPPLYQUERY, _onBeforeApplyQuery);
                        delete self.toShare;
                    });
                }
                else {
                    self.map.off(TC.Consts.event.BEFOREAPPLYQUERY, _onBeforeApplyQuery);
                    self.map.on(TC.Consts.event.BEFOREAPPLYQUERY, _onBeforeApplyQuery);
                    self.resultsLayer.setVisibility(false);
                    self.resultsLayer.clearFeatures();
                    //borro el evento featureUpdate por si hago una búsqueda sin cerra el panel previamente
                    self.map.off(TC.Consts.event.LAYERUPDATE, _onFeaturesUpdate);
                    self.map.on(TC.Consts.event.LAYERUPDATE, _onFeaturesUpdate);
                    self.resultsLayer.url = url;
                    self.resultsLayer.featurePrefix = _currentLayerName.substring(0, _currentLayerName.indexOf(":"));
                    self.resultsLayer.featureType = _currentLayerName.substring(_currentLayerName.indexOf(":") + 1);
                    self.resultsLayer.properties = filter;
                    self.resultsLayer.setVisibility(true);
                    self.resultsLayer.refresh();
                }
            });
        }
    };

    ctlProto.sendQuery = async function () {
        const self = this;
        if (!self.validateQuery()) {
            _showMessage(getLocaleString("query.msgNoQueryFilter"));
            return;
        }
        self.modalDialog.getElementsByClassName("tc-modal-body")[0].classList.add(loadingCssClass);

        let filter;
        if (self.filters.length > 1) {
            const condition = self.modalDialog.querySelector(".tc-ctl-wfsquery-logOpRadio:checked").value;
            filter = TC.filter[TC.Consts.logicalOperator[condition]].apply(null, self.filters);
        }
        else {
            filter = self.filters[0];
        }

        self._sendQuery.call(self, filter);
    };

    ctlProto._setQueryToSearch = function (options) {
        const self = this;
        if (Object.keys(options).length === 1 && options.hasOwnProperty("doZoom")) {
            self.toShare = TC.Util.extend(self.toShare, { doZoom: options.doZoom });
        } else if (options.filter || self.resultsLayer && self.resultsLayer.properties instanceof TC.filter.Filter) {
            self.toShare = TC.Util.extend(self.toShare, {
                wms: {
                    url: _currentLayer.url, names: _currentLayer.names
                },
                title: _currentLayerTitle,
                name: _currentLayerName,
                filter: options.filter ? options.filter : self.resultsLayer.properties.getText(),
                doZoom: options.hasOwnProperty('doZoom') ? options.doZoom : true
            });
        }   
    };

    ctlProto._getQueryToSearch = function () {
        const self = this;
        return self.toShare;
    };

    ctlProto.exportState = function () {
        const self = this;
        if (self.toShare) {
            return {
                id: self.id,
                queryResult: JSON.stringify(self.toShare)
            };
        }
        //else if (self.exportsState && self.resultsLayer) {
        //    return {
        //        id: self.id,
        //        layer: self.resultsLayer.exportState({
        //            exportStyles: false
        //        })
        //    };
        //}
        return null;
    };

    ctlProto.importState = function (state) {
        const self = this;        

        if (state.queryResult) {
            let wait = self.map.getLoadingIndicator().addWait();
            self.map.loaded(function () {
                let sharedQueryToSearch = JSON.parse(state.queryResult);
                if (sharedQueryToSearch.wms && sharedQueryToSearch.filter) {
                    let wmsLayer = self.map.workLayers.filter(l => l.url && l.url === sharedQueryToSearch.wms.url &&
                        l.names.join() === sharedQueryToSearch.wms.names.join());
                    if (wmsLayer.length > 0) {
                        _currentLayer = wmsLayer[0];
                        _currentLayerName = sharedQueryToSearch.name;
                        _currentLayerTitle = sharedQueryToSearch.title;

                        self._setQueryToSearch({ doZoom: sharedQueryToSearch.doZoom });

                        _currentLayer.describeFeatureType(_currentLayerName).then(function (data) {
                            _manageDescribeFeature(data, self, false);
                            self._sendQuery(sharedQueryToSearch.filter);
                            // registramos el estado compartido por si se comparte de nuevo sin hacer uso del control
                            self._setQueryToSearch({ filter: sharedQueryToSearch.filter, doZoom: sharedQueryToSearch.doZoom });

                            self.map.getLoadingIndicator().removeWait(wait);
                        });
                    }
                } else {
                    alert('shared query error');
                }
            });
        }
        //else if (self.resultsLayer) {
        //    self.resultsLayer.then(function () {
        //        self.resultsLayer.importState(state.layer).then(function () {
        //            self.resultsLayer.features.forEach(function (f) {
        //                f.setStyle(null); // Los estilos vienen dados exclusivamente por la capa, borramos estilos propios de la feature
        //            });
        //        });
        //    });
        //}
    };

    ctlProto.validateQuery = function () {
        return this.filters.length > 0
    };

    ctlProto.showResultsPanel = function (data, layername) {
        const self = this;        

        //en funcion del número de elementos cargo un título en singular o plural

        self.resultsPanel.div.querySelector(".prpanel-title-text").innerText = self.resultsPanel.getLocaleString(data.length > 1 ? 'query.titleResultPaneMany' : 'query.titleResultPanelOne', { "numero": data.length, "layerName": layername });

        self.resultsPanel.div.classList.add("tc-ctl-wfsquery-results");

        if (self.modalDialog) {
            self.modalDialog.parentElement.removeChild(self.modalDialog);
        }

        const dataTypes = _getDataTypes();
        
        self.resultsPanel.openTable({
            data: data,
            css: {
                trClass: "trClass",
                tdClass: "tdClass",
                thClass: "thClass",
            },
            sort:true,
            callback: function (tabla) {

                self.resultsPanel.maximize();
                console.log("render del panel de resultados");
                var col = tabla.querySelectorAll(".table>tbody>tr");                
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
                        j++;
                    }                    
                }

                for (var i = 0; i < col.length; i++) {
                    col[i].addEventListener("click", function (e) {
                        e.stopPropagation();
                        var index = this.dataset.index;
                        if (index != undefined)
                            self.resultsLayer.map.zoomToFeatures([self.resultsLayer.features[index]]);
                    });
                    col[i].addEventListener("mouseenter", function () {
                        var index = this.dataset.index;
                        if (index == undefined) return;
                        var feat = self.resultsLayer.features[index]
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
                        var feat = self.resultsLayer.features[index]
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

                TC.control.FeatureInfoCommons.addSpecialAttributeEventListeners(tabla);
                tabla.querySelectorAll("td > img, td > video, td > audio, td > iframe").forEach((e) => { e.parentNode.classList.add("tc-multimedia") })
                tabla.querySelectorAll("video").forEach((v) => { v.addEventListener(TC.Consts.event.CLICK, function(e) {
                        e.stopPropagation(); // No queremos zoom si pulsamos en un enlace
                    }, { passive: true });})

                ////se deshabilita el swipe para que se pueda hacer scroll horizontal del panel de resultados
                if (TC.browserFeatures.touch()) {
                    TC.Util.swipe(self.resultsPanel.div, 'disable');
                }
            }
        });

    };

    ctlProto.showGeometryPanel = async function (mode) {
        const self = this;
        TC.Util.closeModal();
        if (!self.geometryPanel) {
            const ctlOptions = {
                titles: {
                    main: self.getLocaleString('query.spatialFilter')
                }
            };
            const ctlContainer = self.map.getControlsByClass(TC.control.ControlContainer)[0];
            if (ctlContainer) {
                ctlOptions.position = ctlContainer.POSITION.RIGHT;
                self.geometryPanel = await ctlContainer.addControl('resultsPanel', ctlOptions);
            }
            else {
                self.geometryPanel = await self.map.addControl('resultsPanel', ctlOptions);
            }
            self.map
                .on(TC.Consts.event.RESULTSPANELCLOSE, function onResultsPanelClose(e) {
                    if (e.control === self.geometryPanel) {
                        setTimeout(() => self.drawControl.cancel(), 500); // timeout para evitar una llamada indeseada a GFI.
                        TC.Util.showModal(self.modalDialog, {
                            closeCallback: () => self.clearFilters()
                        });
                    }
                });
            const html = await self.getRenderedHtml(self.CLASS + '-geom');
            self.geometryPanel.open(html);
            self.geometryPanel.div.querySelector(`.${self.CLASS}-geom-btn-ok`).addEventListener(TC.Consts.event.CLICK, function () {
                self.geometryPanel.close();
            }, { passive: true });
            if (!self.drawControl) {
                self.drawControl = await self.map.addControl('draw', {
                    div: self.geometryPanel.getTableContainer().querySelector(`.${self.CLASS}-geom-draw`),
                    styles: self.styles
                });
                self.drawControl.on(TC.Consts.event.DRAWEND, function (e) {
                    e.feature.showsPopup = false;
                    self.geometryPanel.close();

                    const op = self.modalDialog.querySelector(`input[name="${self.id}-condition"]:checked`).value;
                    let filter;
                    switch (op) {
                        case 'intersects':
                            filter = new TC.filter.Intersects(null, e.feature, self.map.crs);
                            break;
                        default:
                            filter = new TC.filter.Within(null, e.feature, self.map.crs);
                    }
                    filter._abbr = op;
                    switch (e.target.mode) {
                        case 'polygon':
                            filter._valueToShow = self.getLocaleString('polygon');
                            break;
                        case 'line':
                            filter._valueToShow = self.getLocaleString('line');
                            break;
                        case 'rectangle':
                            filter._valueToShow = self.getLocaleString('box');
                            break;
                    }
                    self.filters.push(filter);
                    _renderFilterConditions(self);
                    TC.Util.showModal(self.modalDialog, {
                        closeCallback: () => self.clearFilters()
                    });
                });
            }
        }
        else {
            self.geometryPanel.open();
        }
        self.geometryPanel.div.querySelector(`.${self.CLASS}-geom-draw`).classList.toggle(TC.Consts.classes.HIDDEN, !mode);
        self.geometryPanel.div.querySelector(`.${self.CLASS}-geom-btn`).classList.toggle(TC.Consts.classes.HIDDEN, !!mode);
        if (mode) {
            self.drawControl.setMode(mode, true);
        }
    };

    const _manageDescribeFeature = function (data, ctl, renderForm) {
        let entries = Object.entries(data);
        entries = entries.length > 1 ? data : entries[0][1];

        _internalGetDataTypes = function () {
            return data;
        };
        for (var key in data) {
            const value = data[key];
            if (TC.Util.isGeometry(value.type)) {
                value.isGeometry = true;
            }
        }

        if (renderForm) {
            ctl.clearFilters();
            ctlProto.getRenderedHtml(ctlProto.CLASS + "-form",
                {
                    operators: filterByOperation,
                    attributes: data,
                    controlId: ctl.id
                }, function (html) {
                    const dialog = ctl.modalDialog;
                    const form = ctl.getForm();
                    empty(form);
                    form.insertAdjacentHTML('beforeend', html);
                    modalBody.classList.remove(loadingCssClass);
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
                        form.querySelectorAll(`input[name="${ctl.id}-condition"]`).forEach(ipt => {
                            ipt.addEventListener('change', async function (e) {
                                form.querySelector(`.${ctlProto.CLASS}-geomtype-line-btn`).disabled = e.target.value === 'within';
                                const valueField = modalBody.querySelector(".tc-ctl-wfsquery-value input");
                                valueField.disabled = false;
                                if (this.parentElement.classList.contains("tc-ctl-wfsquery-text") && this.value === "empty") {
                                    valueField.value = "";
                                    valueField.disabled = true;
                                    TC.UI.autocomplete.call(valueField, "clear");
                                }
                                if (this.parentElement.classList.contains("tc-ctl-wfsquery-date") && this.value === "null") {
                                    valueField.value = "";
                                    valueField.disabled = true;
                                }
                                if (valueField.value.trim() != "") {
                                    if (this.parentElement.classList.contains("tc-ctl-wfsquery-text") && this.value !== "empty") {
                                        var e = document.createEvent('HTMLEvents');
                                        e.initEvent("keyup", false, true);
                                        valueField.dispatchEvent(e);
                                    }
                                }
                            });
                        });
                        form.querySelectorAll(`.tc-ctl-wfsquery-where input[type="radio"][name="${ctl.id}-log-op"]`).forEach(radio => radio.addEventListener("change", function () {
                            logicalOperator = this.value === "OR" ? TC.Consts.logicalOperator.OR : TC.Consts.logicalOperator.AND                            
                        }));

                        form.querySelector(".tc-button").addEventListener(TC.Consts.event.CLICK, function () {
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
                            const checkedOp = form.querySelector('.tc-ctl-wfsquery input[type="radio"]:checked');
                            var op = checkedOp.value;

                            var value = _getValue(valueField);
                            let valueToShow = _getValueToShow(valueField);
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
                                case type.indexOf("string") >= 0 && op !== "empty":
                                    valueToShow = '"' + valueToShow + '"';
                                    break;
                                case type.indexOf("date") >= 0 && op === "null":
                                    valueToShow = '';
                                    break;
                            }

                            //se añade asterisco al principio y/o final del valor para las busquedas: "empieza por", "termina en" o "contiene"
                            var f;
                            if (type.indexOf("dateTime") >= 0 || type.indexOf("date") >= 0) {
                                if (value) {
                                    const from = new Date(value + "T00:00:00").toISOString();
                                    const to = new Date(value + "T23:59:59").toISOString();
                                    if (op === "nbtw") {
                                        //el not bettween es un caso es especial por que concatena un filtro not y otro between
                                        f = new TC.filter.not(TC.filter.between(field, from, to));
                                    }
                                    else {
                                        f = new filterByOperation[op].Ctor(field, from, to);
                                    }
                                }
                                else {
                                    f = new filterByOperation[op].Ctor(field);
                                }
                                
                            }
                            else {
                                f = new filterByOperation[op].Ctor(
                                    field,
                                    (((op === "ends" || op === "contains") ? '*' : '') + value + ((op === "starts" || op === "contains") ? '*' : '')));
                            }
                            f.matchCase = false;
                            f._abbr = op;
                            f._valueToShow = valueToShow;
                            ctl.filters.push(f);

                            _renderFilterConditions(ctl);
                            valueField.value = "";
                        }, { passive: true });

                        const onGeomClick = function (e) {
                            ctl.showGeometryPanel(e.target.value);
                        };
                        form.querySelectorAll("button[name='geometry']").forEach(btn => btn.addEventListener(TC.Consts.event.CLICK, onGeomClick, { passive: true }));
                    }
                });
        }
    };

    const _renderQueryForm = function (args) {
        const self = args[0], layer = args[1], dialog = args[2], capabilities = args[3];
        self.modalDialog = dialog;
        _currentLayer = layer;
        _currentLayercapabilities = capabilities;
        _currentLayerURL = capabilities.Operations.DescribeFeatureType.DCP.HTTP.Get["href"];
        if (new URL(_currentLayerURL).host === document.location.host)
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
            modalBody.classList.remove(loadingCssClass);
            //bindeamos el onchange de combo
            dialog.getElementsByClassName("tc-combo")[0].addEventListener("change", function () {
                if (!this.value) {
                    var form = self.getForm();
                    empty(form);
                    for (var i = 0; i < form.children.length; i++) form.removeChild(form.children[i]);
                    self.clearFilters();
                    return;
                }
                dialog.querySelector(".tc-modal-body .tc-ctl-wfsquery-message", dialog).classList.add(hiddenCssClass);
                _currentLayerTitle = this.options[this.selectedIndex].text;
                modalBody.classList.add(loadingCssClass);
                _currentLayerName = this.value;
                _currentLayer.describeFeatureType(this.value).then(function (data) {
                    _manageDescribeFeature(data, self, true);
                }, function (err) {
                    var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                    tbody.classList.remove(loadingCssClass);
                    if (!err)
                        tbody.insertAdjacentHTML('beforeend', "<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                    else
                        tbody.insertAdjacentHTML('beforeend', "<div class=\"tc-ctl-wfsquery-message tc-msg-error\">" + err + "</div>");
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
                    _manageDescribeFeature(data, self, true);
                }, function (err) {
                    var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                    tbody.classList.remove(loadingCssClass);
                    if (!err)
                        tbody.insertAdjacentHTML('beforeend', "<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                    else
                        tbody.insertAdjacentHTML('beforeend', "<div class=\"tc-ctl-wfsquery-message tc-msg-error\">" + err + "</div>");

                });
            }
            else {
                var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                tbody.classList.remove(loadingCssClass);
                tbody.insertAdjacentHTML('beforeend', "<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                //TC.Util.closeModal();
                //layer.map.toast("Mal", { type: TC.Consts.msgType.WARNING });
            }

        }
        else {
            TC.Util.closeModal();
            layer.map.toast(TC.Util.getLocaleString(layer.map.options.locale, "query.LayerNotAvailable"), { type: TC.Consts.msgType.ERROR });
        }
    };

    const _renderModalDialog = function (layer, layerName, capabilities, callback) {
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

        self.getRenderedHtml(self.CLASS + "-dialog",
            {
                layerName: getLocaleString("query.titleDialog", { "layerName": layerName }),
                layers: layers
            }, function (html) {
                // Borramos diálogos previos
                document.body.querySelectorAll(`.${self.CLASS}-dialog`).forEach(elm => elm.remove());

                var d = document.createElement("div");
                d.insertAdjacentHTML('beforeEnd', html);
                var modal = null;
                if (d.childNodes.length > 0) {
                    modal = d.firstChild;
                    document.body.appendChild(modal);
                }
                modalBody = modal.getElementsByClassName("tc-modal-body")[0]
                modalBody.classList.add(loadingCssClass);

                TC.Util.showModal(modal, {
                    closeCallback: () => self.clearFilters()
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
                self.modalDialog = modal;
                modal.getElementsByClassName("tc-button tc-ctl-wlm-btn-launch")[0].addEventListener("click", function () {
                    self.sendQuery();
                })
                if (callback) callback(modal);
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

        Promise.all([self, layer, renderDialogPromise, capabilitiesPromise]).then(_renderQueryForm);
    };

    ctlProto.removeFilter = function (filter) {
        const self = this;
        let idx = filter;
        if (filter instanceof TC.filter.Filter) {
            idx = self.filters.indexOf(filter);
        }
        if (idx >= 0 && idx < self.filters.length) {
            const removedFilter = self.filters.splice(idx, 1)[0];
            if (removedFilter instanceof TC.filter.Spatial) {
                removedFilter.geometry.layer.removeFeature(removedFilter.geometry);
            }
            _renderFilterConditions(self);
        }
    }

    ctlProto.clearFilters = function () {
        const self = this;
        self.filters
            .filter(f => f instanceof TC.filter.Spatial)
            .forEach(f => f.geometry.layer.removeFeature(f.geometry));
        self.filters.length = 0;
    };

    ctlProto.getForm = function () {
        const self = this;
        return self.modalDialog && self.modalDialog.querySelector('.tc-modal-form');
    };   

})();
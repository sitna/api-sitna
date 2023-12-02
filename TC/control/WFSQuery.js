/// <reference path="popup.js" />

/**
  * Opciones de control de consultas.
  * 
  * Algunos servidores tienen servicios WMS y WFS que actúan en paralelo, es decir, están alojados dentro del mismo nombre de host y publican las mismas capas.
  * Si el control `WFSQuery` está en el mapa, verifica si las capas de servicios WMS están asociadas a un WFS paralelo. Si es así, ofrece un interfaz de usuario
  * para poder hacer consultas a la capa en base a los valores de las propiedades de los elementos de la capa. Esta interfaz de usuario es accesible desde el control
  * `workLayerManager`.
  * @typedef WFSQueryOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {SITNA.layer.StyleOptions} [styles] - Opciones de estilo de las geometrías de las entidades resultado de la consulta.
  * @property {SITNA.layer.StyleOptions} [highlightStyles] - Opciones de estilo de las geometrías de las entidades resaltadas.
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

import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Control from '../Control';
import infoShare from './infoShare';
import filter from '../filter';
import autocomplete from '../ui/autocomplete';
//cargo los objetos features, si no, no resaltara las geometrías
import Point from '../../SITNA/feature/Point';
import Polyline from '../../SITNA/feature/Polyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';
import Button from '../../SITNA/ui/Button';


TC.control = TC.control || {};
TC.UI = TC.UI || {};
TC.UI.autocomplete = autocomplete;
TC.Control = Control;
TC.filter = filter;

const WFSQuery = function (_options) {
    var self = this;

    Control.apply(this, arguments);

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
    self.deletedFeatures = [];
    self.styles = TC.Util.extend(true, {
        polygon: {
            strokeColor: self.DEFAULT_STROKE_COLOR,
            strokeWidth: 2, fillColor: "#000",
            fillOpacity: 0
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

TC.inherit(WFSQuery, Control);
TC.mix(WFSQuery, infoShare);

(function () {
    const ctlProto = WFSQuery.prototype;
    ctlProto.DEFAULT_STROKE_COLOR = '#0000ff';

    const loadingCssClass = Consts.classes.LOADING;
    const hiddenCssClass = Consts.classes.HIDDEN;
    const spatialCssClass = 'tc-spatial';
    var modalBody = null;
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
        };
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
    const _cache = {
        current: {
            layer: null,
            name: null,
            capabilities: null,
            title: null,
            URL: null,
            filter:[]
        },
        queried: null
    }
   
    var _getStyles = function () { return null; };
    var _getHighLightStyles = function () { return null; };
    var getLocaleString = null;
    var type = null;
    ctlProto.CLASS = 'tc-ctl-wfsquery';

    var checkInput = function (type) {
        var input = document.createElement("input");
        input.setAttribute("type", type);
        return input.type == type;
    };

    var _loadDatePolyFill = function () {
        return new Promise(function (resolve, _reject) {
            if (typeof IMask !== "undefined") {
                setTimeout(function () {
                    resolve();
                }, 10);
            }
            else {
                TC.loadJS(true,
                    [TC.apiLocation + '/lib/polyfill/imask'],
                    function () {
                        console.log("Imask loaded");
                        resolve();
                    });
            }
        });
    };
    var _loadNumberPolyFill = function () {
        return new Promise(function (resolve, _reject) {
            if (typeof IMask !== "undefined") {
                setTimeout(function () {
                    resolve();
                }, 10);
            }
            else {
                TC.loadJS(true,
                    [TC.apiLocation + '/lib/polyfill/imask'],
                    function () {
                        console.log("Imask loaded");
                        resolve();
                    });
            }
        });
    };

    var _getValue = function (input) {
        if (inputMaskNumber) {
            return inputMaskNumber.unmaskedValue;

        } else if (dateInputMask) {
            //si es texto con mascara de fecha convertierto la fecha de dd/mm/yyyy a yyyy-mm-dd
            return dateInputMask.unmaskedValue.substring(4) + "-" + dateInputMask.unmaskedValue.substring(2, 4) + "-" + dateInputMask.unmaskedValue.substring(0, 2);
        }
        return input.value;//en el resto de los casos la devuelvo tal cual

    };
    var _getValueToShow = function (input) {
        if (inputMaskNumber) {
            return inputMaskNumber.value;
        }
        else if (dateInputMask) {
            //si es de tipo date devolvemos la fecha en formato dd/mm/yyyy
            return dateInputMask.value;
        }
        else if (input.type === "date") {
            return new Date(input.value).toLocaleDateString(locale, { timeZone: "UTC" });
        }
        else if (input.type === "number") {
            var dotOrComma = 1.1.toLocaleString(locale).substring(1, 2);
            return input.value.replace(".", dotOrComma);
        }
        return input.value;//en el resto de los casos la devuelvo tal cual

    };
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
                    pattern: !locale || locale === "es-ES" ?
                        'd/`m/`Y'
                        : locale === "eu-ES" ? 'Y/`m/`d' : 'm/`d/`Y',
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
                            case "en-US":
                                return [month, day, year].join('/');
                            case "es-ES":
                            default:
                                return [day, month, year].join('/');
                        }

                    },
                    // define str -> date convertion
                    parse: function (str) {
                        switch (locale) {
                            case "eu-ES":
                                return new Date(str.split('/')[1] + "/" + str.split('/')[2] + "/" + str.split('/')[0]);
                            case "en-US":
                                return new Date(str);
                            case "es-ES":
                            default:
                                return new Date(str.split('/')[1] + "/" + str.split('/')[0] + "/" + str.split('/')[2]);
                        }

                    },
                    blocks: {
                        d: {
                            mask: IMask.MaskedRange,
                            from: 1,
                            to: 31,
                            maxLength: 2
                        },
                        m: {
                            mask: IMask.MaskedRange,
                            from: 1,
                            to: 12,
                            maxLength: 2
                        },
                        Y: {
                            mask: IMask.MaskedRange,
                            from: 1900,
                            to: 9999
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

    let _internalGetDataTypes;
    var _getDataTypes = function () {
        return _internalGetDataTypes();
    };

    var _manageComplexTypes = function (type, form) {

        var html = '';
        html += '<option value="">' + getLocaleString('query.chooseAttrCombo') + '</option>';
        for (var key in type) {
            if (!type[key].type || TC.Util.isGeometry(type[key].type)) continue;
            html += '<option value="' + (type[key].name || key) + '">' + key + '</option>';
        }
        var container = document.createElement("div");
        container.insertAdjacentHTML('beforeend', '<select class="' + this.className + '" name="' + this.name + '">' + html + '</select>');
        this.parentNode.parentNode.insertBefore(container, this.parentNode.nextSibling).firstElementChild.addEventListener("change", function () {
            _changeAttributeEvent.apply(this, [form, type]);
        });

    };

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
        if (valueField.dataset.autocomplete) {
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
                                scale: type.indexOf("int") >= 0 || type.indexOf("long") >= 0 ? 0 : 2,  // digits after point, 0 for integers
                                signed: false,  // disallow negative
                                thousandsSeparator: locale && locale === "en-US" ? ',' : '.',  // any single char
                                padFractionalZeros: false,  // if true, then pads zeros at end to the length of scale
                                normalizeZeros: true,  // appends or removes zeros at ends
                                radix: locale && locale === "en-US" ? '.' : ','  // fractional delimiter
                            });
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
                break;
            case type.indexOf("dateTime") >= 0:
            case type.indexOf("date") >= 0:

                dateSection.classList.remove(hiddenCssClass);
                whereSection.classList.remove(hiddenCssClass, spatialCssClass);

                if (dateSection.querySelectorAll("input:checked").length === 0) {
                    dateSection.firstElementChild.checked = true;
                }
                _createDateMask(valueField);
                break;
            case type.indexOf("string") >= 0: {
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
        }
    };

    const _renderFilterConditions = function () {
        const self = this;

        const form = self.getForm();
        const whereDiv = form.querySelector(`.${self.CLASS}-where-list`);
        empty(whereDiv);
        ctlProto.getRenderedHtml(self.CLASS + "-filter", {
            conditions: _cache.current.filter.map(f => getTemplateObjFromFilter(self, f)),
            locale: self.map.options.locale
        }, function (html) {
            whereDiv.innerHTML = html;
            whereDiv.querySelectorAll(`.${self.CLASS}-where-cond-view`).forEach(function (btn, idx) {
                btn.addEventListener(Consts.event.CLICK, function () {
                    self.map.zoomToFeatures([_cache.current.filter.filter(f => f instanceof TC.filter.Spatial)[idx].geometry]);
                    self.showGeometryPanel();
                }, { passive: true });
            });
            form.querySelectorAll(`.${self.CLASS}-del-cond`).forEach(function (btn, idx) {
                btn.addEventListener(Consts.event.CLICK, function () {
                    self.removeFilter(idx);
                }, { passive: true });
            });
        });
    };

    var _validate = function (form) {
        const self = this;
        var option = form.querySelector('.tc-ctl-wfsquery input[type="radio"]:checked');

        if (dateInputMask && !dateInputMask.masked.isComplete) {
            if (/^(?=\d)(?:(?:31(?!.(?:0?[2469]|11))|(?:30|29)(?!.0?2)|29(?=.0?2.(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(?:\x20|$))|(?:2[0-8]|1\d|0?[1-9]))([-.\/])(?:1[012]|0?[1-9])\1(?:1[6-9]|[2-9]\d)?\d\d(?:(?=\x20\d)\x20|$))?(((0?[1-9]|1[012])(:[0-5]\d){0,2}(\x20[AP]M))|([01]\d|2[0-3])(:[0-5]\d){1,2})?$/.test(str) === false)
                _showMessage.call(self, getLocaleString("query.msgNoValidDate"));
            return false;
        }
        if (option.length === 0) {
            _showMessage.call(self, getLocaleString("query.msgNoCondition"));
            return false;
        }
        if (form.querySelectorAll('input[type=\'date\']').length && !form.querySelector('input[type=\'date\']').checkValidity()) {
            _showMessage.call(self, getLocaleString("query.msgNoValidDate"));
            return false;
        }
        var number;
        if (form.querySelectorAll('input[type=\'number\']').length && (number = form.querySelector('input[type=\'number\']')) !== null && !number.checkValidity()) {
            if (number.step === "1")
                _showMessage.call(self, getLocaleString("query.msgNoValidNumberMustInt"));
            else
                _showMessage.call(self, getLocaleString("query.msgNoValidNumber"));
            return false;
        }
        if (form.querySelector('input.tc-textbox').value.trim() === "" && (option.value !== "empty" && option.value !== "null")) {
            _showMessage.call(self, getLocaleString("query.msgNoValueCondition"));
            return false;
        }
        return true;
    };

    const _getLayerName = () => _cache.current.title;

    var _createResultPanel = async function (layerName) {
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
            if (ccontainer.length === 0) {
                self.resultsPanel = await self.map.addControl('resultsPanel', panelOptions);
                self.resultsPanel.caller = self;
            }
            else {
                panelOptions.position = "right";
                self.resultsPanel = await ccontainer[0].addControl('resultsPanel', panelOptions);
                self.resultsPanel.caller = self;
            }
            self.resultsPanel.template[self.resultsPanel.CLASS + "-table"] = self.template[self.CLASS + "-table"];

            self.resultsPanel.addItemTool({
                renderFn: function (container) {
                    const className = self.CLASS + '-btn-zoom';
                    let button = container.querySelector('sitna-button.' + className);
                    if (button) {
                        button.remove();
                        button = null;
                    }
                    const text = self.getLocaleString('query.zoomToExtent');
                    button = new Button();
                    button.variant = Button.variant.MINIMAL;
                    button.text = text;
                    button.iconText = '\ue917';
                    button.classList.add(className);
                    return button;
                },
                updateEvents: [],
                actionFn: function () {
                    self.map.zoomToLayer(self.resultsLayer);
                }
            });
            self.resultsPanel.addItemTool({
                renderFn: function (container) {
                    const className = self.CLASS + '-btn-chng';
                    let button = container.querySelector('sitna-button.' + className);
                    if (button) {
                        button.remove();
                        button = null;
                    }
                    const text = "Cambiar criterios";
                    button = new Button();
                    button.variant = Button.variant.MINIMAL;
                    button.text = text;
                    button.iconText = '\uf0b0';
                    button.classList.add(className);
                    return button;
                },
                updateEvents: [],
                actionFn: async function () {                    
                    //self.resultsPanel.close();
                    _cache.current = Object.assign({}, _cache.queried, { filter: [..._cache.queried.filter] });
                    await beginProcess.apply(self, [_cache.current]);
                }
            });
        }
        else {
            self.resultsPanel.options.save.fileName = _layerName + ".xls";
        }
        self.resultsPanel.options.titles.max = self.resultsPanel.getLocaleString('geo.trk.chart.exp');
    };

    var _showMessage = function (Message, type) {
        //URI:Compruebao si existe modalbody para saber si la consulta viene de una URL comprtida
        if (modalBody) {
            var messageDiv = modalBody.getElementsByClassName("tc-ctl-wfsquery-message")[0];
            if (timer) {
                clearTimeout(timer);
            }
            else {
                messageDiv.innerHTML = Message;
                switch (type) {
                    case Consts.msgType.INFO:
                        messageDiv.classList.add("tc-msg-info");
                        break;
                    case Consts.msgType.WARNING:
                        messageDiv.classList.add("tc-msg-warning");
                        break;
                    case Consts.msgType.ERROR:
                    default:
                        messageDiv.classList.add("tc-msg-error");
                        break;
                }
                messageDiv.classList.remove(hiddenCssClass);
            }
            timer = setTimeout(function () {
                timer = null;
                messageDiv.classList.add(hiddenCssClass);
            }, 3000);
        }
        else {
            this.map.toast(Message, { type: type });
        }
    };
    var _getPossibleValues = async function (field, value) {
        const self = this;
        var _capabilities = Object.assign({}, _cache.current.capabilities);
        switch (document.querySelector(".tc-ctl-wfsquery.tc-ctl-wfsquery-text input:checked").value) {
            case "starts":
                value = value + "*";
                break;
            case "contains":
            case "eq":
            case "neq":
                value = "*" + value + "*";
                break;
            case "ends":
                value = "*" + value;
                break;
        }

        if (controller) {
            controller.abort();
        }
        controller = new AbortController();
        let signal = controller.signal;

        try {
            var data = await _cache.current.layer.proxificationTool.fetch(_cache.current.URL, {
                //URI:si el valor de field contiene "/" se supone que es un dato compuesto entonces no establezco propiedades a devolver sino que se deja vacío para que devuelva todos.
                data: TC.Util.WFGetPropertyValue(_cache.current.name, field.indexOf("/") >= 0 ? false : field, TC.filter.like(field, value, undefined, undefined, undefined, false), _capabilities),//TC.Util.WFSQueryBuilder([_currentLayerName], TC.filter.like(field, value, undefined, undefined, undefined, false), _capabilities, "JSON", false),
                contentType: "application/xml",
                method: "POST",
                signal: signal
            });

            if (data.contentType.startsWith("application/xml") || data.contentType.startsWith("text/xml")) {
                let xmlDoc = new DOMParser().parseFromString(data.responseText, "text/xml");
                let error = xmlDoc.querySelector("Exception ExceptionText");
                if (error) {
                    _showMessage.call(self, error.innerHTML, Consts.msgType.ERROR);
                    return [];
                }
                //parser de features XML
                const arr = [];
                xmlDoc.querySelectorAll("member > *").forEach(function (item) {
                    if (arr.indexOf(item.innerHTML) < 0) {
                        arr[arr.length] = item.innerHTML;
                    }
                });
                return arr;

            }
            if (data.contentType.startsWith("application/json")) {
                data = JSON.parse(data.responseText);
            }
            if (data.features && data.features.length > 0) {
                let arr;
                if (data.features.length === 1) {
                    arr = [field.split("/").reduce(function (vi, va) { return vi[va.substring(va.indexOf(":") + 1)]; }, data.features[0].properties)];
                }
                if (data.features.length > 1) {
                    arr = data.features.reduce(function (pv, cv) {
                        if (pv && pv instanceof Array) {
                            if (pv.indexOf(cv.properties[field]) < 0)
                                return pv.concat(field.split("/").reduce(function (vi, va) { return vi[va.substring(va.indexOf(":") + 1)]; }, cv.properties));
                            else
                                return pv;
                        }
                    }, []);
                }
                //arr.sort();
                return arr;
            } else
                return [];
        }
        catch (err) {
            if (err instanceof DOMException && err.name !== "AbortError")
                _showMessage.call(self, err, Consts.msgType.ERROR);
            return null;
        }
    };
    var _autocompleteConstructor = function (control, property, listCtrl) {

        TC.UI.autocomplete.call(control, {
            minLength: 3,
            target: listCtrl,
            source: function (text, callback) {
                var _self = this;
                _self.target.innerHTML = '<li><a class="tc-ctl-search-li-loading" href="#">' + getLocaleString("searching") + '<span class="tc-ctl-search-loading-spinner tc-ctl-search-loading"></span></a></li>';
                _self.target.classList.remove(hiddenCssClass);
                if (timerAutocomplete)
                    window.clearTimeout(timerAutocomplete);
                timerAutocomplete = window.setTimeout(async function () {
                    if (!document.querySelector(".tc-ctl-wfsquery.tc-ctl-wfsquery-text").classList.contains(Consts.classes.HIDDEN)) {
                        var data = await _getPossibleValues.call(_self, property, text);
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
                control.value = e.currentTarget.dataset.value;
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
        control.addEventListener("search", function (_e) {
            if (control.value.length === 0) {
                TC.UI.autocomplete.call(control, "clear");
            }
        });
        control.addEventListener("input", function (_e) {
            if (control.value.length === 0) {
                TC.UI.autocomplete.call(control, "clear");
            }
        });
    };
    var _highlightText = function (text, pattern) {
        pattern = new RegExp(pattern.replace(/\W/g, ''), "gi");
        return "<li><a href=\"#\" data-value=\"" + text + "\">" + text.replace(pattern, '<b>$&</b>') + "</a></li>";
    };

    var _select = function (feature) {
        const self = this;
        var _addFeature = function (layer, feature) {
            var result;
            if (feature instanceof Point) {
                result = layer.addPoint(feature.getCoords());
            }
            else if (feature instanceof Polyline) {
                result = layer.addPolyline(feature.getCoords());
            }
            else if (feature instanceof Polygon) {
                result = layer.addPolygon(feature.getCoords());
            }
            else if (feature instanceof MultiPolygon) {
                result = layer.addMultiPolygon(feature.getCoords());
            }
            else if (feature instanceof MultiPolyline) {
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
                type: Consts.layerType.VECTOR,
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

    ctlProto.loadTemplates = async function () {
        const self = this;
        const dialogTemplatePromise = import('../templates/tc-ctl-wfsquery-dialog.mjs');
        const formTemplatePromise = import('../templates/tc-ctl-wfsquery-form.mjs');
        const filterTemplatePromise = import('../templates/tc-ctl-wfsquery-filter.mjs');
        const tableTemplatePromise = import('../templates/tc-ctl-wfsquery-table.mjs');
        const valueTemplatePromise = import('../templates/tc-ctl-finfo-attr-val.mjs');
        const objectTemplatePromise = import('../templates/tc-ctl-finfo-object.mjs');
        const geometryTemplatePromise = import('../templates/tc-ctl-wfsquery-geom.mjs');
        const shareDialogTemplatePromise = import('../templates/tc-ctl-wfsquery-share-dialog.mjs');

        const template = {};
        template[self.CLASS + '-dialog'] = (await dialogTemplatePromise).default;
        template[self.CLASS + '-form'] = (await formTemplatePromise).default;
        template[self.CLASS + '-filter'] = (await filterTemplatePromise).default;
        template[self.CLASS + '-table'] = (await tableTemplatePromise).default;
        template['tc-ctl-finfo-attr-val'] = (await valueTemplatePromise).default;
        template['tc-ctl-finfo-object'] = (await objectTemplatePromise).default;
        template[self.CLASS + '-geom'] = (await geometryTemplatePromise).default;
        template[self.CLASS + '-share-dialog'] = (await shareDialogTemplatePromise).default;
        self.template = template;
    };

    ctlProto.render = function (callback) {
        const self = this;

        return self._set1stRenderPromise(Promise.all([
            Control.prototype.render.call(self, callback),
            self.getRenderedHtml(self.CLASS + '-share-dialog', {}, function (html) {
                self._dialogDiv.innerHTML = html;
            })
        ]));
    };

    ctlProto.register = async function (map) {
        const self = this;

        map.on(Consts.event.LAYERERROR, (e) => {
            if (e.layer === self.resultsLayer) {
                if (self.modalDialog) {
                    self.modalDialog.getElementsByClassName("tc-modal-body")[0].classList.remove(loadingCssClass);
                }
                if (e.reason === Consts.WFSErrors.MAX_NUM_FEATURES) {
                    _showMessage.call(self, getLocaleString("query.msgTooManyResults", { limit: e.data.limit }), Consts.msgType.WARNING);
                }
                else {
                    //console.error(e.reason);
                    _showMessage.call(self, getLocaleString("query.errorUndefined"), Consts.msgType.ERROR);
                    throw new Error(e.reason);
                }
            }
        });
        map.on(Consts.event.BEFOREFEATUREREMOVE, (e) => {
            if (e.layer === self.resultsLayer) {
                const index = e.layer.features.indexOf(e.feature);
                self.deletedFeatures.push(index);
                const tr = self.resultsPanel.div.querySelector("table tbody tr:not(." + Consts.classes.DISABLED + ")[data-index='" + index + "']");
                delete tr.dataset.index;
                tr.removeAttribute("title");
                tr.classList.add(Consts.classes.DISABLED);
                for (let j = index + 1; j < e.layer.features.length; j++) {
                    const tr2 = self.resultsPanel.div.querySelector("table tbody tr[data-index='" + j + "']");
                    if (tr2 && tr2.dataset.index)
                        tr2.dataset.index = parseInt(tr2.dataset.index, 10) - 1;
                }
            }
        })

        await Control.prototype.register.call(self, map);

        _getStyles = function () {
            var styleFN = function (geomType, property) {
                return this.options.styles && this.options.styles[geomType] ? this.options.styles[geomType][property] || Cfg.styles[geomType][property] : Cfg.styles[geomType][property];
            };
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
                    labelRotationKey: styleFN.bind(self, 'point', 'labelRotationKey')
                }
            };
        };
        _getHighLightStyles = function () {
            var _default = {
                "polygon": TC.Util.extend(true, {}, Cfg.styles.polygon, {
                    fillColor: "#0099FF",
                    fillOpacity: 1,
                    strokeColor: "#0099FF",
                    strokeWidth: 2
                }),
                "line": TC.Util.extend(true, {}, Cfg.styles.line, {
                    strokeColor: "#0099FF",
                    strokeWidth: 2
                }),
                "point": TC.Util.extend(true, {}, Cfg.styles.point, {
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
        };

        map.ready(function () {
            map.getControlsByClass('TC.control.WorkLayerManager').forEach(function (ctl) {
                ctl.addItemTool({
                    renderFn: function (container, layerId) {
                        const className = self.CLASS + '-btn-open';
                        let button = container.querySelector('sitna-button.' + className);
                        if (button) {
                            button.remove();
                            button = null;
                        }
                        const layer = map.getLayer(layerId);
                        if (layer.type === Consts.layerType.WMS || layer.type === Consts.layerType.WFS) {
                            const text = self.getLocaleString('query.tooltipMagnifBtn');
                            button = new Button();
                            button.variant = Button.variant.MINIMAL;
                            button.text = text;
                            button.iconText = '\ue916';
                            button.classList.add(className);
                            button.dataset.layerId = layerId;
                            if (layer.type === Consts.layerType.WMS) {
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
                                        return Object.prototype.hasOwnProperty.call(WFSCapabilities.FeatureTypes, l.substring(l.indexOf(":") + 1));
                                    });
                                    if (!layers.length) {
                                        button.classList.add(hiddenCssClass);
                                        return;
                                    }
                                }).catch(() => button.classList.add(hiddenCssClass))
                                    .finally(() => button.classList.remove(loadingCssClass));
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
                        if (_cache.queried)
                            _cache.current = Object.assign({}, _cache.queried, { filter: [..._cache.queried.filter] });
                        if (!_cache.current.layer || _cache.current.layer != layer) {
                            _cache.current.layer = layer;
                            _cache.current.name = "";
                            _cache.current.filter = [];                       
                            self.modalDialog = null;
                        }
                        else if (_cache.current?.layer === layer && !_cache.current.filter.length) {
                            _cache.current.name = "";
                        }
                        beginProcess.apply(self, [_cache.current]);
                    }
                });
            });
        });

        await self.getShareDialog();
        return self;
    };

    const _onFeaturesUpdate = function (e) {
        const ctl = e.layer.owner;
        if (ctl && e.layer === ctl.resultsLayer) {
            if (e.newData && e.newData.totalFeatures === 0) {
                ctl.modalDialog.getElementsByClassName("tc-modal-body")[0].classList.remove(loadingCssClass);
                _showMessage.call(ctl, getLocaleString("query.msgNoResults"), Consts.msgType.INFO);
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
                const title_separator = ctl.map.getControlsByClass(TC.control.Click).some(c => c.TITLE_SEPARATOR) ?
                    ctl.map.getControlsByClass(TC.control.Click).find(c => c.TITLE_SEPARATOR).TITLE_SEPARATOR :
                    ' • ';

                for (var i = 0; i < features.length; i++) {
                    const path = _cache.current.layer.getPath(_cache.current.name).slice(1);
                    if (path) {
                        const newData = {};
                        newData[serviceAttrName] = _cache.current.title;
                        newData[layerAttrName] = path.join(title_separator);
                        const allData = TC.Util.extend(newData, features[i].getData());
                        features[i].clearData();
                        features[i].setData(allData);
                    }
                }
                ctl.showResultsPanel(
                    features.length > 1 ?
                        features.reduce(function (vi, va) {
                            return (vi instanceof Array ? vi : [vi.data]).concat([va.data]);
                        })
                        :
                        [features[0].data],
                    _cache.current.title);
            }

            e.layer.map.off(Consts.event.LAYERUPDATE, _onFeaturesUpdate);
        }
    };

    const _onBeforeApplyQuery = function (e) {
        const ctl = e.layer.owner;
        if (ctl && e.layer === ctl.resultsLayer && e.query) {
            ctl._setQueryToSearch({ filter: e.query });
        }
    };

    ctlProto._sendQuery = async function (filter) {
        const self = this;

        if (_cache.current.layer && _cache.current.name && _cache.current.title && filter) {
            var _url = await _cache.current.layer.getWFSURL();
            self.definitiveFilters = [filter];
            _cache.queried = _cache.current;
            await _createResultPanel.apply(self, [_cache.current.title]);
            _cache.current.layer.proxificationTool.cacheHost.getAction(_url).then(function (cacheHost) {
                const url = cacheHost.action(_url);
                if (self.resultsLayer && self.resultsLayer.url !== url) {
                    self.map.removeLayer(self.resultsLayer);
                    self.resultsLayer = null;
                }
                if (!self.resultsLayer) {
                    self.map.on(Consts.event.BEFOREAPPLYQUERY, _onBeforeApplyQuery);
                    self.map
                        .addLayer({
                            id: "WFSQueryResults",
                            type: Consts.layerType.WFS,
                            url: url,
                            owner: self,
                            stealth: true,
                            geometryName: "the_geom",
                            featurePrefix: _cache.current.name.substring(0, _cache.current.name.indexOf(":")),
                            featureType: _cache.current.name.substring(_cache.current.name.indexOf(":") + 1),
                            properties: filter,
                            outputFormat: Consts.format.JSON,
                            styles: _getStyles()
                        })
                        .then(function (layer) {
                            self.resultsLayer = layer;
                            layer.map.on(Consts.event.LAYERUPDATE, _onFeaturesUpdate);
                        });

                    self.map.on(Consts.event.RESULTSPANELCLOSE, function (e) {
                        if (e.control !== self.resultsPanel)
                            return;
                        if (TC.browserFeatures.touch()) {
                            TC.Util.swipe(e.control.div, "enable");
                        }
                        self.resultsLayer.clearFeatures();
                        self.resultsLayer.setVisibility(false);
                        self.clearFilters();
                        _cache.current.name = "";
                        _cache.queried = null;
                        self.modalDialog = null;
                        self.map.off(Consts.event.LAYERUPDATE, _onFeaturesUpdate);
                        self.map.off(Consts.event.BEFOREAPPLYQUERY, _onBeforeApplyQuery);
                        delete self.toShare;
                    });
                }
                else {
                    self.map.off(Consts.event.BEFOREAPPLYQUERY, _onBeforeApplyQuery);
                    self.map.on(Consts.event.BEFOREAPPLYQUERY, _onBeforeApplyQuery);
                    self.resultsLayer.setVisibility(false);
                    self.resultsLayer.clearFeatures();
                    //borro el evento featureUpdate por si hago una búsqueda sin cerra el panel previamente
                    self.map.off(Consts.event.LAYERUPDATE, _onFeaturesUpdate);
                    self.map.on(Consts.event.LAYERUPDATE, _onFeaturesUpdate);
                    self.resultsLayer.url = url;
                    self.resultsLayer.featurePrefix = _cache.current.name.substring(0, _cache.current.name.indexOf(":"));
                    self.resultsLayer.featureType = _cache.current.name.substring(_cache.current.name.indexOf(":") + 1);
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
            _showMessage.call(self, getLocaleString("query.msgNoQueryFilter"));
            return;
        }
        self.modalDialog.getElementsByClassName("tc-modal-body")[0].classList.add(loadingCssClass);

        let filter;
        if (_cache.current.filter.length > 1) {
            const condition = self.modalDialog.querySelector(".tc-ctl-wfsquery-logOpRadio:checked").value;
            filter = TC.filter[Consts.logicalOperator[condition]].apply(null, _cache.current.filter);
        }
        else {
            filter = _cache.current.filter[0];
        }

        self._sendQuery.call(self, filter);
    };

    ctlProto._setQueryToSearch = function (options) {
        const self = this;
        if (Object.keys(options).length === 1 && Object.prototype.hasOwnProperty.call(options, "doZoom")) {
            self.toShare = TC.Util.extend(self.toShare, { doZoom: options.doZoom });
        } else if (options.filter || self.resultsLayer && self.resultsLayer.properties instanceof TC.filter.Filter) {
            self.toShare = TC.Util.extend(self.toShare, {
                wms: {
                    url: _cache.current.layer.url, names: _cache.current.layer.names
                },
                title: _cache.current.title,
                name: _cache.current.name,
                filter: options.filter ? options.filter : self.resultsLayer.properties.getText(),
                doZoom: Object.prototype.hasOwnProperty.call(options, 'doZoom') ? options.doZoom : true
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
                        _cache.current.layer = wmsLayer[0];
                        _cache.current.name = sharedQueryToSearch.name;
                        _cache.current.title = sharedQueryToSearch.title;
                        
                        self._setQueryToSearch({ doZoom: sharedQueryToSearch.doZoom });

                        _cache.current.layer.describeFeatureType(_cache.current.name).then(function (data) {
                            manageDescribeFeature.apply(self, [data, false]);
                            self._sendQuery(sharedQueryToSearch.filter);
                            // registramos el estado compartido por si se comparte de nuevo sin hacer uso del control
                            self._setQueryToSearch({ filter: sharedQueryToSearch.filter, doZoom: sharedQueryToSearch.doZoom });                                                        
                            _cache.current.filter = [TC.filter.Filter.fromText(sharedQueryToSearch.filter)];
                            _cache.queried = _cache.current = Object.assign({}, _cache.current, { filter: [..._cache.current.filter] });                           
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
        return _cache.current.filter.length > 0;
    };

    ctlProto.showResultsPanel = function (data, layername) {
        const self = this;
        self.deletedFeatures = [];
        //en funcion del número de elementos cargo un título en singular o plural

        self.resultsPanel.div.querySelector(`.${self.resultsPanel.CLASS}-title-text`).innerText = self.resultsPanel.getLocaleString(data.length > 1 ? 'query.titleResultPaneMany' : 'query.titleResultPanelOne', { "numero": data.length, "layerName": layername });

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
                thClass: "thClass"
            },
            sort: true,
            callback: function (tabla) {

                self.resultsPanel.maximize();
                console.log("render del panel de resultados");
                var col = tabla.querySelectorAll(".tc-table > tbody > tr");
                var j = 1;
                for (var key in data[0]) {
                    if (Object.prototype.hasOwnProperty.call(dataTypes, key)) {
                        const dataType = dataTypes[key].type;
                        if (dataType && !(dataType instanceof Object)) {
                            if (dataType.indexOf("int") >= 0 ||
                                dataType.indexOf("float") >= 0 ||
                                dataType.indexOf("double") >= 0 ||
                                dataType.indexOf("long") >= 0 ||
                                dataType.indexOf("decimal") >= 0) {
                                var tdNumeric = tabla.querySelectorAll("td:nth-child(" + j + ")");
                                for (var k = 0; k < tdNumeric.length; k++) {
                                    tdNumeric[k].classList.add("tc-numeric");
                                }
                            }
                        }
                        if (dataType && dataType instanceof Object) {
                            console.log("aki lo que sea");
                        }
                        j++;
                    }
                }

                for (var i = 0; i < col.length; i++) {
                    col[i].addEventListener("click", function (e) {
                        e.stopPropagation();
                        if (this.classList.contains(Consts.classes.DISABLED)) return;
                        var index = this.dataset.index;
                        if (index != undefined)
                            self.resultsLayer.map.zoomToFeatures([self.resultsLayer.features[index]]);
                    });
                    col[i].addEventListener("mouseenter", function () {
                        if (this.classList.contains(Consts.classes.DISABLED)) return;
                        var index = this.dataset.index;
                        if (index == undefined) return;
                        var feat = self.resultsLayer.features[index];
                        if (feat && feat.geometry) {
                            //feat.select();
                            _select.call(self, feat);
                        }
                        var celdasHoja = this.querySelectorAll("td.tc-value div");
                        if (celdasHoja.length > 0) {
                            celdasHoja.forEach(function (celda) {
                                if (celda.offsetWidth < celda.scrollWidth)
                                    celda.title = celda.innerText;
                            });
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
                        var feat = self.resultsLayer.features[index];
                        if (feat && feat.geometry) {
                            //feat.unselect();
                            _unselect(feat);
                            //esto es porque el unselect no devulve al estilo por defecto
                            //feat.setStyle(Cfg.styles[feat.STYLETYPE]);
                        }
                    });
                }
                tabla.querySelectorAll(".tc-complex-attr label,.tc-complex-attr input").forEach(function (label) {
                    label.addEventListener("click", function (e) {
                        e.stopPropagation();
                    });
                });
                tabla.querySelectorAll(".tc-complex-attr input").forEach(function (chkBox) {
                    chkBox.addEventListener("change", function (_e) {
                        if (this.checked) {
                            this.nextElementSibling.querySelectorAll("td.tc-value div").forEach(function (div) {
                                if (div.offsetWidth < div.scrollWidth)
                                    div.title = div.innerText;
                            });
                        }
                    });
                });

                TC.control.FeatureInfoCommons.addSpecialAttributeEventListeners(tabla);
                tabla.querySelectorAll("td > img, td > video, td > audio, td > iframe").forEach((e) => e.parentNode.classList.add("tc-multimedia"));
                tabla.querySelectorAll("video").forEach((v) => {
                    v.addEventListener(Consts.event.CLICK, function (e) {
                        e.stopPropagation(); // No queremos zoom si pulsamos en un enlace
                    }, { passive: true });
                });
                //URI:Si hay features eliminadas las marcamos como tal
                if (self.deletedFeatures.length > 0) {
                    self.deletedFeatures.sort().forEach((f) => {
                        const tr = self.resultsPanel.div.querySelector("table tbody tr[data-index='" + f + "']");
                        delete tr.dataset.index;
                        tr.removeAttribute("title");
                        tr.classList.add(Consts.classes.DISABLED);
                    });
                    //rellenamos los huecos de data-index
                    Array.from(self.resultsPanel.div.querySelectorAll("table tbody tr:not(." + Consts.classes.DISABLED + ")")).forEach((notDeleted) => {
                        const index = parseInt(notDeleted.dataset.index, 10);
                        notDeleted.dataset.index = index - self.deletedFeatures.filter((x) => x < index).length;
                    });

                }
                ////se deshabilita el swipe para que se pueda hacer scroll horizontal del panel de resultados
                if (TC.browserFeatures.touch()) {
                    TC.Util.swipe(self.resultsPanel.div, 'disable');
                }
            }
        });

    };

    ctlProto.showGeometryPanel = function (mode,start=true) {
        const self = this;
        return new Promise( async function (resolve) {
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
                    .on(Consts.event.RESULTSPANELCLOSE, function onResultsPanelClose(e) {
                        if (e.control === self.geometryPanel) {
                            setTimeout(() => self.drawControl.cancel(), 500); // timeout para evitar una llamada indeseada a GFI.
                            TC.Util.showModal(self.modalDialog, {
                                closeCallback: () => self.clearFilters()
                            });
                        }
                    });
                const html = await self.getRenderedHtml(self.CLASS + '-geom');
                self.geometryPanel.open(html);
                self.geometryPanel.div.querySelector(`.${self.CLASS}-geom-btn-ok`).addEventListener(Consts.event.CLICK, function () {
                    self.geometryPanel.close();
                }, { passive: true });                
                if (!self.drawControl) {
                    self.drawControl = await self.map.addControl('draw', {
                        div: self.geometryPanel.getTableContainer().querySelector(`.${self.CLASS}-geom-draw`),
                        styles: self.styles
                    });
                    resolve(self.drawControl.layer);
                    self.drawControl.on(Consts.event.DRAWEND, function (e) {
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
                            case 'polyline':
                                filter._valueToShow = self.getLocaleString('line');
                                break;
                            case 'rectangle':
                                filter._valueToShow = self.getLocaleString('box');
                                break;
                        }
                        _cache.current.filter.push(filter);
                        _renderFilterConditions.apply(self);
                        TC.Util.showModal(self.modalDialog, {
                            closeCallback: () =>self.clearFilters()
                        });
                    });
                    self.drawControl.on(Consts.event.DRAWCANCEL, function (e) {
                        e.ctrl.deactivate();
                    });
                }
            }
            else {
                self.geometryPanel.open();
                resolve(self.drawControl.layer);
            }
            self.geometryPanel.div.querySelector(`.${self.CLASS}-geom-draw`).classList.toggle(Consts.classes.HIDDEN, !mode);
            self.geometryPanel.div.querySelector(`.${self.CLASS}-geom-btn`).classList.toggle(Consts.classes.HIDDEN, !!mode);
            if (mode) {
                self.drawControl.setMode(mode, start);
            }
        });
        
    };

    const manageDescribeFeature = function (data,  renderForm) {

        const self = this;

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
            //self.clearFilters();
            return new Promise(function (resolve) {
                ctlProto.getRenderedHtml(ctlProto.CLASS + "-form",
                    {
                        operators: filterByOperation,
                        attributes: data,
                        controlId: self.id
                    }, function (html) {
                        const dialog = self.modalDialog;
                        const form = self.getForm();
                        empty(form);
                        form.insertAdjacentHTML('beforeend', html);
                        modalBody.classList.remove(loadingCssClass);
                        var combo = form.getElementsByClassName("tc-combo");
                        if (combo.length === 0)
                            dialog.getElementsByClassName("tc-button tc-ctl-wlm-btn-launch")[0].setAttribute("disabled", "");
                        else {
                            dialog.getElementsByClassName("tc-button tc-ctl-wlm-btn-launch")[0].removeAttribute("disabled");
                            combo[0].addEventListener("change", function () {
                                _changeAttributeEvent.apply(this, [form, data]);
                            })

                            form.querySelectorAll(`input[name="${self.id}-condition"]`).forEach(ipt => {
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
                                    if (valueField.value.trim() !== "") {
                                        if (this.parentElement.classList.contains("tc-ctl-wfsquery-text") && this.value !== "empty") {
                                            var evt = document.createEvent('HTMLEvents');
                                            evt.initEvent("keyup", false, true);
                                            valueField.dispatchEvent(evt);
                                        }
                                    }
                                });
                            });

                            form.querySelector(".tc-button").addEventListener(Consts.event.CLICK, function () {
                                var valueField = form.querySelector('input.tc-textbox');
                                TC.UI.autocomplete.call(valueField, "clear");
                                if (inputMaskNumber)
                                    inputMaskNumber.masked.remove();
                                if (!_validate.call(self, form)) {
                                    return;
                                }
                                var field = [].reduce.call(form.querySelectorAll('.tc-combo'), function (vi, va) {
                                    return vi + (vi ? "/" : "") + va.value;
                                }, '');
                                const checkedOp = form.querySelector('.tc-ctl-wfsquery input[type="radio"]:checked');
                                var op = checkedOp.value;

                                createFilterCondition.apply(self, [valueField, field, op, type]);

                                _renderFilterConditions.apply(self);
                                valueField.value = "";
                            }, { passive: true });

                            const onGeomClick = function (e) {
                                self.showGeometryPanel(e.target.value);
                            };
                            form.querySelectorAll("button[name='geometry']").forEach(btn => btn.addEventListener(Consts.event.CLICK, onGeomClick, { passive: true }));
                            resolve(form);
                        }
                    });
            });
            
        }
    };
    const createFilterCondition = function (valueField,field,operation,type) {
        const self = this;
        let value = _getValue(valueField);
        let valueToShow = _getValueToShow(valueField);
        switch (true) {
            case type.indexOf("xsd:int") >= 0:
                valueToShow = parseInt(value, 10);
                break;
            case type.indexOf("xsd:float") >= 0:
            case type.indexOf("xsd:double") >= 0:
            case type.indexOf("xsd:long") >= 0:
            case type.indexOf("xsd:decimal") >= 0:
                valueToShow = parseFloat(value, 10);
                break;
            case type.indexOf("xsd:string") >= 0 && operation !== "empty":
                valueToShow = '"' + valueToShow + '"';
                break;
            case type.indexOf("xsd:date") >= 0 && operation === "null":
                valueToShow = '';
                break;
        }

        //se añade asterisco al principio y/o final del valor para las busquedas: "empieza por", "termina en" o "contiene"
        var f;
        if (type.indexOf("dateTime") >= 0 || type.indexOf("date") >= 0) {
            if (value) {
                const from = new Date(value + "T00:00:00").toISOString();
                const to = new Date(value + "T23:59:59").toISOString();
                if (operation === "nbtw") {
                    //el not bettween es un caso es especial por que concatena un filtro not y otro between
                    f = new TC.filter.not(TC.filter.between(field, from, to));
                }
                else {
                    f = new filterByOperation[operation].Ctor(field, from, to);
                }
            }
            else {
                f = new filterByOperation[operation].Ctor(field);
            }

        }
        else {
            f = new filterByOperation[operation].Ctor(
                field,
                (operation === "ends" || operation === "contains" ? '*' : '') +
                value +
                (operation === "starts" || operation === "contains" ? '*' : ''));
        }
        f.matchCase = false;
        f._abbr = operation;
        f._valueToShow = valueToShow;
        _cache.current.filter.push(f);
    }

    const renderQueryForm = async function (layer, dialog, capabilities) {
        const self = this;
        self.modalDialog = dialog;
        _cache.current.layer = layer;
        _cache.current.capabilities = capabilities;
        _cache.current.URL = capabilities.Operations.DescribeFeatureType.DCP.HTTP.Get.href;
        if (new URL(_cache.current.URL).host === document.location.host) {
            _cache.current.URL = _cache.current.URL.substring(_cache.current.URL.indexOf(":") + 1);
        }

        //analizamos si es una o varias capas, si es una agrupación la disgregamos
        var layers = layer.getDisgregatedLayerNames ? layer.getDisgregatedLayerNames() : layer.featureType;
        //quitamos aquellas que no estén disponibles en el WFS
        layers = layers.filter(function (l) {
            return Object.prototype.hasOwnProperty.call(capabilities.FeatureTypes, l.substring(l.indexOf(":") + 1));
        });        
        if (layers.length > 1) {
            modalBody.classList.remove(loadingCssClass);
            const combo = dialog.getElementsByClassName("tc-combo")[0];
            //bindeamos el onchange de combo
            combo.addEventListener("change", function () {
                if (!this.value) {
                    var form = self.getForm();
                    empty(form);
                    for (var i = 0; i < form.children.length; i++) form.removeChild(form.children[i]);
                    self.clearFilters();
                    return;
                }
                dialog.querySelector(".tc-modal-body .tc-ctl-wfsquery-message", dialog).classList.add(hiddenCssClass);
                _cache.current.title = this.options[this.selectedIndex].text;
                modalBody.classList.add(loadingCssClass);
                _cache.current.name = this.value;
                chooseLeafLayer.apply(self, [_cache.current.layer, _cache.current.name, dialog])                

            }); 
        }
        else if (layers.length === 1) {            
            //comprabamos que la capa existe en el capabilities
            var layerCapabilities = capabilities.FeatureTypes[layers[0].substring(layers[0].indexOf(":") + 1)];
            if (layerCapabilities) {
                _cache.current.title = capabilities.FeatureTypes[layers[0].substring(layers[0].indexOf(":") + 1)].Title;
                _cache.current.name = layers[0];
                await chooseLeafLayer.apply(self, [_cache.current.layer, _cache.current.name, dialog])                
            }
            else {
                var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
                tbody.classList.remove(loadingCssClass);
                tbody.insertAdjacentHTML('beforeend', "<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
                //TC.Util.closeModal();
                //layer.map.toast("Mal", { type: Consts.msgType.WARNING });
            }
        }
        else {
            TC.Util.closeModal();
            layer.map.toast(TC.Util.getLocaleString(layer.map.options.locale, "query.LayerNotAvailable"), { type: Consts.msgType.ERROR });
        }
    };
    const chooseLeafLayer = async function (layer,layerName, dialog) {
        const self = this;        
        try {
            const data = await layer.describeFeatureType(layerName)
            const form = await manageDescribeFeature.apply(self, [data, true]);
            return ({ attributes: data, form: form });
        }
        catch (err) {
            var tbody = dialog.getElementsByClassName("tc-modal-body")[0];
            tbody.classList.remove(loadingCssClass);
            if (!err)
                tbody.insertAdjacentHTML('beforeend', "<div class=\"tc-ctl-wfsquery-message tc-msg-warning\">" + getLocaleString("query.LayerNotAvailable") + "</div>");
            else
                tbody.insertAdjacentHTML('beforeend', "<div class=\"tc-ctl-wfsquery-message tc-msg-error\">" + err + "</div>");
            throw err;
        }
        
    }
    const beginProcess =async function (_state/*layer, filter*/) {
        const self = this;
        if (self.modalDialog && !self.modalDialog.parentElement) {
            document.body.appendChild(self.modalDialog);
            self.modalDialog.getElementsByClassName("tc-modal-body")[0].classList.remove(loadingCssClass);
            _cache.current = _state;
            _cache.current.filter.filter((f) => f instanceof TC.filter.Spatial).forEach((f) => {
                if (f.geometry instanceof SITNA.feature.Polygon && !f.geometry.layer)
                    self.drawControl.layer.addPolygon(f.geometry);
                if (f.geometry instanceof SITNA.feature.Polyline && !f.geometry.layer)
                    self.drawControl.layer.addPolyline(f.geometry);
            });
            return self.modalDialog
        }
        else {
            const capabilities = await getCapabilities.apply(self, [_state.layer]);
            const modal = await renderModalDialog.apply(self, [_state.layer, capabilities, _state.name]);
            const dialog = await renderQueryForm.apply(self, [_state.layer, modal, capabilities]);
            if (_state.filter?.length) {
                const filter = [..._state.filter]
                self.clearFilters();
                const data = await chooseLeafLayer.apply(self, [_state.layer, _state.name, dialog]);                
                const comboAttr = data.form.querySelector(".tc-combo[name='attributes']");
                const geomName = Object.entries(data.attributes).find((d) => TC.Util.isGeometry(d[1].type))[0];
                if (comboAttr) {
                    var index = Object.keys(data.attributes).filter((k) => k !== "FEATURE").indexOf(filter[0].propertyName || geomName);
                    comboAttr.options[index + 1].selected = true;
                    _changeAttributeEvent.apply(comboAttr, [data.form, data.attributes]);
                }
                const conjuncion = filter[0] instanceof TC.filter.LogicalNary ? filter[0].getTagName() : "And";
                data.form.querySelector("." + self.CLASS + "-logOpRadio[value='" + conjuncion.toUpperCase() + "']").checked = true;
                const _filters = filter.reduce((vi, va) => { return vi.concat(va instanceof TC.filter.LogicalNary ? va.conditions : va) }, []);
                for (var i in _filters) {
                    const f = _filters[i];
                    const _opAbbr = _getFilterAbbr(f);
                    const type = data.attributes[f.propertyName || geomName].type;
                    const valueField = await _makeInputField.apply(self, [f, _opAbbr, data, geomName]);
                    if (!(f instanceof TC.filter.Spatial)) {
                        createFilterCondition.apply(self, [valueField, f.propertyName, _opAbbr, type]);
                    }
                }
                _renderFilterConditions.apply(self);
            }
            return modal;
        }
        
    }
    const getCapabilities = function (layer) {
        let title;
        let capabilitiesPromise;
        if (layer.type === Consts.layerType.WMS) {
            const path = layer.getPath();
            title = path[path.length - 1];
            capabilitiesPromise = layer.getWFSCapabilities();
        }
        else if (layer.type === Consts.layerType.WFS) {
            title = layer.title;
            capabilitiesPromise = layer.getCapabilitiesPromise();
        }
        else {
            return;
        }
        return capabilitiesPromise
    }

    const renderModalDialog = async function (layer, capabilities,layerName) {
        const self = this;
        let title;
        if (layer.type === Consts.layerType.WMS) {
            const path = layer.getPath();
            title = path[path.length - 1];            
        }
        else if (layer.type === Consts.layerType.WFS) {
            title = layer.title;            
        }
        else {
            return;
        }
                
        let layers;
        return new Promise(function (resolve) {
            if (layer.getDisgregatedLayerNames) {
                layers = [];
                layer.getDisgregatedLayerNames().forEach(function (value, _index) {
                    var path = layer.getPath(value);
                    //quitamos aquellas que no estén disponibles en el WFS
                    if (Object.prototype.hasOwnProperty.call(capabilities.FeatureTypes, value.substring(value.indexOf(":") + 1)))
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
                    layerName: getLocaleString("query.titleDialog", { "layerName": title }),
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
                    modalBody = modal.getElementsByClassName("tc-modal-body")[0];
                    modalBody.classList.add(loadingCssClass);
                    //TC.Util.showModal(modal);
                    TC.Util.showModal(modal, {
                        closeCallback: () => self.clearFilters()
                    });
                    //IE me hace la puñeta con los estilos, no me fuciona el calc el el max-height así que lo calculo cada vez que muestro el dialogo
                    if (TC.Util.detectIE()) {
                        var coef = 1;
                        switch (true) {
                            case document.body.clientWidth > 768 && document.body.clientWidth < document.body.clientHeight:
                            case document.body.clientWidth > 1024:
                            case document.body.clientWidth > 1140:
                                coef = 0.7;
                                break;
                        }
                        modalBody.style.maxHeight = document.body.clientHeight * coef - modalBody.nextElementSibling.clientHeight - modalBody.previousElementSibling.clientHeight;
                    }
                    self.modalDialog = modal;
                    modal.getElementsByClassName("tc-button tc-ctl-wlm-btn-launch")[0].addEventListener("click", function () {
                        self.sendQuery();
                    });
                    if (layerName && layers.length > 1)
                        Array.from(modal.querySelector(".tc-combo[name='availableLayers']")).find((opt) => opt.value === layerName).selected = true;                    
                    resolve(modal);
                });
        });
               
    };

    ctlProto.removeFilter = function (filter) {
        const self = this;
        let idx = filter;
        if (filter instanceof TC.filter.Filter) {
            idx = _cache.current.filter.indexOf(filter);
        }
        if (idx >= 0 && idx < _cache.current.filter.length) {
            const removedFilter = _cache.current.filter.splice(idx, 1)[0];            
            if (removedFilter instanceof TC.filter.Spatial) {
                removedFilter.geometry.layer.removeFeature(removedFilter.geometry);
            }
            _renderFilterConditions.apply(self);
        }
    };

    ctlProto.clearFilters = function () {
        _cache.current.filter
            .filter(f => f instanceof TC.filter.Spatial)
            .forEach(f => f.geometry?.layer?.removeFeature(f.geometry));
        _cache.current.filter.length = 0;
    };

    ctlProto.getForm = function () {
        const self = this;
        return self.modalDialog && self.modalDialog.querySelector('.tc-modal-form');
    };

    const _getFilterAbbr = function (f) {
        switch (true) {
            case f instanceof TC.filter.EqualTo:
                return "eq";
            case f instanceof TC.filter.NotEqualTo:
                return "neq";
            case f instanceof TC.filter.GreaterThan:
                return "gt";
            case f instanceof TC.filter.LessThan:
                return "lt";
            case f instanceof TC.filter.GreaterThanOrEqualTo:
                return "lt";
            case f instanceof TC.filter.LessThanOrEqualTo:
                return "lt";
            case f instanceof TC.filter.IsLike:
                var pattern = /<!\[CDATA\[(?<content>.*?)\]\]>/gm.exec(f.pattern)?.groups?.content || f.pattern;
                f.expression = pattern.replace(/\*/g, "");
                if (pattern.startsWith("*"))
                    return pattern.endsWith("*") ? "contains" : "ends";
                else
                    return pattern.endsWith("*") ? "starts" : "";
            case f instanceof TC.filter.IsNull:
                return "null";
            case f instanceof TC.filter.IsBetween:
                f.expression = new Date(f.LowerBoundary).getFullYear() + "-" + new Date(f.LowerBoundary).getMonth() + 1 + "-" + new Date(f.LowerBoundary).getDate()
                return "btw";
            case f instanceof TC.filter.Intersects:
                return "intersects";
            case f instanceof TC.filter.Within:
                return "within";
        }
    };
    const _makeInputField = async function (f, operation, data, geomName) {
        const self = this;
        const valueField = document.createElement("input");
        valueField.value = /<!\[CDATA\[(?<content>.*?)\]\]>/gm.exec(f.expression)?.groups?.content || f.expression;
        const type = data.attributes[f.propertyName || geomName].type

        switch (true) {
            case TC.Util.isGeometry(type):
                var layer = await self.showGeometryPanel(f.geometry.STYLETYPE,false);
                self.geometryPanel.close();
                var filter = new f.constructor(null, f.geometry, self.map.crs);
                filter._abbr = operation;
                switch (f.geometry.STYLETYPE) {
                    case 'polygon':
                        var coords = f.geometry.getCoordinates()[0];
                        if (coords[0][0] === coords[1][0] && coords[0][1] === coords[3][1] &&
                            coords[3][0] === coords[3][0] && coords[1][1] === coords[1][1])
                            filter._valueToShow = self.getLocaleString('box');
                        else
                            filter._valueToShow = self.getLocaleString('polygon');
                        break;
                    case 'line':
                        filter._valueToShow = self.getLocaleString('line');
                        break;

                }
                _cache.current.filter.push(filter);
                layer.addFeature(f.geometry);
                break;
            case type.indexOf("int") >= 0:
            case type.indexOf("float") >= 0:
            case type.indexOf("double") >= 0:
            case type.indexOf("long") >= 0:
            case type.indexOf("decimal") >= 0:
                valueField.type = "number";
                if (type.indexOf("int") >= 0 || type.indexOf("long") >= 0)
                    valueField.step = "1";
                else
                    valueField.step = "0.0001";
                break;
            case type.indexOf("dateTime") >= 0:
            case type.indexOf("date") >= 0:
                valueField.type = "date";
                break;
            case type.indexOf("string") >= 0:
                valueField.type = "text";
                break;
        }
        return valueField;
    }

})();

TC.control.WFSQuery = WFSQuery;
export default WFSQuery;
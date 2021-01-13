TC.control = TC.control || {};

if (!TC.control.MapInfo) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/MapInfo');
}

TC.control.PrintMap = function () {
    var self = this;

    TC.Control.apply(self, arguments);
};

TC.inherit(TC.control.PrintMap, TC.control.MapInfo);

(function () {
    var ctlProto = TC.control.PrintMap.prototype;

    ctlProto.CLASS = 'tc-ctl-prnmap';

    const ORIENTATION = {
        PORTRAIT: 'portrait',
        LANDSCAPE: 'landscape'
    };
    const PAGE_SIZE = {
        A4: 'A4',
        A3: 'A3'
    };

    /*
        GLS:
        La librería makePDF se basa en la librería PDFKit explicación sobre la unidad de medida que usa:
        PDF points (72 per inch)
        https://stackoverflow.com/questions/51540144/pdfkit-node-js-measurement-unit
        https://www.ninjaunits.com/converters/pixels/points-pixels/
        https://www.ninjaunits.com/converters/pixels/pixels-points/

        La clave es mantener las dimensiones del mapa en px enteros (canvas sólo admite px enteros), ajustando el layout que está en puntos y que sí admite decimales
    */

    /* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-prnmap-portrait-a4 indicando el valor en px la sección del mapa   */
    var a4_portrait = {
        logoWidth: 60,
        logoHeight: 30,
        layoutPDF: {
            pageSize: {
                width: 595,
                height: 842
            },
            pageMargins: [29.5, 14, 29.5, 22.5],
            content: [
                {
                    columns: [
                        { /* logo */
                            image: null,
                            height: 22,
                            /*width: 45,*/
                            margin: [0, 0, 0, 6]
                        },
                        { /* título */
                            text: "",
                            width: 489,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        { /* barra de escala */
                            alignment: 'right',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ /* mapa */
                                image: null,
                                width: 534,
                                height: 775.5
                            }]
                        ]
                    },
                    layout: {
                        paddingLeft: function (i, node) { return 0; },
                        paddingRight: function (i, node) { return 0; },
                        paddingTop: function (i, node) { return 0; },
                        paddingBottom: function (i, node) { return 0; }
                    }
                }
            ]
        },
        reset: function () {
            this.layoutPDF.content = [
                {
                    columns: [
                        { /* logo */
                            image: null,
                            height: 22,
                            /*width: 45,*/
                            margin: [0, 0, 0, 6]
                        },
                        { /* título */
                            text: "",
                            width: 489,
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
                        },
                        { /* barra de escala */
                            alignment: 'right',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ /* mapa */
                                image: null,
                                width: 534,
                                height: 775.5
                            }]
                        ]
                    },
                    layout: {
                        paddingLeft: function (i, node) { return 0; },
                        paddingRight: function (i, node) { return 0; },
                        paddingTop: function (i, node) { return 0; },
                        paddingBottom: function (i, node) { return 0; }
                    }
                }
            ];
        }
    };
    /* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-prnmap-landscape-a4 indicando el valor en px la sección del mapa   */
    var a4_landscape = {
        logoWidth: 60,
        logoHeight: 30,
        layoutPDF: {
            pageSize: {
                width: 842,
                height: 595
            },
            pageMargins: [30, 14, 30, 22],
            content: [
                {
                    columns: [
                        { /* logo */
                            image: null,
                            height: 22,
                            /*width: 45,*/
                            margin: [0, 0, 0, 6]
                        },
                        { /* título */
                            text: "",
                            alignment: 'center',
                            margin: [0, 10, 0, 0],
                            width: 600
                        },
                        { /* barra de escala */
                            alignment: 'right',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ /* mapa */
                                image: null,
                                width: 780,
                                height: 528
                            }]
                        ]
                    },
                    layout: {
                        paddingLeft: function (i, node) { return 0; },
                        paddingRight: function (i, node) { return 0; },
                        paddingTop: function (i, node) { return 0; },
                        paddingBottom: function (i, node) { return 0; }
                    }
                }
            ]
        },
        reset: function () {
            this.layoutPDF.content = [
                {
                    columns: [
                        { /* logo */
                            image: null,
                            height: 22,
                            /*width: 45,*/
                            margin: [0, 0, 0, 6]
                        },
                        { /* título */
                            text: "",
                            alignment: 'center',
                            margin: [0, 10, 0, 0],
                            width: 600
                        },
                        { /* barra de escala */
                            alignment: 'right',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ /* mapa */
                                image: null,
                                width: 780,
                                height: 528
                            }]
                        ]
                    },
                    layout: {
                        paddingLeft: function (i, node) { return 0; },
                        paddingRight: function (i, node) { return 0; },
                        paddingTop: function (i, node) { return 0; },
                        paddingBottom: function (i, node) { return 0; }
                    }
                }
            ];
        }
    };

    /* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-prnmap-portrait-a3 indicando el valor en px la sección del mapa   */
    var a3_portrait = {
        logoWidth: 60,
        logoHeight: 30,
        layoutPDF: {
            pageSize: {
                width: 841.89,
                height: 1190.55
            },
            pageMargins: [29.954, 14, 29.954, 21.55],
            content: [
                {
                    columns: [
                        { /* logo */
                            image: null,
                            height: 22,
                            width: 45,
                            margin: [0, 0, 0, 6]
                        },
                        { /* título */
                            text: "",
                            width: 489,
                            margin: [0, 10, 0, 0],
                            alignment: 'center'
                        },
                        { /* barra de escala */
                            alignment: 'right',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ /* mapa */
                                image: null,
                                width: 780,
                                height: 1125
                            }]
                        ]
                    },
                    layout: {
                        paddingLeft: function (i, node) { return 0; },
                        paddingRight: function (i, node) { return 0; },
                        paddingTop: function (i, node) { return 0; },
                        paddingBottom: function (i, node) { return 0; }
                    }
                }
            ]
        },
        reset: function () {
            this.layoutPDF.content = [
                {
                    columns: [
                        { /* logo */
                            image: null,
                            height: 22,
                            width: 45,
                            margin: [0, 0, 0, 6]
                        },
                        { /* título */
                            text: "",
                            width: 489,
                            margin: [0, 10, 0, 0],
                            alignment: 'center'
                        },
                        { /* barra de escala */
                            alignment: 'right',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ /* mapa */
                                image: null,
                                width: 780,
                                height: 1125
                            }]
                        ]
                    },
                    layout: {
                        paddingLeft: function (i, node) { return 0; },
                        paddingRight: function (i, node) { return 0; },
                        paddingTop: function (i, node) { return 0; },
                        paddingBottom: function (i, node) { return 0; }
                    }
                }
            ];
        }
    };
    /* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-prnmap-landscape-a3 indicando el valor en px la sección del mapa   */
    var a3_landscape = {
        logoWidth: 60,
        logoHeight: 30,
        layoutPDF: {
            pageSize: {
                width: 1190.55,
                height: 841.89
            },
            pageMargins: [28.775, 14, 28.775, 14.89],
            content: [
                {
                    columns: [
                        { /* logo */
                            image: null,
                            height: 22,
                            width: 45,
                            margin: [0, 0, 0, 6]
                        },
                        { /* título */
                            text: "",
                            alignment: 'center',
                            margin: [0, 10, 0, 0],
                            width: 600
                        },
                        { /* barra de escala */
                            alignment: 'right',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ /* mapa */
                                image: null,
                                width: 1131,
                                height: 783
                            }]
                        ]
                    },
                    layout: {
                        paddingLeft: function (i, node) { return 0; },
                        paddingRight: function (i, node) { return 0; },
                        paddingTop: function (i, node) { return 0; },
                        paddingBottom: function (i, node) { return 0; }
                    }
                }
            ]
        },
        reset: function () {
            this.layoutPDF.content = [
                {
                    columns: [
                        { /* logo */
                            image: null,
                            height: 22,
                            width: 45,
                            margin: [0, 0, 0, 6]
                        },
                        { /* título */
                            text: "",
                            alignment: 'center',
                            margin: [0, 10, 0, 0],
                            width: 600
                        },
                        { /* barra de escala */
                            alignment: 'right',
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ /* mapa */
                                image: null,
                                width: 1131,
                                height: 783
                            }]
                        ]
                    },
                    layout: {
                        paddingLeft: function (i, node) { return 0; },
                        paddingRight: function (i, node) { return 0; },
                        paddingTop: function (i, node) { return 0; },
                        paddingBottom: function (i, node) { return 0; }
                    }
                }
            ];
        }
    };

    const getLayout = function (orientation, format) {
        switch (orientation) {
            case ORIENTATION.PORTRAIT: {
                switch (format) {
                    case PAGE_SIZE.A4: {
                        return a4_portrait;
                    }
                    case PAGE_SIZE.A3: {
                        return a3_portrait;
                    }
                    default:
                }
                break;
            }
            case ORIENTATION.LANDSCAPE: {
                switch (format) {
                    case PAGE_SIZE.A4: {
                        return a4_landscape;
                    }
                    case PAGE_SIZE.A3: {
                        return a3_landscape;
                    }
                    default:
                }
                break;
            }
            default:
                return a4_portrait;
        }
    };

    const getLogoColumn = function (layout) {
        return layout.layoutPDF.content[0].columns[0];
    };
    const getTitleColumn = function (layout) {
        return layout.layoutPDF.content[0].columns[1];
    };
    const getScaleBarColumn = function (layout) {
        return layout.layoutPDF.content[0].columns[2];
    };
    const getMap = function (layout) {
        return layout.layoutPDF.content[1].table.body[0][0];
    };

    const options = {
        qrCode: {
            sideLength: 85
        }
    };

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-prnmap.hbs";
    ctlProto.template[ctlProto.CLASS + '-view'] = TC.apiLocation + "TC/templates/tc-ctl-prnmap-view.hbs";
    ctlProto.template[ctlProto.CLASS + '-tools'] = TC.apiLocation + "TC/templates/tc-ctl-prnmap-tools.hbs";

    const hasLegend = function () {
        const self = this;

        return self.map.workLayers.some(function (layer) {
            return layer.type === TC.Consts.layerType.WMS && layer.getVisibility();
        });
    };

    const hasLegendToPrint = function () {
        const self = this;

        return self.map.workLayers.some(function (layer) {
            if (layer.type === TC.Consts.layerType.WMS && layer.getVisibility()) {
                for (var i = 0; i < layer.names.length; i++) {
                    if (layer.isVisibleByScale(layer.names[i])) {
                        return true;
                    }
                }

                return false;
            }

            return false;
        });
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.control.MapInfo.prototype.register.call(self, map);

        // GLS: Añado el flag al mapa para tenerlo en cuenta cuando se establece la función de carga de imágenes
        self.map.mustBeExportable = true;

        const manageLegendOnZoom = function () {
            var layout = getLayout(self.orientation || ORIENTATION.PORTRAIT, self.format.toString().toUpperCase() || "A4");
            layout.reset();
        };

        const print = function () {

            self.map.setView(TC.Consts.view.PRINTING);

            var codeContainer = document.querySelector('.' + self.CLASS + '-qrcode');
            const cb = document.querySelector(`#${self.CLASS}-image-qr-${self.id}`);
            if (!cb.disabled && cb.checked) {
                if (!codeContainer) {
                    codeContainer = document.createElement('div');
                    codeContainer.classList.add(self.CLASS + '-qrcode');
                    self.map.div.appendChild(codeContainer);
                }

                codeContainer.innerHTML = '';
                self.makeQRCode(codeContainer, options.qrCode.sideLength, options.qrCode.sideLength);
            } else {
                if (codeContainer) {
                    codeContainer.innerHTML = '';
                }
            }

            const printBtnSelector = '.' + self.CLASS + '-btn';
            self.map.on(TC.Consts.event.STARTLOADING, function () {
                const printBtn = self.div.querySelector(printBtnSelector);
                printBtn.classList.add('disabled');
                printBtn.disabled = true;
            });

            self.map.on(TC.Consts.event.STOPLOADING, function () {
                const printBtn = self.div.querySelector(printBtnSelector);
                printBtn.classList.remove('disabled');
                printBtn.disabled = false;
            });

            if (hasLegend.call(self)) {
                // GLS: controlamos si una capa deja de verse por la escala para resetear la leyenda                
                self.map.on(TC.Consts.event.ZOOM, manageLegendOnZoom);
            }

            const updateCanvas = function (printFormat) {
                if (printFormat) {
                    self.map.div.classList.add(printFormat);
                    /**
                     * Validamos que el resultado en pixels sean valores enteros, si no lo son, redondeamos y establecemos evitando estiramiento del canvas /
                     */
                    var bounding = self.map.div.getBoundingClientRect();
                    if (!Number.isInteger(bounding.width)) {
                        self.map.div.style.width = Math.round(bounding.width) + 'px';
                    }
                    if (!Number.isInteger(bounding.height)) {
                        self.map.div.style.height = Math.round(bounding.height) + 'px';
                    }

                    self.map.toast(self.getLocaleString('print.advice.title') + ': ' + self.getLocaleString('print.advice.desc'), { type: TC.Consts.msgType.INFO, duration: 7000 });
                }

                self.map.wrap.map.updateSize();
            };

            const resetPrinting = function () {

                var layout = getLayout(self.orientation || ORIENTATION.PORTRAIT, self.format.toString().toUpperCase() || "A4");
                layout.reset();

                if (hasLegend.call(self)) {
                    self.map.off(TC.Consts.event.ZOOM, manageLegendOnZoom);
                }

                self.map.toastHide(self.getLocaleString('print.advice.title') + ': ' + self.getLocaleString('print.advice.desc'));

                self.map.div.classList.remove(self.currentFormat, self.CLASS + '-printing');

                self.map.div.style.removeProperty('width');
                self.map.div.style.removeProperty('height');

                updateCanvas();

                self.map.setView(TC.Consts.view.DEFAULT);

                self._viewDiv.classList.add(TC.Consts.classes.HIDDEN);
            };

            if (!self._viewDiv) {
                self._viewDiv = TC.Util.getDiv();
                document.body.appendChild(self._viewDiv);

                self.getRenderedHtml(self.CLASS + '-view', null, function (html) {
                    self._viewDiv.innerHTML = html;
                });

                self.getRenderedHtml(self.CLASS + '-tools', null, function (html) {
                    self.map.div.insertAdjacentHTML('beforeend', html);

                    self.map.div.querySelector('.' + self.CLASS + '-btn-close').addEventListener('click', resetPrinting);

                    self.map.div.querySelector('.' + self.CLASS + '-btn-pdf').addEventListener('click', self.createPdf.bind(self));
                });
            }

            self.orientation = self.div.querySelector("#print-design").value;
            self.format = self.div.querySelector("#print-size").value;

            self.currentFormat = self.CLASS + '-' + self.orientation + '-' + self.format;

            self._viewDiv.classList.remove(TC.Consts.classes.HIDDEN);

            self.map.div.classList.add(self.CLASS + "-printing");
            updateCanvas(self.currentFormat);
        };

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('.' + self.CLASS + '-btn', print));

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector(`#${self.CLASS}-image-qr-${self.id}`, function (evt) {
            self.generateLink();
        }));

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('h2', function (evt) {
            if (!self.registeredListeners) {
                self.generateLink();
            }
            self.registerListeners();
        }));

        return result;
    };

    ctlProto.render = function (callback) {
        const self = this;
        return TC.Control.prototype.renderData.call(self, { controlId: self.id }, callback);
    };

    ctlProto.createPdf = function () {
        var self = this;

        var loadingCtrl = self.map.getControlsByClass(TC.control.LoadingIndicator)[0];
        var hasWait = loadingCtrl.addWait();

        TC.loadJS(!window.pdfMake, [TC.Consts.url.PDFMAKE], function () {
            const olViewport = self.map.div.querySelectorAll('.ol-viewport');
            for (var i = 0, len = olViewport.length; i < len; i++) {
                const elm = olViewport[i];
                if (!elm.parentElement.classList.contains('ol-overviewmap-map')) {
                    self.canvas = elm.querySelector('canvas');
                    break;
                }
            }

            var layout = getLayout(self.orientation || ORIENTATION.PORTRAIT, self.format.toString().toUpperCase() || "A4");
            var printLayout = layout.layoutPDF;

            const createPDF = function (printLayout) {
                var filename = window.location.host + '_';
                var title = self.div.querySelector('.' + self.CLASS + '-title').value.trim();

                if (title) {
                    filename += title;
                } else {
                    var currentDate = TC.Util.getFormattedDate(new Date().toString(), true);
                    filename += currentDate;
                }

                try {
                    pdfMake.createPdf(printLayout).download(filename.replace(/[\\\/:*?"<>\|]/g, "") + '.pdf');
                } catch (error) {
                    self.map.toast(self.getLocaleString('print.error'), { type: TC.Consts.msgType.ERROR });
                    TC.error(error.message + '  ' + error.stack, TC.Consts.msgErrorMode.EMAIL);
                }

                loadingCtrl.removeWait(hasWait);
            };

            const imageErrorHandling = function (imageUrl) {
                TC.error(self.getLocaleString('print.error'));
                TC.error('No se ha podido generar el base64 correspondiente a la imagen: ' + imageUrl, TC.Consts.msgErrorMode.EMAIL, 'Error en la impresión'); //Correo de error
            };

            const getLogo = function () {

                const onLogoError = function () {
                    var logoColumn = getLogoColumn(layout);
                    delete logoColumn.image;
                    logoColumn.text = "";
                    return logoColumn;
                };

                if (self.options.logo) {
                    return TC.Util.imgToDataUrl(self.options.logo).then(function (result) {
                        const canvas = result.canvas;
                        const dataUrl = result.dataUrl;
                        var size = TC.Util.calculateAspectRatioFit(canvas.width, canvas.height, layout.logoWidth, layout.logoHeight);

                        var logoColumn = getLogoColumn(layout);
                        //URI: si no se define la anchura en el layout calcula la anchura en función de proporción entre ancho y alto de la imagen y el alto de su posición en el PDF
                        if (!logoColumn.width)
                            logoColumn.width = (canvas.width / canvas.height) * logoColumn.height;
                        logoColumn.image = dataUrl;
                        return logoColumn;

                    }, function () {
                        imageErrorHandling(self.options.logo);

                        return onLogoError();
                    });
                } else {
                    return onLogoError();
                }
            };
            const getScaleBar = function () {
                const onError = function () {
                    var scaleBarColumn = getScaleBarColumn(layout);
                    delete scaleBarColumn.image;
                    scaleBarColumn.text = "";
                    scaleBarColumn.width = "auto";
                    return scaleBarColumn;
                };

                var scaleCtrl = self.map.getControlsByClass(TC.control.ScaleBar)[0];
                if (scaleCtrl) {
                    var elem = document.getElementsByClassName("ol-scale-line-inner"); // no cogemos el DIV del control ya que contiene los bordes y suman al ancho total
                    var bounding = elem[0].getBoundingClientRect();
                    if (bounding) {
                        var styling = getComputedStyle(elem[0], null);
                        var leftBorder = parseInt(styling.getPropertyValue('border-left-width').replace('px', '')) || 0;
                        var rightBorder = parseInt(styling.getPropertyValue('border-right-width').replace('px', '')) || 0;

                        var scaleBarColumn = getScaleBarColumn(layout);

                        scaleBarColumn.table = {
                            widths: [((bounding.width > bounding.height ? bounding.width : bounding.height) - leftBorder - rightBorder) * 0.75], // lo pasamos a pt
                            body: [
                                [{ border: [true, false, true, true], text: scaleCtrl.getText(), fontSize: 10, alignment: 'center' }]
                            ]
                        };

                        scaleBarColumn.layout = {
                            paddingLeft: function (i, node) { return 0; },
                            paddingRight: function (i, node) { return 0; },
                            paddingTop: function (i, node) { return 0; },
                            paddingBottom: function (i, node) { return 0; }
                        };

                        return scaleBarColumn;
                    } else {
                        return onError();
                    }
                } else {
                    return onError();
                }
            };
            const getLegend = function () {
                var content = [];
                var layers = self.map.workLayers.filter(function (layer) {
                    return layer.type === TC.Consts.layerType.WMS && layer.getVisibility();
                });
                var legendByGroup = [];
                var indentationIncrement = 7;

                var _process = function (value, parentLayer, treeLevel) {
                    if (parentLayer.isVisibleByScale(value.name)) { //Si la capa es visible, la mostramos en la leyenda
                        var src,
                            srcBase64;

                        //Para las capas cargadas por POST (por ejemplo la búsquedas de Comercio Pamplona)
                        if (parentLayer.options && parentLayer.options.params && parentLayer.options.params.base64LegendSrc) {
                            srcBase64 = parentLayer.options.params.base64LegendSrc;
                        }
                        else if (value.legend) {
                            src = value.legend.src;
                        }

                        result.push({ src: src, title: value.title, level: treeLevel, srcBase64: srcBase64 });
                    }
                };
                var _traverse = function (o, func, parentLayer, treeLevel) {
                    if (Array.isArray(o)) {
                        for (var i = 0; i < o.length; i++) {
                            _traverse(o[i], func, parentLayer, treeLevel);
                        }
                    } else {
                        if (o && o.hasOwnProperty('children') && o.children.length > 0) {
                            if (o.title && o.name) {
                                result.push({ header: o.title, level: treeLevel });
                            }
                            _traverse(o.children, func, parentLayer, ++treeLevel);
                        }
                    }

                    if (o && o.hasOwnProperty('children') && o.children.length == 0) {
                        func.apply(this, [o, parentLayer, treeLevel]);
                        treeLevel--;
                    }
                };
                var _getLegendImages = function () {
                    var imagePromises = [];

                    for (var i = 0; i < legendByGroup.length; i++) {
                        var layers = legendByGroup[i].layers;

                        for (var j = 0; j < layers.length; j++) {
                            (function (k, l) {
                                var layer = legendByGroup[k].layers[l];
                                var src = layer.src || layer.srcBase64;

                                if (src) {

                                    if (!TC.tool || !TC.tool.Proxification) {
                                        TC.syncLoadJS(TC.apiLocation + 'TC/tool/Proxification');
                                    }

                                    imagePromises.push(new Promise(function (resolve, reject) {
                                        var toolProxification = new TC.tool.Proxification(TC.proxify, { allowedMixedContent: true });
                                        toolProxification.fetchImage(src, { exportable: true }).then(function (img) {
                                            if (img.complete) {
                                                var imageDetail = TC.Util.imgTagToDataUrl(img, 'image/png');
                                                layer.image = { base64: imageDetail.base64, canvas: imageDetail.canvas };
                                            } else {
                                                imageErrorHandling(src);
                                            }

                                            resolve();

                                        }, function (error) {
                                            imageErrorHandling(src);
                                            reject(error);
                                        });
                                    }));
                                }
                            })(i, j);
                        }
                    }

                    return imagePromises;
                };

                layers.forEach(function (layer) {
                    result = [];

                    var hideTree = layer.options.hideTree;

                    layer.tree = null;
                    layer.options.hideTree = true;

                    _traverse(layer.getTree(), _process, layer, 0);

                    layer.options.hideTree = hideTree;

                    if (result.length > 0) {
                        legendByGroup.push({ title: layer.title, layers: result });
                    }
                });

                return new Promise(function (resolve, reject) {
                    Promise.all(_getLegendImages()).then(function () {

                        const getGroupTable = function (group, index) {                            
                            var rows = [[{ text: group.title, colSpan: 2, alignment: 'left', fontSize: 11, margin: [0, index > 0 ? 10 : 0, 0, 5] }, {}]];
                            var indentation = 10;

                            rows = rows.concat(group.layers.filter(function (item) {
                                return item.hasOwnProperty('header') && item.header.trim().toLowerCase() !== group.title.trim().toLowerCase();
                            }).map(function (item) {
                                return [{ text: item.header.trim(), colSpan: 2, alignment: 'left', margin: [indentation * item.level, 0, 0, 3] }, {}];
                            }));

                            const headerRows = rows.length;
                            var headerItem = null;
                            var itemIndex = null;

                            const getLayerTable = function (item, index) {
                                if (item.header) {
                                    headerItem = item;

                                    if (itemIndex) {
                                        itemIndex = null;
                                    }
                                } else {
                                    if (!itemIndex) {
                                        itemIndex = 1;
                                    }

                                    var position;
                                    if (headerItem) {
                                        var headerIndex = rows.map(function (item) { return item[0].text }).indexOf(headerItem.header);
                                        position = headerIndex + itemIndex++;
                                    }

                                    if (item.image) {
                                        var imageWidth = item.image.canvas.width / 2;
                                        var imageHeight = (imageWidth * item.image.canvas.height / item.image.canvas.width);

                                        var data = [{
                                            text: item.title,
                                            fontSize: 9,
                                            width: 'auto',
                                            margin: [indentation * item.level, 0, 0, 2]
                                        }, {
                                            image: item.image.base64,
                                            width: imageWidth,
                                            height: imageHeight,
                                            margin: [indentation * item.level, 0, 0, 2]
                                        }];

                                        if (position) {
                                            rows.splice(position, 0, data);
                                        } else {
                                            rows.push(data);
                                        }

                                    } else {
                                        var data = [{
                                            text: item.title,
                                            fontSize: 9,
                                            colSpan: 2,
                                            margin: [indentation * item.level, 0, 0, 2]
                                        }, {}];

                                        if (position) {
                                            rows.splice(position, 0, data);
                                        } else {
                                            rows.push(data);
                                        }
                                    }
                                }
                            };

                            group.layers.forEach(getLayerTable);

                            content.push({
                                layout: 'noBorders',
                                table: {
                                    dontBreakRows: true,
                                    keepWithHeaderRows: 1,
                                    headerRows: headerRows,
                                    body: rows
                                }
                            });
                        };

                        legendByGroup.map(function (group, index) {
                            return {
                                groupIndex: index,
                                height: group.layers.filter(function (item) {
                                    return item.image && item.image.canvas;
                                }).reduce(function (prev, current, index, vector) {
                                    return prev + vector[index].image.canvas.height;
                                }, 0)
                            }
                        }).sort(function (a, b) {
                            if (a.height > b.height) {
                                return 1;
                            }
                            if (a.height < b.height) {
                                return -1;
                            }
                            return 0;
                        }).forEach(function (groupWithHeight, index) {
                            getGroupTable(legendByGroup[groupWithHeight.groupIndex], index)
                        });

                        resolve(content);

                    }, function () {
                        reject([]);
                    });
                });
            };
            const drawQR = function () {
                // GLS: añadimos el QR
                //QR
                const cb = document.querySelector(`#${self.CLASS}-image-qr-${self.id}`);
                if (!cb.disabled && cb.checked) {
                    const qrTarget = document.querySelector('.' + self.CLASS + '-qrcode');
                    qrTarget.innerHTML = '';
                    return self.makeQRCode(qrTarget, options.qrCode.sideLength, options.qrCode.sideLength).then(function (qrCodeBase64) {
                        if (qrCodeBase64) {
                            return TC.Util.addToCanvas(self.canvas, qrCodeBase64, { x: self.canvas.width - options.qrCode.sideLength, y: self.canvas.height - options.qrCode.sideLength }, {width: options.qrCode.sideLength, height: options.qrCode.sideLength }).then(function (mapCanvas) {
                                return mapCanvas;
                            });
                        } else {                            
                            return self.canvas;
                        }
                    });
                } else {
                    return self.canvas;
                }
            };

            const basics = [getLogo, function () {
                var titleColumn = getTitleColumn(layout);
                titleColumn.text = self.div.querySelector('.' + self.CLASS + '-title').value.trim();
                return titleColumn;
            }, getScaleBar, drawQR];

            Promise.all(basics.map(function (fn) {
                return fn();
            })).then(function (basicsDone) {

                if (basicsDone[2].table) { // GLS: ajustamos el ancho del título para arrinconar la escala
                    layout.layoutPDF.content[0].columns[1].width = layout.layoutPDF.pageSize.width - (layout.layoutPDF.pageMargins[0] + layout.layoutPDF.pageMargins[2]) - layout.layoutPDF.content[0].columns[0].width - (layout.layoutPDF.content[0].columns[2].table.widths[0] + 2);
                }

                var mapPlace = getMap(layout);
                var canvas = basicsDone[3] || self.canvas;

                mapPlace.image = canvas.toDataURL();

                if (hasLegendToPrint.call(self) && // GLS: validamos que haya capas visibles por escala 
                    printLayout.content.length == 2) { // GLS: es la primera descarga o hemos resetado la leyenda por algún zoom por lo que no tenemos la leyenda en el layout

                    const title = self.div.querySelector('.' + self.CLASS + '-title').value.trim();
                    printLayout.content.push({
                        pageBreak: 'before',
                        pageOrientation: (self.options.legend && self.options.legend.orientation) || ORIENTATION.PORTRAIT,
                        text: title.length > 0 ? title : '',
                        fontSize: 14,
                        margin: [0, 20, 0, 10]
                    });

                    getLegend().then(function (content) {
                        printLayout.content = printLayout.content.concat(content);
                        createPDF(printLayout);
                    });
                } else {
                    createPDF(printLayout);
                }
            });
        });
    };

    ctlProto.manageMaxLengthExceed = function (maxLengthExceed) {
        const self = this;
        const alertElm = self.div.querySelector('.' + self.CLASS + '-alert');
        const checkboxQR = document.querySelector(`#${self.CLASS}-image-qr-${self.id}`);

        checkboxQR.disabled = maxLengthExceed.qr;

        if (checkboxQR.checked) {
            alertElm.classList.toggle(TC.Consts.classes.HIDDEN, !maxLengthExceed.qr);
        } else {
            alertElm.classList.add(TC.Consts.classes.HIDDEN);
        }
    };

    ctlProto.generateLink = async function () {
        const self = this;
        const checkbox = self.div.querySelector(`.${self.CLASS}-div input[id|="${self.CLASS}-image-qr-${self.id}"]`);
        const label = self.div.querySelector(`label[for="${checkbox.id}"]`);
        checkbox.disabled = true;
        label.classList.add(TC.Consts.classes.LOADING);
        const result = await TC.control.MapInfo.prototype.generateLink.call(self);
        label.classList.remove(TC.Consts.classes.LOADING);
        return result;
    };

})();
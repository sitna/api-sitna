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

    ctlProto.CLASS = 'tc-ctl-printMap';

    var self = this;

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

    /* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-printMap-portrait-a4 indicando el valor en px la sección del mapa   */
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
                            width: 45,
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
                            width: 45,
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
    /* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-printMap-landscape-a4 indicando el valor en px la sección del mapa   */
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

    /* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-printMap-portrait-a3 indicando el valor en px la sección del mapa   */
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
    /* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-printMap-landscape-a3 indicando el valor en px la sección del mapa   */
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

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/PrintMap.html";
        ctlProto.template[ctlProto.CLASS + '-view'] = TC.apiLocation + "TC/templates/PrintMapView.html";
        ctlProto.template[ctlProto.CLASS + '-tools'] = TC.apiLocation + "TC/templates/PrintMapTools.html";
    }
    else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "print" }).w("</h2><div><div class=\"tc-ctl-printMap-div\"><div class=\"tc-group tc-ctl-printMap-cnt\"><label>").h("i18n", ctx, {}, { "$key": "title" }).w(":</label><input type=\"text\" class=\"tc-ctl-printMap-title tc-textbox\" maxlength=\"30\" placeholder=\"").h("i18n", ctx, {}, { "$key": "mapTitle" }).w("\" /></div><div class=\"tc-group tc-ctl-printMap-cnt\"><label>").h("i18n", ctx, {}, { "$key": "layout" }).w(":</label><select id=\"print-design\" class=\"tc-combo\"><option value=\"landscape\">").h("i18n", ctx, {}, { "$key": "landscape" }).w("</option><option value=\"portrait\">").h("i18n", ctx, {}, { "$key": "portrait" }).w("</option></select></div><div class=\"tc-group tc-ctl-printMap-cnt\"><label>").h("i18n", ctx, {}, { "$key": "size" }).w(":</label><select id=\"print-size\" class=\"tc-combo\"><option value=\"a4\">A4</option><option value=\"a3\">A3</option></select></div><div class=\"tc-group tc-ctl-printMap-cnt tc-ctl-printMap-cnt-btn\"><input id=\"tc-ctl-printMap-image-qr\" class=\"tc-hidden\" type=\"checkbox\" checked style=\"display:none;\" /><label for=\"tc-ctl-printMap-image-qr\" class=\"tc-ctl-printMap-image-qr-label\" title=\"").h("i18n", ctx, {}, { "$key": "createQrCodeToImage" }).w("\">").h("i18n", ctx, {}, { "$key": "appendQRCode" }).w("</label><button class=\"tc-ctl-printMap-btn tc-button tc-icon-button\" title=\"").h("i18n", ctx, {}, { "$key": "printMap" }).w("\">").h("i18n", ctx, {}, { "$key": "print" }).w("</button></div><div class=\"tc-group tc-ctl-printMap-cnt\"><div class=\"tc-ctl-printMap-alert tc-alert alert-warning tc-hidden\"><p>").h("i18n", ctx, {}, { "$key": "qrAdvice|s" }).w("</p></div></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-view'] = function () { dust.register(ctlProto.CLASS + '-view', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-printMap-view\"> </div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-tools'] = function () { dust.register(ctlProto.CLASS + '-tools', body_0); function body_0(chk, ctx) { return chk.w("<div class=\"tc-ctl-printMap-tools\"><div class=\"tc-ctl-printMap-btn-pdf\" title=\"").h("i18n", ctx, {}, { "$key": "printpdf" }).w("\"/><div class=\"tc-ctl-printMap-btn-close\" title=\"").h("i18n", ctx, {}, { "$key": "close" }).w("\"/></div> "); } body_0.__dustBody = !0; return body_0 };
    }

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

            if ($("#" + self.CLASS + "-image-qr").prop('checked')) {
                var codeContainer = $('.' + self.CLASS + '-qrcode');
                if (codeContainer.length == 0) {
                    self.map._$div.append('<div class="' + self.CLASS + '-qrcode"></div>');
                    codeContainer = $('.' + self.CLASS + '-qrcode');
                }

                codeContainer.empty();
                self.makeQRCode(codeContainer, options.qrCode.sideLength, options.qrCode.sideLength);
            } else {
                var codeContainer = $('.' + self.CLASS + '-qrcode');
                if (codeContainer) {
                    codeContainer.empty();
                }
            }

            var printBtnSelector = '.' + self.CLASS + '-btn';
            self.map.$events.on(TC.Consts.event.STARTLOADING, function () {
                var printBtn = self._$div.find(printBtnSelector);
                printBtn.addClass('disabled');
                printBtn.attr('disabled', 'disabled');
            });

            self.map.$events.on(TC.Consts.event.STOPLOADING, function () {
                var printBtn = self._$div.find(printBtnSelector);
                printBtn.removeClass('disabled');
                printBtn.removeAttr('disabled');
            });

            if (hasLegend.call(self)) {
                // GLS: controlamos si una capa deja de verse por la escala para resetear la leyenda                
                self.map.$events.on(TC.Consts.event.ZOOM, manageLegendOnZoom);
            }

            const updateCanvas = function (printFormat) {
                if (printFormat) {
                    self.map._$div.addClass(printFormat);
                    /**
                     * Validamos que el resultado en pixels sean valores enteros, si no lo son, redondeamos y establecemos evitando estiramiento del canvas /
                     */
                    var bounding = self.map.div.getBoundingClientRect();
                    if (!Number.isInteger(bounding.width)) {
                        self.map._$div.css('width', Math.round(bounding.width));
                    }
                    if (!Number.isInteger(bounding.height)) {
                        self.map._$div.css('height', Math.round(bounding.height));
                    }

                    self.map.toast(self.getLocaleString('print.advice.title') + ': ' + self.getLocaleString('print.advice.desc'), { type: TC.Consts.msgType.INFO, duration: 7000 });
                }

                self.map.wrap.map.updateSize();
            };

            const resetPrinting = function () {

                var layout = getLayout(self.orientation || ORIENTATION.PORTRAIT, self.format.toString().toUpperCase() || "A4");
                layout.reset();

                if (hasLegend.call(self)) {
                    self.map.$events.off(TC.Consts.event.ZOOM, manageLegendOnZoom);
                }

                self.map.toastHide(self.getLocaleString('print.advice.title') + ': ' + self.getLocaleString('print.advice.desc'));

                self.map._$div.removeClass(self.currentFormat);
                self.map._$div.removeClass(self.CLASS + "-printing");

                self.map._$div.css('width', '');
                self.map._$div.css('height', '');

                updateCanvas();

                self.map.setView(TC.Consts.view.DEFAULT);

                self._$viewDiv.addClass(TC.Consts.classes.HIDDEN);
            };

            if (!self._$viewDiv) {
                self._$viewDiv = $(TC.Util.getDiv());
                self._$viewDiv.appendTo('body');

                self.getRenderedHtml(self.CLASS + '-view', null, function (html) {
                    self._$viewDiv.html(html);
                });

                self.getRenderedHtml(self.CLASS + '-tools', null, function (html) {
                    self.map._$div.append(html);

                    self.map._$div.find('.' + self.CLASS + '-btn-close').on('click', resetPrinting);

                    self.map._$div.find('.' + self.CLASS + '-btn-pdf').on('click', self.createPdf.bind(self));
                });
            }

            self.orientation = $("#print-design").val();
            self.format = $("#print-size").val();

            self.currentFormat = self.CLASS + '-' + self.orientation + '-' + self.format;

            if (self._$viewDiv.hasClass(TC.Consts.classes.HIDDEN)) {
                self._$viewDiv.removeClass(TC.Consts.classes.HIDDEN);
            }

            self.map._$div.addClass(self.CLASS + "-printing");
            updateCanvas(self.currentFormat);
        };

        self._$div.on('click', '.' + self.CLASS + '-btn', print);

        self._$div.on("click", "#" + self.CLASS + "-image-qr", function (evt) {
            self.generateLink();
        });

        self._$div.on("click", "h2", function (evt) {
            self.generateLink();
            self.registerListeners();
        });

        return result;
    };

    ctlProto.createPdf = function () {
        var self = this;

        var loadingCtrl = self.map.getControlsByClass(TC.control.LoadingIndicator)[0];
        var hasWait = loadingCtrl.addWait();

        TC.loadJS(!window.pdfMake, [TC.Consts.url.PDFMAKE], function () {
            self.canvas = self.map._$div.find('.ol-viewport').filter(function () {
                return !$(this).parent().hasClass('ol-overviewmap-map');
            }).find('canvas').get(0);

            var layout = getLayout(self.orientation || ORIENTATION.PORTRAIT, self.format.toString().toUpperCase() || "A4");
            var printLayout = layout.layoutPDF;

            const createPDF = function (printLayout) {
                var filename = window.location.host + '_';
                var title = $('.' + self.CLASS + '-title').val().trim();

                if (title) {
                    filename += title;
                } else {
                    var currentDate = TC.Util.getFormattedDate(new Date().toString(), true);
                    filename += currentDate;
                }

                pdfMake.createPdf(printLayout).download(filename.replace(/[\\\/:*?"<>\|]/g, "") + '.pdf');

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
                    return TC.Util.imgToDataUrl(self.options.logo, 'image/png').then(function (dataUrl, canvas) {
                        var size = TC.Util.calculateAspectRatioFit(canvas.width, canvas.height, layout.logoWidth, layout.logoHeight);

                        var logoColumn = getLogoColumn(layout);
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
                        onError();
                    }
                } else {
                    onError();
                }
            };
            const getLegend = function () {
                var deferred = $.Deferred();

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

                                    imagePromises.push($.Deferred());
                                    var promise = imagePromises[imagePromises.length - 1];

                                    var toolProxification = new TC.tool.Proxification(TC.proxify, { allowedMixedContent: true });
                                    toolProxification.fetchImage(src, { exportable: true }).then(function (img) {
                                        if (img.complete) {
                                            var imageDetail = TC.Util.imgTagToDataUrl(img, 'image/png');
                                            layer.image = { base64: imageDetail.base64, canvas: imageDetail.canvas };
                                        } else {
                                            imageErrorHandling(src);
                                        }

                                        promise.resolve();

                                    }, function (error) {
                                        imageErrorHandling(src);
                                        promise.reject();
                                    });
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

                $.when.apply($, _getLegendImages()).then(function () {

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
                                        rows.push(position);
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

                    deferred.resolve(content);

                }, function () {
                    deferred.reject([]);
                });

                return deferred;
            };
            const drawQR = function () {
                // GLS: añadimos el QR
                //QR
                if ($("#" + self.CLASS + "-image-qr").prop('checked')) {
                    $('.' + self.CLASS + '-qrcode').empty();
                    return self.makeQRCode($('.' + self.CLASS + '-qrcode'), options.qrCode.sideLength, options.qrCode.sideLength).then(function (qrCodeBase64) {
                        if (qrCodeBase64) {
                            return TC.Util.addToCanvas(self.canvas, qrCodeBase64, { x: self.canvas.width - options.qrCode.sideLength, y: self.canvas.height - options.qrCode.sideLength }, {width: options.qrCode.sideLength, height: options.qrCode.sideLength }).then(function (mapCanvas) {
                                return mapCanvas;
                            });
                        } else {
                            TC.error(self.getLocaleString('print.qr.error'));
                            return self.canvas;
                        }
                    });
                } else {
                    return self.canvas;
                }
            };

            const basics = [getLogo, function () {
                var titleColumn = getTitleColumn(layout);
                titleColumn.text = $('.' + self.CLASS + '-title').val().trim();
                return titleColumn;
            }, getScaleBar, drawQR];

            $.when.apply(this, basics.map(function (fn) {
                return fn();
            })).then(function () {

                var basicsDone = Array.prototype.slice.call(arguments);
                if (basicsDone[2].table) { // GLS: ajustamos el ancho del título para arrinconar la escala
                    layout.layoutPDF.content[0].columns[1].width = layout.layoutPDF.pageSize.width - (layout.layoutPDF.pageMargins[0] + layout.layoutPDF.pageMargins[2]) - layout.layoutPDF.content[0].columns[0].width - (layout.layoutPDF.content[0].columns[2].table.widths[0] + 2);
                }

                var mapPlace = getMap(layout);
                var canvas = basicsDone[3] || self.canvas;

                mapPlace.image = canvas.toDataURL();

                if (self.options.legend &&
                    self.options.legend.visible &&
                    hasLegendToPrint.call(self) && // GLS: validamos que haya capas visibles por escala 
                    printLayout.content.length == 2) { // GLS: es la primera descarga o hemos resetado la leyenda por algún zoom por lo que no tenemos la leyenda en el layout
                    
                    printLayout.content.push({
                        pageBreak: 'before',
                        pageOrientation: self.options.legend.orientation || 'portrait',
                        text: $('.' + self.CLASS + '-title').val().trim().length > 0 ? $('.' + self.CLASS + '-title').val().trim() : "",
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

        if ($("#" + self.CLASS + "-image-qr").prop('checked')) {
            if (maxLengthExceed.qr) {
                self._$div.find('.' + self.CLASS + '-alert').removeClass(TC.Consts.classes.HIDDEN);
            } else if (!maxLengthExceed.qr) {
                self._$div.find('.' + self.CLASS + '-alert').addClass(TC.Consts.classes.HIDDEN);
            }
        } else {
            self._$div.find('.' + self.CLASS + '-alert').addClass(TC.Consts.classes.HIDDEN);
        }
    };

})();
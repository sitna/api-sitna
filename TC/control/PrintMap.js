
/**
  * Opciones de control de impresión.
  * @typedef PrintMapOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {string} [logo] - URL del archivo de imagen del logo a añadir a la hoja de impresión.
  * @property {PrintMapLegendOptions} [legend] - Opciones de configuración para mostrar la leyenda del mapa en una segunda página de impresión.
  */

/**
  * Opciones de leyenda para la impresión.
  * @typedef PrintMapLegendOptions
  * @memberof SITNA.control
  * @see SITNA.control.PrintMapOptions
  * @property {boolean} [visible=false] - Determina si junto a la página del mapa se imprime una segunda página con la leyenda.
  * @property {string} [orientation="portrait"] - Determina la orientación de la página de impresión que contiene la leyenda. Puede tomar el valor `portrait` (vertical) o `landscape` (horizontal).
  */

import TC from '../../TC';
import Util from '../Util';
import Consts from '../Consts';
import MapInfo from './MapInfo';
import ScaleBar from './ScaleBar';
import '../tool/Proxification';
import { CreateSymbolizer } from './LayerLegend';

TC.control = TC.control || {};

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
const a4_portrait = {
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
                    paddingLeft: function (_i, _node) { return 0; },
                    paddingRight: function (_i, _node) { return 0; },
                    paddingTop: function (_i, _node) { return 0; },
                    paddingBottom: function (_i, _node) { return 0; }
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
                    paddingLeft: function (_i, _node) { return 0; },
                    paddingRight: function (_i, _node) { return 0; },
                    paddingTop: function (_i, _node) { return 0; },
                    paddingBottom: function (_i, _node) { return 0; }
                }
            }
        ];
    }
};
/* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-prnmap-landscape-a4 indicando el valor en px la sección del mapa   */
const a4_landscape = {
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
                    paddingLeft: function (_i, _node) { return 0; },
                    paddingRight: function (_i, _node) { return 0; },
                    paddingTop: function (_i, _node) { return 0; },
                    paddingBottom: function (_i, _node) { return 0; }
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
                    paddingLeft: function (_i, _node) { return 0; },
                    paddingRight: function (_i, _node) { return 0; },
                    paddingTop: function (_i, _node) { return 0; },
                    paddingBottom: function (_i, _node) { return 0; }
                }
            }
        ];
    }
};

/* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-prnmap-portrait-a3 indicando el valor en px la sección del mapa   */
const a3_portrait = {
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
                    paddingLeft: function (_i, _node) { return 0; },
                    paddingRight: function (_i, _node) { return 0; },
                    paddingTop: function (_i, _node) { return 0; },
                    paddingBottom: function (_i, _node) { return 0; }
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
                    paddingLeft: function (_i, _node) { return 0; },
                    paddingRight: function (_i, _node) { return 0; },
                    paddingTop: function (_i, _node) { return 0; },
                    paddingBottom: function (_i, _node) { return 0; }
                }
            }
        ];
    }
};
/* GLS: si se cambian los valores de los layout es necesario actualizar los valores de la clases CSS:  tc-ctl-prnmap-landscape-a3 indicando el valor en px la sección del mapa   */
const a3_landscape = {
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
                    paddingLeft: function (_i, _node) { return 0; },
                    paddingRight: function (_i, _node) { return 0; },
                    paddingTop: function (_i, _node) { return 0; },
                    paddingBottom: function (_i, _node) { return 0; }
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
                    paddingLeft: function (_i, _node) { return 0; },
                    paddingRight: function (_i, _node) { return 0; },
                    paddingTop: function (_i, _node) { return 0; },
                    paddingBottom: function (_i, _node) { return 0; }
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

class PrintMap extends MapInfo {

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-prnmap.mjs');
        const viewTemplatePromise = import('../templates/tc-ctl-prnmap-view.mjs');
        const toolsTemplatePromise = import('../templates/tc-ctl-prnmap-tools.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-view'] = (await viewTemplatePromise).default;
        template[self.CLASS + '-tools'] = (await toolsTemplatePromise).default;
        self.template = template;
    }

    render(callback) {
        const self = this;
        return super.renderData.call(self, { controlId: self.id }, callback);
    }

    register(map) {
        const self = this;
        const result = super.register.call(self, map);

        // GLS: Añado el flag al mapa para tenerlo en cuenta cuando se establece la función de carga de imágenes
        self.map.crossOrigin = 'anonymous';

        const manageLegendOnZoom = function () {
            var layout = getLayout(self.orientation || ORIENTATION.PORTRAIT, self.format.toString().toUpperCase() || "A4");
            layout.reset();
        };

        const print = function () {
            const div = self.getContainer();

            self.map.setView(Consts.view.PRINTING);

            var codeContainer = document.querySelector('.' + self.CLASS + '-qrcode');
            const cb = self.div.querySelector(`.${self.CLASS}-image-qr`);
            if (!cb.disabled && cb.checked) {
                if (!codeContainer) {
                    codeContainer = document.createElement('div');
                    codeContainer.classList.add(self.CLASS + '-qrcode');
                    self.getContainer().appendChild(codeContainer);
                }

                codeContainer.innerHTML = '';
                self.makeQRCode(codeContainer, options.qrCode.sideLength);
            } else {
                if (codeContainer) {
                    codeContainer.innerHTML = '';
                }
            }

            const printBtnSelector = '.' + self.CLASS + '-btn';
            self.map.on(Consts.event.STARTLOADING, function () {
                const printBtn = self.div.querySelector(printBtnSelector);
                printBtn.classList.add(Consts.classes.DISABLED);
                printBtn.disabled = true;
            });

            self.map.on(Consts.event.STOPLOADING, function () {
                const printBtn = self.div.querySelector(printBtnSelector);
                printBtn.classList.remove(Consts.classes.DISABLED);
                printBtn.disabled = false;
            });

            if (self.#hasLegend()) {
                // GLS: controlamos si una capa deja de verse por la escala para resetear la leyenda                
                self.map.on(Consts.event.ZOOM, manageLegendOnZoom);
            }

            const updateCanvas = function (printFormat) {

                if (printFormat) {
                    div.classList.add(printFormat);
                    /*
                     * Validamos que el resultado en pixels sean valores enteros, si no lo son, redondeamos y establecemos evitando estiramiento del canvas /
                     */
                    var bounding = div.getBoundingClientRect();
                    if (!Number.isInteger(bounding.width)) {
                        div.style.width = Math.round(bounding.width) + 'px';
                    }
                    if (!Number.isInteger(bounding.height)) {
                        div.style.height = Math.round(bounding.height) + 'px';
                    }

                    const newWidth = `calc(50% - ${bounding.width / 2}px)`;
                    self._viewDiv.querySelector(`.${self.CLASS}-view-left`).style.width = newWidth;
                    self._viewDiv.querySelector(`.${self.CLASS}-view-right`).style.width = newWidth;
                    self._viewDiv.querySelector(`.${self.CLASS}-view-bottom`).style.top = bounding.height + 'px';

                    self.map.toast(self.getLocaleString('print.advice.title') + ': ' + self.getLocaleString('print.advice.desc'), { type: Consts.msgType.INFO, duration: 7000 });

                    // En móviles no se ve el mapa entero, así que escalamos el viewport
                    bounding = div.getBoundingClientRect();
                    if (window.screen.width < bounding.width) {
                        const zoomOut = window.screen.width / bounding.width;
                        const zoomIn = bounding.width / window.screen.width;
                        const viewportMeta = document.querySelector('meta[name="viewport"]');
                        self._viewportMeta = viewportMeta.getAttribute('content');
                        viewportMeta.setAttribute('content', `user-scalable=yes, initial-scale=${zoomOut}, minimum-scale=${zoomOut}`);
                        const toolsStyle = self.getToolsElement().style;
                        self._toolsTransform = toolsStyle.transform;
                        self._toolsTransformOrigin = toolsStyle.transformOrigin;
                        toolsStyle.transform = `scale(${zoomIn}, ${zoomIn})`;
                        toolsStyle.transformOrigin = '100% 0%';
                        const toast = document.querySelector('.' + Consts.classes.TOAST_CONTAINER);
                        if (toast) {
                            const toastStyle = toast.style;
                            self._toastTransform = toastStyle.transform;
                            self._toastTransformOrigin = toastStyle.transformOrigin;
                            toastStyle.transform = `scale(${zoomIn}, ${zoomIn})`;
                            toastStyle.transformOrigin = '0% 100%';
                        }
                    }

                }
                if (!self.map.on3DView)
                    self.map.wrap.map.updateSize();
                else
                    self.map.view3D.getScene().render();
            };

            const resetPrinting = function () {

                // Deshacemos el reescalado para la previsualización en móviles
                if (Object.prototype.hasOwnProperty.call(self, '_viewportMeta')) {
                    document.querySelector('meta[name="viewport"]').setAttribute('content', self._viewportMeta);
                    delete self._viewportMeta;
                    const toolsStyle = self.getToolsElement().style;
                    toolsStyle.transform = self._toolsTransform;
                    toolsStyle.transformOrigin = self._toolsTransformOrigin;
                    delete self._toolsTransform;
                    delete self._toolsTransformOrigin;
                    const toast = document.querySelector('.' + Consts.classes.TOAST_CONTAINER);
                    if (toast) {
                        toast.style.transform = self._toastTransform;
                        toast.style.transformOrigin = self._toastTransformOrigin;
                    }
                    delete self._toastTransform;
                    delete self._toastTransformOrigin;
                }

                var layout = getLayout(self.orientation || ORIENTATION.PORTRAIT, self.format.toString().toUpperCase() || "A4");
                layout.reset();

                if (self.#hasLegend()) {
                    self.map.off(Consts.event.ZOOM, manageLegendOnZoom);
                }

                self.map.toastHide(self.getLocaleString('print.advice.title') + ': ' + self.getLocaleString('print.advice.desc'));

                const div = self.getContainer();

                div.classList.remove(self.currentFormat, self.CLASS + '-printing');

                div.style.removeProperty('width');
                div.style.removeProperty('height');

                updateCanvas();

                self.map.setView(Consts.view.DEFAULT);

                self._viewDiv.classList.add(Consts.classes.HIDDEN);
            };

            if (!self._viewDiv) {
                self._viewDiv = Util.getDiv();
                document.body.appendChild(self._viewDiv);

                self.getRenderedHtml(self.CLASS + '-view', null, function (html) {
                    self._viewDiv.innerHTML = html;
                });

                self.getRenderedHtml(self.CLASS + '-tools', null, function (html) {
                    div.insertAdjacentHTML('beforeend', html);

                    div.querySelector('.' + self.CLASS + '-btn-close').addEventListener('click', resetPrinting);

                    div.querySelector('.' + self.CLASS + '-btn-pdf').addEventListener('click', self.createPdf.bind(self));
                });
            }

            self.orientation = self.div.querySelector("#print-design").value;
            self.format = self.div.querySelector("#print-size").value;

            self.currentFormat = self.CLASS + '-' + self.orientation + '-' + self.format;

            self._viewDiv.classList.remove(Consts.classes.HIDDEN);

            self.getContainer().classList.add(self.CLASS + "-printing");
            updateCanvas(self.currentFormat);
        };

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('.' + self.CLASS + '-btn', print));

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS}-image-qr`, function (_evt) {
            self.generateLink();
        }));

        self.div.addEventListener('click', TC.EventTarget.listenerBySelector('h2', function (_evt) {
            if (!self.registeredListeners) {
                self.generateLink();
            }
            self.registerListeners();
        }));

        return result;
    }

    #hasLegend() {
        const self = this;

        return self.map.workLayers.some(function (layer) {
            return layer.type === Consts.layerType.WMS && layer.getVisibility();
        });
    }

    #hasLegendToPrint() {
        const self = this;

        return self.map.workLayers.some(function (layer) {
            if (layer.type === Consts.layerType.WMS && layer.getVisibility()) {
                for (var i = 0; i < layer.names.length; i++) {
                    if (layer.isVisibleByScale(layer.names[i])) {
                        return true;
                    }
                }

                return false;
            }

            return false;
        });
    }

    getContainer() {
        return this.map.on3DView ? this.map.view3D.container : this.map.div
    }

    async createPdf() {
        const self = this;

        var loadingCtrl = self.map.getLoadingIndicator();
        var hasWait = loadingCtrl.addWait();
        await import("pdfmake/build/pdfmake");
        let pdfFonts = await import("pdfmake/build/vfs_fonts");
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
        let result;
        var canvases = self.map.wrap.getCanvas();
        self.canvas = Util.mergeCanvases(canvases);
        //self.canvas = Util.mergeCanvases(self.map.wrap.getCanvas());
        var layout = getLayout(self.orientation || ORIENTATION.PORTRAIT, self.format.toString().toUpperCase() || "A4");
        var printLayout = layout.layoutPDF;

        const createPDF = function (printLayout) {
            var filename = window.location.host + '_';
            var title = self.div.querySelector('.' + self.CLASS + '-title').value.trim();

            if (title) {
                filename += title;
            } else {
                var currentDate = Util.getFormattedDate(new Date().toString(), true);
                filename += currentDate;
            }

            try {
                pdfMake.createPdf(printLayout).download(filename.replace(/[\\\/:*?"<>\|]/g, "") + '.pdf');
            } catch (error) {
                self.map.toast(self.getLocaleString('print.error'), { type: Consts.msgType.ERROR });
                TC.error(error.message + '  ' + error.stack, Consts.msgErrorMode.EMAIL);
            }

            loadingCtrl.removeWait(hasWait);
        };

        const imageErrorHandling = function (imageUrl) {
            TC.error(self.getLocaleString('print.error'));
            TC.error('No se ha podido generar el base64 correspondiente a la imagen: ' + imageUrl, Consts.msgErrorMode.EMAIL, 'Error en la impresión'); //Correo de error
        };

        const getLogo = function () {

            const onLogoError = function () {
                var logoColumn = getLogoColumn(layout);
                delete logoColumn.image;
                logoColumn.text = "";
                logoColumn.width = 0;
                return logoColumn;
            };

            if (self.options.logo) {
                return Util.imgToDataUrl(self.options.logo).then(function (result) {
                    const canvas = result.canvas;
                    const dataUrl = result.dataUrl;

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
            var scaleBarColumn = getScaleBarColumn(layout);
            const onError = function () {
                delete scaleBarColumn.image;
                scaleBarColumn.text = "";
                scaleBarColumn.width = "auto";
                return scaleBarColumn;
            };

            if (self.map.on3DView) {
                scaleBarColumn.table = { widths: [0], body: [{ border: [false, false, false, false], text: "" }] };
                //scaleBarColumn.table = {
                //    widths: [layout.layoutPDF.pageSize.width - layout.layoutPDF.pageMargins[0] - layout.layoutPDF.pageMargins[2] - layout.logoWidth],
                //    body: [
                //        [{ border: [false, false, false, false], text: formatCameraData(), fontSize: 10, alignment: 'right' }]
                //    ]
                //};
            }
            else {
                let scaleCtrl = self.map.getControlsByClass(ScaleBar)[0];
                if (scaleCtrl) {
                    var elem = document.getElementsByClassName("ol-scale-line-inner"); // no cogemos el DIV del control ya que contiene los bordes y suman al ancho total
                    var bounding = elem[0].getBoundingClientRect();
                    if (bounding) {
                        var styling = getComputedStyle(elem[0], null);
                        var leftBorder = parseInt(styling.getPropertyValue('border-left-width').replace('px', '')) || 0;
                        var rightBorder = parseInt(styling.getPropertyValue('border-right-width').replace('px', '')) || 0;

                        scaleBarColumn.table = {
                            widths: [((bounding.width > bounding.height ? bounding.width : bounding.height) - leftBorder - rightBorder) * 0.75], // lo pasamos a pt
                            body: [
                                [{ border: [true, false, true, true], text: scaleCtrl.getText(), fontSize: 10, alignment: 'center' }]
                            ]
                        };

                        scaleBarColumn.layout = {
                            paddingLeft: function (_i, _node) { return 0; },
                            paddingRight: function (_i, _node) { return 0; },
                            paddingTop: function (_i, _node) { return 0; },
                            paddingBottom: function (_i, _node) { return 0; }
                        };


                    } else {
                        return onError();
                    }
                } else {
                    return onError();
                }
            }
            return scaleBarColumn;


        };
        //const formatCameraData = function () {
        //    const cameraData = self.map.view3D.getCameraData();
        //    return self.getLocaleString("printCameraCoords", {
        //        x: Util.formatCoord(cameraData.latitude, Consts.DEGREE_PRECISION),
        //        y: Util.formatCoord(cameraData.longitude, Consts.DEGREE_PRECISION),
        //        z: Util.formatCoord(cameraData.height, Consts.METER_PRECISION),
        //        head: Math.round(cameraData.heading),
        //        pitch: Math.round(cameraData.pitch),
        //    })
        //}
        const getLegend = function () {
            var content = [];
            var layers = self.map.workLayers.filter(function (layer) {
                return layer.type === Consts.layerType.WMS && layer.getVisibility();
            });
            var legendByGroup = [];

            var _process = function (value, parentLayer, treeLevel) {
                if (parentLayer.isVisibleByScale(value.name)) { //Si la capa es visible, la mostramos en la leyenda

                    //Para las capas cargadas por POST (por ejemplo la búsquedas de Comercio Pamplona)
                    if (parentLayer.options && parentLayer.options.params && parentLayer.options.params.base64LegendSrc) {
                        const srcBase64 = parentLayer.options.params.base64LegendSrc;
                        result.push({ title: value.title, level: treeLevel, srcBase64: srcBase64 });
                    }
                    else if (value.legend?.length) {
                        value.legend.forEach(l => {
                            result.push({ title: value.title, level: treeLevel, src: l.src, name: value.name });
                        });
                    }
                    else {
                        result.push({ title: value.title, level: treeLevel, src: "", name: value.name });
                    }

                }
            };
            var _traverse = function (o, func, parentLayer, treeLevel) {
                if (Array.isArray(o)) {
                    for (var i = 0; i < o.length; i++) {
                        _traverse(o[i], func, parentLayer, treeLevel);
                    }
                } else {
                    if (o && Object.prototype.hasOwnProperty.call(o, 'children') && o.children.length > 0) {
                        if (o.title || o.name) {
                            result.push({ header: o.title || o.name, level: treeLevel });
                        }
                        _traverse(o.children, func, parentLayer, ++treeLevel);
                    }
                }

                if (o && Object.prototype.hasOwnProperty.call(o, 'children') && o.children.length === 0) {
                    func.apply(this, [o, parentLayer, treeLevel]);
                    treeLevel--;
                }
            };
            const getImageAsNode = function (base64data) {
                return new Promise(function (resolve, reject) {
                    var i = new Image(); 
                    i.crossOrigin = 'anonymous';
                    i.onload = function () {
                        resolve(i);
                    };
                    i.onerror = function (err) {
                        reject(err);
                    }
                    i.src = base64data;
                })

            }
            const pngOrSVG = function (image) {
                const imageWidth = image.width * 0.75;//item.image.canvas.width / 2;
                const imageHeight = image.height * 0.75;//(imageWidth * item.image.canvas.height / item.image.canvas.width);
                const data = {
                    "width": imageWidth,
                    "height": imageHeight,
                    "margin": [0, 0, 0, 2]
                }
                data[image.base64 ? "image" : "svg"] = image.base64 ? image.base64 : image.svg;
                return data; 
            }
            var _getLegendImages = function (_layers) {
                return _layers.map((_layer,index) => {                    
                    
                    return new Promise(function (resolve, _reject) {
                        _layer.getLegend().then(async function (legend) {
                            var layers = legendByGroup[index].layers;
                            //layers = layers.filter((layer) => layer.src || layer.srcBase64);
                            await Promise.all(layers.map(async (layer) => {
                                return new Promise(async function (resolve, reject) {                                    
                                    const layerLegend = legend.filter((l) => l)?.[0]?.find((l) => l.layerName === layer.name || _layer.names.length === legend[0].length);
                                    //eliminar aquellos que no tengan visibilidad por 
                                    if (!layerLegend) {
                                        const i = legendByGroup[index].layers.findIndex((l) => l.title === layer.title)
                                        if (i) {
                                            legendByGroup[index].layers.splice(i, 1);
                                            resolve();
                                            return;
                                        }
                                    }
                                    if (layerLegend?.src) {
                                        const imageNode = await getImageAsNode(layerLegend.src);
                                        layer.image = [{ base64: layerLegend.src, height: imageNode.height, width: imageNode.width }];
                                    }
                                    else if (layerLegend?.rules?.length) {
                                        layer.image = await Promise.all(layerLegend.rules.map(async (rule) => {
                                            const src = await CreateSymbolizer(rule);                                            
                                            const image = await getImageAsNode(src);
                                            const imageDetail = Util.imgTagToDataUrl(image, 'image/png');
                                            return { base64: imageDetail.base64, height: image.height, width: image.width, title: rule.title || rule.name };
                                        }));
                                    }
                                    resolve();
                                });
                            }))                            
                            resolve();
                        }).catch(async (err) => {
                            for (var i = 0; i < legendByGroup.length; i++) {
                                var layers = legendByGroup[i].layers;

                                for (var j = 0; j < layers.length; j++) {
                                    await (async function (k, l) {
                                        var layer = legendByGroup[k].layers[l];
                                        var src = layer.src || layer.srcBase64;
                                        if (src) {
                                            const imageNode = await getImageAsNode(src);
                                            const imageDetail = Util.imgTagToDataUrl(imageNode, 'image/png');
                                            layer.image = [{ base64: imageDetail.base64, height: imageNode.height, width: imageNode.width }];                                            
                                        }
                                    })(i, j);
                                }
                            }
                            resolve();
                        });                        
                    });
                });
            };
            layers.forEach(function (layer) {
                result = [];
                if (!layer.layerNames || layer.layerNames.length === 0) return;
                var hideTree = layer.hideTree;

                layer.tree = null;
                layer.hideTree = true;

                _traverse(layer.getNestedTree(), _process, layer, 0);

                layer.hideTree = hideTree;

                if (result.length > 0) {
                    legendByGroup.push({ title: layer.title, layers: result });
                }
            });            

            return new Promise(function (resolve, reject) {
                Promise.all(_getLegendImages(layers)).then(function () {

                    const getGroupTable = function (group, index) {
                        var rows = [[{ text: group.title, fontSize: 13, style: ["tablegroup"], margin: [0, index > 0 ? 10 : 0, 0, 2] }]];
                        var indentation = 10;
                        rows = rows.concat(group.layers.filter(function (item) {
                            return Object.prototype.hasOwnProperty.call(item, 'header') && item.header.trim().toLowerCase() !== group.title.trim().toLowerCase();
                        }).map(function (item, _index) {
                            return [{ text: item.header.trim(), fontSize: Math.max(9, 14 - item.level), margin: [indentation * item.level, 0, 0, 2] }];
                        }));

                        const headerRows = rows.length;
                        var headerItem = null;
                        var itemIndex = null;

                        const getLayerTable = function (item, _index) {
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
                                    var headerIndex = rows.map(item => item[0].text || "").indexOf(headerItem.header);
                                    position = headerIndex + itemIndex++;
                                }
                                if (item.image?.length) {
                                    const ul = [{
                                        "text": item.title,
                                        "fontSize": Math.max(9, 14 - item.level),
                                        "margin": [0 - indentation, 0, 0, 5]
                                    }];
                                    item.image.forEach((image) => {
                                        itemIndex++;                                                                                
                                        if (image.title) {
                                            ul.push({
                                                columns: [
                                                    pngOrSVG(image),
                                                    {
                                                        "text": image.title,
                                                        "fontSize": Math.max(9, 14 - item.level),
                                                        "width": "*",
                                                        "margin": [5, 2, 0, 2]
                                                    }]
                                            });
                                        }
                                        else
                                            ul.push(pngOrSVG(image));
                                    });
                                    const dataLayer = [{
                                        "ul": ul,
                                        "type": "none",
                                        "margin": [indentation * item.level, 0, 0, 2],
                                    }];

                                    if (position) {
                                        rows.splice(position, 0, dataLayer);
                                        //rows.splice(position + 1, 0, imageLayer);
                                    } else {
                                        rows.push(dataLayer);
                                        //rows.push(imageLayer);
                                    }

                                } else {
                                    const data = [{
                                        text: item.title,
                                        fontSize: 11,
                                        margin: [indentation * item.level, 0, 0, 2]
                                    }];

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
                    //URI: eliminar leyenda vacía por extent
                    legendByGroup=legendByGroup.filter((group) => group.layers.some((layer) => layer.image?.length))

                    legendByGroup.map(function (group, index) {
                        return {
                            groupIndex: index,
                            height: group.layers.filter(function (item) {
                                return item.image;
                            }).reduce(function (prev, current, index, vector) {
                                return prev + vector[index].image.reduce((prev, current) => { return prev + current.height }, 0);
                            }, 0)
                            }
                        })
                        .sort(function (a, b) {
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
            const cb = self.div.querySelector(`.${self.CLASS}-image-qr`);
            if (!cb.disabled && cb.checked) {
                const qrTarget = document.querySelector('.' + self.CLASS + '-qrcode');
                qrTarget.innerHTML = '';
                return self.makeQRCode(qrTarget, options.qrCode.sideLength).then(function (qrCodeBase64) {
                    if (qrCodeBase64) {
                        return Util.addToCanvas(self.canvas, qrCodeBase64, { x: self.canvas.width - options.qrCode.sideLength, y: self.canvas.height - options.qrCode.sideLength }, { width: options.qrCode.sideLength, height: options.qrCode.sideLength }).then(function (mapCanvas) {
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
                const totalWidth = layout.layoutPDF.pageSize.width - (layout.layoutPDF.pageMargins[0] + layout.layoutPDF.pageMargins[2]);
                const logoWidth = layout.layoutPDF.content[0].columns[0].width || 0;
                const scaleBarColumn = layout.layoutPDF.content[0].columns[2];
                const scaleBarWidth = scaleBarColumn.table.widths[0] + 2;
                const titleColumn = layout.layoutPDF.content[0].columns[1];
                titleColumn.width = totalWidth - logoWidth - scaleBarWidth;
                if (logoWidth === 0) {
                    // Si no hay logo reajustamos texto de título y margen de barra de escala
                    titleColumn.alignment = "left";
                    scaleBarColumn.margin[3] = 2;
                }
            }

            var mapPlace = getMap(layout);
            var canvas = basicsDone[3] || self.canvas;

            mapPlace.image = canvas.toDataURL();

            if (self.#hasLegendToPrint() && // GLS: validamos que haya capas visibles por escala 
                printLayout.content.length === 2) { // GLS: es la primera descarga o hemos resetado la leyenda por algún zoom por lo que no tenemos la leyenda en el layout

                const title = self.div.querySelector('.' + self.CLASS + '-title').value.trim();
                printLayout.content.push({
                    pageBreak: 'before',
                    pageOrientation: (self.options.legend && self.options.legend.orientation) || ORIENTATION.PORTRAIT,
                    text: title.length > 0 ? title : '',
                    fontSize: 14,
                    margin: [0, 20, 0, 10]
                });
                printLayout.styles = {
                    "tablegroup": {
                        bold: true
                    }
                }
                printLayout.defaultStyle = {
                    alignment: 'left'
                }

                getLegend().then(function (content) {
                    printLayout.content = printLayout.content.concat(content);
                    createPDF(printLayout);
                });
            } else {
                createPDF(printLayout);
            }
        });
    }

    manageMaxLengthExceed(maxLengthExceed) {
        const self = this;
        const alertElm = self.div.querySelector('.' + self.CLASS + '-alert');
        const checkboxQR = self.div.querySelector(`.${self.CLASS}-image-qr`);

        checkboxQR.disabled = maxLengthExceed.qr;

        if (checkboxQR.checked) {
            alertElm.classList.toggle(Consts.classes.HIDDEN, !maxLengthExceed.qr);
        } else {
            alertElm.classList.add(Consts.classes.HIDDEN);
        }
    }

    async generateLink() {
        const self = this;
        const checkbox = self.div.querySelector(`.${self.CLASS}-div input.${self.CLASS}-image-qr`);
        const label = self.div.querySelector(`label.${self.CLASS}-image-qr-label`);
        checkbox.disabled = true;
        label.classList.add(Consts.classes.LOADING);
        const result = await MapInfo.prototype.generateLink.call(self);
        label.classList.remove(Consts.classes.LOADING);
        return result;
    }

    getToolsElement() {
        const self = this;
        return self.getContainer().querySelector(`.${self.CLASS}-tools`);
    }
}

PrintMap.prototype.CLASS = 'tc-ctl-prnmap';
TC.control.PrintMap = PrintMap;
export default PrintMap;

TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

TC.control.PrintPdf = function () {
    var self = this;

    TC.Control.apply(self, arguments);
};

TC.inherit(TC.control.PrintPdf, TC.Control);

(function () {
    var ctlProto = TC.control.PrintPdf.prototype;
    ctlProto.CLASS = 'tc-ctl-print-pdf';

    var self = this;

    var options = {
        marginTop: 20, //((7mm) / (25.4mm/in)) x (72 pixels/in)
        marginLeft: 55,
        a4: {
            width: 596, //((210mm) / (25.4mm/in)) x (72 pixels/in)
            height: 842 //((297mm) / (25.4mm/in)) x (72 pixels/in)
        },
        a3: {
            width: 842, //((297mm) / (25.4mm/in)) x (72 pixels/in)
            height: 1191, //((420mm) / (25.4mm/in)) x (72 pixels/in)
        },
        qrCode: {
            sideLength: 85 //((30mm) / (25.4mm/in)) x (72 pixels/in)
        },
        headerHeight: 20 //((7mm) / (25.4mm/in)) x (72 pixels/in)
    };

    var ORIENTATION = {
        PORTRAIT: 'portrait',
        LANDSCAPE: 'landscape'
    };

    var PAGE_SIZE = {
        A4: 'a4',
        A3: 'a3'
    };

    var orientation = TC.Util.getParameterByName("orientation");
    var format = TC.Util.getParameterByName("size");

    var getWidth = function (orientation, format) {
        return orientation === ORIENTATION.PORTRAIT ? options[format].width : options[format].height;
    };

    var getHeight = function (orientation, format) {
        return orientation === ORIENTATION.PORTRAIT ? options[format].height : options[format].width;
    };

    var getPageHeight = function () {
        var value = (orientation === ORIENTATION.PORTRAIT ? options[format].height : options[format].width);
        return value - 20;
    };

    if (TC.isDebug) {
        ctlProto.template = TC.apiLocation + "TC/templates/PrintPdf.html";
    }
    else {
        ctlProto.template = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<button disabled class=\"disabled tc-button tc-ctl-print-pdf-btn\" title=\"").h("i18n", ctx, {}, { "$key": "printpdf" }).w("\"></button>"); } body_0.__dustBody = !0; return body_0 };
    }

    var getUrlWithoutParams = function () {
        var url = window.location.href;
        var start = url.indexOf('?');
        var end = url.indexOf('#');

        //Borramos los parámetros de la URL y dejamos sólo el hash
        if (start > 0) {
            if (start < end) {
                url = url.replace(url.substring(start, end), '');
            } else {
                url = url.replace(url.substring(start, url.length - 1), '');
            }
        }

        return url;
    };

    var getQrCode = function (url) {
        var deferred = $.Deferred();
        var QR_MAX_URL_LENGTH = 150;

        if (url) {
            TC.loadJS(
                typeof QRCode === 'undefined',
                [TC.apiLocation + 'lib/qrcode/qrcode.min.js'],
                function () {

                    if (url.length > QR_MAX_URL_LENGTH) {
                        url = TC.Util.shortenUrl(url);
                    }

                    var codeContainer = $('#qrcode');
                    codeContainer.empty();
                    var code = new QRCode(codeContainer.get(0), {
                        text: url,
                        width: options.qrCode.sideLength,
                        height: options.qrCode.sideLength
                    });
                    setTimeout(function () {
                        var imgBase64 = codeContainer.find('img').attr('src');
                        deferred.resolve(imgBase64);
                    }, 100);
                });
        } else {
            deferred.resolve(imgBase64);
        }

        return deferred.promise();
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);

        // GLS: Añado el flag al mapa para tenerlo en cuenta cuando se establece la función de carga de imágenes
        self.map.mustBeExportable = true;

        self.pdfLibPromise = function () {
            var deferred = $.Deferred();

            if (window.pdfMake) {
                deferred.resolve();
            } else {
                TC.loadJS(!window.pdfMake, [TC.Consts.url.PDFMAKE], function () {
                    deferred.resolve();
                });
            }

            return deferred.promise();
        }();

        var showAdvice = true;
        map._$div.on('mouseover', function () {
            if (showAdvice) {
                map.toast(self.getLocaleString('print.advice.title') + ': ' + self.getLocaleString('print.advice.desc'), { type: TC.Consts.msgType.INFO, duration: 7000 });
                showAdvice = false;
            }
        });

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

        //Obtenemos las capas de trabajo del mapa original y las añadimos al mapa de impresión
        self.getLayersFromOpener();

        if (self.options.qrCode) {
            getQrCode(getUrlWithoutParams());
        }

        self._$div.on('click', '.' + self.CLASS + '-btn', function () {
            self.createPdf();
        });
    };

    var createDoc = function () {
        var deferred = $.Deferred();

        var docDefinition = {
            pageOrientation: orientation || ORIENTATION.LANDSCAPE,
            pageSize: format || PAGE_SIZE.A4,
            pageMargins: [options.marginLeft, options.marginTop]
        };

        deferred.resolve(docDefinition);

        return deferred.promise();
    };

    ctlProto.createPdf = function () {
        var self = this;

        var pageWidth = getWidth(orientation, format);
        var pageHeight = getHeight(orientation, format);
        self.canvas = $('.tc-map .ol-viewport canvas')[0];
        self.mapSize = TC.Util.calculateAspectRatioFit(self.canvas.width, self.canvas.height, pageWidth - (options.marginLeft * 2), pageHeight - (options.marginTop * 2) - options.headerHeight);

        var imageErrorHandling = function (imageUrl) {
            TC.error(self.getLocaleString('print.error'));
            TC.error('No se ha podido generar el base64 correspondiente a la imagen: ' + imageUrl, TC.Consts.msgErrorMode.EMAIL, 'Error en la impresión'); //Correo de error
        };

        var printHeader = function (docDefinition) {
            docDefinition.content = docDefinition.content || [];
            var deferred = $.Deferred();

            var scaleCtrl = self.map.getControlsByClass(TC.control.ScaleBar)[0];
            if (scaleCtrl) {
                var scaleBar = $('.tc-ctl-sb .ol-scale-line-inner');
                var ratio = self.canvas.width / self.mapSize.width;
                var scaleWidth = scaleBar.width() / ratio;
            }

            var resolve = function (logo) {
                var container = [];

                //si no hay logo insertamos un elemento vacío para que se respete el posicionamiento del resto de elementos
                var logoImage = logo || { text: '' }; 

                //logo
                container.push(logoImage);
                

                //título del documento
                container.push({ text: TC.Util.getParameterByName(TC.Cfg.titleURLParamName), alignment: 'center', fontSize: 11 });

                //escala
                if (scaleCtrl) {
                    container.push({
                        table: {
                            widths: [scaleWidth],
                            body: [
                                [{ text: scaleCtrl.getText(), fontSize: 10, alignment: 'center' }]
                            ]
                        },
                        layout: {
                            hLineWidth: function (i, node) {
                                return (i === 0) ? 0 : 1;
                            },
                            paddingLeft: function (i, node) { return 0; },
                            paddingRight: function (i, node) { return 0; },
                            paddingTop: function (i, node) { return 0; },
                            paddingBottom: function (i, node) { return 0; },
                        }
                    });
                }

                docDefinition.content.push({
                    table: {
                        widths: [scaleWidth, '*', scaleWidth],
                    },
                    layout: 'noBorders'
                });
                docDefinition.content[0].table.body = [container];

                deferred.resolve(docDefinition);
            };

            if (self.options.logo) {
                $.when(TC.Util.imgToDataUrl(self.options.logo, 'image/png')).then(function (dataUrl, canvas) {
                    //Si el logo es más ancho que la escala, lo reducimos
                    var logoHeight = options.headerHeight;
                    var logoWidth = canvas.width * options.headerHeight / canvas.height;

                    var size = TC.Util.calculateAspectRatioFit(canvas.width, canvas.height, scaleWidth, options.headerHeight);

                    resolve({ image: dataUrl, height: size.height, width: size.width });

                }, function () { // reject
                    imageErrorHandling(self.options.logo);
                    deferred.reject();
                });
            } else {
                resolve();
            }

            return deferred.promise();
        };

        var printMap = function (docDefinition) {
            var deferred = $.Deferred();
            docDefinition.content = docDefinition.content || [];

            var resolve = function (canvas) {
                //Mapa
                docDefinition.content.push({
                    table: {
                        widths: ['*'],
                        body: [
                            [{
                                image: TC.Util.toDataUrl(canvas),
                                width: self.mapSize.width
                            }]]
                    },
                    layout: {
                        paddingLeft: function (i, node) { return 0; },
                        paddingRight: function (i, node) { return 0; },
                        paddingTop: function (i, node) { return 0.1; },
                        paddingBottom: function (i, node) { return 0; },
                    }
                });

                deferred.resolve(docDefinition);
            };

            //QR
            if (self.options.qrCode) {
                $.when(getQrCode(getUrlWithoutParams())).then(function (qrCodeBase64) {
                    if (qrCodeBase64) {
                        $.when(TC.Util.addToCanvas(self.canvas, qrCodeBase64, { x: self.canvas.width - options.qrCode.sideLength, y: self.canvas.height - options.qrCode.sideLength })).then(function (mapCanvas) {
                            resolve(mapCanvas);
                        });
                    } else {
                        TC.error(self.getLocaleString('print.qr.error'));
                        resolve(self.canvas);
                    }
                });
            } else {
                resolve(self.canvas);
            }

            return deferred.promise();
        };

        var printLegend = function (docDefinition) {
            var deferred = $.Deferred();

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
                                toolProxification.getImage(src, true).then(function (img) {
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


            //Leyenda
            if (self.options.legend && self.options.legend.visible) {

                var legendOrientation = self.options.legend.orientation || orientation;
                var layers = self.map.workLayers;
                var legendByGroup = [];
                var indentationIncrement = 7;
                docDefinition.content = docDefinition.content || {};

                if (layers.length > 0) {
                    for (var i = layers.length - 1; i >= 0; i--) {
                        var layer = layers[i];

                        if (layer.type === TC.Consts.layerType.WMS && layer.getVisibility()) {
                            result = [];
                            _traverse(layer.getTree(), _process, layer, 0);

                            if (result.length > 0) {
                                legendByGroup.push({ title: layer.title, layers: result });
                            }
                        }
                    }

                    $.when.apply($, _getLegendImages()).then(function () {

                        //Si hay leyenda insertamos un texto vacío para poder meter el salto de página y el cambio de orientación
                        if (legendByGroup.length > 0) {
                            docDefinition.content.push({ text: ' ', pageBreak: 'before', pageOrientation: legendOrientation });
                        }

                        for (var i = 0; i < legendByGroup.length; i++) {
                            var group = legendByGroup[i];
                            var indentation = 10;
                            docDefinition.content.push({ text: group.title, fontSize: 11, margin: [0, 0, 0, 5] });

                            for (var j = 0; j < group.layers.length; j++) {
                                var layer = group.layers[j];
                                indentation = indentationIncrement * layer.level;

                                //Si el nombre del grupo de capas es igual al del servicio, lo obviamos
                                if (layer.header && layer.header === group.title) {
                                    continue;
                                }

                                if (layer.header) { // Si es un nombre de servicio o grupo de capas   
                                    docDefinition.content.push({ text: layer.header, fontSize: 10, margin: [indentation, 0, 0, 3] });
                                } else { // Si es una capa con imagen de leyenda
                                    docDefinition.content.push({ text: layer.title, fontSize: 9, margin: [indentation, 0, 0, 2] });

                                    if (layer.image) {
                                        var imageWidth = layer.image.canvas.width / 2;
                                        var imageHeight = (imageWidth * layer.image.canvas.height / layer.image.canvas.width)
                                        docDefinition.content.push({ image: layer.image.base64, width: imageWidth, height: imageHeight, margin: [indentation, 0, 0, 2] });
                                    }
                                }
                            }
                        }
                        deferred.resolve(docDefinition);
                    }, function () { // reject
                        deferred.reject();
                    });

                } else {
                    deferred.resolve(docDefinition);
                }
            } else {
                deferred.resolve(docDefinition);
            }

            return deferred.promise();
        };

        var saveFile = function (docDefinition) {
            var filename = window.location.host + '_';
            var title = TC.Util.getParameterByName("title")

            if (title) {
                filename += title;
            } else {
                var currentDate = TC.Util.getFormattedDate(new Date().toString(), true);
                filename += currentDate;
            }

            pdfMake.createPdf(docDefinition).download(filename.replace(/[\\\/:*?"<>\|]/g, "") + '.pdf');
        };


        var loadingCtrl = self.map.getControlsByClass(TC.control.LoadingIndicator)[0];
        var hasWait = loadingCtrl.addWait();

        var _removeWait = function () {
            loadingCtrl.removeWait(hasWait);
        }

        $.when(self.pdfLibPromise)
            .then(createDoc)
            .then(printHeader)
            .fail(_removeWait)
            .then(printMap)
            .then(printLegend)
            .fail(_removeWait)
            .then(saveFile)
            .then(_removeWait);
    };

    ctlProto.getLayersFromOpener = function (mapVar) {
        var self = this;
        var opener = window.opener;

        if (opener) {
            var TC = opener.TC;
            var refererMap = TC.printPreview ? TC.printPreview.refererMap : null;

            if (refererMap) {

                self.map.loaded(function () {

                    //Borramos las capas base para dejar sólo la seleccionada en el visor original
                    for (var i = 0; i < self.map.baseLayers.length; i++) {
                        self.map.removeLayer(self.map.baseLayers[i]);
                    }

                    var refererBaseLayer = refererMap.getBaseLayer();
                    //Añadimos la capa base                       
                    self.map.addLayer({
                        "id": refererBaseLayer.id,
                        "title": refererBaseLayer.title,
                        "type": refererBaseLayer.type,
                        "url": refererBaseLayer.url,
                        "encoding": refererBaseLayer.encoding,
                        "layerNames": refererBaseLayer.layerNames,
                        "matrixSet": refererBaseLayer.matrixSet,
                        "format": refererBaseLayer.format,
                        "minResolution": refererBaseLayer.minResolution,
                        "maxZoom": refererBaseLayer.maxZoom,
                        "isBase": true
                    });

                    //Insertamos las capas de trabajo que no son compartidas mediante el control de estado
                    var workLayers = refererMap.workLayers;
                    var layer;

                    for (var i = 0; i < workLayers.length; i++) {
                        layer = workLayers[i];

                        if (layer.type === TC.Consts.layerType.WMS && layer.options.stateless) {
                            self.map.addLayer({
                                "id": layer.id,
                                "title": layer.title,
                                "type": layer.type,
                                "method": layer.method,
                                "url": layer.url,
                                "format": layer.format,
                                "stateless": layer.stateless,
                                "params": layer.params,
                                "layerNames": layer.layerNames
                            }, function (l) {
                                l.setVisibility(layer.getVisibility());
                                l.setOpacity(layer.getOpacity());
                            });
                        }
                    }

                    var mapFeatures = TC.printPreview.mapFeatures;

                    if (mapFeatures) {
                        self.map.addLayer({
                            id: self.getUID(),
                            type: TC.Consts.layerType.VECTOR
                        }, function (layer) {
                            TC.loadJS(!TC.feature,
                                [TC.apiLocation + 'TC/Feature', TC.apiLocation + 'TC/feature/Point', TC.apiLocation + 'TC/feature/Polyline',
                                TC.apiLocation + 'TC/feature/Polygon', TC.apiLocation + 'TC/feature/MultiPolygon', TC.apiLocation + 'TC/feature/MultiPolyline',
                                TC.apiLocation + 'TC/feature/Circle', TC.apiLocation + 'TC/feature/Marker'],
                                function () {
                                    for (var i = 0; i < mapFeatures.length; i++) {
                                        var feat = mapFeatures[i];
                                        var feature;

                                        switch (feat.CLASSNAME) {
                                            case 'TC.feature.Point':
                                                layer.addPoint(feat.geometry, feat.options);
                                                break;
                                            case 'TC.feature.Polyline':
                                                layer.addPolyline(feat.geometry, feat.options);
                                                break;
                                            case 'TC.feature.Polygon':
                                                layer.addPolygon(feat.geometry, feat.options);
                                                break;
                                            case 'TC.feature.MultiPolygon':
                                                layer.addMultiPolygon(feat.geometry, feat.options);
                                                break;
                                            case 'TC.feature.MultiPolyline':
                                                layer.addMultiPolyline(feat.geometry, feat.options);
                                                break;
                                            case 'TC.feature.Circle':
                                                layer.addCircle(feat.geometry, feat.options);
                                                break;
                                            case 'TC.feature.Marker':
                                                layer.addMarker(feat.geometry, feat.options);
                                                break;
                                        }
                                    }
                                }
                            );
                        });
                    }
                });
            }
        }
    };
})();
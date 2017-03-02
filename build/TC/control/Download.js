TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control.js');
}

TC.control.Download = function (options) {
    var self = this;
    self._classSelector = '.' + self.CLASS;

    TC.Control.apply(self, arguments);

    var opts = options || {};
    self._$dialogDiv = $(TC.Util.getDiv(opts.dialogDiv));
    if (!opts.dialogDiv) {
        self._$dialogDiv.appendTo('body');
    }
};

TC.inherit(TC.control.Download, TC.Control);

(function () {
    var ctlProto = TC.control.Download.prototype;
    
    ctlProto.CLASS = 'tc-ctl-download';

    ctlProto.template = {};

    if (TC.isDebug) {
        ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/Download.html";
        ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/DownloadDialog.html";
    } else {
        ctlProto.template[ctlProto.CLASS] = function () { dust.register(ctlProto.CLASS, body_0); function body_0(chk, ctx) { return chk.w("<h2>").h("i18n", ctx, {}, { "$key": "download" }).w("</h2><div><div class=\"tc-ctl-download-div\"><div class=\"tc-ctl-download\"><div class=\"tc-group tc-ctl-download-cnt\"><label>").h("i18n", ctx, {}, { "$key": "format" }).w(":</label><select id=\"download-format\" class=\"tc-combo\"><option value=\"GML32\">GML</option><option value=\"application/json\">GeoJSON</option><option value=\"application/vnd.google-earth.kml+xml\">KML (Google Earth)</option><option value=\"shape-zip\">Shape (ESRI)</option></select></div></div><form class=\"tc-ctl-download-form\" method=\"post\" enctype=\"text/plain\"><!--HACK: El servicio WFS espera que en el payload del POST llegue la consulta WFS (en este caso GetFeature). El problema es que debe llegar solo la consulta,no en formato clave=valor. Por tanto, lo \u00fanico que se me ha ocurrido es buscar el primer signo ‘=’ de la consulta, y poner lo que hay a la izquerda en el namedel input Y lo de la derecha en el value (se inserta desde al archivo Download.js)--><input type=\"hidden\" name=\"<wfs:GetFeature xmlns:xsi\" class=\"tc-ctl-download-query\" /></form><div class=\"tc-group tc-ctl-download-cnt\"><i class=\"tc-ctl-download-help icon-question-sign\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"").h("i18n", ctx, {}, { "$key": "showDownloadHelp" }).w("\"></i><button class=\"tc-ctl-download-btn tc-button tc-icon-button\" title=\"").h("i18n", ctx, {}, { "$key": "downloadLayersFromCurrentExtent" }).w("\">").h("i18n", ctx, {}, { "$key": "download" }).w("</button></div><div class=\"tc-alert alert-warning tc-hidden\"><p id=\"zoom-msg\"><strong>").h("i18n", ctx, {}, { "$key": "tooManyFeatures" }).w(": </strong>").h("i18n", ctx, {}, { "$key": "tooManyFeatures.instructions" }).w("</p><p id=\"layers-msg\"><strong>").h("i18n", ctx, {}, { "$key": "noLayersLoaded" }).w(": </strong>").h("i18n", ctx, {}, { "$key": "noLayersLoaded.instructions" }).w("</p><p id=\"url-msg\"><strong>").h("i18n", ctx, {}, { "$key": "tooManySelectedLayers" }).w(": </strong>").h("i18n", ctx, {}, { "$key": "tooManySelectedLayers.instructions" }).w("</p><p id=\"noFeatures-msg\"><strong>").h("i18n", ctx, {}, { "$key": "noData" }).w(": </strong>").h("i18n", ctx, {}, { "$key": "noData.instructions" }).w("</p></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
        ctlProto.template[ctlProto.CLASS + '-dialog'] = function () { dust.register(ctlProto.CLASS + '-dialog', body_0); function body_0(chk, ctx) { return chk.w(" <div class=\"tc-ctl-download-help-dialog tc-modal\"><div class=\"tc-modal-background tc-modal-close\"></div><div class=\"tc-modal-window\"><div class=\"tc-modal-header\"><h3>").h("i18n", ctx, {}, { "$key": "downloadData" }).w("</h3><div class=\"tc-ctl-popup-close tc-modal-close\"></div></div><div class=\"tc-modal-body\"><p>").h("i18n", ctx, {}, { "$key": "dl.instructions.1|s" }).w("</p><ul><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.2|s" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.3|s" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.4|s" }).w("<ul><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.5|s" }).w("</li><li>").h("i18n", ctx, {}, { "$key": "dl.instructions.6|s" }).w("</li></ul></li></ul></div><div class=\"tc-modal-footer\"><button type=\"button\" class=\"tc-button tc-modal-close\">").h("i18n", ctx, {}, { "$key": "close" }).w("</button></div></div></div>"); } body_0.__dustBody = !0; return body_0 };
    }

    ctlProto.render = function (callback) {
        var self = this;
        self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._$dialogDiv.html(html);
        }).then(function () {
            TC.Control.prototype.render.call(self, callback);
        });
    };

    ctlProto.register = function (map) {
        var self = this;
        TC.Control.prototype.register.call(self, map);
        var layerNames = [];
        var maxFeatures = 0;

        /**
         * Lee del capabilities del WFS la configuraci\u00f3n del n\u00famero m\u00e1ximo de features que el servidor devuelve en
         * la operaci\u00f3n de GetFeature.
         */
        var _readWfsMaxFeaturesConstraint = function () {
            if (!self.options.serviceUrl) {
                TC.error("No se ha encontrado el par\u00e1metro serviceUrl en el control de descarga");
                return;
            }
            $.get(self.options.serviceUrl + "?request=getcapabilities")
                .done(function (data) {
                    var operations = TC.Util.getElementByNodeName(data, "ows:Operation");
                    if (operations && operations.length > 0) {
                        var getFeatureNode;
                        for (var i = 0; i < operations.length; i++) {
                            if (operations[i].attributes["name"].value == "GetFeature") {
                                getFeatureNode = operations[i];
                            }
                        }
                        if (getFeatureNode) {
                            var constraints = TC.Util.getElementByNodeName(getFeatureNode, "ows:Constraint");
                            for (var i = 0; i < constraints.length; i++) {
                                if (constraints[i].attributes["name"].value == "CountDefault") {
                                    maxFeatures = parseInt(TC.Util.getElementByNodeName(constraints[i], "ows:DefaultValue")[0].textContent);
                                }
                            }
                        }
                    }
                })
                .fail(function (data) {
                    console.error(data);
                });
        };

        /**
         * A\u00f1ade el nombre de una capa al array de capas a descargar.
         */
        var _process = function (value) {
            layerNames.push(value.name);
        };

        /**
         * Funci\u00f3n recursiva para recorrer el \u00e1rbol de capas existentes dentro de un nodo.
         */
        var _traverse = function (o, func) {
            if (o instanceof Array) {
                for (var i = 0; i < o.length; i++)
                    _traverse(o[i], func);                
                }
            else {
                if (o.hasOwnProperty('children') && o.children.length > 0)
                    _traverse(o.children, func);
            }

            if (o.hasOwnProperty('children') && o.children.length == 0)
                func.apply(this, [o]);
        };

        /**
         * Descarga las features de las capas de trabajo actualmente seleccionadas. Comprueba que el n\u00famero de features a descargar
         * no excede el l\u00edmite impuesto por el servidor.
         */
        var _download = function () {
            var format = self._$div.find("select").val();
            var visibleLayers = _getVisibleLayers();

            if (visibleLayers.length > 0) {
                layerNames = [];

                for (var i = 0; i < visibleLayers.length; i++) {
                    if (visibleLayers[i].url.indexOf(self.options.downloadServiceUrl) >= 0) {
                        _traverse(visibleLayers[i].getTree(), _process);
                    }
                }

                var featureCount = 0;
                //Hacemos una consulta con el par\u00e1metro hits para obtener el n\u00famero de features que devolver\u00e1 la petici\u00f3n
                var extent = self.map.getExtent();
                var queryHeader = '"http://www.w3.org/2001/XMLSchema-instance" ' +
                'xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd" ' +
                'xmlns:gml="http://www.opengis.net/gml" xmlns:wfs="http://www.opengis.net/wfs" ' +
                'xmlns:ogc="http://www.opengis.net/ogc" service="WFS" version="1.1.0" {resultType} outputFormat="{format}">';

                query = '<wfs:GetFeature xmlns:xsi=' + queryHeader.format({ resultType: 'resultType="hits"', format: "application/json" });
                var queryItem = '<wfs:Query typeName="{typeName}">' +
                    '<ogc:Filter xmlns="http://www.opengis.net/ogc">' +
                      '<ogc:BBOX>' +
                        '<gml:Envelope>' +
                            '<gml:lowerCorner>{lowerCorner}</gml:lowerCorner>' +
                            '<gml:upperCorner>{upperCorner}</gml:upperCorner>' +
                        '</gml:Envelope>' +
                      '</ogc:BBOX>' +
                    '</ogc:Filter>' +
                  '</wfs:Query>';

                var queryBody = "";
                $.each(layerNames, function (index, value) {
                    queryBody += queryItem.format({ typeName: value, lowerCorner: extent[0] + ' ' + extent[1], upperCorner: extent[2] + ' ' + extent[3] });
                });
                query += queryBody + '</wfs:GetFeature>';

                $.ajax({
                    url: self.options.serviceUrl,
                    async: false, //Para evitar que la pesta\u00f1a abierta con window.open sea bloqueada por el navegador
                    data: query,
                    contentType: "application/xml",
                    type: "POST",
                    success: function (data) {
                        if (data.childNodes[0].attributes.numberOfFeatures) {
                            featureCount = parseInt(data.childNodes[0].attributes.numberOfFeatures.value);

                            //Si el n\u00famero de features es mayor o igual que el l\u00edmite fijado por el servidor, es porque realmente
                            //en ese \u00e1rea hay m\u00e1s. Por tanto, le pedimos al usuario que seleccione un \u00e1rea menor                    
                            query = queryHeader.format({ resultType: "", format: format }) + queryBody + '</wfs:GetFeature>';
                            if (featureCount < maxFeatures) {
                                var downloadForm = $("form.tc-ctl-download-form");
                                $(".tc-ctl-download-query").val(query);
                                downloadForm.attr("action", self.options.serviceUrl + "?download=zip");
                                downloadForm.submit();
                            } else {
                                _showAlerMsg({ zoom: true });
                            }
                        } else {
                            _showAlerMsg({ noFeatures: true });
                        }
                    }
                });
            } else {
                _showAlerMsg({ layers: true });
            }
        };

        /**
         * Comprueba si hay capas visibles en el panel de capas cargadas.
         */
        var _getVisibleLayers = function () {
            var visibleLayers = [];
            for (var i = 0; i < self.map.workLayers.length; i++) {
                var layer = self.map.workLayers[i];
                if (layer.type === TC.Consts.layerType.WMS) {
                    if (layer.getVisibility() && layer.names.length > 0) {
                        visibleLayers.push(layer);
                    }
                }
            }
            return visibleLayers;
        };

        var _showAlerMsg = function (error) {
            var alert = self._$div.find(".alert-warning");
            var errorMsg;

            if (error.zoom) {
                errorMsg = alert.find("#zoom-msg").html();
            } else if (error.layers) {
                errorMsg = alert.find("#layers-msg").html();
            } else if (error.url) {
                errorMsg = alert.find("#url-msg").html();
            } else if (error.noFeatures) {
                errorMsg = alert.find("#noFeatures-msg").html();
            }

            self.map.toast(errorMsg, {type:TC.Consts.msgType.WARNING});            
        };

        var _showHelp = function (evt) {
            evt.stopPropagation();
            TC.Util.showModal(self._$dialogDiv.find(self._classSelector + '-help-dialog'));
        };

        _readWfsMaxFeaturesConstraint();
        self._$div.on(TC.Consts.event.CLICK, '.tc-ctl-download-btn', _download);
        self._$div.on(TC.Consts.event.CLICK, '.tc-ctl-download-help', _showHelp);
    };

})();

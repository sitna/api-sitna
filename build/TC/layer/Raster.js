TC.layer = TC.layer || {};

if (!TC.Layer) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Layer.js');
}

TC.Consts.BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7';

(function () {
    var capabilitiesPromises = {};

    var isWebWorkerEnabled = window.hasOwnProperty('Worker');
    var wwDeferred = $.Deferred();
    if (isWebWorkerEnabled) {
        // Para evitar problemas con IE10 y Opera evitamos el uso de blobs cuando es evitable
        var wwLocation = TC.apiLocation + 'TC/workers/tc-caps-web-worker.js';
        if (TC.Util.isSameOrigin(TC.apiLocation)) {
            wwDeferred.resolve(wwLocation);
        }
        else {
            $.ajax({
                url: wwLocation,
                type: 'GET',
                dataType: 'text'
            }).then(
                function (data) {
                    var blob = new Blob([data], { type: "text/javascript" });
                    var url = window.URL.createObjectURL(blob);
                    wwDeferred.resolve(url);
                },
                function (e) {
                    wwDeferred.reject();
                }
            );
        }
    }

    /*
     *  getCapabilities: Obtiene el capabilities de la capa layer, y llama a los callback correspondientes
     */
    var getCapabilities = function (layer, success, error) {
        var serviceUrl = layer.url;

        var processingCapabilities = false;
        var capabilitiesFromUrl = capabilitiesPromises[serviceUrl];
        if (capabilitiesFromUrl) {
            layer._capabilitiesPromise = capabilitiesFromUrl;
            processingCapabilities = true;
        }
        else {
            layer._capabilitiesPromise = capabilitiesFromUrl = capabilitiesPromises[serviceUrl] = $.Deferred();
        }
        capabilitiesFromUrl.then(function (capabilities) {
            if (capabilities.error) {
                capabilitiesError(layer, capabilities.error);

                return;
            }
            // Si existe el capabilities no machacamos, porque provoca efectos indeseados en la gesti\u00f3n de capas.
            // En concreto, se regeneran los UIDs de capas, como consecuencia los controles de la API interpretan como distintas capas que son la misma.
            layer.capabilities = layer.capabilities || capabilities;
            var actualUrl = layer.getGetMapUrl();
            TC.capabilities[layer.options.url] = TC.capabilities[layer.options.url] || capabilities;
            TC.capabilities[actualUrl] = TC.capabilities[actualUrl] || capabilities;

            if (capabilities.usesProxy) {
                layer.usesProxy = true;
            }
            if (capabilities.usesSSL) {
                layer.usesSSL = true;
            }
            _createLayer(layer);
        });

        if (processingCapabilities) {
            // Ya se est\u00e1 procesando el capabilities en otra capa, no es necesario seguir
            return;
        }

        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
            localforage.getItem(layer.CAPABILITIES_STORE_KEY_PREFIX + serviceUrl)
                .then(function (value) {
                    if (value) {
                        capabilitiesPromises[layer.url].resolve(value);
                    }
                });
        });

        var url;
        var params = {};
        if (layer.type === TC.Consts.layerType.WMTS) {
            if (layer.options.encoding === TC.Consts.WMTSEncoding.RESTFUL) {
                var suffix = '/1.0.0/WMTSCapabilities.xml';
                if (serviceUrl.indexOf(suffix) < serviceUrl.length - suffix.length) {
                    if (serviceUrl[serviceUrl.length - 1] === '/') {
                        suffix = suffix.substr(1);
                    }
                    url = serviceUrl + suffix;
                }
                else {
                    url = serviceUrl;
                }
            }
            else {
                url = serviceUrl;
                params.SERVICE = 'WMTS';
                params.VERSION = '1.0.0';
                params.REQUEST = 'GetCapabilities';
            }
        }
        else {
            url = serviceUrl;
            params.SERVICE = 'WMS';
            params.VERSION = '1.3.0';
            params.REQUEST = 'GetCapabilities';
        }
        url = url + '?' + $.param(params);
        TC._capabilitiesRequests = TC._capabilitiesRequests || {};
        var getRequest = function (url, retry) {
            var result = TC._capabilitiesRequests[url] = (!retry && TC._capabilitiesRequests[url]) || $.ajax({
                url: retry ? TC.proxify(url) : url,
                type: 'GET',
                dataType: isWebWorkerEnabled ? 'text' : 'xml'
            });
            return result;
        };

        var reallyCORSError = function (url) {
            var defer = $.Deferred();
            $.ajax({
                type: "GET",
                url: url,
                dataType: "jsonp",
                success: function (data) {
                    //successful authentication here
                    defer.resolve(false);
                },
                error: function (XHR, textStatus, errorThrown) {
                    if (XHR.status && XHR.status === 200)
                        defer.resolve(true);
                    else
                        defer.resolve(false);
                }
            });
            return defer;
        };

        var successCallback = function (data) {
            success(layer, data);
        };
        //Declaro un funci\u00f3n que devuelve false si todav\u00eda no se cargado el SW y una vez cargado devuelve el valor del atributo
        //serviceWorkerEnabled del control SWCacheClient
        TC.isUsingServiceWorker = null;
        if (!TC.isUsingServiceWorker) {
            var map = layer.map || $("#map").data("map");
            var control = map ? map.getControlsByClass(TC.control.SWCacheClient) : null;
            if (control && control.length > 0) {
                //busco es control de tipo SWCacheClient y me guardo la promesa te indica cuando se ha leido el SW
                TC.isUsingServiceWorker = function () {
                    if (control[0].getServiceWorker().state() !== "pending")
                        return control[0].serviceWorkerEnabled;
                    else
                        return false;
                }
            }
            else
                TC.isUsingServiceWorker = function () { return false; }
        }
        // Lanzamos la primera petici\u00f3n sin proxificar. Si falla (CORS, HTTP desde HTTPS...) pedimos proxificando.
        if (TC.Util.isSecureURL(document.location.href) && !TC.Util.isSecureURL(url)) {
            var urlSecure = url.replace(/^(f|ht)tp?:\/\//i, "https://");
            getRequest(urlSecure).then(successCallback, function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status) {
                    getRequest(url, true).then(function (data) {
                        layer.usesProxy = true;
                        layer.usesSSL = true;
                        successCallback(data);
                    }, function (jqXHR, textStatus, errorThrown) {
                        error(layer, textStatus + '][' + errorThrown);
                    });
                }
                else {
                    if (TC.isUsingServiceWorker && TC.isUsingServiceWorker()) {
                        getRequest(url, true).then(function (data) {
                            layer.usesProxy = true;
                            layer.usesSSL = false;
                            successCallback(data);
                        }, function (jqXHR, textStatus, errorThrown) {
                            error(layer, textStatus + '][' + errorThrown);
                        });
                    }
                    else {
                        reallyCORSError(urlSecure).then(function (corsError) {
                            if (!corsError) {
                                getRequest(url, true).then(function (data) {
                                    layer.usesProxy = true;
                                    layer.usesSSL = false;
                                    successCallback(data);
                                }, function (jqXHR, textStatus, errorThrown) {
                                    error(layer, textStatus + '][' + errorThrown);
                                });
                            }
                            else {
                                getRequest(url, true).then(function (data) {
                                    layer.usesProxy = true;
                                    layer.usesSSL = true;
                                    successCallback(data);
                                }, function (jqXHR, textStatus, errorThrown) {
                                    error(layer, textStatus + '][' + errorThrown);
                                });
                            }
                        });
                    }
                }
            });
        }
        else {
            layer.usesSSL = true;
            getRequest(url).then(successCallback, function (jqXHR, textStatus, errorThrown) {
                if (!jqXHR.status) {
                    layer.usesProxy = true;
                    getRequest(url, true).then(function (data) {
                        successCallback(data);
                    }, function (jqXHR, textStatus, errorThrown) {
                        error(layer, textStatus + '][' + errorThrown);
                    });
                }
                else {
                    error(layer, textStatus + '][' + errorThrown);
                }
            });
        }
    };

    var capabilitiesError = function (layer, reason) {
        var msg = 'No se pudo obtener el documento de capacidades de servicio ' + layer.url + ': [' + reason + ']';
        layer._capabilitiesPromise.reject(msg);
        TC.error(msg);
        if (layer.map) {
            layer.map.$events.trigger($.Event(TC.Consts.event.LAYERERROR, { layer: layer, reason: 'couldNotGetCapabilities' }));
        }
        layer.wrap.setLayer(null);
    };

    var storeCapabilities = function (layer, capabilities) {
        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
            // Esperamos a que el mapa se cargue y entonces guardamos el capabilities.
            // As\u00ed evitamos que la operaci\u00f3n, que es bastante pesada, ocupe tiempo de carga 
            // (con el efecto secundario de que LoadingIndicator est\u00e9 un tiempo largo apagado durante la carga)
            var capKey = layer.CAPABILITIES_STORE_KEY_PREFIX + layer.options.url;
            var setItem = function () {
                localforage.setItem(capKey, capabilities);
            };
            if (layer.map) {
                layer.map.loaded(setItem);
            }
            else {
                setItem();
            }
        });
    };

    var parseCapabilities = function (layer, data) {
        var capabilities;

        if (data.documentElement) {

            if ($(data).find("ServiceException").length > 0) {
                capabilities = { error: $(data).find("ServiceException").text() };
            }
            else {
                var format = (layer.type === TC.Consts.layerType.WMTS) ? new layer.wrap.WmtsParser() : new layer.wrap.WmsParser();
                capabilities = format.read(data);

                //parsear a manija los tileMatrixSetLimits, que openLayers no lo hace (de momento)
                if (layer.type === TC.Consts.layerType.WMTS) {
                    if (capabilities.Contents && capabilities.Contents.Layer) {
                        $("Layer", data).each(function (ix, curXmlLy) {
                            var nd = TC.Util.getElementByNodeName(curXmlLy, "ows:Identifier")[0];
                            var id = nd.firstChild.data;
                            var xmlLy = $(curXmlLy);

                            var capLy = capabilities.Contents.Layer.filter(function (ly) {
                                return ly.Identifier == id;
                            });

                            if (capLy.length) {
                                capLy = capLy[0];
                                for (var i = 0; i < capLy.TileMatrixSetLink.length; i++) {
                                    var capLink = capLy.TileMatrixSetLink[i];
                                    matrixId = capLink.TileMatrixSet;

                                    xmlLink = xmlLy.find("TileMatrixSetLink").each(function (ix, curLink) {
                                        return $(curLink).find("TileMatrixSet:first").text() == matrixId;
                                    });

                                    if (xmlLink.length) {
                                        xmlLink = xmlLink[0];
                                        capLink.TileMatrixSetLimits = [];
                                        $(xmlLink).find("TileMatrixLimits").each(function (ix, curLim) {
                                            var lim = $(curLim);
                                            capLink.TileMatrixSetLimits.push({
                                                TileMatrix: lim.find("TileMatrix").text(),
                                                MinTileRow: parseInt(lim.find("MinTileRow").text()),
                                                MinTileCol: parseInt(lim.find("MinTileCol").text()),
                                                MaxTileRow: parseInt(lim.find("MaxTileRow").text()),
                                                MaxTileCol: parseInt(lim.find("MaxTileCol").text())
                                            });
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            }
            if (layer.usesProxy) {
                capabilities.usesProxy = true;
            }
            capabilitiesPromises[layer.url].resolve(capabilities);
            storeCapabilities(layer, capabilities);
        }
        else {
            if (isWebWorkerEnabled && typeof data === 'string') {
                wwDeferred.then(function (wwUrl) {
                    var worker = new Worker(wwUrl);
                    worker.onmessage = function (e) {
                        if (e.data.state === 'success') {
                            capabilities = e.data.capabilities;
                        }
                        else {
                            capabilities = {
                                error: 'Web worker error'
                            }
                        }
                        if (layer.usesProxy) {
                            capabilities.usesProxy = true;
                        }
                        if (layer.usesSSL) {
                            capabilities.usesSSL = true;
                        }
                        capabilitiesPromises[layer.url].resolve(capabilities);
                        worker.terminate();
                        storeCapabilities(layer, capabilities);
                    };
                    worker.postMessage({
                        type: layer.type,
                        text: data
                    });
                })
            }
            else {
                capabilities = data;
                if (layer.usesProxy) {
                    capabilities.usesProxy = true;
                }
                capabilitiesPromises[layer.url].resolve(capabilities);
            }
        }
    };

    /*
     *  _createLayer: Crea la capa nativa correspondiente seg\u00fan el tipo
     */
    var _createLayer = function (layer) {
        var ollyr;
        if (!layer.wrap.layer) {
            switch (layer.type) {
                case TC.Consts.layerType.GROUP:
                    break;
                case TC.Consts.layerType.WMTS:
                    ollyr = _createWMTSLayer(layer);
                    break;
                default:
                    ollyr = _createWMSLayer(layer);
                    break;
            }
            layer.wrap.setLayer(ollyr);
        }
    };

    var _createWMSLayer = function (layer) {

        var layerNames = $.isArray(layer.names) ? layer.names.join(',') : layer.names;
        var format = layer.options.format;
        var options = layer.options;

        var params = {
            LAYERS: layerNames,
            FORMAT: format,
            TRANSPARENT: layer.transparent,
            VERSION: layer.capabilities.version || '1.3.0'
        };

        if (layer.params) {
            $.extend(params, layer.params);
        }

        var infoFormat = layer.getPreferredInfoFormat();
        if (infoFormat !== null) {
            params.INFO_FORMAT = infoFormat;
        }

        return layer.wrap.createWmsLayer(layer.url, params, options);
    };

    var _createWMTSLayer = function (layer) {
        return layer.wrap.createWmtsLayer(layer.options.matrixSet, layer.names[0], layer.options);
    };


    var _getLayerNodeIndex = function _getLayerNodeIndex(layer, treeNode) {

        var result = $.inArray(treeNode.name, layer.availableNames);
        if (result === -1) {
            for (var i = 0, len = treeNode.children.length; i < len; i++) {
                result = _getLayerNodeIndex(layer, treeNode.children[i]);
                if (result !== -1) {
                    break;
                }
            }
        }
        return result;
    }

    var _sortTree = function _sortTree(layer, treeNode) {
        var _sortFunction = function (n1, n2) {
            return _getLayerNodeIndex(layer, n2) - _getLayerNodeIndex(layer, n1);
        }
        treeNode.children.sort(_sortFunction);
        for (var i = 0, len = treeNode.children.length; i < len; i++) {
            _sortTree(layer, treeNode.children[i]);
        }
    };

    var _getLayerNamePosition = function _getLayerNamePosition(treeNode, name, counter) {
        var result = false;
        counter.count = counter.count + 1;
        if (treeNode.name === name) {
            result = true;
        }
        else {
            // Las capas se ordenan de arriba a abajo en el \u00e1rbol, por tanto hay que recorrer la lista del rev\u00e9s
            for (var i = treeNode.children.length - 1; i >= 0; i--) {
                if (_getLayerNamePosition(treeNode.children[i], name, counter)) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Opciones de nombre de capa.
     * Esta clase no tiene constructor.
     * @class TC.cfg.LayerNameOptions
     * @static
     */
    /**
     * Siempre que sea posible se reemplaza en la lista TC.layer.Raster.{{#crossLink "TC.layer.Raster/names:property"}}{{/crossLink}} los nombres de capa por los nombres de las capas de grupo que las contienen.
     * @property aggregate
     * @type boolean
     * @default true
     */
    /**
     * Determina si la capa nativa se actualiza en cuanto cambia la lista TC.layer.Raster.{{#crossLink "TC.layer.Raster/names:property"}}{{/crossLink}} (valor <code>false</code>) 
     * o se espera a que la capa se actualice (valor <code>true</code>).
     * @property lazy
     * @type boolean
     * @default false
     */
    /**
     * Determina si la capa la propiedad TC.layer.Raster.{{#crossLink "TC.layer.Raster/availableNames:property"}}{{/crossLink}} (valor <code>false</code>) se restablece 
     * al actualizar la propiedad TC.layer.Raster.{{#crossLink "TC.layer.Raster/names:property"}}{{/crossLink}}.
     * @property reset
     * @type boolean|undefined
     */

    /**
     * Opciones de capa raster.
     * Esta clase no tiene constructor.
     * @class TC.cfg.RasterOptions
     * @extend TC.cfg.LayerOptions
     * @static
     */
    /**
     * Tipo de capa.
     * @property type
     * @type TC.consts.LayerType
     * @default TC.Consts.layerType.WMS
     */
    /**
     * URL del servicio OGC que define la capa.
     * @property url
     * @type string
     */
    /**
     * Indica si la capa tiene transparencia.
     * @property transparent
     * @type boolean|undefined
     */
    /**
     * Lista separada por comas de los nombres de capa del servicio OGC.
     * @property layerNames
     * @type string|undefined
     */
    /**
     * Nombre de grupo de matrices del servicio WMTS. Propiedad obligatoria para capas de tipo WMTS.
     * @property matrixSet
     * @type string|undefined
     */

    /**
     * Capa de tipo raster, como la de un WMS o un WMTS.
     * @class TC.layer.Raster
     * @extends TC.Layer
     * @constructor
     * @async
     * @param {TC.cfg.LayerOptions} [options] Objeto de opciones de configuraci\u00f3n de la capa.
     */
    TC.layer.Raster = function () {
        var self = this;

        //esta promise se resolver\u00e1 cuando el capabilities est\u00e9 descargado y parseado
        //se utiliza para saber cu\u00e1ndo est\u00e1 listo el capabilities en los casos en los que se instancia el layer pero no se a\u00f1ade al mapa
        //porque la forma habitual de detectar esto es por los eventos del mapa (que en esos casos no saltar\u00e1n)
        this._capabilitiesPromise = null;

        TC.Layer.apply(self, arguments);

        self.wrap = new TC.wrap.layer.Raster(self);

        /**
         * Indica si la capa tiene transparencia.
         * @property transparent
         * @type boolean
         * @default true
         */
        self.transparent = (self.options.transparent === false) ? false : true;

        /**
         * URL del servicio al que pertenenece la capa.
         * @property url
         * @type string
         */
        self.url = self.options.url;

        self.params = self.options.params;
        /**
         * Lista de nombres de capa.
         * @property names
         * @type array
         * @default []
         */
        /**
         * Lista de nombres de capa disponibles inicialmente.
         * @property availableNames
         * @type array
         * @default []
         */
        if (typeof self.options.layerNames === 'string') {
            self.names = self.availableNames = self.options.layerNames.split(',');
        }
        else {
            self.names = [];
            self.availableNames = [];
            if ($.isArray(self.options.layerNames)) {
                for (var i = 0; i < self.options.layerNames.length; i++) {
                    var name = self.options.layerNames[i];
                    if (typeof name === 'string') {
                        self.names.push(name);
                        self.availableNames.push(name);

                    }
                    else if (name.hasOwnProperty('name')) {
                        self.availableNames.push(name.name);
                        if (name.isVisible === undefined || name.isVisible) {
                            self.names.push(name.name);
                        }
                    }
                }
            } else {
                // Si no se encuentran nombres de capas, se buscan en el par\u00e1metro sld_body. Este par\u00e1metro es utilizado
                // cuando queremos instanciar una capa pas\u00e1ndole un SLD en la petici\u00f3n
                var sldBody = self.options.params ? self.options.params.sld_body : null;

                if (sldBody) {
                    var sldBodyToXml = $.parseXML(sldBody);
                    var namedLayerElm = TC.Util.getElementByNodeName(sldBodyToXml, 'sld:NamedLayer');
                    if (namedLayerElm && namedLayerElm.length > 0) {
                        var names = TC.Util.getElementByNodeName(namedLayerElm[0], 'sld:Name');

                        if (names && names.length > 0) {
                            var name = $(names[0]).text();
                            self.names.push(name);
                            self.availableNames.push(name);
                        }
                    }
                }
            }
        }

        self.ignorePrefixes = self.options.ignorePrefixes === undefined ? true : self.options.ignorePrefixes;

        self._capabilitiesNodes = {};

        /**
         * \u00c1rbol del documento de capabilities del servicio.
         * @property capabilities
         * @type object
         */

        getCapabilities(self, parseCapabilities, capabilitiesError);

        self._disgregatedLayerNames = null;

        if (TC.Consts.layerType.WMTS == self.type) {
            self.wrap.setWMTSUrl();
        }

    };

    TC.inherit(TC.layer.Raster, TC.Layer);

    TC.layer.Raster.prototype.CAPABILITIES_STORE_KEY_PREFIX = 'TC.capabilities.';

    TC.layer.Raster.prototype.setVisibility = function (visible) {
        var layer = this;
        layer.tree = null;
        layer._cache.visibilityStates = {};
        TC.Layer.prototype.setVisibility.call(layer, visible);
    };

    /*
     *  _getLimitedMatrixSet: devuelve un array de tileMatrixSets limitados por su correspondiente TileMatrixSetLimits (si es que lo tiene)
     */
    var _getLimitedMatrixSet = function (layer) {
        var layerId = layer.layerNames;
        var matrixId = layer.matrixSet;
        var cap = layer.capabilities;

        var ret = [];

        var tset = cap.Contents.TileMatrixSet.filter(function (elto) { return elto.Identifier == matrixId; });
        if (tset.length) {
            tset = tset[0];
            var ly = cap.Contents.Layer.filter(function (elto) { return elto.Identifier == layerId; })[0];
            if (ly.TileMatrixSetLink && ly.TileMatrixSetLink.length && ly.TileMatrixSetLink[0].TileMatrixSetLimits) {
                var limit, limits = ly.TileMatrixSetLink[0].TileMatrixSetLimits;
                for (var i = 0; i < limits.length; i++) {
                    limit = limits[i];
                    var matrix = tset.TileMatrix.filter(function (elto) { return elto.Identifier == limit.TileMatrix });
                    if (matrix.length) {
                        var combi = $.extend({ matrixIndex: tset.TileMatrix.indexOf(matrix[0]) }, matrix[0], limit);
                        ret.push(combi);
                    }
                }

                return ret;
            }
            else {
                return tset.TileMatrix;
            }
        }
        else
            return null;
    };


    /*
     *  _aggregateLayerNames: devuelve un array de nombres de capa WMS sustituyendo en la medida de lo posible capas por las capas de grupo que las contienen
     */
    var _aggregateLayerNames = function (layer, layerNames) {
        if (layer.type !== TC.Consts.layerType.WMS) {
            return layerNames;
        }
        else {
            var ln = layerNames.slice();
            _aggregateLayerNodeNames(layer, ln, layer.wrap.getRootLayerNode());
            return ln;
        }
    };

    /*
     *  _aggregateLayerNodeNames: Agrega el array de nombres de capa WMS sustituyendo en la medida de lo posible capas por las capas de grupo que las contienen.
     * Se parte de un nodo del \u00e1rbol de capas del capabilities
     */
    var _aggregateLayerNodeNames = function _aggregateLayerNodeNames(layer, names, layerNode) {
        var result = false;
        var children = layer.wrap.getLayerNodes(layerNode);
        if (children.length) {
            for (var i = 0, len = children.length; i < len; i++) {
                if (_aggregateLayerNodeNames(layer, names, children[i])) {
                    result = true;
                }
            }

            var nodeNames = $.map(children, function (elm) {
                return layer.wrap.getName(elm);
            }).reverse();
            var idx, firstIdx;
            var fail = false;

            firstIdx = idx = $.inArray(nodeNames[0], names);
            if (idx < 0) {
                fail = true;
            }
            else {
                for (var i = 1, len = nodeNames.length; i < len; i++) {
                    if (nodeNames[i] != names[++idx]) {
                        fail = true;
                        break;
                    }
                }
            }
            if (!fail) {
                var nodeName = layer.wrap.getName(layerNode);
                if (nodeName && nodeNames.length > 1) {
                    names.splice(firstIdx, nodeNames.length, nodeName);
                    result = true;
                }
            }
        }
        return result;
    };

    /*
     *  _disgregateLayerNames: devuelve un array de nombres de capa WMS con solo capas hoja.
     * Par\u00e1metros: objeto de capa, array of strings, nodo de la capa en el capabilities, booleano que dice si esta rama viene de un nodo visible
     */
    var _disgregateLayerNames = function (layer, layerNames) {
        var result = [];
        var ln = layerNames.slice();
        var rootNode = layer.wrap.getRootLayerNode();
        for (var i = 0, len = ln.length; i < len; i++) {
            result = result.concat(_disgregateLayerName(layer, ln[i], rootNode));
        }
        return result;
    };

    var _disgregateLayerName = function _disgregateLayerName(layer, name, layerNode, ancestorVisible) {
        var result = [];
        var nodeName = layer.wrap.getName(layerNode);
        var nodeVisible = layer.compareNames(name, nodeName);
        var hasEmptyChildren = false;
        var children = layer.wrap.getLayerNodes(layerNode);
        for (var i = 0; i < children.length; i++) {
            var names = _disgregateLayerName(layer, name, children[i], ancestorVisible || nodeVisible);
            if (!names.length) {
                hasEmptyChildren = true;
            }
            else {
                result = result.concat(names);
            }
        }
        if (!children.length || hasEmptyChildren) {
            if (ancestorVisible || nodeVisible) {
                result = [nodeName];
            }
        }
        return result;
    };

    var _extendLayerNameOptions = function (options) {
        return $.extend({ aggregate: true, lazy: false }, options);
    };

    var _combineArray = function (source, add, rem) {
        var result = [];
        var s, a, r;
        s = source ? source : [];
        a = add ? add : [];
        r = rem ? rem : [];
        var sa = s.concat(a);
        for (var i = 0; i < sa.length; i++) {
            if ($.inArray(sa[i], sa) === i && $.inArray(sa[i], r) === -1) {
                result[result.length] = sa[i];
            }
        }
        return result;
    };

    var _sortLayerNames = function (layer, layerNames) {
        var ln = (typeof layerNames === 'string') ? layerNames.split(',') : layerNames;
        if (layer.capabilities) {
            var tree = layer.getTree();
            ln.sort(function (a, b) {
                var idxa = { count: 0 };
                var idxb = { count: 0 };
                _getLayerNamePosition(tree, a, idxa);
                _getLayerNamePosition(tree, b, idxb);
                return idxa.count - idxb.count;
            });
        }
        return ln;
    };

    var _isNameInArray = function (layer, name, names, looseComparison) {
        return $.grep(names, function (elm) {
            return layer.compareNames(name, elm, looseComparison);
        }).length > 0;
    };


    TC.layer.Raster.prototype.getLimitedMatrixSet = function () {
        return _getLimitedMatrixSet(this);
    };

    /**
     * Establece los nombres de capas que deben estar visibles en un WMS. Si la lista est\u00e1 vac\u00eda, hace invisible la capa.
     * @method setLayerNames
     * @param {array|string} layerNames Array de strings con los nombres de capa o string con los nombres de capa separados por comas.
     * @param {TC.cfg.LayerNameOptions} [options]
     */
    /*
     *  setLayerNames: sets the visible layer names of a WMS layer
     *  Parameters: array of string, options object: { aggregate: boolean (default true), lazy: boolean (default false), reset: boolean (default false) }
     *  aggregate option replaces layer name sets by layer group names when possible
     *  lazy option does not update OpenLayers layer
     */
    TC.layer.Raster.prototype.setLayerNames = function (layerNames, options) {
        var layer = this;
        var result = new $.Deferred();

        $.when(layer.wrap.getLayer()).then(function () {
            var ln = $.isArray(layerNames) ? layerNames : layerNames.split(',');
            layer.names = ln;
            var opts = _extendLayerNameOptions(options);
            if (opts.aggregate) {
                ln = _aggregateLayerNames(layer, ln);
            }
            layer._disgregatedLayerNames = null;
            var newParams = { LAYERS: ln.join(','), TRANSPARENT: true };
            // Si no hay capas ocultamos la capa de servicio
            if (!ln.length) {
                layer.setVisibility(false);
            }
            if (opts.lazy) {
                var params = layer._newParams || layer.wrap.getParams();
                layer._newParams = $.extend(params, newParams);
            }
            else {
                if (layer.map) {
                    layer.map.$events.trigger($.Event(TC.Consts.event.BEFOREUPDATEPARAMS, { layer: layer }));
                }
                layer.tree = null;
                layer._cache.visibilityStates = {};
                layer.wrap.setParams(newParams);
                if (opts.reset || !layer.map) {
                    // layerNames se fija cuando se a\u00f1ade al mapa o cuando reset = true.
                    layer.availableNames = layer.names;
                }
                if (layer.map) {
                    layer.map.$events.trigger($.Event(TC.Consts.event.UPDATEPARAMS, { layer: layer }));
                }
            }
            result.resolve(layer.names);
        });

        return result;
    };

    /**
     * A\u00f1ade capas por nombre a las que ya est\u00e1n visibles en el WMS
     * @method addLayerNames
     * @param {array|string} layerNames Array de strings con los nombres de capa o string con los nombres de capa separados por comas.
     * @param {TC.cfg.LayerNameOptions} [options]
     */
    /*
     *  addLayerNames: adds layer names to the set of visible layer names of a WMS layer
     *  Parameters: array of string, options object: { aggregate: boolean (default true), lazy: boolean (default false), reset: boolean (default false) }
     *  aggregate option replaces layer name sets by layer group names when possible
     *  lazy option does not update OpenLayers layer
     */
    TC.layer.Raster.prototype.addLayerNames = function (layerNames, options) {
        var layer = this;
        var result = new $.Deferred();

        $.when(layer.wrap.getLayer()).then(function () {
            var opts = _extendLayerNameOptions(options);
            var ln2a = $.isArray(layerNames) ? layerNames : layerNames.split(',');
            var ln = layer.wrap.getParams().LAYERS;
            if (opts.aggregate) {
                ln2a = _disgregateLayerNames(layer, ln2a);
                ln = layer.getDisgregatedLayerNames();
            }
            $.when(layer.setLayerNames(_sortLayerNames(layer, _combineArray(ln, ln2a, null)), options)).then(function (names) {
                result.resolve(names);
            });
        });

        return result;
    };

    /**
     * Elimina capas por nombre de las que est\u00e1n visibles en el WMS
     * @method addLayerNames
     * @param {array|string} layerNames Array de strings con los nombres de capa o string con los nombres de capa separados por comas.
     * @param {TC.cfg.LayerNameOptions} [options]
     */
    /*
     *  removeLayerNames: removes layer names from the set of visible layer names of a WMS layer
     *  Parameters: array of string, options object: { aggregate: boolean (default true), lazy: boolean (default false), reset: boolean (default false) }
     *  aggregate option replaces layer name sets by layer group names when possible
     *  lazy option does not update OpenLayers layer
     */
    TC.layer.Raster.prototype.removeLayerNames = function (layerNames, options) {
        var layer = this;
        var result = new $.Deferred();

        $.when(layer.wrap.getLayer()).then(function () {
            var opts = _extendLayerNameOptions(options);
            var ln2r = $.isArray(layerNames) ? layerNames : layerNames.split(',');
            var ln = layer.wrap.getParams().LAYERS;
            if (opts.aggregate) {
                ln2r = _disgregateLayerNames(layer, ln2r);
                ln = layer.getDisgregatedLayerNames();
            }
            $.when(layer.setLayerNames(_sortLayerNames(layer, _combineArray(ln, null, ln2r)), options)).then(function (names) {
                result.resolve(names);
            });
        });

        return result;
    };

    /**
     * Toma una lista de nombres de capa WMS y cambia su visibilidad: de visible a no visible y viceversa.
     * @method toggleLayerNames
     * @param {array|string} layerNames Array de strings con los nombres de capa o string con los nombres de capa separados por comas.
     * @param {TC.cfg.LayerNameOptions} [options]
     */
    /*
     *  toggleLayerNames: from a list, adds a layer name when it is not visible or removes a layer name when it is visible in a WMS layer
     *  Parameters: array of string, options object: { aggregate: boolean (default true), lazy: boolean (default false), reset: boolean (default false) }
     *  aggregate option replaces layer name sets by layer group names when possible
     *  lazy option does not update OpenLayers layer
     */
    TC.layer.Raster.prototype.toggleLayerNames = function (layerNames, options) {
        var layer = this;
        var result = new $.Deferred();

        $.when(layer.wrap.getLayer()).then(function () {
            var opts = _extendLayerNameOptions(options);
            var ln2t = $.isArray(layerNames) ? layerNames : layerNames.split(',');
            var currentLayerNames = layer.wrap.getParams().LAYERS;
            if (opts.aggregate) {
                ln2t = _disgregateLayerNames(layer, ln2t);
                currentLayerNames = layer.getDisgregatedLayerNames();
            }
            var ln2a = [];
            var ln2r = [];
            for (var i = 0; i < ln2t.length; i++) {
                var l = ln2t[i];
                if ($.inArray(l, currentLayerNames) < 0) {
                    ln2a[ln2a.length] = l;
                }
                else {
                    ln2r[ln2r.length] = l;
                }
            }
            var deferreds = [];
            if (ln2a.length > 0) {
                deferreds.push(layer.addLayerNames(ln2a, opts));
            }
            if (ln2r.length > 0) {
                deferreds.push(layer.removeLayerNames(ln2r, opts));
            }
            $.when.apply(this, deferreds).then(function (a1, a2) {
                if (a1) {
                    if (a2) {
                        result.resolve(a1.concat(a2));
                    }
                    else {
                        result.resolve(a1);
                    }
                }
                else {
                    result.resolve([]);
                }
            });
        });

        return result;
    };

    /**
     * Devuelve la lista de nombres de capa WMS hoja correspondientes a las capas visibles.
     * @method getDisgregatedLayerNames
     * @return {array}
     */
    /*
     *  getDisgregatedLayerNames: returns an array of visible WMS leaf layer names
     */
    TC.layer.Raster.prototype.getDisgregatedLayerNames = function () {
        ///<summary>
        ///Devuelve la lista de nombres de capa WMS hoja correspondientes a las capas visibles.
        ///</summary>
        ///<returns type="array" elementType="string"></returns>
        var self = this;
        var olLayer = self.wrap.getLayer();
        if (self.wrap.isNative(olLayer) && self.type === TC.Consts.layerType.WMS) {
            if (!self._disgregatedLayerNames) {
                var layerNames = self.wrap.getParams().LAYERS;
                layerNames = $.isArray(layerNames) ? layerNames : layerNames.split(',');
                self._disgregatedLayerNames = _disgregateLayerNames(self, layerNames);
            }
        }
        else {
            self._disgregatedLayerNames = self.names;
        }
        return self._disgregatedLayerNames.slice();
    };

    TC.layer.Raster.prototype.isValidFromNames = function () {
        var self = this;
        var result = true;
        for (var i = 0, len = self.names.length; i < len; i++) {
            if (!self.getLayerNodeByName(self.names[i])) {
                result = false;
                break;
            }
        }
        return result;
    };

    TC.layer.Raster.prototype.isCompatible = function (crs) {
        var self = this;
        var result = false;
        switch (self.type) {
            case TC.Consts.layerType.WMTS:
            case TC.Consts.layerType.WMS:
                result = self.wrap.isCompatible(crs);
                break;
            default:
                break;
        }
        return result;
    };

    /*
     *  isVisibleByScale: return wether the WMS layer is visible at current scale
     *  Parameter: WMS layer name or UID
     */
    TC.layer.Raster.prototype.isVisibleByScale = function (nameOrUid, looseComparison) {
        var self = this;
        var result;
        var _getOgcScale = function () {
            return self.map.wrap.getResolution() / 0.00028; // OGC assumes 0.28 mm / pixel
        };
        var currentScale;
        var i;
        switch (self.type) {
            case TC.Consts.layerType.WMTS:
                result = false;
                var tileMatrix = self.wrap.getTileMatrix(self.options.matrixSet);
                if (tileMatrix) {
                    currentScale = _getOgcScale();
                    for (i = 0; i < tileMatrix.length; i++) {
                        var scaleDenominators = self.wrap.getScaleDenominators(tileMatrix[i]);
                        if (scaleDenominators[0] === currentScale) {
                            result = true;
                            break;
                        }
                    }
                }
                break;
            case TC.Consts.layerType.WMS:
                result = true;
                var layers = self.wrap.getAllLayerNodes();
                if (layers.length > 0) {
                    currentScale = _getOgcScale();
                    var node;
                    if (typeof nameOrUid === 'number') {
                        node = self._capabilitiesNodes[nameOrUid];
                    }
                    else {
                        for (i = 0; i < layers.length; i++) {
                            var layer = layers[i];
                            if (self.compareNames(self.wrap.getName(layer), nameOrUid, looseComparison)) {
                                node = layer;
                                break;
                            }
                        }
                    }
                    if (node) {
                        var scaleDenominators = self.wrap.getScaleDenominators(node);
                        result = !(parseFloat(scaleDenominators[1]) > currentScale || parseFloat(scaleDenominators[0]) < currentScale);
                    }
                }
                break;
            default:
                result = true;
                break;
        }
        return result;
    };

    /*
     *  isVisibleByName: return wether the WMS layer is visible because of the requested layer names
     *  Parameter: WMS layer name
     */
    TC.layer.Raster.prototype.isVisibleByName = function (name, looseComparison) {
        var self = this;
        var result = false;
        switch (self.type) {
            case TC.Consts.layerType.WMTS:
                if (self.wrap.getWMTSLayer()) {
                    result = true;
                    break;
                }
                break;
            case TC.Consts.layerType.WMS:
                var _getLayerPath = function _getLayerPath(name) {
                    return __getLayerPath(name, self.wrap.getRootLayerNode());
                };

                var __getLayerPath = function __getLayerPath(name, capabilitiesNode) {
                    var result = null;
                    var n = self.wrap.getName(capabilitiesNode);
                    if (self.compareNames(n, name, looseComparison)) {
                        result = [n];
                    }
                    else {
                        var layerNodes = self.wrap.getLayerNodes(capabilitiesNode);
                        for (var i = 0; i < layerNodes.length; i++) {
                            var item = layerNodes[i];
                            var r = __getLayerPath(name, item);
                            if (r) {
                                TC.Util.fastUnshift(r, n);
                                result = r;
                                break;
                            }
                        }
                    }
                    return result;
                };

                var path = _getLayerPath(name);
                if (path) {
                    for (var i = 0; i < path.length; i++) {
                        if (_isNameInArray(self, path[i], self.names)) {
                            result = true;
                            break;
                        }
                    }
                }
                break;
            default:
                result = true;
                break;
        }
        return result;
    };

    TC.layer.Raster.prototype.getTree = function () {
        var self = this;
        var result = self.tree;

        var addChild = function (node, child) {
            if (self.options.inverseTree) {
                // Versi\u00f3n r\u00e1pida de unshift
                TC.Util.fastUnshift(node.children, child);
            }
            else {
                node.children[node.children.length] = child;
            }
        }

        if (!result) {
            var rootNode;
            var getTreeNode = function getTreeNode(capabilitiesNode, forceAddition, isRootNode) {
                var uid;
                for (var key in self._capabilitiesNodes) {
                    if (self._capabilitiesNodes[key] === capabilitiesNode) {
                        uid = key;
                        break;
                    }
                }
                if (!uid) {
                    uid = TC.getUID();
                    self._capabilitiesNodes[uid] = capabilitiesNode;
                }
                var r = { name: self.wrap.getName(capabilitiesNode), title: capabilitiesNode.title || capabilitiesNode.Title, uid: uid, children: [] };
                if (isRootNode) {
                    rootNode = r;
                }

                if (_isNameInArray(self, r.name, self.availableNames)) {
                    forceAddition = true;
                }

                if (!self.options.isBase) {
                    if (r === rootNode) {
                        r.isVisible = self.getVisibility();
                    }
                    else {
                        r.isVisible = self.isVisibleByName(r.name);
                    }
                    var i;
                    var layerNodes = self.wrap.getLayerNodes(capabilitiesNode);
                    for (i = 0; i < layerNodes.length; i++) {
                        var treeNode = getTreeNode(layerNodes[i], forceAddition);
                        if (treeNode) {
                            addChild(r, treeNode);
                        }
                    }

                    var legend = self.wrap.getLegend(capabilitiesNode);
                    if (legend.src) {
                        r.legend = legend;
                    }

                    // No muestra ramas irrelevantes si hideTree = true
                    if (!forceAddition && !isRootNode) {
                        // Eliminamos la rama hasta el nodo de inter\u00e9s
                        rootNode.children = rootNode.children.concat(r.children);
                        r = null;
                    }
                }
                else {
                    r.name = self.names.join(',');
                    r.title = self.title || r.title;
                    r.isBase = self.isDefault;
                    if (self.options.thumbnail) {
                        r.legend = { src: self.options.thumbnail };
                    }
                }
                return r;
            };

            switch (self.type) {
                case TC.Consts.layerType.WMTS:
                    result = getTreeNode(self.wrap.getWMTSLayer(), !self.options.hideTree, true);
                    break;
                case TC.Consts.layerType.WMS:
                    if (self.capabilities) {
                        result = getTreeNode(self.wrap.getRootLayerNode(), !self.options.hideTree, true);

                        var cache = self._cache.visibilityStates;

                        var _setNodeState = function _setNodeState(node) {
                            var _result = TC.Consts.visibility.NOT_VISIBLE;
                            if (node) {
                                if (cache[node.uid] !== undefined) {
                                    _result = cache[node.uid];
                                }
                                else {
                                    if (node.children) {
                                        var hasVisible = false;
                                        var hasNotVisible = false;
                                        for (var i = 0, len = node.children.length; i < len; i++) {
                                            var r = _setNodeState(node.children[i]);
                                            switch (r) {
                                                case TC.Consts.visibility.VISIBLE:
                                                    hasVisible = true;
                                                    break;
                                                case TC.Consts.visibility.NOT_VISIBLE:
                                                    hasNotVisible = true;
                                                    break;
                                                case TC.Consts.visibility.HAS_VISIBLE:
                                                    hasVisible = true;
                                                    hasNotVisible = true;
                                                    break;
                                                default:
                                                    break;
                                            }
                                            if (hasVisible) {
                                                if (hasNotVisible) {
                                                    _result = TC.Consts.visibility.HAS_VISIBLE;
                                                }
                                                else {
                                                    _result = TC.Consts.visibility.VISIBLE;
                                                }
                                            }
                                        }
                                    }
                                    if (node.isVisible) {
                                        _result = TC.Consts.visibility.VISIBLE;
                                    }
                                    cache[node.uid] = _result;
                                }
                                node.visibilityState = _result;
                            }
                            return _result;
                        };
                        _setNodeState(result);

                        if (self.options.hideTree) {
                            _sortTree(self, result);
                        }
                    }
                    break;
                default:
                    break;
            }
            if (!result) {
                result = { name: self.name, title: self.title };
            }
            result.title = self.title || result.title;
            self.tree = result;
        }
        return result;
    };

    TC.layer.Raster.prototype.setNodeVisibility = function (id, visible) {
        var self = this;
        if (!self.tree) {
            self.tree = self.getTree();
        }

        var _getNames = function _getNames(node) {
            var result = [];
            if (node.name) {
                result[0] = node.name;
            }
            else {
                for (var i = 0; i < node.children.length; i++) {
                    result = result.concat(_getNames(node.children[i]));
                }
            }
            return result;
        };

        var node = self.findNode(id, self.tree);
        if (node === self.tree) {
            if (visible && self.names.length === 0) {
                // Prevent pink error tile
                self.addLayerNames(self.availableNames).then(function () {
                    self.setVisibility(true);
                });
            }
            else {
                self.setVisibility(visible);
            }
        }
        else {
            var names = _getNames(node);
            if (visible) {
                self.addLayerNames(names);
            }
            else {
                self.removeLayerNames(names);
            }
        }
    };

    TC.layer.Raster.prototype.getNodeVisibility = function (id) {
        var self = this;
        if (!self.tree) {
            self.tree = self.getTree();
        }
        return self._cache.visibilityStates[id];
    };

    TC.layer.Raster.prototype.getNodePath = function (layerName, ignorePrefix) {
        var self = this;
        var result = [];
        if (self.type === TC.Consts.layerType.WMS && self.capabilities) {
            layerName = layerName || self.names[0];

            var _getPath = function _getPath(node) {
                var res = [];
                var nodeName = self.wrap.getName(node);
                if (self.compareNames(nodeName, layerName, ignorePrefix)) {
                    res.push(node);
                }
                else {
                    var children = self.wrap.getLayerNodes(node);
                    for (var i = 0; i < children.length; i++) {
                        var r = _getPath(children[i]);
                        if (r.length) {
                            res = r;
                            TC.Util.fastUnshift(res, node);
                            break;
                        }
                    }
                }
                return res;
            };
            result = _getPath(self.wrap.getRootLayerNode());
        }
        return result;
    };

    TC.layer.Raster.prototype.getPath = function (layerName, ignorePrefix) {
        return $.map(this.getNodePath(layerName, ignorePrefix), function (node) {
            return node.title || node.Title;
        });
    };

    TC.layer.Raster.prototype.getLayerNodeByName = function (name) {
        var result = null;
        var self = this;
        var getName = self.wrap.getServiceType() === TC.Consts.layerType.WMTS ? self.wrap.getIdentifier : self.wrap.getName
        var nodes = self.wrap.getAllLayerNodes();
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (self.compareNames(getName(nodes[i]), name)) {
                result = nodes[i];
                break;
            }
        }
        return result;
    };

    TC.layer.Raster.prototype.compareNames = function (n1, n2, looseComparison) {
        var result = n1 === n2;
        var self = this;
        var lc = looseComparison !== undefined ? looseComparison : self.ignorePrefixes
        if (!result && lc && n1 && n2) {
            // Revisamos si tienen prefijo. Si lo tiene solo una de las dos lo obviamos para la comparaci\u00f3n
            var idx1 = n1.indexOf(':');
            var idx2 = n2.indexOf(':');
            if (idx1 >= 0 && idx2 < 0) {
                result = n1.substr(idx1 + 1) === n2;
            }
            else if (idx2 >= 0 && idx1 < 0) {
                result = n1 === n2.substr(idx2 + 1);
            }
        }
        return result;
    };

    TC.layer.Raster.prototype.getCapabilitiesPromise = function () {
        return this._capabilitiesPromise;
    };

    TC.layer.Raster.prototype.getResolutions = function () {
        return this.wrap.getResolutions();
    };

    //Devuelve un array de subLayers cuyo nombre o descripci\u00f3n contenga el texto indicado
    //case insensitive
    TC.layer.Raster.prototype.searchSubLayers = function (text) {
        if (text && text.length && text.length >= 3) {
            var self = this;
            var layers = self.wrap.getAllLayerNodes();
            var filter = text.trim().toLowerCase();

            var matches = layers.map(function (ly, ix) {
                delete ly.tcScore;

                ly.tcPosition = ix;

                self.wrap.normalizeLayerNode(ly);

                var title = ly.Title.toLowerCase().trim();
                var titleIx = title.indexOf(filter);
                var abstractIx = -1;
                if (ly.Abstract) {
                    var abs = ly.Abstract.toLowerCase().trim();
                    abstractIx = abs.indexOf(filter);
                }

                if (title == filter)
                    ly.tcScore = 20;
                else if (titleIx == 0)
                    ly.tcScore = 15;
                else if (titleIx > -1)
                    ly.tcScore = 10;
                else if (abstractIx == 0)
                    ly.tcScore = 5;
                else if (abstractIx > -1)
                    ly.tcScore = 1;

                if (ly.tcScore)
                    return ly;
                else
                    return null;
            })
            .filter(function (elto) {
                return elto != null;
            })
            .sort(function (a, b) {
                return b.tcScore - a.tcScore;
            });

            return matches;
        }
        else {
            return [];
        }

    };

    var cleanOgcUrl = function (url) {
        var result = url;
        if (url) {
            var match = url.match(/\??SERVICE=\w+&/i);
            if (match) {
                result = result.replace(match[0], '');
            }
        }
        return result;
    };

    TC.layer.Raster.prototype.getGetMapUrl = function () {
        return cleanOgcUrl(this.wrap.getGetMapUrl());
    };

    TC.layer.Raster.prototype.getPreferredInfoFormat = function () {
        var layer = this;
        var result = null;

        var infoFormats = layer.wrap.getInfoFormats();
        for (var i = 0; i < TC.wrap.layer.Raster.infoFormatPreference.length; i++) {
            var format = TC.wrap.layer.Raster.infoFormatPreference[i];
            if ($.inArray(format, infoFormats) >= 0) {
                result = format;
                break;
            }
        }
        return result;
    };

    /**
     * Carga la imagen de leyenda de una capa por POST.
     */
    TC.layer.Raster.prototype.getLegendGraphicImage = function () {
        var self = this;
        var deferred = $.Deferred();


        //Si ya hemos hecho esta consulta previamente, retornamos la respuesta
        if (self.options.params.base64LegendSrc) {
            return deferred.resolve(self.options.params.base64LegendSrc);
        }

        if (self.options.params.sld_body) {
            if (typeof window.btoa === 'function') {
                var name = self.names[0];
                var info = self.wrap.getInfo(name);
                var xhr = new XMLHttpRequest();
                var url = info.legend[0].src.split('?'); // Separamos los par\u00e1metros de la ra\u00edz de la URL
                var dataEntries = url[1].split("&"); // Separamos clave/valor de cada par\u00e1metro
                var params = "sld_body=" + self.options.params.sld_body;

                for (var i = 0 ; i < dataEntries.length ; i++) {
                    var chunks = dataEntries[i].split('=');

                    if (chunks && chunks.length > 1 && chunks[1]) {
                        params += "&" + dataEntries[i];
                    }
                }
                xhr.open('POST', url[0], true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

                xhr.responseType = 'arraybuffer';
                xhr.onload = function (e) {
                    if (this.status === 200) {
                        var uInt8Array = new Uint8Array(this.response);
                        var i = uInt8Array.length;
                        var binaryString = new Array(i);
                        while (i--) {
                            binaryString[i] = String.fromCharCode(uInt8Array[i]);
                        }
                        var data = binaryString.join('');
                        var type = xhr.getResponseHeader('content-type');
                        if (type.indexOf('image') === 0) {
                            var imageSrc;
                            imageSrc = 'data:' + type + ';base64,' + window.btoa(data);
                            self.options.params.base64LegendSrc = imageSrc; //Cacheamos la respuesta
                            deferred.resolve(imageSrc);
                        }
                    }
                };
                xhr.send(params);
            } else {
                deferred.reject("Funci\u00f3n window.btoa no soportada por el navegador");
            }
        } else {
            deferred.reject("No se ha especificado par\u00e1metro sld_body para la capa " + self.names[0]);
        }
        return deferred.promise();
    };
})();
var esriParser = {
    parse: function (text) {
        var result = [];
        var dom = (new DOMParser()).parseFromString(text, 'text/xml');
        if (dom.documentElement.tagName === 'FeatureInfoResponse') {
            var fiCollections = dom.documentElement.getElementsByTagName('FeatureInfoCollection');
            for (var i = 0, len = fiCollections.length; i < len; i++) {
                var fic = fiCollections[i];
                var layerName = fic.getAttribute('layername');
                var fInfos = fic.getElementsByTagName('FeatureInfo');
                for (var j = 0, lenj = fInfos.length; j < lenj; j++) {
                    var fields = fInfos[j].getElementsByTagName('Field');
                    var attributes = {};
                    for (var k = 0, lenk = fields.length; k < lenk; k++) {
                        var field = fields[k];
                        attributes[getElementText(field.getElementsByTagName('FieldName')[0])] = getElementText(field.getElementsByTagName('FieldValue')[0]);
                    }
                    var feature = new ol.Feature(attributes);
                    feature.setId(layerName + '.' + TC.getUID());
                    result[result.length] = feature;
                }
            }
        }
        return result;
    }
};
TC.layer.Raster.prototype.getWFSCapabilitiesPromise = function () {
    if (typeof (WFSCapabilities) === "undefined") {
        TC.syncLoadJS(TC.apiLocation + 'TC/layer/WFSCapabilitiesParser.js');
    }
    var url = this.options.url.substring(0, this.options.url.lastIndexOf("/wms")
                    || this.options.url.lastIndexOf("/WMS")
                    || this.options.url.lastIndexOf("/"))
                    + "/wfs";
    var defer = $.Deferred();
    var basicUrl = url.substring(url.indexOf("://") < 0 ? 0 : url.indexOf("://") + 3);
    if (TC.WFScapabilities[basicUrl]) {
        setTimeout(function () {
            defer.resolve(TC.WFScapabilities[basicUrl]);
        }, 100);
        return defer;
    }
    var params = {}
    params.SERVICE = 'WFS';
    params.VERSION = '2.0.0';
    params.REQUEST = 'GetCapabilities';
    $.ajax({
        url: TC.proxify(url) + '?' + $.param(params),
        type: 'GET'
    }).then(function () {
        var capabilities = WFSCapabilities.Parse(arguments[0]);
        var _url = (capabilities.Operations.GetCapabilities.DCP && capabilities.Operations.GetCapabilities.DCP.HTTP.Get["xlink:href"]) || capabilities.Operations.GetCapabilities.DCPType[0].HTTP.Get.onlineResource
        TC.WFScapabilities[_url] = capabilities;
        TC.WFScapabilities[basicUrl] = capabilities;
        defer.resolve(WFSCapabilities.Parse(arguments[0]));
    });
    return defer;
};
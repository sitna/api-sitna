TC.layer = TC.layer || {};

if (!TC.Layer) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Layer.js');
}

TC.Consts.BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7';

(function () {
    /*
     *  _getCapabilities: Obtiene el capabilities de la capa layer, y llama a los callback correspondientes
     */
    var _getCapabilities = function (layer, success, error) {
        var serviceUrl = layer.url;
        if (TC.capabilities[serviceUrl]) {
            layer.capabilities = TC.capabilities[serviceUrl];
            layer.url = layer.getGetMapUrl();
            layer._capabilitiesPromise.resolve(/*this.normalizeCapabilities(TC.capabilities[serviceUrl])*/TC.capabilities[serviceUrl]);
            _createLayer(layer);
            return;
        }

        TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
            localforage.getItem(layer.CAPABILITIES_STORE_KEY_PREFIX + serviceUrl)
                .then(function (value) {
                    if (value) {
                        success(value);
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
                type: 'GET'
            });
            return result;
        };

        // Lanzamos la primera petición sin proxificar. Si falla (CORS, HTTP desde HTTPS...) pedimos proxificando.
        getRequest(url).then(success, function (jqXHR, textStatus, errorThrown) {
            getRequest(url, true).then(success, error);
        });
    };

    /*
     *  _createLayer: Crea la capa nativa correspondiente según el tipo
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
            // Las capas se ordenan de arriba a abajo en el árbol, por tanto hay que recorrer la lista del revés
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
     * @param {TC.cfg.LayerOptions} [options] Objeto de opciones de configuración de la capa.
     */
    TC.layer.Raster = function () {
        var _layer = this;

        //esta promise se resolverá cuando el capabilities esté descargado y parseado
        //se utiliza para saber cuándo está listo el capabilities en los casos en los que se instancia el layer pero no se añade al mapa
        //porque la forma habitual de detectar esto es por los eventos del mapa (que en esos casos no saltarán)
        this._capabilitiesPromise = $.Deferred();

        TC.Layer.apply(_layer, arguments);

        _layer.wrap = new TC.wrap.layer.Raster(_layer);

        /**
         * Indica si la capa tiene transparencia.
         * @property transparent
         * @type boolean
         * @default true
         */
        _layer.transparent = (_layer.options.transparent === false) ? false : true;

        /**
         * URL del servicio al que pertenenece la capa.
         * @property url
         * @type string
         */
        _layer.url = _layer.options.url;

        _layer.params = _layer.options.params;
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
        if (typeof _layer.options.layerNames === 'string') {
            _layer.names = _layer.availableNames = _layer.options.layerNames.split(',');
        }
        else {
            _layer.names = [];
            _layer.availableNames = [];
            if ($.isArray(_layer.options.layerNames)) {
                for (var i = 0; i < _layer.options.layerNames.length; i++) {
                    var name = _layer.options.layerNames[i];
                    if (typeof name === 'string') {
                        _layer.names.push(name);
                        _layer.availableNames.push(name);

                    }
                    else if (name.hasOwnProperty('name')) {
                        _layer.availableNames.push(name.name);
                        if (name.isVisible === undefined || name.isVisible) {
                            _layer.names.push(name.name);
                        }
                    }
                }
            } else {
                // Si no se encuentran nombres de capas, se buscan en el parámetro sld_body. Este parámetro es utilizado
                // cuando queremos instanciar una capa pasándole un SLD en la petición
                var sldBody = _layer.options.params ? _layer.options.params.sld_body : null;

                if (sldBody) {
                    var sldBodyToXml = $.parseXML(sldBody);
                    var namedLayerElm = TC.Util.getElementByNodeName(sldBodyToXml, 'sld:NamedLayer');
                    if (namedLayerElm && namedLayerElm.length > 0) {
                        var names = TC.Util.getElementByNodeName(namedLayerElm[0], 'sld:Name');

                        if (names && names.length > 0) {
                            var name = $(names[0]).text();
                            _layer.names.push(name);
                            _layer.availableNames.push(name);
            }
        }
                }
            }
        }

        _layer._capabilitiesNodes = {};

        /**
         * Árbol del documento de capabilities del servicio.
         * @property capabilities
         * @type object
         */
        var _parseCapabilities = function (data, textStatus, jqXHR) {
            var capabilities;
            if (data.documentElement) {

                if ($(data).find("ServiceException").length > 0) {
                    capabilities = { error: $(data).find("ServiceException").text() };
                }
                else {
                    var format = (_layer.type === TC.Consts.layerType.WMTS) ? new _layer.wrap.WmtsParser() : new _layer.wrap.WmsParser();
                    capabilities = format.read(data);

                    //parsear a manija los tileMatrixSetLimits, que openLayers no lo hace (de momento)
                    if (_layer.type === TC.Consts.layerType.WMTS) {
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
            }
            else {
                capabilities = data;
            }


            if (capabilities.error) {
                _capabilitiesError(capabilities.error);

                return;
            }
            // Si existe el capabilities no machacamos, porque provoca efectos indeseados en la gestión de capas.
            // En concreto, se regeneran los UIDs de capas, como consecuencia los controles de la API interpretan como distintas capas que son la misma.
            _layer.capabilities = _layer.capabilities || capabilities;
            var actualUrl = _layer.getGetMapUrl();
            TC.capabilities[_layer.options.url] = TC.capabilities[_layer.options.url] || capabilities;
            TC.capabilities[actualUrl] = TC.capabilities[actualUrl] || capabilities;
            _layer.url = actualUrl;

            _layer._capabilitiesPromise.resolve(/*this.normalizeCapabilities(capabilities)*/capabilities);

            _createLayer(_layer);

            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                localforage.setItem(_layer.CAPABILITIES_STORE_KEY_PREFIX + _layer.options.url, capabilities);
            });

        };

        var _handleCapabilitiesError = function (jqXHR, textStatus, errorThrown) {
            _capabilitiesError(textStatus + '][' + errorThrown);
        };

        var _capabilitiesError = function (reason) {
            var msg = 'No se pudo obtener el documento de capacidades de servicio: [' + reason + ']';
            _layer._capabilitiesPromise.reject(msg);
            TC.error(msg);
            if (_layer.map) {
                _layer.map.$events.trigger($.Event(TC.Consts.event.LAYERERROR, { layer: _layer }));
            }
            _layer.wrap.setLayer(null);
        };

        _getCapabilities(_layer, _parseCapabilities, _handleCapabilitiesError);

        _layer._disgregatedLayerNames = null;

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
     * Se parte de un nodo del árbol de capas del capabilities
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
     * Parámetros: objeto de capa, array of strings, nodo de la capa en el capabilities, booleano que dice si esta rama viene de un nodo visible
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
        var nodeVisible = layer.compareNames(name, nodeName, true);
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
     * Establece los nombres de capas que deben estar visibles en un WMS. Si la lista está vacía, hace invisible la capa.
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
                    // layerNames se fija cuando se añade al mapa o cuando reset = true.
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
     * Añade capas por nombre a las que ya están visibles en el WMS
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
     * Elimina capas por nombre de las que están visibles en el WMS
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
        var layer = this;
        var olLayer = layer.wrap.getLayer();
        if (layer.wrap.isNative(olLayer) && layer.type === TC.Consts.layerType.WMS) {
            if (!layer._disgregatedLayerNames) {
                var layerNames = layer.wrap.getParams().LAYERS;
                layerNames = $.isArray(layerNames) ? layerNames : layerNames.split(',');
                layer._disgregatedLayerNames = _disgregateLayerNames(layer, layerNames);
            }
        }
        else {
            layer._disgregatedLayerNames = layer.names;
        }
        return layer._disgregatedLayerNames.slice();
    };

    TC.layer.Raster.prototype.isCompatible = function (crs) {
        var _layer = this;
        var result = false;
        switch (_layer.type) {
            case TC.Consts.layerType.WMTS:
            case TC.Consts.layerType.WMS:
                result = _layer.wrap.isCompatible(crs);
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
    TC.layer.Raster.prototype.isVisibleByScale = function (nameOrUid) {
        var _layer = this;
        var result;
        var _getOgcScale = function () {
            return _layer.map.wrap.getResolution() / 0.00028; // OGC assumes 0.28 mm / pixel
        };
        var currentScale;
        var i;
        switch (_layer.type) {
            case TC.Consts.layerType.WMTS:
                result = false;
                var tileMatrix = _layer.wrap.getTileMatrix(_layer.options.matrixSet);
                if (tileMatrix) {
                    currentScale = _getOgcScale();
                    for (i = 0; i < tileMatrix.length; i++) {
                        var scaleDenominators = _layer.wrap.getScaleDenominators(tileMatrix[i]);
                        if (scaleDenominators[0] === currentScale) {
                            result = true;
                            break;
                        }
                    }
                }
                break;
            case TC.Consts.layerType.WMS:
                result = true;
                var layers = _layer.wrap.getAllLayerNodes();
                if (layers.length > 0) {
                    currentScale = _getOgcScale();
                    var node;
                    if (typeof nameOrUid === 'number') {
                        node = _layer._capabilitiesNodes[nameOrUid];
                    }
                    else {
                        for (i = 0; i < layers.length; i++) {
                            var layer = layers[i];
                            if (_layer.wrap.getName(layer) == nameOrUid) {
                                node = layer;
                                break;
                            }
                        }
                    }
                    if (node) {
                        var scaleDenominators = _layer.wrap.getScaleDenominators(node);
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
        var _layer = this;
        var result = false;
        switch (_layer.type) {
            case TC.Consts.layerType.WMTS:
                if (_layer.wrap.getWMTSLayer()) {
                    result = true;
                    break;
                }
                break;
            case TC.Consts.layerType.WMS:
                var _getLayerPath = function _getLayerPath(name) {
                    return __getLayerPath(name, _layer.wrap.getRootLayerNode());
                };

                var __getLayerPath = function __getLayerPath(name, capabilitiesNode) {
                    var result = null;
                    var n = _layer.wrap.getName(capabilitiesNode);
                    if (_layer.compareNames(n, name, looseComparison)) {
                        result = [n];
                    }
                    else {
                        var layerNodes = _layer.wrap.getLayerNodes(capabilitiesNode);
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
                        if (_isNameInArray(_layer, path[i], _layer.names, true)) {
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
        var _layer = this;
        var result = _layer.tree;

        var addChild = function (node, child) {
            if (_layer.options.inverseTree) {
                // Versión rápida de unshift
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
                for (var key in _layer._capabilitiesNodes) {
                    if (_layer._capabilitiesNodes[key] === capabilitiesNode) {
                        uid = key;
                        break;
                    }
                }
                if (!uid) {
                    uid = TC.getUID();
                    _layer._capabilitiesNodes[uid] = capabilitiesNode;
                }
                var r = { name: _layer.wrap.getName(capabilitiesNode), title: capabilitiesNode.title || capabilitiesNode.Title, uid: uid, children: [] };
                if (isRootNode) {
                    rootNode = r;
                }

                if (_isNameInArray(_layer, r.name, _layer.availableNames, true)) {
                    forceAddition = true;
                }

                if (!_layer.options.isBase) {
                    if (r === rootNode) {
                        r.isVisible = _layer.getVisibility();
                    }
                    else {
                        r.isVisible = _layer.isVisibleByName(r.name, true);
                    }
                    var i;
                    var layerNodes = _layer.wrap.getLayerNodes(capabilitiesNode);
                    for (i = 0; i < layerNodes.length; i++) {
                        var treeNode = getTreeNode(layerNodes[i], forceAddition);
                        if (treeNode) {
                            addChild(r, treeNode);
                        }
                    }

                    var legend = _layer.wrap.getLegend(capabilitiesNode);
                    if (legend.src) {
                        r.legend = legend;
                    }

                    // No muestra ramas irrelevantes si hideTree = true
                    if (!forceAddition && !isRootNode) {
                        // Eliminamos la rama hasta el nodo de interés
                        rootNode.children = rootNode.children.concat(r.children);
                        r = null;
                    }
                }
                else {
                    r.name = _layer.names.join(',');
                    r.title = _layer.title || r.title;
                    r.isBase = _layer.isDefault;
                    if (_layer.options.thumbnail) {
                        r.legend = { src: _layer.options.thumbnail };
                    }
                }
                return r;
            };

            switch (_layer.type) {
                case TC.Consts.layerType.WMTS:
                    result = getTreeNode(_layer.wrap.getWMTSLayer());
                    break;
                case TC.Consts.layerType.WMS:
                    if (_layer.capabilities) {
                        result = getTreeNode(_layer.wrap.getRootLayerNode(), !_layer.options.hideTree, true);

                        var cache = _layer._cache.visibilityStates;

                        var _setNodeState = function _setNodeState(node) {
                            var _result = TC.Consts.visibility.NOT_VISIBLE;

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
                            return _result;
                        };
                        _setNodeState(result);

                        if (_layer.options.hideTree) {
                            _sortTree(_layer, result);
                        }
                    }
                    break;
                default:
                    break;
            }
            if (!result) {
                result = { name: _layer.name, title: _layer.title };
            }
            result.title = _layer.title || result.title;
            _layer.tree = result;
        }
        return result;
    };

    TC.layer.Raster.prototype.setNodeVisibility = function (id, visible) {
        var _layer = this;
        if (!_layer.tree) {
            _layer.tree = _layer.getTree();
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

        var node = _layer.findNode(id, _layer.tree);
        if (node === _layer.tree) {
            if (visible && _layer.names.length === 0) {
                // Prevent pink error tile
                _layer.addLayerNames(_layer.availableNames).then(function () {
                    _layer.setVisibility(true);
                });
            }
            else {
                _layer.setVisibility(visible);
            }
        }
        else {
            var names = _getNames(node);
            if (visible) {
                _layer.addLayerNames(names);
            }
            else {
                _layer.removeLayerNames(names);
            }
        }
    };

    TC.layer.Raster.prototype.getNodeVisibility = function (id) {
        var _layer = this;
        if (!_layer.tree) {
            _layer.tree = _layer.getTree();
        }
        return _layer._cache.visibilityStates[id];
    };

    TC.layer.Raster.prototype.getNodePath = function (layerName, ignorePrefix) {
        var self = this;
        var result = [];
        var ln = layerName && ignorePrefix ? layerName.substr(layerName.indexOf(':') + 1) : layerName;
        if (self.type === TC.Consts.layerType.WMS && self.capabilities) {
            if (!layerName) {
                layerName = self.names[0];
            }
            var _getPath = function _getPath(node) {
                var res = [];
                var nodeName = self.wrap.getName(node);
                if (nodeName && ignorePrefix) {
                    nodeName = nodeName.substr(nodeName.indexOf(':') + 1);
                }
                if (nodeName === layerName) {
                    res.push(node);
                }
                else {
                    var children = self.wrap.getLayerNodes(node);
                    for (var i = 0; i < children.length; i++) {
                        var r = _getPath(children[i], ln);
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
        var nodes = self.wrap.getAllLayerNodes();
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (self.wrap.getName(nodes[i]) === name) {
                result = nodes[i];
                break;
            }
        }
        return result;
    };

    TC.layer.Raster.prototype.compareNames = function (n1, n2, looseComparison) {
        var result = n1 === n2;
        if (looseComparison && n1 && n2) {
            // Revisamos si tienen prefijo. Si lo tiene solo una de las dos lo obviamos para la comparación
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

    //Devuelve un array de subLayers cuyo nombre o descripción contenga el texto indicado
    //case insensitive
    TC.layer.Raster.prototype.searchSubLayers = function (text) {
        if (text && text.length && text.length >= 3) {
            var _layer = this;
            var layers = _layer.wrap.getAllLayerNodes();
            var filter = text.trim().toLowerCase();

            var matches = layers.map(function (ly, ix) {
                delete ly.tcScore;

                ly.tcPosition = ix;

                _layer.wrap.normalizeLayerNode(ly);

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
                var url = info.legend[0].src.split('?'); // Separamos los parámetros de la raíz de la URL
                var dataEntries = url[1].split("&"); // Separamos clave/valor de cada parámetro
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
                deferred.reject("Función window.btoa no soportada por el navegador");
            }
        } else {
            deferred.reject("No se ha especificado parámetro sld_body para la capa " + self.names[0]);
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
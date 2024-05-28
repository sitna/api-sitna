import TC from '../../TC';
import Util from '../../TC/Util';
import Consts from '../../TC/Consts';
import Cfg from '../../TC/Cfg';
import Layer from '../../SITNA/layer/Layer';
import Vector from './Vector';
TC.layer = TC.layer || {};

Consts.BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7';

const wfsUrlPromises = {};
const describeLayerPromises = {};
const capabilitiesPromises = new Map();
const formatDescriptions = {};
var legendObject = {};
const getMaxExtent = () => [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];

const _getLayerNamePosition = function _getLayerNamePosition(treeNode, name, counter) {
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
};

var _extendLayerNameOptions = function (options) {
    return Util.extend({ aggregate: true, lazy: false }, options);
};

var _combineArray = function (source, add, rem) {
    var result = [];
    var s, a, r;
    s = source ? source : [];
    a = add ? add : [];
    r = rem ? rem : [];
    var sa = s.concat(a);
    for (var i = 0; i < sa.length; i++) {
        if (sa.indexOf(sa[i]) === i && r.indexOf(sa[i]) === -1) {
            result.push(sa[i]);
        }
    }
    return result;
};

var _isNameInArray = function (layer, name, names, looseComparison) {
    return names.some(function (elm) {
        return layer.compareNames(name, elm, looseComparison);
    });
};

const LegendStatusEnum = {
    JSON: "json",
    PNG: "png",
    UNAVAILABLE: "unavailable"
}

const reprojectExtent = function ([minX, minY, maxX, maxY], sourceCrs, targetCrs) {
    const steps = 10;
    const stepWidth = (maxX - minX) / steps;
    const stepHeight = (maxY - minY) / steps;
    const coordinates = [];
    let x, y;
    x = minX;
    var i;
    for (i = 0; i < steps; i++) {
        coordinates.push([x, maxY]);
        x += stepWidth;
    }
    y = maxY
    for (i = 0; i < steps; i++) {
        coordinates.push([maxX, y]);
        y -= stepHeight;
    }
    x = maxX;
    for (i = 0; i < steps; i++) {
        coordinates.push([x, minY]);
        x -= stepWidth;
    }
    y = minY
    for (i = 0; i < steps; i++) {
        coordinates.push([minX, y]);
        y += stepHeight;
    }
    const newCoords = Util.reproject(coordinates, sourceCrs, targetCrs);
    const newXs = newCoords.map(c => c[0]);
    const newYs = newCoords.map(c => c[1]);

    return [
        Math.min(...newXs),
        Math.min(...newYs),
        Math.max(...newXs),
        Math.max(...newYs)
    ];
};

/**
 * Capa de tipo raster, como la de un WMS o un WMTS.
 * @class Raster
 * @memberof SITNA.layer
 * @extends SITNA.layer.Layer
 * @param {SITNA.layer.RasterOptions} [options] Objeto de opciones de configuración de la capa.
 * @see SITNA.Map#getLayer
 */
class Raster extends Layer {
    /**
     * URL del servicio al que pertenenece la capa.
     * @member url
     * @memberof SITNA.layer.Raster
     * @instance
     * @type string
     */

    /*
     * Indica si la capa tiene transparencia.
     * @property transparent
     * @memberof SITNA.layer.Raster
     * @type boolean
     * @default true
     */
    transparent;

    /*
     * Lista de nombres de capa.
     * @property names
     * @memberof SITNA.layer.Raster
     * @type Array.<string>
     * @default []
     */
    names;

    /*
     * Lista de nombres de capa disponibles inicialmente.
     * @property availableNames
     * @memberof SITNA.layer.Raster
     * @type Array.<string>
     * @default []
     */
    availableNames;

    #capabilitiesPromise;
    #wfsLayer = null;//capa WFS de respaldo
    #disgregatedLayerNames;
    #capabilitiesNodes = new Map();
    #newParams;

    constructor() {
        super(...arguments);
        const self = this;

        //esta promise se resolverá cuando el capabilities esté descargado y parseado
        //se utiliza para saber cuándo está listo el capabilities en los casos en los que se instancia el layer pero no se añade al mapa
        //porque la forma habitual de detectar esto es por los eventos del mapa (que en esos casos no saltarán)
        self.#capabilitiesPromise = null;

        self.wrap = new TC.wrap.layer.Raster(self);

        self.transparent = self.options.transparent === false ? false : true;

        self.url = self.options.url;
        self.capabilities = TC.capabilities[self.url];

        self.params = self.options.params;

        if (typeof self.options.layerNames === 'string') {
            self.names = self.availableNames = self.options.layerNames.split(',');
        }
        else {
            self.names = [];
            self.availableNames = [];
            if (Array.isArray(self.options.layerNames)) {
                for (var i = 0; i < self.options.layerNames.length; i++) {
                    const name = self.options.layerNames[i];
                    if (typeof name === 'string') {
                        self.names.push(name);
                        self.availableNames.push(name);

                    }
                    else if (Object.prototype.hasOwnProperty.call(name, 'name')) {
                        self.availableNames.push(name.name);
                        if (name.isVisible === undefined || name.isVisible) {
                            self.names.push(name.name);
                        }
                    }
                }
            } else {
                // Si no se encuentran nombres de capas, se buscan en el parámetro sld_body. Este parámetro es utilizado
                // cuando queremos instanciar una capa pasándole un SLD en la petición
                var sldBody = self.options.params ? self.options.params.sld_body : null;

                if (sldBody) {
                    const parser = new DOMParser();
                    var sldBodyToXml;
                    try {
                        sldBodyToXml = parser.parseFromString(sldBody, 'text/xml');
                    }
                    catch (e) {
                        TC.error(e.message);
                        sldBodyToXml = null;
                    }
                    if (sldBodyToXml) {
                        var namedLayerElm = Util.getElementByNodeName(sldBodyToXml, 'sld:NamedLayer');
                        if (namedLayerElm && namedLayerElm.length > 0) {
                            var names = Util.getElementByNodeName(namedLayerElm[0], 'sld:Name');

                            if (names && names.length > 0) {
                                const name = names[0].textContent;
                                self.names.push(name);
                                self.availableNames.push(name);
                            }
                        }
                    }
                }
            }
        }

        self.ignorePrefixes = self.options.ignorePrefixes === undefined ? true : self.options.ignorePrefixes;

        self.wrap._promise = new Promise(function (resolve, reject) {
            const endCreateLayerFn = function (ollyr) {
                self.wrap.setLayer(ollyr);
                if (ollyr) {
                    resolve(ollyr);
                }
                else {
                    reject(Error('Could not create native layer for "' + self.id + '"'));
                }
            };
            /*
             *  _createOLLayer: Crea la capa nativa correspondiente según el tipo
             */
            const _createOLLayer = function () {
                let ollyr;
                if (!self.wrap.layer) {
                    switch (self.type) {
                        case Consts.layerType.GROUP:
                            endCreateLayerFn(ollyr);
                            break;
                        case Consts.layerType.WMTS:
                            try {
                                ollyr = self.#createWmtsLayer();
                                endCreateLayerFn(ollyr);
                            }
                            catch (_e) {
                                // Ha fallado la creación. Puede que sea por capabilities cacheado obsoleto, 
                                // así que reintentamos online.
                                self.getCapabilitiesOnline().then(function (onlineCapabilities) {
                                    self.capabilities = onlineCapabilities;
                                    try {
                                        ollyr = self.#createWmtsLayer();
                                        endCreateLayerFn(ollyr);
                                    }
                                    catch (e) {
                                        reject(e);
                                    }
                                });
                            }
                            break;
                        default:
                            ollyr = self.#createWmsLayer();
                            endCreateLayerFn(ollyr);
                            break;
                    }
                }
            };

            const processedCapabilities = function (capabilities) {
                // Si existe el capabilities no machacamos, porque provoca efectos indeseados en la gestión de capas.
                // En concreto, se regeneran los UIDs de capas, como consecuencia los controles de la API interpretan como distintas capas que son la misma.
                self.capabilities = self.capabilities || capabilities;

                var actualUrl = self.getGetMapUrl();
                TC.capabilities[self.options.url] = TC.capabilities[self.options.url] || capabilities;
                TC.capabilities[actualUrl] = TC.capabilities[actualUrl] || capabilities;

                _createOLLayer();
            };

            if (self.capabilities) {
                processedCapabilities(self.capabilities);
                self.#capabilitiesPromise = Promise.resolve(self.capabilities);
                return;
            }

            self.#capabilitiesPromise = capabilitiesPromises.get(self.url) || new Promise(function (res, rej) {
                const onlinePromise = self.getCapabilitiesOnline();
                const storagePromise = self.getCapabilitiesFromStorage();

                onlinePromise
                    .then(function (capabilities) {
                        res(capabilities);
                    })
                    .catch(function (error) {
                        storagePromise.catch(function () {
                            rej(error);
                        });
                    });

                storagePromise
                    .then(function (capabilities) {
                        res(capabilities);
                    })
                    .catch(function () {
                        onlinePromise.catch(function (error) {
                            rej(error);
                        });
                    });
            });
            capabilitiesPromises.set(self.url, self.#capabilitiesPromise);

            self.getCapabilitiesPromise()
                .then(function (capabilities) {
                    processedCapabilities(capabilities);
                })
                .catch(function (error) {
                    if (self.map) {
                        self.map.trigger(Consts.event.LAYERERROR, { layer: self, reason: 'couldNotGetCapabilities' });
                    }
                    reject(error);
                });
        });

        self.#disgregatedLayerNames = null;

        if (Consts.layerType.WMTS === self.type) {
            self.wrap.setWMTSUrl();
        }
    }

    #createWmsLayer() {
        const self = this;
        const layerNames = Array.isArray(self.names) ? self.names.join(',') : self.names;
        const format = self.format;
        const options = self.options;

        var params = {
            LAYERS: layerNames,
            FORMAT: format,
            TRANSPARENT: self.transparent,
            VERSION: self.capabilities.version || '1.3.0'
        };

        if (self.params) {
            Util.extend(params, self.params);
        }

        if (self.queryParams) {
            Util.extend(params, self.queryParams);
        }

        var infoFormat = self.getPreferredInfoFormat();
        if (infoFormat !== null) {
            params.INFO_FORMAT = infoFormat;
        }
        //filtro GML o CQL
        if (options.filter) {
            //primero miramos si es un objeto TC.filter
            if (options.filter instanceof TC.filter.Filter) {
                params.filter = options.filter.getText();
            }
            //se puede parsear a XML, asumimos que es GML
            else if (!new DOMParser().parseFromString(options.filter, 'text/xml').querySelector("parsererror")) {
                params.filter = options.filter;
            }
            //Si no, asumimos que es CQL
            else {
                params.cql_filter = options.filter;
            }
        }

        return self.wrap.createWMSLayer(self.getGetMapUrl(), params, options);
    }

    #createWmtsLayer() {
        const self = this;
        return self.wrap.createWMTSLayer(self.options);
    }

    setVisibility(visible) {
        const self = this;
        self.tree = null;
        super.setVisibility.call(self, visible);
    }

    /*
     *  #aggregateLayerNames: devuelve un array de nombres de capa WMS sustituyendo en la medida de lo posible capas por las capas de grupo que las contienen
     */
    #aggregateLayerNames(layerNames) {
        const self = this;
        if (self.type !== Consts.layerType.WMS) {
            return layerNames;
        }
        else {
            var ln = layerNames.slice();
            self.#aggregateLayerNodeNames(ln, self.wrap.getRootLayerNode());
            return ln;
        }
    }

    /*
     *  #aggregateLayerNodeNames: Agrega el array de nombres de capa WMS sustituyendo en la medida de lo posible capas por las capas de grupo que las contienen.
     * Se parte de un nodo del árbol de capas del capabilities
     */
    #aggregateLayerNodeNames(names, layerNode) {
        const self = this;
        var result = false;
        var children = self.wrap.getLayerNodes(layerNode);
        if (children.length) {
            children.forEach(child => {
                if (self.#aggregateLayerNodeNames(names, child)) {
                    result = true;
                }
            });

            var nodeNames = children.map(function (elm) {
                return self.wrap.getName(elm);
            }).reverse();
            var idx, firstIdx;
            var fail = false;

            firstIdx = idx = names.indexOf(nodeNames[0]);
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
                var nodeName = self.wrap.getName(layerNode);
                if (nodeName && nodeNames.length > 1) {
                    names.splice(firstIdx, nodeNames.length, nodeName);
                    result = true;
                }
            }
        }
        return result;
    }

    /*
     *  #disgregateLayerNames: devuelve un array de nombres de capa WMS con solo capas hoja.
     * Parámetros: objeto de capa, array of strings, nodo de la capa en el capabilities, booleano que dice si esta rama viene de un nodo visible
     */
    #disgregateLayerNames(layerNames) {
        const self = this;
        let result = [];
        const ln = layerNames.slice();
        const rootNode = self.wrap.getRootLayerNode();
        for (var i = 0, len = ln.length; i < len; i++) {
            result = result.concat(self.#disgregateLayerName(ln[i], rootNode));
        }
        return result;
    }

    #disgregateLayerName(name, layerNode, ancestorVisible) {
        const self = this;
        let result = [];
        const nodeName = self.wrap.getName(layerNode);
        const nodeVisible = self.compareNames(name, nodeName);
        let hasEmptyChildren = false;
        const children = self.wrap.getLayerNodes(layerNode);
        for (var i = 0; i < children.length; i++) {
            var names = self.#disgregateLayerName(name, children[i], ancestorVisible || nodeVisible);
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
    }

    /*
     *  getLimitedMatrixSet: devuelve un array de tileMatrixSets limitados por su correspondiente TileMatrixSetLimits (si es que lo tiene)
     */
    getLimitedMatrixSet() {
        const self = this;
        const layerId = self.layerNames;
        const matrixSetId = self.matrixSet;
        var capabilities = self.capabilities;

        const tileMatrixSet = capabilities.Contents.TileMatrixSet.find(elm => elm.Identifier === matrixSetId);

        if (tileMatrixSet) {
            const layerNode = capabilities.Contents.Layer.find(elm => elm.Identifier === layerId);
            if (layerNode.TileMatrixSetLink) {
                const tileMatrixSetLink = layerNode.TileMatrixSetLink.find(elm => elm.TileMatrixSet === matrixSetId);
                if (tileMatrixSetLink && tileMatrixSetLink.TileMatrixSetLimits && tileMatrixSetLink.TileMatrixSetLimits.length) {
                    const ret = [];
                    tileMatrixSetLink.TileMatrixSetLimits.forEach(function (tileMatrixSetLimit) {
                        const matrix = tileMatrixSet.TileMatrix.find(elm => elm.Identifier === tileMatrixSetLimit.TileMatrix);
                        if (matrix) {
                            ret.push(Util.extend({ matrixIndex: tileMatrixSet.TileMatrix.indexOf(matrix) }, matrix, tileMatrixSetLimit));
                        }
                    });
                    return ret;
                }
                else {
                    return tileMatrixSet.TileMatrix;
                }
            }
            else {
                return tileMatrixSet.TileMatrix;
            }
        }
        return null;
    }

    /*
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
    async setLayerNames(layerNames, options) {
        const self = this;
        await self.wrap.getLayer();
        let ln = Array.isArray(layerNames) ? layerNames : layerNames.split(',');
        self.names = ln;
        var opts = _extendLayerNameOptions(options);
        if (opts.aggregate) {
            ln = self.#aggregateLayerNames(ln);
        }
        self.#disgregatedLayerNames = null;
        var newParams = {
            LAYERS: ln.join(','), TRANSPARENT: true
        };
        if (opts.lazy) {
            var params = self.#newParams || self.wrap.getParams();
            self.#newParams = Util.extend(params, newParams);
        }
        else {
            if (self.map) {
                self.map.trigger(Consts.event.BEFOREUPDATEPARAMS, { layer: self });
            }
            self.tree = null;
            self.wrap.setParams(newParams);
            if (opts.reset || !self.map) {
                // layerNames se fija cuando se añade al mapa o cuando reset = true.
                self.availableNames = self.names;
            }
            if (self.map) {
                self.map.trigger(Consts.event.UPDATEPARAMS, { layer: self });
            }
        }
        return self.names;
    }

    /*
     * Establece el atributo filter o CQL_filter de una capa WMS.
     * @method setFilter
     * @param {TC.filter.Filter|string} filter Objeto de tipo TC.filter.Filter, un filtro GML como cadena de texto o filtro CQL como cadena de texto
     */
    /*
     *  setFilter: sets the filter or CQL_filter attribute on WMS layer
     *  Parameters: object instance of  TC.filter.Filter or a GML filter string
     */
    async setFilter(filter) {
        const self = this;
        await self.wrap.getLayer();
        var oldParams = self.wrap.getParams();
        delete oldParams.filter;
        delete oldParams.cql_filter;

        //if (self.map) {
        //    self.map.trigger(Consts.event.BEFOREUPDATEPARAMS, { layer: self });
        //}

        //primero miramos si es un objeto TC.filter
        if (filter instanceof TC.filter.Filter) {
            self.filter = oldParams.filter = filter.getText();
        }
        //se puede parsear a XML, asumimos que es GML
        else if (!new DOMParser().parseFromString(filter, 'text/xml').querySelector("parsererror")) {
            self.filter = oldParams.filter = filter;
        }
        //Si no, asumimos que es CQL
        else {
            self.filter = oldParams.cql_filter = filter;
        }
        self.wrap.setParams(oldParams);

        //if (self.map) {
        //    self.map.trigger(Consts.event.UPDATEPARAMS, { layer: self });
        //}

        return filter;
    }


    #sortLayerNames(layerNames) {
        const self = this;
        var ln = typeof layerNames === 'string' ? layerNames.split(',') : layerNames;
        if (self.capabilities) {
            self.tree = null;
            var tree = self.getTree();
            ln.sort(function (a, b) {
                var idxa = {
                    count: 0
                };
                var idxb = {
                    count: 0
                };
                _getLayerNamePosition(tree, a, idxa);
                _getLayerNamePosition(tree, b, idxb);
                return idxb.count - idxa.count;
            });
        }
        return ln;
    }

    /*
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
    async addLayerNames(layerNames, options) {
        const self = this;
        await self.wrap.getLayer();
        const opts = _extendLayerNameOptions(options);
        let ln2a = Array.isArray(layerNames) ? layerNames : layerNames.split(',');
        let ln = self.wrap.getParams().LAYERS ? self.wrap.getParams().LAYERS.split(',') : [];
        if (opts.aggregate) {
            ln2a = self.#disgregateLayerNames(ln2a);
            ln = self.getDisgregatedLayerNames();
        }
        const names = await self.setLayerNames(self.#sortLayerNames(_combineArray(ln, ln2a, null)), options);
        return names;
    }

    /*
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
    async removeLayerNames(layerNames, options) {
        const self = this;
        await self.wrap.getLayer();
        const opts = _extendLayerNameOptions(options);
        let ln2r = Array.isArray(layerNames) ? layerNames : layerNames.split(',');
        let ln = self.wrap.getParams().LAYERS;
        if (opts.aggregate) {
            ln2r = self.#disgregateLayerNames(ln2r);
            ln = self.getDisgregatedLayerNames();
        }
        const names = await self.setLayerNames(self.#sortLayerNames(_combineArray(ln, null, ln2r)), options);
        return names;
    }

    /*
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
    async toggleLayerNames(layerNames, options) {
        const self = this;
        await self.wrap.getLayer();
        const opts = _extendLayerNameOptions(options);
        let ln2t = Array.isArray(layerNames) ? layerNames : layerNames.split(',');
        let currentLayerNames = self.wrap.getParams().LAYERS;
        if (opts.aggregate) {
            ln2t = self.#disgregateLayerNames(ln2t);
            currentLayerNames = self.getDisgregatedLayerNames();
        }
        const ln2a = [];
        const ln2r = [];
        for (var i = 0; i < ln2t.length; i++) {
            var l = ln2t[i];
            if (currentLayerNames.indexOf(l) < 0) {
                ln2a.push(l);
            }
            else {
                ln2r.push(l);
            }
        }
        var promises = [];
        if (ln2a.length > 0) {
            promises.push(self.addLayerNames(ln2a, opts));
        }
        if (ln2r.length > 0) {
            promises.push(self.removeLayerNames(ln2r, opts));
        }
        const arrays = await Promise.all(promises);
        const a1 = arrays[0];
        const a2 = arrays[1];
        if (a1) {
            if (a2) {
                return a1.concat(a2);
            }
            else {
                return a1;
            }
        }
        else {
            return [];
        }
    }

    /*
     * Devuelve la lista de nombres de capa WMS hoja correspondientes a las capas visibles.
     * @method getDisgregatedLayerNames
     * @return {array}
     */
    /*
     *  getDisgregatedLayerNames: returns an array of visible WMS leaf layer names
     */
    getDisgregatedLayerNames() {
        const self = this;
        const olLayer = self.wrap.layer;
        if (self.wrap.isNative(olLayer) && self.type === Consts.layerType.WMS) {
            if (!self.#disgregatedLayerNames) {
                var layerNames = self.wrap.getParams().LAYERS;
                layerNames = Array.isArray(layerNames) ? layerNames : layerNames.split(',');
                self.#disgregatedLayerNames = self.#disgregateLayerNames(layerNames);
            }
        }
        else {
            self.#disgregatedLayerNames = self.names;
        }
        return self.#disgregatedLayerNames.slice();
    }

    isValidFromNames() {
        const self = this;
        for (var i = 0, len = self.names.length; i < len; i++) {
            if (!self.getLayerNodeByName(self.names[i])) {
                return false;
            }
        }
        return true;
    }

    isCompatible(crs) {
        const self = this;
        switch (self.type) {
            case Consts.layerType.WMTS:
                return self.wrap.isCompatible(crs) || self.wrap.getCompatibleMatrixSets(crs).length > 0;
            case Consts.layerType.WMS:
                return self.wrap.isCompatible(crs);
            default:
                break;
        }
        return false;
    }

    getCompatibleCRS(options = {}) {
        const self = this;
        let result = self.wrap.getCompatibleCRS();
        if (options.includeFallback && self.fallbackLayer) {
            const fbLayer = self.getFallbackLayer();
            if (fbLayer instanceof Layer) {
                result = result.concat(fbLayer.wrap.getCompatibleCRS());
            }
        }
        if (options.normalized) {
            result = result
                .map(function (crs) {
                    return Util.getCRSCode(crs);
                }) // códigos numéricos
                .filter(function (code) {
                    return code !== null;
                })
                .reduce(function (prev, cur) {
                    if (prev.indexOf(cur) < 0) {
                        prev.push(cur);
                    }
                    return prev;
                }, []) // códigos numéricos sin duplicados
                .map(function (code) {
                    return 'EPSG:' + code;
                }); // códigos normalizados
        }
        return result;
    }

    getProjection() {
        const self = this;

        switch (self.type) {
            case Consts.layerType.WMTS:
                return self.wrap.layer.getSource().getProjection().getCode();
            case Consts.layerType.WMS:
                return self.map.crs;
        }
    }

    setProjection(options = {}) {
        const self = this;
        if (options.crs) {
            switch (self.type) {
                case Consts.layerType.WMTS:
                    var matrixSet = self.wrap.getCompatibleMatrixSets(options.crs)[0];
                    if (matrixSet) {
                        self.matrixSet = matrixSet;
                        self.wrap.setMatrixSet(matrixSet);
                    }
                    else {
                        self.wrap.setProjection(options);
                    }
                    self.mustReproject = !matrixSet;
                    break;
                case Consts.layerType.WMS:
                    self.wrap.setProjection(options);
                    self.mustReproject = !self.isCompatible(options.crs);
                    break;
                default:
                    break;
            }
        }
    }

    /*
     *  isVisibleByScale: return wether the WMS layer is visible at current scale
     *  Parameter: WMS layer name or UID
     */

    getOgcScale = function () {
        const self = this;
        return self.map.wrap.getResolution() * self.map.getMetersPerUnit() / 0.00028; // OGC assumes 0.28 mm / pixel
    };


    isVisibleByScale(nameOrUid, looseComparison) {
        const self = this;
        let result;

        var currentScale;
        var i;
        switch (self.type) {
            case Consts.layerType.WMTS:
                result = false;
                var tileMatrix = self.wrap.getTileMatrix(self.options.matrixSet);
                if (tileMatrix) {
                    currentScale = self.getOgcScale();
                    for (i = 0; i < tileMatrix.length; i++) {
                        const scaleDenominators = self.wrap.getScaleDenominators(tileMatrix[i]);
                        if (scaleDenominators[0] === currentScale) {
                            result = true;
                            break;
                        }
                    }
                }
                break;
            case Consts.layerType.WMS:
                result = true;
                var layers = self.wrap.getAllLayerNodes();
                if (layers.length > 0) {
                    currentScale = self.getOgcScale();
                    var node;
                    if (parseInt(nameOrUid).toString() === nameOrUid) { // Es numérico, asumimos que es un UID
                        node = self.#capabilitiesNodes.get(nameOrUid);
                    }
                    if (!node) {
                        node = layers.find(layer => self.compareNames(self.wrap.getName(layer), nameOrUid, looseComparison));
                    }
                    const isNodeVisibleByScale = function (node) {
                        const scaleDenominators = self.wrap.getScaleDenominators(node);
                        return !(parseFloat(scaleDenominators[1]) > currentScale || parseFloat(scaleDenominators[0]) < currentScale);
                    };
                    if (node) {
                        result = isNodeVisibleByScale(node);

                        // GLS: si no es visible miramos si tiene capas hijas y si tiene comprobamos si alguna de ellas es visible a la escala actual.
                        if (!result) {
                            if (node.Layer && node.Layer.length > 0) {
                                return node.Layer.some(isNodeVisibleByScale);
                            }
                        }
                    }
                }
                break;
            default:
                result = true;
                break;
        }
        return result;
    }

    /*
     *  isVisibleByName: return wether the WMS layer is visible because of the requested layer names
     *  Parameter: WMS layer name
     */
    isVisibleByName(name, looseComparison) {
        const self = this;
        let result = false;
        switch (self.type) {
            case Consts.layerType.WMTS:
                if (self.wrap.getWMTSLayer()) {
                    result = true;
                    break;
                }
                break;
            case Consts.layerType.WMS: {
                const getPathLayerNames = function getPathLayerNames(name) {
                    return getPathLayerNamesForNode(name, self.wrap.getRootLayerNode());
                };

                const getPathLayerNamesForNode = function getPathLayerNamesForNode(name, capabilitiesNode) {
                    let result = [];
                    const n = self.wrap.getName(capabilitiesNode);
                    if (self.compareNames(n, name, looseComparison)) {
                        result.push(n);
                    }
                    else {
                        const layerNodes = self.wrap.getLayerNodes(capabilitiesNode);
                        let mustPushName = false;
                        layerNodes.forEach(item => {
                            const r = getPathLayerNamesForNode(name, item);
                            if (r.length) {
                                mustPushName = true;
                                result = result.concat(r);
                            }
                        });
                        if (mustPushName) {
                            result.push(n);
                        }
                    }
                    return result;
                };

                result = getPathLayerNames(name).some(n => _isNameInArray(self, n, self.names));
                break;
            }
            default:
                result = true;
                break;
        }
        return result;
    }

    isVisibleByNode(node) {
        const self = this;
        let result = false;
        switch (self.type) {
            case Consts.layerType.WMTS:
                if (self.wrap.getWMTSLayer()) {
                    result = true;
                    break;
                }
                break;
            case Consts.layerType.WMS: {
                const isChildOrItself = function (potentialParent, potentialChild) {
                    if (potentialParent === potentialChild) {
                        return true;
                    }
                    return potentialParent.Layer && potentialParent.Layer.some(child => isChildOrItself(child, potentialChild));
                };
                for (var i = 0, ii = self.names.length; i < ii; i++) {
                    const nodes = self.getLayerNodesByName(self.names[i]);
                    if (nodes.some(n => isChildOrItself(n, node))) {
                        result = true;
                        break;
                    }
                }
                break;
            }
            default:
                result = true;
                break;
        }
        return result;
    }

    #getLayerNodeIndex(treeNode) {
        const self = this;
        var result = self.availableNames.indexOf(treeNode.name);
        if (result === -1) {
            for (var i = 0, len = treeNode.children.length; i < len; i++) {
                result = self.#getLayerNodeIndex(treeNode.children[i]);
                if (result !== -1) {
                    break;
                }
            }
        }
        return result;
    }

    #sortTree(treeNode) {
        const self = this;
        var _sortFunction = function (n1, n2) {
            return self.#getLayerNodeIndex(n2) - self.#getLayerNodeIndex(n1);
        };
        treeNode.children.sort(_sortFunction);
        for (var i = 0, len = treeNode.children.length; i < len; i++) {
            self.#sortTree(treeNode.children[i]);
        }
    }

    #isNameInPath(node) {
        const self = this;
        //return self.getDisgregatedLayerNames().some(name => self.getBranch(name).some(step => step === node));
        return self.getDisgregatedLayerNames().some(name => self.getNodePath(name).some(step => step.Name === node || (!step.Name & step.Title === node)));
    }

    //17/02/2022 URI Se Obtiene la ramas ramas 
    getNestedTree() {
        const self = this;
        return self.getTree(false, true);
    }

    //29/10/2021 URI Obtiene el arbol completo del capabilities de una capa sin modificar el hideTree de la capa ni modificar la propiedad tree del arbol
    getFullTree() {
        const self = this;
        return self.getTree(true);
    }

    //29/10/2021 URI Relaccionado con la función anterior (getFullTree), añado un parametro mas para que no haga caso a la opción hideTree del arbol y que no guarde el
    //resultado en un variable del objeto capa
    getTree(fullTree, nested = false) {
        const self = this;
        if (fullTree === undefined) {
            fullTree = !self.hideTree;
        }
        var result = fullTree || nested ? false : self.tree;

        var addChild = function (node, child) {
            child.parent = node;
            if (self.options.inverseTree) {
                // Versión rápida de unshift
                Util.fastUnshift(node.children, child);
            }
            else {
                node.children.push(child);
            }
        };

        if (!result) {
            let rootNode;
            const getTreeNode = function getTreeNode(capabilitiesNode, forceAddition, isRootNode, nested) {
                let uid;
                for (var key of self.#capabilitiesNodes.keys()) {
                    if (self.#capabilitiesNodes.get(key) === capabilitiesNode) {
                        uid = key;
                        break;
                    }
                }
                if (!uid) {
                    uid = TC.getUID();
                    self.#capabilitiesNodes.set(uid, capabilitiesNode);
                }
                let rslt = {
                    name: self.wrap.getName(capabilitiesNode),
                    title: capabilitiesNode.title || capabilitiesNode.Title,
                    uid: uid,
                    children: [],
                    abstract: !!capabilitiesNode.Abstract,
                    metadata: !!capabilitiesNode.MetadataURL
                };
                if (isRootNode) {
                    rootNode = rslt;
                }

                if (_isNameInArray(self, rslt.name, self.availableNames))
                    forceAddition = true;
                if (nested) {
                    if (isRootNode || (self.#isNameInPath(rslt.name || rslt.title))) {
                        forceAddition = true;
                    }
                    else {
                        return null;
                    }
                }

                if (!self.options.isBase) {
                    if (rslt === rootNode) {
                        rslt.isVisible = self.getVisibility();
                    }
                    else {
                        rslt.isVisible = self.isVisibleByName(rslt.name);
                        //rslt.isVisible = self.isVisibleByNode(capabilitiesNode);
                    }
                    var i;
                    var layerNodes = self.wrap.getLayerNodes(capabilitiesNode);
                    for (i = 0; i < layerNodes.length; i++) {
                        const treeNode = getTreeNode(layerNodes[i], forceAddition, undefined, nested);
                        if (treeNode) {
                            addChild(rslt, treeNode);
                        }
                    }

                    rslt.legend = self.wrap.getLegend(capabilitiesNode);

                    // No muestra ramas irrelevantes si hideTree = true
                    if (!forceAddition && !isRootNode) {
                        // Eliminamos la rama hasta el nodo de interés
                        rootNode.children = rootNode.children.concat(rslt.children);
                        rslt = null;
                    }
                }
                else {
                    rslt.name = self.names.join(',');
                    rslt.title = self.title || rslt.title;
                    rslt.isBase = self.isDefault;
                    if (self.options.thumbnail) {
                        rslt.legend = [{
                            src: self.options.thumbnail
                        }];
                    }
                }
                return rslt;
            };

            switch (self.type) {
                case Consts.layerType.WMTS:
                    result = getTreeNode(self.wrap.getWMTSLayer(), !self.hideTree, true);
                    break;
                case Consts.layerType.WMS:
                    if (self.capabilities) {
                        result = getTreeNode(self.wrap.getRootLayerNode(),
                            !fullTree ? !self.hideTree : fullTree, true, nested);

                        var _setNodeState = function _setNodeState(node) {
                            let rslt = Consts.visibility.NOT_VISIBLE;
                            if (node) {
                                if (node.children) {
                                    for (var i = 0, len = node.children.length; i < len; i++) {
                                        var nState = _setNodeState(node.children[i]);
                                        if (nState === Consts.visibility.VISIBLE ||
                                            nState === Consts.visibility.HAS_VISIBLE) {
                                            rslt = Consts.visibility.HAS_VISIBLE;
                                            break;
                                        }
                                    }
                                }
                                if (node.isVisible &&
                                    ((node === rootNode && self.layerNames && self.layerNames.length && node.isVisible)
                                        ||
                                        node !== rootNode)) {
                                    rslt = Consts.visibility.VISIBLE;
                                }
                                node.visibilityState = rslt;
                            }
                            return rslt;
                        };
                        _setNodeState(result);

                        if (self.hideTree) {
                            self.#sortTree(result);
                        }
                    }
                    break;
                default:
                    break;
            }
            if (!result) {
                result = {
                    name: self.name, title: self.title
                };
            }
            result.title = self.title || result.title;
            result.customLegend = self.customLegend || result.customLegend;
            if (!fullTree) {
                self.tree = result;
            }
        }
        return result;
    }

    setNodeVisibility(id, visible) {
        const self = this;
        const parentFn = super.setNodeVisibility;
        const nodes = [];
        id = Array.isArray(id) ? id : [id];
        id.forEach(function (id) {
            nodes.push(parentFn.call(self, id, visible));
        });

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

        if (nodes.some((node) => self.isRoot(node))) {
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
            var names = nodes.map(node => { return _getNames(node) }).join(",");
            if (visible) {
                self.addLayerNames(names);
            }
            else {
                self.removeLayerNames(names);
            }
        }
        return nodes.length > 1 ? nodes : nodes[0];
    }

    getNodePath(layerName, ignorePrefix) {
        const self = this;
        let result = [];
        if (self.type === Consts.layerType.WMS && self.capabilities) {
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
                            Util.fastUnshift(res, node);
                            break;
                        }
                    }
                }
                return res;
            };
            result = _getPath(self.wrap.getRootLayerNode());
        }
        return result;
    }

    getPath(layerName, ignorePrefix) {
        return this.getNodePath(layerName, ignorePrefix).map(function (node) {
            return node.title || node.Title;
        });
    }

    getLayerNodesByName(name) {
        const result = [];
        const self = this;
        const getName = self.wrap.getServiceType() === Consts.layerType.WMTS ? self.wrap.getIdentifier : self.wrap.getName;
        const nodes = self.wrap.getAllLayerNodes();
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (self.compareNames(getName(nodes[i]), name)) {
                result.push(nodes[i]);
            }
        }
        return result;
    }

    getLayerNodeByName(name) {
        const self = this;
        const nodes = self.getLayerNodesByName(name);
        if (nodes.length) {
            return nodes[0];
        }
        return null;
    }

    getChildrenLayers(layer) {
        const result = [];
        const recursiveFn = function (lyr, arr) {
            if (lyr && lyr.Layer && lyr.Layer.length) {
                for (var i = 0; i < lyr.Layer.length; i++) {
                    arr.push(lyr.Layer[i]);
                    recursiveFn(lyr.Layer[i], arr);
                }
            }
        };
        recursiveFn(layer, result);
        return result;
    }

    compareNames(n1, n2, looseComparison) {
        const self = this;
        let result = n1 === n2;
        const lc = looseComparison !== undefined ? looseComparison : self.ignorePrefixes;
        if (!result && lc && n1 && n2) {
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
    }

    getCapabilitiesPromise() {
        return this.#capabilitiesPromise;
    }

    getResolutions() {
        return this.wrap.getResolutions();
    }

    setResolutions(resolutions) {
        this.wrap.setResolutions(resolutions);
    }

    getExtent(options = {}) {
        const self = this;
        let extent = null;
        const isGeo = self.map?.wrap.isGeo();

        if (self.type === Consts.layerType.WMS) {
            const mapCrs = options.crs || self.map?.getCRS() || 'EPSG:4326';
            const mapCrsCode = Util.getCRSCode(mapCrs);

            const getNodeBoundingBoxes = function (node) {
                let bboxes = null;
                let hasOwnBBox = false;
                if (node.BoundingBox) {
                    bboxes = Array.isArray(node.BoundingBox) ? node.BoundingBox : [node.BoundingBox];
                    const crsBboxes = bboxes.filter(bbox => Util.getCRSCode(bbox.crs) === mapCrsCode);
                    if (crsBboxes.length) {
                        hasOwnBBox = true;
                        bboxes = crsBboxes;
                    }
                }
                if (!bboxes && !(node.EX_GeographicBoundingBox && isGeo) && node.parent) {
                    bboxes = getNodeBoundingBoxes(node.parent);
                }
                if (self.capabilities.version === '1.3.0' && bboxes) {
                    // En WMS 1.3.0 las coordenadas de EPSG:4326 están en formato neu en vez de enu
                    // Cambiamos el orden
                    bboxes = bboxes.map(function (bbox) {
                        if (bbox.crs === 'EPSG:4326') {
                            const prevExtent = bbox.extent;
                            return {
                                crs: bbox.crs,
                                extent: [prevExtent[1], prevExtent[0], prevExtent[3], prevExtent[2]]
                            };
                        }
                        else if (bbox.crs === 'CRS:84') {
                            return {
                                crs: 'EPSG:4326',
                                extent: bbox.extent
                            };
                        }
                        return bbox;
                    });
                    if (!hasOwnBBox && isGeo && node.EX_GeographicBoundingBox) {
                        bboxes.unshift({
                            crs: 'EPSG:4326',
                            extent: node.EX_GeographicBoundingBox
                        });
                    }
                }
                return bboxes;
            }

            const boundingBoxes = new Array(self.names.length);
            for (var i = 0, ii = boundingBoxes.length; i < ii; i++) {
                const node = self.getLayerNodeByName(self.names[i]);
                if (!node) return null;
                const bboxes = getNodeBoundingBoxes(node);
                if (!bboxes) {
                    return null;
                }
                boundingBoxes[i] = bboxes;
            }

            const boxIntersections = boundingBoxes
                .map(function getBestBbox(bboxes) {
                    const result = {};
                    let firstBbox, crsBbox;
                    bboxes.forEach(function (bbox, idx) {
                        if (idx === 0) {
                            firstBbox = bbox;
                        }
                        if (Util.getCRSCode(bbox.crs) === mapCrsCode) {
                            crsBbox = bbox;
                        }
                    });
                    if (crsBbox) {
                        result.crs = mapCrs;
                        result.extent = crsBbox.extent;
                    }
                    else {
                        result.crs = firstBbox.crs;
                        result.extent = firstBbox.extent;
                    }
                    return result;
                })
                .reduce(function combineBoundingBoxesByCrs(acc, bboxObj) {
                    let accExtent = acc.get(bboxObj.crs);
                    const curExtent = bboxObj.extent;
                    if (accExtent) {
                        accExtent[0] = Math.min(accExtent[0], curExtent[0]);
                        accExtent[1] = Math.min(accExtent[1], curExtent[1]);
                        accExtent[2] = Math.max(accExtent[2], curExtent[2]);
                        accExtent[3] = Math.max(accExtent[3], curExtent[3]);
                    }
                    else {
                        accExtent = curExtent;
                    }
                    acc.set(bboxObj.crs, accExtent);
                    return acc;
                }, new Map());
            const hasOwnBBox = Array.from(boxIntersections.keys()).some((crs) => Util.getCRSCode(crs) === mapCrsCode);
            if (hasOwnBBox) {
                extent = getMaxExtent();
                boxIntersections
                    .forEach(function combineExtent(ext, crs) {
                        if (Util.getCRSCode(crs) === mapCrsCode) {
                            extent[0] = Math.min(ext[0], extent[0]);
                            extent[1] = Math.min(ext[1], extent[1]);
                            extent[2] = Math.max(ext[2], extent[2]);
                            extent[3] = Math.max(ext[3], extent[3]);
                        }
                    });
            }
            else if (isGeo) {
                extent = getMaxExtent();
                boxIntersections
                    .forEach(function combineExtent(ext, crs) {
                        if (TC.getProjectionData({ crs, sync: true }).unit?.startsWith('degree')) {
                            const geoExtent = reprojectExtent(ext, crs, mapCrs);
                            extent[0] = Math.min(geoExtent[0], extent[0]);
                            extent[1] = Math.min(geoExtent[1], extent[1]);
                            extent[2] = Math.max(geoExtent[2], extent[2]);
                            extent[3] = Math.max(geoExtent[3], extent[3]);
                        }
                    });
            }
        }
        else if (self.type === Consts.layerType.WMTS) {
            const layerName = self.names[0];
            const layerNode = self
                .capabilities
                .Contents
                .Layer
                .find(l => l.Identifier === layerName);
            if (layerNode) {
                const matrixSetNode = self
                    .capabilities
                    .Contents
                    .TileMatrixSet
                    .find(tms => tms.Identifier === self.matrixSet);
                if (matrixSetNode) {
                    if (layerNode.BoundingBox || (isGeo && layerNode.WGS84BoundingBox)) {
                        let boundingBox;
                        if (Array.isArray(layerNode.BoundingBox)) {
                            boundingBox = layerNode.BoundingBox.find(bbox => Util.CRSCodesEqual(bbox.crs, matrixSetNode.SupportedCRS));
                        }
                        else {
                            boundingBox = layerNode.BoundingBox;
                        }
                        if (boundingBox) {
                            const stringToNumberArray = str => {
                                return str.split(' ').map(v => parseFloat(v));
                            };
                            const bottomLeft = stringToNumberArray(boundingBox.LowerCorner);
                            const topRight = stringToNumberArray(boundingBox.UpperCorner);
                            extent = [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]];
                        }
                        if (!extent && isGeo && layerNode.WGS84BoundingBox) {
                            extent = reprojectExtent(layerNode.WGS84BoundingBox, 'EPSG:4326', matrixSetNode.SupportedCRS);
                        }
                    }
                }
            }
        }
        return extent;
    }

    getInfo(name) {
        const self = this;
        const info = self.wrap.getInfo(name);
        if (info.metadata) {
            info.metadata.forEach(function (md) {
                if (self.map) {
                    md.formatDescription = formatDescriptions[md.format] =
                        formatDescriptions[md.format] ||
                        Util.getLocaleString(self.map.options.locale, Util.getSimpleMimeType(md.format)) ||
                        Util.getLocaleString(self.map.options.locale, 'viewMetadata');
                }
                else {
                    md.formatDescription = formatDescriptions[md.format];
                }
            });
        }
        return info;
    }

    //Devuelve un array de subLayers cuyo nombre o descripción contenga el texto indicado
    //case insensitive
    searchSubLayers(text) {
        if (text && text.length && text.length >= 3) {
            var self = this;
            var layers = null;
            /*URI:Si la cadena a buscar contiene a la busqueda anterior, por ejemplo, antes he buscado "cat" y ahora busco "cata" porque esto escribiendo "catastro" ...
            en vez de buscar en todas las capas del servicio busco en los resultados encotrados en la búsqueda anterior */
            if (this.lastPattern && text.indexOf(this.lastPattern) >= 0) {
                layers = this.lastMatches;
            }
            else {
                /*si se ha definido el parametro layers de esta capa en configuraci\u00f3n filtro las capas del capability para que busque solo en las capas que est\u00e9n en 
                configuraci\u00f3n y sus hijas*/
                if (self.availableNames && self.availableNames.length > 0) {
                    layers = [];
                    for (var i = 0; i < self.availableNames.length; i++) {
                        var layer = self.getLayerNodeByName(self.availableNames[i]);
                        if (layer) {
                            layers.push(layer);
                            layers = layers.concat(self.getChildrenLayers(layer));
                        }
                    }
                }
                else {
                    layers = self.wrap.getAllLayerNodes();
                }
            }

            var filter = Util.patternFn(text);
            var re = new RegExp(filter, "i");

            var matches = layers.map(function (ly, ix) {
                delete ly.tcScore;

                ly.tcPosition = ix;

                self.wrap.normalizeLayerNode(ly);

                var title = ly.Title.trim();
                var res = re.exec(title);
                var titleIx = res ? res.index : -1;
                var abstractIx = -1;
                if (ly.Abstract) {
                    var abs = ly.Abstract.trim();
                    var res2 = re.exec(abs);
                    abstractIx = res2 ? res2.index : -1;
                }

                if (res && title == res[0])
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
                    if (b.tcScore === a.tcScore) {
                        //si la puntuación es la misma reordenamos por título
                        var titleA = Util.replaceSpecialCharacters(a.Title);
                        var titleB = Util.replaceSpecialCharacters(b.Title);
                        if (titleA < titleB) return -1;
                        if (titleA > titleB) return 1;
                        return 0;
                    }
                    else
                        return b.tcScore - a.tcScore;
                });

            this.lastPattern = text;
            this.lastMatches = matches;

            return matches;
        }
        else {
            return [];
        }
    }

    getGetCapabilitiesUrl() {
        const self = this;
        var url;
        const serviceUrl = self.url;
        const params = {};
        if (self.type === Consts.layerType.WMTS) {
            if (self.options.encoding === Consts.WMTSEncoding.RESTFUL) {
                var suffix = '/1.0.0/WMTSCapabilities.xml';
                const suffixIdx = serviceUrl.indexOf(suffix);
                if (suffixIdx < 0 || suffixIdx < serviceUrl.length - suffix.length) {
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
        url = url + '?' + Util.getParamString(Util.extend(params, self.queryParams));
        return url;
    }

    getPreferredInfoFormat() {
        const layer = this;
        var result = null;

        const infoFormats = layer.wrap.getInfoFormats();
        if (infoFormats) {
            for (var i = 0; i < TC.wrap.layer.Raster.infoFormatPreference.length; i++) {
                var format = TC.wrap.layer.Raster.infoFormatPreference[i];
                if (infoFormats.indexOf(format) >= 0) {
                    result = format;
                    break;
                }
            }
        }
        return result;
    }

    /*
     * Carga la imagen de leyenda de una capa por POST.
     */
    getLegendGraphicImage() {
        const self = this;
        return new Promise(function (resolve, reject) {
            //Si ya hemos hecho esta consulta previamente, retornamos la respuesta
            if (self.options.params.base64LegendSrc) {
                return resolve(self.options.params.base64LegendSrc);
            }

            if (typeof window.btoa === 'function') {
                var name = self.names[0];
                var info = self.wrap.getInfo(name);
                var xhr = new XMLHttpRequest();
                var url = info.legend[0].src.split('?'); // Separamos los parámetros de la raíz de la URL
                var dataEntries = url[1].split("&"); // Separamos clave/valor de cada parámetro
                var params = self.options.params.sld_body ? "sld_body=" + self.options.params.sld_body : '';

                for (var i = 0; i < dataEntries.length; i++) {
                    var chunks = dataEntries[i].split('=');

                    if (chunks && chunks.length > 1 && chunks[1]) {
                        params += "&" + dataEntries[i];
                    }
                }
                if (self.options.params.env) {
                    params += "&" + self.options.params.env;
                }

                xhr.open('POST', url[0], true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

                xhr.responseType = 'arraybuffer';
                xhr.onload = function (_e) {
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
                            resolve(imageSrc);
                        }
                    }
                };
                xhr.send(params);
            } else {
                reject(Error("Función window.btoa no soportada por el navegador"));
            }
        });
    }

    // GLS: Según MDN: https://developer.mozilla.org/es/docs/Web/API/WebGL_API/Tutorial/Wtilizando_texturas_en_WebGL
    //    Note: Es importante señalar que la carga de texturas en WebGL sigue reglas de dominio-cruzado; 
    //          Es decir, sólo puede cargar texturas de sitios para los que su contenido tiene aprobación de CORS.

    // Usamos el mismo método que para el capabilities ya que la carga de texturas es igual de restrictiva.
    async getWebGLUrl(src) {
        const self = this;

        const resultSrc = !Util.isSecureURL(src) && Util.isSecureURL(Util.toAbsolutePath(self.url)) ? self.getBySSL_(src) : src;

        if (self.ignoreProxification) {
            return resultSrc;
        } else {
            const options = {
                exportable: true,
                ignoreProxification: self.ignoreProxification
            };

            const img = await self.proxificationTool.fetchImage(resultSrc, options);
            let action = self.proxificationTool.cacheHost.getAction(resultSrc, options);
            let _img = img;
            if (action) {
                const cache = await action;
                if (cache && cache.action) {
                    return { url: cache.action.call(self.proxificationTool, resultSrc), image: _img };
                }
            } else {
                throw Error('No action to ' + resultSrc);
            }
        }

        //// IGN francés tiene cabeceras CORS menos en las excepciones que las devuelve en XML así que si da error cargamos imagen en blanco sin hacer más
        //if (self.ignoreProxification) {
        //    setSRC({ src: Consts.BLANK_IMAGE });
        //    return;
        //}

        //return self.capabilitiesUrl_.call(self, !Util.isSecureURL(url) && Util.isSecureURL(Util.toAbsolutePath(self.url)) ? self.getBySSL_(url) : url);        
    }
    getLegendFormatUrl(layerName, full, ImageFormat) {
        const self = this;
        var url;
        const serviceUrl = self.url;
        const params = {};
        if (self.type === Consts.layerType.WMTS) {
            return null;
        }
        else {
            url = serviceUrl;
            params.SERVICE = 'WMS';
            params.VERSION = '1.3.0';
            params.REQUEST = 'GetLegendGraphic';
            if (!ImageFormat)
                params.FORMAT = 'application/json';
            else
                params.FORMAT = 'image/png';
            if (!full) {
                var BBOX = self.map.getExtent();
                if (ol.proj.get(self.map.getCRS()).axisOrientation_ === 'neu')
                    BBOX = [BBOX[1], BBOX[0], BBOX[3], BBOX[2]];
                params.SCALE = self.getOgcScale()
                params.SRCWIDTH = self.map.div.clientWidth;
                params.SRCHEIGHT = self.map.div.clientHeight;
                params.CRS = self.map.getCRS();
                params.BBOX = BBOX.join(",");
                params.LEGEND_OPTIONS = "hideEmptyRules:true;fontAntiAliasing:true";
            }

            //TODO:controlar todos los casos posibles de availableNames
            params.LAYER = layerName || self.availableNames[0];

        }
        url = url + '?' + Util.getParamString(Util.extend(params, self.queryParams));
        return url;
    }


    #get$events() {
        const self = this;
        if (self.wrap && self.wrap.$events) {
            return self.wrap.$events;
        }
        return null;
    }

    async getImageLoad(image, src) {
        const self = this;
        const img = image.getImage();
        img._timestamp = Date.now();
        const ts = img._timestamp;

        const setSRC = function (data) {
            // Evitamos que una carga anterior machaque una posterior
            if (ts < img._timestamp) {
                self.#get$events().trigger(Consts.event.TILELOADERROR, { tile: image, error: { text: 'Obsolete image' } });
                return;
            }
            if (!Util.isSameOrigin(data.src)) {
                if (!self.map || self.map.crossOrigin) {
                    img.crossOrigin = data.crossOrigin !== null ?
                        data.crossOrigin :
                        self.map ? self.map.crossOrigin : "anonymous";
                }
            }

            // GLS: si establecemos por atributo directamente no actualiza, mediante setAttribute funciona siempre.
            img.setAttribute("src", data.src);
            img.onload = function () {
                self.#get$events().trigger(Consts.event.TILELOAD, { tile: image });
            };
            img.onerror = function (error) {
                img.setAttribute("src", Consts.BLANK_IMAGE);
                self.#get$events().trigger(Consts.event.TILELOADERROR, { tile: image, error: { code: error.status, text: error.statusText } });
            };
        };

        // Viene sin nombre desde el control TOC, si es así lo ignoramos.
        if (self.names && self.names.length > 0) {

            const errorFn = function (error) {
                self.#get$events().trigger(Consts.event.TILELOADERROR, { tile: image, error: { code: error.status, text: error.statusText } });
                setSRC({ src: Consts.BLANK_IMAGE });
            };

            // comprobamos z/x/y contra el matrixset del capabilities para evitar peticiones 404
            if (self.type === Consts.layerType.WMTS) {
                var z, x, y;
                if (self.encoding !== "KVP") {
                    var _src = src.replace('.' + self.format.split('/')[1], '');
                    const parts = _src.split('/').slice(_src.split('/').length - 3).map(function (elm) { return parseInt(elm); });
                    z = parts[0];
                    x = parts[1];
                    y = parts[2];
                } else {
                    let parts = /.*TileMatrix=(\d*)&TileCol=(\d*)&TileRow=(\d*)/i.exec(src);
                    if (parts && parts.length === 4) {
                        parts = parts.slice(1).map(function (elm) { return parseInt(elm); });
                        z = parts[0];
                        x = parts[2];
                        y = parts[1];
                    }
                }

                if (z && x && y) {
                    var wmtsOptions = self.wrap.getWMTSLayer();
                    if (wmtsOptions) {
                        const matrixSet = wmtsOptions.TileMatrixSetLink.find(elm => elm.TileMatrixSet === self.matrixSet);
                        if (matrixSet) {

                            if (matrixSet.TileMatrixSetLimits && matrixSet.TileMatrixSetLimits.length > 0) {
                                var matrixSetLimits = matrixSet.TileMatrixSetLimits.sort(function (a, b) {
                                    if (parseInt(a.TileMatrix) > parseInt(b.TileMatrix))
                                        return 1;
                                    else if (parseInt(a.TileMatrix) < parseInt(b.TileMatrix))
                                        return -1;
                                    else return 0;
                                });

                                var level = matrixSetLimits[z];
                                if (level && self.map && self.map.on3DView) {
                                    if (!(level.MinTileRow <= x && level.MaxTileRow >= x && level.MinTileCol <= y && level.MaxTileCol >= y)) {
                                        console.log('Prevenimos petición fuera de matrix set, cargamos imagen en blanco');
                                        setSRC({ src: Consts.BLANK_IMAGE });
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            self.#get$events().trigger(Consts.event.BEFORETILELOAD, { tile: image });

            var params = "";
            var isPOST = self.options.method === "POST";
            if (isPOST) {
                var url = src.split('?');
                params = url[1].split("&").filter(function (param) {
                    const values = param.split('=');
                    // eliminamos los valores en blanco y el parámetro layers
                    return values.length > 1 && values[1].trim().length > 0 && values[0].trim().toLowerCase() !== "layers";
                }).join('&');

                try {
                    const blob = await self.proxificationTool.fetchImageAsBlob(url[0], {
                        type: "POST",
                        data: params,
                        contentType: "application/x-www-form-urlencoded"
                    })
                    const imageUrl = URL.createObjectURL(blob);
                    const img = image.getImage();
                    img.onload = function (_e) {
                        URL.revokeObjectURL(imageUrl);
                    };
                    setSRC({ src: imageUrl });
                }
                catch (e) {
                    errorFn(e);
                }

            } else {
                if (!self.ignoreProxification) {
                    try {
                        const img = await self.proxificationTool.fetchImage(src, { exportable: !self.map || self.map.crossOrigin });
                        setSRC(img);
                    }
                    catch (e) {
                        errorFn(e);
                    }
                } else {
                    setSRC({ src: src });
                    const img = image.getImage();

                    if (!Util.isSameOrigin(src)) {
                        if (!self.map || self.map.crossOrigin) {
                            img.crossOrigin = self.map ? self.map.crossOrigin : "anonymous";
                        }
                    }

                    img.onload = function () {
                        self.#get$events().trigger(Consts.event.TILELOAD, { tile: image });
                    };
                    img.onerror = function (error) {
                        img.src = Consts.BLANK_IMAGE;
                        self.#get$events().trigger(Consts.event.TILELOADERROR, { tile: image, error: { code: error.status, text: error.statusText } });
                    };

                    img.src = self.names.length ? src : Consts.BLANK_IMAGE;
                }
            }
        } else {
            setSRC({ src: Consts.BLANK_IMAGE });
            // lanzamos el evento para gestionar el loading
            self.#get$events().trigger(Consts.event.TILELOAD, { tile: image });
        }
    }

    async #describeLayer() {
        const self = this;
        const url = new URL(self.url, document.location.href);
        const layerNames = self.names instanceof Array ? self.names[0] : self.names;
        url.search = new URLSearchParams({ request: 'DescribeLayer', service: "WMS", version: "1.1.1", Layers: layerNames, outputFormat: "application/json" });
        let urlPromises = describeLayerPromises[self.options.url];
        if (!urlPromises) {
            urlPromises = describeLayerPromises[self.options.url] = new Map();
        }
        if (!urlPromises.has(layerNames)) {
            urlPromises.set(layerNames, self.proxificationTool.fetch(url.toString(), {
                method: "GET"
            }));
        }
        const response = await urlPromises.get(layerNames);
        if (response.contentType.startsWith("application/json")) {
            return JSON.parse(response.responseText).layerDescriptions[0];
        }
        else {
            let xmlDoc = new DOMParser().parseFromString(response.responseText, "text/xml");
            let error = xmlDoc.querySelector("Exception ExceptionText") || xmlDoc.querySelector("ServiceException");
            if (error) {
                throw Error(error.textContent);
            } else {
                return xmlDoc.querySelector("LayerDescription");
            }
        }
    }

    async getWFSURL() {
        const self = this;
        if (wfsUrlPromises[self.options.url]) return await wfsUrlPromises[self.options.url];
        const layerDescription = await self.#describeLayer();
        if (layerDescription.owsType !== "WFS") {
            return self.options.url.replace(/wms/gi, "wfs");
        }
        const url = layerDescription.owsURL.substr(0, layerDescription.owsURL.length + (layerDescription.owsURL.endsWith('?') ? -1 : 0));
        try {
            const urlObj = new URL(url);
            urlObj.searchParams.append('request', 'GetCapabilities');
            await self.proxificationTool.fetch(urlObj.toString(), { method: "HEAD" });
        }
        catch (_e) {
            return self.options.url.replace(/wms/gi, "wfs");
        }
        return url;
    }

    async getWFSFeatureType() {
        const self = this;
        if (wfsUrlPromises[self.options.url]) return await wfsUrlPromises[self.options.url];
        const layerDescription = await self.#describeLayer();
        if (layerDescription.owsType !== "WFS") {
            return '';
        }
        return layerDescription.typeName;
    }

    async getWFSCapabilities() {
        const self = this;
        const layer = await self.#getWfsLayer(await self.getWFSURL());
        return await layer.getCapabilitiesPromise();
    }

    async #getWfsLayer(url) {
        const self = this;
        if (!self.#wfsLayer || self.#wfsLayer.options.url !== url || self.#wfsLayer.featureType !== self.layerNames[0]) {
            self.#wfsLayer = new Vector({
                type: Consts.layerType.WFS,
                url: url,
                featureType: self.layerNames[0],
                stealth: true
            });
        }
        return self.#wfsLayer;
    }

    async getLegend(scopeless) {
        const self = this;
        if (self.type !== Consts.layerType.WMS)
            return null;
        //URI:Comprobamos que el servicio tiene cacheado la cmprobación si soporta leyenda JSON
        var legendJSONSupported = Object.prototype.hasOwnProperty.call(TC.legendFormat, self.getGetMapUrl()) ? TC.legendFormat[self.getGetMapUrl()] : new Promise(async (resolve, reject) => {
            const url = self.getLegendFormatUrl();
            if (url) {
                try {
                    //URI: pedimos un getlegendgraphic esperadno que nos de una excpación XML
                    var response = await Promise.all(
                        self.availableNames.map((name) => self.proxificationTool.fetch(self.getLegendFormatUrl(name, false), { retryAttempts: 1 }))
                    );
                    response = response[0];
                    switch (true) {
                        case response.contentType.toLowerCase().includes("application/json"):
                            TC.legendFormat[self.getGetMapUrl()] = LegendStatusEnum.JSON;
                            resolve(LegendStatusEnum.JSON);
                            break;
                        case response.contentType.toLowerCase().includes("text/xml"):
                            if (response.responseText.includes('"OperationNotSupported"') ||
                                response.responseText.includes('"MissingRights"')) {
                                reject();
                                TC.legendFormat[self.getGetMapUrl()] = LegendStatusEnum.UNAVAILABLE;
                            }
                            else {
                                resolve(LegendStatusEnum.PNG);
                                TC.legendFormat[self.getGetMapUrl()] = LegendStatusEnum.PNG;
                            }
                            break;
                        default:
                            reject();
                            TC.legendFormat[self.getGetMapUrl()] = LegendStatusEnum.UNAVAILABLE;
                            break;
                    }

                }
                catch (err) {
                    if (err?.status >= 400) {
                        reject(err);
                        TC.legendFormat[self.getGetMapUrl()] = LegendStatusEnum.UNAVAILABLE;
                        return;
                    }

                    console.warn("GetLegendgraphic error no registrado")

                }
            }
        });
        TC.legendFormat[self.getGetMapUrl()] = legendJSONSupported;
        //URI: Si es una promesa es que otra capa con la misma url de base ha hecho la petición y esa a la espera de obtenerla
        if (legendJSONSupported instanceof Promise)
            legendJSONSupported = await legendJSONSupported;
        if (legendJSONSupported === LegendStatusEnum.UNAVAILABLE)
            throw LegendStatusEnum.UNAVAILABLE;
        //URI: Si es true es que el servicio soporta leyenda como JSON
        const fetchFunction = legendJSONSupported === LegendStatusEnum.JSON ? self.proxificationTool.fetchJSON : self.proxificationTool.fetchImageAsBlob;
        const layerNames = legendJSONSupported === LegendStatusEnum.JSON ? self.availableNames : self.getDisgregatedLayerNames();
        return Promise.all(
            layerNames.map(async (name) => {
                try {
                    legendObject = (await fetchFunction.call(self.proxificationTool, self.getLegendFormatUrl(name, scopeless, legendJSONSupported === LegendStatusEnum.PNG), { retryAttempts: 1 }));
                    if (legendObject instanceof Blob) {
                        if (legendObject.size < 100)
                            return null;
                        return await new Promise((resolve) => {
                            var reader = new FileReader();
                            reader.readAsDataURL(legendObject);
                            reader.onloadend = function () {
                                resolve([{
                                    "layerName": name,
                                    "src": reader.result
                                }]);
                            }
                        })
                    }
                    else
                        return legendObject.Legend;
                }
                catch (ex) {
                    return null;
                }

            })
        );
    }

    async getDescribeFeatureTypeUrl() {
        const self = this;
        const wfsLayer = await self.#getWfsLayer(await self.getWFSURL());
        return wfsLayer.getDescribeFeatureTypeUrl();
    }

    getFallbackLayer() {
        const self = this;
        if (self.fallbackLayer instanceof Layer) {
            return self.fallbackLayer;
        }
        if (self.options.fallbackLayer) {
            var fbLayer = self.options.fallbackLayer;
            if (typeof fbLayer === 'string') {
                const ablCollection = self.map ? self.map.options.availableBaseLayers : Cfg.availableBaseLayers;
                ablCollection.forEach(function (baseLayer) {
                    if (self.options.fallbackLayer === baseLayer.id) {
                        self.fallbackLayer = new Raster(Util.extend({}, baseLayer, { isBase: true, stealth: true, map: self.map }));
                        self.fallbackLayer.firstOption = self;
                    }
                });
            }
            else if (fbLayer instanceof Layer) {
                self.fallbackLayer = fbLayer;
                self.fallbackLayer.firstOption = self;
            }
            else {
                self.fallbackLayer = new Raster(Util.extend({}, fbLayer, {
                    id: TC.getUID(),
                    isBase: true,
                    stealth: true,
                    title: self.title,
                    map: self.map
                }));
                self.fallbackLayer.firstOption = self;
            }
            return self.fallbackLayer;
        }
        return null;
    }

    async describeFeatureType(layerName) {
        const self = this;
        const layer = await self.#getWfsLayer(await self.getWFSURL());
        return layer.describeFeatureType(layerName || self.layerNames[0]);
    }

    refresh() {
        return this.wrap.reloadSource();
    }
}

//var esriParser = {
//    parse: function (text) {
//        var result = [];
//        var dom = (new DOMParser()).parseFromString(text, 'text/xml');
//        if (dom.documentElement.tagName === 'FeatureInfoResponse') {
//            var fiCollections = dom.documentElement.getElementsByTagName('FeatureInfoCollection');
//            for (var i = 0, len = fiCollections.length; i < len; i++) {
//                var fic = fiCollections[i];
//                var layerName = fic.getAttribute('layername');
//                var fInfos = fic.getElementsByTagName('FeatureInfo');
//                for (var j = 0, lenj = fInfos.length; j < lenj; j++) {
//                    var fields = fInfos[j].getElementsByTagName('Field');
//                    var attributes = {};
//                    for (var k = 0, lenk = fields.length; k < lenk; k++) {
//                        var field = fields[k];
//                        attributes[getElementText(field.getElementsByTagName('FieldName')[0])] = getElementText(field.getElementsByTagName('FieldValue')[0]);
//                    }
//                    var feature = new ol.Feature(attributes);
//                    feature.setId(layerName + '.' + TC.getUID());
//                    result.push(feature);
//                }
//            }
//        }
//        return result;
//    }
//};

TC.layer.Raster = Raster;
export default Raster;
export { LegendStatusEnum };

/**
 * Opciones de capa raster. Este objeto se utiliza al [configurar un mapa]{@linkplain SITNA.MapOptions}, el [control del catálogo de capas]{@linkplain LayerCatalogOptions}
 * o como parámetro al [añadir una capa]{@linkplain SITNA.Map#addLayer}.
 * @typedef RasterOptions
 * @memberof SITNA.layer
 * @extends SITNA.layer.LayerOptions
 * @see SITNA.MapOptions
 * @see SITNA.control.LayerCatalogOptions
 * @see SITNA.Map#addLayer
 * @see SITNA.Map#setBaseLayer
 * @property {string} id - Identificador único de capa. No puede haber en un mapa dos capas con el mismo valor de `id`.
 * @property {string} layerNames - Lista separada por comas de los nombres de capa del servicio OGC.
 * @property {string} url - URL del servicio OGC que define la capa.
 * @property {string} [filter] - Filtro en formato GML o <a href="https://docs.geoserver.org/latest/en/user/tutorials/cql/cql_tutorial.html" target="_blank">CQL</a>. En función del formato especificado, se añade a las peticiones GetMap posteriores el parámetro <a href="https://docs.geoserver.org/latest/en/user/services/wms/vendor.html#filter" target="_blank">filter</a> o <a href="https://docs.geoserver.org/latest/en/user/services/wms/vendor.html#cql-filter" target="_blank">cql_filter</a> correspondiente.
 *
 * No se pueden añadir al mapa 2 o más capas del mismo servicio (misma URL), en las cuales se establezcan filtros de tipo distinto. Es decir, no se pueden mezclar filtros CQL y GML en capas del mismo servicio.
 * @property {string} [format] - Tipo MIME del formato de archivo de imagen a obtener del servicio.
 *
 * Si esta propiedad no está definida, entonces si la capa es un mapa de fondo (consultar propiedad `isBase`), se asume que el formato es `image/jpeg`, en caso contrario se asume que el formato es `image/png`.
 *
 * Para asignar valor a esta propiedad se puede usar las constantes de definidas en [SITNA.Consts.mimeType]{@link SITNA.Consts}.
 * @property {boolean} [hideTree] - Aplicable a capas de tipo [WMS]{@link SITNA.Consts}.
 * Si se establece a `true`, la capa no muestra la jerarquía de grupos de capas en la tabla de contenidos ni en la leyenda.
 * @property {boolean} [isBase] - Si se establece a `true`, la capa es un mapa de fondo.
 * @property {boolean} [isDefault] - *__Obsoleta__: En lugar de esta propiedad es recomendable usar la propiedad `defaultBaseLayer`de {@link SITNA.MapOptions}.*
 *
 * Si se establece a true, la capa se muestra por defecto si forma parte de los mapas de fondo.
 * @property {string} [matrixSet] - Nombre de conjunto de matrices del servicio WMTS.
 * Esta propiedad es obligatoria para capas de tipo [WMTS]{@link SITNA.Consts}.
 * @property {SITNA.layer.LayerOptions|string} [overviewMapLayer] - Definición de la capa que se utilizará como fondo en el control de mapa de situación cuando esta capa está de fondo en el mapa principal.
 * @property {string} [thumbnail] - URL de una imagen en miniatura a mostrar en el selector de mapas de fondo.
 * @property {string} [title] - Título de capa. Este valor se mostrará en la tabla de contenidos y la leyenda.
 * @property {boolean} [transparent=true] - Indica si la capa tiene transparencia.
 * @property {string} [type] - Tipo de capa. Si no se especifica se considera que la capa es WMS. La lista de valores posibles está definida en [SITNA.Consts.layerType]{@link SITNA.Consts}.
 * @example <caption>Ejemplo de uso de la propiedad `filter` - [Ver en vivo](../examples/cfg.RasterOptions.filter.html)</caption> {@lang html}
 * <div id="mapa"></div>
 * <script>
 *    // Establecemos un layout simplificado apto para hacer demostraciones de controles.
 *    SITNA.Cfg.layout = "layout/ctl-container";
 *    // Añadimos el control de tabla de contenidos en la primera posición.
 *    SITNA.Cfg.controls.TOC = {
 *        div: "slot1"
 *    };
 *    var map = new SITNA.Map("mapa", {
 *        // Mapa centrado de Pamplona
 *        initialExtent: [606239, 4738249, 614387, 4744409],
 *        // Añadimos la capa de GeoPamplona del catálogo de edificios filtrada para mostrar solamente los de uso cultural.
 *        // Añadimos también la capa de IDENA de museos filtrada para mostrar solamente los que están en Pamplona.
 *        workLayers: [
 *            {
 *                id: "layer1",
 *                title: "Catálogo de edificios de Pamplona de uso cultural",
 *                type: SITNA.Consts.layerType.WMS,
 *                url: "//sig.pamplona.es/ogc/wms",
 *                layerNames: "PROY_Pol_Edificios",
 *                filter: '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc"><ogc:PropertyIsEqualTo><ogc:PropertyName>GRUPOEDIF</ogc:PropertyName><ogc:Literal><![CDATA[CULTURAL]]></ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>'
 *            },
 *            {
 *                id: "layer2",
 *                title: "Museos localizados en Pamplona",
 *                type: SITNA.Consts.layerType.WMS,
 *                url: "//idena.navarra.es/ogc/ows",
 *                layerNames: "DOTACI_Sym_Museos",
 *                filter: "POBLACION='Pamplona'"
 *            }
 *        ]
 *    });
 * </script>
 */

/*
 * Opciones de nombre de capa.
 * @typedef LayerNameOptions
 * @property {boolean} [aggregate=true] - Siempre que sea posible se reemplaza en la lista {{#crossLink "SITNA.layer.Raster/names:property"}}{{/crossLink}} los nombres de capa por los nombres de las capas de grupo que las contienen.
 * @property {boolean} [lazy=false] - Determina si la capa nativa se actualiza en cuanto cambia la lista
 * {{#crossLink "SITNA.layer.Raster/names:property"}}{{/crossLink}} (valor `false`)
 * o se espera a que la capa se actualice (valor `true`).
 * @property {boolean} [reset] - Determina si la capa la propiedad TC.layer.Raster.{{#crossLink "TC.layer.Raster/availableNames:property"}}{{/crossLink}} (valor <code>false</code>) se restablece
 * al actualizar la propiedad {{#crossLink "SITNA.layer.Raster/names:property"}}{{/crossLink}}.
 */

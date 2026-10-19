import LayerWrapper from "./Layer.js";
import Consts from "../../Consts.js";
import Util from "../../Util.js";
import EventTarget from "../../EventTarget.js";
import { WMSCapabilities, WMTSCapabilities } from 'ol/format.js';
import { ImageWMS, WMTS } from 'ol/source.js';
import { createLoader } from 'ol/source/wms.js';
import TileGrid from 'ol/tilegrid/TileGrid.js';
import { decode } from 'ol/Image.js';
import { getMetersPerUnit, normalizeProjection } from "../ol.js";

/////////////////////////// ol patches

const isMobile = Util.detectMobile();
// El viewState del mapa tiene una resolución con respecto al pixel virtual. Esto hace que se pida
// teselas en un nivel de zoom distinto al deseado para que se vean en el dispositivo en relación pixel 1:1.
// Esto parchea el problema.
const oldGetTilePixelRatio = WMTS.prototype.getTilePixelRatio;
WMTS.prototype.getTilePixelRatio = function (pixelRatio) {
    if (isMobile) {
        return oldGetTilePixelRatio.call(this, pixelRatio);
    }
    return oldGetTilePixelRatio.call(this, pixelRatio) * (pixelRatio || 1);
};

const oldGetZForResolution = TileGrid.prototype.getZForResolution;
TileGrid.prototype.getZForResolution = function (resolution, opt_direction) {
    let res = resolution;
    if (!isMobile) {
        res = res / window.devicePixelRatio;
    }
    return oldGetZForResolution.call(this, res, opt_direction);
};

// Parcheamos siguiente método para meter en todas las peticiones todos los vendor params si pixelRatio != 1
// serverType lo tenemos como Geoserver, así que añadimos los parámetros de los demás.
const oldGetRequestUrl_ = ImageWMS.prototype.getRequestUrl_;
ImageWMS.prototype.getRequestUrl_ = function (extent, size, pixelRatio, projection, params) {
    if (pixelRatio !== 1) {
        // Redondeamos porque si no GeoServer peta
        const dpi = (90 * pixelRatio + 0.5) | 0;
        params.MAP_RESOLUTION = dpi;
        params.DPI = dpi;
    }
    return oldGetRequestUrl_.call(this, extent, size, pixelRatio, projection, params);
};

//////////////////////// end ol patches

// Objetos de apoyo para getLegend
const _fragment = document.createDocumentFragment();
const _textarea = document.createElement('textarea');
_fragment.appendChild(_textarea);

const createWmtsSource = function (options) {
    var self = this;
    var result = null;
    var sourceOptions = ol.source.WMTS.optionsFromCapabilities(self.parent.capabilities, {
        layer: options.layerNames,
        matrixSet: options.matrixSet,
        crossOrigin: options.map ? options.map.options.crossOrigin : undefined,
        requestEncoding: options.encoding,
        format: options.format
    });

    // Ponemos wrapX = true porque OL 10.1 recorta el extent del mapa base de IDENA. Con esto no recorta nada.
    sourceOptions.wrapX = true;

    // Parche: OL calcula fullTileRanges_ en base a la extensión cubierta por los límites del último nivel de zoom. 
    // Esto es un problema porque mapabase tiene límites más extensos en los primeros niveles de zoom que en los últimos.
    // Reasignamos los límites en base a los que salen en el capabilities.
    //
    // A partir de OL 10.1 es necesario también rehacer extent_, si no se queda con el extent de la capa más profunda
    let matrixSetLinkNode;
    const layerNode = self
        .parent
        .capabilities
        .Contents
        .Layer
        .find(l => l.Identifier === options.layerNames);
    if (layerNode) {
        matrixSetLinkNode = layerNode
            .TileMatrixSetLink
            .find(tmsl => tmsl.TileMatrixSet === options.matrixSet);
        if (matrixSetLinkNode) {
            const tmsLimits = matrixSetLinkNode.TileMatrixSetLimits;
            if (tmsLimits) {
                const resolutions = sourceOptions.tileGrid.getResolutions();
                const origins = sourceOptions.tileGrid.origins_;
                const tileSizes = sourceOptions.tileGrid.tileSizes_;
                sourceOptions.tileGrid.fullTileRanges_.forEach(function (range, idx) {
                    const tmsl = tmsLimits[idx];
                    range.minX = tmsl.MinTileCol;
                    range.minY = tmsl.MinTileRow;
                    range.maxX = tmsl.MaxTileCol;
                    range.maxY = tmsl.MaxTileRow;
                    const delta = resolutions[idx] + tileSizes[idx];
                    const origin = origins[idx];
                    const minX = origin[0] + delta * range.minX;
                    const minY = origin[1] + delta * range.minY;
                    const maxX = origin[0] + delta * (range.maxX + 1)
                    const maxY = origin[1] + delta * (range.maxY + 1)
                    ol.extent.extend(sourceOptions.tileGrid.extent_, [minX, minY, maxX, maxY]);
                });
            }
        }
        else {
            throw new Error(`Matrix set '${options.matrixSet}' not found`);
        }
    }
    else {
        throw new Error(`Layer '${options.layerNames}' not found`);
    }
    /// Fin de parche ///
    var https = 'https:';

    if (sourceOptions) {
        // añadido porque a partir de OL6 pasa el valor por defecto de 2048 al número de teselas que cabe en el viewport
        sourceOptions.cacheSize = 2048;

        if (location.protocol === https) {
            sourceOptions.urls = sourceOptions.urls.map(function (elm) {
                return elm.replace('http:', https);
            });
        }

        sourceOptions.extent = self.parent.getExtent() || sourceOptions.tileGrid?.getExtent();

        sourceOptions.crossOrigin = options.map ? options.map.crossOrigin : undefined;

        result = new ol.source.WMTS(sourceOptions);
        result.setTileLoadFunction(self.parent.getImageLoad.bind(self.parent));

        // flacunza: Aparentemente esta gestión de eventos es redundante, porque ya se están lanzando en Raster.getImageLoad
        //result.on(TILELOADSTART, function (e) {
        //    self.trigger(Consts.event.BEFORETILELOAD, {
        //        tile: e.tile.getImage()
        //    });
        //});
        //result.on(TILELOADEND, function (e) {
        //    self.trigger(Consts.event.TILELOAD, {
        //        tile: e.tile.getImage()
        //    });
        //});
        //result.on(TILELOADERROR, function (e) {
        //    self.trigger(Consts.event.TILELOAD, {
        //        tile: e.tile.getImage()
        //    });
        //});

        var prevFn = result.getResolutions.bind(result);
        result.getResolutions = function () {
            var resolutions = prevFn();
            var matrix = self.parent.getLimitedMatrixSet();
            //esto está mal, porque matrix podría empezar más abajo (tener recortado por ambos lados)
            if (matrix && matrix.length) {
                var ix = matrix[0].matrixIndex;
                if (ix !== undefined) {
                    resolutions = resolutions.slice(ix, matrix.length + ix);
                }
            }

            return resolutions;
        };
    }

    return result;
};

export default class RasterWrapper extends LayerWrapper {
    WmsParser = WMSCapabilities;
    WmtsParser = WMTSCapabilities;

    static infoFormatPreference = [
        'application/json',
        'application/vnd.ogc.gml/3.1.1',
        'application/vnd.ogc.gml',
        'application/geopackage+sqlite3',
        'application/vnd.esri.wms_featureinfo_xml',
        'text/html',
        'text/plain',
        'text/xml'
    ];

    constructor(layer) {
        super(layer);
        EventTarget.call(this);
    }

    getGetMapUrl() {
        var result = null;
        var self = this;
        switch (self.getServiceType()) {
            case Consts.layerType.WMS:
                var dcpType = self.parent.capabilities.Capability.Request.GetMap.DCPType;
                for (var i = 0; i < dcpType.length; i++) {
                    if (dcpType[i].HTTP && dcpType[i].HTTP.Get) {
                        result = dcpType[i].HTTP.Get.OnlineResource;
                        break;
                    }
                }
                break;
            case Consts.layerType.WMTS:
                result = self.parent.capabilities.OperationsMetadata.GetTile.DCP.HTTP.Get[0].href;
                break;
            default:
                break;
        }
        const fragment = document.createDocumentFragment();
        const textarea = document.createElement('textarea');
        fragment.appendChild(textarea);
        textarea.innerHTML = result;
        result = textarea.textContent;
        return result;
    }

    getInfoFormats() {
        var result = null;
        var c = this.parent.capabilities;
        if (c.Capability && c.Capability.Request.GetFeatureInfo) {
            result = c.Capability.Request.GetFeatureInfo.Format;
        }
        return result;
    }

    getWMTSLayer(options = {}) {
        var result = null;
        var self = this;
        var capabilities = self.parent.capabilities;
        let tileMatrixSetByCRS;
        if (options.crs) {
            tileMatrixSetByCRS = capabilities.Contents.TileMatrixSet.filter(tms => Util.CRSCodesEqual(options.crs, tms.SupportedCRS));
        }
        if (capabilities && capabilities.Contents) {
            for (var i = 0; i < capabilities.Contents.Layer.length; i++) {
                var layer = capabilities.Contents.Layer[i];
                if (self.parent.options.layerNames === layer.Identifier) {
                    for (var j = 0; j < layer.TileMatrixSetLink.length; j++) {
                        if (options.crs) {
                            let tms = tileMatrixSetByCRS.filter(tmsCRS => tmsCRS.Identifier === layer.TileMatrixSetLink[j].TileMatrixSet);
                            if (tms.length > 0) {
                                result = layer;
                                break;
                            }
                        } else if ((options.matrixSetId || self.parent.options.matrixSet) === layer.TileMatrixSetLink[j].TileMatrixSet) {
                            result = layer;
                            break;
                        }
                    }
                }
            }
        }
        return result;
    }

    getTileMatrix(matrixSet) {
        var result = null;
        var self = this;
        var capabilities = self.parent.capabilities;
        if (capabilities && capabilities.Contents && capabilities.Contents.TileMatrixSet) {
            for (var i = 0; i < capabilities.Contents.TileMatrixSet.length; i++) {
                var tms = capabilities.Contents.TileMatrixSet[i];
                if (tms.Identifier === matrixSet) {
                    result = tms.TileMatrix;
                    break;
                }
            }
        }
        return result;
    }

    getScaleDenominators(node) {
        var result = [];
        var self = this;
        if (node.ScaleDenominator) {
            result = [node.ScaleDenominator, node.ScaleDenominator];
        }
        else {
            if (node.MinScaleDenominator || node.MaxScaleDenominator) {
                result = [node.MaxScaleDenominator, node.MinScaleDenominator];
            }
        }
        // Contemplamos el caso de una capa sin nombre: sus escalas válidas serán las de sus hijas.
        if (!result.length && !self.getName(node)) {
            var children = self.getLayerNodes(node);
            var max = -Infinity, min = Infinity;
            for (var i = 0, len = children.length; i < len; i++) {
                var childDenominators = self.getScaleDenominators(children[i]);
                if (childDenominators[0] > max) {
                    max = childDenominators[0];
                }
                if (childDenominators[1] < min) {
                    min = childDenominators[1];
                }
            }
            if (max > -Infinity && min < Infinity) {
                result = [max, min];
            }
        }
        return result;
    }

    getAttribution() {
        const self = this;
        const result = {};
        const capabilities = TC.capabilities[self.parent.url];

        if (capabilities) {
            if (capabilities.ServiceProvider) {
                result.name = capabilities.ServiceProvider.ProviderName.trim();
                result.site = capabilities.ServiceProvider.ProviderSite;
                if (result.site && result.site.href && result.site.href.trim().length > 0) {
                    result.site = result.site.href;
                } else {
                    delete result.site;
                }
            }
            else if (capabilities.ServiceIdentification) {
                result.name = capabilities.ServiceIdentification.Title.trim();
            }
            else {
                result.name = capabilities.Service.Title.trim();
            }
        }
        return result;
    }

    getInfo(name) {
        var self = this;
        var result = {};
        var capabilities = self.parent.capabilities;
        if (capabilities) {
            var i;
            if (capabilities.Capability) { // WMS
                var layerNodes = self.getAllLayerNodes();
                for (i = 0; i < layerNodes.length; i++) {
                    var l = layerNodes[i];
                    if (self.parent.compareNames(self.getName(l), name)) {
                        if (l.Title) {
                            result.title = l.Title;
                        }
                        if (l.Abstract) {
                            result.abstract = l.Abstract;
                        }
                        result.legend = [];

                        var _process = function (value) {
                            var legend = this.getLegend(value);
                            legend.filter((l) => l.src).forEach((l) => {
                                result.legend.push({
                                    src: l.src, title: value.Title
                                });
                            })
                        };

                        var _traverse = function (o, func) {
                            if (o.Layer && o.Layer.length > 0) {
                                for (var i in o.Layer) {
                                    //bajar un nivel en el árbol
                                    _traverse(o.Layer[i], func);
                                }
                            } else {
                                func.apply(self, [o]);
                            }
                        };

                        //Obtenemos todas las leyendas de la capa o grupo de capas
                        _traverse(l, _process);

                        if (l.MetadataURL && l.MetadataURL.length) {
                            result.metadata = [];
                            for (var j = 0; j < l.MetadataURL.length; j++) {
                                var md = l.MetadataURL[j];
                                result.metadata.push({
                                    format: md.Format, type: md.type, url: md.OnlineResource
                                });
                            }
                        }
                        result.queryable = l.queryable;
                        break;
                    }
                }
            }
            else if (capabilities.Contents) { // WMTS
                const layerName = self.parent.names[0];
                for (i = 0; i < capabilities.Contents.Layer.length; i++) {
                    const layer = capabilities.Contents.Layer[i];
                    if (layer.Identifier === layerName) {
                        result.abstract = layer.Abstract;
                        let metadata = layer.Metadata;
                        if (metadata) {
                            if (!Array.isArray(metadata)) {
                                metadata = [metadata];
                            }
                            result.metadata = metadata.map(md => ({
                                format: md.format,
                                url: md.href
                            }));
                        }
                        break;
                    }
                }
            }
        }

        return result;
    }

    getServiceType() {
        var result = null;
        var capabilities = this.parent.capabilities;
        if (capabilities.Capability && capabilities.Capability.Request && capabilities.Capability.Request.GetMap) {
            result = Consts.layerType.WMS;
        }
        else if (capabilities.OperationsMetadata && capabilities.OperationsMetadata.GetTile) {
            result = Consts.layerType.WMTS;
        }
        return result;
    }

    getServiceTitle() {
        var result = null;
        var capabilities = this.parent.capabilities;
        if (capabilities.Capability && capabilities.Service) {
            result = capabilities.Service.Title;
        }
        else if (capabilities.ServiceIdentification) {
            result = capabilities.ServiceIdentification.Title;
        }
        return result;
    }

    getRootLayerNode() {
        var self = this;
        var result;
        if (self.getServiceType() === Consts.layerType.WMS) {
            result = self.parent.capabilities.Capability.Layer;
        }
        return result;
    }

    getName(node, ignorePrefix) {
        var result = node.Name;
        if (result && ignorePrefix) {
            var idx = result.indexOf(':');
            if (idx >= 0) {
                result = result.substr(idx + 1);
            }
        }
        return result;
    }

    getIdentifier(node) {
        return node.Identifier;
    }

    getLayerNodes(node) {
        var result = node.Layer;
        if (!Array.isArray(result)) {
            if (result) {
                result = [result];
            }
            else {
                result = [];
            }
        }
        return result;
    }

    getAllLayerNodes() {
        var self = this;
        if (!self._layerList) {
            switch (self.getServiceType()) {
                case Consts.layerType.WMS:
                    var getNodeArray = function getNodeArray(node) {
                        var r = [node];
                        var children = self.getLayerNodes(node);
                        for (var i = 0; i < children.length; i++) {
                            r = r.concat(getNodeArray(children[i]));
                        }
                        return r;
                    };
                    var root = self.getRootLayerNode();
                    self._layerList = root ? getNodeArray(root) : [];
                    break;
                case Consts.layerType.WMTS:
                    self._layerList = self.parent.capabilities.Contents.Layer.slice();
                    break;
                default:
                    self._layerList = [];
                    break;
            }
        }
        return self._layerList;
    }

    normalizeLayerNode(node) {
        return node;
    }

    normalizeCapabilities(capabilities) {
        return capabilities;
    }

    getLegend(node) {
        var result = [];
        var styles = node.Style;
        if (styles && styles.length) {
            if (styles.length && styles[0].LegendURL && styles[0].LegendURL.length) {
                styles[0].LegendURL.forEach(function addLegendItem(legendUrl) {
                    _textarea.innerHTML = legendUrl.OnlineResource;
                    const legendElm = {
                        src: _textarea.textContent
                    };
                    // Eliminado porque GeoServer miente con el tamaño de sus imágenes de la leyenda
                    //if (legendUrl.size) {
                    //    legendElm.width = legendUrl.size[0];
                    //    legendElm.height = legendUrl.size[1];
                    //}
                    result.push(legendElm);
                });
            }
        }
        return result;
    }

    isCompatible(crs) {
        var self = this;
        var result = true;
        var layer = self.parent;
        switch (self.getServiceType()) {
            case Consts.layerType.WMS:
                if (layer.capabilities && layer.capabilities.Capability && layer.capabilities.Capability.Layer) {
                    if (layer.names.length > 0) {
                        var names = layer.names.slice(0);
                        var _getParentCRS = function (node) {
                            if (node.parent) {
                                return node.parent.CRS || node.parent.SRS || _getParentCRS(node.parent)
                            }
                            return null;
                        }
                        var _isCompatible = function _isCompatible(nodes, name, inCrs) {
                            var r = false;
                            if (nodes) {
                                for (var i = 0; i < nodes.length; i++) {
                                    var n = nodes[i];
                                    const itemCRS = n.CRS || n.SRS || _getParentCRS(n);
                                    const crsList = Array.isArray(itemCRS) ? itemCRS : [itemCRS];
                                    var isIn = inCrs || crsList.indexOf(crs) >= 0;
                                    if (layer.compareNames(self.getName(n), name)) {
                                        if (isIn) {
                                            r = true;
                                        }
                                        break;
                                    }
                                    else if (_isCompatible(n.Layer, name, isIn)) {
                                        r = true;
                                        break;
                                    }
                                }
                            }
                            return r;
                        };
                        while (names.length > 0) {
                            if (!_isCompatible([layer.capabilities.Capability.Layer], names.pop())) {
                                result = false;
                                break;
                            }
                        }
                    }
                }
                break;
            case Consts.layerType.WMTS:
                result = false;
                if (layer.capabilities && layer.capabilities.Contents && layer.capabilities.Contents.TileMatrixSet) {
                    var tms = layer.capabilities.Contents.TileMatrixSet;
                    for (var i = 0; i < tms.length; i++) {
                        if (tms[i].Identifier === layer.options.matrixSet) {
                            result = Util.CRSCodesEqual(crs, tms[i].SupportedCRS);
                            break;
                        }
                    }
                }
                break;
            default:
                break;
        }
        return result;
    }

    getCompatibleCRS() {
        var self = this;
        var result = [];
        var layer = self.parent;
        switch (self.getServiceType()) {
            case Consts.layerType.WMS:
                if (layer.capabilities && layer.capabilities.Capability && layer.capabilities.Capability.Layer) {
                    if (layer.names.length > 0) {
                        const crsLists = layer.names
                            .map(function (name) {
                                return layer
                                    .getNodePath(name) // array de nodos
                                    .map(function (node) {
                                        const itemCRS = node.CRS || node.SRS || [];
                                        const crsList = Array.isArray(itemCRS) ? itemCRS : [itemCRS];
                                        return Array.isArray(crsList) ? crsList : [crsList];
                                    }) // array de arrays de crs
                                    .reduce(function (prev, cur) {
                                        if (prev.length === 0) {
                                            return cur;
                                        }
                                        cur.forEach(function (elm) {
                                            if (prev.indexOf(elm) < 0) {
                                                prev[prev.length - 1] = elm;
                                            }
                                        });// array con todos los crs
                                        return prev;
                                    }, []);
                            });

                        if (crsLists.length === 1) {
                            result = crsLists[0];
                        } else {
                            const otherCrsLists = crsLists.slice(1);
                            result = crsLists[0].filter(function (elm) {
                                return otherCrsLists.every(function (crsList) {
                                    return crsList.indexOf(elm) >= 0;
                                });
                            });
                        }
                    }
                }
                break;
            case Consts.layerType.WMTS:
                if (layer.capabilities && layer.capabilities.Contents) {
                    layer.capabilities.Contents.Layer
                        .filter(function (l) {
                            return l.Identifier === layer.layerNames;
                        })  // La capa de interés
                        .forEach(function (l) {
                            const tileMatrixSets = l.TileMatrixSetLink
                                .map(function (tmsl) {
                                    return tmsl.TileMatrixSet;
                                });
                            result = layer.capabilities.Contents.TileMatrixSet
                                .filter(function (tms) {
                                    return tileMatrixSets.indexOf(tms.Identifier) >= 0;
                                }) // TileMatrixSets asociados a la capa de interés
                                .map(function (tms) {
                                    return tms.SupportedCRS;
                                });
                        });
                }
                break;
            default:
                break;
        }
        return result;
    }

    getCompatibleLayers(crs) {
        var self = this;
        var result = [];
        var layer = self.parent;
        switch (self.getServiceType()) {
            case Consts.layerType.WMS:
                if (layer.capabilities && layer.capabilities.Capability && layer.capabilities.Capability.Layer) {
                    var _recursiveFn = function (item, crs, inCrs) {
                        var crsToCheck = item.CRS || item.SRS;
                        var itemCRS = Array.isArray(crsToCheck) ? crsToCheck : [crsToCheck];
                        var isIn = inCrs || itemCRS.indexOf(crs) >= 0;
                        if (isIn && item.Name) {
                            result.push(item.Name);
                        }
                        if (item.Layer) {
                            for (var i = 0; i < item.Layer.length; i++) {
                                _recursiveFn(item.Layer[i], crs, isIn);
                            }
                        }
                    };
                    _recursiveFn(layer.capabilities.Capability.Layer, crs);
                }
                break;
            case Consts.layerType.WMTS:
                if (layer.capabilities && layer.capabilities.Contents && layer.capabilities.Contents.TileMatrixSet) {
                    var tmsList = layer.capabilities.Contents.TileMatrixSet;
                    for (var i = 0, ii = tmsList.length; i < ii; i++) {
                        var tms = tmsList[i];
                        if (Util.CRSCodesEqual(crs, tms.SupportedCRS)) {
                            var tmsIdentifier = tms.Identifier;
                            var layerList = layer.capabilities.Contents.Layer;
                            for (var j = 0, jj = layerList.length; j < jj; j++) {
                                var tmsLinkList = layerList[j].TileMatrixSetLink;
                                for (var k = 0, kk = tmsLinkList.length; k < kk; k++) {
                                    if (tmsLinkList[k].TileMatrixSet === tmsIdentifier) {
                                        result.push(layerList[j].Identifier);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            default:
                break;
        }
        return result;
    }

    getCompatibleMatrixSets(crs) {
        const self = this;
        const result = [];
        normalizeProjection({ crs });
        const layer = self.parent;
        if (self.getServiceType() === Consts.layerType.WMTS) {
            var layerList = layer.capabilities.Contents.Layer;
            var tmsList = layer.capabilities.Contents.TileMatrixSet;
            for (var i = 0, ii = layerList.length; i < ii; i++) {
                if (layer.layerNames === layerList[i].Identifier) {
                    var tmsLinkList = layerList[i].TileMatrixSetLink;
                    for (var j = 0, jj = tmsLinkList.length; j < jj; j++) {
                        var tmsLink = tmsLinkList[j];
                        for (var k = 0, kk = tmsList.length; k < kk; k++) {
                            var tms = tmsList[k];
                            if (tms.Identifier === tmsLink.TileMatrixSet) {
                                if (Util.CRSCodesEqual(crs, tms.SupportedCRS)) {
                                    result.push(tms.Identifier);
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
        return result;
    }

    setWMTSUrl() {
        var self = this;

        self.getLayer().then(function (l) {
            self.parent.options = self.parent.options || {};
            var urls = l.getSource().getUrls();
            self.parent.options.urlPattern = urls[urls.length - 1];
        });
    }

    getResolutionBounds({ layerNames, crs }) {
        const self = this;
        const result = {};
        if (crs && layerNames) {
            const metersPerUnit = getMetersPerUnit(ol.proj.get(crs),
                self.parent.map ? Util.reprojectExtent(self.parent.map.getExtent(), self.parent.map.crs, crs) : undefined);
            if (self.parent.capabilities) {
                const getResolutionFromScaleDenominator = (denominator) => denominator * 0.00028 / metersPerUnit;

                const nodes = layerNames.split().map((name) => self.parent.getLayerNodeByName(name));
                const minScaleDenominator = Math.min(...nodes.map((node) => parseFloat(node?.MinScaleDenominator ?? 0)));
                if (minScaleDenominator > 0) {
                    result.minResolution = getResolutionFromScaleDenominator(minScaleDenominator);
                }
                const maxScaleDenominator = Math.max(...nodes.map((node) => parseFloat(node?.MaxScaleDenominator ?? Infinity)));
                if (maxScaleDenominator < Infinity) {
                    result.maxResolution = getResolutionFromScaleDenominator(maxScaleDenominator);
                }
            }
        }
        return result;
    }

    createWMSLayer(url, params, options) {
        const self = this;
        var result = null;

        var source = new ol.source.ImageWMS({
            url: url,
            crossOrigin: options.map ? options.map.crossOrigin : undefined,
            params: params,
            ratio: TC.Cfg.imageRatio,
            imageLoadFunction: self.parent.getImageLoad.bind(self.parent),
            serverType: 'geoserver'
        });

        // Parche para resolver el problema de que OL 8 se espera una imageLoadFunction síncrona
        // y nuestra función puede ser asíncrona por la herramienta Proxification.
        // Se replica la creación del loader por defecto, pero se hace 
        // asíncrona la función load.
        const oldGetImageInternal = source.getImageInternal
        source.getImageInternal = function (extent, resolution, pixelRatio, projection) {
            if (!this.loader || this.loaderProjection_ !== projection) {
                this.loader = createLoader({
                    crossOrigin: this.crossOrigin_,
                    params: this.params_,
                    projection: projection,
                    serverType: this.serverType_,
                    hidpi: this.hidpi_,
                    url: this.url_,
                    ratio: this.ratio_,
                    load: async (image, src) => {
                        this.image.setImage(image);
                        await this.imageLoadFunction_(this.image, src);
                        return await decode(image);
                    },
                });
            }

            return oldGetImageInternal.call(this, extent, resolution, pixelRatio, projection);
        }
        ///////////////////

        // flacunza: Aparentemente esta gestión de eventos es redundante, porque ya se están lanzando en Raster.getImageLoad
        //source.on('imageloadstart', function (e) {
        //    self.trigger(Consts.event.BEFORETILELOAD, {
        //        tile: e.image.getImage()
        //    });
        //});
        //source.on('imageloadend', function (e) {
        //    self.trigger(Consts.event.TILELOAD, {
        //        tile: e.image.getImage()
        //    });
        //});
        //source.on('imageloaderror', function (e) {
        //    self.trigger(Consts.event.TILELOAD, {
        //        tile: e.image.getImage()
        //    });
        //});


        var layerOptions = {
            visible: !!params.LAYERS.length || options && options.method && options.method === 'POST', //Las capas de temáticos cargadas por POST no tienen el atributo LAYERS
            source: source
        };

        const { minResolution, maxResolution } = self.getResolutionBounds({
            layerNames: params.LAYERS,
            crs: options.map?.crs
        });
        if (options.minResolution || minResolution) {
            layerOptions.minResolution = options.minResolution ?? minResolution;
        }
        if (options.maxResolution || maxResolution) {
            layerOptions.maxResolution = options.maxResolution ?? maxResolution;
        }
        result = new ol.layer.Image(layerOptions);

        result._wrap = self;

        self.addCommonEvents(result);

        return result;
    }

    createWMTSLayer(options) {
        const self = this;
        var result = null;

        var source = createWmtsSource.call(self, options);

        if (source) {
            var layerOptions = {
                source: source
            };
            if (options.minResolution) {
                layerOptions.minResolution = options.minResolution;
            }
            if (options.maxResolution) {
                layerOptions.maxResolution = options.maxResolution;
            }
            result = new ol.layer.Tile(layerOptions);
            result._wrap = self;

            self.addCommonEvents(result);

            var resolutions = source.getResolutions();
            //Este +1 tan chungo es porque, en el caso en que la resolución del mapa es igual a la máxima del layer, openLayers lo oculta
            result.setMaxResolution(resolutions[0] + 1);
            result.setMinResolution(resolutions[resolutions.length - 1]);
        }

        return result;
    }


    getParams() {
        return this.layer.getSource().getParams();
    }

    setParams(params) {
        const { minResolution, maxResolution } = this.getResolutionBounds({
            layerNames: params.LAYERS,
            crs: this.parent.map?.crs,
        });
        if (!this.parent.options.minResolution && minResolution) {
            this.layer.setMinResolution(minResolution);
        }
        if (!this.parent.options.maxResolution && maxResolution) {
            this.layer.setMaxResolution(maxResolution);
        }
        this.layer.getSource().updateParams(params);
    }

    setMatrixSet(matrixSet) {
        const self = this;
        if (self.parent.type === Consts.layerType.WMTS) {
            const newSource = createWmtsSource.call(self, Util.extend({}, self.parent.options, { matrixSet }));
            const newResolutions = newSource.getResolutions();
            // Ponemos un extra a la resolución máxima si viene de la lista de resoluciones
            // porque para OpenLayers la resolución mínima es inclusiva y la máxima exclusiva (no queremos ese comportamiento)
            const newMaxResolution = newResolutions[0] + newResolutions[0] / 1000;
            const newMinResolution = newResolutions[newResolutions.length - 1];
            self.layer.setMaxResolution(newMaxResolution);
            self.layer.setMinResolution(newMinResolution);
            if (self.parent.minResolution) {
                self.parent.minResolution = newMinResolution;
            }
            if (self.parent.maxResolution) {
                self.parent.maxResolution = newMaxResolution;
            }
            self.layer.setSource(newSource);
        }
    }

    getResolutions() {
        if (this.layer.getSource) {
            var ts = this.layer.getSource();
            if (ts.getResolutions) return ts.getResolutions();
            else return [];
        }
        else {
            return [];
        }
    }

    setResolutions(resolutions) {
        if (this.layer.getSource) {
            var ts = this.layer.getSource();
            if (ts.resolutions_) {
                ts.resolutions_ = resolutions;
            }
            else if (ts.tileGrid) {
                ts.tileGrid.resolutions_ = resolutions;
            }
        }
    }

    reloadSource() {
        const self = this;
        return new Promise(function (resolve, reject) {
            if (self.layer.getSource) {
                self.layer.getSource().refresh();
                resolve();
            }
            else {
                reject();
            }
        });
    }
}
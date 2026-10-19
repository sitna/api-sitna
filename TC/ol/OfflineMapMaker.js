import ControlWrapper from '../wrap/Control.js';
import Consts from '../Consts.js';

export default class OfflineMapMakerWrapper extends ControlWrapper {

    getRequestSchemas(options) {
        var extent = options.extent;
        var layers = options.layers;
        var result = new Array(layers.length);
        for (var i = 0, len = result.length; i < len; i++) {
            var layer = layers[i];
            var schema = {
                layerId: layer.id,
                tileMatrixSet: layer.matrixSet,
                supportedCrs: options.crs,
            };
            var olSource = layer.wrap.layer.getSource();
            if (olSource.getUrls) {
                schema.url = olSource.getUrls()[0];
            }
            if (olSource.getTileGrid) {
                var tileGrid = olSource.getTileGrid();
                var resolutions = tileGrid.getResolutions();
                var matrixIds = tileGrid.getMatrixIds();
                var node = layer.getLayerNodeByName(layer.layerNames);
                var tmsLimits = null;
                for (var j = 0, llen = node.TileMatrixSetLink.length; j < llen; j++) {
                    var tmsl = node.TileMatrixSetLink[j];
                    if (tmsl.TileMatrixSet === layer.matrixSet) {
                        tmsLimits = tmsl.TileMatrixSetLimits;
                        break;
                    }
                }
                schema.tileMatrixLimits = [];
                resolutions.forEach(function (resolution, idx) {
                    var origin = tileGrid.getOrigin(idx);
                    var tileSize = tileGrid.getTileSize(idx);
                    var unitsPerTile = tileSize * resolution;
                    var tml = {
                        mId: matrixIds[idx],
                        res: resolution,
                        origin: origin,
                        tSize: tileSize,
                        cl: Math.floor((extent[0] - origin[0]) / unitsPerTile),
                        cr: Math.floor((extent[2] - origin[0]) / unitsPerTile),
                        rt: Math.floor((origin[1] - extent[3]) / unitsPerTile),
                        rb: Math.floor((origin[1] - extent[1]) / unitsPerTile)
                    };
                    if (tmsLimits) {
                        var tmsLimit = tmsLimits[idx];
                        if (tmsLimit) {
                            tml.cl = Math.max(tml.cl, tmsLimit.MinTileCol);
                            tml.cr = Math.min(tml.cr, tmsLimit.MaxTileCol);
                            tml.rt = Math.max(tml.rt, tmsLimit.MinTileRow);
                            tml.rb = Math.min(tml.rb, tmsLimit.MaxTileRow);
                        }
                    }
                    if (tml.cl <= tml.cr && tml.rt <= tml.rb) {
                        schema.tileMatrixLimits.push(tml);
                    }
                });
            }
            result[i] = schema;
        }
        return result;
    }

    getGetTilePattern(layer) {
        var result = "";
        var olSource = layer.wrap.layer.getSource();
        if (olSource.getUrls) {
            result = olSource.getUrls()[0];
        }
        if (layer.options.encoding !== Consts.WMTSEncoding.RESTFUL) {
            if (result.indexOf('?') < 0) {
                result = result + '?';
            }
            if (result.indexOf('?') === result.length - 1) {
                result = result + 'layer=' + layer.layerNames + '&style=default&tilematrixset=' + encodeURIComponent(layer.matrixSet) +
                    '&Service=WMTS&Request=GetTile&Version=1.0.0&Format=' + encodeURIComponent(layer.format) +
                    '&TileMatrix={TileMatrix}&TileCol={TileCol}&TileRow={TileRow}';
            }
        }
        return result;
    }
}
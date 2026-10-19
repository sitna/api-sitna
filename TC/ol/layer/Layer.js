import EventTarget from "../../EventTarget.js";
import Consts from "../../Consts.js";
import Util from "../../Util.js";
import wrap from "../../wrap.js";
import { getUnitRatio } from "../ol.js";
import { Layer } from 'ol/layer.js';
import RenderEventType from 'ol/render/EventType.js';

const createPathFromGeometry = function (geometry) {
    const result = new Path2D();
    const p0 = geometry[0];
    result.moveTo(p0[0], p0[1]);
    for (var i = 1, ii = geometry.length; i < ii; i++) {
        const p = geometry[i];
        result.lineTo(p[0], p[1]);
    }
    result.closePath();
    return result;
};

const getPixelRatioScaledPath = function (path) {
    const result = new Path2D();
    result.addPath(path, new DOMMatrix('scale(' + window.devicePixelRatio + ')'));
    return result;
};

const execCanvasOperation = function (geometry, operationName, prerenderHandler, postrenderHandler) {
    const self = this;
    const prerenderHandlerName = `_${operationName}PrerenderHandler`;
    const postrenderHandlerName = `_${operationName}PostrenderHandler`;
    if (self[prerenderHandlerName]) {
        self.layer.un(RenderEventType.PRERENDER, self[prerenderHandlerName]);
        delete self[prerenderHandlerName];
        self.layer.un(RenderEventType.POSTRENDER, self[postrenderHandlerName]);
        delete self[postrenderHandlerName];
    }

    if (geometry) {
        self[prerenderHandlerName] = prerenderHandler;
        self.layer.on(RenderEventType.PRERENDER, self[prerenderHandlerName]);

        self[postrenderHandlerName] = postrenderHandler;
        self.layer.on(RenderEventType.POSTRENDER, self[postrenderHandlerName]);
    }

    self.parent.map.wrap.map.render();
};

class LayerWrapper extends EventTarget {
    layer = null;
    parent = null;
    constructor(parent) {
        super();
        this.parent = parent;
    }

    getLayer() {
        if (this.layer) {
            return Promise.resolve(this.layer);
        }
        return this._promise;
    }

    setLayer(olLayer) {
        this.layer = olLayer;
    }

    getVisibility() {
        var result = false;
        if (this.layer) {
            result = this.layer.getVisible();
        }
        return result;
    }

    setVisibility(visible) {
        this.getLayer().then(function (layer) {
            layer.setVisible(visible);
        });
    }

    async setOpacity(opacity) {
        const olLayer = await this.getLayer();
        olLayer.setOpacity(opacity);
    }

    isNative(layer) {
        return layer instanceof Layer;
    }

    setProjection(options = {}) {
        const layer = this.parent;
        if (layer.map) {
            const unitRatio = getUnitRatio.call(this, {
                crs: options.crs,
                extentInDegrees: ol.proj.transformExtent(layer.map.getExtent(), layer.map.crs, 'EPSG:4326')
            });

            var resolutions = layer.getResolutions();
            if (resolutions && resolutions.length) {
                resolutions = resolutions.map(function (r) {
                    return r / unitRatio;
                });
                layer.wrap.layer.setMaxResolution(resolutions[0]);
                layer.wrap.layer.setMinResolution(resolutions[resolutions.length - 1]);
            }
            else {
                // de metros a grados
                if (options.oldCrs && ol.proj.get(options.oldCrs).getUnits() === Consts.units.METERS && (!ol.proj.get(options.crs).getUnits() || ol.proj.get(options.crs).getUnits() === Consts.units.DEGREES)) {

                    if (layer.minResolution) {
                        layer.minResolution = layer.minResolution / unitRatio;
                        this.layer.setMinResolution(layer.minResolution);
                    }

                    if (layer.maxResolution) {
                        layer.maxResolution = layer.maxResolution / unitRatio;
                        this.layer.setMaxResolution(layer.maxResolution);
                    }

                    // de grados a metros
                } else if (options.oldCrs && ol.proj.get(options.oldCrs).getUnits() === Consts.units.DEGREES && ol.proj.get(options.crs).getUnits() === Consts.units.METERS) {
                    var metersPerDegree = Util.getMetersPerDegree(ol.proj.transformExtent(layer.map.getExtent(), layer.map.crs, 'EPSG:4326'));

                    if (layer.minResolution) {
                        layer.minResolution = layer.minResolution * metersPerDegree;
                        this.layer.setMinResolution(layer.minResolution);
                    }

                    if (layer.maxResolution) {
                        layer.maxResolution = layer.maxResolution * metersPerDegree;
                        this.layer.setMaxResolution(layer.maxResolution);
                    }
                }
            }
        }
    }

    clip(geometry) {
        const self = this;
        execCanvasOperation.call(self, geometry, 'clip', function (e) {
            let geom = geometry;
            if (Util.isFunction(geometry)) {
                geom = geometry.call(self._wrap);
            }
            if (!(geom instanceof Path2D)) {
                geom = createPathFromGeometry(geom);
            }
            geom = getPixelRatioScaledPath(geom);
            const ctx = e.context;
            ctx.save();
            ctx.clip(geom, 'evenodd');
        }, function (e) {
            e.context.restore();
        });
    }

    stroke(geometry, style) {
        const self = this;
        execCanvasOperation.call(self, geometry, 'stroke', function (_e) {
        }, function (e) {
            let geom = geometry;
            if (Util.isFunction(geometry)) {
                geom = geometry.call(self._wrap);
            }
            if (!(geom instanceof Path2D)) {
                geom = createPathFromGeometry(geom);
            }
            geom = getPixelRatioScaledPath(geom);
            const ctx = e.context;
            if (style.strokeWidth) {
                ctx.lineWidth = style.strokeWidth;
            }
            if (style.strokeColor) {
                ctx.strokeStyle = style.strokeColor;
            }
            ctx.stroke(geom);
        });
    }

    
    addCommonEvents(layer) {
        layer.on('change:visible', () => {
            if (this.parent.map) {
                this.parent.map.trigger(Consts.event.LAYERVISIBILITY, {
                    layer: this.parent
                });
            }
        }, this.parent.map);
    }
}

wrap.Layer = LayerWrapper;
wrap.layer ??= {};
export default LayerWrapper;
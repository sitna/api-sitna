import ControlWrapper from '../wrap/Control.js';
import Consts from '../Consts.js';
import { createNativeStyle, getResolutionOptions } from './ol.js';
import { OverviewMap } from 'ol/control.js';
import Util from '../Util.js';

// Modificación para cambiar el comportamiento de ol.control.OverviewMap:
// Mantener la caja del extent siempre centrada.
OverviewMap.prototype._validateExtent_ = OverviewMap.prototype.validateExtent_;
OverviewMap.prototype.validateExtent_ = function () {
    var self = this;
    self._validateExtent_();
    if (self._wrap && self._wrap.parent.options.alwaysCentered) {
        self.recenter_();
    }
};

// Modificación para evitar un assertion error al cambiar a una vista de capa dinámica
OverviewMap.prototype._bindView_ = OverviewMap.prototype.bindView_;
OverviewMap.prototype.bindView_ = function (view) {
    const self = this;
    const oldView = self.getOverviewMap().getView();
    const result = OverviewMap.prototype._bindView_.call(self, view);
    const newView = self.getOverviewMap().getView();
    const parentView = self._wrap.parent.map.wrap.map.getView();
    if (!newView.getCenter()) {
        newView.setCenter(parentView.getCenter());
    }
    if (!newView.getResolution()) {
        newView.setResolution(oldView.getResolution());
    }
    return result;
};

// En modo 3D, cambiar la lógica de la escala para que siempre muestre área de visión.
OverviewMap.prototype._resetExtent_ = OverviewMap.prototype.resetExtent_;
OverviewMap.prototype.resetExtent_ = function () {
    var self = this;
    self._resetExtent_.call(self);
    var wrap = self._wrap;
    if (wrap.is3D) {
        var ovmap = self.getOverviewMap();
        var ovview = ovmap.getView();
        var extent = ovview.calculateExtent();
        var feature = wrap.get3DCameraLayer().getSource().getFeatures()[0];
        if (feature) {
            const coordinates = feature.getGeometry().getCoordinates();
            var coord1 = coordinates[0][0];
            var coord2 = coordinates[0][1];
            if (!ol.extent.containsCoordinate(extent, coord1) || !ol.extent.containsCoordinate(extent, coord2)) {
                var buffer = Math.max(
                    extent[0] - coord1[0],
                    extent[1] - coord1[1],
                    coord1[0] - extent[2],
                    coord1[1] - extent[3],
                    extent[0] - coord2[0],
                    extent[1] - coord2[1],
                    coord2[0] - extent[2],
                    coord2[1] - extent[3]
                );
                ovview.fit(ol.extent.buffer(extent, buffer));
            }
        }
    }
};

// Por defecto si establecemos una posición de la caja que tiene el mismo centro que antes, el posicionamiento en píxels del viewport no se actualiza
// porque setPosition no lanza el evento de cambio de valor. Parche para evitarlo.
OverviewMap.prototype._updateBox_ = OverviewMap.prototype.updateBox_;
OverviewMap.prototype.updateBox_ = function () {
    const self = this;
    self._updateBox_.call(self);
    self.boxOverlay_.handlePositionChanged();
};

export default class OverviewMapWrapper extends ControlWrapper {
    async register(map) {
        const self = this;

        await map.loaded(); // Para dar tiempo a que se instancie la capa de fondo
        const olLayer = await self.parent.layer.wrap.getLayer();
        const olMap = await map.wrap.getMap();
        if (self.ovMap) {
            olMap.removeControl(self.ovMap);
        }
        self.ovMap = new OverviewMap({
            target: self.parent.div,
            collapsed: false,
            collapsible: false,
            className: self.parent.CLASS + ' ol-overviewmap',
            layers: [olLayer]
        });
        self.ovMap._wrap = self;

        /* 08/02/2019 GLS: 
            Establecemos el pixelRatio siempre a uno (aunque el control instancie un olMap internamente no admite el paso de la opción pixelRatio,
            imposible de entender, por eso lo hago directamente), porque OL sólo atiende al valor al principio,
            si después se hace zoom in/out del navegador, OL no atiende el cambio lo que provoca que el mapa se vea borroso, click se sitúa mal,
            popup se sitúa entre otros efectos.
            Lo gestionamos nosotros hasta que lo soporten del todo. Relacionado con las tareas/bugs:
                Bug 25976:Mapa situación en blanco
                Bug 25954:Canvas en blanco con zoom mayor al 100%
                Bug 23855:Mapa de situación se muestra en blanco
        */
        self.ovMap.getOverviewMap().pixelRatio_ = 1;

        //// Quitamos el drag&drop añadido en OL 4.1.0 machacando el overlay
        //self.ovMap.getOverviewMap().removeOverlay(self.ovMap.boxOverlay_);
        //var box = document.createElement('DIV');
        //box.className = 'ol-overviewmap-box';
        //box.style.boxSizing = 'border-box';
        //self.ovMap.boxOverlay_ = new ol.Overlay({
        //    position: [0, 0],
        //    positioning: olOverlayPositioning.CENTER_CENTER,
        //    element: box
        //});
        //self.ovMap.getOverviewMap().addOverlay(self.ovMap.boxOverlay_);

        // mantenemos el ancho y alto del canvas en números enteros
        self.manageSize.call(self.ovMap.getOverviewMap());

        self.ovMap.boxOverlay_.autoPan = false;
        self._boxElm = self.ovMap.boxOverlay_.getElement();

        self._boxElm.addEventListener('pointerup', function (_e) {
            setTimeout(() => {
                map.setCenter(olMap.getView().getCenter());
            }, 100);
        });

        // Modificamos mapa para que tenga la proyección correcta
        self.reset();

        const load = self.parent.div.querySelector('.' + self.parent.CLASS + '-load');
        olLayer._wrap.$events.on(Consts.event.BEFORETILELOAD, function () {
            load.classList.remove(Consts.classes.HIDDEN);
            load.classList.add(Consts.classes.VISIBLE);
        });
        olLayer._wrap.$events.on(Consts.event.TILELOAD, function () {
            load.classList.remove(Consts.classes.VISIBLE);
            load.classList.add(Consts.classes.HIDDEN);
        });

        olMap.addControl(self.ovMap);

        self.parent.isLoaded = true;
        self.parent.trigger(Consts.event.MAPLOAD);

        return self;
    }

    async reset(options = {}) {
        const self = this;
        const setLayer = async function (layer, crs) {
            if (layer.type === Consts.layerType.WMTS) {
                var layerProjectionOptions = { crs: crs || self.parent.map.crs, oldCrs: layer.wrap.layer.getSource().getProjection().getCode() }; // , allowFallbackLayer: true

                if (!Util.CRSCodesEqual(layerProjectionOptions.oldCrs, layerProjectionOptions.crs)) {
                    layer.setProjection(layerProjectionOptions);
                }
            }

            const olLayer = await layer.wrap.getLayer();

            const viewOptions = getResolutionOptions(self.parent.map.wrap, olLayer._wrap.parent);

            var olView = new ol.View(viewOptions);
            const olMap = self.ovMap.getOverviewMap();

            if (olView.getResolutions() || olView.getProjection().getCode() !== olMap.getView().getProjection().getCode()) {
                olMap.setView(olView);
            }

            // para controlar el mapa en blanco en IE en la carga inicial
            olLayer._wrap.$events.one(Consts.event.TILELOAD, function () {
                olMap.getLayers().getArray()[0].getSource().refresh();
            });

            if (layer !== self.parent.layer || olMap.getLayers().getArray().indexOf(layer) === -1) {

                self.parent.map.trigger(Consts.event.OVERVIEWBASELAYERCHANGE, { oldLayer: layer !== self.parent.layer ? self.parent.layer : null, newLayer: layer });
                olMap.getLayers().forEach(function (l) {
                    if (l instanceof ol.layer.Image || l instanceof ol.layer.Tile) {
                        olMap.removeLayer(l);
                    }
                });

                const load = self.parent.div.querySelector('.' + self.parent.CLASS + '-load');
                olLayer._wrap.$events.on(Consts.event.BEFORETILELOAD, function () {
                    load.classList.remove(Consts.classes.HIDDEN);
                    load.classList.add(Consts.classes.VISIBLE);
                });
                olLayer._wrap.$events.on(Consts.event.TILELOAD, function () {
                    load.classList.remove(Consts.classes.VISIBLE);
                    load.classList.add(Consts.classes.HIDDEN);
                });

                olMap.getLayers().insertAt(0, olLayer); // GLS: no usamos .addLayer(olLayer) para asegurar que la capa a añadir quede como fondo.
            }

            return layer;
        };

        var layer = options.layer || self.parent.layer;
        if (self.parent.map && layer && self.ovMap) {

            await layer.getCapabilitiesPromise();

            var originalLayer = layer;

            if (!layer.isCompatible(self.parent.map.crs) && layer.wrap.getCompatibleMatrixSets(self.parent.map.crs).length === 0) {
                layer = layer.getFallbackLayer() || self.parent.defaultLayer;

                await layer.getCapabilitiesPromise();
                if (self.parent.map.on3DView && !layer.isCompatible(self.parent.map.crs)) {
                    const projList = await self.parent.map.loadProjections({
                        crsList: originalLayer.getCompatibleCRS(),
                        orderBy: 'name'
                    })
                    return await setLayer(originalLayer, projList[0].code);
                } else if (layer.isCompatible(self.parent.map.crs)) {
                    return await setLayer(layer);
                }
            } else {
                return await setLayer(layer);
            }
        }
        return null;
    }

    get3DCameraLayer() {
        var self = this;
        var result = null;
        var camLayerId = '3DCamera';
        var ovMap;

        if (self.ovMap) {
            ovMap = self.ovMap.getOverviewMap();
            ovMap.getLayers().forEach(function (elm) {
                if (elm.get('id') === camLayerId) {
                    result = elm;
                }
            });

            if (!result) {
                const styleOptions = {
                    styles: {
                        polygon: Object.assign({}, self.parent.map.options.styles?.polygon)
                    }
                };
                let fovStyle = createNativeStyle(styleOptions);
                if (Util.isFunction(fovStyle)) {
                    fovStyle = fovStyle();
                }
                // Ponemos los cuadriláteros de fov sin relleno (por legibilidad)
                fovStyle[0].getFill().setColor([0, 0, 0, 0]);
                result = new ol.layer.Vector({
                    id: camLayerId,
                    source: new ol.source.Vector(),
                    style: fovStyle
                });
                ovMap.addLayer(result);
            }
        }
        return result;
    }

    draw3DCamera(options) {
        var self = this;

        if (this.parent.map.isLoaded) {
            self.is3D = !!options;
            var camLayer = self.get3DCameraLayer();
            if (camLayer) {
                var feature;
                options = options || {};
                var fov = options.fov;
                var source = camLayer.getSource();
                if (!fov || !fov.length) { // no vemos terreno o no estamos en vista 3D
                    source.clear();
                }
                else {
                    var features = source.getFeatures();
                    if (!features.length) {
                        feature = new ol.Feature();
                        source.addFeature(feature);
                    }
                    else {
                        feature = features[0];
                    }
                    feature.setGeometry(new ol.geom.Polygon([fov]));
                }
                var heading = typeof options.heading === 'number' ? options.heading : 0;
                if (options.position) {
                    const olMap = self.ovMap.getOverviewMap();
                    const centerPoint = olMap.getPixelFromCoordinate(olMap.getView().getCenter());
                    if (centerPoint) {
                        const [px, py] = olMap.getPixelFromCoordinate(options.position);
                        const dx = px - centerPoint[0];
                        const dy = py - centerPoint[1];
                        const cosTheta = Math.cos(-heading);
                        const sinTheta = Math.sin(-heading);
                        const rotatedDx = cosTheta * dx - sinTheta * dy;
                        const rotatedDy = sinTheta * dx + cosTheta * dy;
                        self._boxElm.style.transform = `translate(${rotatedDx}px, ${rotatedDy}px)`;
                    }
                }
                self._boxElm.style.rotate = heading + 'rad';
            }
        }
    }

    enable() {
        var self = this;
        if (self.parent.layer && self.parent.layer.setVisibility) {
            self.parent.layer.setVisibility(true);

            /* GLS: bug 23855: mapa de situación se muestra en blanco
                En el resize se valida el alto y el ancho y como el div padre (id = "ovmap") tiene display: none, 
                el ancho y el alto devuelven cero y por ello se muestra en blanco. 
                No vale con lanzar .trigger('resize') porque no utiliza los valores actuales del div, 
                sino los almacenados, por eso llamamos a updateSize que actualiza dichos valores.
                https://tfsapp.tracasa.es:8088/tfs/web/wi.aspx?pcguid=4819cc6e-400e-4f70-ba7c-c18a830405aa&id=23855                
            */
            self.parent.wrap.ovMap.getOverviewMap().updateSize();

            // Lo siguiente es para actualizar mapa de situación
            const resizeEvent = document.createEvent('HTMLEvents');
            resizeEvent.initEvent('resize', false, false);
            self.parent.map.div.dispatchEvent(resizeEvent);
        }
        self.ovMap.resetExtent_();
        self.ovMap.updateBoxAfterOvmapIsRendered_();
        if (self.parent.map.on3DView) {
            self.parent.map.view3D.cameraControls.postRender();
        }
    }

    disable() {
        var self = this;
        if (self.parent.layer && self.parent.layer.setVisibility) {
            self.parent.layer.setVisibility(false);
        }
    }

    manageSize() {
        const self = this;

        TC.wrap.Map.prototype.manageSize.call(self);
    }
}
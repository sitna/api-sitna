import { LineString, MultiLineString } from 'ol/geom.js';
import { hitTolerance, setSnapping, createNativeStyle } from './ol.js';
import TC from '../../TC.js';
import ControlWrapper from '../wrap/Control.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import Polyline from '../../SITNA/feature/Polyline.js';
import MultiPolyline from '../../SITNA/feature/MultiPolyline.js';
import ControlEvent from '../../SITNA/control/ControlEvent.js';

const MOUSEMOVE = 'mousemove';
const MOUSEOVER = 'mouseover';

const olGeometryType = {
    POINT: 'Point',
    MULTI_POINT: 'MultiPoint',
    LINE_STRING: 'LineString',
    MULTI_LINE_STRING: 'MultiLineString',
    POLYGON: 'Polygon',
    MULTI_POLYGON: 'MultiPolygon'
};

const removeZeros = function (geometry) {
    const layoutLength = geometry.getLayout().length;
    for (let i = 0; i < geometry.flatCoordinates.length; i++) {
        // OpenLayers añade valores 0 en todas las coordenadas de los puntos que no son X ni Y.
        // Esto introduce datos falsos en el perfil de elevación, así que los quitamos.
        if (i % layoutLength > 1) geometry.flatCoordinates[i] = null;
    }
};

// Función para reproyectar el dibujo actual
const drawProjectionChangeHandler = function (ctl, e) {
    if (ctl.sketch) {
        const oldProj = e.oldValue.getProjection();
        const newProj = e.target.get(e.key).getProjection();
        if (oldProj.getCode() !== newProj.getCode()) {
            const geom = ctl.sketch.getGeometry();
            geom.transform(oldProj, newProj);
            ctl.interaction.sketchPoint_.getGeometry().transform(oldProj, newProj);
            const flatCoordinates = [];
            var sketchCoords;
            if (ctl.parent.mode === Consts.geom.POLYGON) {
                sketchCoords = ctl.interaction.sketchCoords_[0];
            }
            else {
                sketchCoords = ctl.interaction.sketchCoords_;
            }
            ol.geom.flat.deflateCoordinates(flatCoordinates, 0, sketchCoords, geom.stride);
            const transformFn = ol.proj.getTransform(oldProj, newProj);
            transformFn(flatCoordinates, flatCoordinates, geom.stride);
            sketchCoords = ol.geom.flat.inflateCoordinates(flatCoordinates, 0, flatCoordinates.length, geom.stride);
            if (ctl.parent.mode === Consts.geom.POLYGON) {
                ctl.interaction.sketchCoords_ = [sketchCoords];
            }
            else {
                ctl.interaction.sketchCoords_ = sketchCoords;
            }
        }
    }
};

const getStyleOptionsFromMode = function (mode, style) {
    const styleOptions = {};
    switch (mode) {
        case Consts.geom.POLYGON:
        case Consts.geom.MULTIPOLYGON:
            styleOptions.styles = {
                polygon: style,
                line: false,
                point: false
            };
            break;
        case Consts.geom.POINT:
        case Consts.geom.MULTIPOINT:
            styleOptions.styles = {
                point: style,
                line: false,
                polygon: false
            };
            break;
        default:
            styleOptions.styles = {
                line: style,
                point: false,
                polygon: false
            };
    }
    return styleOptions;
};

export default class EditWrapper extends ControlWrapper {
    
    mouseMoveHandler(_evt) {
        if (this.sketch) {
            this.parent.trigger(Consts.event.MEASUREPARTIAL, this.getMeasureData());
        }
    }

    mouseOverHandler(_evt) {
        if (this.sketch && this.hoverCoordinate) {
            this.pushCoordinate(this.hoverCoordinate);
            this.hoverCoordinate = null;
        }
    }

    clickHandler(evt) {
        const self = this;
        if (self.parent?.map?.view === Consts.view.PRINTING) {
            return;
        }
        if (self._mdPx) { // No operamos si el clic es consecuencia es en realidad un drag
            const dx = self._mdPx[0] - evt.clientX;
            const dy = self._mdPx[1] - evt.clientY;
            if (dx * dx + dy * dy > self.interaction.squaredClickTolerance_) {
                return;
            }
        }
        if (self.sketch) {
            removeZeros(self.sketch.getGeometry());
            var coords = self.sketch.getGeometry().getCoordinates();
            self.parent.dispatchEvent(new ControlEvent(ControlEvent.type.POINTDRAW, { point: coords.at(-1) }));
        }
    }

    pointerdownHandler(evt) {
        this._mdPx = [evt.clientX, evt.clientY];
    }

    getMeasureData() {
        const self = this;

        const formatCoords = function (point, data) {
            data.coordinates = point.getCoordinates();
        };

        const formatLength = function (line, data) {
            const projectedLine = new line.constructor(Util.reproject(line.getCoordinates(), self.parent.map.crs, self.parent.map.options.utmCrs));
            if (projectedLine.getLineStrings) {
                data.length = projectedLine.getLineStrings().reduce((len, ls) => len + ls.getLength(), 0);
            }
            else {
                data.length = projectedLine.getLength();
            }
            if (self._extendedFeature) {
                const extendedFeatureGeometry = self._extendedFeature.getGeometry();
                if (extendedFeatureGeometry !== line) {
                    const extendedFeatureData = {};
                    formatLength(extendedFeatureGeometry, extendedFeatureData);
                    if (extendedFeatureData.length) {
                        data.length += extendedFeatureData.length;
                    }
                }
            }
        };

        const formatArea = function (polygon, data) {
            if (polygon instanceof ol.geom.MultiPolygon) {
                polygon.getPolygons().forEach(pol => {
                    formatArea(pol, data);
                });
                polygon = polygon.getPolygon(0);
            }
            else {
                const projectedPolygon = new ol.geom.Polygon([Util.reproject(polygon.getLinearRing(0).getCoordinates(), self.parent.map.crs, self.parent.map.options.utmCrs)]);
                data.area ??= 0;
                data.area += projectedPolygon.getArea();
                var ring = projectedPolygon.getLinearRing(0);
                data.perimeter ??= 0;
                data.perimeter += ol.geom.flat.linearRingLength(ring.flatCoordinates, 0, ring.flatCoordinates.length, ring.stride);
            }
        };

        const result = {
            units: Consts.units.METERS
        };
        if (this.sketch) {
            var geom = this.sketch.getGeometry();
            if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon) {
                formatArea(geom, result);
            }
            else if (geom instanceof ol.geom.LineString || geom instanceof ol.geom.MultiLineString) {
                formatLength(geom, result);
            }
            else if (geom instanceof ol.geom.Point) {
                formatCoords(geom, result);
            }
        }

        return result;
    }

    getSketch() {
        const self = this;
        if (self.sketch) {
            // la opción standalone: false es para que no se cree el objeto #initialCoordinates, porque la entidad está todavía en 
            // proceso de creación.
            return TC.wrap.Feature.createFeature(self.sketch, { standalone: false });
        }
        return null;
    }

    getExtendedFeature() {
        const self = this;
        if (self._extendedFeature) {
            return TC.wrap.Feature.createFeature(self._extendedFeature, { standalone: false });
        }
        return null;
    }

    activate(mode) {
        var self = this;

        var type;
        switch (mode) {
            case Consts.geom.POLYGON:
                type = olGeometryType.POLYGON;
                break;
            case Consts.geom.MULTIPOLYGON:
                type = olGeometryType.MULTI_POLYGON;
                break;
            case Consts.geom.POINT:
                type = olGeometryType.POINT;
                break;
            case Consts.geom.MULTIPOINT:
                type = olGeometryType.MULTI_POINT;
                break;
            case Consts.geom.MULTIPOLYLINE:
                type = olGeometryType.MULTI_LINE_STRING;
                break;
            default:
                type = olGeometryType.LINE_STRING;
                break;
        }

        if (self.parent.map) {
            Promise.all([self.parent.map.wrap.getMap(), self.parent.getLayer()]).then(function (objects) {
                const olMap = objects[0];
                const layer = objects[1];
                if (layer) {
                    layer.wrap.getLayer().then(function (olLayer) {

                        if (!self.viewport) self.viewport = olMap.getViewport();

                        const clickEvent = Consts.event.CLICK === 'touchstart' ? 'touchend' : Consts.event.CLICK;

                        if (self.interaction) {
                            olMap.removeInteraction(self.interaction);
                            if (self._pointerdownHandler) {
                                self.viewport.removeEventListener('pointerdown', self._pointerdownHandler);
                                self._pointerdownHandler = null;
                            }
                            if (self._clickHandler) {
                                self.viewport.removeEventListener(clickEvent, self._clickHandler);
                                self._clickHandler = null;
                            }
                            if (self._mouseMoveHandler && self._mouseOverHandler) {
                                self.viewport.removeEventListener(MOUSEMOVE, self._mouseMoveHandler);
                                self.viewport.removeEventListener(MOUSEOVER, self._mouseOverHandler);
                            }
                        }

                        if (mode) {
                            self._pointerdownHandler = self.pointerdownHandler.bind(self);
                            self._clickHandler = self.clickHandler.bind(self);
                            self.viewport.addEventListener('pointerdown', self._pointerdownHandler);
                            self.viewport.addEventListener(clickEvent, self._clickHandler);
                            if (self.parent.measurer) {
                                self._mouseMoveHandler = self.mouseMoveHandler.bind(self);
                                self._mouseOverHandler = self.mouseOverHandler.bind(self);
                                self.viewport.addEventListener(MOUSEMOVE, self._mouseMoveHandler);
                                self.viewport.addEventListener(MOUSEOVER, self._mouseOverHandler);
                            }

                            const getLayout = function (layer) {
                                let layout;
                                layer.getSource().getFeatures().forEach((f) => {
                                    const l = f.getGeometry().getLayout();
                                    if (l !== 'XY') {
                                        layout = l;
                                    }
                                });
                                return layout;
                            }

                            var drawOptions = {
                                type: type,
                                snapTolerance: 0,
                                condition: function () {
                                    if (ol.events.condition.shiftKeyOnly(arguments[0])) {
                                        olMap.forEachFeatureAtPixel(olMap.getPixelFromCoordinate(arguments[0].coordinate), function (feature) {
                                            if (olGeometryType.POLYGON === feature.getGeometry().getType() ||
                                                olGeometryType.MULTI_POLYGON === feature.getGeometry().getType()) {
                                                return feature;
                                            }
                                            return null;
                                        },
                                            {
                                                hitTolerance,
                                            });
                                    }

                                    if (self.parent?.map?.view === Consts.view.PRINTING) {
                                        return null;
                                    }

                                    return true;
                                },
                                geometryLayout: getLayout(olLayer)
                            };
                            if (olLayer) {
                                drawOptions.source = olLayer.getSource();
                            }
                            if (mode === Consts.geom.RECTANGLE) {
                                drawOptions.type = olGeometryType.LINE_STRING;
                                drawOptions.maxPoints = 2;
                                drawOptions.geometryFunction = function (coordinates, geometry) {
                                    const start = coordinates[0];
                                    const end = coordinates[1];
                                    const newCoords = [[start, [start[0], end[1]], end, [end[0], start[1]], start]];
                                    if (geometry) {
                                        geometry.setCoordinates(newCoords);
                                    }
                                    else {
                                        geometry = new ol.geom.Polygon(newCoords);
                                    }
                                    return geometry;
                                };
                            }

                            self.interaction = new ol.interaction.Draw(drawOptions);

                            self.setStyle();

                            self.interaction.on('drawstart', function (evt) {
                                self.sketch = evt.feature;

                                if (self._extending) {
                                    // Ñapa para arreglar bug de ol.interaction.Draw: 
                                    // El último vértice del sketch se duplica.
                                    // Esto es correcto y se utiliza para el funcionamiento interno de la interacción.
                                    // Lo que no es correcto es que replica la z y la m aparte de la x y la y.
                                    // Esto es un problema cuando se extiende una línea existente.
                                    const lastSketchCoord = self.interaction.sketchCoords_.at(-1);
                                    lastSketchCoord.forEach((_val, idx, coord) => {
                                        if (idx > 1) {
                                            coord[idx] = null;
                                        }
                                    });
                                }

                                const eventObject = {};
                                const drawMode = self.parent.mode;
                                if (self._extending) {
                                    eventObject.feature = self.interaction.sketchFeature_._sitnaFeature;
                                }
                                else if (self.parent.extensibleSketch &&
                                    (drawMode === Consts.geom.POLYLINE || drawMode === Consts.geom.MULTIPOLYLINE)) {
                                    const firstPoint = evt.feature.getGeometry().getFirstCoordinate();
                                    const previousFeature = self
                                        .parent
                                        .layer
                                        .features
                                        .filter(f => f instanceof Polyline || f instanceof MultiPolyline)
                                        .find(f => {
                                            const lastPoint = f.wrap.feature.getGeometry().getLastCoordinate();
                                            return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
                                        });
                                    if (previousFeature) {
                                        self._extendFeature(previousFeature);
                                        eventObject.feature = previousFeature;
                                        return;
                                    }
                                }
                                eventObject.extending = self._extending;
                                self.parent.dispatchEvent(new ControlEvent(ControlEvent.type.DRAWSTART, eventObject));
                            }, this);

                            self.interaction.on('drawend', function (evt) {

                                //if (!evt.feature.getStyle()) {
                                //    const featureStyleOptions = getStyleOptionsFromMode(self.parent.mode, self.parent.getStyle());
                                //    evt.feature.setStyle(createNativeStyle(featureStyleOptions));
                                //}
                                if (self.parent.measurer) {
                                    self.parent.trigger(Consts.event.MEASURE, self.getMeasureData());
                                }
                                const endFn = function (feat) {
                                    self.parent.dispatchEvent(new ControlEvent(ControlEvent.type.DRAWEND, { feature: feat }));
                                    self.sketch = null;
                                    self.interaction.setActive(true);
                                };
                                if (self._extending && self._extendedFeature) {
                                    let lineToAdd = self.sketch.getGeometry();
                                    const extendedFeatureGeometry = self._extendedFeature.getGeometry();
                                    lineToAdd = new lineToAdd.constructor(lineToAdd.getCoordinates(), extendedFeatureGeometry.getLayout());
                                    if (lineToAdd instanceof ol.geom.MultiLineString) {
                                        lineToAdd = new ol.geom.LineString(lineToAdd.getLineString(0).getCoordinates());
                                    }
                                    removeZeros(lineToAdd);
                                    extendedFeatureGeometry.appendLineString(lineToAdd);
                                    const feat = self._extendedFeature._wrap.parent;
                                    //feat.setStyle(self.parent.getStyle());
                                    feat.geometry = extendedFeatureGeometry.getCoordinates();
                                    if (olLayer) {
                                        // Necesario timeout porque el evento drawend 
                                        // se lanza antes de añadir la entidad a la capa
                                        setTimeout(() => {
                                            olLayer.getSource().removeFeature(evt.feature);
                                        }, 100);
                                    }
                                    endFn(feat);
                                }
                                else {
                                    const feat = evt.feature._wrap?.parent || TC.wrap.Feature.createFeature(evt.feature, { standalone: false });
                                    if (self.parent.mode === Consts.geom.RECTANGLE) {
                                        const delay = 400;
                                        const dblClickInteraction = self.interaction
                                            .getMap()
                                            .getInteractions()
                                            .getArray()
                                            .find(i => i instanceof ol.interaction.DoubleClickZoom);
                                        // Desactivamos temporalmente el zoom por doble clic para evitar que se lance accidentalmente
                                        if (dblClickInteraction && dblClickInteraction.getActive()) {
                                            dblClickInteraction.setActive(false);
                                            setTimeout(function () {
                                                dblClickInteraction.setActive(true);
                                            }, delay);
                                        }
                                        self.interaction.setActive(false);
                                        setTimeout(() => endFn(feat), delay); // Retardo para evitar pulsaciones accidentales en dobles clics del usuario
                                    }
                                    else {
                                        endFn(feat);
                                    }
                                }
                                delete self._extendedFeature;
                                delete self._extending;
                            }, this);

                            self._projectionChangeHandler = function (e) {
                                drawProjectionChangeHandler(self, e);
                            };
                            olMap.on('change:view', self._projectionChangeHandler);

                            olMap.addInteraction(self.interaction);

                            let snapping = self.parent.getSnapping();
                            const snappingByExtensibleSketch = !snapping && self.parent.extensibleSketch;
                            const isLine = f => {
                                const geom = f.getGeometry();
                                return geom instanceof LineString || geom instanceof MultiLineString;
                            };
                            if (snappingByExtensibleSketch) {
                                snapping = olLayer
                                    .getSource()
                                    .getFeatures()
                                    .filter(isLine)
                                    .map(f => f._wrap.parent);
                            }
                            self.setSnapping(snapping);
                            if (snappingByExtensibleSketch) {
                                const snapInteraction = self.snapInteraction;
                                olLayer.getSource().on('addfeature', function (e) {
                                    if (isLine(e.feature) && self.snapInteraction === snapInteraction) {
                                        self.snapInteraction.addFeature(e.feature);
                                    }
                                });
                            }
                        }

                        self.redoStack = [];
                    });
                }
            });
        }
    }

    setSnapping(snapping) {
        setSnapping(this, snapping);
        if (snapping) {
            this.setStyle();
        }
    }

    deactivate() {
        var self = this;
        if (self.parent.map) {
            self.sketch = null;
            const clickEvent = Consts.event.CLICK === 'touchstart' ? 'touchend' : Consts.event.CLICK;
            if (self.viewport) {
                if (self._pointerdownHandler) {
                    self.viewport.removeEventListener('pointerdown', self._pointerdownHandler);
                    self._pointerdownHandler = null;
                }
                if (self._clickHandler) {
                    self.viewport.removeEventListener(clickEvent, self._clickHandler);
                    self._clickHandler = null;
                }
            }
            Promise.all([self.parent.map.wrap.getMap(), self.parent.getLayer()]).then(function (objects) {
                const olMap = objects[0];
                const layer = objects[1];
                if (layer && self.parent.singleSketch) {
                    layer.clearFeatures();
                }
                if (self.interaction) {
                    olMap.removeInteraction(self.interaction);
                    self.interaction = null;
                }
                if (self._projectionChangeHandler) {
                    olMap.un('change:view', self._projectionChangeHandler);
                }
            });
        }
        if (self.interaction3D) {
            self.interaction3D.deactivate();
        }
    }

    _extendFeature(feature) {
        const self = this;
        self._extending = true;
        const olFeat = feature.wrap.feature;
        if (feature instanceof Polyline) {
            // Siendo polyline podemos usar el método extend de OL
            self.interaction.abortDrawing();
            // Pasamos el sketch a un estado inicial, como si estuviéramos dibujando nuevo
            feature.layer.removeFeature(feature);
            self.interaction.extend(olFeat);
        }
        else {
            // MultiPolyline no es compatible con el método extend de OL
            // Como alternativa, al final de dibujo se añade como segmento a la  entidad del parámetro
            self._extendedFeature = olFeat;
        }
    }

    //El valor devuelto es lo que va al stack de redo
    popCoordinate() {
        const self = this;
        if (self.parent.mode === Consts.geom.RECTANGLE) {
            throw Error('popCoordinate not allowed when drawing rectangles');
        }
        var result = null;
        if (self.interaction) {
            var feature = self.interaction.sketchFeature_;
            if (feature) {
                var coords;
                var geom = feature.getGeometry();

                if (geom instanceof ol.geom.Polygon) {
                    coords = geom.getCoordinates()[0];
                }
                else if (geom instanceof ol.geom.LineString) {
                    coords = geom.getCoordinates();
                }
                if (coords.length > 1) {

                    let points;
                    if (geom instanceof ol.geom.Polygon) {
                        points = self.interaction.sketchCoords_[0];
                    }
                    else if (geom instanceof ol.geom.LineString) {
                        points = self.interaction.sketchCoords_;
                    }

                    /*
                    Al menos con linestring, no necesariamente hay que quitar el último
                    Porque OL mete en coordinates del sketchFeature_ tanto el último marcado como el que flota detrás del cursor
                    Para comprobar que realmente es ése, podemos contrastarlo con self.interaction.sketchPoint_.getGeometry().getCoordinates()
                    */
                    var flyingPointContained = false;
                    if (self.interaction.sketchPoint_) {
                        var flyingPoint = self.interaction.sketchPoint_.getGeometry().getCoordinates();
                        for (var i = 0; i < coords.length; i++) {
                            if (coords[i][0] == flyingPoint[0] && coords[i][1] == flyingPoint[1]) {
                                flyingPointContained = true;
                                break;
                            }
                        }
                    }

                    var index;
                    if (flyingPointContained) index = points.length - 2;
                    else index = points.length - 1;

                    result = points[index];
                    points.splice(index, 1);

                    if (geom instanceof ol.geom.Polygon) {
                        geom.setCoordinates([points]);
                        self.interaction.sketchLine_.getGeometry().setCoordinates(points);
                    }
                    else {
                        geom.setCoordinates(points);
                    }


                    feature.setGeometry(geom);
                }
            }
        }
        else if (self.interaction3D) {
            result = self.interaction3D.popCoordinate();
        }
        return result;
    }

    pushCoordinate(coord) {
        var self = this;
        var result = false;
        if (self.interaction) {
            var feature = self.interaction.sketchFeature_;
            if (feature) {
                var coords;
                var geom = feature.getGeometry();

                if (geom instanceof ol.geom.Polygon) {
                    coords = geom.getCoordinates()[0];
                } else if (geom instanceof ol.geom.LineString) {
                    coords = geom.getCoordinates();
                }
                //coords.push(coord);

                var puntos;
                if (geom instanceof ol.geom.Polygon) {
                    puntos = self.interaction.sketchCoords_[0];
                    //self.interaction.sketchCoords_[0].push(coord);
                    //geom.setCoordinates([fullCoords], 'XY');
                } else if (geom instanceof ol.geom.LineString) {

                    puntos = self.interaction.sketchCoords_;
                }

                //Si hay punto volador, hay que meter la coordenada justo antes
                var flyingPointContained = false;
                if (self.interaction.sketchPoint_) {
                    var flyingPoint = self.interaction.sketchPoint_.getGeometry().getCoordinates();
                    for (var i = 0; i < coords.length; i++) {
                        if (coords[i][0] == flyingPoint[0] && coords[i][1] == flyingPoint[1]) {
                            flyingPointContained = true;
                            break;
                        }
                    }
                }

                let index;
                if (flyingPointContained) {
                    index = puntos.length - 1;
                }
                else {
                    index = puntos.length;
                }
                puntos.splice(index, 0, coord);

                if (geom instanceof ol.geom.LineString)
                    geom.setCoordinates(puntos, 'XY');
                else {
                    geom.setCoordinates([puntos], 'XY');
                    self.interaction.sketchLine_.getGeometry().setCoordinates(puntos);
                    //feature.setGeometry(geom);
                }

                result = true;
            }
        }
        else if (self.interaction3D) {
            self.interaction3D.pushCoordinate(coord);
            result = true;
        }
        return result;
    }

    undo() {
        var self = this;
        var result = false;

        var coord = self.popCoordinate();
        if (coord) {
            self.redoStack.push(coord);
            result = true;
        }

        self.parent.trigger(Consts.event.MEASUREPARTIAL, self.getMeasureData());

        return result;
    }

    redo() {
        var self = this;
        var result = false;

        if (self.redoStack.length > 0) {
            self.pushCoordinate(self.redoStack.pop());
            result = true;
        }

        self.parent.trigger(Consts.event.MEASUREPARTIAL, self.getMeasureData());

        return result;
    }

    end() {
        var self = this;
        if (self.interaction && self.interaction.sketchFeature_)
            self.interaction.finishDrawing();
        else if (self.interaction3D) {
            self.interaction3D.end();
        }
    }

    setStyle() {
        const self = this;
        if (self.interaction) {
            let olStyle;
            const parentStyle = self.parent.getStyle();
            if (parentStyle) {
                const currentMode = self.parent.mode;
                const styleOptions = getStyleOptionsFromMode(currentMode, parentStyle);
                const defaultStyle = createNativeStyle(styleOptions);
                let getSnapStyle, getExtensibleSketchSnapStyle;
                if (self.parent.styles.snapping?.point) {
                    if (self.parent.extensibleSketch &&
                        (currentMode === Consts.geom.POLYLINE || currentMode === Consts.geom.MULTIPOLYLINE)) {
                        const snapStyle = createNativeStyle({
                            styles: Object.assign({}, styleOptions.styles, {
                                point: Object.assign({}, self.parent.styles.snapping.point, {
                                    label: '+',
                                    fontSize: 12,
                                    labelOffset: [8, -8]
                                })
                            })
                        });
                        getExtensibleSketchSnapStyle = coords => {
                            if (!self.sketch) {
                                if (self.parent.layer.wrap.layer
                                    .getSource()
                                    .getFeatures()
                                    .map(f => f.getGeometry())
                                    .filter(g => g instanceof ol.geom.LineString || g instanceof ol.geom.MultiLineString)
                                    .some(g => {
                                        const lastPoint = g.getLastCoordinate();
                                        return coords[0] === lastPoint[0] && coords[1] === lastPoint[1];
                                    })) {
                                    return snapStyle;
                                }
                            }
                        }
                    }
                    if (self.parent.getSnapping() || self.parent.extensibleSketch) {
                        const snapStyle = createNativeStyle({
                            styles: Object.assign({}, styleOptions.styles, {
                                point: Object.assign({}, self.parent.styles.snapping.point)
                            })
                        });
                        getSnapStyle = () => snapStyle;
                    }
                    if (getSnapStyle || getExtensibleSketchSnapStyle) {
                        olStyle = function () {
                            if (self.snapInteraction?._snapData) {
                                const pointCoords = self.snapInteraction._snapData.vertex;
                                const snapStyle = getExtensibleSketchSnapStyle?.(pointCoords) || getSnapStyle(pointCoords);
                                if (snapStyle) {
                                    return snapStyle;
                                }
                            }
                            return defaultStyle;
                        }
                    }
                }
                if (!olStyle) {
                    olStyle = defaultStyle;
                }
                self.interaction.overlay_.setStyle(olStyle);
            }
        }
        //else if (self.interaction3D) {
        //    self.interaction3D.setStyle(self.parent.getStyle());
        //}
    }

    setVisibility(visibility) {
        const self = this;
        if (self.interaction) {
            self.interaction.getOverlay().setVisible(visibility)
        }
        if (self.interaction3D) {
            self.interaction3D.visibility(visibility)
        }
    }

}
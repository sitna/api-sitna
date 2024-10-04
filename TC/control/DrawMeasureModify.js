
/**
  * Opciones del control de dibujo, medida y modificación de geometrías en el mapa.
  * @typedef DrawMeasureModifyOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {boolean|SITNA.ElevationOptions} [displayElevation=false] - Si se establece a un valor verdadero, los puntos dibujados mostrarán la elevación del mapa en las 
  * coordenadas del punto, y las líneas dibujadas mostrarán un gráfico con su perfil de elevación.
  * @property {string} [mode] - Modo de dibujo, es decir, qué tipo de geometría se va a dibujar.
  * 
  * Para establecer el modo hay que darle un valor de [SITNA.Consts.geom]{@link SITNA.Consts}. Este control tiene tres modos:
  * punto, línea y polígono, correspondientes con los valores [SITNA.Consts.geom.POINT]{@link SITNA.Consts},
  * [SITNA.Consts.geom.POLYLINE]{@link SITNA.Consts} y [SITNA.Consts.geom.POLYGON]{@link SITNA.Consts}.
  * 
  * Si esta opción no se especifica, se mostrarán los tres modos en tres pestañas de la interfaz de usuario del control.
  * @example <caption>[Ver en vivo](../examples/cfg.DrawMeasureModifyOptions.html)</caption> {@lang html}
  * <div id="mapa"/>
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Añadimos el control de dibujo, medida y modificación de geometrías en el primer contenedor.
  *     SITNA.Cfg.controls.drawMeasureModify = {
  *         div: "slot1",
  *         displayElevation: { // Se mostrarán elevaciones en los resultados de medida
  *             resolution: 10 // se mostrará un punto en el perfil cada 10 metros
  *         }
  *     };
  *     var map = new SITNA.Map("mapa");
  * </script>
  */

import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Measure from './Measure';
import './Modify';
import './Measurement';
import Point from '../../SITNA/feature/Point';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';
import Popup from './Popup';

TC.control = TC.control || {};

Consts.event.RESULTSPANELCLOSE = Consts.event.RESULTSPANELCLOSE || 'resultspanelclose.tc';
Consts.event.FEATURESSELECT = Consts.event.FEATURESSELECT || "featuresselect.tc";

class DrawMeasureModify extends Measure {
    #selectors = {};
    #clearBtn;
    #downloadBtn;
    #elevationControlPromise;

    constructor() {
        super(...arguments);
        const self = this;

        self._dialogDiv = Util.getDiv(self.options.dialogDiv);
        if (!self.options.dialogDiv) {
            document.body.appendChild(self._dialogDiv);
        }

        self.#selectors.MODE_RADIO_BUTTON = `input[type=radio][name="${self.id}-mode"]`;

        self.persistentDrawControls = true;
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);
        const modifyId = self.getUID();
        const pointDrawControlId = self.getUID();

        const objects = await Promise.all([self.layerPromise, self.renderPromise(), self.getElevationTool()]);
        const layer = objects[0];
        self.elevationProfileActive = !!objects[2];
        if (layer) {
            layer.title = self.getLocaleString('sketch');
        }

        const modify = await self.getModifyControl();
        self.modify = modify;
        modify.containerControl = self;
        modify.id = modifyId;
        modify.snapping = self.snapping;
        modify.setLayer(layer);
        modify
            .on(Consts.event.FEATURESSELECT, function (e) {
                const feature = e.features[e.features.length - 1];
                self.displayFeatureMode(feature);
                self.getElevationControl().then(function (ctl) {
                    if (ctl.resultsPanel && !e.features.some(function (feature) {
                        return ctl.resultsPanel.currentFeature === feature;
                    })) {
                        ctl.resultsPanel.setCurrentFeature(null);
                    }
                });
            })
            .on(Consts.event.FEATURESUNSELECT, function (_e) {
                self.getElevationControl().then(function (ctl) {
                    ctl.resetElevationProfile();
                    if (ctl.resultsPanel) {
                        ctl.resultsPanel.close();
                    }
                });
            })
            .on(Consts.event.FEATUREMODIFY, function (e) {
                if (e.layer === self.layer) {
                    const setMeasures = function (feature) {
                        const measureData = self.getFeatureMeasurementData(feature);
                        self.displayMeasurements(measureData);
                        self.setFeatureMeasurementData(feature);
                    };
                    setMeasures(e.feature);

                    // Si es un punto metemos la elevación en la geometría (porque la mostramos en las medidas)
                    if (e.feature instanceof Point) {
                        self.getElevationTool().then(function (tool) {
                            if (tool) {
                                tool
                                    .setGeometry({
                                        features: [e.feature],
                                        crs: self.map.getCRS()
                                    })
                                    .then(
                                        function (features) {
                                            setMeasures(features[0]);
                                        },
                                        function (e) {
                                            console.warn(e.message);
                                        }
                                    );
                            }
                        });
                    }

                    const popups = self.map.getControlsByClass(Popup);
                    popups.forEach(function (pu) {
                        if (pu.currentFeature === e.feature && pu.isVisible()) {
                            pu.hide();
                        }
                    });
                }
            });

        map
            .on(Consts.event.CONTROLDEACTIVATE, function (e) {
                const control = e.control;
                if (control === self.modify || control === self.lineDrawControl) {
                    self.getElevationControl().then(function (ctl) {
                        ctl.resetElevationProfile();
                        if (ctl.resultsPanel) {
                            if (control === self.modify) {
                                ctl.resultsPanel.setCurrentFeature(null);
                            }
                            ctl.resultsPanel.close();
                        }
                    });
                }
            })
            .on(Consts.event.POPUP + ' ' + Consts.event.DRAWTABLE, function (e) {
                // En líneas queremos mostrar el perfil en vez del popup
                const feature = e.control.currentFeature;
                if (feature instanceof Polyline && self.layer.features.indexOf(feature) >= 0) {
                    if (self.elevationProfileActive) {
                        e.control.hide();
                        self.getElevationControl().then(function (ctl) {
                            if (ctl.resultsPanel) {
                                ctl.resultsPanel.setCurrentFeature(feature);
                                if (ctl.resultsPanel.isMinimized()) {
                                    ctl.resultsPanel.maximize();
                                }
                            }
                            ctl.displayElevationProfile(feature);
                        });
                    }
                }
            })
            .on(Consts.event.PROJECTIONCHANGE, function (e) {
                if (self.elevationChartData) {
                    self.elevationChartData.coords = Util.reproject(self.elevationChartData.coords, e.oldCrs, e.newCrs);
                }
            });


        const lineDrawControl = await self.getLineDrawControl();
        lineDrawControl
            .on(Consts.event.DRAWSTART, function () {
                //self.resetElevationProfile();
                self.getElevationControl().then(function (ctl) {
                    if (ctl.resultsPanel && ctl.resultsPanel.currentFeature) {
                        ctl.resultsPanel.setCurrentFeature(null);
                    }
                    self.resetValues();
                });
                self.getModifyControl().then((ctl) => {
                    ctl.setLabelableState(true);
                    ctl.displayLabelText();
                });
                //self.#beginDraw();
            })
            .on(Consts.event.DRAWUNDO + ' ' + Consts.event.DRAWREDO, function () {
                const lineDrawControl = this;
                self.getElevationControl().then(function (ctl) {
                    if (self.elevationProfileActive) {
                        if (lineDrawControl.historyIndex) {
                            ctl.displayElevationProfile(lineDrawControl.history.slice(0, lineDrawControl.historyIndex));
                        }
                        else {
                            ctl.closeElevationProfile();
                        }
                    }
                });
                self.#cancelDraw();
            })
            .on(Consts.event.DRAWEND, function (e) {
                self.getElevationControl().then(function (ctl) {
                    if (ctl.resultsPanel) {
                        ctl.resultsPanel.currentFeature = e.feature;
                    }
                });
                self.getModifyControl().then((ctl) => {
                    ctl.displayLabelText();
                });
            })
            .on(Consts.event.POINT, function (e) {
                const lineDrawControl = this;
                const coords = lineDrawControl.history.slice(0, lineDrawControl.historyIndex);
                const lastCoord = coords[coords.length - 1];
                if (lastCoord[0] !== e.point[0] || lastCoord[1] !== e.point[1]) {
                    coords.push(e.point);

                }
                self.getElevationControl().then(function (ctl) {
                    if (self.elevationProfileActive) {
                        if (navigator.onLine) {
                            ctl.displayElevationProfile(coords);
                        }
                        else {
                            ctl.closeElevationProfile();
                        }
                    }
                });
                if (e.target.historyIndex === 1)
                    self.#beginDraw();
            })
            .on(Consts.event.STYLECHANGE, function (e) {
                self.onStyleChange(e);
            }).on(Consts.event.DRAWCANCEL, function () {
                self.getModifyControl().then((ctl) => {
                    ctl.setLabelableState(self.layer.features.length > 0);
                    ctl.displayLabelText();
                });
                self.#cancelDraw();
            });

        const polygonDrawControl = await self.getPolygonDrawControl();
        polygonDrawControl
            .on(Consts.event.DRAWSTART, function () {
                self.resetValues();
                self.getModifyControl().then((ctl) => {
                    ctl.setLabelableState(true);
                    ctl.displayLabelText();
                });
                //self.#beginDraw();
            })
            .on(Consts.event.POINT, function (e) {
                if (e.target.historyIndex === 1) {
                    self.#beginDraw();
                }
            })
            .on(Consts.event.DRAWEND, function (_e) {
                self.getModifyControl().then((ctl) => {
                    ctl.displayLabelText();
                });
                //self.getElevationTool().then(function (tool) {
                //    if (tool) {
                //        tool.setGeometry({
                //            features: [e.feature],
                //            crs: self.map.crs
                //        });
                //    }
                //}
            })
            .on(Consts.event.STYLECHANGE, function (e) {
                self.onStyleChange(e);
            })
            .on(Consts.event.DRAWCANCEL + ' ' + Consts.event.DRAWUNDO, function () {
                self.getModifyControl().then((ctl) => {
                    ctl.setLabelableState(self.layer.features.length > 0);
                    ctl.displayLabelText();
                });
                self.#cancelDraw();
            });

        const pointDrawControl = await self.getPointDrawControl();

        pointDrawControl.containerControl = self;
        pointDrawControl.id = pointDrawControlId;
        pointDrawControl.snapping = self.snapping;
        pointDrawControl.setLayer(self.layer);
        self.drawControls.push(pointDrawControl);
        self.pointDrawControl = pointDrawControl;

        self.resetValues();

        pointDrawControl
            .on(Consts.event.DRAWEND, function (e) {
                const updateChanges = function (feat) {
                    self.displayMeasurements({ coordinates: feat.geometry, units: map.wrap.isGeo() || map.on3DView ? 'degrees' : 'm' });
                    self.setFeatureMeasurementData(feat);
                };
                updateChanges(e.feature);
                self.getElevationTool().then(function (tool) {
                    if (tool) {
                        tool.setGeometry({
                            features: [e.feature],
                            crs: self.map.getCRS()
                        }).then(function (features) {
                            updateChanges(features[0]);
                        }, function (e) {
                            console.log(e.message);
                        });
                    }
                });
                self.#beginDraw();
            })
            .on(Consts.event.DRAWCANCEL, function (_e) {
                // Alerta de condición de carrera si no ponemos un timeout:
                // 1- Se llama a cancel de un control Draw.
                // 2- Se llama a deactivate (como es mediante cancel, no se se corta la cadena de activación controles).
                // 3- Si el control activo anterior era otro de los modos de dibujo de Measure, se activa.
                // 4- Se llama a cancel desde aquí.
                // 5- Se llama a deactivate del control que acabamos de activar en 3.
                // El activate de 3 y el deactivate de 5 sobre el mismo control entran en condición de carrera al crear/destruir la interaction
                // por tanto se puede quedar en un estado inconsistente. Para evitar eso, separamos 3 de 5 por el siguiente timeout.
                setTimeout(function () {
                    self.cancel();
                }, 100);
                self.#cancelDraw();
            })
            .on(Consts.event.STYLECHANGE, function (e) {
                self.onStyleChange(e);
            });
        // Desactivamos el método exportState que ya se encarga el control padre de ello
        pointDrawControl.exportsState = false;

        self.#elevationControlPromise = map.addControl('elevation', self.options.displayElevation);

        self.setMode(self.options.mode);

        map
            .on(Consts.event.FEATUREADD, function (e) {
                const layer = e.layer;
                const feature = e.feature;
                if (layer === self.layer) {
                    self.setFeatureMeasurementData(feature);

                    self.getModifyControl().then(function (modify) {
                        modify.displayLabelText(feature.getStyle().label);
                    });
                    self.#clearBtn.disabled = false;
                    self.#downloadBtn.disabled = false;
                }
            })
            .on(Consts.event.FEATUREREMOVE + ' ' + Consts.event.FEATURESCLEAR, function (e) {
                const layer = e.layer;
                if (layer === self.layer) {
                    if (self.layer.features.length === 0) {
                        self.#clearBtn.disabled = true;
                        self.#downloadBtn.disabled = true;
                        self.resetValues();
                        self.#cancelDraw();
                    }
                }
            })
            .on(Consts.event.RESULTSPANELCLOSE, function (e) {
                self.getElevationControl().then(function (ctl) {
                    if (ctl === e.control) {
                        ctl.setCurrentFeature(null);
                    }
                });
            });

        return self;
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-dmm.mjs');
        self.template = module.default;
    }

    async render(callback) {
        const self = this;
        await super.render.call(self);
        self.pointMeasurementControl = self.div.querySelector('sitna-measurement[mode="point"]');
        self.pointMeasurementControl.containerControl = self;
        self.#clearBtn = self.div.querySelector('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-clr');
        self.#clearBtn.addEventListener(Consts.event.CLICK, function (_e) {
            TC.confirm(self.getLocaleString('deleteAll.confirm'), function () {
                self.clear();
                self.#cancelDraw();
            });
        }, { passive: true });
        self.#downloadBtn = self.div.querySelector('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-dl');
        self.#downloadBtn.addEventListener(Consts.event.CLICK, function (_e) {
            self.showSketchDownloadDialog();
        }, { passive: true });

        const showHideBtn = self.div.querySelector('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-hide');
        showHideBtn.addEventListener(Consts.event.CLICK, function (e) {
            const visibility = !e.target.classList.contains(Consts.classes.ACTIVE);
            self.drawControls.forEach(function (dv) {
                dv.layer.setVisibility(visibility);
                if (dv.isActive)
                    dv.wrap.setVisibility(visibility);
            });
            e.target.title = self.getLocaleString(visibility ? "hideSketch" : "showSketch");
            e.target.classList.toggle(Consts.classes.ACTIVE);
        }, { passive: true });

        if (Util.isFunction(callback)) {
            callback();
        }
    }

    displayMode(mode) {
        const self = this;
        if (mode === Consts.geom.POINT) {
            self._activeMode = self.div.querySelector('.tc-ctl-meas-pt');
        }
        if (self.modify) {
            self.modify.div.classList.remove(Consts.classes.COLLAPSED);
        }
        return super.displayMode.call(self, mode);
    }

    displayFeatureMode(feature) {
        const self = this;
        if (feature) {
            self.displayMeasurements(self.getFeatureMeasurementData(feature));
            switch (true) {
                case feature instanceof Polygon:
                case feature instanceof MultiPolygon:
                    self.displayMode(Consts.geom.POLYGON);
                    self.polygonDrawControl.setFeature(feature);
                    break;
                case feature instanceof Polyline:
                case feature instanceof MultiPolyline:
                    self.displayMode(Consts.geom.POLYLINE);
                    self.lineDrawControl.setFeature(feature);
                    if (self.elevationProfileActive) {
                        self.getElevationControl().then(ctl => ctl.displayElevationProfile(feature));
                    }
                    break;
                case feature instanceof Point:
                case feature instanceof MultiPoint:
                    self.displayMode(Consts.geom.POINT);
                    self.pointDrawControl.setFeature(feature);
                    break;
                default:
                    break;
            }
        }
    }

    async setMode(mode) {
        const self = this;
        if (mode === Consts.geom.POINT) {
            const ctl = await self.getPointDrawControl();
            ctl.activate();
            super.setMode.call(self, mode);
            self.#cancelDraw();
        }
        else {
            super.setMode.call(self, mode);
            self.#cancelDraw();
        }
    }

    setModes(modes) {
        const self = this;
        if (!Array.isArray(modes)) {
            modes = [];
        }
        if (modes.indexOf(self.mode) < 0) {
            self.setMode(null);
        }
        const selector = modes.map(m => `[value=${m}]`).join() || '[value]';
        self.div.querySelectorAll(self.#selectors.MODE_RADIO_BUTTON).forEach(function (rb) {
            rb.disabled = !rb.matches(selector);
        });
    }

    async setLayer(layer) {
        const self = this;
        await super.setLayer.call(self, layer);
        for await (const control of [self.getPointDrawControl(), self.getModifyControl()]) {
            control.setLayer(self.layer);
        }
        if (self.layer?.features.length) {
            self.displayFeatureMode(self.layer.features[0]);
        }
    }

    setFeatureMeasurementData(feature) {
        const self = this;
        switch (self.mode) {
            case Consts.geom.POINT:
                self.pointMeasurementControl.setFeatureMeasurementData(feature);
                break;
            case Consts.geom.POLYLINE:
                self.lineMeasurementControl.setFeatureMeasurementData(feature);
                break;
            case Consts.geom.POLYGON:
                self.polygonMeasurementControl.setFeatureMeasurementData(feature);
                break;
            default:
                break;
        }
        return self;
    }

    getFeatureMeasurementData(feature) {
        const self = this;
        const result = {
            units: self.map.wrap.isGeo() || (self.map.on3DView && feature instanceof Point) ? 'degree' : 'm'
            //units: 'm'
        };
        const measureOptions = {
            crs: self.map.getCRS()
        };
        switch (true) {
            case feature instanceof Polygon:
            case feature instanceof MultiPolygon:
                result.area = feature.getArea(measureOptions);
                result.perimeter = feature.getLength(measureOptions);
                break;
            case feature instanceof Polyline:
            case feature instanceof MultiPolyline:
                result.length = feature.getLength(measureOptions);
                self.getElevationControl().then(ctl => {
                    if (self.elevationProfileActive) {
                        ctl.displayElevationProfile(feature);
                    }
                });
                break;
            case feature instanceof Point:
                result.coordinates = feature.geometry;
                break;
            default:
                break;
        }
        return result;
    }

    async getPointMeasurementControl() {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('sitna-measurement[mode="point"]');
    }

    displayMeasurements(options = {}) {
        const self = this;
        super.displayMeasurements.call(self, options);
        if (options.coordinates) {
            self.pointMeasurementControl.displayMeasurement(options);
        }
        return self;
    }

    resetValues() {
        const self = this;
        super.resetValues.call(self);
        self.getPointMeasurementControl().then(ctl => ctl.clearMeasurement());
        return self;
    }

    clear() {
        const self = this;
        self.resetValues();
        self.layer.clearFeatures();
        if (self.modify.isActive) {
            self.modify.deactivate();
        }
        if (self.options.displayElevation) {
            self.getElevationControl().then(function (ctl) {
                ctl.resetElevationProfile();
                if (ctl.resultsPanel) {
                    ctl.resultsPanel.close();
                }
            });
        }
        self.#clearBtn.disabled = true;
        self.#downloadBtn.disabled = true;
        return self;
    }

    showSketchDownloadDialog(_options) {
        const self = this;

        self.getDownloadDialog().then(function (control) {
            var options = {
                title: self.getLocaleString("downloadSketch"),
                fileName: self.getLocaleString('sketch').toLowerCase().replace(' ', '_') + '_' + Util.getFormattedDate(new Date().toString(), true)
            };
            //si el control tiene su propia configuración de elevacion la pasamos para que sobrescriba a la del mapa
            if (self.map.elevation || self.options.displayElevation) {
                options = Object.assign({}, options, {
                    elevation: Object.assign({}, self.map.elevation && self.map.elevation.options, self.options.displayElevation)
                });
            }
            control.open(self.layer.features, options);

        });
        return self;
    }

    onStyleChange(e) {
        const self = this;
        var featureCtor;
        switch (e.target.mode) {
            case Consts.geom.POLYGON:
                featureCtor = Polygon;
                break;
            case Consts.geom.POLYLINE:
                featureCtor = Polyline;
                break;
            case Consts.geom.POINT:
                featureCtor = Point;
                break;
            default:
                break;
        }
        if (featureCtor) {
            self.modify.getSelectedFeatures().forEach(function (feature) {
                if (feature instanceof featureCtor) {
                    const styleOptions = {};
                    if (e.strokeWidth)
                        styleOptions["strokeWidth"] = e.strokeWidth;
                    if (e.strokeColor)
                        styleOptions["strokeColor"] = e.strokeColor;
                    if (e.fillColor)
                        styleOptions["fillColor"] = e.fillColor;
                    if (e.fillOpacity)
                        styleOptions["fillOpacity"] = e.fillOpacity;
                    if (e.fontColor)
                        styleOptions["fontColor"] = e.fontColor;
                    if (e.fontSize)
                        styleOptions["fontSize"] = e.fontSize;
                    if (e.labelOutlineColor)
                        styleOptions["labelOutlineColor"] = e.labelOutlineColor;
                    if (e.labelOutlineWidth)
                        styleOptions["labelOutlineWidth"] = e.labelOutlineWidth;
                    if (e.radius)
                        styleOptions["radius"] = e.radius;

                    //feature._originalStyle[e.property] = e.value;
                    feature.setStyle(styleOptions);
                    //clearTimeout(feature._selectionStyleTimeout);
                    //feature._selectionStyleTimeout = setTimeout(function () {
                    //    feature.setStyle(self.modify.styleFunction(feature));
                    //}, self.options.styleChangeDisplayTimeout || 1000);
                }
            });
        }
    }

    async activateElevationProfile() {
        const self = this;
        self.elevationProfileActive = true;
        var profileDrawn = false;
        const elevationControl = await self.getElevationControl();
        if (self.lineDrawControl.historyIndex > 1) {
            elevationControl.displayElevationProfile(self.lineDrawControl.history.slice(0, self.lineDrawControl.historyIndex));
            profileDrawn = true;
        }
        else {
            const features = self.modify.getActiveFeatures().filter(function (feat) {
                return feat instanceof Polyline;
            });
            if (features.length) {
                const feature = features[features.length - 1];
                elevationControl.displayElevationProfile(feature.geometry);
                profileDrawn = true;
            }
        }
        if (!profileDrawn) {
            elevationControl.resetElevationProfile();
        }
        if (elevationControl.resultsPanel) {
            elevationControl.resultsPanel.show();
        }
    }

    async deactivateElevationProfile() {
        const self = this;
        self.elevationProfileActive = false;
        const elevationControl = await self.getElevationControl();
        elevationControl.resetElevationProfile();
        if (elevationControl.resultsPanel) {
            elevationControl.resultsPanel.close();
        }
    }

    resetElevationProfile() {
        const self = this;
        if (self.options.displayElevation && self.resultsPanelChart) {
            self.elevationChartData = {
                x: [0],
                ele: [0],
                coords: [0, 0, 0],
                upHill: 0,
                downHill: 0
            };
            self.resultsPanelChart.openChart(self.elevationChartData);
        }
    }

    getElevationControl() {
        return this.#elevationControlPromise;
    }

    async getPointDrawControl() {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('.' + super.CLASS + '-pt sitna-draw');
    }

    async getModifyControl() {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('.' + self.CLASS + '-mod sitna-modify');
    }

    #beginDraw() {
        const self = this;
        const showHideBtn = self.div.querySelector('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-hide');
        if (showHideBtn) {
            showHideBtn.disabled = false;
        }
    }

    #cancelDraw() {
        const self = this;
        const showHideBtn = self.div.querySelector('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-hide');
        if (showHideBtn) {
            const layerPromises = this.drawControls.reduce(function (i, a) { return i.concat([a.getLayer()]) }, []);
            Promise.all(layerPromises).then(function () {
                showHideBtn.disabled = !self.drawControls.some(dc => dc.layer.features.length || (dc.isActive && dc.historyIndex > 0));
                showHideBtn.classList.add(Consts.classes.ACTIVE);
                showHideBtn.title = self.getLocaleString("hideSketch");
            });
        }
    }
}

DrawMeasureModify.prototype.CLASS = 'tc-ctl-dmm';
TC.control.DrawMeasureModify = DrawMeasureModify;
export default DrawMeasureModify;
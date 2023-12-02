
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
import Measure from './Measure';
import './Modify';
import './Measurement';
import Point from '../../SITNA/feature/Point';
import MultiPoint from '../../SITNA/feature/MultiPoint';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Polygon from '../../SITNA/feature/Polygon';
import MultiPolygon from '../../SITNA/feature/MultiPolygon';


TC.control = TC.control || {};

const DrawMeasureModify = function () {
    var self = this;

    Measure.apply(self, arguments);

    self._dialogDiv = TC.Util.getDiv(self.options.dialogDiv);
    if (window.$) {
        self._$dialogDiv = $(self._dialogDiv);
    }
    if (!self.options.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
    }

    const cs = self._classSelector = '.' + self.CLASS;
    self._selectors = {
        ELEVATION_CHECKBOX: cs + '-dialog-elev input[type=checkbox]',
        MODE_RADIO_BUTTON: `input[type=radio][name="${self.id}-mode"]`
    };

    self.persistentDrawControls = true;

    self.renderPromise().then(function () {
        self._1stCoordText = self.div.querySelector('.tc-ctl-meas-val-coord-1-t');
        self._2ndCoordText = self.div.querySelector('.tc-ctl-meas-val-coord-2-t');
        self._1stCoordValue = self.div.querySelector('.tc-ctl-meas-val-coord-1-v');
        self._2ndCoordValue = self.div.querySelector('.tc-ctl-meas-val-coord-2-v');
        self._elevationText = self.div.querySelector('.tc-ctl-meas-val-coord-ele-t');
        self._elevationValue = self.div.querySelector('.tc-ctl-meas-val-coord-ele-v');
    });

};

TC.inherit(DrawMeasureModify, Measure);

(function () {
    var ctlProto = DrawMeasureModify.prototype;

    ctlProto.CLASS = 'tc-ctl-dmm';

    Consts.event.RESULTSPANELCLOSE = Consts.event.RESULTSPANELCLOSE || 'resultspanelclose.tc';
    Consts.event.FEATURESSELECT = Consts.event.FEATURESSELECT || "featuresselect.tc";

    ctlProto.loadTemplates = async function () {
        const self = this;
        const module = await import('../templates/tc-ctl-dmm.mjs');
        self.template = module.default;
    };

    ctlProto.render = function (callback) {
        const self = this;
        const promise = self._set1stRenderPromise(Measure.prototype.render.call(self, function () {
            self.pointMeasurementControl = self.div.querySelector('sitna-measurement[mode="point"]');
            self.pointMeasurementControl.containerControl = self;
            self._clearBtn = self.div.querySelector('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-clr');
            self._clearBtn.addEventListener(Consts.event.CLICK, function (_e) {
                TC.confirm(self.getLocaleString('deleteAll.confirm'), function () {
                    self.clear();
                    cancelDraw.apply(self);
                });
            }, { passive: true });
            self._downloadBtn = self.div.querySelector('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-dl');
            self._downloadBtn.addEventListener(Consts.event.CLICK, function (_e) {
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
                e.target.title = self.getLocaleString(visibility ? "hideSketch":"showSketch");
                e.target.classList.toggle(Consts.classes.ACTIVE);
            }, { passive: true });

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        }));
        
        return promise;
    };

    ctlProto.register = async function (map) {
        const self = this;
        await Measure.prototype.register.call(self, map);
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

                    const popups = self.map.getControlsByClass('TC.control.Popup');
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
                    self.elevationChartData.coords = TC.Util.reproject(self.elevationChartData.coords, e.oldCrs, e.newCrs);
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
                //beginDraw.apply(self);
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
                cancelDraw.apply(self);
            })
            .on(Consts.event.DRAWEND, function (e) {
                self.getElevationControl().then(function (ctl) {
                    if (ctl.resultsPanel) {
                        ctl.resultsPanel.currentFeature = e.feature;
                    }
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
                    beginDraw.apply(self);
            })
            .on(Consts.event.STYLECHANGE, function (e) {
                self.onStyleChange(e);
            }).on(Consts.event.DRAWCANCEL, function () {
                cancelDraw.apply(self);
            });

        const polygonDrawControl = await self.getPolygonDrawControl();
        polygonDrawControl
            .on(Consts.event.DRAWSTART, function () {
                self.resetValues();
                //beginDraw.apply(self);
            })
            .on(Consts.event.POINT, function (e) {
                if (e.target.historyIndex === 1)
                    beginDraw.apply(self);
            })
            //.on(Consts.event.DRAWEND, function (e) {
            //    self.getElevationTool().then(function (tool) {
            //        if (tool) {
            //            tool.setGeometry({
            //                features: [e.feature],
            //                crs: self.map.crs
            //            });
            //        }
            //    }
            //})
            .on(Consts.event.STYLECHANGE, function (e) {
                self.onStyleChange(e);
            })
            .on(Consts.event.DRAWCANCEL + ' ' + Consts.event.DRAWUNDO, function () {
                cancelDraw.apply(self);
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
                beginDraw.apply(self);
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
                cancelDraw.apply(self);
            })
            .on(Consts.event.STYLECHANGE, function (e) {
                self.onStyleChange(e);
            });
        // Desactivamos el método exportState que ya se encarga el control padre de ello
        pointDrawControl.exportsState = false;

        self._elevationControlPromise = map.addControl('elevation', self.options.displayElevation);

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
                    self._clearBtn.disabled = false;
                    self._downloadBtn.disabled = false;
                }
            })
            .on(Consts.event.FEATUREREMOVE + ' ' + Consts.event.FEATURESCLEAR, function (e) {
                const layer = e.layer;
                if (layer === self.layer) {
                    if (self.layer.features.length === 0) {
                        self._clearBtn.disabled = true;
                        self._downloadBtn.disabled = true;
                        self.resetValues();
                        cancelDraw.apply(self);
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
    };

    ctlProto.displayMode = function (mode) {
        const self = this;
        if (mode === Consts.geom.POINT) {
            self._activeMode = self.div.querySelector('.tc-ctl-meas-pt');
        }
        if (self.modify) {
            self.modify.div.classList.remove(Consts.classes.COLLAPSED);
        }
        return Measure.prototype.displayMode.call(self, mode);
    };

    ctlProto.displayFeatureMode = function (feature) {
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
    };

    ctlProto.setMode = function (mode) {
        const self = this;
        if (mode === Consts.geom.POINT) {
            self.getPointDrawControl().then(function (ctl) {
                ctl.activate();
                Measure.prototype.setMode.call(self, mode);
                cancelDraw.apply(self);
            });
        }
        else {
            Measure.prototype.setMode.call(self, mode);
            cancelDraw.apply(self);            
        }
        
    };

    ctlProto.constrainModes = function (modes) {
        const self = this;
        if (!Array.isArray(modes)) {
            modes = [];
        }
        if (modes.indexOf(self.mode) < 0) {
            self.setMode(null);
        }
        const selector = modes.map(m => `[value=${m}]`).join() || '[value]';
        self.div.querySelectorAll(self._selectors.MODE_RADIO_BUTTON).forEach(function (rb) {
            rb.disabled = !rb.matches(selector);
        });
    };

    ctlProto.setLayer = async function (layer) {
        const self = this;
        await Measure.prototype.setLayer.call(self, layer);
        for await (const control of [self.getPointDrawControl(), self.getModifyControl()]) {
            control.setLayer(self.layer);
        }
        if (self.layer?.features.length) {
            self.displayFeatureMode(self.layer.features[0]);
        }
    };

    ctlProto.setFeatureMeasurementData = function (feature) {
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
    };

    ctlProto.getFeatureMeasurementData = function (feature) {
        const self = this;
        const result = {
            units: self.map.wrap.isGeo() || self.map.on3DView ? 'degree' : 'm'
        };
        const measureOptions = {
            crs: self.map.options.utmCrs
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
    };

    ctlProto.getPointMeasurementControl = async function () {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('sitna-measurement[mode="point"]');
    };

    ctlProto.displayMeasurements = function (options) {
        const self = this;
        Measure.prototype.displayMeasurements.call(self, options);
        options = options || {};
        if (options.coordinates) {
            self.pointMeasurementControl.displayMeasurement(options);
        }
        return self;
    };

    ctlProto.resetValues = function () {
        const self = this;
        Measure.prototype.resetValues.call(self);
        self.getPointMeasurementControl().then(ctl => ctl.clearMeasurement());
        return self;
    };

    ctlProto.clear = function () {
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
        self._clearBtn.disabled = true;
        self._downloadBtn.disabled = true;
        return self;
    };

    ctlProto.showSketchDownloadDialog = function (_options) {
        const self = this;

        self.getDownloadDialog().then(function (control) {
            var options = {
                title: self.getLocaleString("downloadSketch"),
                fileName: self.getLocaleString('sketch').toLowerCase().replace(' ', '_') + '_' + TC.Util.getFormattedDate(new Date().toString(), true)
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
        
    };

    ctlProto.onStyleChange = function (e) {
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

                    //feature._originalStyle[e.property] = e.value;
                    feature.setStyle(styleOptions);
                    //clearTimeout(feature._selectionStyleTimeout);
                    //feature._selectionStyleTimeout = setTimeout(function () {
                    //    feature.setStyle(self.modify.styleFunction(feature));
                    //}, self.options.styleChangeDisplayTimeout || 1000);
                }
            });
        }
    };

    ctlProto.activateElevationProfile = async function () {
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
    };

    ctlProto.deactivateElevationProfile = async function () {
        const self = this;
        self.elevationProfileActive = false;
        const elevationControl = await self.getElevationControl();
        elevationControl.resetElevationProfile();
        if (elevationControl.resultsPanel) {
            elevationControl.resultsPanel.close();
        }
    };

    ctlProto.resetElevationProfile = function () {
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
    };

    ctlProto.getElevationControl = function () {
        return this._elevationControlPromise;
    };

    ctlProto.getPointDrawControl = async function () {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('.' + Measure.prototype.CLASS + '-pt sitna-draw');
    };

    ctlProto.getModifyControl = async function () {
        const self = this;
        await self.renderPromise();
        return self.div.querySelector('.' + self.CLASS + '-mod sitna-modify');
    };

    const beginDraw = function () {
        const self = this;
        const showHideBtn = self.div.querySelector('.tc-ctl-dmm-cmd button.tc-ctl-dmm-btn-hide');
        if (showHideBtn) showHideBtn.disabled = false;
    };

    const cancelDraw = function () {
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
    };

})();

TC.control.DrawMeasureModify = DrawMeasureModify;
export default DrawMeasureModify;
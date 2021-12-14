
/**
  * Opciones de control de obtención de información de entidades de mapa en el que el método de selección es dibujar una 
  * geometría en el mapa. El control ofrece como resultados todas las entidades que se intersecan con esa geometría.
  * Las geometrías de selección pueden ser puntos, líneas o polígonos.
  * 
  * Este control utiliza las funcionalidades de los servicios OGC para realizar su cometido. En concreto, la selección por punto 
  * hace uso de la petición `GetFeatureInfo` de los servicios WMS. Por otro lado, las selecciones por línea y polígono emplean la petición
  * `GetFeature` de los servicios WFS. Esto implica que en este caso debe existir un servicio WFS asociado al servicio WMS que ofrezca 
  * los mismos datos que este. Servidores de mapas como GeoServer tienen este comportamiento por defecto. El control intenta inferir 
  * la URL del servicio WFS a partir de la URL del servicio WMS de la capa del mapa.
  * @typedef MultiFeatureInfoOptions
  * @ignore
  * @extends FeatureInfoOptions
  * @see MapControlOptions
  * @property {boolean} [active] - Si se establece a `true`, el control asociado está activo, es decir, responde a las pulsaciones hechas en el mapa desde el que se carga.
  * Como máximo puede haber solamente un control activo en el mapa en cada momento.
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {MultiFeatureInfoModeOptions} [modes] - Colección de modos disponibles de selección.
  * @property {boolean} [persistentHighlights] - Cuando el control muestra los resultados de la consulta, si el servicio lo soporta, mostrará resaltadas sobre el mapa las geometrías
  * de las entidades geográficas de la respuesta. Si el valor de esta propiedad es `true`, dichas geometrías se quedan resaltadas en el mapa indefinidamente. 
  * En caso contrario, las geometrías resaltadas se borran en el momento en que se cierra el bocadillo de resultados o se hace una nueva consulta.
  * @example <caption>[Ver en vivo](../examples/cfg.MultiFeatureInfoOptions.html)</caption> {@lang html} 
  * <div id="mapa"></div>
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Añadimos el control multiFeatureInfo.
  *     SITNA.Cfg.controls.multiFeatureInfo = {
  *         div: "slot1",
  *         modes: {
  *             point: true,
  *             polyline: {
  *                 filterStyle: {
  *                     strokeColor: "#00cccc",
  *                     strokeWidth: 4
  *                 }
  *             },
  *             polygon: {
  *                 filterStyle: {
  *                     strokeColor: "#6633cc",
  *                     strokeWidth: 3,
  *                     fillColor: "#6633cc",
  *                     fillOpacity: 0.5
  *                 }
  *             }
  *         },
  *         persistentHighlights: true
  *     };
  *     // Añadimos una capa WMS sobre la que hacer las consultas.
  *     // El servicio WMS de IDENA tiene un servicio WFS asociado (imprescindible para consultas por línea o recinto).
  *     SITNA.Cfg.workLayers = [
  *         {
  *             id: "cp",
  *             type: SITNA.Consts.layerType.WMS,
  *             url: "https://idena.navarra.es/ogc/wms",
  *             layerNames: ["IDENA:DIRECC_Pol_CodPostal"]
  *         }
  *     ];
  *     var map = new SITNA.Map("mapa");
  * </script> 
  */

/**
  * Opciones de control de obtención de información de entidades de mapa por click, por línea o por recinto.
  * @typedef MultiFeatureInfoModeOptions
  * @ignore
  * @see MultiFeatureInfoOptions
  * @property {boolean|FeatureInfoOptions} [point=true] - Si se establece a un valor verdadero, el control permite la selección de entidades por punto.
  * @property {boolean|GeometryFeatureInfoOptions} [polyline] - Si se establece a un valor verdadero, el control permite la selección de entidades por línea.
  * @property {boolean|GeometryFeatureInfoOptions} [polygon=true] - Si se establece a un valor verdadero, el control permite la selección de entidades por polígono.
  */

TC.control = TC.control || {};

if (!TC.control.FeatureInfoCommons) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/FeatureInfoCommons');
}
(function () {
    TC.control.MultiFeatureInfo = function () {
        var self = this;
        TC.Control.apply(self, arguments);
        self.modes = self.options.modes || {};
        if (typeof self.modes[TC.Consts.geom.POINT] === 'undefined') {
            self.modes[TC.Consts.geom.POINT] = true;
        }
        if (typeof self.modes[TC.Consts.geom.POLYGON] === 'undefined') {
            self.modes[TC.Consts.geom.POLYGON] = true;
        }
        self.featureInfoControl = null;
        self.lineFeatureInfoControl = null;
        self.polygonFeatureInfoControl = null;
        self.featureInfoControls = [];
        self.lastCtrlActive = null;
        self.popup = null;
        self.exportsState = false; // Los controles que exportan estado son los hijos
    };

    TC.inherit(TC.control.MultiFeatureInfo, TC.control.FeatureInfoCommons);

    var ctlProto = TC.control.MultiFeatureInfo.prototype;

    ctlProto.CLASS = 'tc-ctl-m-finfo';

    ctlProto.template = TC.apiLocation + "TC/templates/tc-ctl-m-finfo.hbs";

    const mergeOptions = function (opt1, opt2) {
        if (opt1) {
            if (opt1 === true) {
                opt1 = {};
            }
            return TC.Util.extend(true, opt1, opt2);
        }
        return opt1;
    };

    ctlProto.register = function (map) {
        const self = this;

        self.div.querySelectorAll('input[type=radio]').forEach(function (input) {
            input.checked = false;
        });


        return new Promise(function (resolve, reject) {
            const ctlPromises = [TC.Control.prototype.register.call(self, map)]
            const styles = self.options.styles || {};
            const pointMode = self.modes[TC.Consts.geom.POINT];
            const polylineMode = self.modes[TC.Consts.geom.POLYLINE];
            const polygonMode = self.modes[TC.Consts.geom.POLYGON];
            if (pointMode) {
                ctlPromises.push(map.addControl("featureInfo", mergeOptions(self.modes[TC.Consts.geom.POINT],
                    {
                        id: self.getUID(),
                        displayMode: self.options.displayMode,
                        persistentHighlights: self.options.persistentHighlights,
                        share: self.options.share
                    })).then(function (control) {
                        self.featureInfoControl = control;
                        self.featureInfoControls.push(control);
                        return control;
                    }));
            }
            if (self.modes[TC.Consts.geom.POLYLINE]) {
                ctlPromises.push(map.addControl("lineFeatureInfo", mergeOptions(self.modes[TC.Consts.geom.POLYLINE],
                    {
                        id: self.getUID(),
                        active: polylineMode.active,
                        displayMode: self.options.displayMode,
                        persistentHighlights: self.options.persistentHighlights,
                        share: self.options.share,
                        style: polylineMode.filterStyle || styles.line
                    })).then(function (control) {
                        self.lineFeatureInfoControl = control;
                        self.featureInfoControls.push(control);
                        return control;
                    }));
            }
            if (self.modes[TC.Consts.geom.POLYGON]) {
                ctlPromises.push(map.addControl("polygonFeatureInfo", mergeOptions(self.modes[TC.Consts.geom.POLYGON],
                    {
                        id: self.getUID(),
                        active: polygonMode.active,
                        displayMode: self.options.displayMode,
                        persistentHighlights: self.options.persistentHighlights,
                        share: self.options.share,
                        style: polygonMode.filterStyle || styles.polygon
                    })).then(function (control) {
                        self.polygonFeatureInfoControl = control;
                        self.featureInfoControls.push(control);
                        return control;
                    }));
            }

            map.on(`${TC.Consts.event.LAYERADD} ${TC.Consts.event.LAYERREMOVE} ${TC.Consts.event.LAYERVISIBILITY}`, function (e) {
                self.updateUI();
            });

            map.on(`${TC.Consts.event.CONTROLACTIVATE} ${TC.Consts.event.CONTROLDEACTIVATE}`, function (e) {
                if (e.control === self.featureInfoControl || e.control === self.lineFeatureInfoControl || e.control === self.polygonFeatureInfoControl) {
                    self.updateUI();
                }
            });

            Promise.all(ctlPromises).then(function () {
                if (self.featureInfoControl) {
                    self.featureInfoControl.activate();
                    self.lastCtrlActive = self.featureInfoControl;
                }
                self.updateUI();
                resolve(self);
            });
        });

    };

    ctlProto.render = function (callback) {
        const self = this;
        var renderData = { controlId: self.id };
        if (self.modes[TC.Consts.geom.POINT]) {
            renderData.pointSelectValue = TC.Consts.geom.POINT;
        }
        if (self.modes[TC.Consts.geom.POLYLINE]) {
            renderData.lineSelectValue = TC.Consts.geom.POLYLINE;
        }
        if (self.modes[TC.Consts.geom.POLYGON]) {
            renderData.polygonSelectValue = TC.Consts.geom.POLYGON;
        }
        return self._set1stRenderPromise(self.renderData(renderData,
            function () {
                var changeEvent = function () {
                    switch (this.value) {
                        case TC.Consts.geom.POLYLINE:
                            //modo línea
                            self.lineFeatureInfoControl.activate();
                            self.lastCtrlActive = self.lineFeatureInfoControl;
                            break;
                        case TC.Consts.geom.POLYGON:
                            //modo poligono
                            self.polygonFeatureInfoControl.activate();
                            self.lastCtrlActive = self.polygonFeatureInfoControl;
                            break;
                        default:
                            //modo point
                            self.featureInfoControl.activate();
                            self.lastCtrlActive = self.featureInfoControl;
                            break;
                    }
                };
                self.div.querySelectorAll('input[type=radio]').forEach(function (input) {
                    input.addEventListener('change', changeEvent);
                });

                //URI bind del click del boton de borrar seleccionadas
                const delFeaturesBtn = self.div.querySelector(`.${self.CLASS}-btn-remove`);
                delFeaturesBtn.addEventListener(TC.Consts.event.CLICK, function (e) {
                    self.featureInfoControls.forEach(ctl => {
                        ctl.resultsLayer.features.slice().forEach(f => ctl.downplayFeature(f));
                        ctl.filterLayer.features.slice().forEach(f => f.layer.removeFeature(f));
                    });
                }, { passive: true });

                self.div.querySelector(`.${self.CLASS}-btn-dl`).addEventListener(TC.Consts.event.CLICK, async function (e) {
                    const downloadDialog = await self.getDownloadDialog();
                    let options = {
                        title: self.getLocaleString("featureInfo") + " - " + self.getLocaleString("download"),
                        fileName: self._getFileName()
                    };

                    if (self.map.elevation || self.options.displayElevation) {
                        options = Object.assign({}, options, {
                            elevation: Object.assign({}, self.map.elevation && self.map.elevation.options, self.options.displayElevation)
                        });
                    }
                    downloadDialog.open(Array.prototype.concat.apply([], self.featureInfoControls.map(ctl => ctl.resultsLayer.features)), options);
                }, { passive: true });

                self.map
                    //.on(TC.Consts.event.FEATUREINFO, function () {
                    //    delFeaturesBtn.disabled = false;
                    //})
                    //.on(TC.Consts.event.NOFEATUREINFO, function (e) {
                    //    if (e.control && e.control.filterFeature) {
                    //        delFeaturesBtn.disabled = false;
                    //    }
                    //})
                    .on(TC.Consts.event.FEATUREREMOVE, function (e) {
                        if (self.featureInfoControls.some(ctl => ctl.resultsLayer === e.layer || ctl.filterLayer === e.layer)) {
                            self.updateUI();
                        }
                    })
                    .on(TC.Consts.event.FEATUREADD + ' ' + TC.Consts.event.FEATURESADD, function (e) {
                        if (self.featureInfoControls.some(ctl => ctl.resultsLayer === e.layer || ctl.filterLayer === e.layer)) {
                            self.updateUI();
                        }
                    });

                if (TC.Util.isFunction(callback)) {
                    callback();
                }
            }));
    };

    ctlProto.activate = function () {
        var self = this;
        if (self.lastCtrlActive)
            self.lastCtrlActive.activate();
    };

    ctlProto.deactivate = function () {
        var self = this;
        self.lastCtrlActive.deactivate(false);
    };

    ctlProto.updateUI = function () {
        const self = this;
        self.renderPromise().then(function () {
            const enabled = self.map.workLayers.some(l => l.type === TC.Consts.layerType.WMS && l.getVisibility());
            self.div.querySelectorAll('input').forEach(function (input) {
                input.disabled = !enabled;
            });
            if (self.featureInfoControl) {
                const input = self.div.querySelector(`input[value=${TC.Consts.geom.POINT}]`);
                if (input) {
                    input.checked = self.featureInfoControl.isActive;
                }
            }
            if (self.lineFeatureInfoControl) {
                const input = self.div.querySelector(`input[value=${TC.Consts.geom.POLYLINE}]`);
                if (input) {
                    input.checked = self.lineFeatureInfoControl.isActive;
                }
            }
            if (self.polygonFeatureInfoControl) {
                const input = self.div.querySelector(`input[value=${TC.Consts.geom.POLYGON}]`);
                if (input) {
                    input.checked = self.polygonFeatureInfoControl.isActive;
                }
            }

            const persistentHighlights = self.featureInfoControls.some(c => c.options.persistentHighlights);
            const featuresUnavailable = self.featureInfoControls.every(ctl => ctl.resultsLayer && ctl.resultsLayer.features.length === 0 && ctl.filterLayer && ctl.filterLayer.features.length === 0);
            const delFeaturesBtn = self.div.querySelector(`.${self.CLASS}-btn-remove`);
            delFeaturesBtn.classList.toggle(TC.Consts.classes.HIDDEN, !persistentHighlights);
            delFeaturesBtn.disabled = featuresUnavailable;
            const dlFeaturesBtn = self.div.querySelector(`.${self.CLASS}-btn-dl`);
            dlFeaturesBtn.classList.toggle(TC.Consts.classes.HIDDEN, !persistentHighlights);
            dlFeaturesBtn.disabled = featuresUnavailable;

            // Hack para compensar bug de Edge: no se actualiza el estilo al cambiar el estado del radio.
            const displayValue = self.div.style.display;
            self.div.style.display = 'none';
            if (displayValue) {
                self.div.style.display = displayValue;
            }
            else {
                self.div.style.removeProperty('display');
            }
        });
    };

})();
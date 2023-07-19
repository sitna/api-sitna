
/**
  * Opciones de control de obtención de información de entidades de mapa en el que el método de selección es dibujar una 
  * geometría en el mapa. El control ofrece como resultados todas las entidades que se intersecan con esa geometría.
  * Las geometrías de selección pueden ser puntos, líneas o polígonos.
  * 
  * Este control utiliza las funcionalidades de los servicios OGC para realizar su cometido. En concreto, la selección por punto 
  * hace uso de la petición `GetFeatureInfo` de los servicios WMS. Por otro lado, las selecciones por línea y polígono emplean la petición
  * `GetFeature` de los servicios WFS. Esto implica que en este caso debe existir un servicio WFS asociado al servicio WMS que ofrezca 
  * los mismos datos que este. Servidores de mapas como GeoServer tienen este comportamiento por defecto. 
  * El control infiere la URL del servicio WFS a partir de la [operación DescribeLayer del estándar WMS-SLD](https://docs.geoserver.org/latest/en/user/services/wms/reference.html#describelayer).
  * @typedef MultiFeatureInfoOptions
  * @extends FeatureInfoOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {boolean} [active] - Si se establece a `true`, el control asociado está activo, es decir, responde a las pulsaciones hechas en el mapa desde el que se carga.
  * Como máximo puede haber solamente un control activo en el mapa en cada momento.
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {SITNA.control.MultiFeatureInfoModeOptions} [modes] - Opciones de configuración de los modos disponibles de selección.
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
  * Opciones de los distintos modos de consulta espacial (por click, por línea o por recinto)
  * del [control de obtención de información de entidades de mapa por geometría]{@linkplain MultiFeatureInfoOptions}.
  * @typedef MultiFeatureInfoModeOptions
  * @memberof SITNA.control
  * @see SITNA.control.MultiFeatureInfoOptions
  * @property {boolean|SITNA.control.FeatureInfoOptions} [point=true] - Si se establece a un valor verdadero, el control permite la selección de entidades por punto.
  * @property {boolean|SITNA.control.GeometryFeatureInfoOptions} [polyline] - Si se establece a un valor verdadero, el control permite la selección de entidades por línea.
  * @property {boolean|SITNA.control.GeometryFeatureInfoOptions} [polygon=true] - Si se establece a un valor verdadero, el control permite la selección de entidades por polígono.
  */

import TC from '../../TC';
import Consts from '../Consts';
import Util from '../Util';
import Control from '../Control';
import FeatureInfoCommons from './FeatureInfoCommons';

TC.control = TC.control || {};

const mergeOptions = function (opt1, opt2) {
    if (opt1) {
        if (opt1 === true) {
            opt1 = {};
        }
        return Util.extend(true, opt1, opt2);
    }
    return opt1;
};

class MultiFeatureInfo extends FeatureInfoCommons {
    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.remove(super.CLASS);
        self.div.classList.add(self.CLASS);

        self.modes = self.options.modes || {};
        if (typeof self.modes[Consts.geom.POINT] === 'undefined') {
            self.modes[Consts.geom.POINT] = true;
        }
        if (typeof self.modes[Consts.geom.POLYGON] === 'undefined') {
            self.modes[Consts.geom.POLYGON] = true;
        }
        self.featureInfoControl = null;
        self.lineFeatureInfoControl = null;
        self.polygonFeatureInfoControl = null;
        self.featureInfoControls = [];
        self.lastCtrlActive = null;
        self.popup = null;
        self.exportsState = false; // Los controles que exportan estado son los hijos
    }

    getClassName() {
        return 'tc-ctl-m-finfo';
    }

    async register(map) {
        const self = this;

        self.div.querySelectorAll('input[type=radio]').forEach(function (input) {
            input.checked = false;
        });

        const ctlPromises = [Control.prototype.register.call(self, map)];
        const styles = self.options.styles || {};
        const pointMode = self.modes[Consts.geom.POINT];
        const polylineMode = self.modes[Consts.geom.POLYLINE];
        const polygonMode = self.modes[Consts.geom.POLYGON];
        if (pointMode) {
            ctlPromises.push(map.addControl("featureInfo", mergeOptions(self.modes[Consts.geom.POINT],
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
        if (self.modes[Consts.geom.POLYLINE]) {
            ctlPromises.push(map.addControl("lineFeatureInfo", mergeOptions(self.modes[Consts.geom.POLYLINE],
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
        if (self.modes[Consts.geom.POLYGON]) {
            ctlPromises.push(map.addControl("polygonFeatureInfo", mergeOptions(self.modes[Consts.geom.POLYGON],
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

        map.on(`${Consts.event.LAYERADD} ${Consts.event.LAYERREMOVE} ${Consts.event.LAYERVISIBILITY}`, function (_e) {
            self.updateUI();
        });

        map.on(`${Consts.event.CONTROLACTIVATE} ${Consts.event.CONTROLDEACTIVATE}`, function (e) {
            if (e.control === self.featureInfoControl || e.control === self.lineFeatureInfoControl || e.control === self.polygonFeatureInfoControl) {
                self.updateUI();
            }
        });

        await Promise.all(ctlPromises);
        if (self.featureInfoControl) {
            self.featureInfoControl.activate();
            self.lastCtrlActive = self.featureInfoControl;
        }
        self.updateUI();
        return self;
    }

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-m-finfo.mjs');
        self.template = module.default;
    }

    render(callback) {
        const self = this;
        var renderData = { controlId: self.id };
        if (self.modes[Consts.geom.POINT]) {
            renderData.pointSelectValue = Consts.geom.POINT;
        }
        if (self.modes[Consts.geom.POLYLINE]) {
            renderData.lineSelectValue = Consts.geom.POLYLINE;
        }
        if (self.modes[Consts.geom.POLYGON]) {
            renderData.polygonSelectValue = Consts.geom.POLYGON;
        }
        return self._set1stRenderPromise(self.renderData(renderData,
            function () {
                var changeEvent = function () {
                    switch (this.value) {
                        case Consts.geom.POLYLINE:
                            //modo línea
                            self.lineFeatureInfoControl.activate();
                            self.lastCtrlActive = self.lineFeatureInfoControl;
                            break;
                        case Consts.geom.POLYGON:
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
                delFeaturesBtn.addEventListener(Consts.event.CLICK, function (_e) {
                    self.featureInfoControls.forEach(ctl => {
                        ctl.resultsLayer.features.slice().forEach(f => ctl.downplayFeature(f));
                        ctl.filterLayer.features.slice().forEach(f => f.layer.removeFeature(f));
                    });
                }, { passive: true });

                self.div.querySelector(`.${self.CLASS}-btn-dl`).addEventListener(Consts.event.CLICK, async function (_e) {
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
                self.div.querySelector(`.${self.CLASS}-btn-zoom`).addEventListener(Consts.event.CLICK, function (_e) {
                    var features = self.featureInfoControls.reduce((i, a) => {
                        return i.concat(a.resultsLayer.features);
                    }, [])
                    self.map.zoomToFeatures(features);

                }, { passive: true });
                self.map
                    //.on(Consts.event.FEATUREINFO, function () {
                    //    delFeaturesBtn.disabled = false;
                    //})
                    //.on(Consts.event.NOFEATUREINFO, function (e) {
                    //    if (e.control && e.control.filterFeature) {
                    //        delFeaturesBtn.disabled = false;
                    //    }
                    //})
                    .on(Consts.event.FEATUREREMOVE, function (e) {
                        if (self.featureInfoControls.some(ctl => ctl.resultsLayer === e.layer || ctl.filterLayer === e.layer)) {
                            self.updateUI();
                        }
                    })
                    .on(Consts.event.FEATUREADD + ' ' + Consts.event.FEATURESADD, function (e) {
                        if (self.featureInfoControls.some(ctl => ctl.resultsLayer === e.layer || ctl.filterLayer === e.layer)) {
                            self.updateUI();
                        }
                    });

                if (Util.isFunction(callback)) {
                    callback();
                }
            }));
    }

    activate() {
        const self = this;
        if (self.lastCtrlActive) {
            self.lastCtrlActive.activate();
        }
    }

    deactivate() {
        const self = this;
        self.lastCtrlActive.deactivate(false);
    }

    updateUI() {
        const self = this;
        self.renderPromise().then(function () {
            const enabled = self.map.workLayers.some(l => l.type === Consts.layerType.WMS && l.getVisibility());
            self.div.querySelectorAll('input').forEach(function (input) {
                input.disabled = !enabled;
            });
            if (self.featureInfoControl) {
                const input = self.div.querySelector(`input[value=${Consts.geom.POINT}]`);
                if (input) {
                    if (!enabled && (self.lineFeatureInfoControl.isActive || self.polygonFeatureInfoControl.isActive)) {
                        // Si no hay capas válidas para línea o polígono volvemos a GFI por punto
                        self.featureInfoControl.activate();
                    }
                    input.checked = self.featureInfoControl.isActive;
                }
            }
            if (self.lineFeatureInfoControl) {
                const input = self.div.querySelector(`input[value=${Consts.geom.POLYLINE}]`);
                if (input) {
                    input.checked = self.lineFeatureInfoControl.isActive;
                }
            }
            if (self.polygonFeatureInfoControl) {
                const input = self.div.querySelector(`input[value=${Consts.geom.POLYGON}]`);
                if (input) {
                    input.checked = self.polygonFeatureInfoControl.isActive;
                }
            }

            const persistentHighlights = self.featureInfoControls.some(c => c.options.persistentHighlights);
            const featuresUnavailable = self.featureInfoControls.every(ctl => (!ctl.resultsLayer || ctl.resultsLayer.features.length === 0) &&
                (!ctl.filterLayer || ctl.filterLayer.features.length === 0));
            const delFeaturesBtn = self.div.querySelector(`.${self.CLASS}-btn-remove`);
            delFeaturesBtn.classList.toggle(Consts.classes.HIDDEN, !persistentHighlights);
            delFeaturesBtn.disabled = featuresUnavailable;
            const dlFeaturesBtn = self.div.querySelector(`.${self.CLASS}-btn-dl`);
            dlFeaturesBtn.classList.toggle(Consts.classes.HIDDEN, !persistentHighlights);
            dlFeaturesBtn.disabled = featuresUnavailable;

            const zoomFeaturesBtn = self.div.querySelector(`.${self.CLASS}-btn-zoom`);
            zoomFeaturesBtn.classList.toggle(Consts.classes.HIDDEN, !persistentHighlights);
            zoomFeaturesBtn.disabled = featuresUnavailable;

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
    }
}

TC.control.MultiFeatureInfo = MultiFeatureInfo;
export default MultiFeatureInfo;
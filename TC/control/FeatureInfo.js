
/**
  * Opciones de control de obtención de información de entidades de mapa por click.
  * @typedef FeatureInfoOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @see SITNA.control.MultiFeatureInfoModeOptions
  * @property {boolean} [active] - Si se establece a `true`, el control asociado está activo, es decir, responde a los clics hechos en el mapa desde el que se carga.
  * Como máximo puede haber solamente un control activo en el mapa en cada momento.
  * @property {boolean} [persistentHighlights] - Cuando el control `featureInfo` muestra los resultados de la consulta, si el servicio lo soporta, mostrará resaltadas sobre el mapa las geometrías
  * de las entidades geográficas de la respuesta. Si este valor es `true`, dichas geometrías se quedan resaltadas en el mapa indefinidamente. En caso contrario, las geometrías resaltadas se borran en el 
  * momento en que se cierra el bocadillo de resultados o se hace una nueva consulta.
  * @example <caption>[Ver en vivo](../examples/cfg.FeatureInfoOptions.persistentHighlights.html)</caption> {@lang html} 
  * <div id="mapa"></div>
  * <script>
  *     // Añadimos el control featureInfo.
  *     SITNA.Cfg.controls.featureInfo = {
  *         persistentHighlights: true
  *     };
  *     // Añadimos una capa WMS sobre la que hacer las consultas.
  *     SITNA.Cfg.workLayers = [
  *         {
  *             id: "masas",
  *             title: "Masas de agua",
  *             type: SITNA.Consts.layerType.WMS,
  *             url: "https://servicios.idee.es/wms-inspire/hidrografia",
  *             layerNames: ["HY.PhysicalWaters.Waterbodies"]
  *         }
  *     ];
  *     var map = new SITNA.Map("mapa");
  * </script> 
  */

import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import FeatureInfoCommons from './FeatureInfoCommons';
import md5 from 'md5';

TC.control = TC.control || {};

const FeatureInfo = function () {
    var self = this;
    FeatureInfoCommons.apply(this, arguments);
    self.wrap = new TC.wrap.control.FeatureInfo(self);

    Consts.classes.FROMLEFT = 'tc-fromleft';
    Consts.classes.FROMRIGHT = 'tc-fromright';
};

TC.inherit(FeatureInfo, FeatureInfoCommons);

(function () {

    var ctlProto = FeatureInfo.prototype;

    var roundCoordinates = function roundCoordinates(obj, precision) {
        var result;
        if (Array.isArray(obj)) {
            result = obj.slice();
            for (var i = 0, len = result.length; i < len; i++) {
                result[i] = roundCoordinates(result[i]);
            }
        }
        else if (typeof obj === "number") {
            result = Math.round(obj.toFixed(precision));
        }
        else {
            result = obj;
        }
        return result;
    };

    ctlProto.register = async function (map) {
        const self = this;
        const ctl = await FeatureInfoCommons.prototype.register.call(self, map);
        // Le ponemos un padre al div. Evitamos con esto que se añada el div al mapa (no es necesario, ya que es un mero buffer)
        document.createElement('div').appendChild(self.div);
        return ctl;
    };

    ctlProto.callback = function (coords, _xy) {
        const self = this;

        self.querying = true;
        return new Promise(function (resolve, _reject) {
            const elevationTool = self.getElevationTool();
            elevationTool.then(function (tool) {
                if (tool) {
                    self.elevationRequest = tool.getElevation({
                        crs: self.map.crs,
                        coordinates: [coords]
                    });
                }
            });

            if (self.map && self.filterLayer) {
                //aquí se pone el puntito temporal
                var title = self.getLocaleString('featureInfo');
                var markerOptions = TC.Util.extend({}, self.map.options.styles.marker, self.markerStyle, { title: title, set: title, showsPopup: false });
                self.filterLayer.clearFeatures();
                self.highlightedFeature = null;
                self.filterFeature = null;
                self.filterLayer.addMarker(coords, markerOptions).then(function afterMarkerAdd(marker) {
                    ////cuando se queda el puntito es porque esto sucede tras el cierre de la popup
                    ////o sea
                    ////lo normal es que primero se ejecute esto, y luego se procesen los eventos FEATUREINFO o NOFEATUREINFO
                    ////pero en el caso raro (la primera vez), ocurre al revés. Entonces, ya se habrá establecido lastFeatureCount (no será null)
                    //if (self.lastFeatureCount === null) {
                    //    self.map.putLayerOnTop(self.filterLayer);
                    //    self.filterFeature = marker;
                    //}
                    //else {
                    //    self.filterLayer.clearFeatures();
                    //}
                    self.map.putLayerOnTop(self.filterLayer);
                    self.filterFeature = marker;

                    elevationTool.then(function (tool) {
                        self.renderResults({ coords: marker.geometry, displayElevation: tool, loading: true }, function () {
                            self.displayResults();
                        });
                    });

                    var visibleLayers = false;
                    for (var i = 0; i < self.map.workLayers.length; i++) {
                        var layer = self.map.workLayers[i];
                        if (layer.type === Consts.layerType.WMS) {
                            if (layer.getVisibility() && layer.names.length > 0) {
                                visibleLayers = true;
                                break;
                            }
                        }
                    }
                    self.queryResolution = self.map.getResolution();
                    if (visibleLayers) {
                        self.wrap.getFeatureInfo(coords, self.queryResolution).then(() => resolve());
                    }
                    else {
                        // Metemos setTimeout para salirnos del hilo. Sin él se corre el riesgo de que se ejecute esto antes del evento BEFOREFEATUREINFO
                        setTimeout(function () {
                            self.responseCallback({ coords: coords });
                            resolve();
                        });
                    }
                });
            }
            else {
                resolve();
            }
        });
    };

    ctlProto.sendRequest = function (filter) {
        const self = this;
        return self.callback(filter.getCoordinates());
    };

    ctlProto.responseCallback = function (options) {
        const self = this;

        FeatureInfoCommons.prototype.responseCallback.call(self, options);
        if (self.filterFeature) {
            var services = options.services;

            // Eliminamos capas sin resultados
            if (services) {
                for (var i = 0; i < services.length; i++) {
                    var service = services[i];
                    for (var j = 0; j < service.layers.length; j++) {
                        if (!service.layers[j].features.length) {
                            service.layers.splice(j, 1);
                            j = j - 1;
                        }
                    }
                    if (!service.layers.length) {
                        services.splice(i, 1);
                        i = i - 1;
                    }
                }
            }

            self.info.defaultFeature = options.defaultFeature;

            if (self.elevationRequest) {
                options.displayElevation = true;
            }
            self.renderResults(options, function () {
                self.insertLinks();

                if (self.sharedFeatureInfo) {
                    self.div.querySelectorAll('ul.' + self.CLASS + '-services li').forEach(function (li) {
                        li.classList.add(Consts.classes.CHECKED);
                    });
                    var sharedFeature;
                    var featureObj = self.sharedFeatureInfo;
                    for (var i = 0, ii = self.info.services.length; i < ii; i++) {
                        var service = self.info.services[i];
                        if (service.mapLayers.some(ml => ml.url === featureObj.s)) {
                            for (var j = 0, jj = service.layers.length; j < jj; j++) {
                                var layer = service.layers[j];
                                if (layer.name === featureObj.l) {
                                    for (var k = 0, kk = layer.features.length; k < kk; k++) {
                                        var feature = layer.features[k];
                                        if (feature.id === featureObj.f) {
                                            sharedFeature = feature;
                                            var hash = md5(JSON.stringify({
                                                data: feature.getData(),
                                                geometry: roundCoordinates(feature.geometry, Consts.DEGREE_PRECISION) // Redondeamos a la precisión más fina (grado)
                                            }));
                                            if (featureObj.h !== hash) {
                                                TC.alert(self.getLocaleString('finfo.featureChanged.warning'));
                                            }
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    if (sharedFeature) {
                        self.highlightedFeature = sharedFeature;
                        self.map.addLayer({
                            id: self.getUID(),
                            type: Consts.layerType.VECTOR,
                            title: self.getLocaleString('foi'),
                            owner: self,
                            stealth: true
                        }).then(function (layer) {
                            self.sharedFeatureLayer = layer;
                            self.filterLayer.clearFeatures();
                            self.filterFeature = null;
                            layer.addFeature(sharedFeature);
                            self.map.zoomToFeatures([sharedFeature]);
                        });
                    }
                    delete self.sharedFeatureInfo;
                }
                else {
                    self.displayResults();
                }
                //capturamos el click de label y enlaces para no propagarlos a las tablas y que haga zoom cuando no se quiere
                self.div.querySelectorAll('ul.' + self.CLASS + '-services label, ul.' + self.CLASS + '-services a').forEach(function (label) {
                    label.addEventListener(Consts.event.CLICK, function (e) {
                        e.stopPropagation();
                    }, { passive: true });
                });                
            });
        }
    };

    ctlProto.displayResultsCallback = function () {
        const self = this;
        FeatureInfoCommons.prototype.displayResultsCallback.call(self);

        if (self.elevationRequest) {
            const ctl = self.getDisplayControl();
            self.getDisplayTarget().querySelectorAll(`.${self.CLASS}-elev,.${self.CLASS}-height`).forEach(elm => elm.classList.add(Consts.classes.HIDDEN));
            self.elevationRequest.then(function (elevationCoords) {
                if (ctl.currentFeature && elevationCoords?.length) {
                    const currentCoords = ctl.currentFeature.geometry;
                    const elevPoint = elevationCoords[0];
                    if (currentCoords[0] === elevPoint[0] && currentCoords[1] === elevPoint[1]) {
                        const elevationValues = elevationCoords.length ? elevationCoords[0].slice(2) : null;
                        self.displayElevationValues(elevationValues);
                    }
                }
                //self.elevationRequest = null;
            });
        }
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                entry.target.querySelectorAll('ul.' + self.CLASS + '-services label, ul.' + self.CLASS + '-services h4, ul.' + self.CLASS + '-services h3 span').forEach(function (h4) {
                    h4.addEventListener("mouseenter", function (_e) {
                        if (this.offsetWidth < this.scrollWidth) {
                            this.title = this.childNodes.item(this.tagName === "H4" ? 2 : 0).textContent;
                        }
                        else {
                            this.title = "";
                        }
                    }, { passive: true });
                });
            }
        });
        resizeObserver.observe(self.getDisplayTarget());        

        // 26/04/2021 ahora siempre mostramos XY aunque no haya elevación o resultado GFI
        //else if (!self.querying && (!self.info || !self.info.services)) {
        //    self.closeResults();
        //}
    };

    ctlProto.renderResults = function (options, callback) {
        const self = this;
        if (self.filterFeature) {
            const currentCoords = self.filterFeature.geometry;
            if (options.coords && currentCoords[0] === options.coords[0] && currentCoords[1] === options.coords[1]) {
                options.isGeo = self.map.wrap.isGeo();
                if (options.coords) {
                    options.crs = self.map.crs;
                    options.coords = options.coords.map(function (value) {
                        const precision = options.isGeo ? Consts.DEGREE_PRECISION : Consts.METER_PRECISION;
                        return TC.Util.formatCoord(value, precision);
                    });
                }
                self.renderData(options, callback);
            }
        }
    };

    ctlProto.displayElevationValues = function (value) {
        const self = this;
        let tValue, sValue;
        if (Array.isArray(value)) {
            tValue = value[0];
            sValue = value.length > 1 ? value[1] : null;
        }
        else {
            tValue = value;
            sValue = null;
        }
        const locale = self.map.options.locale || Cfg.locale;
        let elevationString = tValue === null ? '-' : TC.Util.formatNumber(Math.round(tValue), locale) + ' m';
        let heightString = sValue ? sValue.toLocaleString(locale, { maximumFractionDigits: 1 }) + ' m' : '-';
        const elevationDisplay = self.getDisplayTarget().querySelector(`.${self.CLASS}-elev`);
        const heightDisplay = self.getDisplayTarget().querySelector(`.${self.CLASS}-height`);
        if (elevationDisplay && heightDisplay) {
            elevationDisplay.classList.toggle(Consts.classes.HIDDEN, tValue === null);
            heightDisplay.classList.toggle(Consts.classes.HIDDEN, !sValue);
            elevationDisplay.querySelector(`.${self.CLASS}-coords-val`).innerHTML = elevationString;
            heightDisplay.querySelector(`.${self.CLASS}-coords-val`).innerHTML = heightString;
        }
    };

    ctlProto.loadSharedFeature = function (featureObj) {
        // Función para dar compatibilidad hacia atrás, ahora las features se comparten por URL
        const self = this;
        if (featureObj) {
            //buscamos si la feature compartida pertenece a alguna de las capas añadidas
            if (self.map.workLayers.filter(function (item, _i) {
                return item.type === Consts.layerType.WMS && item.url === featureObj.s && item.getDisgregatedLayerNames().indexOf(featureObj.l) >= 0;
            }).length === 0) {
                TC.error(self.getLocaleString('sharedFeatureNotValid'), Consts.msgErrorMode.TOAST);
                return;
            }
            self.sharedFeatureInfo = featureObj;
            // Creamos una consulta getFeatureInfo ad-hoc, con la resolución a la que estaba la consulta original.
            const coords = [-100, -100];
            self.beforeRequest({ xy: coords }); // xy negativo para que no se vea el marcador, ya que no sabemos dónde ponerlo.
            //aquí se pone el puntito temporal
            self.filterLayer.clearFeatures();
            self.filterFeature = null;
            self.filterLayer.addMarker(coords).then(function (marker) {
                self.filterFeature = marker;
                self.wrap.getFeatureInfo(featureObj.xy, featureObj.r, {
                    serviceUrl: featureObj.s,
                    layerName: featureObj.l,
                    featureId: featureObj.f
                });
            });
        }
    };

    ctlProto.exportQuery = function () {
        const self = this;
        const result = FeatureInfoCommons.prototype.exportQuery.call(self);
        result.res = self.queryResolution;
        return result;
    };

    ctlProto.importQuery = function (query) {
        const self = this;
        if (query.filter) {
            self.map.setResolution(query.res)
                .then(() => FeatureInfoCommons.prototype.importQuery.call(self, query));
        }
    };

})();

TC.control.FeatureInfo = FeatureInfo;
export default FeatureInfo;
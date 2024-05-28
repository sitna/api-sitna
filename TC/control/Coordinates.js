/**
  * Opciones de control de coordenadas.
  * @typedef CoordinatesOptions
  * @memberof SITNA.control
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {boolean} [showGeo] - Determina si se muestran coordenadas geográficas (en EPSG:4326) además de las del mapa, que por defecto son UTM (EPSG:25830).
  * @example <caption>[Ver en vivo](../examples/cfg.CoordinatesOptions.html)</caption> {@lang html} 
  * <div id="mapa"/>
  * <script>
  *     // Hacemos que el control que muestra las coordenadas en pantalla
  *     // muestre también las coordenadas geográficas
  *     SITNA.Cfg.controls.coordinates = {
  *         showGeo: true
  *     };
  *     var map = new SITNA.Map('map');
  * </script>
  */

import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Util from '../Util';
import ProjectionSelector from './ProjectionSelector';
import Popup from './Popup';

TC.control = TC.control || {};

class Coordinates extends ProjectionSelector {
    #cssClasses;

    constructor() {
        super(...arguments);
        const self = this;

        self.crs = '';
        self.xy = [0, 0, 0];
        self.latLon = [0, 0, 0];
        self.x = 0;
        self.y = 0;
        self.lat = 0;
        self.lon = 0;
        self.units = Consts.units.METERS;
        self.isGeo = false;
        self.allowReprojection = Object.prototype.hasOwnProperty.call(self.options, 'allowReprojection') ? self.options.allowReprojection : true;

        self.#cssClasses = {
            CRS: self.CLASS + '-crs',
            GEOCRS: self.CLASS + '-geocrs',
            MAIN: self.CLASS + '-main',
            ALTERNATE: self.CLASS + '-alt',
            XY: self.CLASS + '-xy',
            X: self.CLASS + '-x',
            Y: self.CLASS + '-y',
            LATLON: self.CLASS + '-latlon',
            LAT: self.CLASS + '-lat',
            LON: self.CLASS + '-lon',
            ELEVATION: self.CLASS + '-elevation',
            ELEVATION_CONTAINER: self.CLASS + '-elev-container',
            THREEDMARKER: self.CLASS + '-threed'
        };

        self.geoCrs = self.options.geoCrs || Cfg.geoCrs;
        self.wrap = new TC.wrap.control.Coordinates(self);
    }

    async register(map) {
        const self = this;
        await super.register.call(self, map);

        self.crs = self.map.crs;

        self.clear();

        map.on(Consts.event.VIEWCHANGE, function (e) {
            const view = e.view;
            if (view === Consts.view.PRINTING) {
                return;
            }

            const _3dContainerListener = function (e) {
                if (!self.isPointerOver(e)) {
                    self.clear();
                }
            };

            if (view === Consts.view.THREED) {
                self.isGeo = true;
                self.units = Consts.units.DEGREES;
                self.crs = self.map.view3D.crs;

                self.map.view3D.container.addEventListener('mouseout', _3dContainerListener);

                /* provisional: faltaría el off cuando pasemos a default*/
                self.map.view3D.on(Consts.event.MOUSEMOVE, function (coords) {
                    if (coords) {
                        if (Util.detectMobile()) { // si estamos en móvil añadimos marcador al mapa 3D                            

                            self.clear();

                            self.coordsToClick({ coordinate: [coords.lon, coords.lat, coords.ele], cssClass: self._cssClasses.THREEDMARKER });
                        }

                        self.latLon = [coords.lat, coords.lon];
                        if (coords.ele > 0) {
                            var locale = Util.getMapLocale(self.map);
                            self.latLon.push(coords.ele.toLocaleString(locale) + "m");
                        }

                        self.update();
                    } else {
                        self.clear();
                    }
                });

            } else if (view === Consts.view.DEFAULT) {
                self.isGeo = self.map.wrap.isGeo();
                self.units = Consts.units.METERS;
                self.crs = self.map.crs;

                if (self.map.view3D) {
                    self.map.view3D.container.removeEventListener('mouseout', _3dContainerListener);
                }
            }

            if (self.map.view3D) {
                self.geoCrs = self.map.view3D.crs;
                self.render();
            }
        });

        map.loaded(function () {
            // Se espera antes de registrar el control a que se cargue el mapa para evitar que muestre valores extraños
            self.wrap.register(map).then(function () {
                self.render(function () {
                    //self.update();
                    self.clear();
                });
            });

            if (Util.detectMobile()) {
                self.renderPromise().then(function () {
                    self.getLayer();
                    self.activateCoords();
                });
            }

            map.on(Consts.event.PROJECTIONCHANGE, function (e) {
                if (!map.on3DView) {
                    self.isGeo = map.wrap.isGeo();
                    self.crs = e.newCrs;
                    self.render();
                }
            });

            self.map.wrap.getViewport().then(function (viewport) {
                self.renderPromise().then(function () {
                    viewport.addEventListener(Consts.event.MOUSEMOVE, function (e) {
                        if (self.map.on3DView) {
                            return;
                        }

                        self.onMouseMove(e);
                    });
                    viewport.addEventListener(Consts.event.MOUSELEAVE, function (e) {
                        self.onMouseLeave(e);
                    });
                });
            });
        });

        return self;
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-coords.mjs');
        const dialogTemplatePromise = import('../templates/tc-ctl-coords-dialog.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-dialog'] = (await dialogTemplatePromise).default;
        self.template = template;
    }

    async render(callback) {
        const self = this;

        const html = await self.getRenderedHtml(self.CLASS + '-dialog', null);
        self._dialogDiv.innerHTML = html;
        await super.renderData.call(self, {
            x: self.x,
            y: self.y,
            lat: self.lat,
            lon: self.lon,
            ele: self.isGeo && self.latLon.length > 2 ? self.latLon[2] : !self.isGeo && self.xy.length > 2 ? self.xy[2] : null,
            crs: self.crs,
            geoCrs: self.geoCrs,
            isGeo: self.isGeo,
            showGeo: !self.isGeo && self.options.showGeo,
            allowReprojection: self.allowReprojection
        }, function () {
            self.addUIEventListeners();

            const closeBtn = self.div.querySelector('sitna-button[icon="close"]');
            if (Util.detectMobile()) {
                closeBtn.style.display = '';
            }
            else {
                self.div.classList.remove(Consts.classes.HIDDEN);
                self.div.style.visibility = 'visible';
                closeBtn.style.display = 'none';
            }

            if (Util.isFunction(callback)) {
                callback();
            }
        });
    }

    addUIEventListeners() {
        const self = this;
        const crsButton = self.div.querySelector('button.' + self.#cssClasses.CRS);
        if (crsButton) {
            crsButton.addEventListener(Consts.event.CLICK, function (_e) {
                self.showProjectionChangeDialog();
            }, { passive: true });
        }

        if (Util.detectMobile()) {
            self.div.querySelector('sitna-button[icon="close"]').addEventListener('click', function () {
                self.div.classList.add(Consts.classes.HIDDEN);
                self.clear();
            });
        }
    }

    onMouseMove(e) {
        this.wrap.onMouseMove(e);
    }

    onMouseLeave(e) {
        const self = this;
        setTimeout(function () {
            if (!self.isPointerOver(e)) {
                self.div.style.visibility = 'hidden';
                self.clear();
            }
        }, 200);
    }

    isPointerOver(e) {
        const self = this;

        const clientRect = self.div.getBoundingClientRect();
        return clientRect.left <= e.clientX &&
            clientRect.left + clientRect.width >= e.clientX &&
            clientRect.top <= e.clientY &&
            clientRect.top + clientRect.height >= e.clientY;
    }

    update() {
        const self = this;

        self.renderPromise().then(function () {
            if (!self.isGeo && self.options.showGeo) {
                self.latLon = Util.reproject(self.xy, self.crs, self.geoCrs).reverse();
            }

            const mainElement = self.div.querySelector(`.${self.#cssClasses.MAIN}`);
            const xyElement = mainElement.querySelector(`.${self.#cssClasses.XY}`);
            const latLonElement = mainElement.querySelector(`.${self.#cssClasses.LATLON}`);
            xyElement.classList.toggle(Consts.classes.HIDDEN, self.isGeo);
            latLonElement.classList.toggle(Consts.classes.HIDDEN, !self.isGeo);

            if (self.isGeo || self.options.showGeo) {
                self.lat = Util.formatCoord(self.latLon[0], Consts.DEGREE_PRECISION);
                self.lon = Util.formatCoord(self.latLon[1], Consts.DEGREE_PRECISION);
            }
            if (self.isGeo) {
                latLonElement.querySelector(`.${self.#cssClasses.LAT}`).innerHTML = self.lat;
                latLonElement.querySelector(`.${self.#cssClasses.LON}`).innerHTML = self.lon;
                if (!latLonElement.querySelector(`.${self.#cssClasses.ELEVATION_CONTAINER}`)
                    .classList.toggle(Consts.classes.HIDDEN, self.latLon.length <= 2)) {
                    self.ele = self.latLon[2];
                    latLonElement.querySelector(`.${self.#cssClasses.ELEVATION}`).innerHTML = self.ele;
                }
            }
            else {
                self.x = Util.formatCoord(self.xy[0], Consts.METER_PRECISION);
                self.y = Util.formatCoord(self.xy[1], Consts.METER_PRECISION);
                self.div.querySelector(`.${self.#cssClasses.X}`).innerHTML = self.x;
                self.div.querySelector(`.${self.#cssClasses.Y}`).innerHTML = self.y;
                if (!xyElement.querySelector(`.${self.#cssClasses.ELEVATION_CONTAINER}`)
                    .classList.toggle(Consts.classes.HIDDEN, self.xy.length <= 2)) {
                    self.ele = self.xy[2];
                    xyElement.querySelector(`.${self.#cssClasses.ELEVATION}`).innerHTML = self.ele;
                }
            }

            if (!self.isGeo && self.options.showGeo) {
                const altElement = self.div.querySelector(`.${self.#cssClasses.ALTERNATE}`);
                altElement.querySelector(`.${self.#cssClasses.LAT}`).innerHTML = self.lat;
                altElement.querySelector(`.${self.#cssClasses.LON}`).innerHTML = self.lon;
            }

            if (!Util.detectMobile()) {
                self.div.classList.remove(Consts.classes.HIDDEN);
                self.div.style.visibility = 'visible';
            }
        });
    }

    clear() {
        const self = this;

        self.div.classList.add(Consts.classes.HIDDEN);
        self.div.style.visibility = 'hidden';

        delete self.currentCoordsMarker;
        self.getLayer().then(function (layer) {
            if (layer.features.length) {
                layer.clearFeatures();
            }
        });
    }

    deactivateCoords() {
        const self = this;

        self.div.classList.add(Consts.classes.HIDDEN);
        self.clear();

        self.wrap.coordsDeactivate();
    }

    activateCoords() {
        const self = this;

        self.wrap.coordsActivate();
    }

    getCoords() {
        const self = this;
        // si hay visible un popup, establecemos la posición de la cruz en el punto en el cual se ha abierto el popup
        const popups = self.map.getControlsByClass(Popup);
        if (popups?.length > 0 && popups[0].isVisible()) {
            self.coordsToPopup(popups[0]);
        }
        else { // si no hay popup, calculamos el centro del mapa                
            self.updateCoordsCtrl([(self.map.getExtent()[0] + self.map.getExtent()[2]) / 2, (self.map.getExtent()[1] + self.map.getExtent()[3]) / 2]);

            self.coordsToClick.call(self, { coordinate: self.xy });
        }
    }

    coordsToPopup(popup) {
        const self = this;

        if (popup) {
            self.updateCoordsCtrl(popup.wrap.popup.getPosition());
        }
    }

    updateCoordsCtrl(position) {
        const self = this;

        if (position) {
            if (!self.isGeo) {
                self.x = position[0];
                self.y = position[1];
                self.xy = [self.x, self.y];

                if (position.length > 2) {
                    self.xy.push(position[2]);
                }
            }
            if (self.isGeo || self.options.showGeo) {
                self.lat = position[0];
                self.lon = position[1];
                self.latLon = [self.lat, self.lon];

                if (position.length > 2) {
                    self.latLon.push(position[2]);
                }
            }

            self.update();
        }
    }

    // Establece la posición de la cruz en la posición recibida
    //var animationTimeout;
    coordsToClick(e) {
        const self = this;

        // Si streetView está activo, no responde al click
        if (!self.map.div.classList.contains('tc-ctl-sv-active') || !self.map.div.classList.contains(Consts.classes.COLLAPSED)) {

            var coordsBounding = self.div.getBoundingClientRect();
            if (coordsBounding.left <= e.clientX && e.clientX <= coordsBounding.right && coordsBounding.top <= e.clientY && e.clientY <= coordsBounding.bottom) {
                self.div.classList.add(Consts.classes.HIDDEN);
                self.clear();

                return;
            }

            self.div.classList.remove('tc-fading');
            setTimeout(function () {
                self.div.classList.add('tc-fading');
                // El siguiente código es para quitar el marcador al mismo tiempo que desaparece
                // el indicador de coordenadas
                const durationValue = getComputedStyle(self.div).getPropertyValue('animation-duration');
                let duration = 0;
                let match = durationValue.match(/^(\d+)(m?s)$/i);
                if (match) {
                    duration = parseInt(match[1]);
                    if (match[2] === 's')
                        duration = duration * 1000;
                }
                if (duration !== 0) {
                    clearTimeout(self._markerRemoveTimeout);
                    self._markerRemoveTimeout = setTimeout(() => {
                        if (self.currentCoordsMarker) {
                            self.getLayer().then(layer => {
                                layer.removeFeature(self.currentCoordsMarker);
                                self.currentCoordsMarker = null;
                            });
                        }
                    }, duration);
                }
            }, 10);

            self.updateCoordsCtrl(e.coordinate);

            if (!self.map.on3DView) {
                self.coordsMarkerAdd(e.coordinate, e.cssClass);
            }

            self.div.classList.remove(Consts.classes.HIDDEN);
            //self.div.style.visibility = 'visible';

            //self.div.style.opacity = '0.7';

            //animationTimeout = setTimeout(function () {
            //    $(self.div).animate({ opacity: 0 }, 3000, "linear",
            //        function () {
            //            self.clear();
            //        });
            //}, 5000);
        }
    }

    coordsMarkerAdd(position, cssClass) {
        const self = this;

        if (!self.currentCoordsMarker) {
            self.getLayer().then(function (layer) {
                layer.addMarker(position, { title: 'Coord', showsPopup: false, cssClass: cssClass || Consts.classes.POINT, anchor: [0.5, 0.5] })
                    .then(function (marker) {
                        self.currentCoordsMarker = marker;
                    });
            });
        } else {
            self.currentCoordsMarker.setCoords(position);
        }
    }

    async getLayer() {
        const self = this;
        if (self.layer == undefined) {
            self.layer = await self.map.addLayer({
                id: self.getUID(),
                type: Consts.layerType.VECTOR,
                stealth: true,
                owner: self,
                title: 'Coordenadas'
            });
            self.layer.map.putLayerOnTop(self.layer);
        }
        return self.layer;
    }
}

Coordinates.prototype.CLASS = 'tc-ctl-coords';
TC.control.Coordinates = Coordinates;
export default Coordinates;
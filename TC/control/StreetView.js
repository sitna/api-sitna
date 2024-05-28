
/**
  * Opciones de control de StreetView.
  * @typedef StreetViewOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {string} [googleMapsKey] - El control de StreetView hace uso de la API de Google Maps para funcionar. 
  * Esta propiedad establece la clave de uso asociada al sitio donde está alojada la aplicación que usa la API SITNA. 
  * No es necesaria para hacer funcionar el control pero es recomendable obtener una para garantizar el servicio por parte de Google.
  * 
  * Puede obtener más información en el [sitio para desarrolladores de Google](https://developers.google.com/maps/documentation/javascript/get-api-key).
  * @property {HTMLElement|string} [viewDiv] - Elemento del DOM en el que mostrar la vista de StreetView o valor de atributo id de dicho elemento.
  * @example <caption>[Ver en vivo](../examples/cfg.StreetViewOptions.html)</caption> {@lang html}
  * <div id="mapa"/>
  * <div id="sv"/>
  * <script>
  *     // Creamos un mapa con el control de StreetView.
  *     // La vista de StreetView se debe dibujar en el elemento con identificador "sv".
  *     // Se utilizará la clave de Google Maps para el SITNA.
  *     // (Solamente es válida en el sitio web del SITNA, está aquí a título de ejemplo).
  *     var map = new SITNA.Map("mapa", {
  *         controls: {
  *             streetView: {
  *                 viewDiv: "sv",
  *                 googleMapsKey: "AIzaSyDyXgqllcajbMjx8yQxEX28VgA9nQOhtCM"
  *             }
  *         }
  *     });
  * </script>
  */

import TC from '../../TC';
import Consts from '../Consts';
import Cfg from '../Cfg';
import Util from '../Util';
import Control from '../Control';

TC.control = TC.control || {};

Consts.url.GOOGLEMAPS = '//maps.googleapis.com/maps/api/js?v=3';
let gMapsUrl = Consts.url.GOOGLEMAPS;
Cfg.proxyExceptions = Cfg.proxyExceptions || [];
Cfg.proxyExceptions.push(Consts.url.GOOGLEMAPS);

var waitId = 0;

class StreetView extends Control {
    viewDiv = null;
    #sv = null;
    #startLonLat = null;
    #previousActiveControl;
    #transitioning;

    register(map) {
        const self = this;

        if (!self.viewDiv) {
            self.viewDiv = Util.getDiv(self.options.viewDiv);
            self.viewDiv.classList.add(self.CLASS + '-view', Consts.classes.HIDDEN);
            if (!self.options.viewDiv) {
                map.div.insertAdjacentElement('beforebegin', self.viewDiv);
            }
        }

        const result = super.register.call(self, map);

        self.mapDiv = self.map.div;

        self.getCoordinateFromPixel = self.map.wrap.getCoordinateFromPixel;
        //ahora google pide en la url de google maps una función función global que se llamará una vez que la API de Maps JavaScript se cargue por completo.
        let fnCallBackSV = "SV_" + (Math.random() + 1).toString(36).substring(7);

        window[fnCallBackSV] = function () {
            delete window[fnCallBackSV];
        }
        const googleMapsKey = self.options.googleMapsKey || map.options.googleMapsKey;
        if (googleMapsKey) {
            gMapsUrl += '&key=' + googleMapsKey + "&callback=" + fnCallBackSV;
        }

        self.layer = null;
        self.ThreeDMarker = null;
        var layerId = self.getUID();
        for (var i = 0; i < map.workLayers.length; i++) {
            var layer = map.workLayers[i];
            if (layer.type === Consts.layerType.VECTOR && layer.id === layerId) {
                self.layer = layer;
                break;
            }
        }
        if (!self.layer) {
            map.loaded(function () {
                map.addLayer({
                    id: layerId,
                    owner: self,
                    stealth: true,
                    type: Consts.layerType.VECTOR
                }).then(function (layer) {
                    self.layer = layer;
                });
            });
        }

        self.renderPromise().then(function () {
            import("draggabilly").then(function (module) {
                const Draggabilly = module.default;
                const drag = new Draggabilly(self.div.querySelector('.' + self.CLASS + '-drag'), {
                    containment: (self.getMapDiv && self.mapDiv) || self.map.div
                });
                drag.on('dragStart', function (_e) {
                    self.#preset();
                });
                drag.on('dragEnd', function (_e) {
                    self.#resolve();
                    drag.setPosition(0, 0);
                });
                // Añadimos aviso de que este botón no se pulsa, se arrastra
                self.div.querySelector('.' + self.CLASS + '-btn').addEventListener('click', function (e) {
                    const btnRect = e.target.getBoundingClientRect();
                    console.log(btnRect);
                    if (e.clientX >= btnRect.left &&
                        e.clientX <= btnRect.right &&
                        e.clientY >= btnRect.top &&
                        e.clientY <= btnRect.bottom) {
                        self.map.toast(self.getLocaleString('sv.instructions'), { type: TC.Consts.msgType.INFO });
                    }
                });
            });

            const view = self.viewDiv;
            view.querySelector('.' + self.CLASS + '-btn-close').addEventListener(Consts.event.CLICK, function (e) {
                e.stopPropagation();
                self.closeView();
            }, { passive: true });
        }
            , function () {
                TC.error("Error de renderizado StreetView");
            });

        map.on(Consts.event.VIEWCHANGE, function (e) {
            const view = e.view;

            if (view === Consts.view.THREED) {
                self.mapDiv = this.view3D.container;
                self.getCoordinateFromPixel = (coords) => {
                    const _coords = this.view3D.Coordinates2DTo3D(coords);
                    return [_coords.lon, _coords.lat];
                }

            } else if (view === Consts.view.DEFAULT) {
                self.mapDiv = this.div;
                self.getCoordinateFromPixel = self.map.wrap.getCoordinateFromPixel;
            }
        });
        map.on(Consts.event.THREED_DRAG, function (e) {
            if (e.pickedFeature === self.ThreeDMarker) {
                self.#startLonLat = e.oldCoords;
                self.#sv.setPosition({ lng: e.newCoords[0], lat: e.newCoords[1] });
            }
        })
        return result;
    }

    #dispatchCanvasResize() {
        const self = this;
        var event = document.createEvent('HTMLEvents');
        event.initEvent('resize', true, false);
        const elm = self.map.div.querySelector('canvas') || window;
        elm.dispatchEvent(event);
    }

    #preset() {
        const self = this;
        self.div.querySelector('.' + self.CLASS + '-btn').classList.add(Consts.classes.CHECKED);
        self.mapDiv.classList.add(self.CLASS + '-active');
    }

    #reset() {
        const self = this;
        const view = self.viewDiv;
        const onTransitionend = function () {
            view.removeEventListener('transitionend', onTransitionend);
            self.#dispatchCanvasResize();
        };

        view.addEventListener('transitionend', onTransitionend);

        // Por si no salta transitionend
        setTimeout(function () {
            self.#dispatchCanvasResize();
        }, 1000);

        if (self.map.on3DView && self.ThreeDMarker) {
            self.ThreeDMarker.show = false;
            self.map.view3D.getScene().requestRender();
        }
        else {
            self.layer.clearFeatures();
        }
        self.div.querySelector('.' + self.CLASS + '-btn').classList.remove(Consts.classes.CHECKED);
        self.div.querySelector('.' + self.CLASS + '-drag').classList.remove(Consts.classes.HIDDEN);
        self.mapDiv.classList.remove(self.CLASS + '-active');
        self.#startLonLat = null;
    }

    #resolve() {
        const self = this;
        var result = false;
        const btn = self.div.querySelector('.' + self.CLASS + '-btn');
        const drag = self.div.querySelector('.' + self.CLASS + '-drag');

        var btnRect = btn.getBoundingClientRect();
        var dragRect = drag.getBoundingClientRect();
        drag.classList.add(Consts.classes.HIDDEN);
        if (dragRect.top < btnRect.top || dragRect.top > btnRect.bottom ||
            dragRect.left < btnRect.left || dragRect.left > btnRect.right) {
            // Hemos soltado fuera del botón: activar StreetView
            result = true;
            // Precarga de marcadores
            var extent = self.map.getExtent();
            var xy = [extent[2], extent[3]];
            if (!self.map.on3DView)
                for (var i = 0; i < 16; i++) {
                    self.layer.addMarker(xy, {
                        id: 'pegman',
                        cssClass: 'tc-marker-sv-' + i,
                        width: 48,
                        height: 48,
                        anchor: [0, 1]
                    });
                }
            /////////////////////
            // Activamos StreetView
            var mapRect = self.mapDiv.getBoundingClientRect();
            var xpos = (dragRect.left + dragRect.right) / 2 - mapRect.left;
            var ypos = dragRect.bottom - mapRect.top;
            var coords = self.getCoordinateFromPixel([xpos, ypos]);
            self.callback(coords);
        }
        else {
            self.#reset();
        }
        return result;
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-sv.mjs');
        const viewTemplatePromise = import('../templates/tc-ctl-sv-view.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-view'] = (await viewTemplatePromise).default;
        self.template = template;
    }

    async render() {
        const self = this;
        self.viewDiv.innerHTML = await self.getRenderedHtml(self.CLASS + '-view', null);
        await self.renderData(null);
    }

    callback(coords) {
        const self = this;
        var geogCrs = 'EPSG:4326';
        var ondrop = function (feature) {
            if (self.#sv) {
                var bounds = feature.getBounds();
                const lonLat = Util.reproject([(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2], self.map.getCrs(), geogCrs);
                self.#sv.setPosition({ lng: lonLat[0], lat: lonLat[1] });
            }
        };

        var ondrag = function (feature) {
            if (self.#sv) {
                var bounds = feature.getBounds();
                self.#startLonLat = Util.reproject([(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2], self.map.getCrs(), geogCrs);
            }
        };

        var li = self.map.getLoadingIndicator();
        if (li) {
            waitId = li.addWait(waitId);
        }

        const mapDiv = self.mapDiv;

        var setMarker = function (sv, center) {

            self.layer.clearFeatures();

            var xy;
            var heading;
            if (sv) {
                var latLon = sv.getPosition();
                xy = Util.reproject([latLon.lng(), latLon.lat()], geogCrs, self.map.getCrs());
                heading = sv.getPov().heading;
            }
            else {
                xy = coords;
                heading = 0;
            }
            if (self.map.on3DView) {
                self.ThreeDMarker = self.map.view3D.setMarker(xy,
                    Util.getFeatureStyleFromCss('tc-marker-sv-' + (Math.round(16.0 * heading / 360) + 16) % 16)?.url,
                    self.ThreeDMarker);

            }
            else {
                self.map.addMarker(xy, {
                    cssClass: 'tc-marker-sv-' + (Math.round(16.0 * heading / 360) + 16) % 16,
                    width: 48,
                    height: 48,
                    anchor: [0.4791666666666667, 0.7083333333333333],
                    layer: self.layer,
                    showsPopup: false
                });
                Promise.all(self.map._markerPromises).then(function () {
                    // Para poder arrastrar a pegman                
                    self.layer.wrap.setDraggable(true, ondrop, ondrag);
                });
            }

            if (center) {
                var setCenter = function () {
                    if (!self.map.on3DView)
                        self.map.setCenter(xy);
                    else {
                        self.map.view3D.setCenter(xy);
                    }
                };
                // Esperamos a que el mapa esté colapsado para centrarnos: ahorramos ancho de banda
                if (mapDiv.classList.contains(Consts.classes.COLLAPSED)) {
                    setCenter();
                }
                else {
                    setTimeout(setCenter, 1200);
                }
            }
        };
        var changeMarker = function (cssClass) {
            if (!self.map.on3DView) {
                if (self.layer.features && self.layer.features.length > 0) {
                    var pegmanMarker = self.layer.features[0];
                    delete pegmanMarker.options.url;
                    pegmanMarker.options.cssClass = cssClass
                    //pegmanMarker.options.cssClass = 'tc-marker-sv-' + (Math.round(16.0 * self.#sv.getPov().heading / 360) + 16) % 16;
                    pegmanMarker.setStyle(pegmanMarker.options);
                }
            }
            else {
                self.ThreeDMarker?.setImage(Math.random() * 1000, Util.getFeatureStyleFromCss(cssClass)?.url);
            }

        }

        TC.loadJS(
            !window.google || !google.maps,
            gMapsUrl,
            function () {

                if (window.google) {
                    setMarker();
                    const view = self.viewDiv;
                    const lonLat = Util.reproject(coords, self.map.getCrs(), geogCrs);
                    const mapsLonLat = new google.maps.LatLng(lonLat[1], lonLat[0]);

                    // Comprobamos si hay datos de SV en el sitio elegido.
                    const svService = new google.maps.StreetViewService();
                    svService.getPanorama({
                        location: mapsLonLat,
                        preference: google.maps.StreetViewPreference.BEST
                    }, function (svPanoramaData, svStatus) {
                        if (svStatus !== google.maps.StreetViewStatus.OK) {
                            if (li) {
                                li.removeWait(waitId);
                            }
                            setTimeout(function () { // Timeout para dar tiempo a ocultarse a LoadingIndicator
                                TC.alert(svStatus === google.maps.StreetViewStatus.ZERO_RESULTS ? self.getLocaleString('noStreetView') : self.getLocaleString('streetViewUnknownError'));
                                self.layer.wrap.setDraggable(false);
                                self.#reset();
                            }, 100);
                        }
                        else {
                            const onTransitionend = function (e) {
                                if (!self.#transitioning) {
                                    return;
                                }

                                if (e.propertyName === 'width' || e.propertyName === 'height') {

                                    self.#transitioning = false;

                                    if (li) {
                                        li.removeWait(waitId);
                                    }

                                    const resizeEvent = document.createEvent('HTMLEvents');
                                    resizeEvent.initEvent('resize', false, false);
                                    mapDiv.dispatchEvent(resizeEvent);

                                    self.#dispatchCanvasResize();
                                    view.removeEventListener('transitionend', onTransitionend);

                                    var svOptions = {
                                        position: mapsLonLat,
                                        pov: {
                                            heading: 0,
                                            pitch: 0
                                        },
                                        zoom: 1,
                                        fullscreenControl: false,
                                        zoomControlOptions: {
                                            position: google.maps.ControlPosition.LEFT_TOP
                                        },
                                        panControlOptions: {
                                            position: google.maps.ControlPosition.LEFT_TOP
                                        },
                                        imageDateControl: true
                                    };

                                    if (!self.#sv) {
                                        self.#sv = new google.maps.StreetViewPanorama(view, svOptions);
                                        google.maps.event.addListener(self.#sv, 'position_changed', function () {
                                            setMarker(self.#sv, view.classList.contains(Consts.classes.VISIBLE));
                                        });
                                        self.managePOVChange = function () {
                                            var heading
                                            if (self.map.on3DView)
                                                heading = (self.#sv.getPov().heading || 360) - self.map.view3D.getCameraData().heading
                                            else {
                                                heading = self.#sv.getPov().heading;
                                            }
                                            changeMarker('tc-marker-sv-' + (Math.round(16.0 * heading / 360) + 16) % 16);
                                        }
                                        self.map.on(Consts.event.CAMERACHANGE, self.managePOVChange);
                                        google.maps.event.addListener(self.#sv, 'pov_changed', self.managePOVChange);
                                        google.maps.event.addListener(self.#sv, 'status_changed', function () {
                                            var svStatus = self.#sv.getStatus();

                                            if (svStatus !== google.maps.StreetViewStatus.OK) {
                                                self.#sv.setVisible(false);
                                                TC.alert(svStatus === google.maps.StreetViewStatus.ZERO_RESULTS ? self.getLocaleString('noStreetView') : self.getLocaleString('streetViewUnknownError'));
                                                if (self.#startLonLat) {
                                                    self.#sv.setVisible(true);
                                                    self.#sv.setPosition({ lng: self.#startLonLat[0], lat: self.#startLonLat[1] });
                                                }
                                                else {
                                                    self.layer.wrap.setDraggable(false);
                                                    self.closeView();
                                                }
                                            }
                                        });
                                    }
                                    else {
                                        self.#sv.setOptions(svOptions);
                                        self.#sv.setVisible(true);
                                    }
                                }
                            };

                            self.#transitioning = true;
                            view.addEventListener('transitionend', onTransitionend);

                            if (!self.options.viewDiv || !mapDiv.classList.contains(Consts.classes.FULL_SCREEN)) {
                                // No había definida una vista. Para hacer el control compatible con mapas incrustados,
                                // en este caso a la vista nueva le asignamos el tamaño del mapa.
                                const mapRect = mapDiv.getBoundingClientRect();
                                self.viewDiv.style.height = mapRect.height + 'px';
                                self.viewDiv.style.width = mapRect.width + 'px';
                            }
                            const zIndexMap = parseInt(window.getComputedStyle(mapDiv).zIndex, 10);

                            mapDiv.classList.add(Consts.classes.COLLAPSED);
                            mapDiv.style.width = self.options.ovmapW || "25vh";
                            mapDiv.style.height = self.options.ovmapH || "25vh";
                            if (self.map.on3DView)//si es en modo 3d se oculta el mapa 2D para que no interfiera
                                self.map.div.style.display = "none"
                            view.style.left = '';
                            view.style.top = '';
                            view.classList.remove(Consts.classes.HIDDEN);
                            view.classList.add(Consts.classes.VISIBLE);

                            const zIndexView = parseInt(window.getComputedStyle(view).zIndex, 10);
                            if (zIndexMap <= zIndexView)
                                mapDiv.style.zIndex = (zIndexView + 1)


                            // Por si no salta transitionend
                            setTimeout(function () {
                                onTransitionend({ propertyName: 'width' });
                            }, 1000);

                            const header = document.body.querySelector('header');
                            if (header) {
                                header.style.display = 'none';
                            }

                            //apagar lo que sea que esté encendido (probablemente featInfo)
                            //al cerrar con el aspa, volverá a detonarse StreetView.deactivate()
                            //que, a su vez, restaurará el control anterior (FeatureInfo)
                            if (self.map.activeControl) {
                                self.#previousActiveControl = self.map.activeControl;
                                self.map.activeControl.deactivate(true);
                            }

                            setMarker(self.#sv);
                        }
                    });
                }
                else {
                    self.#reset();
                }
            }, false, true);
    }

    closeView() {
        const self = this;
        const mapDiv = self.mapDiv;
        const view = self.viewDiv;

        const endProcess = function () {
            mapDiv.classList.remove(Consts.classes.COLLAPSED);
            mapDiv.style.width = mapDiv.style.height = mapDiv.style.zIndex = "";
            if (self.map.on3DView)//si es en modo 3d se oculta el mapa 2D para que no interfiera
                self.map.div.style.display = '';
            const resizeEvent = document.createEvent('HTMLEvents');
            resizeEvent.initEvent('resize', false, false);
            mapDiv.dispatchEvent(resizeEvent); // Para evitar que salga borroso el mapa tras cerrar SV.
            self.map.off(Consts.event.CAMERACHANGE, self.managePOVChange);
        };
        const transitionend = 'transitionend';
        const onTransitionend = function (e) {
            if (e.propertyName === 'width' || e.propertyName === 'height') {
                view.removeEventListener(transitionend, onTransitionend);
                endProcess();
            }
        };
        view.removeEventListener(transitionend, onTransitionend);
        view.addEventListener(transitionend, onTransitionend);
        setTimeout(endProcess, 1000); // backup por si falla la transición.

        if (!self.options.viewDiv) {
            // No había definida una vista. Para hacer el control compatible con mapas incrustados,
            // en este caso a la vista nueva le habíamos asignado el tamaño del mapa.
            self.viewDiv.style.removeProperty('height');
            self.viewDiv.style.removeProperty('width');
        }
        view.classList.add(Consts.classes.HIDDEN);
        view.classList.remove(Consts.classes.VISIBLE);
        view.style.height = view.style.width = "";
        self.div.querySelector('.' + self.CLASS + '-drag').classList.remove(Consts.classes.HIDDEN);
        self.layer.wrap.setDraggable(false);
        self.#reset();
        self.#sv.setVisible(false);
        const header = document.body.querySelector('header');
        if (header) {
            header.style.display = '';
        }

        if (self.#previousActiveControl) {
            self.#previousActiveControl.activate();
        }
    }
}

StreetView.prototype.CLASS = 'tc-ctl-sv';
TC.control.StreetView = StreetView;
export default StreetView;
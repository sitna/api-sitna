/**
  * Opciones del control GPS y rutas.
  * @typedef GeolocationOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {boolean} [displayElevation=true] - Si se establece a `true`, se completará el gráfico del perfil de elevación de la ruta (si esta cuenta con datos de elevación) añadiendo el perfil de elevación resultante del MDT (Modelo Digital de Terreno)
  
  * @example <caption>[Ver en vivo](../examples/cfg.GeolocationOptions.html)</caption> {@lang html}
  * <div id="mapa"/>
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Añadimos el control GPS y rutas en el primer contenedor definido en el marcado markup.html contenido en el layout definido en la anterior instrucción.
  *     SITNA.Cfg.controls.geolocation = {
  *         div: "slot1",
  *         displayElevation: true // Se añadirá el perfil de elevación del MDT
  *     };
  *     var map = new SITNA.Map("mapa");
  * </script>
  */

import localforage from 'localforage';
import TC from '../../TC';
import Consts from '../Consts';
import Control from '../Control';
import LoadingIndicator from './LoadingIndicator';
import Util from '../Util';
import infoShare from './infoShare';
import itemToolContainer from './itemToolContainer';
import Feature from '../../SITNA/feature/Feature';
import Polyline from '../../SITNA/feature/Polyline';
import MultiPolyline from '../../SITNA/feature/MultiPolyline';
import Point from '../../SITNA/feature/Point';
import Marker from '../../SITNA/feature/Marker';
import md5 from 'md5';

TC.control = TC.control || {};
TC.control.infoShare = infoShare;
TC.Control = Control;

Consts.event.TOOLSCLOSE = Consts.event.TOOLSCLOSE || 'toolsclose.tc';
Consts.event.TOOLSOPEN = Consts.event.TOOLSOPEN || 'toolsopen.tc';
Consts.event.DIALOG = Consts.event.DIALOG || 'dialog.tc';
Consts.classes.UNPLUGGED = "tc-unplugged";

const isPolyline = feat => feat instanceof Polyline;
const isMultiPolyline = feat => feat instanceof MultiPolyline;
const isAnyLine = feat => isPolyline(feat) || isMultiPolyline(feat);
const getFirstPoint = feat => isMultiPolyline(feat) ? feat.geometry[0][0] : feat.geometry[0];
const getLastPoint = feat => isMultiPolyline(feat) ? feat.geometry[0][feat.geometry[0].length - 1] : feat.geometry[feat.geometry.length - 1];

let lastMapCenter = null;
let followingZoom = false;

const zoomHandler = function () {
    if (!lastMapCenter || (lastMapCenter[0] !== this.getCenter()[0] && lastMapCenter[1] !== this.getCenter()[1])) {
        lastMapCenter = this.getCenter();
        if (!followingZoom) {
            this.getControlsByClass(TC.control.Geolocation)[0].setFollowing(false);
        }
    }
};

/* inicio gestión suspensión de la pantalla en móviles */
const wakeLockSupported = 'wakeLock' in navigator;
let wakeLock = null;
let notifications = null;

const getHiddenProperty = function () {
    const prefixes = ['webkit', 'moz', 'ms', 'o'];
    if ('hidden' in document) {
        return 'hidden';
    }
    for (var i = 0; i < prefixes.length; i++) {
        if (prefixes[i] + 'Hidden' in document) {
            return prefixes[i] + 'Hidden';
        }
    }
    return null;
};

/*
 * Recibe una sucesión de tracks y la ordena por nombre.
 */
const orderTracks = function (tracks) {
    var tracksArray = [];

    for (var index in tracks) {
        if (tracks[index] && typeof tracks[index] === "object") {
            tracksArray.push(tracks[index]);
            tracksArray.sort(function (a, b) {
                if (typeof a.name === "string") {
                    return Util.isFunction(a.name.localeCompare) ? a.name.localeCompare(b.name) : 0;
                } else { return 0; }
            });
        }
    }

    return tracksArray;
};

class Geolocation extends Control {
    const = {
        className: {
            ACTIVE: 'tc-ctl-geolocation-active',
            DRAWACTIVATED: 'draw-activated',
            SIMULATIONACTIVATED: 'simulation-activated',
            PLAY: 'tc-play',
            PAUSE: 'tc-pause'
        },
        selector: {
            //SIMULATE: '.tc-btn-simulate',
            DRAW: '.tc-draw',
            EDIT: '.tc-btn-edit',
            DELETE: '.tc-btn-delete',
            SAVE: '.tc-btn-save',
            CANCEL: '.tc-btn-cancel',
            EXPORT: '.tc-btn-export',
            SHARE: '.tc-btn-share',
            STOP: '.tc-btn-stop',
            PAUSE: '.tc-btn-pause',
            BACKWARD: '.tc-btn-backward',
            FORWARD: '.tc-btn-forward',
            SPEED: '.tc-spn-speed',
            VISIBILITY: 'sitna-toggle.tc-chk-track-visibility'
        },
        localStorageKey: {
            GEOTRACKING: 'trk',
            GEOTRACKINGTEMP: 'trktemp',
            GEOTRACKINGSHOWADVERTISEMENT: 'trkAdvertisement',
            GPSSHOWADVERTISEMENT: 'gpsAdvertisement',
            TEST: 'test'
        },
        event: {
            POSITIONCHANGE: 'positionchange.tc.geolocation',
            GPSPOSITIONCHANGE: 'gpspositionchange.tc.geolocation',
            GPSPOSITIONERROR: 'positionerror.tc.geolocation',
            STATEUPDATED: 'stateupdated.tc.geolocation',
            GPSADD: 'gpsadd.tc.geolocation',
            TRACKSNAPPING: 'tracksnapping.tc.geolocation',
            DRAWTRACK: 'drawtrack.tc.geolocation',
            CLEARTRACK: 'cleartrack.tc.geolocation',
            IMPORTEDTRACK: 'importedtrack.tc.geolocation'
        },
        supportedFileExtensions: [
            '.kml',
            '.gpx'
        ],
        layer: {
            GPS: "gps",
            TRACK: "track",
            GEOTRACKING: "geotracking"
        }
    };
    markerStyle = {
        radius: 10,
        fillColor: [255, 0, 0, 100],
        strokeColor: [255, 255, 255, 255],
        strokeWidth: 2
    };
    lineStyle = {
        strokeWidth: 2,
        strokeColor: [0, 206, 209, 255]
    };
    delta = 500;
    walkingSpeed = 5000;
    notificationConfig = {};
    storageCrs = 'EPSG:4326';
    snappingTolerance;
    featuresToShare = [];
    #dialogDiv;
    #shareDialogDiv;
    #interpolationPanel;
    #elevationsCheckbox;
    #trackVisibility = true;
    #isFollowing = true;
    #onWindowBlurred;
    #onWindowFocused;
    #onWindowVisibility;
    #onResize;
    #elevationProfileCache = new Map();
    #elevationFromServiceCache = [];
    #startMarker;
    #finishMarker;

    constructor() {
        super(...arguments);
        const self = this;
        self.div.classList.add(self.CLASS);

        self.template = {};
        self.template[self.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-geolocation.hbs";
        self.template[self.CLASS + '-track-node'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-track-node.hbs";
        self.template[self.CLASS + '-track-snapping-node'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-track-snapping-node.hbs";
        self.template[self.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-dialog.hbs";
        self.template[self.CLASS + '-tracking-toast'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-tracking-toast.hbs";
        self.template[self.CLASS + '-ext-dldlog'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-ext-dldlog.hbs";
        self.template[self.CLASS + '-share-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-share-dialog.hbs";

        self.#dialogDiv = Util.getDiv(self.options.dialogDiv);
        if (!self.options.dialogDiv) {
            document.body.appendChild(self.#dialogDiv);
        }

        self.#shareDialogDiv = Util.getDiv({});
        document.body.appendChild(self.#shareDialogDiv);

        self.snappingTolerance = self.options.snappingTolerance || 50;

        self.exportsState = true;

        self.simulationStopped = true;

        self._uiElementSelector = 'ol > li[data-id]';
        self._toolContainerSelector = `.${self.CLASS}-tools-active`;
    }

    getClassName() {
        return 'tc-ctl-geolocation';
    }

    async register(map) {
        const self = this;
        await super.register(map);

        self.wrap = new TC.wrap.control.Geolocation(self);
        self.wrap.register(map);

        map._bufferFeatures = [];

        self.hillDeltaThreshold = self.options && self.options.hillDeltaThreshold ||
            self.map.options.elevation && self.map.options.elevation.hillDeltaThreshold ||
            20;

        const gpsLayerPromise = map.addLayer({
            id: self.getUID(),
            type: Consts.layerType.VECTOR,
            owner: self,
            stealth: true,
            title: 'Posicionar.GPS'
        });

        const geotrackingLayerPromise = map.addLayer({
            id: self.getUID(),
            type: Consts.layerType.VECTOR,
            owner: self,
            stealth: true,
            title: 'Posicionar.Geotracking',
            styles: {
                point: {
                    radius: 3,
                    fillColor: "#00ced1",
                    fillOpacity: function () {
                        return this.track.renderTrack.checked ? 1 : 0;
                    }.bind(self),
                    strokeColor: "#ffffff",
                    fontColor: "#00ced1",
                    labelOutlineColor: "#ffffff",
                    labelOutlineWidth: 1,
                    label: function (feature) {
                        var name = feature.getData().name;
                        if (name && (name + '').trim().length > 0) {
                            name = (name + '').trim().toLowerCase();
                        } else {
                            name = '';
                        }

                        return name;
                    }
                },
                line: [
                    {
                        strokeOpacity: function () {
                            return this.track.renderTrack.checked ? 1 : 0;
                        }.bind(self),
                        strokeWidth: 8,
                        strokeColor: "#ffffff"
                    },
                    {
                        strokeOpacity: function () {
                            return this.track.renderTrack.checked ? 1 : 0;
                        }.bind(self),
                        strokeWidth: 4,
                        strokeColor: "#00ced1"
                    }]
            }
        });
        const trackLayerPromise = map.addLayer({
            id: self.getUID(),
            type: Consts.layerType.VECTOR,
            owner: self,
            stealth: true,
            title: 'Posicionar.Track',
            styles: {
                line: {
                    strokeWidth: 2,
                    strokeColor: "#C52737"
                },
                point: {
                    radius: function (feature) {
                        const name = feature?.getData()?.name;
                        if (name && (name + '').trim().length > 0) {
                            return 3;
                        } else {
                            return 6;
                        }
                    },
                    fillColor: "#C52737",
                    strokeColor: "#27C537",
                    fontColor: "#C52737",
                    fontSize: 10,
                    labelOutlineColor: "#ffffff",
                    labelOutlineWidth: 2,
                    label: function (feature) {
                        let name = feature?.getData()?.name;
                        if (name && (name + '').trim().length > 0) {
                            name = (name + '').trim().toLowerCase();
                        } else {
                            name = '';
                        }

                        return name;
                    }
                }
            }
        });

        map.on(Consts.event.FEATURESIMPORT, function (e) {
            const self = this;

            const featuresImport = function (e) {
                const fileName = e.fileName;
                const target = e.dropTarget;
                var kmlPattern = '.' + Consts.format.KML.toLowerCase();
                var gpxPattern = '.' + Consts.format.GPX.toLowerCase();

                // GLS: ¿es un GPX?
                if (fileName.toLowerCase().indexOf(gpxPattern) === fileName.length - gpxPattern.length ||
                    // GLS: ¿es un KML y viene desde el upload de Geolocation?
                    fileName.toLowerCase().indexOf(kmlPattern) === fileName.length - kmlPattern.length && target === self) {

                    self.clear(self.const.layer.TRACK);
                    const importedGPX = function () {
                        //Controlamos que todo ha acabado para hacer zoom a las features y ocultar el loading
                        setTimeout(function () {
                            self.map._bufferFeatures = self.map._bufferFeatures.concat(e.features);
                            window.dropFilesCounter--;
                            if (window.dropFilesCounter === 0) {
                                self.map.zoomToFeatures(self.map._bufferFeatures);
                                self.map._bufferFeatures = [];
                                delete window.dropFilesCounter;
                                var li = self.map.getLoadingIndicator();
                                if (li) {
                                    li.removeWait(self.map._fileDropLoadingIndicator);
                                }
                                self.off(self.const.event.IMPORTEDTRACK, importedGPX);
                            }
                        }, 0);
                    };
                    self.on(self.const.event.IMPORTEDTRACK, importedGPX);
                    self.importTrack(e);

                    if (/.kml$/g.test(fileName.toLowerCase()) && self.trackLayer) {
                        if (self.trackLayer.styles) {
                            self.trackLayer.features.forEach(function (feature) {
                                if (feature instanceof Point && self.trackLayer.styles.point) {
                                    feature.setStyle(self.trackLayer.styles.point);
                                } else if (isAnyLine(feature) && self.trackLayer.styles.line) {
                                    feature.setStyle(self.trackLayer.styles.line);
                                }
                            });
                        }
                    }
                } else {
                    //GLS: si es un KML pero viene desde el mapa o es otro tipo de archivo que no es ni GPX ni KML, lo ignoramos
                    return;
                }
            };

            if (self.working && Util.isFunction(self.working.then)) {
                self.working.then(featuresImport(e));
            } else {
                self.working = true;
                featuresImport(e);
            }

        }.bind(self));

        map.on(Consts.event.PROJECTIONCHANGE, function (e) {
            if (self.elevationChartData) {
                self.elevationChartData.coords = Util.reproject(self.elevationChartData.coords, e.oldCrs, e.newCrs);
                if (self.elevationChartData.secondaryElevationProfileChartData && self.elevationChartData.secondaryElevationProfileChartData.length)
                    self.elevationChartData.secondaryElevationProfileChartData.forEach((secElevChartData) => {
                        secElevChartData.eleCoordinates = Util.reproject(secElevChartData.eleCoordinates, e.oldCrs, e.newCrs);
                    });
            }
        });

        map.on(Consts.event.DIALOG, function (e) {
            if (e.control) {
                switch (e.action) {
                    case "share":
                        if (e.control.caller !== self) {
                            self.#onShowShareDialog(e.control.caller);
                        }
                        break;
                    case "download":
                        self.#onShowDownloadDialog(e.control.caller);
                        break;
                }
            }
        });

        map.on(Consts.event.FILESAVE, function (e) {
            const newFile = Object.prototype.hasOwnProperty.call(e, 'oldFileHandle');
            const eventFileHandle = newFile ? e.oldFileHandle : e.fileHandle;
            if (self.trackLayer._fileHandle) {
                self.trackLayer._fileHandle.isSameEntry(eventFileHandle).then(result => {
                    if (result) {
                        const trackItem = self.getSelectedTrackItem();
                        const saveTrackOptions = { uid: trackItem.dataset.uid };
                        if (newFile) {
                            // El handle ha cambiado, hay que actualizarlo
                            saveTrackOptions.fileHandle = e.fileHandle;
                        }
                        self.saveTrack(saveTrackOptions).then(function () {
                            if (newFile) {
                                self.availableTracks = null;
                                if (trackItem.querySelector('input').value === e.oldFileHandle?.name) {
                                    self.editTrackName(saveTrackOptions.uid, saveTrackOptions.fileHandle.name);
                                }
                            }
                        });
                    }
                });
            }
        });

        map.on(Consts.event.FEATUREREMOVE, function (e) {
            if (e.layer === self.trackLayer && isAnyLine(e.feature)) {
                self.updateEndMarkers();
            }
        });

        self.notificationConfig = Object.assign(self.options.notification || {}, {
            tag: "Geolocation Track",
            vibrate: [200],
            renotify: true,
            requireInteraction: true,
            body: self.getLocaleString("geo.trk.notification.body")
        }, {
            title: self.options.notification && self.options.notification.title ? self.getLocaleString(self.options.notification.title) : document.title
        });

        self.gpsLayer = await gpsLayerPromise;
        self.geotrackingLayer = await geotrackingLayerPromise;
        self.trackLayer = await trackLayerPromise;

        const newPosition = self.map.layers.indexOf(self.trackLayer);
        self.map.insertLayer(self.gpsLayer, newPosition)
        return self;
    }

    async render(callback) {
        const self = this;
        await self._set1stRenderPromise(self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self.#dialogDiv.innerHTML = html;
        }));
        await self.getDownloadDialog();
        self._downloadDialog.caller = self;
        await self.getRenderedHtml(self.CLASS + '-ext-dldlog', { controlId: self.id }, function (html) {
            var template = document.createElement('template');
            template.innerHTML = html;
            self._downloadDialogExtNode = template.content ? template.content.firstChild : template.firstChild;
            self.getRenderedHtml(self.CLASS + '-share-dialog', {}, function (html) {
                self.#shareDialogDiv.innerHTML = html;
                return self.renderData({ controlId: self.id }, callback);
            });
        });
    }

    #getDownloadFileName = function (elem) {
        const self = this;
        var filename = elem.querySelector('span').textContent;
        var regex = new RegExp(self.const.supportedFileExtensions.join('|'), 'gi');
        return filename.replace(regex, '') + "_" + Util.getFormattedDate(new Date(), true);
    }

    async #getElevationFromService(feature) {
        const self = this;
        let cachedFeature = self.#getElevationFromServiceOnCache(feature);
        if (cachedFeature) {
            console.log('Tengo datos en cache');
            return cachedFeature.data;
        } else {
            console.log('NO tengo datos en cache');
            const tool = await self.getElevationTool();
            if (tool) {
                let cloned = feature.clone();
                try {
                    let toDownload = await tool.setGeometry({ features: [cloned], crs: self.map.crs });
                    self.#cacheElevationFromService(feature, toDownload[0]);
                    return toDownload[0];
                } catch (e) {
                    return null;
                }
            }
        }
    }

    async getElevationControl() {
        const self = this;

        if (!self.elevationControl) {
            let options = {};
            if (!self.options.displayElevation && self.options.displayOn) {
                options.displayOn = self.options.displayOn;
            } else if (self.options.displayElevation) {
                options = self.options.displayElevation;
            }
            if (Object.prototype.hasOwnProperty.call(self.options, 'resolution')) { // la configuración de la resolución es distinta al obtener el perfil (0) que para la descarga (20). La configuración para la descarga se gestiona en getDownloadDialog...
                options.resolution = self.options.resolution;
            } else {
                options.resolution = 0;
            }
            self.elevationControl = await self.map.addControl('elevation', options);

            self.elevationControl._decorateChartPanel = function () {
                this.resultsPanel.setCurrentFeature = function (_feature) {
                    const that = this;
                    that.currentFeature = self.trackLayer.features.filter((feature) => {
                        return !(feature instanceof Marker) && !(feature instanceof Point);
                    })[0];
                    const selectedTrackItem = self.getSelectedTrackItem();
                    if (selectedTrackItem && that.currentFeature) {
                        that.currentFeature.uid = selectedTrackItem.dataset.uid;
                        that.currentFeature.fileName = self.#getDownloadFileName(selectedTrackItem);
                    }

                };
            };

        }
        return self.elevationControl;
    }

    importTrack(options) {
        const self = this;
        if (!self.isDisabled) {
            if (options.fileName && options.features && options.features.length > 0) {
                const wait = self.getLoadingIndicator().addWait();
                self.importedFileName = options.fileName;
                const addPromises = [];
                for (var i = 0, len = options.features.length; i < len; i++) {
                    addPromises.push(self.trackLayer.addFeature(options.features[i]));
                }
                Promise.all(addPromises).then(function () {
                    self.wrap.processImportedFeatures({
                        wait: wait,
                        notReproject: options.notReproject,
                        fileHandle: options.fileHandle
                    });
                    if (self.trackLayer) { // Si tenemos capa es que todo ha ido bien y gestionamos el despliegue del control
                        // Desplegamos el control "ubicar" al importar mediante drag&drop
                        self.highlight();

                        if (options.fileHandle) {
                            self.trackLayer._fileHandle = options.fileHandle
                        }

                        self.div.querySelector(`sitna-tab[for="${self.id}-tracks-panel"]`).selected = true;

                        if (!options.isShared) {
                            // abrimos el panel de herramientas
                            self.map.trigger(Consts.event.TOOLSOPEN);
                        }
                    }
                });
            }
        } else if (/.gpx$/g.test(options.fileName.toLowerCase())) {
            self.map.toast(self.getLocaleString("geo.trk.import.disabled"), { type: Consts.msgType.WARNING });
        }
    }

    async #prepareFeaturesToShare(options) {
        const self = this;
        let trackUid = options.uid;
        if (trackUid) {
            const storageData = self.availableTracks.find(function (saved) {
                return saved.uid.toString() === trackUid.toString();
            }).data;

            const storageFeatures = new ol.format.GeoJSON().readFeatures(storageData);
            const promises = new Array(storageFeatures.length);
            storageFeatures.forEach(function (f, idx) {
                promises[idx] = TC.wrap.Feature.createFeature(f);
            });

            const tcFeatures = await Promise.all(promises);
            let features = tcFeatures.map(function (f) {
                const fObj = {};
                switch (true) {
                    case f instanceof Marker:
                        fObj.type = Consts.geom.MARKER;
                        break;
                    case f instanceof Point:
                        fObj.type = Consts.geom.POINT;
                        break;
                    case f instanceof Polyline:
                        fObj.type = Consts.geom.POLYLINE;
                        break;
                    case f instanceof MultiPolyline:
                        fObj.type = Consts.geom.MULTIPOLYLINE;
                        break;
                }
                fObj.id = f.id;
                fObj.geom = f.geometry; // El redondeo hace que ya no podamos validar con los tracks existentes.
                fObj.data = f.getData();

                return fObj;
            });

            if (options.setFeaturesToShare) {
                self.featuresToShare = features;
            }
            return features;
        } else {
            throw Error('No track uid');
        }
    }

    #onShowShareDialog(caller) {
        const self = this;
        if (caller instanceof Element || caller instanceof HTMLDocument) {
            if (caller.classList.contains(self.CLASS + '-share-dialog')) {
                return infoShare.onShowShareDialog.call(self);
            } else {
                return Promise.resolve();
            }
        } else if (caller === self) {
            return infoShare.onShowShareDialog.call(self);
        }
        else if (caller !== self &&
            caller.toShare &&
            caller.toShare.feature &&
            caller.toShare.feature.layer === self.trackLayer) {
            // cerramos el diálogo abierto por featureTools para mostrar el de geolocation
            Util.closeModal(function () {
                infoShare.onCloseShareDialog.call(caller);
                const selectedTrackItem = self.getSelectedTrackItem();
                if (selectedTrackItem) {
                    return self.#setTrackToShare(selectedTrackItem).then(function () {
                        const shareDialog = self.#shareDialogDiv.querySelector('.' + self.CLASS + '-share-dialog');
                        Util.showModal(shareDialog, {
                            openCallback: function () {
                                return TC.control.infoShare.onShowShareDialog.call(self);
                            },
                            closeCallback: function () {
                                TC.control.infoShare.onCloseShareDialog.call(self);
                            }
                        });

                    });
                } else {
                    return Promise.resolve();
                }
            });
        }
    }

    #onShowDownloadDialog(caller, allFeatures) {
        const self = this;
        const RADIO_TRACK = "track";
        const RADIO_MDT = "mdt";
        const originalDialogFeatures = self._downloadDialog.getFeatures();

        // llega desde el panel del perfil del track: hacemos que el diálogo sea igual que cuando llega desde la lista aunque lo invoque featureTools
        if (caller !== self && self._downloadDialog.getFeatures().every(f => f && f.layer === self.trackLayer)) {
            let currentOptions = self._downloadDialog.getOptions();
            let controlOptions = self.getDownloadDialogOptions();
            currentOptions.elevation = controlOptions.elevation;
            delete currentOptions.openCallback;

            self._downloadDialog.open(self._downloadDialog.getFeatures(), currentOptions);
        }

        // normalizamos el nombre del archivo de la descarga
        if (originalDialogFeatures.length === 1 && originalDialogFeatures.every((f) => f && f.fileName)) {
            self._downloadDialog.setOptions({ fileName: originalDialogFeatures[0].fileName });
        }

        // si no tenemos configurada la opción del perfil desde MDT retornamos sin gestionar nada más
        if (!self.options.displayElevation) {
            return;
        }

        // llega desde la lista de tracks || llega desde el panel del perfil de un track 
        if (caller === self || self._downloadDialog.getFeatures().every(f => f && f.layer === self.trackLayer)) {
            if (!self._downloadDialog.modalBody.querySelector('.' + self.CLASS + "-ext-dldlog")) {
                let divToExtensions = self._downloadDialog.modalBody.querySelector('.' + self._downloadDialog.CLASS + "-ext");
                if (divToExtensions) {
                    divToExtensions.appendChild(self._downloadDialogExtNode);

                    self.#elevationsCheckbox = self._downloadDialog.modalBody.querySelector('.' + self._downloadDialog.CLASS + "-elev input[type='checkbox']");
                    self.#interpolationPanel = self._downloadDialog.modalBody.querySelector('.' + self._downloadDialog.CLASS + "-ip");
                    const radioDlSource = self._downloadDialog.modalBody.querySelectorAll(`input[type=radio][name="${self.id}-dldlog-source"]`);

                    // si el track no tiene elevaciones y solo contamos con las del MDT ocultamos el botón de descargar originales                    
                    const disableOriginalsRadio = function (condition) {
                        const originalsRadio = radioDlSource[0];
                        if (condition) {
                            if (!originalsRadio.classList.contains(Consts.classes.DISABLED)) {
                                originalsRadio.classList.add(Consts.classes.DISABLED);
                            }
                        } else {
                            originalsRadio.classList.remove(Consts.classes.DISABLED);
                        }
                    };
                    let feature = originalDialogFeatures.filter(isAnyLine)[0];
                    const firstPoint = getFirstPoint(feature);
                    let noZ = firstPoint.length === 2;
                    if (noZ) {
                        disableOriginalsRadio(noZ);
                    } else if (firstPoint.length > 2) {
                        const coordinates = isMultiPolyline(feature) ? feature.geometry.flat() : feature.geometry;
                        disableOriginalsRadio(coordinates.map(c => c[2]).every(val => val === 0));
                    }


                    const interpolationPanelIsHidden = function () {
                        return self.#interpolationPanel && self.#interpolationPanel.classList.contains(Consts.classes.HIDDEN);
                    };
                    const setInterpolationPanelVisibility = function () {
                        if (radioDlSource[0].checked && !interpolationPanelIsHidden()) {
                            self.#interpolationPanel.classList.add(Consts.classes.HIDDEN);
                        } else if (radioDlSource[0].checked) {
                            let observer = new MutationObserver(function (mutations) {
                                mutations.filter(m => m.attributeName === "class").forEach(function (mutation) {
                                    if (mutation.oldValue.indexOf(Consts.classes.HIDDEN) > -1) {
                                        if (radioDlSource[0].checked) {
                                            self.#interpolationPanel.classList.add(Consts.classes.HIDDEN);
                                            observer.disconnect();
                                        } else {
                                            observer.disconnect();
                                        }
                                    }
                                });
                            });

                            let config = { attributes: true, attributeOldValue: true };
                            observer.observe(self.#interpolationPanel, config);
                        } else {
                            if (interpolationPanelIsHidden() && self.#elevationsCheckbox.checked) {
                                self.#interpolationPanel.classList.remove(Consts.classes.HIDDEN);
                            }
                        }
                    };

                    if (self.#elevationsCheckbox) {
                        if (self.#elevationsCheckbox.checked) {
                            setInterpolationPanelVisibility();
                            self._downloadDialogExtNode.classList.remove(Consts.classes.HIDDEN);
                        } else if (!self._downloadDialogExtNode.classList.contains(Consts.classes.HIDDEN)) {
                            self._downloadDialogExtNode.classList.add(Consts.classes.HIDDEN);
                        }
                        self.#elevationsCheckbox.addEventListener("change", function () {
                            setInterpolationPanelVisibility();
                            self._downloadDialogExtNode.classList.toggle(Consts.classes.HIDDEN);
                        });
                    }

                    if (radioDlSource) {
                        setInterpolationPanelVisibility();
                        radioDlSource.forEach(item => {
                            if (item.dataset.hasChangeEvent) {
                                return;
                            }
                            item.dataset.hasChangeEvent = true;
                            item.addEventListener("change", async function (e) {
                                if (e.target.checked) {
                                    setInterpolationPanelVisibility();
                                    let featuresToDownload;
                                    if (e.target.value === RADIO_TRACK) {
                                        featuresToDownload = originalDialogFeatures;
                                    } else {
                                        let featuresFromDialog = originalDialogFeatures;
                                        let feature = featuresFromDialog.filter(isAnyLine)[0];

                                        if (allFeatures) {
                                            featuresToDownload = featuresFromDialog.filter((feat) => {
                                                return feat instanceof Point;
                                            });
                                        }

                                        let uid = feature.uid;
                                        let cachedProfile = self.#getElevationProfileFromCache(uid);
                                        if (cachedProfile) {
                                            // Clonamos la feature para presevar la geometría original por si el usuario cambia de nuevo a track
                                            let toDownload = feature.clone();
                                            toDownload.setCoords(cachedProfile.secondaryElevationProfileChartData[0].coords);
                                            if (allFeatures) {
                                                if (!featuresToDownload) {
                                                    featuresToDownload = self.#getCurrentPoints() || [];
                                                }
                                                featuresToDownload.push(toDownload);
                                            } else {
                                                featuresToDownload = toDownload;
                                            }
                                        } else {
                                            self._downloadDialog.modalBody.classList.add(Consts.classes.LOADING);

                                            let toDownload = await self.#getElevationFromService(feature);
                                            if (toDownload) {
                                                if (allFeatures) {
                                                    featuresToDownload.push(toDownload);
                                                } else {
                                                    featuresToDownload = toDownload;
                                                }
                                            } else {
                                                self.map.toast(self.getLocaleString("elevation.error"), { type: Consts.msgType.ERROR, duration: 5000 });
                                                radioDlSource[0].checked = true;
                                            }

                                            self._downloadDialog.modalBody.classList.remove(Consts.classes.LOADING);
                                        }
                                    }

                                    self._downloadDialog.setFeatures(featuresToDownload);
                                }
                            });
                        });

                        if (radioDlSource[0].classList.contains(Consts.classes.DISABLED) ||
                            document.querySelector('.' + self.CLASS + '-ext-dldlog input[type=radio]:checked').value === RADIO_MDT) {
                            const mdtRadio = radioDlSource[1];
                            mdtRadio.checked = true;
                            mdtRadio.dispatchEvent(new Event('change'));
                        }
                    }

                    if (originalDialogFeatures.length === 1 && originalDialogFeatures[0].fileName) {
                        self._downloadDialog.setOptions({ fileName: originalDialogFeatures[0].fileName });
                    }
                }
            }
        }
    }

    getDownloadDialogOptions(fileName) {
        const self = this;

        const options = {
            title: self.getLocaleString('download'),
            fileName: fileName,
            openCallback: function () {
                self.#onShowDownloadDialog(self, true);
            }
        };
        if (self.options.displayElevation) {
            options.elevation = {
                resolution: self.options.displayElevation && self.options.displayElevation.resolution || self.map.options.elevation && self.map.options.elevation.resolution || 20,
                sampleNumber: self.options.displayElevation && self.options.displayElevation.sampleNumber || self.map.options.elevation && self.map.options.elevation.sampleNumber || 0,
                checked: true
            };
        } else {
            options.elevation = {
                checked: true
            };
        }

        return options;
    }

    #showAlert = function () {
        const self = this;
        self.map.toast(self.div.querySelector(".tc-alert-warning").innerHTML, {
            duration: 10000
        });
    }

    #activateGeotrackingState() {
        const self = this;
        self.track.activateButton.classList.add(Consts.classes.HIDDEN);
        self.track.deactivateButton.classList.remove(Consts.classes.HIDDEN);
    }

    #deactivateGeotrackingState() {
        const self = this;
        self.track.activateButton.classList.remove(Consts.classes.HIDDEN);
        self.track.deactivateButton.classList.add(Consts.classes.HIDDEN);
    }

    renderData(data, callback) {
        const self = this;

        const sel = self.const.selector;

        return super.renderData(data, function () {

            //const options = self.div.querySelectorAll(`.${self.CLASS}-panel`);
            //self.div.querySelectorAll('.' + self.CLASS + '-select span').forEach(function (span) {
            //    span.addEventListener(Consts.event.CLICK, function (e) {
            //        var label = e.target;
            //        while (label && label.tagName !== 'LABEL') {
            //            label = label.parentElement;
            //        }
            //        const newFormat = label.querySelector(`input[type=radio][name="${self.id}-mode"]`).value;

            //        options.forEach(function (option) {
            //            option.classList.toggle(Consts.classes.HIDDEN, !option.matches('.' + self.CLASS + '-' + newFormat));
            //        });
            //    }, { passive: true });
            //});

            self.track = {
                activateButton: self.div.querySelector(`.${self.CLASS}-track-ui-activate`),
                deactivateButton: self.div.querySelector(`.${self.CLASS}-track-ui-deactivate`),
                trackSearch: self.div.querySelector(`.${self.CLASS}-track-available-srch`),
                trackImportFile: self.div.querySelector(`.${self.CLASS}-track-import`),
                trackSave: self.div.querySelector(`.${self.CLASS}-track-save`),
                trackAdd: self.div.querySelector(`.${self.CLASS}-track-add-wpt`),
                trackContinue: self.#dialogDiv.querySelector(`.${self.CLASS}-track-continue`),
                trackRenew: self.#dialogDiv.querySelector(`.${self.CLASS}-track-new`),
                trackClose: self.#dialogDiv.querySelector(`.${self.CLASS}-continue-track-dialog button.tc-modal-close`),
                //trackAddSegment: self.div.querySelector('#tc-ctl-geolocation-track-segment'),
                trackAdvertisementOK: self.#dialogDiv.querySelector(`.${self.CLASS}-track-advert-ok`)
            };

            self.track.trackList = self.div.querySelector(`.${self.CLASS}-track-available-lst`);

            self.track.trackToolPanelOpened = self.div.querySelector(`.${self.CLASS}-track-panel-block input[type="checkbox"]`);

            self.div.querySelector('.' + self.CLASS + '-track-panel-help').addEventListener('click', function () {
                self.#showAlert();
            });

            self.track.trackName = self.div.querySelector(`.${self.CLASS}-track-title`);

            self.track.trackWPT = self.div.querySelector(`.${self.CLASS}-track-waypoint`);

            if (Util.detectMobile()) {
                if (matchMedia('screen and (max-height: 50em) and (max-width: 50em)').matches)
                    self.track.trackToolPanelOpened.checked = false;
            }

            if (window.File && window.FileReader && window.FileList && window.Blob) {
                self.track.trackImportFile.disabled = false;
                // GLS: Eliminamos el archivo subido, sin ello no podemos subir el mismo archivo seguido varias veces
                self.track.trackImportFile.addEventListener(Consts.event.CLICK, function (_e) {
                    // Envolvemos el input en un form
                    const input = this;
                    const form = document.createElement('form');
                    const parent = input.parentElement;
                    parent.insertBefore(form, input);
                    form.appendChild(input);
                    form.reset();
                    // Desenvolvemos el input del form
                    form.insertAdjacentElement('afterend', input);
                    parent.removeChild(form);
                }, { passive: true });

                const _layerError = function () {
                    self.map.off(Consts.event.LAYERERROR, _layerError);
                    self.clearFileInput(self.track.trackImportFile);

                    TC.alert(self.getLocaleString("geo.trk.upload.error3"));
                };

                self.track.trackImportFile.addEventListener('change', function (e) {
                    if (!self._cleaning) { // Valido que el evento import no lo provoco yo al limpiar el fileinput (al limpiar se lanza el change)                        
                        self.clear(self.const.layer.TRACK);

                        if (self.map) {
                            self.map.on(Consts.event.LAYERERROR, _layerError);
                            self.map.wrap.loadFiles(e.target.files, { control: self });
                        }
                    }
                });
            } else {
                console.log('no es posible la importación');
            }

            self.track.activateButton.addEventListener('click', function () {
                self.activateGeotracking();
            });
            self.track.deactivateButton.addEventListener('click', function () {
                self.deactivateGeotracking();
            });

            const filter = function (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                //tc-ctl-geolocation-track-available-empty
                const lis = Array.from(self.track.trackList.querySelectorAll('li'));
                lis.forEach(function (li) {
                    li.style.display = 'none';
                });
                const trackLis = lis.filter(function (li) {
                    return li.matches('li:not([class]),li.' + Consts.classes.CHECKED);
                });

                const searchIcon = self.div.querySelector(`.${self.CLASS}-track-search-icon`);
                if (searchTerm.length === 0) {
                    trackLis.forEach(function (li) {
                        li.style.display = '';
                    });
                    searchIcon.style.visibility = 'visible';
                } else {
                    searchIcon.style.visibility = 'hidden';
                    var r = new RegExp(searchTerm, 'i');
                    trackLis.forEach(function (li) {
                        li.style.display = r.test(li.querySelector('span').textContent) ? '' : 'none';
                    });

                    if (!trackLis.some(function (li) {
                        return li.style.display === '';
                    })) {
                        lis.forEach(function (li) {
                            if (li.matches('[class^="tc-ctl-geolocation-track-not"]')) {
                                li.style.display = '';
                            }
                        });
                    }
                }
            };
            const trackSearchListener = function () {
                filter(this.value.toLowerCase().trim());
            };
            self.track.trackSearch.addEventListener("keyup", trackSearchListener);
            self.track.trackSearch.addEventListener("search", trackSearchListener);

            // en el panel
            self.track.trackSave.addEventListener('click', self.saveTrack.bind(self));
            self.track.trackAdd.addEventListener('click', self.addWaypoint.bind(self));

            const list = self.div.querySelector(`.${self.CLASS}-track-available-lst`);

            // en lista
            const editName = function (edit, elm) {
                if (elm.tagName !== 'LI') {
                    elm = elm.parentElement.parentElement;
                }

                const input = elm.querySelector('input');
                const span = elm.querySelector('span');

                if (edit) {

                    input.classList.remove(Consts.classes.HIDDEN);
                    input.focus();
                    input.value = span.textContent;
                    span.classList.add(Consts.classes.HIDDEN);
                    elm.dataset.title = elm.title;
                    elm.title = "";

                    //elm.querySelector(sel.SIMULATE).classList.add(Consts.classes.HIDDEN);
                    elm.querySelector(sel.EDIT).classList.add(Consts.classes.HIDDEN);
                    elm.querySelector(sel.DELETE).classList.add(Consts.classes.HIDDEN);
                    elm.querySelector(sel.DRAW).classList.add(Consts.classes.HIDDEN);
                    elm.querySelector(sel.EXPORT).classList.add(Consts.classes.HIDDEN);
                    elm.querySelector(sel.SHARE).classList.add(Consts.classes.HIDDEN);

                    elm.querySelector(sel.SAVE).classList.remove(Consts.classes.HIDDEN);
                    elm.querySelector(sel.CANCEL).classList.remove(Consts.classes.HIDDEN);
                } else {

                    input.classList.add(Consts.classes.HIDDEN);
                    span.classList.remove(Consts.classes.HIDDEN);
                    elm.title = elm.dataset.title;
                    delete elm.dataset.title;

                    //elm.querySelector(sel.SIMULATE).classList.remove(Consts.classes.HIDDEN);
                    elm.querySelector(sel.EDIT).classList.remove(Consts.classes.HIDDEN);
                    elm.querySelector(sel.DELETE).classList.remove(Consts.classes.HIDDEN);
                    elm.querySelector(sel.DRAW).classList.remove(Consts.classes.HIDDEN);
                    elm.querySelector(sel.EXPORT).classList.remove(Consts.classes.HIDDEN);
                    elm.querySelector(sel.SHARE).classList.remove(Consts.classes.HIDDEN);

                    elm.querySelector(sel.SAVE).classList.add(Consts.classes.HIDDEN);
                    elm.querySelector(sel.CANCEL).classList.add(Consts.classes.HIDDEN);
                }
            };

            self.uiSimulate = function (_simulate, elm) {
                if (elm) {

                    var cnt = elm.tagName === 'LI' ? elm : elm.parentNode;
                    const btnPause = cnt.querySelector(sel.PAUSE);
                    btnPause.classList.add(self.const.className.PLAY);
                    btnPause.setAttribute('title', self.getLocaleString("tr.lst.start"));
                    self.simulationStopped = true;

                }
            };

            //list.addEventListener('click', TC.EventTarget.listenerBySelector(sel.SIMULATE, function (e) {
            //    var wait = self.getLoadingIndicator().addWait();

            //    e.target.parentElement.querySelector(sel.SPEED).textContent = 'x 1';

            //    loadTrack(self, e.target).then(function () { //Para evitar el bloqueo de la interfaz en móviles
            //        self.getLoadingIndicator().removeWait(wait);
            //    });
            //}));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(sel.DRAW, function (e) {
                var wait = self.getLoadingIndicator().addWait();

                drawTrack(self, e.target).then(function () {
                    self.getLoadingIndicator().removeWait(wait);
                });
            }));

            self.on(self.const.event.IMPORTEDTRACK, function (e) {
                if (!self.isDisabled) {
                    const listElement = self.track.trackList.querySelector('li[data-id="' + e.index + '"]');
                    drawTrack(self, listElement.querySelector(sel.DRAW)).then(function () {
                        if (self.loadingState) {
                            delete self.loadingState;
                            delete self.toShare;
                        }
                    });
                    const transitionEvent = function (_event) {
                        if (!HTMLElement.prototype.scrollIntoView) {
                            self.track.trackList.scrollTop = e.index * listElement.offsetHeight;
                        }
                        else {
                            listElement.scrollIntoView({ behavior: "smooth", block: "end" });
                        }
                        listElement.removeEventListener("transitionend", transitionEvent, false);
                    };
                    listElement.addEventListener("transitionend", transitionEvent, false);
                } else {
                    self.map.toast(self.getLocaleString("geo.trk.import.disabled"), { type: Consts.msgType.WARNING });
                }
            });

            const _stopOtherTracks = function (self, trackLiId) {
                self.track.trackList.querySelectorAll('li[data-id]').forEach(function (listItem) {
                    if (listItem.dataset.id !== trackLiId) {
                        //const btnSimulate = listItem.querySelector(sel.SIMULATE);
                        const btnPause = listItem.querySelector(sel.PAUSE);
                        self.simulationStopped = true;

                        //btnSimulate.classList.remove(self.const.className.SIMULATIONACTIVATED);
                        //btnSimulate.setAttribute('title', self.getLocaleString("tr.lst.simulate"));
                        btnPause.classList.add(self.const.className.PLAY);
                        btnPause.setAttribute('title', self.getLocaleString("tr.lst.start"));

                        //self.uiSimulate(false, listItem);
                        editName(false, listItem);
                    }
                });

                // para el resize no me va bien aquí
                //self.clear(self.const.layer.TRACK);
            };

            const drawTrack = function (self, btnDraw) {
                return new Promise(function (resolve, _reject) {

                    const trackLi = btnDraw.parentElement.parentElement;

                    setTimeout(function () {
                        if (trackLi.classList.contains(Consts.classes.CHECKED)) {
                            //self.uiSimulate(false, btnDraw);

                            self.clear(self.const.layer.TRACK);

                            btnDraw.setAttribute('title', btnDraw.textContent);
                            //
                        }
                        else if (self.getSelectedTrackItem()) { // GLS: si hay elemento seleccionado actuamos
                            _stopOtherTracks(self, trackLi.dataset.id);
                            self.working = self.drawTrack(trackLi);
                        } else {
                            self.working = self.drawTrack(trackLi);
                        }

                        /* GLS: 15/02/2019 Preparamos la feature por si se comparte, necesito hacerlo aquí 
                           porque la gestión en asíncrona y todo el flujo de exportación es síncrono */
                        if (trackLi.classList.contains(Consts.classes.CHECKED)) {
                            self.#prepareFeaturesToShare({ uid: trackLi.dataset.uid, setFeaturesToShare: true }).then(function () {
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    }, 0);
                });
            };

            const loadTrack = function (self, btnSimulate) {
                return new Promise(function (resolve, _reject) {
                    setTimeout(function () {
                        const trackLi = btnSimulate.closest("li");
                        const selectedTrackItem = self.getSelectedTrackItem();
                        _stopOtherTracks(self, trackLi.dataset.id);
                        //self.uiSimulate(false, selectedTrackItem);
                        //self.uiSimulate(true, btnSimulate);

                        // para el resize con película mejor así
                        if (selectedTrackItem && trackLi.dataset.id !== selectedTrackItem.dataset.id) {
                            self.clear(self.const.layer.TRACK);
                        }

                        self.simulate_paused = false;
                        self.simulateTrack(trackLi);

                        resolve();
                    }, 0);
                });
            };

            const getParentListElement = function (elm) {
                let result = elm;
                while (result.tagName !== 'LI') {
                    result = result.parentElement;
                }
                return result;
            };

            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.EDIT}`, function (e) {
                editName(true, e.target);
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.DELETE}`, function (e) {
                self.removeTrack(getParentListElement(e.target));
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.SAVE}`, function (e) {
                const li = getParentListElement(e.target);
                var newName = li.querySelector('input').value;
                if (newName.trim().length === 0) {
                    TC.alert(self.getLocaleString('geo.trk.edit.alert'));
                }
                else {
                    self.editTrackName(li.dataset.uid, li.querySelector('input').value);
                    editName(false, e.target);
                }
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.CANCEL}`, function (e) {
                editName(false, e.target);
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.SHARE}`, function (e) {
                self.#setTrackToShare(getParentListElement(e.target)).then(function () {
                    self.showShareDialog(self.#shareDialogDiv);
                });
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.EXPORT}`, function (e) {
                const parent = getParentListElement(e.target);
                e.target.setAttribute('disabled', "");

                self.export(parent).then((features) => {
                    self.getDownloadDialog().then(function (dialog) {
                        const options = self.getDownloadDialogOptions(self.#getDownloadFileName(parent));
                        dialog.open(features.map((f) => { f.uid = parent.dataset.uid; return f; }), options);

                        e.target.removeAttribute('disabled');
                    });
                });
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.STOP}`, function (e) {
                //self.uiSimulate(false, e.target);
                self.wrap.simulateTrackEnd();
                const btnPause = e.target.parentElement.querySelector(sel.PAUSE);
                btnPause.classList.add(self.const.className.PLAY);
                btnPause.setAttribute('title', self.getLocaleString('tr.lst.start'));
                if (!self.simulationStopped)
                    e.target.parentElement.querySelector(sel.SPEED).textContent = 'x 1';
                self.simulationSpeed = 1;
                self.simulationStopped = true;
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.PAUSE}`, function (e) {
                self.simulate_paused = !e.target.classList.contains(self.const.className.PLAY);
                if (self.simulate_paused)
                    self.simulate_pausedElapse = -1;
                else {

                    if (self.simulationStopped) {
                        var wait = self.getLoadingIndicator().addWait();
                        e.target.parentElement.querySelector(sel.SPEED).textContent = 'x 1';
                        loadTrack(self, e.target).then(function () { //Para evitar el bloqueo de la interfaz en móviles
                            self.getLoadingIndicator().removeWait(wait);
                            self.simulationStopped = false;
                        });
                    }


                }

                e.target.setAttribute('title', self.getLocaleString(self.simulate_paused ? 'tr.lst.play' : 'tr.lst.pause'));
                e.target.classList.toggle(self.const.className.PLAY, !!self.simulate_paused);
            }));

            var lapse = 0.5;
            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.BACKWARD}`, function (e) {
                if (self.simulationSpeed === 1)
                    self.simulationSpeed = lapse;
                else self.simulationSpeed = self.simulationSpeed / 2;

                e.target.parentElement.querySelector(`.${self.CLASS} ${sel.FORWARD}`).disabled = false;

                e.target.parentElement.querySelector(sel.SPEED).textContent = self.simulationSpeed < 1 ? '/ ' + 1 / self.simulationSpeed : 'x ' + self.simulationSpeed;

                if (self.simulationSpeed === 0.000244140625) {
                    e.target.disabled = true;
                }
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(`.${self.CLASS} ${sel.FORWARD}`, function (e) {
                self.simulationSpeed = self.simulationSpeed / lapse;

                e.target.parentElement.querySelector(sel.SPEED).textContent = self.simulationSpeed < 1 ? '/ ' + 1 / self.simulationSpeed : 'x ' + self.simulationSpeed;

                e.target.parentElement.querySelector(`.${self.CLASS} ${sel.BACKWARD}`).disabled = false;

                if (self.simulationSpeed === 4096) {
                    e.target.disabled = true;
                }
            }));


            // popup
            self.track.trackContinue.addEventListener('click', function () {
                // cerramos popup y continuamos con el track de session y almacenando en session
                Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                self.setGeotracking();
            });
            self.track.trackRenew.addEventListener('click', function () {
                // eliminamos el track actual de session - restablecemos el geotracking
                delete self.geotrackingSession;
                Util.storage.setSessionLocalValue(self.const.localStorageKey.GEOTRACKINGTEMP, undefined);
                localforage
                    .removeItem(self.const.localStorageKey.GEOTRACKINGTEMP)
                    .catch(err => console.warn(err));
                // cerramos el popup
                Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                self.setGeotracking();
            });
            self.track.trackClose.addEventListener('click', function () {
                self.#deactivateGeotrackingState();
            });
            //self.track.trackAddSegment.addEventListener('click', function () {
            //    TC.alert('pendiente');
            //    // cerramos el popup
            //    Util.closeModal();
            //});

            // popup advertencia
            self.track.trackAdvertisementOK.addEventListener('click', function () {

                const checkboxes = document.body.querySelectorAll('input[name*="Advertisement"]:checked');

                if (checkboxes.length > 0) {
                    localforage
                        .setItem(checkboxes[0].getAttribute('name'), false)
                        .catch(err => console.warn(err));
                }

                Util.closeModal();
            });

            self.track.renderTrack = self.div.querySelector('#tc-ctl-geolocation-track-render-' + self.id);
            self.track.renderTrack.addEventListener('change', function () {
                if (self.track.activateButton.classList.contains(Consts.classes.HIDDEN)) {
                    self.geotrackingLayer.setVisibility(this.checked);
                }

                self.#trackVisibility = this.checked;
            });

            self.#bindTracks();

            if (Util.isFunction(callback)) {
                callback();
            }
        });
    }

    #getCurrentPoints = function () {
        return this.trackLayer.features
            .filter(function (feat) { // filtrando por Point se cuelan los Marker
                return !(feat instanceof Marker) && !isAnyLine(feat);
            });
    }

    async #setTrackToShare(li) {
        const self = this;
        await self.getShareDialog(self.#shareDialogDiv);
        const features = await self.#prepareFeaturesToShare({ uid: li.dataset.uid, setFeaturesToShare: false });
        self.toShare = {
            trackName: li.querySelector('span').innerHTML,
            features: features
        };
    }

    activate() {
        //super.activate();
    }

    deactivate() {
        const self = this;

        Util.closeModal();
        self.clearSelection();
        self.deactivateGeotracking();
        //super.deactivate();
    }

    #setFormatInfoNewPosition(newPosition) {
        const self = this;

        const data = {};
        const locale = Util.getMapLocale(self.map);

        if (self.map.on3DView) {
            var geoCoords = self.map.crs !== self.map.view3D.crs ? Util.reproject(newPosition.position, self.map.crs, self.map.view3D.crs) : newPosition.position;
            data.x = geoCoords[0].toLocaleString(locale);
            data.y = geoCoords[1].toLocaleString(locale);

            data.mdt = Math.round(self.map.view3D.getHeightFromMDT(geoCoords)).toLocaleString(locale);

            data.isGeo = true;

        } else {
            data.x = newPosition.position[0].toLocaleString(locale);
            data.y = newPosition.position[1].toLocaleString(locale);
        }

        data.z = Math.round(newPosition.altitude).toLocaleString(locale);
        data.accuracy = Math.round(newPosition.accuracy).toLocaleString(locale);
        data.speed = newPosition.speed.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

        return data;
    }

    getTrackInfoPanel() {
        const self = this;
        if (!self.track._infoPanelPromise) {
            self.track._infoPanelPromise = new Promise(function (resolve, _reject) {
                if (!self.track.infoPanel) {

                    const resultsPanelOptions = {
                        content: "table",
                        resize: false,
                        titles: {
                            main: self.getLocaleString("geo.mylocation"),
                            max: self.getLocaleString("geo.mylocation.show")
                        },
                        classes: {
                            collapsed: "tc-tracking"
                        }
                    };

                    let ctlPromise;
                    const addResultsPanelInfo = function (controlContainer) {
                        resultsPanelOptions.position = controlContainer.POSITION.RIGHT;
                        ctlPromise = controlContainer.addControl('resultsPanel', resultsPanelOptions);
                    };

                    let displayOn;
                    if (!self.options.displayElevation && self.options.displayOn) {
                        displayOn = self.options.displayOn;
                    } else if (self.options.displayElevation) {
                        displayOn = self.options.displayElevation.displayOn;
                    }
                    if (displayOn) {
                        const controlContainer = self.map.getControlsByClass('TC.control.' + displayOn[0].toUpperCase() + displayOn.substring(1))[0];
                        if (controlContainer) {
                            addResultsPanelInfo(controlContainer);
                        } else {
                            self.map.addControl(displayOn).then(addResultsPanelInfo);
                        }
                    } else {
                        resultsPanelOptions.div = document.createElement('div');
                        self.map.div.appendChild(resultsPanelOptions.div);
                        ctlPromise = self.map.addControl('resultsPanel', resultsPanelOptions);
                    }

                    ctlPromise.then(function (resultsPanelInfo) {
                        self.track.infoPanel = resultsPanelInfo;
                        resolve(resultsPanelInfo);
                    });
                } else {
                    resolve(self.track.infoPanel);
                }
            });
        }
        return self.track._infoPanelPromise;
    }

    renderInfoNewPosition = function (d) {
        const self = this;
        
        self.getRenderedHtml(self.CLASS + '-tracking-toast', self.#setFormatInfoNewPosition(d.pd), function (html) {
            self.getTrackInfoPanel().then(function (infoPanel) {
                if (!infoPanel.isMinimized()) {                    
                    infoPanel.renderPromise().then(function () {
                        infoPanel.options.collidingPriority = infoPanel.COLLIDING_PRIORITY.IGNORE;
                        infoPanel.open(html);
                    });
                }
            });
        });
        
    }

    #updateGeotrackingToolsState() {
        const self = this;

        if (!self.track.trackToolPanelOpened.checked) {
            self.map.trigger(Consts.event.TOOLSCLOSE);
        }
    }

    setFollowing(value) {
        const self = this;
        self.#isFollowing = value;
        if (self.trackCenterButton) {
            const btn = self.trackCenterButton.querySelector("button");
            btn.classList.toggle(Consts.classes.UNPLUGGED, !value);
            btn.title = self.getLocaleString(value ? "geo.trk.notCenter" : "geo.trk.center")
        }
        !value && self.trackCenterButton && self.trackCenterButton.querySelector("button").classList.add(Consts.classes.UNPLUGGED);
        value && self.trackCenterButton && self.trackCenterButton.querySelector("button").classList.remove(Consts.classes.UNPLUGGED);
    }

    async moveTo(where) {
        const self = this;
        if (where && Array.isArray(where) && where.length > 0) {
            followingZoom = true;
            if (where[0] instanceof Feature) {
                await self.map.zoomToFeatures(where, { animate: false });
            }
            else {
                await self.map.setCenter(where, { animate: false })
            }
            setTimeout(function () {
                followingZoom = false;
            }, 300);
        }
    }

    setGeotracking() {
        const self = this;

        self.activate();
        self.#isFollowing = true;
        self.#activateGeotrackingState();
        self.#updateGeotrackingToolsState();

        self.map.on(Consts.event.ZOOM, zoomHandler)

        self.on(self.const.event.POSITIONCHANGE, function (d) {
            if (self.currentPoint && (self.currentPoint.position[0] !== d.pd.position[0] && self.currentPoint.position[1] !== d.pd.position[1])) {
                //cambio real de coordenadas
                if (self.#isFollowing) {
                    self.moveTo(d.pd.position);
                }
            }
            self.currentPoint = d.pd;
            self.renderInfoNewPosition(d);

            self.track.trackName.disabled = false;
            self.track.trackSave.disabled = false;

            self.track.trackWPT.disabled = false;
            self.track.trackAdd.disabled = false;

            // cada vez que se registra una nueva posición almacenamos en sessionStorage
            Util.storage.setSessionLocalValue(self.const.localStorageKey.GEOTRACKINGTEMP, self.wrap.formattedToStorage(self.geotrackingLayer).features);
        });
        self.on(self.const.event.STATEUPDATED, function (_data) {
            //self.track.htmlMarker.setAttribute('src', data.moving ? 'layout/idena/img/geo-marker-heading.png' : 'layout/idena/img/geo-marker.png');
        });

        self.clear(self.const.layer.GEOTRACKING);

        self.#advertisement(self.const.localStorageKey.GEOTRACKINGSHOWADVERTISEMENT);

        self.wrap.setGeotracking(true);
    }

    #keepWakeLock() {
        const self = this;
        if (wakeLockSupported) {
            // create an async function to request a wake lock
            const requestWakeLock = async () => {
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log("Wake Lock active");
                    wakeLock.addEventListener('release', () => {
                        // if wake lock is released alter the button accordingly
                        console.log("Wake Lock released");
                    });
                } catch (err) {
                    // if wake lock request fails - usually system related, such as battery
                    console.error(err);
                }
            };
            requestWakeLock();
            //al cambiar de pestaña volvemos a activar el wakeLock
            //document.addEventListener('visibilitychange', handleVisibilityChange);
        }
        else {
            self.#addVideoKeepScreenOn();
        }
    }

    #releaseLock() {
        const self = this;
        if (wakeLockSupported) {
            //document.removeEventListener('visibilitychange', handleVisibilityChange);
            wakeLock.release()
                .then(() => {
                    wakeLock = null;
                });
        }
        else {
            self.#removeVideoKeepScreenOn();
        }
    }

    #addVideoKeepScreenOn() {
        const self = this;

        if (!self.videoScreenOn) {
            var media = {
                WebM: "data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA=",
                MP4: "data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthADAowdbb9/AAAC6W1vb3YAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIVdHJhawAAAFx0a2hkAAAAD3wlsIB8JbCAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAgbWRoZAAAAAB8JbCAfCWwgAAAA+gAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVxtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEcc3RibAAAALhzdHNkAAAAAAAAAAEAAACobXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAIAAgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAFJlc2RzAAAAAANEAAEABDwgEQAAAAADDUAAAAAABS0AAAGwAQAAAbWJEwAAAQAAAAEgAMSNiB9FAEQBFGMAAAGyTGF2YzUyLjg3LjQGAQIAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAEwAAAAEAAAAUc3RjbwAAAAAAAAABAAAALAAAAGB1ZHRhAAAAWG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAAK2lsc3QAAAAjqXRvbwAAABtkYXRhAAAAAQAAAABMYXZmNTIuNzguMw=="
            };

            self.videoScreenOn = document.createElement('video');
            self.videoScreenOn.setAttribute("loop", "");
            self.videoScreenOn.setAttribute("muted", "");
            self.videoScreenOn.setAttribute("webkit-playsinline", "");
            self.videoScreenOn.setAttribute("playsinline", "");
            self.videoScreenOn.setAttribute("style", "transform: translateZ(0px);");

            var sourceWebM = document.createElement('source');
            sourceWebM.src = media.WebM;
            sourceWebM.type = "video/webm";
            self.videoScreenOn.appendChild(sourceWebM);

            var sourceMP4 = document.createElement('source');
            sourceMP4.src = media.MP4;
            sourceMP4.type = "video/mp4";
            self.videoScreenOn.appendChild(sourceMP4);
        }

        self.videoScreenOn.play();
    }

    #removeVideoKeepScreenOn() {
        const self = this;
        if (self.videoScreenOn) {
            self.videoScreenOn.pause();
        }
    }

    #setOnWindowBlurred() {
        const self = this;
        if (!self.#onWindowBlurred) {
            self.#onWindowBlurred = function () {
                const self = this;
                self.#fromSessionToStorage();
            }.bind(self);
        }

        if ('onpagehide' in window) {
            window.addEventListener('pagehide', self.#onWindowBlurred, false);
        } else {
            window.addEventListener('blur', self.#onWindowBlurred, false);
        }
    }

    #setOnWindowFocused() {
        const self = this;
        if (!self.#onWindowFocused) {
            self.#onWindowFocused = function () {
                const self = this;
                if (self.videoScreenOn && self.videoScreenOn.paused) {
                    self.videoScreenOn.play();
                }
                self.#fromStorageToSession();
            }.bind(self);
        }

        if ('onpageshow' in window) {
            window.addEventListener('pageshow', self.#onWindowFocused, false);
        } else {
            window.addEventListener('focus', self.#onWindowFocused, false);
        }
    }

    #setOnWindowVisibility() {
        const self = this;
        if (!self.#onWindowVisibility) {
            self.#onWindowVisibility = async function () {
                var self = this;

                var hidden = getHiddenProperty();

                if (!document[hidden]) {
                    if (wakeLock !== null) {
                        self.#keepWakeLock();
                    }
                    else {
                        self.#onWindowFocused();
                    }
                }
                else if (notifications) {
                    if (navigator.serviceWorker &&
                        //si se pulta shift + F5 el objeto controller de serviceWorkerContainer es null
                        (navigator.serviceWorker.controller ||
                            //entonces ontenemos el SW del control SWCache client si existe y miramos si está activo
                            self.map.getControlsByClass(TC.control.SWCacheClient).length && (await self.map.getControlsByClass(TC.control.SWCacheClient)[0].getServiceWorker()).state === "activated"))
                        try {
                            const registration = await navigator.serviceWorker.ready;
                            registration.showNotification(self.notificationConfig.title, Object.assign(self.notificationConfig, {
                                actions: [{
                                    action: "back",
                                    title: self.getLocaleString("geo.trk.notification.backButton")
                                }], data: {
                                    "url": document.location.href
                                }
                            }));
                        }
                        catch (ex) {
                            new Notification(self.notificationConfig.title, self.notificationConfig);
                        }
                    else {
                        new Notification(self.notificationConfig.title, self.notificationConfig);
                    }
                }
                if (!wakeLock && self.videoScreenOn) {
                    console.log('video is: ' + self.videoScreenOn.paused);
                }

            }.bind(self);
        }

        window.addEventListener('visibilitychange', self.#onWindowVisibility, false);
    }

    #addWindowEvents() {
        const self = this;
        self.#setOnWindowVisibility();
        self.#setOnWindowBlurred();
        self.#setOnWindowFocused();
    }

    #removeWindowEvents = function () {
        const self = this;
        window.removeEventListener('visibilitychange', self.#onWindowVisibility, false);
        self.#onWindowVisibility = null;

        if ('onpagehide' in window) {
            window.removeEventListener('pagehide', self.#onWindowBlurred, false);
        } else {
            window.removeEventListener('blur', self.#onWindowBlurred, false);
        }
        if ('onpageshow' in window) {
            window.removeEventListener('pageshow', self.#onWindowFocused, false);
        } else {
            window.removeEventListener('focus', self.#onWindowFocused, false);
        }
    }

    #fromSessionToStorage() {
        const self = this;

        var geotrackingSession = Util.storage.getSessionLocalValue(self.const.localStorageKey.GEOTRACKINGTEMP);
        if (geotrackingSession && geotrackingSession.length > 0)
            localforage
                .setItem(self.const.localStorageKey.GEOTRACKINGTEMP, typeof geotrackingSession === "string" ? geotrackingSession : JSON.stringify(geotrackingSession))
                .catch(err => console.warn(err));
    }

    #fromStorageToSession() {
        const self = this;

        localforage.getItem(self.const.localStorageKey.GEOTRACKINGTEMP).then(function (storageData) {
            if (storageData !== null && storageData !== "null" && storageData.length > 0) {
                Util.storage.setSessionLocalValue(self.const.localStorageKey.GEOTRACKINGTEMP, storageData);
            }
        }, err => console.warn(err));
    }

    /* final gestión suspensión de la pantalla en móviles */

    #advertisement(showAdvertisement) {
        const self = this;

        localforage.getItem(showAdvertisement).then(function (registeredShowAdvertisement) {
            if (registeredShowAdvertisement == null) {
                const dialog = self.#dialogDiv.querySelector('.tc-ctl-geolocation-track-advert-dialog');
                const checkbox = dialog.querySelector('input[type="checkbox"]');
                checkbox.setAttribute('name', showAdvertisement);
                checkbox.checked = false;

                document.querySelector('#pageBlurMsg').textContent = Util.detectMobile() ? self.getLocaleString('geo.trk.page.blur') : self.getLocaleString('geo.trk.page.blur.desktop');

                dialog.querySelector('h3').textContent = showAdvertisement === self.const.localStorageKey.GPSSHOWADVERTISEMENT ?
                    self.getLocaleString("geo.track.activate") + " " + self.getLocaleString("geo.gps") :
                    self.getLocaleString('geo.track.activate.title');

                Util.showModal(self.#dialogDiv.querySelector('.tc-ctl-geolocation-track-advert-dialog'));
            }
        }, err => console.warn(err));

        self.map.toast(!Util.detectMobile() ? self.getLocaleString('geo.trk.page.blur.desktop') : self.getLocaleString('geo.trk.page.blur'), {
            type: Consts.msgType.WARNING
        });
    }

    #askGeotracking(callback) {
        const self = this;

        Util.showModal(self.#dialogDiv.querySelector('.tc-ctl-geolocation-continue-track-dialog'), {
            closeCallback: function () {

                if (Util.isFunction(callback)) {
                    callback();
                }
            }
        });

        return true;
    }

    activateGeotracking() {
        const self = this;
        self.#activateGeotrackingState();
        var geotrackingAvailable = true;

        if (!self.isActive) {
            self.activate();
        }

        self.clear(self.const.layer.GEOTRACKING);

        try {
            Util.storage.setSessionLocalValue(self.const.localStorageKey.TEST, self.const.localStorageKey.TEST);
        } catch (error) {
            if (error.code === DOMException.QUOTA_EXCEEDED_ERR)
                TC.alert(self.getLocaleString("geo.error.trackinglocalstorage"));
            else TC.error(error);

            geotrackingAvailable = false;
        }

        if (geotrackingAvailable) {
            if (window.Notification || window.webkitNotifications) {
                var checkNotificationsReply = function (permission) {
                    if (permission === "granted") notifications = _notifications;
                };
                const _notifications = window.Notification || window.webkitNotifications;
                if (_notifications.permission === "denied") {
                    notifications = null;
                } else if (_notifications.permission === "granted") notifications = _notifications;
                else _notifications.requestPermission(checkNotificationsReply);
            }
            self.#keepWakeLock();
            self.#addWindowEvents();

            self.geotrackingSession = Util.storage.getSessionLocalValue(self.const.localStorageKey.GEOTRACKINGTEMP);
            if (self.geotrackingSession) {
                var asked = self.#askGeotracking(function () {
                    self.#deactivateGeotrackingState();
                });

                if (!asked) {
                    self.track.trackRenew.click();
                }
            } else {
                self.setGeotracking();
            }
        } else {
            self.#deactivateGeotrackingState();
        }
    }

    deactivateGeotracking() {
        const self = this;

        const _deactivateGeotracking = function () {

            self.getTrackInfoPanel().then(panel => panel.close());

            self.#fromSessionToStorage();

            self.wrap.setGeotracking(false);


            delete self.geotrackingPosition;

            if (!self.#trackVisibility) {
                self.div.querySelector(`.${self.CLASS}-track-render`).querySelector('label').click();
            }

            self.#releaseLock();
            self.#removeWindowEvents();

            self.off(self.const.event.POSITIONCHANGE);
            self.off(self.const.event.STATEUPDATED);

            self.#deactivateGeotrackingState();

            self.track.trackName.value = '';
            self.track.trackName.disabled = true;
            self.track.trackSave.disabled = true;

            self.track.trackWPT.value = '';
            self.track.trackWPT.disabled = true;
            self.track.trackAdd.disabled = true;

            self.clear(self.const.layer.GEOTRACKING);
            self.clear(self.const.layer.GPS);


            self.map.off(Consts.event.ZOOM, zoomHandler)

            //TC.Control.prototype.deactivate.call(self);

            return true;
        };

        if (self.wrap.hasCoordinates()) {
            self.map.toast(self.getLocaleString("geo.trk.deactivate.alert"), {
                duration: 10000
            });
            //TC.alert(self.getLocaleString("geo.trk.deactivate.alert"));
            return _deactivateGeotracking();
        } else {
            return _deactivateGeotracking();
        }
    }

    /* Obtengo los tracks desde localForage */
    async getStoredTracks() {
        const self = this;
        let tracks = [];

        const onResolve = function (toResolve) {
            // estamos en la carga inicial
            if (self.#elevationProfileCache.size === 0) {
                toResolve
                    .filter(elm => elm.profile)
                    .forEach((elm) => self.#elevationProfileCache.set(elm.uid, JSON.parse(elm.profile)));
            }
            return toResolve;
        };

        let keys;
        try {
            keys = await localforage.keys();
        }
        catch (_err) {
            console.log('Capturamos error que se produce por configuración del navegador.');
            TC.error(self.getLocaleString('couldNotAccessLocalStorage'));
        }
        keys = keys?.filter(function (k) {
            if (k.indexOf(self.const.localStorageKey.GEOTRACKINGTEMP) !== 0 && k.indexOf(self.const.localStorageKey.GEOTRACKING) === 0) {
                return /trk#\d/i.exec(k);
            }
            return false;
        });

        if (!keys || keys.length === 0) {
            self.availableTracks = tracks;
            return onResolve(tracks);
        }

        const promises = new Array(keys.length);
        keys.forEach(function (key, idx) {
            promises[idx] = localforage.getItem(key);
        });

        const results = await Promise.all(promises);
        if (results && results.length) {
            results.forEach(function (res) {
                if (typeof res === 'string') {
                    res = JSON.parse(res);
                }
                if (res instanceof Array) {
                    tracks = tracks.concat(res);
                } else {
                    tracks.push(res);
                }
            });

            const tracksArray = tracks.length > 1 ? orderTracks(tracks) : tracks;
            self.availableTracks = tracksArray;
            return onResolve(tracksArray);
        }
    }

    /* Almaceno los tracks mediante localForage, actualizo la vble availableTracks y actualizo la lista de tracks */
    async setStoredTracks(tracks) {
        const self = this;
        const promises = [];
        tracks.forEach(function (t) {
            promises.push(localforage.setItem(self.const.localStorageKey.GEOTRACKING + "#" + t.uid, t).catch(err => {
                console.warn(err);
            }));
        });

        await Promise.all(promises);
        await self.getStoredTracks();
        self.#bindTracks();
    }

    /* Obtengo los tracks desde vble local */
    async getAvailableTracks() {
        const self = this;
        if (!self.availableTracks) {
            return await self.getStoredTracks();
        }
        else {
            return self.availableTracks;
        }
    }

    async #bindTracks() {
        const self = this;

        const listItems = self.track.trackList.querySelectorAll('li');
        listItems.forEach(function (li) {
            li.style.display = 'none';
        });

        const tracks = await self.getAvailableTracks();

        const isEmpty = function (obj) {
            return !obj || obj.length === 0;
        };

        if (isEmpty(tracks)) {
            self.track.trackList.querySelectorAll('li[class^="tc-ctl-geolocation-track-available-empty"]').forEach(function (li) {
                li.style.display = '';
            });
            self.track.trackSearch.disabled = true;
        }
        else {
            const selectedTrackItem = self.getSelectedTrackItem();
            var selectedTrackId;
            if (selectedTrackItem) {
                selectedTrackId = selectedTrackItem.dataset.uid;
            }
            self.track.trackList.querySelectorAll('li[data-id]').forEach(function (li) {
                self.track.trackList.removeChild(li);
            });

            const parser = new DOMParser();
            for (var i = 0; i < tracks.length; i++) {
                var t = tracks[i];
                if (t && typeof t === "object") {
                    const html = await self.getRenderedHtml(self.CLASS + '-track-node', {
                        id: i, uid: t.uid, name: t.name ? t.name.trim() : ''
                    });
                    const newLi = parser.parseFromString(html, 'text/html').body.firstChild;
                    self.getItemTools().forEach(tool => self.addItemToolUI(newLi, tool));
                    self.track.trackList.appendChild(newLi);
                    newLi.querySelector(self.const.selector.VISIBILITY).addEventListener('change', function (e) {
                        self.trackLayer.setVisibility(e.target.checked);
                    });
                }
            }

            if (selectedTrackId) {
                self.setSelectedTrack(self.track.trackList.querySelector('li[data-uid="' + selectedTrackId + '"]'));
            }

            self.track.trackSearch.disabled = false;
        }
    }

    clearChartProgress() {
        const self = this;
        self.getElevationControl().then(elevCtl => elevCtl && elevCtl.removeElevationTooltip());
    }

    setChartProgress = function (previous, _current, _distance, _doneTime) {
        const self = this;

        if (self.elevationControl && self.elevationControl.resultsPanel && (!self.elevationControl.resultsPanel.isVisible() || self.elevationControl.resultsPanel.isMinimized())) {
            return;
        }

        var done = previous.d;
        //var locale = self.map.options.locale && self.map.options.locale.replace('_', '-') || undefined;

        if (self.elevationChartData) {
            self.setSecondaryElevationProfileCoordinates(self.elevationChartData.coords);

            let iX = 0;
            while (self.elevationChartData.x[iX] <= done) {
                iX++;
            }

            self.getElevationControl().then(elevCtl => elevCtl &&
                elevCtl.getProfilePanel().then(function (panel) {
                    if (panel) {
                        panel.chart.chart.tooltip.show({ x: self.elevationChartData.x[iX === 0 ? 0 : iX - 1] });
                        panel.wrap.hideElevationMarker();
                    }
                }));
        }
    }

    setSecondaryElevationProfileCoordinates(sourceCoordinates) {
        const self = this;
        const secProfileData = self.elevationChartData?.secondaryElevationProfileChartData?.[0];

        if (secProfileData?.ele && !secProfileData?.eleCoordinates) {

            // Aplanamos a una lista de puntos
            let level = -2;
            let levelElm = sourceCoordinates;
            do {
                level++;
                levelElm = levelElm[0];
            }
            while (Array.isArray(levelElm));
            secProfileData.eleCoordinates = sourceCoordinates
                .flat(level)
                .map((c, i) => [c[0], c[1], secProfileData.ele[i]]);
        }
    }

    getTimeInterval(timeFrom, timeTo) {
        let diff = timeTo - timeFrom;
        const d = {};
        var daysDifference = Math.floor(diff / 1000 / 60 / 60 / 24);
        diff -= daysDifference * 1000 * 60 * 60 * 24;

        var hoursDifference = Math.floor(diff / 1000 / 60 / 60);
        diff -= hoursDifference * 1000 * 60 * 60;

        d.h = hoursDifference + daysDifference * 24;

        var minutesDifference = Math.floor(diff / 1000 / 60);
        diff -= minutesDifference * 1000 * 60;

        d.m = minutesDifference;

        d.s = Math.floor(diff / 1000);

        return Util.extend({}, d, { toString: ("00000" + d.h).slice(-2) + ':' + ("00000" + d.m).slice(-2) + ':' + ("00000" + d.s).slice(-2) });
    }

    async simulateTrack(li) {
        const self = this;

        const elevCtl = await self.getElevationControl();
        elevCtl.removeElevationTooltip();
        self.simulationSpeed = 1;
        if (self.getSelectedTrackItem() === li && // si el usuario a activado la película del track ya seleccionado no repintamos
            elevCtl.resultsPanel && elevCtl.resultsPanel.chart && elevCtl.resultsPanel.chart.chart) {
            if (!self.hasElevation) {
                self.hasElevation = elevCtl.elevationProfileChartData.min === 0 && elevCtl.elevationProfileChartData.max === 0 ? false : true;
            }
            self.wrap.simulateTrack();
        } else {
            self.drawTrack(li, false).then(function () {
                if (self.elevationChartData &&
                    self.elevationChartData.min === 0 &&
                    self.elevationChartData.max === 0) {   // no tenemos elevación original
                    self.map.toast(self.getLocaleString("geo.trk.simulate.empty"), { duration: 10000 });
                    self.hasElevation = false; // establecemos a false para que no muestra el progreso en el perfil ya que siempre será elevación 0
                } else if (!(self.elevationChartData.min === 0 && self.elevationChartData.max === 0)) {
                    self.hasElevation = true;
                }

                self.wrap.simulateTrack();
            });
        }
    }

    async drawTrack(li, _activateSnapping) {
        const self = this;

        self.clear(self.const.layer.TRACK);

        self.#updateGeotrackingToolsState();
        self.setSelectedTrack(li);
        await self.drawTrackData(li);
        await self.displayTrackProfile(li);
        self.activate();
    }

    #getElevationProfileFromCache(uid) {
        return this.#elevationProfileCache.get(uid);
    }

    #cacheElevationProfile(data, trackUID) {
        const self = this;
        let result = self.#getElevationProfileFromCache(trackUID);
        if (!result) {
            self.#elevationProfileCache.set(trackUID, data);
            self.getAvailableTracks().then(function (tracks) {
                if (tracks) {
                    let index = tracks.findIndex(t => t.uid.toString() === trackUID);
                    if (index > -1) {
                        tracks[index].profile = JSON.stringify(data);
                        self.setStoredTracks(tracks);
                    }
                }
            });
            result = data;
        }
        return result;
    }

    #removeElevationProfileFromCache(uid) {
        this.#elevationProfileCache.delete(uid);
    }

    #getElevationFromServiceOnCache(feature) {
        const self = this;
        const cachedElevation = self.#elevationFromServiceCache.find(function (elm) {
            return elm.feature === feature;
        });
        if (!cachedElevation) {
            const arr_diff = function (a1, a2) {
                var a = [], diff = [];

                for (var i = 0; i < a1.length; i++) {
                    a[a1[i]] = true;
                }

                for (i = 0; i < a2.length; i++) {
                    if (a[a2[i]]) {
                        delete a[a2[i]];
                    } else {
                        a[a2[i]] = true;
                    }
                }

                for (var k in a) {
                    diff.push(k);
                }

                return diff;
            };
            return self.#elevationFromServiceCache.find(function (elm) {
                return arr_diff(elm.feature.geometry, feature.geometry).length === 0;
                //return elm.feature.geometry === feature.geometry; aunque sean iguales da falso ¿?¿?¿?
            });
        }
        return cachedElevation;
    }

    #cacheElevationFromService = function (feature, data) {
        const self = this;
        let result = self.#getElevationFromServiceOnCache(feature);
        if (!result) {
            result = {
                feature: feature
            };
            self.#elevationFromServiceCache.push(result);
        }
        result.data = data;
        return result;
    }

    async displayTrackProfile(li, options) {
        const self = this;

        if (options?.resized) {
            self.wrap.simulateTrackEnd(options.resized);
            //self.uiSimulate(false, li);
            return;
        }
        if (!self.#onResize) {
            self.#onResize = self.displayTrackProfile.bind(self, li, { resize: true });
            window.addEventListener("resize", self.#onResize, false);
        }
        const elevCtl = await self.getElevationControl();
        if (elevCtl) {
            let cachedProfile;
            if (options?.forceRefresh) {
                self.#removeElevationProfileFromCache(li.dataset.uid);
            }
            else {
                cachedProfile = self.#getElevationProfileFromCache(li.dataset.uid);
            }
            if (!cachedProfile) {
                const track = await self.getTrackData(li);
                if (self.trackLayer?.features) {
                    // track con tiempo
                    const hasTime = track.layout === ol.geom.GeometryLayout.XYZM ||
                        track.layout === ol.geom.GeometryLayout.XYM;
                    const longLayout = hasTime || self.options.displayElevation;
                    let features = self.trackLayer.features.filter(f => {
                        return longLayout && isAnyLine(f);
                    });

                    if (features.length > 0) {
                        let line = features[0];
                        let time = {};
                        if (hasTime) {
                            let diff = 0;
                            const firstPoint = getFirstPoint(line);
                            const lastPoint = getLastPoint(line);
                            if (track.layout === ol.geom.GeometryLayout.XYZM) {
                                diff = lastPoint[3] - firstPoint[3];
                            } else {
                                diff = lastPoint[2] - firstPoint[2];
                            }
                            time = {
                                s: Math.floor(diff / 1000 % 60),
                                m: Math.floor(diff / (1000 * 60) % 60),
                                h: Math.floor(diff / (1000 * 60 * 60) % 24)
                            };
                        }

                        let options = {
                            originalElevation: true,
                            onlyOriginalElevation: !self.options.displayElevation ? true : false,
                            ignoreCaching: true,
                            time: time,
                            callback: function () {
                                self.elevationChartData = elevCtl.elevationProfileChartData;
                                self.hasElevation = elevCtl.elevationProfileChartData.min === 0 && elevCtl.elevationProfileChartData.max === 0 ? false : true;
                                self.#cacheElevationProfile(elevCtl.elevationProfileChartData, li.dataset.uid);

                                self.resultsPanelChart.div.addEventListener('mouseover', function (_e) {
                                    if (self.trackLayer && self.trackLayer.getVisibility() && self.trackLayer.getOpacity() > 0)
                                        self.wrap.activateSnapping.call(self.wrap);
                                });
                                self.resultsPanelChart.div.addEventListener('mouseout', function (_e) {
                                    if (self.trackLayer && (!self.trackLayer.getVisibility() && self.trackLayer.getOpacity() == 0))
                                        self.wrap.deactivateSnapping.call(self.wrap);
                                });

                                self.map
                                    .on(Consts.event.RESULTSPANELMIN, function () { self.clearChartProgress(); })
                                    .on(Consts.event.RESULTSPANELCLOSE, function () { self.clearChartProgress(); });

                                // mantenemos el mismo nombre de archivo al descargar desde panel y desde la lista.
                                elevCtl.getProfilePanel().then(function (resultsPanel) {
                                    let selectedTrackItem = self.getSelectedTrackItem();
                                    if (selectedTrackItem) {
                                        resultsPanel.currentFeature.fileName = self.#getDownloadFileName(selectedTrackItem);
                                    }
                                });
                            }
                        };
                        elevCtl.displayElevationProfile(line, options);
                    } else {
                        throw Error('No features have compatible geometry layout');
                    }
                } else {
                    throw Error('No features available');
                }
            } else {
                if (!self.options.displayElevation) {
                    delete cachedProfile.secondaryElevationProfileChartData[0];
                }
                self.elevationChartData = cachedProfile;
                const resultsPanel = await elevCtl.getProfilePanel();
                await resultsPanel.renderPromise();
                resultsPanel.doVisible();
                elevCtl.renderElevationProfile(self.elevationChartData);
                resultsPanel.setCurrentFeature();
            }
            return;
        } else {
            throw Error('No elevation control');
        }
    }

    clear(layerType) {
        const self = this;

        if (self.#onResize) {
            window.removeEventListener("resize", self.#onResize, false);
            self.#onResize = undefined;
        }

        if (layerType === self.const.layer.TRACK) {

            self.trackLayer.clearFeatures();
            self.#startMarker = null;
            self.#finishMarker = null;
            delete self.trackLayer._fileHandle;

            // gráfico perfil de elevación
            self.getElevationControl().then(elevCtl => elevCtl && elevCtl.closeElevationProfile());
            delete self.elevationChartData;

            // overlay de la simulación
            self.wrap.simulateTrackEnd();

            self.wrap.clear();

            // eliminamos la selección en la lista de tracks
            self.track.trackList.querySelectorAll('li').forEach(function (li) {
                li.classList.remove(Consts.classes.CHECKED);
            });

            self.map.trigger(self.const.event.CLEARTRACK);

            self.featuresToShare = [];

            if (!self.loadingState) {
                delete self.toShare;
            }

            //TC.Control.prototype.deactivate.call(self);

        } else {
            self.geotrackingLayer.clearFeatures();
            self.gpsLayer.clearFeatures();
        }
    }

    async saveTrack(options) {
        const self = this;
        let message = options.message || self.getLocaleString("geo.trk.save.alert");

        const save = async function (layer) {
            let wait;
            wait = self.getLoadingIndicator().addWait();

            let trackName = options.importedFileName || self.track.trackName.value.trim();

            let tracks = await self.getAvailableTracks();

            let formatted = self.wrap.formattedToStorage(layer, true, options.notReproject);

            let clean = function (wait) {
                self.track.trackName.value = '';
                self.track.trackName.disabled = true;
                self.track.trackSave.disabled = true;

                self.track.trackWPT.value = '';
                self.track.trackWPT.disabled = true;
                self.track.trackAdd.disabled = true;

                self.getLoadingIndicator().removeWait(wait);

                self.#updateGeotrackingToolsState();
            };

            let mustAdd = false;
            let newTrack;
            if (options.uid) {
                newTrack = tracks.find(t => t.uid == options.uid);
            }
            if (!newTrack) {
                mustAdd = true;
                newTrack = {
                    name: trackName,
                    layout: formatted.layout,
                    crs: self.storageCrs
                };
            }
            newTrack.data = formatted.features;

            if (options.fileHandle) {
                newTrack.fileHandle = options.fileHandle;
            }

            const getHashToCompare = function (trackObject) {
                // reemplazamos los ids contenidos en la geomtría que provocan falsos negativos.
                let toGetHash = JSON.parse(JSON.stringify(trackObject));
                const regex = /(\"id\"\s?\:\s?\"[a-z0-9]+\")/gi;
                toGetHash.data = toGetHash.data.replace(regex, '""');

                return md5(JSON.stringify(toGetHash));
            };

            const jsonFormat = new ol.format.GeoJSON();

            const serializeFeatures = function (features) {
                // Aplicamos una precisión un dígito mayor que la del mapa, si no, al compartir algunas parcelas se deforman demasiado
                let precision = Math.pow(10, Consts.DEGREE_PRECISION + 1);

                features.forEach(function (feature) {
                    let geom = Util.explodeGeometry(Util.compactGeometry(feature.getGeometry().getCoordinates(), precision));
                    feature.getGeometry().setCoordinates(geom);
                });

                return jsonFormat.writeFeatures(features);
            };

            let hash = getHashToCompare(newTrack);

            let sameTrackUID;
            if (mustAdd) {
                // Guardamos un track si no existe ya
                sameTrackUID = tracks.map(function (savedTrack) {
                    let clonedTrack = JSON.parse(JSON.stringify(savedTrack));
                    delete clonedTrack.uid;
                    delete clonedTrack.profile;

                    if (hash === getHashToCompare(clonedTrack)) {
                        return savedTrack.uid;
                    } else {
                        // validamos si se trata de un track exportado/importado ya que se compacta la geometría
                        clonedTrack.data = serializeFeatures(jsonFormat.readFeatures(clonedTrack.data));
                        if (hash === md5(JSON.stringify(clonedTrack))) {
                            return savedTrack.uid;
                        } else {
                            return null;
                        }
                    }

                }).find(function (uid) {
                    return uid !== null;
                });
            }

            const getTrackIndex = async function (uid) {
                await self.getStoredTracks();
                await self.#bindTracks();

                let index;
                for (var i = 0; i < self.availableTracks.length; i++) {
                    if (self.availableTracks[i].uid === uid) {
                        index = i;
                        break;
                    }
                }

                return index;
            };

            if (!sameTrackUID) {
                if (mustAdd) {
                    newTrack.uid = options.uid || (Date.now() + Math.random());
                    tracks.push(newTrack);
                }
                tracks = orderTracks(tracks);

                try {
                    await self.setStoredTracks(tracks);
                    self.map.toast(message, { duration: 3000 });

                    clean(wait);

                    const index = await getTrackIndex(newTrack.uid);
                    return index;
                }
                catch (error) {
                    TC.alert(self.getLocaleString("geo.error.savelocalstorage") + ': ' + error.message);
                    clean(wait);
                    throw error;
                }
            } else {
                console.log('Ya existe un track con ese mismo hash');

                clean(wait);

                const index = await getTrackIndex(sameTrackUID);
                return index;
            }
        };

        if (self.importedFileName || options.uid) {
            return await save(self.trackLayer);
        }
        if (self.track.trackName.value.trim().length === 0) {
            self.track.trackName.value = new Date().toLocaleString();
            return await save(self.geotrackingLayer);
        }
        return await save(self.geotrackingLayer);
    }

    addWaypoint() {
        const self = this;

        let waypointName = self.track.trackWPT.value.trim();
        if (!waypointName) {
            waypointName = new Date().toLocaleString();
        }

        const wait = self.getLoadingIndicator().addWait();

        self.#updateGeotrackingToolsState();

        self.wrap.addWaypoint(self.currentPoint.position, {
            name: waypointName,
            ele: self.currentPoint.heading,
            time: new Date().getTime() // GLS: lo quito ya que hemos actualizado la función que gestiona la fechas para la exportación a GPX - espera la fecha en segundos -> / 1000 // para la exportación a GPX - espera la fecha en segundos
        });

        self.track.trackWPT.value = '';
        self.track.trackWPT.disabled = true;
        self.track.trackAdd.disabled = true;

        // cada vez que se añade un waypoint almacenamos en sessionStorage
        Util.storage.setSessionLocalValue(self.const.localStorageKey.GEOTRACKINGTEMP, self.wrap.formattedToStorage(self.geotrackingLayer).features);

        self.getLoadingIndicator().removeWait(wait);
    }

    async editTrackName(trackId, newName) {
        const self = this;

        const tracks = await self.getAvailableTracks();
        if (tracks) {
            const track = tracks.find(t => t.uid == trackId);
            if (track) {
                track.name = newName;
                await self.setStoredTracks(tracks);
            }
        }
    }

    removeTrack = function (li, options) {
        const self = this;

        return new Promise(function (resolve, _reject) {
            self.getAvailableTracks().then(function (tracks) {
                if (tracks) {
                    var dataId = li.dataset.id;
                    if (tracks[dataId]) {
                        var uid = tracks[dataId].uid;

                        const okFn = function () {

                            const selectedTrackItem = self.getSelectedTrackItem();
                            if (selectedTrackItem && selectedTrackItem.dataset.id === dataId) {
                                self.clear(self.const.layer.TRACK);
                            }

                            localforage.removeItem(self.const.localStorageKey.GEOTRACKING + '#' + uid).then(function () {
                                self.getStoredTracks().then(function () {
                                    self.#bindTracks().then(() => resolve(true));
                                });
                            }).catch(function (err) {
                                console.warn(err);
                                resolve(false);
                            });

                        };

                        if (options?.silent) {
                            okFn();
                        }
                        else {
                            TC.confirm(self.getLocaleString("geo.trk.delete.alert"), okFn, () => resolve(false));
                        }
                    }
                }
            });
        });
    }

    setSelectedTrack = function (li) {
        const self = this;

        if (!self.isActive) {
            self.activate();
        }

        self.track.trackList.querySelectorAll('li[data-id] > span').forEach(function (span) {
            span.setAttribute('title', span.textContent);
        });
        self.track.trackList.querySelectorAll('li').forEach(function (li) {
            li.classList.remove(Consts.classes.CHECKED);
        });

        li.classList.add(Consts.classes.CHECKED);

        const transitionEvent = function (_event) {
            li.scrollIntoView({ behavior: "smooth", block: "end" });
            li.removeEventListener("transitionend", transitionEvent, false);
        };
        li.addEventListener("transitionend", transitionEvent, false);

        li.setAttribute('title', self.getLocaleString("tr.lst.clear") + " " + li.querySelector('span').textContent);
        li.querySelector(self.const.selector.DRAW).setAttribute('title', li.getAttribute('title'));

        if (!self.loadingState) {
            delete self.toShare;
        }
    }

    getSelectedTrackItem = function () {
        const self = this;
        return self.track.trackList.querySelector('li.' + Consts.classes.CHECKED);
    }

    clearSelectedTrack() {
        const self = this;

        const selected = self.getSelectedTrackItem();
        if (selected) {

            if (self.#onResize) {
                window.removeEventListener('resize', self.#onResize, false);
                self.#onResize = undefined;
            }

            selected.classList.remove(Consts.classes.CHECKED);
            selected.setAttribute('title', selected.textContent);
            selected.querySelector(self.const.selector.DRAW).setAttribute('title', selected.getAttribute('title'));

            delete self.toShare;
        }
    }    

    clearSelection() {
        
        self.wrap.deactivateSnapping();
        var selected = self.getSelectedTrackItem();
        if (selected) {
            self.clearSelectedTrack();
        }
        if (self.resultsPanelChart) {

            self.resultsPanelChart.div.removeEventListener('mouseover', self.resultsPanelChart.deactivateSnapping);
            self.resultsPanelChart.div.removeEventListener('mouseout', self.resultsPanelChart.activateSnapping);

            self.resultsPanelChart.close();
        }

        self.clear(self.const.layer.TRACK);
    }

    async drawTrackData(li) {
        const self = this;

        self.wrap.clear();

        const track = await self.getTrackData(li);
        if (track && track.data) {
            await self.wrap.drawTrackData(track);
            self.updateEndMarkers();
            if (track.fileHandle) {
                self.trackLayer._fileHandle = track.fileHandle;
            }
            self.trackLayer.setVisibility(true);
        }
    }

    async getTrackData(li) {
        const self = this;
        const tracks = await self.getAvailableTracks();
        if (tracks) {
            const dataId = li.dataset.id;
            const track = tracks[dataId];
            if (track) {
                let trackData = track.data;
                // GLS: tengo que transformar de 4326 al crs del mapa en el momento de pintar, porque si lo hacemos al cargar la lista
                // y después hay cambio de crs, en el momento de pintar no sé desde qué crs debo tranformar
                trackData = self.wrap.formattedFromStorage(trackData);
                return {
                    data: trackData,
                    layout: track.layout,
                    fileHandle: track.fileHandle
                };
            }
        }
        return null;
    }

    async updateEndMarkers() {
        const self = this;
        var showFeatures = self.trackLayer.features;
        if (showFeatures && showFeatures.length > 0) {

            const lineFeature = showFeatures.find(function (feature) {
                feature.showsPopup = false;
                if (isAnyLine(feature)) {
                    return true;
                }
                return false;
            });
            if (lineFeature) {
                let coordinates;
                if (isMultiPolyline(lineFeature)) {
                    coordinates = lineFeature.geometry.flat();
                } else {
                    coordinates = lineFeature.geometry;
                }

                const first = coordinates[0];
                const last = coordinates[coordinates.length - 1];

                if (first && first !== last) {
                    const markerCoords = first.slice().splice(0, 2);
                    if (self.#startMarker) {
                        self.#startMarker.setCoordinates(markerCoords);
                    }
                    else {
                        self.#startMarker = await self.trackLayer.addMarker(markerCoords, {
                            showsPopup: false,
                            cssClass: self.CLASS + '-track-marker-icon-end',
                            anchor: [0.5, 1],
                            noExport: true
                        });
                    }
                }

                if (last) {
                    const markerCoords = last.slice().splice(0, 2);
                    if (self.#finishMarker) {
                        self.#finishMarker.setCoordinates(markerCoords);
                    }
                    else {
                        self.#finishMarker = await self.trackLayer.addMarker(markerCoords, {
                            showsPopup: false,
                            cssClass: self.CLASS + '-track-marker-icon',
                            anchor: [0.5, 1],
                            noExport: true
                        });
                    }
                }
            }
            else {
                if (self.#startMarker) {
                    self.trackLayer.removeFeature(self.#startMarker);
                    self.#startMarker = null;
                }
                if (self.#finishMarker) {
                    self.trackLayer.removeFeature(self.#finishMarker);
                    self.#finishMarker = null;
                }
            }
        }
    }

    export(li) {
        const self = this;
        return self.wrap.export(li);
    }

    clearFileInput(fileInput) {
        const form = document.createElement('form');
        const parent = fileInput.parentElement;
        parent.insertBefore(form, fileInput);
        form.appendChild(fileInput);
        form.reset();
        // Desenvolvemos el input del form
        form.insertAdjacentElement('afterend', fileInput);
        parent.removeChild(form);
    }

    getLoadingIndicator() {
        const self = this;

        if (!self.loading) {
            self.loading = self.map.getControlsByClass(LoadingIndicator);
            if (self.loading && self.loading.length > 0)
                self.loading = self.loading[0];
        }

        return self.loading;
    }

    onGeolocateError(error) {
        const self = this;

        if (navigator.geolocation) {
            if (self.currentPosition)
                navigator.geolocation.clearWatch(self.currentPosition);
            if (self.currentPositionTrk) {
                self.currentPositionTrk = self.currentPositionTrk instanceof Array ? self.currentPositionTrk : [self.currentPositionTrk];

                self.currentPositionTrk.forEach(function (watch) {
                    navigator.geolocation.clearWatch(watch);
                });

                self.currentPositionTrk = [];
            }
        }

        if (self.currentPositionWaiting)
            self.getLoadingIndicator().removeWait(self.currentPositionWaiting);

        var errorMsg;
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMsg = self.getLocaleString("geo.error.permission_denied");
                break;
            case error.POSITION_UNAVAILABLE:
                errorMsg = self.getLocaleString("geo.error.position_unavailable");
                break;
            case error.TIMEOUT:
                errorMsg = self.getLocaleString("geo.error.timeout");
                break;
            default:
                errorMsg = self.getLocaleString("geo.error.default");
                break;
        }

        self.map.toast(errorMsg, { type: Consts.msgType.WARNING });

        if (!self.geotrackingPosition && self.track) {
            self.track.activateButton.classList.remove(Consts.classes.HIDDEN);
            self.track.deactivateButton.classList.add(Consts.classes.HIDDEN);
        }
    }

    exportState() {
        const self = this;

        if (self.trackLayer && self.track || self.toShare) {
            let state = {
                id: self.id
            };
            if (!self.toShare || self.toShare && !self.toShare.doZoom) { // caso compartir general                
                self.toShare = { doZoom: false };
                let clonedToShare = Object.assign({}, self.toShare);
                let features = self.trackLayer.features;

                if (features.length > 0 && self.featuresToShare && self.featuresToShare.length > 0) {
                    clonedToShare.features = self.featuresToShare;
                } else {
                    const layerState = self.trackLayer.exportState({
                        features: features
                    });

                    clonedToShare.features = layerState.features;
                }

                const selectedTrackItem = self.getSelectedTrackItem();
                if (selectedTrackItem) {
                    clonedToShare.trackName = selectedTrackItem.querySelector('span').innerHTML;
                }
                state.trackResult = JSON.stringify(clonedToShare);
            } else { // compartir desde lista de rutas                
                state.trackResult = JSON.stringify(self.toShare);
            }

            return state;
        }
        else {
            return null;
        }
    }

    importState(state) {
        const self = this;
        if (self.map) {
            if (state.trackResult && state.trackResult.length) {
                self.enable();
                let sharedTrackResult = JSON.parse(state.trackResult);

                if (sharedTrackResult.features && sharedTrackResult.features.length > 0) {
                    const promises = new Array(sharedTrackResult.features.length);
                    sharedTrackResult.features.forEach(function (f, idx) {
                        const featureOptions = { data: f.data, id: f.id, showsPopup: f.showsPopup };
                        var geom = f.geom; // El redondeo hace que ya no podamos validar con los tracks existentes.
                        switch (f.type) {
                            case Consts.geom.POLYLINE:
                                promises[idx] = new Polyline(geom, featureOptions);
                                break;
                            case Consts.geom.MULTIPOLYLINE:
                                promises[idx] = new MultiPolyline(geom, featureOptions);
                                break;
                            case Consts.geom.MARKER:
                                promises[idx] = new Marker(geom, featureOptions);
                                break;
                            case Consts.geom.POINT:
                                promises[idx] = new Point(geom, featureOptions);
                                break;
                        }
                    });

                    if (Object.prototype.hasOwnProperty.call(sharedTrackResult, "doZoom")) {
                        self.loadingState = true;
                        self.toShare = { doZoom: sharedTrackResult.doZoom };
                    }

                    Promise.all(promises).then(function (tcFeatures) {
                        var options = { features: tcFeatures, fileName: sharedTrackResult.trackName, notReproject: true, isShared: true };
                        if (!self.availableTracks) {
                            self.getStoredTracks().then(function () {
                                self.importTrack(options);
                            });
                        } else {
                            self.importTrack(options);
                        }
                    });
                }
            }
        }
    }
}

TC.mix(Geolocation, infoShare);
TC.mix(Geolocation, itemToolContainer);

TC.control.Geolocation = Geolocation;
export default Geolocation;
/**
  * Opciones del control GPS y rutas.
  * @typedef GeolocationOptions
  * @extends ControlOptions
  * @see MapControlOptions
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


(function () {
    Math.hypot = Math.hypot || function () {
        var y = 0;
        var length = arguments.length;

        for (var i = 0; i < length; i++) {
            if (arguments[i] === Infinity || arguments[i] === -Infinity) {
                return Infinity;
            }
            y += arguments[i] * arguments[i];
        }
        return Math.sqrt(y);
    };
}());
(function () {
    var lastTime = 0,
        vendors = ['ms', 'moz', 'webkit', 'o'],
        // Feature check for performance (high-resolution timers)
        hasPerformance = !!(window.performance && window.performance.now);

    for (var x = 0, max = vendors.length; x < max && !window.requestAnimationFrame; x += 1) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }

    // Add new wrapper for browsers that don't have performance
    if (!hasPerformance) {
        // Store reference to existing rAF and initial startTime
        var rAF = window.requestAnimationFrame,
            startTime = +new Date;

        // Override window rAF to include wrapped callback
        window.requestAnimationFrame = function (callback, element) {
            // Wrap the given callback to pass in performance timestamp
            var wrapped = function (timestamp) {
                // Get performance-style timestamp
                var performanceTimestamp = (timestamp < 1e12) ? timestamp : timestamp - startTime;

                return callback(performanceTimestamp);
            };

            // Call original rAF with wrapped callback
            rAF(wrapped, element);
        }
    }
})();
(function () {
    // Polyfill window.performance.now
    if (!window.performance) {
        window.performance = {
            offset: Date.now(),
            now: function () {
                return Date.now() - this.offset;
            }
        };
    } else if (window.performance && !window.performance.now) {
        window.performance.offset = Date.now();
        window.performance.now = function () {
            return Date.now() - window.performance.offset;
        };
    }
}());

TC.control = TC.control || {};

if (!TC.Control) {
    TC.syncLoadJS(TC.apiLocation + 'TC/Control');
}

if (!TC.control.infoShare) {
    TC.syncLoadJS(TC.apiLocation + 'TC/control/infoShare');
}

TC.Consts.event.DIALOG = TC.Consts.event.DIALOG || 'dialog.tc';

TC.control.Geolocation = function (options) {
    var self = this;
    self._classSelector = '.' + self.CLASS;

    self._layerPromises = {};

    self.Const = {
        Classes: {
            ACTIVE: 'tc-ctl-geolocation-active',
            CLOSED: 'closed',
            SELECTEDTRACK: 'selectedTrack',
            DRAWACTIVATED: 'draw-activated',
            SIMULATIONACTIVATED: 'simulation-activated'
        },
        Selector: {
            SIMULATE: '.tc-btn-simulate',
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
            SPEED: '.tc-spn-speed'
        },
        LocalStorageKey: {
            TRACKING: 'trk',
            TRACKINGTEMP: 'trktemp',
            TRACKINGSHOWADVERTISEMENT: 'trkAdvertisement',
            GPSSHOWADVERTISEMENT: 'gpsAdvertisement',
            TEST: 'test'
        },
        Message: {
            VALIDATENAME: '',
        },
        Event: {
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
        MimeMap: {
            KML: 'application/vnd.google-earth.kml+xml',
            GPX: 'application/gpx+xml'
        },
        SupportedFileExtensions: [
            '.kml',
            '.gpx'
        ],
        Tabs: {
            GPS: "gps"
        },
        Layers: {
            GPS: "gps",
            TRACK: "track",
            TRACKING: "tracking"
        }
    };

    TC.Control.apply(self, arguments);

    var opts = options || {};
    self._dialogDiv = TC.Util.getDiv(opts.dialogDiv);
    if (window.$) {
        self._$dialogDiv = $(self._dialogDiv);
    }
    if (!opts.dialogDiv) {
        document.body.appendChild(self._dialogDiv);
    }

    self._shareDialogDiv = TC.Util.getDiv({});
    document.body.appendChild(self._shareDialogDiv);

    self.delta = 500;
    self.walkingSpeed = 5000;

    self.snappingTolerance = self.options.snappingTolerance || 50;

    self.notificationConf = {};

    self.exportsState = true;

    self.storageCRS = 'EPSG:4326';
};

TC.inherit(TC.control.Geolocation, TC.Control);
TC.mix(TC.control.Geolocation, TC.control.infoShare);

(function () {
    var ctlProto = TC.control.Geolocation.prototype;

    ctlProto.CLASS = 'tc-ctl-geolocation';

    ctlProto.CHART_SIZE = {
        MIN_HEIGHT: 75,
        MAX_HEIGHT: 128,

        MIN_WIDTH: 315,
        MEDIUM_WIDTH: 310,
        MAX_WIDTH: 445
    };

    ctlProto.featuresToShare = [];

    TC.Consts.event.TOOLSCLOSE = TC.Consts.event.TOOLSCLOSE || 'toolsclose.tc';
    TC.Consts.event.TOOLSOPEN = TC.Consts.event.TOOLSOPEN || 'toolsopen.tc';

    ctlProto.template = {};
    ctlProto.template[ctlProto.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-geolocation.hbs";
    ctlProto.template[ctlProto.CLASS + '-track-node'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-track-node.hbs";
    ctlProto.template[ctlProto.CLASS + '-track-snapping-node'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-track-snapping-node.hbs";
    ctlProto.template[ctlProto.CLASS + '-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-dialog.hbs";
    ctlProto.template[ctlProto.CLASS + '-tracking-toast'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-tracking-toast.hbs";
    ctlProto.template[ctlProto.CLASS + '-ext-dldlog'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-ext-dldlog.hbs";
    ctlProto.template[ctlProto.CLASS + '-share-dialog'] = TC.apiLocation + "TC/templates/tc-ctl-geolocation-share-dialog.hbs";

    var onFeatureRemove = function (e) {
        const self = this;
        const layer = e.layer;

        if (e.feature === self.wrap.simulateMarker) {
            return;
        }

        if (e.layer === self.layerTrack) {
            self.clearSelection();
        }
    };

    ctlProto.register = function (map) {
        const self = this;
        const result = TC.Control.prototype.register.call(self, map);

        self.wrap = new TC.wrap.control.Geolocation(self);
        self.wrap.register(map);

        map._bufferFeatures = [];

        self.hillDeltaThreshold = ((self.options && self.options.hillDeltaThreshold) ||
            (self.map.options.elevation && self.map.options.elevation.hillDeltaThreshold)) ||
            20;

        map.addLayer({
            id: self.getUID(),
            type: TC.Consts.layerType.VECTOR,
            owner: self,
            stealth: true,
            title: 'Posicionar.GPS',
        }).then(function (layer) {
            self.layerGPS = layer;
        });
        map.addLayer({
            id: self.getUID(),
            type: TC.Consts.layerType.VECTOR,
            owner: self,
            stealth: true,
            title: 'Posicionar.Tracking',
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
                        var name = feature.getData()['name'];
                        if (name && (name + '').trim().length > 0) {
                            name = (name + '').trim().toLowerCase();
                        } else {
                            name = '';
                        }

                        return name;
                    }
                },
                line: {
                    strokeOpacity: function () {
                        return this.track.renderTrack.checked ? 1 : 0;
                    }.bind(self),
                    strokeWidth: 2,
                    strokeColor: "#00ced1",
                    lineDash: [.1, 6]
                }
            }
        }).then(function (layer) {
            self.layerTracking = layer;
        });
        map.addLayer({
            id: self.getUID(),
            type: TC.Consts.layerType.VECTOR,
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
                        var name = feature.getData()['name'];
                        if (name && (name + '').trim().length > 0) {
                            return 3;
                        } else {
                            return 6;
                        }

                        return 3;
                    },
                    fillColor: "#C52737",
                    strokeColor: "#ffffff",
                    fontColor: "#C52737",
                    fontSize: 10,
                    labelOutlineColor: "#ffffff",
                    labelOutlineWidth: 2,
                    label: function (feature) {
                        var name = feature.getData()['name'];
                        if (name && (name + '').trim().length > 0) {
                            name = (name + '').trim().toLowerCase();
                        } else {
                            name = '';
                        }

                        return name;
                    }
                }
            }
        }).then(function (layer) {
            self.layerTrack = layer;
        });

        map.on(TC.Consts.event.FEATURESIMPORT, function (e) {
            const self = this;

            const featuresImport = function (e) {
                const fileName = e.fileName;
                const target = e.dropTarget;
                var kmlPattern = '.' + TC.Consts.format.KML.toLowerCase();
                var gpxPattern = '.' + TC.Consts.format.GPX.toLowerCase();

                // GLS: ¿es un GPX?
                if (fileName.toLowerCase().indexOf(gpxPattern) === fileName.length - gpxPattern.length ||
                    // GLS: ¿es un KML y viene desde el upload de Geolocation?
                    (fileName.toLowerCase().indexOf(kmlPattern) === fileName.length - kmlPattern.length && target === self)) {

                    self.clear(self.Const.Layers.TRACK);
                    const importedGPX = function () {
                        //Controlamos que todo ha acabado para hacer zoom a las features y ocultar el loading
                        setTimeout(function () {
                            self.map._bufferFeatures = self.map._bufferFeatures.concat(e.features);
                            window.dropFilesCounter--;
                            if (dropFilesCounter === 0) {
                                self.map.zoomToFeatures(self.map._bufferFeatures);
                                self.map._bufferFeatures = [];
                                delete window.dropFilesCounter;
                                var li = self.map.getLoadingIndicator();
                                if (li) {
                                    li.removeWait(self.map._fileDropLoadingIndicator);
                                    self.map._fileDropLoadingIndicator = null;
                                }
                                self.off(self.Const.Event.IMPORTEDTRACK, importedGPX);
                            }
                        }, 0);                       

                    }
                    self.on(self.Const.Event.IMPORTEDTRACK, importedGPX);
                    self.importTrack(e);
                                        
                    if (/.kml$/g.test(fileName.toLowerCase()) && self.layerTrack) {
                        if (self.layerTrack.styles) {
                            self.layerTrack.features.forEach(function (feature) {
                                if (TC.feature.Point && feature instanceof TC.feature.Point && self.layerTrack.styles.point) {
                                    feature.setStyle(self.layerTrack.styles.point);
                                } else if (TC.feature.Polyline && feature instanceof TC.feature.Polyline && self.layerTrack.styles.line) {
                                    feature.setStyle(self.layerTrack.styles.line);
                                }
                            });
                        }
                    }
                } else {
                    //GLS: si es un KML pero viene desde el mapa o es otro tipo de archivo que no es ni GPX ni KML, lo ignoramos
                    return;
                }
            };

            if (self.working && TC.Util.isFunction(self.working.then)) {
                self.working.then(featuresImport(e));
            } else {
                self.working = true;
                featuresImport(e);
            }

        }.bind(self));

        map.on(TC.Consts.event.PROJECTIONCHANGE, function (e) {
            if (self.elevationChartData) {
                self.elevationChartData.coords = TC.Util.reproject(self.elevationChartData.coords, e.oldCrs, e.newCrs);
            }
        });

        map.on(TC.Consts.event.DIALOG, function (e) {
            if (e.control) {
                switch (e.action) {
                    case "share":
                        if (e.control.caller !== self) {
                            self.onShowShareDialog(e.control.caller);
                        }
                        break;
                    case "download":
                        self.onShowDownloadDialog(e.control.caller);
                        break;
                }
            }
        });

        self.notificationConf = Object.assign(self.options.notification || {}, {
            tag: "Geolocation Track",
            vibrate: [200],
            renotify: true,
            requireInteraction: true,
            body: self.getLocaleString("geo.trk.notification.body")
        }, {
                title: self.options.notification && self.options.notification.title ? self.getLocaleString(self.options.notification.title) : document.title,
            });

        return result;
    };

    ctlProto.getElevationControl = async function () {
        const self = this;

        if (!self.elevationControl) {
            let options = {};
            if (!self.options.displayElevation && self.options.displayOn) {
                options.displayOn = self.options.displayOn;
            } else if (self.options.displayElevation) {
                options = self.options.displayElevation;
            }
            if (self.options.hasOwnProperty('resolution')) { // la configuración de la resolución es distinta al obtener el perfil (0) que para la descarga (20). La configuración para la descarga se gestiona en getDownloadDialog...
                options.resolution = self.options.resolution;
            } else {
                options.resolution = 0;
            }
            self.elevationControl = await self.map.addControl('elevation', options);

            self.elevationControl._decorateChartPanel = function () {
                this.resultsPanel.setCurrentFeature = function (feature) {
                    const that = this;
                    that.currentFeature = self.layerTrack.features.filter((feature) => {
                        return !(TC.feature.Marker && feature instanceof TC.feature.Marker) && !(TC.feature.Point && feature instanceof TC.feature.Point)
                    })[0];
                    const currentSelectedTrack = self.getSelectedTrack();
                    if (currentSelectedTrack) {
                        that.currentFeature.uid = currentSelectedTrack.dataset.uid;
                        that.currentFeature.fileName = getDownloadFileName.call(self, currentSelectedTrack);
                    }

                };
            };

        }
        return self.elevationControl;
    };

    ctlProto.render = function (callback) {
        const self = this;
        return self.getRenderedHtml(self.CLASS + '-dialog', null, function (html) {
            self._dialogDiv.innerHTML = html;
        }).then(function () {
            return self.getDownloadDialog().then(() => {
                self._downloadDialog.caller = self;
                self.getRenderedHtml(self.CLASS + '-ext-dldlog', { controlId: self.id }, function (html) {
                    var template = document.createElement('template');
                    template.innerHTML = html;
                    self._downloadDialogExtNode = template.content ? template.content.firstChild : template.firstChild;
                    self.getRenderedHtml(self.CLASS + '-share-dialog', {}, function (html) {
                        self._shareDialogDiv.innerHTML = html;
                        return self.renderData({ controlId: self.id }, callback);
                    });
                });
            });
        });
    };

    ctlProto.importTrack = function (options) {
        var self = this;
        self.map.off(TC.Consts.event.FEATUREREMOVE, onFeatureRemove);
        if (!self.isDisabled) {
            if (options.fileName && options.features && options.features.length > 0) {
                var wait = self.getLoadingIndicator().addWait();
                self.importedFileName = options.fileName;
                const addPromises = [];
                for (var i = 0, len = options.features.length; i < len; i++) {
                    addPromises.push(self.layerTrack.addFeature(options.features[i]));
                }
                Promise.all(addPromises).then(function () {
                    self.wrap.processImportedFeatures({ wait: wait, notReproject: options.notReproject });
                    if (self.layerTrack) { // Si tenemos capa es que todo ha ido bien y gestionamos el despliegue del control
                        // Desplegamos el control "ubicar" al importar mediante drag&drop
                        if (self.map && self.map.layout && self.map.layout.accordion) {
                            if (self.div.classList.contains(TC.Consts.classes.COLLAPSED)) {
                                self.map.controls
                                    .filter(function (ctl) {
                                        // Todos los otros controles que no cuelgan de otro control
                                        return ctl !== self && !ctl.containerControl;
                                    })
                                    .forEach(function (ctl) {
                                        ctl.div.classList.add(TC.Consts.classes.COLLAPSED);
                                    });
                            }
                        }

                        self.div.classList.remove(TC.Consts.classes.COLLAPSED);
                        self.div.querySelector('.' + self.CLASS + '-btn-tracks > span').click();

                        if (!options.isShared) {
                            // abrimos el panel de herramientas
                            self.map.trigger(TC.Consts.event.TOOLSOPEN);
                        }
                    }
                });
            }
        } else if (/.gpx$/g.test(options.fileName.toLowerCase())) {
            self.map.toast(self.getLocaleString("geo.trk.import.disabled"), { type: TC.Consts.msgType.WARNING });
        }
    };

    ctlProto.prepareFeaturesToShare = function (options) {
        const self = this;
        let trackUid = options.uid;
        return new Promise(function (resolve, reject) {
            if (trackUid) {
                var storageData = self.availableTracks.filter(function (saved) {
                    return saved.uid.toString() === trackUid.toString();
                })[0].data;

                // Aplicamos una precisión un dígito mayor que la del mapa, si no, al compartir algunas parcelas se deforman demasiado
                var precision = Math.pow(10, TC.Consts.DEGREE_PRECISION + 1);

                var storageFeatures = new ol.format.GeoJSON().readFeatures(storageData);
                const promises = new Array(storageFeatures.length);
                storageFeatures.forEach(function (f, idx) {
                    promises[idx] = TC.wrap.Feature.createFeature(f);
                });

                Promise.all(promises).then(function (tcFeatures) {
                    let features = tcFeatures.map(function (f) {
                        const fObj = {};
                        var layerStyle;
                        switch (true) {
                            case TC.feature.Marker && f instanceof TC.feature.Marker:
                                fObj.type = TC.Consts.geom.MARKER;
                                break;
                            case TC.feature.Point && f instanceof TC.feature.Point:
                                fObj.type = TC.Consts.geom.POINT;
                                break;
                            case TC.feature.Polyline && f instanceof TC.feature.Polyline:
                                fObj.type = TC.Consts.geom.POLYLINE;
                                break;
                            case TC.feature.MultiPolyline && f instanceof TC.feature.MultiPolyline:
                                fObj.type = TC.Consts.geom.MULTIPOLYLINE;
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
                    resolve(features);
                });
            } else {
                reject();
            }
        });


    };

    const getDownloadFileName = function (elem) {
        const self = this;
        var filename = elem.querySelector('span').textContent;
        var regex = new RegExp(self.Const.SupportedFileExtensions.join('|'), 'gi');
        return filename.replace(regex, '') + "_" + TC.Util.getFormattedDate(new Date(), true);
    };

    const getElevationFromService = async function (feature) {
        const self = this;
        let cachedFeature = getElevationFromServiceOnCache(feature);
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
                    cacheElevationFromService(feature, toDownload[0]);
                    return toDownload[0];
                } catch (e) {
                    return null;
                }
            }
        }
    }

    ctlProto.onShowShareDialog = function (caller) {
        const self = this;
        if (caller instanceof Element || caller instanceof HTMLDocument) {
            if (caller.classList.contains(self.CLASS + '-share-dialog')) {
                return TC.control.infoShare.onShowShareDialog.call(self);
            } else {
                return Promise.resolve();
            }
        } else if (caller === self) {
            return TC.control.infoShare.onShowShareDialog.call(self);
        }
        else if (caller !== self &&
            caller.toShare &&
            caller.toShare.feature &&
            caller.toShare.feature.layer === self.layerTrack) {
            // cerramos el diálogo abierto por featureTools para mostrar el de geolocation
            TC.Util.closeModal(function () {
                TC.control.infoShare.onCloseShareDialog.call(caller);
                const selectedTrack = self.getSelectedTrack();
                if (selectedTrack) {
                    return self.shareTrack(selectedTrack).then(function () {
                        const shareDialog = self._shareDialogDiv.querySelector('.' + self.CLASS + '-share-dialog');
                        TC.Util.showModal(shareDialog, {
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
    };

    var interpolationPanel = null; /* tengo que dejar fuera la vble porque con const y let dentro del bloque una vez cerrado el modal no funciona. 
    Ejecuta la intrucción pero no produce cambios en el HTML, es como si se quedase alguna referencia interna pocha */
    var checkboxElevations = null; /* pasa lo mismo que con el panel ¿?¿?¿? */
    ctlProto.onShowDownloadDialog = function (caller, allFeatures) {
        const self = this;
        const RADIO_TRACK = "track";
        const RADIO_MDT = "mdt";
        const originalDialogFeatures = self._downloadDialog.getFeatures();

        // llega desde el panel del perfil del track: hacemos que el diálogo sea igual que cuando llega desde la lista aunque lo invoque featureTools
        if (caller !== self && self._downloadDialog.getFeatures().every(f => f && f.layer === self.layerTrack)) {
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
        if (caller === self || self._downloadDialog.getFeatures().every(f => f && f.layer === self.layerTrack)) {
            if (!self._downloadDialog.modalBody.querySelector('.' + self.CLASS + "-ext-dldlog")) {
                let divToExtensions = self._downloadDialog.modalBody.querySelector('.' + self._downloadDialog.CLASS + "-ext");
                if (divToExtensions) {
                    divToExtensions.appendChild(self._downloadDialogExtNode);

                    checkboxElevations = self._downloadDialog.modalBody.querySelector('.' + self._downloadDialog.CLASS + "-elev input[type='checkbox']");
                    interpolationPanel = self._downloadDialog.modalBody.querySelector('.' + self._downloadDialog.CLASS + "-ip");
                    const radioDlSource = self._downloadDialog.modalBody.querySelectorAll(`input[type=radio][name="${self.id}-dldlog-source"]`);

                    // si el track no tiene elevaciones y solo contamos con las del MDT ocultamos el botón de descargar originales                    
                    const disableOriginalsRadio = function (condition) {
                        const originalsRadio = radioDlSource[0];
                        if (condition) {
                            if (!originalsRadio.classList.contains(TC.Consts.classes.DISABLED)) {
                                originalsRadio.classList.add(TC.Consts.classes.DISABLED);
                            }
                        } else {
                            originalsRadio.classList.remove(TC.Consts.classes.DISABLED);
                        }
                    };
                    let feature = originalDialogFeatures.filter((feat) => {
                        return TC.feature.Polyline && feat instanceof TC.feature.Polyline;
                    })[0];
                    let coord = feature.geometry[0];
                    let noZ = feature.geometry[0].length === 2;
                    if (noZ) {
                        disableOriginalsRadio(noZ);
                    } else if (feature.geometry[0].length > 2) {
                        disableOriginalsRadio(feature.geometry.map((c) => c[2]).every((val) => val === 0));
                    }


                    const interpolationPanelIsHidden = function () {
                        return interpolationPanel && interpolationPanel.classList.contains(TC.Consts.classes.HIDDEN);
                    };
                    const setInterpolationPanelVisibility = function () {
                        if (radioDlSource[0].checked && !interpolationPanelIsHidden()) {
                            interpolationPanel.classList.add(TC.Consts.classes.HIDDEN);
                        } else if (radioDlSource[0].checked) {
                            let observer = new MutationObserver(function (mutations) {
                                mutations.filter(m => m.attributeName === "class").forEach(function (mutation) {
                                    if (mutation.oldValue.indexOf(TC.Consts.classes.HIDDEN) > -1) {
                                        if (radioDlSource[0].checked) {
                                            interpolationPanel.classList.add(TC.Consts.classes.HIDDEN);
                                            observer.disconnect();
                                        } else {
                                            observer.disconnect();
                                        }
                                    }
                                });
                            });

                            let config = { attributes: true, attributeOldValue: true };
                            observer.observe(interpolationPanel, config);
                        } else {
                            if (interpolationPanelIsHidden() && checkboxElevations.checked) {
                                interpolationPanel.classList.remove(TC.Consts.classes.HIDDEN);
                            }
                        }
                    };

                    if (checkboxElevations) {
                        if (checkboxElevations.checked) {
                            setInterpolationPanelVisibility();
                            self._downloadDialogExtNode.classList.remove(TC.Consts.classes.HIDDEN);
                        } else if (!self._downloadDialogExtNode.classList.contains(TC.Consts.classes.HIDDEN)) {
                            self._downloadDialogExtNode.classList.add(TC.Consts.classes.HIDDEN);
                        }
                        checkboxElevations.addEventListener("change", function () {
                            setInterpolationPanelVisibility();
                            self._downloadDialogExtNode.classList.toggle(TC.Consts.classes.HIDDEN);
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
                                        let feature = featuresFromDialog.filter((feat) => {
                                            return TC.feature.Polyline && feat instanceof TC.feature.Polyline;
                                        })[0];

                                        if (allFeatures) {
                                            featuresToDownload = featuresFromDialog.filter((feat) => {
                                                return TC.feature.Point && feat instanceof TC.feature.Point;
                                            });
                                        }

                                        let uid = feature.uid;
                                        let cachedProfile = getElevationProfileFromCache(uid);
                                        if (cachedProfile) {
                                            // Clonamos la feature para presevar la geometría original por si el usuario cambia de nuevo a track
                                            let toDownload = feature.clone();
                                            toDownload.setCoords(cachedProfile.data.secondaryElevationProfileChartData[0].coords);
                                            if (allFeatures) {
                                                if (!featuresToDownload) {
                                                    featuresToDownload = (getCurrentPoints.call(self) || []);
                                                }
                                                featuresToDownload.push(toDownload);
                                            } else {
                                                featuresToDownload = toDownload;
                                            }
                                        } else {
                                            self._downloadDialog.modalBody.classList.add(TC.Consts.classes.LOADING);

                                            let toDownload = await getElevationFromService.call(self, feature);
                                            if (toDownload) {
                                                if (allFeatures) {
                                                    featuresToDownload.push(toDownload);
                                                } else {
                                                    featuresToDownload = toDownload;
                                                }
                                            } else {
                                                self.map.toast(self.getLocaleString("elevation.error"), { type: TC.Consts.msgType.ERROR, duration: 5000 });
                                                radioDlSource[0].checked = true;
                                            }

                                            self._downloadDialog.modalBody.classList.remove(TC.Consts.classes.LOADING);
                                        }
                                    }

                                    self._downloadDialog.setFeatures(featuresToDownload);
                                }
                            });
                        });

                        if (radioDlSource[0].classList.contains(TC.Consts.classes.DISABLED) ||
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
    };

    ctlProto.getDownloadDialogOptions = function (fileName) {
        const self = this;

        const options = {
            title: self.getLocaleString('download'),
            fileName: fileName,
            openCallback: function () {
                self.onShowDownloadDialog(self, true);
            }
        };
        if (self.options.displayElevation) {
            options.elevation = {
                resolution: (self.options.displayElevation && self.options.displayElevation.resolution) || (self.map.options.elevation && self.map.options.elevation.resolution) || 20,
                sampleNumber: (self.options.displayElevation && self.options.displayElevation.sampleNumber) || (self.map.options.elevation && self.map.options.elevation.sampleNumber) || 0,
                checked: true
            };
        } else {
            options.elevation = {
                checked: true
            };
        }

        return options;
    };

    var visibilityTrack = true;
    ctlProto.renderData = function (data, callback) {
        const self = this;

        var sel = self.Const.Selector;

        return TC.Control.prototype.renderData.call(self, data, function () {

            const options = self.div.querySelectorAll(self._classSelector + '-panel');
            self.div.querySelectorAll('.' + self.CLASS + '-select span').forEach(function (span) {
                span.addEventListener(TC.Consts.event.CLICK, function (e) {
                    var label = e.target;
                    while (label && label.tagName !== 'LABEL') {
                        label = label.parentElement;
                    }
                    const newFormat = label.querySelector(`input[type=radio][name="${self.id}-mode"]`).value;

                    options.forEach(function (option) {
                        option.classList.toggle(TC.Consts.classes.HIDDEN, !option.matches('.' + self.CLASS + '-' + newFormat));
                    });
                }, { passive: true });
            });

            self.track = {
                activateButton: self.div.querySelector(self._classSelector + '-track-ui-activate'),
                deactivateButton: self.div.querySelector(self._classSelector + '-track-ui-deactivate'),
                trackSearch: self.div.querySelector(self._classSelector + '-track-available-srch'),
                trackImportFile: self.div.querySelector(self._classSelector + '-track-import'),
                trackSave: self.div.querySelector(self._classSelector + '-track-save'),
                trackAdd: self.div.querySelector(self._classSelector + '-track-add-wpt'),
                trackContinue: self._dialogDiv.querySelector('.' + self.CLASS + '-track-continue'),
                trackRenew: self._dialogDiv.querySelector('.' + self.CLASS + '-track-new'),
                trackClose: self._dialogDiv.querySelector('.' + self.CLASS + '-continue-track-dialog button.tc-modal-close'),
                //trackAddSegment: self.div.querySelector('#tc-ctl-geolocation-track-segment'),
                trackAdvertisementOK: self._dialogDiv.querySelector('.' + self.CLASS + '-track-advert-ok')
            };

            self.track.trackList = self.div.querySelector(self._classSelector + '-track-available-lst');

            self.track.trackToolPanelOpened = self.div.querySelector('#tc-ctl-geolocation-track-panel-opened-' + self.id);

            self.div.querySelector('.' + ctlProto.CLASS + '-track-panel-help').addEventListener('click', function () {
                _showAlerMsg.call(self);
            });

            self.track.trackName = self.div.querySelector(self._classSelector + '-track-title');

            self.track.trackWPT = self.div.querySelector(self._classSelector + '-track-waypoint');

            if (TC.Util.detectMobile()) {
                if (matchMedia('screen and (max-height: 50em) and (max-width: 50em)').matches)
                    self.track.trackToolPanelOpened.checked = false;
            }

            if (window.File && window.FileReader && window.FileList && window.Blob) {
                self.track.trackImportFile.disabled = false;
                // GLS: Eliminamos el archivo subido, sin ello no podemos subir el mismo archivo seguido varias veces
                self.track.trackImportFile.addEventListener(TC.Consts.event.CLICK, function (e) {
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
                    self.map.off(TC.Consts.event.LAYERERROR, _layerError);
                    self.clearFileInput(self.track.trackImportFile);

                    TC.alert(self.getLocaleString("geo.trk.upload.error3"));
                };

                self.track.trackImportFile.addEventListener('change', function (e) {
                    if (!self._cleaning) { // Valido que el evento import no lo provoco yo al limpiar el fileinput (al limpiar se lanza el change)                        
                        self.clear(self.Const.Layers.TRACK);

                        if (self.map) {
                            self.map.on(TC.Consts.event.LAYERERROR, _layerError);
                            self.map.wrap.loadFiles(e.target.files, { control: self });
                        }
                    }
                });
            } else {
                console.log('no es posible la importación');
            }

            self.track.activateButton.addEventListener('click', function () {
                self.activateTracking();
                _activateTrackingBtns.call(self);

            });
            self.track.deactivateButton.addEventListener('click', function () {
                self.deactivateTracking();
                _deactivateTrackingBtns.call(self);
            });

            var _filter = function (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                //tc-ctl-geolocation-track-available-empty
                const lis = Array.from(self.track.trackList.querySelectorAll('li'));
                lis.forEach(function (li) {
                    li.style.display = 'none';
                });
                const trackLis = lis.filter(function (li) {
                    return li.matches('li:not([class]),li.' + self.Const.Classes.SELECTEDTRACK);
                });

                const searchIcon = self.div.querySelector(self._classSelector + '-track-search-icon');
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
                _filter(this.value.toLowerCase().trim());
            };
            self.track.trackSearch.addEventListener("keyup", trackSearchListener);
            self.track.trackSearch.addEventListener("search", trackSearchListener);

            // en el panel
            self.track.trackSave.addEventListener('click', self.saveTrack.bind(self));
            self.track.trackAdd.addEventListener('click', self.addWaypoint.bind(self));

            const list = self.div.querySelector(self._classSelector + '-track-available-lst');

            // en lista
            var _edit = function (edit, elm) {
                if (elm.tagName !== 'LI') {
                    elm = elm.parentElement;
                }

                const input = elm.querySelector('input');
                const span = elm.querySelector('span');

                if (edit) {

                    input.classList.remove(TC.Consts.classes.HIDDEN);
                    input.focus();
                    input.value = span.textContent;
                    span.classList.add(TC.Consts.classes.HIDDEN);
                    elm.dataset['title'] = elm.title;
                    elm.title = "";

                    elm.querySelector(sel.SIMULATE).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EDIT).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.DELETE).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.DRAW).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EXPORT).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.SHARE).classList.add(TC.Consts.classes.HIDDEN);

                    elm.querySelector(sel.SAVE).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.CANCEL).classList.remove(TC.Consts.classes.HIDDEN);
                } else {

                    input.classList.add(TC.Consts.classes.HIDDEN);
                    span.classList.remove(TC.Consts.classes.HIDDEN);
                    elm.title = elm.dataset['title'];
                    delete elm.dataset['title'];

                    elm.querySelector(sel.SIMULATE).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EDIT).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.DELETE).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.DRAW).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.EXPORT).classList.remove(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.SHARE).classList.remove(TC.Consts.classes.HIDDEN);

                    elm.querySelector(sel.SAVE).classList.add(TC.Consts.classes.HIDDEN);
                    elm.querySelector(sel.CANCEL).classList.add(TC.Consts.classes.HIDDEN);
                }
            };

            self.uiSimulate = function (simulate, elm) {
                if (elm) {
                    var editControls = [
                        sel.SIMULATE,
                        sel.EDIT,
                        sel.DELETE,
                        sel.EXPORT,
                        sel.SHARE
                    ];
                    var simulateControls = [
                        sel.STOP,
                        sel.PAUSE,
                        sel.BACKWARD,
                        sel.FORWARD,
                        sel.SPEED
                    ];
                    var cnt = elm.tagName === 'LI' ? elm : elm.parentNode;

                    editControls.forEach(function (ctl) {
                        cnt.querySelector(ctl).hidden = simulate;
                    });

                    simulateControls.forEach(function (ctl) {
                        cnt.querySelector(ctl).hidden = !simulate;
                    });
                }
            };

            list.addEventListener('click', TC.EventTarget.listenerBySelector(sel.SIMULATE, function (e) {
                var wait = self.getLoadingIndicator().addWait();

                e.target.parentElement.querySelector(sel.SPEED).textContent = 'x 1';

                _loadTrack(self, e.target).then(function () { //Para evitar el bloqueo de la interfaz en móviles
                    self.getLoadingIndicator().removeWait(wait)
                });
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(sel.DRAW, function (e) {
                var wait = self.getLoadingIndicator().addWait();

                _drawTrack(self, e.target).then(function () {
                    self.getLoadingIndicator().removeWait(wait);
                });
            }));

            self.on(self.Const.Event.IMPORTEDTRACK, function (e) {
                if (!self.isDisabled) {
                    const listElement = self.track.trackList.querySelector('li[data-id="' + e.index + '"]');
                    _drawTrack(self, listElement.querySelector(sel.DRAW)).then(function () {
                        if (self.loadingState) {
                            delete self.loadingState;
                            delete self.toShare;
                        }
                    });
                    setTimeout(function () {
                        self.track.trackList.scrollTop = e.index * listElement.offsetHeight;
                    }, 100);
                } else {
                    self.map.toast(self.getLocaleString("geo.trk.import.disabled"), { type: TC.Consts.msgType.WARNING });
                }
            });

            const _stopOtherTracks = function (self, trackLiId) {
                self.track.trackList.querySelectorAll('li[data-id]').forEach(function (listItem) {
                    if (listItem.dataset.id !== trackLiId) {
                        const btnSimulate = listItem.querySelector(sel.SIMULATE);
                        const btnPause = listItem.querySelector(sel.PAUSE);

                        btnSimulate.classList.remove(self.Const.Classes.SIMULATIONACTIVATED);
                        btnSimulate.setAttribute('title', self.getLocaleString("tr.lst.simulate"));
                        btnPause.classList.remove('play');
                        btnPause.setAttribute('title', self.getLocaleString("tr.lst.pause"));

                        self.uiSimulate(false, listItem);
                        _edit(false, listItem);
                    }
                });

                // para el resize no me va bien aquí
                //self.clear(self.Const.Layers.TRACK);
            };

            var _drawTrack = function (self, btnDraw) {
                return new Promise(function (resolve, reject) {

                    const trackLi = btnDraw.parentElement;

                    setTimeout(function () {
                        if (trackLi.classList.contains(self.Const.Classes.SELECTEDTRACK)) {
                            self.uiSimulate(false, btnDraw);

                            self.clear(self.Const.Layers.TRACK);
                            self.map.off(TC.Consts.event.FEATUREREMOVE, onFeatureRemove);

                            btnDraw.setAttribute('title', btnDraw.textContent);
                        }
                        else if (self.getSelectedTrack()) { // GLS: si hay elemento seleccionado actuamos
                            _stopOtherTracks(self, trackLi.dataset.id);
                            self.working = self.drawTrack(trackLi);
                        } else {
                            self.working = self.drawTrack(trackLi);
                        }

                        /* GLS: 15/02/2019 Preparamos la feature por si se comparte, necesito hacerlo aquí 
                           porque la gestión en asíncrona y todo el flujo de exportación es síncrono */
                        if (trackLi.classList.contains(self.Const.Classes.SELECTEDTRACK)) {
                            self.prepareFeaturesToShare({ uid: trackLi.dataset.uid, setFeaturesToShare: true }).then(function () {
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    }, 0);
                });
            };

            var _loadTrack = function (self, btnSimulate) {
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        const trackLi = btnSimulate.parentElement;
                        const selectedTrack = self.getSelectedTrack();
                        _stopOtherTracks(self, trackLi.dataset.id);
                        self.uiSimulate(false, selectedTrack);
                        self.uiSimulate(true, btnSimulate);

                        // para el resize con película mejor así
                        if (selectedTrack && trackLi.dataset.id !== selectedTrack.dataset.id) {
                            self.clear(self.Const.Layers.TRACK);
                        }

                        self.simulate_paused = false;
                        self.simulateTrack(trackLi);

                        resolve();
                    }, 0);
                });
            };

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.EDIT, function (e) {
                _edit(true, e.target);
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.DELETE, function (e) {
                self.removeTrack(e.target.parentElement);
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.SAVE, function (e) {
                var newName = e.target.parentElement.querySelector('input').value;
                if (newName.trim().length === 0) {
                    TC.alert(self.getLocaleString('geo.trk.edit.alert'));
                }
                else {
                    self.editTrackName(e.target.parentElement.dataset.id, e.target.parentElement.querySelector('input').value);
                    _edit(false, e.target);
                }
            }));
            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.CANCEL, function (e) {
                _edit(false, e.target);
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.SHARE, function (e) {
                self.shareTrack(e.target.parentElement).then(function () {
                    self.showShareDialog(self._shareDialogDiv);
                });
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.EXPORT, function (e) {
                const parent = e.target.parentElement;
                e.target.setAttribute('disabled', "");

                self.export(parent).then((features) => {
                    self.getDownloadDialog().then(function (dialog) {
                        const options = self.getDownloadDialogOptions(getDownloadFileName.call(self, parent));
                        dialog.open(features.map((f) => { f.uid = parent.dataset.uid; return f; }), options);

                        e.target.removeAttribute('disabled');
                    });
                });
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.STOP, function (e) {
                self.uiSimulate(false, e.target);
                self.wrap.simulateTrackEnd();
                const btnPause = e.target.parentElement.querySelector(sel.PAUSE);
                btnPause.classList.remove('play');
                btnPause.setAttribute('title', self.getLocaleString('tr.lst.pause'));

                e.target.parentElement.querySelector(sel.SPEED).textContent = 'x 1';
                self.simulate_speed = 1;
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.PAUSE, function (e) {
                self.simulate_paused = !e.target.classList.contains('play');
                if (self.simulate_paused)
                    self.simulate_pausedElapse = -1;

                e.target.setAttribute('title', self.getLocaleString(self.simulate_paused ? 'tr.lst.play' : 'tr.lst.pause'));
                e.target.classList.toggle('play', !!self.simulate_paused);
            }));

            var lapse = 0.5;
            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.BACKWARD, function (e) {
                if (self.simulate_speed == 1)
                    self.simulate_speed = lapse;
                else self.simulate_speed = self.simulate_speed / 2;

                e.target.parentElement.querySelector(self._classSelector + " " + sel.FORWARD).disabled = false;

                e.target.parentElement.querySelector(sel.SPEED).textContent = self.simulate_speed < 1 ? '/ ' + (1 / self.simulate_speed) : 'x ' + self.simulate_speed;

                if (self.simulate_speed == 0.000244140625) {
                    e.target.disabled = true;
                }
            }));

            list.addEventListener('click', TC.EventTarget.listenerBySelector(self._classSelector + ' ' + sel.FORWARD, function (e) {
                self.simulate_speed = self.simulate_speed / lapse;

                e.target.parentElement.querySelector(sel.SPEED).textContent = self.simulate_speed < 1 ? '/ ' + (1 / self.simulate_speed) : 'x ' + self.simulate_speed;

                e.target.parentElement.querySelector(self._classSelector + " " + sel.BACKWARD).disabled = false;

                if (self.simulate_speed == 4096) {
                    e.target.disabled = true;
                }
            }));


            // popup
            self.track.trackContinue.addEventListener('click', function () {
                // cerramos popup y continuamos con el track de session y almacenando en session
                TC.Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                _tracking.call(self);
            });
            self.track.trackRenew.addEventListener('click', function () {
                // eliminamos el track actual de session - restablecemos el tracking
                delete self.sessionTracking;
                TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, undefined);
                localforage.removeItem(self.Const.LocalStorageKey.TRACKINGTEMP);
                // cerramos el popup
                TC.Util.closeModal();
                // al obtener la posición se almacena en session y continuamos almacenando en session mientras se mueve
                _tracking.call(self);
            });
            self.track.trackClose.addEventListener('click', function () {
                _deactivateTrackingBtns.call(self);
            });
            //self.track.trackAddSegment.addEventListener('click', function () {
            //    TC.alert('pendiente');
            //    // cerramos el popup
            //    TC.Util.closeModal();
            //});

            // popup advertencia
            self.track.trackAdvertisementOK.addEventListener('click', function () {

                const checkboxes = document.body.querySelectorAll('input[name*="Advertisement"]:checked');

                if (checkboxes.length > 0) {
                    const promise = new Promise(function (resolve, reject) {
                        if (window.localforage)
                            resolve();
                        else {
                            TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                                resolve();
                            });
                        }
                    });

                    promise.then(function () {
                        localforage.setItem(checkboxes[0].getAttribute('name'), false);
                    });
                }

                TC.Util.closeModal();
            });

            self.track.renderTrack = self.div.querySelector('#tc-ctl-geolocation-track-render-' + self.id);
            self.track.renderTrack.addEventListener('change', function () {
                if (self.track.activateButton.classList.contains(TC.Consts.classes.HIDDEN)) {
                    self.layerTracking.setVisibility(this.checked);
                }

                visibilityTrack = this.checked;
            });

            if (window.localforage)
                self.bindTracks();
            else {
                TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                    self.bindTracks();
                });
            }

            if (TC.Util.isFunction(callback)) {
                callback();
            }
        });
    };

    ctlProto.shareTrack = function (li) {
        const self = this;
        return self.getShareDialog(self._shareDialogDiv).then(function () {
            return self.prepareFeaturesToShare({ uid: li.dataset.uid, setFeaturesToShare: false })
                .then(function (features) {
                    self.toShare = {
                        trackName: li.querySelector('span').innerHTML,
                        features: features
                    };
                });
        });
    };

    ctlProto.activate = function () {
        //var self = this;
        //TC.Control.prototype.activate.call(self);
    };

    ctlProto.deactivate = function () {
        var self = this;

        TC.Util.closeModal();
        self.clearSelection();
        self.deactivateTracking();
        //TC.Control.prototype.deactivate.call(self);
    };

    var _activateTrackingBtns = function () {
        var self = this;

        self.track.activateButton.classList.add(TC.Consts.classes.HIDDEN);
        self.track.deactivateButton.classList.remove(TC.Consts.classes.HIDDEN);
    };

    var _deactivateTrackingBtns = function () {
        var self = this;

        self.track.activateButton.classList.remove(TC.Consts.classes.HIDDEN);
        self.track.deactivateButton.classList.add(TC.Consts.classes.HIDDEN);
    };

    var _showAlerMsg = function () {
        var self = this;
        self.map.toast(self.div.querySelector(".alert-warning").innerHTML, {
            duration: 10000
        });
    };

    ctlProto.markerStyle = {
        radius: 10,
        fillColor: [255, 0, 0, 100],
        strokeColor: [255, 255, 255, 255],
        strokeWidth: 2
    };

    ctlProto.lineStyle = {
        strokeWidth: 2,
        strokeColor: [0, 206, 209, 255]
    };

    ctlProto.setFormatInfoNewPosition = function (newPosition) {
        var self = this;

        var data = {};
        var locale = TC.Util.getMapLocale(self.map);

        if (self.map.on3DView) {
            var geoCoords = self.map.crs !== self.map.view3D.crs ? TC.Util.reproject(newPosition.position, self.map.crs, self.map.view3D.crs) : newPosition.position;
            data.x = geoCoords[0].toLocaleString(locale);
            data.y = geoCoords[1].toLocaleString(locale);

            data.mdt = Math.round(self.map.view3D.getHeightFromMDT(geoCoords)).toLocaleString(locale);

            data.isGeo = true;

        } else {
            data.x = Math.round(newPosition.position[0]).toLocaleString(locale);
            data.y = Math.round(newPosition.position[1]).toLocaleString(locale);
        }

        data.z = (Math.round(newPosition.altitude).toLocaleString(locale));
        data.accuracy = (Math.round(newPosition.accuracy).toLocaleString(locale));
        data.speed = newPosition.speed.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

        return data;
    };

    ctlProto.getTrackInfoPanel = function () {
        const self = this;
        if (!self.track._infoPanelPromise) {
            self.track._infoPanelPromise = new Promise(function (resolve, reject) {
                if (!self.track.infoPanel) {

                    var resultsPanelOptions = {
                        content: "table",
                        resize: false,
                        titles: {
                            main: self.getLocaleString("geo.mylocation"),
                            max: self.getLocaleString("geo.mylocation.show")
                        },
                        classes: {
                            collapsed: "tracking"
                        }
                    };

                    var ctlPromise;
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
                        var controlContainer = self.map.getControlsByClass('TC.control.' + displayOn[0].toUpperCase() + displayOn.substring(1))[0];
                        if (!controlContainer) {
                            self.map.addControl(displayOn).then(addResultsPanelInfo);
                        } else {
                            addResultsPanelInfo(controlContainer);
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
    };

    ctlProto.renderInfoNewPosition = function (d) {
        const self = this;

        self.getRenderedHtml(self.CLASS + '-tracking-toast', self.setFormatInfoNewPosition(d.pd), function (html) {
            self.getTrackInfoPanel().then(function (infoPanel) {
                if (!infoPanel.isMinimized()) {
                    self.map.getControlsByClass(TC.control.ResultsPanel)
                        .filter(panel => panel.content === panel.contentType.TABLE && panel !== infoPanel)
                        .forEach(function (panel) {
                            panel.close();
                        });
                    infoPanel.renderPromise().then(function () {
                        infoPanel.options.collidingPriority = infoPanel.COLLIDING_PRIORITY.IGNORE;
                        infoPanel.open(html);
                    });
                }
            });
        });
    };


    var duringTrackingToolsPanel = function () {
        var self = this;

        if (!self.track.trackToolPanelOpened.checked) {
            self.map.trigger(TC.Consts.event.TOOLSCLOSE);
        }
    };

    var _tracking = function () {
        var self = this;

        self.activate();

        _activateTrackingBtns.call(self);
        duringTrackingToolsPanel.call(self);

        self.on(self.Const.Event.POSITIONCHANGE, function (d) {

            self.currentPoint = d.pd;
            self.renderInfoNewPosition(d);

            self.track.trackName.disabled = false;
            self.track.trackSave.disabled = false;

            self.track.trackWPT.disabled = false;
            self.track.trackAdd.disabled = false;

            // cada vez que se registra una nueva posición almacenamos en sessionStorage
            TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.formattedToStorage(self.layerTracking).features);
        });
        self.on(self.Const.Event.STATEUPDATED, function (data) {
            //self.track.htmlMarker.setAttribute('src', data.moving ? 'layout/idena/img/geo-marker-heading.png' : 'layout/idena/img/geo-marker.png');
        });

        self.clear(self.Const.Layers.TRACKING);

        advertisement.call(self, self.Const.LocalStorageKey.TRACKINGSHOWADVERTISEMENT);

        self.wrap.setTracking(true);
    };

    /* inicio gestión suspensión de la pantalla en móviles */
    var _onpauseVideo;
    let isSupported = false;
    let wakeLock = null;
    let notifications = null;
    if ('wakeLock' in navigator) {
        isSupported = true;
    }
    let _ctlInstance = null;

    var keepWakeLock = function () {
        var self = _ctlInstance = this;
        if (!isSupported)
            addVideoKeepScreenOn.apply(self);
        else {

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
    }
    var releaseLock = function () {
        var self = _ctlInstance = this;
        if (!isSupported)
            removeVideoKeepScreenOn.apply(self);
        else {
            //document.removeEventListener('visibilitychange', handleVisibilityChange);
            wakeLock.release()
                .then(() => {
                    wakeLock = null;
                })
        }
    }
    var addVideoKeepScreenOn = function () {
        var self = this;

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
    };
    var removeVideoKeepScreenOn = function () {
        var self = this;
        if (self.videoScreenOn) {
            self.videoScreenOn.pause();
        }
    };

    var _onWindowBlurred;
    var onWindowBlurred = function () {
        var self = this;

        fromSessionToStorage.apply(self);
    };

    var _onWindowFocused;
    var onWindowFocused = function () {
        var self = this;

        if (self.videoScreenOn && self.videoScreenOn.paused)
            self.videoScreenOn.play();

        fromStorageToSession.apply(self);
    };

    var getHiddenProperty = function () {
        var prefixes = ['webkit', 'moz', 'ms', 'o'];

        if ('hidden' in document) return 'hidden';

        for (var i = 0; i < prefixes.length; i++) {
            if ((prefixes[i] + 'Hidden') in document)
                return prefixes[i] + 'Hidden';
        }

        return null;
    };

    var _onWindowVisibility;
    var onWindowVisibility = async function () {
        var self = this;

        var hidden = getHiddenProperty();

        if (!document[hidden]) {
            if (wakeLock !== null) {
                keepWakeLock.apply(self);
            }
            else
                onWindowFocused.apply(self);
        }
        else if (notifications) {
            if (navigator.serviceWorker &&
                //si se pulta shift + F5 el objeto controller de serviceWorkerContainer es null
                (navigator.serviceWorker.controller ||
                    //entonces ontenemos el SW del control SWCache client si existe y miramos si está activo
                    (self.map.getControlsByClass(TC.control.SWCacheClient).length && (await self.map.getControlsByClass(TC.control.SWCacheClient)[0].getServiceWorker()).state === "activated")))
                try {
                    const registration = await navigator.serviceWorker.ready;
                    registration.showNotification(self.notificationConf.title, Object.assign(self.notificationConf, {
                        actions: [{
                            action: "back",
                            title: self.getLocaleString("geo.trk.notification.backButton")
                        }], data: {
                            "url": document.location.href
                        }
                    }));
                }
                catch (ex) {
                    const notification = new Notification(self.notificationConf.title, self.notificationConf);
                }
            else {
                const notification = new Notification(self.notificationConf.title, self.notificationConf);
            }
        }
        if (!wakeLock && self.videoScreenOn)
            console.log('video is: ' + self.videoScreenOn.paused);

    };
    var addWindowEvents = function () {
        var self = this;

        if (!_onWindowVisibility)
            _onWindowVisibility = onWindowVisibility.bind(self);

        if (!_onWindowBlurred)
            _onWindowBlurred = onWindowBlurred.bind(self);

        if (!_onWindowFocused)
            _onWindowFocused = onWindowFocused.bind(self);

        window.addEventListener('visibilitychange', _onWindowVisibility, false);

        // ipad / iphone / ipod (Safari mobile, not Android default browsers not Chrome Mobile that is)
        if (TC.Util.detectSafari() && TC.browserFeatures.touch() && !navigator.userAgent.match(/Android/i) && !navigator.userAgent.match(/CriOS/i)) {
            window.addEventListener('pagehide', _onWindowBlurred, false);
            window.addEventListener('pageshow', _onWindowFocused, false);
        } else { // the rest            
            window.addEventListener('blur', _onWindowBlurred, false);
            window.addEventListener('focus', _onWindowFocused, false);
        }
    }
    var removeWindowEvents = function () {

        window.removeEventListener('visibilitychange', _onWindowVisibility, false);

        // ipad / iphone / ipod (Safari mobile, not Android default browsers not Chrome Mobile that is)
        if (TC.Util.detectSafari() && TC.browserFeatures.touch() && !navigator.userAgent.match(/Android/i) && !navigator.userAgent.match(/CriOS/i)) {
            window.removeEventListener('pagehide', _onWindowBlurred, false);
            window.removeEventListener('pageshow', _onWindowFocused, false);
        } else { // the rest            
            window.removeEventListener('blur', _onWindowBlurred, false);
            window.removeEventListener('focus', _onWindowFocused, false);
        }
    };

    var fromSessionToStorage = function () {
        var self = this;

        var sessionTracking = TC.Util.storage.getSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP);
        if (sessionTracking && sessionTracking.length > 0)
            localforage.setItem(self.Const.LocalStorageKey.TRACKINGTEMP, typeof (sessionTracking) === "string" ? sessionTracking : JSON.stringify(sessionTracking));
    };
    var fromStorageToSession = function () {
        var self = this;

        localforage.getItem(self.Const.LocalStorageKey.TRACKINGTEMP).then(function (storageData) {
            if (storageData !== null && storageData !== "null" && storageData.length > 0) {
                TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, storageData);
            }
        });
    };
    /* final gestión suspensión de la pantalla en móviles */

    var advertisement = function (showAdvertisement) {
        var self = this;

        var done = new Promise(function (resolve, reject) {
            if (window.localforage)
                resolve();
            else {
                TC.loadJS(!window.localforage, [TC.Consts.url.LOCALFORAGE], function () {
                    resolve();
                });
            }
        });

        done.then(function () {
            localforage.getItem(showAdvertisement).then(function (registeredShowAdvertisement) {
                if (registeredShowAdvertisement == null) {
                    const dialog = self._dialogDiv.querySelector('.tc-ctl-geolocation-track-advert-dialog');
                    const checkbox = dialog.querySelector('input[type="checkbox"]');
                    checkbox.setAttribute('name', showAdvertisement);
                    checkbox.checked = false;

                    document.querySelector('#pageBlurMsg').textContent = TC.Util.detectMobile() ? self.getLocaleString('geo.trk.page.blur') : self.getLocaleString('geo.trk.page.blur.desktop');

                    dialog.querySelector('h3').textContent = showAdvertisement == self.Const.LocalStorageKey.GPSSHOWADVERTISEMENT ?
                        self.getLocaleString("geo.track.activate") + " " + self.getLocaleString("geo.gps") :
                        self.getLocaleString('geo.track.activate.title');

                    TC.Util.showModal(self._dialogDiv.querySelector('.tc-ctl-geolocation-track-advert-dialog'));
                }
            });
        });

        self.map.toast(!TC.Util.detectMobile() ? self.getLocaleString('geo.trk.page.blur.desktop') : self.getLocaleString('geo.trk.page.blur'), {
            type: TC.Consts.msgType.WARNING
        });
    };

    ctlProto._askTracking = function (callback) {
        var self = this;

        TC.Util.showModal(self._dialogDiv.querySelector('.tc-ctl-geolocation-continue-track-dialog'), {
            closeCallback: function () {

                if (TC.Util.isFunction(callback)) {
                    callback();
                }
            }
        });

        return true;
    };

    ctlProto.activateTracking = function () {
        var self = this;
        var trackingAvailable = true;

        if (!self.isActive) {
            self.activate();
        }

        self.clear(self.Const.Layers.TRACKING);

        try {
            TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TEST, self.Const.LocalStorageKey.TEST);
        } catch (error) {
            if (error.code === DOMException.QUOTA_EXCEEDED_ERR)
                TC.alert(self.getLocaleString("geo.error.trackinglocalstorage"));
            else TC.error(error);

            trackingAvailable = false;
        }

        if (trackingAvailable) {
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
            keepWakeLock.apply(self);
            addWindowEvents.apply(self);

            self.sessionTracking = TC.Util.storage.getSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP);
            if (self.sessionTracking) {
                var asked = self._askTracking(function () {
                    _deactivateTrackingBtns.call(self);
                });

                if (!asked) {
                    self.track.trackRenew.click();
                }
            } else _tracking.call(self);
        } else { _deactivateTrackingBtns.call(self); }
    };

    ctlProto.deactivateTracking = function () {
        var self = this;

        var _deactivateTracking = function () {

            self.getTrackInfoPanel().then(panel => panel.close());

            fromSessionToStorage.apply(self);

            self.wrap.setTracking(false);


            delete self.geopositionTracking;

            if (!visibilityTrack) {
                self.div.querySelector(self._classSelector + '-track-render').querySelector('label').click();
            }

            releaseLock.apply(self);
            removeWindowEvents.apply(self);

            self.off(self.Const.Event.POSITIONCHANGE);
            self.off(self.Const.Event.STATEUPDATED);

            _deactivateTrackingBtns.call(self);

            self.track.trackName.value = '';
            self.track.trackName.disabled = true;
            self.track.trackSave.disabled = true;

            self.track.trackWPT.value = '';
            self.track.trackWPT.disabled = true;
            self.track.trackAdd.disabled = true;

            self.clear(self.Const.Layers.TRACKING);
            self.clear(self.Const.Layers.GPS);

            //TC.Control.prototype.deactivate.call(self);

            return true;
        };

        if (self.wrap.hasCoordinates()) {
            self.map.toast(self.getLocaleString("geo.trk.deactivate.alert"), {
                duration: 10000
            });
            //TC.alert(self.getLocaleString("geo.trk.deactivate.alert"));
            return _deactivateTracking();
        } else return _deactivateTracking();
    };

    /* Obtengo los tracks desde localForage */
    ctlProto.getStoredTracks = function () {
        const self = this;
        return new Promise(function (resolve, reject) {
            var tracks = [];

            const onResolve = function (toResolve) {
                // estamos en la carga inicial
                if (elevationProfileCache.length === 0) {
                    toResolve
                        .filter(elm => { return elm.profile })
                        .forEach((elm) => elevationProfileCache.push({ uid: elm.uid, data: JSON.parse(elm.profile) }));
                }
                resolve(toResolve);
            };

            localforage.keys()
                .then(function (keys) {
                    keys = keys.filter(function (k) {
                        if (!(k.indexOf(self.Const.LocalStorageKey.TRACKINGTEMP) === 0) && k.indexOf(self.Const.LocalStorageKey.TRACKING) === 0) {
                            return /trk#\d/i.exec(k);
                        }
                        return false;
                    });

                    if (keys.length == 0) {
                        self.availableTracks = tracks;
                        onResolve(tracks);
                    }

                    const promises = new Array(keys.length);
                    keys.forEach(function (key, idx) {
                        promises[idx] = new Promise(function (res, rej) {
                            localforage.getItem(key, function (e, v) {
                                res(v);
                            });
                        });
                    });

                    Promise.all(promises).then(function (results) {
                        if (results && results.length) {
                            results.forEach(function (r) {
                                var r = JSON.parse(r);
                                if (r instanceof Array) {
                                    tracks = tracks.concat(r);
                                } else {
                                    tracks.push(r);
                                }
                            });

                            var tracksArray = tracks.length > 1 ? _orderTracks(tracks) : tracks;
                            self.availableTracks = tracksArray;
                            onResolve(tracksArray);
                        }
                    });
                })
                .catch((err) => {
                    console.log('Capturamos error que se produce por configuración del navegador.');
                    TC.error(self.getLocaleString('couldNotAccessLocalStorage'));
                });
        });
    };

    /*
     * Recibe una sucesión de tracks y la ordena por nombre.
     */
    var _orderTracks = function (tracks) {
        var tracksArray = [];

        for (var index in tracks) {
            if (tracks[index] && typeof (tracks[index]) === "object") {
                tracksArray.push(tracks[index]);
                tracksArray.sort(function (a, b) {
                    if (typeof (a.name) === "string") {
                        return TC.Util.isFunction(a.name.localeCompare) ? a.name.localeCompare(b.name) : 0;
                    } else { return 0; }
                });
            }
        }

        return tracksArray;
    };

    /* Almaceno los tracks mediante localForage, actualizo la vble availableTracks y actualizo la lista de tracks */
    ctlProto.setStoredTracks = function (tracks) {
        const self = this;
        return new Promise(function (resolve, reject) {
            const promises = [];
            tracks.forEach(function (t) {
                promises.push(new Promise(function (res, rej) {
                    localforage.setItem(self.Const.LocalStorageKey.TRACKING + "#" + t.uid, JSON.stringify(t), function (e, v) {
                        res(v);
                    });
                }));
            });

            Promise.all(promises).then(function () {
                self.getStoredTracks().then(function () {
                    self.bindTracks();
                    resolve();
                });
            });
        });
    };

    /* Obtengo los tracks desde vble local */
    ctlProto.getAvailableTracks = function () {
        const self = this;
        return new Promise(function (resolve, reject) {
            if (!self.availableTracks) {
                self.getStoredTracks().then(function (availableTracks) {
                    resolve(availableTracks);
                });
            }
            else {
                resolve(self.availableTracks);
            }
        });
    };

    ctlProto.bindTracks = function () {
        var self = this;

        const listItems = self.track.trackList.querySelectorAll('li');
        listItems.forEach(function (li) {
            li.style.display = 'none';
        });

        self.getAvailableTracks().then(function (tracks) {

            if (_isEmpty(tracks)) {
                self.track.trackList.querySelectorAll('li[class^="tc-ctl-geolocation-track-available-empty"]').forEach(function (li) {
                    li.style.display = '';
                });
                self.track.trackSearch.disabled = true;
            }
            else {
                const currentSelectedTrack = self.getSelectedTrack();
                var currentSelectedTrackId;
                if (currentSelectedTrack) {
                    currentSelectedTrackId = currentSelectedTrack.dataset.uid
                }
                self.track.trackList.querySelectorAll('li[data-id]').forEach(function (li) {
                    self.track.trackList.removeChild(li);
                });

                for (var i = 0; i < tracks.length; i++) {
                    var t = tracks[i];
                    if (typeof (t) === "object") {
                        self.getRenderedHtml(self.CLASS + '-track-node', {
                            id: i, uid: t.uid, name: t.name ? t.name.trim() : ''
                        }, function (html) {
                            const parser = new DOMParser();
                            const newLi = parser.parseFromString(html, 'text/html').body.firstChild;
                            self.track.trackList.appendChild(newLi);
                        });
                    }
                }

                if (currentSelectedTrackId) {
                    self.setSelectedTrack(self.track.trackList.querySelector('li[data-uid="' + currentSelectedTrackId + '"]'));
                }

                self.track.trackSearch.disabled = false;
            }
        });
    };

    ctlProto.chartProgressClear = function () {
        const self = this;

        self.getElevationControl().then(elevCtl => elevCtl && elevCtl.removeElevationTooltip());
    };

    ctlProto.chartSetProgress = function (previous, current, distance, doneTime) {
        var self = this;

        if (self.elevationControl && self.elevationControl.resultsPanel && (!self.elevationControl.resultsPanel.isVisible() || self.elevationControl.resultsPanel.isMinimized())) {
            return;
        }

        var done = previous.d;
        var locale = self.map.options.locale && self.map.options.locale.replace('_', '-') || undefined;
        var ele = parseInt(current[2].toFixed(0)).toLocaleString(locale);
        var dist;
        var measure;
        if ((done / 1000) < 1) {
            dist = Math.round((done / 1000) * 1000);
            measure = ' m';
        } else {
            dist = Math.round((done / 1000) * 100) / 100;
            measure = ' km';
        }

        dist = dist.toLocaleString(locale);

        const hasSecondaryElevationProfileChartData = self.elevationChartData && self.elevationChartData.secondaryElevationProfileChartData &&
            Array.isArray(self.elevationChartData.secondaryElevationProfileChartData) && self.elevationChartData.secondaryElevationProfileChartData.length > 0 &&
            self.elevationChartData.secondaryElevationProfileChartData[0];

        if (hasSecondaryElevationProfileChartData &&
            self.elevationChartData.secondaryElevationProfileChartData[0].elev &&
            !self.elevationChartData.secondaryElevationProfileChartData[0].elevCoords &&
            !self.elevationChartData.secondaryElevationProfileChartData[0].eleCoordinates) {

            let coords = [...self.elevationChartData.coords];

            if (Array.isArray(coords) && Array.isArray(coords[0])) {
                coords.forEach((c, i) => {
                    c.splice(2, 1, self.elevationChartData.secondaryElevationProfileChartData[0].ele[i])
                });

                self.elevationChartData.secondaryElevationProfileChartData[0].elevCoords = self.elevationChartData.secondaryElevationProfileChartData[0].eleCoordinates = coords;
            }
        }

        let ele2;
        if (hasSecondaryElevationProfileChartData &&
            self.elevationChartData.secondaryElevationProfileChartData[0].eleCoordinates) {
            ele2 = TC.wrap.Geometry.getNearest(current, self.elevationChartData.secondaryElevationProfileChartData[0].eleCoordinates);
            ele2 = parseInt(ele2[2].toFixed(0)).toLocaleString(locale);
        }

        if (self.elevationChartData) {
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
    };

    ctlProto._getTime = function (timeFrom, timeTo) {
        var diff = timeTo - timeFrom;
        var d = {};
        var daysDifference = Math.floor(diff / 1000 / 60 / 60 / 24);
        diff -= daysDifference * 1000 * 60 * 60 * 24;

        var hoursDifference = Math.floor(diff / 1000 / 60 / 60);
        diff -= hoursDifference * 1000 * 60 * 60;

        d.h = hoursDifference + (daysDifference * 24);

        var minutesDifference = Math.floor(diff / 1000 / 60);
        diff -= minutesDifference * 1000 * 60;

        d.m = minutesDifference;

        d.s = Math.floor(diff / 1000);

        return TC.Util.extend({}, d, { toString: ("00000" + d.h).slice(-2) + ':' + ("00000" + d.m).slice(-2) + ':' + ("00000" + d.s).slice(-2) });
    };

    ctlProto.simulateTrack = async function (li) {
        var self = this;

        const elevCtl = await self.getElevationControl();
        elevCtl.removeElevationTooltip();
        self.simulate_speed = 1;
        if (self.getSelectedTrack() === li && // si el usuario a activado la película del track ya seleccionado no repintamos
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
    };

    ctlProto.drawTrack = function (li, activateSnapping) {
        var self = this;

        self.clear(self.Const.Layers.TRACK);

        duringTrackingToolsPanel.call(self);
        return new Promise(function (resolve, reject) {
            self.setSelectedTrack(li);
            self.drawTrackingData(li).then(function () {
                self.elevationTrack(li).then(() => {
                    self.activate();

                    resolve();
                }).catch(reject);
            });
        });
    };

    const elevationProfileCache = [];

    const getElevationProfileFromCache = function (uid) {
        return elevationProfileCache.filter(function (elm) {
            return elm.uid.toString() === uid.toString();
        })[0];
    };

    const cacheElevationProfile = function (feature, data, trackUID) {
        const self = this;
        var result = getElevationProfileFromCache(trackUID);
        if (!result) {
            result = {
                uid: parseFloat(trackUID)
            };
            elevationProfileCache.push(result);
            self.getAvailableTracks().then(function (tracks) {
                if (tracks) {
                    let index = tracks.findIndex((t) => { return t.uid.toString() === trackUID });
                    if (index > -1) {
                        tracks[index].profile = JSON.stringify(data);
                        self.setStoredTracks(tracks);
                    }
                }
            });
        }
        result.data = data;
        return result;
    };

    const elevationFromServiceCache = [];

    var arr_diff = function (a1, a2) {

        var a = [], diff = [];

        for (var i = 0; i < a1.length; i++) {
            a[a1[i]] = true;
        }

        for (var i = 0; i < a2.length; i++) {
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

    const getElevationFromServiceOnCache = function (feature) {
        let isOnCache = elevationFromServiceCache.filter(function (elm) {
            return elm.feature === feature;
        })[0];
        if (!isOnCache) {
            return elevationFromServiceCache.filter(function (elm) {
                return arr_diff(elm.feature.geometry, feature.geometry).length === 0;
                //return elm.feature.geometry === feature.geometry; aunque sean iguales da falso ¿?¿?¿?
            })[0];
        } else {
            return isOnCache;
        }
    };

    const cacheElevationFromService = function (feature, data) {
        var result = getElevationFromServiceOnCache(feature);
        if (!result) {
            result = {
                feature: feature
            };
            elevationFromServiceCache.push(result);
        }
        result.data = data;
        return result;
    };
    const isLine = function (feat) {
        return TC.feature.Polyline && feat instanceof TC.feature.Polyline;
    };
    const getCurrentPolyline = function () {
        return this.layerTrack.features
            .filter(function (feat) {
                return isLine(feat);
            })[0];
    };
    const getCurrentPoints = function () {
        return this.layerTrack.features
            .filter(function (feat) { // filtrando por Point se cuelan los Marker
                return TC.feature.Marker && !(feat instanceof TC.feature.Marker) &&
                    !isLine(feat);
            });
    };

    ctlProto.elevationTrack = function (li, resized) {
        var self = this;

        return new Promise((resolve, reject) => {
            if (resized) {
                self.wrap.simulateTrackEnd(resized);
                self.uiSimulate(false, li);
                return;
            }
            if (!self.onResize) {
                self.onResize = self.elevationTrack.bind(self, li, true);
                window.addEventListener("resize", self.onResize, false);
            }
            self.getElevationControl().then(async function (elevCtl) {
                if (elevCtl) {
                    let cachedProfile = getElevationProfileFromCache(li.dataset.uid);
                    if (!cachedProfile) {
                        const track = await self.getTrackingData(li);
                        if (self.layerTrack && self.layerTrack.features) {
                            let features = self.layerTrack.features.filter((f) => {
                                return isLine(f) &&
                                    ((track.layout === ol.geom.GeometryLayout.XYZM ||
                                        track.layout === ol.geom.GeometryLayout.XYZ) || self.options.displayElevation)
                            });

                            if (features.length > 0) {
                                let line = features[0];
                                let time = {};
                                // track con tiempo
                                if (track.layout == ol.geom.GeometryLayout.XYZM ||
                                    track.layout == ol.geom.GeometryLayout.XYM) {
                                    let diff = 0;
                                    if (track.layout == ol.geom.GeometryLayout.XYZM) {
                                        diff = line.geometry[line.geometry.length - 1][3] - line.geometry[0][3];
                                    } else {
                                        diff = line.geometry[line.geometry.length - 1][2] - line.geometry[0][2];
                                    }
                                    time = {
                                        s: Math.floor((diff / 1000) % 60),
                                        m: Math.floor(((diff / (1000 * 60)) % 60)),
                                        h: Math.floor(((diff / (1000 * 60 * 60)) % 24))
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
                                        cacheElevationProfile.call(self, getCurrentPolyline.call(self), elevCtl.elevationProfileChartData, li.dataset.uid);

                                        // 10/02/2020 gestionamos el borrado desde featureTools
                                        onFeatureRemove = onFeatureRemove.bind(self);
                                        self.map.on(TC.Consts.event.FEATUREREMOVE, onFeatureRemove);

                                        resultsPanelChart.div.addEventListener('mouseover', function (e) {
                                            if (self.layerTrack && self.layerTrack.getVisibility() && self.layerTrack.getOpacity() > 0)
                                                self.wrap.activateSnapping.call(self.wrap);
                                        });
                                        resultsPanelChart.div.addEventListener('mouseout', function (e) {
                                            if (self.layerTrack && (!self.layerTrack.getVisibility() && self.layerTrack.getOpacity() == 0))
                                                self.wrap.deactivateSnapping.call(self.wrap);
                                        });

                                        self.map
                                            .on(TC.Consts.event.RESULTSPANELMIN, function () { self.chartProgressClear(); })
                                            .on(TC.Consts.event.RESULTSPANELCLOSE, function () { self.chartProgressClear(); });

                                        // mantenemos el mismo nombre de archivo al descargar desde panel y desde la lista.
                                        elevCtl.getProfilePanel().then(function (resultsPanel) {
                                            let selectedTrack = self.getSelectedTrack();
                                            if (selectedTrack) {
                                                resultsPanel.currentFeature.fileName = getDownloadFileName.call(self, self.getSelectedTrack());
                                            }
                                        });
                                    }
                                };
                                elevCtl.displayElevationProfile(line, options);
                            } else {
                                reject();
                            }
                        } else {
                            reject();
                        }
                    } else {
                        if (!self.options.displayElevation) {
                            delete cachedProfile.data.secondaryElevationProfileChartData[0];
                        }
                        self.elevationChartData = cachedProfile.data;
                        elevCtl.getProfilePanel().then(function (resultsPanel) {
                            resultsPanel.renderPromise().then(function () {
                                resultsPanel.doVisible();
                                elevCtl.renderElevationProfile(self.elevationChartData);
                            });
                            resultsPanel.setCurrentFeature();
                        });
                    }
                    resolve();
                } else {
                    reject();
                }
            }).catch(reject);
        });
    };

    ctlProto.clear = function (layerType) {
        var self = this;

        if (self.onResize) {
            window.removeEventListener("resize", self.onResize, false);
            self.onResize = undefined;
        }

        if (layerType == self.Const.Layers.TRACK) {

            self.layerTrack.clearFeatures();

            // gráfico perfil de elevación
            self.getElevationControl().then(elevCtl => elevCtl && elevCtl.closeElevationProfile());
            delete self.elevationChartData;

            // overlay de la simulación
            self.wrap.simulateTrackEnd();

            self.wrap.clear();

            // eliminamos la selección en la lista de tracks
            self.track.trackList.querySelectorAll('li').forEach(function (li) {
                li.classList.remove(self.Const.Classes.SELECTEDTRACK);
            });

            self.map.trigger(self.Const.Event.CLEARTRACK);

            self.featuresToShare = [];

            if (!self.loadingState) {
                delete self.toShare;
            }

            //TC.Control.prototype.deactivate.call(self);

        } else {
            self.layerTracking.clearFeatures();
            self.layerGPS.clearFeatures();
        }
    };

    ctlProto.saveTrack = function (options) {
        const self = this;
        return new Promise(function (resolve, reject) {
            let message = options.message || self.getLocaleString("geo.trk.save.alert");

            var _save = function (layer) {
                let wait;
                wait = self.getLoadingIndicator().addWait();

                let trackName = options.importedFileName || self.track.trackName.value.trim();

                let tracks = self.availableTracks;
                if (!tracks) {
                    tracks = [];
                }

                let formatted = self.wrap.formattedToStorage(layer, true, options.notReproject);

                let clean = function (wait) {
                    self.track.trackName.value = '';
                    self.track.trackName.disabled = true;
                    self.track.trackSave.disabled = true;

                    self.track.trackWPT.value = '';
                    self.track.trackWPT.disabled = true;
                    self.track.trackAdd.disabled = true;

                    self.getLoadingIndicator().removeWait(wait);

                    duringTrackingToolsPanel.call(self);
                };

                let newTrack = {
                    name: trackName,
                    data: formatted.features,
                    layout: formatted.layout,
                    crs: self.storageCRS
                };

                const getHashToCompare = function (trackObject) {
                    // reemplazamos los ids contenidos en la geomtría que provocan falsos negativos.
                    let toGetHash = JSON.parse(JSON.stringify(trackObject));
                    const regex = /(\"id\"\s?\:\s?\"[a-z0-9]+\")/gi;
                    toGetHash.data = toGetHash.data.replace(regex, '""');

                    return hex_md5(JSON.stringify(toGetHash));
                };

                TC.loadJS(
                    !window.hex_md5,
                    [TC.apiLocation + TC.Consts.url.HASH],
                    function () {
                        let hash = getHashToCompare(newTrack);

                        let sameTrackUID = tracks.map(function (savedTrack) {
                            let clonedTrack = JSON.parse(JSON.stringify(savedTrack));
                            delete clonedTrack.uid;
                            delete clonedTrack.profile;

                            if (hash === getHashToCompare(clonedTrack)) {
                                return savedTrack.uid;
                            } else {
                                const jsonFormat = new ol.format.GeoJSON();
                                // validamos si se trata de un track exportado/importado ya que se compacta la geometría
                                let features = jsonFormat.readFeatures(clonedTrack.data);
                                // Aplicamos una precisión un dígito mayor que la del mapa, si no, al compartir algunas parcelas se deforman demasiado
                                let precision = Math.pow(10, TC.Consts.DEGREE_PRECISION + 1);

                                features.forEach(function (feature) {
                                    let geom = TC.Util.explodeGeometry(TC.Util.compactGeometry(feature.getGeometry().getCoordinates(), precision));
                                    feature.getGeometry().setCoordinates(geom);
                                });

                                clonedTrack.data = jsonFormat.writeFeatures(features);

                                if (hash === hex_md5(JSON.stringify(clonedTrack))) {
                                    return savedTrack.uid;
                                } else {
                                    return null;
                                }
                            }

                        }).filter(function (uid) {
                            return uid !== null
                        });

                        const getTrackIndex = function (uid) {
                            return self.getStoredTracks().then(function () {
                                self.bindTracks();

                                let index;
                                for (var i = 0; i < self.availableTracks.length; i++) {
                                    if (self.availableTracks[i].uid === uid) {
                                        index = i;
                                        break;
                                    }
                                }

                                return index;
                            });
                        };

                        if (sameTrackUID.length === 0) {
                            newTrack.uid = Date.now() + Math.random();
                            tracks.push(newTrack);
                            tracks = _orderTracks(tracks);

                            try {
                                self.setStoredTracks(tracks).then(function () {
                                    self.map.toast(message, { duration: 3000 });

                                    clean(wait);

                                    getTrackIndex(newTrack.uid).then(function (index) {
                                        resolve(index);
                                    });
                                });

                            } catch (error) {
                                TC.alert(self.getLocaleString("geo.error.savelocalstorage") + ': ' + error.message);
                                clean(wait);
                                reject(error);
                            }
                        } else {
                            console.log('Ya existe un track con ese mismo hash');

                            clean(wait);

                            getTrackIndex(sameTrackUID[0]).then(function (index) {
                                resolve(index);
                            });
                        }
                    });

            };

            const createTCFeatures = function (features) {
                return new Promise(function (resolve, reject) {
                    var featurePromises = features.filter(function (feature) {
                        return !feature._wrap;
                    }).forEach(function (elm) {
                        return TC.wrap.Feature.createFeature(elm);
                    });

                    Promise.all(featurePromises).then(function (tcFeatures) {
                        resolve();
                    });
                });
            };

            if (self.importedFileName)
                _save(self.layerTrack);
            else if (self.track.trackName.value.trim().length == 0) {
                self.track.trackName.value = new Date().toLocaleString();
                _save(self.layerTracking);
            }
            else {
                _save(self.layerTracking);
            }
        });
    };

    ctlProto.addWaypoint = function () {
        var self = this;

        var waypointName = self.track.trackWPT.value.trim();
        if (!waypointName) {
            waypointName = new Date().toLocaleString();
        }

        var wait = self.getLoadingIndicator().addWait();

        duringTrackingToolsPanel.call(self);

        self.wrap.addWaypoint(self.currentPoint.position, {
            name: waypointName,
            ele: self.currentPoint.heading,
            time: new Date().getTime() // GLS: lo quito ya que hemos actualizado la función que gestiona la fechas para la exportación a GPX - espera la fecha en segundos -> / 1000 // para la exportación a GPX - espera la fecha en segundos
        });

        self.track.trackWPT.value = '';
        self.track.trackWPT.disabled = true;
        self.track.trackAdd.disabled = true;

        // cada vez que se añade un waypoint almacenamos en sessionStorage
        TC.Util.storage.setSessionLocalValue(self.Const.LocalStorageKey.TRACKINGTEMP, self.wrap.formattedToStorage(self.layerTracking).features);

        self.getLoadingIndicator().removeWait(wait);
    };

    ctlProto.editTrackName = function (trackId, newName) {
        var self = this;

        self.getAvailableTracks().then(function (tracks) {
            if (tracks) {
                if (tracks[trackId]) {
                    tracks[trackId].name = newName;

                    self.setStoredTracks(tracks);
                }
            }
        });
    };

    ctlProto.removeTrack = function (li) {
        var self = this;

        self.getAvailableTracks().then(function (tracks) {
            if (tracks) {
                var dataId = li.dataset.id;
                if (tracks[dataId]) {
                    var uid = tracks[dataId].uid;

                    TC.confirm(self.getLocaleString("geo.trk.delete.alert"), function () {

                        const selectedTrack = self.getSelectedTrack();
                        if (selectedTrack && selectedTrack.dataset.id === dataId) {
                            self.clear(self.Const.Layers.TRACK);
                        }

                        localforage.removeItem(self.Const.LocalStorageKey.TRACKING + '#' + uid).then(function () {
                            self.getStoredTracks().then(function () {
                                self.bindTracks();
                            });
                        }).catch(function (err) {
                            console.log(err);
                        });

                    }, function () { });
                }
            }
        });
    };

    ctlProto.setSelectedTrack = function (li) {
        var self = this;

        if (!self.isActive) {
            self.activate();
        }

        self.track.trackList.querySelectorAll('li[data-id] > span').forEach(function (span) {
            span.setAttribute('title', span.textContent);
        });
        self.track.trackList.querySelectorAll('li').forEach(function (li) {
            li.classList.remove(self.Const.Classes.SELECTEDTRACK);
        });

        li.classList.add(self.Const.Classes.SELECTEDTRACK);

        li.setAttribute('title', self.getLocaleString("tr.lst.clear") + " " + li.querySelector('span').textContent);
        li.querySelector(self.Const.Selector.DRAW).setAttribute('title', li.getAttribute('title'));

        if (!self.loadingState) {
            delete self.toShare;
        }
    };

    ctlProto.getSelectedTrack = function () {
        var self = this;

        return self.track.trackList.querySelector('li.' + self.Const.Classes.SELECTEDTRACK);
    };

    ctlProto.clearSelectedTrack = function () {
        const self = this;

        const selected = self.getSelectedTrack();
        if (selected) {

            if (self.onResize) {
                window.removeEventListener('resize', self.onResize, false);
                self.onResize = undefined;
            }

            selected.classList.remove(self.Const.Classes.SELECTEDTRACK);
            selected.setAttribute('title', selected.textContent);
            selected.querySelector(self.Const.Selector.DRAW).setAttribute('title', selected.getAttribute('title'));

            delete self.toShare;
        }
    };

    ctlProto.clearSelection = function () {
        var self = this;
        self.wrap.deactivateSnapping();
        var selected = self.getSelectedTrack();
        if (selected) {
            self.clearSelectedTrack();
        }
        if (self.resultsPanelChart) {

            self.resultsPanelChart.div.removeEventListener('mouseover', self.resultsPanelChart.deactivateSnapping);
            self.resultsPanelChart.div.removeEventListener('mouseout', self.resultsPanelChart.activateSnapping);

            self.resultsPanelChart.close();
        }

        self.clear(self.Const.Layers.TRACK);
    };

    ctlProto.drawTrackingData = function (li) {
        const self = this;

        return new Promise(function (resolve, reject) {
            self.wrap.clear();

            self.getTrackingData(li).then(function (track) {
                var data = track.data;
                if (track.data)
                    self.wrap.drawTrackingData(track).then(function () {
                        var showFeatures = self.layerTrack.features;
                        if (showFeatures && showFeatures.length > 0) {

                            var coordinates = showFeatures.filter(function (feature) {
                                feature.showsPopup = false;
                                if (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline) {
                                    return true;
                                } else if (feature instanceof TC.feature.Polyline) {
                                    return true;
                                }
                                return false;
                            }).map(function (feature) {
                                if (TC.feature.MultiPolyline && feature instanceof TC.feature.MultiPolyline) {
                                    return feature.geometry[0];
                                } else if (feature instanceof TC.feature.Polyline) {
                                    return feature.geometry;
                                }
                            })[0];

                            if (coordinates) {
                                var first = coordinates[0];
                                var last = coordinates[coordinates.length - 1];

                                if (first && !(first === last)) {
                                    self.layerTrack.addMarker(first.slice().splice(0, 2), {
                                        showsPopup: false, cssClass: self.CLASS + '-track-marker-icon-end', anchor: [0.5, 1], notExport: true
                                    });
                                }

                                if (last) {
                                    self.layerTrack.addMarker(last.slice().splice(0, 2), {
                                        showsPopup: false, cssClass: self.CLASS + '-track-marker-icon', anchor: [0.5, 1], notExport: true
                                    });
                                }
                            }
                        }
                        self.layerTrack.setVisibility(true);
                        resolve();
                    });
            });
        });
    };

    ctlProto.getTrackingData = function (li) {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.getAvailableTracks().then(function (tracks) {
                if (tracks) {
                    const dataId = li.dataset.id;
                    if (tracks[dataId]) {
                        var track = tracks[dataId].data;

                        // GLS: tengo que transformar de 4326 al crs del mapa en el momento de pintar, porque si lo hacemos al cargar la lista
                        // y después hay cambio de crs, en el momento de pintar no sé desde qué crs debo tranformar
                        track = self.wrap.formattedFromStorage(track);

                        resolve({ data: track, layout: tracks[dataId].layout });
                    }
                } else {
                    resolve();
                }
            });
        });
    };

    ctlProto.export = function (li) {
        var self = this;
        return self.wrap.export(li);
    };


    ctlProto.clearFileInput = function (fileInput) {
        const form = document.createElement('form');
        const parent = fileInput.parentElement;
        parent.insertBefore(form, fileInput);
        form.appendChild(fileInput);
        form.reset();
        // Desenvolvemos el input del form
        form.insertAdjacentElement('afterend', fileInput);
        parent.removeChild(form);
    };

    ctlProto.getLoadingIndicator = function () {
        var self = this;

        if (!self.loading) {
            self.loading = self.map.getControlsByClass(TC.control.LoadingIndicator);
            if (self.loading && self.loading.length > 0)
                self.loading = self.loading[0];
        }

        return self.loading;
    };

    ctlProto.onGeolocateError = function (error) {
        var self = this;

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

        self.map.toast(errorMsg, { type: TC.Consts.msgType.WARNING });

        if (!self.geopositionTracking && self.track) {
            self.track.activateButton.classList.remove(TC.Consts.classes.HIDDEN);
            self.track.deactivateButton.classList.add(TC.Consts.classes.HIDDEN);
        }
    };

    var _isEmpty = function (obj) {
        return !obj || obj.length === 0;
    };

    ctlProto.exportState = function () {
        const self = this;

        if (self.layerTrack && self.track || self.toShare) {
            let state = {
                id: self.id
            };
            if (!self.toShare || self.toShare && !self.toShare.doZoom) { // caso compartir general                
                self.toShare = { doZoom: false };
                let clonedToShare = Object.assign({}, self.toShare);
                let features = self.layerTrack.features;

                if (features.length > 0 && self.featuresToShare && self.featuresToShare.length > 0) {
                    clonedToShare.features = self.featuresToShare;
                } else {
                    const layerState = self.layerTrack.exportState({
                        features: features
                    });

                    clonedToShare.features = layerState.features;
                }

                const selectedTrack = self.getSelectedTrack();
                if (selectedTrack) {
                    clonedToShare.trackName = selectedTrack.querySelector('span').innerHTML;
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
    };

    ctlProto.importState = function (state) {
        const self = this;
        if (self.map) {
            if (state.trackResult && state.trackResult.length) {
                self.enable();
                let sharedTrackResult = JSON.parse(state.trackResult);

                if (sharedTrackResult.features && sharedTrackResult.features.length > 0) {
                    const promises = new Array(sharedTrackResult.features.length);
                    sharedTrackResult.features.forEach(function (f, idx) {
                        const featureOptions = { data: f.data, id: f.id, showsPopup: f.showsPopup };
                        var addFn;
                        var geom = f.geom; // El redondeo hace que ya no podamos validar con los tracks existentes.
                        switch (f.type) {
                            case TC.Consts.geom.POLYLINE:
                                promises[idx] = new TC.feature.Polyline(geom, featureOptions);
                                break;
                            case TC.Consts.geom.MULTIPOLYLINE:
                                promises[idx] = new TC.feature.MultiPolyline(geom, featureOptions);
                                break;
                            case TC.Consts.geom.MARKER:
                                promises[idx] = new TC.feature.Marker(geom, featureOptions);
                                break;
                            case TC.Consts.geom.POINT:
                                promises[idx] = new TC.feature.Point(geom, featureOptions);
                                break;
                        }
                    });

                    if (sharedTrackResult.hasOwnProperty("doZoom")) {
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
    };
})();
import GeoJSON from '../../lib/ol/format/GeoJSON.js';
import MapBrowserEventType from 'ol/MapBrowserEventType.js';
import RenderEventType from 'ol/render/EventType.js';
import OlFeature from 'ol/Feature.js';
import { Point, LineString, MultiLineString } from 'ol/geom.js';
import { getVectorContext } from 'ol/render.js';
import { Fill, Stroke } from 'ol/style.js';
import Overlay from 'ol/Overlay.js';
import { unByKey } from 'ol/Observable.js';

import ControlWrapper from '../wrap/Control.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import Feature from '../../SITNA/feature/Feature.js';
import Polyline from '../../SITNA/feature/Polyline.js';

const POINTERMOVE = MapBrowserEventType.POINTERMOVE;
const SINGLECLICK = MapBrowserEventType.SINGLECLICK;
const POSTRENDER = RenderEventType.POSTRENDER;

const getGeotrackingLine = function () {
    return this.parent.geotrackingLayer.features.find((f) => f instanceof Polyline);
};

const segmentsUnion = function (lineStrings) {
    var mergedIndex = [];
    var coords = [];
    if (lineStrings.length > 1) {

        if (lineStrings[0].length === 4) {
            lineStrings = lineStrings.sort(function (a, b) {
                if (a[0][3] == b[0][3])
                    return 0;
                else if (a[0][3] < b[0][3])
                    return -1;
                else return 1;
            });
        }

        for (var ls = 0; ls < lineStrings.length; ls++) {
            var lineString = lineStrings[ls];
            var nextLineIndex = -1;
            var distance = Infinity;

            var last = lineString.getLastCoordinate();
            for (var nls = ls + 1; nls < lineStrings.length; nls++) {
                var first = lineStrings[nls].getFirstCoordinate();
                var d = Math.hypot(last[0] - first[0], last[1] - first[1]);
                if (d < distance) {
                    nextLineIndex = nls;
                    distance = d;
                }
            }

            if (mergedIndex.length < lineStrings.length) {
                if (mergedIndex.indexOf(ls) === -1) {
                    mergedIndex.push(ls);
                    coords = coords.concat(lineString.getCoordinates());
                }
                if (mergedIndex.indexOf(nextLineIndex) === -1) {
                    mergedIndex.push(nextLineIndex);
                    coords = coords.concat(lineStrings[nextLineIndex].getCoordinates());
                }
            }
        }

        //self.map.toast(self.parent.getLocaleString("geo.trk.simulateWarning"), { type: Consts.msgType.WARNING });

        return coords;
    }

    return lineStrings[0].getCoordinates();
};

var idRequestAnimationFrame;


export default class GeolocationWrapper extends ControlWrapper {

    #snapTrigger;
    #postrenderTrigger;

    register(map) {
        this.map = map;

        this.#snapTrigger = (e) => {
            if (e.dragging) {
                return;
            }
            this.initSnap(this.olMap.getEventCoordinate(e.originalEvent), e.pixel);
        };

        this.#postrenderTrigger = (e) => {
            this.duringTrackSnap(e);
        };

        map.wrap.getMap().then((olMap) => {
            this.olMap = olMap;
        });
    }

    hasCoordinates() {
        return this.parent.geotrackingLayer.features.length > 0 && this.parent.geotrackingLayer.features[0].geometry.length >= 1;
    }

    addWaypoint(position, properties) {
        var waypoint = new OlFeature({
            geometry: new Point([position[0], position[1], properties.ele, properties.time], 'XYZM')
        });
        waypoint.setProperties(properties);

        this.parent.geotrackingLayer.wrap.layer.getSource().addFeature(waypoint);
    }

    addPosition(position, heading, m, speed, _accuracy, _altitudeAccuracy, altitude) {
        const [x, y] = position;

        var line = getGeotrackingLine.call(this);
        if (this.parent.geotrackingLayer.features && line) {
            var last = line.geometry.length > 0 && line.geometry.at(-1);
            if (last && last.length === 0) {
                this.parent.geotrackingLayer.features[0].geometry.push([x, y, altitude, m]);
                line.wrap.feature.getGeometry().appendCoordinate([x, y, altitude, m]);
            }
            else {
                var lx = last[0];
                var ly = last[1];

                if (x !== lx || y !== ly) {
                    this.parent.geotrackingLayer.features[0].geometry.push([x, y, altitude, m]);
                    line.wrap.feature.getGeometry().appendCoordinate([x, y, altitude, m]);
                }
            }

            Util.storage.setSessionLocalValue(this.parent.const.localStorageKey.GEOTRACKINGTEMP, this.formattedToStorage(this.parent.geotrackingLayer).features);
        }

        this.parent.trigger(this.parent.const.event.STATEUPDATED, {
            moving: (heading != undefined && speed != undefined && speed > 0 && heading > 0)
        });
    }

    async positionChangehandler(geoposition) {
        var accuracy, heading, speed, altitude, altitudeAccuracy;

        if (!getGeotrackingLine.call(this)) {
            this.parent.setGeotracking(false);
        }

        if (geoposition && geoposition.coords) {
            this.parent.gpsLayer.clearFeatures();

            accuracy = geoposition.coords.accuracy / this.parent.map.getMetersPerUnit() || 0;
            heading = geoposition.coords.heading || geoposition[2] || 0;
            speed = geoposition.coords.speed ? geoposition.coords.speed * 3.6 : 0;
            altitude = geoposition.coords.altitude;
            altitudeAccuracy = geoposition.coords.altitudeAccuracy || 0;

            if (this.parent.geotrackingLayer) {
                var position_ = [geoposition.coords && geoposition.coords.longitude || geoposition[0], geoposition.coords && geoposition.coords.latitude || geoposition[1]];
                if (!position_.every(c => c)) { // al menos desde las herramientas de desarrollo puede llegar con lat/lon a undefined lo que provoca un error de OL: TypeError: coordinates must be finite numbers
                    return null;
                }
                var projectedPosition = Util.reproject(position_, 'EPSG:4326', this.parent.map.crs);

                this.addPosition(projectedPosition, heading, new Date().getTime(), speed, accuracy, altitudeAccuracy, altitude);

                var coords = getGeotrackingLine.call(this).geometry;
                var len = coords.length;
                if (len >= 2) {
                    this.parent.deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
                }

                this.parent.trigger(this.parent.const.event.POSITIONCHANGE, {
                    pd: {
                        "position": projectedPosition,
                        "altitude": altitude,
                        "accuracy": accuracy,
                        "heading": Util.radToDeg(heading),
                        "speed": speed
                    }
                });

                const [marker, accuracyCircle] = await Promise.all([
                    this.parent.gpsLayer.addPoint(projectedPosition,
                        { ...this.parent.styles.locationPoint, showsPopup: false }),
                    this.parent.gpsLayer.addCircle({ center: projectedPosition, radius: accuracy },
                        { ...this.parent.styles.accuracyCircle, showsPopup: false })
                ]);
                this.parent.geotrackingPosition = true;

                if (this.parent.firstPosition == false) {
                    this.parent.firstPosition = true;

                    if (this.parent.centerOnLocationButton) {
                        this.parent.centerOnLocationButton.classList.add(Consts.classes.HIDDEN);
                    }
                    if (!this.parent.trackCenterButton) {
                        this.parent.trackCenterButton = this.parent.div.querySelector('.' + this.parent.CLASS + '-track-center');
                        this.parent.trackCenterButton.classList.add('tc-ctl');
                        this.parent.trackCenterButton.querySelector('sitna-button').addEventListener('click', (e) => {
                            if (e.currentTarget.classList.contains(Consts.classes.LOCKED)) {
                                this.parent.setFollowing(false);
                                return;
                            }
                            this.parent.setFollowing(true);
                            this.parent.moveTo(this.parent.gpsLayer.features[0].geometry);
                            //this.parent.moveTo(this.parent.gpsLayer.features);
                            /*this.parent.gpsLayer.map.setCenter(this.parent.layerGPS.features[0].geometry, { animate: false }).then(function () {
                                setTimeout(() => {
                                    this.parent.setFollowing(true)
                                },300);
                            });*/

                            this.parent.getTrackInfoPanel().then(function (infoPanel) {
                                if (!infoPanel.isVisible()) {
                                    infoPanel.doVisible();
                                }

                                if (infoPanel.isMinimized()) {
                                    infoPanel.maximize();
                                }
                            });
                        });

                        const controlContainer = await this.parent.getOverlayContainer();
                        controlContainer.appendChild(this.parent.trackCenterButton);
                    }
                    this.parent.trackCenterButton.classList.remove(Consts.classes.HIDDEN);
                    this.parent.setFollowing(true);
                    this.parent.moveTo(this.parent.gpsLayer.features);
                    //this.parent.gpsLayer.map.zoomToFeatures(this.parent.gpsLayer.features);
                }

                return {
                    marker: marker,
                    accuracy: accuracyCircle
                };
            }
        }

        return null;
    }

    setGeotracking(tracking) {
        var self = this;

        if (tracking) {
            self.parent.firstPosition = false;
            var sessionwaypoint = [];

            var nativeGeotrackingFeature;

            if (self.parent.geotrackingSession) {

                var JSONParser = new TC.wrap.parser.JSON();
                var features = JSONParser.parser.readFeatures(self.parent.geotrackingSession);
                if (features && self.parent.storageCrs !== self.parent.map.crs) {
                    features = features.map(function (feature) {
                        var clone = feature.clone();
                        clone.getGeometry().transform(self.parent.storageCrs, self.parent.map.crs);
                        return clone;
                    });
                }

                var coordinates = features.find(function (feature) {
                    var type = feature.getGeometry().getType().toLowerCase();
                    if (type === 'point') { sessionwaypoint.push(feature); }
                    return type === 'linestring' || type === 'multilinestring';
                }).getGeometry().getCoordinates();

                nativeGeotrackingFeature = new OlFeature({
                    geometry: new LineString(coordinates, 'XYZM'),
                    tracking: true
                });

            } else {
                nativeGeotrackingFeature = new OlFeature({
                    geometry: new LineString([], 'XYZM'),
                    tracking: true
                });
            }

            if (nativeGeotrackingFeature) {

                const tcFeature = TC.wrap.Feature.createFeature(nativeGeotrackingFeature);
                self.parent.geotrackingLayer.addFeature(tcFeature);

                if (tcFeature.geometry.length > 1) {
                    self.parent.map.zoomToFeatures(self.parent.geotrackingLayer.features);
                }

                if (sessionwaypoint.length > 0) {
                    sessionwaypoint
                        .map(waypoint => TC.wrap.Feature.createFeature(waypoint))
                        .forEach(feature => self.parent.geotrackingLayer.addFeature(feature));
                }

                self.parent.currentPositionWaiting = self.parent.getLoadingIndicator().addWait();

                if (!self.currentPositionTrk) {
                    self.currentPositionTrk = [];
                }

                var getCurrentPositionInterval;
                var getCurrentPositionRequest = 0;
                var errorTimeout = 0;
                var toast = false;
                var options = {
                    enableHighAccuracy: true, timeout: 600000
                };

                const getCurrentPosition = function getCurrentPosition(errorCallback) {
                    var id = getCurrentPositionRequest++;
                    navigator.geolocation.getCurrentPosition(
                        function (data) {
                            clearInterval(getCurrentPositionInterval);
                            self.parent.getLoadingIndicator().removeWait(self.parent.currentPositionWaiting);
                            self.positionChangehandler(data).then(function (obj) {
                                if (self.parent.geotrackingPosition == true && obj && obj.marker && obj.accuracy) {
                                    self.currentPositionTrk.push(navigator.geolocation.watchPosition(self.positionChangehandler.bind(self), self.parent.onGeolocateError.bind(self.parent), options));
                                }
                            });
                        },
                        errorCallback ? errorCallback :
                            function (error) {
                                switch (error.code) {
                                    case error.TIMEOUT:
                                        if (errorTimeout > 10) {
                                            clearInterval(getCurrentPositionInterval);
                                            self.parent.onGeolocateError.call(self.parent, error);
                                        } else {
                                            errorTimeout++;
                                            getCurrentPosition(function () {
                                                clearInterval(getCurrentPositionInterval);
                                                if (!toast) {
                                                    toast = true;
                                                    self.parent.onGeolocateError.call(self.parent, error);
                                                }
                                            });
                                        }
                                        break;
                                    default:
                                        clearInterval(getCurrentPositionInterval);
                                        self.parent.onGeolocateError.call(self.parent, error);
                                }
                            }, {
                        timeout: 5000 + id,
                        maximumAge: 10,
                        enableHighAccuracy: true
                    }
                    );
                };
                getCurrentPositionInterval = setInterval(getCurrentPosition, 1000);

                setTimeout(function () {
                    if (self.parent.geotrackingLayer && self.parent.geotrackingLayer.features && self.parent.geotrackingLayer.features.length > 0 && self.parent.geotrackingLayer.features[0].geometry.length == 0) {
                        clearInterval(getCurrentPositionInterval);

                        self.parent.getLoadingIndicator().removeWait(self.parent.currentPositionWaiting);
                        self.map.toast(self.parent.getLocaleString("geo.error.permission_denied"), {
                            type: Consts.msgType.WARNING
                        });
                        self.parent.track.activateButton.classList.remove(Consts.classes.HIDDEN);
                        self.parent.track.deactivateButton.classList.add(Consts.classes.HIDDEN);
                    }
                }, options.timeout + 1000); // Wait extra second

            }
        } else {
            self.parent.firstPosition = false;

            if (self.currentPositionTrk) {
                self.currentPositionTrk = self.currentPositionTrk instanceof Array ? self.currentPositionTrk : [self.currentPositionTrk];

                self.currentPositionTrk.forEach(function (watch) {
                    navigator.geolocation.clearWatch(watch);
                });

                self.currentPositionTrk = [];
            }

            if (self.parent.trackCenterButton) {
                self.parent.trackCenterButton.classList.add(Consts.classes.HIDDEN);
            }
            if (self.parent.centerOnLocationButton) {
                self.parent.centerOnLocationButton.classList.remove(Consts.classes.HIDDEN);
            }
        }
    }

    activateSnapping() {
        var self = this;

        if (!Util.detectMobile()) {
            self.olMap.on([POINTERMOVE, SINGLECLICK], self.#snapTrigger);
            self.parent.trackLayer.wrap.layer.on(POSTRENDER, self.#postrenderTrigger);
        }
    }

    deactivateSnapping() {
        var self = this;

        self.parent.map.wrap.getMap().then(function (olMap) {
            if (!Util.detectMobile()) {
                olMap.un([POINTERMOVE, SINGLECLICK], self.#snapTrigger);
                self.parent.trackLayer.wrap.layer.un(POSTRENDER, self.#postrenderTrigger);
            }

            if (self.snapInfo) {
                olMap.removeOverlay(self.snapInfo);
            }

            if (self.snapInfoElement) {
                self.snapInfoElement.style.display = 'none';
            }

            if (self.snapLine) {
                delete self.snapLine;
                olMap.render();
            }
        });
    }
    clear(layer) {
        if (layer) {
            layer.clearFeatures();
        }

        this.deactivateSnapping();
    }

    duringTrackSnap(e) {
        const vectorContext = getVectorContext(e);

        if (vectorContext && this.snapLine) {
            if (typeof vectorContext.setFillStrokeStyle === 'function') {
                vectorContext.setFillStrokeStyle(null, new Stroke({
                    color: 'rgba(197, 39, 55, 1)',
                    width: 1
                }));
            }

            if (typeof vectorContext.drawGeometry === 'function') {
                vectorContext.drawGeometry(this.snapLine.wrap.feature.getGeometry());
            }
        }
    }

    endSnap() {
        var self = this;

        self.parent.map.wrap.getMap().then(function (olMap) {
            /* cartel */
            if (self.snapInfo) {
                olMap.removeOverlay(self.snapInfo);
            }
            if (self.snapInfoElement) {
                self.snapInfoElement.style.display = 'none';
            }
            /* línea */
            if (self.snapLine) {
                delete self.snapLine;
            }
        });
    }

    initSnap(coordinate, eventPixel) {
        var self = this;

        if (self.parent.trackLayer) {
            var vectorSource = self.parent.trackLayer.wrap.layer.getSource();
            var closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate,
                f => {
                    const geom = f.getGeometry();
                    return geom instanceof LineString || geom instanceof MultiLineString
                });

            if (closestFeature !== null) {
                var geometry = closestFeature.getGeometry();
                var closestPoint = geometry.getClosestPoint(coordinate);

                // preparamos las Z del MDT si hay datos del MDT
                const elevationProfileControl = self.parent.elevationControl.resultsPanel.getElevationProfileControl();
                elevationProfileControl.setSecondaryElevationProfileCoordinates(geometry.getCoordinates());

                const pixel = self.parent.map.getPixelFromCoordinate(closestPoint);
                const distance = Math.sqrt(
                    Math.pow(eventPixel[0] - pixel[0], 2) +
                    Math.pow(eventPixel[1] - pixel[1], 2));

                if (distance > self.parent.snappingTolerance) {
                    self.endSnap();
                } else {
                    var coordinates = [coordinate, [closestPoint[0], closestPoint[1]]];

                    if (!self.snapLine) self.snapLine = new Polyline(coordinates, {});
                    else self.snapLine.wrap.feature.getGeometry().setCoordinates(coordinates);

                    // información del punto
                    if (!self.snapInfoElement)
                        self.snapInfoElement = document.getElementsByClassName('tc-ctl-geolocation-track-snap-info')[0];

                    self.snapInfoElement.style.display = 'block';

                    if (!self.snapInfo) {
                        self.snapInfo = new Overlay({
                            element: self.snapInfoElement,
                            offset: [5, 18]
                        });

                        self.olMap.addOverlay(self.snapInfo);
                    }

                    if (self.snapInfo.getMap() == undefined)
                        self.snapInfo.setMap(self.olMap);

                    self.snapInfo.setPosition(coordinate);

                    var data = {};
                    const geomType = closestFeature.getGeometry().getType();
                    if (geomType != "LineString" && geomType != "MultiLineString") {
                        if (closestFeature.getKeys().indexOf('name') > -1)
                            data.n = closestFeature.get('name');
                    }

                    var locale = self.parent.map.getLocale() || undefined;
                    data.x = self.map.wrap.isGeo() ? closestPoint[0].toLocaleString(locale, { minimumFractionDigits: 5 }) : Math.round(closestPoint[0]).toLocaleString(locale);
                    data.y = self.map.wrap.isGeo() ? closestPoint[1].toLocaleString(locale, { minimumFractionDigits: 5 }) : Math.round(closestPoint[1]).toLocaleString(locale);

                    if (self.map.wrap.isGeo()) {
                        data.isGeo = true;
                    }

                    var getZ = function (position) {
                        return closestPoint[position] ? (Math.round(closestPoint[position] * 100) / 100).toLocaleString(locale) : undefined;
                    };
                    var getM = function (position) {
                        return closestPoint[position] > 0 ? new Date(closestPoint[position]).toLocaleString(locale) : undefined;
                    };

                    const layout = closestFeature.getGeometry().getLayout();
                    if (layout === 'XYZM') {
                        data.z = getZ(2);
                        data.m = getM(3);
                    } else if (closestFeature.getGeometry().getLayout() === 'XYZ') {
                        data.z = getZ(2);
                    } else if (closestFeature.getGeometry().getLayout() === 'XYM') {
                        data.m = getM(2);
                    }

                    if (data) {
                        // Z del MDT si hay datos del MDT
                        if (elevationProfileControl.chartData?.secondaryElevationProfileChartData?.[0]?.coords) {
                            let mdtClosestPoint = TC.wrap.Geometry.getNearest(coordinate, elevationProfileControl.chartData.secondaryElevationProfileChartData[0].coords);
                            const mdtZ = mdtClosestPoint[2]
                            data.mdtz = (Math.round(mdtZ * 100) / 100).toLocaleString(locale);
                        }
                        self.parent.getRenderedHtml(self.parent.CLASS + '-track-snapping-node', data, function (html) {
                            self.snapInfoElement.innerHTML = html;
                        });
                    }
                }
            }
        }

        self.olMap.render();
    }

    async drawTrackData(track) {
        const JSONParser = new TC.wrap.parser.JSON();
        const features = JSONParser.parser.readFeatures(track.data);

        features.filter(function (feature) {
            return feature.getGeometry().getType().toLowerCase() === 'linestring' || feature.getGeometry().getType().toLowerCase() === 'multilinestring';
        }).forEach(function (feature) {
            feature.getGeometry().setCoordinates(feature.getGeometry().getCoordinates(), track.layout);
        });

        this.activateSnapping();

        features
            .map(f => TC.wrap.Feature.createFeature(f))
            .forEach((feat) => {
                if (feat) {
                    this.parent.trackLayer.addFeature(feat);
                }
            });
        if (!this.parent.toShare || this.parent.toShare && this.parent.toShare.doZoom) {
            this.parent.map.zoomToFeatures(this.parent.trackLayer.features);
        }
    }

    formattedFromStorage(storageData) {
        if (this.parent.storageCrs !== this.parent.map.crs) {
            const jsonFormat = new GeoJSON();
            var features = jsonFormat.readFeatures(storageData);
            if (features) {
                features = features.map((feature) => {
                    var clone = feature.clone();
                    clone.getGeometry().transform(this.parent.storageCrs, this.parent.map.crs);
                    clone.setId(feature.getId());
                    return clone;
                });

                return jsonFormat.writeFeatures(features);
            }
        }

        return storageData;
    }

    formattedToStorage(layer, removeTrackingProperty, notReproject) {
        var self = this;

        var parser = new TC.wrap.parser.JSON();
        parser = parser.parser;

        var features = layer.wrap.layer.getSource().getFeatures();
        var layout;

        features = features.map(function (feature) {
            const geometry = feature.getGeometry();
            if (geometry instanceof LineString || geometry instanceof MultiLineString) {
                layout = geometry.getLayout();
            }

            if (removeTrackingProperty && feature.getProperties().tracking) {
                feature.unset("tracking");
            }

            if (!notReproject && self.parent.map.crs !== self.parent.storageCrs) {
                var clone = feature.clone();
                clone.getGeometry().transform(self.parent.map.crs, self.parent.storageCrs);
                clone.setId(feature.getId());

                return clone;
            }

            return feature;
        }).sort(function (a, b) {

            if (a.getGeometry() instanceof Point &&
                !(b.getGeometry() instanceof Point)) {
                return -1;
            }

            if (b.getGeometry() instanceof Point &&
                !(a.getGeometry() instanceof Point)) {
                return 2;
            }

            if (a.getProperties().name < b.getProperties().name) { return -1; }
            if (a.getProperties().name > b.getProperties().name) { return 1; }

            return 0;
        });

        return {
            features: parser.writeFeatures(features), layout: layout
        };
    }

    export(li) {
        const self = this;
        return new Promise(function (resolve, reject) {

            self.parent.getTrackData(li).then(function (data) {
                if (data) {

                    const jsonFormat = new GeoJSON();
                    var olFeatures = jsonFormat.readFeatures(data.data);

                    if (olFeatures.length === 0) {
                        var geoJSON = self.parent.getTrackData(li);
                        olFeatures = jsonFormat.readFeatures(geoJSON);
                    }

                    resolve(olFeatures.map(f => TC.wrap.Feature.createFeature(f)));
                } else {
                    reject();
                }
            });
        });
    }

    async processImportedFeatures(options = {}) {
        const source = this.parent.trackLayer.wrap.layer.getSource();
        const fileName = options.fileName;
        const names = [];
        const toAdd = [];
        const toRemove = [];
        const features = options.features?.map((f) => f.wrap.feature) ?? source.getFeatures();

        const segments = [];

        const getName = function (feature) {
            const properties = feature.getProperties();
            if (Object.hasOwn(properties, "name")) {
                if (properties.name.trim().length > 0) {
                    names.push(properties.name);
                }
                else {
                    names.push(fileName);
                }
            }
            else {
                names.push(fileName);
            }
        };

        for (let feature of features) {

            if (feature instanceof Feature) {
                feature = feature.wrap.feature;
            }

            const geometry = feature.getGeometry();
            if (geometry instanceof LineString) {
                // GLS: 31/01/2018 Routes (<rte>) are converted into LineString geometries, and tracks (<trk>) into MultiLineString, por tanto, las líneas las cargamos como N Rutas, no las unimos como hasta ahora: // segments.push(feature.getGeometry());                
                getName(feature);
                const newFeature = new OlFeature({
                    geometry: new LineString(geometry.getCoordinates(), geometry.getLayout())
                });
                newFeature.setId(feature.getId() || TC.getUID());
                newFeature.setProperties(feature.getProperties());
                toAdd.push(newFeature);
                toRemove.push(feature);
            }
            else if (geometry instanceof MultiLineString) {
                var clone = feature.clone();
                getName(clone);

                var ls = clone.getGeometry().getLineStrings();

                const coords = segmentsUnion(ls);
                const newFeature = new OlFeature({
                    geometry: new LineString(coords, geometry.getLayout())
                });
                newFeature.setId(feature.getId() || TC.getUID());
                newFeature.setProperties(feature.getProperties());
                toAdd.push(newFeature);
                toRemove.push(feature);
            }
        }

        if (segments.length > 0) {
            const coords = segmentsUnion(segments);
            toAdd.push(new OlFeature({
                geometry: new LineString(coords)
            }));
        }

        for (var i = 0; i < toRemove.length; i++) {
            source.removeFeature(toRemove[i]);
        }

        for (let i = 0; i < toAdd.length; i++) {
            source.addFeature(toAdd[i]);
        }
        return names;
    }

    simulateTrackEnd(resized) {
        if (!resized) {
            // revertimos: establecemos a false para que no muestra el progreso en el perfil ya que siempre será elevación 0
            this.hasElevation = true;
        }

        this.parent.clearChartProgress();

        if (this.simulateMarker) {
            window.cancelAnimationFrame(idRequestAnimationFrame);
            if (this.simulateMarker.layer.wrap.layer.getSource().getFeatures().length > 0)
                this.simulateMarker.layer.removeFeature(this.simulateMarker);

            delete this.simulateMarker;
        }
    }

    simulateTrack() {
        var self = this;

        var coordinates;
        var features = self.parent.trackLayer.wrap.layer.getSource().getFeatures();
        for (var ls = 0; ls < features.length; ls++) {
            const geom = features[ls].getGeometry();
            if (geom instanceof LineString) {
                coordinates = features[ls].getGeometry().getCoordinates();
                break;
            }
            else if (geom instanceof MultiLineString) {
                coordinates = geom
                    .getLineStrings()
                    .map(ls => ls.getCoordinates())
                    .flat();
            }
        }

        if (coordinates && coordinates.length > 0) {
            var first = coordinates[0];

            const setSimulateMarker = async function () {
                if (self.simulateMarker) {
                    self.simulateMarker.setCoords(first.slice(0, 2));
                }
                else {
                    self.simulateMarker = await self.parent.trackLayer.addPoint(first.slice(0, 2), {
                        radius: 7,
                        fillColor: '#ff0000',
                        fillOpacity: 0.5,
                        strokeColor: '#ffffff',
                        strokeWidth: 2,
                        zIndex: 10,
                    });
                }

                return self.simulateMarker;
            };

            setSimulateMarker().then(function (_f) {

                var animationFrameFraction = function () {
                    var start;
                    var fraction;
                    var hasTime = false;

                    const toLength = function (coords) {
                        if (self.parent.map.crs !== self.parent.map.options.utmCrs) {
                            return Util.reproject(coords, self.parent.map.crs, self.parent.map.options.utmCrs);
                        }

                        return coords;
                    };

                    var arCoordinates = coordinates;
                    if (arCoordinates[0].length === 4 && arCoordinates[0][3] > 0) {
                        start = arCoordinates[0][3];
                        hasTime = true;
                    } else {
                        arCoordinates[0][3] = Date.now();

                        for (var i = 1; i < arCoordinates.length; i++) {
                            let done;
                            arCoordinates[i][3] = 0;

                            if (i + 1 < arCoordinates.length) {
                                done = new LineString(toLength(arCoordinates.slice(i - 1, i + 1))).getLength();
                            } else {
                                done = new LineString(toLength(arCoordinates.slice(i - 1))).getLength();
                            }

                            arCoordinates[i][3] = arCoordinates[i - 1][3] + 3600000 * done / self.parent.walkingSpeed;
                        }

                        start = arCoordinates[0][3];
                    }

                    var trackFilm = new LineString(arCoordinates);
                    var timestamp = start;
                    var distance = 0;

                    if (self.parent.map.crs !== self.parent.map.options.utmCrs) {
                        distance = new LineString(toLength(JSON.parse(JSON.stringify(arCoordinates)))).getLength();
                    } else {
                        distance = trackFilm.getLength();
                    }

                    var getDoneAtM = function (m) {
                        for (var i = 0; i < arCoordinates.length; i++) {
                            if (arCoordinates[i][3] > m)
                                return {
                                    d: new LineString(toLength(arCoordinates.slice(0, i))).getLength(),
                                    p: arCoordinates[i - 1].slice(0, 2)
                                };
                        }
                    };

                    var loopAtFraction = function () {

                        if (!self.parent.simulate_paused) {
                            var position = trackFilm.getCoordinateAtM(timestamp);
                            var d = getDoneAtM(timestamp);

                            if (fraction >= 1 || !position || !d) {
                                var li = self.parent.getSelectedTrackItem();
                                if (li)
                                    self.parent.uiSimulate(false, li);

                                if (self.parent.hasElevation) {
                                    self.parent.clearChartProgress();
                                }

                                self.simulateTrackEnd();

                                return;
                            } else {

                                if (self.parent.hasElevation) {
                                    self.parent.setChartProgress(d, position, distance, hasTime ? self.parent.getTimeInterval(arCoordinates[0][3], position[3]) : false);
                                }

                                if (self.simulateMarker) {
                                    //var from = self.simulateMarker.getCoords();
                                    //var to = position;
                                    //var rotation = Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI;

                                    self.simulateMarker.setCoords(position);
                                    //self.simulateMarker.setStyle({ labelRotationKey: rotation });
                                }

                                if (self.parent.simulationSpeed !== 1) {
                                    timestamp = timestamp + self.parent.delta * self.parent.simulationSpeed;
                                }
                                else {
                                    timestamp = timestamp + self.parent.delta;
                                }
                            }
                        }

                        idRequestAnimationFrame = requestAnimationFrame(loopAtFraction);
                    };
                    idRequestAnimationFrame = requestAnimationFrame(loopAtFraction);

                };

                const hasD3 = async function () {
                    if (window.d3) {
                        return true;
                    }
                    return await import('c3');
                };
                hasD3().then(function () {
                    idRequestAnimationFrame = requestAnimationFrame(animationFrameFraction);
                });
            });
        }
    }

    headingChangehandler(evt) {
        var self = this;
        if (!self.parent.track.infoOnMap) {
            self.parent.track.infoOnMap = document.createElement('div');
            const iomStyle = self.parent.track.infoOnMap.style;
            iomStyle.overFlowY = 'scroll';
            iomStyle.height = '200px';
            iomStyle.width = '200px';
            iomStyle.top = '0';
            iomStyle.left = '100px';
            iomStyle.backgroundColor = 'fuchsia';
            iomStyle.position = 'absolute';
            self.parent.map.div.appendChild(self.parent.track.infoOnMap);
        }

        self.parent.track.infoOnMap.style.display = '';

        self.heading = evt.target.getHeading();

        self.parent.track.infoOnMap.innerHTML = self.parent.track.infoOnMap.innerHTML +
            '<br> <p> salta headingChangehandler </p> <br> <p> evt.target.getHeading(): ' + self.heading + ' </p>';



        self.map.wrap.getMap().then(function (map) {
            map.getView().setRotation(-self.heading);
        });

        self.parent.trigger(self.parent.const.event.STATEUPDATED, {
            moving: (self.heading != undefined && self.heading > 0)
        });
    }

    orientationChangehandler(event) {
        var view = this.map.wrap.map.getView();
        var center = view.getCenter();
        var resolution = view.getResolution();
        var beta = event.target.getBeta() || 0;
        var gamma = event.target.getGamma() || 0;

        center[0] -= resolution * gamma * 25;
        center[1] += resolution * beta * 25;

        view.setCenter(view.constrainCenter(center));

        this.parent.trigger(this.parent.const.event.STATEUPDATED, {
            moving: (this.heading != undefined && this.heading > 0)
        });
    }

    pulsate(circle) {
        this.pulsated = true;

        var radius = circle.wrap.feature.getGeometry().getRadius();
        var start = new Date().getTime();

        var duration = 500;
        var listenerKey;

        var getRadius = function (elapsed) {
            switch (true) {
                case elapsed <= 50:
                    return radius;
                case elapsed > 50 && elapsed <= 100:
                    return radius * 1.02;
                case elapsed > 100 && elapsed <= 150:
                    return radius * 1.05;
                case elapsed > 150 && elapsed <= 200:
                    return radius * 1.02;
                case elapsed > 200 && elapsed <= 300:
                    return radius;
                case elapsed > 300 && elapsed <= 350:
                    return radius * 1.02;
                case elapsed > 350 && elapsed <= 400:
                    return radius * 1.05;
                case elapsed > 400 && elapsed <= 450:
                    return radius * 1.02;
                case elapsed > 450 && elapsed <= 500:
                    return radius * 1;
                default:
                    return radius;
            }
        };
        listenerKey = this.olMap.on(POSTRENDER, function (event) {
            var vectorContext = event.vectorContext;
            var frameState = event.frameState;

            var elapsed = frameState.time - start;

            var f = circle.wrap.feature.getGeometry().clone();
            var r = getRadius(elapsed);
            f.setRadius(r);

            vectorContext.setFillStrokeStyle(
                new Fill({
                    color: 'rgba(0, 0, 0, 0.1)'
                }),
                new Stroke({
                    color: 'rgba(255, 0, 0, .8)', width: 1
                })
            );
            vectorContext.drawCircleGeometry(f);

            if (elapsed > duration) {
                unByKey(listenerKey);
                return;
            }

            frameState.animate = true;
        });
    }

    readGeoJson(data) {
        return new GeoJSON().readFeatures(data);
    }

    writeGeoJson(features) {
        return new GeoJSON().writeFeatures(features);
    }
}

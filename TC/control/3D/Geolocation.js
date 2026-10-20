import Control from './Control.js';
import Consts from '../../Consts.js';
import Polyline from '../../../SITNA/feature/Polyline.js';
import MultiPolyline from '../../../SITNA/feature/MultiPolyline.js';
import Util from '../../Util.js';
// Funciones CZML    
const toCZML = function (coordinates, layout, name, pointStyle, _lineStyle, walkingSpeed) {
    const self = this;

    return new Promise(function (resolve, _reject) {
        var positions = coordinates.map(function (coordinate) {
            var reprojected = coordinate;
            if (self.view3D.view2DCRS !== self.view3D.crs) {
                reprojected = Util.reproject(coordinate, self.view3D.view2DCRS, self.view3D.crs);
            }
            return cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1]);
        });
        //cesium.sampleTerrainMostDetailed(self.viewer.terrainProvider, positions).then(function (updatedPositions) {
        const updatedPositions = positions;
        var startTime, stopTime, totalDistance = 0;

        if (layout === 'XYZM') {
            startTime = coordinates[0][3];
            stopTime = coordinates[coordinates.length - 1][3];
        } else if (layout === 'XYM') {
            startTime = coordinates[0][2];
            stopTime = coordinates[coordinates.length - 1][2];
        } else {

            coordinates[0][3] = updatedPositions[0].time = Date.now();

            for (var i = 1; i < updatedPositions.length; i++) {
                var done;
                let previous_next = [];

                updatedPositions[i].time = 0;

                if (i + 1 < updatedPositions.length) {
                    previous_next = updatedPositions.slice(i - 1, i + 1);
                } else {
                    previous_next = updatedPositions.slice(i - 1);
                }

                done = new cesium.EllipsoidGeodesic(previous_next[0], previous_next[1]).surfaceDistance;

                totalDistance += done;

                coordinates[i][3] = updatedPositions[i].time = updatedPositions[i - 1].time + (3600000 * done / walkingSpeed);
            }

            startTime = updatedPositions[0].time;
            stopTime = updatedPositions[updatedPositions.length - 1].time;
        }

        if (totalDistance === 0) {
            for (var j = 1; j < updatedPositions.length; j++) {
                let previous_next = [];

                if (j + 1 < updatedPositions.length) {
                    previous_next = updatedPositions.slice(j - 1, j + 1);
                } else {
                    previous_next = updatedPositions.slice(j - 1);
                }

                totalDistance += new cesium.EllipsoidGeodesic(previous_next[0], previous_next[1]).surfaceDistance;
            }
        }

        startTime = new Date(startTime).toISOString();
        stopTime = new Date(stopTime).toISOString();

        var czml = [{
            "id": "document",
            "name": "CZML Model",
            "version": "1.0"
        }, {
            "id": "path",
            "name": name,
            "heightReference": "CLAMP_TO_GROUND",
            "availability": startTime + "/" + stopTime,
            "position": {
                "epoch": startTime,
                "cartographicRadians": updatedPositions.map(function (updatedPosition, i) {
                    return layout === 'XYZM' ? [new Date(coordinates[i][3]).toISOString(), updatedPosition.longitude, updatedPosition.latitude, updatedPosition.height] :
                        layout === 'XYM' ? [new Date(coordinates[i][2]).toISOString(), updatedPosition.longitude, updatedPosition.latitude, updatedPosition.height] :
                            [new Date(updatedPosition.time).toISOString(), updatedPosition.longitude, updatedPosition.latitude, updatedPosition.height];
                }).reduce(function (prev, curr) {
                    return prev.concat(curr);
                })
            },
            "point": {
                "heightReference": "CLAMP_TO_GROUND",
                "pixelSize": pointStyle.radius,
                "color": {
                    "rgba": pointStyle.fillColor
                },
                "outlineColor": {
                    "rgba": pointStyle.strokeColor
                },
                "outlineWidth": pointStyle.strokeWidth,
            }
        }];

        resolve({ czml: czml, totalDistance: totalDistance, coordinates2D: coordinates });
        //});
    });
};



export default class Geolocation extends Control {
    #oldSimulateTrackMethod;
    #oldDisplayTrackProfileMethod;
    
        
    constructor(options) {
        super(options.map.viewer);
        this.map = options.map;
        this.twoDControl = options.twoDControl;
        this.map.view3D.linked2DControls[this.twoDControl.id] = this;
        if (this.twoDControl.clickControl) {
            this.map.view3D.linked2DControls[this.twoDControl.clickControl.id] = this;
        }
        this.#oldSimulateTrackMethod = this.twoDControl.simulateTrack;
        var simulationOnPreUpdate; // listener de la simulación        
        const twoDControl = this.twoDControl;
        this.twoDControl.simulateTrack = function (li) {
            var self = twoDControl;
            self.map.toast(self.getLocaleString('threed.interactionSimulation'), { type: Consts.msgType.INFO });

            // tenemos una simulación activa
            if (this.viewer.clock.shouldAnimate && this.view3D.trackDataSource) {
                simulationOnPreUpdate();
                //geolocation_videoControls.call(this, { target: { className: 'stop' }, custom: true });
            }

            self.simulationSpeed = 1;

            self.wrap.simulateTrack();

            if (self.trackLayer && self.trackLayer.features) {
                var track = self.trackLayer.features.find(function (feature) {
                    return feature instanceof Polyline || feature instanceof MultiPolyline;
                });

                if (track) {
                    toCZML.call(this, track instanceof Polyline ? track.geometry : track.geometry[0], track.wrap.feature.getGeometry().layout, "track", self.markerStyle, self.lineStyle, self.walkingSpeed).then(function (result) {
                        var czml = result.czml, totalDistance = result.totalDistance, coordinates2D = result.coordinates2D;
                        this.view3D.trackDataSource = new cesium.DataSourceCollection();
                        var dataSourceDisplay = new cesium.DataSourceDisplay({
                            scene: this.viewer.scene,
                            dataSourceCollection: this.view3D.trackDataSource
                        });

                        this.viewer.scene.preRender.addEventListener(function (scene, time) {
                            dataSourceDisplay.update(time);
                        });

                        this.view3D.trackDataSource.add(cesium.CzmlDataSource.load(czml)).then(function (layout, coordinates2D, czmlDataSource) {

                            this.viewer.clock.shouldAnimate = false;

                            var start, stop;
                            start = czmlDataSource.clock.startTime;
                            stop = czmlDataSource.clock.stopTime;
                            this.viewer.clock.startTime = start.clone();
                            this.viewer.clock.stopTime = stop.clone();
                            this.viewer.clock.currentTime = start.clone();
                            this.viewer.clock.clockStep = cesium.ClockStep.TICK_DEPENDENT
                            this.viewer.clock.clockRange = cesium.ClockRange.CLAMPED;
                            this.viewer.clock.multiplier = 1;

                            var trackEntity = czmlDataSource.entities.values[0];

                            trackEntity.layout = layout;

                            trackEntity.tagLI = li; // tengo que guardar la relación con el HTML porque puede eliminar la selección del track mientras estamos creando la simulación del mismo, y no tengo forma de validarlo

                            trackEntity.availability = new cesium.TimeIntervalCollection([new cesium.TimeInterval({
                                start: start,
                                stop: stop
                            })]);
                            if (this.viewer.trackedEntity) {
                                this.viewer.entities.removeById(this.viewer.trackedEntity.id);
                                this.viewer.trackedEntity = null;
                            }
                            //this.viewer.entities.removeById(this.viewer.trackedEntity?.id);
                            this.viewer.entities.add(trackEntity);

                            this.viewer.zoomTo(trackEntity).then(function () {

                                this.viewer.trackedEntity = trackEntity;
                                //this.viewer.trackedEntity.viewFrom = new cesium.Cartesian3(0, 0, 3000);

                                function get2DHeightAtProgress(coordinates2D, distanceCurrent) {
                                    var coordinate;

                                    var doneDistance = 0;

                                    var reprojected = this.view3D.view2DCRS !== this.view3D.crs ? Util.reproject(coordinates2D[0], this.view3D.view2DCRS, this.view3D.crs) : coordinates2D[0];
                                    var previous = cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1]);

                                    for (var i = 1; i < coordinates2D.length; i++) {
                                        reprojected = this.view3D.view2DCRS !== this.view3D.crs ? Util.reproject(coordinates2D[i], this.view3D.view2DCRS, this.view3D.crs) : coordinates2D[i];
                                        var current = cesium.Cartographic.fromDegrees(reprojected[0], reprojected[1]);

                                        doneDistance += new cesium.EllipsoidGeodesic(previous, current).surfaceDistance;
                                        previous = current;

                                        if (doneDistance > distanceCurrent) {
                                            coordinate = coordinates2D[i - 1];
                                            break;
                                        }
                                    }

                                    if (coordinate) {
                                        var heightIndex = trackEntity.layout === 'XYZM' ? 2 :
                                            trackEntity.layout === 'XYZ' ? 2 : -1;
                                        if (heightIndex > -1) {
                                            return coordinate[heightIndex];
                                        }
                                    }

                                    return 0;
                                }

                                var previousPosition, distanceCurrent = 0;
                                simulationOnPreUpdate = this.viewer.scene.preUpdate.addEventListener(function (scene, currentTime) {
                                    // mientras estamos preparando la simulación ha eliminado la selección de dicho track
                                    const selectedTrackItem = this.view3D.linked2DControls.geolocation.getSelectedTrackItem();
                                    if (!selectedTrackItem || selectedTrackItem.getAttribute('data-id') !== trackEntity.tagLI.getAttribute('data-id')
                                        ||
                                        // o hemos llegado al final
                                        cesium.JulianDate.greaterThanOrEquals(currentTime, trackEntity.availability.stop)
                                    ) {

                                        simulationOnPreUpdate();
                                        //geolocation_videoControls.call(this, { target: { className: 'stop' }, custom: true });

                                    } else if (this.viewer.clock.shouldAnimate && trackEntity.isAvailable(currentTime)) {

                                        // gestionamos las posiciones anterior y actual
                                        if (!previousPosition) {
                                            previousPosition = cesium.Cartographic.fromCartesian(cesium.Property.getValueOrUndefined(trackEntity.position, trackEntity.availability.start));
                                        }
                                        const currentPosition = cesium.Cartographic.fromCartesian(cesium.Property.getValueOrUndefined(trackEntity.position, currentTime));

                                        // progreso en el perfil (si lo hay)
                                        if (this.view3D.linked2DControls.geolocation.hasElevation) {
                                            this.view3D.linked2DControls.geolocation.setChartProgress({
                                                p: [previousPosition.longitude, previousPosition.latitude, previousPosition.height],
                                                d: distanceCurrent
                                            },
                                                [currentPosition.longitude, currentPosition.latitude, get2DHeightAtProgress.call(this, coordinates2D, distanceCurrent)],
                                                totalDistance, (trackEntity.layout === 'XYZM' ||
                                                    trackEntity.layout === 'XYM' ?
                                                    this.view3D.linked2DControls.geolocation.getTimeInterval(cesium.JulianDate.toDate(trackEntity.availability.start), cesium.JulianDate.toDate(currentTime)) : false));
                                        }

                                        // gestionamos las posiciones anterior y actual y la distancia
                                        distanceCurrent += new cesium.EllipsoidGeodesic(previousPosition, currentPosition).surfaceDistance;
                                        previousPosition = currentPosition;
                                    }
                                }.bind(this));
                                this.viewer.clock.shouldAnimate = true;

                            }.bind(this));

                        }.bind(this, track.wrap.feature.getGeometry().layout, coordinates2D));
                    }.bind(this));
                }
            }

        }.bind(this.map);
        
        const viewer = options.map.viewer;
        const view3D = this.map.view3D;

        const stopEvent = this.stopEvent = function () {
            //const viewer = this.map.view3D.viewer;
            //const view3D = this.map.view3D;
            viewer.clock.shouldAnimate = false;
            const currentTime = cesium.JulianDate.fromDate(new Date());
            currentTime.secondsOfDay = isNaN(currentTime.secondsOfDay) ? 0 : currentTime.secondsOfDay;
            viewer.clock.currentTime = currentTime;

            if (view3D.trackDataSource) {
                if (view3D.trackDataSource.length > 0) {
                    view3D.trackDataSource.get(0).entities.removeAll();
                    //self.viewer.entities.removeById(entity.id);
                }
                view3D.trackDataSource.show = false;
                view3D.trackDataSource.destroy();
                delete view3D.trackDataSource;
                view3D.viewer.entities.remove(view3D.viewer.trackedEntity);
                delete view3D.viewer.trackedEntity;
            }
            twoDControl.clearChartProgress();
        }
        const pauseEvent = this.pauseEvent = function () {
            viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate;
        }

        const setSpeedEvent = this.setSpeedEvent = function () {
            viewer.clock.multiplier = twoDControl.simulationSpeed;
        }

        this.twoDControl.addEventListener(this.twoDControl.const.event.STOP, stopEvent);
        this.twoDControl.addEventListener(this.twoDControl.const.event.PAUSE, pauseEvent);
        this.twoDControl.addEventListener(this.twoDControl.const.event.BACKWARD, setSpeedEvent);
        this.twoDControl.addEventListener(this.twoDControl.const.event.FORWARD, setSpeedEvent);
        this.twoDControl.addEventListener(this.twoDControl.const.event.VISIBILITY, function (e) {
            view3D.dataSources.get(twoDControl.trackLayer).show = e.detail;
            view3D.dataSources.get(twoDControl.endPointLayer).show = e.detail;
            if (view3D.viewer.trackedEntity)
                view3D.viewer.trackedEntity.show = e.detail;
            //view3D.trackDataSource.show = twoDControl.trackLayer.getVisibility();
        });
    }
    reset() { 
        this.twoDControl.simulateTrack = this.#oldSimulateTrackMethod;
        this.twoDControl.removeEventListener(this.twoDControl.const.event.STOP, this.stopEvent);
        this.twoDControl.removeEventListener(this.twoDControl.const.event.PAUSE, this.pauseEvent);
        this.twoDControl.removeEventListener(this.twoDControl.const.event.BACKWARD, this.setSpeedEvent);
        this.twoDControl.removeEventListener(this.twoDControl.const.event.FORWARD, this.setSpeedEvent);
        
    }
}